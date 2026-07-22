import { useState, useEffect } from "react";
import { toast } from "sonner";
import { getAllUsers, updateUserStatus } from "@/utils/adminQueries";
import type { UserProfile } from "@/utils/adminQueries";
import { CheckCircle, Clock, User } from "lucide-react";

export const AdminContact = () => {
  const [pendingUsers, setPendingUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const load = async () => {
    try {
      setIsLoading(true);
      const all = await getAllUsers();
      setPendingUsers(all.filter((u) => u.status === "pending"));
    } catch {
      toast.error("Failed to load pending requests");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleApprove = async (userId: string) => {
    setApprovingId(userId);
    try {
      const success = await updateUserStatus(userId, "approved");
      if (success) {
        setPendingUsers((prev) => prev.filter((u) => u.id !== userId));
        toast.success("User approved");
      } else {
        toast.error("Failed to approve user");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setApprovingId(null);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="bg-card rounded-lg shadow-sm border border-border">
        <div className="p-4 sm:p-6 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Pending Approval Requests</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Users awaiting account approval for cloud sync access.
          </p>
        </div>

        <div className="p-4 sm:p-6">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : pendingUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CheckCircle className="text-green-500 mb-3" size={40} />
              <p className="font-medium text-foreground">No pending requests</p>
              <p className="text-sm text-muted-foreground mt-1">All users have been reviewed.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg border border-yellow-200 dark:border-yellow-500/20 bg-yellow-50 dark:bg-yellow-500/10"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-500/20 shrink-0">
                      <User size={18} className="text-yellow-700 dark:text-yellow-400" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        {user.full_name || "—"}
                      </p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                        <Clock size={11} />
                        Joined {new Date(user.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleApprove(user.id)}
                    disabled={approvingId === user.id}
                    className="shrink-0 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed transition"
                  >
                    {approvingId === user.id ? "Approving…" : "Approve"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
