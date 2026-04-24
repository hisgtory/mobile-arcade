import { lazy, Suspense } from 'react';
import { registerRoutes } from '../../router';

const BlockPuzzleHomeRoute = lazy(() =>
  import('./content').then((m) => ({ default: m.BlockPuzzleHomeRoute })),
);
const BlockPuzzlePlayRoute = lazy(() =>
  import('./content').then((m) => ({ default: m.BlockPuzzlePlayRoute })),
);

registerRoutes('/games/blockpuzzle/v1', [
  {
    path: '',
    element: (
      <Suspense fallback={null}>
        <BlockPuzzleHomeRoute />
      </Suspense>
    ),
  },
  {
    path: 'play',
    element: (
      <Suspense fallback={null}>
        <BlockPuzzlePlayRoute />
      </Suspense>
    ),
  },
]);
