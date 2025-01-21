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
			teacherIds: z.array(z.string()).optional(),
		}))
		.mutation(async ({ ctx, input }) => {
			const { teacherIds, ...classData } = input;
			
			const newClass = await ctx.db.class.create({
				data: {
					...classData,
					...(teacherIds && {
						teachers: {
							create: teacherIds.map(teacherId => ({
								teacher: {
									connect: { id: teacherId }
								},
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
						},
					},
					students: true,
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
			teacherIds: z.array(z.string()).optional(),
		}))
		.mutation(async ({ ctx, input }) => {
			const { id, teacherIds, ...data } = input;

			if (teacherIds) {
				// Remove existing teacher assignments
				await ctx.db.teacherClass.deleteMany({
					where: { classId: id },
				});

				// Add new teacher assignments
				if (teacherIds.length > 0) {
					await ctx.db.teacherClass.createMany({
						data: teacherIds.map(teacherId => ({
							classId: id,
							teacherId,
							status: Status.ACTIVE,
						})),
					});
				}
			}

			return ctx.db.class.update({
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
			return ctx.db.class.delete({
				where: { id: input },
			});
		}),

	getClass: protectedProcedure
		.input(z.string())
		.query(async ({ ctx, input }) => {
			return ctx.db.class.findUnique({
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

			return ctx.db.class.findMany({
				where: {
					...(search && {
						OR: [
							{ name: { contains: search, mode: 'insensitive' } },
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
});
