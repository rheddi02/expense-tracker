import { useState, useEffect, useRef } from "react";
import { syncToSupabase } from "./db/syncService";
import { useAuth } from "./hooks/useAuth";
import { useTransactionDateFilter } from "./hooks/useTransactionDateFilter";
import DashboardPage from "./pages/dashboard";
import ExpenseIncomePage from "./pages/expenseIncome";
import ProfilePage from "./pages/profile";
import AdminPage from "./pages/admin";
import TabNavigation from "./components/TabNavigation";
import TransactionFormModal from "./components/TransactionFormModal";
import { PageLoader } from "./components/PageLoader";
import { getAppSettings } from "./utils/adminQueries";
import type {
  StoredTransaction,
  TransactionFormValues,
} from "./utils/transactionSchema";
import { Toaster } from "./components/ui/sonner";
import { toast } from "sonner";
import {
  initDB,
  getTransactions,
  addTransaction,
  updateTransaction,
  deleteTransaction,
  clearDB,
} from "./utils/db";
import { signOut } from "./auth/authService";
import LoginPage from "./pages/login";
import { getProfile } from "./utils/profile-helper";
import { CATEGORY_OPTIONS } from "./lib/constants";


export default function App() {
  const { user, isAuthReady } = useAuth();
  const [userRole, setUserRole] = useState<"admin" | "user" | null>(null);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showLoginPage, setShowLoginPage] = useState(false);
  const previousUserIdRef = useRef<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "transactions" | "profile"
  >("dashboard");
  const [transactions, setTransactions] = useState<StoredTransaction[]>([]);
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [noteSearch, setNoteSearch] = useState("");
  const dateFilter = useTransactionDateFilter(transactions);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<
    StoredTransaction | undefined
  >();

  // Load local data immediately — no auth required
  useEffect(() => {
    const loadLocal = async () => {
      await initDB();
      setTransactions(await getTransactions());
      setIsLoading(false);
    };
    loadLocal();
  }, []);

  useEffect(() => {
    const initSettings = async () => {
      try {
        const appSettings = await getAppSettings();
        if (appSettings) {
          setMaintenanceMode(appSettings.maintenanceMode);
        }
      } catch (error) {
        console.error("Unable to load application settings:", error);
      }
    };

    initSettings();
  }, []);

  // Runs when auth state changes (login / logout / user switch)
  useEffect(() => {
    if (!isAuthReady) return;

    const handleUserChange = async () => {
      // User switch: clear previous user's local data
      if (previousUserIdRef.current && user && previousUserIdRef.current !== user.id) {
        await clearDB(previousUserIdRef.current);
        setTransactions(await getTransactions());
      }

      if (!user) {
        // Logged out — keep local data, just reset role
        setUserRole(null);
        previousUserIdRef.current = null;
        return;
      }

      previousUserIdRef.current = user.id;

      // Load profile
      try {
        const profile = await getProfile();
        if (profile?.role) {
          setUserRole(profile.role as "admin" | "user");
          localStorage.setItem("cached_profile", JSON.stringify(profile));
        } else if (profile) {
          setUserRole("user");
          localStorage.setItem("cached_profile", JSON.stringify(profile));
        } else {
          setUserRole("user");
        }
      } catch {
        setUserRole("user");
      }

      // Sync in background, update UI when done
      const synced = await syncToSupabase();
      if (synced) {
        setTransactions(synced);
      } else {
        setTransactions(await getTransactions());
      }
    };

    handleUserChange();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, isAuthReady]);

  // Auto-dismiss login page when user successfully logs in
  useEffect(() => {
    if (user) {
      setShowLoginPage(false);
    }
  }, [user]);

  useEffect(() => {
    const enforceMaintenanceMode = async () => {
      if (maintenanceMode && user && userRole === "user") {
        await signOut();
        setUserRole(null);
      }
    };

    enforceMaintenanceMode();
  }, [maintenanceMode, user, userRole]);

  if (isLoading) {
    return <PageLoader />;
  }

  // Show login page when triggered from Profile (sync flow)
  if (showLoginPage) {
    return (
      <>
        <Toaster />
        <LoginPage onBack={() => setShowLoginPage(false)} />
      </>
    );
  }

  const handleLogout = () => {
    toast.warning("Are you sure you want to log out?", {
      action: {
        label: "Logout",
        onClick: async () => {
          await signOut();
          setUserRole(null);
        },
      },
      cancel: {
        label: "Cancel",
        onClick: () => {},
      },
    });
  };

  // Show admin dashboard if user is admin
  if (userRole === "admin") {
    return (
      <>
        <Toaster />
        <AdminPage onLogout={handleLogout} />
      </>
    );
  }

  const handleClearData = () => {
    toast.warning("Clear all saved transaction data?", {
      description: "This cannot be undone.",
      action: {
        label: "Clear",
        onClick: async () => {
          await clearDB();
          setTransactions([]);
          setCategoryFilter("All");
          setNoteSearch("");
          dateFilter.reset();
          toast.success("All saved data cleared.");
        },
      },
      cancel: {
        label: "Cancel",
        onClick: () => {},
      },
    });
  };

  const handleAddTransaction = async (data: TransactionFormValues) => {
    await addTransaction({
      user_id: user?.id,
      type: data.type,
      amount: Number(data.amount),
      categoryId: data.categoryId,
      date: data.date,
      note: data.note,
    });

    const syncedTransactions = await syncToSupabase();
    if (syncedTransactions) {
      setTransactions(syncedTransactions);
    } else {
      setTransactions(await getTransactions());
    }
  };

  const handleEditTransaction = async (data: TransactionFormValues) => {
    if (editingTransaction) {
      await updateTransaction(editingTransaction.id, {
        user_id: user?.id,
        type: data.type,
        amount: Number(data.amount),
        categoryId: data.categoryId,
        date: data.date,
        note: data.note,
      });

      const syncedTransactions = await syncToSupabase();
      if (syncedTransactions) {
        setTransactions(syncedTransactions);
      } else {
        setTransactions(await getTransactions());
      }
      setEditingTransaction(undefined);
    }
  };

  const handleDeleteTransaction = async (transaction: StoredTransaction) => {
    toast.warning("Are you sure you want to delete this transaction?", {
      description: <div className="text-gray-700 font-normal">
        {`${transaction.categoryLabel} - ₱${transaction.amount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`}
      </div>,
      action: {
        label: "Delete",
        onClick: async () => {
          await deleteTransaction(transaction.id);
          const syncedTransactions = await syncToSupabase();
          if (syncedTransactions) {
            setTransactions(syncedTransactions);
          } else {
            setTransactions(await getTransactions());
          }

          toast.success("Transaction deleted", {
            description: <div className="text-gray-700 font-normal">
              {`${transaction.categoryLabel} - ₱${transaction.amount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`}
            </div>,
          });
        },
      },
      cancel: {
        label: "Cancel",
        onClick: () => {},
      },
    });
  };

  const handleEditClick = (transaction: StoredTransaction) => {
    setEditingTransaction(transaction);
    setIsModalOpen(true);
  };

  const refreshTransactions = async () => {
    const syncedTransactions = await syncToSupabase();
    if (syncedTransactions) {
      setTransactions(syncedTransactions);
    } else {
      setTransactions(await getTransactions());
    }
  };

  const checkUserStatus = async () => {
    try {
      const cachedProfile = localStorage.getItem('cached_profile');
      let profile = null;

      if (cachedProfile) {
        try {
          profile = JSON.parse(cachedProfile);
        } catch {
          console.warn("Invalid cached profile format");
        }
      }

      if (!profile) {
        profile = await getProfile();
      }

      if (profile && profile.status && profile.status !== "approved") {
        alert(`Your account status is '${profile.status}'. You can stay logged in, but adding new transactions is not allowed until approval.`);
        return;
      }
      setIsModalOpen(true);
    } catch (error) {
      console.warn("Could not verify profile status, allowing transaction entry:", error);
      setIsModalOpen(true);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingTransaction(undefined);
  };

  const filteredTransactions = dateFilter.filtered
    .filter((t) => categoryFilter === "All" || t.categoryLabel === categoryFilter)
    .filter(
      (t) =>
        noteSearch.trim() === "" ||
        t.note?.toLowerCase().includes(noteSearch.trim().toLowerCase()),
    );

  return (
    <>
      <Toaster />
      <div className="min-h-screen bg-slate-50 pb-24 sm:pb-0">
        {/* tabs */}
        <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
          {activeTab === "dashboard" && (
            <DashboardPage
              transactions={transactions}
              onRefresh={refreshTransactions}
            />
          )}
          {activeTab === "transactions" && (
            <ExpenseIncomePage
              transactions={filteredTransactions}
              onAddClick={checkUserStatus}
              categories={CATEGORY_OPTIONS}
              selectedCategory={categoryFilter}
              onCategoryChange={setCategoryFilter}
              noteSearch={noteSearch}
              onNoteSearchChange={setNoteSearch}
              datePreset={dateFilter.preset}
              onDatePresetChange={dateFilter.setPreset}
              customRange={dateFilter.customRange}
              onCustomRangeChange={dateFilter.setCustomRange}
              isFiltered={dateFilter.isFiltered}
              onEdit={handleEditClick}
              onDelete={handleDeleteTransaction}
            />
          )}
          {activeTab === "profile" && (
            <ProfilePage
              user={user}
              onSync={refreshTransactions}
              onLoginForSync={() => setShowLoginPage(true)}
              onClearData={handleClearData}
              onLogout={handleLogout}
            />
          )}
        </div>

        <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

        <TransactionFormModal
          categories={CATEGORY_OPTIONS}
          isOpen={isModalOpen}
          onClose={handleModalClose}
          onSubmit={
            editingTransaction ? handleEditTransaction : handleAddTransaction
          }
          transaction={editingTransaction}
        />
      </div>
    </>
  );
}
