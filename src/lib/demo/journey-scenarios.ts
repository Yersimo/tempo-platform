// Journey Demo Data Seeding Service
// Seeds realistic data for 6 customer evaluation journeys
// Uses store add* methods to APPEND data (never replaces)

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TempoStore = Record<string, any>

// Safely call a store method, catching errors from API persistence failures.
// In demo mode the store add/update methods try to POST to /api/data which
// fails because demo UUIDs aren't real DB records. We only need local state.
function safeCall(fn: ((...args: any[]) => any) | undefined, ...args: any[]): void {
  if (!fn) return // method doesn't exist on store — skip silently
  try {
    const result = fn(...args)
    // If the method returns a promise, swallow its rejection too
    if (result && typeof result.catch === 'function') {
      result.catch(() => {/* demo mode — API failure expected */})
    }
  } catch {
    // demo mode — API failure expected, local state was still updated
  }
}

const ORG_ID = 'org-1'
const TODAY = new Date().toISOString().split('T')[0]
const NOW = new Date().toISOString()

function futureDate(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}
function pastDate(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().split('T')[0]
}
function pastISO(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString()
}

// Stable UUIDs for cross-referencing within journeys
const J1 = {
  empId: 'emp-j1-akosua',
  posId: 'hcpos-j1-designer',
  jobId: 'job-j1-designer',
  appAkosua: 'app-j1-akosua',
  appReject1: 'app-j1-reject1',
  appReject2: 'app-j1-reject2',
  bandId: 'band-j1-l3design',
  journeyId: 'journey-j1-onboard',
  momentId: 'moment-j1-newhire',
  reviewId: 'rev-j1-90day',
  courseDesign: 'course-j1-design',
  courseCulture: 'course-j1-culture',
  courseSecurity: 'course-j1-security',
  enrollDesign: 'enroll-j1-design',
  enrollCulture: 'enroll-j1-culture',
  enrollSecurity: 'enroll-j1-security',
  surveyId: 'survey-j1-pulse30',
  scorecard1: 'sc-j1-1',
  scorecard2: 'sc-j1-2',
  interview1: 'int-j1-1',
  interview2: 'int-j1-2',
}

const J2 = {
  empId: 'emp-j2-kofi',
  offboardProcessId: 'offb-j2-process',
  exitSurveyId: 'exit-j2-survey',
  gigId: 'gig-j2-senioreng',
  succPlanId: 'succ-j2-plan',
}

const J3 = {
  empId: 'emp-j3-sarah',
  mentorPairId: 'mpair-j3-sarah',
  mentorProgramId: 'mprog-j3-retention',
  succPlanId: 'succ-j3-vpproduct',
  gigId: 'gig-j3-vprole',
}

const J4 = {
  payrollRunId: 'pr-j4-march',
  glPeriodId: 'gl-j4-march',
}

const J5 = {
  empId: 'emp-j5-james',
  succPlanId: 'succ-j5-vpeng',
  mentorPairId: 'mpair-j5-james',
  mentorProgramId: 'mprog-j5-leadership',
  learningPathId: 'lpath-j5-leadership',
  gigId: 'gig-j5-taskforce',
  momentId: 'moment-j5-promo',
}

const J6 = {
  posId: 'hcpos-j6-tz',
  eorId: 'eor-j6-tz',
  journeyTemplateId: 'jtemp-j6-tz',
  bankAccountId: 'ba-j6-tz',
}

