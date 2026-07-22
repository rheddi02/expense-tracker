import { useEffect, useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { debtSchema, type DebtFormValues, type StoredDebt } from "../utils/debtsSchema";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: DebtFormValues) => void;
  debt?: StoredDebt;
  existingNames?: string[];
};

function getTodayDate() {
  return new Date().toLocaleDateString('sv-SE');
}

export default function DebtFormModal({ isOpen, onClose, onSubmit, debt, existingNames = [] }: Props) {
  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<DebtFormValues>({
    resolver: zodResolver(debtSchema),
    defaultValues: {
      person_name: "",
      amount: "",
      type: "lent",
      category: "cash",
      borrow_date: getTodayDate(),
      payment_date: "",
      note: "",
    },
  });

  const type = watch("type");
  const category = watch("category");
  const nameValue = watch("person_name");
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (debt) {
      reset({
        person_name: debt.person_name,
        amount: debt.amount.toString(),
        type: debt.type,
        category: debt.category ?? "cash",
        borrow_date: debt.borrow_date,
        payment_date: debt.payment_date ?? "",
        note: debt.note ?? "",
      });
    } else {
      reset({
        person_name: "",
        amount: "",
        type: "lent",
        category: "cash",
        borrow_date: getTodayDate(),
        payment_date: "",
        note: "",
      });
    }
    setShowSuggestions(false);
  }, [debt, reset, isOpen]);

  const suggestions = useMemo(() => {
    if (!nameValue.trim() || existingNames.length === 0) return [];
    const q = nameValue.trim().toLowerCase();
    return existingNames.filter(
      (n) => n.toLowerCase().includes(q) && n.toLowerCase() !== q
    );
  }, [nameValue, existingNames]);

  const selectSuggestion = (name: string) => {
    setValue("person_name", name, { shouldValidate: true });
    setShowSuggestions(false);
  };

  const submit = async (data: DebtFormValues) => {
    onSubmit({ ...data, payment_date: data.payment_date || undefined });
    reset();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black bg-opacity-50 sm:items-center sm:justify-center">
      <div className="w-full rounded-t-3xl bg-card p-4 shadow-lg sm:max-w-md sm:rounded-3xl">
        <div className="mb-6 flex items-center justify-between">
          <div className="text-left">
            <h2 className="text-lg font-semibold text-foreground">
              {debt ? "Edit Debt" : "Add Debt"}
            </h2>
            <p className="text-muted-foreground text-sm mt-0.5">
              {debt ? "Update the debt record" : "Track money lent or borrowed"}
            </p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit(submit)} className="space-y-4 text-left">
          {/* Type toggle */}
          <div className="grid grid-cols-2 gap-1 bg-stone-800 p-1 rounded-2xl">
            {(["lent", "borrowed"] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setValue("type", value)}
                className={`py-2.5 rounded-xl text-sm font-bold transition-all duration-200 active:scale-95
                  ${type === value
                    ? value === "lent"
                      ? "bg-emerald-500 text-white shadow-lg shadow-emerald-900/50"
                      : "bg-red-500 text-white shadow-lg shadow-red-900/50"
                    : "text-stone-400 hover:text-stone-200"
                  }`}
              >
                {value === "lent" ? "Lent (owe me)" : "Borrowed (I owe)"}
              </button>
            ))}
          </div>

          {/* Category toggle */}
          <div className="grid grid-cols-2 gap-1 bg-stone-800 p-1 rounded-2xl">
            {(["cash", "digital"] as const).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setValue("category", c)}
                className={`py-2.5 rounded-xl text-sm font-bold transition-all duration-200 active:scale-95
                  ${category === c
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-stone-400 hover:text-stone-200"
                  }`}
              >
                {c === "cash" ? "Cash" : "Digital"}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground -mt-2">
            {category === "cash"
              ? "Affects your balance right away"
              : "Affects your balance only when marked as paid"}
          </p>

          {/* Person name with autocomplete */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest">
              Name
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Person's name"
                autoComplete="off"
                {...register("person_name")}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                className="w-full rounded-2xl border border-border bg-muted px-4 py-3 text-base text-foreground outline-none transition focus:border-ring"
              />
              {showSuggestions && suggestions.length > 0 && (
                <ul className="absolute z-10 left-0 right-0 top-full mt-1 max-h-44 overflow-y-auto rounded-2xl border border-border bg-card shadow-lg">
                  {suggestions.map((name) => (
                    <li
                      key={name}
                      onMouseDown={() => selectSuggestion(name)}
                      className="px-4 py-2.5 text-sm text-foreground hover:bg-muted cursor-pointer first:rounded-t-2xl last:rounded-b-2xl"
                    >
                      {name}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {errors.person_name && (
              <p className="text-sm text-rose-500">{errors.person_name.message}</p>
            )}
          </div>

          {/* Amount */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest">
              Amount
            </label>
            <input
              type="number"
              step="0.01"
              inputMode="decimal"
              placeholder="0.00"
              {...register("amount")}
              className="w-full rounded-2xl border border-border bg-muted px-4 py-3 text-base text-foreground outline-none transition focus:border-ring"
            />
            {errors.amount && (
              <p className="text-sm text-rose-500">{errors.amount.message}</p>
            )}
          </div>

          {/* Borrow date */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest">
              Borrow Date
            </label>
            <input
              type="date"
              {...register("borrow_date")}
              max={getTodayDate()}
              className={`w-full bg-stone-800 text-stone-200 text-sm px-3 py-3.5 rounded-2xl outline-none border-2 transition-all
                ${errors.borrow_date ? "border-red-500" : "border-transparent focus:border-stone-600"}`}
            />
            {errors.borrow_date && (
              <p className="text-red-400 text-xs mt-1">{errors.borrow_date.message}</p>
            )}
          </div>

          {/* Payment due date (optional) */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest">
              Due Date <span className="normal-case font-normal text-muted-foreground">(optional)</span>
            </label>
            <input
              type="date"
              {...register("payment_date")}
              className={`w-full bg-stone-800 text-stone-200 text-sm px-3 py-3.5 rounded-2xl outline-none border-2 transition-all
                ${errors.payment_date ? "border-red-500" : "border-transparent focus:border-stone-600"}`}
            />
            {errors.payment_date && (
              <p className="text-red-400 text-xs mt-1">{errors.payment_date.message}</p>
            )}
          </div>

          {/* Note */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest">
              Note <span className="normal-case font-normal text-muted-foreground">(optional)</span>
            </label>
            <textarea
              rows={2}
              placeholder="Optional note"
              {...register("note")}
              className="w-full rounded-2xl border border-border bg-muted px-4 py-3 text-base text-foreground outline-none transition focus:border-ring"
            />
            {errors.note && (
              <p className="text-sm text-rose-500">{errors.note.message}</p>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-2xl border border-border px-4 py-3 text-sm font-semibold text-foreground transition hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {debt ? "Update" : "Add"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
