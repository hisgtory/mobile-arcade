import { type BoardState, type StageConfig, type ItemState, type ShelfState, DEFAULT_WIDTH } from '../types';

export function createBoard(config: StageConfig): BoardState {
  const { numCategories, itemsPerCategory } = config;
  const totalItems = numCategories * itemsPerCategory;

  // Create items with category assignments
  const itemList: { category: number }[] = [];
  for (let c = 0; c < numCategories; c++) {
    for (let i = 0; i < itemsPerCategory; i++) {
      itemList.push({ category: c });
    }
  }

  // Fisher-Yates shuffle
  for (let i = itemList.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [itemList[i], itemList[j]] = [itemList[j], itemList[i]];
  }

  // Floor area for scattered items
  const floorLeft = 40;
  const floorRight = DEFAULT_WIDTH - 40;
  const floorTop = 60;
  const floorBottom = 370;

  // Optimal column count to keep cells roughly square given the floor dimensions
  const cols = Math.ceil(Math.sqrt(totalItems * (floorRight - floorLeft) / (floorBottom - floorTop)));
  const rows = Math.ceil(totalItems / cols);
  const cellW = (floorRight - floorLeft) / cols;
  const cellH = (floorBottom - floorTop) / rows;

  const items: ItemState[] = [];
  let id = 0;
  for (let r = 0; r < rows && id < totalItems; r++) {
    for (let c = 0; c < cols && id < totalItems; c++) {
      const baseX = floorLeft + c * cellW + cellW / 2;
      const baseY = floorTop + r * cellH + cellH / 2;
      // Random offset for messy feel (±15% of cell size)
      const offsetX = (Math.random() - 0.5) * cellW * 0.3;
      const offsetY = (Math.random() - 0.5) * cellH * 0.3;
      items.push({
        id,
        category: itemList[id].category,
        x: baseX + offsetX,
        y: baseY + offsetY,
        shelved: false,
      });
      id++;
    }
  }

  // Create shelves
  const shelves: ShelfState[] = [];
  for (let c = 0; c < numCategories; c++) {
    shelves.push({
      category: c,
      items: [],
      capacity: itemsPerCategory,
    });
  }

  return { items, shelves, numCategories };
}

export function placeItem(board: BoardState, itemId: number, shelfIndex: number): { correct: boolean; board: BoardState } {
  const newItems = board.items.map(it => ({ ...it }));
  const newShelves = board.shelves.map(sh => ({ ...sh, items: [...sh.items] }));

  const item = newItems.find(it => it.id === itemId);
  if (!item || item.shelved) return { correct: false, board: { ...board, items: newItems, shelves: newShelves } };

  const shelf = newShelves[shelfIndex];
  const correct = item.category === shelf.category;

  if (correct) {
    item.shelved = true;
    shelf.items.push(itemId);
  }

  return { correct, board: { ...board, items: newItems, shelves: newShelves } };
}

export function isWon(board: BoardState): boolean {
  return board.items.every(item => item.shelved);
}

export function undoPlace(board: BoardState, itemId: number, shelfIndex: number): BoardState {
  const newItems = board.items.map(it => ({ ...it }));
  const newShelves = board.shelves.map(sh => ({ ...sh, items: [...sh.items] }));

  const item = newItems.find(it => it.id === itemId);
  if (item) {
    item.shelved = false;
  }

  newShelves[shelfIndex].items = newShelves[shelfIndex].items.filter(id => id !== itemId);

  return { ...board, items: newItems, shelves: newShelves };
}
