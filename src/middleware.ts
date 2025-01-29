import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { DefaultJWT } from "next-auth/jwt";
import { DefaultRoles } from "@/utils/permissions";

interface CustomJWT extends DefaultJWT {
  roles: string[];
  permissions: string[];
  isSuperAdmin: boolean;
}

export default withAuth(
  async function middleware(req) {
    const token = await getToken({ req }) as CustomJWT | null;
    const isAuth = !!token;
    const isAuthPage = req.nextUrl.pathname.startsWith('/auth');
    const isDashboardPage = req.nextUrl.pathname.startsWith('/dashboard');
    const isApiAuthRoute = req.nextUrl.pathname.startsWith('/api/auth');
    const isPublicRoute = 
      req.nextUrl.pathname === '/' || 
      req.nextUrl.pathname.startsWith('/_next') ||
      req.nextUrl.pathname.startsWith('/api/trpc') ||
      isApiAuthRoute;

    // Debug log for token and roles
    console.log('Middleware Check:', {
      path: req.nextUrl.pathname,
      isAuth,
      roles: token?.roles,
      isSuperAdmin: token?.isSuperAdmin,
      timestamp: new Date().toISOString()
    });

    // Allow all API and public routes
    if (isPublicRoute) {
      return NextResponse.next();
    }

    // Redirect authenticated users away from auth pages
    if (isAuth && isAuthPage) {
      const isSuperAdmin = token.roles.includes(DefaultRoles.SUPER_ADMIN);
      const role = isSuperAdmin ? 'super_admin' : token.roles[0] || 'user';
      return NextResponse.redirect(new URL(`/dashboard/${role}`, req.url));
    }

    // Redirect unauthenticated users to sign in
    if (!isAuth && isDashboardPage) {
      const callbackUrl = encodeURIComponent(req.nextUrl.pathname);
      return NextResponse.redirect(
        new URL(`/auth/signin?callbackUrl=${callbackUrl}`, req.url)
      );
    }

    // Check role-based access for dashboard routes
    if (isAuth && isDashboardPage) {
      const path = req.nextUrl.pathname;
      const roleFromPath = path.split('/')[2]; // e.g., /dashboard/super_admin
      const hasRole = token.roles.includes(roleFromPath === 'super_admin' ? DefaultRoles.SUPER_ADMIN : roleFromPath);
      
      if (!hasRole) {
        // Redirect to the appropriate dashboard based on user's role
        const defaultRole = token.roles[0] || 'user';
        return NextResponse.redirect(new URL(`/dashboard/${defaultRole}`, req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const isAuthPage = req.nextUrl.pathname.startsWith('/auth');
        const isApiAuthRoute = req.nextUrl.pathname.startsWith('/api/auth');
        const isPublicRoute = 
          req.nextUrl.pathname === '/' || 
          req.nextUrl.pathname.startsWith('/_next') ||
          req.nextUrl.pathname.startsWith('/api/trpc') ||
          isApiAuthRoute;

        if (isPublicRoute || isAuthPage) return true;
        return !!token;
      }
    }
  }
);

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/auth/:path*',
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ]
};