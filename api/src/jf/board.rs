use rand::{Rng, RngExt};

use super::rng::shuffle;
use super::shapes::is_inside_shape;
use super::types::{StageConfig, TileData};

const OVERLAP_THRESHOLD: f32 = 0.25;
const OVERLAP_SHIFTS: [(f32, f32); 9] = [
    (0.0, 0.0),
    (0.25, 0.0),
    (0.0, 0.25),
    (0.25, 0.25),
    (0.5, 0.0),
    (0.0, 0.5),
    (0.5, 0.25),
    (0.25, 0.5),
    (0.5, 0.5),
];

fn intra_layer_ratio(stage: u32) -> f32 {
    if stage <= 10 {
        0.8
    } else if stage <= 30 {
        0.5
    } else {
        0.2
    }
}

fn distribute_tiles_across_layers(total_tiles: u32, layer_count: u32) -> Vec<u32> {
    if layer_count <= 1 {
        return vec![total_tiles];
    }
    let lc = layer_count as usize;
    let weights: Vec<f32> = (0..lc).map(|i| (lc - i) as f32).collect();
    let total_weight: f32 = weights.iter().sum();
    let raw: Vec<f32> = weights
        .iter()
        .map(|w| (w / total_weight) * total_tiles as f32)
        .collect();
    let mut counts: Vec<u32> = raw.iter().map(|r| (r / 3.0).round() as u32 * 3).collect();
    for c in counts.iter_mut() {
        if *c < 3 {
            *c = 3;
        }
    }
    let mut sum: u32 = counts.iter().sum();
    while sum > total_tiles {
        if counts[0] >= 6 {
            counts[0] -= 3;
            sum -= 3;
        } else {
            break;
        }
    }
    while sum < total_tiles {
        counts[0] += 3;
        sum += 3;
    }
    if counts[0] < 3 {
        counts[0] = 3;
    }
    counts
}

pub fn generate_board<R: Rng>(cfg: &StageConfig, rng: &mut R) -> Vec<TileData> {
    let layer_counts = distribute_tiles_across_layers(cfg.tile_count, cfg.layers);

    // 1. 매칭 그룹 만들고 셔플
    let mut match_groups: Vec<u32> = (0..cfg.type_count)
        .flat_map(|t| std::iter::repeat(t).take(cfg.set_multiplier as usize))
        .collect();
    shuffle(rng, &mut match_groups);

    // 2. stage 기반 intra:random 비율 분할
    let intra_ratio = intra_layer_ratio(cfg.stage);
    let intra_count = (match_groups.len() as f32 * intra_ratio).round() as usize;

    let mut layer_tiles: Vec<Vec<u32>> = layer_counts.iter().map(|_| Vec::new()).collect();
    let mut remaining: Vec<u32> = layer_counts.clone();

    // 3. intra 그룹: 상위 레이어부터 3개씩 묶어 배치
    let mut group_idx = 0;
    for layer in 0..(cfg.layers as usize) {
        if group_idx >= intra_count {
            break;
        }
        while remaining[layer] >= 3 && group_idx < intra_count {
            let t = match_groups[group_idx];
            group_idx += 1;
            layer_tiles[layer].extend_from_slice(&[t, t, t]);
            remaining[layer] -= 3;
        }
    }

    // 4. 나머지는 흩어진 타일로 변환 → 셔플 후 빈 자리 채움
    let mut random_tiles: Vec<u32> = Vec::new();
    for &t in &match_groups[group_idx..] {
        random_tiles.extend_from_slice(&[t, t, t]);
    }
    shuffle(rng, &mut random_tiles);

    let mut rand_idx = 0;
    for layer in 0..(cfg.layers as usize) {
        while remaining[layer] > 0 && rand_idx < random_tiles.len() {
            layer_tiles[layer].push(random_tiles[rand_idx]);
            rand_idx += 1;
            remaining[layer] -= 1;
        }
    }

    // 5. 레이어별 셔플 후 평탄화
    for tiles in layer_tiles.iter_mut() {
        shuffle(rng, tiles);
    }
    let types: Vec<u32> = layer_tiles.into_iter().flatten().collect();

    // 6. 실제 배치
    let mut tiles: Vec<TileData> = Vec::with_capacity(cfg.tile_count as usize);
    let mut type_idx = 0usize;
    let mut next_id = 0usize;

    for layer in 0..cfg.layers {
        let count = layer_counts[layer as usize];
        let layer_cols = (cfg.cols.saturating_sub(layer)).max(2);
        let layer_rows = (cfg.rows.saturating_sub(layer)).max(2);

        let mut valid_positions: Vec<(u32, u32)> = Vec::new();
        for r in 0..layer_rows {
            for c in 0..layer_cols {
                if is_inside_shape(cfg.shape, c, r, layer_cols, layer_rows) {
                    valid_positions.push((c, r));
                }
            }
        }

        let mut positions: Vec<(u32, u32)> = if (valid_positions.len() as u32) >= count {
            valid_positions
        } else {
            // 모양 필터링이 부족하면 사각형 전체 영역 사용
            (0..layer_cols * layer_rows)
                .map(|i| (i % layer_cols, i / layer_cols))
                .collect()
        };
        shuffle(rng, &mut positions);

        for i in 0..count as usize {
            let (pcol, prow) = positions[i % positions.len()];
            let offset = layer as f32 * 0.5;
            let jitter = (rng.random_range(0..2) as f32) * 0.25;
            let base_col = pcol as f32 + offset + jitter;
            let base_row = prow as f32 + offset + jitter;

            // 같은 레이어 75% 이상 겹침 방지
            let mut final_col = base_col;
            let mut final_row = base_row;
            for &(dc, dr) in &OVERLAP_SHIFTS {
                let c = base_col + dc;
                let r = base_row + dr;
                let conflict = tiles.iter().any(|t| {
                    t.layer == layer
                        && (t.col - c).abs() < OVERLAP_THRESHOLD
                        && (t.row - r).abs() < OVERLAP_THRESHOLD
                });
                if !conflict {
                    final_col = c;
                    final_row = r;
                    break;
                }
            }

            tiles.push(TileData {
                id: format!("tile_{}", next_id),
                object_id: types[type_idx],
                col: final_col,
                row: final_row,
                layer,
            });
            type_idx += 1;
            next_id += 1;
        }
    }

    tiles
}

