import { RouterProvider as RouterProviderBase, type Router } from "@tanstack/react-router"
// Import the specific router instance from main.tsx
import { router as mainRouterInstance } from "../main"

// Define the expected type using the registered interface
type AppRouter = Router<typeof mainRouterInstance.routeTree>

// Use the defined AppRouter type for the prop
export function RouterProvider({ router }: { router: AppRouter }) {
  return <RouterProviderBase router={router} />
}
