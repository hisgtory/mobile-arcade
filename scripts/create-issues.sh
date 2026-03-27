#!/bin/bash
# Create 120 game research issues for mobile-arcade
REPO="hisgtory/mobile-arcade"

create_issue() {
  local rank="$1"
  local name="$2"
  local dev="$3"
  local rating="$4"
  local desc="$5"
  local genre="$6"

  local labels="status:research,genre:${genre}"
  # Add rating:4.5+ label if applicable
  if awk "BEGIN {exit !($rating >= 4.5)}"; then
    labels="${labels},rating:4.5+"
  fi

  local body="## #${rank} ${name}

| Field | Value |
|-------|-------|
| **Developer** | ${dev} |
| **Rating** | ${rating} |
| **Genre** | ${genre} |
| **Rank** | #${rank} |

### Description
${desc}

### Implementation Notes
- [ ] 게임 메카닉 분석
- [ ] 핵심 로직 설계
- [ ] lib 패키지 구현
- [ ] web 빌드
- [ ] RN 래핑
"

  gh issue create -R "$REPO" \
    --title "[#${rank}] ${name}" \
    --body "$body" \
    --label "$labels" 2>&1

  echo "  Created: [#${rank}] ${name}"
}

echo "=== Creating 120 game research issues ==="
echo ""

# 1-10
create_issue 1 "스도쿠" "Moca" "3.1" "7일간 1위 유지한 클래식 스도쿠 로직 게임." "sudoku"
create_issue 2 "블록 블라스트 (Block Blast)" "HungryStudio" "4.8" "높은 평점의 인기 블록 퍼즐 게임." "block-puzzle"
create_issue 3 "로얄 킹덤 (Royal Kingdom)" "Dream Games, Ltd." "4.6" "매치-3에 왕국 건설 메타가 결합된 하이브리드 퍼즐." "match-3"
create_issue 4 "매직 정렬! (Magic Sort!)" "Grand Games A.Ş." "4.5" "색상, 물체 등을 정렬하는 중독성 높은 퍼즐." "sort-puzzle"
create_issue 5 "가십하버: 합성 & 스토리 게임" "Microfun Limited" "4.5" "합성(Merge)과 스토리가 있는 하이브리드 게임." "merge"
create_issue 6 "Tile Explorer - 트리플 매치" "Oakever Games" "4.8" "트리플 매치 방식의 타일 제거 퍼즐." "triple-match"
create_issue 7 "Grill Sort - 고기구이, 바비큐 맞추기" "Gloryway Puzzle Hub" "4.7" "바비큐 컨셉의 재미있는 정렬 퍼즐." "sort-puzzle"
create_issue 8 "Brain Puzzle 2: Logic Twist" "JoyGame Studio" "4.9" "두뇌 트레이닝을 위한 고난이도 로직 퍼즐." "brain-logic"
create_issue 9 "블록 크러시 (Block Crush)" "Wonderful Studio" "4.8" "간단한 규칙의 고전 블록 퍼즐." "block-puzzle"
create_issue 10 "Foodie Sizzle: 푸디 시즐" "ABI GLOBAL LTD." "4.6" "음식 테마의 합성(Merge) 퍼즐." "merge"

# 11-20
create_issue 11 "로얄 매치 (Royal Match)" "Dream Games, Ltd." "4.6" "전 세계 최고 인기 매치-3 게임." "match-3"
create_issue 12 "버스 탈출 - 교통 체증" "ABI GAME" "4.5" "주차/탈출 컨셉의 슬라이딩 퍼즐." "traffic"
create_issue 13 "스도쿠 마스터 (Sudoku Master)" "HungryStudio" "4.8" "깔끔한 디자인의 스도쿠 마스터 버전." "sudoku"
create_issue 14 "타일 클럽 - 매칭 게임" "GamoVation" "4.8" "트리플 타일 매치 스타일의 게임." "triple-match"
create_issue 15 "Brain Puzzle: Tricky Quest" "JoyGame Studio" "4.8" "다양한 두뇌 퀴즈와 로직 챌린지." "brain-logic"
create_issue 16 "Block Puzzle: Bloom Journey" "Andaman" "4.3" "꽃 테마의 블록 퍼즐 어드벤처." "block-puzzle"
create_issue 17 "털실 마스터" "BitEpoch" "4.7" "실타래를 풀거나 정렬하는 3D 퍼즐." "rope-knot"
create_issue 18 "핫레스토랑: 머지&쿠킹" "Microfun Limited" "4.8" "요리와 머지(합성)가 결합된 하이브리드 게임." "merge"
create_issue 19 "스도쿠 - 두뇌 훈련용 퍼즐 게임" "Easybrain" "4.7" "가장 대중적인 클래식 스도쿠 앱 중 하나." "sudoku"
create_issue 20 "Block Away - Tap Out Puzzle" "Tripledot Studios Limited" "4.7" "블록을 빼내는 탭 아웃(Tap Out) 퍼즐." "block-puzzle"

