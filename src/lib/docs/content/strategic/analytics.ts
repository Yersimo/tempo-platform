import type { ModuleDoc } from '../../types'

const analytics: ModuleDoc = {
  slug: 'analytics',
  title: 'Analytics',
  subtitle: 'Dashboards, AI insights, custom queries, and natural language analytics',
  icon: 'BarChart3',
  group: 'strategic',
  lastUpdated: '2026-03-13',
  version: '1.0',

  overview: {
    description:
      'The Analytics module transforms your workforce data into actionable insights through interactive dashboards, AI-powered analysis, and natural language querying. Build custom dashboards with drag-and-drop widgets, explore pre-built reports covering headcount, compensation, diversity, attrition, and performance, or simply ask questions in plain English and let Tempo AI generate charts and answers. Scheduled report delivery ensures stakeholders always have the latest data without logging in.',
    keyFeatures: [
      'Pre-built dashboards for headcount, compensation equity, diversity, attrition, and performance',
      'Custom dashboard builder with drag-and-drop chart widgets and configurable data sources',
      'Natural language query interface powered by AI for asking questions like "What is our attrition rate in Engineering?"',
      'AI-generated insights that proactively surface trends, anomalies, and recommendations',
      'Scheduled report delivery via email and Slack on daily, weekly, or monthly cadences',
      'Drill-down from any chart to the underlying data with full filtering',
      'Data export to CSV, PDF, and Excel for offline analysis',
      'Embeddable dashboard widgets for internal portals and presentations',
    ],
    screenshotKey: 'analytics/overview',
  },

  workflows: [
    {
      id: 'build-custom-dashboard',
      title: 'Building a Custom Dashboard',
      description:
        'Create a tailored dashboard with specific charts and KPIs relevant to your role or department.',
      estimatedTime: '12 minutes',
      roles: ['owner', 'admin', 'hrbp'],
      steps: [
        {
          number: 1,
          title: 'Navigate to Analytics',
          description:
            'Click "Analytics" in the left sidebar under the Strategic section. The module opens to the default People Overview dashboard.',
          screenshotKey: 'analytics/dashboard-step-1',
        },
        {
          number: 2,
          title: 'Create a new dashboard',
          description:
            'Click "Dashboards" in the top navigation and then "New Dashboard". Enter a name (e.g., "Engineering Health Check") and optional description. Choose whether the dashboard is personal or shared with the organization.',
          screenshotKey: 'analytics/dashboard-step-2',
        },
        {
          number: 3,
          title: 'Add chart widgets',
          description:
            'Click "Add Widget" and select a chart type: bar, line, pie, donut, table, number card, or heatmap. Choose the data source (e.g., employees, leave requests, performance reviews) and configure dimensions and measures.',
          screenshotKey: 'analytics/dashboard-step-3',
          tip: 'Use the "Number Card" widget for key metrics like total headcount or average tenure that should be visible at a glance.',
        },
        {
          number: 4,
          title: 'Configure filters and date ranges',
          description:
            'Add dashboard-level filters that apply to all widgets (e.g., department, location, date range). Users viewing the dashboard can adjust these filters without editing the dashboard layout.',
          screenshotKey: 'analytics/dashboard-step-4',
        },
        {
          number: 5,
          title: 'Arrange and resize widgets',
          description:
            'Drag widgets on the canvas to rearrange their positions. Resize by dragging the corners. Group related charts together for a logical reading flow. The layout is responsive and adapts to different screen sizes.',
          screenshotKey: 'analytics/dashboard-step-5',
        },
        {
          number: 6,
          title: 'Save and share',
          description:
            'Click "Save" to persist the dashboard. Share it with specific users, roles, or the entire organization. Shared dashboards appear in the recipient\'s dashboard list and can be pinned as their default view.',
          screenshotKey: 'analytics/dashboard-step-6',
        },
      ],
    },
    {
      id: 'natural-language-query',
      title: 'Asking Questions with Natural Language',
      description:
        'Use the AI-powered query interface to ask workforce questions in plain English and receive instant visualizations.',
      estimatedTime: '3 minutes',
      roles: ['owner', 'admin', 'hrbp', 'manager'],
      steps: [
        {
          number: 1,
          title: 'Open the AI Query Bar',
          description:
            'In the Analytics module, click the "Ask AI" button in the top navigation bar or press Cmd+K (Ctrl+K) to open the query input. A text field appears with suggested questions.',
          screenshotKey: 'analytics/nlq-step-1',
        },
        {
          number: 2,
          title: 'Type your question',
          description:
            'Enter a question in natural language, such as "What is the average salary by department?" or "Show me attrition trends over the last 12 months". Press Enter to submit.',
          screenshotKey: 'analytics/nlq-step-2',
        },
        {
          number: 3,
          title: 'Review the generated chart',
          description:
            'Tempo AI interprets your question, queries the underlying data, and generates an appropriate visualization. The chart type is automatically selected based on the question (e.g., bar chart for comparisons, line chart for trends).',
          screenshotKey: 'analytics/nlq-step-3',
          tip: 'Refine your question by adding filters: "What is the average salary by department in Ghana for senior engineers?"',
        },
        {
          number: 4,
          title: 'Save to a dashboard',
          description:
            'If the generated chart is useful, click "Save to Dashboard" to add it as a widget to any existing dashboard. The chart configuration is preserved, and data updates automatically.',
          screenshotKey: 'analytics/nlq-step-4',
        },
      ],
    },
    {
      id: 'schedule-reports',
      title: 'Scheduling Automated Report Delivery',
      description:
        'Set up recurring reports that are delivered to stakeholders via email or Slack on a schedule.',
      estimatedTime: '5 minutes',
      roles: ['owner', 'admin'],
      steps: [
        {
          number: 1,
          title: 'Navigate to a dashboard or report',
          description:
            'Open the dashboard or report you want to schedule. Click the "Schedule" button in the top toolbar.',
          screenshotKey: 'analytics/schedule-step-1',
        },
        {
          number: 2,
          title: 'Configure the schedule',
          description:
            'Select the delivery frequency: daily, weekly (choose day), or monthly (choose date). Set the delivery time. The report is generated at the scheduled time with the latest data.',
          screenshotKey: 'analytics/schedule-step-2',
        },
        {
          number: 3,
          title: 'Set recipients and format',
          description:
            'Add recipients by email address or Slack channel. Choose the delivery format: PDF snapshot, interactive link, or both. Optionally add a custom message that accompanies the report.',
          screenshotKey: 'analytics/schedule-step-3',
          tip: 'Use the "Interactive Link" format to allow recipients to drill down into the data when they open the report.',
        },
        {
          number: 4,
          title: 'Activate the schedule',
          description:
            'Review the schedule summary and click "Activate". You can manage all scheduled reports from Analytics > Schedules, where you can pause, edit, or delete any schedule.',
          screenshotKey: 'analytics/schedule-step-4',
        },
      ],
    },
    {
      id: 'explore-ai-insights',
      title: 'Exploring AI-Generated Insights',
      description:
        'Review proactive insights surfaced by Tempo AI that highlight trends, anomalies, and recommendations based on your workforce data.',
      estimatedTime: '5 minutes',
      roles: ['owner', 'admin', 'hrbp'],
      steps: [
        {
          number: 1,
          title: 'Open the Insights feed',
          description:
            'In the Analytics module, click the "Insights" tab. The feed displays AI-generated observations sorted by recency and relevance, each with a confidence score and category tag.',
          screenshotKey: 'analytics/insights-step-1',
        },
        {
          number: 2,
          title: 'Review an insight',
          description:
            'Click on an insight to see the full analysis. Each insight includes a plain-language explanation, the supporting data visualization, the methodology used, and a list of recommended actions.',
          screenshotKey: 'analytics/insights-step-2',
        },
        {
          number: 3,
          title: 'Take action on an insight',
          description:
            'Click "Create Task" to convert an insight\'s recommendation into an actionable task assigned to the appropriate person. Or click "Dismiss" with a reason if the insight is not relevant.',
          screenshotKey: 'analytics/insights-step-3',
        },
        {
          number: 4,
          title: 'Configure insight preferences',
          description:
            'Click "Settings" on the Insights tab to configure which categories of insights you want to receive (e.g., compensation anomalies, diversity trends, attrition risks) and the minimum confidence threshold.',
          screenshotKey: 'analytics/insights-step-4',
          tip: 'Set up Slack notifications for high-confidence insights so you are alerted immediately when the AI detects something significant.',
        },
      ],
    },
  ],

  faqs: [
    {
      question: 'What data sources can I use in custom dashboards?',
      answer:
        'Custom dashboards can pull data from any Tempo module: People (headcount, demographics), Payroll (compensation, costs), Leave (absence rates, balances), Performance (review scores, goal completion), Recruiting (pipeline metrics, time-to-fill), Benefits (enrollment rates), and more. Cross-module joins are supported for advanced analysis.',
    },
    {
      question: 'How does the natural language query handle ambiguous questions?',
      answer:
        'When a question is ambiguous, Tempo AI asks clarifying follow-up questions before generating a chart. For example, if you ask "Show me salaries" without specifying a breakdown dimension, it will ask whether you want salaries by department, level, location, or another grouping.',
    },
    {
      question: 'Can I embed dashboards in other tools?',
      answer:
        'Yes. Each dashboard has an "Embed" option that generates an iframe code snippet or a direct URL. Embedded dashboards are read-only and respect the viewer\'s Tempo permissions. You can embed them in internal wikis, Notion pages, or presentation slides.',
    },
    {
      question: 'How often is dashboard data refreshed?',
      answer:
        'Dashboard data refreshes in real time by default. When you open a dashboard, it queries the latest data. For scheduled reports, data is captured at the moment of generation. You can also set a cache interval (e.g., refresh every 15 minutes) to improve performance for large datasets.',
    },
    {
      question: 'Can I create calculated metrics?',
      answer:
        'Yes. The widget configuration includes a formula builder where you can create calculated metrics using standard arithmetic, date functions, and conditional logic. For example, you can calculate "Cost per Hire" as total recruiting spend divided by hires in the period.',
    },
    {
      question: 'Are there limits on the number of dashboards I can create?',
      answer:
        'There is no limit on personal dashboards. Shared (organization-wide) dashboards are limited by your plan tier. The dashboard list includes search and folder organization to keep large collections manageable.',
    },
    {
      question: 'How does row-level security work in Analytics?',
      answer:
        'Analytics respects Tempo\'s role-based access control. An HRBP only sees data for their assigned departments. A manager sees aggregated data for their team. Compensation data is restricted to Owner, Admin, and HRBP roles. The same dashboard renders different data depending on who is viewing it.',
    },
    {
      question: 'Can I export raw data for analysis in Excel or a BI tool?',
      answer:
        'Yes. Any chart or table widget has an "Export" button that downloads the underlying data as CSV or Excel. Full dataset exports (not filtered by the dashboard) are available from Settings > Data Export for users with the appropriate permissions.',
    },
  ],

  tips: [
    'Pin your most-used dashboard as the default view so it loads immediately when you open the Analytics module.',
    'Use the AI Query Bar for ad-hoc questions and save the results to dashboards for questions you ask repeatedly.',
    'Schedule a weekly headcount and attrition report to the leadership Slack channel to keep workforce metrics top of mind.',
    'Add comparison periods to chart widgets (e.g., this quarter vs. last quarter) to highlight trends at a glance.',
    'Use dashboard filters to create a single flexible dashboard that serves multiple departments, rather than creating separate dashboards for each.',
    'Review the AI Insights feed at least weekly to catch trends that might not be visible from dashboards alone.',
    'Export dashboards as PDF before board meetings to have an offline backup of key workforce metrics.',
  ],

  relatedModules: ['strategy', 'headcount', 'people', 'payroll', 'performance'],

  permissions: [
    {
      role: 'Owner',
      capabilities: [
        'Create, edit, and delete any dashboard (personal and shared)',
        'Access all data sources including compensation and financial data',
        'Configure AI insight preferences and thresholds globally',
        'Schedule report delivery to any recipient',
        'Export full datasets and embed dashboards externally',
      ],
    },
    {
      role: 'Admin',
      capabilities: [
        'Create, edit, and share dashboards',
        'Access all data sources including compensation data',
        'Use the natural language query interface',
        'Schedule reports and manage delivery settings',
        'Export data to CSV, PDF, and Excel',
      ],
    },
    {
      role: 'HRBP',
      capabilities: [
        'Create personal dashboards with data from assigned departments',
        'View shared dashboards filtered to assigned scope',
        'Use the natural language query interface for assigned data',
        'Export filtered data for assigned departments',
      ],
    },
    {
      role: 'Manager',
      capabilities: [
        'View shared dashboards with data scoped to own team',
        'Use the natural language query interface for team-level questions',
        'View pre-built reports for own direct and indirect reports',
      ],
    },
    {
      role: 'Employee',
      capabilities: [
        'View dashboards shared with all employees (aggregated, anonymized data only)',
        'View personal performance and engagement metrics',
      ],
    },
  ],
}

export default analytics
