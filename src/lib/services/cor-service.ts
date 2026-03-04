/**
 * Contractor of Record (COR) Service
 *
 * Manages independent contractor relationships including onboarding,
 * contract management, payment processing, misclassification risk
 * assessment, tax document collection, and compliance monitoring.
 */

import { db, schema } from '@/lib/db'
import { eq, and, desc, asc, lte, gte, sql } from 'drizzle-orm'

// ============================================================
// Types
// ============================================================

export interface OnboardContractorInput {
  fullName: string
  email: string
  country: string
  jobTitle?: string
  department?: string
  rate: number
  rateType: 'hourly' | 'daily' | 'monthly' | 'project'
  currency: string
  paymentFrequency?: 'weekly' | 'biweekly' | 'monthly' | 'milestone' | 'on_completion'
  startDate: string
  endDate?: string
  taxClassification?: string
  taxDocuments?: TaxDocument[]
}

export interface TaxDocument {
  type: 'w9' | 'w8ben' | 'w8ben_e' | 'local_tax_form' | 'gst_registration' | 'vat_registration'
  url?: string
  uploadedAt?: string
  status?: 'pending' | 'validated' | 'rejected' | 'expired'
  expiresAt?: string
}

export interface CreateContractInput {
  contractorId: string
  contractType: 'sow' | 'msa' | 'nda' | 'ip_assignment' | 'amendment'
  title: string
  scopeOfWork?: string
  deliverables?: Deliverable[]
  totalValue?: number
  currency?: string
  startDate?: string
  endDate?: string
}

export interface Deliverable {
  title: string
  description?: string
  dueDate?: string
  amount?: number
  status?: 'pending' | 'in_progress' | 'completed' | 'overdue'
}

export interface AmendContractInput {
  title?: string
  scopeOfWork?: string
  deliverables?: Deliverable[]
  totalValue?: number
  endDate?: string
}

export interface ProcessPaymentInput {
  contractorId: string
  contractId?: string
  amount: number
  currency: string
  periodStart?: string
  periodEnd?: string
  hoursWorked?: number
  paymentMethod?: 'bank_transfer' | 'paypal' | 'wise' | 'crypto'
  invoiceUrl?: string
}

export interface MisclassificationAssessment {
  contractorId: string
  overallRisk: 'low' | 'medium' | 'high'
  score: number // 0-100, higher = higher risk
  factors: MisclassificationFactor[]
  recommendations: string[]
  lastAssessedAt: string
}

export interface MisclassificationFactor {
  category: string
  question: string
  answer: boolean | string
  riskContribution: 'low' | 'medium' | 'high'
  weight: number
  explanation: string
}

export interface ContractorDashboard {
  summary: {
    totalContractors: number
    activeContractors: number
    totalSpendYTD: number
    avgContractDuration: number
    complianceScore: number
    expiringContracts: number
  }
  byCountry: Array<{ country: string; count: number; totalSpend: number }>
  byStatus: Record<string, number>
  riskDistribution: { low: number; medium: number; high: number }
  recentPayments: Array<{ contractorName: string; amount: number; currency: string; paidAt: string }>
}

// ============================================================
// IRS 20-Factor Test — Misclassification Risk Assessment
// ============================================================

