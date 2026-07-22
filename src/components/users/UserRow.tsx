import type { User } from "../admin/AdminUsers";

const avatarStyles: Record<string, string> = {
  pending: "bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400",
  approved: "bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  blocked: "bg-rose-100 dark:bg-rose-500/15 text-rose-700 dark:text-rose-400",
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
      className="w-full flex items-center gap-3 py-3 px-2 border-b border-border text-left active:bg-muted transition-colors"
    >
      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${avatarStyles[user.status]}`}>
        {initials(user.full_name)}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">
          {user.full_name || "N/A"}
        </p>
        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
      </div>

      <p className="text-xs text-muted-foreground flex-shrink-0">
        {formatJoinDate(user.created_at)}
      </p>
    </button>
  );
}
