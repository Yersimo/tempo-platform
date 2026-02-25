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

// ============================================================
// PHASE 3: PROJECT MANAGEMENT
// ============================================================

export const demoProjects = [
  { id: 'proj-1', org_id: 'org-1', title: 'Core Banking System Upgrade', description: 'Migrate legacy banking infrastructure to cloud-native microservices architecture across all 33 countries.', status: 'active' as const, owner_id: 'emp-13', start_date: '2026-01-15', end_date: '2026-09-30', budget: 2400000, currency: 'USD', created_at: '2026-01-10T08:00:00Z', updated_at: '2026-02-20T10:00:00Z' },
  { id: 'proj-2', org_id: 'org-1', title: 'Pan-Africa Branch Expansion', description: 'Open 12 new branches across West Africa with standardized digital-first design.', status: 'active' as const, owner_id: 'emp-9', start_date: '2026-02-01', end_date: '2026-12-31', budget: 5800000, currency: 'USD', created_at: '2026-01-20T09:00:00Z', updated_at: '2026-02-18T14:00:00Z' },
  { id: 'proj-3', org_id: 'org-1', title: 'Digital Onboarding Platform', description: 'Build mobile-first employee onboarding with e-signature, document upload, and automated provisioning.', status: 'planning' as const, owner_id: 'emp-17', start_date: '2026-04-01', end_date: '2026-08-31', budget: 450000, currency: 'USD', created_at: '2026-02-01T10:00:00Z', updated_at: '2026-02-15T11:00:00Z' },
  { id: 'proj-4', org_id: 'org-1', title: 'Regulatory Compliance Overhaul', description: 'Update compliance frameworks for UEMOA, CESA, AWA, and Nigeria regulatory regions.', status: 'active' as const, owner_id: 'emp-21', start_date: '2026-01-01', end_date: '2026-06-30', budget: 680000, currency: 'USD', created_at: '2025-12-15T08:00:00Z', updated_at: '2026-02-22T09:00:00Z' },
]

export const demoMilestones = [
  { id: 'mile-1', org_id: 'org-1', project_id: 'proj-1', title: 'Architecture Review Complete', due_date: '2026-03-15', status: 'done' as const, created_at: '2026-01-10T08:00:00Z' },
  { id: 'mile-2', org_id: 'org-1', project_id: 'proj-1', title: 'Migration Phase 1 (Nigeria)', due_date: '2026-06-30', status: 'in_progress' as const, created_at: '2026-01-10T08:00:00Z' },
  { id: 'mile-3', org_id: 'org-1', project_id: 'proj-2', title: 'Site Selection for West Africa', due_date: '2026-04-15', status: 'in_progress' as const, created_at: '2026-01-20T09:00:00Z' },
  { id: 'mile-4', org_id: 'org-1', project_id: 'proj-2', title: 'Staffing Plan Finalized', due_date: '2026-05-30', status: 'todo' as const, created_at: '2026-01-20T09:00:00Z' },
  { id: 'mile-5', org_id: 'org-1', project_id: 'proj-3', title: 'Requirements Gathering', due_date: '2026-04-30', status: 'todo' as const, created_at: '2026-02-01T10:00:00Z' },
  { id: 'mile-6', org_id: 'org-1', project_id: 'proj-3', title: 'UI/UX Design Complete', due_date: '2026-06-15', status: 'todo' as const, created_at: '2026-02-01T10:00:00Z' },
  { id: 'mile-7', org_id: 'org-1', project_id: 'proj-4', title: 'UEMOA Gap Analysis', due_date: '2026-02-28', status: 'done' as const, created_at: '2025-12-15T08:00:00Z' },
  { id: 'mile-8', org_id: 'org-1', project_id: 'proj-4', title: 'Policy Documentation', due_date: '2026-04-30', status: 'in_progress' as const, created_at: '2025-12-15T08:00:00Z' },
]

export const demoTasks = [
  { id: 'task-1', org_id: 'org-1', project_id: 'proj-1', milestone_id: 'mile-1', title: 'Document current architecture', description: 'Map all microservices, APIs, and data flows.', status: 'done' as const, priority: 'high' as const, assignee_id: 'emp-13', due_date: '2026-02-15', estimated_hours: 40, actual_hours: 36, created_at: '2026-01-10T08:00:00Z', updated_at: '2026-02-14T16:00:00Z' },
  { id: 'task-2', org_id: 'org-1', project_id: 'proj-1', milestone_id: 'mile-1', title: 'Vendor evaluation for cloud provider', description: 'Compare AWS, Azure, and GCP for African data residency.', status: 'done' as const, priority: 'high' as const, assignee_id: 'emp-14', due_date: '2026-03-01', estimated_hours: 24, actual_hours: 28, created_at: '2026-01-10T08:00:00Z', updated_at: '2026-02-28T17:00:00Z' },
  { id: 'task-3', org_id: 'org-1', project_id: 'proj-1', milestone_id: 'mile-2', title: 'Set up CI/CD pipelines', description: 'Configure deployment pipelines for Nigeria cluster.', status: 'in_progress' as const, priority: 'high' as const, assignee_id: 'emp-14', due_date: '2026-04-15', estimated_hours: 60, actual_hours: 22, created_at: '2026-02-01T08:00:00Z', updated_at: '2026-02-20T10:00:00Z' },
  { id: 'task-4', org_id: 'org-1', project_id: 'proj-1', milestone_id: 'mile-2', title: 'Data migration scripts', description: 'Build ETL scripts for customer data migration.', status: 'todo' as const, priority: 'critical' as const, assignee_id: 'emp-15', due_date: '2026-05-15', estimated_hours: 80, actual_hours: 0, created_at: '2026-02-01T08:00:00Z', updated_at: null },
  { id: 'task-5', org_id: 'org-1', project_id: 'proj-1', milestone_id: 'mile-2', title: 'Security audit', description: 'Penetration testing and vulnerability assessment.', status: 'todo' as const, priority: 'high' as const, assignee_id: 'emp-16', due_date: '2026-06-01', estimated_hours: 40, actual_hours: 0, created_at: '2026-02-01T08:00:00Z', updated_at: null },
  { id: 'task-6', org_id: 'org-1', project_id: 'proj-2', milestone_id: 'mile-3', title: 'Market analysis for Senegal', description: 'Analyze branch performance metrics and demographics.', status: 'done' as const, priority: 'medium' as const, assignee_id: 'emp-9', due_date: '2026-03-15', estimated_hours: 20, actual_hours: 18, created_at: '2026-01-20T09:00:00Z', updated_at: '2026-03-12T15:00:00Z' },
  { id: 'task-7', org_id: 'org-1', project_id: 'proj-2', milestone_id: 'mile-3', title: 'Real estate assessment (Dakar)', description: 'Visit and evaluate potential branch locations in Dakar.', status: 'in_progress' as const, priority: 'medium' as const, assignee_id: 'emp-10', due_date: '2026-04-01', estimated_hours: 30, actual_hours: 12, created_at: '2026-02-01T09:00:00Z', updated_at: '2026-02-18T11:00:00Z' },
  { id: 'task-8', org_id: 'org-1', project_id: 'proj-2', milestone_id: 'mile-3', title: 'Regulatory approval application (Ghana)', description: 'Submit branch license applications to Bank of Ghana.', status: 'review' as const, priority: 'high' as const, assignee_id: 'emp-21', due_date: '2026-03-30', estimated_hours: 16, actual_hours: 14, created_at: '2026-02-01T09:00:00Z', updated_at: '2026-02-20T14:00:00Z' },
  { id: 'task-9', org_id: 'org-1', project_id: 'proj-2', milestone_id: 'mile-4', title: 'Staffing needs assessment', description: 'Determine headcount requirements for each new branch.', status: 'in_progress' as const, priority: 'medium' as const, assignee_id: 'emp-17', due_date: '2026-05-01', estimated_hours: 24, actual_hours: 8, created_at: '2026-02-10T09:00:00Z', updated_at: '2026-02-19T10:00:00Z' },
  { id: 'task-10', org_id: 'org-1', project_id: 'proj-2', milestone_id: 'mile-4', title: 'Recruitment plan for new branches', description: 'Build hiring pipeline for branch managers and staff.', status: 'todo' as const, priority: 'medium' as const, assignee_id: 'emp-20', due_date: '2026-05-15', estimated_hours: 20, actual_hours: 0, created_at: '2026-02-10T09:00:00Z', updated_at: null },
  { id: 'task-11', org_id: 'org-1', project_id: 'proj-3', milestone_id: 'mile-5', title: 'Stakeholder interviews', description: 'Interview HR, IT, and hiring managers on onboarding pain points.', status: 'todo' as const, priority: 'high' as const, assignee_id: 'emp-20', due_date: '2026-04-15', estimated_hours: 16, actual_hours: 0, created_at: '2026-02-01T10:00:00Z', updated_at: null },
  { id: 'task-12', org_id: 'org-1', project_id: 'proj-3', milestone_id: 'mile-5', title: 'Compliance requirements mapping', description: 'Document country-specific onboarding requirements for all 33 countries.', status: 'todo' as const, priority: 'critical' as const, assignee_id: 'emp-21', due_date: '2026-04-20', estimated_hours: 32, actual_hours: 0, created_at: '2026-02-01T10:00:00Z', updated_at: null },
  { id: 'task-13', org_id: 'org-1', project_id: 'proj-3', milestone_id: 'mile-6', title: 'Wireframes and prototypes', description: 'Design mobile-first onboarding flow with e-signature support.', status: 'todo' as const, priority: 'medium' as const, assignee_id: 'emp-15', due_date: '2026-05-30', estimated_hours: 48, actual_hours: 0, created_at: '2026-02-01T10:00:00Z', updated_at: null },
  { id: 'task-14', org_id: 'org-1', project_id: 'proj-4', milestone_id: 'mile-7', title: 'UEMOA regulation review', description: 'Review all BCEAO regulations affecting employment compliance.', status: 'done' as const, priority: 'critical' as const, assignee_id: 'emp-21', due_date: '2026-02-15', estimated_hours: 40, actual_hours: 42, created_at: '2025-12-15T08:00:00Z', updated_at: '2026-02-14T17:00:00Z' },
  { id: 'task-15', org_id: 'org-1', project_id: 'proj-4', milestone_id: 'mile-7', title: 'Gap analysis report', description: 'Identify compliance gaps between current policies and UEMOA requirements.', status: 'done' as const, priority: 'high' as const, assignee_id: 'emp-22', due_date: '2026-02-28', estimated_hours: 30, actual_hours: 28, created_at: '2025-12-15T08:00:00Z', updated_at: '2026-02-27T16:00:00Z' },
  { id: 'task-16', org_id: 'org-1', project_id: 'proj-4', milestone_id: 'mile-8', title: 'Draft updated compliance policies', description: 'Write new policy documents for UEMOA and CESA regions.', status: 'in_progress' as const, priority: 'high' as const, assignee_id: 'emp-21', due_date: '2026-04-01', estimated_hours: 60, actual_hours: 25, created_at: '2026-01-05T08:00:00Z', updated_at: '2026-02-20T11:00:00Z' },
  { id: 'task-17', org_id: 'org-1', project_id: 'proj-4', milestone_id: 'mile-8', title: 'Legal review', description: 'External legal counsel review of new policies.', status: 'todo' as const, priority: 'high' as const, assignee_id: 'emp-22', due_date: '2026-04-15', estimated_hours: 20, actual_hours: 0, created_at: '2026-01-05T08:00:00Z', updated_at: null },
  { id: 'task-18', org_id: 'org-1', project_id: 'proj-1', milestone_id: 'mile-2', title: 'Load testing', description: 'Performance testing for Nigeria cluster under peak load.', status: 'todo' as const, priority: 'medium' as const, assignee_id: 'emp-14', due_date: '2026-06-15', estimated_hours: 24, actual_hours: 0, created_at: '2026-02-01T08:00:00Z', updated_at: null },
  { id: 'task-19', org_id: 'org-1', project_id: 'proj-4', milestone_id: 'mile-8', title: 'Training materials', description: 'Create compliance training for all 33 countries.', status: 'todo' as const, priority: 'medium' as const, assignee_id: 'emp-20', due_date: '2026-04-30', estimated_hours: 30, actual_hours: 0, created_at: '2026-01-05T08:00:00Z', updated_at: null },
  { id: 'task-20', org_id: 'org-1', project_id: 'proj-2', milestone_id: 'mile-3', title: 'Budget approval for Abidjan branch', description: 'Prepare and submit CAPEX request for new Abidjan location.', status: 'review' as const, priority: 'high' as const, assignee_id: 'emp-24', due_date: '2026-04-10', estimated_hours: 8, actual_hours: 6, created_at: '2026-02-15T09:00:00Z', updated_at: '2026-02-22T10:00:00Z' },
]

export const demoTaskDependencies = [
  { id: 'dep-1', task_id: 'task-3', depends_on_task_id: 'task-1' },
  { id: 'dep-2', task_id: 'task-4', depends_on_task_id: 'task-3' },
  { id: 'dep-3', task_id: 'task-5', depends_on_task_id: 'task-3' },
  { id: 'dep-4', task_id: 'task-18', depends_on_task_id: 'task-4' },
  { id: 'dep-5', task_id: 'task-10', depends_on_task_id: 'task-9' },
  { id: 'dep-6', task_id: 'task-17', depends_on_task_id: 'task-16' },
  { id: 'dep-7', task_id: 'task-13', depends_on_task_id: 'task-11' },
]

// ============================================================
// PHASE 3: STRATEGY EXECUTION
// ============================================================

export const demoStrategicObjectives = [
  { id: 'obj-1', org_id: 'org-1', title: 'Achieve 20% Revenue Growth in Retail Banking', description: 'Drive retail banking revenue through account acquisition, cross-selling, and digital product adoption across all 33 countries.', status: 'active' as const, owner_id: 'emp-1', period: 'FY2026', progress: 45, created_at: '2025-12-01T08:00:00Z', updated_at: '2026-02-20T10:00:00Z' },
  { id: 'obj-2', org_id: 'org-1', title: 'Become Employer of Choice in West Africa', description: 'Establish Ecobank as a top-10 employer across key West African markets through talent programs, culture, and employee experience.', status: 'active' as const, owner_id: 'emp-17', period: 'FY2026', progress: 38, created_at: '2025-12-01T08:00:00Z', updated_at: '2026-02-18T14:00:00Z' },
  { id: 'obj-3', org_id: 'org-1', title: 'Digital Transformation: 80% Digital Transactions', description: 'Shift transaction volume from branch-based to digital channels, achieving 80% digital adoption by end of FY2026.', status: 'active' as const, owner_id: 'emp-13', period: 'FY2026', progress: 62, created_at: '2025-12-01T08:00:00Z', updated_at: '2026-02-22T09:00:00Z' },
]

