import type { ModuleDoc } from '../../types'

const payroll: ModuleDoc = {
  slug: 'payroll',
  title: 'Payroll',
  subtitle: 'End-to-end payroll processing with multi-country support, tax configuration, and approval workflows',
  icon: 'Wallet',
  group: 'operations',
  lastUpdated: '2026-03-13',
  version: '1.0',

  overview: {
    description:
      'The Payroll module handles the complete payroll lifecycle from pay run creation through approval and disbursement. It supports multi-country payroll processing with localized tax calculations, statutory deductions, and compliance reporting. The module integrates tightly with the People, Benefits, Time & Attendance, and Expense modules to automatically pull in salary data, benefit deductions, overtime hours, and approved reimbursements. Built-in approval workflows ensure every pay run is reviewed before processing, and comprehensive audit logs track every change for regulatory compliance.',
    keyFeatures: [
      'Automated pay run creation with configurable pay periods (monthly, bi-weekly, weekly)',
      'Multi-country payroll engine supporting 20+ countries with localized tax calculations',
      'Real-time gross-to-net calculation preview before approval',
      'Multi-step approval workflow with configurable approval chains',
      'Automatic integration with Benefits for premium deductions',
      'Automatic integration with Time & Attendance for overtime and absence deductions',
      'Bank file generation in country-specific formats (BACS, ACH, SEPA, local formats)',
      'Comprehensive payroll analytics with period-over-period comparisons',
      'Statutory report generation for tax authorities (P60, W-2, IRP5, etc.)',
      'Payslip generation with employee self-service access',
      'Off-cycle payroll runs for bonuses, corrections, and termination payments',
      'Multi-currency support with configurable exchange rate sources',
    ],
    screenshotKey: 'payroll/overview',
  },

  workflows: [
    {
      id: 'run-payroll-cycle',
      title: 'Running a Payroll Cycle',
      description:
        'The complete end-to-end process for preparing, reviewing, approving, and finalizing a standard payroll run. This workflow covers the typical monthly payroll cycle from initiation to disbursement.',
      estimatedTime: '30 minutes',
      roles: ['owner', 'admin'],
      prerequisites: [
        'All employees included in the pay run must have complete profiles with bank details',
        'Tax configurations must be set up for each country in the pay run',
        'Benefit plans and deduction rules must be configured in the Benefits module',
        'Time & Attendance records for the pay period must be finalized and approved',
      ],
      steps: [
        {
          number: 1,
          title: 'Navigate to the Payroll module',
          description:
            'Click "Payroll" in the left sidebar under the Operations section. The Payroll dashboard displays an overview of recent pay runs, upcoming scheduled runs, and summary statistics.',
          screenshotKey: 'payroll/run-payroll-step-1',
        },
        {
          number: 2,
          title: 'Initiate a new pay run',
          description:
            'Click "New Pay Run" in the top-right corner. Select the pay group (e.g., "Ghana - Monthly", "South Africa - Monthly"), the pay period (start and end dates), and the payment date. Tempo pre-populates defaults based on your payroll schedule configuration.',
          screenshotKey: 'payroll/run-payroll-step-2',
          tip: 'If you have multiple countries, you will need to create a separate pay run for each country due to different tax jurisdictions.',
        },
        {
          number: 3,
          title: 'Review the employee roster',
          description:
            'Tempo automatically includes all active employees belonging to the selected pay group. Review the roster to verify inclusions and exclusions. Employees on unpaid leave, those with termination dates before the period end, or those missing bank details are flagged with warning icons.',
          screenshotKey: 'payroll/run-payroll-step-3',
        },
        {
          number: 4,
          title: 'Review and adjust earnings',
          description:
            'The earnings table shows base salary, allowances, overtime (pulled from Time & Attendance), bonuses, and expense reimbursements for each employee. Click any cell to view the calculation breakdown. Use the "Add Adjustment" button to add one-time earnings or deductions for specific employees.',
          screenshotKey: 'payroll/run-payroll-step-4',
          tip: 'All amounts are displayed in the local currency of the pay group. Hover over any amount to see the value in your organization\'s base currency.',
        },
        {
          number: 5,
          title: 'Review deductions',
          description:
            'The deductions column shows statutory deductions (income tax, social security, pension contributions) and voluntary deductions (benefit plan premiums, loan repayments, union dues). Tax calculations are performed automatically based on the employee\'s country, tax code, and year-to-date earnings.',
          screenshotKey: 'payroll/run-payroll-step-5',
        },
        {
          number: 6,
          title: 'Review the gross-to-net summary',
          description:
            'Click "Calculate" to generate the gross-to-net summary for all employees. This summary shows total gross pay, total deductions, employer contributions (pension, insurance), and net pay for the entire pay run. A variance column highlights changes from the previous period.',
          screenshotKey: 'payroll/run-payroll-step-6',
        },
        {
          number: 7,
          title: 'Resolve warnings and errors',
          description:
            'The validation panel lists any issues that must be resolved before the pay run can be submitted for approval. Common issues include: missing bank details, employees exceeding tax bracket thresholds, negative net pay, and benefit enrollment mismatches. Click each issue to navigate to the affected record.',
          screenshotKey: 'payroll/run-payroll-step-7',
        },
        {
          number: 8,
          title: 'Submit for approval',
          description:
            'Once all warnings are resolved, click "Submit for Approval". The pay run enters the approval workflow. Depending on your configuration, it may require approval from the Finance Manager, HR Director, or both. Approvers receive an in-app notification and email.',
          screenshotKey: 'payroll/run-payroll-step-8',
        },
        {
          number: 9,
          title: 'Approve the pay run',
          description:
            'Approvers review the pay run summary, spot-check individual employee calculations, and either approve or reject with comments. If rejected, the pay run returns to draft status for corrections. Once all required approvals are obtained, the pay run status changes to "Approved".',
          screenshotKey: 'payroll/run-payroll-step-9',
          tip: 'Approvers can download a detailed PDF report of the pay run for offline review before approving.',
        },
        {
          number: 10,
          title: 'Finalize and process payment',
          description:
            'Click "Finalize" on the approved pay run. Tempo generates bank payment files in the appropriate format, creates payslips for each employee, and posts journal entries to the accounting integration. The pay run status changes to "Finalized" and employee payslips become available in the My Payslips section.',
          screenshotKey: 'payroll/run-payroll-step-10',
        },
      ],
    },
    {
      id: 'review-before-approval',
      title: 'Reviewing Payroll Before Approval',
      description:
        'A detailed guide for payroll approvers on how to review a submitted pay run, validate calculations, and identify potential errors before giving approval.',
      estimatedTime: '15 minutes',
      roles: ['owner', 'admin'],
      steps: [
        {
          number: 1,
          title: 'Open the pending pay run',
          description:
            'Navigate to Payroll and click the pay run with status "Pending Approval". The approver view opens, showing a summary dashboard with key metrics: total headcount, total gross, total net, and variance from previous period.',
          screenshotKey: 'payroll/review-approval-step-1',
        },
        {
          number: 2,
          title: 'Check the variance report',
          description:
            'Click "Variance Report" to see a side-by-side comparison with the previous pay period. Large variances (greater than 10% for any individual employee) are highlighted in amber. Investigate each variance to confirm it is expected (e.g., new hire, salary change, bonus).',
          screenshotKey: 'payroll/review-approval-step-2',
          tip: 'Sort the variance report by absolute change amount to quickly find the largest differences.',
        },
        {
          number: 3,
          title: 'Spot-check individual payslips',
          description:
            'Click on 3-5 employees to review their individual payslip details. Verify that gross pay matches their salary record, deductions are correctly calculated, and any one-time adjustments are properly documented.',
          screenshotKey: 'payroll/review-approval-step-3',
        },
        {
          number: 4,
          title: 'Verify statutory deductions',
          description:
            'Open the "Tax Summary" tab to see aggregated statutory deductions by type: income tax, social security, pension, and other country-specific deductions. Compare totals against the expected range based on your workforce composition.',
          screenshotKey: 'payroll/review-approval-step-4',
        },
        {
          number: 5,
          title: 'Approve or reject',
          description:
            'If the pay run passes review, click "Approve" and add an optional comment. If issues are found, click "Reject" and provide detailed comments explaining what needs to be corrected. The payroll administrator will receive a notification with your feedback.',
          screenshotKey: 'payroll/review-approval-step-5',
        },
      ],
    },
    {
      id: 'manage-tax-configs',
      title: 'Managing Tax Configurations',
      description:
        'Set up and maintain country-specific tax tables, brackets, and statutory contribution rates that power automatic payroll calculations.',
      estimatedTime: '10 minutes',
      roles: ['owner', 'admin'],
      prerequisites: [
        'Access to current tax bracket tables for the relevant country',
        'Knowledge of statutory contribution rates (social security, pension, etc.)',
      ],
      steps: [
        {
          number: 1,
          title: 'Open tax configuration',
          description:
            'Navigate to Payroll > Settings > Tax Configuration. The page displays a list of configured countries with their tax year, last update date, and number of employees in each jurisdiction.',
          screenshotKey: 'payroll/tax-config-step-1',
        },
        {
          number: 2,
          title: 'Select a country',
          description:
            'Click on a country to open its tax configuration details. The configuration is organized into sections: Income Tax Brackets, Social Security, Pension, and Country-Specific Deductions.',
          screenshotKey: 'payroll/tax-config-step-2',
        },
        {
          number: 3,
          title: 'Update income tax brackets',
          description:
            'The income tax section shows a table of tax brackets with lower bound, upper bound, and marginal rate for each bracket. Click "Edit" to modify rates. Add new brackets with the "+ Add Bracket" button. Changes take effect for the next pay run -- they do not retroactively affect finalized pay runs.',
          screenshotKey: 'payroll/tax-config-step-3',
          tip: 'Tempo includes pre-configured tax tables for common jurisdictions. Check with your tax advisor before modifying default rates.',
        },
        {
          number: 4,
          title: 'Configure statutory contributions',
          description:
            'Update employer and employee contribution rates for social security, pension, and health insurance. Specify whether contributions are percentage-based or flat amounts, and set annual caps where applicable.',
          screenshotKey: 'payroll/tax-config-step-4',
        },
        {
          number: 5,
          title: 'Test the configuration',
          description:
            'Use the "Test Calculator" feature to input a sample gross salary and verify the tax and deduction calculations match your expectations. This lets you validate changes before they affect real payroll runs.',
          screenshotKey: 'payroll/tax-config-step-5',
        },
        {
          number: 6,
          title: 'Save and audit',
          description:
            'Click "Save Configuration". All tax configuration changes are logged in the audit trail with a timestamp, the previous values, and the user who made the change.',
          screenshotKey: 'payroll/tax-config-step-6',
        },
      ],
    },
    {
      id: 'view-payroll-analytics',
      title: 'Viewing Payroll Analytics',
      description:
        'Use the Payroll Analytics dashboard to track compensation trends, cost distributions, and period-over-period changes across your organization.',
      estimatedTime: '5 minutes',
      roles: ['owner', 'admin', 'hrbp'],
      steps: [
        {
          number: 1,
          title: 'Open Payroll Analytics',
          description:
            'In the Payroll module, click the "Analytics" tab. The analytics dashboard loads with pre-built visualizations showing payroll cost trends, department-level breakdowns, and statutory contribution summaries.',
          screenshotKey: 'payroll/analytics-step-1',
        },
        {
          number: 2,
          title: 'Select the time range',
          description:
            'Use the date range picker to select the analysis period. Presets include "Last 3 months", "Last 6 months", "Year to Date", and "Last 12 months". Custom date ranges are also supported.',
          screenshotKey: 'payroll/analytics-step-2',
        },
        {
          number: 3,
          title: 'Analyze cost distribution',
          description:
            'The cost distribution chart breaks down total payroll spend by category: base salaries, allowances, overtime, bonuses, employer contributions, and benefit costs. Click any segment to drill down into department-level detail.',
          screenshotKey: 'payroll/analytics-step-3',
        },
        {
          number: 4,
          title: 'Compare periods',
          description:
            'Enable the "Compare" toggle to overlay two periods on the same chart. This reveals growth trends, seasonal patterns, and the impact of headcount changes on total payroll cost.',
          screenshotKey: 'payroll/analytics-step-4',
          tip: 'Export any chart as PNG or the underlying data as CSV using the download icon in the chart header.',
        },
      ],
    },
    {
      id: 'handle-missing-bank-details',
      title: 'Handling Missing Bank Details',
      description:
        'Identify and resolve employees with missing or invalid bank account information before processing a pay run.',
      estimatedTime: '10 minutes',
      roles: ['owner', 'admin', 'hrbp'],
      steps: [
        {
          number: 1,
          title: 'Identify affected employees',
          description:
            'When creating or calculating a pay run, employees with missing bank details are flagged with a red warning icon. Click "View All Warnings" to see the complete list of affected employees grouped by issue type.',
          screenshotKey: 'payroll/missing-bank-step-1',
        },
        {
          number: 2,
          title: 'Notify employees',
          description:
            'Click "Send Reminder" to send a bulk email notification to all affected employees asking them to update their bank details via the self-service portal. The email includes a direct link to the bank details form.',
          screenshotKey: 'payroll/missing-bank-step-2',
          tip: 'Enable the "Auto-remind" setting in Payroll > Settings to automatically send reminders 5 days before each scheduled pay run.',
        },
        {
          number: 3,
          title: 'Manually enter bank details',
          description:
            'For employees who cannot update their own details, click the employee\'s name to open their profile. Navigate to the "Compensation" tab and scroll to the Bank Details section. Enter the account holder name, bank name, account number, and routing/sort code.',
          screenshotKey: 'payroll/missing-bank-step-3',
        },
        {
          number: 4,
          title: 'Exclude from current run if unresolved',
          description:
            'If bank details cannot be obtained in time, uncheck the employee from the pay run roster. They will be excluded from this pay run and can be paid in an off-cycle run once their bank details are on file.',
          screenshotKey: 'payroll/missing-bank-step-4',
        },
        {
          number: 5,
          title: 'Run an off-cycle pay run',
          description:
            'Once the employee\'s bank details are updated, create an off-cycle pay run by clicking "New Pay Run" > "Off-Cycle". Select only the affected employee(s) and process the payment for the missed period.',
          screenshotKey: 'payroll/missing-bank-step-5',
        },
      ],
    },
  ],

  faqs: [
    {
      question: 'How does Tempo handle multi-country payroll with different tax jurisdictions?',
      answer:
        'Each country has its own pay group and tax configuration. Pay runs are created per country/pay group, ensuring that country-specific tax tables, statutory deductions, and compliance rules are applied correctly. Employees are automatically assigned to pay groups based on their country of employment in their People profile.',
    },
    {
      question: 'Can I process payroll in multiple currencies?',
      answer:
        'Yes. Each pay group has a designated currency. Employees in that pay group are paid in the local currency. Tempo supports configurable exchange rate sources (manual entry, ECB, or custom API) for consolidated reporting in your base currency. Exchange rates can be locked at the time of pay run creation.',
    },
    {
      question: 'What happens if I need to correct a finalized pay run?',
      answer:
        'Finalized pay runs cannot be directly edited. To make corrections, create an off-cycle pay run with adjustments. For overpayments, add a negative adjustment line. For underpayments, add a positive adjustment line. All adjustments are tracked in the audit log and appear on the employee\'s payslip for the correction period.',
    },
    {
      question: 'How many approvals are required for a pay run?',
      answer:
        'The number of required approvals is configurable in Payroll > Settings > Approval Workflow. The default is one approval (typically Finance Manager). You can add up to three approval levels (e.g., HR Manager, Finance Director, CFO). All approvers must approve before the pay run can be finalized.',
    },
    {
      question: 'Does Tempo generate tax filing reports?',
      answer:
        'Yes. Tempo generates country-specific statutory reports including P60 and FPS for the UK, W-2 and 941 for the US, IRP5 and EMP201 for South Africa, and GRA reports for Ghana. Reports are available in Payroll > Reports and can be downloaded in PDF or the format required by the tax authority.',
    },
    {
      question: 'How are employee benefits deducted from payroll?',
      answer:
        'Benefit deductions are pulled automatically from the Benefits module. When an employee enrolls in a benefit plan, the premium amount and frequency are stored in Benefits. During payroll calculation, Tempo queries active enrollments and adds the appropriate deduction lines. If an enrollment starts or ends mid-period, the deduction is prorated.',
    },
    {
      question: 'Can contractors be included in payroll runs?',
      answer:
        'Contractors can be included in pay runs if they are set up as employees with employment type "Contractor" in the People module. However, their tax treatment differs -- contractor payments typically do not have statutory deductions applied. Ensure the correct tax code is assigned in the contractor\'s profile.',
    },
    {
      question: 'What bank file formats does Tempo support?',
      answer:
        'Tempo generates bank payment files in the format required by your banking partner. Supported formats include BACS (UK), ACH/NACHA (US), SEPA (EU), SWIFT MT103 (international), and local formats for Ghana (GhIPSS), Nigeria (NIBSS), South Africa (Bankserv), and Kenya (RTGS/EFT). The format is configured per pay group.',
    },
  ],

  tips: [
    'Schedule pay runs 3-5 business days before the payment date to allow time for review, approval, and bank processing.',
    'Use the variance report as your primary review tool -- it highlights every change from the previous period, making anomalies easy to spot.',
    'Set up the "Auto-remind" feature to automatically notify employees with missing bank details before each scheduled pay run.',
    'Run a "Dry Run" (calculate without submitting) after each significant change to tax configurations to verify the impact before the next real pay run.',
    'Enable two-level approval for pay runs exceeding a threshold amount (e.g., organizations with 100+ employees) as a financial control.',
    'Download the gross-to-net PDF report before approving -- it provides a permanent auditable record of the calculations reviewed.',
    'Use off-cycle pay runs for bonus payments rather than adding them to the regular run, as this simplifies tax reporting and reconciliation.',
  ],

  relatedModules: ['people', 'benefits', 'time-attendance', 'expense', 'compensation', 'analytics'],

  permissions: [
    {
      role: 'Owner',
      capabilities: [
        'Create, edit, submit, approve, and finalize pay runs',
        'Configure tax tables, pay groups, and approval workflows',
        'Access payroll analytics and reports for all pay groups',
        'Generate and download bank payment files',
        'Create off-cycle pay runs',
        'View and modify payroll settings',
        'Access audit logs for all payroll operations',
      ],
    },
    {
      role: 'Admin',
      capabilities: [
        'Create, edit, submit, approve, and finalize pay runs',
        'Configure tax tables, pay groups, and approval workflows',
        'Access payroll analytics and reports for all pay groups',
        'Generate and download bank payment files',
        'Create off-cycle pay runs',
        'View and modify payroll settings',
      ],
    },
    {
      role: 'HRBP',
      capabilities: [
        'View pay runs for assigned departments (read-only)',
        'View payroll analytics for assigned departments',
        'View individual employee payslips for assigned employees',
        'Generate reports for assigned departments',
      ],
    },
    {
      role: 'Manager',
      capabilities: [
        'View payroll summary for direct reports (aggregate only, no individual amounts)',
        'View team payroll cost in the dashboard widget',
      ],
    },
    {
      role: 'Employee',
      capabilities: [
        'View and download own payslips via My Payslips section',
        'View own year-to-date earnings and tax summary',
        'Update own bank details (subject to approval)',
      ],
    },
  ],
}

export default payroll
