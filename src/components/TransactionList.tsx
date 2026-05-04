import { useEffect, useRef, useState } from "react";
import type { StoredTransaction } from "../utils/transactionSchema";
import { Edit, Trash2 } from "lucide-react";

type Props = {
  transactions: StoredTransaction[];
  onEdit?: (transaction: StoredTransaction) => void;
  onDelete?: (transaction: StoredTransaction) => void;
};

export default function TransactionList({ transactions, onEdit, onDelete }: Props) {
  const ITEMS_PER_PAGE = 10;
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setVisibleCount(ITEMS_PER_PAGE);
  }, [transactions.length]);

  useEffect(() => {
    const container = containerRef.current;
    const sentinel = sentinelRef.current;
    if (!container || !sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && visibleCount < transactions.length) {
          setVisibleCount((count) => Math.min(count + ITEMS_PER_PAGE, transactions.length));
        }
      },
      { root: container, rootMargin: "150px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [transactions.length, visibleCount]);

  const visibleTransactions = transactions.slice(0, visibleCount);

  if (transactions.length === 0) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm sm:p-8">
        <p className="text-lg font-semibold sm:text-xl">No transactions yet</p>
        <p className="mt-2 text-sm text-slate-500">
          Use the form to add your first income or expense.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="mb-4 flex items-center justify-between sm:mb-6">
        <div className="text-left">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
            History
          </p>
        </div>
      </div>

      <div
        ref={containerRef}
        className="space-y-3 sm:space-y-4 max-h-[60vh] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100"
      >
        {visibleTransactions.map((transaction) => (
          <div
            key={transaction.id}
            className="rounded-3xl border border-slate-100 bg-slate-50 p-4 sm:p-5"
          >
            <div className="flex gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-900 sm:text-base">
                  {transaction.categoryLabel}
                </p>
                {transaction.note && (
                  <p className="mt-2 text-sm text-slate-600">
                    {transaction.note}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <div className="flex flex-col items-end">
                  <p className="text-xs text-slate-500 sm:text-sm">
                    {new Date(transaction.date).toLocaleString('en-PH', { dateStyle: 'short', timeStyle: 'short' })}
                  </p>
                  <p
                    className={`text-lg font-semibold sm:text-xl ${transaction.type === "income" ? "text-emerald-600" : "text-rose-600"}`}
                  >
                    {transaction.type === "expense" ? "-" : "+"} ₱
                    {transaction.amount.toLocaleString("en-PH", {
                      minimumFractionDigits: 2,
                    })}
                  </p>
                </div>

                <div className="flex flex-col gap-1">
                  {onEdit && (
                    <button
                      onClick={() => onEdit(transaction)}
                      className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                      title="Edit transaction"
                    >
                      <Edit size={16} />
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={() => onDelete(transaction)}
                      className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-rose-600"
                      title="Delete transaction"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        <div ref={sentinelRef} className="h-1" />
      </div>
      {visibleCount < transactions.length && (
        <div className="mt-4 text-center text-sm text-slate-500">
          Loading more transactions…
        </div>
      )}
    </div>
  );
}
