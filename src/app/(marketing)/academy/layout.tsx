import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Tempo Academy | Built-in Learning Academies for African Enterprises',
  description:
    'Launch branded learning academies for employees, customers, and partners. Cohort-based learning, automated certificates, gamification, and real-time analytics — all inside your HR platform.',
  openGraph: {
    title: 'Tempo Academy | Built-in Learning Academies for African Enterprises',
    description:
      'Launch branded learning academies with cohort-based learning, automated certificates, and real-time analytics — built into Tempo.',
    type: 'website',
  },
}

export default function AcademyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