// ────────────────────────────────────────────────────────
// Journey 1: Hire-to-Perform
// ────────────────────────────────────────────────────────
export function seedJourney1_HireToPerform(store: TempoStore): void {
  // Design department
  const deptId = 'dept-8' // Marketing/Design — closest existing dept

  // 1. Headcount position
  safeCall(store.addHeadcountPosition, {
    id: J1.posId, plan_id: 'hcp-1', org_id: ORG_ID, department_id: deptId,
    job_title: 'Product Designer', level: 'L3', type: 'new',
    status: 'approved', priority: 'high',
    salary_min: 600000, salary_max: 900000, currency: 'GHS',
    target_start_date: TODAY, filled_by: null, filled_at: null,
    justification: 'Growing design team to support mobile banking redesign',
    approved_by: 'emp-27', created_at: pastISO(30), updated_at: NOW,
  })

  // 2. Job posting
  safeCall(store.addJobPosting, {
    id: J1.jobId, org_id: ORG_ID, title: 'Product Designer',
    department_id: deptId, location: 'Accra, Ghana', type: 'full_time',
    description: 'Join our Design team to craft beautiful mobile banking experiences for millions of users across Africa.',
    requirements: '3+ years product design, Figma expertise, UX research experience, portfolio required',
    salary_min: 600000, salary_max: 900000, currency: 'GHS',
    status: 'closed', created_at: pastISO(21), application_count: 3,
  })

  // 3. Applications (Akosua at offer, 2 rejected)
  safeCall(store.addApplication, {
    id: J1.appAkosua, org_id: ORG_ID, job_id: J1.jobId,
    candidate_name: 'Akosua Mensah', candidate_email: 'akosua.mensah@gmail.com',
    status: 'offer', stage: 'Offer Accepted', rating: 4.5,
    notes: 'Outstanding portfolio, strong UX research skills. Former lead at MTN Ghana digital team.',
    applied_at: pastISO(18),
  })
  safeCall(store.addApplication, {
    id: J1.appReject1, org_id: ORG_ID, job_id: J1.jobId,
    candidate_name: 'Kwadwo Asare', candidate_email: 'k.asare@mail.com',
    status: 'rejected', stage: 'Rejected', rating: 2.5,
    notes: 'Limited portfolio; did not demonstrate required Figma proficiency.',
    applied_at: pastISO(17),
  })
  safeCall(store.addApplication, {
    id: J1.appReject2, org_id: ORG_ID, job_id: J1.jobId,
    candidate_name: 'Esi Boateng', candidate_email: 'esi.b@outlook.com',
    status: 'rejected', stage: 'Rejected after Interview', rating: 3.0,
    notes: 'Good fundamentals but lacked experience with user testing at scale.',
    applied_at: pastISO(16),
  })

  // 4. Interviews
  safeCall(store.addInterview, {
    id: J1.interview1, org_id: ORG_ID, application_id: J1.appAkosua,
    interviewer_id: 'emp-27', type: 'technical', status: 'completed',
    scheduled_at: pastISO(10), duration_minutes: 60,
    feedback: 'Excellent design thinking. Solved our take-home exercise with creative solutions.',
    rating: 5, created_at: pastISO(12),
  })
  safeCall(store.addInterview, {
    id: J1.interview2, org_id: ORG_ID, application_id: J1.appAkosua,
    interviewer_id: 'emp-29', type: 'behavioral', status: 'completed',
    scheduled_at: pastISO(7), duration_minutes: 45,
    feedback: 'Strong culture fit. Collaborative mindset, asks great questions.',
    rating: 4, created_at: pastISO(9),
  })

  // 5. Scorecards
  safeCall(store.addScoreCard, {
    id: J1.scorecard1, org_id: ORG_ID, application_id: J1.appAkosua,
    interviewer_id: 'emp-27', overall_rating: 5, status: 'submitted',
    criteria: [
      { name: 'Design Skills', rating: 5, notes: 'Expert-level Figma work' },
      { name: 'UX Research', rating: 4, notes: 'Solid methodology, could deepen quantitative skills' },
      { name: 'Communication', rating: 5, notes: 'Articulate and clear presenter' },
    ],
    recommendation: 'strong_yes', submitted_at: pastISO(9), created_at: pastISO(10),
  })
  safeCall(store.addScoreCard, {
    id: J1.scorecard2, org_id: ORG_ID, application_id: J1.appAkosua,
    interviewer_id: 'emp-29', overall_rating: 4, status: 'submitted',
    criteria: [
      { name: 'Culture Fit', rating: 5, notes: 'Values alignment strong' },
      { name: 'Collaboration', rating: 4, notes: 'Good team player mentality' },
      { name: 'Growth Mindset', rating: 4, notes: 'Eager to learn and develop' },
    ],
    recommendation: 'yes', submitted_at: pastISO(6), created_at: pastISO(7),
  })

  // 6. Comp band
  safeCall(store.addCompBand, {
    id: J1.bandId, org_id: ORG_ID, role_title: 'Product Designer', level: 'L3',
    country: 'Ghana', min_salary: 600000, mid_salary: 750000, max_salary: 900000,
    currency: 'GHS', p25: 650000, p50: 750000, p75: 850000,
    effective_date: '2026-01-01',
  })

  // 7. Employee record for Akosua
  safeCall(store.addEmployee, {
    id: J1.empId, org_id: ORG_ID, department_id: deptId,
    job_title: 'Product Designer', level: 'L3', country: 'Ghana',
    role: 'employee', manager_id: 'emp-27', hire_date: TODAY, status: 'active',
    profile: {
      full_name: 'Akosua Mensah', email: 'a.mensah@ecobank.com',
      avatar_url: null, phone: '+233 24 555 1234',
    },
  })

  // 8. Onboarding Journey (8 steps, 4 completed, 4 pending)
  safeCall(store.addJourney, {
    id: J1.journeyId, type: 'onboarding', title: 'New Hire Onboarding',
    description: 'Complete onboarding journey for Akosua Mensah, Product Designer',
    employee_id: J1.empId, assigned_by: 'emp-17',
    status: 'in_progress', current_step: 4,
    steps: [
      { id: 'js-1', title: 'Sign offer letter and employment contract', description: 'Review and e-sign employment documents', status: 'completed', type: 'form' },
      { id: 'js-2', title: 'Complete I-9 and tax forms', description: 'Submit identity verification and SSNIT details', status: 'completed', type: 'form' },
      { id: 'js-3', title: 'IT setup - Laptop and accounts provisioned', description: 'MacBook Pro and Figma Enterprise license assigned', status: 'completed', type: 'task' },
      { id: 'js-4', title: 'Meet your buddy - Tunde Bakare', description: 'Introductory session with your onboarding buddy', status: 'completed', type: 'info' },
      { id: 'js-5', title: 'Complete Design Systems course', description: 'Mandatory course on Ecobank design language', status: 'in_progress', type: 'task', action_href: '/learning' },
      { id: 'js-6', title: 'Complete Security Awareness training', description: 'Required annual information security training', status: 'pending', type: 'task', action_href: '/learning' },
      { id: 'js-7', title: 'First 1:1 with manager', description: 'Initial goal-setting meeting with CMO', status: 'pending', type: 'review', action_href: '/performance/one-on-ones' },
      { id: 'js-8', title: '30-day check-in survey', description: 'Share your onboarding experience feedback', status: 'pending', type: 'form', action_href: '/engagement' },
    ],
    started_at: NOW, due_date: futureDate(30),
    category: 'onboarding',
  })

  // 9. Identity/SSO provisioned
  safeCall(store.addIdpConfiguration, {
    id: `idp-j1-akosua`, org_id: ORG_ID,
    employee_id: J1.empId, provider: 'google_workspace',
    status: 'provisioned', sso_email: 'a.mensah@ecobank.com',
    provisioned_at: NOW, created_at: NOW,
  })

  // 10. Learning enrollments
  safeCall(store.addEnrollment, {
    id: J1.enrollDesign, org_id: ORG_ID, employee_id: J1.empId,
    course_id: J1.courseDesign, status: 'in_progress', progress: 35,
    enrolled_at: NOW, completed_at: null,
  })
  safeCall(store.addEnrollment, {
    id: J1.enrollCulture, org_id: ORG_ID, employee_id: J1.empId,
    course_id: J1.courseCulture, status: 'in_progress', progress: 60,
    enrolled_at: NOW, completed_at: null,
  })
  safeCall(store.addEnrollment, {
    id: J1.enrollSecurity, org_id: ORG_ID, employee_id: J1.empId,
    course_id: J1.courseSecurity, status: 'not_started', progress: 0,
    enrolled_at: NOW, completed_at: null,
  })

  // Add the courses themselves
  safeCall(store.addCourse, {
    id: J1.courseDesign, org_id: ORG_ID, title: 'Ecobank Design Systems',
    description: 'Learn the Ecobank design language, component library, and brand guidelines',
    category: 'design', duration_hours: 8, status: 'published',
    instructor: 'Tunde Bakare', rating: 4.6, enrollment_count: 12,
    created_at: pastISO(90),
  })
  safeCall(store.addCourse, {
    id: J1.courseCulture, org_id: ORG_ID, title: 'Company Culture & Values',
    description: 'Understand Ecobank values, mission, and how we work together across Africa',
    category: 'onboarding', duration_hours: 3, status: 'published',
    instructor: 'Amara Kone', rating: 4.8, enrollment_count: 156,
    created_at: pastISO(180),
  })
  safeCall(store.addCourse, {
    id: J1.courseSecurity, org_id: ORG_ID, title: 'Security Awareness Training',
    description: 'Annual cybersecurity awareness — phishing, data handling, access policies',
    category: 'compliance', duration_hours: 2, status: 'published',
    instructor: 'Chukwuma Obi', rating: 4.2, enrollment_count: 230,
    created_at: pastISO(120),
  })

  // 11. Moment That Matter
  safeCall(store.addMoment, {
    id: J1.momentId, org_id: ORG_ID, employee_id: J1.empId,
    type: 'new_hire', title: 'Welcome Akosua Mensah!',
    description: 'Akosua joins the Design team as Product Designer. Please give her a warm welcome!',
    date: TODAY, status: 'today', visibility: 'public',
    celebration_type: 'team_shoutout', acknowledged_by: [],
    created_at: NOW,
  })

  // 12. Performance: 90-day review template assigned + 2 goals
  safeCall(store.addReview, {
    id: J1.reviewId, org_id: ORG_ID, cycle_id: 'cycle-1',
    employee_id: J1.empId, reviewer_id: 'emp-27',
    type: 'probation', status: 'pending',
    overall_rating: null, ratings: null, comments: null,
    submitted_at: null, created_at: NOW, due_date: futureDate(90),
  })
  safeCall(store.addGoal, {
    id: 'goal-j1-1', org_id: ORG_ID, employee_id: J1.empId,
    title: 'Complete onboarding curriculum within 30 days',
    description: 'Finish all 3 assigned courses and onboarding journey steps',
    category: 'development', status: 'on_track', progress: 30,
    start_date: TODAY, due_date: futureDate(30), created_at: NOW,
  })
  safeCall(store.addGoal, {
    id: 'goal-j1-2', org_id: ORG_ID, employee_id: J1.empId,
    title: 'Deliver first design sprint for mobile dashboard',
    description: 'Lead a design sprint producing wireframes and prototypes for the mobile banking dashboard redesign',
    category: 'project', status: 'not_started', progress: 0,
    start_date: futureDate(14), due_date: futureDate(60), created_at: NOW,
  })

  // 13. Skills assessed
  const skillsData = [
    { name: 'Figma', level: 4 },
    { name: 'UX Research', level: 3 },
    { name: 'Prototyping', level: 4 },
    { name: 'User Testing', level: 3 },
    { name: 'Design Systems', level: 2 },
  ]
  skillsData.forEach((s, i) => {
    const skillId = `skill-j1-${i}`
    // Add skill definition if addSkill is available (some stores use employeeSkills directly)
    if (store.skills !== undefined) {
      store.skills = [...(store.skills || []), { id: skillId, org_id: ORG_ID, name: s.name, category: 'design' }]
    }
    if (store.employeeSkills !== undefined) {
      store.employeeSkills = [...(store.employeeSkills || []), {
        id: `eskill-j1-${i}`, org_id: ORG_ID, employee_id: J1.empId,
        skill_id: skillId, skill_name: s.name, level: s.level,
        assessed_by: 'emp-27', assessed_at: NOW,
      }]
    }
  })

  // 14. 30-day pulse survey scheduled
  safeCall(store.addSurvey, {
    id: J1.surveyId, org_id: ORG_ID, title: '30-Day New Hire Pulse',
    description: 'Quick check-in on onboarding experience for Akosua Mensah',
    type: 'pulse', status: 'scheduled',
    target_group: 'individual', target_ids: [J1.empId],
    questions: [
      { id: 'q1', text: 'How supported do you feel in your new role?', type: 'rating' },
      { id: 'q2', text: 'Is your onboarding experience meeting expectations?', type: 'rating' },
      { id: 'q3', text: 'What could we do better?', type: 'open_text' },
    ],
    send_date: futureDate(30), close_date: futureDate(37),
    created_at: NOW, created_by: 'emp-17',
  })
}

