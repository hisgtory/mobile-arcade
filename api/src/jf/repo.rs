use std::io::Read;
use std::time::{SystemTime, UNIX_EPOCH};

use aws_sdk_dynamodb::primitives::Blob;
use aws_sdk_dynamodb::types::AttributeValue;
use aws_sdk_dynamodb::Client;
use base64::engine::general_purpose::STANDARD as B64;
use base64::Engine;
use flate2::read::GzDecoder;
use flate2::write::GzEncoder;
use flate2::Compression;
use rand::{Rng, RngExt};
use thiserror::Error;

use super::types::TileData;

pub const SCHEMA_VERSION: u32 = 1;
const QUERY_LIMIT: i32 = 25;

/// Bucket size in seconds for clear-time histogram. 5s × 200 buckets = 0..1000s.
pub const CLEAR_BUCKET_SECONDS: u32 = 5;
pub const CLEAR_MAX_BUCKETS: u32 = 200;

pub fn clear_bucket(duration_sec: u32) -> u32 {
    (duration_sec / CLEAR_BUCKET_SECONDS).min(CLEAR_MAX_BUCKETS - 1)
}

#[derive(Debug, Error)]
pub enum RepoError {
    #[error("dynamodb upstream unavailable: {0}")]
    Upstream(String),
    #[error("malformed item from dynamodb: {0}")]
    Malformed(String),
    #[error("internal: {0}")]
    Internal(String),
}

#[derive(Debug, Clone)]
pub struct Variant {
    pub sk: String,
    pub tiles: Vec<TileData>,
}

#[derive(Clone)]
pub struct VariantRepo {
    client: Client,
    table: String,
}

impl VariantRepo {
    pub fn new(client: Client, table: impl Into<String>) -> Self {
        Self {
            client,
            table: table.into(),
        }
    }

    pub fn pk(stage: u32, objects: u32) -> String {
        format!("stage-{}-objects-{}", stage, objects)
    }

    pub fn clear_pk(stage: u32) -> String {
        format!("stage-clear-{}", stage)
    }

    pub async fn list_recent(&self, stage: u32, objects: u32) -> Result<Vec<Variant>, RepoError> {
        let pk = Self::pk(stage, objects);
        let out = self
            .client
            .query()
            .table_name(&self.table)
            .key_condition_expression("pk = :pk")
            .expression_attribute_values(":pk", AttributeValue::S(pk.clone()))
            .scan_index_forward(false)
            .limit(QUERY_LIMIT)
            .send()
            .await
            .map_err(|e| RepoError::Upstream(e.to_string()))?;

        let items = out.items.unwrap_or_default();
        let mut variants = Vec::with_capacity(items.len());
        for item in items {
            variants.push(parse_variant(item)?);
        }
        Ok(variants)
    }

    pub async fn put(
        &self,
        stage: u32,
        objects: u32,
        tiles: &[TileData],
        gen_ms: u64,
        solver_iters: u64,
    ) -> Result<Variant, RepoError> {
        let pk = Self::pk(stage, objects);
        let sk = format!("variant-{}", new_ulid());
        let payload = encode_tiles(tiles)?;
        let now_ms = epoch_ms();

        self.client
            .put_item()
            .table_name(&self.table)
            .item("pk", AttributeValue::S(pk))
            .item("sk", AttributeValue::S(sk.clone()))
            .item("tiles", AttributeValue::B(Blob::new(payload)))
            .item("tile_count", AttributeValue::N(tiles.len().to_string()))
            .item("gen_ms", AttributeValue::N(gen_ms.to_string()))
            .item("solver_iters", AttributeValue::N(solver_iters.to_string()))
            .item("schema_v", AttributeValue::N(SCHEMA_VERSION.to_string()))
            .item("created_at", AttributeValue::N(now_ms.to_string()))
            .send()
            .await
            .map_err(|e| RepoError::Upstream(e.to_string()))?;

        Ok(Variant {
            sk,
            tiles: tiles.to_vec(),
        })
    }

