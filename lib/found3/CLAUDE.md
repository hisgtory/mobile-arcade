# Game Core Team — found3

## Role: Phaser.io Game Logic Developer

found3 게임의 핵심 로직을 Phaser.io 기반으로 구현합니다.
이 패키지는 `web/found3`에서 import되어 사용됩니다.

## Tech Stack

- **Phaser.io 3** — 게임 엔진
- **TypeScript** — 타입 안전성
- 순수 게임 로직 (React/DOM 의존성 없음)

## Folder Structure

```
lib/found3/
├── src/
│   ├── index.ts          # Public API (export)
│   ├── game.ts           # Phaser Game config factory
│   ├── scenes/
│   │   ├── PlayScene.ts  # 메인 게임 씬
│   │   ├── TitleScene.ts # 타이틀 씬
│   │   └── ClearScene.ts # 클리어/게임오버 씬
│   ├── objects/
│   │   ├── Tile.ts       # 타일 게임 오브젝트
│   │   └── Slot.ts       # 슬롯 UI 오브젝트
│   ├── logic/
│   │   ├── board.ts      # 보드 생성, 배치 로직
│   │   ├── matcher.ts    # 3매치 판정 로직
│   │   └── stage.ts      # 스테이지 데이터
│   └── types.ts          # 공유 타입 정의
├── package.json
└── tsconfig.json
```

## Responsibilities

### DO

- Phaser.io 씬 구현 (Title, Play, Clear, GameOver)
- 타일 오브젝트 및 인터랙션
- 슬롯 매칭 로직 (3개 같은 그림 제거)
- 보드 생성 알고리즘 (레이어 포함)
- 스테이지 데이터 관리
- 게임 상태 머신
- `createGame(config)` 팩토리 함수 export
- 타입 정의 export

### DON'T

- React/DOM 코드 금지
- 스타일링 코드 금지
- API 호출 금지
- web/ 또는 rn/ 폴더 수정 금지

## Public API

```typescript
// 웹에서 사용할 메인 API
export function createGame(parent: HTMLElement, config?: GameConfig): Phaser.Game;
export function destroyGame(game: Phaser.Game): void;

// 타입
export interface GameConfig { stage?: number; }
export interface GameEvents { onClear: () => void; onGameOver: () => void; }
```

## Reference

- `prd/found3.md`: 게임 기획서
- TASKS.md: 현재 작업 목록
