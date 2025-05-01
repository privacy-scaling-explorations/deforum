import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import { trpc, trpcClient } from './lib/trpc';
import { routeTree } from "./routeTree.gen";
import { GlobalProvider } from './contexts/GlobalContext';
import './lib/i18n'; // Initialize i18n
import './index.css';

const queryClient = new QueryClient();

import { createRouter } from "@tanstack/react-router";
export const router = createRouter({ routeTree });

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <GlobalProvider>
          <RouterProvider router={router} />
        </GlobalProvider>
      </QueryClientProvider>
    </trpc.Provider>
  </React.StrictMode>
);
