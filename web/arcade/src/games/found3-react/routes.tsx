import { lazy, Suspense } from 'react';
import { registerRoutes } from '../../router';

const Found3ReactHomeRoute = lazy(() => import('./pages').then((m) => ({ default: m.Found3ReactHomeRoute })));
const Found3ReactStageRoute = lazy(() => import('./pages').then((m) => ({ default: m.Found3ReactStageRoute })));

const fallback = <div style={{ width: '100%', height: '100%', background: '#F9FAFB' }} />;

registerRoutes('/games/found3-react/v1', [
  { path: '', element: <Suspense fallback={fallback}><Found3ReactHomeRoute /></Suspense> },
  { path: 'stage/:stageId', element: <Suspense fallback={fallback}><Found3ReactStageRoute /></Suspense> },
]);

