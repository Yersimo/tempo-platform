import type { ModuleDoc } from '../../types'

const corporateCards: ModuleDoc = {
  slug: 'finance/cards',
  title: 'Corporate Cards',
  subtitle: 'Issue virtual and physical cards with granular spend controls, real-time transaction monitoring, and automated receipt matching',
  icon: 'CreditCard',
  group: 'it-finance',
  lastUpdated: '2026-03-13',
  version: '1.0',

  overview: {
    description:
      'The Corporate Cards module provides complete lifecycle management for company-issued payment cards. Issue virtual cards instantly for online purchases or physical cards for travel and in-person expenses. Set granular spend controls per card including amount limits, merchant category restrictions, and expiration dates. Every transaction is captured in real time with automated receipt matching via OCR, ensuring compliance and eliminating missing receipt headaches. Managers and finance teams get full visibility into spend patterns through dashboards, alerts, and exportable reports.',
    keyFeatures: [
      'Instant virtual card issuance with customizable spend limits and expiration',
      'Physical card ordering with chip-and-PIN and contactless payment support',
      'Real-time transaction feed with push notifications for every charge',
      'Automated receipt matching using OCR and email forwarding',
      'Merchant category code (MCC) restrictions to control where cards can be used',
      'Per-transaction and monthly spending limits with automatic decline on breach',
      'Card freeze and unfreeze with one click for lost or compromised cards',
      'Spend analytics dashboards with category breakdowns and trend analysis',
    ],
    screenshotKey: 'corporate-cards/overview',
  },

  workflows: [
    {
      id: 'issue-virtual-card',
      title: 'Issuing a Virtual Card',
      description:
        'Create a virtual corporate card with custom spend limits and merchant restrictions for online purchases, subscriptions, or vendor payments.',
      estimatedTime: '3 minutes',
      roles: ['owner', 'admin', 'manager'],
      steps: [
        {
          number: 1,
          title: 'Navigate to Corporate Cards',
          description:
            'Click "Corporate Cards" under IT & Finance in the left sidebar. The card management view opens showing all active cards, organized by cardholder with status indicators.',
          screenshotKey: 'corporate-cards/issue-virtual-step-1',
        },
        {
          number: 2,
          title: 'Start card creation',
          description:
            'Click "+ Issue Card" and select "Virtual Card." Choose the cardholder from the employee directory. If issuing for yourself, your name is pre-selected.',
          screenshotKey: 'corporate-cards/issue-virtual-step-2',
        },
        {
          number: 3,
          title: 'Configure spend controls',
          description:
            'Set the card parameters: spending limit (per-transaction and/or monthly), allowed merchant categories (e.g., Software, Travel, Office Supplies), currency, and expiration date. Use the "Single-Use" toggle for one-time purchases that automatically deactivate after the first charge.',
          screenshotKey: 'corporate-cards/issue-virtual-step-3',
          tip: 'Single-use virtual cards are ideal for free trial sign-ups — the card deactivates after the first charge, preventing unwanted recurring charges.',
        },
        {
          number: 4,
          title: 'Add a purpose and budget link',
          description:
            'Enter a description of the card purpose (e.g., "Adobe Creative Cloud annual subscription"). Optionally link the card to a budget category or project code so transactions automatically map to the correct budget line.',
          screenshotKey: 'corporate-cards/issue-virtual-step-4',
        },
        {
          number: 5,
          title: 'Issue the card',
          description:
            'Click "Issue Card" to generate the virtual card instantly. The card number, expiration, and CVV are displayed to the cardholder in their secure card wallet. An email notification is sent with activation instructions.',
          screenshotKey: 'corporate-cards/issue-virtual-step-5',
        },
      ],
    },
    {
      id: 'manage-transactions',
      title: 'Reviewing and Categorizing Transactions',
      description:
        'Monitor real-time card transactions, match receipts, categorize expenses, and flag anomalies for review.',
      estimatedTime: '5 minutes',
      roles: ['owner', 'admin', 'manager', 'employee'],
      steps: [
        {
          number: 1,
          title: 'Open the transaction feed',
          description:
            'Navigate to Corporate Cards > Transactions. The feed displays all card transactions in reverse chronological order with merchant name, amount, category, receipt status, and cardholder. Use filters to narrow by date range, cardholder, card, or category.',
          screenshotKey: 'corporate-cards/transactions-step-1',
        },
        {
          number: 2,
          title: 'Match receipts to transactions',
          description:
            'Transactions with unmatched receipts show a yellow "Receipt Missing" badge. Click the badge to upload a receipt photo or PDF. The OCR engine extracts the merchant, date, and amount, and auto-matches it to the transaction if the details align.',
          screenshotKey: 'corporate-cards/transactions-step-2',
          tip: 'Enable the receipt forwarding email address so cardholders can email receipts directly — they are matched to transactions automatically.',
        },
        {
          number: 3,
          title: 'Categorize and add notes',
          description:
            'Click any transaction to open its detail panel. Assign or change the expense category, add a description or note, and tag it with a project or cost center code. Auto-categorization uses the merchant category code as a default, but you can override it.',
          screenshotKey: 'corporate-cards/transactions-step-3',
        },
        {
          number: 4,
          title: 'Flag suspicious transactions',
          description:
            'If a transaction looks incorrect or unauthorized, click the flag icon to mark it for investigation. Flagged transactions are highlighted in red and sent to the finance team for review. The card can be frozen immediately from the same screen.',
          screenshotKey: 'corporate-cards/transactions-step-4',
        },
        {
          number: 5,
          title: 'Export transaction data',
          description:
            'Click "Export" to download transactions as CSV or PDF for expense reporting, accounting imports, or audit purposes. Filter the export by date range, cardholder, or category to get exactly the data you need.',
          screenshotKey: 'corporate-cards/transactions-step-5',
        },
      ],
    },
    {
      id: 'manage-card-controls',
      title: 'Managing Card Controls and Limits',
      description:
        'Adjust spending limits, merchant restrictions, and card status for active corporate cards to maintain spend governance.',
      estimatedTime: '3 minutes',
      roles: ['owner', 'admin', 'manager'],
      steps: [
        {
          number: 1,
          title: 'Select the card to manage',
          description:
            'From the Corporate Cards dashboard, click on a card to open its management panel. The panel displays the card details, current limits, recent transactions, and status (Active, Frozen, or Cancelled).',
          screenshotKey: 'corporate-cards/controls-step-1',
        },
        {
          number: 2,
          title: 'Update spending limits',
          description:
            'Click "Edit Limits" to adjust the per-transaction limit, daily limit, or monthly limit. Changes take effect immediately. The system logs the change with your name, timestamp, and the previous values for audit purposes.',
          screenshotKey: 'corporate-cards/controls-step-2',
        },
        {
          number: 3,
          title: 'Modify merchant restrictions',
          description:
            'Click "Merchant Controls" to update the allowed or blocked merchant categories. You can allow all categories and block specific ones (blocklist mode) or block all and allow specific ones (allowlist mode). Changes apply to future transactions only.',
          screenshotKey: 'corporate-cards/controls-step-3',
          tip: 'Use allowlist mode for project-specific cards to ensure spend stays within the intended category.',
        },
        {
          number: 4,
          title: 'Freeze or cancel the card',
          description:
            'Click "Freeze Card" to temporarily disable all transactions while keeping the card active. Frozen cards can be unfrozen instantly. Click "Cancel Card" to permanently deactivate it. Cancelled cards cannot be reactivated — a new card must be issued.',
          screenshotKey: 'corporate-cards/controls-step-4',
        },
      ],
    },
    {
      id: 'spend-analytics',
      title: 'Analyzing Card Spend Patterns',
      description:
        'Use the spend analytics dashboard to understand spending trends by category, department, and cardholder, and identify opportunities for cost optimization.',
      estimatedTime: '4 minutes',
      roles: ['owner', 'admin'],
      steps: [
        {
          number: 1,
          title: 'Access the analytics dashboard',
          description:
            'Navigate to Corporate Cards > Analytics. The dashboard opens with a summary view showing total card spend for the selected period, number of active cards, average transaction size, and receipt compliance rate.',
          screenshotKey: 'corporate-cards/analytics-step-1',
        },
        {
          number: 2,
          title: 'Review spend by category',
          description:
            'The category breakdown chart shows spending distribution across merchant categories (Travel, Software, Office Supplies, Meals, etc.). Click any category slice to drill down into individual transactions within that category.',
          screenshotKey: 'corporate-cards/analytics-step-2',
        },
        {
          number: 3,
          title: 'Analyze spend by department',
          description:
            'Switch to the "By Department" view to see card spending aggregated by organizational unit. Compare departments against their card budget allocations and identify outliers. Sort by total spend, number of transactions, or budget utilization percentage.',
          screenshotKey: 'corporate-cards/analytics-step-3',
        },
        {
          number: 4,
          title: 'Identify optimization opportunities',
          description:
            'The "Insights" panel highlights potential savings opportunities such as duplicate subscriptions across cardholders, vendors offering volume discounts, or unused cards that could be cancelled. Each insight includes an estimated annual savings figure.',
          screenshotKey: 'corporate-cards/analytics-step-4',
          tip: 'Review the insights panel monthly — duplicate subscription detection alone can save organizations thousands per year.',
        },
        {
          number: 5,
          title: 'Generate a spend report',
          description:
            'Click "Generate Report" to create a formatted spend report. Choose the period, scope (all cards, by department, or by cardholder), and level of detail. Reports can be downloaded as PDF or scheduled for automatic monthly delivery to stakeholders.',
          screenshotKey: 'corporate-cards/analytics-step-5',
        },
      ],
    },
  ],

  faqs: [
    {
      question: 'How quickly is a virtual card available after issuance?',
      answer:
        'Virtual cards are generated instantly. The card number, expiration date, and CVV are available in the cardholder\'s secure wallet immediately after issuance. The cardholder also receives an email notification. Virtual cards can be used for online purchases right away.',
    },
    {
      question: 'What happens when a transaction is declined?',
      answer:
        'Declined transactions appear in the transaction feed with a "Declined" status and the decline reason (e.g., insufficient limit, blocked merchant category, frozen card). The cardholder receives a push notification explaining the decline. Admins can review all declined transactions in the "Declined" tab for pattern analysis.',
    },
    {
      question: 'How does the automatic receipt matching work?',
      answer:
        'Receipt matching works in three ways: (1) Cardholders can photograph and upload receipts in the app, which uses OCR to extract details and match to recent transactions. (2) Receipts emailed to your dedicated forwarding address are parsed and matched automatically. (3) Receipts from integrated vendors (e.g., Amazon Business, Uber) are captured directly via API. Matching uses merchant name, date, and amount with fuzzy tolerance for small discrepancies.',
    },
    {
      question: 'Can I set different spend limits for different merchants?',
      answer:
        'You cannot set per-merchant dollar limits directly, but you can use merchant category restrictions to control which types of merchants the card works with, and set overall per-transaction and monthly limits. For vendor-specific control, consider issuing a dedicated virtual card for that vendor with a custom limit.',
    },
    {
      question: 'What is the difference between freezing and cancelling a card?',
      answer:
        'Freezing temporarily disables a card — all transactions are declined, but the card remains in the system and can be unfrozen instantly. Cancelling permanently deactivates the card and it cannot be recovered. Freeze a card when it might be misplaced; cancel it when an employee leaves or the card is confirmed compromised.',
    },
    {
      question: 'Are corporate card transactions automatically synced to the budget tracker?',
      answer:
        'Yes. Every approved card transaction flows into the Budgets module automatically, mapped to the appropriate budget category via GL account code. If a card is linked to a specific budget or project, transactions map directly to that line item. Unlinked transactions use the merchant category code for auto-mapping.',
    },
  ],

  tips: [
    'Issue single-use virtual cards for free trials and one-time vendor payments to prevent unexpected recurring charges.',
    'Enable the receipt forwarding email address for each cardholder to streamline receipt capture — just forward the emailed receipt.',
    'Review the spend analytics "Insights" panel monthly to catch duplicate subscriptions and unused cards.',
    'Use merchant category restrictions to ensure project-specific cards can only be used at relevant vendor types.',
    'Set up real-time push notifications for card transactions so cardholders are immediately aware of any charges.',
    'Freeze cards before cancelling when unsure — you can always unfreeze, but cancellation is permanent.',
  ],

  relatedModules: ['finance/budgets', 'finance/invoices', 'finance/global-spend', 'finance/bill-pay'],

  permissions: [
    {
      role: 'Owner',
      capabilities: [
        'Issue, freeze, and cancel any corporate card in the organization',
        'Configure global card policies, default limits, and merchant restrictions',
        'Access all transaction data and spend analytics across the organization',
        'Generate and schedule organization-wide spend reports',
        'Manage card program settings and provider integrations',
      ],
    },
    {
      role: 'Admin',
      capabilities: [
        'Issue, freeze, and cancel cards within assigned departments',
        'Set and modify spend limits and merchant restrictions for department cards',
        'Access transaction data and analytics for assigned scope',
        'Review and resolve flagged transactions',
        'Generate departmental spend reports',
      ],
    },
    {
      role: 'Manager',
      capabilities: [
        'Request card issuance for direct reports (subject to Admin approval)',
        'View transactions for cards issued to their team members',
        'Freeze cards issued to their direct reports in case of emergency',
        'Review receipt compliance for their team',
      ],
    },
    {
      role: 'Employee',
      capabilities: [
        'View their own card details and transaction history',
        'Upload and match receipts to their transactions',
        'Freeze their own card if lost or compromised',
        'Request a spend limit increase (subject to manager approval)',
      ],
    },
  ],
}

export default corporateCards
