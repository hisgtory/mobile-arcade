use axum::extract::{Path, Query, State};
use axum::Json;
use serde::{Deserialize, Serialize};

use crate::error::ApiError;
use crate::jf::types::MAX_STAGE;
use crate::state::AppState;

const DEFAULT_LIMIT: u32 = 10;
const MAX_LIMIT: u32 = 50;

#[derive(Deserialize)]
pub struct Params {
    pub limit: Option<u32>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Response {
    pub stage: u32,
    pub top: Vec<Entry>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Entry {
    pub rank: u32,
    pub user_id: String,
    pub duration_sec: u32,
    pub cleared_at: u64,
}

pub async fn handle(
    State(state): State<AppState>,
    Path(stage): Path<u32>,
    Query(params): Query<Params>,
) -> Result<Json<Response>, ApiError> {
    if stage < 1 || stage > MAX_STAGE {
        return Err(ApiError::StageOutOfRange(stage));
    }
    let limit = params.limit.unwrap_or(DEFAULT_LIMIT).clamp(1, MAX_LIMIT);

    let entries = state.variants.list_stage_top(stage, limit as i32).await?;

    let top = entries
        .into_iter()
        .enumerate()
        .map(|(i, e)| Entry {
            rank: (i + 1) as u32,
            user_id: e.user_id,
            duration_sec: e.duration_sec,
            cleared_at: e.cleared_at,
        })
        .collect();

    Ok(Json(Response { stage, top }))
}
