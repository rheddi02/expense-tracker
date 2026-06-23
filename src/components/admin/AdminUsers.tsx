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
      <div className="rounded-3xl border border-slate-100 bg-white overflow-hidden">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">User Management</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Manage accounts, statuses, and permissions
              </p>
            </div>
            <div className="flex items-center gap-1.5 rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2">
              <Users size={14} className="text-slate-400" />
              <span className="text-xs font-semibold text-slate-600">{users.length}</span>
            </div>
          </div>

          {/* Status summary pills */}
          {!isLoading && users.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                {counts.pending} Pending
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                {counts.approved} Approved
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 border border-rose-100 px-3 py-1 text-xs font-semibold text-rose-700">
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
