import { z } from 'zod'

export interface CSVParseResult {
  valid: CSVEmployeeRow[]
  errors: Array<{ row: number; field: string; message: string }>
  totalRows: number
  validRows: number
}

export interface CSVEmployeeRow {
  // ── Core HR ──────────────────────────────────────────────
  fullName: string
  email: string
  personalEmail?: string
  jobTitle?: string
  department?: string
  country?: string
  level?: string
  hireDate?: string
  phone?: string
  role?: string
  managerId?: string
  managerEmail?: string
  location?: string
  employmentType?: string
  employeeId?: string
  dateOfBirth?: string
  gender?: string
  maritalStatus?: string
  nationality?: string
  nationalId?: string

  // ── Address ──────────────────────────────────────────────
  streetAddress?: string
  city?: string
  stateProvince?: string
  postalCode?: string
  addressCountry?: string

  // ── Payroll & Banking ────────────────────────────────────
  salary?: number
  currency?: string
  payFrequency?: string
  bankName?: string
  bankBranchCode?: string
  bankAccountNumber?: string
  bankAccountName?: string
  mobileMoneyProvider?: string
  mobileMoneyNumber?: string
  taxIdNumber?: string
  socialSecurityNumber?: string
  pensionId?: string

  // ── Compensation ─────────────────────────────────────────
  bonusTargetPercent?: number
  equityStockUnits?: number
  payBandGrade?: string
  allowanceHousing?: number
  allowanceTransport?: number
  allowanceMedical?: number

  // ── Benefits ─────────────────────────────────────────────
  medicalPlan?: string
  dentalPlan?: string
  lifeInsurance?: string
  numberOfDependents?: number

  // ── Time & Attendance ────────────────────────────────────
  workSchedule?: string
  weeklyHours?: number
  timezone?: string
  shiftType?: string

  // ── IT & Identity ────────────────────────────────────────
  adSsoUsername?: string
  corporateEmail?: string
  devicePreference?: string

  // ── Emergency Contact ────────────────────────────────────
  emergencyContactName?: string
  emergencyContactPhone?: string
  emergencyContactRelationship?: string

  // ── Documents / Compliance ───────────────────────────────
  passportNumber?: string
  workPermitNumber?: string
  workPermitExpiry?: string
  highestEducation?: string
  universityInstitution?: string
  previousEmployer?: string

