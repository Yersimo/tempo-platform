# Rippling Platform UX Research
## Comprehensive Module-by-Module Analysis

---

## Platform-Wide Design Philosophy

### The Employee Graph
Rippling's entire platform is built on a "unified employee graph" -- a single source of truth for all employee data that sits at the bottom of the tech stack. Every module (HR, IT, Finance, Payroll) reads from and writes to this shared data layer. On top of it sit middleware components: reports/analytics, custom policies/permissions, role-based permissions, and workflow automation. This means every module shares common UX patterns for reporting, permissions, and workflows.

### Compound Startup Architecture
Rippling builds as a "compound startup" -- rather than building the best version of any single product, they leverage a common platform and underlying data so products gain utility by working together. Each new product adds value to the entire ecosystem. Parker Conrad describes it as "a bizarro-world Salesforce re-centered around employee data."

### Navigation & Layout
- **Left sidebar** navigation with categorized module access
- Color-coded buttons and logical grouping help new users navigate
- Admin dashboard features a **to-do list** tied to deadlines, approval requests, and milestones
- Left menu includes: payroll & time, HR tools (directory, ATS, insurance/benefits), document repository, prebuilt reports
- Finance Settings recently got a streamlined redesign with clearer organization and unified settings per product
- Fixed sidebar width, clean white/light backgrounds, the Rippling purple/berry brand color used as accent

### Supergroups (Cross-Platform Pattern)
A "Supergroup" is a dynamic group of employees built using any attributes (department, location, tenure, level, etc.). Used everywhere:
- Assigning policies, permissions, benefits eligibility, app access, training
- When an employee's attributes change, their membership updates automatically
- A policy in one module can enforce actions in another (e.g., blocking clock-in if training incomplete)

### Mobile App
Single unified mobile app for all workforce tasks. Employees can:
- Clock in/out, swap shifts, request PTO
- View paystubs, timecards, benefits
- Submit/approve expense reports
- Access RPass (password manager)
- View teammate contact info
The mobile app mirrors desktop without feeling cramped. Most day-to-day tasks work on mobile; complex reporting works best on desktop.

### Workflow Automation (Recipes)
Visual workflow builder with three components:
1. **Trigger** (lightning bolt icon, maroon header) -- e.g., "If Payroll is Completed"
2. **Logic/Conditions** -- if-then branching with any attribute
3. **Actions** (icon-based) -- e.g., "Create Report for Finance Team"

Pre-built "Recipes" are template workflows for common scenarios. Any data in Rippling or connected apps can be a trigger. Unlike competitors, any field can become a trigger. Clean modular layout, color-coded sections, step-by-step configuration.

---

## 1. PAYROLL

### Key UX Patterns
- **90-second payroll runs**: The hero feature. Once data is synced, running payroll takes ~90 seconds
- **Preview before approve**: Always shows total payroll, individual payments, and tax deductions before submission
- **Pay run comparison**: Side-by-side comparison with previous pay runs to catch discrepancies in gross pay, taxes, deductions
- **Automatic sync**: HR data (salary changes, new hires, terminations) flows into payroll automatically -- no re-entry
- **One-click approve**: Preview Payroll button -> review -> Approve

### Step-by-Step Flow: Running Payroll
1. Navigate to Payroll in left sidebar
2. System has already calculated pay based on hours, salary, overtime, bonuses, benefit deductions, PTO
3. Click "Preview Payroll" to see all calculations
4. Review total payroll amount, individual employee payments, tax withholdings
5. Use "Compare to last pay run" to spot discrepancies
6. Click line items to drill into changes in gross pay, taxes, deductions
7. Click "Approve" to submit payroll for processing
8. Automated approval workflows can route to additional approvers based on rules

### Notable UI Elements
- **Run Payroll** button prominently displayed on tablet-style interface
- **Pay Run Comparison** tool: list view showing line-by-line diffs across runs
- **Employee Pay Details** screen: individual breakdown of each employee's pay
- Customizable pay types, enterprise-grade approval workflows
- Notifications via Rippling Recipes when pay runs are approved
- Tax filing handled in background (all 50 US states, auto-updates with law changes)

### Global Payroll
- Unified view for domestic + international employees and contractors
- Contractors onboarded in 185+ countries within minutes
- Multi-currency payments (50+ currencies)
- Contractor self-service: generate invoices, manage time tracking, withdrawals in one place
- Invoice auto-approval based on timecards, contracts, or custom criteria
- 5-10 minutes to process contractor payments

