"use client";

import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEffect, useState } from "react";

export default function ProfilePage() {
  const { data: session } = useSession();
  const [groupedPermissions, setGroupedPermissions] = useState<Record<string, string[]>>({});

  useEffect(() => {
    if (session?.user?.permissions) {
      const grouped = session.user.permissions.reduce((acc, permission) => {
        const [category] = permission.split(':');
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push(permission);
        return acc;
      }, {} as Record<string, string[]>);
      setGroupedPermissions(grouped);

      console.log('Profile Permissions:', {
        total: session.user.permissions.length,
        categories: Object.keys(grouped),
        permissions: session.user.permissions
      });
    }
  }, [session?.user?.permissions]);

  if (!session?.user) {
    return null;
  }

  return (
    <div className="container max-w-4xl py-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>
            View your account information and permissions.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input value={session.user.name || ""} disabled />
            </div>
            <div>
              <Label>Email</Label>
              <Input value={session.user.email || ""} disabled />
            </div>
          </div>

          <div>
            <Label>Roles</Label>
            <div className="flex gap-2 mt-2">
              {session.user.roles?.map((role) => (
                <Badge key={role} variant="secondary" className="capitalize">
                  {role.replace('_', ' ')}
                </Badge>
              )) || <span className="text-muted-foreground">No roles assigned</span>}
            </div>
          </div>

          <div>
            <Label>Permissions ({session.user.permissions?.length || 0})</Label>
            <ScrollArea className="h-[200px] mt-2 rounded-md border p-4">
              {Object.entries(groupedPermissions).map(([category, permissions]) => (
                <div key={category} className="mb-4 last:mb-0">
                  <h4 className="text-sm font-semibold mb-2 capitalize">{category.replace('-', ' ')}</h4>
                  <div className="flex flex-wrap gap-2">
                    {permissions.map((permission) => (
                      <Badge key={permission} variant="outline">
                        {permission.split(':')[1]?.replace('-', ' ')}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
              {Object.keys(groupedPermissions).length === 0 && (
                <div className="text-muted-foreground">No permissions assigned</div>
              )}
            </ScrollArea>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}