// Demo data for Tempo Platform - comprehensive data across all 16 modules
// This allows the platform to work instantly without Supabase

// Organization
export const demoOrg = {
  id: 'org-1',
  name: 'Ecobank Transnational',
  slug: 'ecobank',
  logo_url: null,
  plan: 'enterprise' as const,
  industry: 'Banking & Financial Services',
  size: '10000+',
  country: 'Nigeria',
  created_at: '2024-01-01T00:00:00Z',
}

// Current User
export const demoUser = {
  id: 'user-1',
  email: 'amara.kone@ecobank.com',
  full_name: 'Amara Kone',
  avatar_url: null,
  role: 'admin' as const,
  department_id: 'dept-5',
}

// Departments
export const demoDepartments = [
  { id: 'dept-1', org_id: 'org-1', name: 'Retail Banking', parent_id: null, head_id: 'emp-1' },
  { id: 'dept-2', org_id: 'org-1', name: 'Corporate Banking', parent_id: null, head_id: 'emp-5' },
  { id: 'dept-3', org_id: 'org-1', name: 'Operations', parent_id: null, head_id: 'emp-9' },
  { id: 'dept-4', org_id: 'org-1', name: 'Technology', parent_id: null, head_id: 'emp-13' },
  { id: 'dept-5', org_id: 'org-1', name: 'Human Resources', parent_id: null, head_id: 'emp-17' },
  { id: 'dept-6', org_id: 'org-1', name: 'Risk & Compliance', parent_id: null, head_id: 'emp-21' },
  { id: 'dept-7', org_id: 'org-1', name: 'Finance', parent_id: null, head_id: 'emp-24' },
  { id: 'dept-8', org_id: 'org-1', name: 'Marketing', parent_id: null, head_id: 'emp-27' },
]