// ────────────────────────────────────────────────────────
// Journey 2: Employee Exit
// ────────────────────────────────────────────────────────
export function seedJourney2_EmployeeExit(store: TempoStore): void {
  const deptId = 'dept-4' // Technology

  // 1. Employee record (Kofi Boateng, Senior Engineer, resigning)
  safeCall(store.addEmployee, {
    id: J2.empId, org_id: ORG_ID, department_id: deptId,
    job_title: 'Senior Software Engineer', level: 'Senior', country: 'Ghana',
    role: 'employee', manager_id: 'emp-13',
    hire_date: pastDate(730), status: 'active',
    termination_date: futureDate(14), termination_reason: 'voluntary_resignation',
    profile: {
      full_name: 'Kofi Boateng', email: 'k.boateng@ecobank.com',
      avatar_url: null, phone: '+233 26 777 8901',
    },
  })

  // 2. Offboarding process (12 tasks: 6 completed, 6 pending)
  safeCall(store.addOffboardingProcess, {
    id: J2.offboardProcessId, org_id: ORG_ID, employee_id: J2.empId,
    status: 'in_progress', initiated_by: 'emp-13',
    last_day: futureDate(14), created_at: NOW,
  })

  const offboardingTasks = [
    { title: 'Access review completed', status: 'completed', category: 'security' },
    { title: 'Exit interview scheduled', status: 'completed', category: 'hr' },
    { title: 'Project handover document drafted', status: 'completed', category: 'knowledge' },
    { title: 'Code review ownership transferred', status: 'completed', category: 'knowledge' },
    { title: 'Manager notified team', status: 'completed', category: 'communication' },
    { title: 'Benefits termination date confirmed', status: 'completed', category: 'benefits' },
    { title: 'Return MacBook Pro and charger', status: 'pending', category: 'it' },
    { title: 'Transfer knowledge to successor', status: 'pending', category: 'knowledge' },
    { title: 'Process final paycheck', status: 'pending', category: 'payroll' },
    { title: 'COBRA notification sent', status: 'pending', category: 'benefits' },
    { title: 'Revoke all system access', status: 'pending', category: 'security' },
    { title: 'Archive employee data per retention policy', status: 'pending', category: 'compliance' },
  ]
  offboardingTasks.forEach((t, i) => {
    safeCall(store.addOffboardingTask, {
      id: `otask-j2-${i}`, org_id: ORG_ID,
      process_id: J2.offboardProcessId, employee_id: J2.empId,
      title: t.title, status: t.status, category: t.category,
      assigned_to: t.category === 'it' ? 'emp-15' : t.category === 'payroll' ? 'emp-24' : 'emp-17',
      due_date: futureDate(t.status === 'completed' ? -3 : 14),
      completed_at: t.status === 'completed' ? NOW : null,
      created_at: NOW,
    })
  })

  // 3. Exit survey
  safeCall(store.addExitSurvey, {
    id: J2.exitSurveyId, org_id: ORG_ID, employee_id: J2.empId,
    status: 'submitted', submitted_at: NOW,
    responses: {
      reason_for_leaving: 'career_growth',
      overall_satisfaction: 3,
      would_recommend: true,
      manager_rating: 4,
      culture_rating: 4,
      compensation_rating: 2,
      growth_rating: 2,
      comments: 'I enjoyed working here but felt limited in growth opportunities. The compensation was not competitive for senior engineers in Accra. I wish I had more mentorship and a clearer path to Staff Engineer.',
    },
    created_at: NOW,
  })

  // 4. Internal posting for Senior Engineer role
  if (store.internalGigs !== undefined) {
    store.internalGigs = [...(store.internalGigs || []), {
      id: J2.gigId, org_id: ORG_ID, title: 'Senior Software Engineer',
      department_id: deptId, type: 'permanent', status: 'open',
      description: 'Backfill for departing Senior Engineer. Focus on payment gateway and mobile banking API.',
      requirements: ['5+ years experience', 'React/Node.js', 'Payment systems'],
      posted_by: 'emp-13', created_at: NOW,
    }]
  }

  // 5. Internal candidates matched
  if (store.gigApplications !== undefined) {
    store.gigApplications = [...(store.gigApplications || []),
      { id: 'gapp-j2-1', gig_id: J2.gigId, employee_id: 'emp-14', status: 'applied', match_score: 92, applied_at: NOW },
      { id: 'gapp-j2-2', gig_id: J2.gigId, employee_id: 'emp-15', status: 'applied', match_score: 85, applied_at: NOW },
    ]
  }

  // 6. Succession plan gap
  if (store.successionPlans !== undefined) {
    store.successionPlans = [...(store.successionPlans || []), {
      id: J2.succPlanId, org_id: ORG_ID, position_title: 'Senior Software Engineer',
      department_id: deptId, risk_level: 'high', status: 'gap_identified',
      incumbent_id: J2.empId, notes: 'Kofi Boateng departing. Critical role for payment gateway. Bench strength: 1 ready-now candidate (Yaw Frimpong).',
      created_at: NOW, updated_at: NOW,
    }]
  }
  if (store.successionCandidates !== undefined) {
    store.successionCandidates = [...(store.successionCandidates || []), {
      id: 'sc-j2-yaw', org_id: ORG_ID, plan_id: J2.succPlanId,
      employee_id: 'emp-14', readiness: 'ready_now',
      development_needs: 'Needs exposure to payment reconciliation systems',
      nominated_by: 'emp-13', created_at: NOW,
    }]
  }
}

