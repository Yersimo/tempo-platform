// Benefits Comparison & Quoting Engine
// Plan comparison tool with carrier data, cost modeling, and recommendations

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PlanCategory = 'medical' | 'dental' | 'vision' | 'life' | 'disability' | 'retirement' | 'hsa' | 'fsa'
export type PlanTier = 'employee_only' | 'employee_spouse' | 'employee_children' | 'family'
export type NetworkType = 'hmo' | 'ppo' | 'epo' | 'hdhp' | 'pos'

export interface BenefitsPlan {
  id: string
  carrier: string
  carrierLogo: string
  name: string
  category: PlanCategory
  network: NetworkType
  tiers: PlanTierPricing[]
  deductible: { individual: number; family: number }
  outOfPocketMax: { individual: number; family: number }
  coinsurance: number // percentage employee pays after deductible
  copay: { primaryCare: number; specialist: number; urgentCare: number; er: number }
  prescription: { generic: number; brandPreferred: number; brandNonPreferred: number; specialty: number }
  features: string[]
  hsaEligible: boolean
  rating: number
  stateAvailability: string[]
}

export interface PlanTierPricing {
  tier: PlanTier
  employeeCost: number
  employerCost: number
  totalPremium: number
}

export interface PlanComparison {
  plans: BenefitsPlan[]
  comparisonMatrix: ComparisonRow[]
  costAnalysis: CostAnalysis
  recommendation: PlanRecommendation
}

export interface ComparisonRow {
  feature: string
  category: string
  values: Record<string, string | number>
}

export interface CostAnalysis {
  byPlan: Array<{
    planId: string
    planName: string
    annualEmployeeCost: number
    annualEmployerCost: number
    annualTotalCost: number
    estimatedOopCost: number // out-of-pocket based on usage
    totalAnnualCost: number // premium + estimated OOP
  }>
  orgTotalAnnual: number
  perEmployeeAverage: number
  savingsOpportunity: number
}

export interface PlanRecommendation {
  bestValue: string
  bestCoverage: string
  lowestCost: string
  bestForFamilies: string
  reasoning: Record<string, string>
}

export interface EnrollmentSummary {
  orgId: string
  totalEnrolled: number
  byPlan: Record<string, number>
  byTier: Record<PlanTier, number>
  monthlyEmployerCost: number
  monthlyEmployeeCost: number
  annualProjectedCost: number
}

export interface BenefitsQuote {
  id: string
  orgId: string
  generatedAt: string
  employeeCount: number
  zipCode: string
  state: string
  industryCode: string
  averageAge: number
  plans: BenefitsPlan[]
  totalMonthlyPremium: number
  effectiveDate: string
  expiresAt: string
}

// ---------------------------------------------------------------------------
// Carrier Data (Sample rates from major carriers)
// ---------------------------------------------------------------------------

