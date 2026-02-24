// Developer Portal & SDK Engine
// API key management, webhook subscriptions, OAuth2 apps, rate limiting, usage analytics, SDK config

import { db, schema } from '@/lib/db'
import { eq, and, desc, sql, count } from 'drizzle-orm'
import crypto from 'crypto'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ApiScope =
  | 'employees:read'
  | 'employees:write'
  | 'payroll:read'
  | 'payroll:write'
  | 'benefits:read'
  | 'benefits:write'
  | 'time:read'
  | 'time:write'
  | 'recruiting:read'
  | 'recruiting:write'
  | 'reports:read'
  | 'reports:write'
  | 'org:read'
  | 'org:write'
  | 'webhooks:manage'
  | 'admin'

export type WebhookEvent =
  | 'employee.created'
  | 'employee.updated'
  | 'employee.terminated'
  | 'payroll.processed'
  | 'payroll.approved'
  | 'benefit.enrolled'
  | 'benefit.changed'
  | 'time.clock_in'
  | 'time.clock_out'
  | 'time.request_submitted'
  | 'time.request_approved'
  | 'candidate.applied'
  | 'candidate.stage_changed'
  | 'offer.sent'
  | 'offer.accepted'
  | 'document.uploaded'
  | 'document.signed'

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export type RateLimitTier = 'standard' | 'premium'

export type AnalyticsPeriod = '1h' | '24h' | '7d' | '30d' | '90d'

export interface ApiKeyRecord {
  id: string
  orgId: string
  name: string
  prefix: string
  hashedKey: string
  scopes: ApiScope[]
  tier: RateLimitTier
  createdAt: string
  expiresAt: string | null
  revokedAt: string | null
  lastUsedAt: string | null
  totalRequests: number
}

export interface ApiKeyCreateResult {
  key: string
  keyId: string
  prefix: string
  name: string
  scopes: ApiScope[]
  expiresAt: string | null
  createdAt: string
}

export interface ApiKeyListItem {
  id: string
  name: string
  prefix: string
  scopes: ApiScope[]
  tier: RateLimitTier
  createdAt: string
  expiresAt: string | null
  revokedAt: string | null
  lastUsedAt: string | null
  totalRequests: number
  isActive: boolean
}

export interface ApiKeyValidationResult {
  valid: boolean
  keyId: string | null
  orgId: string | null
  scopes: ApiScope[]
  tier: RateLimitTier | null
  error?: string
}

export interface WebhookEndpointRecord {
  id: string
  orgId: string
  url: string
  events: WebhookEvent[]
  secret: string
  isActive: boolean
  createdAt: string
  lastDeliveredAt: string | null
  successCount: number
  failureCount: number
}

export interface WebhookTestResult {
  success: boolean
  statusCode: number | null
  responseTimeMs: number
  error?: string
  deliveredAt: string
}

export interface OAuthAppRecord {
  id: string
  orgId: string
  appName: string
  clientId: string
  hashedClientSecret: string
  redirectUris: string[]
  scopes: ApiScope[]
  isActive: boolean
  createdAt: string
  revokedAt: string | null
}

export interface OAuthAppCreateResult {
  appId: string
  appName: string
  clientId: string
  clientSecret: string
  redirectUris: string[]
  scopes: ApiScope[]
  createdAt: string
}

export interface OAuthAppListItem {
  id: string
  appName: string
  clientId: string
  redirectUris: string[]
  scopes: ApiScope[]
  isActive: boolean
  createdAt: string
  revokedAt: string | null
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  limit: number
  resetAt: string
  retryAfterMs: number | null
}

export interface RateLimitStatus {
  keyId: string
  tier: RateLimitTier
  currentWindowStart: string
  requestsInWindow: number
  limit: number
  remaining: number
  resetAt: string
  percentUsed: number
}

export interface ApiUsageRecord {
  id: string
  keyId: string
  orgId: string
  endpoint: string
  method: HttpMethod
  statusCode: number
  responseTimeMs: number
  timestamp: string
}

export interface ApiUsageStats {
  orgId: string
  period: AnalyticsPeriod
  totalRequests: number
  successfulRequests: number
  failedRequests: number
  errorRate: number
  avgResponseTimeMs: number
  p95ResponseTimeMs: number
  p99ResponseTimeMs: number
  topEndpoints: EndpointStats[]
  requestsByHour: TimeSeriesPoint[]
  errorsByStatusCode: Record<number, number>
  requestsByKey: KeyUsageSummary[]
}

export interface EndpointStats {
  endpoint: string
  method: HttpMethod
  totalRequests: number
  avgResponseTimeMs: number
  errorRate: number
}

export interface TimeSeriesPoint {
  timestamp: string
  count: number
  errors: number
}

export interface KeyUsageSummary {
  keyId: string
  keyName: string
  totalRequests: number
  lastUsedAt: string | null
}

export interface SDKConfig {
  orgId: string
  baseUrl: string
  apiVersion: string
  availableEndpoints: SDKEndpoint[]
  authMethod: 'api_key' | 'oauth2' | 'both'
  rateLimits: {
    standard: number
    premium: number
  }
  supportedWebhookEvents: WebhookEvent[]
  sdkLanguages: SDKLanguage[]
}

