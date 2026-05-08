import { useState, useEffect, useRef } from "react";
import { syncOnLoad, syncToSupabase } from "./db/syncService";
import { useAuth } from "./hooks/useAuth";
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
  const [isLoading, setIsLoading] = useState(!isAuthReady);
  const previousUserIdRef = useRef<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "transactions" | "profile"
  >("dashboard");
  const [transactions, setTransactions] = useState<StoredTransaction[]>([]);
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<
    StoredTransaction | undefined
  >();

  useEffect(() => {
    // Initialize the database
    initDB();
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

  useEffect(() => {
    syncOnLoad();
  }, []);

  useEffect(() => {
    if (!isAuthReady) return;

    const handleUserChange = async () => {
      if (previousUserIdRef.current && user && previousUserIdRef.current !== user.id) {
        await clearDB(previousUserIdRef.current);
      }

      if (!user) {
        await clearDB();
        setTransactions([]);
        setUserRole(null);
        previousUserIdRef.current = null;
        setIsLoading(false);
        return;
      }

      previousUserIdRef.current = user.id;

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
        setTransactions(await getTransactions({ user_id: user.id }));
      } catch {
        setUserRole("user");
        setTransactions(await getTransactions({ user_id: user.id }));
      }

      setIsLoading(false);
    };

    handleUserChange();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, isAuthReady]);

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

  if (!user) {
    // Show login page here (to be created)
    return <LoginPage />;
  }

  // Define handler functions for use in conditional rendering
  const handleLogout = async () => {
    // Admin doesn't have local DB, skip the confirmation for them
    if (userRole === "admin") {
      if (
        !window.confirm("Are you sure you want to log out?")
      ) {
        return;
      }
    } else if (
      !window.confirm(
        "Are you sure you want to log out? This will clear all locally saved data.",
      )
    ) {
      return;
    }
    await signOut(); // This clears local DB + signs out
    setUserRole(null);
    // UI will re-render due to onAuthStateChange
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

  // useEffect(() => {
  //   const stored = localStorage.getItem(STORAGE_KEY)
  //   if (stored) {
  //     try {
  //       setTransactions(JSON.parse(stored) as StoredTransaction[])
  //     } catch {
  //       setTransactions([])
  //     }
  //   }
  // }, [])

  // useEffect(() => {
  //   localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions))
  // }, [transactions])

  const handleClearData = async () => {
    if (
      !window.confirm(
        "Clear all saved transaction data? This cannot be undone.",
      )
    ) {
      return;
    }

    await clearDB();
    setTransactions([]);
    setCategoryFilter("All");
    toast("All saved data cleared.");
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
      setTransactions(await getTransactions({ user_id: user?.id }));
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
        setTransactions(await getTransactions({ user_id: user?.id }));
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
          await deleteTransaction(transaction.id, user.id);
          const syncedTransactions = await syncToSupabase();
          if (syncedTransactions) {
            setTransactions(syncedTransactions);
          } else {
            setTransactions(await getTransactions({ user_id: user?.id }));
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
      setTransactions(await getTransactions({ user_id: user?.id }));
    }
  };

  const checkUserStatus = async () => {
    try {
      // First check cached profile for immediate offline access
      const cachedProfile = localStorage.getItem('cached_profile');
      let profile = null;
      
      if (cachedProfile) {
        try {
          profile = JSON.parse(cachedProfile);
        } catch {
          console.warn("Invalid cached profile format");
        }
      }
      
      // If no cached profile, try to fetch online
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

  const filteredTransactions =
    categoryFilter === "All"
      ? transactions
      : transactions.filter(
          (transaction) => transaction.categoryLabel === categoryFilter,
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
              onEdit={handleEditClick}
              onDelete={handleDeleteTransaction}
            />
          )}
          {activeTab === "profile" && (
            <ProfilePage
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
