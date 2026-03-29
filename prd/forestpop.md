# Forest Pop — 포레스트 애니팝

## Overview
숲 테마의 탭-투-팝 매치 퍼즐 게임. 같은 종류의 연결된 타일 그룹(2개 이상)을 탭하면 터뜨려서 점수를 획득한다.

## Reference
- **원작**: 포레스트 애니팝 (springpocket, Rating 4.3)
- **장르**: Match-3 (tap-to-pop variant)
- **이슈**: #110

## Core Mechanic
1. 8×8 격자에 숲 테마 타일이 배치됨
2. 같은 타일이 상하좌우로 2개 이상 연결된 그룹을 탭하면 터짐
3. 터진 자리는 위 타일이 중력으로 떨어지고, 빈 자리에 새 타일 생성
4. 연쇄(cascade) 발생 시 콤보 점수 배율 증가
5. 제한된 수(moves) 안에 목표 점수 달성 시 스테이지 클리어

## Scoring
- 2개 그룹: 50점
- 3개 그룹: 100점
- 4개 그룹: 200점
- 5개+ 그룹: 300 + (개수-5)*100점
- 콤보 배율: combo × base

## Stage Progression
| Stage | Tile Types | Moves | Target Score |
|-------|-----------|-------|-------------|
| 1     | 5         | 30    | 1000        |
| 2     | 5         | 25    | 2000        |
| 3     | 6         | 22    | 3500        |
| 4     | 6         | 20    | 5000        |
| 5     | 7         | 18    | 7000        |

## Tile Themes
Found3 에셋 재활용 (숲 + 음식 테마).

## Tech Stack
- lib/forestpop: Phaser.io 코어 로직
- web/arcade/src/games/forestpop: React UI (HUD, ClearScreen)
- Route: /games/forestpop/v1/stage/:stageId
