/**
 * Ecobank Leave Policy — encoding
 *
 * Captures statutory + ETI top-up leave per country, with composition
 * logic for life events (parental, bereavement, marriage, domestic
 * violence). Built so the J022 "Pregnancy" journey can pass the
 * 4-check rubric: one conversation → composed leave + insurance
 * staging + handover + return-to-work meeting.
 */

export interface CountryLeaveProfile {
  countryCode: string // ISO 3166-1 alpha-2
  countryName: string
  /** Statutory leave types in this country */
  statutory: {
    annualLeaveDays: number
    publicHolidays: number
    maternityWeeks: number
    paternityWeeks: number
    sickLeaveDays: number
    bereavementDays: number
    /** Tenure required to access full statutory entitlement */
    tenureMonthsForFullAccess: number
  }
  /** ETI top-ups on top of statutory */
  etiTopUp: {
    annualLeaveDays: number // additional
    maternityWeeks: number // additional
    paternityWeeks: number // additional
    sickLeaveDays: number
    bereavementDays: number
  }
  /** Statutory regulator + reference */
  authority: string
  statutoryReference: string
}

export interface LifeEventComposition {
  /** Event type — composed across statutory + top-up + practical needs */
  event:
    | 'pregnancy'
    | 'bereavement'
    | 'marriage'
    | 'adoption'
    | 'domestic_violence'
    | 'caregiver'
    | 'medical'
  /** Total days of leave to apply */
  totalLeaveDays: number
  statutoryDays: number
  etiTopUpDays: number
  /** Insurance changes triggered */
  insuranceUpdates: Array<{ change: string; effective: string }>
  /** Tax adjustments to model */
  taxAdjustments: Array<{ adjustment: string; effective: string }>
  /** Handover plan needed */
  requiresHandoverPlan: boolean
  /** OOO message template */
  oooMessage: string | null
  /** Return-to-work conversation auto-scheduled */
  returnToWorkConversationDate: string | null
  /** Privacy override — domestic violence + sensitive events */
  suppressNotifications: boolean
}

// ─── Country profiles (ETI footprint) ────────────────────────────────