# 21-30
create_issue 21 "스도쿠 - 클래식 스도쿠 퍼즐" "Oakever Games" "4.8" "클래식 숫자 퍼즐 스도쿠." "sudoku"
create_issue 22 "개체 찾기 - 숨은그림찾기 게임" "Guru Puzzle Game" "4.9" "높은 평점의 숨은그림찾기 유형." "hidden-object"
create_issue 23 "수박 만들기 2048" "mobirix" "4.4" "유행했던 2048 & 머지 컨셉의 게임." "merge"
create_issue 24 "수학 퍼즐 게임 - 크로스매스" "Guru Puzzle Game" "4.9" "덧셈, 뺄셈 등의 수학 로직 퍼즐." "math"
create_issue 25 "단일 선 블록 채우기 퍼즐" "The Fashion Valley" "4.7" "한붓그리기 방식의 라인 채우기 퍼즐." "draw"
create_issue 26 "마작 원더스 (Mahjong Wonders)" "Nebula Studio" "4.7" "클래식 마작 타일 매칭 게임." "mahjong"
create_issue 27 "타일 매치 - 트리플 퍼즐" "PlaySimple Games" "4.8" "트리플 매치 규칙의 퍼즐." "triple-match"
create_issue 28 "Drop Away: Color Puzzle" "Rollic Games" "4.6" "색상을 정렬하여 블록을 떨어뜨리는 퍼즐." "sort-puzzle"
create_issue 29 "water sort puzzle - 컬러 분류 퍼즐게임" "Playvalve" "4.7" "튜브에 담긴 물을 색깔별로 분류하는 정렬 퍼즐." "sort-puzzle"
create_issue 30 "머지 페코 : 페코짱 카와이~!" "Springcomes" "4.9" "페코짱 캐릭터를 활용한 머지 게임." "merge"

# 31-40
create_issue 31 "나사 매치 - 나사풀기 핀 퍼즐" "BitEpoch" "4.7" "나사 풀기가 핵심인 3D 로직 퍼즐." "screw"
create_issue 32 "Wool Puzzle 3D" "XGame Global" "4.7" "털실을 가지고 노는 3D 공간 퍼즐." "rope-knot"
create_issue 33 "Car Match - Traffic Puzzle" "Grand Games A.Ş." "0.0" "차량 매치와 교통 정리를 결합한 퍼즐." "traffic"
create_issue 34 "씨사이드 익스케이프: 합성 & 스토리 게임" "Microfun Limited" "4.3" "바닷가 테마의 합성 & 스토리 게임." "merge"
create_issue 35 "Tile Home - 매치 퍼즐" "Panda Daily Puzzles" "4.7" "트리플 매치를 기반으로 집 꾸미기 요소를 더함." "triple-match"
create_issue 36 "상품 정렬: 매치 3 퍼즐 - Goods Sorting" "FALCON GAMES" "4.7" "진열된 상품을 정리하는 정렬 퍼즐." "sort-puzzle"
create_issue 37 "편의점 정리왕: 매치 마스터" "ACTIONFIT" "3.4" "편의점 상품을 정리하는 매치 게임." "sort-puzzle"
create_issue 38 "Color Knitzy" "VIGAFUN BAY" "4.6" "뜨개질과 유사한 색상 정렬 퍼즐." "sort-puzzle"
create_issue 39 "Snake Puzzle: Slither to Eat" "UniPuzz Games" "4.4" "뱀이 먹이를 먹는 경로를 찾는 로직 퍼즐." "brain-logic"
create_issue 40 "수학퍼즐: 연산 & 계산 - 숫자 게임" "Tripledot Studios Limited" "4.8" "연산 능력을 키우는 수학 퍼즐." "math"

