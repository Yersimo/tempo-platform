// Lightweight API validation for Tempo Platform
// Custom validation approach (no Zod dependency) using TypeScript
import { NextResponse } from 'next/server'

// ---------------------------------------------------------------------------
// Core validation primitives
// ---------------------------------------------------------------------------

type ValidationError = { path: string; message: string }

interface ValidationResult<T> {
  success: boolean
  data?: T
  errors?: ValidationError[]
}

type Validator<T> = (value: unknown, path: string) => ValidationResult<T>

// ---------------------------------------------------------------------------
// Primitive validators
// ---------------------------------------------------------------------------

function string(opts?: {
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  patternMessage?: string
}): Validator<string> {
  return (value, path) => {
    if (typeof value !== 'string') {
      return { success: false, errors: [{ path, message: 'Expected a string' }] }
    }
    if (opts?.minLength !== undefined && value.length < opts.minLength) {
      return { success: false, errors: [{ path, message: `Must be at least ${opts.minLength} characters` }] }
    }
    if (opts?.maxLength !== undefined && value.length > opts.maxLength) {
      return { success: false, errors: [{ path, message: `Must be at most ${opts.maxLength} characters` }] }
    }
    if (opts?.pattern && !opts.pattern.test(value)) {
      return { success: false, errors: [{ path, message: opts.patternMessage || 'Invalid format' }] }
    }
    return { success: true, data: value }
  }
}

function number(opts?: { min?: number; max?: number; integer?: boolean }): Validator<number> {
  return (value, path) => {
    if (typeof value !== 'number' || Number.isNaN(value)) {
      return { success: false, errors: [{ path, message: 'Expected a number' }] }
    }
    if (opts?.integer && !Number.isInteger(value)) {
      return { success: false, errors: [{ path, message: 'Must be an integer' }] }
    }
    if (opts?.min !== undefined && value < opts.min) {
      return { success: false, errors: [{ path, message: `Must be at least ${opts.min}` }] }
    }
    if (opts?.max !== undefined && value > opts.max) {
      return { success: false, errors: [{ path, message: `Must be at most ${opts.max}` }] }
    }
    return { success: true, data: value }
  }
}

function boolean(): Validator<boolean> {
  return (value, path) => {
    if (typeof value !== 'boolean') {
      return { success: false, errors: [{ path, message: 'Expected a boolean' }] }
    }
    return { success: true, data: value }
  }
}

function literal<T extends string | number | boolean>(expected: T): Validator<T> {
  return (value, path) => {
    if (value !== expected) {
      return { success: false, errors: [{ path, message: `Expected "${String(expected)}"` }] }
    }
    return { success: true, data: expected }
  }
}

function enumValues<T extends string>(allowed: readonly T[]): Validator<T> {
  return (value, path) => {
    if (typeof value !== 'string' || !allowed.includes(value as T)) {
      return {
        success: false,
        errors: [{ path, message: `Must be one of: ${allowed.join(', ')}` }],
      }
    }
    return { success: true, data: value as T }
  }
}

// ---------------------------------------------------------------------------
// Composite validators
// ---------------------------------------------------------------------------

function array<T>(itemValidator: Validator<T>, opts?: { minLength?: number; maxLength?: number }): Validator<T[]> {
  return (value, path) => {
    if (!Array.isArray(value)) {
      return { success: false, errors: [{ path, message: 'Expected an array' }] }
    }
    if (opts?.minLength !== undefined && value.length < opts.minLength) {
      return { success: false, errors: [{ path, message: `Array must have at least ${opts.minLength} items` }] }
    }
    if (opts?.maxLength !== undefined && value.length > opts.maxLength) {
      return { success: false, errors: [{ path, message: `Array must have at most ${opts.maxLength} items` }] }
    }
    const results: T[] = []
    const errors: ValidationError[] = []
    for (let i = 0; i < value.length; i++) {
      const result = itemValidator(value[i], `${path}[${i}]`)
      if (result.success) {
        results.push(result.data!)
      } else {
        errors.push(...(result.errors || []))
      }
    }
    if (errors.length > 0) return { success: false, errors }
    return { success: true, data: results }
  }
}

