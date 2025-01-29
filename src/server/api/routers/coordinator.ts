import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { Status, UserType } from "@prisma/client";

export const coordinatorRouter = createTRPCRouter({
	createCoordinator: protectedProcedure
		.input(z.object({
			name: z.string(),
			email: z.string().email(),
			programIds: z.array(z.string()).optional(),
			responsibilities: z.array(z.string()).optional(),
		}))
		.mutation(async ({ ctx, input }) => {
			const { programIds, responsibilities, ...userData } = input;

			const coordinator = await ctx.prisma.user.create({
				data: {
					...userData,
					userType: UserType.COORDINATOR,
					coordinatorProfile: {
						create: {
							...(programIds && {
								programs: {
									connect: programIds.map(id => ({ id })),
								},
							}),
						},
					},
				},
				include: {
					coordinatorProfile: {
						include: {
							programs: true,
						},
					},
				},
			});

			return coordinator;
		}),

	updateCoordinator: protectedProcedure
		.input(z.object({
			id: z.string(),
			name: z.string().optional(),
			email: z.string().email().optional(),
			programIds: z.array(z.string()).optional(),
			responsibilities: z.array(z.string()).optional(),
		}))
		.mutation(async ({ ctx, input }) => {
			const { id, programIds, responsibilities, ...updateData } = input;

			const coordinatorProfile = await ctx.prisma.coordinatorProfile.findUnique({
				where: { userId: id },
			});

			if (!coordinatorProfile) {
				throw new Error("Coordinator profile not found");
			}

			if (programIds) {
				await ctx.prisma.coordinatorProfile.update({
					where: { id: coordinatorProfile.id },
					data: {
						programs: {
							set: programIds.map(id => ({ id })),
						},
					},
				});
			}

			const updatedCoordinator = await ctx.prisma.user.update({
				where: { id },
				data: updateData,
				include: {
					coordinatorProfile: {
						include: {
							programs: true,
						},
					},
				},
			});

			return updatedCoordinator;
		}),

	deleteCoordinator: protectedProcedure
		.input(z.string())
		.mutation(async ({ ctx, input }) => {
			return ctx.prisma.user.delete({
				where: { id: input },
			});
		}),

	getCoordinator: protectedProcedure
		.input(z.string())
		.query(async ({ ctx, input }) => {
			return ctx.prisma.user.findFirst({
				where: { 
					id: input,
					deleted: null,
					status: 'ACTIVE',
					userType: 'COORDINATOR'
				},
				include: {
					coordinatorProfile: true,
					userRoles: {
						include: {
							role: true
						}
					}
				}
			});
		}),

	searchCoordinators: protectedProcedure
		.input(z.object({
			query: z.string(),
			page: z.number().min(1).default(1),
			limit: z.number().min(1).max(100).default(10),
		}))
		.query(async ({ ctx, input }) => {
			const skip = (input.page - 1) * input.limit;

			const coordinators = await ctx.prisma.user.findMany({
				where: {
					deleted: null,
					status: 'ACTIVE',
					userType: 'COORDINATOR',
					OR: [
						{ name: { contains: input.query, mode: 'insensitive' } },
						{ email: { contains: input.query, mode: 'insensitive' } },
					],
				},
				include: {
					coordinatorProfile: true,
					userRoles: {
						include: {
							role: true
						}
					}
				},
				skip,
				take: input.limit,
			});

			const total = await ctx.prisma.user.count({
				where: {
					deleted: null,
					status: 'ACTIVE',
					userType: 'COORDINATOR',
					OR: [
						{ name: { contains: input.query, mode: 'insensitive' } },
						{ email: { contains: input.query, mode: 'insensitive' } },
					],
				},
			});

			return {
				coordinators,
				total,
				pages: Math.ceil(total / input.limit),
			};
		}),
});