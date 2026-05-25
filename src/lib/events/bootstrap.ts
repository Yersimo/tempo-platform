/**
 * Event system bootstrap.
 *
 * Registers all built-in subscribers once at module load. Imported
 * from the app shell (layout.tsx) so handlers are wired before any
 * request handler runs.
 *
 * Idempotent — safe to import multiple times.
 */

import { registerExpenseHandlers } from './handlers/expense-handlers'

let bootstrapped = false

export function bootstrapEvents(): void {
  if (bootstrapped) return
  bootstrapped = true

  registerExpenseHandlers()

  // Future:
  //   registerEmployeeHandlers()
  //   registerApprovalHandlers()
  //   registerAuthHandlers()

  console.log('[events] bootstrap complete')
}

// Auto-bootstrap on module load so subscribers are ready before any
// emitEvent() call.
bootstrapEvents()
