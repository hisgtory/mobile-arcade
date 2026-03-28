export type GameCategory = 'puzzle' | 'action' | 'casual' | 'card' | 'strategy';

export interface GameInfo {
  id: string;
  name: string;
  description: string;
  icon: string; // emoji for now
  category: GameCategory;
  color: string; // card accent color
  webPath: string; // e.g. '/games/found3/v1'
  stageCount?: number;
  isNew?: boolean;
  isFeatured?: boolean;
}

export const CATEGORIES: { key: GameCategory | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'puzzle', label: 'Puzzle' },
  { key: 'action', label: 'Action' },
  { key: 'casual', label: 'Casual' },
  { key: 'card', label: 'Card' },
  { key: 'strategy', label: 'Strategy' },
];

export const GAMES: GameInfo[] = [
  {
    id: 'found3',
    name: 'Found 3',
    description: 'Match 3 identical tiles to clear the board!',
    icon: '🍕',
    category: 'puzzle',
    color: '#FA6C41',
    webPath: '/games/found3/v1',
    stageCount: 5,
    isFeatured: true,
    isNew: true,
  },
  {
    id: 'crunch3',
    name: 'Crunch 3',
    description: 'Swipe & match 3 tiles to crush!',
    icon: '🍩',
    category: 'puzzle',
    color: '#8B5CF6',
    webPath: '/games/crunch3/v1',
    stageCount: 5,
    isNew: true,
  },
  // Placeholder games for UI preview — will be replaced with real games
  {
    id: 'stack-tower',
    name: 'Stack Tower',
    description: 'Stack blocks as high as you can!',
    icon: '🏗️',
    category: 'casual',
    color: '#2563EB',
    webPath: '/games/stack-tower/v1',
    isNew: true,
  },
  {
    id: 'color-match',
    name: 'Color Match',
    description: 'Tap the matching colors before time runs out!',
    icon: '🎨',
    category: 'puzzle',
    color: '#8B5CF6',
    webPath: '/games/color-match/v1',
  },
  {
    id: 'bounce-ball',
    name: 'Bounce Ball',
    description: 'Keep the ball bouncing, break all bricks!',
    icon: '🏓',
    category: 'action',
    color: '#059669',
    webPath: '/games/bounce-ball/v1',
  },
  {
    id: 'card-flip',
    name: 'Card Flip',
    description: 'Find matching pairs by flipping cards!',
    icon: '🃏',
    category: 'card',
    color: '#DC2626',
    webPath: '/games/card-flip/v1',
  },
  {
    id: 'merge-num',
    name: 'Merge Number',
    description: 'Merge same numbers to reach 2048!',
    icon: '🔢',
    category: 'strategy',
    color: '#D97706',
    webPath: '/games/merge-num/v1',
  },
];

export function getGameById(id: string): GameInfo | undefined {
  return GAMES.find((g) => g.id === id);
}

export function getFeaturedGame(): GameInfo | undefined {
  return GAMES.find((g) => g.isFeatured);
}

export function getNewGames(): GameInfo[] {
  return GAMES.filter((g) => g.isNew);
}

export function getGamesByCategory(category: GameCategory | 'all'): GameInfo[] {
  if (category === 'all') return GAMES;
  return GAMES.filter((g) => g.category === category);
}
