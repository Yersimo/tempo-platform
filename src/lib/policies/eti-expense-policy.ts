/**
 * Ecobank Transnational Incorporated (ETI)
 * Expense Management Policy — 2023 Final
 *
 * Source: /2023 ETI EXPENSE POLICY 1.pdf
 * Authority: GROUP FINANCE, released 1 March 2023
 * Applicable to: ALL ETI
 *
 * This file is the typed, executable encoding of the ETI policy.
 * The Policy Engine reads from here to:
 *   1. Determine how many signatures an expense needs
 *   2. Identify the signing-authority categories required
 *   3. Apply category-specific rules (HR, Finance, etc.)
 *   4. Enforce filing windows and documentation thresholds
 *   5. Decide auto-approval eligibility
 *
 * Changes to the ETI policy → update this file. One source of truth.
 */

import type { PolicyDocument } from '@/lib/services/policy-engine'

export const ETI_EXPENSE_POLICY_2023: PolicyDocument = {
  id: 'eti-expense-2023',
  name: 'ETI Expense Management Policy',
  version: '2023-final',
  effectiveFrom: '2023-03-01',
  authority: 'Group Finance',
  appliesTo: {
    orgIds: ['org-1'], // demo Ecobank org. Production: lookup by org.
    description: 'All ETI head office staff (Lomé, Togo)',
  },

  // ─── Section 3: Signing Authorities ────────────────────────────────
  signatureRequirements: [
    // <$500: single authority can approve (Policy §3.i.i)
    {
      id: 'single-sig-below-500',
      minAmountUSD: 0,
      maxAmountUSD: 500,
      requiredSignatures: 1,
      categoryConstraints: [
        { count: 1, allowedCategories: ['A', 'B', 'C'] },
      ],
      reasoning: 'Policy §3.i.i — Amounts less than $500 can be approved by one authority.',
    },
    // $500–$100K: 2 signatures, at least one with full limit (§3.i.ii)
    {
      id: 'two-sig-500-to-100k',
      minAmountUSD: 500,
      maxAmountUSD: 100000,
      requiredSignatures: 2,
      categoryConstraints: [
        { count: 1, allowedCategories: ['A'], requireFullLimit: true },
        { count: 1, allowedCategories: ['A', 'B', 'C'] },
      ],
      reasoning:
        'Policy §3.i.ii — At least one of the authorized signatures must have the required approval limit for amounts between $500 and $100,000.',
    },
    // $100K–$2M: 2 signatures, BOTH with full limit (§3.i.iii)
    {
      id: 'two-sig-100k-to-2m',
      minAmountUSD: 100000,
      maxAmountUSD: 2000000,
      requiredSignatures: 2,
      categoryConstraints: [
        { count: 2, allowedCategories: ['A'], requireFullLimit: true },
      ],
      reasoning:
        'Policy §3.i.iii — Both signatures must have the required approval limits for amounts between $100K and $2M.',
    },
    // >$2M: GCEO + GCFO Finance + GE Ops & Technology (§3.i.iv)
    {
      id: 'three-sig-above-2m',
      minAmountUSD: 2000000,
      maxAmountUSD: null,
      requiredSignatures: 3,
      categoryConstraints: [
        { count: 1, allowedRoles: ['GCEO'] },
        { count: 1, allowedRoles: ['GCFO Finance'] },
        { count: 1, allowedRoles: ['GE Operations & Technology'] },
      ],
      reasoning:
        'Policy §3.i.iv — Amounts above $2M require GCEO + GCFO Finance + GE Operations & Technology.',
    },
  ],

  // ─── Section 3.j-k: Departmental rules ─────────────────────────────
  departmentRules: [
    {
      id: 'hr-expenses',
      expenseDepartment: 'Human Resources',
      requiredApproverDepartment: 'Human Resources',
      sequencing: 'before_general_signatures',
      reasoning:
        'Policy §3.j — All HR-related expenses must first be approved by an authorized signatory from the HR department.',
    },
    {
      id: 'departmental-pre-approval',
      expenseDepartment: 'ANY',
      requiresDepartmentHeadFirst: true,
      reasoning:
        'Policy §3.k — Expenses pertaining to a specific department must be approved by the head of that department prior to submission to the general signing authorities.',
    },
  ],

  // ─── Section 10: Employee Reimbursements ───────────────────────────
  reimbursementRules: {
    filingWindowDays: 30, // §10.g
    lateFilingAction: 'reject', // "will not be reimbursed"
    receiptRequiredAboveUSD: 10, // §10.d
    perDiemsAllowed: false, // §10.h
    requiresItemizedRequest: true, // §10.a.ii
    requiredFields: [
      'purpose',
      'amount',
      'description',
      'place',
      'date',
      'attendees_when_applicable',
    ],
    selfApprovalAllowed: false, // §1.h
  },

  // ─── Section 8: Cash Advances ───────────────────────────────────────
  cashAdvanceRules: {
    settlementWindowDays: 30, // §8.e
    overdueAction: 'auto_debit_salary', // §8.e
    multipleAdvancesAllowed: false, // §8.f — must settle existing first
    returnInSameCurrency: true, // §8.d.iii
    maxTipPercentage: 5, // §8.b
  },

  // ─── Section 6: Travel ──────────────────────────────────────────────
  travelRules: {
    requirePreTripApproval: true, // §6.c, §6.i
    defaultClass: 'economy', // §6 Air Travel (c)
    advanceBookingDays: 7, // §6 Air Travel (b)
    businessClassEligibility: [
      { role: 'Group Executive Committee', anyFlight: true }, // §6.AirTravel.d.i
      { role: 'Group Heads', minFlightHours: 4 }, // §6.AirTravel.d.ii
    ],
    firstClassEligibility: [
      { role: 'ETI Chairman' },
      { role: 'GCEO' },
    ],
    spousalTravelReimbursable: false, // §6.f
    homeLeaveAdvanceNoticeMonths: 3, // §6.j
    requiresEBSBooking: true, // §6.c — through Ecobank Business Services Lomé
    maxPassengersPerCar: 4, // §6.h
    lomeToAccraCotonouRoadOnly: true, // §6 Road Travel (a)
  },

  // ─── Section 7: Telecom ─────────────────────────────────────────────
  telecomRules: {
    roamingEligibleRoles: ['Group Heads', 'Executive Directors'], // §7.b
    obtainLocalSimWhenAway: true, // §7.c
    maxBusinessCallsUSDPerDay: 10, // §7.e
    personalPhoneEquipmentReimbursable: false, // §7.f
  },

  // ─── Section 9: Corporate Cards ─────────────────────────────────────
  corporateCardRules: {
    settlementWindowDays: 30, // §9.g
    overdueAction: 'auto_debit_salary', // §9.g
    forbidsCashAdvances: true, // §9.h
    requiresReceiptsForAll: true, // §9.d
    lateFeesReimbursable: false, // §9.j
    foreignCardFXFeesReimbursable: false, // §9.k
  },

  // ─── Section 11: Meetings and Events ────────────────────────────────
  meetingsAndEventsRules: {
    thresholdRequireGCFOApproval: 10000, // §11.b — >$10K requires GCFO Finance
    thresholdRequireDetailedRationale: 25000, // §11.d — >$25K needs detailed business rationale
    feeAgreementLeadTimeDays: 5, // §11.e
  },

  // ─── Section 4–5: Contracts and Procurement ────────────────────────
  contractRules: {
    minSignatures: 2, // §4.b
    maxContractTermYears: 3, // §4.d (unless GCEO override)
    majorExpenditureProgramThresholdUSD: 150000, // §4.g
    legalReviewRequired: true, // §4.c
  },

  procurementRules: {
    bidsRequiredAboveUSD: 5000, // §5.c — minimum 3 competitive bids
    minBidCount: 3,
    tenderRequiredAboveUSD: 25000, // §5.d
    minTenderInvitees: 3,
    routeThroughEBS: true, // §5.b
  },

  // ─── Section 12: Payment Categories (Group A/B/C) ──────────────────
  paymentCategories: {
    'A': {
      label: 'Group A — Senior signing authority',
      description:
        'Highest-tier signatories. Required as at least one of the two signatures on every payment (Policy §12.d).',
      maxApprovalUSD: null, // no upper limit at this category
    },
    'B': {
      label: 'Group B — Mid-tier signing authority',
      maxApprovalUSD: 100000,
    },
    'C': {
      label: 'Group C — Junior signing authority',
      maxApprovalUSD: 25000,
    },
  },

  // ─── Auto-approval ─────────────────────────────────────────────────
  // Tempo addition: where the policy allows single-signature (<$500),
  // a sufficiently confident AI-extracted expense from an employee with
  // good history can auto-approve. This is a *narrowing* of policy, not
  // an expansion — it never approves above what the policy permits.
  autoApprovalOverlay: {
    enabled: true,
    maxAmountUSD: 500, // never exceed the single-sig threshold
    minAIConfidence: 0.92,
    minHistoricalApprovalRate: 0.95,
    minSimilarPriorExpenses: 5,
    excludedCategories: ['contracts', 'capex', 'meetings_above_10k', 'travel_unbooked'],
  },
}
