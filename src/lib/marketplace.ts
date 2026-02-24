// App Marketplace Engine
// Browse, install, and manage third-party integrations across the platform

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AppCategory =
  | 'HRIS'
  | 'Payroll'
  | 'Benefits'
  | 'Communication'
  | 'Productivity'
  | 'Security'
  | 'Finance'
  | 'Developer Tools'
  | 'CRM'
  | 'Support'

export type AppPricing = 'free' | 'paid' | 'freemium'

export type AppStatus = 'available' | 'coming_soon' | 'beta'

export type InstallStatus = 'active' | 'paused' | 'error' | 'pending_setup'

export type SyncStatus = 'success' | 'partial' | 'failed' | 'running'

export interface MarketplaceApp {
  id: string
  name: string
  description: string
  longDescription: string
  category: AppCategory
  icon: string
  developer: string
  rating: number
  reviewCount: number
  installCount: number
  pricing: AppPricing
  pricingDetails?: string
  features: string[]
  requiredScopes: string[]
  status: AppStatus
  website: string
  documentationUrl: string
  supportEmail: string
  changelog: ChangelogEntry[]
  setupInstructions: string[]
  screenshots: string[]
  tags: string[]
}

export interface ChangelogEntry {
  version: string
  date: string
  changes: string[]
}

export interface InstalledApp {
  orgId: string
  appId: string
  installedAt: string
  installedBy: string
  status: InstallStatus
  config: Record<string, unknown>
  lastSyncAt: string | null
  version: string
}

export interface AppReview {
  id: string
  orgId: string
  appId: string
  rating: number
  title: string
  body: string
  authorName: string
  createdAt: string
  helpful: number
}

export interface SyncRecord {
  id: string
  orgId: string
  appId: string
  status: SyncStatus
  startedAt: string
  completedAt: string | null
  recordsSynced: number
  errors: string[]
}

export interface AppFilters {
  category?: AppCategory
  pricing?: AppPricing
  status?: AppStatus
  search?: string
  tags?: string[]
  minRating?: number
}

// ---------------------------------------------------------------------------
// App Catalog
// ---------------------------------------------------------------------------

