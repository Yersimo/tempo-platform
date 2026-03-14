/**
 * Load Test Data Generator for Tempo Platform
 *
 * Generates realistic data for 1,200 employees across 6 African countries,
 * 8 departments, with 12 months of payroll, leave, expenses, goals, reviews,
 * and benefit enrollments.
 *
 * All amounts are in CENTS. All IDs are UUIDs generated via crypto.randomUUID().
 */

// ============================================================
// HELPERS
// ============================================================

function uuid(): string {
  return crypto.randomUUID()
}

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randFloat(min: number, max: number, decimals = 2): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals))
}

function dateStr(d: Date): string {
  return d.toISOString().split('T')[0]
}

function isoStr(d: Date): string {
  return d.toISOString()
}

function addDays(d: Date, days: number): Date {
  const r = new Date(d)
  r.setDate(r.getDate() + days)
  return r
}

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
}

// ============================================================
// NAME POOLS (African names by country)
// ============================================================

const FIRST_NAMES: Record<string, { male: string[]; female: string[] }> = {
  Ghana: {
    male: ['Kwame', 'Kofi', 'Yaw', 'Kwasi', 'Kweku', 'Kojo', 'Kwabena', 'Nana', 'Ebo', 'Fiifi',
      'Akwasi', 'Mensah', 'Ofori', 'Adjei', 'Boateng', 'Owusu', 'Agyemang', 'Amponsah', 'Asante', 'Frimpong'],
    female: ['Abena', 'Ama', 'Akosua', 'Akua', 'Adwoa', 'Efua', 'Yaa', 'Afua', 'Esi', 'Afia',
      'Maame', 'Naa', 'Adjoa', 'Serwaa', 'Abenaa', 'Enyonam', 'Gifty', 'Mercy', 'Dede', 'Adzoa'],
  },
  Nigeria: {
    male: ['Oluwaseun', 'Emeka', 'Chukwuma', 'Babajide', 'Tunde', 'Ifeanyi', 'Obinna', 'Adebayo', 'Segun', 'Nnamdi',
      'Chidi', 'Femi', 'Olanrewaju', 'Ikechukwu', 'Yemi', 'Dayo', 'Kola', 'Oluwatobi', 'Chibueze', 'Adewale'],
    female: ['Ngozi', 'Chioma', 'Adaeze', 'Folake', 'Nneka', 'Bukola', 'Funmi', 'Aisha', 'Oluwatoyin', 'Yewande',
      'Chiamaka', 'Ifeoma', 'Adeola', 'Titilayo', 'Ebele', 'Uju', 'Amina', 'Halima', 'Zainab', 'Toyin'],
  },
  Kenya: {
    male: ['James', 'Brian', 'Peter', 'Daniel', 'Samuel', 'David', 'John', 'Michael', 'Joseph', 'Stephen',
      'Kevin', 'Paul', 'Mark', 'Dennis', 'George', 'Martin', 'Charles', 'Patrick', 'Thomas', 'Simon'],
    female: ['Grace', 'Wanjiku', 'Faith', 'Joy', 'Mary', 'Lucy', 'Janet', 'Esther', 'Alice', 'Sarah',
      'Dorothy', 'Mercy', 'Rose', 'Agnes', 'Catherine', 'Beatrice', 'Florence', 'Gladys', 'Winnie', 'Irene'],
  },
  'South Africa': {
    male: ['Thabo', 'Sipho', 'Bongani', 'Mandla', 'Themba', 'Kagiso', 'Lebo', 'Tshepo', 'Sifiso', 'Nhlanhla',
      'Mpho', 'Andile', 'Sandile', 'Lungelo', 'Xolani', 'Bheki', 'Sibusiso', 'Dumisani', 'Jabulani', 'Msizi'],
    female: ['Nomsa', 'Lerato', 'Thandiwe', 'Zanele', 'Naledi', 'Lindiwe', 'Precious', 'Palesa', 'Nompilo', 'Zandile',
      'Busisiwe', 'Nozipho', 'Ayanda', 'Noluthando', 'Phumzile', 'Nosipho', 'Siphokazi', 'Nonhlanhla', 'Mpumi', 'Khanyi'],
  },
  Senegal: {
    male: ['Moussa', 'Ousmane', 'Amadou', 'Mamadou', 'Ibrahima', 'Modou', 'Cheikh', 'Abdoulaye', 'Aliou', 'Pape',
      'Babacar', 'Lamine', 'Souleymane', 'Omar', 'Boubacar', 'El Hadji', 'Samba', 'Djibril', 'Youssou', 'Serigne'],
    female: ['Fatou', 'Aminata', 'Aissatou', 'Mariama', 'Ndeye', 'Coumba', 'Astou', 'Dieynaba', 'Khady', 'Sokhna',
      'Awa', 'Adja', 'Bineta', 'Rokhaya', 'Yacine', 'Seynabou', 'Mame', 'Oumou', 'Aby', 'Maimouna'],
  },
  "Cote d'Ivoire": {
    male: ['Amadou', 'Seydou', 'Yao', 'Kouassi', 'Desire', 'Jean-Pierre', 'Christian', 'Ismael', 'Lacina', 'Didier',
      'Koffi', 'Franck', 'Souleymane', 'Ibrahim', 'Bakary', 'Mamadou', 'Serge', 'Armel', 'Gervais', 'Alain'],
    female: ['Marie', 'Adjoua', 'Aya', 'Aminata', 'Mariam', 'Sandrine', 'Edith', 'Patricia', 'Sylvie', 'Agathe',
      'Lou', 'Christelle', 'Nadege', 'Eugenie', 'Bintou', 'Fatoumata', 'Raissa', 'Clarisse', 'Brigitte', 'Estelle'],
  },
}

