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

registerConnector(activeDirectoryConnector)
registerConnector(googleWorkspaceConnector)
registerConnector(payrollApiConnector)
registerConnector(bambooHRConnector)
registerConnector(slackConnector)
registerConnector(teamsConnector)
registerConnector(xeroConnector)
registerConnector(quickBooksConnector)
registerConnector(linkedInTalentConnector)

// Available integrations catalog (for the UI to display)
export const INTEGRATION_CATALOG = [
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
    id: 'sap-hr',
    name: 'SAP SuccessFactors',
    description: 'Bidirectional sync with SAP SuccessFactors HCM for enterprise HR data.',
    icon: 'Building2',
    category: 'identity' as const,
    capabilities: ['Employee sync', 'Org structure', 'Compensation data', 'Time tracking'],
    status: 'coming_soon' as const,
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
] as const

export type IntegrationCatalogItem = (typeof INTEGRATION_CATALOG)[number]
export type IntegrationStatus = 'available' | 'coming_soon'
export type IntegrationCategory = IntegrationCatalogItem['category']
