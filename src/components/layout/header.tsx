import Link from 'next/link';
import { Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from './theme-toggle';

export function Header() {
  return (
    <header className="container mx-auto px-4 py-6 flex justify-between items-center">
      <div className="flex items-center space-x-2">
        <Shield className="h-8 w-8" />
        <span className="text-2xl font-bold">RBAC Starter</span>
      </div>
      <div className="flex items-center space-x-4">
        <ThemeToggle />
        <Link href="/auth/signin">
          <Button size="lg">Sign In</Button>
        </Link>
      </div>
    </header>
  );
}