export const demoKeyResults = [
  { id: 'kr-1', org_id: 'org-1', objective_id: 'obj-1', title: '15% increase in new retail accounts', target_value: 15, current_value: 8.3, unit: '%', owner_id: 'emp-1', due_date: '2026-12-31', created_at: '2025-12-01T08:00:00Z', updated_at: '2026-02-20T10:00:00Z' },
  { id: 'kr-2', org_id: 'org-1', objective_id: 'obj-1', title: 'Achieve 95% client satisfaction (NPS)', target_value: 95, current_value: 82, unit: 'NPS', owner_id: 'emp-2', due_date: '2026-12-31', created_at: '2025-12-01T08:00:00Z', updated_at: '2026-02-15T11:00:00Z' },
  { id: 'kr-3', org_id: 'org-1', objective_id: 'obj-1', title: 'Attract $200M in new deposits', target_value: 200, current_value: 78, unit: 'M USD', owner_id: 'emp-24', due_date: '2026-12-31', created_at: '2025-12-01T08:00:00Z', updated_at: '2026-02-18T09:00:00Z' },
  { id: 'kr-4', org_id: 'org-1', objective_id: 'obj-2', title: 'Top 10 in Great Place to Work Africa', target_value: 10, current_value: 18, unit: 'Rank', owner_id: 'emp-17', due_date: '2026-12-31', created_at: '2025-12-01T08:00:00Z', updated_at: '2026-02-20T14:00:00Z' },
  { id: 'kr-5', org_id: 'org-1', objective_id: 'obj-2', title: 'Reduce voluntary attrition to 5%', target_value: 5, current_value: 8.2, unit: '%', owner_id: 'emp-20', due_date: '2026-12-31', created_at: '2025-12-01T08:00:00Z', updated_at: '2026-02-19T16:00:00Z' },
  { id: 'kr-6', org_id: 'org-1', objective_id: 'obj-2', title: '90% mandatory training completion', target_value: 90, current_value: 67, unit: '%', owner_id: 'emp-20', due_date: '2026-12-31', created_at: '2025-12-01T08:00:00Z', updated_at: '2026-02-22T10:00:00Z' },
  { id: 'kr-7', org_id: 'org-1', objective_id: 'obj-3', title: 'Launch mobile banking v3.0', target_value: 1, current_value: 0.7, unit: 'release', owner_id: 'emp-13', due_date: '2026-06-30', created_at: '2025-12-01T08:00:00Z', updated_at: '2026-02-20T09:00:00Z' },
  { id: 'kr-8', org_id: 'org-1', objective_id: 'obj-3', title: '60% digital transaction adoption', target_value: 60, current_value: 48, unit: '%', owner_id: 'emp-14', due_date: '2026-12-31', created_at: '2025-12-01T08:00:00Z', updated_at: '2026-02-21T11:00:00Z' },
  { id: 'kr-9', org_id: 'org-1', objective_id: 'obj-3', title: '99.9% platform uptime', target_value: 99.9, current_value: 99.7, unit: '%', owner_id: 'emp-14', due_date: '2026-12-31', created_at: '2025-12-01T08:00:00Z', updated_at: '2026-02-22T08:00:00Z' },
]

export const demoInitiatives = [
  { id: 'init-1', org_id: 'org-1', objective_id: 'obj-1', title: 'Client Referral Program', description: 'Launch refer-a-friend program with rewards for existing customers who bring new accounts.', status: 'in_progress' as const, owner_id: 'emp-2', start_date: '2026-01-15', end_date: '2026-06-30', progress: 55, budget: 120000, currency: 'USD', created_at: '2025-12-15T08:00:00Z', updated_at: '2026-02-20T10:00:00Z' },
  { id: 'init-2', org_id: 'org-1', objective_id: 'obj-2', title: 'Leadership Academy', description: 'Build internal leadership development program for high-potential employees across all regions.', status: 'approved' as const, owner_id: 'emp-17', start_date: '2026-03-01', end_date: '2026-12-31', progress: 15, budget: 350000, currency: 'USD', created_at: '2026-01-10T08:00:00Z', updated_at: '2026-02-18T14:00:00Z' },
  { id: 'init-3', org_id: 'org-1', objective_id: 'obj-3', title: 'Branch Digital Kiosks', description: 'Deploy self-service digital kiosks in all branches to shift walk-in transactions to digital.', status: 'in_progress' as const, owner_id: 'emp-13', start_date: '2026-01-01', end_date: '2026-09-30', progress: 35, budget: 890000, currency: 'USD', created_at: '2025-12-01T08:00:00Z', updated_at: '2026-02-22T09:00:00Z' },
  { id: 'init-4', org_id: 'org-1', objective_id: 'obj-1', title: 'SME Banking Package', description: 'Design and launch a tailored banking package for small and medium enterprises.', status: 'proposed' as const, owner_id: 'emp-1', start_date: '2026-04-01', end_date: '2026-10-31', progress: 0, budget: 200000, currency: 'USD', created_at: '2026-02-01T08:00:00Z', updated_at: '2026-02-15T11:00:00Z' },
  { id: 'init-5', org_id: 'org-1', objective_id: 'obj-2', title: 'Employee Wellness Program', description: 'Launch comprehensive wellness program covering mental health, fitness, and financial wellness.', status: 'in_progress' as const, owner_id: 'emp-20', start_date: '2026-02-01', end_date: '2026-12-31', progress: 25, budget: 180000, currency: 'USD', created_at: '2026-01-20T08:00:00Z', updated_at: '2026-02-20T15:00:00Z' },
  { id: 'init-6', org_id: 'org-1', objective_id: 'obj-3', title: 'API Banking Platform', description: 'Build open banking API platform for fintech partnerships and third-party integrations.', status: 'approved' as const, owner_id: 'emp-14', start_date: '2026-03-15', end_date: '2026-11-30', progress: 10, budget: 520000, currency: 'USD', created_at: '2026-02-05T08:00:00Z', updated_at: '2026-02-19T10:00:00Z' },
]

export const demoKPIDefinitions = [
  { id: 'kpi-1', org_id: 'org-1', name: 'Monthly Active Users (Mobile)', description: 'Number of unique users accessing the mobile banking app per month.', unit: 'users', target_value: 2500000, frequency: 'monthly' as const, department_id: 'dept-tech', owner_id: 'emp-13', created_at: '2025-12-01T08:00:00Z' },
  { id: 'kpi-2', org_id: 'org-1', name: 'Employee Engagement Score', description: 'Quarterly pulse survey engagement score.', unit: 'score', target_value: 82, frequency: 'quarterly' as const, department_id: null, owner_id: 'emp-17', created_at: '2025-12-01T08:00:00Z' },
  { id: 'kpi-3', org_id: 'org-1', name: 'Net Promoter Score', description: 'Customer NPS across all channels.', unit: 'NPS', target_value: 55, frequency: 'monthly' as const, department_id: 'dept-retail', owner_id: 'emp-1', created_at: '2025-12-01T08:00:00Z' },
  { id: 'kpi-4', org_id: 'org-1', name: 'Revenue per Employee', description: 'Total revenue divided by headcount.', unit: 'USD', target_value: 48000, frequency: 'quarterly' as const, department_id: null, owner_id: 'emp-24', created_at: '2025-12-01T08:00:00Z' },
  { id: 'kpi-5', org_id: 'org-1', name: 'Time to Hire', description: 'Average days from job posting to offer acceptance.', unit: 'days', target_value: 35, frequency: 'monthly' as const, department_id: null, owner_id: 'emp-20', created_at: '2025-12-01T08:00:00Z' },
  { id: 'kpi-6', org_id: 'org-1', name: 'Digital Transaction Rate', description: 'Percentage of total transactions completed via digital channels.', unit: '%', target_value: 80, frequency: 'monthly' as const, department_id: 'dept-tech', owner_id: 'emp-13', created_at: '2025-12-01T08:00:00Z' },
  { id: 'kpi-7', org_id: 'org-1', name: 'Loan Default Rate', description: 'Percentage of loans in default status.', unit: '%', target_value: 2.5, frequency: 'monthly' as const, department_id: 'dept-risk', owner_id: 'emp-21', created_at: '2025-12-01T08:00:00Z' },
  { id: 'kpi-8', org_id: 'org-1', name: 'Training Completion Rate', description: 'Percentage of mandatory training completed on time.', unit: '%', target_value: 90, frequency: 'monthly' as const, department_id: null, owner_id: 'emp-17', created_at: '2025-12-01T08:00:00Z' },
]

export const demoKPIMeasurements = [
  { id: 'kpim-1', kpi_id: 'kpi-1', value: 1850000, period: '2025-12', recorded_at: '2026-01-05T08:00:00Z', notes: null },
  { id: 'kpim-2', kpi_id: 'kpi-1', value: 1920000, period: '2026-01', recorded_at: '2026-02-05T08:00:00Z', notes: 'Strong growth after mobile v2.8 launch' },
  { id: 'kpim-3', kpi_id: 'kpi-1', value: 2010000, period: '2026-02', recorded_at: '2026-02-23T08:00:00Z', notes: null },
  { id: 'kpim-4', kpi_id: 'kpi-2', value: 74, period: 'Q4-2025', recorded_at: '2026-01-10T08:00:00Z', notes: null },
  { id: 'kpim-5', kpi_id: 'kpi-3', value: 42, period: '2025-12', recorded_at: '2026-01-05T08:00:00Z', notes: null },
  { id: 'kpim-6', kpi_id: 'kpi-3', value: 45, period: '2026-01', recorded_at: '2026-02-05T08:00:00Z', notes: 'Improvement after service training rollout' },
  { id: 'kpim-7', kpi_id: 'kpi-4', value: 42500, period: 'Q4-2025', recorded_at: '2026-01-15T08:00:00Z', notes: null },
  { id: 'kpim-8', kpi_id: 'kpi-5', value: 48, period: '2025-12', recorded_at: '2026-01-05T08:00:00Z', notes: null },
  { id: 'kpim-9', kpi_id: 'kpi-5', value: 44, period: '2026-01', recorded_at: '2026-02-05T08:00:00Z', notes: 'Slight improvement with new ATS' },
  { id: 'kpim-10', kpi_id: 'kpi-6', value: 44, period: '2025-12', recorded_at: '2026-01-05T08:00:00Z', notes: null },
  { id: 'kpim-11', kpi_id: 'kpi-6', value: 46, period: '2026-01', recorded_at: '2026-02-05T08:00:00Z', notes: null },
  { id: 'kpim-12', kpi_id: 'kpi-6', value: 48, period: '2026-02', recorded_at: '2026-02-23T08:00:00Z', notes: 'Kiosk rollout in Lagos contributing' },
]

// ============================================================
// PHASE 3: WORKFLOW STUDIO
// ============================================================

export const demoWorkflows = [
  { id: 'wf-1', org_id: 'org-1', title: 'New Hire Onboarding', description: 'Automated onboarding workflow: IT provisioning, training enrollment, manager introduction, 30-day check-in.', status: 'active' as const, trigger_type: 'event' as const, trigger_config: { event: 'employee.created' }, created_by: 'emp-17', created_at: '2025-11-01T08:00:00Z', updated_at: '2026-02-10T10:00:00Z' },
  { id: 'wf-2', org_id: 'org-1', title: 'Leave Approval Process', description: 'Route leave requests through manager approval with auto-escalation after 48 hours.', status: 'active' as const, trigger_type: 'event' as const, trigger_config: { event: 'leave_request.created' }, created_by: 'emp-20', created_at: '2025-11-15T08:00:00Z', updated_at: '2026-01-20T14:00:00Z' },
  { id: 'wf-3', org_id: 'org-1', title: 'Expense Report Routing', description: 'Auto-route expense reports based on amount: <$500 manager, <$5000 department head, >$5000 CFO.', status: 'active' as const, trigger_type: 'event' as const, trigger_config: { event: 'expense_report.submitted' }, created_by: 'emp-24', created_at: '2025-12-01T08:00:00Z', updated_at: '2026-02-05T09:00:00Z' },
  { id: 'wf-4', org_id: 'org-1', title: 'Performance Review Reminder', description: 'Send reminders to managers 14, 7, and 1 day before review deadline.', status: 'draft' as const, trigger_type: 'schedule' as const, trigger_config: { cron: '0 9 * * 1' }, created_by: 'emp-17', created_at: '2026-02-01T08:00:00Z', updated_at: '2026-02-15T11:00:00Z' },
]

