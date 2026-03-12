// Evaluator Demo Data for Ghana Payroll Evaluation
// Samuel Mireku and Meissa Fall — two evaluator accounts for the Ecobank Ghana payroll demo
// This file provides all data needed for the 10-step walkthrough

// ---------------------------------------------------------------------------
// 1. EVALUATOR_ACCOUNTS
// ---------------------------------------------------------------------------

export const EVALUATOR_ACCOUNTS = {
  samuel: {
    id: 'emp-eval-samuel',
    email: 's.mireku@ecobank-demo.com',
    password: 'EcobankTempo2026!',
    fullName: 'Samuel Mireku',
    firstName: 'Samuel',
    jobTitle: 'Head of Compensation & Benefits',
    department: 'Human Resources',
    departmentId: 'dept-5',
    country: 'Ghana',
    currency: 'GHS',
    employeeCode: 'ETI-HR-0847',
    ssnitNumber: 'C123456789',
    salary: 28500, // GHS per month
    bankName: 'GCB Bank',
    bankAccountEnding: '4821',
    role: 'admin' as const,
    payrollGroupName: 'Ghana — Ecobank Evaluation Group',
    payrollGroupId: 'pg-samuel',
  },
  meissa: {
    id: 'emp-eval-meissa',
    email: 'm.fall@ecobank-demo.com',
    password: 'EcobankTempo2026!',
    fullName: 'Meissa Fall',
    firstName: 'Meissa',
    jobTitle: 'Head of Compensation & Benefits',
    department: 'Human Resources',
    departmentId: 'dept-5',
    country: 'Senegal',
    currency: 'XOF',
    employeeCode: 'ETI-HR-0923',
    ssnitNumber: 'C987654321',
    salary: 26500, // GHS per month for payroll evaluation
    bankName: 'Ecobank Ghana',
    bankAccountEnding: '7634',
    role: 'admin' as const,
    payrollGroupName: 'Ghana — Meissa Evaluation Group',
    payrollGroupId: 'pg-meissa',
  },
} as const;

export type EvaluatorKey = keyof typeof EVALUATOR_ACCOUNTS;

// ---------------------------------------------------------------------------
// 2. EVALUATOR_EMAILS
// ---------------------------------------------------------------------------

export const EVALUATOR_EMAILS = new Set([
  's.mireku@ecobank-demo.com',
  'm.fall@ecobank-demo.com',
]);

// ---------------------------------------------------------------------------
// 3. isEvaluatorAccount
// ---------------------------------------------------------------------------

export function isEvaluatorAccount(email: string): boolean {
  return EVALUATOR_EMAILS.has(email.toLowerCase());
}

// ---------------------------------------------------------------------------
// 4. getEvaluatorConfig
// ---------------------------------------------------------------------------

export function getEvaluatorConfig(email: string) {
  const lower = email.toLowerCase();
  if (lower === EVALUATOR_ACCOUNTS.samuel.email) return EVALUATOR_ACCOUNTS.samuel;
  if (lower === EVALUATOR_ACCOUNTS.meissa.email) return EVALUATOR_ACCOUNTS.meissa;
  return null;
}

// ---------------------------------------------------------------------------
// 5. ghanaEvaluatorEmployees — 56 Ghana-based employees
// ---------------------------------------------------------------------------

