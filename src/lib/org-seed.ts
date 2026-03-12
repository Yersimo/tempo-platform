import { db, schema } from '@/lib/db'

/**
 * Seeds a newly created organization with default departments and benefit plan templates.
 * Called during signup to give new orgs useful starting data.
 * Wrapped in try/catch so it never blocks the signup flow if DB fails.
 */
export async function seedNewOrg(orgId: string, industry?: string): Promise<void> {
  try {
    // ----------------------------------------------------------------
    // 1. Default departments
    // ----------------------------------------------------------------
    const baseDepartments = [
      'HR',
      'Engineering',
      'Product',
      'Sales',
      'Marketing',
      'Finance',
      'Operations',
    ]

    const industryLower = (industry || '').toLowerCase()

    // Banking / finance orgs get Compliance and Risk
    if (industryLower === 'banking' || industryLower === 'finance') {
      baseDepartments.push('Compliance', 'Risk')
    }

    // Technology orgs get DevOps and Data Science
    if (industryLower === 'technology' || industryLower === 'tech') {
      baseDepartments.push('DevOps', 'Data Science')
    }

    await db.insert(schema.departments).values(
      baseDepartments.map((name) => ({
        orgId,
        name,
      }))
    )

    // ----------------------------------------------------------------
    // 2. Default benefit plan templates (comprehensive carrier plans)
    // ----------------------------------------------------------------
    await db.insert(schema.benefitPlans).values([
      // Medical Plans
      {
        orgId,
        name: 'Aetna Gold PPO',
        type: 'medical' as const,
        provider: 'Aetna',
        costEmployee: 18500,
        costEmployer: 46500,
        description: 'Large national PPO network, no referrals needed, telehealth included',
        isActive: true,
      },
      {
        orgId,
        name: 'Cigna Silver HMO',
        type: 'medical' as const,
        provider: 'Cigna',
        costEmployee: 14000,
        costEmployer: 36000,
        description: 'Lower premiums, PCP coordination, wellness programs',
        isActive: true,
      },
      {
        orgId,
        name: 'UHC Choice Plus HDHP',
        type: 'medical' as const,
        provider: 'UnitedHealthcare',
        costEmployee: 9500,
        costEmployer: 30500,
        description: 'Lowest premiums, HSA eligible, employer HSA contribution',
        isActive: true,
      },
      {
        orgId,
        name: 'BCBS Platinum PPO',
        type: 'medical' as const,
        provider: 'Blue Cross Blue Shield',
        costEmployee: 24500,
        costEmployer: 60500,
        description: 'Largest network nationwide, lowest out-of-pocket, fertility coverage',
        isActive: true,
      },
      {
        orgId,
        name: 'Kaiser Gold HMO',
        type: 'medical' as const,
        provider: 'Kaiser Permanente',
        costEmployee: 16000,
        costEmployer: 44000,
        description: 'No deductible, integrated care system, pharmacy included',
        isActive: true,
      },
      // Dental
      {
        orgId,
        name: 'Delta Dental PPO Plus',
        type: 'dental' as const,
        provider: 'Delta Dental',
        costEmployee: 1800,
        costEmployer: 3200,
        description: 'Preventive 100% covered, orthodontia 50%, $1,500 annual max',
        isActive: true,
      },
      {
        orgId,
        name: 'Guardian DentalGuard Preferred',
        type: 'dental' as const,
        provider: 'Guardian',
        costEmployee: 1500,
        costEmployer: 2800,
        description: 'Preventive 100% covered, major 60%, $2,000 annual max',
        isActive: true,
      },
      // Vision
      {
        orgId,
        name: 'VSP Choice',
        type: 'vision' as const,
        provider: 'VSP',
        costEmployee: 600,
        costEmployer: 900,
        description: 'Exam every 12 months, $150 frame allowance, laser vision discount',
        isActive: true,
      },
      // Life Insurance
      {
        orgId,
        name: 'MetLife Group Term Life',
        type: 'life' as const,
        provider: 'MetLife',
        costEmployee: 800,
        costEmployer: 1200,
        description: '1x annual salary employer-paid, supplemental up to 5x, AD&D included',
        isActive: true,
      },
      // Disability
      {
        orgId,
        name: 'Lincoln STD + LTD',
        type: 'disability' as const,
        provider: 'Lincoln Financial',
        costEmployee: 1200,
        costEmployer: 1800,
        description: 'STD 60% salary 14-day wait, LTD 60% salary 90-day wait to age 65',
        isActive: true,
      },
    ])
  } catch (error) {
    // Log but never throw -- seeding failures must not block signup
    console.error('[seedNewOrg] Failed to seed org defaults:', error)
  }
}
