import React from "react";
import type { DatePreset } from "../../utils/dateFilters";

const PRESETS: { value: DatePreset; label: string }[] = [
  { value: "all", label: "All" },
  { value: "yesterday", label: "Yesterday" },
  { value: "this_week", label: "This Week" },
  { value: "this_month", label: "This Month" },
  { value: "custom", label: "Custom" },
];

interface Props {
  value: DatePreset;
  onChange: (v: DatePreset) => void;
}

const PresetFilterTabs = React.memo(function PresetFilterTabs({ value, onChange }: Props) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Date filter presets">
      {PRESETS.map(({ value: v, label }) => (
        <button
          key={v}
          onClick={() => onChange(v)}
          aria-pressed={value === v}
          className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
            value === v
              ? "bg-slate-950 text-white"
              : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
});

export default PresetFilterTabs;
