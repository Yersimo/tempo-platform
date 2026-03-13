import type { ModuleDoc } from '../../types'

const engagement: ModuleDoc = {
  slug: 'engagement',
  title: 'Engagement',
  subtitle: 'Employee surveys, pulse checks, action plans, sentiment analysis, and engagement trend tracking',
  icon: 'HeartPulse',
  group: 'people',
  lastUpdated: '2026-03-13',
  version: '1.0',

  overview: {
    description:
      'The Engagement module helps organizations measure, understand, and improve employee satisfaction and commitment. Launch comprehensive annual surveys or quick pulse checks, analyze results with AI-powered sentiment analysis, and create data-driven action plans. The module provides anonymity guarantees to encourage honest feedback while giving managers and HR leaders the insight they need to build a thriving workplace culture.',
    keyFeatures: [
      'Comprehensive annual engagement surveys with validated question banks',
      'Quick pulse checks with 3-5 questions deployable on any cadence',
      'AI-powered sentiment analysis with topic extraction from open-ended responses',
      'Real-time results dashboard with demographic breakdowns and heat maps',
      'Action plan builder with assignable tasks, deadlines, and progress tracking',
      'Benchmark comparison against industry averages and historical trends',
      'Anonymity guarantees with configurable minimum response thresholds',
      'eNPS (Employee Net Promoter Score) tracking with trend visualization',
    ],
    screenshotKey: 'engagement/overview',
  },

  workflows: [
    {
      id: 'launch-survey',
      title: 'Launching an Engagement Survey',
      description:
        'Create and distribute a comprehensive engagement survey to gather structured feedback from employees across the organization.',
      estimatedTime: '15 minutes',
      roles: ['owner', 'admin', 'hrbp'],
      steps: [
        {
          number: 1,
          title: 'Navigate to Surveys',
          description:
            'Open the Engagement module and click "Surveys." The view shows past surveys with response rates and key scores, plus the option to create a new survey.',
          screenshotKey: 'engagement/survey-step-1',
        },
        {
          number: 2,
          title: 'Create a new survey',
          description:
            'Click "+ New Survey." Choose a template (Annual Engagement, Onboarding Feedback, Exit Survey) or start from scratch. Name the survey and set the launch date and closing date.',
          screenshotKey: 'engagement/survey-step-2',
        },
        {
          number: 3,
          title: 'Configure questions',
          description:
            'Add questions from the validated question bank or write custom ones. Supported types include Likert scale (1-5), multiple choice, ranking, and open-ended text. Group questions into sections (e.g., Leadership, Growth, Compensation, Culture).',
          screenshotKey: 'engagement/survey-step-3',
          tip: 'Keep surveys under 40 questions to maintain high completion rates. Pulse checks should be 3-5 questions.',
        },
        {
          number: 4,
          title: 'Set audience and anonymity rules',
          description:
            'Select the target audience: all employees, specific departments, or custom groups. Set the minimum response threshold for demographic slicing (typically 5 responses) to protect anonymity.',
          screenshotKey: 'engagement/survey-step-4',
        },
        {
          number: 5,
          title: 'Preview and launch',
          description:
            'Preview the survey as an employee would see it. Click "Launch" to distribute. All participants receive an email and in-app notification with a link to complete the survey.',
          screenshotKey: 'engagement/survey-step-5',
        },
        {
          number: 6,
          title: 'Monitor response rates',
          description:
            'Track participation in real time on the survey dashboard. Send targeted reminders to departments with low response rates. The system can auto-send reminders at configurable intervals.',
          screenshotKey: 'engagement/survey-step-6',
        },
      ],
    },
    {
      id: 'run-pulse-check',
      title: 'Running a Pulse Check',
      description:
        'Deploy a short, frequent pulse survey to track engagement trends between annual surveys.',
      estimatedTime: '5 minutes',
      roles: ['admin', 'hrbp', 'manager'],
      steps: [
        {
          number: 1,
          title: 'Open Pulse Checks',
          description:
            'Navigate to Engagement > Pulse Checks. The view displays the pulse cadence calendar and historical trend lines for each tracked dimension.',
          screenshotKey: 'engagement/pulse-step-1',
        },
        {
          number: 2,
          title: 'Create or schedule a pulse',
          description:
            'Click "+ New Pulse." Select 3-5 questions from the pulse question library. Questions rotate automatically to avoid survey fatigue while covering all engagement dimensions over time.',
          screenshotKey: 'engagement/pulse-step-2',
          tip: 'Set up recurring pulses (weekly or bi-weekly) and the system rotates questions automatically.',
        },
        {
          number: 3,
          title: 'Distribute and collect responses',
          description:
            'Pulse checks are sent via email and appear as in-app prompts. Employees complete them in under 2 minutes. Results are aggregated and available to reviewers within 24 hours of the close date.',
          screenshotKey: 'engagement/pulse-step-3',
        },
        {
          number: 4,
          title: 'Review pulse trends',
          description:
            'The trend dashboard plots each dimension (e.g., Manager Support, Growth Opportunities, Workload Balance) over time. Significant drops trigger automated alerts to the HRBP.',
          screenshotKey: 'engagement/pulse-step-4',
        },
      ],
    },
    {
      id: 'analyze-results',
      title: 'Analyzing Survey Results',
      description:
        'Review survey data with demographic breakdowns, sentiment analysis, and benchmarking to identify strengths and areas for improvement.',
      estimatedTime: '10 minutes',
      roles: ['owner', 'admin', 'hrbp'],
      steps: [
        {
          number: 1,
          title: 'Open the results dashboard',
          description:
            'After a survey closes, click "View Results." The dashboard shows the overall engagement score, eNPS, response rate, and section-by-section breakdowns with color-coded scores.',
          screenshotKey: 'engagement/results-step-1',
        },
        {
          number: 2,
          title: 'Explore demographic cuts',
          description:
            'Use the filter panel to slice results by department, location, tenure band, level, or manager. The heat map visualization highlights which groups have the highest and lowest scores.',
          screenshotKey: 'engagement/results-step-2',
        },
        {
          number: 3,
          title: 'Review sentiment analysis',
          description:
            'The AI sentiment engine processes open-ended responses and groups them by theme (e.g., "career growth," "work-life balance," "leadership trust"). Each theme shows a sentiment score (positive, neutral, negative) and representative excerpts.',
          screenshotKey: 'engagement/results-step-3',
          tip: 'Pay close attention to themes with high response volume and negative sentiment — these are your highest-impact improvement areas.',
        },
        {
          number: 4,
          title: 'Compare to benchmarks',
          description:
            'Toggle the "Benchmarks" overlay to compare your scores against industry averages and your own historical data. Scores significantly below benchmark are flagged for action.',
          screenshotKey: 'engagement/results-step-4',
        },
        {
          number: 5,
          title: 'Share results with stakeholders',
          description:
            'Generate a summary report with key findings and export it as PDF. Share results with leadership, managers, and optionally with all employees to demonstrate transparency.',
          screenshotKey: 'engagement/results-step-5',
        },
      ],
    },
    {
      id: 'create-action-plan',
      title: 'Creating an Action Plan',
      description:
        'Translate survey insights into concrete action items with owners, deadlines, and progress tracking.',
      estimatedTime: '10 minutes',
      roles: ['admin', 'hrbp', 'manager'],
      steps: [
        {
          number: 1,
          title: 'Identify priority areas',
          description:
            'From the results dashboard, click "Create Action Plan." The system suggests priority areas based on the largest score gaps relative to benchmarks and the themes with the most negative sentiment.',
          screenshotKey: 'engagement/action-step-1',
        },
        {
          number: 2,
          title: 'Define action items',
          description:
            'For each priority area, add specific action items. For example, if "career growth" scored low, actions might include launching a mentoring program, creating a promotion framework, or increasing training budgets.',
          screenshotKey: 'engagement/action-step-2',
        },
        {
          number: 3,
          title: 'Assign owners and deadlines',
          description:
            'Assign each action item to an owner (HRBP, manager, or executive sponsor) and set a target completion date. Owners receive notifications and can update status directly in the system.',
          screenshotKey: 'engagement/action-step-3',
        },
        {
          number: 4,
          title: 'Track progress',
          description:
            'The action plan dashboard shows all items with status indicators (not started, in progress, completed). Review progress in leadership meetings and update the next pulse check to measure impact.',
          screenshotKey: 'engagement/action-step-4',
          tip: 'Close the loop with employees by communicating what actions you took based on their feedback — this builds trust and improves future response rates.',
        },
      ],
    },
  ],

  faqs: [
    {
      question: 'Are survey responses truly anonymous?',
      answer:
        'Yes. The system enforces strict anonymity by design. Individual responses are never visible to anyone. Results are only shown in aggregate, and if a demographic slice has fewer responses than the configured minimum threshold (default: 5), the data is suppressed entirely to prevent identification.',
    },
    {
      question: 'What is eNPS and how is it calculated?',
      answer:
        'Employee Net Promoter Score (eNPS) is calculated from the question "How likely are you to recommend this organization as a place to work?" on a 0-10 scale. Respondents scoring 9-10 are Promoters, 7-8 are Passives, and 0-6 are Detractors. eNPS = %Promoters minus %Detractors. Scores range from -100 to +100.',
    },
    {
      question: 'How often should we run pulse checks?',
      answer:
        'Most organizations run bi-weekly or monthly pulse checks with 3-5 questions each. This cadence provides timely trend data without causing survey fatigue. The system rotates questions automatically so each engagement dimension is measured regularly.',
    },
    {
      question: 'Can managers see results for their own team?',
      answer:
        'Yes, if their team meets the minimum response threshold. Managers see aggregated results for their direct reports only. They cannot see individual responses or identify who said what. Managers are encouraged to discuss results openly with their team.',
    },
    {
      question: 'How does the AI sentiment analysis work?',
      answer:
        'The sentiment engine uses natural language processing to analyze open-ended survey responses. It identifies themes, classifies sentiment (positive, neutral, negative), and extracts representative phrases. The analysis runs on your Tempo instance — response text is never sent to external services.',
    },
    {
      question: 'Can I customize the survey question bank?',
      answer:
        'Yes. Admins can add custom questions to the organizational question bank. However, we recommend using the validated questions for core engagement dimensions so you can benchmark against industry data. Custom questions are best for organization-specific topics.',
    },
    {
      question: 'What is a good engagement survey response rate?',
      answer:
        'A response rate above 75% is considered good; above 85% is excellent. Low response rates may indicate disengagement or survey fatigue. To improve rates, keep surveys short, communicate why feedback matters, share results transparently, and demonstrate action on previous feedback.',
    },
  ],

  tips: [
    'Communicate the purpose and anonymity guarantees before launching any survey to boost response rates.',
    'Share survey results with all employees within two weeks of the survey closing — delays erode trust in the process.',
    'Use the "Compare Periods" feature to track whether action plans are actually moving engagement scores over time.',
    'Alternate between comprehensive annual surveys and frequent pulse checks to get both depth and timeliness.',
    'Have managers discuss team-level results in a dedicated team meeting rather than one-on-one to foster collective ownership of improvements.',
  ],

  relatedModules: ['performance', 'people', 'dashboard', 'analytics'],

  permissions: [
    {
      role: 'Owner',
      capabilities: [
        'Create, launch, and manage all surveys and pulse checks',
        'Access full results across all departments with all demographic cuts',
        'Configure anonymity thresholds and survey policies',
        'Create and manage organization-wide action plans',
      ],
    },
    {
      role: 'Admin',
      capabilities: [
        'Create and launch surveys and pulse checks',
        'Access full results and sentiment analysis across all departments',
        'Manage the question bank and survey templates',
        'Create action plans and assign owners',
      ],
    },
    {
      role: 'HRBP',
      capabilities: [
        'View survey results for assigned departments',
        'Create action plans for assigned departments',
        'Send targeted survey reminders',
        'Generate engagement reports for assigned scope',
      ],
    },
    {
      role: 'Manager',
      capabilities: [
        'View aggregated survey results for their direct reports (if threshold met)',
        'Create team-level action plans',
        'Launch pulse checks for their team',
        'View engagement trends for their team over time',
      ],
    },
    {
      role: 'Employee',
      capabilities: [
        'Complete assigned surveys and pulse checks anonymously',
        'View published survey results shared by leadership',
        'View action plans that affect their team or department',
      ],
    },
  ],
}

export default engagement