const IRS_20_FACTORS: Array<{
  id: string
  category: string
  question: string
  employeeIndicator: string
  weight: number
}> = [
  {
    id: 'instructions',
    category: 'Behavioral Control',
    question: 'Does the company provide detailed instructions on how work must be performed?',
    employeeIndicator: 'Detailed instructions suggest employee relationship',
    weight: 8,
  },
  {
    id: 'training',
    category: 'Behavioral Control',
    question: 'Does the company provide training on how to do the job?',
    employeeIndicator: 'Required training suggests employee relationship',
    weight: 7,
  },
  {
    id: 'integration',
    category: 'Behavioral Control',
    question: 'Are the worker\'s services integrated into the company\'s core business operations?',
    employeeIndicator: 'Deep integration suggests employee relationship',
    weight: 6,
  },
  {
    id: 'personal_services',
    category: 'Behavioral Control',
    question: 'Must the worker personally perform the services (cannot delegate or subcontract)?',
    employeeIndicator: 'Personal service requirement suggests employee relationship',
    weight: 5,
  },
  {
    id: 'hiring_assistants',
    category: 'Behavioral Control',
    question: 'Does the company control who the worker hires or assigns to assist?',
    employeeIndicator: 'Company control over hiring suggests employee relationship',
    weight: 4,
  },
  {
    id: 'continuing_relationship',
    category: 'Financial Control',
    question: 'Is this an ongoing/indefinite relationship rather than project-based?',
    employeeIndicator: 'Continuing relationship suggests employee',
    weight: 8,
  },
  {
    id: 'set_hours',
    category: 'Financial Control',
    question: 'Does the company set specific work hours or schedule?',
    employeeIndicator: 'Set hours suggest employee relationship',
    weight: 7,
  },
  {
    id: 'full_time',
    category: 'Financial Control',
    question: 'Is the worker required to devote full-time to the company?',
    employeeIndicator: 'Full-time requirement suggests employee relationship',
    weight: 7,
  },
  {
    id: 'work_location',
    category: 'Financial Control',
    question: 'Must the work be performed on the company\'s premises?',
    employeeIndicator: 'Required on-site work suggests employee relationship',
    weight: 5,
  },
  {
    id: 'order_sequence',
    category: 'Financial Control',
    question: 'Does the company dictate the order or sequence of work?',
    employeeIndicator: 'Dictated work order suggests employee relationship',
    weight: 4,
  },
  {
    id: 'reports',
    category: 'Financial Control',
    question: 'Must the worker submit regular written or oral reports?',
    employeeIndicator: 'Required reporting suggests employee relationship',
    weight: 3,
  },
  {
    id: 'payment_method',
    category: 'Financial Control',
    question: 'Is the worker paid by time (hourly/weekly/monthly) rather than by project/deliverable?',
    employeeIndicator: 'Time-based payment suggests employee relationship',
    weight: 6,
  },
  {
    id: 'expenses',
    category: 'Financial Control',
    question: 'Does the company reimburse the worker\'s business and travel expenses?',
    employeeIndicator: 'Expense reimbursement suggests employee relationship',
    weight: 4,
  },
  {
    id: 'tools_materials',
    category: 'Financial Control',
    question: 'Does the company provide tools, materials, and equipment?',
    employeeIndicator: 'Provided tools suggest employee relationship',
    weight: 5,
  },
  {
    id: 'investment',
    category: 'Financial Control',
    question: 'Does the worker have no significant investment in their own business facilities?',
    employeeIndicator: 'No independent investment suggests employee relationship',
    weight: 6,
  },
  {
    id: 'profit_loss',
    category: 'Relationship Type',
    question: 'Is the worker shielded from profit or loss risk?',
    employeeIndicator: 'No profit/loss risk suggests employee relationship',
    weight: 7,
  },
  {
    id: 'multiple_clients',
    category: 'Relationship Type',
    question: 'Does the worker work exclusively for this company (no other clients)?',
    employeeIndicator: 'Exclusive arrangement suggests employee relationship',
    weight: 8,
  },
  {
    id: 'market_services',
    category: 'Relationship Type',
    question: 'Does the worker NOT market their services to the general public?',
    employeeIndicator: 'Not marketing services suggests employee relationship',
    weight: 5,
  },
  {
    id: 'termination',
    category: 'Relationship Type',
    question: 'Can the company terminate the worker without cause (at-will)?',
    employeeIndicator: 'At-will termination suggests employee relationship',
    weight: 6,
  },
  {
    id: 'quit_right',
    category: 'Relationship Type',
    question: 'Can the worker quit at any time without contractual penalty?',
    employeeIndicator: 'Unrestricted quit right suggests employee relationship',
    weight: 4,
  },
]

