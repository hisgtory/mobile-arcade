import { lazy, Suspense } from 'react';
import { registerRoutes } from '../../router';

const GetColorHomeRoute = lazy(() => import('./pages').then((m) => ({ default: m.GetColorHomeRoute })));
const GetColorStageRoute = lazy(() => import('./pages').then((m) => ({ default: m.GetColorStageRoute })));

const fallback = <div style={{ width: '100%', height: '100%', background: '#F9FAFB' }} />;

// ─── Route Registration ─────────────────────────────────

registerRoutes('/games/getcolor/v1', [
  { path: '', element: <Suspense fallback={fallback}><GetColorHomeRoute /></Suspense> },
  { path: 'stage/:stageId', element: <Suspense fallback={fallback}><GetColorStageRoute /></Suspense> },
]);
