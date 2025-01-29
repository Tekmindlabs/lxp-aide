import { z } from "zod";
import { createTRPCRouter, permissionProtectedProcedure } from "../trpc";
import { Permissions } from "@/utils/permissions";
import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";

const userSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  password: z.string().min(8).optional(),
  roleIds: z.array(z.string()),
});

export const userRouter = createTRPCRouter({
  getAll: permissionProtectedProcedure(Permissions.USER_READ)
    .query(async ({ ctx }) => {
      return ctx.prisma.user.findMany({
        where: {
          deleted: null,
          status: 'ACTIVE'
        },
        include: {
          userRoles: {
            include: {
              role: true,
            },
          },
        },
      });
    }),

  getById: permissionProtectedProcedure(Permissions.USER_READ)
    .input(z.string())
    .query(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findFirst({
        where: { 
          id: input,
          deleted: null,
          status: 'ACTIVE'
        },
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
          code: "NOT_FOUND",
          message: "User not found or inactive",
        });
      }

      return user;
    }),

  create: permissionProtectedProcedure(Permissions.USER_CREATE)
    .input(userSchema)
    .mutation(async ({ ctx, input }) => {
      const hashedPassword = input.password 
        ? await bcrypt.hash(input.password, 12)
        : undefined;

      return ctx.prisma.user.create({
        data: {
          email: input.email,
          name: input.name,
          password: hashedPassword,
          userRoles: {
            create: input.roleIds.map((roleId) => ({
              role: { connect: { id: roleId } },
            })),
          },
        },
        include: {
          userRoles: {
            include: {
              role: true,
            },
          },
        },
      });
    }),

  update: permissionProtectedProcedure(Permissions.USER_UPDATE)
    .input(z.object({
      id: z.string(),
      data: userSchema.partial(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, data } = input;
      const hashedPassword = data.password 
        ? await bcrypt.hash(data.password, 12)
        : undefined;

      return ctx.prisma.user.update({
        where: { id },
        data: {
          ...data,
          password: hashedPassword,
          userRoles: data.roleIds ? {
            deleteMany: {},
            create: data.roleIds.map((roleId) => ({
              role: { connect: { id: roleId } },
            })),
          } : undefined,
        },
        include: {
          userRoles: {
            include: {
              role: true,
            },
          },
        },
      });
    }),

  delete: permissionProtectedProcedure(Permissions.USER_DELETE)
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.user.delete({
        where: { id: input },
      });
    }),

  searchUsers: permissionProtectedProcedure(Permissions.USER_READ)
    .input(z.object({
      query: z.string(),
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(100).default(10),
      excludeIds: z.array(z.string()).optional(),
      roles: z.array(z.string()).optional(),
    }))
    .query(async ({ ctx, input }) => {
      const skip = (input.page - 1) * input.limit;

      const whereClause = {
        AND: [
          { deleted: null },
          { status: 'ACTIVE' },
          {
            OR: [
              { name: { contains: input.query, mode: 'insensitive' } },
              { email: { contains: input.query, mode: 'insensitive' } },
            ],
          },
          input.excludeIds ? { id: { notIn: input.excludeIds } } : {},
          input.roles ? {
            userRoles: {
              some: {
                role: {
                  name: { in: input.roles },
                },
              },
            },
          } : {},
        ],
      };

      const users = await ctx.prisma.user.findMany({
        where: whereClause,
        include: {
          userRoles: {
            include: {
              role: true
            }
          }
        },
        orderBy: {
          name: 'asc',
        },
        skip,
        take: input.limit,
      });

      const total = await ctx.prisma.user.count({
        where: whereClause,
      });

      return {
        users,
        total,
        pages: Math.ceil(total / input.limit),
      };
    }),
});