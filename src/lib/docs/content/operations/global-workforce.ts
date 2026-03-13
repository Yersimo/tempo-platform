import type { ModuleDoc } from '../../types'

const globalWorkforce: ModuleDoc = {
  slug: 'global-workforce',
  title: 'Global Workforce',
  subtitle: 'Employer of Record, Contractor of Record, PEO services, and multi-country workforce management',
  icon: 'Globe',
  group: 'operations',
  lastUpdated: '2026-03-13',
  version: '1.0',

  overview: {
    description:
      'The Global Workforce module enables organizations to hire, pay, and manage employees and contractors across borders without establishing local entities. Leverage Employer of Record (EOR) partnerships to compliantly employ workers in 150+ countries. Use Contractor of Record (COR) services to engage international freelancers with proper classification. Manage Professional Employer Organization (PEO) relationships for countries where you have a local entity but need HR infrastructure. All employment types are managed from a single interface with country-specific compliance built in.',
    keyFeatures: [
      'Employer of Record (EOR) hiring in 150+ countries without local entity setup',
      'Contractor of Record (COR) engagement with classification compliance',
      'PEO co-employment management for countries with local entities',
      'Country-specific employment contract generation with localized terms',
      'Multi-currency payroll processing with local tax compliance',
      'Statutory benefit administration by country (healthcare, pension, leave)',
      'Work permit and visa tracking with renewal alerts',
      'Global workforce dashboard with headcount, cost, and compliance status by country',
    ],
    screenshotKey: 'global-workforce/overview',
  },

  workflows: [
    {
      id: 'hire-via-eor',
      title: 'Hiring an Employee via Employer of Record',
      description:
        'Onboard a new employee in a country where you do not have a local entity using an EOR partner for compliant employment.',
      estimatedTime: '15 minutes',
      roles: ['owner', 'admin', 'hrbp'],
      steps: [
        {
          number: 1,
          title: 'Navigate to Global Workforce',
          description:
            'Open Global Workforce in the left sidebar. The dashboard shows your international headcount by country, active EOR/COR/PEO relationships, and compliance status indicators.',
          screenshotKey: 'global-workforce/eor-step-1',
        },
        {
          number: 2,
          title: 'Start a new international hire',
          description:
            'Click "+ New Hire." Select the employment country from the dropdown. The system identifies whether you have a local entity or need EOR/PEO services and recommends the appropriate path.',
          screenshotKey: 'global-workforce/eor-step-2',
        },
        {
          number: 3,
          title: 'Enter employee details',
          description:
            'Provide the new hire\'s personal information, job title, department, compensation (in local currency or USD with conversion), and start date. The system displays country-specific mandatory fields (e.g., tax ID format, social insurance number).',
          screenshotKey: 'global-workforce/eor-step-3',
          tip: 'Review the country profile for statutory benefits, mandatory leave entitlements, and notice period requirements before setting compensation.',
        },
        {
          number: 4,
          title: 'Generate the employment contract',
          description:
            'The system generates a country-compliant employment contract using localized templates. Review the contract which includes statutory clauses, probation terms, notice periods, and benefit entitlements required by local law.',
          screenshotKey: 'global-workforce/eor-step-4',
        },
        {
          number: 5,
          title: 'Submit for EOR processing',
          description:
            'Click "Submit to EOR." The EOR partner receives the hire request, finalizes local registration, and processes employment documentation. You receive status updates as the onboarding progresses through their compliance checks.',
          screenshotKey: 'global-workforce/eor-step-5',
        },
        {
          number: 6,
          title: 'Complete onboarding',
          description:
            'Once the EOR confirms employment activation, the employee appears in your Tempo directory and can access all assigned modules. Their payroll is processed through the EOR with invoicing to your organization.',
          screenshotKey: 'global-workforce/eor-step-6',
        },
      ],
    },
    {
      id: 'engage-contractor',
      title: 'Engaging an International Contractor',
      description:
        'Onboard an international contractor with proper classification, compliant agreements, and payment processing through a Contractor of Record.',
      estimatedTime: '10 minutes',
      roles: ['admin', 'hrbp', 'manager'],
      steps: [
        {
          number: 1,
          title: 'Initiate contractor engagement',
          description:
            'From Global Workforce, click "+ New Contractor." Select the contractor\'s country and provide their details: name, email, scope of work, engagement type (project-based or ongoing), and payment terms.',
          screenshotKey: 'global-workforce/contractor-step-1',
        },
        {
          number: 2,
          title: 'Run the classification check',
          description:
            'The system runs a worker classification assessment based on the engagement details and local labor law criteria. It evaluates factors like control over work, economic dependence, and exclusivity to determine if contractor status is appropriate.',
          screenshotKey: 'global-workforce/contractor-step-2',
          tip: 'Take the classification assessment seriously — misclassification can result in significant fines, back-taxes, and legal exposure in many jurisdictions.',
        },
        {
          number: 3,
          title: 'Generate the contractor agreement',
          description:
            'The system generates a country-appropriate contractor agreement with IP assignment clauses, confidentiality terms, payment schedule, and termination provisions. Both parties review and sign electronically.',
          screenshotKey: 'global-workforce/contractor-step-3',
        },
        {
          number: 4,
          title: 'Set up payment processing',
          description:
            'Configure the payment method (bank transfer, PayPal, Wise), currency, and payment frequency (monthly, per milestone, or per invoice). The COR handles local tax withholding where required.',
          screenshotKey: 'global-workforce/contractor-step-4',
        },
        {
          number: 5,
          title: 'Activate the engagement',
          description:
            'Once the agreement is signed and payment is configured, the contractor is activated. They appear in your workforce directory with a "Contractor" badge and can access designated modules and projects.',
          screenshotKey: 'global-workforce/contractor-step-5',
        },
      ],
    },
    {
      id: 'manage-country-compliance',
      title: 'Managing Country-Specific Compliance',
      description:
        'Monitor and maintain compliance with local employment laws, statutory benefits, and regulatory requirements across all countries where you have workers.',
      estimatedTime: '10 minutes',
      roles: ['owner', 'admin'],
      steps: [
        {
          number: 1,
          title: 'Open the Compliance dashboard',
          description:
            'Navigate to Global Workforce > Compliance. The dashboard shows a world map with green/yellow/red indicators for each country where you have employees, reflecting the compliance status of contracts, benefits, and regulatory filings.',
          screenshotKey: 'global-workforce/compliance-step-1',
        },
        {
          number: 2,
          title: 'Review country details',
          description:
            'Click on a country to see detailed compliance information: active employees, contract status, mandatory benefit enrollment, pending work permits, and upcoming regulatory deadlines (e.g., annual labor filings).',
          screenshotKey: 'global-workforce/compliance-step-2',
        },
        {
          number: 3,
          title: 'Address compliance alerts',
          description:
            'Yellow and red alerts indicate items requiring action: expiring work permits, contracts missing required clauses, or statutory benefits not yet enrolled. Click each alert to see the affected employees and required actions.',
          screenshotKey: 'global-workforce/compliance-step-3',
          tip: 'Set up weekly compliance digest emails so you are proactively alerted to upcoming deadlines rather than reacting to overdue items.',
        },
        {
          number: 4,
          title: 'Track work permits and visas',
          description:
            'The work permits section lists all employees requiring authorization, their permit type, issue date, expiry date, and renewal status. The system sends alerts 90, 60, and 30 days before expiry.',
          screenshotKey: 'global-workforce/compliance-step-4',
        },
      ],
    },
    {
      id: 'view-global-analytics',
      title: 'Viewing Global Workforce Analytics',
      description:
        'Analyze your international workforce composition, costs, and trends across all countries and employment types.',
      estimatedTime: '5 minutes',
      roles: ['owner', 'admin', 'hrbp'],
      steps: [
        {
          number: 1,
          title: 'Open Global Analytics',
          description:
            'Navigate to Global Workforce > Analytics. The dashboard provides an overview of total international headcount, monthly cost by country, and employment type distribution (EOR, COR, PEO, direct).',
          screenshotKey: 'global-workforce/analytics-step-1',
        },
        {
          number: 2,
          title: 'Explore cost breakdowns',
          description:
            'Click into cost analytics to see the total employment cost per country, including salary, statutory contributions, EOR service fees, and benefits. Compare costs across countries for the same role level.',
          screenshotKey: 'global-workforce/analytics-step-2',
        },
        {
          number: 3,
          title: 'Review headcount trends',
          description:
            'The trend charts show headcount growth or contraction by country over time. Filter by employment type to understand the mix of permanent employees vs. contractors across regions.',
          screenshotKey: 'global-workforce/analytics-step-3',
        },
        {
          number: 4,
          title: 'Export reports',
          description:
            'Export global workforce reports as PDF or CSV for leadership presentations or financial planning. Reports can be filtered by country, employment type, department, or cost center.',
          screenshotKey: 'global-workforce/analytics-step-4',
          tip: 'Use the country comparison view during headcount planning to evaluate the total cost of hiring in different markets.',
        },
      ],
    },
  ],

  faqs: [
    {
      question: 'What is an Employer of Record (EOR)?',
      answer:
        'An EOR is a third-party organization that legally employs workers on your behalf in countries where you do not have a local entity. The EOR handles employment contracts, payroll, taxes, and statutory compliance. The employee works for your company day-to-day, but the EOR is the legal employer of record in that jurisdiction.',
    },
    {
      question: 'How long does it take to hire someone through an EOR?',
      answer:
        'Typical EOR onboarding takes 5-15 business days depending on the country. Some countries with complex labor registration processes (e.g., Brazil, India) may take longer. The system displays estimated timelines by country during the hiring process.',
    },
    {
      question: 'What is the difference between EOR and PEO?',
      answer:
        'An EOR is the sole legal employer when you have no local entity. A PEO is a co-employment arrangement where you have a local entity but share employer responsibilities. PEOs are common in the US and provide HR infrastructure (benefits administration, workers\' comp, payroll) while you maintain direct employment.',
    },
    {
      question: 'How do I ensure correct worker classification (employee vs. contractor)?',
      answer:
        'The platform includes a built-in classification assessment that evaluates your working arrangement against local labor law criteria. If the assessment indicates misclassification risk, the system recommends converting the relationship to employment (via EOR) or restructuring the engagement to align with contractor criteria.',
    },
    {
      question: 'Can I convert a contractor to a full-time employee?',
      answer:
        'Yes. From the contractor\'s profile, click "Convert to Employee." The system guides you through the transition, generating a new employment contract via EOR, calculating any required conversion payments, and updating the worker\'s status without losing their historical data.',
    },
    {
      question: 'How are statutory benefits handled in different countries?',
      answer:
        'Tempo maintains a database of statutory benefit requirements for every supported country. When you hire in a new country, the system automatically identifies mandatory benefits (healthcare, pension, social security) and configures them according to local law. Optional supplementary benefits can be added on top.',
    },
    {
      question: 'What currencies are supported for international payroll?',
      answer:
        'Tempo supports payroll processing in 50+ currencies. Employees are paid in their local currency. Exchange rates are locked at a defined point in the payroll cycle and the organization is invoiced in their base currency with transparent conversion rates.',
    },
    {
      question: 'How do I handle termination of an EOR employee?',
      answer:
        'Termination of EOR employees must comply with local labor laws, which vary significantly by country. Initiate the offboarding process from the employee\'s profile — the system calculates required notice periods, severance obligations, and any statutory termination payments based on the employment country\'s regulations.',
    },
  ],

  tips: [
    'Review the country profile before extending an offer — statutory employer costs (taxes, social contributions) can add 20-50% to the base salary depending on the country.',
    'Use the worker classification tool for every new contractor engagement, even in countries you have worked with before — laws change and enforcement varies.',
    'Monitor work permit expiry dates proactively — in many countries, employing someone with an expired permit carries severe penalties.',
    'When planning international expansion, use the country comparison analytics to evaluate the full cost of hiring across candidate markets.',
    'Set up the compliance digest email to receive a weekly summary of all pending compliance actions across your global workforce.',
  ],

  relatedModules: ['payroll', 'people', 'compensation', 'offboarding'],

  permissions: [
    {
      role: 'Owner',
      capabilities: [
        'Configure EOR, COR, and PEO partnerships',
        'Initiate international hires and contractor engagements in any country',
        'Access global compliance dashboards and analytics',
        'Approve international hires that exceed standard cost thresholds',
        'Manage country-specific employment policies and benefit configurations',
      ],
    },
    {
      role: 'Admin',
      capabilities: [
        'Initiate and manage international hires and contractor engagements',
        'Generate employment contracts and contractor agreements',
        'Monitor compliance status and address alerts',
        'Access global workforce analytics and cost reports',
      ],
    },
    {
      role: 'HRBP',
      capabilities: [
        'Initiate international hires for assigned departments',
        'Review compliance status for employees in assigned regions',
        'Track work permit renewals for assigned employees',
        'View cost analytics for assigned departments',
      ],
    },
    {
      role: 'Manager',
      capabilities: [
        'Request international hires for their team (subject to approval)',
        'View international team members in the workforce directory',
        'Access country profiles to understand local employment conditions',
      ],
    },
  ],
}

export default globalWorkforce
