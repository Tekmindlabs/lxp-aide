'use client';

import { type AppRouter } from "@/server/api/root";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { ThemeProvider } from "./theme-provider";
import { SessionProvider } from "next-auth/react";
import { httpBatchLink } from "@trpc/client";
import { createTRPCNext } from "@trpc/next";
import superjson from "superjson";

function getBaseUrl() {
  if (typeof window !== 'undefined') return '';
  return 'http://localhost:3000';
}

export const trpc = createTRPCNext<AppRouter>({
  config() {
    return {
      links: [
        httpBatchLink({
          url: `${getBaseUrl()}/api/trpc`,
          transformer: superjson,
        }),
      ],
    };
  },
  ssr: false,
});

function ProvidersInner({ 
  children, 
  session 
}: { 
  children: React.ReactNode;
  session: any;
}) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <SessionProvider session={session}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
}

export const Providers = trpc.withTRPC(ProvidersInner);