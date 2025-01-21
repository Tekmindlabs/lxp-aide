// src/app/layout.tsx
import '@/app/globals.css' 
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Providers } from '@/components/providers'
import { ConsentBanner } from '@/components/gdpr/consent-banner'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'RBAC Starter - Role-Based Access Control System',
  description: 'A scalable and type-safe RBAC system built with modern web technologies',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link 
          rel="stylesheet" 
          href="/_next/static/css/app/layout.css" 
          as="style"
          precedence="high"
        />
      </head>
      <body className={inter.className}>
        <Providers>
          {children}
          <ConsentBanner />
        </Providers>
      </body>
    </html>
  )
}