### What Makes It Stand Out
- No manual data entry between HR and payroll
- Automatic tax jurisdiction assignment based on work location
- Comparison tools that proactively surface discrepancies
- Enterprise approval chains with role-based access control

---

## 2. TIME & ATTENDANCE

### Key UX Patterns
- **Multi-method clock-in**: Web, mobile app, tablet kiosk, QR code, GPS verification, photo clock-in
- **Unified timesheet management**: View, edit, add, approve from any device
- **Mass actions**: Managers can mass-approve hours, filter by unapproved days only
- **Real-time payroll sync**: Time data flows directly to payroll and PTO balances

### Step-by-Step Flow: Employee Clock In
1. Open Rippling mobile app (or navigate to web/kiosk)
2. Tap "Clock In" button
3. Optional: Photo verification or GPS confirmation
4. Clock out for breaks (meal/rest) with separate entries
5. Clock out at end of shift
6. View timesheet in app with hours per day, pay period totals

### Step-by-Step Flow: Manager Timesheet Approval
1. Navigate to Time & Attendance module
2. See list of employee timesheets for current pay period
3. Filter to show only "Unapproved" entries
4. Review individual timesheets or use mass-approve
5. Flag discrepancies, add notes if needed
6. Approve hours -- data syncs to payroll automatically

### Notable UI Elements
- Intuitive dashboard showing pay period overview
- Self-service features for employees (clock in, view timecards, request PTO)
- Shift swapping capability
- Geolocation restrictions and QR code clock-ins (less common in competitors)
- Break tracking (meal/rest) built into clock workflow

### PTO Management
- Employee submits time-off request in-app
- Manager reviews, approves/denies via dashboard or mobile
- Approved PTO automatically deducted from payroll calculations
- Real-time insight into how PTO affects payroll

---

## 3. BENEFITS ADMINISTRATION

### Key UX Patterns
- **Guided enrollment wizard**: Step-by-step flow for new hires, open enrollment, and qualifying life events (QLEs)
- **Plan comparison view**: Side-by-side plan options with employee and company cost breakdowns
- **Automatic eligibility filtering**: Employees only see plans they qualify for
- **Instant payroll sync**: Benefit deductions applied immediately upon enrollment

### Step-by-Step Flow: New Hire Benefits Enrollment
1. New hire receives automatic invitation to enroll during onboarding
2. Open My Benefits app in Rippling
3. See comprehensive view of all eligible benefits (medical, dental, vision, commuter, HSA/FSA)
4. For each category, compare available plans side-by-side (e.g., Aetna Gold PPO vs Silver)
5. See employee cost vs company contribution for each plan
6. Select desired plans
7. Submit enrollment -- deductions immediately sync to payroll

### Step-by-Step Flow: Open Enrollment (Admin)
1. Configure enrollment window dates and eligible employee groups
2. System sends automated reminders to employees via email
3. Admin dashboard shows enrollment progress against deadline
4. Track which employees have/haven't enrolled
5. Send group reminders and alerts to stragglers
6. View plan utilization metrics
7. Monitor carrier integrations (500+ EDI/API integrations)

### Notable UI Elements
- Medical coverage selection screen: plan cards showing provider (Aetna, MetLife), tier, costs
- Benefits overview dashboard: unified view of all categories (medical, dental, vision, commuter)
- Enrollment progress tracking against deadline
- ACA compliance automation (tracking, reporting, form submissions)
- Qualifying Life Event (QLE) self-service submission on mobile and desktop

---

## 4. RECRUITING / ATS

### Key UX Patterns
- **AI-powered candidate scoring**: Match scores (0-100%) displayed on candidate cards
- **Auto-populated requisitions**: System knows company structure, comp bands, headcount -- auto-fills when creating jobs
- **One-click job posting**: Post to thousands of boards from single interface
- **Role-based command centers**: Sourcers, recruiters, hiring managers, executives each get tailored dashboards
- **Talent lifecycle view**: Visual flow from "headcount approved" -> "offer signed" -> "employee offboarded"

### Step-by-Step Flow: Creating a Job Requisition
1. Navigate to Recruiting module
2. Click "Create Requisition"
3. System auto-populates department, location, salary range based on role/level selected
4. Adjust details as needed (custom pipeline stages, interview panels)
5. Submit for approval (routed through headcount planning approval chain)
6. Once approved, click to post to job boards (LinkedIn, Indeed + thousands more)