// ────────────────────────────────────────────────────────
// Journey 3: Predict & Retain
// ────────────────────────────────────────────────────────
export function seedJourney3_PredictAndRetain(store: TempoStore): void {
  const deptId = 'dept-3' // Operations — Sarah is Senior PM

  // 1. Employee: Sarah Owusu
  safeCall(store.addEmployee, {
    id: J3.empId, org_id: ORG_ID, department_id: deptId,
    job_title: 'Senior Product Manager', level: 'Senior Manager', country: 'Ghana',
    role: 'employee', manager_id: 'emp-9',
    hire_date: pastDate(1095), status: 'active',
    profile: {
      full_name: 'Sarah Owusu', email: 's.owusu@ecobank.com',
      avatar_url: null, phone: '+233 24 888 4567',
    },
    attrition_risk: 0.78,
    attrition_risk_factors: ['comp_below_market', 'engagement_declining', 'manager_change', 'no_promotion_18m'],
  })

  // 2. Engagement: eNPS dropped over 3 quarters
  const quarterlyDates = [pastDate(180), pastDate(90), pastDate(7)]
  const enpsScores = [42, 35, 28]
  quarterlyDates.forEach((d, i) => {
    safeCall(store.addSurveyResponse, {
      id: `sr-j3-${i}`, org_id: ORG_ID, survey_id: `survey-quarterly-${i}`,
      employee_id: J3.empId, submitted_at: d,
      responses: {
        enps: enpsScores[i],
        satisfaction: [4, 3.5, 3][i],
        growth_opportunities: [4, 3, 2][i],
        manager_support: [4, 4, 3][i],
      },
    })
  })

  // 3. Compensation: comp ratio 0.87
  safeCall(store.addSalaryReview, {
    id: 'sr-j3-comp', org_id: ORG_ID, employee_id: J3.empId,
    current_salary: 870000, proposed_salary: 870000,
    comp_ratio: 0.87, currency: 'GHS',
    review_date: pastDate(30), status: 'pending',
    notes: 'Below market median for Senior PM. Recommend 15% adjustment.',
    reviewer_id: 'emp-9', created_at: pastISO(30),
  })

  // 4. Skills: Level 4+ in 3 key areas
  if (store.employeeSkills !== undefined) {
    const sarahSkills = [
      { name: 'Product Strategy', level: 5 },
      { name: 'Stakeholder Management', level: 4 },
      { name: 'Data Analysis', level: 4 },
      { name: 'Agile Methodology', level: 4 },
      { name: 'User Research', level: 3 },
    ]
    sarahSkills.forEach((s, i) => {
      store.employeeSkills = [...(store.employeeSkills || []), {
        id: `eskill-j3-${i}`, org_id: ORG_ID, employee_id: J3.empId,
        skill_id: `skill-j3-${i}`, skill_name: s.name, level: s.level,
        assessed_by: 'emp-9', assessed_at: pastISO(30),
      }]
    })
  }

  // 5. Talent Marketplace: senior role match
  if (store.internalGigs !== undefined) {
    store.internalGigs = [...(store.internalGigs || []), {
      id: J3.gigId, org_id: ORG_ID, title: 'VP of Product',
      department_id: deptId, type: 'permanent', status: 'draft',
      description: 'Lead product strategy across all digital banking products.',
      requirements: ['8+ years product management', 'P&L ownership', 'Team leadership 10+'],
      skill_match: 94, posted_by: 'emp-9', created_at: NOW,
    }]
  }
  if (store.gigApplications !== undefined) {
    store.gigApplications = [...(store.gigApplications || []), {
      id: 'gapp-j3-sarah', gig_id: J3.gigId, employee_id: J3.empId,
      status: 'matched', match_score: 94, applied_at: NOW,
    }]
  }

  // 6. Mentoring: VP mentor matched
  safeCall(store.addMentoringProgram, {
    id: J3.mentorProgramId, org_id: ORG_ID, name: 'Executive Retention Mentoring',
    description: 'Cross-functional VP mentoring for high-potential senior leaders',
    status: 'active', type: 'cross_functional',
    created_at: pastISO(30),
  })
  safeCall(store.addMentoringPair, {
    id: J3.mentorPairId, org_id: ORG_ID, program_id: J3.mentorProgramId,
    mentor_id: 'emp-24', mentee_id: J3.empId,
    status: 'active', matched_at: pastISO(14),
    created_at: pastISO(14),
  })

  // 7. Performance: 1:1 retention discussion
  safeCall(store.addOneOnOne, {
    id: 'oo-j3-retention', org_id: ORG_ID,
    manager_id: 'emp-9', employee_id: J3.empId,
    scheduled_date: futureDate(3) + 'T10:00:00Z',
    status: 'upcoming',
    agenda: ['Retention discussion', 'Career path to VP Product', 'Compensation adjustment proposal', 'Stretch assignment opportunities'],
    notes: null, action_items: [],
    duration_minutes: 60, recurring: 'one_time', location: 'Private Meeting Room',
  })

  // 8. Succession: Sarah marked "ready now" for VP Product
  if (store.successionPlans !== undefined) {
    store.successionPlans = [...(store.successionPlans || []), {
      id: J3.succPlanId, org_id: ORG_ID, position_title: 'VP of Product',
      department_id: deptId, risk_level: 'medium', status: 'active',
      incumbent_id: null,
      notes: 'New VP Product role. Sarah Owusu identified as top internal candidate.',
      created_at: pastISO(14), updated_at: NOW,
    }]
  }
  if (store.successionCandidates !== undefined) {
    store.successionCandidates = [...(store.successionCandidates || []), {
      id: 'sc-j3-sarah', org_id: ORG_ID, plan_id: J3.succPlanId,
      employee_id: J3.empId, readiness: 'ready_now',
      performance_rating: 4, potential_rating: 5,
      development_needs: 'P&L ownership exposure, executive coaching',
      nominated_by: 'emp-9', created_at: pastISO(14),
    }]
  }
}

