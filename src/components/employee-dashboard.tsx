'use client'

import { useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { useTempo } from '@/lib/store'
import { Header } from '@/components/layout/header'
import { MyOverviewTab } from '@/components/dashboard/my-overview-tab'
import { CheckCircle, Sparkles, ArrowRight } from 'lucide-react'

export function EmployeeDashboard() {
  const { currentUser, employees, currentEmployeeId } = useTempo()
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

  const currentEmp = employees?.find((e: any) => e.id === currentEmployeeId)
  const isNewEmployee = useMemo(() => {
    if (!currentEmp) return false
    const hireDate = (currentEmp as any).hire_date || (currentEmp as any).created_at
    if (!hireDate) return false
    const daysSinceHire = (Date.now() - new Date(hireDate).getTime()) / 86400000
    return daysSinceHire <= 30
  }, [currentEmp])

  return (
    <div className="space-y-6">
      <Header
        title={t(timeGreeting, { name: firstName })}
        subtitle={t('subtitleMe')}
        hideBreadcrumb
      />
      {isNewEmployee && (
        <div className="mb-6 rounded-[var(--radius-card)] border border-tempo-200 bg-gradient-to-r from-tempo-50 via-white to-purple-50 p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-tempo-500 to-purple-600 flex items-center justify-center shrink-0">
              <Sparkles size={20} className="text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-semibold text-t1">Welcome to the team! 🎉</h3>
              <p className="text-sm text-t2 mt-1">Complete your onboarding tasks to get up to speed quickly.</p>
              <div className="flex gap-3 mt-4">
                <a href="/onboarding" className="inline-flex items-center gap-1.5 text-sm font-medium text-tempo-600 hover:text-tempo-700">
                  View Onboarding Tasks <ArrowRight size={14} />
                </a>
                <a href="/settings" className="inline-flex items-center gap-1.5 text-sm font-medium text-t3 hover:text-t1">
                  Complete Your Profile <ArrowRight size={14} />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
      <MyOverviewTab />
    </div>
  )
}
