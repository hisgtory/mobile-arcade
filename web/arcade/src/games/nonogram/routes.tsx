import { lazy, Suspense } from 'react';
import { registerRoutes } from '../../router';

const NonogramHome = lazy(() =>
  import('./content').then((m) => ({ default: m.NonogramHome })),
);
const NonogramStage = lazy(() =>
  import('./content').then((m) => ({ default: m.NonogramStage })),
);

registerRoutes('/games/nonogram/v1', [
  {
    path: '',
    element: (
      <Suspense fallback={null}>
        <NonogramHome />
      </Suspense>
    ),
  },
  {
    path: 'stage/:stageId',
    element: (
      <Suspense fallback={null}>
        <NonogramStage />
      </Suspense>
    ),
  },
]);
