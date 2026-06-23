import type { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: number;
  icon?: ReactNode;
  bgColor?: string;
  textColor?: string;
  accentColor?: string;
}

export const StatCard = ({
  label,
  value,
  icon,
  bgColor = "bg-blue-50",
  textColor = "text-blue-600",
  accentColor = "bg-blue-500",
}: StatCardProps) => {
  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-5 sm:p-6">
      <div className={`h-1 w-10 rounded-full ${accentColor} mb-5`} />
      <div className="flex items-end justify-between gap-4">
        <div className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">{label}</p>
          <p className="mt-1.5 text-3xl sm:text-4xl font-bold text-slate-900">{value}</p>
        </div>
        {icon && (
          <div className={`${bgColor} ${textColor} p-3 rounded-2xl flex-shrink-0`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};
