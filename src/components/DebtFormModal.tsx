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
      borrow_date: getTodayDate(),
      payment_date: "",
      note: "",
    },
  });

  const type = watch("type");
  const nameValue = watch("person_name");
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (debt) {
      reset({
        person_name: debt.person_name,
        amount: debt.amount.toString(),
        type: debt.type,
        borrow_date: debt.borrow_date,
        payment_date: debt.payment_date ?? "",
        note: debt.note ?? "",
      });
    } else {
      reset({
        person_name: "",
        amount: "",
        type: "lent",
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
      <div className="w-full rounded-t-3xl bg-white p-4 shadow-lg sm:max-w-md sm:rounded-3xl">
        <div className="mb-6 flex items-center justify-between">
          <div className="text-left">
            <h2 className="text-lg font-semibold text-slate-900!">
              {debt ? "Edit Debt" : "Add Debt"}
            </h2>
            <p className="text-stone-500 text-sm mt-0.5">
              {debt ? "Update the debt record" : "Track money lent or borrowed"}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
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

          {/* Person name with autocomplete */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest">
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
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base outline-none transition focus:border-slate-400"
              />
              {showSuggestions && suggestions.length > 0 && (
                <ul className="absolute z-10 left-0 right-0 top-full mt-1 max-h-44 overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-lg">
                  {suggestions.map((name) => (
                    <li
                      key={name}
                      onMouseDown={() => selectSuggestion(name)}
                      className="px-4 py-2.5 text-sm text-slate-800 hover:bg-slate-50 cursor-pointer first:rounded-t-2xl last:rounded-b-2xl"
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
            <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest">
              Amount
            </label>
            <input
              type="number"
              step="0.01"
              inputMode="decimal"
              placeholder="0.00"
              {...register("amount")}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base outline-none transition focus:border-slate-400"
            />
            {errors.amount && (
              <p className="text-sm text-rose-500">{errors.amount.message}</p>
            )}
          </div>

          {/* Borrow date */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest">
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
            <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest">
              Due Date <span className="normal-case font-normal text-stone-500">(optional)</span>
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
            <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest">
              Note <span className="normal-case font-normal text-stone-500">(optional)</span>
            </label>
            <textarea
              rows={2}
              placeholder="Optional note"
              {...register("note")}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base outline-none transition focus:border-slate-400"
            />
            {errors.note && (
              <p className="text-sm text-rose-500">{errors.note.message}</p>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {debt ? "Update" : "Add"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
