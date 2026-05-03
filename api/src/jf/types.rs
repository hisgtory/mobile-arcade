use serde::{Deserialize, Serialize};

pub const MAX_SLOT: usize = 7;
pub const MAX_OBJECTS: u32 = 14;
pub const MAX_STAGE: u32 = 999;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Shape {
    Rect,
    Heart,
    Diamond,
    Circle,
    Cross,
}

#[derive(Debug, Clone)]
pub struct StageConfig {
    pub stage: u32,
    pub type_count: u32,
    pub set_multiplier: u32,
    pub tile_count: u32,
    pub layers: u32,
    pub cols: u32,
    pub rows: u32,
    pub shape: Shape,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TileData {
    pub id: String,
    pub object_id: u32,
    pub col: f32,
    pub row: f32,
    pub layer: u32,
}
