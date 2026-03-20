/**
 * Life Events -> Multiple Modules Integration
 *
 * When an employee reports a life event (marriage, birth, etc.):
 * 1. Trigger benefits enrollment window notification
 * 2. Update tax withholding suggestion
 * 3. Create an HR task for document collection
 *
 * All integrations are event-driven via the cross-module event bus.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Life event type */
export type LifeEventType =
  | 'marriage'
  | 'divorce'
  | 'birth'
  | 'adoption'
  | 'death_of_dependent'
  | 'disability'
  | 'relocation'
  | 'other'

/** Benefits enrollment window to open */
export interface BenefitsEnrollmentWindow {
  employeeId: string
  reason: string
  windowStartDate: string
  windowEndDate: string
  eligiblePlanTypes: string[]
  priority: 'high' | 'medium'
}

/** Tax withholding suggestion */
export interface TaxWithholdingSuggestion {
  employeeId: string
  reason: string
  suggestedAction: string
  previousAllowances?: number
  suggestedAllowances?: number
  filingStatusChange?: string
}

/** HR task for document collection */
export interface HRDocumentTask {
  employeeId: string
  title: string
  description: string
  category: 'life_event'
  priority: 'high' | 'medium' | 'low'
  requiredDocuments: string[]
  dueDate: string
}

/** Full result of processing a life event */
export interface LifeEventResult {
  employeeId: string
  eventType: LifeEventType
  benefitsWindow: BenefitsEnrollmentWindow
  taxSuggestion: TaxWithholdingSuggestion
  hrTask: HRDocumentTask
}

