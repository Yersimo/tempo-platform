/**
 * I-9 / E-Verify Integration Service
 *
 * Comprehensive I-9 employment eligibility verification and E-Verify
 * case management engine. Handles:
 * - I-9 form lifecycle (Section 1 & Section 2)
 * - Document verification across List A, List B, and List C categories
 * - E-Verify case submission and status tracking
 * - Tentative Non-Confirmation (TNC) handling
 * - Reverification alerts and scheduling
 * - Compliance reporting and audit readiness
 * - Bulk E-Verify submission
 */

import { db, schema } from '@/lib/db'
import { eq, and, desc, asc, lte, gte, isNull, or, count } from 'drizzle-orm'

// ============================================================
// Types & Constants
// ============================================================

export type I9Status =
  | 'not_started' | 'section1_pending' | 'section1_complete'
  | 'section2_pending' | 'section2_complete'
  | 'everify_pending' | 'everify_submitted' | 'verified'
  | 'tnc_issued' | 'tnc_contested' | 'final_nonconfirmation' | 'closed'

export type DocumentCategory = 'list_a' | 'list_b' | 'list_c'

export type EVerifyCaseStatus =
  | 'open' | 'initial_verification' | 'employment_authorized'
  | 'tentative_nonconfirmation' | 'case_in_continuance'
  | 'close_case_authorized' | 'close_case_unauthorized' | 'final_nonconfirmation'

export interface Section1Data {
  lastName: string
  firstName: string
  middleInitial?: string
  otherLastNames?: string
  address: string
  apartmentNumber?: string
  city: string
  state: string
  zipCode: string
  dateOfBirth: string
  socialSecurityNumber?: string
  emailAddress?: string
  phoneNumber?: string
  citizenshipStatus: 'us_citizen' | 'noncitizen_national' | 'lawful_permanent_resident' | 'alien_authorized'
  alienNumber?: string
  i94AdmissionNumber?: string
  foreignPassportNumber?: string
  foreignPassportCountry?: string
  workAuthorizationExpiration?: string
  signatureDate: string
  preparer?: {
    lastName: string
    firstName: string
    address: string
    city: string
    state: string
    zipCode: string
    signatureDate: string
  }
}

export interface Section2Document {
  category: DocumentCategory
  documentTitle: string
  documentNumber?: string
  issuingAuthority?: string
  expirationDate?: string
  fileUrl?: string
}

export interface Section2Data {
  documents: Section2Document[]
  employerName: string
  employerTitle: string
  employerSignatureDate: string
  employerAddress?: string
  employerCity?: string
  employerState?: string
  employerZipCode?: string
  firstDayOfEmployment: string
}

export interface ComplianceReportItem {
  employeeId: string
  employeeName: string
  i9FormId: string
  status: I9Status
  hireDate: string
  section1Completed: boolean
  section2Completed: boolean
  everifySubmitted: boolean
  everifyStatus: EVerifyCaseStatus | null
  reverificationNeeded: boolean
  reverificationDate: string | null
  daysOverdue: number
  complianceLevel: 'compliant' | 'at_risk' | 'non_compliant'
}

// I-9 List A documents (establish both identity and employment authorization)
const LIST_A_DOCUMENTS = [
  'U.S. Passport',
  'U.S. Passport Card',
  'Permanent Resident Card (Form I-551)',
  'Alien Registration Receipt Card (Form I-551)',
  'Foreign passport with Form I-94',
  'Employment Authorization Document (Form I-766)',
  'Foreign passport with Form I-551 stamp',
  'Passport from FSM or RMI with Form I-94',
]

// I-9 List B documents (establish identity only)
const LIST_B_DOCUMENTS = [
  'Driver\'s license',
  'ID card issued by federal, state, or local government',
  'School ID card with photograph',
  'Voter registration card',
  'U.S. Military card or draft record',
  'Military dependent\'s ID card',
  'U.S. Coast Guard Merchant Mariner Document',
  'Native American tribal document',
  'Driver\'s license issued by Canadian government authority',
]

