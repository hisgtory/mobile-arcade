use std::time::Instant;

use super::types::TileData;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum SolveResult {
    Solvable,
    Unsolvable,
    Inconclusive,
}

pub struct SolverCaps {
    pub max_iters: u64,
    pub deadline: Instant,
}

#[derive(Debug)]
pub struct SolverStats {
    pub iters: u64,
}

pub fn is_solvable(board: &[TileData], max_slot: usize, caps: &SolverCaps) -> (SolveResult, SolverStats) {
    let blockers = build_blockers(board);
    let mut alive = vec![true; board.len()];
    let mut slot: Vec<u32> = Vec::with_capacity(max_slot * 2);
    let mut iters = 0u64;

    let result = dfs(
        board,
        &blockers,
        &mut alive,
        &mut slot,
        max_slot,
        &mut iters,
        caps,
    );
    let stats = SolverStats { iters };
    let solve = match result {
        Some(true) => SolveResult::Solvable,
        Some(false) => SolveResult::Unsolvable,
        None => SolveResult::Inconclusive,
    };
    (solve, stats)
}

fn dfs(
    board: &[TileData],
    blockers: &[Vec<usize>],
    alive: &mut [bool],
    slot: &mut Vec<u32>,
    max_slot: usize,
    iters: &mut u64,
    caps: &SolverCaps,
) -> Option<bool> {
    *iters += 1;
    if *iters > caps.max_iters || Instant::now() >= caps.deadline {
        return None;
    }

    // 모든 타일 제거 + 슬롯 비었으면 성공
    if slot.is_empty() && alive.iter().all(|a| !*a) {
        return Some(true);
    }

    // pickable 후보 수집
    let mut pickable: Vec<usize> = Vec::new();
    for (i, &is_alive) in alive.iter().enumerate() {
        if !is_alive {
            continue;
        }
        if blockers[i].iter().any(|&b| alive[b]) {
            continue;
        }
        pickable.push(i);
    }
    if pickable.is_empty() {
        return Some(false);
    }

    // 휴리스틱 정렬: 즉시 매치 가능한 타입 → 슬롯에 비슷한 게 많은 타입 → 보드에 많이 남은 타입
    sort_by_heuristic(&mut pickable, board, alive, slot);

    // 같은 type은 서로 동치니까 한 번씩만 시도
    let mut tried_types: Vec<u32> = Vec::new();
    for tile_idx in pickable {
        let obj = board[tile_idx].object_id;
        if tried_types.contains(&obj) {
            continue;
        }
        tried_types.push(obj);

        // 슬롯 오버플로우 검사: 같은 타입 2개 있으면 매치 → 순감소, 아니면 +1
        let same_in_slot = slot.iter().filter(|&&t| t == obj).count();
        let matches = same_in_slot == 2;
        if !matches && slot.len() + 1 > max_slot {
            continue; // 슬롯 풀 → 게임 오버. 다른 후보 시도
        }

        // 적용
        alive[tile_idx] = false;
        if matches {
            slot.retain(|&t| t != obj);
        } else {
            slot.push(obj);
        }

        match dfs(board, blockers, alive, slot, max_slot, iters, caps) {
            Some(true) => return Some(true),
            None => {
                // 캡 초과 → 즉시 반환 (undo 불필요, 호출자가 종료)
                return None;
            }
            Some(false) => {
                // 되돌리고 다음 후보 시도
                alive[tile_idx] = true;
                if matches {
                    slot.push(obj);
                    slot.push(obj);
                } else {
                    slot.pop();
                }
            }
        }
    }

    Some(false)
}