// ────────────────────────────────────────────────────────
// Journey 4: Close-the-Books (March 2026)
// ────────────────────────────────────────────────────────
export function seedJourney4_CloseTheBooks(store: TempoStore): void {
  // 1. Bank Feeds: 25 transactions
  const bankStatuses: Array<{ status: string; count: number }> = [
    { status: 'matched', count: 15 },
    { status: 'confirmed', count: 5 },
    { status: 'unmatched', count: 3 },
    { status: 'excluded', count: 2 },
  ]
  let txIdx = 0
  if (store.bankTransactions !== undefined) {
    const txns: Record<string, unknown>[] = []
    bankStatuses.forEach(({ status, count }) => {
      for (let i = 0; i < count; i++) {
        txIdx++
        txns.push({
          id: `btx-j4-${txIdx}`, org_id: ORG_ID,
          account_id: 'ba-main-ghs', bank_name: 'GCB Bank',
          date: pastDate(Math.floor(Math.random() * 28) + 1),
          description: `TXN-${String(txIdx).padStart(3, '0')} ${status === 'matched' ? 'Vendor payment' : status === 'confirmed' ? 'Salary credit' : status === 'unmatched' ? 'Unknown debit' : 'Duplicate charge'}`,
          amount: (Math.floor(Math.random() * 50000) + 5000) * (status === 'excluded' ? -1 : 1),
          currency: 'GHS', type: txIdx % 3 === 0 ? 'credit' : 'debit',
          status, category: status === 'matched' ? 'vendor' : status === 'confirmed' ? 'payroll' : null,
          matched_invoice_id: status === 'matched' ? `inv-${txIdx}` : null,
          created_at: NOW,
        })
      }
    })
    store.bankTransactions = [...(store.bankTransactions || []), ...txns]
  }

  // 2. Payroll: March 2026 run
  safeCall(store.addPayrollRun, {
    id: J4.payrollRunId, org_id: ORG_ID,
    period: 'March 2026', status: 'completed',
    run_date: pastDate(2), pay_date: pastDate(1),
    total_gross: 3285600, total_deductions: 930000,
    total_net: 2355600, currency: 'GHS',
    employee_count: 16, country: 'Ghana',
    approved_by: 'emp-24', created_at: pastISO(3),
  })

  // 3. Expenses: 4 reports
  const expReports = [
    { id: 'exp-j4-1', employee_id: 'emp-3', title: 'Client Dinner - Kumasi', amount: 45000, status: 'approved', category: 'meals' },
    { id: 'exp-j4-2', employee_id: 'emp-8', title: 'Conference Travel - Nairobi', amount: 235000, status: 'approved', category: 'travel' },
    { id: 'exp-j4-3', employee_id: 'emp-28', title: 'Marketing Event Supplies', amount: 78000, status: 'pending_approval', category: 'marketing' },
    { id: 'exp-j4-4', employee_id: 'emp-11', title: 'Software License (personal card)', amount: 15000, status: 'rejected', category: 'software', policy_violation: 'Exceeds per-item limit without pre-approval' },
  ]
  expReports.forEach(r => {
    safeCall(store.addExpenseReport, {
      ...r, org_id: ORG_ID, currency: 'GHS',
      submitted_at: pastISO(5), reviewed_by: r.status !== 'pending_approval' ? 'emp-24' : null,
      created_at: pastISO(7),
    })
  })

  // 4. Procurement: 3 POs
  if (store.purchaseOrders !== undefined) {
    const pos = [
      { id: 'po-j4-1', vendor: 'Office Supplies Ltd', amount: 124000, status: 'fully_matched', match_status: 'complete', items_received: 10, items_ordered: 10 },
      { id: 'po-j4-2', vendor: 'Cloud Hosting GH', amount: 456000, status: 'partial_match', match_status: 'exception', items_received: 2, items_ordered: 3, exception_note: 'Invoice amount GHS 4,890 exceeds PO line by GHS 330' },
      { id: 'po-j4-3', vendor: 'Recruitment Agency', amount: 89000, status: 'open', match_status: 'pending', items_received: 0, items_ordered: 1 },
    ]
    pos.forEach(po => {
      store.purchaseOrders = [...(store.purchaseOrders || []), {
        ...po, org_id: ORG_ID, currency: 'GHS', department_id: 'dept-3',
        created_by: 'emp-24', approved_by: 'emp-9', created_at: pastISO(15),
      }]
    })
  }

  // 5. Invoices: 8
  const invStatuses = [
    { status: 'paid', count: 3, days_old: 10 },
    { status: 'overdue', count: 2, days_old: 35 },
    { status: 'overdue', count: 1, days_old: 65 },
    { status: 'open', count: 2, days_old: 5 },
  ]
  let invIdx = 0
  invStatuses.forEach(({ status, count, days_old }) => {
    for (let i = 0; i < count; i++) {
      invIdx++
      safeCall(store.addInvoice, {
        id: `inv-j4-${invIdx}`, org_id: ORG_ID,
        vendor_id: `vendor-${invIdx}`,
        invoice_number: `INV-2026-${String(invIdx).padStart(3, '0')}`,
        amount: (Math.floor(Math.random() * 200000) + 20000),
        currency: 'GHS', status,
        issue_date: pastDate(days_old),
        due_date: status === 'overdue' ? pastDate(days_old - 30) : futureDate(30 - days_old),
        paid_date: status === 'paid' ? pastDate(days_old - 5) : null,
        description: `Invoice from Vendor ${invIdx}`,
        created_at: pastISO(days_old),
      })
    }
  })

  // 6. GL checklist (stored as a custom record on the budget or as notifications)
  // We use notifications to represent month-end close checklist items
  const glChecklist = [
    { title: 'Reconcile bank statements', done: true },
    { title: 'Post payroll journal entries', done: true },
    { title: 'Review accruals and prepayments', done: true },
    { title: 'Process intercompany eliminations', done: true },
    { title: 'Review revenue recognition entries', done: false },
    { title: 'Final trial balance review', done: false },
  ]
  glChecklist.forEach((item, i) => {
    safeCall(store.addTask, {
      id: `task-j4-gl-${i}`, org_id: ORG_ID,
      project_id: 'proj-month-end',
      title: item.title, status: item.done ? 'done' : 'todo',
      priority: 'high', assigned_to: 'emp-24',
      due_date: futureDate(3),
      created_at: pastISO(5),
    })
  })

  // 7. Consolidation: 2 entities
  if (store.currencyAccounts !== undefined) {
    store.currencyAccounts = [...(store.currencyAccounts || []),
      { id: 'ca-j4-gh', org_id: ORG_ID, entity: 'Ecobank Ghana (Parent)', currency: 'GHS', balance: 4567800000, status: 'active', type: 'operating', created_at: NOW },
      { id: 'ca-j4-ng', org_id: ORG_ID, entity: 'Ecobank Nigeria (Subsidiary)', currency: 'NGN', balance: 12340000000, status: 'active', type: 'operating', created_at: NOW },
    ]
  }
  if (store.fxTransactions !== undefined) {
    store.fxTransactions = [...(store.fxTransactions || []), {
      id: 'fx-j4-ic', org_id: ORG_ID, type: 'intercompany',
      from_entity: 'Ecobank Ghana', to_entity: 'Ecobank Nigeria',
      from_currency: 'GHS', to_currency: 'NGN',
      from_amount: 150000000, to_amount: 675000000,
      fx_rate: 4.5, date: pastDate(5), status: 'confirmed',
      created_at: pastISO(5),
    }]
  }

  // 8. Board report: Q1 2026 draft
  safeCall(store.addTask, {
    id: 'task-j4-board', org_id: ORG_ID,
    project_id: 'proj-board-reporting',
    title: 'Q1 2026 Board Pack - DRAFT', status: 'in_progress',
    priority: 'high', assigned_to: 'emp-24',
    description: 'Compile Q1 2026 financial statements, KPI summary, and management commentary for board review.',
    due_date: futureDate(10), created_at: pastISO(5),
  })
}

