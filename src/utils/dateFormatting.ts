import { format, isSameYear } from "date-fns";
import type { DatePreset, DateRange } from "./dateFilters";

export function formatRangeLabel(preset: DatePreset, customRange: DateRange): string {
  const now = new Date();

  if (preset === "yesterday") {
    const d = new Date(now);
    d.setDate(d.getDate() - 1);
    return format(d, "MMM d, yyyy");
  }
  if (preset === "this_week") return `Week of ${format(now, "MMM d")}`;
  if (preset === "this_month") return format(now, "MMMM yyyy");

  if (preset === "custom") {
    const { from, to } = customRange;
    if (!from && !to) return "Custom range";
    if (from && !to) return `From ${format(from, "MMM d, yyyy")}`;
    if (!from && to) return `Until ${format(to, "MMM d, yyyy")}`;
    if (from && to) {
      const sameYear = isSameYear(from, to);
      const fromStr = sameYear ? format(from, "MMM d") : format(from, "MMM d, yyyy");
      return `${fromStr} – ${format(to, "MMM d, yyyy")}`;
    }
  }

  return "";
}
