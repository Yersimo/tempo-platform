# Tempo User Journey Experience Assessment

Date: 2026-05-22

This document defines the practical user journeys Tempo needs to satisfy for a client-demo-ready enterprise platform. The assessment lens is deliberately user-centered: did the user understand what to do, move without friction, trust the result, and feel that Tempo helped them do meaningful work faster?

## Assessment Rubric

Each journey is assessed from 1 to 10 using six dimensions:

| Dimension | What Good Looks Like |
|---|---|
| UX clarity | The page explains itself without training or internal product knowledge. |
| UI quality | The interface feels composed, premium, aligned, and consistent with the Nordic enterprise system. |
| Speed | The route loads within 5 seconds in production mode, ideally under 3 seconds. |
| No friction | The primary action is visible, forms give feedback, navigation is predictable, and there are no dead ends. |
| Usefulness | The journey answers a real work question or helps complete an operational task. |
| Delight | The user feels calmer, smarter, and more confident than before they opened the page. |

## Journey Catalog

### Buyer And Public Site

| Journey | Route | Expected Outcome | Delight Question |
|---|---|---|---|
| Evaluate the platform | `/` | Buyer understands Tempo as an enterprise people and operations platform. | “Do I believe this company is serious?” |
| Compare pricing | `/pricing` | Buyer understands package direction and how to proceed. | “Is the buying path clear?” |
| Assess security | `/security` | Buyer sees credible security/compliance language. | “Would I send this to IT/security?” |
| Request a demo | `/demo-request` | Buyer can request a demo without form anxiety. | “Was this easy enough to complete now?” |
| Explore product pillars | `/products/hr`, `/products/payroll`, `/products/finance`, `/products/it`, `/products/ai`, `/products/platform` | Buyer can understand breadth without feeling scattered. | “Does this feel integrated?” |
| Academy discovery | `/academy` | Learning product feels premium and credible. | “Does this feel like a modern learning platform?” |

### Auth And Access

| Journey | Route | Expected Outcome | Delight Question |
|---|---|---|---|
| Log in | `/login` | User can enter securely and quickly. | “Do I trust this?” |
| Sign up | `/signup` | New user understands how to start. | “Is the next step obvious?” |
| Reset password | `/reset-password` | User can recover access calmly. | “Did this reduce panic?” |
| Demo account selection | `/demo` | Evaluator can select a realistic persona. | “Can I test the right scenario?” |

### Employee Self-Service

| Journey | Route | Expected Outcome | Delight Question |
|---|---|---|---|
| Start the day | `/dashboard` | Employee sees priorities, shortcuts, and relevant status. | “Do I know what needs attention?” |
| Find people | `/people` | Employee can search and understand the organization. | “Can I find the right person quickly?” |
| View profile | `/people/[id]` | Employee record feels complete, trustworthy, and actionable. | “Is the person/context clear?” |
| Request leave | `/time-attendance` | Employee sees balance, requests time off, and tracks approval. | “Did I avoid asking HR?” |
| Track attendance | `/time-attendance` | Employee can clock, review timesheets, and understand exceptions. | “Is my time status clear?” |
| Submit expense | `/expense` | Employee submits expenses and understands reimbursement status. | “Do I trust what happens next?” |
| Manage benefits | `/benefits` | Employee compares plans, manages dependents, and enrolls. | “Do benefits finally make sense?” |
| Learn a skill | `/learning` | Employee discovers, enrolls, progresses, and earns certificates. | “Does learning feel curated?” |
| View pay | `/payslips`, `/payroll` | Employee understands pay, deductions, and records. | “Can I answer my pay question myself?” |
| Ask HR | `/chat`, command center | Employee can ask, search, and act without opening tickets. | “Did I get unstuck?” |

### Manager

| Journey | Route | Expected Outcome | Delight Question |
|---|---|---|---|
| Manage team health | `/dashboard` | Manager sees team status, approvals, and risks. | “Can I lead from here?” |
| Approve leave/time | `/time-attendance` | Manager reviews and acts on requests. | “Was approval fast but controlled?” |
| Approve expenses | `/expense` | Manager can review policy context and approve/reject. | “Can I make a confident decision?” |
| Manage performance | `/performance` | Manager handles goals, feedback, 1:1s, reviews, and calibration. | “Does this help me coach better?” |
| Hire talent | `/recruiting` | Manager sees jobs, candidates, interviews, and offers. | “Is hiring progress visible?” |
| Read analytics | `/analytics` | Manager can interpret workforce trends and reports. | “Did this help me think?” |

### HR And People Operations

| Journey | Route | Expected Outcome | Delight Question |
|---|---|---|---|
| Manage employee records | `/people` | HR can add, edit, import, export, and validate employee data. | “Does the HRIS feel dependable?” |
| Build org structure | `/people/org-chart`, `/people/org-design`, `/groups` | HR can understand teams, reporting lines, and structures. | “Can I explain the org?” |
| Run onboarding | `/onboarding`, `/journeys` | HR can start onboarding and track readiness. | “Does a new hire feel guided?” |
| Run offboarding | `/offboarding` | HR can manage exit tasks, access, final pay, and knowledge transfer. | “Does a sensitive process feel safe?” |
| Run engagement | `/engagement`, `/moments` | HR can measure sentiment and drive action. | “Does employee voice turn into work?” |
| Manage learning academy | `/learning`, `/academies` | HR can create and manage courses, paths, cohorts, and analytics. | “Does this approach Sana-class learning?” |
| Manage compensation | `/compensation` | HR can review bands, rewards, merit, and fairness. | “Are comp decisions structured?” |
| Manage compliance | `/compliance`, `/settings/compliance` | HR can track controls, policies, and findings. | “Can I defend this in an audit?” |