// ────────────────────────────────────────────────────────
// Journey 5: Develop & Promote
// ────────────────────────────────────────────────────────
export function seedJourney5_DevelopAndPromote(store: TempoStore): void {
  const deptId = 'dept-4' // Technology

  // 1. Employee: James Quartey, Engineering Manager
  safeCall(store.addEmployee, {
    id: J5.empId, org_id: ORG_ID, department_id: deptId,
    job_title: 'Engineering Manager', level: 'Manager', country: 'Ghana',
    role: 'manager', manager_id: 'emp-13',
    hire_date: pastDate(1460), status: 'active',
    profile: {
      full_name: 'James Quartey', email: 'j.quartey@ecobank.com',
      avatar_url: null, phone: '+233 24 999 1234',
    },
  })

  // 2. Succession: 9-box High Potential (perf 4, potential 5)
  if (store.talentReviews !== undefined) {
    store.talentReviews = [...(store.talentReviews || []), {
      id: 'tr-j5-james', org_id: ORG_ID, cycle: 'Q1 2026',
      status: 'completed', created_at: pastISO(14),
    }]
  }
  if (store.talentReviewEntries !== undefined) {
    store.talentReviewEntries = [...(store.talentReviewEntries || []), {
      id: 'tre-j5-james', org_id: ORG_ID, review_id: 'tr-j5-james',
      employee_id: J5.empId, performance_rating: 4, potential_rating: 5,
      nine_box: 'high_potential', calibration_notes: 'James consistently delivers strong results and shows exceptional leadership potential. Ready for VP track.',
      reviewed_by: 'emp-13', created_at: pastISO(14),
    }]
  }

  // 3. Succession plan: VP Engineering, 1-2 years, skill gaps
  if (store.successionPlans !== undefined) {
    store.successionPlans = [...(store.successionPlans || []), {
      id: J5.succPlanId, org_id: ORG_ID, position_title: 'VP Engineering',
      department_id: deptId, risk_level: 'low', status: 'active',
      incumbent_id: 'emp-13',
      notes: 'CTO Babajide planning succession. James Quartey on 1-2 year readiness track.',
      created_at: pastISO(60), updated_at: NOW,
    }]
  }
  if (store.successionCandidates !== undefined) {
    store.successionCandidates = [...(store.successionCandidates || []), {
      id: 'sc-j5-james', org_id: ORG_ID, plan_id: J5.succPlanId,
      employee_id: J5.empId, readiness: '1_2_years',
      performance_rating: 4, potential_rating: 5,
      development_needs: 'Strategic Thinking (Level 3 -> 4), Executive Presence (Level 3 -> 4)',
      nominated_by: 'emp-13', created_at: pastISO(60),
    }]
  }

  // 4. Skills: gaps in Strategic Thinking and Executive Presence
  if (store.employeeSkills !== undefined) {
    const jamesSkills = [
      { name: 'Engineering Leadership', level: 4 },
      { name: 'System Architecture', level: 4 },
      { name: 'Strategic Thinking', level: 3 },
      { name: 'Executive Presence', level: 3 },
      { name: 'Team Development', level: 4 },
      { name: 'Agile/Scrum', level: 5 },
    ]
    jamesSkills.forEach((s, i) => {
      store.employeeSkills = [...(store.employeeSkills || []), {
        id: `eskill-j5-${i}`, org_id: ORG_ID, employee_id: J5.empId,
        skill_id: `skill-j5-${i}`, skill_name: s.name, level: s.level,
        target_level: s.name === 'Strategic Thinking' || s.name === 'Executive Presence' ? 4 : s.level,
        assessed_by: 'emp-13', assessed_at: pastISO(14),
      }]
    })
  }

  // 5. Mentoring: VP mentor
  safeCall(store.addMentoringProgram, {
    id: J5.mentorProgramId, org_id: ORG_ID, name: 'Leadership Acceleration Program',
    description: 'Senior leadership mentoring for VP-track candidates',
    status: 'active', type: 'cross_functional',
    created_at: pastISO(90),
  })
  safeCall(store.addMentoringPair, {
    id: J5.mentorPairId, org_id: ORG_ID, program_id: J5.mentorProgramId,
    mentor_id: 'emp-24', mentee_id: J5.empId,
    status: 'active', matched_at: pastISO(60),
    created_at: pastISO(60),
  })
  // 4 check-ins completed
  for (let i = 0; i < 4; i++) {
    safeCall(store.addMentoringSession, {
      id: `msess-j5-${i}`, org_id: ORG_ID, pair_id: J5.mentorPairId,
      scheduled_date: pastDate(60 - i * 14) + 'T14:00:00Z',
      status: 'completed', notes: [
        'Discussed strategic vision for engineering org. Assigned reading: "The Manager\'s Path".',
        'Reviewed James\'s executive presentation for Q4 board deck. Gave feedback on storytelling.',
        'Discussed cross-functional influence strategies. James will shadow CFO in budget planning.',
        'Reviewed progress on strategic thinking. James presented a 3-year technology roadmap draft.',
      ][i],
      duration_minutes: 45, created_at: pastISO(60 - i * 14),
    })
  }

  // 6. Learning: Leadership path (3/5 complete)
  safeCall(store.addLearningPath, {
    id: J5.learningPathId, org_id: ORG_ID,
    title: 'Leadership Development Track',
    description: 'Comprehensive leadership program for VP-track engineers',
    course_ids: ['course-j5-1', 'course-j5-2', 'course-j5-3', 'course-j5-4', 'course-j5-5'],
    status: 'active', estimated_hours: 40,
    created_at: pastISO(90),
  })
  const ldCourses = [
    { id: 'course-j5-1', title: 'Strategic Leadership Foundations', status: 'completed' },
    { id: 'course-j5-2', title: 'Executive Communication', status: 'completed' },
    { id: 'course-j5-3', title: 'Financial Acumen for Tech Leaders', status: 'completed' },
    { id: 'course-j5-4', title: 'Organizational Design & Change', status: 'in_progress' },
    { id: 'course-j5-5', title: 'Executive Coaching Practicum', status: 'not_started' },
  ]
  ldCourses.forEach(c => {
    safeCall(store.addCourse, {
      id: c.id, org_id: ORG_ID, title: c.title,
      description: `Leadership development course: ${c.title}`,
      category: 'leadership', duration_hours: 8, status: 'published',
      instructor: 'External Faculty', rating: 4.7, enrollment_count: 8,
      created_at: pastISO(90),
    })
    safeCall(store.addEnrollment, {
      id: `enroll-j5-${c.id}`, org_id: ORG_ID, employee_id: J5.empId,
      course_id: c.id, status: c.status === 'completed' ? 'completed' : c.status === 'in_progress' ? 'in_progress' : 'enrolled',
      progress: c.status === 'completed' ? 100 : c.status === 'in_progress' ? 45 : 0,
      enrolled_at: pastISO(90), completed_at: c.status === 'completed' ? pastISO(30) : null,
    })
  })

  // 7. Talent Marketplace: stretch assignment
  if (store.internalGigs !== undefined) {
    store.internalGigs = [...(store.internalGigs || []), {
      id: J5.gigId, org_id: ORG_ID,
      title: 'Technical Strategy Task Force',
      department_id: deptId, type: 'stretch_assignment', status: 'active',
      description: 'Cross-functional task force to define 3-year technology strategy and cloud migration roadmap.',
      requirements: ['Engineering leadership', 'Strategic thinking', 'Cross-functional collaboration'],
      skill_match: 88, duration: '3 months',
      posted_by: 'emp-13', created_at: pastISO(14),
    }]
  }
  if (store.gigApplications !== undefined) {
    store.gigApplications = [...(store.gigApplications || []), {
      id: 'gapp-j5-james', gig_id: J5.gigId, employee_id: J5.empId,
      status: 'accepted', match_score: 88, applied_at: pastISO(10),
    }]
  }

  // 8. Performance: elevated OKRs
  safeCall(store.addGoal, {
    id: 'goal-j5-1', org_id: ORG_ID, employee_id: J5.empId,
    title: 'Define 3-year technology roadmap',
    description: 'Collaborate with CTO to produce comprehensive technology strategy document',
    category: 'project', status: 'on_track', progress: 55,
    start_date: pastDate(60), due_date: futureDate(30), created_at: pastISO(60),
  })
  safeCall(store.addGoal, {
    id: 'goal-j5-2', org_id: ORG_ID, employee_id: J5.empId,
    title: 'Achieve 90% team engagement score',
    description: 'Drive team engagement through regular 1:1s, growth plans, and recognition',
    category: 'business', status: 'on_track', progress: 82,
    start_date: pastDate(90), due_date: futureDate(90), created_at: pastISO(90),
  })
  safeCall(store.addGoal, {
    id: 'goal-j5-3', org_id: ORG_ID, employee_id: J5.empId,
    title: 'Present at executive leadership forum',
    description: 'Deliver a strategic presentation to the executive team on cloud migration benefits',
    category: 'development', status: 'on_track', progress: 30,
    start_date: pastDate(30), due_date: futureDate(60), created_at: pastISO(30),
  })

  // 9. Compensation: promotion package modeled
  safeCall(store.addSalaryReview, {
    id: 'sr-j5-promo', org_id: ORG_ID, employee_id: J5.empId,
    current_salary: 1200000, proposed_salary: 1560000,
    comp_ratio: 1.05, currency: 'GHS',
    review_date: futureDate(30), status: 'pending',
    notes: 'Promotion to VP Engineering package. 30% base increase + GHS 200,000 equity grant.',
    reviewer_id: 'emp-13', created_at: NOW,
  })
  safeCall(store.addEquityGrant, {
    id: 'eq-j5-promo', org_id: ORG_ID, employee_id: J5.empId,
    grant_type: 'rsu', shares: 500, grant_date: futureDate(30),
    vesting_schedule: '4-year quarterly', cliff_months: 12,
    status: 'pending_approval', value: 20000000, currency: 'GHS',
    notes: 'VP Engineering promotion equity grant', created_at: NOW,
  })

  // 10. Moment: promotion announcement ready
  safeCall(store.addMoment, {
    id: J5.momentId, org_id: ORG_ID, employee_id: J5.empId,
    type: 'promotion', title: 'James Quartey promoted to VP Engineering!',
    description: 'Congratulations to James on his well-deserved promotion to VP Engineering after an outstanding development journey.',
    date: futureDate(30), status: 'upcoming', visibility: 'public',
    celebration_type: 'spotlight', acknowledged_by: [],
    created_at: NOW,
  })
}