type ObjectShape = Record<string, Validator<unknown>>

type InferShape<S extends ObjectShape> = {
  [K in keyof S]: S[K] extends Validator<infer V> ? V : never
}

function object<S extends ObjectShape>(shape: S): Validator<InferShape<S>> {
  return (value, path) => {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      return { success: false, errors: [{ path, message: 'Expected an object' }] }
    }
    const record = value as Record<string, unknown>
    const data: Record<string, unknown> = {}
    const errors: ValidationError[] = []

    for (const key of Object.keys(shape)) {
      const fieldPath = path ? `${path}.${key}` : key
      const result = shape[key](record[key], fieldPath)
      if (result.success) {
        data[key] = result.data
      } else {
        errors.push(...(result.errors || []))
      }
    }
    if (errors.length > 0) return { success: false, errors }
    return { success: true, data: data as InferShape<S> }
  }
}

function optional<T>(validator: Validator<T>): Validator<T | undefined> {
  return (value, path) => {
    if (value === undefined || value === null) {
      return { success: true, data: undefined }
    }
    return validator(value, path)
  }
}

function nullable<T>(validator: Validator<T>): Validator<T | null> {
  return (value, path) => {
    if (value === null) {
      return { success: true, data: null }
    }
    return validator(value, path) as ValidationResult<T | null>
  }
}

// ---------------------------------------------------------------------------
// Common reusable validators
// ---------------------------------------------------------------------------

const email = () =>
  string({
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    patternMessage: 'Must be a valid email address',
  })

const isoDate = () =>
  string({
    pattern: /^\d{4}-\d{2}-\d{2}$/,
    patternMessage: 'Must be a date in YYYY-MM-DD format',
  })

const isoDateTime = () =>
  string({
    pattern: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/,
    patternMessage: 'Must be an ISO 8601 datetime',
  })

const id = () => string({ minLength: 1, maxLength: 100 })

const currency = () =>
  string({
    pattern: /^[A-Z]{3}$/,
    patternMessage: 'Must be a 3-letter ISO currency code (e.g., USD)',
  })

const positiveNumber = () => number({ min: 0 })

const percentage = () => number({ min: 0, max: 100 })

// ---------------------------------------------------------------------------
// Schema type alias for external use
// ---------------------------------------------------------------------------

export type Schema<T> = Validator<T>

// ---------------------------------------------------------------------------
// 1. Employee schemas
// ---------------------------------------------------------------------------

export const CreateEmployeeSchema = object({
  full_name: string({ minLength: 1, maxLength: 200 }),
  email: email(),
  department_id: id(),
  job_title: string({ minLength: 1, maxLength: 200 }),
  level: enumValues(['Associate', 'Junior', 'Mid', 'Senior', 'Senior Manager', 'Manager', 'Director', 'Executive'] as const),
  country: string({ minLength: 1, maxLength: 100 }),
  role: enumValues(['owner', 'admin', 'manager', 'employee'] as const),
  phone: optional(string({ maxLength: 50 })),
  avatar_url: optional(nullable(string())),
  start_date: optional(isoDate()),
})

export const UpdateEmployeeSchema = object({
  id: id(),
  full_name: optional(string({ minLength: 1, maxLength: 200 })),
  email: optional(email()),
  department_id: optional(id()),
  job_title: optional(string({ minLength: 1, maxLength: 200 })),
  level: optional(enumValues(['Associate', 'Junior', 'Mid', 'Senior', 'Senior Manager', 'Manager', 'Director', 'Executive'] as const)),
  country: optional(string({ minLength: 1, maxLength: 100 })),
  role: optional(enumValues(['owner', 'admin', 'manager', 'employee'] as const)),
  phone: optional(string({ maxLength: 50 })),
  avatar_url: optional(nullable(string())),
})

