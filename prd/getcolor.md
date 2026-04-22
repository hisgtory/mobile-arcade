# Get Color — PRD

## Overview
Get Color is a **timed color-sorting puzzle** game. Players sort colored liquid segments into tubes so each tube contains only one color — but with a time limit that adds urgency and a scoring dimension.

## Differentiation from Water Sort
While sharing the core tube-pouring mechanic with Water Sort, Get Color differentiates through:

1. **Time Challenge**: Each stage has a countdown timer. Running out of time = game over.
2. **Time Bonus Scoring**: Completing faster earns bonus points (remaining seconds × bonus multiplier).
3. **Dark Theme + Pastel Palette**: Distinct visual identity — dark background (#1a1a2e) with vibrant pastel colors.
4. **10 Defined Stages**: Progressive difficulty from 3 colors (60s) to 10 colors (240s).
5. **Tighter Difficulty**: Stage 10 has 10 colors with only 2 empty tubes — hard under time pressure.

## Architecture
- **Shared Logic**: Board creation, pour logic, win check, and solvability solver are imported from `@arcade/lib-watersort` — no code duplication.
- **Own Layer**: Get Color owns its theme (colors, dark UI), timer mechanic, stage configs, and PlayScene.

## Mechanics

### Core
- Tap tube to select → tap another tube to pour
- Same-color liquid pours from source top to destination top
- Tube solved when it contains 4 segments of the same color

### Timer
- Countdown timer displayed at top of game canvas and in HUD
- Timer turns red and pulses when ≤10 seconds remain
- Timeout triggers "Time's Up!" game over screen
- On win: remaining time × bonus multiplier added to score

### Scoring
- +100 per tube solved
- +bonusPerSecLeft per second remaining at stage clear

## Stage Configs

| Stage | Colors | Empty Tubes | Time Limit | Bonus/sec |
|-------|--------|-------------|------------|-----------|
| 1     | 3      | 2           | 60s        | 5         |
| 2     | 4      | 2           | 90s        | 5         |
| 3     | 5      | 2           | 120s       | 8         |
| 4     | 6      | 2           | 150s       | 8         |
| 5     | 7      | 2           | 180s       | 10        |
| 6     | 8      | 2           | 210s       | 10        |
| 7     | 8      | 3           | 180s       | 12        |
| 8     | 9      | 3           | 210s       | 12        |
| 9     | 10     | 3           | 240s       | 15        |
| 10    | 10     | 2           | 240s       | 15        |

Beyond stage 10: dynamic scaling (numColors caps at 12, time caps at 360s).

## Color Palette
Pastel colors optimized for dark background:
- Coral Red, Teal, Sky Blue, Sunny Yellow, Lavender Purple, Peach Orange
- Fresh Green, Hot Pink, Royal Blue, Mint, Orchid, Tangerine

## Routes
- `/games/getcolor/v1` — Title screen
- `/games/getcolor/v1/stage/:stageId` — Stage play

## Tech Stack
- `lib/getcolor/` — Phaser.io scene + getcolor-specific types/config
- `@arcade/lib-watersort` — Shared tube-puzzle logic (board, pour, solver)
- `web/arcade/src/games/getcolor/` — React integration (useGame, HUD, ClearScreen)
