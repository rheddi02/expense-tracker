import type { UserProfile } from "@/utils/adminQueries";
import { Trash2 } from "lucide-react";

interface DataTableProps {
  users: UserProfile[];
  onStatusChange: (userId: string, status: "pending" | "allowed" | "blocked") => void;
  isLoading?: boolean;
}

const badgeColors: Record<string, { bg: string; text: string }> = {
  pending: { bg: "bg-yellow-100", text: "text-yellow-800" },
  allowed: { bg: "bg-green-100", text: "text-green-800" },
  blocked: { bg: "bg-red-100", text: "text-red-800" },
};

const roleColors: Record<string, { bg: string; text: string }> = {
  admin: { bg: "bg-purple-100", text: "text-purple-800" },
  user: { bg: "bg-blue-100", text: "text-blue-800" },
};

export const DataTable = ({ users, onStatusChange, isLoading }: DataTableProps) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No users found</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Name</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Email</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Role</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
              <td className="px-6 py-4 text-sm text-gray-900">{user.full_name || "N/A"}</td>
              <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
              <td className="px-6 py-4 text-sm">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleColors[user.role].bg} ${roleColors[user.role].text}`}
                >
                  {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                </span>
              </td>
              <td className="px-6 py-4 text-sm">
                <select
                  value={user.status}
                  onChange={(e) =>
                    onStatusChange(
                      user.id,
                      e.target.value as "pending" | "allowed" | "blocked"
                    )
                  }
                  className={`px-3 py-1 rounded-full text-xs font-medium cursor-pointer border-0 transition ${badgeColors[user.status].bg} ${badgeColors[user.status].text}`}
                >
                  <option value="pending">Pending</option>
                  <option value="allowed">Allowed</option>
                  <option value="blocked">Blocked</option>
                </select>
              </td>
              <td className="px-6 py-4 text-sm">
                <button
                  className="text-red-600 hover:text-red-800 transition"
                  title="Delete user"
                >
                  <Trash2 size={16} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
