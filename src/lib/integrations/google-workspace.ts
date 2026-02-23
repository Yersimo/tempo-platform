// ============================================================
// Google Workspace Connector
// Uses Google Admin SDK Directory API via service account
// ============================================================

import type { IntegrationConnector, ConnectionResult, SyncResult, ConfigField } from './index'

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
const ADMIN_API_BASE = 'https://admin.googleapis.com/admin/directory/v1'

interface GoogleUser {
  id: string
  primaryEmail: string
  name: {
    givenName: string
    familyName: string
    fullName: string
  }
  isAdmin: boolean
  isDelegatedAdmin: boolean
  suspended: boolean
  orgUnitPath: string
  phones?: Array<{ value: string; type: string }>
  organizations?: Array<{ title?: string; department?: string; location?: string }>
  creationTime: string
}

interface GoogleOrgUnit {
  orgUnitId: string
  name: string
  orgUnitPath: string
  parentOrgUnitId?: string
  parentOrgUnitPath?: string
  description?: string
}

interface JWTHeader {
  alg: string
  typ: string
}

interface JWTClaim {
  iss: string
  scope: string
  aud: string
  exp: number
  iat: number
  sub?: string
}

function base64UrlEncode(data: string): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(data).toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '')
  }
  // Fallback for edge runtime
  return btoa(data)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

async function createServiceAccountJWT(
  serviceAccountEmail: string,
  privateKey: string,
  adminEmail: string
): Promise<string> {
  const now = Math.floor(Date.now() / 1000)

  const header: JWTHeader = { alg: 'RS256', typ: 'JWT' }
  const claim: JWTClaim = {
    iss: serviceAccountEmail,
    scope: [
      'https://www.googleapis.com/auth/admin.directory.user.readonly',
      'https://www.googleapis.com/auth/admin.directory.orgunit.readonly',
      'https://www.googleapis.com/auth/admin.directory.group.readonly',
    ].join(' '),
    aud: GOOGLE_TOKEN_URL,
    exp: now + 3600,
    iat: now,
    sub: adminEmail,
  }

  const headerB64 = base64UrlEncode(JSON.stringify(header))
  const claimB64 = base64UrlEncode(JSON.stringify(claim))
  const signatureInput = `${headerB64}.${claimB64}`

  // Import the private key and sign
  const pemKey = privateKey
    .replace(/-----BEGIN (RSA )?PRIVATE KEY-----/g, '')
    .replace(/-----END (RSA )?PRIVATE KEY-----/g, '')
    .replace(/\s/g, '')

  const keyBuffer = Uint8Array.from(atob(pemKey), c => c.charCodeAt(0))

  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    keyBuffer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  )

  const signatureBuffer = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    new TextEncoder().encode(signatureInput)
  )

  const signatureB64 = base64UrlEncode(
    String.fromCharCode(...new Uint8Array(signatureBuffer))
  )

  return `${signatureInput}.${signatureB64}`
}

