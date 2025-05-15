import { createTRPCReact } from '@trpc/react-query';
import { httpBatchLink } from '@trpc/client';
import type { AppRouter } from '../../../api/src/routers/_app';

export const trpc = createTRPCReact<AppRouter>();

export const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: 'http://localhost:5001/trpc',
      fetch(url, options) {
        console.log('🌈 Making tRPC request:', url);
        return fetch(url, options).then(async (response) => {
          const data = await response.clone().json();
          console.log('🎯 tRPC response:', data);
          return response;
        }).catch(error => {
          console.error('❌ tRPC error:', error);
          throw error;
        });
      },
    }),
  ],
}); 