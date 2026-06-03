import {
  addDebt as dbAddDebt,
  getDebts as dbGetDebts,
  updateDebt as dbUpdateDebt,
  deleteDebt as dbDeleteDebt,
  settleDebt as dbSettleDebt,
} from '../utils/debtsDb'

type DebtInput = {
  person_name: string
  amount: number
  type: 'lent' | 'borrowed'
  borrow_date: string
  payment_date?: string | null
  note?: string | null
}

export async function addDebt(data: DebtInput & { user_id?: string }) {
  return await dbAddDebt(data)
}

export async function getDebts({ user_id }: { user_id?: string } = {}) {
  return await dbGetDebts({ user_id })
}

export async function updateDebt(id: string, data: DebtInput) {
  return await dbUpdateDebt(id, data)
}

export async function settleDebt(id: string) {
  return await dbSettleDebt(id)
}

export async function deleteDebt(id: string) {
  return await dbDeleteDebt(id)
}