export const demoWorkflowSteps = [
  // Onboarding workflow
  { id: 'wfs-1', workflow_id: 'wf-1', step_type: 'action' as const, title: 'Create IT accounts', config: { action: 'create_accounts', systems: ['email', 'ad', 'slack'] }, position: 0, next_step_id: 'wfs-2', created_at: '2025-11-01T08:00:00Z' },
  { id: 'wfs-2', workflow_id: 'wf-1', step_type: 'notification' as const, title: 'Send welcome email', config: { template: 'welcome_new_hire', to: 'employee' }, position: 1, next_step_id: 'wfs-3', created_at: '2025-11-01T08:00:00Z' },
  { id: 'wfs-3', workflow_id: 'wf-1', step_type: 'action' as const, title: 'Enroll in mandatory training', config: { courses: ['compliance', 'security', 'culture'] }, position: 2, next_step_id: 'wfs-4', created_at: '2025-11-01T08:00:00Z' },
  { id: 'wfs-4', workflow_id: 'wf-1', step_type: 'delay' as const, title: 'Wait 30 days', config: { duration: 30, unit: 'days' }, position: 3, next_step_id: 'wfs-5', created_at: '2025-11-01T08:00:00Z' },
  { id: 'wfs-5', workflow_id: 'wf-1', step_type: 'notification' as const, title: 'Send 30-day check-in survey', config: { template: '30_day_checkin', to: 'employee' }, position: 4, next_step_id: null, created_at: '2025-11-01T08:00:00Z' },
  // Leave approval workflow
  { id: 'wfs-6', workflow_id: 'wf-2', step_type: 'notification' as const, title: 'Notify manager', config: { template: 'leave_request', to: 'manager' }, position: 0, next_step_id: 'wfs-7', created_at: '2025-11-15T08:00:00Z' },
  { id: 'wfs-7', workflow_id: 'wf-2', step_type: 'approval' as const, title: 'Manager approval', config: { approver: 'direct_manager', timeout_hours: 48 }, position: 1, next_step_id: 'wfs-8', created_at: '2025-11-15T08:00:00Z' },
  { id: 'wfs-8', workflow_id: 'wf-2', step_type: 'condition' as const, title: 'Check if approved', config: { field: 'approval_status', operator: 'equals', value: 'approved' }, position: 2, next_step_id: 'wfs-9', created_at: '2025-11-15T08:00:00Z' },
  { id: 'wfs-9', workflow_id: 'wf-2', step_type: 'notification' as const, title: 'Notify employee of decision', config: { template: 'leave_decision', to: 'employee' }, position: 3, next_step_id: null, created_at: '2025-11-15T08:00:00Z' },
  // Expense routing workflow
  { id: 'wfs-10', workflow_id: 'wf-3', step_type: 'condition' as const, title: 'Check amount threshold', config: { field: 'total_amount', operator: 'less_than', value: 500 }, position: 0, next_step_id: 'wfs-11', created_at: '2025-12-01T08:00:00Z' },
  { id: 'wfs-11', workflow_id: 'wf-3', step_type: 'approval' as const, title: 'Route to approver', config: { approver: 'amount_based', thresholds: { 500: 'manager', 5000: 'department_head', default: 'cfo' } }, position: 1, next_step_id: 'wfs-12', created_at: '2025-12-01T08:00:00Z' },
  { id: 'wfs-12', workflow_id: 'wf-3', step_type: 'notification' as const, title: 'Send approval notification', config: { template: 'expense_approved', to: 'employee' }, position: 2, next_step_id: null, created_at: '2025-12-01T08:00:00Z' },
  // Review reminder workflow
  { id: 'wfs-13', workflow_id: 'wf-4', step_type: 'notification' as const, title: 'Send 14-day reminder', config: { template: 'review_reminder', days_before: 14 }, position: 0, next_step_id: 'wfs-14', created_at: '2026-02-01T08:00:00Z' },
  { id: 'wfs-14', workflow_id: 'wf-4', step_type: 'delay' as const, title: 'Wait 7 days', config: { duration: 7, unit: 'days' }, position: 1, next_step_id: 'wfs-15', created_at: '2026-02-01T08:00:00Z' },
  { id: 'wfs-15', workflow_id: 'wf-4', step_type: 'notification' as const, title: 'Send 7-day reminder', config: { template: 'review_reminder_urgent', days_before: 7 }, position: 2, next_step_id: null, created_at: '2026-02-01T08:00:00Z' },
]

export const demoWorkflowRuns = [
  { id: 'wfr-1', org_id: 'org-1', workflow_id: 'wf-1', status: 'completed' as const, started_at: '2026-02-10T09:00:00Z', completed_at: '2026-02-10T09:05:00Z', triggered_by: 'system', context: { employee_id: 'emp-30', employee_name: 'Chidinma Eze' } },
  { id: 'wfr-2', org_id: 'org-1', workflow_id: 'wf-1', status: 'completed' as const, started_at: '2026-02-15T10:00:00Z', completed_at: '2026-02-15T10:03:00Z', triggered_by: 'system', context: { employee_id: 'emp-29', employee_name: 'Boubacar Diallo' } },
  { id: 'wfr-3', org_id: 'org-1', workflow_id: 'wf-2', status: 'completed' as const, started_at: '2026-02-12T14:00:00Z', completed_at: '2026-02-13T09:30:00Z', triggered_by: 'system', context: { leave_id: 'leave-101', employee_name: 'Kwame Asante' } },
  { id: 'wfr-4', org_id: 'org-1', workflow_id: 'wf-2', status: 'running' as const, started_at: '2026-02-22T11:00:00Z', completed_at: null, triggered_by: 'system', context: { leave_id: 'leave-102', employee_name: 'Fatou Diop' } },
  { id: 'wfr-5', org_id: 'org-1', workflow_id: 'wf-3', status: 'completed' as const, started_at: '2026-02-08T16:00:00Z', completed_at: '2026-02-09T10:00:00Z', triggered_by: 'system', context: { report_id: 'exp-201', employee_name: 'Oluwaseun Adeyemi' } },
  { id: 'wfr-6', org_id: 'org-1', workflow_id: 'wf-3', status: 'completed' as const, started_at: '2026-02-14T09:00:00Z', completed_at: '2026-02-15T14:00:00Z', triggered_by: 'system', context: { report_id: 'exp-202', employee_name: 'Amara Kone' } },
  { id: 'wfr-7', org_id: 'org-1', workflow_id: 'wf-3', status: 'failed' as const, started_at: '2026-02-18T11:00:00Z', completed_at: '2026-02-18T11:02:00Z', triggered_by: 'system', context: { report_id: 'exp-203', error: 'Approver not found for department' } },
  { id: 'wfr-8', org_id: 'org-1', workflow_id: 'wf-1', status: 'running' as const, started_at: '2026-02-23T08:00:00Z', completed_at: null, triggered_by: 'system', context: { employee_id: 'emp-31', employee_name: 'Adama Traore' } },
  { id: 'wfr-9', org_id: 'org-1', workflow_id: 'wf-2', status: 'completed' as const, started_at: '2026-02-19T09:00:00Z', completed_at: '2026-02-19T16:00:00Z', triggered_by: 'system', context: { leave_id: 'leave-103', employee_name: 'Ngozi Okafor' } },
  { id: 'wfr-10', org_id: 'org-1', workflow_id: 'wf-3', status: 'cancelled' as const, started_at: '2026-02-20T15:00:00Z', completed_at: '2026-02-20T15:01:00Z', triggered_by: 'system', context: { report_id: 'exp-204', reason: 'Report withdrawn by employee' } },
]

export const demoWorkflowTemplates = [
  { id: 'wft-1', org_id: 'org-1', title: 'Standard Onboarding', description: 'Complete new hire onboarding with IT setup, training, and check-ins.', category: 'hr', config: { steps: ['create_accounts', 'welcome_email', 'training', 'check_in'] }, created_at: '2025-10-01T08:00:00Z' },
  { id: 'wft-2', org_id: 'org-1', title: 'Approval Chain', description: 'Multi-level approval workflow with escalation and notifications.', category: 'operations', config: { steps: ['request', 'approval_l1', 'approval_l2', 'notification'] }, created_at: '2025-10-01T08:00:00Z' },
  { id: 'wft-3', org_id: 'org-1', title: 'Notification Sequence', description: 'Send scheduled notifications with delays between each.', category: 'communications', config: { steps: ['notify_1', 'delay', 'notify_2', 'delay', 'notify_3'] }, created_at: '2025-10-01T08:00:00Z' },
]

// ============================================================
// NOTIFICATIONS (in-app demo data)
// ============================================================

export const demoNotifications = [
  { id: 'notif-1', org_id: 'org-1', recipient_id: 'emp-17', sender_id: 'emp-6', type: 'action_required' as const, channel: 'in_app' as const, title: 'Leave Request Pending', message: 'Fatou Ndiaye has submitted a leave request that requires your approval.', link: '/time-attendance', entity_type: 'leave_request', is_read: false, created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString() },
  { id: 'notif-2', org_id: 'org-1', recipient_id: 'emp-17', sender_id: null, type: 'reminder' as const, channel: 'in_app' as const, title: 'Performance Review Cycle Ending', message: 'The Q1 2026 review cycle closes in 3 days. 2 reviews are still pending.', link: '/performance', entity_type: 'review_cycle', is_read: false, created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() },
  { id: 'notif-3', org_id: 'org-1', recipient_id: 'emp-17', sender_id: 'emp-9', type: 'approval' as const, channel: 'in_app' as const, title: 'Expense Report Submitted', message: 'Kofi Mensah submitted an expense report for $2,450.00.', link: '/expense', entity_type: 'expense_report', is_read: false, created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString() },
  { id: 'notif-4', org_id: 'org-1', recipient_id: 'emp-17', sender_id: null, type: 'success' as const, channel: 'in_app' as const, title: 'Workflow Completed', message: 'New Hire Onboarding workflow for Ngozi Okafor completed successfully.', link: '/workflow-studio', entity_type: 'workflow', is_read: true, created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() },
  { id: 'notif-5', org_id: 'org-1', recipient_id: 'emp-17', sender_id: null, type: 'info' as const, channel: 'in_app' as const, title: 'New Mentoring Match', message: 'You have been matched with Abena Boateng as their mentor.', link: '/mentoring', entity_type: 'mentoring_pair', is_read: true, created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString() },
  { id: 'notif-6', org_id: 'org-1', recipient_id: 'emp-17', sender_id: null, type: 'warning' as const, channel: 'in_app' as const, title: '2 Salary Proposals Pending', message: 'There are 2 compensation proposals awaiting your approval before the March deadline.', link: '/compensation', entity_type: 'salary_review', is_read: false, created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString() },
  { id: 'notif-7', org_id: 'org-1', recipient_id: 'emp-17', sender_id: 'emp-13', type: 'mention' as const, channel: 'in_app' as const, title: 'Mentioned in Project Update', message: 'Babajide Ogunleye mentioned you in a comment on Core Banking System Upgrade.', link: '/projects', entity_type: 'project', is_read: false, created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString() },
]

// ============================================================
// KASH & CO - DEMO DATA (org-2)
// ============================================================

export const kashOrg = {
  id: 'org-2',
  name: 'Kash & Co',
  slug: 'kash-co',
  logo_url: null,
  plan: 'professional' as const,
  industry: 'Consulting & Professional Services',
  size: '50-200',
  country: 'South Africa',
  created_at: '2024-06-01T00:00:00Z',
}

export const kashUser = {
  id: 'user-2',
  email: 's.ndlovu@kashco.com',
  full_name: 'Sipho Ndlovu',
  avatar_url: null,
  role: 'owner' as const,
  department_id: 'kdept-1',
}

export const kashDepartments = [
  { id: 'kdept-1', org_id: 'org-2', name: 'Consulting', parent_id: null, head_id: 'kemp-1' },
  { id: 'kdept-2', org_id: 'org-2', name: 'Strategy', parent_id: null, head_id: 'kemp-6' },
  { id: 'kdept-3', org_id: 'org-2', name: 'Technology Advisory', parent_id: null, head_id: 'kemp-9' },
  { id: 'kdept-4', org_id: 'org-2', name: 'People & Culture', parent_id: null, head_id: 'kemp-12' },
  { id: 'kdept-5', org_id: 'org-2', name: 'Finance & Operations', parent_id: null, head_id: 'kemp-15' },
  { id: 'kdept-6', org_id: 'org-2', name: 'Business Development', parent_id: null, head_id: 'kemp-18' },
]

