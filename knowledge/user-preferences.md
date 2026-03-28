# User Preferences — Design & Work Style

## Visual Design Preferences

### Theme
- **밝고 깔끔한 모던 디자인 선호** — 어두운 테마 싫어함
- kocket 프로젝트의 디자인 시스템을 기준 (컬러, 타이포, 아이콘)

### Icons & Assets
- 이모지보다 실제 SVG/PNG 아이콘 선호
- kocket 스타일 SVG 아이콘이 기준점

### Interactive Elements
- 버튼은 3D 입체감 있게 (튀어나오고 눌리는 느낌)
- dimming/비활성화 시각효과 싫어함 (가려져도 밝게 유지)

### Layout & Spacing
- 타일/아이콘 크기 일관성 중요시함
- 공간 낭비 싫어함 (패딩/여백 최소화, 꽉 차게)

## Work Philosophy

### Quality Bar
- **기능보다 시각적 완성도에 민감**
- "완벽보다 빠른 출시" 원칙이지만 **디자인은 타협 안 함**

### Speed
- 파산 직전 — 모든 결정은 속도와 시장성 기준
- 빠른 MVP 출시 우선

### Compliance
- 게임 경험을 해치지 않는 선에서 라이센스 준수

## Platform & Architecture

### Cross-Platform
- 웹과 앱 모두 완전한 경험 제공해야 함 — 한쪽만 되면 안 됨
- 앱에서 하던 게임을 웹에서도 심리스하게 이어할 수 있어야 함

### Monetization
- 광고는 네이티브에서 제어하는 게 좋다고 판단 (RN 결과 화면에 삽입)

### Code Quality
- 컴포넌트 재사용과 코드 분리 중시

## Architecture Preferences

### 통합 우선
- 분산된 시스템보다 통합된 시스템 선호
- 게임별 앱 → 슈퍼앱, 게임별 웹서버 → 통합 웹서버
- "같은 웹서버를 왜 안쓰고 따로 만들었어?" — 불필요한 분리에 거부감

### UI 구조
- 플로팅/오버레이 UI 싫어함 → 정해진 레이아웃 안에 넣기
- kocket의 Header 같은 검증된 패턴 참조 선호
- "뒤로가기가 무지성으로 쳐 박혀있으니까 다른걸 덮잖아"

### Dev Experience
- 안정적인 개발 환경 중시 (Bonjour > IP 하드코딩)
- 하나의 서버로 모든 걸 서빙하는 단순한 구조

## Summary

> 밝고 깔끔하고 꽉 찬 디자인. 버튼은 입체감 있게. dimming 싫어함.
> 빠르게 만들되 디자인 퀄리티는 양보 없음.
> 웹/앱 모두 완전한 경험. 심리스 크로스플랫폼.
> 통합된 시스템 선호 — 분산/중복 싫어함. 검증된 패턴(kocket) 참조.
> 플로팅 UI 거부 — 레이아웃 안에 자리잡혀야 함.
