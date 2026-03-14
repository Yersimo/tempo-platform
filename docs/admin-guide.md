# Tempo Platform -- Admin Guide

## Table of Contents

1. [Getting Started](#getting-started)
2. [Deployment](#deployment)
3. [Environment Variables](#environment-variables)
4. [First-Time Setup](#first-time-setup)
5. [User Management](#user-management)
6. [Payroll Setup](#payroll-setup)
7. [SSO / SAML Configuration](#sso--saml-configuration)
8. [Billing and Subscriptions](#billing-and-subscriptions)
9. [Data Import and Export](#data-import-and-export)
10. [Platform Administration](#platform-administration)
11. [Troubleshooting](#troubleshooting)

---

## Getting Started

Tempo is a Next.js 16 application backed by Neon PostgreSQL (serverless Postgres). It uses Drizzle ORM for schema management and JWT-based authentication with httpOnly cookies.

### System Requirements

| Component | Requirement |
|---|---|
| Node.js | 20.x or later |
| Package manager | npm (ships with Node) |
| Database | Neon PostgreSQL (or any PostgreSQL 15+) |
| Redis (optional) | Upstash Redis for production rate limiting |
| Email (optional) | Resend or SendGrid account |
| Payments (optional) | Stripe account |
| Object storage (optional) | S3-compatible bucket |

---

## Deployment

### 1. Clone and Install

```bash
git clone <repository-url> tempo-platform
cd tempo-platform
npm install
```

### 2. Configure Environment

Copy the example environment and fill in values (see the full reference below):

```bash
cp .env.example .env.local
```

### 3. Run Database Migrations

```bash
npx drizzle-kit push
```

This applies the schema defined in `src/lib/db/schema.ts` to your Neon database. Migration SQL files live in `drizzle/`:

| File | Purpose |
|---|---|
| `0000_funny_toad_men.sql` | Initial schema (all tables) |
| `0001_rls_policies.sql` | Row-Level Security policies |
| `0002_performance_indexes.sql` | Performance indexes |
| `0003_missing_tables.sql` | Additional tables added post-launch |
| `0004_ux_walkthrough_fixes.sql` | UX-related schema tweaks |

### 4. Build and Start

```bash
npm run build
npm start
```

For development with hot reload:

```bash
npm run dev -- --port 3002
```

---

## Environment Variables

### Required

| Variable | Description |
|---|---|
| `DATABASE_URL` | Neon PostgreSQL connection string. Format: `postgresql://user:pass@host/db?sslmode=require` |
| `JWT_SECRET` | Secret key for signing session JWTs. Must be set in production. In development, defaults to a built-in dev secret. |

### Authentication and SSO

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_APP_URL` | Public URL of the app (e.g. `https://tempo.example.com`). Used for OAuth redirect URIs, invitation links, and Stripe return URLs. |

### Email

| Variable | Description |
|---|---|
| `RESEND_API_KEY` | API key for Resend email service (primary) |
| `SENDGRID_API_KEY` | API key for SendGrid (fallback) |
| `EMAIL_FROM` | Sender address for system emails (e.g. `noreply@tempo.example.com`) |

### Payments (Stripe)

| Variable | Description |
|---|---|
| `STRIPE_SECRET_KEY` | Stripe secret API key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `STRIPE_STARTER_PRICE_ID` | Stripe Price ID for the Starter plan |
| `STRIPE_PROFESSIONAL_PRICE_ID` | Stripe Price ID for the Professional plan |
| `STRIPE_ENTERPRISE_PRICE_ID` | Stripe Price ID for the Enterprise plan |

### Rate Limiting (Upstash Redis)

| Variable | Description |
|---|---|
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST API URL |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis REST API token |

When these are not set, rate limiting falls back to in-memory (suitable for development, not for multi-instance production).

### Object Storage (S3)

| Variable | Description |
|---|---|
| `S3_ACCESS_KEY_ID` | S3-compatible access key |
| `S3_SECRET_ACCESS_KEY` | S3-compatible secret key |
| `S3_BUCKET` | Bucket name for file uploads |
| `S3_REGION` | Bucket region |
| `S3_ENDPOINT` | Custom endpoint URL (for non-AWS S3-compatible providers) |
| `S3_PUBLIC_URL` | Public URL prefix for stored files |
| `UPLOAD_DIR` | Local fallback upload directory (development only) |

### AI Features

| Variable | Description |
|---|---|
| `ANTHROPIC_API_KEY` | Anthropic API key for Claude-powered features (receipt OCR, AI chat assistant) |

### Integrations

| Variable | Description |
|---|---|
| `QUICKBOOKS_CLIENT_ID` | QuickBooks OAuth client ID |
| `QUICKBOOKS_CLIENT_SECRET` | QuickBooks OAuth client secret |

### Monitoring

| Variable | Description |
|---|---|
| `SENTRY_DSN` | Sentry DSN for server-side error tracking |
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry DSN for client-side error tracking |
| `LOG_LEVEL` | Logging verbosity (`debug`, `info`, `warn`, `error`) |

### Scheduled Tasks

| Variable | Description |
|---|---|
| `CRON_SECRET` | Secret token to authenticate cron job HTTP calls |

---

## First-Time Setup

### 1. Create the First Organization

After deploying and running migrations, sign up through the UI at `/signup`. This creates:

- A new organization record
- The first employee record with `owner` role
- Seed data for the organization (departments, default settings)

The `seedNewOrg()` function in `src/lib/org-seed.ts` runs automatically on signup to populate initial departments, default leave policies, and other baseline data.

### 2. Platform Admin Access

Platform-level administration (cross-org management) uses a separate authentication system from the main employee login.

- Admin login page: `/admin/login`
- Admin session cookie: `tempo_admin_session` (separate from `tempo_session`)
- Admin roles: stored in the `platform_admins` table

Platform admin credentials are checked against the `platform_admins` table. In demo mode, hardcoded demo admin credentials are accepted as a fallback.

### 3. Verify Health

Hit the health endpoint to confirm all services are connected:

```bash
curl https://your-domain.com/api/health
```

Response includes status checks for: database, configuration, Stripe, email provider, and storage.

---

## User Management

### Roles

Tempo uses five employee roles, in descending order of privilege:

| Role | Capabilities |
|---|---|
| `owner` | Full access. Can manage billing, SSO, delete the org. Only role that can promote others to admin. |
| `admin` | Can invite/remove employees, manage settings, approve payroll, configure integrations. |
| `hrbp` | HR Business Partner. Can view all employee data, manage reviews, handle leave approvals. |
| `manager` | Can view direct reports, approve leave/expenses for their team, manage team goals. |
| `employee` | Standard access. Can view own data, submit leave/expenses, complete reviews. |

Role checks are enforced at two levels:
1. **Middleware**: The `x-employee-role` header is set from the JWT and available to all API routes.
2. **API routes**: Individual endpoints check the role header to authorize actions.

### Inviting Employees

Owners and admins can invite new employees via `POST /api/employees/invite`:

- Accepts up to 50 email addresses per request
- Each invite generates a JWT token valid for 7 days
- Creates an inactive employee record (activated when the invite is accepted)
- Sends an invitation email via Resend/SendGrid
- All invitations are recorded in the audit log

### Deactivating Employees

Set `isActive: false` on the employee record. Deactivated employees cannot log in (session validation checks active status). Their data is preserved for audit and reporting purposes.

### GDPR Data Requests

Employees can exercise their GDPR rights via `POST /api/gdpr`:

- **Data Export** (`action: "export"`): Returns a JSON file containing all personal data (profile, goals, reviews, feedback, leave, compensation, enrollments).
- **Data Deletion** (`action: "delete"`): Anonymizes personal data (name set to "[Deleted User]", email redacted, phone/avatar cleared). Preserves referential integrity and retains audit records per legal requirements.

Only the employee themselves or an owner/admin can request deletion of another employee's data.

---

## Payroll Setup

### Supported Countries

| Country | Code | Currency | Tax System |
|---|---|---|---|
| Nigeria | NG | NGN | PAYE, pension, NHF, NHIS |
| Kenya | KE | KES | PAYE, NHIF, NSSF, housing levy |
| Ghana | GH | GHS | PAYE, SSNIT, tier 2/3 |
| United States | US | USD | Federal + state income tax, FICA |
| United Kingdom | GB | GBP | PAYE, NIC, pension auto-enrolment |

### Tax Configuration

Tax configurations are stored in the `payroll_tax_configs` table and cached per country. Each config includes:

- Country code and tax year
- Tax brackets (progressive rates)
- Pension, health insurance, and social security rates
- Filing requirements and deadlines

Use `POST /api/payroll` with `action: "update-tax-config"` to update tax rates for a country. The cache is invalidated automatically after updates.

### Payroll Approval Workflow

Payroll runs follow a multi-step approval flow:

1. **Draft** -- Created via `action: "process"` with country and period
2. **Submitted** -- Sent for approval via `action: "submit"`
3. **HR Approved** -- HR signs off via `action: "approve-hr"`
4. **Finance Approved** -- Finance signs off via `action: "approve-finance"`
5. **Processing** -- Marked as being executed via `action: "mark-processing"`
6. **Paid** -- Marked complete via `action: "mark-paid"`

At any point before payment, a run can be rejected (`action: "reject"`) or cancelled (`action: "cancel"`).

### Bank Payment Files

After approval, generate bank payment files via `GET /api/payroll?action=bank-file&payrollRunId=...&format=csv`. Supported formats depend on the country and banking partner.

### Tax Forms and Certificates

Generate country-specific tax documents:

- **Nigeria**: H1 annual tax form (PDF)
- **Kenya**: P9 tax deduction card (PDF)
- **Ghana**: PAYE certificate (PDF)

Use `GET /api/payroll?action=tax-certificate&employeeId=...&year=...` for individual certificates or `?action=year-end-summary` for organization-wide summaries.

### Currency Conversion

Convert between supported currencies via `GET /api/payroll?action=convert&amount=1000&from=NGN&to=USD`.

---

## SSO / SAML Configuration

### Supported Providers

| Provider | Protocol | Endpoint |
|---|---|---|
| Google Workspace | OIDC (OAuth 2.0) | `GET /api/auth/sso/google?org=<org-id>` |
| Azure AD | OIDC (OAuth 2.0) | `GET /api/auth/sso/azure?org=<org-id>` |

### Setup Process

1. **Register an OAuth application** with your identity provider (Google Cloud Console or Azure Portal).
2. **Set the redirect URI** to `https://your-domain.com/api/auth/sso/<provider>/callback`.
3. **Store the SSO configuration** in the `sso_providers` table for your organization, including:
   - `provider` (google or azure)
   - `clientId` and `clientSecret`
   - `tenantId` (Azure only)
   - `allowedDomains` (restrict login to specific email domains)
4. **Test the flow** by navigating to `/api/auth/sso/google?org=<your-org-id>`.

### SSO Login Flow

1. User clicks "Sign in with Google/Azure" on the login page
2. Redirected to the provider's consent screen
3. Provider redirects back to `/api/auth/sso/<provider>/callback` with an authorization code
4. Callback exchanges code for tokens, validates the email against the org's allowed domains
5. Creates or matches an employee record, issues a session JWT

### Listing Available Providers

`POST /api/auth/sso/<provider>` with `{ "orgId": "..." }` returns the configured SSO providers for an organization.

### Multi-Factor Authentication (MFA)

MFA is available as an additional security layer on top of password or SSO login:

1. **Enroll**: `POST /api/auth/mfa` with `action: "enroll"` returns a TOTP secret and QR code URI for authenticator apps.
2. **Verify enrollment**: `POST /api/auth/mfa` with `action: "verify_enrollment"` and a 6-digit code confirms setup.
3. **Login with MFA**: After password verification, if MFA is enabled the login returns `requiresMFA: true` with a short-lived MFA token (5-minute expiry). Submit the TOTP code via `action: "verify_mfa"` to receive the full session.
4. **Disable**: Requires password confirmation.
5. **Backup codes**: Generated during enrollment, can be regenerated (requires password).

### SCIM 2.0 Provisioning

Tempo supports SCIM 2.0 for automated user provisioning from identity providers:

- **List users**: `GET /api/scim/v2/Users`
- **Create user**: `POST /api/scim/v2/Users`
- Authentication: Bearer token in the `Authorization` header
- Content type: `application/scim+json`

SCIM enables automatic user creation/deactivation when employees are added or removed in your identity provider.

---

## Billing and Subscriptions

### Plans

| Plan | Stripe Price ID Env Var |
|---|---|
| Starter | `STRIPE_STARTER_PRICE_ID` |
| Professional | `STRIPE_PROFESSIONAL_PRICE_ID` |
| Enterprise | `STRIPE_ENTERPRISE_PRICE_ID` |

### Checkout Flow

1. Call `POST /api/billing` with `action: "create-checkout"` and `plan: "starter"` (or professional/enterprise).
2. The API creates or retrieves a Stripe customer for the organization.
3. Returns a Stripe Checkout URL. Redirect the user to complete payment.
4. On success, Stripe redirects to `/settings?billing=success&plan=<plan>`.
5. The webhook at `POST /api/billing/webhook` processes `checkout.session.completed` and updates the org's plan.

### Customer Portal

Call `POST /api/billing` with `action: "customer-portal"` to get a Stripe Customer Portal URL. This allows customers to:

- Update payment methods
- View invoice history
- Cancel or change subscriptions

### Subscription Status

Call `POST /api/billing` with `action: "subscription"` to check current subscription details including plan, status, period end date, and cancellation status.

### Webhook Events

The webhook handler at `/api/billing/webhook` processes:

| Event | Action |
|---|---|
| `checkout.session.completed` | Activates the subscription, updates org plan |
| `customer.subscription.updated` | Syncs plan changes |
| `customer.subscription.deleted` | Reverts org to free plan |

The webhook endpoint is in the `PUBLIC_ROUTES` list in middleware, so it does not require session authentication. It validates the Stripe webhook signature using `STRIPE_WEBHOOK_SECRET`.

---

## Data Import and Export

### Importing Data

Tempo supports bulk data operations through its API:

- **Employee import**: Use `POST /api/employees/invite` to batch-invite up to 50 employees at a time.
- **Module data**: Use `POST /api/data/<module>` to create records in any module table (goals, reviews, leave requests, etc.).

### Exporting Data

- **GDPR export**: `POST /api/gdpr` with `action: "export"` generates a complete personal data export for an employee.
- **Payroll reports**: Various export formats via `GET /api/payroll?action=...` (entries, tax certificates, bank files, reconciliation reports).
- **Audit log**: `GET /api/audit` with date range and entity type filters returns audit trail records.

### File Uploads

`POST /api/upload` handles file uploads with:

- Maximum file size: 10 MB
- MIME type validation (images, PDFs, common office formats)
- Storage: S3-compatible bucket (production) or local filesystem (development)

---

## Platform Administration

### Admin Panel

The platform admin panel at `/admin` is separate from per-org administration. It provides cross-organization management capabilities.

- **Access**: Requires `tempo_admin_session` cookie (separate auth flow)
- **Login**: `/admin/login`
- **Authentication**: Checked against `platform_admins` table
- **Rate limiting**: Admin login attempts are limited to 5 per 15 minutes per IP

### Admin API Routes

All `/api/admin/*` routes require a valid admin session. The middleware injects:

- `x-admin-id`: The platform admin's ID
- `x-admin-role`: The admin's role (e.g. `super_admin`)
- `x-admin-session-id`: The admin session identifier

---

## Troubleshooting

### Common Issues

#### "Invalid input syntax for type uuid"

**Cause**: A demo org (IDs like `org-1`) is hitting an API route that queries PostgreSQL with a non-UUID org ID.

**Fix**: The middleware has a demo org guard that intercepts these requests and returns empty JSON. If you see this error, a new API route may need to be added to the `DEMO_AWARE_ROUTES` list in `src/middleware.ts`.

#### "JWT_SECRET must be set in production"

**Cause**: The `JWT_SECRET` environment variable is not configured.

**Fix**: Set `JWT_SECRET` to a strong random string (at least 32 characters). In development, a built-in default is used automatically.

#### Rate Limiting in Development

**Cause**: Without Upstash Redis configured, rate limiting uses an in-memory store. This resets on every server restart and does not persist across instances.

**Fix**: For production, configure `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`. The system automatically falls back to in-memory when Redis is unavailable.

#### Sessions Expiring Unexpectedly

**Cause**: Sessions are JWT-based with a 7-day expiry. DB-backed sessions can also be explicitly revoked.

**Fix**: Check that `JWT_SECRET` has not changed between deployments (changing it invalidates all existing sessions). Verify the `sessions` table has not been cleared.

#### Stripe Webhooks Not Working

**Cause**: The webhook signing secret does not match, or the webhook URL is not configured in Stripe.

**Fix**:
1. Verify `STRIPE_WEBHOOK_SECRET` matches the signing secret in your Stripe webhook configuration.
2. Ensure the webhook URL is set to `https://your-domain.com/api/billing/webhook`.
3. Check that `/api/billing/webhook` is in the `PUBLIC_ROUTES` array in middleware.

#### Email Delivery Failures

**Cause**: Email provider API key is missing or invalid.

**Fix**: Configure either `RESEND_API_KEY` or `SENDGRID_API_KEY`. Set `EMAIL_FROM` to a verified sender address. Invitation emails are sent non-blocking (failures are logged but do not prevent the invitation from being created).

#### Health Check Failing

**Cause**: One or more dependent services are unreachable.

**Fix**: Hit `GET /api/health` to identify which service is failing. The response includes individual status checks for database, config, Stripe, email, and storage.

### Audit Trail

All significant actions are recorded in the `audit_log` table:

- User ID and organization ID
- Action type (create, update, delete)
- Entity type and entity ID
- Timestamp and details

Query the audit log via `GET /api/audit` with filters for `action`, `entityType`, `userId`, and date range (`from`, `to`).

### Security Headers

The middleware applies these security headers to all responses:

| Header | Value |
|---|---|
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |
| `X-XSS-Protection` | `1; mode=block` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` |