// Country-specific contractor compliance requirements
const COUNTRY_CONTRACTOR_RULES: Record<string, {
  requiredDocuments: string[]
  maxContractDuration?: number // months
  taxWithholdingRequired: boolean
  localRegistrationRequired: boolean
  misclassificationPenalties: string
}> = {
  US: {
    requiredDocuments: ['W-9 (US persons)', 'W-8BEN (foreign persons)'],
    taxWithholdingRequired: false,
    localRegistrationRequired: false,
    misclassificationPenalties: 'Back taxes, penalties up to 100% of unpaid taxes, potential criminal charges. $50 penalty per W-2 not filed.',
  },
  GB: {
    requiredDocuments: ['IR35 Status Determination', 'UTR Number', 'NI Number'],
    taxWithholdingRequired: true,
    localRegistrationRequired: true,
    misclassificationPenalties: 'IR35 rules: company liable for PAYE and NIC if contractor is deemed inside IR35. Back-dated assessments possible.',
  },
  DE: {
    requiredDocuments: ['Gewerbeanmeldung (Business Registration)', 'Tax Number', 'Invoice'],
    maxContractDuration: 24,
    taxWithholdingRequired: false,
    localRegistrationRequired: true,
    misclassificationPenalties: 'Employer liable for social security contributions (up to 4 years back). Criminal penalties possible.',
  },
  FR: {
    requiredDocuments: ['SIRET Number', 'Attestation de Vigilance', 'Professional Insurance'],
    taxWithholdingRequired: false,
    localRegistrationRequired: true,
    misclassificationPenalties: 'Requalification to employment contract. Back payment of social contributions plus penalties of 50-200%.',
  },
  CA: {
    requiredDocuments: ['SIN Number', 'GST/HST Registration (if applicable)'],
    taxWithholdingRequired: false,
    localRegistrationRequired: false,
    misclassificationPenalties: 'Employer liable for CPP, EI premiums plus penalties. Interest charges on unpaid amounts.',
  },
  AU: {
    requiredDocuments: ['ABN (Australian Business Number)', 'Tax File Number Declaration'],
    taxWithholdingRequired: true,
    localRegistrationRequired: true,
    misclassificationPenalties: 'Employer liable for superannuation, PAYG, and workers compensation. Penalties up to AUD 63,000 per breach.',
  },
  IN: {
    requiredDocuments: ['PAN Card', 'GST Registration (if turnover > threshold)', 'Aadhaar Card'],
    taxWithholdingRequired: true,
    localRegistrationRequired: false,
    misclassificationPenalties: 'PF and ESI contributions become due. Penalties and interest under respective acts.',
  },
  SG: {
    requiredDocuments: ['ACRA Registration', 'Tax Registration'],
    taxWithholdingRequired: false,
    localRegistrationRequired: true,
    misclassificationPenalties: 'CPF contributions become due plus interest. Employment Act protections apply retroactively.',
  },
  BR: {
    requiredDocuments: ['CNPJ or MEI Registration', 'Municipal Tax Registration'],
    taxWithholdingRequired: true,
    localRegistrationRequired: true,
    misclassificationPenalties: 'Full employment benefits become due retroactively, including FGTS, 13th salary, vacation. Heavy fines.',
  },
  JP: {
    requiredDocuments: ['Business Registration', 'Tax Certificate'],
    taxWithholdingRequired: true,
    localRegistrationRequired: true,
    misclassificationPenalties: 'Retroactive social insurance enrollment. Back payment of premiums plus interest. Administrative penalties.',
  },
}

// ============================================================
// Contractor Onboarding / Offboarding
// ============================================================

export async function onboardContractor(orgId: string, input: OnboardContractorInput) {
  // Validate required fields
  if (!input.fullName || !input.email || !input.country) {
    throw new Error('fullName, email, and country are required')
  }

  // Check for duplicate email
  const existing = await db
    .select({ id: schema.corContractors.id })
    .from(schema.corContractors)
    .where(and(eq(schema.corContractors.orgId, orgId), eq(schema.corContractors.email, input.email)))
    .limit(1)

  if (existing.length > 0) {
    throw new Error(`A contractor with email "${input.email}" already exists`)
  }

  // Get country rules for document requirements
  const countryRules = COUNTRY_CONTRACTOR_RULES[input.country.toUpperCase()]

  const [contractor] = await db
    .insert(schema.corContractors)
    .values({
      orgId,
      fullName: input.fullName,
      email: input.email,
      country: input.country,
      status: 'onboarding',
      jobTitle: input.jobTitle || null,
      department: input.department || null,
      rate: input.rate,
      rateType: input.rateType,
      currency: input.currency,
      paymentFrequency: input.paymentFrequency || 'monthly',
      startDate: input.startDate,
      endDate: input.endDate || null,
      complianceStatus: 'pending',
      taxClassification: input.taxClassification || 'independent_contractor',
      taxDocuments: input.taxDocuments || null,
      misclassificationRisk: null,
    })
    .returning()

  return {
    contractor,
    requiredDocuments: countryRules?.requiredDocuments || [],
    complianceNotes: countryRules ? {
      taxWithholding: countryRules.taxWithholdingRequired,
      localRegistration: countryRules.localRegistrationRequired,
      maxContractDuration: countryRules.maxContractDuration || null,
    } : null,
  }
}

export async function offboardContractor(orgId: string, contractorId: string, reason?: string) {
  const [existing] = await db
    .select()
    .from(schema.corContractors)
    .where(and(eq(schema.corContractors.id, contractorId), eq(schema.corContractors.orgId, orgId)))
    .limit(1)

  if (!existing) throw new Error(`Contractor "${contractorId}" not found`)

  // Check for pending payments
  const pendingPayments = await db
    .select()
    .from(schema.corPayments)
    .where(and(
      eq(schema.corPayments.contractorId, contractorId),
      eq(schema.corPayments.orgId, orgId),
      eq(schema.corPayments.status, 'pending')
    ))

  if (pendingPayments.length > 0) {
    throw new Error(`Cannot offboard contractor with ${pendingPayments.length} pending payment(s). Process or cancel payments first.`)
  }

  const [updated] = await db
    .update(schema.corContractors)
    .set({
      status: 'terminated',
      endDate: new Date().toISOString().split('T')[0],
      updatedAt: new Date(),
    })
    .where(eq(schema.corContractors.id, contractorId))
    .returning()

  // Terminate active contracts
  await db
    .update(schema.corContracts)
    .set({ status: 'terminated' })
    .where(and(
      eq(schema.corContracts.contractorId, contractorId),
      eq(schema.corContracts.orgId, orgId),
      eq(schema.corContracts.status, 'active')
    ))

  return { contractor: updated, reason }
}

