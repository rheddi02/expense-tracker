import { useState, useEffect, useRef, useMemo } from "react";
import { syncToSupabase, pushTransactionsToCloud, pullTransactionsFromCloud } from "./db/syncService";
import { syncDebtsToSupabase, pushDebtsToCloud, pullDebtsFromCloud } from "./db/debtSyncService";
import { useAuth } from "./hooks/useAuth";
import { useTransactionDateFilter } from "./hooks/useTransactionDateFilter";
import DashboardPage from "./pages/dashboard";
import ExpenseIncomePage from "./pages/expenseIncome";
import ProfilePage from "./pages/profile";
import AdminPage from "./pages/admin";
import DebtsPage from "./pages/debts";
import TabNavigation from "./components/TabNavigation";
import TransactionFormModal from "./components/TransactionFormModal";
import { PageLoader } from "./components/PageLoader";
import { getAppSettings } from "./utils/adminQueries";
import type {
  StoredTransaction,
  TransactionFormValues,
} from "./utils/transactionSchema";
import type { StoredDebt, DebtFormValues } from "./utils/debtsSchema";
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
import { getDebts, addDebt, updateDebt, deleteDebt, settleDebt, offsetDebtAgainstAll } from "./utils/debtsDb";
import { signOut } from "./auth/authService";
import LoginPage from "./pages/login";
import { getProfile } from "./utils/profile-helper";
import { devError } from "./lib/utils";
import { getCategories, addCategory, updateCategory, deleteCategory, setCategoryOrder } from "./utils/categoryDb";
import type { StoredCategory } from "./utils/categoryDb";
import { pushCategoriesToCloud, pullCategoriesFromCloud } from "./db/categorySyncService";

const DEBT_COLLECTION_ID = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
const DEBT_PAYMENT_ID    = "b2c3d4e5-f6a7-8901-bcde-f12345678901";
const LOAN_GIVEN_ID      = "c3d4e5f6-a7b8-9012-cdef-123456789012";
const LOAN_RECEIVED_ID   = "d4e5f6a7-b8c9-0123-defa-234567890123";

