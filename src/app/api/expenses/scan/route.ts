/**
 * POST /api/expenses/scan
 *
 * The 8-second-expense orchestrator.
 *
 * Input:  base64 receipt image + optional metadata
 * Output: a fully-composed expense draft with AI-inferred fields:
 *         vendor, amount, currency, date, business purpose, cost
 *         center, calendar attendees, policy check, anomaly score,
 *         auto-approval decision.
 *
 * The client renders the result as a single confirmation card. User
 * taps Submit (or corrects any field), and the second API call (submit)
 * persists the expense.
 */

import { NextResponse, type NextRequest } from 'next/server'
import { getCalendarProvider } from '@/lib/services/calendar-provider'
import { extractReceipt } from '@/lib/services/receipt-extraction'
import { synthesizeBusinessPurpose } from '@/lib/services/business-purpose-synthesis'
import {
  inferCostCenter,
  type CostCenter,
} from '@/lib/services/cost-center-inference'
import {
  decideAutoApproval,
  DEFAULT_ORG_POLICY,
  defaultEmployeeProfile,
} from '@/lib/services/auto-approval-engine'
import {
  detectAnomaly,
  buildBaseline,
} from '@/lib/services/expense-anomaly'

// ─── Demo fixtures ───────────────────────────────────────────────────
// In production these come from the DB. For the demo flow we use realistic
// fixtures so the moment works without a full data setup.

const DEMO_COST_CENTERS: CostCenter[] = [
  {
    id: 'cc-0142',
    name: 'Strategy Office',
    ownerId: 'emp-yemi',
    accountMappings: ['McKinsey & Company', 'BCG', 'Bain & Company'],
    projectMappings: ['Q3 Expansion', 'Strategy Review'],
  },
  {
    id: 'cc-hr-001',
    name: 'Human Resources',
    ownerId: 'emp-17', // Amara herself owns this in the demo
    accountMappings: [],
    projectMappings: [],
  },
  {
    id: 'cc-tech-001',
    name: 'Technology',
    ownerId: 'emp-13',
    accountMappings: [],
    projectMappings: ['ERP Migration', 'Platform Rebuild'],
  },
  {
    id: 'cc-finance-001',
    name: 'Finance',
    ownerId: 'emp-24',
    accountMappings: [],
    projectMappings: [],
  },
]

/** Demo history — realistic NGN-denominated Lagos meal expenses for
 *  Amara. Amount stored in smallest currency unit (kobo) to match the
 *  incoming expense currency. Keeps the anomaly engine consistent. */
const DEMO_EMPLOYEE_HISTORY: Array<{
  amount: number
  category: string
  vendor: string | null
  date: string
}> = [
  { amount: 1620000, category: 'meals', vendor: 'Roma Bistro', date: daysAgo(14) },
  { amount: 2120000, category: 'meals', vendor: 'The Wheatbaker', date: daysAgo(28) },
  { amount: 1480000, category: 'meals', vendor: 'Bottles', date: daysAgo(42) },
  { amount: 1850000, category: 'meals', vendor: 'Roma Bistro', date: daysAgo(56) },
  { amount: 2240000, category: 'meals', vendor: 'Yellow Chilli', date: daysAgo(70) },
  { amount: 1780000, category: 'meals', vendor: 'The Wheatbaker', date: daysAgo(84) },
]

function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString()
}

// ─── Request body schema ─────────────────────────────────────────────
interface ScanRequest {
  /** Base64-encoded image (without data: prefix) */
  imageBase64: string
  mediaType?: 'image/jpeg' | 'image/png' | 'image/webp'
  /** Override the timestamp if needed (defaults to now) */
  timestamp?: string
  /** Employee context — in production pulled from auth */
  employeeId?: string
  /** Demo mode — skip Vision call, return fixture receipt. For sales demos
   *  and dev environments without ANTHROPIC_API_KEY set. */
  demoMode?: boolean
}

/** Realistic demo receipt — Roma Bistro, Lagos.
 *  Date is set to 19:45 today (UTC) so it falls inside the mock calendar
 *  dinner event window (19:30–21:00). This makes the demo deterministic:
 *  cost center, purpose, attendees, and approver always resolve correctly. */
function buildDemoReceipt() {
  const today = new Date()
  today.setUTCHours(19, 45, 0, 0)
  return {
    vendor: 'Roma Bistro',
    amount: 1840000, // ₦18,400 in kobo
    currency: 'NGN',
    date: today.toISOString(),
    taxAmount: 92000, // ₦920 VAT
    taxType: 'VAT' as const,
    paymentMethod: 'card_****4127',
    lineItems: [],
    receiptQuality: 'clear' as const,
    confidence: 0.96,
    flaggedFields: [],
    location: { city: 'Lagos', country: 'Nigeria' },
  }
}