// ============================================================
// Contract Management
// ============================================================

export async function createContract(orgId: string, input: CreateContractInput) {
  const [contractor] = await db
    .select()
    .from(schema.corContractors)
    .where(and(eq(schema.corContractors.id, input.contractorId), eq(schema.corContractors.orgId, orgId)))
    .limit(1)

  if (!contractor) throw new Error(`Contractor "${input.contractorId}" not found`)

  const [contract] = await db
    .insert(schema.corContracts)
    .values({
      orgId,
      contractorId: input.contractorId,
      contractType: input.contractType,
      title: input.title,
      documentUrl: null,
      status: 'draft',
      scopeOfWork: input.scopeOfWork || null,
      deliverables: input.deliverables || null,
      totalValue: input.totalValue || null,
      currency: input.currency || contractor.currency,
      startDate: input.startDate || null,
      endDate: input.endDate || null,
    })
    .returning()

  return contract
}

export async function amendContract(orgId: string, contractId: string, input: AmendContractInput) {
  const [existing] = await db
    .select()
    .from(schema.corContracts)
    .where(and(eq(schema.corContracts.id, contractId), eq(schema.corContracts.orgId, orgId)))
    .limit(1)

  if (!existing) throw new Error(`Contract "${contractId}" not found`)
  if (existing.status === 'terminated') throw new Error('Cannot amend a terminated contract')

  const updateData: Record<string, unknown> = {}
  if (input.title !== undefined) updateData.title = input.title
  if (input.scopeOfWork !== undefined) updateData.scopeOfWork = input.scopeOfWork
  if (input.deliverables !== undefined) updateData.deliverables = input.deliverables
  if (input.totalValue !== undefined) updateData.totalValue = input.totalValue
  if (input.endDate !== undefined) updateData.endDate = input.endDate

  const [updated] = await db
    .update(schema.corContracts)
    .set(updateData)
    .where(eq(schema.corContracts.id, contractId))
    .returning()

  return updated
}

export async function terminateContract(orgId: string, contractId: string, reason?: string) {
  const [updated] = await db
    .update(schema.corContracts)
    .set({ status: 'terminated' })
    .where(and(eq(schema.corContracts.id, contractId), eq(schema.corContracts.orgId, orgId)))
    .returning()

  if (!updated) throw new Error(`Contract "${contractId}" not found`)

  return { contract: updated, terminatedAt: new Date().toISOString(), reason }
}

// ============================================================
// Payment Processing
// ============================================================

export async function processPayment(orgId: string, input: ProcessPaymentInput) {
  const [contractor] = await db
    .select()
    .from(schema.corContractors)
    .where(and(eq(schema.corContractors.id, input.contractorId), eq(schema.corContractors.orgId, orgId)))
    .limit(1)

  if (!contractor) throw new Error(`Contractor "${input.contractorId}" not found`)
  if (contractor.status !== 'active' && contractor.status !== 'onboarding') {
    throw new Error(`Cannot process payment for contractor with status "${contractor.status}"`)
  }

  // Validate tax documents are in order
  const taxDocs = contractor.taxDocuments as TaxDocument[] | null
  if (!taxDocs || taxDocs.length === 0) {
    throw new Error('Contractor has no tax documents on file. Tax documents must be collected before processing payments.')
  }

  const [payment] = await db
    .insert(schema.corPayments)
    .values({
      orgId,
      contractorId: input.contractorId,
      contractId: input.contractId || null,
      amount: input.amount,
      currency: input.currency,
      status: 'pending',
      periodStart: input.periodStart || null,
      periodEnd: input.periodEnd || null,
      hoursWorked: input.hoursWorked || null,
      invoiceUrl: input.invoiceUrl || null,
      paymentMethod: input.paymentMethod || 'bank_transfer',
    })
    .returning()

  return payment
}

export async function approvePayment(orgId: string, paymentId: string, approvedBy: string) {
  const [existing] = await db
    .select()
    .from(schema.corPayments)
    .where(and(eq(schema.corPayments.id, paymentId), eq(schema.corPayments.orgId, orgId)))
    .limit(1)

  if (!existing) throw new Error(`Payment "${paymentId}" not found`)
  if (existing.status !== 'pending') throw new Error(`Payment cannot be approved (status: ${existing.status})`)

  const [updated] = await db
    .update(schema.corPayments)
    .set({ status: 'approved', approvedBy })
    .where(eq(schema.corPayments.id, paymentId))
    .returning()

  return updated
}

