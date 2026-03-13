import type { ModuleDoc } from '../../types'

const compensation: ModuleDoc = {
  slug: 'compensation',
  title: 'Compensation',
  subtitle: 'Compensation bands, salary reviews, equity grants, total rewards statements, and pay equity analysis',
  icon: 'Banknote',
  group: 'people',
  lastUpdated: '2026-03-13',
  version: '1.0',

  overview: {
    description:
      'The Compensation module centralizes all aspects of employee pay management. Define and maintain compensation bands by level, function, and geography. Run structured salary review cycles with manager recommendations, budget guardrails, and multi-level approvals. Manage equity grants with vesting schedules. Generate total rewards statements so employees understand the full value of their package. Built-in pay equity analytics surface disparities before they become compliance risks.',
    keyFeatures: [
      'Compensation band management with geographic differentials and currency support',
      'Annual and off-cycle salary review workflows with budget tracking',
      'Equity grant management with vesting schedule visualization',
      'Total rewards statements combining salary, equity, benefits, and perks',
      'Pay equity analysis with demographic breakdowns and regression modeling',
      'Compa-ratio tracking with alerts for employees outside band range',
      'Manager recommendation forms with AI-suggested adjustments based on performance and market data',
      'Audit trail for all compensation changes with approval chain history',
    ],
    screenshotKey: 'compensation/overview',
  },

  workflows: [
    {
      id: 'manage-comp-bands',
      title: 'Managing Compensation Bands',
      description:
        'Create and maintain salary bands by job family, level, and location to ensure internal equity and market competitiveness.',
      estimatedTime: '15 minutes',
      roles: ['owner', 'admin', 'hrbp'],
      steps: [
        {
          number: 1,
          title: 'Navigate to Compensation Bands',
          description:
            'Open the Compensation module and click the "Bands" tab. The band matrix displays all job families, levels, and their associated pay ranges (minimum, midpoint, maximum).',
          screenshotKey: 'compensation/bands-step-1',
        },
        {
          number: 2,
          title: 'Create or edit a band',
          description:
            'Click "+ New Band" or click an existing band to edit. Enter the job family, level, base currency, and the min/mid/max salary values. Optionally add geographic differentials as percentage adjustments.',
          screenshotKey: 'compensation/bands-step-2',
        },
        {
          number: 3,
          title: 'Import market data',
          description:
            'Click "Import Market Data" to upload benchmark data from compensation surveys (Radford, Mercer, Pave). The system maps survey data to your bands and highlights where your ranges fall relative to market percentiles.',
          screenshotKey: 'compensation/bands-step-3',
          tip: 'Update market data at least annually to ensure your bands remain competitive with current market rates.',
        },
        {
          number: 4,
          title: 'Review compa-ratio distribution',
          description:
            'The band detail view shows a scatter plot of all employees in that band, their current compa-ratio (salary / midpoint), and color-coded alerts for employees below 0.85 or above 1.15.',
          screenshotKey: 'compensation/bands-step-4',
        },
        {
          number: 5,
          title: 'Publish updated bands',
          description:
            'Click "Publish" to activate the updated bands. Previously published versions are archived for historical reference. The system recalculates compa-ratios for all affected employees automatically.',
          screenshotKey: 'compensation/bands-step-5',
        },
      ],
    },
    {
      id: 'run-salary-review',
      title: 'Running a Salary Review Cycle',
      description:
        'Execute an organization-wide or department-level compensation review with budget allocation, manager recommendations, and multi-level approvals.',
      estimatedTime: '20 minutes',
      roles: ['owner', 'admin', 'hrbp'],
      steps: [
        {
          number: 1,
          title: 'Create a review cycle',
          description:
            'Navigate to Compensation > Review Cycles and click "+ New Cycle." Name the cycle (e.g., "2026 Annual Merit Review"), set the effective date, and select participating departments or the full organization.',
          screenshotKey: 'compensation/review-step-1',
        },
        {
          number: 2,
          title: 'Set the budget',
          description:
            'Define the total budget as a percentage of current payroll (e.g., 4%) or an absolute dollar amount. Optionally allocate different budgets by department. The system tracks spending against budget in real time as managers submit recommendations.',
          screenshotKey: 'compensation/review-step-2',
        },
        {
          number: 3,
          title: 'Managers submit recommendations',
          description:
            'Managers receive a worksheet showing each direct report with their current salary, compa-ratio, performance rating, and tenure. They enter a recommended percentage or dollar increase for each employee. AI suggestions appear based on performance and market positioning.',
          screenshotKey: 'compensation/review-step-3',
          tip: 'Encourage managers to review compa-ratios and performance ratings before making recommendations to ensure equitable distribution.',
        },
        {
          number: 4,
          title: 'HRBP and leadership review',
          description:
            'HRBPs review manager recommendations for their assigned departments. They can flag outliers, suggest adjustments, and add comments. The recommendations then route to senior leadership for final approval.',
          screenshotKey: 'compensation/review-step-4',
        },
        {
          number: 5,
          title: 'Finalize and process',
          description:
            'After approval, click "Finalize Cycle." New salaries are effective on the specified date. The system generates notification letters for managers to share with employees and updates payroll records automatically.',
          screenshotKey: 'compensation/review-step-5',
        },
      ],
    },
    {
      id: 'manage-equity',
      title: 'Managing Equity Grants',
      description:
        'Issue equity grants, track vesting schedules, and provide employees with visibility into their equity position.',
      estimatedTime: '10 minutes',
      roles: ['owner', 'admin'],
      steps: [
        {
          number: 1,
          title: 'Navigate to Equity',
          description:
            'Open the Compensation module and click the "Equity" tab. The equity dashboard shows the total option pool, granted vs. available shares, and a summary of all active grants.',
          screenshotKey: 'compensation/equity-step-1',
        },
        {
          number: 2,
          title: 'Create a new grant',
          description:
            'Click "+ New Grant." Select the employee, grant type (stock options, RSUs, or phantom equity), number of shares, strike price (if applicable), and grant date.',
          screenshotKey: 'compensation/equity-step-2',
        },
        {
          number: 3,
          title: 'Configure the vesting schedule',
          description:
            'Select a vesting template (e.g., 4-year with 1-year cliff) or create a custom schedule. The system generates a month-by-month vesting timeline showing when each tranche becomes exercisable.',
          screenshotKey: 'compensation/equity-step-3',
        },
        {
          number: 4,
          title: 'Submit for board approval',
          description:
            'Equity grants typically require board or compensation committee approval. Click "Submit for Approval" to route the grant through the defined approval chain. Attach supporting documentation as needed.',
          screenshotKey: 'compensation/equity-step-4',
          tip: 'Batch equity grants for the same board meeting to streamline the approval process.',
        },
        {
          number: 5,
          title: 'Notify the employee',
          description:
            'Once approved, the employee receives a notification with their grant details and a link to view their equity summary. The equity section of their total rewards statement updates automatically.',
          screenshotKey: 'compensation/equity-step-5',
        },
      ],
    },
    {
      id: 'run-pay-equity',
      title: 'Running a Pay Equity Analysis',
      description:
        'Analyze compensation data across demographic groups to identify and address pay disparities.',
      estimatedTime: '15 minutes',
      roles: ['owner', 'admin', 'hrbp'],
      steps: [
        {
          number: 1,
          title: 'Open the Pay Equity dashboard',
          description:
            'Navigate to Compensation > Pay Equity. The dashboard displays an overview of median pay by gender, ethnicity, and other demographic dimensions, with statistical significance indicators.',
          screenshotKey: 'compensation/equity-analysis-step-1',
        },
        {
          number: 2,
          title: 'Select analysis parameters',
          description:
            'Choose the scope (organization-wide or specific departments), the comparison dimensions (gender, ethnicity, age), and control variables (job level, tenure, location, performance rating) to isolate unexplained pay gaps.',
          screenshotKey: 'compensation/equity-analysis-step-2',
        },
        {
          number: 3,
          title: 'Review the regression results',
          description:
            'The system runs a multivariate regression and presents the adjusted pay gap as a percentage. Statistically significant gaps are highlighted in red. Drill into individual outliers to understand the drivers.',
          screenshotKey: 'compensation/equity-analysis-step-3',
          tip: 'Run the analysis before each salary review cycle so remediation adjustments can be included in the merit budget.',
        },
        {
          number: 4,
          title: 'Generate a remediation plan',
          description:
            'For each identified gap, the system suggests targeted salary adjustments. Review and accept or modify the recommendations. Accepted adjustments are automatically queued for the next compensation review cycle.',
          screenshotKey: 'compensation/equity-analysis-step-4',
        },
      ],
    },
  ],

  faqs: [
    {
      question: 'What is a compa-ratio and why does it matter?',
      answer:
        'A compa-ratio is your current salary divided by the midpoint of your compensation band. A ratio of 1.0 means you are paid at the midpoint. Below 0.85 may indicate you are underpaid; above 1.15 may indicate you are above band. HRBPs use compa-ratios to identify pay inequities and prioritize adjustments.',
    },
    {
      question: 'Can employees see their compensation band?',
      answer:
        'This is configurable per organization. In Settings > Compensation > Transparency, admins can choose to show employees their band range, their compa-ratio, both, or neither. Many organizations share band ranges to promote pay transparency.',
    },
    {
      question: 'How are geographic pay differentials calculated?',
      answer:
        'Geographic differentials are set as percentage adjustments relative to a base location (e.g., San Francisco = 100%, Austin = 85%). These multipliers are applied to the band midpoint. Admins configure differentials by city, state, or country in the Bands settings.',
    },
    {
      question: 'Can I run an off-cycle salary adjustment?',
      answer:
        'Yes. Managers or HRBPs can submit an off-cycle adjustment request for situations like promotions, retention risks, or equity corrections. Off-cycle requests follow a separate approval workflow and are logged independently from annual review cycles.',
    },
    {
      question: 'How is equity grant data secured?',
      answer:
        'Equity data is classified as highly sensitive and encrypted at rest and in transit. Access is restricted to the employee (their own grants only), designated HR admins, and the finance team. All access is logged in the audit trail.',
    },
    {
      question: 'What happens to equity when an employee leaves?',
      answer:
        'When an employee is offboarded, unvested equity is forfeited according to the grant agreement. Vested options typically have a post-termination exercise window (commonly 90 days). The system automatically calculates the vested balance and notifies the departing employee of their exercise deadline.',
    },
    {
      question: 'How do total rewards statements work?',
      answer:
        'Total rewards statements aggregate salary, bonus, equity value, benefits costs, and perks into a single view showing the employee\'s total compensation package. Employees can access their statement from their profile. Admins can trigger statement generation annually or on demand.',
    },
  ],

  tips: [
    'Review compa-ratio distributions before each salary review cycle to proactively identify employees who may be falling behind market rates.',
    'Use the budget tracking dashboard during review cycles to ensure managers allocate merit increases equitably rather than front-loading the budget.',
    'Link compensation data to the Performance module so merit recommendations are informed by objective performance ratings.',
    'Run pay equity analysis quarterly — waiting for annual reviews means disparities can widen for months before being addressed.',
    'Export total rewards statements as PDFs for use during retention conversations or counter-offer discussions.',
  ],

  relatedModules: ['performance', 'payroll', 'people', 'analytics'],

  permissions: [
    {
      role: 'Owner',
      capabilities: [
        'Full access to all compensation data, bands, equity, and pay equity analytics',
        'Approve compensation changes that exceed band limits',
        'Configure compensation band structures and geographic differentials',
        'Manage equity pool allocation and board approval workflows',
      ],
    },
    {
      role: 'Admin',
      capabilities: [
        'Create and manage compensation bands and review cycles',
        'Process salary adjustments and equity grants',
        'Run pay equity analysis and generate remediation plans',
        'Configure total rewards statement templates',
      ],
    },
    {
      role: 'HRBP',
      capabilities: [
        'View compensation data for assigned departments',
        'Review and approve manager salary recommendations',
        'Initiate off-cycle adjustment requests',
        'Access pay equity reports for assigned scope',
      ],
    },
    {
      role: 'Manager',
      capabilities: [
        'View compensation band ranges for their team\'s roles',
        'Submit salary increase recommendations during review cycles',
        'View compa-ratios for direct reports',
        'Request off-cycle adjustments with justification',
      ],
    },
    {
      role: 'Employee',
      capabilities: [
        'View personal salary, equity grants, and total rewards statement',
        'View compensation band range (if transparency is enabled)',
        'Access vesting schedule and equity value calculator',
      ],
    },
  ],
}

export default compensation