// ---------------------------------------------------------------------------
// 2. Goal schemas
// ---------------------------------------------------------------------------

export const CreateGoalSchema = object({
  employee_id: id(),
  title: string({ minLength: 1, maxLength: 300 }),
  description: optional(string({ maxLength: 2000 })),
  category: enumValues(['business', 'project', 'development', 'compliance'] as const),
  status: optional(enumValues(['on_track', 'at_risk', 'behind', 'completed'] as const)),
  progress: optional(percentage()),
  start_date: isoDate(),
  due_date: isoDate(),
})

export const UpdateGoalSchema = object({
  id: id(),
  title: optional(string({ minLength: 1, maxLength: 300 })),
  description: optional(string({ maxLength: 2000 })),
  category: optional(enumValues(['business', 'project', 'development', 'compliance'] as const)),
  status: optional(enumValues(['on_track', 'at_risk', 'behind', 'completed'] as const)),
  progress: optional(percentage()),
  start_date: optional(isoDate()),
  due_date: optional(isoDate()),
})

// ---------------------------------------------------------------------------
// 3. Review schemas
// ---------------------------------------------------------------------------

const ratingsValidator = object({
  leadership: optional(number({ min: 1, max: 5, integer: true })),
  execution: optional(number({ min: 1, max: 5, integer: true })),
  collaboration: optional(number({ min: 1, max: 5, integer: true })),
  innovation: optional(number({ min: 1, max: 5, integer: true })),
})

export const CreateReviewSchema = object({
  cycle_id: id(),
  employee_id: id(),
  reviewer_id: id(),
  type: enumValues(['manager', 'self', 'peer', '360'] as const),
  status: optional(enumValues(['pending', 'in_progress', 'submitted', 'acknowledged'] as const)),
  overall_rating: optional(nullable(number({ min: 1, max: 5, integer: true }))),
  ratings: optional(nullable(ratingsValidator)),
  comments: optional(nullable(string({ maxLength: 5000 }))),
})

export const UpdateReviewSchema = object({
  id: id(),
  status: optional(enumValues(['pending', 'in_progress', 'submitted', 'acknowledged'] as const)),
  overall_rating: optional(nullable(number({ min: 1, max: 5, integer: true }))),
  ratings: optional(nullable(ratingsValidator)),
  comments: optional(nullable(string({ maxLength: 5000 }))),
})

// ---------------------------------------------------------------------------
// 4. Payroll schemas
// ---------------------------------------------------------------------------

export const CreatePayRunSchema = object({
  period: string({
    minLength: 1,
    pattern: /^\d{4}-\d{2}$/,
    patternMessage: 'Must be in YYYY-MM format (e.g., "2026-02")',
  }),
  currency: optional(currency()),
  employee_ids: optional(array(id())),
  notes: optional(string({ maxLength: 2000 })),
})

export const AddPayrollEntrySchema = object({
  payroll_run_id: id(),
  employee_id: id(),
  gross_pay: positiveNumber(),
  bonus: optional(positiveNumber()),
  overtime: optional(positiveNumber()),
  other_deductions: optional(positiveNumber()),
  currency: optional(currency()),
})

// ---------------------------------------------------------------------------
// 5. Leave request schemas
// ---------------------------------------------------------------------------

export const CreateLeaveRequestSchema = object({
  employee_id: id(),
  type: enumValues(['annual', 'sick', 'personal', 'maternity', 'paternity', 'bereavement', 'unpaid'] as const),
  start_date: isoDate(),
  end_date: isoDate(),
  days: number({ min: 0.5, integer: false }),
  reason: optional(string({ maxLength: 1000 })),
})

export const UpdateLeaveStatusSchema = object({
  id: id(),
  status: enumValues(['pending', 'approved', 'rejected', 'cancelled'] as const),
  approved_by: optional(id()),
  rejection_reason: optional(string({ maxLength: 1000 })),
})

