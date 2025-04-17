import { createRootRoute, Outlet } from '@tanstack/react-router'

export const RootRoute = createRootRoute({
  component: () => (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Outlet />
    </div>
  ),
}) 