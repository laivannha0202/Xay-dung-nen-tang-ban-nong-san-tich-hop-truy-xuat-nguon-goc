import { z } from 'zod'
import { AppError } from './errors.js'

export function parse<T extends z.ZodTypeAny>(schema: T, input: unknown): z.infer<T> {
  const r = schema.safeParse(input)
  if (r.success) return r.data
  const fieldErrors: Record<string, string> = {}
  for (const issue of r.error.issues) {
    const key = issue.path.join('.') || '_'
    fieldErrors[key] ??= issue.message
  }
  throw new AppError(422, 'INVALID_DATA', 'Dữ liệu không hợp lệ.', fieldErrors)
}

export const QTY = z.coerce.number().positive('Số lượng phải lớn hơn 0').max(100000)
export const qty3 = z.string().or(z.number()).transform((v) => Number(v))
  .refine((n) => Number.isFinite(n) && n > 0, 'Số lượng phải lớn hơn 0')
  .refine((n) => Math.round(n * 1000) === n * 1000, 'Số lượng tối đa 3 chữ số thập phân')

export const pagination = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
})

export const uuid = z.string().uuid('Mã không hợp lệ')