export const MARKETPLACE_APPS: MarketplaceApp[] = [
  // -- Communication --
  {
    id: 'slack',
    name: 'Slack',
    description: 'Send notifications, sync employee directories, and automate HR workflows in Slack.',
    longDescription:
      'Connect your HR platform with Slack to keep your team informed. Automatically notify channels about new hires, birthdays, anniversaries, and policy changes. Sync your employee directory so team members can look up colleagues instantly. Trigger approval workflows for time-off requests, expense reports, and more, all without leaving Slack.',
    category: 'Communication',
    icon: '💬',
    developer: 'Salesforce',
    rating: 4.8,
    reviewCount: 1243,
    installCount: 18400,
    pricing: 'free',
    features: [
      'Real-time HR notifications in channels',
      'Employee directory sync',
      'Time-off request approvals via Slack',
      'Onboarding task reminders',
      'Custom workflow triggers',
      'Slash commands for quick lookups',
    ],
    requiredScopes: ['employees:read', 'notifications:write', 'workflows:execute'],
    status: 'available',
    website: 'https://slack.com',
    documentationUrl: 'https://api.slack.com/docs',
    supportEmail: 'support@slack.com',
    changelog: [
      { version: '3.2.0', date: '2025-12-01', changes: ['Added thread-based approval flows', 'Improved directory sync performance'] },
      { version: '3.1.0', date: '2025-09-15', changes: ['New slash commands for PTO balance', 'Bug fixes for notification delivery'] },
    ],
    setupInstructions: [
      'Connect your Slack workspace by clicking "Add to Slack"',
      'Select the channels for HR notifications',
      'Configure which events trigger messages',
      'Map employee profiles to Slack users',
      'Test the integration with a sample notification',
    ],
    screenshots: ['/integrations/slack-notifications.png', '/integrations/slack-directory.png'],
    tags: ['messaging', 'notifications', 'collaboration', 'workflows'],
  },
  {
    id: 'zoom',
    name: 'Zoom',
    description: 'Schedule and manage video meetings for interviews, onboarding sessions, and team standups.',
    longDescription:
      'Integrate Zoom with your HR platform to streamline video communication. Automatically generate meeting links for interview scheduling, onboarding sessions, and 1-on-1s. Sync meeting recordings for training libraries and compliance. Track meeting attendance for engagement analytics.',
    category: 'Communication',
    icon: '📹',
    developer: 'Zoom Video Communications',
    rating: 4.5,
    reviewCount: 876,
    installCount: 12300,
    pricing: 'freemium',
    pricingDetails: 'Free for basic meetings; $14.99/mo for cloud recording sync',
    features: [
      'Auto-generate meeting links for interviews',
      'Onboarding session scheduling',
      'Recording sync to training library',
      'Meeting attendance tracking',
      'Calendar integration',
      'Waiting room management',
    ],
    requiredScopes: ['calendar:read', 'calendar:write', 'employees:read'],
    status: 'available',
    website: 'https://zoom.us',
    documentationUrl: 'https://developers.zoom.us/docs',
    supportEmail: 'support@zoom.us',
    changelog: [
      { version: '2.8.0', date: '2025-11-20', changes: ['AI meeting summaries', 'Improved calendar sync reliability'] },
    ],
    setupInstructions: [
      'Sign in with your Zoom admin account',
      'Grant calendar and meeting permissions',
      'Configure default meeting settings',
      'Link Zoom rooms to office locations',
    ],
    screenshots: ['/integrations/zoom-scheduling.png'],
    tags: ['video', 'meetings', 'interviews', 'communication'],
  },
  {
    id: 'microsoft-365',
    name: 'Microsoft 365',
    description: 'Sync employees with Azure AD, manage licenses, and integrate with Outlook and Teams.',
    longDescription:
      'Unify your Microsoft 365 environment with your HR platform. Automatically provision and deprovision user accounts in Azure AD when employees join or leave. Manage Microsoft 365 license assignments based on department and role. Sync calendars with Outlook and enable Teams-based notifications and approvals.',
    category: 'Productivity',
    icon: '🟦',
    developer: 'Microsoft',
    rating: 4.6,
    reviewCount: 1580,
    installCount: 22100,
    pricing: 'free',
    features: [
      'Azure AD user provisioning & deprovisioning',
      'License management by role and department',
      'Outlook calendar sync',
      'Teams notifications for HR events',
      'SharePoint document integration',
      'Single sign-on via Entra ID',
    ],
    requiredScopes: ['employees:read', 'directory:write', 'sso:configure'],
    status: 'available',
    website: 'https://www.microsoft.com/microsoft-365',
    documentationUrl: 'https://learn.microsoft.com/graph/api',
    supportEmail: 'support@microsoft.com',
    changelog: [
      { version: '4.1.0', date: '2026-01-10', changes: ['Entra ID conditional access policies', 'Teams approval workflows'] },
      { version: '4.0.0', date: '2025-10-05', changes: ['Major overhaul for Graph API v2', 'Improved license assignment rules'] },
    ],
    setupInstructions: [
      'Sign in with your Microsoft 365 admin account',
      'Grant Azure AD directory permissions',
      'Configure user provisioning rules',
      'Set up license assignment policies',
      'Enable Outlook calendar sync',
    ],
    screenshots: ['/integrations/m365-provisioning.png', '/integrations/m365-teams.png'],
    tags: ['microsoft', 'azure', 'email', 'calendar', 'identity'],
  },
  {
    id: 'google-workspace',
    name: 'Google Workspace',
    description: 'Provision Google accounts, sync directories, and integrate with Gmail and Google Calendar.',
    longDescription:
      'Seamlessly connect Google Workspace with your HR operations. Auto-provision and deprovision Google accounts as employees are onboarded or offboarded. Sync your org chart to Google Directory. Integrate with Google Calendar for scheduling and Gmail for automated HR communications.',
    category: 'Productivity',
    icon: '🔵',
    developer: 'Google',
    rating: 4.7,
    reviewCount: 1320,
    installCount: 19800,
    pricing: 'free',
    features: [
      'Google account provisioning & deprovisioning',
      'Directory sync with org chart',
      'Google Calendar integration',
      'Gmail notification templates',
      'Google Groups management',
      'SSO with Google Identity',
    ],
    requiredScopes: ['employees:read', 'directory:write', 'sso:configure', 'calendar:write'],
    status: 'available',
    website: 'https://workspace.google.com',
    documentationUrl: 'https://developers.google.com/workspace',
    supportEmail: 'workspace-support@google.com',
    changelog: [
      { version: '3.5.0', date: '2025-12-15', changes: ['Shared drive auto-creation for new departments', 'Improved org unit mapping'] },
    ],
    setupInstructions: [
      'Authenticate with your Google Workspace super admin',
      'Configure domain and org unit mapping',
      'Set up provisioning rules for new hires',
      'Enable calendar and Gmail integrations',
      'Test with a sandbox user account',
    ],
    screenshots: ['/integrations/gworkspace-provisioning.png', '/integrations/gworkspace-calendar.png'],
    tags: ['google', 'email', 'calendar', 'identity', 'directory'],
  },
  // -- Developer Tools --
  {
    id: 'github',
    name: 'GitHub',
    description: 'Automate repo access, sync teams, and manage developer onboarding/offboarding.',
    longDescription:
      'Streamline developer lifecycle management with GitHub integration. Automatically add new engineering hires to the correct GitHub organization and teams based on their role and department. Revoke access immediately upon offboarding. Sync team structures from your org chart to GitHub Teams. Track seat usage for license optimization.',
    category: 'Developer Tools',
    icon: '🐙',
    developer: 'GitHub, Inc.',
    rating: 4.7,
    reviewCount: 945,
    installCount: 8700,
    pricing: 'free',
    features: [
      'Auto-add new engineers to GitHub org',
      'Team sync from org chart',
      'Immediate access revocation on offboarding',
      'Seat usage tracking and optimization',
      'Repository access policies by role',
      'Audit log integration',
    ],
    requiredScopes: ['employees:read', 'departments:read', 'offboarding:events'],
    status: 'available',
    website: 'https://github.com',
    documentationUrl: 'https://docs.github.com/en/rest',
    supportEmail: 'support@github.com',
    changelog: [
      { version: '2.4.0', date: '2025-11-30', changes: ['Copilot seat management', 'Fine-grained PAT policies'] },
      { version: '2.3.0', date: '2025-08-12', changes: ['GitHub Projects sync', 'Improved team nesting'] },
    ],
    setupInstructions: [
      'Install the GitHub App in your organization',
      'Map departments to GitHub Teams',
      'Configure default repository permissions by role',
      'Set up offboarding automation rules',
      'Review and confirm initial team sync',
    ],
    screenshots: ['/integrations/github-teams.png', '/integrations/github-audit.png'],
    tags: ['git', 'source control', 'developer', 'engineering'],
  },
  {
    id: 'jira',
    name: 'Jira',
    description: 'Create onboarding tasks, sync projects with departments, and track engineering velocity.',
    longDescription:
      'Bridge HR operations with project management through Jira integration. Automatically create onboarding task boards for new hires with department-specific checklists. Sync department structures with Jira projects for accurate reporting. Use HR data to enrich engineering velocity metrics and workforce planning.',
    category: 'Developer Tools',
    icon: '📋',
    developer: 'Atlassian',
    rating: 4.4,
    reviewCount: 1102,
    installCount: 14200,
    pricing: 'free',
    features: [
      'Auto-create onboarding boards for new hires',
      'Department-to-project mapping',
      'Offboarding task automation',
      'Workforce planning metrics',
      'Custom field sync with employee data',
      'Sprint capacity from PTO data',
    ],
    requiredScopes: ['employees:read', 'departments:read', 'time-off:read'],
    status: 'available',
    website: 'https://www.atlassian.com/software/jira',
    documentationUrl: 'https://developer.atlassian.com/cloud/jira/platform/rest/v3',
    supportEmail: 'support@atlassian.com',
    changelog: [
      { version: '3.0.0', date: '2025-10-01', changes: ['Jira Service Management support', 'Automation rule templates'] },
    ],
    setupInstructions: [
      'Connect your Atlassian Cloud instance',
      'Select Jira projects for integration',
      'Configure onboarding board templates',
      'Map employee fields to Jira custom fields',
      'Enable PTO-to-capacity sync',
    ],
    screenshots: ['/integrations/jira-onboarding.png'],
    tags: ['project management', 'agile', 'engineering', 'tasks'],
  },
  {
    id: 'linear',
    name: 'Linear',
    description: 'Sync teams, automate onboarding issues, and integrate workforce data with project tracking.',
    longDescription:
      'Connect Linear with your HR platform for seamless engineering team management. Automatically create onboarding issues when new engineers join and archive workspace access when they leave. Sync team structures and use PTO data for more accurate sprint planning.',
    category: 'Developer Tools',
    icon: '⚡',
    developer: 'Linear',
    rating: 4.8,
    reviewCount: 412,
    installCount: 3200,
    pricing: 'free',
    features: [
      'Team sync from org chart',
      'Onboarding issue templates',
      'Offboarding workspace cleanup',
      'PTO-aware sprint capacity',
      'Cycle analytics with HR data',
    ],
    requiredScopes: ['employees:read', 'departments:read', 'time-off:read'],
    status: 'available',
    website: 'https://linear.app',
    documentationUrl: 'https://developers.linear.app/docs',
    supportEmail: 'support@linear.app',
    changelog: [
      { version: '1.6.0', date: '2025-12-08', changes: ['Initiative-level reporting', 'Triage automation for HR tickets'] },
    ],
    setupInstructions: [
      'Authenticate with your Linear workspace',
      'Map departments to Linear teams',
      'Configure onboarding issue templates',
      'Enable PTO sync for capacity planning',
    ],
    screenshots: ['/integrations/linear-teams.png'],
    tags: ['project management', 'engineering', 'issues', 'sprints'],
  },
  {
    id: 'notion',
    name: 'Notion',
    description: 'Sync employee wikis, automate onboarding pages, and manage shared knowledge bases.',
    longDescription:
      'Leverage Notion as your team knowledge hub with deep HR integration. Auto-generate onboarding pages for new hires with role-specific content. Sync the employee directory into a searchable Notion database. Manage company policies and handbooks with version tracking.',
    category: 'Productivity',
    icon: '📝',
    developer: 'Notion Labs',
    rating: 4.6,
    reviewCount: 678,
    installCount: 9400,
    pricing: 'free',
    features: [
      'Auto-generate onboarding pages',
      'Employee directory database sync',
      'Policy and handbook management',
      'Team wiki templates by department',
      'Org chart visualization',
    ],
    requiredScopes: ['employees:read', 'departments:read', 'documents:write'],
    status: 'available',
    website: 'https://www.notion.so',
    documentationUrl: 'https://developers.notion.com',
    supportEmail: 'team@makenotion.com',
    changelog: [
      { version: '2.2.0', date: '2025-11-10', changes: ['Database relation support', 'Improved rich text sync'] },
    ],
    setupInstructions: [
      'Connect your Notion workspace',
      'Select the parent page for HR content',
      'Configure onboarding page templates',
      'Set up employee directory database',
      'Map department wikis to Notion pages',
    ],
    screenshots: ['/integrations/notion-onboarding.png', '/integrations/notion-directory.png'],
    tags: ['wiki', 'documentation', 'knowledge base', 'onboarding'],
  },
  {
    id: 'figma',
    name: 'Figma',
    description: 'Manage Figma seat licenses and team access based on employee role and department.',
    longDescription:
      'Automate Figma license management with your HR platform. Provision seats for designers on hire and reclaim them on departure. Organize team access based on department structures. Track seat utilization to optimize licensing costs.',
    category: 'Developer Tools',
    icon: '🎨',
    developer: 'Figma, Inc.',
    rating: 4.5,
    reviewCount: 298,
    installCount: 4100,
    pricing: 'freemium',
    pricingDetails: 'Free for seat sync; $5/mo for advanced analytics',
    features: [
      'Auto-provision design seats on hire',
      'Reclaim seats on offboarding',
      'Team access by department',
      'Seat utilization analytics',
      'Project access policies',
    ],
    requiredScopes: ['employees:read', 'departments:read', 'offboarding:events'],
    status: 'available',
    website: 'https://www.figma.com',
    documentationUrl: 'https://www.figma.com/developers/api',
    supportEmail: 'support@figma.com',
    changelog: [
      { version: '1.3.0', date: '2025-10-20', changes: ['Dev Mode seat management', 'Branch-based access controls'] },
    ],
    setupInstructions: [
      'Authenticate with your Figma Organization admin',
      'Map departments to Figma teams',
      'Configure seat assignment rules',
      'Set up offboarding seat reclamation',
    ],
    screenshots: ['/integrations/figma-seats.png'],
    tags: ['design', 'collaboration', 'licenses', 'creative'],
  },
  {
    id: 'datadog',
    name: 'Datadog',
    description: 'Sync on-call schedules with employee data and manage Datadog user provisioning.',
    longDescription:
      'Integrate Datadog with your HR platform for unified observability team management. Automatically provision Datadog accounts for engineering hires and deprovision on exit. Sync on-call schedules with PTO calendars to avoid scheduling conflicts. Manage role-based access to dashboards and monitors.',
    category: 'Developer Tools',
    icon: '🐕',
    developer: 'Datadog, Inc.',
    rating: 4.4,
    reviewCount: 345,
    installCount: 2800,
    pricing: 'free',
    features: [
      'User provisioning and deprovisioning',
      'On-call schedule sync with PTO',
      'Role-based dashboard access',
      'Team-based monitor ownership',
      'License usage tracking',
    ],
    requiredScopes: ['employees:read', 'time-off:read', 'departments:read'],
    status: 'available',
    website: 'https://www.datadoghq.com',
    documentationUrl: 'https://docs.datadoghq.com/api',
    supportEmail: 'support@datadoghq.com',
    changelog: [
      { version: '1.2.0', date: '2025-11-05', changes: ['On-call PTO conflict detection', 'Team topology sync'] },
    ],
    setupInstructions: [
      'Provide your Datadog API and application keys',
      'Configure user provisioning rules',
      'Map teams to Datadog organizations',
      'Enable on-call PTO sync',
    ],
    screenshots: ['/integrations/datadog-oncall.png'],
    tags: ['monitoring', 'observability', 'on-call', 'engineering'],
  },
  {
    id: 'pagerduty',
    name: 'PagerDuty',
    description: 'Sync on-call rotations with employee schedules and automate incident team management.',
    longDescription:
      'Keep PagerDuty in sync with your workforce. Automatically update on-call rotations when employees go on PTO or leave the company. Provision PagerDuty accounts for new hires in on-call eligible roles. Ensure incident response teams always reflect current staffing.',
    category: 'Developer Tools',
    icon: '🚨',
    developer: 'PagerDuty, Inc.',
    rating: 4.3,
    reviewCount: 287,
    installCount: 2400,
    pricing: 'free',
    features: [
      'On-call rotation sync with PTO',
      'Auto-provision accounts for on-call roles',
      'Escalation policy updates on offboarding',
      'Incident team management',
      'Schedule gap detection',
    ],
    requiredScopes: ['employees:read', 'time-off:read', 'offboarding:events'],
    status: 'available',
    website: 'https://www.pagerduty.com',
    documentationUrl: 'https://developer.pagerduty.com/api-reference',
    supportEmail: 'support@pagerduty.com',
    changelog: [
      { version: '1.5.0', date: '2025-09-28', changes: ['AIOps integration for team context', 'Improved schedule gap alerts'] },
    ],
    setupInstructions: [
      'Connect your PagerDuty account with an API key',
      'Map on-call eligible roles',
      'Configure PTO-to-schedule sync rules',
      'Set up offboarding escalation updates',
    ],
    screenshots: ['/integrations/pagerduty-schedule.png'],
    tags: ['incidents', 'on-call', 'alerting', 'engineering'],
  },
  // -- Security --
  {
    id: 'okta',
    name: 'Okta',
    description: 'Automate identity lifecycle, enforce MFA policies, and sync users with Okta Universal Directory.',
    longDescription:
      'Achieve zero-trust identity management by connecting Okta with your HR source of truth. Provision and deprovision Okta accounts automatically through the employee lifecycle. Push group memberships based on department and role. Enforce conditional access and MFA policies. Get a unified view of application access across your organization.',
    category: 'Security',
    icon: '🔐',
    developer: 'Okta, Inc.',
    rating: 4.6,
    reviewCount: 1890,
    installCount: 15600,
    pricing: 'free',
    features: [
      'Automated user provisioning via SCIM',
      'Group push from departments and roles',
      'MFA policy enforcement',
      'Conditional access rules',
      'Application access reporting',
      'Real-time deprovisioning on termination',
    ],
    requiredScopes: ['employees:read', 'departments:read', 'directory:write', 'sso:configure'],
    status: 'available',
    website: 'https://www.okta.com',
    documentationUrl: 'https://developer.okta.com/docs',
    supportEmail: 'support@okta.com',
    changelog: [
      { version: '5.0.0', date: '2026-01-15', changes: ['Identity Governance support', 'Workforce Identity Cloud v2 APIs'] },
      { version: '4.3.0', date: '2025-09-10', changes: ['Adaptive MFA policy sync', 'Device trust integration'] },
    ],
    setupInstructions: [
      'Create an API token in your Okta admin console',
      'Configure SCIM provisioning endpoint',
      'Map user attributes from HR to Okta profile',
      'Set up group push rules for departments',
      'Configure deprovisioning behavior',
      'Test with a pilot group of users',
    ],
    screenshots: ['/integrations/okta-provisioning.png', '/integrations/okta-groups.png'],
    tags: ['identity', 'sso', 'mfa', 'security', 'scim'],
  },
  // -- CRM --
  {
    id: 'salesforce',
    name: 'Salesforce',
    description: 'Sync employee data with Salesforce users, manage CRM licenses, and align sales teams.',
    longDescription:
      'Keep your Salesforce CRM in sync with HR data. Automatically provision Salesforce users when sales reps are hired and reassign accounts when they leave. Sync team hierarchies for accurate reporting. Manage license assignments based on role and department to optimize costs.',
    category: 'CRM',
    icon: '☁️',
    developer: 'Salesforce, Inc.',
    rating: 4.5,
    reviewCount: 1456,
    installCount: 11200,
    pricing: 'free',
    features: [
      'User provisioning and deprovisioning',
      'Sales team hierarchy sync',
      'License management by role',
      'Account reassignment on offboarding',
      'Territory alignment from org data',
      'Permission set management',
    ],
    requiredScopes: ['employees:read', 'departments:read', 'offboarding:events'],
    status: 'available',
    website: 'https://www.salesforce.com',
    documentationUrl: 'https://developer.salesforce.com/docs',
    supportEmail: 'support@salesforce.com',
    changelog: [
      { version: '3.1.0', date: '2025-12-20', changes: ['Einstein AI-powered territory suggestions', 'Improved bulk user sync'] },
    ],
    setupInstructions: [
      'Authenticate with your Salesforce admin account',
      'Configure user provisioning rules',
      'Map roles to Salesforce profiles and permission sets',
      'Set up account reassignment on offboarding',
      'Enable team hierarchy sync',
    ],
    screenshots: ['/integrations/salesforce-users.png', '/integrations/salesforce-teams.png'],
    tags: ['crm', 'sales', 'accounts', 'licenses'],
  },
  // -- Support --
  {
    id: 'zendesk',
    name: 'Zendesk',
    description: 'Provision support agents, sync teams, and route internal HR tickets automatically.',
    longDescription:
      'Integrate Zendesk with your HR platform for unified support operations. Automatically provision agent accounts for support hires. Sync team structures for accurate ticket routing. Create an internal HR help desk where employees can submit requests for benefits, payroll, and IT issues.',
    category: 'Support',
    icon: '🎫',
    developer: 'Zendesk, Inc.',
    rating: 4.4,
    reviewCount: 789,
    installCount: 7600,
    pricing: 'freemium',
    pricingDetails: 'Free for basic sync; $9/mo for HR help desk features',
    features: [
      'Agent provisioning and deprovisioning',
      'Team-based ticket routing',
      'Internal HR help desk',
      'Employee satisfaction surveys',
      'Knowledge base sync',
      'SLA management by priority',
    ],
    requiredScopes: ['employees:read', 'departments:read', 'tickets:write'],
    status: 'available',
    website: 'https://www.zendesk.com',
    documentationUrl: 'https://developer.zendesk.com/api-reference',
    supportEmail: 'support@zendesk.com',
    changelog: [
      { version: '2.7.0', date: '2025-11-25', changes: ['AI-powered ticket categorization', 'Multilingual help desk'] },
    ],
    setupInstructions: [
      'Connect your Zendesk instance with an admin API token',
      'Configure agent provisioning rules',
      'Set up internal HR help desk categories',
      'Map departments to agent groups',
      'Configure ticket routing rules',
    ],
    screenshots: ['/integrations/zendesk-helpdesk.png'],
    tags: ['support', 'tickets', 'help desk', 'customer service'],
  },
  // -- Finance --
  {
    id: 'quickbooks',
    name: 'QuickBooks',
    description: 'Sync payroll data, manage expense reports, and reconcile payments with QuickBooks.',
    longDescription:
      'Bridge payroll and accounting with the QuickBooks integration. Automatically sync payroll runs to your general ledger. Push approved expense reports as bills or journal entries. Reconcile contractor payments and generate financial reports that combine HR and accounting data.',
    category: 'Finance',
    icon: '💰',
    developer: 'Intuit',
    rating: 4.3,
    reviewCount: 1034,
    installCount: 9800,
    pricing: 'free',
    features: [
      'Payroll-to-GL journal entries',
      'Expense report sync as bills',
      'Contractor payment reconciliation',
      'Department cost center mapping',
      'Tax filing data export',
      'Financial reporting integration',
    ],
    requiredScopes: ['payroll:read', 'expenses:read', 'departments:read'],
    status: 'available',
    website: 'https://quickbooks.intuit.com',
    documentationUrl: 'https://developer.intuit.com/app/developer/qbo/docs',
    supportEmail: 'support@intuit.com',
    changelog: [
      { version: '4.0.0', date: '2025-10-15', changes: ['Multi-currency support', 'Automated GL mapping suggestions'] },
    ],
    setupInstructions: [
      'Connect your QuickBooks Online company',
      'Map departments to cost centers and classes',
      'Configure payroll journal entry templates',
      'Set up expense report sync rules',
      'Verify chart of accounts mapping',
    ],
    screenshots: ['/integrations/quickbooks-gl.png', '/integrations/quickbooks-expenses.png'],
    tags: ['accounting', 'payroll', 'expenses', 'finance', 'gl'],
  },
  // -- HRIS --
  {
    id: 'bamboohr',
    name: 'BambooHR',
    description: 'Import employee records, sync time-off balances, and migrate HR data from BambooHR.',
    longDescription:
      'Migrate from or integrate with BambooHR seamlessly. Import employee records, org structures, and historical data. Keep time-off balances in sync across both systems during a transition period. Use BambooHR as a secondary data source for compliance and reporting.',
    category: 'HRIS',
    icon: '🎋',
    developer: 'BambooHR',
    rating: 4.2,
    reviewCount: 567,
    installCount: 4500,
    pricing: 'free',
    features: [
      'Employee data import and sync',
      'Time-off balance sync',
      'Org structure migration',
      'Historical data import',
      'Custom field mapping',
      'Bidirectional sync option',
    ],
    requiredScopes: ['employees:read', 'employees:write', 'time-off:read', 'time-off:write'],
    status: 'available',
    website: 'https://www.bamboohr.com',
    documentationUrl: 'https://documentation.bamboohr.com/docs',
    supportEmail: 'support@bamboohr.com',
    changelog: [
      { version: '2.1.0', date: '2025-11-18', changes: ['Incremental sync support', 'Custom report import'] },
    ],
    setupInstructions: [
      'Generate an API key in your BambooHR account',
      'Configure field mapping between systems',
      'Select sync direction (import, export, or bidirectional)',
      'Run initial data import with preview',
      'Schedule recurring sync intervals',
    ],
    screenshots: ['/integrations/bamboohr-import.png'],
    tags: ['hris', 'migration', 'employee data', 'time-off'],
  },
  {
    id: 'greenhouse',
    name: 'Greenhouse',
    description: 'Sync candidates, automate offer-to-hire workflows, and streamline recruiting pipelines.',
    longDescription:
      'Create a seamless recruiting-to-onboarding pipeline with Greenhouse. Automatically convert accepted offers into employee records. Sync candidate data to eliminate duplicate entry. Push job requisitions from workforce planning and track recruiting metrics alongside HR data.',
    category: 'HRIS',
    icon: '🌱',
    developer: 'Greenhouse Software',
    rating: 4.6,
    reviewCount: 823,
    installCount: 6700,
    pricing: 'free',
    features: [
      'Offer-to-hire automation',
      'Candidate-to-employee data sync',
      'Job requisition push from workforce planning',
      'Interview scheduling integration',
      'Recruiting metrics in HR dashboards',
      'Onboarding trigger on offer acceptance',
    ],
    requiredScopes: ['employees:write', 'recruiting:read', 'recruiting:write', 'onboarding:trigger'],
    status: 'available',
    website: 'https://www.greenhouse.com',
    documentationUrl: 'https://developers.greenhouse.io/harvest.html',
    supportEmail: 'support@greenhouse.io',
    changelog: [
      { version: '3.2.0', date: '2025-12-05', changes: ['Structured hiring scorecard sync', 'DEI analytics integration'] },
    ],
    setupInstructions: [
      'Generate Harvest API credentials in Greenhouse',
      'Configure offer-to-hire field mapping',
      'Set up webhook for offer acceptance events',
      'Connect job requisitions with workforce planning',
      'Test the complete offer-to-onboarding flow',
    ],
    screenshots: ['/integrations/greenhouse-pipeline.png', '/integrations/greenhouse-onboarding.png'],
    tags: ['recruiting', 'ats', 'hiring', 'candidates', 'onboarding'],
  },
  {
    id: 'lever',
    name: 'Lever',
    description: 'Connect recruiting data, automate candidate-to-employee transitions, and sync hiring pipelines.',
    longDescription:
      'Integrate Lever with your HR platform for end-to-end talent management. Automatically create employee records from hired candidates. Sync hiring pipeline data for workforce planning. Push approved headcount to Lever as job postings. Track time-to-hire and cost-per-hire alongside HR metrics.',
    category: 'HRIS',
    icon: '🔧',
    developer: 'Lever (Employ Inc.)',
    rating: 4.4,
    reviewCount: 534,
    installCount: 3900,
    pricing: 'free',
    features: [
      'Candidate-to-employee conversion',
      'Hiring pipeline sync',
      'Headcount-to-job posting automation',
      'Interview panel from employee directory',
      'Recruiting analytics in HR dashboards',
    ],
    requiredScopes: ['employees:write', 'recruiting:read', 'recruiting:write'],
    status: 'available',
    website: 'https://www.lever.co',
    documentationUrl: 'https://hire.lever.co/developer/documentation',
    supportEmail: 'support@lever.co',
    changelog: [
      { version: '2.0.0', date: '2025-10-30', changes: ['Lever Nurture integration', 'Advanced pipeline analytics'] },
    ],
    setupInstructions: [
      'Generate API credentials in Lever Settings',
      'Configure candidate-to-employee field mapping',
      'Set up webhooks for hiring events',
      'Connect headcount planning with job postings',
      'Verify data flow with a test candidate',
    ],
    screenshots: ['/integrations/lever-pipeline.png'],
    tags: ['recruiting', 'ats', 'hiring', 'candidates'],
  },
  // -- Payroll --
  {
    id: 'gusto',
    name: 'Gusto',
    description: 'Sync employee data with Gusto payroll, automate tax filings, and manage benefits enrollment.',
    longDescription:
      'Connect Gusto with your HR platform for unified people operations. Automatically sync new hires to Gusto for payroll setup. Push compensation changes and deductions in real time. Manage benefits enrollment through a single interface. Access consolidated payroll reports alongside HR analytics.',
    category: 'Payroll',
    icon: '💵',
    developer: 'Gusto',
    rating: 4.5,
    reviewCount: 1267,
    installCount: 8900,
    pricing: 'free',
    features: [
      'New hire sync to payroll',
      'Compensation change push',
      'Benefits enrollment sync',
      'Tax filing automation',
      'Payroll report integration',
      'Contractor payment management',
    ],
    requiredScopes: ['employees:read', 'payroll:read', 'payroll:write', 'benefits:read'],
    status: 'available',
    website: 'https://gusto.com',
    documentationUrl: 'https://docs.gusto.com',
    supportEmail: 'support@gusto.com',
    changelog: [
      { version: '3.4.0', date: '2025-12-10', changes: ['International contractor support', 'Embedded payroll components'] },
    ],
    setupInstructions: [
      'Connect your Gusto company account',
      'Map employee fields to Gusto worker profiles',
      'Configure compensation sync rules',
      'Set up benefits enrollment integration',
      'Run a parallel payroll test',
    ],
    screenshots: ['/integrations/gusto-payroll.png', '/integrations/gusto-benefits.png'],
    tags: ['payroll', 'taxes', 'benefits', 'compensation'],
  },
  {
    id: 'deel',
    name: 'Deel',
    description: 'Manage global contractors and EOR employees, sync payments, and ensure international compliance.',
    longDescription:
      'Expand your global workforce with the Deel integration. Manage international contractors and employer-of-record (EOR) employees from your HR platform. Sync contract details, payment schedules, and compliance documents. Automate onboarding for global hires with country-specific requirements.',
    category: 'Payroll',
    icon: '🌍',
    developer: 'Deel',
    rating: 4.6,
    reviewCount: 678,
    installCount: 5400,
    pricing: 'freemium',
    pricingDetails: 'Free for data sync; $49/mo for automated compliance management',
    features: [
      'Global contractor management',
      'EOR employee sync',
      'International payment tracking',
      'Country-specific compliance documents',
      'Contract lifecycle management',
      'Multi-currency payroll reconciliation',
    ],
    requiredScopes: ['employees:read', 'employees:write', 'payroll:read', 'compliance:read'],
    status: 'available',
    website: 'https://www.deel.com',
    documentationUrl: 'https://developer.deel.com',
    supportEmail: 'support@deel.com',
    changelog: [
      { version: '2.5.0', date: '2026-01-20', changes: ['Deel Card expense sync', 'Immigration document tracking'] },
      { version: '2.4.0', date: '2025-10-25', changes: ['EOR termination workflow', 'Enhanced compliance alerts'] },
    ],
    setupInstructions: [
      'Connect your Deel organization via OAuth',
      'Map worker types (contractor, EOR, direct employee)',
      'Configure payment sync settings',
      'Set up compliance document collection',
      'Enable country-specific onboarding flows',
    ],
    screenshots: ['/integrations/deel-workers.png', '/integrations/deel-compliance.png'],
    tags: ['global', 'contractors', 'eor', 'compliance', 'international'],
  },
  // -- Benefits --
  // (using Gusto above also covers benefits; adding a dedicated one)
  {
    id: 'rippling-benefits',
    name: 'Benefits Connector',
    description: 'Sync benefits elections, manage open enrollment, and connect with insurance carriers.',
    longDescription:
      'Unify benefits administration with your HR platform. Sync benefits elections from external brokers and carriers. Manage open enrollment periods with automated reminders and deadline tracking. Generate consolidated benefits cost reports across all carriers.',
    category: 'Benefits',
    icon: '🏥',
    developer: 'Tempo Platform',
    rating: 4.3,
    reviewCount: 312,
    installCount: 2100,
    pricing: 'paid',
    pricingDetails: '$12/employee/month',
    features: [
      'Carrier data sync (medical, dental, vision)',
      'Open enrollment management',
      'Life event processing',
      'COBRA administration',
      'Benefits cost reporting',
      'Employee self-service portal',
    ],
    requiredScopes: ['employees:read', 'benefits:read', 'benefits:write', 'payroll:read'],
    status: 'available',
    website: 'https://tempo-platform.com/benefits',
    documentationUrl: 'https://docs.tempo-platform.com/benefits-connector',
    supportEmail: 'benefits@tempo-platform.com',
    changelog: [
      { version: '1.8.0', date: '2025-12-22', changes: ['HSA/FSA contribution sync', 'Dependent verification workflow'] },
    ],
    setupInstructions: [
      'Connect your insurance carrier feeds',
      'Configure benefits plan mapping',
      'Set up open enrollment calendar',
      'Enable employee self-service benefits portal',
      'Test with a sample enrollment',
    ],
    screenshots: ['/integrations/benefits-enrollment.png'],
    tags: ['benefits', 'insurance', 'enrollment', 'health'],
  },
]

