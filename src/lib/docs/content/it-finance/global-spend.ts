import type { ModuleDoc } from '../../types'

const globalSpend: ModuleDoc = {
  slug: 'finance/global-spend',
  title: 'Global Spend',
  subtitle: 'Multi-currency spend analytics, FX transaction management, and cross-border payment optimization for global organizations',
  icon: 'Globe',
  group: 'it-finance',
  lastUpdated: '2026-03-13',
  version: '1.0',

  overview: {
    description:
      'The Global Spend module provides comprehensive visibility into spending across all countries, currencies, and entities within your organization. Consolidate financial data from invoices, corporate cards, bill payments, payroll, and expense reports into a unified multi-currency view. Track foreign exchange exposure, analyze cross-border payment costs, and optimize currency conversion timing. The module supports organizations operating in multiple jurisdictions with automated regulatory compliance, transfer pricing visibility, and intercompany settlement workflows.',
    keyFeatures: [
      'Consolidated multi-currency spend dashboard with real-time FX conversion',
      'Country-by-country spend breakdown with regulatory compliance indicators',
      'FX exposure analysis with hedging opportunity recommendations',
      'Cross-border payment tracking with intermediary bank fee visibility',
      'Intercompany transaction management and settlement reconciliation',
      'Transfer pricing documentation and compliance monitoring',
      'Multi-entity consolidation with elimination of intercompany balances',
      'Currency-adjusted trend analysis with constant-currency comparisons',
    ],
    screenshotKey: 'global-spend/overview',
  },

  workflows: [
    {
      id: 'consolidated-view',
      title: 'Viewing Consolidated Global Spend',
      description:
        'Access a unified view of all organizational spending across countries and currencies, with drill-down capability into regions, entities, and individual transactions.',
      estimatedTime: '4 minutes',
      roles: ['owner', 'admin'],
      steps: [
        {
          number: 1,
          title: 'Navigate to Global Spend',
          description:
            'Click "Global Spend" under IT & Finance in the left sidebar. The module opens to the consolidated dashboard showing total organization-wide spend in your base currency, with a world map visualization highlighting active countries.',
          screenshotKey: 'global-spend/consolidated-step-1',
        },
        {
          number: 2,
          title: 'Review the global summary',
          description:
            'The summary row displays total spend, number of active currencies, number of countries with operations, and total FX conversion costs for the selected period. Below the summary, a currency breakdown table shows spend in each currency with the base currency equivalent.',
          screenshotKey: 'global-spend/consolidated-step-2',
        },
        {
          number: 3,
          title: 'Drill into a country or region',
          description:
            'Click any country on the map or select a region from the dropdown to filter the view. The dashboard updates to show only spend from that geography, broken down by category, entity, and payment method. Key compliance indicators for that jurisdiction are displayed in a sidebar panel.',
          screenshotKey: 'global-spend/consolidated-step-3',
          tip: 'Use the region dropdown to view spend for predefined groups like EMEA, APAC, or Americas for quick regional comparisons.',
        },
        {
          number: 4,
          title: 'Compare periods and currencies',
          description:
            'Use the period selector to compare current spend against the prior period, prior year, or budget. Toggle "Constant Currency" mode to isolate operational spend changes from FX fluctuation effects. The comparison table highlights increases in green and decreases in red.',
          screenshotKey: 'global-spend/consolidated-step-4',
        },
        {
          number: 5,
          title: 'Export the consolidated report',
          description:
            'Click "Export" to generate a consolidated spend report in PDF or Excel format. The report includes the global summary, country-level breakdowns, currency analysis, and FX impact. Choose the level of detail: summary (executive-level), standard, or detailed (transaction-level).',
          screenshotKey: 'global-spend/consolidated-step-5',
        },
      ],
    },
    {
      id: 'fx-management',
      title: 'Managing Foreign Exchange Exposure',
      description:
        'Analyze your organization\'s FX exposure across currencies, review conversion costs, and identify hedging opportunities to minimize exchange rate risk.',
      estimatedTime: '5 minutes',
      roles: ['owner', 'admin'],
      steps: [
        {
          number: 1,
          title: 'Open the FX dashboard',
          description:
            'Navigate to Global Spend > FX Management. The dashboard shows your total FX exposure by currency, with each currency\'s percentage of total spend, current exchange rate to your base currency, and the rate change over the selected period.',
          screenshotKey: 'global-spend/fx-step-1',
        },
        {
          number: 2,
          title: 'Review FX conversion costs',
          description:
            'The "Conversion Costs" panel shows the total cost of currency conversions for the period, broken down by transaction type (invoices, payroll, card transactions, wire transfers). The effective rate vs. mid-market rate comparison reveals the spread you are paying.',
          screenshotKey: 'global-spend/fx-step-2',
          tip: 'Compare your effective FX rate against the mid-market rate to identify if you are overpaying on currency conversions.',
        },
        {
          number: 3,
          title: 'Analyze rate trends',
          description:
            'Click any currency pair to see a historical rate chart with your transaction points overlaid. This visualization shows whether your conversion timing has been favorable or unfavorable relative to the period average and low points.',
          screenshotKey: 'global-spend/fx-step-3',
        },
        {
          number: 4,
          title: 'Review hedging recommendations',
          description:
            'The "Hedging Opportunities" panel analyzes your recurring FX obligations (payroll, rent, subscriptions) and suggests forward contracts or natural hedging strategies to reduce rate volatility risk. Each recommendation includes the estimated annual savings and implementation steps.',
          screenshotKey: 'global-spend/fx-step-4',
        },
        {
          number: 5,
          title: 'Set rate alert thresholds',
          description:
            'Click "Rate Alerts" to configure notifications when exchange rates hit specified thresholds. Set target rates for currencies you frequently transact in, and receive email or in-app alerts when favorable rates are available for upcoming payments.',
          screenshotKey: 'global-spend/fx-step-5',
        },
      ],
    },
    {
      id: 'cross-border-payments',
      title: 'Tracking Cross-Border Payments',
      description:
        'Monitor international payment flows, track intermediary bank fees, and optimize payment routing to minimize costs and settlement time.',
      estimatedTime: '4 minutes',
      roles: ['owner', 'admin', 'manager'],
      steps: [
        {
          number: 1,
          title: 'Open the cross-border tracker',
          description:
            'Navigate to Global Spend > Cross-Border Payments. The tracker lists all international payments with columns for source country, destination country, currency pair, amount, payment method, fees, and settlement status.',
          screenshotKey: 'global-spend/crossborder-step-1',
        },
        {
          number: 2,
          title: 'Review fee breakdowns',
          description:
            'Click any payment to see the full fee breakdown: originating bank fee, intermediary bank fees (correspondent charges), FX conversion spread, and receiving bank fee. The total cost as a percentage of the payment amount is highlighted for transparency.',
          screenshotKey: 'global-spend/crossborder-step-2',
        },
        {
          number: 3,
          title: 'Compare payment corridors',
          description:
            'The "Corridors" tab aggregates payment data by country pair (e.g., US to UK, US to India). For each corridor, see total volume, average fees, average settlement time, and the most cost-effective payment method. Use this to optimize routing for frequent corridors.',
          screenshotKey: 'global-spend/crossborder-step-3',
          tip: 'High-volume corridors may benefit from local currency accounts to avoid intermediary bank fees entirely.',
        },
        {
          number: 4,
          title: 'Track settlement in real time',
          description:
            'Each cross-border payment shows a timeline of settlement stages: Initiated, Sent to Bank, In Transit, Arrived at Intermediary, Credited to Beneficiary. Status updates are pulled from banking APIs where available. Delays are flagged with estimated resolution times.',
          screenshotKey: 'global-spend/crossborder-step-4',
        },
      ],
    },
    {
      id: 'intercompany-settlements',
      title: 'Managing Intercompany Settlements',
      description:
        'Track, net, and settle intercompany transactions across entities to simplify internal financial flows and maintain clean transfer pricing documentation.',
      estimatedTime: '6 minutes',
      roles: ['owner', 'admin'],
      steps: [
        {
          number: 1,
          title: 'View intercompany balances',
          description:
            'Navigate to Global Spend > Intercompany. The balance matrix shows amounts owed between each pair of entities. Rows represent paying entities and columns represent receiving entities. Net balances are calculated automatically.',
          screenshotKey: 'global-spend/intercompany-step-1',
        },
        {
          number: 2,
          title: 'Review pending transactions',
          description:
            'Click "Pending Transactions" to see all unreconciled intercompany charges. Each transaction shows the originating entity, receiving entity, description, amount, and whether both sides have confirmed the charge. Mismatches between entities are flagged for resolution.',
          screenshotKey: 'global-spend/intercompany-step-2',
          tip: 'Resolve mismatches promptly — unreconciled intercompany balances create complications during month-end close.',
        },
        {
          number: 3,
          title: 'Run netting calculation',
          description:
            'Click "Calculate Netting" to compute the net settlement amounts between all entity pairs. The netting engine reduces the number of actual payments needed by offsetting mutual obligations. Review the netting proposal showing gross amounts, offsets, and net settlements per entity pair.',
          screenshotKey: 'global-spend/intercompany-step-3',
        },
        {
          number: 4,
          title: 'Approve and execute settlement',
          description:
            'Review the net settlement amounts and click "Approve Settlement" to generate payment instructions for each net transfer. Authorized personnel from each entity must confirm before execution. Settled transactions are marked as reconciled and removed from the pending queue.',
          screenshotKey: 'global-spend/intercompany-step-4',
        },
        {
          number: 5,
          title: 'Generate transfer pricing documentation',
          description:
            'Click "TP Documentation" to generate a summary of intercompany transactions for transfer pricing compliance. The report groups transactions by type (service charges, royalties, cost allocations) and includes supporting details required by tax authorities.',
          screenshotKey: 'global-spend/intercompany-step-5',
        },
      ],
    },
  ],

  faqs: [
    {
      question: 'Which exchange rates are used for currency conversion?',
      answer:
        'The module uses daily mid-market exchange rates from a leading financial data provider, updated at midnight UTC. For actual payment conversions, the rate applied by your bank at the time of transaction is used. The dashboard displays both the mid-market rate and the effective rate you received so you can assess the spread.',
    },
    {
      question: 'What does "constant currency" comparison mean?',
      answer:
        'Constant currency mode recalculates prior-period spend using current-period exchange rates (or vice versa). This removes the effect of currency fluctuations, allowing you to see the true operational change in spending. For example, if spending in GBP stayed flat but the GBP appreciated, a nominal comparison would show an increase, while constant currency would show no change.',
    },
    {
      question: 'How are intercompany transactions identified?',
      answer:
        'Intercompany transactions are identified automatically when the vendor or payer entity on a transaction matches another entity in your organization. You can also tag transactions as intercompany manually. The system prompts the counterparty entity to confirm the transaction, creating a matched pair for reconciliation.',
    },
    {
      question: 'Can I see a breakdown of intermediary bank fees?',
      answer:
        'Yes. For wire transfers, the system captures fees charged by originating, intermediary, and beneficiary banks when this data is available from your banking provider. The cross-border payment detail view shows each fee component. For corridors where intermediary fees are significant, the system recommends alternative routing or local currency accounts.',
    },
    {
      question: 'How does the netting engine reduce payment costs?',
      answer:
        'The netting engine calculates mutual obligations between entity pairs and offsets them, so only the net difference is actually transferred. For example, if Entity A owes Entity B $100,000 and Entity B owes Entity A $80,000, only a single $20,000 payment is needed instead of two separate transfers. This reduces bank fees, FX conversion costs, and administrative overhead.',
    },
    {
      question: 'Does the module support regulatory reporting for different countries?',
      answer:
        'The module tracks country-specific compliance indicators and flags transactions that may require regulatory reporting (e.g., large value transfers, transactions with sanctioned jurisdictions). It does not generate regulatory filings directly, but provides the underlying data and audit trail needed for your compliance team to prepare them.',
    },
  ],

  tips: [
    'Use "Constant Currency" mode when presenting spend trends to leadership — it isolates real spending changes from FX noise.',
    'Review the FX Conversion Costs panel quarterly to ensure you are getting competitive rates from your banking providers.',
    'Set up rate alerts for currencies you transact in frequently so you can time large payments when rates are favorable.',
    'Run intercompany netting monthly to minimize the number of cross-border transfers and reduce associated fees.',
    'Use the payment corridor analysis to identify high-volume routes where opening a local currency account could save on intermediary fees.',
    'Export country-level spend reports for each jurisdiction to support your local finance teams during tax season.',
  ],

  relatedModules: ['finance/invoices', 'finance/bill-pay', 'finance/budgets', 'finance/cards'],

  permissions: [
    {
      role: 'Owner',
      capabilities: [
        'Access full consolidated global spend data across all entities and currencies',
        'Configure FX rate providers, hedging policies, and alert thresholds',
        'Approve intercompany netting settlements and transfer pricing documentation',
        'Generate and distribute organization-wide global spend reports',
        'Manage multi-entity structure and consolidation rules',
      ],
    },
    {
      role: 'Admin',
      capabilities: [
        'View global spend data for assigned entities or regions',
        'Access FX exposure analysis and cross-border payment tracking',
        'Initiate intercompany netting calculations for assigned entities',
        'Generate regional spend reports and export transaction data',
      ],
    },
    {
      role: 'Manager',
      capabilities: [
        'View spend data for their department across all currencies',
        'Access cross-border payment status for payments they initiated',
        'View currency-adjusted budget comparisons for their department',
      ],
    },
    {
      role: 'Employee',
      capabilities: [
        'View their own cross-border expense and reimbursement status',
        'See exchange rates applied to their international transactions',
      ],
    },
  ],
}

export default globalSpend
