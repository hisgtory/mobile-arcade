import { lazy, Suspense } from 'react';
import { registerRoutes } from '../../router';

const Number10HomeRoute = lazy(() =>
  import('./content').then((m) => ({ default: m.Number10HomeRoute })),
);
const Number10PlayRoute = lazy(() =>
  import('./content').then((m) => ({ default: m.Number10PlayRoute })),
);

registerRoutes('/games/number10/v1', [
  {
    path: '',
    element: (
      <Suspense fallback={null}>
        <Number10HomeRoute />
      </Suspense>
    ),
  },
  {
    path: 'play',
    element: (
      <Suspense fallback={null}>
        <Number10PlayRoute />
      </Suspense>
    ),
  },
]);
