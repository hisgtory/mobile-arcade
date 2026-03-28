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
