# Mobile Arcade

모바일 미니게임 모노레포. 현재 실행 구조는 `lib/{game}` → `web/arcade` → `rn` 파이프라인 한 줄로 통합되어 있습니다.

## Architecture

```
mobile-arcade/
├── lib/{game}/       # 게임 코어 로직 (Phaser scenes, shared types)
├── web/arcade/       # 통합 웹 앱 (React Router로 모든 게임 서빙)
├── rn/               # Arcade 슈퍼앱 (WebView launcher, 단일 네이티브 앱)
├── prd/              # 게임 기획서
├── knowledge/        # 아키텍처/결정/진행 기록
└── scripts/          # workspace 실행 헬퍼
```

### Pipeline

```
lib/{game}  →  web/arcade  →  rn
(Phaser core)  (Unified Web)  (RN WebView Shell)
```

의존성 방향: `lib` ← `web` ← `rn`.

1. `lib/{game}`: Phaser.io 기반 게임 로직, 씬, 타입 정의
2. `web/arcade`: 각 `lib` 패키지를 조합해 `/games/{game}/v1` 형태의 라우트로 서빙
3. `rn`: `web/arcade`의 게임 경로를 WebView로 로드하는 단일 슈퍼앱

### Legacy Packages (Deprecated)

`web/found3`, `web/crunch3`, `found3/rn`은 초기 전용 패키지로 남아 있으나 **deprecated** 상태입니다.
신규 게임은 반드시 위의 canonical pipeline(`lib/{game}` → `web/arcade` → `rn`)을 따르세요.

## Games

현재 `rn/src/data/games.ts`에 등록된 게임 카탈로그입니다. (단일 기준 — 새 게임 추가 시 여기에 등록)

| ID | Name | Category | Stages | New |
|----|------|----------|--------|-----|
| found3 | Found 3 | puzzle | 5 | ✓ |
| found3-react | Found 3 (React) | puzzle | 5 | ✓ |
| crunch3 | Crunch 3 | puzzle | 5 | ✓ |
| blockrush | Block Rush | puzzle | — | ✓ |
| watersort | Water Sort | puzzle | 5 | ✓ |
| tictactoe | Tic Tac Toe | casual | — | ✓ |
| minesweeper | Minesweeper | puzzle | — | ✓ |
| number10 | Make 10 | puzzle | — | ✓ |
| sudoku | Sudoku | puzzle | 5 | ✓ |
| blockpuzzle | Block Puzzle | puzzle | — | ✓ |
| blockcrush | Block Crush | puzzle | — | ✓ |
| woodoku | Woodoku Blast | puzzle | — | ✓ |
| getcolor | Get Color | puzzle | 10 | ✓ |
| chess | Chess | strategy | — | ✓ |
| nonogram | Nonogram | puzzle | 5 | ✓ |
| hexaaway | Hexa Away | puzzle | 5 | ✓ |

> 표는 `rn/src/data/games.ts`의 `GAMES` 배열에서 발췌합니다. 해당 파일이 단일 진실 공급원(SSoT)이며, 필드 정의(`GameInfo`) 및 카테고리 목록도 같은 파일에서 관리됩니다.

## Getting Started

실제 개발 흐름입니다. 두 개의 프로세스(웹 dev 서버 + Expo)를 동시에 띄우면 됩니다.

```bash
# 1) 의존성 설치 (루트에서 1회)
pnpm install

# 2) 통합 웹 앱 dev 서버 기동 (Vite)
cd web/arcade && pnpm dev
# → http://localhost:5173 등에서 /games/{id}/v1 경로로 각 게임 접근 가능

# 3) 별도 터미널에서 RN 슈퍼앱 기동 (Expo)
cd rn && npx expo start
# → iOS simulator / Android emulator / 실기기(Expo Go 또는 dev build)
```

웹 게임만 확인하려면 2번까지만 실행하면 됩니다. 네이티브 WebView 경로 검증이 필요할 때 3번을 추가합니다.

## RN WebView Dev Host

RN 앱은 WebView로 Vite dev server에 접속합니다. 에뮬레이터/시뮬레이터는 자동 기본값이 적용되며, 실기기 연결 시에만 환경 변수 설정이 필요합니다.

| 환경 | 사용 호스트 | 추가 설정 |
|------|-------------|-----------|
| Android emulator | `10.0.2.2` | 없음 (자동) |
| iOS simulator | `localhost` | 없음 (자동) |
| 실기기 (WiFi) | 로컬 IP / Bonjour | `rn/.env` 필요 |

