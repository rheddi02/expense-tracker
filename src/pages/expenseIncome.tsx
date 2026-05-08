import { Plus, Search } from "lucide-react";
import TransactionList from "../components/TransactionList";
import type { StoredTransaction } from "../utils/transactionSchema";
import ExpenseFilter from "../components/Filter";
import type { CategoryOption } from "@/lib/constants";

type Props = {
  transactions: StoredTransaction[];
  onAddClick: () => void;
  categories: CategoryOption[];
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
  noteSearch: string;
  onNoteSearchChange: (value: string) => void;
  onEdit?: (transaction: StoredTransaction) => void;
  onDelete?: (transaction: StoredTransaction) => void;
};

export default function ExpenseIncomePage({
  transactions,
  onAddClick,
  categories,
  selectedCategory,
  onCategoryChange,
  noteSearch,
  onNoteSearchChange,
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

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={noteSearch}
          onChange={(e) => onNoteSearchChange(e.target.value)}
          placeholder="Search by note..."
          className="w-full rounded-2xl border border-slate-200 bg-white pl-9 pr-4 py-3 text-sm outline-none transition focus:border-slate-400 placeholder:text-slate-400"
        />
      </div>

      <TransactionList transactions={transactions} onEdit={onEdit} onDelete={onDelete} />
    </div>
  );
}