interface ScanResponse {
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
  costCenter: {
    id: string
    name: string
    confidence: number
    reasoning: string
  }
  calendarContext: {
    meetingTitle: string | null
    attendees: Array<{ name: string; company: string | null }>
  } | null
  policyCheck: {
    passed: boolean
    violations: string[]
  }
  anomaly: {
    score: number
    flags: string[]
    summary: string
  }
  approval: {
    action: 'auto_approve' | 'route_to_human' | 'block'
    approverId: string | null
    approverName: string | null
    reasoning: string
    confidence: number
  }
  /** Total AI extraction confidence (drives auto-approval) */
  overallConfidence: number
  /** Timing breakdown for transparency */
  timings: {
    extractMs: number
    calendarMs: number
    inferenceMs: number
    totalMs: number
  }
}

export async function POST(request: NextRequest) {
  const t0 = Date.now()
  const body = (await request.json()) as ScanRequest

  if (!body.imageBase64) {
    return NextResponse.json(
      { error: 'imageBase64 required' },
      { status: 400 },
    )
  }

  // In production: pull employeeId from auth context (x-employee-id header
  // set by middleware). For demo, default to Amara if not provided.
  const employeeId =
    body.employeeId ??
    request.headers.get('x-employee-id') ??
    'emp-17'
  const timestamp = body.timestamp ?? new Date().toISOString()

  // ── Step 1: Receipt extraction (Claude Vision or demo fixture) ─────
  const tExtractStart = Date.now()
  const receipt = body.demoMode
    ? buildDemoReceipt()
    : await extractReceipt(body.imageBase64, body.mediaType ?? 'image/jpeg')
  const extractMs = Date.now() - tExtractStart

  // ── Step 2: Calendar context (parallel with cost center) ───────────
  const tCalStart = Date.now()
  const calendar = await getCalendarProvider(employeeId)
  const calendarEvent = await calendar.findEventAt(
    employeeId,
    receipt.date ?? timestamp,
    30,
  )
  const calendarMs = Date.now() - tCalStart

  // ── Step 3: AI inference (purpose + cost center) ───────────────────
  const tInferStart = Date.now()

  // Demo employee — production pulls from DB
  const demoEmployee = {
    id: employeeId,
    fullName: 'Amara Kone',
    title: 'CHRO',
    department: 'Human Resources',
    homeCountry: 'Cote d\'Ivoire',
    primaryCostCenterId: 'cc-hr-001',
  }

  const expenseCategory = inferCategory(receipt)

  // Run cost-center inference + business-purpose synthesis in parallel
  const [costCenterResult, purposeResult] = await Promise.all([
    inferCostCenter({
      employee: {
        id: demoEmployee.id,
        primaryCostCenterId: demoEmployee.primaryCostCenterId,
        department: demoEmployee.department,
      },
      expense: {
        category: expenseCategory,
        amount: receipt.amount ?? 0,
        currency: receipt.currency ?? 'USD',
        vendor: receipt.vendor,
      },
      calendarContext: calendarEvent,
      availableCostCenters: DEMO_COST_CENTERS,
    }),
    synthesizeBusinessPurpose({
      employee: {
        fullName: demoEmployee.fullName,
        title: demoEmployee.title,
        department: demoEmployee.department,
      },
      receipt: {
        vendor: receipt.vendor,
        amount: receipt.amount,
        currency: receipt.currency,
        date: receipt.date,
      },
      calendarContext: calendarEvent,
      expenseCategory,
    }),
  ])

  const inferenceMs = Date.now() - tInferStart

  // ── Step 4: Policy check ────────────────────────────────────────────
  const policyCheck = runPolicyCheck(receipt, expenseCategory)

  // ── Step 5: Anomaly detection ──────────────────────────────────────
  const baseline = buildBaseline(DEMO_EMPLOYEE_HISTORY, expenseCategory)
  const anomaly = detectAnomaly({
    expense: {
      amount: receipt.amount ?? 0,
      currency: receipt.currency ?? 'USD',
      category: expenseCategory,
      vendor: receipt.vendor,
      date: receipt.date ?? timestamp,
      location: receipt.location ?? undefined,
    },
    employee: {
      id: employeeId,
      homeCountry: demoEmployee.homeCountry,
    },
    baseline,
  })

  // ── Step 6: Auto-approval decision ─────────────────────────────────
  const employeeProfile = {
    ...defaultEmployeeProfile(),
    isEligible: true, // Amara has tenure
    ceilingAmount: 50000, // $500 for CHRO
    historicalApprovalRate: 1.0,
  }

  const approvalDecision = decideAutoApproval({
    ai: {
      confidence: receipt.confidence,
      flaggedFields: receipt.flaggedFields,
    },
    expense: {
      amount: receipt.amount ?? 0,
      currency: receipt.currency ?? 'USD',
      category: expenseCategory,
      vendor: receipt.vendor,
    },
    employee: employeeProfile,
    org: DEFAULT_ORG_POLICY,
    policyCheck: {
      passed: policyCheck.passed,
      violations: policyCheck.violationDetails,
    },
    anomaly,
    historicalPattern: {
      similarExpenseCount: DEMO_EMPLOYEE_HISTORY.length,
      approvalRate: 1.0,
      avgAmount: baseline.employeeCategoryAvg,
    },
  })

  // ── Compose response ────────────────────────────────────────────────
  const approverCC = DEMO_COST_CENTERS.find(
    (c) => c.id === costCenterResult.costCenterId,
  )
  const approverId =
    approvalDecision.action === 'route_to_human'
      ? approverCC?.ownerId ?? null
      : null
  const approverName =
    approverId === 'emp-yemi' ? 'Yemi Okonkwo' :
    approverId === 'emp-13' ? 'Babajide Ogunleye' :
    approverId === 'emp-24' ? 'Ifeanyi Agu' :
    approverId === 'emp-17' ? 'Amara Kone' : null

  const totalMs = Date.now() - t0

  const response: ScanResponse = {
    draftId: `draft-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    receipt: {
      vendor: receipt.vendor,
      amount: receipt.amount,
      currency: receipt.currency,
      date: receipt.date,
      taxAmount: receipt.taxAmount,
      taxType: receipt.taxType,
      location: receipt.location,
    },
    businessPurpose: purposeResult.purpose,
    costCenter: {
      id: costCenterResult.costCenterId,
      name:
        DEMO_COST_CENTERS.find((c) => c.id === costCenterResult.costCenterId)
          ?.name ?? 'Unknown',
      confidence: costCenterResult.confidence,
      reasoning: costCenterResult.reasoning,
    },
    calendarContext: calendarEvent
      ? {
          meetingTitle: calendarEvent.title,
          attendees: calendarEvent.attendees
            .filter((a) => a.email !== `${employeeId}@example.com`) // exclude self
            .map((a) => ({ name: a.name ?? a.email, company: a.company })),
        }
      : null,
    policyCheck: {
      passed: policyCheck.passed,
      violations: policyCheck.violationDetails.map((v) => v.message),
    },
    anomaly: {
      score: anomaly.score,
      flags: anomaly.flags,
      summary: anomaly.summary,
    },
    approval: {
      action: approvalDecision.action,
      approverId,
      approverName,
      reasoning: approvalDecision.reasoning,
      confidence:
        approvalDecision.action === 'auto_approve'
          ? approvalDecision.confidence
          : receipt.confidence,
    },
    overallConfidence: receipt.confidence,
    timings: { extractMs, calendarMs, inferenceMs, totalMs },
  }

  return NextResponse.json(response)
}

// ─── Helpers ─────────────────────────────────────────────────────────

function inferCategory(receipt: { vendor: string | null; lineItems?: unknown }): string {
  const vendor = receipt.vendor?.toLowerCase() ?? ''
  if (/bistro|restaurant|cafe|kitchen|grill|chilli|wheatbaker|bottles|roma/.test(vendor)) {
    return 'meals'
  }
  if (/hotel|inn|resort|hostel/.test(vendor)) return 'travel_hotel'
  if (/airline|airways|airport|flight/.test(vendor)) return 'travel_flight'
  if (/uber|bolt|taxi|lyft|car/.test(vendor)) return 'travel_ground'
  return 'meals' // default for demo
}

function runPolicyCheck(
  receipt: { amount: number | null; currency: string | null },
  category: string,
): {
  passed: boolean
  violationDetails: Array<{ rule: string; message: string; severity: 'block' | 'warn' }>
} {
  const violations: Array<{ rule: string; message: string; severity: 'block' | 'warn' }> = []

  // Meal allowance check (default $150 USD-equivalent)
  if (category === 'meals' && receipt.amount && receipt.currency) {
    const usdAmount = convertToUsd(receipt.amount, receipt.currency)
    if (usdAmount > 15000) {
      violations.push({
        rule: 'meal_allowance',
        message: `Meal amount ${(usdAmount / 100).toFixed(2)} USD exceeds $150 ceiling`,
        severity: 'warn',
      })
    }
  }

  // Missing amount is a block
  if (receipt.amount === null) {
    violations.push({
      rule: 'amount_required',
      message: 'Amount could not be extracted from receipt',
      severity: 'block',
    })
  }

  return {
    passed: violations.filter((v) => v.severity === 'block').length === 0,
    violationDetails: violations,
  }
}

// Stub FX conversion — production uses live rates table.
function convertToUsd(amountInSmallestUnit: number, currency: string): number {
  const RATES: Record<string, number> = {
    USD: 1,
    NGN: 0.00067, // ₦1 ≈ $0.00067
    GHS: 0.083,
    KES: 0.0077,
    ZAR: 0.054,
    XOF: 0.0017,
    EUR: 1.08,
    GBP: 1.27,
  }
  const rate = RATES[currency] ?? 1
  return Math.round(amountInSmallestUnit * rate)
}
