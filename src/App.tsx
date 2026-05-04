import { useState, useEffect } from "react";
import { onAuthStateChange } from "./auth/authService";
import { syncOnLoad, syncToSupabase } from "./db/syncService";
import DashboardPage from "./pages/dashboard";
import ExpenseIncomePage from "./pages/expenseIncome";
import ProfilePage from "./pages/profile";
import TabNavigation from "./components/TabNavigation";
import TransactionFormModal from "./components/TransactionFormModal";
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

export type CategoryOption = {
  id: string;
  label: string;
  type: "income" | "expense";
};

const CATEGORY_OPTIONS: CategoryOption[] = [
  {
    id: "52efe72b-9dc1-4ffe-bd61-0c329217830f",
    label: "Food",
    type: "expense",
  },
  {
    id: "ea2c1f60-50d3-4708-8f9c-58b4c6d0a2ea",
    label: "Transport",
    type: "expense",
  },
  {
    id: "cffbbfd3-7e44-4996-958b-fdae4dbae5cb",
    label: "Bills",
    type: "expense",
  },
  {
    id: "b4d8a0a4-0a28-4ed3-9f2c-70e5327e4c73",
    label: "Shopping",
    type: "expense",
  },
  {
    id: "b4d8a0a4-0a28-4ed3-9f2c-70e5327e4c72",
    label: "Others",
    type: "expense",
  },
  {
    id: "8c012f3f-7d78-4a4a-a4fe-84a32f51d6f7",
    label: "Salary",
    type: "income",
  },
  {
    id: "22b1ad96-13f0-4f92-9c6d-9da5cbe84f33",
    label: "Freelance",
    type: "income",
  },
  { id: "28c5c7d6-e9bf-4e4f-9cac-37f0233465b5", label: "Gift", type: "income" },
];

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
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
    // Initialize the database and load transactions
    initDB().then(async () => {
      const loadedTransactions = await getTransactions();
      setTransactions(loadedTransactions);
    });
  }, []);

  useEffect(() => {
    // Listen for auth state changes
    const unsubscribe = onAuthStateChange((authUser) => {
      setUser(authUser);
      setIsLoading(false);
    });

    // Sync on load if authenticated
    syncOnLoad();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    // Show login page here (to be created)
    return <LoginPage />;
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

  const handleAddTransaction = async (data: TransactionFormValues) => {
    await addTransaction({
      user_id: user?.id,
      type: data.type,
      amount: Number(data.amount),
      categoryId: data.categoryId,
      date: data.date,
      note: data.note,
    });

    // Sync after adding transaction
    await syncToSupabase();

    // Reload transactions
    const updatedTransactions = await getTransactions();
    setTransactions(updatedTransactions);
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

      await syncToSupabase();

      // Reload transactions
      const updatedTransactions = await getTransactions();
      setTransactions(updatedTransactions);
      setEditingTransaction(undefined);
    }
  };

  const handleDeleteTransaction = async (transaction: StoredTransaction) => {
    toast("Are you sure you want to delete this transaction?", {
      description: `${transaction.categoryLabel} - ₱${transaction.amount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`,
      action: {
        label: "Delete",
        onClick: async () => {
          await deleteTransaction(transaction.id);
          await syncToSupabase();
          // Reload transactions
          const updatedTransactions = await getTransactions();
          setTransactions(updatedTransactions);

          toast("Transaction deleted", {
            description: `${transaction.categoryLabel} - ₱${transaction.amount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`,
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
    const updatedTransactions = await getTransactions();
    setTransactions(updatedTransactions);
  };

  const checkUserStatus = async () => {
    const profile = await getProfile();
    if (profile && profile.status !== "approved") {
      await signOut()
      alert("Your account is not approved yet.");
      return;
    } else setIsModalOpen(true)
  }

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

  const handleLogout = async () => {
    if (
      !window.confirm(
        "Are you sure you want to log out? This will clear all locally saved data.",
      )
    ) {
      return;
    }
    await signOut(); // This clears local DB + signs out
    // UI will re-render due to onAuthStateChange
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
