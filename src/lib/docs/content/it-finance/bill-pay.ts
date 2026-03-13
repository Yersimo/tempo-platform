import type { ModuleDoc } from '../../types'

const billPay: ModuleDoc = {
  slug: 'finance/bill-pay',
  title: 'Bill Pay',
  subtitle: 'Schedule and automate vendor payments with approval workflows, payment calendars, and real-time settlement tracking',
  icon: 'CircleDollarSign',
  group: 'it-finance',
  lastUpdated: '2026-03-13',
  version: '1.0',

  overview: {
    description:
      'The Bill Pay module centralizes all outgoing vendor payments into a single, streamlined workflow. Schedule one-time or recurring payments, manage vendor bank details securely, and route payments through configurable approval chains. The payment calendar provides a forward-looking view of upcoming obligations, helping treasury teams manage cash flow proactively. Settlement tracking shows real-time payment status from initiation through bank confirmation, with automatic reconciliation against invoices and purchase orders.',
    keyFeatures: [
      'One-time and recurring payment scheduling with flexible frequency options',
      'Secure vendor bank detail management with encrypted storage',
      'Configurable multi-level approval workflows based on amount and vendor',
      'Payment calendar with cash flow forecasting and liquidity planning',
      'Multiple payment methods: ACH, wire transfer, international wire, and check',
      'Automatic invoice reconciliation upon payment settlement',
      'Batch payment processing to minimize transaction fees',
      'Real-time settlement tracking with bank confirmation status',
    ],
    screenshotKey: 'bill-pay/overview',
  },

  workflows: [
    {
      id: 'schedule-payment',
      title: 'Scheduling a Vendor Payment',
      description:
        'Create a new payment to a vendor by selecting an approved invoice or entering payment details manually, choosing a payment method, and scheduling a payment date.',
      estimatedTime: '4 minutes',
      roles: ['owner', 'admin', 'manager'],
      steps: [
        {
          number: 1,
          title: 'Navigate to Bill Pay',
          description:
            'Click "Bill Pay" under IT & Finance in the left sidebar. The module opens to the payment queue showing all pending, scheduled, and recently completed payments.',
          screenshotKey: 'bill-pay/schedule-step-1',
        },
        {
          number: 2,
          title: 'Create a new payment',
          description:
            'Click "+ New Payment." Choose between "From Invoice" to pay against an approved invoice or "Manual Payment" for payments without a linked invoice. When paying from an invoice, the vendor, amount, and reference details are pre-filled automatically.',
          screenshotKey: 'bill-pay/schedule-step-2',
          tip: 'Paying from an approved invoice ensures automatic reconciliation when the payment settles.',
        },
        {
          number: 3,
          title: 'Select payment method and date',
          description:
            'Choose a payment method: ACH (1-3 business days, lowest fee), Domestic Wire (same day, higher fee), International Wire (1-5 business days, includes FX conversion), or Check (mailed, 5-10 business days). Select the desired payment date from the calendar picker.',
          screenshotKey: 'bill-pay/schedule-step-3',
        },
        {
          number: 4,
          title: 'Verify vendor bank details',
          description:
            'Confirm the vendor payment details on file (bank name, account number, routing number). If this is a new vendor or details have changed, click "Update Details" to enter new banking information. All bank details are encrypted at rest and masked in the UI.',
          screenshotKey: 'bill-pay/schedule-step-4',
        },
        {
          number: 5,
          title: 'Submit for approval',
          description:
            'Review the payment summary showing vendor, amount, method, scheduled date, and linked invoice. Click "Submit for Approval" to route the payment through your organization\'s approval workflow. Payments below the auto-approval threshold process immediately.',
          screenshotKey: 'bill-pay/schedule-step-5',
        },
      ],
    },
    {
      id: 'manage-vendors',
      title: 'Managing the Vendor Directory',
      description:
        'Add, edit, and maintain vendor profiles including contact information, payment terms, bank details, and tax documentation in a centralized directory.',
      estimatedTime: '5 minutes',
      roles: ['owner', 'admin'],
      steps: [
        {
          number: 1,
          title: 'Open the vendor directory',
          description:
            'Navigate to Bill Pay > Vendors. The directory lists all vendors with their status (Active, Inactive, Pending Verification), payment terms, and total payments to date. Use the search bar or filters to find specific vendors.',
          screenshotKey: 'bill-pay/vendors-step-1',
        },
        {
          number: 2,
          title: 'Add a new vendor',
          description:
            'Click "+ Add Vendor" and fill in the vendor profile: company name, contact person, email, phone, address, and tax ID (W-9 or W-8BEN). Upload supporting documents such as contracts or agreements.',
          screenshotKey: 'bill-pay/vendors-step-2',
        },
        {
          number: 3,
          title: 'Enter bank details',
          description:
            'In the "Payment Details" section, enter the vendor bank information: bank name, account number, routing number (for domestic ACH/wire), or SWIFT/IBAN (for international wires). All data is encrypted and access is restricted to authorized personnel.',
          screenshotKey: 'bill-pay/vendors-step-3',
          tip: 'For international vendors, enter both the SWIFT code and IBAN to avoid delays in wire processing.',
        },
        {
          number: 4,
          title: 'Set default payment terms',
          description:
            'Configure the vendor default payment terms: Net 15, Net 30, Net 45, Net 60, or custom terms. Set the preferred payment method and any early payment discount terms (e.g., 2/10 Net 30). These defaults are applied automatically when creating payments for this vendor.',
          screenshotKey: 'bill-pay/vendors-step-4',
        },
        {
          number: 5,
          title: 'Verify and activate the vendor',
          description:
            'New vendors enter "Pending Verification" status. Review the submitted information and documents, verify the bank details through your organization\'s verification process, and click "Activate Vendor" to enable payments. An audit log entry records the activation.',
          screenshotKey: 'bill-pay/vendors-step-5',
        },
      ],
    },
    {
      id: 'payment-calendar',
      title: 'Using the Payment Calendar',
      description:
        'Visualize upcoming payment obligations on a calendar view to manage cash flow, identify peak payment periods, and optimize payment timing.',
      estimatedTime: '3 minutes',
      roles: ['owner', 'admin', 'manager'],
      steps: [
        {
          number: 1,
          title: 'Open the payment calendar',
          description:
            'Navigate to Bill Pay > Calendar. The calendar displays all scheduled payments on their payment dates, color-coded by status: blue for scheduled, green for approved, amber for pending approval, and gray for completed.',
          screenshotKey: 'bill-pay/calendar-step-1',
        },
        {
          number: 2,
          title: 'Review the cash flow forecast',
          description:
            'The summary bar above the calendar shows total outflows for the selected period, available balance, and projected balance after all scheduled payments. A line chart below the calendar visualizes the daily cash flow trajectory.',
          screenshotKey: 'bill-pay/calendar-step-2',
          tip: 'Switch between weekly, monthly, and quarterly views to match your planning horizon.',
        },
        {
          number: 3,
          title: 'Reschedule payments',
          description:
            'Drag and drop any scheduled (unapproved) payment to a different date to reschedule it. For approved payments, click the payment and select "Reschedule" to change the date, which may require re-approval depending on your workflow rules.',
          screenshotKey: 'bill-pay/calendar-step-3',
        },
        {
          number: 4,
          title: 'Identify and resolve conflicts',
          description:
            'Dates with high payment volumes are highlighted with a red border. Click these dates to see all payments scheduled and identify opportunities to batch payments, negotiate extended terms, or stagger outflows to maintain healthy cash reserves.',
          screenshotKey: 'bill-pay/calendar-step-4',
        },
      ],
    },
    {
      id: 'approve-payments',
      title: 'Approving Payments',
      description:
        'Review and approve pending payment requests, verify amounts against invoices, and release payments for processing through the configured approval chain.',
      estimatedTime: '3 minutes',
      roles: ['owner', 'admin', 'manager'],
      steps: [
        {
          number: 1,
          title: 'Access the approval queue',
          description:
            'Navigate to Bill Pay and click the "Pending Approval" tab. Payments awaiting your approval are listed with vendor name, amount, payment method, scheduled date, and the name of the requester. A count badge shows the number of items pending.',
          screenshotKey: 'bill-pay/approve-step-1',
        },
        {
          number: 2,
          title: 'Review payment details',
          description:
            'Click a payment to open the detail view. Review the vendor information, amount, linked invoice (if any), payment method, and bank details. The system shows a comparison of the payment amount against the original invoice and any previously applied payments.',
          screenshotKey: 'bill-pay/approve-step-2',
        },
        {
          number: 3,
          title: 'Verify supporting documentation',
          description:
            'Check the "Documents" tab for the linked invoice, purchase order, and goods receipt. The three-way match indicator shows whether the amounts align across all three documents. Discrepancies are flagged with explanations.',
          screenshotKey: 'bill-pay/approve-step-3',
          tip: 'Always verify the bank details match the vendor on file — changes to bank details close to payment time can indicate fraud.',
        },
        {
          number: 4,
          title: 'Approve, reject, or hold the payment',
          description:
            'Click "Approve" to release the payment for processing on the scheduled date. Click "Reject" with a comment to send it back to the requester. Click "Hold" to pause the payment pending further investigation without rejecting it.',
          screenshotKey: 'bill-pay/approve-step-4',
        },
        {
          number: 5,
          title: 'Batch approve payments',
          description:
            'Select multiple payments using the checkboxes and click "Batch Approve" to approve them simultaneously. A confirmation dialog shows the total amount and number of payments. Batch approval is logged individually in the audit trail for each payment.',
          screenshotKey: 'bill-pay/approve-step-5',
        },
      ],
    },
  ],

  faqs: [
    {
      question: 'How long does each payment method take to settle?',
      answer:
        'ACH payments settle in 1-3 business days. Domestic wire transfers settle same-day when submitted before the cutoff time (typically 3:00 PM ET). International wires take 1-5 business days depending on the destination country and intermediary banks. Paper checks are mailed and typically arrive in 5-10 business days.',
    },
    {
      question: 'Can I set up recurring payments for regular vendors?',
      answer:
        'Yes. When creating a payment, toggle "Make Recurring" and configure the frequency (weekly, bi-weekly, monthly, quarterly, or custom), start date, and optional end date or occurrence count. Each recurrence generates a new payment that follows the standard approval workflow unless you enable auto-approval for recurring payments to trusted vendors.',
    },
    {
      question: 'How are vendor bank details secured?',
      answer:
        'All vendor bank details are encrypted at rest using AES-256 encryption and in transit using TLS 1.3. Bank account numbers and routing numbers are masked in the UI, showing only the last four digits. Access to full bank details is restricted to users with the "Payment Admin" permission. All access events are logged in the audit trail.',
    },
    {
      question: 'What happens if a payment fails?',
      answer:
        'Failed payments are flagged immediately in the transaction feed with the failure reason (insufficient funds, invalid account, bank rejection). The payment creator and approver are notified via email and in-app notification. The payment status changes to "Failed" and can be retried after correcting the issue. Failed payments do not count against the vendor\'s payment history.',
    },
    {
      question: 'Can I cancel a scheduled payment?',
      answer:
        'Payments in "Scheduled" or "Approved" status can be cancelled before the processing cutoff time. Navigate to the payment detail and click "Cancel Payment" with a reason. Once a payment enters "Processing" status (sent to the bank), it cannot be cancelled through the platform — contact your bank directly for a recall request.',
    },
    {
      question: 'How does batch payment processing reduce fees?',
      answer:
        'When you schedule multiple payments to the same vendor on the same date using the same payment method, the system offers to consolidate them into a single transaction. This reduces per-transaction fees charged by your bank. The consolidated payment references all linked invoices, and reconciliation applies the payment proportionally across each invoice.',
    },
  ],

  tips: [
    'Pay from approved invoices whenever possible to ensure automatic reconciliation and a clean audit trail.',
    'Use the payment calendar weekly to identify cash flow pinch points and reschedule non-urgent payments to smoother periods.',
    'Set up recurring payments for predictable expenses like rent, utilities, and retainers to save time on monthly payment runs.',
    'Verify vendor bank details carefully before approving large wire transfers — account changes near payment time can indicate fraud.',
    'Take advantage of early payment discounts (e.g., 2/10 Net 30) by scheduling payments within the discount window.',
    'Use batch payments to the same vendor to reduce transaction fees and simplify reconciliation.',
  ],

  relatedModules: ['finance/invoices', 'finance/budgets', 'finance/global-spend', 'finance/cards'],

  permissions: [
    {
      role: 'Owner',
      capabilities: [
        'Create, approve, and cancel payments of any amount',
        'Manage vendor directory including bank details and verification',
        'Configure payment approval workflows and thresholds',
        'Access all payment history, analytics, and audit trails',
        'Set up and manage bank account connections and payment methods',
      ],
    },
    {
      role: 'Admin',
      capabilities: [
        'Create and submit payments within assigned departments',
        'Approve payments within delegated authority limits',
        'Add and edit vendors in the directory (activation requires Owner)',
        'Access payment history and reports for assigned scope',
        'Manage recurring payment schedules',
      ],
    },
    {
      role: 'Manager',
      capabilities: [
        'Create and submit payment requests for their department',
        'Approve payments within their delegated authority limit',
        'View payment status for their department submissions',
        'Access the payment calendar for cash flow visibility',
      ],
    },
    {
      role: 'Employee',
      capabilities: [
        'Submit payment requests linked to approved invoices',
        'View status of payments they have requested',
        'Access basic vendor contact information (no bank details)',
      ],
    },
  ],
}

export default billPay