export interface SDKEndpoint {
  path: string
  method: HttpMethod
  description: string
  requiredScopes: ApiScope[]
  rateLimit: number | null
}

export interface SDKLanguage {
  language: string
  packageName: string
  installCommand: string
  initSnippet: string
  exampleSnippet: string
}

// ---------------------------------------------------------------------------
// In-Memory Storage
// ---------------------------------------------------------------------------

const apiKeys = new Map<string, ApiKeyRecord>()
const webhookEndpoints = new Map<string, WebhookEndpointRecord>()
const oauthApps = new Map<string, OAuthAppRecord>()
const apiUsageLogs: ApiUsageRecord[] = []
const rateLimitWindows = new Map<string, { windowStart: number; count: number }>()

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const API_KEY_PREFIX_LENGTH = 8
const API_KEY_TOTAL_LENGTH = 48
const RATE_LIMIT_WINDOW_MS = 60_000 // 1 minute

const RATE_LIMITS: Record<RateLimitTier, number> = {
  standard: 1000,
  premium: 5000,
}

export const AVAILABLE_SCOPES: { scope: ApiScope; label: string; description: string }[] = [
  { scope: 'employees:read', label: 'Employees (Read)', description: 'View employee profiles and directory' },
  { scope: 'employees:write', label: 'Employees (Write)', description: 'Create and update employee records' },
  { scope: 'payroll:read', label: 'Payroll (Read)', description: 'View payroll runs and pay stubs' },
  { scope: 'payroll:write', label: 'Payroll (Write)', description: 'Submit and process payroll' },
  { scope: 'benefits:read', label: 'Benefits (Read)', description: 'View benefit plans and enrollments' },
  { scope: 'benefits:write', label: 'Benefits (Write)', description: 'Manage benefit enrollments' },
  { scope: 'time:read', label: 'Time & Attendance (Read)', description: 'View time entries and schedules' },
  { scope: 'time:write', label: 'Time & Attendance (Write)', description: 'Submit time entries and requests' },
  { scope: 'recruiting:read', label: 'Recruiting (Read)', description: 'View job postings and candidates' },
  { scope: 'recruiting:write', label: 'Recruiting (Write)', description: 'Manage job postings and candidates' },
  { scope: 'reports:read', label: 'Reports (Read)', description: 'Generate and view reports' },
  { scope: 'reports:write', label: 'Reports (Write)', description: 'Create custom report definitions' },
  { scope: 'org:read', label: 'Organization (Read)', description: 'View organization settings and structure' },
  { scope: 'org:write', label: 'Organization (Write)', description: 'Manage organization settings' },
  { scope: 'webhooks:manage', label: 'Webhooks', description: 'Manage webhook subscriptions' },
  { scope: 'admin', label: 'Admin', description: 'Full administrative access' },
]

export const WEBHOOK_EVENTS: { event: WebhookEvent; label: string; category: string }[] = [
  { event: 'employee.created', label: 'Employee Created', category: 'Employees' },
  { event: 'employee.updated', label: 'Employee Updated', category: 'Employees' },
  { event: 'employee.terminated', label: 'Employee Terminated', category: 'Employees' },
  { event: 'payroll.processed', label: 'Payroll Processed', category: 'Payroll' },
  { event: 'payroll.approved', label: 'Payroll Approved', category: 'Payroll' },
  { event: 'benefit.enrolled', label: 'Benefit Enrolled', category: 'Benefits' },
  { event: 'benefit.changed', label: 'Benefit Changed', category: 'Benefits' },
  { event: 'time.clock_in', label: 'Clock In', category: 'Time & Attendance' },
  { event: 'time.clock_out', label: 'Clock Out', category: 'Time & Attendance' },
  { event: 'time.request_submitted', label: 'Time-Off Request Submitted', category: 'Time & Attendance' },
  { event: 'time.request_approved', label: 'Time-Off Request Approved', category: 'Time & Attendance' },
  { event: 'candidate.applied', label: 'Candidate Applied', category: 'Recruiting' },
  { event: 'candidate.stage_changed', label: 'Candidate Stage Changed', category: 'Recruiting' },
  { event: 'offer.sent', label: 'Offer Sent', category: 'Recruiting' },
  { event: 'offer.accepted', label: 'Offer Accepted', category: 'Recruiting' },
  { event: 'document.uploaded', label: 'Document Uploaded', category: 'Documents' },
  { event: 'document.signed', label: 'Document Signed', category: 'Documents' },
]

