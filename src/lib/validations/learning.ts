import { z } from 'zod'
import { uuid } from './common'

export const enrollBody = z.object({
  action: z.literal('enroll'),
  employeeId: uuid,
  courseId: uuid,
})

export const dropBody = z.object({
  action: z.literal('drop'),
  enrollmentId: uuid,
})

export const updateProgressBody = z.object({
  action: z.literal('update-progress'),
  enrollmentId: uuid,
  progress: z.number().int().min(0).max(100),
  blockId: uuid.optional(),
})

export const createRuleBody = z.object({
  action: z.literal('create-rule'),
  rule: z.object({
    name: z.string().min(1, 'Rule name is required').max(200),
    description: z.string().max(1000).optional(),
    departmentId: z.string().optional(),
    role: z.string().optional(),
    jobTitle: z.string().optional(),
    courseIds: z.array(z.string()).min(1, 'At least one course is required'),
    triggerEvent: z.enum(['new_hire', 'role_change', 'department_change', 'manual']),
    isActive: z.boolean().default(true),
  }),
})

export const processAutoEnrollBody = z.object({
  action: z.literal('process-auto-enroll'),
})

export const createPathBody = z.object({
  action: z.literal('create-path'),
  path: z.object({
    name: z.string().min(1, 'Path name is required').max(200),
    description: z.string().max(2000).optional(),
    courseIds: z.array(z.string()).min(1, 'At least one course is required'),
    targetRoles: z.array(z.string()).optional(),
    estimatedHours: z.number().positive().optional(),
  }),
})

export const submitQuizBody = z.object({
  action: z.literal('submit-quiz'),
  employeeId: uuid,
  courseContentId: uuid,
  answers: z.array(
    z.object({
      questionId: uuid,
      answer: z.string().min(1, 'Answer is required'),
    })
  ).min(1, 'At least one answer is required'),
})

export const issueCertificateBody = z.object({
  action: z.literal('issue-certificate'),
  employeeId: uuid,
  courseId: uuid,
  enrollmentId: uuid.optional(),
})

export const trackBlockProgressBody = z.object({
  action: z.literal('track-block-progress'),
  enrollmentId: uuid,
  blockId: uuid,
  data: z.object({
    progressPercent: z.number().min(0).max(100).optional(),
    status: z.enum(['not_started', 'in_progress', 'completed']).optional(),
    timeSpentMinutes: z.number().min(0).optional(),
    score: z.number().min(0).max(100).optional(),
    attempts: z.number().int().min(0).optional(),
  }),
})

export const learningPostBody = z.discriminatedUnion('action', [
  enrollBody,
  dropBody,
  updateProgressBody,
  createRuleBody,
  processAutoEnrollBody,
  createPathBody,
  submitQuizBody,
  issueCertificateBody,
  trackBlockProgressBody,
])
