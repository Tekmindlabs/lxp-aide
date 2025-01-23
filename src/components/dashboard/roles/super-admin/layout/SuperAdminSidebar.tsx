'use client';

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { 
  LuLayoutDashboard, 
  LuCalendar, 
  LuGraduationCap, 
  LuUsers, 
  LuSettings, 
  LuBookOpen, 
  LuClock, 
  LuHouse, 
  LuMessageSquare, 
  LuBell,
  LuUserCog,
  LuActivity 
} from "react-icons/lu";
import { type FC } from "react";

interface MenuItem {
  title: string;
  href: string;
  icon: FC<{ className?: string }>;
}

const menuItems: MenuItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard/super_admin",
    icon: LuLayoutDashboard,
  },
  {
    title: "Programs",
    href: "/dashboard/super_admin/program",
    icon: LuGraduationCap,
  },
  {
    title: "Academic Calendar",
    href: "/dashboard/super_admin/academic-calendar",
    icon: LuCalendar,
  },
  {
    title: "Class Groups",
    href: "/dashboard/super_admin/class-group",
    icon: LuUsers,
  },
  {
    title: "Classes",
    href: "/dashboard/super_admin/class",
    icon: LuBookOpen,
  },
  {
    title: "Teachers",
    href: "/dashboard/super_admin/teacher",
    icon: LuUsers,
  },
  {
    title: "Students",
    href: "/dashboard/super_admin/student",
    icon: LuUsers,
  },
  {
    title: "Subjects",
    href: "/dashboard/super_admin/subject",
    icon: LuBookOpen,
  },
  {
    title: "Timetables",
    href: "/dashboard/super_admin/timetable",
    icon: LuClock,
  },
  {
    title: "Classrooms",
    href: "/dashboard/super_admin/classroom",
    icon: LuHouse,
  },
  {
    title: "Users",
    href: "/dashboard/super_admin/users",
    icon: LuUsers,
  },
  {
    title: "Coordinator Management",
    href: "/dashboard/super_admin/coordinator",
    icon: LuUserCog,
  },
  {
    title: "Class Activities",
    href: "/dashboard/super_admin/class-activities",
    icon: LuActivity,
  },
  {
    title: "Messages",
    href: "/dashboard/super_admin/messaging",
    icon: LuMessageSquare,
  },
  {
    title: "Notifications",
    href: "/dashboard/super_admin/notification",
    icon: LuBell,
  },
  {
    title: "Settings",
    href: "/dashboard/super_admin/settings",
    icon: LuSettings,
  },
];

const SuperAdminSidebar: FC = () => {
  const pathname = usePathname();

  return (
    <div className="pb-12 min-h-screen">
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
            Administration
          </h2>
          <div className="space-y-1">
            {menuItems.map((item) => (
              <Link key={item.href} href={item.href} className="block">
                <Button
                  variant={pathname === item.href ? "secondary" : "ghost"}
                  className={cn("w-full justify-start gap-2", {
                    "bg-secondary": pathname === item.href,
                  })}
                >
                  <item.icon className="h-4 w-4" />
                  {item.title}
                </Button>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminSidebar;