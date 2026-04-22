# Knowledge Base

프로젝트 지식베이스 진입 문서.

현재 기준 구조:

```text
lib/{game} -> web/arcade -> rn
```

레거시:

- `found3/rn`은 deprecated
- `web/found3`, `web/crunch3`는 개별/레거시 웹 패키지

## Recommended Reading Order

1. `project-structure.md`
2. `requirements.md`
3. `architecture-decisions.md`
4. `decisions.md`
5. `progress.md`
6. `user-preferences.md`

## File Guide

### `project-structure.md`

실제 폴더 구조와 런타임 흐름 설명.

### `requirements.md`

게임 및 앱 수준의 요구사항.

### `architecture-decisions.md`

ADR 형식의 기술 결정 기록.

### `decisions.md`

유저 피드백으로 바뀐 제품/구조 결정.

### `progress.md`

구현 진행 타임라인과 구조 전환 기록.

### `user-preferences.md`

유저의 디자인/구조 선호와 작업 스타일.

## Maintenance Rules

- 구조 설명은 항상 현재 기준인 `web/arcade`와 `rn` 중심으로 적는다.
- 레거시 경로를 언급할 때는 deprecated 또는 legacy 여부를 명시한다.
- 새로운 게임 추가 시 `lib`, `web/arcade`, `rn/src/data/games.ts` 반영 여부를 함께 기록한다.
