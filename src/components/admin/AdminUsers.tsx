import { useState, useEffect } from "react";
import { toast } from "sonner";
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
  })()
  }, []);

  const handleStatusChange = async (
    userId: string,
    status: "pending" | "approved" | "blocked"
  ) => {
    try {
      const success = await updateUserStatus(userId, status);
      if (success) {
        // Update local state
        setUsers(
          users.map((user) =>
            user.id === userId ? { ...user, status } : user
          )
        );
        toast.success(`User status updated to ${status}`);
      } else {
        toast.error("Failed to update user status");
      }
    } catch (error) {
      console.error("Error updating user status:", error);
      toast.error("An error occurred");
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900!">
            User Management
          </h2>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">
            Manage user accounts, statuses, and permissions
          </p>
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
