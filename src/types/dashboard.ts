import { DefaultRoles } from "@/utils/permissions";

export type DashboardFeature =
  | 'system-metrics'
  | 'user-management'
  | 'role-management'
  | 'audit-logs'
  | 'advanced-settings'
  | 'class-management'
  | 'student-progress'
  | 'assignments'
  | 'grading'
  | 'academic-calendar'
  | 'timetable-management'
  | 'classroom-management';

export interface DashboardComponent {
  component: React.ComponentType<any>;
  span: string;
  props?: Record<string, any>;
}

export interface DashboardLayout {
  type: 'complex' | 'focused' | 'simple';
  components: DashboardComponent[];
}