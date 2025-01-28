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
			startDate: z.date(),
			endDate: z.date(),
			type: z.enum(['PRIMARY', 'SECONDARY', 'EXAM', 'ACTIVITY']).default('PRIMARY'),
			status: z.enum([Status.ACTIVE, Status.INACTIVE, Status.ARCHIVED]).default(Status.ACTIVE),
			isDefault: z.boolean().default(false),
			visibility: z.enum(['ALL', 'STAFF', 'STUDENTS', 'PARENTS']).default('ALL'),
			metadata: z.any().optional(),
		}))
		.mutation(async ({ ctx, input }) => {
			return ctx.prisma.calendar.create({
				data: input,
				include: {
					events: true,
				},
			});
		}),

	getAllCalendars: protectedProcedure
		.query(async ({ ctx }) => {
			console.log('getAllCalendars TRPC Procedure Called', {
				sessionExists: !!ctx.session,
				userId: ctx.session?.user?.id,
				userRoles: ctx.session?.user?.roles,
				timestamp: new Date().toISOString()
			});

			// Explicit session validation
			if (!ctx.session) {
				console.error('No session found in getAllCalendars');
				throw new TRPCError({
					code: "UNAUTHORIZED", 
					message: "No active session. Please log in.",
					cause: { 
						timestamp: new Date().toISOString(),
						context: 'getAllCalendars'
					}
				});
			}

			if (!ctx.session.user) {
				console.error('No user in session for getAllCalendars');
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "User information is missing from the session.",
					cause: { 
						timestamp: new Date().toISOString(),
						context: 'getAllCalendars'
					}
				});
			}

			try {
				const calendars = await ctx.prisma.calendar.findMany({
					include: {
						events: {
							take: 10, // Limit events to prevent overwhelming response
							orderBy: { startDate: 'asc' }
						}
					},
					take: 50, // Limit total calendars
					orderBy: { createdAt: 'desc' }
				});

				console.log('Calendars Retrieved Successfully', {
					totalCalendars: calendars.length,
					timestamp: new Date().toISOString()
				});

				return calendars;
			} catch (error) {
				console.error('Database Query Error in getAllCalendars', {
					errorName: error instanceof Error ? error.name : 'Unknown Error',
					errorMessage: error instanceof Error ? error.message : 'No error details',
					timestamp: new Date().toISOString()
				});

				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to retrieve calendars. Please try again later.",
					cause: error
				});
			}
		}),

	getCalendarById: protectedProcedure
		.input(z.object({
			id: z.string(),
		}))
		.query(async ({ ctx, input }) => {
			return ctx.prisma.calendar.findUnique({
				where: { id: input.id },
				include: {
					events: true,
				},
			});
		}),

	updateCalendar: protectedProcedure
		.input(z.object({
			id: z.string(),
			name: z.string().optional(),
			description: z.string().optional(),
			startDate: z.date().optional(),
			endDate: z.date().optional(),
			type: z.enum(['PRIMARY', 'SECONDARY', 'EXAM', 'ACTIVITY']).optional(),
			status: z.enum([Status.ACTIVE, Status.INACTIVE, Status.ARCHIVED]).optional(),
			visibility: z.enum(['ALL', 'STAFF', 'STUDENTS', 'PARENTS']).optional(),
		}))
		.mutation(async ({ ctx, input }) => {
			const { id, ...data } = input;
			return ctx.prisma.calendar.update({
				where: { id },
				data,
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
			calendarId: z.string()
		}))
		.mutation(async ({ ctx, input }) => {
			const { calendarId, ...eventData } = input;
			return ctx.prisma.event.create({
				data: {
					...eventData,
					calendar: {
						connect: { id: calendarId }
					}
				},
				include: {
					calendar: true
				}
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
			calendarId: z.string()
		}))
		.query(async ({ ctx, input }) => {
			const { eventType, startDate, endDate, calendarId } = input;
			
			return ctx.prisma.event.findMany({
				where: {
					...(eventType && { eventType }),
					...(startDate && { startDate: { gte: startDate } }),
					...(endDate && { endDate: { lte: endDate } }),
					calendarId,
					status: Status.ACTIVE,
				},
				orderBy: {
					startDate: 'asc',
				},
				include: {
					calendar: true
				}
			});
		}),
});
