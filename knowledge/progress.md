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
