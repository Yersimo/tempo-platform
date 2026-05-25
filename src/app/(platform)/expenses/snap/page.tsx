'use client'

import { useState } from 'react'
import './snap.css'

type ScanResult = {
  draftId: string
  receipt: {
    vendor: string | null
    amount: number | null
    currency: string | null
    date: string | null
    taxAmount: number | null
    taxType: string | null
    location: { city?: string; country?: string } | null
  }
  businessPurpose: string
  costCenter: { id: string; name: string; confidence: number; reasoning: string }
  calendarContext: {
    meetingTitle: string | null
    attendees: Array<{ name: string; company: string | null }>
  } | null
  policyCheck: { passed: boolean; violations: string[] }
  anomaly: { score: number; flags: string[]; summary: string }
  approval: {
    action: 'auto_approve' | 'route_to_human' | 'block'
    approverId: string | null
    approverName: string | null
    reasoning: string
    confidence: number
  }
  policy: {
    id: string
    version: string
    requiredSignatures: number
    appliedRuleId: string
    appliedRuleReasoning: string
    slots: Array<{
      slotIndex: number
      approverName: string | null
      approverTitle: string | null
      constraintDescription: string
    }>
    preApprovers: Array<{ name: string; title: string }>
    violations: Array<{ section: string; severity: string; message: string }>
    autoApprovalEligible: boolean
    autoApprovalReason: string
  }
  overallConfidence: number
  timings: { extractMs: number; calendarMs: number; inferenceMs: number; totalMs: number }
}

type SnapState =
  | { stage: 'idle' }
  | { stage: 'capturing' }
  | { stage: 'processing'; startedAt: number }
  | { stage: 'review'; result: ScanResult }
  | { stage: 'submitting'; result: ScanResult }
  | { stage: 'submitted'; result: ScanResult }

export default function ExpenseSnapPage() {
  const [state, setState] = useState<SnapState>({ stage: 'idle' })

  async function runDemoScan() {
    setState({ stage: 'processing', startedAt: Date.now() })

    try {
      const res = await fetch('/api/expenses/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: 'demo',
          demoMode: true,
          employeeId: 'emp-17',
        }),
      })
      const result = (await res.json()) as ScanResult
      // Hold the processing animation for at least 1.2s so the beat
      // pulse completes one full cycle — feels considered, not glitchy
      const elapsed = Date.now() - (state.stage === 'processing' ? state.startedAt : Date.now())
      if (elapsed < 1200) await sleep(1200 - elapsed)
      setState({ stage: 'review', result })
    } catch (err) {
      console.error(err)
      setState({ stage: 'idle' })
    }
  }

  async function submit() {
    if (state.stage !== 'review') return
    setState({ stage: 'submitting', result: state.result })
    await sleep(600)
    setState({ stage: 'submitted', result: state.result })
  }

  function reset() {
    setState({ stage: 'idle' })
  }

  return (
    <main className="snap" aria-label="Tempo · Expense Snap">
      <header className="snap-header">
        <a href="/dashboard" className="snap-back" aria-label="Back to dashboard">
          <span aria-hidden="true">←</span>
        </a>
        <div className="snap-title">
          <span className="snap-eyebrow">Expense</span>
          <span className="snap-h">Snap a receipt</span>
        </div>
        <div className="snap-spacer" />
      </header>

      {state.stage === 'idle' && <IdleScreen onCapture={runDemoScan} />}
      {state.stage === 'processing' && <ProcessingScreen />}
      {state.stage === 'review' && (
        <ReviewScreen result={state.result} onSubmit={submit} onCancel={reset} />
      )}
      {state.stage === 'submitting' && <ProcessingScreen submitting />}
      {state.stage === 'submitted' && (
        <SubmittedScreen result={state.result} onNew={reset} />
      )}
    </main>
  )
}