const PLANS_DATABASE: BenefitsPlan[] = [
  // Medical Plans
  {
    id: 'aetna-gold-ppo',
    carrier: 'Aetna',
    carrierLogo: '🏥',
    name: 'Aetna Gold PPO',
    category: 'medical',
    network: 'ppo',
    tiers: [
      { tier: 'employee_only', employeeCost: 185, employerCost: 465, totalPremium: 650 },
      { tier: 'employee_spouse', employeeCost: 370, employerCost: 830, totalPremium: 1200 },
      { tier: 'employee_children', employeeCost: 340, employerCost: 760, totalPremium: 1100 },
      { tier: 'family', employeeCost: 520, employerCost: 1180, totalPremium: 1700 },
    ],
    deductible: { individual: 500, family: 1000 },
    outOfPocketMax: { individual: 4000, family: 8000 },
    coinsurance: 20,
    copay: { primaryCare: 25, specialist: 50, urgentCare: 75, er: 250 },
    prescription: { generic: 10, brandPreferred: 35, brandNonPreferred: 70, specialty: 150 },
    features: ['Large national PPO network', 'No referrals needed', 'Telehealth included', 'Mental health coverage', 'Preventive care 100%'],
    hsaEligible: false,
    rating: 4.3,
    stateAvailability: ['CA', 'NY', 'TX', 'FL', 'IL', 'PA', 'OH', 'GA', 'NC', 'MI', 'NJ', 'VA', 'WA', 'AZ', 'MA', 'TN', 'IN', 'MO', 'MD', 'WI'],
  },
  {
    id: 'cigna-silver-hmo',
    carrier: 'Cigna',
    carrierLogo: '🏥',
    name: 'Cigna Silver HMO',
    category: 'medical',
    network: 'hmo',
    tiers: [
      { tier: 'employee_only', employeeCost: 140, employerCost: 360, totalPremium: 500 },
      { tier: 'employee_spouse', employeeCost: 290, employerCost: 660, totalPremium: 950 },
      { tier: 'employee_children', employeeCost: 265, employerCost: 585, totalPremium: 850 },
      { tier: 'family', employeeCost: 410, employerCost: 940, totalPremium: 1350 },
    ],
    deductible: { individual: 1000, family: 2000 },
    outOfPocketMax: { individual: 5000, family: 10000 },
    coinsurance: 20,
    copay: { primaryCare: 20, specialist: 40, urgentCare: 60, er: 200 },
    prescription: { generic: 10, brandPreferred: 30, brandNonPreferred: 60, specialty: 125 },
    features: ['Lower premiums', 'PCP coordination', 'Wellness programs', 'Preventive care 100%', 'Cigna Virtual Care'],
    hsaEligible: false,
    rating: 4.1,
    stateAvailability: ['CA', 'NY', 'TX', 'FL', 'IL', 'PA', 'OH', 'GA', 'NC', 'MI', 'NJ', 'VA', 'WA', 'AZ', 'MA', 'TN', 'IN', 'MO', 'MD', 'WI', 'CO', 'OR'],
  },
  {
    id: 'unitedhealth-hdhp',
    carrier: 'UnitedHealthcare',
    carrierLogo: '🏥',
    name: 'UHC Choice Plus HDHP',
    category: 'medical',
    network: 'hdhp',
    tiers: [
      { tier: 'employee_only', employeeCost: 95, employerCost: 305, totalPremium: 400 },
      { tier: 'employee_spouse', employeeCost: 210, employerCost: 540, totalPremium: 750 },
      { tier: 'employee_children', employeeCost: 190, employerCost: 480, totalPremium: 670 },
      { tier: 'family', employeeCost: 310, employerCost: 790, totalPremium: 1100 },
    ],
    deductible: { individual: 1600, family: 3200 },
    outOfPocketMax: { individual: 7050, family: 14100 },
    coinsurance: 20,
    copay: { primaryCare: 0, specialist: 0, urgentCare: 0, er: 0 },
    prescription: { generic: 0, brandPreferred: 0, brandNonPreferred: 0, specialty: 0 },
    features: ['Lowest premiums', 'HSA eligible', 'Employer HSA contribution', 'After deductible: 80/20', 'Preventive care 100%', 'UHC Virtual Visits'],
    hsaEligible: true,
    rating: 4.0,
    stateAvailability: ['CA', 'NY', 'TX', 'FL', 'IL', 'PA', 'OH', 'GA', 'NC', 'MI', 'NJ', 'VA', 'WA', 'AZ', 'MA', 'TN', 'IN', 'MO', 'MD', 'WI', 'CO', 'OR', 'MN', 'CT'],
  },
  {
    id: 'bcbs-platinum-ppo',
    carrier: 'Blue Cross Blue Shield',
    carrierLogo: '🏥',
    name: 'BCBS Platinum PPO',
    category: 'medical',
    network: 'ppo',
    tiers: [
      { tier: 'employee_only', employeeCost: 245, employerCost: 605, totalPremium: 850 },
      { tier: 'employee_spouse', employeeCost: 490, employerCost: 1110, totalPremium: 1600 },
      { tier: 'employee_children', employeeCost: 430, employerCost: 970, totalPremium: 1400 },
      { tier: 'family', employeeCost: 680, employerCost: 1520, totalPremium: 2200 },
    ],
    deductible: { individual: 250, family: 500 },
    outOfPocketMax: { individual: 2500, family: 5000 },
    coinsurance: 10,
    copay: { primaryCare: 15, specialist: 30, urgentCare: 50, er: 150 },
    prescription: { generic: 5, brandPreferred: 25, brandNonPreferred: 50, specialty: 100 },
    features: ['Largest network nationwide', 'Lowest out-of-pocket', 'Minimal copays', 'Preventive care 100%', 'International coverage', 'Fertility coverage'],
    hsaEligible: false,
    rating: 4.5,
    stateAvailability: ['CA', 'NY', 'TX', 'FL', 'IL', 'PA', 'OH', 'GA', 'NC', 'MI', 'NJ', 'VA', 'WA', 'AZ', 'MA', 'TN', 'IN', 'MO', 'MD', 'WI', 'CO', 'OR', 'MN', 'CT', 'SC', 'AL'],
  },
  {
    id: 'kaiser-gold-hmo',
    carrier: 'Kaiser Permanente',
    carrierLogo: '🏥',
    name: 'Kaiser Gold HMO',
    category: 'medical',
    network: 'hmo',
    tiers: [
      { tier: 'employee_only', employeeCost: 160, employerCost: 440, totalPremium: 600 },
      { tier: 'employee_spouse', employeeCost: 330, employerCost: 770, totalPremium: 1100 },
      { tier: 'employee_children', employeeCost: 300, employerCost: 700, totalPremium: 1000 },
      { tier: 'family', employeeCost: 475, employerCost: 1075, totalPremium: 1550 },
    ],
    deductible: { individual: 0, family: 0 },
    outOfPocketMax: { individual: 3000, family: 6000 },
    coinsurance: 0,
    copay: { primaryCare: 20, specialist: 35, urgentCare: 50, er: 200 },
    prescription: { generic: 10, brandPreferred: 30, brandNonPreferred: 50, specialty: 100 },
    features: ['No deductible', 'Integrated care system', 'Pharmacy included', 'Preventive care 100%', 'Mental health included', 'Online scheduling'],
    hsaEligible: false,
    rating: 4.4,
    stateAvailability: ['CA', 'CO', 'GA', 'HI', 'MD', 'OR', 'VA', 'WA', 'DC'],
  },

  // Dental Plans
  {
    id: 'delta-dental-ppo',
    carrier: 'Delta Dental',
    carrierLogo: '🦷',
    name: 'Delta Dental PPO Plus',
    category: 'dental',
    network: 'ppo',
    tiers: [
      { tier: 'employee_only', employeeCost: 18, employerCost: 32, totalPremium: 50 },
      { tier: 'employee_spouse', employeeCost: 35, employerCost: 55, totalPremium: 90 },
      { tier: 'employee_children', employeeCost: 32, employerCost: 48, totalPremium: 80 },
      { tier: 'family', employeeCost: 48, employerCost: 82, totalPremium: 130 },
    ],
    deductible: { individual: 50, family: 150 },
    outOfPocketMax: { individual: 1500, family: 4500 },
    coinsurance: 20,
    copay: { primaryCare: 0, specialist: 0, urgentCare: 0, er: 0 },
    prescription: { generic: 0, brandPreferred: 0, brandNonPreferred: 0, specialty: 0 },
    features: ['Preventive: 100% covered', 'Basic: 80% after deductible', 'Major: 50% after deductible', 'Orthodontia: 50% (child)', '$1,500 annual max per person'],
    hsaEligible: false,
    rating: 4.2,
    stateAvailability: ['CA', 'NY', 'TX', 'FL', 'IL', 'PA', 'OH', 'GA', 'NC', 'MI', 'NJ', 'VA', 'WA', 'AZ', 'MA'],
  },
  {
    id: 'guardian-dental',
    carrier: 'Guardian',
    carrierLogo: '🦷',
    name: 'Guardian DentalGuard Preferred',
    category: 'dental',
    network: 'ppo',
    tiers: [
      { tier: 'employee_only', employeeCost: 15, employerCost: 28, totalPremium: 43 },
      { tier: 'employee_spouse', employeeCost: 30, employerCost: 48, totalPremium: 78 },
      { tier: 'employee_children', employeeCost: 28, employerCost: 42, totalPremium: 70 },
      { tier: 'family', employeeCost: 42, employerCost: 73, totalPremium: 115 },
    ],
    deductible: { individual: 50, family: 150 },
    outOfPocketMax: { individual: 2000, family: 6000 },
    coinsurance: 20,
    copay: { primaryCare: 0, specialist: 0, urgentCare: 0, er: 0 },
    prescription: { generic: 0, brandPreferred: 0, brandNonPreferred: 0, specialty: 0 },
    features: ['Preventive: 100% covered', 'Basic: 80% after deductible', 'Major: 60% after deductible', 'Orthodontia: 50% ($1,500 lifetime max)', '$2,000 annual max per person'],
    hsaEligible: false,
    rating: 4.0,
    stateAvailability: ['CA', 'NY', 'TX', 'FL', 'IL', 'PA', 'OH', 'GA', 'NC', 'MI', 'NJ', 'VA', 'WA', 'AZ', 'MA', 'CO', 'OR', 'WI'],
  },

  // Vision Plans
  {
    id: 'vsp-choice',
    carrier: 'VSP',
    carrierLogo: '👓',
    name: 'VSP Choice',
    category: 'vision',
    network: 'ppo',
    tiers: [
      { tier: 'employee_only', employeeCost: 6, employerCost: 9, totalPremium: 15 },
      { tier: 'employee_spouse', employeeCost: 12, employerCost: 16, totalPremium: 28 },
      { tier: 'employee_children', employeeCost: 11, employerCost: 14, totalPremium: 25 },
      { tier: 'family', employeeCost: 17, employerCost: 23, totalPremium: 40 },
    ],
    deductible: { individual: 0, family: 0 },
    outOfPocketMax: { individual: 500, family: 1500 },
    coinsurance: 0,
    copay: { primaryCare: 15, specialist: 15, urgentCare: 0, er: 0 },
    prescription: { generic: 0, brandPreferred: 0, brandNonPreferred: 0, specialty: 0 },
    features: ['Exam every 12 months ($15 copay)', 'Lenses every 12 months', '$150 frame allowance', '$130 contact lens allowance', '20% off additional glasses', 'Laser vision discount'],
    hsaEligible: false,
    rating: 4.1,
    stateAvailability: ['CA', 'NY', 'TX', 'FL', 'IL', 'PA', 'OH', 'GA', 'NC', 'MI', 'NJ', 'VA', 'WA', 'AZ', 'MA', 'CO', 'OR', 'WI', 'TN', 'IN'],
  },

  // Life Insurance
  {
    id: 'metlife-group-life',
    carrier: 'MetLife',
    carrierLogo: '🛡️',
    name: 'MetLife Group Term Life',
    category: 'life',
    network: 'ppo',
    tiers: [
      { tier: 'employee_only', employeeCost: 8, employerCost: 12, totalPremium: 20 },
      { tier: 'employee_spouse', employeeCost: 14, employerCost: 16, totalPremium: 30 },
      { tier: 'employee_children', employeeCost: 12, employerCost: 13, totalPremium: 25 },
      { tier: 'family', employeeCost: 18, employerCost: 22, totalPremium: 40 },
    ],
    deductible: { individual: 0, family: 0 },
    outOfPocketMax: { individual: 0, family: 0 },
    coinsurance: 0,
    copay: { primaryCare: 0, specialist: 0, urgentCare: 0, er: 0 },
    prescription: { generic: 0, brandPreferred: 0, brandNonPreferred: 0, specialty: 0 },
    features: ['1x annual salary (employer-paid)', 'Supplemental up to 5x salary', 'AD&D included', 'Accelerated death benefit', 'Portability option', 'Will preparation service'],
    hsaEligible: false,
    rating: 4.3,
    stateAvailability: ['CA', 'NY', 'TX', 'FL', 'IL', 'PA', 'OH', 'GA', 'NC', 'MI', 'NJ', 'VA', 'WA', 'AZ', 'MA', 'CO', 'OR', 'WI', 'TN', 'IN', 'MO', 'MD'],
  },

  // Disability
  {
    id: 'lincoln-std-ltd',
    carrier: 'Lincoln Financial',
    carrierLogo: '🛡️',
    name: 'Lincoln STD + LTD',
    category: 'disability',
    network: 'ppo',
    tiers: [
      { tier: 'employee_only', employeeCost: 12, employerCost: 18, totalPremium: 30 },
      { tier: 'employee_spouse', employeeCost: 12, employerCost: 18, totalPremium: 30 },
      { tier: 'employee_children', employeeCost: 12, employerCost: 18, totalPremium: 30 },
      { tier: 'family', employeeCost: 12, employerCost: 18, totalPremium: 30 },
    ],
    deductible: { individual: 0, family: 0 },
    outOfPocketMax: { individual: 0, family: 0 },
    coinsurance: 0,
    copay: { primaryCare: 0, specialist: 0, urgentCare: 0, er: 0 },
    prescription: { generic: 0, brandPreferred: 0, brandNonPreferred: 0, specialty: 0 },
    features: ['STD: 60% salary, 14-day wait, 26-week max', 'LTD: 60% salary, 90-day wait, to age 65', 'Mental health coverage', 'Rehabilitation support', 'Return-to-work programs'],
    hsaEligible: false,
    rating: 4.2,
    stateAvailability: ['CA', 'NY', 'TX', 'FL', 'IL', 'PA', 'OH', 'GA', 'NC', 'MI', 'NJ', 'VA', 'WA', 'AZ', 'MA', 'CO', 'OR', 'WI', 'TN', 'IN', 'MO', 'MD'],
  },
]

