import { createRoute } from '@tanstack/react-router'
import { RootRoute } from './root'

export const IndexRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: '/',
  component: () => (
    <div className="text-center">
      <h1 className="text-3xl font-bold text-blue-600">
        Client App Running!
      </h1>
    </div>
  ),
}) 