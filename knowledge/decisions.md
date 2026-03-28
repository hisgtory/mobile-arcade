# Decisions — User Feedback History

유저 피드백으로 변경된 결정사항 기록.

## UI Architecture

### Phaser → React UI 분리
- **Before**: 모든 UI를 Phaser로 렌더링
- **After**: Phaser는 보드만, 나머지(HUD/슬롯/아이템바/타이틀/클리어)는 React
- **Reason**: "게임 엔진 안써도 될거같은데"

## Visual Design

### 어두운 네이비 → 밝은 화이트 테마
- **Before**: 어두운 네이비 컬러 테마
- **After**: 밝은 화이트 테마 (kocket 컬러 시스템)
- **Reason**: "디자인이 좀 칙칙한데"

### 가려진 타일 dimming 제거
- **Before**: 겹쳐서 가려진 타일에 dimming 효과
- **After**: dimming 없이 밝게 유지
- **Reason**: "dimming 안되게"

### 아이콘 크기 고정
- **Before**: 아이콘 개수에 따라 크기 변동 가능
- **After**: 개수가 많아져도 아이콘 사이즈 동일
- **Reason**: "개수 많아져도 아이콘 사이즈 같아야"

### 아이콘 에셋 진화
- **Step 1**: 이모지 사용
- **Step 2**: PNG 아이콘으로 변경
- **Step 3**: SVG 아이콘 (kocket 스타일 완전 일치)
- **Reason**: 디자인 일관성 및 품질 향상

## Game Mechanics

### 타임아웃 제거
- **Before**: 타임아웃 있음
- **After**: 타임아웃 없음, 경과 시간만 측정
- **Reason**: "타임아웃은 없어도 될거같아"

### 경과 시간 측정 + 리더보드
- **Added**: 시간 기록 후 나중에 리더보드 활용
- **Reason**: "시간은 재고 나중에 리더보드"

### 모든 스테이지에서 레이어 겹침
- **Before**: 후반 스테이지에서만 겹침
- **After**: Phase 1부터 겹치게
- **Reason**: "phase 1부터 겹쳐지게"

## Component Design

### 아이템 버튼 3D 효과
- **Before**: 플랫 버튼
- **After**: 3D 눌리는 효과
- **Reason**: "clickable한, 튀어나온거같고 누르면 들어간거같은"

### 아이템 카운트 뱃지 + AD 표시
- **Added**: 남은 개수 라벨 + 소진 시 AD 표시
- **Reason**: "몇개 있는지 라벨로 보여져야하고 없으면 AD"

### 아이템 사용 이벤트 브릿지 전송
- **Added**: ITEM_USED 메시지를 네이티브 브릿지로 전송
- **Reason**: "네이티브 브릿지로 나가야 해"

## App Architecture

### RN이 스테이지 흐름 제어
- **Before**: WebView가 타이틀/게임/결과 모든 화면 담당
- **After**: WebView는 `/stage/:stageId` URL로 게임플레이만, 랜딩/결과 화면은 RN 네이티브
- **Reason**: 광고 개입 포인트를 네이티브에서 제어하기 좋음 (AdMob 인터스티셜)

### RN 네이티브 타이틀 + WebView 프리로드
- **Before**: WebView에서 모든 화면 처리
- **After**: 최초 화면은 RN 네이티브, WebView는 백그라운드 프리로드
- **Reason**: "최초 화면은 RN이어야"

### Expo SDK 52 → 54 업그레이드
- **Before**: Expo SDK 52
- **After**: Expo SDK 54
- **Reason**: Expo Go 호환

## Technical

### React StrictMode 제거
- **Before**: StrictMode 활성화
- **After**: StrictMode 제거
- **Reason**: 두 개 렌더링 버그 발생

### Phaser 캔버스 Scale.FIT 확정
- **Before**: FIT → RESIZE 변경 시도
- **After**: Scale.FIT로 롤백 확정
- **Reason**: RESIZE 모드는 flexbox 컨테이너 높이 0일 때 검정 화면 유발. 여백은 React CSS로 관리.

### 에셋 경로 절대화
- **Before**: 상대 경로 에셋 로드
- **After**: 절대 경로로 변경
- **Reason**: nested route(`/stage/:stageId`)에서 상대 경로 에셋 로드 실패. lib에 배포 경로 하드코딩은 기술 부채이나, 빠른 출시 기조상 수용. 향후 `GameConfig.assetBaseUrl`로 분리 예정.

