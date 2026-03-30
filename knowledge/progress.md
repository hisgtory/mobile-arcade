# Progress — Development Timeline

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

### RN App (`found3/rn`)
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

### Issue-Driven Development
- CLAUDE.md에 이슈 기반 개발 워크플로우 추가
- 이슈 #125~#132 생성 및 처리

### Merged
- PR #126 (Arcade 홈) 머지
- PR #132 (Crunch3 + 통합 웹) 머지

---

## 2026-03-29 (Day 3~4)

### Block Rush (#119) ✅
- `lib/blockrush/` — 10x10 블록 퍼즐 (1010!/Woodoku 스타일)
- 드래그 앤 드롭 피스 배치, 라인 클리어
- Juice: screen shake, particle burst, combo text, placement pop
- PR #133 머지

### Water Sort (#58) ✅
- `lib/watersort/` — 물 분류 퍼즐 (탭으로 튜브 선택/붓기)
- BFS 솔버로 풀 수 있는 레벨만 생성 (Fisher-Yates + 검증)
- 5단계 난이도 (3색 → 7색), Undo/Restart 지원
- Juice: tube lift, pour arc animation, tube completion particles, confetti
- PR #134 머지

### Tic Tac Toe (#118) ✅
- `lib/tictactoe/` — vs AI (minimax, easy/medium/hard)
- X/O 마크 애니메이션, 승리 라인 하이라이트
- 라운드 스코어 추적, Play Again 인게임 버튼
- PR #135 머지

### Make 10 (#99) — In Progress
- `lib/number10/` — 사과게임 (17x10 → 10x17 portrait 그리드)
- 드래그 사각형 선택, 합 10 검증, 클리어 애니메이션
- 타이머 없음 (유저 요청으로 제거), "no more moves" 감지 → 게임 오버
- Play Again → 새 보드 생성

### Shared Bridge Utility
- `web/arcade/src/utils/bridge.ts` — 공유 브릿지
- watersort, crunch3, blockrush 모두 연동
- Found3만 자체 BridgeClient 사용 (기존 유지)

### Issues Created
- #136 — Tic Tac Toe 5x5 그리드 스케일링 (연승 시 3→4→5)
- #137 — Make 10 Flow (중력 + 리필 endless 변형)

### Haptic (#191) ✅ — PR #192 머지
- `lib/found3/src/scenes/PlayScene.ts` — `tile-tapped` 즉시 이벤트 추가
- `web/arcade/src/games/found3/useGame.ts` — 이벤트명만 bridge로 전달
- `lib/found3/src/bridge/BridgeClient.ts` — haptic(style) 이벤트명 전달 (RN이 패턴 결정)
- `rn/src/utils/bridge.ts` — `HAPTIC_PATTERNS` 맵 도입 (event → pattern)
- `rn/src/components/GameWebView.tsx` — onError/onHttpError 디버그 핸들러 추가
- `rn/app.json` — iOS ATS NSAllowsLocalNetworking 추가

### Haptic All Games (#193) ✅ — PR #194 머지
- CLAUDE.md에 햅틱 가이드 추가 (새 게임 추가 시 필수)
- 공유 브릿지에 `haptic()` 함수 추가
- 5개 게임에 햅틱 이벤트 추가 (Crunch3, BlockRush, WaterSort, TicTacToe, Number10)
- RN HAPTIC_PATTERNS에 12개 이벤트 매핑

### TicTacToe 5x5 Grid Scaling (#136) — PR #195 (리뷰 중)
- 연승 기반 그리드 확장: 3x3 → 4x4 → 5x5
- 동적 WIN_LINES 생성 (NxN + M-in-a-row)
- AI: depth-limited alpha-beta pruning (4x4/5x5)
- 그리드 업그레이드 애니메이션 + 햅틱
- 패배/무승부 시 연승 리셋 (다운그레이드)
- game-core 팀원이 구현 (첫 팀원 위임 작업)

### RN 앱 폴더 구조 정리 ✅
- `found3/rn/` 레거시 삭제 완료 (초기 프로토타입, 역할 종료)
- `rn/`에 CLAUDE.md + TASKS.md 생성 완료
- 루트 CLAUDE.md 팀 테이블 `found3/rn/` → `rn/` 업데이트 완료
- pnpm-workspace.yaml에서 `found3/rn` 항목 제거 완료

### Minesweeper (#115) ✅ — PR #154 머지
- `lib/minesweeper/` — 9x9/16x16/30x16 지뢰찾기 (탭 공개, 롱프레스 깃발)
- First-click-safe, flood-fill reveal, 3단계 난이도 (Easy/Medium/Expert)
- 햅틱/overlay 제거/Expert 조정/RN 카탈로그 등록/기획서 포함
- 8번째 게임, Copilot 에이전트 구현

### Sudoku (#49) ✅ — PR #182 머지
- `lib/sudoku/` — 9x9 스도쿠 (Easy/Medium/Hard/Expert)
- 퍼즐 생성 (backtracking + unique solution 보장), 노트/힌트/지우기
- 미스테이크 3회 게임오버, 스테이지 진행 (난이도 점진 상승)
- NumberPad + HUD + ClearScreen 모두 React (ADR-002 준수)
- 햅틱/phase/emit딜레이/콘페티 제거/removeCells 재시도/icon 충돌/기획서 포함
- Copilot 에이전트 구현, `rn/src/data/games.ts` 카탈로그 등록 포함

### Web Route Refactoring — PR #199 머지
- App.tsx 540줄 → ~25줄, Express 스타일 게임별 라우트 자체 등록
- 각 게임이 `games/{game}/routes.tsx`에서 `registerRoutes()` 호출
- ADR-016 신설

### Tooling
- `/takeover-pr` 글로벌 스킬 생성 — idle 팀원 깨워서 PR 이어받기 워크플로우

### Phase 1 완료
- **8개 게임 모두 main 머지**: Found3, Crunch3, BlockRush, WaterSort, TicTacToe, Number10, Minesweeper, Sudoku

---

## 2026-03-29 — Phase 2 시작

### Block Puzzle (#89) — PR #200 (리뷰 중)
- PR #172 (Copilot WIP) 닫음 — plan만 있고 구현 없어서 팀 직접 구현으로 전환
- lib + web + rn + prd 전체 구현 완료
- Phase 2 첫 번째 게임

---

## 2026-03-30 — Phaser→React 비교 실험

### React 전환 비교 이슈 발행
- #203~#211 발행 (9개 게임 × React 클론)

### Found3-React (#203) — PR #212 (머지 대기)
- `lib/found3-react/` — 순수 React+Stitches 게임 컴포넌트 (Phaser 의존성 zero)
- Arcade Home에서 Found 3 (Phaser) + Found 3 (React) 두 버전 비교 가능
- 리뷰 11건 반영 완료

### Roadmap Updated
- `prd/game-priority.md` — Block Rush, Water Sort, Tic Tac Toe 완료 표시
- #136 추가 (3.5순위)
