import React, { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,        // 30s — data considered fresh before background refetch
      gcTime: 5 * 60_000,       // 5min — garbage collect unused cache entries
      retry: 2,                 // Retry failed requests twice with exponential backoff
      refetchOnWindowFocus: true, // Auto-refresh when user tabs back to app
    },
    mutations: {
      retry: 0, // Don't auto-retry mutations (writes) — let the user decide
    },
  },
});

export function QueryProvider({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

export { queryClient };
