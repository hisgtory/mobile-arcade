# Found3 Standalone App

## 배경 (Background)
이 프로젝트는 기존 아케이드 통합 앱에서 `found3` 게임을 별도의 독립된 애플리케이션으로 분리하여 더 빠른 릴리즈와 집중된 개발을 가능하게 하기 위해 시작되었습니다.

- **목적**: `found3` 게임의 독립적인 시장 출시 및 업데이트 사이클 단축
- **기술 스택**: React Native (Expo), TypeScript
- **공통 로직**: `@arcade/lib-found3-react`를 사용하여 게임 코어 로직 공유

## 시작하기 (Getting Started)

### 사전 요구 사항
- `pnpm` 설치 필요
- iOS/Android 개발 환경 (Xcode, Android Studio 등)

### 설치 및 실행

1. **의존성 설치**
   프로젝트 루트 디렉토리에서 다음 명령어를 실행합니다:
   ```bash
   pnpm install
   ```

2. **애플리케이션 실행**
   `found3/rn` 디렉토리로 이동하여 실행합니다:
   ```bash
   cd found3/rn
   pnpm start
   ```
   또는 시뮬레이터로 직접 실행:
   ```bash
   pnpm ios
   # 또는
   pnpm android
   ```

## 프로젝트 구조
- `src/App.tsx`: 메인 진입점 및 게임 보드 통합
- `@arcade/lib-found3-react`: 게임 엔진 및 UI 컴포넌트 라이브러리 (모노레포 내 공유 패키지)
