# Tempo Platform — Comprehensive QA Testing Plan

**Date:** 2026-03-01
**Platform:** Tempo HR Platform (Next.js 16 + React 19)
**Server:** http://localhost:3002
**Test Orgs:** Ecobank Transnational (org-1), Kash & Co (org-2)

---

## Step 0: Environment Setup & Verification
- [ ] Dev server running on port 3002
- [ ] Landing page loads (marketing site)
- [ ] Login page accessible at /login
- [ ] Demo credential selector visible
- [ ] No console errors on initial load

## Step 1: Authentication & Access Control
**Accounts to test:**
| Role | Email | Password |
|------|-------|----------|
| Owner | amara.kone@ecobank.com | demo1234 |
| Admin | o.adeyemi@ecobank.com | demo1234 |
| HRBP | a.darko@ecobank.com | demo1234 |
| Manager | n.okafor@ecobank.com | demo1234 |
| Employee | k.asante@ecobank.com | demo1234 |

**Tests:**
- [ ] Login with each role → verify redirect to /dashboard
- [ ] Verify role-based sidebar: Employee sees limited nav (Dashboard, People, Performance, Learning, etc.)
- [ ] Verify Owner/Admin sees full navigation
- [ ] Logout from user menu → returns to /login
- [ ] Invalid credentials → error message displayed
- [ ] Empty fields → validation error
- [ ] Demo credential quick-select works

## Step 2: Employee Management (People Module)
- [ ] /people loads with employee directory (30 employees for Ecobank)
- [ ] Search by name filters results
- [ ] Department filter works
- [ ] Country filter works
- [ ] Add Employee modal opens and form submits
- [ ] Employee detail/edit works
- [ ] Org Chart tab renders hierarchy
- [ ] Analytics tab shows department stats
- [ ] Documents tab with filters
- [ ] Timeline tab with event history
- [ ] Bulk Actions tab with transfer/status change
- [ ] Custom Fields tab
- [ ] Pagination works (10 per page)

## Step 3: Leave Management & Time-Attendance
- [ ] /time-attendance loads
- [ ] Time off requests display
- [ ] Submit new leave request
- [ ] Approve/reject leave (manager role)
- [ ] Calendar/schedule view
- [ ] Clock in/out functionality
- [ ] Timesheet editing

## Step 4: Payroll Workflows
- [ ] /payroll loads
- [ ] Payroll runs display
- [ ] Create/process payroll run
- [ ] Pay stubs / pay history
- [ ] Tax document access
- [ ] Multi-currency support display

## Step 5: Performance Management
- [ ] /performance loads
- [ ] Performance reviews list
- [ ] Goals management (create, edit, track)
- [ ] Review cycles
- [ ] 360 feedback
- [ ] Performance analytics

## Step 6: Recruiting & ATS
- [ ] /recruiting loads
- [ ] Job postings list
- [ ] Create new job posting modal
- [ ] Application pipeline / kanban board
- [ ] Move candidate between stages
- [ ] Interview scheduling
- [ ] Offer generation
- [ ] Career site preview
- [ ] Referral management

## Step 7: Benefits & Compensation
- [ ] /benefits loads with plans
- [ ] Benefit enrollment
- [ ] Plan comparison
- [ ] /compensation loads
- [ ] Compensation bands/ranges
- [ ] Equity/stock tracking

## Step 8: IT Cloud, Devices & Apps
- [ ] /it-cloud loads
- [ ] /it/devices — device inventory
- [ ] /it/apps — application management
- [ ] Device provisioning
- [ ] Zero-touch deployment display
- [ ] Password manager integration
- [ ] Identity provider settings

## Step 9: Finance (Invoices, Budgets, Expense)
- [ ] /finance/invoices loads
- [ ] /finance/budgets loads
- [ ] /expense loads
- [ ] Create expense report
- [ ] Expense approval workflow
- [ ] Budget tracking
- [ ] Invoice management

## Step 10: Analytics & Reporting
- [ ] /analytics loads
- [ ] Dashboard widgets render (charts, stats)
- [ ] Filter/date range selectors
- [ ] Export capabilities
- [ ] Department breakdowns

## Step 11: Settings, Navigation & UI Polish
- [ ] Sidebar collapse/expand
- [ ] Dark mode toggle
- [ ] Locale switcher
- [ ] Command palette (search)
- [ ] Breadcrumb navigation
- [ ] Toast notifications appear
- [ ] Mobile responsive layout
- [ ] PWA install prompt

## Step 12: Edge Cases & Stress Tests
- [ ] Rapid tab switching
- [ ] Empty state displays (new org)
- [ ] Form validation (required fields, email format)
- [ ] Long text handling
- [ ] Browser back/forward navigation
- [ ] Session persistence on refresh
- [ ] Concurrent modal prevention

---

## Bug Report Format
```
BUG-XXX: [Title]
Severity: Critical / High / Medium / Low
Module: [Module name]
Steps: 1... 2... 3...
Expected: [what should happen]
Actual: [what actually happens]
Screenshot: [if applicable]
```

## QA Summary Template
- Total Tests: X
- Passed: X
- Failed: X
- Bugs Found: X (Critical: X, High: X, Medium: X, Low: X)
- Recommendations: [list]
