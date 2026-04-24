import { lazy, Suspense } from 'react';
import { registerRoutes } from '../../router';

const Found3HomeRoute = lazy(() =>
  import('./content').then((m) => ({ default: m.Found3HomeRoute })),
);
const Found3StageRoute = lazy(() =>
  import('./content').then((m) => ({ default: m.Found3StageRoute })),
);

registerRoutes('/games/found3/v1', [
  {
    path: '',
    element: (
      <Suspense fallback={null}>
        <Found3HomeRoute />
      </Suspense>
    ),
  },
  {
    path: 'stage/:stageId',
    element: (
      <Suspense fallback={null}>
        <Found3StageRoute />
      </Suspense>
    ),
  },
]);
