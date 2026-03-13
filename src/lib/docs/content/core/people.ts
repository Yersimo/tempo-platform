import type { ModuleDoc } from '../../types'

const people: ModuleDoc = {
  slug: 'people',
  title: 'People',
  subtitle: 'Employee directory, org chart, profiles, and bulk data management',
  icon: 'Users',
  group: 'core',
  lastUpdated: '2026-03-13',
  version: '1.0',

  overview: {
    description:
      'The People module is the foundation of your Tempo workforce data. It serves as the single source of truth for all employee records, organizational structure, and reporting relationships. From here you can browse the employee directory, navigate the interactive org chart, manage individual profiles, and perform bulk operations such as CSV imports and mass updates. Every other module in Tempo references data from People, making accurate and up-to-date employee records essential for payroll, benefits, performance reviews, and compliance.',
    keyFeatures: [
      'Searchable employee directory with advanced filtering by department, location, job title, and level',
      'Interactive org chart with drag-and-drop reorganization',
      'Comprehensive employee profiles with personal, job, compensation, and document sections',
      'Bulk import via CSV with validation, duplicate detection, and error reporting',
      'Bulk update capabilities for mass changes to departments, managers, or job titles',
      'Custom fields support for organization-specific employee attributes',
      'Employee lifecycle tracking from onboarding through offboarding',
      'Profile photo management with automatic avatar generation',
      'Multi-country support with country-specific field configurations',
    ],
    screenshotKey: 'people/overview',
  },

  workflows: [
    {
      id: 'add-new-employee',
      title: 'Adding a New Employee',
      description:
        'Create a new employee record in Tempo with all required personal, job, and organizational information. This is the standard workflow for onboarding a new hire after their offer has been accepted.',
      estimatedTime: '8 minutes',
      roles: ['owner', 'admin', 'hrbp'],
      prerequisites: [
        'Department must already exist in the system',
        'Reporting manager must have an active employee record',
        'Job title and level band must be configured in Settings > Job Architecture',
      ],
      steps: [
        {
          number: 1,
          title: 'Navigate to the People module',
          description:
            'Click "People" in the left sidebar to open the employee directory. You will see the full list of active employees in a table view.',
          screenshotKey: 'people/add-employee-step-1',
        },
        {
          number: 2,
          title: 'Click "Add Employee"',
          description:
            'Click the "Add Employee" button in the top-right corner of the directory. A multi-step form wizard opens in a slide-over panel.',
          screenshotKey: 'people/add-employee-step-2',
        },
        {
          number: 3,
          title: 'Enter personal information',
          description:
            'Fill in the employee\'s full name, email address, phone number, and date of birth. The email address must be unique across your organization. Optionally upload a profile photo or let Tempo generate an avatar from their initials.',
          screenshotKey: 'people/add-employee-step-3',
          tip: 'The email address will be used as the employee\'s login credential if you enable self-service access.',
        },
        {
          number: 4,
          title: 'Set job details',
          description:
            'Select the employee\'s department, job title, level band, and employment type (full-time, part-time, contractor). Set the start date and probation end date if applicable. Choose their work location (office, remote, hybrid).',
          screenshotKey: 'people/add-employee-step-4',
        },
        {
          number: 5,
          title: 'Assign reporting manager',
          description:
            'Search for and select the employee\'s direct reporting manager. This determines their position in the org chart and controls who receives notifications about their leave requests, performance reviews, and approvals.',
          screenshotKey: 'people/add-employee-step-5',
        },
        {
          number: 6,
          title: 'Configure compensation',
          description:
            'Enter the base salary amount and currency. Optionally add allowances, bonuses, or equity grants. Compensation data is stored in cents for precision (e.g., $75,000 is stored as 7500000). Set the pay frequency (monthly, bi-weekly, weekly).',
          screenshotKey: 'people/add-employee-step-6',
          tip: 'Compensation details are only visible to users with the Owner, Admin, or HRBP role.',
        },
        {
          number: 7,
          title: 'Set country and compliance fields',
          description:
            'Select the employee\'s country of employment. Country-specific fields will appear automatically, such as tax identification number, national insurance number, or social security number. These fields are required for payroll processing.',
          screenshotKey: 'people/add-employee-step-7',
        },
        {
          number: 8,
          title: 'Review and submit',
          description:
            'Review all entered information on the summary page. Click "Create Employee" to finalize the record. The employee will appear in the directory immediately and will receive a welcome email if email notifications are enabled.',
          screenshotKey: 'people/add-employee-step-8',
        },
      ],
    },
    {
      id: 'view-org-chart',
      title: 'Viewing and Navigating the Org Chart',
      description:
        'Use the interactive org chart to visualize your organization\'s reporting structure, explore team hierarchies, and understand span of control.',
      estimatedTime: '3 minutes',
      roles: ['owner', 'admin', 'hrbp', 'manager', 'employee'],
      steps: [
        {
          number: 1,
          title: 'Open the org chart view',
          description:
            'In the People module, click the "Org Chart" tab at the top of the page. The chart renders with the CEO or top-level leader at the root, expanding downward through the reporting hierarchy.',
          screenshotKey: 'people/org-chart-step-1',
        },
        {
          number: 2,
          title: 'Navigate the hierarchy',
          description:
            'Click the expand/collapse toggle on any node to show or hide their direct reports. Use the zoom controls in the bottom-right corner to zoom in and out. Click and drag the canvas to pan across the chart.',
          screenshotKey: 'people/org-chart-step-2',
        },
        {
          number: 3,
          title: 'Search for a person',
          description:
            'Use the search bar at the top of the org chart to find a specific employee. Selecting a result will center the chart on that person and highlight their reporting chain up to the root.',
          screenshotKey: 'people/org-chart-step-3',
          tip: 'Press Cmd+F (Ctrl+F) to quickly focus the search bar from anywhere on the org chart.',
        },
        {
          number: 4,
          title: 'View node details',
          description:
            'Hover over any person\'s card in the org chart to see a tooltip with their job title, department, location, and number of direct reports. Click the card to navigate to their full employee profile.',
          screenshotKey: 'people/org-chart-step-4',
        },
        {
          number: 5,
          title: 'Filter by department',
          description:
            'Use the department filter dropdown to highlight a specific department\'s employees in the org chart. Non-matching employees are dimmed, making it easy to see how a department is distributed across the hierarchy.',
          screenshotKey: 'people/org-chart-step-5',
        },
      ],
    },
    {
      id: 'bulk-import-employees',
      title: 'Bulk Importing Employees via CSV',
      description:
        'Import multiple employee records at once using a CSV file. Ideal for initial platform setup, migrating from another HRIS, or onboarding a large cohort.',
      estimatedTime: '15 minutes',
      roles: ['owner', 'admin'],
      prerequisites: [
        'CSV file prepared with required columns (see template)',
        'All departments referenced in the CSV must exist in Tempo',
        'Reporting managers referenced by email must already have active records',
      ],
      steps: [
        {
          number: 1,
          title: 'Download the CSV template',
          description:
            'In the People module, click "Import" > "Download Template". This generates a CSV file with all required and optional column headers pre-filled, including notes on expected formats (date formats, currency codes, country codes).',
          screenshotKey: 'people/bulk-import-step-1',
          tip: 'The template includes example rows showing the correct format for each field. Delete the example rows before importing.',
        },
        {
          number: 2,
          title: 'Prepare your data',
          description:
            'Open the template in a spreadsheet application. Fill in one row per employee. Required columns are: full_name, email, department, job_title, level, country, start_date, employment_type, and manager_email. Save as CSV (UTF-8).',
          screenshotKey: 'people/bulk-import-step-2',
        },
        {
          number: 3,
          title: 'Upload the CSV file',
          description:
            'Click "Import" > "Upload CSV" and select your prepared file. Tempo will parse the file and display a preview of the first 10 rows with column mapping verification.',
          screenshotKey: 'people/bulk-import-step-3',
        },
        {
          number: 4,
          title: 'Map columns',
          description:
            'If your CSV uses non-standard column headers, use the column mapping interface to match each CSV column to the corresponding Tempo field. Pre-matched columns are shown in green; unmapped columns are highlighted in amber.',
          screenshotKey: 'people/bulk-import-step-4',
        },
        {
          number: 5,
          title: 'Review validation results',
          description:
            'Tempo validates every row and displays errors grouped by type: missing required fields, invalid email formats, unknown departments, duplicate emails, and invalid date formats. Fix errors in your CSV and re-upload, or proceed with valid rows only.',
          screenshotKey: 'people/bulk-import-step-5',
        },
        {
          number: 6,
          title: 'Confirm and import',
          description:
            'Review the import summary showing the total rows, valid rows, and rows with errors. Click "Import Valid Rows" to create the employee records. A progress bar tracks the import. Once complete, a downloadable report lists all created records and any skipped rows.',
          screenshotKey: 'people/bulk-import-step-6',
        },
      ],
    },
    {
      id: 'edit-employee-profile',
      title: 'Editing an Employee Profile',
      description:
        'Update an employee\'s personal information, job details, compensation, or organizational assignment.',
      estimatedTime: '3 minutes',
      roles: ['owner', 'admin', 'hrbp'],
      steps: [
        {
          number: 1,
          title: 'Find the employee',
          description:
            'Use the directory search bar or browse the directory table to locate the employee. You can search by name, email, employee ID, or department. Click the employee\'s row to open their profile.',
          screenshotKey: 'people/edit-profile-step-1',
        },
        {
          number: 2,
          title: 'Navigate to the relevant section',
          description:
            'The employee profile has tabbed sections: Personal, Job, Compensation, Documents, and History. Click the tab corresponding to the information you need to update.',
          screenshotKey: 'people/edit-profile-step-2',
        },
        {
          number: 3,
          title: 'Edit the fields',
          description:
            'Click the "Edit" button in the section header to enable editing. Modify the necessary fields. Required fields are marked with an asterisk. Some fields (like employee ID) are read-only after creation.',
          screenshotKey: 'people/edit-profile-step-3',
          tip: 'All profile changes are recorded in the History tab with a timestamp and the name of the user who made the change.',
        },
        {
          number: 4,
          title: 'Save changes',
          description:
            'Click "Save Changes" to persist the updates. A confirmation toast will appear. If the change affects payroll (e.g., salary or bank details), a secondary confirmation dialog will explain downstream impacts.',
          screenshotKey: 'people/edit-profile-step-4',
        },
      ],
    },
    {
      id: 'search-filter-employees',
      title: 'Searching and Filtering the Employee Directory',
      description:
        'Use the directory\'s powerful search and filtering capabilities to quickly find employees or create filtered views for reporting and analysis.',
      estimatedTime: '2 minutes',
      roles: ['owner', 'admin', 'hrbp', 'manager', 'employee'],
      steps: [
        {
          number: 1,
          title: 'Use the global search bar',
          description:
            'Type a name, email, job title, or employee ID into the search bar at the top of the directory. Results update in real-time as you type, with matched text highlighted.',
          screenshotKey: 'people/search-filter-step-1',
        },
        {
          number: 2,
          title: 'Apply column filters',
          description:
            'Click the filter icon on any column header to open filter options. For text columns, choose "contains", "equals", or "starts with". For date columns, select a date range. For select columns (department, level, country), check the values you want to include.',
          screenshotKey: 'people/search-filter-step-2',
        },
        {
          number: 3,
          title: 'Combine multiple filters',
          description:
            'Apply filters on multiple columns simultaneously for precise results. For example, filter by Department = "Engineering" AND Level = "Senior" AND Country = "Ghana" to find all senior engineers in Ghana. Active filters are displayed as removable chips above the table.',
          screenshotKey: 'people/search-filter-step-3',
          tip: 'Save frequently used filter combinations as "Saved Views" by clicking the bookmark icon next to the filter chips.',
        },
        {
          number: 4,
          title: 'Sort results',
          description:
            'Click any column header to sort the directory by that column. Click again to toggle between ascending and descending order. A sort indicator arrow shows the current sort direction.',
          screenshotKey: 'people/search-filter-step-4',
        },
        {
          number: 5,
          title: 'Export filtered results',
          description:
            'With filters active, click "Export" to download only the filtered subset of employees as a CSV file. This is useful for creating ad-hoc reports or sharing specific lists with stakeholders.',
          screenshotKey: 'people/search-filter-step-5',
        },
      ],
    },
  ],

  faqs: [
    {
      question: 'What fields are required when creating a new employee?',
      answer:
        'The minimum required fields are: full name, email address, department, job title, level, country, start date, and employment type. Additional fields such as compensation, tax ID, and bank details are required before the employee can be included in a payroll run.',
    },
    {
      question: 'Can employees update their own profiles?',
      answer:
        'Yes. Employees with self-service access can update their personal information (phone number, emergency contact, address) and upload a profile photo. They cannot modify job details, compensation, or organizational assignments. Changes to sensitive fields like bank details require Admin or HRBP approval.',
    },
    {
      question: 'How does the org chart handle dotted-line relationships?',
      answer:
        'The org chart displays the primary solid-line reporting relationship by default. Dotted-line (secondary) relationships can be configured on the employee profile under the Job tab. Toggle "Show Dotted Lines" on the org chart to display secondary reporting relationships as dashed lines.',
    },
    {
      question: 'What happens to an employee\'s data when they are terminated?',
      answer:
        'Terminated employees are moved to an "Inactive" status and hidden from the default directory view. Their records are retained for compliance and audit purposes. You can view inactive employees by toggling the "Show Inactive" filter. Payroll and benefits records are preserved permanently.',
    },
    {
      question: 'What CSV format does the bulk import accept?',
      answer:
        'Tempo accepts UTF-8 encoded CSV files with comma delimiters. Dates must be in ISO 8601 format (YYYY-MM-DD). Currency amounts should be in the major unit (e.g., 75000 for $75,000 -- Tempo converts to cents internally). Country codes should be ISO 3166-1 alpha-2 (e.g., GH, ZA, NG). Download the template for a complete reference.',
    },
    {
      question: 'Can I undo a bulk import?',
      answer:
        'Yes, within 24 hours of a bulk import. Navigate to People > Import > Import History, find the import batch, and click "Rollback". This will delete all records created in that batch. After 24 hours, records must be deleted individually.',
    },
    {
      question: 'How do I transfer an employee to a different department?',
      answer:
        'Open the employee\'s profile, go to the Job tab, click Edit, and change the Department field. You can optionally update the job title, level, and reporting manager at the same time. The transfer is effective immediately and is recorded in the employee\'s History tab.',
    },
    {
      question: 'Does the People module support custom fields?',
      answer:
        'Yes. Admins can create custom fields in Settings > People > Custom Fields. Supported field types include text, number, date, dropdown, multi-select, and file upload. Custom fields appear on the employee profile and can be included in directory filters and CSV exports.',
    },
  ],

  tips: [
    'Use the keyboard shortcut "/" from the People directory to focus the search bar instantly.',
    'Bookmark frequently used filter combinations as Saved Views for one-click access.',
    'When importing employees in bulk, start with a small test file of 5-10 records to verify column mapping before importing the full dataset.',
    'Enable "Change Notifications" in Settings to receive alerts when employee records are modified by other administrators.',
    'Use the org chart\'s "Span of Control" overlay to identify managers with unusually large or small teams.',
    'Export the full directory regularly as a backup, especially before making large-scale changes.',
    'Tag employees with custom fields like "Flight Risk" or "High Potential" for talent planning -- these can be filtered in the directory.',
  ],

  relatedModules: ['dashboard', 'payroll', 'performance', 'benefits', 'recruiting', 'offboarding'],

  permissions: [
    {
      role: 'Owner',
      capabilities: [
        'View, create, edit, and delete all employee records',
        'Access and modify compensation data for any employee',
        'Perform bulk imports and bulk updates',
        'Configure custom fields and directory settings',
        'Export the full employee directory',
        'View and modify the org chart structure',
        'Access terminated employee records',
      ],
    },
    {
      role: 'Admin',
      capabilities: [
        'View, create, edit, and delete all employee records',
        'Access and modify compensation data for any employee',
        'Perform bulk imports and bulk updates',
        'Configure custom fields and directory settings',
        'Export the full employee directory',
        'View and modify the org chart structure',
      ],
    },
    {
      role: 'HRBP',
      capabilities: [
        'View and edit employee records within assigned departments',
        'Access compensation data for assigned employees',
        'Create new employee records within assigned departments',
        'Export directory for assigned departments',
        'View org chart with full navigation',
      ],
    },
    {
      role: 'Manager',
      capabilities: [
        'View profiles of direct and indirect reports',
        'View limited job and compensation data for direct reports',
        'Navigate the full org chart (read-only)',
        'Search and filter the employee directory (limited fields)',
      ],
    },
    {
      role: 'Employee',
      capabilities: [
        'View and edit own personal profile (limited fields)',
        'View colleague profiles (name, title, department, contact only)',
        'Navigate the org chart (read-only)',
        'Search the employee directory by name and department',
      ],
    },
  ],
}

export default people