// Employees (30 across 8 departments, 5 countries)
export const demoEmployees = [
  // Retail Banking
  { id: 'emp-1', org_id: 'org-1', department_id: 'dept-1', job_title: 'Head of Retail Banking', level: 'Director', country: 'Nigeria', role: 'admin' as const, profile: { full_name: 'Oluwaseun Adeyemi', email: 'o.adeyemi@ecobank.com', avatar_url: null, phone: '+234 801 234 5678' } },
  { id: 'emp-2', org_id: 'org-1', department_id: 'dept-1', job_title: 'Branch Manager', level: 'Senior Manager', country: 'Nigeria', role: 'manager' as const, profile: { full_name: 'Ngozi Okafor', email: 'n.okafor@ecobank.com', avatar_url: null, phone: '+234 802 345 6789' } },
  { id: 'emp-3', org_id: 'org-1', department_id: 'dept-1', job_title: 'Relationship Manager', level: 'Manager', country: 'Ghana', role: 'employee' as const, profile: { full_name: 'Kwame Asante', email: 'k.asante@ecobank.com', avatar_url: null, phone: '+233 20 123 4567' } },
  { id: 'emp-4', org_id: 'org-1', department_id: 'dept-1', job_title: 'Teller', level: 'Associate', country: 'Nigeria', role: 'employee' as const, profile: { full_name: 'Chioma Eze', email: 'c.eze@ecobank.com', avatar_url: null, phone: '+234 803 456 7890' } },
  // Corporate Banking
  { id: 'emp-5', org_id: 'org-1', department_id: 'dept-2', job_title: 'Head of Corporate Banking', level: 'Director', country: "Cote d'Ivoire", role: 'admin' as const, profile: { full_name: 'Amadou Diallo', email: 'a.diallo@ecobank.com', avatar_url: null, phone: '+225 07 12 34 56' } },
  { id: 'emp-6', org_id: 'org-1', department_id: 'dept-2', job_title: 'Senior Analyst', level: 'Senior', country: 'Senegal', role: 'employee' as const, profile: { full_name: 'Fatou Ndiaye', email: 'f.ndiaye@ecobank.com', avatar_url: null, phone: '+221 77 123 45 67' } },
  { id: 'emp-7', org_id: 'org-1', department_id: 'dept-2', job_title: 'Credit Analyst', level: 'Mid', country: "Cote d'Ivoire", role: 'employee' as const, profile: { full_name: 'Marie Kouassi', email: 'm.kouassi@ecobank.com', avatar_url: null, phone: '+225 05 23 45 67' } },
  { id: 'emp-8', org_id: 'org-1', department_id: 'dept-2', job_title: 'Relationship Manager', level: 'Manager', country: 'Kenya', role: 'employee' as const, profile: { full_name: 'James Kamau', email: 'j.kamau@ecobank.com', avatar_url: null, phone: '+254 712 345 678' } },
  // Operations
  { id: 'emp-9', org_id: 'org-1', department_id: 'dept-3', job_title: 'Head of Operations', level: 'Director', country: 'Ghana', role: 'admin' as const, profile: { full_name: 'Kofi Mensah', email: 'k.mensah@ecobank.com', avatar_url: null, phone: '+233 24 567 8901' } },
  { id: 'emp-10', org_id: 'org-1', department_id: 'dept-3', job_title: 'Operations Officer', level: 'Junior', country: 'Ghana', role: 'employee' as const, profile: { full_name: 'Abena Boateng', email: 'a.boateng@ecobank.com', avatar_url: null, phone: '+233 20 678 9012' } },
  { id: 'emp-11', org_id: 'org-1', department_id: 'dept-3', job_title: 'Process Analyst', level: 'Mid', country: 'Nigeria', role: 'employee' as const, profile: { full_name: 'Emeka Nwankwo', email: 'e.nwankwo@ecobank.com', avatar_url: null, phone: '+234 804 567 8901' } },
  { id: 'emp-12', org_id: 'org-1', department_id: 'dept-3', job_title: 'Logistics Coordinator', level: 'Associate', country: 'Kenya', role: 'employee' as const, profile: { full_name: 'Wanjiku Muthoni', email: 'w.muthoni@ecobank.com', avatar_url: null, phone: '+254 722 345 678' } },
  // Technology
  { id: 'emp-13', org_id: 'org-1', department_id: 'dept-4', job_title: 'CTO', level: 'Executive', country: 'Nigeria', role: 'admin' as const, profile: { full_name: 'Babajide Ogunleye', email: 'b.ogunleye@ecobank.com', avatar_url: null, phone: '+234 805 678 9012' } },
  { id: 'emp-14', org_id: 'org-1', department_id: 'dept-4', job_title: 'Senior Software Engineer', level: 'Senior', country: 'Ghana', role: 'employee' as const, profile: { full_name: 'Yaw Frimpong', email: 'y.frimpong@ecobank.com', avatar_url: null, phone: '+233 26 789 0123' } },
  { id: 'emp-15', org_id: 'org-1', department_id: 'dept-4', job_title: 'DevOps Engineer', level: 'Senior', country: 'Kenya', role: 'employee' as const, profile: { full_name: 'Brian Otieno', email: 'b.otieno@ecobank.com', avatar_url: null, phone: '+254 733 456 789' } },
  { id: 'emp-16', org_id: 'org-1', department_id: 'dept-4', job_title: 'UX Designer', level: 'Mid', country: 'Nigeria', role: 'employee' as const, profile: { full_name: 'Adaeze Ikechukwu', email: 'a.ikechukwu@ecobank.com', avatar_url: null, phone: '+234 806 789 0123' } },
  // Human Resources
  { id: 'emp-17', org_id: 'org-1', department_id: 'dept-5', job_title: 'CHRO', level: 'Executive', country: "Cote d'Ivoire", role: 'owner' as const, profile: { full_name: 'Amara Kone', email: 'amara.kone@ecobank.com', avatar_url: null, phone: '+225 07 89 01 23' } },
  { id: 'emp-18', org_id: 'org-1', department_id: 'dept-5', job_title: 'Talent Acquisition Manager', level: 'Manager', country: 'Nigeria', role: 'manager' as const, profile: { full_name: 'Folake Adebayo', email: 'f.adebayo@ecobank.com', avatar_url: null, phone: '+234 807 890 1234' } },
  { id: 'emp-19', org_id: 'org-1', department_id: 'dept-5', job_title: 'L&D Specialist', level: 'Mid', country: 'Senegal', role: 'employee' as const, profile: { full_name: 'Moussa Sow', email: 'm.sow@ecobank.com', avatar_url: null, phone: '+221 76 234 56 78' } },
  { id: 'emp-20', org_id: 'org-1', department_id: 'dept-5', job_title: 'HR Business Partner', level: 'Senior', country: 'Ghana', role: 'manager' as const, profile: { full_name: 'Ama Darko', email: 'a.darko@ecobank.com', avatar_url: null, phone: '+233 27 890 1234' } },
  // Risk & Compliance
  { id: 'emp-21', org_id: 'org-1', department_id: 'dept-6', job_title: 'Chief Risk Officer', level: 'Executive', country: 'Nigeria', role: 'admin' as const, profile: { full_name: 'Chukwuma Obi', email: 'c.obi@ecobank.com', avatar_url: null, phone: '+234 808 901 2345' } },
  { id: 'emp-22', org_id: 'org-1', department_id: 'dept-6', job_title: 'Compliance Manager', level: 'Manager', country: 'Senegal', role: 'manager' as const, profile: { full_name: 'Ousmane Ba', email: 'o.ba@ecobank.com', avatar_url: null, phone: '+221 78 345 67 89' } },
  { id: 'emp-23', org_id: 'org-1', department_id: 'dept-6', job_title: 'Risk Analyst', level: 'Mid', country: 'Kenya', role: 'employee' as const, profile: { full_name: 'Grace Wambui', email: 'g.wambui@ecobank.com', avatar_url: null, phone: '+254 744 567 890' } },
  // Finance
  { id: 'emp-24', org_id: 'org-1', department_id: 'dept-7', job_title: 'CFO', level: 'Executive', country: 'Nigeria', role: 'admin' as const, profile: { full_name: 'Ifeanyi Agu', email: 'i.agu@ecobank.com', avatar_url: null, phone: '+234 809 012 3456' } },
  { id: 'emp-25', org_id: 'org-1', department_id: 'dept-7', job_title: 'Financial Controller', level: 'Senior Manager', country: "Cote d'Ivoire", role: 'manager' as const, profile: { full_name: 'Seydou Traore', email: 's.traore@ecobank.com', avatar_url: null, phone: '+225 05 67 89 01' } },
  { id: 'emp-26', org_id: 'org-1', department_id: 'dept-7', job_title: 'Accountant', level: 'Mid', country: 'Ghana', role: 'employee' as const, profile: { full_name: 'Akosua Owusu', email: 'a.owusu@ecobank.com', avatar_url: null, phone: '+233 28 901 2345' } },
  // Marketing
  { id: 'emp-27', org_id: 'org-1', department_id: 'dept-8', job_title: 'CMO', level: 'Executive', country: 'Nigeria', role: 'admin' as const, profile: { full_name: 'Nneka Uzoma', email: 'n.uzoma@ecobank.com', avatar_url: null, phone: '+234 810 123 4567' } },
  { id: 'emp-28', org_id: 'org-1', department_id: 'dept-8', job_title: 'Digital Marketing Lead', level: 'Senior', country: 'Kenya', role: 'employee' as const, profile: { full_name: 'Peter Njoroge', email: 'p.njoroge@ecobank.com', avatar_url: null, phone: '+254 755 678 901' } },
  { id: 'emp-29', org_id: 'org-1', department_id: 'dept-8', job_title: 'Brand Designer', level: 'Mid', country: 'Nigeria', role: 'employee' as const, profile: { full_name: 'Tunde Bakare', email: 't.bakare@ecobank.com', avatar_url: null, phone: '+234 811 234 5678' } },
  { id: 'emp-30', org_id: 'org-1', department_id: 'dept-8', job_title: 'Content Writer', level: 'Junior', country: 'Senegal', role: 'employee' as const, profile: { full_name: 'Aminata Diop', email: 'a.diop@ecobank.com', avatar_url: null, phone: '+221 77 456 78 90' } },
]

