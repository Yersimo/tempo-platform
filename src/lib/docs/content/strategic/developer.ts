import type { ModuleDoc } from '../../types'

const developer: ModuleDoc = {
  slug: 'developer',
  title: 'Developer Hub',
  subtitle: 'REST API, webhooks, OAuth applications, and developer tools for building integrations with Tempo',
  icon: 'Code',
  group: 'strategic',
  lastUpdated: '2026-03-13',
  version: '1.0',

  overview: {
    description:
      'The Developer Hub is the central place for building, managing, and monitoring integrations with the Tempo platform. It provides a comprehensive REST API with full CRUD access to all Tempo resources, real-time webhooks for event-driven architectures, OAuth 2.0 application management for third-party integrations, and interactive documentation with a built-in API explorer. Developers can generate API keys, monitor request logs, configure rate limits, and test endpoints without leaving the Tempo interface.',
    keyFeatures: [
      'RESTful API with versioned endpoints covering all Tempo modules',
      'Interactive API explorer with live request/response testing',
      'Webhook subscriptions for 50+ event types with retry logic and dead-letter queues',
      'OAuth 2.0 application registration for third-party integrations',
      'API key management with scoped permissions and expiration dates',
      'Request logging and analytics dashboard with latency and error rate metrics',
      'Rate limiting with configurable tiers and burst allowances',
      'SDK libraries for JavaScript, Python, Ruby, and Go',
    ],
    screenshotKey: 'developer/overview',
  },

  workflows: [
    {
      id: 'create-api-key',
      title: 'Creating an API Key',
      description:
        'Generate a scoped API key for authenticating programmatic access to the Tempo REST API.',
      estimatedTime: '3 minutes',
      roles: ['owner', 'admin'],
      steps: [
        {
          number: 1,
          title: 'Open the Developer Hub',
          description:
            'Navigate to Developer Hub from the left sidebar. The dashboard shows an overview of API usage, active keys, webhook health, and recent error logs.',
          screenshotKey: 'developer/api-key-step-1',
        },
        {
          number: 2,
          title: 'Navigate to API Keys',
          description:
            'Click the "API Keys" tab. Existing keys are listed with their name, creation date, last used date, permission scope, and status (Active, Expired, Revoked).',
          screenshotKey: 'developer/api-key-step-2',
        },
        {
          number: 3,
          title: 'Generate a new key',
          description:
            'Click "+ New API Key". Enter a descriptive name (e.g., "Payroll Integration - ADP"). Select the permission scopes: choose specific modules (read/write) or use a preset like "Read Only" or "Full Access".',
          screenshotKey: 'developer/api-key-step-3',
          tip: 'Follow the principle of least privilege. Grant only the permissions the integration actually needs.',
        },
        {
          number: 4,
          title: 'Set expiration and IP restrictions',
          description:
            'Choose an expiration period: 30 days, 90 days, 1 year, or no expiration. Optionally restrict the key to specific IP addresses or CIDR ranges for additional security.',
          screenshotKey: 'developer/api-key-step-4',
        },
        {
          number: 5,
          title: 'Copy and store the key',
          description:
            'The API key is displayed once after creation. Copy it immediately and store it securely in your secrets manager. The key cannot be viewed again after you leave this page. If lost, you must generate a new key.',
          screenshotKey: 'developer/api-key-step-5',
        },
      ],
    },
    {
      id: 'setup-webhooks',
      title: 'Setting Up Webhooks',
      description:
        'Subscribe to Tempo events to receive real-time HTTP notifications when data changes, enabling event-driven integrations.',
      estimatedTime: '5 minutes',
      roles: ['owner', 'admin'],
      steps: [
        {
          number: 1,
          title: 'Navigate to Webhooks',
          description:
            'Click the "Webhooks" tab in the Developer Hub. Existing webhook subscriptions are listed with their target URL, subscribed events, delivery status, and success rate.',
          screenshotKey: 'developer/webhook-step-1',
        },
        {
          number: 2,
          title: 'Create a new webhook',
          description:
            'Click "+ New Webhook". Enter the endpoint URL that will receive the webhook payloads. The URL must use HTTPS and return a 2xx status code within 30 seconds.',
          screenshotKey: 'developer/webhook-step-2',
        },
        {
          number: 3,
          title: 'Select events to subscribe',
          description:
            'Choose from 50+ event types organized by module: Employee Created, Leave Approved, Payroll Completed, Document Signed, and more. Select individual events or subscribe to all events in a module.',
          screenshotKey: 'developer/webhook-step-3',
          tip: 'Start with a narrow set of events and expand as needed. Subscribing to too many events can overwhelm your receiving endpoint.',
        },
        {
          number: 4,
          title: 'Configure security',
          description:
            'Set a webhook secret that Tempo uses to sign each payload with an HMAC-SHA256 signature. Your endpoint should verify this signature to ensure payloads are authentic and untampered.',
          screenshotKey: 'developer/webhook-step-4',
        },
        {
          number: 5,
          title: 'Test the webhook',
          description:
            'Click "Send Test Event" to deliver a sample payload to your endpoint. The test panel shows the request headers, body, and your endpoint\'s response. Verify that your endpoint processes the payload correctly.',
          screenshotKey: 'developer/webhook-step-5',
        },
        {
          number: 6,
          title: 'Activate the webhook',
          description:
            'Click "Activate". The webhook begins receiving live events. Failed deliveries are retried with exponential backoff (1 min, 5 min, 30 min, 2 hours). After 5 consecutive failures, the webhook is paused and you receive an alert.',
          screenshotKey: 'developer/webhook-step-6',
        },
      ],
    },
    {
      id: 'register-oauth-app',
      title: 'Registering an OAuth Application',
      description:
        'Create an OAuth 2.0 application to allow third-party services to authenticate users and access Tempo on their behalf.',
      estimatedTime: '5 minutes',
      roles: ['owner', 'admin'],
      steps: [
        {
          number: 1,
          title: 'Navigate to OAuth Apps',
          description:
            'Click the "OAuth Apps" tab in the Developer Hub. Registered applications are listed with their name, client ID, redirect URIs, and the number of authorized users.',
          screenshotKey: 'developer/oauth-step-1',
        },
        {
          number: 2,
          title: 'Register a new application',
          description:
            'Click "+ Register App". Enter the application name, description, homepage URL, and one or more redirect URIs. The redirect URIs must exactly match the URLs your application uses for the OAuth callback.',
          screenshotKey: 'developer/oauth-step-2',
        },
        {
          number: 3,
          title: 'Configure scopes',
          description:
            'Select the OAuth scopes your application will request. Scopes determine what data the application can access: profile (basic user info), read:employees, write:leave, read:payroll, and more. Users are shown these scopes during the authorization flow.',
          screenshotKey: 'developer/oauth-step-3',
        },
        {
          number: 4,
          title: 'Obtain credentials',
          description:
            'After registration, you receive a Client ID and Client Secret. Store the Client Secret securely. Use these credentials in your application\'s OAuth 2.0 authorization code flow to obtain access tokens.',
          screenshotKey: 'developer/oauth-step-4',
          tip: 'Never embed the Client Secret in client-side code or mobile apps. Use the PKCE extension for public clients.',
        },
        {
          number: 5,
          title: 'Test the authorization flow',
          description:
            'Use the "Test Authorization" button to simulate the full OAuth flow. A consent screen appears showing the requested scopes. After granting access, you are redirected to your callback URL with an authorization code.',
          screenshotKey: 'developer/oauth-step-5',
        },
      ],
    },
    {
      id: 'use-api-explorer',
      title: 'Using the API Explorer',
      description:
        'Interactively test API endpoints, inspect request and response schemas, and generate code snippets for your integration.',
      estimatedTime: '5 minutes',
      roles: ['owner', 'admin'],
      steps: [
        {
          number: 1,
          title: 'Open the API Explorer',
          description:
            'Click the "API Explorer" tab in the Developer Hub. The explorer displays a navigable list of all available API endpoints grouped by module (People, Leave, Payroll, etc.).',
          screenshotKey: 'developer/explorer-step-1',
        },
        {
          number: 2,
          title: 'Select an endpoint',
          description:
            'Click any endpoint to expand its documentation panel. The panel shows the HTTP method, URL path, request parameters, request body schema, response schema, and example responses.',
          screenshotKey: 'developer/explorer-step-2',
        },
        {
          number: 3,
          title: 'Configure the request',
          description:
            'Fill in the required path parameters (e.g., employee ID), query parameters (e.g., page, limit), and request body fields. The explorer validates your input against the schema in real time.',
          screenshotKey: 'developer/explorer-step-3',
        },
        {
          number: 4,
          title: 'Send the request',
          description:
            'Click "Send Request". The explorer executes the API call against your sandbox or production environment (selected via the environment toggle). The response panel shows the status code, headers, and formatted JSON body.',
          screenshotKey: 'developer/explorer-step-4',
          tip: 'Always test against a sandbox environment first to avoid modifying production data during development.',
        },
        {
          number: 5,
          title: 'Generate code snippets',
          description:
            'Click "Code" to generate ready-to-use code snippets for the current request in JavaScript (fetch/axios), Python (requests), Ruby (Net::HTTP), Go (net/http), and cURL. Copy the snippet directly into your integration code.',
          screenshotKey: 'developer/explorer-step-5',
        },
      ],
    },
  ],

  faqs: [
    {
      question: 'What are the API rate limits?',
      answer:
        'The default rate limit is 100 requests per minute per API key. Burst allowance permits up to 20 additional requests in a 10-second window. If you need higher limits, contact support to upgrade to a higher tier. Rate limit headers (X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset) are included in every response.',
    },
    {
      question: 'Is the API versioned?',
      answer:
        'Yes. The API uses URL-based versioning (e.g., /api/v1/employees). When a breaking change is introduced, a new version is released. Previous versions are supported for at least 12 months after deprecation notice. The current stable version is v1.',
    },
    {
      question: 'How do I debug failed webhook deliveries?',
      answer:
        'Navigate to Webhooks and click on the webhook subscription. The "Delivery Log" tab shows every delivery attempt with the request payload, response status, response body, and latency. Failed deliveries include the error message and retry schedule.',
    },
    {
      question: 'Can I use the API to create custom reports?',
      answer:
        'Yes. Use the /api/v1/reports endpoint to query data across modules with filters, grouping, and aggregations. The response can be formatted as JSON or CSV. For complex reports, use the Analytics module\'s API which supports SQL-like query syntax.',
    },
    {
      question: 'What authentication methods does the API support?',
      answer:
        'The API supports three authentication methods: API keys (passed in the Authorization header as Bearer tokens), OAuth 2.0 access tokens (for third-party applications), and session cookies (for requests made from the Tempo web interface).',
    },
    {
      question: 'Is there a GraphQL API?',
      answer:
        'Not currently. Tempo provides a REST API with comprehensive filtering and field selection via query parameters. You can use the "fields" parameter on most endpoints to request only the data you need, reducing payload size and improving performance.',
    },
  ],

  tips: [
    'Use the API Explorer to prototype requests before writing integration code. It generates ready-to-use code snippets.',
    'Rotate API keys every 90 days and revoke keys that are no longer in use to maintain security hygiene.',
    'Implement webhook signature verification on your endpoint to ensure payloads are genuine and unmodified.',
    'Use the sandbox environment for development and testing to avoid polluting production data.',
    'Subscribe to the "api.changelog" webhook event to receive notifications when new API versions or endpoints are released.',
    'Monitor the Developer Hub analytics dashboard weekly to track error rates and catch integration issues early.',
  ],

  relatedModules: ['sandbox', 'app-studio', 'automation', 'settings'],

  permissions: [
    {
      role: 'Owner',
      capabilities: [
        'Create and manage API keys with any permission scope',
        'Register and configure OAuth applications',
        'Create and manage webhook subscriptions',
        'Access the API Explorer and developer documentation',
        'View API usage analytics and request logs',
        'Configure organization-wide rate limits and API policies',
      ],
    },
    {
      role: 'Admin',
      capabilities: [
        'Create and manage API keys with scoped permissions',
        'Register and configure OAuth applications',
        'Create and manage webhook subscriptions',
        'Access the API Explorer and developer documentation',
        'View API usage analytics and request logs',
      ],
    },
    {
      role: 'HRBP',
      capabilities: [
        'View developer documentation and API reference',
        'Access the API Explorer in read-only sandbox mode',
      ],
    },
    {
      role: 'Employee',
      capabilities: [
        'View personal API tokens if enabled by the administrator',
        'Access public developer documentation',
      ],
    },
  ],
}

export default developer
