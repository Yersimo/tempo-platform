'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Header } from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { Badge } from '@/components/ui/badge'
import { Tabs } from '@/components/ui/tabs'
import {
  Settings, LayoutGrid, RotateCcw, Eye, EyeOff, GripVertical
} from 'lucide-react'
import { useTempo } from '@/lib/store'
import { useRouter } from 'next/navigation'
import { EmployeeDashboard } from '@/components/employee-dashboard'
import { OrgTab } from '@/components/dashboard/org-tab'
import { MyOverviewTab } from '@/components/dashboard/my-overview-tab'
import { MyTeamTab } from '@/components/dashboard/my-team-tab'
import { useSortable } from '@/lib/use-drag-drop'

export default function DashboardPage() {
  const {
    currentUser,
    widgetPreferences, updateWidgetPreferences,
  } = useTempo()

  const router = useRouter()
  const t = useTranslations('dashboard')
  const tc = useTranslations('common')

  const [showWidgetModal, setShowWidgetModal] = useState(false)
  const [dashboardTab, setDashboardTab] = useState('me')

  // Employee self-service: simplified dashboard for employee role
  const role = currentUser?.role || 'owner'
  if (role === 'employee') {
    return <EmployeeDashboard />
  }

  const firstName = currentUser?.full_name?.split(' ')[0] || 'Amara'

  // Time-of-day greeting (Oracle Fusion-inspired)
  const timeGreeting = (() => {
    const h = new Date().getHours()
    if (h >= 5 && h < 12) return 'greetingMorning'
    if (h >= 12 && h < 17) return 'greetingAfternoon'
    if (h >= 17 && h < 21) return 'greetingEvening'
    return 'greetingNight'
  })()

  // Tab-specific subtitle
  const subtitleKey = dashboardTab === 'me' ? 'subtitleMe' : dashboardTab === 'team' ? 'subtitleTeam' : 'subtitleOrg'

  const dashboardTabs = [
    { id: 'me', label: t('tabMe') },
    { id: 'team', label: t('tabMyTeam') },
    { id: 'org', label: t('tabOrganization') },
  ]

  return (
    <>
      <Header
        title={t('title')}
        subtitle={`${t(timeGreeting, { name: firstName })} ${t(subtitleKey)}`}
        hideBreadcrumb
        actions={
          <div className="flex items-center gap-2">
            {dashboardTab === 'org' && (
              <Button variant="secondary" size="sm" onClick={() => setShowWidgetModal(true)}><LayoutGrid size={14} /> {t('customizeWidgets')}</Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => router.push('/settings')}><Settings size={14} /></Button>
          </div>
        }
      />

      {/* Oracle Fusion-style Me / My Team / Organization tabs */}
      <Tabs
        tabs={dashboardTabs}
        active={dashboardTab}
        onChange={setDashboardTab}
        className="mb-6"
      />

      {/* Tab Content */}
      {dashboardTab === 'me' && <MyOverviewTab />}
      {dashboardTab === 'team' && <MyTeamTab />}
      {dashboardTab === 'org' && <OrgTab />}

      {/* Widget Customization Modal */}
      {showWidgetModal && (
        <WidgetCustomizationModal
          open={showWidgetModal}
          onClose={() => setShowWidgetModal(false)}
          widgetPreferences={widgetPreferences}
          updateWidgetPreferences={updateWidgetPreferences}
          t={t}
          tc={tc}
        />
      )}
    </>
  )
}

// Extracted widget modal with drag-drop reordering
function WidgetCustomizationModal({
  open, onClose, widgetPreferences, updateWidgetPreferences, t, tc
}: {
  open: boolean
  onClose: () => void
  widgetPreferences: ReturnType<typeof useTempo>['widgetPreferences']
  updateWidgetPreferences: ReturnType<typeof useTempo>['updateWidgetPreferences']
  t: ReturnType<typeof useTranslations>
  tc: ReturnType<typeof useTranslations>
}) {
  const sortedWidgets = [...widgetPreferences.widgets].sort((a, b) => a.position - b.position)

  const { getItemHandlers, dragIndex, overIndex } = useSortable({
    items: sortedWidgets,
    type: 'widget',
    onReorder: (fromIndex, toIndex) => {
      const reordered = [...sortedWidgets]
      const [moved] = reordered.splice(fromIndex, 1)
      reordered.splice(toIndex, 0, moved)
      const updated = reordered.map((w, i) => ({ ...w, position: i }))
      updateWidgetPreferences({ widgets: updated })
    },
  })

  return (
    <Modal open={open} onClose={onClose} title={t('widgetCustomization')} size="lg">
      <p className="text-xs text-t3 mb-4">{t('widgetToggle')}</p>
      <div className="flex items-center justify-between mb-4">
        <Badge variant="info">{t('widgetsEnabled', { count: widgetPreferences.widgets.filter(w => w.enabled).length })}</Badge>
        <Button variant="ghost" size="sm" onClick={() => {
          const reset = widgetPreferences.widgets.map((w, i) => ({ ...w, enabled: i < 11, position: i }))
          updateWidgetPreferences({ widgets: reset })
        }}><RotateCcw size={14} /> {t('resetLayout')}</Button>
      </div>

      <div className="space-y-1.5">
        {sortedWidgets.map((widget, index) => {
          const handlers = getItemHandlers(index)
          return (
            <div
              key={widget.id}
              {...handlers}
              className={cn(
                'flex items-center gap-2 p-3 rounded-lg border transition-all',
                widget.enabled ? 'bg-tempo-50/50 border-tempo-200' : 'bg-surface-secondary border-divider',
                dragIndex === index && 'opacity-40',
                overIndex === index && dragIndex !== index && 'border-tempo-500 ring-1 ring-tempo-500/30'
              )}
            >
              <div className="cursor-grab active:cursor-grabbing text-t3 hover:text-t2 flex-shrink-0">
                <GripVertical size={14} />
              </div>
              <div
                className="flex items-center justify-between flex-1 cursor-pointer"
                onClick={() => {
                  const updated = widgetPreferences.widgets.map(w =>
                    w.id === widget.id ? { ...w, enabled: !w.enabled } : w
                  )
                  updateWidgetPreferences({ widgets: updated })
                }}
              >
                <div className="flex items-center gap-2">
                  {widget.enabled ? <Eye size={14} className="text-tempo-600" /> : <EyeOff size={14} className="text-t3" />}
                  <span className={cn('text-xs', widget.enabled ? 'font-medium text-t1' : 'text-t3')}>{widget.name}</span>
                  <span className="text-[0.6rem] text-t3 bg-canvas px-1.5 py-0.5 rounded">{widget.category}</span>
                </div>
                <div className={cn(
                  'w-8 h-5 rounded-full flex items-center transition-all flex-shrink-0',
                  widget.enabled ? 'bg-tempo-500 justify-end' : 'bg-gray-300 justify-start'
                )}>
                  <div className="w-4 h-4 rounded-full bg-white shadow mx-0.5" />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t border-divider mt-4">
        <Button variant="secondary" onClick={onClose}>{tc('cancel')}</Button>
        <Button onClick={onClose}>{t('saveLayout')}</Button>
      </div>
    </Modal>
  )
}

// Helper for cn utility in this file
function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(' ')
}
