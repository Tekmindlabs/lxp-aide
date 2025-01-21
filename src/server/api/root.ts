import { createTRPCRouter } from "@/server/api/trpc";
import { userRouter } from "./routers/user";
import { roleRouter } from "./routers/role";
import { permissionRouter } from "./routers/permission";
import { academicCalendarRouter } from "./routers/academic-calendar";
import { programRouter } from "./routers/program";
import { classGroupRouter } from "./routers/class-group";
import { classRouter } from "./routers/class";
import { termRouter } from "./routers/term";
import { subjectRouter } from "./routers/subject";
import { teacherRouter } from "./routers/teacher";
import { studentRouter } from "./routers/student";
import { timetableRouter } from "./routers/timetable";
import { classroomRouter } from "./routers/classroom";
import { messageRouter } from "./routers/message";
import { notificationRouter } from "./routers/notification";

export const appRouter = createTRPCRouter({
  user: userRouter,
  role: roleRouter,
  permission: permissionRouter,
  academicCalendar: academicCalendarRouter,
  program: programRouter,
  classGroup: classGroupRouter,
  class: classRouter,
  term: termRouter,
  subject: subjectRouter,
  teacher: teacherRouter,
  student: studentRouter,
  timetable: timetableRouter,
  classroom: classroomRouter,
  message: messageRouter,
  notification: notificationRouter,
});

export type AppRouter = typeof appRouter;