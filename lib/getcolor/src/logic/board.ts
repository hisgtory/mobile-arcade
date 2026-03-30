// Get Color shares all tube-puzzle logic with Water Sort.
// No duplication — import everything from the shared watersort package.
export {
  createBoard,
  topCount,
  topColor,
  canPour,
  executePour,
  isTubeSolved,
  isWon,
  isSolvable,
} from '@arcade/lib-watersort';
