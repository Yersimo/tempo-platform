// ============================================================
// Integration Framework - Pluggable connector system for Tempo
// ============================================================

export interface IntegrationConnector {
  id: string
  name: string
  description: string
  icon: string // lucide icon name
  category: 'identity' | 'productivity' | 'payroll' | 'communication' | 'storage'
  capabilities: string[]
  configSchema: ConfigField[]
  connect(config: Record<string, string>): Promise<ConnectionResult>
  disconnect(integrationId: string): Promise<void>
  sync(integrationId: string, direction: 'inbound' | 'outbound'): Promise<SyncResult>
  testConnection(config: Record<string, string>): Promise<boolean>
}

export interface ConfigField {
  key: string
  label: string
  type: 'text' | 'password' | 'url' | 'select'
  required: boolean
  placeholder?: string
  options?: { label: string; value: string }[]
}

export interface ConnectionResult {
  success: boolean
  error?: string
  metadata?: Record<string, unknown>
}

export interface SyncResult {
  success: boolean
  recordsProcessed: number
  recordsFailed: number
  errors: string[]
  duration: number
}

// Registry of available connectors
const connectors = new Map<string, IntegrationConnector>()

export function registerConnector(connector: IntegrationConnector) {
  connectors.set(connector.id, connector)
}

export function getConnector(id: string): IntegrationConnector | undefined {
  return connectors.get(id)
}

export function getAllConnectors(): IntegrationConnector[] {
  return Array.from(connectors.values())
}

// Register built-in connectors
import { activeDirectoryConnector } from './active-directory'
import { googleWorkspaceConnector } from './google-workspace'
import { payrollApiConnector } from './payroll-api'
import { bambooHRConnector } from './bamboohr'
import { slackConnector } from './slack'
import { teamsConnector } from './teams'
import { xeroConnector } from './xero'
import { quickBooksConnector } from './quickbooks'
import { linkedInTalentConnector } from './linkedin'
import { sapSuccessFactorsConnector } from './sap-successfactors'
import { workdayConnector } from './workday'
import { adpConnector } from './adp'
import { gustoConnector } from './gusto'
import { deelConnector } from './deel'
import { ripplingConnector } from './rippling'

registerConnector(activeDirectoryConnector)
registerConnector(googleWorkspaceConnector)
registerConnector(payrollApiConnector)
registerConnector(bambooHRConnector)
registerConnector(slackConnector)
registerConnector(teamsConnector)
registerConnector(xeroConnector)
registerConnector(quickBooksConnector)
registerConnector(linkedInTalentConnector)
registerConnector(sapSuccessFactorsConnector)
registerConnector(workdayConnector)
registerConnector(adpConnector)
registerConnector(gustoConnector)
registerConnector(deelConnector)
registerConnector(ripplingConnector)

export type IntegrationStatus = 'available' | 'coming_soon'
export type IntegrationCategory = 'identity' | 'productivity' | 'payroll' | 'communication' | 'storage'

export interface IntegrationCatalogItem {
  id: string
  name: string
  description: string
  icon: string
  category: IntegrationCategory
  capabilities: string[]
  status: IntegrationStatus
}

