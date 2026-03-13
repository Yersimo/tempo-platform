import type { ModuleDoc } from '../../types'

const itApps: ModuleDoc = {
  slug: 'it/apps',
  title: 'Apps & Licenses',
  subtitle: 'Manage software licenses, track application usage, detect shadow IT, and optimize SaaS spend',
  icon: 'AppWindow',
  group: 'it-finance',
  lastUpdated: '2026-03-13',
  version: '1.0',

  overview: {
    description:
      'The Apps & Licenses module gives IT teams complete visibility into the software landscape across the organization. It maintains a centralized catalog of all approved applications, tracks license assignments and utilization, detects unauthorized (shadow IT) applications, and provides cost optimization recommendations for underused subscriptions. The module integrates with SSO providers and browser extensions to automatically discover applications in use, and connects to vendor APIs for real-time license consumption data.',
    keyFeatures: [
      'Centralized application catalog with approval status and security ratings',
      'License management with seat tracking and renewal date monitoring',
      'Shadow IT detection through SSO logs, browser extension, and network monitoring',
      'Usage analytics showing login frequency and feature adoption per application',
      'License optimization recommendations based on usage patterns',
      'Automated provisioning and deprovisioning via SCIM and SSO integration',
      'Vendor contract management with renewal alerts and spend tracking',
      'Application request and approval workflow for new software needs',
      'Compliance tracking for software with data processing agreements',
      'Cost-per-user analysis across the entire SaaS portfolio',
    ],
    screenshotKey: 'it-apps/overview',
  },

  workflows: [
    {
      id: 'review-shadow-it',
      title: 'Reviewing and Managing Shadow IT',
      description:
        'Discover unauthorized applications being used by employees, assess their risk, and decide whether to sanction, monitor, or block them.',
      estimatedTime: '20 minutes',
      roles: ['owner', 'admin'],
      prerequisites: [
        'SSO integration must be configured to capture authentication events',
        'Browser extension deployment is recommended for comprehensive discovery',
      ],
      steps: [
        {
          number: 1,
          title: 'Open the Shadow IT Dashboard',
          description:
            'Navigate to Apps > Shadow IT. The dashboard shows a list of applications detected through SSO logs, browser activity, and network analysis that are not in the approved catalog. Each entry shows the app name, number of users, first detected date, and risk score.',
          screenshotKey: 'it-apps/shadow-it-step-1',
        },
        {
          number: 2,
          title: 'Assess application risk',
          description:
            'Click on an application to view its risk assessment. Tempo evaluates each app against criteria including data handling practices, security certifications, compliance with regulations (GDPR, SOC 2), and whether it overlaps with existing approved tools.',
          screenshotKey: 'it-apps/shadow-it-step-2',
          tip: 'Prioritize review of apps with a risk score above 70 or those being used by more than 5 employees.',
        },
        {
          number: 3,
          title: 'View user activity',
          description:
            'The "Users" tab shows which employees are using the application, how frequently they access it, and which department they belong to. This context helps determine whether the app serves a legitimate business need.',
          screenshotKey: 'it-apps/shadow-it-step-3',
        },
        {
          number: 4,
          title: 'Take action',
          description:
            'Choose one of three actions: "Sanction" adds the app to the approved catalog and begins license tracking. "Monitor" keeps the app on watch without blocking. "Block" adds the app to the blocklist and notifies affected users with a suggested approved alternative.',
          screenshotKey: 'it-apps/shadow-it-step-4',
        },
        {
          number: 5,
          title: 'Notify affected employees',
          description:
            'When blocking an application, Tempo sends a notification to all identified users explaining the decision and recommending the approved alternative. The notification includes a link to request an exception if the employee believes the app is essential.',
          screenshotKey: 'it-apps/shadow-it-step-5',
        },
      ],
    },
    {
      id: 'manage-license-assignments',
      title: 'Managing License Assignments',
      description:
        'Assign, revoke, and optimize software license seats to ensure efficient utilization and cost control.',
      estimatedTime: '10 minutes',
      roles: ['owner', 'admin'],
      prerequisites: [
        'The application must be added to the catalog with license details configured',
        'SCIM or API integration is recommended for automated provisioning',
      ],
      steps: [
        {
          number: 1,
          title: 'Open the application detail',
          description:
            'Navigate to Apps > Catalog and click on the application you want to manage. The detail view shows total licenses purchased, licenses assigned, licenses in use (active in the last 30 days), and unused licenses.',
          screenshotKey: 'it-apps/license-step-1',
        },
        {
          number: 2,
          title: 'Review utilization',
          description:
            'The "Utilization" tab shows each assigned user, their last login date, login frequency over the past 90 days, and features used. Users who have not logged in within 30 days are highlighted as potential candidates for license reclamation.',
          screenshotKey: 'it-apps/license-step-2',
          tip: 'Sort by "Last Active" to quickly identify inactive users who may no longer need the license.',
        },
        {
          number: 3,
          title: 'Reclaim unused licenses',
          description:
            'Select users with inactive licenses and click "Reclaim". Tempo sends the user a notification that their license will be revoked in 7 days unless they confirm they still need access. After the grace period, the license is automatically revoked and returned to the available pool.',
          screenshotKey: 'it-apps/license-step-3',
        },
        {
          number: 4,
          title: 'Assign new licenses',
          description:
            'Click "Assign License" to grant access to additional employees. Search by name or department. For SCIM-integrated apps, the license is provisioned automatically. For other apps, the employee receives setup instructions via email.',
          screenshotKey: 'it-apps/license-step-4',
        },
        {
          number: 5,
          title: 'Review license spend',
          description:
            'The "Cost" tab shows total annual spend, cost per assigned user, and cost per active user. If cost per active user significantly exceeds cost per assigned user, there is an opportunity to reduce spend by right-sizing the license count at renewal.',
          screenshotKey: 'it-apps/license-step-5',
        },
      ],
    },
    {
      id: 'request-new-application',
      title: 'Requesting a New Application',
      description:
        'Submit a request for a new software application, including business justification and security review, through the approval workflow.',
      estimatedTime: '5 minutes',
      roles: ['employee', 'manager'],
      steps: [
        {
          number: 1,
          title: 'Submit an app request',
          description:
            'Navigate to Apps > Request New App. Fill in the application name, vendor URL, intended use case, estimated number of users, and business justification. Select the urgency level and preferred license tier.',
          screenshotKey: 'it-apps/request-step-1',
        },
        {
          number: 2,
          title: 'Check for existing alternatives',
          description:
            'Tempo automatically searches the approved catalog for applications with similar functionality and displays them. If a suitable alternative exists, the employee can choose to use it instead or proceed with the new request and explain why the alternative is insufficient.',
          screenshotKey: 'it-apps/request-step-2',
          tip: 'Providing a detailed comparison with existing tools speeds up the approval process.',
        },
        {
          number: 3,
          title: 'Manager approval',
          description:
            'The request is routed to the employee\'s manager for business justification approval. The manager reviews the request, verifies the budget impact, and either approves or returns it with questions.',
          screenshotKey: 'it-apps/request-step-3',
        },
        {
          number: 4,
          title: 'IT security review',
          description:
            'After manager approval, the request moves to the IT team for a security and compliance review. IT evaluates the vendor\'s security posture, data handling practices, and regulatory compliance. A risk rating is assigned.',
          screenshotKey: 'it-apps/request-step-4',
        },
        {
          number: 5,
          title: 'Procurement and provisioning',
          description:
            'Once approved, IT initiates procurement, adds the application to the catalog, and provisions licenses to the requesting team. The application status changes to "Approved" and appears in the catalog for future requests.',
          screenshotKey: 'it-apps/request-step-5',
        },
      ],
    },
    {
      id: 'renewal-management',
      title: 'Managing License Renewals',
      description:
        'Track upcoming subscription renewals, review utilization data, and make informed decisions about renewal quantities and terms.',
      estimatedTime: '15 minutes',
      roles: ['owner', 'admin'],
      steps: [
        {
          number: 1,
          title: 'View upcoming renewals',
          description:
            'Navigate to Apps > Renewals. The renewals calendar shows all applications with renewal dates in the next 90 days, sorted by date. Each entry shows the application name, current license count, annual cost, and renewal terms.',
          screenshotKey: 'it-apps/renewal-step-1',
        },
        {
          number: 2,
          title: 'Review utilization before renewal',
          description:
            'Click on an upcoming renewal to see a utilization summary. The report shows average utilization over the contract period, peak usage, growth trends, and the recommended license count based on actual usage plus a configurable buffer.',
          screenshotKey: 'it-apps/renewal-step-2',
        },
        {
          number: 3,
          title: 'Adjust renewal quantity',
          description:
            'Based on utilization data, adjust the license count for the renewal. Tempo calculates the cost impact of increasing or decreasing seats and shows the projected cost per active user at the new count.',
          screenshotKey: 'it-apps/renewal-step-3',
          tip: 'Consider annual vs. monthly billing terms during renewal -- annual commitments typically offer 15-20% savings.',
        },
        {
          number: 4,
          title: 'Submit renewal decision',
          description:
            'Click "Confirm Renewal" to proceed with the adjusted terms, or "Cancel Subscription" if the application is no longer needed. Cancellation triggers a deprovisioning workflow that revokes all assigned licenses and notifies affected users of alternatives.',
          screenshotKey: 'it-apps/renewal-step-4',
        },
      ],
    },
  ],

  faqs: [
    {
      question: 'How does Tempo detect shadow IT applications?',
      answer:
        'Tempo uses multiple detection methods: SSO authentication logs capture apps accessed through single sign-on, the optional browser extension detects web applications accessed outside SSO, and network monitoring identifies SaaS domains in DNS logs. All detected apps not in the approved catalog are flagged as potential shadow IT.',
    },
    {
      question: 'Can I track free-tier and freemium application usage?',
      answer:
        'Yes. Free applications are tracked just like paid ones. Even though there is no license cost, tracking free-tier usage is important for shadow IT visibility, data security assessment, and identifying when usage might exceed free-tier limits requiring a paid upgrade.',
    },
    {
      question: 'How are license costs allocated to departments?',
      answer:
        'License costs are allocated based on seat assignments. When a license is assigned to an employee, the prorated cost is allocated to their department\'s cost center. The Apps > Cost Allocation report shows spend by department, team, and individual employee across all applications.',
    },
    {
      question: 'What happens to licenses when an employee leaves the organization?',
      answer:
        'When an offboarding ticket is created in the People module, Tempo automatically identifies all software licenses assigned to the departing employee. Licenses integrated via SCIM are revoked automatically. Non-integrated licenses generate a manual deprovisioning checklist for the IT team.',
    },
    {
      question: 'Can employees request access to applications already in the catalog?',
      answer:
        'Yes. Employees can browse the approved catalog and click "Request Access" on any application. The request follows the configured approval workflow, which may require only manager approval for standard apps or additional IT approval for applications with elevated security requirements.',
    },
    {
      question: 'How does the security rating for applications work?',
      answer:
        'Each application receives a security rating (A through F) based on the vendor\'s security certifications (SOC 2, ISO 27001), data encryption practices, breach history, privacy policy compliance, and whether a data processing agreement is in place. Ratings are updated quarterly or when significant security events occur.',
    },
    {
      question: 'Can I set up alerts for license threshold limits?',
      answer:
        'Yes. Navigate to the application detail and configure utilization alerts. You can set alerts when assigned licenses reach 80% or 90% of the total purchased count, when utilization drops below a threshold, or when the renewal date is approaching.',
    },
    {
      question: 'Does Tempo support volume license tracking for on-premise software?',
      answer:
        'Yes. On-premise applications can be added to the catalog with license type "Volume" or "Site License". The device integration tracks installations across managed devices and reports compliance against the purchased license quantity.',
    },
  ],

  tips: [
    'Schedule monthly shadow IT reviews to catch unauthorized applications early before they become embedded in team workflows.',
    'Run license reclamation at least quarterly to recover unused seats and reduce costs before renewal discussions.',
    'Tag applications with data classification levels (Public, Internal, Confidential, Restricted) to quickly identify high-risk shadow IT.',
    'Enable automatic deprovisioning via SCIM for all critical applications to ensure immediate access revocation during offboarding.',
    'Use the cost-per-active-user metric rather than cost-per-license to get an accurate picture of application ROI.',
    'Set renewal calendar reminders 60 days in advance to allow time for utilization review and vendor negotiation.',
  ],

  relatedModules: ['identity', 'it/devices', 'marketplace', 'password-manager', 'finance/budgets'],

  permissions: [
    {
      role: 'Owner',
      capabilities: [
        'Full access to the application catalog, licenses, and shadow IT dashboard',
        'Approve or reject application requests and security reviews',
        'Configure license policies and auto-reclamation rules',
        'Manage vendor contracts and renewal decisions',
        'Access cost allocation reports across all departments',
      ],
    },
    {
      role: 'Admin',
      capabilities: [
        'Add and edit applications in the catalog',
        'Assign and revoke licenses',
        'Review and manage shadow IT findings',
        'Generate utilization and cost reports',
        'Process application requests and renewals',
      ],
    },
    {
      role: 'Manager',
      capabilities: [
        'View applications and licenses for direct reports',
        'Approve application requests from team members',
        'View department-level cost allocation reports',
        'Request new applications on behalf of the team',
      ],
    },
    {
      role: 'Employee',
      capabilities: [
        'Browse the approved application catalog',
        'Request access to catalog applications',
        'Submit new application requests',
        'View own assigned licenses and access status',
      ],
    },
  ],
}

export default itApps
