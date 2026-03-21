/**
 * Import Templates
 *
 * Pre-built templates with correct headers, sample data, required fields,
 * and field types for each importable entity type.
 */

export interface ImportTemplate {
  name: string
  description: string
  headers: string[]
  sampleRows: string[][]
  requiredFields: string[]
  fieldTypes: Record<string, 'text' | 'number' | 'currency' | 'date' | 'email' | 'boolean' | 'phone'>
}

export const IMPORT_TEMPLATES: Record<string, ImportTemplate> = {
  employees: {
    name: 'Employees',
    description: 'Import employee records with personal, job, and compensation data',
    headers: ['full_name', 'email', 'phone', 'job_title', 'department', 'level', 'country', 'hire_date', 'salary', 'currency', 'employment_type', 'manager_email', 'location'],
    sampleRows: [
      ['Jane Smith', 'jane@company.com', '+1-555-0123', 'Software Engineer', 'Engineering', 'L4', 'US', '2024-01-15', '120000', 'USD', 'full_time', 'manager@company.com', 'San Francisco'],
      ['Carlos Rivera', 'carlos@company.com', '+1-555-0456', 'Product Manager', 'Product', 'L5', 'US', '2023-06-01', '145000', 'USD', 'full_time', 'director@company.com', 'New York'],
    ],
    requiredFields: ['full_name', 'email'],
    fieldTypes: { salary: 'currency', hire_date: 'date', email: 'email', phone: 'phone', manager_email: 'email' },
  },

  departments: {
    name: 'Departments',
    description: 'Import organizational departments and teams',
    headers: ['name', 'code', 'parent_department', 'head_email', 'cost_center', 'description'],
    sampleRows: [
      ['Engineering', 'ENG', '', 'vp-eng@company.com', 'CC-100', 'Software engineering and infrastructure'],
      ['Product', 'PROD', '', 'vp-prod@company.com', 'CC-200', 'Product management and design'],
      ['Frontend', 'ENG-FE', 'Engineering', 'fe-lead@company.com', 'CC-101', 'Frontend development team'],
    ],
    requiredFields: ['name'],
    fieldTypes: { head_email: 'email' },
  },

  payroll: {
    name: 'Payroll Runs',
    description: 'Import payroll run history',
    headers: ['period', 'run_date', 'total_gross', 'total_net', 'total_deductions', 'total_taxes', 'employee_count', 'currency', 'status'],
    sampleRows: [
      ['2024-01', '2024-01-31', '450000', '320000', '75000', '55000', '25', 'USD', 'completed'],
      ['2024-02', '2024-02-29', '452000', '321500', '75500', '55000', '25', 'USD', 'completed'],
    ],
    requiredFields: ['period', 'run_date', 'total_gross', 'total_net'],
    fieldTypes: { run_date: 'date', total_gross: 'currency', total_net: 'currency', total_deductions: 'currency', total_taxes: 'currency', employee_count: 'number' },
  },

  expenses: {
    name: 'Expense Reports',
    description: 'Import expense reports and claims',
    headers: ['employee_email', 'title', 'amount', 'currency', 'category', 'submitted_date', 'receipt_date', 'vendor', 'description', 'status'],
    sampleRows: [
      ['jane@company.com', 'Client Dinner', '185.50', 'USD', 'meals', '2024-03-15', '2024-03-14', 'The Steakhouse', 'Dinner with Acme Corp team', 'pending'],
      ['carlos@company.com', 'Conference Travel', '1250.00', 'USD', 'travel', '2024-03-10', '2024-03-08', 'United Airlines', 'Flight to React Summit', 'approved'],
    ],
    requiredFields: ['employee_email', 'title', 'amount'],
    fieldTypes: { amount: 'currency', submitted_date: 'date', receipt_date: 'date', employee_email: 'email' },
  },

  leave_requests: {
    name: 'Leave Requests',
    description: 'Import time-off and leave requests',
    headers: ['employee_email', 'type', 'start_date', 'end_date', 'days', 'status', 'notes'],
    sampleRows: [
      ['jane@company.com', 'vacation', '2024-04-15', '2024-04-19', '5', 'approved', 'Spring break trip'],
      ['carlos@company.com', 'sick', '2024-03-20', '2024-03-21', '2', 'approved', ''],
    ],
    requiredFields: ['employee_email', 'type', 'start_date', 'end_date'],
    fieldTypes: { start_date: 'date', end_date: 'date', days: 'number', employee_email: 'email' },
  },

  job_postings: {
    name: 'Job Postings',
    description: 'Import open positions and job listings',
    headers: ['title', 'department', 'location', 'employment_type', 'level', 'salary_min', 'salary_max', 'currency', 'description', 'status', 'hiring_manager_email'],
    sampleRows: [
      ['Senior Backend Engineer', 'Engineering', 'Remote', 'full_time', 'L5', '150000', '190000', 'USD', 'Backend systems development', 'open', 'eng-mgr@company.com'],
      ['Product Designer', 'Design', 'New York', 'full_time', 'L4', '120000', '150000', 'USD', 'UX/UI design for core product', 'open', 'design-lead@company.com'],
    ],
    requiredFields: ['title', 'department'],
    fieldTypes: { salary_min: 'currency', salary_max: 'currency', hiring_manager_email: 'email' },
  },

  applications: {
    name: 'Candidate Applications',
    description: 'Import job applications and candidate data',
    headers: ['candidate_name', 'email', 'phone', 'position', 'source', 'applied_date', 'status', 'resume_url', 'notes'],
    sampleRows: [
      ['Alex Johnson', 'alex.j@gmail.com', '+1-555-9876', 'Senior Backend Engineer', 'LinkedIn', '2024-03-01', 'screening', '', 'Strong Python background'],
      ['Priya Patel', 'priya.p@outlook.com', '+1-555-5432', 'Product Designer', 'Referral', '2024-03-05', 'interview', '', 'Referred by Carlos Rivera'],
    ],
    requiredFields: ['candidate_name', 'email', 'position'],
    fieldTypes: { applied_date: 'date', email: 'email', phone: 'phone' },
  },

  devices: {
    name: 'IT Devices',
    description: 'Import device inventory and assignments',
    headers: ['device_name', 'serial_number', 'type', 'manufacturer', 'model', 'os', 'assigned_to_email', 'purchase_date', 'warranty_expiry', 'status'],
    sampleRows: [
      ['MacBook Pro 16"', 'C02XL0ABCD', 'laptop', 'Apple', 'MacBook Pro 16 M3', 'macOS 14', 'jane@company.com', '2024-01-10', '2027-01-10', 'active'],
      ['ThinkPad X1 Carbon', 'PF2ZYXWV', 'laptop', 'Lenovo', 'X1 Carbon Gen 11', 'Windows 11', 'carlos@company.com', '2024-02-15', '2027-02-15', 'active'],
    ],
    requiredFields: ['device_name', 'serial_number', 'type'],
    fieldTypes: { purchase_date: 'date', warranty_expiry: 'date', assigned_to_email: 'email' },
  },

  vendors: {
    name: 'Vendors',
    description: 'Import vendor and supplier records',
    headers: ['name', 'contact_name', 'email', 'phone', 'category', 'payment_terms', 'tax_id', 'address', 'country', 'status'],
    sampleRows: [
      ['Acme Software Inc', 'John Doe', 'john@acme.com', '+1-555-1111', 'software', 'net_30', 'US-12-345678', '123 Tech St, SF, CA 94102', 'US', 'active'],
      ['CloudHost Pro', 'Sarah Lee', 'sarah@cloudhost.com', '+1-555-2222', 'infrastructure', 'net_45', 'US-98-765432', '456 Cloud Ave, Seattle, WA 98101', 'US', 'active'],
    ],
    requiredFields: ['name'],
    fieldTypes: { email: 'email', phone: 'phone' },
  },

  invoices: {
    name: 'Invoices',
    description: 'Import invoice records',
    headers: ['invoice_number', 'vendor_name', 'amount', 'currency', 'issue_date', 'due_date', 'status', 'category', 'description'],
    sampleRows: [
      ['INV-2024-001', 'Acme Software Inc', '15000.00', 'USD', '2024-03-01', '2024-03-31', 'pending', 'software', 'Annual license renewal'],
      ['INV-2024-002', 'CloudHost Pro', '4500.00', 'USD', '2024-03-05', '2024-04-19', 'approved', 'infrastructure', 'Q1 hosting fees'],
    ],
    requiredFields: ['invoice_number', 'amount'],
    fieldTypes: { amount: 'currency', issue_date: 'date', due_date: 'date' },
  },

  benefit_plans: {
    name: 'Benefit Plans',
    description: 'Import benefit plan definitions',
    headers: ['name', 'type', 'provider', 'plan_code', 'employee_cost_monthly', 'employer_cost_monthly', 'coverage_type', 'effective_date', 'status'],
    sampleRows: [
      ['Premium Health PPO', 'medical', 'Blue Cross', 'BC-PPO-100', '250', '750', 'employee_family', '2024-01-01', 'active'],
      ['Basic Dental', 'dental', 'Delta Dental', 'DD-BASIC', '25', '50', 'employee_only', '2024-01-01', 'active'],
    ],
    requiredFields: ['name', 'type'],
    fieldTypes: { employee_cost_monthly: 'currency', employer_cost_monthly: 'currency', effective_date: 'date' },
  },

  courses: {
    name: 'Learning Courses',
    description: 'Import training courses and learning content',
    headers: ['title', 'category', 'instructor', 'duration_hours', 'level', 'format', 'description', 'required', 'status'],
    sampleRows: [
      ['Security Awareness Training', 'compliance', 'Security Team', '2', 'beginner', 'online', 'Annual security training for all employees', 'true', 'active'],
      ['Advanced React Patterns', 'technical', 'Jane Smith', '8', 'advanced', 'workshop', 'Deep dive into React performance optimization', 'false', 'active'],
    ],
    requiredFields: ['title'],
    fieldTypes: { duration_hours: 'number', required: 'boolean' },
  },

  projects: {
    name: 'Projects',
    description: 'Import project records',
    headers: ['name', 'code', 'department', 'owner_email', 'start_date', 'target_end_date', 'budget', 'currency', 'status', 'priority', 'description'],
    sampleRows: [
      ['Platform Redesign', 'PRJ-001', 'Engineering', 'jane@company.com', '2024-01-15', '2024-06-30', '250000', 'USD', 'active', 'high', 'Full redesign of customer-facing platform'],
      ['Q2 Marketing Campaign', 'PRJ-002', 'Marketing', 'mktg-lead@company.com', '2024-04-01', '2024-06-30', '75000', 'USD', 'planning', 'medium', 'Q2 digital marketing push'],
    ],
    requiredFields: ['name'],
    fieldTypes: { start_date: 'date', target_end_date: 'date', budget: 'currency', owner_email: 'email' },
  },
}

/**
 * Get all available template names and descriptions.
 */
export function getAvailableTemplates(): { key: string; name: string; description: string }[] {
  return Object.entries(IMPORT_TEMPLATES).map(([key, template]) => ({
    key,
    name: template.name,
    description: template.description,
  }))
}

/**
 * Generate CSV content for a given template.
 */
export function generateTemplateCSV(templateKey: string): string | null {
  const template = IMPORT_TEMPLATES[templateKey]
  if (!template) return null

  const lines = [
    template.headers.join(','),
    ...template.sampleRows.map(row => row.map(v => v.includes(',') ? `"${v}"` : v).join(',')),
  ]
  return lines.join('\n')
}
