import { Cloud, CloudOff, Download, LayoutGrid, LogOut, Mail, RefreshCw, Upload, User, CheckCircle, Clock, Ban } from "lucide-react";
import { useEffect, useState } from "react";
import { getProfile } from "@/utils/profile-helper";
import { getAppSettings } from "@/utils/adminQueries";
import type { AuthUser } from "@/auth/authService";
import CategoryManager from "@/components/CategoryManager";
import type { StoredCategory } from "@/utils/categoryDb";
import ThemeToggle from "@/components/ThemeToggle";
import ContactFormModal from "@/components/ContactFormModal";

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
  const [contactModalOpen, setContactModalOpen] = useState(false);
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
        const appSettings = await getAppSettings();
        setAdminEmail(appSettings?.adminEmail || null);
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
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Account</p>
        <h1 className="text-2xl font-semibold text-foreground">Profile</h1>
      </header>

      <div className="space-y-4">
        {/* ACCOUNT STATUS CARD */}
        {user && profile?.status && (
          <>
            {profile.status === "approved" && (
              <div className="rounded-3xl border border-green-200 dark:border-green-500/20 bg-green-50 dark:bg-green-500/10 p-4 flex items-center gap-3">
                <CheckCircle size={20} className="text-green-600 dark:text-green-400 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-green-800 dark:text-green-400">Account Approved</p>
                  <p className="text-xs text-green-600 dark:text-green-500">Cloud sync is enabled for your account.</p>
                </div>
              </div>
            )}
            {profile.status === "pending" && (
              <div className="rounded-3xl border border-yellow-200 dark:border-yellow-500/20 bg-yellow-50 dark:bg-yellow-500/10 p-4 space-y-2">
                <div className="flex items-center gap-3">
                  <Clock size={20} className="text-yellow-600 dark:text-yellow-400 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-400">Pending Approval</p>
                    <p className="text-xs text-yellow-700 dark:text-yellow-500">Your account is awaiting admin review. Cloud sync is disabled until approved.</p>
                  </div>
                </div>
                <p className="text-xs text-yellow-700 dark:text-yellow-500 pl-8">
                  {adminEmail
                    ? <>To request approval, contact the admin at <a href={`mailto:${adminEmail}`} className="font-semibold underline">{adminEmail}</a>.</>
                    : "Contact your administrator to request account approval."}
                </p>
              </div>
            )}
            {profile.status === "blocked" && (
              <div className="rounded-3xl border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10 p-4 space-y-2">
                <div className="flex items-center gap-3">
                  <Ban size={20} className="text-red-600 dark:text-red-400 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-red-800 dark:text-red-400">Account Blocked</p>
                    <p className="text-xs text-red-700 dark:text-red-500">Your account has been blocked. Cloud sync is unavailable.</p>
                  </div>
                </div>
                <p className="text-xs text-red-700 dark:text-red-500 pl-8">
                  {adminEmail
                    ? <>Contact the admin at <a href={`mailto:${adminEmail}`} className="font-semibold underline">{adminEmail}</a> to appeal.</>
                    : "Contact your administrator to appeal."}
                </p>
              </div>
            )}
          </>
        )}

        {/* CLOUD SYNC CARD */}
        {user ? (
          <div className="rounded-3xl border border-border bg-card p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-muted">
                {profile?.avatar ? (
                  <img src={profile.avatar} className="h-full w-full object-cover" />
                ) : (
                  <User size={20} className="text-muted-foreground" />
                )}
              </div>
              <div>
                <p className="font-semibold text-foreground">{profile?.name || user.email}</p>
                <p className="text-sm text-muted-foreground">{profile?.email || user.email}</p>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              {isApproved ? (
                <div className="flex gap-2">
                  <button
                    onClick={() => setPendingSync("toCloud")}
                    className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-border bg-muted px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-accent"
                  >
                    <Upload size={15} />
                    Sync to Cloud
                  </button>
                  <button
                    onClick={() => setPendingSync("toLocal")}
                    className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-border bg-muted px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-accent"
                  >
                    <Download size={15} />
                    Sync to Local
                  </button>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground text-center py-1">
                  Sync unavailable — account not yet approved
                </p>
              )}
              <button
                onClick={onLogout}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20"
              >
                <LogOut size={15} />
                Logout
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-3xl border border-border bg-card p-6 space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                <CloudOff size={20} className="text-muted-foreground" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Offline Mode</p>
                <p className="text-sm text-muted-foreground">Data saved on this device only</p>
              </div>
            </div>
            <button
              onClick={onLoginForSync}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              <Cloud size={15} />
              Login to sync with cloud
            </button>
          </div>
        )}

        {/* CATEGORIES */}
        <button
          onClick={() => setCategoryManagerOpen(true)}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 text-sm font-semibold text-foreground hover:bg-muted"
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

        {/* APPEARANCE */}
        <div className="rounded-3xl border border-border bg-card p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Appearance</h2>
            <ThemeToggle />
          </div>
        </div>

        {/* ABOUT */}
        <div className="rounded-3xl border border-border bg-card p-6">
          <h2 className="mb-4 text-sm font-semibold text-foreground">About</h2>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>Expense Tracking PWA v1.0</p>
            <p>Track income and expenses offline</p>
          </div>
        </div>

        {/* CONTACT US */}
        <button
          onClick={() => setContactModalOpen(true)}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 text-sm font-semibold text-foreground hover:bg-muted"
        >
          <Mail size={16} />
          Contact Us
        </button>

        <ContactFormModal
          isOpen={contactModalOpen}
          onClose={() => setContactModalOpen(false)}
        />

        {/* CLEAR DATA */}
        <button
          onClick={onClearData}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-orange-200 dark:border-orange-500/20 bg-orange-50 dark:bg-orange-500/10 px-4 py-3 text-sm font-semibold text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-500/20"
        >
          <LogOut size={16} />
          Clear Data
        </button>
      </div>

      {/* SYNC CONFIRMATION MODAL */}
      {pendingSync && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-3xl bg-card p-6 space-y-4 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                {pendingSync === "toCloud" ? (
                  <Upload size={18} className="text-muted-foreground" />
                ) : (
                  <Download size={18} className="text-muted-foreground" />
                )}
              </div>
              <h2 className="font-semibold text-foreground">
                {pendingSync === "toCloud" ? "Sync to Cloud" : "Sync to Local"}
              </h2>
            </div>
            <p className="text-sm text-muted-foreground">
              {pendingSync === "toCloud"
                ? "Your local data will be uploaded to the cloud. This will overwrite any existing cloud data for this account."
                : "Cloud data will be downloaded to this device. Your local unsynced changes may be overwritten."}
            </p>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setPendingSync(null)}
                disabled={isSyncing}
                className="flex flex-1 items-center justify-center rounded-2xl border border-border bg-muted px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-accent disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                onClick={confirmSync}
                disabled={isSyncing}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
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
