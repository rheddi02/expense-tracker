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
