import { db, schema } from '@/lib/db'
import { eq, and } from 'drizzle-orm'
import { createSession, setSessionCookie } from '@/lib/auth'

// OIDC endpoints for each provider
const PROVIDER_CONFIG = {
  google: {
    authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenEndpoint: 'https://oauth2.googleapis.com/token',
    userinfoEndpoint: 'https://openidconnect.googleapis.com/v1/userinfo',
    scopes: ['openid', 'email', 'profile'],
  },
  azure: {
    // {tenantId} will be replaced with the actual tenant ID from config
    authorizationEndpoint:
      'https://login.microsoftonline.com/{tenantId}/oauth2/v2.0/authorize',
    tokenEndpoint:
      'https://login.microsoftonline.com/{tenantId}/oauth2/v2.0/token',
    userinfoEndpoint: 'https://graph.microsoft.com/oidc/userinfo',
    scopes: ['openid', 'email', 'profile', 'User.Read'],
  },
}

export interface SSOUserInfo {
  email: string
  name: string
  givenName?: string
  familyName?: string
  picture?: string
  sub: string // provider's unique user ID
}

export class SSOError extends Error {
  constructor(
    message: string,
    public code:
      | 'PROVIDER_NOT_FOUND'
      | 'PROVIDER_DISABLED'
      | 'INVALID_STATE'
      | 'TOKEN_EXCHANGE_FAILED'
      | 'USERINFO_FAILED'
      | 'DOMAIN_MISMATCH'
      | 'PROVISIONING_FAILED'
      | 'SESSION_EXPIRED',
  ) {
    super(message)
    this.name = 'SSOError'
  }
}

// Step 1: Initiate SSO flow - generate authorization URL
export async function initiateSSOFlow(
  provider: 'google' | 'azure',
  orgSlugOrId: string,
  redirectUri: string,
  returnUrl?: string,
): Promise<{ authorizationUrl: string; state: string }> {
  // Find the SSO provider config for this org
  // Try by org ID first, then by slug
  let org = await db
    .select()
    .from(schema.organizations)
    .where(eq(schema.organizations.id, orgSlugOrId))
    .then((r) => r[0])
  if (!org) {
    org = await db
      .select()
      .from(schema.organizations)
      .where(eq(schema.organizations.slug, orgSlugOrId))
      .then((r) => r[0])
  }
  if (!org)
    throw new SSOError('Organization not found', 'PROVIDER_NOT_FOUND')

  const [ssoProvider] = await db
    .select()
    .from(schema.ssoProviders)
    .where(
      and(
        eq(schema.ssoProviders.orgId, org.id),
        eq(schema.ssoProviders.provider, provider),
        eq(schema.ssoProviders.isActive, true),
      ),
    )

  if (!ssoProvider)
    throw new SSOError(
      `SSO provider '${provider}' not configured for this organization`,
      'PROVIDER_NOT_FOUND',
    )
  if (!ssoProvider.clientId)
    throw new SSOError('SSO client ID not configured', 'PROVIDER_NOT_FOUND')

  // Generate a random state parameter for CSRF protection
  const state = crypto.randomUUID()

  // Store the SSO session
  await db.insert(schema.ssoSessions).values({
    orgId: org.id,
    providerId: ssoProvider.id,
    state,
    redirectUrl: returnUrl || '/dashboard',
    expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minute expiry
  })

  // Build the authorization URL
  const config = PROVIDER_CONFIG[provider]
  const providerConfig = ssoProvider.config as Record<string, string> | null
  const tenantId = providerConfig?.tenantId || 'common'

  const authEndpoint = config.authorizationEndpoint.replace(
    '{tenantId}',
    tenantId,
  )

  const params = new URLSearchParams({
    client_id: ssoProvider.clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: config.scopes.join(' '),
    state,
    access_type: 'offline',
    prompt: 'select_account',
  })

  // For Azure, add nonce
  if (provider === 'azure') {
    params.set('nonce', crypto.randomUUID())
  }

  return {
    authorizationUrl: `${authEndpoint}?${params.toString()}`,
    state,
  }
}

