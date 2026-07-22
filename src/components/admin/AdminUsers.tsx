import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Users } from "lucide-react";
import { DataTable } from "./DataTable";
import { getAllUsers, updateUserStatus } from "@/utils/adminQueries";

export type User = {
  id: string;
  full_name: string | null;
  email: string;
  status: "pending" | "approved" | "blocked";
  last_login?: string | null;
  role: "admin" | "user";
  created_at?: string | null;
};

export const AdminUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setIsLoading(true);
        const data = await getAllUsers();
        setUsers(data);
      } catch (error) {
        console.error("Error fetching users:", error);
        toast.error("Failed to load users");
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const handleStatusChange = async (
    userId: string,
    status: "pending" | "approved" | "blocked"
  ) => {
    try {
      const success = await updateUserStatus(userId, status);
      if (success) {
        setUsers(users.map((user) => (user.id === userId ? { ...user, status } : user)));
        toast.success(`User status updated to ${status}`);
      } else {
        toast.error("Failed to update user status");
      }
    } catch (error) {
      console.error("Error updating user status:", error);
      toast.error("An error occurred");
    }
  };

  const counts = {
    pending: users.filter((u) => u.status === "pending").length,
    approved: users.filter((u) => u.status === "approved").length,
    blocked: users.filter((u) => u.status === "blocked").length,
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="rounded-3xl border border-border bg-card overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-border">
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-base font-bold text-foreground">User Management</h2>
            <div className="flex items-center gap-1 rounded-xl border border-border bg-muted px-2 py-0.5">
              <Users size={12} className="text-muted-foreground" />
              <span className="text-xs font-semibold text-muted-foreground">{users.length}</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Manage accounts, statuses, and permissions
          </p>

          {/* Status summary pills */}
          {!isLoading && users.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 px-3 py-1 text-xs font-semibold text-amber-700 dark:text-amber-400">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                {counts.pending} Pending
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                {counts.approved} Approved
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 px-3 py-1 text-xs font-semibold text-rose-700 dark:text-rose-400">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                {counts.blocked} Blocked
              </span>
            </div>
          )}
        </div>

        <div className="p-4 sm:p-6">
          <DataTable
            users={users}
            onStatusChange={handleStatusChange}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
};