    /// 클리어 어그리게이트 atomic 갱신.
    /// 한 번의 UpdateItem으로 total_clears + bucket_{B} 둘 다 +1, 갱신된 모든 속성 반환.
    /// 반환된 ClearAggregate로 percentile 계산 가능.
    pub async fn record_clear(
        &self,
        stage: u32,
        duration_sec: u32,
    ) -> Result<ClearAggregate, RepoError> {
        let bucket = clear_bucket(duration_sec);
        let bucket_attr = format!("b_{}", bucket);
        let pk = Self::clear_pk(stage);

        let out = self
            .client
            .update_item()
            .table_name(&self.table)
            .key("pk", AttributeValue::S(pk))
            .key("sk", AttributeValue::S("aggregate".into()))
            .update_expression("ADD total_clears :one, #b :one SET schema_v = if_not_exists(schema_v, :sv), created_at = if_not_exists(created_at, :now)")
            .expression_attribute_names("#b", bucket_attr.clone())
            .expression_attribute_values(":one", AttributeValue::N("1".into()))
            .expression_attribute_values(":sv", AttributeValue::N(SCHEMA_VERSION.to_string()))
            .expression_attribute_values(":now", AttributeValue::N(epoch_ms().to_string()))
            .return_values(aws_sdk_dynamodb::types::ReturnValue::AllNew)
            .send()
            .await
            .map_err(|e| RepoError::Upstream(e.to_string()))?;

        let attrs = out.attributes.unwrap_or_default();
        let total_clears = attrs
            .get("total_clears")
            .and_then(|v| v.as_n().ok())
            .and_then(|s| s.parse::<u64>().ok())
            .ok_or_else(|| RepoError::Malformed("missing total_clears".into()))?;

        let mut buckets = vec![0u64; CLEAR_MAX_BUCKETS as usize];
        for (k, v) in &attrs {
            if let Some(idx_str) = k.strip_prefix("b_") {
                if let (Ok(idx), Ok(n)) = (
                    idx_str.parse::<usize>(),
                    v.as_n().ok().and_then(|s| s.parse::<u64>().ok()).ok_or(()),
                ) {
                    if idx < buckets.len() {
                        buckets[idx] = n;
                    }
                }
            }
        }

        Ok(ClearAggregate {
            total_clears,
            user_bucket: bucket,
            buckets,
        })
    }

    /// 감사용 클리어 로그 (best-effort, 실패해도 응답엔 영향 없음).
    pub async fn put_clear_log(
        &self,
        stage: u32,
        user_id: &str,
        duration_sec: u32,
    ) -> Result<(), RepoError> {
        let pk = Self::clear_pk(stage);
        let sk = format!("clear-{}", new_ulid());

        self.client
            .put_item()
            .table_name(&self.table)
            .item("pk", AttributeValue::S(pk))
            .item("sk", AttributeValue::S(sk))
            .item("user_id", AttributeValue::S(user_id.to_string()))
            .item("duration_sec", AttributeValue::N(duration_sec.to_string()))
            .item("created_at", AttributeValue::N(epoch_ms().to_string()))
            .send()
            .await
            .map_err(|e| RepoError::Upstream(e.to_string()))?;
        Ok(())
    }
}

#[derive(Debug, Clone)]
pub struct ClearAggregate {
    pub total_clears: u64,
    pub user_bucket: u32,
    pub buckets: Vec<u64>,
}

impl ClearAggregate {
    /// 자기보다 빠르게 클리어한 사람의 비율 (0..=100).
    /// total_clears는 자기 자신 포함값이라 분모에 그대로 사용.
    /// "+1"은 본인을 분자에 포함해 자연스러운 ranking number 만듦
    /// (ex: 100명 중 자기보다 빠른 사람 9명이면 top 10%).
    pub fn top_percent(&self) -> f32 {
        if self.total_clears == 0 {
            return 100.0;
        }
        let faster: u64 = self
            .buckets
            .iter()
            .take(self.user_bucket as usize)
            .sum();
        ((faster + 1) as f64 * 100.0 / self.total_clears as f64) as f32
    }
}