const LAST_NAMES: Record<string, string[]> = {
  Ghana: ['Asante', 'Mensah', 'Boateng', 'Owusu', 'Frimpong', 'Darko', 'Agyemang', 'Oppong', 'Amoah', 'Gyasi',
    'Ofori', 'Addo', 'Antwi', 'Baffour', 'Nyarko', 'Acheampong', 'Bonsu', 'Danquah', 'Appiah', 'Osei'],
  Nigeria: ['Adeyemi', 'Okafor', 'Nwankwo', 'Ogunleye', 'Bakare', 'Agu', 'Uzoma', 'Ikechukwu', 'Eze', 'Afolabi',
    'Okoro', 'Obasi', 'Nwosu', 'Okonkwo', 'Balogun', 'Olawale', 'Adeniyi', 'Oyedele', 'Chukwu', 'Bankole'],
  Kenya: ['Kamau', 'Otieno', 'Njoroge', 'Wambui', 'Muthoni', 'Odhiambo', 'Kimani', 'Maina', 'Kiprotich', 'Chebet',
    'Wanyama', 'Ochieng', 'Kipchoge', 'Muriuki', 'Ndungu', 'Gitau', 'Kibet', 'Achieng', 'Kosgei', 'Mutua'],
  'South Africa': ['Nkosi', 'Dlamini', 'Ndlovu', 'Zulu', 'Mthembu', 'Khumalo', 'Mbeki', 'Molefe', 'Mokoena', 'Mahlangu',
    'Shabangu', 'Maseko', 'Ngcobo', 'Sithole', 'Cele', 'Mkhize', 'Radebe', 'Zwane', 'Pillay', 'Govender'],
  Senegal: ['Diallo', 'Ndiaye', 'Sow', 'Ba', 'Fall', 'Diop', 'Gueye', 'Mbaye', 'Faye', 'Thiam',
    'Sarr', 'Cisse', 'Kane', 'Dia', 'Sylla', 'Traore', 'Seck', 'Toure', 'Balde', 'Diagne'],
  "Cote d'Ivoire": ['Kouassi', 'Traore', 'Kone', 'Diallo', 'Coulibaly', 'Yao', 'Konan', 'Bamba', 'Dje', 'Gnahoua',
    'Guei', 'Toure', 'Ouattara', 'Aka', 'Brou', 'Dembele', 'Zadi', 'Koffi', 'Ake', 'N\'Guessan'],
}

const COUNTRIES = ['Ghana', 'Nigeria', 'Kenya', 'South Africa', 'Senegal', "Cote d'Ivoire"] as const
type Country = typeof COUNTRIES[number]

const COUNTRY_CODES: Record<string, string> = {
  Ghana: 'GH',
  Nigeria: 'NG',
  Kenya: 'KE',
  'South Africa': 'ZA',
  Senegal: 'SN',
  "Cote d'Ivoire": 'CI',
}

const COUNTRY_CURRENCIES: Record<string, string> = {
  Ghana: 'GHS',
  Nigeria: 'NGN',
  Kenya: 'KES',
  'South Africa': 'ZAR',
  Senegal: 'XOF',
  "Cote d'Ivoire": 'XOF',
}

const PHONE_PREFIXES: Record<string, string> = {
  Ghana: '+233',
  Nigeria: '+234',
  Kenya: '+254',
  'South Africa': '+27',
  Senegal: '+221',
  "Cote d'Ivoire": '+225',
}

// ============================================================
// DEPARTMENTS
// ============================================================

interface DepartmentDef {
  name: string
  costCenter: string
}

const DEPARTMENT_DEFS: DepartmentDef[] = [
  { name: 'Engineering', costCenter: 'CC-100' },
  { name: 'Sales', costCenter: 'CC-200' },
  { name: 'Marketing', costCenter: 'CC-300' },
  { name: 'Finance', costCenter: 'CC-400' },
  { name: 'Human Resources', costCenter: 'CC-500' },
  { name: 'Operations', costCenter: 'CC-600' },
  { name: 'Legal', costCenter: 'CC-700' },
  { name: 'Product', costCenter: 'CC-800' },
]

// ============================================================
// LEVELS & JOB TITLES
// ============================================================

