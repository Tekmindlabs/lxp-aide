import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { ActivityType, Status } from "@prisma/client";

export const classActivityRouter = createTRPCRouter({
	create: protectedProcedure
		.input(z.object({
			title: z.string(),
			description: z.string().optional(),
			type: z.nativeEnum(ActivityType),
			classGroupId: z.string().optional(),
			classId: z.string().optional(),
			deadline: z.date().optional(),
			gradingCriteria: z.string().optional(),
			resources: z.array(z.object({
				title: z.string(),
				type: z.string(),
				url: z.string()
			})).optional()
		}))
		.mutation(async ({ ctx, input }) => {
			return ctx.db.classActivity.create({
				data: {
					...input,
					resources: {
						create: input.resources
					}
				},
				include: {
					resources: true
				}
			});
		}),

	getAll: protectedProcedure
		.input(z.object({
			classGroupId: z.string().optional(),
			classId: z.string().optional()
		}))
		.query(async ({ ctx, input }) => {
			return ctx.db.classActivity.findMany({
				where: {
					OR: [
						{ classGroupId: input.classGroupId },
						{ classId: input.classId }
					]
				},
				include: {
					resources: true,
					submissions: {
						include: {
							student: true
						}
					}
				}
			});
		}),

	getById: protectedProcedure
		.input(z.string())
		.query(async ({ ctx, input }) => {
			return ctx.db.classActivity.findUnique({
				where: { id: input },
				include: {
					resources: true,
					submissions: {
						include: {
							student: true
						}
					}
				}
			});
		}),

	update: protectedProcedure
		.input(z.object({
			id: z.string(),
			title: z.string().optional(),
			description: z.string().optional(),
			type: z.nativeEnum(ActivityType).optional(),
			deadline: z.date().optional(),
			gradingCriteria: z.string().optional()
		}))
		.mutation(async ({ ctx, input }) => {
			const { id, ...data } = input;
			return ctx.db.classActivity.update({
				where: { id },
				data,
				include: {
					resources: true
				}
			});
		}),

	delete: protectedProcedure
		.input(z.string())
		.mutation(async ({ ctx, input }) => {
			return ctx.db.classActivity.delete({
				where: { id: input }
			});
		}),

	submitActivity: protectedProcedure
		.input(z.object({
			activityId: z.string(),
			studentId: z.string(),
			submission: z.string().optional(),
			status: z.enum(["PENDING", "SUBMITTED", "GRADED", "LATE", "MISSED"])
		}))
		.mutation(async ({ ctx, input }) => {
			return ctx.db.studentActivity.create({
				data: {
					activity: { connect: { id: input.activityId } },
					student: { connect: { id: input.studentId } },
					status: input.status,
					submissionDate: new Date()
				}
			});
		}),

	gradeSubmission: protectedProcedure
		.input(z.object({
			submissionId: z.string(),
			grade: z.number(),
			feedback: z.string().optional()
		}))
		.mutation(async ({ ctx, input }) => {
			return ctx.db.studentActivity.update({
				where: { id: input.submissionId },
				data: {
					grade: input.grade,
					feedback: input.feedback,
					status: "GRADED"
				}
			});
		})
});