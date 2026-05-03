# Architecture Decision Records (ADR)

## ADR-001: Monorepo Pipeline Structure

### Decision
```
lib/{game}  →  web/arcade  →  rn
(Phaser.io)   (Unified Web)   (RN WebView)
```

### Details
- `lib/{game}`: 순수 게임 로직 (Phaser.io)
- `web/arcade`: 통합 React 웹 앱 (Vite + Stitches + React Router)
- `rn`: 단일 React Native WebView 앱 (Expo)

### Legacy Note
- `web/found3`, `web/crunch3`, `found3/rn` 같은 게임별 앱/웹 패키지는 남아 있을 수 있으나 현재 기준 구조는 아님

### Rationale
코드 재사용 극대화, 게임별 독립 배포. 하나의 게임 로직으로 웹/앱 동시 서빙.

> **Note**: `{game}/rn` 부분은 ADR-015에 의해 superseded — 현재는 단일 `rn/` 슈퍼앱 구조. 파이프라인은 `lib/{game}` → `web/{game}` → `rn` (단일 슈퍼앱)으로 변경됨.

---

## ADR-002: Phaser is Board-Only

### Decision
Phaser는 타일 보드 렌더링 + 인터랙션만 담당. 나머지 UI는 React.

### Scope
- **Phaser**: 타일 배치, 클릭, 매칭 애니메이션
- **React**: HUD, SlotBar, ItemBar, TitleScene, ClearScene

### Rationale
텍스트 렌더링, 반응형 레이아웃, DPR 처리가 React/CSS에서 훨씬 우수. 게임 엔진의 오버헤드 불필요.

---

## ADR-003: WebView Bridge Protocol

### Decision
- Web → RN: `postMessage` (JSON)
- RN → Web: `injectJavaScript`
- ACK 기반 + 3초 타임아웃 + 1회 재전송

### Fallback
- `localStorage` 폴백 (웹 단독 실행 시)

### Rationale
디버깅 용이성 (로그 필수), 안정성 (ACK 확인), 웹 단독 실행 호환.

---

## ADR-004: Expo over Bare RN

### Decision
쌩 React Native 대신 Expo (SDK 54) 선택.

### Rationale
- 빠른 부트스트랩
- Expo Go로 실기기 테스트 즉시 가능
- expo-haptics 등 네이티브 기능 편의 API
- 파산 직전 상황에서 속도 우선

---

## ADR-005: Asset Strategy

### Decision

| Category | Format | Source |
|----------|--------|--------|
| Tiles | 16x16 픽셀 아트 PNG | Alex Kovacsart (CC BY 4.0) |
| Icons | SVG | kocket 프로젝트 스타일 일치 (IconRetry, IconBulb) |
| Shuffle Icon | SVG | Bootstrap shuffle icon + kocket 원형 배경 |
| BGM | MP3 | 로열티프리 (Spring_Loaded_Scoundrel, Spring_Loaded_Waltz) |

### Rationale
라이센스 준수하면서 시각적 일관성 확보. kocket 디자인 시스템을 기준점으로 삼아 통일감 유지.

---

## ADR-006: RN as Game Flow Orchestrator

### Decision
RN이 게임 플로우 오케스트레이터 역할. 타이틀/결과/광고는 네이티브, 게임플레이만 WebView.

### Flow
```
RN 타이틀 → WebView(/stage/:stageId) → STAGE_CLEAR/GAME_OVER → RN 결과 + 광고
```

### Details
- WebView는 `/games/found3/v1/stage/:stageId` URL로 특정 스테이지만 로드
- 게임 종료 시 STAGE_CLEAR / GAME_OVER 브릿지 이벤트를 RN으로 전송
- RN이 결과 화면 렌더링 + 광고 삽입 (AdMob 인터스티셜)

### Rationale
광고 개입 포인트를 네이티브에서 제어하기 좋음. AdMob 인터스티셜을 스테이지 사이에 자연스럽게 삽입 가능. WebView 내에서 광고 SDK를 다루는 복잡성 회피.

---

## ADR-007: Dual Routing Strategy

### Decision
동일 코드베이스에서 환경 분기로 웹/앱 동시 지원.

