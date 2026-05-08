import { useCallback } from "react";
import { Plus, Search } from "lucide-react";
import TransactionList from "../components/TransactionList";
import type { StoredTransaction } from "../utils/transactionSchema";
import ExpenseFilter from "../components/Filter";
import type { CategoryOption } from "@/lib/constants";
import TransactionDateFilter from "../components/filters/TransactionDateFilter";
import TransactionSummaryCard from "../components/summary/TransactionSummaryCard";
import type { DatePreset, DateRange } from "../utils/dateFilters";

type Props = {
  transactions: StoredTransaction[];
  onAddClick: () => void;
  categories: CategoryOption[];
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
  noteSearch: string;
  onNoteSearchChange: (value: string) => void;
  datePreset: DatePreset;
  onDatePresetChange: (v: DatePreset) => void;
  customRange: DateRange;
  onCustomRangeChange: (r: DateRange) => void;
  isFiltered: boolean;
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
  datePreset,
  onDatePresetChange,
  customRange,
  onCustomRangeChange,
  isFiltered,
  onEdit,
  onDelete,
}: Props) {
  const handleNoteChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => onNoteSearchChange(e.target.value),
    [onNoteSearchChange],
  );

  return (
    <div className="space-y-6 text-left">
      <div className="flex items-center justify-between">
        <header className="space-y-1">
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
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
        />
        <input
          type="text"
          value={noteSearch}
          onChange={handleNoteChange}
          placeholder="Search by note..."
          className="w-full rounded-2xl border border-slate-200 bg-white pl-9 pr-4 py-3 text-sm outline-none transition focus:border-slate-400 placeholder:text-slate-400"
        />
      </div>

      <TransactionDateFilter
        preset={datePreset}
        onPresetChange={onDatePresetChange}
        customRange={customRange}
        onCustomRangeChange={onCustomRangeChange}
      />

      {isFiltered && (
        <TransactionSummaryCard
          transactions={transactions}
          preset={datePreset}
          customRange={customRange}
        />
      )}

      {transactions.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white py-12 text-center">
          <p className="text-sm text-slate-500">
            {isFiltered ? "No transactions in this range." : "No transactions yet."}
          </p>
        </div>
      ) : (
        <TransactionList
          transactions={transactions}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      )}
    </div>
  );
}