async function getGoogleAccessToken(
  serviceAccountEmail: string,
  privateKey: string,
  adminEmail: string
): Promise<string> {
  const jwt = await createServiceAccountJWT(serviceAccountEmail, privateKey, adminEmail)

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }).toString(),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to get Google access token: ${response.status} - ${error}`)
  }

  const data = await response.json()
  return data.access_token
}

async function fetchGoogleUsers(
  accessToken: string,
  domain: string
): Promise<GoogleUser[]> {
  const users: GoogleUser[] = []
  let pageToken: string | undefined

  do {
    const params = new URLSearchParams({
      domain,
      maxResults: '200',
      projection: 'full',
    })
    if (pageToken) params.set('pageToken', pageToken)

    const response = await fetch(`${ADMIN_API_BASE}/users?${params}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Google Admin API error: ${response.status} - ${error}`)
    }

    const data = await response.json()
    users.push(...(data.users || []))
    pageToken = data.nextPageToken
  } while (pageToken)

  return users
}

async function fetchGoogleOrgUnits(
  accessToken: string,
  customerId: string
): Promise<GoogleOrgUnit[]> {
  const response = await fetch(
    `${ADMIN_API_BASE}/customer/${customerId}/orgunits?type=all`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }
  )

  if (!response.ok) {
    // Org units may not exist
    if (response.status === 404) return []
    const error = await response.text()
    throw new Error(`Failed to fetch org units: ${response.status} - ${error}`)
  }

  const data = await response.json()
  return data.organizationUnits || []
}

export function mapGoogleUserToEmployee(user: GoogleUser) {
  const org = user.organizations?.[0]
  const phone = user.phones?.find(p => p.type === 'mobile' || p.type === 'work')

  return {
    externalId: user.id,
    fullName: user.name.fullName,
    email: user.primaryEmail,
    jobTitle: org?.title || null,
    department: org?.department || null,
    country: org?.location || null,
    phone: phone?.value || null,
    isActive: !user.suspended,
    orgUnitPath: user.orgUnitPath,
    isAdmin: user.isAdmin,
  }
}

export const googleWorkspaceConnector: IntegrationConnector = {
  id: 'google-workspace',
  name: 'Google Workspace',
  description: 'Sync users, calendar events, and organizational structure from Google Workspace.',
  icon: 'Mail',
  category: 'productivity',
  capabilities: ['User sync', 'Calendar sync', 'SSO', 'Directory sync'],

  configSchema: [
    { key: 'service_account_email', label: 'Service Account Email', type: 'text', required: true, placeholder: 'service-account@project.iam.gserviceaccount.com' },
    { key: 'admin_email', label: 'Admin Email (for delegation)', type: 'text', required: true, placeholder: 'admin@company.com' },
    { key: 'private_key', label: 'Private Key (PEM)', type: 'password', required: true, placeholder: '-----BEGIN PRIVATE KEY-----...' },
    { key: 'domain', label: 'Domain', type: 'text', required: true, placeholder: 'company.com' },
    { key: 'customer_id', label: 'Customer ID (for org units)', type: 'text', required: false, placeholder: 'Cxxxxxxx or my_customer' },
  ] as ConfigField[],

  async connect(config: Record<string, string>): Promise<ConnectionResult> {
    try {
      const { service_account_email, admin_email, private_key, domain } = config
      if (!service_account_email || !admin_email || !private_key || !domain) {
        return { success: false, error: 'Missing required fields: Service Account Email, Admin Email, Private Key, and Domain are required.' }
      }

      const accessToken = await getGoogleAccessToken(service_account_email, private_key, admin_email)

      // Verify by fetching first page of users
      const params = new URLSearchParams({ domain, maxResults: '1' })
      const response = await fetch(`${ADMIN_API_BASE}/users?${params}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })

      if (!response.ok) {
        const error = await response.text()
        return { success: false, error: `Google API error: ${error}` }
      }

      const data = await response.json()
      const totalUsers = data.users?.length || 0

      return {
        success: true,
        metadata: {
          domain,
          usersSample: totalUsers,
          connectedAt: new Date().toISOString(),
        },
      }
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to connect to Google Workspace',
      }
    }
  },

  async disconnect(): Promise<void> {
    // Service account access is revoked via Google Cloud Console
    // Local cleanup handled by caller
  },

  async sync(_integrationId: string, direction: 'inbound' | 'outbound'): Promise<SyncResult> {
    const startTime = Date.now()
    const errors: string[] = []

    if (direction === 'outbound') {
      return {
        success: false,
        recordsProcessed: 0,
        recordsFailed: 0,
        errors: ['Outbound sync to Google Workspace is not supported in this version.'],
        duration: Date.now() - startTime,
      }
    }

    // In production, the API route handler loads config and calls syncGoogleWorkspace()
    return {
      success: true,
      recordsProcessed: 0,
      recordsFailed: 0,
      errors,
      duration: Date.now() - startTime,
    }
  },

  async testConnection(config: Record<string, string>): Promise<boolean> {
    try {
      const { service_account_email, admin_email, private_key, domain } = config
      if (!service_account_email || !admin_email || !private_key || !domain) return false

      const accessToken = await getGoogleAccessToken(service_account_email, private_key, admin_email)
      const params = new URLSearchParams({ domain, maxResults: '1' })
      const response = await fetch(`${ADMIN_API_BASE}/users?${params}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })

      return response.ok
    } catch {
      return false
    }
  },
}

// Full sync helper callable with credentials
export async function syncGoogleWorkspace(
  config: Record<string, string>
): Promise<{ users: ReturnType<typeof mapGoogleUserToEmployee>[]; orgUnits: GoogleOrgUnit[] }> {
  const { service_account_email, admin_email, private_key, domain, customer_id } = config
  const accessToken = await getGoogleAccessToken(service_account_email, private_key, admin_email)

  const [rawUsers, orgUnits] = await Promise.all([
    fetchGoogleUsers(accessToken, domain),
    customer_id ? fetchGoogleOrgUnits(accessToken, customer_id) : Promise.resolve([]),
  ])

  const users = rawUsers.map(mapGoogleUserToEmployee)
  return { users, orgUnits }
}
