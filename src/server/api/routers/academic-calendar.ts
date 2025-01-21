import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { EventType, Status } from "@prisma/client";

const recurrencePatternSchema = z.object({
	frequency: z.enum(['daily', 'weekly', 'monthly']),
	interval: z.number().min(1),
	endAfterOccurrences: z.number().min(1).optional(),
});

export const academicCalendarRouter = createTRPCRouter({
	// Academic Year Operations
	createAcademicYear: protectedProcedure
		.input(z.object({
			name: z.string(),
			startDate: z.date(),
			endDate: z.date(),
			status: z.enum([Status.ACTIVE, Status.INACTIVE, Status.ARCHIVED]).default(Status.ACTIVE),
		}))
		.mutation(async ({ ctx, input }) => {
			return ctx.prisma.academicYear.create({
				data: input,
			});
		}),

	updateAcademicYear: protectedProcedure
		.input(z.object({
			id: z.string(),
			name: z.string().optional(),
			startDate: z.date().optional(),
			endDate: z.date().optional(),
			status: z.enum([Status.ACTIVE, Status.INACTIVE, Status.ARCHIVED]).optional(),
		}))
		.mutation(async ({ ctx, input }) => {
			const { id, ...data } = input;
			return ctx.prisma.academicYear.update({
				where: { id },
				data,
			});
		}),

	deleteAcademicYear: protectedProcedure
		.input(z.string())
		.mutation(async ({ ctx, input }) => {
			return ctx.prisma.academicYear.delete({
				where: { id: input },
			});
		}),

	getAcademicYear: protectedProcedure
		.input(z.string())
		.query(async ({ ctx, input }) => {
			return ctx.prisma.academicYear.findUnique({
				where: { id: input },
				include: {
					events: true,
					terms: true,
				},
			});
		}),

	getAllAcademicYears: protectedProcedure
		.query(async ({ ctx }) => {
			return ctx.prisma.academicYear.findMany({
				include: {
					events: true,
					terms: true,
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
			academicYearId: z.string(),
			status: z.enum([Status.ACTIVE, Status.INACTIVE, Status.ARCHIVED]).default(Status.ACTIVE),
			recurrencePattern: recurrencePatternSchema.optional(),
		}))
		.mutation(async ({ ctx, input }) => {
			const { recurrencePattern, ...eventData } = input;
      
			if (!recurrencePattern) {
				return ctx.prisma.event.create({
					data: eventData,
				});
			}

			// Handle recurring events
			const events = [];
			const { frequency, interval, endAfterOccurrences = 1 } = recurrencePattern;
			let currentDate = new Date(eventData.startDate);
			const duration = eventData.endDate.getTime() - eventData.startDate.getTime();

			for (let i = 0; i < endAfterOccurrences; i++) {
				const event = {
					...eventData,
					startDate: new Date(currentDate),
					endDate: new Date(currentDate.getTime() + duration),
				};
        
				events.push(ctx.prisma.event.create({ data: event }));

				// Calculate next occurrence
				switch (frequency) {
					case 'daily':
						currentDate.setDate(currentDate.getDate() + interval);
						break;
					case 'weekly':
						currentDate.setDate(currentDate.getDate() + (interval * 7));
						break;
					case 'monthly':
						currentDate.setMonth(currentDate.getMonth() + interval);
						break;
				}
			}

			return Promise.all(events);
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

	getEventsByAcademicYear: protectedProcedure
		.input(z.object({
			academicYearId: z.string(),
			eventType: z.enum([EventType.ACADEMIC, EventType.HOLIDAY, EventType.EXAM, EventType.ACTIVITY, EventType.OTHER]).optional(),
			startDate: z.date().optional(),
			endDate: z.date().optional(),
		}))
		.query(async ({ ctx, input }) => {
			const { academicYearId, eventType, startDate, endDate } = input;
      
			return ctx.prisma.event.findMany({
				where: {
					academicYearId,
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