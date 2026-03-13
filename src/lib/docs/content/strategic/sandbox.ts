import type { ModuleDoc } from '../../types'

const sandbox: ModuleDoc = {
  slug: 'sandbox',
  title: 'Sandbox',
  subtitle: 'Safely test configurations, workflows, and policy changes in isolated environments with demo data',
  icon: 'FlaskConical',
  group: 'strategic',
  lastUpdated: '2026-03-13',
  version: '1.0',

  overview: {
    description:
      'The Sandbox module provides isolated testing environments where administrators and HR teams can experiment with configuration changes, workflow automations, and policy updates without affecting production data. Each sandbox is a complete replica of your Tempo environment with synthetic or anonymized data, allowing you to validate changes before promoting them to production. Sandboxes support snapshot and restore, change comparison, and a structured promotion workflow with approval gates.',
    keyFeatures: [
      'One-click sandbox creation with full environment replication',
      'Synthetic data generator with configurable employee count and department structure',
      'Anonymized production data cloning for realistic testing scenarios',
      'Side-by-side comparison view between sandbox and production configurations',
      'Change promotion workflow with diff review and approval gates',
      'Snapshot and restore for repeatable test scenarios',
      'Isolated API endpoints for integration testing',
      'Automatic sandbox expiration with configurable TTL',
    ],
    screenshotKey: 'sandbox/overview',
  },

  workflows: [
    {
      id: 'create-sandbox',
      title: 'Creating a Sandbox Environment',
      description:
        'Spin up an isolated testing environment with either synthetic data or an anonymized copy of your production data.',
      estimatedTime: '5 minutes',
      roles: ['owner', 'admin'],
      steps: [
        {
          number: 1,
          title: 'Navigate to Sandbox',
          description:
            'Click "Sandbox" in the left sidebar. The Sandbox dashboard lists all active sandboxes with their creation date, owner, status, and expiration date.',
          screenshotKey: 'sandbox/create-step-1',
        },
        {
          number: 2,
          title: 'Start a new sandbox',
          description:
            'Click "+ New Sandbox". Enter a name and description that identifies the purpose of this sandbox, such as "Test new leave policy" or "Payroll formula changes Q2".',
          screenshotKey: 'sandbox/create-step-2',
        },
        {
          number: 3,
          title: 'Choose a data strategy',
          description:
            'Select the data source for your sandbox: "Synthetic Data" generates realistic fake employees with configurable count and structure; "Anonymized Clone" copies your production data with all personally identifiable information replaced by synthetic values.',
          screenshotKey: 'sandbox/create-step-3',
          tip: 'Anonymized clones preserve the statistical distribution of your real data (department sizes, salary ranges, tenure) while ensuring no real employee information is exposed.',
        },
        {
          number: 4,
          title: 'Select modules to include',
          description:
            'Choose which Tempo modules to replicate in the sandbox. You can include all modules or select specific ones relevant to your test. Unselected modules will show placeholder data.',
          screenshotKey: 'sandbox/create-step-4',
        },
        {
          number: 5,
          title: 'Set expiration and launch',
          description:
            'Configure the sandbox TTL (time to live): 24 hours, 7 days, 30 days, or custom. Click "Create Sandbox". Provisioning takes 30-60 seconds. Once ready, a green "Active" badge appears.',
          screenshotKey: 'sandbox/create-step-5',
        },
      ],
    },
    {
      id: 'test-changes',
      title: 'Testing Configuration Changes',
      description:
        'Make and validate configuration changes in the sandbox before promoting them to your production environment.',
      estimatedTime: '15 minutes',
      roles: ['owner', 'admin', 'hrbp'],
      steps: [
        {
          number: 1,
          title: 'Enter the sandbox',
          description:
            'Click "Enter Sandbox" on your active sandbox card. The Tempo interface reloads with a prominent orange banner at the top indicating you are in sandbox mode. All navigation and features work identically to production.',
          screenshotKey: 'sandbox/test-step-1',
        },
        {
          number: 2,
          title: 'Make configuration changes',
          description:
            'Navigate to any module and make the changes you want to test. For example, update leave policy accrual rates, modify approval workflow routing, or change payroll tax configurations. All changes are isolated to this sandbox.',
          screenshotKey: 'sandbox/test-step-2',
          tip: 'Keep notes in the sandbox description about what you changed and why. This helps when reviewing changes before promotion.',
        },
        {
          number: 3,
          title: 'Validate with test scenarios',
          description:
            'Run through real-world scenarios to validate your changes. Submit leave requests, process a payroll run, or trigger an approval workflow. Check that the outcomes match your expectations.',
          screenshotKey: 'sandbox/test-step-3',
        },
        {
          number: 4,
          title: 'Review the change log',
          description:
            'Navigate to Sandbox > Changes to see a detailed log of every configuration change made in this sandbox. The log shows the before and after values, the timestamp, and the user who made each change.',
          screenshotKey: 'sandbox/test-step-4',
        },
        {
          number: 5,
          title: 'Take a snapshot',
          description:
            'If you reach a good state, click "Take Snapshot" to save the current sandbox state. You can restore to this snapshot later if subsequent changes cause issues. Each sandbox supports up to 10 snapshots.',
          screenshotKey: 'sandbox/test-step-5',
        },
      ],
    },
    {
      id: 'promote-changes',
      title: 'Promoting Changes to Production',
      description:
        'Review, approve, and apply tested sandbox changes to your live production environment through a structured promotion workflow.',
      estimatedTime: '10 minutes',
      roles: ['owner', 'admin'],
      steps: [
        {
          number: 1,
          title: 'Initiate promotion',
          description:
            'From the sandbox dashboard, click "Promote to Production" on the sandbox that contains your validated changes. The promotion wizard opens with a summary of all changes.',
          screenshotKey: 'sandbox/promote-step-1',
        },
        {
          number: 2,
          title: 'Review the change diff',
          description:
            'The side-by-side diff view shows every configuration change with the current production value on the left and the sandbox value on the right. Changes are color-coded: green for additions, yellow for modifications, red for removals.',
          screenshotKey: 'sandbox/promote-step-2',
        },
        {
          number: 3,
          title: 'Select changes to promote',
          description:
            'Use the checkboxes to select which changes to include in this promotion. You can promote all changes at once or cherry-pick specific ones. Deselected changes remain in the sandbox for future promotion.',
          screenshotKey: 'sandbox/promote-step-3',
          tip: 'Promote related changes together to avoid partial configurations that could cause unexpected behavior.',
        },
        {
          number: 4,
          title: 'Submit for approval',
          description:
            'Add a promotion note describing the changes and their business purpose. Click "Submit for Approval". If your organization requires promotion approval, the request is routed to the designated approver. Otherwise, you can self-approve.',
          screenshotKey: 'sandbox/promote-step-4',
        },
        {
          number: 5,
          title: 'Apply to production',
          description:
            'Once approved, click "Apply Now" to execute the promotion. Changes are applied atomically. If any change fails, the entire promotion is rolled back and you receive an error report. A confirmation notification is sent to all stakeholders.',
          screenshotKey: 'sandbox/promote-step-5',
        },
      ],
    },
    {
      id: 'manage-sandboxes',
      title: 'Managing and Cleaning Up Sandboxes',
      description:
        'Monitor active sandboxes, extend or reduce their lifetimes, restore snapshots, and clean up environments that are no longer needed.',
      estimatedTime: '3 minutes',
      roles: ['owner', 'admin'],
      steps: [
        {
          number: 1,
          title: 'View all sandboxes',
          description:
            'The Sandbox dashboard shows all environments with their status (Active, Expired, Promoted), creation date, owner, expiration date, and storage usage. Use the status filter to focus on active sandboxes.',
          screenshotKey: 'sandbox/manage-step-1',
        },
        {
          number: 2,
          title: 'Extend a sandbox lifetime',
          description:
            'Click the three-dot menu on any active sandbox and select "Extend". Choose an extension period: 7 days, 14 days, or 30 days. Extensions are limited to prevent resource waste.',
          screenshotKey: 'sandbox/manage-step-2',
        },
        {
          number: 3,
          title: 'Restore a snapshot',
          description:
            'Open a sandbox and navigate to the Snapshots tab. Click "Restore" on any snapshot to revert the sandbox to that saved state. All changes made after the snapshot are discarded.',
          screenshotKey: 'sandbox/manage-step-3',
          tip: 'Always take a new snapshot before restoring an old one, in case you need to return to the current state.',
        },
        {
          number: 4,
          title: 'Delete a sandbox',
          description:
            'Click "Delete" on any sandbox you no longer need. Confirm the deletion in the modal. Deleted sandboxes and their data are permanently removed. Promotion history is retained in the audit log.',
          screenshotKey: 'sandbox/manage-step-4',
        },
      ],
    },
  ],

  faqs: [
    {
      question: 'Does the sandbox use real employee data?',
      answer:
        'Only if you choose the "Anonymized Clone" data strategy. In that case, all personally identifiable information (names, emails, addresses, phone numbers) is replaced with synthetic values. Statistical distributions are preserved. The "Synthetic Data" option generates entirely fictional employees.',
    },
    {
      question: 'How many sandboxes can I run simultaneously?',
      answer:
        'The default limit is 3 active sandboxes per organization. This limit can be adjusted by contacting support. Expired and deleted sandboxes do not count against the limit.',
    },
    {
      question: 'Can I share a sandbox with another administrator?',
      answer:
        'Yes. Open the sandbox settings and add collaborators by name or email. Collaborators can enter the sandbox, make changes, and take snapshots. Only the sandbox owner or an Owner-level user can promote changes to production.',
    },
    {
      question: 'What happens when a sandbox expires?',
      answer:
        'Expired sandboxes become read-only. You can still view the configuration and change log, but you cannot make new changes or enter sandbox mode. Expired sandboxes are automatically deleted after 30 days unless extended.',
    },
    {
      question: 'Can I test integrations in the sandbox?',
      answer:
        'Yes. Each sandbox has isolated API endpoints that you can use for integration testing. Webhooks configured in the sandbox fire to separate URLs to avoid triggering production integrations. API keys are sandbox-scoped.',
    },
    {
      question: 'Is there a way to compare two sandboxes against each other?',
      answer:
        'Yes. From the Sandbox dashboard, select two sandboxes and click "Compare". The diff view shows the configuration differences between the two environments, which is useful when testing alternative approaches to the same change.',
    },
  ],

  tips: [
    'Name your sandboxes descriptively (e.g., "Q2-leave-policy-update") so their purpose is immediately clear.',
    'Use the anonymized clone for testing changes that depend on realistic data distributions, like payroll formulas or headcount planning.',
    'Take a snapshot immediately after creating a sandbox so you can always return to the clean baseline.',
    'Set sandbox expiration dates to match your testing timeline to avoid accumulating unused environments.',
    'Use the change log to document your testing rationale before submitting a promotion request.',
    'Test with different user roles by switching your role within the sandbox to verify permissions are correct.',
  ],

  relatedModules: ['developer', 'settings', 'workflow-studio', 'automation'],

  permissions: [
    {
      role: 'Owner',
      capabilities: [
        'Create, manage, and delete any sandbox environment',
        'Promote sandbox changes to production',
        'Approve or reject promotion requests from other users',
        'Configure sandbox limits and default expiration policies',
      ],
    },
    {
      role: 'Admin',
      capabilities: [
        'Create, manage, and delete sandboxes they own',
        'Promote sandbox changes to production (subject to approval if configured)',
        'Collaborate on sandboxes shared with them',
        'View change logs for all sandboxes',
      ],
    },
    {
      role: 'HRBP',
      capabilities: [
        'Enter and test changes in sandboxes shared with them',
        'Take and restore snapshots in shared sandboxes',
        'View change logs for sandboxes they have access to',
      ],
    },
    {
      role: 'Manager',
      capabilities: [
        'View sandbox environments shared with them in read-only mode',
        'Provide feedback on proposed changes via comments',
      ],
    },
  ],
}

export default sandbox
