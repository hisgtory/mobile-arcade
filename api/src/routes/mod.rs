use axum::Router;

mod games;
mod health;

pub fn router() -> Router {
    Router::new()
        .merge(health::router())
        .nest("/v1", v1())
}

fn v1() -> Router {
    Router::new().merge(games::router())
}
