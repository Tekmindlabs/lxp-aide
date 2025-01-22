import { redirect } from "next/navigation";
import { getServerAuthSession } from "@/server/auth";
import { SidebarNav } from "@/components/dashboard/sidebar-nav";

const coordinatorNavItems = [
	{
		title: "Overview",
		href: "/dashboard/coordinator",
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

	const userRoles = session.user.roles.map((role) => role.toLowerCase());
	if (!userRoles.includes(params.role.toLowerCase())) {
		redirect(`/dashboard/${session.user.roles[0]}`);
	}

	// Use coordinator nav items for coordinator role
	const navItems = params.role.toLowerCase() === 'coordinator' ? coordinatorNavItems : [];

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