fn parse_variant(
    item: std::collections::HashMap<String, AttributeValue>,
) -> Result<Variant, RepoError> {
    let sk = item
        .get("sk")
        .and_then(|v| v.as_s().ok())
        .cloned()
        .ok_or_else(|| RepoError::Malformed("missing sk".into()))?;

    let tiles_blob = item
        .get("tiles")
        .ok_or_else(|| RepoError::Malformed("missing tiles attr".into()))?;

    let bytes: Vec<u8> = match tiles_blob {
        AttributeValue::B(b) => b.as_ref().to_vec(),
        AttributeValue::S(s) => B64
            .decode(s.as_bytes())
            .map_err(|e| RepoError::Malformed(format!("base64 decode: {e}")))?,
        _ => return Err(RepoError::Malformed("tiles is not bytes/string".into())),
    };

    let tiles = decode_tiles(&bytes)?;
    Ok(Variant { sk, tiles })
}

fn encode_tiles(tiles: &[TileData]) -> Result<Vec<u8>, RepoError> {
    let json = serde_json::to_vec(tiles).map_err(|e| RepoError::Internal(e.to_string()))?;
    let mut encoder = GzEncoder::new(Vec::new(), Compression::default());
    use std::io::Write;
    encoder
        .write_all(&json)
        .map_err(|e| RepoError::Internal(e.to_string()))?;
    encoder
        .finish()
        .map_err(|e| RepoError::Internal(e.to_string()))
}

fn decode_tiles(bytes: &[u8]) -> Result<Vec<TileData>, RepoError> {
    let mut decoder = GzDecoder::new(bytes);
    let mut json = Vec::new();
    decoder
        .read_to_end(&mut json)
        .map_err(|e| RepoError::Malformed(format!("gunzip: {e}")))?;
    serde_json::from_slice(&json).map_err(|e| RepoError::Malformed(format!("json: {e}")))
}

fn epoch_ms() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_millis() as u64)
        .unwrap_or(0)
}

/// Lightweight ULID: 48-bit timestamp (ms) + 80 bits randomness, Crockford base32.
fn new_ulid() -> String {
    let ms = epoch_ms() & 0x0000_FFFF_FFFF_FFFF;
    let mut rand_bytes = [0u8; 10];
    rand::rng().fill(&mut rand_bytes);
    let mut bytes = [0u8; 16];
    bytes[0] = ((ms >> 40) & 0xFF) as u8;
    bytes[1] = ((ms >> 32) & 0xFF) as u8;
    bytes[2] = ((ms >> 24) & 0xFF) as u8;
    bytes[3] = ((ms >> 16) & 0xFF) as u8;
    bytes[4] = ((ms >> 8) & 0xFF) as u8;
    bytes[5] = (ms & 0xFF) as u8;
    bytes[6..16].copy_from_slice(&rand_bytes);
    encode_crockford(&bytes)
}

fn encode_crockford(bytes: &[u8]) -> String {
    const ALPHABET: &[u8] = b"0123456789ABCDEFGHJKMNPQRSTVWXYZ";
    let mut bits: u128 = 0;
    for &b in bytes {
        bits = (bits << 8) | (b as u128);
    }
    let mut chars = [0u8; 26];
    for i in (0..26).rev() {
        let idx = (bits & 0x1F) as usize;
        chars[i] = ALPHABET[idx];
        bits >>= 5;
    }
    String::from_utf8(chars.to_vec()).expect("ascii")
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn pk_format() {
        assert_eq!(VariantRepo::pk(5, 8), "stage-5-objects-8");
    }

    #[test]
    fn ulid_len_26() {
        assert_eq!(new_ulid().len(), 26);
    }

    #[test]
    fn encode_decode_roundtrip() {
        let tiles = vec![
            TileData {
                id: "tile_0".into(),
                object_id: 0,
                col: 1.5,
                row: 2.0,
                layer: 0,
            },
            TileData {
                id: "tile_1".into(),
                object_id: 3,
                col: 0.0,
                row: 0.0,
                layer: 1,
            },
        ];
        let bytes = encode_tiles(&tiles).expect("encode");
        let back = decode_tiles(&bytes).expect("decode");
        assert_eq!(back.len(), 2);
        assert_eq!(back[0].id, "tile_0");
        assert_eq!(back[1].object_id, 3);
    }
}
