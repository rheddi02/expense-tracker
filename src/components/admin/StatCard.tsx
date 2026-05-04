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
    <div className="rounded-lg bg-white p-6 shadow-sm border border-gray-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{label}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
        </div>
        {icon && <div className={`${bgColor} ${textColor} p-3 rounded-lg text-2xl`}>{icon}</div>}
      </div>
    </div>
  );
};
