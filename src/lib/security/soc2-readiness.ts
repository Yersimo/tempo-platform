/**
 * SOC 2 Readiness Assessment Module
 *
 * Documents the SOC 2 control status across Trust Service Categories
 * and generates a readiness report for audit preparation.
 */

export interface SOC2Control {
  id: string
  category: 'CC' | 'A' | 'PI' | 'P' | 'C' // Common Criteria, Availability, Processing Integrity, Privacy, Confidentiality
  title: string
  description: string
  status: 'implemented' | 'partial' | 'planned' | 'not_applicable'
  evidence: string[]
  implementedAt?: string
  owner: string
}

export const SOC2_CONTROLS: SOC2Control[] = [
  // Security (Common Criteria)
  {
    id: 'CC1.1',
    category: 'CC',
    title: 'Control Environment',
    description: 'RBAC with 5 roles and 40+ permissions',
    status: 'implemented',
    evidence: ['src/lib/security/permissions.ts'],
    owner: 'Engineering',
  },
  {
    id: 'CC1.2',
    category: 'CC',
    title: 'Board Oversight',
    description: 'Platform admin dashboard for oversight',
    status: 'implemented',
    evidence: ['src/app/api/platform-admin/route.ts'],
    owner: 'Leadership',
  },
  {
    id: 'CC2.1',
    category: 'CC',
    title: 'Information Communication',
    description: 'In-app notifications, email alerts, chat',
    status: 'implemented',
    evidence: ['src/lib/services/notification-dispatcher.ts'],
    owner: 'Engineering',
  },
  {
    id: 'CC3.1',
    category: 'CC',
    title: 'Risk Assessment',
    description: 'Automated compliance scanning',
    status: 'implemented',
    evidence: ['src/lib/soc2-compliance.ts'],
    owner: 'Security',
  },
  {
    id: 'CC5.1',
    category: 'CC',
    title: 'Control Activities',
    description: 'Approval workflows, segregation of duties',
    status: 'implemented',
    evidence: ['src/lib/services/approval-engine.ts'],
    owner: 'Engineering',
  },
  {
    id: 'CC6.1',
    category: 'CC',
    title: 'Logical Access',
    description: 'JWT auth + PBKDF2 + MFA + rate limiting',
    status: 'implemented',
    evidence: ['src/lib/auth.ts', 'src/lib/totp.ts', 'src/middleware.ts'],
    owner: 'Security',
  },
  {
    id: 'CC6.2',
    category: 'CC',
    title: 'System Access',
    description: 'SCIM provisioning + SSO (OIDC/SAML)',
    status: 'implemented',
    evidence: ['src/lib/scim.ts', 'src/lib/services/sso-handler.ts', 'src/lib/services/saml-handler.ts'],
    owner: 'Security',
  },
  {
    id: 'CC6.3',
    category: 'CC',
    title: 'Access Removal',
    description: 'Automated deprovisioning on termination',
    status: 'implemented',
    evidence: ['src/lib/platform-events.ts'],
    owner: 'Security',
  },
  {
    id: 'CC6.6',
    category: 'CC',
    title: 'Encryption',
    description: 'AES-256-GCM at rest with per-tenant keys, TLS 1.3 in transit',
    status: 'implemented',
    evidence: ['src/lib/encryption.ts'],
    owner: 'Security',
  },
  {
    id: 'CC7.1',
    category: 'CC',
    title: 'Monitoring',
    description: 'Audit logging with hash chain integrity and HMAC-signed immutable archives',
    status: 'implemented',
    evidence: ['src/lib/services/audit-export.ts'],
    owner: 'Security',
  },
  {
    id: 'CC7.2',
    category: 'CC',
    title: 'Incident Response',
    description: 'Platform alerts + notification system',
    status: 'partial',
    evidence: ['src/lib/services/notification-dispatcher.ts'],
    owner: 'Security',
  },
  {
    id: 'CC8.1',
    category: 'CC',
    title: 'Change Management',
    description: 'Git-based with CI/CD',
    status: 'implemented',
    evidence: ['GitHub repository'],
    owner: 'Engineering',
  },
  // Availability
  {
    id: 'A1.1',
    category: 'A',
    title: 'Capacity Planning',
    description: 'Neon auto-scaling, Vercel serverless',
    status: 'implemented',
    evidence: ['Neon dashboard', 'Vercel dashboard'],
    owner: 'Infrastructure',
  },
  {
    id: 'A1.2',
    category: 'A',
    title: 'Recovery',
    description: 'Neon point-in-time recovery, backup config',
    status: 'implemented',
    evidence: ['src/lib/backup/config.ts'],
    owner: 'Infrastructure',
  },
  // Confidentiality
  {
    id: 'C1.1',
    category: 'C',
    title: 'Data Classification',
    description: '4-tier classification system',
    status: 'implemented',
    evidence: ['src/lib/soc2-compliance.ts'],
    owner: 'Security',
  },
  {
    id: 'C1.2',
    category: 'C',
    title: 'Data Disposal',
    description: 'Retention policies with automated enforcement',
    status: 'implemented',
    evidence: ['src/lib/services/audit-export.ts'],
    owner: 'Security',
  },
  // Privacy
  {
    id: 'P1.1',
    category: 'P',
    title: 'Privacy Notice',
    description: 'DPA auto-generation',
    status: 'implemented',
    evidence: ['src/lib/soc2-compliance.ts'],
    owner: 'Legal',
  },
  {
    id: 'P3.1',
    category: 'P',
    title: 'Data Retention',
    description: 'Configurable per entity type',
    status: 'implemented',
    evidence: ['src/lib/services/audit-export.ts'],
    owner: 'Security',
  },
  {
    id: 'P6.1',
    category: 'P',
    title: 'Data Quality',
    description: 'Input validation + schema enforcement',
    status: 'implemented',
    evidence: ['src/lib/api-validation.ts'],
    owner: 'Engineering',
  },
]