export const COUNTRY_LEAVE_PROFILES: Record<string, CountryLeaveProfile> = {
  NG: {
    countryCode: 'NG',
    countryName: 'Nigeria',
    statutory: {
      annualLeaveDays: 6, // Labour Act §18 — minimum 6 days
      publicHolidays: 12,
      maternityWeeks: 12, // Labour Act §54
      paternityWeeks: 0, // No statutory entitlement nationally
      sickLeaveDays: 12,
      bereavementDays: 3,
      tenureMonthsForFullAccess: 12,
    },
    etiTopUp: {
      annualLeaveDays: 18, // ETI gives 24 days total
      maternityWeeks: 14, // ETI gives 26 weeks (paid 16, half-paid 10)
      paternityWeeks: 4,
      sickLeaveDays: 18,
      bereavementDays: 7,
    },
    authority: 'Federal Ministry of Labour and Employment',
    statutoryReference: 'Labour Act §18, §54',
  },
  GH: {
    countryCode: 'GH',
    countryName: 'Ghana',
    statutory: {
      annualLeaveDays: 15, // Labour Act 2003 §20
      publicHolidays: 13,
      maternityWeeks: 12,
      paternityWeeks: 0,
      sickLeaveDays: 12,
      bereavementDays: 3,
      tenureMonthsForFullAccess: 6,
    },
    etiTopUp: {
      annualLeaveDays: 10,
      maternityWeeks: 14,
      paternityWeeks: 4,
      sickLeaveDays: 18,
      bereavementDays: 7,
    },
    authority: 'Labour Department of Ghana',
    statutoryReference: 'Labour Act 2003 (Act 651) §20, §57',
  },
  KE: {
    countryCode: 'KE',
    countryName: 'Kenya',
    statutory: {
      annualLeaveDays: 21,
      publicHolidays: 12,
      maternityWeeks: 13, // Employment Act §29
      paternityWeeks: 2, // Employment Act §29
      sickLeaveDays: 14,
      bereavementDays: 3,
      tenureMonthsForFullAccess: 12,
    },
    etiTopUp: {
      annualLeaveDays: 4,
      maternityWeeks: 13,
      paternityWeeks: 4,
      sickLeaveDays: 16,
      bereavementDays: 7,
    },
    authority: 'Ministry of Labour and Social Protection',
    statutoryReference: 'Employment Act 2007 §28-30',
  },
  CI: {
    countryCode: 'CI',
    countryName: 'Cote d\'Ivoire',
    statutory: {
      annualLeaveDays: 26,
      publicHolidays: 12,
      maternityWeeks: 14,
      paternityWeeks: 0,
      sickLeaveDays: 5,
      bereavementDays: 3,
      tenureMonthsForFullAccess: 12,
    },
    etiTopUp: {
      annualLeaveDays: 4,
      maternityWeeks: 12,
      paternityWeeks: 4,
      sickLeaveDays: 15,
      bereavementDays: 7,
    },
    authority: 'Ministère de l\'Emploi et de la Protection Sociale',
    statutoryReference: 'Code du Travail Art. 25.1, 24.1',
  },
  ZA: {
    countryCode: 'ZA',
    countryName: 'South Africa',
    statutory: {
      annualLeaveDays: 21,
      publicHolidays: 12,
      maternityWeeks: 17,
      paternityWeeks: 10, // Parental leave per BCEA 2018 amendment
      sickLeaveDays: 30, // Over 3-year cycle
      bereavementDays: 3,
      tenureMonthsForFullAccess: 12,
    },
    etiTopUp: {
      annualLeaveDays: 0,
      maternityWeeks: 9,
      paternityWeeks: 0,
      sickLeaveDays: 0,
      bereavementDays: 7,
    },
    authority: 'Department of Employment and Labour',
    statutoryReference: 'Basic Conditions of Employment Act §20, §25-27',
  },
  SN: {
    countryCode: 'SN',
    countryName: 'Senegal',
    statutory: {
      annualLeaveDays: 24,
      publicHolidays: 12,
      maternityWeeks: 14,
      paternityWeeks: 0,
      sickLeaveDays: 5,
      bereavementDays: 3,
      tenureMonthsForFullAccess: 12,
    },
    etiTopUp: {
      annualLeaveDays: 6,
      maternityWeeks: 12,
      paternityWeeks: 4,
      sickLeaveDays: 15,
      bereavementDays: 7,
    },
    authority: 'Ministère du Travail',
    statutoryReference: 'Code du Travail Art. L.143-146',
  },
}

// ─── Life event composition ──────────────────────────────────────────

