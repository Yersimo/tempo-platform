import type { ModuleDoc } from '../../types'

const performance: ModuleDoc = {
  slug: 'performance',
  title: 'Performance',
  subtitle: 'Goal setting, performance reviews, 360-degree feedback, performance improvement plans, and peer recognition',
  icon: 'TrendingUp',
  group: 'people',
  lastUpdated: '2026-03-13',
  version: '1.0',

  overview: {
    description:
      'The Performance module provides a comprehensive framework for setting goals, conducting reviews, collecting multi-source feedback, managing improvement plans, and recognizing outstanding contributions. It supports continuous performance management with quarterly check-ins as well as traditional annual review cycles. Managers, HRBPs, and employees collaborate through a shared interface that keeps goals visible, feedback actionable, and calibration data consistent across the organization.',
    keyFeatures: [
      'OKR and SMART goal creation with cascading alignment to company objectives',
      'Configurable review cycles with multi-step workflows (self, manager, peer, upward)',
      '360-degree feedback with anonymity controls and aggregated reporting',
      'Performance Improvement Plans (PIPs) with milestones, check-ins, and outcomes',
      'Peer recognition with badges, points, and a public activity feed',
      'Calibration sessions with drag-and-drop rating grids for leadership teams',
      'Performance-compensation linking for merit cycle integration',
      'Historical performance timeline with trend visualization',
    ],
    screenshotKey: 'performance/overview',
  },

  workflows: [
    {
      id: 'set-goals',
      title: 'Setting Goals and OKRs',
      description:
        'Create individual goals aligned to team and company objectives, with measurable key results and progress tracking.',
      estimatedTime: '10 minutes',
      roles: ['employee', 'manager', 'hrbp'],
      steps: [
        {
          number: 1,
          title: 'Navigate to Goals',
          description:
            'Open the Performance module and click the "Goals" tab. Your current goals are displayed with progress bars. Managers also see their direct reports\' goals.',
          screenshotKey: 'performance/goals-step-1',
        },
        {
          number: 2,
          title: 'Create a new goal',
          description:
            'Click "+ New Goal." Enter the goal title, description, category (Individual, Team, or Company), and due date. Select the goal framework: OKR (Objective and Key Results) or SMART.',
          screenshotKey: 'performance/goals-step-2',
          tip: 'Align your goal to a parent objective using the "Align to" dropdown to show how your work contributes to broader company strategy.',
        },
        {
          number: 3,
          title: 'Define key results or success criteria',
          description:
            'For OKRs, add 2-5 measurable key results with target values and units (percentage, number, currency). For SMART goals, describe the specific, measurable success criteria.',
          screenshotKey: 'performance/goals-step-3',
        },
        {
          number: 4,
          title: 'Set weight and visibility',
          description:
            'Assign a weight to each goal (weights should total 100% across all your goals). Choose visibility: Private (you and your manager), Team (your department), or Public (entire organization).',
          screenshotKey: 'performance/goals-step-4',
        },
        {
          number: 5,
          title: 'Submit for manager review',
          description:
            'Click "Submit for Review." Your manager receives a notification to approve, suggest edits, or discuss the goals in your next one-on-one. Goals remain in draft until approved.',
          screenshotKey: 'performance/goals-step-5',
        },
      ],
    },
    {
      id: 'conduct-review',
      title: 'Conducting a Performance Review',
      description:
        'Complete the end-to-end performance review process, including self-assessment, manager evaluation, and finalization.',
      estimatedTime: '15 minutes',
      roles: ['employee', 'manager', 'hrbp', 'admin'],
      steps: [
        {
          number: 1,
          title: 'Open the review cycle',
          description:
            'When a review cycle is active, a banner appears on the Performance module prompting you to complete your assessment. Click "Start Review" to begin.',
          screenshotKey: 'performance/review-step-1',
        },
        {
          number: 2,
          title: 'Complete the self-assessment',
          description:
            'Rate yourself on each competency and goal using the defined scale (e.g., 1-5). Provide written commentary for each rating, citing specific accomplishments or areas for development.',
          screenshotKey: 'performance/review-step-2',
        },
        {
          number: 3,
          title: 'Request peer feedback (if applicable)',
          description:
            'If the review cycle includes 360 feedback, select 3-5 peers to provide input. Peers receive a notification with the feedback form. Their responses are collected anonymously and aggregated.',
          screenshotKey: 'performance/review-step-3',
          tip: 'Select peers who have directly collaborated with you on projects during the review period for the most actionable feedback.',
        },
        {
          number: 4,
          title: 'Manager completes their evaluation',
          description:
            'The manager reviews the self-assessment, peer feedback, and goal progress. They rate each competency, provide written commentary, and assign an overall performance rating.',
          screenshotKey: 'performance/review-step-4',
        },
        {
          number: 5,
          title: 'Hold the review conversation',
          description:
            'Schedule a one-on-one meeting to discuss the review. Both parties can see each other\'s ratings side by side. The manager may adjust ratings based on the conversation before finalizing.',
          screenshotKey: 'performance/review-step-5',
        },
        {
          number: 6,
          title: 'Finalize and acknowledge',
          description:
            'The manager clicks "Finalize Review." The employee receives the final review and clicks "Acknowledge" to confirm they have read it. Acknowledgment does not imply agreement.',
          screenshotKey: 'performance/review-step-6',
        },
      ],
    },
    {
      id: 'create-pip',
      title: 'Creating a Performance Improvement Plan',
      description:
        'Set up a structured PIP with clear expectations, milestones, check-in cadence, and success criteria.',
      estimatedTime: '15 minutes',
      roles: ['manager', 'hrbp', 'admin'],
      steps: [
        {
          number: 1,
          title: 'Initiate the PIP',
          description:
            'Navigate to the employee\'s profile in the Performance module. Click "Actions" > "Create PIP." A guided form walks you through the setup process.',
          screenshotKey: 'performance/pip-step-1',
        },
        {
          number: 2,
          title: 'Define improvement areas',
          description:
            'Specify the performance gaps being addressed. Reference specific competencies, goals, or behaviors that fall below expectations. Link to recent review data for evidence.',
          screenshotKey: 'performance/pip-step-2',
        },
        {
          number: 3,
          title: 'Set milestones and timeline',
          description:
            'Add 3-5 milestones with clear, measurable success criteria and due dates. Typical PIP durations are 30, 60, or 90 days. Each milestone should have a defined check-in meeting.',
          screenshotKey: 'performance/pip-step-3',
          tip: 'Involve the HRBP early in the PIP process to ensure the plan is fair, documented, and legally defensible.',
        },
        {
          number: 4,
          title: 'Specify support resources',
          description:
            'List the resources available to the employee: training courses, mentoring assignments, additional one-on-ones, or reduced workload. This demonstrates organizational commitment to the employee\'s success.',
          screenshotKey: 'performance/pip-step-4',
        },
        {
          number: 5,
          title: 'Submit for HRBP review and employee acknowledgment',
          description:
            'Submit the PIP for HRBP review. Once approved, the plan is shared with the employee who must acknowledge receipt. The PIP status, check-in notes, and milestone completions are tracked in the system.',
          screenshotKey: 'performance/pip-step-5',
        },
      ],
    },
    {
      id: 'give-recognition',
      title: 'Giving Peer Recognition',
      description:
        'Recognize a colleague\'s contribution with a badge, points, or a public shout-out visible to the team or organization.',
      estimatedTime: '2 minutes',
      roles: ['owner', 'admin', 'hrbp', 'manager', 'employee'],
      steps: [
        {
          number: 1,
          title: 'Open the Recognition feed',
          description:
            'Click the "Recognition" tab in the Performance module. The feed shows recent recognitions across the organization with the recipient, badge, message, and reactions.',
          screenshotKey: 'performance/recognition-step-1',
        },
        {
          number: 2,
          title: 'Click "Give Recognition"',
          description:
            'Click the "+ Recognize" button. Search for the colleague you want to recognize. You can recognize one person or multiple people for a team effort.',
          screenshotKey: 'performance/recognition-step-2',
        },
        {
          number: 3,
          title: 'Select a badge and write a message',
          description:
            'Choose a badge category (e.g., Innovation, Teamwork, Customer Focus, Above & Beyond). Write a message describing what the person did and why it matters. The message is visible on the public feed.',
          screenshotKey: 'performance/recognition-step-3',
          tip: 'Be specific about the behavior or outcome you are recognizing — vague praise is less motivating than detailed acknowledgment.',
        },
        {
          number: 4,
          title: 'Submit and notify',
          description:
            'Click "Send Recognition." The recipient receives an in-app and email notification. The recognition appears on the public feed and on the recipient\'s profile. Points are automatically awarded if your organization uses a points-based program.',
          screenshotKey: 'performance/recognition-step-4',
        },
      ],
    },
  ],

  faqs: [
    {
      question: 'How often are performance reviews conducted?',
      answer:
        'Review frequency is configured by your organization. Common cadences include annual, semi-annual, and quarterly reviews. Admins set up review cycles in Settings > Performance > Review Cycles. Employees receive notifications when a cycle opens and reminders as the deadline approaches.',
    },
    {
      question: 'Can I update my goals mid-cycle?',
      answer:
        'Yes. Goals can be edited at any time before the review cycle closes. Changes are tracked with a version history so both you and your manager can see how goals evolved. Significant changes (e.g., removing a goal) require manager approval.',
    },
    {
      question: 'Who can see my performance review?',
      answer:
        'By default, your review is visible to you, your direct manager, your skip-level manager, and the assigned HRBP. Admins can configure additional visibility rules. Peer feedback is always presented in aggregated, anonymized form to protect reviewer identity.',
    },
    {
      question: 'What is calibration and how does it work?',
      answer:
        'Calibration is a process where leadership teams review and normalize performance ratings across the organization to ensure fairness and consistency. Managers present their ratings in a calibration session using a 9-box grid. Ratings can be adjusted based on cross-team comparisons.',
    },
    {
      question: 'Can I dispute my performance rating?',
      answer:
        'Yes. After acknowledging your review, you can submit a written response that is permanently attached to the review record. If you believe the rating is unfair, contact your HRBP to initiate a formal review dispute process as defined by your organization\'s policy.',
    },
    {
      question: 'How do recognition points work?',
      answer:
        'If your organization enables the points program, each recognition badge awards a configurable number of points to the recipient. Points accumulate and can be redeemed for rewards defined by your organization (gift cards, extra PTO, charitable donations). Point balances and history are visible on your profile.',
    },
    {
      question: 'Does performance data affect compensation decisions?',
      answer:
        'Performance ratings can be linked to the Compensation module to inform merit increase recommendations. However, this connection must be explicitly enabled by an Admin. When linked, the compensation review workflow displays the employee\'s latest rating alongside the proposed adjustment.',
    },
    {
      question: 'How long is a typical PIP?',
      answer:
        'Most PIPs last 30 to 90 days depending on the severity of the performance gaps and organizational policy. The PIP creator sets the duration during setup. Extensions can be granted by the HRBP if the employee demonstrates meaningful progress but needs additional time.',
    },
  ],

  tips: [
    'Update your goal progress weekly rather than waiting until review time — it creates a more accurate record and makes self-assessments much easier.',
    'Use the "Notes" feature to log accomplishments throughout the quarter so you have concrete examples ready for review discussions.',
    'When giving 360 feedback, focus on specific behaviors and their impact rather than personality traits.',
    'Review your team\'s goal alignment view to ensure individual goals ladder up coherently to department objectives.',
    'Schedule regular one-on-ones focused on goal progress rather than saving all performance conversations for the formal review.',
    'Encourage your team to use peer recognition regularly — frequent, small acknowledgments build a stronger culture than infrequent grand gestures.',
    'Export your historical performance data before leaving a review cycle to maintain a personal record of your growth trajectory.',
  ],

  relatedModules: ['compensation', 'learning', 'people', 'engagement'],

  permissions: [
    {
      role: 'Owner',
      capabilities: [
        'Configure review cycles, rating scales, and competency frameworks',
        'Access all performance data across the organization',
        'Run calibration sessions and adjust any employee rating',
        'Create and manage recognition badge categories and point budgets',
        'View and export performance analytics for board reporting',
      ],
    },
    {
      role: 'Admin',
      capabilities: [
        'Configure review cycles, rating scales, and calibration sessions',
        'Access performance data for all employees',
        'Manage PIP templates and approval workflows',
        'Configure recognition programs and point redemption options',
      ],
    },
    {
      role: 'HRBP',
      capabilities: [
        'View and review performance data for assigned departments',
        'Approve and monitor PIPs for assigned employees',
        'Participate in calibration sessions for assigned departments',
        'Generate performance reports for assigned scope',
      ],
    },
    {
      role: 'Manager',
      capabilities: [
        'Set and approve goals for direct reports',
        'Complete manager evaluations and finalize reviews',
        'Create PIPs for direct reports with HRBP approval',
        'View team performance analytics and recognition activity',
      ],
    },
    {
      role: 'Employee',
      capabilities: [
        'Create and edit personal goals within approved frameworks',
        'Complete self-assessments and provide peer feedback when requested',
        'Give and receive peer recognition',
        'View personal performance history and review records',
      ],
    },
  ],
}

export default performance
