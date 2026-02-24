// SCIM 2.0 Provisioning Engine
// Implements RFC 7643 (Core Schema) and RFC 7644 (Protocol)
// Enables automated user provisioning/deprovisioning from identity providers

import { db, schema } from '@/lib/db'
import { eq, and, ilike } from 'drizzle-orm'

// ---------------------------------------------------------------------------
// SCIM Types (RFC 7643)
// ---------------------------------------------------------------------------

export interface SCIMUser {
  schemas: string[]
  id?: string
  externalId?: string
  userName: string
  name?: {
    formatted?: string
    familyName?: string
    givenName?: string
  }
  displayName?: string
  emails?: Array<{ value: string; type?: string; primary?: boolean }>
  phoneNumbers?: Array<{ value: string; type?: string }>
  active?: boolean
  title?: string
  department?: string
  roles?: Array<{ value: string; display?: string; type?: string }>
  meta?: {
    resourceType: string
    created: string
    lastModified: string
    location: string
  }
}

export interface SCIMGroup {
  schemas: string[]
  id?: string
  externalId?: string
  displayName: string
  members?: Array<{ value: string; display?: string; $ref?: string }>
  meta?: {
    resourceType: string
    created: string
    lastModified: string
    location: string
  }
}

export interface SCIMListResponse<T> {
  schemas: string[]
  totalResults: number
  startIndex: number
  itemsPerPage: number
  Resources: T[]
}

export interface SCIMError {
  schemas: string[]
  detail: string
  status: string
  scimType?: string
}

export interface SCIMPatchOp {
  schemas: string[]
  Operations: Array<{
    op: 'add' | 'replace' | 'remove'
    path?: string
    value?: unknown
  }>
}

const SCIM_SCHEMA_USER = 'urn:ietf:params:scim:schemas:core:2.0:User'
const SCIM_SCHEMA_GROUP = 'urn:ietf:params:scim:schemas:core:2.0:Group'
const SCIM_SCHEMA_LIST = 'urn:ietf:params:scim:api:messages:2.0:ListResponse'
const SCIM_SCHEMA_PATCH = 'urn:ietf:params:scim:api:messages:2.0:PatchOp'
const SCIM_SCHEMA_ERROR = 'urn:ietf:params:scim:api:messages:2.0:Error'

// ---------------------------------------------------------------------------
// User Operations
// ---------------------------------------------------------------------------

export async function scimListUsers(
  orgId: string,
  params: { startIndex?: number; count?: number; filter?: string },
  baseUrl: string
): Promise<SCIMListResponse<SCIMUser>> {
  const startIndex = Math.max(1, params.startIndex || 1)
  const count = Math.min(100, Math.max(1, params.count || 100))

  let employees = await db.select().from(schema.employees)
    .where(eq(schema.employees.orgId, orgId))

  // Basic SCIM filter support (userName eq "value")
  if (params.filter) {
    const match = params.filter.match(/(\w+)\s+eq\s+"([^"]+)"/)
    if (match) {
      const [, attr, value] = match
      if (attr === 'userName' || attr === 'emails.value') {
        employees = employees.filter(e => e.email.toLowerCase() === value.toLowerCase())
      } else if (attr === 'externalId') {
        employees = employees.filter(e => e.id === value)
      } else if (attr === 'displayName') {
        employees = employees.filter(e => e.fullName.toLowerCase() === value.toLowerCase())
      }
    }
  }

  const total = employees.length
  const paged = employees.slice(startIndex - 1, startIndex - 1 + count)

  return {
    schemas: [SCIM_SCHEMA_LIST],
    totalResults: total,
    startIndex,
    itemsPerPage: paged.length,
    Resources: paged.map(e => employeeToSCIM(e, baseUrl)),
  }
}

export async function scimGetUser(orgId: string, userId: string, baseUrl: string): Promise<SCIMUser | null> {
  const [employee] = await db.select().from(schema.employees)
    .where(and(eq(schema.employees.id, userId), eq(schema.employees.orgId, orgId)))
  if (!employee) return null
  return employeeToSCIM(employee, baseUrl)
}

