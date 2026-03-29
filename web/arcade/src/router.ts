import { type ReactNode } from 'react';

interface GameRoute {
  path: string;
  element: ReactNode;
}

const registry: GameRoute[] = [];

export function registerRoutes(basePath: string, routes: { path: string; element: ReactNode }[]) {
  for (const route of routes) {
    const fullPath = route.path ? `${basePath}/${route.path}` : basePath;
    registry.push({ path: fullPath, element: route.element });
  }
}

export function getRegisteredRoutes(): GameRoute[] {
  return registry;
}