export const kashEmployees = [
  // Consulting
  { id: 'kemp-1', org_id: 'org-2', department_id: 'kdept-1', job_title: 'Managing Director', level: 'Executive', country: 'South Africa', role: 'owner' as const, profile: { full_name: 'Sipho Ndlovu', email: 's.ndlovu@kashco.com', avatar_url: null, phone: '+27 11 234 5678' } },
  { id: 'kemp-2', org_id: 'org-2', department_id: 'kdept-1', job_title: 'Partner', level: 'Director', country: 'South Africa', role: 'admin' as const, profile: { full_name: 'Naledi Mabaso', email: 'n.mabaso@kashco.com', avatar_url: null, phone: '+27 11 234 5679' } },
  { id: 'kemp-3', org_id: 'org-2', department_id: 'kdept-1', job_title: 'Engagement Manager', level: 'Senior Manager', country: 'Rwanda', role: 'manager' as const, profile: { full_name: 'Thierry Mugabo', email: 't.mugabo@kashco.com', avatar_url: null, phone: '+250 788 123 456' } },
  { id: 'kemp-4', org_id: 'org-2', department_id: 'kdept-1', job_title: 'Senior Consultant', level: 'Senior', country: 'South Africa', role: 'employee' as const, profile: { full_name: 'Nadia Joubert', email: 'n.joubert@kashco.com', avatar_url: null, phone: '+27 11 234 5680' } },
  { id: 'kemp-5', org_id: 'org-2', department_id: 'kdept-1', job_title: 'Consultant', level: 'Mid', country: 'Rwanda', role: 'employee' as const, profile: { full_name: 'Amina Rwigema', email: 'a.rwigema@kashco.com', avatar_url: null, phone: '+250 788 234 567' } },
  // Strategy
  { id: 'kemp-6', org_id: 'org-2', department_id: 'kdept-2', job_title: 'Head of Strategy', level: 'Director', country: 'Morocco', role: 'admin' as const, profile: { full_name: 'Layla Amari', email: 'l.amari@kashco.com', avatar_url: null, phone: '+212 522 123 456' } },
  { id: 'kemp-7', org_id: 'org-2', department_id: 'kdept-2', job_title: 'Strategy Manager', level: 'Senior Manager', country: 'South Africa', role: 'manager' as const, profile: { full_name: 'Pieter van der Merwe', email: 'p.vandermerwe@kashco.com', avatar_url: null, phone: '+27 11 234 5681' } },
  { id: 'kemp-8', org_id: 'org-2', department_id: 'kdept-2', job_title: 'Strategy Analyst', level: 'Mid', country: 'Morocco', role: 'employee' as const, profile: { full_name: 'Youssef Benali', email: 'y.benali@kashco.com', avatar_url: null, phone: '+212 522 234 567' } },
  // Technology Advisory
  { id: 'kemp-9', org_id: 'org-2', department_id: 'kdept-3', job_title: 'Technology Advisory Lead', level: 'Director', country: 'South Africa', role: 'admin' as const, profile: { full_name: 'Kagiso Molefe', email: 'k.molefe@kashco.com', avatar_url: null, phone: '+27 11 234 5682' } },
  { id: 'kemp-10', org_id: 'org-2', department_id: 'kdept-3', job_title: 'Senior Tech Consultant', level: 'Senior', country: 'Rwanda', role: 'employee' as const, profile: { full_name: 'Jean-Pierre Habimana', email: 'jp.habimana@kashco.com', avatar_url: null, phone: '+250 788 345 678' } },
  { id: 'kemp-11', org_id: 'org-2', department_id: 'kdept-3', job_title: 'Tech Consultant', level: 'Mid', country: 'Morocco', role: 'employee' as const, profile: { full_name: 'Fatima-Zahra El Idrissi', email: 'fz.elidrissi@kashco.com', avatar_url: null, phone: '+212 522 345 678' } },
  // People & Culture
  { id: 'kemp-12', org_id: 'org-2', department_id: 'kdept-4', job_title: 'Chief People Officer', level: 'Executive', country: 'South Africa', role: 'admin' as const, profile: { full_name: 'Zanele Moyo', email: 'z.moyo@kashco.com', avatar_url: null, phone: '+27 11 234 5683' } },
  { id: 'kemp-13', org_id: 'org-2', department_id: 'kdept-4', job_title: 'HR Manager', level: 'Manager', country: 'Rwanda', role: 'manager' as const, profile: { full_name: 'Grace Uwimana', email: 'g.uwimana@kashco.com', avatar_url: null, phone: '+250 788 456 789' } },
  { id: 'kemp-14', org_id: 'org-2', department_id: 'kdept-4', job_title: 'People Coordinator', level: 'Junior', country: 'South Africa', role: 'employee' as const, profile: { full_name: 'Lerato Dlamini', email: 'l.dlamini@kashco.com', avatar_url: null, phone: '+27 11 234 5684' } },
  // Finance & Operations
  { id: 'kemp-15', org_id: 'org-2', department_id: 'kdept-5', job_title: 'CFO', level: 'Executive', country: 'Morocco', role: 'admin' as const, profile: { full_name: 'Omar Benhaddou', email: 'o.benhaddou@kashco.com', avatar_url: null, phone: '+212 522 456 789' } },
  { id: 'kemp-16', org_id: 'org-2', department_id: 'kdept-5', job_title: 'Finance Manager', level: 'Senior Manager', country: 'South Africa', role: 'manager' as const, profile: { full_name: 'Thabo Maseko', email: 't.maseko@kashco.com', avatar_url: null, phone: '+27 11 234 5685' } },
  { id: 'kemp-17', org_id: 'org-2', department_id: 'kdept-5', job_title: 'Office Manager', level: 'Mid', country: 'Rwanda', role: 'employee' as const, profile: { full_name: 'Diane Mukamana', email: 'd.mukamana@kashco.com', avatar_url: null, phone: '+250 788 567 890' } },
  // Business Development
  { id: 'kemp-18', org_id: 'org-2', department_id: 'kdept-6', job_title: 'BD Director', level: 'Director', country: 'South Africa', role: 'admin' as const, profile: { full_name: 'Anele Zulu', email: 'a.zulu@kashco.com', avatar_url: null, phone: '+27 11 234 5686' } },
  { id: 'kemp-19', org_id: 'org-2', department_id: 'kdept-6', job_title: 'BD Manager', level: 'Senior Manager', country: 'Morocco', role: 'manager' as const, profile: { full_name: 'Hassan Tazi', email: 'h.tazi@kashco.com', avatar_url: null, phone: '+212 522 567 890' } },
  { id: 'kemp-20', org_id: 'org-2', department_id: 'kdept-6', job_title: 'BD Associate', level: 'Junior', country: 'South Africa', role: 'employee' as const, profile: { full_name: 'Kwame Osei', email: 'k.osei@kashco.com', avatar_url: null, phone: '+27 11 234 5687' } },
]

export const kashGoals = [
  { id: 'kgoal-1', org_id: 'org-2', employee_id: 'kemp-3', title: 'Deliver MTN digital transformation engagement', description: 'Complete Phase 2 of MTN digital strategy project on time and within budget', category: 'project' as const, status: 'on_track' as const, progress: 65, start_date: '2026-01-01', due_date: '2026-06-30', created_at: '2026-01-05T00:00:00Z' },
  { id: 'kgoal-2', org_id: 'org-2', employee_id: 'kemp-6', title: 'Win 3 new strategy advisory mandates', description: 'Expand strategy practice revenue by securing new client engagements', category: 'business' as const, status: 'on_track' as const, progress: 33, start_date: '2026-01-01', due_date: '2026-06-30', created_at: '2026-01-10T00:00:00Z' },
  { id: 'kgoal-3', org_id: 'org-2', employee_id: 'kemp-9', title: 'Build AI/ML advisory capability', description: 'Develop service offering and train team on AI strategy consulting', category: 'development' as const, status: 'at_risk' as const, progress: 25, start_date: '2026-01-15', due_date: '2026-04-30', created_at: '2026-01-12T00:00:00Z' },
  { id: 'kgoal-4', org_id: 'org-2', employee_id: 'kemp-12', title: 'Achieve 90% employee engagement score', description: 'Drive engagement through culture initiatives and professional development', category: 'business' as const, status: 'on_track' as const, progress: 72, start_date: '2026-01-01', due_date: '2026-12-31', created_at: '2026-01-05T00:00:00Z' },
  { id: 'kgoal-5', org_id: 'org-2', employee_id: 'kemp-18', title: 'Generate $2M in new business pipeline', description: 'Build qualified pipeline across all three offices', category: 'business' as const, status: 'on_track' as const, progress: 55, start_date: '2026-01-01', due_date: '2026-06-30', created_at: '2026-01-05T00:00:00Z' },
  { id: 'kgoal-6', org_id: 'org-2', employee_id: 'kemp-4', title: 'Obtain PMP certification', description: 'Complete PMP training and pass certification exam', category: 'development' as const, status: 'on_track' as const, progress: 80, start_date: '2026-01-01', due_date: '2026-03-31', created_at: '2026-01-08T00:00:00Z' },
  { id: 'kgoal-7', org_id: 'org-2', employee_id: 'kemp-7', title: 'Complete OCP Mining market entry study', description: 'Deliver market entry strategy for OCP Group mining operations', category: 'project' as const, status: 'behind' as const, progress: 20, start_date: '2026-02-01', due_date: '2026-04-15', created_at: '2026-01-28T00:00:00Z' },
  { id: 'kgoal-8', org_id: 'org-2', employee_id: 'kemp-15', title: 'Implement new billing system', description: 'Replace manual invoicing with automated time-and-billing platform', category: 'project' as const, status: 'on_track' as const, progress: 45, start_date: '2026-01-15', due_date: '2026-05-31', created_at: '2026-01-12T00:00:00Z' },
]

export const kashReviewCycles = [
  { id: 'kcycle-1', org_id: 'org-2', title: 'H1 2026 Performance Review', type: 'mid_year' as const, status: 'active' as const, start_date: '2026-01-15', end_date: '2026-03-15', created_at: '2026-01-10T00:00:00Z' },
  { id: 'kcycle-2', org_id: 'org-2', title: '2025 Annual Review', type: 'annual' as const, status: 'completed' as const, start_date: '2025-11-01', end_date: '2025-12-31', created_at: '2025-10-15T00:00:00Z' },
]

export const kashReviews = [
  { id: 'krev-1', org_id: 'org-2', cycle_id: 'kcycle-1', employee_id: 'kemp-3', reviewer_id: 'kemp-2', type: 'manager' as const, status: 'submitted' as const, overall_rating: 5, ratings: { leadership: 5, execution: 5, collaboration: 4, innovation: 4 }, comments: 'Thierry has excelled managing the MTN engagement. Client satisfaction is at an all-time high.', submitted_at: '2026-02-10T00:00:00Z', created_at: '2026-01-20T00:00:00Z' },
  { id: 'krev-2', org_id: 'org-2', cycle_id: 'kcycle-1', employee_id: 'kemp-4', reviewer_id: 'kemp-3', type: 'manager' as const, status: 'submitted' as const, overall_rating: 4, ratings: { leadership: 3, execution: 5, collaboration: 4, innovation: 4 }, comments: 'Nadia delivers exceptional analytical work. Ready for engagement manager role.', submitted_at: '2026-02-12T00:00:00Z', created_at: '2026-01-20T00:00:00Z' },
  { id: 'krev-3', org_id: 'org-2', cycle_id: 'kcycle-1', employee_id: 'kemp-8', reviewer_id: 'kemp-6', type: 'manager' as const, status: 'in_progress' as const, overall_rating: null, ratings: null, comments: null, submitted_at: null, created_at: '2026-01-20T00:00:00Z' },
  { id: 'krev-4', org_id: 'org-2', cycle_id: 'kcycle-1', employee_id: 'kemp-10', reviewer_id: 'kemp-9', type: 'manager' as const, status: 'submitted' as const, overall_rating: 4, ratings: { leadership: 3, execution: 4, collaboration: 5, innovation: 4 }, comments: 'Jean-Pierre brings strong technical depth to client engagements.', submitted_at: '2026-02-08T00:00:00Z', created_at: '2026-01-20T00:00:00Z' },
  { id: 'krev-5', org_id: 'org-2', cycle_id: 'kcycle-1', employee_id: 'kemp-14', reviewer_id: 'kemp-12', type: 'manager' as const, status: 'pending' as const, overall_rating: null, ratings: null, comments: null, submitted_at: null, created_at: '2026-01-20T00:00:00Z' },
  { id: 'krev-6', org_id: 'org-2', cycle_id: 'kcycle-1', employee_id: 'kemp-5', reviewer_id: 'kemp-3', type: 'manager' as const, status: 'submitted' as const, overall_rating: 3, ratings: { leadership: 2, execution: 4, collaboration: 3, innovation: 3 }, comments: 'Amina shows strong analytical skills. Needs to develop client-facing confidence.', submitted_at: '2026-02-18T00:00:00Z', created_at: '2026-01-20T00:00:00Z' },
]

export const kashFeedback = [
  { id: 'kfb-1', org_id: 'org-2', from_id: 'kemp-1', to_id: 'kemp-3', type: 'recognition' as const, content: 'Outstanding leadership on the MTN engagement. The client specifically praised your workshop facilitation.', is_public: true, created_at: '2026-02-18T00:00:00Z' },
  { id: 'kfb-2', org_id: 'org-2', from_id: 'kemp-6', to_id: 'kemp-8', type: 'feedback' as const, content: 'Your market analysis was thorough. For next time, consider adding more competitor benchmarking.', is_public: false, created_at: '2026-02-15T00:00:00Z' },
  { id: 'kfb-3', org_id: 'org-2', from_id: 'kemp-9', to_id: 'kemp-10', type: 'recognition' as const, content: 'The cloud migration assessment you delivered for Safaricom was excellent. Great client feedback.', is_public: true, created_at: '2026-02-12T00:00:00Z' },
  { id: 'kfb-4', org_id: 'org-2', from_id: 'kemp-2', to_id: 'kemp-4', type: 'recognition' as const, content: 'Your financial model for the OCP engagement was best-in-class. Truly partner-quality work.', is_public: true, created_at: '2026-02-10T00:00:00Z' },
  { id: 'kfb-5', org_id: 'org-2', from_id: 'kemp-12', to_id: 'kemp-13', type: 'checkin' as const, content: 'Good progress on the new onboarding program. Let us review the Kigali office rollout plan next week.', is_public: false, created_at: '2026-02-08T00:00:00Z' },
]

export const kashCompBands = [
  { id: 'kband-1', org_id: 'org-2', role_title: 'Partner', level: 'Director', country: 'South Africa', min_salary: 120000, mid_salary: 160000, max_salary: 220000, currency: 'USD', p25: 135000, p50: 160000, p75: 195000, effective_date: '2026-01-01' },
  { id: 'kband-2', org_id: 'org-2', role_title: 'Engagement Manager', level: 'Senior Manager', country: null, min_salary: 85000, mid_salary: 110000, max_salary: 140000, currency: 'USD', p25: 92000, p50: 110000, p75: 130000, effective_date: '2026-01-01' },
  { id: 'kband-3', org_id: 'org-2', role_title: 'Senior Consultant', level: 'Senior', country: null, min_salary: 65000, mid_salary: 85000, max_salary: 110000, currency: 'USD', p25: 72000, p50: 85000, p75: 100000, effective_date: '2026-01-01' },
  { id: 'kband-4', org_id: 'org-2', role_title: 'Consultant', level: 'Mid', country: null, min_salary: 45000, mid_salary: 62000, max_salary: 80000, currency: 'USD', p25: 50000, p50: 62000, p75: 74000, effective_date: '2026-01-01' },
  { id: 'kband-5', org_id: 'org-2', role_title: 'Analyst', level: 'Junior', country: null, min_salary: 35000, mid_salary: 45000, max_salary: 58000, currency: 'USD', p25: 38000, p50: 45000, p75: 53000, effective_date: '2026-01-01' },
]

export const kashSalaryReviews = [
  { id: 'ksr-1', org_id: 'org-2', employee_id: 'kemp-4', proposed_by: 'kemp-3', current_salary: 85000, proposed_salary: 95000, currency: 'USD', justification: 'Consistently delivers partner-quality work. Ready for promotion to Engagement Manager.', status: 'pending_approval' as const, approved_by: null, cycle: '2026 Annual', created_at: '2026-02-15T00:00:00Z' },
  { id: 'ksr-2', org_id: 'org-2', employee_id: 'kemp-10', proposed_by: 'kemp-9', current_salary: 78000, proposed_salary: 85000, currency: 'USD', justification: 'Strong client feedback. Market adjustment needed for senior tech talent in Kigali.', status: 'approved' as const, approved_by: 'kemp-1', cycle: '2026 Annual', created_at: '2026-02-10T00:00:00Z' },
]

