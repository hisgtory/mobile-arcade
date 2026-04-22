---
name: team
description: Create an agent team for mobile-arcade with all defined roles
---

Create an agent team for mobile-arcade:

**Team Structure:**

1. **PRD** (`prd/`) — 게임 기획자
   - 게임 디자인 문서, 요구사항 정의, 게임 밸런스
   - Read: `prd/CLAUDE.md`, `prd/TASKS.md`

2. **Game Core** (`lib/found3/`) — Phaser.io 게임 로직 개발자
   - 게임 씬, 매칭 로직, 타일 시스템, 타입 정의
   - Read: `lib/found3/CLAUDE.md`, `lib/found3/TASKS.md`

3. **Web Frontend** (`web/found3/`) — React + Stitches 웹 개발자
   - lib를 사용한 웹 게임 UI, 반응형, Phaser 통합
   - Read: `web/found3/CLAUDE.md`, `web/found3/TASKS.md`

4. **RN App** (`rn/`) — React Native 개발자
   - WebView 래핑, 네이티브 브릿지, 앱 빌드
   - Read: `rn/CLAUDE.md`, `rn/TASKS.md`

**Project Context:**
- README.md: 전체 프로젝트 개요
- CLAUDE.md: 코디네이터 가이드
- 의존성 순서: PRD → lib → web → rn

**Work Coordination:**
- PRD가 기획 확정 후 lib 작업 시작
- lib 코어 로직 완성 후 web 작업 시작
- web 빌드 완성 후 rn 래핑 작업 시작
- 각 teammate는 자신의 폴더만 수정

Each teammate should read their CLAUDE.md for role definition and TASKS.md for current work.