export const SDK_LANGUAGES: SDKLanguage[] = [
  {
    language: 'JavaScript / TypeScript',
    packageName: '@tempo/sdk',
    installCommand: 'npm install @tempo/sdk',
    initSnippet: `import { TempoClient } from '@tempo/sdk';

const tempo = new TempoClient({
  apiKey: 'YOUR_API_KEY',
  baseUrl: 'https://api.tempo-platform.com/v1',
});`,
    exampleSnippet: `// List all employees
const employees = await tempo.employees.list({
  page: 1,
  perPage: 25,
  status: 'active',
});

// Get a specific employee
const employee = await tempo.employees.get('emp_123');

// Create a time-off request
const request = await tempo.time.createRequest({
  employeeId: 'emp_123',
  type: 'vacation',
  startDate: '2026-03-01',
  endDate: '2026-03-05',
});`,
  },
  {
    language: 'Python',
    packageName: 'tempo-sdk',
    installCommand: 'pip install tempo-sdk',
    initSnippet: `from tempo import TempoClient

client = TempoClient(
    api_key="YOUR_API_KEY",
    base_url="https://api.tempo-platform.com/v1",
)`,
    exampleSnippet: `# List all employees
employees = client.employees.list(
    page=1,
    per_page=25,
    status="active",
)

# Get a specific employee
employee = client.employees.get("emp_123")

# Run payroll
payroll_run = client.payroll.process(
    pay_period="2026-02",
    dry_run=True,
)`,
  },
  {
    language: 'Ruby',
    packageName: 'tempo-ruby',
    installCommand: 'gem install tempo-ruby',
    initSnippet: `require 'tempo'

client = Tempo::Client.new(
  api_key: 'YOUR_API_KEY',
  base_url: 'https://api.tempo-platform.com/v1'
)`,
    exampleSnippet: `# List all employees
employees = client.employees.list(
  page: 1,
  per_page: 25,
  status: 'active'
)

# Get benefit enrollments
enrollments = client.benefits.enrollments(
  employee_id: 'emp_123'
)`,
  },
  {
    language: 'Go',
    packageName: 'github.com/tempo-platform/tempo-go',
    installCommand: 'go get github.com/tempo-platform/tempo-go',
    initSnippet: `import "github.com/tempo-platform/tempo-go"

client := tempo.NewClient(
    tempo.WithAPIKey("YOUR_API_KEY"),
    tempo.WithBaseURL("https://api.tempo-platform.com/v1"),
)`,
    exampleSnippet: `// List all employees
employees, err := client.Employees.List(ctx, &tempo.ListParams{
    Page:    1,
    PerPage: 25,
    Status:  "active",
})

// Get payroll summary
summary, err := client.Payroll.GetSummary(ctx, "2026-02")`,
  },
  {
    language: 'Java',
    packageName: 'com.tempo-platform:tempo-java',
    installCommand: `// Maven
<dependency>
  <groupId>com.tempo-platform</groupId>
  <artifactId>tempo-java</artifactId>
  <version>1.0.0</version>
</dependency>`,
    initSnippet: `import com.tempo.TempoClient;
import com.tempo.TempoClientConfig;

TempoClient client = new TempoClient(
    TempoClientConfig.builder()
        .apiKey("YOUR_API_KEY")
        .baseUrl("https://api.tempo-platform.com/v1")
        .build()
);`,
    exampleSnippet: `// List all employees
EmployeeList employees = client.employees().list(
    ListParams.builder()
        .page(1)
        .perPage(25)
        .status("active")
        .build()
);

// Create a new employee
Employee newEmployee = client.employees().create(
    CreateEmployeeParams.builder()
        .firstName("Jane")
        .lastName("Smith")
        .email("jane.smith@company.com")
        .departmentId("dept_456")
        .build()
);`,
  },
  {
    language: 'cURL',
    packageName: 'N/A',
    installCommand: '# No installation required',
    initSnippet: `# Set your API key as an environment variable
export TEMPO_API_KEY="YOUR_API_KEY"`,
    exampleSnippet: `# List all employees
curl -X GET "https://api.tempo-platform.com/v1/employees?page=1&per_page=25" \\
  -H "Authorization: Bearer $TEMPO_API_KEY" \\
  -H "Content-Type: application/json"

# Create a time-off request
curl -X POST "https://api.tempo-platform.com/v1/time/requests" \\
  -H "Authorization: Bearer $TEMPO_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "employee_id": "emp_123",
    "type": "vacation",
    "start_date": "2026-03-01",
    "end_date": "2026-03-05"
  }'`,
  },
]

