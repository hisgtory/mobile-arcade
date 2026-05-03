use axum::{extract::Path, http::StatusCode, routing::get, Json, Router};
use serde::Serialize;

use crate::state::AppState;

#[derive(Serialize, Clone, Copy)]
struct Game {
    slug: &'static str,
    title: &'static str,
    subtitle: &'static str,
    category: &'static str,
    coming_soon: bool,
}

const GAMES: &[Game] = &[Game {
    slug: "juicy-fruits",
    title: "Juicy Fruits",
    subtitle: "Fruit Match 3",
    category: "Puzzle",
    coming_soon: false,
}];

async fn list_games() -> Json<&'static [Game]> {
    Json(GAMES)
}

async fn get_game(Path(slug): Path<String>) -> Result<Json<Game>, StatusCode> {
    GAMES
        .iter()
        .find(|g| g.slug == slug)
        .copied()
        .map(Json)
        .ok_or(StatusCode::NOT_FOUND)
}

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/games", get(list_games))
        .route("/games/{slug}", get(get_game))
}