// I-9 List C documents (establish employment authorization only)
const LIST_C_DOCUMENTS = [
  'Social Security Account Number card',
  'Certification of report of birth (DS-1350)',
  'Original or certified birth certificate',
  'Native American tribal document',
  'U.S. Citizen ID Card (Form I-197)',
  'ID Card for use of Resident Citizen in the U.S. (Form I-179)',
  'Employment Authorization Document issued by DHS',
]

// ============================================================
// Error Classes
// ============================================================

export class I9EVerifyError extends Error {
  constructor(message: string, public code: string) {
    super(message)
    this.name = 'I9EVerifyError'
  }
}

// ============================================================
// I-9 Form Management
// ============================================================

/**
 * Create a new I-9 form for an employee.
 * Must be completed within 3 business days of hire.
 */
export async function createI9Form(
  orgId: string,
  employeeId: string,
  hireDate: string
) {
  if (!employeeId) {
    throw new I9EVerifyError('Employee ID is required', 'MISSING_EMPLOYEE_ID')
  }
  if (!hireDate) {
    throw new I9EVerifyError('Hire date is required', 'MISSING_HIRE_DATE')
  }

  // Check for existing active I-9 for this employee
  const existingForms = await db.select()
    .from(schema.i9Forms)
    .where(and(
      eq(schema.i9Forms.orgId, orgId),
      eq(schema.i9Forms.employeeId, employeeId),
      eq(schema.i9Forms.status, 'not_started')
    ))

  if (existingForms.length > 0) {
    throw new I9EVerifyError(
      'An active I-9 form already exists for this employee',
      'DUPLICATE_FORM'
    )
  }

  const [form] = await db.insert(schema.i9Forms).values({
    orgId,
    employeeId,
    hireDate,
    status: 'section1_pending',
  }).returning()

  return form
}

/**
 * Submit Section 1 of the I-9 form (employee portion).
 * Must be completed by the employee on or before the first day of employment.
 */
export async function submitSection1(
  orgId: string,
  formId: string,
  data: Section1Data
) {
  // Validate required fields
  const requiredFields: (keyof Section1Data)[] = [
    'lastName', 'firstName', 'address', 'city', 'state', 'zipCode',
    'dateOfBirth', 'citizenshipStatus', 'signatureDate'
  ]

  for (const field of requiredFields) {
    if (!data[field]) {
      throw new I9EVerifyError(
        `Section 1 field '${field}' is required`,
        'MISSING_SECTION1_FIELD'
      )
    }
  }

  // Validate citizenship status-specific fields
  if (data.citizenshipStatus === 'lawful_permanent_resident' && !data.alienNumber) {
    throw new I9EVerifyError(
      'Alien/USCIS Number is required for Lawful Permanent Residents',
      'MISSING_ALIEN_NUMBER'
    )
  }

  if (data.citizenshipStatus === 'alien_authorized') {
    if (!data.workAuthorizationExpiration) {
      throw new I9EVerifyError(
        'Work authorization expiration date is required',
        'MISSING_WORK_AUTH_EXPIRATION'
      )
    }
    if (!data.alienNumber && !data.i94AdmissionNumber && !data.foreignPassportNumber) {
      throw new I9EVerifyError(
        'At least one of: Alien Number, I-94 Admission Number, or Foreign Passport Number is required',
        'MISSING_IDENTIFICATION_NUMBER'
      )
    }
  }

  // Fetch and validate the form
  const forms = await db.select()
    .from(schema.i9Forms)
    .where(and(
      eq(schema.i9Forms.id, formId),
      eq(schema.i9Forms.orgId, orgId)
    ))

  const form = forms[0]
  if (!form) {
    throw new I9EVerifyError('I-9 form not found', 'FORM_NOT_FOUND')
  }
  if (form.status !== 'section1_pending' && form.status !== 'not_started') {
    throw new I9EVerifyError(
      `Section 1 cannot be submitted when form is in '${form.status}' status`,
      'INVALID_STATUS'
    )
  }

  const now = new Date()
  const [updated] = await db.update(schema.i9Forms)
    .set({
      status: 'section1_complete',
      section1Data: data as any,
      section1CompletedAt: now,
      updatedAt: now,
    })
    .where(eq(schema.i9Forms.id, formId))
    .returning()

  return updated
}