### Routes
| Route | Environment | Scope |
|-------|-------------|-------|
| `/games/found3/v1` | 웹 브라우저 | 풀 게임 (TitleScreen → PlayingScreen → ClearScreen 전부 웹) |
| `/games/found3/v1/stage/:stageId` | 앱 WebView | 게임 보드만 (`ReactNativeWebView` 감지로 결과 화면 분기) |

### Detection
- `window.ReactNativeWebView` 존재 여부로 앱/웹 환경 감지
- 앱: 게임 종료 시 브릿지로 결과 전송 → RN 네이티브 결과 화면
- 웹: 게임 종료 시 웹 내부 결과 화면 표시

### Rationale
동일 코드베이스로 웹/앱 동시 배포. 심리스 크로스플랫폼 전환 가능. 나중에 앱↔웹 진행 상태 동기화 확장 용이.

---

## ADR-008: Phaser Scale.FIT Confirmed

### Decision
Phaser Scale.FIT 모드 확정. RESIZE는 사용하지 않음.

### Context
- Scale.RESIZE 시도 → flexbox 컨테이너 높이 0 이슈로 검정 화면 발생
- Scale.FIT로 롤백하여 안정적 렌더링 확보

### Trade-off
- FIT 모드는 캔버스 주변에 여백이 생길 수 있음
- 여백은 React CSS(배경색 등)로 관리

### Rationale
안정성 우선. RESIZE의 유연성보다 FIT의 확실한 렌더링이 빠른 출시 기조에 부합.

---

## ADR-009: Arcade Super App over Per-Game Apps

### Decision
게임별 개별 RN 앱(`found3/rn/`)이 아닌 단일 Arcade 슈퍼앱(`rn/`)으로 모든 게임을 서빙.

### Structure
```
rn/ (Arcade 단일 앱)
├── HomeScreen (native 게임 카탈로그)
├── GameScreen (WebView → /games/{game}/v1/)
└── Bridge (게임별 독립 저장소 @arcade/{gameId}/...)
```

### Rationale
- CPI 효율: 1회 UA로 N개 게임 노출
- 데이터 피벗: 앱 업데이트 없이 서버사이드로 게임 추가/제거
- 이탈 방지: 한 게임 질리면 다른 게임으로 전환
- 앱스토어: 리뷰 1번, 이후 웹 배포만

---

## ADR-010: Unified Web Server

### Decision
게임별 Vite 서버(`web/found3/`, `web/crunch3/`)를 `web/arcade/` 하나로 통합.

### Structure
```
web/arcade/
├── src/App.tsx         ← React Router (모든 게임 라우팅)
├── src/games/found3/   ← Found3 컴포넌트/훅
├── src/games/crunch3/  ← Crunch3 컴포넌트/훅
├── src/components/     ← 공유 (GameCanvas)
├── src/styles/         ← 공유 (stitches, global)
└── public/assets/      ← 공유 에셋 (tiles, audio)
```

### Rationale
- 서버 1개로 모든 게임 서빙 (dev/prod 모두)
- 에셋 중복 제거
- 공유 스타일/컴포넌트 재사용
- RN config 단순화 (단일 포트)

---

## ADR-011: WebView Dev URL 해상도 정책

> **이전 결정(Bonjour mDNS 하드코딩)은 폐기됨.** `SG-MacBook-Pro.local` 같은 장비명 하드코딩은 제거.

### Decision
`EXPO_PUBLIC_DEV_HOST` 환경변수로 개발 호스트를 주입. 환경변수가 없을 때는 플랫폼별 안전한 기본값을 사용.

### URL 해상도 규칙

| 환경 | 기본값 | 비고 |
|------|--------|------|
| Android emulator | `10.0.2.2` | AVD 루프백 앨리어스 → 호스트 머신 localhost |
| iOS simulator | `localhost` | 시뮬레이터가 호스트 머신 네트워크 공유 |
| 실기기 (WiFi) | **없음 — 반드시 설정** | `EXPO_PUBLIC_DEV_HOST=<IP>` 필수 |
| Production | N/A | `https://arcade.hisgtory.com` |