export const kashCourses = [
  { id: 'kcourse-1', org_id: 'org-2', title: 'Consulting Foundations', description: 'Core consulting skills: problem structuring, hypothesis-driven thinking, client communication', category: 'Consulting', duration_hours: 24, format: 'blended' as const, level: 'beginner' as const, is_mandatory: true, created_at: '2025-06-01T00:00:00Z' },
  { id: 'kcourse-2', org_id: 'org-2', title: 'Advanced Financial Modelling', description: 'DCF, LBO, and M&A modelling for advisory engagements', category: 'Technical', duration_hours: 16, format: 'online' as const, level: 'advanced' as const, is_mandatory: false, created_at: '2025-03-01T00:00:00Z' },
  { id: 'kcourse-3', org_id: 'org-2', title: 'Client Relationship Management', description: 'Building and maintaining C-suite client relationships', category: 'Leadership', duration_hours: 12, format: 'classroom' as const, level: 'intermediate' as const, is_mandatory: false, created_at: '2025-09-01T00:00:00Z' },
  { id: 'kcourse-4', org_id: 'org-2', title: 'Data Analytics for Consultants', description: 'Python, SQL, and visualization tools for data-driven consulting', category: 'Technology', duration_hours: 20, format: 'online' as const, level: 'intermediate' as const, is_mandatory: false, created_at: '2025-07-01T00:00:00Z' },
  { id: 'kcourse-5', org_id: 'org-2', title: 'Africa Market Dynamics', description: 'Understanding business landscapes across Sub-Saharan and North Africa', category: 'Industry', duration_hours: 8, format: 'online' as const, level: 'beginner' as const, is_mandatory: true, created_at: '2025-01-01T00:00:00Z' },
  { id: 'kcourse-6', org_id: 'org-2', title: 'Partner Development Program', description: 'Executive presence, rainmaking, and practice leadership', category: 'Leadership', duration_hours: 40, format: 'blended' as const, level: 'advanced' as const, is_mandatory: false, created_at: '2025-04-01T00:00:00Z' },
]

export const kashEnrollments = [
  { id: 'kenr-1', org_id: 'org-2', employee_id: 'kemp-5', course_id: 'kcourse-1', status: 'in_progress' as const, progress: 70, enrolled_at: '2026-01-15T00:00:00Z', completed_at: null },
  { id: 'kenr-2', org_id: 'org-2', employee_id: 'kemp-4', course_id: 'kcourse-2', status: 'completed' as const, progress: 100, enrolled_at: '2025-10-01T00:00:00Z', completed_at: '2025-12-15T00:00:00Z' },
  { id: 'kenr-3', org_id: 'org-2', employee_id: 'kemp-8', course_id: 'kcourse-4', status: 'in_progress' as const, progress: 45, enrolled_at: '2026-02-01T00:00:00Z', completed_at: null },
  { id: 'kenr-4', org_id: 'org-2', employee_id: 'kemp-20', course_id: 'kcourse-5', status: 'enrolled' as const, progress: 0, enrolled_at: '2026-02-15T00:00:00Z', completed_at: null },
  { id: 'kenr-5', org_id: 'org-2', employee_id: 'kemp-2', course_id: 'kcourse-6', status: 'in_progress' as const, progress: 35, enrolled_at: '2026-01-20T00:00:00Z', completed_at: null },
  { id: 'kenr-6', org_id: 'org-2', employee_id: 'kemp-14', course_id: 'kcourse-1', status: 'completed' as const, progress: 100, enrolled_at: '2025-08-01T00:00:00Z', completed_at: '2025-10-01T00:00:00Z' },
]

export const kashSurveys = [
  { id: 'ksurvey-1', org_id: 'org-2', title: 'Q1 2026 Team Pulse', type: 'pulse' as const, status: 'closed' as const, start_date: '2026-01-15', end_date: '2026-01-31', anonymous: true, created_at: '2026-01-10T00:00:00Z' },
  { id: 'ksurvey-2', org_id: 'org-2', title: 'Q1 2026 eNPS', type: 'enps' as const, status: 'active' as const, start_date: '2026-02-01', end_date: '2026-02-28', anonymous: true, created_at: '2026-01-25T00:00:00Z' },
]

export const kashEngagementScores = [
  { id: 'kes-1', department_id: 'kdept-1', country_id: 'South Africa', period: '2026-Q1', overall_score: 82, enps_score: 48, response_rate: 95, themes: ['Client Work', 'Career Growth', 'Team Culture'] },
  { id: 'kes-2', department_id: 'kdept-2', country_id: 'Morocco', period: '2026-Q1', overall_score: 78, enps_score: 42, response_rate: 90, themes: ['Work-Life Balance', 'Learning', 'Leadership'] },
  { id: 'kes-3', department_id: 'kdept-3', country_id: 'Rwanda', period: '2026-Q1', overall_score: 85, enps_score: 55, response_rate: 100, themes: ['Innovation', 'Autonomy', 'Impact'] },
  { id: 'kes-4', department_id: 'kdept-4', country_id: 'South Africa', period: '2026-Q1', overall_score: 80, enps_score: 45, response_rate: 92, themes: ['Purpose', 'Development', 'Flexibility'] },
]

export const kashMentoringPrograms = [
  { id: 'kmp-1', org_id: 'org-2', title: 'Partner Track 2026', type: 'one_on_one' as const, status: 'active' as const, duration_months: 12, start_date: '2026-01-15', created_at: '2025-12-01T00:00:00Z' },
  { id: 'kmp-2', org_id: 'org-2', title: 'Cross-Office Knowledge Exchange', type: 'group' as const, status: 'active' as const, duration_months: 6, start_date: '2026-02-01', created_at: '2026-01-15T00:00:00Z' },
]

export const kashMentoringPairs = [
  { id: 'kpair-1', org_id: 'org-2', program_id: 'kmp-1', mentor_id: 'kemp-2', mentee_id: 'kemp-3', status: 'active' as const, match_score: 94, started_at: '2026-01-20T00:00:00Z' },
  { id: 'kpair-2', org_id: 'org-2', program_id: 'kmp-1', mentor_id: 'kemp-6', mentee_id: 'kemp-7', status: 'active' as const, match_score: 88, started_at: '2026-01-20T00:00:00Z' },
  { id: 'kpair-3', org_id: 'org-2', program_id: 'kmp-2', mentor_id: 'kemp-9', mentee_id: 'kemp-5', status: 'active' as const, match_score: 82, started_at: '2026-02-05T00:00:00Z' },
]

export const kashPayrollRuns = [
  { id: 'kpr-1', org_id: 'org-2', period: 'January 2026', status: 'paid' as const, total_gross: 380000, total_net: 295000, total_deductions: 85000, currency: 'USD', employee_count: 20, run_date: '2026-01-28T00:00:00Z', created_at: '2026-01-25T00:00:00Z' },
  { id: 'kpr-2', org_id: 'org-2', period: 'February 2026', status: 'approved' as const, total_gross: 385000, total_net: 298000, total_deductions: 87000, currency: 'USD', employee_count: 20, run_date: '2026-02-25T00:00:00Z', created_at: '2026-02-22T00:00:00Z' },
]

export const kashLeaveRequests = [
  { id: 'klr-1', org_id: 'org-2', employee_id: 'kemp-4', type: 'annual' as const, start_date: '2026-03-17', end_date: '2026-03-21', days: 5, status: 'approved' as const, reason: 'Family holiday in Cape Town', approved_by: 'kemp-3', created_at: '2026-02-15T00:00:00Z' },
  { id: 'klr-2', org_id: 'org-2', employee_id: 'kemp-11', type: 'sick' as const, start_date: '2026-02-20', end_date: '2026-02-21', days: 2, status: 'approved' as const, reason: 'Medical appointment', approved_by: 'kemp-9', created_at: '2026-02-19T00:00:00Z' },
  { id: 'klr-3', org_id: 'org-2', employee_id: 'kemp-8', type: 'personal' as const, start_date: '2026-03-05', end_date: '2026-03-05', days: 1, status: 'pending' as const, reason: 'Personal errand', approved_by: null, created_at: '2026-02-22T00:00:00Z' },
  { id: 'klr-4', org_id: 'org-2', employee_id: 'kemp-17', type: 'annual' as const, start_date: '2026-04-07', end_date: '2026-04-11', days: 5, status: 'pending' as const, reason: 'Visit family in Kigali', approved_by: null, created_at: '2026-02-20T00:00:00Z' },
]

export const kashBenefitPlans = [
  { id: 'kbp-1', org_id: 'org-2', name: 'Discovery Health Premium', type: 'medical' as const, provider: 'Discovery Health', cost_employee: 180, cost_employer: 520, currency: 'USD', description: 'Comprehensive medical aid with hospital and chronic cover', is_active: true, created_at: '2025-01-01T00:00:00Z' },
  { id: 'kbp-2', org_id: 'org-2', name: 'Allan Gray Retirement', type: 'retirement' as const, provider: 'Allan Gray', cost_employee: 0, cost_employer: 600, currency: 'USD', description: 'Employer-matched retirement annuity up to 12%', is_active: true, created_at: '2025-01-01T00:00:00Z' },
  { id: 'kbp-3', org_id: 'org-2', name: 'Group Life Cover', type: 'life' as const, provider: 'Old Mutual', cost_employee: 0, cost_employer: 250, currency: 'USD', description: '4x annual salary life insurance', is_active: true, created_at: '2025-01-01T00:00:00Z' },
]

export const kashExpenseReports = [
  { id: 'kexp-1', org_id: 'org-2', employee_id: 'kemp-3', title: 'MTN Engagement - Kigali Travel', total_amount: 2800, currency: 'USD', status: 'approved' as const, submitted_at: '2026-02-12T00:00:00Z', approved_by: 'kemp-2', created_at: '2026-02-10T00:00:00Z', items: [{ id: 'kei-1', category: 'Travel', description: 'Flight JNB-KGL return', amount: 1200 }, { id: 'kei-2', category: 'Accommodation', description: 'Kigali Serena (4 nights)', amount: 1100 }, { id: 'kei-3', category: 'Meals', description: 'Client dinners', amount: 500 }] },
  { id: 'kexp-2', org_id: 'org-2', employee_id: 'kemp-6', title: 'OCP Strategy Workshop - Casablanca', total_amount: 1450, currency: 'USD', status: 'submitted' as const, submitted_at: '2026-02-18T00:00:00Z', approved_by: null, created_at: '2026-02-16T00:00:00Z', items: [{ id: 'kei-4', category: 'Events', description: 'Workshop venue rental', amount: 800 }, { id: 'kei-5', category: 'Materials', description: 'Printed strategy decks', amount: 650 }] },
  { id: 'kexp-3', org_id: 'org-2', employee_id: 'kemp-18', title: 'BD Client Meetings - Nairobi', total_amount: 3500, currency: 'USD', status: 'pending_approval' as const, submitted_at: '2026-02-20T00:00:00Z', approved_by: null, created_at: '2026-02-19T00:00:00Z', items: [] },
]

export const kashJobPostings = [
  { id: 'kjob-1', org_id: 'org-2', title: 'Senior Consultant', department_id: 'kdept-1', location: 'Johannesburg, South Africa', type: 'full_time' as const, description: 'Join our consulting practice to deliver transformative engagements', requirements: '4+ years management consulting, MBA preferred', salary_min: 65000, salary_max: 95000, currency: 'USD', status: 'open' as const, created_at: '2026-01-20T00:00:00Z', application_count: 24 },
  { id: 'kjob-2', org_id: 'org-2', title: 'Strategy Analyst', department_id: 'kdept-2', location: 'Casablanca, Morocco', type: 'full_time' as const, description: 'Support strategy advisory engagements across Africa', requirements: '2+ years strategy/consulting, strong analytical skills', salary_min: 40000, salary_max: 60000, currency: 'USD', status: 'open' as const, created_at: '2026-02-05T00:00:00Z', application_count: 18 },
  { id: 'kjob-3', org_id: 'org-2', title: 'Tech Advisory Consultant', department_id: 'kdept-3', location: 'Kigali, Rwanda', type: 'full_time' as const, description: 'Help clients navigate digital transformation and technology strategy', requirements: '3+ years tech consulting, cloud/AI experience', salary_min: 55000, salary_max: 80000, currency: 'USD', status: 'open' as const, created_at: '2026-02-10T00:00:00Z', application_count: 12 },
]

export const kashApplications = [
  { id: 'kapp-1', org_id: 'org-2', job_id: 'kjob-1', candidate_name: 'Tendai Chirwa', candidate_email: 'tendai.c@gmail.com', status: 'interview' as const, stage: 'Case Interview', rating: 4, notes: 'Strong problem-solving skills. Ex-McKinsey.', applied_at: '2026-01-25T00:00:00Z' },
  { id: 'kapp-2', org_id: 'org-2', job_id: 'kjob-1', candidate_name: 'Amahle Dube', candidate_email: 'amahle.d@outlook.com', status: 'offer' as const, stage: 'Offer Extended', rating: 5, notes: 'Exceptional candidate. Deloitte background, strong Africa experience.', applied_at: '2026-01-22T00:00:00Z' },
  { id: 'kapp-3', org_id: 'org-2', job_id: 'kjob-2', candidate_name: 'Rachid Alaoui', candidate_email: 'r.alaoui@gmail.com', status: 'screening' as const, stage: 'Resume Review', rating: 3, notes: 'HEC Paris graduate, needs consulting experience', applied_at: '2026-02-10T00:00:00Z' },
  { id: 'kapp-4', org_id: 'org-2', job_id: 'kjob-3', candidate_name: 'Claude Niyonzima', candidate_email: 'claude.n@gmail.com', status: 'new' as const, stage: 'Application Received', rating: null, notes: null, applied_at: '2026-02-15T00:00:00Z' },
]

export const kashDevices = [
  { id: 'kdev-1', org_id: 'org-2', type: 'laptop' as const, brand: 'Apple', model: 'MacBook Pro 16"', serial_number: 'KSH-MBP-001', status: 'assigned' as const, assigned_to: 'kemp-1', purchase_date: '2025-06-15', warranty_end: '2028-06-15', created_at: '2025-06-20T00:00:00Z' },
  { id: 'kdev-2', org_id: 'org-2', type: 'laptop' as const, brand: 'Apple', model: 'MacBook Pro 14"', serial_number: 'KSH-MBP-002', status: 'assigned' as const, assigned_to: 'kemp-6', purchase_date: '2025-03-01', warranty_end: '2028-03-01', created_at: '2025-03-05T00:00:00Z' },
  { id: 'kdev-3', org_id: 'org-2', type: 'laptop' as const, brand: 'Apple', model: 'MacBook Air M3', serial_number: 'KSH-MBA-003', status: 'assigned' as const, assigned_to: 'kemp-4', purchase_date: '2025-09-01', warranty_end: '2028-09-01', created_at: '2025-09-05T00:00:00Z' },
  { id: 'kdev-4', org_id: 'org-2', type: 'laptop' as const, brand: 'Apple', model: 'MacBook Air M3', serial_number: 'KSH-MBA-004', status: 'available' as const, assigned_to: null, purchase_date: '2025-11-01', warranty_end: '2028-11-01', created_at: '2025-11-05T00:00:00Z' },
]