export const ghanaEvaluatorEmployees = [
  // ---- Retail Banking (dept-1) — 14 employees ----
  { id: 'emp-gh-1', org_id: 'org-1', department_id: 'dept-1', job_title: 'Branch Manager — Kumasi', level: 'Senior Manager', country: 'Ghana', role: 'employee' as const, profile: { full_name: 'Kwabena Ofori', email: 'k.ofori@ecobank.com', avatar_url: null, phone: '+233 24 310 2045' } },
  { id: 'emp-gh-2', org_id: 'org-1', department_id: 'dept-1', job_title: 'Branch Manager — Takoradi', level: 'Senior Manager', country: 'Ghana', role: 'employee' as const, profile: { full_name: 'Ama Serwaa Gyamfi', email: 'a.gyamfi@ecobank.com', avatar_url: null, phone: '+233 20 445 7812' } },
  { id: 'emp-gh-3', org_id: 'org-1', department_id: 'dept-1', job_title: 'Relationship Officer', level: 'Mid', country: 'Ghana', role: 'employee' as const, profile: { full_name: 'Kofi Antwi', email: 'k.antwi@ecobank.com', avatar_url: null, phone: '+233 26 578 3420' } },
  { id: 'emp-gh-4', org_id: 'org-1', department_id: 'dept-1', job_title: 'Relationship Officer', level: 'Mid', country: 'Ghana', role: 'employee' as const, profile: { full_name: 'Adjoa Mensimah', email: 'a.mensimah@ecobank.com', avatar_url: null, phone: '+233 24 891 0254' } },
  { id: 'emp-gh-5', org_id: 'org-1', department_id: 'dept-1', job_title: 'Teller', level: 'Associate', country: 'Ghana', role: 'employee' as const, profile: { full_name: 'Nii Armah Quaye', email: 'n.quaye@ecobank.com', avatar_url: null, phone: '+233 27 102 3489' } },
  { id: 'emp-gh-6', org_id: 'org-1', department_id: 'dept-1', job_title: 'Teller', level: 'Associate', country: 'Ghana', role: 'employee' as const, profile: { full_name: 'Efua Amoah', email: 'e.amoah@ecobank.com', avatar_url: null, phone: '+233 20 234 5601' } },
  { id: 'emp-gh-7', org_id: 'org-1', department_id: 'dept-1', job_title: 'Customer Service Lead', level: 'Senior', country: 'Ghana', role: 'employee' as const, profile: { full_name: 'Akua Tetteh', email: 'a.tetteh@ecobank.com', avatar_url: null, phone: '+233 26 345 7812' } },
  { id: 'emp-gh-8', org_id: 'org-1', department_id: 'dept-1', job_title: 'Sales Executive', level: 'Junior', country: 'Ghana', role: 'employee' as const, profile: { full_name: 'Yaw Baah', email: 'y.baah@ecobank.com', avatar_url: null, phone: '+233 24 456 8923' } },
  { id: 'emp-gh-9', org_id: 'org-1', department_id: 'dept-1', job_title: 'Branch Manager — Tamale', level: 'Senior Manager', country: 'Ghana', role: 'employee' as const, profile: { full_name: 'Abdul-Rashid Issahaku', email: 'a.issahaku@ecobank.com', avatar_url: null, phone: '+233 20 567 9034' } },
  { id: 'emp-gh-10', org_id: 'org-1', department_id: 'dept-1', job_title: 'Teller', level: 'Associate', country: 'Ghana', role: 'employee' as const, profile: { full_name: 'Abena Osei', email: 'a.osei@ecobank.com', avatar_url: null, phone: '+233 27 678 0145' } },
  { id: 'emp-gh-11', org_id: 'org-1', department_id: 'dept-1', job_title: 'Regional Sales Manager', level: 'Manager', country: 'Ghana', role: 'employee' as const, profile: { full_name: 'Kojo Appiah', email: 'k.appiah@ecobank.com', avatar_url: null, phone: '+233 24 789 1256' } },
  { id: 'emp-gh-12', org_id: 'org-1', department_id: 'dept-1', job_title: 'Relationship Officer', level: 'Mid', country: 'Ghana', role: 'employee' as const, profile: { full_name: 'Akosua Ansah', email: 'a.ansah@ecobank.com', avatar_url: null, phone: '+233 26 890 2367' } },
  { id: 'emp-gh-13', org_id: 'org-1', department_id: 'dept-1', job_title: 'Customer Service Officer', level: 'Junior', country: 'Ghana', role: 'employee' as const, profile: { full_name: 'Fiifi Sackey', email: 'f.sackey@ecobank.com', avatar_url: null, phone: '+233 20 901 3478' } },
  { id: 'emp-gh-14', org_id: 'org-1', department_id: 'dept-1', job_title: 'Teller', level: 'Associate', country: 'Ghana', role: 'employee' as const, profile: { full_name: 'Adwoa Poku', email: 'a.poku@ecobank.com', avatar_url: null, phone: '+233 27 012 4589' } },

  // ---- Corporate Banking (dept-2) — 10 employees ----
  { id: 'emp-gh-15', org_id: 'org-1', department_id: 'dept-2', job_title: 'Senior Credit Analyst', level: 'Senior', country: 'Ghana', role: 'employee' as const, profile: { full_name: 'Kwame Boakye', email: 'k.boakye@ecobank.com', avatar_url: null, phone: '+233 24 123 5690' } },
  { id: 'emp-gh-16', org_id: 'org-1', department_id: 'dept-2', job_title: 'Credit Analyst', level: 'Mid', country: 'Ghana', role: 'employee' as const, profile: { full_name: 'Nana Agyemang', email: 'n.agyemang@ecobank.com', avatar_url: null, phone: '+233 26 234 6701' } },
  { id: 'emp-gh-17', org_id: 'org-1', department_id: 'dept-2', job_title: 'Corporate Relationship Manager', level: 'Manager', country: 'Ghana', role: 'employee' as const, profile: { full_name: 'Ebo Hayford', email: 'e.hayford@ecobank.com', avatar_url: null, phone: '+233 20 345 7812' } },
  { id: 'emp-gh-18', org_id: 'org-1', department_id: 'dept-2', job_title: 'Trade Finance Officer', level: 'Mid', country: 'Ghana', role: 'employee' as const, profile: { full_name: 'Adwoa Frempomaa', email: 'a.frempomaa@ecobank.com', avatar_url: null, phone: '+233 27 456 8923' } },
  { id: 'emp-gh-19', org_id: 'org-1', department_id: 'dept-2', job_title: 'Loan Recovery Officer', level: 'Mid', country: 'Ghana', role: 'employee' as const, profile: { full_name: 'Yaw Ankomah', email: 'y.ankomah@ecobank.com', avatar_url: null, phone: '+233 24 567 9034' } },
  { id: 'emp-gh-20', org_id: 'org-1', department_id: 'dept-2', job_title: 'Treasury Analyst', level: 'Senior', country: 'Ghana', role: 'employee' as const, profile: { full_name: 'Akua Dufie Asare', email: 'a.asare@ecobank.com', avatar_url: null, phone: '+233 26 678 0145' } },
  { id: 'emp-gh-21', org_id: 'org-1', department_id: 'dept-2', job_title: 'Director of Corporate Banking', level: 'Director', country: 'Ghana', role: 'employee' as const, profile: { full_name: 'Nana Kwesi Amoako', email: 'n.amoako@ecobank.com', avatar_url: null, phone: '+233 20 789 1256' } },
  { id: 'emp-gh-22', org_id: 'org-1', department_id: 'dept-2', job_title: 'Credit Analyst', level: 'Junior', country: 'Ghana', role: 'employee' as const, profile: { full_name: 'Ama Sarpong', email: 'a.sarpong@ecobank.com', avatar_url: null, phone: '+233 27 890 2367' } },
  { id: 'emp-gh-23', org_id: 'org-1', department_id: 'dept-2', job_title: 'Relationship Officer', level: 'Mid', country: 'Ghana', role: 'employee' as const, profile: { full_name: 'Kofi Aidoo', email: 'k.aidoo@ecobank.com', avatar_url: null, phone: '+233 24 901 3478' } },
  { id: 'emp-gh-24', org_id: 'org-1', department_id: 'dept-2', job_title: 'Senior Relationship Manager', level: 'Senior Manager', country: 'Ghana', role: 'employee' as const, profile: { full_name: 'Efua Asamoah', email: 'e.asamoah@ecobank.com', avatar_url: null, phone: '+233 26 012 4589' } },

  // ---- Operations (dept-3) — 10 employees ----
  { id: 'emp-gh-25', org_id: 'org-1', department_id: 'dept-3', job_title: 'Operations Manager', level: 'Manager', country: 'Ghana', role: 'employee' as const, profile: { full_name: 'Kwabena Ampofo', email: 'k.ampofo@ecobank.com', avatar_url: null, phone: '+233 20 123 5691' } },
  { id: 'emp-gh-26', org_id: 'org-1', department_id: 'dept-3', job_title: 'Operations Officer', level: 'Junior', country: 'Ghana', role: 'employee' as const, profile: { full_name: 'Adjoa Badu', email: 'a.badu@ecobank.com', avatar_url: null, phone: '+233 27 234 6702' } },
  { id: 'emp-gh-27', org_id: 'org-1', department_id: 'dept-3', job_title: 'Reconciliation Officer', level: 'Mid', country: 'Ghana', role: 'employee' as const, profile: { full_name: 'Nii Laryea Sowah', email: 'n.sowah@ecobank.com', avatar_url: null, phone: '+233 24 345 7813' } },
  { id: 'emp-gh-28', org_id: 'org-1', department_id: 'dept-3', job_title: 'Cash Processing Officer', level: 'Associate', country: 'Ghana', role: 'employee' as const, profile: { full_name: 'Akua Konadu', email: 'a.konadu@ecobank.com', avatar_url: null, phone: '+233 26 456 8924' } },
  { id: 'emp-gh-29', org_id: 'org-1', department_id: 'dept-3', job_title: 'Trade Operations Analyst', level: 'Mid', country: 'Ghana', role: 'employee' as const, profile: { full_name: 'Kwame Darko', email: 'kw.darko@ecobank.com', avatar_url: null, phone: '+233 20 567 9035' } },
  { id: 'emp-gh-30', org_id: 'org-1', department_id: 'dept-3', job_title: 'Senior Operations Officer', level: 'Senior', country: 'Ghana', role: 'employee' as const, profile: { full_name: 'Abena Kyeremaa', email: 'a.kyeremaa@ecobank.com', avatar_url: null, phone: '+233 27 678 0146' } },
  { id: 'emp-gh-31', org_id: 'org-1', department_id: 'dept-3', job_title: 'Clearing Officer', level: 'Junior', country: 'Ghana', role: 'employee' as const, profile: { full_name: 'Yaw Kwarteng', email: 'y.kwarteng@ecobank.com', avatar_url: null, phone: '+233 24 789 1257' } },
  { id: 'emp-gh-32', org_id: 'org-1', department_id: 'dept-3', job_title: 'Operations Supervisor', level: 'Senior', country: 'Ghana', role: 'employee' as const, profile: { full_name: 'Esi Bonsu', email: 'e.bonsu@ecobank.com', avatar_url: null, phone: '+233 26 890 2368' } },
  { id: 'emp-gh-33', org_id: 'org-1', department_id: 'dept-3', job_title: 'Vault Custodian', level: 'Mid', country: 'Ghana', role: 'employee' as const, profile: { full_name: 'Kofi Danquah', email: 'k.danquah@ecobank.com', avatar_url: null, phone: '+233 20 901 3479' } },
  { id: 'emp-gh-34', org_id: 'org-1', department_id: 'dept-3', job_title: 'Operations Officer', level: 'Associate', country: 'Ghana', role: 'employee' as const, profile: { full_name: 'Akosua Manu', email: 'a.manu@ecobank.com', avatar_url: null, phone: '+233 27 012 4590' } },

  // ---- Technology (dept-4) — 12 employees ----
  { id: 'emp-gh-35', org_id: 'org-1', department_id: 'dept-4', job_title: 'IT Manager', level: 'Manager', country: 'Ghana', role: 'employee' as const, profile: { full_name: 'Nana Ama Owusu-Ansah', email: 'n.owusu-ansah@ecobank.com', avatar_url: null, phone: '+233 24 123 5692' } },
  { id: 'emp-gh-36', org_id: 'org-1', department_id: 'dept-4', job_title: 'Software Engineer', level: 'Mid', country: 'Ghana', role: 'employee' as const, profile: { full_name: 'Kojo Asiedu', email: 'k.asiedu@ecobank.com', avatar_url: null, phone: '+233 26 234 6703' } },
  { id: 'emp-gh-37', org_id: 'org-1', department_id: 'dept-4', job_title: 'Database Administrator', level: 'Senior', country: 'Ghana', role: 'employee' as const, profile: { full_name: 'Yaw Mensah-Bonsu', email: 'y.mensah-bonsu@ecobank.com', avatar_url: null, phone: '+233 20 345 7814' } },
  { id: 'emp-gh-38', org_id: 'org-1', department_id: 'dept-4', job_title: 'IT Support Specialist', level: 'Junior', country: 'Ghana', role: 'employee' as const, profile: { full_name: 'Efua Agyapong', email: 'e.agyapong@ecobank.com', avatar_url: null, phone: '+233 27 456 8925' } },
  { id: 'emp-gh-39', org_id: 'org-1', department_id: 'dept-4', job_title: 'Cybersecurity Analyst', level: 'Senior', country: 'Ghana', role: 'employee' as const, profile: { full_name: 'Kwabena Tawiah', email: 'k.tawiah@ecobank.com', avatar_url: null, phone: '+233 24 567 9036' } },
  { id: 'emp-gh-40', org_id: 'org-1', department_id: 'dept-4', job_title: 'Network Engineer', level: 'Mid', country: 'Ghana', role: 'employee' as const, profile: { full_name: 'Adwoa Ankrah', email: 'a.ankrah@ecobank.com', avatar_url: null, phone: '+233 26 678 0147' } },
  { id: 'emp-gh-41', org_id: 'org-1', department_id: 'dept-4', job_title: 'Solutions Architect', level: 'Senior Manager', country: 'Ghana', role: 'employee' as const, profile: { full_name: 'Nii Noi Nortey', email: 'n.nortey@ecobank.com', avatar_url: null, phone: '+233 20 789 1258' } },
  { id: 'emp-gh-42', org_id: 'org-1', department_id: 'dept-4', job_title: 'IT Support Specialist', level: 'Associate', country: 'Ghana', role: 'employee' as const, profile: { full_name: 'Ama Sefa Dedeh', email: 'a.dedeh@ecobank.com', avatar_url: null, phone: '+233 27 890 2369' } },
  { id: 'emp-gh-43', org_id: 'org-1', department_id: 'dept-4', job_title: 'Software Engineer', level: 'Senior', country: 'Ghana', role: 'employee' as const, profile: { full_name: 'Kofi Amponsah', email: 'k.amponsah@ecobank.com', avatar_url: null, phone: '+233 24 901 3480' } },
  { id: 'emp-gh-44', org_id: 'org-1', department_id: 'dept-4', job_title: 'QA Engineer', level: 'Mid', country: 'Ghana', role: 'employee' as const, profile: { full_name: 'Akua Yeboah', email: 'a.yeboah@ecobank.com', avatar_url: null, phone: '+233 26 012 4591' } },
  { id: 'emp-gh-45', org_id: 'org-1', department_id: 'dept-4', job_title: 'DevOps Engineer', level: 'Mid', country: 'Ghana', role: 'employee' as const, profile: { full_name: 'Kwame Nkrumah-Acheampong', email: 'k.acheampong@ecobank.com', avatar_url: null, phone: '+233 20 123 5693' } },
  { id: 'emp-gh-46', org_id: 'org-1', department_id: 'dept-4', job_title: 'IT Director', level: 'Director', country: 'Ghana', role: 'employee' as const, profile: { full_name: 'Nana Yaw Bediako', email: 'n.bediako@ecobank.com', avatar_url: null, phone: '+233 27 234 6704' } },

  // ---- Finance (dept-7) — 10 employees ----
  { id: 'emp-gh-47', org_id: 'org-1', department_id: 'dept-7', job_title: 'Finance Manager', level: 'Manager', country: 'Ghana', role: 'employee' as const, profile: { full_name: 'Abena Acheampong', email: 'ab.acheampong@ecobank.com', avatar_url: null, phone: '+233 24 345 7815' } },
  { id: 'emp-gh-48', org_id: 'org-1', department_id: 'dept-7', job_title: 'Accountant', level: 'Mid', country: 'Ghana', role: 'employee' as const, profile: { full_name: 'Yaw Opoku', email: 'y.opoku@ecobank.com', avatar_url: null, phone: '+233 26 456 8926' } },
  { id: 'emp-gh-49', org_id: 'org-1', department_id: 'dept-7', job_title: 'AML Officer', level: 'Senior', country: 'Ghana', role: 'employee' as const, profile: { full_name: 'Esi Forson', email: 'e.forson@ecobank.com', avatar_url: null, phone: '+233 20 567 9037' } },
  { id: 'emp-gh-50', org_id: 'org-1', department_id: 'dept-7', job_title: 'Internal Auditor', level: 'Senior', country: 'Ghana', role: 'employee' as const, profile: { full_name: 'Kwabena Baffour', email: 'k.baffour@ecobank.com', avatar_url: null, phone: '+233 27 678 0148' } },
  { id: 'emp-gh-51', org_id: 'org-1', department_id: 'dept-7', job_title: 'Accounts Payable Officer', level: 'Junior', country: 'Ghana', role: 'employee' as const, profile: { full_name: 'Adjoa Asantewaa', email: 'a.asantewaa@ecobank.com', avatar_url: null, phone: '+233 24 789 1259' } },
  { id: 'emp-gh-52', org_id: 'org-1', department_id: 'dept-7', job_title: 'Financial Analyst', level: 'Mid', country: 'Ghana', role: 'employee' as const, profile: { full_name: 'Nii Addo Quaynor', email: 'n.quaynor@ecobank.com', avatar_url: null, phone: '+233 26 890 2370' } },
  { id: 'emp-gh-53', org_id: 'org-1', department_id: 'dept-7', job_title: 'Tax Analyst', level: 'Mid', country: 'Ghana', role: 'employee' as const, profile: { full_name: 'Akua Serwaa Boakye', email: 'a.boakye@ecobank.com', avatar_url: null, phone: '+233 20 901 3481' } },
  { id: 'emp-gh-54', org_id: 'org-1', department_id: 'dept-7', job_title: 'Payroll Specialist', level: 'Mid', country: 'Ghana', role: 'employee' as const, profile: { full_name: 'Kofi Oteng', email: 'k.oteng@ecobank.com', avatar_url: null, phone: '+233 27 012 4592' } },
  { id: 'emp-gh-55', org_id: 'org-1', department_id: 'dept-7', job_title: 'Finance Director', level: 'Director', country: 'Ghana', role: 'employee' as const, profile: { full_name: 'Nana Adwoa Prah', email: 'n.prah@ecobank.com', avatar_url: null, phone: '+233 24 123 5694' } },
  { id: 'emp-gh-56', org_id: 'org-1', department_id: 'dept-7', job_title: 'Accounts Clerk', level: 'Associate', country: 'Ghana', role: 'employee' as const, profile: { full_name: 'Ebo Quansah', email: 'e.quansah@ecobank.com', avatar_url: null, phone: '+233 26 234 6705' } },
];

