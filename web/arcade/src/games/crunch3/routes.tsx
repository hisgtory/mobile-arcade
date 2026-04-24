import { lazy, Suspense } from 'react';
import { registerRoutes } from '../../router';

const Crunch3HomeRoute = lazy(() =>
  import('./content').then((m) => ({ default: m.Crunch3HomeRoute })),
);
const Crunch3StageRoute = lazy(() =>
  import('./content').then((m) => ({ default: m.Crunch3StageRoute })),
);

registerRoutes('/games/crunch3/v1', [
  {
    path: '',
    element: (
      <Suspense fallback={null}>
        <Crunch3HomeRoute />
      </Suspense>
    ),
  },
  {
    path: 'stage/:stageId',
    element: (
      <Suspense fallback={null}>
        <Crunch3StageRoute />
      </Suspense>
    ),
  },
]);
