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
  // Gap-closure modules
  demoCorporateCards, demoCardTransactions,
  demoBillPayments, demoBillPaySchedules,
  demoTravelRequests, demoTravelBookings, demoTravelPolicies,
  demoSignatureDocuments, demoSignatureTemplates,
  demoIdpConfigurations, demoSamlApps, demoMfaPolicies,
  demoCurrencyAccounts, demoFxTransactions,
  demoWorkersCompPolicies, demoWorkersCompClaims, demoWorkersCompClassCodes, demoWorkersCompAudits,
  demoPasswordVaults, demoVaultItems,
  demoChatChannels, demoChatParticipants, demoChatMessages,
  demoGroups,
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
  // Gap-closure modules
  demoCorporateCards.forEach(c => mapId(c.id))
  demoCardTransactions.forEach(t => mapId(t.id))
  demoBillPayments.forEach(bp => mapId(bp.id))
  demoBillPaySchedules.forEach(bs => mapId(bs.id))
  demoTravelPolicies.forEach(tp => mapId(tp.id))
  demoTravelRequests.forEach(tr => mapId(tr.id))
  demoTravelBookings.forEach(tb => mapId(tb.id))
  demoSignatureDocuments.forEach(sd => mapId(sd.id))
  demoSignatureTemplates.forEach(st => mapId(st.id))
  demoIdpConfigurations.forEach(idp => mapId(idp.id))
  demoSamlApps.forEach(sa => mapId(sa.id))
  demoMfaPolicies.forEach(mp => mapId(mp.id))
  demoCurrencyAccounts.forEach(ca => mapId(ca.id))
  demoFxTransactions.forEach(fx => mapId(fx.id))
  demoWorkersCompPolicies.forEach(wc => mapId(wc.id))
  demoWorkersCompClaims.forEach(wc => mapId(wc.id))
  demoWorkersCompClassCodes.forEach(wc => mapId(wc.id))
  demoWorkersCompAudits.forEach(wc => mapId(wc.id))
  demoPasswordVaults.forEach(pv => mapId(pv.id))
  demoVaultItems.forEach(vi => mapId(vi.id))
  demoChatChannels.forEach(ch => mapId(ch.id))
  demoChatParticipants.forEach(cp => mapId(cp.id))
  demoChatMessages.forEach(cm => mapId(cm.id))
  // Note: channel IDs are chan-*, message IDs are cmsg-*, participant IDs are cp-*
  demoGroups.forEach(g => mapId(g.id))
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
        status: (a.status === 'interview' ? 'phone_screen' : a.status) as any,
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
    // 28. Corporate Cards
    // ============================================================
    console.log('Seeding corporate cards...')
    await db.insert(schema.corporateCards).values(
      demoCorporateCards.map(c => ({
        id: mapId(c.id),
        orgId,
        employeeId: mapId(c.employee_id),
        cardType: c.card_type as any,
        last4: c.last_four,
        cardName: `${c.card_type} Card •${c.last_four}`,
        status: c.status as any,
        spendLimit: c.spend_limit,
        currentBalance: c.spent_this_month,
        currency: c.currency,
        allowedCategories: c.merchant_categories,
        issuedAt: new Date(c.issued_at),
      }))
    )

    // ============================================================
    // 29. Card Transactions
    // ============================================================
    console.log('Seeding card transactions...')
    await db.insert(schema.cardTransactions).values(
      demoCardTransactions.map(t => ({
        id: mapId(t.id),
        orgId,
        cardId: mapId(t.card_id),
        amount: t.amount,
        currency: t.currency,
        merchantName: t.merchant,
        merchantCategory: t.category,
        status: t.status as any,
        receiptUrl: t.receipt_url || null,
        transactedAt: new Date(t.transaction_date),
      }))
    )

    // ============================================================
    // 30. Bill Payments
    // ============================================================
    console.log('Seeding bill payments...')
    await db.insert(schema.billPayments).values(
      demoBillPayments.map(bp => ({
        id: mapId(bp.id),
        orgId,
        vendorId: mapId(bp.vendor_id),
        amount: bp.amount,
        currency: bp.currency,
        method: bp.method as any,
        status: bp.status as any,
        scheduledDate: bp.scheduled_date || null,
        paidDate: bp.paid_date || null,
        referenceNumber: bp.reference_number || null,
        memo: bp.memo || null,
        createdBy: mapId(bp.created_by),
      }))
    )

    // ============================================================
    // 31. Bill Pay Schedules
    // ============================================================
    console.log('Seeding bill pay schedules...')
    await db.insert(schema.billPaySchedules).values(
      demoBillPaySchedules.map(bs => ({
        id: mapId(bs.id),
        orgId,
        vendorId: mapId(bs.vendor_id),
        amount: bs.amount,
        currency: bs.currency,
        method: bs.method as any,
        frequency: bs.frequency,
        nextPaymentDate: bs.next_payment_date || null,
        endDate: bs.end_date || null,
        isActive: bs.is_active,
      }))
    )

    // ============================================================
    // 32. Travel Policies
    // ============================================================
    console.log('Seeding travel policies...')
    await db.insert(schema.travelPolicies).values(
      demoTravelPolicies.map(tp => ({
        id: mapId(tp.id),
        orgId,
        name: tp.name,
        maxFlightClass: tp.rules?.max_flight_class || 'economy',
        maxHotelRate: tp.rules?.max_hotel_rate || null,
        maxDailyMeals: tp.rules?.meal_per_diem || null,
        advanceBookingDays: tp.rules?.advance_booking_days || 14,
        approvalThreshold: tp.rules?.requires_approval_above || null,
        isActive: tp.is_active,
      }))
    )

    // ============================================================
    // 33. Travel Requests
    // ============================================================
    console.log('Seeding travel requests...')
    await db.insert(schema.travelRequests).values(
      demoTravelRequests.map(tr => ({
        id: mapId(tr.id),
        orgId,
        employeeId: mapId(tr.employee_id),
        purpose: tr.purpose,
        destination: tr.destination,
        departureDate: tr.travel_dates?.start || '2026-03-15',
        returnDate: tr.travel_dates?.end || '2026-03-18',
        estimatedCost: tr.estimated_cost,
        currency: 'USD',
        status: tr.status as any,
        approvedBy: mapIdOrNull(tr.approved_by),
      }))
    )

    // ============================================================
    // 34. Travel Bookings
    // ============================================================
    console.log('Seeding travel bookings...')
    await db.insert(schema.travelBookings).values(
      demoTravelBookings.map(tb => ({
        id: mapId(tb.id),
        orgId,
        travelRequestId: mapId(tb.travel_request_id),
        type: tb.type as any,
        status: tb.status as any,
        provider: tb.provider || null,
        confirmationNumber: tb.confirmation_number || null,
        amount: tb.cost,
        currency: tb.currency,
        details: tb.details || null,
        startDate: (tb.details as any)?.date || '2026-03-15',
        bookedAt: tb.booked_at ? new Date(tb.booked_at) : null,
      }))
    )

    // ============================================================
    // 35. Signature Templates
    // ============================================================
    console.log('Seeding signature templates...')
    await db.insert(schema.signatureTemplates).values(
      demoSignatureTemplates.map(st => ({
        id: mapId(st.id),
        orgId,
        name: st.name,
        description: st.description || null,
        documentUrl: st.document_url || null,
        signingFlow: st.signing_flow as any,
        signerRoles: st.signer_roles || null,
        usageCount: st.usage_count || 0,
      }))
    )

    // ============================================================
    // 36. Signature Documents
    // ============================================================
    console.log('Seeding signature documents...')
    await db.insert(schema.signatureDocuments).values(
      demoSignatureDocuments.map(sd => ({
        id: mapId(sd.id),
        orgId,
        title: sd.title,
        documentUrl: sd.document_url || null,
        status: sd.status as any,
        signingFlow: sd.signing_flow as any,
        createdBy: mapId(sd.created_by),
        completedAt: sd.completed_at ? new Date(sd.completed_at) : null,
      }))
    )

    // ============================================================
    // 37. Identity Provider Configurations
    // ============================================================
    console.log('Seeding IDP configurations...')
    await db.insert(schema.idpConfigurations).values(
      demoIdpConfigurations.map(idp => ({
        id: mapId(idp.id),
        orgId,
        isEnabled: idp.status === 'active',
        defaultProtocol: idp.protocol as any,
        entityId: idp.entity_id,
        ssoUrl: idp.sso_url,
        certificate: 'DEMO_CERTIFICATE_PLACEHOLDER',
      }))
    )

    // ============================================================
    // 38. SAML Apps
    // ============================================================
    console.log('Seeding SAML apps...')
    await db.insert(schema.samlApps).values(
      demoSamlApps.map(sa => ({
        id: mapId(sa.id),
        orgId,
        idpConfigId: mapId(sa.idp_id),
        name: sa.name,
        logo: sa.logo_url || null,
        acsUrl: sa.sso_url || null,
        status: sa.status as any,
        loginCount: sa.user_count || 0,
        lastLoginAt: sa.last_login_at ? new Date(sa.last_login_at) : null,
      }))
    )

    // ============================================================
    // 39. MFA Policies
    // ============================================================
    console.log('Seeding MFA policies...')
    await db.insert(schema.mfaPolicies).values(
      demoMfaPolicies.map(mp => ({
        id: mapId(mp.id),
        orgId,
        name: mp.name,
        isActive: mp.is_active,
        allowedMethods: mp.methods || ['totp'],
        gracePeriodhours: (mp.grace_period_days || 0) * 24,
        appliesTo: mp.applies_to as any,
      }))
    )

    // ============================================================
    // 40. Currency Accounts
    // ============================================================
    console.log('Seeding currency accounts...')
    await db.insert(schema.currencyAccounts).values(
      demoCurrencyAccounts.map(ca => ({
        id: mapId(ca.id),
        orgId,
        currency: ca.currency,
        balance: ca.balance,
        bankName: ca.bank_name || null,
        bankAccountNumber: ca.account_number || null,
        isDefault: ca.is_primary || false,
      }))
    )

    // ============================================================
    // 41. FX Transactions
    // ============================================================
    console.log('Seeding FX transactions...')
    await db.insert(schema.fxTransactions).values(
      demoFxTransactions.map(fx => ({
        id: mapId(fx.id),
        orgId,
        fromCurrency: fx.from_currency,
        toCurrency: fx.to_currency,
        fromAmount: fx.from_amount,
        toAmount: fx.to_amount,
        exchangeRate: fx.exchange_rate,
        fee: fx.fee || null,
        executedAt: new Date(fx.executed_at),
      }))
    )

    // ============================================================
    // 42. Workers' Comp Policies
    // ============================================================
    console.log('Seeding workers comp policies...')
    await db.insert(schema.workersCompPolicies).values(
      demoWorkersCompPolicies.map(wc => ({
        id: mapId(wc.id),
        orgId,
        name: wc.name,
        carrier: wc.carrier || null,
        policyNumber: wc.policy_number || null,
        status: wc.status,
        effectiveDate: wc.effective_date || null,
        expiryDate: wc.expiry_date || null,
        premium: wc.premium || null,
        coveredEmployees: wc.covered_employees || null,
        classCodes: wc.class_codes || null,
      }))
    )

    // ============================================================
    // 43. Workers' Comp Claims
    // ============================================================
    console.log('Seeding workers comp claims...')
    await db.insert(schema.workersCompClaims).values(
      demoWorkersCompClaims.map(wc => ({
        id: mapId(wc.id),
        orgId,
        policyId: mapIdOrNull(wc.policy_id),
        employeeName: wc.employee_name || null,
        incidentDate: wc.incident_date || null,
        description: wc.description || null,
        injuryType: wc.injury_type || null,
        bodyPart: wc.body_part || null,
        status: wc.status,
        reserveAmount: wc.reserve_amount || null,
        paidAmount: wc.paid_amount || 0,
        filedDate: wc.filed_date || null,
      }))
    )

    // ============================================================
    // 44. Workers' Comp Class Codes
    // ============================================================
    console.log('Seeding workers comp class codes...')
    await db.insert(schema.workersCompClassCodes).values(
      demoWorkersCompClassCodes.map(wc => ({
        id: mapId(wc.id),
        orgId,
        code: wc.code,
        description: wc.description || null,
        rate: wc.rate || null,
        employeeCount: wc.employee_count || null,
      }))
    )

    // ============================================================
    // 45. Workers' Comp Audits
    // ============================================================
    console.log('Seeding workers comp audits...')
    await db.insert(schema.workersCompAudits).values(
      demoWorkersCompAudits.map(wc => ({
        id: mapId(wc.id),
        orgId,
        auditDate: wc.audit_date || null,
        period: wc.period || null,
        auditor: wc.auditor || null,
        status: wc.status,
        findings: wc.findings || null,
        adjustmentAmount: wc.adjustment_amount || null,
      }))
    )

    // ============================================================
    // 46. Password Vaults
    // ============================================================
    console.log('Seeding password vaults...')
    await db.insert(schema.passwordVaults).values(
      demoPasswordVaults.map(pv => ({
        id: mapId(pv.id),
        orgId,
        name: pv.name,
        ownerId: mapId(pv.owner_id),
        itemCount: pv.item_count || 0,
      }))
    )

    // ============================================================
    // 47. Vault Items
    // ============================================================
    console.log('Seeding vault items...')
    await db.insert(schema.vaultItems).values(
      demoVaultItems.map(vi => ({
        id: mapId(vi.id),
        vaultId: mapId(vi.vault_id),
        orgId,
        type: vi.type as any,
        name: vi.name,
        url: vi.url || null,
        username: vi.username || null,
        passwordStrength: vi.strength || null,
        lastUsedAt: vi.last_used_at ? new Date(vi.last_used_at) : null,
      }))
    )

    // ============================================================
    // 48. Chat Channels
    // ============================================================
    console.log('Seeding chat channels...')
    await db.insert(schema.chatChannels).values(
      demoChatChannels.map(ch => ({
        id: mapId(ch.id),
        orgId,
        name: ch.name,
        type: ch.type as any,
        description: ch.description || null,
        createdBy: mapId(ch.created_by),
        isArchived: ch.is_archived || false,
        lastMessageAt: ch.last_message_at ? new Date(ch.last_message_at) : null,
      }))
    )

    // ============================================================
    // 49. Chat Participants
    // ============================================================
    console.log('Seeding chat participants...')
    await db.insert(schema.chatParticipants).values(
      demoChatParticipants.map(cp => ({
        id: mapId(cp.id),
        channelId: mapId(cp.channel_id),
        employeeId: mapId(cp.employee_id),
        role: cp.role,
        joinedAt: cp.joined_at ? new Date(cp.joined_at) : new Date(),
      }))
    )

    // ============================================================
    // 50. Chat Messages
    // ============================================================
    console.log('Seeding chat messages...')
    await db.insert(schema.chatMessages).values(
      demoChatMessages.map(cm => ({
        id: mapId(cm.id),
        channelId: mapId(cm.channel_id),
        orgId,
        senderId: mapId(cm.sender_id),
        type: cm.type as any,
        content: cm.content,
        isPinned: (cm as any).is_pinned || false,
      }))
    )

    // ============================================================
    // 51. Dynamic Groups
    // ============================================================
    console.log('Seeding dynamic groups...')
    await db.insert(schema.dynamicGroups).values(
      demoGroups.map(g => ({
        id: mapId(g.id),
        orgId,
        name: g.name,
        description: g.description || null,
        type: g.type,
        rule: g.rule || null,
        memberCount: g.member_count || 0,
        createdBy: mapIdOrNull(g.created_by),
        lastSyncedAt: g.last_synced_at ? new Date(g.last_synced_at) : null,
        modules: g.modules || null,
      }))
    )

    // ============================================================
    // Done!
    // ============================================================
    console.log('')
    console.log('Seed complete! All 51 entity types seeded.')
    console.log(`Organization: ${demoOrg.name} (${orgId})`)
    console.log(`Employees: ${demoEmployees.length}`)
    console.log(`Goals: ${demoGoals.length}`)
    console.log(`Reviews: ${demoReviews.length}`)
    console.log(`Courses: ${demoCourses.length}`)
    console.log(`Expense Reports: ${demoExpenseReports.length}`)
    console.log(`Job Postings: ${demoJobPostings.length}`)
    console.log(`Corporate Cards: ${demoCorporateCards.length}`)
    console.log(`Travel Requests: ${demoTravelRequests.length}`)
    console.log(`Chat Channels: ${demoChatChannels.length}`)
    console.log(`Groups: ${demoGroups.length}`)
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
