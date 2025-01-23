import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { CalendarType, Status, Visibility } from "@prisma/client";

const calendarSchema = z.object({
	name: z.string(),
	description: z.string().optional(),
	startDate: z.date(),
	endDate: z.date(),
	type: z.nativeEnum(CalendarType),
	visibility: z.nativeEnum(Visibility),
	isDefault: z.boolean().optional(),
	status: z.nativeEnum(Status).optional(),
});

export const calendarRouter = createTRPCRouter({
	getAllCalendars: protectedProcedure.query(async ({ ctx }) => {
		return ctx.prisma.calendar.findMany({
			include: {
				events: true,
			},
			orderBy: {
				createdAt: 'desc',
			},
		});
	}),

	getCalendarById: protectedProcedure
		.input(z.object({ id: z.string() }))
		.query(async ({ ctx, input }) => {
			const calendar = await ctx.prisma.calendar.findUnique({
				where: { id: input.id },
				include: {
					events: true,
					programs: true,
					terms: true,
				},
			});

			if (!calendar) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'Calendar not found',
				});
			}

			return calendar;
		}),

	createCalendar: protectedProcedure
		.input(calendarSchema)
		.mutation(async ({ ctx, input }) => {
			// If this calendar is set as default, unset any existing default calendar
			if (input.isDefault) {
				await ctx.prisma.calendar.updateMany({
					where: { isDefault: true },
					data: { isDefault: false },
				});
			}

			return ctx.prisma.calendar.create({
				data: {
					...input,
					status: input.status || Status.ACTIVE,
				},
			});
		}),

	updateCalendar: protectedProcedure
		.input(z.object({
			id: z.string(),
			data: calendarSchema.partial(),
		}))
		.mutation(async ({ ctx, input }) => {
			const { id, data } = input;

			// If this calendar is being set as default, unset any existing default calendar
			if (data.isDefault) {
				await ctx.prisma.calendar.updateMany({
					where: { 
						isDefault: true,
						id: { not: id },
					},
					data: { isDefault: false },
				});
			}

			return ctx.prisma.calendar.update({
				where: { id },
				data,
			});
		}),

	deleteCalendar: protectedProcedure
		.input(z.string())
		.mutation(async ({ ctx, input }) => {
			const calendar = await ctx.prisma.calendar.findUnique({
				where: { id: input },
				include: {
					events: true,
					programs: true,
				},
			});

			if (!calendar) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'Calendar not found',
				});
			}

			if (calendar.isDefault) {
				throw new TRPCError({
					code: 'BAD_REQUEST',
					message: 'Cannot delete default calendar',
				});
			}

			if (calendar.programs.length > 0) {
				throw new TRPCError({
					code: 'BAD_REQUEST',
					message: 'Cannot delete calendar with associated programs',
				});
			}

			// Delete all events first
			await ctx.prisma.event.deleteMany({
				where: { calendarId: input },
			});

			// Then delete the calendar
			return ctx.prisma.calendar.delete({
				where: { id: input },
			});
		}),
});