### Step-by-Step Flow: Reviewing Candidates
1. Open recruiting dashboard -- see what needs attention
2. View candidate pipeline with custom stages
3. Each candidate card shows: AI match score, days in stage, processing status
4. Click candidate to see full profile
5. View AI-generated interview summaries (from recordings/transcriptions)
6. See aggregated scorecards: "Strong yes," "Yes," "No" from multiple reviewers
7. Move candidate through pipeline stages
8. Generate offer (pulls from approved comp bands)

### Notable UI Elements
- **Candidate cards** with AI match percentage badges
- **Interview scheduling** with real-time availability and panel status indicators
- **Video interview interface** with AI-generated summaries alongside reviewer feedback
- **Feedback synthesis view**: aggregated multi-reviewer scorecards
- **Pipeline templates** from library, customizable with company-wide milestones
- Mobile recruiting app for scheduling on-the-go
- Smart scheduling with real-time availability analysis

---

## 5. LEARNING MANAGEMENT (LMS)

### Key UX Patterns
- **Auto-enrollment based on employee data**: Role, department, location trigger course assignments
- **Pre-built compliance library**: 80,000+ courses via Go1 partnership, state-specific harassment training for all 50 states
- **Custom course builder**: Create interactive courses with videos, images, quizzes, case studies
- **Automated reminders and deadline tracking**

### Step-by-Step Flow: Assigning Compliance Training
1. Admin navigates to Learning Management
2. Select compliance course (e.g., anti-harassment for California)
3. Use Supergroups to target employees (e.g., "All employees in CA")
4. Set deadline and enrollment rules
5. System automatically enrolls qualifying employees
6. Automated reminders sent as deadline approaches
7. Dashboard tracks completions, overdue training, team progress
8. Cross-module enforcement: can block clock-in or other actions if training incomplete

### Step-by-Step Flow: Employee Taking a Course
1. Employee receives notification of assigned course
2. Open LMS in Rippling (desktop or mobile)
3. View assigned courses and progress
4. Complete modules: video, reading, quizzes
5. Self-enrollment available for optional courses
6. Completion syncs to employee record automatically
7. Supports 15+ languages

### Notable UI Elements
- Course catalog with search and filtering
- Progress tracking dashboard (per employee and per team)
- Analytics on completion rates, overdue items
- Connection to performance management (development paths driven by performance outcomes)
- Mobile-optimized for on-the-go learning

---

## 6. PERFORMANCE MANAGEMENT

### Key UX Patterns
- **Carousel-based setup wizard** for configuring review cycles
- **Calibration grid**: Visual matrix (Stuck, Star, Watchlist, High Impact) for rating comparison
- **Merit/compensation integration**: Budget allocation with performance-based raise recommendations
- **Milestone reviews**: Triggered by any data (30-60-90 day check-ins, anniversary dates)

### Step-by-Step Flow: Running a Review Cycle
1. Admin navigates to Performance Management > Review Cycles
2. Configure cycle via carousel setup wizard:
   - Step 1: Assign employees using attributes (location, department, Supergroup)
   - Step 2: Select review types (self, manager, peer, upward)
   - Step 3: Set permissions based on role and reporting relationships
   - Step 4: Customize question sets per reviewer type
3. Launch cycle -- employees and managers receive notifications
4. Participants complete reviews within deadline
5. Managers use calibration grid to normalize ratings across teams
6. Calibration view: employees plotted on performance matrix (Star/High Impact/Watchlist/Stuck)
7. Merit cycle: budget allocation tool shows employee list with ratings and recommended raises
8. Approval workflows flag over-budget managers
9. Approved compensation changes sync directly to payroll

### Notable UI Elements
- **Calibration grid**: 2x2 matrix for visual performance assessment
- **Merit allocation table**: Employee list with performance ratings + raise amounts + budget indicators
- **Goals dashboard**: Company goals with tracked progress metrics, OKR-style
- **1:1 templates**: Customizable meeting formats with action item tracking
- **Performance analytics**: Department-level, seniority-level, demographic breakdowns with YoY comparisons
- Goals assigned via Supergroups (e.g., by department, team)
- Milestone reviews auto-triggered on dates/events

---

## 7. EXPENSE MANAGEMENT

