import type { RoomConfig, StageConfig } from '../types';

// ─── Room 1: 격리실 (Isolation Room) ─────────────────────
const room1: RoomConfig = {
  stage: 1,
  title: '격리실',
  description: '차가운 격리실에서 깨어났다. 문은 잠겨 있다. 여기서 나가야 한다.',
  bgColor: 0xe8e0d4,
  items: [
    { id: 'key_rusty', label: '녹슨 열쇠', icon: '🔑' },
  ],
  objects: [
    {
      id: 'bed',
      label: '침대',
      x: 0.1, y: 0.45, w: 0.35, h: 0.18,
      kind: 'inspectable',
      inspectText: '낡은 침대다. 베개 아래에 무언가 반짝이는 것이 보인다.',
      color: 0x8b7355,
      icon: '🛏️',
    },
    {
      id: 'pillow_key',
      label: '베개 아래',
      x: 0.15, y: 0.45, w: 0.12, h: 0.08,
      kind: 'collectible',
      grantsItem: 'key_rusty',
      hidden: true,
      prerequisite: 'bed',
      color: 0xffd700,
      icon: '🔑',
    },
    {
      id: 'window',
      label: '창문',
      x: 0.55, y: 0.15, w: 0.25, h: 0.22,
      kind: 'inspectable',
      inspectText: '철창이 달려 있어 빠져나갈 수 없다. 밖은 어둡다.',
      color: 0x87ceeb,
      icon: '🪟',
    },
    {
      id: 'wall_scratch',
      label: '벽의 긁힌 자국',
      x: 0.6, y: 0.5, w: 0.18, h: 0.12,
      kind: 'inspectable',
      inspectText: '"여기서 나가려면 침대를 확인해"라고 긁혀 있다.',
      color: 0xc0b090,
      icon: '📝',
    },
    {
      id: 'door1',
      label: '철문',
      x: 0.38, y: 0.1, w: 0.24, h: 0.55,
      kind: 'exit',
      requiresItem: 'key_rusty',
      color: 0x696969,
      icon: '🚪',
    },
  ],
};

// ─── Room 2: 복도 (Corridor) ─────────────────────────────
const room2: RoomConfig = {
  stage: 2,
  title: '복도',
  description: '어두운 복도다. 끝에 잠긴 문이 보인다. 비밀번호가 필요한 것 같다.',
  bgColor: 0xd4cec4,
  items: [
    { id: 'note_code', label: '메모지', icon: '📄' },
  ],
  objects: [
    {
      id: 'bulletin',
      label: '게시판',
      x: 0.05, y: 0.15, w: 0.28, h: 0.22,
      kind: 'inspectable',
      inspectText: '환자 일정표가 붙어 있다. 하단에 "7482"라고 적혀 있다.',
      color: 0xa0522d,
      icon: '📋',
    },
    {
      id: 'fire_ext',
      label: '소화기',
      x: 0.7, y: 0.35, w: 0.12, h: 0.2,
      kind: 'inspectable',
      inspectText: '빨간 소화기가 벽에 걸려 있다. 딱히 쓸 데가 없다.',
      color: 0xcc0000,
      icon: '🧯',
    },
    {
      id: 'trash',
      label: '쓰레기통',
      x: 0.08, y: 0.55, w: 0.15, h: 0.15,
      kind: 'inspectable',
      inspectText: '구겨진 메모지가 보인다. "비밀번호 힌트: 게시판 하단"',
      color: 0x808080,
      icon: '🗑️',
    },
    {
      id: 'memo_pickup',
      label: '메모지 줍기',
      x: 0.08, y: 0.55, w: 0.15, h: 0.15,
      kind: 'collectible',
      grantsItem: 'note_code',
      hidden: true,
      prerequisite: 'trash',
      color: 0xffffff,
      icon: '📄',
    },
    {
      id: 'keypad_door',
      label: '비밀번호 잠금 문',
      x: 0.35, y: 0.08, w: 0.3, h: 0.55,
      kind: 'exit',
      requiresItem: 'note_code',
      color: 0x505050,
      icon: '🔢',
    },
  ],
};