// ---------------------------------------------------------------------------
// Bank details per employee
// ---------------------------------------------------------------------------

interface BankDetails {
  bankName: string;
  bankCode: string;
  bankAccountNumber: string;
  ssnitNumber: string | null;
  taxIdNumber: string;
}

export const ghanaEmployeeBankDetails: Record<string, BankDetails> = {
  'emp-gh-1':  { bankName: 'GCB Bank', bankCode: '040100', bankAccountNumber: '0401001234501', ssnitNumber: 'C201045678', taxIdNumber: 'GHA-P0023451' },
  'emp-gh-2':  { bankName: 'Ecobank Ghana', bankCode: '130100', bankAccountNumber: '1301002345612', ssnitNumber: 'C201056789', taxIdNumber: 'GHA-P0023452' },
  'emp-gh-3':  { bankName: 'Stanbic Bank Ghana', bankCode: '190100', bankAccountNumber: '1901003456723', ssnitNumber: 'C201067890', taxIdNumber: 'GHA-P0023453' },
  'emp-gh-4':  { bankName: 'CalBank', bankCode: '230100', bankAccountNumber: '2301004567834', ssnitNumber: 'C201078901', taxIdNumber: 'GHA-P0023454' },
  'emp-gh-5':  { bankName: 'GCB Bank', bankCode: '040100', bankAccountNumber: '0401005678945', ssnitNumber: 'C201089012', taxIdNumber: 'GHA-P0023455' },
  'emp-gh-6':  { bankName: 'Fidelity Bank Ghana', bankCode: '240100', bankAccountNumber: '2401006789056', ssnitNumber: 'C201090123', taxIdNumber: 'GHA-P0023456' },
  'emp-gh-7':  { bankName: 'Absa Bank Ghana', bankCode: '030100', bankAccountNumber: '0301007890167', ssnitNumber: 'C201001234', taxIdNumber: 'GHA-P0023457' },
  'emp-gh-8':  { bankName: 'Ecobank Ghana', bankCode: '130100', bankAccountNumber: '1301008901278', ssnitNumber: 'C201012345', taxIdNumber: 'GHA-P0023458' },
  'emp-gh-9':  { bankName: 'GCB Bank', bankCode: '040100', bankAccountNumber: '0401009012389', ssnitNumber: 'C201023456', taxIdNumber: 'GHA-P0023459' },
  'emp-gh-10': { bankName: 'Stanbic Bank Ghana', bankCode: '190100', bankAccountNumber: '1901000123490', ssnitNumber: 'C201034567', taxIdNumber: 'GHA-P0023460' },
  'emp-gh-11': { bankName: 'CalBank', bankCode: '230100', bankAccountNumber: '2301001234501', ssnitNumber: 'C201045679', taxIdNumber: 'GHA-P0023461' },
  'emp-gh-12': { bankName: 'Fidelity Bank Ghana', bankCode: '240100', bankAccountNumber: '2401002345612', ssnitNumber: 'C201056790', taxIdNumber: 'GHA-P0023462' },
  'emp-gh-13': { bankName: 'Absa Bank Ghana', bankCode: '030100', bankAccountNumber: '0301003456723', ssnitNumber: 'C201067891', taxIdNumber: 'GHA-P0023463' },
  'emp-gh-14': { bankName: 'GCB Bank', bankCode: '040100', bankAccountNumber: '0401004567834', ssnitNumber: 'C201078902', taxIdNumber: 'GHA-P0023464' },
  'emp-gh-15': { bankName: 'Ecobank Ghana', bankCode: '130100', bankAccountNumber: '1301005678945', ssnitNumber: 'C201089013', taxIdNumber: 'GHA-P0023465' },
  'emp-gh-16': { bankName: 'Stanbic Bank Ghana', bankCode: '190100', bankAccountNumber: '1901006789056', ssnitNumber: null, taxIdNumber: 'GHA-P0023466' },  // Missing SSNIT — demo scenario
  'emp-gh-17': { bankName: 'CalBank', bankCode: '230100', bankAccountNumber: '2301007890167', ssnitNumber: 'C201001235', taxIdNumber: 'GHA-P0023467' },
  'emp-gh-18': { bankName: 'Fidelity Bank Ghana', bankCode: '240100', bankAccountNumber: '2401008901278', ssnitNumber: 'C201012346', taxIdNumber: 'GHA-P0023468' },
  'emp-gh-19': { bankName: 'Absa Bank Ghana', bankCode: '030100', bankAccountNumber: '0301009012389', ssnitNumber: 'C201023457', taxIdNumber: 'GHA-P0023469' },
  'emp-gh-20': { bankName: 'GCB Bank', bankCode: '040100', bankAccountNumber: '0401000123490', ssnitNumber: 'C201034568', taxIdNumber: 'GHA-P0023470' },
  'emp-gh-21': { bankName: 'Ecobank Ghana', bankCode: '130100', bankAccountNumber: '1301001234502', ssnitNumber: 'C201045680', taxIdNumber: 'GHA-P0023471' },
  'emp-gh-22': { bankName: 'Ecobank Ghana', bankCode: '130100', bankAccountNumber: '1301008901278', ssnitNumber: 'C201056791', taxIdNumber: 'GHA-P0023472' },  // Duplicate bank account with emp-gh-8 — demo scenario
  'emp-gh-23': { bankName: 'CalBank', bankCode: '230100', bankAccountNumber: '2301003456724', ssnitNumber: 'C201067892', taxIdNumber: 'GHA-P0023473' },
  'emp-gh-24': { bankName: 'Fidelity Bank Ghana', bankCode: '240100', bankAccountNumber: '2401004567835', ssnitNumber: 'C201078903', taxIdNumber: 'GHA-P0023474' },
  'emp-gh-25': { bankName: 'Absa Bank Ghana', bankCode: '030100', bankAccountNumber: '0301005678946', ssnitNumber: 'C201089014', taxIdNumber: 'GHA-P0023475' },
  'emp-gh-26': { bankName: 'GCB Bank', bankCode: '040100', bankAccountNumber: '0401006789057', ssnitNumber: 'C201090124', taxIdNumber: 'GHA-P0023476' },
  'emp-gh-27': { bankName: 'Ecobank Ghana', bankCode: '130100', bankAccountNumber: '1301007890168', ssnitNumber: 'C201001236', taxIdNumber: 'GHA-P0023477' },
  'emp-gh-28': { bankName: 'Stanbic Bank Ghana', bankCode: '190100', bankAccountNumber: '1901008901279', ssnitNumber: 'C201012347', taxIdNumber: 'GHA-P0023478' },
  'emp-gh-29': { bankName: 'CalBank', bankCode: '230100', bankAccountNumber: '2301009012390', ssnitNumber: 'C201023458', taxIdNumber: 'GHA-P0023479' },
  'emp-gh-30': { bankName: 'Fidelity Bank Ghana', bankCode: '240100', bankAccountNumber: '2401000123491', ssnitNumber: 'C201034569', taxIdNumber: 'GHA-P0023480' },
  'emp-gh-31': { bankName: 'Absa Bank Ghana', bankCode: '030100', bankAccountNumber: '0301001234502', ssnitNumber: 'C201045681', taxIdNumber: 'GHA-P0023481' },
  'emp-gh-32': { bankName: 'GCB Bank', bankCode: '040100', bankAccountNumber: '0401002345613', ssnitNumber: 'C201056792', taxIdNumber: 'GHA-P0023482' },
  'emp-gh-33': { bankName: 'Ecobank Ghana', bankCode: '130100', bankAccountNumber: '1301003456724', ssnitNumber: 'C201067893', taxIdNumber: 'GHA-P0023483' },
  'emp-gh-34': { bankName: 'Stanbic Bank Ghana', bankCode: '190100', bankAccountNumber: '1901004567835', ssnitNumber: 'C201078904', taxIdNumber: 'GHA-P0023484' },
  'emp-gh-35': { bankName: 'CalBank', bankCode: '230100', bankAccountNumber: '2301005678946', ssnitNumber: 'C201089015', taxIdNumber: 'GHA-P0023485' },
  'emp-gh-36': { bankName: 'Fidelity Bank Ghana', bankCode: '240100', bankAccountNumber: '2401006789057', ssnitNumber: 'C201090125', taxIdNumber: 'GHA-P0023486' },
  'emp-gh-37': { bankName: 'Absa Bank Ghana', bankCode: '030100', bankAccountNumber: '0301007890168', ssnitNumber: 'C201001237', taxIdNumber: 'GHA-P0023487' },
  'emp-gh-38': { bankName: 'GCB Bank', bankCode: '040100', bankAccountNumber: '0401008901279', ssnitNumber: 'C201012348', taxIdNumber: 'GHA-P0023488' },
  'emp-gh-39': { bankName: 'Ecobank Ghana', bankCode: '130100', bankAccountNumber: '1301009012390', ssnitNumber: 'C201023459', taxIdNumber: 'GHA-P0023489' },
  'emp-gh-40': { bankName: 'Stanbic Bank Ghana', bankCode: '190100', bankAccountNumber: '1901000123491', ssnitNumber: 'C201034570', taxIdNumber: 'GHA-P0023490' },
  'emp-gh-41': { bankName: 'CalBank', bankCode: '230100', bankAccountNumber: '2301001234502', ssnitNumber: 'C201045682', taxIdNumber: 'GHA-P0023491' },
  'emp-gh-42': { bankName: 'Fidelity Bank Ghana', bankCode: '240100', bankAccountNumber: '2401002345613', ssnitNumber: null, taxIdNumber: 'GHA-P0023492' },  // Missing SSNIT — demo scenario
  'emp-gh-43': { bankName: 'Absa Bank Ghana', bankCode: '030100', bankAccountNumber: '0301003456724', ssnitNumber: 'C201067894', taxIdNumber: 'GHA-P0023493' },
  'emp-gh-44': { bankName: 'GCB Bank', bankCode: '040100', bankAccountNumber: '0401004567835', ssnitNumber: 'C201078905', taxIdNumber: 'GHA-P0023494' },
  'emp-gh-45': { bankName: 'Ecobank Ghana', bankCode: '130100', bankAccountNumber: '1301005678946', ssnitNumber: 'C201089016', taxIdNumber: 'GHA-P0023495' },
  'emp-gh-46': { bankName: 'Stanbic Bank Ghana', bankCode: '190100', bankAccountNumber: '1901006789057', ssnitNumber: 'C201090126', taxIdNumber: 'GHA-P0023496' },
  'emp-gh-47': { bankName: 'CalBank', bankCode: '230100', bankAccountNumber: '2301007890168', ssnitNumber: 'C201001238', taxIdNumber: 'GHA-P0023497' },
  'emp-gh-48': { bankName: 'Fidelity Bank Ghana', bankCode: '240100', bankAccountNumber: '2401008901279', ssnitNumber: 'C201012349', taxIdNumber: 'GHA-P0023498' },
  'emp-gh-49': { bankName: 'Absa Bank Ghana', bankCode: '030100', bankAccountNumber: '0301009012390', ssnitNumber: 'C201023460', taxIdNumber: 'GHA-P0023499' },
  'emp-gh-50': { bankName: 'GCB Bank', bankCode: '040100', bankAccountNumber: '0401000123491', ssnitNumber: 'C201034571', taxIdNumber: 'GHA-P0023500' },
  'emp-gh-51': { bankName: 'Ecobank Ghana', bankCode: '130100', bankAccountNumber: '1301001234503', ssnitNumber: 'C201045683', taxIdNumber: 'GHA-P0023501' },
  'emp-gh-52': { bankName: 'Stanbic Bank Ghana', bankCode: '190100', bankAccountNumber: '1901002345614', ssnitNumber: 'C201056793', taxIdNumber: 'GHA-P0023502' },
  'emp-gh-53': { bankName: 'CalBank', bankCode: '230100', bankAccountNumber: '2301003456725', ssnitNumber: 'C201067895', taxIdNumber: 'GHA-P0023503' },
  'emp-gh-54': { bankName: 'Fidelity Bank Ghana', bankCode: '240100', bankAccountNumber: '2401004567836', ssnitNumber: 'C201078906', taxIdNumber: 'GHA-P0023504' },
  'emp-gh-55': { bankName: 'Absa Bank Ghana', bankCode: '030100', bankAccountNumber: '0301005678947', ssnitNumber: 'C201089017', taxIdNumber: 'GHA-P0023505' },
  'emp-gh-56': { bankName: 'GCB Bank', bankCode: '040100', bankAccountNumber: '0401006789058', ssnitNumber: 'C201090127', taxIdNumber: 'GHA-P0023506' },
};

