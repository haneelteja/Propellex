import { QueryClient } from '@tanstack/react-query';
import { ApiError } from '@/services/api';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 300_000,
      retry: (failureCount, error) => {
        // Never retry auth/client errors (4xx) — they won't self-heal
        if (error instanceof ApiError && error.status >= 400 && error.status < 500) return false;
        // Retry up to 2 times for network/server errors (0, 5xx)
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      onError: (error) => {
        // Central log so no mutation failure goes unnoticed
        console.error('[QueryClient] Mutation error:', error instanceof ApiError
          ? `HTTP ${error.status} — ${error.message}`
          : (error as Error).message ?? String(error));
      },
    },
  },
});