// ---------------------------------------------------------------------------
// 6. Expense schemas
// ---------------------------------------------------------------------------

const expenseItemValidator = object({
  category: string({ minLength: 1, maxLength: 100 }),
  description: string({ minLength: 1, maxLength: 500 }),
  amount: positiveNumber(),
  receipt_url: optional(string()),
  date: optional(isoDate()),
})

export const CreateExpenseReportSchema = object({
  employee_id: id(),
  title: string({ minLength: 1, maxLength: 300 }),
  currency: optional(currency()),
  items: optional(array(expenseItemValidator)),
  notes: optional(string({ maxLength: 2000 })),
})

export const AddExpenseItemSchema = object({
  expense_report_id: id(),
  category: string({ minLength: 1, maxLength: 100 }),
  description: string({ minLength: 1, maxLength: 500 }),
  amount: positiveNumber(),
  receipt_url: optional(string()),
  date: optional(isoDate()),
})

// ---------------------------------------------------------------------------
// 7. Job posting schemas
// ---------------------------------------------------------------------------

export const CreateJobPostingSchema = object({
  title: string({ minLength: 1, maxLength: 300 }),
  department_id: id(),
  location: string({ minLength: 1, maxLength: 200 }),
  type: enumValues(['full_time', 'part_time', 'contract', 'internship', 'temporary'] as const),
  description: string({ minLength: 1, maxLength: 10000 }),
  requirements: optional(string({ maxLength: 5000 })),
  salary_min: optional(positiveNumber()),
  salary_max: optional(positiveNumber()),
  currency: optional(currency()),
  status: optional(enumValues(['draft', 'open', 'closed', 'paused'] as const)),
})

export const UpdateJobPostingSchema = object({
  id: id(),
  title: optional(string({ minLength: 1, maxLength: 300 })),
  department_id: optional(id()),
  location: optional(string({ minLength: 1, maxLength: 200 })),
  type: optional(enumValues(['full_time', 'part_time', 'contract', 'internship', 'temporary'] as const)),
  description: optional(string({ minLength: 1, maxLength: 10000 })),
  requirements: optional(string({ maxLength: 5000 })),
  salary_min: optional(positiveNumber()),
  salary_max: optional(positiveNumber()),
  currency: optional(currency()),
  status: optional(enumValues(['draft', 'open', 'closed', 'paused'] as const)),
})

// ---------------------------------------------------------------------------
// 8. Application schemas
// ---------------------------------------------------------------------------

export const CreateApplicationSchema = object({
  job_id: id(),
  candidate_name: string({ minLength: 1, maxLength: 200 }),
  candidate_email: email(),
  resume_url: optional(string()),
  cover_letter: optional(string({ maxLength: 5000 })),
  source: optional(string({ maxLength: 100 })),
  notes: optional(nullable(string({ maxLength: 5000 }))),
})

export const UpdateApplicationStatusSchema = object({
  id: id(),
  status: enumValues(['new', 'screening', 'interview', 'offer', 'hired', 'rejected', 'withdrawn'] as const),
  stage: optional(string({ maxLength: 200 })),
  rating: optional(nullable(number({ min: 1, max: 5, integer: true }))),
  notes: optional(nullable(string({ maxLength: 5000 }))),
  rejection_reason: optional(string({ maxLength: 1000 })),
})

// ---------------------------------------------------------------------------
// 9. Benefit plan schemas
// ---------------------------------------------------------------------------

export const CreateBenefitPlanSchema = object({
  name: string({ minLength: 1, maxLength: 200 }),
  type: enumValues(['medical', 'dental', 'vision', 'life', 'disability', 'retirement', 'wellness', 'other'] as const),
  provider: string({ minLength: 1, maxLength: 200 }),
  cost_employee: positiveNumber(),
  cost_employer: positiveNumber(),
  currency: optional(currency()),
  description: optional(string({ maxLength: 2000 })),
  is_active: optional(boolean()),
})