// ---------------------------------------------------------------------------
// Salary lookup per employee
// ---------------------------------------------------------------------------

export const ghanaEmployeeSalaries: Record<string, { monthlySalaryGHS: number; annualSalaryGHS: number }> = {
  // Retail Banking
  'emp-gh-1':  { monthlySalaryGHS: 14500, annualSalaryGHS: 174000 },  // Senior Manager — Branch Manager
  'emp-gh-2':  { monthlySalaryGHS: 13800, annualSalaryGHS: 165600 },  // Senior Manager — Branch Manager
  'emp-gh-3':  { monthlySalaryGHS: 5200,  annualSalaryGHS: 62400  },  // Mid — Relationship Officer
  'emp-gh-4':  { monthlySalaryGHS: 8500,  annualSalaryGHS: 102000 },  // Mid — Relationship Officer (pre-increase salary)
  'emp-gh-5':  { monthlySalaryGHS: 2800,  annualSalaryGHS: 33600  },  // Associate — Teller
  'emp-gh-6':  { monthlySalaryGHS: 2600,  annualSalaryGHS: 31200  },  // Associate — Teller
  'emp-gh-7':  { monthlySalaryGHS: 7200,  annualSalaryGHS: 86400  },  // Senior — Customer Service Lead
  'emp-gh-8':  { monthlySalaryGHS: 3200,  annualSalaryGHS: 38400  },  // Junior — Sales Executive
  'emp-gh-9':  { monthlySalaryGHS: 15200, annualSalaryGHS: 182400 },  // Senior Manager — Branch Manager
  'emp-gh-10': { monthlySalaryGHS: 2500,  annualSalaryGHS: 30000  },  // Associate — Teller
  'emp-gh-11': { monthlySalaryGHS: 14000, annualSalaryGHS: 168000 },  // Manager — Regional Sales Manager (pre-increase)
  'emp-gh-12': { monthlySalaryGHS: 4800,  annualSalaryGHS: 57600  },  // Mid — Relationship Officer
  'emp-gh-13': { monthlySalaryGHS: 3000,  annualSalaryGHS: 36000  },  // Junior — Customer Service Officer
  'emp-gh-14': { monthlySalaryGHS: 2200,  annualSalaryGHS: 26400  },  // Associate — Teller

  // Corporate Banking
  'emp-gh-15': { monthlySalaryGHS: 7800,  annualSalaryGHS: 93600  },  // Senior — Senior Credit Analyst
  'emp-gh-16': { monthlySalaryGHS: 5500,  annualSalaryGHS: 66000  },  // Mid — Credit Analyst
  'emp-gh-17': { monthlySalaryGHS: 10500, annualSalaryGHS: 126000 },  // Manager — Corporate RM
  'emp-gh-18': { monthlySalaryGHS: 5000,  annualSalaryGHS: 60000  },  // Mid — Trade Finance
  'emp-gh-19': { monthlySalaryGHS: 4500,  annualSalaryGHS: 54000  },  // Mid — Loan Recovery
  'emp-gh-20': { monthlySalaryGHS: 8500,  annualSalaryGHS: 102000 },  // Senior — Treasury Analyst
  'emp-gh-21': { monthlySalaryGHS: 22000, annualSalaryGHS: 264000 },  // Director — Corporate Banking
  'emp-gh-22': { monthlySalaryGHS: 2800,  annualSalaryGHS: 33600  },  // Junior — Credit Analyst
  'emp-gh-23': { monthlySalaryGHS: 4600,  annualSalaryGHS: 55200  },  // Mid — Relationship Officer
  'emp-gh-24': { monthlySalaryGHS: 16000, annualSalaryGHS: 192000 },  // Senior Manager — Senior RM

  // Operations
  'emp-gh-25': { monthlySalaryGHS: 9500,  annualSalaryGHS: 114000 },  // Manager — Operations Manager
  'emp-gh-26': { monthlySalaryGHS: 3200,  annualSalaryGHS: 38400  },  // Junior — Operations Officer
  'emp-gh-27': { monthlySalaryGHS: 4800,  annualSalaryGHS: 57600  },  // Mid — Reconciliation Officer
  'emp-gh-28': { monthlySalaryGHS: 2400,  annualSalaryGHS: 28800  },  // Associate — Cash Processing
  'emp-gh-29': { monthlySalaryGHS: 5200,  annualSalaryGHS: 62400  },  // Mid — Trade Ops
  'emp-gh-30': { monthlySalaryGHS: 7000,  annualSalaryGHS: 84000  },  // Senior — Senior Ops Officer
  'emp-gh-31': { monthlySalaryGHS: 2800,  annualSalaryGHS: 33600  },  // Junior — Clearing Officer
  'emp-gh-32': { monthlySalaryGHS: 7500,  annualSalaryGHS: 90000  },  // Senior — Ops Supervisor
  'emp-gh-33': { monthlySalaryGHS: 4200,  annualSalaryGHS: 50400  },  // Mid — Vault Custodian
  'emp-gh-34': { monthlySalaryGHS: 2100,  annualSalaryGHS: 25200  },  // Associate — Operations Officer

  // Technology
  'emp-gh-35': { monthlySalaryGHS: 11000, annualSalaryGHS: 132000 },  // Manager — IT Manager
  'emp-gh-36': { monthlySalaryGHS: 5500,  annualSalaryGHS: 66000  },  // Mid — Software Engineer
  'emp-gh-37': { monthlySalaryGHS: 8200,  annualSalaryGHS: 98400  },  // Senior — DBA
  'emp-gh-38': { monthlySalaryGHS: 3500,  annualSalaryGHS: 42000  },  // Junior — IT Support
  'emp-gh-39': { monthlySalaryGHS: 9000,  annualSalaryGHS: 108000 },  // Senior — Cybersecurity
  'emp-gh-40': { monthlySalaryGHS: 5800,  annualSalaryGHS: 69600  },  // Mid — Network Engineer
  'emp-gh-41': { monthlySalaryGHS: 17500, annualSalaryGHS: 210000 },  // Senior Manager — Solutions Architect
  'emp-gh-42': { monthlySalaryGHS: 2200,  annualSalaryGHS: 26400  },  // Associate — IT Support
  'emp-gh-43': { monthlySalaryGHS: 8500,  annualSalaryGHS: 102000 },  // Senior — Software Engineer
  'emp-gh-44': { monthlySalaryGHS: 5200,  annualSalaryGHS: 62400  },  // Mid — QA Engineer
  'emp-gh-45': { monthlySalaryGHS: 6000,  annualSalaryGHS: 72000  },  // Mid — DevOps Engineer
  'emp-gh-46': { monthlySalaryGHS: 24000, annualSalaryGHS: 288000 },  // Director — IT Director

  // Finance
  'emp-gh-47': { monthlySalaryGHS: 10000, annualSalaryGHS: 120000 },  // Manager — Finance Manager
  'emp-gh-48': { monthlySalaryGHS: 4800,  annualSalaryGHS: 57600  },  // Mid — Accountant
  'emp-gh-49': { monthlySalaryGHS: 7500,  annualSalaryGHS: 90000  },  // Senior — AML Officer
  'emp-gh-50': { monthlySalaryGHS: 8000,  annualSalaryGHS: 96000  },  // Senior — Internal Auditor
  'emp-gh-51': { monthlySalaryGHS: 3000,  annualSalaryGHS: 36000  },  // Junior — Accounts Payable
  'emp-gh-52': { monthlySalaryGHS: 5200,  annualSalaryGHS: 62400  },  // Mid — Financial Analyst
  'emp-gh-53': { monthlySalaryGHS: 4500,  annualSalaryGHS: 54000  },  // Mid — Tax Analyst
  'emp-gh-54': { monthlySalaryGHS: 4800,  annualSalaryGHS: 57600  },  // Mid — Payroll Specialist
  'emp-gh-55': { monthlySalaryGHS: 20000, annualSalaryGHS: 240000 },  // Director — Finance Director
  'emp-gh-56': { monthlySalaryGHS: 2000,  annualSalaryGHS: 24000  },  // Associate — Accounts Clerk
};