export const kashSoftwareLicenses = [
  { id: 'ksl-1', org_id: 'org-2', name: 'Microsoft 365 Business', vendor: 'Microsoft', total_licenses: 25, used_licenses: 20, cost_per_license: 22, currency: 'USD', renewal_date: '2026-12-31', created_at: '2025-01-01T00:00:00Z' },
  { id: 'ksl-2', org_id: 'org-2', name: 'Slack Pro', vendor: 'Slack', total_licenses: 25, used_licenses: 20, cost_per_license: 8.75, currency: 'USD', renewal_date: '2026-06-30', created_at: '2025-01-01T00:00:00Z' },
  { id: 'ksl-3', org_id: 'org-2', name: 'Tableau Desktop', vendor: 'Salesforce', total_licenses: 10, used_licenses: 8, cost_per_license: 70, currency: 'USD', renewal_date: '2026-09-30', created_at: '2025-03-01T00:00:00Z' },
]

export const kashITRequests = [
  { id: 'kitr-1', org_id: 'org-2', requester_id: 'kemp-5', type: 'hardware' as const, title: 'External monitor for home office', description: 'Need a 27" monitor for client deliverable work from home', priority: 'medium' as const, status: 'open' as const, assigned_to: null, created_at: '2026-02-18T00:00:00Z' },
  { id: 'kitr-2', org_id: 'org-2', requester_id: 'kemp-10', type: 'software' as const, title: 'AWS Console Access', description: 'Need AWS access for client cloud assessment engagement', priority: 'high' as const, status: 'in_progress' as const, assigned_to: 'kemp-9', created_at: '2026-02-15T00:00:00Z' },
]

export const kashInvoices = [
  { id: 'kinv-1', org_id: 'org-2', invoice_number: 'KSH-2026-001', vendor_id: 'kvnd-1', amount: 5500, currency: 'USD', status: 'paid' as const, due_date: '2026-02-15', issued_date: '2026-01-15', description: 'Q1 2026 Software Licenses', created_at: '2026-01-15T00:00:00Z' },
  { id: 'kinv-2', org_id: 'org-2', invoice_number: 'KSH-2026-002', vendor_id: 'kvnd-2', amount: 18000, currency: 'USD', status: 'sent' as const, due_date: '2026-03-01', issued_date: '2026-02-01', description: 'Johannesburg office lease - March', created_at: '2026-02-01T00:00:00Z' },
  { id: 'kinv-3', org_id: 'org-2', invoice_number: 'KSH-2026-003', vendor_id: 'kvnd-3', amount: 3200, currency: 'USD', status: 'overdue' as const, due_date: '2026-02-10', issued_date: '2026-01-10', description: 'Travel management platform fees', created_at: '2026-01-10T00:00:00Z' },
]

export const kashBudgets = [
  { id: 'kbud-1', org_id: 'org-2', name: 'Consulting Practice 2026', department_id: 'kdept-1', total_amount: 450000, spent_amount: 125000, currency: 'USD', fiscal_year: '2026', status: 'active' as const, created_at: '2025-12-01T00:00:00Z' },
  { id: 'kbud-2', org_id: 'org-2', name: 'People & Culture 2026', department_id: 'kdept-4', total_amount: 180000, spent_amount: 48000, currency: 'USD', fiscal_year: '2026', status: 'active' as const, created_at: '2025-12-01T00:00:00Z' },
  { id: 'kbud-3', org_id: 'org-2', name: 'Business Development 2026', department_id: 'kdept-6', total_amount: 220000, spent_amount: 65000, currency: 'USD', fiscal_year: '2026', status: 'active' as const, created_at: '2025-12-01T00:00:00Z' },
]

export const kashVendors = [
  { id: 'kvnd-1', org_id: 'org-2', name: 'Microsoft Corporation', contact_email: 'enterprise@microsoft.com', category: 'Software', status: 'active' as const, created_at: '2024-06-01T00:00:00Z' },
  { id: 'kvnd-2', org_id: 'org-2', name: 'Growthpoint Properties', contact_email: 'leasing@growthpoint.co.za', category: 'Real Estate', status: 'active' as const, created_at: '2024-06-01T00:00:00Z' },
  { id: 'kvnd-3', org_id: 'org-2', name: 'TravelPerk', contact_email: 'support@travelperk.com', category: 'Travel Management', status: 'active' as const, created_at: '2024-09-01T00:00:00Z' },
]

export const kashCredentials: DemoCredential[] = [
  { email: 's.ndlovu@kashco.com', password: 'demo1234', employeeId: 'kemp-1', role: 'owner', label: 'Managing Director (Owner)', title: 'Managing Director', department: 'Consulting', description: 'Full platform access. Sees all modules, firm-wide analytics, and executive dashboards.' },
  { email: 'l.amari@kashco.com', password: 'demo1234', employeeId: 'kemp-6', role: 'admin', label: 'Head of Strategy', title: 'Head of Strategy', department: 'Strategy', description: 'Strategy practice lead. Manages team, client engagements, and practice P&L.' },
  { email: 't.mugabo@kashco.com', password: 'demo1234', employeeId: 'kemp-3', role: 'manager', label: 'Engagement Manager', title: 'Engagement Manager', department: 'Consulting', description: 'Project lead. Manages team, reviews deliverables, approves time and expenses.' },
  { email: 'n.joubert@kashco.com', password: 'demo1234', employeeId: 'kemp-4', role: 'employee', label: 'Senior Consultant', title: 'Senior Consultant', department: 'Consulting', description: 'Individual contributor. Views own goals, learning, and submits time/expenses.' },
  { email: 'z.moyo@kashco.com', password: 'demo1234', employeeId: 'kemp-12', role: 'admin', label: 'CPO', title: 'Chief People Officer', department: 'People & Culture', description: 'People executive. Full access to HR, performance, engagement, and culture programs.' },
]

export const kashDashboardMetrics = {
  headcount: 156,
  active_employees: 148,
  new_hires_this_month: 3,
  attrition_rate: 6.5,
  avg_compa_ratio: 1.08,
  review_completion: 82,
  enps_score: 48,
  active_learners: 42,
  open_positions: 3,
  pending_expenses: 4,
  active_mentoring_pairs: 3,
  total_payroll: 385000,
}

export const kashProjects = [
  { id: 'kproj-1', org_id: 'org-2', title: 'MTN Digital Transformation Strategy', description: 'Develop and implement digital-first strategy for MTN Group across 5 African markets.', status: 'active' as const, owner_id: 'kemp-3', start_date: '2025-11-01', end_date: '2026-06-30', budget: 850000, currency: 'USD', created_at: '2025-10-15T08:00:00Z', updated_at: '2026-02-20T10:00:00Z' },
  { id: 'kproj-2', org_id: 'org-2', title: 'OCP Group Market Entry Study', description: 'Analyze and recommend market entry strategy for OCP mining operations in East Africa.', status: 'active' as const, owner_id: 'kemp-7', start_date: '2026-01-15', end_date: '2026-04-30', budget: 280000, currency: 'USD', created_at: '2026-01-10T09:00:00Z', updated_at: '2026-02-18T14:00:00Z' },
  { id: 'kproj-3', org_id: 'org-2', title: 'Safaricom Cloud Migration Assessment', description: 'Assess current infrastructure and design cloud migration roadmap for Safaricom enterprise systems.', status: 'planning' as const, owner_id: 'kemp-9', start_date: '2026-03-01', end_date: '2026-07-31', budget: 420000, currency: 'USD', created_at: '2026-02-01T10:00:00Z', updated_at: '2026-02-15T11:00:00Z' },
]

export const kashMilestones = [
  { id: 'kmile-1', org_id: 'org-2', project_id: 'kproj-1', title: 'Phase 1: Discovery Complete', due_date: '2026-01-31', status: 'done' as const, created_at: '2025-10-15T08:00:00Z' },
  { id: 'kmile-2', org_id: 'org-2', project_id: 'kproj-1', title: 'Phase 2: Strategy Recommendations', due_date: '2026-04-15', status: 'in_progress' as const, created_at: '2025-10-15T08:00:00Z' },
  { id: 'kmile-3', org_id: 'org-2', project_id: 'kproj-2', title: 'Market Research Complete', due_date: '2026-03-01', status: 'in_progress' as const, created_at: '2026-01-10T09:00:00Z' },
  { id: 'kmile-4', org_id: 'org-2', project_id: 'kproj-2', title: 'Final Recommendations Report', due_date: '2026-04-15', status: 'todo' as const, created_at: '2026-01-10T09:00:00Z' },
  { id: 'kmile-5', org_id: 'org-2', project_id: 'kproj-3', title: 'Infrastructure Assessment', due_date: '2026-04-30', status: 'todo' as const, created_at: '2026-02-01T10:00:00Z' },
]

export const kashTasks = [
  { id: 'ktask-1', org_id: 'org-2', project_id: 'kproj-1', milestone_id: 'kmile-1', title: 'Stakeholder interviews (20 executives)', description: 'Interview C-suite and senior leaders across all 5 markets.', status: 'done' as const, priority: 'high' as const, assignee_id: 'kemp-3', due_date: '2026-01-15', estimated_hours: 60, actual_hours: 55, created_at: '2025-10-15T08:00:00Z', updated_at: '2026-01-14T16:00:00Z' },
  { id: 'ktask-2', org_id: 'org-2', project_id: 'kproj-1', milestone_id: 'kmile-1', title: 'Digital maturity assessment', description: 'Benchmark MTN digital capabilities against global telco peers.', status: 'done' as const, priority: 'high' as const, assignee_id: 'kemp-4', due_date: '2026-01-25', estimated_hours: 40, actual_hours: 38, created_at: '2025-10-15T08:00:00Z', updated_at: '2026-01-24T17:00:00Z' },
  { id: 'ktask-3', org_id: 'org-2', project_id: 'kproj-1', milestone_id: 'kmile-2', title: 'Build strategic options framework', description: 'Develop 3-5 strategic options for digital transformation.', status: 'in_progress' as const, priority: 'critical' as const, assignee_id: 'kemp-3', due_date: '2026-03-15', estimated_hours: 80, actual_hours: 30, created_at: '2026-02-01T08:00:00Z', updated_at: '2026-02-20T10:00:00Z' },
  { id: 'ktask-4', org_id: 'org-2', project_id: 'kproj-1', milestone_id: 'kmile-2', title: 'Financial impact modelling', description: 'Model ROI and business case for each strategic option.', status: 'in_progress' as const, priority: 'high' as const, assignee_id: 'kemp-4', due_date: '2026-03-30', estimated_hours: 50, actual_hours: 15, created_at: '2026-02-01T08:00:00Z', updated_at: '2026-02-18T14:00:00Z' },
  { id: 'ktask-5', org_id: 'org-2', project_id: 'kproj-1', milestone_id: 'kmile-2', title: 'Client workshop facilitation', description: 'Run 2-day strategy workshop with MTN Group Executive Committee.', status: 'todo' as const, priority: 'high' as const, assignee_id: 'kemp-2', due_date: '2026-04-10', estimated_hours: 24, actual_hours: 0, created_at: '2026-02-01T08:00:00Z', updated_at: null },
  { id: 'ktask-6', org_id: 'org-2', project_id: 'kproj-2', milestone_id: 'kmile-3', title: 'East Africa mining landscape analysis', description: 'Map competitive landscape and regulatory environment in Rwanda, Tanzania, DRC.', status: 'in_progress' as const, priority: 'high' as const, assignee_id: 'kemp-7', due_date: '2026-02-28', estimated_hours: 40, actual_hours: 28, created_at: '2026-01-15T09:00:00Z', updated_at: '2026-02-20T11:00:00Z' },
  { id: 'ktask-7', org_id: 'org-2', project_id: 'kproj-2', milestone_id: 'kmile-3', title: 'Regulatory requirements mapping', description: 'Document mining licensing and environmental requirements per country.', status: 'in_progress' as const, priority: 'medium' as const, assignee_id: 'kemp-8', due_date: '2026-02-25', estimated_hours: 30, actual_hours: 22, created_at: '2026-01-15T09:00:00Z', updated_at: '2026-02-19T15:00:00Z' },
  { id: 'ktask-8', org_id: 'org-2', project_id: 'kproj-2', milestone_id: 'kmile-4', title: 'Entry mode evaluation', description: 'Assess joint venture, acquisition, and greenfield options.', status: 'todo' as const, priority: 'high' as const, assignee_id: 'kemp-6', due_date: '2026-04-01', estimated_hours: 35, actual_hours: 0, created_at: '2026-01-15T09:00:00Z', updated_at: null },
  { id: 'ktask-9', org_id: 'org-2', project_id: 'kproj-3', milestone_id: 'kmile-5', title: 'Current state infrastructure audit', description: 'Document all on-premise systems, dependencies, and data flows.', status: 'todo' as const, priority: 'high' as const, assignee_id: 'kemp-10', due_date: '2026-04-15', estimated_hours: 48, actual_hours: 0, created_at: '2026-02-01T10:00:00Z', updated_at: null },
  { id: 'ktask-10', org_id: 'org-2', project_id: 'kproj-3', milestone_id: 'kmile-5', title: 'Cloud readiness assessment', description: 'Evaluate application portfolio for cloud migration suitability.', status: 'todo' as const, priority: 'medium' as const, assignee_id: 'kemp-11', due_date: '2026-04-30', estimated_hours: 36, actual_hours: 0, created_at: '2026-02-01T10:00:00Z', updated_at: null },
]

