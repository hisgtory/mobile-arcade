import { lazy, Suspense } from 'react';
import { registerRoutes } from '../../router';

const BlockRushHomeRoute = lazy(() => import('./pages').then((m) => ({ default: m.BlockRushHomeRoute })));
const BlockRushPlayRoute = lazy(() => import('./pages').then((m) => ({ default: m.BlockRushPlayRoute })));

const fallback = <div style={{ width: '100%', height: '100%', background: '#F9FAFB' }} />;

registerRoutes('/games/blockrush/v1', [
  { path: '', element: <Suspense fallback={fallback}><BlockRushHomeRoute /></Suspense> },
  { path: 'play', element: <Suspense fallback={fallback}><BlockRushPlayRoute /></Suspense> },
]);