// Step 2: Handle the OAuth callback - exchange code for tokens and get user info
export async function handleSSOCallback(
  provider: 'google' | 'azure',
  code: string,
  state: string,
  redirectUri: string,
): Promise<{
  token: string
  cookie: ReturnType<typeof setSessionCookie>
  user: {
    id: string
    email: string
    fullName: string
    role: string
    orgId: string
  }
  isNewUser: boolean
  returnUrl: string
}> {
  // 1. Validate the state parameter
  const [ssoSession] = await db
    .select()
    .from(schema.ssoSessions)
    .where(eq(schema.ssoSessions.state, state))

  if (!ssoSession)
    throw new SSOError('Invalid SSO state parameter', 'INVALID_STATE')
  if (ssoSession.completedAt)
    throw new SSOError('SSO session already used', 'INVALID_STATE')
  if (new Date() > ssoSession.expiresAt)
    throw new SSOError('SSO session expired', 'SESSION_EXPIRED')

  // 2. Get the SSO provider config
  const [ssoProvider] = await db
    .select()
    .from(schema.ssoProviders)
    .where(eq(schema.ssoProviders.id, ssoSession.providerId))

  if (!ssoProvider)
    throw new SSOError('SSO provider not found', 'PROVIDER_NOT_FOUND')
  if (!ssoProvider.clientId || !ssoProvider.clientSecret)
    throw new SSOError('SSO credentials not configured', 'PROVIDER_NOT_FOUND')

  // 3. Exchange authorization code for access token
  const config = PROVIDER_CONFIG[provider]
  const providerConfig = ssoProvider.config as Record<string, string> | null
  const tenantId = providerConfig?.tenantId || 'common'
  const tokenEndpoint = config.tokenEndpoint.replace('{tenantId}', tenantId)

  const tokenResponse = await fetch(tokenEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: ssoProvider.clientId,
      client_secret: ssoProvider.clientSecret,
      code,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }).toString(),
  })

  if (!tokenResponse.ok) {
    const error = await tokenResponse.text()
    throw new SSOError(
      `Token exchange failed: ${error}`,
      'TOKEN_EXCHANGE_FAILED',
    )
  }

  const tokenData = await tokenResponse.json()
  const accessToken = tokenData.access_token

  // 4. Get user info from the provider
  const userinfoEndpoint = config.userinfoEndpoint
  const userinfoResponse = await fetch(userinfoEndpoint, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!userinfoResponse.ok) {
    throw new SSOError(
      'Failed to fetch user info from provider',
      'USERINFO_FAILED',
    )
  }

  const rawUserInfo = await userinfoResponse.json()
  const userInfo: SSOUserInfo = {
    email: rawUserInfo.email,
    name:
      rawUserInfo.name ||
      `${rawUserInfo.given_name || ''} ${rawUserInfo.family_name || ''}`.trim(),
    givenName: rawUserInfo.given_name,
    familyName: rawUserInfo.family_name,
    picture: rawUserInfo.picture,
    sub: rawUserInfo.sub,
  }

  if (!userInfo.email)
    throw new SSOError(
      'No email returned from SSO provider',
      'USERINFO_FAILED',
    )

  // 5. Verify the email domain matches the organization
  const [org] = await db
    .select()
    .from(schema.organizations)
    .where(eq(schema.organizations.id, ssoSession.orgId))
  if (!org)
    throw new SSOError('Organization not found', 'PROVIDER_NOT_FOUND')

  // Optional: domain check (from provider config)
  const allowedDomains =
    (providerConfig?.allowedDomains as string)
      ?.split(',')
      .map((d) => d.trim()) || []
  if (allowedDomains.length > 0) {
    const emailDomain = userInfo.email.split('@')[1]
    if (!allowedDomains.includes(emailDomain)) {
      throw new SSOError(
        `Email domain '${emailDomain}' not allowed for this organization`,
        'DOMAIN_MISMATCH',
      )
    }
  }

  // 6. Find or create employee (auto-provisioning)
  let isNewUser = false
  let [employee] = await db
    .select()
    .from(schema.employees)
    .where(
      and(
        eq(schema.employees.email, userInfo.email),
        eq(schema.employees.orgId, org.id),
      ),
    )

  if (!employee) {
    // Auto-provision new employee
    isNewUser = true
    const [newEmployee] = await db
      .insert(schema.employees)
      .values({
        orgId: org.id,
        email: userInfo.email,
        fullName: userInfo.name || userInfo.email.split('@')[0],
        role: 'employee', // default role for SSO-provisioned users
        jobTitle: 'New Employee',
        avatarUrl: userInfo.picture || null,
        isActive: true,
        emailVerified: true, // SSO-verified email
      })
      .returning()
    employee = newEmployee

    // Log the auto-provisioning
    try {
      await db.insert(schema.auditLog).values({
        orgId: org.id,
        userId: employee.id,
        action: 'create',
        entityType: 'employee',
        entityId: employee.id,
        details: `Auto-provisioned via SSO (${provider}): ${userInfo.email}`,
      })
    } catch {
      /* audit logging is non-critical */
    }
  }

  if (!employee.isActive) {
    throw new SSOError(
      'This account has been deactivated',
      'PROVISIONING_FAILED',
    )
  }

  // 7. Create session
  const token = await createSession(
    employee.id,
    org.id,
    employee.email,
    employee.role,
  )
  const cookie = setSessionCookie(token)

  // 8. Mark SSO session as completed
  await db
    .update(schema.ssoSessions)
    .set({ employeeId: employee.id, completedAt: new Date() })
    .where(eq(schema.ssoSessions.id, ssoSession.id))

  // 9. Audit log
  try {
    await db.insert(schema.auditLog).values({
      orgId: org.id,
      userId: employee.id,
      action: 'login',
      entityType: 'session',
      entityId: employee.id,
      details: `SSO login via ${provider}: ${employee.fullName} (${employee.email})`,
    })
  } catch {
    /* non-critical */
  }

  return {
    token,
    cookie,
    user: {
      id: employee.id,
      email: employee.email,
      fullName: employee.fullName,
      role: employee.role,
      orgId: org.id,
    },
    isNewUser,
    returnUrl: ssoSession.redirectUrl || '/dashboard',
  }
}