export default function App() {
  const { user, isAuthReady } = useAuth();
  const [userRole, setUserRole] = useState<"admin" | "user" | null>(null);
  const [userStatus, setUserStatus] = useState<string | null>(() => {
    try {
      const raw = localStorage.getItem("cached_profile");
      return raw ? (JSON.parse(raw).status ?? null) : null;
    } catch { return null; }
  });
  const isApproved = userStatus === "approved";
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showLoginPage, setShowLoginPage] = useState(false);
  const previousUserIdRef = useRef<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "transactions" | "debts" | "profile"
  >("dashboard");
  const [transactions, setTransactions] = useState<StoredTransaction[]>([]);
  const [debts, setDebts] = useState<StoredDebt[]>([]);
  const [categories, setCategories] = useState<StoredCategory[]>([]);
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [noteSearch, setNoteSearch] = useState("");
  const dateFilter = useTransactionDateFilter(transactions);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<
    StoredTransaction | undefined
  >();
  const [defaultTransactionType, setDefaultTransactionType] = useState<"income" | "expense">("expense");

  // Load local data immediately — no auth required
  useEffect(() => {
    const loadLocal = async () => {
      await initDB();
      setTransactions(await getTransactions());
      setDebts(await getDebts());
      setCategories(await getCategories());
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
        devError("Unable to load application settings:", error);
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
        setDebts(await getDebts());
      }

      if (!user) {
        // Logged out — keep local data, just reset role
        setUserRole(null);
        setUserStatus(null);
        previousUserIdRef.current = null;
        return;
      }

      previousUserIdRef.current = user.id;

      // Load profile (profile-helper.ts handles caching internally)
      try {
        const profile = await getProfile();
        if (profile?.role) {
          setUserRole(profile.role as "admin" | "user");
        } else {
          setUserRole("user");
        }
        setUserStatus(profile?.status ?? null);
      } catch {
        setUserRole("user");
      }

      // Load local data only — user can manually sync from Profile
      setTransactions(await getTransactions());
      setDebts(await getDebts());
      setCategories(await getCategories());
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

  const filteredTransactions = useMemo(
    () =>
      dateFilter.filtered
        .filter((t) => categoryFilter === "All" || t.categoryLabel === categoryFilter)
        .filter(
          (t) =>
            noteSearch.trim() === "" ||
            t.note?.toLowerCase().includes(noteSearch.trim().toLowerCase()),
        ),
    [dateFilter.filtered, categoryFilter, noteSearch]
  );

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

    if (isApproved) {
      const syncedTransactions = await syncToSupabase();
      if (syncedTransactions) {
        setTransactions(syncedTransactions);
        return;
      }
    }
    setTransactions(await getTransactions());
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

      if (isApproved) {
        const syncedTransactions = await syncToSupabase();
        if (syncedTransactions) {
          setTransactions(syncedTransactions);
          setEditingTransaction(undefined);
          return;
        }
      }
      setTransactions(await getTransactions());
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
          if (isApproved) {
            const syncedTransactions = await syncToSupabase();
            if (syncedTransactions) setTransactions(syncedTransactions);
            else setTransactions(await getTransactions());
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

  const handleAddDebt = async (data: DebtFormValues) => {
    const { id: debtId } = await addDebt({
      user_id: user?.id,
      person_name: data.person_name,
      amount: Number(data.amount),
      type: data.type,
      category: data.category,
      borrow_date: data.borrow_date,
      payment_date: data.payment_date || null,
      note: data.note,
    });
    if (data.category === "cash") {
      const today = new Date().toLocaleString('sv-SE', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
      }).replace(' ', 'T');
      await addTransaction({
        user_id: user?.id,
        type: data.type === "lent" ? "expense" : "income",
        amount: Number(data.amount),
        categoryId: data.type === "lent" ? LOAN_GIVEN_ID : LOAN_RECEIVED_ID,
        date: today,
        note: `Debt with: ${data.person_name}`,
        debtId,
      });
      if (isApproved) {
        const [syncedDebts, syncedTx] = await Promise.all([syncDebtsToSupabase(), syncToSupabase()]);
        setDebts(syncedDebts ?? await getDebts());
        if (syncedTx) setTransactions(syncedTx);
        else setTransactions(await getTransactions());
      } else {
        setDebts(await getDebts());
        setTransactions(await getTransactions());
      }
    } else {
      if (isApproved) {
        const syncedDebts = await syncDebtsToSupabase();
        setDebts(syncedDebts ?? await getDebts());
      } else {
        setDebts(await getDebts());
      }
    }
  };

  const handleEditDebt = async (id: string, data: DebtFormValues) => {
    await updateDebt(id, {
      person_name: data.person_name,
      amount: Number(data.amount),
      type: data.type,
      category: data.category,
      borrow_date: data.borrow_date,
      payment_date: data.payment_date || null,
      note: data.note,
    });
    if (isApproved) {
      const syncedDebts = await syncDebtsToSupabase();
      setDebts(syncedDebts ?? await getDebts());
    } else {
      setDebts(await getDebts());
    }
  };

  const handleSettleDebt = (debt: StoredDebt) => {
    const label = `${debt.person_name} — ${debt.amount.toLocaleString("en-PH", { minimumFractionDigits: 2, style: "currency", currency: "PHP" })}`;
    toast.info("Mark as paid?", {
      description: <div className="text-gray-700 font-normal">{label}</div>,
      action: {
        label: "Confirm",
        onClick: async () => {
          await settleDebt(debt.id);
          const remaining = debt.amount - (debt.settled_amount ?? 0);
          if (remaining > 0) {
            const today = new Date().toLocaleString('sv-SE', {
              year: 'numeric', month: '2-digit', day: '2-digit',
              hour: '2-digit', minute: '2-digit', second: '2-digit',
            }).replace(' ', 'T');
            await addTransaction({
              user_id: user?.id,
              type: debt.type === "lent" ? "income" : "expense",
              amount: remaining,
              categoryId: debt.type === "lent" ? DEBT_COLLECTION_ID : DEBT_PAYMENT_ID,
              date: today,
              note: `Settled: ${debt.person_name}`,
              debtId: debt.id,
            });
          }
          if (isApproved) {
            const [syncedDebts, syncedTx] = await Promise.all([
              syncDebtsToSupabase(),
              syncToSupabase(),
            ]);
            setDebts(syncedDebts ?? await getDebts());
            if (syncedTx) setTransactions(syncedTx);
            else setTransactions(await getTransactions());
          } else {
            setDebts(await getDebts());
            setTransactions(await getTransactions());
          }
          toast.success("Marked as paid", {
            description: <div className="text-gray-700 font-normal">{label}</div>,
          });
        },
      },
      cancel: { label: "Cancel", onClick: () => {} },
    });
  };

  const handleDeleteDebt = (debt: StoredDebt) => {
    toast.warning("Delete this debt record?", {
      description: <div className="text-gray-700 font-normal">
        {`${debt.person_name} — ₱${debt.amount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`}
      </div>,
      action: {
        label: "Delete",
        onClick: async () => {
          await deleteDebt(debt.id);
          if (isApproved) {
            const syncedDebts = await syncDebtsToSupabase();
            setDebts(syncedDebts ?? await getDebts());
          } else {
            setDebts(await getDebts());
          }
          toast.success("Debt record deleted");
        },
      },
      cancel: { label: "Cancel", onClick: () => {} },
    });
  };

  const handleOffsetDebt = (debtA: StoredDebt, opposing: StoredDebt[]) => {
    const remainingA = debtA.amount - (debtA.settled_amount ?? 0);
    const totalOpposing = opposing.reduce((s, d) => s + d.amount - (d.settled_amount ?? 0), 0);
    const offsetAmount = Math.min(remainingA, totalOpposing);
    const label = `Offset ₱${offsetAmount.toLocaleString("en-PH", { minimumFractionDigits: 2 })} · ${debtA.person_name}`;
    toast.info("Apply offset?", {
      description: <div className="text-gray-700 font-normal text-sm">{label}</div>,
      action: {
        label: "Confirm",
        onClick: async () => {
          const actual = await offsetDebtAgainstAll(debtA, opposing);
          const today = new Date().toLocaleString('sv-SE', {
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit', second: '2-digit',
          }).replace(' ', 'T');
          await Promise.all([
            addTransaction({
              user_id: user?.id,
              type: "income",
              amount: actual,
              categoryId: DEBT_COLLECTION_ID,
              date: today,
              note: `Offset: ${debtA.person_name}`,
              debtId: debtA.id,
            }),
            addTransaction({
              user_id: user?.id,
              type: "expense",
              amount: actual,
              categoryId: DEBT_PAYMENT_ID,
              date: today,
              note: `Offset: ${debtA.person_name}`,
              debtId: debtA.id,
            }),
          ]);
          if (isApproved) {
            const [syncedDebts, syncedTx] = await Promise.all([syncDebtsToSupabase(), syncToSupabase()]);
            setDebts(syncedDebts ?? await getDebts());
            if (syncedTx) setTransactions(syncedTx);
            else setTransactions(await getTransactions());
          } else {
            setDebts(await getDebts());
            setTransactions(await getTransactions());
          }
          toast.success("Offset applied");
        },
      },
      cancel: { label: "Cancel", onClick: () => {} },
    });
  };

  const handleAddCategory = async (data: { label: string; type: "income" | "expense" }) => {
    await addCategory({ ...data, user_id: user?.id });
    setCategories(await getCategories());
  };

  const handleEditCategory = async (id: string, label: string) => {
    await updateCategory(id, label);
    setCategories(await getCategories());
  };

  const handleDeleteCategory = async (id: string) => {
    await deleteCategory(id);
    setCategories(await getCategories());
  };

  const handleReorderCategory = async (ids: string[]) => {
    await setCategoryOrder(ids);
    setCategories(await getCategories());
  };

  const handleEditClick = (transaction: StoredTransaction) => {
    setEditingTransaction(transaction);
    setIsModalOpen(true);
  };

  const refreshTransactions = async () => {
    if (isApproved) {
      const syncedTransactions = await syncToSupabase();
      if (syncedTransactions) {
        setTransactions(syncedTransactions);
        return;
      }
    }
    setTransactions(await getTransactions());
  };

  const handleSyncToCloud = async () => {
    if (!isApproved) return;
    await Promise.all([
      pushTransactionsToCloud(),
      pushDebtsToCloud(),
      pushCategoriesToCloud(),
    ]);
  };

  const handleSyncFromCloud = async () => {
    if (!isApproved) return;
    const [txns, debts, cats] = await Promise.all([
      pullTransactionsFromCloud(),
      pullDebtsFromCloud(),
      pullCategoriesFromCloud(),
    ]);
    if (txns) setTransactions(txns); else setTransactions(await getTransactions());
    setDebts(debts ?? await getDebts());
    setCategories(cats ?? await getCategories());
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingTransaction(undefined);
  };

  const handleDashboardAddClick = (type: "income" | "expense") => {
    setDefaultTransactionType(type);
    setActiveTab("transactions");
    setIsModalOpen(true);
  };

  return (
    <>
      <Toaster />
      <div className="min-h-screen bg-slate-50 pb-24 sm:pb-0">
        {/* tabs */}
        <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
          {activeTab === "dashboard" && (
            <DashboardPage
              transactions={transactions}
              debts={debts}
              onRefresh={refreshTransactions}
              onAddTransaction={handleDashboardAddClick}
            />
          )}
          {activeTab === "transactions" && (
            <ExpenseIncomePage
              transactions={filteredTransactions}
              onAddClick={() => setIsModalOpen(true)}
              categories={categories}
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
          {activeTab === "debts" && (
            <DebtsPage
              debts={debts}
              onAdd={handleAddDebt}
              onEdit={handleEditDebt}
              onDelete={handleDeleteDebt}
              onSettle={handleSettleDebt}
              onOffset={handleOffsetDebt}
            />
          )}
          {activeTab === "profile" && (
            <ProfilePage
              user={user}
              onSyncToCloud={handleSyncToCloud}
              onSyncFromCloud={handleSyncFromCloud}
              onLoginForSync={() => setShowLoginPage(true)}
              onClearData={handleClearData}
              onLogout={handleLogout}
              categories={categories}
              onAddCategory={handleAddCategory}
              onEditCategory={handleEditCategory}
              onDeleteCategory={handleDeleteCategory}
              onReorderCategory={handleReorderCategory}
            />
          )}
        </div>

        <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

        <TransactionFormModal
          categories={categories}
          isOpen={isModalOpen}
          onClose={handleModalClose}
          onSubmit={
            editingTransaction ? handleEditTransaction : handleAddTransaction
          }
          transaction={editingTransaction}
          defaultType={defaultTransactionType}
        />
      </div>
    </>
  );
}
