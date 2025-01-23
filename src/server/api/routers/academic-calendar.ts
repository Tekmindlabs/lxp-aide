import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { EventType, Status } from "@prisma/client";

export const academicCalendarRouter = createTRPCRouter({
	// Calendar Operations
	createCalendar: protectedProcedure
		.input(z.object({
			name: z.string(),
			description: z.string().optional(),
			status: z.enum([Status.ACTIVE, Status.INACTIVE, Status.ARCHIVED]).default(Status.ACTIVE),
		}))
		.mutation(async ({ ctx, input }) => {
			return ctx.prisma.calendar.create({
				data: input,
			});
		}),

	getAllCalendars: protectedProcedure
		.query(async ({ ctx }) => {
			return ctx.prisma.calendar.findMany({
				include: {
					events: true,
				},
			});
		}),

	// Event Operations
	createEvent: protectedProcedure
		.input(z.object({
			title: z.string(),
			description: z.string().optional(),
			eventType: z.enum([EventType.ACADEMIC, EventType.HOLIDAY, EventType.EXAM, EventType.ACTIVITY, EventType.OTHER]),
			startDate: z.date(),
			endDate: z.date(),
			status: z.enum([Status.ACTIVE, Status.INACTIVE, Status.ARCHIVED]).default(Status.ACTIVE),
		}))
		.mutation(async ({ ctx, input }) => {
			return ctx.prisma.event.create({
				data: input,
			});
		}),

	updateEvent: protectedProcedure
		.input(z.object({
			id: z.string(),
			title: z.string().optional(),
			description: z.string().optional(),
			eventType: z.enum([EventType.ACADEMIC, EventType.HOLIDAY, EventType.EXAM, EventType.ACTIVITY, EventType.OTHER]).optional(),
			startDate: z.date().optional(),
			endDate: z.date().optional(),
			status: z.enum([Status.ACTIVE, Status.INACTIVE, Status.ARCHIVED]).optional(),
		}))
		.mutation(async ({ ctx, input }) => {
			const { id, ...data } = input;
			return ctx.prisma.event.update({
				where: { id },
				data,
			});
		}),

	deleteEvent: protectedProcedure
		.input(z.string())
		.mutation(async ({ ctx, input }) => {
			return ctx.prisma.event.delete({
				where: { id: input },
			});
		}),

	getEvent: protectedProcedure
		.input(z.string())
		.query(async ({ ctx, input }) => {
			return ctx.prisma.event.findUnique({
				where: { id: input },
			});
		}),

	getEventsByDateRange: protectedProcedure
		.input(z.object({
			eventType: z.enum([EventType.ACADEMIC, EventType.HOLIDAY, EventType.EXAM, EventType.ACTIVITY, EventType.OTHER]).optional(),
			startDate: z.date().optional(),
			endDate: z.date().optional(),
		}))
		.query(async ({ ctx, input }) => {
			const { eventType, startDate, endDate } = input;
			
			return ctx.prisma.event.findMany({
				where: {
					...(eventType && { eventType }),
					...(startDate && { startDate: { gte: startDate } }),
					...(endDate && { endDate: { lte: endDate } }),
					status: Status.ACTIVE,
				},
				orderBy: {
					startDate: 'asc',
				},
			});
		}),
});
