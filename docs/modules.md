# Tempo Platform Module Documentation

Tempo is a unified workforce platform with 46+ modules organized across 8 categories. Each module has a dedicated page, DB-backed state, and lazy-loading via the module data system.

---

## Table of Contents

- [Module Architecture](#module-architecture)
- [People Modules](#people-modules)
- [Operations Modules](#operations-modules)
- [Finance Modules](#finance-modules)
- [IT Modules](#it-modules)
- [Recruiting Modules](#recruiting-modules)
- [Strategy & Projects](#strategy--projects)
- [Platform Modules](#platform-modules)
- [Global Workforce](#global-workforce)

---

## Module Architecture

### State Management

All module data flows through a centralized React Context store (`src/lib/store.tsx`). Key patterns:

1. **Lazy Loading**: Pages call `ensureModulesLoaded(['key1', 'key2'])` in a `useEffect` to load only the data they need.
2. **Module Slug Mapping**: `MODULE_SLUGS` in `src/lib/hooks/use-module-data.ts` maps camelCase store keys to kebab-case API slugs.
3. **API Route**: `GET /api/data/:module` provides paginated, org-scoped data for any registered module.
4. **Demo Fallback**: When the API is unavailable, pages fall back to code-split demo data from `src/lib/demo-data.ts`.
5. **Caching**: Client-side cache with 5-minute TTL prevents redundant API calls.
6. **Transform**: API responses are transformed from Drizzle camelCase to snake_case for UI consumption.

### Adding a New Module

1. Define the DB table in `src/lib/db/schema.ts`
2. Add to `MODULE_CONFIG` in `src/app/api/data/[module]/route.ts`
3. Add to `MODULE_SLUGS` in `src/lib/hooks/use-module-data.ts`
4. Add state and setter to `TempoState` interface in `src/lib/store.tsx`
5. Add demo data in `src/lib/demo-data.ts`
6. Create the page at `src/app/(platform)/your-module/page.tsx`

---

## People Modules

### 1. People / Employee Directory
- **Route**: `/people`
- **Store Keys**: `employees`, `departments`
- **DB Tables**: `employees`, `departments`
- **Features**:
  - Employee profiles with avatar, job title, level, country
  - Department hierarchy with parent departments
  - Manager relationships
  - Active/inactive status management
  - Custom field support
  - Emergency contacts
  - Banking details for payroll
  - Profile shape: `{ id, org_id, department_id, job_title, level, country, role, profile: { full_name, email, avatar_url, phone } }`

### 2. Performance
- **Route**: `/performance`
- **Store Keys**: `goals`, `reviewCycles`, `reviews`, `feedback`, `competencyFramework`, `competencyRatings`, `oneOnOnes`, `recognitions`, `pips`, `pipCheckIns`, `meritCycles`, `meritRecommendations`, `reviewTemplates`
- **DB Tables**: `goals`, `review_cycles`, `reviews`, `feedback`, `performance_improvement_plans`, `pip_check_ins`, `merit_cycles`, `merit_recommendations`, `review_templates`
- **Features**:
  - Goal management with OKR cascading (parent/child goals)
  - SMART goal scoring (via AI)
  - Review cycles (annual, mid-year, quarterly, probation)
  - Multi-type reviews (self, manager, peer, 360)
  - Feedback and recognition
  - 1:1 meeting tracking
  - Competency frameworks and ratings
  - Performance Improvement Plans (PIPs) with check-ins
  - Merit cycles with budget allocation
  - Review templates (customizable sections and questions)
  - AI bias detection in ratings

### 3. Compensation
- **Route**: `/compensation`
- **Store Keys**: `compBands`, `salaryReviews`, `equityGrants`, `compPlanningCycles`
- **DB Tables**: `comp_bands`, `salary_reviews`, `equity_grants`, `merit_cycles`
- **Features**:
  - Compensation bands by role, level, and country
  - Percentile data (P25, P50, P75)
  - Salary review workflows (draft, pending, approved, rejected)
  - Equity grant management
  - Compensation planning cycles

### 4. Learning
- **Route**: `/learning`
- **Store Keys**: `courses`, `enrollments`, `learningPaths`, `liveSessions`, `courseBlocks`, `quizQuestions`, `discussions`, `studyGroups`, `complianceTraining`, `autoEnrollRules`, `assessmentAttempts`, `learningAssignments`, `coursePrerequisites`, `scormPackages`, `scormTracking`, `contentLibrary`, `learnerBadges`, `learnerPoints`, `certificateTemplates`
- **DB Tables**: `courses`, `enrollments`, `learning_paths`, `course_content`, `quiz_questions`, `assessment_attempts`, `auto_enroll_rules`, `certificates`, `content_block_progress`, `course_prerequisites`, `scorm_packages`, `scorm_tracking`, `content_library`, `learner_badges`, `learner_points`
- **Features**:
  - Course catalog (online, classroom, blended)
  - Multi-format content (video, document, slides, quiz, interactive)
  - Learning paths with ordered courses
  - Quiz engine with scoring
  - SCORM 1.2/2004 and xAPI support
  - Content library (Go1, LinkedIn Learning, Udemy Business, Coursera)
  - Gamification (badges, points, leaderboards)
  - Certificate generation
  - Auto-enrollment rules (by department, role, event)
  - Compliance training tracking
  - Course prerequisites

### 5. Engagement
- **Route**: `/engagement`
- **Store Keys**: `surveys`, `engagementScores`, `actionPlans`, `surveyResponses`, `surveyTemplates`, `surveySchedules`, `surveyTriggers`, `openEndedResponses`
- **DB Tables**: `surveys`, `engagement_scores`, `survey_templates`, `survey_schedules`, `survey_triggers`, `survey_question_branching`, `open_ended_responses`
- **Features**:
  - Survey types: pulse, eNPS, annual, custom, DEI
  - Anonymous survey support
  - Question types: rating, text, multiple choice, NPS, matrix
  - Question branching logic
  - Survey scheduling (weekly, monthly, quarterly)
  - Event-triggered surveys (hire, termination, anniversary)
  - Engagement scores by department and country
  - Open-ended response sentiment analysis
  - Action plan tracking

### 6. Mentoring
- **Route**: `/mentoring`
- **Store Keys**: `mentoringPrograms`, `mentoringPairs`, `mentoringSessions`, `mentoringGoals`
- **DB Tables**: `mentoring_programs`, `mentoring_pairs`, `mentoring_sessions`, `mentoring_goals`
- **Features**:
  - Program types: 1:1, group, reverse, peer
  - Mentor-mentee matching with match scores
  - Session scheduling and tracking
  - Goal setting and progress tracking
  - Session ratings and notes

### 7. Onboarding
- **Route**: `/onboarding`
- **Store Keys**: `buddyAssignments`, `preboardingTasks`
- **DB Tables**: `buddy_assignments`, `preboarding_tasks`
- **Features**:
  - Buddy matching with compatibility scores
  - Preboarding task management
  - Task categories and due dates
  - Status tracking

### 8. Offboarding
- **Route**: `/offboarding`
- **Store Keys**: `offboardingChecklists`, `offboardingProcesses`, `offboardingTasks`, `exitSurveys`, `offboardingChecklistItems`
- **DB Tables**: `offboarding_checklists`, `offboarding_checklist_items`, `offboarding_processes`, `offboarding_tasks`, `exit_surveys`
- **Features**:
  - Customizable checklists (access revocation, device return, knowledge transfer, exit interview, final pay, benefits, documents)
  - Process tracking by reason (resignation, termination, layoff, retirement, end of contract)
  - Task assignment and completion
  - Exit surveys with anonymous option

---

## Operations Modules

### 9. Payroll
- **Route**: `/payroll`
- **Store Keys**: `payrollRuns`, `employeePayrollEntries`, `contractorPayments`, `payrollSchedules`, `taxConfigs`, `complianceIssues`, `taxFilings`, `payrollApprovals`, `payrollApprovalConfig`
- **DB Tables**: `payroll_runs`, `employee_payroll_entries`, `contractor_payments`, `payroll_schedules`, `tax_configs`, `tax_filings`, `payroll_approvals`, `payroll_approval_config`, `payroll_audit_log`
- **Features**:
  - Multi-country payroll processing (Nigeria, Kenya, Ghana, US, UK, and more)
  - Multi-level approval chain (HR then Finance)
  - Pay stub generation (PDF)
  - Tax calculation engine
  - Bank file export (NIBSS, RTGS, BACS, ACH, CSV)
  - Contractor payment management
  - Tax filing tracking
  - Payroll schedules (weekly, bi-weekly, monthly)
  - Immutable audit log
  - Currency conversion
  - Reconciliation reports
  - Year-end tax certificates (Kenya P9, Nigeria H1, Ghana PAYE)
  - Amounts stored in cents

### 10. Payslips
- **Route**: `/payslips`
- **Features**: Employee-facing view of pay history and downloadable pay stubs

### 11. Time & Attendance
- **Route**: `/time-attendance`
- **Store Keys**: `leaveRequests`, `timeEntries`, `timeOffPolicies`, `timeOffBalances`, `overtimeRules`, `shifts`
- **DB Tables**: `leave_requests`, `time_entries`, `time_off_policies`, `time_off_balances`, `overtime_rules`, `shifts`
- **Features**:
  - Leave management (annual, sick, personal, maternity, paternity, unpaid, compassionate)
  - Leave approval workflow
  - Time entry tracking (clock in/out)
  - Time-off policies with accrual rules (monthly, quarterly, annually)
  - Balance tracking with carryover
  - Overtime rules by country
  - Shift scheduling and swapping
  - Geofencing support

### 12. Benefits
- **Route**: `/benefits`
- **Store Keys**: `benefitPlans`, `benefitEnrollments`, `benefitDependents`, `lifeEvents`, `openEnrollmentPeriods`, `cobraEvents`, `acaTracking`, `flexBenefitAccounts`, `flexBenefitTransactions`
- **DB Tables**: `benefit_plans`, `benefit_enrollments`, `benefit_dependents`, `life_events`, `open_enrollment_periods`, `cobra_events`, `aca_tracking`, `flex_benefit_accounts`, `flex_benefit_transactions`
- **Features**:
  - Plan types: medical, dental, vision, retirement, life, disability, wellness, HSA, FSA, commuter, voluntary
  - Dependent management
  - Life event processing (marriage, birth, etc.)
  - Open enrollment periods
  - COBRA administration
  - ACA compliance tracking (Form 1095)
  - Flex benefit accounts (HSA, FSA, commuter)

### 13. Expense Management
- **Route**: `/expense`
- **Store Keys**: `expenseReports`, `expensePolicies`, `mileageLogs`, `receiptMatches`, `mileageEntries`, `advancedExpensePolicies`, `reimbursementBatches`, `duplicateDetections`
- **DB Tables**: `expense_reports`, `expense_items`, `expense_policies`, `receipt_matching`, `mileage_entries`, `advanced_expense_policies`, `reimbursement_batches`, `reimbursement_items`, `duplicate_detection`
- **Features**:
  - Expense report creation and submission
  - Multi-level approval workflow
  - Receipt OCR via Claude Vision AI
  - Receipt matching and verification
  - Mileage tracking (personal/company vehicle)
  - Expense policies with auto-approve thresholds
  - Advanced policy rules
  - Reimbursement batch processing
  - Duplicate detection
  - Per-diem support

### 14. Compliance
- **Route**: `/compliance`
- **Store Keys**: `complianceRequirements`, `complianceDocuments`, `complianceAlerts`
- **DB Tables**: `compliance_requirements`, `compliance_documents`, `compliance_alerts`
- **Features**:
  - Requirement tracking by category (labor law, data privacy, safety, financial, immigration, licensing)
  - Document management with expiry tracking
  - Automated alerts (upcoming deadlines, expiring documents, violations)
  - Country-specific compliance rules

### 15. Workflows
- **Route**: `/workflows`
- **Store Keys**: `workflows`, `workflowTemplates`, `workflowSteps`, `workflowRuns`
- **DB Tables**: `workflows`, `workflow_templates`, `workflow_steps`, `workflow_runs`
- **Features**:
  - Visual workflow builder
  - Trigger types: schedule, event, manual, webhook
  - Step types: action, condition, delay, notification, approval
  - Workflow templates
  - Run tracking with status

### 16. Workflow Automation
- **Route**: `/workflow-studio`
- **Store Keys**: `automationWorkflows`, `automationWorkflowSteps`, `automationWorkflowRuns`
- **DB Tables**: `automation_workflows`, `automation_workflow_steps`, `automation_workflow_runs`, `automation_workflow_run_steps`
- **Features**:
  - Event-driven automation (employee hired, terminated, role changed, etc.)
  - Action types: send email, Slack, create task, assign/revoke app, update field, trigger webhook
  - Conditional branching
  - Run history and error tracking

---

## Finance Modules

### 17. Invoices
- **Route**: `/finance/invoices`
- **Store Keys**: `invoices`, `vendors`
- **DB Tables**: `invoices`, `vendors`
- **Features**: Invoice creation, tracking, vendor management

### 18. Budgets
- **Route**: `/finance/budgets`
- **Store Keys**: `budgets`
- **DB Tables**: `budgets`
- **Features**: Department budgets, spending tracking, fiscal year management

### 19. Vendors
- **Route**: `/finance/vendors`
- **Store Keys**: `vendors`
- **DB Tables**: `vendors`
- **Features**: Vendor directory with categories and status

### 20. Corporate Cards
- **Route**: `/finance/cards`
- **Store Keys**: `corporateCards`, `cardTransactions`
- **DB Tables**: `corporate_cards`, `card_transactions`
- **Features**: Corporate card issuance, transaction tracking, spending limits

### 21. Bill Pay
- **Route**: `/finance/bill-pay`
- **Store Keys**: `billPayments`, `billPaySchedules`
- **DB Tables**: `bill_payments`, `bill_pay_schedules`
- **Features**: Bill payment processing, scheduling, approval workflows

### 22. Global Spend / Multi-Currency
- **Route**: `/finance/global-spend`
- **Store Keys**: `currencyAccounts`, `fxTransactions`
- **DB Tables**: `currency_accounts`, `fx_transactions`
- **Features**: Multi-currency accounts, FX transactions, conversion

---

## IT Modules

### 23. IT Devices
- **Route**: `/it/devices`
- **Store Keys**: `devices`, `managedDevices`, `deviceActions`, `deviceInventory`
- **DB Tables**: `devices`, `managed_devices`, `device_actions`, `device_inventory`
- **Features**:
  - Device lifecycle management
  - MDM integration
  - Remote actions (lock, wipe, restart, update OS)
  - Inventory tracking (warehouse location, condition)
  - Device enrollment

### 24. IT Apps
- **Route**: `/it/apps`
- **Store Keys**: `softwareLicenses`, `appCatalog`, `appAssignments`
- **DB Tables**: `software_licenses`, `app_catalog`, `app_assignments`
- **Features**:
  - Software license management
  - App catalog with categories
  - License types (free, per-seat, enterprise, site)
  - Auto-install capabilities
  - Assignment tracking

### 25. IT Cloud
- **Route**: `/it-cloud`
- **Store Keys**: `managedDevices`, `securityPoliciesIT`, `provisioningRules`, `encryptionPolicies`
- **DB Tables**: `managed_devices`, `security_policies`, `idp_configurations`, `mfa_policies`
- **Features**:
  - Security policy management (password, encryption, firewall, OS update)
  - Policy targeting (all, department, role, level)
  - Auto-provisioning rules
  - Encryption enforcement
  - Shadow IT detection

### 26. IT Requests
- **Store Keys**: `itRequests`
- **DB Tables**: `it_requests`
- **Features**: Help desk ticketing (hardware, software, access, support)

### 27. Device Store
- **Store Keys**: `deviceStoreCatalog`, `deviceOrders`
- **DB Tables**: `device_store_catalog`, `device_orders`
- **Features**: Internal device ordering for employees

### 28. Password Manager
- **Route**: `/password-manager`
- **Store Keys**: `passwordVaults`, `vaultItems`
- **DB Tables**: `password_vaults`, `vault_items`
- **Features**: Shared password vaults, credential management

---

## Recruiting Modules

### 29. Recruiting / ATS
- **Route**: `/recruiting`
- **Store Keys**: `jobPostings`, `applications`, `careerSiteConfig`, `jobDistributions`, `interviews`, `talentPools`, `scoreCards`, `backgroundChecks`, `referralProgram`, `referrals`, `knockoutQuestions`, `candidateScheduling`
- **DB Tables**: `job_postings`, `applications`, `background_checks`, `referral_programs`, `referrals`, `knockout_questions`, `candidate_scheduling`
- **Features**:
  - Job posting management (full-time, part-time, contract, internship)
  - Multi-stage pipeline (new, screening, phone screen, technical, onsite, panel, assessment, reference check, offer, hired)
  - Candidate scoring
  - Background checks (Checkr, GoodHire, internal)
  - Employee referral programs with bonus tracking
  - Knockout questions for auto-screening
  - Self-scheduling for candidates
  - Career site configuration
  - Job board distribution

### 30. Headcount Planning
- **Route**: `/headcount`
- **Store Keys**: `headcountPlans`, `headcountPositions`, `headcountBudgetItems`
- **DB Tables**: `headcount_plans`, `headcount_positions`, `headcount_budget_items`
- **Features**:
  - Plan management by fiscal year
  - Position types (new, backfill, conversion)
  - Budget items (base salary, benefits, equity, signing bonus, relocation, equipment)
  - Priority levels
  - Approval workflow

---

## Strategy & Projects

### 31. Strategy
- **Route**: `/strategy`
- **Store Keys**: `strategicObjectives`, `keyResults`, `initiatives`, `kpiDefinitions`, `kpiMeasurements`
- **DB Tables**: `strategic_objectives`, `key_results`, `initiatives`, `kpi_definitions`, `kpi_measurements`
- **Features**:
  - OKR framework (Objectives and Key Results)
  - Initiative tracking with budgets
  - KPI definitions with measurement tracking
  - Progress visualization
  - Department-level KPIs

### 32. Projects
- **Route**: `/projects`
- **Store Keys**: `projects`, `milestones`, `tasks`, `taskDependencies`, `automationRules`
- **DB Tables**: `projects`, `milestones`, `tasks`, `task_dependencies`
- **Features**:
  - Project management with milestones
  - Task boards (todo, in-progress, review, done)
  - Task dependencies
  - Time estimation and tracking
  - Budget tracking

---

## Platform Modules

### 33. Identity & Access
- **Route**: `/identity`
- **Store Keys**: `idpConfigurations`, `samlApps`, `mfaPolicies`, `scimProviders`
- **DB Tables**: `idp_configurations`, `saml_apps`, `mfa_policies`, `sso_providers`, `sso_sessions`
- **Features**:
  - SSO (Google, Azure AD)
  - SAML 2.0 app configuration
  - MFA policies
  - SCIM provisioning
  - IdP configuration management

### 34. Chat
- **Route**: `/chat`
- **Store Keys**: `chatChannels`, `chatMessages`
- **DB Tables**: `chat_channels`, `chat_messages`, `chat_participants`, `chat_reactions`, `chat_read_receipts`
- **Features**:
  - Real-time messaging (DB-backed, 1178-line service)
  - Channel types: direct, group, department, announcement
  - Threaded conversations
  - Emoji reactions
  - Message pinning
  - File sharing
  - Mentions
  - Read receipts
  - Unread counts
  - Channel analytics
  - SSE streaming

### 35. Documents / E-Signatures
- **Route**: `/documents`
- **Store Keys**: `signatureDocuments`, `signatureTemplates`
- **DB Tables**: `signature_documents`, `signature_signers`, `signature_templates`, `signature_audit_trail`
- **Features**:
  - Document signing (sequential or parallel flow)
  - Signer management (internal employees, external parties)
  - Signature templates
  - Full audit trail (created, sent, viewed, signed, declined)
  - Expiration management

### 36. Travel
- **Route**: `/travel`
- **Store Keys**: `travelRequests`, `travelBookings`, `travelPolicies`
- **DB Tables**: `travel_requests`, `travel_bookings`, `travel_policies`
- **Features**: Travel request management, booking, policy enforcement

### 37. Groups
- **Route**: `/groups`
- **Store Keys**: `groups`
- **DB Tables**: `dynamic_groups`
- **Features**: Dynamic employee groups with rule-based membership

### 38. Settings
- **Route**: `/settings`
- **Features**: Organization settings, billing, module configuration

### 39. Analytics
- **Route**: `/analytics`
- **Features**: Cross-module analytics and dashboards

### 40. Marketplace
- **Route**: `/marketplace`
- **Features**: Module marketplace for discovering and enabling features

### 41. App Studio
- **Route**: `/app-studio`
- **Store Keys**: `customApps`, `appPages`, `appComponents`, `appDataSources`
- **DB Tables**: `custom_apps`, `app_pages`, `app_components`, `app_data_sources`
- **Features**: No-code custom app builder

### 42. Sandbox
- **Route**: `/sandbox`
- **Store Keys**: `sandboxEnvironments`
- **DB Tables**: `sandbox_environments`
- **Features**: Isolated testing environments

### 43. Developer Portal
- **Route**: `/developer`
- **Features**: API documentation, webhook configuration, developer tools

### 44. Workers' Compensation
- **Route**: `/workers-comp`
- **Store Keys**: `workersCompPolicies`, `workersCompClaims`, `workersCompClassCodes`, `workersCompAudits`
- **DB Tables**: `workers_comp_policies`, `workers_comp_claims`, `workers_comp_class_codes`, `workers_comp_audits`
- **Features**: Workers' comp policy, claims, class codes, audits

### 45. I-9 / E-Verify
- **DB Tables**: `i9_forms`, `everify_cases`, `i9_documents`
- **Features**: I-9 form management, E-Verify case tracking, document verification

---

## Global Workforce

### 46. Employer of Record (EOR)
- **Route**: `/global-workforce` (tab)
- **Store Keys**: `eorEntities`, `eorEmployees`, `eorContracts`
- **DB Tables**: `eor_entities`, `eor_employees`, `eor_contracts`
- **Features**: Employ workers in countries without a local entity

### 47. Contractor of Record (COR)
- **Store Keys**: `corContractors`, `corContracts`, `corPayments`
- **DB Tables**: `cor_contractors`, `cor_contracts`, `cor_payments`
- **Features**: Manage international contractors compliantly

### 48. Professional Employer Organization (PEO)
- **Store Keys**: `peoConfigurations`, `coEmploymentRecords`
- **DB Tables**: `peo_configurations`, `co_employment_records`
- **Features**: Co-employment for benefits and compliance

### 49. Global Benefits
- **Store Keys**: `globalBenefitPlans`, `countryBenefitConfigs`
- **DB Tables**: `global_benefit_plans`, `country_benefit_configs`
- **Features**: Benefits administration across multiple countries
