import { DashboardComponent } from "@/types/dashboard";

interface DashboardLayoutProps {
  components: DashboardComponent[];
  className?: string;
}

export const DashboardLayout = ({ components, className }: DashboardLayoutProps) => {
  return (
    <div className={`grid grid-cols-4 gap-4 ${className}`}>
      {components.map((item, index) => (
        <div key={index} className={item.span}>
          <item.component {...item.props} />
        </div>
      ))}
    </div>
  );
};