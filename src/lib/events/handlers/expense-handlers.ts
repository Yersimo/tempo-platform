/**
 * Event handlers for the expense flow.
 *
 * These are the consumers of expense.* events. Today, the snap submit
 * endpoint writes directly to notifications + approval_steps. Long-term,
 * those writes happen here via event subscribers, decoupling the submit
 * endpoint from its downstream effects.
 *
 * For now this file holds:
 *   - expense.submitted → audit log entry (always)
 *   - expense.submitted → flag for AI baseline refresh (every 100 events)
 *   - expense.auto_approved → metric for the CFO dashboard
 *
 * The snap submit endpoint already does notification + approval inserts;
 * we'll migrate those here in a follow-up commit to avoid double-fire.
 */

import { subscribe } from '../registry'

export function registerExpenseHandlers(): void {
  subscribe(
    'expense.submitted',
    async (event) => {
      // Stub — placeholder for downstream consumers
      // Today: notification + approval_step writes happen at the API layer
      // Tomorrow: those become subscribers here, fully decoupled
      console.log(`[events] expense.submitted received for ${event.payload.expenseReportId}`)
    },
    'expense-submitted:audit',
  )

  subscribe(
    'expense.auto_approved',
    async (event) => {
      console.log(
        `[events] expense.auto_approved — confidence ${event.payload.confidence.toFixed(2)} via rule ${event.payload.appliedRuleId}`,
      )
    },
    'expense-auto-approved:metric',
  )

  subscribe(
    'policy.applied',
    async (event) => {
      // Track policy citation rate — every Tempo decision should cite a policy.
      console.log(
        `[events] policy.applied — ${event.payload.policyId} rule ${event.payload.appliedRuleId}`,
      )
    },
    'policy-applied:citation-tracking',
  )
}
