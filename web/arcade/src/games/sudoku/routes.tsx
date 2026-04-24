import { lazy, Suspense } from 'react';
import { registerRoutes } from '../../router';

const SudokuHomeRoute = lazy(() =>
  import('./content').then((m) => ({ default: m.SudokuHomeRoute })),
);
const SudokuStageRoute = lazy(() =>
  import('./content').then((m) => ({ default: m.SudokuStageRoute })),
);

registerRoutes('/games/sudoku/v1', [
  {
    path: '',
    element: (
      <Suspense fallback={null}>
        <SudokuHomeRoute />
      </Suspense>
    ),
  },
  {
    path: 'stage/:stageId',
    element: (
      <Suspense fallback={null}>
        <SudokuStageRoute />
      </Suspense>
    ),
  },
]);
