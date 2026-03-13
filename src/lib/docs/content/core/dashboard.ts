import type { ModuleDoc } from '../../types'

const dashboard: ModuleDoc = {
  slug: 'dashboard',
  title: 'Dashboard',
  subtitle: 'Executive overview with KPI cards, AI-powered insights, and real-time workforce analytics',
  icon: 'LayoutDashboard',
  group: 'core',
  lastUpdated: '2026-03-13',
  version: '1.0',

  overview: {
    description:
      'The Dashboard is your central command center for workforce intelligence. It surfaces key performance indicators, headcount trends, attrition risk, payroll summaries, and AI-generated insights in a single, configurable view. Designed for executives, HR leaders, and managers, the dashboard adapts its content based on your role and permissions, ensuring every user sees the metrics most relevant to their responsibilities.',
    keyFeatures: [
      'Real-time KPI cards for headcount, attrition, open requisitions, and payroll spend',
      'AI-powered insight cards with trend detection and anomaly alerts',
      'Departmental breakdown with drill-down capability',
      'Configurable widget layout with drag-and-drop reordering',
      'Team metrics view for managers showing direct reports and pending actions',
      'Multi-currency support for global organizations',
      'Export dashboard snapshots to PDF for board reporting',
      'Role-based content filtering with automatic data scoping',
    ],
    screenshotKey: 'dashboard/overview',
  },

  workflows: [
    {
      id: 'navigate-dashboard',
      title: 'Navigating the Dashboard',
      description:
        'Learn how to read and interact with the executive dashboard to quickly understand your organization\'s workforce health at a glance.',
      estimatedTime: '3 minutes',
      roles: ['owner', 'admin', 'hrbp', 'manager', 'employee'],
      steps: [
        {
          number: 1,
          title: 'Access the dashboard',
          description:
            'Click "Dashboard" in the left sidebar or navigate to /dashboard. The dashboard loads automatically after login as your default landing page.',
          screenshotKey: 'dashboard/navigate-step-1',
        },
        {
          number: 2,
          title: 'Review the KPI summary row',
          description:
            'The top row displays four headline KPI cards: Total Headcount, Monthly Attrition Rate, Open Requisitions, and Payroll Spend. Each card shows the current value, the change from the previous period, and a trend indicator arrow.',
          screenshotKey: 'dashboard/navigate-step-2',
          tip: 'Click any KPI card to drill down into the detailed module for that metric.',
        },
        {
          number: 3,
          title: 'Explore the departmental breakdown',
          description:
            'Scroll down to the department distribution chart. This horizontal bar chart shows headcount by department with color-coded segments for each level band. Hover over any segment to see exact counts.',
          screenshotKey: 'dashboard/navigate-step-3',
        },
        {
          number: 4,
          title: 'Read the AI insights panel',
          description:
            'The AI Insights section on the right side surfaces automatically detected patterns such as unusual attrition spikes, compensation outliers, or upcoming compliance deadlines. Each insight includes a severity badge (info, warning, critical) and a recommended action.',
          screenshotKey: 'dashboard/navigate-step-4',
        },
        {
          number: 5,
          title: 'Check pending actions',
          description:
            'The "Pending Actions" widget lists items requiring your attention, such as leave approvals, expense claims, or performance review deadlines. Items are sorted by urgency with the most time-sensitive tasks at the top.',
          screenshotKey: 'dashboard/navigate-step-5',
        },
      ],
    },
    {
      id: 'customize-widgets',
      title: 'Customizing Dashboard Widgets',
      description:
        'Personalize your dashboard layout by rearranging, adding, or removing widgets to focus on the metrics that matter most to your role.',
      estimatedTime: '5 minutes',
      roles: ['owner', 'admin', 'hrbp', 'manager'],
      steps: [
        {
          number: 1,
          title: 'Enter edit mode',
          description:
            'Click the "Customize" button in the top-right corner of the dashboard. The widget grid enters edit mode, displaying drag handles and remove buttons on each widget.',
          screenshotKey: 'dashboard/customize-step-1',
        },
        {
          number: 2,
          title: 'Rearrange widgets',
          description:
            'Click and drag any widget by its handle to reposition it within the grid. Widgets snap to the grid automatically. Other widgets will shift to accommodate the new position.',
          screenshotKey: 'dashboard/customize-step-2',
        },
        {
          number: 3,
          title: 'Add a new widget',
          description:
            'Click the "+ Add Widget" button at the bottom of the grid. A modal opens showing available widgets organized by category: KPIs, Charts, Lists, and AI Insights. Select a widget to add it to the next available grid position.',
          screenshotKey: 'dashboard/customize-step-3',
          tip: 'Available widgets depend on your role and the modules enabled for your organization.',
        },
        {
          number: 4,
          title: 'Remove a widget',
          description:
            'Click the X icon on any widget to remove it from your dashboard. Removed widgets can be re-added at any time from the widget library.',
          screenshotKey: 'dashboard/customize-step-4',
        },
        {
          number: 5,
          title: 'Resize a widget',
          description:
            'Drag the bottom-right corner of any widget to resize it. Widgets can span 1-4 columns and 1-3 rows. Charts and tables benefit from larger sizes while KPI cards work well at their default single-column size.',
          screenshotKey: 'dashboard/customize-step-5',
        },
        {
          number: 6,
          title: 'Save your layout',
          description:
            'Click "Save Layout" to persist your customizations. Your layout is stored per-user and will be restored on your next login. Click "Reset to Default" to revert to the standard layout.',
          screenshotKey: 'dashboard/customize-step-6',
        },
      ],
    },
    {
      id: 'read-ai-insights',
      title: 'Reading and Acting on AI Insights',
      description:
        'Understand how Tempo\'s AI engine generates workforce insights and how to take action on recommendations.',
      estimatedTime: '4 minutes',
      roles: ['owner', 'admin', 'hrbp', 'manager'],
      steps: [
        {
          number: 1,
          title: 'Locate the AI Insights panel',
          description:
            'The AI Insights panel appears on the right side of the dashboard. It displays a scrollable list of insight cards, each with a title, description, severity badge, and action button.',
          screenshotKey: 'dashboard/ai-insights-step-1',
        },
        {
          number: 2,
          title: 'Understand severity levels',
          description:
            'Each insight is tagged with a severity: "Info" (blue) for general observations, "Warning" (amber) for trends that need attention, and "Critical" (red) for urgent issues requiring immediate action. Critical insights also trigger in-app notifications.',
          screenshotKey: 'dashboard/ai-insights-step-2',
          tip: 'Critical insights are also sent as email notifications if you have email alerts enabled in Settings.',
        },
        {
          number: 3,
          title: 'Expand an insight for details',
          description:
            'Click on any insight card to expand it. The expanded view shows the underlying data points, the time period analyzed, the confidence score, and a detailed explanation of why this pattern was detected.',
          screenshotKey: 'dashboard/ai-insights-step-3',
        },
        {
          number: 4,
          title: 'Take action on an insight',
          description:
            'Click the "Take Action" button on an expanded insight. Depending on the insight type, this may navigate you to the relevant module (e.g., compensation review for a pay equity alert), open a pre-filled form, or create a task in your pending actions list.',
          screenshotKey: 'dashboard/ai-insights-step-4',
        },
        {
          number: 5,
          title: 'Dismiss or snooze insights',
          description:
            'Click the three-dot menu on any insight to dismiss it permanently or snooze it for 7/14/30 days. Dismissed insights are logged in the audit trail and will not reappear unless the underlying condition changes significantly.',
          screenshotKey: 'dashboard/ai-insights-step-5',
        },
      ],
    },
    {
      id: 'view-team-metrics',
      title: 'Viewing Team Metrics',
      description:
        'Managers can view aggregated performance, attendance, and engagement metrics for their direct reports and extended team.',
      estimatedTime: '3 minutes',
      roles: ['manager', 'hrbp', 'admin', 'owner'],
      steps: [
        {
          number: 1,
          title: 'Switch to team view',
          description:
            'Click the "My Team" tab at the top of the dashboard. The view switches from the organization-wide perspective to show only metrics for your direct reports and their teams.',
          screenshotKey: 'dashboard/team-metrics-step-1',
        },
        {
          number: 2,
          title: 'Review team health indicators',
          description:
            'The team view displays a health scorecard with four dimensions: Performance (average review score), Engagement (last pulse survey score), Attendance (absence rate), and Growth (training completion rate). Each dimension is color-coded green, yellow, or red.',
          screenshotKey: 'dashboard/team-metrics-step-2',
        },
        {
          number: 3,
          title: 'View individual team members',
          description:
            'Below the health scorecard, a table lists each direct report with their key metrics, upcoming milestones (work anniversaries, probation end dates), and pending actions you need to complete for them.',
          screenshotKey: 'dashboard/team-metrics-step-3',
          tip: 'Click any team member\'s name to navigate to their full profile in the People module.',
        },
        {
          number: 4,
          title: 'Drill into extended team',
          description:
            'If you manage managers, click "Show Extended Team" to see metrics for all employees in your reporting chain, not just direct reports. The hierarchy is displayed as an expandable tree.',
          screenshotKey: 'dashboard/team-metrics-step-4',
        },
      ],
    },
  ],

  faqs: [
    {
      question: 'How often is the dashboard data refreshed?',
      answer:
        'Dashboard KPIs and charts are refreshed automatically every 5 minutes while the page is open. AI insights are recalculated daily at midnight UTC. You can force a manual refresh by clicking the refresh icon in the top-right corner.',
    },
    {
      question: 'Why do I see different KPIs than my colleague?',
      answer:
        'The dashboard respects role-based access control. Employees see only their own metrics and team-level summaries. Managers see their direct reports. HRBPs see their assigned departments. Admins and Owners see organization-wide data. The KPI cards displayed also vary by role.',
    },
    {
      question: 'Can I export the dashboard as a report?',
      answer:
        'Yes. Click the "Export" button in the top-right corner and select either PDF or CSV format. PDF exports include all visible charts and KPIs in a board-ready layout. CSV exports include the raw data underlying each widget.',
    },
    {
      question: 'What data powers the AI insights?',
      answer:
        'AI insights analyze patterns across all connected modules including headcount changes, attrition trends, compensation data, engagement survey results, and attendance records. The engine uses statistical anomaly detection and trend forecasting. No employee data leaves your Tempo environment.',
    },
    {
      question: 'How do I reset my dashboard to the default layout?',
      answer:
        'Click "Customize" in the top-right corner, then click "Reset to Default" at the bottom of the edit panel. This removes all custom widget arrangements and restores the standard layout for your role.',
    },
    {
      question: 'Can I share my dashboard layout with other users?',
      answer:
        'Not directly. Dashboard layouts are personal to each user. However, Admins can configure a default layout template in Settings > Dashboard that serves as the starting point for all users of a given role.',
    },
    {
      question: 'Why is the attrition rate card showing a different number than the Analytics module?',
      answer:
        'The dashboard KPI card shows the trailing 30-day voluntary attrition rate by default. The Analytics module may be configured to show a different time period (quarterly, annual) or include involuntary separations. Check the time period selector in the Analytics module to align the views.',
    },
    {
      question: 'Can I create a custom KPI card?',
      answer:
        'Yes. In the widget library (accessible via Customize > Add Widget), scroll to the "Custom KPI" section. You can define a custom metric by selecting a data source, aggregation method (sum, average, count), and optional filters such as department or location.',
    },
  ],

  tips: [
    'Start your day on the dashboard to quickly triage pending actions before diving into individual modules.',
    'Use the date range selector at the top of the dashboard to compare current metrics against the same period last year.',
    'Pin your most important AI insights so they remain visible even after new insights are generated.',
    'Set up email digests in Settings > Notifications to receive a daily dashboard summary without needing to log in.',
    'Use keyboard shortcut Cmd+D (or Ctrl+D on Windows) from anywhere in Tempo to jump back to the dashboard.',
    'If you manage a large team, use the department filter to focus the dashboard on a specific business unit.',
  ],

  relatedModules: ['people', 'analytics', 'performance', 'payroll'],

  permissions: [
    {
      role: 'Owner',
      capabilities: [
        'View all organization-wide KPIs and metrics',
        'Access AI insights for all departments',
        'Customize dashboard layout and create custom KPI cards',
        'Export dashboard reports in PDF and CSV formats',
        'Configure default dashboard templates for other roles',
        'View and act on all pending actions across the organization',
      ],
    },
    {
      role: 'Admin',
      capabilities: [
        'View all organization-wide KPIs and metrics',
        'Access AI insights for all departments',
        'Customize dashboard layout and create custom KPI cards',
        'Export dashboard reports in PDF and CSV formats',
        'Configure default dashboard templates for other roles',
      ],
    },
    {
      role: 'HRBP',
      capabilities: [
        'View KPIs scoped to assigned departments and regions',
        'Access AI insights for assigned departments',
        'Customize personal dashboard layout',
        'Export dashboard reports for assigned scope',
        'View pending actions for assigned employees',
      ],
    },
    {
      role: 'Manager',
      capabilities: [
        'View KPIs for direct reports and extended team',
        'Access the "My Team" tab with team health indicators',
        'Customize personal dashboard layout',
        'View and act on pending actions for direct reports',
        'Export team-level dashboard reports',
      ],
    },
    {
      role: 'Employee',
      capabilities: [
        'View personal KPIs (leave balance, upcoming reviews, payslip status)',
        'Access limited AI insights relevant to personal career development',
        'View personal pending actions (training deadlines, form submissions)',
      ],
    },
  ],
}

export default dashboard
