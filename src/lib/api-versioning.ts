// API Versioning & Interactive Documentation System
// Supports version negotiation, deprecation warnings, and interactive API explorer

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ApiVersion {
  version: string
  status: 'current' | 'stable' | 'deprecated' | 'sunset'
  releasedAt: string
  deprecatedAt?: string
  sunsetAt?: string
  changelog: string[]
}

export interface ApiEndpointDoc {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  path: string
  summary: string
  description: string
  tag: string
  authentication: 'bearer' | 'api_key' | 'none'
  parameters?: ApiParameter[]
  requestBody?: ApiRequestBody
  responses: ApiResponse[]
  examples?: ApiExample[]
  rateLimit?: { requests: number; window: string }
  since?: string
  deprecated?: boolean
}

export interface ApiParameter {
  name: string
  in: 'query' | 'path' | 'header'
  type: string
  required: boolean
  description: string
  example?: string
}

export interface ApiRequestBody {
  contentType: string
  schema: Record<string, unknown>
  example: Record<string, unknown>
}

export interface ApiResponse {
  status: number
  description: string
  example?: Record<string, unknown>
}

export interface ApiExample {
  title: string
  language: 'curl' | 'javascript' | 'python'
  code: string
}

// ---------------------------------------------------------------------------
// API Versions
// ---------------------------------------------------------------------------

export const API_VERSIONS: ApiVersion[] = [
  {
    version: '2026-02-01',
    status: 'current',
    releasedAt: '2026-02-01',
    changelog: [
      'Added recruiting pipeline and ATS endpoints',
      'Added LMS course library and auto-enrollment',
      'Added MDM device management commands',
      'Added global payroll tax engine',
      'Added developer portal with API key management',
      'Added app marketplace with 20+ integrations',
    ],
  },
  {
    version: '2025-11-01',
    status: 'stable',
    releasedAt: '2025-11-01',
    changelog: [
      'Added SCIM 2.0 provisioning endpoints',
      'Added compliance scanning and handbook generation',
      'Added advanced analytics with cross-module reports',
      'Added workflow triggers and webhook processing',
      'Added billing and subscription management',
    ],
  },
  {
    version: '2025-08-01',
    status: 'deprecated',
    releasedAt: '2025-08-01',
    deprecatedAt: '2026-01-01',
    sunsetAt: '2026-06-01',
    changelog: [
      'Initial API release',
      'Employee CRUD, departments, leave requests',
      'Performance reviews, goals, feedback',
      'Basic payroll runs and reporting',
    ],
  },
]

// ---------------------------------------------------------------------------
// API Endpoint Documentation
// ---------------------------------------------------------------------------

