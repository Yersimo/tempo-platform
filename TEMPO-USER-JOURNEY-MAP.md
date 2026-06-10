# Tempo User Journey Map

This map defines the product journeys Tempo must make frictionless. Every journey should have a clear entry point, one obvious next action, a completed outcome, and cross-module follow-through. Use it as the source for QA scenarios, product backlog, and "button promise" checks.

## Core Personas

- Employee: completes personal work without hunting through modules.
- Manager: approves, coaches, plans, and removes blockers for a team.
- HR admin/people ops: configures policies, runs lifecycle operations, and protects compliance.
- Recruiter: opens roles, manages candidates, and converts hires into onboarding.
- Payroll/finance operator: closes payroll, expenses, reimbursements, invoices, cards, and budgets.
- IT admin: provisions devices, apps, identity, passwords, and access.
- Executive/CFO/CHRO: monitors risk, cost, talent, compliance, and board-ready actions.
- Platform admin: manages settings, security, workflows, integrations, data, and sandbox changes.

## Universal Journeys

1. Sign in and land on the right dashboard.
   Entry: login, invite, SSO, demo credential, mobile session.
   Outcome: role-aware dashboard with urgent tasks, metrics, and next actions.

2. Search for anything.
   Entry: global search.
   Outcome: find employee, document, course, expense, candidate, invoice, app, workflow, or setting and jump to the exact record.

3. Act from a dashboard task.
   Entry: task row, AI insight, notification, quick action, command center.
   Outcome: target module opens the exact modal, tab, record, or approval queue.

4. Complete an approval.
   Entry: dashboard, notification, mobile approvals, module queue.
   Outcome: approve, reject, comment, delegate, request info, audit event created, requester notified, downstream module updated.

5. Get help in context.
   Entry: help center, floating assistant, module help, empty state.
   Outcome: answer, guided action, or routed support ticket without leaving the workflow.

## Dashboard

1. Start my day.
   Employee sees tasks, leave balance, payslip, learning, reviews, expenses, team updates, and personal actions.

2. Review team workload.
   Manager sees approvals, absences, reviews, learning gaps, expense reports, timesheets, and team risk.

3. Operate from AI summary.
   User expands insights, understands why each matters, and routes into the source module.

4. Use quick actions.
   Request leave, submit expense, clock in/out, view payslip, continue learning, update goals.

5. Switch dashboard views.
   My overview, my team, my apps, and organization each show role-appropriate actions.

## People

1. View employee profile.
   Search employee, open profile, view role, manager, location, compensation visibility by permission, documents, assets, learning, goals, time, benefits, and history.

2. Add employee.
   Create profile, assign manager, department, location, entity, role, compensation, payroll setup, benefits eligibility, IT needs, onboarding plan.

3. Change employee details.
   Update title, manager, department, location, employment type, salary, permissions, documents; route approvals when sensitive.

4. Manage org chart.
   Inspect structure, drag/reporting changes, simulate org design, publish approved changes.

5. Manage positions.
   Create position, budget role, open requisition, backfill, freeze, close, or connect to headcount plan.

6. Manage team calendar.
   See leave, holidays, travel, onboarding milestones, training, and scheduling conflicts.

7. Manage skills.
   View skills, certify skills, find gaps, recommend learning, staff projects, connect to performance.

8. Build talent marketplace.
   Employee finds gigs/projects; manager posts opportunities; HR tracks mobility.

## Recruiting

1. Open a requisition.
   Create role from headcount or new request, approve budget, define scorecard, publish job.

2. Manage candidates.
   Source, import, screen, advance stages, reject, nurture, and record notes.

3. Schedule interviews.
   Pick panel, availability, interview kit, candidate comms, reminders.

4. Collect feedback.
   Interviewers submit structured feedback, compare scorecards, identify concerns.

5. Make offer.
   Generate offer, route compensation/legal approvals, send to candidate.

6. Convert candidate to employee.
   Accepted offer creates employee, onboarding, payroll, IT, benefits, learning, and documents.

## Onboarding

1. Start preboarding.
   New hire receives welcome, tasks, documents, equipment, learning, buddy, and first-week plan.

2. Complete employee paperwork.
   Personal details, tax, bank, identity, emergency contacts, policy acknowledgements.

3. Provision access and devices.
   IT receives device/app/access tasks, ships or assigns assets, confirms readiness.

4. Complete day-one plan.
   Orientation, manager meeting, first tasks, intro schedule, required learning.

5. Track onboarding progress.
   HR/manager sees blockers, overdue tasks, sentiment, completion, and risk.

6. Finish probation/check-ins.
   30/60/90-day check-ins, feedback, goals, performance checkpoint, conversion decision.

## Time & Attendance

1. Clock in/out.
   Employee clocks in, location/device rules apply, breaks tracked, timesheet updates.

2. Submit timesheet.
   Employee reviews hours, exceptions, overtime, comments, and submits.