// Performance - Goals
export const demoGoals = [
  { id: 'goal-1', org_id: 'org-1', employee_id: 'emp-2', title: 'Increase branch revenue by 15%', description: 'Drive revenue growth through new product cross-sell', category: 'business' as const, status: 'on_track' as const, progress: 72, start_date: '2026-01-01', due_date: '2026-06-30', created_at: '2026-01-05T00:00:00Z' },
  { id: 'goal-2', org_id: 'org-1', employee_id: 'emp-6', title: 'Complete credit portfolio review', description: 'Review and risk-rate all corporate credit facilities', category: 'project' as const, status: 'on_track' as const, progress: 45, start_date: '2026-01-15', due_date: '2026-03-31', created_at: '2026-01-10T00:00:00Z' },
  { id: 'goal-3', org_id: 'org-1', employee_id: 'emp-14', title: 'Migrate payment gateway to v3', description: 'Complete migration of payment processing to new API', category: 'project' as const, status: 'at_risk' as const, progress: 30, start_date: '2026-01-01', due_date: '2026-03-15', created_at: '2026-01-03T00:00:00Z' },
  { id: 'goal-4', org_id: 'org-1', employee_id: 'emp-18', title: 'Reduce time-to-hire to 45 days', description: 'Streamline recruitment process across all regions', category: 'business' as const, status: 'on_track' as const, progress: 60, start_date: '2026-01-01', due_date: '2026-06-30', created_at: '2026-01-05T00:00:00Z' },
  { id: 'goal-5', org_id: 'org-1', employee_id: 'emp-11', title: 'Automate reconciliation process', description: 'Reduce manual reconciliation by 80% through automation', category: 'project' as const, status: 'behind' as const, progress: 15, start_date: '2026-02-01', due_date: '2026-04-30', created_at: '2026-01-28T00:00:00Z' },
  { id: 'goal-6', org_id: 'org-1', employee_id: 'emp-3', title: 'Achieve 95% client satisfaction score', description: 'Improve NPS across retail banking client base', category: 'business' as const, status: 'on_track' as const, progress: 88, start_date: '2026-01-01', due_date: '2026-06-30', created_at: '2026-01-05T00:00:00Z' },
  { id: 'goal-7', org_id: 'org-1', employee_id: 'emp-19', title: 'Launch leadership development program', description: 'Design and roll out new leadership curriculum for managers', category: 'development' as const, status: 'on_track' as const, progress: 55, start_date: '2026-01-15', due_date: '2026-04-30', created_at: '2026-01-12T00:00:00Z' },
  { id: 'goal-8', org_id: 'org-1', employee_id: 'emp-22', title: 'Complete UEMOA regulatory audit', description: 'Ensure compliance with all UEMOA banking regulations', category: 'compliance' as const, status: 'on_track' as const, progress: 40, start_date: '2026-02-01', due_date: '2026-05-31', created_at: '2026-01-25T00:00:00Z' },
]

// Performance - Review Cycles
export const demoReviewCycles = [
  { id: 'cycle-1', org_id: 'org-1', title: 'H1 2026 Performance Review', type: 'mid_year' as const, status: 'active' as const, start_date: '2026-01-15', end_date: '2026-03-15', created_at: '2026-01-10T00:00:00Z' },
  { id: 'cycle-2', org_id: 'org-1', title: '2025 Annual Review', type: 'annual' as const, status: 'completed' as const, start_date: '2025-11-01', end_date: '2025-12-31', created_at: '2025-10-15T00:00:00Z' },
]

// Performance - Reviews
export const demoReviews = [
  { id: 'rev-1', org_id: 'org-1', cycle_id: 'cycle-1', employee_id: 'emp-2', reviewer_id: 'emp-1', type: 'manager' as const, status: 'submitted' as const, overall_rating: 4, ratings: { leadership: 4, execution: 5, collaboration: 4, innovation: 3 }, comments: 'Ngozi has been an exceptional branch manager. Her team consistently exceeds targets.', submitted_at: '2026-02-10T00:00:00Z', created_at: '2026-01-20T00:00:00Z' },
  { id: 'rev-2', org_id: 'org-1', cycle_id: 'cycle-1', employee_id: 'emp-6', reviewer_id: 'emp-5', type: 'manager' as const, status: 'submitted' as const, overall_rating: 5, ratings: { leadership: 4, execution: 5, collaboration: 5, innovation: 5 }, comments: 'Fatou is our top analyst. Her credit analysis work has been outstanding this cycle.', submitted_at: '2026-02-08T00:00:00Z', created_at: '2026-01-20T00:00:00Z' },
  { id: 'rev-3', org_id: 'org-1', cycle_id: 'cycle-1', employee_id: 'emp-14', reviewer_id: 'emp-13', type: 'manager' as const, status: 'in_progress' as const, overall_rating: null, ratings: null, comments: null, submitted_at: null, created_at: '2026-01-20T00:00:00Z' },
  { id: 'rev-4', org_id: 'org-1', cycle_id: 'cycle-1', employee_id: 'emp-3', reviewer_id: 'emp-1', type: 'manager' as const, status: 'submitted' as const, overall_rating: 4, ratings: { leadership: 3, execution: 4, collaboration: 5, innovation: 4 }, comments: 'Kwame has shown strong relationship management skills.', submitted_at: '2026-02-12T00:00:00Z', created_at: '2026-01-20T00:00:00Z' },
  { id: 'rev-5', org_id: 'org-1', cycle_id: 'cycle-1', employee_id: 'emp-10', reviewer_id: 'emp-9', type: 'manager' as const, status: 'pending' as const, overall_rating: null, ratings: null, comments: null, submitted_at: null, created_at: '2026-01-20T00:00:00Z' },
  { id: 'rev-6', org_id: 'org-1', cycle_id: 'cycle-1', employee_id: 'emp-4', reviewer_id: 'emp-2', type: 'manager' as const, status: 'submitted' as const, overall_rating: 3, ratings: { leadership: 2, execution: 4, collaboration: 3, innovation: 2 }, comments: 'Chioma is reliable and handles daily operations well. Needs development in leadership skills.', submitted_at: '2026-02-18T00:00:00Z', created_at: '2026-01-20T00:00:00Z' },
]

// Feedback
export const demoFeedback = [
  { id: 'fb-1', org_id: 'org-1', from_id: 'emp-1', to_id: 'emp-2', type: 'recognition' as const, content: 'Great job leading the Lagos branch expansion. The team transition was seamless.', is_public: true, created_at: '2026-02-18T00:00:00Z' },
  { id: 'fb-2', org_id: 'org-1', from_id: 'emp-5', to_id: 'emp-6', type: 'recognition' as const, content: 'Outstanding credit analysis on the infrastructure deal. Your due diligence was thorough.', is_public: true, created_at: '2026-02-15T00:00:00Z' },
  { id: 'fb-3', org_id: 'org-1', from_id: 'emp-13', to_id: 'emp-14', type: 'feedback' as const, content: 'Consider adding more unit tests for the payment module. Code quality is excellent otherwise.', is_public: false, created_at: '2026-02-14T00:00:00Z' },
  { id: 'fb-4', org_id: 'org-1', from_id: 'emp-9', to_id: 'emp-11', type: 'recognition' as const, content: 'The process automation you implemented saved the operations team 200+ hours this quarter.', is_public: true, created_at: '2026-02-12T00:00:00Z' },
  { id: 'fb-5', org_id: 'org-1', from_id: 'emp-17', to_id: 'emp-19', type: 'checkin' as const, content: 'Good progress on the leadership development program. Let us review the curriculum together next week.', is_public: false, created_at: '2026-02-10T00:00:00Z' },
]

