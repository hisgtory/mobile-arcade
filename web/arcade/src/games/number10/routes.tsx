import { lazy, Suspense } from 'react';
import { registerRoutes } from '../../router';

const Number10HomeRoute = lazy(() => import('./pages').then((m) => ({ default: m.Number10HomeRoute })));
const Number10PlayRoute = lazy(() => import('./pages').then((m) => ({ default: m.Number10PlayRoute })));

const fallback = <div style={{ width: '100%', height: '100%', background: '#F9FAFB' }} />;

registerRoutes('/games/number10/v1', [
  { path: '', element: <Suspense fallback={fallback}><Number10HomeRoute /></Suspense> },
  { path: 'play', element: <Suspense fallback={fallback}><Number10PlayRoute /></Suspense> },
]);
