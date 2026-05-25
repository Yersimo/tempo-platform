/**
 * Demo new joiner profile — Kemi Adesina.
 *
 * The persona Tempo's Day-1 onboarding flow demos against. Production:
 * pulled from `employees` table on first login.
 */

export interface NewJoinerProfile {
  id: string
  fullName: string
  preferredName: string
  title: string
  department: string
  country: string
  city: string
  startDate: string
  managerName: string
  managerSlackHandle: string
  photoUrl: string | null
  email: string
}

export const DEMO_NEW_JOINER: NewJoinerProfile = {
  id: 'emp-new',
  fullName: 'Kemi Adesina',
  preferredName: 'Kemi',
  title: 'Strategy Manager',
  department: 'Strategy',
  country: 'Nigeria',
  city: 'Lagos',
  startDate: new Date().toISOString().slice(0, 10),
  managerName: 'Yemi Okonkwo',
  managerSlackHandle: '@yemi.okonkwo',
  photoUrl: '/images/academy/confident-entrepreneur.png',
  email: 'kemi.adesina@ecobank.com',
}
