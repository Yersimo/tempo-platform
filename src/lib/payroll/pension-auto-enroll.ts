/**
 * Pension Auto-Enrolment Engine
 *
 * Automatically enrols eligible employees in statutory pension schemes
 * based on country-specific rules (age, earnings, tenure thresholds).
 */

export interface PensionScheme {
  id: string
  country: string
  name: string
  type: 'statutory' | 'occupational' | 'voluntary'
  employerRate: number    // percentage
  employeeRate: number    // percentage
  provider: string
  mandatory: boolean
}

export interface AutoEnrolmentRule {
  country: string
  schemeName: string
  minAge: number
  maxAge: number
  minEarningsMonthly: number  // cents (0 = no minimum)
  minTenureDays: number       // 0 = immediate
  mandatory: boolean
  employerRate: number
  employeeRate: number
  optOutAllowed: boolean
  optOutWindowDays: number    // days after enrolment to opt out
  reEnrolmentMonths: number   // 0 = never, 36 = every 3 years (UK)
}

export interface EnrolmentEligibility {
  employeeId: string
  employeeName: string
  eligible: boolean
  alreadyEnrolled: boolean
  schemeName: string
  country: string
  reason: string
  employerRate: number
  employeeRate: number
  effectiveDate: string
  optOutDeadline?: string
}

export interface AutoEnrolmentResult {
  country: string
  totalEligible: number
  alreadyEnrolled: number
  newEnrolments: number
  ineligible: number
  employees: EnrolmentEligibility[]
}

/**
 * Country-specific auto-enrolment rules
 */
const AUTO_ENROLMENT_RULES: Record<string, AutoEnrolmentRule> = {
  GH: {
    country: 'GH',
    schemeName: 'SSNIT (Tier 1 & 2)',
    minAge: 15,
    maxAge: 60,
    minEarningsMonthly: 0,
    minTenureDays: 0,
    mandatory: true,
    employerRate: 13.0,
    employeeRate: 5.5,
    optOutAllowed: false,
    optOutWindowDays: 0,
    reEnrolmentMonths: 0,
  },
  NG: {
    country: 'NG',
    schemeName: 'Pension Fund (PFA)',
    minAge: 18,
    maxAge: 60,
    minEarningsMonthly: 0,
    minTenureDays: 0,
    mandatory: true,
    employerRate: 10.0,
    employeeRate: 8.0,
    optOutAllowed: false,
    optOutWindowDays: 0,
    reEnrolmentMonths: 0,
  },
  KE: {
    country: 'KE',
    schemeName: 'NSSF (New Rates)',
    minAge: 18,
    maxAge: 65,
    minEarningsMonthly: 0,
    minTenureDays: 0,
    mandatory: true,
    employerRate: 6.0,
    employeeRate: 6.0,
    optOutAllowed: false,
    optOutWindowDays: 0,
    reEnrolmentMonths: 0,
  },
  ZA: {
    country: 'ZA',
    schemeName: 'UIF + Retirement Fund',
    minAge: 18,
    maxAge: 65,
    minEarningsMonthly: 0,
    minTenureDays: 0,
    mandatory: true,
    employerRate: 7.5,
    employeeRate: 7.5,
    optOutAllowed: false,
    optOutWindowDays: 0,
    reEnrolmentMonths: 0,
  },
  CI: {
    country: 'CI',
    schemeName: 'CNPS (Pension)',
    minAge: 18,
    maxAge: 60,
    minEarningsMonthly: 0,
    minTenureDays: 0,
    mandatory: true,
    employerRate: 7.7,
    employeeRate: 6.3,
    optOutAllowed: false,
    optOutWindowDays: 0,
    reEnrolmentMonths: 0,
  },
  SN: {
    country: 'SN',
    schemeName: 'IPRES (Pension)',
    minAge: 18,
    maxAge: 60,
    minEarningsMonthly: 0,
    minTenureDays: 0,
    mandatory: true,
    employerRate: 8.4,
    employeeRate: 5.6,
    optOutAllowed: false,
    optOutWindowDays: 0,
    reEnrolmentMonths: 0,
  },
  UK: {
    country: 'UK',
    schemeName: 'Workplace Pension (Auto-Enrolment)',
    minAge: 22,
    maxAge: 66,
    minEarningsMonthly: 83334, // £10,000/year = £833.34/month in cents
    minTenureDays: 0,
    mandatory: true,
    employerRate: 3.0,
    employeeRate: 5.0,
    optOutAllowed: true,
    optOutWindowDays: 30,
    reEnrolmentMonths: 36,
  },
  US: {
    country: 'US',
    schemeName: '401(k)',
    minAge: 21,
    maxAge: 70,
    minEarningsMonthly: 0,
    minTenureDays: 365,
    mandatory: false,
    employerRate: 3.0,  // Common match
    employeeRate: 6.0,  // Common default
    optOutAllowed: true,
    optOutWindowDays: 90,
    reEnrolmentMonths: 0,
  },
}

/**
 * Check auto-enrolment eligibility for a set of employees.
 */
