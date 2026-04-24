import { lazy, Suspense } from 'react';
import { registerRoutes } from '../../router';

const ChessHomeRoute = lazy(() =>
  import('./content').then((m) => ({ default: m.ChessHomeRoute })),
);
const ChessPlayRoute = lazy(() =>
  import('./content').then((m) => ({ default: m.ChessPlayRoute })),
);

registerRoutes('/games/chess/v1', [
  {
    path: '',
    element: (
      <Suspense fallback={null}>
        <ChessHomeRoute />
      </Suspense>
    ),
  },
  {
    path: 'play',
    element: (
      <Suspense fallback={null}>
        <ChessPlayRoute />
      </Suspense>
    ),
  },
]);
