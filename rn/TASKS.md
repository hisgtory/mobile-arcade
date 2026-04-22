# RN App — Tasks

## Project Init

- [x] Expo 프로젝트 생성 (SDK 54, TypeScript)
- [x] package.json 설정 (`@arcade/app`)
- [x] app.json 설정 (com.hisgtory.arcade)
- [x] metro.config.js, babel.config.js, tsconfig.json 설정
- [x] 핵심 의존성 설치 (react-navigation, webview, expo-haptics, async-storage)

## Navigation

- [x] Stack Navigator 설정 (Home → Game)
- [x] RootStackParamList 타입 정의
- [x] SafeAreaProvider 적용

## Screens

- [x] HomeScreen — 게임 목록, Featured 배너, New Games, 카테고리 필터
- [x] GameScreen — WebView 게임 플레이, 스테이지 로딩, 결과 화면 (Clear/Over)

## Components

- [x] GameWebView — WebView wrapper + BridgeHost 연결
- [x] GameCard — 게임 카드 UI (normal/small 사이즈)
- [x] FeaturedBanner — 추천 게임 배너

## Bridge

- [x] BridgeHost 클래스 (게임-agnostic 메시지 프로토콜)
- [x] STATE_SAVE / STATE_LOAD (AsyncStorage)
- [x] LEADERBOARD_SAVE / LEADERBOARD_LOAD
- [x] AD_REQUEST (mock — rewarded=true)
- [x] HAPTIC 핸들러 (HAPTIC_PATTERNS 맵 기반)
- [x] ITEM_USED 핸들러
- [x] STAGE_CLEAR / GAME_OVER 핸들러 + onStageComplete 콜백
- [x] 응답 프로토콜 (`window.__bridgeReceive`)

## Config

- [x] getGameUrl() — dev (Vite dev server) / prod (arcade.hisgtory.com) URL 분기
- [x] 플랫폼별 dev host 기본값 (Android emulator, macOS Bonjour)

## Game Registry

- [x] GameInfo 타입 + games.ts 레지스트리
- [x] Found3, Crunch3, BlockRush, WaterSort, TicTacToe, Number10 등록
- [x] 카테고리 필터 (puzzle, action, casual, card, strategy)
- [x] getFeaturedGame, getNewGames, getGamesByCategory 유틸

## Haptic (ADR-014)

- [x] Found3 햅틱 (tile-tapped, slot-matched)
- [x] Crunch3 햅틱 (tile-swapped, match-cleared)
- [x] BlockRush 햅틱 (piece-placed, line-cleared)
- [x] WaterSort 햅틱 (tube-tapped, tube-solved)
- [x] TicTacToe 햅틱 (cell-tapped, round-end, grid-upgrade)
- [x] Number10 햅틱 (drag-start, cells-cleared)
- [x] Fallback 패턴 (light, medium, heavy)

## Production / Build

- [ ] iOS prebuild (`expo prebuild --platform ios`)
- [ ] Android prebuild (`expo prebuild --platform android`)
- [ ] 앱 아이콘 설정
- [ ] 스플래시 스크린 설정
- [ ] 프로덕션 웹 번들 로딩 (오프라인 번들 또는 CDN)
- [ ] 실제 광고 SDK 연동 (AD_REQUEST mock 교체)
- [ ] EAS Build 설정
- [ ] TestFlight / Play Store 배포

## TODO

- [ ] 새 게임 추가 시 games.ts + HAPTIC_PATTERNS 업데이트
