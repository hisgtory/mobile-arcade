# Game Core Team (lib/found3) - Tasks

## Current Tasks

### Priority: READY TO START

- [ ] 프로젝트 초기화 (tsconfig, phaser 설치)
- [ ] 타입 정의 (`types.ts`)
- [ ] 보드 생성 로직 (`logic/board.ts`) — 타일 배치 알고리즘
- [ ] 매칭 로직 (`logic/matcher.ts`) — 슬롯 3매치 판정
- [ ] 스테이지 데이터 (`logic/stage.ts`) — 레벨별 설정
- [ ] Tile 게임 오브젝트 (`objects/Tile.ts`)
- [ ] Slot UI 오브젝트 (`objects/Slot.ts`)
- [ ] PlayScene 구현 (`scenes/PlayScene.ts`)
- [ ] TitleScene 구현 (`scenes/TitleScene.ts`)
- [ ] ClearScene / GameOverScene 구현
- [ ] `createGame` 팩토리 함수 export (`index.ts`)

## Deliverables Checklist

- [ ] `pnpm build` 성공
- [ ] `createGame()` 함수가 정상 동작
- [ ] web/found3에서 import 가능

## Next Steps

- web/found3 팀과 통합 테스트
- 다중 레이어 지원 추가
