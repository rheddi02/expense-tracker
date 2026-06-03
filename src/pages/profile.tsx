import { cn } from "@/lib/utils";
import { Cloud, CloudOff, LogOut, RefreshCw, User } from "lucide-react";
import { useEffect, useState } from "react";
import { getUserPrefs, setUserPref } from "@/utils/userPrefs";
import { getProfile } from "@/utils/profile-helper";
import type { AuthUser } from "@/auth/authService";

type Props = {
  user: AuthUser | null;
  onSync: () => void;
  onLoginForSync: () => void;
  onClearData: () => void;
  onLogout: () => void;
  hasUnsettledDebts: boolean;
};

type CachedProfile = {
  name?: string;
  email?: string;
  avatar?: string;
  role?: string;
  status?: string;
};

function readCachedProfile(): CachedProfile | null {
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

export default function ProfilePage({ user, onSync, onLoginForSync, onClearData, onLogout, hasUnsettledDebts }: Props) {
  const [profile, setProfile] = useState<CachedProfile | null>(readCachedProfile);
  const [isSyncing, setIsSyncing] = useState(false);
  const [debtTransactions, setDebtTransactions] = useState(() => getUserPrefs().debtTransactions);

  const statusColors = () => {
    switch (profile?.status) {
      case "approved":
        return "bg-green-100 text-green-700";
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        const p = await getProfile();
        if (!p) return;
        setProfile({
          name: p.full_name,
          email: p.email,
          avatar: p.avatar_url,
          role: p.role,
          status: p.status,
        });
      } catch {
        // keep cached profile
      }
    };
    load();
  }, [user]);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await onSync();
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-6 text-left">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Account</p>
        <h1 className="text-2xl font-semibold text-slate-900!">Profile</h1>
      </header>

      <div className="space-y-4">
        {/* CLOUD SYNC CARD */}
        {user ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-slate-100">
                {profile?.avatar ? (
                  <img src={profile.avatar} className="h-full w-full object-cover" />
                ) : (
                  <User size={20} className="text-slate-600" />
                )}
              </div>
              <div>
                <p className="font-semibold">{profile?.name || user.email}</p>
                <p className="text-sm text-slate-500">{profile?.email || user.email}</p>
              </div>
            </div>

            {profile?.status && (
              <p className={cn("inline-flex rounded-full px-3 py-1 text-xs font-semibold", statusColors())}>
                {profile.status === "approved" ? "Account approved" : `Status: ${profile.status}`}
              </p>
            )}

            <div className="flex gap-2 pt-1">
              <button
                onClick={handleSync}
                disabled={isSyncing}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-60"
              >
                <RefreshCw size={15} className={isSyncing ? "animate-spin" : ""} />
                {isSyncing ? "Syncing…" : "Sync Now"}
              </button>
              <button
                onClick={onLogout}
                className="flex items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-100"
              >
                <LogOut size={15} />
                Logout
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
                <CloudOff size={20} className="text-slate-400" />
              </div>
              <div>
                <p className="font-semibold">Offline Mode</p>
                <p className="text-sm text-slate-500">Data saved on this device only</p>
              </div>
            </div>
            <button
              onClick={onLoginForSync}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
            >
              <Cloud size={15} />
              Login to sync with cloud
            </button>
          </div>
        )}

        {/* SETTINGS */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6">
          <h2 className="mb-4 text-sm font-semibold text-slate-900!">Settings</h2>
          <label className={`flex items-start justify-between gap-4 ${hasUnsettledDebts ? "cursor-not-allowed" : "cursor-pointer"}`}>
            <div>
              <p className={`text-sm font-medium ${hasUnsettledDebts ? "text-slate-400" : "text-slate-800"}`}>
                Record debt events in transactions
              </p>
              <p className="text-xs text-slate-500 mt-0.5">Automatically logs debt adds, offsets, and settlements as income/expense</p>
              {hasUnsettledDebts && (
                <p className="text-xs text-amber-600 mt-1">Settle all debts before changing this setting</p>
              )}
            </div>
            <div className={`relative shrink-0 mt-0.5 ${hasUnsettledDebts ? "opacity-40" : ""}`}>
              <input
                type="checkbox"
                className="sr-only peer"
                checked={debtTransactions}
                disabled={hasUnsettledDebts}
                onChange={(e) => {
                  setDebtTransactions(e.target.checked);
                  setUserPref("debtTransactions", e.target.checked);
                }}
              />
              <div className="w-10 h-6 rounded-full bg-slate-200 peer-checked:bg-slate-900 transition-colors" />
              <div className="absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform peer-checked:translate-x-4" />
            </div>
          </label>
        </div>

        {/* ABOUT */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6">
          <h2 className="mb-4 text-sm font-semibold text-slate-900!">About</h2>
          <div className="space-y-2 text-sm text-slate-600">
            <p>Expense Tracking PWA v1.0</p>
            <p>Track income and expenses offline</p>
          </div>
        </div>

        {/* CLEAR DATA */}
        <button
          onClick={onClearData}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm font-semibold text-orange-600 hover:bg-orange-100"
        >
          <LogOut size={16} />
          Clear Data
        </button>
      </div>
    </div>
  );
}
