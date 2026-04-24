import { lazy, Suspense } from 'react';
import { registerRoutes } from '../../router';

const WoodokuHomeRoute = lazy(() =>
  import('./content').then((m) => ({ default: m.WoodokuHomeRoute })),
);
const WoodokuPlayRoute = lazy(() =>
  import('./content').then((m) => ({ default: m.WoodokuPlayRoute })),
);

registerRoutes('/games/woodoku/v1', [
  {
    path: '',
    element: (
      <Suspense fallback={null}>
        <WoodokuHomeRoute />
      </Suspense>
    ),
  },
  {
    path: 'play',
    element: (
      <Suspense fallback={null}>
        <WoodokuPlayRoute />
      </Suspense>
    ),
  },
]);
