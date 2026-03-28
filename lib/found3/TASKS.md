# Game Core Team (lib/found3) - Tasks

## Current Tasks

### Priority: DONE (MVP)

- [x] 프로젝트 초기화 (tsconfig, phaser 설치)
- [x] 타입 정의 (`types.ts`)
- [x] 보드 생성 로직 (`logic/board.ts`) — 타일 배치 알고리즘
- [x] 매칭 로직 (`logic/matcher.ts`) — 슬롯 3매치 판정
- [x] 스테이지 데이터 (`logic/stage.ts`) — 레벨별 설정
- [x] Tile 게임 오브젝트 (`objects/Tile.ts`)
- [x] Slot UI 오브젝트 (`objects/Slot.ts`)
- [x] PlayScene 구현 (`scenes/PlayScene.ts`)
- [x] TitleScene 구현 (`scenes/TitleScene.ts`)
- [x] ClearScene / GameOverScene 구현
- [x] `createGame` 팩토리 함수 export (`index.ts`)

## Deliverables Checklist

- [x] `pnpm build` 성공
- [x] `createGame()` 함수가 정상 동작
- [ ] web/found3에서 import 가능 (통합 테스트 필요)

## Next Steps

- web/found3 팀과 통합 테스트
- 다중 레이어 지원 추가
- Shuffle / Undo 아이템 구현
- 콤보 시스템 이펙트 강화
