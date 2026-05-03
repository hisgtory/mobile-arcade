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