export async function getPaymentHistory(orgId: string, contractorId?: string, limit: number = 50) {
  let q = db
    .select()
    .from(schema.corPayments)
    .where(eq(schema.corPayments.orgId, orgId))
    .orderBy(desc(schema.corPayments.createdAt))
    .limit(limit)

  const payments = await q
  const filtered = contractorId
    ? payments.filter(p => p.contractorId === contractorId)
    : payments

  return filtered
}

// ============================================================
// Misclassification Risk Assessment
// ============================================================

export async function assessMisclassificationRisk(
  orgId: string,
  contractorId: string,
  responses: Record<string, boolean>
): Promise<MisclassificationAssessment> {
  const [contractor] = await db
    .select()
    .from(schema.corContractors)
    .where(and(eq(schema.corContractors.id, contractorId), eq(schema.corContractors.orgId, orgId)))
    .limit(1)

  if (!contractor) throw new Error(`Contractor "${contractorId}" not found`)

  const factors: MisclassificationFactor[] = []
  let totalScore = 0
  let maxScore = 0

  for (const factor of IRS_20_FACTORS) {
    const answer = responses[factor.id]
    const isRisky = answer === true // "yes" to most questions means higher risk

    maxScore += factor.weight
    const factorScore = isRisky ? factor.weight : 0
    totalScore += factorScore

    let riskContribution: 'low' | 'medium' | 'high' = 'low'
    if (isRisky && factor.weight >= 7) riskContribution = 'high'
    else if (isRisky && factor.weight >= 4) riskContribution = 'medium'

    factors.push({
      category: factor.category,
      question: factor.question,
      answer: answer !== undefined ? answer : 'Not assessed',
      riskContribution,
      weight: factor.weight,
      explanation: isRisky ? factor.employeeIndicator : `No ${factor.category.toLowerCase()} concern identified`,
    })
  }

  const normalizedScore = Math.round((totalScore / maxScore) * 100)
  let overallRisk: 'low' | 'medium' | 'high' = 'low'
  if (normalizedScore >= 60) overallRisk = 'high'
  else if (normalizedScore >= 35) overallRisk = 'medium'

  const recommendations: string[] = []
  if (overallRisk === 'high') {
    recommendations.push('URGENT: Consider reclassifying this worker as an employee')
    recommendations.push('Consult with employment counsel immediately')
    recommendations.push('Review and restructure the working relationship to reduce employee-like characteristics')
  } else if (overallRisk === 'medium') {
    recommendations.push('Review the working arrangement for employee-like characteristics')
    recommendations.push('Ensure contractor has other clients and markets their services independently')
    recommendations.push('Avoid setting specific work hours or requiring on-site presence')
    recommendations.push('Pay by project/deliverable rather than by time')
  } else {
    recommendations.push('Current arrangement appears consistent with independent contractor status')
    recommendations.push('Maintain documentation of the contractor\'s independent business')
    recommendations.push('Reassess periodically, especially if the relationship changes')
  }

  // Get country-specific penalties
  const countryRules = COUNTRY_CONTRACTOR_RULES[contractor.country.toUpperCase()]
  if (countryRules && overallRisk !== 'low') {
    recommendations.push(`Country risk note: ${countryRules.misclassificationPenalties}`)
  }

  // Update contractor record
  await db
    .update(schema.corContractors)
    .set({
      misclassificationRisk: overallRisk,
      complianceStatus: overallRisk === 'high' ? 'at_risk' : overallRisk === 'medium' ? 'pending' : 'compliant',
      updatedAt: new Date(),
    })
    .where(eq(schema.corContractors.id, contractorId))

  return {
    contractorId,
    overallRisk,
    score: normalizedScore,
    factors,
    recommendations,
    lastAssessedAt: new Date().toISOString(),
  }
}

// ============================================================
// Compliance & Tax Documents
// ============================================================