### 환경변수 설정 방법

`rn/.env` 파일 생성 (`.env.example` 참고):

```bash
# 실기기 연결 시
EXPO_PUBLIC_DEV_HOST=192.168.1.100

# macOS Bonjour (mDNS 지원 환경)
EXPO_PUBLIC_DEV_HOST=your-mac.local
```

### 오류 처리
- `EXPO_PUBLIC_DEV_HOST` 미설정 시 `console.warn` 출력 (dev 모드만)
- 연결 실패 시 `GameWebView`의 `onError`에서 `console.error` 출력

### Rationale
- 장비명 하드코딩 제거 → 팀 개발, 장비 교체, CI 안정성
- 새 팀원이 `.env.example` 한 줄만 보고 환경 재현 가능
- `vite.config.ts`에 `allowedHosts: true` 설정 유지 필요

---

## ADR-012: Shared Bridge Utility

### Decision
`web/arcade/src/utils/bridge.ts` — 모든 게임이 공유하는 경량 브릿지 유틸.

### Structure
```typescript
stageComplete({ stage, score, cleared }) → postMessage('STAGE_CLEAR' | 'GAME_OVER')
```

### Context
- Found3는 자체 BridgeClient (lib/found3/src/bridge/) 보유 — 기존 유지
- Crunch3, BlockRush, WaterSort, TicTacToe, Make10은 공유 브릿지 사용
- 웹 환경(`isRN=false`)에서는 no-op

### Rationale
- 새 게임 추가 시 브릿지 연동 누락 방지
- Found3의 풀 BridgeClient는 과도 — 대부분 게임은 stageComplete만 필요
- 단순 postMessage 래퍼로 충분

---

## ADR-013: Endless Game Convention (stage: 0)

### Decision
스테이지 없는 endless 게임은 브릿지 메시지에서 `stage: 0`으로 전송.

### Applies To
- Block Rush, Tic Tac Toe, Make 10

### Rationale
- RN GameScreen이 `hasStages` 플래그로 분기
- `stage: 0`은 "스테이지 없음"을 명시적으로 표현
- Found3/Crunch3/WaterSort는 실제 stage 번호 전송

---

## ADR-014: Event-Driven Haptic — RN Owns Haptic Patterns

### Decision
웹은 게임 이벤트명만 브릿지로 전달, RN이 `HAPTIC_PATTERNS` 맵에서 햅틱 패턴(스타일, 횟수)을 결정.

### Structure
```
Web: bridge.haptic('tile-tapped')     → HAPTIC { style: 'tile-tapped' }
Web: bridge.haptic('slot-matched')    → HAPTIC { style: 'slot-matched' }

RN HAPTIC_PATTERNS:
  'tile-tapped'  → Heavy × 1
  'slot-matched' → Heavy × 6 (60ms interval)
  'light'/'medium'/'heavy' → fallback (하위 호환)
```

### Rationale
- 네이티브 동작(햅틱)은 네이티브(RN)가 소유해야 응집도↑ 결합도↓
- 햅틱 튜닝 시 RN 맵만 수정, 웹 코드 변경 불필요
- 새 게임 이벤트 추가 시 RN 맵에 한 줄 추가로 완료
- 하위 호환: 직접 스타일명(light/medium/heavy)도 fallback으로 지원

---

## ADR-015: 단일 RN 슈퍼앱 구조 확정

### Context
초기에는 게임별 독립 RN 앱 (`found3/rn/`)으로 시작했으나, ADR-009에서 슈퍼앱 (`rn/`)으로 전환 결정. 이후 `found3/rn/`과 `rn/`이 공존하는 상태가 지속됨.

### Decision
모든 게임은 단일 RN 슈퍼앱 (`rn/`, @arcade/app)에서 WebView로 로드. 게임별 독립 RN 프로젝트는 만들지 않음. `found3/rn/`은 레거시로 삭제.

### Consequences
- `{game}/rn/` 패턴 폐기 — 새 게임 추가 시 `rn/`에서 WebView URL만 추가하면 됨
- 파이프라인 구조 변경: `lib/{game}` → `web/{game}` → `rn` (단일 슈퍼앱)
- pnpm-workspace.yaml에서 `found3/rn` 제거
- 루트 CLAUDE.md 팀 테이블 `found3/rn/` → `rn/` 반영