// ────────────────────────────────────────────────────────
// Journey 6: Global Expand (Tanzania)
// ────────────────────────────────────────────────────────
export function seedJourney6_GlobalExpand(store: TempoStore): void {
  // 1. Headcount position in Tanzania
  safeCall(store.addHeadcountPosition, {
    id: J6.posId, plan_id: 'hcp-1', org_id: ORG_ID, department_id: 'dept-3',
    job_title: 'Operations Associate', level: 'Mid', type: 'new',
    status: 'approved', priority: 'high',
    salary_min: 180000000, salary_max: 300000000, currency: 'TZS',
    target_start_date: futureDate(30), filled_by: null, filled_at: null,
    justification: 'First hire for Tanzania expansion. EOR entity evaluated.',
    approved_by: 'emp-9', created_at: NOW, updated_at: NOW,
  })

  // 2. EOR entity
  if (store.eorEntities !== undefined) {
    store.eorEntities = [...(store.eorEntities || []), {
      id: J6.eorId, org_id: ORG_ID, country: 'Tanzania',
      provider: 'Deel', status: 'configured',
      entity_name: 'Ecobank Tanzania (via Deel EOR)',
      compliance_requirements: [
        { id: 'cr-tz-1', requirement: 'NSSF registration', status: 'compliant', due_date: futureDate(14) },
        { id: 'cr-tz-2', requirement: 'TRA tax registration', status: 'compliant', due_date: futureDate(14) },
        { id: 'cr-tz-3', requirement: 'WCF registration', status: 'pending', due_date: futureDate(30) },
      ],
      created_at: NOW, updated_at: NOW,
    }]
  }

  // 3. Compliance requirements
  const tzCompliance = [
    { title: 'Employment contract in Swahili', status: 'compliant', category: 'labor' },
    { title: 'NSSF employer registration', status: 'compliant', category: 'social_security' },
    { title: 'TRA PAYE withholding setup', status: 'compliant', category: 'tax' },
    { title: 'Workers Compensation Fund registration', status: 'pending', category: 'insurance' },
    { title: 'Skills and Development Levy (SDL) enrollment', status: 'pending', category: 'tax' },
  ]
  tzCompliance.forEach((c, i) => {
    safeCall(store.addComplianceRequirement, {
      id: `comp-j6-${i}`, org_id: ORG_ID,
      title: c.title, status: c.status, category: c.category,
      country: 'Tanzania', entity: 'Ecobank Tanzania',
      due_date: futureDate(c.status === 'compliant' ? -7 : 30),
      notes: `Tanzania labor law requirement: ${c.title}`,
      created_at: NOW,
    })
  })

  // 4. Payroll: Tanzania tax config
  safeCall(store.addTaxConfig, {
    id: 'tax-j6-tz', org_id: ORG_ID, country: 'Tanzania',
    config_name: 'Tanzania PAYE & NSSF',
    tax_brackets: [
      { min: 0, max: 270000, rate: 0 },
      { min: 270001, max: 520000, rate: 8 },
      { min: 520001, max: 760000, rate: 20 },
      { min: 760001, max: 1000000, rate: 25 },
      { min: 1000001, max: null, rate: 30 },
    ],
    social_security: { employer_rate: 10, employee_rate: 10, name: 'NSSF', cap: null },
    sdl_rate: 4.5,
    currency: 'TZS', effective_date: '2026-01-01',
    status: 'active', created_at: NOW,
  })

  // 5. Benefits: local schemes
  safeCall(store.addBenefitPlan, {
    id: 'bp-j6-health', org_id: ORG_ID,
    name: 'Tanzania National Health Insurance (NHIF)',
    type: 'health', status: 'active', country: 'Tanzania',
    provider: 'NHIF Tanzania',
    employer_contribution: 3, employee_contribution: 3,
    description: 'National Health Insurance Fund - mandatory employer and employee contributions',
    created_at: NOW,
  })
  safeCall(store.addBenefitPlan, {
    id: 'bp-j6-pension', org_id: ORG_ID,
    name: 'Tanzania NSSF Pension',
    type: 'retirement', status: 'active', country: 'Tanzania',
    provider: 'NSSF Tanzania',
    employer_contribution: 10, employee_contribution: 10,
    description: 'National Social Security Fund pension scheme',
    created_at: NOW,
  })

  // 6. Journeys: Tanzania-localized onboarding template
  safeCall(store.addJourneyTemplate, {
    id: J6.journeyTemplateId, org_id: ORG_ID,
    type: 'onboarding', title: 'Tanzania New Hire Onboarding',
    description: 'Localized onboarding for Tanzania-based employees, including country-specific compliance steps',
    category: 'onboarding',
    steps: [
      { id: 'ts-1', title: 'Sign employment contract (Swahili/English)', description: 'Dual-language employment contract', type: 'form' },
      { id: 'ts-2', title: 'NSSF registration', description: 'Register with National Social Security Fund', type: 'form' },
      { id: 'ts-3', title: 'TRA tax ID verification', description: 'Verify TIN with Tanzania Revenue Authority', type: 'form' },
      { id: 'ts-4', title: 'NHIF enrollment', description: 'Enroll in National Health Insurance Fund', type: 'form' },
      { id: 'ts-5', title: 'Company culture & values', description: 'Watch culture orientation video', type: 'info' },
      { id: 'ts-6', title: 'IT setup and access provisioning', description: 'Laptop, email, and system access', type: 'task' },
      { id: 'ts-7', title: 'Meet your manager and team', description: 'Introductory calls with team', type: 'info' },
      { id: 'ts-8', title: 'Security awareness training', description: 'Complete mandatory security course', type: 'task' },
    ],
    is_active: true, auto_assign: true,
    trigger_event: 'hire_country_TZ',
    estimated_days: 14, created_by: 'emp-17', created_at: NOW,
  })

  // 7. Org Design scenario
  if (store.departments !== undefined) {
    // We do NOT add a department since it would be an EOR, but we can add a task for org design
    safeCall(store.addTask, {
      id: 'task-j6-orgdesign', org_id: ORG_ID,
      project_id: 'proj-global-expansion',
      title: 'Tanzania Org Design: Define reporting line',
      description: 'New Tanzania Operations Associate reports to Head of Operations (Kofi Mensah) via EOR structure. Evaluate direct vs. matrix reporting.',
      status: 'in_progress', priority: 'high',
      assigned_to: 'emp-17', due_date: futureDate(14),
      created_at: NOW,
    })
  }

  // 8. Bank account: TZS currency
  if (store.bankAccounts !== undefined) {
    store.bankAccounts = [...(store.bankAccounts || []), {
      id: J6.bankAccountId, org_id: ORG_ID,
      bank_name: 'CRDB Bank Tanzania', account_name: 'Ecobank Tanzania Operations',
      account_number_last4: '7890', currency: 'TZS',
      country: 'Tanzania', status: 'active', type: 'operating',
      balance: 0, created_at: NOW,
    }]
  }
  if (store.currencyAccounts !== undefined) {
    store.currencyAccounts = [...(store.currencyAccounts || []), {
      id: 'ca-j6-tzs', org_id: ORG_ID,
      entity: 'Ecobank Tanzania (EOR)', currency: 'TZS',
      balance: 0, status: 'active', type: 'operating',
      created_at: NOW,
    }]
  }
}

