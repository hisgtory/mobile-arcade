# Mobile Arcade

모바일 미니게임 모노레포. 게임 코어는 `lib/*`, 웹 서빙은 `web/arcade`, 모바일 앱 셸은 `rn`이 담당합니다.

## Architecture

```
mobile-arcade/
├── lib/{game}/       # 게임 코어 로직 (Phaser scenes, shared types)
├── web/arcade/       # 통합 웹 앱 (React Router로 여러 게임 서빙)
├── web/found3/       # found3 전용 웹 앱
├── web/crunch3/      # crunch3 전용 웹 앱
├── rn/               # 단일 Arcade RN 앱 (WebView launcher)
├── found3/rn/        # deprecated: 초기 found3 전용 RN 앱
├── prd/              # 게임 기획서
└── knowledge/        # 아키텍처/결정/진행 기록
├── lib/{game}/       # 게임 코어 로직 (Phaser.io scenes, shared types)
├── web/{game}/       # 웹 게임 (React + Stitches + lib 사용)
├── rn/               # RN 슈퍼앱 (WebView로 web 게임 래핑)
└── prd/              # 게임 기획서
```

### Current Flow

```
lib/{game}  →  web/arcade  →  rn
(core)        (unified web)   (native shell)
```

1. `lib/{game}`: Phaser 기반 게임 로직, 씬, 타입 정의
2. `web/arcade`: 각 `lib` 패키지를 조합해 웹 게임 라우트를 제공
3. `rn`: `web/arcade`의 게임 경로를 WebView로 로드하는 단일 네이티브 앱

`web/found3`, `web/crunch3`, `found3/rn`은 남아 있지만 현재 기준 구조의 중심은 아닙니다.
lib/{game}  →  web/{game}  →  rn
(core)        (web app)      (native shell, 슈퍼앱)
```

1. `lib/{game}`: Phaser.io 기반 게임 로직, 씬, 타입 정의
2. `web/{game}`: lib를 import해서 React + Stitches로 웹 게임 빌드
3. `rn`: 빌드된 웹 게임을 WebView로 표시하는 RN 슈퍼앱

## Games

| Game | Description | Status |
|------|-------------|--------|
| found3 | 3개씩 같은 그림 퍼즐을 찾아 없애서 모든 타일을 클리어하는 게임 | 🚧 In Progress |

## Team Structure

이 프로젝트는 역할별 폴더를 기준으로 운영됩니다.

| Area | Folder | Role |
|------|--------|------|
| Coordinator | `/` (root) | 전체 구조/워크스페이스 조율 |
| PRD | `prd/` | 게임 기획, 요구사항 정의 |
| Game Core | `lib/*` | Phaser.io 게임 로직 개발 |
| Web Frontend | `web/arcade/` | 통합 웹 앱과 라우팅 |
| RN App | `rn/` | React Native Arcade 앱 |
| Knowledge | `knowledge/` | 구조, 결정, 진행 기록 |
| Game Core | `lib/found3/` | Phaser.io 게임 로직 개발 |
| Web Frontend | `web/found3/` | React + Stitches 웹 게임 |
| RN App | `rn/` | React Native WebView 슈퍼앱 |

## Getting Started

```bash
# Install dependencies
pnpm install

# Enable Agent Teams
export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1

# Start Claude and create team
claude
/team
```

## Development Commands

```bash
# Build all packages that define a build script
pnpm build

# Type-check all workspace packages without emitting build artifacts
pnpm typecheck

# Lint all packages
# Note: this currently fails until at least one workspace package defines a lint script
pnpm lint

# Test all packages
# Note: this currently fails until at least one workspace package defines a test script
pnpm test
```

## Tech Stack

- **Monorepo**: pnpm workspaces
- **Game Engine**: Phaser.io
- **Web**: React + TypeScript + Stitches
- **Mobile**: React Native + WebView
- **Build**: Vite

## Docs

- 지식베이스 인덱스: `knowledge/README.md`
- 구조 문서: `knowledge/project-structure.md`
- 기술 결정: `knowledge/architecture-decisions.md`
- 변경 이력: `knowledge/decisions.md`
