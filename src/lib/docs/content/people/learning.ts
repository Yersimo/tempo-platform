import type { ModuleDoc } from '../../types'

const learning: ModuleDoc = {
  slug: 'learning',
  title: 'Learning',
  subtitle: 'Course catalog, enrollments, certifications, learning paths, and compliance training tracking',
  icon: 'GraduationCap',
  group: 'people',
  lastUpdated: '2026-03-13',
  version: '1.0',

  overview: {
    description:
      'The Learning module is Tempo\'s integrated learning management system (LMS) for employee development and compliance training. Build a course catalog with internal and external content, create structured learning paths for career progression, track enrollments and completions, and manage certification requirements with automatic renewal reminders. Managers can assign mandatory training, while employees can self-enroll in elective courses to build new skills.',
    keyFeatures: [
      'Course catalog with categories, difficulty levels, and content type tags',
      'Structured learning paths linking multiple courses into career development tracks',
      'SCORM and xAPI content support for third-party e-learning integration',
      'Certification tracking with expiry dates and automatic renewal reminders',
      'Compliance training assignment with completion deadlines and escalation rules',
      'Progress dashboards for employees, managers, and L&D administrators',
      'Course ratings and reviews to surface high-quality content',
      'Integration with performance goals for development-linked learning',
    ],
    screenshotKey: 'learning/overview',
  },

  workflows: [
    {
      id: 'browse-enroll',
      title: 'Browsing and Enrolling in Courses',
      description:
        'Discover available courses in the catalog, review details and ratings, and enroll to begin learning.',
      estimatedTime: '3 minutes',
      roles: ['employee', 'manager', 'hrbp'],
      steps: [
        {
          number: 1,
          title: 'Open the course catalog',
          description:
            'Navigate to Learning > Catalog. The catalog displays all available courses with thumbnail images, titles, duration estimates, difficulty badges, and average ratings.',
          screenshotKey: 'learning/browse-step-1',
        },
        {
          number: 2,
          title: 'Filter and search',
          description:
            'Use the filter sidebar to narrow courses by category (Technical, Leadership, Compliance, Soft Skills), format (Video, Interactive, Workshop, Reading), difficulty (Beginner, Intermediate, Advanced), and duration.',
          screenshotKey: 'learning/browse-step-2',
        },
        {
          number: 3,
          title: 'Review course details',
          description:
            'Click a course card to open its detail page. View the full description, learning objectives, module outline, instructor bio, estimated time commitment, and employee reviews.',
          screenshotKey: 'learning/browse-step-3',
          tip: 'Check the "Prerequisites" section before enrolling — some advanced courses require completion of foundational material first.',
        },
        {
          number: 4,
          title: 'Enroll in the course',
          description:
            'Click "Enroll" to add the course to your learning dashboard. For instructor-led courses, select from available session dates. For self-paced courses, you can start immediately.',
          screenshotKey: 'learning/browse-step-4',
        },
        {
          number: 5,
          title: 'Begin learning',
          description:
            'Navigate to Learning > My Courses to see your enrolled courses. Click "Continue" to resume where you left off. Progress is saved automatically after each module or section.',
          screenshotKey: 'learning/browse-step-5',
        },
      ],
    },
    {
      id: 'create-learning-path',
      title: 'Creating a Learning Path',
      description:
        'Build a structured sequence of courses that guides employees through a development track, such as "New Manager Essentials" or "Data Engineering Foundations."',
      estimatedTime: '15 minutes',
      roles: ['admin', 'hrbp'],
      steps: [
        {
          number: 1,
          title: 'Navigate to Learning Paths',
          description:
            'Open Learning > Paths. The view lists all existing learning paths with enrollment counts and average completion rates.',
          screenshotKey: 'learning/path-step-1',
        },
        {
          number: 2,
          title: 'Create a new path',
          description:
            'Click "+ New Path." Enter the path name, description, target audience (e.g., all new managers), and estimated total duration. Upload a cover image for the catalog listing.',
          screenshotKey: 'learning/path-step-2',
        },
        {
          number: 3,
          title: 'Add courses to the path',
          description:
            'Search and add courses from the catalog in the desired sequence. Mark each course as required or optional. Set prerequisites so courses unlock only after prior ones are completed.',
          screenshotKey: 'learning/path-step-3',
          tip: 'Include a mix of content types (video, interactive, reading) to accommodate different learning styles.',
        },
        {
          number: 4,
          title: 'Configure completion criteria',
          description:
            'Define what constitutes path completion: all required courses finished, minimum quiz scores achieved, and/or a capstone project submitted. Optionally issue a certificate or badge upon completion.',
          screenshotKey: 'learning/path-step-4',
        },
        {
          number: 5,
          title: 'Publish the path',
          description:
            'Click "Publish" to make the learning path available in the catalog. Employees can self-enroll, or you can assign the path to specific teams or individuals.',
          screenshotKey: 'learning/path-step-5',
        },
      ],
    },
    {
      id: 'assign-compliance-training',
      title: 'Assigning Compliance Training',
      description:
        'Assign mandatory compliance courses to employees with deadlines, track completion, and escalate overdue assignments.',
      estimatedTime: '5 minutes',
      roles: ['admin', 'hrbp', 'manager'],
      steps: [
        {
          number: 1,
          title: 'Open the Assignments view',
          description:
            'Navigate to Learning > Assignments. The view shows all active compliance training campaigns with completion percentages and upcoming deadlines.',
          screenshotKey: 'learning/compliance-step-1',
        },
        {
          number: 2,
          title: 'Create a new assignment',
          description:
            'Click "+ New Assignment." Select the compliance course (e.g., Anti-Harassment, Data Privacy, Workplace Safety), choose the target audience (all employees, specific departments, or individual employees), and set the completion deadline.',
          screenshotKey: 'learning/compliance-step-2',
        },
        {
          number: 3,
          title: 'Configure reminders and escalation',
          description:
            'Set automated reminder emails at intervals before the deadline (e.g., 14 days, 7 days, 1 day). Define escalation rules — for example, notify the manager if the employee has not completed training 3 days before the deadline.',
          screenshotKey: 'learning/compliance-step-3',
          tip: 'Stagger deadlines across departments to avoid overloading employees who belong to multiple assignment groups.',
        },
        {
          number: 4,
          title: 'Launch the assignment',
          description:
            'Click "Send" to notify all assigned employees. They receive an email and in-app notification with a direct link to the course and the completion deadline.',
          screenshotKey: 'learning/compliance-step-4',
        },
        {
          number: 5,
          title: 'Monitor completion and follow up',
          description:
            'Track completion progress on the assignment dashboard. Filter by status (completed, in progress, not started, overdue). Export the completion report for compliance audits.',
          screenshotKey: 'learning/compliance-step-5',
        },
      ],
    },
    {
      id: 'track-certifications',
      title: 'Tracking Certifications',
      description:
        'Record employee certifications, set expiry alerts, and manage renewal requirements to ensure the workforce stays compliant.',
      estimatedTime: '5 minutes',
      roles: ['admin', 'hrbp', 'employee'],
      steps: [
        {
          number: 1,
          title: 'Navigate to Certifications',
          description:
            'Open Learning > Certifications. The dashboard shows all tracked certifications across the organization with status indicators: Active, Expiring Soon, and Expired.',
          screenshotKey: 'learning/cert-step-1',
        },
        {
          number: 2,
          title: 'Add a certification record',
          description:
            'Click "+ Add Certification." Select the employee, certification name (from a predefined list or custom entry), issuing body, date earned, and expiry date. Upload a copy of the certificate document.',
          screenshotKey: 'learning/cert-step-2',
        },
        {
          number: 3,
          title: 'Set renewal reminders',
          description:
            'The system automatically sets reminders at 90, 60, and 30 days before expiry. You can customize these intervals. The employee and their manager both receive notifications.',
          screenshotKey: 'learning/cert-step-3',
        },
        {
          number: 4,
          title: 'Link to renewal training',
          description:
            'Optionally link the certification to a renewal course in the catalog. When the reminder fires, the employee is directed to the renewal course and the certification status updates automatically upon completion.',
          screenshotKey: 'learning/cert-step-4',
          tip: 'Create a certification dashboard for safety-critical roles to ensure no employee works with an expired certification.',
        },
      ],
    },
  ],

  faqs: [
    {
      question: 'Can employees request courses that are not in the catalog?',
      answer:
        'Yes. Employees can submit a "Course Request" from the catalog page. The request goes to the L&D team for review. If approved, the course is added to the catalog and the requesting employee is auto-enrolled.',
    },
    {
      question: 'Does the LMS support external content providers?',
      answer:
        'Yes. Tempo Learning integrates with LinkedIn Learning, Coursera for Business, Udemy Business, and any SCORM/xAPI-compliant content provider. External courses appear in the same catalog alongside internal content.',
    },
    {
      question: 'How is course completion verified?',
      answer:
        'For self-paced e-learning, completion is tracked automatically via SCORM/xAPI progress data. For instructor-led sessions, the facilitator marks attendance. For courses with assessments, a minimum passing score is required (configurable per course).',
    },
    {
      question: 'Can managers see their team\'s learning progress?',
      answer:
        'Yes. Managers have a "Team Learning" dashboard showing each direct report\'s enrolled courses, completion rates, overdue assignments, and earned certifications. Managers receive weekly digest emails summarizing team progress.',
    },
    {
      question: 'What happens if an employee does not complete mandatory training by the deadline?',
      answer:
        'The system follows the escalation rules defined in the assignment. Typically, this includes manager notification, HRBP notification, and potential access restrictions. The compliance report flags the employee as non-compliant until the training is completed.',
    },
    {
      question: 'Can I create my own course content in Tempo?',
      answer:
        'Yes. The course builder supports rich text articles, embedded videos (YouTube, Vimeo, or uploaded), file attachments, and quiz creation with multiple-choice, true/false, and open-ended question types. More complex interactive content can be authored externally and uploaded as SCORM packages.',
    },
    {
      question: 'How are learning paths different from individual courses?',
      answer:
        'A learning path is a curated sequence of multiple courses designed to build competency in a specific area. Paths can enforce course ordering, prerequisites, and a capstone assessment. Completing a path typically grants a badge or certificate that individual courses do not.',
    },
    {
      question: 'Is there a mobile experience for completing courses?',
      answer:
        'Yes. The learning module is fully responsive and works on mobile browsers. Video content supports adaptive streaming for mobile connections. Offline access is available for downloaded SCORM content through the Tempo mobile app.',
    },
  ],

  tips: [
    'Link learning path completions to performance goals so development activities directly contribute to review outcomes.',
    'Review the "Most Popular Courses" report monthly to identify high-demand topics and invest in more content for those areas.',
    'Use the course rating and review system to surface the best content and retire low-quality courses.',
    'Set up automatic compliance training assignments for new hires as part of the onboarding workflow.',
    'Encourage managers to discuss development courses during one-on-ones and align them with career growth plans.',
    'Export certification expiry reports monthly to proactively manage renewal timelines, especially for safety-critical roles.',
  ],

  relatedModules: ['performance', 'onboarding', 'engagement', 'people'],

  permissions: [
    {
      role: 'Owner',
      capabilities: [
        'Full access to all learning content, paths, assignments, and analytics',
        'Configure LMS settings, integrations, and external content providers',
        'Create and manage certification requirements organization-wide',
      ],
    },
    {
      role: 'Admin',
      capabilities: [
        'Create and edit courses, learning paths, and compliance assignments',
        'Manage the course catalog and approve course requests',
        'View learning analytics across all departments',
        'Configure certification tracking and renewal rules',
      ],
    },
    {
      role: 'HRBP',
      capabilities: [
        'Assign compliance training to employees in assigned departments',
        'View learning progress and certification status for assigned employees',
        'Generate compliance reports for assigned scope',
      ],
    },
    {
      role: 'Manager',
      capabilities: [
        'View team learning dashboard and course completion rates',
        'Recommend courses to direct reports',
        'Assign compliance training to direct reports',
        'Approve course enrollment requests that require manager sign-off',
      ],
    },
    {
      role: 'Employee',
      capabilities: [
        'Browse the course catalog and self-enroll in available courses',
        'Complete assigned training and track personal progress',
        'Upload certification documents and view expiry reminders',
        'Rate and review completed courses',
      ],
    },
  ],
}

export default learning
