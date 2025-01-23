import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

export const programRouter = createTRPCRouter({
	getAllPrograms: protectedProcedure
		.input(
			z.object({
				page: z.number().min(1).default(1),
				pageSize: z.number().min(1).max(100).default(10),
			})
		)
		.query(async ({ ctx, input }) => {
			try {
				const programs = await ctx.prisma.program.findMany({
					skip: (input.page - 1) * input.pageSize,
					take: input.pageSize,
					include: {
						coordinator: {
							include: {
								user: true,
							},
						},
						calendar: true,
					},
					orderBy: {
						name: 'asc',
					},
				});

				const totalCount = await ctx.prisma.program.count();

				return {
					programs,
					pagination: {
						currentPage: input.page,
						pageSize: input.pageSize,
						totalCount,
						totalPages: Math.ceil(totalCount / input.pageSize),
					},
				};
			} catch (error) {
				throw new TRPCError({
					code: 'INTERNAL_SERVER_ERROR',
					message: 'Failed to fetch programs',
					cause: error,
				});
			}
		}),

	getById: protectedProcedure
		.input(z.string())
		.query(async ({ ctx, input }) => {
			const program = await ctx.prisma.program.findUnique({
				where: { id: input },
				include: {
					coordinator: {
						include: {
							user: true,
						},
					},
					classGroups: {
						include: {
							classes: {
								include: {
									students: true,
									teachers: true,
								},
							},
						},
					},
				},
			});

			if (!program) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Program not found",
				});
			}

			return program;
		}),

	create: protectedProcedure
		.input(
			z.object({
				name: z.string(),
				description: z.string().optional(),
				calendarId: z.string(),
				coordinatorId: z.string().optional(),
				status: z.enum(["ACTIVE", "INACTIVE", "ARCHIVED"]).optional(),
			})
		)
		.mutation(async ({ ctx, input }) => {
			return ctx.prisma.program.create({
				data: {
					name: input.name,
					description: input.description,
					calendar: {
						connect: { id: input.calendarId }
					},
					coordinator: input.coordinatorId
						? {
								connect: { id: input.coordinatorId },
							}
						: undefined,
					status: input.status || "ACTIVE",
				},
			});
		}),

	update: protectedProcedure
		.input(
			z.object({
				id: z.string(),
				name: z.string().optional(),
				description: z.string().optional(),
				calendarId: z.string().optional(),
				coordinatorId: z.string().optional(),
				status: z.enum(["ACTIVE", "INACTIVE", "ARCHIVED"]).optional(),
			})
		)
		.mutation(async ({ ctx, input }) => {
			const { id, calendarId, coordinatorId, ...data } = input;
			return ctx.prisma.program.update({
				where: { id },
				data: {
					...data,
					calendar: calendarId ? { connect: { id: calendarId } } : undefined,
					coordinator: coordinatorId ? { connect: { id: coordinatorId } } : undefined
				}
			});
		}),

	delete: protectedProcedure
		.input(z.string())
		.mutation(async ({ ctx, input }) => {
			return ctx.prisma.program.delete({
				where: { id: input },
			});
		}),
});
