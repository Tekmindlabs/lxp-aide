'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Overview } from "@/components/dashboard/coordinator/overview";
import { RecentActivities } from "@/components/dashboard/coordinator/recent-activities";
import { PerformanceMetrics } from "@/components/dashboard/coordinator/performance-metrics";

export function CoordinatorDashboardUI() {
	return (
		<div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
			<div className="flex items-center justify-between space-y-2">
				<h2 className="text-3xl font-bold tracking-tight">Program Coordinator Dashboard</h2>
			</div>
			<Tabs defaultValue="overview" className="space-y-4">
				<TabsList>
					<TabsTrigger value="overview">Overview</TabsTrigger>
					<TabsTrigger value="analytics">Analytics</TabsTrigger>
					<TabsTrigger value="reports">Reports</TabsTrigger>
				</TabsList>
				<TabsContent value="overview" className="space-y-4">
					<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
						<Card>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium">
									Total Programs
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold">15</div>
							</CardContent>
						</Card>
						<Card>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium">
									Active Learners
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold">250</div>
							</CardContent>
						</Card>
						<Card>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium">
									Completion Rate
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold">85%</div>
							</CardContent>
						</Card>
						<Card>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium">Active Tasks</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold">24</div>
							</CardContent>
						</Card>
					</div>
					<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
						<Card className="col-span-4">
							<CardHeader>
								<CardTitle>Overview</CardTitle>
							</CardHeader>
							<CardContent className="pl-2">
								<Overview />
							</CardContent>
						</Card>
						<Card className="col-span-3">
							<CardHeader>
								<CardTitle>Recent Activities</CardTitle>
							</CardHeader>
							<CardContent>
								<RecentActivities />
							</CardContent>
						</Card>
					</div>
				</TabsContent>
				<TabsContent value="analytics" className="space-y-4">
					<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
						<Card className="col-span-4">
							<CardHeader>
								<CardTitle>Performance Metrics</CardTitle>
							</CardHeader>
							<CardContent className="pl-2">
								<PerformanceMetrics />
							</CardContent>
						</Card>
						<Card className="col-span-3">
							<CardHeader>
								<CardTitle>Alerts</CardTitle>
							</CardHeader>
							<CardContent>
								<Alert variant="destructive">
									<AlertCircle className="h-4 w-4" />
									<AlertTitle>Error</AlertTitle>
									<AlertDescription>
										3 programs have low engagement rates.
									</AlertDescription>
								</Alert>
							</CardContent>
						</Card>
					</div>
				</TabsContent>
				<TabsContent value="reports">
					{/* Reports content will be implemented later */}
				</TabsContent>
			</Tabs>
		</div>
	);
}