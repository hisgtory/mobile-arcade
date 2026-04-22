# Mobile Arcade

모바일 미니게임 모노레포. Web(React + TypeScript + Stitches + Phaser.io) + React Native(WebView) 구조.

## Architecture

```
mobile-arcade/
├── lib/{game}/       # 게임 코어 로직 (Phaser.io scenes, shared types)
├── web/{game}/       # 웹 게임 (React + Stitches + lib 사용)
├── rn/               # RN 슈퍼앱 (WebView로 web 게임 래핑)
└── prd/              # 게임 기획서
```

### Data Flow

```
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

이 프로젝트는 Claude Code Agent Teams로 운영됩니다.

| Team | Folder | Role |
|------|--------|------|
| Coordinator | `/` (root) | 팀 조율자 - 직접 작업 안 함 |
| PRD | `prd/` | 게임 기획, 요구사항 정의 |
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

## RN WebView 개발 설정

RN 앱은 WebView로 Vite dev server에 접속합니다. 환경별 설정:

| 환경 | 호스트 | 추가 설정 |
|------|--------|-----------|
| Android emulator | `10.0.2.2` (자동) | 없음 |
| iOS simulator | `localhost` (자동) | 없음 |
| 실기기 (WiFi) | 직접 지정 필요 | `rn/.env` 생성 필요 |

**실기기 연결 시:**

```bash
# rn/.env 파일 생성 (rn/.env.example 참고)
echo "EXPO_PUBLIC_DEV_HOST=192.168.1.100" > rn/.env

# Vite dev server 시작 (web/arcade 기준)
cd web/arcade && pnpm dev

# Expo 시작
cd rn && npx expo start
```

> **Note**: `EXPO_PUBLIC_DEV_HOST` 미설정 시 dev 콘솔에 경고 메시지가 출력됩니다. 에뮬레이터/시뮬레이터에서는 자동 기본값이 적용되므로 정상 동작합니다.

## Tech Stack

- **Monorepo**: pnpm workspaces
- **Game Engine**: Phaser.io
- **Web**: React + TypeScript + Stitches
- **Mobile**: React Native + WebView
- **Build**: Vite
