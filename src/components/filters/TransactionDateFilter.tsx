import React from "react";
import PresetFilterTabs from "./PresetFilterTabs";
import DateRangePicker from "./DateRangePicker";
import type { DatePreset, DateRange } from "../../utils/dateFilters";

interface Props {
  preset: DatePreset;
  onPresetChange: (v: DatePreset) => void;
  customRange: DateRange;
  onCustomRangeChange: (r: DateRange) => void;
}

const TransactionDateFilter = React.memo(function TransactionDateFilter({
  preset,
  onPresetChange,
  customRange,
  onCustomRangeChange,
}: Props) {
  return (
    <div className="space-y-3">
      <PresetFilterTabs value={preset} onChange={onPresetChange} />
      {preset === "custom" && (
        <DateRangePicker value={customRange} onChange={onCustomRangeChange} />
      )}
    </div>
  );
});

export default TransactionDateFilter;
