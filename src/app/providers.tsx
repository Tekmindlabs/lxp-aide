'use client';

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/components/theme-provider";
import { SessionProvider } from "next-auth/react";
import { TRPCReactProvider } from "@/trpc/react";

export function Providers({ 
  children, 
  session, 
  cookieHeader 
}: { 
  children: React.ReactNode, 
  session: any,
  cookieHeader: string
}) {
  return (
    <SessionProvider session={session}>
      <TRPCReactProvider cookies={cookieHeader}>
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