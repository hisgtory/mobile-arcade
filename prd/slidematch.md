# Fantasy Tile: Sliding Match

> 슬라이딩 퍼즐 + 타일 매치 하이브리드 게임. 행/열을 밀어서 3개 이상 같은 타일을 매칭.

## Game Rules

- NxN 그리드에 여러 종류의 타일 배치
- 플레이어는 **행(가로) 또는 열(세로)를 밀어서** 타일을 이동
- 슬라이드 후 **3개 이상** 같은 타일이 가로/세로로 연속되면 매칭 → 제거 + 점수
- 제거된 빈 칸에 새 타일이 위에서 떨어짐 (gravity)
- 연쇄 매칭(cascade) 가능
- **제한된 이동 횟수** 안에 목표 점수 달성 시 스테이지 클리어
- 이동 횟수 소진 시 게임 오버

## Core Mechanic: Sliding

- **가로 슬라이드**: 행 하나를 좌/우로 밀기 → 행의 모든 타일이 한 칸씩 이동
- **세로 슬라이드**: 열 하나를 상/하로 밀기 → 열의 모든 타일이 한 칸씩 이동
- 슬라이드는 **순환(wrap-around)**: 끝에서 밀린 타일이 반대편에 등장
- 매칭이 발생하면 이동 횟수 소비, 매칭 없으면 원래대로 복귀

## Board Layout

```
┌─────────────────────────┐
│  ⭐ Score   🎯 Target    │  ← HUD
│  📊 Stage   🔄 Moves     │
├─────────────────────────┤
│  ← [🍎][🌺][🍎][🌸][🍎] → │  ← Row slide (left/right)
│  ← [🌺][🌸][🌺][🍎][🌸] → │
│  ← [🍎][🌸][🌸][🌺][🌸] → │
│  ← [🌸][🍎][🌺][🌸][🍎] → │
│  ← [🌺][🍎][🌸][🍎][🌺] → │
│     ↑   ↑   ↑   ↑   ↑    │  ← Col slide (up/down)
│     ↓   ↓   ↓   ↓   ↓    │
└─────────────────────────┘
```

## Stages (5 total)

| Level | Types | Rows | Cols | MaxMoves | TargetScore |
|-------|-------|------|------|----------|-------------|
| 1     | 4     | 5    | 5    | 20       | 800         |
| 2     | 5     | 6    | 6    | 22       | 1500        |
| 3     | 5     | 6    | 6    | 20       | 2500        |
| 4     | 6     | 7    | 7    | 20       | 4000        |
| 5     | 6     | 7    | 7    | 18       | 6000        |

## Scoring

- 3매치: 100점 × combo
- 4매치: 200점 × combo
- 5+매치: 500점 × combo
- 연쇄(cascade)마다 combo +1

## Difference from Crunch3/Found3

| Feature | Found3 | Crunch3 | SlidingMatch |
|---------|--------|---------|--------------|
| Input   | Tap    | Swap adjacent | Slide entire row/col |
| Match   | Slot-based | 3+ in line | 3+ in line |
| Board   | Layered | Fixed grid + gravity | Wrap-around slide + gravity |
| Feel    | Memory puzzle | Classic match-3 | Strategic sliding puzzle |

## Implementation: Phaser.io

- **Input**: 행/열 가장자리에서 스와이프 감지 → 해당 행/열 슬라이드
- **Animation**: 슬라이드 → 매칭 → 제거 → 낙하 → 연쇄 체크
- **Phaser handles**: 타일 보드 렌더링 + 스와이프 입력 + 애니메이션
- **React handles**: HUD, 타이틀, 결과 화면
