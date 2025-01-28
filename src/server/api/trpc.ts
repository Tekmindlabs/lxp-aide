import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";
import { prisma } from "@/server/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/server/auth";


export const createTRPCContext = async (opts: { req: Request }) => {
  const session = await getServerSession(authOptions);

  return {
    prisma,
    session,
    req: opts.req,
  };
};




const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const createTRPCRouter = t.router;


export const publicProcedure = t.procedure;

const enforceUserIsAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be logged in to access this resource",
    });
  }
  return next({
    ctx: {
      session: { ...ctx.session, user: ctx.session.user },
    },
  });
});


export const protectedProcedure = t.procedure.use(enforceUserIsAuthed);

const enforceUserHasPermission = (requiredPermission: string) =>
  t.middleware(({ ctx, next }) => {
    if (!ctx.session?.user) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "You must be logged in to access this resource",
      });
    }

    if (!ctx.session.user.permissions.includes(requiredPermission)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You don't have permission to access this resource",
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