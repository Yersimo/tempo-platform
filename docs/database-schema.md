# Tempo Platform Database Schema Documentation

**ORM**: Drizzle ORM
**Database**: Neon PostgreSQL (serverless)
**Connection**: `@neondatabase/serverless` via `src/lib/db/index.ts`
**Schema**: `src/lib/db/schema.ts` (~2900+ lines, 90+ tables)

---

## Table of Contents

- [Data Isolation & RLS](#data-isolation--rls)
- [Naming Conventions](#naming-conventions)
- [Core Tables](#core-tables)
- [Performance Tables](#performance-tables)
- [Compensation Tables](#compensation-tables)
- [Learning Tables](#learning-tables)
- [Engagement Tables](#engagement-tables)
- [Mentoring Tables](#mentoring-tables)
- [Payroll Tables](#payroll-tables)
- [Time & Attendance Tables](#time--attendance-tables)
- [Benefits Tables](#benefits-tables)
- [Expense Tables](#expense-tables)
- [Recruiting Tables](#recruiting-tables)
- [IT & Device Tables](#it--device-tables)
- [Finance Tables](#finance-tables)
- [Strategy & Project Tables](#strategy--project-tables)
- [Workflow Tables](#workflow-tables)
- [Identity & Auth Tables](#identity--auth-tables)
- [Chat Tables](#chat-tables)
- [Document / E-Signature Tables](#document--e-signature-tables)
- [Travel Tables](#travel-tables)
- [Compliance Tables](#compliance-tables)
- [Onboarding & Offboarding Tables](#onboarding--offboarding-tables)
- [Global Workforce Tables](#global-workforce-tables)
- [Platform Admin Tables](#platform-admin-tables)
- [Miscellaneous Tables](#miscellaneous-tables)
- [Entity Relationship Overview](#entity-relationship-overview)

---

## Data Isolation & RLS

Every tenant-scoped table includes an `org_id` column with a foreign key to `organizations.id` with `ON DELETE CASCADE`. Data isolation is enforced at three levels:

1. **Application Level**: All queries include `WHERE org_id = ?` via middleware-injected `x-org-id` header.
2. **Database Level**: Row-Level Security (RLS) uses `SET app.current_org_id` for the connection.
3. **Demo Mode**: Non-UUID org IDs (e.g., `org-1`) bypass DB queries and return empty/demo data.

**Convention**: All monetary amounts are stored in **cents** (integer). For example, `500000` = $5,000.00.

---

## Naming Conventions

- **Table names**: snake_case, plural (`employees`, `payroll_runs`)
- **Column names (DB)**: snake_case (`org_id`, `full_name`)
- **Column names (Drizzle)**: camelCase (`orgId`, `fullName`)
- **Enums**: snake_case values (`not_started`, `in_progress`)
- **Primary keys**: UUID, auto-generated via `defaultRandom()`
- **Timestamps**: `created_at` (always), `updated_at` (on mutable entities)

---

## Core Tables

### organizations
The root tenant entity.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | uuid | PK | Auto-generated |
| name | varchar(255) | No | Organization name |
| slug | varchar(100) | No | URL-safe slug (unique) |
| logo_url | text | Yes | Logo URL |
| plan | org_plan enum | No | `free`, `starter`, `professional`, `enterprise` |
| industry | varchar(255) | Yes | Industry vertical |
| size | varchar(50) | Yes | Size range |
| country | varchar(100) | Yes | Primary country |
| is_active | boolean | No | Default true |
| stripe_customer_id | varchar(255) | Yes | Stripe customer ID |
| onboarding_completed | boolean | No | Default false |
| enabled_modules | jsonb | Yes | string[] of module IDs |
| created_at | timestamp | No | Auto |
| updated_at | timestamp | No | Auto |

### departments
Hierarchical department structure.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | uuid | PK | |
| org_id | uuid | No | FK -> organizations |
| name | varchar(255) | No | Department name |
| parent_id | uuid | Yes | Self-reference for hierarchy |
| head_id | uuid | Yes | FK -> employees (department head) |
| created_at | timestamp | No | |

### employees
Central employee/user record.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | uuid | PK | |
| org_id | uuid | No | FK -> organizations |
| department_id | uuid | Yes | FK -> departments |
| full_name | varchar(255) | No | Display name |
| first_name | varchar(128) | Yes | |
| last_name | varchar(128) | Yes | |
| email | varchar(255) | No | Login email |
| phone | varchar(50) | Yes | |
| avatar_url | text | Yes | |
| job_title | varchar(255) | Yes | |
| level | varchar(100) | Yes | Seniority level |
| country | varchar(100) | Yes | Work country ISO code |
| role | employee_role enum | No | `owner`, `admin`, `hrbp`, `manager`, `employee` |
| manager_id | uuid | Yes | Self-reference |
| hire_date | date | Yes | |
| password_hash | text | Yes | pbkdf2 or legacy demo: format |
| is_active | boolean | No | Default true |
| email_verified | boolean | No | Default false |
| invited_by | uuid | Yes | FK -> employees |
| invitation_token | varchar(500) | Yes | JWT invitation token |
| invitation_expires_at | timestamp | Yes | |
| bank_name | varchar(255) | Yes | For payroll |
| bank_code | varchar(50) | Yes | Sort code / routing number |
| bank_account_number | varchar(100) | Yes | Encrypted at rest |
| bank_account_name | varchar(255) | Yes | Account holder name |
| bank_country | varchar(100) | Yes | May differ from work country |
| mobile_money_provider | varchar(100) | Yes | MTN, M-Pesa, etc. |
| mobile_money_number | varchar(50) | Yes | |
| tax_id_number | varchar(100) | Yes | TIN / KRA PIN |
| termination_date | date | Yes | For final pay calculations |
| created_at | timestamp | No | |
| updated_at | timestamp | No | |

---

## Performance Tables

### goals
Employee goals with OKR cascading support.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | PK |
| org_id | uuid | FK -> organizations |
| employee_id | uuid | FK -> employees |
| title | varchar(500) | Goal title |
| description | text | Detailed description |
| category | goal_category enum | `business`, `project`, `development`, `compliance` |
| status | goal_status enum | `not_started`, `on_track`, `at_risk`, `behind`, `completed` |
| progress | integer | 0-100 |
| start_date, due_date | date | |
| parent_goal_id | uuid | Self-reference for OKR cascading |

### review_cycles
Performance review cycles.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | PK |
| org_id | uuid | FK |
| title | varchar(255) | Cycle name |
| type | review_cycle_type enum | `annual`, `mid_year`, `quarterly`, `probation` |
| status | review_cycle_status enum | `draft`, `active`, `completed` |
| start_date, end_date | date | |

### reviews
Individual performance reviews.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | PK |
| org_id | uuid | FK |
| cycle_id | uuid | FK -> review_cycles |
| employee_id | uuid | FK -> employees |
| reviewer_id | uuid | FK -> employees |
| type | review_type enum | `annual`, `mid_year`, `quarterly`, `probation`, `manager`, `peer`, `self` |
| status | review_status enum | `pending`, `in_progress`, `submitted`, `completed` |
| overall_rating | integer | 1-5 |
| ratings | jsonb | `{ leadership: 4, execution: 5, ... }` |
| comments | text | |

### feedback
Peer feedback and recognition.

| Column | Type | Description |
|--------|------|-------------|
| from_id, to_id | uuid | FK -> employees |
| type | feedback_type enum | `recognition`, `feedback`, `checkin` |
| content | text | |
| is_public | boolean | |

### performance_improvement_plans
PIPs with objectives and check-in tracking.

| Column | Type | Description |
|--------|------|-------------|
| employee_id | uuid | FK |
| created_by | uuid | FK |
| reason | text | |
| status | pip_status enum | `draft`, `active`, `extended`, `completed_success`, `completed_failure`, `cancelled` |
| objectives | jsonb | Array of `{ title, description, targetDate, status, measure }` |
| checkin_frequency | enum | `weekly`, `biweekly`, `monthly` |

### merit_cycles
Compensation merit cycles with budget allocation.

| Column | Type | Description |
|--------|------|-------------|
| type | merit_cycle_type enum | `annual_merit`, `promotion`, `market_adjustment`, `bonus` |
| status | merit_cycle_status enum | `planning` through `completed` |
| total_budget | integer | In cents |
| guidelines_config | jsonb | Rating-to-raise mapping |

### review_templates
Customizable review form templates.

| Column | Type | Description |
|--------|------|-------------|
| type | review_template_type enum | `annual`, `mid_year`, `quarterly`, `probation`, `360`, `self`, `manager`, `peer` |
| sections | jsonb | Array of `{ title, description, questions: [{ text, type, required }] }` |

---

## Compensation Tables

### comp_bands
Compensation bands by role, level, and country.

| Column | Type | Description |
|--------|------|-------------|
| role_title | varchar(255) | |
| level, country | varchar | |
| min_salary, mid_salary, max_salary | integer | Cents |
| p25, p50, p75 | integer | Market percentiles |
| currency | varchar(10) | Default USD |

### salary_reviews
Salary change proposals with approval workflow.

### equity_grants
Equity grant records linked to employees.

---

## Learning Tables

### courses
Course catalog with format and level.

### enrollments
Employee course enrollments with progress.

### learning_paths
Ordered sequences of courses for role-based development.

### course_content
Multi-format content blocks (video, document, slides, quiz, interactive).

### quiz_questions
Quiz questions with options, correct answers, and point values.

### assessment_attempts
Student quiz attempt records with scores.

### auto_enroll_rules
Rules for automatic course enrollment on events (new hire, role change).

### certificates
Completion certificates with expiration tracking.

### content_block_progress
Per-block progress tracking for detailed learning analytics.

### course_prerequisites
Course dependency relationships (required/recommended).

### scorm_packages
SCORM 1.2/2004/xAPI package management.

### scorm_tracking
Per-learner SCORM progress data (lesson status, scores, suspend data).

### content_library
External content from providers (Go1, LinkedIn Learning, Udemy, Coursera).

### learner_badges
Gamification badges earned by employees.

### learner_points
Point system for course completion, quiz scores, streaks.

---

## Engagement Tables

### surveys
Survey definitions (pulse, eNPS, annual, custom).

### engagement_scores
Aggregate engagement scores by department, country, and period.

### survey_templates
Reusable survey templates with question definitions and branching logic.

### survey_schedules
Automated survey scheduling (weekly through annually).

### survey_triggers
Event-driven survey triggers (hire, termination, anniversary, promotion).

### survey_question_branching
Conditional branching logic between questions.

### open_ended_responses
Free-text responses with sentiment analysis.

---

## Mentoring Tables

### mentoring_programs
Programs by type (1:1, group, reverse, peer).

### mentoring_pairs
Mentor-mentee pairings with match scores.

### mentoring_sessions
Session tracking with ratings and notes.

### mentoring_goals
Goals set within mentoring relationships.

---

## Payroll Tables

### payroll_runs
Payroll run header with multi-level approval chain.

| Column | Type | Description |
|--------|------|-------------|
| period | varchar(100) | e.g., "March 2026" |
| status | payroll_status enum | `draft`, `pending_hr`, `pending_finance`, `approved`, `processing`, `paid`, `cancelled` |
| country | varchar(10) | ISO code filters employees |
| total_gross, total_net, total_deductions | integer | Cents |
| currency | varchar(10) | |
| employee_count | integer | |
| approved_by | uuid | FK |

### employee_payroll_entries
Per-employee payroll breakdown.

| Column | Type | Description |
|--------|------|-------------|
| payroll_run_id | uuid | FK |
| employee_id | uuid | FK |
| base_pay, overtime_pay, bonus_pay | integer | Cents |
| federal_tax, state_tax, social_security, medicare, pension | integer | |
| additional_taxes | jsonb | Country-specific taxes |
| garnishments | jsonb | `{ type, amount, caseNumber, priority }[]` |
| benefit_deductions | integer | |
| net_pay | integer | |
| pay_type | varchar | `full_month`, `pro_rata_new`, `pro_rata_exit`, `final_pay`, `maternity`, etc. |
| unpaid_leave_days | real | |

### payroll_approvals
Multi-level approval records (HR level 1, Finance level 2).

### payroll_approval_config
Per-org approval chain configuration.

### payroll_audit_log
Immutable audit trail (UPDATE/DELETE blocked by DB rules).

### contractor_payments
Independent contractor payment records.

### payroll_schedules
Recurring payroll schedule definitions.

### tax_configs
Country-specific tax configuration (rates, employer/employee contributions).

### tax_filings
Tax filing deadlines and status tracking.

---

## Time & Attendance Tables

### leave_requests
Leave request with approval workflow. Types: annual, sick, personal, maternity, paternity, unpaid, compassionate.

### time_entries
Clock in/out records with overtime tracking.

### time_off_policies
Accrual rules (rate, period, max balance, carryover).

### time_off_balances
Current balances per employee per policy.

### overtime_rules
Country-specific overtime thresholds and multipliers.

### shifts
Shift scheduling with swap support.

---

## Benefits Tables

### benefit_plans
Plan catalog (medical, dental, vision, retirement, life, etc.). Costs in cents.

### benefit_enrollments
Employee-plan enrollment records.

### benefit_dependents
Dependent information for benefit coverage.

### life_events
Qualifying life events (marriage, birth) triggering enrollment windows.

### open_enrollment_periods
Annual open enrollment windows.

### cobra_events
COBRA qualifying events and election tracking.

### aca_tracking
ACA compliance: hours tracking, FTE determination, Form 1095 status.

### flex_benefit_accounts
HSA/FSA/commuter accounts with balances and contributions.

### flex_benefit_transactions
Account transactions (contributions, expenses, reimbursements, rollovers).

---

## Expense Tables

### expense_reports
Report headers with status workflow.

### expense_items
Individual line items with receipt URLs and OCR data.

### expense_policies
Category-based policies with approval thresholds.

### receipt_matching
AI receipt verification (amount, vendor, date matching).

### mileage_entries
Mileage tracking with rate calculation.

### advanced_expense_policies
Rule-based policies with conditional actions (block, warn, require approval).

### reimbursement_batches
Batch reimbursement processing.

### reimbursement_items
Individual items within a reimbursement batch.

### duplicate_detection
Flagged duplicate expense items with similarity scores.

---

## Recruiting Tables

### job_postings
Job listings with salary ranges and application counts.

### applications
Candidate applications with multi-stage pipeline status.

### background_checks
Background check records (Checkr, GoodHire, internal).

### referral_programs
Employee referral program configuration.

### referrals
Individual referral submissions with bonus tracking.

### knockout_questions
Auto-screening questions per job posting.

### candidate_scheduling
Self-scheduling with available time slots.

### interview_recordings
Interview recording metadata with AI transcription.

### interview_transcriptions
Full transcription with AI scorecard, sentiment, and topic analysis.

### video_screen_templates, video_screen_invites, video_screen_responses
One-way video screening workflow.

---

## IT & Device Tables

### devices
Physical device inventory (laptop, desktop, phone, tablet).

### software_licenses
Software license tracking with cost and renewal dates.

### it_requests
Help desk tickets (hardware, software, access, support).

### managed_devices
MDM-enrolled devices with compliance status.

### device_actions
Remote device actions (lock, wipe, restart, update, install/remove app).

### app_catalog
Software catalog with license types and costs.

### app_assignments
App-to-employee assignments with installation status.

### security_policies
IT security policies (password, encryption, firewall, OS update, app restriction).

### device_inventory
Warehouse inventory with condition tracking.

### device_store_catalog, device_orders
Internal device ordering system.

---

## Finance Tables

### vendors
Vendor directory with categories and status.

### invoices
Invoice management with vendor linkage.

### budgets
Department budgets by fiscal year.

### corporate_cards
Virtual/physical corporate cards with spend limits.

### card_transactions
Card transaction records with receipt matching.

### card_spend_limits
Category-specific spend limits per card.

### bill_payments
Bill payment processing with multiple methods (ACH, wire, check, virtual card).

### bill_pay_schedules
Recurring bill payment schedules.

### currency_accounts
Multi-currency bank accounts with balances.

### fx_transactions
Foreign exchange conversion records.

### purchase_orders, purchase_order_items
Procurement purchase orders.

### procurement_requests
Employee procurement requests.

---

## Strategy & Project Tables

### strategic_objectives
OKR objectives with progress tracking.

### key_results
Measurable key results linked to objectives.

### initiatives
Strategic initiatives with budgets and timelines.

### kpi_definitions
KPI definitions with frequency and targets.

### kpi_measurements
Periodic KPI measurements.

### projects
Project management with budget tracking.

### milestones
Project milestones.

### tasks
Tasks with priority, assignment, and time estimation.

### task_dependencies
Task dependency relationships.

---

## Workflow Tables

### workflows
Workflow definitions with trigger types (schedule, event, manual, webhook).

### workflow_steps
Individual steps (action, condition, delay, notification, approval).

### workflow_runs
Execution history.

### workflow_templates
Reusable workflow templates.

### automation_workflows
Event-driven automation definitions.

### automation_workflow_steps
Steps with conditional branching (next_step_on_true/false).

### automation_workflow_runs
Automation execution records.

### automation_workflow_run_steps
Per-step execution status within a run.

---

## Identity & Auth Tables

### sessions
User sessions with JWT tokens and expiry.

### mfa_enrollments
TOTP MFA enrollment with backup codes.

### sso_providers
SSO provider configuration (Google, Azure AD, SAML).

### sso_sessions
Active SSO session tracking.

### idp_configurations
Identity provider configurations.

### saml_apps
SAML 2.0 application registrations.

### mfa_policies
Organization MFA policy settings.

---

## Chat Tables

### chat_channels
Channel definitions (direct, group, department, announcement, project, public).

### chat_participants
Channel membership with roles (owner, admin, member) and mute settings.

### chat_messages
Messages with threading, editing, deletion, pinning, file attachments, and mentions.

---

## Document / E-Signature Tables

### signature_documents
Document signing requests with sequential/parallel flow.

### signature_signers
Individual signer records with status and signature data.

### signature_templates
Reusable document templates.

### signature_audit_trail
Complete audit trail (created, sent, viewed, signed, declined, voided).

---

## Travel Tables

### travel_policies
Travel spending policies (flight class, hotel rate, meal limits).

### travel_requests
Travel request with approval workflow.

### travel_bookings
Individual bookings (flight, hotel, car, train) within a request.

---

## Compliance Tables

### compliance_requirements
Regulatory requirements by category and country.

### compliance_documents
Evidence documents with expiry dates.

### compliance_alerts
Automated alerts for deadlines, expirations, and violations.

---

## Onboarding & Offboarding Tables

### buddy_assignments
New hire buddy matching.

### preboarding_tasks
Pre-start tasks and checklists.

### offboarding_checklists
Reusable offboarding checklists.

### offboarding_checklist_items
Items within checklists (categorized: access revocation, device return, etc.).

### offboarding_processes
Active offboarding processes with reason tracking.

### offboarding_tasks
Individual tasks within a process.

### exit_surveys
Exit survey responses (optional anonymity).

---

## Global Workforce Tables

### eor_entities, eor_employees, eor_contracts
Employer of Record management.

### cor_contractors, cor_contracts, cor_payments
Contractor of Record management.

### peo_configurations
PEO provider configuration.

### co_employment_records
Co-employment relationship records.

### global_benefit_plans, country_benefit_configs
Global benefits administration.

### i9_forms
I-9 employment verification forms.

### everify_cases
E-Verify case management.

---

## Platform Admin Tables

### platform_admins
Platform-level administrators (separate from org employees). Roles: `super_admin`, `support`, `viewer`.

### admin_sessions
Admin session management.

### impersonation_log
Audit trail for admin impersonation of employees.

---

## Miscellaneous Tables

### audit_log
Global audit trail. Actions: `create`, `update`, `delete`, `login`, `logout`, `approve`, `reject`.

### notifications
In-app and email notifications with read tracking.

### notification_preferences
Per-employee notification category preferences.

### file_uploads
File upload records with S3/local storage.

### webhook_endpoints
Outbound webhook configurations.

### integrations
Third-party integration configurations (Slack, QuickBooks, etc.).

### integration_logs
Integration sync history.

### custom_field_definitions
Custom field schemas per entity type.

### custom_field_values
Custom field values stored as text, parsed by type.

### emergency_contacts
Employee emergency contact information.

### approval_chains
Reusable multi-level approval chains.

### approval_steps
Individual steps within an approval chain instance.

### sandbox_environments
Isolated testing environments.

### sandbox_snapshots
Environment snapshots for restore.

### headcount_plans, headcount_positions, headcount_budget_items
Headcount planning with budget categories.

### workers_comp_policies, workers_comp_claims, workers_comp_class_codes, workers_comp_audits
Workers' compensation management.

---

## Entity Relationship Overview

```
organizations (root)
  |-- departments (hierarchy via parent_id)
  |-- employees (core user entity)
  |     |-- goals, reviews, feedback (performance)
  |     |-- salary_reviews, equity_grants (compensation)
  |     |-- enrollments (learning)
  |     |-- leave_requests, time_entries, shifts (time)
  |     |-- benefit_enrollments, benefit_dependents (benefits)
  |     |-- expense_reports -> expense_items (expenses)
  |     |-- devices, managed_devices (IT)
  |     |-- it_requests (help desk)
  |     |-- chat_participants -> chat_channels -> chat_messages
  |     |-- notifications, notification_preferences
  |     |-- mfa_enrollments, sessions (auth)
  |     |-- emergency_contacts
  |     |-- custom_field_values
  |     |-- buddy_assignments, preboarding_tasks (onboarding)
  |     |-- offboarding_processes -> offboarding_tasks (offboarding)
  |     |-- signature_signers -> signature_documents (e-sign)
  |     |-- i9_forms -> everify_cases (verification)
  |     |-- corporate_cards -> card_transactions (finance)
  |     |-- travel_requests -> travel_bookings (travel)
  |
  |-- review_cycles -> reviews
  |-- mentoring_programs -> mentoring_pairs -> mentoring_sessions
  |-- surveys -> survey_schedules, survey_triggers
  |-- courses -> course_content -> quiz_questions
  |-- payroll_runs -> employee_payroll_entries, payroll_approvals
  |-- benefit_plans -> benefit_enrollments
  |-- job_postings -> applications -> background_checks, candidate_scheduling
  |-- vendors -> invoices, bill_payments
  |-- budgets (by department)
  |-- projects -> milestones -> tasks -> task_dependencies
  |-- strategic_objectives -> key_results, initiatives
  |-- kpi_definitions -> kpi_measurements
  |-- workflows -> workflow_steps, workflow_runs
  |-- compliance_requirements -> compliance_documents, compliance_alerts
  |-- integrations -> integration_logs, webhook_endpoints
  |-- sso_providers -> sso_sessions
  |-- audit_log (global)
```
