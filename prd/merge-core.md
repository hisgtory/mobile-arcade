# Merge Core Engine 설계서

> 모든 머지 게임이 공유하는 `lib/merge-core` 공통 엔진 설계 문서.
> 엔진 1개 → 테마 N개 파이프라인을 지원한다.

---

## 1. 머지 장르 분석

### 1.1 장르 정의

머지(Merge) 장르는 **같은 등급의 오브젝트 2개를 합쳐 상위 등급 오브젝트 1개를 생성**하는 핵심 루프를 가진 퍼즐/경영 하이브리드 장르다.

```
A + A → B
B + B → C
C + C → D  ...
```

### 1.2 장르 핵심 재미 루프

```
[에너지 소비] → [생산 아이템 획득] → [머지] → [상위 아이템] → [보상/스토리 진행] → [에너지 재충전 대기 or 과금]
```

- **단기 재미**: 머지 시 팡 이펙트 + 상위 아이템 등장 도파민
- **중기 재미**: 목표 아이템을 향한 머지 체인 계획
- **장기 재미**: 맵/스토리 진행, 컬렉션 완성

### 1.3 레퍼런스 게임 분석 (상위 머지 게임)

| 게임 | 핵심 특징 | 수익화 | 참고 포인트 |
|------|-----------|--------|-------------|
| Merge Mansion | 스토리 + 머지, 에너지제 | 에너지/보석 구매 | 스토리 몰입도 |
| Merge Dragons | 퀘스트 + 자동 생산 | 보석/이벤트 | 자동화 루프 |
| Merge Master | 캐주얼, 빠른 진행 | 광고 기반 | 낮은 진입장벽 |
| Merge Gardens | 정원 테마, 수집 | 구독 모델 | 테마 다양성 |
| EverMerge | 동화 테마, 퀘스트 | 에너지/프리미엄 | 귀여운 비주얼 |

### 1.4 머지 장르 시장성 평가

- **DAU 유지율**: 에너지 시스템으로 매일 복귀 유도 → 높은 리텐션
- **과금 모델**: 에너지 구매 + 광고 제거가 가장 자연스러운 수익화
- **개발 난이도**: 코어 로직 단순 → 테마/콘텐츠가 경쟁력
- **전략**: 엔진 1회 개발 후 테마 교체로 빠른 신규 게임 출시 가능

---

## 2. lib/merge-core 아키텍처

### 2.1 패키지 구조

```
lib/merge-core/
├── src/
│   ├── engine/
│   │   ├── MergeBoard.ts        # 보드 상태 관리
│   │   ├── MergeItem.ts         # 아이템 정의 및 등급 시스템
│   │   ├── MergeEngine.ts       # 핵심 머지 로직
│   │   └── MergeChain.ts        # 연쇄 머지 계산
│   ├── production/
│   │   ├── Producer.ts          # 생산자 오브젝트 (자동/수동)
│   │   ├── EnergySystem.ts      # 에너지 관리
│   │   └── ProductionQueue.ts   # 생산 큐
│   ├── progression/
│   │   ├── QuestSystem.ts       # 퀘스트/목표 관리
│   │   ├── StoryManager.ts      # 스토리 진행 상태
│   │   └── UnlockManager.ts     # 콘텐츠 잠금해제
│   ├── storage/
│   │   ├── Inventory.ts         # 보관함 (보드 외 아이템)
│   │   └── SaveManager.ts       # 로컬 저장/불러오기
│   ├── types/
│   │   ├── IMergeItem.ts        # 아이템 인터페이스
│   │   ├── IBoard.ts            # 보드 인터페이스
│   │   ├── IThemeConfig.ts      # 테마 설정 인터페이스
│   │   └── IQuestDef.ts         # 퀘스트 정의 인터페이스
│   └── index.ts                 # 공개 API
├── package.json
└── tsconfig.json
```

### 2.2 핵심 데이터 모델

#### IMergeItem
```typescript
interface IMergeItem {
  id: string;           // 고유 ID
  typeId: string;       // 아이템 타입 (테마별 정의)
  level: number;        // 머지 등급 (1 ~ maxLevel)
  position: { x: number; y: number };  // 보드 위치
  isProducer: boolean;  // 생산자 여부
  isLocked: boolean;    // 잠금 여부 (이동/머지 불가)
}
```

#### IThemeConfig
```typescript
interface IThemeConfig {
  themeId: string;
  itemChains: ItemChain[];     // 머지 체인 정의
  producers: ProducerDef[];    // 생산자 정의
  quests: QuestDef[];          // 퀘스트 목록
  boardSize: { cols: number; rows: number };
  maxEnergy: number;
  energyRechargeMinutes: number;
}
```

#### ItemChain (머지 체인)
```typescript
interface ItemChain {
  chainId: string;
  items: ChainItem[];  // level 순서대로 정의
}

interface ChainItem {
  level: number;
  assetKey: string;   // Phaser 에셋 키 (테마마다 교체)
  displayName: string;
  produceChainId?: string;  // 이 아이템이 생산하는 체인
  produceInterval?: number; // 생산 주기 (초)
}
```

### 2.3 핵심 로직: MergeEngine

