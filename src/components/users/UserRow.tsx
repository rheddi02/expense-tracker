import type { User } from "../admin/AdminUsers";

const avatarStyles: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  approved: "bg-emerald-100 text-emerald-700",
  blocked: "bg-rose-100 text-rose-700",
};

function initials(name: string | null) {
  if (!name) return "NA";
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

function formatJoinDate(date: string | null | undefined) {
  if (!date) return "Unknown";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function UserRow({ user, onClick }: { user: User; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 py-3 px-2 border-b border-slate-100 text-left active:bg-slate-50 transition-colors"
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

      <p className="text-xs text-slate-400 flex-shrink-0">
        {formatJoinDate(user.created_at)}
      </p>
    </button>
  );
}
