import type { ModuleDoc } from '../../types'

const appStudio: ModuleDoc = {
  slug: 'app-studio',
  title: 'App Studio',
  subtitle: 'Build custom low-code applications with drag-and-drop pages, reusable components, and live data sources',
  icon: 'Blocks',
  group: 'strategic',
  lastUpdated: '2026-03-13',
  version: '1.0',

  overview: {
    description:
      'App Studio is Tempo\'s low-code application builder that empowers HR teams, operations managers, and business analysts to create custom internal applications without writing code. Using a visual drag-and-drop interface, you can design multi-page apps with forms, tables, charts, and approval flows that connect directly to Tempo\'s data layer or external APIs. Apps built in App Studio are instantly deployable to your organization, complete with role-based access controls and audit logging.',
    keyFeatures: [
      'Visual drag-and-drop page builder with a library of 40+ pre-built components',
      'Data source connectors for Tempo modules, REST APIs, Google Sheets, and SQL databases',
      'Form builder with validation rules, conditional logic, and file upload support',
      'Table component with inline editing, sorting, filtering, and CSV export',
      'Chart components for bar, line, pie, and area visualizations',
      'Approval workflow builder with multi-step routing and SLA enforcement',
      'Role-based access controls inherited from Tempo or defined per app',
      'Version history with rollback capability for every published app',
    ],
    screenshotKey: 'app-studio/overview',
  },

  workflows: [
    {
      id: 'create-app',
      title: 'Creating a New Application',
      description:
        'Start a new custom application from scratch or from a pre-built template, configure its settings, and add your first page.',
      estimatedTime: '10 minutes',
      roles: ['owner', 'admin'],
      steps: [
        {
          number: 1,
          title: 'Open App Studio',
          description:
            'Navigate to App Studio from the left sidebar. The App Studio dashboard shows all existing apps organized by status: Draft, Published, and Archived.',
          screenshotKey: 'app-studio/create-step-1',
        },
        {
          number: 2,
          title: 'Start a new app',
          description:
            'Click "+ New App". Choose to start from a blank canvas or select from the template gallery. Templates include common patterns like Equipment Request, Training Tracker, and Visitor Management.',
          screenshotKey: 'app-studio/create-step-2',
          tip: 'Templates are fully customizable after creation. They save time by providing a working starting point.',
        },
        {
          number: 3,
          title: 'Configure app settings',
          description:
            'Enter the app name, description, icon, and color theme. Set the app slug which determines its URL path. Choose the default access level: Organization-wide, Department-restricted, or Custom roles.',
          screenshotKey: 'app-studio/create-step-3',
        },
        {
          number: 4,
          title: 'Add your first page',
          description:
            'Click "+ Add Page" in the left panel. Name the page and choose a layout: single column, two columns, sidebar, or freeform canvas. The page appears in the visual editor ready for components.',
          screenshotKey: 'app-studio/create-step-4',
        },
        {
          number: 5,
          title: 'Drag components onto the page',
          description:
            'Open the component panel on the right and drag components onto the canvas. Available components include Text, Form Input, Button, Table, Chart, Image, Divider, Tabs, and Modal. Each component has a property panel for configuration.',
          screenshotKey: 'app-studio/create-step-5',
        },
      ],
    },
    {
      id: 'connect-data',
      title: 'Connecting Data Sources',
      description:
        'Wire your application to live data by connecting Tempo modules, external APIs, or database queries as data sources.',
      estimatedTime: '8 minutes',
      roles: ['owner', 'admin'],
      steps: [
        {
          number: 1,
          title: 'Open the Data panel',
          description:
            'Click the "Data" tab in the left sidebar of the app editor. This panel lists all connected data sources and allows you to add new ones.',
          screenshotKey: 'app-studio/data-step-1',
        },
        {
          number: 2,
          title: 'Add a Tempo data source',
          description:
            'Click "+ Add Data Source" and select "Tempo Module". Choose from available modules like People, Payroll, Leave, or Expenses. The connector automatically maps fields and respects the user\'s existing permissions.',
          screenshotKey: 'app-studio/data-step-2',
        },
        {
          number: 3,
          title: 'Add an external API source',
          description:
            'Select "REST API" to connect an external service. Enter the base URL, authentication method (API key, OAuth, or Bearer token), and configure the request headers. Test the connection to verify the response.',
          screenshotKey: 'app-studio/data-step-3',
          tip: 'Store API keys in the Secrets Manager (Settings > Secrets) rather than hardcoding them in the data source configuration.',
        },
        {
          number: 4,
          title: 'Create a query',
          description:
            'For each data source, define one or more queries. Queries support filtering, sorting, pagination, and field selection. Use the query builder for simple cases or switch to raw mode for advanced expressions.',
          screenshotKey: 'app-studio/data-step-4',
        },
        {
          number: 5,
          title: 'Bind data to components',
          description:
            'Select a component on the canvas, open its property panel, and set the "Data Source" property to one of your queries. For tables, columns auto-map to query fields. For charts, map the X and Y axes to specific fields.',
          screenshotKey: 'app-studio/data-step-5',
        },
        {
          number: 6,
          title: 'Configure refresh behavior',
          description:
            'Set each query\'s refresh interval: on page load only, polling every N seconds, or manual refresh via a button. Enable optimistic updates for form submissions so the UI updates immediately while the server processes the change.',
          screenshotKey: 'app-studio/data-step-6',
        },
      ],
    },
    {
      id: 'build-form',
      title: 'Building a Form with Validation',
      description:
        'Create a data entry form with input validation, conditional fields, and a submission handler that writes to a data source.',
      estimatedTime: '8 minutes',
      roles: ['owner', 'admin'],
      steps: [
        {
          number: 1,
          title: 'Add a Form component',
          description:
            'Drag the "Form" component from the component panel onto your page. The form container is created with default Submit and Cancel buttons.',
          screenshotKey: 'app-studio/form-step-1',
        },
        {
          number: 2,
          title: 'Add form fields',
          description:
            'Drag input components inside the form: Text Input, Number Input, Date Picker, Select Dropdown, File Upload, Checkbox, and Radio Group. Each field can be labeled and given a unique field key.',
          screenshotKey: 'app-studio/form-step-2',
        },
        {
          number: 3,
          title: 'Set validation rules',
          description:
            'Select each field and configure validation in the property panel. Available rules include Required, Min/Max Length, Pattern (regex), Email format, Number range, and Custom validation with JavaScript expressions.',
          screenshotKey: 'app-studio/form-step-3',
          tip: 'Add descriptive error messages for each validation rule so users understand exactly what is expected.',
        },
        {
          number: 4,
          title: 'Add conditional logic',
          description:
            'Click "Add Condition" on any field to make it appear or hide based on other field values. For example, show a "Visa Expiry Date" field only when the "Work Authorization" dropdown is set to "Visa".',
          screenshotKey: 'app-studio/form-step-4',
        },
        {
          number: 5,
          title: 'Configure the submission handler',
          description:
            'Click the Submit button and open "On Submit" in the action panel. Choose an action: Insert into a data source, Update a record, Trigger a workflow, Send a notification, or chain multiple actions together.',
          screenshotKey: 'app-studio/form-step-5',
        },
      ],
    },
    {
      id: 'publish-app',
      title: 'Publishing and Managing Apps',
      description:
        'Publish your application to make it available to users, manage versions, and monitor usage analytics.',
      estimatedTime: '4 minutes',
      roles: ['owner', 'admin'],
      steps: [
        {
          number: 1,
          title: 'Preview the app',
          description:
            'Click "Preview" in the top toolbar to open the app in a new tab. The preview shows exactly what end users will see, including data binding and permissions. Test all forms and interactions.',
          screenshotKey: 'app-studio/publish-step-1',
        },
        {
          number: 2,
          title: 'Set access permissions',
          description:
            'Navigate to the app\'s Settings > Access tab. Define which roles can view, edit, or administer the app. You can also grant access to specific departments or individual employees.',
          screenshotKey: 'app-studio/publish-step-2',
        },
        {
          number: 3,
          title: 'Publish the app',
          description:
            'Click "Publish" in the top toolbar. Enter a version label and optional release notes. The app becomes immediately available to users with the appropriate permissions. A link to the app is added to the sidebar.',
          screenshotKey: 'app-studio/publish-step-3',
          tip: 'Use semantic versioning (1.0, 1.1, 2.0) for your version labels to track major and minor changes.',
        },
        {
          number: 4,
          title: 'Monitor usage analytics',
          description:
            'After publishing, the Analytics tab shows page views, unique users, form submissions, and error rates. Use this data to identify popular features and areas that need improvement.',
          screenshotKey: 'app-studio/publish-step-4',
        },
        {
          number: 5,
          title: 'Rollback to a previous version',
          description:
            'If a published version has issues, navigate to Settings > Versions and click "Rollback" on any previous version. The app instantly reverts to that version. The faulty version is retained in history for reference.',
          screenshotKey: 'app-studio/publish-step-5',
        },
      ],
    },
  ],

  faqs: [
    {
      question: 'Do I need coding experience to use App Studio?',
      answer:
        'No. App Studio is designed for non-technical users. All functionality is available through the visual drag-and-drop interface. However, power users can add custom JavaScript expressions for advanced validation, computed fields, and event handlers.',
    },
    {
      question: 'How many apps can I create?',
      answer:
        'There is no hard limit on the number of apps. Your plan determines the total number of published apps that can be active simultaneously. Draft and archived apps do not count against the limit.',
    },
    {
      question: 'Can I embed an App Studio app in another page?',
      answer:
        'Yes. Each published app has an embed URL that can be placed in an iframe on any internal page. The embedded app respects the same authentication and permissions as the standalone version.',
    },
    {
      question: 'What happens to user data if I delete an app?',
      answer:
        'Deleting an app removes the app configuration and pages but does not delete any data stored in connected data sources. Records created through the app remain in the underlying Tempo modules or external databases.',
    },
    {
      question: 'Can multiple people edit the same app simultaneously?',
      answer:
        'Currently, App Studio supports single-editor mode. If another user is editing the same app, you will see a lock indicator with their name. You can request edit access or open the app in read-only preview mode.',
    },
    {
      question: 'How do I handle errors in form submissions?',
      answer:
        'Configure the "On Error" action in the submission handler. Options include showing a toast notification, displaying inline error messages, retrying the submission, or redirecting to a custom error page. Failed submissions are logged in the app\'s error log for debugging.',
    },
  ],

  tips: [
    'Start with a template and customize it rather than building from scratch to save significant development time.',
    'Use the "Clone Page" feature to create variations of similar pages without rebuilding components.',
    'Test your app in Preview mode with different user roles to verify that permissions work correctly.',
    'Add a "Help" page to your app with usage instructions so end users can self-serve.',
    'Use the built-in Tabs component to organize complex forms into manageable sections.',
    'Set up email notifications on form submissions so app owners are alerted when new data is entered.',
  ],

  relatedModules: ['workflow-studio', 'developer', 'groups', 'automation'],

  permissions: [
    {
      role: 'Owner',
      capabilities: [
        'Create, edit, publish, and delete any application',
        'Configure app access permissions and roles',
        'Connect any data source including external APIs',
        'View usage analytics for all applications',
        'Manage the template gallery',
      ],
    },
    {
      role: 'Admin',
      capabilities: [
        'Create, edit, publish, and delete applications',
        'Configure app access permissions and roles',
        'Connect Tempo data sources and pre-approved external APIs',
        'View usage analytics for all applications',
      ],
    },
    {
      role: 'HRBP',
      capabilities: [
        'Create and edit applications for assigned departments',
        'Publish apps with access restricted to assigned scope',
        'Connect Tempo data sources within assigned scope',
      ],
    },
    {
      role: 'Employee',
      capabilities: [
        'Use published applications they have been granted access to',
        'Submit forms and interact with app components',
        'View their own submission history within apps',
      ],
    },
  ],
}

export default appStudio
