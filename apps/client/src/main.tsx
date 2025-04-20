import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
// Remove RouterProvider import from here, it's handled by Providers component
// import { RouterProvider, createRouter } from '@tanstack/react-router'

// Import the generated route tree
import { routeTree } from './routeTree.gen' // This file will be generated
// Import the main Providers component
import { Providers } from '@/providers' // Changed import

// Import global styles
import './index.css'

// Create a new router instance - still needed for registration
import { createRouter } from '@tanstack/react-router'
const router = createRouter({ routeTree })
export { router }

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

// Render the app
const rootElement = document.getElementById('root')!
if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement)
  root.render(
    <StrictMode>
      {/* Pass the router instance to Providers */}
      <Providers router={router} />
    </StrictMode>,
  )
} 