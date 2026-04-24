import { lazy, Suspense } from 'react';
import { registerRoutes } from '../../router';

const NexusBrawlRoute = lazy(() =>
  import('./content').then((m) => ({ default: m.NexusBrawlRoute })),
);

registerRoutes('/games/nexus-brawl/v1', [
  {
    path: '',
    element: (
      <Suspense fallback={null}>
        <NexusBrawlRoute />
      </Suspense>
    ),
  },
]);
