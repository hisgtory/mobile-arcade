use axum::Router;

use crate::state::AppState;

mod games;
mod health;
mod jf;

pub fn router(state: AppState) -> Router {
    Router::new()
        .merge(health::router())
        .nest("/v1", v1())
        .with_state(state)
}

fn v1() -> Router<AppState> {
    Router::new()
        .merge(games::router())
        .nest("/jf", jf::router())
}
