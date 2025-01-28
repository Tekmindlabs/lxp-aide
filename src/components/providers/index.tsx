'use client';

import { AuthProvider } from "./auth-provider";
import { ThemeProvider } from "./theme-provider";
import { Providers as TRPCProvider } from "@/app/providers";
import { type Session } from "next-auth";

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
    <AuthProvider session={session}>
      <TRPCProvider session={session} cookieHeader={cookieHeader}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </TRPCProvider>
    </AuthProvider>
  );
}
