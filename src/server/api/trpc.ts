import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";
import { prisma } from "@/server/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/server/auth";

export const createTRPCContext = async (opts: { req: Request }) => {
  try {
    const session = await getServerSession(authOptions);
    
    // Debug session state
    console.log('TRPC Context Session State:', {
      hasSession: !!session,
      hasUser: !!session?.user,
      userId: session?.user?.id,
      path: opts.req.url,
      timestamp: new Date().toISOString()
    });

    // Don't throw error for missing session - let middleware handle auth
    return {
      prisma,
      session: session || null, // Explicitly handle null case
      req: opts.req,
    };
  } catch (error) {
    console.error('TRPC Context Creation Error:', {
      errorType: error instanceof Error ? error.name : 'Unknown Error',
      errorMessage: error instanceof Error ? error.message : 'No details',
      path: opts.req.url,
      timestamp: new Date().toISOString()
    });
    
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to create TRPC context'
    });
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

const enforceUserIsAuthed = t.middleware(async ({ ctx, next }) => {
  console.log('Auth Middleware Check:', {
    hasSession: !!ctx.session,
    hasUser: !!ctx.session?.user,
    path: ctx.req.url,
    timestamp: new Date().toISOString()
  });
  
  if (!ctx.session || !ctx.session.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Authentication required",
      cause: {
        path: ctx.req.url,
        timestamp: new Date().toISOString()
      }
    });
  }

  try {
    // Fetch user with roles and permissions
    const user = await ctx.prisma.user.findUnique({
      where: { id: ctx.session.user.id },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!user) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "User not found in database",
        cause: {
          userId: ctx.session.user.id,
          path: ctx.req.url
        }
      });
    }

    // Extract permissions from roles
    const permissions = new Set<string>();
    user.userRoles.forEach(userRole => {
      userRole.role.permissions.forEach(rolePermission => {
        permissions.add(rolePermission.permission.name);
      });
    });

    const isSuperAdmin = user.userRoles.some(ur => ur.role.name === 'super_admin');
    
    console.log('Auth Middleware Success:', {
      userId: user.id,
      roleCount: user.userRoles.length,
      permissionCount: permissions.size,
      isSuperAdmin,
      path: ctx.req.url
    });

    return next({
      ctx: {
        ...ctx,
        session: {
          ...ctx.session,
          user: {
            ...ctx.session.user,
            roles: user.userRoles.map(ur => ur.role.name),
            permissions: isSuperAdmin ? ['*'] : Array.from(permissions),
            isSuperAdmin
          }
        }
      }
    });
  } catch (error) {
    if (error instanceof TRPCError) throw error;
    
    console.error('Auth Middleware Error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: ctx.session.user.id,
      path: ctx.req.url
    });
    
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to validate user permissions",
      cause: error
    });
  }
});

export const protectedProcedure = t.procedure.use(enforceUserIsAuthed);

const enforceUserHasPermission = (requiredPermission: string) =>
  t.middleware(async ({ ctx, next }) => {
    if (!ctx.session?.user) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Authentication required",
      });
    }

    try {
      // Always fetch fresh user data
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.user.id },
        include: {
          userRoles: {
            include: {
              role: {
                include: {
                  permissions: {
                    include: {
                      permission: true
                    }
                  }
                }
              }
            }
          }
        }
      });

      if (!user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not found in database",
          cause: {
            userId: ctx.session.user.id
          }
        });
      }

      const permissions = new Set<string>();
      user.userRoles.forEach(userRole => {
        userRole.role.permissions.forEach(rolePermission => {
          permissions.add(rolePermission.permission.name);
        });
      });

      const isSuperAdmin = user.userRoles.some(ur => ur.role.name === 'super_admin');

      if (!isSuperAdmin && !permissions.has(requiredPermission)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: `Missing required permission: ${requiredPermission}`,
        });
      }

      return next({
        ctx: {
          ...ctx,
          session: {
            ...ctx.session,
            user: {
              ...ctx.session.user,
              roles: user.userRoles.map(ur => ur.role.name),
              permissions: isSuperAdmin ? ['*'] : Array.from(permissions),
              isSuperAdmin
            }
          }
        }
      });
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to validate permissions",
        cause: error
      });
    }
  });

export const permissionProtectedProcedure = (permission: string) =>
  t.procedure.use(enforceUserHasPermission(permission));