export const UpdateBenefitPlanSchema = object({
  id: id(),
  name: optional(string({ minLength: 1, maxLength: 200 })),
  type: optional(enumValues(['medical', 'dental', 'vision', 'life', 'disability', 'retirement', 'wellness', 'other'] as const)),
  provider: optional(string({ minLength: 1, maxLength: 200 })),
  cost_employee: optional(positiveNumber()),
  cost_employer: optional(positiveNumber()),
  currency: optional(currency()),
  description: optional(string({ maxLength: 2000 })),
  is_active: optional(boolean()),
})

export const EnrollBenefitSchema = object({
  employee_id: id(),
  plan_id: id(),
  coverage_level: enumValues(['employee_only', 'employee_spouse', 'employee_child', 'family'] as const),
  effective_date: optional(isoDate()),
})

// ---------------------------------------------------------------------------
// 10. Course schemas
// ---------------------------------------------------------------------------

export const CreateCourseSchema = object({
  title: string({ minLength: 1, maxLength: 300 }),
  description: optional(string({ maxLength: 5000 })),
  category: string({ minLength: 1, maxLength: 100 }),
  duration_hours: number({ min: 0.5 }),
  format: enumValues(['online', 'classroom', 'blended', 'virtual_classroom'] as const),
  level: enumValues(['beginner', 'intermediate', 'advanced'] as const),
  is_mandatory: optional(boolean()),
  instructor: optional(string({ maxLength: 200 })),
  max_enrollment: optional(number({ min: 1, integer: true })),
})

export const UpdateCourseSchema = object({
  id: id(),
  title: optional(string({ minLength: 1, maxLength: 300 })),
  description: optional(string({ maxLength: 5000 })),
  category: optional(string({ minLength: 1, maxLength: 100 })),
  duration_hours: optional(number({ min: 0.5 })),
  format: optional(enumValues(['online', 'classroom', 'blended', 'virtual_classroom'] as const)),
  level: optional(enumValues(['beginner', 'intermediate', 'advanced'] as const)),
  is_mandatory: optional(boolean()),
  instructor: optional(string({ maxLength: 200 })),
  max_enrollment: optional(number({ min: 1, integer: true })),
})

export const EnrollCourseSchema = object({
  employee_id: id(),
  course_id: id(),
})

// ---------------------------------------------------------------------------
// 11. Survey schemas
// ---------------------------------------------------------------------------

export const CreateSurveySchema = object({
  title: string({ minLength: 1, maxLength: 300 }),
  type: enumValues(['pulse', 'enps', 'annual', 'onboarding', 'exit', 'custom'] as const),
  start_date: isoDate(),
  end_date: isoDate(),
  anonymous: optional(boolean()),
  description: optional(string({ maxLength: 2000 })),
  questions: optional(
    array(
      object({
        text: string({ minLength: 1, maxLength: 1000 }),
        type: enumValues(['rating', 'text', 'multiple_choice', 'yes_no'] as const),
        required: optional(boolean()),
        options: optional(array(string())),
      })
    )
  ),
})

export const UpdateSurveySchema = object({
  id: id(),
  title: optional(string({ minLength: 1, maxLength: 300 })),
  type: optional(enumValues(['pulse', 'enps', 'annual', 'onboarding', 'exit', 'custom'] as const)),
  status: optional(enumValues(['draft', 'active', 'closed'] as const)),
  start_date: optional(isoDate()),
  end_date: optional(isoDate()),
  anonymous: optional(boolean()),
  description: optional(string({ maxLength: 2000 })),
})

export const SubmitSurveyResponseSchema = object({
  survey_id: id(),
  respondent_id: optional(id()),
  answers: array(
    object({
      question_id: id(),
      value: string(),
    }),
    { minLength: 1 }
  ),
})

// ---------------------------------------------------------------------------
// 12. Project & task schemas
// ---------------------------------------------------------------------------

