import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/server/auth";
import { SidebarNav } from "@/components/dashboard/sidebar-nav";
import { DefaultRoles } from "@/utils/permissions";

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
	{
		title: "Knowledge Base",
		href: "/dashboard/super_admin/knowledge-base",
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
	{
		title: "Knowledge Base",
		href: "/dashboard/coordinator/knowledge-base",
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
	{
		title: "Knowledge Base",
		href: "/dashboard/teacher/knowledge-base",
	},
];

const studentNavItems = [
	{
		title: "Overview",
		href: "/dashboard/student",
	},
	{
		title: "Activities",
		href: "/dashboard/student/class-activity",
	},
	{
		title: "Knowledge Base",
		href: "/dashboard/student/knowledge-base",
	},
];

export default async function RoleLayout({
	children,
	params,
}: {
	children: React.ReactNode;
	params: { role: string };
}) {
	const session = await getServerSession(authOptions);

	if (!session) {
		redirect("/auth/signin");
	}

	// Extract role from params and normalize
	const { role } = params;
	const normalizedRole = role === 'super_admin' ? DefaultRoles.SUPER_ADMIN : role;
	const userRoles = session.user.roles;

	// Debug log for role check
	console.log('Role Layout Check:', {
		paramRole: role,
		normalizedRole,
		userRoles,
		timestamp: new Date().toISOString()
	});

	if (!userRoles.includes(normalizedRole)) {
		const defaultRole = userRoles[0]?.toLowerCase() === DefaultRoles.SUPER_ADMIN.toLowerCase() 
			? 'super_admin' 
			: userRoles[0]?.toLowerCase();
		redirect(`/dashboard/${defaultRole}`);
	}

	// Get nav items based on normalized role
	const getNavItems = (role: string) => {
		switch (role.toLowerCase()) {
			case DefaultRoles.SUPER_ADMIN.toLowerCase():
				return superAdminNavItems;
			case DefaultRoles.PROGRAM_COORDINATOR.toLowerCase():
				return coordinatorNavItems;
			case DefaultRoles.TEACHER.toLowerCase():
				return teacherNavItems;
			case DefaultRoles.STUDENT.toLowerCase():
				return studentNavItems;
			default:
				return [];
		}
	};

	const navItems = getNavItems(normalizedRole);

	return (
		<div className="container">
			<div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0 pt-6">
				<aside className="lg:w-1/5">
					<SidebarNav items={navItems} />
				</aside>
				<div className="flex-1">{children}</div>
			</div>
		</div>
	);
}
