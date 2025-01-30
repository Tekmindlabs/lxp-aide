import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { Status, UserType } from "@prisma/client";

export const studentRouter = createTRPCRouter({
	createStudent: protectedProcedure
		.input(z.object({
			name: z.string(),
			email: z.string().email(),
			dateOfBirth: z.date(),
			classId: z.string().optional(),
			parentId: z.string().optional(),
			guardianInfo: z.object({
				name: z.string(),
				relationship: z.string(),
				contact: z.string(),
			}).optional(),
		}))
		.mutation(async ({ ctx, input }) => {
			const { classId, parentId, guardianInfo, ...userData } = input;

			const student = await ctx.prisma.user.create({
				data: {
					...userData,
					userType: UserType.STUDENT,
					studentProfile: {
						create: {
							dateOfBirth: input.dateOfBirth,
							...(classId && { classId }),
							...(parentId && { parentId }),
						},
					},
				},
				include: {
					studentProfile: {
						include: {
							class: {
								include: {
									classGroup: {
										include: {
											program: true,
										},
									},
								},
							},
							parent: {
								include: {
									user: true,
								},
							},
							activities: {
								include: {
									activity: true,
								},
							},
							attendance: true,
						},
					},
				},
			});

			return student;
		}),

	updateStudent: protectedProcedure
		.input(z.object({
			id: z.string(),
			name: z.string().optional(),
			email: z.string().email().optional(),
			dateOfBirth: z.date().optional(),
			classId: z.string().optional(),
			parentId: z.string().optional(),
			guardianInfo: z.object({
				name: z.string(),
				relationship: z.string(),
				contact: z.string(),
			}).optional(),
		}))
		.mutation(async ({ ctx, input }) => {
			const { id, classId, parentId, guardianInfo, dateOfBirth, ...updateData } = input;

			const updatedStudent = await ctx.prisma.user.update({
				where: { id },
				data: {
					...updateData,
					studentProfile: {
						update: {
							...(dateOfBirth && { dateOfBirth }),
							...(classId && { classId }),
							...(parentId && { parentId }),
						},
					},
				},
				include: {
					studentProfile: {
						include: {
							class: {
								include: {
									classGroup: {
										include: {
											program: true,
										},
									},
								},
							},
							parent: {
								include: {
									user: true,
								},
							},
							activities: {
								include: {
									activity: true,
								},
							},
							attendance: true,
						},
					},
				},
			});

			return updatedStudent;
		}),

	deleteStudent: protectedProcedure
		.input(z.string())
		.mutation(async ({ ctx, input }) => {
			return ctx.prisma.user.delete({
				where: { id: input },
			});
		}),

	getStudent: protectedProcedure
		.input(z.string())
		.query(async ({ ctx, input }) => {
			return ctx.prisma.user.findUnique({
				where: { id: input },
				include: {
					studentProfile: {
						include: {
							class: {
								include: {
									classGroup: {
										include: {
											program: true,
										},
									},
								},
							},
							parent: {
								include: {
									user: true,
								},
							},
							activities: {
								include: {
									activity: true,
								},
							},
							attendance: true,
						},
					},
				},
			});
		}),

	searchStudents: protectedProcedure
		.input(z.object({
			search: z.string().optional(),
			classId: z.string().optional(),
			programId: z.string().optional(),
			status: z.enum([Status.ACTIVE, Status.INACTIVE, Status.ARCHIVED]).optional(),
		}))
		.query(async ({ ctx, input }) => {
			const { search, classId, programId, status } = input;

			return ctx.prisma.user.findMany({
				where: {
					userType: UserType.STUDENT,
					...(search && {
						OR: [
							{ name: { contains: search, mode: 'insensitive' } },
							{ email: { contains: search, mode: 'insensitive' } },
						],
					}),
					studentProfile: {
						...(classId && { classId }),
						...(programId && {
							class: {
								classGroup: {
									programId,
								},
							},
						}),
					},
					...(status && { status }),
				},
				include: {
					studentProfile: {
						include: {
							class: {
								include: {
									classGroup: {
										include: {
											program: true,
										},
									},
								},
							},
							parent: {
								include: {
									user: true,
								},
							},
							activities: {
								include: {
									activity: true,
								},
							},
							attendance: true,
						},
					},
				},
				orderBy: {
					name: 'asc',
				},
			});
		}),

	getStudentPerformance: protectedProcedure
		.input(z.string())
		.query(async ({ ctx, input }) => {
			const student = await ctx.prisma.studentProfile.findUnique({
				where: { userId: input },
				include: {
					activities: {
						include: {
							activity: true,
						},
					},
					attendance: true,
					class: {
						include: {
							classGroup: {
								include: {
									subjects: true,
								},
							},
						},
					},
				},
			});

			if (!student) {
				throw new Error("Student not found");
			}

			// Calculate performance metrics
			const activities = student.activities;
			const attendance = student.attendance;
			const subjects = student.class?.classGroup.subjects || [];

			// Activity performance
			const activityMetrics = {
				total: activities.length,
				completed: activities.filter(a => a.status === 'SUBMITTED' || a.status === 'GRADED').length,
				graded: activities.filter(a => a.status === 'GRADED').length,
				averageGrade: activities.reduce((acc, curr) => acc + (curr.grade || 0), 0) / activities.length || 0,
			};

			// Attendance metrics
			const attendanceMetrics = {
				total: attendance.length,
				present: attendance.filter(a => a.status === 'PRESENT').length,
				absent: attendance.filter(a => a.status === 'ABSENT').length,
				late: attendance.filter(a => a.status === 'LATE').length,
				excused: attendance.filter(a => a.status === 'EXCUSED').length,
				attendanceRate: (attendance.filter(a => a.status === 'PRESENT').length / attendance.length) * 100 || 0,
			};

			// Subject-wise performance
			const subjectPerformance = subjects.map(subject => {
				const subjectActivities = activities.filter(a => 
					a.activity.classId === student.classId && 
					a.activity.type === 'EXAM'
				);

				return {
					subject: subject.name,
					activities: subjectActivities.length,
					averageGrade: subjectActivities.reduce((acc, curr) => acc + (curr.grade || 0), 0) / subjectActivities.length || 0,
				};
			});

			return {
				student,
				performance: {
					activities: activityMetrics,
					attendance: attendanceMetrics,
					subjects: subjectPerformance,
				},
			};
		}),

	getStudentProfile: protectedProcedure
		.input(z.object({
			id: z.string()
		}))
		.query(async ({ ctx, input }) => {
			const studentProfile = await ctx.prisma.studentProfile.findUnique({
				where: { id: input.id },
				include: {
					user: true,
					activities: {
						select: {
							status: true,
							grade: true
						}
					},
					attendance: {
						select: {
							status: true,
							date: true
						}
					}
				}
			});

			if (!studentProfile) {
				throw new Error("Student profile not found");
			}

			return studentProfile;
		}),
});