### Key UX Patterns
- **One-click receipt capture**: Mobile photo, email forwarding, automatic matching
- **Policy engine with conditional logic**: Rules based on role, department, vendor, amount
- **Inline approvals with comment threads**: No tab-switching needed
- **Role-based spend dashboards**: CMO sees marketing spend, Controller sees company-wide

### Step-by-Step Flow: Submitting an Expense
1. Employee captures receipt via mobile app (photo) or forwards email receipt to Rippling
2. System auto-extracts: amount, vendor, date, category
3. Auto-translates receipt line items and converts currencies for international expenses
4. Employee reviews extracted data, adds notes if needed
5. Submit expense report
6. Track reimbursement status in real-time

### Step-by-Step Flow: Approving Expenses (Manager/Admin)
1. Open Expense dashboard -- see pending approvals, recent transactions, policy flags
2. Review expense details with receipt image
3. Approve inline or start comment thread for clarification
4. System auto-flags duplicates and receipt mismatches
5. Approved expenses flow to payroll for reimbursement (or via ACH)
6. All transactions auto-sync to QuickBooks, Xero, or NetSuite

### Notable UI Elements
- **Mobile approval view**: Uber ride example showing $44.81 with policy verification badge
- **Admin dashboard**: Clean, information-dense with budgets, policy alerts, pending approvals in single view
- **Conditional approval rules**: Visual rule builder for Amazon vendors with role/amount conditions
- **Duplicate detection** and receipt mismatch flagging
- **Role-based reporting**: Each persona sees their slice of spend automatically
- **GL sync**: Automatic categorization and accounting integration

---

## 8. ONBOARDING / OFFBOARDING

### Key UX Patterns
- **Role-based automated workflows**: Different onboarding paths based on role, department, location
- **Zero-touch device setup**: Devices shipped pre-configured, auto-enrolled via Apple Business Manager / Windows Autopilot
- **Cascading timelines**: Pre-boarding -> Day 1 -> 30/60/90 day milestones
- **Single-click offboarding**: One action triggers cascading deprovisioning

### Step-by-Step Flow: Onboarding a New Hire
1. HR enters new hire info: name, role, salary, start date, work location, employment type
2. Rippling automatically:
   - Creates employee record in the graph
   - Orders and ships pre-configured device (based on role)
   - Sets up app accounts (based on department/role Supergroups)
   - Assigns benefits enrollment
   - Assigns compliance training
   - Sends welcome email with day-one instructions
3. Employee self-service:
   - Completes digital documents (W-4, I-9, direct deposit, tax forms)
   - Enrolls in benefits
   - Signs agreements
   - Sets up company credentials
4. Day 1: Employee logs into pre-configured device, all apps/access ready
5. Automated 30-day check-in reminder to manager
6. 60-day progress assessment
7. 90-day formal performance review triggered automatically
8. Ongoing: satisfaction surveys sent based on milestones

### Step-by-Step Flow: Offboarding
1. HR initiates termination
2. Choose: immediate access revocation or scheduled date/time
3. Cascading offboarding events fire automatically:
   - App access revoked across all integrated systems
   - Device wiped/locked remotely
   - Benefits terminated
   - Final paycheck calculated
   - Equipment return initiated
4. All actions logged for compliance

### Notable UI Elements
- **Onboarding checklist** with timeline milestones
- **Task automation**: Sends right info at right time (day-one through 90-day surveys)
- **Digital document completion** (all employment forms)
- **Device provisioning** status tracking
- **Single-click offboarding** button with cascade preview

---

## 9. PEOPLE / EMPLOYEE DIRECTORY

### Key UX Patterns
- **Unified directory**: One directory across IT, HR, legal, finance, facilities
- **Interactive org chart**: Visual hierarchy with reporting relationships
- **Configurable profiles**: Admin, manager, and employee each see different profile views
- **Custom fields and embedded reports within profiles**

### Key Features
- Searchable employee directory with filters
- Interactive org chart at `/employee-list/orgchart`
- Profile tabs can be added, renamed, rearranged
- Custom fields added per business need
- Permission-based profile views (admin sees everything, employee sees limited info, manager sees their reports)
- Profile data feeds all other modules (payroll, benefits, device assignment, etc.)

### Notable UI Elements
- **Org chart visualization**: Tree structure with employee photos, names, titles
- **Employee profile**: Tabbed interface with customizable sections
- **Search/filter**: By department, location, role, custom attributes
- **Employee cards** in directory list view
- Reports can be embedded directly within employee profiles

