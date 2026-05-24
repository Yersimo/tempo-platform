/**
 * Business Purpose Synthesis
 *
 * Turns calendar + receipt context into a single-sentence business
 * purpose. Replaces the free-text field that nobody enjoys filling in.
 *
 * Rules-first: deterministic templates when calendar is unambiguous.
 * AI fallback for nuance.
 */

import type { CalendarEvent } from './calendar-provider'
import type { ExtractedReceipt } from './receipt-extraction'
import { inferWithClaude } from '@/lib/ai/inference-client'

export interface BusinessPurposeInput {
  employee: {
    fullName: string
    title: string
    department: string
  }
  receipt: Pick<ExtractedReceipt, 'vendor' | 'amount' | 'currency' | 'date'>
  calendarContext: CalendarEvent | null
  expenseCategory: string
}

export interface BusinessPurposeResult {
  purpose: string
  source: 'template_external' | 'template_internal' | 'ai' | 'fallback'
  confidence: number
}

const CATEGORY_VERB: Record<string, string> = {
  meals: 'Meal',
  travel_flight: 'Flight',
  travel_hotel: 'Accommodation',
  travel_ground: 'Ground transport',
  software: 'Software purchase',
  office_supplies: 'Supplies',
  client_entertainment: 'Client entertainment',
}

function verbFor(category: string): string {
  return CATEGORY_VERB[category] ?? 'Expense'
}

export async function synthesizeBusinessPurpose(
  input: BusinessPurposeInput,
): Promise<BusinessPurposeResult> {
  const { calendarContext, expenseCategory } = input

  // Template 1: external client meeting with clear account
  if (
    calendarContext?.classification.isClientMeeting &&
    calendarContext.classification.likelyAccount
  ) {
    const account = calendarContext.classification.likelyAccount
    const project = calendarContext.classification.likelyProject
    const verb = verbFor(expenseCategory)
    const purpose = project
      ? `${verb} — ${account} / ${project}`
      : `${verb} — ${account} client meeting`
    return { purpose, source: 'template_external', confidence: 0.92 }
  }

  // Template 2: internal team meeting
  if (calendarContext && !calendarContext.classification.isExternal) {
    const verb = verbFor(expenseCategory)
    const purpose = `${verb} — ${input.employee.department} team`
    return { purpose, source: 'template_internal', confidence: 0.78 }
  }

  // AI fallback for nuanced cases
  try {
    const prompt = buildPurposePrompt(input)
    const raw = await inferWithClaude(prompt, { maxTokens: 100, temperature: 0.2 })
    const purpose = raw.trim().replace(/^["']|["']$/g, '')
    if (purpose && purpose.length <= 100) {
      return { purpose, source: 'ai', confidence: 0.7 }
    }
  } catch {
    // fall through
  }

  // Last resort fallback
  return {
    purpose: `${verbFor(expenseCategory)} — ${input.employee.department}`,
    source: 'fallback',
    confidence: 0.4,
  }
}

function buildPurposePrompt(input: BusinessPurposeInput): string {
  return `Generate a one-sentence business purpose for an expense (max 80 characters). Output ONLY the sentence, no quotes, no commentary.

Employee: ${input.employee.fullName}, ${input.employee.title}, ${input.employee.department}
Receipt: ${input.receipt.vendor ?? 'unknown vendor'} · ${input.receipt.amount ? input.receipt.amount / 100 : '?'} ${input.receipt.currency ?? ''}
Category: ${input.expenseCategory}
${
  input.calendarContext
    ? `Calendar at the time: "${input.calendarContext.title}" with ${input.calendarContext.attendees.length} attendees`
    : 'No calendar context'
}

Style: factual, specific, professional. Avoid hype words. If unclear, write a neutral purpose like "Business meal".`
}
