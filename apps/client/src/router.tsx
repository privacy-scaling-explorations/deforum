import { createRouter, createRoute } from '@tanstack/react-router'
import { RootRoute } from './routes/root'
import { IndexRoute } from './routes/index'

const routeTree = RootRoute.addChildren([
  IndexRoute,
])

export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
} 