const LEVELS = ['Junior', 'Mid', 'Senior', 'Lead', 'Manager', 'Director'] as const
type Level = typeof LEVELS[number]

const LEVEL_WEIGHTS: Record<Level, number> = {
  Junior: 25,
  Mid: 30,
  Senior: 20,
  Lead: 10,
  Manager: 10,
  Director: 5,
}

const JOB_TITLES: Record<string, Record<Level, string[]>> = {
  Engineering: {
    Junior: ['Junior Software Engineer', 'Junior QA Engineer', 'Junior Data Analyst'],
    Mid: ['Software Engineer', 'QA Engineer', 'Data Engineer', 'DevOps Engineer'],
    Senior: ['Senior Software Engineer', 'Senior QA Engineer', 'Senior Data Engineer', 'Senior DevOps Engineer'],
    Lead: ['Tech Lead', 'Principal Engineer', 'Staff Engineer'],
    Manager: ['Engineering Manager', 'QA Manager'],
    Director: ['Director of Engineering', 'VP Engineering'],
  },
  Sales: {
    Junior: ['Sales Associate', 'Sales Development Rep', 'Inside Sales Rep'],
    Mid: ['Account Executive', 'Sales Rep', 'Business Development Rep'],
    Senior: ['Senior Account Executive', 'Senior Sales Rep', 'Key Account Manager'],
    Lead: ['Sales Team Lead', 'Enterprise Account Lead'],
    Manager: ['Sales Manager', 'Regional Sales Manager'],
    Director: ['Director of Sales', 'VP Sales'],
  },
  Marketing: {
    Junior: ['Marketing Coordinator', 'Content Writer', 'Social Media Associate'],
    Mid: ['Marketing Specialist', 'Digital Marketing Specialist', 'Brand Designer'],
    Senior: ['Senior Marketing Specialist', 'Senior Content Strategist', 'Senior Designer'],
    Lead: ['Marketing Lead', 'Creative Lead'],
    Manager: ['Marketing Manager', 'Brand Manager'],
    Director: ['Director of Marketing', 'CMO'],
  },
  Finance: {
    Junior: ['Junior Accountant', 'Accounts Payable Clerk', 'Finance Associate'],
    Mid: ['Accountant', 'Financial Analyst', 'Treasury Analyst'],
    Senior: ['Senior Accountant', 'Senior Financial Analyst', 'Financial Controller'],
    Lead: ['Finance Lead', 'FP&A Lead'],
    Manager: ['Finance Manager', 'Treasury Manager'],
    Director: ['Director of Finance', 'CFO'],
  },
  'Human Resources': {
    Junior: ['HR Coordinator', 'Recruitment Coordinator', 'HR Assistant'],
    Mid: ['HR Generalist', 'Recruiter', 'L&D Specialist', 'Compensation Analyst'],
    Senior: ['Senior HR Generalist', 'Senior Recruiter', 'HR Business Partner'],
    Lead: ['Talent Acquisition Lead', 'HRBP Lead'],
    Manager: ['HR Manager', 'Talent Acquisition Manager'],
    Director: ['Director of HR', 'CHRO'],
  },
  Operations: {
    Junior: ['Operations Associate', 'Logistics Coordinator', 'Process Associate'],
    Mid: ['Operations Analyst', 'Supply Chain Analyst', 'Process Analyst'],
    Senior: ['Senior Operations Analyst', 'Senior Logistics Manager', 'Senior Process Analyst'],
    Lead: ['Operations Lead', 'Supply Chain Lead'],
    Manager: ['Operations Manager', 'Logistics Manager'],
    Director: ['Director of Operations', 'COO'],
  },
  Legal: {
    Junior: ['Legal Assistant', 'Paralegal', 'Compliance Associate'],
    Mid: ['Legal Counsel', 'Compliance Officer', 'Contract Specialist'],
    Senior: ['Senior Legal Counsel', 'Senior Compliance Officer', 'IP Counsel'],
    Lead: ['Legal Lead', 'Compliance Lead'],
    Manager: ['Legal Manager', 'Compliance Manager'],
    Director: ['General Counsel', 'Chief Legal Officer'],
  },
  Product: {
    Junior: ['Associate Product Manager', 'Product Analyst', 'UX Researcher'],
    Mid: ['Product Manager', 'Product Designer', 'UX Designer'],
    Senior: ['Senior Product Manager', 'Senior Product Designer', 'Lead UX Designer'],
    Lead: ['Principal Product Manager', 'Design Lead'],
    Manager: ['Group Product Manager', 'Design Manager'],
    Director: ['Director of Product', 'VP Product'],
  },
}