const API_ENDPOINTS: SDKEndpoint[] = [
  { path: '/v1/employees', method: 'GET', description: 'List all employees', requiredScopes: ['employees:read'], rateLimit: null },
  { path: '/v1/employees/:id', method: 'GET', description: 'Get employee by ID', requiredScopes: ['employees:read'], rateLimit: null },
  { path: '/v1/employees', method: 'POST', description: 'Create a new employee', requiredScopes: ['employees:write'], rateLimit: 100 },
  { path: '/v1/employees/:id', method: 'PUT', description: 'Update an employee', requiredScopes: ['employees:write'], rateLimit: 100 },
  { path: '/v1/employees/:id', method: 'DELETE', description: 'Terminate an employee', requiredScopes: ['employees:write'], rateLimit: 50 },
  { path: '/v1/payroll/runs', method: 'GET', description: 'List payroll runs', requiredScopes: ['payroll:read'], rateLimit: null },
  { path: '/v1/payroll/runs/:id', method: 'GET', description: 'Get payroll run details', requiredScopes: ['payroll:read'], rateLimit: null },
  { path: '/v1/payroll/process', method: 'POST', description: 'Process payroll', requiredScopes: ['payroll:write'], rateLimit: 10 },
  { path: '/v1/benefits/plans', method: 'GET', description: 'List benefit plans', requiredScopes: ['benefits:read'], rateLimit: null },
  { path: '/v1/benefits/enrollments', method: 'GET', description: 'List benefit enrollments', requiredScopes: ['benefits:read'], rateLimit: null },
  { path: '/v1/benefits/enrollments', method: 'POST', description: 'Enroll in a benefit', requiredScopes: ['benefits:write'], rateLimit: 50 },
  { path: '/v1/time/entries', method: 'GET', description: 'List time entries', requiredScopes: ['time:read'], rateLimit: null },
  { path: '/v1/time/entries', method: 'POST', description: 'Create a time entry', requiredScopes: ['time:write'], rateLimit: 200 },
  { path: '/v1/time/requests', method: 'GET', description: 'List time-off requests', requiredScopes: ['time:read'], rateLimit: null },
  { path: '/v1/time/requests', method: 'POST', description: 'Submit a time-off request', requiredScopes: ['time:write'], rateLimit: 50 },
  { path: '/v1/recruiting/jobs', method: 'GET', description: 'List job postings', requiredScopes: ['recruiting:read'], rateLimit: null },
  { path: '/v1/recruiting/candidates', method: 'GET', description: 'List candidates', requiredScopes: ['recruiting:read'], rateLimit: null },
  { path: '/v1/recruiting/candidates', method: 'POST', description: 'Create a candidate', requiredScopes: ['recruiting:write'], rateLimit: 100 },
  { path: '/v1/reports', method: 'GET', description: 'List available reports', requiredScopes: ['reports:read'], rateLimit: null },
  { path: '/v1/reports/:id/run', method: 'POST', description: 'Run a report', requiredScopes: ['reports:read'], rateLimit: 20 },
  { path: '/v1/org/settings', method: 'GET', description: 'Get organization settings', requiredScopes: ['org:read'], rateLimit: null },
  { path: '/v1/org/departments', method: 'GET', description: 'List departments', requiredScopes: ['org:read'], rateLimit: null },
  { path: '/v1/webhooks', method: 'GET', description: 'List webhook endpoints', requiredScopes: ['webhooks:manage'], rateLimit: null },
  { path: '/v1/webhooks', method: 'POST', description: 'Register a webhook endpoint', requiredScopes: ['webhooks:manage'], rateLimit: 20 },
  { path: '/v1/webhooks/:id', method: 'DELETE', description: 'Delete a webhook endpoint', requiredScopes: ['webhooks:manage'], rateLimit: 20 },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateId(prefix: string): string {
  const randomPart = crypto.randomBytes(12).toString('hex')
  return `${prefix}_${randomPart}`
}

function generateApiKeyString(): { fullKey: string; prefix: string; hashed: string } {
  const rawBytes = crypto.randomBytes(API_KEY_TOTAL_LENGTH)
  const fullKey = `tmpo_${rawBytes.toString('hex').slice(0, API_KEY_TOTAL_LENGTH)}`
  const prefix = fullKey.slice(0, 5 + API_KEY_PREFIX_LENGTH) // "tmpo_" + 8 chars
  const hashed = crypto.createHash('sha256').update(fullKey).digest('hex')
  return { fullKey, prefix, hashed }
}

function hashSecret(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex')
}

function generateWebhookSecret(): string {
  return `whsec_${crypto.randomBytes(24).toString('hex')}`
}

function generateClientCredentials(): { clientId: string; clientSecret: string; hashedSecret: string } {
  const clientId = `tmpo_oauth_${crypto.randomBytes(16).toString('hex')}`
  const clientSecret = `tmpo_secret_${crypto.randomBytes(32).toString('hex')}`
  const hashedSecret = hashSecret(clientSecret)
  return { clientId, clientSecret, hashedSecret }
}

function nowISO(): string {
  return new Date().toISOString()
}

function periodToMs(period: AnalyticsPeriod): number {
  const map: Record<AnalyticsPeriod, number> = {
    '1h': 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000,
    '90d': 90 * 24 * 60 * 60 * 1000,
  }
  return map[period]
}

function getRateLimitWindowKey(keyId: string, endpoint: string): string {
  return `${keyId}::${endpoint}`
}

// ---------------------------------------------------------------------------
// 1. API Key Management
// ---------------------------------------------------------------------------

export async function createApiKey(
  orgId: string,
  name: string,
  scopes: ApiScope[],
  expiresIn?: number // duration in days, optional
): Promise<ApiKeyCreateResult> {
  if (!orgId) throw new Error('Organization ID is required')
  if (!name || name.trim().length === 0) throw new Error('API key name is required')
  if (!scopes || scopes.length === 0) throw new Error('At least one scope is required')

  // Validate scopes
  const validScopes = new Set(AVAILABLE_SCOPES.map((s) => s.scope))
  for (const scope of scopes) {
    if (!validScopes.has(scope)) {
      throw new Error(`Invalid scope: ${scope}`)
    }
  }

  const keyId = generateId('key')
  const { fullKey, prefix, hashed } = generateApiKeyString()
  const now = nowISO()
  const expiresAt = expiresIn
    ? new Date(Date.now() + expiresIn * 24 * 60 * 60 * 1000).toISOString()
    : null

  const record: ApiKeyRecord = {
    id: keyId,
    orgId,
    name: name.trim(),
    prefix,
    hashedKey: hashed,
    scopes,
    tier: 'standard',
    createdAt: now,
    expiresAt,
    revokedAt: null,
    lastUsedAt: null,
    totalRequests: 0,
  }

  apiKeys.set(keyId, record)

  return {
    key: fullKey, // shown once, never stored in plain text
    keyId,
    prefix,
    name: record.name,
    scopes,
    expiresAt,
    createdAt: now,
  }
}

export async function listApiKeys(orgId: string): Promise<ApiKeyListItem[]> {
  if (!orgId) throw new Error('Organization ID is required')

  const results: ApiKeyListItem[] = []

  for (const record of apiKeys.values()) {
    if (record.orgId !== orgId) continue

    const isExpired = record.expiresAt ? new Date(record.expiresAt) < new Date() : false
    const isRevoked = record.revokedAt !== null
    const isActive = !isExpired && !isRevoked

    results.push({
      id: record.id,
      name: record.name,
      prefix: record.prefix,
      scopes: record.scopes,
      tier: record.tier,
      createdAt: record.createdAt,
      expiresAt: record.expiresAt,
      revokedAt: record.revokedAt,
      lastUsedAt: record.lastUsedAt,
      totalRequests: record.totalRequests,
      isActive,
    })
  }

  // Sort by creation date descending
  results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  return results
}

export async function revokeApiKey(orgId: string, keyId: string): Promise<{ success: boolean; revokedAt: string }> {
  if (!orgId) throw new Error('Organization ID is required')
  if (!keyId) throw new Error('Key ID is required')

  const record = apiKeys.get(keyId)
  if (!record) throw new Error(`API key not found: ${keyId}`)
  if (record.orgId !== orgId) throw new Error('API key does not belong to this organization')
  if (record.revokedAt) throw new Error('API key is already revoked')

  const revokedAt = nowISO()
  record.revokedAt = revokedAt
  apiKeys.set(keyId, record)

  return { success: true, revokedAt }
}

export async function validateApiKey(key: string): Promise<ApiKeyValidationResult> {
  if (!key || !key.startsWith('tmpo_')) {
    return { valid: false, keyId: null, orgId: null, scopes: [], tier: null, error: 'Invalid key format' }
  }

  const hashed = crypto.createHash('sha256').update(key).digest('hex')

  for (const record of apiKeys.values()) {
    if (record.hashedKey !== hashed) continue

    // Found matching key - check validity
    if (record.revokedAt) {
      return { valid: false, keyId: record.id, orgId: null, scopes: [], tier: null, error: 'API key has been revoked' }
    }

    if (record.expiresAt && new Date(record.expiresAt) < new Date()) {
      return { valid: false, keyId: record.id, orgId: null, scopes: [], tier: null, error: 'API key has expired' }
    }

    // Update last used
    record.lastUsedAt = nowISO()
    record.totalRequests += 1
    apiKeys.set(record.id, record)

    return {
      valid: true,
      keyId: record.id,
      orgId: record.orgId,
      scopes: record.scopes,
      tier: record.tier,
    }
  }

  return { valid: false, keyId: null, orgId: null, scopes: [], tier: null, error: 'API key not found' }
}

// ---------------------------------------------------------------------------
// 2. Webhook Subscriptions
// ---------------------------------------------------------------------------

export async function registerWebhookEndpoint(
  orgId: string,
  url: string,
  events: WebhookEvent[],
  secret?: string
): Promise<WebhookEndpointRecord> {
  if (!orgId) throw new Error('Organization ID is required')
  if (!url) throw new Error('Webhook URL is required')
  if (!events || events.length === 0) throw new Error('At least one event is required')

  // Validate URL format
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== 'https:') {
      throw new Error('Webhook URL must use HTTPS')
    }
  } catch (e) {
    if (e instanceof Error && e.message.includes('HTTPS')) throw e
    throw new Error('Invalid webhook URL format')
  }

  // Validate events
  const validEvents = new Set(WEBHOOK_EVENTS.map((e) => e.event))
  for (const event of events) {
    if (!validEvents.has(event)) {
      throw new Error(`Invalid webhook event: ${event}`)
    }
  }

  // Check for duplicate URL within same org
  for (const existing of webhookEndpoints.values()) {
    if (existing.orgId === orgId && existing.url === url && existing.isActive) {
      throw new Error('A webhook endpoint with this URL already exists for your organization')
    }
  }

  const endpointId = generateId('whep')
  const webhookSecret = secret || generateWebhookSecret()

  const record: WebhookEndpointRecord = {
    id: endpointId,
    orgId,
    url,
    events,
    secret: webhookSecret,
    isActive: true,
    createdAt: nowISO(),
    lastDeliveredAt: null,
    successCount: 0,
    failureCount: 0,
  }

  webhookEndpoints.set(endpointId, record)

  return record
}

