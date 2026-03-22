/**
 * Cross-Module Notification Configuration
 *
 * Maps platform events to chat channels and message templates.
 * Used by platform-bot.ts to post automated notifications.
 */

// ---- Event Types ----

export type PlatformEventType =
  | 'payroll.completed'
  | 'payroll.approved'
  | 'employee.hired'
  | 'employee.terminated'
  | 'employee.promoted'
  | 'expense.submitted'
  | 'expense.policy_violation'
  | 'leave.approved'
  | 'leave.conflict'
  | 'compliance.alert'
  | 'compliance.deadline'
  | 'security.access_revoked'
  | 'performance.review_completed'
  | 'performance.review_cycle_started'
  | 'budget.threshold_exceeded'
  | 'onboarding.started'
  | 'offboarding.initiated'

export type EventPriority = 'low' | 'normal' | 'high' | 'critical'

export interface PlatformEvent {
  id: string
  type: PlatformEventType
  title: string
  data: Record<string, unknown>
  timestamp: string
  actorId?: string
  actorName?: string
}

export interface NotificationChannelConfig {
  channels: string[]
  icon: string
  titleTemplate: (data: Record<string, unknown>) => string
  template: (data: Record<string, unknown>) => string
  link: string
  priority: EventPriority
  feedIcon: string
}

// ---- Utility: format currency ----
function fmtMoney(amount: unknown, currency?: unknown): string {
  const num = Number(amount) || 0
  const cur = String(currency || 'USD')
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: cur, minimumFractionDigits: 2 }).format(num / 100)
  } catch {
    return `${cur} ${(num / 100).toFixed(2)}`
  }
}

// ---- Channel → Event Mapping ----

