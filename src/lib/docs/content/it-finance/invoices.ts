import type { ModuleDoc } from '../../types'

const invoices: ModuleDoc = {
  slug: 'finance/invoices',
  title: 'Invoices',
  subtitle: 'Create, track, and manage invoices with multi-level approval workflows and real-time payment status monitoring',
  icon: 'FileText',
  group: 'it-finance',
  lastUpdated: '2026-03-13',
  version: '1.0',

  overview: {
    description:
      'The Invoices module provides end-to-end invoice lifecycle management for your organization. From creation and submission through multi-level approval and payment tracking, every invoice is captured, validated, and routed automatically. The module supports both accounts payable (vendor invoices) and accounts receivable (customer invoices), with OCR-powered data extraction, duplicate detection, and integration with your general ledger. Real-time dashboards surface aging reports, payment forecasts, and cash flow impact analysis to keep your finance team in full control.',
    keyFeatures: [
      'OCR-powered invoice data extraction from uploaded PDFs and images',
      'Configurable multi-level approval workflows based on amount thresholds',
      'Real-time payment status tracking with automated reminders',
      'Duplicate invoice detection using vendor, amount, and date matching',
      'Aging reports with customizable buckets (30/60/90/120+ days)',
      'Multi-currency support with automatic exchange rate conversion',
      'Batch invoice processing for high-volume operations',
      'Audit trail with full version history for every invoice',
    ],
    screenshotKey: 'invoices/overview',
  },

  workflows: [
    {
      id: 'create-invoice',
      title: 'Creating a New Invoice',
      description:
        'Submit a new invoice into the system, either by manual entry or by uploading a document for automatic data extraction via OCR.',
      estimatedTime: '4 minutes',
      roles: ['owner', 'admin', 'manager', 'employee'],
      steps: [
        {
          number: 1,
          title: 'Navigate to the Invoices module',
          description:
            'Click "Invoices" under the IT & Finance section in the left sidebar. The invoice list view loads showing all invoices visible to your role, sorted by most recent.',
          screenshotKey: 'invoices/create-step-1',
        },
        {
          number: 2,
          title: 'Start a new invoice',
          description:
            'Click the "+ New Invoice" button in the top-right corner. A creation modal opens with two options: "Manual Entry" for typing invoice details or "Upload Document" for OCR extraction.',
          screenshotKey: 'invoices/create-step-2',
          tip: 'Use "Upload Document" for printed or PDF invoices — the OCR engine extracts vendor name, amounts, line items, and due date automatically.',
        },
        {
          number: 3,
          title: 'Fill in invoice details',
          description:
            'Complete the required fields: Vendor (select from vendor directory or add new), Invoice Number, Invoice Date, Due Date, Currency, and Line Items. Each line item requires a description, quantity, unit price, tax rate, and GL account code.',
          screenshotKey: 'invoices/create-step-3',
        },
        {
          number: 4,
          title: 'Attach supporting documents',
          description:
            'Upload the original invoice document and any supporting files (contracts, purchase orders, delivery receipts) by dragging them into the attachments area. Supported formats include PDF, PNG, JPG, and TIFF.',
          screenshotKey: 'invoices/create-step-4',
        },
        {
          number: 5,
          title: 'Review and submit for approval',
          description:
            'Review the invoice summary including total amount, tax breakdown, and assigned GL codes. Click "Submit for Approval" to route the invoice to the appropriate approver based on the configured workflow rules. The invoice status changes to "Pending Approval".',
          screenshotKey: 'invoices/create-step-5',
          tip: 'Invoices below your auto-approval threshold are approved instantly and move directly to "Approved" status.',
        },
      ],
    },
    {
      id: 'approve-invoice',
      title: 'Approving or Rejecting an Invoice',
      description:
        'Review pending invoices in your approval queue, verify details against supporting documents, and approve or reject with comments.',
      estimatedTime: '3 minutes',
      roles: ['owner', 'admin', 'manager'],
      steps: [
        {
          number: 1,
          title: 'Open your approval queue',
          description:
            'Navigate to Invoices and click the "Pending My Approval" tab. This filtered view shows only invoices awaiting your review, sorted by due date urgency. A badge on the tab indicates the count of pending items.',
          screenshotKey: 'invoices/approve-step-1',
        },
        {
          number: 2,
          title: 'Review invoice details',
          description:
            'Click on an invoice to open the detail view. Review the vendor information, line items, amounts, tax calculations, and GL account assignments. The system highlights any anomalies such as unusual amounts or missing PO references.',
          screenshotKey: 'invoices/approve-step-2',
          tip: 'Use the "Compare to PO" button to view the original purchase order side-by-side with the invoice for three-way matching.',
        },
        {
          number: 3,
          title: 'Check supporting documents',
          description:
            'Click the "Attachments" tab to view uploaded documents. The built-in viewer lets you zoom, rotate, and annotate documents without leaving the approval screen. Verify that the invoice matches the goods or services received.',
          screenshotKey: 'invoices/approve-step-3',
        },
        {
          number: 4,
          title: 'Approve or reject the invoice',
          description:
            'Click "Approve" to advance the invoice to payment processing, or click "Reject" to send it back to the submitter. Both actions require a comment explaining the decision. Rejected invoices return to "Draft" status with your feedback attached.',
          screenshotKey: 'invoices/approve-step-4',
        },
        {
          number: 5,
          title: 'Escalate if needed',
          description:
            'If the invoice exceeds your approval authority or requires additional review, click "Escalate" to forward it to the next approver in the chain. Add a note explaining why escalation is needed. The original submitter is notified of the escalation.',
          screenshotKey: 'invoices/approve-step-5',
        },
      ],
    },
    {
      id: 'track-payment-status',
      title: 'Tracking Invoice Payment Status',
      description:
        'Monitor the payment lifecycle of approved invoices from scheduling through settlement, with real-time status updates and aging analysis.',
      estimatedTime: '3 minutes',
      roles: ['owner', 'admin', 'manager'],
      steps: [
        {
          number: 1,
          title: 'Open the payment tracker',
          description:
            'In the Invoices module, click the "Payment Status" tab. This view groups invoices by status: Scheduled, Processing, Paid, and Overdue. Summary cards at the top show total amounts in each category.',
          screenshotKey: 'invoices/payment-step-1',
        },
        {
          number: 2,
          title: 'Filter by date range or vendor',
          description:
            'Use the filter bar to narrow results by payment date range, vendor, currency, or amount range. Saved filter presets let you quickly switch between common views such as "This Month" or "Overdue > 60 Days".',
          screenshotKey: 'invoices/payment-step-2',
        },
        {
          number: 3,
          title: 'View aging report',
          description:
            'Click "Aging Report" to see a breakdown of outstanding payables in configurable buckets (Current, 1-30, 31-60, 61-90, 90+ days). The report includes both a summary chart and a detailed table with vendor-level drill-down.',
          screenshotKey: 'invoices/payment-step-3',
          tip: 'Export the aging report as a CSV to share with your accounting team or import into your ERP system.',
        },
        {
          number: 4,
          title: 'Send payment reminders',
          description:
            'For overdue receivable invoices, select one or more entries and click "Send Reminder." The system generates a professional payment reminder email using your configured template and sends it to the customer contact on file.',
          screenshotKey: 'invoices/payment-step-4',
        },
      ],
    },
    {
      id: 'batch-processing',
      title: 'Processing Invoices in Batch',
      description:
        'Efficiently handle high volumes of invoices by using batch upload, batch approval, and bulk payment scheduling features.',
      estimatedTime: '6 minutes',
      roles: ['owner', 'admin'],
      steps: [
        {
          number: 1,
          title: 'Prepare your batch file',
          description:
            'Download the batch upload template from Invoices > Import > Download Template. The CSV template includes columns for vendor ID, invoice number, date, due date, currency, line items, and GL codes. Fill in your invoice data following the format examples.',
          screenshotKey: 'invoices/batch-step-1',
        },
        {
          number: 2,
          title: 'Upload the batch file',
          description:
            'Click "Import" and drag your completed CSV into the upload area. The system validates each row and displays a preview showing successfully parsed invoices and any rows with errors. Fix errors inline or download the error report.',
          screenshotKey: 'invoices/batch-step-2',
          tip: 'The batch importer supports up to 500 invoices per file. For larger volumes, split into multiple files.',
        },
        {
          number: 3,
          title: 'Review and confirm the batch',
          description:
            'Review the parsed invoice summary showing total count, aggregate amount by currency, and vendor distribution. Click "Confirm Import" to create all invoices. Each invoice enters the standard approval workflow independently.',
          screenshotKey: 'invoices/batch-step-3',
        },
        {
          number: 4,
          title: 'Batch approve invoices',
          description:
            'From the "Pending My Approval" tab, use the checkbox column to select multiple invoices. Click "Batch Approve" to approve all selected invoices at once. A confirmation dialog shows the total amount and count before processing.',
          screenshotKey: 'invoices/batch-step-4',
        },
        {
          number: 5,
          title: 'Schedule batch payments',
          description:
            'Navigate to Payment Status > Approved. Select invoices to pay and click "Schedule Payment." Choose a payment date and method (ACH, wire, check). The system groups payments by vendor to minimize transaction fees where possible.',
          screenshotKey: 'invoices/batch-step-5',
        },
      ],
    },
  ],

  faqs: [
    {
      question: 'How does the OCR extraction work for uploaded invoices?',
      answer:
        'When you upload a PDF or image, the system uses AI-powered optical character recognition to extract key fields including vendor name, invoice number, date, line items, amounts, and tax. Extracted data is pre-filled into the invoice form for your review. Accuracy is typically above 95% for clearly printed documents. You can correct any misread fields before submitting.',
    },
    {
      question: 'What happens when a duplicate invoice is detected?',
      answer:
        'The system checks for duplicates by matching vendor ID, invoice number, and total amount. If a potential duplicate is found, a warning banner appears on the invoice form showing the matching invoice with a link to view it. You can dismiss the warning and proceed if the invoice is legitimately not a duplicate, or cancel to avoid double-payment.',
    },
    {
      question: 'Can I configure different approval chains for different invoice amounts?',
      answer:
        'Yes. In Settings > Invoice Workflows, you can define approval rules based on amount thresholds, vendor, department, or GL account. For example, invoices under $1,000 can be auto-approved, $1,000-$10,000 requires manager approval, and above $10,000 requires VP and Finance Director approval.',
    },
    {
      question: 'How are multi-currency invoices handled?',
      answer:
        'When creating an invoice in a foreign currency, the system uses the daily exchange rate from your configured rate provider to display the equivalent amount in your base currency. The actual conversion rate is locked at the time of payment. Exchange rate gains or losses are recorded in the designated GL account.',
    },
    {
      question: 'Can I set up recurring invoices?',
      answer:
        'Yes. Open any invoice and click "Make Recurring" to set up a schedule (weekly, monthly, quarterly, or custom). The system automatically generates a new invoice on each recurrence date with the same line items and vendor. You can set an end date or number of occurrences, and each generated invoice still follows your approval workflow.',
    },
    {
      question: 'How long are invoice records retained?',
      answer:
        'Invoice records and attachments are retained indefinitely by default. You can configure retention policies in Settings > Data Retention to automatically archive invoices older than a specified period (e.g., 7 years for tax compliance). Archived invoices remain searchable but are moved to cold storage.',
    },
  ],

  tips: [
    'Use the OCR upload feature to save time on data entry — it extracts vendor, amounts, and line items automatically from PDFs.',
    'Set up saved filters for common views like "Overdue Invoices" or "Pending My Approval" to streamline your daily workflow.',
    'Enable email notifications for invoice status changes so you are alerted when invoices are approved, rejected, or paid.',
    'Use the three-way matching feature (PO, receipt, invoice) to catch discrepancies before approving large vendor invoices.',
    'Tag invoices with project codes to track spending against project budgets in real time.',
    'Schedule recurring invoices for predictable expenses like rent, subscriptions, and retainer fees to reduce manual entry.',
  ],

  relatedModules: ['finance/budgets', 'finance/bill-pay', 'finance/global-spend', 'finance/cards'],

  permissions: [
    {
      role: 'Owner',
      capabilities: [
        'Create, edit, and delete any invoice across the organization',
        'Approve invoices of any amount without threshold limits',
        'Configure approval workflows and amount thresholds',
        'Access all aging reports and payment analytics',
        'Manage vendor directory and payment methods',
        'Export and archive invoice records',
      ],
    },
    {
      role: 'Admin',
      capabilities: [
        'Create, edit, and delete invoices within assigned scope',
        'Approve invoices up to configured authority limit',
        'Configure approval workflows and notification settings',
        'Access aging reports and payment status dashboards',
        'Manage vendor directory entries',
      ],
    },
    {
      role: 'Manager',
      capabilities: [
        'Create and submit invoices for their department',
        'Approve invoices within their delegated authority limit',
        'View payment status for invoices in their department',
        'Access departmental aging reports',
      ],
    },
    {
      role: 'Employee',
      capabilities: [
        'Create and submit invoices for approval',
        'View status of invoices they have submitted',
        'Upload supporting documents and attachments',
      ],
    },
  ],
}

export default invoices
