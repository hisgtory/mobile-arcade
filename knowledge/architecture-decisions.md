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
