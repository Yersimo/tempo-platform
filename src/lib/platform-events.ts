/**
 * Platform Event Cascade Definitions
 * ------------------------------------
 * Each platform event defines a label, icon, color theme, and an ordered list
 * of downstream actions that fire in sequence when the event is triggered.
 * The UI renders these as a live cascade panel so users can SEE integrations
 * happening in real-time across modules.
 */

export interface CascadeAction {
  id: string
  label: string
  module: string
  /** Stagger delay in ms from event start */
  delay: number
}

export interface PlatformEventDef {
  label: string
  icon: string
  color: 'green' | 'red' | 'blue' | 'amber' | 'orange' | 'purple'
  actions: CascadeAction[]
}

export type PlatformEventKey = keyof typeof PLATFORM_EVENTS

export const PLATFORM_EVENTS = {
  EMPLOYEE_HIRED: {
    label: 'New Employee Hired',
    icon: 'UserPlus',
    color: 'green',
    actions: [
      { id: 'hris', label: 'HRIS record created', module: 'People', delay: 200 },
      { id: 'journey', label: 'Onboarding journey assigned', module: 'Journeys', delay: 400 },
      { id: 'sso', label: 'SSO access provisioned via SCIM', module: 'Identity', delay: 600 },
      { id: 'device', label: 'Device order created', module: 'Devices', delay: 800 },
      { id: 'learning', label: 'Mandatory courses enrolled', module: 'Learning', delay: 1000 },
      { id: 'mentor', label: 'Buddy mentor matched', module: 'Mentoring', delay: 1200 },
      { id: 'email', label: 'Welcome email sent', module: 'Email', delay: 1400 },
      { id: 'moment', label: 'New hire moment created', module: 'Moments', delay: 1600 },
      { id: 'orgchart', label: 'Org chart updated', module: 'Org Chart', delay: 1800 },
    ],
  },
  EMPLOYEE_TERMINATED: {
    label: 'Employee Offboarded',
    icon: 'UserMinus',
    color: 'red',
    actions: [
      { id: 'offboard', label: 'Offboarding checklist generated', module: 'Offboarding', delay: 200 },
      { id: 'sso', label: 'All SSO access revoked', module: 'Identity', delay: 400 },
      { id: 'device', label: 'Device return initiated', module: 'Devices', delay: 600 },
      { id: 'journey', label: 'Knowledge transfer assigned', module: 'Journeys', delay: 800 },
      { id: 'cobra', label: 'COBRA notice triggered', module: 'Benefits', delay: 1000 },
      { id: 'payroll', label: 'Final pay calculated', module: 'Payroll', delay: 1200 },
      { id: 'survey', label: 'Exit survey sent', module: 'Engagement', delay: 1400 },
      { id: 'marketplace', label: 'Role posted internally', module: 'Talent Marketplace', delay: 1600 },
      { id: 'succession', label: 'Succession bench updated', module: 'Succession', delay: 1800 },
    ],
  },
  EMPLOYEE_PROMOTED: {
    label: 'Employee Promoted',
    icon: 'TrendingUp',
    color: 'blue',
    actions: [
      { id: 'hris', label: 'Role & level updated', module: 'People', delay: 200 },
      { id: 'comp', label: 'Comp band adjusted', module: 'Compensation', delay: 400 },
      { id: 'learning', label: 'Learning path updated', module: 'Learning', delay: 600 },
      { id: 'goals', label: 'Performance goals elevated', module: 'Performance', delay: 800 },
      { id: 'permissions', label: 'Access permissions updated', module: 'Identity', delay: 1000 },
      { id: 'moment', label: 'Promotion celebration posted', module: 'Moments', delay: 1200 },
      { id: 'succession', label: 'Succession plans updated', module: 'Succession', delay: 1400 },
      { id: 'orgchart', label: 'Org chart restructured', module: 'Org Chart', delay: 1600 },
    ],
  },
  PAYROLL_COMPLETED: {
    label: 'Payroll Run Completed',
    icon: 'DollarSign',
    color: 'green',
    actions: [
      { id: 'gl', label: 'GL journal entries posted', module: 'General Ledger', delay: 200 },
      { id: 'payslips', label: 'Pay slips generated', module: 'Payslips', delay: 400 },
      { id: 'bank', label: 'Bank payment file created', module: 'Bank Feeds', delay: 600 },
      { id: 'tax', label: 'Tax filings updated', module: 'Compliance', delay: 800 },
      { id: 'budget', label: 'Budget actuals updated', module: 'Budgets', delay: 1000 },
      { id: 'chat', label: 'Finance channel notified', module: 'Chat', delay: 1200 },
    ],
  },
  PERFORMANCE_REVIEW_COMPLETED: {
    label: 'Performance Review Completed',
    icon: 'Star',
    color: 'amber',
    actions: [
      { id: 'comp', label: 'Compensation review triggered', module: 'Compensation', delay: 200 },
      { id: 'succession', label: 'Talent review updated', module: 'Succession', delay: 400 },
      { id: 'skills', label: 'Skills assessment refreshed', module: 'Skills', delay: 600 },
      { id: 'learning', label: 'Development plan generated', module: 'Learning', delay: 800 },
      { id: 'manager', label: 'Manager coaching nudge sent', module: 'Performance', delay: 1000 },
    ],
  },
  EXPENSE_SUBMITTED: {
    label: 'Expense Report Submitted',
    icon: 'Receipt',
    color: 'orange',
    actions: [
      { id: 'policy', label: 'Policy compliance checked', module: 'Expenses', delay: 200 },
      { id: 'card', label: 'Card transactions matched', module: 'Corporate Cards', delay: 400 },
      { id: 'approval', label: 'Manager approval requested', module: 'Approvals', delay: 600 },
      { id: 'budget', label: 'Department budget updated', module: 'Budgets', delay: 800 },
    ],
  },
  COUNTRY_EXPANSION: {
    label: 'New Country Activated',
    icon: 'Globe',
    color: 'purple',
    actions: [
      { id: 'eor', label: 'EOR entity configured', module: 'Global Workforce', delay: 200 },
      { id: 'compliance', label: 'Compliance requirements loaded', module: 'Compliance', delay: 400 },
      { id: 'payroll', label: 'Local payroll configured', module: 'Payroll', delay: 600 },
      { id: 'benefits', label: 'Statutory benefits mapped', module: 'Benefits', delay: 800 },
      { id: 'bank', label: 'Local bank account connected', module: 'Bank Feeds', delay: 1000 },
      { id: 'tax', label: 'Tax forms registered', module: 'Compliance', delay: 1200 },
      { id: 'currency', label: 'FX rates configured', module: 'Global Spend', delay: 1400 },
    ],
  },
} as const satisfies Record<string, PlatformEventDef>
