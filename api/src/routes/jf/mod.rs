use axum::routing::{get, post};
use axum::Router;

use crate::state::AppState;

mod event;
mod leaderboard;
mod stage_clear;
mod stage_leaderboard;
mod stage_tiles;

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/stage/tiles", post(stage_tiles::handle))
        .route("/stage/clear", post(stage_clear::handle))
        .route(
            "/stage/{stage}/leaderboard",
            get(stage_leaderboard::handle),
        )
        .route("/leaderboard", get(leaderboard::handle))
        .route("/event", post(event::handle))
}
