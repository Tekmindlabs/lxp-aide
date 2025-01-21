'use client';

import { AuthProvider } from "./auth-provider";
import { ThemeProvider } from "./theme-provider";
import { TRPCProvider } from "@/app/providers";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <TRPCProvider>
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
