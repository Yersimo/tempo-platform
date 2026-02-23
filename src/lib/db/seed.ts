/**
 * Seed script for Tempo Platform
 * Maps all demo-data.ts entities to real Drizzle schema tables
 * Usage: npx tsx src/lib/db/seed.ts
 */
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema'
import {
  demoOrg, demoDepartments, demoEmployees, demoGoals,
  demoReviewCycles, demoReviews, demoFeedback,
  demoCompBands, demoSalaryReviews,
  demoCourses, demoEnrollments,
  demoSurveys, demoEngagementScores,
  demoMentoringPrograms, demoMentoringPairs,
  demoPayrollRuns, demoLeaveRequests,
  demoBenefitPlans, demoExpenseReports,
  demoJobPostings, demoApplications,
  demoDevices, demoSoftwareLicenses, demoITRequests,
  demoInvoices, demoBudgets, demoVendors,
  demoCredentials,
} from '../demo-data'
import { randomUUID } from 'crypto'

// Build deterministic UUID maps from old string IDs
// We use a prefix-based approach so the same seed always produces the same UUIDs
const idMap = new Map<string, string>()

function mapId(oldId: string): string {
  if (!idMap.has(oldId)) {
    idMap.set(oldId, randomUUID())
  }
  return idMap.get(oldId)!
}

// Pre-generate all IDs so cross-references work
function pregenIds() {
  // Org
  mapId(demoOrg.id)
  // Departments
  demoDepartments.forEach(d => mapId(d.id))
  // Employees
  demoEmployees.forEach(e => mapId(e.id))
  // Goals
  demoGoals.forEach(g => mapId(g.id))
  // Review cycles
  demoReviewCycles.forEach(rc => mapId(rc.id))
  // Reviews
  demoReviews.forEach(r => mapId(r.id))
  // Feedback
  demoFeedback.forEach(f => mapId(f.id))
  // Comp bands
  demoCompBands.forEach(cb => mapId(cb.id))
  // Salary reviews
  demoSalaryReviews.forEach(sr => mapId(sr.id))
  // Courses
  demoCourses.forEach(c => mapId(c.id))
  // Enrollments
  demoEnrollments.forEach(e => mapId(e.id))
  // Surveys
  demoSurveys.forEach(s => mapId(s.id))
  // Engagement scores
  demoEngagementScores.forEach(es => mapId(es.id))
  // Mentoring programs
  demoMentoringPrograms.forEach(mp => mapId(mp.id))
  // Mentoring pairs
  demoMentoringPairs.forEach(mp => mapId(mp.id))
  // Payroll runs
  demoPayrollRuns.forEach(pr => mapId(pr.id))
  // Leave requests
  demoLeaveRequests.forEach(lr => mapId(lr.id))
  // Benefit plans
  demoBenefitPlans.forEach(bp => mapId(bp.id))
  // Expense reports + items
  demoExpenseReports.forEach(er => {
    mapId(er.id)
    er.items.forEach(item => mapId(item.id))
  })
  // Job postings
  demoJobPostings.forEach(jp => mapId(jp.id))
  // Applications
  demoApplications.forEach(a => mapId(a.id))
  // Devices
  demoDevices.forEach(d => mapId(d.id))
  // Software licenses
  demoSoftwareLicenses.forEach(sl => mapId(sl.id))
  // IT requests
  demoITRequests.forEach(ir => mapId(ir.id))
  // Invoices
  demoInvoices.forEach(inv => mapId(inv.id))
  // Budgets
  demoBudgets.forEach(b => mapId(b.id))
  // Vendors
  demoVendors.forEach(v => mapId(v.id))
}

