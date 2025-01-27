import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { Status } from "@prisma/client";
import { TRPCError } from "@trpc/server";

export const classGroupRouter = createTRPCRouter({
	createClassGroup: protectedProcedure
		.input(z.object({
			name: z.string(),
			description: z.string().optional(),
			programId: z.string(),
			status: z.enum([Status.ACTIVE, Status.INACTIVE, Status.ARCHIVED]).default(Status.ACTIVE),
		}))
		.mutation(async ({ ctx, input }) => {
			return ctx.prisma.classGroup.create({
				data: input,
				include: {
					program: true,
					subjects: true,
					classes: true,
				},
			});
		}),

	updateClassGroup: protectedProcedure
		.input(z.object({
			id: z.string(),
			name: z.string().optional(),
			description: z.string().optional(),
			programId: z.string().optional(),
			status: z.enum([Status.ACTIVE, Status.INACTIVE, Status.ARCHIVED]).optional(),
		}))
		.mutation(async ({ ctx, input }) => {
			const { id, ...data } = input;
			return ctx.prisma.classGroup.update({
				where: { id },
				data,
				include: {
					program: true,
					subjects: true,
					classes: true,
				},
			});
		}),

	deleteClassGroup: protectedProcedure
		.input(z.string())
		.mutation(async ({ ctx, input }) => {
			return ctx.prisma.classGroup.delete({
				where: { id: input },
			});
		}),

	getClassGroup: protectedProcedure
		.input(z.string())
		.query(async ({ ctx, input }) => {
			return ctx.prisma.classGroup.findUnique({
				where: { id: input },
				include: {
					program: true,
					subjects: true,
					classes: true,
					timetable: true,
				},
			});
		}),

	getAllClassGroups: protectedProcedure
		.input(z.object({
			programId: z.string().optional(),
		}).optional())
		.query(async ({ ctx, input }) => {
			return ctx.prisma.classGroup.findMany({
				where: input ? { programId: input.programId } : undefined,
				include: {
					program: true,
					subjects: true,
					classes: true,
				},
				orderBy: {
					name: 'asc',
				},
			});
		}),

	getByProgramId: protectedProcedure
		.input(z.object({
			programId: z.string().min(1, "Program ID is required")
		}))
		.query(async ({ ctx, input }) => {
			try {
				// First check if program exists
				const program = await ctx.prisma.program.findUnique({
					where: { id: input.programId }
				});

				if (!program) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Program not found",
					});
				}

				const classGroups = await ctx.prisma.classGroup.findMany({
					where: { programId: input.programId },
					include: {
						classes: {
							include: {
								students: true,
								teachers: true,
							},
						},
						program: true,
						subjects: true,
					},
					orderBy: {
						name: 'asc'
					}
				});

				return classGroups;
			} catch (error) {
				if (error instanceof TRPCError) throw error;
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to fetch class groups",
					cause: error,
				});
			}
		}),

	addSubjectsToClassGroup: protectedProcedure
		.input(z.object({
			classGroupId: z.string(),
			subjectIds: z.array(z.string()),
		}))
		.mutation(async ({ ctx, input }) => {
			const classGroup = await ctx.prisma.classGroup.update({
				where: { id: input.classGroupId },
				data: {
					subjects: {
						connect: input.subjectIds.map(id => ({ id })),
					},
				},
				include: {
					subjects: true,
				},
			});
			return classGroup;
		}),

	removeSubjectsFromClassGroup: protectedProcedure
		.input(z.object({
			classGroupId: z.string(),
			subjectIds: z.array(z.string()),
		}))
		.mutation(async ({ ctx, input }) => {
			const classGroup = await ctx.prisma.classGroup.update({
				where: { id: input.classGroupId },
				data: {
					subjects: {
						disconnect: input.subjectIds.map(id => ({ id })),
					},
				},
				include: {
					subjects: true,
				},
			});
			return classGroup;
		}),

	getClassGroupWithDetails: protectedProcedure
		.input(z.string())
		.query(async ({ ctx, input }) => {
			return ctx.prisma.classGroup.findUnique({
				where: { id: input },
				include: {
					program: {
						include: {
							classGroups: {
								include: {
									timetable: {
										include: {
											term: {
												include: {
													calendar: true,
												},
											},
										},
									},
								},
							},
						},
					},
					subjects: true,
					classes: {
						include: {
							students: true,
							teachers: {
								include: {
									teacher: {
										include: {
											user: true,
										},
									},
								},
							},
						},
					},
					timetable: {
						include: {
							term: {
								include: {
									calendar: true,
								},
							},
							periods: {
								include: {
									subject: true,
									classroom: true,
								},
							},
						},
					},
					activities: true,
				},
			});
		}),

	addSubjects: protectedProcedure
		.input(z.object({
			classGroupId: z.string(),
			subjectIds: z.array(z.string()),
		}))
		.mutation(async ({ ctx, input }) => {
			const { classGroupId, subjectIds } = input;

			// Add subjects to class group
			const classGroup = await ctx.prisma.classGroup.update({
				where: { id: classGroupId },
				data: {
					subjects: {
						connect: subjectIds.map(id => ({ id })),
					},
				},
				include: {
					subjects: true,
				},
			});

			// Inherit subjects to all classes in the group
			const classes = await ctx.prisma.class.findMany({
				where: { classGroupId },
			});

			// Update timetable for each class if needed
			for (const cls of classes) {
				if (cls.timetable) {
					// Update periods with new subjects
					// This is a simplified version - in reality, you'd need more complex logic
					// to handle existing periods and scheduling
					await ctx.prisma.period.createMany({
						data: subjectIds.map(subjectId => ({
							timetableId: cls.timetable!.id,
							subjectId,
							// Default values for new periods
							startTime: new Date(),
							endTime: new Date(),
							dayOfWeek: 1,
							classroomId: "", // You'll need to handle this appropriately
						})),
					});
				}
			}

			return classGroup;
		}),

	removeSubjects: protectedProcedure
		.input(z.object({
			classGroupId: z.string(),
			subjectIds: z.array(z.string()),
		}))
		.mutation(async ({ ctx, input }) => {
			const { classGroupId, subjectIds } = input;

			// Remove subjects from class group
			return ctx.prisma.classGroup.update({
				where: { id: classGroupId },
				data: {
					subjects: {
						disconnect: subjectIds.map(id => ({ id })),
					},
				},
				include: {
					subjects: true,
				},
			});
		}),

	inheritCalendar: protectedProcedure
		.input(z.object({
			classGroupId: z.string(),
			calendarId: z.string(),
		}))
		.mutation(async ({ ctx, input }) => {
			const { classGroupId, calendarId } = input;

			// Get the calendar and its terms
			const calendar = await ctx.prisma.calendar.findUnique({
				where: { id: calendarId },
				include: {
					terms: true,
				},
			});

			if (!calendar) {
				throw new Error("Calendar not found");
			}

			// Create a timetable for the class group using the first term
			const term = calendar.terms[0];
			if (!term) {
				throw new Error("No terms found in calendar");
			}

			const timetable = await ctx.prisma.timetable.create({
				data: {
					termId: term.id,
					classGroupId,
				},
			});

			return ctx.prisma.classGroup.findUnique({
				where: { id: classGroupId },
				include: {
					timetable: {
						include: {
							term: {
								include: {
									calendar: true,
								},
							},
						},
					},
				},
			});
		}),
});