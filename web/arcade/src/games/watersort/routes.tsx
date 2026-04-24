import { lazy, Suspense } from 'react';
import { registerRoutes } from '../../router';

const WaterSortHomeRoute = lazy(() =>
  import('./content').then((m) => ({ default: m.WaterSortHomeRoute })),
);
const WaterSortStageRoute = lazy(() =>
  import('./content').then((m) => ({ default: m.WaterSortStageRoute })),
);

registerRoutes('/games/watersort/v1', [
  {
    path: '',
    element: (
      <Suspense fallback={null}>
        <WaterSortHomeRoute />
      </Suspense>
    ),
  },
  {
    path: 'stage/:stageId',
    element: (
      <Suspense fallback={null}>
        <WaterSortStageRoute />
      </Suspense>
    ),
  },
]);
