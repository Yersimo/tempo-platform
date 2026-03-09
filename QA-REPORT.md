# Tempo Platform — QA Test Report

**Date:** 2026-03-01
**Tester:** Automated QA (Claude Code + Chrome Browser Automation)
**Platform:** Tempo HR Platform (Next.js 16.1.6 + React 19 + Turbopack)
**Server:** http://localhost:3002
**Test Org:** Ecobank Transnational (org-1, 30 employees)
**Primary Test Account:** Amara Kone (Owner, CHRO) — amara.kone@ecobank.com

---

## Executive Summary

Comprehensive QA testing was performed across 12 test steps covering authentication, 27+ page modules, deep interaction testing, UI polish, and edge cases. **4 bugs were found and fixed during testing, 3 remain open (all low-medium severity).** The platform is in a stable, functional state with no critical or high-severity open issues.

---

## QA Summary

| Metric | Count |
|--------|-------|
| **Total Test Areas** | 12 steps (80+ individual checks) |
| **Passed** | 73+ |
| **Failed (fixed during QA)** | 4 |
| **Open Bugs** | 3 (Medium: 1, Low: 2) |
| **Pages Tested** | 27 |
| **Pages Passing** | 27/27 (after fix) |
| **Roles Tested** | Owner, Employee |

---

## Bug Report

### BUG-001: Rate limiter counts all auth actions toward login limit [FIXED]
**Severity:** High
**Module:** Middleware (Authentication)
**Status:** Fixed
**File:** `src/middleware.ts`

**Steps:** 1. Log in successfully. 2. Navigate the app (triggers `/api/auth` POST for `me`, `logout`, `switch_user`). 3. After ~10 total auth requests, rate limiter blocks ALL auth operations.
**Expected:** Only `login` and `signup` actions count toward the login rate limit.
**Actual:** ALL POST requests to `/api/auth` (including session checks, logout) counted toward the 10-request login limit.
**Fix:** Modified middleware to clone the request body and only rate-limit when `action === 'login'` or `action === 'signup'`.

---

### BUG-002: Session validation retry loop when rate-limited [FIXED]
**Severity:** High
**Module:** Auth / Client Store
**Status:** Fixed (root cause resolved via BUG-001 fix)

**Steps:** 1. Trigger rate limit (via BUG-001). 2. Client receives 429 on session check. 3. `fetchSessionUser()` interprets 429 as `apiDown: true`. 4. Falls back to localStorage, re-validates, loops.
**Expected:** Non-login auth requests should never be rate-limited.
**Actual:** 33 rapid-fire 429 requests in 0.17 seconds, creating a request storm.
**Fix:** BUG-001 fix prevents non-login actions from being rate-limited.

---

### BUG-003: DB schema mismatch — first_name/last_name columns missing [FIXED]
**Severity:** Critical
**Module:** Database / Schema Migration
**Status:** Fixed

**Steps:** 1. Schema (`src/lib/db/schema.ts`) defines `firstName`/`lastName` columns. 2. Neon DB did not have these columns. 3. Any Drizzle `select()` on employees table fails.
**Expected:** DB schema matches application schema.
**Actual:** `NeonDbError: column "first_name" does not exist` — blocked all DB-dependent auth flows.
**Fix:** Ran `ALTER TABLE employees ADD COLUMN IF NOT EXISTS first_name text; ALTER TABLE employees ADD COLUMN IF NOT EXISTS last_name text;` directly on Neon.
**Note:** `drizzle-kit push` fails separately due to enum value mismatch (`application_status: "interview"` in existing data). This migration tooling issue needs manual resolution for future schema changes.

---

### BUG-004: /performance page crash — competencyFramework.map is not a function [FIXED]
**Severity:** High
**Module:** Performance Management / Store
**Status:** Fixed
**File:** `src/lib/store.tsx`

**Steps:** 1. Navigate to `/performance`. 2. Page crashes with TypeError.
**Expected:** Performance page loads with competency framework data.
**Actual:** `TypeError: competencyFramework.map is not a function` — `competencyFramework` was initialized as `{}` (object) instead of `[]` (array), and had no setter to load demo data.
**Fix:** (1) Changed `useState<any>({})` to `useState<any[]>([])`. (2) Added `setCompetencyFramework` setter. (3) Added demo data loading in `loadDemoData` callback for `demoCompetencyFramework`, `demoOneOnOnes`, `demoRecognitions`, `demoCompetencyRatings`.

---

### BUG-005: Stat card labels not translated when switching locale [OPEN]
**Severity:** Medium
**Module:** Dashboard / i18n
**Status:** Open

**Steps:** 1. Switch locale to French or Portuguese via sidebar locale switcher. 2. Observe dashboard stat cards.
**Expected:** All text including stat labels ("LEAVE BALANCE", "ACTIVE GOALS") and values ("20 days", "All on track") should be translated.
**Actual:** Page headings and nav translate correctly, but stat card labels and value descriptions remain in English.
**Impact:** Affects all non-English locales. Cosmetic issue — functionality is not impaired.

---

### BUG-006: Add Employee form — no visual validation feedback on empty submission [OPEN]
**Severity:** Low
**Module:** People / Add Employee Modal
**Status:** Open

**Steps:** 1. Go to `/people`. 2. Click "Add Employee". 3. Leave all fields empty. 4. Click "Add Employee" submit button.
**Expected:** Validation errors displayed for required fields (name, email).
**Actual:** Form does not submit (no empty employee created — data integrity preserved), but no error messages shown to the user. Modal simply stays open.
**Impact:** UX confusion — user gets no feedback. Data integrity is not affected.