// ---------------------------------------------------------------------------
// 6. PAYROLL GROUPS
// ---------------------------------------------------------------------------

export const SAMUEL_PAYROLL_GROUP = {
  id: 'pg-samuel',
  name: 'Ghana — Ecobank Evaluation Group',
  payPeriod: 'April 2026',
  payDate: '2026-04-25',
  country: 'Ghana',
  currency: 'GHS',
  employeeIds: [
    'emp-gh-1', 'emp-gh-2', 'emp-gh-3', 'emp-gh-4', 'emp-gh-5',
    'emp-gh-6', 'emp-gh-7', 'emp-gh-8', 'emp-gh-9', 'emp-gh-10',
    'emp-gh-11', 'emp-gh-12', 'emp-gh-13', 'emp-gh-14', 'emp-gh-15',
    'emp-gh-16', 'emp-gh-17', 'emp-gh-18', 'emp-gh-19', 'emp-gh-20',
    'emp-gh-21', 'emp-gh-22', 'emp-gh-23', 'emp-gh-24', 'emp-gh-25',
  ],
};

export const MEISSA_PAYROLL_GROUP = {
  id: 'pg-meissa',
  name: 'Ghana — Meissa Evaluation Group',
  payPeriod: 'April 2026',
  payDate: '2026-04-25',
  country: 'Ghana',
  currency: 'GHS',
  employeeIds: [
    'emp-gh-26', 'emp-gh-27', 'emp-gh-28', 'emp-gh-29', 'emp-gh-30',
    'emp-gh-31', 'emp-gh-32', 'emp-gh-33', 'emp-gh-34', 'emp-gh-35',
    'emp-gh-36', 'emp-gh-37', 'emp-gh-38', 'emp-gh-39', 'emp-gh-40',
    'emp-gh-41', 'emp-gh-42', 'emp-gh-43', 'emp-gh-44', 'emp-gh-45',
    'emp-gh-46', 'emp-gh-47', 'emp-gh-48', 'emp-gh-49', 'emp-gh-50',
    // Existing Ghana employees from demo-data
    'emp-3',  // Kwame Asante
    'emp-9',  // Kofi Mensah
    'emp-10', // Abena Boateng
    'emp-14', // Yaw Frimpong
    'emp-20', // Ama Darko
    'emp-26', // Akosua Owusu
  ],
};

