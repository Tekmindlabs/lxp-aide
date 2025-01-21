// src/middleware.ts
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { DefaultJWT } from "next-auth/jwt";


interface CustomJWT extends DefaultJWT {
  roles: string[];
  permissions: string[];
}

export default withAuth(
  async function middleware(req) {
    const token = await getToken({ req }) as CustomJWT | null;
    const isAuth = !!token;
    const isAuthPage = req.nextUrl.pathname.startsWith('/auth');

    // If user is authenticated and trying to access auth pages, redirect to dashboard
    if (isAuth && isAuthPage) {
      const role = token.roles?.[0] || 'user';
      return NextResponse.redirect(new URL(`/dashboard/${role}`, req.url));
    }

    // If user is not authenticated and trying to access protected routes
    if (!isAuth && !isAuthPage) {
      const callbackUrl = encodeURIComponent(req.nextUrl.pathname);
      return NextResponse.redirect(
        new URL(`/auth/signin?callbackUrl=${callbackUrl}`, req.url)
      );
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => true // Let the middleware handle the logic
    }
  }
);

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/auth/:path*',
    // Exclude API and static files
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ]
};