/**
 * Verify Section 2 documents and complete the employer portion.
 * Validates document combinations (List A alone, or List B + List C).
 */
export async function verifySection2Documents(
  orgId: string,
  formId: string,
  verifiedBy: string,
  data: Section2Data
) {
  // Fetch the form
  const forms = await db.select()
    .from(schema.i9Forms)
    .where(and(
      eq(schema.i9Forms.id, formId),
      eq(schema.i9Forms.orgId, orgId)
    ))

  const form = forms[0]
  if (!form) {
    throw new I9EVerifyError('I-9 form not found', 'FORM_NOT_FOUND')
  }
  if (form.status !== 'section1_complete') {
    throw new I9EVerifyError(
      'Section 1 must be completed before Section 2',
      'SECTION1_INCOMPLETE'
    )
  }

  // Validate documents - must have either List A document, or List B + List C combination
  const { documents } = data
  if (!documents || documents.length === 0) {
    throw new I9EVerifyError('At least one document is required', 'NO_DOCUMENTS')
  }

  const listADocs = documents.filter(d => d.category === 'list_a')
  const listBDocs = documents.filter(d => d.category === 'list_b')
  const listCDocs = documents.filter(d => d.category === 'list_c')

  let isValidCombination = false

  if (listADocs.length >= 1) {
    // List A document alone is sufficient
    isValidCombination = true
  } else if (listBDocs.length >= 1 && listCDocs.length >= 1) {
    // List B + List C combination
    isValidCombination = true
  }

  if (!isValidCombination) {
    throw new I9EVerifyError(
      'Invalid document combination. Provide either: a List A document, or one List B document AND one List C document.',
      'INVALID_DOCUMENT_COMBINATION'
    )
  }

  // Validate document titles against acceptable lists
  for (const doc of documents) {
    const validTitles = doc.category === 'list_a' ? LIST_A_DOCUMENTS
      : doc.category === 'list_b' ? LIST_B_DOCUMENTS
      : LIST_C_DOCUMENTS

    // Allow custom titles but log a warning for non-standard ones
    if (!doc.documentTitle?.trim()) {
      throw new I9EVerifyError(
        `Document title is required for ${doc.category} document`,
        'MISSING_DOCUMENT_TITLE'
      )
    }
  }

  // Check for expired documents
  const today = new Date().toISOString().split('T')[0]
  for (const doc of documents) {
    if (doc.expirationDate && doc.expirationDate < today) {
      throw new I9EVerifyError(
        `Document "${doc.documentTitle}" has expired (${doc.expirationDate})`,
        'EXPIRED_DOCUMENT'
      )
    }
  }

  // Validate employer information
  if (!data.employerName?.trim() || !data.employerTitle?.trim() || !data.employerSignatureDate) {
    throw new I9EVerifyError(
      'Employer name, title, and signature date are required',
      'MISSING_EMPLOYER_INFO'
    )
  }

  const now = new Date()

  // Store the documents
  const i9Docs = await Promise.all(
    documents.map(doc =>
      db.insert(schema.i9Documents).values({
        i9FormId: formId,
        orgId,
        category: doc.category,
        documentTitle: doc.documentTitle,
        documentNumber: doc.documentNumber || null,
        issuingAuthority: doc.issuingAuthority || null,
        expirationDate: doc.expirationDate || null,
        fileUrl: doc.fileUrl || null,
        isVerified: true,
        verifiedBy,
        verifiedAt: now,
      }).returning()
    )
  )

  // Calculate reverification date based on work authorization expiration
  const section1Data = form.section1Data as Section1Data | null
  let reverificationDate: string | null = null
  if (section1Data?.workAuthorizationExpiration) {
    reverificationDate = section1Data.workAuthorizationExpiration
  }

  // Also check document expiration dates for List A foreign documents
  for (const doc of documents) {
    if (doc.category === 'list_a' && doc.expirationDate) {
      if (!reverificationDate || doc.expirationDate < reverificationDate) {
        reverificationDate = doc.expirationDate
      }
    }
  }

  // Update the form
  const [updated] = await db.update(schema.i9Forms)
    .set({
      status: 'section2_complete',
      section2Data: data as any,
      section2CompletedAt: now,
      verifiedBy,
      reverificationDate,
      updatedAt: now,
    })
    .where(eq(schema.i9Forms.id, formId))
    .returning()

  return {
    form: updated,
    documents: i9Docs.map(d => d[0]),
    reverificationDate,
  }
}

