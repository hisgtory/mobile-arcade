# Requirements — found3

## Game Concept

- **found3**: 3개씩 같은 그림 퍼즐을 찾아 없애서 모든 타일을 클리어하는 게임
- 모노레포 구조: `lib/{game}` → `web/{game}` → `{game}/rn` 파이프라인

## Portfolio Strategy

- 120개 게임 레퍼런스 기반 포트폴리오 전략
- GitHub: 120개 이슈 + 각각 별도 프로젝트 + @claude 멘션 기획 요청

## Game Mechanics

### Tile System
- 타일 레이어 겹침: 모든 스테이지에서 겹침 있어야 함
- 겹침 개수로 난이도 조절
- 가려진 타일에 dimming 없음 (밝게 유지)

### Layout
- 슬롯은 상단 배치
- 아이템바는 하단 배치

### Time & Scoring
- 타임아웃 없음 — 경과 시간만 측정
- 리더보드용 시간 기록

### Items
- Shuffle, Undo, Magnet — 3종 아이템
- 최초 3개씩 지급 (shuffle:3, undo:3, magnet:3)
- 소진 시 AD(광고)로 충전
- 아이템 사용 시 ITEM_USED 브릿지 이벤트로 네이티브 전송

## Architecture Requirements

### Web Routing
- `/games/found3/v1` → 웹 전용 풀 게임 (타이틀→게임→결과 전부 웹)
- `/games/found3/v1/stage/:stageId` → 앱 WebView용 (게임만, 결과는 RN 네이티브)

### State & Bridge
- WebView 브릿지 프로토콜 (Web <-> RN)
- ACK 기반 메시지 전달
- 로그 필수
- STAGE_CLEAR / GAME_OVER 브릿지 이벤트 → RN 네이티브 결과 화면
- ITEM_USED 브릿지 이벤트 → AsyncStorage 업데이트

### RN App
- Expo 기반 (SDK 54)
- 최초 화면은 RN 네이티브
- WebView는 백그라운드 프리로드
- 앱 플로우: TitleScreen(네이티브) → WebView(`/stage/:stageId`) → ResultScreen(네이티브)
- ResultScreen: Next Stage / Retry / Home + AD SPACE placeholder
- 광고 개입: 스테이지 사이 결과 화면에서 네이티브로 제어 (AdMob 인터스티셜)

### UI Separation
- Phaser는 보드(타일)만 담당
- 나머지 UI는 React로 구현:
  - TitleScene, ClearScene, HUD, SlotBar, ItemBar

## Design Requirements

### Theme
- 밝은 화이트 테마
- kocket 컬러 시스템 (#F9FAFB 배경)

### Assets
- 픽셀 아트 음식 에셋 (16x16 PNG, CC BY 4.0, Alex Kovacsart)
- BGM: 2곡 랜덤 루프 (Spring_Loaded_Scoundrel, Spring_Loaded_Waltz)

### Icons
- kocket 프로젝트의 SVG 아이콘 스타일 완전 일치 (IconRetry, IconBulb 등)
- 셔플 아이콘: 뮤직앱 스타일 교차 화살표 (Bootstrap shuffle icon)
- 타일/아이콘 크기 일관성 유지 (개수 증가해도 사이즈 동일)

### Buttons
- 3D 눌리는 효과 (튀어나온 느낌, 누르면 들어간 느낌)
- 아이템 카운트 뱃지 표시
- 소진 시 AD 표시

---

# Requirements — Arcade Super App

## App Architecture
- **단일 Arcade 앱** (게임별 개별 앱 X)
- Native RN HomeScreen: Featured 배너, New Games, 카테고리 탭, 게임 그리드
- 각 게임은 WebView로 로딩 (게임 브라우저 + WebView 런처)
- kocket 스타일 글로벌 헤더 (뒤로가기 + 타이틀 중앙 정렬)
- 게임 카탈로그: `rn/src/data/games.ts`에서 관리 (후에 서버 API로 교체 가능)

## Business Strategy
- CPI 1번으로 유저가 N개 게임에 노출 (게임별 앱 대비 효율적)
- 앱 안에서 어떤 게임에 유저가 몰리는지 실시간 확인 → 데이터 드리븐 피벗
- UA 광고 소재 게임을 상단에 배치 → 광고 → 이탈 방지
- 새 게임 추가 = 웹 배포만 (앱스토어 리뷰 불필요)

---

# Requirements — Crunch3

## Game Concept
- **Crunch3**: 스와이프 match-3 퍼즐 (Candy Crush 류)
- found3의 음식 픽셀아트 에셋 재활용
- 인접 타일 스와이프로 교환 → 가로/세로 3+ 매칭 → 파괴

## Game Mechanics
- 8x8 그리드 보드
- 스와이프 감지 + 인접 타일 교환
- 매칭 실패 시 되돌리기
- 중력 (빈 칸에 위 타일 낙하) + 새 타일 생성
- 캐스케이드 (연쇄 매칭)
- 제한 턴 모드 (목표 점수 달성)
- 5 스테이지 (타일 종류 6→10, 턴 25→15)

## Web
- 통합 웹 서버 (`web/arcade/`)에서 서빙
- 라우팅: `/games/crunch3/v1` + `/games/crunch3/v1/stage/:id`

## Dev Environment
- 통합 Vite 서버 (포트 5173, `base: '/'`)
- Bonjour hostname (`SG-MacBook-Pro.local`) — IP 변경 무관
- `allowedHosts: true` — .local 호스트 허용

---

# Requirements — Issue-Driven Development

## Workflow
- 모든 작업 전 `gh issue create`로 이슈 생성 필수
- 브랜치: `feat/issue-{N}-description` or `fix/issue-{N}-description`
- 커밋: `feat: description (#N)` + PR에 `Closes #N`
- 변경 시 이슈에 댓글 먼저 → 그 다음 코드 수정