// In-memory stores
const quotes = new Map<string, BenefitsQuote>()
const orgPlanSelections = new Map<string, string[]>() // orgId -> selected planIds
const enrollments = new Map<string, Map<string, { planId: string; tier: PlanTier }>>() // orgId -> employeeId -> selection

// ---------------------------------------------------------------------------
// Plan Browsing & Comparison
// ---------------------------------------------------------------------------

export async function getAvailablePlans(filters?: {
  category?: PlanCategory
  network?: NetworkType
  state?: string
  carrier?: string
  hsaEligible?: boolean
  maxEmployeeCost?: number
}): Promise<BenefitsPlan[]> {
  let plans = [...PLANS_DATABASE]

  if (filters?.category) plans = plans.filter(p => p.category === filters.category)
  if (filters?.network) plans = plans.filter(p => p.network === filters.network)
  if (filters?.state) plans = plans.filter(p => p.stateAvailability.includes(filters.state!))
  if (filters?.carrier) plans = plans.filter(p => p.carrier.toLowerCase().includes(filters.carrier!.toLowerCase()))
  if (filters?.hsaEligible) plans = plans.filter(p => p.hsaEligible)
  if (filters?.maxEmployeeCost) {
    plans = plans.filter(p => p.tiers[0].employeeCost <= filters.maxEmployeeCost!)
  }

  return plans
}

