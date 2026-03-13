import type { ModuleDoc } from '../../types'

const mentoring: ModuleDoc = {
  slug: 'mentoring',
  title: 'Mentoring',
  subtitle: 'Mentoring programs, intelligent pair matching, session tracking, goal setting, and relationship management',
  icon: 'UserCheck',
  group: 'people',
  lastUpdated: '2026-03-13',
  version: '1.0',

  overview: {
    description:
      'The Mentoring module enables organizations to create structured mentoring programs that connect employees for knowledge sharing, career development, and leadership growth. Administrators design programs with defined goals, durations, and participation criteria. The intelligent matching engine pairs mentors and mentees based on skills, interests, career aspirations, and availability. Participants track sessions, set shared goals, and provide feedback — giving L&D teams clear visibility into program impact.',
    keyFeatures: [
      'Program creation with customizable formats (1-on-1, group, reverse mentoring, peer circles)',
      'AI-powered matching based on skills, goals, department, seniority, and preferences',
      'Session scheduling with calendar integration and agenda templates',
      'Shared goal setting between mentor and mentee with milestone tracking',
      'Feedback collection after each session and at program completion',
      'Program analytics dashboard with participation rates and satisfaction scores',
      'Mentor directory for self-service discovery and connection requests',
      'Cross-departmental and cross-geography matching for diverse perspectives',
    ],
    screenshotKey: 'mentoring/overview',
  },

  workflows: [
    {
      id: 'create-program',
      title: 'Creating a Mentoring Program',
      description:
        'Design and launch a structured mentoring program with defined objectives, eligibility criteria, and timeline.',
      estimatedTime: '15 minutes',
      roles: ['owner', 'admin', 'hrbp'],
      steps: [
        {
          number: 1,
          title: 'Navigate to Programs',
          description:
            'Open the Mentoring module and click the "Programs" tab. Existing programs are listed with their status, participant count, and enrollment window dates.',
          screenshotKey: 'mentoring/program-step-1',
        },
        {
          number: 2,
          title: 'Create a new program',
          description:
            'Click "+ New Program." Enter the program name (e.g., "Emerging Leaders Mentoring"), description, format (1-on-1, group, or peer circle), and duration (typically 3-12 months).',
          screenshotKey: 'mentoring/program-step-2',
        },
        {
          number: 3,
          title: 'Define eligibility and enrollment',
          description:
            'Set mentor eligibility criteria (e.g., minimum tenure, level, or department) and mentee criteria (e.g., career stage, development needs). Choose open enrollment or invite-only participation.',
          screenshotKey: 'mentoring/program-step-3',
          tip: 'Set a mentor-to-mentee ratio cap (e.g., 1:3) to prevent mentor burnout.',
        },
        {
          number: 4,
          title: 'Configure matching preferences',
          description:
            'Select matching criteria: skills alignment, career interests, location diversity, and department cross-pollination. Choose automated matching or manual review before pairs are finalized.',
          screenshotKey: 'mentoring/program-step-4',
        },
        {
          number: 5,
          title: 'Set milestones and expectations',
          description:
            'Define program milestones such as initial meeting deadline, mid-program check-in, and final reflection. Set minimum session frequency (e.g., bi-weekly) and expected session duration.',
          screenshotKey: 'mentoring/program-step-5',
        },
        {
          number: 6,
          title: 'Launch the program',
          description:
            'Click "Launch" to open enrollment. Eligible employees receive invitations to sign up as mentors or mentees. After enrollment closes, the matching engine runs and participants are notified of their pairings.',
          screenshotKey: 'mentoring/program-step-6',
        },
      ],
    },
    {
      id: 'enroll-participate',
      title: 'Enrolling and Participating as a Mentor or Mentee',
      description:
        'Sign up for a mentoring program, complete your profile, get matched, and begin the mentoring relationship.',
      estimatedTime: '5 minutes',
      roles: ['employee', 'manager'],
      steps: [
        {
          number: 1,
          title: 'Browse available programs',
          description:
            'Navigate to Mentoring > Browse Programs. View programs currently accepting enrollment with descriptions, time commitments, and format details.',
          screenshotKey: 'mentoring/enroll-step-1',
        },
        {
          number: 2,
          title: 'Submit your enrollment',
          description:
            'Click "Enroll" on a program and select your role: Mentor or Mentee. Complete the enrollment questionnaire with your skills, interests, development goals, and availability preferences.',
          screenshotKey: 'mentoring/enroll-step-2',
          tip: 'Be specific about your goals in the enrollment form — it significantly improves match quality.',
        },
        {
          number: 3,
          title: 'Review your match',
          description:
            'After the matching process completes, you receive a notification with your partner\'s profile, shared interests, and a compatibility summary. If the program allows, you can request a different match within a set window.',
          screenshotKey: 'mentoring/enroll-step-3',
        },
        {
          number: 4,
          title: 'Schedule your first session',
          description:
            'Use the built-in scheduler to propose meeting times based on shared calendar availability. The system suggests an agenda template for the kickoff meeting.',
          screenshotKey: 'mentoring/enroll-step-4',
        },
        {
          number: 5,
          title: 'Set shared goals',
          description:
            'During the first session, collaboratively define 2-3 goals for the mentoring relationship. Enter these in the shared goals section of your mentoring dashboard. Track progress together throughout the program.',
          screenshotKey: 'mentoring/enroll-step-5',
        },
      ],
    },
    {
      id: 'track-sessions',
      title: 'Tracking Mentoring Sessions',
      description:
        'Log mentoring sessions, capture discussion notes, and provide session feedback to track relationship health.',
      estimatedTime: '3 minutes',
      roles: ['employee', 'manager', 'hrbp'],
      steps: [
        {
          number: 1,
          title: 'Open your mentoring dashboard',
          description:
            'Navigate to Mentoring > My Mentoring. The dashboard shows your active mentoring relationships, upcoming sessions, and goal progress.',
          screenshotKey: 'mentoring/sessions-step-1',
        },
        {
          number: 2,
          title: 'Log a completed session',
          description:
            'After each meeting, click "Log Session." Enter the date, duration, and topics discussed. Both parties can add private notes and shared notes visible to both.',
          screenshotKey: 'mentoring/sessions-step-2',
        },
        {
          number: 3,
          title: 'Complete the session feedback',
          description:
            'Rate the session on a 1-5 scale and answer brief feedback questions about the conversation quality, actionable takeaways, and goal progress. This data helps program administrators monitor relationship health.',
          screenshotKey: 'mentoring/sessions-step-3',
          tip: 'Consistent session logging builds a valuable record of your development journey and demonstrates engagement to program administrators.',
        },
        {
          number: 4,
          title: 'Update goal progress',
          description:
            'After logging the session, update the progress on your shared goals. Mark milestones as complete and add notes about what was achieved or needs further work.',
          screenshotKey: 'mentoring/sessions-step-4',
        },
      ],
    },
    {
      id: 'manage-mentor-directory',
      title: 'Using the Mentor Directory',
      description:
        'Browse the organization\'s mentor directory to find and request mentorship connections outside of formal programs.',
      estimatedTime: '3 minutes',
      roles: ['employee', 'manager'],
      steps: [
        {
          number: 1,
          title: 'Open the Mentor Directory',
          description:
            'Navigate to Mentoring > Directory. The directory lists employees who have opted in as available mentors with their expertise areas, department, and current mentee count.',
          screenshotKey: 'mentoring/directory-step-1',
        },
        {
          number: 2,
          title: 'Search and filter mentors',
          description:
            'Use filters for expertise area (technical, leadership, career transition), department, location, and availability. The AI recommendation engine also suggests mentors based on your profile and development goals.',
          screenshotKey: 'mentoring/directory-step-2',
        },
        {
          number: 3,
          title: 'View a mentor profile',
          description:
            'Click on a mentor to see their full profile including bio, areas of expertise, mentoring philosophy, past mentee feedback scores, and current availability.',
          screenshotKey: 'mentoring/directory-step-3',
        },
        {
          number: 4,
          title: 'Send a connection request',
          description:
            'Click "Request Mentorship" and write a brief message explaining your goals and why you chose this mentor. The mentor receives a notification and can accept or suggest an alternative.',
          screenshotKey: 'mentoring/directory-step-4',
          tip: 'Personalize your request message — mentors are more likely to accept when they understand your specific goals.',
        },
      ],
    },
  ],

  faqs: [
    {
      question: 'How does the matching algorithm work?',
      answer:
        'The matching engine scores potential pairs based on weighted criteria: skills complementarity (mentor has what mentee wants to develop), career interest alignment, geographic diversity, department cross-pollination, and scheduling compatibility. Program admins can adjust the weights for each criterion.',
    },
    {
      question: 'Can I have multiple mentors at the same time?',
      answer:
        'Yes. You can participate in multiple programs or have informal mentoring relationships through the directory. However, each formal program may limit you to one mentor within that program. The system tracks all your mentoring relationships in a single dashboard.',
    },
    {
      question: 'What if my mentoring match is not working out?',
      answer:
        'If the relationship is not productive, either party can request a rematch by contacting the program administrator or clicking "Request Rematch" in the dashboard. The administrator reviews the request confidentially and facilitates a new pairing if appropriate.',
    },
    {
      question: 'How long does a typical mentoring relationship last?',
      answer:
        'Formal program durations are set by the program administrator, typically 3-12 months. Informal mentoring relationships established through the directory have no fixed end date. Both parties can end the relationship at any time by clicking "Complete Relationship" in the dashboard.',
    },
    {
      question: 'Is mentoring data visible to managers?',
      answer:
        'Managers cannot see session notes or feedback content. They can see that an employee is participating in a mentoring program, which is useful for supporting development plans. The employee controls what is shared with their manager about their mentoring experience.',
    },
    {
      question: 'What is reverse mentoring?',
      answer:
        'Reverse mentoring pairs a junior employee (as mentor) with a senior leader (as mentee) to share knowledge about emerging technologies, workplace culture, or generational perspectives. Several program templates support this format with appropriate framing and goals.',
    },
    {
      question: 'Can external mentors participate?',
      answer:
        'Currently, the mentoring module supports internal employees only. External mentors (coaches, advisors, alumni) can be tracked informally by creating an external contact entry, but they do not have login access to the platform.',
    },
    {
      question: 'How is program success measured?',
      answer:
        'Program analytics track participation rates, session frequency, goal completion rates, session feedback scores, and a post-program satisfaction survey. The platform also correlates mentoring participation with engagement scores and retention rates to demonstrate business impact.',
    },
  ],

  tips: [
    'Set specific, measurable goals at the start of your mentoring relationship — vague goals lead to unfocused sessions.',
    'Schedule all sessions at the beginning of the program so they are locked in your calendar and less likely to be canceled.',
    'As a mentor, spend more time asking questions and listening than giving advice — the best mentoring is mentee-driven.',
    'Use the shared notes feature to capture action items so both parties have a reference between sessions.',
    'Program administrators should send a mid-program check-in survey to identify struggling pairs early.',
    'Encourage cross-departmental mentoring to broaden perspectives and break down organizational silos.',
  ],

  relatedModules: ['performance', 'learning', 'people', 'engagement'],

  permissions: [
    {
      role: 'Owner',
      capabilities: [
        'Create and manage all mentoring programs organization-wide',
        'Access program analytics and participation reports',
        'Configure matching algorithms and program templates',
        'View aggregated feedback and satisfaction data',
      ],
    },
    {
      role: 'Admin',
      capabilities: [
        'Create, edit, and launch mentoring programs',
        'Review and approve matching results before notification',
        'Process rematch requests and manage program exceptions',
        'Access program analytics and generate impact reports',
      ],
    },
    {
      role: 'HRBP',
      capabilities: [
        'View mentoring participation for assigned departments',
        'Facilitate rematch requests for assigned employees',
        'Monitor session frequency and relationship health metrics',
      ],
    },
    {
      role: 'Manager',
      capabilities: [
        'Enroll as a mentor in available programs',
        'View which direct reports are participating in mentoring programs',
        'Encourage mentoring participation as part of development planning',
      ],
    },
    {
      role: 'Employee',
      capabilities: [
        'Browse and enroll in available mentoring programs',
        'Search the mentor directory and send connection requests',
        'Log sessions, set shared goals, and track progress',
        'Provide session feedback and rate the mentoring experience',
      ],
    },
  ],
}

export default mentoring