export const kashTaskDependencies = [
  { id: 'kdep-1', task_id: 'ktask-3', depends_on_task_id: 'ktask-1' },
  { id: 'kdep-2', task_id: 'ktask-4', depends_on_task_id: 'ktask-2' },
  { id: 'kdep-3', task_id: 'ktask-5', depends_on_task_id: 'ktask-3' },
  { id: 'kdep-4', task_id: 'ktask-8', depends_on_task_id: 'ktask-6' },
  { id: 'kdep-5', task_id: 'ktask-10', depends_on_task_id: 'ktask-9' },
]

export const kashStrategicObjectives = [
  { id: 'kobj-1', org_id: 'org-2', title: 'Become Top 3 Pan-African Consulting Firm', description: 'Achieve top-3 ranking in management consulting across Africa by revenue and reputation.', status: 'active' as const, owner_id: 'kemp-1', period: 'FY2026', progress: 40, created_at: '2025-12-01T08:00:00Z', updated_at: '2026-02-20T10:00:00Z' },
  { id: 'kobj-2', org_id: 'org-2', title: 'Build World-Class Talent Pipeline', description: 'Attract and retain top consulting talent from Africa and the diaspora.', status: 'active' as const, owner_id: 'kemp-12', period: 'FY2026', progress: 35, created_at: '2025-12-01T08:00:00Z', updated_at: '2026-02-18T14:00:00Z' },
]

export const kashKeyResults = [
  { id: 'kkr-1', org_id: 'org-2', objective_id: 'kobj-1', title: '$8M annual revenue', target_value: 8, current_value: 3.2, unit: 'M USD', owner_id: 'kemp-1', due_date: '2026-12-31', created_at: '2025-12-01T08:00:00Z', updated_at: '2026-02-20T10:00:00Z' },
  { id: 'kkr-2', org_id: 'org-2', objective_id: 'kobj-1', title: '15 active client engagements', target_value: 15, current_value: 8, unit: 'engagements', owner_id: 'kemp-18', due_date: '2026-12-31', created_at: '2025-12-01T08:00:00Z', updated_at: '2026-02-15T11:00:00Z' },
  { id: 'kkr-3', org_id: 'org-2', objective_id: 'kobj-1', title: '90% client satisfaction (NPS)', target_value: 90, current_value: 82, unit: 'NPS', owner_id: 'kemp-2', due_date: '2026-12-31', created_at: '2025-12-01T08:00:00Z', updated_at: '2026-02-18T09:00:00Z' },
  { id: 'kkr-4', org_id: 'org-2', objective_id: 'kobj-2', title: 'Hire 8 consultants this year', target_value: 8, current_value: 3, unit: 'hires', owner_id: 'kemp-12', due_date: '2026-12-31', created_at: '2025-12-01T08:00:00Z', updated_at: '2026-02-20T14:00:00Z' },
  { id: 'kkr-5', org_id: 'org-2', objective_id: 'kobj-2', title: 'Reduce attrition below 8%', target_value: 8, current_value: 6.5, unit: '%', owner_id: 'kemp-12', due_date: '2026-12-31', created_at: '2025-12-01T08:00:00Z', updated_at: '2026-02-19T16:00:00Z' },
]

export const kashInitiatives = [
  { id: 'kinit-1', org_id: 'org-2', objective_id: 'kobj-1', title: 'East Africa Office Expansion', description: 'Grow Kigali office from 5 to 10 consultants and establish Nairobi presence.', status: 'in_progress' as const, owner_id: 'kemp-18', start_date: '2026-01-15', end_date: '2026-09-30', progress: 30, budget: 180000, currency: 'USD', created_at: '2025-12-15T08:00:00Z', updated_at: '2026-02-20T10:00:00Z' },
  { id: 'kinit-2', org_id: 'org-2', objective_id: 'kobj-1', title: 'AI Advisory Practice Launch', description: 'Build dedicated AI/ML advisory capability to serve enterprise clients.', status: 'approved' as const, owner_id: 'kemp-9', start_date: '2026-03-01', end_date: '2026-12-31', progress: 10, budget: 120000, currency: 'USD', created_at: '2026-01-10T08:00:00Z', updated_at: '2026-02-18T14:00:00Z' },
  { id: 'kinit-3', org_id: 'org-2', objective_id: 'kobj-2', title: 'Graduate Analyst Program', description: 'Launch structured 2-year analyst program targeting top African universities.', status: 'in_progress' as const, owner_id: 'kemp-12', start_date: '2026-02-01', end_date: '2026-08-31', progress: 25, budget: 85000, currency: 'USD', created_at: '2026-01-20T08:00:00Z', updated_at: '2026-02-20T15:00:00Z' },
]

export const kashKPIDefinitions = [
  { id: 'kkpi-1', org_id: 'org-2', name: 'Billable Utilization Rate', description: 'Percentage of consultant hours billed to clients.', unit: '%', target_value: 75, frequency: 'monthly' as const, department_id: 'kdept-1', owner_id: 'kemp-2', created_at: '2025-12-01T08:00:00Z' },
  { id: 'kkpi-2', org_id: 'org-2', name: 'Revenue per Consultant', description: 'Average annual revenue generated per consultant.', unit: 'USD', target_value: 320000, frequency: 'quarterly' as const, department_id: null, owner_id: 'kemp-15', created_at: '2025-12-01T08:00:00Z' },
  { id: 'kkpi-3', org_id: 'org-2', name: 'Client Satisfaction Score', description: 'Average post-engagement client satisfaction rating.', unit: 'score', target_value: 4.5, frequency: 'quarterly' as const, department_id: null, owner_id: 'kemp-1', created_at: '2025-12-01T08:00:00Z' },
  { id: 'kkpi-4', org_id: 'org-2', name: 'Proposal Win Rate', description: 'Percentage of proposals that convert to signed engagements.', unit: '%', target_value: 35, frequency: 'monthly' as const, department_id: 'kdept-6', owner_id: 'kemp-18', created_at: '2025-12-01T08:00:00Z' },
]

export const kashKPIMeasurements = [
  { id: 'kkpim-1', kpi_id: 'kkpi-1', value: 68, period: '2025-12', recorded_at: '2026-01-05T08:00:00Z', notes: null },
  { id: 'kkpim-2', kpi_id: 'kkpi-1', value: 72, period: '2026-01', recorded_at: '2026-02-05T08:00:00Z', notes: 'Improving with MTN ramp-up' },
  { id: 'kkpim-3', kpi_id: 'kkpi-2', value: 280000, period: 'Q4-2025', recorded_at: '2026-01-15T08:00:00Z', notes: null },
  { id: 'kkpim-4', kpi_id: 'kkpi-3', value: 4.3, period: 'Q4-2025', recorded_at: '2026-01-10T08:00:00Z', notes: null },
  { id: 'kkpim-5', kpi_id: 'kkpi-4', value: 28, period: '2025-12', recorded_at: '2026-01-05T08:00:00Z', notes: null },
  { id: 'kkpim-6', kpi_id: 'kkpi-4', value: 33, period: '2026-01', recorded_at: '2026-02-05T08:00:00Z', notes: 'Pipeline quality improving' },
]

export const kashWorkflows = [
  { id: 'kwf-1', org_id: 'org-2', title: 'New Hire Onboarding', description: 'Automated onboarding: IT setup, mandatory training, buddy assignment, 30-day check-in.', status: 'active' as const, trigger_type: 'event' as const, trigger_config: { event: 'employee.created' }, created_by: 'kemp-12', created_at: '2025-08-01T08:00:00Z', updated_at: '2026-02-10T10:00:00Z' },
  { id: 'kwf-2', org_id: 'org-2', title: 'Expense Approval Chain', description: 'Route expenses: <$1000 manager, <$5000 partner, >$5000 MD.', status: 'active' as const, trigger_type: 'event' as const, trigger_config: { event: 'expense_report.submitted' }, created_by: 'kemp-15', created_at: '2025-09-01T08:00:00Z', updated_at: '2026-01-20T14:00:00Z' },
  { id: 'kwf-3', org_id: 'org-2', title: 'Engagement Kickoff Checklist', description: 'Automated checklist when new client engagement starts: team assignment, tool access, client intro.', status: 'draft' as const, trigger_type: 'event' as const, trigger_config: { event: 'project.created' }, created_by: 'kemp-2', created_at: '2026-02-01T08:00:00Z', updated_at: '2026-02-15T11:00:00Z' },
]

export const kashWorkflowSteps = [
  { id: 'kwfs-1', workflow_id: 'kwf-1', step_type: 'action' as const, title: 'Create IT accounts', config: { action: 'create_accounts', systems: ['email', 'slack', 'office365'] }, position: 0, next_step_id: 'kwfs-2', created_at: '2025-08-01T08:00:00Z' },
  { id: 'kwfs-2', workflow_id: 'kwf-1', step_type: 'notification' as const, title: 'Send welcome email', config: { template: 'welcome_new_hire', to: 'employee' }, position: 1, next_step_id: 'kwfs-3', created_at: '2025-08-01T08:00:00Z' },
  { id: 'kwfs-3', workflow_id: 'kwf-1', step_type: 'action' as const, title: 'Assign buddy', config: { action: 'assign_buddy' }, position: 2, next_step_id: 'kwfs-4', created_at: '2025-08-01T08:00:00Z' },
  { id: 'kwfs-4', workflow_id: 'kwf-1', step_type: 'delay' as const, title: 'Wait 30 days', config: { duration: 30, unit: 'days' }, position: 3, next_step_id: 'kwfs-5', created_at: '2025-08-01T08:00:00Z' },
  { id: 'kwfs-5', workflow_id: 'kwf-1', step_type: 'notification' as const, title: 'Send 30-day check-in', config: { template: '30_day_checkin', to: 'employee' }, position: 4, next_step_id: null, created_at: '2025-08-01T08:00:00Z' },
  { id: 'kwfs-6', workflow_id: 'kwf-2', step_type: 'condition' as const, title: 'Check amount', config: { field: 'total_amount', operator: 'less_than', value: 1000 }, position: 0, next_step_id: 'kwfs-7', created_at: '2025-09-01T08:00:00Z' },
  { id: 'kwfs-7', workflow_id: 'kwf-2', step_type: 'approval' as const, title: 'Route to approver', config: { approver: 'amount_based', thresholds: { 1000: 'manager', 5000: 'partner', default: 'md' } }, position: 1, next_step_id: 'kwfs-8', created_at: '2025-09-01T08:00:00Z' },
  { id: 'kwfs-8', workflow_id: 'kwf-2', step_type: 'notification' as const, title: 'Send result', config: { template: 'expense_decision', to: 'employee' }, position: 2, next_step_id: null, created_at: '2025-09-01T08:00:00Z' },
]

export const kashWorkflowRuns = [
  { id: 'kwfr-1', org_id: 'org-2', workflow_id: 'kwf-1', status: 'completed' as const, started_at: '2026-02-10T09:00:00Z', completed_at: '2026-02-10T09:04:00Z', triggered_by: 'system', context: { employee_id: 'kemp-20', employee_name: 'Kwame Osei' } },
  { id: 'kwfr-2', org_id: 'org-2', workflow_id: 'kwf-2', status: 'completed' as const, started_at: '2026-02-12T14:00:00Z', completed_at: '2026-02-13T09:00:00Z', triggered_by: 'system', context: { report_id: 'kexp-1', employee_name: 'Thierry Mugabo' } },
  { id: 'kwfr-3', org_id: 'org-2', workflow_id: 'kwf-2', status: 'running' as const, started_at: '2026-02-18T16:00:00Z', completed_at: null, triggered_by: 'system', context: { report_id: 'kexp-2', employee_name: 'Layla Amari' } },
]

export const kashWorkflowTemplates = [
  { id: 'kwft-1', org_id: 'org-2', title: 'Consultant Onboarding', description: 'Complete onboarding for new consultants with IT setup, training, and buddy.', category: 'hr', config: { steps: ['create_accounts', 'welcome_email', 'assign_buddy', 'check_in'] }, created_at: '2025-07-01T08:00:00Z' },
  { id: 'kwft-2', org_id: 'org-2', title: 'Expense Approval', description: 'Multi-level expense approval based on amount thresholds.', category: 'operations', config: { steps: ['check_amount', 'route_approval', 'notification'] }, created_at: '2025-07-01T08:00:00Z' },
]

export const kashNotifications = [
  { id: 'knotif-1', org_id: 'org-2', recipient_id: 'kemp-1', sender_id: 'kemp-3', type: 'action_required' as const, channel: 'in_app' as const, title: 'Expense Report Pending', message: 'Thierry Mugabo submitted an expense report for MTN Engagement travel ($2,800).', link: '/expense', entity_type: 'expense_report', is_read: false, created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString() },
  { id: 'knotif-2', org_id: 'org-2', recipient_id: 'kemp-1', sender_id: null, type: 'reminder' as const, channel: 'in_app' as const, title: 'Review Cycle Ending Soon', message: 'The H1 2026 review cycle closes in 5 days. 2 reviews are still pending.', link: '/performance', entity_type: 'review_cycle', is_read: false, created_at: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString() },
  { id: 'knotif-3', org_id: 'org-2', recipient_id: 'kemp-1', sender_id: 'kemp-18', type: 'info' as const, channel: 'in_app' as const, title: 'New Engagement Won', message: 'Safaricom Cloud Migration Assessment has been signed. Kicking off March 1.', link: '/projects', entity_type: 'project', is_read: false, created_at: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString() },
  { id: 'knotif-4', org_id: 'org-2', recipient_id: 'kemp-1', sender_id: null, type: 'success' as const, channel: 'in_app' as const, title: 'Onboarding Complete', message: 'New Hire Onboarding workflow for Kwame Osei completed successfully.', link: '/workflow-studio', entity_type: 'workflow', is_read: true, created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() },
  { id: 'knotif-5', org_id: 'org-2', recipient_id: 'kemp-1', sender_id: 'kemp-12', type: 'warning' as const, channel: 'in_app' as const, title: 'Salary Proposal Pending', message: 'There is 1 compensation proposal awaiting your approval.', link: '/compensation', entity_type: 'salary_review', is_read: false, created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString() },
]

// ============================================================
// LEARNING PATHS
// ============================================================