fn sort_by_heuristic(
    pickable: &mut Vec<usize>,
    board: &[TileData],
    alive: &[bool],
    slot: &[u32],
) {
    // (-priority, -slot_match_count) 순으로 정렬 (작을수록 먼저)
    let mut counts_on_board = vec![0u32; (board.len() + 1)];
    for (i, &is_alive) in alive.iter().enumerate() {
        if is_alive {
            let obj = board[i].object_id as usize;
            if obj < counts_on_board.len() {
                counts_on_board[obj] += 1;
            }
        }
    }

    pickable.sort_by_key(|&i| {
        let obj = board[i].object_id;
        let same_in_slot = slot.iter().filter(|&&t| t == obj).count();
        // 1) 즉시 매치 (slot에 이미 2개) → priority 0
        // 2) slot에 1개 → priority 1
        // 3) slot에 0개 → priority 2 (그중 보드에 많이 남은 타입 우선 → 희귀 타입 보존)
        let priority = match same_in_slot {
            2 => 0,
            1 => 1,
            _ => 2,
        };
        let board_count = counts_on_board.get(obj as usize).copied().unwrap_or(0);
        (priority, std::cmp::Reverse(board_count))
    });
}

fn build_blockers(board: &[TileData]) -> Vec<Vec<usize>> {
    let n = board.len();
    let mut result = vec![Vec::new(); n];
    let orders: Vec<i64> = board.iter().map(stack_order).collect();
    for i in 0..n {
        let my_order = orders[i];
        for j in 0..n {
            if i == j {
                continue;
            }
            if orders[j] <= my_order {
                continue;
            }
            let dx = (board[j].col - board[i].col).abs();
            let dy = (board[j].row - board[i].row).abs();
            if dx < 1.0 && dy < 1.0 {
                result[i].push(j);
            }
        }
    }
    result
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
    use std::time::Duration;

    use super::super::board::generate_board;
    use super::super::rng::seeded;
    use super::super::stage_config::stage_config;
    use super::super::types::MAX_SLOT;
    use super::*;

    fn caps_default() -> SolverCaps {
        SolverCaps {
            max_iters: 200_000,
            deadline: Instant::now() + Duration::from_millis(1_000),
        }
    }

    fn tile(id: u32, obj: u32, col: f32, row: f32, layer: u32) -> TileData {
        TileData {
            id: format!("tile_{}", id),
            object_id: obj,
            col,
            row,
            layer,
        }
    }

    #[test]
    fn three_same_tile_solvable() {
        let board = vec![
            tile(0, 0, 0.0, 0.0, 0),
            tile(1, 0, 1.0, 0.0, 0),
            tile(2, 0, 2.0, 0.0, 0),
        ];
        let (r, _) = is_solvable(&board, MAX_SLOT, &caps_default());
        assert_eq!(r, SolveResult::Solvable);
    }

    #[test]
    fn unmatchable_lone_tile_unsolvable() {
        // 한 종류만 1개 → 매치 불가
        let board = vec![tile(0, 0, 0.0, 0.0, 0)];
        let (r, _) = is_solvable(&board, MAX_SLOT, &caps_default());
        assert_eq!(r, SolveResult::Unsolvable);
    }

    #[test]
    fn slot_overflow_unsolvable() {
        // 8개 다른 타입 1개씩, 슬롯 7 → 8번째 picking에서 오버플로우 → unsolvable
        let board = (0..8).map(|i| tile(i, i, i as f32, 0.0, 0)).collect::<Vec<_>>();
        let (r, _) = is_solvable(&board, MAX_SLOT, &caps_default());
        assert_eq!(r, SolveResult::Unsolvable);
    }

    #[test]
    fn generated_easy_board_is_solvable() {
        let cfg = stage_config(1, 2);
        let mut rng = seeded(42);
        let board = generate_board(&cfg, &mut rng);
        let (r, _) = is_solvable(&board, MAX_SLOT, &caps_default());
        assert_eq!(r, SolveResult::Solvable);
    }

    #[test]
    fn cap_trip_returns_inconclusive() {
        // 매우 작은 보드지만 iter cap 1로 강제 조기 종료
        let cfg = stage_config(10, 6);
        let mut rng = seeded(99);
        let board = generate_board(&cfg, &mut rng);
        let caps = SolverCaps {
            max_iters: 1,
            deadline: Instant::now() + Duration::from_secs(10),
        };
        let (r, _) = is_solvable(&board, MAX_SLOT, &caps);
        assert_eq!(r, SolveResult::Inconclusive);
    }
}