// Compensation
export const demoCompBands = [
  { id: 'band-1', org_id: 'org-1', role_title: 'Branch Manager', level: 'Senior Manager', country: 'Nigeria', min_salary: 55000, mid_salary: 72000, max_salary: 90000, currency: 'USD', p25: 60000, p50: 72000, p75: 85000, effective_date: '2026-01-01' },
  { id: 'band-2', org_id: 'org-1', role_title: 'Relationship Manager', level: 'Manager', country: 'Ghana', min_salary: 42000, mid_salary: 58000, max_salary: 75000, currency: 'USD', p25: 48000, p50: 58000, p75: 70000, effective_date: '2026-01-01' },
  { id: 'band-3', org_id: 'org-1', role_title: 'Teller', level: 'Associate', country: 'Nigeria', min_salary: 18000, mid_salary: 24000, max_salary: 32000, currency: 'USD', p25: 20000, p50: 24000, p75: 29000, effective_date: '2026-01-01' },
  { id: 'band-4', org_id: 'org-1', role_title: 'Senior Software Engineer', level: 'Senior', country: 'Ghana', min_salary: 65000, mid_salary: 85000, max_salary: 110000, currency: 'USD', p25: 72000, p50: 85000, p75: 100000, effective_date: '2026-01-01' },
  { id: 'band-5', org_id: 'org-1', role_title: 'Senior Analyst', level: 'Senior', country: 'Senegal', min_salary: 48000, mid_salary: 65000, max_salary: 82000, currency: 'USD', p25: 55000, p50: 65000, p75: 78000, effective_date: '2026-01-01' },
  { id: 'band-6', org_id: 'org-1', role_title: 'Director', level: 'Director', country: null, min_salary: 100000, mid_salary: 130000, max_salary: 170000, currency: 'USD', p25: 110000, p50: 130000, p75: 155000, effective_date: '2026-01-01' },
]

export const demoSalaryReviews = [
  { id: 'sr-1', org_id: 'org-1', employee_id: 'emp-2', proposed_by: 'emp-1', current_salary: 72000, proposed_salary: 78000, currency: 'USD', justification: 'Consistently exceeded branch targets. Below market P50 for role.', status: 'pending_approval' as const, approved_by: null, cycle: '2026 Annual', created_at: '2026-02-15T00:00:00Z' },
  { id: 'sr-2', org_id: 'org-1', employee_id: 'emp-6', proposed_by: 'emp-5', current_salary: 65000, proposed_salary: 72000, currency: 'USD', justification: 'Top performer. Promoted to lead analyst role with expanded scope.', status: 'approved' as const, approved_by: 'emp-17', cycle: '2026 Annual', created_at: '2026-02-10T00:00:00Z' },
  { id: 'sr-3', org_id: 'org-1', employee_id: 'emp-14', proposed_by: 'emp-13', current_salary: 85000, proposed_salary: 95000, currency: 'USD', justification: 'Critical talent retention. Market rate for senior engineers has increased significantly.', status: 'pending_approval' as const, approved_by: null, cycle: '2026 Annual', created_at: '2026-02-12T00:00:00Z' },
  { id: 'sr-4', org_id: 'org-1', employee_id: 'emp-10', proposed_by: 'emp-9', current_salary: 35000, proposed_salary: 38000, currency: 'USD', justification: 'Completed probation successfully. Annual adjustment.', status: 'approved' as const, approved_by: 'emp-17', cycle: '2026 Annual', created_at: '2026-02-08T00:00:00Z' },
]

// Learning
export const demoCourses = [
  { id: 'course-1', org_id: 'org-1', title: 'Leadership Essentials', description: 'Foundation program for new and aspiring managers', category: 'Leadership', duration_hours: 20, format: 'blended' as const, level: 'intermediate' as const, is_mandatory: false, created_at: '2025-06-01T00:00:00Z' },
  { id: 'course-2', org_id: 'org-1', title: 'Anti-Money Laundering (AML) Compliance', description: 'Annual mandatory compliance training on AML regulations', category: 'Compliance', duration_hours: 4, format: 'online' as const, level: 'beginner' as const, is_mandatory: true, created_at: '2025-01-01T00:00:00Z' },
  { id: 'course-3', org_id: 'org-1', title: 'Advanced Credit Analysis', description: 'Deep dive into credit risk assessment and structuring', category: 'Technical', duration_hours: 16, format: 'classroom' as const, level: 'advanced' as const, is_mandatory: false, created_at: '2025-03-01T00:00:00Z' },
  { id: 'course-4', org_id: 'org-1', title: 'Digital Banking Fundamentals', description: 'Understanding modern digital banking platforms and APIs', category: 'Technology', duration_hours: 8, format: 'online' as const, level: 'beginner' as const, is_mandatory: false, created_at: '2025-09-01T00:00:00Z' },
  { id: 'course-5', org_id: 'org-1', title: 'Customer Experience Excellence', description: 'Building world-class customer service in banking', category: 'Service', duration_hours: 12, format: 'blended' as const, level: 'intermediate' as const, is_mandatory: false, created_at: '2025-04-01T00:00:00Z' },
  { id: 'course-6', org_id: 'org-1', title: 'Data Privacy & GDPR', description: 'Data protection regulations and best practices', category: 'Compliance', duration_hours: 3, format: 'online' as const, level: 'beginner' as const, is_mandatory: true, created_at: '2025-01-15T00:00:00Z' },
  { id: 'course-7', org_id: 'org-1', title: 'Agile Project Management', description: 'Scrum, Kanban, and agile methodologies for banking projects', category: 'Management', duration_hours: 16, format: 'online' as const, level: 'intermediate' as const, is_mandatory: false, created_at: '2025-07-01T00:00:00Z' },
  { id: 'course-8', org_id: 'org-1', title: 'Executive Presence', description: 'Communication and leadership presence for senior leaders', category: 'Leadership', duration_hours: 8, format: 'classroom' as const, level: 'advanced' as const, is_mandatory: false, created_at: '2025-05-01T00:00:00Z' },
]

