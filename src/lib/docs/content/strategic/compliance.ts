import type { ModuleDoc } from '../../types'

const compliance: ModuleDoc = {
  slug: 'compliance',
  title: 'Compliance',
  subtitle: 'Compliance requirements, document management, and audit trails',
  icon: 'ShieldCheck',
  group: 'strategic',
  lastUpdated: '2026-03-13',
  version: '1.0',

  overview: {
    description:
      'The Compliance module provides a centralized hub for managing regulatory requirements, policy documents, and audit readiness across your organization. Track compliance obligations by jurisdiction, automate policy acknowledgment workflows, and maintain a tamper-proof audit trail of every compliance-related action. With built-in support for frameworks like SOC 2, GDPR, ISO 27001, and local labor laws, the module helps you stay ahead of regulatory deadlines and demonstrate compliance to auditors with a single click.',
    keyFeatures: [
      'Compliance requirement tracker organized by framework, jurisdiction, and category',
      'Policy document management with version control and e-signature acknowledgment',
      'Automated compliance monitoring with real-time status dashboards',
      'AI-powered regulatory change detection that surfaces relevant updates',
      'Audit trail logging for all employee data access, modifications, and approvals',
      'Audit-ready report generation with evidence collection and export',
      'Jurisdiction-aware requirement mapping for multi-country organizations',
      'Configurable compliance task assignments with due date tracking and reminders',
    ],
    screenshotKey: 'compliance/overview',
  },

  workflows: [
    {
      id: 'add-compliance-requirement',
      title: 'Adding a Compliance Requirement',
      description:
        'Register a new regulatory or internal compliance requirement and assign responsibility for its ongoing maintenance.',
      estimatedTime: '8 minutes',
      roles: ['owner', 'admin'],
      prerequisites: [
        'The compliance framework (e.g., GDPR, SOC 2) should be registered in the module',
        'A responsible party with an active employee record must be designated',
      ],
      steps: [
        {
          number: 1,
          title: 'Navigate to the Compliance module',
          description:
            'Click "Compliance" in the left sidebar under the Strategic section. The module opens to the compliance dashboard showing overall status across all tracked frameworks.',
          screenshotKey: 'compliance/add-req-step-1',
        },
        {
          number: 2,
          title: 'Select the framework',
          description:
            'Click on the relevant compliance framework (e.g., GDPR, SOC 2 Type II, ISO 27001) from the left panel. If the framework does not exist, click "Add Framework" to create it with a name, description, and applicable jurisdictions.',
          screenshotKey: 'compliance/add-req-step-2',
        },
        {
          number: 3,
          title: 'Add a new requirement',
          description:
            'Click "Add Requirement" within the framework. Enter the requirement title, reference ID (e.g., Article 17 for GDPR Right to Erasure), description, and compliance category (Technical, Administrative, Physical).',
          screenshotKey: 'compliance/add-req-step-3',
        },
        {
          number: 4,
          title: 'Assign ownership and deadlines',
          description:
            'Assign a responsible owner from the employee directory. Set the initial compliance deadline and the review frequency (quarterly, semi-annually, annually). Configure reminder notifications for upcoming due dates.',
          screenshotKey: 'compliance/add-req-step-4',
          tip: 'Assign requirements to roles rather than individuals where possible, so ownership transfers automatically when employees change roles.',
        },
        {
          number: 5,
          title: 'Attach evidence requirements',
          description:
            'Define what evidence must be collected to demonstrate compliance. This can include document uploads, system configurations, screenshots, or audit logs. Each evidence type has a description and acceptance criteria.',
          screenshotKey: 'compliance/add-req-step-5',
        },
      ],
    },
    {
      id: 'policy-acknowledgment',
      title: 'Running a Policy Acknowledgment Campaign',
      description:
        'Distribute a new or updated policy document to employees and collect signed acknowledgments with a full audit trail.',
      estimatedTime: '10 minutes',
      roles: ['owner', 'admin', 'hrbp'],
      steps: [
        {
          number: 1,
          title: 'Upload the policy document',
          description:
            'Navigate to Compliance > Policies. Click "Upload Policy" and select a PDF or Word document. Enter the policy title, category (e.g., Data Privacy, Code of Conduct, IT Security), and effective date.',
          screenshotKey: 'compliance/policy-step-1',
        },
        {
          number: 2,
          title: 'Configure the acknowledgment campaign',
          description:
            'Click "Create Campaign" on the uploaded policy. Select the target audience: all employees, specific departments, specific locations, or a custom employee list. Set the acknowledgment deadline.',
          screenshotKey: 'compliance/policy-step-2',
        },
        {
          number: 3,
          title: 'Customize the acknowledgment message',
          description:
            'Edit the notification email and in-app message that employees will receive. Include a summary of key changes if this is a policy update. Preview the message before sending.',
          screenshotKey: 'compliance/policy-step-3',
          tip: 'For policy updates, use the version comparison feature to auto-generate a summary of changes between the old and new versions.',
        },
        {
          number: 4,
          title: 'Launch the campaign',
          description:
            'Click "Send" to distribute the policy to all targeted employees. Each employee receives a notification prompting them to read and acknowledge the document. The campaign dashboard shows real-time completion rates.',
          screenshotKey: 'compliance/policy-step-4',
        },
        {
          number: 5,
          title: 'Track completion and send reminders',
          description:
            'Monitor the campaign dashboard for acknowledgment progress. Employees who have not acknowledged are listed separately. Click "Send Reminder" to re-notify outstanding employees. Automatic escalation to their managers occurs 48 hours before the deadline.',
          screenshotKey: 'compliance/policy-step-5',
        },
        {
          number: 6,
          title: 'Close the campaign and export records',
          description:
            'Once the deadline passes or all employees have acknowledged, close the campaign. Export the acknowledgment log as a PDF with timestamps, employee names, and digital signatures for your compliance records.',
          screenshotKey: 'compliance/policy-step-6',
        },
      ],
    },
    {
      id: 'prepare-audit',
      title: 'Preparing for a Compliance Audit',
      description:
        'Collect evidence, verify requirement statuses, and generate audit-ready reports for external or internal auditors.',
      estimatedTime: '15 minutes',
      roles: ['owner', 'admin'],
      prerequisites: [
        'Compliance requirements must be up to date with evidence attached',
        'All policy acknowledgment campaigns for the audit period should be closed',
      ],
      steps: [
        {
          number: 1,
          title: 'Create an audit package',
          description:
            'Navigate to Compliance > Audits and click "New Audit Package". Select the framework being audited, the audit period, and the auditor (internal team or external firm).',
          screenshotKey: 'compliance/audit-step-1',
        },
        {
          number: 2,
          title: 'Review requirement statuses',
          description:
            'The audit package lists all requirements for the selected framework. Each requirement shows its current status (Compliant, Non-Compliant, In Progress, Not Assessed) and the last review date. Address any non-compliant items before the audit.',
          screenshotKey: 'compliance/audit-step-2',
        },
        {
          number: 3,
          title: 'Collect and attach evidence',
          description:
            'For each requirement, verify that the required evidence is uploaded and current. Use the "Auto-Collect" feature to pull relevant system logs, access reviews, and configuration snapshots directly from Tempo\'s audit trail.',
          screenshotKey: 'compliance/audit-step-3',
          tip: 'The Auto-Collect feature can pull evidence from connected modules such as access logs from Identity, training records from Learning, and policy acknowledgments from this module.',
        },
        {
          number: 4,
          title: 'Generate the audit report',
          description:
            'Click "Generate Report" to compile all requirements, statuses, evidence, and policy records into a single PDF document organized by the framework\'s control structure. The report includes an executive summary and detailed appendices.',
          screenshotKey: 'compliance/audit-step-4',
        },
        {
          number: 5,
          title: 'Share with auditors',
          description:
            'Click "Share" to generate a secure link for the audit package. Auditors can view requirements, evidence, and the report through a read-only portal without needing a Tempo account. All access is logged.',
          screenshotKey: 'compliance/audit-step-5',
        },
      ],
    },
    {
      id: 'monitor-regulatory-changes',
      title: 'Monitoring Regulatory Changes',
      description:
        'Use AI-powered regulatory monitoring to stay informed about changes to laws and regulations that affect your organization.',
      estimatedTime: '5 minutes',
      roles: ['owner', 'admin'],
      steps: [
        {
          number: 1,
          title: 'Open the Regulatory Monitor',
          description:
            'Navigate to Compliance > Regulatory Monitor. The dashboard shows recent regulatory changes relevant to your configured jurisdictions and frameworks.',
          screenshotKey: 'compliance/monitor-step-1',
        },
        {
          number: 2,
          title: 'Review flagged changes',
          description:
            'Each flagged change includes a summary of the regulation, the jurisdiction it applies to, the effective date, and an AI-generated impact assessment describing how it may affect your current compliance posture.',
          screenshotKey: 'compliance/monitor-step-2',
        },
        {
          number: 3,
          title: 'Create action items',
          description:
            'For changes that require action, click "Create Task" to generate a compliance task with a deadline. Assign the task to the relevant requirement owner. The task appears in their task list and is tracked on the compliance dashboard.',
          screenshotKey: 'compliance/monitor-step-3',
        },
        {
          number: 4,
          title: 'Dismiss or archive alerts',
          description:
            'For changes that do not apply to your organization, click "Dismiss" with a reason. Dismissed alerts are archived for audit purposes. You can refine the monitoring sensitivity in Settings > Compliance > Regulatory Monitor.',
          screenshotKey: 'compliance/monitor-step-4',
        },
      ],
    },
  ],

  faqs: [
    {
      question: 'What compliance frameworks does the module support out of the box?',
      answer:
        'Tempo includes pre-built templates for SOC 2 Type I and II, GDPR, ISO 27001, HIPAA, PCI DSS, and common labor law frameworks for 30+ countries. You can also create fully custom frameworks for internal policies or industry-specific regulations.',
    },
    {
      question: 'How does the audit trail work?',
      answer:
        'Every data access, modification, approval, and deletion across Tempo is logged in an immutable audit trail. Entries include the user, timestamp, IP address, action type, and before/after values for data changes. Audit logs are retained for 7 years by default (configurable per compliance requirement).',
    },
    {
      question: 'Can employees dispute a compliance task assigned to them?',
      answer:
        'Yes. Employees can flag a compliance task as "Disputed" with a comment explaining why they believe it is incorrectly assigned. The task returns to the assigner for review. Disputes are tracked in the audit log.',
    },
    {
      question: 'How does the AI regulatory change detection work?',
      answer:
        'Tempo monitors regulatory databases and official government gazette publications for jurisdictions you have configured. An AI model classifies changes by relevance to your active frameworks and generates plain-language summaries. You receive alerts for high-relevance changes and weekly digests for lower-priority updates.',
    },
    {
      question: 'Can I manage multiple audits simultaneously?',
      answer:
        'Yes. You can have multiple open audit packages for different frameworks or different audit periods. Each audit package operates independently with its own evidence collection, status tracking, and report generation.',
    },
    {
      question: 'Is the policy acknowledgment legally binding?',
      answer:
        'Policy acknowledgments in Tempo include a timestamped digital signature, the employee\'s IP address, and the exact document version they reviewed. While Tempo provides the technical infrastructure for acknowledgment tracking, consult your legal team regarding legal enforceability in your jurisdiction.',
    },
    {
      question: 'How do I handle compliance requirements for new countries when we expand?',
      answer:
        'When you add a new country in your organization settings, the Compliance module automatically suggests applicable regulatory frameworks and common labor law requirements for that jurisdiction. You can accept the suggestions and customize them to your specific obligations.',
    },
    {
      question: 'Can external auditors access the system directly?',
      answer:
        'External auditors access a read-only audit portal via a secure, time-limited link. They can view requirements, evidence, and reports but cannot modify any data. All auditor access is logged in the audit trail.',
    },
  ],

  tips: [
    'Schedule quarterly compliance reviews and use the built-in review workflow to ensure all requirements are reassessed regularly.',
    'Use the "Auto-Collect" evidence feature before every audit to minimize manual evidence gathering.',
    'Set up the regulatory monitor for all countries where you employ staff, even contractors, to catch relevant labor law changes.',
    'Tag compliance requirements with business-friendly names in addition to regulation codes so non-legal staff can understand their responsibilities.',
    'Export the compliance dashboard as a PDF monthly and share it with your board or compliance committee.',
    'Create a "New Employee Compliance" task template that is automatically assigned when someone joins, covering policy acknowledgments, data handling training, and security awareness.',
  ],

  relatedModules: ['documents', 'analytics', 'settings', 'onboarding'],

  permissions: [
    {
      role: 'Owner',
      capabilities: [
        'Create, edit, and delete compliance frameworks and requirements',
        'Configure regulatory monitoring settings and jurisdictions',
        'Create and manage audit packages and share with external auditors',
        'View the complete immutable audit trail',
        'Manage policy documents and acknowledgment campaigns',
      ],
    },
    {
      role: 'Admin',
      capabilities: [
        'Create and edit compliance requirements and evidence',
        'Run policy acknowledgment campaigns',
        'Generate audit reports and evidence packages',
        'View audit trail entries for all modules',
        'Manage compliance tasks and assignments',
      ],
    },
    {
      role: 'HRBP',
      capabilities: [
        'View compliance requirements for assigned departments',
        'Run policy acknowledgment campaigns for assigned employees',
        'Upload evidence for requirements they own',
        'View policy acknowledgment completion rates',
      ],
    },
    {
      role: 'Manager',
      capabilities: [
        'View compliance tasks assigned to them and their team',
        'Acknowledge policies on behalf of their team (with delegation)',
        'View compliance status summary for own department',
      ],
    },
    {
      role: 'Employee',
      capabilities: [
        'View and acknowledge assigned policies',
        'Complete compliance tasks assigned to them',
        'View their own compliance task history',
      ],
    },
  ],
}

export default compliance
