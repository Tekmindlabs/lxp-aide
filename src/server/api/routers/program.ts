import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { Status } from "@prisma/client";

export const programRouter = createTRPCRouter({
	createProgram: protectedProcedure
		.input(z.object({
			name: z.string(),
			description: z.string().optional(),
			level: z.string(),
			coordinatorId: z.string().optional(),
			status: z.enum([Status.ACTIVE, Status.INACTIVE, Status.ARCHIVED]).default(Status.ACTIVE),
		}))
		.mutation(async ({ ctx, input }) => {
			return ctx.db.program.create({
				data: input,
				include: {
					coordinator: {
						include: {
							user: true,
						},
					},
				},
			});
		}),

	updateProgram: protectedProcedure
		.input(z.object({
			id: z.string(),
			name: z.string().optional(),
			description: z.string().optional(),
			level: z.string().optional(),
			coordinatorId: z.string().optional(),
			status: z.enum([Status.ACTIVE, Status.INACTIVE, Status.ARCHIVED]).optional(),
		}))
		.mutation(async ({ ctx, input }) => {
			const { id, ...data } = input;
			return ctx.db.program.update({
				where: { id },
				data,
				include: {
					coordinator: {
						include: {
							user: true,
						},
					},
				},
			});
		}),

	deleteProgram: protectedProcedure
		.input(z.string())
		.mutation(async ({ ctx, input }) => {
			return ctx.db.program.delete({
				where: { id: input },
			});
		}),

	getProgram: protectedProcedure
		.input(z.string())
		.query(async ({ ctx, input }) => {
			return ctx.db.program.findUnique({
				where: { id: input },
				include: {
					coordinator: {
						include: {
							user: true,
						},
					},
					classGroups: true,
				},
			});
		}),

	getAllPrograms: protectedProcedure
		.query(async ({ ctx }) => {
			return ctx.db.program.findMany({
				include: {
					coordinator: {
						include: {
							user: true,
						},
					},
					classGroups: true,
				},
			});
		}),

	getAvailableCoordinators: protectedProcedure
		.query(async ({ ctx }) => {
			return ctx.db.coordinatorProfile.findMany({
				include: {
					user: true,
				},
			});
		}),

	searchPrograms: protectedProcedure
		.input(z.object({
			search: z.string().optional(),
			level: z.string().optional(),
			status: z.enum([Status.ACTIVE, Status.INACTIVE, Status.ARCHIVED]).optional(),
			academicYearId: z.string().optional(),
			sortBy: z.enum(['name', 'level', 'createdAt']).optional(),
			sortOrder: z.enum(['asc', 'desc']).optional(),
		}))
		.query(async ({ ctx, input }) => {
			const { search, level, status, academicYearId, sortBy = 'name', sortOrder = 'asc' } = input;
			
			return ctx.db.program.findMany({
				where: {
					...(search && {
						OR: [
							{ name: { contains: search, mode: 'insensitive' } },
							{ description: { contains: search, mode: 'insensitive' } },
						],
					}),
					...(level && { level }),
					...(status && { status }),
				},
				include: {
					coordinator: {
						include: {
							user: true,
						},
					},
					classGroups: true,
				},
				orderBy: {
					[sortBy]: sortOrder,
				},
			});
		}),

	associateAcademicYear: protectedProcedure
		.input(z.object({
			programId: z.string(),
			academicYearId: z.string(),
		}))
		.mutation(async ({ ctx, input }) => {
			const { programId, academicYearId } = input;

			// First, verify both program and academic year exist
			const [program, academicYear] = await Promise.all([
				ctx.db.program.findUnique({ where: { id: programId } }),
				ctx.db.academicYear.findUnique({ where: { id: academicYearId } }),
			]);

			if (!program || !academicYear) {
				throw new Error("Program or Academic Year not found");
			}

			// Create terms for the program's academic year
			await ctx.db.term.create({
				data: {
					name: "Default Term",
					academicYearId,
					startDate: academicYear.startDate,
					endDate: academicYear.endDate,
					status: Status.ACTIVE,
				},
			});

			return program;
		}),

	getProgramWithAcademicDetails: protectedProcedure
		.input(z.string())
		.query(async ({ ctx, input }) => {
			return ctx.db.program.findUnique({
				where: { id: input },
				include: {
					coordinator: {
						include: {
							user: true,
						},
					},
					classGroups: {
						include: {
							timetable: {
								include: {
									term: {
										include: {
											academicYear: true,
										},
									},
								},
							},
						},
					},
				},
			});
		}),
});