// ─── Room 3: 진료실 (Treatment Room) ────────────────────
const room3: RoomConfig = {
  stage: 3,
  title: '진료실',
  description: '의료 기기가 가득한 방이다. 약품장의 열쇠를 찾아야 한다.',
  bgColor: 0xdce8dc,
  items: [
    { id: 'cabinet_key', label: '작은 열쇠', icon: '🗝️' },
    { id: 'scissors', label: '가위', icon: '✂️' },
  ],
  objects: [
    {
      id: 'desk',
      label: '진료 책상',
      x: 0.05, y: 0.35, w: 0.35, h: 0.18,
      kind: 'inspectable',
      inspectText: '서랍에 작은 열쇠가 있다!',
      color: 0xdeb887,
      icon: '🪑',
    },
    {
      id: 'desk_key',
      label: '서랍 속 열쇠',
      x: 0.1, y: 0.4, w: 0.1, h: 0.08,
      kind: 'collectible',
      grantsItem: 'cabinet_key',
      hidden: true,
      prerequisite: 'desk',
      color: 0xffd700,
      icon: '🗝️',
    },
    {
      id: 'cabinet',
      label: '약품장',
      x: 0.55, y: 0.15, w: 0.25, h: 0.35,
      kind: 'usable',
      requiresItem: 'cabinet_key',
      inspectText: '잠겨 있다. 열쇠가 필요하다.',
      color: 0xf0f0f0,
      icon: '🗄️',
    },
    {
      id: 'cabinet_scissors',
      label: '약품장 안의 가위',
      x: 0.6, y: 0.2, w: 0.12, h: 0.1,
      kind: 'collectible',
      grantsItem: 'scissors',
      hidden: true,
      prerequisite: 'cabinet',
      color: 0xc0c0c0,
      icon: '✂️',
    },
    {
      id: 'xray',
      label: 'X-ray 필름',
      x: 0.6, y: 0.6, w: 0.2, h: 0.15,
      kind: 'inspectable',
      inspectText: '누군가의 X-ray 필름이다. 뒷면에 "출구는 봉인되어 있다"라고 적혀 있다.',
      color: 0x333333,
      icon: '🩻',
    },
    {
      id: 'sealed_door',
      label: '봉인된 문',
      x: 0.35, y: 0.08, w: 0.24, h: 0.55,
      kind: 'exit',
      requiresItem: 'scissors',
      color: 0x606060,
      icon: '🚪',
    },
  ],
};

// ─── Room 4: 지하실 (Basement) ──────────────────────────
const room4: RoomConfig = {
  stage: 4,
  title: '지하실',
  description: '어둡고 습한 지하실이다. 배전반의 스위치를 찾아 전기를 켜야 한다.',
  bgColor: 0xb0a898,
  items: [
    { id: 'flashlight', label: '손전등', icon: '🔦' },
    { id: 'fuse', label: '퓨즈', icon: '⚡' },
  ],
  objects: [
    {
      id: 'shelf',
      label: '선반',
      x: 0.05, y: 0.2, w: 0.3, h: 0.25,
      kind: 'inspectable',
      inspectText: '먼지 투성이 선반. 손전등이 하나 있다!',
      color: 0x8b6914,
      icon: '📦',
    },
    {
      id: 'shelf_flashlight',
      label: '손전등',
      x: 0.1, y: 0.25, w: 0.1, h: 0.08,
      kind: 'collectible',
      grantsItem: 'flashlight',
      hidden: true,
      prerequisite: 'shelf',
      color: 0xffff00,
      icon: '🔦',
    },
    {
      id: 'dark_corner',
      label: '어두운 구석',
      x: 0.6, y: 0.5, w: 0.2, h: 0.18,
      kind: 'usable',
      requiresItem: 'flashlight',
      inspectText: '너무 어두워서 보이지 않는다. 빛이 필요하다.',
      color: 0x333333,
      icon: '🌑',
    },
    {
      id: 'dark_corner_fuse',
      label: '퓨즈',
      x: 0.65, y: 0.55, w: 0.1, h: 0.08,
      kind: 'collectible',
      grantsItem: 'fuse',
      hidden: true,
      prerequisite: 'dark_corner',
      color: 0xff8c00,
      icon: '⚡',
    },
    {
      id: 'pipes',
      label: '배관',
      x: 0.05, y: 0.6, w: 0.25, h: 0.12,
      kind: 'inspectable',
      inspectText: '녹슨 배관들이 벽을 따라 이어져 있다. 물이 새고 있다.',
      color: 0x708090,
      icon: '🔧',
    },
    {
      id: 'breaker_panel',
      label: '배전반',
      x: 0.35, y: 0.08, w: 0.3, h: 0.5,
      kind: 'exit',
      requiresItem: 'fuse',
      color: 0x404040,
      icon: '⚙️',
    },
  ],
};