3. Approve timesheet.
   Manager sees exceptions, approves/rejects, payroll receives approved hours.

4. Request leave.
   Employee selects type/dates, sees balance/conflicts, submits, manager receives approval.

5. Approve leave.
   Manager sees team calendar, balance, policy, conflicts, approves/rejects, calendar/payroll update.

6. Manage PTO policies.
   HR configures policies, accruals, carryover, country rules, eligibility.

7. Manage shifts and overtime.
   Create schedule, swap shifts, approve overtime, apply rules, send to payroll.

## Expense

1. Submit expense.
   Employee uploads receipt, OCR fills fields, policy check runs, duplicate detection runs, report submits.

2. Review expense.
   Manager/finance sees evidence, policy flags, budget impact, anomaly risk, approves/rejects/comments.

3. Reimburse expense.
   Finance batches approved reports, pays, syncs payroll/ledger, employee sees timeline.

4. Manage receipts.
   Match unmatched receipts, resolve missing evidence, attach to reports.

5. Manage mileage/per diem.
   Employee submits trip, system calculates rate, policy applies, approval routes.

6. Configure expense policy.
   Finance sets limits, receipt thresholds, categories, auto-approval, routing, exceptions.

7. Monitor budgets.
   CFO sees spend by team/category/project, budget pressure, and pending approval impact.

## Payroll

1. Run payroll.
   Payroll operator selects period, validates employees, hours, leave, expenses, benefits, deductions, taxes, and approvals.

2. Resolve payroll exceptions.
   Missing bank, tax, overtime, leave, salary change, benefit deduction, compliance issue.

3. Approve payroll.
   Finance/HR reviews totals, variance, audit trail, approves.

4. Pay employees.
   Submit payment, generate payslips, record status, notify employees.

5. View payslip.
   Employee opens payslip, downloads, sees taxes, deductions, reimbursements.

6. Manage statutory filings.
   Country-specific filings, deadlines, payment confirmations, evidence.

## Benefits

1. Enroll in benefits.
   Employee compares eligible plans, costs, dependents, coverage, confirms elections.

2. Handle life event.
   Employee reports event, uploads evidence, updates elections, HR approves.

3. Administer benefits.
   HR configures plans, eligibility, carriers, costs, enrollment windows.

4. Sync payroll deductions.
   Approved elections update payroll deductions and employer costs.

## Learning

1. Continue course.
   Employee clicks continue and opens the active course player immediately.

2. Start recommended learning.
   System recommends course from role/skills/compliance, enrolls, opens player.

3. Complete course.
   Learn content, quiz, certificate, progress updates, skills/performance records update.

4. Assign learning.
   Manager/HR assigns course/path, due date, reason, reminders.

5. Manage catalog.
   Create/import courses, paths, sessions, SCORM, content providers.

6. Manage compliance learning.
   Track mandatory training, overdue learners, exemptions, evidence, audit readiness.

7. Close skill gaps.
   Skills graph identifies gaps, recommends learning, tracks readiness.

## Performance

1. Set goals.
   Employee/manager creates goals, aligns to company goals, defines metrics and due dates.

2. Update goals.
   Progress updates, blockers, check-ins, comments, attachments.

3. Run review cycle.
   HR launches cycle, employees self-review, managers review, calibration, final sign-off.

4. Give feedback.
   Peer/manager feedback, recognition, notes, private/public visibility.

5. Run one-on-one.
   Agenda, notes, action items, follow-ups, goals, career discussion.

6. Calibrate performance.
   Leaders compare ratings, bias checks, compensation inputs, promotion readiness.

7. Connect to learning/career.
   Gaps route into learning paths, mentorship, talent marketplace, succession plans.

## Compensation

1. Plan salary review.
   HR sets budget, eligibility, guidelines, cycles, compensation bands.

2. Manager proposes changes.
   Manager reviews team comp, performance, market/range, proposes salary/bonus/equity.

3. Calibrate and approve.
   HR/finance reviews budget impact, equity, policy, approvals.

4. Communicate rewards.
   Generate letters, update payroll, notify employees, audit history.

## Engagement, Moments, Mentoring

1. Run survey.
   Create pulse/eNPS, launch, collect responses, analyze themes, create action plan.

2. Recognize employee.
   Send recognition, awards, moments, manager visibility.

3. Match mentor.
   Employee requests mentor, system recommends, mentor accepts, goals and meetings tracked.

4. Manage action plan.
   Team lead owns engagement actions, tracks progress, reports impact.

## Travel

1. Request trip.
   Employee submits destination, dates, purpose, budget, policy check.

2. Approve travel.
   Manager/finance reviews budget, risk, policy, approves.

3. Book and track trip.
   Itinerary, duty of care, visa/compliance, expenses seeded after trip.

4. Convert travel to expense.
   Receipts/itinerary generate expense report and reimbursement flow.

