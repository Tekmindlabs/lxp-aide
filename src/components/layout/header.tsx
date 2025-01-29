import { Shield } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./theme-toggle";
import { UserNav } from "@/components/dashboard/user-nav";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";

export function Header() {
  const { data: session } = useSession();
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6" />
          <span className="font-semibold">LXP AIDE</span>
        </div>
        
        <div className="flex flex-1 items-center justify-end space-x-4">
          <ThemeToggle />
          {session ? (
            <UserNav />
          ) : (
            <Link href="/auth/signin">
              <Button size="sm">Sign In</Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
