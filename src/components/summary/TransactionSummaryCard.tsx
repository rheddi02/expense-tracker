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
    <div className="rounded-3xl border border-slate-200 bg-white p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
          Summary
        </p>
        <p className="text-xs text-slate-500">{label}</p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div>
          <p className="text-xs text-slate-500">Income</p>
          <p className="mt-0.5 text-sm font-semibold text-emerald-600">
            {formatPeso(summary.income)}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Expense</p>
          <p className="mt-0.5 text-sm font-semibold text-rose-600">
            {formatPeso(summary.expense)}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Net</p>
          <p
            className={`mt-0.5 text-sm font-semibold ${
              summary.net >= 0 ? "text-emerald-600" : "text-rose-600"
            }`}
          >
            {summary.net < 0 ? "-" : ""}{formatPeso(summary.net)}
          </p>
        </div>
      </div>

      <p className="text-xs text-slate-400">
        {summary.count} transaction{summary.count !== 1 ? "s" : ""}
      </p>
    </div>
  );
});

export default TransactionSummaryCard;