## IT, Apps, Identity, Devices

1. Provision new hire.
   IT receives onboarding tasks, assigns device, apps, groups, identity, passwords.

2. Request app/access.
   Employee requests access, manager/app owner approves, IT provisions, audit logs.

3. Manage device.
   Assign, ship, repair, replace, recover, wipe, retire.

4. Manage identity lifecycle.
   Create user, SSO/MFA, groups, role changes, deprovisioning.

5. Manage passwords/secrets.
   Store, share, rotate, revoke, audit access.

6. Offboard employee.
   Disable apps, recover devices, revoke access, transfer ownership, confirm completion.

## Finance

1. Manage invoices.
   Create/receive invoice, match vendor/customer, approve, pay/collect, sync ledger.

2. Manage bills.
   Capture bill, route approval, schedule payment, reconcile.

3. Manage budgets.
   Create budget, assign owner, track actuals, approve changes, forecast.

4. Manage corporate cards.
   Issue card, set limits, monitor transactions, collect receipts, freeze/terminate.

5. Manage procurement.
   Request purchase, approve, create PO, receive goods, match invoice.

6. Manage revenue.
   Track customers/contracts, invoices, collections, recognition.

7. Manage general ledger.
   Post journal entries, close period, reconcile, export reports.

8. Manage global spend.
   Multi-currency spend visibility, FX, country/entity drill-down, controls.

## Global Workforce, Compliance, Workers' Comp

1. Hire globally.
   Select country/entity/EOR, calculate costs, compliance tasks, onboarding.

2. Manage worker compliance.
   Documents, right-to-work, certifications, training, policy evidence.

3. Handle workers' comp.
   Incident report, claim, documentation, insurer, status, return-to-work plan.

4. Monitor compliance risk.
   Dashboard shows missing evidence, deadlines, controls, owners, remediation.

## Analytics, Strategy, Headcount, Projects

1. Build report.
   Select dataset, filters, metrics, export, schedule, share.

2. View board report.
   CHRO/CFO sees headcount, payroll, retention, performance, learning, spend, risk.

3. Plan headcount.
   Request role, budget approval, connect to recruiting, track open/filled positions.

4. Plan workforce.
   Forecast attrition, cost, capacity, skills, location, scenario impact.

5. Track projects.
   Project staffing, skills, capacity, budget, milestones, team allocation.

6. Track strategy.
   Company objectives, initiatives, owners, progress, risks, board narrative.

## Documents, Workflows, Marketplace, Admin

1. Send document for signature.
   Prepare document, assign signer, send, track, store signed copy.

2. Manage documents.
   Upload, categorize, permission, expiration, acknowledgement, audit.

3. Build workflow.
   Trigger, conditions, approvals, actions, notifications, test, publish.

4. Install integration.
   Marketplace app install, auth, mapping, sync, health, logs.

5. Manage settings/security.
   Roles, permissions, MFA, SSO, audit logs, org settings, data import/export.

6. Use sandbox.
   Test configuration changes, compare, approve, promote to production.

7. Build internal app.
   App Studio creates forms, pages, records, permissions, workflow integration.

## Cross-Module Journeys

1. Hire to onboard to payroll to IT.
   Recruiting offer creates employee, onboarding, payroll profile, benefits eligibility, device/app provisioning, learning assignments.

2. Leave request to payroll.
   Employee requests leave, manager approves, calendar updates, payroll applies paid/unpaid leave.

3. Expense to reimbursement to ledger.
   Employee submits expense, manager/finance approves, reimbursement batch pays, ledger posts.

4. Performance to compensation.
   Review rating and goals feed compensation planning, salary proposal, approval, payroll update.

5. Learning to performance.
   Skills gap creates course recommendation, completion updates readiness and performance notes.

6. Headcount to recruiting to finance.
   Headcount approval reserves budget, opens requisition, hire updates forecast and payroll cost.

7. Onboarding to IT/security.
   New hire tasks provision apps/devices, access reviewed, audit trail complete.

8. Offboarding to payroll/IT/legal.
   Termination triggers final pay, benefits end, access revoke, device recovery, documents.

9. Travel to expense to budget.
   Approved trip creates budget hold, expense report, reimbursement, spend analytics.

10. Compliance to learning/documents.
   Missing compliance evidence triggers required learning, document collection, owner reminders.

## QA Standard For Every Journey

Every journey must pass these checks:

- Entry point exists from dashboard/search/sidebar/notification where appropriate.
- Click opens the exact promised surface, not a generic module homepage.
- Primary action is visible above the fold.
- Empty, loading, success, error, and permission states are handled.
- Data written in one module appears in the downstream module.
- Audit trail/event/notification is created for important actions.
- Role permissions are respected.
- Mobile/tablet layout stays usable.
- No review/demo/experiment copy appears in production UI.
- A browser test covers the happy path and at least one blocked/error path for critical workflows.
