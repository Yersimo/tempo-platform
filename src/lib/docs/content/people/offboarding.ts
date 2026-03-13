import type { ModuleDoc } from '../../types'

const offboarding: ModuleDoc = {
  slug: 'offboarding',
  title: 'Offboarding',
  subtitle: 'Structured exit processes, knowledge transfer, device recovery, access revocation, and exit interviews',
  icon: 'UserMinus',
  group: 'people',
  lastUpdated: '2026-03-13',
  version: '1.0',

  overview: {
    description:
      'The Offboarding module ensures departing employees have a smooth, respectful exit while protecting organizational knowledge, assets, and security. Automated checklists coordinate tasks across HR, IT, Finance, and the departing employee\'s manager. Knowledge transfer workflows capture critical information before departure. Device and access revocation processes prevent security gaps. Exit interviews collect candid feedback that feeds into engagement analytics.',
    keyFeatures: [
      'Automated offboarding checklists with task assignment by role (HR, IT, Manager, Finance)',
      'Knowledge transfer templates with documentation and handover scheduling',
      'IT asset recovery tracking for devices, licenses, and access badges',
      'System access revocation with integration to identity providers',
      'Exit interview scheduling with structured and open-ended questionnaires',
      'Final pay calculation with unused PTO payout and benefit continuation notices',
      'Alumni network enrollment for maintaining professional connections',
      'Offboarding analytics with trend reporting on exit reasons',
    ],
    screenshotKey: 'offboarding/overview',
  },

  workflows: [
    {
      id: 'initiate-offboarding',
      title: 'Initiating an Offboarding Process',
      description:
        'Start the offboarding workflow when an employee resignation or termination is confirmed, triggering automated task creation across all involved teams.',
      estimatedTime: '10 minutes',
      roles: ['admin', 'hrbp', 'manager'],
      steps: [
        {
          number: 1,
          title: 'Open the Offboarding module',
          description:
            'Navigate to Offboarding in the left sidebar. The main view shows active offboarding cases, upcoming last days, and completed exits.',
          screenshotKey: 'offboarding/initiate-step-1',
        },
        {
          number: 2,
          title: 'Create an offboarding case',
          description:
            'Click "+ New Offboarding." Select the departing employee and enter the separation type (voluntary resignation, involuntary termination, retirement, contract end), last working day, and reason for departure.',
          screenshotKey: 'offboarding/initiate-step-2',
          tip: 'Start the offboarding process as soon as the departure is confirmed — many tasks require lead time before the last day.',
        },
        {
          number: 3,
          title: 'Select the offboarding template',
          description:
            'Choose an offboarding template appropriate for the role and separation type. Templates pre-populate a checklist of tasks assigned to HR, IT, the manager, Finance, and the departing employee. Customize tasks as needed.',
          screenshotKey: 'offboarding/initiate-step-3',
        },
        {
          number: 4,
          title: 'Notify stakeholders',
          description:
            'Click "Launch Offboarding" to activate the checklist. Notifications are sent to all task owners with their specific responsibilities and deadlines. The manager receives a summary of the entire offboarding plan.',
          screenshotKey: 'offboarding/initiate-step-4',
        },
        {
          number: 5,
          title: 'Monitor progress',
          description:
            'Track checklist completion on the offboarding dashboard. Tasks are grouped by responsible team with status indicators. Overdue tasks trigger escalation notifications to the HRBP.',
          screenshotKey: 'offboarding/initiate-step-5',
        },
      ],
    },
    {
      id: 'knowledge-transfer',
      title: 'Managing Knowledge Transfer',
      description:
        'Ensure critical knowledge, documentation, and relationships are transferred to remaining team members before the employee departs.',
      estimatedTime: '15 minutes',
      roles: ['manager', 'hrbp'],
      steps: [
        {
          number: 1,
          title: 'Open the Knowledge Transfer section',
          description:
            'From the offboarding case, click the "Knowledge Transfer" tab. The system displays a template with categories: Projects & Tasks, Documentation, Key Contacts, Systems & Tools, and Recurring Responsibilities.',
          screenshotKey: 'offboarding/knowledge-step-1',
        },
        {
          number: 2,
          title: 'Identify transfer items',
          description:
            'Work with the departing employee to list all critical knowledge areas. For each item, specify what needs to be documented, who will receive the knowledge, and the transfer method (document, meeting, shadowing).',
          screenshotKey: 'offboarding/knowledge-step-2',
        },
        {
          number: 3,
          title: 'Assign recipients and schedule handovers',
          description:
            'Assign a recipient for each knowledge item. Schedule handover meetings using the calendar integration. The system creates calendar events for both parties with the agenda and relevant documentation links.',
          screenshotKey: 'offboarding/knowledge-step-3',
          tip: 'Distribute knowledge across multiple team members rather than loading everything onto one person.',
        },
        {
          number: 4,
          title: 'Track completion',
          description:
            'Recipients confirm each knowledge transfer is complete by checking off the item. The manager reviews the overall transfer status and follows up on any gaps before the last day.',
          screenshotKey: 'offboarding/knowledge-step-4',
        },
        {
          number: 5,
          title: 'Archive documentation',
          description:
            'All knowledge transfer documents are stored in the offboarding case record and linked to the team\'s shared workspace, ensuring the information remains accessible after the employee departs.',
          screenshotKey: 'offboarding/knowledge-step-5',
        },
      ],
    },
    {
      id: 'recover-assets',
      title: 'Recovering Devices and Revoking Access',
      description:
        'Track the return of company devices, revoke system access, and deactivate accounts to maintain security.',
      estimatedTime: '5 minutes',
      roles: ['admin'],
      steps: [
        {
          number: 1,
          title: 'Review the asset inventory',
          description:
            'The offboarding case automatically pulls the employee\'s assigned assets from IT inventory: laptop, phone, monitors, access badges, parking passes, and corporate credit cards.',
          screenshotKey: 'offboarding/assets-step-1',
        },
        {
          number: 2,
          title: 'Schedule asset collection',
          description:
            'For on-site employees, schedule an in-person collection. For remote employees, generate a prepaid shipping label and send return instructions. The system tracks shipment status via carrier integration.',
          screenshotKey: 'offboarding/assets-step-2',
        },
        {
          number: 3,
          title: 'Revoke system access',
          description:
            'On the last working day, the system automatically triggers access revocation for all connected identity providers (Google Workspace, Azure AD, Okta). The IT team confirms that email, VPN, and application access has been disabled.',
          screenshotKey: 'offboarding/assets-step-3',
          tip: 'Schedule access revocation for end of business on the last day — revoking too early can disrupt final knowledge transfer tasks.',
        },
        {
          number: 4,
          title: 'Confirm asset receipt and close',
          description:
            'When all assets are returned, IT marks each item as received. The offboarding case status updates to reflect completion. Any missing or damaged items are flagged for follow-up.',
          screenshotKey: 'offboarding/assets-step-4',
        },
      ],
    },
    {
      id: 'conduct-exit-interview',
      title: 'Conducting an Exit Interview',
      description:
        'Schedule and conduct a structured exit interview to collect candid feedback from the departing employee.',
      estimatedTime: '5 minutes',
      roles: ['hrbp', 'admin'],
      steps: [
        {
          number: 1,
          title: 'Schedule the exit interview',
          description:
            'From the offboarding case, click "Schedule Exit Interview." Select the interviewer (typically the HRBP, not the direct manager) and propose time slots during the employee\'s notice period.',
          screenshotKey: 'offboarding/exit-interview-step-1',
        },
        {
          number: 2,
          title: 'Select the interview questionnaire',
          description:
            'Choose from predefined exit interview templates or customize the questions. Standard topics include reasons for leaving, management feedback, culture assessment, and suggestions for improvement.',
          screenshotKey: 'offboarding/exit-interview-step-2',
          tip: 'Having someone other than the direct manager conduct the exit interview encourages more honest and candid feedback.',
        },
        {
          number: 3,
          title: 'Conduct and record the interview',
          description:
            'During the interview, record responses directly in the system. Use the structured form for rated questions and the notes section for open-ended discussion. The employee can optionally submit a written questionnaire instead of or in addition to the live interview.',
          screenshotKey: 'offboarding/exit-interview-step-3',
        },
        {
          number: 4,
          title: 'Review and analyze feedback',
          description:
            'Exit interview data feeds into the Engagement module\'s analytics. Over time, patterns in exit reasons, management feedback, and culture scores help identify systemic issues that drive attrition.',
          screenshotKey: 'offboarding/exit-interview-step-4',
        },
      ],
    },
  ],

  faqs: [
    {
      question: 'When should the offboarding process be initiated?',
      answer:
        'Start the offboarding process as soon as the departure is confirmed — ideally on the same day the resignation is received or the termination decision is made. Early initiation gives all teams sufficient time to complete their tasks before the last working day.',
    },
    {
      question: 'Can the offboarding checklist be customized per department?',
      answer:
        'Yes. Admins can create multiple offboarding templates tailored to different departments, roles, or separation types. For example, an engineering offboarding template might include code repository access revocation, while a sales template might include CRM account handover.',
    },
    {
      question: 'How is final pay calculated?',
      answer:
        'The offboarding module calculates final pay by integrating with Payroll. It includes regular pay through the last working day, unused PTO payout (based on company policy), any pro-rated bonuses, and expense reimbursements. The calculation is reviewed by Finance before processing.',
    },
    {
      question: 'What happens to the employee\'s data after offboarding?',
      answer:
        'The employee\'s profile is deactivated but retained according to your data retention policy. Historical records (performance reviews, payroll, documents) remain accessible for compliance purposes. Personal data can be anonymized after the retention period expires, in compliance with GDPR and local regulations.',
    },
    {
      question: 'Can a departing employee access the alumni network?',
      answer:
        'If your organization enables the alumni feature, departing employees receive an invitation to join the alumni network during offboarding. Alumni have limited access to company job postings, events, and a directory of other alumni. This helps maintain professional connections.',
    },
    {
      question: 'Who can see exit interview responses?',
      answer:
        'Exit interview responses are confidential and visible only to HRBPs, HR Admins, and the assigned interviewer. The departing employee\'s direct manager does not have access to the raw responses. Aggregated insights are shared through the Engagement analytics dashboard without individual attribution.',
    },
    {
      question: 'How are involuntary terminations handled differently?',
      answer:
        'Involuntary terminations use a separate template with additional steps: legal review, severance calculation, final documentation signing, and immediate access revocation. The timeline is typically compressed, and IT is notified to revoke access on the termination date rather than the end of a notice period.',
    },
  ],

  tips: [
    'Create separate offboarding templates for voluntary and involuntary separations — the processes, timelines, and security requirements differ significantly.',
    'Schedule knowledge transfer sessions early in the notice period to allow time for questions and follow-ups.',
    'Use the exit interview trends report to identify patterns — if multiple employees in a department cite the same reason for leaving, it warrants attention.',
    'Automate access revocation by integrating with your identity provider so accounts are disabled on the last day without manual intervention.',
    'Include a "warm handoff" task for client-facing roles so customers experience a smooth transition to their new point of contact.',
    'Send the departing employee a summary of their benefits continuation options (COBRA, pension rollover) before their last day.',
  ],

  relatedModules: ['people', 'payroll', 'engagement', 'identity'],

  permissions: [
    {
      role: 'Owner',
      capabilities: [
        'Initiate and manage offboarding for any employee',
        'Configure offboarding templates and approval workflows',
        'Access all exit interview data and offboarding analytics',
        'Set data retention and anonymization policies',
      ],
    },
    {
      role: 'Admin',
      capabilities: [
        'Initiate and manage offboarding processes',
        'Configure offboarding templates and checklist items',
        'Coordinate asset recovery and access revocation with IT',
        'Process final pay calculations with Finance',
      ],
    },
    {
      role: 'HRBP',
      capabilities: [
        'Initiate offboarding for employees in assigned departments',
        'Conduct exit interviews and record feedback',
        'Monitor offboarding checklist completion for assigned cases',
        'View exit interview analytics for assigned departments',
      ],
    },
    {
      role: 'Manager',
      capabilities: [
        'View the offboarding checklist for their departing direct report',
        'Complete manager-assigned tasks (knowledge transfer, handover scheduling)',
        'Provide input on the offboarding timeline and knowledge transfer plan',
      ],
    },
  ],
}

export default offboarding
