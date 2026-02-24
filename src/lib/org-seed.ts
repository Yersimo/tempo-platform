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
    // 2. Default benefit plan templates
    // ----------------------------------------------------------------
    await db.insert(schema.benefitPlans).values([
      {
        orgId,
        name: 'Medical',
        type: 'medical' as const,
        provider: 'Default Medical Provider',
        costEmployee: 15000, // $150.00 / month
        costEmployer: 45000, // $450.00 / month
        isActive: true,
      },
      {
        orgId,
        name: 'Dental',
        type: 'dental' as const,
        provider: 'Default Dental Provider',
        costEmployee: 3500, // $35.00 / month
        costEmployer: 7500, // $75.00 / month
        isActive: true,
      },
      {
        orgId,
        name: 'Vision',
        type: 'vision' as const,
        provider: 'Default Vision Provider',
        costEmployee: 1500, // $15.00 / month
        costEmployer: 3500, // $35.00 / month
        isActive: true,
      },
    ])
  } catch (error) {
    // Log but never throw -- seeding failures must not block signup
    console.error('[seedNewOrg] Failed to seed org defaults:', error)
  }
}