**실기기 연결 시:**

```bash
# rn/.env.example 참고
echo "EXPO_PUBLIC_DEV_HOST=192.168.1.100" > rn/.env
```

URL 해석 규칙, 프로덕션 호스트, 브릿지 프로토콜 등 자세한 내용은 `rn/CLAUDE.md`의 "Dev URL 해상도" 및 "Message Bridge" 섹션을 참고하세요.

## Development Commands

루트에서 실행하는 표준 명령입니다. CI(`.github/workflows/ci.yml`)도 동일한 명령을 사용합니다.

```bash
# 모든 워크스페이스 패키지 빌드 (build 스크립트가 있는 경우만)
pnpm build

# 타입체크 (emit 없이)
pnpm typecheck

# ESLint 전체 실행
pnpm lint

# Vitest 전체 실행
pnpm test
```

`lint` / `test`는 `scripts/run-workspace-script.cjs`를 통해 스크립트가 정의된 패키지만 순회합니다 (ADR 참고).

### 특정 패키지만 실행

pnpm 필터를 활용해 단일 워크스페이스만 대상으로 할 수 있습니다.

```bash
# web/arcade만 타입체크
pnpm -r --filter @arcade/web typecheck

# lib/found3만 테스트
pnpm -r --filter @arcade/lib-found3 test
```

패키지 이름은 각 워크스페이스의 `package.json` `name` 필드를 참고하세요.

## Adding a New Game

새 게임 `{name}` 추가 시 canonical pipeline을 따릅니다. **햅틱은 필수** — 없는 게임은 미완성으로 간주합니다.

1. **PRD** — `prd/{name}.md` 기획서 작성
2. **Game Core** — `lib/{name}/` 패키지 생성, Phaser 씬 / 타입 / 이벤트 emit 구현
   - 유저 입력 시점에 `this.game.events.emit('event-name')` 발행 (딜레이 금지)
3. **Web** — `web/arcade/src/games/{name}/` 하위에 라우트 + 훅 + 컴포넌트 추가
   - `routes.tsx`에서 `registerRoutes()`로 `/games/{name}/v1` 경로 등록
   - `useGame` 훅에서 lib 이벤트를 받아 `bridge.haptic('event-name')` 호출
4. **RN Catalog** — `rn/src/data/games.ts`의 `GAMES` 배열에 `GameInfo` 추가
   - `id`, `name`, `category`, `webPath`, `icon`, `color` 등
5. **Haptic Patterns** — `rn/src/utils/bridge.ts`의 `HAPTIC_PATTERNS` 맵에 이벤트별 `{ style, count }` 추가
6. **pnpm workspace** — `lib/*`, `web/*`는 루트 `pnpm-workspace.yaml`의 glob에 이미 포함되므로 별도 등록 불필요. 비표준 위치에 패키지를 추가한 경우에만 `pnpm-workspace.yaml` 편집

햅틱 아키텍처(ADR-014) 요약:

- 웹은 **이벤트명만** 전달 (`bridge.haptic('event-name')`)
- 스타일/횟수는 **RN의 `HAPTIC_PATTERNS` 맵이 소유** — 웹에서 결정 금지
- 필수 이벤트: 유저 입력(Heavy×1), 성공 클리어(Heavy×6), 게임 완료(Heavy×3)

자세한 가이드는 루트 `CLAUDE.md`의 "Adding a New Game" / "Haptic Feedback" 섹션, `rn/CLAUDE.md`의 "Haptic Feedback" 섹션 참고.

## CI

`.github/workflows/ci.yml`이 `push to main` 및 모든 PR(opened/synchronize/reopened)에서 다음 단계를 실행합니다.

1. pnpm 9.15.4 + Node.js 20 셋업 (pnpm cache)
2. `pnpm install --frozen-lockfile`
3. `pnpm typecheck`
4. `pnpm build`
5. `pnpm lint`
6. `pnpm test`

로컬에서 같은 명령을 실행해 PR 전에 검증할 수 있습니다.

## Releases & Deployment

### Juicy Fruits — Production API

`juicyfruits/rn` 앱과 `lib/juicyfruits-native`는 라이브 백엔드를 사용합니다.

| Component | Endpoint / Region |
|---|---|
| API Domain | `https://arcade-api.hisgtory.com` |
| Backend | Rust + Axum on AWS Lambda (ARM64 Graviton, `ap-northeast-2`) |
| Edge | CloudFront → Lambda@Edge SigV4 signer (`us-east-1`) |
| Auth | Lambda Function URL `AuthType=AWS_IAM` (직접 호출 시 403) |
| Storage | DynamoDB single-table (`juicy-fruits`) |