# 41-50
create_issue 41 "Jigsolitaire - 지그소 솔리테어" "Gamincat" "4.8" "직소 퍼즐과 솔리테어를 합친 퓨전 게임." "other"
create_issue 42 "Quebra-cabeças do Pesadelo" "CYLINDER GLOBAL PTE. LTD." "4.2" "악몽 테마의 직소 퍼즐 게임." "other"
create_issue 43 "Find The Cat - Spot It!" "Agave Games" "4.9" "숨은 그림 중 고양이를 찾는 퍼즐." "hidden-object"
create_issue 44 "Mahjong Combinado" "ismail elaariss" "4.5" "마작과 유사한 매칭 스타일 퍼즐." "mahjong"
create_issue 45 "테트리스 - Tetris®" "PLAYSTUDIOS US, LLC" "4.3" "모두가 아는 클래식 블록 쌓기 게임." "classic"
create_issue 46 "Dot Puzzle: Connect & Relax" "ABI GAME" "4.5" "점 잇기 방식의 간단한 연결 퍼즐." "draw"
create_issue 47 "Travel Town - 결합 어드벤처" "Magmatic Games LTD" "4.8" "합성(Merge) 어드벤처 및 여행 테마." "merge"
create_issue 48 "Color Block Jam" "Rollic Games" "4.5" "색상 블록을 이용한 교통 정리 퍼즐." "traffic"
create_issue 49 "스도쿠 - 두뇌 게임, 숫자 게임" "Guru Puzzle Game" "4.9" "고평점 클래식 스도쿠 게임." "sudoku"
create_issue 50 "워드퍼즐 - 단어 게임!" "Kerun Games" "4.8" "단어를 찾는 크로스워드 퍼즐." "word"

# 51-60
create_issue 51 "Screwdom 3D" "iKame Games - Zego Studio" "4.7" "나무판의 나사를 풀고 빼는 3D 로직." "screw"
create_issue 52 "매치 팩토리 (Match Factory)!" "Peak" "4.5" "물건을 매칭하여 공장을 돌리는 퍼즐." "match-3"
create_issue 53 "Tangled Rope: Twisted Puzzle" "NORDKAPP GAMES LIMITED" "4.6" "꼬인 밧줄을 푸는 매듭 퍼즐." "rope-knot"
create_issue 54 "Pixel Flow" "Loom Games A.Ş." "4.5" "픽셀 단위의 흐름(Flow) 연결 퍼즐." "draw"
create_issue 55 "블록 크러시: 블록 퍼즐" "Flyfox Games" "4.3" "또 다른 유형의 블록 맞추기 퍼즐." "block-puzzle"
create_issue 56 "캔디 프렌즈 : 매치 3 퍼즐" "SUPERBOX Inc" "4.5" "귀여운 테마의 클래식 매치-3." "match-3"
create_issue 57 "Tricky Prank: Annoying Quest" "HIGAME Studio" "4.6" "장난과 속임수가 있는 트릭 퍼즐." "brain-logic"
create_issue 58 "물 분류 퍼즐 게임" "Guru Puzzle Game" "4.8" "물 색상 분류 유형의 인기작." "sort-puzzle"
create_issue 59 "Water Out Puzzle" "HM Games Pty Ltd" "4.8" "물을 빼내는 물리 기반 퍼즐." "sort-puzzle"
create_issue 60 "옆자리는 누구? : 꿀잼 논리 퍼즐 퀴즈게임" "FTY LLC." "4.5" "추리와 논리가 필요한 퀴즈 퍼즐." "brain-logic"

# 61-70
create_issue 61 "사과게임 - 화제의 인싸게임" "JIEUNK" "4.6" "특정 패턴의 사과를 터트리는 게임." "other"
create_issue 62 "탭탭2048 : 머지 2048 퍼즐게임" "Stormborn" "3.7" "2048에 탭 요소를 추가한 머지 퍼즐." "merge"
create_issue 63 "틀린그림 찾기 게임, 차이 여정" "Guru Puzzle Game" "4.9" "숨은그림찾기의 대표 장르, 틀린 그림 찾기." "hidden-object"
create_issue 64 "Domino Dreams" "SuperPlay." "4.6" "도미노 테마의 보드게임 기반 퍼즐." "other"
create_issue 65 "스도쿠 마스터 - Sudoku Master" "Malpa Games" "4.8" "다양한 레벨의 클래식 스도쿠." "sudoku"
create_issue 66 "넘버 매치 - 숫자 로직 퍼즐" "Easybrain" "4.5" "숫자 쌍을 찾는 로직 퍼즐." "math"
create_issue 67 "블라썸 매치: Blossom Sort®" "ZeroMaze" "4.8" "꽃 테마의 정렬 및 타일 매치." "sort-puzzle"
create_issue 68 "1 하트 윌 우들 스크류 온" "LifePulse Puzzle Game Studio" "4.8" "나무와 나사를 이용한 3D 퍼즐." "screw"
create_issue 69 "Dreamy Room - 꿈의 방" "ABI Games Studio" "4.5" "방 꾸미기와 매치 요소가 있는 퍼즐." "match-3"
create_issue 70 "Car Jam: 자동차 게임・주차의 달인" "Shycheese" "4.7" "교통 체증을 해소하는 주차 퍼즐." "traffic"

