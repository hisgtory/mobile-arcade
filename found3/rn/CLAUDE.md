# RN App Team — found3

## Role: React Native App Developer

`web/found3`의 빌드 결과물을 WebView로 래핑하여 네이티브 앱을 만듭니다.

## Tech Stack

- **React Native** — 네이티브 앱 프레임워크
- **react-native-webview** — WebView 컴포넌트
- **TypeScript**

## Folder Structure

```
found3/rn/
├── src/
│   ├── App.tsx           # Root component
│   ├── screens/
│   │   └── GameScreen.tsx # WebView 게임 화면
│   ├── components/
│   │   └── GameWebView.tsx # WebView wrapper
│   └── utils/
│       └── bridge.ts     # WebView ↔ RN 메시지 브릿지
├── index.js
├── app.json
├── package.json
├── tsconfig.json
├── metro.config.js
├── ios/
└── android/
```

## Responsibilities

### DO

- React Native 프로젝트 설정
- WebView로 `web/found3` 빌드 로드
- WebView ↔ RN 메시지 브릿지 (postMessage)
- 네이티브 기능 연동 (진동, 사운드 등)
- iOS/Android 빌드 설정
- 스플래시 스크린, 앱 아이콘

### DON'T

- 게임 로직 직접 구현 금지
- 웹 UI 코드 금지
- lib/ 또는 web/ 폴더 수정 금지

## WebView Integration

```typescript
// web/found3 빌드를 로드하는 방식
// Option A: 로컬 번들 (오프라인 지원)
<WebView source={require('./assets/web/index.html')} />

// Option B: 개발 서버 (개발 중)
<WebView source={{ uri: 'http://localhost:5173' }} />
```

## Message Bridge

```typescript
// RN → WebView
webViewRef.current.postMessage(JSON.stringify({ type: 'PAUSE' }));

// WebView → RN (window.ReactNativeWebView.postMessage)
onMessage={(event) => {
  const data = JSON.parse(event.nativeEvent.data);
  // { type: 'GAME_CLEAR', score: 1500 }
}}
```

## Reference

- `prd/found3.md`: 게임 기획서
- `web/found3/`: 웹 게임 빌드
- TASKS.md: 현재 작업 목록
