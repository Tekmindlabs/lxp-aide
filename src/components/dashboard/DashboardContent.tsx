'use client';

import { useSession } from "next-auth/react";
import { DefaultRoles } from "@/utils/permissions";
import { DashboardFeature } from "@/types/dashboard";
import { DashboardLayout } from "./layouts/DashboardLayout";
import { RoleLayouts } from "./layouts/RoleLayouts";
import { DashboardFeatures } from "./features/DashboardFeatures";

export const DashboardContent = ({ role }: { role: keyof typeof DefaultRoles }) => {
  const { data: session } = useSession();
  // Convert the role to uppercase to match the RoleLayouts keys
  const normalizedRole = role.toUpperCase() as keyof typeof DefaultRoles;
  const layout = RoleLayouts[normalizedRole];
  const features = DashboardFeatures[normalizedRole];

  if (!layout || !features) {
    console.error(`No layout or features configuration found for role: ${normalizedRole}`);
    return <div>Dashboard configuration not found for this role.</div>;
  }

  // Filter components based on features
  const allowedComponents = layout.components.filter(component => {
    const componentFeature = (component.component.displayName?.toLowerCase() ?? '') as DashboardFeature;
    return features.includes(componentFeature);
  });

  // Convert role string to title case with spaces
  const roleTitle = normalizedRole
    .toLowerCase()
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">
        {roleTitle} Dashboard
      </h1>
      <DashboardLayout 
        components={allowedComponents}
        className={layout.type === 'complex' ? 'gap-6' : 'gap-4'}
      />
    </div>
  );
};