// Salary ranges in cents/month by country and level
const SALARY_RANGES: Record<string, Record<Level, [number, number]>> = {
  Ghana: {
    Junior: [300000, 500000],
    Mid: [500000, 800000],
    Senior: [800000, 1200000],
    Lead: [1200000, 1600000],
    Manager: [1500000, 2000000],
    Director: [2000000, 3500000],
  },
  Nigeria: {
    Junior: [350000, 600000],
    Mid: [600000, 1000000],
    Senior: [1000000, 1500000],
    Lead: [1500000, 2000000],
    Manager: [1800000, 2500000],
    Director: [2500000, 4000000],
  },
  Kenya: {
    Junior: [400000, 650000],
    Mid: [650000, 1000000],
    Senior: [1000000, 1500000],
    Lead: [1400000, 1900000],
    Manager: [1700000, 2400000],
    Director: [2400000, 3800000],
  },
  'South Africa': {
    Junior: [500000, 800000],
    Mid: [800000, 1200000],
    Senior: [1200000, 1800000],
    Lead: [1700000, 2300000],
    Manager: [2000000, 3000000],
    Director: [3000000, 5000000],
  },
  Senegal: {
    Junior: [250000, 450000],
    Mid: [450000, 750000],
    Senior: [750000, 1100000],
    Lead: [1100000, 1500000],
    Manager: [1400000, 1800000],
    Director: [1800000, 3000000],
  },
  "Cote d'Ivoire": {
    Junior: [250000, 450000],
    Mid: [450000, 750000],
    Senior: [750000, 1100000],
    Lead: [1100000, 1500000],
    Manager: [1400000, 1800000],
    Director: [1800000, 3000000],
  },
}

// ============================================================
// WEIGHTED RANDOM LEVEL PICKER
// ============================================================

function pickLevel(): Level {
  const totalWeight = Object.values(LEVEL_WEIGHTS).reduce((s, w) => s + w, 0)
  let r = Math.random() * totalWeight
  for (const [level, weight] of Object.entries(LEVEL_WEIGHTS)) {
    r -= weight
    if (r <= 0) return level as Level
  }
  return 'Mid'
}

// ============================================================
// TYPES (matching schema column shapes)
// ============================================================

export interface GeneratedOrg {
  id: string
  name: string
  slug: string
  logoUrl: null
  plan: 'enterprise'
  industry: string
  size: string
  country: string
  isActive: true
  onboardingCompleted: true
  createdAt: Date
  updatedAt: Date
}

export interface GeneratedDepartment {
  id: string
  orgId: string
  name: string
  parentId: null
  headId: string | null
  createdAt: Date
}

export interface GeneratedEmployee {
  id: string
  orgId: string
  departmentId: string
  fullName: string
  firstName: string
  lastName: string
  email: string
  phone: string
  avatarUrl: null
  jobTitle: string
  level: string
  country: string
  role: 'owner' | 'admin' | 'hrbp' | 'manager' | 'employee'
  managerId: string | null
  hireDate: string
  isActive: true
  emailVerified: true
  createdAt: Date
  updatedAt: Date
  // salary stored separately but needed for payroll
  _monthlySalaryCents: number
}

export interface GeneratedPayrollRun {
  id: string
  orgId: string
  period: string
  status: 'paid'
  country: string | null
  totalGross: number
  totalNet: number
  totalDeductions: number
  currency: string
  employeeCount: number
  runDate: Date
  createdAt: Date
}

export interface GeneratedPayrollEntry {
  id: string
  orgId: string
  payrollRunId: string
  employeeId: string
  grossPay: number
  basePay: number
  overtimePay: number
  overtimeHours: number
  overtimeRate: number
  bonusPay: number
  federalTax: number
  stateTax: number
  socialSecurity: number
  medicare: number
  pension: number
  garnishmentTotal: number
  benefitDeductions: number
  totalDeductions: number
  netPay: number
  currency: string
  country: string
  payType: string
  unpaidLeaveDays: number
  createdAt: Date
}

export interface GeneratedLeaveRequest {
  id: string
  orgId: string
  employeeId: string
  type: 'annual' | 'sick' | 'personal' | 'maternity' | 'paternity' | 'unpaid' | 'compassionate'
  startDate: string
  endDate: string
  days: number
  status: 'pending' | 'approved' | 'rejected' | 'cancelled'
  reason: string
  createdAt: Date
}

export interface GeneratedExpenseReport {
  id: string
  orgId: string
  employeeId: string
  title: string
  totalAmount: number
  currency: string
  status: 'draft' | 'submitted' | 'pending_approval' | 'approved' | 'rejected' | 'reimbursed'
  submittedAt: Date | null
  createdAt: Date
}

export interface GeneratedExpenseItem {
  id: string
  reportId: string
  category: string
  description: string
  amount: number
}

export interface GeneratedGoal {
  id: string
  orgId: string
  employeeId: string
  title: string
  description: string
  category: 'business' | 'project' | 'development' | 'compliance'
  status: 'not_started' | 'on_track' | 'at_risk' | 'behind' | 'completed'
  progress: number
  startDate: string
  dueDate: string
  createdAt: Date
  updatedAt: Date
}

export interface GeneratedReview {
  id: string
  orgId: string
  cycleId: string
  employeeId: string
  reviewerId: string | null
  type: 'annual' | 'mid_year' | 'quarterly' | 'probation' | 'manager' | 'peer' | 'self'
  status: 'pending' | 'in_progress' | 'submitted' | 'completed'
  overallRating: number | null
  comments: string | null
  submittedAt: Date | null
  createdAt: Date
}