export const demoEnrollments = [
  { id: 'enr-1', org_id: 'org-1', employee_id: 'emp-2', course_id: 'course-1', status: 'in_progress' as const, progress: 65, enrolled_at: '2026-01-15T00:00:00Z', completed_at: null },
  { id: 'enr-2', org_id: 'org-1', employee_id: 'emp-4', course_id: 'course-2', status: 'completed' as const, progress: 100, enrolled_at: '2026-01-10T00:00:00Z', completed_at: '2026-01-25T00:00:00Z' },
  { id: 'enr-3', org_id: 'org-1', employee_id: 'emp-6', course_id: 'course-3', status: 'in_progress' as const, progress: 40, enrolled_at: '2026-02-01T00:00:00Z', completed_at: null },
  { id: 'enr-4', org_id: 'org-1', employee_id: 'emp-10', course_id: 'course-4', status: 'enrolled' as const, progress: 0, enrolled_at: '2026-02-15T00:00:00Z', completed_at: null },
  { id: 'enr-5', org_id: 'org-1', employee_id: 'emp-3', course_id: 'course-5', status: 'completed' as const, progress: 100, enrolled_at: '2025-10-01T00:00:00Z', completed_at: '2025-12-15T00:00:00Z' },
  { id: 'enr-6', org_id: 'org-1', employee_id: 'emp-14', course_id: 'course-7', status: 'completed' as const, progress: 100, enrolled_at: '2025-08-01T00:00:00Z', completed_at: '2025-10-01T00:00:00Z' },
  { id: 'enr-7', org_id: 'org-1', employee_id: 'emp-1', course_id: 'course-8', status: 'in_progress' as const, progress: 30, enrolled_at: '2026-02-01T00:00:00Z', completed_at: null },
  { id: 'enr-8', org_id: 'org-1', employee_id: 'emp-26', course_id: 'course-2', status: 'completed' as const, progress: 100, enrolled_at: '2026-01-05T00:00:00Z', completed_at: '2026-01-20T00:00:00Z' },
]

// Engagement
export const demoSurveys = [
  { id: 'survey-1', org_id: 'org-1', title: 'Q1 2026 Engagement Pulse', type: 'pulse' as const, status: 'closed' as const, start_date: '2026-01-15', end_date: '2026-01-31', anonymous: true, created_at: '2026-01-10T00:00:00Z' },
  { id: 'survey-2', org_id: 'org-1', title: 'Q1 2026 eNPS', type: 'enps' as const, status: 'active' as const, start_date: '2026-02-01', end_date: '2026-02-28', anonymous: true, created_at: '2026-01-25T00:00:00Z' },
  { id: 'survey-3', org_id: 'org-1', title: '2025 Annual Engagement Survey', type: 'annual' as const, status: 'closed' as const, start_date: '2025-10-01', end_date: '2025-10-31', anonymous: true, created_at: '2025-09-15T00:00:00Z' },
]

export const demoEngagementScores = [
  { id: 'es-1', department_id: 'dept-1', country_id: 'Nigeria', period: '2026-Q1', overall_score: 72, enps_score: 35, response_rate: 85, themes: ['Career Growth', 'Work-Life Balance', 'Leadership'] },
  { id: 'es-2', department_id: 'dept-2', country_id: "Cote d'Ivoire", period: '2026-Q1', overall_score: 78, enps_score: 42, response_rate: 92, themes: ['Compensation', 'Learning', 'Team Culture'] },
  { id: 'es-3', department_id: 'dept-3', country_id: 'Kenya', period: '2026-Q1', overall_score: 68, enps_score: 28, response_rate: 78, themes: ['Workload', 'Tools', 'Management'] },
  { id: 'es-4', department_id: 'dept-4', country_id: 'Ghana', period: '2026-Q1', overall_score: 82, enps_score: 52, response_rate: 95, themes: ['Innovation', 'Autonomy', 'Growth'] },
  { id: 'es-5', department_id: 'dept-5', country_id: 'Senegal', period: '2026-Q1', overall_score: 75, enps_score: 38, response_rate: 88, themes: ['Purpose', 'Collaboration', 'Development'] },
]

// Mentoring
export const demoMentoringPrograms = [
  { id: 'mp-1', org_id: 'org-1', title: 'Emerging Leaders 2026', type: 'one_on_one' as const, status: 'active' as const, duration_months: 6, start_date: '2026-01-15', created_at: '2025-12-01T00:00:00Z' },
  { id: 'mp-2', org_id: 'org-1', title: 'Reverse Mentoring: Digital Skills', type: 'reverse' as const, status: 'active' as const, duration_months: 4, start_date: '2026-02-01', created_at: '2026-01-15T00:00:00Z' },
]

export const demoMentoringPairs = [
  { id: 'pair-1', org_id: 'org-1', program_id: 'mp-1', mentor_id: 'emp-5', mentee_id: 'emp-3', status: 'active' as const, match_score: 92, started_at: '2026-01-20T00:00:00Z' },
  { id: 'pair-2', org_id: 'org-1', program_id: 'mp-1', mentor_id: 'emp-9', mentee_id: 'emp-11', status: 'active' as const, match_score: 88, started_at: '2026-01-20T00:00:00Z' },
  { id: 'pair-3', org_id: 'org-1', program_id: 'mp-1', mentor_id: 'emp-17', mentee_id: 'emp-18', status: 'active' as const, match_score: 85, started_at: '2026-01-20T00:00:00Z' },
  { id: 'pair-4', org_id: 'org-1', program_id: 'mp-2', mentor_id: 'emp-14', mentee_id: 'emp-1', status: 'active' as const, match_score: 78, started_at: '2026-02-05T00:00:00Z' },
  { id: 'pair-5', org_id: 'org-1', program_id: 'mp-2', mentor_id: 'emp-15', mentee_id: 'emp-21', status: 'active' as const, match_score: 82, started_at: '2026-02-05T00:00:00Z' },
]

// Payroll
export const demoPayrollRuns = [
  { id: 'pr-1', org_id: 'org-1', period: 'January 2026', status: 'paid' as const, total_gross: 2450000, total_net: 1890000, total_deductions: 560000, currency: 'USD', employee_count: 30, run_date: '2026-01-28T00:00:00Z', created_at: '2026-01-25T00:00:00Z' },
  { id: 'pr-2', org_id: 'org-1', period: 'February 2026', status: 'approved' as const, total_gross: 2480000, total_net: 1910000, total_deductions: 570000, currency: 'USD', employee_count: 30, run_date: '2026-02-25T00:00:00Z', created_at: '2026-02-22T00:00:00Z' },
]

