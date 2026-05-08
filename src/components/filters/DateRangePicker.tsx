import React, { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import type { DateRange as DayPickerRange } from "react-day-picker";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Calendar } from "../ui/calendar";
import { cn } from "@/lib/utils";
import type { DateRange } from "../../utils/dateFilters";

interface Props {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

const DateRangePicker = React.memo(function DateRangePicker({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);

  const selected: DayPickerRange = { from: value.from, to: value.to };

  const label = (() => {
    if (value.from && value.to)
      return `${format(value.from, "MMM d")} – ${format(value.to, "MMM d, yyyy")}`;
    if (value.from) return `From ${format(value.from, "MMM d, yyyy")}`;
    if (value.to) return `Until ${format(value.to, "MMM d, yyyy")}`;
    return "Pick a date range";
  })();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          aria-label="Open date range picker"
          className={cn(
            "flex w-full items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm transition hover:border-slate-400",
            !value.from && !value.to ? "text-slate-400" : "text-slate-700",
          )}
        >
          <CalendarIcon size={16} className="shrink-0 text-slate-400" />
          <span className="flex-1 text-left">{label}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          selected={selected}
          onSelect={(range) => {
            onChange({ from: range?.from, to: range?.to });
          }}
          disabled={{ after: new Date() }}
          autoFocus
        />
        {(value.from || value.to) && (
          <div className="border-t border-slate-100 px-3 py-2">
            <button
              onClick={() => {
                onChange({ from: undefined, to: undefined });
                setOpen(false);
              }}
              className="text-xs text-slate-500 hover:text-slate-700"
            >
              Clear range
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
});

export default DateRangePicker;
