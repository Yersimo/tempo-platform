/**
 * External Connectors Framework
 *
 * Pluggable interfaces for third-party systems Tempo needs to talk to
 * for sensitive journeys: EAP (Employee Assistance Program), benefits
 * providers, legal e-discovery, regulator filings, etc.
 *
 * Each connector exposes a tight, typed interface. Mock implementations
 * ship in the box so demos work without external credentials. Real
 * implementations slot in when the customer's vendor/contract is wired.
 *
 * This is the foundation for Phase 4 — the Tier 3 journeys
 * (whistleblower, retaliation, accommodation, domestic violence) all
 * depend on these connectors.
 */

// ─── EAP (Employee Assistance Program) ──────────────────────────────

export interface EAPConnector {
  name: string
  /** Provider's confidential intake URL, branded per customer */
  getIntakeUrl(employeeId: string): Promise<string>
  /** Trigger an outbound referral with consent — returns case ID */
  createReferral(input: {
    employeeId: string
    category: 'mental_health' | 'substance_use' | 'domestic_violence' | 'bereavement' | 'financial'
    severity: 'support' | 'urgent' | 'crisis'
    consentToShare: 'none' | 'manager_only' | 'hr_only' | 'full'
    notes: string
  }): Promise<{ caseId: string; intakeUrl: string; warmHandoff: boolean }>
  /** Status check (no PII exposed back to Tempo) */
  getCaseStatus(caseId: string): Promise<{ status: 'open' | 'engaged' | 'closed'; lastActivity: string | null }>
}

// ─── Benefits Provider ──────────────────────────────────────────────

export interface BenefitsConnector {
  name: string
  /** Add a dependent (spouse, child) on a life event */
  addDependent(input: {
    employeeId: string
    dependentType: 'spouse' | 'child' | 'parent'
    name: string
    dateOfBirth?: string
    effectiveDate: string
    /** 30-day window for medical, 60 for some life events */
    withinSpecialEnrollment: boolean
  }): Promise<{ confirmationId: string; effectiveDate: string }>
  /** Update beneficiary on marriage/divorce */
  updateBeneficiary(input: {
    employeeId: string
    beneficiaryType: 'life_insurance' | 'retirement' | 'pension'
    beneficiaryName: string
    percentage: number
  }): Promise<{ confirmationId: string }>
  /** Activate maternity/paternity coverage */
  activateParentalCoverage(input: {
    employeeId: string
    type: 'prenatal' | 'postnatal' | 'adoption_support'
    expectedDate: string
  }): Promise<{ confirmationId: string; coverageStart: string }>
}

// ─── Legal (e-discovery, court orders, regulator response) ──────────

export interface LegalConnector {
  name: string
  /** Open a confidential matter — whistleblower, investigation */
  openMatter(input: {
    type: 'whistleblower' | 'investigation' | 'regulatory_request' | 'litigation_hold'
    summary: string
    /** Who has need-to-know — minimum: Legal panel */
    panel: string[]
    triggeringEvent: string
  }): Promise<{ matterId: string; panel: string[]; intakeUrl: string }>
  /** Apply a litigation hold — freeze data deletion across the org */
  applyLitigationHold(input: {
    matterId: string
    custodians: string[] // employee IDs
    scope: { startDate: string; endDate: string | null; dataTypes: string[] }
  }): Promise<{ holdId: string; appliedAt: string; custodianCount: number }>
  /** Generate an evidence pack for regulator response */
  buildEvidencePack(input: {
    matterId: string
    scope: { entityType: string; entityIds: string[] }
    format: 'pdf_redacted' | 'csv_raw' | 'json_audit'
  }): Promise<{ packId: string; estimatedReadyAt: string }>
}

// ─── Regulator filing connector ─────────────────────────────────────

export interface RegulatorConnector {
  name: string
  countryCode: string
  authority: string
  /** Submit a filing — payroll tax, PAYE, NSSF, etc. */
  submit(input: {
    filingType: string
    period: { from: string; to: string }
    payload: Record<string, unknown>
  }): Promise<{ filingId: string; submittedAt: string; receiptUrl: string | null }>
  /** Check filing status */
  getFilingStatus(filingId: string): Promise<{
    status: 'pending' | 'accepted' | 'rejected' | 'amended'
    notes: string | null
  }>
}

// ─── Registry — connectors discover themselves at boot ──────────────

