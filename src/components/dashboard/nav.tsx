"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { Permissions } from "@/utils/permissions";

const navigationItems = {
  'SUPER_ADMIN': [], // Super admin items are now in the sidebar
  'ADMIN': [
    {
      title: "Overview",
      href: "/dashboard/ADMIN",
      permission: null,
    },
    {
      title: "Users",
      href: "/dashboard/ADMIN/users",
      permission: Permissions.USER_READ,
    },
    {
      title: "Roles",
      href: "/dashboard/ADMIN/roles",
      permission: Permissions.ROLE_READ,
    },
    {
      title: "Permissions",
      href: "/dashboard/ADMIN/permissions",
      permission: Permissions.PERMISSION_MANAGE,
    },
    {
      title: "Settings",
      href: "/dashboard/ADMIN/settings",
      permission: Permissions.SETTINGS_MANAGE,
    },
    {
      title: "Coordinator",
      href: "/dashboard/ADMIN/coordinator",
      permission: Permissions.ROLE_READ,
    }
  ],
  'TEACHER': [
    {
      title: "Overview",
      href: "/dashboard/TEACHER",
      permission: null,
    },
    {
      title: "Academic Calendar",
      href: "/dashboard/TEACHER/academic-calendar",
      permission: Permissions.ACADEMIC_CALENDAR_VIEW,
    },
    {
      title: "Programs",
      href: "/dashboard/TEACHER/program",
      permission: Permissions.PROGRAM_VIEW,
    }
  ]
};

export function DashboardNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  
  // Get role from URL and normalize to uppercase with underscores
  const role = pathname.split('/')[2]
    ?.toUpperCase()
    ?.replace(/-/g, '_');

  // Don't render nav for super admin
  if (role === 'SUPER_ADMIN') return null;

  // Type-safe way to check if the role exists in navigationItems
  const items = navigationItems[role as keyof typeof navigationItems] || [];

  // Log for debugging
  console.log({
    currentPath: pathname,
    extractedRole: role,
    availableItems: items,
    userPermissions: session?.user?.permissions
  });

  return (
    <nav className="flex items-center space-x-4 lg:space-x-6">
      {items
        .filter(
          (item) =>
            !item.permission ||
            session?.user?.permissions?.includes(item.permission)
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