### Rationale
ADR-009의 슈퍼앱 결정을 물리적 폴더 구조까지 완전히 반영. 레거시 프로토타입 코드 제거로 혼란 방지.

---

## ADR-016: 게임별 라우트 자체 등록 패턴

### Context
web/arcade App.tsx가 540줄로 비대해짐. 게임 추가마다 import + Route + 컴포넌트 추가가 필요하여 스케일 불가.

### Decision
Express 스타일 `registerRoutes(basePath, routes)` 레지스트리. 각 게임이 `games/{game}/routes.tsx`에서 자체 등록. App.tsx는 수집된 라우트만 렌더링 (~25줄).

### Rejected Alternative
`React.lazy()` + `import.meta.glob` 자동 매핑 — 유저가 명시적으로 거부. "잘못된 매핑이 십상".

### Consequences
- 새 게임 추가 시 `routes.tsx` 생성 + App.tsx에 side-effect import 한 줄만 추가
- App.tsx가 게임 수에 관계없이 일정 크기 유지
- 각 게임이 자기 라우트의 소유권을 가짐 (응집도↑)

---

## ADR-017: Phaser→React 전환 비교 실험

### Context
Phaser canvas에서 디자인 반영 공수가 CSS 대비 3~5배. 디자인 외주 후 반영 용이성이 핵심 요구사항으로 부상. 폰트, 그라데이션, border-radius, 반응형 등 CSS에서 자연스러운 것들이 Phaser에서는 수작업 필요.

### Decision
기존 게임의 React+Stitches 클론을 `{game}-react` 패턴으로 만들어 성능/스타일링 비교. 완전 격리 원칙: 별도 패키지, 별도 라우트, 별도 rn 등록. 공유되는 것은 순수 로직의 물리적 복사본뿐 (import가 아닌 복사).

### 비교 포인트
- FPS, 번들 크기, 애니메이션 부드러움
- 스타일링 유연성, 코드량, 터치 반응성
- Figma→코드 반영 용이성

### Rejected
Phaser + CSS overlay 하이브리드 — 복잡도만 증가, 근본적 해결 아님.