// ---------------------------------------------------------------------------
// In-memory Data Stores
// ---------------------------------------------------------------------------

const installedApps = new Map<string, InstalledApp>() // key: `${orgId}:${appId}`
const appReviews = new Map<string, AppReview[]>() // key: appId
const syncHistory = new Map<string, SyncRecord[]>() // key: `${orgId}:${appId}`

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function compositeKey(orgId: string, appId: string): string {
  return `${orgId}:${appId}`
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function nowISO(): string {
  return new Date().toISOString()
}

// ---------------------------------------------------------------------------
// App Catalog - Browse & Search
// ---------------------------------------------------------------------------

/**
 * Browse or search marketplace apps with optional filters.
 */
export function getMarketplaceApps(filters?: AppFilters): MarketplaceApp[] {
  let apps = [...MARKETPLACE_APPS]

  if (!filters) return apps

  if (filters.category) {
    apps = apps.filter((a) => a.category === filters.category)
  }

  if (filters.pricing) {
    apps = apps.filter((a) => a.pricing === filters.pricing)
  }

  if (filters.status) {
    apps = apps.filter((a) => a.status === filters.status)
  }

  if (filters.minRating !== undefined) {
    apps = apps.filter((a) => a.rating >= filters.minRating!)
  }

  if (filters.tags && filters.tags.length > 0) {
    const filterTags = filters.tags.map((t) => t.toLowerCase())
    apps = apps.filter((a) =>
      a.tags.some((tag) => filterTags.includes(tag.toLowerCase()))
    )
  }

  if (filters.search) {
    const query = filters.search.toLowerCase()
    apps = apps.filter(
      (a) =>
        a.name.toLowerCase().includes(query) ||
        a.description.toLowerCase().includes(query) ||
        a.developer.toLowerCase().includes(query) ||
        a.tags.some((t) => t.toLowerCase().includes(query))
    )
  }

  return apps
}

/**
 * Get detailed information for a single app including setup instructions,
 * permissions, and changelog.
 */
export function getAppDetails(appId: string): MarketplaceApp | null {
  return MARKETPLACE_APPS.find((a) => a.id === appId) ?? null
}

/**
 * Get all available categories with app counts.
 */
export function getCategories(): { category: AppCategory; count: number }[] {
  const counts = new Map<AppCategory, number>()
  for (const app of MARKETPLACE_APPS) {
    counts.set(app.category, (counts.get(app.category) ?? 0) + 1)
  }
  return Array.from(counts.entries())
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)
}

