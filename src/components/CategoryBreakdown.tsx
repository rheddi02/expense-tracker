import { useMemo } from 'react'
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
import { ChartContainer } from './admin/ChartContainer'

const COLORS = [
  '#F87171', // rose
  '#FB923C', // orange
  '#FBBF24', // amber
  '#34D399', // emerald
  '#60A5FA', // blue
  '#A78BFA', // violet
  '#F472B6', // pink
]

type Props = {
  transactions: StoredTransaction[]
}

export default function CategoryBreakdown({ transactions }: Props) {
  const breakdown = useMemo(() => calcCategoryBreakdown(transactions), [transactions])

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

  return (
    <ChartContainer title="Spending by Category" subtitle="Where your money is going">
      {breakdown.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-400">No expense data yet.</p>
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
    </ChartContainer>
  )
}