### Consequences
- 결과에 따라 전체 게임 React 전환 or Phaser 유지 결정
- 비교 완료 전까지 두 버전 공존 (Arcade Home에서 나란히 표시)
- 9개 이슈 (#203~#211) 병렬 진행

---

## ADR-018: External HTML Game Embed via iframe (public/ + route wrapper)

### Decision
완성된 단일 HTML 게임(lib 없음)은 `web/arcade/public/{game}/index.html`에 정적으로 배치하고, `src/games/{game}/routes.tsx`에서 `<iframe>`으로 embed하여 기존 라우트 레지스트리에 바인딩한다.

### Context
- 기존 파이프라인: `lib/{game}` (Phaser) → `web/arcade` React 포팅
- NEXUS BRAWL(#248)처럼 **이미 완성된 self-contained HTML**을 받는 경우 Phaser 포팅에 1~2주 소요
- Last Dance 전략(3개월 내 출시) 기준 포팅 비용이 과도함

### Trade-offs
- ✅ 통합 속도: 정적 파일 복사 + 라우트 한 줄 → 수 분
- ✅ 원본 격리: 게임 내부 버그·변경이 arcade 전체 번들에 영향 없음
- ❌ RN bridge(haptic, state save) 미연동 (iframe 경계)
- ❌ Stitches 디자인 시스템 미적용
- ❌ code splitting 이점 없음 (독립 HTML)

### Scope
- **적용**: 외부에서 받은 완성 HTML 프로토타입, 데이터 검증용 게임
- **미적용**: 자체 기획된 핵심 게임 (기존 Phaser/React 파이프라인 유지)

### Path Convention
```
web/arcade/public/{game-id}/index.html      # 원본 (경로 충돌 피하려 /games/ prefix 사용 안 함)
web/arcade/src/games/{game-id}/routes.tsx   # iframe wrapper → /games/{game-id}/v1
rn/src/data/games.ts                         # webPath: '/games/{game-id}/v1'
```

### Consequences
- 성과 데이터 수집 후 Phaser 포팅 여부 결정
- iframe ↔ RN bridge 연동이 필요하면 `window.postMessage` relay 레이어 추가 필요
- 첫 사례: NEXUS BRAWL (#248, PR #249)

---

## ADR-019: Monorepo Dependency Policy

### Context
워크스페이스 전반에 걸쳐 핵심 의존성 버전이 흩어져 있었다. `web/*`는 React 18 계열, `rn`은 React 19 계열을 쓰고, `lib/found3-react`에 로컬 `pnpm.overrides`로 `@types/react@18.2.79`를 고정하는 설정이 있어 설치 시 경고가 발생했다. pnpm은 `pnpm.overrides`를 워크스페이스 루트에서만 존중하므로 하위 패키지의 overrides는 아무 효과 없이 경고만 유발한다.

이슈 #237은 이런 분산 상태를 정리하고, 루트 기준으로 "무엇을 왜 고정하는지" 명확히 하는 정책성 작업이다. 대규모 React 업그레이드는 범위 밖으로 명시됐다.

### Decision

1. **React 18 (web/lib) + React 19 (rn) 공존**
   - RN 0.81은 React 19 요구 (peer dependency)
   - 웹은 React 18 계열에서 안정적으로 동작 중 — 무리한 통일을 하지 않는다
2. **TypeScript는 루트 `pnpm.overrides`로 워크스페이스 전체 핀**
   - 현재 해상도 `5.9.3`을 그대로 고정 (캐럿 특성상 `^5.5.0` 지정자는 5.9.x까지 허용됐음)
   - 향후 드리프트 방지
3. **Vite도 루트 `pnpm.overrides`로 워크스페이스 전체 핀**
   - 현재 해상도 `5.4.21` 고정
4. **`@types/react`는 루트 overrides에 넣지 않음**
   - 웹(`^18.3.0`)과 RN(`^19.1.17`)이 **의도적으로** 분리
   - 루트에서 한 쪽으로 고정하면 반대편 타입이 깨진다
5. **`pnpm.overrides`는 워크스페이스 루트에만 존재**
   - 하위 패키지의 `pnpm` 키는 무효 + 경고 유발 → 금지
   - `lib/found3-react`의 로컬 `pnpm.overrides` 제거, 직접 의존성만 `^18.3.0`으로 정렬

### Version Matrix

| Package | React | ReactDOM | React Native | @types/react | TypeScript | Vite |
|---------|-------|----------|--------------|--------------|------------|------|
| `web/arcade` | `^18.3.0` | `^18.3.0` | — | `^18.3.0` | `5.9.3` (pinned) | `5.4.21` (pinned) |
| `web/found3` | `^18.3.0` | `^18.3.0` | — | `^18.3.0` | `5.9.3` (pinned) | `5.4.21` (pinned) |
| `web/crunch3` | `^18.3.0` | `^18.3.0` | — | `^18.3.0` | `5.9.3` (pinned) | `5.4.21` (pinned) |
| `lib/found3-react` | `^18.3.0` | — | — | `^18.3.0` | `5.9.3` (pinned) | — |
| `rn` | `19.1.0` | — | `0.81.5` | `^19.1.17` | `5.9.3` (pinned) | — |

### Trade-offs
- **Split `@types/react`**: 공용 라이브러리 코드를 쓸 때 기여자는 React 18의 API surface를 **최소 공통 분모**로 가정하고 작성해야 한다 (e.g. React 19 전용 훅/API 사용 금지).
- **TypeScript/Vite를 루트에서 고정**: 하위 패키지가 `devDependencies`에 느슨한 캐럿을 유지해도 실제 설치 버전이 하나로 수렴 → lock 안정성↑. 단, 버전을 올릴 땐 루트 overrides를 수정해야 함.
- **React 공존**: 타입 공유 불가(의도), 런타임은 각자 번들이라 충돌 없음.

### Rationale
- 설치 경고 제거: 하위 `pnpm.overrides`가 만들던 경고 사라짐
- 드리프트 방지: TS/Vite 패치 릴리스가 어느 패키지에서 먼저 튀어오르는 상황을 원천 차단
- 이슈 #237의 "루트 기준 정책" 요구 충족
- React 대규모 업그레이드는 별도 이슈로 분리 (이 ADR의 비범위)

---

## ADR-020: arcade-api 인증 layer — Lambda@Edge 제거 옵션

**Status**: Proposed — 결정 보류 (옵션 비교용 문서)
**Date**: 2026-05-03
**Related**: 현재 production 구조는 옵션 A (Edge SigV4)로 동작 중

### Context

`arcade-api` (Rust + Lambda)는 `arcade-api.hisgtory.com` 도메인으로 노출된다.
보안 요구는 단순함: **Lambda Function URL이 인터넷에 직접 노출되면 안 된다.**
Lambda hostname을 알아낸 누군가가 우리 CloudFront/Cloudflare를 우회해
바로 호출하면 비용 폭탄·DoS·DDB 폭주가 가능하므로, 정상 경로(CF→Lambda)
이외의 호출은 Lambda 단에서 차단되어야 한다.

현재 production 구조 (옵션 A):

```
브라우저 ─https─▶ CloudFront ─origin-request 훅─▶ Lambda@Edge(JS, us-east-1)
                                                     │ SigV4 서명 추가 (~2ms)
                                                     ▼
                                                Lambda Function URL (AuthType=AWS_IAM)
                                                     │ IAM 검증 통과
                                                     ▼
                                                Rust Lambda (ap-northeast-2)
```

### Why Edge가 도입됐나 (배경)

1. Lambda Function URL `AuthType=AWS_IAM` → SigV4 서명 요청만 받음
2. CloudFront OAC가 자동 서명을 해 주는 기능이 있지만 **POST body 서명에 알려진 버그**가 있어 503/403 발생
3. 그래서 origin-request 시점에 JS Lambda@Edge가 끼어들어 SigV4를 직접 서명
4. 본 Edge 함수는 **비즈니스 로직 0줄**, 순수 SigV4 헤더 4개 추가만 함

문제점: Edge는 본질적 보안이 아니다. 보안의 본질은 "CF에서만 받기"이지
"SigV4 검증" 자체가 아니다. SigV4는 그 잠금을 풀기 위한 우회로일 뿐.

### Options

#### A. 현재 유지 — Lambda@Edge SigV4 서명 (status quo)

```
CF ─Lambda@Edge SigV4─▶ Function URL (AWS_IAM) ─▶ Lambda
```

| 항목 | 값 |
|---|---|
| 추가 비용 | ~$0.60 / 1M req (Lambda@Edge 호출) |
| 추가 latency | +2~5ms (검증 결과 cold 62ms / warm 2.23ms) |
| 운영 복잡도 | 高 — Edge 코드 + IAM role + 권한 + 별도 region 배포 |
| 보안 | CF→Lambda IAM 검증으로 직접 호출 불가 |
| 글로벌 latency | CloudFront anycast 활용 |

#### B. Function URL public + CloudFront Custom Origin Header secret

```
CF ──[Origin Custom Header: X-Origin-Secret: <s>]──▶ Function URL (NONE) ─▶ Lambda
                                                                              │
                                                                              ▼
                                          Rust 미들웨어가 X-Origin-Secret 검증, 불일치 시 401
```

| 항목 | 값 |
|---|---|
| 추가 비용 | $0 |
| 추가 latency | 0ms |
| 운영 복잡도 | 低 — Rust에 미들웨어 1개, secret rotate 가능 |
| 보안 | CF가 origin에 헤더 주입 → CF 우회 시 secret 모르므로 401. secret이 유출되면 우회 가능하나 rotate로 회복 가능 |
| 글로벌 latency | CloudFront anycast 활용 |

> Lambda Function URL의 `AuthType=NONE`이지만 hostname이 obscure(랜덤 prefix)하고
> CF 외에는 secret 헤더를 못 만드므로 직접 호출은 401에서 막힌다.

#### C. API Gateway HTTP API → Lambda

```
브라우저 ─https─▶ arcade-api.hisgtory.com ─▶ API Gateway HTTP API ─▶ Lambda
                                                  │ (CloudFront 제거 가능)
                                                  ▼
                              내장: throttle / WAF / IAM / custom domain
```

| 항목 | 값 |
|---|---|
| 추가 비용 | $1.00 / 1M req (HTTP API) |
| 추가 latency | +5~10ms (region 고정) |
| 운영 복잡도 | 中 — 콘솔/IaC로 관리, Edge 함수 없음 |
| 보안 | API GW가 IAM/throttle/WAF 직접 처리. Lambda Function URL 자체를 끔 |
| 글로벌 latency | CloudFront 없이 region 고정 (ap-northeast-2). 한국 유저 비중 높으면 무영향. 글로벌이면 latency 증가 |

#### D. Function URL public + Cloudflare WAF / IP allowlist

```
Cloudflare DNS(orange) ─WAF─▶ Function URL (NONE) ─▶ Lambda
```

| 항목 | 값 |
|---|---|
| 추가 비용 | $0 |
| 추가 latency | 0ms |
| 운영 복잡도 | 低 |
| 보안 | **약함** — Lambda hostname 알려지면 WAF/Cloudflare 우회 가능. Free 플랜은 WAF 룰 제한적 |
| 글로벌 latency | Cloudflare anycast 활용 |

### Trade-off Summary

| 옵션 | 비용/1M | latency | 복잡도 | 보안 회복력 | Edge 제거 |
|---|---|---|---|---|---|
| A. 현재 (Edge SigV4) | $0.60 | +2~5ms | 高 | IAM 검증 — 견고 | — |
| **B. Custom Origin Header** | **$0** | **0ms** | **低** | secret rotate 가능 — 충분 | **O** |
| C. API Gateway HTTP API | $1.00 | +5~10ms | 中 | API GW IAM — 견고 | O |
| D. Cloudflare WAF | $0 | 0ms | 低 | hostname 노출 시 약함 | O |

### Recommendation

**옵션 B로 마이그레이션 권장.** 근거:

1. **3개월 데드라인** — Edge 코드/role/권한 운영 부담 제거
2. **비용 0** — 트래픽 증가 시 Edge 비용도 선형 증가하지만 B는 그대로 0
3. **회복력** — secret이 유출돼도 CloudFront `OriginCustomHeaders` 한 번 갱신으로 즉시 차단
4. **본질 일치** — 보안 의도 = "CF에서만 받기" → CF가 헤더 주입하는 방식이 의도와 가장 직접적
5. **CloudFront 유지** — 글로벌 anycast / SSL / 캐시 가능성 보존

### Migration Plan (옵션 B 채택 시)

1. Rust에 origin-secret 미들웨어 추가 (헤더 누락/불일치 → 401)
2. 환경변수 `ORIGIN_SECRET` 주입 (Lambda env var, GitHub Actions secret)
3. CloudFront distribution origin 설정 — `OriginCustomHeaders.X-Origin-Secret` 추가
4. Lambda Function URL `AuthType=AWS_IAM → NONE`
5. Lambda resource policy에 public invoke statement 추가 (`lambda:InvokeFunctionUrl`, principal=`*`, condition=`FunctionUrlAuthType=NONE`)
6. Lambda@Edge 제거:
   - CloudFront `LambdaFunctionAssociations` 삭제
   - Lambda@Edge 함수 삭제 (us-east-1)
   - IAM role `arcade-api-edge-role` 삭제
   - `api/edge/`, `api/scripts/edge-signer-bootstrap.sh` 디렉토리 삭제
7. 검증: GET / POST 정상 200, secret 없이 직접 Lambda hostname 호출 시 401

### Other cleanup (옵션 무관, 별건)

- `api/cloudflare/` — Cloudflare Containers 시도 잔재. 전부 dead code, 삭제
- `.github/workflows/deploy-api.yml` — 위 dead code 배포용, 삭제
- `.github/workflows/deploy-site.yml` — 유지 (web/site Cloudflare Pages 배포)

### Decision

보류. 사용자 결정 후 ADR을 Accepted로 갱신하고 Migration Plan 실행.