// ---------------------------------------------------------------------------
// App Installation Management
// ---------------------------------------------------------------------------

/**
 * Install a marketplace app for an organization.
 */
export function installApp(
  orgId: string,
  appId: string,
  config?: Record<string, unknown>
): { success: boolean; installation?: InstalledApp; error?: string } {
  const app = MARKETPLACE_APPS.find((a) => a.id === appId)
  if (!app) {
    return { success: false, error: `App "${appId}" not found in the marketplace.` }
  }

  if (app.status === 'coming_soon') {
    return { success: false, error: `App "${app.name}" is not yet available for installation.` }
  }

  const key = compositeKey(orgId, appId)
  if (installedApps.has(key)) {
    return { success: false, error: `App "${app.name}" is already installed for this organization.` }
  }

  const installation: InstalledApp = {
    orgId,
    appId,
    installedAt: nowISO(),
    installedBy: 'system', // would come from auth context in real impl
    status: config ? 'active' : 'pending_setup',
    config: config ?? {},
    lastSyncAt: null,
    version: app.changelog.length > 0 ? app.changelog[0].version : '1.0.0',
  }

  installedApps.set(key, installation)

  // Bump the install count on the catalog entry (in-memory only)
  ;(app as { installCount: number }).installCount += 1

  return { success: true, installation }
}

