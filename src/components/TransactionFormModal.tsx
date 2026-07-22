import { useMemo, useEffect } from "react";
import {
  cn,
  getCurrentLocalDateTime,
  getCurrentLocalDateTimePlusMinute,
} from "../lib/utils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  transactionSchema,
  type TransactionFormValues,
  type StoredTransaction,
} from "../utils/transactionSchema";

type CategoryOption = {
  id: string;
  label: string;
  type: "income" | "expense";
};

type Props = {
  categories: CategoryOption[];
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TransactionFormValues) => void;
  transaction?: StoredTransaction;
  defaultType?: "income" | "expense";
};

export default function TransactionFormModal({
  categories,
  isOpen,
  onClose,
  onSubmit,
  transaction,
  defaultType = "expense",
}: Props) {
  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: "expense",
      amount: "",
      categoryId: categories.find((item) => item.type === "expense")?.id ?? "",
      date: getCurrentLocalDateTime(),
      note: "",
    },
  });

  const type = watch("type");
  const selectedCatId = watch("categoryId");

  useEffect(() => {
    if (transaction) {
      reset({
        type: transaction.type,
        amount: transaction.amount.toString(),
        categoryId: transaction.categoryId || "",
        date: transaction.date.slice(0, 19),
        note: transaction.note || "",
      });
    } else {
      reset({
        type: defaultType,
        amount: "",
        categoryId:
          categories.find((item) => item.type === defaultType)?.id ?? "",
        date: getCurrentLocalDateTime(),
        note: "",
      });
    }
  }, [transaction, categories, reset, isOpen, defaultType]);

  const visibleCategories = useMemo(
    () => categories.filter((category) => category.type === type),
    [categories, type],
  );

  const defaultCategoryId = useMemo(
    () => categories.find((category) => category.type === type)?.id ?? "",
    [categories, type],
  );

  useEffect(() => {
    const currentCategory = categories.find(
      (category) => category.id === selectedCatId,
    );
    if (!currentCategory || currentCategory.type !== type) {
      setValue("categoryId", defaultCategoryId, { shouldValidate: true });
    }
  }, [categories, defaultCategoryId, selectedCatId, setValue, type]);

  const submit = async (data: TransactionFormValues) => {
    onSubmit(data);
    reset({
      type: "expense",
      amount: "",
      categoryId: categories.find((item) => item.type === "expense")?.id ?? "",
      date: getCurrentLocalDateTime(),
      note: "",
    });
    onClose();
  };

  const { onChange: dateOnChange, ...dateRegister } = register("date");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black bg-opacity-50 sm:items-center sm:justify-center">
      <div className="w-full rounded-t-3xl bg-card p-4 shadow-lg sm:max-w-md sm:rounded-3xl">
        <div className="mb-6 flex items-center justify-between">
          <div className="text-left">
            <h2 className="text-lg font-semibold text-foreground">
              {transaction ? "Edit Transaction" : "Add Transaction"}
            </h2>
            <div className="  pb-1">
              <p className="text-muted-foreground text-sm mt-0.5">
                {transaction
                  ? "Update your transaction details"
                  : "What did you spend or earn?"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit(submit)} className="space-y-4 text-left">
          <div className="space-y-4">
            <div className=" mt-4 grid grid-cols-2 gap-1 bg-stone-800 p-1 rounded-2xl">
              {(["expense", "income"] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    const defaultValue =
                      categories.find((item) => item.type === value)?.id ?? "";
                    setValue("type", value);
                    setValue("categoryId", defaultValue, {
                      shouldValidate: true,
                    });
                  }}
                  className={`py-2.5 rounded-xl text-sm font-bold transition-all duration-200 active:scale-95
                ${
                  type === value
                    ? value === "expense"
                      ? "bg-red-500 text-white shadow-lg shadow-red-900/50"
                      : "bg-emerald-500 text-white shadow-lg shadow-emerald-900/50"
                    : "text-stone-400 hover:text-stone-200"
                }`}
                >
                  {value === "expense" ? "Expense" : "Income"}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <span className="text-sm font-medium">Amount</span>
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

          {/* Category */}
          <div className="space-y-4">
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">
              Category
            </label>
            <input type="hidden" {...register("categoryId")} />
            <div className="grid grid-cols-3 gap-2">
              {visibleCategories.map((cat) => {
                const isSel = selectedCatId === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() =>
                      setValue("categoryId", cat.id, { shouldValidate: true })
                    }
                    className={cn(
                      `flex flex-col items-center justify-center gap-1.5 py-3.5 px-2 rounded-2xl
                      text-xs font-semibold transition-all duration-150 active:scale-95 ring-2`,
                      isSel && type == "income"
                        ? "bg-green-50 dark:bg-green-500/10 ring-green-400 text-green-600 dark:text-green-400"
                        : isSel && type == "expense"
                          ? "bg-orange-50 dark:bg-orange-500/10 ring-orange-400 text-orange-600 dark:text-orange-400"
                          : "bg-stone-800 text-stone-400 ring-transparent hover:bg-stone-750",
                    )}
                  >
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>
            {errors.categoryId && (
              <p className="text-red-400 text-xs mt-1.5 ml-1">
                {errors.categoryId.message}
              </p>
            )}
          </div>

          <div className="space-y-4">
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">
              Date
            </label>
            <input
              type="datetime-local"
              step="1"
              {...dateRegister}
              onChange={(e) => {
                if (!e.target.value) {
                  setValue("date", getCurrentLocalDateTime());
                } else {
                  dateOnChange(e);
                }
              }}
              max={transaction ? undefined : getCurrentLocalDateTimePlusMinute()}
              className={`w-full bg-stone-800 text-stone-200 text-sm px-3 py-3.5 rounded-2xl
                  outline-none border-2 transition-all
                  ${errors.date ? "border-red-500" : "border-transparent focus:border-stone-600"}`}
            />
            {errors.date && (
              <p className="text-red-400 text-xs mt-1">{errors.date.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <span className="text-sm font-medium">Note</span>
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
              {transaction ? "Update" : "Add"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
