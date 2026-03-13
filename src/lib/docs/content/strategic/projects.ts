import type { ModuleDoc } from '../../types'

const projects: ModuleDoc = {
  slug: 'projects',
  title: 'Projects',
  subtitle: 'Project management, milestones, tasks, and resource allocation',
  icon: 'FolderKanban',
  group: 'strategic',
  lastUpdated: '2026-03-13',
  version: '1.0',

  overview: {
    description:
      'The Projects module provides a unified workspace for planning, tracking, and delivering strategic initiatives across your organization. Teams can break work into milestones and tasks, allocate resources by availability and skill set, and track progress against deadlines in real time. Integrated Gantt charts, Kanban boards, and timeline views give stakeholders visibility into project health at every level. With native connections to the People and Analytics modules, resource utilization and project costs are always up to date.',
    keyFeatures: [
      'Kanban, list, Gantt, and timeline views for every project',
      'Milestone tracking with dependency mapping and critical-path highlighting',
      'Task management with assignees, due dates, priorities, labels, and subtasks',
      'Resource allocation planner with capacity heatmaps per employee',
      'Budgeting and cost tracking linked to actual time entries',
      'Cross-project dashboards for portfolio-level oversight',
      'Automated status reports generated weekly via AI summary',
      'File attachments and threaded comments on tasks',
      'Integration with Chat module for real-time project discussions',
    ],
    screenshotKey: 'projects/overview',
  },

  workflows: [
    {
      id: 'create-project',
      title: 'Creating a New Project',
      description:
        'Set up a new project with milestones, team assignments, and a timeline. This workflow covers everything from naming the project to publishing it to stakeholders.',
      estimatedTime: '10 minutes',
      roles: ['owner', 'admin', 'manager'],
      prerequisites: [
        'At least one department or team must exist in the People module',
        'Project template (optional) should be created in advance for recurring project types',
      ],
      steps: [
        {
          number: 1,
          title: 'Open the Projects module',
          description:
            'Click "Projects" in the left sidebar under the Strategic section. You will land on the project portfolio view showing all active projects.',
          screenshotKey: 'projects/create-step-1',
        },
        {
          number: 2,
          title: 'Click "New Project"',
          description:
            'Click the "New Project" button in the top-right corner. Choose to start from scratch or select a project template. Enter the project name, description, and target completion date.',
          screenshotKey: 'projects/create-step-2',
          tip: 'Use templates for recurring project types like product launches or quarterly planning to save setup time.',
        },
        {
          number: 3,
          title: 'Define milestones',
          description:
            'Add milestones to break the project into major phases. For each milestone, set a title, target date, and optional description. Milestones appear as diamonds on the Gantt chart and serve as checkpoints for progress reporting.',
          screenshotKey: 'projects/create-step-3',
        },
        {
          number: 4,
          title: 'Assign team members',
          description:
            'Add team members from the employee directory. Set each member\'s role on the project (lead, contributor, reviewer) and their expected time allocation as a percentage. The resource planner will flag conflicts if an employee is over-allocated.',
          screenshotKey: 'projects/create-step-4',
        },
        {
          number: 5,
          title: 'Set the project budget',
          description:
            'Optionally configure a project budget by entering the total approved amount and currency. Link budget line items to milestones for granular cost tracking. Actual costs are calculated automatically from logged time entries.',
          screenshotKey: 'projects/create-step-5',
        },
        {
          number: 6,
          title: 'Publish the project',
          description:
            'Review the project setup summary and click "Publish". Team members receive notifications and the project appears in the portfolio view. You can keep a project in Draft status if setup is still in progress.',
          screenshotKey: 'projects/create-step-6',
        },
      ],
    },
    {
      id: 'manage-tasks',
      title: 'Managing Tasks and Subtasks',
      description:
        'Create, assign, and track tasks within a project. Learn how to use the Kanban board and list views to manage daily work.',
      estimatedTime: '5 minutes',
      roles: ['owner', 'admin', 'manager', 'employee'],
      steps: [
        {
          number: 1,
          title: 'Navigate to a project',
          description:
            'Click on a project card in the portfolio view to open its workspace. The default view shows the Kanban board with columns for Backlog, In Progress, In Review, and Done.',
          screenshotKey: 'projects/tasks-step-1',
        },
        {
          number: 2,
          title: 'Create a new task',
          description:
            'Click the "+" button at the top of any Kanban column, or use the "Add Task" button in list view. Enter the task title, description, assignee, due date, priority (Low, Medium, High, Urgent), and optionally link it to a milestone.',
          screenshotKey: 'projects/tasks-step-2',
        },
        {
          number: 3,
          title: 'Add subtasks',
          description:
            'Open a task and click "Add Subtask" to break it into smaller work items. Each subtask has its own assignee and due date. The parent task shows a progress bar based on subtask completion.',
          screenshotKey: 'projects/tasks-step-3',
          tip: 'Convert a task comment into a subtask by clicking the three-dot menu on the comment and selecting "Convert to Subtask".',
        },
        {
          number: 4,
          title: 'Update task status',
          description:
            'Drag tasks between Kanban columns to update their status, or change the status dropdown in the task detail panel. Status changes are logged in the task activity feed and trigger notifications to watchers.',
          screenshotKey: 'projects/tasks-step-4',
        },
        {
          number: 5,
          title: 'Log time against a task',
          description:
            'Open a task and click "Log Time" to record hours worked. Time entries feed into the project\'s budget tracking and the employee\'s utilization dashboard. You can also start a timer for real-time tracking.',
          screenshotKey: 'projects/tasks-step-5',
        },
      ],
    },
    {
      id: 'resource-allocation',
      title: 'Allocating and Balancing Resources',
      description:
        'Use the resource planner to ensure team members are not over-allocated and projects have adequate staffing.',
      estimatedTime: '7 minutes',
      roles: ['owner', 'admin', 'manager'],
      prerequisites: [
        'At least one active project with assigned team members',
        'Employee work schedules configured in the People module',
      ],
      steps: [
        {
          number: 1,
          title: 'Open the Resource Planner',
          description:
            'In the Projects module, click the "Resources" tab in the top navigation bar. The planner displays a heatmap grid with employees on the vertical axis and weeks on the horizontal axis.',
          screenshotKey: 'projects/resources-step-1',
        },
        {
          number: 2,
          title: 'Identify over-allocations',
          description:
            'Cells shaded in red indicate weeks where an employee is allocated above 100% capacity. Hover over a red cell to see a breakdown of all project commitments for that week.',
          screenshotKey: 'projects/resources-step-2',
        },
        {
          number: 3,
          title: 'Adjust allocations',
          description:
            'Click an employee\'s row to expand their project assignments. Drag the allocation slider for any project to increase or decrease their commitment. Changes are reflected immediately in the heatmap.',
          screenshotKey: 'projects/resources-step-3',
          tip: 'Use the "Suggest Balance" button to let Tempo AI recommend allocation adjustments that resolve conflicts while minimizing project timeline impact.',
        },
        {
          number: 4,
          title: 'Filter by team or department',
          description:
            'Use the filters at the top of the planner to narrow the view to a specific department, team, or project. This is useful for managers reviewing their own team\'s workload.',
          screenshotKey: 'projects/resources-step-4',
        },
      ],
    },
    {
      id: 'gantt-chart',
      title: 'Using the Gantt Chart View',
      description:
        'Visualize project timelines, dependencies, and the critical path using the interactive Gantt chart.',
      estimatedTime: '5 minutes',
      roles: ['owner', 'admin', 'manager', 'employee'],
      steps: [
        {
          number: 1,
          title: 'Switch to Gantt view',
          description:
            'Inside a project workspace, click the "Gantt" tab in the view switcher. Tasks and milestones are rendered as horizontal bars on a timeline, with dependencies shown as connecting arrows.',
          screenshotKey: 'projects/gantt-step-1',
        },
        {
          number: 2,
          title: 'Create dependencies',
          description:
            'Hover over the end of a task bar until the connector handle appears. Drag from the handle to another task to create a finish-to-start dependency. Tempo supports finish-to-start, start-to-start, finish-to-finish, and start-to-finish dependency types.',
          screenshotKey: 'projects/gantt-step-2',
        },
        {
          number: 3,
          title: 'View the critical path',
          description:
            'Toggle "Show Critical Path" in the toolbar to highlight the longest chain of dependent tasks that determines the earliest possible project completion date. Critical-path tasks are highlighted in orange.',
          screenshotKey: 'projects/gantt-step-3',
        },
        {
          number: 4,
          title: 'Adjust timelines by dragging',
          description:
            'Drag the left or right edge of a task bar to change its start or end date. Drag the entire bar to shift the task on the timeline. Dependent tasks automatically shift if the dependency would be violated.',
          screenshotKey: 'projects/gantt-step-4',
          tip: 'Hold Shift while dragging to move a task and all its downstream dependents together.',
        },
        {
          number: 5,
          title: 'Zoom and navigate the timeline',
          description:
            'Use the zoom controls to switch between day, week, month, and quarter views. Click "Today" to center the chart on the current date. Scroll horizontally to move through the timeline.',
          screenshotKey: 'projects/gantt-step-5',
        },
      ],
    },
  ],

  faqs: [
    {
      question: 'How many projects can I create?',
      answer:
        'There is no hard limit on the number of projects. Your plan determines the maximum number of active projects that appear in dashboards and reports. Archived projects do not count toward this limit.',
    },
    {
      question: 'Can I create project templates?',
      answer:
        'Yes. Open any existing project, click the three-dot menu, and select "Save as Template". Templates capture milestones, task structures, default roles, and budget categories but not specific assignees or dates. Templates are available organization-wide and can be managed in Settings > Projects > Templates.',
    },
    {
      question: 'How are project costs calculated?',
      answer:
        'Project costs are calculated from time entries logged against tasks, multiplied by each employee\'s loaded cost rate (base salary plus benefits overhead). You can also add non-labor costs manually as budget line items. Actual vs. budgeted cost comparisons are available on the project dashboard.',
    },
    {
      question: 'Can external contractors or guests collaborate on projects?',
      answer:
        'Yes. Add external collaborators by inviting them via email from the project settings. Guest users can view tasks, add comments, and log time but cannot access other Tempo modules or view sensitive employee data. Guest access can be time-limited.',
    },
    {
      question: 'How do I archive a completed project?',
      answer:
        'Open the project, click the three-dot menu, and select "Archive". Archived projects are moved out of the active portfolio view but remain fully accessible for reporting and audit purposes. You can unarchive a project at any time.',
    },
    {
      question: 'Does the Gantt chart support multiple dependency types?',
      answer:
        'Yes. Tempo supports four dependency types: Finish-to-Start (FS), Start-to-Start (SS), Finish-to-Finish (FF), and Start-to-Finish (SF). You can also add lead or lag time to any dependency to account for buffer periods.',
    },
    {
      question: 'Can I track progress at the portfolio level?',
      answer:
        'Yes. The portfolio dashboard shows a summary of all active projects with progress percentages, budget utilization, risk indicators, and upcoming milestones. Use the portfolio view to compare projects and identify those that need attention.',
    },
    {
      question: 'How do notifications work for task assignments?',
      answer:
        'When you assign a task to an employee, they receive an in-app notification and an email (if email notifications are enabled). They are also notified when a task they are watching has a status change, new comment, or approaching due date.',
    },
  ],

  tips: [
    'Use the "My Tasks" view to see all tasks assigned to you across every project in one consolidated list.',
    'Set up project-level automation rules to auto-assign reviewers when a task moves to the "In Review" column.',
    'Enable the weekly AI status report to receive an auto-generated summary of project progress every Monday morning.',
    'Use labels and colors to categorize tasks by workstream, making it easy to filter and prioritize.',
    'Pin frequently accessed projects to the top of the sidebar for quick navigation.',
    'When planning a large project, start with milestones first and then decompose each milestone into tasks in a second pass.',
    'Link related tasks across different projects using the "Related Tasks" feature to maintain cross-project visibility.',
  ],

  relatedModules: ['analytics', 'headcount', 'workflows', 'documents', 'strategy'],

  permissions: [
    {
      role: 'Owner',
      capabilities: [
        'Create, edit, archive, and delete any project',
        'Manage resource allocations across all projects',
        'View and modify project budgets and cost data',
        'Configure project templates and global project settings',
        'Export project data and generate portfolio reports',
      ],
    },
    {
      role: 'Admin',
      capabilities: [
        'Create, edit, and archive projects',
        'Manage resource allocations and team assignments',
        'View and modify project budgets',
        'Create and manage project templates',
        'Export project data',
      ],
    },
    {
      role: 'Manager',
      capabilities: [
        'Create projects and manage tasks within own team',
        'Assign and reallocate resources for own direct reports',
        'View budget summaries for projects they lead',
        'Generate status reports for assigned projects',
      ],
    },
    {
      role: 'Employee',
      capabilities: [
        'View projects they are assigned to',
        'Create, update, and complete tasks assigned to them',
        'Log time entries against tasks',
        'Add comments and attachments to tasks',
      ],
    },
  ],
}

export default projects
