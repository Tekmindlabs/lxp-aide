import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { Status } from "@prisma/client";

export const classRouter = createTRPCRouter({
	createClass: protectedProcedure
		.input(z.object({
			name: z.string(),
			classGroupId: z.string(),
			capacity: z.number(),
			status: z.enum([Status.ACTIVE, Status.INACTIVE, Status.ARCHIVED]).default(Status.ACTIVE),
			description: z.string().optional(),
			academicYear: z.string().optional(),
			semester: z.string().optional(),
			classTutorId: z.string().optional(),
			teacherIds: z.array(z.string()).optional(),
		}))
		.mutation(async ({ ctx, input }) => {
			const { teacherIds, classTutorId, ...classData } = input;
			
			const newClass = await ctx.prisma.class.create({
				data: {
					...classData,
					...(teacherIds && {
						teachers: {
							create: teacherIds.map(teacherId => ({
								teacher: {
									connect: { id: teacherId }
								},
								isClassTutor: teacherId === classTutorId,
								status: Status.ACTIVE,
							})),
						},
					}),
				},
				include: {
					classGroup: {
						include: {
							program: true,
						},
					},
					teachers: {
						include: {
							teacher: {
								include: {
									user: true,
								},
							},
							subjects: true,
						},
					},
					students: {
						include: {
							user: true,
						},
					},
				},
			});

			return newClass;
		}),

	updateClass: protectedProcedure
		.input(z.object({
			id: z.string(),
			name: z.string().optional(),
			classGroupId: z.string().optional(),
			capacity: z.number().optional(),
			status: z.enum([Status.ACTIVE, Status.INACTIVE, Status.ARCHIVED]).optional(),
			description: z.string().optional(),
			academicYear: z.string().optional(),
			semester: z.string().optional(),
			classTutorId: z.string().optional(),
			teacherIds: z.array(z.string()).optional(),
		}))
		.mutation(async ({ ctx, input }) => {
			const { id, teacherIds, classTutorId, ...data } = input;

			if (teacherIds) {
				await ctx.prisma.teacherClass.deleteMany({
					where: { classId: id },
				});

				if (teacherIds.length > 0) {
					await ctx.prisma.teacherClass.createMany({
						data: teacherIds.map(teacherId => ({
							classId: id,
							teacherId,
							isClassTutor: teacherId === classTutorId,
							status: Status.ACTIVE,
						})),
					});
				}
			}

			return ctx.prisma.class.update({
				where: { id },
				data,
				include: {
					classGroup: {
						include: {
							program: true,
						},
					},
					teachers: {
						include: {
							teacher: {
								include: {
									user: true,
								},
							},
						},
					},
					students: true,
				},
			});
		}),

	deleteClass: protectedProcedure
		.input(z.string())
		.mutation(async ({ ctx, input }) => {
			return ctx.prisma.class.delete({
				where: { id: input },
			});
		}),

	getClass: protectedProcedure
		.input(z.string())
		.query(async ({ ctx, input }) => {
			return ctx.prisma.class.findUnique({
				where: { id: input },
				include: {
					classGroup: {
						include: {
							program: true,
						},
					},
					teachers: {
						include: {
							teacher: {
								include: {
									user: true,
								},
							},
						},
					},
					students: true,
					activities: true,
					timetable: {
						include: {
							periods: true,
						},
					},
				},
			});
		}),

	searchClasses: protectedProcedure
		.input(z.object({
			search: z.string().optional(),
			classGroupId: z.string().optional(),
			teacherId: z.string().optional(),
			status: z.enum([Status.ACTIVE, Status.INACTIVE, Status.ARCHIVED]).optional(),
		}))
		.query(async ({ ctx, input }) => {
			const { search, classGroupId, teacherId, status } = input;

			return ctx.prisma.class.findMany({
				where: {
					...(search && {
						OR: [
							{ name: { contains: search, mode: 'insensitive' } },
							{ description: { contains: search, mode: 'insensitive' } },
						],
					}),
					...(classGroupId && { classGroupId }),
					...(teacherId && {
						teachers: {
							some: { teacherId },
						},
					}),
					...(status && { status }),
				},
				include: {
					classGroup: {
						include: {
							program: true,
						},
					},
					teachers: {
						include: {
							teacher: {
								include: {
									user: true,
								},
							},
						},
					},
					students: true,
				},
				orderBy: {
					name: 'asc',
				},
			});
		}),

	getClassDetails: protectedProcedure
		.input(z.object({
			id: z.string(),
		}))
		.query(async ({ ctx, input }) => {
			return ctx.prisma.class.findUnique({
				where: { id: input.id },
				include: {
					classGroup: {
						include: {
							program: true,
						},
					},
					teachers: {
						include: {
							teacher: {
								include: {
									user: true,
								},
							},
						},
					},
					students: {
						include: {
							user: true,
							activities: {
								select: {
									status: true,
									grade: true,
								},
							},
							attendance: {
								select: {
									status: true,
									date: true,
								},
							},
						},
					},
					activities: {
						include: {
							submissions: true,
						},
					},
					timetable: {
						include: {
							periods: true,
						},
					},
				},
			});
		}),
});
