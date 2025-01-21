import { DefaultRoles } from "@/utils/permissions";
import { DashboardFeature } from "@/types/dashboard";

export const DashboardFeatures: Record<keyof typeof DefaultRoles, DashboardFeature[]> = {
  "SUPER_ADMIN": [
    'system-metrics',
    'user-management',
    'role-management',
    'audit-logs',
    'advanced-settings',
    'academic-calendar',
    'timetable-management',
    'classroom-management'
  ],
  "ADMIN": [  // Changed from [DefaultRoles.ADMIN] to "ADMIN"
    'user-management',
    'audit-logs',
    'timetable-management',
    'classroom-management'
  ],
  "PROGRAM_COORDINATOR": [
    'class-management',
    'student-progress',
    'timetable-management'
  ],
  "TEACHER": [
    'class-management',
    'student-progress',
    'assignments',
    'grading'
  ],
  "STUDENT": [
    'assignments',
    'student-progress'
  ],
  "PARENT": [
    'student-progress'
  ]
};