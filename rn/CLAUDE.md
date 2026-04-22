# RN App Team — Arcade Super App

## Role: React Native App Developer

모든 게임의 웹 빌드(`web/{game}`)를 WebView로 래핑하여 단일 네이티브 앱(Arcade)으로 제공합니다.

## Tech Stack

- **Expo SDK 54** — 네이티브 앱 프레임워크 (Managed workflow)
- **React Native 0.81** — UI 런타임
- **react-native-webview** — WebView 컴포넌트
- **@react-navigation/native-stack** — 스크린 내비게이션
- **expo-haptics** — 햅틱 피드백
- **@react-native-async-storage/async-storage** — 로컬 저장소
- **TypeScript**

## App Identity

- Package: `@arcade/app`
- iOS Bundle ID: `com.hisgtory.arcade`
- Android Package: `com.hisgtory.arcade`
- App Name: `Arcade`

## Folder Structure

```
rn/
├── src/
│   ├── App.tsx              # Root — NavigationContainer + Stack
│   ├── screens/
│   │   ├── HomeScreen.tsx   # 게임 목록 (Featured, New, Category)
│   │   └── GameScreen.tsx   # WebView 게임 플레이 + 결과 화면
│   ├── components/
│   │   ├── GameWebView.tsx  # WebView wrapper + BridgeHost 연결
│   │   ├── GameCard.tsx     # 게임 카드 UI
│   │   └── FeaturedBanner.tsx # 추천 게임 배너
│   ├── data/
│   │   └── games.ts         # 게임 목록 레지스트리 (GameInfo[])
│   └── utils/
│       ├── bridge.ts        # BridgeHost — WebView ↔ RN 메시지 브릿지
│       └── config.ts        # getGameUrl() — dev/prod URL 결정
├── app.json
├── package.json
├── tsconfig.json
├── metro.config.js
├── babel.config.js
├── ios/                     # (prebuild 후 생성)
└── android/                 # (prebuild 후 생성)
```

## Responsibilities

### DO

- Expo/React Native 프로젝트 설정 및 유지
- WebView로 `web/{game}` 빌드 로드 (GameWebView)
- WebView ↔ RN 메시지 브릿지 (BridgeHost)
- 네이티브 기능 연동 (햅틱, 저장소, 광고 등)
- 새 게임 등록 (`data/games.ts`에 GameInfo 추가)
- 햅틱 패턴 관리 (`bridge.ts`의 HAPTIC_PATTERNS)
- iOS/Android 빌드 설정
- 스플래시 스크린, 앱 아이콘
- HomeScreen UI (게임 목록, 카테고리, 배너)

### DON'T

- 게임 로직 직접 구현 금지
- 웹 UI 코드 금지
- `lib/` 또는 `web/` 폴더 수정 금지

## WebView Integration

```typescript
// dev: Vite dev server 접속
// prod: https://arcade.hisgtory.com{webPath}
// config.ts의 getGameUrl()이 자동 분기

<GameWebView gameId="found3" webPath="/games/found3/v1" stageId={1} />
```

### Dev URL 해상도 (ADR-011)

| 환경 | 사용되는 호스트 | 설정 방법 |
|------|----------------|-----------|
| Android emulator | `10.0.2.2` (자동) | 설정 불필요 |
| iOS simulator | `localhost` (자동) | 설정 불필요 |
| 실기기 (WiFi) | **없음 — 반드시 설정** | `rn/.env` 파일 생성 |

**실기기 연결 시 `rn/.env` 파일 생성:**

```bash
# 머신의 로컬 IP 주소 또는 Bonjour hostname
EXPO_PUBLIC_DEV_HOST=192.168.1.100
# 또는
EXPO_PUBLIC_DEV_HOST=your-mac.local
```

`rn/.env.example`을 참고하세요.

## Message Bridge (BridgeHost)

게임-agnostic 양방향 메시지 프로토콜. 스토리지 키는 `@arcade/{gameId}/` 프리픽스.

### 지원 메시지 타입

| Request (Web → RN) | Response (RN → Web) | 설명 |
|---------------------|----------------------|------|
| STATE_SAVE | ACK | 게임 상태 저장 |
| STATE_LOAD | STATE_LOADED | 게임 상태 불러오기 |
| LEADERBOARD_SAVE | ACK | 리더보드 기록 저장 |
| LEADERBOARD_LOAD | LEADERBOARD_LOADED | 리더보드 불러오기 |
| AD_REQUEST | AD_COMPLETE | 광고 요청 (현재 mock) |
| HAPTIC | ACK | 햅틱 피드백 트리거 |
| ITEM_USED | ACK | 아이템 사용 기록 |
| STAGE_CLEAR | ACK | 스테이지 클리어 |
| GAME_OVER | ACK | 게임 오버 |

```typescript
// Web → RN (window.ReactNativeWebView.postMessage)
// RN → Web (webViewRef.injectJavaScript → window.__bridgeReceive)
```

## Haptic Feedback (ADR-014)

**웹은 이벤트명만 전달, RN이 패턴 결정.**

`bridge.ts`의 `HAPTIC_PATTERNS` 맵에서 이벤트명 → `{ style, count }` 매핑.

### 현재 등록된 패턴

| 게임 | 이벤트명 | 패턴 |
|------|----------|------|
| Found3 | `tile-tapped`, `slot-matched` | Heavy×1, Heavy×6 |
| Crunch3 | `tile-swapped`, `match-cleared` | Heavy×1, Heavy×6 |
| BlockRush | `piece-placed`, `line-cleared` | Heavy×1, Heavy×6 |
| WaterSort | `tube-tapped`, `tube-solved` | Heavy×1, Heavy×6 |
| TicTacToe | `cell-tapped`, `round-end`, `grid-upgrade` | Heavy×1, Heavy×3, Heavy×3 |
| Number10 | `drag-start`, `cells-cleared` | Heavy×1, Heavy×6 |

### 새 게임 햅틱 추가 방법

`HAPTIC_PATTERNS`에 한 줄 추가:
```typescript
'event-name': { style: Haptics.ImpactFeedbackStyle.Heavy, count: 1 },
```

## 새 게임 등록

1. `data/games.ts`의 `GAMES` 배열에 `GameInfo` 추가
2. `bridge.ts`의 `HAPTIC_PATTERNS`에 게임 햅틱 이벤트 추가

## Reference

- `prd/`: 게임 기획서
- `web/{game}/`: 웹 게임 빌드
- `knowledge/architecture-decisions.md`: ADR 기록
- TASKS.md: 현재 작업 목록
