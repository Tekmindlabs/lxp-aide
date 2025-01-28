'use client';

import { ThemeProvider } from "./theme-provider";
import { SessionProvider } from "next-auth/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { TRPCReactProvider } from "@/trpc/react";

function ProvidersInner({ 
  children, 
  session,
  cookies
}: { 
  children: React.ReactNode;
  session: any;
  cookies?: string;
}) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <SessionProvider session={session}>
      <TRPCReactProvider cookies={cookies}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </TRPCReactProvider>
    </SessionProvider>
  );
}

export const Providers = ProvidersInner;
