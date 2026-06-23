import type { User } from "../admin/AdminUsers";
import { statusStyles } from "../admin/DataTable";

const avatarStyles: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  approved: "bg-emerald-100 text-emerald-700",
  blocked: "bg-rose-100 text-rose-700",
};

function initials(name: string | null) {
  if (!name) return "NA";
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

export function UserRow({ user, onClick }: { user: User; onClick: () => void }) {
  const s = statusStyles[user.status];

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 py-3 px-2 border-b border-slate-100 border-l-4 ${s.accent} text-left active:bg-slate-50 transition-colors`}
    >
      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${avatarStyles[user.status]}`}>
        {initials(user.full_name)}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-900 truncate">
          {user.full_name || "N/A"}
        </p>
        <p className="text-xs text-slate-400 truncate">{user.email}</p>
      </div>

      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold flex-shrink-0 ${s.bg} ${s.text} border ${s.border}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
        {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
      </span>
    </button>
  );
}
