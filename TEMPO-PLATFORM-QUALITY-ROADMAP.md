# Tempo Platform Quality Roadmap

Generated from a repo inspection focused on making Tempo feel like one seamless enterprise operating system across HR, Finance, IT, Performance, Learning, Expenses, manager workflows, employee self-service, analytics, and AI.

## Platform Map

| Area | Routes and surfaces observed | Current strength | Main risk |
| --- | --- | --- | --- |
| Core dashboard and employee self-service | `/dashboard`, employee dashboard, mobile approvals/profile/team | Strong home surface and role-aware dashboard split | Needs one cross-module task model so users know what matters next |
| People and HR operations | `/people`, org chart, org design, team calendar, journeys, moments, offboarding | Broad employee lifecycle coverage | Many flows may feel like separate tools unless handoffs are made explicit |
| Performance | `/performance` with goals, reviews, feedback, calibration, 1:1s, recognition, competencies, career paths, PIPs, merit, templates | Deep feature breadth, AI signals, calibration, merit linkage | Single 4k-line page; needs Redwood-grade workflow guidance and clearer manager decisions |
| Learning | `/learning`, `/academies`, course builder, quiz builder, content library, gamification, transcript, scenarios, smart reviews, events | Very broad LMS/academy feature set with AI authoring and compliance | Single 6.4k-line page; learner and admin jobs are mixed heavily |
| Expenses and finance ops | `/expense`, `/expenses/snap`, cards, invoices, budgets, bill pay, global spend, procurement, GL, vendors | Strong ETI-specific expense policy depth and AI receipt ambition | Needs Ramp-level speed, explainability, and policy confidence in the default flow |
| IT and identity | `/it`, `/it/apps`, `/it/devices`, `/it-cloud`, `/identity`, password manager | Broad Rippling-like IT surface | Needs stronger cross-module joiner/mover/leaver orchestration |
| Payroll and operations | `/payroll`, statutory, payslips, time, benefits, global workforce, workers comp | Africa-first payroll depth and statutory logic | Trust depends on transparent diffing, validation, and audit explanations |
| Analytics and strategy | analytics, board reports, workforce planning, predictions, report builder, strategy, headcount | Good executive footprint | Needs consistent decision narratives and drill-through to operational fixes |
| AI and automation | AI components, assistant, workflow studio, app studio, events | Lots of AI/service infrastructure | Risk of AI feeling decorative unless every insight has a next action |

## Benchmark Direction

| Module | Benchmark | What excellent means | Priority |
| --- | --- | --- | --- |
| Platform breadth | Rippling | One employee/company graph powering HR, IT, Finance, and workflow handoffs | P1 |
| Performance | Oracle Fusion Redwood | Enterprise polish with clear manager actions, calibration, growth, compensation, and learning connected | P1 |
| Learning | Sana | Personalized learning discovery, AI authoring, skills graph, compliance, and manager nudges | P1 |
| Expense | Ramp | Fast receipt capture, obvious policy outcomes, instant routing, reimbursement clarity, finance controls | P0/P1 |
| IT | Rippling + Okta | Access, devices, apps, identity, and offboarding in one lifecycle flow | P1 |
| Payroll | Deel/Rippling/Workday payroll trust patterns | Explain every variance, statutory deduction, approval, and payout state | P0 |
| Analytics | Workday/Visier style decision layers | Board-ready insights with operational drill-downs | P2 |
| Automation | Zapier/Rippling workflow automation | No-code triggers that are tied to real Tempo entities and approvals | P2 |

## Prioritized Roadmap

### P0: Trust And Broken-Flow Risks

- Verify login/auth/demo identities produce real persisted records across expenses, events, payroll, and approvals.
- Add clear error/empty/loading states to every path that touches API routes.
- Add payroll diff view for "what changed since last run."
- Make expense policy outcomes explainable before approval.

### P1: Core Workflow Completion

- Add cross-module command centers to dense modules so users know what to do next.
- Split Performance, Learning, and Expense into smaller route-level or component-level workflows.
- Connect learning recommendations to performance gaps and role paths.
- Connect expense approvals to policy, budget, reimbursement, and finance posting state.
- Make joiner/mover/leaver flows orchestrate HR, IT, payroll, learning, and compliance tasks.

### P2: UX Consistency And Delight

- Standardize module intros, tabs, empty states, and next-action panels.
- Reduce hard-to-scan mega-tabs through role-based task paths.
- Add consistent "why this matters" and "next action" language to AI insights.
- Improve mobile-first approval, receipt, learning, and manager tasks.

### P3: Advanced Intelligence And Automation

- AI command center that can summarize "what needs attention today" across modules.
- Skill graph that connects learning, performance, succession, staffing, and compensation.
- Policy simulation for payroll, expense, travel, and workforce changes.
- Workflow studio templates for common enterprise operations.

### P4: Polish, Performance, Accessibility

- Code-split the largest modules.
- Lazy-load chart-heavy and authoring-heavy surfaces.
- Add keyboard and screen-reader checks to key workflows.
- Expand route-sweep and journey tests for role-based paths.

## Ten Selectable Improvement Concepts