// ---------------------------------------------------------------------------
// Payroll group scenarios — special demo flags
// ---------------------------------------------------------------------------

export const SAMUEL_GROUP_SCENARIOS = {
  proRataEmployees: ['emp-gh-4', 'emp-gh-11'] as string[],
  proRataDetails: {
    'emp-gh-4': {
      oldSalary: 8500,
      newSalary: 9520,
      effectiveDate: '2026-04-15',
      increasePercent: 12,
      daysAtOldRate: 14,
      daysAtNewRate: 16,
    },
    'emp-gh-11': {
      oldSalary: 14000,
      newSalary: 16520,
      effectiveDate: '2026-04-15',
      increasePercent: 18,
      daysAtOldRate: 14,
      daysAtNewRate: 16,
    },
  } as Record<string, { oldSalary: number; newSalary: number; effectiveDate: string; increasePercent: number; daysAtOldRate: number; daysAtNewRate: number }>,

  maternityEmployee: 'emp-gh-7',  // Full month maternity leave — Akua Tetteh, Customer Service Lead
  maternityDetails: {
    employeeId: 'emp-gh-7',
    leaveType: 'Maternity',
    startDate: '2026-03-01',
    endDate: '2026-05-31',
    fullMonthsOnLeave: true,
    salaryPercent: 100, // Ghana: 100% paid maternity
  },

  bonusEmployee: 'emp-gh-15',  // Kwame Boakye — performance bonus
  bonusAmount: 3500, // GHS

  loanEmployee: 'emp-gh-19',  // Yaw Ankomah — staff loan deduction
  loanAmount: 800,  // GHS per month
  loanDetails: {
    employeeId: 'emp-gh-19',
    totalLoan: 9600,
    monthlyDeduction: 800,
    remainingBalance: 4800,
    startDate: '2025-11-01',
    endDate: '2026-10-31',
  },

  anomalyFlags: {
    salaryVariance: 'emp-gh-11',                    // 18% increase mid-month
    duplicateBankAccount: ['emp-gh-8', 'emp-gh-22'], // share Ecobank account 1301008901278
    missingSsnit: 'emp-gh-16',                       // Nana Agyemang — no SSNIT number
  },
};