export const API_ENDPOINTS: ApiEndpointDoc[] = [
  // -- Employees --
  {
    method: 'GET', path: '/api/data/employees', summary: 'List employees',
    description: 'Retrieve a paginated list of employees for the organization.',
    tag: 'Employees', authentication: 'bearer',
    parameters: [
      { name: 'page', in: 'query', type: 'integer', required: false, description: 'Page number (default: 1)', example: '1' },
      { name: 'limit', in: 'query', type: 'integer', required: false, description: 'Items per page (default: 50, max: 200)', example: '50' },
    ],
    responses: [
      { status: 200, description: 'List of employees', example: { data: [], pagination: { page: 1, limit: 50, total: 120, totalPages: 3 } } },
      { status: 401, description: 'Unauthorized' },
    ],
    rateLimit: { requests: 1000, window: '1 minute' },
  },

  // -- Recruiting --
  {
    method: 'GET', path: '/api/recruiting?action=overview', summary: 'Recruiting overview',
    description: 'Get an overview of open positions, applications, and urgent actions.',
    tag: 'Recruiting', authentication: 'bearer',
    responses: [
      { status: 200, description: 'Recruiting overview', example: { openPositions: [], applicationsByStatus: {}, urgentActions: [] } },
    ],
    rateLimit: { requests: 500, window: '1 minute' },
  },
  {
    method: 'GET', path: '/api/recruiting?action=metrics', summary: 'Recruiting metrics',
    description: 'Detailed recruiting analytics: time-to-fill, conversion rates, source effectiveness.',
    tag: 'Recruiting', authentication: 'bearer',
    responses: [
      { status: 200, description: 'Recruiting metrics' },
    ],
  },
  {
    method: 'POST', path: '/api/recruiting', summary: 'Recruiting actions',
    description: 'Perform recruiting actions: distribute to job boards, screen resumes, schedule interviews, generate offers.',
    tag: 'Recruiting', authentication: 'bearer',
    requestBody: {
      contentType: 'application/json',
      schema: { action: 'string', jobId: 'string?', applicationId: 'string?', boards: 'string[]?' },
      example: { action: 'screen', applicationId: '...' },
    },
    responses: [
      { status: 200, description: 'Action result' },
      { status: 400, description: 'Invalid request' },
    ],
  },

  // -- Learning --
  {
    method: 'GET', path: '/api/learning?action=library', summary: 'Course library',
    description: 'Browse the course library with filtering by category, level, format, and search.',
    tag: 'Learning', authentication: 'bearer',
    parameters: [
      { name: 'category', in: 'query', type: 'string', required: false, description: 'Filter by category' },
      { name: 'level', in: 'query', type: 'string', required: false, description: 'beginner, intermediate, advanced' },
      { name: 'search', in: 'query', type: 'string', required: false, description: 'Search by title or description' },
    ],
    responses: [
      { status: 200, description: 'Course list with enrollment stats' },
    ],
  },
  {
    method: 'GET', path: '/api/learning?action=compliance', summary: 'Compliance training status',
    description: 'Check mandatory course completion rates and overdue employees.',
    tag: 'Learning', authentication: 'bearer',
    responses: [
      { status: 200, description: 'Compliance training status with department breakdown' },
    ],
  },

  // -- Devices --
  {
    method: 'GET', path: '/api/devices?action=inventory', summary: 'Device inventory',
    description: 'List all devices with filtering by type, status, and assignee.',
    tag: 'Devices', authentication: 'bearer',
    responses: [
      { status: 200, description: 'Device list with summary statistics' },
    ],
  },
  {
    method: 'POST', path: '/api/devices', summary: 'Device operations',
    description: 'Provision, assign, retire, send commands, or manage software licenses.',
    tag: 'Devices', authentication: 'bearer',
    requestBody: {
      contentType: 'application/json',
      schema: { action: 'string', deviceId: 'string?', employeeId: 'string?', command: 'string?' },
      example: { action: 'command', deviceId: '...', command: 'lock' },
    },
    responses: [
      { status: 200, description: 'Operation result' },
    ],
  },

  // -- Payroll --
  {
    method: 'GET', path: '/api/payroll?action=calculate-tax', summary: 'Calculate taxes',
    description: 'Calculate income tax breakdown for a given country and salary.',
    tag: 'Payroll', authentication: 'bearer',
    parameters: [
      { name: 'country', in: 'query', type: 'string', required: true, description: 'Country code (US, UK, DE, FR, CA, AU)', example: 'US' },
      { name: 'salary', in: 'query', type: 'integer', required: true, description: 'Annual gross salary', example: '100000' },
      { name: 'state', in: 'query', type: 'string', required: false, description: 'State/province code', example: 'CA' },
    ],
    responses: [
      { status: 200, description: 'Tax breakdown', example: { country: 'US', grossSalary: 100000, federalTax: 14260, totalTax: 26086, netPay: 73914 } },
    ],
  },

  // -- Analytics --
  {
    method: 'GET', path: '/api/analytics?action=templates', summary: 'Report templates',
    description: 'List available analytics report templates.',
    tag: 'Analytics', authentication: 'bearer',
    responses: [
      { status: 200, description: 'List of report templates' },
    ],
  },
  {
    method: 'POST', path: '/api/analytics', summary: 'Execute report',
    description: 'Execute an analytics report by template ID.',
    tag: 'Analytics', authentication: 'bearer',
    requestBody: {
      contentType: 'application/json',
      schema: { reportId: 'string' },
      example: { reportId: 'headcount-by-department' },
    },
    responses: [
      { status: 200, description: 'Report results with columns, rows, and totals' },
    ],
  },

  // -- Compliance --
  {
    method: 'GET', path: '/api/compliance?action=scan', summary: 'Compliance scan',
    description: 'Run a compliance scan across all applicable labor law rules.',
    tag: 'Compliance', authentication: 'bearer',
    responses: [
      { status: 200, description: 'Compliance scan results with issues and score' },
    ],
  },

  // -- Webhooks --
  {
    method: 'GET', path: '/api/webhooks', summary: 'List triggers and actions',
    description: 'List all available workflow triggers and actions.',
    tag: 'Workflows', authentication: 'bearer',
    responses: [
      { status: 200, description: 'Available triggers and actions', example: { triggers: [], actions: [] } },
    ],
  },

  // -- SCIM --
  {
    method: 'GET', path: '/api/scim/v2/Users', summary: 'SCIM list users',
    description: 'List users per SCIM 2.0 protocol (RFC 7644).',
    tag: 'SCIM', authentication: 'bearer',
    parameters: [
      { name: 'filter', in: 'query', type: 'string', required: false, description: 'SCIM filter expression', example: 'userName eq "john@example.com"' },
      { name: 'startIndex', in: 'query', type: 'integer', required: false, description: 'Start index (1-based)', example: '1' },
      { name: 'count', in: 'query', type: 'integer', required: false, description: 'Max results per page', example: '100' },
    ],
    responses: [
      { status: 200, description: 'SCIM ListResponse' },
      { status: 401, description: 'Unauthorized (SCIM error format)' },
    ],
  },

  // -- Billing --
  {
    method: 'GET', path: '/api/billing', summary: 'Subscription status',
    description: 'Get current billing subscription status.',
    tag: 'Billing', authentication: 'bearer',
    responses: [
      { status: 200, description: 'Subscription details' },
    ],
  },

  // -- Developer Portal --
  {
    method: 'GET', path: '/api/developer?action=keys', summary: 'List API keys',
    description: 'List all API keys for the organization.',
    tag: 'Developer', authentication: 'bearer',
    responses: [
      { status: 200, description: 'List of API keys (masked)' },
    ],
  },
  {
    method: 'POST', path: '/api/developer', summary: 'Developer actions',
    description: 'Create API keys, register webhooks, manage OAuth apps.',
    tag: 'Developer', authentication: 'bearer',
    requestBody: {
      contentType: 'application/json',
      schema: { action: 'string' },
      example: { action: 'create-key', name: 'Production Key', scopes: ['employees:read', 'payroll:read'] },
    },
    responses: [
      { status: 200, description: 'Action result' },
    ],
  },

  // -- Marketplace --
  {
    method: 'GET', path: '/api/marketplace?action=apps', summary: 'Browse marketplace',
    description: 'Browse and search the app marketplace.',
    tag: 'Marketplace', authentication: 'bearer',
    parameters: [
      { name: 'category', in: 'query', type: 'string', required: false, description: 'Filter by category' },
      { name: 'search', in: 'query', type: 'string', required: false, description: 'Search by name or description' },
    ],
    responses: [
      { status: 200, description: 'List of marketplace apps' },
    ],
  },

  // -- Health --
  {
    method: 'GET', path: '/api/health', summary: 'Health check',
    description: 'System health check including database connectivity.',
    tag: 'System', authentication: 'none',
    responses: [
      { status: 200, description: 'System healthy', example: { status: 'ok' } },
      { status: 503, description: 'System unhealthy' },
    ],
  },
]

