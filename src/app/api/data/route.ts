import { NextRequest, NextResponse } from 'next/server'
import { db, withRetry } from '@/lib/db'
import * as schema from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { genericMutation, formatZodError } from '@/lib/validations/common'

// ---------------------------------------------------------------------------
// GET /api/data -- DEPRECATED: Use GET /api/data/[module] for per-module loading
// This monolithic endpoint fires 40+ parallel DB queries and does not scale.
// Kept for backwards compatibility; the store now uses per-module lazy loading.
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  try {
    // Resolve org from authenticated session (set by middleware)
    const orgId = request.headers.get('x-org-id')
    if (!orgId) {
      return NextResponse.json({ error: 'Unauthorized: no org context' }, { status: 401 })
    }

    const orgs = await withRetry(() =>
      db.select().from(schema.organizations).where(eq(schema.organizations.id, orgId))
    )
    if (orgs.length === 0) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }
    const org = orgs[0]

    // Fetch every table in parallel (wrapped in withRetry for Neon cold-start resilience)
    const [
      dbDepartments,
      dbEmployees,
      dbGoals,
      dbReviewCycles,
      dbReviews,
      dbFeedback,
      dbCompBands,
      dbSalaryReviews,
      dbCourses,
      dbEnrollments,
      dbSurveys,
      dbEngagementScores,
      dbMentoringPrograms,
      dbMentoringPairs,
      dbPayrollRuns,
      dbLeaveRequests,
      dbBenefitPlans,
      dbBenefitEnrollments,
      dbExpenseReports,
      dbExpenseItems,
      dbJobPostings,
      dbApplications,
      dbDevices,
      dbSoftwareLicenses,
      dbItRequests,
      dbInvoices,
      dbBudgets,
      dbVendors,
      dbAuditLog,
      dbProjects,
      dbMilestones,
      dbTasks,
      dbTaskDependencies,
      dbStrategicObjectives,
      dbKeyResults,
      dbInitiatives,
      dbKpiDefinitions,
      dbKpiMeasurements,
      dbWorkflows,
      dbWorkflowSteps,
      dbWorkflowRuns,
      dbWorkflowTemplates,
    ] = await withRetry(() => Promise.all([
      db.select().from(schema.departments).where(eq(schema.departments.orgId, orgId)),
      db.select().from(schema.employees).where(eq(schema.employees.orgId, orgId)),
      db.select().from(schema.goals).where(eq(schema.goals.orgId, orgId)),
      db.select().from(schema.reviewCycles).where(eq(schema.reviewCycles.orgId, orgId)),
      db.select().from(schema.reviews).where(eq(schema.reviews.orgId, orgId)),
      db.select().from(schema.feedback).where(eq(schema.feedback.orgId, orgId)),
      db.select().from(schema.compBands).where(eq(schema.compBands.orgId, orgId)),
      db.select().from(schema.salaryReviews).where(eq(schema.salaryReviews.orgId, orgId)),
      db.select().from(schema.courses).where(eq(schema.courses.orgId, orgId)),
      db.select().from(schema.enrollments).where(eq(schema.enrollments.orgId, orgId)),
      db.select().from(schema.surveys).where(eq(schema.surveys.orgId, orgId)),
      db.select().from(schema.engagementScores).where(eq(schema.engagementScores.orgId, orgId)),
      db.select().from(schema.mentoringPrograms).where(eq(schema.mentoringPrograms.orgId, orgId)),
      db.select().from(schema.mentoringPairs).where(eq(schema.mentoringPairs.orgId, orgId)),
      db.select().from(schema.payrollRuns).where(eq(schema.payrollRuns.orgId, orgId)),
      db.select().from(schema.leaveRequests).where(eq(schema.leaveRequests.orgId, orgId)),
      db.select().from(schema.benefitPlans).where(eq(schema.benefitPlans.orgId, orgId)),
      db.select().from(schema.benefitEnrollments).where(eq(schema.benefitEnrollments.orgId, orgId)),
      db.select().from(schema.expenseReports).where(eq(schema.expenseReports.orgId, orgId)),
      // expenseItems don't have orgId -- fetched globally then filtered via reportId
      db.select().from(schema.expenseItems),
      db.select().from(schema.jobPostings).where(eq(schema.jobPostings.orgId, orgId)),
      db.select().from(schema.applications).where(eq(schema.applications.orgId, orgId)),
      db.select().from(schema.devices).where(eq(schema.devices.orgId, orgId)),
      db.select().from(schema.softwareLicenses).where(eq(schema.softwareLicenses.orgId, orgId)),
      db.select().from(schema.itRequests).where(eq(schema.itRequests.orgId, orgId)),
      db.select().from(schema.invoices).where(eq(schema.invoices.orgId, orgId)),
      db.select().from(schema.budgets).where(eq(schema.budgets.orgId, orgId)),
      db.select().from(schema.vendors).where(eq(schema.vendors.orgId, orgId)),
      db.select().from(schema.auditLog).where(eq(schema.auditLog.orgId, orgId)),
      // Phase 3: Project Management
      db.select().from(schema.projects).where(eq(schema.projects.orgId, orgId)),
      db.select().from(schema.milestones).where(eq(schema.milestones.orgId, orgId)),
      db.select().from(schema.tasks).where(eq(schema.tasks.orgId, orgId)),
      db.select().from(schema.taskDependencies),
      // Phase 3: Strategy Execution
      db.select().from(schema.strategicObjectives).where(eq(schema.strategicObjectives.orgId, orgId)),
      db.select().from(schema.keyResults).where(eq(schema.keyResults.orgId, orgId)),
      db.select().from(schema.initiatives).where(eq(schema.initiatives.orgId, orgId)),
      db.select().from(schema.kpiDefinitions).where(eq(schema.kpiDefinitions.orgId, orgId)),
      db.select().from(schema.kpiMeasurements),
      // Phase 3: Workflow Studio
      db.select().from(schema.workflows).where(eq(schema.workflows.orgId, orgId)),
      db.select().from(schema.workflowSteps),
      db.select().from(schema.workflowRuns).where(eq(schema.workflowRuns.orgId, orgId)),
      db.select().from(schema.workflowTemplates).where(eq(schema.workflowTemplates.orgId, orgId)),
    ]))

    // Build a set of report IDs that belong to this org so we can scope expense items
    const orgReportIds = new Set(dbExpenseReports.map((r) => r.id))
    const scopedExpenseItems = dbExpenseItems.filter((i) => orgReportIds.has(i.reportId))

    // Scope taskDependencies to tasks belonging to this org
    const orgTaskIds = new Set(dbTasks.map((t) => t.id))
    const scopedTaskDependencies = dbTaskDependencies.filter((d) => orgTaskIds.has(d.taskId))

    // Scope kpiMeasurements to KPIs belonging to this org
    const orgKpiIds = new Set(dbKpiDefinitions.map((k) => k.id))
    const scopedKpiMeasurements = dbKpiMeasurements.filter((m) => orgKpiIds.has(m.kpiId))

    // Scope workflowSteps to workflows belonging to this org
    const orgWorkflowIds = new Set(dbWorkflows.map((w) => w.id))
    const scopedWorkflowSteps = dbWorkflowSteps.filter((s) => orgWorkflowIds.has(s.workflowId))

    // -----------------------------------------------------------------------
    // Transform DB rows (camelCase) to the snake_case shapes the UI expects
    // -----------------------------------------------------------------------

    const payload = {
      org: {
        id: org.id,
        name: org.name,
        slug: org.slug,
        logo_url: org.logoUrl,
        plan: org.plan,
        industry: org.industry,
        size: org.size,
        country: org.country,
        created_at: org.createdAt,
        updated_at: org.updatedAt,
      },

      departments: dbDepartments.map((d) => ({
        id: d.id,
        org_id: d.orgId,
        name: d.name,
        parent_id: d.parentId,
        head_id: d.headId,
        created_at: d.createdAt,
      })),

      employees: dbEmployees.map((e) => ({
        id: e.id,
        org_id: e.orgId,
        department_id: e.departmentId,
        job_title: e.jobTitle,
        level: e.level,
        country: e.country,
        role: e.role,
        manager_id: e.managerId,
        hire_date: e.hireDate,
        is_active: e.isActive,
        created_at: e.createdAt,
        updated_at: e.updatedAt,
        profile: {
          full_name: e.fullName,
          email: e.email,
          avatar_url: e.avatarUrl,
          phone: e.phone,
        },
      })),

      goals: dbGoals.map((g) => ({
        id: g.id,
        org_id: g.orgId,
        employee_id: g.employeeId,
        title: g.title,
        description: g.description,
        category: g.category,
        status: g.status,
        progress: g.progress,
        start_date: g.startDate,
        due_date: g.dueDate,
        parent_goal_id: g.parentGoalId,
        created_at: g.createdAt,
        updated_at: g.updatedAt,
      })),

      reviewCycles: dbReviewCycles.map((rc) => ({
        id: rc.id,
        org_id: rc.orgId,
        title: rc.title,
        type: rc.type,
        status: rc.status,
        start_date: rc.startDate,
        end_date: rc.endDate,
        created_at: rc.createdAt,
      })),

      reviews: dbReviews.map((r) => ({
        id: r.id,
        org_id: r.orgId,
        cycle_id: r.cycleId,
        employee_id: r.employeeId,
        reviewer_id: r.reviewerId,
        type: r.type,
        status: r.status,
        overall_rating: r.overallRating,
        ratings: r.ratings,
        comments: r.comments,
        submitted_at: r.submittedAt,
        created_at: r.createdAt,
      })),

      feedback: dbFeedback.map((f) => ({
        id: f.id,
        org_id: f.orgId,
        from_id: f.fromId,
        to_id: f.toId,
        type: f.type,
        content: f.content,
        is_public: f.isPublic,
        created_at: f.createdAt,
      })),

      compBands: dbCompBands.map((cb) => ({
        id: cb.id,
        org_id: cb.orgId,
        role_title: cb.roleTitle,
        level: cb.level,
        country: cb.country,
        min_salary: cb.minSalary,
        mid_salary: cb.midSalary,
        max_salary: cb.maxSalary,
        currency: cb.currency,
        p25: cb.p25,
        p50: cb.p50,
        p75: cb.p75,
        effective_date: cb.effectiveDate,
        created_at: cb.createdAt,
      })),

      salaryReviews: dbSalaryReviews.map((sr) => ({
        id: sr.id,
        org_id: sr.orgId,
        employee_id: sr.employeeId,
        proposed_by: sr.proposedBy,
        current_salary: sr.currentSalary,
        proposed_salary: sr.proposedSalary,
        currency: sr.currency,
        justification: sr.justification,
        status: sr.status,
        approved_by: sr.approvedBy,
        cycle: sr.cycle,
        created_at: sr.createdAt,
      })),

      courses: dbCourses.map((c) => ({
        id: c.id,
        org_id: c.orgId,
        title: c.title,
        description: c.description,
        category: c.category,
        duration_hours: c.durationHours,
        format: c.format,
        level: c.level,
        is_mandatory: c.isMandatory,
        created_at: c.createdAt,
      })),

      enrollments: dbEnrollments.map((en) => ({
        id: en.id,
        org_id: en.orgId,
        employee_id: en.employeeId,
        course_id: en.courseId,
        status: en.status,
        progress: en.progress,
        enrolled_at: en.enrolledAt,
        completed_at: en.completedAt,
      })),

      surveys: dbSurveys.map((s) => ({
        id: s.id,
        org_id: s.orgId,
        title: s.title,
        type: s.type,
        status: s.status,
        start_date: s.startDate,
        end_date: s.endDate,
        anonymous: s.anonymous,
        created_at: s.createdAt,
      })),

      engagementScores: dbEngagementScores.map((es) => ({
        id: es.id,
        org_id: es.orgId,
        department_id: es.departmentId,
        country_id: es.countryId,
        period: es.period,
        overall_score: es.overallScore,
        enps_score: es.enpsScore,
        response_rate: es.responseRate,
        themes: es.themes,
        created_at: es.createdAt,
      })),

      mentoringPrograms: dbMentoringPrograms.map((mp) => ({
        id: mp.id,
        org_id: mp.orgId,
        title: mp.title,
        type: mp.type,
        status: mp.status,
        duration_months: mp.durationMonths,
        start_date: mp.startDate,
        created_at: mp.createdAt,
      })),

      mentoringPairs: dbMentoringPairs.map((p) => ({
        id: p.id,
        org_id: p.orgId,
        program_id: p.programId,
        mentor_id: p.mentorId,
        mentee_id: p.menteeId,
        status: p.status,
        match_score: p.matchScore,
        started_at: p.startedAt,
        completed_at: p.completedAt,
      })),

      payrollRuns: dbPayrollRuns.map((pr) => ({
        id: pr.id,
        org_id: pr.orgId,
        period: pr.period,
        status: pr.status,
        total_gross: pr.totalGross,
        total_net: pr.totalNet,
        total_deductions: pr.totalDeductions,
        currency: pr.currency,
        employee_count: pr.employeeCount,
        run_date: pr.runDate,
        created_at: pr.createdAt,
      })),

      leaveRequests: dbLeaveRequests.map((lr) => ({
        id: lr.id,
        org_id: lr.orgId,
        employee_id: lr.employeeId,
        type: lr.type,
        start_date: lr.startDate,
        end_date: lr.endDate,
        days: lr.days,
        status: lr.status,
        reason: lr.reason,
        approved_by: lr.approvedBy,
        created_at: lr.createdAt,
      })),

      benefitPlans: dbBenefitPlans.map((bp) => ({
        id: bp.id,
        org_id: bp.orgId,
        name: bp.name,
        type: bp.type,
        provider: bp.provider,
        cost_employee: bp.costEmployee,
        cost_employer: bp.costEmployer,
        currency: bp.currency,
        description: bp.description,
        is_active: bp.isActive,
        created_at: bp.createdAt,
      })),

      benefitEnrollments: dbBenefitEnrollments.map((be) => ({
        id: be.id,
        org_id: be.orgId,
        employee_id: be.employeeId,
        plan_id: be.planId,
        enrolled_at: be.enrolledAt,
        cancelled_at: be.cancelledAt,
      })),

      expenseReports: dbExpenseReports.map((er) => ({
        id: er.id,
        org_id: er.orgId,
        employee_id: er.employeeId,
        title: er.title,
        total_amount: er.totalAmount,
        currency: er.currency,
        status: er.status,
        submitted_at: er.submittedAt,
        approved_by: er.approvedBy,
        created_at: er.createdAt,
        items: scopedExpenseItems
          .filter((i) => i.reportId === er.id)
          .map((i) => ({
            id: i.id,
            report_id: i.reportId,
            category: i.category,
            description: i.description,
            amount: i.amount,
            receipt_url: i.receiptUrl,
          })),
      })),

      expenseItems: scopedExpenseItems.map((i) => ({
        id: i.id,
        report_id: i.reportId,
        category: i.category,
        description: i.description,
        amount: i.amount,
        receipt_url: i.receiptUrl,
      })),

      jobPostings: dbJobPostings.map((jp) => ({
        id: jp.id,
        org_id: jp.orgId,
        title: jp.title,
        department_id: jp.departmentId,
        location: jp.location,
        type: jp.type,
        description: jp.description,
        requirements: jp.requirements,
        salary_min: jp.salaryMin,
        salary_max: jp.salaryMax,
        currency: jp.currency,
        status: jp.status,
        application_count: jp.applicationCount,
        created_at: jp.createdAt,
      })),

      applications: dbApplications.map((a) => ({
        id: a.id,
        org_id: a.orgId,
        job_id: a.jobId,
        candidate_name: a.candidateName,
        candidate_email: a.candidateEmail,
        status: a.status,
        stage: a.stage,
        rating: a.rating,
        notes: a.notes,
        resume_url: a.resumeUrl,
        applied_at: a.appliedAt,
      })),

      devices: dbDevices.map((d) => ({
        id: d.id,
        org_id: d.orgId,
        type: d.type,
        brand: d.brand,
        model: d.model,
        serial_number: d.serialNumber,
        status: d.status,
        assigned_to: d.assignedTo,
        purchase_date: d.purchaseDate,
        warranty_end: d.warrantyEnd,
        created_at: d.createdAt,
      })),

      softwareLicenses: dbSoftwareLicenses.map((sl) => ({
        id: sl.id,
        org_id: sl.orgId,
        name: sl.name,
        vendor: sl.vendor,
        total_licenses: sl.totalLicenses,
        used_licenses: sl.usedLicenses,
        cost_per_license: sl.costPerLicense,
        currency: sl.currency,
        renewal_date: sl.renewalDate,
        created_at: sl.createdAt,
      })),

      itRequests: dbItRequests.map((ir) => ({
        id: ir.id,
        org_id: ir.orgId,
        requester_id: ir.requesterId,
        type: ir.type,
        title: ir.title,
        description: ir.description,
        priority: ir.priority,
        status: ir.status,
        assigned_to: ir.assignedTo,
        created_at: ir.createdAt,
        resolved_at: ir.resolvedAt,
      })),

      invoices: dbInvoices.map((inv) => ({
        id: inv.id,
        org_id: inv.orgId,
        invoice_number: inv.invoiceNumber,
        vendor_id: inv.vendorId,
        amount: inv.amount,
        currency: inv.currency,
        status: inv.status,
        due_date: inv.dueDate,
        issued_date: inv.issuedDate,
        description: inv.description,
        created_at: inv.createdAt,
      })),

      budgets: dbBudgets.map((b) => ({
        id: b.id,
        org_id: b.orgId,
        name: b.name,
        department_id: b.departmentId,
        total_amount: b.totalAmount,
        spent_amount: b.spentAmount,
        currency: b.currency,
        fiscal_year: b.fiscalYear,
        status: b.status,
        created_at: b.createdAt,
      })),

      vendors: dbVendors.map((v) => ({
        id: v.id,
        org_id: v.orgId,
        name: v.name,
        contact_email: v.contactEmail,
        category: v.category,
        status: v.status,
        created_at: v.createdAt,
      })),

      // Phase 3: Project Management
      projects: dbProjects.map((p) => ({
        id: p.id, org_id: p.orgId, title: p.title, description: p.description,
        status: p.status, owner_id: p.ownerId, start_date: p.startDate, end_date: p.endDate,
        budget: p.budget, currency: p.currency, created_at: p.createdAt, updated_at: p.updatedAt,
      })),
      milestones: dbMilestones.map((m) => ({
        id: m.id, org_id: m.orgId, project_id: m.projectId, title: m.title,
        due_date: m.dueDate, status: m.status, created_at: m.createdAt,
      })),
      tasks: dbTasks.map((t) => ({
        id: t.id, org_id: t.orgId, project_id: t.projectId, milestone_id: t.milestoneId,
        title: t.title, description: t.description, status: t.status, priority: t.priority,
        assignee_id: t.assigneeId, due_date: t.dueDate, estimated_hours: t.estimatedHours,
        actual_hours: t.actualHours, created_at: t.createdAt, updated_at: t.updatedAt,
      })),
      taskDependencies: scopedTaskDependencies.map((d) => ({
        id: d.id, task_id: d.taskId, depends_on_task_id: d.dependsOnTaskId,
      })),
      // Phase 3: Strategy Execution
      strategicObjectives: dbStrategicObjectives.map((o) => ({
        id: o.id, org_id: o.orgId, title: o.title, description: o.description,
        status: o.status, owner_id: o.ownerId, period: o.period, progress: o.progress,
        created_at: o.createdAt, updated_at: o.updatedAt,
      })),
      keyResults: dbKeyResults.map((kr) => ({
        id: kr.id, org_id: kr.orgId, objective_id: kr.objectiveId, title: kr.title,
        target_value: kr.targetValue, current_value: kr.currentValue, unit: kr.unit,
        owner_id: kr.ownerId, due_date: kr.dueDate, created_at: kr.createdAt, updated_at: kr.updatedAt,
      })),
      initiatives: dbInitiatives.map((i) => ({
        id: i.id, org_id: i.orgId, objective_id: i.objectiveId, title: i.title,
        description: i.description, status: i.status, owner_id: i.ownerId,
        start_date: i.startDate, end_date: i.endDate, progress: i.progress,
        budget: i.budget, currency: i.currency, created_at: i.createdAt, updated_at: i.updatedAt,
      })),
      kpiDefinitions: dbKpiDefinitions.map((k) => ({
        id: k.id, org_id: k.orgId, name: k.name, description: k.description,
        unit: k.unit, target_value: k.targetValue, frequency: k.frequency,
        department_id: k.departmentId, owner_id: k.ownerId, created_at: k.createdAt,
      })),
      kpiMeasurements: scopedKpiMeasurements.map((m) => ({
        id: m.id, kpi_id: m.kpiId, value: m.value, period: m.period,
        recorded_at: m.recordedAt, notes: m.notes,
      })),
      // Phase 3: Workflow Studio
      workflows: dbWorkflows.map((w) => ({
        id: w.id, org_id: w.orgId, title: w.title, description: w.description,
        status: w.status, trigger_type: w.triggerType, trigger_config: w.triggerConfig,
        created_by: w.createdBy, created_at: w.createdAt, updated_at: w.updatedAt,
      })),
      workflowSteps: scopedWorkflowSteps.map((s) => ({
        id: s.id, workflow_id: s.workflowId, step_type: s.stepType, title: s.title,
        config: s.config, position: s.position, next_step_id: s.nextStepId, created_at: s.createdAt,
      })),
      workflowRuns: dbWorkflowRuns.map((r) => ({
        id: r.id, org_id: r.orgId, workflow_id: r.workflowId, status: r.status,
        started_at: r.startedAt, completed_at: r.completedAt, triggered_by: r.triggeredBy, context: r.context,
      })),
      workflowTemplates: dbWorkflowTemplates.map((t) => ({
        id: t.id, org_id: t.orgId, title: t.title, description: t.description,
        category: t.category, config: t.config, created_at: t.createdAt,
      })),

      auditLog: dbAuditLog.map((a) => ({
        id: a.id,
        org_id: a.orgId,
        user_id: a.userId,
        action: a.action,
        entity_type: a.entityType,
        entity_id: a.entityId,
        details: a.details,
        ip_address: a.ipAddress,
        timestamp: a.timestamp,
      })),
    }

    return NextResponse.json(payload)
  } catch (error) {
    console.error('[GET /api/data] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch data' },
      { status: 500 },
    )
  }
}

