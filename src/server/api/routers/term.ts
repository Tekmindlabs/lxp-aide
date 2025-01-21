import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { Status } from "@prisma/client";

export const termRouter = createTRPCRouter({
	createTerm: protectedProcedure
		.input(z.object({
			name: z.string(),
			academicYearId: z.string(),
			startDate: z.date(),
			endDate: z.date(),
			status: z.enum([Status.ACTIVE, Status.INACTIVE, Status.ARCHIVED]).default(Status.ACTIVE),
		}))
		.mutation(async ({ ctx, input }) => {
			return ctx.prisma.term.create({
				data: input,
				include: {
					academicYear: true,
					timetables: true,
				},
			});
		}),

	updateTerm: protectedProcedure
		.input(z.object({
			id: z.string(),
			name: z.string().optional(),
			startDate: z.date().optional(),
			endDate: z.date().optional(),
			status: z.enum([Status.ACTIVE, Status.INACTIVE, Status.ARCHIVED]).optional(),
		}))
		.mutation(async ({ ctx, input }) => {
			const { id, ...data } = input;
			return ctx.prisma.term.update({
				where: { id },
				data,
				include: {
					academicYear: true,
					timetables: true,
				},
			});
		}),

	deleteTerm: protectedProcedure
		.input(z.string())
		.mutation(async ({ ctx, input }) => {
			return ctx.prisma.term.delete({
				where: { id: input },
			});
		}),

	getTerm: protectedProcedure
		.input(z.string())
		.query(async ({ ctx, input }) => {
			return ctx.prisma.term.findUnique({
				where: { id: input },
				include: {
					academicYear: true,
					timetables: {
						include: {
							periods: true,
						},
					},
				},
			});
		}),

	getTermsByAcademicYear: protectedProcedure
		.input(z.string())
		.query(async ({ ctx, input }) => {
			return ctx.prisma.term.findMany({
				where: { academicYearId: input },
				include: {
					timetables: {
						include: {
							periods: true,
						},
					},
				},
				orderBy: {
					startDate: 'asc',
				},
			});
		}),
});