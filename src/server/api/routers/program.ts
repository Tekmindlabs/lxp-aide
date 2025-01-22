import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

export const programRouter = createTRPCRouter({
	getAll: protectedProcedure.query(async ({ ctx }) => {
		const programs = await ctx.prisma.program.findMany({
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

		return programs;
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
				level: z.string(),
				coordinatorId: z.string().optional(),
			})
		)
		.mutation(async ({ ctx, input }) => {
			return ctx.prisma.program.create({
				data: {
					name: input.name,
					description: input.description,
					level: input.level,
					coordinator: input.coordinatorId
						? {
								connect: { id: input.coordinatorId },
							}
						: undefined,
				},
			});
		}),

	update: protectedProcedure
		.input(
			z.object({
				id: z.string(),
				name: z.string().optional(),
				description: z.string().optional(),
				level: z.string().optional(),
				coordinatorId: z.string().optional(),
				status: z.enum(["ACTIVE", "INACTIVE", "ARCHIVED"]).optional(),
			})
		)
		.mutation(async ({ ctx, input }) => {
			const { id, ...data } = input;
			return ctx.prisma.program.update({
				where: { id },
				data: {
					...data,
					coordinator: data.coordinatorId
						? {
								connect: { id: data.coordinatorId },
							}
						: undefined,
				},
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
