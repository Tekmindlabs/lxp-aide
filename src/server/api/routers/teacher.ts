import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { Status, UserType } from "@prisma/client";

export const teacherRouter = createTRPCRouter({
	createTeacher: protectedProcedure
		.input(z.object({
			name: z.string(),
			email: z.string().email(),
			specialization: z.string().optional(),
			availability: z.string().optional(),
			subjectIds: z.array(z.string()).optional(),
			classIds: z.array(z.string()).optional(),
		}))
		.mutation(async ({ ctx, input }) => {
			const { subjectIds, classIds, specialization, availability, ...userData } = input;

			// Create user with teacher profile
			const user = await ctx.prisma.user.create({
				data: {
					...userData,
					userType: UserType.TEACHER,
					teacherProfile: {
						create: {
							specialization,
							availability,
							...(subjectIds && {
								subjects: {
									create: subjectIds.map(subjectId => ({
										subject: { connect: { id: subjectId } },
										status: Status.ACTIVE,
									})),
								},
							}),
							...(classIds && {
								classes: {
									create: classIds.map(classId => ({
										class: { connect: { id: classId } },
										status: Status.ACTIVE,
									})),
								},
							}),
						},
					},
				},
				include: {
					teacherProfile: {
						include: {
							subjects: {
								include: {
									subject: true,
								},
							},
							classes: {
								include: {
									class: true,
								},
							},
						},
					},
				},
			});

			return user;
		}),

	updateTeacher: protectedProcedure
		.input(z.object({
			id: z.string(),
			name: z.string().optional(),
			email: z.string().email().optional(),
			specialization: z.string().optional(),
			availability: z.string().optional(),
			subjectIds: z.array(z.string()).optional(),
			classIds: z.array(z.string()).optional(),
		}))
		.mutation(async ({ ctx, input }) => {
			const { id, subjectIds, classIds, ...updateData } = input;

			const teacherProfile = await ctx.prisma.teacherProfile.findUnique({
				where: { userId: id },
			});

			if (!teacherProfile) {
				throw new Error("Teacher profile not found");
			}

			if (subjectIds) {
				await ctx.prisma.teacherSubject.deleteMany({
					where: { teacherId: teacherProfile.id },
				});

				if (subjectIds.length > 0) {
					await ctx.prisma.teacherSubject.createMany({
						data: subjectIds.map(subjectId => ({
							teacherId: teacherProfile.id,
							subjectId,
							status: Status.ACTIVE,
						})),
					});
				}
			}

			if (classIds) {
				await ctx.prisma.teacherClass.deleteMany({
					where: { teacherId: teacherProfile.id },
				});

				if (classIds.length > 0) {
					await ctx.prisma.teacherClass.createMany({
						data: classIds.map(classId => ({
							teacherId: teacherProfile.id,
							classId,
							status: Status.ACTIVE,
						})),
					});
				}
			}

			const updatedUser = await ctx.prisma.user.update({
				where: { id },
				data: {
					...updateData,
					teacherProfile: {
						update: {
							specialization: updateData.specialization,
							availability: updateData.availability,
						},
					},
				},
				include: {
					teacherProfile: {
						include: {
							subjects: {
								include: {
									subject: true,
								},
							},
							classes: {
								include: {
									class: true,
								},
							},
						},
					},
				},
			});

			return updatedUser;
		}),

	deleteTeacher: protectedProcedure
		.input(z.string())
		.mutation(async ({ ctx, input }) => {
			return ctx.prisma.user.delete({
				where: { id: input },
			});
		}),

	getTeacher: protectedProcedure
		.input(z.string())
		.query(async ({ ctx, input }) => {
			return ctx.prisma.user.findFirst({
				where: { 
					id: input,
					deleted: null,
					status: 'ACTIVE',
					userType: 'TEACHER'
				},
				include: {
					teacherProfile: true,
					userRoles: {
						include: {
							role: true
						}
					}
				}
			});
		}),


	searchTeachers: protectedProcedure
		.input(z.object({
			query: z.string(),
			page: z.number().min(1).default(1),
			limit: z.number().min(1).max(100).default(10),
		}))
		.query(async ({ ctx, input }) => {
			const skip = (input.page - 1) * input.limit;

			const teachers = await ctx.prisma.user.findMany({
				where: {
					deleted: null,
					status: 'ACTIVE',
					userType: 'TEACHER',
					OR: [
						{ name: { contains: input.query, mode: 'insensitive' } },
						{ email: { contains: input.query, mode: 'insensitive' } },
					],
				},
				include: {
					teacherProfile: true,
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
					userType: 'TEACHER',
					OR: [
						{ name: { contains: input.query, mode: 'insensitive' } },
						{ email: { contains: input.query, mode: 'insensitive' } },
					],
				},
			});

			return {
				teachers,
				total,
				pages: Math.ceil(total / input.limit),
			};
		}),

});