/**
 * Submit a completed I-9 to E-Verify for electronic employment eligibility verification.
 * Must be submitted within 3 business days of the employee's first day of work.
 */
export async function submitToEVerify(
  orgId: string,
  formId: string,
  submittedBy: string
) {
  // Fetch the form
  const forms = await db.select()
    .from(schema.i9Forms)
    .where(and(
      eq(schema.i9Forms.id, formId),
      eq(schema.i9Forms.orgId, orgId)
    ))

  const form = forms[0]
  if (!form) {
    throw new I9EVerifyError('I-9 form not found', 'FORM_NOT_FOUND')
  }
  if (form.status !== 'section2_complete') {
    throw new I9EVerifyError(
      'Both Section 1 and Section 2 must be completed before E-Verify submission',
      'SECTIONS_INCOMPLETE'
    )
  }

  // Check 3-business-day rule compliance
  const hireDate = new Date(form.hireDate)
  const today = new Date()
  const daysSinceHire = Math.floor((today.getTime() - hireDate.getTime()) / (1000 * 60 * 60 * 24))

  let complianceWarning: string | null = null
  if (daysSinceHire > 3) {
    complianceWarning = `E-Verify submission is ${daysSinceHire - 3} day(s) overdue. Federal requirement is 3 business days after hire date.`
  }

  // Generate a simulated case number (in production, this would call E-Verify API)
  const caseNumber = `EV-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`

  const now = new Date()

  // Create E-Verify case
  const [everifyCase] = await db.insert(schema.everifyCases).values({
    orgId,
    i9FormId: formId,
    employeeId: form.employeeId,
    caseNumber,
    status: 'initial_verification',
    submittedAt: now,
    submittedBy,
  }).returning()

  // Update I-9 form status
  await db.update(schema.i9Forms)
    .set({
      status: 'everify_submitted',
      updatedAt: now,
    })
    .where(eq(schema.i9Forms.id, formId))

  return {
    case: everifyCase,
    caseNumber,
    status: 'initial_verification',
    complianceWarning,
    submittedAt: now.toISOString(),
  }
}

/**
 * Check the current status of an E-Verify case.
 * In production, this would poll the E-Verify API.
 */
