import { lazy, Suspense } from 'react';
import { registerRoutes } from '../../router';

const MinesweeperHomeRoute = lazy(() => import('./pages').then((m) => ({ default: m.MinesweeperHomeRoute })));
const MinesweeperPlayRoute = lazy(() => import('./pages').then((m) => ({ default: m.MinesweeperPlayRoute })));

const fallback = <div style={{ width: '100%', height: '100%', background: '#F9FAFB' }} />;

registerRoutes('/games/minesweeper/v1', [
  { path: '', element: <Suspense fallback={fallback}><MinesweeperHomeRoute /></Suspense> },
  { path: 'play/:difficulty', element: <Suspense fallback={fallback}><MinesweeperPlayRoute /></Suspense> },
]);
