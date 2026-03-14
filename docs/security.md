# Tempo Platform -- Security Documentation

## Table of Contents

1. [Authentication Flow](#authentication-flow)
2. [Authorization Model](#authorization-model)
3. [Data Isolation (Multi-Tenancy)](#data-isolation-multi-tenancy)
4. [API Security](#api-security)
5. [Cryptography](#cryptography)
6. [Session Management](#session-management)
7. [SSO and Identity Federation](#sso-and-identity-federation)
8. [Multi-Factor Authentication](#multi-factor-authentication)
9. [SCIM Provisioning](#scim-provisioning)
10. [GDPR Compliance](#gdpr-compliance)
11. [Audit Trail](#audit-trail)
12. [OWASP Top 10 Compliance](#owasp-top-10-compliance)

---

## Authentication Flow

### Primary Login Flow

```
Client                     Middleware                  POST /api/auth              Database
  |                           |                            |                          |
  |-- POST {email, password} -|--------------------------->|                          |
  |                           |                            |-- SELECT employee ------->|
  |                           |                            |<-- employee row ----------|
  |                           |                            |-- verifyPassword() ------>|
  |                           |                            |                          |
  |                           |                   [If MFA enabled]                    |
  |                           |                            |-- createMFAToken() ------>|
  |<--- { requiresMFA, mfaToken } -------------------------|                          |
  |                           |                            |                          |
  |-- POST {action: verify_mfa, mfaToken, code} ---------->|                          |
  |                           |                            |-- verifyTOTP() --------->|
  |                           |                            |-- createSession() ------->|
  |<--- Set-Cookie: tempo_session (httpOnly JWT) ----------|                          |
  |                           |                            |                          |
  |                   [If MFA not enabled]                 |                          |
  |                           |                            |-- createSession() ------->|
  |<--- Set-Cookie: tempo_session (httpOnly JWT) ----------|                          |
  |                           |                            |                          |
  |-- GET /dashboard -------->|                            |                          |
  |                           |-- jwtVerify(cookie) ------>|                          |
  |                           |-- Set x-employee-id ------>|                          |
  |                           |-- Set x-org-id ----------->|                          |
  |                           |-- Set x-employee-role ---->|                          |
  |<--- Page response --------|                            |                          |
```

### Login Fallback Chain

1. **Database lookup**: Query `employees` table by email
2. **Evaluator accounts**: Check `isEvaluatorAccount()` for special demo evaluator credentials
3. **Demo credentials**: Check `allDemoCredentials` for hardcoded demo users

Each level has its own password verification. Real users use PBKDF2 hashing; demo users use plaintext comparison.

### Admin Authentication

Platform admins use a completely separate authentication system:

- Separate cookie: `tempo_admin_session`
- Separate table: `platform_admins`
- Separate auth functions: `createAdminSession()`, `validateAdminSession()`
- Separate middleware checks (run before employee auth checks)
- Admin routes: `/admin/*` and `/api/admin/*`

---

## Authorization Model

### Role Hierarchy

```
owner
  |-- admin
       |-- hrbp
            |-- manager
                 |-- employee
```

### Role Enforcement

Authorization is checked at two layers:

**Layer 1 -- Middleware** (`src/middleware.ts`):
- Verifies JWT signature and expiry
- Injects `x-employee-role` header from JWT payload
- Does NOT perform role-based access control (only authentication)

**Layer 2 -- API Routes**:
- Read `x-employee-role` from request headers
- Apply role checks per action

Example:

```ts
const role = request.headers.get('x-employee-role')
if (role !== 'owner' && role !== 'admin') {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}
```

### Route-Level Access Control

| Route Category | Required Role | Notes |
|---|---|---|
| Employee invitation | `owner` or `admin` | Cannot invite to a higher role than own |
| Payroll approval (HR) | `admin` or `hrbp` | Approve-HR step |
| Payroll approval (Finance) | `owner` or `admin` | Approve-Finance step |
| GDPR deletion (other user) | `owner` or `admin` | Self-deletion allowed for any role |
| SSO configuration | `owner` | Org-level security setting |
| Billing management | `owner` | Financial operations |
| Module data (read) | Any authenticated role | Scoped by org_id |
| Module data (write) | Varies by module | Checked per endpoint |

---

## Data Isolation (Multi-Tenancy)

### Strategy: Organization-Scoped Queries

Every tenant-scoped table includes an `org_id` column referencing `organizations.id`. All queries filter by org_id.

### Enforcement Layers

**Layer 1 -- Middleware Header Injection**:

The middleware extracts `orgId` from the JWT and sets it as a request header:

```ts
requestHeaders.set('x-org-id', payload.orgId as string)
```

API routes use this header (never trust client-supplied org IDs):

```ts
const orgId = request.headers.get('x-org-id')
```

**Layer 2 -- Query Scoping**:

All data queries include the org_id filter:

```ts
db.select().from(schema.employees)
  .where(eq(schema.employees.orgId, orgId))
```

The generic data endpoint (`/api/data/[module]`) automatically applies this filter for all modules where `hasOrgId: true`.

**Layer 3 -- Row-Level Security (Database)**:

PostgreSQL RLS policies are defined in `drizzle/0001_rls_policies.sql`. These provide defense-in-depth at the database level:

- A session variable `app.current_org_id` is set per connection
- RLS policies restrict SELECT, INSERT, UPDATE, DELETE to rows matching the current org_id
- This prevents data leakage even if application-level filtering has a bug

### Demo Org Guard

Demo organizations use non-UUID IDs (e.g., `org-1`). The middleware intercepts these to prevent PostgreSQL errors:

```ts
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const isDemoOrg = !UUID_RE.test(orgId)

if (isDemoOrg && pathname.startsWith('/api/')) {
  // Return empty JSON instead of hitting the DB
  return NextResponse.json([], { status: 200 })
}
```

---

## API Security

### Rate Limiting

Rate limiting is implemented at the middleware level with two backends:

| Backend | Environment | Persistence |
|---|---|---|
| Upstash Redis | Production | Persists across cold starts and instances |
| In-memory Map | Development | Resets on restart, single-instance only |

#### Rate Limit Rules

| Endpoint | Limit | Window | Key |
|---|---|---|---|
| Login (`POST /api/auth`, action: login/signup) | 10 requests | 15 minutes | IP address |
| Admin login (`POST /api/admin/auth`) | 5 requests | 15 minutes | IP address |
| Password reset (`POST /api/auth/reset-password`) | 5 requests | 15 minutes | IP address |
| General API (`/api/*`) | 100 requests | 1 minute | IP address |
| AI endpoint (`POST /api/ai`) | 10 requests | 1 minute | Organization ID |

Rate limit responses return HTTP 429 with a JSON error message.

#### Fallback Behavior

If Redis is unavailable in production, the system falls back to in-memory rate limiting rather than blocking requests. This ensures availability is not compromised by a Redis outage.

### Security Headers

Applied to all responses via middleware:

| Header | Value | Purpose |
|---|---|---|
| `X-Content-Type-Options` | `nosniff` | Prevent MIME type sniffing |
| `X-Frame-Options` | `DENY` | Prevent clickjacking |
| `X-XSS-Protection` | `1; mode=block` | XSS filter (legacy browsers) |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Control referrer information |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` | Disable device APIs |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` | Enforce HTTPS |

### Input Validation

- API request bodies are validated using Zod schemas (see `src/lib/validations/`)
- File uploads are restricted to 10 MB with MIME type validation
- URL parameters are parsed and validated before use

### CORS

Next.js App Router handles CORS by default. Same-origin requests are allowed; cross-origin requests follow the standard Next.js CORS configuration.

---

## Cryptography

### Password Hashing

| Property | Value |
|---|---|
| Algorithm | PBKDF2 |
| Hash function | SHA-256 |
| Iterations | 100,000 |
| Salt length | 32 bytes |
| Derived key length | 256 bits |
| Storage format | `pbkdf2:<salt_hex>:<hash_hex>` |
| Implementation | Web Crypto API (Edge Runtime compatible) |

Password comparison uses constant-time comparison (character-by-character XOR) to prevent timing attacks.

Legacy passwords in `demo:<password>` format are supported for migration but should not be used in production.

### JWT Signing

| Property | Value |
|---|---|
| Algorithm | HS256 (HMAC-SHA256) |
| Library | `jose` (IETF standards-compliant, Edge-compatible) |
| Secret | `JWT_SECRET` environment variable |
| Session token expiry | 7 days |
| MFA challenge token expiry | 5 minutes |
| Invitation token expiry | 7 days |

### TOTP (MFA)

| Property | Value |
|---|---|
| Algorithm | TOTP (RFC 6238) |
| Implementation | `src/lib/totp.ts` |
| Code length | 6 digits |
| Backup codes | Generated during enrollment, stored in `mfa_enrollments` table |

---

## Session Management

### Session Lifecycle

1. **Creation**: On successful login, a session record is created in the `sessions` table and a JWT is issued.
2. **Validation**: Middleware validates JWT signature/expiry on every request (no DB hit). Full DB validation happens in API routes via `validateSession()`.
3. **Revocation**: Sessions can be individually revoked (`revokeSession()`) or bulk-revoked per employee (`revokeAllSessions()`).
4. **Expiry**: Sessions expire after 7 days. The JWT exp claim and the DB `expires_at` timestamp are both checked.
5. **Cleanup**: On logout, the session is deleted from the DB and the cookie is cleared.

### Cookie Security

| Property | Value |
|---|---|
| `httpOnly` | `true` (not accessible via JavaScript) |
| `secure` | `true` in production (HTTPS only) |
| `sameSite` | `lax` (protects against CSRF) |
| `path` | `/` |
| `maxAge` | 604,800 seconds (7 days) |

### Dual-Cookie Architecture

| Cookie | Purpose | Auth System |
|---|---|---|
| `tempo_session` | Employee authentication | `src/lib/auth.ts` |
| `tempo_admin_session` | Platform admin authentication | `src/lib/admin-auth.ts` |

These are completely independent -- an admin login does not grant employee access and vice versa.

---

## SSO and Identity Federation

### Supported Protocols

| Provider | Protocol | Flow |
|---|---|---|
| Google Workspace | OIDC (OAuth 2.0 Authorization Code) | Redirect-based |
| Azure AD | OIDC (OAuth 2.0 Authorization Code) | Redirect-based |

### SSO Security Controls

- **Domain restriction**: SSO configurations include `allowedDomains` to restrict which email domains can authenticate
- **State parameter**: OAuth state parameter prevents CSRF attacks during the redirect flow
- **Token exchange**: Authorization codes are exchanged server-side (not exposed to the client)
- **Account linking**: SSO login matches by email to existing employee records

### SSO Configuration Storage

SSO provider configurations are stored in the `sso_providers` table:
- Client ID and secret (encrypted at rest in the database)
- Tenant ID (Azure AD)
- Allowed email domains
- Organization association

---

## Multi-Factor Authentication

### MFA Flow

```
User                          POST /api/auth/mfa              Database
  |                                  |                           |
  |-- {action: "enroll"} ----------->|                           |
  |                                  |-- generateSecret() ------>|
  |                                  |-- generateBackupCodes() ->|
  |                                  |-- INSERT enrollment ------>|
  |<-- {secret, otpAuthUri, codes} --|                           |
  |                                  |                           |
  |-- {action: "verify_enrollment",  |                           |
  |    code: "123456"} ------------->|                           |
  |                                  |-- verifyTOTP(secret, code)|
  |                                  |-- UPDATE isVerified=true ->|
  |<-- {success: true} -------------|                           |
```

### MFA Security Properties

- TOTP secrets are stored in the `mfa_enrollments` table
- Disabling MFA requires password re-verification
- Regenerating backup codes requires password re-verification
- MFA challenge tokens expire after 5 minutes
- All MFA actions are recorded in the audit log

---

## SCIM Provisioning

### Security Model

- **Authentication**: Bearer token in the `Authorization` header
- **Content type**: `application/scim+json`
- **Endpoints**: `/api/scim/v2/Users` (list and create)
- **Org scoping**: SCIM tokens are scoped to a specific organization

SCIM enables automated user lifecycle management (provisioning and deprovisioning) from identity providers, reducing manual user management and ensuring timely access revocation.

---

## GDPR Compliance

### Data Subject Rights

| Right | Endpoint | Action |
|---|---|---|
| Right of Access (Art. 15) | `POST /api/gdpr` | `export` |
| Right to Data Portability (Art. 20) | `POST /api/gdpr` | `export` |
| Right to Erasure (Art. 17) | `POST /api/gdpr` | `delete` |

### Data Export

The export action aggregates all personal data for the requesting employee:
- Profile information (name, email, phone, job title)
- Goals, reviews, feedback
- Leave requests
- Benefit enrollments
- Compensation history
- Notification count

Data is returned as a downloadable JSON file.

### Data Deletion

Deletion uses anonymization (soft delete) rather than hard delete:
- Name replaced with `[Deleted User]`
- Email replaced with `deleted-<partial-id>@redacted.local`
- Phone and avatar cleared
- Account deactivated (`isActive: false`)
- Notifications and feedback records deleted
- Audit records retained (legal requirement)

### Authorization for Deletion

- Employees can request deletion of their own data
- Only `owner` and `admin` roles can request deletion of another employee's data
- All deletion requests are audit-logged before execution

---

## Audit Trail

### Audit Log Structure

Every significant action is recorded in the `audit_log` table:

| Column | Description |
|---|---|
| `id` | UUID primary key |
| `org_id` | Organization scope |
| `user_id` | Who performed the action |
| `action` | Action type: `create`, `update`, `delete` |
| `entity_type` | What was affected (e.g., `employee`, `payroll_run`, `mfa_enrollment`) |
| `entity_id` | ID of the affected entity |
| `details` | Human-readable description or JSON metadata |
| `created_at` | Timestamp |

### Audited Operations

- Employee invitations and deactivations
- MFA enrollment, verification, and disablement
- GDPR data export and deletion requests
- Payroll processing, approval, and payment
- Login and logout events (via session creation/revocation)
- Configuration changes (SSO, billing, tax)

### Querying the Audit Log

```
GET /api/audit?action=create&entityType=employee&from=2026-01-01&to=2026-03-14
```

Supports filtering by `action`, `entityType`, `userId`, and date range.

---

## OWASP Top 10 Compliance

### A01:2021 -- Broken Access Control

- **Mitigation**: Role-based access control on every API endpoint. Org-scoped queries with `org_id` filtering. RLS policies at the database level. Middleware injects trusted auth headers from JWT (client cannot forge).

### A02:2021 -- Cryptographic Failures

- **Mitigation**: Passwords hashed with PBKDF2 (100K iterations, 32-byte salt). JWTs signed with HS256. Cookies marked `httpOnly`, `secure`, `sameSite: lax`. HSTS header enforces HTTPS.

### A03:2021 -- Injection

- **Mitigation**: Drizzle ORM uses parameterized queries (no raw SQL concatenation). Zod validation on API inputs. File upload MIME type and size validation.

### A04:2021 -- Insecure Design

- **Mitigation**: Multi-layer auth (JWT + DB session). Separate admin and employee auth systems. Demo org guard prevents invalid UUID queries. MFA support for sensitive accounts.

### A05:2021 -- Security Misconfiguration

- **Mitigation**: Security headers applied via middleware (X-Frame-Options: DENY, X-Content-Type-Options: nosniff, Permissions-Policy disables camera/mic/geo). Startup warnings for missing `JWT_SECRET` in production.

### A06:2021 -- Vulnerable and Outdated Components

- **Mitigation**: Dependencies tracked in `package.json` with specific version ranges. Regular updates via npm. No known vulnerable components at time of documentation.

### A07:2021 -- Identification and Authentication Failures

- **Mitigation**: Rate limiting on login (10/15min), admin login (5/15min), and password reset (5/15min). Constant-time password comparison. MFA support. Session revocation. 7-day session expiry.

### A08:2021 -- Software and Data Integrity Failures

- **Mitigation**: Stripe webhook signature verification using `STRIPE_WEBHOOK_SECRET`. JWT signature verification on every request. SCIM Bearer token authentication.

### A09:2021 -- Security Logging and Monitoring Failures

- **Mitigation**: Comprehensive audit log table tracking all significant operations. Sentry integration for error tracking (server and client). Structured console logging with context prefixes.

### A10:2021 -- Server-Side Request Forgery (SSRF)

- **Mitigation**: SSO redirect URIs are constructed server-side with validated provider configurations. File uploads go to configured S3 endpoints only. No user-supplied URLs are fetched server-side without validation.
