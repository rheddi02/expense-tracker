import { useMemo, useState } from "react";
import { Plus, ChevronDown, ChevronUp, Pencil, Trash2, CheckCircle, Search, ArrowLeftRight } from "lucide-react";
import type { StoredDebt } from "../utils/debtsSchema";
import DebtFormModal from "../components/DebtFormModal";
import type { DebtFormValues } from "../utils/debtsSchema";

type FilterType = "all" | "lent" | "borrowed";

type Props = {
  debts: StoredDebt[];
  onAdd: (data: DebtFormValues) => Promise<void>;
  onEdit: (id: string, data: DebtFormValues) => Promise<void>;
  onDelete: (debt: StoredDebt) => void;
  onSettle: (debt: StoredDebt) => void;
  onOffset: (debt: StoredDebt, opposing: StoredDebt[]) => void;
};

function formatAmount(amount: number) {
  return `₱${amount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;
}

function formatDate(date: string | null | undefined) {
  if (!date) return null;
  const [year, month, day] = date.split("-");
  return new Date(Number(year), Number(month) - 1, Number(day)).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function DebtsPage({ debts, onAdd, onEdit, onDelete, onSettle, onOffset }: Props) {
  const [filter, setFilter] = useState<FilterType>("all");
  const [nameSearch, setNameSearch] = useState("");
  const [expandedPeople, setExpandedPeople] = useState<Set<string>>(new Set());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState<StoredDebt | undefined>();

  const filtered = useMemo(
    () => (filter === "all" ? debts : debts.filter((d) => d.type === filter)),
    [debts, filter]
  );

  const existingNames = useMemo(
    () => [...new Set(debts.map((d) => d.person_name))],
    [debts]
  );

  const nameFiltered = useMemo(() => {
    if (!nameSearch.trim()) return filtered;
    const q = nameSearch.trim().toLowerCase();
    return filtered.filter((d) => d.person_name.toLowerCase().includes(q));
  }, [filtered, nameSearch]);

  // Group by person_name
  const grouped = useMemo(() => {
    const map = new Map<string, StoredDebt[]>();
    for (const debt of nameFiltered) {
      const key = debt.person_name.toLowerCase().trim();
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(debt);
    }
    return Array.from(map.entries())
      .map(([, records]) => {
        const lentOutstanding = records
          .filter((r) => !r.is_settled && r.type === "lent")
          .reduce((sum, r) => sum + r.amount - (r.settled_amount ?? 0), 0);
        const borrowedOutstanding = records
          .filter((r) => !r.is_settled && r.type === "borrowed")
          .reduce((sum, r) => sum + r.amount - (r.settled_amount ?? 0), 0);
        const netTotal = lentOutstanding - borrowedOutstanding;
        const netType: "lent" | "borrowed" | "even" =
          netTotal > 0 ? "lent" : netTotal < 0 ? "borrowed" : "even";
        return {
          name: records[0].person_name,
          records,
          lentOutstanding,
          borrowedOutstanding,
          netTotal,
          netType,
          settledTotal: records
            .filter((r) => r.is_settled)
            .reduce((sum, r) => sum + r.amount, 0),
        };
      })
      .sort((a, b) => {
        const latestA = Math.max(...a.records.map((r) => new Date(r.created_at).getTime()));
        const latestB = Math.max(...b.records.map((r) => new Date(r.created_at).getTime()));
        return latestB - latestA;
      });
  }, [nameFiltered]);

  const totals = useMemo(() => ({
    lent: debts.filter((d) => !d.is_settled && d.type === "lent").reduce((sum, d) => sum + d.amount - (d.settled_amount ?? 0), 0),
    borrowed: debts.filter((d) => !d.is_settled && d.type === "borrowed").reduce((sum, d) => sum + d.amount - (d.settled_amount ?? 0), 0),
  }), [debts]);

  const toggleExpand = (name: string) => {
    setExpandedPeople((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const handleAdd = async (data: DebtFormValues) => {
    await onAdd(data);
    setIsModalOpen(false);
  };

  const handleEdit = async (data: DebtFormValues) => {
    if (editingDebt) {
      await onEdit(editingDebt.id, data);
      setEditingDebt(undefined);
      setIsModalOpen(false);
    }
  };

  const openEdit = (debt: StoredDebt) => {
    setEditingDebt(debt);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingDebt(undefined);
  };

  const handleOffsetClick = (debt: StoredDebt, opposing: StoredDebt[]) => {
    onOffset(debt, opposing);
  };

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div className="flex items-center justify-between">
        <header className="space-y-1">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Debts</p>
          <h1 className="text-2xl font-semibold text-slate-900!">Money Tracker</h1>
        </header>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 active:scale-95"
        >
          <Plus size={16} />
          Add
        </button>
      </div>

      {/* Filter pills */}
      <div className="flex gap-2">
        {(["all", "lent", "borrowed"] as FilterType[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-all active:scale-95
              ${filter === f
                ? f === "lent"
                  ? "bg-emerald-500 text-white"
                  : f === "borrowed"
                    ? "bg-red-500 text-white"
                    : "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-500 hover:bg-slate-200"
              }`}
          >
            {f === "all" ? "All" : f === "lent" ? "Lent" : "Borrowed"}
          </button>
        ))}
      </div>

      {/* Name search */}
      <div className="relative">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search by name..."
          value={nameSearch}
          onChange={(e) => setNameSearch(e.target.value)}
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 pl-9 pr-4 py-2.5 text-sm outline-none transition focus:border-slate-400"
        />
      </div>

      {/* Summary cards */}
        <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-emerald-500 p-4 text-white">
              <p className="text-xs uppercase tracking-widest opacity-75 mb-1">Owed to me</p>
              <p className="text-xl font-bold">{formatAmount(totals.lent)}</p>
            </div>
            <div className="rounded-2xl bg-red-500 p-4 text-white">
              <p className="text-xs uppercase tracking-widest opacity-75 mb-1">I owe</p>
              <p className="text-xl font-bold">{formatAmount(totals.borrowed)}</p>
            </div>
        </div>

      {/* Grouped list */}
      {grouped.length === 0 ? (
        <div className="py-16 text-center text-slate-400">
          <p className="text-4xl mb-3">🤝</p>
          <p className="font-medium">No debts recorded</p>
          <p className="text-sm mt-1">Tap Add to track money lent or borrowed</p>
        </div>
      ) : (
        <div className="space-y-3">
          {grouped.map(({ name, records, lentOutstanding, borrowedOutstanding, netTotal, netType, settledTotal }) => {
            const isExpanded = expandedPeople.has(name);
            const hasMixed = lentOutstanding > 0 && borrowedOutstanding > 0;

            return (
              <div key={name} className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                {/* Person header */}
                <button
                  onClick={() => toggleExpand(name)}
                  className="w-full flex items-center justify-between p-4 text-left"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0
                      ${netType === "lent" ? "bg-emerald-500" : netType === "borrowed" ? "bg-red-500" : "bg-slate-400"}`}>
                      {name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 truncate">{name}</p>
                      <p className="text-xs text-slate-500">
                        {records.length} record{records.length !== 1 ? "s" : ""}
                        {settledTotal > 0 && ` · ${formatAmount(settledTotal)} settled`}
                      </p>
                      {hasMixed && (
                        <p className="text-xs text-slate-400 mt-0.5">
                          <span className="text-emerald-600">↑ {formatAmount(lentOutstanding)}</span>
                          {" · "}
                          <span className="text-red-500">↓ {formatAmount(borrowedOutstanding)}</span>
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      {netType !== "even" ? (
                        <>
                          <p className={`font-bold text-sm ${netType === "lent" ? "text-emerald-600" : "text-red-500"}`}>
                            {formatAmount(Math.abs(netTotal))}
                          </p>
                          <p className="text-xs text-slate-400">{netType === "lent" ? "owed to you" : "you owe"}</p>
                        </>
                      ) : (
                        <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-2 py-1 rounded-full">Settled</span>
                      )}
                    </div>
                    {isExpanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                  </div>
                </button>

                {/* Expanded records */}
                {isExpanded && (
                  <div className="border-t border-slate-100 divide-y divide-slate-100">
                    {records.map((debt) => {
                      const remaining = debt.amount - (debt.settled_amount ?? 0);
                      const hasPartialOffset = (debt.settled_amount ?? 0) > 0 && !debt.is_settled;
                      const opposingUnsettled = records.filter(
                        (r) => r.id !== debt.id && !r.is_settled && r.type !== debt.type
                      );
                      const linkedRecord = debt.offset_ref_id
                        ? records.find((r) => r.id === debt.offset_ref_id)
                        : null;

                      return (
                        <div key={debt.id} className={`relative ${debt.is_settled ? "opacity-50" : ""}`}>
                          <div className={`absolute left-0 top-0 bottom-0 w-1
                            ${debt.type === "lent" ? "bg-emerald-400" : "bg-red-400"}`} />
                          <div className="pl-4 pr-4 py-3">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className={`font-semibold text-sm ${debt.is_settled ? "line-through text-slate-400" : "text-slate-800"}`}>
                                    {formatAmount(debt.amount)}
                                  </span>
                                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full
                                    ${debt.type === "lent"
                                      ? "text-emerald-700 bg-emerald-50"
                                      : "text-red-600 bg-red-50"}`}>
                                    {debt.type === "lent" ? "Lent" : "Borrowed"}
                                  </span>
                                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                                    {debt.category === "digital" ? "Digital" : "Cash"}
                                  </span>
                                  {!!debt.is_settled && debt.offset_ref_id ? (
                                    <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">Offset</span>
                                  ) : !!debt.is_settled ? (
                                    <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Paid</span>
                                  ) : null}
                                  {!debt.is_settled && debt.payment_date && (() => {
                                    const due = new Date(debt.payment_date);
                                    const today = new Date();
                                    today.setHours(0, 0, 0, 0);
                                    const isOverdue = due < today;
                                    return (
                                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full
                                        ${isOverdue ? "text-red-600 bg-red-50" : "text-amber-600 bg-amber-50"}`}>
                                        {isOverdue ? "Overdue" : "Due"} {formatDate(debt.payment_date)}
                                      </span>
                                    );
                                  })()}
                                </div>

                                {/* Partial offset progress */}
                                {hasPartialOffset && (
                                  <p className="text-xs text-indigo-500 mt-0.5 flex items-center gap-1">
                                    <ArrowLeftRight size={10} />
                                    {formatAmount(debt.settled_amount ?? 0)} offset applied · {formatAmount(remaining)} remaining
                                  </p>
                                )}

                                {/* Offset link when settled via offset */}
                                {!!debt.is_settled && !!debt.offset_ref_id && !!linkedRecord && (
                                  <p className="text-xs text-indigo-400 mt-0.5 flex items-center gap-1">
                                    <ArrowLeftRight size={10} />
                                    Against: {linkedRecord!.type === "lent" ? "lent" : "borrowed"} {formatAmount(linkedRecord!.amount)}
                                  </p>
                                )}

                                <p className="text-xs text-slate-400 mt-0.5">
                                  {debt.type === "lent" ? "Lent" : "Borrowed"} {formatDate(debt.borrow_date)}
                                  {debt.note && ` · ${debt.note}`}
                                </p>
                              </div>

                              {/* Actions */}
                              {!debt.is_settled && (
                                <div className="flex items-center gap-1 shrink-0">
                                  {opposingUnsettled.length > 0 && (
                                    <button
                                      onClick={() => handleOffsetClick(debt, opposingUnsettled)}
                                      className="p-1.5 rounded-xl text-indigo-400 hover:bg-indigo-50 transition"
                                      title="Offset against opposing debt"
                                    >
                                      <ArrowLeftRight size={15} />
                                    </button>
                                  )}
                                  <button
                                    onClick={() => onSettle(debt)}
                                    className="p-1.5 rounded-xl text-emerald-500 hover:bg-emerald-50 transition"
                                    title="Mark as paid"
                                  >
                                    <CheckCircle size={17} />
                                  </button>
                                  <button
                                    onClick={() => openEdit(debt)}
                                    className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 transition"
                                    title="Edit"
                                  >
                                    <Pencil size={15} />
                                  </button>
                                  <button
                                    onClick={() => onDelete(debt)}
                                    className="p-1.5 rounded-xl text-rose-400 hover:bg-rose-50 transition"
                                    title="Delete"
                                  >
                                    <Trash2 size={15} />
                                  </button>
                                </div>
                              )}
                              {!!debt.is_settled && (
                                <button
                                  onClick={() => onDelete(debt)}
                                  className="p-1.5 rounded-xl text-rose-400 hover:bg-rose-50 transition shrink-0"
                                  title="Delete"
                                >
                                  <Trash2 size={15} />
                                </button>
                              )}
                            </div>

                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <DebtFormModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSubmit={editingDebt ? handleEdit : handleAdd}
        debt={editingDebt}
        existingNames={existingNames}
      />
    </div>
  );
}