/** Store slice needed for life event operations */
export interface LifeEventsStoreSlice {
  addTask?: (data: Record<string, unknown>) => void
  addToast?: (toast: { type: string; title: string; description?: string }) => void
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Special enrollment window duration in days per event type */
const ENROLLMENT_WINDOW_DAYS: Record<LifeEventType, number> = {
  marriage: 30,
  divorce: 30,
  birth: 30,
  adoption: 30,
  death_of_dependent: 30,
  disability: 60,
  relocation: 30,
  other: 30,
}

/** Eligible benefit plan types per life event */
const ELIGIBLE_PLAN_TYPES: Record<LifeEventType, string[]> = {
  marriage: ['health', 'dental', 'vision', 'life', '401k'],
  divorce: ['health', 'dental', 'vision', 'life'],
  birth: ['health', 'dental', 'vision', 'life', 'fsa'],
  adoption: ['health', 'dental', 'vision', 'life', 'fsa'],
  death_of_dependent: ['health', 'dental', 'vision', 'life'],
  disability: ['health', 'disability', 'life'],
  relocation: ['health', 'dental', 'vision'],
  other: ['health'],
}

/** Required documents per life event */
const REQUIRED_DOCUMENTS: Record<LifeEventType, string[]> = {
  marriage: ['Marriage certificate', 'Spouse ID/SSN', 'Updated W-4 form'],
  divorce: ['Divorce decree', 'QDRO if applicable', 'Updated W-4 form'],
  birth: ['Birth certificate', 'SSN application receipt', 'Hospital documentation'],
  adoption: ['Adoption decree', 'Placement documentation', 'Child SSN or application'],
  death_of_dependent: ['Death certificate', 'Updated beneficiary forms'],
  disability: ['Medical certification', 'ADA accommodation request if needed'],
  relocation: ['Proof of new address', 'Updated state tax forms'],
  other: ['Supporting documentation'],
}

/** Tax suggestion text per event type */
const TAX_SUGGESTIONS: Record<LifeEventType, { action: string; filingChange?: string }> = {
  marriage: { action: 'Review W-4: consider updating filing status to "Married Filing Jointly"', filingChange: 'single_to_married' },
  divorce: { action: 'Review W-4: update filing status to "Single" or "Head of Household"', filingChange: 'married_to_single' },
  birth: { action: 'Review W-4: consider adding dependent allowance' },
  adoption: { action: 'Review W-4: consider adding dependent allowance' },
  death_of_dependent: { action: 'Review W-4: consider removing dependent allowance' },
  disability: { action: 'No immediate tax change required; review if income changes' },
  relocation: { action: 'Review state tax withholding for new state of residence' },
  other: { action: 'Review tax withholding if financial situation has changed' },
}

const EVENT_TYPE_LABELS: Record<LifeEventType, string> = {
  marriage: 'Marriage',
  divorce: 'Divorce',
  birth: 'Birth of child',
  adoption: 'Adoption',
  death_of_dependent: 'Death of dependent',
  disability: 'Disability',
  relocation: 'Relocation',
  other: 'Life event',
}

// ---------------------------------------------------------------------------
// Core Functions
// ---------------------------------------------------------------------------

/**
 * Process a life event and generate actions across multiple modules.
 *
 * Creates:
 * 1. A special enrollment window for benefits changes
 * 2. A tax withholding suggestion
 * 3. An HR task with required document checklist
 *
 * @param employeeId - The employee reporting the event
 * @param eventType  - Type of life event
 * @param eventDate  - Date of the event
 * @param options    - Optional description
 * @returns Full result with actions for each module
 */
export function processLifeEvent(
  employeeId: string,
  eventType: LifeEventType,
  eventDate: string,
  options: { description?: string } = {},
): LifeEventResult {
  const label = EVENT_TYPE_LABELS[eventType]
  const windowDays = ENROLLMENT_WINDOW_DAYS[eventType]
  const windowEnd = new Date(eventDate)
  windowEnd.setDate(windowEnd.getDate() + windowDays)

  const taskDue = new Date(eventDate)
  taskDue.setDate(taskDue.getDate() + 14) // 2 weeks to collect documents

  // 1. Benefits enrollment window
  const benefitsWindow: BenefitsEnrollmentWindow = {
    employeeId,
    reason: `Qualifying life event: ${label}`,
    windowStartDate: eventDate,
    windowEndDate: windowEnd.toISOString().split('T')[0],
    eligiblePlanTypes: ELIGIBLE_PLAN_TYPES[eventType],
    priority: eventType === 'disability' ? 'high' : 'medium',
  }

  // 2. Tax withholding suggestion
  const taxInfo = TAX_SUGGESTIONS[eventType]
  const taxSuggestion: TaxWithholdingSuggestion = {
    employeeId,
    reason: `Life event: ${label}`,
    suggestedAction: taxInfo.action,
    filingStatusChange: taxInfo.filingChange,
  }

  // 3. HR document collection task
  const hrTask: HRDocumentTask = {
    employeeId,
    title: `${label} — Document Collection Required`,
    description: options.description
      ? `Employee reported: ${label}. ${options.description}. Please collect required documentation.`
      : `Employee reported: ${label}. Please collect required documentation within 14 days.`,
    category: 'life_event',
    priority: eventType === 'disability' || eventType === 'death_of_dependent' ? 'high' : 'medium',
    requiredDocuments: REQUIRED_DOCUMENTS[eventType],
    dueDate: taskDue.toISOString().split('T')[0],
  }

  return {
    employeeId,
    eventType,
    benefitsWindow,
    taxSuggestion,
    hrTask,
  }
}

/**
 * Apply life event results to the store.
 *
 * @param result - Output from processLifeEvent
 * @param store  - Store actions for persisting
 * @returns Number of items created
 */
export function applyLifeEventActions(
  result: LifeEventResult,
  store: LifeEventsStoreSlice,
): number {
  let created = 0

  // Create the HR document collection task
  if (store.addTask) {
    store.addTask({
      title: result.hrTask.title,
      description: result.hrTask.description,
      category: result.hrTask.category,
      priority: result.hrTask.priority,
      status: 'pending',
      employee_id: result.employeeId,
      due_date: result.hrTask.dueDate,
      required_documents: result.hrTask.requiredDocuments,
      life_event_type: result.eventType,
      source: 'life-events-multi-integration',
      auto_generated: true,
    })
    created++
  }

  return created
}
