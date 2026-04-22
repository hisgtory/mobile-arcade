# Mobile Arcade

모바일 미니게임 모노레포. Web(React + TypeScript + Stitches + Phaser.io) + React Native(WebView) 구조.

## Architecture

```
mobile-arcade/
├── lib/{game}/       # 게임 코어 로직 (Phaser.io scenes, shared types)
├── web/arcade/       # 통합 웹 앱 — 모든 게임 라우팅 (React + Stitches + Vite)
├── rn/               # RN 슈퍼앱 — WebView로 web/arcade 래핑 (Expo)
├── prd/              # 게임 기획서
└── knowledge/        # 프로젝트 지식 베이스 (ADR, 진행 상황, 결정 기록)
```

### Data Flow

```
lib/{game}  →  web/arcade  →  rn
(Phaser.io)   (React+Stitches,  (Expo WebView,
               Vite dev server)  슈퍼앱)
```

1. `lib/{game}`: Phaser.io 기반 게임 로직, 씬, 타입 정의 (`@arcade/lib-{game}`)
2. `web/arcade`: 모든 게임을 단일 Vite 앱으로 통합, React Router로 라우팅 (`@arcade/web`)
3. `rn`: 빌드된 웹 앱을 WebView로 로드하는 Expo 슈퍼앱 (`@arcade/app`)

## Games

| Game | Package | Description |
|------|---------|-------------|
| found3 | `@arcade/lib-found3` | 3개씩 같은 타일을 찾아 없애는 매치-3 퍼즐 |
| found3-react | `@arcade/lib-found3-react` | Found 3 React 전환 버전 (Phaser 제거 비교 실험) |
| crunch3 | `@arcade/lib-crunch3` | 스와이프로 3개 매칭하는 match-3 퍼즐 |
| blockrush | `@arcade/lib-blockrush` | 드래그로 블록 피스를 배치해 라인을 클리어하는 퍼즐 |
| blockpuzzle | `@arcade/lib-blockpuzzle` | 보석 블록 배치 퍼즐 |
| blockcrush | `@arcade/lib-blockcrush` | 같은 색 블록 그룹을 탭해 없애는 퍼즐 |
| woodoku | `@arcade/lib-woodoku` | 9×9 그리드 나무 블록 퍼즐 (영역 클리어) |
| watersort | `@arcade/lib-watersort` | 튜브에 담긴 색깔 물을 분류하는 퍼즐 |
| tictactoe | `@arcade/lib-tictactoe` | AI와 대결하는 틱택토 (3x3→4x4→5x5 연승 확장) |
| minesweeper | `@arcade/lib-minesweeper` | 탭/롱프레스로 지뢰를 피하는 클래식 지뢰찾기 |
| number10 | `@arcade/lib-number10` | 드래그 선택으로 합 10을 만들어 지우는 사과게임 |
| sudoku | `@arcade/lib-sudoku` | Easy~Expert 4단계 스도쿠 퍼즐 |
| getcolor | `@arcade/lib-getcolor` | 타이머 색깔 분류 퍼즐 |

## Getting Started

### 1. 의존성 설치

```bash
pnpm install
```

### 2. 웹 앱 실행

```bash
# 통합 웹 앱 (web/arcade) — 모든 게임 포함
pnpm --filter @arcade/web dev
# → http://localhost:5173
```

브라우저에서 `http://localhost:5173`으로 접속하면 게임 목록이 열립니다.

### 3. RN 앱 실행

> **사전 요구사항**: Expo CLI, iOS Simulator 또는 Android Emulator

```bash
# 1) 웹 dev 서버 먼저 실행 (위 2번)
# 2) 별도 터미널에서 RN 앱 실행
cd rn
npx expo start
```

#### DEV_HOST 설정 (실기기 또는 다른 머신)

RN 앱은 dev 환경에서 `http://{DEV_HOST}:5173`으로 웹 서버에 접속합니다.
기본값은 iOS 시뮬레이터용 `SG-MacBook-Pro.local` / Android 에뮬레이터용 `10.0.2.2`입니다.
실기기나 다른 머신에서 테스트할 때는 환경변수로 오버라이드하세요:

```bash
# 방법 1: .env 파일 (rn/ 폴더)
echo "EXPO_PUBLIC_DEV_HOST=192.168.1.100" > rn/.env

# 방법 2: 실행 시 직접 지정
EXPO_PUBLIC_DEV_HOST=192.168.1.100 npx expo start
```

### 4. 타입 체크

```bash
# 전체 워크스페이스
pnpm --filter "@arcade/*" typecheck

# 특정 패키지
pnpm --filter @arcade/web typecheck
```

### 5. 프로덕션 빌드

```bash
# 웹 앱 빌드 (web/arcade → dist/)
pnpm --filter @arcade/web build

# RN 앱 빌드 (Expo EAS)
cd rn && npx eas build
```

