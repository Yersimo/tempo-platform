import type { ModuleDoc } from '../../types'

const workersComp: ModuleDoc = {
  slug: 'workers-comp',
  title: "Workers' Compensation",
  subtitle: 'Claims management, workplace incident tracking, return-to-work programs, and safety compliance',
  icon: 'ShieldCheck',
  group: 'operations',
  lastUpdated: '2026-03-13',
  version: '1.0',

  overview: {
    description:
      "The Workers' Compensation module provides end-to-end management of workplace injuries, illness claims, and return-to-work programs. Employees and managers report incidents through structured forms that capture all required regulatory details. Claims are tracked from initial report through medical treatment, benefit payments, and resolution. Return-to-work coordinators manage modified duty assignments and physician clearances. The module generates OSHA-required logs and integrates with insurance carriers for seamless claims processing.",
    keyFeatures: [
      'Digital incident reporting with structured injury/illness classification',
      'Claims lifecycle management from report to resolution',
      'Integration with insurance carriers for electronic claims submission',
      'Return-to-work program management with modified duty tracking',
      'OSHA 300/300A/301 log generation and electronic filing',
      'Physician clearance tracking with work restriction documentation',
      'Incident investigation workflows with root cause analysis',
      'Safety analytics dashboard with incident rates, trends, and heat maps',
    ],
    screenshotKey: 'workers-comp/overview',
  },

  workflows: [
    {
      id: 'report-incident',
      title: 'Reporting a Workplace Incident',
      description:
        'File an incident report when a workplace injury or illness occurs, capturing all required details for regulatory compliance and claims processing.',
      estimatedTime: '10 minutes',
      roles: ['employee', 'manager'],
      steps: [
        {
          number: 1,
          title: "Open Workers' Compensation",
          description:
            "Navigate to Workers' Compensation in the left sidebar. The main view shows active claims, recent incidents, and safety metrics.",
          screenshotKey: 'workers-comp/report-step-1',
        },
        {
          number: 2,
          title: 'Start a new incident report',
          description:
            'Click "+ Report Incident." Enter the injured employee\'s name (or select yourself), the date and time of the incident, and the exact location where it occurred.',
          screenshotKey: 'workers-comp/report-step-2',
          tip: 'Report all incidents as soon as possible — many jurisdictions require reporting within 24 hours of the injury or illness onset.',
        },
        {
          number: 3,
          title: 'Describe the incident',
          description:
            'Provide a detailed description of what happened, including the activity being performed, the cause of injury (slip, fall, repetitive motion, exposure), the body part affected, and the nature of the injury (fracture, sprain, laceration, burn).',
          screenshotKey: 'workers-comp/report-step-3',
        },
        {
          number: 4,
          title: 'Document witnesses and immediate actions',
          description:
            'List any witnesses with their names and contact information. Describe immediate actions taken: first aid administered, medical treatment sought, area secured, and whether the employee left work.',
          screenshotKey: 'workers-comp/report-step-4',
        },
        {
          number: 5,
          title: 'Submit the report',
          description:
            'Review the completed report and click "Submit." The report is timestamped and routed to the designated safety officer, HR admin, and the employee\'s manager. If the incident meets reporting thresholds, it is automatically added to the OSHA log.',
          screenshotKey: 'workers-comp/report-step-5',
        },
      ],
    },
    {
      id: 'manage-claim',
      title: 'Managing a Workers\' Compensation Claim',
      description:
        'Track a claim through the lifecycle: initial report, medical documentation, insurance submission, benefit payments, and resolution.',
      estimatedTime: '10 minutes',
      roles: ['admin', 'hrbp'],
      steps: [
        {
          number: 1,
          title: 'Open the claim',
          description:
            'Navigate to the Claims tab and click on the claim to open its detail view. The claim summary shows the employee, incident date, injury type, current status, and assigned claims coordinator.',
          screenshotKey: 'workers-comp/claim-step-1',
        },
        {
          number: 2,
          title: 'Add medical documentation',
          description:
            'Upload medical reports, physician notes, and treatment records. Each document is linked to the claim timeline. Record the treating physician, diagnosis, recommended treatment plan, and any work restrictions.',
          screenshotKey: 'workers-comp/claim-step-2',
        },
        {
          number: 3,
          title: 'Submit to insurance carrier',
          description:
            'Click "Submit to Carrier" to electronically transmit the claim to your workers\' compensation insurance provider. The system packages the incident report, medical documentation, and employee information in the carrier\'s required format.',
          screenshotKey: 'workers-comp/claim-step-3',
          tip: 'Submit claims to the carrier within 48 hours of receiving the incident report to avoid late-filing penalties.',
        },
        {
          number: 4,
          title: 'Track benefit payments',
          description:
            'As the carrier processes the claim, track wage replacement payments, medical bill payments, and any lump-sum settlements. The system maintains a ledger of all payments made on the claim.',
          screenshotKey: 'workers-comp/claim-step-4',
        },
        {
          number: 5,
          title: 'Close the claim',
          description:
            'When the employee returns to full duty and all benefits are settled, update the claim status to "Closed." Enter the resolution type (return to work, settlement, permanent disability). The closed claim remains in the system for regulatory retention.',
          screenshotKey: 'workers-comp/claim-step-5',
        },
      ],
    },
    {
      id: 'return-to-work',
      title: 'Managing Return-to-Work Programs',
      description:
        'Coordinate an employee\'s return to work after an injury with modified duty assignments, physician clearances, and progress monitoring.',
      estimatedTime: '10 minutes',
      roles: ['admin', 'hrbp', 'manager'],
      steps: [
        {
          number: 1,
          title: 'Initiate the return-to-work plan',
          description:
            'From the claim detail view, click "Create Return-to-Work Plan." The system displays the physician\'s work restrictions (e.g., no lifting over 10 lbs, limited standing, no use of right hand) as the basis for the plan.',
          screenshotKey: 'workers-comp/rtw-step-1',
        },
        {
          number: 2,
          title: 'Define modified duty assignments',
          description:
            'Identify tasks the employee can perform within their restrictions. Enter the modified job duties, work schedule (full-time or reduced hours), and duration of the modified duty period.',
          screenshotKey: 'workers-comp/rtw-step-2',
          tip: 'Collaborate with the employee\'s manager to identify meaningful modified duty tasks that contribute to the team rather than make-work assignments.',
        },
        {
          number: 3,
          title: 'Schedule physician follow-ups',
          description:
            'Enter dates for follow-up physician appointments. After each visit, update the work restrictions based on the physician\'s assessment. The plan adjusts automatically to reflect new clearances.',
          screenshotKey: 'workers-comp/rtw-step-3',
        },
        {
          number: 4,
          title: 'Track progress',
          description:
            'Monitor the employee\'s return-to-work progress on the plan dashboard. Record any complications, restriction changes, or setbacks. The manager provides weekly updates on the employee\'s functional capability.',
          screenshotKey: 'workers-comp/rtw-step-4',
        },
        {
          number: 5,
          title: 'Full duty release',
          description:
            'When the physician provides a full duty release, upload the clearance document. Update the plan status to "Full Duty Returned." The employee\'s regular work schedule and duties are restored in the system.',
          screenshotKey: 'workers-comp/rtw-step-5',
        },
      ],
    },
    {
      id: 'investigate-incident',
      title: 'Conducting an Incident Investigation',
      description:
        'Investigate a workplace incident to identify root causes and implement corrective actions to prevent recurrence.',
      estimatedTime: '15 minutes',
      roles: ['admin', 'hrbp', 'manager'],
      steps: [
        {
          number: 1,
          title: 'Open the investigation form',
          description:
            'From the incident report, click "Investigate." The investigation form guides you through a structured root cause analysis methodology.',
          screenshotKey: 'workers-comp/investigate-step-1',
        },
        {
          number: 2,
          title: 'Collect evidence',
          description:
            'Document the investigation evidence: photos of the incident scene, equipment inspection results, witness statements, surveillance footage, and environmental conditions at the time of the incident.',
          screenshotKey: 'workers-comp/investigate-step-2',
        },
        {
          number: 3,
          title: 'Identify root causes',
          description:
            'Use the 5-Why analysis or fishbone diagram tool to identify contributing factors: equipment failure, inadequate training, missing safeguards, procedure violations, or environmental hazards. Classify each cause.',
          screenshotKey: 'workers-comp/investigate-step-3',
        },
        {
          number: 4,
          title: 'Recommend corrective actions',
          description:
            'For each root cause, define a corrective action: equipment repair, additional training, updated procedures, new safety equipment, or physical modifications. Assign an owner and target completion date for each action.',
          screenshotKey: 'workers-comp/investigate-step-4',
          tip: 'Prioritize corrective actions that eliminate the hazard entirely over those that only reduce exposure or rely on employee behavior.',
        },
        {
          number: 5,
          title: 'Finalize and track',
          description:
            'Submit the investigation report. Corrective actions appear in the Safety Action Items queue where assigned owners track completion. Follow up to verify that corrective actions are effective.',
          screenshotKey: 'workers-comp/investigate-step-5',
        },
      ],
    },
  ],

  faqs: [
    {
      question: 'Who should report a workplace incident?',
      answer:
        'Either the injured employee or their manager can file an incident report. If the employee is unable to report (e.g., due to the severity of the injury), the manager or a coworker who witnessed the incident should file the report on their behalf. All incidents should be reported, even if no medical treatment is needed at the time.',
    },
    {
      question: 'What is the OSHA 300 log and when is it required?',
      answer:
        'The OSHA 300 log is a record of work-related injuries and illnesses required by the Occupational Safety and Health Administration for employers with more than 10 employees. Tempo automatically populates the OSHA 300, 300A (annual summary), and 301 (individual incident) forms from your incident reports. The 300A summary must be posted in the workplace from February 1 through April 30 each year.',
    },
    {
      question: 'How quickly must an incident be reported?',
      answer:
        'Tempo recommends reporting all incidents within 24 hours. However, regulatory deadlines vary: OSHA requires fatalities to be reported within 8 hours and in-patient hospitalizations, amputations, or eye loss within 24 hours. State workers\' compensation filing deadlines range from immediately to 10 days depending on jurisdiction.',
    },
    {
      question: 'Can employees track the status of their claim?',
      answer:
        'Yes. Employees can view their claim status, benefit payment history, and return-to-work plan from their personal dashboard. They cannot see internal investigation notes or insurance correspondence. Claim status updates trigger automatic notifications to the employee.',
    },
    {
      question: 'What happens if an employee cannot return to their previous role?',
      answer:
        'If permanent restrictions prevent a return to the original role, the return-to-work coordinator works with HR to identify alternative positions that accommodate the restrictions. If no suitable position exists, the claim may be resolved through a permanent disability settlement in coordination with the insurance carrier.',
    },
    {
      question: 'How does the system handle recurring or repetitive motion injuries?',
      answer:
        'Repetitive motion injuries (RSI, carpal tunnel, etc.) are reported through the same incident form with "Repetitive Motion" as the cause category. The system records the onset date, affected tasks, and ergonomic assessment results. These claims follow the same lifecycle as acute injuries but may have longer investigation and return-to-work timelines.',
    },
    {
      question: 'Are near-misses tracked in the system?',
      answer:
        'Yes. Near-miss incidents (events that could have caused injury but did not) can be reported using the same incident form with a "Near Miss" classification. Near-misses do not generate claims but feed into the safety analytics to identify hazardous conditions before injuries occur.',
    },
  ],

  tips: [
    'Encourage a culture of immediate incident reporting — even minor injuries should be documented to protect both the employee and the organization.',
    'Review the safety analytics dashboard monthly to identify workplace areas with the highest incident rates and prioritize corrective actions there.',
    'Maintain close communication with the injured employee throughout the claim process — employees who feel supported return to work faster and are less likely to pursue litigation.',
    'Use the near-miss reporting feature proactively — analyzing near-misses can prevent serious injuries from occurring.',
    'Run the OSHA 300 log report at the end of each quarter to catch any missing entries before the annual posting deadline.',
    'Integrate return-to-work plans with the Time & Attendance module so modified schedules are automatically reflected in the employee\'s timesheet.',
  ],

  relatedModules: ['people', 'time-attendance', 'payroll', 'dashboard'],

  permissions: [
    {
      role: 'Owner',
      capabilities: [
        'Full access to all incident reports, claims, and safety analytics',
        'Configure workers\' compensation policies and insurance carrier integrations',
        'Approve claim settlements and permanent disability determinations',
        'Generate and file OSHA reports and regulatory submissions',
      ],
    },
    {
      role: 'Admin',
      capabilities: [
        'Manage incident reports and workers\' compensation claims',
        'Submit claims to insurance carriers and track payments',
        'Create and manage return-to-work programs',
        'Generate OSHA 300/300A/301 logs and safety analytics reports',
        'Conduct and document incident investigations',
      ],
    },
    {
      role: 'HRBP',
      capabilities: [
        'View and manage claims for employees in assigned departments',
        'Coordinate return-to-work plans with managers',
        'Monitor claim status and benefit payments for assigned employees',
        'Participate in incident investigations for assigned departments',
      ],
    },
    {
      role: 'Manager',
      capabilities: [
        'Report incidents involving direct reports or observed events',
        'Participate in incident investigations and provide witness statements',
        'Manage modified duty assignments for returning employees',
        'View claim status for their direct reports (limited detail)',
      ],
    },
    {
      role: 'Employee',
      capabilities: [
        'Report workplace incidents and injuries (self or witnessed)',
        'View personal claim status and benefit payment history',
        'Access return-to-work plan and modified duty details',
        'Upload medical documentation and physician clearances',
      ],
    },
  ],
}

export default workersComp