export function checkAutoEnrolmentEligibility(
  employees: Array<{
    id: string
    name: string
    country: string
    dateOfBirth?: string
    startDate?: string
    monthlySalary: number
    pensionEnrolled: boolean
    pensionOptedOut?: boolean
  }>,
  asOfDate: string = new Date().toISOString().split('T')[0],
): AutoEnrolmentResult {
  const results: EnrolmentEligibility[] = []
  const asOf = new Date(asOfDate)

  // Group by country
  const countryCounts: Record<string, number> = {}

  for (const emp of employees) {
    const rule = AUTO_ENROLMENT_RULES[emp.country]
    if (!rule) {
      results.push({
        employeeId: emp.id,
        employeeName: emp.name,
        eligible: false,
        alreadyEnrolled: emp.pensionEnrolled,
        schemeName: 'N/A',
        country: emp.country,
        reason: `No auto-enrolment rules configured for ${emp.country}`,
        employerRate: 0,
        employeeRate: 0,
        effectiveDate: asOfDate,
      })
      continue
    }

    // Check if already enrolled
    if (emp.pensionEnrolled) {
      results.push({
        employeeId: emp.id,
        employeeName: emp.name,
        eligible: true,
        alreadyEnrolled: true,
        schemeName: rule.schemeName,
        country: emp.country,
        reason: 'Already enrolled',
        employerRate: rule.employerRate,
        employeeRate: rule.employeeRate,
        effectiveDate: asOfDate,
      })
      continue
    }

    // Check age
    let age = 30 // Default if no DOB
    if (emp.dateOfBirth) {
      const dob = new Date(emp.dateOfBirth)
      age = Math.floor((asOf.getTime() - dob.getTime()) / (1000 * 60 * 60 * 24 * 365.25))
    }
    if (age < rule.minAge || age > rule.maxAge) {
      results.push({
        employeeId: emp.id,
        employeeName: emp.name,
        eligible: false,
        alreadyEnrolled: false,
        schemeName: rule.schemeName,
        country: emp.country,
        reason: `Age ${age} outside eligible range (${rule.minAge}-${rule.maxAge})`,
        employerRate: 0,
        employeeRate: 0,
        effectiveDate: asOfDate,
      })
      continue
    }

    // Check earnings threshold
    if (rule.minEarningsMonthly > 0 && emp.monthlySalary < rule.minEarningsMonthly) {
      results.push({
        employeeId: emp.id,
        employeeName: emp.name,
        eligible: false,
        alreadyEnrolled: false,
        schemeName: rule.schemeName,
        country: emp.country,
        reason: `Monthly earnings below threshold`,
        employerRate: 0,
        employeeRate: 0,
        effectiveDate: asOfDate,
      })
      continue
    }

    // Check tenure
    if (rule.minTenureDays > 0 && emp.startDate) {
      const startDate = new Date(emp.startDate)
      const tenureDays = Math.floor((asOf.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
      if (tenureDays < rule.minTenureDays) {
        results.push({
          employeeId: emp.id,
          employeeName: emp.name,
          eligible: false,
          alreadyEnrolled: false,
          schemeName: rule.schemeName,
          country: emp.country,
          reason: `Tenure ${tenureDays} days, minimum ${rule.minTenureDays} required`,
          employerRate: 0,
          employeeRate: 0,
          effectiveDate: asOfDate,
        })
        continue
      }
    }

    // Check if opted out (only valid if opt-out is allowed)
    if (emp.pensionOptedOut && rule.optOutAllowed) {
      results.push({
        employeeId: emp.id,
        employeeName: emp.name,
        eligible: true,
        alreadyEnrolled: false,
        schemeName: rule.schemeName,
        country: emp.country,
        reason: 'Eligible but opted out',
        employerRate: rule.employerRate,
        employeeRate: rule.employeeRate,
        effectiveDate: asOfDate,
      })
      continue
    }

    // Eligible for auto-enrolment
    const optOutDeadline = rule.optOutAllowed
      ? new Date(asOf.getTime() + rule.optOutWindowDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      : undefined

    results.push({
      employeeId: emp.id,
      employeeName: emp.name,
      eligible: true,
      alreadyEnrolled: false,
      schemeName: rule.schemeName,
      country: emp.country,
      reason: rule.mandatory ? 'Mandatory enrolment required' : 'Eligible for auto-enrolment',
      employerRate: rule.employerRate,
      employeeRate: rule.employeeRate,
      effectiveDate: asOfDate,
      optOutDeadline,
    })
  }

  const eligible = results.filter(r => r.eligible)
  const enrolled = results.filter(r => r.alreadyEnrolled)
  const newEnrolments = results.filter(r => r.eligible && !r.alreadyEnrolled)

  // Use first country for summary
  const country = employees[0]?.country || 'Unknown'

  return {
    country,
    totalEligible: eligible.length,
    alreadyEnrolled: enrolled.length,
    newEnrolments: newEnrolments.length,
    ineligible: results.length - eligible.length,
    employees: results,
  }
}

/**
 * Get auto-enrolment rules for a country (for display)
 */
export function getAutoEnrolmentRules(countryCode: string): AutoEnrolmentRule | null {
  return AUTO_ENROLMENT_RULES[countryCode] || null
}

/**
 * Get all supported countries with auto-enrolment rules
 */
export function getAutoEnrolmentCountries(): string[] {
  return Object.keys(AUTO_ENROLMENT_RULES)
}
