'use client'

import { useState, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { Header } from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { Badge } from '@/components/ui/badge'
import { Tabs } from '@/components/ui/tabs'
import {
  Settings, LayoutGrid, RotateCcw, Eye, EyeOff, GripVertical, CheckCircle2, ArrowRight
} from 'lucide-react'
import { useTempo, useOrgCurrency } from '@/lib/store'
import { formatCurrency } from '@/lib/utils/format-currency'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { isEvaluatorAccount, getEvaluatorConfig } from '@/lib/evaluator-demo-data'
import { HEADER_ICON, BUTTON_ICON } from '@/lib/design-tokens'
import { getAllAppModules } from '@/components/layout/sidebar'
import { EmployeeDashboard } from '@/components/employee-dashboard'
import { OrgTab } from '@/components/dashboard/org-tab'
import { MyOverviewTab } from '@/components/dashboard/my-overview-tab'
import { MyTeamTab } from '@/components/dashboard/my-team-tab'
import { useSortable } from '@/lib/use-drag-drop'
import { AIInsightsCard } from '@/components/ui/ai-insights-card'
import { generateExecutiveSummary, identifyNextBestActions } from '@/lib/ai-engine'
import { buildWorkdayBriefing } from '@/lib/workday-briefing-engine'
import { buildManagerMissionControl } from '@/lib/manager-mission-control-engine'
import { buildEmployeeConciergeBrief } from '@/lib/employee-concierge-engine'
import { buildExecutiveBoardroomPack } from '@/lib/executive-boardroom-engine'

export default function DashboardPage() {
  const {
    currentUser,
    widgetPreferences, updateWidgetPreferences,
    employees, departments, goals, leaveRequests,
    reviews, salaryReviews, surveys, engagementScores,
    expenseReports, jobPostings, applications, payrollRuns, mentoringPairs,
    currentEmployeeId, courses, enrollments, oneOnOnes, timeEntries,
    benefitEnrollments, invoices, budgets, workflows, complianceRequirements,
  } = useTempo()
  const defaultCurrency = useOrgCurrency()

  const executiveSummary = useMemo(() => generateExecutiveSummary({
    employees: employees || [],
    goals: goals || [],
    reviews: reviews || [],
    reviewCycles: [],
    salaryReviews: salaryReviews || [],
    surveys: surveys || [],
    engagementScores: engagementScores || [],
    expenseReports: expenseReports || [],
    leaveRequests: leaveRequests || [],
    jobPostings: jobPostings || [],
    applications: applications || [],
    payrollRuns: payrollRuns || [],
    mentoringPairs: mentoringPairs || [],
  }), [employees, goals, reviews, salaryReviews, surveys, engagementScores, expenseReports, leaveRequests, jobPostings, applications, payrollRuns, mentoringPairs])

  const nextActions = useMemo(() => identifyNextBestActions({
    reviews: reviews || [],
    leaveRequests: leaveRequests || [],
    expenseReports: expenseReports || [],
    salaryReviews: salaryReviews || [],
    goals: goals || [],
    jobPostings: jobPostings || [],
    applications: applications || [],
  }), [reviews, leaveRequests, expenseReports, salaryReviews, goals, jobPostings, applications])

  const currentEmployee = useMemo(
    () => employees?.find((employee: any) => employee.id === currentEmployeeId) || employees?.[0],
    [employees, currentEmployeeId]
  )

  const workdayBriefing = useMemo(() => buildWorkdayBriefing({
    persona: currentUser?.role || 'operator',
    employees: employees || [],
    expenseReports: expenseReports || [],
    payrollRuns: payrollRuns || [],
    learningEnrollments: enrollments || [],
    courses: courses || [],
    goals: goals || [],
    performanceReviews: reviews || [],
    oneOnOnes: oneOnOnes || [],
    complianceRequirements: complianceRequirements || [],
    invoices: invoices || [],
    workflows: workflows || [],
    maxItems: 4,
  }), [currentUser?.role, employees, expenseReports, payrollRuns, enrollments, courses, goals, reviews, oneOnOnes, complianceRequirements, invoices, workflows])

  const managerMission = useMemo(() => buildManagerMissionControl({
    managerId: currentEmployeeId || currentEmployee?.id || '',
    employees: employees || [],
    expenseReports: expenseReports || [],
    timeEntries: timeEntries || [],
    timeOffRequests: leaveRequests || [],
    performanceReviews: reviews || [],
    goals: goals || [],
    learningEnrollments: enrollments || [],
    courses: courses || [],
    oneOnOnes: oneOnOnes || [],
    maxItems: 3,
  }), [currentEmployeeId, currentEmployee?.id, employees, expenseReports, timeEntries, leaveRequests, reviews, goals, enrollments, courses, oneOnOnes])

  const employeeConcierge = useMemo(() => buildEmployeeConciergeBrief({
    employeeId: currentEmployeeId || currentEmployee?.id || '',
    employees: employees || [],
    payrollRuns: payrollRuns || [],
    expenseReports: expenseReports || [],
    learningEnrollments: enrollments || [],
    courses: courses || [],
    benefitEnrollments: benefitEnrollments || [],
    timeOffRequests: leaveRequests || [],
    maxItems: 3,
  }), [currentEmployeeId, currentEmployee?.id, employees, payrollRuns, expenseReports, enrollments, courses, benefitEnrollments, leaveRequests])

  const executiveBoardroom = useMemo(() => buildExecutiveBoardroomPack({
    employees: employees || [],
    budgets: budgets || [],
    invoices: invoices || [],
    expenseReports: expenseReports || [],
    payrollRuns: payrollRuns || [],
    performanceReviews: reviews || [],
    goals: goals || [],
    learningEnrollments: enrollments || [],
    courses: courses || [],
    complianceRequirements: complianceRequirements || [],
    maxSignalsPerSection: 1,
  }), [employees, budgets, invoices, expenseReports, payrollRuns, reviews, goals, enrollments, courses, complianceRequirements])

  const summaryInsights = useMemo(() => [{
    id: 'exec-summary',
    category: 'narrative' as const,
    severity: 'info' as const,
    title: 'Executive Summary',
    description: executiveSummary.summary,
    confidence: 'high' as const,
    confidenceScore: 85,
    module: 'dashboard',
  }], [executiveSummary])

  const router = useRouter()
  const t = useTranslations('dashboard')
  const tc = useTranslations('common')

  const [showWidgetModal, setShowWidgetModal] = useState(false)
  const [dashboardTab, setDashboardTab] = useState('me')
  const [activeBriefingExperiment, setActiveBriefingExperiment] = useState<'operator_priorities' | 'manager_mission' | 'employee_concierge' | 'executive_boardroom'>('operator_priorities')

  // Employee self-service: simplified dashboard for employee role
  const role = currentUser?.role || 'owner'
  if (role === 'employee') {
    return <EmployeeDashboard />
  }

  const firstName = currentUser?.full_name?.split(' ')[0] || 'Amara'

  // Evaluator account detection
  const userEmail = currentUser?.email || ''
  const isEvaluator = isEvaluatorAccount(userEmail)
  const evaluatorConfig = isEvaluator ? getEvaluatorConfig(userEmail) : null

  // Time-of-day greeting (Oracle Fusion-inspired)
  const timeGreeting = (() => {
    const h = new Date().getHours()
    if (h >= 5 && h < 12) return 'greetingMorning'
    if (h >= 12 && h < 17) return 'greetingAfternoon'
    if (h >= 17 && h < 21) return 'greetingEvening'
    return 'greetingNight'
  })()

  // Tab-specific subtitle
  const subtitleKey = dashboardTab === 'me' ? 'subtitleMe' : dashboardTab === 'team' ? 'subtitleTeam' : dashboardTab === 'apps' ? 'subtitleMe' : 'subtitleOrg'

  const dashboardTabs = [
    { id: 'me', label: t('tabMe') },
    { id: 'team', label: t('tabMyTeam') },
    { id: 'apps', label: 'My Apps' },
    { id: 'org', label: t('tabOrganization') },
  ]
  const pendingLeaveCount = leaveRequests?.filter((l: { status: string }) => l.status === 'pending').length || 0
  const pendingExpenseCount = expenseReports?.filter((e: { status: string }) => e.status === 'submitted' || e.status === 'pending_approval').length || 0
  const incompleteReviewCount = reviews?.filter((r: { status: string }) => r.status === 'in_progress' || r.status === 'draft').length || 0
  const atRiskGoalCount = goals?.filter((g: { status: string }) => g.status === 'at_risk' || g.status === 'behind').length || 0
  const latestPayroll = payrollRuns?.[payrollRuns.length - 1]
  const briefingExperiments = [
    {
      id: 'operator_priorities' as const,
      title: 'Operator priorities',
      benchmark: 'AI workday briefing across HR, Finance, and IT',
      metric: `${pendingLeaveCount + pendingExpenseCount + incompleteReviewCount + atRiskGoalCount} item${pendingLeaveCount + pendingExpenseCount + incompleteReviewCount + atRiskGoalCount === 1 ? '' : 's'} needing attention`,
      description: 'Summarize approvals, reviews, goals, expenses, and payroll signals into a single morning queue with clear routes to action.',
      actions: ['Rank urgent work', 'Explain why it matters', 'Route to source module'],
      onOpen: () => setDashboardTab('org'),
    },
    {
      id: 'manager_mission' as const,
      title: 'Manager mission control',
      benchmark: 'Focused team leadership cockpit',
      metric: `${incompleteReviewCount} review${incompleteReviewCount === 1 ? '' : 's'} in progress`,
      description: 'Turn team reviews, goal risk, learning gaps, leave, and expense approvals into a manager-first daily plan.',
      actions: ['Coach at-risk goals', 'Clear team approvals', 'Prepare review follow-up'],
      onOpen: () => setDashboardTab('team'),
    },
    {
      id: 'employee_concierge' as const,
      title: 'Employee concierge',
      benchmark: 'Self-service without hunting through apps',
      metric: `${dashboardTabs.length} dashboard workspace${dashboardTabs.length === 1 ? '' : 's'}`,
      description: 'Give employees one personal surface for payslips, learning, goals, expenses, leave, documents, and support tasks.',
      actions: ['Resume personal tasks', 'Surface benefits and pay', 'Shortcut common requests'],
      onOpen: () => setDashboardTab('me'),
    },
    {
      id: 'executive_boardroom' as const,
      title: 'Executive board room',
      benchmark: 'Board-ready narrative with operational drill-through',
      metric: latestPayroll ? formatCurrency(latestPayroll.total_net, defaultCurrency, { cents: true }) : 'No payroll yet',
      description: 'Package headcount, payroll, engagement, reviews, recruiting, expenses, and risk into a leadership-ready daily narrative.',
      actions: ['Summarize operating health', 'Drill into risk', 'Open executive modules'],
      onOpen: () => setDashboardTab('org'),
    },
  ]
  const selectedBriefingExperiment = briefingExperiments.find(experiment => experiment.id === activeBriefingExperiment) || briefingExperiments[0]
  const selectedEngineSignals = activeBriefingExperiment === 'manager_mission'
    ? managerMission.items.slice(0, 3).map(item => ({ title: item.title, detail: item.safeNextAction, route: item.route, tone: item.severity }))
    : activeBriefingExperiment === 'employee_concierge'
      ? employeeConcierge.items.slice(0, 3).map(item => ({ title: item.title, detail: item.safeNextAction, route: item.route, tone: item.severity }))
      : activeBriefingExperiment === 'executive_boardroom'
        ? executiveBoardroom.topRisks.slice(0, 3).map(item => ({ title: item.title, detail: item.decisionAsk, route: item.drillThroughRoute, tone: item.severity }))
        : workdayBriefing.items.slice(0, 3).map(item => ({ title: item.title, detail: item.safeNextAction, route: item.route, tone: item.severity }))

  return (
    <>
      <Header
        title={t('title')}
        subtitle={`${t(timeGreeting, { name: firstName })} ${t(subtitleKey)}`}
        hideBreadcrumb
        actions={
          <div className="flex items-center gap-2">
            {dashboardTab === 'org' && (
              <Button variant="secondary" size="sm" onClick={() => setShowWidgetModal(true)}><LayoutGrid size={HEADER_ICON} /> {t('customizeWidgets')}</Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => router.push('/settings')}><Settings size={HEADER_ICON} /></Button>
          </div>
        }
      />

      {/* Evaluator Dashboard Banner - dynamic data from store */}
      {isEvaluator && evaluatorConfig && (() => {
        const latestPayroll = payrollRuns?.[payrollRuns.length - 1]
        const payrollCost = latestPayroll ? formatCurrency(latestPayroll.total_net, defaultCurrency, { cents: true }) : formatCurrency(0, defaultCurrency)
        const payrollPeriod = latestPayroll?.period || 'No payroll runs'
        const employeeCount = employees?.length || 0
        const pendingLeaveCount = leaveRequests?.filter((l: { status: string }) => l.status === 'pending').length || 0
        const pendingExpenseCount = expenseReports?.filter((e: { status: string }) => e.status === 'submitted' || e.status === 'pending_approval').length || 0
        const totalPendingApprovals = pendingLeaveCount + pendingExpenseCount
        const countriesSet = new Set((employees || []).map((e: { country?: string }) => e.country).filter(Boolean))
        const countriesList = Array.from(countriesSet).slice(0, 3).join(' \u2022 ')

        return (
          <div className="rounded-2xl border border-border/80 bg-white p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-t1">Welcome, {evaluatorConfig.firstName}</h2>
                <p className="text-sm text-t3 mt-1">Evaluation Environment{countriesList ? ` \u2014 ${countriesList}` : ''}</p>
              </div>
              <Link href="/payroll">
                <Button variant="primary" size="md">Start Payroll Demo &rarr;</Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-gray-50">
                <p className="text-[10px] uppercase tracking-wider text-t3 font-medium">Payroll Cost ({payrollPeriod})</p>
                <p className="text-2xl font-semibold text-t1 mt-1">{payrollCost}</p>
                <p className="text-xs text-t3">{countriesList || 'No employee data'}</p>
              </div>
              <div className="p-4 rounded-xl bg-gray-50">
                <p className="text-[10px] uppercase tracking-wider text-t3 font-medium">Active Employees</p>
                <p className="text-2xl font-semibold text-t1 mt-1">{employeeCount}</p>
                <p className="text-xs text-t3">Across {countriesSet.size} {countriesSet.size === 1 ? 'country' : 'countries'}</p>
              </div>
              <div className="p-4 rounded-xl bg-gray-50">
                <p className="text-[10px] uppercase tracking-wider text-t3 font-medium">Departments</p>
                <p className="text-2xl font-semibold text-t1 mt-1">{departments?.length || 0}</p>
                <p className="text-xs text-t3">Organization structure</p>
              </div>
              <div className="p-4 rounded-xl bg-gray-50">
                <p className="text-[10px] uppercase tracking-wider text-t3 font-medium">Pending Approvals</p>
                <p className="text-2xl font-semibold text-tempo-600 mt-1">{totalPendingApprovals}</p>
                <p className="text-xs text-t3">{totalPendingApprovals === 0 ? 'All clear' : 'Requires attention'}</p>
              </div>
            </div>
          </div>
        )
      })()}

      <section className="mb-6 rounded-[var(--radius-card)] border border-border bg-card shadow-[var(--shadow-card)]">
        <div className="border-b border-border px-5 py-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-tempo-600">AI workday briefing experiment bench</p>
              <h2 className="text-lg font-semibold text-t1">Compare daily operating-system directions</h2>
              <p className="mt-1 max-w-3xl text-sm text-t2">
                Four selectable review-mode concepts for making Tempo summarize what matters today and route users into the right module without becoming decorative.
              </p>
            </div>
            <Badge variant="info">Review mode</Badge>
          </div>
        </div>

        <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(300px,0.9fr)]">
          <div className="grid gap-3 sm:grid-cols-2">
            {briefingExperiments.map((experiment) => (
              <button
                key={experiment.id}
                type="button"
                onClick={() => setActiveBriefingExperiment(experiment.id)}
                className={`rounded-[var(--radius-card)] border p-4 text-left transition hover:border-tempo-300 hover:bg-tempo-50/60 ${
                  activeBriefingExperiment === experiment.id
                    ? 'border-tempo-400 bg-tempo-50 shadow-sm'
                    : 'border-border bg-bg'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-t1">{experiment.title}</h3>
                    <p className="mt-1 text-xs text-t3">{experiment.benchmark}</p>
                  </div>
                  {activeBriefingExperiment === experiment.id && <CheckCircle2 size={16} className="shrink-0 text-tempo-600" />}
                </div>
                <p className="mt-4 text-sm font-medium text-t1">{experiment.metric}</p>
                <p className="mt-1 text-xs leading-5 text-t2">{experiment.description}</p>
              </button>
            ))}
          </div>

          <div className="rounded-[var(--radius-card)] border border-border bg-bg p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-t3">Selected direction</p>
            <h3 className="mt-2 text-lg font-semibold text-t1">{selectedBriefingExperiment.title}</h3>
            <p className="mt-2 text-sm leading-6 text-t2">{selectedBriefingExperiment.description}</p>
            <div className="mt-5 space-y-3">
              {selectedBriefingExperiment.actions.map((action) => (
                <div key={action} className="flex items-center gap-3 rounded-md border border-border bg-card px-3 py-2 text-sm text-t1">
                  <CheckCircle2 size={15} className="shrink-0 text-success" />
                  <span>{action}</span>
                </div>
              ))}
            </div>
            <div className="mt-5 rounded-md border border-border bg-card p-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-t3">Live engine signals</p>
              <div className="mt-3 space-y-2">
                {selectedEngineSignals.length > 0 ? selectedEngineSignals.map(signal => (
                  <button
                    key={`${signal.route}-${signal.title}`}
                    type="button"
                    onClick={() => router.push(signal.route)}
                    className="w-full rounded-md border border-divider bg-bg px-3 py-2 text-left transition hover:border-tempo-300 hover:bg-tempo-50/60"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-semibold text-t1">{signal.title}</span>
                      <Badge variant={signal.tone === 'critical' || signal.tone === 'urgent' ? 'error' : signal.tone === 'high' ? 'warning' : 'info'}>{signal.tone}</Badge>
                    </div>
                    <p className="mt-1 text-xs leading-5 text-t2">{signal.detail}</p>
                  </button>
                )) : (
                  <p className="text-sm text-t2">No routed signals need attention right now.</p>
                )}
              </div>
            </div>
            <Button size="sm" className="mt-5" onClick={selectedBriefingExperiment.onOpen}>
              Open related workspace <ArrowRight size={14} />
            </Button>
          </div>
        </div>
      </section>

      {/* Oracle Fusion-style Me / My Team / Organization tabs */}
      <Tabs
        tabs={dashboardTabs}
        active={dashboardTab}
        onChange={setDashboardTab}
        className="mb-6"
      />

      <AIInsightsCard
        insights={summaryInsights}
        recommendations={nextActions}
        title="Tempo AI — Executive Summary"
        maxVisible={4}
        className="mb-6"
      />

      {/* Tab Content */}
      {dashboardTab === 'me' && <MyOverviewTab />}
      {dashboardTab === 'team' && <MyTeamTab />}
      {dashboardTab === 'apps' && <YourAppsGrid />}
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
  const sortedWidgets = [...(widgetPreferences?.widgets || [])].sort((a, b) => a.position - b.position)

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
        }}><RotateCcw size={BUTTON_ICON} /> {t('resetLayout')}</Button>
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
                <GripVertical size={BUTTON_ICON} />
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
                  {widget.enabled ? <Eye size={BUTTON_ICON} className="text-tempo-600" /> : <EyeOff size={BUTTON_ICON} className="text-t3" />}
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

// Rippling-style "Your Apps" grid
function YourAppsGrid() {
  const allApps = getAllAppModules()
  return (
    <div className="mt-6 mb-6">
      <h2 className="text-lg font-semibold text-t1 mb-3">Your Apps</h2>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-3">
        {allApps.map(app => (
          <Link
            key={app.href}
            href={app.href}
            className="group flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-surface-secondary transition-colors"
          >
            <div className="w-12 h-12 rounded-xl bg-chrome flex items-center justify-center text-tempo-400 group-hover:scale-105 transition-transform">
              {app.icon}
            </div>
            <span className="text-[0.7rem] text-t2 text-center leading-tight font-medium truncate w-full">
              {app.label}
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}

// Helper for cn utility in this file
function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(' ')
}
