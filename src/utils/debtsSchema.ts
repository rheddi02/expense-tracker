import { z } from 'zod'

export const debtSchema = z.object({
  person_name: z.string().min(1, 'Name is required').max(100),

  amount: z
    .string()
    .min(1, 'Amount is required')
    .refine((v) => Number(v) > 0, 'Amount must be greater than 0'),

  type: z.enum(['lent', 'borrowed']),

  borrow_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date'),

  payment_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date')
    .optional()
    .or(z.literal('')),

  note: z.string().max(200).optional(),

  category: z.enum(['cash', 'digital']),
})

export type DebtFormValues = z.infer<typeof debtSchema>

export type StoredDebt = {
  id: string
  user_id?: string | null
  person_name: string
  amount: number
  type: 'lent' | 'borrowed'
  borrow_date: string
  payment_date?: string | null
  is_settled: number
  settled_amount: number
  offset_ref_id?: string | null
  category: 'cash' | 'digital'
  note?: string | null
  created_at: string
}
