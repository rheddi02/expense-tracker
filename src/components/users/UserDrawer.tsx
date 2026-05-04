import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import type { User } from "../admin/AdminUsers";

export function UserDrawer({
  user,
  open,
  onOpenChange,
  onStatusChange,
}: {
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusChange: (
    id: string,
    status: "pending" | "approved" | "blocked"
  ) => void;
}) {
  if (!user) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl p-5">
        <SheetHeader>
          <SheetTitle className="text-primary!">User Profile</SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-6">
          {/* Profile */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center text-lg font-semibold">
              {user.full_name
                ?.split(" ")
                .map((n: string) => n[0])
                .join("")
                .slice(0, 2)}
            </div>

            <div>
              <p className="font-semibold text-base">
                {user.full_name || "N/A"}
              </p>
              <p className="text-sm text-muted-foreground">
                {user.email}
              </p>
            </div>
          </div>

          {/* Info */}
          <div className="space-y-3 text-sm">
            {/* <div>
              <p className="text-muted-foreground">Last Login</p>
              <p>
                {user.last_login
                  ? new Date(user.last_login).toLocaleString()
                  : "Never"}
              </p>
            </div> */}

            <div>
              <p className="text-muted-foreground">Role</p>
              <p className="capitalize">{user.role}</p>
            </div>
          </div>

          {/* Status */}
          {
            user.role !== 'admin' && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Status</p>

            <Select
              value={user.status}
              onValueChange={(value) =>
                onStatusChange(user.id, value as "pending" | "approved" | "blocked")
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="blocked">Blocked</SelectItem>
              </SelectContent>
            </Select>
          </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}