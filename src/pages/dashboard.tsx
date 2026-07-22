import { useMemo, useRef, useState, type TouchEvent } from 'react'
import { startOfDay, endOfDay, isWithinInterval, parseISO } from 'date-fns'
import type { StoredTransaction } from '../utils/transactionSchema'
import type { StoredDebt } from '../utils/debtsSchema'
import { getUnsettledDebtTotals } from '../utils/debtsSchema'
import CategoryBreakdown from '../components/CategoryBreakdown'

type Props = {
  transactions: StoredTransaction[]
  debts: StoredDebt[]
  onRefresh: () => Promise<void>
  onAddTransaction: (type: "income" | "expense") => void
}

export default function DashboardPage({ transactions, debts, onRefresh, onAddTransaction }: Props) {
  const totals = useMemo(() => {
    const income = transactions
      .filter((item) => item.type === 'income')
      .reduce((sum, item) => sum + item.amount, 0)
    const expense = transactions
      .filter((item) => item.type === 'expense')
      .reduce((sum, item) => sum + item.amount, 0)
    const balance = income - expense

    const { owedToMe, owedByMe } = getUnsettledDebtTotals(debts)

    return {
      income,
      expense,
      balance,
      grossBalance: balance + owedToMe - owedByMe,
    }
  }, [transactions, debts])

  const todayReport = useMemo(() => {
    const now = new Date()
    const start = startOfDay(now)
    const end = endOfDay(now)
    const todayTx = transactions.filter((t) =>
      isWithinInterval(parseISO(t.date), { start, end })
    )
    const income = todayTx
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0)
    const expense = todayTx
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0)
    return { income, expense, net: income - expense }
  }, [transactions])

  const recentTransactions = transactions.slice(0, 5)
  const [isQrExpanded, setIsQrExpanded] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const touchStartY = useRef<number | null>(null)
  const dragging = useRef(false)
  const THRESHOLD = 70

  const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    if (window.scrollY === 0 && !isRefreshing) {
      touchStartY.current = event.touches[0].clientY
      dragging.current = true
    }
  }

  const handleTouchMove = (event: TouchEvent<HTMLDivElement>) => {
    if (!dragging.current || touchStartY.current === null) return

    const currentY = event.touches[0].clientY
    const delta = currentY - touchStartY.current

    if (delta > 0) {
      event.preventDefault()
      setPullDistance(Math.min(delta, 120))
    }
  }

  const resetPull = () => {
    setPullDistance(0)
    dragging.current = false
    touchStartY.current = null
  }

  const handleTouchEnd = async () => {
    if (!dragging.current) return

    if (pullDistance >= THRESHOLD) {
      setIsRefreshing(true)
      await onRefresh()
      setIsRefreshing(false)
    }

    resetPull()
  }

  return (
    <div
      className="space-y-6 text-left"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className="flex items-center justify-center text-sm text-muted-foreground transition-all duration-200"
        style={{ height: pullDistance > 0 || isRefreshing ? 40 : 0, opacity: pullDistance > 0 || isRefreshing ? 1 : 0 }}
      >
        {isRefreshing ? 'Refreshing...' : pullDistance >= THRESHOLD ? 'Release to refresh' : 'Pull down to refresh'}
      </div>
      <header className="">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Welcome</p>
        <h1 className="text-2xl font-semibold text-foreground">
            Dashboard
          </h1>
      </header>

      <div className="space-y-4">
        <div className="rounded-3xl border border-slate-200 bg-slate-950 p-6 text-white">
          <div className="space-y-4">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Total Balance</p>
              <p className="mt-2 text-3xl font-semibold">₱{totals.balance.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</p>
              <div className="mt-3 flex items-center justify-between rounded-xl bg-slate-900/60 px-3 py-2">
                <span className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Without Debts</span>
                <span className="text-sm font-semibold text-slate-200">₱{totals.grossBalance.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-slate-900 p-3 cursor-pointer hover:bg-slate-800 transition-colors" onClick={() => onAddTransaction("income")}>
                <p className="text-xs text-slate-400">Income</p>
                <p className="mt-2 text-xl font-semibold text-emerald-400">₱{totals.income.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</p>
              </div>
              <div className="rounded-2xl bg-slate-900 p-3 cursor-pointer hover:bg-slate-800 transition-colors" onClick={() => onAddTransaction("expense")}>
                <p className="text-xs text-slate-400">Expense</p>
                <p className="mt-2 text-xl font-semibold text-rose-400">₱{totals.expense.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</p>
              </div>
            </div>
          </div>
        </div>

        <div
          className="rounded-3xl border border-border bg-card p-4 shadow-sm flex items-center gap-4 cursor-pointer"
          onClick={() => setIsQrExpanded(true)}
        >
          <img
            src="/expense-tracker/gcash-qr.png"
            alt="GCash QR Code"
            className="w-24 h-24 shrink-0 rounded-2xl"
          />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">Buy me a coffee</p>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              Scan the QR with GCash to send a tip. Thank you!
            </p>
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-foreground">Today's Report</p>
            {todayReport.net > 0 ? (
              <span className="rounded-full bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                +₱{todayReport.net.toLocaleString('en-PH', { minimumFractionDigits: 2 })} Surplus
              </span>
            ) : todayReport.net < 0 ? (
              <span className="rounded-full bg-rose-50 dark:bg-rose-500/10 px-3 py-1 text-xs font-semibold text-rose-700 dark:text-rose-400">
                -₱{Math.abs(todayReport.net).toLocaleString('en-PH', { minimumFractionDigits: 2 })} Over Budget
              </span>
            ) : (
              <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">Balanced</span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 p-3">
              <p className="text-xs text-emerald-600 dark:text-emerald-400">Income</p>
              <p className="mt-1 text-lg font-semibold text-emerald-700 dark:text-emerald-400">₱{todayReport.income.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="rounded-2xl bg-rose-50 dark:bg-rose-500/10 p-3">
              <p className="text-xs text-rose-600 dark:text-rose-400">Expense</p>
              <p className="mt-1 text-lg font-semibold text-rose-700 dark:text-rose-400">₱{todayReport.expense.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</p>
            </div>
          </div>
        </div>

        <CategoryBreakdown transactions={transactions} />

        {recentTransactions.length > 0 && (
          <div className="rounded-3xl border border-border bg-card p-4 shadow-sm">
            <p className="mb-4 text-sm font-semibold text-foreground">Recent Transactions</p>
            <div className="space-y-2">
              {recentTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between rounded-2xl bg-muted p-3">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">{transaction.categoryLabel}</p>
                    <p className="text-xs text-muted-foreground">{new Date(transaction.date).toLocaleString('en-PH', { dateStyle: 'short', timeStyle: 'short' })}</p>
                  </div>
                  <p className={`text-sm font-semibold ${transaction.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    {transaction.type === 'expense' ? '-' : '+'} ₱{transaction.amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {isQrExpanded && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6"
          onClick={() => setIsQrExpanded(false)}
        >
          <img
            src="/expense-tracker/gcash-qr.png"
            alt="GCash QR Code"
            className="w-72 h-72 rounded-3xl shadow-xl"
          />
        </div>
      )}
    </div>
  )
}
