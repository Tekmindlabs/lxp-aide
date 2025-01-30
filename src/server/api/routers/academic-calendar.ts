import { z } from "zod";
import { createTRPCRouter, protectedProcedure, permissionProtectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { EventType, Status } from "@prisma/client";
import { Permissions } from "@/utils/permissions";

export const academicCalendarRouter = createTRPCRouter({
	// Calendar Operations
	createCalendar: permissionProtectedProcedure(Permissions.ACADEMIC_CALENDAR_MANAGE)
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

	getAllCalendars: permissionProtectedProcedure(Permissions.ACADEMIC_CALENDAR_VIEW)
		.query(async ({ ctx }) => {
			console.log('getAllCalendars Procedure Start:', {
				userId: ctx.session?.user?.id,
				userRoles: ctx.session?.user?.roles || [],
				hasViewPermission: ctx.session?.user?.permissions?.includes(Permissions.ACADEMIC_CALENDAR_VIEW),
				timestamp: new Date().toISOString()
			});

			try {
				const calendars = await ctx.prisma.calendar.findMany({
					include: {
						events: {
							take: 10,
							orderBy: { startDate: 'asc' }
						}
					},
					take: 50,
					orderBy: { createdAt: 'desc' }
				});

				console.log('Calendars Retrieved:', {
					count: calendars.length,
					userId: ctx.session.user.id,
					timestamp: new Date().toISOString()
				});

				return calendars;
			} catch (error) {
				console.error('Calendar Retrieval Error:', {
					error: error instanceof Error ? error.message : 'Unknown error',
					userId: ctx.session.user.id,
					timestamp: new Date().toISOString()
				});

				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to retrieve calendars",
					cause: error
				});
			}
		}),


	getCalendarById: permissionProtectedProcedure(Permissions.ACADEMIC_CALENDAR_VIEW)
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

	updateCalendar: permissionProtectedProcedure(Permissions.ACADEMIC_CALENDAR_MANAGE)
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
