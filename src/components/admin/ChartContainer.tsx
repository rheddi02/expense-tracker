import type { ReactNode } from "react";

interface ChartContainerProps {
  title: string;
  children: ReactNode;
  subtitle?: string;
}

export const ChartContainer = ({ title, children, subtitle }: ChartContainerProps) => {
  return (
    <div className="rounded-lg bg-white p-6 shadow-sm border border-gray-200">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
      </div>
      <div className="w-full overflow-x-auto">
        {children}
      </div>
    </div>
  );
};
