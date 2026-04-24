import { lazy, Suspense } from 'react';
import { registerRoutes } from '../../router';

const BlockCrushHomeRoute = lazy(() =>
  import('./content').then((m) => ({ default: m.BlockCrushHomeRoute })),
);
const BlockCrushPlayRoute = lazy(() =>
  import('./content').then((m) => ({ default: m.BlockCrushPlayRoute })),
);

registerRoutes('/games/blockcrush/v1', [
  {
    path: '',
    element: (
      <Suspense fallback={null}>
        <BlockCrushHomeRoute />
      </Suspense>
    ),
  },
  {
    path: 'play',
    element: (
      <Suspense fallback={null}>
        <BlockCrushPlayRoute />
      </Suspense>
    ),
  },
]);