// Time & Attendance
export const demoLeaveRequests = [
  { id: 'lr-1', org_id: 'org-1', employee_id: 'emp-3', type: 'annual' as const, start_date: '2026-03-10', end_date: '2026-03-14', days: 5, status: 'approved' as const, reason: 'Family vacation', approved_by: 'emp-1', created_at: '2026-02-15T00:00:00Z' },
  { id: 'lr-2', org_id: 'org-1', employee_id: 'emp-10', type: 'sick' as const, start_date: '2026-02-18', end_date: '2026-02-19', days: 2, status: 'approved' as const, reason: 'Feeling unwell', approved_by: 'emp-9', created_at: '2026-02-18T00:00:00Z' },
  { id: 'lr-3', org_id: 'org-1', employee_id: 'emp-16', type: 'personal' as const, start_date: '2026-03-01', end_date: '2026-03-01', days: 1, status: 'pending' as const, reason: 'Personal appointment', approved_by: null, created_at: '2026-02-20T00:00:00Z' },
  { id: 'lr-4', org_id: 'org-1', employee_id: 'emp-22', type: 'annual' as const, start_date: '2026-04-01', end_date: '2026-04-10', days: 8, status: 'pending' as const, reason: 'International travel', approved_by: null, created_at: '2026-02-22T00:00:00Z' },
  { id: 'lr-5', org_id: 'org-1', employee_id: 'emp-7', type: 'maternity' as const, start_date: '2026-05-01', end_date: '2026-08-01', days: 66, status: 'approved' as const, reason: 'Maternity leave', approved_by: 'emp-5', created_at: '2026-02-10T00:00:00Z' },
]

// Benefits
export const demoBenefitPlans = [
  { id: 'bp-1', org_id: 'org-1', name: 'Comprehensive Medical', type: 'medical' as const, provider: 'AXA Mansard', cost_employee: 150, cost_employer: 450, currency: 'USD', description: 'Full medical coverage including hospitalization, outpatient, and dental', is_active: true, created_at: '2025-01-01T00:00:00Z' },
  { id: 'bp-2', org_id: 'org-1', name: 'Vision Care', type: 'vision' as const, provider: 'AXA Mansard', cost_employee: 25, cost_employer: 75, currency: 'USD', description: 'Eye exams, glasses, and contact lenses', is_active: true, created_at: '2025-01-01T00:00:00Z' },
  { id: 'bp-3', org_id: 'org-1', name: 'Retirement Savings', type: 'retirement' as const, provider: 'ARM Pension', cost_employee: 0, cost_employer: 500, currency: 'USD', description: 'Employer-matched retirement contributions up to 10%', is_active: true, created_at: '2025-01-01T00:00:00Z' },
  { id: 'bp-4', org_id: 'org-1', name: 'Life Insurance', type: 'life' as const, provider: 'Leadway Assurance', cost_employee: 0, cost_employer: 200, currency: 'USD', description: '3x annual salary life insurance coverage', is_active: true, created_at: '2025-01-01T00:00:00Z' },
]

// Expense
export const demoExpenseReports = [
  { id: 'exp-1', org_id: 'org-1', employee_id: 'emp-5', title: 'Client Meeting - Abidjan', total_amount: 1250, currency: 'USD', status: 'approved' as const, submitted_at: '2026-02-10T00:00:00Z', approved_by: 'emp-17', created_at: '2026-02-08T00:00:00Z', items: [{ id: 'ei-1', category: 'Travel', description: 'Flight to Abidjan', amount: 450 }, { id: 'ei-2', category: 'Accommodation', description: 'Hotel (2 nights)', amount: 520 }, { id: 'ei-3', category: 'Meals', description: 'Client dinner', amount: 280 }] },
  { id: 'exp-2', org_id: 'org-1', employee_id: 'emp-18', title: 'Recruitment Fair - Lagos', total_amount: 850, currency: 'USD', status: 'submitted' as const, submitted_at: '2026-02-18T00:00:00Z', approved_by: null, created_at: '2026-02-16T00:00:00Z', items: [{ id: 'ei-4', category: 'Events', description: 'Booth rental', amount: 500 }, { id: 'ei-5', category: 'Materials', description: 'Printed materials', amount: 350 }] },
  { id: 'exp-3', org_id: 'org-1', employee_id: 'emp-29', title: 'Marketing Campaign Materials', total_amount: 3200, currency: 'USD', status: 'pending_approval' as const, submitted_at: '2026-02-20T00:00:00Z', approved_by: null, created_at: '2026-02-19T00:00:00Z', items: [] },
  { id: 'exp-4', org_id: 'org-1', employee_id: 'emp-15', title: 'Conference - AfricaTech 2026', total_amount: 2100, currency: 'USD', status: 'reimbursed' as const, submitted_at: '2026-01-20T00:00:00Z', approved_by: 'emp-13', created_at: '2026-01-18T00:00:00Z', items: [] },
]

// Recruiting
export const demoJobPostings = [
  { id: 'job-1', org_id: 'org-1', title: 'Senior Software Engineer', department_id: 'dept-4', location: 'Lagos, Nigeria', type: 'full_time' as const, description: 'Build next-gen banking platform', requirements: '5+ years experience, React, Node.js, PostgreSQL', salary_min: 75000, salary_max: 110000, currency: 'USD', status: 'open' as const, created_at: '2026-01-15T00:00:00Z', application_count: 42 },
  { id: 'job-2', org_id: 'org-1', title: 'Branch Manager', department_id: 'dept-1', location: 'Accra, Ghana', type: 'full_time' as const, description: 'Lead retail banking branch operations', requirements: '7+ years banking experience, team management', salary_min: 55000, salary_max: 85000, currency: 'USD', status: 'open' as const, created_at: '2026-02-01T00:00:00Z', application_count: 28 },
  { id: 'job-3', org_id: 'org-1', title: 'Compliance Analyst', department_id: 'dept-7', location: 'Dakar, Senegal', type: 'full_time' as const, description: 'Support regulatory compliance across UEMOA region', requirements: '3+ years compliance, CAMS certification preferred', salary_min: 45000, salary_max: 65000, currency: 'USD', status: 'open' as const, created_at: '2026-02-10T00:00:00Z', application_count: 15 },
  { id: 'job-4', org_id: 'org-1', title: 'Data Scientist', department_id: 'dept-4', location: 'Nairobi, Kenya', type: 'full_time' as const, description: 'Build ML models for risk assessment and customer insights', requirements: 'MSc in Data Science/Stats, Python, TensorFlow', salary_min: 70000, salary_max: 100000, currency: 'USD', status: 'open' as const, created_at: '2026-02-15T00:00:00Z', application_count: 35 },
  { id: 'job-5', org_id: 'org-1', title: 'Marketing Coordinator', department_id: 'dept-8', location: 'Lagos, Nigeria', type: 'contract' as const, description: 'Support digital marketing campaigns', requirements: '2+ years marketing, social media management', salary_min: 30000, salary_max: 45000, currency: 'USD', status: 'closed' as const, created_at: '2025-12-01T00:00:00Z', application_count: 67 },
]