export async function comparePlans(planIds: string[], employeeCount: number, tier: PlanTier = 'employee_only'): Promise<PlanComparison> {
  const plans = PLANS_DATABASE.filter(p => planIds.includes(p.id))
  if (plans.length < 2) throw new Error('Need at least 2 plans to compare')

  // Build comparison matrix
  const comparisonMatrix: ComparisonRow[] = [
    { feature: 'Monthly Premium (Employee)', category: 'Cost', values: {} },
    { feature: 'Monthly Premium (Employer)', category: 'Cost', values: {} },
    { feature: 'Annual Deductible (Individual)', category: 'Cost', values: {} },
    { feature: 'Out-of-Pocket Max (Individual)', category: 'Cost', values: {} },
    { feature: 'Coinsurance', category: 'Coverage', values: {} },
    { feature: 'Primary Care Copay', category: 'Coverage', values: {} },
    { feature: 'Specialist Copay', category: 'Coverage', values: {} },
    { feature: 'ER Copay', category: 'Coverage', values: {} },
    { feature: 'Generic Rx', category: 'Pharmacy', values: {} },
    { feature: 'Brand Rx', category: 'Pharmacy', values: {} },
    { feature: 'HSA Eligible', category: 'Features', values: {} },
    { feature: 'Network Type', category: 'Network', values: {} },
    { feature: 'Rating', category: 'Quality', values: {} },
  ]

  for (const plan of plans) {
    const tierPricing = plan.tiers.find(t => t.tier === tier) || plan.tiers[0]
    comparisonMatrix[0].values[plan.id] = `$${tierPricing.employeeCost}`
    comparisonMatrix[1].values[plan.id] = `$${tierPricing.employerCost}`
    comparisonMatrix[2].values[plan.id] = `$${plan.deductible.individual}`
    comparisonMatrix[3].values[plan.id] = `$${plan.outOfPocketMax.individual}`
    comparisonMatrix[4].values[plan.id] = `${plan.coinsurance}%`
    comparisonMatrix[5].values[plan.id] = plan.copay.primaryCare === 0 ? 'After deductible' : `$${plan.copay.primaryCare}`
    comparisonMatrix[6].values[plan.id] = plan.copay.specialist === 0 ? 'After deductible' : `$${plan.copay.specialist}`
    comparisonMatrix[7].values[plan.id] = plan.copay.er === 0 ? 'After deductible' : `$${plan.copay.er}`
    comparisonMatrix[8].values[plan.id] = plan.prescription.generic === 0 ? 'After deductible' : `$${plan.prescription.generic}`
    comparisonMatrix[9].values[plan.id] = plan.prescription.brandPreferred === 0 ? 'After deductible' : `$${plan.prescription.brandPreferred}`
    comparisonMatrix[10].values[plan.id] = plan.hsaEligible ? 'Yes ✓' : 'No'
    comparisonMatrix[11].values[plan.id] = plan.network.toUpperCase()
    comparisonMatrix[12].values[plan.id] = `${plan.rating}/5`
  }

  // Cost analysis (assumes average utilization)
  const costAnalysis: CostAnalysis = {
    byPlan: plans.map(plan => {
      const tierPricing = plan.tiers.find(t => t.tier === tier) || plan.tiers[0]
      const annualEmployeeCost = tierPricing.employeeCost * 12
      const annualEmployerCost = tierPricing.employerCost * 12
      // Estimate OOP: assume average employee uses 40% of deductible + 8 PCP visits + 2 specialist visits + 12 generic Rx
      const estimatedOopCost = (plan.deductible.individual * 0.4) +
        (plan.copay.primaryCare * 8) +
        (plan.copay.specialist * 2) +
        (plan.prescription.generic * 12)

      return {
        planId: plan.id,
        planName: plan.name,
        annualEmployeeCost: Math.round(annualEmployeeCost),
        annualEmployerCost: Math.round(annualEmployerCost * employeeCount),
        annualTotalCost: Math.round((annualEmployeeCost + annualEmployerCost) * employeeCount),
        estimatedOopCost: Math.round(estimatedOopCost),
        totalAnnualCost: Math.round(annualEmployeeCost + estimatedOopCost),
      }
    }),
    orgTotalAnnual: 0,
    perEmployeeAverage: 0,
    savingsOpportunity: 0,
  }

  const cheapest = Math.min(...costAnalysis.byPlan.map(p => p.annualTotalCost))
  const mostExpensive = Math.max(...costAnalysis.byPlan.map(p => p.annualTotalCost))
  costAnalysis.orgTotalAnnual = costAnalysis.byPlan.reduce((s, p) => s + p.annualEmployerCost, 0) / plans.length
  costAnalysis.perEmployeeAverage = Math.round(costAnalysis.orgTotalAnnual / employeeCount)
  costAnalysis.savingsOpportunity = mostExpensive - cheapest

  // Recommendations
  const byTotalCost = [...costAnalysis.byPlan].sort((a, b) => a.totalAnnualCost - b.totalAnnualCost)
  const byEmployeeCost = [...costAnalysis.byPlan].sort((a, b) => a.annualEmployeeCost - b.annualEmployeeCost)
  const bestCoveragePlan = plans.reduce((best, plan) => plan.outOfPocketMax.individual < best.outOfPocketMax.individual ? plan : best)
  const bestFamilyPlan = plans.reduce((best, plan) => {
    const familyTier = plan.tiers.find(t => t.tier === 'family')
    const bestFamilyTier = best.tiers.find(t => t.tier === 'family')
    if (!familyTier || !bestFamilyTier) return best
    return familyTier.employeeCost < bestFamilyTier.employeeCost ? plan : best
  })

  const recommendation: PlanRecommendation = {
    bestValue: byTotalCost[0].planId,
    bestCoverage: bestCoveragePlan.id,
    lowestCost: byEmployeeCost[0].planId,
    bestForFamilies: bestFamilyPlan.id,
    reasoning: {
      [byTotalCost[0].planId]: `Lowest total annual cost ($${byTotalCost[0].totalAnnualCost}) when factoring premiums and estimated out-of-pocket expenses.`,
      [bestCoveragePlan.id]: `Lowest out-of-pocket maximum ($${bestCoveragePlan.outOfPocketMax.individual}) providing the best financial protection.`,
      [byEmployeeCost[0].planId]: `Lowest employee premium ($${byEmployeeCost[0].annualEmployeeCost}/year) minimizing paycheck deductions.`,
      [bestFamilyPlan.id]: `Best family tier pricing relative to coverage level.`,
    },
  }

  return { plans, comparisonMatrix, costAnalysis, recommendation }
}

