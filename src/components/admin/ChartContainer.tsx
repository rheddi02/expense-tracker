import type { ReactNode } from "react";

interface ChartContainerProps {
  title: string;
  children: ReactNode;
  subtitle?: string;
}

export const ChartContainer = ({ title, children, subtitle }: ChartContainerProps) => {
  return (
    <div className="rounded-3xl border border-border bg-card p-5 sm:p-6">
      <div>
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      <div className="border-t border-border mt-4 pt-4 w-full overflow-x-auto">
        {children}
      </div>
    </div>
  );
};
