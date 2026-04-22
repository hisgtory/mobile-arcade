import { lazy, Suspense } from 'react';
import { registerRoutes } from '../../router';

const SudokuHomeRoute = lazy(() => import('./pages').then((m) => ({ default: m.SudokuHomeRoute })));
const SudokuStageRoute = lazy(() => import('./pages').then((m) => ({ default: m.SudokuStageRoute })));

const fallback = <div style={{ width: '100%', height: '100%', background: '#F9FAFB' }} />;

registerRoutes('/games/sudoku/v1', [
  { path: '', element: <Suspense fallback={fallback}><SudokuHomeRoute /></Suspense> },
  { path: 'stage/:stageId', element: <Suspense fallback={fallback}><SudokuStageRoute /></Suspense> },
]);
