import type { ModuleDoc } from '../../types'

const workflowStudio: ModuleDoc = {
  slug: 'workflow-studio',
  title: 'Workflow Studio',
  subtitle: 'Visual workflow builder and advanced automation designer',
  icon: 'Zap',
  group: 'strategic',
  lastUpdated: '2026-03-13',
  version: '1.0',

  overview: {
    description:
      'Workflow Studio is Tempo\'s advanced visual workflow builder for designing complex automations that go beyond simple trigger-condition-action patterns. Using a drag-and-drop canvas, you can create sophisticated workflows with branching logic, parallel execution paths, loops, data transformations, and integrations with external systems. The visual designer makes it easy to reason about complex business processes, while the underlying engine ensures reliable execution with built-in error handling and retry logic.',
    keyFeatures: [
      'Drag-and-drop visual canvas for designing workflows with a flowchart-style interface',
      'Branching and conditional paths with if/else, switch/case, and percentage-based routing',
      'Parallel execution lanes for steps that can run simultaneously',
      'Loop constructs for iterating over collections (e.g., all employees in a department)',
      'Data transformation nodes with built-in functions for formatting, mapping, and computing values',
      'External integration connectors for Slack, Microsoft Teams, Google Workspace, Jira, and more',
      'Version control with diff views to compare workflow versions',
      'Real-time collaboration allowing multiple editors to work on the same workflow',
    ],
    screenshotKey: 'workflow-studio/overview',
  },

  workflows: [
    {
      id: 'design-visual-workflow',
      title: 'Designing a Workflow on the Visual Canvas',
      description:
        'Create a new workflow using the drag-and-drop canvas, connecting trigger, condition, and action nodes visually.',
      estimatedTime: '15 minutes',
      roles: ['owner', 'admin'],
      prerequisites: [
        'Familiarity with the desired business process to automate',
        'Understanding of which modules and data fields are involved',
      ],
      steps: [
        {
          number: 1,
          title: 'Open Workflow Studio',
          description:
            'Click "Workflow Studio" in the left sidebar under the Strategic section. The studio opens to a gallery of recent workflows and a prominent "New Workflow" button.',
          screenshotKey: 'workflow-studio/design-step-1',
        },
        {
          number: 2,
          title: 'Create a new workflow and name it',
          description:
            'Click "New Workflow" to open a blank canvas. Enter the workflow name and description in the header panel. The canvas shows a "Start" node where your workflow begins.',
          screenshotKey: 'workflow-studio/design-step-2',
        },
        {
          number: 3,
          title: 'Add a trigger node',
          description:
            'Drag a "Trigger" node from the left panel onto the canvas and connect it to the Start node. Configure the trigger by selecting the event source (e.g., "Employee Status Changed") and any initial filters.',
          screenshotKey: 'workflow-studio/design-step-3',
        },
        {
          number: 4,
          title: 'Add condition and action nodes',
          description:
            'Drag condition nodes (diamond shapes) and action nodes (rounded rectangles) onto the canvas. Connect them by dragging from one node\'s output port to another\'s input port. Condition nodes have two output paths (True/False) that branch the workflow.',
          screenshotKey: 'workflow-studio/design-step-4',
          tip: 'Hold Shift and click multiple nodes to select them as a group, then move or duplicate them together.',
        },
        {
          number: 5,
          title: 'Configure each node',
          description:
            'Click on any node to open its configuration panel on the right side. Set the specific parameters: for conditions, define the comparison logic; for actions, configure the target (e.g., send email to whom, update which field). Use the data picker to reference values from upstream nodes.',
          screenshotKey: 'workflow-studio/design-step-5',
        },
        {
          number: 6,
          title: 'Test and publish',
          description:
            'Click "Test" to simulate the workflow with sample data. The canvas animates the execution path, highlighting each node as it fires. Fix any issues, then click "Publish" to make the workflow active.',
          screenshotKey: 'workflow-studio/design-step-6',
        },
      ],
    },
    {
      id: 'add-branching-logic',
      title: 'Adding Branching and Parallel Paths',
      description:
        'Create workflows with conditional branching and parallel execution lanes for complex business logic.',
      estimatedTime: '10 minutes',
      roles: ['owner', 'admin'],
      steps: [
        {
          number: 1,
          title: 'Add a condition node',
          description:
            'Drag a "Condition" node onto the canvas and connect it to the preceding step. The condition node has two output ports: a green "True" path and a red "False" path.',
          screenshotKey: 'workflow-studio/branch-step-1',
        },
        {
          number: 2,
          title: 'Configure the condition',
          description:
            'Click the condition node and define the evaluation rule. For example, "If employee.country == \'GH\'" routes Ghanaian employees down the True path and all others down the False path. Use the expression builder for complex conditions.',
          screenshotKey: 'workflow-studio/branch-step-2',
        },
        {
          number: 3,
          title: 'Build each branch',
          description:
            'Add action nodes to each branch path. For example, the True path sends a local tax form while the False path sends an international compliance notice. Each branch can have its own sequence of steps.',
          screenshotKey: 'workflow-studio/branch-step-3',
          tip: 'Use a "Merge" node to rejoin branches when downstream steps should apply to all paths.',
        },
        {
          number: 4,
          title: 'Add parallel lanes',
          description:
            'Drag a "Parallel" node onto the canvas. Connect it to the preceding step, then add multiple output connections. Each connection starts a parallel lane that executes simultaneously. Use a "Wait All" node downstream to synchronize the lanes before continuing.',
          screenshotKey: 'workflow-studio/branch-step-4',
        },
        {
          number: 5,
          title: 'Test the branching logic',
          description:
            'Use the test mode with different sample records to verify that each branch activates correctly. The canvas highlights the active path during simulation so you can visually confirm the routing.',
          screenshotKey: 'workflow-studio/branch-step-5',
        },
      ],
    },
    {
      id: 'integrate-external-systems',
      title: 'Integrating with External Systems',
      description:
        'Connect your workflows to third-party tools like Slack, Jira, and Google Workspace using built-in integration connectors.',
      estimatedTime: '8 minutes',
      roles: ['owner', 'admin'],
      prerequisites: [
        'API credentials or OAuth connection configured in Settings > Integrations',
      ],
      steps: [
        {
          number: 1,
          title: 'Drag an integration node onto the canvas',
          description:
            'From the left panel, expand the "Integrations" category and drag the desired connector (e.g., Slack, Jira, Google Sheets) onto the canvas. Connect it to the appropriate point in your workflow.',
          screenshotKey: 'workflow-studio/integrate-step-1',
        },
        {
          number: 2,
          title: 'Authenticate the connection',
          description:
            'Click the integration node. If a connection has not been established, click "Connect" to authenticate via OAuth or paste in API credentials. Once connected, a green checkmark confirms the integration is active.',
          screenshotKey: 'workflow-studio/integrate-step-2',
        },
        {
          number: 3,
          title: 'Configure the action',
          description:
            'Select the specific operation (e.g., "Post Message to Channel" for Slack, "Create Issue" for Jira). Map Tempo data fields to the integration\'s required parameters using the data picker.',
          screenshotKey: 'workflow-studio/integrate-step-3',
          tip: 'Use the "Transform" node before an integration to reshape data into the format the external system expects.',
        },
        {
          number: 4,
          title: 'Set error handling',
          description:
            'Configure what happens if the external call fails: retry (with configurable attempts and backoff), skip the step, or halt the workflow. You can also add a fallback action (e.g., send an email if the Slack message fails).',
          screenshotKey: 'workflow-studio/integrate-step-4',
        },
      ],
    },
    {
      id: 'version-control-workflows',
      title: 'Managing Workflow Versions',
      description:
        'Use built-in version control to track changes, compare versions, and safely roll back to previous workflow configurations.',
      estimatedTime: '5 minutes',
      roles: ['owner', 'admin'],
      steps: [
        {
          number: 1,
          title: 'View version history',
          description:
            'Open a workflow in the Studio and click the "Versions" tab in the right panel. Each saved version is listed with a timestamp, author, and change summary.',
          screenshotKey: 'workflow-studio/version-step-1',
        },
        {
          number: 2,
          title: 'Compare versions',
          description:
            'Select two versions and click "Compare". The canvas shows a side-by-side diff with added nodes in green, removed nodes in red, and modified nodes in amber. Configuration changes are listed in a details panel.',
          screenshotKey: 'workflow-studio/version-step-2',
        },
        {
          number: 3,
          title: 'Restore a previous version',
          description:
            'Click "Restore" on any previous version to create a new draft based on that version. Review the restored workflow and publish it when ready. The version history maintains the full audit trail.',
          screenshotKey: 'workflow-studio/version-step-3',
          tip: 'Add descriptive commit messages when saving workflow versions to make the version history easier to navigate.',
        },
        {
          number: 4,
          title: 'Create a named version',
          description:
            'Click "Save Version" and enter a name and description for the current state (e.g., "v2.0 - Added international branch"). Named versions appear prominently in the version list for quick reference.',
          screenshotKey: 'workflow-studio/version-step-4',
        },
      ],
    },
  ],

  faqs: [
    {
      question: 'What is the difference between Workflow Studio and Workflow Automation?',
      answer:
        'Workflow Automation uses a simpler rule-based editor optimized for straightforward trigger-condition-action patterns. Workflow Studio provides a full visual canvas with drag-and-drop nodes for complex workflows involving branching, parallel paths, loops, and external integrations. Both share the same execution engine, and simple workflows can be promoted from Automation to Studio if they grow in complexity.',
    },
    {
      question: 'Can multiple people edit a workflow at the same time?',
      answer:
        'Yes. Workflow Studio supports real-time collaboration. Each editor\'s cursor is visible on the canvas, and changes are synced instantly. A locking mechanism prevents two people from editing the same node simultaneously. The version history tracks changes by author.',
    },
    {
      question: 'How do loops work in Workflow Studio?',
      answer:
        'Drag a "Loop" node onto the canvas and configure it to iterate over a collection (e.g., all employees in a department). Actions inside the loop execute once per item. You can set concurrency limits to control how many items are processed in parallel.',
    },
    {
      question: 'What integrations are available?',
      answer:
        'Built-in connectors include Slack, Microsoft Teams, Google Workspace (Sheets, Drive, Calendar), Jira, Asana, Salesforce, HubSpot, Zendesk, and generic HTTP/webhook. Custom integrations can be built using the HTTP request node or the Developer module\'s API.',
    },
    {
      question: 'Is there a limit to workflow complexity?',
      answer:
        'Workflows can have up to 200 nodes per canvas. For workflows exceeding this limit, use sub-workflows to break the process into modular, reusable pieces. Each sub-workflow can have its own 200-node limit and its own version history.',
    },
    {
      question: 'Can I duplicate an existing workflow?',
      answer:
        'Yes. Open any workflow, click the three-dot menu, and select "Duplicate". This creates a copy in Draft status that you can modify independently. Duplicating is a great way to create variations of a workflow for different departments or regions.',
    },
    {
      question: 'How do I handle errors in complex workflows?',
      answer:
        'Each node can have its own error handling policy: retry with exponential backoff, execute a fallback action, skip and continue, or halt the entire workflow. You can also add a global "On Error" handler that catches unhandled errors from any node and performs a cleanup action.',
    },
  ],

  tips: [
    'Start by sketching the workflow on paper or a whiteboard before building it in the Studio to clarify the logic upfront.',
    'Use sub-workflows for reusable process fragments (e.g., a standard approval chain) that appear in multiple workflows.',
    'Color-code your nodes by category (blue for actions, green for conditions, orange for integrations) using the node style settings.',
    'Add comment nodes to the canvas to explain complex sections of the workflow for other team members.',
    'Use the "Zoom to Fit" button to see the entire workflow on screen when navigating large canvases.',
    'Test each branch independently before testing the entire workflow end-to-end.',
  ],

  relatedModules: ['workflows', 'developer', 'app-studio', 'settings'],

  permissions: [
    {
      role: 'Owner',
      capabilities: [
        'Create, edit, publish, and delete any workflow in the Studio',
        'Configure integration connectors and API credentials',
        'Manage version history and restore previous versions',
        'Set global error handling policies',
        'Grant editor or viewer access to other users',
      ],
    },
    {
      role: 'Admin',
      capabilities: [
        'Create, edit, and publish workflows',
        'Use all integration connectors',
        'View and restore workflow versions',
        'Run test simulations',
        'View execution logs and debug failures',
      ],
    },
    {
      role: 'HRBP',
      capabilities: [
        'View workflows in read-only mode on the visual canvas',
        'View execution history for workflows related to assigned departments',
        'Request workflow modifications through Admin',
      ],
    },
    {
      role: 'Manager',
      capabilities: [
        'View workflows that involve their team in read-only mode',
        'Participate as an approver node in published workflows',
      ],
    },
  ],
}

export default workflowStudio
