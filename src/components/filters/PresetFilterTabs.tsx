import React from "react";
import type { DatePreset } from "../../utils/dateFilters";

const DEFAULT_PRESETS: { value: DatePreset; label: string }[] = [
  { value: "all", label: "All" },
  { value: "yesterday", label: "Yesterday" },
  { value: "this_week", label: "This Week" },
  { value: "this_month", label: "This Month" },
  { value: "custom", label: "Custom" },
];

interface Props {
  value: DatePreset;
  onChange: (v: DatePreset) => void;
  presets?: { value: DatePreset; label: string }[];
}

const PresetFilterTabs = React.memo(function PresetFilterTabs({ value, onChange, presets = DEFAULT_PRESETS }: Props) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Date filter presets">
      {presets.map(({ value: v, label }) => (
        <button
          key={v}
          onClick={() => onChange(v)}
          aria-pressed={value === v}
          className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
            value === v
              ? "bg-primary text-primary-foreground"
              : "border border-border bg-card text-muted-foreground hover:bg-muted"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
});

export default PresetFilterTabs;
