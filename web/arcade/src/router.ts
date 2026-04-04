import type { ReactNode } from 'react';

// ─── Route Registry ──────────────────────────────────────
// Games call registerRoutes() as a side-effect import.
// App.tsx reads the registry to render <Route> elements.

export interface GameRouteEntry {
  path: string;
  element: ReactNode;
}

interface RegisteredGame {
  basePath: string;
  routes: GameRouteEntry[];
}

const registry: RegisteredGame[] = [];

/**
 * Register routes for a game.
 * Call at module top-level so the side-effect import in App.tsx triggers registration.
 *
 * @param basePath  e.g. '/games/nonogram/v1'
 * @param routes    array of { path, element } — path '' = index route
 */
export function registerRoutes(basePath: string, routes: GameRouteEntry[]): void {
  registry.push({ basePath, routes });
}

/**
 * Get all registered game routes.
 * Returns array of { fullPath, element } suitable for <Route path={...} element={...} />.
 */
export function getRegisteredRoutes(): { fullPath: string; element: ReactNode }[] {
  const result: { fullPath: string; element: ReactNode }[] = [];
  for (const game of registry) {
    for (const r of game.routes) {
      const fullPath = r.path ? `${game.basePath}/${r.path}` : game.basePath;
      result.push({ fullPath, element: r.element });
    }
  }
  return result;
}