export async function listWebhookEndpoints(orgId: string): Promise<WebhookEndpointRecord[]> {
  if (!orgId) throw new Error('Organization ID is required')

  const results: WebhookEndpointRecord[] = []

  for (const record of webhookEndpoints.values()) {
    if (record.orgId === orgId) {
      results.push({ ...record })
    }
  }

  results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  return results
}

export async function deleteWebhookEndpoint(
  orgId: string,
  endpointId: string
): Promise<{ success: boolean; deletedAt: string }> {
  if (!orgId) throw new Error('Organization ID is required')
  if (!endpointId) throw new Error('Endpoint ID is required')

  const record = webhookEndpoints.get(endpointId)
  if (!record) throw new Error(`Webhook endpoint not found: ${endpointId}`)
  if (record.orgId !== orgId) throw new Error('Webhook endpoint does not belong to this organization')

  record.isActive = false
  webhookEndpoints.set(endpointId, record)

  return { success: true, deletedAt: nowISO() }
}

export async function testWebhookEndpoint(
  orgId: string,
  endpointId: string
): Promise<WebhookTestResult> {
  if (!orgId) throw new Error('Organization ID is required')
  if (!endpointId) throw new Error('Endpoint ID is required')

  const record = webhookEndpoints.get(endpointId)
  if (!record) throw new Error(`Webhook endpoint not found: ${endpointId}`)
  if (record.orgId !== orgId) throw new Error('Webhook endpoint does not belong to this organization')
  if (!record.isActive) throw new Error('Webhook endpoint is not active')

  const testPayload = {
    id: generateId('evt'),
    type: 'test.ping' as const,
    created_at: nowISO(),
    data: {
      message: 'This is a test webhook delivery from the Tempo Developer Portal',
      endpoint_id: endpointId,
    },
  }

  const signature = crypto
    .createHmac('sha256', record.secret)
    .update(JSON.stringify(testPayload))
    .digest('hex')

  const startTime = Date.now()

  try {
    const response = await fetch(record.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Tempo-Signature': `sha256=${signature}`,
        'X-Tempo-Event': 'test.ping',
        'X-Tempo-Delivery': testPayload.id,
        'User-Agent': 'Tempo-Webhooks/1.0',
      },
      body: JSON.stringify(testPayload),
      signal: AbortSignal.timeout(10_000),
    })

    const responseTimeMs = Date.now() - startTime
    const success = response.status >= 200 && response.status < 300

    if (success) {
      record.successCount += 1
    } else {
      record.failureCount += 1
    }
    record.lastDeliveredAt = nowISO()
    webhookEndpoints.set(endpointId, record)

    return {
      success,
      statusCode: response.status,
      responseTimeMs,
      deliveredAt: record.lastDeliveredAt,
      error: success ? undefined : `Received HTTP ${response.status}`,
    }
  } catch (err) {
    const responseTimeMs = Date.now() - startTime
    record.failureCount += 1
    record.lastDeliveredAt = nowISO()
    webhookEndpoints.set(endpointId, record)

    return {
      success: false,
      statusCode: null,
      responseTimeMs,
      deliveredAt: record.lastDeliveredAt,
      error: err instanceof Error ? err.message : 'Unknown error delivering test webhook',
    }
  }
}

