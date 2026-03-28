# Architecture Decision Records (ADR)

## ADR-001: Monorepo Pipeline Structure

### Decision
```
lib/{game}  →  web/{game}  →  {game}/rn
(Phaser.io)   (React+Stitches) (RN WebView)
```

### Details
- `lib/{game}`: 순수 게임 로직 (Phaser.io)
- `web/{game}`: React 웹 래핑 (Vite + Stitches)
- `{game}/rn`: React Native WebView 래핑 (Expo)

### Rationale
코드 재사용 극대화, 게임별 독립 배포. 하나의 게임 로직으로 웹/앱 동시 서빙.

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

## ADR-011: Bonjour mDNS for Dev Connectivity

### Decision
개발 환경에서 IP 하드코딩 대신 Bonjour hostname(`SG-MacBook-Pro.local`) 사용.

### Rationale
- WiFi/장소 변경 시 IP 수동 변경 불필요
- Apple 기기 간 자동 해석 (mDNS)
- `vite.config.ts`에 `allowedHosts: true` 필요
