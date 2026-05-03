use std::time::{Duration, Instant};

use axum::extract::State;
use axum::Json;
use serde::{Deserialize, Serialize};

use crate::error::ApiError;
use crate::jf::board::generate_board;
use crate::jf::repo::Variant;
use crate::jf::rng::from_entropy;
use crate::jf::solver::{is_solvable, SolveResult, SolverCaps};
use crate::jf::stage_config::stage_config;
use crate::jf::types::{TileData, MAX_OBJECTS, MAX_SLOT, MAX_STAGE};
use crate::state::AppState;

const MAX_GEN_TRIES: u32 = 8;
const TOTAL_DEADLINE: Duration = Duration::from_millis(2_500);
const SOLVER_DEADLINE_PER_TRY: Duration = Duration::from_millis(400);
const SOLVER_MAX_ITERS: u64 = 50_000;

#[derive(Deserialize)]
pub struct Request {
    pub stage: u32,
    pub objects: u32,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TileDto {
    pub id: String,
    pub object_id: u32,
    pub col: f32,
    pub row: f32,
    pub layer: u32,
}

impl From<TileData> for TileDto {
    fn from(t: TileData) -> Self {
        Self {
            id: t.id,
            object_id: t.object_id,
            col: t.col,
            row: t.row,
            layer: t.layer,
        }
    }
}

pub async fn handle(
    State(state): State<AppState>,
    Json(req): Json<Request>,
) -> Result<Json<Vec<TileDto>>, ApiError> {
    if req.stage < 1 || req.stage > MAX_STAGE {
        return Err(ApiError::StageOutOfRange(req.stage));
    }
    if req.objects < 1 || req.objects > MAX_OBJECTS {
        return Err(ApiError::ObjectsOutOfRange(req.objects));
    }

    let variants = state.variants.list_recent(req.stage, req.objects).await?;
    let chosen = if variants.is_empty() {
        ensure_variant(&state, req.stage, req.objects).await?
    } else {
        let idx: usize = {
            use rand::RngExt;
            rand::rng().random_range(0..variants.len())
        };
        variants[idx].clone()
    };

    let dto = chosen.tiles.into_iter().map(TileDto::from).collect();
    Ok(Json(dto))
}

async fn ensure_variant(state: &AppState, stage: u32, objects: u32) -> Result<Variant, ApiError> {
    let cfg = stage_config(stage, objects);
    let total_until = Instant::now() + TOTAL_DEADLINE;
    let mut last_iters = 0u64;

    for _ in 0..MAX_GEN_TRIES {
        if Instant::now() >= total_until {
            break;
        }
        let gen_started = Instant::now();
        let mut rng = from_entropy();
        let board = generate_board(&cfg, &mut rng);
        let gen_ms = gen_started.elapsed().as_millis() as u64;

        let solver_caps = SolverCaps {
            max_iters: SOLVER_MAX_ITERS,
            deadline: Instant::now() + SOLVER_DEADLINE_PER_TRY,
        };
        let (verdict, stats) = is_solvable(&board, MAX_SLOT, &solver_caps);
        last_iters = stats.iters;
        if verdict != SolveResult::Solvable {
            tracing::debug!(stage, objects, ?verdict, iters = stats.iters, "discarding board");
            continue;
        }

        let saved = state
            .variants
            .put(stage, objects, &board, gen_ms, stats.iters)
            .await?;
        tracing::info!(stage, objects, gen_ms, iters = stats.iters, sk = %saved.sk, "stored variant");
        return Ok(saved);
    }

    tracing::warn!(stage, objects, last_iters, "generation exhausted retries");
    Err(ApiError::GenerationFailed)
}
