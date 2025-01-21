import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

export const timetableRouter = createTRPCRouter({
	create: protectedProcedure
		.input(
			z.object({
				termId: z.string(),
				classGroupId: z.string().optional(),
				classId: z.string().optional(),
				periods: z.array(
					z.object({
						startTime: z.date(),
						endTime: z.date(),
						dayOfWeek: z.number().min(1).max(7),
						subjectId: z.string(),
						classroomId: z.string(),
					})
				),
			})
		)
		.mutation(async ({ ctx, input }) => {
			// Check for existing timetable
			const existingTimetable = await ctx.prisma.timetable.findFirst({
				where: {
					OR: [
						{ classGroupId: input.classGroupId },
						{ classId: input.classId },
					],
				},
			});

			if (existingTimetable) {
				throw new TRPCError({
					code: "CONFLICT",
					message: "Timetable already exists for this class/group",
				});
			}

			// Check for period conflicts
			for (const period of input.periods) {
				const conflictingPeriod = await ctx.prisma.period.findFirst({
					where: {
						OR: [
							{
								// Teacher teaching in another class at the same time
								subject: {
									teachers: {
										some: {
											teacher: {
												classes: {
													some: {
														class: {
															timetable: {
																periods: {
																	some: {
																		dayOfWeek: period.dayOfWeek,
																		startTime: {
																			lte: period.endTime,
																		},
																		endTime: {
																			gte: period.startTime,
																		},
																	},
																},
															},
														},
													},
												},
											},
										},
									},
								},
							},
							{
								// Classroom already booked
								classroomId: period.classroomId,
								dayOfWeek: period.dayOfWeek,
								startTime: {
									lte: period.endTime,
								},
								endTime: {
									gte: period.startTime,
								},
							},
						],
					},
				});

				if (conflictingPeriod) {
					throw new TRPCError({
						code: "CONFLICT",
						message: "Period conflicts with existing schedule",
					});
				}
			}

			return ctx.prisma.timetable.create({
				data: {
					termId: input.termId,
					classGroupId: input.classGroupId,
					classId: input.classId,
					periods: {
						create: input.periods,
					},
				},
				include: {
					periods: true,
				},
			});
		}),

	getAll: protectedProcedure.query(({ ctx }) => {
		return ctx.prisma.timetable.findMany({
			include: {
				periods: {
					include: {
						subject: true,
						classroom: true,
					},
				},
				classGroup: true,
				class: true,
			},
		});
	}),

	getById: protectedProcedure
		.input(z.string())
		.query(({ ctx, input }) => {
			return ctx.prisma.timetable.findUnique({
				where: { id: input },
				include: {
					periods: {
						include: {
							subject: true,
							classroom: true,
						},
					},
					classGroup: true,
					class: true,
				},
			});
		}),

	update: protectedProcedure
		.input(
			z.object({
				id: z.string(),
				periods: z.array(
					z.object({
						id: z.string().optional(),
						startTime: z.date(),
						endTime: z.date(),
						dayOfWeek: z.number().min(1).max(7),
						subjectId: z.string(),
						classroomId: z.string(),
					})
				),
			})
		)
		.mutation(async ({ ctx, input }) => {
			// Delete existing periods
			await ctx.prisma.period.deleteMany({
				where: { timetableId: input.id },
			});

			// Create new periods
			return ctx.prisma.timetable.update({
				where: { id: input.id },
				data: {
					periods: {
						create: input.periods,
					},
				},
				include: {
					periods: {
						include: {
							subject: true,
							classroom: true,
						},
					},
				},
			});
		}),

	delete: protectedProcedure
		.input(z.string())
		.mutation(({ ctx, input }) => {
			return ctx.prisma.timetable.delete({
				where: { id: input },
			});
		}),
});