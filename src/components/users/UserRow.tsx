import type { User } from "../admin/AdminUsers";

export function UserRow({
  user,
  onClick,
}: {
  user: User;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 py-3 px-2 border-b text-left active:bg-muted/50"
    >
      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-sm font-semibold">
        {user.full_name
          ? user.full_name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)
          : "NA"}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex justify-between">
          <div>
            <p className="text-sm font-medium truncate">
              {user.full_name || "N/A"}
            </p>

            <p className="text-xs text-muted-foreground truncate">
              {user.email}
            </p>
          </div>
{/* 
          <div>
            <p className="text-[11px] text-muted-foreground">
              Last login: <br />
              {user.last_login
                ? new Date(user.last_login).toLocaleDateString()
                : "Never"}
            </p>
          </div> */}
        </div>
      </div>
    </button>
  );
}