  // ── Notes ────────────────────────────────────────────────
  onboardingNotes?: string
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const dateRegex = /^\d{4}-\d{2}-\d{2}$/

const employeeRowSchema = z.object({
  // Core HR
  fullName: z.string().min(1, 'Full name is required').max(255),
  email: z.string().refine(v => emailRegex.test(v), 'Invalid email format'),
  personalEmail: z.string().refine(v => !v || emailRegex.test(v), 'Invalid personal email format').optional(),
  jobTitle: z.string().max(255).optional(),
  department: z.string().max(255).optional(),
  country: z.string().max(100).optional(),
  level: z.string().max(100).optional(),
  hireDate: z.string().refine(v => !v || dateRegex.test(v), 'Hire date must be YYYY-MM-DD').optional(),
  phone: z.string().max(50).optional(),
  role: z.enum(['owner', 'admin', 'hrbp', 'manager', 'employee']).optional(),
  managerEmail: z.string().optional(),
  location: z.string().max(255).optional(),
  employmentType: z.enum(['full_time', 'part_time', 'contractor', 'intern']).optional(),
  employeeId: z.string().max(100).optional(),
  dateOfBirth: z.string().refine(v => !v || dateRegex.test(v), 'Date of birth must be YYYY-MM-DD').optional(),
  gender: z.enum(['male', 'female', 'non_binary', 'prefer_not_to_say']).optional(),
  maritalStatus: z.enum(['single', 'married', 'divorced', 'widowed', 'domestic_partnership']).optional(),
  nationality: z.string().max(100).optional(),
  nationalId: z.string().max(100).optional(),

  // Address
  streetAddress: z.string().max(500).optional(),
  city: z.string().max(255).optional(),
  stateProvince: z.string().max(255).optional(),
  postalCode: z.string().max(20).optional(),
  addressCountry: z.string().max(100).optional(),

  // Payroll & Banking
  salary: z.number().nonnegative().optional(),
  currency: z.string().max(10).optional(),
  payFrequency: z.enum(['weekly', 'bi_weekly', 'semi_monthly', 'monthly']).optional(),
  bankName: z.string().max(255).optional(),
  bankBranchCode: z.string().max(100).optional(),
  bankAccountNumber: z.string().max(100).optional(),
  bankAccountName: z.string().max(255).optional(),
  mobileMoneyProvider: z.string().max(100).optional(),
  mobileMoneyNumber: z.string().max(50).optional(),
  taxIdNumber: z.string().max(100).optional(),
  socialSecurityNumber: z.string().max(100).optional(),
  pensionId: z.string().max(100).optional(),

  // Compensation
  bonusTargetPercent: z.number().min(0).max(100).optional(),
  equityStockUnits: z.number().nonnegative().optional(),
  payBandGrade: z.string().max(50).optional(),
  allowanceHousing: z.number().nonnegative().optional(),
  allowanceTransport: z.number().nonnegative().optional(),
  allowanceMedical: z.number().nonnegative().optional(),

  // Benefits
  medicalPlan: z.string().max(100).optional(),
  dentalPlan: z.string().max(100).optional(),
  lifeInsurance: z.string().max(10).optional(),
  numberOfDependents: z.number().int().nonnegative().optional(),

  // Time & Attendance
  workSchedule: z.string().max(100).optional(),
  weeklyHours: z.number().min(0).max(168).optional(),
  timezone: z.string().max(100).optional(),
  shiftType: z.enum(['day', 'night', 'rotating', 'flexible']).optional(),

  // IT & Identity
  adSsoUsername: z.string().max(100).optional(),
  corporateEmail: z.string().refine(v => !v || emailRegex.test(v), 'Invalid corporate email format').optional(),
  devicePreference: z.enum(['windows', 'mac', 'linux']).optional(),

  // Emergency Contact
  emergencyContactName: z.string().max(255).optional(),
  emergencyContactPhone: z.string().max(50).optional(),
  emergencyContactRelationship: z.enum(['spouse', 'parent', 'sibling', 'child', 'friend', 'other']).optional(),

  // Documents / Compliance
  passportNumber: z.string().max(50).optional(),
  workPermitNumber: z.string().max(100).optional(),
  workPermitExpiry: z.string().refine(v => !v || dateRegex.test(v), 'Work permit expiry must be YYYY-MM-DD').optional(),
  highestEducation: z.enum(['high_school', 'associate', 'bachelor', 'master', 'doctorate', 'professional']).optional(),
  universityInstitution: z.string().max(255).optional(),
  previousEmployer: z.string().max(255).optional(),

  // Notes
  onboardingNotes: z.string().max(2000).optional(),
})

// Fields that should be parsed as numbers
const NUMERIC_FIELDS = new Set<keyof CSVEmployeeRow>([
  'salary', 'bonusTargetPercent', 'equityStockUnits',
  'allowanceHousing', 'allowanceTransport', 'allowanceMedical',
  'numberOfDependents', 'weeklyHours',
])

/**
 * Parse a CSV string into validated employee rows.
 * Supports flexible column header naming (case-insensitive, underscore/space variants).
 */
export function parseEmployeeCSV(csvContent: string): CSVParseResult {
  const lines = csvContent.split(/\r?\n/).filter(line => line.trim().length > 0)

  if (lines.length < 2) {
    return { valid: [], errors: [{ row: 0, field: 'file', message: 'CSV must have a header row and at least one data row' }], totalRows: 0, validRows: 0 }
  }

  // Parse header row
  const headers = parseCSVLine(lines[0]).map(h => h.trim().toLowerCase())

  // Map flexible header names to standard field names
  const headerMap = new Map<number, keyof CSVEmployeeRow>()
  for (let i = 0; i < headers.length; i++) {
    const h = headers[i]
    const mapped = mapHeaderToField(h)
    if (mapped) headerMap.set(i, mapped)
  }

  // Validate required headers
  const hasName = [...headerMap.values()].includes('fullName')
  const hasEmail = [...headerMap.values()].includes('email')

  if (!hasName || !hasEmail) {
    const missing = []
    if (!hasName) missing.push('Full Name')
    if (!hasEmail) missing.push('Email')
    return {
      valid: [],
      errors: [{ row: 0, field: 'headers', message: `Missing required columns: ${missing.join(', ')}. Found: ${headers.join(', ')}` }],
      totalRows: lines.length - 1,
      validRows: 0,
    }
  }

  // Parse data rows
  const valid: CSVEmployeeRow[] = []
  const errors: Array<{ row: number; field: string; message: string }> = []
  const seenEmails = new Set<string>()

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i])
    const raw: Record<string, unknown> = {}

    for (const [colIdx, fieldName] of headerMap.entries()) {
      const value = values[colIdx]?.trim()
      if (value) {
        if (NUMERIC_FIELDS.has(fieldName)) {
          const parsed = parseFloat(value.replace(/[,$]/g, ''))
          if (!isNaN(parsed)) raw[fieldName] = parsed
        } else {
          raw[fieldName] = value
        }
      }
    }

    // Validate row
    const result = employeeRowSchema.safeParse(raw)
    if (result.success) {
      // Check for duplicate emails
      const email = result.data.email.toLowerCase()
      if (seenEmails.has(email)) {
        errors.push({ row: i + 1, field: 'email', message: `Duplicate email: ${email}` })
      } else {
        seenEmails.add(email)
        valid.push({ ...result.data, email } as CSVEmployeeRow)
      }
    } else {
      for (const issue of result.error.issues) {
        errors.push({
          row: i + 1,
          field: issue.path.join('.') || 'unknown',
          message: issue.message,
        })
      }
    }
  }

  return {
    valid,
    errors,
    totalRows: lines.length - 1,
    validRows: valid.length,
  }
}