/**
 * Uninstall a marketplace app for an organization.
 */
export function uninstallApp(
  orgId: string,
  appId: string
): { success: boolean; error?: string } {
  const key = compositeKey(orgId, appId)
  const existing = installedApps.get(key)

  if (!existing) {
    return { success: false, error: `App "${appId}" is not installed for this organization.` }
  }

  installedApps.delete(key)

  // Also clean up sync history
  syncHistory.delete(key)

  return { success: true }
}

/**
 * List all installed apps for an organization, enriched with marketplace info.
 */
export function getInstalledApps(
  orgId: string
): (InstalledApp & { app: MarketplaceApp })[] {
  const results: (InstalledApp & { app: MarketplaceApp })[] = []

  installedApps.forEach((installation, key) => {
    if (key.startsWith(`${orgId}:`)) {
      const app = MARKETPLACE_APPS.find((a) => a.id === installation.appId)
      if (app) {
        results.push({ ...installation, app })
      }
    }
  })

  return results.sort(
    (a, b) => new Date(b.installedAt).getTime() - new Date(a.installedAt).getTime()
  )
}

/**
 * Update the configuration for an installed app.
 */
export function updateAppConfig(
  orgId: string,
  appId: string,
  config: Record<string, unknown>
): { success: boolean; installation?: InstalledApp; error?: string } {
  const key = compositeKey(orgId, appId)
  const existing = installedApps.get(key)

  if (!existing) {
    return { success: false, error: `App "${appId}" is not installed for this organization.` }
  }

  const updated: InstalledApp = {
    ...existing,
    config: { ...existing.config, ...config },
    status: 'active', // move to active once configured
  }

  installedApps.set(key, updated)

  return { success: true, installation: updated }
}

