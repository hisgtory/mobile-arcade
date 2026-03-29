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
  {
    id: 'blockrush',
    name: 'Block Rush',
    description: 'Fill lines with block pieces!',
    icon: '🟧',
    category: 'puzzle',
    color: '#2563EB',
    webPath: '/games/blockrush/v1/play',
    isNew: true,
  },
  {
    id: 'watersort',
    name: 'Water Sort',
    description: 'Sort colored water into tubes!',
    icon: '🧪',
    category: 'puzzle',
    color: '#06B6D4',
    webPath: '/games/watersort/v1',
    stageCount: 5,
    isNew: true,
  },
  {
    id: 'tictactoe',
    name: 'Tic Tac Toe',
    description: 'Beat the AI in classic XO!',
    icon: '❌',
    category: 'casual',
    color: '#EF4444',
    webPath: '/games/tictactoe/v1/play',
    isNew: true,
  },
  {
    id: 'number10',
    name: 'Make 10',
    description: 'Drag numbers that sum to 10!',
    icon: '🔢',
    category: 'puzzle',
    color: '#3B82F6',
    webPath: '/games/number10/v1/play',
    isNew: true,
  },
  {
    id: 'minesweeper',
    name: 'Minesweeper',
    description: 'Classic mine-sweeping puzzle!',
    icon: '💣',
    category: 'puzzle',
    color: '#374151',
    webPath: '/games/minesweeper/v1',
    isNew: true,
  },
  {
    id: 'sudoku',
    name: 'Sudoku',
    description: 'Classic number brain puzzle!',
    icon: '🧩',
    category: 'puzzle',
    color: '#7C3AED',
    webPath: '/games/sudoku/v1',
    stageCount: 5,
    isNew: true,
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
