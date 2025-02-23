import { lazy } from 'react'

export function lazyRouteComponent(componentImport: () => Promise<{ default: React.ComponentType<any> }>) {
  const LazyComponent = lazy(componentImport)
  return LazyComponent
}

export function createLazyRoute(path: string) {
  return {
    lazy: () => import(`../routes/${path}`).then((module) => ({ 
      component: lazyRouteComponent(() => import(`../routes/${path}`).then((m) => ({ default: m.Route.component }))),
      loader: module.Route.loader
    }))
  }
} 