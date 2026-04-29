import { useMemo } from 'react'
import type { StoredTransaction } from '../utils/transactionSchema'

type Props = {
  transactions: StoredTransaction[]
}

export default function DashboardPage({ transactions }: Props) {
  const totals = useMemo(() => {
    const income = transactions
      .filter((item) => item.type === 'income')
      .reduce((sum, item) => sum + item.amount, 0)
    const expense = transactions
      .filter((item) => item.type === 'expense')
      .reduce((sum, item) => sum + item.amount, 0)

    return {
      income,
      expense,
      balance: income - expense,
    }
  }, [transactions])

  const recentTransactions = transactions.slice(0, 5)

  return (
    <div className="space-y-6 text-left">
      <header className="">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Welcome</p>
        <h1 className="text-2xl font-semibold text-slate-900! mt-0!">User</h1>
      </header>

      <div className="space-y-4">
        <div className="rounded-3xl border border-slate-200 bg-slate-950 p-6 text-white">
          <div className="space-y-4">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Total Balance</p>
              <p className="mt-2 text-3xl font-semibold">₱{totals.balance.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-slate-900 p-3">
                <p className="text-xs text-slate-400">Income</p>
                <p className="mt-2 text-xl font-semibold text-emerald-400">₱{totals.income.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</p>
              </div>
              <div className="rounded-2xl bg-slate-900 p-3">
                <p className="text-xs text-slate-400">Expense</p>
                <p className="mt-2 text-xl font-semibold text-rose-400">₱{totals.expense.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</p>
              </div>
            </div>
          </div>
        </div>

        {recentTransactions.length > 0 && (
          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="mb-4 text-sm font-semibold">Recent Transactions</p>
            <div className="space-y-2">
              {recentTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between rounded-2xl bg-slate-50 p-3">
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{transaction.categoryLabel}</p>
                    <p className="text-xs text-slate-500">{transaction.date}</p>
                  </div>
                  <p className={`text-sm font-semibold ${transaction.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {transaction.type === 'expense' ? '-' : '+'} ₱{transaction.amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
