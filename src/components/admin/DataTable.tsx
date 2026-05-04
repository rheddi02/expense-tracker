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

const badgeColors: Record<string, { bg: string; text: string }> = {
  pending: { bg: "bg-yellow-100", text: "text-yellow-800" },
  approved: { bg: "bg-green-100", text: "text-green-800" },
  blocked: { bg: "bg-red-100", text: "text-red-800" },
};

const roleColors: Record<string, { bg: string; text: string }> = {
  admin: { bg: "bg-purple-100", text: "text-purple-800" },
  user: { bg: "bg-blue-100", text: "text-blue-800" },
};

export const DataTable = ({
  users,
  onStatusChange,
  isLoading,
}: DataTableProps) => {
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
    <>
      {/* Mobile Card View */}
      <div className="lg:hidden divide-y">
        <UserList users={users} onStatusChange={onStatusChange} />
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                Name
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                Email
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                Role
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                Status
              </th>
              {/* <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                Actions
              </th> */}
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr
                key={user.id}
                className="border-b border-gray-100 hover:bg-gray-50 transition"
              >
                <td className="px-6 py-4 text-sm text-gray-900">
                  {user.full_name || "N/A"}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {user.email}
                </td>
                <td className="px-6 py-4 text-sm">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleColors[user.role].bg} ${roleColors[user.role].text}`}
                  >
                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm">
                  <Select
                    value={user.status}
                    onValueChange={(value) =>
                      onStatusChange(
                        user.id,
                        value as "pending" | "approved" | "blocked",
                      )
                    }
                  >
                    <SelectTrigger
                      className={`w-fit ${badgeColors[user.status].bg} ${badgeColors[user.status].text} border-0 focus:ring-0`}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Allowed</SelectItem>
                      <SelectItem value="blocked">Blocked</SelectItem>
                    </SelectContent>
                  </Select>
                </td>
                {/* <td className="px-6 py-4 text-sm">
                  <Button
                    variant="destructive"
                    size="sm"
                    className="h-8 w-8 p-0"
                    title="Delete user"
                  >
                    <Trash2 size={16} />
                  </Button>
                </td> */}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};
