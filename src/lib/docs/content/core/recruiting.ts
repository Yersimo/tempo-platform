import type { ModuleDoc } from '../../types'

const recruiting: ModuleDoc = {
  slug: 'recruiting',
  title: 'Recruiting',
  subtitle: 'End-to-end applicant tracking with job postings, candidate pipelines, interview scorecards, and offer management',
  icon: 'Briefcase',
  group: 'core',
  lastUpdated: '2026-03-13',
  version: '1.0',

  overview: {
    description:
      'The Recruiting module provides a full-featured applicant tracking system designed for high-growth teams. Create and publish job postings to multiple boards simultaneously, manage candidates through configurable pipeline stages, coordinate structured interviews with scorecards, and extend offers with built-in approval workflows. Hiring managers, recruiters, and interviewers each get a tailored view so they can collaborate without friction while maintaining compliance with equal opportunity requirements.',
    keyFeatures: [
      'Multi-channel job posting with one-click distribution to LinkedIn, Indeed, Glassdoor, and custom career pages',
      'Configurable candidate pipeline with drag-and-drop stage management',
      'Structured interview kits with competency-based scorecards',
      'AI-powered resume screening with bias-mitigation safeguards',
      'Offer letter generation with e-signature integration',
      'Referral tracking with automated bonus eligibility calculations',
      'Diversity analytics and EEO compliance reporting',
      'Candidate communication hub with templated emails and scheduling links',
    ],
    screenshotKey: 'recruiting/overview',
  },

  workflows: [
    {
      id: 'create-job-posting',
      title: 'Creating and Publishing a Job Posting',
      description:
        'Walk through the process of creating a new job requisition, writing the description, setting compensation bands, and publishing to external job boards.',
      estimatedTime: '10 minutes',
      roles: ['owner', 'admin', 'hrbp', 'manager'],
      steps: [
        {
          number: 1,
          title: 'Open the Recruiting module',
          description:
            'Navigate to Recruiting in the left sidebar. The main view displays the Jobs tab with all active, draft, and closed requisitions.',
          screenshotKey: 'recruiting/create-job-step-1',
        },
        {
          number: 2,
          title: 'Start a new requisition',
          description:
            'Click "+ New Job" in the top-right corner. A creation form opens with fields for job title, department, location, employment type (full-time, part-time, contract), and reporting manager.',
          screenshotKey: 'recruiting/create-job-step-2',
          tip: 'Select the correct department first — it determines which approval chain is used before publishing.',
        },
        {
          number: 3,
          title: 'Write the job description',
          description:
            'Use the rich text editor to compose the job summary, responsibilities, and qualifications. You can also click "Generate with AI" to produce a draft based on the job title and level, then edit as needed.',
          screenshotKey: 'recruiting/create-job-step-3',
        },
        {
          number: 4,
          title: 'Set compensation and headcount',
          description:
            'Enter the compensation band (minimum, midpoint, maximum), equity range if applicable, and the number of hires planned for this requisition. These values feed into the offer approval workflow.',
          screenshotKey: 'recruiting/create-job-step-4',
        },
        {
          number: 5,
          title: 'Configure the interview plan',
          description:
            'Under the "Interview Plan" tab, add interview stages (e.g., Phone Screen, Technical, Onsite, Final). For each stage, assign default interviewers and attach a scorecard template.',
          screenshotKey: 'recruiting/create-job-step-5',
        },
        {
          number: 6,
          title: 'Publish to job boards',
          description:
            'Click "Publish" to submit the requisition for approval. Once approved, select target job boards from the distribution list. The posting goes live immediately on selected channels and appears on your career page.',
          screenshotKey: 'recruiting/create-job-step-6',
        },
      ],
    },
    {
      id: 'manage-candidate-pipeline',
      title: 'Managing the Candidate Pipeline',
      description:
        'Track applicants through each stage of the hiring funnel, review resumes, and advance or reject candidates in bulk or individually.',
      estimatedTime: '5 minutes',
      roles: ['admin', 'hrbp', 'manager'],
      steps: [
        {
          number: 1,
          title: 'Open the pipeline view',
          description:
            'Click on any active job to open its pipeline. The default view is a Kanban board with columns for each interview stage. Each candidate card shows their name, source, current stage duration, and overall rating.',
          screenshotKey: 'recruiting/pipeline-step-1',
        },
        {
          number: 2,
          title: 'Review a candidate profile',
          description:
            'Click on a candidate card to open their full profile. This includes their resume, cover letter, screening answers, interview scores, and a timeline of all activity.',
          screenshotKey: 'recruiting/pipeline-step-2',
        },
        {
          number: 3,
          title: 'Advance or reject a candidate',
          description:
            'Click "Move to Next Stage" to advance the candidate, or click "Reject" to remove them from the pipeline. When rejecting, select a reason from the dropdown and optionally send a templated rejection email.',
          screenshotKey: 'recruiting/pipeline-step-3',
          tip: 'Use the bulk actions toolbar to advance or reject multiple candidates at once by selecting their checkboxes.',
        },
        {
          number: 4,
          title: 'Add notes and tags',
          description:
            'In the candidate profile, use the Notes tab to leave internal comments visible to the hiring team. Apply tags like "Strong Referral" or "Relocation Required" to help filter candidates later.',
          screenshotKey: 'recruiting/pipeline-step-4',
        },
        {
          number: 5,
          title: 'Filter and sort candidates',
          description:
            'Use the filter bar above the Kanban board to narrow candidates by source, rating, stage duration, or tag. Switch to table view for a sortable spreadsheet-style layout.',
          screenshotKey: 'recruiting/pipeline-step-5',
        },
      ],
    },
    {
      id: 'conduct-interview',
      title: 'Conducting a Structured Interview',
      description:
        'Use interview kits and scorecards to conduct consistent, bias-reduced interviews and submit evaluations.',
      estimatedTime: '5 minutes',
      roles: ['admin', 'hrbp', 'manager', 'employee'],
      steps: [
        {
          number: 1,
          title: 'Accept the interview assignment',
          description:
            'When assigned as an interviewer, you receive an email and in-app notification with the candidate name, role, interview stage, date/time, and a link to the interview kit.',
          screenshotKey: 'recruiting/interview-step-1',
        },
        {
          number: 2,
          title: 'Review the interview kit',
          description:
            'Click the interview link to open the kit. It includes the candidate resume, the job description summary, suggested questions organized by competency, and the scorecard you will fill out.',
          screenshotKey: 'recruiting/interview-step-2',
          tip: 'Review the kit at least 15 minutes before the interview to familiarize yourself with the candidate background.',
        },
        {
          number: 3,
          title: 'Score each competency',
          description:
            'During or after the interview, rate each competency on a 1-5 scale. Each level has a defined rubric (e.g., 1 = No evidence, 3 = Meets expectations, 5 = Exceptional). Add written notes for each rating.',
          screenshotKey: 'recruiting/interview-step-3',
        },
        {
          number: 4,
          title: 'Submit your overall recommendation',
          description:
            'At the bottom of the scorecard, select your overall recommendation: Strong Hire, Hire, No Decision, or No Hire. Add a summary comment explaining your rationale.',
          screenshotKey: 'recruiting/interview-step-4',
        },
        {
          number: 5,
          title: 'View the debrief panel',
          description:
            'After all interviewers submit their scorecards, the hiring manager can open the debrief panel to see aggregated scores, recommendation distribution, and individual comments side by side.',
          screenshotKey: 'recruiting/interview-step-5',
        },
      ],
    },
    {
      id: 'extend-offer',
      title: 'Extending an Offer',
      description:
        'Generate an offer letter, route it through the approval chain, and send it to the candidate with e-signature tracking.',
      estimatedTime: '8 minutes',
      roles: ['owner', 'admin', 'hrbp'],
      steps: [
        {
          number: 1,
          title: 'Initiate an offer',
          description:
            'From the candidate profile, click "Create Offer." The offer form pre-fills with the job title, department, and compensation band from the requisition.',
          screenshotKey: 'recruiting/offer-step-1',
        },
        {
          number: 2,
          title: 'Set offer details',
          description:
            'Enter the base salary, signing bonus, equity grant, start date, and any special terms. If the offer exceeds the requisition band, the system flags it for additional approval.',
          screenshotKey: 'recruiting/offer-step-2',
        },
        {
          number: 3,
          title: 'Select an offer letter template',
          description:
            'Choose from organization-approved templates. The system merges candidate and offer data into the template and generates a preview. Review the letter for accuracy before proceeding.',
          screenshotKey: 'recruiting/offer-step-3',
          tip: 'Admins can create and manage offer letter templates in Settings > Recruiting > Templates.',
        },
        {
          number: 4,
          title: 'Route for approval',
          description:
            'Click "Submit for Approval." The offer enters the approval workflow defined for the department and level. Approvers receive notifications and can approve, reject, or request changes inline.',
          screenshotKey: 'recruiting/offer-step-4',
        },
        {
          number: 5,
          title: 'Send the offer to the candidate',
          description:
            'Once approved, click "Send Offer." The candidate receives an email with the offer letter and an e-signature link. You can track whether the candidate has opened, signed, or declined the offer in real time.',
          screenshotKey: 'recruiting/offer-step-5',
        },
      ],
    },
    {
      id: 'track-referrals',
      title: 'Tracking Employee Referrals',
      description:
        'Submit referrals, monitor their progress through the pipeline, and track referral bonus eligibility.',
      estimatedTime: '3 minutes',
      roles: ['employee', 'manager', 'admin'],
      steps: [
        {
          number: 1,
          title: 'Open the referrals portal',
          description:
            'Navigate to Recruiting > Referrals. The portal shows open positions eligible for referral bonuses and any referrals you have previously submitted.',
          screenshotKey: 'recruiting/referrals-step-1',
        },
        {
          number: 2,
          title: 'Submit a referral',
          description:
            'Click "Refer a Candidate" on an open position. Enter the candidate name, email, phone number, and upload their resume. Add a note explaining your relationship and why they are a good fit.',
          screenshotKey: 'recruiting/referrals-step-2',
        },
        {
          number: 3,
          title: 'Track referral status',
          description:
            'Your referral appears in the "My Referrals" section with a status indicator showing their current pipeline stage. You receive notifications when they advance or when a hiring decision is made.',
          screenshotKey: 'recruiting/referrals-step-3',
        },
        {
          number: 4,
          title: 'Check bonus eligibility',
          description:
            'If your referral is hired and completes the qualifying period (typically 90 days), the referral bonus status changes to "Eligible." The bonus is automatically added to your next payroll cycle.',
          screenshotKey: 'recruiting/referrals-step-4',
          tip: 'Referral bonus amounts vary by role level — check the policy page for current rates.',
        },
      ],
    },
  ],

  faqs: [
    {
      question: 'How many job boards can I publish to simultaneously?',
      answer:
        'Tempo integrates with over 25 job boards out of the box, including LinkedIn, Indeed, Glassdoor, AngelList, and regional boards. You can publish to as many boards as your subscription tier allows. Custom board integrations can be configured in Settings > Recruiting > Integrations.',
    },
    {
      question: 'Can I customize the pipeline stages for different roles?',
      answer:
        'Yes. Each job requisition can have its own interview plan with custom stages. You can also create reusable pipeline templates (e.g., "Engineering Hiring Process" or "Executive Search") and apply them when creating new requisitions.',
    },
    {
      question: 'How does the AI resume screening work?',
      answer:
        'When enabled, the AI screening model evaluates incoming resumes against the job requirements and assigns a match score. It highlights relevant experience, skills gaps, and potential concerns. The model is trained to avoid bias based on protected characteristics. All AI scores are advisory — a human recruiter makes the final decision on every candidate.',
    },
    {
      question: 'Can candidates apply without creating an account?',
      answer:
        'Yes. Your career page supports one-click apply with a resume upload. Candidates can also apply using their LinkedIn profile. No account creation is required. Candidates who wish to check their application status can access a read-only portal using their email address.',
    },
    {
      question: 'How are interview scorecards kept confidential?',
      answer:
        'Interviewers cannot see other interviewers\' scorecards until they submit their own. This prevents anchoring bias. After all scorecards are submitted, the hiring manager can choose to share the aggregated results with the full interview panel during the debrief.',
    },
    {
      question: 'What happens to candidate data after a position is filled?',
      answer:
        'Candidate data is retained according to your organization\'s data retention policy (configurable in Settings > Compliance). By default, data is retained for 24 months to enable future outreach. Candidates can request deletion at any time via the candidate portal, and the system processes these requests within 30 days.',
    },
    {
      question: 'Can I schedule interviews directly from Tempo?',
      answer:
        'Yes. Tempo integrates with Google Calendar and Microsoft Outlook. From the candidate profile, click "Schedule Interview" to see interviewer availability, select a time slot, and send calendar invitations — all without leaving the platform.',
    },
    {
      question: 'How do I track my recruiting pipeline metrics?',
      answer:
        'The Recruiting Analytics tab provides real-time metrics including time-to-fill, cost-per-hire, source effectiveness, stage conversion rates, and offer acceptance rates. You can filter by department, recruiter, or time period and export reports as CSV or PDF.',
    },
  ],

  tips: [
    'Use pipeline templates to standardize your hiring process across departments and reduce setup time for new requisitions.',
    'Enable the "auto-reject" rule for candidates who have been inactive in a stage for more than 30 days to keep your pipeline clean.',
    'Leverage the candidate tagging system to build talent pools for future positions, even if a candidate is not right for the current role.',
    'Set up Slack or Teams notifications for your recruiting channel so the hiring team stays informed without checking Tempo constantly.',
    'Review the Source Effectiveness report monthly to reallocate job board spending to the channels that produce the best candidates.',
    'Use the "Duplicate Candidate" detection feature to avoid reviewing the same person twice when they apply to multiple roles.',
    'Encourage hiring managers to complete interview training before their first structured interview to ensure scorecard consistency.',
  ],

  relatedModules: ['people', 'onboarding', 'compensation', 'dashboard'],

  permissions: [
    {
      role: 'Owner',
      capabilities: [
        'Full access to all requisitions, candidates, and recruiting settings',
        'Approve offers that exceed compensation band limits',
        'Configure job board integrations and career page branding',
        'Access recruiting analytics across all departments',
        'Manage offer letter templates and approval workflows',
      ],
    },
    {
      role: 'Admin',
      capabilities: [
        'Create, edit, and publish job requisitions for any department',
        'Manage candidate pipelines and bulk-advance or reject candidates',
        'Configure scorecard templates and interview kits',
        'Access recruiting analytics across all departments',
        'Manage offer letter templates and referral bonus policies',
      ],
    },
    {
      role: 'HRBP',
      capabilities: [
        'Create and manage requisitions for assigned departments',
        'Review candidates and coordinate interview scheduling',
        'Generate and send offers for assigned departments',
        'View recruiting analytics scoped to assigned departments',
      ],
    },
    {
      role: 'Manager',
      capabilities: [
        'Request new requisitions for their team (subject to approval)',
        'Review candidates and submit interview scorecards for their open roles',
        'Participate in debrief sessions and make hiring recommendations',
        'View pipeline status for their own requisitions only',
      ],
    },
    {
      role: 'Employee',
      capabilities: [
        'Submit employee referrals and track referral status',
        'Complete interview scorecards when assigned as an interviewer',
        'View open positions on the internal job board',
      ],
    },
  ],
}

export default recruiting
