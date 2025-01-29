import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";
import { prisma } from "@/server/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/server/auth";

export const createTRPCContext = async (opts: { req: Request }) => {
  try {
    console.log('TRPC Context Creation Attempt', {
      method: opts.req.method,
      url: opts.req.url,
      headers: Object.fromEntries(opts.req.headers.entries()),
      timestamp: new Date().toISOString()
    });
    
    const session = await getServerSession(authOptions);
    
    console.log('Session Retrieval Result', {
      sessionExists: !!session,
      userId: session?.user?.id,
      userRoles: session?.user?.roles,
      timestamp: new Date().toISOString()
    });
    
    return {
      prisma,
      session,
      req: opts.req,
    };
  } catch (error) {
    console.error('TRPC Context Creation Critical Error', {
      errorType: error instanceof Error ? error.name : 'Unknown Error',
      errorMessage: error instanceof Error ? error.message : 'No details',
      errorStack: error instanceof Error ? error.stack : 'No stack trace',
      timestamp: new Date().toISOString()
    });
    
    return {
      prisma,
      session: null,
      req: opts.req,
    };
  }
};

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    console.error('TRPC Error Formatting', {
      errorShape: shape,
      errorDetails: error,
      timestamp: new Date().toISOString()
    });

    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
        errorTimestamp: new Date().toISOString()
      },
    };
  },
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;

const enforceUserIsAuthed = t.middleware(({ ctx, next }) => {
  console.log('Authentication Middleware Triggered', {
    sessionExists: !!ctx.session,
    userExists: !!ctx.session?.user,
    userId: ctx.session?.user?.id,
    timestamp: new Date().toISOString()
  });
  
  if (!ctx.session?.user) {
    console.warn('Unauthorized Access Attempt', {
      requestDetails: {
        url: ctx.req?.url,
        method: ctx.req?.method
      },
      timestamp: new Date().toISOString()
    });
    
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Authentication is required. Please log in.",
      cause: { 
        reason: !ctx.session ? 'No session found' : 'No user in session',
        timestamp: new Date().toISOString()
      }
    });
  }
  
  return next({
    ctx: {
      session: { 
        ...ctx.session, 
        user: {
          ...ctx.session.user,
          roles: ctx.session.user.roles || [],
          permissions: ctx.session.user.permissions || []
        } 
      },
    },
  });
});

export const protectedProcedure = t.procedure.use(enforceUserIsAuthed);

const enforceUserHasPermission = (requiredPermission: string) =>
  t.middleware(({ ctx, next }) => {
    console.log('Permission Check Middleware', {
      requiredPermission,
      userPermissions: ctx.session?.user?.permissions,
      timestamp: new Date().toISOString()
    });

    if (!ctx.session?.user) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Authentication required for this action",
      });
    }

    // Special case for super_admin role
    if (ctx.session.user.roles.includes('super_admin')) {
      return next({
        ctx: {
          session: { ...ctx.session, user: ctx.session.user },
        },
      });
    }

    if (!ctx.session.user.permissions.includes(requiredPermission)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `Insufficient permissions. ${requiredPermission} access required.`,
      });
    }

    return next({
      ctx: {
        session: { ...ctx.session, user: ctx.session.user },
      },
    });
  });

export const permissionProtectedProcedure = (permission: string) =>
  t.procedure.use(enforceUserHasPermission(permission));