export async function scimCreateUser(orgId: string, user: SCIMUser, baseUrl: string): Promise<SCIMUser> {
  const email = user.emails?.find(e => e.primary)?.value || user.userName
  const fullName = user.name?.formatted || user.displayName || `${user.name?.givenName || ''} ${user.name?.familyName || ''}`.trim()

  // Check for existing user
  const existing = await db.select().from(schema.employees)
    .where(and(eq(schema.employees.email, email), eq(schema.employees.orgId, orgId)))
  if (existing.length > 0) {
    throw { status: 409, detail: 'User already exists', scimType: 'uniqueness' }
  }

  // Find department if specified
  let departmentId: string | null = null
  if (user.department) {
    const [dept] = await db.select().from(schema.departments)
      .where(and(eq(schema.departments.name, user.department), eq(schema.departments.orgId, orgId)))
    if (dept) departmentId = dept.id
  }

  const role = user.roles?.[0]?.value as any || 'employee'

  const [created] = await db.insert(schema.employees).values({
    orgId,
    fullName,
    email,
    phone: user.phoneNumbers?.[0]?.value || null,
    jobTitle: user.title || null,
    departmentId,
    role: ['owner', 'admin', 'hrbp', 'manager', 'employee'].includes(role) ? role : 'employee',
    isActive: user.active !== false,
  }).returning()

  // Audit
  await db.insert(schema.auditLog).values({
    orgId,
    userId: created.id,
    action: 'create',
    entityType: 'scim_provision',
    entityId: created.id,
    details: JSON.stringify({ source: 'scim', email }),
  })

  return employeeToSCIM(created, baseUrl)
}

export async function scimUpdateUser(orgId: string, userId: string, user: Partial<SCIMUser>, baseUrl: string): Promise<SCIMUser | null> {
  const [existing] = await db.select().from(schema.employees)
    .where(and(eq(schema.employees.id, userId), eq(schema.employees.orgId, orgId)))
  if (!existing) return null

  const updates: Record<string, any> = { updatedAt: new Date() }

  if (user.name?.formatted || user.displayName) {
    updates.fullName = user.name?.formatted || user.displayName
  } else if (user.name?.givenName || user.name?.familyName) {
    updates.fullName = `${user.name.givenName || ''} ${user.name.familyName || ''}`.trim()
  }
  if (user.emails?.length) {
    updates.email = user.emails.find(e => e.primary)?.value || user.emails[0].value
  }
  if (user.phoneNumbers?.length) {
    updates.phone = user.phoneNumbers[0].value
  }
  if (user.title !== undefined) updates.jobTitle = user.title
  if (user.active !== undefined) updates.isActive = user.active

  const [updated] = await db.update(schema.employees)
    .set(updates)
    .where(and(eq(schema.employees.id, userId), eq(schema.employees.orgId, orgId)))
    .returning()

  await db.insert(schema.auditLog).values({
    orgId,
    userId,
    action: 'update',
    entityType: 'scim_provision',
    entityId: userId,
    details: JSON.stringify({ source: 'scim', updates: Object.keys(updates) }),
  })

  return employeeToSCIM(updated, baseUrl)
}

export async function scimPatchUser(orgId: string, userId: string, patch: SCIMPatchOp, baseUrl: string): Promise<SCIMUser | null> {
  const updates: Partial<SCIMUser> = {}

  for (const op of patch.Operations) {
    if (op.op === 'replace' || op.op === 'add') {
      if (op.path === 'active') updates.active = op.value as boolean
      else if (op.path === 'displayName') updates.displayName = op.value as string
      else if (op.path === 'title') updates.title = op.value as string
      else if (op.path === 'name.givenName') {
        updates.name = { ...updates.name, givenName: op.value as string }
      } else if (op.path === 'name.familyName') {
        updates.name = { ...updates.name, familyName: op.value as string }
      } else if (op.path === 'emails') {
        updates.emails = op.value as SCIMUser['emails']
      } else if (!op.path && typeof op.value === 'object') {
        Object.assign(updates, op.value)
      }
    }
  }

  return scimUpdateUser(orgId, userId, updates, baseUrl)
}

