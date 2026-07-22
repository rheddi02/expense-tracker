import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import type { User } from "../admin/AdminUsers";
import { statusStyles } from "../admin/DataTable";

const avatarStyles: Record<string, string> = {
  pending: "bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400",
  approved: "bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  blocked: "bg-rose-100 dark:bg-rose-500/15 text-rose-700 dark:text-rose-400",
};

const statusLabels: Record<string, string> = {
  pending: "Pending review",
  approved: "Approved — access granted",
  blocked: "Blocked — access denied",
};

function initials(name: string | null | undefined) {
  if (!name) return "NA";
  return name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
}

export function UserDrawer({
  user,
  open,
  onOpenChange,
  onStatusChange,
}: {
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusChange: (id: string, status: "pending" | "approved" | "blocked") => void;
}) {
  if (!user) return null;

  const s = statusStyles[user.status];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl p-5">
        <SheetHeader>
          <SheetTitle className="text-sm font-semibold text-foreground">User Profile</SheetTitle>
        </SheetHeader>

        <div className="mt-5 space-y-5">
          {/* Avatar + Name */}
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold ${avatarStyles[user.status]}`}>
              {initials(user.full_name)}
            </div>
            <div>
              <p className="font-semibold text-base text-foreground">{user.full_name || "N/A"}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>

          {/* Status banner */}
          <div className={`flex items-center gap-3 rounded-2xl border px-4 py-3 ${s.bg} ${s.border}`}>
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${s.dot}`} />
            <div>
              <p className={`text-xs font-bold uppercase tracking-widest ${s.text}`}>{user.status}</p>
              <p className={`text-xs mt-0.5 ${s.text} opacity-75`}>{statusLabels[user.status]}</p>
            </div>
          </div>

          {/* Info */}
          <div className="rounded-2xl border border-border bg-muted divide-y divide-border">
            <div className="flex items-center justify-between px-4 py-3">
              <p className="text-xs text-muted-foreground font-medium">Role</p>
              <p className="text-xs font-semibold text-foreground capitalize">{user.role}</p>
            </div>
          </div>

          {/* Change status */}
          {user.role !== "admin" && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Change Status</p>
              <Select
                value={user.status}
                onValueChange={(value) =>
                  onStatusChange(user.id, value as "pending" | "approved" | "blocked")
                }
              >
                <SelectTrigger className="w-full rounded-2xl border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="p-2">
                  <SelectItem className="py-4 rounded-xl" value="pending">Pending</SelectItem>
                  <SelectItem className="py-4 rounded-xl" value="approved">Approved</SelectItem>
                  <SelectItem className="py-4 rounded-xl" value="blocked">Blocked</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
