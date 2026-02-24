import { NextResponse } from 'next/server'

// ---------------------------------------------------------------------------
// GET /api/docs - OpenAPI 3.1 specification
// ---------------------------------------------------------------------------

const openApiSpec = {
  openapi: '3.1.0',
  info: {
    title: 'Tempo API',
    version: '1.0.0',
    description: 'Unified workforce platform API. Manages HR, performance, payroll, benefits, and more.',
    contact: { email: 'api@tempo.app', name: 'Tempo API Support' },
    license: { name: 'Proprietary' },
  },
  servers: [
    { url: 'https://app.tempo.app', description: 'Production' },
    { url: 'http://localhost:3000', description: 'Development' },
  ],
  security: [{ cookieAuth: [] }],
  paths: {
    '/api/auth': {
      post: {
        tags: ['Authentication'],
        summary: 'Authenticate user',
        description: 'Login, signup, or logout. Returns JWT session cookie.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  action: { type: 'string', enum: ['login', 'signup', 'logout'] },
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', minLength: 8 },
                  orgName: { type: 'string', description: 'Required for signup' },
                },
                required: ['action'],
              },
            },
          },
        },
        responses: { '200': { description: 'Authentication successful' }, '401': { description: 'Invalid credentials' } },
      },
    },
    '/api/auth/reset-password': {
      post: {
        tags: ['Authentication'],
        summary: 'Password reset',
        description: 'Request a password reset email or reset password with token.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  action: { type: 'string', enum: ['request', 'reset'] },
                  email: { type: 'string', description: 'Required for action=request' },
                  token: { type: 'string', description: 'Required for action=reset' },
                  newPassword: { type: 'string', description: 'Required for action=reset' },
                },
                required: ['action'],
              },
            },
          },
        },
        responses: { '200': { description: 'Success' } },
      },
    },
    '/api/data': {
      get: {
        tags: ['Data'],
        summary: 'Hydrate full org data',
        description: 'Returns all data for the authenticated org. Use /api/data/{module} for paginated access.',
        responses: {
          '200': { description: 'Full org data payload' },
          '401': { description: 'Unauthorized' },
        },
      },
      post: {
        tags: ['Data'],
        summary: 'Create, update, or delete entities',
        description: 'Generic CRUD endpoint for all platform entities.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  action: { type: 'string', enum: ['create', 'update', 'delete'] },
                  entity: { type: 'string', description: 'Entity name (e.g., employees, goals)' },
                  id: { type: 'string', format: 'uuid', description: 'Required for update/delete' },
                  data: { type: 'object', description: 'Entity data for create/update' },
                },
                required: ['action', 'entity'],
              },
            },
          },
        },
        responses: {
          '200': { description: 'Operation successful' },
          '201': { description: 'Entity created' },
          '403': { description: 'Forbidden (RBAC)' },
        },
      },
    },
    '/api/data/{module}': {
      get: {
        tags: ['Data'],
        summary: 'Get paginated module data',
        description: 'Lazy-load data for a specific module with pagination support.',
        parameters: [
          { name: 'module', in: 'path', required: true, schema: { type: 'string' }, description: 'Module name (e.g., employees, goals, reviews)' },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 50, maximum: 200 } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          '200': {
            description: 'Paginated data',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: { type: 'array', items: { type: 'object' } },
                    pagination: {
                      type: 'object',
                      properties: {
                        page: { type: 'integer' },
                        limit: { type: 'integer' },
                        total: { type: 'integer' },
                        totalPages: { type: 'integer' },
                        hasNext: { type: 'boolean' },
                        hasPrev: { type: 'boolean' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/billing': {
      get: {
        tags: ['Billing'],
        summary: 'Get subscription status',
        responses: { '200': { description: 'Subscription and plan details' } },
      },
      post: {
        tags: ['Billing'],
        summary: 'Billing actions',
        description: 'Checkout, portal access, cancel subscription, or sync usage.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  action: { type: 'string', enum: ['checkout', 'portal', 'cancel', 'sync-usage'] },
                  planId: { type: 'string' },
                  employeeCount: { type: 'integer' },
                },
                required: ['action'],
              },
            },
          },
        },
        responses: { '200': { description: 'Action completed' } },
      },
    },
    '/api/gdpr': {
      post: {
        tags: ['GDPR'],
        summary: 'Data subject requests',
        description: 'Export personal data or request erasure (GDPR Art. 15, 17, 20).',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  action: { type: 'string', enum: ['export', 'delete'] },
                  targetEmployeeId: { type: 'string', description: 'For admin-initiated deletion' },
                },
                required: ['action'],
              },
            },
          },
        },
        responses: { '200': { description: 'Data export or deletion confirmation' } },
      },
    },
    '/api/health': {
      get: {
        tags: ['Infrastructure'],
        summary: 'Health check',
        description: 'Returns service health status with component checks.',
        security: [],
        responses: {
          '200': { description: 'Service healthy' },
          '503': { description: 'Service degraded or down' },
        },
      },
    },
    '/api/ai': {
      post: {
        tags: ['AI'],
        summary: 'AI-powered analytics',
        description: 'Generate insights using Claude AI. Rate limited to 10 requests/minute.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  type: { type: 'string', enum: ['enhancement', 'sentiment', 'goal_quality', 'bias_detection', 'career_path', 'query', 'project_health', 'okr_quality', 'workflow_optimization'] },
                  data: { type: 'object' },
                },
                required: ['type', 'data'],
              },
            },
          },
        },
        responses: { '200': { description: 'AI-generated insight' }, '429': { description: 'Rate limited' } },
      },
    },
    '/api/upload': {
      post: {
        tags: ['Files'],
        summary: 'Upload file',
        description: 'Upload files to S3 or local storage. Max 10MB.',
        requestBody: {
          required: true,
          content: { 'multipart/form-data': { schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } } },
        },
        responses: { '200': { description: 'File uploaded' } },
      },
    },
    '/api/notifications': {
      get: {
        tags: ['Notifications'],
        summary: 'Get notifications',
        responses: { '200': { description: 'User notifications' } },
      },
      post: {
        tags: ['Notifications'],
        summary: 'Manage notifications',
        description: 'Mark as read, mark all as read, or send notifications.',
        responses: { '200': { description: 'Action completed' } },
      },
    },
  },
  components: {
    securitySchemes: {
      cookieAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'tempo_session',
        description: 'JWT session cookie set after authentication',
      },
    },
  },
  tags: [
    { name: 'Authentication', description: 'User authentication and session management' },
    { name: 'Data', description: 'CRUD operations for all platform entities' },
    { name: 'Billing', description: 'Stripe subscription and payment management' },
    { name: 'GDPR', description: 'Data subject rights and privacy compliance' },
    { name: 'AI', description: 'AI-powered workforce analytics' },
    { name: 'Files', description: 'File upload and management' },
    { name: 'Notifications', description: 'In-app and email notifications' },
    { name: 'Infrastructure', description: 'Health checks and monitoring' },
  ],
}

export async function GET() {
  return NextResponse.json(openApiSpec, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
