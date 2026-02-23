-- ============================================================
-- Tempo Platform: Row-Level Security (RLS) Policies
-- Run this migration to enable org-level data isolation at the DB layer.
-- The application must SET app.current_org_id = '<uuid>' before each request.
-- ============================================================

-- Helper function to get the current org context
CREATE OR REPLACE FUNCTION current_org_id() RETURNS uuid AS $$
  SELECT NULLIF(current_setting('app.current_org_id', true), '')::uuid;
$$ LANGUAGE sql STABLE;

-- ============================================================
-- ENABLE RLS ON ALL ORG-SCOPED TABLES
-- ============================================================

-- Core
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- Performance
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Compensation
ALTER TABLE comp_bands ENABLE ROW LEVEL SECURITY;
ALTER TABLE salary_reviews ENABLE ROW LEVEL SECURITY;

-- Learning
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;

-- Engagement
ALTER TABLE surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE engagement_scores ENABLE ROW LEVEL SECURITY;

-- Mentoring
ALTER TABLE mentoring_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentoring_pairs ENABLE ROW LEVEL SECURITY;

-- Payroll
ALTER TABLE payroll_runs ENABLE ROW LEVEL SECURITY;

-- Time
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;

-- Benefits
ALTER TABLE benefit_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE benefit_enrollments ENABLE ROW LEVEL SECURITY;

-- Expense
ALTER TABLE expense_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_items ENABLE ROW LEVEL SECURITY;

-- Recruiting
ALTER TABLE job_postings ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- IT
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE software_licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE it_requests ENABLE ROW LEVEL SECURITY;

-- Finance
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;

-- Phase 3: Projects
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_dependencies ENABLE ROW LEVEL SECURITY;

-- Phase 3: Strategy
ALTER TABLE strategic_objectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE key_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE initiatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_measurements ENABLE ROW LEVEL SECURITY;

-- Phase 3: Workflows
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_templates ENABLE ROW LEVEL SECURITY;

-- Audit & Sessions
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- POLICIES FOR ORG-SCOPED TABLES (direct org_id column)
-- ============================================================

-- Macro: For each table with org_id, create a unified policy
-- Format: SELECT/INSERT/UPDATE/DELETE all scoped to current_org_id()

-- organizations: only see own org
CREATE POLICY org_isolation ON organizations
  USING (id = current_org_id())
  WITH CHECK (id = current_org_id());

-- departments
CREATE POLICY org_isolation ON departments
  USING (org_id = current_org_id())
  WITH CHECK (org_id = current_org_id());

-- employees
CREATE POLICY org_isolation ON employees
  USING (org_id = current_org_id())
  WITH CHECK (org_id = current_org_id());

-- goals
CREATE POLICY org_isolation ON goals
  USING (org_id = current_org_id())
  WITH CHECK (org_id = current_org_id());

-- review_cycles
CREATE POLICY org_isolation ON review_cycles
  USING (org_id = current_org_id())
  WITH CHECK (org_id = current_org_id());

-- reviews
CREATE POLICY org_isolation ON reviews
  USING (org_id = current_org_id())
  WITH CHECK (org_id = current_org_id());

-- feedback
CREATE POLICY org_isolation ON feedback
  USING (org_id = current_org_id())
  WITH CHECK (org_id = current_org_id());

-- comp_bands
CREATE POLICY org_isolation ON comp_bands
  USING (org_id = current_org_id())
  WITH CHECK (org_id = current_org_id());

-- salary_reviews
CREATE POLICY org_isolation ON salary_reviews
  USING (org_id = current_org_id())
  WITH CHECK (org_id = current_org_id());

-- courses
CREATE POLICY org_isolation ON courses
  USING (org_id = current_org_id())
  WITH CHECK (org_id = current_org_id());

-- enrollments
CREATE POLICY org_isolation ON enrollments
  USING (org_id = current_org_id())
  WITH CHECK (org_id = current_org_id());

-- surveys
CREATE POLICY org_isolation ON surveys
  USING (org_id = current_org_id())
  WITH CHECK (org_id = current_org_id());

-- engagement_scores
CREATE POLICY org_isolation ON engagement_scores
  USING (org_id = current_org_id())
  WITH CHECK (org_id = current_org_id());

-- mentoring_programs
CREATE POLICY org_isolation ON mentoring_programs
  USING (org_id = current_org_id())
  WITH CHECK (org_id = current_org_id());

-- mentoring_pairs
CREATE POLICY org_isolation ON mentoring_pairs
  USING (org_id = current_org_id())
  WITH CHECK (org_id = current_org_id());

-- payroll_runs
CREATE POLICY org_isolation ON payroll_runs
  USING (org_id = current_org_id())
  WITH CHECK (org_id = current_org_id());

-- leave_requests
CREATE POLICY org_isolation ON leave_requests
  USING (org_id = current_org_id())
  WITH CHECK (org_id = current_org_id());

-- benefit_plans
CREATE POLICY org_isolation ON benefit_plans
  USING (org_id = current_org_id())
  WITH CHECK (org_id = current_org_id());

-- benefit_enrollments
CREATE POLICY org_isolation ON benefit_enrollments
  USING (org_id = current_org_id())
  WITH CHECK (org_id = current_org_id());

