import type { ModuleDoc } from '../../types'

const groups: ModuleDoc = {
  slug: 'groups',
  title: 'Groups',
  subtitle: 'Organize employees into dynamic, rule-based groups for streamlined collaboration, permissions, and policy targeting',
  icon: 'Network',
  group: 'strategic',
  lastUpdated: '2026-03-13',
  version: '1.0',

  overview: {
    description:
      'The Groups module lets you define logical groupings of employees that automatically update based on rules you configure. Unlike static department assignments, groups can span departments, locations, and levels to represent cross-functional teams, project committees, eligibility pools, or any other organizational grouping. Groups drive permissions, policy targeting, communication distribution, and workflow routing throughout Tempo, eliminating the need to manually maintain distribution lists or access rosters.',
    keyFeatures: [
      'Dynamic membership rules based on department, location, job title, level, tenure, or custom fields',
      'Manual membership override for ad-hoc groups and committees',
      'Nested groups with inheritance for hierarchical group structures',
      'Group-based permission scoping across all Tempo modules',
      'Integration with notifications, documents, and workflow routing',
      'Membership change audit trail with before/after snapshots',
      'Bulk operations for applying policies or sending communications to entire groups',
      'Real-time membership count and preview before rule activation',
    ],
    screenshotKey: 'groups/overview',
  },

  workflows: [
    {
      id: 'create-dynamic-group',
      title: 'Creating a Dynamic Group',
      description:
        'Define a group with automatic membership rules that keep the roster current as employees join, move, or leave the organization.',
      estimatedTime: '5 minutes',
      roles: ['owner', 'admin', 'hrbp'],
      steps: [
        {
          number: 1,
          title: 'Navigate to Groups',
          description:
            'Click "Groups" in the left sidebar. The Groups dashboard shows all existing groups organized by type: Dynamic, Manual, and Nested. A search bar and filters let you find groups quickly.',
          screenshotKey: 'groups/create-step-1',
        },
        {
          number: 2,
          title: 'Create a new group',
          description:
            'Click "+ New Group". Enter the group name, description, and select "Dynamic" as the group type. Choose a category (e.g., Team, Committee, Eligibility, Distribution) to help organize your groups.',
          screenshotKey: 'groups/create-step-2',
        },
        {
          number: 3,
          title: 'Define membership rules',
          description:
            'Use the rule builder to define who belongs to this group. Add conditions like "Department is Engineering" AND "Level is Senior or above" AND "Location is United States". Combine conditions with AND/OR logic.',
          screenshotKey: 'groups/create-step-3',
          tip: 'Click "Preview Members" at any time to see which employees currently match your rules before saving.',
        },
        {
          number: 4,
          title: 'Preview and verify membership',
          description:
            'The preview panel shows the full list of employees who match the current rules, along with a total count. Review the list to confirm the rules capture the intended population. Adjust rules as needed.',
          screenshotKey: 'groups/create-step-4',
        },
        {
          number: 5,
          title: 'Save and activate',
          description:
            'Click "Save Group" to activate the group. Membership is evaluated in real time: when an employee\'s attributes change (e.g., they transfer departments), they are automatically added to or removed from the group.',
          screenshotKey: 'groups/create-step-5',
        },
      ],
    },
    {
      id: 'manual-group',
      title: 'Creating a Manual Group',
      description:
        'Build a group with hand-picked members for ad-hoc teams, committees, or one-time projects.',
      estimatedTime: '3 minutes',
      roles: ['owner', 'admin', 'hrbp', 'manager'],
      steps: [
        {
          number: 1,
          title: 'Start a new manual group',
          description:
            'Click "+ New Group" and select "Manual" as the group type. Enter the group name, description, and category.',
          screenshotKey: 'groups/manual-step-1',
        },
        {
          number: 2,
          title: 'Add members',
          description:
            'Search for employees by name, email, department, or job title. Click the "+" button next to each person to add them to the group. You can also paste a list of email addresses for bulk addition.',
          screenshotKey: 'groups/manual-step-2',
        },
        {
          number: 3,
          title: 'Assign group roles',
          description:
            'Optionally assign roles within the group: Owner (can manage membership), Member (standard access), and Observer (read-only access to group resources). Group owners can add or remove members independently.',
          screenshotKey: 'groups/manual-step-3',
          tip: 'Assign at least two group owners so the group can be managed even when one owner is unavailable.',
        },
        {
          number: 4,
          title: 'Save the group',
          description:
            'Click "Save Group". Manual groups do not change automatically. Members remain until explicitly added or removed by a group owner or administrator.',
          screenshotKey: 'groups/manual-step-4',
        },
      ],
    },
    {
      id: 'use-groups-for-policies',
      title: 'Using Groups for Policy Targeting',
      description:
        'Apply leave policies, expense limits, approval workflows, or module access to a specific group instead of managing individual assignments.',
      estimatedTime: '5 minutes',
      roles: ['owner', 'admin', 'hrbp'],
      steps: [
        {
          number: 1,
          title: 'Identify the target policy',
          description:
            'Navigate to the module where you want to apply group-based targeting. For example, go to Leave > Policies to target a leave policy, or Settings > Module Access to control who can see a module.',
          screenshotKey: 'groups/policy-step-1',
        },
        {
          number: 2,
          title: 'Open the assignment settings',
          description:
            'Click "Edit" on the policy you want to target. In the "Applies To" section, switch from "All Employees" to "Specific Groups".',
          screenshotKey: 'groups/policy-step-2',
        },
        {
          number: 3,
          title: 'Select one or more groups',
          description:
            'Search for and select the groups this policy should apply to. Multiple groups can be selected. If an employee belongs to more than one group with conflicting policies, the priority order you set determines which policy applies.',
          screenshotKey: 'groups/policy-step-3',
          tip: 'Use the "Test Employee" feature to verify which policy a specific employee would receive given the current group assignments.',
        },
        {
          number: 4,
          title: 'Set priority order',
          description:
            'If multiple groups are selected, drag them into priority order. The highest-priority group\'s policy takes precedence when an employee belongs to multiple groups.',
          screenshotKey: 'groups/policy-step-4',
        },
        {
          number: 5,
          title: 'Save and apply',
          description:
            'Click "Save". The policy is immediately applied to all current members of the selected groups. As group membership changes dynamically, the policy automatically follows. A notification is sent to affected employees if configured.',
          screenshotKey: 'groups/policy-step-5',
        },
      ],
    },
    {
      id: 'nested-groups',
      title: 'Building Nested Group Hierarchies',
      description:
        'Create parent-child group relationships where child groups inherit properties from their parents.',
      estimatedTime: '5 minutes',
      roles: ['owner', 'admin'],
      steps: [
        {
          number: 1,
          title: 'Create or select the parent group',
          description:
            'Navigate to Groups and either create a new group or open an existing group that will serve as the parent. Any group type (Dynamic or Manual) can be a parent.',
          screenshotKey: 'groups/nested-step-1',
        },
        {
          number: 2,
          title: 'Add child groups',
          description:
            'Open the parent group\'s settings and navigate to the "Subgroups" tab. Click "+ Add Subgroup" and search for existing groups to nest, or create a new child group inline.',
          screenshotKey: 'groups/nested-step-2',
        },
        {
          number: 3,
          title: 'Configure inheritance',
          description:
            'Choose what the child group inherits from the parent: permissions only, policies only, or both. Child groups can also override inherited settings when needed.',
          screenshotKey: 'groups/nested-step-3',
          tip: 'Use nested groups to model regional hierarchies: a "Global Engineering" parent with "US Engineering", "EU Engineering", and "APAC Engineering" children.',
        },
        {
          number: 4,
          title: 'Verify the hierarchy',
          description:
            'The group detail page shows a tree visualization of the hierarchy. Hover over any node to see its member count. Click a node to navigate to that group\'s settings.',
          screenshotKey: 'groups/nested-step-4',
        },
      ],
    },
  ],

  faqs: [
    {
      question: 'How often are dynamic group memberships recalculated?',
      answer:
        'Dynamic group memberships are evaluated in real time whenever an employee attribute changes (e.g., department transfer, promotion, location change). A full reconciliation also runs nightly at midnight UTC to catch any edge cases.',
    },
    {
      question: 'Can an employee belong to multiple groups?',
      answer:
        'Yes. Employees can be members of any number of groups simultaneously. When multiple groups apply conflicting policies, the priority order configured in the policy determines which one takes effect.',
    },
    {
      question: 'What happens to group membership when an employee leaves the company?',
      answer:
        'Terminated employees are automatically removed from all dynamic groups on their termination date. For manual groups, terminated employees are flagged but not automatically removed, allowing group owners to clean up at their discretion.',
    },
    {
      question: 'Can I use groups to control who sees specific modules?',
      answer:
        'Yes. Navigate to Settings > Module Access and assign module visibility to specific groups. This is useful for rolling out new modules to a pilot group before enabling them organization-wide.',
    },
    {
      question: 'How do I see which groups an employee belongs to?',
      answer:
        'Open the employee\'s profile in the People module and navigate to the "Groups" tab. This tab lists every group they are a member of, their role in each group, and whether membership is rule-based or manual.',
    },
    {
      question: 'Can I export a group\'s member list?',
      answer:
        'Yes. Open any group and click "Export Members" in the top-right corner. Choose CSV or Excel format. The export includes each member\'s name, email, department, job title, and the date they were added to the group.',
    },
  ],

  tips: [
    'Use dynamic groups for populations that change frequently (e.g., "All Managers") and manual groups for stable, hand-curated teams.',
    'Combine multiple conditions with AND logic for precise targeting, and use OR logic to broaden the group scope.',
    'Review the membership preview before saving a dynamic group to catch overly broad or narrow rules.',
    'Set up group-based notifications in the Documents module to automatically send policy updates to the right audience.',
    'Use nested groups to avoid duplicating rules: define a broad parent group and add specific child groups for targeted policies.',
  ],

  relatedModules: ['people', 'settings', 'workflow-studio', 'documents'],

  permissions: [
    {
      role: 'Owner',
      capabilities: [
        'Create, edit, and delete any group across the organization',
        'Configure nested group hierarchies and inheritance rules',
        'Use groups for policy targeting and module access control',
        'Export group member lists and audit trails',
      ],
    },
    {
      role: 'Admin',
      capabilities: [
        'Create, edit, and delete groups',
        'Configure nested group hierarchies and inheritance rules',
        'Use groups for policy targeting within assigned scope',
        'Export group member lists',
      ],
    },
    {
      role: 'HRBP',
      capabilities: [
        'Create and manage groups for assigned departments',
        'Add and remove members from manual groups in assigned scope',
        'View group membership and audit trails for assigned departments',
      ],
    },
    {
      role: 'Manager',
      capabilities: [
        'Create manual groups for their direct reports and project teams',
        'View groups their direct reports belong to',
        'Add direct reports to manual groups they own',
      ],
    },
  ],
}

export default groups
