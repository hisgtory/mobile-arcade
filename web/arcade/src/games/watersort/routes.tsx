import { lazy, Suspense } from 'react';
import { registerRoutes } from '../../router';

const WaterSortHomeRoute = lazy(() => import('./pages').then((m) => ({ default: m.WaterSortHomeRoute })));
const WaterSortStageRoute = lazy(() => import('./pages').then((m) => ({ default: m.WaterSortStageRoute })));

const fallback = <div style={{ width: '100%', height: '100%', background: '#F9FAFB' }} />;

registerRoutes('/games/watersort/v1', [
  { path: '', element: <Suspense fallback={fallback}><WaterSortHomeRoute /></Suspense> },
  { path: 'stage/:stageId', element: <Suspense fallback={fallback}><WaterSortStageRoute /></Suspense> },
]);