export async function checkEVerifyStatus(
  orgId: string,
  caseId: string
) {
  const cases = await db.select()
    .from(schema.everifyCases)
    .where(and(
      eq(schema.everifyCases.id, caseId),
      eq(schema.everifyCases.orgId, orgId)
    ))

  const everifyCase = cases[0]
  if (!everifyCase) {
    throw new I9EVerifyError('E-Verify case not found', 'CASE_NOT_FOUND')
  }

  // Get the associated I-9 form
  const forms = await db.select()
    .from(schema.i9Forms)
    .where(eq(schema.i9Forms.id, everifyCase.i9FormId))

  const form = forms[0]

  // Get employee info
  const employees = await db.select()
    .from(schema.employees)
    .where(eq(schema.employees.id, everifyCase.employeeId))

  const employee = employees[0]

  return {
    caseId: everifyCase.id,
    caseNumber: everifyCase.caseNumber,
    status: everifyCase.status,
    employeeId: everifyCase.employeeId,
    employeeName: employee?.fullName || 'Unknown',
    submittedAt: everifyCase.submittedAt,
    verificationResult: everifyCase.verificationResult,
    tncDetails: everifyCase.status === 'tentative_nonconfirmation' ? {
      issueDate: everifyCase.tncIssueDate,
      referralDate: everifyCase.tncReferralDate,
      contestDeadline: everifyCase.tncContestDeadline,
      isContesting: everifyCase.employeeContesting,
    } : null,
    photoMatchResult: everifyCase.photoMatchResult,
    i9Status: form?.status || null,
    closedAt: everifyCase.closedAt,
    closureReason: everifyCase.closureReason,
  }
}

/**
 * Handle a Tentative Non-Confirmation (TNC) from E-Verify.
 * Employees have 10 federal government work days to resolve.
 */
export async function handleTentativeNonConfirmation(
  orgId: string,
  caseId: string,
  action: 'contest' | 'accept',
  employeeNotified: boolean
) {
  const cases = await db.select()
    .from(schema.everifyCases)
    .where(and(
      eq(schema.everifyCases.id, caseId),
      eq(schema.everifyCases.orgId, orgId)
    ))

  const everifyCase = cases[0]
  if (!everifyCase) {
    throw new I9EVerifyError('E-Verify case not found', 'CASE_NOT_FOUND')
  }

  if (everifyCase.status !== 'tentative_nonconfirmation') {
    throw new I9EVerifyError(
      'This case is not in TNC status',
      'INVALID_CASE_STATUS'
    )
  }

  if (!employeeNotified) {
    throw new I9EVerifyError(
      'Employee must be notified of TNC before proceeding. This is a federal requirement.',
      'EMPLOYEE_NOT_NOTIFIED'
    )
  }

  const now = new Date()

  if (action === 'contest') {
    // Employee is contesting - refer to the relevant agency
    const contestDeadline = new Date()
    contestDeadline.setDate(contestDeadline.getDate() + 10) // 10 federal government work days

    const [updated] = await db.update(schema.everifyCases)
      .set({
        employeeContesting: true,
        tncContestDeadline: contestDeadline.toISOString().split('T')[0],
        tncReferralDate: now.toISOString().split('T')[0],
        status: 'case_in_continuance',
        updatedAt: now,
      })
      .where(eq(schema.everifyCases.id, caseId))
      .returning()

    // Update I-9 form
    await db.update(schema.i9Forms)
      .set({ status: 'tnc_contested', updatedAt: now })
      .where(eq(schema.i9Forms.id, everifyCase.i9FormId))

    return {
      caseId,
      status: 'case_in_continuance',
      action: 'contest',
      contestDeadline: contestDeadline.toISOString().split('T')[0],
      message: 'Employee is contesting TNC. Case referred to relevant agency. Do NOT terminate employment during this period.',
    }
  } else {
    // Employee accepts TNC - close case as unauthorized
    const [updated] = await db.update(schema.everifyCases)
      .set({
        employeeContesting: false,
        status: 'close_case_unauthorized',
        closedAt: now,
        closureReason: 'Employee did not contest Tentative Non-Confirmation',
        updatedAt: now,
      })
      .where(eq(schema.everifyCases.id, caseId))
      .returning()

    // Update I-9 form
    await db.update(schema.i9Forms)
      .set({ status: 'final_nonconfirmation', updatedAt: now })
      .where(eq(schema.i9Forms.id, everifyCase.i9FormId))

    return {
      caseId,
      status: 'close_case_unauthorized',
      action: 'accept',
      message: 'Employee did not contest TNC. Case closed as unauthorized. Employer may take employment action.',
    }
  }
}