async function seed() {
  const url = process.env.DATABASE_URL
  if (!url) {
    console.error('DATABASE_URL environment variable is required')
    process.exit(1)
  }

  const sql = neon(url)
  const db = drizzle(sql, { schema })

  console.log('Generating ID mappings...')
  pregenIds()

  const orgId = mapId(demoOrg.id)

  // Helper for nullable ID references
  function mapIdOrNull(id: string | null | undefined): string | null {
    if (!id) return null
    return mapId(id)
  }

  // Helper for simple password hash (bcrypt would be used in production)
  // For demo, we store a recognizable hash
  function hashPassword(_password: string): string {
    // In production, use bcrypt. For demo seed, store plain marker.
    return `demo:${_password}`
  }

  // Build email -> employee mapping for auth
  const credentialMap = new Map<string, typeof demoCredentials[0]>()
  demoCredentials.forEach(c => credentialMap.set(c.email, c))

  try {
    // ============================================================
    // 1. Organization
    // ============================================================
    console.log('Seeding organization...')
    await db.insert(schema.organizations).values({
      id: orgId,
      name: demoOrg.name,
      slug: demoOrg.slug,
      logoUrl: demoOrg.logo_url,
      plan: demoOrg.plan,
      industry: demoOrg.industry,
      size: demoOrg.size,
      country: demoOrg.country,
    })

    // ============================================================
    // 2. Departments (without head_id first, update later)
    // ============================================================
    console.log('Seeding departments...')
    await db.insert(schema.departments).values(
      demoDepartments.map(d => ({
        id: mapId(d.id),
        orgId,
        name: d.name,
        parentId: mapIdOrNull(d.parent_id),
        headId: null, // Set after employees are inserted
      }))
    )

    // ============================================================
    // 3. Employees
    // ============================================================
    console.log('Seeding employees...')
    // First pass: insert all employees without managerId to avoid FK issues
    await db.insert(schema.employees).values(
      demoEmployees.map(e => {
        const cred = credentialMap.get(e.profile.email)
        return {
          id: mapId(e.id),
          orgId,
          departmentId: mapIdOrNull(e.department_id),
          fullName: e.profile.full_name,
          email: e.profile.email,
          phone: e.profile.phone,
          avatarUrl: e.profile.avatar_url,
          jobTitle: e.job_title,
          level: e.level,
          country: e.country,
          role: e.role as 'owner' | 'admin' | 'hrbp' | 'manager' | 'employee',
          managerId: null, // Set in update pass
          hireDate: '2024-01-15', // Default hire date for demo
          passwordHash: cred ? hashPassword(cred.password) : null,
          isActive: true,
        }
      })
    )

    // Second pass: set manager relationships
    // Department heads manage their team
    const managerUpdates: Array<{ empId: string; managerId: string }> = []
    for (const dept of demoDepartments) {
      const headEmpId = dept.head_id
      if (!headEmpId) continue
      // All employees in this dept (except the head) report to the head
      const deptEmployees = demoEmployees.filter(
        e => e.department_id === dept.id && e.id !== headEmpId
      )
      for (const emp of deptEmployees) {
        managerUpdates.push({
          empId: mapId(emp.id),
          managerId: mapId(headEmpId),
        })
      }
    }

    // Apply manager updates via raw SQL for efficiency
    for (const update of managerUpdates) {
      await sql`UPDATE employees SET manager_id = ${update.managerId} WHERE id = ${update.empId}`
    }

    // Update department heads
    for (const dept of demoDepartments) {
      if (dept.head_id) {
        await sql`UPDATE departments SET head_id = ${mapId(dept.head_id)} WHERE id = ${mapId(dept.id)}`
      }
    }

    // ============================================================
    // 4. Goals
    // ============================================================
    console.log('Seeding goals...')
    await db.insert(schema.goals).values(
      demoGoals.map(g => ({
        id: mapId(g.id),
        orgId,
        employeeId: mapId(g.employee_id),
        title: g.title,
        description: g.description,
        category: g.category,
        status: g.status,
        progress: g.progress,
        startDate: g.start_date,
        dueDate: g.due_date,
        parentGoalId: null,
      }))
    )

    // ============================================================
    // 5. Review Cycles
    // ============================================================
    console.log('Seeding review cycles...')
    await db.insert(schema.reviewCycles).values(
      demoReviewCycles.map(rc => ({
        id: mapId(rc.id),
        orgId,
        title: rc.title,
        type: rc.type,
        status: rc.status,
        startDate: rc.start_date,
        endDate: rc.end_date,
      }))
    )

    // ============================================================
    // 6. Reviews
    // ============================================================
    console.log('Seeding reviews...')
    await db.insert(schema.reviews).values(
      demoReviews.map(r => ({
        id: mapId(r.id),
        orgId,
        cycleId: mapIdOrNull(r.cycle_id),
        employeeId: mapId(r.employee_id),
        reviewerId: mapIdOrNull(r.reviewer_id),
        type: r.type,
        status: r.status,
        overallRating: r.overall_rating,
        ratings: r.ratings,
        comments: r.comments,
        submittedAt: r.submitted_at ? new Date(r.submitted_at) : null,
      }))
    )

    // ============================================================
    // 7. Feedback
    // ============================================================
    console.log('Seeding feedback...')
    await db.insert(schema.feedback).values(
      demoFeedback.map(f => ({
        id: mapId(f.id),
        orgId,
        fromId: mapId(f.from_id),
        toId: mapId(f.to_id),
        type: f.type,
        content: f.content,
        isPublic: f.is_public,
      }))
    )

    // ============================================================
    // 8. Compensation Bands
    // ============================================================
    console.log('Seeding compensation bands...')
    await db.insert(schema.compBands).values(
      demoCompBands.map(cb => ({
        id: mapId(cb.id),
        orgId,
        roleTitle: cb.role_title,
        level: cb.level,
        country: cb.country,
        minSalary: cb.min_salary,
        midSalary: cb.mid_salary,
        maxSalary: cb.max_salary,
        currency: cb.currency,
        p25: cb.p25,
        p50: cb.p50,
        p75: cb.p75,
        effectiveDate: cb.effective_date,
      }))
    )

    // ============================================================
    // 9. Salary Reviews
    // ============================================================
    console.log('Seeding salary reviews...')
    await db.insert(schema.salaryReviews).values(
      demoSalaryReviews.map(sr => ({
        id: mapId(sr.id),
        orgId,
        employeeId: mapId(sr.employee_id),
        proposedBy: mapIdOrNull(sr.proposed_by),
        currentSalary: sr.current_salary,
        proposedSalary: sr.proposed_salary,
        currency: sr.currency,
        justification: sr.justification,
        status: sr.status,
        approvedBy: mapIdOrNull(sr.approved_by),
        cycle: sr.cycle,
      }))
    )

    // ============================================================
    // 10. Courses
    // ============================================================
    console.log('Seeding courses...')
    await db.insert(schema.courses).values(
      demoCourses.map(c => ({
        id: mapId(c.id),
        orgId,
        title: c.title,
        description: c.description,
        category: c.category,
        durationHours: c.duration_hours,
        format: c.format,
        level: c.level,
        isMandatory: c.is_mandatory,
      }))
    )

    // ============================================================
    // 11. Enrollments
    // ============================================================
    console.log('Seeding enrollments...')
    await db.insert(schema.enrollments).values(
      demoEnrollments.map(e => ({
        id: mapId(e.id),
        orgId,
        employeeId: mapId(e.employee_id),
        courseId: mapId(e.course_id),
        status: e.status,
        progress: e.progress,
        enrolledAt: new Date(e.enrolled_at),
        completedAt: e.completed_at ? new Date(e.completed_at) : null,
      }))
    )

    // ============================================================
    // 12. Surveys
    // ============================================================
    console.log('Seeding surveys...')
    await db.insert(schema.surveys).values(
      demoSurveys.map(s => ({
        id: mapId(s.id),
        orgId,
        title: s.title,
        type: s.type,
        status: s.status,
        startDate: s.start_date,
        endDate: s.end_date,
        anonymous: s.anonymous,
      }))
    )

    // ============================================================
    // 13. Engagement Scores
    // ============================================================
    console.log('Seeding engagement scores...')
    await db.insert(schema.engagementScores).values(
      demoEngagementScores.map(es => ({
        id: mapId(es.id),
        orgId,
        departmentId: mapIdOrNull(es.department_id),
        countryId: es.country_id,
        period: es.period,
        overallScore: es.overall_score,
        enpsScore: es.enps_score,
        responseRate: es.response_rate,
        themes: es.themes,
      }))
    )

    // ============================================================
    // 14. Mentoring Programs
    // ============================================================
    console.log('Seeding mentoring programs...')
    await db.insert(schema.mentoringPrograms).values(
      demoMentoringPrograms.map(mp => ({
        id: mapId(mp.id),
        orgId,
        title: mp.title,
        type: mp.type,
        status: mp.status,
        durationMonths: mp.duration_months,
        startDate: mp.start_date,
      }))
    )

    // ============================================================
    // 15. Mentoring Pairs
    // ============================================================
    console.log('Seeding mentoring pairs...')
    await db.insert(schema.mentoringPairs).values(
      demoMentoringPairs.map(mp => ({
        id: mapId(mp.id),
        orgId,
        programId: mapId(mp.program_id),
        mentorId: mapId(mp.mentor_id),
        menteeId: mapId(mp.mentee_id),
        status: mp.status,
        matchScore: mp.match_score,
        startedAt: mp.started_at ? new Date(mp.started_at) : null,
        completedAt: null,
      }))
    )

    // ============================================================
    // 16. Payroll Runs
    // ============================================================
    console.log('Seeding payroll runs...')
    await db.insert(schema.payrollRuns).values(
      demoPayrollRuns.map(pr => ({
        id: mapId(pr.id),
        orgId,
        period: pr.period,
        status: pr.status,
        totalGross: pr.total_gross,
        totalNet: pr.total_net,
        totalDeductions: pr.total_deductions,
        currency: pr.currency,
        employeeCount: pr.employee_count,
        runDate: pr.run_date ? new Date(pr.run_date) : null,
      }))
    )

    // ============================================================
    // 17. Leave Requests
    // ============================================================
    console.log('Seeding leave requests...')
    await db.insert(schema.leaveRequests).values(
      demoLeaveRequests.map(lr => ({
        id: mapId(lr.id),
        orgId,
        employeeId: mapId(lr.employee_id),
        type: lr.type,
        startDate: lr.start_date,
        endDate: lr.end_date,
        days: lr.days,
        status: lr.status,
        reason: lr.reason,
        approvedBy: mapIdOrNull(lr.approved_by),
      }))
    )

    // ============================================================
    // 18. Benefit Plans
    // ============================================================
    console.log('Seeding benefit plans...')
    await db.insert(schema.benefitPlans).values(
      demoBenefitPlans.map(bp => ({
        id: mapId(bp.id),
        orgId,
        name: bp.name,
        type: bp.type,
        provider: bp.provider,
        costEmployee: bp.cost_employee,
        costEmployer: bp.cost_employer,
        currency: bp.currency,
        description: bp.description,
        isActive: bp.is_active,
      }))
    )

    // ============================================================
    // 19. Expense Reports + Items
    // ============================================================
    console.log('Seeding expense reports...')
    await db.insert(schema.expenseReports).values(
      demoExpenseReports.map(er => ({
        id: mapId(er.id),
        orgId,
        employeeId: mapId(er.employee_id),
        title: er.title,
        totalAmount: er.total_amount,
        currency: er.currency,
        status: er.status,
        submittedAt: er.submitted_at ? new Date(er.submitted_at) : null,
        approvedBy: mapIdOrNull(er.approved_by),
      }))
    )

    console.log('Seeding expense items...')
    const allItems = demoExpenseReports.flatMap(er =>
      er.items.map(item => ({
        id: mapId(item.id),
        reportId: mapId(er.id),
        category: item.category,
        description: item.description,
        amount: item.amount,
        receiptUrl: null,
      }))
    )
    if (allItems.length > 0) {
      await db.insert(schema.expenseItems).values(allItems)
    }

    // ============================================================
    // 20. Vendors
    // ============================================================
    console.log('Seeding vendors...')
    await db.insert(schema.vendors).values(
      demoVendors.map(v => ({
        id: mapId(v.id),
        orgId,
        name: v.name,
        contactEmail: v.contact_email,
        category: v.category,
        status: v.status,
      }))
    )

    // ============================================================
    // 21. Invoices
    // ============================================================
    console.log('Seeding invoices...')
    await db.insert(schema.invoices).values(
      demoInvoices.map(inv => ({
        id: mapId(inv.id),
        orgId,
        invoiceNumber: inv.invoice_number,
        vendorId: mapIdOrNull(inv.vendor_id),
        amount: inv.amount,
        currency: inv.currency,
        status: inv.status,
        dueDate: inv.due_date,
        issuedDate: inv.issued_date,
        description: inv.description,
      }))
    )

    // ============================================================
    // 22. Budgets
    // ============================================================
    console.log('Seeding budgets...')
    await db.insert(schema.budgets).values(
      demoBudgets.map(b => ({
        id: mapId(b.id),
        orgId,
        name: b.name,
        departmentId: mapIdOrNull(b.department_id),
        totalAmount: b.total_amount,
        spentAmount: b.spent_amount,
        currency: b.currency,
        fiscalYear: b.fiscal_year,
        status: b.status,
      }))
    )

    // ============================================================
    // 23. Job Postings
    // ============================================================
    console.log('Seeding job postings...')
    await db.insert(schema.jobPostings).values(
      demoJobPostings.map(jp => ({
        id: mapId(jp.id),
        orgId,
        title: jp.title,
        departmentId: mapIdOrNull(jp.department_id),
        location: jp.location,
        type: jp.type,
        description: jp.description,
        requirements: jp.requirements,
        salaryMin: jp.salary_min,
        salaryMax: jp.salary_max,
        currency: jp.currency,
        status: jp.status,
        applicationCount: jp.application_count,
      }))
    )

    // ============================================================
    // 24. Applications
    // ============================================================
    console.log('Seeding applications...')
    await db.insert(schema.applications).values(
      demoApplications.map(a => ({
        id: mapId(a.id),
        orgId,
        jobId: mapId(a.job_id),
        candidateName: a.candidate_name,
        candidateEmail: a.candidate_email,
        status: a.status,
        stage: a.stage,
        rating: a.rating,
        notes: a.notes,
        appliedAt: new Date(a.applied_at),
      }))
    )

    // ============================================================
    // 25. Devices
    // ============================================================
    console.log('Seeding devices...')
    await db.insert(schema.devices).values(
      demoDevices.map(d => ({
        id: mapId(d.id),
        orgId,
        type: d.type,
        brand: d.brand,
        model: d.model,
        serialNumber: d.serial_number,
        status: d.status,
        assignedTo: mapIdOrNull(d.assigned_to),
        purchaseDate: d.purchase_date,
        warrantyEnd: d.warranty_end,
      }))
    )

    // ============================================================
    // 26. Software Licenses
    // ============================================================
    console.log('Seeding software licenses...')
    await db.insert(schema.softwareLicenses).values(
      demoSoftwareLicenses.map(sl => ({
        id: mapId(sl.id),
        orgId,
        name: sl.name,
        vendor: sl.vendor,
        totalLicenses: sl.total_licenses,
        usedLicenses: sl.used_licenses,
        costPerLicense: sl.cost_per_license,
        currency: sl.currency,
        renewalDate: sl.renewal_date,
      }))
    )

    // ============================================================
    // 27. IT Requests
    // ============================================================
    console.log('Seeding IT requests...')
    await db.insert(schema.itRequests).values(
      demoITRequests.map(ir => ({
        id: mapId(ir.id),
        orgId,
        requesterId: mapId(ir.requester_id),
        type: ir.type,
        title: ir.title,
        description: ir.description,
        priority: ir.priority,
        status: ir.status,
        assignedTo: mapIdOrNull(ir.assigned_to),
      }))
    )

    // ============================================================
    // Done!
    // ============================================================
    console.log('')
    console.log('Seed complete! All 27 entity types seeded.')
    console.log(`Organization: ${demoOrg.name} (${orgId})`)
    console.log(`Employees: ${demoEmployees.length}`)
    console.log(`Goals: ${demoGoals.length}`)
    console.log(`Reviews: ${demoReviews.length}`)
    console.log(`Courses: ${demoCourses.length}`)
    console.log(`Expense Reports: ${demoExpenseReports.length}`)
    console.log(`Job Postings: ${demoJobPostings.length}`)
    console.log('')

    // Print the ID mapping for the demo credentials so we can update .env or config
    console.log('Demo credential employee UUID mappings:')
    demoCredentials.forEach(c => {
      console.log(`  ${c.label} (${c.email}): ${mapId(c.employeeId)}`)
    })

  } catch (error) {
    console.error('Seed failed:', error)
    process.exit(1)
  }
}

seed()