## pnpm 표준 명령 요약

| 명령 | 설명 |
|------|------|
| `pnpm install` | 전체 의존성 설치 |
| `pnpm --filter @arcade/web dev` | 통합 웹 앱 dev 서버 |
| `pnpm --filter @arcade/web build` | 통합 웹 앱 프로덕션 빌드 |
| `pnpm --filter @arcade/web typecheck` | 웹 앱 타입 체크 |
| `pnpm --filter @arcade/lib-{game} build` | 특정 게임 lib 빌드 |
| `pnpm --filter "@arcade/*" typecheck` | 전체 타입 체크 |

## 새 게임 추가 패턴

새 게임 `{name}`을 추가하는 순서입니다.

### 1. 기획서 작성

```
prd/{name}.md
```

### 2. lib 패키지 생성

```bash
mkdir -p lib/{name}/src
```

`lib/{name}/package.json`:
```json
{
  "name": "@arcade/lib-{name}",
  "version": "0.0.1",
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch"
  },
  "dependencies": {
    "phaser": "^3.80.0"
  }
}
```

`pnpm-workspace.yaml`의 `lib/*` glob이 자동으로 인식합니다 — 별도 등록 불필요.

### 3. web/arcade에 게임 라우트 추가

```
web/arcade/src/games/{name}/
├── routes.tsx    # registerRoutes() 호출 — 게임 라우트 자체 등록 (ADR-016)
├── useGame.ts    # Phaser ↔ React 브릿지 훅
└── ...           # HUD, ClearScreen 등 React 컴포넌트
```

`web/arcade/src/App.tsx`에 side-effect import 한 줄 추가:
```ts
import './games/{name}/routes';
```

### 4. RN 카탈로그 등록

`rn/src/data/games.ts`의 `GAMES` 배열에 항목 추가:
```ts
{
  id: '{name}',
  name: 'Game Name',
  description: '게임 설명',
  icon: '🎮',
  category: 'puzzle',
  color: '#XXXXXX',
  webPath: '/games/{name}/v1',
}
```

### 5. 햅틱 이벤트 추가 (필수)

모든 게임에 햅틱 피드백이 필수입니다:

- **lib**: 유저 입력 시점에 `this.game.events.emit('tile-tapped')` 등 이벤트 발행
- **web `useGame.ts`**: 이벤트 수신 시 `bridge.haptic('tile-tapped')` 호출
- **rn `bridge.ts`**: `HAPTIC_PATTERNS` 맵에 `'tile-tapped': { style: 'Heavy', count: 1 }` 추가

자세한 내용은 `CLAUDE.md` > Haptic Feedback 섹션 참조.

## Project Structure (전체)

```
mobile-arcade/
├── lib/
│   ├── found3/           @arcade/lib-found3
│   ├── found3-react/     @arcade/lib-found3-react
│   ├── crunch3/          @arcade/lib-crunch3
│   ├── blockrush/        @arcade/lib-blockrush
│   ├── blockpuzzle/      @arcade/lib-blockpuzzle
│   ├── blockcrush/       @arcade/lib-blockcrush
│   ├── woodoku/          @arcade/lib-woodoku
│   ├── watersort/        @arcade/lib-watersort
│   ├── tictactoe/        @arcade/lib-tictactoe
│   ├── minesweeper/      @arcade/lib-minesweeper
│   ├── number10/         @arcade/lib-number10
│   ├── sudoku/           @arcade/lib-sudoku
│   └── getcolor/         @arcade/lib-getcolor
├── web/
│   └── arcade/           @arcade/web  ← 통합 웹 앱 (모든 게임)
├── rn/                   @arcade/app  ← Expo 슈퍼앱
├── prd/                  게임 기획서
├── knowledge/            ADR, 진행 상황, 결정 기록
└── scripts/              유틸리티 스크립트
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Monorepo | pnpm workspaces |
| Game Engine | Phaser.io 3 |
| Web UI | React + TypeScript + Stitches |
| Web Build | Vite |
| Mobile | React Native (Expo SDK 54) |
| WebView | react-native-webview |
| Navigation | @react-navigation/native-stack |
| Haptics | expo-haptics |

## Team Structure

이 프로젝트는 Claude Code Agent Teams로 운영됩니다.

| Team | Folder | Role |
|------|--------|------|
| Coordinator | `/` (root) | 팀 조율자 — 직접 작업 안 함 |
| PRD | `prd/` | 게임 기획, 요구사항 정의 |
| Game Core | `lib/{game}/` | Phaser.io 게임 로직 개발 |
| Web Frontend | `web/arcade/` | React + Stitches 통합 웹 앱 |
| RN App | `rn/` | React Native WebView 슈퍼앱 |
| Knowledge | `knowledge/` | ADR, 결정, 진행 상황 기록 |

팀 실행: `export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1 && claude` → `/team`
