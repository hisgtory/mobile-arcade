use std::time::{Duration, Instant};

use axum::extract::State;
use axum::Json;
use serde::{Deserialize, Serialize};

use crate::error::ApiError;
use crate::jf::solver::{is_solvable, SolveResult, SolverCaps};
use crate::jf::types::{TileData, MAX_OBJECTS, MAX_SLOT, MAX_STAGE};
use crate::state::AppState;

const MAX_DURATION_SEC: u32 = 86_400; // 1 day
const MAX_USER_ID_LEN: usize = 64;
const MAX_TILES_LEN: usize = 2_000;
const SOLVER_DEADLINE: Duration = Duration::from_millis(400);
const SOLVER_MAX_ITERS: u64 = 50_000;
const INGEST_VARIANT_THRESHOLD: usize = 5; // 풀에 5개 미만일 때만 client tile 수용

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Request {
    pub stage: u32,
    pub duration_sec: u32,
    pub user_id: String,
    pub tiles: Option<Vec<TileSubmission>>,
    pub objects: Option<u32>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TileSubmission {
    pub id: String,
    pub object_id: u32,
    pub col: f32,
    pub row: f32,
    pub layer: u32,
}

impl From<TileSubmission> for TileData {
    fn from(t: TileSubmission) -> Self {
        Self {
            id: t.id,
            object_id: t.object_id,
            col: t.col,
            row: t.row,
            layer: t.layer,
        }
    }
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Response {
    pub top_percent: f32,
    pub clear_ordinal: u64,
    pub total_clears: u64,
    pub variant_accepted: bool,
}

pub async fn handle(
    State(state): State<AppState>,
    Json(req): Json<Request>,
) -> Result<Json<Response>, ApiError> {
    if req.stage < 1 || req.stage > MAX_STAGE {
        return Err(ApiError::StageOutOfRange(req.stage));
    }
    if req.duration_sec < 1 || req.duration_sec > MAX_DURATION_SEC {
        return Err(ApiError::BadRequest("durationSec out of range"));
    }
    if req.user_id.is_empty() || req.user_id.len() > MAX_USER_ID_LEN {
        return Err(ApiError::BadRequest("userId length invalid"));
    }
    if let Some(t) = &req.tiles {
        if t.is_empty() || t.len() > MAX_TILES_LEN {
            return Err(ApiError::BadRequest("tiles length invalid"));
        }
    }

    // 1) (선택) 클라가 보낸 tiles를 풀이 비어있으면 검증 후 저장
    let variant_accepted = if let Some(submitted) = req.tiles {
        try_ingest_tiles(&state, req.stage, req.objects, submitted).await
    } else {
        false
    };

    // 2) 어그리게이트 atomic update + audit log (병렬)
    let (agg_res, _log_res) = tokio::join!(
        state.variants.record_clear(req.stage, req.duration_sec),
        state.variants.put_clear_log(req.stage, &req.user_id, req.duration_sec),
    );
    let agg = agg_res?;

    Ok(Json(Response {
        top_percent: agg.top_percent(),
        clear_ordinal: agg.total_clears,
        total_clears: agg.total_clears,
        variant_accepted,
    }))
}

async fn try_ingest_tiles(
    state: &AppState,
    stage: u32,
    objects_opt: Option<u32>,
    submitted: Vec<TileSubmission>,
) -> bool {
    let tiles: Vec<TileData> = submitted.into_iter().map(TileData::from).collect();

    // objects 추론: 명시값 또는 max(object_id)+1
    let objects = match objects_opt {
        Some(o) => o,
        None => tiles.iter().map(|t| t.object_id).max().unwrap_or(0) + 1,
    };
    if objects < 1 || objects > MAX_OBJECTS {
        tracing::debug!(stage, objects, "ingest skipped: objects out of range");
        return false;
    }

    // 이미 풀에 충분히 있으면 skip
    let existing = match state.variants.list_recent(stage, objects).await {
        Ok(v) => v,
        Err(e) => {
            tracing::warn!(stage, objects, error = %e, "ingest list_recent failed");
            return false;
        }
    };
    if existing.len() >= INGEST_VARIANT_THRESHOLD {
        tracing::debug!(stage, objects, count = existing.len(), "ingest skipped: pool warm");
        return false;
    }

    // 솔버 검증
    let caps = SolverCaps {
        max_iters: SOLVER_MAX_ITERS,
        deadline: Instant::now() + SOLVER_DEADLINE,
    };
    let (verdict, stats) = is_solvable(&tiles, MAX_SLOT, &caps);
    if verdict != SolveResult::Solvable {
        tracing::info!(stage, objects, ?verdict, iters = stats.iters, "ingest rejected (not solvable)");
        return false;
    }

    match state
        .variants
        .put(stage, objects, &tiles, 0, stats.iters)
        .await
    {
        Ok(v) => {
            tracing::info!(stage, objects, sk = %v.sk, "ingested client variant");
            true
        }
        Err(e) => {
            tracing::warn!(stage, objects, error = %e, "ingest put failed");
            false
        }
    }
}
