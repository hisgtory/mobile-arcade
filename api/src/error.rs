use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};
use axum::Json;
use serde::Serialize;
use thiserror::Error;

use crate::jf::repo::RepoError;

#[derive(Debug, Error)]
pub enum ApiError {
    #[error("bad request: {0}")]
    BadRequest(&'static str),
    #[error("stage out of range: {0}")]
    StageOutOfRange(u32),
    #[error("objects out of range: {0}")]
    ObjectsOutOfRange(u32),
    #[error("userId invalid")]
    UserIdInvalid,
    #[error("event invalid")]
    EventInvalid,
    #[error("payload too large")]
    PayloadTooLarge,
    #[error("upstream unavailable: {0}")]
    Upstream(String),
    #[error("generation failed after retries")]
    GenerationFailed,
    #[error("internal error: {0}")]
    Internal(String),
}

impl ApiError {
    fn code(&self) -> &'static str {
        match self {
            Self::BadRequest(_) => "bad_request",
            Self::StageOutOfRange(_) => "stage_out_of_range",
            Self::ObjectsOutOfRange(_) => "objects_out_of_range",
            Self::UserIdInvalid => "user_id_invalid",
            Self::EventInvalid => "event_invalid",
            Self::PayloadTooLarge => "payload_too_large",
            Self::Upstream(_) => "upstream_unavailable",
            Self::GenerationFailed => "generation_failed",
            Self::Internal(_) => "internal",
        }
    }

    fn status(&self) -> StatusCode {
        match self {
            Self::BadRequest(_)
            | Self::StageOutOfRange(_)
            | Self::ObjectsOutOfRange(_)
            | Self::UserIdInvalid
            | Self::EventInvalid
            | Self::PayloadTooLarge => StatusCode::BAD_REQUEST,
            Self::Upstream(_) | Self::GenerationFailed => StatusCode::SERVICE_UNAVAILABLE,
            Self::Internal(_) => StatusCode::INTERNAL_SERVER_ERROR,
        }
    }
}

#[derive(Serialize)]
struct ErrorBody<'a> {
    code: &'a str,
    message: String,
}

impl IntoResponse for ApiError {
    fn into_response(self) -> Response {
        let body = ErrorBody {
            code: self.code(),
            message: self.to_string(),
        };
        if matches!(self, Self::Internal(_) | Self::Upstream(_)) {
            tracing::warn!(error = %self, "request failed");
        }
        (self.status(), Json(body)).into_response()
    }
}

impl From<RepoError> for ApiError {
    fn from(value: RepoError) -> Self {
        match value {
            RepoError::Upstream(msg) => Self::Upstream(msg),
            RepoError::Malformed(msg) | RepoError::Internal(msg) => Self::Internal(msg),
        }
    }
}