/**
 * Get the installation record for a specific app in an org (or null).
 */
export function getInstallation(orgId: string, appId: string): InstalledApp | null {
  return installedApps.get(compositeKey(orgId, appId)) ?? null
}

// ---------------------------------------------------------------------------
// App Reviews
// ---------------------------------------------------------------------------

/**
 * Submit a review for a marketplace app.
 */
export function submitReview(
  orgId: string,
  appId: string,
  rating: number,
  review: { title: string; body: string; authorName: string }
): { success: boolean; review?: AppReview; error?: string } {
  const app = MARKETPLACE_APPS.find((a) => a.id === appId)
  if (!app) {
    return { success: false, error: `App "${appId}" not found.` }
  }

  if (rating < 1 || rating > 5) {
    return { success: false, error: 'Rating must be between 1 and 5.' }
  }

  // Check if org has the app installed
  const key = compositeKey(orgId, appId)
  if (!installedApps.has(key)) {
    return { success: false, error: 'You must install an app before reviewing it.' }
  }

  const newReview: AppReview = {
    id: generateId(),
    orgId,
    appId,
    rating,
    title: review.title,
    body: review.body,
    authorName: review.authorName,
    createdAt: nowISO(),
    helpful: 0,
  }

  const existing = appReviews.get(appId) ?? []
  existing.push(newReview)
  appReviews.set(appId, existing)

  // Update the app's aggregate rating (weighted with existing)
  const totalReviews = app.reviewCount + 1
  const newAvg =
    (app.rating * app.reviewCount + rating) / totalReviews
  ;(app as { rating: number }).rating = Math.round(newAvg * 10) / 10
  ;(app as { reviewCount: number }).reviewCount = totalReviews

  return { success: true, review: newReview }
}

