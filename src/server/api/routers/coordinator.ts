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

			const coordinator = await ctx.db.user.create({
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

			const coordinatorProfile = await ctx.db.coordinatorProfile.findUnique({
				where: { userId: id },
			});

			if (!coordinatorProfile) {
				throw new Error("Coordinator profile not found");
			}

			if (programIds) {
				await ctx.db.coordinatorProfile.update({
					where: { id: coordinatorProfile.id },
					data: {
						programs: {
							set: programIds.map(id => ({ id })),
						},
					},
				});
			}

			const updatedCoordinator = await ctx.db.user.update({
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
			return ctx.db.user.delete({
				where: { id: input },
			});
		}),

	getCoordinator: protectedProcedure
		.input(z.string())
		.query(async ({ ctx, input }) => {
			return ctx.db.user.findUnique({
				where: { id: input },
				include: {
					coordinatorProfile: {
						include: {
							programs: true,
						},
					},
				},
			});
		}),

	searchCoordinators: protectedProcedure
		.input(z.object({
			search: z.string().optional(),
			programId: z.string().optional(),
			status: z.enum([Status.ACTIVE, Status.INACTIVE, Status.ARCHIVED]).optional(),
		}))
		.query(async ({ ctx, input }) => {
			const { search, programId, status } = input;

			return ctx.db.user.findMany({
				where: {
					userType: UserType.COORDINATOR,
					...(search && {
						OR: [
							{ name: { contains: search, mode: 'insensitive' } },
							{ email: { contains: search, mode: 'insensitive' } },
						],
					}),
					coordinatorProfile: {
						...(programId && {
							programs: {
								some: { id: programId },
							},
						}),
					},
					...(status && { status }),
				},
				include: {
					coordinatorProfile: {
						include: {
							programs: true,
						},
					},
				},
				orderBy: {
					name: 'asc',
				},
			});
		}),
});