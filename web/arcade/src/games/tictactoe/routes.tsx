import { lazy, Suspense } from 'react';
import { registerRoutes } from '../../router';

const TicTacToeHomeRoute = lazy(() => import('./pages').then((m) => ({ default: m.TicTacToeHomeRoute })));
const TicTacToePlayRoute = lazy(() => import('./pages').then((m) => ({ default: m.TicTacToePlayRoute })));

const fallback = <div style={{ width: '100%', height: '100%', background: '#F9FAFB' }} />;

registerRoutes('/games/tictactoe/v1', [
  { path: '', element: <Suspense fallback={fallback}><TicTacToeHomeRoute /></Suspense> },
  { path: 'play', element: <Suspense fallback={fallback}><TicTacToePlayRoute /></Suspense> },
]);
