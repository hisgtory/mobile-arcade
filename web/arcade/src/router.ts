import { type ReactNode } from 'react';

interface GameRoute {
  path: string;
  element: ReactNode;
}

const registry: GameRoute[] = [];

export function registerRoutes(basePath: string, routes: { path: string; element: ReactNode }[]) {
  const base = basePath.replace(/\/$/, '');
  for (const route of routes) {
    const sub = route.path.replace(/^\//, '');
    const fullPath = sub ? `${base}/${sub}` : base;
    const existing = registry.findIndex(r => r.path === fullPath);
    if (existing >= 0) {
      registry[existing] = { path: fullPath, element: route.element };
    } else {
      registry.push({ path: fullPath, element: route.element });
    }
  }
}

export function getRegisteredRoutes(): readonly GameRoute[] {
  return registry.slice();
}
