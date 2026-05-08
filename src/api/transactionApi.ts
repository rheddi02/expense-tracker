import { getSession } from '@/auth/authService'
import { addTransaction as dbAddTransaction, getTransactions as dbGetTransactions, updateTransaction as dbUpdateTransaction, deleteTransaction as dbDeleteTransaction } from '../utils/db'

type TransactionInput = {
  type: 'income' | 'expense'
  amount: number
  categoryId: string
  date: string
  note?: string | null
}

export async function addTransaction(data: TransactionInput) {
  return await dbAddTransaction(data);
}

export async function getTransactions({ month, year }: { month?: number; year?: number } = {}) {
  return await dbGetTransactions({ month, year });
}

export async function updateTransaction(id: string, data: TransactionInput) {
  return await dbUpdateTransaction(id, data);
}

export async function deleteTransaction(id: string) {
  const session = await getSession();
  if (!session?.user) return
  return await dbDeleteTransaction(id, session?.user.id);
}