---

## 10. COMPENSATION (Bands & Benchmarking)

### Key UX Patterns
- **Auto-mapped compensation bands**: Employees auto-assigned to correct band by role/level/location
- **Carta integration**: Access to 40,000+ startup salary/equity benchmarks
- **Band enforcement during hiring**: Recruiters see exactly what they can offer
- **Out-of-band flagging**: Alerts when adjustments deviate from approved ranges

### Key Features
- Create bands by role, level, location, and more
- Filter Carta Total Comp data by geography, job title, level, company valuation
- Compa-ratio reporting in real-time
- Pay equity analysis
- Total compensation reporting
- Role-based visibility (HR sees all, recruiter sees relevant band, manager sees their team)
- Bands enforced during onboarding -- system blocks or flags deviations

### Notable UI Elements
- **Band definition** interface with role/level/location parameters
- **Benchmarking comparison**: Market data overlaid on internal bands
- **Compa-ratio dashboard**: Employee-level and team-level views
- **Pay equity reports**: Demographic breakdowns
- **Approval routing**: Out-of-band requests routed through predetermined approval chains

---

## 11. ANALYTICS / REPORTING

### Key UX Patterns
- **Point-and-click report builder**: No SQL or formulas needed for basic reports
- **SQL-like joins** for power users (Custom Reports feature)
- **Pre-built recipe templates**: Hundreds of report templates across HR, IT, Finance
- **Rich visualization options**: Bubble charts, line graphs, scatter plots, pivot tables

### Key Features
- "My Reports" dashboard: Grid of report cards (Offers Accepted, Spend Report, Device Age, etc.)
- Report builder: Select variables (Salary, Department, Location) to generate custom analysis
- Report Formulas: Calculate derived values automatically
- Flexible filters (go beyond date/team -- filter on any employee attribute)
- Role-based report access
- Schedule reports and automated delivery

### Notable UI Elements
- **My Reports grid**: Card-based layout with report summaries
- **Visual builder**: Point-and-click variable selection
- **Chart type selector**: Bubble, line, scatter, bar, pivot table
- **Filter panel**: Attribute-based filtering beyond standard date/team
- **Pivot tables**: Interactive data summarization
- **Report embedding**: Reports can be embedded in employee profiles and dashboards

### What Users Say
- Praised for pre-built templates and common reporting interface across modules
- Some reviewers note reporting can lack customization and feel unintuitive for complex queries
- Works best on desktop for detailed reporting

---

## 12. SETTINGS / COMPANY SETUP

### Key UX Patterns
- **Guided initial setup**: Answer questions about company (headcount, industry, desired modules)
- **Configurable profiles**: Add/rename/rearrange tabs, custom fields, embedded reports
- **Permission-based views**: Profile layout changes dynamically based on viewer role
- **Unified settings per product**: Recently redesigned for clearer organization

### Key Features
- Initial setup wizard: company info, team invites, role assignments
- System sync: Connect existing HR, IT, finance systems
- Configurable employee profiles with per-role layouts
- App provisioning settings per third-party app
- SSO/SAML configuration (combined HRIS + IdP)
- Policy engine with Supergroup-based targeting
- Audit logging across all settings changes

### Notable UI Elements
- **Setup wizard** for initial configuration
- **Settings navigation**: Per-product settings in unified location
- **Profile configurator**: Drag tabs, add fields, set permissions
- **Provisioning settings** per integrated app
- **Policy builder** with attribute-based conditions

---

## 13. IT / DEVICE MANAGEMENT

### Key UX Patterns
- **Unified device dashboard**: Single view of all devices (macOS, Windows, iOS, iPadOS) with employee context
- **Policy creation as business rules**: Feels like setting business rules, not complex IT menus
- **Zero-touch enrollment**: Devices auto-configured on first sign-in
- **Conditional workflow automation**: "If device hasn't pinged in 10 days, Slack message to manager"

### Key Features
- Device inventory with employee assignment, specs (CPU, encryption status, manufacturer)
- Device ordering: MacBook Pro, keyboards, etc. with shipment tracking
- Cross-OS management from single console
- Silent background app installation based on role
- Custom security policies based on user + device attributes
- Device monitoring with compliance tracking
- Remote wipe/lock for offboarding
- Integration with Apple Business Manager and Windows Autopilot