# 71-80
create_issue 71 "블럭 퍼즐: 놀면 놀수록 더 똑똑해지는 게임!" "LinkDesks Daily Puzzle" "4.5" "두뇌 훈련을 위한 블록 퍼즐." "block-puzzle"
create_issue 72 "Brainy Prankster" "TheSunStudio" "4.7" "넌센스와 트릭을 활용한 두뇌 게임." "brain-logic"
create_issue 73 "Tile Family® - 퍼즐 게임" "Playflux" "4.6" "타일 매치와 가족 테마의 결합." "triple-match"
create_issue 74 "Color Block : 테트리스" "Star Making fun" "4.6" "테트리스와 색상 요소를 섞은 블록 게임." "classic"
create_issue 75 "Toon Blast" "Peak" "4.6" "블록 터뜨리기 방식의 클래식 퍼즐." "match-3"
create_issue 76 "Color Slide Puzzle" "SayGames Ltd" "4.5" "색상을 슬라이드하여 맞추는 퍼즐." "sort-puzzle"
create_issue 77 "Traffic Frenzy: Road Jam" "Little Whale Game Limited" "4.9" "교통 체증을 관리하는 퍼즐." "traffic"
create_issue 78 "Yarn Fever! Unravel Puzzle" "Brave HK Limited" "4.7" "꼬인 실을 풀어내는 매듭 퍼즐." "rope-knot"
create_issue 79 "블록 퍼즐 - 별의 노래 (Starry Night)" "Withme" "4.9" "별빛 테마의 블록 맞추기 퍼즐." "block-puzzle"
create_issue 80 "Arrows - Puzzle Escape" "Lessmore UG" "4.5" "화살표 방향을 이용한 탈출 퍼즐." "brain-logic"

# 81-90
create_issue 81 "애니팡4" "Wemade Play Co.,Ltd." "4.3" "국민 매치-3 게임 시리즈의 최신작." "match-3"
create_issue 82 "Car Out! Traffic 자동차 주차게임" "Tripledot Studios Limited" "4.7" "주차장 탈출 테마의 슬라이딩 퍼즐." "traffic"
create_issue 83 "Skewer Jam: Food Sort" "iKame Games - Zego Studio" "4.5" "꼬치에 음식을 정렬하는 퍼즐." "sort-puzzle"
create_issue 84 "Bus Jam: 버스 게임" "Joymaster Puzzle Game Studio" "4.8" "버스를 이용한 교통 정리 퍼즐." "traffic"
create_issue 85 "애니팡3" "Wemade Play Co.,Ltd." "3.8" "애니팡 시리즈의 인기작." "match-3"
create_issue 86 "Brain Out®: 넌센스 마스터" "Focus apps" "4.7" "상상력을 자극하는 넌센스 퀴즈 퍼즐." "brain-logic"
create_issue 87 "Bus Craze - 교통 체증" "Unico Studio" "4.3" "교통 상황을 해결하는 퍼즐." "traffic"
create_issue 88 "헬로키티 마이 드림 스토어" "ACTGames Co., Ltd." "4.7" "헬로키티 IP를 활용한 스토어 퍼즐." "other"
create_issue 89 "Block Puzzle - 블럭 퍼즐" "Block Puzzle Jewel Games" "4.6" "보석 테마의 블록 퍼즐." "block-puzzle"
create_issue 90 "Nonogram - 일본 퍼즐 게임" "Pixel Art" "4.7" "노노그램 방식의 픽셀 아트 로직." "brain-logic"