// ---------------------------------------------------------------------------
// Quote Generation
// ---------------------------------------------------------------------------

export async function generateBenefitsQuote(
  orgId: string,
  params: {
    employeeCount: number
    zipCode: string
    state: string
    industryCode?: string
    averageAge?: number
    categories?: PlanCategory[]
  }
): Promise<BenefitsQuote> {
  const categories = params.categories || ['medical', 'dental', 'vision']
  const ageFactor = params.averageAge ? (params.averageAge / 35) : 1 // normalize around age 35
  const sizeFactor = params.employeeCount > 50 ? 0.92 : params.employeeCount > 20 ? 0.96 : 1 // volume discount

  // Filter plans by state and category
  let eligiblePlans = PLANS_DATABASE.filter(p =>
    categories.includes(p.category) &&
    p.stateAvailability.includes(params.state)
  )

  // Apply age and size adjustments to pricing
  eligiblePlans = eligiblePlans.map(plan => ({
    ...plan,
    tiers: plan.tiers.map(tier => ({
      ...tier,
      employeeCost: Math.round(tier.employeeCost * ageFactor * sizeFactor),
      employerCost: Math.round(tier.employerCost * ageFactor * sizeFactor),
      totalPremium: Math.round(tier.totalPremium * ageFactor * sizeFactor),
    })),
  }))

  const totalMonthly = eligiblePlans.reduce((sum, plan) => {
    const employeeOnly = plan.tiers.find(t => t.tier === 'employee_only')
    return sum + (employeeOnly?.totalPremium || 0)
  }, 0) * params.employeeCount / eligiblePlans.length

  const effectiveDate = new Date()
  effectiveDate.setMonth(effectiveDate.getMonth() + 1, 1)

  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 30)

  const quote: BenefitsQuote = {
    id: crypto.randomUUID(),
    orgId,
    generatedAt: new Date().toISOString(),
    employeeCount: params.employeeCount,
    zipCode: params.zipCode,
    state: params.state,
    industryCode: params.industryCode || 'TECH',
    averageAge: params.averageAge || 35,
    plans: eligiblePlans,
    totalMonthlyPremium: Math.round(totalMonthly),
    effectiveDate: effectiveDate.toISOString().split('T')[0],
    expiresAt: expiresAt.toISOString().split('T')[0],
  }

  quotes.set(quote.id, quote)
  return quote
}

