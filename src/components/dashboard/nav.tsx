"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { Permissions } from "@/utils/permissions";

const navigationItems = {
  'super-admin': [], // Super admin items are now in the sidebar
  'admin': [
    {
      title: "Overview",
      href: "/dashboard/admin",
      permission: null,
    },
    {
      title: "Users",
      href: "/dashboard/admin/users",
      permission: Permissions.USER_READ,
    },
    {
      title: "Roles",
      href: "/dashboard/admin/roles",
      permission: Permissions.ROLE_READ,
    },
    {
      title: "Permissions",
      href: "/dashboard/admin/permissions",
      permission: Permissions.PERMISSION_MANAGE,
    },
    {
      title: "Settings",
      href: "/dashboard/admin/settings",
      permission: Permissions.SETTINGS_MANAGE,
    }
  ],
  'teacher': [
    {
      title: "Overview",
      href: "/dashboard/teacher",
      permission: null,
    },
    {
      title: "Academic Calendar",
      href: "/dashboard/teacher/academic-calendar",
      permission: Permissions.ACADEMIC_CALENDAR_VIEW,
    },
    {
      title: "Programs",
      href: "/dashboard/teacher/program",
      permission: Permissions.PROGRAM_VIEW,
    }
  ]
};

export function DashboardNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = pathname.split('/')[2]; // Get role from URL

  // Don't render nav for super admin
  if (role === 'super-admin') return null;

  const items = navigationItems[role as keyof typeof navigationItems] || [];

  return (
    <nav className="flex items-center space-x-4 lg:space-x-6">
      {items
        .filter(
          (item) =>
            !item.permission ||
            session?.user.permissions.includes(item.permission)
        )
        .map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "text-sm font-medium transition-colors hover:text-primary",
              pathname === item.href
                ? "text-primary"
                : "text-muted-foreground"
            )}
          >
            {item.title}
          </Link>
        ))}
    </nav>
  );
}