### Payroll And Finance

| Journey | Route | Expected Outcome | Delight Question |
|---|---|---|---|
| Run payroll | `/payroll` | Payroll can create, review, approve, export, and audit pay runs. | “Would I trust this for payroll day?” |
| Manage statutory rules | `/payroll/statutory` | Payroll can inspect country rules and deductions. | “Is country complexity under control?” |
| Manage benefits cost | `/benefits` | Finance and HR can see plan cost and enrollment impact. | “Is cost visible before commitment?” |
| Manage invoices | `/finance/invoices` | Finance can track invoice lifecycle and payments. | “Is cash status visible?” |
| Manage budgets | `/finance/budgets` | Finance can compare actuals, forecast, and variance. | “Can I explain overspend?” |
| Control card spend | `/finance/cards` | Finance can monitor limits, transactions, and anomalies. | “Is spend controlled?” |
| Manage vendors/procurement | `/finance/vendors`, `/finance/procurement` | Finance can handle vendors and purchase workflows. | “Can ops and finance work in one place?” |

### IT And Security Operations

| Journey | Route | Expected Outcome | Delight Question |
|---|---|---|---|
| Operate IT command center | `/it-cloud` | IT sees devices, apps, requests, access, and risks. | “Is IT as integrated as HR?” |
| Manage devices | `/it/devices` | IT assigns, secures, maintains, and retires devices. | “Is the asset story audit-ready?” |
| Manage apps/licenses | `/it/apps`, `/apps` | IT can provision access and track utilization. | “Can onboarding/offboarding touch access?” |
| Manage identity | `/identity` | Admins understand SSO, SCIM, sessions, and access. | “Would IT trust this?” |
| Manage passwords | `/password-manager` | Teams can handle vault/security workflows. | “Is sensitive access controlled?” |

### AI, Automation, Analytics, And Creation

| Journey | Route | Expected Outcome | Delight Question |
|---|---|---|---|
| Ask Tempo command center | Global command center | User can search, ask, navigate, generate, and execute actions. | “Did AI actually do work?” |
| Generate reports | `/analytics`, `/analytics/reports`, `/analytics/board-reports` | User can create useful insights and narratives. | “Did the platform make me smarter?” |
| Predict risk | `/analytics/predictions` | User can inspect attrition, payroll, expense, or workforce risk. | “Did I see what to do next?” |
| Build automations | `/workflow-studio`, `/workflows` | User can create workflow logic from templates or natural language. | “Can I build without engineering?” |
| Build internal apps | `/app-studio` | Admin can create app-like workflows and iterate. | “Does this feel like a creation loop?” |

### Admin And Configuration

| Journey | Route | Expected Outcome | Delight Question |
|---|---|---|---|
| Configure organization | `/settings` | Admin can manage org settings, users, theme, locale, and permissions. | “Can I set this up for a client?” |
| Configure security | `/settings/security` | Admin can control security and identity posture. | “Can I satisfy enterprise review?” |
| Import data | `/settings/import` | Admin can bring data in with mapping and validation. | “Can migration start without chaos?” |
| Platform admin | `/admin`, `/admin/organizations`, `/admin/users`, `/admin/monitoring` | Platform operators can manage tenants and monitor health. | “Can Tempo operate many clients?” |

## Automated Testing Strategy

The product is tested in four layers:

1. Route reliability sweep: public and authenticated surfaces load on desktop and mobile, no fatal console/page errors.
2. Critical lifecycle journeys: onboarding, recruiting, promotion, parental leave, feedback, learning, internal mobility, HR question, manager workflow, offboarding.
3. Flagship visual QA: Dashboard, People, Payroll, Learning, Expense, IT, Recruiting, Performance, Analytics, Settings on desktop and mobile.
4. Journey experience assessment: persona-based routes scored on clarity, useful actions, speed, overflow, console health, and interaction density.

## Current Assessment Status

The latest automated run should be interpreted this way:

| Test Layer | What It Proves |
|---|---|
| `npm run build` | The production app compiles and all routes can be statically analyzed. |
| `npm run test` | Core business logic, payroll, tax, RBAC, validations, AI engine, LMS, approval logic, and compliance tests pass. |
| `e2e/journeys` | The 10 major lifecycle journeys are usable end to end. |
| `e2e/route-sweep.spec.ts` | Public and authenticated routes load without fatal errors on desktop and mobile. |
| `e2e/flagship-visual.spec.ts` | The most important product modules pass responsive screenshot QA. |
| `e2e/ai-command-center.spec.ts` | AI command center can execute an operational request, not only search. |
| `e2e/journey-experience-assessment.spec.ts` | Key persona journeys meet a measurable 8/10 UX bar. |

## How A User Would Assess Delight

A delighted user would say:

- “I knew what to do immediately.”
- “The interface felt calm and premium.”
- “I did not need to ask HR, finance, IT, or an admin for a simple answer.”
- “The system anticipated the next step.”
- “I trusted the result because status, ownership, and audit trail were visible.”
- “AI helped me act, not just chat.”

A non-delighted user would notice:

- Missing next steps.
- Tables without useful actions.
- Forms without validation or feedback.
- Empty states that feel broken.
- Slow page loads.
- Inconsistent navigation or controls.
- AI answers that do not execute or connect to real data.

## Honest Product Bar

Tempo is not “10/10” because a document says so. It is 10/10 only when the journey tests stay green and manual review confirms the screens feel premium, useful, and coherent. The automated bar now covers reliability and broad UX signals; the remaining highest-value work is deeper manual comparison against Sana/Replit/Rippling quality for the most important flagship flows.