export const demoApplications = [
  { id: 'app-1', org_id: 'org-1', job_id: 'job-1', candidate_name: 'David Okonkwo', candidate_email: 'david.o@gmail.com', status: 'interview' as const, stage: 'Technical Interview', rating: 4, notes: 'Strong React and system design skills', applied_at: '2026-01-20T00:00:00Z' },
  { id: 'app-2', org_id: 'org-1', job_id: 'job-1', candidate_name: 'Priscilla Addo', candidate_email: 'p.addo@outlook.com', status: 'offer' as const, stage: 'Offer Extended', rating: 5, notes: 'Exceptional candidate. 8 years experience at Flutterwave.', applied_at: '2026-01-18T00:00:00Z' },
  { id: 'app-3', org_id: 'org-1', job_id: 'job-1', candidate_name: 'Samuel Mensah', candidate_email: 's.mensah@yahoo.com', status: 'screening' as const, stage: 'Resume Review', rating: 3, notes: 'Good technical background, needs further screening', applied_at: '2026-02-01T00:00:00Z' },
  { id: 'app-4', org_id: 'org-1', job_id: 'job-2', candidate_name: 'Efua Owusu', candidate_email: 'efua.owusu@gmail.com', status: 'interview' as const, stage: 'Panel Interview', rating: 4, notes: '10 years at Standard Chartered. Strong leadership track record.', applied_at: '2026-02-05T00:00:00Z' },
  { id: 'app-5', org_id: 'org-1', job_id: 'job-4', candidate_name: 'Aisha Ndungu', candidate_email: 'aisha.n@gmail.com', status: 'new' as const, stage: 'Application Received', rating: null, notes: null, applied_at: '2026-02-18T00:00:00Z' },
]

// IT / Devices
export const demoDevices = [
  { id: 'dev-1', org_id: 'org-1', type: 'laptop' as const, brand: 'Apple', model: 'MacBook Pro 14"', serial_number: 'C02X1234JHCD', status: 'assigned' as const, assigned_to: 'emp-13', purchase_date: '2025-06-15', warranty_end: '2028-06-15', created_at: '2025-06-20T00:00:00Z' },
  { id: 'dev-2', org_id: 'org-1', type: 'laptop' as const, brand: 'Dell', model: 'Latitude 5540', serial_number: 'DL5540X789', status: 'assigned' as const, assigned_to: 'emp-14', purchase_date: '2025-03-01', warranty_end: '2028-03-01', created_at: '2025-03-05T00:00:00Z' },
  { id: 'dev-3', org_id: 'org-1', type: 'phone' as const, brand: 'Samsung', model: 'Galaxy S24', serial_number: 'SGS24ABC123', status: 'assigned' as const, assigned_to: 'emp-1', purchase_date: '2025-09-01', warranty_end: '2027-09-01', created_at: '2025-09-05T00:00:00Z' },
  { id: 'dev-4', org_id: 'org-1', type: 'laptop' as const, brand: 'Lenovo', model: 'ThinkPad X1 Carbon', serial_number: 'LNV1234XYZ', status: 'available' as const, assigned_to: null, purchase_date: '2025-11-01', warranty_end: '2028-11-01', created_at: '2025-11-05T00:00:00Z' },
  { id: 'dev-5', org_id: 'org-1', type: 'monitor' as const, brand: 'LG', model: 'UltraWide 34"', serial_number: 'LG34UW567', status: 'assigned' as const, assigned_to: 'emp-16', purchase_date: '2025-07-01', warranty_end: '2028-07-01', created_at: '2025-07-05T00:00:00Z' },
  { id: 'dev-6', org_id: 'org-1', type: 'laptop' as const, brand: 'Apple', model: 'MacBook Air M3', serial_number: 'C02X5678JHCE', status: 'maintenance' as const, assigned_to: null, purchase_date: '2025-04-01', warranty_end: '2028-04-01', created_at: '2025-04-05T00:00:00Z' },
]

export const demoSoftwareLicenses = [
  { id: 'sl-1', org_id: 'org-1', name: 'Microsoft 365 Enterprise', vendor: 'Microsoft', total_licenses: 500, used_licenses: 423, cost_per_license: 35, currency: 'USD', renewal_date: '2026-12-31', created_at: '2025-01-01T00:00:00Z' },
  { id: 'sl-2', org_id: 'org-1', name: 'Slack Business+', vendor: 'Slack', total_licenses: 200, used_licenses: 178, cost_per_license: 12.50, currency: 'USD', renewal_date: '2026-06-30', created_at: '2025-01-01T00:00:00Z' },
  { id: 'sl-3', org_id: 'org-1', name: 'Figma Enterprise', vendor: 'Figma', total_licenses: 20, used_licenses: 15, cost_per_license: 75, currency: 'USD', renewal_date: '2026-09-30', created_at: '2025-03-01T00:00:00Z' },
  { id: 'sl-4', org_id: 'org-1', name: 'GitHub Enterprise', vendor: 'GitHub', total_licenses: 50, used_licenses: 42, cost_per_license: 21, currency: 'USD', renewal_date: '2026-12-31', created_at: '2025-01-01T00:00:00Z' },
]

export const demoITRequests = [
  { id: 'itr-1', org_id: 'org-1', requester_id: 'emp-10', type: 'hardware' as const, title: 'Request new laptop', description: 'Current laptop is 4 years old and performance is degrading', priority: 'medium' as const, status: 'open' as const, assigned_to: null, created_at: '2026-02-18T00:00:00Z' },
  { id: 'itr-2', org_id: 'org-1', requester_id: 'emp-6', type: 'software' as const, title: 'Bloomberg Terminal Access', description: 'Need Bloomberg access for market analysis', priority: 'high' as const, status: 'in_progress' as const, assigned_to: 'emp-15', created_at: '2026-02-15T00:00:00Z' },
  { id: 'itr-3', org_id: 'org-1', requester_id: 'emp-24', type: 'access' as const, title: 'SAP Finance Module Access', description: 'Need access to SAP FI module for reporting', priority: 'medium' as const, status: 'resolved' as const, assigned_to: 'emp-15', created_at: '2026-02-10T00:00:00Z' },
]

