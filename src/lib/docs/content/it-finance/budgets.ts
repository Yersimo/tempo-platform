import type { ModuleDoc } from '../../types'

const budgets: ModuleDoc = {
  slug: 'finance/budgets',
  title: 'Budgets',
  subtitle: 'Plan, allocate, and track departmental budgets with variance analysis and forecasting tools',
  icon: 'PieChart',
  group: 'it-finance',
  lastUpdated: '2026-03-13',
  version: '1.0',

  overview: {
    description:
      'The Budgets module gives finance teams and department heads complete control over organizational spending. Build annual and quarterly budgets from scratch or roll forward from prior periods, allocate funds across departments, cost centers, and projects, and monitor actuals against plan in real time. Variance analysis surfaces overspend risks early, while AI-powered forecasting projects year-end outcomes based on current run rates. The module integrates seamlessly with Invoices, Corporate Cards, and Payroll to pull actuals automatically, eliminating manual reconciliation.',
    keyFeatures: [
      'Top-down and bottom-up budget planning with collaborative editing',
      'Real-time actuals vs. budget tracking with automated data ingestion',
      'Variance analysis with threshold-based alerts for overspend risk',
      'AI-powered year-end forecasting based on current spending trends',
      'Multi-level budget hierarchy: organization, department, cost center, project',
      'Budget revision workflows with version history and approval chain',
      'Seasonal adjustment modeling for non-linear spending patterns',
      'Consolidated reporting across entities and currencies',
    ],
    screenshotKey: 'budgets/overview',
  },

  workflows: [
    {
      id: 'create-budget',
      title: 'Creating an Annual Budget',
      description:
        'Build a new annual budget from scratch or by rolling forward the prior year budget with adjustable growth factors applied to each category.',
      estimatedTime: '10 minutes',
      roles: ['owner', 'admin'],
      steps: [
        {
          number: 1,
          title: 'Start the budget planning wizard',
          description:
            'Navigate to Budgets and click "+ New Budget." Select the fiscal year, budget type (Annual or Quarterly), and base currency. Choose whether to start from a blank template or roll forward from the prior period.',
          screenshotKey: 'budgets/create-step-1',
          tip: 'Rolling forward from the prior year pre-fills all categories with last year\'s figures, saving significant setup time.',
        },
        {
          number: 2,
          title: 'Define the budget structure',
          description:
            'Configure the hierarchy of budget categories. The default structure follows your chart of accounts, but you can add custom categories, merge existing ones, or create sub-categories. Drag and drop to reorder the hierarchy.',
          screenshotKey: 'budgets/create-step-2',
        },
        {
          number: 3,
          title: 'Allocate amounts by category',
          description:
            'Enter planned amounts for each category and period. Use the spreadsheet-style grid to input monthly or quarterly figures. The system calculates row and column totals automatically. For rolled-forward budgets, adjust amounts using percentage modifiers or absolute changes.',
          screenshotKey: 'budgets/create-step-3',
        },
        {
          number: 4,
          title: 'Distribute across departments',
          description:
            'Allocate the top-level budget to departments. Use the distribution tool to split amounts proportionally based on headcount, historical spend, or custom weightings. Department heads can be invited to review and adjust their allocations before finalization.',
          screenshotKey: 'budgets/create-step-4',
          tip: 'Enable "Bottom-Up Mode" to let department heads submit their own budget requests, which roll up to the organizational total for executive review.',
        },
        {
          number: 5,
          title: 'Apply seasonal adjustments',
          description:
            'For categories with non-linear spending patterns (e.g., marketing events, seasonal hiring), use the seasonal adjustment tool to distribute the annual total across months using a custom curve or predefined templates such as "Front-Loaded" or "Q4 Heavy."',
          screenshotKey: 'budgets/create-step-5',
        },
        {
          number: 6,
          title: 'Submit for approval',
          description:
            'Review the budget summary showing total allocation, year-over-year change, and department breakdown. Click "Submit for Approval" to route the budget through the configured approval chain. Approvers receive an email notification with a link to the review screen.',
          screenshotKey: 'budgets/create-step-6',
        },
      ],
    },
    {
      id: 'track-budget',
      title: 'Tracking Budget vs. Actuals',
      description:
        'Monitor real-time spending against budgeted amounts, identify variances, and take corrective action before overruns occur.',
      estimatedTime: '4 minutes',
      roles: ['owner', 'admin', 'manager'],
      steps: [
        {
          number: 1,
          title: 'Open the budget tracker',
          description:
            'Navigate to Budgets and select the active budget period. The tracker dashboard shows a summary bar at the top with total budget, total spent, remaining balance, and a burn-rate indicator showing whether spending is on track.',
          screenshotKey: 'budgets/track-step-1',
        },
        {
          number: 2,
          title: 'Review the variance table',
          description:
            'Scroll to the variance table that lists every budget category with columns for Budgeted, Actual, Variance (amount and percentage), and a status indicator (green for under budget, amber for approaching limit, red for over budget).',
          screenshotKey: 'budgets/track-step-2',
          tip: 'Click any category row to drill down into the individual transactions that make up the actual spend.',
        },
        {
          number: 3,
          title: 'Analyze spending trends',
          description:
            'Click the "Trends" tab to see a time-series chart comparing cumulative budget vs. actual spending by month. The chart includes a projected trajectory line showing where spending is headed based on the current run rate.',
          screenshotKey: 'budgets/track-step-3',
        },
        {
          number: 4,
          title: 'Set up variance alerts',
          description:
            'Click "Alert Settings" to configure notifications when spending reaches specified thresholds (e.g., 75%, 90%, 100% of budget). Alerts can be sent via in-app notification, email, or Slack to the budget owner and designated watchers.',
          screenshotKey: 'budgets/track-step-4',
        },
        {
          number: 5,
          title: 'Export a variance report',
          description:
            'Click "Export" to generate a detailed variance report as PDF or Excel. The report includes category-level breakdowns, trend charts, and commentary fields for explanations. Use this for monthly finance reviews or board reporting.',
          screenshotKey: 'budgets/track-step-5',
        },
      ],
    },
    {
      id: 'revise-budget',
      title: 'Submitting a Budget Revision',
      description:
        'Request changes to an approved budget when business conditions change, with full version tracking and re-approval workflows.',
      estimatedTime: '5 minutes',
      roles: ['owner', 'admin', 'manager'],
      steps: [
        {
          number: 1,
          title: 'Initiate a revision',
          description:
            'Open the active budget and click "Request Revision." Select the revision type: "Reallocation" (move funds between categories with no net change) or "Amendment" (increase or decrease the total budget). Enter a reason for the revision.',
          screenshotKey: 'budgets/revise-step-1',
        },
        {
          number: 2,
          title: 'Make your adjustments',
          description:
            'Edit the affected categories in the revision editor. Changed cells are highlighted in blue, and a revision summary panel on the right shows the net impact. For reallocations, the net change must equal zero. For amendments, the new total is displayed prominently.',
          screenshotKey: 'budgets/revise-step-2',
          tip: 'Add line-level comments to explain the rationale for each change — approvers can see these during review.',
        },
        {
          number: 3,
          title: 'Compare revision to original',
          description:
            'Click "Compare Versions" to see a side-by-side diff of the original approved budget and your proposed revision. Differences are color-coded: increases in green, decreases in red, and unchanged items in gray.',
          screenshotKey: 'budgets/revise-step-3',
        },
        {
          number: 4,
          title: 'Submit revision for approval',
          description:
            'Click "Submit Revision" to route the change through the approval workflow. Amendments above a configurable threshold require CFO or executive approval. The current budget remains active while the revision is pending.',
          screenshotKey: 'budgets/revise-step-4',
        },
      ],
    },
    {
      id: 'forecast-yearend',
      title: 'Running a Year-End Forecast',
      description:
        'Use the AI-powered forecasting engine to project year-end spending based on actuals-to-date and seasonal patterns, helping finance teams plan proactively.',
      estimatedTime: '5 minutes',
      roles: ['owner', 'admin'],
      steps: [
        {
          number: 1,
          title: 'Access the forecasting tool',
          description:
            'Navigate to Budgets > Forecasting. The tool displays the current year budget alongside year-to-date actuals and a projected year-end total. The default projection uses a straight-line extrapolation of the current run rate.',
          screenshotKey: 'budgets/forecast-step-1',
        },
        {
          number: 2,
          title: 'Select a forecasting model',
          description:
            'Choose from three forecasting models: "Linear" (straight-line projection), "Seasonal" (applies prior-year seasonal patterns to remaining months), or "AI-Assisted" (uses machine learning to factor in historical trends, planned events, and hiring pipeline).',
          screenshotKey: 'budgets/forecast-step-2',
          tip: 'The AI-Assisted model is most accurate after at least 6 months of actual data. For earlier in the year, the Seasonal model typically performs better.',
        },
        {
          number: 3,
          title: 'Adjust forecast assumptions',
          description:
            'Override automatic projections for specific categories where you have knowledge the model lacks. For example, if a planned marketing campaign will not occur, reduce that category manually. Adjusted cells are marked with a manual override icon.',
          screenshotKey: 'budgets/forecast-step-3',
        },
        {
          number: 4,
          title: 'Review scenario analysis',
          description:
            'The forecast tool generates three scenarios: Best Case (5th percentile), Expected (median), and Worst Case (95th percentile). Review each scenario to understand the range of possible outcomes and prepare contingency plans.',
          screenshotKey: 'budgets/forecast-step-4',
        },
        {
          number: 5,
          title: 'Save and share the forecast',
          description:
            'Click "Save Forecast" to snapshot the current projection. Saved forecasts appear in the version history for comparison. Click "Share" to distribute the forecast as a PDF report to stakeholders with an optional executive summary.',
          screenshotKey: 'budgets/forecast-step-5',
        },
      ],
    },
  ],

  faqs: [
    {
      question: 'How are actuals pulled into the budget tracker?',
      answer:
        'Actuals are ingested automatically from connected modules. Approved invoices, corporate card transactions, payroll runs, and expense reports flow into the budget tracker in real time. Each transaction is mapped to a budget category via its GL account code. You can also import manual journal entries via CSV for items not captured by other modules.',
    },
    {
      question: 'Can multiple people collaborate on the same budget?',
      answer:
        'Yes. Budget planning supports concurrent editing by multiple users. Each user\'s changes are tracked with their name and timestamp. Conflicts are resolved by a last-write-wins policy, but the full edit history is preserved so you can review and revert changes. Enable "Bottom-Up Mode" to let department heads work on their sections independently before rolling up.',
    },
    {
      question: 'What happens if actual spending exceeds the budget?',
      answer:
        'The system sends alerts at configurable thresholds (default: 75%, 90%, and 100%). When a category reaches 100%, it is flagged as over-budget in the tracker. Depending on your organization\'s policy, further spending against that category can be blocked (hard limit) or allowed with a warning (soft limit). All overages are highlighted in monthly variance reports.',
    },
    {
      question: 'Can I create budgets for projects rather than departments?',
      answer:
        'Yes. The budget hierarchy supports department-level and project-level budgets. Create a project budget by selecting "Project" as the budget type and linking it to a project code. Project budgets can draw from departmental allocations or stand alone. Cross-departmental projects can aggregate contributions from multiple department budgets.',
    },
    {
      question: 'How does the system handle multi-currency budgets?',
      answer:
        'You set a base currency for each budget. Transactions in foreign currencies are converted using the daily exchange rate at the transaction date. The variance report shows both the local currency amount and the base currency equivalent. You can also set budget amounts in local currencies for international offices and consolidate at the organizational level using a configurable exchange rate (spot, monthly average, or budget rate).',
    },
    {
      question: 'Can I lock a budget to prevent further changes?',
      answer:
        'Yes. Once a budget is finalized and approved, an Admin or Owner can lock it. Locked budgets cannot be edited directly — changes require a formal revision request that goes through the approval workflow. Locking prevents accidental modifications and provides an audit-ready record of the approved plan.',
    },
  ],

  tips: [
    'Use the roll-forward feature when creating next year\'s budget — it pre-fills all categories with current year figures and lets you apply percentage adjustments in bulk.',
    'Set up variance alerts at 75% to give yourself an early warning before any category approaches its limit.',
    'Enable the "Bottom-Up Mode" planning process to involve department heads early, reducing revision cycles later.',
    'Review the AI-powered forecast monthly to catch trajectory changes before they become material overruns.',
    'Tag budget line items with project codes to track both departmental and project-level spending simultaneously.',
    'Use the seasonal adjustment tool for categories like travel or events where spending is not evenly distributed across months.',
  ],

  relatedModules: ['finance/invoices', 'finance/cards', 'finance/global-spend', 'finance/bill-pay'],

  permissions: [
    {
      role: 'Owner',
      capabilities: [
        'Create, edit, approve, and lock budgets for the entire organization',
        'Configure budget workflows, thresholds, and approval chains',
        'Access all variance reports, forecasts, and consolidated views',
        'Approve budget revisions and amendments of any size',
        'Manage budget hierarchy and category structures',
      ],
    },
    {
      role: 'Admin',
      capabilities: [
        'Create and edit budgets within assigned departments or cost centers',
        'Approve budget revisions within delegated authority limits',
        'Access variance reports and forecasting tools for assigned scope',
        'Configure alert thresholds and notification preferences',
      ],
    },
    {
      role: 'Manager',
      capabilities: [
        'View budget vs. actuals for their department',
        'Submit budget revision requests for their department',
        'Participate in bottom-up budget planning for their team',
        'Access departmental variance and trend reports',
      ],
    },
    {
      role: 'Employee',
      capabilities: [
        'View summary-level budget information for their department',
        'See remaining budget when submitting expense claims or purchase requests',
      ],
    },
  ],
}

export default budgets
