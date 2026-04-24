import { lazy, Suspense } from 'react';
import { registerRoutes } from '../../router';

const TicTacToeHomeRoute = lazy(() =>
  import('./content').then((m) => ({ default: m.TicTacToeHomeRoute })),
);
const TicTacToePlayRoute = lazy(() =>
  import('./content').then((m) => ({ default: m.TicTacToePlayRoute })),
);

registerRoutes('/games/tictactoe/v1', [
  {
    path: '',
    element: (
      <Suspense fallback={null}>
        <TicTacToeHomeRoute />
      </Suspense>
    ),
  },
  {
    path: 'play',
    element: (
      <Suspense fallback={null}>
        <TicTacToePlayRoute />
      </Suspense>
    ),
  },
]);