export async function scimDeleteUser(orgId: string, userId: string): Promise<boolean> {
  // Soft delete (deactivate) for SCIM - preserves referential integrity
  const [result] = await db.update(schema.employees)
    .set({ isActive: false, updatedAt: new Date() })
    .where(and(eq(schema.employees.id, userId), eq(schema.employees.orgId, orgId)))
    .returning()

  if (result) {
    await db.insert(schema.auditLog).values({
      orgId,
      userId,
      action: 'delete',
      entityType: 'scim_deprovision',
      entityId: userId,
      details: JSON.stringify({ source: 'scim', action: 'deactivate' }),
    })
  }

  return !!result
}

// ---------------------------------------------------------------------------
// Group Operations
// ---------------------------------------------------------------------------

export async function scimListGroups(orgId: string, baseUrl: string): Promise<SCIMListResponse<SCIMGroup>> {
  const departments = await db.select().from(schema.departments)
    .where(eq(schema.departments.orgId, orgId))

  const employees = await db.select({ id: schema.employees.id, departmentId: schema.employees.departmentId, fullName: schema.employees.fullName })
    .from(schema.employees)
    .where(eq(schema.employees.orgId, orgId))

  return {
    schemas: [SCIM_SCHEMA_LIST],
    totalResults: departments.length,
    startIndex: 1,
    itemsPerPage: departments.length,
    Resources: departments.map(d => ({
      schemas: [SCIM_SCHEMA_GROUP],
      id: d.id,
      displayName: d.name,
      members: employees.filter(e => e.departmentId === d.id).map(e => ({
        value: e.id,
        display: e.fullName,
        $ref: `${baseUrl}/scim/v2/Users/${e.id}`,
      })),
      meta: {
        resourceType: 'Group',
        created: d.createdAt.toISOString(),
        lastModified: d.createdAt.toISOString(),
        location: `${baseUrl}/scim/v2/Groups/${d.id}`,
      },
    })),
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function employeeToSCIM(e: typeof schema.employees.$inferSelect, baseUrl: string): SCIMUser {
  const nameParts = e.fullName.split(' ')
  return {
    schemas: [SCIM_SCHEMA_USER],
    id: e.id,
    externalId: e.id,
    userName: e.email,
    name: {
      formatted: e.fullName,
      givenName: nameParts[0] || '',
      familyName: nameParts.slice(1).join(' ') || '',
    },
    displayName: e.fullName,
    emails: [{ value: e.email, type: 'work', primary: true }],
    phoneNumbers: e.phone ? [{ value: e.phone, type: 'work' }] : [],
    active: e.isActive,
    title: e.jobTitle || undefined,
    roles: [{ value: e.role, display: e.role, type: 'primary' }],
    meta: {
      resourceType: 'User',
      created: e.createdAt.toISOString(),
      lastModified: e.updatedAt.toISOString(),
      location: `${baseUrl}/scim/v2/Users/${e.id}`,
    },
  }
}

export function scimError(status: number, detail: string, scimType?: string): SCIMError {
  return {
    schemas: [SCIM_SCHEMA_ERROR],
    detail,
    status: String(status),
    scimType,
  }
}

// ---------------------------------------------------------------------------
// SSO Configuration helpers
// ---------------------------------------------------------------------------

export interface SSOConfig {
  provider: 'saml' | 'oidc'
  issuer: string
  ssoUrl: string
  certificate?: string
  clientId?: string
  clientSecret?: string
  callbackUrl: string
  enabled: boolean
}

export async function getSSOConfig(orgId: string): Promise<SSOConfig | null> {
  try {
    const [ssoProvider] = await db.select().from(schema.ssoProviders)
      .where(eq(schema.ssoProviders.orgId, orgId))
    if (!ssoProvider) return null

    return {
      provider: ssoProvider.provider as 'saml' | 'oidc',
      issuer: ssoProvider.entityId || '',
      ssoUrl: ssoProvider.ssoUrl || '',
      certificate: ssoProvider.certificate || undefined,
      clientId: ssoProvider.clientId || undefined,
      clientSecret: undefined, // Never expose secret
      callbackUrl: ssoProvider.metadataUrl || '',
      enabled: ssoProvider.isActive,
    }
  } catch {
    return null
  }
}
