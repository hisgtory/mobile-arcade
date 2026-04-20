# Progress — Development Timeline

## Current Structure Snapshot

- Current: `lib/{game} -> web/arcade -> rn`
- Legacy: `found3/rn`은 초기 전용 앱으로 남아 있으나 deprecated
- Documentation baseline updated on 2026-04-21

## 2026-03-27 (Day 1)

### Infrastructure
- GitHub repo 생성 (hisgtory/mobile-arcade)
- 모노레포 구조 셋업 (pnpm workspaces)
- 팀 구조 생성 (PRD, Game Core, Web FE, RN App)

### Planning
- found3 게임 기획서 작성 (`prd/found3.md`)
- 120개 게임 이슈 생성 + 장르 라벨 + @claude 댓글
- 120개 GitHub Projects 생성 + 레포 연결

---

## 2026-03-28 (Day 2)

### Game Core (`lib/found3`)
- Phaser.io 기반 코어 구현
- 타일 시스템, 슬롯, 매칭 로직
- 스테이지 시스템
- 타일 레이어/겹침 시스템 구현
- DPR 고해상도 대응

### Web Frontend (`web/found3`)
- React 래핑 + 라우팅 (`/games/found3/v1`)
- Phaser → React UI 분리 (보드만 Phaser, 나머지 React)
- 밝은 화이트 테마 디자인 개편
- kocket SVG 아이콘 적용
- 아이템 카운트 뱃지 + AD 연동

### Assets
- 픽셀 아트 음식 에셋 적용 (16x16 PNG)
- BGM 2곡 추가

### Bridge
- WebView 브릿지 프로토콜 설계 + 구현 (Phase 1~3)
- ITEM_USED 브릿지 메시지 추가

### RN App (`found3/rn`) [legacy]
- Expo 전환 (SDK 54)
- RN 네이티브 타이틀 화면
- WebView 프리로드

### Features
- 리더보드 + 경과 시간 추적
- 스테이지 URL 라우팅 (`/games/found3/v1/stage/:stageId`)
- STAGE_CLEAR / GAME_OVER 브릿지 이벤트 추가
- RN 네이티브 결과 화면 + 광고 placeholder
- 웹 라우팅 복원 (react-router-dom, 듀얼 경로)
- web-fe: StageRoute + 브릿지 stageComplete 연동
- rn-app: ResultScreen(네이티브) + 스테이지 URL 제어 + AD placeholder
- 아이템 브릿지 연동 (ITEM_USED, 3개 최초 지급)
- knowledge 팀원 추가 (프로젝트 지식 관리)

### Bug Fixes
- Scale.RESIZE → Scale.FIT 롤백 (검정 화면 버그 수정)
- 에셋 경로 상대→절대 변경 (nested route 에셋 로드 실패 수정)
- DEV_HOST IP 동적 변경 필요성 확인

### Merged
- PR #123, #124 머지 완료

---

## 2026-03-28~29 (Day 2~3 continued)

### Arcade Super App (`rn/`)
- Arcade 슈퍼앱 구조 설계 (게임별 앱 → 단일 앱)
- Native HomeScreen: Featured 배너, New Games, 카테고리 탭, 게임 그리드
- GameScreen: kocket 스타일 헤더 + WebView + 네이티브 Result
- 범용 Bridge: `@arcade/{gameId}/...` 게임별 독립 저장소
- AsyncStorage 스테이지 진행도 영구 저장/복원
- React Navigation (Home → Game 스택)

### Crunch3 Game
- `lib/crunch3/` — match-3 코어 엔진 (보드, 매칭, 중력, 캐스케이드)
- `web/crunch3/` → `web/arcade/`로 통합
- 8x8 그리드, 스와이프 교환, 3+ 매칭, 콤보 배율
- 5 스테이지 (목표 점수 + 제한 턴)
- Arcade HomeScreen에 Found 3 + Crunch 3 등록

### Unified Web (`web/arcade/`)
- 게임별 Vite 서버 → 단일 통합 Vite 프로젝트
- React Router로 모든 게임 라우팅
- 공유 에셋 (`/assets/tiles/`, `/assets/audio/`)
- `allowedHosts: true` + Bonjour hostname

---

## 2026-04-21

### Documentation
- 루트 문서를 현재 구조 기준으로 정리
- 구조 기준 문서 `knowledge/project-structure.md` 추가
- Knowledge index `knowledge/README.md` 추가
- 요구사항/진행 문서에서 `found3/rn`을 현재 구조처럼 읽히는 표현 정리

### Issue-Driven Development
- CLAUDE.md에 이슈 기반 개발 워크플로우 추가
- 이슈 #125~#132 생성 및 처리

### Merged
- PR #126 (Arcade 홈) 머지
- PR #132 (Crunch3 + 통합 웹) 머지
