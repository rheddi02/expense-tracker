import type { ReactNode } from "react";

interface ChartContainerProps {
  title: string;
  children: ReactNode;
  subtitle?: string;
}

export const ChartContainer = ({ title, children, subtitle }: ChartContainerProps) => {
  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-5 sm:p-6">
      <div>
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
      <div className="border-t border-slate-100 mt-4 pt-4 w-full overflow-x-auto">
        {children}
      </div>
    </div>
  );
};
