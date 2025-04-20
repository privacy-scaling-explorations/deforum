import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from "path"
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'
import tsconfigPaths from 'vite-tsconfig-paths'

const routesDirPath = path.resolve(__dirname, './src/routes');
const generatedRouteTreePath = path.resolve(__dirname, './src/routeTree.gen.ts');

console.log(`[Vite Config] TanStack Router Plugin - Resolved Routes Dir: ${routesDirPath}`);
console.log(`[Vite Config] TanStack Router Plugin - Resolved Gen File: ${generatedRouteTreePath}`);

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    tsconfigPaths({ projects: ['../../tsconfig.json'] }),
    TanStackRouterVite({
      routesDirectory: routesDirPath,
      generatedRouteTree: generatedRouteTreePath,
    }),
    react(),
  ],
  server: {
    host: '0.0.0.0',
    port: 3000,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'router-vendor': ['@tanstack/react-router'],
        },
      },
    },
  },
}) 