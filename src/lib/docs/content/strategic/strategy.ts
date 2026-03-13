import type { ModuleDoc } from '../../types'

const strategy: ModuleDoc = {
  slug: 'strategy',
  title: 'Strategy',
  subtitle: 'Strategic planning, OKRs, scenario planning, and organizational alignment',
  icon: 'Compass',
  group: 'strategic',
  lastUpdated: '2026-03-13',
  version: '1.0',

  overview: {
    description:
      'The Strategy module helps leadership teams define, communicate, and execute organizational strategy from top-level vision down to individual contributor objectives. Create strategic pillars, cascade Objectives and Key Results (OKRs) through the org hierarchy, and run scenario-planning exercises to evaluate trade-offs before committing resources. Real-time alignment scores show how well day-to-day work connects to strategic priorities, while AI-powered insights surface risks and opportunities automatically.',
    keyFeatures: [
      'Strategic pillar definition with mission, vision, and multi-year goals',
      'OKR management with cascading objectives from company to team to individual',
      'Alignment scoring that connects tasks and projects to strategic goals',
      'Scenario planning workspace for modeling what-if resource and budget decisions',
      'Strategy map visualization showing goal dependencies and progress',
      'AI-generated strategy insights and risk identification',
      'Quarterly planning cadence with check-in templates and review workflows',
      'Stakeholder sharing with read-only strategy views for board members',
    ],
    screenshotKey: 'strategy/overview',
  },

  workflows: [
    {
      id: 'define-okrs',
      title: 'Defining Company OKRs',
      description:
        'Set company-level Objectives and Key Results for a planning period. This is typically done quarterly by the leadership team.',
      estimatedTime: '15 minutes',
      roles: ['owner', 'admin'],
      prerequisites: [
        'Strategic pillars should be defined for the current fiscal year',
        'Leadership team members should have active employee records',
      ],
      steps: [
        {
          number: 1,
          title: 'Navigate to the Strategy module',
          description:
            'Click "Strategy" in the left sidebar under the Strategic section. The module opens to the current planning period\'s strategy overview.',
          screenshotKey: 'strategy/okrs-step-1',
        },
        {
          number: 2,
          title: 'Select the planning period',
          description:
            'Use the period selector at the top of the page to choose the quarter or custom date range. If a new period needs to be created, click "New Period" and set the start and end dates.',
          screenshotKey: 'strategy/okrs-step-2',
        },
        {
          number: 3,
          title: 'Create an objective',
          description:
            'Click "Add Objective" under the appropriate strategic pillar. Enter the objective statement, which should be aspirational and qualitative. Assign an owner from the leadership team. Set the confidence level (Low, Medium, High).',
          screenshotKey: 'strategy/okrs-step-3',
          tip: 'Strong objectives answer the question "Where do we want to go?" and are memorable enough to repeat without looking them up.',
        },
        {
          number: 4,
          title: 'Define key results',
          description:
            'Add 2-5 key results under each objective. Each key result must have a measurable target, a starting value, a current value, and a unit of measurement. Set the scoring method (percentage, binary, or numeric).',
          screenshotKey: 'strategy/okrs-step-4',
        },
        {
          number: 5,
          title: 'Link to downstream teams',
          description:
            'For each company-level OKR, designate which departments or teams will contribute. This creates a cascading structure where team-level OKRs can reference the parent company objective, ensuring alignment.',
          screenshotKey: 'strategy/okrs-step-5',
        },
        {
          number: 6,
          title: 'Publish the OKR set',
          description:
            'Review all objectives and key results on the summary page. Click "Publish" to make them visible organization-wide. Published OKRs appear on each team\'s Strategy tab and on the company-wide strategy map.',
          screenshotKey: 'strategy/okrs-step-6',
        },
      ],
    },
    {
      id: 'cascade-okrs',
      title: 'Cascading OKRs to Teams and Individuals',
      description:
        'Break down company-level objectives into team and individual OKRs that maintain alignment with the overarching strategy.',
      estimatedTime: '10 minutes',
      roles: ['owner', 'admin', 'manager'],
      steps: [
        {
          number: 1,
          title: 'Open the team OKR workspace',
          description:
            'Navigate to Strategy > Teams and select your team. The workspace shows any parent company OKRs linked to your team alongside your existing team-level objectives.',
          screenshotKey: 'strategy/cascade-step-1',
        },
        {
          number: 2,
          title: 'Create a team objective',
          description:
            'Click "Add Team Objective" and enter the objective statement. Use the "Aligns To" dropdown to link this objective to a parent company OKR. This creates a visible alignment chain in the strategy map.',
          screenshotKey: 'strategy/cascade-step-2',
        },
        {
          number: 3,
          title: 'Add team key results',
          description:
            'Define measurable key results for the team objective. Each key result can optionally be assigned to a specific team member who is accountable for driving it.',
          screenshotKey: 'strategy/cascade-step-3',
          tip: 'Key results should be outcomes, not activities. Ask "Would completing this prove we achieved the objective?" to test quality.',
        },
        {
          number: 4,
          title: 'Enable individual OKRs',
          description:
            'Team members can create personal OKRs that align to team key results. In the team settings, toggle "Individual OKRs" to allow team members to propose their own objectives during the planning period.',
          screenshotKey: 'strategy/cascade-step-4',
        },
        {
          number: 5,
          title: 'Review alignment scores',
          description:
            'Navigate to Strategy > Alignment to see a tree visualization of how company, team, and individual OKRs connect. Each node shows a progress percentage and an alignment confidence score calculated from key result updates.',
          screenshotKey: 'strategy/cascade-step-5',
        },
      ],
    },
    {
      id: 'scenario-planning',
      title: 'Running a Scenario Planning Exercise',
      description:
        'Model alternative strategic scenarios to evaluate trade-offs in resource allocation, headcount, and budget before making commitments.',
      estimatedTime: '20 minutes',
      roles: ['owner', 'admin'],
      prerequisites: [
        'Current headcount and budget data available in the Headcount and Finance modules',
        'Active OKRs for the current period',
      ],
      steps: [
        {
          number: 1,
          title: 'Open the Scenario Planner',
          description:
            'Navigate to Strategy > Scenarios. The workspace shows any previously saved scenarios alongside a "New Scenario" button.',
          screenshotKey: 'strategy/scenario-step-1',
        },
        {
          number: 2,
          title: 'Create a base scenario',
          description:
            'Click "New Scenario" and name it (e.g., "Q2 Conservative Plan"). The base scenario auto-populates with current headcount, budget, and resource allocation data from connected modules.',
          screenshotKey: 'strategy/scenario-step-2',
        },
        {
          number: 3,
          title: 'Adjust variables',
          description:
            'Modify scenario variables such as headcount growth rate, budget increase or decrease percentages, department-level allocations, and project priorities. Each change updates the projected impact on OKR achievement in real time.',
          screenshotKey: 'strategy/scenario-step-3',
        },
        {
          number: 4,
          title: 'Compare scenarios side by side',
          description:
            'Create additional scenarios with different assumptions. Use the "Compare" view to see scenarios side by side with differential highlighting showing where they diverge in cost, headcount, timeline, and projected OKR progress.',
          screenshotKey: 'strategy/scenario-step-4',
          tip: 'Use the AI recommendation button to have Tempo suggest an optimized scenario based on your constraints and historical performance data.',
        },
        {
          number: 5,
          title: 'Select and activate a scenario',
          description:
            'Once the leadership team agrees on a scenario, click "Activate" to set it as the operating plan. Activated scenarios push their headcount and budget targets into the respective modules for execution tracking.',
          screenshotKey: 'strategy/scenario-step-5',
        },
      ],
    },
    {
      id: 'quarterly-review',
      title: 'Conducting a Quarterly Strategy Review',
      description:
        'Use the built-in review workflow to assess OKR progress, recalibrate targets, and prepare for the next planning cycle.',
      estimatedTime: '15 minutes',
      roles: ['owner', 'admin'],
      steps: [
        {
          number: 1,
          title: 'Launch the review workflow',
          description:
            'Navigate to Strategy and click "Start Review" when the review period opens. This triggers a notification to all OKR owners requesting status updates and confidence re-assessments.',
          screenshotKey: 'strategy/review-step-1',
        },
        {
          number: 2,
          title: 'Collect check-in responses',
          description:
            'OKR owners update their key result progress and provide a brief written status. The system aggregates these updates into a review dashboard showing overall progress, at-risk items, and completed objectives.',
          screenshotKey: 'strategy/review-step-2',
        },
        {
          number: 3,
          title: 'Review the AI-generated summary',
          description:
            'Tempo AI generates a narrative summary of the quarter\'s strategic progress, highlighting achievements, missed targets, and patterns across teams. This summary can be exported as a presentation deck.',
          screenshotKey: 'strategy/review-step-3',
        },
        {
          number: 4,
          title: 'Score and close the period',
          description:
            'Apply final scores to each OKR (0.0 to 1.0 scale). Add leadership commentary for organizational learning. Click "Close Period" to archive the quarter\'s OKRs and unlock the next planning period.',
          screenshotKey: 'strategy/review-step-4',
          tip: 'A score of 0.7 is typically considered a strong result for stretch OKRs. Consistently scoring 1.0 may indicate that targets are not ambitious enough.',
        },
      ],
    },
  ],

  faqs: [
    {
      question: 'What is the difference between OKRs and KPIs?',
      answer:
        'OKRs (Objectives and Key Results) are time-bound, aspirational goals that drive strategic progress. KPIs (Key Performance Indicators) are ongoing metrics that measure operational health. In Tempo, OKRs are managed in the Strategy module while KPIs are tracked in the Analytics module. You can link KPIs to key results for automated progress tracking.',
    },
    {
      question: 'Can I use a custom planning cadence instead of quarterly?',
      answer:
        'Yes. While quarterly cadences are the default, you can configure custom planning periods in Settings > Strategy > Planning Periods. Options include monthly, bi-annual, annual, or fully custom date ranges. Each period has its own set of OKRs.',
    },
    {
      question: 'How does the alignment score work?',
      answer:
        'The alignment score is calculated by measuring how many team and individual OKRs are linked to company-level objectives and how actively they are being updated. A score of 100% means every company OKR has at least one linked team OKR with recent progress updates. Orphaned objectives (not linked to anything above or below) lower the score.',
    },
    {
      question: 'Who can see the scenario planning workspace?',
      answer:
        'By default, scenario planning is restricted to Owner and Admin roles. You can grant read-only access to specific managers or board members via the sharing settings on individual scenarios. Activated scenarios\' targets are visible to anyone who can access the related modules.',
    },
    {
      question: 'Can I import OKRs from a spreadsheet?',
      answer:
        'Yes. Navigate to Strategy > Import and upload a CSV or Excel file with columns for objective, key result, owner email, target value, and start value. The import wizard maps your columns and validates the data before creating the OKR hierarchy.',
    },
    {
      question: 'How do I handle mid-quarter changes to OKRs?',
      answer:
        'You can edit key result targets, add new key results, or deprecate existing ones at any time. All changes are tracked in the OKR audit log. If an objective becomes irrelevant, mark it as "Deprioritized" rather than deleting it so the historical record is preserved.',
    },
    {
      question: 'Can board members view the strategy without logging in?',
      answer:
        'Yes. You can generate a read-only shareable link for any strategy overview or scenario comparison. The link requires an access token and can be set to expire after a configurable number of days. No Tempo account is required to view shared strategy pages.',
    },
  ],

  tips: [
    'Limit company-level objectives to 3-5 per quarter to maintain focus and prevent goal dilution.',
    'Schedule automated weekly check-in reminders so OKR owners update progress consistently.',
    'Use the strategy map visualization in all-hands meetings to show the organization how their work connects to company goals.',
    'When scoring OKRs at the end of a period, hold a brief retrospective to capture learnings before setting next quarter\'s goals.',
    'Link project milestones to key results so that project completion automatically updates OKR progress.',
    'Use scenario planning before every major budget decision to quantify the trade-offs between options.',
  ],

  relatedModules: ['analytics', 'headcount', 'projects', 'workflows'],

  permissions: [
    {
      role: 'Owner',
      capabilities: [
        'Create, edit, and close company-level OKRs and planning periods',
        'Access scenario planning workspace with full edit rights',
        'Configure strategy module settings and planning cadences',
        'Generate and manage shareable strategy links for board members',
        'View all team and individual OKRs across the organization',
      ],
    },
    {
      role: 'Admin',
      capabilities: [
        'Create and edit company-level OKRs',
        'Access scenario planning workspace with full edit rights',
        'View all team and individual OKRs',
        'Run quarterly review workflows',
        'Export strategy reports and presentations',
      ],
    },
    {
      role: 'Manager',
      capabilities: [
        'Create and manage team-level OKRs for own team',
        'View company-level OKRs and alignment chain',
        'Submit check-in updates for owned key results',
        'View scenario comparisons when granted read-only access',
      ],
    },
    {
      role: 'Employee',
      capabilities: [
        'Create and manage individual OKRs aligned to team objectives',
        'View company and team OKRs in read-only mode',
        'Submit check-in updates for owned key results',
        'View the strategy map and alignment visualization',
      ],
    },
  ],
}

export default strategy
