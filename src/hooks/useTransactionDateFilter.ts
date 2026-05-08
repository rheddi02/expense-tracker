import { useState, useMemo, useCallback } from "react";
import type { StoredTransaction } from "../utils/transactionSchema";
import { filterByDateRange, type DatePreset, type DateRange } from "../utils/dateFilters";

export function useTransactionDateFilter(transactions: StoredTransaction[]) {
  const [preset, setPreset] = useState<DatePreset>("all");
  const [customRange, setCustomRange] = useState<DateRange>({ from: undefined, to: undefined });

  const filtered = useMemo(
    () => filterByDateRange(transactions, preset, customRange),
    [transactions, preset, customRange],
  );

  const isFiltered = preset !== "all";

  const reset = useCallback(() => {
    setPreset("all");
    setCustomRange({ from: undefined, to: undefined });
  }, []);

  return { preset, setPreset, customRange, setCustomRange, filtered, isFiltered, reset };
}
