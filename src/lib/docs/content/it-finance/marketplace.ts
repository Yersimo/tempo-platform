import type { ModuleDoc } from '../../types'

const marketplace: ModuleDoc = {
  slug: 'marketplace',
  title: 'Marketplace',
  subtitle: 'Discover, evaluate, and deploy SaaS integrations from a curated marketplace of enterprise-ready applications',
  icon: 'Store',
  group: 'it-finance',
  lastUpdated: '2026-03-13',
  version: '1.0',

  overview: {
    description:
      'The Marketplace module serves as your organization\'s central hub for discovering and deploying software integrations. It provides a curated catalog of pre-vetted SaaS applications and connectors that integrate with Tempo, enabling teams to extend platform functionality while maintaining IT governance. Each listing includes security assessments, pricing transparency, and one-click deployment. The module connects to the Apps & Licenses module for ongoing management after installation.',
    keyFeatures: [
      'Curated catalog of enterprise-ready SaaS integrations with security ratings',
      'One-click installation with pre-configured connectors for Tempo modules',
      'Category-based browsing with filters for function, pricing, and compliance',
      'Security and compliance assessments for every listed application',
      'Request workflow for unlisted applications with vendor outreach',
      'Integration health monitoring with uptime and sync status dashboards',
      'Sandbox environments for evaluating integrations before production deployment',
      'Version management and automatic updates for installed connectors',
      'Usage analytics for installed integrations showing adoption and value metrics',
      'Vendor comparison tools for evaluating alternatives side-by-side',
    ],
    screenshotKey: 'marketplace/overview',
  },

  workflows: [
    {
      id: 'discover-install-integration',
      title: 'Discovering and Installing an Integration',
      description:
        'Browse the marketplace catalog, evaluate an integration, and deploy it to your Tempo environment.',
      estimatedTime: '10 minutes',
      roles: ['owner', 'admin'],
      prerequisites: [
        'Admin access to the Tempo organization',
        'An active subscription to the target SaaS application (if applicable)',
      ],
      steps: [
        {
          number: 1,
          title: 'Browse the marketplace',
          description:
            'Navigate to Marketplace in the left sidebar. The catalog shows featured integrations, popular categories (HR, Finance, Productivity, DevOps, Communication), and recently added listings. Use the search bar or filters to find specific applications.',
          screenshotKey: 'marketplace/install-step-1',
        },
        {
          number: 2,
          title: 'Review the listing',
          description:
            'Click an integration to view its detail page. The listing includes a description, feature list, screenshots, security rating (A-F), compliance certifications, pricing model, data flow diagram, and reviews from other organizations.',
          screenshotKey: 'marketplace/install-step-2',
          tip: 'Check the "Data Flow" section to understand exactly what data the integration reads from and writes to your Tempo environment.',
        },
        {
          number: 3,
          title: 'Review permissions and scopes',
          description:
            'The "Permissions" tab shows the specific Tempo API scopes the integration requires (e.g., read employees, write time entries, read payroll). Review each permission to ensure it aligns with the integration\'s stated functionality.',
          screenshotKey: 'marketplace/install-step-3',
        },
        {
          number: 4,
          title: 'Install the integration',
          description:
            'Click "Install" and authorize the requested permissions. For OAuth-based integrations, you are redirected to the vendor\'s authorization page to grant access. For API key integrations, enter the required credentials. Tempo validates the connection and confirms successful installation.',
          screenshotKey: 'marketplace/install-step-4',
        },
        {
          number: 5,
          title: 'Configure sync settings',
          description:
            'After installation, configure sync frequency (real-time, hourly, daily), data mapping rules, and notification preferences. Some integrations offer a first-sync preview that shows what data will be exchanged before committing.',
          screenshotKey: 'marketplace/install-step-5',
          tip: 'Start with daily sync for new integrations and increase to real-time once you have verified the data mapping is correct.',
        },
      ],
    },
    {
      id: 'evaluate-in-sandbox',
      title: 'Evaluating an Integration in Sandbox',
      description:
        'Deploy an integration to a sandbox environment for testing before promoting it to your production Tempo instance.',
      estimatedTime: '15 minutes',
      roles: ['owner', 'admin'],
      prerequisites: [
        'Sandbox mode must be enabled in Settings > Environments',
        'The integration must support sandbox deployment',
      ],
      steps: [
        {
          number: 1,
          title: 'Request sandbox access',
          description:
            'On the integration listing page, click "Try in Sandbox" instead of "Install". Tempo creates an isolated sandbox environment with synthetic data that mirrors your production schema without exposing real employee or financial data.',
          screenshotKey: 'marketplace/sandbox-step-1',
        },
        {
          number: 2,
          title: 'Configure the sandbox',
          description:
            'Set up the sandbox integration with test credentials from the vendor (if applicable). Configure the data mapping and sync settings you plan to use in production. The sandbox uses the same configuration interface as production.',
          screenshotKey: 'marketplace/sandbox-step-2',
        },
        {
          number: 3,
          title: 'Test data flows',
          description:
            'Trigger sync operations and verify that data flows correctly in both directions. Check that records are created, updated, and deleted as expected. Review the sync log for any errors or data transformation issues.',
          screenshotKey: 'marketplace/sandbox-step-3',
          tip: 'Test edge cases like employees with special characters in names, multi-currency amounts, and timezone-sensitive date fields.',
        },
        {
          number: 4,
          title: 'Promote to production',
          description:
            'Once testing is complete, click "Promote to Production". Your sandbox configuration is applied to the production environment. The initial production sync is scheduled according to your configured frequency.',
          screenshotKey: 'marketplace/sandbox-step-4',
        },
      ],
    },
    {
      id: 'monitor-integration-health',
      title: 'Monitoring Integration Health',
      description:
        'Track the operational status of installed integrations, investigate sync failures, and maintain data quality.',
      estimatedTime: '10 minutes',
      roles: ['owner', 'admin'],
      steps: [
        {
          number: 1,
          title: 'Open the Integration Dashboard',
          description:
            'Navigate to Marketplace > Installed. The dashboard shows all active integrations with their current status (healthy, degraded, error), last sync time, records synced in the last 24 hours, and error count.',
          screenshotKey: 'marketplace/health-step-1',
        },
        {
          number: 2,
          title: 'Investigate errors',
          description:
            'Click on an integration with errors to view the sync log. Each log entry shows the timestamp, operation type, affected records, and the error message. Common errors include authentication failures, rate limiting, and data validation errors.',
          screenshotKey: 'marketplace/health-step-2',
        },
        {
          number: 3,
          title: 'Retry failed syncs',
          description:
            'For transient errors (rate limiting, temporary vendor outages), click "Retry" to re-attempt the failed operations. For persistent errors, review the error details and update the configuration or contact the vendor for support.',
          screenshotKey: 'marketplace/health-step-3',
          tip: 'Set up Slack alerts for integration errors so the IT team is notified immediately rather than discovering issues during periodic reviews.',
        },
        {
          number: 4,
          title: 'Review sync metrics',
          description:
            'The "Metrics" tab shows historical sync performance including records processed per sync, average sync duration, error rate trends, and data freshness. Use these metrics to identify integrations that may need configuration adjustments or upgrades.',
          screenshotKey: 'marketplace/health-step-4',
        },
        {
          number: 5,
          title: 'Update integration versions',
          description:
            'When a new version of a connector is available, a notification badge appears on the integration. Click "Update Available" to review the changelog, then click "Update" to apply the new version. Updates are applied during the next sync window to minimize disruption.',
          screenshotKey: 'marketplace/health-step-5',
        },
      ],
    },
  ],

  faqs: [
    {
      question: 'How are marketplace integrations vetted for security?',
      answer:
        'Every integration undergoes a security review before being listed. The review evaluates the vendor\'s security certifications (SOC 2, ISO 27001), data encryption practices, API security measures, privacy policy compliance, and incident response procedures. Each integration receives a security rating from A (highest) to F (lowest).',
    },
    {
      question: 'Can I request an integration that is not in the marketplace?',
      answer:
        'Yes. Click "Request Integration" in the marketplace and submit the vendor name, URL, and use case. Tempo\'s integration team evaluates the request, performs a security assessment, and either builds the connector or reaches out to the vendor to develop a partnership.',
    },
    {
      question: 'What data does Tempo share with marketplace integrations?',
      answer:
        'Each integration specifies exactly which Tempo API scopes it requires. You review and approve these scopes during installation. Integrations can only access the data types covered by the approved scopes. All data exchanges are encrypted in transit and logged in the audit trail.',
    },
    {
      question: 'Can I revoke an integration\'s access?',
      answer:
        'Yes. Navigate to Marketplace > Installed, click the integration, and click "Revoke Access". This immediately invalidates the integration\'s API tokens and stops all data sync. Historical data already synced to the vendor is not affected -- contact the vendor directly for data deletion.',
    },
    {
      question: 'Are marketplace integrations included in my subscription?',
      answer:
        'Marketplace connectors built by Tempo are included at no additional cost. Third-party integrations may have their own pricing, which is clearly displayed on the listing page. Some integrations offer free tiers with usage limits and paid tiers for higher volumes.',
    },
    {
      question: 'How does the sandbox environment work?',
      answer:
        'The sandbox creates an isolated copy of your Tempo schema populated with synthetic data. It uses separate API endpoints and credentials from production. Sandbox data is automatically deleted after 30 days of inactivity. No production data is ever exposed to the sandbox.',
    },
  ],

  tips: [
    'Always review the data flow diagram before installing an integration to understand exactly what information will be exchanged.',
    'Use sandbox mode for any integration that will access sensitive data (payroll, financial records, PII) before deploying to production.',
    'Start with daily sync frequency for new integrations and increase to real-time only after verifying data quality over at least one week.',
    'Set up Slack or email alerts for integration health issues to catch sync failures before they impact business processes.',
    'Review installed integration permissions quarterly to ensure they still align with your current data governance policies.',
    'Check the marketplace regularly for new integrations and updated versions of installed connectors.',
  ],

  relatedModules: ['it/apps', 'identity', 'it-cloud', 'password-manager', 'finance/invoices'],

  permissions: [
    {
      role: 'Owner',
      capabilities: [
        'Install, configure, and uninstall marketplace integrations',
        'Approve or reject integration requests from employees',
        'Access sandbox environments for testing',
        'View sync logs and health metrics for all integrations',
        'Manage API scopes and permissions for installed integrations',
      ],
    },
    {
      role: 'Admin',
      capabilities: [
        'Install and configure marketplace integrations',
        'Monitor integration health and investigate errors',
        'Deploy integrations to sandbox for evaluation',
        'Retry failed sync operations',
        'View integration usage analytics',
      ],
    },
    {
      role: 'Manager',
      capabilities: [
        'Browse the marketplace catalog',
        'Submit integration requests for team needs',
        'View status of installed integrations used by their team',
      ],
    },
    {
      role: 'Employee',
      capabilities: [
        'Browse the marketplace catalog',
        'Submit integration requests with business justification',
        'View the list of integrations available to their role',
      ],
    },
  ],
}

export default marketplace
