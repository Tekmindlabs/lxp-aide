'use client';

import { QueryClient, QueryClientProvider, QueryObserverOptions } from '@tanstack/react-query';
import { httpBatchLink, loggerLink } from '@trpc/client';
import { createTRPCReact } from '@trpc/react-query';
import { useState } from 'react';
import { type AppRouter } from '@/server/api/root';
import superjson from 'superjson';
import { TRPCError } from '@trpc/server';

const getBaseUrl = () => {
  if (typeof window === 'undefined') {
    if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
    if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
    return 'http://localhost:3000';
  }
  return window.location.origin;
};

export const trpc = createTRPCReact<AppRouter>();

interface TRPCReactProviderProps {
  children: React.ReactNode;
  cookies?: string;
}

export function TRPCReactProvider({ 
  children,
  cookies 
}: TRPCReactProviderProps) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        queryKey: ['trpc'], // Add queryKey to fix TypeScript error
        staleTime: 30000,
        retry: (failureCount, error) => {
          if (error instanceof TRPCError) {
            switch (error.code) {
              case 'UNAUTHORIZED':
              case 'FORBIDDEN':
                return false;
              default:
                return failureCount < 1;
            }
          }
          return failureCount < 1;
        },
        retryDelay: 500,
        onError: (error: unknown) => {
          console.error('Query Error:', error);
        },
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
      } as QueryObserverOptions,
    },
  }));

  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        loggerLink({
          enabled: (opts) =>
            process.env.NODE_ENV === 'development' ||
            (opts.direction === 'down' && opts.result instanceof Error),
        }),
        httpBatchLink({
          url: `${getBaseUrl()}/api/trpc`,
          headers() {
            return {
              ...(cookies ? { cookie: cookies } : {}),
              'x-trpc-source': 'react',
            };
          },
          fetch(url, options) {
            return fetch(url, {
              ...options,
              credentials: 'include',
            });
          },
          transformer: superjson,
        }),
      ],
    })
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </trpc.Provider>
  );
}

export const api = trpc;