const CATEGORY_LABELS: Record<SOC2Control['category'], string> = {
  CC: 'Common Criteria (Security)',
  A: 'Availability',
  PI: 'Processing Integrity',
  P: 'Privacy',
  C: 'Confidentiality',
}

export function generateSOC2ReadinessReport(): {
  overallScore: number
  implemented: number
  partial: number
  planned: number
  notApplicable: number
  controls: SOC2Control[]
  byCategory: Record<string, { label: string; implemented: number; total: number; score: number }>
} {
  const implemented = SOC2_CONTROLS.filter(c => c.status === 'implemented').length
  const partial = SOC2_CONTROLS.filter(c => c.status === 'partial').length
  const planned = SOC2_CONTROLS.filter(c => c.status === 'planned').length
  const notApplicable = SOC2_CONTROLS.filter(c => c.status === 'not_applicable').length
  const total = SOC2_CONTROLS.length

  const overallScore = Math.round(((implemented + partial * 0.5) / total) * 100)

  // Per-category breakdown
  const categories = ['CC', 'A', 'PI', 'P', 'C'] as const
  const byCategory: Record<string, { label: string; implemented: number; total: number; score: number }> = {}

  for (const cat of categories) {
    const catControls = SOC2_CONTROLS.filter(c => c.category === cat)
    const catImpl = catControls.filter(c => c.status === 'implemented').length
    const catPartial = catControls.filter(c => c.status === 'partial').length
    const catTotal = catControls.length || 1

    byCategory[cat] = {
      label: CATEGORY_LABELS[cat],
      implemented: catImpl,
      total: catControls.length,
      score: Math.round(((catImpl + catPartial * 0.5) / catTotal) * 100),
    }
  }

  return {
    overallScore,
    implemented,
    partial,
    planned,
    notApplicable,
    controls: SOC2_CONTROLS,
    byCategory,
  }
}

export function getControlById(id: string): SOC2Control | undefined {
  return SOC2_CONTROLS.find(c => c.id === id)
}

export function getControlsByCategory(category: SOC2Control['category']): SOC2Control[] {
  return SOC2_CONTROLS.filter(c => c.category === category)
}

export function getControlsByStatus(status: SOC2Control['status']): SOC2Control[] {
  return SOC2_CONTROLS.filter(c => c.status === status)
}
