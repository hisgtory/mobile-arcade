use std::time::{SystemTime, UNIX_EPOCH};

use axum::extract::State;
use axum::http::StatusCode;
use axum::Json;
use serde::Deserialize;
use serde_json::Value;

use crate::error::ApiError;
use crate::state::AppState;

const MAX_USER_ID_LEN: usize = 64;
const MAX_EVENT_LEN: usize = 32;
const MAX_PAYLOAD_BYTES: usize = 4 * 1024;
const MAX_FUTURE_SKEW_MS: u64 = 24 * 60 * 60 * 1000;

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Request {
    pub user_id: String,
    pub event: String,
    pub payload: Value,
    pub timestamp: Option<u64>,
}

pub async fn handle(
    State(state): State<AppState>,
    Json(req): Json<Request>,
) -> Result<StatusCode, ApiError> {
    let payload_json = validate(&req)?;

    state
        .variants
        .put_event(&req.user_id, &req.event, &payload_json, req.timestamp)
        .await?;

    Ok(StatusCode::ACCEPTED)
}

/// 검증 통과 시 payload의 컴팩트 JSON 직렬화 결과를 반환.
fn validate(req: &Request) -> Result<String, ApiError> {
    if req.user_id.is_empty() || req.user_id.len() > MAX_USER_ID_LEN {
        return Err(ApiError::UserIdInvalid);
    }
    if !is_valid_event_name(&req.event) {
        return Err(ApiError::EventInvalid);
    }
    if !req.payload.is_object() {
        return Err(ApiError::BadRequest("payload must be a JSON object"));
    }

    let payload_json = serde_json::to_string(&req.payload)
        .map_err(|_| ApiError::BadRequest("payload not serializable"))?;
    if payload_json.len() > MAX_PAYLOAD_BYTES {
        return Err(ApiError::PayloadTooLarge);
    }

    if let Some(ts) = req.timestamp {
        let now = now_ms();
        if ts > now + MAX_FUTURE_SKEW_MS {
            return Err(ApiError::BadRequest("timestamp too far in future"));
        }
    }

    Ok(payload_json)
}

fn is_valid_event_name(s: &str) -> bool {
    let len = s.len();
    if len == 0 || len > MAX_EVENT_LEN {
        return false;
    }
    s.bytes().all(|b| b.is_ascii_lowercase() || b.is_ascii_digit() || b == b'_')
}

fn now_ms() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_millis() as u64)
        .unwrap_or(0)
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    fn req(user_id: &str, event: &str, payload: Value, timestamp: Option<u64>) -> Request {
        Request {
            user_id: user_id.into(),
            event: event.into(),
            payload,
            timestamp,
        }
    }

    #[test]
    fn happy_path_returns_serialized_payload() {
        let r = req("u1", "stage_clear", json!({"stage": 7, "time": 12}), None);
        let s = validate(&r).expect("valid");
        assert!(s.contains("\"stage\":7"));
    }

    #[test]
    fn empty_user_id_rejected() {
        let r = req("", "app_launch", json!({}), None);
        assert!(matches!(validate(&r), Err(ApiError::UserIdInvalid)));
    }

    #[test]
    fn over_long_user_id_rejected() {
        let r = req(&"x".repeat(65), "app_launch", json!({}), None);
        assert!(matches!(validate(&r), Err(ApiError::UserIdInvalid)));
    }

    #[test]
    fn uppercase_event_rejected() {
        let r = req("u1", "BAD_EVENT", json!({}), None);
        assert!(matches!(validate(&r), Err(ApiError::EventInvalid)));
    }

    #[test]
    fn special_char_event_rejected() {
        let r = req("u1", "bad-event", json!({}), None);
        assert!(matches!(validate(&r), Err(ApiError::EventInvalid)));
    }

    #[test]
    fn payload_must_be_object() {
        let r = req("u1", "x", json!([1, 2, 3]), None);
        assert!(matches!(validate(&r), Err(ApiError::BadRequest(_))));
    }

    #[test]
    fn oversized_payload_rejected() {
        let big = "x".repeat(MAX_PAYLOAD_BYTES);
        let r = req("u1", "x", json!({"data": big}), None);
        assert!(matches!(validate(&r), Err(ApiError::PayloadTooLarge)));
    }

    #[test]
    fn future_timestamp_rejected() {
        let future = now_ms() + 2 * MAX_FUTURE_SKEW_MS;
        let r = req("u1", "x", json!({}), Some(future));
        assert!(matches!(validate(&r), Err(ApiError::BadRequest(_))));
    }

    #[test]
    fn past_timestamp_accepted() {
        let r = req("u1", "x", json!({}), Some(now_ms() - 1000));
        assert!(validate(&r).is_ok());
    }
}
