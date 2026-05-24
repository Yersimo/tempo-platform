/**
 * Cost Center Inference Engine
 *
 * Rules-first, AI-fallback inference of the correct cost center for an
 * expense. Removes the dropdown that nobody enjoys filling in.
 *
 * Inference order (deterministic before probabilistic):
 *   1. Calendar context → account-mapped cost center
 *   2. Calendar context → project-mapped cost center
 *   3. Calendar context → external attendee company match
 *   4. AI fallback (only if rules return ambiguous)
 *   5. Employee's primary cost center (always safe default)
 *
 * Returns { costCenterId, source, confidence, reasoning } so the UI can
 * surface why this CC was chosen and let the user override.
 */

import type { CalendarEvent } from './calendar-provider'

export interface CostCenter {
  id: string
  name: string
  ownerId: string // employee ID who approves expenses for this CC
  /** Optional mappings — used by rules engine for auto-routing */
  accountMappings?: string[] // e.g. ["Ecobank Group", "MTN Group"]
  projectMappings?: string[] // e.g. ["Q3 Expansion", "ERP Migration"]
  parentId?: string // for hierarchical CCs
}

export interface CostCenterInferenceInput {
  employee: {
    id: string
    primaryCostCenterId: string
    department: string
  }
  expense: {
    category: string // "meals", "travel", "software", etc.
    amount: number // in cents
    currency: string
    vendor: string | null
  }
  calendarContext: CalendarEvent | null
  availableCostCenters: CostCenter[]
}

export interface CostCenterInferenceResult {
  costCenterId: string
  source:
    | 'calendar_account_match'
    | 'calendar_project_match'
    | 'employee_primary'
    | 'ai_inferred'
    | 'no_match'
  confidence: number // 0.0 - 1.0
  reasoning: string
  alternativeCostCenters?: Array<{ id: string; confidence: number; reasoning: string }>
}

// ─── Rules engine ────────────────────────────────────────────────────

/**
 * Try deterministic rules first. Returns null if no rule fires —
 * caller falls back to AI or primary CC.
 */
function applyRules(
  input: CostCenterInferenceInput,
): CostCenterInferenceResult | null {
  const { calendarContext, availableCostCenters } = input

  if (!calendarContext) return null

  // Rule 1: account match — strongest signal
  const account = calendarContext.classification.likelyAccount
  if (account) {
    const cc = availableCostCenters.find((c) =>
      c.accountMappings?.some((m) => m.toLowerCase() === account.toLowerCase()),
    )
    if (cc) {
      return {
        costCenterId: cc.id,
        source: 'calendar_account_match',
        confidence: 0.94,
        reasoning: `Meeting "${calendarContext.title}" had external attendees from ${account}. Cost center ${cc.name} is mapped to that account.`,
      }
    }
  }

  // Rule 2: project match
  const project = calendarContext.classification.likelyProject
  if (project) {
    const cc = availableCostCenters.find((c) =>
      c.projectMappings?.some((m) =>
        m.toLowerCase().includes(project.toLowerCase()),
      ),
    )
    if (cc) {
      return {
        costCenterId: cc.id,
        source: 'calendar_project_match',
        confidence: 0.9,
        reasoning: `Meeting tagged with project "${project}", mapped to cost center ${cc.name}.`,
      }
    }
  }

  return null
}

// ─── AI fallback ─────────────────────────────────────────────────────

/**
 * AI inference. Calls the assistant engine with structured context.
 * Returns null if confidence < threshold or if AI is disabled.
 *
 * Kept lightweight — the rules above handle the easy 80%; this only
 * catches ambiguous edge cases.
 */
async function applyAIFallback(
  input: CostCenterInferenceInput,
): Promise<CostCenterInferenceResult | null> {
  // Only invoke AI if rules didn't fire AND we have meaningful context
  if (!input.calendarContext) return null

  // Construct the prompt
  const prompt = buildCostCenterPrompt(input)

  try {
    // Lazy import to avoid pulling the SDK if AI is disabled
    const { inferWithClaude } = await import('@/lib/ai/inference-client')
    const raw = await inferWithClaude(prompt, { maxTokens: 200 })
    const parsed = parseAIResponse(raw, input.availableCostCenters)

    if (!parsed || parsed.confidence < 0.7) return null

    return {
      costCenterId: parsed.costCenterId,
      source: 'ai_inferred',
      confidence: parsed.confidence,
      reasoning: parsed.reasoning,
    }
  } catch {
    // AI failure is non-fatal — fall through to primary CC
    return null
  }
}

function buildCostCenterPrompt(input: CostCenterInferenceInput): string {
  const { employee, expense, calendarContext, availableCostCenters } = input

  const ccList = availableCostCenters
    .slice(0, 20) // truncate for prompt budget
    .map((c) => `  - ${c.id}: "${c.name}"`)
    .join('\n')

  const calCtx = calendarContext
    ? `Meeting: "${calendarContext.title}"
External: ${calendarContext.classification.isExternal}
Likely account: ${calendarContext.classification.likelyAccount ?? 'none'}
Likely project: ${calendarContext.classification.likelyProject ?? 'none'}
Attendees: ${calendarContext.attendees.map((a) => `${a.name} (${a.company ?? 'internal'})`).join(', ')}`
    : 'No calendar context'

  return `You are inferring a cost center for an expense. Return JSON only:
{
  "costCenterId": string (must be one of the IDs below),
  "confidence": number 0.0-1.0,
  "reasoning": string (one sentence)
}

Available cost centers:
${ccList}

Employee:
  ${employee.department}, primary CC: ${employee.primaryCostCenterId}

Expense:
  ${expense.category} at ${expense.vendor ?? '(unknown vendor)'} for ${expense.amount / 100} ${expense.currency}

${calCtx}

Rules:
- If unclear, return confidence < 0.7 and we'll use the employee's primary CC
- Prefer the CC whose mappings match the meeting account/project
- Never invent a cost center ID
`
}

interface ParsedAIResponse {
  costCenterId: string
  confidence: number
  reasoning: string
}

function parseAIResponse(
  raw: string,
  availableCostCenters: CostCenter[],
): ParsedAIResponse | null {
  try {
    // Extract JSON from response (Claude sometimes wraps in markdown)
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return null
    const parsed = JSON.parse(jsonMatch[0]) as Record<string, unknown>

    const costCenterId = String(parsed.costCenterId ?? '')
    const confidence = Number(parsed.confidence ?? 0)
    const reasoning = String(parsed.reasoning ?? '')

    // Validate CC exists in available list (prevent hallucination)
    if (!availableCostCenters.some((c) => c.id === costCenterId)) return null
    if (confidence < 0 || confidence > 1) return null

    return { costCenterId, confidence, reasoning }
  } catch {
    return null
  }
}

// ─── Public API ──────────────────────────────────────────────────────

export async function inferCostCenter(
  input: CostCenterInferenceInput,
): Promise<CostCenterInferenceResult> {
  // 1. Try rules
  const rulesResult = applyRules(input)
  if (rulesResult) return rulesResult

  // 2. Try AI fallback
  const aiResult = await applyAIFallback(input)
  if (aiResult) return aiResult

  // 3. Default to employee's primary CC
  return {
    costCenterId: input.employee.primaryCostCenterId,
    source: 'employee_primary',
    confidence: 0.5, // we're guessing — user should verify if it matters
    reasoning: `No specific signal — defaulting to ${input.employee.department}'s primary cost center.`,
  }
}