// Finance
export const demoInvoices = [
  { id: 'inv-1', org_id: 'org-1', invoice_number: 'INV-2026-001', vendor_id: 'vnd-1', amount: 45000, currency: 'USD', status: 'paid' as const, due_date: '2026-02-15', issued_date: '2026-01-15', description: 'Q1 2026 Software Licenses', created_at: '2026-01-15T00:00:00Z' },
  { id: 'inv-2', org_id: 'org-1', invoice_number: 'INV-2026-002', vendor_id: 'vnd-2', amount: 12500, currency: 'USD', status: 'sent' as const, due_date: '2026-03-01', issued_date: '2026-02-01', description: 'Cloud infrastructure - February', created_at: '2026-02-01T00:00:00Z' },
  { id: 'inv-3', org_id: 'org-1', invoice_number: 'INV-2026-003', vendor_id: 'vnd-3', amount: 8750, currency: 'USD', status: 'overdue' as const, due_date: '2026-02-10', issued_date: '2026-01-10', description: 'Security audit services', created_at: '2026-01-10T00:00:00Z' },
  { id: 'inv-4', org_id: 'org-1', invoice_number: 'INV-2026-004', vendor_id: 'vnd-4', amount: 32000, currency: 'USD', status: 'draft' as const, due_date: '2026-03-15', issued_date: '2026-02-20', description: 'Training program delivery', created_at: '2026-02-20T00:00:00Z' },
]

export const demoBudgets = [
  { id: 'bud-1', org_id: 'org-1', name: 'Technology Department 2026', department_id: 'dept-4', total_amount: 2500000, spent_amount: 680000, currency: 'USD', fiscal_year: '2026', status: 'active' as const, created_at: '2025-12-01T00:00:00Z' },
  { id: 'bud-2', org_id: 'org-1', name: 'HR & People 2026', department_id: 'dept-5', total_amount: 1200000, spent_amount: 320000, currency: 'USD', fiscal_year: '2026', status: 'active' as const, created_at: '2025-12-01T00:00:00Z' },
  { id: 'bud-3', org_id: 'org-1', name: 'Marketing 2026', department_id: 'dept-8', total_amount: 800000, spent_amount: 215000, currency: 'USD', fiscal_year: '2026', status: 'active' as const, created_at: '2025-12-01T00:00:00Z' },
  { id: 'bud-4', org_id: 'org-1', name: 'Operations 2026', department_id: 'dept-3', total_amount: 1800000, spent_amount: 490000, currency: 'USD', fiscal_year: '2026', status: 'active' as const, created_at: '2025-12-01T00:00:00Z' },
]

export const demoVendors = [
  { id: 'vnd-1', org_id: 'org-1', name: 'Microsoft Corporation', contact_email: 'enterprise@microsoft.com', category: 'Software', status: 'active' as const, created_at: '2024-01-01T00:00:00Z' },
  { id: 'vnd-2', org_id: 'org-1', name: 'Amazon Web Services', contact_email: 'support@aws.amazon.com', category: 'Cloud Infrastructure', status: 'active' as const, created_at: '2024-01-01T00:00:00Z' },
  { id: 'vnd-3', org_id: 'org-1', name: 'Deloitte Africa', contact_email: 'africa@deloitte.com', category: 'Consulting', status: 'active' as const, created_at: '2024-06-01T00:00:00Z' },
  { id: 'vnd-4', org_id: 'org-1', name: 'Ecobank Academy', contact_email: 'academy@ecobank.com', category: 'Training', status: 'active' as const, created_at: '2024-01-01T00:00:00Z' },
]

// Demo credentials for role-based login
export type DemoRole = 'owner' | 'admin' | 'hrbp' | 'manager' | 'employee'

export interface DemoCredential {
  email: string
  password: string
  employeeId: string
  role: DemoRole
  label: string
  title: string
  department: string
  description: string
}

export const demoCredentials: DemoCredential[] = [
  { email: 'amara.kone@ecobank.com', password: 'demo1234', employeeId: 'emp-17', role: 'owner', label: 'CHRO (Owner)', title: 'CHRO', department: 'Human Resources', description: 'Full platform access. Sees all modules, AI insights, and executive dashboards.' },
  { email: 'o.adeyemi@ecobank.com', password: 'demo1234', employeeId: 'emp-1', role: 'admin', label: 'Department Head', title: 'Head of Retail Banking', department: 'Retail Banking', description: 'Department admin. Manages team performance, approvals, and recruiting.' },
  { email: 'a.darko@ecobank.com', password: 'demo1234', employeeId: 'emp-20', role: 'hrbp', label: 'HR Business Partner', title: 'HR Business Partner', department: 'Human Resources', description: 'HR operations. Manages people, performance reviews, compensation, and engagement.' },
  { email: 'n.okafor@ecobank.com', password: 'demo1234', employeeId: 'emp-2', role: 'manager', label: 'Manager', title: 'Branch Manager', department: 'Retail Banking', description: 'Team manager. Reviews team goals, approves leave, manages direct reports.' },
  { email: 'k.asante@ecobank.com', password: 'demo1234', employeeId: 'emp-3', role: 'employee', label: 'Employee', title: 'Relationship Manager', department: 'Retail Banking', description: 'Individual contributor. Views own profile, goals, learning, and submits requests.' },
  { email: 'i.agu@ecobank.com', password: 'demo1234', employeeId: 'emp-24', role: 'admin', label: 'CFO', title: 'CFO', department: 'Finance', description: 'Finance executive. Full access to payroll, budgets, invoices, and expense reports.' },
  { email: 'b.ogunleye@ecobank.com', password: 'demo1234', employeeId: 'emp-13', role: 'admin', label: 'CTO', title: 'CTO', department: 'Technology', description: 'Technology executive. Manages IT devices, apps, licenses, and tech team.' },
]

// Dashboard metrics
export const demoDashboardMetrics = {
  headcount: 14247,
  active_employees: 13892,
  new_hires_this_month: 47,
  attrition_rate: 8.2,
  avg_compa_ratio: 1.04,
  review_completion: 78,
  enps_score: 38,
  active_learners: 3842,
  open_positions: 23,
  pending_expenses: 18,
  active_mentoring_pairs: 156,
  total_payroll: 54200000,
}
