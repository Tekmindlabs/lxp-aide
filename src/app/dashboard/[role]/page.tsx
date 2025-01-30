import { Suspense } from 'react';
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/server/auth";
import { DefaultRoles } from "@/utils/permissions";
import { DashboardContent } from "@/components/dashboard/DashboardContent";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Overview } from "@/components/dashboard/coordinator/overview";
import { RecentActivities } from "@/components/dashboard/coordinator/recent-activities";
import { PerformanceMetrics } from "@/components/dashboard/coordinator/performance-metrics";


function CoordinatorDashboardUI() {
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
                <CardTitle className="text-sm font-medium">Total Programs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">12</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Class Groups</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">24</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Teachers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">48</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">2,300</div>
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
          <div className="grid gap-4 grid-cols-1">
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <PerformanceMetrics />
              </CardContent>
            </Card>
          </div>
          <div className="grid gap-4 grid-cols-1">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Attention Required</AlertTitle>
              <AlertDescription>
                There are 3 classes with below-average performance metrics that need attention.
              </AlertDescription>
            </Alert>
          </div>
        </TabsContent>
        <TabsContent value="analytics" className="space-y-4">
          {/* Analytics content will be implemented later */}
        </TabsContent>
        <TabsContent value="reports" className="space-y-4">
          {/* Reports content will be implemented later */}
        </TabsContent>
      </Tabs>
    </div>
    );
  }

  // Remove 'use client' directive - move to top


export default async function RoleDashboard({
  params,
}: {
  params: { role: string };
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/auth/signin');
  }

  const currentRole = params.role.toLowerCase();
  const normalizedRole = params.role.toUpperCase().replace(/-/g, '_');
  const userRoles = session.user.roles.map(r => r.toLowerCase());

  if (!userRoles.includes(currentRole)) {
    redirect(`/dashboard/${session.user.roles[0].toLowerCase()}`);
  }

  return (
    <Suspense fallback={<div>Loading...</div>}>
      {currentRole === 'coordinator' ? (
        <CoordinatorDashboardUI />
      ) : (
        <DashboardContent role={normalizedRole as keyof typeof DefaultRoles} />
      )}
    </Suspense>
  );
}



