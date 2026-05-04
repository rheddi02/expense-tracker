import { useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { User } from "../admin/AdminUsers";
import { UserRow } from "./UserRow";
import { UserDrawer } from "./UserDrawer";

type Props = {
  users: User[];
  onStatusChange: (
    userId: string,
    status: "pending" | "approved" | "blocked"
  ) => void;
}
export function UserList({ users, onStatusChange }: Props) {
  const parentRef = useRef<HTMLDivElement>(null);

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [open, setOpen] = useState(false);

  const rowVirtualizer = useVirtualizer({
    count: users.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 72,
    overscan: 5,
  });

  return (
    <>
      <div
        ref={parentRef}
        className="h-[calc(100vh-120px)] overflow-auto"
      >
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            position: "relative",
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const user = users[virtualRow.index];

            return (
              <div
                key={user.id}
                ref={rowVirtualizer.measureElement}
                className="absolute top-0 left-0 w-full"
                style={{
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <UserRow
                  user={user}
                  onClick={() => {
                    setSelectedUser(user);
                    setOpen(true);
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>

      <UserDrawer
        user={selectedUser}
        open={open}
        onOpenChange={setOpen}
        onStatusChange={onStatusChange}
      />
    </>
  );
}