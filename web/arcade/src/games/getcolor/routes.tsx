import { lazy, Suspense } from 'react';
import { registerRoutes } from '../../router';

const GetColorHomeRoute = lazy(() =>
  import('./content').then((m) => ({ default: m.GetColorHomeRoute })),
);
const GetColorStageRoute = lazy(() =>
  import('./content').then((m) => ({ default: m.GetColorStageRoute })),
);

registerRoutes('/games/getcolor/v1', [
  {
    path: '',
    element: (
      <Suspense fallback={null}>
        <GetColorHomeRoute />
      </Suspense>
    ),
  },
  {
    path: 'stage/:stageId',
    element: (
      <Suspense fallback={null}>
        <GetColorStageRoute />
      </Suspense>
    ),
  },
]);
