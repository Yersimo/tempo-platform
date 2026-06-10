# Tempo Persona and UI Assessment

Date: 2026-06-10
Scope: actual Tempo platform application surfaces, not marketing pages.
Basis: current app routes, `TEMPO-USER-JOURNEY-MAP.md`, existing Playwright journey tests, and the workflow fixes in PR #31.

## Executive Assessment

Tempo has strong product breadth and enough real surfaces to demonstrate a credible HR/finance/IT operating platform. The current weakness is not lack of modules. The weakness is end-to-end workflow completion: too many surfaces still feel like dashboards, control rooms, or feature showcases before they feel like a task can be completed in one obvious path.

Overall platform rating today: 6.5/10.

What is good:

- Broad module coverage is unusually strong: HRIS, payroll, time, expense, learning, performance, onboarding, IT, identity, finance, analytics, workflows.
- Visual system is mostly consistent after the recent production cleanup.
- The best modules now show strong command-center patterns: Expense, Learning, Performance, Dashboard.
- PR #31 fixes an important class of product failure: dashboard actions now route into exact work surfaces for leave, expense review, expense submission, and learning continuation.

What is not good enough yet:

- Many workflows expose useful data but do not finish the job.
- Role/persona experiences are not yet sufficiently distinct.
- Several modules still depend on generic tabs instead of guided task flows.
- Performance is a risk because broad pages carry many controls and data sections.
- Cross-module handoffs exist conceptually, but not all of them are visible, tested, and trustworthy.

## Persona Scorecard

| Persona | Current score | Confidence | Honest assessment |
| --- | ---: | --- | --- |
| Employee | 7/10 | Medium | The employee can see common work and now some dashboard actions route properly. Still needs more direct completion for payslips, benefits, leave status, expense status, and learning. |
| Manager | 6.5/10 | Medium | Manager dashboards and approval concepts are present. The experience needs stronger queues: approve leave, approve expense, review timesheets, run one-on-one, complete reviews, assign learning. |
| HR admin | 6.5/10 | Medium | HR breadth is strong: people, onboarding, offboarding, engagement, compensation. The gap is guided lifecycle execution and confidence that downstream IT/payroll/learning tasks really fired. |
| Payroll operator | 6/10 | Medium | Payroll has credible surfaces, but the close process must feel stricter: exceptions, approval, finalization, payslip generation, statutory evidence, and audit should be one controlled flow. |
| Finance operator/CFO | 6.5/10 | Medium | Expense has the strongest improvement path and feels closest to Ramp-grade. Finance modules need the same level of guided action across budgets, invoices, cards, bill pay, procurement, and ledger. |
| IT admin | 6/10 | Medium | IT, devices, apps, identity, and passwords exist, but the flow must become more operational: request, approval, provisioning, status, evidence, recovery, deprovisioning. |
| Executive/CHRO | 6/10 | Low-Medium | Executive overview exists through dashboards/analytics, but board-ready synthesis still needs stronger causal explanations and click-through into source work. |
| Platform admin | 6.5/10 | Medium | Workflows, App Studio, settings, sandbox, marketplace are compelling, but admin safety, preview, permission effects, and publish/rollback clarity need more QA. |

## Common Module Assessment

### Dashboard

Score: 7.5/10.

Strengths:

- Clear personal overview.
- Current tasks and quick actions create the right mental model.
- PR #31 improves core action routing.

Gaps:

- Dashboard needs a universal rule: every task row must deep-link to the exact modal, queue, record, or tab.
- AI summary cards must explain source data and route to source records.
- Manager/team view needs stronger prioritization and less generic text.

Priority fixes:

- Extend PR #31 routing pattern to Performance reviews, payroll exceptions, onboarding blockers, benefits enrollment, and IT requests.
- Add Playwright coverage for each dashboard task promise.

### People

Score: 6.5/10.

Strengths:

- Directory and profile concepts are present.
- Org chart, org design, positions, skills, mentoring, and talent marketplace create strong breadth.

Gaps:

- Profile should be the canonical employee operating record, but many downstream actions still feel module-scattered.
- Add/edit/import flows need tighter validation, confirmation, and next-step routing.

Priority fixes:

- From profile, make actions explicit: change manager, change compensation, start onboarding/offboarding, assign learning, issue device, view payroll status.
- Add profile journey tests for employee, manager, and HR admin permissions.

### Time & Attendance

Score: 7/10 after PR #31.

Strengths:

- Leave request modal exists.
- PTO, timesheets, scheduling, overtime, and analytics are present.
- PR #31 deep-links dashboard Request Leave and review tasks.

Gaps:

- Leave flow needs visible policy conflict, balance impact, approval route, and post-submit tracking.
- Timesheet approval needs a more obvious manager queue and payroll handoff.

Priority fixes:

- Add end-to-end test: request leave -> manager approves -> leave balance/calendar updates.
- Add end-to-end test: submit timesheet -> approve -> payroll input visible.

### Expense

Score: 7/10 after PR #31.

Strengths:

- Expense is one of the strongest modules.
- Approval cockpit, policy evidence, receipt management, reimbursement, budgets, and controls point in the right direction.
- PR #31 deep-links Submit Expense and Review Expense Reports.

Gaps:

- The user needs one primary Ramp-grade submit path: snap/upload receipt, confirm fields, submit, track approval, reimbursement timeline.
- Finance needs one primary review path: evidence, policy, budget, anomaly risk, approve/reject, reimbursement.

