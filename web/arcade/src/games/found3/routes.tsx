import { lazy, Suspense } from 'react';
import { registerRoutes } from '../../router';

const Found3HomeRoute = lazy(() => import('./pages').then((m) => ({ default: m.Found3HomeRoute })));
const Found3StageRoute = lazy(() => import('./pages').then((m) => ({ default: m.Found3StageRoute })));

const fallback = <div style={{ width: '100%', height: '100%', background: '#F9FAFB' }} />;

registerRoutes('/games/found3/v1', [
  { path: '', element: <Suspense fallback={fallback}><Found3HomeRoute /></Suspense> },
  { path: 'stage/:stageId', element: <Suspense fallback={fallback}><Found3StageRoute /></Suspense> },
]);