// ---------------------------------------------------------------------------
// 3. OAuth2 App Registration
// ---------------------------------------------------------------------------

export async function registerOAuthApp(
  orgId: string,
  appName: string,
  redirectUris: string[],
  scopes: ApiScope[]
): Promise<OAuthAppCreateResult> {
  if (!orgId) throw new Error('Organization ID is required')
  if (!appName || appName.trim().length === 0) throw new Error('App name is required')
  if (!redirectUris || redirectUris.length === 0) throw new Error('At least one redirect URI is required')
  if (!scopes || scopes.length === 0) throw new Error('At least one scope is required')

  // Validate redirect URIs
  for (const uri of redirectUris) {
    try {
      const parsed = new URL(uri)
      // Allow http for localhost during development
      if (parsed.protocol !== 'https:' && parsed.hostname !== 'localhost' && parsed.hostname !== '127.0.0.1') {
        throw new Error(`Redirect URI must use HTTPS (except localhost): ${uri}`)
      }
    } catch (e) {
      if (e instanceof Error && e.message.includes('HTTPS')) throw e
      throw new Error(`Invalid redirect URI format: ${uri}`)
    }
  }

  // Validate scopes
  const validScopes = new Set(AVAILABLE_SCOPES.map((s) => s.scope))
  for (const scope of scopes) {
    if (!validScopes.has(scope)) {
      throw new Error(`Invalid scope: ${scope}`)
    }
  }

  const appId = generateId('oapp')
  const { clientId, clientSecret, hashedSecret } = generateClientCredentials()
  const now = nowISO()

  const record: OAuthAppRecord = {
    id: appId,
    orgId,
    appName: appName.trim(),
    clientId,
    hashedClientSecret: hashedSecret,
    redirectUris,
    scopes,
    isActive: true,
    createdAt: now,
    revokedAt: null,
  }

  oauthApps.set(appId, record)

  return {
    appId,
    appName: record.appName,
    clientId,
    clientSecret, // shown once, never stored in plain text
    redirectUris,
    scopes,
    createdAt: now,
  }
}

export async function listOAuthApps(orgId: string): Promise<OAuthAppListItem[]> {
  if (!orgId) throw new Error('Organization ID is required')

  const results: OAuthAppListItem[] = []

  for (const record of oauthApps.values()) {
    if (record.orgId !== orgId) continue

    results.push({
      id: record.id,
      appName: record.appName,
      clientId: record.clientId,
      redirectUris: record.redirectUris,
      scopes: record.scopes,
      isActive: record.isActive,
      createdAt: record.createdAt,
      revokedAt: record.revokedAt,
    })
  }

  results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  return results
}

