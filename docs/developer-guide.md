# Tempo Platform -- Developer Guide

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Clone and Install](#clone-and-install)
3. [Environment Variables](#environment-variables)
4. [Database Setup](#database-setup)
5. [Running Locally](#running-locally)
6. [Project Structure](#project-structure)
7. [Module Architecture](#module-architecture)
8. [Adding a New Module](#adding-a-new-module)
9. [API Patterns](#api-patterns)
10. [State Management](#state-management)
11. [Authentication Internals](#authentication-internals)
12. [Testing](#testing)
13. [Code Conventions](#code-conventions)

---

## Prerequisites

| Tool | Version | Purpose |
|---|---|---|
| Node.js | 20.x+ | Runtime |
| npm | 10.x+ | Package manager (ships with Node) |
| PostgreSQL | 15+ | Database (Neon serverless recommended) |
| Git | 2.x+ | Version control |

Optional:
- Stripe CLI (for local webhook testing)
- An S3-compatible bucket (for file uploads)
- Upstash Redis (for production-grade rate limiting)

---

## Clone and Install

```bash
git clone <repository-url> tempo-platform
cd tempo-platform
npm install
```

### Key Dependencies

| Package | Version | Purpose |
|---|---|---|
| `next` | 16.1.6 | Framework (App Router) |
| `react` | 19.2.4 | UI library |
| `typescript` | 5.9.3 | Type checking |
| `drizzle-orm` | 0.45.1 | Database ORM |
| `jose` | 6.1.3 | JWT signing/verification (Edge-compatible) |
| `stripe` | 20.3.1 | Payment processing |
| `zod` | 4.3.6 | Runtime validation |
| `@upstash/ratelimit` | 2.0.8 | Rate limiting |
| `@neondatabase/serverless` | 1.0.2 | Neon PostgreSQL driver |
| `recharts` | 3.7.0 | Charts and data visualization |
| `lucide-react` | 0.575.0 | Icons |
| `tailwindcss` | 4.2.0 | CSS framework |
| `pdf-lib` | 1.17.1 | PDF generation |
| `fflate` | 0.8.2 | ZIP compression |

### Dev Dependencies

| Package | Version | Purpose |
|---|---|---|
| `vitest` | 4.0.18 | Unit/integration tests |
| `@playwright/test` | 1.58.2 | End-to-end tests |
| `@testing-library/react` | 16.3.2 | React component testing |
| `drizzle-kit` | 0.31.9 | Schema migrations |

---

## Environment Variables

For local development, only `DATABASE_URL` is strictly required. Create a `.env.local` file:

```env
# Required
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require

# Recommended (defaults to a dev secret in development)
JWT_SECRET=your-dev-secret-at-least-32-chars

# Optional -- enables specific features
ANTHROPIC_API_KEY=sk-ant-...          # AI features (receipt OCR, chat assistant)
STRIPE_SECRET_KEY=sk_test_...        # Billing
STRIPE_WEBHOOK_SECRET=whsec_...      # Stripe webhooks
RESEND_API_KEY=re_...                # Email delivery
NEXT_PUBLIC_APP_URL=http://localhost:3002
```

See `docs/admin-guide.md` for the complete environment variable reference.

---

## Database Setup

### Schema Location

The entire schema is defined in a single file:

```
src/lib/db/schema.ts
```

This file contains 90+ table definitions, all enums, and relationship declarations using Drizzle ORM.

### Drizzle Config

```
drizzle.config.ts
```

```ts
export default defineConfig({
  schema: './src/lib/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
})
```

### Applying the Schema

```bash
# Push schema directly to the database (development)
npx drizzle-kit push

# Generate migration SQL files
npx drizzle-kit generate

# Apply pending migrations
npx drizzle-kit migrate
```

### Migration Files

Migration SQL files are stored in `drizzle/`:

```
drizzle/
  0000_funny_toad_men.sql        # Initial schema
  0001_rls_policies.sql          # Row-Level Security
  0002_performance_indexes.sql   # Performance indexes
  0003_missing_tables.sql        # Additional tables
  0004_ux_walkthrough_fixes.sql  # UX-related changes
  meta/
    _journal.json                # Migration journal
    0000_snapshot.json           # Schema snapshot
```

### Database Connection

The database connection is initialized in `src/lib/db/index.ts` using the Neon serverless driver:

```ts
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
```

All queries go through the `db` object exported from this module.

---

## Running Locally

### npm Scripts

| Script | Command | Purpose |
|---|---|---|
| `npm run dev` | `next dev --webpack` | Start dev server with hot reload |
| `npm run build` | `next build` | Production build |
| `npm start` | `next start` | Start production server |
| `npm test` | `vitest run` | Run unit tests |
| `npm run test:watch` | `vitest` | Run tests in watch mode |
| `npm run test:coverage` | `vitest run --coverage` | Tests with coverage report |
| `npm run test:e2e` | `playwright test` | End-to-end tests |

### Development Server

The development server is configured to run on port 3002:

```bash
npm run dev -- --port 3002
```

A launch configuration is also available at `.claude/launch.json` for automated tooling.

### Demo Mode

When the database is unavailable or for testing, the platform falls back to demo data:

- Demo credentials are defined in `src/lib/demo-data.ts`
- Demo org IDs use non-UUID formats (e.g., `org-1`, `org-2`)
- The middleware detects demo orgs and sets `x-demo-mode: true`
- API routes that are "demo-aware" (payroll, data, chat) return simulated responses
- Non-demo-aware API routes return empty JSON `[]` for demo orgs to prevent PostgreSQL UUID errors

---

## Project Structure

```
src/
  app/
    (platform)/              # Authenticated pages (layout with sidebar)
      dashboard/page.tsx
      payroll/page.tsx
      finance/
        cards/page.tsx
        invoices/page.tsx
        ...
      it/
        apps/page.tsx
        devices/page.tsx
      ...
    admin/                   # Platform admin pages (separate auth)
      login/page.tsx
      page.tsx
    api/                     # API routes
      auth/                  # Authentication (login, signup, MFA, SSO)
      admin/                 # Platform admin API
      billing/               # Stripe billing
      chat/                  # Real-time messaging
      data/[module]/         # Generic module data endpoint
      employees/             # Employee management
      payroll/               # Payroll engine
      gdpr/                  # GDPR data requests
      scim/                  # SCIM 2.0 provisioning
      ...
    login/page.tsx           # Public login page
    signup/page.tsx          # Public signup page
  lib/
    db/
      schema.ts              # All Drizzle table definitions
      index.ts               # Database connection
    auth.ts                  # JWT, sessions, password hashing
    admin-auth.ts            # Platform admin auth
    store.tsx                # React Context state store (~4834 lines)
    demo-data.ts             # Demo/fallback data (code-split)
    payroll-engine.ts        # Tax calculation, payroll processing
    email.ts                 # Email service (Resend/SendGrid)
    totp.ts                  # TOTP generation and verification
    scim.ts                  # SCIM 2.0 implementation
    hooks/
      use-module-data.ts     # Lazy module loading hook
    services/
      sso-handler.ts         # SSO flow orchestration
    payroll/
      bank-payments.ts       # Bank file generation
      audit.ts               # Payroll audit trail
      reconciliation.ts      # Payroll reconciliation
      reports.ts             # Tax certificates and year-end reports
      tax-form-pdf.ts        # Country-specific tax form PDFs
      tax-config-cache.ts    # Tax config caching
    validations/
      payroll.ts             # Zod schemas for payroll
      common.ts              # Shared Zod utilities
  components/                # Shared UI components
  middleware.ts              # Auth, rate limiting, security headers
```

---

## Module Architecture

Tempo uses a three-layer architecture for module data:

### Layer 1: Store Keys

The React Context store in `src/lib/store.tsx` defines typed state keys for each module:

```ts
interface TempoState {
  employees: Employee[]
  departments: Department[]
  goals: Goal[]
  payrollRuns: PayrollRun[]
  // ... 40+ more
}
```

### Layer 2: Module Slugs

`src/lib/hooks/use-module-data.ts` maps camelCase store keys to kebab-case API slugs:

```ts
const MODULE_SLUGS: Record<string, string> = {
  employees: 'employees',
  reviewCycles: 'review-cycles',
  salaryReviews: 'salary-reviews',
  // ... 180+ mappings
}
```

### Layer 3: Module Config

`src/app/api/data/[module]/route.ts` maps API slugs to Drizzle tables:

```ts
const MODULE_CONFIG: Record<string, { table: any; hasOrgId: boolean; defaultLimit: number }> = {
  employees:        { table: schema.employees, hasOrgId: true, defaultLimit: 50 },
  'review-cycles':  { table: schema.reviewCycles, hasOrgId: true, defaultLimit: 20 },
  // ... 125+ mappings
}
```

### Data Flow

```
Page component
  -> useEffect calls ensureModulesLoaded(['goals', 'reviews'])
  -> use-module-data.ts maps to ['goals', 'reviews'] API slugs
  -> GET /api/data/goals?page=1&limit=50
  -> route.ts maps 'goals' to schema.goals table
  -> SELECT * FROM goals WHERE org_id = $orgId LIMIT 50
  -> Response cached for 5 minutes (client-side TTL)
  -> Store setter updates state
  -> Components re-render with data
```

### Caching

- Client-side cache TTL: 5 minutes (configurable in `use-module-data.ts`)
- API responses include `Cache-Control: private, max-age=60` headers
- The `moduleSetters` ref in the store maps store keys to their state setter functions

---

## Adding a New Module

Follow these four steps to add a new module (e.g., "training-sessions"):

### Step 1: Define the Database Table

In `src/lib/db/schema.ts`:

```ts
export const trainingSessions = pgTable('training_sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').notNull().references(() => organizations.id),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  date: timestamp('date'),
  duration: integer('duration'),  // minutes
  trainerId: uuid('trainer_id').references(() => employees.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})
```

Then push the schema:

```bash
npx drizzle-kit push
```

### Step 2: Register in MODULE_CONFIG

In `src/app/api/data/[module]/route.ts`, add the mapping:

```ts
'training-sessions': { table: schema.trainingSessions, hasOrgId: true, defaultLimit: 50 },
```

### Step 3: Register in MODULE_SLUGS

In `src/lib/hooks/use-module-data.ts`, add the mapping:

```ts
trainingSessions: 'training-sessions',
```

### Step 4: Add Store State and Page

In `src/lib/store.tsx`, add the state key to `TempoState` and add the setter to `moduleSetters`.

Create the page at `src/app/(platform)/training/page.tsx`:

```tsx
'use client'
import { useStore } from '@/lib/store'
import { useEffect } from 'react'

export default function TrainingPage() {
  const { trainingSessions, ensureModulesLoaded } = useStore()

  useEffect(() => {
    ensureModulesLoaded?.(['trainingSessions'])
  }, [ensureModulesLoaded])

  return (
    <div>
      <h1>Training Sessions</h1>
      {/* Render trainingSessions data */}
    </div>
  )
}
```

---

## API Patterns

### Action-Based Routing

Most API endpoints use a single route file with an `action` discriminator:

**POST routes** receive the action in the JSON body:

```ts
// POST /api/payroll
const body = await request.json()
const { action } = body  // "process", "submit", "approve-hr", etc.
```

**GET routes** receive the action as a query parameter:

```ts
// GET /api/payroll?action=analytics
const action = url.searchParams.get('action')
```

### Auth Context from Middleware

The middleware injects auth headers that API routes can read:

```ts
const orgId = request.headers.get('x-org-id')
const employeeId = request.headers.get('x-employee-id')
const role = request.headers.get('x-employee-role')
const sessionId = request.headers.get('x-session-id')
```

### Error Response Format

All API errors follow this structure:

```json
{ "error": "Human-readable error message" }
```

With appropriate HTTP status codes:

| Code | Meaning |
|---|---|
| 400 | Bad request (missing/invalid parameters) |
| 401 | Unauthorized (no session or expired) |
| 403 | Forbidden (insufficient role) |
| 404 | Resource not found |
| 409 | Conflict (duplicate resource) |
| 429 | Rate limited |
| 500 | Internal server error |
| 503 | Service unavailable (external dependency not configured) |

### Pagination

The generic data endpoint supports pagination:

```
GET /api/data/employees?page=1&limit=50
```

Response headers:
- Default limits per module are defined in `MODULE_CONFIG`
- All results are scoped by `org_id` (tenant isolation)

### Input Validation

Use Zod schemas for request validation (see `src/lib/validations/`):

```ts
import { payrollPostBody } from '@/lib/validations/payroll'
import { formatZodError } from '@/lib/validations/common'

const parsed = payrollPostBody.safeParse(body)
if (!parsed.success) {
  return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 })
}
```

---

## State Management

### React Context Store

The global state lives in `src/lib/store.tsx` (~4834 lines). It uses React Context with `useReducer`-style updates:

- **TempoState interface**: Defines all typed state keys (employees, goals, payroll, etc.)
- **moduleSetters ref**: Maps store keys to their state setter functions for lazy loading
- **ensureModulesLoaded**: Accepts an array of store keys and fetches any that are not yet loaded

### Demo Data Fallback

When the API is unavailable, `src/lib/demo-data.ts` provides code-split fallback data:

- `getDemoDataForOrg(orgId)` returns demo data scoped to a specific org
- `allDemoCredentials` provides hardcoded login credentials for demo accounts
- Demo data is only bundled when actually imported (code-split)

---

## Authentication Internals

### Password Hashing

Passwords are hashed using PBKDF2 (Web Crypto API, Edge-compatible):

- Algorithm: PBKDF2 with SHA-256
- Iterations: 100,000
- Salt: 32 bytes, randomly generated
- Storage format: `pbkdf2:<salt_hex>:<hash_hex>`
- Legacy format: `demo:<password>` (for migration)
- Constant-time comparison to prevent timing attacks

### JWT Tokens

- Algorithm: HS256
- Library: `jose` (Edge Runtime compatible)
- Expiry: 7 days for sessions, 5 minutes for MFA challenge tokens, 7 days for invitation tokens
- Payload: `{ employeeId, email, role, orgId, sessionId }`

### Session Management

Sessions are dual-layer:

1. **JWT validation**: Signature and expiry checked in middleware (no DB hit)
2. **DB validation**: Session record checked in `validateSession()` for non-demo sessions

This means the middleware is fast (JWT-only), while full session validation happens in API routes when needed.

### Cookie Configuration

```ts
{
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
  maxAge: 604800  // 7 days in seconds
}
```

Two separate cookies:
- `tempo_session`: Employee sessions
- `tempo_admin_session`: Platform admin sessions

---

## Testing

### Unit Tests (Vitest)

```bash
npm test               # Run once
npm run test:watch     # Watch mode
npm run test:coverage  # With coverage
```

Configuration is in `vitest.config.ts`. Tests use `@testing-library/react` for component testing and `jsdom` as the DOM environment.

### End-to-End Tests (Playwright)

```bash
npm run test:e2e
```

Playwright tests are configured in `playwright.config.ts`.

---

## Code Conventions

### TypeScript

- Strict mode enabled (`"strict": true` in tsconfig)
- Path aliases: `@/*` maps to `./src/*`
- Module resolution: `bundler` mode
- Target: ES2017

### Naming

| Context | Convention | Example |
|---|---|---|
| Database columns | snake_case | `org_id`, `created_at` |
| TypeScript properties | camelCase | `orgId`, `createdAt` |
| Store keys | camelCase | `payrollRuns`, `leaveRequests` |
| API slugs | kebab-case | `payroll-runs`, `leave-requests` |
| Files (pages) | kebab-case directories | `src/app/(platform)/bill-pay/page.tsx` |
| Files (lib) | kebab-case | `src/lib/payroll-engine.ts` |
| Components | PascalCase | `EmployeeCard.tsx` |
| Enums (DB) | snake_case values | `'pending'`, `'in_progress'` |

### Data Conventions

- **Monetary amounts**: Stored in cents as integers (e.g., `500000` = $5,000.00)
- **UUIDs**: All primary keys use `uuid('id').defaultRandom().primaryKey()`
- **Timestamps**: `timestamp('created_at').defaultNow().notNull()`
- **Soft deletes**: Use `isActive: boolean` rather than deleting records
- **Org scoping**: Every tenant-scoped table has `org_id` referencing `organizations.id`

### Employee Data Shape

The canonical employee object shape (returned from auth and data endpoints):

```ts
{
  id: string           // Employee UUID
  org_id: string       // Organization UUID
  department_id: string | null
  job_title: string
  level: string
  country: string
  role: 'owner' | 'admin' | 'hrbp' | 'manager' | 'employee'
  profile: {
    full_name: string
    email: string
    avatar_url: string | null
    phone: string | null
  }
}
```

Note: Name fields are at the `profile` level, not the top level. Do not use `first_name`/`last_name`.

### API Route Structure

Each API route file follows this pattern:

```ts
import { NextRequest, NextResponse } from 'next/server'
import { db, schema } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id')
    if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { action } = body

    if (action === 'some-action') {
      // ... implementation
      return NextResponse.json({ result })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('[Route Name] Error:', error)
    return NextResponse.json({ error: 'Operation failed' }, { status: 500 })
  }
}
```

### Audit Logging

All significant mutations should create an audit log entry:

```ts
await db.insert(schema.auditLog).values({
  orgId,
  userId: employeeId,
  action: 'create',       // create | update | delete
  entityType: 'employee', // what kind of entity
  entityId: targetId,     // the entity's ID
  details: 'Description of what changed',
})
```