// ─── Idle screen — camera FAB ────────────────────────────────────────
function IdleScreen({ onCapture }: { onCapture: () => void }) {
  return (
    <section className="snap-stage snap-stage-idle">
      <div className="snap-idle-hint">
        <p className="snap-idle-lede">
          Point at a receipt.<br />
          We&apos;ll do the rest.
        </p>
        <p className="snap-idle-sub">
          Average 8 seconds to filed. No fields to type.
        </p>
      </div>

      <button
        type="button"
        className="snap-fab"
        onClick={onCapture}
        aria-label="Capture receipt"
      >
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M4 7h3l2-3h6l2 3h3a1 1 0 011 1v11a1 1 0 01-1 1H4a1 1 0 01-1-1V8a1 1 0 011-1z"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <circle cx="12" cy="13" r="4" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </button>

      <p className="snap-idle-fineprint">
        Tap to try with a demo receipt — no camera permission needed.
      </p>
    </section>
  )
}

// ─── Processing screen — beat pulse ──────────────────────────────────
function ProcessingScreen({ submitting }: { submitting?: boolean }) {
  return (
    <section className="snap-stage snap-stage-processing">
      <div className="snap-pulse-wrap">
        <div className="tempo-beat-pulse" role="status" aria-label="Processing">
          <span /><span /><span /><span />
        </div>
      </div>
      <p className="snap-process-line">
        {submitting ? 'Submitting…' : 'Reading the receipt…'}
      </p>
      <p className="snap-process-sub">
        {submitting
          ? 'Routing to the right approver'
          : 'Cross-referencing your calendar · inferring cost center'}
      </p>
    </section>
  )
}

// ─── Review screen — the magic moment ────────────────────────────────
function ReviewScreen({
  result,
  onSubmit,
  onCancel,
}: {
  result: ScanResult
  onSubmit: () => void
  onCancel: () => void
}) {
  const amount = result.receipt.amount
  const currency = result.receipt.currency
  const formatted =
    amount !== null && currency
      ? formatCurrency(amount, currency)
      : 'Amount unclear'
  const usdEquivalent =
    amount !== null && currency && currency !== 'USD'
      ? ` (${formatCurrency(toUsdCents(amount, currency), 'USD')})`
      : ''

  const isAutoApprove = result.approval.action === 'auto_approve'

  return (
    <section className="snap-stage snap-stage-review">
      <div className="snap-card">
        <header className="snap-card-header">
          <p className="snap-card-vendor">{result.receipt.vendor ?? 'Unknown vendor'}</p>
          <p className="snap-card-amount">
            {formatted}
            {usdEquivalent && (
              <span className="snap-card-amount-usd">{usdEquivalent}</span>
            )}
          </p>
          <p className="snap-card-meta">
            {result.receipt.location?.city && (
              <span>{result.receipt.location.city}</span>
            )}
            {result.receipt.date && (
              <span>· {formatDateTime(result.receipt.date)}</span>
            )}
            {result.receipt.taxAmount !== null &&
              result.receipt.taxType &&
              result.receipt.currency && (
                <span>
                  · {result.receipt.taxType} {formatCurrency(result.receipt.taxAmount, result.receipt.currency)}
                </span>
              )}
          </p>
        </header>

        <div className="snap-card-body">
          <Field label="Purpose" tappable>
            {result.businessPurpose}
          </Field>

          {result.calendarContext && result.calendarContext.attendees.length > 0 && (
            <Field label="Attendees" tappable>
              {result.calendarContext.attendees.map((a, i) => (
                <span key={i} className="snap-attendee">
                  {a.name}
                  {a.company && (
                    <span className="snap-attendee-company"> · {a.company}</span>
                  )}
                </span>
              ))}
            </Field>
          )}

          <Field label="Cost center" tappable>
            {result.costCenter.name}
            <span className="snap-card-confidence">
              · {Math.round(result.costCenter.confidence * 100)}% match
            </span>
          </Field>

          <Field label="Policy" status={result.policyCheck.passed ? 'ok' : 'warn'}>
            {result.policyCheck.passed
              ? 'Within allowance · VAT receipt valid'
              : result.policyCheck.violations.join(' · ')}
          </Field>

          {result.anomaly.score >= 0.3 && (
            <Field label="Note" status="info">
              {result.anomaly.summary}
            </Field>
          )}

          {/* Policy resolution — multi-signature chain or auto-approval */}
          {isAutoApprove ? (
            <Field label="Approval" status="ok">
              Auto-approved by policy
              <span className="snap-card-confidence">
                · {Math.round(result.approval.confidence * 100)}% confidence
              </span>
            </Field>
          ) : (
            <Field label={result.policy.requiredSignatures > 1 ? `${result.policy.requiredSignatures} signatures required` : 'Approver'}>
              {result.policy.slots.map((slot, i) => (
                <span key={i} className="snap-approver-slot">
                  <span className="snap-approver-name">
                    {slot.approverName ?? '⚠ unassigned'}
                  </span>
                  {slot.approverTitle && (
                    <span className="snap-approver-title"> · {slot.approverTitle}</span>
                  )}
                  {result.policy.slots.length > 1 && (
                    <span className="snap-approver-constraint"> ({slot.constraintDescription})</span>
                  )}
                </span>
              ))}
              {result.policy.preApprovers.length > 0 && (
                <span className="snap-pre-approver">
                  Pre-approval: {result.policy.preApprovers.map((p) => p.name).join(', ')}
                </span>
              )}
            </Field>
          )}

          {/* Policy attribution — quietly cited */}
          <Field label="Policy" status="info">
            ETI Expense Policy {result.policy.version}
            <span className="snap-card-confidence">
              · {result.policy.appliedRuleReasoning.split('—')[0]?.trim()}
            </span>
          </Field>
        </div>

        <div className="snap-card-footer">
          <p className="snap-card-timing">
            {`Inferred in ${(result.timings.totalMs / 1000).toFixed(1)}s · ETI Policy ${result.policy.version}`}
          </p>
        </div>
      </div>

      <div className="snap-actions">
        <button type="button" className="snap-cta-secondary" onClick={onCancel}>
          Cancel
        </button>
        <button type="button" className="snap-cta-primary" onClick={onSubmit}>
          Submit
        </button>
      </div>
    </section>
  )
}