---

### BUG-007: Missing i18n keys for Swahili locale in command palette [OPEN]
**Severity:** Low
**Module:** Search / Command Palette / i18n
**Status:** Open

**Steps:** 1. Switch locale to Swahili (`sw`). 2. Open command palette. 3. Observe console errors.
**Expected:** All command palette navigation labels translated.
**Actual:** Console errors for missing keys: `search.goToFinance`, `search.goToWorkflows`, `search.goToStrategy`, `search.goToSettings` in `sw` locale. Gracefully falls back to key name.
**Impact:** Only affects Swahili locale. Labels fall back gracefully. No crash.

---

## Detailed Test Results

### Step 0: Environment Setup & Verification
| Test | Result |
|------|--------|
| Dev server running on port 3002 | PASS |
| Landing page loads | PASS |
| Login page accessible | PASS |
| Demo credential selector visible | PASS |
| No console errors on initial load | PASS |

### Step 1: Authentication & Access Control
| Test | Result |
|------|--------|
| Owner login → /dashboard | PASS |
| Employee login → restricted sidebar nav | PASS |
| Logout → returns to /login | PASS |
| Invalid credentials → error message | PASS |
| Authenticated user redirect (login → dashboard) | PASS |
| Rate limiting (login attempts) | PASS (after BUG-001 fix) |

### Step 2: Page Rendering (27 pages)
| Page | Result |
|------|--------|
| /dashboard | PASS |
| /people | PASS |
| /recruiting | PASS |
| /performance | PASS (after BUG-004 fix) |
| /compensation | PASS |
| /learning | PASS |
| /engagement | PASS |
| /mentoring | PASS |
| /offboarding | PASS |
| /payroll | PASS |
| /time-attendance | PASS |
| /benefits | PASS |
| /expense | PASS |
| /it-cloud | PASS |
| /it/devices | PASS |
| /it/apps | PASS |
| /marketplace | PASS |
| /finance/invoices | PASS |
| /finance/budgets | PASS |
| /projects | PASS |
| /strategy | PASS |
| /headcount | PASS |
| /compliance | PASS |
| /automation | PASS |
| /workflow-studio | PASS |
| /analytics | PASS |
| /settings | PASS |

### Steps 3-9: Deep Module Testing
| Module | Stat Cards | Sub-tabs | Modals | Data Display | Result |
|--------|-----------|----------|--------|-------------|--------|
| Payroll | PASS | PASS | PASS | PASS | PASS |
| Time & Attendance | PASS | PASS | PASS | PASS | PASS |
| Benefits | PASS | PASS | PASS | PASS | PASS |
| Expense | PASS | PASS | PASS | PASS | PASS |
| IT Cloud | PASS | PASS | PASS | PASS | PASS |
| Analytics | PASS | PASS | N/A | PASS | PASS |
| Learning | PASS | PASS | PASS | PASS | PASS |

### Step 10: Settings, Navigation & UI Polish
| Test | Result |
|------|--------|
| Sidebar collapse/expand | PASS |
| Dark mode toggle | PASS |
| Locale switcher (FR, PT, ES, DE, EN) | PASS |
| Command palette opens with search | PASS |
| Command palette search finds employees | PASS |
| Notifications panel | PASS |
| Mobile responsive layout (375x812) | PASS |

### Step 11: Edge Cases & Stress Tests
| Test | Result |
|------|--------|
| Rapid tab switching (6 switches) | PASS |
| Session persistence on page refresh | PASS |
| Browser back navigation | PASS |
| Browser forward navigation | PASS |
| Rapid sidebar navigation (6 pages) | PASS |
| Authenticated user login redirect | PASS |
| Form validation — empty fields | PARTIAL (BUG-006) |
| Console error audit | PARTIAL (BUG-007, i18n only) |

---

## Known Issues Not Fixed

1. **`drizzle-kit push` fails** due to enum value mismatch: existing data has `application_status = "interview"` which conflicts with the schema enum. Requires manual DB migration or data cleanup before `drizzle-kit push` can work.

2. **Next.js dev overlay shows "12 Issues"** — all are Swahili i18n `MISSING_MESSAGE` warnings in development mode. These do not appear in production builds.

---

## Recommendations

1. **Add form validation feedback** — All modal forms (Add Employee, Leave Request, etc.) should show inline error messages for required fields. Consider using `react-hook-form` with `zod` schemas for consistent validation.

2. **Complete i18n translations** — Swahili (`sw`) locale is missing command palette navigation keys. Run an audit across all locales to find missing keys: `search.goTo*` pattern in `sw.json`.

3. **Translate stat card content** — Dashboard stat card labels and descriptions should use `useTranslations()` instead of hardcoded English strings.

4. **Fix DB migration tooling** — Resolve the `application_status` enum mismatch so `drizzle-kit push` works reliably. Consider adding a migration script or manually aligning enum values.

5. **Add E2E test suite** — Consider Playwright tests covering the auth flow, role-based access, and critical page rendering to prevent regressions (especially for issues like BUG-004).

---

## Files Modified During QA

| File | Change | Bug Fixed |
|------|--------|-----------|
| `src/middleware.ts` | Rate limit only login/signup actions | BUG-001, BUG-002 |
| `src/lib/store.tsx` | Fix competencyFramework init + demo data loading | BUG-004 |
| Neon DB (employees table) | Added first_name, last_name columns | BUG-003 |

---

**QA Status: PASS (with 3 low/medium open items)**
**Platform Stability: Stable — no crashes, no data loss, no security issues**