# 91-100
create_issue 91 "Get Color - Water Sort Puzzle" "Tripledot Studios Limited" "4.7" "물 색깔 분류 퍼즐 게임." "sort-puzzle"
create_issue 92 "퍼즐쓰리고 - 화투 매치 3 퍼즐" "Sandwich Games Corp." "4.0" "화투 패를 이용한 매치-3 퍼즐." "match-3"
create_issue 93 "DOP 5: 한 부분 지우기" "SayGames Ltd" "4.6" "그림 일부 지우기 방식의 창의적인 퍼즐." "brain-logic"
create_issue 94 "Save the Doge" "WONDER GROUP" "4.5" "줄 긋기로 도지를 구하는 드로잉 퍼즐." "draw"
create_issue 95 "Woodoku Blast" "Tripledot Studios Limited" "4.9" "나무 블록 테마의 블록 퍼즐." "block-puzzle"
create_issue 96 "Mahjong Match - Puzzle Game" "Unicorn Board Games" "4.5" "마작을 이용한 매칭 퍼즐." "mahjong"
create_issue 97 "Tricky Twist Puzzle" "ABI GAME" "4.8" "트릭 요소가 가미된 로직 퍼즐." "brain-logic"
create_issue 98 "Hexa Away : 육각형 타일 퍼즐" "GOODROID,Inc." "4.4" "육각형 타일을 이용하는 퍼즐." "block-puzzle"
create_issue 99 "숫자 게임 - 10 만들기" "NimbleMind Network Inc." "4.9" "숫자를 합쳐 10을 만드는 로직 게임." "math"
create_issue 100 "Tidy Master: 완벽하게 정리하다" "PixOn Games" "4.5" "물건을 제자리에 정리하는 퍼즐." "sort-puzzle"

# 101-110
create_issue 101 "Survival Tile Connect" "Casual Games For Fun" "0.0" "생존 컨셉의 타일 연결 퍼즐." "triple-match"
create_issue 102 "주공을 지켜라: 전부 없애기" "Glaciers Game" "4.3" "물리 기반으로 적을 제거하는 퍼즐." "other"
create_issue 103 "차이점 - 찾기 & 발견하기" "Guru Puzzle Game" "4.9" "고평점의 틀린 그림 찾기 게임." "hidden-object"
create_issue 104 "Fantasy Tile : Sliding Match" "DC Office Manikganj" "4.8" "슬라이딩과 타일 매치 결합 퍼즐." "triple-match"
create_issue 105 "캔디 팝 포레스트 매치 - 3" "SUPERBOX Inc" "4.9" "숲 테마의 고전 매치-3." "match-3"
create_issue 106 "미스터리 타운 - 합치기 & 사건" "Cedar Games Studio" "4.8" "미스터리와 합성(Merge) 요소를 결합." "merge"
create_issue 107 "올인홀 All in Hole" "Homa" "4.9" "모든 것을 구멍에 넣는 하이퍼 캐주얼 퍼즐." "other"
create_issue 108 "Find Hidden Objects - Spot It!" "Yolo Game Studios" "4.9" "숨겨진 물건 찾기 게임." "hidden-object"
create_issue 109 "줄 그림: 리프트 퍼즐" "The Fashion Valley" "4.8" "선을 연결하여 그림을 완성하는 퍼즐." "draw"
create_issue 110 "포레스트 애니팝" "springpocket" "4.3" "숲 테마의 매치 퍼즐." "match-3"

# 111-120
create_issue 111 "방탈출 - 정신병원 탈출하기" "Peaksel Games" "4.8" "방탈출 컨셉의 로직 및 추리 게임." "brain-logic"
create_issue 112 "피쉬돔 (Fishdom)" "Playrix" "4.7" "수족관 꾸미기와 매치-3 결합." "match-3"
create_issue 113 "헬로 타운 : 신입사원 머지 성공 스토리" "Springcomes" "4.5" "도시 건설과 머지 요소의 결합." "merge"
create_issue 114 "Block! Triangle Puzzle Tangram" "BitMango" "4.4" "삼각형 블록을 이용한 탱그램 퍼즐." "block-puzzle"
create_issue 115 "지뢰 찾기" "Evkar games" "4.7" "PC 고전 게임의 대명사 지뢰 찾기." "classic"
create_issue 116 "픽셀 아트 - 숫자 색칠게임 책" "Easybrain" "4.5" "숫자에 따라 색칠하는 힐링 퍼즐." "other"
create_issue 117 "블록 퀘스트 (Blocky Quest)" "SayGames Ltd" "4.4" "블록을 이용한 퀘스트 기반 퍼즐." "block-puzzle"
create_issue 118 "Tic Tac Toe - XO: 둘이서 하는 게임" "Onetap Global" "4.3" "틱택토 로직 보드 게임." "classic"
create_issue 119 "Block Rush: Block Puzzle Game" "Grandfalls Limited" "4.8" "블록으로 라인을 채우는 퍼즐." "block-puzzle"
create_issue 120 "Car Jam Solver: 카잼 솔버" "Ladaneta Games" "4.7" "교통 체증을 해소하는 주차 로직 퍼즐." "traffic"

echo ""
echo "=== Done! 120 issues created ==="
