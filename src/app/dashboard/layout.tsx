"use client";

import { useSession } from "next-auth/react";
import { AuthProvider } from "@/components/providers/auth-provider";
import { DashboardNav } from "@/components/dashboard/nav";
import { UserNav } from "@/components/dashboard/user-nav";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import Link from "next/link";

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 18) return "Good Afternoon";
  return "Good Evening";
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <DashboardContent>{children}</DashboardContent>
    </AuthProvider>
  );
}

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const greeting = getGreeting();

  const dashboardLink = session?.user?.roles?.[0] 
    ? `/dashboard/${session.user.roles[0].toLowerCase()}` 
    : "/dashboard";

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link 
              href={dashboardLink}
              className="font-bold hover:text-primary"
            >
              LXP AIDE
            </Link>
            <DashboardNav />
          </div>
          
          {session?.user && (
            <div className="flex items-center space-x-4">
              <span className="text-sm text-muted-foreground">
                {greeting}, {session.user.name}
                {session.user.roles?.[0] && (
                  <span className="ml-1 text-xs capitalize">
                    ({session.user.roles[0].replace('_', ' ')})
                  </span>
                )}
              </span>
              <ThemeToggle />
              <UserNav />
            </div>
          )}
        </div>
      </header>
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
