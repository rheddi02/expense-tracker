import { Plus } from "lucide-react";
import TransactionList from "../components/TransactionList";
import type { StoredTransaction } from "../utils/transactionSchema";
import ExpenseFilter from "../components/Filter";
import type { CategoryOption } from "@/App";

type Props = {
  transactions: StoredTransaction[];
  onAddClick: () => void;
  categories: CategoryOption[];
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
  onEdit?: (transaction: StoredTransaction) => void;
  onDelete?: (transaction: StoredTransaction) => void;
};

export default function ExpenseIncomePage({
  transactions,
  onAddClick,
  categories,
  selectedCategory,
  onCategoryChange,
  onEdit,
  onDelete,
}: Props) {
  return (
    <div className="space-y-6 text-left">
      <div className="flex items-center justify-between">
        <header className="space-y-1 ">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
            Transactions
          </p>
          <h1 className="text-2xl font-semibold text-slate-900!">
            Income & Expense
          </h1>
        </header>
        <button
          onClick={onAddClick}
          className="flex items-center gap-2 rounded-full bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          <Plus size={20} />
          <span className="hidden sm:inline">Add</span>
        </button>
      </div>
      <ExpenseFilter
        categories={categories}
        selectedCategory={selectedCategory}
        onCategoryChange={onCategoryChange}
      />

      <TransactionList transactions={transactions} onEdit={onEdit} onDelete={onDelete} />
    </div>
  );
}
