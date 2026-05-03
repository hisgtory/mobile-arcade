use axum::extract::{Query, State};
use axum::Json;
use serde::{Deserialize, Serialize};

use crate::error::ApiError;
use crate::state::AppState;

const DEFAULT_LIMIT: u32 = 10;
const MAX_LIMIT: u32 = 50;
const MAX_USER_ID_LEN: usize = 64;

#[derive(Deserialize)]
pub struct Params {
    pub limit: Option<u32>,
    pub user_id: Option<String>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Response {
    pub total_users: u64,
    pub top: Vec<Entry>,
    pub user: Option<UserPosition>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Entry {
    pub rank: u32,
    pub user_id: String,
    pub highest_stage: u32,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UserPosition {
    pub highest_stage: u32,
    pub rank: u64,
    pub top_percent: f32,
    pub total_clears: u64,
}

pub async fn handle(
    State(state): State<AppState>,
    Query(params): Query<Params>,
) -> Result<Json<Response>, ApiError> {
    let limit = params.limit.unwrap_or(DEFAULT_LIMIT).clamp(1, MAX_LIMIT);
    if let Some(uid) = &params.user_id {
        if uid.is_empty() || uid.len() > MAX_USER_ID_LEN {
            return Err(ApiError::BadRequest("userId length invalid"));
        }
    }

    // 동시 호출 (기본 응답 셋업)
    let (top_res, total_res) = tokio::join!(
        state.variants.list_overall_top(limit as i32),
        state.variants.count_total_users(),
    );
    let top_entries = top_res?;
    let total_users = total_res?;

    let top = top_entries
        .into_iter()
        .enumerate()
        .map(|(i, e)| Entry {
            rank: (i + 1) as u32,
            user_id: e.user_id,
            highest_stage: e.highest_stage,
        })
        .collect();

    // 유저 위치 산출 (옵션)
    let user = if let Some(uid) = params.user_id.as_deref() {
        let progress = state.variants.get_user_progress(uid).await?;
        match progress {
            Some(p) => {
                let above = state
                    .variants
                    .count_users_above_stage(p.highest_stage)
                    .await?;
                let rank = above + 1; // 자기 자신 포함
                let top_percent = if total_users > 0 {
                    (rank as f64 * 100.0 / total_users as f64) as f32
                } else {
                    100.0
                };
                Some(UserPosition {
                    highest_stage: p.highest_stage,
                    rank,
                    top_percent,
                    total_clears: p.total_clears,
                })
            }
            None => None,
        }
    } else {
        None
    };

    Ok(Json(Response {
        total_users,
        top,
        user,
    }))
}
