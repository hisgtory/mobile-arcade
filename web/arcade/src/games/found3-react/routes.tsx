import { lazy, Suspense } from 'react';
import { registerRoutes } from '../../router';

const Found3ReactHomeRoute = lazy(() =>
  import('./content').then((m) => ({ default: m.Found3ReactHomeRoute })),
);
const Found3ReactStageRoute = lazy(() =>
  import('./content').then((m) => ({ default: m.Found3ReactStageRoute })),
);

registerRoutes('/games/found3-react/v1', [
  {
    path: '',
    element: (
      <Suspense fallback={null}>
        <Found3ReactHomeRoute />
      </Suspense>
    ),
  },
  {
    path: 'stage/:stageId',
    element: (
      <Suspense fallback={null}>
        <Found3ReactStageRoute />
      </Suspense>
    ),
  },
]);
