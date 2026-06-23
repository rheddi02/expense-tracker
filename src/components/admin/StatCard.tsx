import type { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: number;
  icon?: ReactNode;
  bgColor?: string;
  textColor?: string;
  accentColor?: string;
  detail?: string;
}

export const StatCard = ({
  label,
  value,
  icon,
  bgColor = "bg-blue-50",
  textColor = "text-blue-600",
  accentColor = "bg-blue-500",
  detail,
}: StatCardProps) => {
  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-4">
      <div className={`h-1 w-8 rounded-full ${accentColor} mb-4`} />
      <div className="flex items-end justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 truncate">{label}</p>
          <p className="mt-1 text-3xl font-bold text-slate-900">{value}</p>
          {detail && <p className="text-xs text-slate-400 mt-1">{detail}</p>}
        </div>
        {icon && (
          <div className={`${bgColor} ${textColor} p-2.5 rounded-2xl flex-shrink-0`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};