export async function getQuote(orgId: string, quoteId: string): Promise<BenefitsQuote | null> {
  const quote = quotes.get(quoteId)
  if (!quote || quote.orgId !== orgId) return null
  return quote
}

// ---------------------------------------------------------------------------
// Plan Selection & Enrollment
// ---------------------------------------------------------------------------

export async function selectOrgPlans(orgId: string, planIds: string[]): Promise<{ selectedPlans: BenefitsPlan[] }> {
  const valid = planIds.filter(id => PLANS_DATABASE.some(p => p.id === id))
  orgPlanSelections.set(orgId, valid)
  return { selectedPlans: PLANS_DATABASE.filter(p => valid.includes(p.id)) }
}

export async function getOrgSelectedPlans(orgId: string): Promise<BenefitsPlan[]> {
  const selected = orgPlanSelections.get(orgId) || []
  return PLANS_DATABASE.filter(p => selected.includes(p.id))
}

export async function enrollEmployee(
  orgId: string,
  employeeId: string,
  planId: string,
  tier: PlanTier
): Promise<{ success: boolean; enrollment: { planId: string; tier: PlanTier; plan: BenefitsPlan } }> {
  const plan = PLANS_DATABASE.find(p => p.id === planId)
  if (!plan) throw new Error('Plan not found')

  const orgEnrollments = enrollments.get(orgId) || new Map()
  orgEnrollments.set(employeeId, { planId, tier })
  enrollments.set(orgId, orgEnrollments)

  return { success: true, enrollment: { planId, tier, plan } }
}