export async function getComplianceStatus(orgId: string, contractorId?: string) {
  const contractors = await db
    .select()
    .from(schema.corContractors)
    .where(eq(schema.corContractors.orgId, orgId))

  const filtered = contractorId
    ? contractors.filter(c => c.id === contractorId)
    : contractors

  return filtered.map(c => {
    const docs = c.taxDocuments as TaxDocument[] | null
    const hasValidDocs = docs && docs.length > 0 && docs.some(d => d.status === 'validated')
    const countryRules = COUNTRY_CONTRACTOR_RULES[c.country.toUpperCase()]

    return {
      contractorId: c.id,
      name: c.fullName,
      country: c.country,
      status: c.complianceStatus,
      misclassificationRisk: c.misclassificationRisk,
      taxDocuments: {
        onFile: docs?.length || 0,
        validated: docs?.filter(d => d.status === 'validated').length || 0,
        pending: docs?.filter(d => d.status === 'pending').length || 0,
        expired: docs?.filter(d => d.status === 'expired').length || 0,
      },
      requiredDocuments: countryRules?.requiredDocuments || [],
      issues: [
        ...(!hasValidDocs ? ['Missing validated tax documents'] : []),
        ...(c.misclassificationRisk === 'high' ? ['High misclassification risk'] : []),
        ...(c.complianceStatus === 'non_compliant' ? ['Non-compliant status'] : []),
        ...(countryRules?.localRegistrationRequired && !hasValidDocs ? ['Local registration may be required'] : []),
      ],
    }
  })
}

export async function collectTaxDocuments(orgId: string, contractorId: string, documents: TaxDocument[]) {
  const [contractor] = await db
    .select()
    .from(schema.corContractors)
    .where(and(eq(schema.corContractors.id, contractorId), eq(schema.corContractors.orgId, orgId)))
    .limit(1)

  if (!contractor) throw new Error(`Contractor "${contractorId}" not found`)

  const existingDocs = (contractor.taxDocuments as TaxDocument[]) || []
  const updatedDocs = [...existingDocs]

  for (const doc of documents) {
    const existingIndex = updatedDocs.findIndex(d => d.type === doc.type)
    const newDoc = {
      ...doc,
      uploadedAt: doc.uploadedAt || new Date().toISOString(),
      status: doc.status || 'pending' as const,
    }

    if (existingIndex >= 0) {
      updatedDocs[existingIndex] = newDoc
    } else {
      updatedDocs.push(newDoc)
    }
  }

  const [updated] = await db
    .update(schema.corContractors)
    .set({
      taxDocuments: updatedDocs,
      updatedAt: new Date(),
    })
    .where(eq(schema.corContractors.id, contractorId))
    .returning()

  return { contractor: updated, documentsOnFile: updatedDocs.length }
}

export async function validateTaxDocuments(orgId: string, contractorId: string, documentType: string, isValid: boolean, notes?: string) {
  const [contractor] = await db
    .select()
    .from(schema.corContractors)
    .where(and(eq(schema.corContractors.id, contractorId), eq(schema.corContractors.orgId, orgId)))
    .limit(1)

  if (!contractor) throw new Error(`Contractor "${contractorId}" not found`)

  const docs = (contractor.taxDocuments as TaxDocument[]) || []
  const docIndex = docs.findIndex(d => d.type === documentType)

  if (docIndex < 0) throw new Error(`Document type "${documentType}" not found for this contractor`)

  docs[docIndex] = {
    ...docs[docIndex],
    status: isValid ? 'validated' : 'rejected',
  }

  // Check overall compliance
  const allValidated = docs.length > 0 && docs.every(d => d.status === 'validated')
  const complianceStatus = allValidated ? 'compliant' : docs.some(d => d.status === 'rejected') ? 'non_compliant' : 'pending'

  const [updated] = await db
    .update(schema.corContractors)
    .set({
      taxDocuments: docs,
      complianceStatus,
      status: allValidated && contractor.status === 'onboarding' ? 'active' : contractor.status,
      updatedAt: new Date(),
    })
    .where(eq(schema.corContractors.id, contractorId))
    .returning()

  return { contractor: updated, documentValidated: isValid, complianceStatus }
}

// ============================================================
// Reports & Analytics
// ============================================================

export async function generatePaymentReport(orgId: string, options?: {
  contractorId?: string
  startDate?: string
  endDate?: string
  currency?: string
}) {
  const payments = await db
    .select({
      payment: schema.corPayments,
      contractor: schema.corContractors,
    })
    .from(schema.corPayments)
    .innerJoin(schema.corContractors, eq(schema.corPayments.contractorId, schema.corContractors.id))
    .where(eq(schema.corPayments.orgId, orgId))
    .orderBy(desc(schema.corPayments.createdAt))

  let filtered = payments

  if (options?.contractorId) {
    filtered = filtered.filter(p => p.payment.contractorId === options.contractorId)
  }
  if (options?.startDate) {
    filtered = filtered.filter(p => {
      const createdAt = p.payment.createdAt.toISOString().split('T')[0]
      return createdAt >= options.startDate!
    })
  }
  if (options?.endDate) {
    filtered = filtered.filter(p => {
      const createdAt = p.payment.createdAt.toISOString().split('T')[0]
      return createdAt <= options.endDate!
    })
  }

  const totalAmount = filtered.reduce((s, p) => s + p.payment.amount, 0)
  const paidAmount = filtered.filter(p => p.payment.status === 'paid').reduce((s, p) => s + p.payment.amount, 0)
  const pendingAmount = filtered.filter(p => p.payment.status === 'pending' || p.payment.status === 'approved').reduce((s, p) => s + p.payment.amount, 0)

  return {
    summary: {
      totalPayments: filtered.length,
      totalAmount: totalAmount / 100,
      paidAmount: paidAmount / 100,
      pendingAmount: pendingAmount / 100,
      averagePayment: filtered.length > 0 ? Math.round(totalAmount / filtered.length) / 100 : 0,
    },
    payments: filtered.map(p => ({
      paymentId: p.payment.id,
      contractorName: p.contractor.fullName,
      amount: p.payment.amount / 100,
      currency: p.payment.currency,
      status: p.payment.status,
      periodStart: p.payment.periodStart,
      periodEnd: p.payment.periodEnd,
      hoursWorked: p.payment.hoursWorked,
      paymentMethod: p.payment.paymentMethod,
      createdAt: p.payment.createdAt.toISOString(),
    })),
    generatedAt: new Date().toISOString(),
  }
}