Priority fixes:

- Complete one polished employee submit-expense path.
- Complete one polished finance approve-and-reimburse path.
- Add test: submit report -> approve -> reimburse -> ledger/payroll event visible.

### Learning

Score: 7/10 after PR #31.

Strengths:

- Learning has strong Sana-style direction: mission control, recommendations, skills graph, compliance, catalog, course player.
- PR #31 fixes the high-friction Continue problem.

Gaps:

- Learning must reduce admin density for employees. Employee home should prioritize one next course, one required item, one skill gap.
- Manager assignment and compliance tracking need clearer completion and evidence loops.

Priority fixes:

- Add test: continue course -> complete lesson -> progress updates -> certificate or next step appears.
- Add test: manager assigns learning -> employee sees it -> completion updates manager view.

### Performance

Score: 6.5/10.

Strengths:

- Goals, feedback, reviews, recognition, calibration, and career paths are represented.
- Redwood-inspired cockpit direction is good.

Gaps:

- Review-cycle completion should be a guided flow, not just a module surface.
- Dashboard task `?action=reviews` should deep-link into the correct review queue.
- One-on-one, feedback, goal update, and review flows need tighter start-to-finish tests.

Priority fixes:

- Implement Performance deep-link handling from dashboard.
- Add tests: create/update goal, give feedback, complete review, run one-on-one.

### Onboarding

Score: 6/10.

Strengths:

- New hire lifecycle concepts are present.
- Onboarding integrates naturally with people, learning, documents, IT, and payroll.

Gaps:

- It must become a guided launch flow: select hire, choose template, assign tasks, provision IT, collect documents, track blockers.
- Current experience needs clearer "start onboarding now" and "this is blocked by X" states.

Priority fixes:

- Add guided onboarding launch path.
- Add test: candidate/new employee -> onboarding plan -> IT task -> learning task -> completion state.

### Payroll

Score: 6/10.

Strengths:

- Payroll surfaces, payslips, statutory settings, and payroll concepts exist.

Gaps:

- Payroll must feel high-control and audit-grade. A payroll operator should see a close checklist, exceptions, variances, approvals, payment readiness, and payslip publication in order.

Priority fixes:

- Add payroll close command center.
- Add test: review exceptions -> approve payroll -> publish payslips.

### Benefits

Score: 6/10.

Strengths:

- Benefits enrollment concepts are present.

Gaps:

- Employee comparison/enrollment must be simplified.
- Life events need a guided path with evidence and approval.

Priority fixes:

- Add employee benefits wizard.
- Add test: enroll/change plan -> HR approves -> payroll deduction visible.

### IT, Apps, Devices, Identity

Score: 6/10.

Strengths:

- The module coverage is credible.
- Identity, apps, devices, password manager, marketplace, and IT Cloud create a strong Rippling-like scope.

Gaps:

- The flow must become operational: request -> approve -> provision -> verify -> audit.
- IT modules should connect visibly to onboarding/offboarding.

Priority fixes:

- Add IT request/provisioning queue.
- Add tests: new hire device/app provisioning and offboarding access revocation.

### Finance Beyond Expense

Score: 5.5/10.

Strengths:

- Finance route coverage is broad: invoices, budgets, cards, bill pay, global spend, ledger, procurement, revenue, transfer pricing.

Gaps:

- These modules need fewer generic dashboards and more primary action flows.
- The product should show how HR/payroll/expense data affects finance operations.

Priority fixes:

- Pick one finance workflow after Expense: corporate card controls or invoice approval.
- Build it to the same standard as Expense.

## UI/UX Assessment

What works:

- Visual style is now more coherent after removing review/experiment surfaces from production.
- The left navigation gives a strong all-in-one platform impression.
- Cards, tabs, badges, and command centers are consistent enough to build on.

What needs work:

- Too many pages have high information density without a clear primary action.
- Some pages read like feature inventory instead of a workflow.
- Personas need sharper defaults: employee should not see admin density; manager should see queues; finance should see controls; IT should see operational state.
- Deep links and stateful routing must become a platform primitive.
- Empty states should guide setup and not just say no data.

## Testing Assessment

Existing useful coverage:

- Route sweep coverage.
- Journey experience assessment.
- Flagship workflow smoke tests.
- PR #31 action deep-link regression.
- Unit test suite and TypeScript check.

Testing gaps:

- Persona-specific authentication is not broad enough. Many tests use the same owner/demo user.
- Most tests verify page presence, not full workflow completion.
- Cross-module handoffs are under-tested.
- Mobile/tablet journeys need deeper coverage.
- Production real-env tests remain limited by credentials and secrets.

## Priority Order

1. Merge PR #31 after approval because it fixes a real product class: dashboard promise -> exact work surface.
2. Apply the same deep-link action pattern to Performance, Onboarding, Payroll, Benefits, IT, and People profile actions.
3. Build workflow-completion tests, not only page-load tests.
4. Make employee/manager/admin experiences role-specific.
5. Reduce page density by making every module choose one primary next action per persona.
6. Complete cross-module lifecycle tests: hire, onboard, provision, pay, learn, review, reimburse, offboard.

## Bottom Line

Tempo is not yet "perfect" or fully Rippling-grade. It is a broad, credible platform with several strong modules and a clear path to becoming excellent. The next work should not add more modules. The next work should make the existing modules complete the jobs they promise, persona by persona, with tests proving each journey works.