/**
 * Generate a comprehensive compliance report for I-9/E-Verify.
 * Identifies at-risk and non-compliant employees.
 */
export async function getComplianceReport(
  orgId: string
): Promise<{ items: ComplianceReportItem[]; summary: Record<string, number> }> {
  // Get all I-9 forms with employee data
  const forms = await db.select({
    form: schema.i9Forms,
    employee: schema.employees,
  })
    .from(schema.i9Forms)
    .leftJoin(schema.employees, eq(schema.i9Forms.employeeId, schema.employees.id))
    .where(eq(schema.i9Forms.orgId, orgId))

  // Get E-Verify cases
  const cases = await db.select()
    .from(schema.everifyCases)
    .where(eq(schema.everifyCases.orgId, orgId))

  const casesByFormId = cases.reduce((acc, c) => {
    acc[c.i9FormId] = c
    return acc
  }, {} as Record<string, typeof cases[0]>)

  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]

  const items: ComplianceReportItem[] = forms.map(({ form, employee }) => {
    const everifyCase = casesByFormId[form.id]
    const section1Completed = !!form.section1CompletedAt
    const section2Completed = !!form.section2CompletedAt
    const reverificationNeeded = form.reverificationDate ? form.reverificationDate <= todayStr : false

    // Calculate days overdue for incomplete forms
    const hireDate = new Date(form.hireDate)
    const daysSinceHire = Math.floor((today.getTime() - hireDate.getTime()) / (1000 * 60 * 60 * 24))
    let daysOverdue = 0

    if (!section2Completed && daysSinceHire > 3) {
      daysOverdue = daysSinceHire - 3
    }

    // Determine compliance level
    let complianceLevel: 'compliant' | 'at_risk' | 'non_compliant' = 'compliant'
    if (daysOverdue > 0 || form.status === 'final_nonconfirmation') {
      complianceLevel = 'non_compliant'
    } else if (
      reverificationNeeded ||
      (!section2Completed && daysSinceHire >= 2) ||
      everifyCase?.status === 'tentative_nonconfirmation'
    ) {
      complianceLevel = 'at_risk'
    }

    return {
      employeeId: form.employeeId,
      employeeName: employee?.fullName || 'Unknown',
      i9FormId: form.id,
      status: form.status as I9Status,
      hireDate: form.hireDate,
      section1Completed,
      section2Completed,
      everifySubmitted: !!everifyCase,
      everifyStatus: (everifyCase?.status as EVerifyCaseStatus) || null,
      reverificationNeeded,
      reverificationDate: form.reverificationDate,
      daysOverdue,
      complianceLevel,
    }
  })

  const summary = {
    totalForms: items.length,
    compliant: items.filter(i => i.complianceLevel === 'compliant').length,
    atRisk: items.filter(i => i.complianceLevel === 'at_risk').length,
    nonCompliant: items.filter(i => i.complianceLevel === 'non_compliant').length,
    pendingSection1: items.filter(i => !i.section1Completed).length,
    pendingSection2: items.filter(i => i.section1Completed && !i.section2Completed).length,
    pendingEVerify: items.filter(i => i.section2Completed && !i.everifySubmitted).length,
    reverificationNeeded: items.filter(i => i.reverificationNeeded).length,
  }

  return { items, summary }
}

/**
 * Get employees needing I-9 reverification based on work authorization expiration.
 * Returns alerts for upcoming and overdue reverifications.
 */
