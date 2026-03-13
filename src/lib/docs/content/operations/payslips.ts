import type { ModuleDoc } from '../../types'

const payslips: ModuleDoc = {
  slug: 'payslips',
  title: 'Payslips',
  subtitle: 'Employee payslip viewing, PDF download, pay history, and earnings breakdown',
  icon: 'FileText',
  group: 'operations',
  lastUpdated: '2026-03-13',
  version: '1.0',

  overview: {
    description:
      'The Payslips module gives employees secure, self-service access to their pay statements. Each payslip provides a detailed breakdown of gross earnings, deductions, taxes, and net pay. Employees can view current and historical payslips, download PDF copies, and compare pay across periods. The module reduces HR workload by eliminating manual payslip distribution and provides a clear audit trail of all pay statement access.',
    keyFeatures: [
      'Chronological payslip listing with quick-access date filters',
      'Detailed earnings breakdown: base pay, overtime, bonuses, commissions, and allowances',
      'Deductions summary: taxes, social security, health insurance, retirement contributions, and garnishments',
      'PDF download for individual payslips or bulk download for a date range',
      'Year-to-date (YTD) totals updated on every payslip',
      'Multi-currency display for employees paid in local currency with USD equivalent',
      'Comparison view to see changes between consecutive pay periods',
      'Secure access with role-based visibility — employees see only their own payslips',
    ],
    screenshotKey: 'payslips/overview',
  },

  workflows: [
    {
      id: 'view-payslip',
      title: 'Viewing Your Current Payslip',
      description:
        'Access your most recent payslip to review earnings, deductions, and net pay for the current pay period.',
      estimatedTime: '2 minutes',
      roles: ['employee'],
      steps: [
        {
          number: 1,
          title: 'Navigate to Payslips',
          description:
            'Click "Payslips" in the left sidebar under Operations. The module opens to your most recent payslip by default.',
          screenshotKey: 'payslips/view-step-1',
        },
        {
          number: 2,
          title: 'Review the earnings section',
          description:
            'The top section displays your gross earnings broken down by component: base salary, overtime hours, bonuses, commissions, and any taxable allowances. Each line shows the amount and the calculation basis (hours, rate, or lump sum).',
          screenshotKey: 'payslips/view-step-2',
        },
        {
          number: 3,
          title: 'Review deductions',
          description:
            'The deductions section lists all withholdings: federal and state income tax, social security, Medicare, health insurance premiums, retirement plan contributions, and any voluntary deductions or garnishments.',
          screenshotKey: 'payslips/view-step-3',
          tip: 'If a deduction looks unfamiliar, click the information icon next to it for an explanation of what it covers.',
        },
        {
          number: 4,
          title: 'Check net pay and YTD totals',
          description:
            'The bottom section shows your net pay (take-home amount), payment method (direct deposit or check), and year-to-date totals for gross earnings, total taxes, total deductions, and net pay.',
          screenshotKey: 'payslips/view-step-4',
        },
      ],
    },
    {
      id: 'download-payslip',
      title: 'Downloading Payslip PDFs',
      description:
        'Download individual payslips or a batch of payslips as PDF files for personal records, tax filing, or third-party verification.',
      estimatedTime: '2 minutes',
      roles: ['employee'],
      steps: [
        {
          number: 1,
          title: 'Select the payslip to download',
          description:
            'Navigate to the payslip you want to download. You can use the date picker or scroll through the chronological list to find a specific pay period.',
          screenshotKey: 'payslips/download-step-1',
        },
        {
          number: 2,
          title: 'Click the download button',
          description:
            'Click the "Download PDF" button in the top-right corner of the payslip view. The PDF is generated with your company branding, all earnings and deduction details, and a timestamp.',
          screenshotKey: 'payslips/download-step-2',
        },
        {
          number: 3,
          title: 'Bulk download for a date range',
          description:
            'To download multiple payslips at once, click "Bulk Download" from the payslip list view. Select a date range (e.g., entire calendar year) and click "Generate." A ZIP file containing individual PDFs for each pay period is created.',
          screenshotKey: 'payslips/download-step-3',
          tip: 'Use bulk download at tax time to get all payslips for the tax year in one step.',
        },
        {
          number: 4,
          title: 'Verify the download',
          description:
            'Open the downloaded PDF to verify the content is correct and legible. The PDF includes a security watermark and digital signature for authenticity verification.',
          screenshotKey: 'payslips/download-step-4',
        },
      ],
    },
    {
      id: 'compare-payslips',
      title: 'Comparing Pay Across Periods',
      description:
        'Use the comparison view to understand how your pay has changed between two pay periods.',
      estimatedTime: '3 minutes',
      roles: ['employee'],
      steps: [
        {
          number: 1,
          title: 'Open the comparison view',
          description:
            'From the payslip list, click "Compare" or select two payslips using their checkboxes. The comparison view opens showing both payslips side by side.',
          screenshotKey: 'payslips/compare-step-1',
        },
        {
          number: 2,
          title: 'Review line-by-line differences',
          description:
            'Each earnings and deduction line shows the values from both periods with the difference highlighted. Increases appear in green; decreases appear in red.',
          screenshotKey: 'payslips/compare-step-2',
        },
        {
          number: 3,
          title: 'Understand the changes',
          description:
            'Common reasons for differences include salary adjustments, overtime variations, tax bracket changes, benefit enrollment changes, or one-time bonuses. Hover over any highlighted difference for a contextual note if available.',
          screenshotKey: 'payslips/compare-step-3',
          tip: 'Compare your first and last payslip of the year to see the full annual impact of mid-year changes.',
        },
        {
          number: 4,
          title: 'Export the comparison',
          description:
            'Click "Export Comparison" to download a PDF showing both payslips side by side with differences highlighted. Useful for discussions with HR about pay discrepancies.',
          screenshotKey: 'payslips/compare-step-4',
        },
      ],
    },
    {
      id: 'admin-manage-payslips',
      title: 'Managing Payslip Distribution (Admin)',
      description:
        'Configure payslip generation settings, review distribution status, and handle employee inquiries about pay statements.',
      estimatedTime: '5 minutes',
      roles: ['admin', 'hrbp'],
      steps: [
        {
          number: 1,
          title: 'Open the Payslips admin view',
          description:
            'Navigate to Payslips > Admin. The admin dashboard shows the latest payroll run, distribution status (how many employees have viewed their payslips), and any pending inquiries.',
          screenshotKey: 'payslips/admin-step-1',
        },
        {
          number: 2,
          title: 'Review payslip generation status',
          description:
            'After each payroll run, payslips are auto-generated. The status panel shows generation progress, any errors (e.g., missing tax information), and the total count of payslips ready for distribution.',
          screenshotKey: 'payslips/admin-step-2',
        },
        {
          number: 3,
          title: 'Send distribution notifications',
          description:
            'Click "Notify Employees" to send an email notification that new payslips are available. The notification includes a direct link to the Payslips module. You can preview the email before sending.',
          screenshotKey: 'payslips/admin-step-3',
          tip: 'Schedule automatic notifications to go out within an hour after each payroll run completion.',
        },
        {
          number: 4,
          title: 'Handle payslip inquiries',
          description:
            'The inquiry queue lists questions submitted by employees about their payslips. Click an inquiry to view the employee\'s payslip alongside their question. Respond directly or escalate to Payroll.',
          screenshotKey: 'payslips/admin-step-4',
        },
        {
          number: 5,
          title: 'Regenerate a payslip',
          description:
            'If a payslip contains an error, click "Regenerate" after the underlying payroll data is corrected. The old version is archived and the new version replaces it, with a note indicating the correction.',
          screenshotKey: 'payslips/admin-step-5',
        },
      ],
    },
  ],

  faqs: [
    {
      question: 'When are new payslips available?',
      answer:
        'Payslips are generated automatically after each payroll run and are available within 24 hours of payroll processing. The exact timing depends on your organization\'s payroll schedule (weekly, bi-weekly, or monthly). You receive a notification when your new payslip is ready.',
    },
    {
      question: 'Can I access payslips from previous employers or before I joined Tempo?',
      answer:
        'No. The Payslips module only contains pay statements generated through Tempo\'s payroll system. For historical payslips from before your organization adopted Tempo, contact your HR team.',
    },
    {
      question: 'Why does my net pay differ from what I received in my bank account?',
      answer:
        'The net pay on your payslip is the total amount disbursed by payroll. If you have multiple direct deposit accounts (e.g., splitting between checking and savings), the amounts deposited will match the split configuration. Verify your direct deposit settings in Settings > Payment Methods.',
    },
    {
      question: 'How far back can I view my payslip history?',
      answer:
        'All payslips generated since your organization started using Tempo are available. There is no time limit on payslip access. For compliance purposes, payslips are retained for a minimum of 7 years even after an employee departs.',
    },
    {
      question: 'Can my manager see my payslip?',
      answer:
        'No. Payslips are strictly confidential. Only you, HR Admins, and designated Payroll administrators can access your payslip data. Managers do not have visibility into individual payslip details.',
    },
    {
      question: 'How do I report an error on my payslip?',
      answer:
        'Click the "Report Issue" button on any payslip to submit an inquiry. Describe the discrepancy and the HR or Payroll team will investigate. If a correction is needed, a revised payslip is generated and the original is archived with a correction note.',
    },
    {
      question: 'Are payslip PDFs digitally signed?',
      answer:
        'Yes. All payslip PDFs include a digital signature and security watermark to verify authenticity. This ensures that downloaded payslips can be used as official documentation for loan applications, rental agreements, or visa processes.',
    },
    {
      question: 'Can I receive my payslip by email?',
      answer:
        'For security reasons, payslips are not sent as email attachments. You receive a notification email with a secure link to view your payslip within Tempo. This prevents sensitive pay information from being stored in email servers.',
    },
  ],

  tips: [
    'Bookmark the Payslips page for quick access on payday rather than searching through the sidebar each time.',
    'Download your full year\'s payslips in January using the bulk download feature for seamless tax preparation.',
    'Use the comparison view after a salary adjustment to verify the change was applied correctly.',
    'Enable push notifications in Settings so you are alerted the moment your new payslip is available.',
    'If you need a payslip for a mortgage or rental application, use the PDF download — the digital signature confirms authenticity.',
  ],

  relatedModules: ['payroll', 'compensation', 'time-attendance', 'expense'],

  permissions: [
    {
      role: 'Owner',
      capabilities: [
        'Access all payslip data across the organization',
        'Configure payslip templates and branding',
        'View payslip distribution analytics and inquiry queue',
        'Regenerate payslips after payroll corrections',
      ],
    },
    {
      role: 'Admin',
      capabilities: [
        'View and manage payslip distribution for all employees',
        'Handle payslip inquiries and escalate issues to Payroll',
        'Regenerate payslips after corrections',
        'Configure automatic notification schedules',
      ],
    },
    {
      role: 'HRBP',
      capabilities: [
        'View payslips for employees in assigned departments (for inquiry resolution)',
        'Handle payslip inquiries for assigned employees',
        'View distribution status for assigned departments',
      ],
    },
    {
      role: 'Employee',
      capabilities: [
        'View and download personal payslips (current and historical)',
        'Compare payslips across pay periods',
        'Submit payslip inquiries to HR',
        'Bulk download payslips for a selected date range',
      ],
    },
  ],
}

export default payslips