export const CreateProjectSchema = object({
  title: string({ minLength: 1, maxLength: 300 }),
  description: optional(string({ maxLength: 5000 })),
  status: optional(enumValues(['planning', 'active', 'on_hold', 'completed', 'cancelled'] as const)),
  owner_id: id(),
  start_date: isoDate(),
  end_date: isoDate(),
  budget: optional(positiveNumber()),
  currency: optional(currency()),
})

export const UpdateProjectSchema = object({
  id: id(),
  title: optional(string({ minLength: 1, maxLength: 300 })),
  description: optional(string({ maxLength: 5000 })),
  status: optional(enumValues(['planning', 'active', 'on_hold', 'completed', 'cancelled'] as const)),
  owner_id: optional(id()),
  start_date: optional(isoDate()),
  end_date: optional(isoDate()),
  budget: optional(positiveNumber()),
  currency: optional(currency()),
})

export const CreateTaskSchema = object({
  project_id: id(),
  milestone_id: optional(nullable(id())),
  title: string({ minLength: 1, maxLength: 300 }),
  description: optional(string({ maxLength: 5000 })),
  status: optional(enumValues(['todo', 'in_progress', 'review', 'done', 'blocked'] as const)),
  priority: optional(enumValues(['low', 'medium', 'high', 'critical'] as const)),
  assignee_id: optional(nullable(id())),
  due_date: optional(isoDate()),
  estimated_hours: optional(positiveNumber()),
  labels: optional(array(string())),
})

export const UpdateTaskSchema = object({
  id: id(),
  project_id: optional(id()),
  milestone_id: optional(nullable(id())),
  title: optional(string({ minLength: 1, maxLength: 300 })),
  description: optional(string({ maxLength: 5000 })),
  status: optional(enumValues(['todo', 'in_progress', 'review', 'done', 'blocked'] as const)),
  priority: optional(enumValues(['low', 'medium', 'high', 'critical'] as const)),
  assignee_id: optional(nullable(id())),
  due_date: optional(isoDate()),
  estimated_hours: optional(positiveNumber()),
  actual_hours: optional(positiveNumber()),
  labels: optional(array(string())),
})

// ---------------------------------------------------------------------------
// Generic request body validation helper
// ---------------------------------------------------------------------------

interface ValidateSuccess<T> {
  success: true
  data: T
}

interface ValidateFailure {
  success: false
  error: NextResponse
}

export type ValidateResult<T> = ValidateSuccess<T> | ValidateFailure

/**
 * Parse the JSON body from a NextRequest and validate it against a schema.
 *
 * Returns `{ success: true, data }` on success, or `{ success: false, error }`
 * with a 400 NextResponse containing clear error messages on failure.
 *
 * @example
 * ```ts
 * const result = await validateBody(request, CreateEmployeeSchema)
 * if (!result.success) return result.error
 * const employee = result.data
 * ```
 */
export async function validateBody<T>(
  request: Request,
  schema: Schema<T>
): Promise<ValidateResult<T>> {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return {
      success: false,
      error: NextResponse.json(
        {
          error: 'Invalid JSON',
          message: 'Request body must be valid JSON',
        },
        { status: 400 }
      ),
    }
  }

  const result = schema(body, '')

  if (result.success) {
    return { success: true, data: result.data! }
  }

  const fieldErrors = (result.errors || []).map((e) => ({
    field: e.path || '(root)',
    message: e.message,
  }))

  return {
    success: false,
    error: NextResponse.json(
      {
        error: 'Validation failed',
        message: `${fieldErrors.length} validation error${fieldErrors.length === 1 ? '' : 's'}`,
        details: fieldErrors,
      },
      { status: 400 }
    ),
  }
}

// ---------------------------------------------------------------------------
// Re-export builder functions for custom schemas
// ---------------------------------------------------------------------------

export const v = {
  string,
  number,
  boolean,
  literal,
  enum: enumValues,
  array,
  object,
  optional,
  nullable,
  email,
  isoDate,
  isoDateTime,
  id,
  currency,
  positiveNumber,
  percentage,
} as const