/**
 * Map a header string (lowercase) to a CSVEmployeeRow field key.
 * Supports many common aliases, underscores, spaces, abbreviations.
 */
function mapHeaderToField(h: string): keyof CSVEmployeeRow | null {
  // Core HR
  if (['full name', 'name', 'employee name', 'fullname', 'employee', 'full_name', 'employee_name'].includes(h)) return 'fullName'
  if (['email', 'email address', 'work email', 'e-mail', 'email_address', 'work_email'].includes(h)) return 'email'
  if (['personal email', 'personal_email', 'private email', 'private_email', 'home email', 'home_email'].includes(h)) return 'personalEmail'
  if (['job title', 'title', 'position', 'role title', 'jobtitle', 'job_title', 'role_title'].includes(h)) return 'jobTitle'
  if (['department', 'dept', 'division', 'team'].includes(h)) return 'department'
  if (['country', 'country code', 'country_code'].includes(h)) return 'country'
  if (['level', 'job level', 'grade', 'band', 'seniority', 'job_level'].includes(h)) return 'level'
  if (['hire date', 'start date', 'date hired', 'hiredate', 'joining date', 'hire_date', 'start_date', 'date_hired', 'joining_date'].includes(h)) return 'hireDate'
  if (['phone', 'phone number', 'mobile', 'tel', 'phone_number', 'telephone'].includes(h)) return 'phone'
  if (['role', 'access role', 'permission', 'access_role', 'system role', 'system_role'].includes(h)) return 'role'
  if (['manager email', 'manager_email', 'reports to', 'reports_to', 'manager'].includes(h)) return 'managerEmail'
  if (['location', 'office', 'work location', 'work_location', 'office location', 'office_location'].includes(h)) return 'location'
  if (['employment type', 'employment_type', 'emp type', 'emp_type', 'type', 'contract type', 'contract_type'].includes(h)) return 'employmentType'
  if (['employee id', 'employee_id', 'badge number', 'badge_number', 'emp id', 'emp_id', 'staff id', 'staff_id'].includes(h)) return 'employeeId'
  if (['date of birth', 'date_of_birth', 'dob', 'birthdate', 'birth date', 'birth_date', 'birthday'].includes(h)) return 'dateOfBirth'
  if (['gender', 'sex'].includes(h)) return 'gender'
  if (['marital status', 'marital_status', 'civil status', 'civil_status'].includes(h)) return 'maritalStatus'
  if (['nationality', 'citizenship'].includes(h)) return 'nationality'
  if (['national id', 'national_id', 'nin', 'id number', 'id_number'].includes(h)) return 'nationalId'

  // Address
  if (['street address', 'street_address', 'address', 'street', 'address line 1', 'address_line_1'].includes(h)) return 'streetAddress'
  if (['city', 'town'].includes(h)) return 'city'
  if (['state/province', 'state', 'province', 'state_province', 'region'].includes(h)) return 'stateProvince'
  if (['postal code', 'postal_code', 'zip code', 'zip_code', 'zip', 'postcode'].includes(h)) return 'postalCode'
  if (['address country', 'address_country', 'residence country', 'residence_country'].includes(h)) return 'addressCountry'

  // Payroll & Banking
  if (['base salary', 'base_salary', 'salary', 'annual salary', 'annual_salary', 'compensation'].includes(h)) return 'salary'
  if (['pay currency', 'pay_currency', 'currency', 'salary currency', 'salary_currency'].includes(h)) return 'currency'
  if (['pay frequency', 'pay_frequency', 'payment frequency', 'payment_frequency'].includes(h)) return 'payFrequency'
  if (['bank name', 'bank_name', 'bank'].includes(h)) return 'bankName'
  if (['bank branch code', 'bank_branch_code', 'swift', 'sort code', 'sort_code', 'routing number', 'routing_number', 'branch code', 'branch_code'].includes(h)) return 'bankBranchCode'
  if (['bank account number', 'bank_account_number', 'account number', 'account_number', 'acct number', 'acct_number'].includes(h)) return 'bankAccountNumber'
  if (['bank account name', 'bank_account_name', 'account name', 'account_name', 'acct name', 'acct_name'].includes(h)) return 'bankAccountName'
  if (['mobile money provider', 'mobile_money_provider', 'momo provider', 'momo_provider', 'mobile money', 'mobile_money'].includes(h)) return 'mobileMoneyProvider'
  if (['mobile money number', 'mobile_money_number', 'momo number', 'momo_number'].includes(h)) return 'mobileMoneyNumber'
  if (['tax id number', 'tax_id_number', 'tax id', 'tax_id', 'tin', 'kra pin', 'kra_pin'].includes(h)) return 'taxIdNumber'
  if (['social security number', 'social_security_number', 'ssn', 'nssf', 'nssf number', 'nssf_number'].includes(h)) return 'socialSecurityNumber'
  if (['pension id', 'pension_id', 'pension number', 'pension_number', 'pencom', 'pencom id', 'pencom_id'].includes(h)) return 'pensionId'

  // Compensation
  if (['bonus target %', 'bonus_target_percent', 'bonus target', 'bonus_target', 'bonus %', 'bonus_percent', 'bonus target percent'].includes(h)) return 'bonusTargetPercent'
  if (['equity/stock units', 'equity_stock_units', 'equity', 'stock units', 'stock_units', 'equity units', 'equity_units', 'rsu', 'rsus'].includes(h)) return 'equityStockUnits'
  if (['pay band/grade', 'pay_band_grade', 'pay band', 'pay_band', 'pay grade', 'pay_grade', 'grade code', 'grade_code'].includes(h)) return 'payBandGrade'
  if (['allowance - housing', 'allowance_housing', 'housing allowance', 'housing_allowance'].includes(h)) return 'allowanceHousing'
  if (['allowance - transport', 'allowance_transport', 'transport allowance', 'transport_allowance', 'travel allowance', 'travel_allowance'].includes(h)) return 'allowanceTransport'
  if (['allowance - medical', 'allowance_medical', 'medical allowance', 'medical_allowance', 'health allowance', 'health_allowance'].includes(h)) return 'allowanceMedical'

  // Benefits
  if (['medical plan', 'medical_plan', 'health plan', 'health_plan', 'medical insurance', 'medical_insurance'].includes(h)) return 'medicalPlan'
  if (['dental plan', 'dental_plan', 'dental insurance', 'dental_insurance'].includes(h)) return 'dentalPlan'
  if (['life insurance', 'life_insurance'].includes(h)) return 'lifeInsurance'
  if (['number of dependents', 'number_of_dependents', 'dependents', 'num dependents', 'num_dependents'].includes(h)) return 'numberOfDependents'

  // Time & Attendance
  if (['work schedule', 'work_schedule', 'schedule', 'working hours'].includes(h)) return 'workSchedule'
  if (['weekly hours', 'weekly_hours', 'hours per week', 'hours_per_week'].includes(h)) return 'weeklyHours'
  if (['timezone', 'time zone', 'time_zone', 'tz'].includes(h)) return 'timezone'
  if (['shift type', 'shift_type', 'shift'].includes(h)) return 'shiftType'

  // IT & Identity
  if (['ad/sso username', 'ad_sso_username', 'ad username', 'ad_username', 'sso username', 'sso_username', 'username', 'login'].includes(h)) return 'adSsoUsername'
  if (['corporate email', 'corporate_email', 'corp email', 'corp_email'].includes(h)) return 'corporateEmail'
  if (['device preference', 'device_preference', 'device', 'preferred device', 'preferred_device', 'laptop preference', 'laptop_preference'].includes(h)) return 'devicePreference'

  // Emergency Contact
  if (['emergency contact name', 'emergency_contact_name', 'emergency contact', 'emergency name', 'emergency_name', 'ice name', 'ice_name'].includes(h)) return 'emergencyContactName'
  if (['emergency contact phone', 'emergency_contact_phone', 'emergency phone', 'emergency_phone', 'ice phone', 'ice_phone'].includes(h)) return 'emergencyContactPhone'
  if (['emergency contact relationship', 'emergency_contact_relationship', 'emergency relationship', 'emergency_relationship', 'ice relationship', 'ice_relationship'].includes(h)) return 'emergencyContactRelationship'

  // Documents / Compliance
  if (['passport number', 'passport_number', 'passport', 'passport no', 'passport_no'].includes(h)) return 'passportNumber'
  if (['work permit number', 'work_permit_number', 'work permit', 'work_permit', 'visa number', 'visa_number'].includes(h)) return 'workPermitNumber'
  if (['work permit expiry', 'work_permit_expiry', 'permit expiry', 'permit_expiry', 'visa expiry', 'visa_expiry'].includes(h)) return 'workPermitExpiry'
  if (['highest education', 'highest_education', 'education', 'education level', 'education_level', 'qualification'].includes(h)) return 'highestEducation'
  if (['university/institution', 'university_institution', 'university', 'institution', 'school', 'alma mater', 'alma_mater'].includes(h)) return 'universityInstitution'
  if (['previous employer', 'previous_employer', 'last employer', 'last_employer', 'prior employer', 'prior_employer'].includes(h)) return 'previousEmployer'

  // Notes
  if (['onboarding notes', 'onboarding_notes', 'notes', 'comments', 'remarks'].includes(h)) return 'onboardingNotes'

  return null
}

