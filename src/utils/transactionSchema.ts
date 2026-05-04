import { z } from 'zod'

export const transactionSchema = z.object({
  type: z.enum(['income', 'expense']),

  amount: z
    .string()
    .min(1, 'Amount is required')
    .refine((value) => Number(value) > 0, 'Amount must be greater than 0'),

  categoryId: z.string().uuid('Pick a category'),

  date: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/, 'Invalid date and time format'),

  note: z.string().max(200).optional(),
})

export type TransactionFormValues = z.infer<typeof transactionSchema>
export type StoredTransaction = Omit<TransactionFormValues, 'amount'> & {
  id: string
  amount: number
  categoryLabel: string
  category_id?: string
}
