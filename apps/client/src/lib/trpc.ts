import { createTRPCReact } from '@trpc/react-query';
import { httpBatchLink } from '@trpc/client';
import type { AppRouter } from '../../../api/src/lib/router';

// Log API URL immediately on module load for debugging
const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3002';
console.log('🚀 API URL:', apiUrl);
// Use this in browser console to check: console.log(import.meta.env.VITE_API_URL)

export const trpc = createTRPCReact<AppRouter>();

export const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: `${apiUrl}/trpc`,
      headers() {
        const token = localStorage.getItem('token');
        return {
          Authorization: token ? `Bearer ${token}` : ''
        };
      },
      fetch(url, options) {
        console.log('🌈 Making tRPC request:', url);
        return fetch(url, {
          ...options,
          credentials: 'include'
        })
          .then(async (response) => {
            const data = await response.clone().json();
            console.log('🎯 tRPC response:', data);
            if (!response.ok) {
              throw new Error(data.error?.message || 'Request failed');
            }
            return response;
          })
          .catch((error) => {
            console.error('❌ tRPC error:', error);
            throw error;
          });
      }
    })
  ]
});