// ─── Room 5: 옥상 (Rooftop) ────────────────────────────
const room5: RoomConfig = {
  stage: 5,
  title: '옥상',
  description: '마지막 관문! 옥상에서 탈출할 방법을 찾아야 한다.',
  bgColor: 0xc8d8e8,
  items: [
    { id: 'rope', label: '로프', icon: '🪢' },
    { id: 'hook', label: '갈고리', icon: '🪝' },
    { id: 'rope_hook', label: '갈고리 로프', icon: '🧗' },
  ],
  objects: [
    {
      id: 'storage_box',
      label: '보관함',
      x: 0.05, y: 0.35, w: 0.25, h: 0.18,
      kind: 'inspectable',
      inspectText: '오래된 보관함 안에 로프가 있다!',
      color: 0x8b7355,
      icon: '📦',
    },
    {
      id: 'box_rope',
      label: '로프',
      x: 0.1, y: 0.38, w: 0.1, h: 0.08,
      kind: 'collectible',
      grantsItem: 'rope',
      hidden: true,
      prerequisite: 'storage_box',
      color: 0xdaa520,
      icon: '🪢',
    },
    {
      id: 'antenna',
      label: '안테나',
      x: 0.7, y: 0.1, w: 0.15, h: 0.3,
      kind: 'inspectable',
      inspectText: '오래된 TV 안테나다. 갈고리처럼 생긴 부분이 있다.',
      color: 0xa0a0a0,
      icon: '📡',
    },
    {
      id: 'antenna_hook',
      label: '갈고리 떼기',
      x: 0.72, y: 0.12, w: 0.1, h: 0.1,
      kind: 'collectible',
      grantsItem: 'hook',
      hidden: true,
      prerequisite: 'antenna',
      color: 0xc0c0c0,
      icon: '🪝',
    },
    {
      id: 'combine_spot',
      label: '조합하기',
      x: 0.3, y: 0.55, w: 0.4, h: 0.12,
      kind: 'usable',
      requiresItem: 'hook',
      inspectText: '로프와 갈고리를 결합할 수 있을 것 같다.',
      color: 0x90a090,
      icon: '🔗',
    },
    {
      id: 'combine_result',
      label: '갈고리 로프',
      x: 0.35, y: 0.55, w: 0.15, h: 0.08,
      kind: 'collectible',
      grantsItem: 'rope_hook',
      hidden: true,
      prerequisite: 'combine_spot',
      color: 0xffd700,
      icon: '🧗',
    },
    {
      id: 'skylight',
      label: '하늘 전망',
      x: 0.35, y: 0.05, w: 0.3, h: 0.15,
      kind: 'inspectable',
      inspectText: '탁 트인 하늘이 보인다. 자유가 가까이 있다!',
      color: 0x87ceeb,
      icon: '🌅',
    },
    {
      id: 'ledge',
      label: '난간',
      x: 0.35, y: 0.2, w: 0.3, h: 0.25,
      kind: 'exit',
      requiresItem: 'rope_hook',
      color: 0x808080,
      icon: '🏃',
    },
  ],
};

// ─── Exports ────────────────────────────────────────────

const ROOMS: RoomConfig[] = [room1, room2, room3, room4, room5];

export function getRoomConfig(stage: number): RoomConfig {
  const idx = Math.max(0, Math.min(stage - 1, ROOMS.length - 1));
  return ROOMS[idx];
}

export function getMaxStage(): number {
  return ROOMS.length;
}

export function getStageList(): StageConfig[] {
  return ROOMS.map((r) => ({ stage: r.stage, title: r.title }));
}