### Notable UI Elements
- **Device inventory list**: Employee name, device type, connection date, OS, compliance status
- **Device Policies** screen: Custom security policies with attribute-based targeting
- **Device Monitoring** view: Workflow automation rules with conditional logic
- **Reporting dashboard**: Point-and-click custom reports on user + device data
- **Ordering interface**: Device selection, configuration, shipping to employee
- **Security dashboard**: Encryption status, threat detection, MDM enrollment, compliance certs (SOC 2, ISO 27001)

---

## 14. APP MANAGEMENT / INTEGRATIONS

### Key UX Patterns
- **App Shop**: Marketplace with 650+ integrations
- **One-click provisioning**: Apps auto-assigned based on role via Supergroups
- **Attribute syncing**: Employee data changes propagate to all connected apps automatically
- **Unified SSO**: Combined HRIS + Identity Provider, no SCIM needed

### Key Features
- 600+ integrations for provisioning, SSO, attribute syncing
- Supergroup-based app access rules
- Attribute mapping: changes in Rippling (photo, department, name) auto-apply to third-party apps
- Cross-app workflow triggers (e.g., Slack alert based on Zendesk ticket)
- Developer kit for custom integrations
- App usage analytics

### Notable UI Elements
- **App Shop** browse/search interface
- **Provisioning rules**: Per-app configuration for auto-assignment
- **Attribute mapping** interface between Rippling fields and third-party fields
- **Workflow triggers** across apps
- **App access audit**: Who has access to what, when it was granted

### App Studio (Custom App Builder)
- **Drag-and-drop visual builder**: Anyone can build apps, no code required
- **Canvas**: Drag components (tables, reports, dashboards, approval flows)
- **Data connection**: Link to Employee Graph or external data
- **Automation integration**: Connect to Workflow Studio for triggers/actions
- **Built-in governance**: Permissions inherited automatically
- **Real-world examples**: IT Access Management App, Central Interviewer App, New Hire Roster App
- Simple apps built in under an hour

---

## Cross-Cutting UX Patterns Summary

| Pattern | Description | Where Used |
|---------|-------------|------------|
| **Supergroups** | Dynamic groups by any attribute | Policies, permissions, benefits, training, app access, goals |
| **Recipes** | Pre-built workflow templates | All modules |
| **Workflow Automator** | Visual trigger-logic-action builder | All modules |
| **Point-and-click Reports** | No-code report builder with visualizations | All modules |
| **Role-based Dashboards** | Each persona sees their relevant slice | Recruiting, Expenses, Analytics, Compensation |
| **Pay Run Comparison** | Diff view against previous runs | Payroll |
| **Calibration Grid** | 2x2 performance matrix | Performance |
| **Zero-touch Provisioning** | Auto-configure devices and apps | IT, Onboarding |
| **Guided Wizards** | Step-by-step configuration flows | Benefits enrollment, Review cycles, Setup |
| **Inline Actions** | Approve/comment without switching views | Expenses, Time, Payroll |
| **Auto-Sync** | Data flows between modules without re-entry | HR->Payroll, Time->Payroll, Benefits->Payroll, Perf->Comp |
| **Mobile Parity** | Core actions available on mobile app | Clock-in, PTO, Expenses, Pay stubs, Benefits |
| **Conditional Policies** | Business rules based on any attribute | Security, compliance, access, training |
| **Single-Click Actions** | Complex operations behind one click | Run Payroll, Offboard Employee, Post Job |

---

## Key Takeaways for Platform Design

1. **Unified data model is everything** -- The Employee Graph means no manual data re-entry between modules, enabling true automation
2. **Role-based views, not role-based products** -- Same system, different views per persona
3. **Automation over manual steps** -- Wherever possible, actions cascade automatically
4. **Preview before commit** -- Payroll preview, expense review, offer review before final action
5. **Comparison/diff tools** -- Pay run comparisons, calibration grids, compa-ratio dashboards
6. **Mobile is a first-class citizen** -- Not a stripped-down version, but a full-featured companion
7. **Guided flows for complex tasks** -- Wizards, carousels, and step-by-step setups reduce cognitive load
8. **Information density with clarity** -- Dashboards are dense but organized with clear visual hierarchy
9. **Cross-module enforcement** -- Policies span modules (training completion gates clock-in access)
10. **Template-first approach** -- Recipes, pipeline templates, course templates, review templates reduce setup time