// ─── Submitted screen ────────────────────────────────────────────────
function SubmittedScreen({
  result,
  onNew,
}: {
  result: ScanResult
  onNew: () => void
}) {
  const isAutoApprove = result.approval.action === 'auto_approve'
  return (
    <section className="snap-stage snap-stage-submitted">
      <div className="snap-success-mark" aria-hidden="true">
        <svg viewBox="0 0 48 48" width="48" height="48">
          <circle cx="24" cy="24" r="22" stroke="currentColor" strokeWidth="1.5" fill="none" />
          <path
            d="M14 24l7 7 14-14"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <h2 className="snap-success-h">
        {isAutoApprove ? 'Approved.' : 'Submitted.'}
      </h2>
      <p className="snap-success-line">
        {isAutoApprove
          ? `Auto-approved by policy. Expected on next payroll.`
          : `Sent to ${result.approval.approverName ?? 'your approver'}. Expected response within 48h.`}
      </p>

      <button type="button" className="snap-cta-ghost" onClick={onNew}>
        Snap another
      </button>
    </section>
  )
}

// ─── Field row ───────────────────────────────────────────────────────
function Field({
  label,
  children,
  tappable,
  status,
}: {
  label: string
  children: React.ReactNode
  tappable?: boolean
  status?: 'ok' | 'warn' | 'info'
}) {
  return (
    <div className={`snap-field ${tappable ? 'snap-field-tappable' : ''} ${status ? `snap-field-${status}` : ''}`}>
      <span className="snap-field-label">{label}</span>
      <span className="snap-field-value">{children}</span>
    </div>
  )
}

// ─── Helpers ─────────────────────────────────────────────────────────
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function formatCurrency(smallestUnit: number, currency: string): string {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  })
  // NGN, USD, etc. all use 2 decimal places (smallest unit ÷ 100)
  return formatter.format(smallestUnit / 100)
}

function formatDateTime(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  } catch {
    return iso
  }
}

function toUsdCents(smallestUnit: number, currency: string): number {
  const RATES: Record<string, number> = {
    USD: 1, NGN: 0.00067, GHS: 0.083, KES: 0.0077, ZAR: 0.054,
    XOF: 0.0017, EUR: 1.08, GBP: 1.27,
  }
  return Math.round(smallestUnit * (RATES[currency] ?? 1))
}