export async function revokeOAuthApp(
  orgId: string,
  appId: string
): Promise<{ success: boolean; revokedAt: string }> {
  if (!orgId) throw new Error('Organization ID is required')
  if (!appId) throw new Error('App ID is required')

  const record = oauthApps.get(appId)
  if (!record) throw new Error(`OAuth app not found: ${appId}`)
  if (record.orgId !== orgId) throw new Error('OAuth app does not belong to this organization')
  if (record.revokedAt) throw new Error('OAuth app is already revoked')

  const revokedAt = nowISO()
  record.isActive = false
  record.revokedAt = revokedAt
  oauthApps.set(appId, record)

  return { success: true, revokedAt }
}

// ---------------------------------------------------------------------------
// 4. Rate Limiting
// ---------------------------------------------------------------------------

export async function checkRateLimit(keyId: string, endpoint: string): Promise<RateLimitResult> {
  if (!keyId) throw new Error('Key ID is required')
  if (!endpoint) throw new Error('Endpoint is required')

  const keyRecord = apiKeys.get(keyId)
  if (!keyRecord) throw new Error(`API key not found: ${keyId}`)

  const tier = keyRecord.tier
  const limit = RATE_LIMITS[tier]
  const windowKey = getRateLimitWindowKey(keyId, endpoint)
  const now = Date.now()

  let window = rateLimitWindows.get(windowKey)

  // Reset window if expired
  if (!window || now - window.windowStart >= RATE_LIMIT_WINDOW_MS) {
    window = { windowStart: now, count: 0 }
  }

  const resetAt = new Date(window.windowStart + RATE_LIMIT_WINDOW_MS).toISOString()
  const remaining = Math.max(0, limit - window.count)

  if (window.count >= limit) {
    const retryAfterMs = window.windowStart + RATE_LIMIT_WINDOW_MS - now
    return {
      allowed: false,
      remaining: 0,
      limit,
      resetAt,
      retryAfterMs: Math.max(0, retryAfterMs),
    }
  }

  // Increment counter
  window.count += 1
  rateLimitWindows.set(windowKey, window)

  return {
    allowed: true,
    remaining: Math.max(0, limit - window.count),
    limit,
    resetAt,
    retryAfterMs: null,
  }
}

export async function getRateLimitStatus(keyId: string): Promise<RateLimitStatus> {
  if (!keyId) throw new Error('Key ID is required')

  const keyRecord = apiKeys.get(keyId)
  if (!keyRecord) throw new Error(`API key not found: ${keyId}`)

  const tier = keyRecord.tier
  const limit = RATE_LIMITS[tier]
  const now = Date.now()

  // Aggregate across all endpoints for this key
  let totalRequests = 0
  let earliestWindowStart = now

  for (const [windowKey, window] of rateLimitWindows.entries()) {
    if (!windowKey.startsWith(`${keyId}::`)) continue
    if (now - window.windowStart < RATE_LIMIT_WINDOW_MS) {
      totalRequests += window.count
      if (window.windowStart < earliestWindowStart) {
        earliestWindowStart = window.windowStart
      }
    }
  }

  const resetAt = new Date(earliestWindowStart + RATE_LIMIT_WINDOW_MS).toISOString()
  const remaining = Math.max(0, limit - totalRequests)
  const percentUsed = limit > 0 ? Math.round((totalRequests / limit) * 100) : 0

  return {
    keyId,
    tier,
    currentWindowStart: new Date(earliestWindowStart).toISOString(),
    requestsInWindow: totalRequests,
    limit,
    remaining,
    resetAt,
    percentUsed: Math.min(100, percentUsed),
  }
}

// ---------------------------------------------------------------------------
// 5. API Usage Analytics
// ---------------------------------------------------------------------------

export async function recordApiUsage(
  keyId: string,
  endpoint: string,
  method: HttpMethod,
  statusCode: number,
  responseTimeMs: number
): Promise<{ recorded: boolean; usageId: string }> {
  if (!keyId) throw new Error('Key ID is required')
  if (!endpoint) throw new Error('Endpoint is required')
  if (!method) throw new Error('HTTP method is required')
  if (typeof statusCode !== 'number') throw new Error('Status code must be a number')
  if (typeof responseTimeMs !== 'number') throw new Error('Response time must be a number')

  const keyRecord = apiKeys.get(keyId)
  if (!keyRecord) throw new Error(`API key not found: ${keyId}`)

  const usageId = generateId('usg')
  const record: ApiUsageRecord = {
    id: usageId,
    keyId,
    orgId: keyRecord.orgId,
    endpoint,
    method,
    statusCode,
    responseTimeMs,
    timestamp: nowISO(),
  }

  apiUsageLogs.push(record)

  // Keep logs bounded to prevent memory growth (retain last 100,000 entries)
  if (apiUsageLogs.length > 100_000) {
    apiUsageLogs.splice(0, apiUsageLogs.length - 100_000)
  }

  return { recorded: true, usageId }
}

