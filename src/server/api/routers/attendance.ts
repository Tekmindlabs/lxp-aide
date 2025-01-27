import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { AttendanceStatus } from "@prisma/client";

export const attendanceRouter = createTRPCRouter({
    getAttendance: protectedProcedure
        .input(z.object({
            classId: z.string(),
            date: z.string()
        }))
        .query(async ({ ctx, input }) => {
            const attendance = await ctx.prisma.attendance.findMany({
                where: {
                    student: {
                        classId: input.classId
                    },
                    date: new Date(input.date)
                }
            });
            
            const attendanceMap = attendance.reduce((acc, curr) => {
                acc[curr.studentId] = curr;
                return acc;
            }, {} as Record<string, typeof attendance[0]>);

            return attendanceMap;
        }),

    updateAttendance: protectedProcedure
        .input(z.object({
            studentId: z.string(),
            classId: z.string(),
            date: z.string(),
            status: z.nativeEnum(AttendanceStatus)
        }))
        .mutation(async ({ ctx, input }) => {
            const { studentId, date, status } = input;
            const attendanceDate = new Date(date);

            const existingAttendance = await ctx.prisma.attendance.findFirst({
                where: {
                    studentId,
                    date: attendanceDate
                }
            });

            if (existingAttendance) {
                return ctx.prisma.attendance.update({
                    where: { id: existingAttendance.id },
                    data: { status }
                });
            }

            return ctx.prisma.attendance.create({
                data: {
                    studentId,
                    date: attendanceDate,
                    status
                }
            });
        })
});