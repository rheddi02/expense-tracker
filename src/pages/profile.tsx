import { cn } from "@/lib/utils";
import { getProfile } from "@/utils/profile-helper";
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
  role?: string;
  status?: string;
};

function readCachedProfile(): UserData | null {
  try {
    const raw = localStorage.getItem("cached_profile");
    if (!raw) return null;
    const p = JSON.parse(raw);
    return {
      name: p.full_name,
      email: p.email,
      avatar: p.avatar_url,
      role: p.role,
      status: p.status,
    };
  } catch {
    return null;
  }
}

export default function ProfilePage({ onClearData, onLogout }: Props) {
  const [user, setUser] = useState<UserData | null>(readCachedProfile);

  const statusColors = () => {
    switch (user?.status) {
      case "approved":
        return "bg-green-100 text-green-700";
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  }
  useEffect(() => {
    const load = async () => {
      try {
        const profile = await getProfile();
        if (!profile) return;

        setUser({
          name: profile.full_name,
          email: profile.email,
          avatar: profile.avatar_url,
          role: profile.role,
          status: profile.status,
        });
      } catch (error) {
        console.warn("Unable to load profile status", error);
      }
    };

    load();
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
              {user?.status && (
                <p className={cn("mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold", statusColors())}>
                  {user.status === "approved"
                    ? "Account approved"
                    : `Status: ${user.status}`}
                </p>
              )}
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
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm font-semibold text-orange-600 hover:bg-orange-100"
        >
          <LogOut size={16} />
          Clear Data
        </button>

        <button
          onClick={onLogout}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-100"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </div>
  );
}