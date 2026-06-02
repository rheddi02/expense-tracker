import { useMemo, useState } from 'react'
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import type { StoredTransaction } from '../utils/transactionSchema'
import { calcCategoryBreakdown, formatPeso } from '../utils/transactionCalculations'
import { filterByDateRange, type DatePreset, type DateRange } from '../utils/dateFilters'
import PresetFilterTabs from './filters/PresetFilterTabs'
import DateRangePicker from './filters/DateRangePicker'

const COLORS = [
  '#F87171', // rose
  '#FB923C', // orange
  '#FBBF24', // amber
  '#34D399', // emerald
  '#60A5FA', // blue
  '#A78BFA', // violet
  '#F472B6', // pink
]

const CHART_PRESETS: { value: DatePreset; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'this_week', label: 'This Week' },
  { value: 'this_month', label: 'This Month' },
  { value: 'custom', label: 'Custom' },
]

const PRESET_LABELS: Record<DatePreset, string> = {
  all: 'All',
  today: 'Today',
  yesterday: 'Yesterday',
  this_week: 'This Week',
  this_month: 'This Month',
  custom: 'Custom',
}

type Props = {
  transactions: StoredTransaction[]
}

export default function CategoryBreakdown({ transactions }: Props) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [preset, setPreset] = useState<DatePreset>('this_month')
  const [customRange, setCustomRange] = useState<DateRange>({ from: undefined, to: undefined })

  const filtered = useMemo(
    () => filterByDateRange(transactions, preset, customRange),
    [transactions, preset, customRange]
  )

  const breakdown = useMemo(() => calcCategoryBreakdown(filtered), [filtered])

  const insights = useMemo(() => {
    if (breakdown.length === 0) return []

    const top = breakdown[0]
    const lines: string[] = []

    lines.push(
      `Your top spending category is ${top.name}, accounting for ${(top.percent * 100).toFixed(0)}% of total expenses.`
    )

    if (top.percent > 0.5) {
      lines.push(
        `More than half your spending goes to ${top.name} — consider reviewing these expenses.`
      )
    }

    if (breakdown.length > 1) {
      lines.push(`You spent across ${breakdown.length} categories this period.`)
    }

    return lines
  }, [breakdown])

  const activeLabel = preset === 'custom' && customRange.from
    ? (() => {
        const from = customRange.from!.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })
        const to = customRange.to ? ` – ${customRange.to.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}` : ''
        return `${from}${to}`
      })()
    : PRESET_LABELS[preset]

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between mb-1">
        <div>
          <p className="text-sm font-semibold text-slate-900">Spending by Category</p>
          <p className="text-xs text-slate-400">Where your money is going</p>
        </div>
        <button
          onClick={() => setIsExpanded((v) => !v)}
          className="flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
          aria-label={isExpanded ? 'Collapse chart' : 'Expand chart'}
        >
          <span>{activeLabel}</span>
          <span className="text-slate-400">{isExpanded ? '▴' : '▾'}</span>
        </button>
      </div>

      {isExpanded && (
        <div className="mt-3 space-y-3">
          <PresetFilterTabs value={preset} onChange={setPreset} presets={CHART_PRESETS} />
          {preset === 'custom' && (
            <DateRangePicker value={customRange} onChange={setCustomRange} />
          )}
        </div>
      )}

      <div className="mt-3">
        {breakdown.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-400">No expense data for this period.</p>
        ) : (
          <div className="space-y-4">
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={breakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={95}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {breakdown.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => typeof value === 'number' ? formatPeso(value) : value}
                  contentStyle={{ borderRadius: '0.75rem', border: '1px solid #E2E8F0', fontSize: '0.75rem' }}
                />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: '0.75rem' }}
                />
              </PieChart>
            </ResponsiveContainer>

            <div className="rounded-2xl bg-slate-50 p-3 space-y-1.5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Insights</p>
              {insights.map((line, i) => (
                <p key={i} className="text-xs text-slate-700 leading-relaxed">
                  • {line}
                </p>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
