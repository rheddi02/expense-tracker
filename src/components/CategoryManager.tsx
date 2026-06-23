import { useState } from "react";
import { Lock, Pencil, Plus, Trash2, Check, X, ChevronUp, ChevronDown } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { StoredCategory } from "@/utils/categoryDb";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  categories: StoredCategory[];
  onAdd: (data: { label: string; type: "income" | "expense" }) => Promise<void>;
  onEdit: (id: string, label: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onReorder: (id: string, direction: "up" | "down") => Promise<void>;
};

type AddingState = { type: "income" | "expense"; label: string } | null;
type EditingState = { id: string; label: string } | null;

export default function CategoryManager({ isOpen, onClose, categories, onAdd, onEdit, onDelete, onReorder }: Props) {
  const [adding, setAdding] = useState<AddingState>(null);
  const [editing, setEditing] = useState<EditingState>(null);
  const [pendingDelete, setPendingDelete] = useState<StoredCategory | null>(null);

  const expense = categories.filter((c) => c.type === "expense" && !c.deleted);
  const income = categories.filter((c) => c.type === "income" && !c.deleted);

  const handleAddSubmit = async (type: "income" | "expense") => {
    if (!adding || adding.type !== type) return;
    const label = adding.label.trim();
    if (!label) return;
    await onAdd({ label, type });
    setAdding(null);
  };

  const handleEditSubmit = async () => {
    if (!editing) return;
    const label = editing.label.trim();
    if (!label) return;
    await onEdit(editing.id, label);
    setEditing(null);
  };

  const handleDeleteClick = (cat: StoredCategory) => {
    setPendingDelete(cat);
  };

  function CategoryRow({ cat, isFirst, isLast }: { cat: StoredCategory; isFirst: boolean; isLast: boolean }) {
    const isSystem = cat.is_system === 1;
    const isEditing = editing?.id === cat.id;

    if (isEditing) {
      return (
        <div className="flex items-center gap-2 py-2 px-1">
          <input
            autoFocus
            className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-sm outline-none focus:border-slate-500"
            value={editing.label}
            onChange={(e) => setEditing({ ...editing, label: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleEditSubmit();
              if (e.key === "Escape") setEditing(null);
            }}
          />
          <button onClick={handleEditSubmit} className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50">
            <Check size={15} />
          </button>
          <button onClick={() => setEditing(null)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100">
            <X size={15} />
          </button>
        </div>
      );
    }

    return (
      <div className="flex items-center justify-between py-2 px-1">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm text-slate-800 truncate">{cat.label}</span>
          {isSystem && <Lock size={11} className="text-slate-400 shrink-0" />}
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            onClick={() => onReorder(cat.id, "up")}
            disabled={isFirst}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition disabled:opacity-20 disabled:pointer-events-none"
          >
            <ChevronUp size={13} />
          </button>
          <button
            onClick={() => onReorder(cat.id, "down")}
            disabled={isLast}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition disabled:opacity-20 disabled:pointer-events-none"
          >
            <ChevronDown size={13} />
          </button>
          {!isSystem && (
            <>
              <button
                onClick={() => setEditing({ id: cat.id, label: cat.label })}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition"
              >
                <Pencil size={13} />
              </button>
              <button
                onClick={() => handleDeleteClick(cat)}
                className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-50 transition"
              >
                <Trash2 size={13} />
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  function AddRow({ type }: { type: "income" | "expense" }) {
    const isActive = adding?.type === type;

    if (isActive) {
      return (
        <div className="flex items-center gap-2 py-2 px-1">
          <input
            autoFocus
            placeholder={`New ${type} category…`}
            className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-sm outline-none focus:border-slate-500"
            value={adding.label}
            onChange={(e) => setAdding({ type, label: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAddSubmit(type);
              if (e.key === "Escape") setAdding(null);
            }}
          />
          <button onClick={() => handleAddSubmit(type)} className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50">
            <Check size={15} />
          </button>
          <button onClick={() => setAdding(null)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100">
            <X size={15} />
          </button>
        </div>
      );
    }

    return (
      <button
        onClick={() => { setEditing(null); setAdding({ type, label: "" }); }}
        className="flex items-center gap-1.5 py-2 px-1 text-sm text-slate-400 hover:text-slate-600 transition"
      >
        <Plus size={14} />
        Add {type} category
      </button>
    );
  }

  return (
    <Sheet open={isOpen} onOpenChange={(v) => { if (!v) { setAdding(null); setEditing(null); setPendingDelete(null); onClose(); } }}>
      <SheetContent side="bottom" className="max-h-[85vh] rounded-t-3xl px-0 pb-safe">
        <SheetHeader className="px-6 pb-2">
          <SheetTitle className="text-left text-base font-semibold text-slate-400!">Manage Categories</SheetTitle>
        </SheetHeader>

        <div className="overflow-y-auto px-6 pb-8 space-y-6">
          {/* Expense */}
          <section>
            <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-slate-400">Expense</p>
            <div className="rounded-2xl border border-slate-100 bg-slate-50 divide-y divide-slate-100 px-3">
              {expense.map((cat, idx) => (
                <CategoryRow key={cat.id} cat={cat} isFirst={idx === 0} isLast={idx === expense.length - 1} />
              ))}
              <div className="py-1">
                <AddRow type="expense" />
              </div>
            </div>
          </section>

          {/* Income */}
          <section>
            <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-slate-400">Income</p>
            <div className="rounded-2xl border border-slate-100 bg-slate-50 divide-y divide-slate-100 px-3">
              {income.map((cat, idx) => (
                <CategoryRow key={cat.id} cat={cat} isFirst={idx === 0} isLast={idx === income.length - 1} />
              ))}
              <div className="py-1">
                <AddRow type="income" />
              </div>
            </div>
          </section>
        </div>

        {pendingDelete && (
          <div
            className="fixed inset-0 z-[60] flex items-center justify-center px-6 bg-black/30"
            onClick={() => setPendingDelete(null)}
          >
            <div
              className="w-full max-w-xs rounded-3xl bg-white p-6 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="text-base font-semibold text-slate-800 mb-1">
                Delete &ldquo;{pendingDelete.label}&rdquo;?
              </p>
              <p className="text-sm text-slate-400 mb-5">
                Existing transactions using this category will show &lsquo;Other&rsquo;.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setPendingDelete(null)}
                  className="flex-1 rounded-2xl border border-slate-200 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    await onDelete(pendingDelete.id);
                    setPendingDelete(null);
                  }}
                  className="flex-1 rounded-2xl bg-rose-500 py-2.5 text-sm font-semibold text-white hover:bg-rose-600 transition"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
