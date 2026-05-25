/**
 * Ecobank Transnational Incorporated — Signing Authority Matrix
 *
 * Realistic seed data for the demo. Production: this lives in the
 * `signing_authorities` table, kept in sync with HR + Finance records.
 *
 * Reflects ETI Policy §12 categorization (Groups A/B/C) and §3.h.i
 * delegation rules (max 1 year validity).
 *
 * Approval limits are in USD cents.
 */

import type { SigningAuthority } from '@/lib/services/policy-engine'

const ONE_YEAR_FROM_NOW = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()

export const ECOBANK_SIGNING_AUTHORITIES: SigningAuthority[] = [
  // ─── GROUP EXECUTIVE COMMITTEE — Category A, unlimited ────────────
  {
    employeeId: 'emp-gceo',
    fullName: 'Jeremy Awori',
    title: 'Group Chief Executive Officer',
    department: 'Executive',
    paymentCategory: 'A',
    approvalLimitUSDCents: 1_000_000_00, // $1M default delegated authority
    namedRoles: ['GCEO', 'Group Executive Committee'],
    departmentHeadOf: null,
    delegationValidThrough: ONE_YEAR_FROM_NOW,
    isActive: true,
  },
  {
    employeeId: 'emp-24', // Ifeanyi Agu (existing demo employee)
    fullName: 'Ifeanyi Agu',
    title: 'Group Chief Finance Officer',
    department: 'Finance',
    paymentCategory: 'A',
    approvalLimitUSDCents: 500_000_00, // $500K
    namedRoles: ['GCFO Finance', 'Group Executive Committee'],
    departmentHeadOf: 'Finance',
    delegationValidThrough: ONE_YEAR_FROM_NOW,
    isActive: true,
  },
  {
    employeeId: 'emp-13', // Babajide Ogunleye (existing demo employee)
    fullName: 'Babajide Ogunleye',
    title: 'GE Operations & Technology',
    department: 'Technology',
    paymentCategory: 'A',
    approvalLimitUSDCents: 500_000_00, // $500K
    namedRoles: ['GE Operations & Technology', 'Group Executive Committee'],
    departmentHeadOf: 'Technology',
    delegationValidThrough: ONE_YEAR_FROM_NOW,
    isActive: true,
  },
  {
    employeeId: 'emp-17', // Amara Kone (existing demo employee)
    fullName: 'Amara Kone',
    title: 'Group Executive — Human Resources',
    department: 'Human Resources',
    paymentCategory: 'A',
    approvalLimitUSDCents: 250_000_00, // $250K
    namedRoles: ['GE Human Resources', 'Group Executive Committee'],
    departmentHeadOf: 'Human Resources',
    delegationValidThrough: ONE_YEAR_FROM_NOW,
    isActive: true,
  },

  // ─── GROUP HEADS — Category A, mid-tier limits ────────────────────
  {
    employeeId: 'emp-yemi',
    fullName: 'Yemi Okonkwo',
    title: 'Group Head — Strategy',
    department: 'Strategy',
    paymentCategory: 'A',
    approvalLimitUSDCents: 100_000_00, // $100K
    namedRoles: ['Group Heads'],
    departmentHeadOf: 'Strategy',
    delegationValidThrough: ONE_YEAR_FROM_NOW,
    isActive: true,
  },
  {
    employeeId: 'emp-21',
    fullName: 'Chukwuma Obi',
    title: 'Chief Risk Officer',
    department: 'Risk & Compliance',
    paymentCategory: 'A',
    approvalLimitUSDCents: 100_000_00,
    namedRoles: ['Group Heads'],
    departmentHeadOf: 'Risk & Compliance',
    delegationValidThrough: ONE_YEAR_FROM_NOW,
    isActive: true,
  },
  {
    employeeId: 'emp-1',
    fullName: 'Oluwaseun Adeyemi',
    title: 'Head of Retail Banking',
    department: 'Retail Banking',
    paymentCategory: 'A',
    approvalLimitUSDCents: 100_000_00,
    namedRoles: ['Group Heads'],
    departmentHeadOf: 'Retail Banking',
    delegationValidThrough: ONE_YEAR_FROM_NOW,
    isActive: true,
  },
  {
    employeeId: 'emp-5',
    fullName: 'Amadou Diallo',
    title: 'Head of Corporate Banking',
    department: 'Corporate Banking',
    paymentCategory: 'A',
    approvalLimitUSDCents: 100_000_00,
    namedRoles: ['Group Heads'],
    departmentHeadOf: 'Corporate Banking',
    delegationValidThrough: ONE_YEAR_FROM_NOW,
    isActive: true,
  },
  {
    employeeId: 'emp-9',
    fullName: 'Kofi Mensah',
    title: 'Head of Operations',
    department: 'Operations',
    paymentCategory: 'A',
    approvalLimitUSDCents: 100_000_00,
    namedRoles: ['Group Heads'],
    departmentHeadOf: 'Operations',
    delegationValidThrough: ONE_YEAR_FROM_NOW,
    isActive: true,
  },

  // ─── DEPARTMENT MANAGERS — Category B ─────────────────────────────
  {
    employeeId: 'emp-22',
    fullName: 'Ousmane Ba',
    title: 'Compliance Manager',
    department: 'Risk & Compliance',
    paymentCategory: 'B',
    approvalLimitUSDCents: 25_000_00, // $25K
    namedRoles: ['Department Manager'],
    departmentHeadOf: null,
    delegationValidThrough: ONE_YEAR_FROM_NOW,
    isActive: true,
  },
  {
    employeeId: 'emp-18',
    fullName: 'Folake Adebayo',
    title: 'Talent Acquisition Manager',
    department: 'Human Resources',
    paymentCategory: 'B',
    approvalLimitUSDCents: 25_000_00,
    namedRoles: ['Department Manager'],
    departmentHeadOf: null,
    delegationValidThrough: ONE_YEAR_FROM_NOW,
    isActive: true,
  },
  {
    employeeId: 'emp-2',
    fullName: 'Ngozi Okafor',
    title: 'Branch Manager',
    department: 'Retail Banking',
    paymentCategory: 'B',
    approvalLimitUSDCents: 10_000_00, // $10K
    namedRoles: ['Department Manager'],
    departmentHeadOf: null,
    delegationValidThrough: ONE_YEAR_FROM_NOW,
    isActive: true,
  },

  // ─── HR BUSINESS PARTNERS — Category C ────────────────────────────
  {
    employeeId: 'emp-20',
    fullName: 'Ama Darko',
    title: 'HR Business Partner',
    department: 'Human Resources',
    paymentCategory: 'C',
    approvalLimitUSDCents: 5_000_00, // $5K
    namedRoles: ['HR Business Partner'],
    departmentHeadOf: null,
    delegationValidThrough: ONE_YEAR_FROM_NOW,
    isActive: true,
  },
]

/** Quick helper: lookup a single authority by employee ID. */
export function findSigningAuthority(employeeId: string): SigningAuthority | undefined {
  return ECOBANK_SIGNING_AUTHORITIES.find((sa) => sa.employeeId === employeeId)
}
