import { z } from 'zod'

export const contactSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
  subject: z.string().min(1, 'Subject is required').max(150),
  message: z.string().min(1, 'Message is required').max(2000),
})

export type ContactFormValues = z.infer<typeof contactSchema>
