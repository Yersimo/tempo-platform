import type { ModuleDoc } from '../../types'

const itCloud: ModuleDoc = {
  slug: 'it-cloud',
  title: 'Cloud Infrastructure',
  subtitle: 'Manage cloud resources, monitor usage, enforce security policies, and control costs across multi-cloud environments',
  icon: 'Cloud',
  group: 'it-finance',
  lastUpdated: '2026-03-13',
  version: '1.0',

  overview: {
    description:
      'The Cloud Infrastructure module provides centralized visibility and governance over your organization\'s cloud resources across AWS, Azure, Google Cloud, and other providers. It enables IT teams to provision new resources through standardized templates, monitor real-time utilization, enforce security baselines, and track cost allocation by department and project. Built-in anomaly detection flags unexpected spend spikes and underutilized resources, while policy-as-code guardrails prevent misconfigurations before they reach production.',
    keyFeatures: [
      'Multi-cloud dashboard with unified view of AWS, Azure, and Google Cloud resources',
      'Self-service resource provisioning through pre-approved infrastructure templates',
      'Real-time cost tracking with department and project-level allocation',
      'Security posture scoring with automated compliance checks (SOC 2, ISO 27001, CIS benchmarks)',
      'Anomaly detection for cost spikes and unusual resource activity',
      'Right-sizing recommendations based on utilization metrics',
      'Tag enforcement policies to ensure consistent resource labeling',
      'Infrastructure-as-code template library with version control',
      'Automated idle resource detection and scheduled shutdown policies',
      'Role-based access control integrated with identity providers',
    ],
    screenshotKey: 'it-cloud/overview',
  },

  workflows: [
    {
      id: 'provision-cloud-resource',
      title: 'Provisioning a Cloud Resource',
      description:
        'Request and deploy a new cloud resource using a pre-approved template. This workflow covers the full lifecycle from request submission through approval and provisioning.',
      estimatedTime: '10 minutes',
      roles: ['admin', 'manager', 'employee'],
      prerequisites: [
        'A cloud provider account must be connected in Settings > Cloud Integrations',
        'At least one infrastructure template must be published in the template library',
        'The requesting user must have a valid department and cost center assigned',
      ],
      steps: [
        {
          number: 1,
          title: 'Navigate to the Cloud module',
          description:
            'Click "Cloud" in the left sidebar under IT & Finance. The Cloud dashboard displays resource counts by provider, current month spend, and recent provisioning activity.',
          screenshotKey: 'it-cloud/provision-step-1',
        },
        {
          number: 2,
          title: 'Browse the template catalog',
          description:
            'Click "New Resource" to open the template catalog. Templates are organized by category (Compute, Storage, Database, Networking, Containers) and tagged by provider. Each template shows estimated monthly cost, required approvals, and compliance rating.',
          screenshotKey: 'it-cloud/provision-step-2',
          tip: 'Use the search bar to filter templates by name or tag. Starred templates appear at the top for quick access.',
        },
        {
          number: 3,
          title: 'Configure the resource',
          description:
            'Select a template and fill in the configuration form: resource name, environment (development, staging, production), region, sizing tier, and project/cost center tags. The estimated monthly cost updates in real-time as you adjust parameters.',
          screenshotKey: 'it-cloud/provision-step-3',
        },
        {
          number: 4,
          title: 'Submit the provisioning request',
          description:
            'Review the configuration summary and click "Submit Request". Development resources under the auto-approval threshold are provisioned immediately. Production resources and those exceeding the cost threshold enter the approval workflow and are routed to the IT Manager or Cloud Admin.',
          screenshotKey: 'it-cloud/provision-step-4',
        },
        {
          number: 5,
          title: 'Monitor provisioning status',
          description:
            'Track the provisioning progress in the "My Requests" tab. The status progresses through Pending Approval, Provisioning, and Active. Once active, the resource appears in your resource inventory with connection details and access credentials.',
          screenshotKey: 'it-cloud/provision-step-5',
          tip: 'Enable notifications in your profile to receive an alert when provisioning completes or if the request is rejected.',
        },
      ],
    },
    {
      id: 'review-cloud-costs',
      title: 'Reviewing Cloud Costs and Optimization',
      description:
        'Analyze cloud spending patterns, identify cost optimization opportunities, and implement right-sizing recommendations to reduce waste.',
      estimatedTime: '15 minutes',
      roles: ['owner', 'admin'],
      prerequisites: [
        'Cloud provider billing APIs must be connected',
        'Resources must have department and project tags applied',
      ],
      steps: [
        {
          number: 1,
          title: 'Open the Cost Explorer',
          description:
            'Navigate to Cloud > Cost Explorer. The default view shows total spend for the current month with a trend line comparing against the previous three months. A forecast line projects the expected end-of-month total based on current burn rate.',
          screenshotKey: 'it-cloud/costs-step-1',
        },
        {
          number: 2,
          title: 'Filter by dimension',
          description:
            'Use the dimension selector to break down costs by provider, department, project, service type, or region. Click any segment in the breakdown chart to drill into the individual resources contributing to that cost.',
          screenshotKey: 'it-cloud/costs-step-2',
        },
        {
          number: 3,
          title: 'Review optimization recommendations',
          description:
            'Click the "Recommendations" tab to view AI-generated cost optimization suggestions. Each recommendation shows the resource, current utilization, suggested action (downsize, terminate, reserve), estimated monthly savings, and implementation risk level.',
          screenshotKey: 'it-cloud/costs-step-3',
          tip: 'Sort recommendations by estimated savings to prioritize the highest-impact changes first.',
        },
        {
          number: 4,
          title: 'Apply a recommendation',
          description:
            'Click "Apply" on a recommendation to initiate the change. Low-risk changes (e.g., deleting unattached storage) can be applied directly. High-risk changes (e.g., downsizing production instances) create a change request that requires approval before execution.',
          screenshotKey: 'it-cloud/costs-step-4',
        },
        {
          number: 5,
          title: 'Set up budget alerts',
          description:
            'Navigate to Cost Explorer > Alerts and configure threshold-based notifications. Set alerts at 50%, 75%, 90%, and 100% of budget. Alerts can be sent via email, Slack, or in-app notification to designated stakeholders.',
          screenshotKey: 'it-cloud/costs-step-5',
        },
      ],
    },
    {
      id: 'enforce-security-baseline',
      title: 'Enforcing Cloud Security Baselines',
      description:
        'Configure and monitor security policies across all cloud resources to maintain compliance with organizational and regulatory standards.',
      estimatedTime: '20 minutes',
      roles: ['owner', 'admin'],
      prerequisites: [
        'Cloud provider APIs must be connected with read access to security configurations',
        'Security baseline policies must be defined in Settings > Cloud Security',
      ],
      steps: [
        {
          number: 1,
          title: 'Open the Security Dashboard',
          description:
            'Navigate to Cloud > Security. The dashboard shows an overall security posture score (0-100), broken down by category: identity and access, network, encryption, logging, and vulnerability management.',
          screenshotKey: 'it-cloud/security-step-1',
        },
        {
          number: 2,
          title: 'Review security findings',
          description:
            'The findings list shows all resources that deviate from the security baseline. Each finding includes severity (critical, high, medium, low), the specific policy violated, the affected resource, and a remediation recommendation.',
          screenshotKey: 'it-cloud/security-step-2',
        },
        {
          number: 3,
          title: 'Configure guardrail policies',
          description:
            'Click "Policies" to view and edit security guardrails. Policies cover areas such as public access prevention, encryption-at-rest enforcement, MFA requirements, and network segmentation rules. Toggle policies on/off or customize thresholds.',
          screenshotKey: 'it-cloud/security-step-3',
          tip: 'Start with the "CIS Benchmark" preset to apply industry-standard security controls, then customize for your organization.',
        },
        {
          number: 4,
          title: 'Remediate findings',
          description:
            'Click a finding to see the detailed remediation steps. For supported resources, click "Auto-Remediate" to apply the fix automatically. For resources requiring manual intervention, the guide provides step-by-step instructions for the specific cloud provider console.',
          screenshotKey: 'it-cloud/security-step-4',
        },
        {
          number: 5,
          title: 'Schedule compliance scans',
          description:
            'Configure scan frequency in Security > Settings. Daily scans are recommended for production environments. Scan results are tracked over time, and the posture score trend is visible on the dashboard to show improvement.',
          screenshotKey: 'it-cloud/security-step-5',
        },
        {
          number: 6,
          title: 'Generate compliance reports',
          description:
            'Click "Export Report" to generate a compliance report mapped to a specific framework (SOC 2, ISO 27001, CIS). The report includes a summary of controls, pass/fail status, evidence links, and remediation timelines for auditor review.',
          screenshotKey: 'it-cloud/security-step-6',
        },
      ],
    },
    {
      id: 'manage-cloud-tags',
      title: 'Managing Resource Tags and Cost Allocation',
      description:
        'Implement and enforce a consistent tagging strategy to enable accurate cost allocation, resource ownership tracking, and policy enforcement.',
      estimatedTime: '10 minutes',
      roles: ['owner', 'admin'],
      steps: [
        {
          number: 1,
          title: 'Define the tagging policy',
          description:
            'Navigate to Cloud > Settings > Tag Policy. Define required tags (e.g., Department, Project, Environment, Owner) and optional tags. For each required tag, specify allowed values or validation patterns.',
          screenshotKey: 'it-cloud/tags-step-1',
        },
        {
          number: 2,
          title: 'Review tag compliance',
          description:
            'Open Cloud > Tags to see the compliance dashboard. It shows the percentage of resources with all required tags, a list of non-compliant resources, and the most common missing tags.',
          screenshotKey: 'it-cloud/tags-step-2',
          tip: 'Filter by provider or department to focus on the teams with the lowest tag compliance rates.',
        },
        {
          number: 3,
          title: 'Bulk-apply missing tags',
          description:
            'Select non-compliant resources and click "Bulk Tag". Enter the missing tag values and click "Apply". Tempo pushes the tags to the cloud provider via API. Resources that cannot be tagged remotely are flagged for manual action.',
          screenshotKey: 'it-cloud/tags-step-3',
        },
        {
          number: 4,
          title: 'Enable tag enforcement',
          description:
            'Toggle "Enforce on Provisioning" to prevent new resources from being created without required tags. Requests missing required tags are rejected at submission with a clear error message indicating which tags are missing.',
          screenshotKey: 'it-cloud/tags-step-4',
        },
      ],
    },
  ],

  faqs: [
    {
      question: 'Which cloud providers does Tempo integrate with?',
      answer:
        'Tempo supports native integrations with Amazon Web Services (AWS), Microsoft Azure, and Google Cloud Platform (GCP). Each integration uses read-only API credentials to inventory resources and pull cost data. Write access is only required if you enable automated provisioning or auto-remediation features.',
    },
    {
      question: 'How is cloud cost data refreshed?',
      answer:
        'Cost data is synced from cloud provider billing APIs every 4 hours. The most recent billing data may have a 24-48 hour delay depending on the provider. Forecasts are recalculated after each sync using the updated data. You can trigger a manual sync from Cloud > Settings > Integrations.',
    },
    {
      question: 'Can I set different cost budgets for each department?',
      answer:
        'Yes. Navigate to Cloud > Cost Explorer > Budgets to create department-level budgets. Each budget can have its own monthly or quarterly limit, alert thresholds, and notification recipients. Budget performance is visible on the department manager\'s dashboard.',
    },
    {
      question: 'What happens when a security finding is auto-remediated?',
      answer:
        'Auto-remediation applies the fix directly to the cloud provider resource. All auto-remediation actions are logged in the audit trail with before and after states, the policy that triggered the action, and a rollback option available for 30 days. Critical production resources can be excluded from auto-remediation.',
    },
    {
      question: 'How do provisioning templates work?',
      answer:
        'Templates are pre-configured infrastructure definitions that specify resource type, sizing, security settings, network configuration, and required tags. They are stored as versioned configurations and can be promoted through development, staging, and production catalogs. Only published templates are available for self-service provisioning.',
    },
    {
      question: 'Can I track resources that were created outside of Tempo?',
      answer:
        'Yes. Tempo performs a full resource inventory scan during each sync cycle. Resources created directly in cloud provider consoles are detected, imported into Tempo, and flagged as "Unmanaged" until they are tagged and assigned to a department. You can set up alerts for unmanaged resource creation.',
    },
    {
      question: 'How does right-sizing analysis work?',
      answer:
        'Tempo collects CPU, memory, network, and disk utilization metrics from cloud provider monitoring services over a rolling 14-day window. Resources consistently using less than 40% of their allocated capacity are flagged as candidates for downsizing. The recommendation includes the suggested target size and projected savings.',
    },
  ],

  tips: [
    'Connect all cloud provider accounts during initial setup to get a complete view of your infrastructure footprint from day one.',
    'Use the "CIS Benchmark" security preset as a starting point and customize it based on your compliance requirements rather than building policies from scratch.',
    'Enable tag enforcement on provisioning early -- it is much easier to maintain tagging compliance than to retroactively tag hundreds of resources.',
    'Review cost optimization recommendations weekly, not monthly. Cloud costs accumulate quickly and idle resources can represent significant waste.',
    'Set up Slack notifications for critical security findings so your team can respond to high-severity issues immediately.',
    'Use environment tags (dev, staging, prod) to implement automated shutdown schedules for non-production resources outside business hours.',
  ],

  relatedModules: ['it/devices', 'it/apps', 'identity', 'finance/budgets', 'finance/global-spend'],

  permissions: [
    {
      role: 'Owner',
      capabilities: [
        'Full access to all cloud resources, settings, and integrations',
        'Create and publish infrastructure templates',
        'Configure security policies and auto-remediation rules',
        'Set department budgets and cost alerts',
        'Approve high-cost and production provisioning requests',
        'Access all audit logs and compliance reports',
      ],
    },
    {
      role: 'Admin',
      capabilities: [
        'View and manage cloud resources across all departments',
        'Create and edit infrastructure templates',
        'Review and remediate security findings',
        'Approve provisioning requests within assigned scope',
        'Generate cost and compliance reports',
      ],
    },
    {
      role: 'Manager',
      capabilities: [
        'View cloud resources and costs for their department',
        'Submit provisioning requests using approved templates',
        'View security findings for department resources',
        'Approve provisioning requests from direct reports',
      ],
    },
    {
      role: 'Employee',
      capabilities: [
        'Submit provisioning requests using approved templates',
        'View own provisioned resources and their status',
        'Access resource connection details for assigned resources',
      ],
    },
  ],
}

export default itCloud
