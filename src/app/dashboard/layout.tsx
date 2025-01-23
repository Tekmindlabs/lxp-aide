"use client";

import { DashboardNav } from "@/components/dashboard/nav";
import { UserNav } from "@/components/dashboard/user-nav";
import { useSession } from "next-auth/react";
import { AuthProvider } from "@/components/providers/auth-provider";

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
      <DashboardContent children={children} />
    </AuthProvider>
  );
}

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const greeting = getGreeting();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between">
            <div className="flex items-center space-x-4">
            <a 
              href={session?.user?.roles?.[0] 
              ? `/dashboard/${session.user.roles[0].toLowerCase()}` 
              : "/dashboard"} 
              className="font-bold"
            >
              RBAC Dashboard
            </a>
            <DashboardNav />
            </div>
          
          {session?.user && (
            <div className="flex items-center space-x-4">
              <span className="text-sm text-muted-foreground">
                {greeting}, {session.user.name}
                {session.user.roles && session.user.roles.length > 0 && (
                  <span className="ml-1 text-xs">
                    ({session.user.roles[0]})
                  </span>
                )}
              </span>
              <UserNav />
            </div>
          )}
        </div>
      </header>
      <main className="flex-1 container py-6">{children}</main>
    </div>
  );
}