-- expense_reports
CREATE POLICY org_isolation ON expense_reports
  USING (org_id = current_org_id())
  WITH CHECK (org_id = current_org_id());

-- job_postings
CREATE POLICY org_isolation ON job_postings
  USING (org_id = current_org_id())
  WITH CHECK (org_id = current_org_id());

-- applications
CREATE POLICY org_isolation ON applications
  USING (org_id = current_org_id())
  WITH CHECK (org_id = current_org_id());

-- devices
CREATE POLICY org_isolation ON devices
  USING (org_id = current_org_id())
  WITH CHECK (org_id = current_org_id());

-- software_licenses
CREATE POLICY org_isolation ON software_licenses
  USING (org_id = current_org_id())
  WITH CHECK (org_id = current_org_id());

-- it_requests
CREATE POLICY org_isolation ON it_requests
  USING (org_id = current_org_id())
  WITH CHECK (org_id = current_org_id());

-- invoices
CREATE POLICY org_isolation ON invoices
  USING (org_id = current_org_id())
  WITH CHECK (org_id = current_org_id());

-- budgets
CREATE POLICY org_isolation ON budgets
  USING (org_id = current_org_id())
  WITH CHECK (org_id = current_org_id());

-- vendors
CREATE POLICY org_isolation ON vendors
  USING (org_id = current_org_id())
  WITH CHECK (org_id = current_org_id());

-- projects
CREATE POLICY org_isolation ON projects
  USING (org_id = current_org_id())
  WITH CHECK (org_id = current_org_id());

-- milestones
CREATE POLICY org_isolation ON milestones
  USING (org_id = current_org_id())
  WITH CHECK (org_id = current_org_id());

-- tasks
CREATE POLICY org_isolation ON tasks
  USING (org_id = current_org_id())
  WITH CHECK (org_id = current_org_id());

-- strategic_objectives
CREATE POLICY org_isolation ON strategic_objectives
  USING (org_id = current_org_id())
  WITH CHECK (org_id = current_org_id());

-- key_results
CREATE POLICY org_isolation ON key_results
  USING (org_id = current_org_id())
  WITH CHECK (org_id = current_org_id());

-- initiatives
CREATE POLICY org_isolation ON initiatives
  USING (org_id = current_org_id())
  WITH CHECK (org_id = current_org_id());

-- kpi_definitions
CREATE POLICY org_isolation ON kpi_definitions
  USING (org_id = current_org_id())
  WITH CHECK (org_id = current_org_id());

-- workflows
CREATE POLICY org_isolation ON workflows
  USING (org_id = current_org_id())
  WITH CHECK (org_id = current_org_id());

-- workflow_runs
CREATE POLICY org_isolation ON workflow_runs
  USING (org_id = current_org_id())
  WITH CHECK (org_id = current_org_id());

-- workflow_templates
CREATE POLICY org_isolation ON workflow_templates
  USING (org_id = current_org_id())
  WITH CHECK (org_id = current_org_id());

-- audit_log
CREATE POLICY org_isolation ON audit_log
  USING (org_id = current_org_id())
  WITH CHECK (org_id = current_org_id());

-- sessions: scope through employee
CREATE POLICY org_isolation ON sessions
  USING (employee_id IN (SELECT id FROM employees WHERE org_id = current_org_id()))
  WITH CHECK (employee_id IN (SELECT id FROM employees WHERE org_id = current_org_id()));

-- ============================================================
-- POLICIES FOR CHILD TABLES (no direct org_id - use parent FK)
-- ============================================================

-- expense_items: scope through expense_reports.org_id
CREATE POLICY org_isolation ON expense_items
  USING (report_id IN (SELECT id FROM expense_reports WHERE org_id = current_org_id()))
  WITH CHECK (report_id IN (SELECT id FROM expense_reports WHERE org_id = current_org_id()));

-- task_dependencies: scope through tasks.org_id
CREATE POLICY org_isolation ON task_dependencies
  USING (task_id IN (SELECT id FROM tasks WHERE org_id = current_org_id()))
  WITH CHECK (task_id IN (SELECT id FROM tasks WHERE org_id = current_org_id()));

-- kpi_measurements: scope through kpi_definitions.org_id
CREATE POLICY org_isolation ON kpi_measurements
  USING (kpi_id IN (SELECT id FROM kpi_definitions WHERE org_id = current_org_id()))
  WITH CHECK (kpi_id IN (SELECT id FROM kpi_definitions WHERE org_id = current_org_id()));

-- workflow_steps: scope through workflows.org_id
CREATE POLICY org_isolation ON workflow_steps
  USING (workflow_id IN (SELECT id FROM workflows WHERE org_id = current_org_id()))
  WITH CHECK (workflow_id IN (SELECT id FROM workflows WHERE org_id = current_org_id()));

-- ============================================================
-- BYPASS POLICY FOR SUPERUSER / SERVICE ROLE
-- The Neon default role used by the app needs to bypass RLS
-- since it manages the app.current_org_id setting per-request.
-- In Neon, the connection role is typically the DB owner, so
-- RLS is automatically bypassed for table owners.
--
-- If using a restricted role in production, run:
-- ALTER TABLE <table> FORCE ROW LEVEL SECURITY;
-- And grant the app role only the needed permissions.
-- ============================================================
