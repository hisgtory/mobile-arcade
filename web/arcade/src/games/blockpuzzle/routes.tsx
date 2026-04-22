import { lazy, Suspense } from 'react';
import { registerRoutes } from '../../router';

const BlockPuzzleHomeRoute = lazy(() => import('./pages').then((m) => ({ default: m.BlockPuzzleHomeRoute })));
const BlockPuzzlePlayRoute = lazy(() => import('./pages').then((m) => ({ default: m.BlockPuzzlePlayRoute })));

const fallback = <div style={{ width: '100%', height: '100%', background: '#F9FAFB' }} />;

registerRoutes('/games/blockpuzzle/v1', [
  { path: '', element: <Suspense fallback={fallback}><BlockPuzzleHomeRoute /></Suspense> },
  { path: 'play', element: <Suspense fallback={fallback}><BlockPuzzlePlayRoute /></Suspense> },
]);