// ---------------------------------------------------------------------------
// POST /api/data -- create / update / delete any entity
// ---------------------------------------------------------------------------

// Map entity name strings to Drizzle schema tables
const tables: Record<string, any> = {
  organizations: schema.organizations,
  departments: schema.departments,
  employees: schema.employees,
  goals: schema.goals,
  reviewCycles: schema.reviewCycles,
  reviews: schema.reviews,
  feedback: schema.feedback,
  compBands: schema.compBands,
  salaryReviews: schema.salaryReviews,
  courses: schema.courses,
  enrollments: schema.enrollments,
  surveys: schema.surveys,
  engagementScores: schema.engagementScores,
  mentoringPrograms: schema.mentoringPrograms,
  mentoringPairs: schema.mentoringPairs,
  payrollRuns: schema.payrollRuns,
  leaveRequests: schema.leaveRequests,
  benefitPlans: schema.benefitPlans,
  benefitEnrollments: schema.benefitEnrollments,
  expenseReports: schema.expenseReports,
  expenseItems: schema.expenseItems,
  jobPostings: schema.jobPostings,
  applications: schema.applications,
  devices: schema.devices,
  softwareLicenses: schema.softwareLicenses,
  itRequests: schema.itRequests,
  invoices: schema.invoices,
  budgets: schema.budgets,
  vendors: schema.vendors,
  // Phase 3: Project Management
  projects: schema.projects,
  milestones: schema.milestones,
  tasks: schema.tasks,
  taskDependencies: schema.taskDependencies,
  // Phase 3: Strategy Execution
  strategicObjectives: schema.strategicObjectives,
  keyResults: schema.keyResults,
  initiatives: schema.initiatives,
  kpiDefinitions: schema.kpiDefinitions,
  kpiMeasurements: schema.kpiMeasurements,
  // Phase 3: Workflow Studio
  workflows: schema.workflows,
  workflowSteps: schema.workflowSteps,
  workflowRuns: schema.workflowRuns,
  workflowTemplates: schema.workflowTemplates,
  auditLog: schema.auditLog,
}

