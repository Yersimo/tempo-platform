import type { ModuleDoc } from '../../types'

const expense: ModuleDoc = {
  slug: 'expense',
  title: 'Expense Management',
  subtitle: 'Expense reports, receipt OCR scanning, policy compliance checks, approval workflows, and reimbursement tracking',
  icon: 'Receipt',
  group: 'operations',
  lastUpdated: '2026-03-13',
  version: '1.0',

  overview: {
    description:
      'The Expense Management module streamlines the entire lifecycle of business expenses — from receipt capture to reimbursement. Employees photograph receipts and the AI-powered OCR engine automatically extracts merchant, date, amount, and category. Expense reports are assembled, checked against organizational policies in real time, and routed through configurable approval workflows. Finance teams gain full visibility into spending patterns, policy compliance, and reimbursement status.',
    keyFeatures: [
      'AI-powered receipt OCR with automatic field extraction (merchant, date, amount, currency, category)',
      'Mobile receipt capture with camera snap-and-submit workflow',
      'Real-time policy compliance checking with violation alerts',
      'Multi-level approval workflows configurable by amount, category, and department',
      'Mileage tracking with GPS-based route calculation',
      'Per diem management with automatic daily limit enforcement',
      'Multi-currency expense support with real-time exchange rate conversion',
      'Integration with corporate credit cards for automatic transaction import',
    ],
    screenshotKey: 'expense/overview',
  },

  workflows: [
    {
      id: 'submit-expense',
      title: 'Submitting an Expense Report',
      description:
        'Create an expense report, attach receipts, and submit for approval to receive reimbursement.',
      estimatedTime: '5 minutes',
      roles: ['employee'],
      steps: [
        {
          number: 1,
          title: 'Navigate to Expenses',
          description:
            'Click "Expenses" in the left sidebar under Operations. The main view shows your draft reports, submitted reports, and reimbursement history.',
          screenshotKey: 'expense/submit-step-1',
        },
        {
          number: 2,
          title: 'Create a new expense report',
          description:
            'Click "+ New Report." Enter a report title (e.g., "Q1 Client Travel"), select the expense policy that applies, and optionally link the report to a project or cost center.',
          screenshotKey: 'expense/submit-step-2',
        },
        {
          number: 3,
          title: 'Add expense line items',
          description:
            'Click "+ Add Expense." For each expense, enter the date, category (meals, transport, accommodation, supplies), amount, and currency. Upload or photograph the receipt — the OCR engine auto-fills fields from the receipt image.',
          screenshotKey: 'expense/submit-step-3',
          tip: 'Snap receipts immediately after each purchase using the mobile app to avoid losing them.',
        },
        {
          number: 4,
          title: 'Review policy compliance',
          description:
            'As you add expenses, the system checks each item against the applicable policy. Violations (e.g., meal exceeding daily limit) are flagged in amber with an explanation. You can add justification notes for flagged items.',
          screenshotKey: 'expense/submit-step-4',
        },
        {
          number: 5,
          title: 'Submit for approval',
          description:
            'Review the report summary showing total amount, item count, and any policy flags. Click "Submit" to route the report to your approver. You receive a confirmation and can track approval progress in real time.',
          screenshotKey: 'expense/submit-step-5',
        },
      ],
    },
    {
      id: 'scan-receipt',
      title: 'Scanning Receipts with OCR',
      description:
        'Use the receipt scanner to automatically extract expense data from a photo or uploaded image.',
      estimatedTime: '2 minutes',
      roles: ['employee'],
      steps: [
        {
          number: 1,
          title: 'Open the receipt scanner',
          description:
            'From an expense report, click "+ Scan Receipt." On mobile, this opens your device camera. On desktop, click "Upload" to select an image file or PDF.',
          screenshotKey: 'expense/ocr-step-1',
        },
        {
          number: 2,
          title: 'Capture or upload the receipt',
          description:
            'Take a clear photo of the receipt ensuring all text is legible. The OCR engine processes the image and extracts the merchant name, date, total amount, tax amount, and payment method.',
          screenshotKey: 'expense/ocr-step-2',
          tip: 'Ensure the receipt is on a flat surface with good lighting for the most accurate OCR results.',
        },
        {
          number: 3,
          title: 'Verify extracted data',
          description:
            'Review the auto-extracted fields. Edit any values that were misread or missing. Select the expense category from the dropdown. The original receipt image is stored alongside the expense record for audit purposes.',
          screenshotKey: 'expense/ocr-step-3',
        },
        {
          number: 4,
          title: 'Save the expense',
          description:
            'Click "Save" to add the expense to your report. The receipt image, extracted data, and any manual corrections are all preserved in the expense record.',
          screenshotKey: 'expense/ocr-step-4',
        },
      ],
    },
    {
      id: 'approve-expenses',
      title: 'Approving Expense Reports',
      description:
        'Review submitted expense reports, check receipts and policy compliance, and approve or return reports.',
      estimatedTime: '5 minutes',
      roles: ['manager', 'hrbp', 'admin'],
      steps: [
        {
          number: 1,
          title: 'Open the approval queue',
          description:
            'Navigate to Expenses > Approvals. The queue lists all expense reports pending your review, sorted by submission date. Each entry shows the employee name, report title, total amount, and policy flag count.',
          screenshotKey: 'expense/approve-step-1',
        },
        {
          number: 2,
          title: 'Review the expense report',
          description:
            'Click on a report to open the detail view. Review each line item with its receipt image, amount, category, and any policy flags. The system highlights items that exceed limits or require additional documentation.',
          screenshotKey: 'expense/approve-step-2',
        },
        {
          number: 3,
          title: 'Verify receipts',
          description:
            'Click on any receipt thumbnail to view the full-size image. Compare the receipt against the reported amount and category. Flag any discrepancies by adding a comment on the line item.',
          screenshotKey: 'expense/approve-step-3',
          tip: 'Focus your review time on flagged items and high-value expenses — low-value items within policy can usually be approved quickly.',
        },
        {
          number: 4,
          title: 'Approve, reject, or return',
          description:
            'Click "Approve" to authorize the full report, "Reject" to decline it with a reason, or "Return for Revision" to send specific items back to the employee for correction. Partial approvals are supported — approve some items while returning others.',
          screenshotKey: 'expense/approve-step-4',
        },
        {
          number: 5,
          title: 'Route to Finance for reimbursement',
          description:
            'Approved reports are automatically queued for reimbursement processing. Finance reviews the batch and processes payments according to the reimbursement schedule (typically within the next payroll cycle).',
          screenshotKey: 'expense/approve-step-5',
        },
      ],
    },
    {
      id: 'manage-policies',
      title: 'Configuring Expense Policies',
      description:
        'Create and maintain expense policies that define spending limits, required documentation, and approval rules.',
      estimatedTime: '10 minutes',
      roles: ['admin', 'owner'],
      steps: [
        {
          number: 1,
          title: 'Open Policy Settings',
          description:
            'Navigate to Expenses > Settings > Policies. The view lists all active expense policies with their scope (organization-wide, department-specific, or role-specific) and last modified date.',
          screenshotKey: 'expense/policy-step-1',
        },
        {
          number: 2,
          title: 'Create or edit a policy',
          description:
            'Click "+ New Policy" or edit an existing one. Define the policy name, scope, and effective dates. Set spending limits per category (e.g., meals: $75/day, lodging: $250/night, airfare: economy class only).',
          screenshotKey: 'expense/policy-step-2',
        },
        {
          number: 3,
          title: 'Configure documentation requirements',
          description:
            'For each category, specify whether a receipt is required, the minimum amount threshold for receipts (e.g., receipts required for expenses over $25), and whether itemized receipts are needed for meals.',
          screenshotKey: 'expense/policy-step-3',
        },
        {
          number: 4,
          title: 'Set approval routing',
          description:
            'Define the approval chain based on report amount. For example: under $500 requires manager approval only; $500-$5,000 requires manager plus department head; over $5,000 requires VP approval.',
          screenshotKey: 'expense/policy-step-4',
          tip: 'Create a separate policy for executive travel with higher limits and a different approval chain.',
        },
        {
          number: 5,
          title: 'Publish the policy',
          description:
            'Click "Publish" to activate the policy. Employees are notified of policy changes. The system applies the policy rules to all new expense reports within the policy\'s scope.',
          screenshotKey: 'expense/policy-step-5',
        },
      ],
    },
  ],

  faqs: [
    {
      question: 'What file formats are supported for receipt uploads?',
      answer:
        'The OCR engine supports JPEG, PNG, HEIC (iPhone photos), and PDF formats. For best results, upload clear, high-resolution images where all text is readable. Multi-page PDFs are supported for receipts that span multiple pages.',
    },
    {
      question: 'What happens if I lose a receipt?',
      answer:
        'Submit the expense with a "Missing Receipt" declaration explaining the circumstances. Your organization\'s policy determines whether missing receipts are accepted. Most policies allow missing receipt declarations for expenses under a threshold (e.g., $25) but require them for larger amounts.',
    },
    {
      question: 'How quickly are reimbursements processed?',
      answer:
        'Once an expense report is fully approved, reimbursements are typically processed within the next payroll cycle. Some organizations offer a separate weekly reimbursement run. Check your organization\'s expense policy for specific timelines.',
    },
    {
      question: 'Can I submit expenses in foreign currencies?',
      answer:
        'Yes. Select the currency when entering each expense. The system converts the amount to your organization\'s base currency using the exchange rate on the transaction date. You can manually override the rate if your credit card statement shows a different conversion.',
    },
    {
      question: 'How does the corporate credit card integration work?',
      answer:
        'When your corporate credit card is linked, transactions are automatically imported into your expense dashboard as unsubmitted line items. You match each transaction with a receipt, add category and notes, then include it in an expense report. This eliminates manual entry for card purchases.',
    },
    {
      question: 'Can I split an expense across multiple cost centers or projects?',
      answer:
        'Yes. When adding a line item, click "Split" to allocate the expense across multiple cost centers, projects, or departments. You can split by percentage or fixed amount. Each portion is coded separately for accounting purposes.',
    },
    {
      question: 'What policy violations block submission?',
      answer:
        'Hard violations (e.g., exceeding maximum per-item limits with no receipt) block submission until resolved. Soft violations (e.g., slight daily meal limit exceedance) allow submission with a required justification note. Violation severity is configurable in the policy settings.',
    },
    {
      question: 'How do mileage claims work?',
      answer:
        'Click "Add Mileage" in an expense report. Enter the start and end addresses — the system calculates the distance using Google Maps. The reimbursement amount is computed using your organization\'s per-mile rate. You can also enter distance manually if you tracked it separately.',
    },
  ],

  tips: [
    'Photograph receipts immediately after each transaction — the mobile app makes this a 10-second process that prevents end-of-trip receipt scrambles.',
    'Use the corporate credit card import to eliminate manual data entry and reduce errors on card-based expenses.',
    'Managers should establish a regular weekly cadence for expense approvals to avoid bottlenecks that delay reimbursements.',
    'Review the spending analytics dashboard monthly to identify categories where costs are trending above budget.',
    'Create project-specific cost centers so that client-billable expenses are tracked separately from internal spending.',
    'Set up automatic per diem rates for common travel destinations to simplify meal and incidental expense tracking.',
  ],

  relatedModules: ['travel', 'payroll', 'payslips', 'dashboard'],

  permissions: [
    {
      role: 'Owner',
      capabilities: [
        'Create and manage all expense policies and approval workflows',
        'Access expense data and analytics across the entire organization',
        'Approve expense reports of any amount',
        'Configure corporate credit card integrations and OCR settings',
      ],
    },
    {
      role: 'Admin',
      capabilities: [
        'Create and manage expense policies and categories',
        'Access expense reports and analytics organization-wide',
        'Process reimbursements and manage the payment queue',
        'Configure approval routing rules and documentation requirements',
      ],
    },
    {
      role: 'HRBP',
      capabilities: [
        'View expense reports for employees in assigned departments',
        'Approve expense reports within delegated approval limits',
        'Run expense analytics for assigned departments',
      ],
    },
    {
      role: 'Manager',
      capabilities: [
        'Approve expense reports submitted by direct reports',
        'View team expense summaries and spending trends',
        'Return reports for revision and add approval comments',
        'Submit their own expense reports for approval',
      ],
    },
    {
      role: 'Employee',
      capabilities: [
        'Create and submit expense reports with receipt attachments',
        'Scan receipts using the OCR engine',
        'Track reimbursement status and view payment history',
        'View applicable expense policies and spending limits',
      ],
    },
  ],
}

export default expense
