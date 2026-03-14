# Tempo Platform API Reference

Base URL: `https://<your-domain>/api`

All API endpoints require authentication via httpOnly session cookie (`tempo_session`) unless marked as **Public**. The middleware injects `x-org-id`, `x-employee-id`, and `x-employee-role` headers from the JWT token.

---

## Table of Contents

- [Authentication](#authentication)
- [Admin Authentication](#admin-authentication)
- [SSO & MFA](#sso--mfa)
- [Employees](#employees)
- [Module Data (Generic)](#module-data-generic)
- [Bulk Data](#bulk-data)
- [Payroll](#payroll)
- [Chat](#chat)
- [Expenses](#expenses)
- [Billing](#billing)
- [Notifications](#notifications)
- [Audit Log](#audit-log)
- [Search](#search)
- [SCIM Provisioning](#scim-provisioning)
- [Webhooks](#webhooks)
- [GDPR](#gdpr)
- [File Upload](#file-upload)
- [AI Insights](#ai-insights)
- [Health Check](#health-check)
- [Domain-Specific Endpoints](#domain-specific-endpoints)

---

## Error Response Format

All endpoints return errors in this format:

```json
{
  "error": "Human-readable error message"
}
```

Common HTTP status codes:
- `400` - Bad request (missing/invalid parameters)
- `401` - Unauthorized (missing or expired session)
- `403` - Forbidden (insufficient role permissions)
- `404` - Resource not found
- `409` - Conflict (e.g., duplicate email)
- `500` - Internal server error
- `503` - Service unavailable (e.g., Stripe not configured)

---

## Authentication

### POST /api/auth

Action-based endpoint for all authentication operations.

#### Login

```bash
curl -X POST /api/auth \
  -H "Content-Type: application/json" \
  -d '{"action": "login", "email": "user@example.com", "password": "password123"}'
```

**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| action | string | Yes | `"login"` |
| email | string | Yes | Employee email |
| password | string | Yes | Password |

**Response (200):**
```json
{
  "user": {
    "id": "user-uuid",
    "email": "user@example.com",
    "full_name": "Jane Doe",
    "avatar_url": "https://...",
    "role": "admin",
    "department_id": "uuid",
    "employee_id": "uuid",
    "job_title": "HR Manager",
    "department_name": "Human Resources"
  }
}
```

Sets `tempo_session` httpOnly cookie.

**Response (MFA required):**
```json
{
  "requiresMFA": true,
  "mfaToken": "temporary-jwt-token"
}
```

#### Verify MFA

```bash
curl -X POST /api/auth \
  -H "Content-Type: application/json" \
  -d '{"action": "verify_mfa", "mfaToken": "...", "code": "123456"}'
```

**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| action | string | Yes | `"verify_mfa"` |
| mfaToken | string | Yes | Temporary token from login |
| code | string | Yes | 6-digit TOTP code or backup code |

**Response (200):** Same as login success. Sets session cookie.

#### Logout

```bash
curl -X POST /api/auth \
  -H "Content-Type: application/json" \
  -d '{"action": "logout"}'
```

Revokes session in DB and clears session cookie.

#### Get Current User

```bash
curl -X POST /api/auth \
  -H "Content-Type: application/json" \
  -d '{"action": "me"}'
```

Returns the currently authenticated user from the session cookie.

#### Switch User

```bash
curl -X POST /api/auth \
  -H "Content-Type: application/json" \
  -d '{"action": "switch_user", "employeeId": "uuid"}'
```

**Auth:** Requires `owner` or `admin` role. Switches the active session to another employee within the same org.

#### Signup

```bash
curl -X POST /api/auth \
  -H "Content-Type: application/json" \
  -d '{
    "action": "signup",
    "fullName": "Jane Doe",
    "email": "jane@company.com",
    "password": "securepass123",
    "companyName": "Acme Corp",
    "industry": "Technology",
    "size": "50-100",
    "country": "US"
  }'
```

**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| action | string | Yes | `"signup"` |
| fullName | string | Yes | Full name |
| email | string | Yes | Email address |
| password | string | Yes | Min 8 characters |
| companyName | string | Yes | Organization name |
| industry | string | No | Industry vertical |
| size | string | No | Company size range |
| country | string | No | Country code |

**Response (201):**
```json
{
  "user": { ... },
  "org": { "id": "uuid", "name": "Acme Corp", "slug": "acme-corp-abc123" },
  "needsOnboarding": true
}
```

#### Get Demo Credentials

```bash
curl -X POST /api/auth \
  -H "Content-Type: application/json" \
  -d '{"action": "credentials"}'
```

Returns available demo login credentials. **Public.**

---

## Admin Authentication

### POST /api/admin/auth

Platform-level admin authentication (separate from org employees).

**Actions:** `login`, `logout`, `me`

```bash
curl -X POST /api/admin/auth \
  -H "Content-Type: application/json" \
  -d '{"action": "login", "email": "admin@tempo.app", "password": "..."}'
```

Sets `tempo_admin_session` cookie. Admin roles: `super_admin`, `support`, `viewer`.

### GET /api/admin/stats

Returns platform-wide statistics (org count, employee count, revenue).

### GET /api/admin/organizations

Lists all organizations with filtering and pagination.

### POST /api/admin/impersonate

Allows admins to impersonate an employee in an org (logged to `impersonation_log`).

---

## SSO & MFA

### GET /api/auth/sso/:provider

Initiates SSO flow. Supported providers: `google`, `azure`.

```bash
curl "https://app.tempo.com/api/auth/sso/google?org=acme-corp&returnUrl=/dashboard"
```

Redirects to provider's login page.

### GET /api/auth/sso/:provider/callback

OAuth callback handler. Processes the authorization code and creates a session.

### POST /api/auth/sso/:provider

Lists available SSO providers for an organization.

```bash
curl -X POST /api/auth/sso/google \
  -H "Content-Type: application/json" \
  -d '{"orgId": "uuid"}'
```

### POST /api/auth/mfa

MFA management (requires active session).

**Actions:**
- `enroll` - Generate TOTP secret and QR code URI
- `verify` - Confirm enrollment with first TOTP code
- `disable` - Remove MFA (requires password confirmation)
- `regenerate-backup-codes` - Generate new backup codes

### POST /api/auth/reset-password

Password reset request and confirmation.

### POST /api/auth/verify-email

Email verification token validation.

---

## Employees

### POST /api/employees/invite

Invite employees by email. **Auth:** `owner` or `admin` only.

```bash
curl -X POST /api/employees/invite \
  -H "Content-Type: application/json" \
  -d '{"emails": ["new@example.com", "other@example.com"], "role": "employee"}'
```

**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| emails | string[] | Yes | Array of emails (max 50) |
| role | string | No | Default: `"employee"`. Options: `owner`, `admin`, `hrbp`, `manager`, `employee` |

**Response (200):**
```json
{
  "ok": true,
  "invited": 2,
  "total": 2,
  "results": [
    { "email": "new@example.com", "status": "invited" },
    { "email": "existing@example.com", "status": "already_exists" }
  ]
}
```

### POST /api/employees/accept-invite

Accept an invitation token and set up account.

### GET /api/employees/directory

Employee directory with search and filtering.

---

## Module Data (Generic)

### GET /api/data/:module

Lazy per-module data loading with pagination. Replaces monolithic data endpoint.

```bash
curl "/api/data/employees?page=1&limit=50"
```

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | varies | Items per page (max 200) |
| search | string | - | Search filter |

**Response (200):**
```json
{
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 234,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  }
}
```

**Available modules (125+):**

| Category | Module Slugs |
|----------|-------------|
| Core | `employees`, `departments` |
| Performance | `goals`, `review-cycles`, `reviews`, `feedback` |
| Compensation | `comp-bands`, `salary-reviews`, `equity-grants`, `comp-planning-cycles` |
| Learning | `courses`, `enrollments` |
| Engagement | `surveys`, `engagement-scores`, `action-plans`, `survey-templates`, `survey-schedules`, `survey-triggers`, `open-ended-responses` |
| Mentoring | `mentoring-programs`, `mentoring-pairs`, `mentoring-sessions`, `mentoring-goals` |
| Payroll | `payroll-runs`, `employee-payroll-entries`, `contractor-payments`, `payroll-schedules`, `tax-configs`, `tax-filings`, `payroll-approvals`, `payroll-approval-config`, `payroll-audit-log` |
| Time & Attendance | `leave-requests`, `time-entries`, `time-off-policies`, `time-off-balances`, `overtime-rules`, `shifts` |
| Benefits | `benefit-plans`, `benefit-enrollments`, `benefit-dependents`, `life-events`, `open-enrollment-periods`, `cobra-events`, `aca-tracking`, `flex-benefit-accounts`, `flex-benefit-transactions` |
| Expense | `expense-reports`, `expense-policies`, `mileage-logs`, `mileage-entries`, `receipt-matches`, `advanced-expense-policies`, `reimbursement-batches`, `duplicate-detections` |
| Recruiting | `job-postings`, `applications` |
| IT | `devices`, `software-licenses`, `it-requests`, `managed-devices`, `device-actions`, `app-catalog`, `app-assignments`, `security-policies`, `device-inventory`, `device-store-catalog`, `device-orders` |
| Finance | `invoices`, `budgets`, `vendors`, `corporate-cards`, `card-transactions`, `bill-payments`, `bill-pay-schedules`, `currency-accounts`, `fx-transactions` |
| Strategy | `strategic-objectives`, `key-results`, `initiatives`, `kpi-definitions`, `kpi-measurements` |
| Projects | `projects`, `milestones`, `tasks` |
| Workflows | `workflows`, `workflow-templates`, `workflow-steps`, `workflow-runs`, `automation-workflows`, `automation-workflow-steps`, `automation-workflow-runs` |
| Identity | `idp-configurations`, `saml-apps`, `mfa-policies`, `scim-providers`, `provisioning-rules`, `encryption-policies` |
| Chat | `chat-channels`, `chat-messages` |
| Travel | `travel-requests`, `travel-bookings`, `travel-policies` |
| Documents | `signature-documents`, `signature-templates` |
| Groups | `dynamic-groups` |
| Password Manager | `password-vaults`, `vault-items` |
| Compliance | `compliance-requirements`, `compliance-documents`, `compliance-alerts` |
| Onboarding | `buddy-assignments`, `preboarding-tasks` |
| Offboarding | `offboarding-checklists`, `offboarding-processes`, `offboarding-tasks`, `exit-surveys`, `offboarding-checklist-items` |
| Headcount | `headcount-plans`, `headcount-positions`, `headcount-budget-items` |
| Global Workforce | `eor-entities`, `eor-employees`, `eor-contracts`, `cor-contractors`, `cor-contracts`, `cor-payments`, `peo-configurations`, `co-employment-records`, `global-benefit-plans`, `country-benefit-configs` |
| Workers' Comp | `workers-comp-policies`, `workers-comp-claims`, `workers-comp-class-codes`, `workers-comp-audits` |
| App Studio | `custom-apps`, `app-pages`, `app-components`, `app-data-sources` |
| Sandbox | `sandbox-environments` |
| Audit | `audit-log` |

All data is scoped to the authenticated org via `org_id` filtering (RLS).

---

## Bulk Data

### GET /api/data

Legacy monolithic data endpoint. Use `/api/data/:module` instead.

---

## Payroll

### GET /api/payroll

Query payroll data by action.

**Actions:**

| Action | Query Params | Description |
|--------|-------------|-------------|
| `analytics` | - | Org-wide payroll analytics |
| `compliance` | - | Compliance validation results |
| `tax-filings` | `countries` (comma-separated) | Tax filing requirements |
| `calculate-tax` | `country`, `salary`, `state?`, `filingStatus?` | Calculate tax breakdown |
| `convert` | `amount`, `from`, `to` | Currency conversion |
| `entries` | `payrollRunId` | Entries for a specific payroll run |
| `employee-history` | `employeeId` | Payroll history for an employee |
| `employee-countries` | - | Distinct countries of active employees |
| `currency-map` | - | Country-to-currency mapping |
| `bank-file-preview` | `payrollRunId` | Preview bank file inclusion/exclusion |
| `bank-file` | `payrollRunId`, `format?` | Export bank payment file |
| `validate-run` | `country`, `period?` | Validate eligible employees for a run |
| `reconciliation` | `payrollRunId` | Reconciliation report |
| `tax-certificate` | `employeeId`, `year` | Tax certificate data |
| `year-end-summary` | `employeeId`, `year` | Year-end summary |
| `audit-trail` | `payrollRunId` | Audit trail for a payroll run |

```bash
curl "/api/payroll?action=analytics"
curl "/api/payroll?action=calculate-tax&country=NG&salary=5000000"
```

### POST /api/payroll

Process and manage payroll runs.

**Actions:**

| Action | Body Fields | Description |
|--------|------------|-------------|
| `process` | `country`, `period?` | Create a new payroll run |
| `submit` | `payrollRunId` | Submit for approval |
| `approve-hr` | `payrollRunId`, `approverId`, `comment?` | HR approval |
| `approve-finance` | `payrollRunId`, `approverId`, `comment?` | Finance approval |
| `approve` | `payrollRunId`, `approverId` | Legacy single-step approval |
| `reject` | `payrollRunId`, `rejectedBy`, `reason` | Reject a run |
| `mark-processing` | `payrollRunId` | Mark as processing |
| `mark-paid` | `payrollRunId`, `paymentReference?` | Mark as paid |
| `cancel` | `payrollRunId`, `reason?` | Cancel a run |
| `pay-stub` | `employeeId`, `payrollRunId` | Generate individual pay stub |
| `update-tax-config` | `configId`, fields... | Update tax configuration |

```bash
curl -X POST /api/payroll \
  -H "Content-Type: application/json" \
  -d '{"action": "process", "country": "NG", "period": "March 2026"}'
```

### GET /api/payroll/pay-stub-pdf

Generate pay stub as PDF. Query params: `employeeId`, `payrollRunId`.

---

## Chat

### GET /api/chat

```bash
curl "/api/chat?action=channels&employeeId=uuid"
curl "/api/chat?action=messages&channelId=uuid&employeeId=uuid&limit=50"
curl "/api/chat?action=search&employeeId=uuid&query=budget"
curl "/api/chat?action=unread&employeeId=uuid"
curl "/api/chat?action=analytics&channelId=uuid"
```

**Actions:**
| Action | Required Params | Description |
|--------|----------------|-------------|
| `channels` | `employeeId`, `type?` | List channels |
| `messages` | `channelId`, `employeeId`, `limit?`, `before?`, `threadId?` | Get messages |
| `search` | `employeeId`, `query`, `channelId?`, `limit?`, `offset?` | Search messages |
| `unread` | `employeeId` | Get unread count |
| `analytics` | `channelId` | Channel analytics |

### POST /api/chat

**Actions:**
| Action | Required Fields | Description |
|--------|----------------|-------------|
| `create-channel` | `createdBy`, `type`, `memberIds`, `name?`, `description?` | Create channel |
| `create-announcement` | `createdBy`, `name`, `memberIds`, `adminIds?` | Create announcement channel |
| `send-message` | `channelId`, `senderId`, `content?`, `type?` | Send message (supports files, mentions) |
| `create-thread` | `parentMessageId`, `senderId`, `content` | Start a thread |
| `add-reaction` | `messageId`, `employeeId`, `emoji` | Add emoji reaction |
| `remove-reaction` | `messageId`, `employeeId`, `emoji` | Remove reaction |
| `pin-message` | `messageId`, `pinnedBy`, `pin` | Pin/unpin message |
| `edit-message` | `messageId`, `senderId`, `content` | Edit message |
| `delete-message` | `messageId`, `senderId` | Delete message |
| `add-participant` | `channelId`, `employeeId`, `addedBy` | Add member |
| `remove-participant` | `channelId`, `employeeId` | Remove member |
| `mute-channel` | `channelId`, `employeeId`, `muted` | Mute/unmute |
| `mark-read` | `channelId`, `employeeId`, `messageId` | Mark as read |

### GET /api/chat/stream

Server-sent events (SSE) stream for real-time chat updates.

---

## Expenses

### GET /api/expenses

**Actions:**
| Action | Params | Description |
|--------|--------|-------------|
| `my-reports` | `employeeId` | Get employee's expense reports with items |
| `pending-approvals` | `managerId` | Reports pending manager approval |
| `analytics` | - | Expense analytics |

### POST /api/expenses

**Actions:**
| Action | Fields | Description |
|--------|--------|-------------|
| `create-report` | `title`, `items[]` | Create expense report |
| `submit-report` | `reportId` | Submit for approval |
| `approve-report` | `reportId` | Approve report |
| `reject-report` | `reportId`, `reason` | Reject report |
| `ocr-receipt` | `receiptUrl` | Extract data via Claude Vision AI |

---

## Billing

### POST /api/billing

Stripe integration for subscription management.

**Actions:**
| Action | Fields | Description |
|--------|--------|-------------|
| `create-checkout` | `plan` (`starter`/`professional`/`enterprise`) | Create Stripe checkout session |
| `customer-portal` | - | Create Stripe billing portal session |
| `subscription` | - | Get current subscription details |
| `usage` | - | Get current usage metrics |

### POST /api/billing/webhook

Stripe webhook handler. Handles events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`.

---

## Notifications

### GET /api/notifications

```bash
curl "/api/notifications"
curl "/api/notifications?action=count"
curl "/api/notifications?unread=true&limit=20"
```

### POST /api/notifications

**Actions:**
| Action | Fields | Description |
|--------|--------|-------------|
| `mark_read` | `notificationId` | Mark single as read |
| `mark_all_read` | - | Mark all as read |
| `send` | `recipientId`, `title`, `message`, `type?`, `channel?` | Send notification (admin/owner only) |

### POST /api/notifications/dispatch

Internal notification dispatch with multi-channel support (in-app, email, Slack).

---

## Audit Log

### GET /api/audit

```bash
curl "/api/audit?action=create&entityType=employee&page=1&limit=50"
```

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| action | string | Filter by action: `create`, `update`, `delete`, `login`, `logout`, `approve`, `reject` |
| entityType | string | Filter by entity type |
| userId | string | Filter by user |
| startDate | string | ISO date start |
| endDate | string | ISO date end |
| page | number | Page (default 1) |
| limit | number | Items per page (max 100) |

---

## Search

### GET /api/search

Global search across multiple entity types.

```bash
curl "/api/search?q=engineering&type=all&limit=20"
```

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| q | string | Search query (min 2 chars) |
| type | string | `all`, `employees`, `goals`, `projects`, `courses`, `jobs`, `objectives`, `workflows`, `policies`, `leave`, `expenses` |
| limit | number | Max results (default 20, max 50) |

---

## SCIM Provisioning

### GET /api/scim/v2/Users

List users (SCIM 2.0 compliant). Auth: Bearer token.

```bash
curl "/api/scim/v2/Users?startIndex=1&count=100&filter=userName eq user@example.com" \
  -H "Authorization: Bearer scim-token"
```

### POST /api/scim/v2/Users

Create user via SCIM.

### GET /api/scim/v2/Users/:id

Get single user by ID.

### PUT /api/scim/v2/Users/:id

Replace user (full update).

### PATCH /api/scim/v2/Users/:id

Partial update user.

### DELETE /api/scim/v2/Users/:id

Deactivate user.

---

## Webhooks

### GET /api/webhooks

**Actions:**
| Action | Params | Description |
|--------|--------|-------------|
| (none) | - | List available triggers and actions |
| `delivery-logs` | `endpointId?`, `limit?` | Delivery log history |
| `endpoint-health` | `endpointId` | Endpoint health status |
| `stats` | - | Webhook delivery statistics |
| `retry-queue` | - | View pending retries |
| `circuit-breaker` | `endpointId` | Circuit breaker state |

### POST /api/webhooks

**Actions:** `process` (trigger webhook), `retry` (retry failed delivery).

---

## GDPR

### POST /api/gdpr

Data subject requests (GDPR Art. 15, 17, 20).

**Actions:**
| Action | Description |
|--------|-------------|
| `export` | Export all personal data for the authenticated employee |
| `delete` | Request data deletion (right to be forgotten) |

---

## File Upload

### POST /api/upload

Upload a file (multipart form data). Max 10MB.

**Allowed MIME types:** PDF, JPEG, PNG, WebP, GIF, Word, Excel, CSV.

```bash
curl -X POST /api/upload \
  -F "file=@receipt.pdf" \
  -F "entityType=expense" \
  -F "entityId=uuid"
```

### GET /api/upload/file/:key

Retrieve an uploaded file by storage key.

---

## AI Insights

### POST /api/ai

Proxy to Anthropic Claude for AI-enhanced analytics. Rate limited: 10 requests/minute per org.

**Actions:**
| Action | Description |
|--------|-------------|
| `enhanceNarrative` | Generate executive workforce summary |
| `enhanceSentiment` | Analyze employee feedback sentiment |
| `enhanceGoalScore` | Score goals against SMART criteria |
| `enhanceBiasDetection` | Detect rating bias in reviews |
| `enhanceCareerPath` | Suggest career progression paths |
| `enhanceQuery` | Natural language data queries |

---

## Health Check

### GET /api/health

**Public.** No authentication required.

```bash
curl /api/health
```

**Response (200):**
```json
{
  "status": "ok",
  "timestamp": "2026-03-14T12:00:00.000Z",
  "uptime": 3600,
  "version": "1.0.0",
  "totalLatencyMs": 15,
  "checks": {
    "database": { "status": "ok", "latencyMs": 12 },
    "config": { "status": "ok" },
    "stripe": { "status": "ok" },
    "email": { "status": "ok" },
    "storage": { "status": "ok" }
  }
}
```

---

## Domain-Specific Endpoints

These endpoints follow the same action-based pattern as above, with GET for queries and POST for mutations:

| Endpoint | Description |
|----------|-------------|
| `GET/POST /api/onboarding` | Onboarding workflows and task management |
| `GET/POST /api/offboarding` | Offboarding process management |
| `GET/POST /api/time-attendance` | Clock in/out, shift management |
| `GET/POST /api/benefits` | Benefit plan management, enrollment |
| `GET/POST /api/recruiting` | ATS operations, pipeline management |
| `GET/POST /api/learning` | Course management, enrollment tracking |
| `GET/POST /api/compliance` | Compliance requirement tracking |
| `GET/POST /api/travel` | Travel request and booking management |
| `GET/POST /api/corporate-cards` | Corporate card management |
| `GET/POST /api/bill-pay` | Bill payment processing |
| `GET/POST /api/multi-currency` | Multi-currency account management |
| `GET/POST /api/identity-provider` | IdP configuration management |
| `GET/POST /api/it-cloud` | IT device and policy management |
| `GET/POST /api/geofencing` | Geofencing and location policies |
| `GET/POST /api/zero-touch` | Zero-touch device deployment |
| `GET/POST /api/carrier-integrations` | Carrier/benefits integrations |
| `GET/POST /api/password-manager` | Password vault management |
| `GET/POST /api/device-store` | Internal device store catalog |
| `GET/POST /api/e-signatures` | Electronic signature workflows |
| `GET/POST /api/i9-everify` | I-9 and E-Verify management |
| `GET/POST /api/eor` | Employer of Record operations |
| `GET/POST /api/cor` | Contractor of Record operations |
| `GET/POST /api/peo` | Professional Employer Organization |
| `GET/POST /api/global-benefits` | Global benefits administration |
| `GET/POST /api/retirement` | Retirement plan management |
| `GET/POST /api/headcount` | Headcount planning |
| `GET/POST /api/app-studio` | Custom app builder |
| `GET/POST /api/sandbox` | Sandbox environment management |
| `GET/POST /api/rql` | Report Query Language engine |
| `GET/POST /api/workflow` | Workflow execution engine |
| `GET/POST /api/analytics` | Analytics and reporting |
| `GET/POST /api/devices` | Device management |
| `GET/POST /api/integrations` | Third-party integrations |
| `GET /api/integrations/slack/callback` | Slack OAuth callback |
| `POST /api/integrations/slack/events` | Slack events webhook |
| `GET /api/integrations/quickbooks/callback` | QuickBooks OAuth callback |
| `GET/POST /api/developer` | Developer portal and API keys |
| `GET/POST /api/marketplace` | Module marketplace |
| `GET/POST /api/platform` | Platform configuration |
| `GET/POST /api/payments` | Payment processing |
| `GET /api/jobs` | Public job listings |
| `GET /api/video-screens` | Video screening management |
| `GET /api/interview-recordings` | Interview recording management |
| `GET /api/docs` | API documentation (OpenAPI) |
| `GET /api/docs/v2` | API documentation v2 |
| `GET /api/help/pdf` | Help article PDF export |
| `GET /api/cron/sync-integrations` | Cron job for integration sync (requires `CRON_SECRET`) |

---

## Rate Limiting

Rate limits are enforced in middleware:

| Endpoint | Limit | Window |
|----------|-------|--------|
| `POST /api/auth` (login) | 10 requests | 15 minutes |
| `POST /api/admin/auth` (login) | 5 requests | 15 minutes |
| `POST /api/auth/reset-password` | 5 requests | 15 minutes |
| All other API routes | 100 requests | 1 minute |
| `POST /api/ai` | 10 requests | 1 minute |

Rate limiting uses Upstash Redis in production, in-memory fallback in development.