// Get all active SSO providers for an organization
export async function getOrgSSOProviders(
  orgId: string,
): Promise<
  Array<{
    id: string
    provider: string
    name: string
    isActive: boolean
  }>
> {
  const providers = await db
    .select({
      id: schema.ssoProviders.id,
      provider: schema.ssoProviders.provider,
      name: schema.ssoProviders.name,
      isActive: schema.ssoProviders.isActive,
    })
    .from(schema.ssoProviders)
    .where(eq(schema.ssoProviders.orgId, orgId))

  return providers
}

// Configure SSO provider for an org
export async function configureSSOProvider(
  orgId: string,
  provider: 'google' | 'azure',
  config: {
    name: string
    clientId: string
    clientSecret: string
    tenantId?: string // Azure only
    allowedDomains?: string
  },
): Promise<{ id: string }> {
  // Upsert: update if exists, create if not
  const [existing] = await db
    .select()
    .from(schema.ssoProviders)
    .where(
      and(
        eq(schema.ssoProviders.orgId, orgId),
        eq(schema.ssoProviders.provider, provider),
      ),
    )

  if (existing) {
    await db
      .update(schema.ssoProviders)
      .set({
        name: config.name,
        clientId: config.clientId,
        clientSecret: config.clientSecret,
        config: {
          tenantId: config.tenantId,
          allowedDomains: config.allowedDomains,
        },
        isActive: true,
        updatedAt: new Date(),
      })
      .where(eq(schema.ssoProviders.id, existing.id))
    return { id: existing.id }
  }

  const [newProvider] = await db
    .insert(schema.ssoProviders)
    .values({
      orgId,
      name: config.name,
      provider,
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      config: {
        tenantId: config.tenantId,
        allowedDomains: config.allowedDomains,
      },
      isActive: true,
    })
    .returning()

  return { id: newProvider.id }
}
