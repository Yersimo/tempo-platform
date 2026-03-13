import type { ModuleDoc } from '../../types'

const onboarding: ModuleDoc = {
  slug: 'onboarding',
  title: 'Onboarding',
  subtitle: 'Streamline new hire integration with checklists, pre-boarding tasks, buddy assignments, and progress tracking',
  icon: 'UserPlus',
  group: 'additional',
  lastUpdated: '2026-03-13',
  version: '1.0',

  overview: {
    description:
      'The Onboarding module orchestrates the entire new hire journey from offer acceptance to full productivity. HR teams can design multi-phase onboarding programs with checklists, automated task assignments, buddy pairing, and milestone tracking. Pre-boarding tasks ensure new hires complete paperwork, equipment requests, and account setup before their first day. Managers and buddies receive their own task lists so every stakeholder knows their responsibilities. A real-time progress dashboard gives HR full visibility into onboarding status across all active new hires.',
    keyFeatures: [
      'Customizable onboarding templates with phase-based checklists',
      'Pre-boarding portal for new hires to complete tasks before day one',
      'Automated task assignment to managers, IT, facilities, and buddies',
      'Buddy matching with preference-based or random assignment algorithms',
      'Progress tracking dashboard with completion rates and bottleneck alerts',
      'Milestone notifications for 30/60/90-day check-ins',
      'Document collection with e-signature integration',
      'Onboarding survey automation for experience feedback',
    ],
    screenshotKey: 'onboarding/overview',
  },

  workflows: [
    {
      id: 'create-template',
      title: 'Creating an Onboarding Template',
      description:
        'Design a reusable onboarding program with phases, tasks, and automated assignments that can be applied to new hires by department, role, or location.',
      estimatedTime: '15 minutes',
      roles: ['owner', 'admin', 'hrbp'],
      steps: [
        {
          number: 1,
          title: 'Navigate to Onboarding Templates',
          description:
            'Go to Onboarding > Templates. Existing templates are listed with their name, target audience, number of tasks, and average completion time. Click "+ New Template" to start.',
          screenshotKey: 'onboarding/template-step-1',
        },
        {
          number: 2,
          title: 'Define template settings',
          description:
            'Enter the template name (e.g., "Engineering New Hire" or "Executive Onboarding"), description, and target criteria. Target criteria determine when this template is automatically applied: by department, job level, location, or any combination.',
          screenshotKey: 'onboarding/template-step-2',
        },
        {
          number: 3,
          title: 'Create onboarding phases',
          description:
            'Add phases to structure the onboarding journey. Common phases include Pre-boarding (before day 1), Week 1, Month 1, and Month 2-3. Each phase has a name, duration, and start trigger (relative to start date or completion of the previous phase).',
          screenshotKey: 'onboarding/template-step-3',
          tip: 'Keep pre-boarding tasks light and focused: document signing, equipment preferences, and emergency contacts work best.',
        },
        {
          number: 4,
          title: 'Add tasks to each phase',
          description:
            'Within each phase, add specific tasks. For each task, set the title, description, assignee (new hire, manager, buddy, IT, HR, or facilities), due date offset, and priority. Tasks can be marked as required or optional.',
          screenshotKey: 'onboarding/template-step-4',
        },
        {
          number: 5,
          title: 'Configure automations',
          description:
            'Set up automated actions: send welcome emails, create IT provisioning tickets, schedule calendar events for orientation sessions, and trigger document sending via the Documents module. Automations fire when the phase begins.',
          screenshotKey: 'onboarding/template-step-5',
        },
        {
          number: 6,
          title: 'Save and publish the template',
          description:
            'Click "Save as Draft" to continue editing later, or "Publish" to make the template active. Published templates are automatically applied to new hires who match the target criteria when their employee record is created.',
          screenshotKey: 'onboarding/template-step-6',
        },
      ],
    },
    {
      id: 'assign-buddy',
      title: 'Assigning an Onboarding Buddy',
      description:
        'Pair new hires with experienced employees who guide them through their first weeks, answer questions, and help them build internal relationships.',
      estimatedTime: '3 minutes',
      roles: ['owner', 'admin', 'hrbp', 'manager'],
      steps: [
        {
          number: 1,
          title: 'Open the new hire\'s onboarding plan',
          description:
            'Navigate to Onboarding > Active and click on the new hire\'s name. Their onboarding plan opens showing all phases, tasks, and current progress.',
          screenshotKey: 'onboarding/buddy-step-1',
        },
        {
          number: 2,
          title: 'Navigate to the Buddy tab',
          description:
            'Click the "Buddy" tab on the onboarding plan. If auto-assignment is enabled, a suggested buddy may already be displayed based on department, location, and availability.',
          screenshotKey: 'onboarding/buddy-step-2',
        },
        {
          number: 3,
          title: 'Select a buddy',
          description:
            'Search for an employee by name or use the "Suggest Buddy" button to get AI-powered recommendations based on shared department, location, tenure, and past buddy performance ratings. Click "Assign" next to the chosen buddy.',
          screenshotKey: 'onboarding/buddy-step-3',
          tip: 'Choose buddies who have been with the company at least 6 months and are not currently onboarding another new hire.',
        },
        {
          number: 4,
          title: 'Notify and activate',
          description:
            'The assigned buddy receives an email and in-app notification with the new hire\'s profile, start date, and a buddy checklist. Buddy-specific tasks (e.g., "Schedule intro coffee", "Give office tour") appear in the buddy\'s task list.',
          screenshotKey: 'onboarding/buddy-step-4',
        },
      ],
    },
    {
      id: 'track-progress',
      title: 'Tracking Onboarding Progress',
      description:
        'Monitor the completion status of all active onboarding plans, identify bottlenecks, and ensure no tasks fall through the cracks.',
      estimatedTime: '5 minutes',
      roles: ['owner', 'admin', 'hrbp', 'manager'],
      steps: [
        {
          number: 1,
          title: 'Open the onboarding dashboard',
          description:
            'Navigate to Onboarding > Dashboard. The overview shows aggregate metrics: total active onboardings, average completion rate, overdue tasks count, and average time to full productivity.',
          screenshotKey: 'onboarding/track-step-1',
        },
        {
          number: 2,
          title: 'Filter by department or start date',
          description:
            'Use the department dropdown and date range filters to focus on specific cohorts. The dashboard updates to show metrics for the selected group.',
          screenshotKey: 'onboarding/track-step-2',
        },
        {
          number: 3,
          title: 'Review individual progress',
          description:
            'The new hire table shows each active onboarding with a progress bar, current phase, overdue task count, and days since start. Click any row to view the detailed task breakdown.',
          screenshotKey: 'onboarding/track-step-3',
          tip: 'Sort by "Overdue Tasks" to quickly identify new hires who may need additional support.',
        },
        {
          number: 4,
          title: 'Identify and resolve bottlenecks',
          description:
            'The "Bottleneck Analysis" panel highlights task categories with the lowest completion rates (e.g., IT provisioning, document signing). Click a bottleneck to see the specific tasks and their assignees, then follow up directly.',
          screenshotKey: 'onboarding/track-step-4',
        },
        {
          number: 5,
          title: 'Send reminders',
          description:
            'Select one or more overdue tasks and click "Send Reminder". The assignee receives an email and in-app notification with the task details and deadline. You can also set up automatic reminders at 1, 3, and 7 days past due.',
          screenshotKey: 'onboarding/track-step-5',
        },
      ],
    },
    {
      id: 'preboarding',
      title: 'Managing Pre-boarding Tasks',
      description:
        'Enable new hires to complete essential paperwork and setup tasks before their first day through the pre-boarding portal.',
      estimatedTime: '5 minutes',
      roles: ['owner', 'admin', 'hrbp'],
      steps: [
        {
          number: 1,
          title: 'Configure the pre-boarding portal',
          description:
            'Navigate to Onboarding > Settings > Pre-boarding. Customize the welcome message, company branding, and the set of tasks that appear in the new hire\'s pre-boarding portal.',
          screenshotKey: 'onboarding/preboard-step-1',
        },
        {
          number: 2,
          title: 'Define pre-boarding tasks',
          description:
            'Add tasks that new hires should complete before day one: upload a photo, fill in emergency contacts, sign offer letter and NDA, select equipment preferences, review the employee handbook, and complete tax forms.',
          screenshotKey: 'onboarding/preboard-step-2',
          tip: 'Keep pre-boarding to 5-8 tasks maximum. Too many tasks before day one can overwhelm new hires.',
        },
        {
          number: 3,
          title: 'Send the pre-boarding invitation',
          description:
            'When a new hire\'s start date is set, click "Send Pre-boarding Invite" or configure automatic sending X days before the start date. The new hire receives an email with a secure link to the portal.',
          screenshotKey: 'onboarding/preboard-step-3',
        },
        {
          number: 4,
          title: 'Monitor pre-boarding completion',
          description:
            'The pre-boarding dashboard shows each upcoming new hire with their task completion status. Green indicates all tasks complete, yellow means in progress, and red means no tasks started with the start date approaching.',
          screenshotKey: 'onboarding/preboard-step-4',
        },
        {
          number: 5,
          title: 'Follow up on incomplete tasks',
          description:
            'For new hires with incomplete pre-boarding, click "Send Reminder" to nudge them via email. If tasks remain incomplete on day one, they automatically carry over to the Week 1 phase of the onboarding plan.',
          screenshotKey: 'onboarding/preboard-step-5',
        },
      ],
    },
  ],

  faqs: [
    {
      question: 'Can I create different onboarding programs for different departments?',
      answer:
        'Yes. Create multiple onboarding templates with different target criteria. For example, one template for Engineering with IT-heavy tasks, another for Sales with CRM training, and a generic template for all other departments. Templates are automatically applied based on the new hire\'s department, role, and location.',
    },
    {
      question: 'What happens if a new hire\'s start date changes?',
      answer:
        'All task due dates automatically recalculate based on the new start date. Pre-boarding deadlines shift accordingly. If the start date moves earlier and some tasks are now past due, they are flagged for immediate attention.',
    },
    {
      question: 'Can the new hire see their onboarding progress?',
      answer:
        'Yes. New hires see a simplified view of their onboarding plan with their assigned tasks, due dates, and a progress bar. They cannot see tasks assigned to others (manager, IT, etc.) but can see that those tasks exist and their completion status.',
    },
    {
      question: 'How does buddy matching work?',
      answer:
        'The AI matching algorithm considers department proximity, physical location, tenure (buddies should have 6+ months), current buddy load (max 2 active assignments), and optional preference tags. Managers can override the suggestion and assign any eligible employee.',
    },
    {
      question: 'Can I add tasks to an in-progress onboarding plan?',
      answer:
        'Yes. Open the new hire\'s plan and click "+ Add Task" in any phase. The task is added with a due date relative to the current date. This is useful for addressing unique needs that were not covered by the template.',
    },
    {
      question: 'Is there reporting on onboarding effectiveness?',
      answer:
        'Yes. The Analytics tab in Onboarding shows metrics like average time to completion, task completion rates by category, buddy satisfaction scores (from surveys), and new hire experience ratings. Compare cohorts by department, quarter, or template version.',
    },
  ],

  tips: [
    'Send the pre-boarding invitation at least two weeks before the start date to give new hires time to complete paperwork at their own pace.',
    'Include a "Meet the Team" section in the pre-boarding portal with photos and short bios of future colleagues to reduce first-day anxiety.',
    'Schedule 30/60/90-day check-in meetings as automated calendar events in the onboarding template so they are never forgotten.',
    'Collect onboarding feedback via automated surveys at the end of each phase to continuously improve the program.',
    'Use the bottleneck analysis dashboard weekly to identify systemic delays, such as slow IT provisioning, and address root causes.',
    'Create a separate "Executive Onboarding" template with additional tasks like board introductions and strategic briefings.',
  ],

  relatedModules: ['people', 'documents', 'groups', 'workflow-studio'],

  permissions: [
    {
      role: 'Owner',
      capabilities: [
        'Create, edit, and delete onboarding templates',
        'View and manage all active onboarding plans',
        'Assign buddies and override automated assignments',
        'Configure pre-boarding portal settings',
        'Access onboarding analytics and reports',
      ],
    },
    {
      role: 'Admin',
      capabilities: [
        'Create, edit, and delete onboarding templates',
        'View and manage all active onboarding plans',
        'Assign buddies and override automated assignments',
        'Configure pre-boarding portal settings',
      ],
    },
    {
      role: 'HRBP',
      capabilities: [
        'Create and edit onboarding templates for assigned departments',
        'View and manage onboarding plans for assigned new hires',
        'Assign buddies within assigned departments',
        'Send reminders and follow up on overdue tasks',
      ],
    },
    {
      role: 'Manager',
      capabilities: [
        'View onboarding plans for their direct reports',
        'Complete manager-assigned tasks (welcome meeting, goal setting)',
        'Suggest or approve buddy assignments for their new hires',
      ],
    },
    {
      role: 'Employee',
      capabilities: [
        'Complete tasks assigned to them in the onboarding plan',
        'Access the pre-boarding portal and submit required information',
        'View their own onboarding progress and upcoming tasks',
      ],
    },
  ],
}

export default onboarding