// Available integrations catalog (for the UI to display)
export const INTEGRATION_CATALOG: IntegrationCatalogItem[] = [
  {
    id: 'active-directory',
    name: 'Active Directory / Azure AD',
    description: 'Sync employees, groups, and organizational units from Active Directory or Azure AD.',
    icon: 'Shield',
    category: 'identity' as const,
    capabilities: ['Employee sync', 'Group sync', 'SSO', 'Auto-provisioning'],
    status: 'available' as const,
  },
  {
    id: 'google-workspace',
    name: 'Google Workspace',
    description: 'Sync users, calendar events, and organizational structure from Google Workspace.',
    icon: 'Mail',
    category: 'productivity' as const,
    capabilities: ['User sync', 'Calendar sync', 'SSO', 'Directory sync'],
    status: 'available' as const,
  },
  {
    id: 'payroll-api',
    name: 'Payroll API (REST)',
    description: 'Connect to external payroll systems via REST API. Supports custom field mapping.',
    icon: 'Banknote',
    category: 'payroll' as const,
    capabilities: ['Payroll sync', 'Tax data', 'Salary export', 'Custom mapping'],
    status: 'available' as const,
  },
  {
    id: 'sap-successfactors',
    name: 'SAP SuccessFactors',
    description: 'Bidirectional sync with SAP SuccessFactors for employee data, payroll, org structure, benefits, time, and learning.',
    icon: 'Building2',
    category: 'payroll' as const,
    capabilities: ['Employee sync', 'Payroll export', 'Org structure', 'Benefits sync', 'Time management', 'Learning sync', 'Performance sync', 'Recruiting sync'],
    status: 'available' as const,
  },
  {
    id: 'workday',
    name: 'Workday',
    description: 'Bidirectional sync with Workday HCM for employees, payroll, org structure, benefits, compensation, and absence management.',
    icon: 'Layers',
    category: 'payroll' as const,
    capabilities: ['Employee sync', 'Payroll export', 'Org structure', 'Benefits sync', 'Compensation sync', 'Recruiting sync', 'Learning sync', 'Absence management'],
    status: 'available' as const,
  },
  {
    id: 'adp',
    name: 'ADP',
    description: 'Sync employees, payroll, tax filing, benefits, time tracking, garnishments, and new hire reporting with ADP.',
    icon: 'DollarSign',
    category: 'payroll' as const,
    capabilities: ['Employee sync', 'Payroll export', 'Tax filing', 'Benefits sync', 'Time management', 'Garnishments', 'New hire reporting', 'Compensation sync'],
    status: 'available' as const,
  },
  {
    id: 'slack',
    name: 'Slack',
    description: 'Send notifications, workflow alerts, and engagement surveys via Slack.',
    icon: 'MessageSquare',
    category: 'communication' as const,
    capabilities: ['Notifications', 'Workflow triggers', 'Survey distribution', 'Channel sync'],
    status: 'available' as const,
  },
  {
    id: 'microsoft-teams',
    name: 'Microsoft Teams',
    description: 'Integrate with Teams for notifications, approvals, and meeting scheduling.',
    icon: 'Video',
    category: 'communication' as const,
    capabilities: ['Notifications', 'Approvals', 'Meeting scheduling', 'Channel messaging'],
    status: 'available' as const,
  },
  {
    id: 'bamboohr',
    name: 'BambooHR',
    description: 'Sync employee records, organizational structure, and time-off data from BambooHR.',
    icon: 'Users',
    category: 'identity' as const,
    capabilities: ['Employee sync', 'Org structure', 'Time-off sync', 'Onboarding data'],
    status: 'available' as const,
  },
  {
    id: 'xero',
    name: 'Xero',
    description: 'Sync payroll data, invoices, expenses, and tax reporting from Xero.',
    icon: 'Receipt',
    category: 'payroll' as const,
    capabilities: ['Payroll sync', 'Invoice sync', 'Expense tracking', 'Tax reporting'],
    status: 'available' as const,
  },
  {
    id: 'quickbooks',
    name: 'QuickBooks',
    description: 'Sync payroll data, employee records, and financial reports from QuickBooks.',
    icon: 'Calculator',
    category: 'payroll' as const,
    capabilities: ['Payroll sync', 'Employee export', 'Financial reporting', 'Tax data'],
    status: 'available' as const,
  },
  {
    id: 'linkedin-talent',
    name: 'LinkedIn Talent',
    description: 'Post jobs, sync candidates, manage talent pipeline, and view recruiting analytics from LinkedIn.',
    icon: 'Linkedin',
    category: 'productivity' as const,
    capabilities: ['Job posting', 'Candidate sync', 'Talent pipeline', 'Analytics'],
    status: 'available' as const,
  },
  {
    id: 'gusto',
    name: 'Gusto',
    description: 'Sync employees, payroll runs, and departments from Gusto.',
    icon: 'DollarSign',
    category: 'payroll' as const,
    capabilities: ['Employee sync', 'Payroll sync', 'Department sync', 'Onboarding data'],
    status: 'available' as const,
  },
  {
    id: 'deel',
    name: 'Deel',
    description: 'Sync employees, contractors, contracts, and invoices from Deel. Supports multi-currency.',
    icon: 'Globe',
    category: 'payroll' as const,
    capabilities: ['Employee sync', 'Contractor sync', 'Contract management', 'Invoice sync', 'Multi-currency'],
    status: 'available' as const,
  },
  {
    id: 'rippling',
    name: 'Rippling',
    description: 'Sync employees, departments, and payroll data from Rippling.',
    icon: 'Layers',
    category: 'payroll' as const,
    capabilities: ['Employee sync', 'Department sync', 'Payroll sync', 'Contractor sync'],
    status: 'available' as const,
  },
]
