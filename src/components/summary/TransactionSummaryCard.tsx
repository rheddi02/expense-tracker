import React, { useMemo } from "react";
import type { StoredTransaction } from "../../utils/transactionSchema";
import { calcSummary, formatPeso } from "../../utils/transactionCalculations";
import type { DatePreset, DateRange } from "../../utils/dateFilters";
import { formatRangeLabel } from "../../utils/dateFormatting";

interface Props {
  transactions: StoredTransaction[];
  preset: DatePreset;
  customRange: DateRange;
}

const TransactionSummaryCard = React.memo(function TransactionSummaryCard({
  transactions,
  preset,
  customRange,
}: Props) {
  const summary = useMemo(() => calcSummary(transactions), [transactions]);
  const label = useMemo(() => formatRangeLabel(preset, customRange), [preset, customRange]);

  return (
    <div className="rounded-3xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Summary
        </p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div>
          <p className="text-xs text-muted-foreground">Income</p>
          <p className="mt-0.5 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
            {formatPeso(summary.income)}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Expense</p>
          <p className="mt-0.5 text-sm font-semibold text-rose-600 dark:text-rose-400">
            {formatPeso(summary.expense)}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Net</p>
          <p
            className={`mt-0.5 text-sm font-semibold ${
              summary.net >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
            }`}
          >
            {formatPeso(summary.net)}
          </p>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        {summary.count} transaction{summary.count !== 1 ? "s" : ""}
      </p>
    </div>
  );
});

export default TransactionSummaryCard;