export const NOTIFICATION_CHANNELS: Record<PlatformEventType, NotificationChannelConfig> = {
  'payroll.completed': {
    channels: ['finance'],
    icon: '\u26A1',
    feedIcon: '\uD83D\uDCB0',
    titleTemplate: () => 'Payroll Run Completed',
    template: (d) =>
      `${d.period || 'Current'} payroll processed for ${d.employeeCount || 0} employees.\nTotal: ${fmtMoney(d.totalGross, d.currency)} | Net: ${fmtMoney(d.totalNet, d.currency)}`,
    link: '/payroll',
    priority: 'normal',
  },
  'payroll.approved': {
    channels: ['finance'],
    icon: '\u26A1',
    feedIcon: '\u2705',
    titleTemplate: () => 'Payroll Approved',
    template: (d) =>
      `${d.period || 'Current'} payroll has been approved by ${d.approverName || 'management'}.\nProcessing will begin shortly.`,
    link: '/payroll',
    priority: 'normal',
  },
  'employee.hired': {
    channels: ['general', 'hr'],
    icon: '\u26A1',
    feedIcon: '\uD83D\uDC64',
    titleTemplate: (d) => `New Employee: ${d.name || 'New Hire'}`,
    template: (d) =>
      `${d.name || 'A new team member'} has joined as ${d.title || 'Employee'} in ${d.department || 'the organization'}.\nOnboarding journey assigned, SSO provisioned.`,
    link: '/people',
    priority: 'normal',
  },
  'employee.terminated': {
    channels: ['hr'],
    icon: '\u26A1',
    feedIcon: '\uD83D\uDC4B',
    titleTemplate: () => 'Employee Offboarding',
    template: (d) =>
      `${d.name || 'An employee'} is departing the organization.\nLast working date: ${d.lastDate || 'TBD'}. Reason: ${d.reason || 'Not specified'}.`,
    link: '/offboarding',
    priority: 'high',
  },
  'employee.promoted': {
    channels: ['general', 'hr'],
    icon: '\u26A1',
    feedIcon: '\uD83C\uDF1F',
    titleTemplate: (d) => `Promotion: ${d.name || 'Employee'}`,
    template: (d) =>
      `${d.name || 'An employee'} has been promoted to ${d.newTitle || 'a new role'} in ${d.department || 'their department'}.\nEffective: ${d.effectiveDate || 'Immediately'}.`,
    link: '/people',
    priority: 'normal',
  },
  'expense.submitted': {
    channels: ['finance'],
    icon: '\u26A1',
    feedIcon: '\uD83D\uDCCB',
    titleTemplate: () => 'Expense Report Submitted',
    template: (d) =>
      `${d.employeeName || 'An employee'} submitted an expense report: "${d.title || 'Expense Report'}".\nAmount: ${fmtMoney(d.amount, d.currency)} with ${d.itemCount || 0} item(s).`,
    link: '/expense',
    priority: 'low',
  },
  'expense.policy_violation': {
    channels: ['finance'],
    icon: '\u26A1',
    feedIcon: '\u26A0\uFE0F',
    titleTemplate: () => 'Expense Policy Violation',
    template: (d) =>
      `${d.employeeName || 'An employee'} submitted an expense report with ${d.violationCount || 0} policy violation(s).\n${d.details || 'Review required.'}`,
    link: '/expense',
    priority: 'high',
  },
  'leave.approved': {
    channels: ['hr'],
    icon: '\u26A1',
    feedIcon: '\uD83C\uDFD6\uFE0F',
    titleTemplate: () => 'Leave Request Approved',
    template: (d) =>
      `${d.employeeName || 'An employee'}'s ${d.leaveType || 'time off'} request has been approved.\n${d.startDate || ''} to ${d.endDate || ''} (${d.days || 0} day${Number(d.days) !== 1 ? 's' : ''}).`,
    link: '/time-attendance',
    priority: 'low',
  },
  'leave.conflict': {
    channels: ['hr', 'managers'],
    icon: '\u26A1',
    feedIcon: '\u26A0\uFE0F',
    titleTemplate: () => 'Leave Scheduling Conflict',
    template: (d) =>
      `${d.teamName || 'A team'} has ${d.absentPercent || '>30'}% of members scheduled out on ${d.date || 'upcoming dates'}.\n${d.count || 0} employee(s) affected. Review coverage plan.`,
    link: '/time-attendance',
    priority: 'high',
  },
  'compliance.alert': {
    channels: ['compliance', 'hr'],
    icon: '\u26A1',
    feedIcon: '\uD83D\uDEA8',
    titleTemplate: () => 'Compliance Alert',
    template: (d) =>
      `${d.count || 0} compliance issue(s) detected: ${d.summary || 'Review required'}.\nAction required within ${d.deadline || '14'} days to maintain compliance.`,
    link: '/compliance',
    priority: 'critical',
  },
  'compliance.deadline': {
    channels: ['compliance'],
    icon: '\u26A1',
    feedIcon: '\u23F0',
    titleTemplate: () => 'Compliance Deadline Approaching',
    template: (d) =>
      `${d.requirement || 'A compliance requirement'} is due in ${d.daysRemaining || 0} days.\n${d.details || 'Ensure all documentation is submitted on time.'}`,
    link: '/compliance',
    priority: 'high',
  },
  'security.access_revoked': {
    channels: ['it-security'],
    icon: '\u26A1',
    feedIcon: '\uD83D\uDD12',
    titleTemplate: () => 'Security: Access Revoked',
    template: (d) =>
      `Access revoked for ${d.employeeName || 'an employee'}: ${d.resource || 'system access'}.\nReason: ${d.reason || 'Policy enforcement'}. ${d.details || ''}`,
    link: '/identity',
    priority: 'high',
  },
  'performance.review_completed': {
    channels: ['managers'],
    icon: '\u26A1',
    feedIcon: '\u2705',
    titleTemplate: () => 'Performance Review Completed',
    template: (d) =>
      `${d.reviewerName || 'A manager'} completed a performance review for ${d.employeeName || 'an employee'}.\nRating: ${d.rating || 'N/A'}. Cycle: ${d.cycleName || 'Current cycle'}.`,
    link: '/performance',
    priority: 'low',
  },
  'performance.review_cycle_started': {
    channels: ['general', 'managers'],
    icon: '\u26A1',
    feedIcon: '\uD83D\uDCCA',
    titleTemplate: (d) => `Review Cycle: ${d.cycleName || 'New Cycle'}`,
    template: (d) =>
      `${d.cycleName || 'A new performance review cycle'} has started.\n${d.employeeCount || 0} employee(s) included. Deadline: ${d.deadline || 'TBD'}.`,
    link: '/performance',
    priority: 'normal',
  },
  'budget.threshold_exceeded': {
    channels: ['finance'],
    icon: '\u26A1',
    feedIcon: '\uD83D\uDCB8',
    titleTemplate: () => 'Budget Threshold Exceeded',
    template: (d) =>
      `${d.departmentName || 'A department'} has reached ${d.percent || 0}% of its ${d.budgetName || 'allocated'} budget.\nSpent: ${fmtMoney(d.spent, d.currency)} of ${fmtMoney(d.total, d.currency)}.`,
    link: '/finance',
    priority: 'high',
  },
  'onboarding.started': {
    channels: ['hr', 'general'],
    icon: '\u26A1',
    feedIcon: '\uD83C\uDF89',
    titleTemplate: (d) => `Welcome ${d.name || 'New Hire'}!`,
    template: (d) =>
      `${d.name || 'A new team member'} starts onboarding today as ${d.title || 'a new hire'} in ${d.department || 'the team'}.\nBuddy assigned: ${d.buddyName || 'TBD'}.`,
    link: '/onboarding',
    priority: 'normal',
  },
  'offboarding.initiated': {
    channels: ['hr'],
    icon: '\u26A1',
    feedIcon: '\uD83D\uDCE4',
    titleTemplate: () => 'Offboarding Initiated',
    template: (d) =>
      `Offboarding process initiated for ${d.name || 'an employee'}.\nLast working date: ${d.lastDate || 'TBD'}. Reason: ${d.reason || 'Not specified'}.`,
    link: '/offboarding',
    priority: 'high',
  },
}

// ---- Helper: Get all channels that a given event type posts to ----
export function getChannelsForEvent(eventType: PlatformEventType): string[] {
  return NOTIFICATION_CHANNELS[eventType]?.channels ?? []
}

// ---- Helper: Get event config ----
export function getEventConfig(eventType: PlatformEventType): NotificationChannelConfig | undefined {
  return NOTIFICATION_CHANNELS[eventType]
}

// ---- All known bot channel names (used for auto-creation) ----
export const BOT_CHANNEL_NAMES = [
  'finance', 'general', 'hr', 'managers', 'compliance', 'it-security',
] as const