/**
 * Convert a snake_case key to camelCase so Drizzle can consume it.
 * Examples: employee_id -> employeeId, org_id -> orgId
 */
function snakeToCamel(key: string): string {
  return key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
}

/**
 * Convert an object's keys from snake_case to camelCase.
 */
function keysToCamel(obj: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = {}
  for (const [key, value] of Object.entries(obj)) {
    out[snakeToCamel(key)] = value
  }
  return out
}

/**
 * Coerce ISO date strings to Date objects for Drizzle timestamp columns.
 * Matches camelCase keys ending in At/Date (e.g. runDate, createdAt, submittedAt).
 */
function coerceDates(obj: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = {}
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string' && /(?:At|Date)$/.test(key) && !isNaN(Date.parse(value))) {
      out[key] = new Date(value)
    } else {
      out[key] = value
    }
  }
  return out
}

/**
 * Prepare data for Drizzle insertion/update.
 * - Converts snake_case keys to camelCase
 * - Coerces date strings to Date objects for timestamp columns
 * - For employees: flattens the nested `profile` object into top-level fields
 */
function prepareData(entity: string, data: Record<string, any>): Record<string, any> {
  // For employees, flatten the profile object if present
  if (entity === 'employees' && data.profile) {
    const { profile, ...rest } = data
    const flattened = {
      ...rest,
      full_name: profile.full_name ?? profile.fullName,
      email: profile.email,
      avatar_url: profile.avatar_url ?? profile.avatarUrl,
      phone: profile.phone,
    }
    return coerceDates(keysToCamel(flattened))
  }

  return coerceDates(keysToCamel(data))
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = genericMutation.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 })
    }
    const { action, entity, id, data } = parsed.data

    const table = tables[entity]
    if (!table) {
      return NextResponse.json(
        { error: `Unknown entity: ${entity}` },
        { status: 400 },
      )
    }

    // Resolve orgId from authenticated session (set by middleware)
    const orgId = request.headers.get('x-org-id')
    if (!orgId) {
      return NextResponse.json({ error: 'Unauthorized: no org context' }, { status: 401 })
    }

    // ─── RBAC: Role-Based Access Control ───────────────────────────────
    const employeeRole = request.headers.get('x-employee-role') || 'employee'
    const employeeId = request.headers.get('x-employee-id') || ''

    // Define write permissions per role
    const ROLE_PERMISSIONS: Record<string, Set<string> | 'all'> = {
      owner: 'all',
      admin: 'all', // admin can do everything except we block org deletion below
      hrbp: new Set([
        'employees', 'goals', 'reviewCycles', 'reviews', 'feedback',
        'compBands', 'salaryReviews', 'courses', 'enrollments',
        'surveys', 'engagementScores', 'mentoringPrograms', 'mentoringPairs',
        'leaveRequests', 'benefitPlans', 'benefitEnrollments',
        'expenseReports', 'expenseItems', 'jobPostings', 'applications',
        'projects', 'milestones', 'tasks', 'taskDependencies',
        'strategicObjectives', 'keyResults', 'initiatives',
        'kpiDefinitions', 'kpiMeasurements',
        'workflows', 'workflowSteps', 'workflowRuns', 'workflowTemplates',
      ]),
      manager: new Set([
        'goals', 'reviews', 'feedback', 'enrollments', 'leaveRequests',
        'tasks', 'milestones', 'taskDependencies',
        'kpiMeasurements', 'workflowRuns',
      ]),
      employee: new Set([
        'goals', 'feedback', 'enrollments', 'leaveRequests', 'tasks',
      ]),
    }

    // Check entity-level permission
    const permissions = ROLE_PERMISSIONS[employeeRole] || ROLE_PERMISSIONS['employee']
    if (permissions !== 'all' && !permissions.has(entity)) {
      return NextResponse.json(
        { error: `Forbidden: ${employeeRole} role cannot modify ${entity}` },
        { status: 403 }
      )
    }

    // Block non-owner from modifying organizations
    if (entity === 'organizations' && employeeRole !== 'owner') {
      return NextResponse.json(
        { error: 'Forbidden: only owner can modify organization settings' },
        { status: 403 }
      )
    }

    // For employee role: enforce "own records only" restriction
    if (employeeRole === 'employee' && data) {
      const ownedEntities = ['goals', 'feedback', 'enrollments', 'leaveRequests', 'tasks']
      if (ownedEntities.includes(entity)) {
        // On create: force employee_id/assignee_id to self
        if (action === 'create') {
          if (entity === 'tasks' && data.assignee_id) {
            // employees can only create tasks assigned to themselves
            if (data.assignee_id !== employeeId) {
              return NextResponse.json(
                { error: 'Forbidden: employees can only create tasks assigned to themselves' },
                { status: 403 }
              )
            }
          } else if (entity !== 'tasks') {
            // For goals, feedback, enrollments, leaveRequests: employee_id must be self
            const eid = data.employee_id || data.from_id
            if (eid && eid !== employeeId) {
              return NextResponse.json(
                { error: 'Forbidden: employees can only modify their own records' },
                { status: 403 }
              )
            }
          }
        }
      }
    }

    // ----- CREATE -----
    if (action === 'create') {
      if (!data) {
        return NextResponse.json(
          { error: 'Missing required field: data (for create)' },
          { status: 400 },
        )
      }

      const prepared = prepareData(entity, data)
      // Ensure orgId is set for tables that have it (everything except expenseItems)
      if (entity !== 'expenseItems' && !prepared.orgId) {
        prepared.orgId = orgId
      }

      // Write-ahead audit: record intent BEFORE mutation
      // Generate a provisional ID for the audit entry
      const provisionalId = crypto.randomUUID()
      try {
        await withRetry(() => db.insert(schema.auditLog).values({
          orgId,
          userId: employeeId || null,
          action: 'create',
          entityType: entity,
          entityId: provisionalId,
          details: JSON.stringify({ ...prepared, _provisional: true }),
        }))
      } catch (auditErr) {
        console.error('[AUDIT FAIL] Create audit write failed:', auditErr)
        return NextResponse.json(
          { error: 'Audit trail write failed. Mutation blocked for compliance.' },
          { status: 500 },
        )
      }

      // Now perform the actual mutation
      const rows = await withRetry(() => db.insert(table).values(prepared).returning()) as any[]
      const created = rows[0]

      // Update audit entry with actual entity ID (best-effort, entity is already created)
      try {
        await withRetry(() => db.update(schema.auditLog)
          .set({
            entityId: created.id,
            details: JSON.stringify(prepared),
          })
          .where(and(
            eq(schema.auditLog.entityId, provisionalId),
            eq(schema.auditLog.entityType, entity),
            eq(schema.auditLog.orgId, orgId),
          )))
      } catch {
        // Non-critical: audit entry exists with provisional ID
        console.warn('[AUDIT] Could not update provisional audit entry')
      }

      return NextResponse.json(created, { status: 201 })
    }

    // ----- UPDATE -----
    if (action === 'update') {
      if (!data) {
        return NextResponse.json(
          { error: 'Missing required field: data (for update)' },
          { status: 400 },
        )
      }

      const prepared = prepareData(entity, data)

      // Never allow changing orgId via update (prevent cross-org transfer)
      delete prepared.orgId

      // Add updatedAt for tables that have it
      if ('updatedAt' in table) {
        prepared.updatedAt = new Date()
      }

      // Write-ahead audit: record intent BEFORE mutation
      try {
        await withRetry(() => db.insert(schema.auditLog).values({
          orgId,
          userId: employeeId || null,
          action: 'update',
          entityType: entity,
          entityId: id!,
          details: JSON.stringify(prepared),
        }))
      } catch (auditErr) {
        console.error('[AUDIT FAIL] Update audit write failed:', auditErr)
        return NextResponse.json(
          { error: 'Audit trail write failed. Mutation blocked for compliance.' },
          { status: 500 },
        )
      }

      // Scope update to the user's org for tables with orgId
      const hasOrgId = 'orgId' in table && entity !== 'organizations'
      const whereClause = hasOrgId
        ? and(eq(table.id, id!), eq(table.orgId, orgId))
        : eq(table.id, id!)

      const rows = await withRetry(() => db
        .update(table)
        .set(prepared)
        .where(whereClause)
        .returning()) as any[]

      if (rows.length === 0) {
        return NextResponse.json(
          { error: `${entity} with id ${id} not found` },
          { status: 404 },
        )
      }

      const updated = rows[0]
      return NextResponse.json(updated)
    }

    // ----- DELETE -----
    if (action === 'delete') {
      // Write-ahead audit: record intent BEFORE mutation
      try {
        await withRetry(() => db.insert(schema.auditLog).values({
          orgId,
          userId: employeeId || null,
          action: 'delete',
          entityType: entity,
          entityId: id!,
          details: JSON.stringify({ deleted: true }),
        }))
      } catch (auditErr) {
        console.error('[AUDIT FAIL] Delete audit write failed:', auditErr)
        return NextResponse.json(
          { error: 'Audit trail write failed. Mutation blocked for compliance.' },
          { status: 500 },
        )
      }

      // Scope delete to the user's org for tables with orgId
      const hasOrgId = 'orgId' in table && entity !== 'organizations'
      const whereClause = hasOrgId
        ? and(eq(table.id, id!), eq(table.orgId, orgId))
        : eq(table.id, id!)

      const rows = await withRetry(() => db
        .delete(table)
        .where(whereClause)
        .returning()) as any[]

      if (rows.length === 0) {
        return NextResponse.json(
          { error: `${entity} with id ${id} not found` },
          { status: 404 },
        )
      }

      return NextResponse.json({ success: true })
    }

    return NextResponse.json(
      { error: `Unknown action: ${action}. Must be create, update, or delete.` },
      { status: 400 },
    )
  } catch (error) {
    console.error('[POST /api/data] Error:', error)
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 },
    )
  }
}
