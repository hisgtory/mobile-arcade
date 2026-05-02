# Juicy Fruits - Standalone Native Game

이 프로젝트는 기존 아케이드 통합 앱에서 `juicyfruits` 게임을 별도의 독립된 애플리케이션으로 분리하여 더 빠른 릴리즈와 집중된 개발을 가능하게 하기 위해 시작되었습니다.

## 🚀 주요 특징
- **독립 앱**: `com.hisgtory.juicyfruits` 패키지명을 사용하는 독립적인 Android/iOS 앱
- **Native Implementation**: WebView 없이 순수 React Native/Expo 환경에서 `@arcade/lib-juicyfruits-native` 라이브러리를 사용하여 구현
- **상점 및 코인**: 게임 플레이를 통해 얻은 코인으로 아이템을 구매하는 경제 시스템
- **수익화**: AdMob 배너 및 보상형 광고(2배 보상) 연동 완료
- **몰입형 경험**: Android full-screen(Immersive) 모드 및 리드미컬한 햅틱 피드백 적용

## 🛠 시작하기

### 사전 준비
- Node.js & pnpm
- Expo Go 앱 (테스트용) 또는 Android/iOS 개발 환경

### 실행 방법
`juicyfruits/rn` 디렉토리로 이동하여 실행합니다:
```bash
cd juicyfruits/rn
pnpm install
pnpm start
```

## 🏗 프로젝트 구조
- `src/App.tsx`: 메인 진입점 및 네비게이션 설정
- `src/screens/`: 각 화면(Home, Game, Result) 컴포넌트
- `@arcade/lib-juicyfruits-native`: 게임 엔진 및 UI 컴포넌트 라이브러리 (모노레포 내 공유 패키지)

## 📦 종속성
- `expo`: 프레임워크
- `react-native-google-mobile-ads`: 광고 SDK
- `expo-av`: 오디오 시스템
- `@arcade/lib-juicyfruits-native`: 핵심 게임 로직 및 UI

---
© 2026 Hisgtory Mobile Arcade