export const MEISSA_GROUP_SCENARIOS = {
  proRataEmployees: ['emp-gh-30', 'emp-gh-39'] as string[],
  proRataDetails: {
    'emp-gh-30': {
      oldSalary: 7000,
      newSalary: 7700,
      effectiveDate: '2026-04-15',
      increasePercent: 10,
      daysAtOldRate: 14,
      daysAtNewRate: 16,
    },
    'emp-gh-39': {
      oldSalary: 9000,
      newSalary: 10350,
      effectiveDate: '2026-04-15',
      increasePercent: 15,
      daysAtOldRate: 14,
      daysAtNewRate: 16,
    },
  } as Record<string, { oldSalary: number; newSalary: number; effectiveDate: string; increasePercent: number; daysAtOldRate: number; daysAtNewRate: number }>,

  maternityEmployee: 'emp-gh-34',  // Akosua Manu — full month maternity leave
  maternityDetails: {
    employeeId: 'emp-gh-34',
    leaveType: 'Maternity',
    startDate: '2026-03-15',
    endDate: '2026-06-14',
    fullMonthsOnLeave: true,
    salaryPercent: 100,
  },

  bonusEmployee: 'emp-gh-43',  // Kofi Amponsah — project delivery bonus
  bonusAmount: 4200, // GHS

  loanEmployee: 'emp-gh-48',  // Yaw Opoku — vehicle loan deduction
  loanAmount: 650,  // GHS per month
  loanDetails: {
    employeeId: 'emp-gh-48',
    totalLoan: 7800,
    monthlyDeduction: 650,
    remainingBalance: 3250,
    startDate: '2025-12-01',
    endDate: '2026-11-30',
  },

  anomalyFlags: {
    salaryVariance: 'emp-gh-39',                    // 15% increase mid-month
    duplicateBankAccount: ['emp-gh-27', 'emp-gh-33'], // share Ecobank account 1301003456724
    missingSsnit: 'emp-gh-42',                       // Ama Sefa Dedeh — no SSNIT number
  },
};

// ---------------------------------------------------------------------------
// 7. Personal payslip data — March 2026
// ---------------------------------------------------------------------------

// Ghana PAYE calculation helper (2026 annual brackets)
// Band 1: First GHS 4,824      => 0%
// Band 2: Next  GHS 1,320      => 5%
// Band 3: Next  GHS 1,560      => 10%
// Band 4: Next  GHS 36,000     => 17.5%
// Band 5: Next  GHS 196,296    => 25%
// Band 6: Above GHS 240,000    => 30%

function computeGhanaPAYE(annualGross: number): { annualPAYE: number; monthlyPAYE: number; bands: { band: string; taxableAmount: number; rate: number; tax: number }[] } {
  let remaining = annualGross;
  const bands: { band: string; taxableAmount: number; rate: number; tax: number }[] = [];

  const brackets = [
    { band: 'First GHS 4,824',      limit: 4824,   rate: 0    },
    { band: 'Next GHS 1,320',       limit: 1320,   rate: 0.05 },
    { band: 'Next GHS 1,560',       limit: 1560,   rate: 0.10 },
    { band: 'Next GHS 36,000',      limit: 36000,  rate: 0.175 },
    { band: 'Next GHS 196,296',     limit: 196296, rate: 0.25 },
    { band: 'Exceeding GHS 240,000', limit: Infinity, rate: 0.30 },
  ];

  let totalTax = 0;
  for (const b of brackets) {
    const taxable = Math.min(remaining, b.limit);
    if (taxable <= 0) {
      bands.push({ band: b.band, taxableAmount: 0, rate: b.rate, tax: 0 });
      continue;
    }
    const tax = Math.round(taxable * b.rate * 100) / 100;
    bands.push({ band: b.band, taxableAmount: taxable, rate: b.rate, tax });
    totalTax += tax;
    remaining -= taxable;
  }

  return {
    annualPAYE: Math.round(totalTax * 100) / 100,
    monthlyPAYE: Math.round((totalTax / 12) * 100) / 100,
    bands,
  };
}

// Samuel Mireku — GHS 28,500/month
const samuelPAYE = computeGhanaPAYE(28500 * 12);

