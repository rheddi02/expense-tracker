import type { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: number;
  icon?: ReactNode;
  bgColor?: string;
  textColor?: string;
}

export const StatCard = ({
  label,
  value,
  icon,
  bgColor = "bg-blue-50",
  textColor = "text-blue-600",
}: StatCardProps) => {
  return (
    <div className="rounded-lg bg-white p-4 sm:p-6 shadow-sm border border-gray-200">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="flex-1">
          <p className="text-xs sm:text-sm font-medium text-gray-600 uppercase tracking-wide">{label}</p>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1 sm:mt-2">{value}</p>
        </div>
        {icon && <div className={`${bgColor} ${textColor} p-2 sm:p-3 rounded-lg text-xl sm:text-2xl flex-shrink-0`}>{icon}</div>}
      </div>
    </div>
  );
};
