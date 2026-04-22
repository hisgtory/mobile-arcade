import { lazy, Suspense } from 'react';
import { registerRoutes } from '../../router';

const BlockCrushHomeRoute = lazy(() => import('./pages').then((m) => ({ default: m.BlockCrushHomeRoute })));
const BlockCrushPlayRoute = lazy(() => import('./pages').then((m) => ({ default: m.BlockCrushPlayRoute })));

const fallback = <div style={{ width: '100%', height: '100%', background: '#F9FAFB' }} />;

registerRoutes('/games/blockcrush/v1', [
  { path: '', element: <Suspense fallback={fallback}><BlockCrushHomeRoute /></Suspense> },
  { path: 'play', element: <Suspense fallback={fallback}><BlockCrushPlayRoute /></Suspense> },
]);