| # | Concept | Target | Scope | Risk | Score | Why choose it | Why reject it |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Module Command Centers | Performance, Learning, Expense, then every module | Medium | Low | 9 | Gives every dense module a clear benchmark, workflow health, and next actions | It improves orientation more than underlying data depth |
| 2 | Manager Mission Control | Dashboard, Performance, Learning, Expenses, Time | Large | Medium | 9 | Makes the manager experience feel magical and focused | Requires careful role and data modeling |
| 3 | Employee Self-Service Concierge | Dashboard, mobile, learning, expenses, payslips, support | Large | Medium | 8 | Makes Tempo delightful for everyday employees | Needs more user research and content polish |
| 4 | Ramp-Grade Expense Flow | Expense, Snap, reimbursement, policy rules, finance posting | Medium | Medium | 10 | High-wow workflow with obvious value and demo appeal | Must avoid touching payment/data flows recklessly |
| 5 | Redwood Performance Suite | Performance, compensation, learning, career paths | Large | Medium | 10 | Elevates a flagship enterprise module | Big refactor if done deeply |
| 6 | Sana-Style Learning Home | Learning home, skills, paths, content library, manager nudges | Medium | Low | 9 | Makes learning feel personal and modern | Could be cosmetic if not tied to skills/performance |
| 7 | Joiner/Mover/Leaver Orchestrator | Onboarding, IT, payroll, learning, compliance, offboarding | Large | High | 10 | Makes Tempo feel like Rippling-plus | Cross-module data and permissions need caution |
| 8 | AI Workday Briefing | Dashboard, assistant, analytics, events | Medium | Medium | 8 | Creates a daily "what matters" layer across the platform | Needs strong action routing to avoid being decorative |
| 9 | Executive Board Room | Analytics, board reports, workforce planning, finance | Medium | Low | 7 | Great for buyers and leadership demos | Less useful for daily operators |
| 10 | Trust Layer Everywhere | Errors, empty states, audit logs, checks, tests | Medium | Low | 9 | Raises confidence across the whole platform | Less visibly flashy than new UX |

## Implemented First Batch

Implemented Concept 1 for the three benchmark-critical modules:

- Performance now has a Redwood-inspired command center with cycle readiness, review/goals/1:1/PIP metrics, and direct actions into calibration, 1:1s, and career paths.
- Learning now has a Sana-inspired command center with learning system readiness, course/completion/path/skill-gap metrics, and direct actions into home, skills, and compliance.
- Expense now has a Ramp-inspired command center with expense flow readiness, pending value, active rules, staged receipts, and direct actions into Snap, reports, and policy rules.
- People now has a Rippling/Workday-inspired command center with employee graph readiness, countries, documents, attrition alerts, and direct actions into org chart, documents, and positions.
- Payroll now has a trust-centered payroll command center with health score, pending approvals, pay runs, compliance risks, and direct actions into approvals, reconciliation, and compliance.
- Analytics now has a Visier/Workday-inspired decision command center with headcount, review completion, active learners, pending expenses, and direct actions into workforce, executive, and report-builder views.
- IT Cloud now has a Rippling/Okta-inspired command center with security score, active devices, managed apps, alerts, and direct actions into device health, provisioning, and security.
- Recruiting now has a Greenhouse-inspired command center with open roles, candidates, interviews, offers, and direct actions into pipeline, interviews, and offers.
- Onboarding now has a Rippling/Sana-inspired command center with Day-1 readiness, buddy coverage, task completion, selected modules, and direct actions into first morning, preboarding, and buddy workflows.
- Benefits now has a Rippling/Nava-inspired command center with benefits readiness, active plans, enrollment rate, provider coverage, pending life events, and direct actions into plans, enrollment, and event resolution.
- Time & Attendance now has a UKG/Rippling-inspired command center with workforce time readiness, active employees, pending approvals, weekly overtime, punctuality, and direct actions into timesheets, overtime, and PTO.
- Compensation now has a Pave/Workday-inspired command center with rewards planning readiness, comp bands, below-market risk, pending reviews, equity value, and direct actions into benchmarking, reviews, and planning.
- Offboarding now has a Rippling-inspired leaver command center with access/device/payroll/benefits/document closure, task completion, knowledge transfer, surveys, and direct actions into active exits, checklists, and knowledge capture.
- Compliance now has a Workday/Drata-inspired control command center with requirement coverage, compliance score, critical alerts, pending scans, and direct actions into requirements, alerts, and auto-detection.
- Headcount now has a Workday Adaptive/Rippling-inspired planning command center with planned roles, filled roles, pending approvals, budget usage, and direct actions into positions, approvals, and forecasting.
- Documents now has a DocuSign/Rippling-inspired evidence command center with document count, pending signatures, templates, audit events, and direct actions into documents, templates, and audit trail.
- Workflows now has a Zapier/Rippling-inspired automation command center with active workflows, run volume, success rate, templates, and direct actions into workflow list, builder, and run history.
- Strategy now has a Workday/Betterworks-inspired execution command center with objectives, KR progress, initiatives, KPI tracking, and direct actions into strategy map, OKRs, and KPIs.

This is intentionally a low-risk first PR: it improves orientation, consistency, and cross-module quality language without changing data persistence, auth, billing, migrations, or production integrations.
