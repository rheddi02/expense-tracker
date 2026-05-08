import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  subDays,
  isWithinInterval,
  parseISO,
} from "date-fns";
import type { StoredTransaction } from "./transactionSchema";

export type DatePreset = "all" | "yesterday" | "this_week" | "this_month" | "custom";

export interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

export function getPresetRange(preset: DatePreset): DateRange {
  const now = new Date();
  switch (preset) {
    case "yesterday": {
      const y = subDays(now, 1);
      return { from: startOfDay(y), to: endOfDay(y) };
    }
    case "this_week":
      return { from: startOfWeek(now, { weekStartsOn: 1 }), to: endOfWeek(now, { weekStartsOn: 1 }) };
    case "this_month":
      return { from: startOfMonth(now), to: endOfMonth(now) };
    default:
      return { from: undefined, to: undefined };
  }
}

export function filterByDateRange(
  transactions: StoredTransaction[],
  preset: DatePreset,
  customRange: DateRange,
): StoredTransaction[] {
  if (preset === "all") return transactions;

  const range = preset === "custom" ? customRange : getPresetRange(preset);
  if (!range.from && !range.to) return transactions;

  return transactions.filter((t) => {
    const date = typeof t.date === "string" ? parseISO(t.date) : new Date(t.date);
    if (range.from && range.to) {
      return isWithinInterval(date, { start: range.from, end: range.to });
    }
    if (range.from) return date >= range.from;
    if (range.to) return date <= range.to;
    return true;
  });
}