export async function getContractorDashboard(orgId: string): Promise<ContractorDashboard> {
  const contractors = await db
    .select()
    .from(schema.corContractors)
    .where(eq(schema.corContractors.orgId, orgId))

  const payments = await db
    .select()
    .from(schema.corPayments)
    .where(eq(schema.corPayments.orgId, orgId))

  const contracts = await db
    .select()
    .from(schema.corContracts)
    .where(eq(schema.corContracts.orgId, orgId))

  // Status distribution
  const byStatus: Record<string, number> = {}
  for (const c of contractors) {
    byStatus[c.status] = (byStatus[c.status] || 0) + 1
  }

  // Country distribution
  const countryMap = new Map<string, { count: number; totalSpend: number }>()
  for (const c of contractors) {
    const existing = countryMap.get(c.country) || { count: 0, totalSpend: 0 }
    existing.count++
    const contractorPayments = payments.filter(p => p.contractorId === c.id && p.status === 'paid')
    existing.totalSpend += contractorPayments.reduce((s, p) => s + p.amount, 0) / 100
    countryMap.set(c.country, existing)
  }

  // Risk distribution
  const riskDistribution = { low: 0, medium: 0, high: 0 }
  for (const c of contractors) {
    if (c.misclassificationRisk === 'high') riskDistribution.high++
    else if (c.misclassificationRisk === 'medium') riskDistribution.medium++
    else riskDistribution.low++
  }

  // Total spend YTD
  const yearStart = new Date(new Date().getFullYear(), 0, 1)
  const ytdPayments = payments.filter(p => p.status === 'paid' && p.paidAt && new Date(p.paidAt) >= yearStart)
  const totalSpendYTD = ytdPayments.reduce((s, p) => s + p.amount, 0) / 100

  // Expiring contracts (within 30 days)
  const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const today = new Date().toISOString().split('T')[0]
  const expiringContracts = contracts.filter(c =>
    c.status === 'active' && c.endDate && c.endDate >= today && c.endDate <= thirtyDaysFromNow
  ).length

  // Average contract duration
  const completedContracts = contracts.filter(c => c.startDate && c.endDate)
  const avgDuration = completedContracts.length > 0
    ? completedContracts.reduce((s, c) => {
        const start = new Date(c.startDate!).getTime()
        const end = new Date(c.endDate!).getTime()
        return s + (end - start) / (1000 * 60 * 60 * 24 * 30)
      }, 0) / completedContracts.length
    : 0

  // Compliance score
  const totalContractors = contractors.length || 1
  const compliant = contractors.filter(c => c.complianceStatus === 'compliant').length
  const complianceScore = Math.round((compliant / totalContractors) * 100)

  // Recent payments
  const recentPayments = payments
    .filter(p => p.status === 'paid')
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 10)
    .map(p => {
      const contractor = contractors.find(c => c.id === p.contractorId)
      return {
        contractorName: contractor?.fullName || 'Unknown',
        amount: p.amount / 100,
        currency: p.currency,
        paidAt: p.paidAt?.toISOString() || p.createdAt.toISOString(),
      }
    })

  return {
    summary: {
      totalContractors: contractors.length,
      activeContractors: contractors.filter(c => c.status === 'active').length,
      totalSpendYTD,
      avgContractDuration: Math.round(avgDuration * 10) / 10,
      complianceScore,
      expiringContracts,
    },
    byCountry: Array.from(countryMap.entries()).map(([country, data]) => ({
      country,
      count: data.count,
      totalSpend: data.totalSpend,
    })),
    byStatus,
    riskDistribution,
    recentPayments,
  }
}

// ============================================================
// Contractor-to-Employee Conversion
// ============================================================