export interface GeneratedBenefitPlan {
  id: string
  orgId: string
  name: string
  type: 'medical' | 'dental' | 'vision' | 'retirement' | 'life' | 'disability' | 'wellness'
  provider: string
  costEmployee: number
  costEmployer: number
  currency: string
  description: string
  isActive: true
  createdAt: Date
}

export interface GeneratedBenefitEnrollment {
  id: string
  orgId: string
  employeeId: string
  planId: string
  enrolledAt: Date
}

export interface GeneratedReviewCycle {
  id: string
  orgId: string
  title: string
  type: 'annual' | 'mid_year'
  status: 'completed' | 'active'
  startDate: string
  endDate: string
  createdAt: Date
}

// ============================================================
// MAIN GENERATOR
// ============================================================

export interface LoadTestData {
  organization: GeneratedOrg
  departments: GeneratedDepartment[]
  employees: GeneratedEmployee[]
  payrollRuns: GeneratedPayrollRun[]
  payrollEntries: GeneratedPayrollEntry[]
  leaveRequests: GeneratedLeaveRequest[]
  expenseReports: GeneratedExpenseReport[]
  expenseItems: GeneratedExpenseItem[]
  goals: GeneratedGoal[]
  reviewCycles: GeneratedReviewCycle[]
  reviews: GeneratedReview[]
  benefitPlans: GeneratedBenefitPlan[]
  benefitEnrollments: GeneratedBenefitEnrollment[]
}