export function composeLifeEvent(
  event: LifeEventComposition['event'],
  employee: {
    countryCode: string
    tenureMonths: number
    department: string
    hasDependents: boolean
  },
  details: {
    expectedDate?: string // pregnancy/adoption
    eventDate?: string // bereavement/marriage
  },
): LifeEventComposition | null {
  const profile = COUNTRY_LEAVE_PROFILES[employee.countryCode]
  if (!profile) return null

  const oneMonth = 30 * 24 * 60 * 60 * 1000

  switch (event) {
    case 'pregnancy': {
      const statutoryDays = profile.statutory.maternityWeeks * 7
      const topUpDays = profile.etiTopUp.maternityWeeks * 7
      const startDate = details.expectedDate ?? new Date().toISOString()
      const returnDate = new Date(new Date(startDate).getTime() + (statutoryDays + topUpDays) * 86400000)

      return {
        event: 'pregnancy',
        totalLeaveDays: statutoryDays + topUpDays,
        statutoryDays,
        etiTopUpDays: topUpDays,
        insuranceUpdates: [
          { change: 'Add expected dependent to medical insurance', effective: startDate },
          { change: 'Activate prenatal care coverage', effective: 'immediate' },
        ],
        taxAdjustments: [
          { adjustment: 'Update tax dependents count (+1 expected)', effective: 'on birth' },
        ],
        requiresHandoverPlan: true,
        oooMessage: `I'm on maternity leave until ${returnDate.toISOString().slice(0, 10)}. For urgent matters, please contact ${employee.department} team lead.`,
        returnToWorkConversationDate: new Date(returnDate.getTime() - 2 * oneMonth).toISOString(),
        suppressNotifications: false,
      }
    }

    case 'bereavement': {
      const days = profile.statutory.bereavementDays + profile.etiTopUp.bereavementDays
      return {
        event: 'bereavement',
        totalLeaveDays: days,
        statutoryDays: profile.statutory.bereavementDays,
        etiTopUpDays: profile.etiTopUp.bereavementDays,
        insuranceUpdates: [],
        taxAdjustments: [],
        requiresHandoverPlan: days >= 5,
        oooMessage: `I'm on leave for a personal matter and will return in ${days} days.`,
        returnToWorkConversationDate: null,
        suppressNotifications: true, // discretion by default
      }
    }

    case 'domestic_violence': {
      // Safe-leave per local policy where applicable; otherwise compassionate leave
      return {
        event: 'domestic_violence',
        totalLeaveDays: 10,
        statutoryDays: 0,
        etiTopUpDays: 10,
        insuranceUpdates: [],
        taxAdjustments: [],
        requiresHandoverPlan: false,
        oooMessage: null, // employee composes their own if any
        returnToWorkConversationDate: null,
        suppressNotifications: true, // critical privacy
      }
    }

    case 'marriage': {
      return {
        event: 'marriage',
        totalLeaveDays: 5,
        statutoryDays: 0,
        etiTopUpDays: 5,
        insuranceUpdates: [
          { change: 'Update beneficiary designation', effective: 'on event' },
          { change: 'Optional: add spouse to medical insurance (30-day window)', effective: 'event + 30d' },
        ],
        taxAdjustments: [
          { adjustment: 'Marital status update — may affect tax withholding', effective: 'on event' },
        ],
        requiresHandoverPlan: false,
        oooMessage: `On leave for marriage until end of week.`,
        returnToWorkConversationDate: null,
        suppressNotifications: false,
      }
    }

    case 'adoption': {
      const days = (profile.statutory.maternityWeeks + profile.etiTopUp.maternityWeeks) * 7
      return {
        event: 'adoption',
        totalLeaveDays: days,
        statutoryDays: profile.statutory.maternityWeeks * 7,
        etiTopUpDays: profile.etiTopUp.maternityWeeks * 7,
        insuranceUpdates: [
          { change: 'Add adopted dependent to medical insurance', effective: 'on placement' },
        ],
        taxAdjustments: [{ adjustment: 'Update tax dependents count (+1)', effective: 'on placement' }],
        requiresHandoverPlan: true,
        oooMessage: null,
        returnToWorkConversationDate: null,
        suppressNotifications: false,
      }
    }

    case 'caregiver': {
      return {
        event: 'caregiver',
        totalLeaveDays: 10,
        statutoryDays: 0,
        etiTopUpDays: 10,
        insuranceUpdates: [],
        taxAdjustments: [],
        requiresHandoverPlan: false,
        oooMessage: null,
        returnToWorkConversationDate: null,
        suppressNotifications: false,
      }
    }

    case 'medical': {
      return {
        event: 'medical',
        totalLeaveDays: profile.statutory.sickLeaveDays + profile.etiTopUp.sickLeaveDays,
        statutoryDays: profile.statutory.sickLeaveDays,
        etiTopUpDays: profile.etiTopUp.sickLeaveDays,
        insuranceUpdates: [],
        taxAdjustments: [],
        requiresHandoverPlan: false,
        oooMessage: null,
        returnToWorkConversationDate: null,
        suppressNotifications: false,
      }
    }
  }
}