export async function getEnrollmentSummary(orgId: string): Promise<EnrollmentSummary> {
  const orgEnrollments = enrollments.get(orgId) || new Map()
  const byPlan: Record<string, number> = {}
  const byTier: Record<PlanTier, number> = { employee_only: 0, employee_spouse: 0, employee_children: 0, family: 0 }
  let monthlyEmployerCost = 0
  let monthlyEmployeeCost = 0

  for (const [, { planId, tier }] of orgEnrollments) {
    byPlan[planId] = (byPlan[planId] || 0) + 1
    byTier[tier as PlanTier]++

    const plan = PLANS_DATABASE.find(p => p.id === planId)
    if (plan) {
      const pricing = plan.tiers.find(t => t.tier === tier) || plan.tiers[0]
      monthlyEmployerCost += pricing.employerCost
      monthlyEmployeeCost += pricing.employeeCost
    }
  }

  return {
    orgId,
    totalEnrolled: orgEnrollments.size,
    byPlan,
    byTier,
    monthlyEmployerCost: Math.round(monthlyEmployerCost),
    monthlyEmployeeCost: Math.round(monthlyEmployeeCost),
    annualProjectedCost: Math.round((monthlyEmployerCost + monthlyEmployeeCost) * 12),
  }
}

// ---------------------------------------------------------------------------
// Benefits Analytics
// ---------------------------------------------------------------------------

