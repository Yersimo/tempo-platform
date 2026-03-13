import type { ModuleDoc } from '../../types'

const automation: ModuleDoc = {
  slug: 'workflows',
  title: 'Workflow Automation',
  subtitle: 'Workflow automation, triggers, conditions, and multi-step approvals',
  icon: 'Zap',
  group: 'strategic',
  lastUpdated: '2026-03-13',
  version: '1.0',

  overview: {
    description:
      'The Workflow Automation module lets you eliminate repetitive manual processes by creating automated workflows triggered by events across Tempo. Define triggers (e.g., new employee added, leave request submitted), set conditions to filter which events qualify, and chain together actions such as sending notifications, creating tasks, updating records, or routing items through multi-step approval chains. Pre-built workflow templates cover the most common HR scenarios, and a simple rule-based editor makes it accessible to non-technical users.',
    keyFeatures: [
      'Event-driven triggers from any Tempo module (People, Leave, Payroll, Recruiting, etc.)',
      'Conditional logic with AND/OR operators, field comparisons, and date-based rules',
      'Multi-step approval chains with parallel and sequential routing options',
      'Action library including notifications, field updates, task creation, and webhook calls',
      'Pre-built templates for common workflows (onboarding, offboarding, promotion, leave escalation)',
      'Workflow execution history with detailed logs for debugging and auditing',
      'Scheduled workflows that run on a cron-based schedule',
      'Dry-run mode to test workflows before activating them',
    ],
    screenshotKey: 'workflows/overview',
  },

  workflows: [
    {
      id: 'create-approval-workflow',
      title: 'Creating a Multi-Step Approval Workflow',
      description:
        'Build an approval chain that routes requests through multiple approvers in sequence or parallel, with escalation rules for timeouts.',
      estimatedTime: '12 minutes',
      roles: ['owner', 'admin'],
      prerequisites: [
        'Approver roles must be assigned in the People module',
        'The entity being approved (e.g., leave request, expense claim) must exist as a trigger source',
      ],
      steps: [
        {
          number: 1,
          title: 'Navigate to Workflow Automation',
          description:
            'Click "Workflows" in the left sidebar under the Strategic section. The module opens to a list of all existing workflows with their status (Active, Inactive, Draft).',
          screenshotKey: 'workflows/approval-step-1',
        },
        {
          number: 2,
          title: 'Create a new workflow',
          description:
            'Click "New Workflow" and enter a name (e.g., "Leave Approval - 5+ Days") and description. Select "Event-Triggered" as the workflow type.',
          screenshotKey: 'workflows/approval-step-2',
        },
        {
          number: 3,
          title: 'Select the trigger',
          description:
            'Choose the triggering event from the dropdown. For this example, select "Leave Request Submitted" from the Leave module. The trigger configuration shows all available fields from the leave request record.',
          screenshotKey: 'workflows/approval-step-3',
        },
        {
          number: 4,
          title: 'Add conditions',
          description:
            'Click "Add Condition" to filter which events should activate the workflow. Set "Duration Days >= 5" to only trigger for leave requests of five or more days. You can add multiple conditions connected by AND/OR operators.',
          screenshotKey: 'workflows/approval-step-4',
          tip: 'Use the "Preview Matching Records" button to see how many existing records would match your condition set. This validates that your logic is correct.',
        },
        {
          number: 5,
          title: 'Build the approval chain',
          description:
            'Add an "Approval Step" action. Set the first approver as "Direct Manager" (dynamic, based on the requester\'s reporting line). Add a second step with "Department Head" as the approver. Configure timeout rules: if no response within 48 hours, auto-escalate to the next level.',
          screenshotKey: 'workflows/approval-step-5',
        },
        {
          number: 6,
          title: 'Activate the workflow',
          description:
            'Review the workflow summary. Click "Dry Run" to simulate execution against a sample record. If the simulation succeeds, click "Activate" to make the workflow live. New leave requests matching the conditions will now route through the approval chain.',
          screenshotKey: 'workflows/approval-step-6',
        },
      ],
    },
    {
      id: 'build-notification-workflow',
      title: 'Building an Automated Notification Workflow',
      description:
        'Create a workflow that sends targeted notifications when specific events occur, such as alerting finance when a new hire starts.',
      estimatedTime: '7 minutes',
      roles: ['owner', 'admin'],
      steps: [
        {
          number: 1,
          title: 'Create a new workflow',
          description:
            'In the Workflow Automation module, click "New Workflow". Name it (e.g., "New Hire Finance Alert") and select "Event-Triggered" as the type.',
          screenshotKey: 'workflows/notification-step-1',
        },
        {
          number: 2,
          title: 'Configure the trigger',
          description:
            'Select "Employee Created" from the People module triggers. This fires whenever a new employee record is created in the system.',
          screenshotKey: 'workflows/notification-step-2',
        },
        {
          number: 3,
          title: 'Add a notification action',
          description:
            'Click "Add Action" and select "Send Notification". Choose the delivery channels (in-app, email, Slack). Select the recipients: you can choose specific employees, roles (e.g., all users with the Finance role), or dynamic recipients (e.g., the new hire\'s department head).',
          screenshotKey: 'workflows/notification-step-3',
        },
        {
          number: 4,
          title: 'Compose the notification template',
          description:
            'Write the notification message using merge fields (e.g., {{employee.full_name}}, {{employee.department}}, {{employee.start_date}}). Preview the rendered message with sample data to verify formatting.',
          screenshotKey: 'workflows/notification-step-4',
          tip: 'Use the "Delay" action before the notification to schedule it for a specific time, such as 24 hours before the new hire\'s start date.',
        },
        {
          number: 5,
          title: 'Test and activate',
          description:
            'Run a dry test with a sample employee record. Verify the notification renders correctly and is routed to the right recipients. Click "Activate" to go live.',
          screenshotKey: 'workflows/notification-step-5',
        },
      ],
    },
    {
      id: 'use-workflow-template',
      title: 'Using a Pre-Built Workflow Template',
      description:
        'Get started quickly by selecting and customizing one of the pre-built workflow templates for common HR processes.',
      estimatedTime: '5 minutes',
      roles: ['owner', 'admin'],
      steps: [
        {
          number: 1,
          title: 'Browse the template library',
          description:
            'In the Workflow Automation module, click "Templates" in the top navigation. Browse templates by category: Onboarding, Offboarding, Leave, Compensation, Compliance, and General.',
          screenshotKey: 'workflows/template-step-1',
        },
        {
          number: 2,
          title: 'Preview a template',
          description:
            'Click on a template to see a detailed description, the trigger and conditions it uses, and the actions it performs. The preview also shows which modules and data fields are involved.',
          screenshotKey: 'workflows/template-step-2',
        },
        {
          number: 3,
          title: 'Install the template',
          description:
            'Click "Use Template" to create a new workflow based on the template. The workflow opens in edit mode with all triggers, conditions, and actions pre-configured.',
          screenshotKey: 'workflows/template-step-3',
        },
        {
          number: 4,
          title: 'Customize the workflow',
          description:
            'Modify the template to match your organization\'s specific needs. Common customizations include changing approval levels, updating notification recipients, and adjusting condition thresholds.',
          screenshotKey: 'workflows/template-step-4',
          tip: 'Templates are starting points, not constraints. Feel free to add or remove steps, change conditions, and modify actions.',
        },
        {
          number: 5,
          title: 'Activate the customized workflow',
          description:
            'After customizing, run a dry test and then activate the workflow. The original template remains unchanged for future use.',
          screenshotKey: 'workflows/template-step-5',
        },
      ],
    },
    {
      id: 'debug-workflow',
      title: 'Debugging a Workflow Execution',
      description:
        'Investigate why a workflow did not fire or produced unexpected results by reviewing execution logs and step-by-step traces.',
      estimatedTime: '5 minutes',
      roles: ['owner', 'admin'],
      steps: [
        {
          number: 1,
          title: 'Open the execution history',
          description:
            'In the Workflow Automation module, click on a workflow and select the "History" tab. Each execution is listed with its trigger timestamp, status (Completed, Failed, Skipped), and duration.',
          screenshotKey: 'workflows/debug-step-1',
        },
        {
          number: 2,
          title: 'Inspect a specific execution',
          description:
            'Click on an execution to see its step-by-step trace. Each step shows whether it passed or failed, the input data it received, the condition evaluation result, and the action output.',
          screenshotKey: 'workflows/debug-step-2',
        },
        {
          number: 3,
          title: 'Identify the failure point',
          description:
            'Failed steps are highlighted in red with an error message. Common failure reasons include: condition never matched, approver not found, notification delivery failure, or webhook timeout.',
          screenshotKey: 'workflows/debug-step-3',
          tip: 'Use the "Replay" button to re-run a failed execution with the same input data after you have fixed the workflow configuration.',
        },
        {
          number: 4,
          title: 'Fix and re-test',
          description:
            'Edit the workflow to address the issue, then use "Dry Run" with the same trigger data to verify the fix. Once confirmed, the workflow will handle future events correctly.',
          screenshotKey: 'workflows/debug-step-4',
        },
      ],
    },
  ],

  faqs: [
    {
      question: 'How many workflows can I create?',
      answer:
        'There is no hard limit on the number of workflows. However, we recommend keeping the total number of active workflows manageable by consolidating similar workflows using condition branching. Inactive and draft workflows do not consume processing resources.',
    },
    {
      question: 'Can a workflow trigger another workflow?',
      answer:
        'Yes. Workflows can be chained by using the "Trigger Workflow" action. However, to prevent infinite loops, Tempo limits chain depth to 5 levels and blocks circular references. Use this feature to decompose complex processes into modular, reusable workflows.',
    },
    {
      question: 'What happens if an approver is on leave?',
      answer:
        'You can configure a delegation rule on each approval step. Options include: auto-escalate to the approver\'s manager, delegate to a named backup approver, or hold the request until the approver returns. Timeout-based escalation is configurable per step.',
    },
    {
      question: 'Can I schedule a workflow to run at a specific time instead of on an event?',
      answer:
        'Yes. Select "Scheduled" as the workflow type instead of "Event-Triggered". Configure a cron expression to set the schedule (e.g., every Monday at 9 AM, first day of each month). Scheduled workflows are useful for recurring reports, data cleanup, and periodic compliance checks.',
    },
    {
      question: 'Is there a way to test workflows without affecting real data?',
      answer:
        'Yes. The "Dry Run" feature simulates the workflow execution against a sample record and shows the results of each step without making any actual changes. You can also use the Sandbox module to test workflows in a completely isolated environment.',
    },
    {
      question: 'Can I export and import workflows between environments?',
      answer:
        'Yes. Export a workflow as a JSON file from the workflow\'s three-dot menu. Import it in another Tempo environment (e.g., from sandbox to production) using the "Import Workflow" button. The import process validates that all referenced fields and modules exist in the target environment.',
    },
    {
      question: 'What is the difference between Workflow Automation and Workflow Studio?',
      answer:
        'Workflow Automation uses a rule-based editor optimized for straightforward trigger-condition-action patterns. Workflow Studio is the visual drag-and-drop builder for complex workflows with branching, loops, parallel paths, and advanced data transformations. Both modules share the same execution engine.',
    },
    {
      question: 'How do webhook actions work?',
      answer:
        'The webhook action sends an HTTP POST request to a URL you specify, with a JSON payload containing the trigger data and any computed fields. You can configure custom headers, authentication tokens, and retry policies. Webhook responses can be captured and used in subsequent workflow steps.',
    },
  ],

  tips: [
    'Start with pre-built templates and customize rather than building from scratch to save time and follow proven patterns.',
    'Use descriptive workflow names that include the trigger event and purpose (e.g., "Leave Approval - 5+ Days - Manager & Director").',
    'Always run a dry test before activating a new workflow, especially for workflows that modify data or send external notifications.',
    'Review the execution history weekly to catch silently failing workflows before they impact business processes.',
    'Group related workflows into folders (e.g., Onboarding, Leave Management) to keep the workflow list organized.',
    'Use the "Delay" action strategically to avoid sending multiple notifications in quick succession when batch events occur.',
    'Document your workflow logic in the description field so other admins understand the intent without reading every step.',
  ],

  relatedModules: ['workflow-studio', 'onboarding', 'compliance', 'settings'],

  permissions: [
    {
      role: 'Owner',
      capabilities: [
        'Create, edit, activate, deactivate, and delete any workflow',
        'View execution history and detailed logs for all workflows',
        'Configure workflow settings, templates, and webhook integrations',
        'Export and import workflows between environments',
        'Access the workflow API for programmatic management',
      ],
    },
    {
      role: 'Admin',
      capabilities: [
        'Create, edit, activate, and deactivate workflows',
        'View execution history for all workflows',
        'Use pre-built templates and customize workflows',
        'Run dry tests and debug workflow executions',
      ],
    },
    {
      role: 'HRBP',
      capabilities: [
        'View workflows related to assigned departments',
        'View execution history for workflows they are stakeholders on',
        'Request workflow modifications through Admin',
      ],
    },
    {
      role: 'Manager',
      capabilities: [
        'Act as an approver in approval workflows',
        'View approval requests pending their action',
        'Delegate approval authority when out of office',
      ],
    },
    {
      role: 'Employee',
      capabilities: [
        'Submit requests that trigger approval workflows',
        'View the status of their own requests in approval pipelines',
        'Receive notifications generated by workflows',
      ],
    },
  ],
}

export default automation
