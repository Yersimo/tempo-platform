import type { ModuleDoc } from '../../types'

const benefits: ModuleDoc = {
  slug: 'benefits',
  title: 'Benefits',
  subtitle: 'Benefit plan management, enrollment, life events, HSA/FSA administration, and dependent tracking',
  icon: 'Shield',
  group: 'operations',
  lastUpdated: '2026-03-13',
  version: '1.0',

  overview: {
    description:
      'The Benefits module provides end-to-end management of employee benefit programs including health insurance, dental, vision, life insurance, disability, retirement plans, and flexible spending accounts (HSA/FSA). Administrators can configure benefit plans with eligibility rules, enrollment windows, and premium structures. Employees can compare plans side-by-side, enroll during open enrollment or qualifying life events, add dependents, and track their benefit utilization. The module integrates with Payroll for automatic premium deductions and with the People module for eligibility determination based on employment type, tenure, and location.',
    keyFeatures: [
      'Configurable benefit plan library with multiple plan tiers (Basic, Standard, Premium)',
      'Open enrollment management with configurable enrollment windows and deadlines',
      'Life event processing for qualifying changes (marriage, birth, divorce, relocation)',
      'Side-by-side plan comparison tool with cost and coverage breakdowns',
      'Dependent management with relationship tracking and documentation',
      'HSA and FSA account administration with contribution limits and balance tracking',
      'Automatic payroll deduction integration for premium payments',
      'COBRA and continuation coverage management for terminated employees',
      'Carrier feed generation for enrollment data transmission to insurance providers',
      'Benefits cost analytics with employer vs. employee contribution breakdowns',
      'Multi-country support with country-specific plan types and regulatory compliance',
      'Evidence of Insurability (EOI) workflow for high-value coverage elections',
    ],
    screenshotKey: 'benefits/overview',
  },

  workflows: [
    {
      id: 'enroll-benefit-plan',
      title: 'Enrolling in a Benefit Plan',
      description:
        'Walk through the process of selecting and enrolling in benefit plans during open enrollment or after a qualifying life event. This workflow is written from the employee perspective but applies equally to HR administrators enrolling employees on their behalf.',
      estimatedTime: '10 minutes',
      roles: ['owner', 'admin', 'hrbp', 'employee'],
      prerequisites: [
        'The employee must have an active employment status',
        'An open enrollment window must be active, or the employee must have a qualifying life event',
        'The employee\'s profile must have a valid country and employment type for eligibility checks',
      ],
      steps: [
        {
          number: 1,
          title: 'Navigate to Benefits',
          description:
            'Click "Benefits" in the left sidebar under the Operations section. The Benefits landing page shows your current enrollment summary, upcoming enrollment windows, and any pending actions.',
          screenshotKey: 'benefits/enroll-step-1',
        },
        {
          number: 2,
          title: 'Start enrollment',
          description:
            'Click "Enroll Now" if an open enrollment window is active, or "Report Life Event" if you need to make changes outside the enrollment window. For life events, you will be prompted to select the event type (marriage, birth, adoption, divorce, loss of coverage, relocation) and provide the event date.',
          screenshotKey: 'benefits/enroll-step-2',
          tip: 'Life event changes must be initiated within 30 days of the qualifying event. Supporting documentation may be required.',
        },
        {
          number: 3,
          title: 'Review eligible plans',
          description:
            'The enrollment wizard displays all benefit categories available to you: Medical, Dental, Vision, Life Insurance, Disability, and Retirement. Each category shows the available plans with a summary of coverage levels and monthly premiums.',
          screenshotKey: 'benefits/enroll-step-3',
        },
        {
          number: 4,
          title: 'Compare plans side-by-side',
          description:
            'Click "Compare Plans" within any benefit category to open the comparison view. This shows coverage details, deductibles, co-pays, out-of-pocket maximums, network information, and costs side-by-side for up to three plans. Employee cost, employer contribution, and total premium are clearly separated.',
          screenshotKey: 'benefits/enroll-step-4',
        },
        {
          number: 5,
          title: 'Select your plans',
          description:
            'Click "Select" on the plan you want to enroll in for each benefit category. You can also choose "Waive" to opt out of a category. Some categories (like Life Insurance) may have minimum required coverage that cannot be waived.',
          screenshotKey: 'benefits/enroll-step-5',
          tip: 'If you select a high-value life insurance option, you may be required to complete Evidence of Insurability (EOI). Tempo will guide you through this process.',
        },
        {
          number: 6,
          title: 'Add dependents',
          description:
            'If enrolling in medical, dental, or vision plans that cover dependents, the wizard prompts you to add or confirm your dependents. Enter each dependent\'s name, date of birth, relationship, and Social Security Number (or equivalent ID). Upload supporting documentation such as a birth certificate or marriage certificate if required.',
          screenshotKey: 'benefits/enroll-step-6',
        },
        {
          number: 7,
          title: 'Review total cost',
          description:
            'The enrollment summary page shows all selected plans, covered dependents, per-paycheck deduction amounts, and the annual total. The payroll deduction frequency (monthly, bi-weekly, etc.) matches your pay schedule.',
          screenshotKey: 'benefits/enroll-step-7',
        },
        {
          number: 8,
          title: 'Confirm enrollment',
          description:
            'Review the enrollment summary and click "Confirm Enrollment". A confirmation page and email are generated with your election details. Enrollment is effective on the plan\'s coverage start date. Payroll deductions begin in the next pay period after the coverage start date.',
          screenshotKey: 'benefits/enroll-step-8',
        },
      ],
    },
    {
      id: 'add-dependents',
      title: 'Adding and Managing Dependents',
      description:
        'Add new dependents to your benefit elections, update existing dependent information, or remove dependents who are no longer eligible.',
      estimatedTime: '5 minutes',
      roles: ['owner', 'admin', 'hrbp', 'employee'],
      steps: [
        {
          number: 1,
          title: 'Open the Dependents section',
          description:
            'In the Benefits module, click the "My Dependents" tab (or "Employee Dependents" for HR administrators). This shows a list of all currently registered dependents with their name, relationship, date of birth, and coverage status.',
          screenshotKey: 'benefits/dependents-step-1',
        },
        {
          number: 2,
          title: 'Add a new dependent',
          description:
            'Click "+ Add Dependent". Fill in the dependent\'s full name, date of birth, relationship to the employee (spouse, child, domestic partner, other), gender, and identification number (SSN or equivalent). Indicate whether the dependent should be added to existing benefit plans.',
          screenshotKey: 'benefits/dependents-step-2',
        },
        {
          number: 3,
          title: 'Upload supporting documentation',
          description:
            'Upload required documentation to verify the dependent relationship. Accepted documents include: birth certificates (for children), marriage certificates (for spouses), domestic partnership agreements, legal adoption documents, or court orders for guardianship. Documents are stored securely and accessible only to Benefits administrators.',
          screenshotKey: 'benefits/dependents-step-3',
          tip: 'Documents must be in PDF, PNG, or JPEG format and under 10 MB per file.',
        },
        {
          number: 4,
          title: 'Select coverage plans',
          description:
            'Choose which of your active benefit plans should cover the new dependent. The premium adjustment is calculated and displayed in real-time. Note that adding a dependent outside of open enrollment requires a qualifying life event to have been reported.',
          screenshotKey: 'benefits/dependents-step-4',
        },
        {
          number: 5,
          title: 'Submit for verification',
          description:
            'Click "Submit" to add the dependent. The dependent\'s information is submitted for verification by the Benefits administrator. Once approved, the dependent is added to the selected plans and payroll deductions are adjusted accordingly.',
          screenshotKey: 'benefits/dependents-step-5',
        },
      ],
    },
    {
      id: 'manage-life-events',
      title: 'Managing Qualifying Life Events',
      description:
        'Process qualifying life events that allow employees to make changes to their benefit elections outside of the annual open enrollment period.',
      estimatedTime: '8 minutes',
      roles: ['owner', 'admin', 'hrbp', 'employee'],
      steps: [
        {
          number: 1,
          title: 'Report a life event',
          description:
            'In the Benefits module, click "Report Life Event". Select the type of event from the list: Marriage, Birth/Adoption, Divorce/Legal Separation, Death of Dependent, Loss of Other Coverage, Gain of Other Coverage, or Change in Residence.',
          screenshotKey: 'benefits/life-events-step-1',
        },
        {
          number: 2,
          title: 'Provide event details',
          description:
            'Enter the date of the qualifying event. This date determines the enrollment change window (typically 30 days from the event). Add any relevant notes, such as the name of the new spouse or child.',
          screenshotKey: 'benefits/life-events-step-2',
          tip: 'The event date must be within the last 30 days. If more than 30 days have passed, contact your Benefits administrator for an exception review.',
        },
        {
          number: 3,
          title: 'Upload documentation',
          description:
            'Upload supporting documents for the life event. Required documents vary by event type: marriage certificate for marriage, birth certificate for birth/adoption, court decree for divorce, death certificate for death of dependent, or termination of coverage letter for loss of other coverage.',
          screenshotKey: 'benefits/life-events-step-3',
        },
        {
          number: 4,
          title: 'Make enrollment changes',
          description:
            'Once the life event is submitted, the enrollment wizard opens showing only the benefit categories affected by the event type. Make your desired changes -- add or remove dependents, upgrade or downgrade plans, or add new coverage. Changes permitted depend on the event type.',
          screenshotKey: 'benefits/life-events-step-4',
        },
        {
          number: 5,
          title: 'Review and confirm changes',
          description:
            'Review the summary of changes including new plan selections, added or removed dependents, and the updated per-paycheck deduction. Click "Confirm Changes" to submit. Changes take effect on the date specified by the plan rules (typically the first of the following month).',
          screenshotKey: 'benefits/life-events-step-5',
        },
        {
          number: 6,
          title: 'Administrator review',
          description:
            'Life event changes are routed to the Benefits administrator for review and approval. The administrator verifies the supporting documentation, confirms the event qualifies for a special enrollment period, and approves or requests additional information.',
          screenshotKey: 'benefits/life-events-step-6',
        },
      ],
    },
    {
      id: 'compare-plans',
      title: 'Comparing Benefit Plans',
      description:
        'Use the plan comparison tool to evaluate and compare available benefit options across coverage levels, costs, and provider networks.',
      estimatedTime: '5 minutes',
      roles: ['owner', 'admin', 'hrbp', 'manager', 'employee'],
      steps: [
        {
          number: 1,
          title: 'Access the plan catalog',
          description:
            'In the Benefits module, click "Plan Catalog" or navigate to the enrollment wizard. The catalog organizes plans by category: Medical, Dental, Vision, Life, Disability, and Retirement.',
          screenshotKey: 'benefits/compare-plans-step-1',
        },
        {
          number: 2,
          title: 'Select plans to compare',
          description:
            'Within a category, check the box next to 2-3 plans you want to compare. Click the "Compare Selected" button that appears at the bottom of the plan list.',
          screenshotKey: 'benefits/compare-plans-step-2',
        },
        {
          number: 3,
          title: 'Review the comparison table',
          description:
            'The comparison view displays plans in columns with rows for: monthly premium (employee vs. employer), annual deductible, co-pay/co-insurance, out-of-pocket maximum, prescription coverage, network type (HMO, PPO, HDHP), and key exclusions. Differences between plans are highlighted for easy identification.',
          screenshotKey: 'benefits/compare-plans-step-3',
          tip: 'Look at the total annual cost including premiums and expected out-of-pocket expenses, not just the monthly premium. An HDHP with lower premiums may save money if you are generally healthy.',
        },
        {
          number: 4,
          title: 'Use the cost estimator',
          description:
            'Click "Estimate My Cost" to enter your expected annual healthcare usage (number of doctor visits, prescriptions, procedures). The estimator calculates the projected annual cost under each plan, helping you choose the most cost-effective option for your situation.',
          screenshotKey: 'benefits/compare-plans-step-4',
        },
      ],
    },
    {
      id: 'view-enrollment-summary',
      title: 'Viewing Your Enrollment Summary',
      description:
        'Review your current benefit enrollments, covered dependents, deduction amounts, and coverage details.',
      estimatedTime: '3 minutes',
      roles: ['owner', 'admin', 'hrbp', 'employee'],
      steps: [
        {
          number: 1,
          title: 'Open enrollment summary',
          description:
            'In the Benefits module, click "My Benefits" (or "Employee Benefits" for HR administrators viewing another employee). The summary page shows all active enrollments organized by benefit category.',
          screenshotKey: 'benefits/enrollment-summary-step-1',
        },
        {
          number: 2,
          title: 'Review plan details',
          description:
            'Each enrollment card shows the plan name, coverage tier (Employee Only, Employee + Spouse, Employee + Children, Family), your per-paycheck deduction, and the coverage effective date. Click "View Details" to see the full plan document including coverage limits, network information, and claims procedures.',
          screenshotKey: 'benefits/enrollment-summary-step-2',
        },
        {
          number: 3,
          title: 'Check covered dependents',
          description:
            'The "Covered Dependents" section lists all dependents enrolled in each plan with their names, dates of birth, and coverage status. Dependents pending verification are marked with a yellow "Pending" badge.',
          screenshotKey: 'benefits/enrollment-summary-step-3',
        },
        {
          number: 4,
          title: 'View deduction history',
          description:
            'Click "Deduction History" to see a month-by-month breakdown of benefit-related payroll deductions. This view reconciles with your payslips and shows any mid-period changes caused by enrollment modifications.',
          screenshotKey: 'benefits/enrollment-summary-step-4',
          tip: 'Download your annual Benefit Statement from this page for use during tax filing or for personal records.',
        },
      ],
    },
  ],

  faqs: [
    {
      question: 'When is the annual open enrollment period?',
      answer:
        'Open enrollment dates are configured by your organization\'s Benefits administrator. Typically, open enrollment runs for 2-4 weeks in Q4 of each year, with plan changes taking effect on January 1. You will receive email and in-app notifications when the enrollment window opens. Check the Benefits landing page for your organization\'s specific dates.',
    },
    {
      question: 'Can I change my benefit elections outside of open enrollment?',
      answer:
        'Yes, but only if you experience a qualifying life event such as marriage, birth/adoption of a child, divorce, loss of other coverage, or a change in residence that affects plan availability. You must report the life event within 30 days and provide supporting documentation.',
    },
    {
      question: 'How are benefit premiums deducted from my paycheck?',
      answer:
        'Benefit premiums are deducted automatically through payroll. The deduction frequency matches your pay schedule (monthly, bi-weekly, or weekly). Pre-tax deductions (medical, dental, vision, HSA) are taken before income tax is calculated, reducing your taxable income. Post-tax deductions (supplemental life insurance, some disability plans) are taken after tax.',
    },
    {
      question: 'What is an HSA and who is eligible?',
      answer:
        'A Health Savings Account (HSA) is a tax-advantaged savings account for medical expenses. To be eligible, you must be enrolled in a High Deductible Health Plan (HDHP). Contributions are pre-tax, earnings grow tax-free, and withdrawals for qualified medical expenses are tax-free. Your employer may also contribute to your HSA. Annual contribution limits are set by the IRS (or equivalent tax authority in your country).',
    },
    {
      question: 'What is the difference between an HSA and an FSA?',
      answer:
        'Both are tax-advantaged accounts for medical expenses. HSAs are available only with HDHPs, have no "use it or lose it" requirement, and balances roll over year to year. FSAs are available with any medical plan, but unspent funds are typically forfeited at year-end (some plans allow a small carryover or grace period). HSAs are owned by the employee and are portable; FSAs are employer-sponsored.',
    },
    {
      question: 'How do I add my newborn to my health insurance?',
      answer:
        'Report a "Birth/Adoption" life event in the Benefits module within 30 days of the birth. Upload the birth certificate as supporting documentation. During the life event enrollment change, add the child as a dependent and select which plans should cover them. Coverage for the newborn is typically retroactive to the date of birth.',
    },
    {
      question: 'What happens to my benefits when I leave the company?',
      answer:
        'Your benefit coverage typically ends on the last day of the month in which your employment terminates. You may be eligible for continuation coverage (COBRA in the US, or equivalent in other jurisdictions) which allows you to continue coverage at your own expense for a limited period. The Benefits administrator will provide you with continuation coverage information as part of the offboarding process.',
    },
    {
      question: 'Can I see what my employer contributes to my benefits?',
      answer:
        'Yes. The enrollment summary shows both the employee and employer contribution for each plan. Your Total Compensation Statement (available in the Compensation module) includes the full employer-paid benefits cost, giving you a complete picture of your total remuneration.',
    },
  ],

  tips: [
    'During open enrollment, start by reviewing your current elections to see if they still meet your needs before exploring new options.',
    'Use the plan comparison tool to estimate your total annual cost including premiums and expected out-of-pocket expenses, not just the monthly deduction.',
    'If you are eligible for an HSA, consider maximizing your contributions to take advantage of the triple tax benefit (tax-free contributions, growth, and qualified withdrawals).',
    'Keep your dependent information up to date throughout the year -- inaccurate dependent data can delay claims processing and cause enrollment issues.',
    'Report life events promptly -- the 30-day window is strictly enforced, and late submissions may result in having to wait until the next open enrollment.',
    'Download your annual Benefit Statement for personal records and tax filing purposes.',
    'Review the plan\'s provider network before selecting a medical plan to ensure your preferred doctors and hospitals are in-network.',
    'If you have a working spouse, compare the cost and coverage of both employers\' plans before deciding where to enroll.',
  ],

  relatedModules: ['payroll', 'people', 'compensation', 'offboarding'],

  permissions: [
    {
      role: 'Owner',
      capabilities: [
        'Configure benefit plans, eligibility rules, and enrollment windows',
        'View and manage enrollments for all employees',
        'Approve or reject life event changes and dependent verifications',
        'View benefits cost analytics and employer contribution reports',
        'Generate carrier feed files for insurance providers',
        'Manage HSA/FSA administration and contribution limits',
        'Configure COBRA and continuation coverage settings',
      ],
    },
    {
      role: 'Admin',
      capabilities: [
        'Configure benefit plans, eligibility rules, and enrollment windows',
        'View and manage enrollments for all employees',
        'Approve or reject life event changes and dependent verifications',
        'View benefits cost analytics and employer contribution reports',
        'Generate carrier feed files for insurance providers',
        'Manage HSA/FSA administration and contribution limits',
      ],
    },
    {
      role: 'HRBP',
      capabilities: [
        'View enrollments for employees in assigned departments',
        'Assist employees with enrollment questions and changes',
        'Approve dependent verifications for assigned employees',
        'View benefits analytics for assigned departments',
      ],
    },
    {
      role: 'Manager',
      capabilities: [
        'View aggregate benefits enrollment statistics for direct reports (no individual plan details)',
        'Receive notifications when direct reports have pending benefit actions',
      ],
    },
    {
      role: 'Employee',
      capabilities: [
        'View and enroll in eligible benefit plans during enrollment windows',
        'Report qualifying life events and make mid-year changes',
        'Add, edit, and remove dependents with documentation',
        'View own enrollment summary, coverage details, and deduction history',
        'Compare available plans using the side-by-side comparison tool',
        'Manage HSA/FSA contributions and view account balances',
        'Download annual Benefit Statement',
      ],
    },
  ],
}

export default benefits
