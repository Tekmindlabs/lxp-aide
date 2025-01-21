import { DefaultRoles } from "@/utils/permissions";
import { DashboardLayout } from "@/types/dashboard";
import { Card } from "@/components/ui/card";
import { AcademicCalendarView } from "@/components/dashboard/roles/super-admin/academic-calendar/AcademicCalendarView";

// Temporary placeholder component
const PlaceholderComponent = () => <Card>Content</Card>;

export const RoleLayouts: Record<keyof typeof DefaultRoles, DashboardLayout> = {
  [DefaultRoles.SUPER_ADMIN]: {
    type: 'complex',
    components: [
      { component: AcademicCalendarView, span: 'col-span-4' },
      { component: PlaceholderComponent, span: 'col-span-2' },
      { component: PlaceholderComponent, span: 'col-span-2' },
    ]
  },
  [DefaultRoles.ADMIN]: {
    type: 'focused',
    components: [
      { component: PlaceholderComponent, span: 'col-span-3' },
      { component: PlaceholderComponent, span: 'col-span-1' },
    ]
  },
  [DefaultRoles.PROGRAM_COORDINATOR]: {
    type: 'simple',
    components: [
      { component: PlaceholderComponent, span: 'col-span-4' },
    ]
  },
  [DefaultRoles.TEACHER]: {
    type: 'focused',
    components: [
      { component: PlaceholderComponent, span: 'col-span-3' },
      { component: PlaceholderComponent, span: 'col-span-1' },
    ]
  },
  [DefaultRoles.STUDENT]: {
    type: 'simple',
    components: [
      { component: PlaceholderComponent, span: 'col-span-4' },
    ]
  },
  [DefaultRoles.PARENT]: {
    type: 'simple',
    components: [
      { component: PlaceholderComponent, span: 'col-span-4' },
    ]
  },
};