export function generateLoadTestData(employeeCount = 1200): LoadTestData {
  const orgId = uuid()
  const now = new Date()

  // ── Organization ──────────────────────────────────────────
  const organization: GeneratedOrg = {
    id: orgId,
    name: 'Ecobank Transnational (Load Test)',
    slug: `ecobank-loadtest-${Date.now()}`,
    logoUrl: null,
    plan: 'enterprise',
    industry: 'Banking & Financial Services',
    size: '1000+',
    country: 'Nigeria',
    isActive: true,
    onboardingCompleted: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: now,
  }

  // ── Departments ───────────────────────────────────────────
  const departments: GeneratedDepartment[] = DEPARTMENT_DEFS.map((d) => ({
    id: uuid(),
    orgId,
    name: d.name,
    parentId: null,
    headId: null,
    createdAt: new Date('2024-01-01'),
  }))

  // ── Employees ─────────────────────────────────────────────
  const emailSet = new Set<string>()
  const employees: GeneratedEmployee[] = []

  for (let i = 0; i < employeeCount; i++) {
    const country = pick(COUNTRIES) as Country
    const gender = Math.random() > 0.5 ? 'male' : 'female'
    const firstName = pick(FIRST_NAMES[country][gender])
    const lastName = pick(LAST_NAMES[country])
    const dept = pick(departments)
    const level = pickLevel()
    const jobTitle = pick(JOB_TITLES[dept.name][level])
    const salaryRange = SALARY_RANGES[country][level]
    const salary = randInt(salaryRange[0], salaryRange[1])

    // unique email
    let emailBase = `${firstName.toLowerCase().replace(/[^a-z]/g, '')}.${lastName.toLowerCase().replace(/[^a-z]/g, '')}`
    let email = `${emailBase}@ecobank.com`
    let suffix = 1
    while (emailSet.has(email)) {
      email = `${emailBase}${suffix}@ecobank.com`
      suffix++
    }
    emailSet.add(email)

    const phoneDigits = Array.from({ length: 9 }, () => randInt(0, 9)).join('')
    const hireDate = randomDate(new Date('2018-01-01'), new Date('2025-12-31'))

    let role: GeneratedEmployee['role'] = 'employee'
    if (level === 'Director') role = i < 8 ? 'admin' : 'manager'
    else if (level === 'Manager') role = 'manager'
    else if (level === 'Lead') role = Math.random() > 0.5 ? 'hrbp' : 'employee'

    employees.push({
      id: uuid(),
      orgId,
      departmentId: dept.id,
      fullName: `${firstName} ${lastName}`,
      firstName,
      lastName,
      email,
      phone: `${PHONE_PREFIXES[country]} ${phoneDigits.slice(0, 3)} ${phoneDigits.slice(3, 6)} ${phoneDigits.slice(6)}`,
      avatarUrl: null,
      jobTitle,
      level,
      country,
      role,
      managerId: null,
      hireDate: dateStr(hireDate),
      isActive: true,
      emailVerified: true,
      createdAt: hireDate,
      updatedAt: now,
      _monthlySalaryCents: salary,
    })
  }

  // Assign department heads
  for (const dept of departments) {
    const director = employees.find((e) => e.departmentId === dept.id && e.level === 'Director')
    if (director) dept.headId = director.id
  }

  // Assign managers (directors/managers in same dept)
  for (const emp of employees) {
    if (emp.level === 'Director') continue
    const manager = employees.find(
      (m) =>
        m.departmentId === emp.departmentId &&
        m.id !== emp.id &&
        (m.level === 'Director' || m.level === 'Manager')
    )
    if (manager) emp.managerId = manager.id
  }

  // ── Payroll Runs (12 months) ──────────────────────────────
  const payrollRuns: GeneratedPayrollRun[] = []
  const payrollEntries: GeneratedPayrollEntry[] = []

  for (let month = 1; month <= 12; month++) {
    const period = `2025-${String(month).padStart(2, '0')}`
    const runId = uuid()
    const runDate = new Date(2025, month - 1, 25)
    let totalGross = 0
    let totalNet = 0
    let totalDeductions = 0

    for (const emp of employees) {
      const basePay = emp._monthlySalaryCents
      const overtimeHours = Math.random() > 0.8 ? randFloat(2, 20) : 0
      const hourlyRate = Math.round(basePay / 160)
      const overtimePay = Math.round(overtimeHours * hourlyRate * 1.5)
      const bonusPay = month === 12 && Math.random() > 0.7 ? Math.round(basePay * randFloat(0.05, 0.15)) : 0
      const grossPay = basePay + overtimePay + bonusPay

      const federalTax = Math.round(grossPay * 0.10)
      const stateTax = Math.round(grossPay * 0.02)
      const socialSecurity = Math.round(grossPay * 0.055)
      const pension = Math.round(grossPay * 0.08)
      const benefitDed = Math.round(grossPay * 0.03)
      const deductions = federalTax + stateTax + socialSecurity + pension + benefitDed
      const netPay = grossPay - deductions

      totalGross += grossPay
      totalNet += netPay
      totalDeductions += deductions

      payrollEntries.push({
        id: uuid(),
        orgId,
        payrollRunId: runId,
        employeeId: emp.id,
        grossPay,
        basePay,
        overtimePay,
        overtimeHours,
        overtimeRate: 1.5,
        bonusPay,
        federalTax,
        stateTax,
        socialSecurity,
        medicare: 0,
        pension,
        garnishmentTotal: 0,
        benefitDeductions: benefitDed,
        totalDeductions: deductions,
        netPay,
        currency: COUNTRY_CURRENCIES[emp.country],
        country: COUNTRY_CODES[emp.country],
        payType: 'full_month',
        unpaidLeaveDays: 0,
        createdAt: runDate,
      })
    }

    payrollRuns.push({
      id: runId,
      orgId,
      period,
      status: 'paid',
      country: null,
      totalGross,
      totalNet,
      totalDeductions,
      currency: 'USD',
      employeeCount: employees.length,
      runDate,
      createdAt: runDate,
    })
  }

  // ── Leave Requests (~3 per employee/year) ─────────────────
  const leaveTypes: GeneratedLeaveRequest['type'][] = ['annual', 'sick', 'personal', 'annual', 'annual', 'sick']
  const leaveReasons = [
    'Family vacation', 'Medical appointment', 'Personal matters', 'Holiday travel',
    'Feeling unwell', 'Family emergency', 'Wedding attendance', 'Home repairs',
    'Religious observance', 'Study leave', 'Visa appointment', 'Child care',
  ]
  const leaveRequests: GeneratedLeaveRequest[] = []

  for (const emp of employees) {
    const numLeaves = randInt(1, 5)
    for (let i = 0; i < numLeaves; i++) {
      const start = randomDate(new Date('2025-01-06'), new Date('2025-12-15'))
      const days = randInt(1, 10)
      const end = addDays(start, days - 1)
      const statusOptions: GeneratedLeaveRequest['status'][] = ['approved', 'approved', 'approved', 'pending', 'rejected']

      leaveRequests.push({
        id: uuid(),
        orgId,
        employeeId: emp.id,
        type: pick(leaveTypes),
        startDate: dateStr(start),
        endDate: dateStr(end),
        days,
        status: pick(statusOptions),
        reason: pick(leaveReasons),
        createdAt: addDays(start, -randInt(3, 14)),
      })
    }
  }

  // ── Expense Reports (~2 per employee/year) ────────────────
  const expenseCategories = ['Travel', 'Meals', 'Accommodation', 'Transport', 'Office Supplies', 'Training', 'Client Entertainment', 'Internet', 'Phone']
  const expenseDescriptions: Record<string, string[]> = {
    Travel: ['Flight to conference', 'Taxi to client site', 'Train ticket', 'Airport transfer'],
    Meals: ['Team lunch', 'Client dinner', 'Working lunch', 'Conference catering'],
    Accommodation: ['Hotel for business trip', 'Airbnb for training', 'Conference hotel'],
    Transport: ['Uber to office', 'Fuel reimbursement', 'Parking fees', 'Toll charges'],
    'Office Supplies': ['Stationery', 'Printer cartridge', 'USB drive', 'Mouse and keyboard'],
    Training: ['Online course fee', 'Workshop registration', 'Certification exam'],
    'Client Entertainment': ['Client welcome dinner', 'Team building event', 'Client meeting refreshments'],
    Internet: ['Home internet for remote work', 'Mobile data top-up'],
    Phone: ['Phone bill reimbursement', 'New phone case'],
  }
  const expenseReports: GeneratedExpenseReport[] = []
  const expenseItems: GeneratedExpenseItem[] = []

  for (const emp of employees) {
    const numReports = randInt(1, 4)
    for (let i = 0; i < numReports; i++) {
      const reportId = uuid()
      const numItems = randInt(1, 5)
      let total = 0
      const reportDate = randomDate(new Date('2025-01-15'), new Date('2025-12-15'))
      const statusOptions: GeneratedExpenseReport['status'][] = ['approved', 'reimbursed', 'submitted', 'pending_approval', 'draft']

      for (let j = 0; j < numItems; j++) {
        const cat = pick(expenseCategories)
        const amount = randInt(1000, 50000) // 10-500 USD equivalent in cents
        total += amount
        expenseItems.push({
          id: uuid(),
          reportId,
          category: cat,
          description: pick(expenseDescriptions[cat] || ['Miscellaneous expense']),
          amount,
        })
      }

      expenseReports.push({
        id: reportId,
        orgId,
        employeeId: emp.id,
        title: `Expense Report - ${dateStr(reportDate)}`,
        totalAmount: total,
        currency: COUNTRY_CURRENCIES[emp.country],
        status: pick(statusOptions),
        submittedAt: Math.random() > 0.3 ? reportDate : null,
        createdAt: addDays(reportDate, -randInt(0, 5)),
      })
    }
  }

  // ── Goals (1 per employee) ────────────────────────────────
  const goalTemplates: Record<string, string[]> = {
    Engineering: ['Reduce system latency by 30%', 'Achieve 99.9% uptime SLA', 'Migrate service to new architecture', 'Increase test coverage to 85%'],
    Sales: ['Exceed quarterly revenue target by 10%', 'Onboard 20 new enterprise clients', 'Reduce churn rate to below 5%', 'Increase upsell revenue by 25%'],
    Marketing: ['Increase brand awareness by 40%', 'Generate 500 qualified leads per month', 'Launch new product campaign', 'Improve website conversion by 15%'],
    Finance: ['Complete annual audit with zero findings', 'Reduce month-end close to 3 days', 'Implement new budgeting system', 'Achieve 98% forecast accuracy'],
    'Human Resources': ['Reduce time-to-hire to 30 days', 'Achieve 90% employee satisfaction', 'Launch leadership development program', 'Complete compensation review'],
    Operations: ['Reduce operational costs by 15%', 'Implement process automation', 'Achieve ISO certification', 'Improve SLA compliance to 99%'],
    Legal: ['Complete regulatory compliance audit', 'Reduce contract turnaround to 5 days', 'Implement contract management system', 'Complete IP portfolio review'],
    Product: ['Launch 3 new product features', 'Increase NPS score to 70', 'Reduce feature delivery time by 20%', 'Complete UX overhaul of core product'],
  }
  const goals: GeneratedGoal[] = []

  for (const emp of employees) {
    const dept = departments.find((d) => d.id === emp.departmentId)
    const deptName = dept?.name || 'Engineering'
    const templates = goalTemplates[deptName] || goalTemplates.Engineering
    const categories: GeneratedGoal['category'][] = ['business', 'project', 'development', 'compliance']
    const statuses: GeneratedGoal['status'][] = ['on_track', 'on_track', 'at_risk', 'behind', 'completed', 'not_started']
    const progress = pick(statuses) === 'completed' ? 100 : randInt(0, 95)

    goals.push({
      id: uuid(),
      orgId,
      employeeId: emp.id,
      title: pick(templates),
      description: `Goal for ${emp.fullName} in ${deptName}`,
      category: pick(categories),
      status: progress === 100 ? 'completed' : pick(statuses),
      progress,
      startDate: '2025-01-01',
      dueDate: '2025-12-31',
      createdAt: new Date('2025-01-05'),
      updatedAt: now,
    })
  }

  // ── Review Cycles & Reviews ───────────────────────────────
  const reviewCycles: GeneratedReviewCycle[] = [
    {
      id: uuid(),
      orgId,
      title: '2025 Annual Performance Review',
      type: 'annual',
      status: 'completed',
      startDate: '2025-11-01',
      endDate: '2025-12-31',
      createdAt: new Date('2025-10-15'),
    },
    {
      id: uuid(),
      orgId,
      title: 'H1 2026 Mid-Year Review',
      type: 'mid_year',
      status: 'active',
      startDate: '2026-01-15',
      endDate: '2026-03-15',
      createdAt: new Date('2026-01-10'),
    },
  ]

  const reviewComments = [
    'Strong performance this period. Consistently delivers quality work.',
    'Good progress on key objectives. Some areas for improvement in communication.',
    'Exceeded expectations on project delivery. Leadership skills are developing well.',
    'Met most targets. Should focus more on cross-team collaboration.',
    'Outstanding contribution to team goals. Ready for next level.',
    'Solid performance. Needs to improve time management.',
    null,
  ]
  const reviews: GeneratedReview[] = []

  for (const emp of employees) {
    const cycle = reviewCycles[0] // annual review
    const manager = employees.find((m) => m.id === emp.managerId)
    const reviewTypes: GeneratedReview['type'][] = ['manager', 'self', 'peer']
    const statuses: GeneratedReview['status'][] = ['completed', 'submitted', 'in_progress', 'pending']

    reviews.push({
      id: uuid(),
      orgId,
      cycleId: cycle.id,
      employeeId: emp.id,
      reviewerId: manager?.id || null,
      type: pick(reviewTypes),
      status: pick(statuses),
      overallRating: Math.random() > 0.2 ? randInt(2, 5) : null,
      comments: pick(reviewComments),
      submittedAt: Math.random() > 0.3 ? randomDate(new Date('2025-11-15'), new Date('2025-12-31')) : null,
      createdAt: new Date('2025-11-01'),
    })
  }

  // ── Benefit Plans & Enrollments (80% rate) ────────────────
  const benefitPlans: GeneratedBenefitPlan[] = [
    { id: uuid(), orgId, name: 'Standard Medical Plan', type: 'medical', provider: 'AXA Mansard', costEmployee: 15000, costEmployer: 35000, currency: 'USD', description: 'Comprehensive medical coverage including hospitalization', isActive: true, createdAt: new Date('2024-01-01') },
    { id: uuid(), orgId, name: 'Dental Plan', type: 'dental', provider: 'AXA Mansard', costEmployee: 5000, costEmployer: 10000, currency: 'USD', description: 'Dental care coverage including cleanings and fillings', isActive: true, createdAt: new Date('2024-01-01') },
    { id: uuid(), orgId, name: 'Vision Plan', type: 'vision', provider: 'AXA Mansard', costEmployee: 3000, costEmployer: 7000, currency: 'USD', description: 'Vision care including annual eye exams and corrective lenses', isActive: true, createdAt: new Date('2024-01-01') },
    { id: uuid(), orgId, name: 'Pension Fund', type: 'retirement', provider: 'SSNIT / ARM Pension', costEmployee: 0, costEmployer: 0, currency: 'USD', description: 'Mandatory pension contribution per local regulations', isActive: true, createdAt: new Date('2024-01-01') },
    { id: uuid(), orgId, name: 'Group Life Insurance', type: 'life', provider: 'Old Mutual', costEmployee: 2000, costEmployer: 8000, currency: 'USD', description: 'Group life insurance up to 3x annual salary', isActive: true, createdAt: new Date('2024-01-01') },
    { id: uuid(), orgId, name: 'Disability Cover', type: 'disability', provider: 'Sanlam', costEmployee: 1500, costEmployer: 6000, currency: 'USD', description: 'Short and long-term disability coverage', isActive: true, createdAt: new Date('2024-01-01') },
    { id: uuid(), orgId, name: 'Wellness Program', type: 'wellness', provider: 'Internal', costEmployee: 0, costEmployer: 5000, currency: 'USD', description: 'Gym membership, mental health support, wellness days', isActive: true, createdAt: new Date('2024-01-01') },
  ]

  const benefitEnrollments: GeneratedBenefitEnrollment[] = []
  for (const emp of employees) {
    if (Math.random() > 0.80) continue // 20% not enrolled
    // Each enrolled employee gets 1-4 plans
    const numPlans = randInt(1, 4)
    const shuffled = [...benefitPlans].sort(() => Math.random() - 0.5)
    for (let i = 0; i < Math.min(numPlans, shuffled.length); i++) {
      benefitEnrollments.push({
        id: uuid(),
        orgId,
        employeeId: emp.id,
        planId: shuffled[i].id,
        enrolledAt: randomDate(new Date('2024-01-15'), new Date('2025-06-30')),
      })
    }
  }

  // ── Summary ───────────────────────────────────────────────
  console.log(`Generated load test data:`)
  console.log(`  Organization: ${organization.name}`)
  console.log(`  Departments:  ${departments.length}`)
  console.log(`  Employees:    ${employees.length}`)
  console.log(`  Payroll runs: ${payrollRuns.length} (${payrollEntries.length} entries)`)
  console.log(`  Leave:        ${leaveRequests.length}`)
  console.log(`  Expenses:     ${expenseReports.length} reports, ${expenseItems.length} items`)
  console.log(`  Goals:        ${goals.length}`)
  console.log(`  Reviews:      ${reviews.length} (${reviewCycles.length} cycles)`)
  console.log(`  Benefits:     ${benefitPlans.length} plans, ${benefitEnrollments.length} enrollments`)

  return {
    organization,
    departments,
    employees,
    payrollRuns,
    payrollEntries,
    leaveRequests,
    expenseReports,
    expenseItems,
    goals,
    reviewCycles,
    reviews,
    benefitPlans,
    benefitEnrollments,
  }
}
