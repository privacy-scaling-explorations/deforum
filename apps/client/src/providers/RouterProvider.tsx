import { RouterProvider as RouterProviderBase, type Router, AnyRouter } from "@tanstack/react-router"

// Define the prop type without importing the actual router instance
interface RouterProviderProps {
  router: AnyRouter
}

export function RouterProvider({ router }: RouterProviderProps) {
  return <RouterProviderBase router={router} />
}
