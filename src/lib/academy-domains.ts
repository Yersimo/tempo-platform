/**
 * Academy Custom Domains — White-label domain management for external academies.
 *
 * Handles domain registration, DNS verification (CNAME/TXT), status tracking,
 * and hostname-based academy resolution for middleware routing.
 *
 * All mutating functions require orgId for RLS except getDomainByHostname,
 * which is used by middleware to resolve incoming requests.
 */

import { db, schema } from '@/lib/db'
import { eq, and, sql } from 'drizzle-orm'
import * as crypto from 'crypto'
import * as dns from 'dns'
import { promisify } from 'util'

const resolveCname = promisify(dns.resolveCname)
const resolveTxt = promisify(dns.resolveTxt)

// ============================================================
// CONSTANTS
// ============================================================

const TEMPO_ACADEMY_HOST = 'academy.tempo.app'
const TEMPO_DOMAINS = ['tempo.app', 'tempo.dev', 'tempo.io', 'tempohq.com']
const DOMAIN_REGEX = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i
const MAX_DOMAINS_PER_ACADEMY = 5

// ============================================================
// TYPES
// ============================================================

export interface DomainRecord {
  id: string
  orgId: string
  academyId: string
  domain: string
  status: 'pending' | 'verifying' | 'active' | 'failed' | 'expired'
  sslStatus: string
  verificationToken: string | null
  verificationMethod: string
  verifiedAt: Date | null
  sslIssuedAt: Date | null
  sslExpiresAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface VerificationInstructions {
  domain: string
  method: 'cname' | 'txt'
  verificationToken: string
  instructions: {
    recordType: string
    host: string
    value: string
    description: string
  }
}

// ============================================================
// VALIDATION
// ============================================================

function validateDomainFormat(domain: string): string | null {
  if (!domain || typeof domain !== 'string') {
    return 'Domain is required'
  }

  const cleaned = domain.toLowerCase().trim()

  if (cleaned.length > 253) {
    return 'Domain name is too long (max 253 characters)'
  }

  if (!DOMAIN_REGEX.test(cleaned)) {
    return 'Invalid domain format. Must be a valid hostname (e.g., academy.example.com)'
  }

  // Block Tempo-owned domains
  for (const tempoDomain of TEMPO_DOMAINS) {
    if (cleaned === tempoDomain || cleaned.endsWith(`.${tempoDomain}`)) {
      return `Cannot use a Tempo platform domain (${tempoDomain})`
    }
  }

  // Block bare TLDs and single-label domains
  const parts = cleaned.split('.')
  if (parts.length < 2) {
    return 'Domain must have at least two labels (e.g., academy.example.com)'
  }

  return null
}

function generateVerificationToken(): string {
  return `tempo-verify-${crypto.randomBytes(24).toString('hex')}`
}

// ============================================================
// CORE FUNCTIONS
// ============================================================

/**
 * Register a custom domain for an academy.
 * Validates format, checks uniqueness, generates verification token.
 */
export async function addCustomDomain(
  orgId: string,
  academyId: string,
  domain: string,
  method: 'cname' | 'txt' = 'cname',
): Promise<DomainRecord> {
  const cleaned = domain.toLowerCase().trim()

  // Validate format
  const formatError = validateDomainFormat(cleaned)
  if (formatError) {
    throw new Error(formatError)
  }

  // Verify the academy belongs to this org
  const [academy] = await db
    .select({ id: schema.academies.id })
    .from(schema.academies)
    .where(and(eq(schema.academies.id, academyId), eq(schema.academies.orgId, orgId)))
    .limit(1)

  if (!academy) {
    throw new Error('Academy not found')
  }

  // Check domain is not already claimed by any org
  const [existing] = await db
    .select({ id: schema.academyCustomDomains.id, orgId: schema.academyCustomDomains.orgId })
    .from(schema.academyCustomDomains)
    .where(eq(schema.academyCustomDomains.domain, cleaned))
    .limit(1)

  if (existing) {
    throw new Error('This domain is already registered')
  }

  // Check per-academy domain limit
  const [countResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(schema.academyCustomDomains)
    .where(
      and(
        eq(schema.academyCustomDomains.orgId, orgId),
        eq(schema.academyCustomDomains.academyId, academyId),
      ),
    )

  if ((countResult?.count ?? 0) >= MAX_DOMAINS_PER_ACADEMY) {
    throw new Error(`Maximum of ${MAX_DOMAINS_PER_ACADEMY} custom domains per academy`)
  }

  const token = generateVerificationToken()

  const [record] = await db
    .insert(schema.academyCustomDomains)
    .values({
      orgId,
      academyId,
      domain: cleaned,
      status: 'pending',
      sslStatus: 'pending',
      verificationToken: token,
      verificationMethod: method,
    })
    .returning()

  return record as DomainRecord
}

/**
 * Verify a domain by checking DNS records match the verification token.
 * For CNAME: checks that domain CNAMEs to academy.tempo.app
 * For TXT: checks that a TXT record contains the verification token
 */
export async function verifyDomain(orgId: string, domainId: string): Promise<DomainRecord> {
  const [domain] = await db
    .select()
    .from(schema.academyCustomDomains)
    .where(and(eq(schema.academyCustomDomains.id, domainId), eq(schema.academyCustomDomains.orgId, orgId)))
    .limit(1)

  if (!domain) {
    throw new Error('Domain not found')
  }

  if (domain.status === 'active') {
    return domain as DomainRecord
  }

  // Update to verifying state
  await db
    .update(schema.academyCustomDomains)
    .set({ status: 'verifying', updatedAt: new Date() })
    .where(eq(schema.academyCustomDomains.id, domainId))

  let verified = false

  try {
    if (domain.verificationMethod === 'cname') {
      verified = await verifyCnameRecord(domain.domain)
    } else {
      verified = await verifyTxtRecord(domain.domain, domain.verificationToken!)
    }
  } catch {
    // DNS resolution failed — domain not yet configured
    verified = false
  }

  const now = new Date()
  const newStatus = verified ? 'active' : 'failed'
  const sslStatus = verified ? 'provisioning' : 'pending'

  const [updated] = await db
    .update(schema.academyCustomDomains)
    .set({
      status: newStatus,
      sslStatus,
      verifiedAt: verified ? now : null,
      updatedAt: now,
    })
    .where(eq(schema.academyCustomDomains.id, domainId))
    .returning()

  return updated as DomainRecord
}

/**
 * Remove a custom domain. Only the owning org can remove.
 */
export async function removeDomain(orgId: string, domainId: string): Promise<DomainRecord> {
  const [deleted] = await db
    .delete(schema.academyCustomDomains)
    .where(and(eq(schema.academyCustomDomains.id, domainId), eq(schema.academyCustomDomains.orgId, orgId)))
    .returning()

  if (!deleted) {
    throw new Error('Domain not found')
  }

  return deleted as DomainRecord
}

/**
 * List all custom domains for an academy.
 */
export async function getDomains(orgId: string, academyId: string): Promise<DomainRecord[]> {
  const rows = await db
    .select()
    .from(schema.academyCustomDomains)
    .where(
      and(
        eq(schema.academyCustomDomains.orgId, orgId),
        eq(schema.academyCustomDomains.academyId, academyId),
      ),
    )
    .orderBy(schema.academyCustomDomains.createdAt)

  return rows as DomainRecord[]
}

/**
 * Look up an academy by custom domain hostname.
 * Used by middleware for routing — no orgId filter required.
 * Only returns active (verified) domains.
 */
export async function getDomainByHostname(
  hostname: string,
): Promise<{ domain: DomainRecord; academy: { id: string; orgId: string; slug: string; name: string } } | null> {
  const cleaned = hostname.toLowerCase().trim()

  const rows = await db
    .select({
      domain: schema.academyCustomDomains,
      academy: {
        id: schema.academies.id,
        orgId: schema.academies.orgId,
        slug: schema.academies.slug,
        name: schema.academies.name,
      },
    })
    .from(schema.academyCustomDomains)
    .innerJoin(schema.academies, eq(schema.academyCustomDomains.academyId, schema.academies.id))
    .where(
      and(
        eq(schema.academyCustomDomains.domain, cleaned),
        eq(schema.academyCustomDomains.status, 'active'),
      ),
    )
    .limit(1)

  if (rows.length === 0) return null

  return {
    domain: rows[0].domain as DomainRecord,
    academy: rows[0].academy,
  }
}

/**
 * Get DNS verification instructions for a domain.
 */
export async function getVerificationInstructions(
  orgId: string,
  domainId: string,
): Promise<VerificationInstructions> {
  const [domain] = await db
    .select()
    .from(schema.academyCustomDomains)
    .where(and(eq(schema.academyCustomDomains.id, domainId), eq(schema.academyCustomDomains.orgId, orgId)))
    .limit(1)

  if (!domain) {
    throw new Error('Domain not found')
  }

  if (!domain.verificationToken) {
    throw new Error('Domain has no verification token')
  }

  const method = domain.verificationMethod as 'cname' | 'txt'

  if (method === 'cname') {
    return {
      domain: domain.domain,
      method: 'cname',
      verificationToken: domain.verificationToken,
      instructions: {
        recordType: 'CNAME',
        host: domain.domain,
        value: TEMPO_ACADEMY_HOST,
        description: `Create a CNAME record pointing ${domain.domain} to ${TEMPO_ACADEMY_HOST}. This routes traffic to the Tempo platform and automatically verifies ownership.`,
      },
    }
  }

  return {
    domain: domain.domain,
    method: 'txt',
    verificationToken: domain.verificationToken,
    instructions: {
      recordType: 'TXT',
      host: `_tempo-verify.${domain.domain}`,
      value: domain.verificationToken,
      description: `Create a TXT record at _tempo-verify.${domain.domain} with the value shown above. After verification, create a CNAME record pointing ${domain.domain} to ${TEMPO_ACADEMY_HOST} for routing.`,
    },
  }
}

/**
 * Re-check DNS for a domain and update its status.
 * Can transition failed -> active or active -> expired.
 */
export async function checkDomainStatus(orgId: string, domainId: string): Promise<DomainRecord> {
  const [domain] = await db
    .select()
    .from(schema.academyCustomDomains)
    .where(and(eq(schema.academyCustomDomains.id, domainId), eq(schema.academyCustomDomains.orgId, orgId)))
    .limit(1)

  if (!domain) {
    throw new Error('Domain not found')
  }

  let cnameValid = false
  let txtValid = false

  try {
    cnameValid = await verifyCnameRecord(domain.domain)
  } catch {
    cnameValid = false
  }

  if (!cnameValid && domain.verificationToken) {
    try {
      txtValid = await verifyTxtRecord(domain.domain, domain.verificationToken)
    } catch {
      txtValid = false
    }
  }

  const verified = cnameValid || txtValid
  const now = new Date()

  let newStatus: 'active' | 'failed' | 'expired' | 'pending'
  if (verified) {
    newStatus = 'active'
  } else if (domain.status === 'active') {
    // Was active but DNS no longer resolves — mark expired
    newStatus = 'expired'
  } else {
    newStatus = 'failed'
  }

  const [updated] = await db
    .update(schema.academyCustomDomains)
    .set({
      status: newStatus,
      verifiedAt: verified && !domain.verifiedAt ? now : domain.verifiedAt,
      updatedAt: now,
    })
    .where(eq(schema.academyCustomDomains.id, domainId))
    .returning()

  return updated as DomainRecord
}

// ============================================================
// DNS HELPERS
// ============================================================

/**
 * Check if domain has a CNAME record pointing to academy.tempo.app
 */
async function verifyCnameRecord(domain: string): Promise<boolean> {
  try {
    const records = await resolveCname(domain)
    return records.some(
      (r) => r.toLowerCase() === TEMPO_ACADEMY_HOST || r.toLowerCase() === `${TEMPO_ACADEMY_HOST}.`,
    )
  } catch {
    return false
  }
}

/**
 * Check if domain has a TXT record at _tempo-verify.{domain} containing the token
 */
async function verifyTxtRecord(domain: string, token: string): Promise<boolean> {
  try {
    const records = await resolveTxt(`_tempo-verify.${domain}`)
    // TXT records come as arrays of strings (chunks), join them
    return records.some((chunks) => chunks.join('').includes(token))
  } catch {
    return false
  }
}