export const demoLearningPaths = [
  { id: 'lp-1', org_id: 'org-1', title: 'New Manager Essentials', description: 'Complete pathway for first-time managers covering leadership, communication, and team management', course_ids: ['course-1', 'course-5', 'course-7'], estimated_hours: 44, level: 'intermediate' as const, created_at: '2025-09-01T00:00:00Z' },
  { id: 'lp-2', org_id: 'org-1', title: 'Compliance Mastery', description: 'Mandatory compliance training pathway for all employees', course_ids: ['course-2', 'course-6'], estimated_hours: 7, level: 'beginner' as const, created_at: '2025-01-01T00:00:00Z' },
  { id: 'lp-3', org_id: 'org-1', title: 'Digital Banking Specialist', description: 'Technical pathway for understanding modern banking tech stack', course_ids: ['course-4', 'course-7', 'course-3'], estimated_hours: 40, level: 'advanced' as const, created_at: '2025-10-01T00:00:00Z' },
  { id: 'lp-4', org_id: 'org-1', title: 'Executive Leadership Track', description: 'Senior leadership development pathway for director-level and above', course_ids: ['course-1', 'course-8'], estimated_hours: 28, level: 'advanced' as const, created_at: '2025-05-01T00:00:00Z' },
]

export const kashLearningPaths = [
  { id: 'klp-1', org_id: 'org-2', title: 'Consultant Foundations', description: 'Essential skills pathway for new consultants', course_ids: ['kcourse-1', 'kcourse-5'], estimated_hours: 32, level: 'beginner' as const, created_at: '2025-06-01T00:00:00Z' },
  { id: 'klp-2', org_id: 'org-2', title: 'Partner Track', description: 'Advanced pathway for senior consultants aiming for partnership', course_ids: ['kcourse-3', 'kcourse-6', 'kcourse-2'], estimated_hours: 68, level: 'advanced' as const, created_at: '2025-04-01T00:00:00Z' },
  { id: 'klp-3', org_id: 'org-2', title: 'Data-Driven Advisory', description: 'Analytics and technology skills for modern consulting', course_ids: ['kcourse-4', 'kcourse-2'], estimated_hours: 36, level: 'intermediate' as const, created_at: '2025-07-01T00:00:00Z' },
]

// ============================================================
// LIVE SESSIONS
// ============================================================

export const demoLiveSessions = [
  { id: 'ls-1', org_id: 'org-1', course_id: 'course-1', title: 'Leadership Q&A with CHRO', instructor: 'Amara Kone', scheduled_at: '2026-03-05T10:00:00Z', duration_minutes: 60, type: 'q_and_a' as const, capacity: 50, enrolled_count: 38, meeting_url: 'https://meet.tempo.com/ls-1', status: 'upcoming' as const },
  { id: 'ls-2', org_id: 'org-1', course_id: 'course-3', title: 'Advanced Credit Analysis Workshop', instructor: 'Amadou Diallo', scheduled_at: '2026-03-10T14:00:00Z', duration_minutes: 120, type: 'workshop' as const, capacity: 30, enrolled_count: 28, meeting_url: 'https://meet.tempo.com/ls-2', status: 'upcoming' as const },
  { id: 'ls-3', org_id: 'org-1', course_id: 'course-4', title: 'Digital Banking API Deep Dive', instructor: 'Babajide Ogunleye', scheduled_at: '2026-02-25T09:00:00Z', duration_minutes: 90, type: 'webinar' as const, capacity: 100, enrolled_count: 72, meeting_url: 'https://meet.tempo.com/ls-3', status: 'completed' as const },
  { id: 'ls-4', org_id: 'org-1', course_id: 'course-2', title: 'AML Compliance Update 2026', instructor: 'Chukwuma Obi', scheduled_at: '2026-03-15T11:00:00Z', duration_minutes: 45, type: 'webinar' as const, capacity: 200, enrolled_count: 145, meeting_url: 'https://meet.tempo.com/ls-4', status: 'upcoming' as const },
  { id: 'ls-5', org_id: 'org-1', course_id: 'course-5', title: 'Customer Experience Role Play', instructor: 'Folake Adebayo', scheduled_at: '2026-02-20T15:00:00Z', duration_minutes: 90, type: 'workshop' as const, capacity: 20, enrolled_count: 20, meeting_url: 'https://meet.tempo.com/ls-5', status: 'completed' as const },
]

export const kashLiveSessions = [
  { id: 'kls-1', org_id: 'org-2', course_id: 'kcourse-1', title: 'Case Interview Masterclass', instructor: 'Naledi Mthembu', scheduled_at: '2026-03-07T09:00:00Z', duration_minutes: 120, type: 'workshop' as const, capacity: 25, enrolled_count: 22, meeting_url: 'https://meet.tempo.com/kls-1', status: 'upcoming' as const },
  { id: 'kls-2', org_id: 'org-2', course_id: 'kcourse-3', title: 'C-Suite Communication Skills', instructor: 'Olumide Kash', scheduled_at: '2026-03-12T14:00:00Z', duration_minutes: 60, type: 'webinar' as const, capacity: 40, enrolled_count: 35, meeting_url: 'https://meet.tempo.com/kls-2', status: 'upcoming' as const },
  { id: 'kls-3', org_id: 'org-2', course_id: 'kcourse-4', title: 'Python for Consultants Workshop', instructor: 'Farah Benali', scheduled_at: '2026-02-22T10:00:00Z', duration_minutes: 180, type: 'workshop' as const, capacity: 15, enrolled_count: 15, meeting_url: 'https://meet.tempo.com/kls-3', status: 'completed' as const },
  { id: 'kls-4', org_id: 'org-2', course_id: 'kcourse-5', title: 'Africa Markets Roundtable', instructor: 'Kweku Mensah-Bonsu', scheduled_at: '2026-03-20T11:00:00Z', duration_minutes: 90, type: 'q_and_a' as const, capacity: 50, enrolled_count: 38, meeting_url: 'https://meet.tempo.com/kls-4', status: 'upcoming' as const },
]

// ============================================================
// AI BUILDER TEMPLATES (shared, not org-specific)
// ============================================================

export const aiBuilderTemplates = [
  { id: 'tpl-1', title: 'Onboarding Program', description: 'Comprehensive new hire orientation covering company culture, tools, and processes', category: 'Onboarding', estimated_duration: 8, module_count: 5 },
  { id: 'tpl-2', title: 'Compliance Training', description: 'Regulatory compliance course with assessments and certifications', category: 'Compliance', estimated_duration: 4, module_count: 4 },
  { id: 'tpl-3', title: 'Leadership Development', description: 'Emerging leaders program covering communication, delegation, and decision-making', category: 'Leadership', estimated_duration: 16, module_count: 6 },
  { id: 'tpl-4', title: 'Technical Skills Bootcamp', description: 'Intensive technical upskilling program with hands-on projects', category: 'Technical', estimated_duration: 24, module_count: 8 },
  { id: 'tpl-5', title: 'Sales Enablement', description: 'Product knowledge, objection handling, and sales methodology training', category: 'Sales', estimated_duration: 12, module_count: 5 },
  { id: 'tpl-6', title: 'Diversity & Inclusion', description: 'Building inclusive workplaces through awareness, empathy, and action', category: 'Culture', estimated_duration: 6, module_count: 4 },
]

// ============================================================
// CAREER SITE CONFIG
// ============================================================

export const demoCareerSiteConfig = {
  org_id: 'org-1',
  enabled: true,
  theme: 'professional' as const,
  hero_title: 'Build Your Career at Ecobank',
  hero_subtitle: 'Join Africa\'s leading pan-African banking group and make an impact across 33 countries',
  logo_url: null,
  sections: ['about', 'benefits', 'positions', 'team', 'testimonials'] as string[],
}

export const kashCareerSiteConfig = {
  org_id: 'org-2',
  enabled: true,
  theme: 'modern' as const,
  hero_title: 'Shape Africa\'s Future with Kash & Co',
  hero_subtitle: 'Join a premier consulting firm driving transformation across the continent',
  logo_url: null,
  sections: ['about', 'benefits', 'positions', 'team'] as string[],
}

// ============================================================
// JOB DISTRIBUTIONS
// ============================================================

export const demoJobDistributions = [
  { id: 'dist-1', org_id: 'org-1', job_id: 'job-1', boards: ['linkedin', 'indeed', 'glassdoor', 'google_jobs'] as string[], posted_at: '2026-01-16T00:00:00Z', status_per_board: { linkedin: 'posted' as const, indeed: 'posted' as const, glassdoor: 'posted' as const, google_jobs: 'posted' as const } },
  { id: 'dist-2', org_id: 'org-1', job_id: 'job-2', boards: ['linkedin', 'indeed'] as string[], posted_at: '2026-02-02T00:00:00Z', status_per_board: { linkedin: 'posted' as const, indeed: 'posted' as const } },
  { id: 'dist-3', org_id: 'org-1', job_id: 'job-4', boards: ['linkedin', 'indeed', 'glassdoor', 'google_jobs', 'angellist'] as string[], posted_at: '2026-02-16T00:00:00Z', status_per_board: { linkedin: 'posted' as const, indeed: 'posted' as const, glassdoor: 'pending' as const, google_jobs: 'posted' as const, angellist: 'posted' as const } },
]

export const kashJobDistributions = [
  { id: 'kdist-1', org_id: 'org-2', job_id: 'kjob-1', boards: ['linkedin', 'indeed', 'glassdoor'] as string[], posted_at: '2026-01-21T00:00:00Z', status_per_board: { linkedin: 'posted' as const, indeed: 'posted' as const, glassdoor: 'posted' as const } },
  { id: 'kdist-2', org_id: 'org-2', job_id: 'kjob-3', boards: ['linkedin', 'angellist'] as string[], posted_at: '2026-02-11T00:00:00Z', status_per_board: { linkedin: 'posted' as const, angellist: 'posted' as const } },
]

// ============================================================
// MULTI-ORG HELPERS
// ============================================================

export function getDemoDataForOrg(orgId: string) {
  if (orgId === 'org-2') {
    return {
      org: kashOrg,
      user: kashUser,
      departments: kashDepartments,
      employees: kashEmployees,
      goals: kashGoals,
      reviewCycles: kashReviewCycles,
      reviews: kashReviews,
      feedback: kashFeedback,
      compBands: kashCompBands,
      salaryReviews: kashSalaryReviews,
      courses: kashCourses,
      enrollments: kashEnrollments,
      surveys: kashSurveys,
      engagementScores: kashEngagementScores,
      mentoringPrograms: kashMentoringPrograms,
      mentoringPairs: kashMentoringPairs,
      payrollRuns: kashPayrollRuns,
      leaveRequests: kashLeaveRequests,
      benefitPlans: kashBenefitPlans,
      expenseReports: kashExpenseReports,
      jobPostings: kashJobPostings,
      applications: kashApplications,
      devices: kashDevices,
      softwareLicenses: kashSoftwareLicenses,
      itRequests: kashITRequests,
      invoices: kashInvoices,
      budgets: kashBudgets,
      vendors: kashVendors,
      credentials: kashCredentials,
      dashboardMetrics: kashDashboardMetrics,
      projects: kashProjects,
      milestones: kashMilestones,
      tasks: kashTasks,
      taskDependencies: kashTaskDependencies,
      strategicObjectives: kashStrategicObjectives,
      keyResults: kashKeyResults,
      initiatives: kashInitiatives,
      kpiDefinitions: kashKPIDefinitions,
      kpiMeasurements: kashKPIMeasurements,
      workflows: kashWorkflows,
      workflowSteps: kashWorkflowSteps,
      workflowRuns: kashWorkflowRuns,
      workflowTemplates: kashWorkflowTemplates,
      notifications: kashNotifications,
      learningPaths: kashLearningPaths,
      liveSessions: kashLiveSessions,
      careerSiteConfig: kashCareerSiteConfig,
      jobDistributions: kashJobDistributions,
    }
  }
  // Default: Ecobank
  return {
    org: demoOrg,
    user: demoUser,
    departments: demoDepartments,
    employees: demoEmployees,
    goals: demoGoals,
    reviewCycles: demoReviewCycles,
    reviews: demoReviews,
    feedback: demoFeedback,
    compBands: demoCompBands,
    salaryReviews: demoSalaryReviews,
    courses: demoCourses,
    enrollments: demoEnrollments,
    surveys: demoSurveys,
    engagementScores: demoEngagementScores,
    mentoringPrograms: demoMentoringPrograms,
    mentoringPairs: demoMentoringPairs,
    payrollRuns: demoPayrollRuns,
    leaveRequests: demoLeaveRequests,
    benefitPlans: demoBenefitPlans,
    expenseReports: demoExpenseReports,
    jobPostings: demoJobPostings,
    applications: demoApplications,
    devices: demoDevices,
    softwareLicenses: demoSoftwareLicenses,
    itRequests: demoITRequests,
    invoices: demoInvoices,
    budgets: demoBudgets,
    vendors: demoVendors,
    credentials: demoCredentials,
    dashboardMetrics: demoDashboardMetrics,
    projects: demoProjects,
    milestones: demoMilestones,
    tasks: demoTasks,
    taskDependencies: demoTaskDependencies,
    strategicObjectives: demoStrategicObjectives,
    keyResults: demoKeyResults,
    initiatives: demoInitiatives,
    kpiDefinitions: demoKPIDefinitions,
    kpiMeasurements: demoKPIMeasurements,
    workflows: demoWorkflows,
    workflowSteps: demoWorkflowSteps,
    workflowRuns: demoWorkflowRuns,
    workflowTemplates: demoWorkflowTemplates,
    notifications: demoNotifications,
    learningPaths: demoLearningPaths,
    liveSessions: demoLiveSessions,
    careerSiteConfig: demoCareerSiteConfig,
    jobDistributions: demoJobDistributions,
  }
}

export const allDemoCredentials: DemoCredential[] = [...demoCredentials, ...kashCredentials]

// ─── Platform Admin Demo Credentials ─────────────────────────────────────

export interface DemoAdminCredential {
  email: string
  password: string
  name: string
  role: 'super_admin' | 'support' | 'viewer'
  description: string
}

export const demoAdminCredentials: DemoAdminCredential[] = [
  {
    email: 'admin@tempo.dev',
    password: 'admin1234',
    name: 'Tempo Admin',
    role: 'super_admin',
    description: 'Full platform access — manage orgs, impersonate users',
  },
]
