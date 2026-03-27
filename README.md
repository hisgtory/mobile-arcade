# Mobile Arcade

모바일 미니게임 모노레포. Web(React + TypeScript + Stitches + Phaser.io) + React Native(WebView) 구조.

## Architecture

```
mobile-arcade/
├── lib/{game}/       # 게임 코어 로직 (Phaser.io scenes, shared types)
├── web/{game}/       # 웹 게임 (React + Stitches + lib 사용)
├── {game}/rn/        # RN 앱 (WebView로 web 게임 래핑)
└── prd/              # 게임 기획서
```

### Data Flow

```
lib/{game}  →  web/{game}  →  {game}/rn
(core)        (web app)      (native shell)
```

1. `lib/{game}`: Phaser.io 기반 게임 로직, 씬, 타입 정의
2. `web/{game}`: lib를 import해서 React + Stitches로 웹 게임 빌드
3. `{game}/rn`: 빌드된 웹 게임을 WebView로 표시하는 RN 앱

## Games

| Game | Description | Status |
|------|-------------|--------|
| found3 | 3개씩 같은 그림 퍼즐을 찾아 없애서 모든 타일을 클리어하는 게임 | 🚧 In Progress |

## Team Structure

이 프로젝트는 Claude Code Agent Teams로 운영됩니다.

| Team | Folder | Role |
|------|--------|------|
| Coordinator | `/` (root) | 팀 조율자 - 직접 작업 안 함 |
| PRD | `prd/` | 게임 기획, 요구사항 정의 |
| Game Core | `lib/found3/` | Phaser.io 게임 로직 개발 |
| Web Frontend | `web/found3/` | React + Stitches 웹 게임 |
| RN App | `found3/rn/` | React Native WebView 앱 |

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

## Tech Stack

- **Monorepo**: pnpm workspaces
- **Game Engine**: Phaser.io
- **Web**: React + TypeScript + Stitches
- **Mobile**: React Native + WebView
- **Build**: Vite