export const evaluatorPayslips = {
  samuel: {
    id: 'epe-eval-samuel',
    org_id: 'org-1',
    payroll_run_id: 'pr-eval-samuel-mar26',
    employee_id: 'emp-eval-samuel',
    employee_name: 'Samuel Mireku',
    department: 'Human Resources',
    country: 'Ghana',
    pay_period: 'March 2026',
    pay_date: '2026-03-25',
    currency: 'GHS',

    // Earnings
    base_pay: 28500,
    gross_pay: 28500,
    bonus: 0,
    overtime: 0,
    allowances: 0,

    // Statutory deductions
    ssnit_employee: 1567.50,      // 5.5% of 28,500
    ssnit_employer: 3705,         // 13% of 28,500
    tier2_employee: 0,            // Tier 2 is employer-only in this setup
    paye: samuelPAYE.monthlyPAYE, // 7,183.00
    paye_bands: samuelPAYE.bands,

    // Other deductions
    loan_deduction: 0,
    other_deductions: 0,

    total_deductions: 1567.50 + samuelPAYE.monthlyPAYE,
    net_pay: 28500 - 1567.50 - samuelPAYE.monthlyPAYE, // 19,749.50

    // Bank details
    bank_name: 'GCB Bank',
    bank_account_ending: '4821',

    // For compatibility with demoEmployeePayrollEntries shape
    federal_tax: samuelPAYE.monthlyPAYE,
    state_tax: 0,
    social_security: 1567.50,
    medicare: 0,
    pension: 0,
    health_insurance: 0,
  },

  meissa: {
    id: 'epe-eval-meissa',
    org_id: 'org-1',
    payroll_run_id: 'pr-eval-meissa-mar26',
    employee_id: 'emp-eval-meissa',
    employee_name: 'Meissa Fall',
    department: 'Human Resources',
    country: 'Ghana',
    pay_period: 'March 2026',
    pay_date: '2026-03-25',
    currency: 'GHS',

    // Earnings
    base_pay: 26500,
    gross_pay: 26500,
    bonus: 0,
    overtime: 0,
    allowances: 0,

    // Statutory deductions
    ssnit_employee: 1457.50,      // 5.5% of 26,500
    ssnit_employer: 3445,         // 13% of 26,500
    tier2_employee: 0,
    paye: computeGhanaPAYE(26500 * 12).monthlyPAYE, // 6,583.00
    paye_bands: computeGhanaPAYE(26500 * 12).bands,

    // Other deductions
    loan_deduction: 0,
    other_deductions: 0,

    total_deductions: 1457.50 + computeGhanaPAYE(26500 * 12).monthlyPAYE,
    net_pay: 26500 - 1457.50 - computeGhanaPAYE(26500 * 12).monthlyPAYE, // 18,459.50

    // Bank details
    bank_name: 'Ecobank Ghana',
    bank_account_ending: '7634',

    // For compatibility with demoEmployeePayrollEntries shape
    federal_tax: computeGhanaPAYE(26500 * 12).monthlyPAYE,
    state_tax: 0,
    social_security: 1457.50,
    medicare: 0,
    pension: 0,
    health_insurance: 0,
  },
};

// ---------------------------------------------------------------------------
// 8. EVALUATOR_SIDEBAR_ALLOWED
// ---------------------------------------------------------------------------

export const EVALUATOR_SIDEBAR_ALLOWED = new Set([
  '/dashboard',
  '/people',
  '/compensation',
  '/benefits',
  '/payroll',
  '/payslips',
  '/analytics',
  '/performance',
  '/headcount',
  '/finance',
]);

// ---------------------------------------------------------------------------
// 9. WALKTHROUGH_STEPS — 10-step guided evaluator flow
// ---------------------------------------------------------------------------

export const WALKTHROUGH_STEPS = [
  {
    step: 1,
    title: 'Create Pay Run',
    description: 'Set up a new monthly payroll run for April 2026 for your Ghana evaluation group. Select the pay period, confirm the employee group, and initiate the run.',
    completionKey: 'payRunCreated',
  },
  {
    step: 2,
    title: 'Review Employee List',
    description: 'Review the 25 employees in your payroll group. Verify headcount, departments, and that all required employee data (SSNIT numbers, bank details, tax IDs) is present.',
    completionKey: 'employeeListReviewed',
  },
  {
    step: 3,
    title: 'Handle Pro-Rata Adjustments',
    description: 'Two employees received mid-month salary increases effective April 15. Review the pro-rata calculations that split their pay between the old and new rates.',
    completionKey: 'proRataHandled',
  },
  {
    step: 4,
    title: 'Process Special Items',
    description: 'Apply special payroll items: a GHS 3,500 performance bonus for one employee, a GHS 800 monthly loan deduction for another, and confirm maternity leave salary for a third.',
    completionKey: 'specialItemsProcessed',
  },
  {
    step: 5,
    title: 'Run Gross-to-Net Calculation',
    description: 'Execute the gross-to-net engine for all 25 employees. The system computes SSNIT (5.5% employee, 13% employer), PAYE on Ghana progressive tax bands, and arrives at net pay.',
    completionKey: 'grossToNetCalculated',
  },
  {
    step: 6,
    title: 'Review Anomaly Flags',
    description: 'The system has flagged three anomalies: an 18% salary variance, duplicate bank account numbers between two employees, and a missing SSNIT number. Review and resolve each flag.',
    completionKey: 'anomaliesReviewed',
  },
  {
    step: 7,
    title: 'View Payslip Preview',
    description: 'Preview your own payslip for the current month. Verify the SSNIT deduction, PAYE tax computation across all six Ghana tax bands, and the final net pay amount.',
    completionKey: 'payslipPreviewed',
  },
  {
    step: 8,
    title: 'Generate Reports',
    description: 'Generate the payroll summary report, SSNIT contribution report (employer + employee), and the GRA PAYE filing report. Review totals and export for filing.',
    completionKey: 'reportsGenerated',
  },
  {
    step: 9,
    title: 'Approve & Lock Pay Run',
    description: 'Submit the pay run for approval. Review the final summary showing total gross, total deductions, total net, and employer costs. Lock the pay run to prevent further changes.',
    completionKey: 'payRunApproved',
  },
  {
    step: 10,
    title: 'Generate Bank File',
    description: 'Generate the GhIPSS ACH bank payment file for electronic salary disbursement. Review the file format with bank codes, account numbers, and payment amounts for all 25 employees.',
    completionKey: 'bankFileGenerated',
  },
];

// ---------------------------------------------------------------------------
// Helper: get Ghana employees for a specific payroll group
// ---------------------------------------------------------------------------

export function getPayrollGroupEmployees(groupId: string) {
  const group = groupId === 'pg-samuel' ? SAMUEL_PAYROLL_GROUP : MEISSA_PAYROLL_GROUP;
  return ghanaEvaluatorEmployees.filter(emp => group.employeeIds.includes(emp.id));
}

export function getPayrollGroupScenarios(groupId: string) {
  return groupId === 'pg-samuel' ? SAMUEL_GROUP_SCENARIOS : MEISSA_GROUP_SCENARIOS;
}

// ---------------------------------------------------------------------------
// Existing Ghana employees from demo-data (IDs used in Meissa's group)
// ---------------------------------------------------------------------------

export const EXISTING_GHANA_EMPLOYEE_IDS = ['emp-3', 'emp-9', 'emp-10', 'emp-14', 'emp-20', 'emp-26'];

// ---------------------------------------------------------------------------
// Ghana tax constants (for reference in UI)
// ---------------------------------------------------------------------------

export const GHANA_TAX_CONFIG = {
  ssnitEmployeeRate: 0.055,
  ssnitEmployerRate: 0.13,
  tier2EmployerRate: 0.05,
  payeBands: [
    { label: 'First GHS 4,824',       threshold: 4824,   rate: 0,     cumulativeThreshold: 4824   },
    { label: 'Next GHS 1,320',        threshold: 1320,   rate: 0.05,  cumulativeThreshold: 6144   },
    { label: 'Next GHS 1,560',        threshold: 1560,   rate: 0.10,  cumulativeThreshold: 7704   },
    { label: 'Next GHS 36,000',       threshold: 36000,  rate: 0.175, cumulativeThreshold: 43704  },
    { label: 'Next GHS 196,296',      threshold: 196296, rate: 0.25,  cumulativeThreshold: 240000 },
    { label: 'Exceeding GHS 240,000', threshold: Infinity, rate: 0.30, cumulativeThreshold: Infinity },
  ],
  ghipsBankCodes: {
    'GCB Bank': '040100',
    'Ecobank Ghana': '130100',
    'Stanbic Bank Ghana': '190100',
    'CalBank': '230100',
    'Fidelity Bank Ghana': '240100',
    'Absa Bank Ghana': '030100',
  } as Record<string, string>,
};

// Re-export the PAYE calculator for use by other modules
export { computeGhanaPAYE };
