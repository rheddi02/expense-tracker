import type { StoredTransaction } from "./transactionSchema";

export interface TransactionSummary {
  income: number;
  expense: number;
  net: number;
  count: number;
}

export function calcSummary(transactions: StoredTransaction[]): TransactionSummary {
  let income = 0;
  let expense = 0;
  for (const t of transactions) {
    if (t.type === "income") income += t.amount;
    else expense += t.amount;
  }
  return { income, expense, net: income - expense, count: transactions.length };
}

export function formatPeso(amount: number) {
  return `₱${Math.abs(amount).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;
}

export interface CategoryBreakdownItem {
  name: string;
  value: number;
  percent: number;
}

export function calcCategoryBreakdown(transactions: StoredTransaction[]): CategoryBreakdownItem[] {
  const expenses = transactions.filter((t) => t.type === "expense");
  const total = expenses.reduce((sum, t) => sum + t.amount, 0);
  if (total === 0) return [];

  const map = new Map<string, number>();
  for (const t of expenses) {
    map.set(t.categoryLabel, (map.get(t.categoryLabel) ?? 0) + t.amount);
  }

  return Array.from(map.entries())
    .map(([name, value]) => ({ name, value, percent: value / total }))
    .sort((a, b) => b.value - a.value);
}
