# Project Structure

현재 기준 프로젝트 구조 문서. 이 문서는 실제 코드 구조를 기준으로 유지한다.

## Summary

이 저장소는 `pnpm` 워크스페이스 기반 모노레포다.

현재의 주 실행 구조:

```text
lib/{game}  →  web/arcade  →  rn
```

- `lib/{game}`: 게임별 Phaser 코어
- `web/arcade`: 여러 게임을 한 웹 앱으로 서빙하는 통합 웹 프론트엔드
- `rn`: 단일 Arcade React Native 앱. WebView로 웹 게임을 실행

## Top-Level Folders

```text
mobile-arcade/
├── lib/
├── web/
├── rn/
├── found3/
├── prd/
├── knowledge/
├── scripts/
├── package.json
└── pnpm-workspace.yaml
```

## Folder Roles

### `lib/`

게임별 코어 패키지 모음.

- 각 패키지는 보통 `src/`, `dist/`, `package.json`, `tsconfig.json`을 가진다.
- Phaser 씬, 게임 상태, 보드 로직, 공용 타입을 담는다.
- 웹 앱은 이 패키지들을 import해서 사용한다.

예시:

- `lib/found3`
- `lib/crunch3`
- `lib/blockrush`
- `lib/watersort`
- `lib/candyfriends`
- `lib/tictactoe`

### `web/`

웹 플레이어 계층.

#### `web/arcade/`

현재 기준 메인 웹 앱.

- React Router로 여러 게임 경로를 한 앱에서 처리
- 각 게임별 UI 훅과 컴포넌트는 `src/games/{game}` 아래에 위치
- `@arcade/lib-*` 패키지를 직접 소비
- RN 앱이 WebView로 주로 여기를 로드

대표 경로:

- `/games/found3/v1`
- `/games/crunch3/v1`
- `/games/blockrush/v1/play`

#### `web/found3/`, `web/crunch3/`

게임별 전용 웹 앱.

- 초기 또는 개별 개발용으로 남아 있는 패키지
- 현재 구조의 중심은 `web/arcade`다

### `rn/`

현재 기준 단일 React Native 앱.

- 홈 화면에서 게임 카탈로그를 보여줌
- 선택된 게임을 WebView로 열어 플레이
- 게임별 경로와 메타데이터는 `rn/src/data/games.ts`에서 관리
- WebView URL 생성은 `rn/src/utils/config.ts`에서 관리

핵심 화면:

- `HomeScreen`
- `GameScreen`
- `GameWebView`

### `found3/rn/`

레거시 전용 앱.

- 초기 `found3` 전용 RN 셸
- 현재 기준 구조에서는 deprecated
- 문서나 설명에서 이 경로를 현재 구조로 취급하지 않는다

### `prd/`

게임 기획 및 요구사항 문서.

- 게임별 PRD
- 브리지 프로토콜
- 우선순위 문서

### `knowledge/`

프로젝트 지식 베이스.

- 구조/결정/요구사항/진행 기록
- 여러 문서가 있지만, 구조 기준 문서는 이 파일이 담당

## Runtime Flow

### 1. Core

`lib/{game}`에서 게임 로직을 제공한다.

- Phaser 게임 생성
- 보드 로직
- 씬
- 타입
- 브리지 연동에 필요한 이벤트

### 2. Web

`web/arcade`가 각 게임 코어를 조합해 브라우저용 게임 화면을 만든다.

- React UI 렌더링
- Phaser 캔버스 마운트
- 게임 완료/실패 이벤트 처리
- RN WebView 환경에서는 브리지 메시지 송신

### 3. Native

`rn`이 웹 게임 URL을 WebView로 로드한다.

- 개발 환경: 로컬 Vite 서버
- 운영 환경: 배포된 웹 호스트
- 게임 종료 이벤트는 브리지로 수신
- 네이티브 화면에서 결과/광고/복귀 흐름을 제어

## Current vs Legacy

현재 기준:

- `lib/{game} -> web/arcade -> rn`

레거시 또는 보조 경로:

- `lib/found3 -> web/found3 -> found3/rn`
- `lib/crunch3 -> web/crunch3`

이 레거시 경로는 참고용으로 남아 있을 수 있지만, 신규 문서와 구조 설명은 현재 기준을 우선한다.

## Workspace Map

`pnpm-workspace.yaml`에 등록된 주요 패키지:

- `lib/*`
- `web/*`
- `rn`
- `found3/rn`

주의:

- `found3/rn`은 워크스페이스에는 남아 있지만 구조상 deprecated다.

## Where To Start

구조를 파악할 때 권장 시작점:

1. `rn/src/data/games.ts`
2. `rn/src/screens/GameScreen.tsx`
3. `rn/src/components/GameWebView.tsx`
4. `web/arcade/src/App.tsx`
5. `web/arcade/src/games/{game}/useGame.ts`
6. `lib/{game}/src/game.ts`

이 순서로 보면 네이티브 앱에서 어떤 웹 경로를 열고, 그 웹 경로가 어떤 코어 패키지를 사용하는지 빠르게 따라갈 수 있다.
