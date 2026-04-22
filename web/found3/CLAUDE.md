# Web Frontend Team — found3

## Role: React + Stitches Web Game Developer

`@arcade/lib-found3`를 사용하여 웹 게임을 빌드합니다.
이 웹 빌드는 `rn` 슈퍼앱에서 WebView로 로드됩니다.

## Tech Stack

- **React 18** — UI 프레임워크
- **TypeScript** — 타입 안전성
- **Stitches** — CSS-in-JS 스타일링
- **Vite** — 빌드 도구
- **@arcade/lib-found3** — 게임 코어 로직

## Folder Structure

```
web/found3/
├── src/
│   ├── main.tsx          # React entry point
│   ├── App.tsx           # Root component
│   ├── components/
│   │   ├── GameCanvas.tsx # Phaser canvas wrapper
│   │   ├── HUD.tsx       # 스코어, 타이머 UI
│   │   └── Layout.tsx    # 전체 레이아웃
│   ├── styles/
│   │   ├── stitches.config.ts  # Stitches 테마
│   │   └── global.ts           # 글로벌 스타일
│   └── hooks/
│       └── useGame.ts    # Phaser game lifecycle hook
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Responsibilities

### DO

- React 컴포넌트로 게임 UI 래핑
- Stitches로 스타일링 (반응형, 모바일 최적화)
- Phaser canvas를 React에 마운트
- HUD (스코어, 타이머 등) React 컴포넌트
- Vite 빌드 설정 (RN WebView에서 로드 가능하도록)
- 게임↔React 이벤트 브릿지

### DON'T

- 게임 로직 직접 구현 금지 (lib 사용)
- React Native 코드 금지
- lib/found3/ 폴더 수정 금지

## Build Output

RN WebView에서 로드할 수 있도록 빌드:
- `dist/index.html` — 단일 HTML 진입점
- 모든 에셋 인라인 또는 상대경로

## Reference

- `prd/found3.md`: 게임 기획서
- `lib/found3/`: 게임 코어 로직 API
- TASKS.md: 현재 작업 목록