/**
 * Get all reviews for a marketplace app, sorted by most recent.
 */
export function getAppReviews(
  appId: string,
  options?: { limit?: number; offset?: number; sortBy?: 'recent' | 'helpful' | 'rating_high' | 'rating_low' }
): { reviews: AppReview[]; total: number } {
  const allReviews = appReviews.get(appId) ?? []
  let sorted = [...allReviews]

  const sortBy = options?.sortBy ?? 'recent'
  switch (sortBy) {
    case 'recent':
      sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      break
    case 'helpful':
      sorted.sort((a, b) => b.helpful - a.helpful)
      break
    case 'rating_high':
      sorted.sort((a, b) => b.rating - a.rating)
      break
    case 'rating_low':
      sorted.sort((a, b) => a.rating - b.rating)
      break
  }

  const offset = options?.offset ?? 0
  const limit = options?.limit ?? 20
  const paginated = sorted.slice(offset, offset + limit)

  return { reviews: paginated, total: allReviews.length }
}

// ---------------------------------------------------------------------------
// Integration Sync
// ---------------------------------------------------------------------------

/**
 * Trigger a data sync for an installed app.
 * Simulates an async sync operation with realistic timing and results.
 */
export function syncAppData(
  orgId: string,
  appId: string
): { success: boolean; syncRecord?: SyncRecord; error?: string } {
  const key = compositeKey(orgId, appId)
  const installation = installedApps.get(key)

  if (!installation) {
    return { success: false, error: `App "${appId}" is not installed for this organization.` }
  }

  if (installation.status !== 'active') {
    return {
      success: false,
      error: `App "${appId}" is in "${installation.status}" status. Only active apps can be synced.`,
    }
  }

  // Simulate sync results
  const rand = Math.random()
  const status: SyncStatus = rand > 0.9 ? 'failed' : rand > 0.8 ? 'partial' : 'success'
  const recordsSynced = status === 'failed' ? 0 : Math.floor(Math.random() * 500) + 10
  const errors: string[] = []

  if (status === 'failed') {
    errors.push('Connection timed out after 30 seconds')
    errors.push('Unable to authenticate with external API — check credentials')
  } else if (status === 'partial') {
    errors.push(`${Math.floor(Math.random() * 5) + 1} records skipped due to validation errors`)
  }

  const syncRecord: SyncRecord = {
    id: generateId(),
    orgId,
    appId,
    status,
    startedAt: nowISO(),
    completedAt: nowISO(),
    recordsSynced,
    errors,
  }

  // Store sync record
  const history = syncHistory.get(key) ?? []
  history.push(syncRecord)
  syncHistory.set(key, history)

  // Update installation last sync timestamp
  installedApps.set(key, {
    ...installation,
    lastSyncAt: syncRecord.completedAt,
    status: status === 'failed' ? 'error' : 'active',
  })

  return { success: true, syncRecord }
}