/// 같은 위치에 더 위 레이어/뒤늦게 쌓인 타일이 있으면 선택 불가.
/// `lib/.../board.ts::isTileBlocked` 와 동일한 규칙.
pub fn is_tile_blocked(tile: &TileData, all_tiles: &[TileData]) -> bool {
    let my_order = stack_order(tile);
    for other in all_tiles {
        if other.id == tile.id {
            continue;
        }
        if stack_order(other) <= my_order {
            continue;
        }
        let dx = (other.col - tile.col).abs();
        let dy = (other.row - tile.row).abs();
        if dx < 1.0 && dy < 1.0 {
            return true;
        }
    }
    false
}

fn stack_order(tile: &TileData) -> i64 {
    let id_num: i64 = tile
        .id
        .strip_prefix("tile_")
        .and_then(|n| n.parse().ok())
        .unwrap_or(0);
    (tile.layer as i64) * 10_000 + id_num
}

#[cfg(test)]
mod tests {
    use super::super::rng::seeded;
    use super::super::stage_config::stage_config;
    use super::*;

    fn count_per_type(tiles: &[TileData], type_count: u32) -> Vec<u32> {
        let mut counts = vec![0u32; type_count as usize];
        for t in tiles {
            counts[t.object_id as usize] += 1;
        }
        counts
    }

    #[test]
    fn stage_1_objects_2_generates_six_tiles() {
        let cfg = stage_config(1, 2);
        let mut rng = seeded(42);
        let tiles = generate_board(&cfg, &mut rng);
        assert_eq!(tiles.len() as u32, cfg.tile_count);
        assert_eq!(tiles.len(), 6);
        // 각 타입은 정확히 set_multiplier * 3 = 3개
        let counts = count_per_type(&tiles, cfg.type_count);
        assert!(counts.iter().all(|c| *c == 3));
    }

    #[test]
    fn stage_30_objects_8_generates_correct_count() {
        let cfg = stage_config(30, 8);
        let mut rng = seeded(7);
        let tiles = generate_board(&cfg, &mut rng);
        assert_eq!(tiles.len() as u32, cfg.tile_count);
        let counts = count_per_type(&tiles, cfg.type_count);
        // 각 타입은 set_multiplier * 3 = 4 * 3 = 12개
        assert!(counts.iter().all(|c| *c == 12));
    }

    #[test]
    fn no_two_tiles_overlap_75_percent_in_same_layer() {
        let cfg = stage_config(15, 6);
        let mut rng = seeded(123);
        let tiles = generate_board(&cfg, &mut rng);
        for i in 0..tiles.len() {
            for j in (i + 1)..tiles.len() {
                if tiles[i].layer != tiles[j].layer {
                    continue;
                }
                let dx = (tiles[i].col - tiles[j].col).abs();
                let dy = (tiles[i].row - tiles[j].row).abs();
                assert!(
                    dx >= OVERLAP_THRESHOLD || dy >= OVERLAP_THRESHOLD,
                    "tiles {:?} and {:?} overlap >75%",
                    tiles[i],
                    tiles[j]
                );
            }
        }
    }

    #[test]
    fn distribute_layer_counts_sum_matches_total() {
        let counts = distribute_tiles_across_layers(96, 10);
        assert_eq!(counts.iter().sum::<u32>(), 96);
        assert!(counts.iter().all(|c| c % 3 == 0));
    }

    #[test]
    fn is_tile_blocked_basic_stack() {
        let lower = TileData {
            id: "tile_0".into(),
            object_id: 0,
            col: 1.0,
            row: 1.0,
            layer: 0,
        };
        let upper = TileData {
            id: "tile_1".into(),
            object_id: 0,
            col: 1.5,
            row: 1.0,
            layer: 1,
        };
        let all = vec![lower.clone(), upper.clone()];
        assert!(is_tile_blocked(&lower, &all));
        assert!(!is_tile_blocked(&upper, &all));
    }
}
