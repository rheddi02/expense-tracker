import { Cloud, CloudOff, Download, LayoutGrid, LogOut, RefreshCw, Upload, User, CheckCircle, Clock, Ban } from "lucide-react";
import { useEffect, useState } from "react";
import { getProfile } from "@/utils/profile-helper";
import { getAdminContact } from "@/utils/adminQueries";
import type { AuthUser } from "@/auth/authService";
import CategoryManager from "@/components/CategoryManager";
import type { StoredCategory } from "@/utils/categoryDb";

type Props = {
  user: AuthUser | null;
  onSyncToCloud: () => Promise<void>;
  onSyncFromCloud: () => Promise<void>;
  onLoginForSync: () => void;
  onClearData: () => void;
  onLogout: () => void;
  categories: StoredCategory[];
  onAddCategory: (data: { label: string; type: "income" | "expense" }) => Promise<void>;
  onEditCategory: (id: string, label: string) => Promise<void>;
  onDeleteCategory: (id: string) => Promise<void>;
  onReorderCategory: (ids: string[]) => Promise<void>;
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

export default function ProfilePage({ user, onSyncToCloud, onSyncFromCloud, onLoginForSync, onClearData, onLogout, categories, onAddCategory, onEditCategory, onDeleteCategory, onReorderCategory }: Props) {
  const [profile, setProfile] = useState<CachedProfile | null>(readCachedProfile);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingSync, setPendingSync] = useState<"toCloud" | "toLocal" | null>(null);
  const [categoryManagerOpen, setCategoryManagerOpen] = useState(false);
  const [adminEmail, setAdminEmail] = useState<string | null>(null);

  const isApproved = profile?.status === "approved";

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
      try {
        const email = await getAdminContact();
        setAdminEmail(email);
      } catch {
        // non-critical
      }
    };
    load();
  }, [user]);

  const confirmSync = async () => {
    if (!pendingSync) return;
    setIsSyncing(true);
    try {
      if (pendingSync === "toCloud") {
        await onSyncToCloud();
      } else {
        await onSyncFromCloud();
      }
    } finally {
      setIsSyncing(false);
      setPendingSync(null);
    }
  };

  return (
    <div className="space-y-6 text-left">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Account</p>
        <h1 className="text-2xl font-semibold text-slate-900!">Profile</h1>
      </header>

      <div className="space-y-4">
        {/* ACCOUNT STATUS CARD */}
        {user && profile?.status && (
          <>
            {profile.status === "approved" && (
              <div className="rounded-3xl border border-green-200 bg-green-50 p-4 flex items-center gap-3">
                <CheckCircle size={20} className="text-green-600 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-green-800">Account Approved</p>
                  <p className="text-xs text-green-600">Cloud sync is enabled for your account.</p>
                </div>
              </div>
            )}
            {profile.status === "pending" && (
              <div className="rounded-3xl border border-yellow-200 bg-yellow-50 p-4 space-y-2">
                <div className="flex items-center gap-3">
                  <Clock size={20} className="text-yellow-600 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-yellow-800">Pending Approval</p>
                    <p className="text-xs text-yellow-700">Your account is awaiting admin review. Cloud sync is disabled until approved.</p>
                  </div>
                </div>
                <p className="text-xs text-yellow-700 pl-8">
                  {adminEmail
                    ? <>To request approval, contact the admin at <span className="font-semibold">{adminEmail}</span>.</>
                    : "Contact your administrator to request account approval."}
                </p>
              </div>
            )}
            {profile.status === "blocked" && (
              <div className="rounded-3xl border border-red-200 bg-red-50 p-4 space-y-2">
                <div className="flex items-center gap-3">
                  <Ban size={20} className="text-red-600 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-red-800">Account Blocked</p>
                    <p className="text-xs text-red-700">Your account has been blocked. Cloud sync is unavailable.</p>
                  </div>
                </div>
                <p className="text-xs text-red-700 pl-8">
                  {adminEmail
                    ? <>Contact the admin at <span className="font-semibold">{adminEmail}</span> to appeal.</>
                    : "Contact your administrator to appeal."}
                </p>
              </div>
            )}
          </>
        )}

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

            <div className="space-y-2 pt-1">
              {isApproved ? (
                <div className="flex gap-2">
                  <button
                    onClick={() => setPendingSync("toCloud")}
                    className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    <Upload size={15} />
                    Sync to Cloud
                  </button>
                  <button
                    onClick={() => setPendingSync("toLocal")}
                    className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    <Download size={15} />
                    Sync to Local
                  </button>
                </div>
              ) : (
                <p className="text-xs text-slate-400 text-center py-1">
                  Sync unavailable — account not yet approved
                </p>
              )}
              <button
                onClick={onLogout}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-100"
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

        {/* CATEGORIES */}
        <button
          onClick={() => setCategoryManagerOpen(true)}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          <LayoutGrid size={16} />
          Manage Categories
        </button>

        <CategoryManager
          isOpen={categoryManagerOpen}
          onClose={() => setCategoryManagerOpen(false)}
          categories={categories}
          onAdd={onAddCategory}
          onEdit={onEditCategory}
          onDelete={onDeleteCategory}
          onReorder={onReorderCategory}
        />

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

      {/* SYNC CONFIRMATION MODAL */}
      {pendingSync && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 space-y-4 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
                {pendingSync === "toCloud" ? (
                  <Upload size={18} className="text-slate-600" />
                ) : (
                  <Download size={18} className="text-slate-600" />
                )}
              </div>
              <h2 className="font-semibold text-slate-900">
                {pendingSync === "toCloud" ? "Sync to Cloud" : "Sync to Local"}
              </h2>
            </div>
            <p className="text-sm text-slate-500">
              {pendingSync === "toCloud"
                ? "Your local data will be uploaded to the cloud. This will overwrite any existing cloud data for this account."
                : "Cloud data will be downloaded to this device. Your local unsynced changes may be overwritten."}
            </p>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setPendingSync(null)}
                disabled={isSyncing}
                className="flex flex-1 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                onClick={confirmSync}
                disabled={isSyncing}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
              >
                <RefreshCw size={14} className={isSyncing ? "animate-spin" : ""} />
                {isSyncing ? "Syncing…" : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