// ────────────────────────────────────────────────────────
// Orchestration
// ────────────────────────────────────────────────────────
export type JourneyKey = 1 | 2 | 3 | 4 | 5 | 6

export const JOURNEY_META: Record<JourneyKey, { title: string; description: string; startPage: string }> = {
  1: { title: 'Hire-to-Perform', description: 'New hire: Akosua Mensah, Product Designer joining the Design team', startPage: '/headcount' },
  2: { title: 'Employee Exit', description: 'Departure: Kofi Boateng, Senior Engineer resigning with offboarding', startPage: '/offboarding' },
  3: { title: 'Predict & Retain', description: 'Flight risk: Sarah Owusu, Senior PM with 78% attrition risk', startPage: '/people' },
  4: { title: 'Close-the-Books', description: 'March 2026 month-end close with bank feeds, payroll, and invoices', startPage: '/bank-feeds' },
  5: { title: 'Develop & Promote', description: 'Talent development: James Quartey, Engineering Manager to VP track', startPage: '/succession' },
  6: { title: 'Global Expand', description: 'First hire in Tanzania via EOR with localized compliance', startPage: '/global-workforce' },
}

const SEED_FNS: Record<JourneyKey, (store: TempoStore) => void> = {
  1: seedJourney1_HireToPerform,
  2: seedJourney2_EmployeeExit,
  3: seedJourney3_PredictAndRetain,
  4: seedJourney4_CloseTheBooks,
  5: seedJourney5_DevelopAndPromote,
  6: seedJourney6_GlobalExpand,
}

export function seedJourney(store: TempoStore, journey: JourneyKey): void {
  SEED_FNS[journey](store)
}

export function seedAllJourneys(store: TempoStore): void {
  for (const key of [1, 2, 3, 4, 5, 6] as JourneyKey[]) {
    SEED_FNS[key](store)
  }
}
