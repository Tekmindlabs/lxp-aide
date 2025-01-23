import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "src/server/api/trpc";

export const academicCalendarRouter = createTRPCRouter({
  getAllAcademicYears: protectedProcedure
    .query(async ({ ctx }: { ctx: any }) => {
      return await ctx.db.calendar.findMany({
        orderBy: { startDate: "desc" },
      });
    }),
  getAllCalendars: protectedProcedure
    .query(async ({ ctx }: { ctx: any }) => {
      return await ctx.db.calendar.findMany({
        orderBy: { startDate: "desc" },
      });
    }),
});
