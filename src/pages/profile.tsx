import { getSession } from "@/auth/authService";
import { User, LogOut } from "lucide-react";
import { useEffect, useState } from "react";

type Props = {
  onClearData: () => void;
  onLogout: () => void;
};

type UserData = {
  name?: string;
  email?: string;
  avatar?: string;
};

export default function ProfilePage({ onClearData, onLogout }: Props) {
  const [user, setUser] = useState<UserData | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      const session = await getSession();

      if (!session?.user) return;

      const u = session.user;

      const userData = {
        name:
          u.user_metadata?.full_name ||
          u.user_metadata?.name ||
          "User",
        email: u.email,
        avatar: u.user_metadata?.avatar_url,
      };

      setUser(userData);

      // ✅ cache for offline
      localStorage.setItem("user", JSON.stringify(userData));
    };

    // fallback if offline
    const cached = localStorage.getItem("user");
    if (cached) {
      setUser(JSON.parse(cached));
    }

    loadUser();
  }, []);

  return (
    <div className="space-y-6 text-left">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
          Account
        </p>
        <h1 className="text-2xl font-semibold text-slate-900!">
          Profile
        </h1>
      </header>

      <div className="space-y-4">
        {/* USER CARD */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-slate-100">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  className="h-full w-full object-cover"
                />
              ) : (
                <User size={24} className="text-slate-600" />
              )}
            </div>

            <div>
              <p className="font-semibold">
                {user?.name || "Guest User"}
              </p>
              <p className="text-sm text-slate-500">
                {user?.email || "No account linked"}
              </p>
            </div>
          </div>
        </div>

{/* SETTINGS */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6">
          <h2 className="mb-4 text-sm font-semibold text-slate-900!">
            Settings
          </h2>
          <div className="space-y-3">
            <label className="flex items-center gap-3">
              <input type="checkbox" defaultChecked className="h-4 w-4 rounded" />
              <span className="text-sm">Push notifications</span>
            </label>
            <label className="flex items-center gap-3">
              <input type="checkbox" defaultChecked className="h-4 w-4 rounded" />
              <span className="text-sm">Offline mode</span>
            </label>
          </div>
        </div>

        {/* ABOUT */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6">
          <h2 className="mb-4 text-sm font-semibold text-slate-900!">
            About
          </h2>
          <div className="space-y-2 text-sm text-slate-600">
            <p>Expense Tracking PWA v1.0</p>
            <p>Track income and expenses offline</p>
          </div>
        </div>
        
        {/* ACTIONS */}
        <button
          onClick={onClearData}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600 hover:bg-rose-100"
        >
          <LogOut size={16} />
          Clear Data
        </button>

        <button
          onClick={onLogout}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600 hover:bg-rose-100"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </div>
  );
}