## Routing & Platform

### 웹/앱 듀얼 경로 분리 확정
- **Before**: 단일 라우트로 웹/앱 구분 없음
- **After**: `/games/found3/v1` = 웹 풀 게임 (타이틀→게임→결과 전부 웹), `/games/found3/v1/stage/:stageId` = 앱 WebView 전용 (게임만)
- **Reason**: 같은 코드베이스에서 환경 분기만으로 웹/앱 동시 지원, 나중에 앱↔웹 심리스 전환 가능

### 웹도 독립적 완전한 게임 경험 제공
- **Added**: 웹에서도 타이틀→게임→결과 전체 플로우 완비
- **Reason**: "웹에서도 심리스하게 할 수 있어야"

## App Strategy (2026-03-28)

### 게임별 앱 → Arcade 슈퍼앱
- **Before**: `found3/rn/` — 게임별 개별 RN 앱
- **After**: `rn/` — 단일 Arcade 앱 (게임 카탈로그 + WebView 런처)
- **Reason**: CPI 효율, 데이터 드리븐 피벗, 유저 이탈 방지 ("하나에 슈퍼앱처럼 여러 게임을 넣고... 광고 후 이탈을 줄일 수 있을 것 같아")

### 플로팅 뒤로가기 → kocket 글로벌 헤더
- **Before**: 게임 위에 떠있는 반투명 원형 뒤로가기 버튼
- **After**: kocket 스타일 고정 헤더 (56px, absolute left/right, centered title)
- **Reason**: "뒤로가기가 무지성으로 쳐 박혀있으니까 다른걸 덮잖아"

### 게임별 Vite 서버 → 통합 web/arcade/
- **Before**: `web/found3/` + `web/crunch3/` 각각 별도 Vite 서버
- **After**: `web/arcade/` 하나의 Vite 프로젝트, React Router로 모든 게임 라우팅
- **Reason**: "같은 웹서버를 왜 안쓰고 따로 만들었어?"

### IP 기반 → Bonjour hostname
- **Before**: DEV_HOST_IP 하드코딩 (WiFi 바뀌면 수동 변경)
- **After**: `SG-MacBook-Pro.local` Bonjour mDNS 호스트네임
- **Reason**: "sg-2.local 인가 그걸 쓰면 좀 더 이런 문제 해결 쉬울거같은데"

### 에셋 경로 통합
- **Before**: `/games/{game}/v1/assets/tiles/...` (게임별 경로)
- **After**: `/assets/tiles/...` (공유 경로)
- **Reason**: 통합 웹 서버에서 에셋 중복 제거

## Game Design (2026-03-29)

### Make 10: 타이머 제거
- **Before**: 2분 타임 리밋 → 자동 게임 오버
- **After**: 타이머 없음, "더 이상 합 10 불가" 시에만 게임 오버
- **Reason**: "이거 타이머 없애줘. 왜 자동 게임 오버 돼?"

### Make 10: 그리드 세로 전환 + 셀 확대
- **Before**: 17열×10행 (가로), 셀 ~22px (작음)
- **After**: 10열×17행 (세로), 셀 ~32px (45% 증가), 패딩 최소화
- **Reason**: "타일 사이즈가 너무 작아. 더 많은 영역을 사용해도 돼. 위 아래로 공간이 많이 남아"

### Water Sort: RN 브릿지 누락 수정
- **Before**: stage-clear 시 RN에 메시지 안 보냄 → 결과 화면 없음
- **After**: 공유 브릿지로 STAGE_CLEAR 전송 → RN 결과 화면 정상 작동
- **Reason**: "이거 다 해도 다음 스테이지로 넘어간다거나 그런 result가 없는데?"

### 게임별 브릿지 → 공유 브릿지
- **Before**: Found3만 자체 BridgeClient, 나머지 게임은 브릿지 없음
- **After**: `web/arcade/src/utils/bridge.ts` 공유 유틸로 모든 게임 지원
- **Reason**: 새 게임 추가 시마다 브릿지 누락 방지

### 게임 변형은 별도 이슈로 분리
- **Decision**: 현재 PR에 넣지 않고 별도 이슈 등록 후 처리
- **Examples**: TicTacToe 5x5 (#136), Make 10 Flow (#137)
- **Reason**: 스코프 크리프 방지, 빠른 머지 우선