푸시 트리거(`main` 브랜치, `api/` 변경분):
- `.github/workflows/deploy-api-lambda.yml` — Rust 바이너리 빌드 + Lambda 배포 + CloudFront invalidation

자세한 인증 layer 설계는 `knowledge/architecture-decisions.md` ADR-020 참고.

### Juicy Fruits — App Build (EAS)

앱 빌드는 `git tag` 또는 GitHub Release 발행으로 트리거됩니다.

| Tag 패턴 | 빌드 |
|---|---|
| `juicy-fruits-android/{semver}` | Android |
| `juicy-fruits-ios/{semver}` | iOS |
| `juicy-fruits-all/{semver}` | 양 플랫폼 동시 |

semver pre-release suffix(`-rc.1`, `-beta.1` 등)가 붙으면 EAS `preview` profile, 없으면 `production` profile로 빌드.

```bash
# Production 출시
git tag juicy-fruits-android/1.0.0
git push origin juicy-fruits-android/1.0.0

# 또는 Release 발행 (gh CLI)
gh release create juicy-fruits-android/1.0.0 \
  --title "Android 1.0.0" --notes "release notes"

# 내부 테스트 (preview)
gh release create juicy-fruits-android/1.0.0-rc.1 --prerelease \
  --title "Android 1.0.0 RC1" --notes "..."
```

워크플로우는 `app.json`의 `expo.version`이 tag suffix와 일치하는지 검증하므로 tag push 전에 버전을 먼저 올려야 합니다.

수동 트리거: Actions 탭 → `EAS Build — Juicy Fruits` → Run workflow (platform/profile 직접 선택).

### 사전 셋업 (한 번만)

GitHub Repo Settings → Secrets and variables → Actions:

| Secret | 용도 | 발급처 |
|---|---|---|
| `EXPO_TOKEN` | EAS 빌드 인증 | https://expo.dev/accounts/hisgtory/settings/access-tokens |
| `AWS_DEPLOY_ROLE_ARN` | Lambda 배포 (OIDC) | AWS IAM (자세한 trust policy는 `deploy-api-lambda.yml` 주석 참고) |
| `AWS_LAMBDA_RUNTIME_ROLE` | Lambda 런타임 role | AWS IAM |

워크플로우 일람:

| Workflow | 트리거 | 용도 |
|---|---|---|
| `ci.yml` | push/PR | 타입/빌드/린트/테스트 |
| `deploy-api-lambda.yml` | `main` push (`api/**` 변경) | Rust API → Lambda |
| `deploy-site.yml` | `main` push (`web/site/**`) | Privacy/Terms 정적 사이트 → Cloudflare Pages |
| `eas-build-juicy-fruits.yml` | `juicy-fruits-*/*` tag push | EAS 빌드 (Android/iOS) |

## Team Structure

| Area | Folder | Role |
|------|--------|------|
| Coordinator | `/` (root) | 전체 구조/워크스페이스 조율 |
| PRD | `prd/` | 게임 기획, 요구사항 정의 |
| Game Core | `lib/{game}/` | Phaser.io 게임 로직 |
| Web Frontend | `web/arcade/` | 통합 웹 앱 + 게임 라우트 |
| RN App | `rn/` | React Native 슈퍼앱 (WebView) |
| Knowledge | `knowledge/` | 구조/결정/진행 기록 |

각 폴더의 `CLAUDE.md`에 상세 가이드가 있습니다.

## Tech Stack

- **Monorepo**: pnpm workspaces (`pnpm@9.15.4`)
- **Game Engine**: Phaser.io
- **Web**: React + TypeScript + Stitches, Vite
- **Mobile**: Expo SDK 54 + React Native 0.81 + react-native-webview
- **Quality**: ESLint 10 + Vitest (루트 flat config, 워크스페이스별 확장)

See `knowledge/architecture-decisions.md` ADR-019 for the dep version policy.

## Docs

- 지식베이스 인덱스: `knowledge/README.md`
- 구조 문서: `knowledge/project-structure.md`
- 기술 결정 (ADR): `knowledge/architecture-decisions.md`
- 변경 이력: `knowledge/decisions.md`
- 진행 타임라인: `knowledge/progress.md`
- RN WebView / 브릿지 / 햅틱 상세: `rn/CLAUDE.md`