/**
 * Get the sync history for an installed app.
 */
export function getSyncHistory(
  orgId: string,
  appId: string,
  options?: { limit?: number }
): { records: SyncRecord[]; total: number } {
  const key = compositeKey(orgId, appId)
  const history = syncHistory.get(key) ?? []

  // Most recent first
  const sorted = [...history].sort(
    (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
  )

  const limit = options?.limit ?? 50
  return {
    records: sorted.slice(0, limit),
    total: history.length,
  }
}

// ---------------------------------------------------------------------------
// Marketplace Statistics
// ---------------------------------------------------------------------------

/**
 * Get marketplace-wide statistics for an organization.
 */
export function getMarketplaceStats(orgId: string): {
  totalAppsAvailable: number
  totalInstalled: number
  activeIntegrations: number
  errorIntegrations: number
  categoryCoverage: { category: AppCategory; installed: number; available: number }[]
  recentSyncs: SyncRecord[]
} {
  const installed = getInstalledApps(orgId)
  const active = installed.filter((i) => i.status === 'active')
  const errored = installed.filter((i) => i.status === 'error')

  // Category coverage
  const categories = getCategories()
  const categoryCoverage = categories.map(({ category, count }) => ({
    category,
    installed: installed.filter((i) => i.app.category === category).length,
    available: count,
  }))

  // Recent syncs across all installed apps
  const allSyncs: SyncRecord[] = []
  for (const inst of installed) {
    const key = compositeKey(orgId, inst.appId)
    const history = syncHistory.get(key) ?? []
    allSyncs.push(...history)
  }
  allSyncs.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())

  return {
    totalAppsAvailable: MARKETPLACE_APPS.length,
    totalInstalled: installed.length,
    activeIntegrations: active.length,
    errorIntegrations: errored.length,
    categoryCoverage,
    recentSyncs: allSyncs.slice(0, 10),
  }
}
