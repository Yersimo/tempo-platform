import type { ModuleDoc } from '../../types'

const headcount: ModuleDoc = {
  slug: 'headcount',
  title: 'Headcount Planning',
  subtitle: 'Workforce planning, headcount forecasting, and attrition prediction',
  icon: 'UserPlus',
  group: 'strategic',
  lastUpdated: '2026-03-13',
  version: '1.0',

  overview: {
    description:
      'The Headcount Planning module gives HR and finance leaders the tools to plan, forecast, and manage workforce growth across the organization. Build headcount plans by department and role, model hiring scenarios against budget constraints, and use AI-driven attrition predictions to proactively backfill at-risk positions. The module integrates with the Recruiting and People modules to track plan-to-actual variance in real time, ensuring your workforce strategy stays on course.',
    keyFeatures: [
      'Department-level headcount plans with role, level, and location breakdowns',
      'Budget-integrated hiring forecasts that calculate fully-loaded cost per hire',
      'AI-powered attrition risk scoring for every employee based on tenure, compensation, and engagement signals',
      'Plan-to-actual tracking showing approved positions versus filled positions',
      'Hiring timeline modeling with configurable time-to-fill assumptions',
      'Scenario comparison for conservative, moderate, and aggressive growth plans',
      'Approval workflows for new headcount requests with budget validation',
      'Multi-year workforce planning with rolling forecast capabilities',
    ],
    screenshotKey: 'headcount/overview',
  },

  workflows: [
    {
      id: 'create-headcount-plan',
      title: 'Creating an Annual Headcount Plan',
      description:
        'Build a comprehensive headcount plan for the upcoming fiscal year, including new hires, backfills, and expected attrition.',
      estimatedTime: '20 minutes',
      roles: ['owner', 'admin', 'hrbp'],
      prerequisites: [
        'Current employee data must be up to date in the People module',
        'Department budgets should be finalized or estimated in the Finance module',
        'Compensation bands must be configured in Settings > Compensation',
      ],
      steps: [
        {
          number: 1,
          title: 'Navigate to Headcount Planning',
          description:
            'Click "Headcount" in the left sidebar under the Strategic section. The module opens to the current fiscal year\'s planning dashboard.',
          screenshotKey: 'headcount/plan-step-1',
        },
        {
          number: 2,
          title: 'Create a new plan',
          description:
            'Click "New Plan" and select the fiscal year or custom date range. Enter the plan name (e.g., "FY2027 Workforce Plan"). The system pre-populates the plan with current headcount by department from the People module.',
          screenshotKey: 'headcount/plan-step-2',
        },
        {
          number: 3,
          title: 'Set growth targets by department',
          description:
            'For each department, enter the target headcount for the end of the planning period. Use the "Add Role" button to specify which roles and levels you plan to hire. The system calculates the number of new hires needed after accounting for current headcount.',
          screenshotKey: 'headcount/plan-step-3',
          tip: 'Enable "Include Predicted Attrition" to have the plan automatically account for employees flagged as high attrition risk, adding backfill positions.',
        },
        {
          number: 4,
          title: 'Review cost projections',
          description:
            'The cost projection panel updates in real time as you modify targets. It shows estimated salary costs, benefits overhead, recruiting fees, and onboarding costs. Costs are calculated using the midpoint of the compensation band for each role and level.',
          screenshotKey: 'headcount/plan-step-4',
        },
        {
          number: 5,
          title: 'Set hiring timelines',
          description:
            'For each planned position, set the target start month. The system distributes hiring activity across the year and overlays recruiting pipeline assumptions (configurable average time-to-fill per role category).',
          screenshotKey: 'headcount/plan-step-5',
        },
        {
          number: 6,
          title: 'Submit for approval',
          description:
            'Click "Submit for Approval" to route the headcount plan through the configured approval workflow. Approvers (typically VP of Finance and CHRO) receive a notification with a link to the plan summary and cost impact.',
          screenshotKey: 'headcount/plan-step-6',
        },
      ],
    },
    {
      id: 'request-new-headcount',
      title: 'Requesting New Headcount',
      description:
        'Submit a request for an additional headcount position outside the existing approved plan.',
      estimatedTime: '5 minutes',
      roles: ['manager', 'hrbp'],
      prerequisites: [
        'An approved headcount plan for the current period must exist',
        'Business justification for the additional position',
      ],
      steps: [
        {
          number: 1,
          title: 'Open the headcount request form',
          description:
            'In the Headcount module, click "Request Headcount" in the top-right corner. A form opens for entering the details of the new position.',
          screenshotKey: 'headcount/request-step-1',
        },
        {
          number: 2,
          title: 'Fill in position details',
          description:
            'Enter the job title, level, department, location, and employment type. Select the target start date and whether this is a net-new position or a backfill for a departing employee.',
          screenshotKey: 'headcount/request-step-2',
        },
        {
          number: 3,
          title: 'Provide business justification',
          description:
            'Write a brief justification explaining why this position is needed. Include impact on team capacity, revenue implications, or strategic alignment. Optionally attach supporting documents.',
          screenshotKey: 'headcount/request-step-3',
          tip: 'Requests that reference specific OKRs from the Strategy module have a higher approval rate because they demonstrate strategic alignment.',
        },
        {
          number: 4,
          title: 'Submit for approval',
          description:
            'Click "Submit" to route the request through the approval chain. The system automatically calculates the budget impact and includes it in the approval notification. Track the request status on your "My Requests" dashboard.',
          screenshotKey: 'headcount/request-step-4',
        },
      ],
    },
    {
      id: 'attrition-prediction',
      title: 'Reviewing Attrition Predictions',
      description:
        'Use AI-powered attrition risk scoring to identify employees who may leave and proactively plan backfills.',
      estimatedTime: '10 minutes',
      roles: ['owner', 'admin', 'hrbp'],
      steps: [
        {
          number: 1,
          title: 'Open the Attrition Dashboard',
          description:
            'Navigate to Headcount > Attrition. The dashboard displays a summary of organization-wide attrition risk, including a distribution chart showing the percentage of employees at low, medium, and high risk.',
          screenshotKey: 'headcount/attrition-step-1',
        },
        {
          number: 2,
          title: 'Review high-risk employees',
          description:
            'Click the "High Risk" segment to see a detailed list of employees with elevated attrition risk. Each row shows the employee\'s name, department, tenure, risk score, and the top contributing factors (e.g., compensation below market, low engagement score, manager change).',
          screenshotKey: 'headcount/attrition-step-2',
        },
        {
          number: 3,
          title: 'Drill into individual risk profiles',
          description:
            'Click on an employee to see their full risk profile. The profile shows a historical trend of their risk score, the weighted factors contributing to the score, and recommended retention actions.',
          screenshotKey: 'headcount/attrition-step-3',
          tip: 'The attrition model is updated monthly. Risk scores incorporate data from compensation, performance reviews, time-off patterns, and engagement surveys.',
        },
        {
          number: 4,
          title: 'Create proactive backfill plans',
          description:
            'For high-risk employees in critical roles, click "Plan Backfill" to add a contingency position to the headcount plan. This position is flagged as conditional and only activates if the employee departs.',
          screenshotKey: 'headcount/attrition-step-4',
        },
        {
          number: 5,
          title: 'Export attrition report',
          description:
            'Click "Export" to download the attrition analysis as a PDF or CSV. The report can be shared with leadership to inform retention strategy discussions and budget planning.',
          screenshotKey: 'headcount/attrition-step-5',
        },
      ],
    },
    {
      id: 'track-plan-vs-actual',
      title: 'Tracking Plan vs. Actual Headcount',
      description:
        'Monitor how actual hiring progress compares to the approved headcount plan throughout the year.',
      estimatedTime: '5 minutes',
      roles: ['owner', 'admin', 'hrbp', 'manager'],
      steps: [
        {
          number: 1,
          title: 'Open the Plan vs. Actual view',
          description:
            'In the Headcount module, click the "Plan vs. Actual" tab. The view displays a chart showing planned headcount growth as a line and actual headcount as a filled area, with variance highlighted.',
          screenshotKey: 'headcount/pva-step-1',
        },
        {
          number: 2,
          title: 'Filter by department',
          description:
            'Use the department filter to narrow the view to a specific team. The chart updates to show plan-to-actual variance for only that department, with a table below listing each planned position and its current status.',
          screenshotKey: 'headcount/pva-step-2',
        },
        {
          number: 3,
          title: 'Review position statuses',
          description:
            'Each planned position has a status: Not Started, Req Open, Interviewing, Offer Extended, Filled, or Cancelled. Click on any position to see its linked recruiting pipeline and the candidate funnel if integrated with the Recruiting module.',
          screenshotKey: 'headcount/pva-step-3',
        },
        {
          number: 4,
          title: 'Identify and address variances',
          description:
            'Positions that are behind schedule are highlighted in amber. Click "View Details" to see the root cause (e.g., recruiter not assigned, pipeline too thin, hiring manager unavailable). Create action items directly from the variance report.',
          screenshotKey: 'headcount/pva-step-4',
        },
      ],
    },
  ],

  faqs: [
    {
      question: 'How is the attrition risk score calculated?',
      answer:
        'The attrition risk score is generated by a machine learning model trained on historical turnover data across Tempo customers (anonymized). Factors include tenure, compensation relative to market and internal peers, performance review trends, manager tenure and rating, time-off patterns, promotion velocity, and engagement survey responses. The score is a percentage from 0% (lowest risk) to 100% (highest risk).',
    },
    {
      question: 'Can I create headcount plans for multiple years?',
      answer:
        'Yes. The module supports multi-year workforce planning. Create a plan for each fiscal year or use the rolling forecast feature to maintain a continuously updated 12-month or 24-month look-ahead. Multi-year plans can share assumptions and link to the same strategic scenarios.',
    },
    {
      question: 'How does the budget integration work?',
      answer:
        'When you add positions to a headcount plan, the system calculates costs using compensation band midpoints plus a configurable benefits overhead multiplier (default 1.3x). These costs are synced to the Finance module\'s budget tracker. When a position is filled, actual compensation replaces the estimated cost.',
    },
    {
      question: 'Can hiring managers see the headcount plan?',
      answer:
        'Hiring managers can see the positions planned for their department, including role, level, target start date, and current status. They cannot see compensation details or the full organizational headcount plan unless granted access by an Admin or HRBP.',
    },
    {
      question: 'What happens when an employee flagged as high-risk actually leaves?',
      answer:
        'When a high-risk employee is offboarded, the contingency backfill position (if created) is automatically activated and can be pushed to the Recruiting module as an open requisition. The attrition model also uses the departure to improve future predictions.',
    },
    {
      question: 'Can I adjust the attrition model\'s sensitivity?',
      answer:
        'Yes. In Settings > Headcount > Attrition Model, you can adjust the risk threshold percentages for Low, Medium, and High categories. You can also weight certain factors higher or lower based on what you believe is most predictive for your organization.',
    },
    {
      question: 'How often is the headcount plan updated?',
      answer:
        'The plan itself is static once approved, but the plan-to-actual tracking updates in real time as positions move through the recruiting pipeline. You can create plan amendments (versioned updates) that go through the same approval workflow as the original plan.',
    },
  ],

  tips: [
    'Run the attrition prediction review monthly and share the top-line findings with department leaders to keep retention top of mind.',
    'When building annual plans, start from the strategic OKRs and work backward to determine what workforce capacity is needed to deliver.',
    'Use the scenario comparison feature to model the impact of a hiring freeze before leadership meetings.',
    'Set up automated alerts for positions that are more than 30 days past their target fill date.',
    'Include contractor and temporary staff in your headcount plans by using the "Contingent" employment type for a complete workforce picture.',
    'Review plan-to-actual variance bi-weekly during high-growth periods to catch pipeline bottlenecks early.',
  ],

  relatedModules: ['people', 'recruiting', 'strategy', 'analytics', 'payroll'],

  permissions: [
    {
      role: 'Owner',
      capabilities: [
        'Create, edit, and approve headcount plans and amendments',
        'View attrition predictions for all employees',
        'Configure attrition model settings and risk thresholds',
        'Access all cost projections and budget impact data',
        'Export headcount reports and forecasts',
      ],
    },
    {
      role: 'Admin',
      capabilities: [
        'Create and edit headcount plans',
        'Approve or reject headcount requests',
        'View attrition predictions for all employees',
        'Access cost projections and budget data',
        'Export headcount reports',
      ],
    },
    {
      role: 'HRBP',
      capabilities: [
        'Create and edit headcount plans for assigned departments',
        'View attrition predictions for assigned employees',
        'Submit headcount requests on behalf of managers',
        'View plan-to-actual tracking for assigned departments',
      ],
    },
    {
      role: 'Manager',
      capabilities: [
        'View headcount plan positions for own department',
        'Submit headcount requests with business justification',
        'View plan-to-actual status for own department positions',
        'View attrition risk summary for direct reports (score only, not contributing factors)',
      ],
    },
  ],
}

export default headcount