type ConnectorKind = 'eap' | 'benefits' | 'legal' | 'regulator'

interface ConnectorRegistry {
  eap: EAPConnector | null
  benefits: BenefitsConnector | null
  legal: LegalConnector | null
  regulators: Record<string, RegulatorConnector> // keyed by country code
}

const _registry: ConnectorRegistry = {
  eap: null,
  benefits: null,
  legal: null,
  regulators: {},
}

export function registerConnector<K extends ConnectorKind>(
  kind: K,
  connector: K extends 'eap'
    ? EAPConnector
    : K extends 'benefits'
      ? BenefitsConnector
      : K extends 'legal'
        ? LegalConnector
        : RegulatorConnector,
  countryCode?: string,
): void {
  if (kind === 'eap') _registry.eap = connector as EAPConnector
  if (kind === 'benefits') _registry.benefits = connector as BenefitsConnector
  if (kind === 'legal') _registry.legal = connector as LegalConnector
  if (kind === 'regulator' && countryCode) {
    _registry.regulators[countryCode] = connector as RegulatorConnector
  }
}

export function getConnector<K extends ConnectorKind>(
  kind: K,
  countryCode?: string,
):
  | (K extends 'eap'
      ? EAPConnector
      : K extends 'benefits'
        ? BenefitsConnector
        : K extends 'legal'
          ? LegalConnector
          : RegulatorConnector)
  | null {
  if (kind === 'eap') return _registry.eap as never
  if (kind === 'benefits') return _registry.benefits as never
  if (kind === 'legal') return _registry.legal as never
  if (kind === 'regulator' && countryCode) {
    return (_registry.regulators[countryCode] ?? null) as never
  }
  return null
}

// ─── Mock implementations (default — demo works without external creds) ─

export const mockEAP: EAPConnector = {
  name: 'mock-eap',
  async getIntakeUrl(employeeId) {
    return `https://eap.example.com/intake?ref=${employeeId}`
  },
  async createReferral(input) {
    return {
      caseId: `eap-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      intakeUrl: `https://eap.example.com/case/${input.employeeId}`,
      warmHandoff: input.severity !== 'support',
    }
  },
  async getCaseStatus() {
    return { status: 'open', lastActivity: new Date().toISOString() }
  },
}

export const mockBenefits: BenefitsConnector = {
  name: 'mock-benefits',
  async addDependent(input) {
    return {
      confirmationId: `ben-${Date.now()}`,
      effectiveDate: input.effectiveDate,
    }
  },
  async updateBeneficiary() {
    return { confirmationId: `ben-bene-${Date.now()}` }
  },
  async activateParentalCoverage(input) {
    return {
      confirmationId: `ben-par-${Date.now()}`,
      coverageStart: input.expectedDate,
    }
  },
}

export const mockLegal: LegalConnector = {
  name: 'mock-legal',
  async openMatter(input) {
    return {
      matterId: `mat-${Date.now()}`,
      panel: input.panel,
      intakeUrl: `https://legal.example.com/matters/${Date.now()}`,
    }
  },
  async applyLitigationHold(input) {
    return {
      holdId: `hold-${Date.now()}`,
      appliedAt: new Date().toISOString(),
      custodianCount: input.custodians.length,
    }
  },
  async buildEvidencePack() {
    const ready = new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString()
    return { packId: `pack-${Date.now()}`, estimatedReadyAt: ready }
  },
}

// ─── Boot — register mocks by default ───────────────────────────────

registerConnector('eap', mockEAP)
registerConnector('benefits', mockBenefits)
registerConnector('legal', mockLegal)

// ─── Real provider stubs ─────────────────────────────────────────────
/**
 * Real implementations live behind env-gated factories:
 *
 *   // src/lib/connectors/lyra-eap.ts
 *   export function lyraEAP(): EAPConnector { ... uses LYRA_API_KEY ... }
 *
 *   // src/lib/connectors/aon-benefits.ts
 *   export function aonBenefits(): BenefitsConnector { ... uses AON_PARTNER_ID ... }
 *
 *   // src/lib/connectors/everlaw-legal.ts
 *   export function everlawLegal(): LegalConnector { ... uses EVERLAW_API_KEY ... }
 *
 * On app boot, if creds exist, swap the mock for the real one:
 *
 *   if (process.env.LYRA_API_KEY) registerConnector('eap', lyraEAP())
 *
 * The connector contract is stable; swapping mock → real is one line.
 */
