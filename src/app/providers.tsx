'use client';

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { loggerLink, unstable_httpBatchStreamLink } from '@trpc/client';
import { ThemeProvider } from "@/components/theme-provider";
import { SessionProvider } from "next-auth/react";
import { api } from "@/utils/api";
import superjson from "superjson";

export function Providers({ 
  children, 
  session, 
  cookieHeader 
}: { 
  children: React.ReactNode, 
  session: any,
  cookieHeader: string
}) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      mutations: {
        onSuccess: async () => {
          await queryClient.invalidateQueries();
        },
      },
    },
  }));

  const [trpcClient] = useState(() => 
    api.createClient({
      links: [
        loggerLink({
          enabled: (opts) =>
            process.env.NODE_ENV === 'development' ||
            (opts.direction === 'down' && opts.result instanceof Error),
        }),
        unstable_httpBatchStreamLink({
          url: '/api/trpc',
          headers() {
            return {
              cookie: cookieHeader,
              'x-trpc-source': 'react',
            };
          },
          transformer: superjson, // Add the required transformer
        }),
      ],
    })
  );

  return (
    <api.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <SessionProvider session={session}>
          <ThemeProvider 
            attribute="class" 
            defaultTheme="system" 
            enableSystem
            disableTransitionOnChange
          >
            {children}
          </ThemeProvider>
        </SessionProvider>
      </QueryClientProvider>
    </api.Provider>
  );
}