#### 머지 가능 조건
```
isMergeable(a: IMergeItem, b: IMergeItem): boolean
  → a.typeId === b.typeId
  → a.level === b.level
  → a.level < maxLevel (최고 등급은 머지 불가)
  → !a.isLocked && !b.isLocked
```

#### 머지 실행
```
merge(source: IMergeItem, target: IMergeItem): MergeResult
  1. isMergeable 검증
  2. source 위치에 빈 셀 생성
  3. target → level + 1 아이템으로 교체
  4. MergeResult 반환 (newItem, xpGained, questProgress)
  5. 연쇄 머지 체크 (같은 위치 주변 자동 머지 옵션)
```

#### 보드 상태 관리
```
Board(cols, rows):
  - cells: (IMergeItem | null)[][]
  - getEmpty(): Position[]           # 빈 셀 목록
  - getByType(typeId): IMergeItem[]  # 타입별 아이템
  - canPlace(): boolean              # 배치 가능 여부
  - move(from, to): void             # 아이템 이동
```

### 2.4 생산 시스템 (Producer)

```
Producer (생산자 아이템):
  - 일정 시간마다 아이템 생산 (에너지 소비)
  - 에너지 없으면 생산 중단
  - 수동 탭: 즉시 1개 생산 (에너지 1 소비)
  - 자동 생산: 타이머 기반 (에너지 소비량 낮음)
  - 생산된 아이템은 인근 빈 셀에 배치
  - 빈 셀 없으면 보관함으로
```

### 2.5 에너지 시스템

```
Energy:
  - 최대치: 테마별 설정 (기본 50)
  - 자연 회복: 5분당 1 (기본)
  - 소비: 생산자 탭 1회당 1
  - 만충 도달 시 회복 중단
  - 과금 포인트: 에너지 즉시 충전
```

---

## 3. 테마 양산 파이프라인

### 3.1 파이프라인 구조

```
lib/merge-core  (공통 엔진, 1회 개발)
       │
       ├── web/hello-town      (오피스/회사 테마)
       ├── web/merge-garden    (정원 테마)  ← 다음 게임
       ├── web/merge-kingdom   (왕국 테마)  ← 그 다음
       └── web/merge-cafe      (카페 테마)  ← 그 다음
```

### 3.2 테마 추가 소요 시간

| 작업 | 소요일 | 담당 |
|------|--------|------|
| IThemeConfig 작성 | 0.5일 | PRD |
| 에셋 제작 (아이콘 세트) | 2일 | 디자인 |
| 테마 패키지 구현 | 1일 | Game Core |
| 웹 빌드 | 0.5일 | Web Frontend |
| RN 래핑 | 0.5일 | RN App |
| **합계** | **~4~5일** | |

> 엔진 완성 후 신규 테마 게임 1개 = **1주일 이내 출시** 가능

### 3.3 테마 파일 구조

```
web/{theme}/
├── src/
│   ├── theme/
│   │   ├── themeConfig.ts    # IThemeConfig 구현
│   │   ├── assets.ts         # 에셋 매핑
│   │   └── strings.ts        # UI 텍스트 (다국어)
│   └── ...공통 web 구조
```

---

## 4. 공통 수익화 모델

### 4.1 수익 레이어

```
Layer 1 (무료 플레이어):
  - 광고 시청 → 에너지 +10
  - 광고 시청 → 보관함 슬롯 임시 확장
  - 광고 시청 → 특수 아이템 1개

Layer 2 (소과금):
  - 에너지 팩 (₩1,200 ~ ₩5,900)
  - 특수 아이템 번들
  - 보관함 영구 확장 (₩2,400)

Layer 3 (중과금):
  - 시즌 패스 (월 ₩9,900): 매일 무제한 에너지 + 전용 아이템
  - 스타터 팩 (₩4,900): 초반 진행 가속

Layer 4 (고과금):
  - VIP 멤버십 (월 ₩19,900): 광고 제거 + 에너지 2배 회복
```

### 4.2 머지 장르 KPI 목표

| 지표 | 목표 |
|------|------|
| D1 리텐션 | 40%+ |
| D7 리텐션 | 20%+ |
| D30 리텐션 | 8%+ |
| ARPDAU | ₩50~200 |
| 과금 전환율 | 3~8% |

### 4.3 광고 배치 전략

- **인터스티셜**: 스테이지 클리어 후 (과도하지 않게 5번당 1회)
- **리워드 광고**: 에너지 충전, 특수 아이템 획득 시 자발적 시청
- **배너**: 메인 화면 하단 (과금 유저 제거 가능)

---

## 5. MVP 구현 우선순위

### Phase 1 - 엔진 핵심 (1주)
- [x] 기획서 작성
- [ ] MergeBoard (보드 상태, 이동)
- [ ] MergeItem (등급 시스템)
- [ ] MergeEngine (머지 실행, 결과)
- [ ] Producer (탭 생산)
- [ ] EnergySystem (소비/회복)
- [ ] SaveManager (로컬 저장)

### Phase 2 - 콘텐츠 (3일)
- [ ] QuestSystem
- [ ] StoryManager
- [ ] 10개 아이템 체인 × 8레벨

### Phase 3 - 수익화 (2일)
- [ ] 광고 SDK 연동 (AdMob)
- [ ] 인앱 결제 연동 (구글/애플)
- [ ] 에너지 구매 플로우
