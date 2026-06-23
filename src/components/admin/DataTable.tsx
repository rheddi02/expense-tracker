import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { User } from "./AdminUsers";
import { UserList } from "../users/UserList";

interface DataTableProps {
  users: User[];
  onStatusChange: (
    userId: string,
    status: "pending" | "approved" | "blocked",
  ) => void;
  isLoading?: boolean;
}

export const statusStyles: Record<string, { bg: string; text: string; dot: string; border: string; accent: string }> = {
  pending: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    dot: "bg-amber-400",
    border: "border-amber-100",
    accent: "border-l-amber-400",
  },
  approved: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
    border: "border-emerald-100",
    accent: "border-l-emerald-500",
  },
  blocked: {
    bg: "bg-rose-50",
    text: "text-rose-700",
    dot: "bg-rose-500",
    border: "border-rose-100",
    accent: "border-l-rose-500",
  },
};

const avatarStyles: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  approved: "bg-emerald-100 text-emerald-700",
  blocked: "bg-rose-100 text-rose-700",
};

const roleStyles: Record<string, { bg: string; text: string }> = {
  admin: { bg: "bg-violet-50", text: "text-violet-700" },
  user: { bg: "bg-blue-50", text: "text-blue-700" },
};

function initials(name: string | null) {
  if (!name) return "NA";
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

export const DataTable = ({
  users,
  onStatusChange,
  isLoading,
}: DataTableProps) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-slate-200 border-t-blue-600" />
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-slate-400">No users found</p>
      </div>
    );
  }

  return (
    <>
      {/* Mobile Card View */}
      <div className="lg:hidden">
        <UserList users={users} onStatusChange={onStatusChange} />
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-slate-400">
                User
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-slate-400">
                Email
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-slate-400">
                Role
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-slate-400">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {users.map((user) => {
              const s = statusStyles[user.status];
              const r = roleStyles[user.role];
              return (
                <tr
                  key={user.id}
                  className={`border-l-4 ${s.accent} hover:bg-slate-50 transition-colors`}
                >
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${avatarStyles[user.status]}`}>
                        {initials(user.full_name)}
                      </div>
                      <span className="text-sm font-medium text-slate-900">
                        {user.full_name || "N/A"}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-sm text-slate-500">
                    {user.email}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${r.bg} ${r.text}`}>
                      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <Select
                      value={user.status}
                      onValueChange={(value) =>
                        onStatusChange(user.id, value as "pending" | "approved" | "blocked")
                      }
                    >
                      <SelectTrigger
                        className={`w-fit gap-2 rounded-full border text-xs font-semibold ${s.bg} ${s.text} ${s.border} focus:ring-0 h-7 px-3`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${s.dot}`} />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="blocked">Blocked</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
};