// ---------------------------------------------------------------------------
// Version Negotiation
// ---------------------------------------------------------------------------

export function resolveApiVersion(requestedVersion?: string): { version: ApiVersion; warnings: string[] } {
  const warnings: string[] = []

  if (!requestedVersion) {
    const current = API_VERSIONS.find(v => v.status === 'current')!
    return { version: current, warnings: [] }
  }

  const exact = API_VERSIONS.find(v => v.version === requestedVersion)
  if (exact) {
    if (exact.status === 'deprecated') {
      warnings.push(`API version ${exact.version} is deprecated. It will be sunset on ${exact.sunsetAt}. Please migrate to the current version.`)
    }
    if (exact.status === 'sunset') {
      warnings.push(`API version ${exact.version} has been sunset and is no longer available.`)
      const current = API_VERSIONS.find(v => v.status === 'current')!
      return { version: current, warnings }
    }
    return { version: exact, warnings }
  }

  warnings.push(`Unknown API version "${requestedVersion}". Using current version.`)
  const current = API_VERSIONS.find(v => v.status === 'current')!
  return { version: current, warnings }
}

// ---------------------------------------------------------------------------
// OpenAPI 3.1 Generator
// ---------------------------------------------------------------------------

export function generateOpenApiSpec(): Record<string, unknown> {
  const paths: Record<string, unknown> = {}
  const tags = [...new Set(API_ENDPOINTS.map(e => e.tag))].map(t => ({ name: t }))

  for (const endpoint of API_ENDPOINTS) {
    const pathKey = endpoint.path.split('?')[0]
    const method = endpoint.method.toLowerCase()

    if (!paths[pathKey]) paths[pathKey] = {}

    const operation: Record<string, unknown> = {
      summary: endpoint.summary,
      description: endpoint.description,
      tags: [endpoint.tag],
      responses: {},
    }

    if (endpoint.parameters?.length) {
      operation.parameters = endpoint.parameters.map(p => ({
        name: p.name,
        in: p.in,
        required: p.required,
        description: p.description,
        schema: { type: p.type },
        example: p.example,
      }))
    }

    if (endpoint.requestBody) {
      operation.requestBody = {
        required: true,
        content: {
          [endpoint.requestBody.contentType]: {
            schema: { type: 'object', properties: endpoint.requestBody.schema },
            example: endpoint.requestBody.example,
          },
        },
      }
    }

    for (const resp of endpoint.responses) {
      (operation.responses as Record<string, unknown>)[String(resp.status)] = {
        description: resp.description,
        ...(resp.example ? {
          content: { 'application/json': { example: resp.example } },
        } : {}),
      }
    }

    if (endpoint.authentication !== 'none') {
      operation.security = [{ [endpoint.authentication === 'bearer' ? 'BearerAuth' : 'ApiKeyAuth']: [] }]
    }

    if (endpoint.deprecated) {
      operation.deprecated = true
    }

    ;(paths[pathKey] as Record<string, unknown>)[method] = operation
  }

  return {
    openapi: '3.1.0',
    info: {
      title: 'Tempo Platform API',
      description: 'Comprehensive HR platform API with employee management, payroll, recruiting, learning, device management, and more.',
      version: API_VERSIONS.find(v => v.status === 'current')!.version,
      contact: { name: 'Tempo API Support', email: 'api@tempo.dev' },
    },
    servers: [
      { url: 'https://api.tempo.dev', description: 'Production' },
      { url: 'http://localhost:3000', description: 'Development' },
    ],
    tags,
    paths,
    components: {
      securitySchemes: {
        BearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        ApiKeyAuth: { type: 'apiKey', in: 'header', name: 'X-API-Key' },
      },
    },
  }
}

// ---------------------------------------------------------------------------
// Interactive API Explorer Data
// ---------------------------------------------------------------------------

export function getApiExplorerData(): {
  versions: ApiVersion[]
  endpoints: ApiEndpointDoc[]
  tags: string[]
  currentVersion: string
} {
  return {
    versions: API_VERSIONS,
    endpoints: API_ENDPOINTS,
    tags: [...new Set(API_ENDPOINTS.map(e => e.tag))],
    currentVersion: API_VERSIONS.find(v => v.status === 'current')!.version,
  }
}
