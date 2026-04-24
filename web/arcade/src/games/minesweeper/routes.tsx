import { lazy, Suspense } from 'react';
import { registerRoutes } from '../../router';

const MinesweeperHomeRoute = lazy(() =>
  import('./content').then((m) => ({ default: m.MinesweeperHomeRoute })),
);
const MinesweeperPlayRoute = lazy(() =>
  import('./content').then((m) => ({ default: m.MinesweeperPlayRoute })),
);

registerRoutes('/games/minesweeper/v1', [
  {
    path: '',
    element: (
      <Suspense fallback={null}>
        <MinesweeperHomeRoute />
      </Suspense>
    ),
  },
  {
    path: 'play/:difficulty',
    element: (
      <Suspense fallback={null}>
        <MinesweeperPlayRoute />
      </Suspense>
    ),
  },
]);
