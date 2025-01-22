import '@/app/globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { headers } from "next/headers"
import { TRPCReactProvider } from "@/trpc/react"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { ConsentBanner } from '@/components/gdpr/consent-banner'
import { getServerAuthSession } from '@/server/auth'
import { SessionProvider } from "next-auth/react"

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'RBAC Starter - Role-Based Access Control System',
  description: 'A scalable and type-safe RBAC system built with modern web technologies',
}

// Create a new Client Component for providers
'use client'
function Providers({ children, session, cookieHeader }: { 
  children: React.ReactNode, 
  session: any,
  cookieHeader: string
}) {
  return (
    <TRPCReactProvider cookies={cookieHeader}></TRPCReactProvider>
      <SessionProvider session={session}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
          <ConsentBanner />
          <Toaster />
        </ThemeProvider>
      </SessionProvider>
    </TRPCReactProvider>
  )
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerAuthSession();
  const headersList = headers();
  const cookieHeader = headersList.get("cookie") ?? "";

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <Providers session={session} cookieHeader={cookieHeader}>
          {children}
        </Providers>
      </body>
    </html>
  )
}

