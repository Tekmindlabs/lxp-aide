import { DefaultRoles } from "@/utils/permissions";
import { DashboardFeature } from "@/types/dashboard";

export const DashboardFeatures = {
  "super_admin": [
    'system-metrics',
    'user-management',
    'role-management',
    'audit-logs',
    'program-management',
    'class-management',
    'student-progress',
    'classroom-management',
    'class-activity-management',
    'knowledge-base'
  ],
  "admin": [
    'user-management',
    'audit-logs',
    'timetable-management',
    'classroom-management',
    'class-activity-management',
    'knowledge-base'
  ],
  "program_coordinator": [
    'class-management',
    'student-progress',
    'timetable-management',
    'class-activity-management',
    'knowledge-base'
  ],
  "teacher": [
    'class-management',
    'student-progress',
    'assignments',
    'grading',
    'class-activity-management',
    'knowledge-base'
  ],
  "student": [
    'assignments',
    'student-progress',
    'class-activities',
    'knowledge-base'
  ],
  "parent": [
    'student-progress',
    'class-activities'
  ]
} as const;

// Add debug logging for feature access
export const getFeaturesByRole = (role: string) => {
  const normalizedRole = role.toLowerCase();
  
  console.log('Getting features for role:', {
    role,
    normalizedRole,
    timestamp: new Date().toISOString()
  });
  
  return DashboardFeatures[normalizedRole as keyof typeof DashboardFeatures] || [];
};