import { lazy, Suspense } from 'react';
import { registerRoutes } from '../../router';

const BlockRushHomeRoute = lazy(() =>
  import('./content').then((m) => ({ default: m.BlockRushHomeRoute })),
);
const BlockRushPlayRoute = lazy(() =>
  import('./content').then((m) => ({ default: m.BlockRushPlayRoute })),
);

registerRoutes('/games/blockrush/v1', [
  {
    path: '',
    element: (
      <Suspense fallback={null}>
        <BlockRushHomeRoute />
      </Suspense>
    ),
  },
  {
    path: 'play',
    element: (
      <Suspense fallback={null}>
        <BlockRushPlayRoute />
      </Suspense>
    ),
  },
]);
