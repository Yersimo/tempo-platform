'use client'

import { useTranslations } from 'next-intl'
import { useTempo } from '@/lib/store'
import { Header } from '@/components/layout/header'
import { MyOverviewTab } from '@/components/dashboard/my-overview-tab'

export function EmployeeDashboard() {
  const { currentUser } = useTempo()
  const t = useTranslations('dashboard')

  const firstName = currentUser?.full_name?.split(' ')[0] || 'Employee'

  // Time-of-day greeting (Oracle Fusion-inspired)
  const timeGreeting = (() => {
    const h = new Date().getHours()
    if (h >= 5 && h < 12) return 'greetingMorning'
    if (h >= 12 && h < 17) return 'greetingAfternoon'
    if (h >= 17 && h < 21) return 'greetingEvening'
    return 'greetingNight'
  })()

  return (
    <div className="space-y-6">
      <Header
        title={t(timeGreeting, { name: firstName })}
        subtitle={t('subtitleMe')}
        hideBreadcrumb
      />
      <MyOverviewTab />
    </div>
  )
}
