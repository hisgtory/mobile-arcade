import { lazy, Suspense } from 'react';
import { registerRoutes } from '../../router';

const Crunch3HomeRoute = lazy(() => import('./pages').then((m) => ({ default: m.Crunch3HomeRoute })));
const Crunch3StageRoute = lazy(() => import('./pages').then((m) => ({ default: m.Crunch3StageRoute })));

const fallback = <div style={{ width: '100%', height: '100%', background: '#F9FAFB' }} />;

registerRoutes('/games/crunch3/v1', [
  { path: '', element: <Suspense fallback={fallback}><Crunch3HomeRoute /></Suspense> },
  { path: 'stage/:stageId', element: <Suspense fallback={fallback}><Crunch3StageRoute /></Suspense> },
]);
