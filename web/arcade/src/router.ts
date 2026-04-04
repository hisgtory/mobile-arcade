/**
 * Lightweight route registry for per-game routes.tsx files.
 * Games call registerRoutes() as a side-effect import;
 * App.tsx renders all registered routes via getRegisteredRoutes().
 */
import type { ReactElement } from 'react';

interface RouteEntry {
  path: string;
  element: ReactElement;
}

const routeStore: RouteEntry[] = [];

export function registerRoutes(
  basePath: string,
  routes: { path: string; element: ReactElement }[],
): void {
  for (const r of routes) {
    const fullPath = r.path ? `${basePath}/${r.path}` : basePath;
    routeStore.push({ path: fullPath, element: r.element });
  }
}

export function getRegisteredRoutes(): readonly RouteEntry[] {
  return routeStore;
}
