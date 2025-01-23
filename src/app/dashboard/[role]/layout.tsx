import { redirect } from "next/navigation";
import { getServerAuthSession } from "@/server/auth";
import { SidebarNav } from "@/components/dashboard/sidebar-nav";

const superAdminNavItems = [
	{
		title: "Overview",
		href: "/dashboard/super_admin",
	},
	{
		title: "Academic Calendar",
		href: "/dashboard/super_admin/academic-calendar",
	},
	{
		title: "Programs",
		href: "/dashboard/super_admin/program",
	},
	{
		title: "Class Groups",
		href: "/dashboard/super_admin/class-group",
	},
	{
		title: "Classes",
		href: "/dashboard/super_admin/class",
	},
	{
		title: "Teachers",
		href: "/dashboard/super_admin/teacher",
	},
	{
		title: "Students",
		href: "/dashboard/super_admin/student",
	},
	{
		title: "Subjects",
		href: "/dashboard/super_admin/subject",
	},
	{
		title: "Timetables",
		href: "/dashboard/super_admin/timetable",
	},
	{
		title: "Classrooms",
		href: "/dashboard/super_admin/classroom",
	},
	{
		title: "Users",
		href: "/dashboard/super_admin/users",
	},
	{
		title: "Messaging",
		href: "/dashboard/super_admin/messaging",
	},
	{
		title: "Notifications",
		href: "/dashboard/super_admin/notification",
	},
	{
		title: "Settings",
		href: "/dashboard/super_admin/settings",
	},
];

const coordinatorNavItems = [
	{
		title: "Overview",
		href: "/dashboard/coordinator",
	},
	{
		title: "Academic Calendar",
		href: "/dashboard/coordinator/academic-calendar",
	},
	{
		title: "Programs",
		href: "/dashboard/coordinator/program",
	},
	{
		title: "Class Groups",
		href: "/dashboard/coordinator/class",
	},
	{
		title: "Teachers",
		href: "/dashboard/coordinator/teacher",
	},
	{
		title: "Students",
		href: "/dashboard/coordinator/student",
	},
	{
		title: "Activities",
		href: "/dashboard/coordinator/class-activity",
	},
	{
		title: "Timetables",
		href: "/dashboard/coordinator/timetable",
	},
	{
		title: "Messaging",
		href: "/dashboard/coordinator/messaging",
	},
	{
		title: "Notifications",
		href: "/dashboard/coordinator/notification",
	},
];

const teacherNavItems = [
	{
		title: "Overview",
		href: "/dashboard/teacher",
	},
	{
		title: "Academic Calendar",
		href: "/dashboard/teacher/academic-calendar",
	},
	{
		title: "Classes",
		href: "/dashboard/teacher/class",
	},
	{
		title: "Students",
		href: "/dashboard/teacher/student",
	},
	{
		title: "Activities",
		href: "/dashboard/teacher/class-activity",
	},
	{
		title: "Messaging",
		href: "/dashboard/teacher/messaging",
	},
	{
		title: "Notifications",
		href: "/dashboard/teacher/notification",
	},
];

export default async function RoleLayout({
	children,
	params,
}: {
	children: React.ReactNode;
	params: { role: string };
}) {
	const session = await getServerAuthSession();

	if (!session) {
		redirect("/auth/signin");
	}

        // Extract role from params
        const { role } = await params;
        const userRoles = session.user.roles.map((r) => r.toLowerCase());
        const currentRole = role?.toLowerCase() || '';  

	if (!userRoles.includes(currentRole)) {
		redirect(`/dashboard/${session.user.roles[0].toLowerCase()}`);
	}

	// Get nav items based on role
	const getNavItems = (role: string) => {
		switch (role) {
			case 'super_admin':
				return superAdminNavItems;
			case 'coordinator':
				return coordinatorNavItems;
			case 'teacher':
				return teacherNavItems;
			default:
				return [];
		}
	};

	const navItems = getNavItems(currentRole);

	return (
		<div className="space-y-6 p-10 pb-16">
			<div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
				<aside className="lg:w-1/5">
					<SidebarNav items={navItems} />
				</aside>
				<div className="flex-1">{children}</div>
			</div>
		</div>
	);
}