export async function convertToEmployee(orgId: string, contractorId: string, conversionData: {
  department?: string
  salary: number
  startDate: string
  benefits?: Record<string, unknown>
}) {
  const [contractor] = await db
    .select()
    .from(schema.corContractors)
    .where(and(eq(schema.corContractors.id, contractorId), eq(schema.corContractors.orgId, orgId)))
    .limit(1)

  if (!contractor) throw new Error(`Contractor "${contractorId}" not found`)

  // Create employee record
  const [employee] = await db
    .insert(schema.employees)
    .values({
      orgId,
      fullName: contractor.fullName,
      email: contractor.email,
      jobTitle: contractor.jobTitle || 'Employee',
      country: contractor.country,
      role: 'employee',
      hireDate: conversionData.startDate,
      isActive: true,
    })
    .returning()

  // Terminate contractor record
  await db
    .update(schema.corContractors)
    .set({
      status: 'terminated',
      endDate: conversionData.startDate,
      updatedAt: new Date(),
    })
    .where(eq(schema.corContractors.id, contractorId))

  // Terminate active contracts
  await db
    .update(schema.corContracts)
    .set({ status: 'terminated' })
    .where(and(
      eq(schema.corContracts.contractorId, contractorId),
      eq(schema.corContracts.orgId, orgId),
      eq(schema.corContracts.status, 'active')
    ))

  return {
    employee,
    previousContractorId: contractorId,
    conversionDate: conversionData.startDate,
    message: `${contractor.fullName} has been converted from contractor to employee`,
  }
}

// ============================================================
// Bulk Operations
// ============================================================

export async function bulkOnboard(orgId: string, contractors: OnboardContractorInput[]) {
  const results: Array<{ success: boolean; contractor?: any; error?: string }> = []

  for (const input of contractors) {
    try {
      const result = await onboardContractor(orgId, input)
      results.push({ success: true, contractor: result.contractor })
    } catch (err) {
      results.push({
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      })
    }
  }

  return {
    total: contractors.length,
    successful: results.filter(r => r.success).length,
    failed: results.filter(r => !r.success).length,
    results,
  }
}

// ============================================================
// Expiring Contracts
// ============================================================

export async function getContractExpiring(orgId: string, daysAhead: number = 30) {
  const futureDate = new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const today = new Date().toISOString().split('T')[0]

  const contracts = await db
    .select({
      contract: schema.corContracts,
      contractor: schema.corContractors,
    })
    .from(schema.corContracts)
    .innerJoin(schema.corContractors, eq(schema.corContracts.contractorId, schema.corContractors.id))
    .where(eq(schema.corContracts.orgId, orgId))
    .orderBy(asc(schema.corContracts.endDate))

  const expiring = contracts.filter(c =>
    c.contract.status === 'active' &&
    c.contract.endDate &&
    c.contract.endDate >= today &&
    c.contract.endDate <= futureDate
  )

  return expiring.map(c => ({
    contractId: c.contract.id,
    contractorName: c.contractor.fullName,
    contractorEmail: c.contractor.email,
    contractTitle: c.contract.title,
    contractType: c.contract.contractType,
    endDate: c.contract.endDate,
    daysUntilExpiry: Math.ceil((new Date(c.contract.endDate!).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
    totalValue: c.contract.totalValue ? c.contract.totalValue / 100 : null,
    currency: c.contract.currency,
  }))
}

// ============================================================
// Total Spend Calculation
// ============================================================

export async function calculateTotalSpend(orgId: string, options?: {
  contractorId?: string
  startDate?: string
  endDate?: string
}) {
  const payments = await db
    .select()
    .from(schema.corPayments)
    .where(eq(schema.corPayments.orgId, orgId))

  let filtered = payments.filter(p => p.status === 'paid')

  if (options?.contractorId) {
    filtered = filtered.filter(p => p.contractorId === options.contractorId)
  }
  if (options?.startDate) {
    filtered = filtered.filter(p => p.paidAt && p.paidAt.toISOString().split('T')[0] >= options.startDate!)
  }
  if (options?.endDate) {
    filtered = filtered.filter(p => p.paidAt && p.paidAt.toISOString().split('T')[0] <= options.endDate!)
  }

  // Group by currency
  const byCurrency = new Map<string, number>()
  for (const p of filtered) {
    const current = byCurrency.get(p.currency) || 0
    byCurrency.set(p.currency, current + p.amount)
  }

  return {
    totalPayments: filtered.length,
    byCurrency: Array.from(byCurrency.entries()).map(([currency, amount]) => ({
      currency,
      amount: amount / 100,
    })),
    period: {
      start: options?.startDate || 'all-time',
      end: options?.endDate || 'present',
    },
  }
}
