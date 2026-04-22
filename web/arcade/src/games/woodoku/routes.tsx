import { lazy, Suspense } from 'react';
import { registerRoutes } from '../../router';

const WoodokuHomeRoute = lazy(() => import('./pages').then((m) => ({ default: m.WoodokuHomeRoute })));
const WoodokuPlayRoute = lazy(() => import('./pages').then((m) => ({ default: m.WoodokuPlayRoute })));

const fallback = <div style={{ width: '100%', height: '100%', background: '#F9FAFB' }} />;

registerRoutes('/games/woodoku/v1', [
  { path: '', element: <Suspense fallback={fallback}><WoodokuHomeRoute /></Suspense> },
  { path: 'play', element: <Suspense fallback={fallback}><WoodokuPlayRoute /></Suspense> },
]);