export async function getApiUsageStats(
  orgId: string,
  period: AnalyticsPeriod = '24h'
): Promise<ApiUsageStats> {
  if (!orgId) throw new Error('Organization ID is required')

  const cutoff = Date.now() - periodToMs(period)
  const cutoffDate = new Date(cutoff)

  // Filter logs for this org within the time period
  const relevantLogs = apiUsageLogs.filter(
    (log) => log.orgId === orgId && new Date(log.timestamp) >= cutoffDate
  )

  const totalRequests = relevantLogs.length
  const successfulRequests = relevantLogs.filter((l) => l.statusCode >= 200 && l.statusCode < 400).length
  const failedRequests = totalRequests - successfulRequests
  const errorRate = totalRequests > 0 ? Math.round((failedRequests / totalRequests) * 10000) / 100 : 0

  // Response time calculations
  const responseTimes = relevantLogs.map((l) => l.responseTimeMs).sort((a, b) => a - b)
  const avgResponseTimeMs =
    responseTimes.length > 0
      ? Math.round(responseTimes.reduce((sum, t) => sum + t, 0) / responseTimes.length)
      : 0
  const p95ResponseTimeMs =
    responseTimes.length > 0
      ? responseTimes[Math.floor(responseTimes.length * 0.95)] ?? 0
      : 0
  const p99ResponseTimeMs =
    responseTimes.length > 0
      ? responseTimes[Math.floor(responseTimes.length * 0.99)] ?? 0
      : 0

  // Top endpoints
  const endpointMap = new Map<string, { total: number; errors: number; totalTime: number; method: HttpMethod }>()
  for (const log of relevantLogs) {
    const key = `${log.method} ${log.endpoint}`
    const existing = endpointMap.get(key) || { total: 0, errors: 0, totalTime: 0, method: log.method }
    existing.total += 1
    existing.totalTime += log.responseTimeMs
    if (log.statusCode >= 400) existing.errors += 1
    existing.method = log.method
    endpointMap.set(key, existing)
  }

  const topEndpoints: EndpointStats[] = Array.from(endpointMap.entries())
    .map(([key, stats]) => ({
      endpoint: key.split(' ').slice(1).join(' '),
      method: stats.method,
      totalRequests: stats.total,
      avgResponseTimeMs: stats.total > 0 ? Math.round(stats.totalTime / stats.total) : 0,
      errorRate: stats.total > 0 ? Math.round((stats.errors / stats.total) * 10000) / 100 : 0,
    }))
    .sort((a, b) => b.totalRequests - a.totalRequests)
    .slice(0, 10)

  // Time series (group by hour)
  const hourBuckets = new Map<string, { count: number; errors: number }>()
  for (const log of relevantLogs) {
    const date = new Date(log.timestamp)
    const hourKey = new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours()).toISOString()
    const bucket = hourBuckets.get(hourKey) || { count: 0, errors: 0 }
    bucket.count += 1
    if (log.statusCode >= 400) bucket.errors += 1
    hourBuckets.set(hourKey, bucket)
  }

  const requestsByHour: TimeSeriesPoint[] = Array.from(hourBuckets.entries())
    .map(([timestamp, data]) => ({ timestamp, count: data.count, errors: data.errors }))
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp))

  // Errors by status code
  const errorsByStatusCode: Record<number, number> = {}
  for (const log of relevantLogs) {
    if (log.statusCode >= 400) {
      errorsByStatusCode[log.statusCode] = (errorsByStatusCode[log.statusCode] || 0) + 1
    }
  }

  // Usage by key
  const keyMap = new Map<string, { total: number; lastUsedAt: string | null }>()
  for (const log of relevantLogs) {
    const existing = keyMap.get(log.keyId) || { total: 0, lastUsedAt: null }
    existing.total += 1
    if (!existing.lastUsedAt || log.timestamp > existing.lastUsedAt) {
      existing.lastUsedAt = log.timestamp
    }
    keyMap.set(log.keyId, existing)
  }

  const requestsByKey: KeyUsageSummary[] = Array.from(keyMap.entries())
    .map(([keyId, data]) => {
      const keyRecord = apiKeys.get(keyId)
      return {
        keyId,
        keyName: keyRecord?.name ?? 'Unknown Key',
        totalRequests: data.total,
        lastUsedAt: data.lastUsedAt,
      }
    })
    .sort((a, b) => b.totalRequests - a.totalRequests)

  return {
    orgId,
    period,
    totalRequests,
    successfulRequests,
    failedRequests,
    errorRate,
    avgResponseTimeMs,
    p95ResponseTimeMs,
    p99ResponseTimeMs,
    topEndpoints,
    requestsByHour,
    errorsByStatusCode,
    requestsByKey,
  }
}

// ---------------------------------------------------------------------------
// 6. SDK Configuration
// ---------------------------------------------------------------------------

export function getSDKConfig(orgId: string): SDKConfig {
  if (!orgId) throw new Error('Organization ID is required')

  return {
    orgId,
    baseUrl: 'https://api.tempo-platform.com/v1',
    apiVersion: 'v1',
    availableEndpoints: API_ENDPOINTS,
    authMethod: 'both',
    rateLimits: {
      standard: RATE_LIMITS.standard,
      premium: RATE_LIMITS.premium,
    },
    supportedWebhookEvents: WEBHOOK_EVENTS.map((e) => e.event),
    sdkLanguages: SDK_LANGUAGES,
  }
}