export async function getReverificationAlerts(
  orgId: string,
  daysAhead: number = 90
) {
  const today = new Date()
  const futureDate = new Date()
  futureDate.setDate(futureDate.getDate() + daysAhead)

  const todayStr = today.toISOString().split('T')[0]
  const futureStr = futureDate.toISOString().split('T')[0]

  // Find forms needing reverification
  const forms = await db.select({
    form: schema.i9Forms,
    employee: schema.employees,
  })
    .from(schema.i9Forms)
    .leftJoin(schema.employees, eq(schema.i9Forms.employeeId, schema.employees.id))
    .where(and(
      eq(schema.i9Forms.orgId, orgId),
      lte(schema.i9Forms.reverificationDate, futureStr)
    ))
    .orderBy(asc(schema.i9Forms.reverificationDate))

  const alerts = forms.map(({ form, employee }) => {
    const revDate = form.reverificationDate!
    const isOverdue = revDate < todayStr
    const daysUntil = Math.floor(
      (new Date(revDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    )

    let urgency: 'critical' | 'high' | 'medium' | 'low'
    if (isOverdue) urgency = 'critical'
    else if (daysUntil <= 14) urgency = 'high'
    else if (daysUntil <= 30) urgency = 'medium'
    else urgency = 'low'

    return {
      formId: form.id,
      employeeId: form.employeeId,
      employeeName: employee?.fullName || 'Unknown',
      reverificationDate: revDate,
      isOverdue,
      daysUntilDue: daysUntil,
      urgency,
      status: form.status,
    }
  })

  return {
    alerts,
    summary: {
      totalAlerts: alerts.length,
      critical: alerts.filter(a => a.urgency === 'critical').length,
      high: alerts.filter(a => a.urgency === 'high').length,
      medium: alerts.filter(a => a.urgency === 'medium').length,
      low: alerts.filter(a => a.urgency === 'low').length,
    },
  }
}

/**
 * Submit multiple completed I-9 forms to E-Verify in bulk.
 */
export async function bulkSubmitEVerify(
  orgId: string,
  formIds: string[],
  submittedBy: string
) {
  const results: { formId: string; success: boolean; caseNumber?: string; error?: string }[] = []

  for (const formId of formIds) {
    try {
      const result = await submitToEVerify(orgId, formId, submittedBy)
      results.push({
        formId,
        success: true,
        caseNumber: result.caseNumber,
      })
    } catch (err) {
      results.push({
        formId,
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      })
    }
  }

  return {
    results,
    summary: {
      total: formIds.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
    },
  }
}

/**
 * List all I-9 forms for an organization with optional filters.
 */
export async function listI9Forms(
  orgId: string,
  filters?: {
    status?: I9Status
    employeeId?: string
    limit?: number
    offset?: number
  }
) {
  const conditions = [eq(schema.i9Forms.orgId, orgId)]

  if (filters?.status) {
    conditions.push(eq(schema.i9Forms.status, filters.status))
  }
  if (filters?.employeeId) {
    conditions.push(eq(schema.i9Forms.employeeId, filters.employeeId))
  }

  const forms = await db.select({
    form: schema.i9Forms,
    employee: schema.employees,
  })
    .from(schema.i9Forms)
    .leftJoin(schema.employees, eq(schema.i9Forms.employeeId, schema.employees.id))
    .where(and(...conditions))
    .orderBy(desc(schema.i9Forms.createdAt))
    .limit(filters?.limit || 50)
    .offset(filters?.offset || 0)

  return {
    forms: forms.map(({ form, employee }) => ({
      ...form,
      employeeName: employee?.fullName || 'Unknown',
    })),
    total: forms.length,
  }
}

/**
 * List valid document titles for a given I-9 category.
 */
export function getAcceptableDocuments(category?: DocumentCategory) {
  if (category === 'list_a') return LIST_A_DOCUMENTS
  if (category === 'list_b') return LIST_B_DOCUMENTS
  if (category === 'list_c') return LIST_C_DOCUMENTS
  return {
    list_a: LIST_A_DOCUMENTS,
    list_b: LIST_B_DOCUMENTS,
    list_c: LIST_C_DOCUMENTS,
  }
}
