// ─── Documentation Type System ─────────────────────────────────────────────
// Structured types for all module documentation. These types are consumed by
// both the in-app renderer and the PDF generator, ensuring consistency.

export interface DocStep {
  number: number
  title: string
  description: string
  screenshotKey?: string // maps to /public/docs/screenshots/{key}.png
  tip?: string
}

export interface DocWorkflow {
  id: string
  title: string
  description: string
  steps: DocStep[]
  prerequisites?: string[]
  estimatedTime?: string // e.g. "5 minutes"
  roles?: ('owner' | 'admin' | 'hrbp' | 'manager' | 'employee')[]
}

export interface DocFaq {
  question: string
  answer: string
}

export interface DocPermission {
  role: string
  capabilities: string[]
}

export type DocGroup = 'core' | 'people' | 'operations' | 'it-finance' | 'strategic' | 'additional'

export interface ModuleDoc {
  slug: string
  title: string
  subtitle: string
  icon: string // Lucide icon name
  group: DocGroup
  lastUpdated: string // ISO date
  version: string

  overview: {
    description: string
    keyFeatures: string[]
    screenshotKey?: string
  }

  workflows: DocWorkflow[]
  faqs: DocFaq[]
  relatedModules: string[] // slugs
  tips: string[]
  permissions: DocPermission[]
}

export const DOC_GROUP_LABELS: Record<DocGroup, string> = {
  core: 'Core',
  people: 'People',
  operations: 'Operations',
  'it-finance': 'IT & Finance',
  strategic: 'Strategic',
  additional: 'Additional',
}

export const DOC_GROUP_ORDER: DocGroup[] = [
  'core', 'people', 'operations', 'it-finance', 'strategic', 'additional',
]
