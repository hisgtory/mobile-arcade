use axum::routing::post;
use axum::Router;

use crate::state::AppState;

mod stage_tiles;

pub fn router() -> Router<AppState> {
    Router::new().route("/stage/tiles", post(stage_tiles::handle))
}
