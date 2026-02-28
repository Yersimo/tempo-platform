import { z } from 'zod'

// Common reusable schemas for API validation

export const uuid = z.string().uuid('Invalid UUID format')

export const paginationParams = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(200).default(50),
})

export const dateString = z.string().regex(
  /^\d{4}-\d{2}(-\d{2})?$/,
  'Date must be in YYYY-MM or YYYY-MM-DD format'
)

export const periodString = z.string().regex(
  /^\d{4}-\d{2}$/,
  'Period must be in YYYY-MM format'
)

export const crudAction = z.enum(['create', 'update', 'delete'])

export const genericMutation = z.object({
  action: crudAction,
  entity: z.string().min(1, 'Entity is required'),
  id: z.string().optional(),
  data: z.record(z.string(), z.unknown()).optional(),
}).refine(
  (val) => !(val.action === 'update' || val.action === 'delete') || !!val.id,
  { message: 'id is required for update/delete actions', path: ['id'] }
).refine(
  (val) => !(val.action === 'create' || val.action === 'update') || !!val.data,
  { message: 'data is required for create/update actions', path: ['data'] }
)

export const currencyCode = z.string().min(3).max(3).toUpperCase()

export const positiveAmount = z.number().positive('Amount must be positive')

export const nonNegativeAmount = z.number().min(0, 'Amount cannot be negative')

/** Format Zod validation issues into a human-readable error string */
export function formatZodError(error: { issues: Array<{ path: PropertyKey[]; message: string }> }): string {
  return error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join('; ')
}
