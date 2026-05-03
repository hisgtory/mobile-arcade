use super::{Shape, StageConfig};

const SHAPES: [Shape; 5] = [
    Shape::Circle,
    Shape::Diamond,
    Shape::Heart,
    Shape::Cross,
    Shape::Rect,
];

/// stage.ts::getStageConfig를 옮긴 버전.
/// `objects`가 주어지면 typeCount를 그 값으로 강제하고 tileCount를 그에 맞춰 재계산.
pub fn stage_config(stage: u32, objects: u32) -> StageConfig {
    let set_multiplier = 1 + stage / 10;
    let tile_count = objects * 3 * set_multiplier;
    let layers = 15.min(1 + stage / 3);
    let cols = 6;
    let rows = 8;
    let shape_idx = ((stage as usize).saturating_sub(1)) % SHAPES.len();

    StageConfig {
        stage,
        type_count: objects,
        set_multiplier,
        tile_count,
        layers,
        cols,
        rows,
        shape: SHAPES[shape_idx],
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn stage_1_objects_2_basics() {
        let c = stage_config(1, 2);
        assert_eq!(c.type_count, 2);
        assert_eq!(c.set_multiplier, 1);
        assert_eq!(c.tile_count, 6);
        assert_eq!(c.layers, 1);
        assert_eq!(c.cols, 6);
        assert_eq!(c.rows, 8);
        assert_eq!(c.shape, Shape::Circle);
    }

    #[test]
    fn stage_30_set_multiplier_4() {
        let c = stage_config(30, 8);
        assert_eq!(c.set_multiplier, 4);
        assert_eq!(c.tile_count, 96);
        assert_eq!(c.layers, 11);
    }

    #[test]
    fn shape_cycles_with_stage() {
        assert_eq!(stage_config(1, 2).shape, Shape::Circle);
        assert_eq!(stage_config(2, 2).shape, Shape::Diamond);
        assert_eq!(stage_config(5, 2).shape, Shape::Rect);
        assert_eq!(stage_config(6, 2).shape, Shape::Circle);
    }
}