/**
 * Parse a single CSV line handling quoted fields with commas and newlines.
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (inQuotes) {
      if (char === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"'
          i++ // skip escaped quote
        } else {
          inQuotes = false
        }
      } else {
        current += char
      }
    } else {
      if (char === '"') {
        inQuotes = true
      } else if (char === ',') {
        result.push(current)
        current = ''
      } else {
        current += char
      }
    }
  }
  result.push(current)
  return result
}

/**
 * Generate a sample CSV template for download.
 * Contains all 63 columns with 2 sample rows.
 */
export function generateCSVTemplate(): string {
  const headers = [
    'Full Name','Email','Personal Email','Job Title','Department','Country','Level','Hire Date',
    'Phone','Role','Manager Email','Location','Employment Type','Employee ID','Date of Birth',
    'Gender','Marital Status','Nationality','National ID',
    'Street Address','City','State/Province','Postal Code','Address Country',
    'Base Salary','Pay Currency','Pay Frequency','Bank Name','Bank Branch Code',
    'Bank Account Number','Bank Account Name','Mobile Money Provider','Mobile Money Number',
    'Tax ID Number','Social Security Number','Pension ID',
    'Bonus Target %','Equity/Stock Units','Pay Band/Grade',
    'Allowance - Housing','Allowance - Transport','Allowance - Medical',
    'Medical Plan','Dental Plan','Life Insurance','Number of Dependents',
    'Work Schedule','Weekly Hours','Timezone','Shift Type',
    'AD/SSO Username','Corporate Email','Device Preference',
    'Emergency Contact Name','Emergency Contact Phone','Emergency Contact Relationship',
    'Passport Number','Work Permit Number','Work Permit Expiry',
    'Highest Education','University/Institution','Previous Employer',
    'Onboarding Notes',
  ]

  const row1 = [
    'Amina Mwangi','amina.mwangi@temporuns.com','amina.m@gmail.com',
    'Software Engineer','Engineering','KE','Mid-Level','2026-01-15',
    '+254 712 345 678','employee','','Nairobi','full_time','EMP-010','1994-05-20',
    'female','single','Kenyan','KE-ID-12345678',
    '10 Ngong Road','Nairobi','Nairobi County','00100','KE',
    '3600000','KES','monthly','Equity Bank','EQBLKENA',
    '9876543210','Amina Mwangi','M-Pesa','+254 712 345 678',
    'KE-KRA-A123456789C','NSSF-KE-789012','PEN-KE-0010',
    '10','','IC3','60000','20000','40000',
    'Premium','Basic','Yes','0',
    'Mon-Fri 9:00-17:00','40','Africa/Nairobi','day',
    'amwangi','','mac',
    'Grace Mwangi','+254 733 111 222','parent',
    'P12345678','','','bachelor','Kenyatta University','Safaricom',
    'First hire in Nairobi engineering team',
  ]

  const row2 = [
    'Tariq Ibrahim','tariq.ibrahim@temporuns.com','t.ibrahim@yahoo.com',
    'Finance Analyst','Finance','TZ','Senior','2025-08-01',
    '+255 754 321 098','employee','amina.mwangi@temporuns.com','Dar es Salaam','full_time','EMP-011','1991-09-14',
    'male','married','Tanzanian','TZ-NIN-87654321',
    '25 Samora Avenue','Dar es Salaam','Dar es Salaam Region','11101','TZ',
    '5400000','TZS','monthly','CRDB Bank','CORUTZTZ',
    '1122334455','Tariq Ibrahim','Tigo Pesa','+255 754 321 098',
    'TZ-TIN-98765432','NSSF-TZ-654321','PEN-TZ-0011',
    '15','100','IC4','80000','30000','50000',
    'Standard','','Yes','2',
    'Mon-Fri 8:00-17:00','45','Africa/Dar_es_Salaam','day',
    'tibrahim','','windows',
    'Fatima Ibrahim','+255 765 432 109','spouse',
    'Q87654321','WP-TZ-001','2028-06-30','master','University of Dar es Salaam','Deloitte',
    'CPA certified; transferring from Arusha office',
  ]

  return [headers.join(','), row1.join(','), row2.join(',')].join('\n')
}
