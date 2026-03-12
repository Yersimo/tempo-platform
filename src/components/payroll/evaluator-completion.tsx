'use client'

import { Check, Clock, TrendingUp, Users } from 'lucide-react'

// ─── Types ──────────────────────────────────────────────────────────

interface PayrollCompletionSummaryProps {
  payrollGroupName: string
  period: string // "April 2026"
  employeesPaid: number // 25
  totalGross: number // in GHS
  totalNet: number // in GHS
  totalSsnitEmployer: number // in GHS
  totalPaye: number // in GHS
  confidenceScore: number // 0-100, should be 94-97
  processingTimeSeconds: number
  reconciliation?: {
    previousPeriod: string
    headcountChange: number
    grossVariance: number
    employeesWithChanges: number
    changes: Array<{
      employeeName: string
      reason: string
      amount: number
    }>
  }
  className?: string
}

// ─── Helpers ────────────────────────────────────────────────────────

function fmtGHS(amount: number): string {
  return 'GH\u20B5' + amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtVariance(amount: number): string {
  const sign = amount >= 0 ? '+' : ''
  return sign + fmtGHS(amount)
}

// ─── Score Ring ──────────────────────────────────────────────────────
// Minimal score ring inspired by the AIScoreRing pattern

function ConfidenceRing({ score, size = 64 }: { score: number; size?: number }) {
  const val = Math.round(score)
  const r = (size - 6) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (val / 100) * circ
  const color = val >= 90 ? '#16a34a' : val >= 75 ? '#ca8a04' : '#dc2626'

  return (
    <svg width={size} height={size} className="shrink-0">
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke="#f0fdf4" strokeWidth={3}
      />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke={color} strokeWidth={3}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        className="transition-all duration-700"
      />
      <text
        x={size / 2} y={size / 2}
        textAnchor="middle" dominantBaseline="central"
        className="text-sm font-semibold" fill="#1a1a1a"
      >
        {val}
      </text>
    </svg>
  )
}

// ─── Component ──────────────────────────────────────────────────────

export function PayrollCompletionSummary({
  payrollGroupName,
  period,
  employeesPaid,
  totalGross,
  totalNet,
  totalSsnitEmployer,
  totalPaye,
  confidenceScore,
  processingTimeSeconds,
  reconciliation,
  className,
}: PayrollCompletionSummaryProps) {
  return (
    <div className={`bg-white border border-emerald-200/60 rounded-2xl overflow-hidden ${className || ''}`}>
      {/* Header */}
      <div className="px-6 py-5 border-b border-emerald-100/60">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center">
            <Check size={16} className="text-emerald-600" />
          </div>
          <div>
            <h3 className="text-[15px] font-semibold text-gray-900 tracking-[-0.01em]">
              {payrollGroupName} Evaluation Payroll &mdash; {period} Complete
            </h3>
            <p className="text-[11px] text-gray-400 mt-0.5">
              All computations verified and reconciled
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="px-6 py-5 grid grid-cols-2 sm:grid-cols-3 gap-5 border-b border-emerald-100/60">
        {/* Employees Paid */}
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-gray-400">
            <Users size={12} />
            <span className="text-[10px] font-medium uppercase tracking-wider">Employees Paid</span>
          </div>
          <p className="text-xl font-semibold text-gray-900 tabular-nums">{employeesPaid}</p>
        </div>

        {/* Total Gross */}
        <div className="space-y-1">
          <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400">Total Gross</p>
          <p className="text-xl font-semibold text-gray-900 tabular-nums">{fmtGHS(totalGross)}</p>
        </div>

        {/* Total Net */}
        <div className="space-y-1">
          <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400">Total Net</p>
          <p className="text-xl font-semibold text-gray-900 tabular-nums">{fmtGHS(totalNet)}</p>
        </div>

        {/* SSNIT Employer */}
        <div className="space-y-1">
          <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400">SSNIT (Employer)</p>
          <p className="text-lg font-semibold text-gray-900 tabular-nums">{fmtGHS(totalSsnitEmployer)}</p>
        </div>

        {/* PAYE */}
        <div className="space-y-1">
          <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400">PAYE</p>
          <p className="text-lg font-semibold text-gray-900 tabular-nums">{fmtGHS(totalPaye)}</p>
        </div>
      </div>

      {/* Confidence + Processing Time */}
      <div className="px-6 py-5 flex items-center gap-8 border-b border-emerald-100/60">
        {/* Confidence Score Ring */}
        <div className="flex items-center gap-3">
          <ConfidenceRing score={confidenceScore} />
          <div>
            <p className="text-xs font-medium text-gray-900">Confidence Score</p>
            <p className="text-[10px] text-gray-400 mt-0.5">
              {confidenceScore >= 90 ? 'High confidence' : confidenceScore >= 75 ? 'Moderate confidence' : 'Low confidence'}
            </p>
          </div>
        </div>

        {/* Processing Time */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center">
            <Clock size={14} className="text-gray-400" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-900">Processing Time</p>
            <p className="text-[10px] text-gray-400 mt-0.5 tabular-nums">
              {processingTimeSeconds.toFixed(1)}s
            </p>
          </div>
        </div>
      </div>

      {/* Reconciliation Section */}
      {reconciliation && (
        <div className="px-6 py-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={14} className="text-gray-400" />
            <h4 className="text-[13px] font-semibold text-gray-900 tracking-[-0.01em]">
              Reconciliation vs {reconciliation.previousPeriod}
            </h4>
          </div>

          {/* Reconciliation Stats */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="px-3 py-2.5 rounded-xl bg-gray-50/80">
              <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400">Headcount Change</p>
              <p className="text-sm font-semibold text-gray-900 mt-1 tabular-nums">
                {reconciliation.headcountChange >= 0 ? '+' : ''}{reconciliation.headcountChange}
              </p>
            </div>
            <div className="px-3 py-2.5 rounded-xl bg-gray-50/80">
              <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400">Gross Variance</p>
              <p className="text-sm font-semibold text-gray-900 mt-1 tabular-nums">
                {fmtVariance(reconciliation.grossVariance)}
              </p>
            </div>
            <div className="px-3 py-2.5 rounded-xl bg-gray-50/80">
              <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400">With Changes</p>
              <p className="text-sm font-semibold text-gray-900 mt-1 tabular-nums">
                {reconciliation.employeesWithChanges} employee{reconciliation.employeesWithChanges !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {/* Individual Changes */}
          {reconciliation.changes.length > 0 && (
            <div className="space-y-1.5">
              {reconciliation.changes.map((change, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between px-3 py-2 rounded-lg bg-gray-50/50 text-[12px]"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-medium text-gray-900 truncate">{change.employeeName}</span>
                    <span className="text-gray-400 truncate">{change.reason}</span>
                  </div>
                  <span className={`font-semibold tabular-nums shrink-0 ml-3 ${change.amount >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                    {change.amount >= 0 ? '+' : ''}{fmtGHS(change.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