export async function getBenefitsAnalytics(orgId: string): Promise<{
  planCount: number
  carriers: string[]
  categories: PlanCategory[]
  totalPlansAvailable: number
  avgEmployeeCost: number
  avgEmployerCost: number
  hsaEligibleCount: number
  topRatedPlan: { name: string; rating: number }
}> {
  const orgPlans = await getOrgSelectedPlans(orgId)
  const allPlans = PLANS_DATABASE

  const avgEmployee = orgPlans.length > 0
    ? Math.round(orgPlans.reduce((s, p) => s + p.tiers[0].employeeCost, 0) / orgPlans.length)
    : Math.round(allPlans.reduce((s, p) => s + p.tiers[0].employeeCost, 0) / allPlans.length)

  const avgEmployer = orgPlans.length > 0
    ? Math.round(orgPlans.reduce((s, p) => s + p.tiers[0].employerCost, 0) / orgPlans.length)
    : Math.round(allPlans.reduce((s, p) => s + p.tiers[0].employerCost, 0) / allPlans.length)

  const topRated = [...allPlans].sort((a, b) => b.rating - a.rating)[0]

  return {
    planCount: orgPlans.length || allPlans.length,
    carriers: [...new Set(allPlans.map(p => p.carrier))],
    categories: [...new Set(allPlans.map(p => p.category))] as PlanCategory[],
    totalPlansAvailable: allPlans.length,
    avgEmployeeCost: avgEmployee,
    avgEmployerCost: avgEmployer,
    hsaEligibleCount: allPlans.filter(p => p.hsaEligible).length,
    topRatedPlan: { name: topRated.name, rating: topRated.rating },
  }
}
