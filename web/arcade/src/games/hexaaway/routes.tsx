import { lazy, Suspense } from 'react';
import { registerRoutes } from '../../router';

const HexaAwayHome = lazy(() =>
  import('./content').then((m) => ({ default: m.HexaAwayHome })),
);
const HexaAwayPlay = lazy(() =>
  import('./content').then((m) => ({ default: m.HexaAwayPlay })),
);

registerRoutes('/games/hexaaway/v1', [
  {
    path: '',
    element: (
      <Suspense fallback={null}>
        <HexaAwayHome />
      </Suspense>
    ),
  },
  {
    path: 'play',
    element: (
      <Suspense fallback={null}>
        <HexaAwayPlay />
      </Suspense>
    ),
  },
]);
