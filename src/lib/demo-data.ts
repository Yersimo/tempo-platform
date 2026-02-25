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

// 1:1 Meetings
export const demoOneOnOnes = [
  { id: 'oo-1', org_id: 'org-1', manager_id: 'emp-1', employee_id: 'emp-2', scheduled_date: '2026-02-28T10:00:00Z', status: 'upcoming' as const, agenda: ['Review branch revenue targets', 'Discuss team expansion plans', 'Career development check-in'], notes: null as string | null, action_items: [] as Array<{text:string,assignee:string,done:boolean,due_date:string}>, duration_minutes: 30, recurring: 'weekly' as const, location: 'Conference Room A' },
  { id: 'oo-2', org_id: 'org-1', manager_id: 'emp-5', employee_id: 'emp-6', scheduled_date: '2026-02-27T14:00:00Z', status: 'upcoming' as const, agenda: ['Credit portfolio review progress', 'Training opportunities', 'Workload balance'], notes: null as string | null, action_items: [] as Array<{text:string,assignee:string,done:boolean,due_date:string}>, duration_minutes: 45, recurring: 'biweekly' as const, location: 'Virtual - Teams' },
  { id: 'oo-3', org_id: 'org-1', manager_id: 'emp-13', employee_id: 'emp-14', scheduled_date: '2026-02-21T09:00:00Z', status: 'completed' as const, agenda: ['Payment gateway migration status', 'Technical blockers', 'Code review feedback'], notes: 'Discussed migration timeline. Yaw raised concerns about third-party API compatibility. Agreed to schedule a technical spike next week.' as string | null, action_items: [{ text: 'Schedule API compatibility spike', assignee: 'emp-14', done: false, due_date: '2026-02-28' }, { text: 'Update migration timeline in Jira', assignee: 'emp-14', done: true, due_date: '2026-02-24' }], duration_minutes: 30, recurring: 'weekly' as const, location: 'Tech Hub Room 3' },
  { id: 'oo-4', org_id: 'org-1', manager_id: 'emp-17', employee_id: 'emp-18', scheduled_date: '2026-02-20T11:00:00Z', status: 'completed' as const, agenda: ['Recruitment pipeline review', 'Employer branding initiatives', 'Time-to-hire metrics'], notes: 'Folake presented updated hiring funnel. 3 senior roles still open past SLA. Discussed new sourcing channels in West Africa.' as string | null, action_items: [{ text: 'Reach out to 5 new recruitment agencies', assignee: 'emp-18', done: false, due_date: '2026-03-07' }, { text: 'Draft employer branding campaign brief', assignee: 'emp-18', done: false, due_date: '2026-03-14' }, { text: 'Review compensation bands for senior roles', assignee: 'emp-17', done: true, due_date: '2026-02-25' }], duration_minutes: 45, recurring: 'weekly' as const, location: 'HR Office' },
  { id: 'oo-5', org_id: 'org-1', manager_id: 'emp-9', employee_id: 'emp-11', scheduled_date: '2026-02-14T15:00:00Z', status: 'completed' as const, agenda: ['Reconciliation automation progress', 'Process documentation', 'Team collaboration'], notes: 'Emeka demoed the automation prototype. Some edge cases still need handling. Agreed on a phased rollout starting with Nigeria operations.' as string | null, action_items: [{ text: 'Document edge cases for reconciliation', assignee: 'emp-11', done: true, due_date: '2026-02-21' }, { text: 'Prepare phased rollout plan', assignee: 'emp-11', done: false, due_date: '2026-03-01' }], duration_minutes: 30, recurring: 'biweekly' as const, location: 'Operations Floor' },
  { id: 'oo-6', org_id: 'org-1', manager_id: 'emp-1', employee_id: 'emp-3', scheduled_date: '2026-02-26T13:00:00Z', status: 'upcoming' as const, agenda: ['Client satisfaction scores review', 'Cross-sell opportunities', 'Professional development goals'], notes: null as string | null, action_items: [] as Array<{text:string,assignee:string,done:boolean,due_date:string}>, duration_minutes: 30, recurring: 'biweekly' as const, location: 'Virtual - Teams' },
  { id: 'oo-7', org_id: 'org-1', manager_id: 'emp-17', employee_id: 'emp-19', scheduled_date: '2026-02-13T10:30:00Z', status: 'completed' as const, agenda: ['Leadership development program update', 'Budget allocation', 'Vendor selection for LMS'], notes: 'Moussa shared curriculum draft. Strong focus on coaching skills. Need to finalize vendor selection by end of month.' as string | null, action_items: [{ text: 'Finalize LMS vendor shortlist', assignee: 'emp-19', done: false, due_date: '2026-02-28' }, { text: 'Send curriculum draft to department heads for review', assignee: 'emp-19', done: true, due_date: '2026-02-17' }], duration_minutes: 45, recurring: 'weekly' as const, location: 'HR Office' },
]

// Recognitions (Kudos)
export const demoRecognitions = [
  { id: 'rec-1', org_id: 'org-1', from_id: 'emp-1', to_id: 'emp-2', value: 'Excellence' as const, message: 'Ngozi delivered exceptional results this quarter, exceeding branch revenue targets by 18%. Her leadership during the Lagos expansion was outstanding.', is_public: true, created_at: '2026-02-22T09:00:00Z', likes: 12 },
  { id: 'rec-2', org_id: 'org-1', from_id: 'emp-13', to_id: 'emp-14', value: 'Innovation' as const, message: 'Yaw designed an elegant solution for the payment gateway migration that reduced downtime risk by 90%. True engineering excellence.', is_public: true, created_at: '2026-02-20T14:30:00Z', likes: 8 },
  { id: 'rec-3', org_id: 'org-1', from_id: 'emp-5', to_id: 'emp-7', value: 'Teamwork' as const, message: 'Marie went above and beyond to support the corporate credit review, volunteering to cover additional portfolios when the team was short-staffed.', is_public: true, created_at: '2026-02-19T11:00:00Z', likes: 15 },
  { id: 'rec-4', org_id: 'org-1', from_id: 'emp-9', to_id: 'emp-12', value: 'Customer Focus' as const, message: 'Wanjiku resolved a critical logistics issue for our top client within hours, preventing a major service disruption. Outstanding client dedication.', is_public: true, created_at: '2026-02-18T16:00:00Z', likes: 6 },
  { id: 'rec-5', org_id: 'org-1', from_id: 'emp-17', to_id: 'emp-20', value: 'Integrity' as const, message: 'Ama identified and flagged a compliance gap in our HR processes before it became an issue. Her diligence protects the entire organization.', is_public: true, created_at: '2026-02-17T08:30:00Z', likes: 10 },
  { id: 'rec-6', org_id: 'org-1', from_id: 'emp-21', to_id: 'emp-23', value: 'Excellence' as const, message: 'Grace produced a comprehensive risk analysis report that was praised by the board. Her analytical skills are world-class.', is_public: true, created_at: '2026-02-15T13:00:00Z', likes: 9 },
  { id: 'rec-7', org_id: 'org-1', from_id: 'emp-27', to_id: 'emp-28', value: 'Innovation' as const, message: 'Peter launched our new digital marketing campaign that increased engagement by 45% in just two weeks. Creative and data-driven approach.', is_public: true, created_at: '2026-02-14T10:00:00Z', likes: 11 },
  { id: 'rec-8', org_id: 'org-1', from_id: 'emp-14', to_id: 'emp-15', value: 'Teamwork' as const, message: 'Brian stayed late multiple nights to ensure our CI/CD pipeline was stable before the release. His reliability is the backbone of our DevOps.', is_public: true, created_at: '2026-02-13T15:30:00Z', likes: 7 },
  { id: 'rec-9', org_id: 'org-1', from_id: 'emp-24', to_id: 'emp-26', value: 'Integrity' as const, message: 'Akosua caught a discrepancy in the quarterly financials that could have led to a misstatement. Her attention to detail is invaluable.', is_public: true, created_at: '2026-02-12T09:15:00Z', likes: 5 },
  { id: 'rec-10', org_id: 'org-1', from_id: 'emp-2', to_id: 'emp-4', value: 'Customer Focus' as const, message: 'Chioma received 5 client commendations this month alone. She makes every customer feel valued and heard.', is_public: true, created_at: '2026-02-11T11:45:00Z', likes: 14 },
  { id: 'rec-11', org_id: 'org-1', from_id: 'emp-6', to_id: 'emp-8', value: 'Teamwork' as const, message: 'James coordinated a complex cross-border deal between Kenya and Cote d\'Ivoire with exceptional professionalism. Seamless collaboration.', is_public: true, created_at: '2026-02-10T14:00:00Z', likes: 8 },
  { id: 'rec-12', org_id: 'org-1', from_id: 'emp-17', to_id: 'emp-22', value: 'Excellence' as const, message: 'Ousmane completed the UEMOA compliance audit preparation ahead of schedule, ensuring zero regulatory findings. Remarkable dedication.', is_public: true, created_at: '2026-02-09T08:00:00Z', likes: 13 },
]

// Competency Framework
export const demoCompetencyFramework = [
  { id: 'comp-tech', name: 'Technical Skills', description: 'Domain-specific expertise and technical proficiency', category: 'core' as const, levels: [{ level: 1, label: 'Foundational', description: 'Basic understanding, needs guidance' }, { level: 2, label: 'Developing', description: 'Can apply with some support' }, { level: 3, label: 'Proficient', description: 'Independently effective' }, { level: 4, label: 'Advanced', description: 'Expert, coaches others' }, { level: 5, label: 'Mastery', description: 'Industry-recognized authority' }] },
  { id: 'comp-lead', name: 'Leadership', description: 'Ability to inspire, guide, and develop teams', category: 'leadership' as const, levels: [{ level: 1, label: 'Foundational', description: 'Emerging self-awareness' }, { level: 2, label: 'Developing', description: 'Leads small tasks/projects' }, { level: 3, label: 'Proficient', description: 'Manages teams effectively' }, { level: 4, label: 'Advanced', description: 'Shapes culture and strategy' }, { level: 5, label: 'Mastery', description: 'Transformational leader' }] },
  { id: 'comp-comm', name: 'Communication', description: 'Written and verbal communication effectiveness', category: 'core' as const, levels: [{ level: 1, label: 'Foundational', description: 'Communicates basic information' }, { level: 2, label: 'Developing', description: 'Clear and structured communication' }, { level: 3, label: 'Proficient', description: 'Persuasive and articulate' }, { level: 4, label: 'Advanced', description: 'Executive presence' }, { level: 5, label: 'Mastery', description: 'Thought leader communicator' }] },
  { id: 'comp-prob', name: 'Problem Solving', description: 'Analytical thinking and creative solution development', category: 'core' as const, levels: [{ level: 1, label: 'Foundational', description: 'Follows established processes' }, { level: 2, label: 'Developing', description: 'Identifies issues proactively' }, { level: 3, label: 'Proficient', description: 'Solves complex problems independently' }, { level: 4, label: 'Advanced', description: 'Designs systemic solutions' }, { level: 5, label: 'Mastery', description: 'Anticipates and prevents problems' }] },
  { id: 'comp-collab', name: 'Collaboration', description: 'Working effectively across teams and cultures', category: 'core' as const, levels: [{ level: 1, label: 'Foundational', description: 'Works within immediate team' }, { level: 2, label: 'Developing', description: 'Collaborates cross-functionally' }, { level: 3, label: 'Proficient', description: 'Facilitates team alignment' }, { level: 4, label: 'Advanced', description: 'Builds organizational bridges' }, { level: 5, label: 'Mastery', description: 'Creates collaboration culture' }] },
  { id: 'comp-adapt', name: 'Adaptability', description: 'Flexibility and resilience in changing environments', category: 'core' as const, levels: [{ level: 1, label: 'Foundational', description: 'Accepts change when guided' }, { level: 2, label: 'Developing', description: 'Adapts with minimal resistance' }, { level: 3, label: 'Proficient', description: 'Thrives in ambiguity' }, { level: 4, label: 'Advanced', description: 'Drives change initiatives' }, { level: 5, label: 'Mastery', description: 'Transforms organizations' }] },
  { id: 'comp-strat', name: 'Strategic Thinking', description: 'Long-term vision and business acumen', category: 'leadership' as const, levels: [{ level: 1, label: 'Foundational', description: 'Understands team objectives' }, { level: 2, label: 'Developing', description: 'Connects work to business goals' }, { level: 3, label: 'Proficient', description: 'Develops departmental strategy' }, { level: 4, label: 'Advanced', description: 'Shapes organizational direction' }, { level: 5, label: 'Mastery', description: 'Visionary industry strategist' }] },
  { id: 'comp-cust', name: 'Customer Orientation', description: 'Focus on delivering value to internal and external customers', category: 'core' as const, levels: [{ level: 1, label: 'Foundational', description: 'Responds to customer needs' }, { level: 2, label: 'Developing', description: 'Anticipates customer needs' }, { level: 3, label: 'Proficient', description: 'Designs customer-centric solutions' }, { level: 4, label: 'Advanced', description: 'Champions customer success' }, { level: 5, label: 'Mastery', description: 'Transforms customer experience' }] },
]

// Competency Ratings per employee
export const demoCompetencyRatings = [
  { id: 'cr-1', employee_id: 'emp-1', competency_id: 'comp-tech', rating: 4, target: 4, assessed_date: '2026-02-01', assessor_id: 'emp-17' },
  { id: 'cr-2', employee_id: 'emp-1', competency_id: 'comp-lead', rating: 5, target: 5, assessed_date: '2026-02-01', assessor_id: 'emp-17' },
  { id: 'cr-3', employee_id: 'emp-1', competency_id: 'comp-comm', rating: 4, target: 5, assessed_date: '2026-02-01', assessor_id: 'emp-17' },
  { id: 'cr-4', employee_id: 'emp-1', competency_id: 'comp-strat', rating: 5, target: 5, assessed_date: '2026-02-01', assessor_id: 'emp-17' },
  { id: 'cr-5', employee_id: 'emp-2', competency_id: 'comp-tech', rating: 3, target: 4, assessed_date: '2026-02-01', assessor_id: 'emp-1' },
  { id: 'cr-6', employee_id: 'emp-2', competency_id: 'comp-lead', rating: 4, target: 4, assessed_date: '2026-02-01', assessor_id: 'emp-1' },
  { id: 'cr-7', employee_id: 'emp-2', competency_id: 'comp-comm', rating: 4, target: 4, assessed_date: '2026-02-01', assessor_id: 'emp-1' },
  { id: 'cr-8', employee_id: 'emp-2', competency_id: 'comp-cust', rating: 5, target: 4, assessed_date: '2026-02-01', assessor_id: 'emp-1' },
  { id: 'cr-9', employee_id: 'emp-6', competency_id: 'comp-tech', rating: 5, target: 4, assessed_date: '2026-02-01', assessor_id: 'emp-5' },
  { id: 'cr-10', employee_id: 'emp-6', competency_id: 'comp-prob', rating: 5, target: 4, assessed_date: '2026-02-01', assessor_id: 'emp-5' },
  { id: 'cr-11', employee_id: 'emp-6', competency_id: 'comp-comm', rating: 3, target: 4, assessed_date: '2026-02-01', assessor_id: 'emp-5' },
  { id: 'cr-12', employee_id: 'emp-6', competency_id: 'comp-collab', rating: 4, target: 4, assessed_date: '2026-02-01', assessor_id: 'emp-5' },
  { id: 'cr-13', employee_id: 'emp-14', competency_id: 'comp-tech', rating: 5, target: 5, assessed_date: '2026-02-01', assessor_id: 'emp-13' },
  { id: 'cr-14', employee_id: 'emp-14', competency_id: 'comp-prob', rating: 4, target: 4, assessed_date: '2026-02-01', assessor_id: 'emp-13' },
  { id: 'cr-15', employee_id: 'emp-14', competency_id: 'comp-collab', rating: 3, target: 4, assessed_date: '2026-02-01', assessor_id: 'emp-13' },
  { id: 'cr-16', employee_id: 'emp-14', competency_id: 'comp-adapt', rating: 4, target: 4, assessed_date: '2026-02-01', assessor_id: 'emp-13' },
  { id: 'cr-17', employee_id: 'emp-18', competency_id: 'comp-comm', rating: 5, target: 4, assessed_date: '2026-02-01', assessor_id: 'emp-17' },
  { id: 'cr-18', employee_id: 'emp-18', competency_id: 'comp-lead', rating: 3, target: 4, assessed_date: '2026-02-01', assessor_id: 'emp-17' },
  { id: 'cr-19', employee_id: 'emp-18', competency_id: 'comp-cust', rating: 4, target: 4, assessed_date: '2026-02-01', assessor_id: 'emp-17' },
  { id: 'cr-20', employee_id: 'emp-18', competency_id: 'comp-strat', rating: 2, target: 3, assessed_date: '2026-02-01', assessor_id: 'emp-17' },
  { id: 'cr-21', employee_id: 'emp-11', competency_id: 'comp-tech', rating: 3, target: 3, assessed_date: '2026-02-01', assessor_id: 'emp-9' },
  { id: 'cr-22', employee_id: 'emp-11', competency_id: 'comp-prob', rating: 4, target: 3, assessed_date: '2026-02-01', assessor_id: 'emp-9' },
  { id: 'cr-23', employee_id: 'emp-11', competency_id: 'comp-adapt', rating: 3, target: 3, assessed_date: '2026-02-01', assessor_id: 'emp-9' },
  { id: 'cr-24', employee_id: 'emp-11', competency_id: 'comp-collab', rating: 2, target: 3, assessed_date: '2026-02-01', assessor_id: 'emp-9' },
  { id: 'cr-25', employee_id: 'emp-3', competency_id: 'comp-cust', rating: 5, target: 4, assessed_date: '2026-02-01', assessor_id: 'emp-1' },
  { id: 'cr-26', employee_id: 'emp-3', competency_id: 'comp-comm', rating: 4, target: 3, assessed_date: '2026-02-01', assessor_id: 'emp-1' },
  { id: 'cr-27', employee_id: 'emp-3', competency_id: 'comp-collab', rating: 4, target: 3, assessed_date: '2026-02-01', assessor_id: 'emp-1' },
  { id: 'cr-28', employee_id: 'emp-3', competency_id: 'comp-tech', rating: 2, target: 3, assessed_date: '2026-02-01', assessor_id: 'emp-1' },
  { id: 'cr-29', employee_id: 'emp-22', competency_id: 'comp-tech', rating: 4, target: 4, assessed_date: '2026-02-01', assessor_id: 'emp-21' },
  { id: 'cr-30', employee_id: 'emp-22', competency_id: 'comp-lead', rating: 3, target: 4, assessed_date: '2026-02-01', assessor_id: 'emp-21' },
  { id: 'cr-31', employee_id: 'emp-22', competency_id: 'comp-comm', rating: 4, target: 4, assessed_date: '2026-02-01', assessor_id: 'emp-21' },
  { id: 'cr-32', employee_id: 'emp-22', competency_id: 'comp-prob', rating: 3, target: 4, assessed_date: '2026-02-01', assessor_id: 'emp-21' },
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

// Equity Grants
export const demoEquityGrants = [
  { id: 'eq-1', org_id: 'org-1', employee_id: 'emp-17', grant_type: 'RSU' as const, shares: 5000, strike_price: 0, vesting_schedule: '4-year with 1-year cliff', vested_shares: 1250, current_value: 125000, grant_date: '2024-03-01', status: 'active' as const },
  { id: 'eq-2', org_id: 'org-1', employee_id: 'emp-1', grant_type: 'RSU' as const, shares: 3000, strike_price: 0, vesting_schedule: '4-year with 1-year cliff', vested_shares: 750, current_value: 75000, grant_date: '2024-06-01', status: 'active' as const },
  { id: 'eq-3', org_id: 'org-1', employee_id: 'emp-14', grant_type: 'stock_option' as const, shares: 8000, strike_price: 18.50, vesting_schedule: '4-year monthly', vested_shares: 3333, current_value: 48330, grant_date: '2023-09-01', status: 'active' as const },
  { id: 'eq-4', org_id: 'org-1', employee_id: 'emp-5', grant_type: 'phantom' as const, shares: 2000, strike_price: 0, vesting_schedule: '3-year annual', vested_shares: 1333, current_value: 33325, grant_date: '2024-01-01', status: 'active' as const },
  { id: 'eq-5', org_id: 'org-1', employee_id: 'emp-13', grant_type: 'RSU' as const, shares: 4000, strike_price: 0, vesting_schedule: '4-year with 1-year cliff', vested_shares: 2000, current_value: 50000, grant_date: '2023-06-01', status: 'active' as const },
  { id: 'eq-6', org_id: 'org-1', employee_id: 'emp-9', grant_type: 'stock_option' as const, shares: 5000, strike_price: 15.00, vesting_schedule: '4-year monthly', vested_shares: 5000, current_value: 50000, grant_date: '2022-01-01', status: 'fully_vested' as const },
]

// Comp Planning Cycles
export const demoCompPlanningCycles = [
  { id: 'cpc-1', org_id: 'org-1', name: '2026 Annual Compensation Review', status: 'active' as const, budget_percent: 4.5, employees_reviewed: 22, total_employees: 30, avg_increase: 6.2, total_budget: 450000, start_date: '2026-01-15', end_date: '2026-03-31', created_at: '2026-01-10T00:00:00Z' },
  { id: 'cpc-2', org_id: 'org-1', name: '2025 Mid-Year Equity Refresh', status: 'completed' as const, budget_percent: 2.0, employees_reviewed: 12, total_employees: 30, avg_increase: 3.8, total_budget: 180000, start_date: '2025-07-01', end_date: '2025-08-31', created_at: '2025-06-20T00:00:00Z' },
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

// Engagement Action Plans
export const demoActionPlans = [
  { id: 'ap-1', org_id: 'org-1', title: 'Launch manager effectiveness training', owner: 'Amara Kone', priority: 'high' as const, status: 'in_progress' as const, due_date: '2026-03-31', category: 'Leadership', department_id: 'dept-3', created_at: '2026-02-01T00:00:00Z' },
  { id: 'ap-2', org_id: 'org-1', title: 'Revamp career progression framework', owner: 'Folake Adebayo', priority: 'high' as const, status: 'planned' as const, due_date: '2026-04-30', category: 'Growth', department_id: 'dept-1', created_at: '2026-02-05T00:00:00Z' },
  { id: 'ap-3', org_id: 'org-1', title: 'Introduce flexible work policy pilot', owner: 'Kofi Mensah', priority: 'medium' as const, status: 'in_progress' as const, due_date: '2026-03-15', category: 'Work-Life', department_id: 'dept-3', created_at: '2026-01-20T00:00:00Z' },
  { id: 'ap-4', org_id: 'org-1', title: 'Compensation benchmarking review', owner: 'Ifeanyi Agu', priority: 'high' as const, status: 'completed' as const, due_date: '2026-02-15', category: 'Compensation', department_id: 'dept-2', created_at: '2026-01-10T00:00:00Z' },
  { id: 'ap-5', org_id: 'org-1', title: 'Team wellness workshops series', owner: 'Fatou Ndiaye', priority: 'medium' as const, status: 'planned' as const, due_date: '2026-05-31', category: 'Wellbeing', department_id: 'dept-5', created_at: '2026-02-10T00:00:00Z' },
  { id: 'ap-6', org_id: 'org-1', title: 'Cross-functional collaboration events', owner: 'Nneka Uzoma', priority: 'low' as const, status: 'in_progress' as const, due_date: '2026-04-15', category: 'Culture', department_id: 'dept-4', created_at: '2026-02-08T00:00:00Z' },
]

// Survey Responses (aggregated per survey per department)
export const demoSurveyResponses = [
  { id: 'sr-1', survey_id: 'survey-1', department_id: 'dept-1', respondents: 22, total_employees: 25, leadership_score: 68, culture_score: 74, growth_score: 65, wellbeing_score: 71, compensation_score: 58, worklife_score: 72 },
  { id: 'sr-2', survey_id: 'survey-1', department_id: 'dept-2', respondents: 18, total_employees: 20, leadership_score: 78, culture_score: 82, growth_score: 75, wellbeing_score: 80, compensation_score: 70, worklife_score: 77 },
  { id: 'sr-3', survey_id: 'survey-1', department_id: 'dept-3', respondents: 14, total_employees: 18, leadership_score: 62, culture_score: 66, growth_score: 60, wellbeing_score: 64, compensation_score: 55, worklife_score: 68 },
  { id: 'sr-4', survey_id: 'survey-1', department_id: 'dept-4', respondents: 16, total_employees: 17, leadership_score: 85, culture_score: 88, growth_score: 80, wellbeing_score: 82, compensation_score: 75, worklife_score: 84 },
  { id: 'sr-5', survey_id: 'survey-1', department_id: 'dept-5', respondents: 19, total_employees: 22, leadership_score: 72, culture_score: 76, growth_score: 70, wellbeing_score: 74, compensation_score: 64, worklife_score: 75 },
  { id: 'sr-6', survey_id: 'survey-3', department_id: 'dept-1', respondents: 20, total_employees: 25, leadership_score: 65, culture_score: 70, growth_score: 62, wellbeing_score: 68, compensation_score: 55, worklife_score: 69 },
  { id: 'sr-7', survey_id: 'survey-3', department_id: 'dept-2', respondents: 17, total_employees: 20, leadership_score: 74, culture_score: 78, growth_score: 72, wellbeing_score: 76, compensation_score: 66, worklife_score: 73 },
  { id: 'sr-8', survey_id: 'survey-3', department_id: 'dept-3', respondents: 12, total_employees: 18, leadership_score: 58, culture_score: 62, growth_score: 56, wellbeing_score: 60, compensation_score: 50, worklife_score: 64 },
  { id: 'sr-9', survey_id: 'survey-3', department_id: 'dept-4', respondents: 15, total_employees: 17, leadership_score: 82, culture_score: 85, growth_score: 78, wellbeing_score: 80, compensation_score: 72, worklife_score: 81 },
  { id: 'sr-10', survey_id: 'survey-3', department_id: 'dept-5', respondents: 18, total_employees: 22, leadership_score: 68, culture_score: 72, growth_score: 66, wellbeing_score: 70, compensation_score: 60, worklife_score: 71 },
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

export const demoMentoringSessions = [
  { id: 'ms-1', org_id: 'org-1', pair_id: 'pair-1', date: '2026-01-25', duration_minutes: 45, type: 'video' as const, topic: 'Career roadmap and Q1 goals', rating: 5, status: 'completed' as const, notes: 'Great first session, set 3 clear goals.' },
  { id: 'ms-2', org_id: 'org-1', pair_id: 'pair-1', date: '2026-02-08', duration_minutes: 30, type: 'video' as const, topic: 'Leadership communication skills', rating: 4, status: 'completed' as const, notes: 'Discussed stakeholder management.' },
  { id: 'ms-3', org_id: 'org-1', pair_id: 'pair-1', date: '2026-02-22', duration_minutes: 60, type: 'in_person' as const, topic: 'Cross-functional project review', rating: 5, status: 'completed' as const, notes: 'In-depth project review with feedback.' },
  { id: 'ms-4', org_id: 'org-1', pair_id: 'pair-2', date: '2026-01-27', duration_minutes: 30, type: 'video' as const, topic: 'Technical mentorship kickoff', rating: 4, status: 'completed' as const, notes: 'Aligned on skills assessment.' },
  { id: 'ms-5', org_id: 'org-1', pair_id: 'pair-2', date: '2026-02-10', duration_minutes: 45, type: 'phone' as const, topic: 'System architecture deep dive', rating: 5, status: 'completed' as const, notes: 'Reviewed architecture patterns.' },
  { id: 'ms-6', org_id: 'org-1', pair_id: 'pair-3', date: '2026-02-01', duration_minutes: 30, type: 'video' as const, topic: 'HR strategy and talent pipeline', rating: 4, status: 'completed' as const, notes: 'Discussed talent acquisition.' },
  { id: 'ms-7', org_id: 'org-1', pair_id: 'pair-3', date: '2026-02-15', duration_minutes: 45, type: 'in_person' as const, topic: 'Employee engagement frameworks', rating: 5, status: 'completed' as const, notes: 'Explored new engagement models.' },
  { id: 'ms-8', org_id: 'org-1', pair_id: 'pair-4', date: '2026-02-10', duration_minutes: 30, type: 'video' as const, topic: 'Digital transformation tools', rating: 3, status: 'completed' as const, notes: 'Covered basic digital tools overview.' },
  { id: 'ms-9', org_id: 'org-1', pair_id: 'pair-5', date: '2026-02-12', duration_minutes: 45, type: 'video' as const, topic: 'Cloud infrastructure and DevOps', rating: 4, status: 'completed' as const, notes: 'Cloud migration best practices.' },
  { id: 'ms-10', org_id: 'org-1', pair_id: 'pair-1', date: '2026-03-08', duration_minutes: 45, type: 'video' as const, topic: 'Mid-quarter progress review', rating: 0, status: 'scheduled' as const, notes: '' },
]

export const demoMentoringGoals = [
  { id: 'mg-1', org_id: 'org-1', pair_id: 'pair-1', title: 'Complete leadership certification', target_date: '2026-06-30', status: 'in_progress' as const, progress: 40 },
  { id: 'mg-2', org_id: 'org-1', pair_id: 'pair-1', title: 'Lead a cross-functional project', target_date: '2026-04-30', status: 'in_progress' as const, progress: 60 },
  { id: 'mg-3', org_id: 'org-1', pair_id: 'pair-1', title: 'Present at all-hands meeting', target_date: '2026-03-31', status: 'completed' as const, progress: 100 },
  { id: 'mg-4', org_id: 'org-1', pair_id: 'pair-2', title: 'Master microservices architecture', target_date: '2026-05-31', status: 'in_progress' as const, progress: 35 },
  { id: 'mg-5', org_id: 'org-1', pair_id: 'pair-2', title: 'Obtain AWS Solutions Architect cert', target_date: '2026-07-15', status: 'not_started' as const, progress: 0 },
  { id: 'mg-6', org_id: 'org-1', pair_id: 'pair-3', title: 'Design new onboarding program', target_date: '2026-04-15', status: 'in_progress' as const, progress: 70 },
  { id: 'mg-7', org_id: 'org-1', pair_id: 'pair-3', title: 'Reduce time-to-productivity by 20%', target_date: '2026-06-30', status: 'in_progress' as const, progress: 25 },
  { id: 'mg-8', org_id: 'org-1', pair_id: 'pair-4', title: 'Build digital skills assessment framework', target_date: '2026-05-01', status: 'in_progress' as const, progress: 50 },
  { id: 'mg-9', org_id: 'org-1', pair_id: 'pair-5', title: 'Complete cloud migration training', target_date: '2026-04-30', status: 'in_progress' as const, progress: 45 },
  { id: 'mg-10', org_id: 'org-1', pair_id: 'pair-5', title: 'Implement CI/CD pipeline for team', target_date: '2026-06-15', status: 'not_started' as const, progress: 0 },
]

// Payroll
export const demoPayrollRuns = [
  { id: 'pr-1', org_id: 'org-1', period: 'January 2026', status: 'paid' as const, total_gross: 2450000, total_net: 1890000, total_deductions: 560000, currency: 'USD', employee_count: 30, run_date: '2026-01-28T00:00:00Z', created_at: '2026-01-25T00:00:00Z' },
  { id: 'pr-2', org_id: 'org-1', period: 'February 2026', status: 'approved' as const, total_gross: 2480000, total_net: 1910000, total_deductions: 570000, currency: 'USD', employee_count: 30, run_date: '2026-02-25T00:00:00Z', created_at: '2026-02-22T00:00:00Z' },
]

// Employee Payroll Entries (individual pay stubs for January 2026 run)
export const demoEmployeePayrollEntries = [
  { id: 'epe-1', org_id: 'org-1', payroll_run_id: 'pr-1', employee_id: 'emp-1', employee_name: 'Oluwaseun Adeyemi', department: 'Retail Banking', country: 'Nigeria', gross_pay: 14167, federal_tax: 2125, state_tax: 708, social_security: 878, medicare: 205, pension: 708, health_insurance: 500, bonus: 0, overtime: 0, other_deductions: 0, total_deductions: 5124, net_pay: 9043, currency: 'USD', pay_date: '2026-01-28' },
  { id: 'epe-2', org_id: 'org-1', payroll_run_id: 'pr-1', employee_id: 'emp-2', employee_name: 'Ngozi Okafor', department: 'Retail Banking', country: 'Nigeria', gross_pay: 10000, federal_tax: 1500, state_tax: 500, social_security: 620, medicare: 145, pension: 500, health_insurance: 500, bonus: 0, overtime: 0, other_deductions: 0, total_deductions: 3765, net_pay: 6235, currency: 'USD', pay_date: '2026-01-28' },
  { id: 'epe-3', org_id: 'org-1', payroll_run_id: 'pr-1', employee_id: 'emp-3', employee_name: 'Kwame Asante', department: 'Retail Banking', country: 'Ghana', gross_pay: 6667, federal_tax: 1000, state_tax: 333, social_security: 413, medicare: 97, pension: 333, health_insurance: 500, bonus: 0, overtime: 0, other_deductions: 0, total_deductions: 2676, net_pay: 3991, currency: 'USD', pay_date: '2026-01-28' },
  { id: 'epe-4', org_id: 'org-1', payroll_run_id: 'pr-1', employee_id: 'emp-5', employee_name: 'Amadou Diallo', department: 'Corporate Banking', country: "Cote d'Ivoire", gross_pay: 15000, federal_tax: 2250, state_tax: 750, social_security: 930, medicare: 218, pension: 750, health_insurance: 500, bonus: 0, overtime: 0, other_deductions: 0, total_deductions: 5398, net_pay: 9602, currency: 'USD', pay_date: '2026-01-28' },
  { id: 'epe-5', org_id: 'org-1', payroll_run_id: 'pr-1', employee_id: 'emp-6', employee_name: 'Fatou Ndiaye', department: 'Corporate Banking', country: 'Senegal', gross_pay: 5417, federal_tax: 813, state_tax: 271, social_security: 336, medicare: 79, pension: 271, health_insurance: 500, bonus: 0, overtime: 0, other_deductions: 0, total_deductions: 2270, net_pay: 3147, currency: 'USD', pay_date: '2026-01-28' },
  { id: 'epe-6', org_id: 'org-1', payroll_run_id: 'pr-1', employee_id: 'emp-9', employee_name: 'Kofi Mensah', department: 'Operations', country: 'Ghana', gross_pay: 13333, federal_tax: 2000, state_tax: 667, social_security: 827, medicare: 193, pension: 667, health_insurance: 500, bonus: 0, overtime: 0, other_deductions: 0, total_deductions: 4854, net_pay: 8479, currency: 'USD', pay_date: '2026-01-28' },
  { id: 'epe-7', org_id: 'org-1', payroll_run_id: 'pr-1', employee_id: 'emp-13', employee_name: 'Babajide Ogunleye', department: 'Technology', country: 'Nigeria', gross_pay: 16667, federal_tax: 2500, state_tax: 833, social_security: 1033, medicare: 242, pension: 833, health_insurance: 500, bonus: 0, overtime: 0, other_deductions: 0, total_deductions: 5941, net_pay: 10726, currency: 'USD', pay_date: '2026-01-28' },
  { id: 'epe-8', org_id: 'org-1', payroll_run_id: 'pr-1', employee_id: 'emp-14', employee_name: 'Yaw Frimpong', department: 'Technology', country: 'Ghana', gross_pay: 5833, federal_tax: 875, state_tax: 292, social_security: 362, medicare: 85, pension: 292, health_insurance: 500, bonus: 0, overtime: 0, other_deductions: 0, total_deductions: 2406, net_pay: 3427, currency: 'USD', pay_date: '2026-01-28' },
  { id: 'epe-9', org_id: 'org-1', payroll_run_id: 'pr-1', employee_id: 'emp-17', employee_name: 'Amara Kone', department: 'Human Resources', country: "Cote d'Ivoire", gross_pay: 15833, federal_tax: 2375, state_tax: 792, social_security: 982, medicare: 230, pension: 792, health_insurance: 500, bonus: 0, overtime: 0, other_deductions: 0, total_deductions: 5671, net_pay: 10162, currency: 'USD', pay_date: '2026-01-28' },
  { id: 'epe-10', org_id: 'org-1', payroll_run_id: 'pr-1', employee_id: 'emp-18', employee_name: 'Folake Adebayo', department: 'Human Resources', country: 'Nigeria', gross_pay: 7083, federal_tax: 1062, state_tax: 354, social_security: 439, medicare: 103, pension: 354, health_insurance: 500, bonus: 0, overtime: 0, other_deductions: 0, total_deductions: 2812, net_pay: 4271, currency: 'USD', pay_date: '2026-01-28' },
  { id: 'epe-11', org_id: 'org-1', payroll_run_id: 'pr-1', employee_id: 'emp-21', employee_name: 'Chukwuma Obi', department: 'Risk & Compliance', country: 'Nigeria', gross_pay: 16250, federal_tax: 2438, state_tax: 813, social_security: 1008, medicare: 236, pension: 813, health_insurance: 500, bonus: 0, overtime: 0, other_deductions: 0, total_deductions: 5808, net_pay: 10442, currency: 'USD', pay_date: '2026-01-28' },
  { id: 'epe-12', org_id: 'org-1', payroll_run_id: 'pr-1', employee_id: 'emp-24', employee_name: 'Ifeanyi Agu', department: 'Finance', country: 'Nigeria', gross_pay: 16667, federal_tax: 2500, state_tax: 833, social_security: 1033, medicare: 242, pension: 833, health_insurance: 500, bonus: 0, overtime: 0, other_deductions: 0, total_deductions: 5941, net_pay: 10726, currency: 'USD', pay_date: '2026-01-28' },
  { id: 'epe-13', org_id: 'org-1', payroll_run_id: 'pr-1', employee_id: 'emp-25', employee_name: 'Seydou Traore', department: 'Finance', country: "Cote d'Ivoire", gross_pay: 9583, federal_tax: 1437, state_tax: 479, social_security: 594, medicare: 139, pension: 479, health_insurance: 500, bonus: 0, overtime: 0, other_deductions: 0, total_deductions: 3628, net_pay: 5955, currency: 'USD', pay_date: '2026-01-28' },
  { id: 'epe-14', org_id: 'org-1', payroll_run_id: 'pr-1', employee_id: 'emp-27', employee_name: 'Nneka Uzoma', department: 'Marketing', country: 'Nigeria', gross_pay: 15417, federal_tax: 2313, state_tax: 771, social_security: 956, medicare: 224, pension: 771, health_insurance: 500, bonus: 0, overtime: 0, other_deductions: 0, total_deductions: 5535, net_pay: 9882, currency: 'USD', pay_date: '2026-01-28' },
  { id: 'epe-15', org_id: 'org-1', payroll_run_id: 'pr-1', employee_id: 'emp-28', employee_name: 'Peter Njoroge', department: 'Marketing', country: 'Kenya', gross_pay: 5417, federal_tax: 813, state_tax: 271, social_security: 336, medicare: 79, pension: 271, health_insurance: 500, bonus: 0, overtime: 0, other_deductions: 0, total_deductions: 2270, net_pay: 3147, currency: 'USD', pay_date: '2026-01-28' },
]

// Contractor Payments
export const demoContractorPayments = [
  { id: 'cp-1', org_id: 'org-1', contractor_name: 'Adebola Consulting', company: 'Adebola & Associates', service_type: 'IT Security Audit', invoice_number: 'INV-2026-001', amount: 45000, currency: 'USD', status: 'paid' as const, due_date: '2026-01-15', paid_date: '2026-01-14', payment_method: 'bank_transfer' as const, tax_form: 'invoice' as const, country: 'Nigeria' },
  { id: 'cp-2', org_id: 'org-1', contractor_name: 'GreenTech Solutions', company: 'GreenTech Ltd', service_type: 'Cloud Infrastructure', invoice_number: 'INV-2026-002', amount: 28000, currency: 'USD', status: 'paid' as const, due_date: '2026-01-20', paid_date: '2026-01-19', payment_method: 'wire_transfer' as const, tax_form: 'W-8BEN' as const, country: 'Ghana' },
  { id: 'cp-3', org_id: 'org-1', contractor_name: 'Mwangi Legal Services', company: 'Mwangi & Partners LLP', service_type: 'Regulatory Compliance Review', invoice_number: 'INV-2026-003', amount: 35000, currency: 'USD', status: 'approved' as const, due_date: '2026-02-15', paid_date: null, payment_method: 'bank_transfer' as const, tax_form: 'invoice' as const, country: 'Kenya' },
  { id: 'cp-4', org_id: 'org-1', contractor_name: 'Diop Training Academy', company: 'Diop Academy SARL', service_type: 'Leadership Training Program', invoice_number: 'INV-2026-004', amount: 18000, currency: 'USD', status: 'pending' as const, due_date: '2026-02-28', paid_date: null, payment_method: 'wire_transfer' as const, tax_form: 'invoice' as const, country: 'Senegal' },
  { id: 'cp-5', org_id: 'org-1', contractor_name: 'Kone Digital Agency', company: 'Kone Digital CI', service_type: 'Brand Refresh & Digital Campaign', invoice_number: 'INV-2026-005', amount: 52000, currency: 'USD', status: 'approved' as const, due_date: '2026-02-20', paid_date: null, payment_method: 'bank_transfer' as const, tax_form: 'invoice' as const, country: "Cote d'Ivoire" },
]

// Payroll Schedules
export const demoPayrollSchedules = [
  { id: 'ps-1', org_id: 'org-1', name: 'Monthly Salary - All Staff', frequency: 'monthly' as const, next_run_date: '2026-03-25', employee_group: 'All Employees', auto_approve: false, currency: 'USD', status: 'active' as const, last_run_date: '2026-02-25', created_at: '2025-01-15T00:00:00Z' },
  { id: 'ps-2', org_id: 'org-1', name: 'Bi-Weekly - Operations Team', frequency: 'biweekly' as const, next_run_date: '2026-03-07', employee_group: 'Operations', auto_approve: true, currency: 'USD', status: 'active' as const, last_run_date: '2026-02-21', created_at: '2025-06-01T00:00:00Z' },
  { id: 'ps-3', org_id: 'org-1', name: 'Quarterly Bonus Run', frequency: 'monthly' as const, next_run_date: '2026-03-31', employee_group: 'Directors & Executives', auto_approve: false, currency: 'USD', status: 'paused' as const, last_run_date: '2025-12-31', created_at: '2025-01-15T00:00:00Z' },
]

// Tax Configurations
export const demoTaxConfigs = [
  { id: 'tc-1', org_id: 'org-1', country: 'Nigeria', tax_type: 'PAYE + NHF + Pension', rate: 24, description: 'Pay-As-You-Earn with National Housing Fund and Pension contributions', employer_contribution: 10, employee_contribution: 8, effective_date: '2025-01-01', status: 'active' as const },
  { id: 'tc-2', org_id: 'org-1', country: 'Ghana', tax_type: 'PAYE + SSNIT + Tier 2', rate: 25, description: 'Progressive income tax with Social Security and Tier 2 pension', employer_contribution: 13, employee_contribution: 5.5, effective_date: '2025-01-01', status: 'active' as const },
  { id: 'tc-3', org_id: 'org-1', country: "Cote d'Ivoire", tax_type: 'IRPP + CNPS', rate: 22, description: 'Income tax with national social security fund contributions', employer_contribution: 15.75, employee_contribution: 6.3, effective_date: '2025-01-01', status: 'active' as const },
  { id: 'tc-4', org_id: 'org-1', country: 'Kenya', tax_type: 'PAYE + NSSF + NHIF', rate: 30, description: 'Pay-As-You-Earn with social security and health insurance', employer_contribution: 6, employee_contribution: 6, effective_date: '2025-01-01', status: 'active' as const },
  { id: 'tc-5', org_id: 'org-1', country: 'Senegal', tax_type: 'IR + CSS', rate: 20, description: 'Income tax with social security contributions', employer_contribution: 18.5, employee_contribution: 5.6, effective_date: '2025-01-01', status: 'active' as const },
]

// Compliance Issues
export const demoComplianceIssues = [
  { id: 'ci-1', org_id: 'org-1', type: 'minimum_wage' as const, severity: 'warning' as const, country: 'Ghana', description: 'Two associate-level employees in Accra branch are within 5% of the minimum wage threshold following recent regulatory update', affected_employees: 2, deadline: '2026-03-31', status: 'open' as const, created_at: '2026-02-15T00:00:00Z' },
  { id: 'ci-2', org_id: 'org-1', type: 'pension' as const, severity: 'critical' as const, country: 'Nigeria', description: 'Pension Fund Administrator reporting deadline for Q4 2025 contributions approaching — documentation pending for 3 employees', affected_employees: 3, deadline: '2026-03-15', status: 'open' as const, created_at: '2026-02-10T00:00:00Z' },
  { id: 'ci-3', org_id: 'org-1', type: 'tax_filing' as const, severity: 'info' as const, country: 'Kenya', description: 'Annual PAYE reconciliation (P10) due for 2025 tax year — all data prepared and ready for submission', affected_employees: 0, deadline: '2026-04-30', status: 'in_review' as const, created_at: '2026-02-01T00:00:00Z' },
  { id: 'ci-4', org_id: 'org-1', type: 'benefits' as const, severity: 'warning' as const, country: "Cote d'Ivoire", description: 'CNPS contribution rate increase effective April 2026 — payroll templates need updating to reflect new employer contribution of 16.5%', affected_employees: 0, deadline: '2026-04-01', status: 'open' as const, created_at: '2026-02-20T00:00:00Z' },
]

// Tax Filings
export const demoTaxFilings = [
  { id: 'tf-1', org_id: 'org-1', country: 'Nigeria', form_name: 'Annual PAYE Returns', description: 'Annual reconciliation of PAYE deductions with Federal Inland Revenue Service', deadline: '2026-03-31', frequency: 'annual' as const, status: 'upcoming' as const, filed_date: null, filing_period: '2025' },
  { id: 'tf-2', org_id: 'org-1', country: 'Nigeria', form_name: 'Monthly PAYE Remittance', description: 'Monthly remittance of employee tax deductions', deadline: '2026-03-10', frequency: 'monthly' as const, status: 'upcoming' as const, filed_date: null, filing_period: 'February 2026' },
  { id: 'tf-3', org_id: 'org-1', country: 'Ghana', form_name: 'Monthly PAYE Filing', description: 'Monthly submission of PAYE deductions to Ghana Revenue Authority', deadline: '2026-03-15', frequency: 'monthly' as const, status: 'upcoming' as const, filed_date: null, filing_period: 'February 2026' },
  { id: 'tf-4', org_id: 'org-1', country: 'Kenya', form_name: 'P10 Annual Return', description: 'Annual PAYE tax reconciliation with Kenya Revenue Authority', deadline: '2026-04-30', frequency: 'annual' as const, status: 'upcoming' as const, filed_date: null, filing_period: '2025' },
  { id: 'tf-5', org_id: 'org-1', country: "Cote d'Ivoire", form_name: 'DISA Annual Filing', description: 'Annual declaration of salaries to tax authorities', deadline: '2026-04-30', frequency: 'annual' as const, status: 'upcoming' as const, filed_date: null, filing_period: '2025' },
  { id: 'tf-6', org_id: 'org-1', country: 'Nigeria', form_name: 'Pension Fund Filing', description: 'Quarterly pension contribution remittance to PFA', deadline: '2026-01-31', frequency: 'quarterly' as const, status: 'filed' as const, filed_date: '2026-01-28', filing_period: 'Q4 2025' },
  { id: 'tf-7', org_id: 'org-1', country: 'Senegal', form_name: 'CSS Quarterly Return', description: 'Quarterly social security contribution filing', deadline: '2026-01-15', frequency: 'quarterly' as const, status: 'overdue' as const, filed_date: null, filing_period: 'Q4 2025' },
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


// Benefit Enrollments
export const demoBenefitEnrollments = [
  { id: 'benr-1', org_id: 'org-1', employee_id: 'emp-1', plan_id: 'bp-1', coverage_level: 'family' as const, status: 'active' as const, enrolled_date: '2025-01-15', effective_date: '2025-02-01', created_at: '2025-01-15T00:00:00Z' },
  { id: 'benr-2', org_id: 'org-1', employee_id: 'emp-1', plan_id: 'bp-2', coverage_level: 'employee_only' as const, status: 'active' as const, enrolled_date: '2025-01-15', effective_date: '2025-02-01', created_at: '2025-01-15T00:00:00Z' },
  { id: 'benr-3', org_id: 'org-1', employee_id: 'emp-1', plan_id: 'bp-3', coverage_level: 'employee_only' as const, status: 'active' as const, enrolled_date: '2025-01-15', effective_date: '2025-02-01', created_at: '2025-01-15T00:00:00Z' },
  { id: 'benr-4', org_id: 'org-1', employee_id: 'emp-5', plan_id: 'bp-1', coverage_level: 'employee_spouse' as const, status: 'active' as const, enrolled_date: '2025-01-20', effective_date: '2025-02-01', created_at: '2025-01-20T00:00:00Z' },
  { id: 'benr-5', org_id: 'org-1', employee_id: 'emp-5', plan_id: 'bp-4', coverage_level: 'family' as const, status: 'active' as const, enrolled_date: '2025-01-20', effective_date: '2025-02-01', created_at: '2025-01-20T00:00:00Z' },
  { id: 'benr-6', org_id: 'org-1', employee_id: 'emp-10', plan_id: 'bp-1', coverage_level: 'employee_only' as const, status: 'active' as const, enrolled_date: '2025-02-01', effective_date: '2025-03-01', created_at: '2025-02-01T00:00:00Z' },
  { id: 'benr-7', org_id: 'org-1', employee_id: 'emp-10', plan_id: 'bp-3', coverage_level: 'employee_only' as const, status: 'active' as const, enrolled_date: '2025-02-01', effective_date: '2025-03-01', created_at: '2025-02-01T00:00:00Z' },
  { id: 'benr-8', org_id: 'org-1', employee_id: 'emp-13', plan_id: 'bp-1', coverage_level: 'family' as const, status: 'active' as const, enrolled_date: '2025-01-10', effective_date: '2025-02-01', created_at: '2025-01-10T00:00:00Z' },
  { id: 'benr-9', org_id: 'org-1', employee_id: 'emp-13', plan_id: 'bp-2', coverage_level: 'family' as const, status: 'active' as const, enrolled_date: '2025-01-10', effective_date: '2025-02-01', created_at: '2025-01-10T00:00:00Z' },
  { id: 'benr-10', org_id: 'org-1', employee_id: 'emp-13', plan_id: 'bp-3', coverage_level: 'employee_only' as const, status: 'active' as const, enrolled_date: '2025-01-10', effective_date: '2025-02-01', created_at: '2025-01-10T00:00:00Z' },
  { id: 'benr-11', org_id: 'org-1', employee_id: 'emp-13', plan_id: 'bp-4', coverage_level: 'family' as const, status: 'active' as const, enrolled_date: '2025-01-10', effective_date: '2025-02-01', created_at: '2025-01-10T00:00:00Z' },
  { id: 'benr-12', org_id: 'org-1', employee_id: 'emp-14', plan_id: 'bp-1', coverage_level: 'employee_spouse' as const, status: 'active' as const, enrolled_date: '2025-03-01', effective_date: '2025-04-01', created_at: '2025-03-01T00:00:00Z' },
  { id: 'benr-13', org_id: 'org-1', employee_id: 'emp-16', plan_id: 'bp-1', coverage_level: 'employee_only' as const, status: 'active' as const, enrolled_date: '2025-01-15', effective_date: '2025-02-01', created_at: '2025-01-15T00:00:00Z' },
  { id: 'benr-14', org_id: 'org-1', employee_id: 'emp-16', plan_id: 'bp-3', coverage_level: 'employee_only' as const, status: 'active' as const, enrolled_date: '2025-01-15', effective_date: '2025-02-01', created_at: '2025-01-15T00:00:00Z' },
  { id: 'benr-15', org_id: 'org-1', employee_id: 'emp-18', plan_id: 'bp-1', coverage_level: 'family' as const, status: 'active' as const, enrolled_date: '2025-02-10', effective_date: '2025-03-01', created_at: '2025-02-10T00:00:00Z' },
  { id: 'benr-16', org_id: 'org-1', employee_id: 'emp-18', plan_id: 'bp-2', coverage_level: 'employee_only' as const, status: 'active' as const, enrolled_date: '2025-02-10', effective_date: '2025-03-01', created_at: '2025-02-10T00:00:00Z' },
  { id: 'benr-17', org_id: 'org-1', employee_id: 'emp-18', plan_id: 'bp-4', coverage_level: 'family' as const, status: 'active' as const, enrolled_date: '2025-02-10', effective_date: '2025-03-01', created_at: '2025-02-10T00:00:00Z' },
  { id: 'benr-18', org_id: 'org-1', employee_id: 'emp-24', plan_id: 'bp-1', coverage_level: 'employee_only' as const, status: 'waived' as const, enrolled_date: '2025-01-15', effective_date: '2025-02-01', created_at: '2025-01-15T00:00:00Z' },
  { id: 'benr-19', org_id: 'org-1', employee_id: 'emp-29', plan_id: 'bp-1', coverage_level: 'employee_child' as const, status: 'active' as const, enrolled_date: '2025-04-01', effective_date: '2025-05-01', created_at: '2025-04-01T00:00:00Z' },
  { id: 'benr-20', org_id: 'org-1', employee_id: 'emp-29', plan_id: 'bp-3', coverage_level: 'employee_only' as const, status: 'active' as const, enrolled_date: '2025-04-01', effective_date: '2025-05-01', created_at: '2025-04-01T00:00:00Z' },
]

// Benefit Dependents
export const demoBenefitDependents = [
  { id: 'bdep-1', org_id: 'org-1', employee_id: 'emp-1', first_name: 'Amara', last_name: 'Okafor', relationship: 'spouse' as const, date_of_birth: '1990-03-15', gender: 'female' as const, plan_ids: ['bp-1'], created_at: '2025-01-15T00:00:00Z' },
  { id: 'bdep-2', org_id: 'org-1', employee_id: 'emp-1', first_name: 'Chidi', last_name: 'Okafor', relationship: 'child' as const, date_of_birth: '2018-07-22', gender: 'male' as const, plan_ids: ['bp-1'], created_at: '2025-01-15T00:00:00Z' },
  { id: 'bdep-3', org_id: 'org-1', employee_id: 'emp-5', first_name: 'Ngozi', last_name: 'Adeyemi', relationship: 'spouse' as const, date_of_birth: '1988-11-05', gender: 'female' as const, plan_ids: ['bp-1', 'bp-4'], created_at: '2025-01-20T00:00:00Z' },
  { id: 'bdep-4', org_id: 'org-1', employee_id: 'emp-13', first_name: 'Fatima', last_name: 'Diallo', relationship: 'spouse' as const, date_of_birth: '1991-04-18', gender: 'female' as const, plan_ids: ['bp-1', 'bp-2', 'bp-4'], created_at: '2025-01-10T00:00:00Z' },
  { id: 'bdep-5', org_id: 'org-1', employee_id: 'emp-13', first_name: 'Moussa', last_name: 'Diallo', relationship: 'child' as const, date_of_birth: '2020-09-12', gender: 'male' as const, plan_ids: ['bp-1', 'bp-4'], created_at: '2025-01-10T00:00:00Z' },
  { id: 'bdep-6', org_id: 'org-1', employee_id: 'emp-13', first_name: 'Awa', last_name: 'Diallo', relationship: 'child' as const, date_of_birth: '2023-01-30', gender: 'female' as const, plan_ids: ['bp-1', 'bp-4'], created_at: '2025-01-10T00:00:00Z' },
  { id: 'bdep-7', org_id: 'org-1', employee_id: 'emp-14', first_name: 'Grace', last_name: 'Mensah', relationship: 'spouse' as const, date_of_birth: '1993-06-25', gender: 'female' as const, plan_ids: ['bp-1'], created_at: '2025-03-01T00:00:00Z' },
  { id: 'bdep-8', org_id: 'org-1', employee_id: 'emp-18', first_name: 'Kwame', last_name: 'Boateng', relationship: 'spouse' as const, date_of_birth: '1987-08-14', gender: 'male' as const, plan_ids: ['bp-1', 'bp-4'], created_at: '2025-02-10T00:00:00Z' },
  { id: 'bdep-9', org_id: 'org-1', employee_id: 'emp-18', first_name: 'Akua', last_name: 'Boateng', relationship: 'child' as const, date_of_birth: '2019-12-03', gender: 'female' as const, plan_ids: ['bp-1', 'bp-4'], created_at: '2025-02-10T00:00:00Z' },
  { id: 'bdep-10', org_id: 'org-1', employee_id: 'emp-29', first_name: 'Dele', last_name: 'Ojo', relationship: 'child' as const, date_of_birth: '2021-05-17', gender: 'male' as const, plan_ids: ['bp-1'], created_at: '2025-04-01T00:00:00Z' },
]

// Life Events
export const demoLifeEvents = [
  { id: 'le-1', org_id: 'org-1', employee_id: 'emp-14', type: 'marriage' as const, event_date: '2025-02-14', reported_date: '2025-02-20', deadline: '2025-03-22', status: 'processed' as const, notes: 'Added spouse to medical plan', benefit_changes: ['Added spouse to Comprehensive Medical'], created_at: '2025-02-20T00:00:00Z' },
  { id: 'le-2', org_id: 'org-1', employee_id: 'emp-29', type: 'birth' as const, event_date: '2025-03-15', reported_date: '2025-03-20', deadline: '2025-04-19', status: 'processed' as const, notes: 'Added child to medical plan', benefit_changes: ['Added child to Comprehensive Medical'], created_at: '2025-03-20T00:00:00Z' },
  { id: 'le-3', org_id: 'org-1', employee_id: 'emp-18', type: 'birth' as const, event_date: '2025-01-28', reported_date: '2025-02-05', deadline: '2025-03-07', status: 'processed' as const, notes: 'Updated coverage to family plan', benefit_changes: ['Upgraded to family coverage on Medical', 'Added child to Life Insurance'], created_at: '2025-02-05T00:00:00Z' },
  { id: 'le-4', org_id: 'org-1', employee_id: 'emp-6', type: 'marriage' as const, event_date: '2026-01-10', reported_date: '2026-01-15', deadline: '2026-02-14', status: 'pending' as const, notes: 'Needs to select coverage level', benefit_changes: [], created_at: '2026-01-15T00:00:00Z' },
  { id: 'le-5', org_id: 'org-1', employee_id: 'emp-24', type: 'divorce' as const, event_date: '2025-11-01', reported_date: '2025-11-10', deadline: '2025-12-10', status: 'processed' as const, notes: 'Removed ex-spouse from all plans', benefit_changes: ['Removed spouse from all benefit plans', 'Downgraded to employee-only coverage'], created_at: '2025-11-10T00:00:00Z' },
  { id: 'le-6', org_id: 'org-1', employee_id: 'emp-10', type: 'adoption' as const, event_date: '2026-02-01', reported_date: '2026-02-10', deadline: '2026-03-12', status: 'pending' as const, notes: 'Requesting family coverage upgrade', benefit_changes: [], created_at: '2026-02-10T00:00:00Z' },
]

// Expense
export const demoExpenseReports = [
  { id: 'exp-1', org_id: 'org-1', employee_id: 'emp-5', title: 'Client Meeting - Abidjan', total_amount: 1250, currency: 'USD', status: 'approved' as const, submitted_at: '2026-02-10T00:00:00Z', approved_by: 'emp-17', created_at: '2026-02-08T00:00:00Z', items: [{ id: 'ei-1', category: 'Travel', description: 'Flight to Abidjan', amount: 450 }, { id: 'ei-2', category: 'Accommodation', description: 'Hotel (2 nights)', amount: 520 }, { id: 'ei-3', category: 'Meals', description: 'Client dinner', amount: 280 }] },
  { id: 'exp-2', org_id: 'org-1', employee_id: 'emp-18', title: 'Recruitment Fair - Lagos', total_amount: 850, currency: 'USD', status: 'submitted' as const, submitted_at: '2026-02-18T00:00:00Z', approved_by: null, created_at: '2026-02-16T00:00:00Z', items: [{ id: 'ei-4', category: 'Events', description: 'Booth rental', amount: 500 }, { id: 'ei-5', category: 'Materials', description: 'Printed materials', amount: 350 }] },
  { id: 'exp-3', org_id: 'org-1', employee_id: 'emp-29', title: 'Marketing Campaign Materials', total_amount: 3200, currency: 'USD', status: 'pending_approval' as const, submitted_at: '2026-02-20T00:00:00Z', approved_by: null, created_at: '2026-02-19T00:00:00Z', items: [] },
  { id: 'exp-4', org_id: 'org-1', employee_id: 'emp-15', title: 'Conference - AfricaTech 2026', total_amount: 2100, currency: 'USD', status: 'reimbursed' as const, submitted_at: '2026-01-20T00:00:00Z', approved_by: 'emp-13', created_at: '2026-01-18T00:00:00Z', items: [] },
]

export const demoExpensePolicies = [
  { id: 'epol-1', org_id: 'org-1', category: 'Travel', daily_limit: 500, receipt_threshold: 25, auto_approve_limit: 200, status: 'active' as const, created_at: '2025-01-01T00:00:00Z' },
  { id: 'epol-2', org_id: 'org-1', category: 'Meals', daily_limit: 75, receipt_threshold: 15, auto_approve_limit: 50, status: 'active' as const, created_at: '2025-01-01T00:00:00Z' },
  { id: 'epol-3', org_id: 'org-1', category: 'Accommodation', daily_limit: 250, receipt_threshold: 50, auto_approve_limit: 150, status: 'active' as const, created_at: '2025-01-01T00:00:00Z' },
  { id: 'epol-4', org_id: 'org-1', category: 'Transport', daily_limit: 100, receipt_threshold: 10, auto_approve_limit: 50, status: 'active' as const, created_at: '2025-01-01T00:00:00Z' },
  { id: 'epol-5', org_id: 'org-1', category: 'Equipment', daily_limit: 1000, receipt_threshold: 0, auto_approve_limit: 500, status: 'active' as const, created_at: '2025-01-01T00:00:00Z' },
  { id: 'epol-6', org_id: 'org-1', category: 'Supplies', daily_limit: 200, receipt_threshold: 10, auto_approve_limit: 100, status: 'inactive' as const, created_at: '2025-06-01T00:00:00Z' },
]

export const demoMileageLogs = [
  { id: 'ml-1', org_id: 'org-1', employee_id: 'emp-5', date: '2026-02-10', origin: 'Lagos Office', destination: 'Ikeja Client Site', distance_km: 28, rate_per_km: 0.58, amount: 16.24, status: 'approved' as const, created_at: '2026-02-10T00:00:00Z' },
  { id: 'ml-2', org_id: 'org-1', employee_id: 'emp-18', date: '2026-02-14', origin: 'Accra HQ', destination: 'Tema Port Office', distance_km: 35, rate_per_km: 0.58, amount: 20.30, status: 'pending' as const, created_at: '2026-02-14T00:00:00Z' },
  { id: 'ml-3', org_id: 'org-1', employee_id: 'emp-15', date: '2026-02-18', origin: 'Nairobi Office', destination: 'Thika Road Branch', distance_km: 42, rate_per_km: 0.58, amount: 24.36, status: 'approved' as const, created_at: '2026-02-18T00:00:00Z' },
  { id: 'ml-4', org_id: 'org-1', employee_id: 'emp-29', date: '2026-02-20', origin: 'Dakar Office', destination: 'Rufisque Factory', distance_km: 25, rate_per_km: 0.58, amount: 14.50, status: 'pending' as const, created_at: '2026-02-20T00:00:00Z' },
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

// Recruiting - Interviews
export const demoInterviews = [
  { id: 'intv-1', org_id: 'org-1', application_id: 'app-1', job_id: 'job-1', candidate_name: 'David Okonkwo', interviewer_id: 'emp-13', interviewer_name: 'Babajide Ogunleye', type: 'technical' as const, status: 'completed' as const, scheduled_at: '2026-02-10T10:00:00Z', duration_min: 60, score: 4, feedback: 'Strong system design skills. Good understanding of distributed systems. Needs more depth in React performance optimization.', kit_name: 'Senior Engineer Technical Screen', created_at: '2026-02-05T00:00:00Z' },
  { id: 'intv-2', org_id: 'org-1', application_id: 'app-1', job_id: 'job-1', candidate_name: 'David Okonkwo', interviewer_id: 'emp-14', interviewer_name: 'Yaw Frimpong', type: 'technical' as const, status: 'completed' as const, scheduled_at: '2026-02-12T14:00:00Z', duration_min: 45, score: 3, feedback: 'Coding skills are solid but struggled with the concurrency question. Communication was clear.', kit_name: 'Coding Assessment', created_at: '2026-02-06T00:00:00Z' },
  { id: 'intv-3', org_id: 'org-1', application_id: 'app-2', job_id: 'job-1', candidate_name: 'Priscilla Addo', interviewer_id: 'emp-13', interviewer_name: 'Babajide Ogunleye', type: 'technical' as const, status: 'completed' as const, scheduled_at: '2026-02-08T09:00:00Z', duration_min: 60, score: 5, feedback: 'Exceptional candidate. Deep React expertise. Architected payment systems at Flutterwave. Strong hire recommendation.', kit_name: 'Senior Engineer Technical Screen', created_at: '2026-02-03T00:00:00Z' },
  { id: 'intv-4', org_id: 'org-1', application_id: 'app-2', job_id: 'job-1', candidate_name: 'Priscilla Addo', interviewer_id: 'emp-17', interviewer_name: 'Amara Kone', type: 'culture' as const, status: 'completed' as const, scheduled_at: '2026-02-09T11:00:00Z', duration_min: 30, score: 5, feedback: 'Excellent culture fit. Collaborative mindset. Passionate about fintech in Africa.', kit_name: 'Culture & Values Interview', created_at: '2026-02-04T00:00:00Z' },
  { id: 'intv-5', org_id: 'org-1', application_id: 'app-4', job_id: 'job-2', candidate_name: 'Efua Owusu', interviewer_id: 'emp-1', interviewer_name: 'Oluwaseun Adeyemi', type: 'panel' as const, status: 'completed' as const, scheduled_at: '2026-02-15T10:00:00Z', duration_min: 90, score: 4, feedback: 'Impressive leadership experience. Strong understanding of branch operations. Presented a compelling vision for branch transformation.', kit_name: 'Branch Manager Panel', created_at: '2026-02-10T00:00:00Z' },
  { id: 'intv-6', org_id: 'org-1', application_id: 'app-5', job_id: 'job-4', candidate_name: 'Aisha Ndungu', interviewer_id: 'emp-15', interviewer_name: 'Brian Otieno', type: 'phone_screen' as const, status: 'scheduled' as const, scheduled_at: '2026-02-28T09:00:00Z', duration_min: 30, score: null, feedback: null, kit_name: 'Data Science Phone Screen', created_at: '2026-02-20T00:00:00Z' },
  { id: 'intv-7', org_id: 'org-1', application_id: 'app-3', job_id: 'job-1', candidate_name: 'Samuel Mensah', interviewer_id: 'emp-18', interviewer_name: 'Folake Adebayo', type: 'phone_screen' as const, status: 'scheduled' as const, scheduled_at: '2026-03-01T14:00:00Z', duration_min: 30, score: null, feedback: null, kit_name: 'Initial Phone Screen', created_at: '2026-02-22T00:00:00Z' },
  { id: 'intv-8', org_id: 'org-1', application_id: 'app-4', job_id: 'job-2', candidate_name: 'Efua Owusu', interviewer_id: 'emp-2', interviewer_name: 'Ngozi Okafor', type: 'culture' as const, status: 'scheduled' as const, scheduled_at: '2026-03-02T11:00:00Z', duration_min: 45, score: null, feedback: null, kit_name: 'Culture & Values Interview', created_at: '2026-02-23T00:00:00Z' },
  { id: 'intv-9', org_id: 'org-1', application_id: 'app-1', job_id: 'job-1', candidate_name: 'David Okonkwo', interviewer_id: 'emp-17', interviewer_name: 'Amara Kone', type: 'culture' as const, status: 'completed' as const, scheduled_at: '2026-02-14T15:00:00Z', duration_min: 30, score: 4, feedback: 'Good culture alignment. Team-oriented. Showed genuine interest in Ecobank mission.', kit_name: 'Culture & Values Interview', created_at: '2026-02-09T00:00:00Z' },
]

// Recruiting - Talent Pools
export const demoTalentPools = [
  { id: 'tp-1', org_id: 'org-1', name: 'Referred Candidates', description: 'Candidates referred by current employees', category: 'referred' as const, candidates: [
    { id: 'tpc-1', name: 'Adaora Eze', email: 'adaora.eze@gmail.com', title: 'Product Manager', company: 'Paystack', source: 'Employee Referral (Ngozi Okafor)', tags: ['product', 'fintech', 'senior'], notes: 'Strong PM background in payments. Referred by Ngozi.', last_contacted: '2026-02-10T00:00:00Z', added_at: '2026-01-20T00:00:00Z' },
    { id: 'tpc-2', name: 'Kweku Mensah', email: 'kweku.m@outlook.com', title: 'Engineering Manager', company: 'MTN', source: 'Employee Referral (Yaw Frimpong)', tags: ['engineering', 'leadership', 'telecom'], notes: 'Led mobile money engineering team. Looking for next challenge.', last_contacted: '2026-02-05T00:00:00Z', added_at: '2026-01-15T00:00:00Z' },
  ], created_at: '2026-01-01T00:00:00Z' },
  { id: 'tp-2', org_id: 'org-1', name: 'Sourced Engineers', description: 'Tech talent identified through sourcing campaigns', category: 'sourced' as const, candidates: [
    { id: 'tpc-3', name: 'Femi Oluwole', email: 'femi.o@proton.me', title: 'Staff Engineer', company: 'Andela', source: 'LinkedIn Sourcing', tags: ['backend', 'golang', 'microservices'], notes: 'Impressive open-source contributions. Published speaker at AfriConf.', last_contacted: '2026-02-18T00:00:00Z', added_at: '2026-02-01T00:00:00Z' },
    { id: 'tpc-4', name: 'Amina Hassan', email: 'amina.h@gmail.com', title: 'Data Engineer', company: 'Safaricom', source: 'LinkedIn Sourcing', tags: ['data', 'python', 'spark'], notes: 'Built real-time analytics pipeline processing 1M+ transactions daily.', last_contacted: '2026-02-12T00:00:00Z', added_at: '2026-02-05T00:00:00Z' },
    { id: 'tpc-5', name: 'Chidi Nwachukwu', email: 'chidi.n@yahoo.com', title: 'Frontend Engineer', company: 'Kuda Bank', source: 'Tech Meetup', tags: ['frontend', 'react', 'mobile'], notes: 'Met at Lagos React Meetup. Built Kuda mobile app.', last_contacted: null, added_at: '2026-02-10T00:00:00Z' },
  ], created_at: '2026-02-01T00:00:00Z' },
  { id: 'tp-3', org_id: 'org-1', name: 'Past Applicants - Strong', description: 'Previous applicants who were strong but timing was not right', category: 'past_applicants' as const, candidates: [
    { id: 'tpc-6', name: 'Grace Akinyi', email: 'grace.ak@gmail.com', title: 'Risk Analyst', company: 'KCB Bank', source: 'Previous Application (Q3 2025)', tags: ['risk', 'compliance', 'analytics'], notes: 'Strong candidate for Compliance Analyst role. Lost to counter-offer. Revisit in Q2.', last_contacted: '2025-11-15T00:00:00Z', added_at: '2025-10-01T00:00:00Z' },
    { id: 'tpc-7', name: 'Moussa Diarra', email: 'moussa.d@hotmail.com', title: 'Branch Operations Lead', company: 'BOA Group', source: 'Previous Application (Q4 2025)', tags: ['operations', 'branch-mgmt', 'francophone'], notes: 'Excellent Branch Manager candidate. Withdrew for personal reasons. Expressed future interest.', last_contacted: '2025-12-20T00:00:00Z', added_at: '2025-11-01T00:00:00Z' },
  ], created_at: '2025-10-01T00:00:00Z' },
  { id: 'tp-4', org_id: 'org-1', name: 'University Pipeline', description: 'Top graduates from partner universities', category: 'sourced' as const, candidates: [
    { id: 'tpc-8', name: 'Blessing Osei', email: 'b.osei@ashesi.edu.gh', title: 'CS Graduate', company: 'Ashesi University', source: 'Campus Recruiting', tags: ['graduate', 'cs', 'intern-ready'], notes: 'Top of class at Ashesi. Completed internship at Google. Available June 2026.', last_contacted: '2026-02-15T00:00:00Z', added_at: '2026-01-10T00:00:00Z' },
    { id: 'tpc-9', name: 'Ibrahim Bello', email: 'ibrahim.b@unilag.edu.ng', title: 'Finance Graduate', company: 'University of Lagos', source: 'Campus Recruiting', tags: ['graduate', 'finance', 'analytics'], notes: 'Published research on mobile banking adoption in Nigeria. Dean list student.', last_contacted: '2026-02-08T00:00:00Z', added_at: '2026-01-05T00:00:00Z' },
  ], created_at: '2026-01-05T00:00:00Z' },
]

// Recruiting - Score Cards
export const demoScoreCards = [
  { id: 'sc-1', org_id: 'org-1', application_id: 'app-2', candidate_name: 'Priscilla Addo', job_title: 'Senior Software Engineer', interviewer_id: 'emp-13', interviewer_name: 'Babajide Ogunleye', interview_id: 'intv-3', overall_score: 4.7, recommendation: 'strong_hire' as const, criteria: [
    { name: 'Technical Skills', score: 5, weight: 0.3, notes: 'Deep expertise in React, Node.js, and distributed systems' },
    { name: 'Problem Solving', score: 5, weight: 0.25, notes: 'Solved the system design challenge elegantly' },
    { name: 'Communication', score: 4, weight: 0.15, notes: 'Clear and structured responses' },
    { name: 'Culture Fit', score: 5, weight: 0.15, notes: 'Passionate about fintech in Africa. Team-oriented.' },
    { name: 'Leadership', score: 4, weight: 0.15, notes: 'Has led teams of 5-8 engineers' },
  ], submitted_at: '2026-02-08T10:00:00Z', created_at: '2026-02-08T00:00:00Z' },
  { id: 'sc-2', org_id: 'org-1', application_id: 'app-2', candidate_name: 'Priscilla Addo', job_title: 'Senior Software Engineer', interviewer_id: 'emp-17', interviewer_name: 'Amara Kone', interview_id: 'intv-4', overall_score: 4.8, recommendation: 'strong_hire' as const, criteria: [
    { name: 'Technical Skills', score: 5, weight: 0.3, notes: 'N/A - Culture interview' },
    { name: 'Problem Solving', score: 5, weight: 0.25, notes: 'Great analytical thinking in scenario questions' },
    { name: 'Communication', score: 5, weight: 0.15, notes: 'Articulate and engaging' },
    { name: 'Culture Fit', score: 5, weight: 0.15, notes: 'Perfect alignment with Ecobank values' },
    { name: 'Leadership', score: 4, weight: 0.15, notes: 'Demonstrated servant leadership approach' },
  ], submitted_at: '2026-02-09T12:00:00Z', created_at: '2026-02-09T00:00:00Z' },
  { id: 'sc-3', org_id: 'org-1', application_id: 'app-1', candidate_name: 'David Okonkwo', job_title: 'Senior Software Engineer', interviewer_id: 'emp-13', interviewer_name: 'Babajide Ogunleye', interview_id: 'intv-1', overall_score: 3.8, recommendation: 'hire' as const, criteria: [
    { name: 'Technical Skills', score: 4, weight: 0.3, notes: 'Strong fundamentals. Good system design.' },
    { name: 'Problem Solving', score: 4, weight: 0.25, notes: 'Methodical approach to problems' },
    { name: 'Communication', score: 3, weight: 0.15, notes: 'Could be more concise in explanations' },
    { name: 'Culture Fit', score: 4, weight: 0.15, notes: 'Good team player' },
    { name: 'Leadership', score: 3, weight: 0.15, notes: 'Limited leadership experience' },
  ], submitted_at: '2026-02-10T11:00:00Z', created_at: '2026-02-10T00:00:00Z' },
  { id: 'sc-4', org_id: 'org-1', application_id: 'app-1', candidate_name: 'David Okonkwo', job_title: 'Senior Software Engineer', interviewer_id: 'emp-14', interviewer_name: 'Yaw Frimpong', interview_id: 'intv-2', overall_score: 3.3, recommendation: 'hire' as const, criteria: [
    { name: 'Technical Skills', score: 3, weight: 0.3, notes: 'Solid but struggled with concurrency' },
    { name: 'Problem Solving', score: 4, weight: 0.25, notes: 'Good debugging approach' },
    { name: 'Communication', score: 3, weight: 0.15, notes: 'Adequate' },
    { name: 'Culture Fit', score: 3, weight: 0.15, notes: 'Seems like a good fit' },
    { name: 'Leadership', score: 3, weight: 0.15, notes: 'Individual contributor mentality' },
  ], submitted_at: '2026-02-12T15:00:00Z', created_at: '2026-02-12T00:00:00Z' },
  { id: 'sc-5', org_id: 'org-1', application_id: 'app-1', candidate_name: 'David Okonkwo', job_title: 'Senior Software Engineer', interviewer_id: 'emp-17', interviewer_name: 'Amara Kone', interview_id: 'intv-9', overall_score: 3.9, recommendation: 'hire' as const, criteria: [
    { name: 'Technical Skills', score: 4, weight: 0.3, notes: 'N/A - Culture interview' },
    { name: 'Problem Solving', score: 4, weight: 0.25, notes: 'Good scenario responses' },
    { name: 'Communication', score: 4, weight: 0.15, notes: 'Good communicator in culture setting' },
    { name: 'Culture Fit', score: 4, weight: 0.15, notes: 'Aligned with Ecobank mission' },
    { name: 'Leadership', score: 3, weight: 0.15, notes: 'Willing to mentor juniors' },
  ], submitted_at: '2026-02-14T16:00:00Z', created_at: '2026-02-14T00:00:00Z' },
  { id: 'sc-6', org_id: 'org-1', application_id: 'app-4', candidate_name: 'Efua Owusu', job_title: 'Branch Manager', interviewer_id: 'emp-1', interviewer_name: 'Oluwaseun Adeyemi', interview_id: 'intv-5', overall_score: 4.2, recommendation: 'hire' as const, criteria: [
    { name: 'Technical Skills', score: 4, weight: 0.2, notes: 'Deep knowledge of branch banking operations' },
    { name: 'Problem Solving', score: 4, weight: 0.2, notes: 'Practical problem-solving approach' },
    { name: 'Communication', score: 5, weight: 0.2, notes: 'Excellent presentation and communication' },
    { name: 'Culture Fit', score: 4, weight: 0.2, notes: 'Customer-first mindset' },
    { name: 'Leadership', score: 4, weight: 0.2, notes: 'Strong leadership track record at Standard Chartered' },
  ], submitted_at: '2026-02-15T12:00:00Z', created_at: '2026-02-15T00:00:00Z' },
  { id: 'sc-7', org_id: 'org-1', application_id: 'app-3', candidate_name: 'Samuel Mensah', job_title: 'Senior Software Engineer', interviewer_id: 'emp-18', interviewer_name: 'Folake Adebayo', interview_id: null, overall_score: 3.0, recommendation: 'no_decision' as const, criteria: [
    { name: 'Technical Skills', score: 3, weight: 0.3, notes: 'Resume shows potential but untested' },
    { name: 'Problem Solving', score: 3, weight: 0.25, notes: 'Awaiting interview' },
    { name: 'Communication', score: 3, weight: 0.15, notes: 'Awaiting interview' },
    { name: 'Culture Fit', score: 3, weight: 0.15, notes: 'Awaiting interview' },
    { name: 'Leadership', score: 3, weight: 0.15, notes: 'Awaiting interview' },
  ], submitted_at: null, created_at: '2026-02-22T00:00:00Z' },
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

// Vendor Contracts (linked to vendors)
export const demoVendorContracts = [
  { id: 'vc-1', org_id: 'org-1', vendor_id: 'vnd-1', contract_number: 'CTR-2024-001', start_date: '2024-01-01', end_date: '2026-12-31', annual_value: 180000, currency: 'USD', status: 'active' as const, renewal_type: 'auto' as const, performance_rating: 4.5, notes: 'Enterprise agreement covering all Microsoft 365 licenses' },
  { id: 'vc-2', org_id: 'org-1', vendor_id: 'vnd-2', contract_number: 'CTR-2025-002', start_date: '2025-06-01', end_date: '2027-05-31', annual_value: 150000, currency: 'USD', status: 'active' as const, renewal_type: 'manual' as const, performance_rating: 4.2, notes: 'AWS infrastructure with reserved instances' },
  { id: 'vc-3', org_id: 'org-1', vendor_id: 'vnd-3', contract_number: 'CTR-2025-003', start_date: '2025-01-01', end_date: '2026-06-30', annual_value: 95000, currency: 'USD', status: 'active' as const, renewal_type: 'manual' as const, performance_rating: 3.8, notes: 'Annual security audit and consulting retainer' },
  { id: 'vc-4', org_id: 'org-1', vendor_id: 'vnd-4', contract_number: 'CTR-2024-004', start_date: '2024-03-01', end_date: '2026-02-28', annual_value: 64000, currency: 'USD', status: 'expiring_soon' as const, renewal_type: 'manual' as const, performance_rating: 4.0, notes: 'Training delivery and content development' },
]

// Spend Analytics (monthly spend by category)
export const demoSpendByCategory = [
  { category: 'Software', amount: 245000, previousAmount: 228000, trend: 'up' as const },
  { category: 'Cloud Infrastructure', amount: 150000, previousAmount: 142000, trend: 'up' as const },
  { category: 'Consulting', amount: 95000, previousAmount: 110000, trend: 'down' as const },
  { category: 'Training', amount: 64000, previousAmount: 58000, trend: 'up' as const },
  { category: 'Hardware', amount: 82000, previousAmount: 95000, trend: 'down' as const },
  { category: 'Telecommunications', amount: 38000, previousAmount: 36000, trend: 'up' as const },
]

// Compliance Frameworks
export const demoComplianceFrameworks = [
  { id: 'cf-1', name: 'SOC 2 Type II', status: 'compliant' as const, compliance_score: 94, total_controls: 120, passed_controls: 113, failed_controls: 3, pending_controls: 4, last_audit: '2025-12-15', next_audit: '2026-06-15', description: 'Service Organization Control - Trust Services Criteria' },
  { id: 'cf-2', name: 'ISO 27001', status: 'partial' as const, compliance_score: 82, total_controls: 114, passed_controls: 93, failed_controls: 8, pending_controls: 13, last_audit: '2025-10-01', next_audit: '2026-04-01', description: 'Information Security Management System' },
  { id: 'cf-3', name: 'GDPR', status: 'compliant' as const, compliance_score: 91, total_controls: 72, passed_controls: 65, failed_controls: 2, pending_controls: 5, last_audit: '2025-11-01', next_audit: '2026-05-01', description: 'General Data Protection Regulation' },
  { id: 'cf-4', name: 'HIPAA', status: 'not_applicable' as const, compliance_score: 0, total_controls: 0, passed_controls: 0, failed_controls: 0, pending_controls: 0, last_audit: null, next_audit: null, description: 'Health Insurance Portability and Accountability Act' },
]

// Security Posture Data
export const demoSecurityPosture = {
  overall_score: 87,
  os_currency: { up_to_date: 5, outdated: 1, total: 6 },
  encryption_status: { encrypted: 5, unencrypted: 1, total: 6 },
  endpoint_protection: { protected: 4, unprotected: 2, total: 6 },
  last_checkin: { within_24h: 4, within_7d: 1, older: 1, total: 6 },
}

// Provisioning Events
export const demoProvisioningEvents = [
  { id: 'prov-1', type: 'onboarding' as const, employee_id: 'emp-30', employee_name: 'Aminata Diop', status: 'completed' as const, devices_assigned: ['Lenovo ThinkPad X1'], apps_provisioned: ['Microsoft 365', 'Slack', 'GitHub'], date: '2026-02-10', completed_steps: 5, total_steps: 5 },
  { id: 'prov-2', type: 'onboarding' as const, employee_id: 'emp-29', employee_name: 'Tunde Bakare', status: 'in_progress' as const, devices_assigned: ['Dell Latitude 5540'], apps_provisioned: ['Microsoft 365', 'Figma'], date: '2026-02-18', completed_steps: 3, total_steps: 5 },
  { id: 'prov-3', type: 'offboarding' as const, employee_id: 'emp-12', employee_name: 'Wanjiku Muthoni', status: 'completed' as const, devices_assigned: [], apps_provisioned: [], date: '2026-02-05', completed_steps: 4, total_steps: 4 },
  { id: 'prov-4', type: 'onboarding' as const, employee_id: 'emp-28', employee_name: 'Peter Njoroge', status: 'completed' as const, devices_assigned: ['Apple MacBook Pro 14"'], apps_provisioned: ['Microsoft 365', 'Slack', 'Figma', 'GitHub'], date: '2026-01-15', completed_steps: 5, total_steps: 5 },
  { id: 'prov-5', type: 'offboarding' as const, employee_id: 'emp-4', employee_name: 'Chioma Eze', status: 'pending' as const, devices_assigned: [], apps_provisioned: [], date: '2026-03-01', completed_steps: 0, total_steps: 4 },
]

// Shadow IT Detections
export const demoShadowITDetections = [
  { id: 'sit-1', app_name: 'Notion', detected_users: 12, risk_level: 'medium' as const, category: 'Productivity', detected_date: '2026-02-15', recommended_alternative: 'Microsoft 365 / SharePoint', data_risk: 'Company docs may be stored outside approved systems', status: 'under_review' as const },
  { id: 'sit-2', app_name: 'Dropbox Personal', detected_users: 8, risk_level: 'high' as const, category: 'File Storage', detected_date: '2026-02-10', recommended_alternative: 'OneDrive for Business', data_risk: 'Sensitive files stored on personal cloud accounts', status: 'flagged' as const },
  { id: 'sit-3', app_name: 'ChatGPT Free', detected_users: 23, risk_level: 'high' as const, category: 'AI / LLM', detected_date: '2026-02-01', recommended_alternative: 'Microsoft Copilot (Enterprise)', data_risk: 'Confidential data may be sent to external AI services', status: 'under_review' as const },
  { id: 'sit-4', app_name: 'Trello', detected_users: 5, risk_level: 'low' as const, category: 'Project Management', detected_date: '2026-01-20', recommended_alternative: 'Microsoft Planner', data_risk: 'Project data outside approved tools', status: 'accepted' as const },
]

// Budget Forecast Data (monthly planned vs actual by department)
export const demoBudgetForecast = [
  { department_id: 'dept-4', department: 'Technology', month: 'Jan', planned: 210000, actual: 225000 },
  { department_id: 'dept-4', department: 'Technology', month: 'Feb', planned: 210000, actual: 198000 },
  { department_id: 'dept-4', department: 'Technology', month: 'Mar', planned: 210000, actual: 257000 },
  { department_id: 'dept-5', department: 'HR & People', month: 'Jan', planned: 100000, actual: 95000 },
  { department_id: 'dept-5', department: 'HR & People', month: 'Feb', planned: 100000, actual: 108000 },
  { department_id: 'dept-5', department: 'HR & People', month: 'Mar', planned: 100000, actual: 117000 },
  { department_id: 'dept-8', department: 'Marketing', month: 'Jan', planned: 67000, actual: 62000 },
  { department_id: 'dept-8', department: 'Marketing', month: 'Feb', planned: 67000, actual: 71000 },
  { department_id: 'dept-8', department: 'Marketing', month: 'Mar', planned: 67000, actual: 82000 },
  { department_id: 'dept-3', department: 'Operations', month: 'Jan', planned: 150000, actual: 148000 },
  { department_id: 'dept-3', department: 'Operations', month: 'Feb', planned: 150000, actual: 155000 },
  { department_id: 'dept-3', department: 'Operations', month: 'Mar', planned: 150000, actual: 187000 },
]

// ============================================================
// PROJECT AUTOMATION RULES
// ============================================================

export const demoAutomationRules = [
  {
    id: 'rule-1', org_id: 'org-1', project_id: 'proj-1',
    name: 'Auto-assign QA when moved to Review',
    description: 'When a task is moved to Review status, automatically assign Adaeze (UX Designer) as QA reviewer.',
    trigger: { type: 'status_change' as const, value: 'review' },
    action: { type: 'assign_to' as const, value: 'emp-16', label: 'Adaeze Ikechukwu' },
    is_active: true,
    executions: 8,
    last_executed: '2026-02-24T14:30:00Z',
    created_at: '2026-01-15T10:00:00Z',
  },
  {
    id: 'rule-2', org_id: 'org-1', project_id: 'proj-1',
    name: 'Notify manager when task overdue',
    description: 'Send notification to project owner when any task passes its due date without completion.',
    trigger: { type: 'due_date_passed' as const, value: '' },
    action: { type: 'send_notification' as const, value: 'emp-13', label: 'Babajide Ogunleye' },
    is_active: true,
    executions: 3,
    last_executed: '2026-02-22T09:00:00Z',
    created_at: '2026-01-15T10:00:00Z',
  },
  {
    id: 'rule-3', org_id: 'org-1', project_id: 'proj-2',
    name: 'Escalate priority when blocked',
    description: 'When a task is labeled "blocked", automatically change its priority to critical.',
    trigger: { type: 'label_added' as const, value: 'blocked' },
    action: { type: 'change_priority' as const, value: 'critical', label: 'Critical' },
    is_active: true,
    executions: 2,
    last_executed: '2026-02-20T11:15:00Z',
    created_at: '2026-02-01T09:00:00Z',
  },
  {
    id: 'rule-4', org_id: 'org-1', project_id: null as string | null,
    name: 'Create subtask for code review',
    description: 'When a development task moves to In Progress, create a "Code Review" subtask.',
    trigger: { type: 'status_change' as const, value: 'in_progress' },
    action: { type: 'create_subtask' as const, value: 'Code Review', label: 'Code Review' },
    is_active: false,
    executions: 0,
    last_executed: null as string | null,
    created_at: '2026-02-10T08:00:00Z',
  },
  {
    id: 'rule-5', org_id: 'org-1', project_id: 'proj-4',
    name: 'Add handover label on reassignment',
    description: 'When assignee changes on a compliance task, add the "handover" label for audit trail.',
    trigger: { type: 'assignee_change' as const, value: '' },
    action: { type: 'add_label' as const, value: 'handover', label: 'handover' },
    is_active: true,
    executions: 5,
    last_executed: '2026-02-23T16:45:00Z',
    created_at: '2026-01-05T08:00:00Z',
  },
]

export const demoAutomationLog = [
  { id: 'alog-1', rule_id: 'rule-1', rule_name: 'Auto-assign QA when moved to Review', task_id: 'task-8', task_title: 'Regulatory approval application (Ghana)', executed_at: '2026-02-24T14:30:00Z', status: 'success' as const },
  { id: 'alog-2', rule_id: 'rule-2', rule_name: 'Notify manager when task overdue', task_id: 'task-4', task_title: 'Data migration scripts', executed_at: '2026-02-22T09:00:00Z', status: 'success' as const },
  { id: 'alog-3', rule_id: 'rule-3', rule_name: 'Escalate priority when blocked', task_id: 'task-7', task_title: 'Real estate assessment (Dakar)', executed_at: '2026-02-20T11:15:00Z', status: 'success' as const },
  { id: 'alog-4', rule_id: 'rule-5', rule_name: 'Add handover label on reassignment', task_id: 'task-16', task_title: 'Draft updated compliance policies', executed_at: '2026-02-23T16:45:00Z', status: 'success' as const },
  { id: 'alog-5', rule_id: 'rule-1', rule_name: 'Auto-assign QA when moved to Review', task_id: 'task-20', task_title: 'Budget approval for Abidjan branch', executed_at: '2026-02-22T10:30:00Z', status: 'success' as const },
  { id: 'alog-6', rule_id: 'rule-2', rule_name: 'Notify manager when task overdue', task_id: 'task-5', task_title: 'Security audit', executed_at: '2026-02-21T08:00:00Z', status: 'failed' as const },
]

// ============================================================
// ROLLING FORECASTS & MULTI-YEAR PLANNING
// ============================================================

export const demoRollingForecast = [
  { month: 'Mar 2026', budget: 527000, actual: 544000, forecast: 544000, department_id: 'dept-4', department: 'Technology' },
  { month: 'Apr 2026', budget: 527000, actual: null as number | null, forecast: 538000, department_id: 'dept-4', department: 'Technology' },
  { month: 'May 2026', budget: 527000, actual: null as number | null, forecast: 541000, department_id: 'dept-4', department: 'Technology' },
  { month: 'Jun 2026', budget: 527000, actual: null as number | null, forecast: 552000, department_id: 'dept-4', department: 'Technology' },
  { month: 'Jul 2026', budget: 527000, actual: null as number | null, forecast: 548000, department_id: 'dept-4', department: 'Technology' },
  { month: 'Aug 2026', budget: 527000, actual: null as number | null, forecast: 555000, department_id: 'dept-4', department: 'Technology' },
  { month: 'Sep 2026', budget: 527000, actual: null as number | null, forecast: 560000, department_id: 'dept-4', department: 'Technology' },
  { month: 'Oct 2026', budget: 527000, actual: null as number | null, forecast: 558000, department_id: 'dept-4', department: 'Technology' },
  { month: 'Nov 2026', budget: 527000, actual: null as number | null, forecast: 565000, department_id: 'dept-4', department: 'Technology' },
  { month: 'Dec 2026', budget: 527000, actual: null as number | null, forecast: 572000, department_id: 'dept-4', department: 'Technology' },
  { month: 'Jan 2027', budget: 540000, actual: null as number | null, forecast: 578000, department_id: 'dept-4', department: 'Technology' },
  { month: 'Feb 2027', budget: 540000, actual: null as number | null, forecast: 582000, department_id: 'dept-4', department: 'Technology' },
  { month: 'Mar 2026', budget: 300000, actual: 318000, forecast: 318000, department_id: 'dept-5', department: 'HR & People' },
  { month: 'Apr 2026', budget: 300000, actual: null as number | null, forecast: 310000, department_id: 'dept-5', department: 'HR & People' },
  { month: 'May 2026', budget: 300000, actual: null as number | null, forecast: 315000, department_id: 'dept-5', department: 'HR & People' },
  { month: 'Jun 2026', budget: 300000, actual: null as number | null, forecast: 322000, department_id: 'dept-5', department: 'HR & People' },
  { month: 'Jul 2026', budget: 300000, actual: null as number | null, forecast: 318000, department_id: 'dept-5', department: 'HR & People' },
  { month: 'Aug 2026', budget: 300000, actual: null as number | null, forecast: 325000, department_id: 'dept-5', department: 'HR & People' },
  { month: 'Sep 2026', budget: 300000, actual: null as number | null, forecast: 330000, department_id: 'dept-5', department: 'HR & People' },
  { month: 'Oct 2026', budget: 300000, actual: null as number | null, forecast: 328000, department_id: 'dept-5', department: 'HR & People' },
  { month: 'Nov 2026', budget: 300000, actual: null as number | null, forecast: 335000, department_id: 'dept-5', department: 'HR & People' },
  { month: 'Dec 2026', budget: 300000, actual: null as number | null, forecast: 340000, department_id: 'dept-5', department: 'HR & People' },
  { month: 'Jan 2027', budget: 310000, actual: null as number | null, forecast: 345000, department_id: 'dept-5', department: 'HR & People' },
  { month: 'Feb 2027', budget: 310000, actual: null as number | null, forecast: 348000, department_id: 'dept-5', department: 'HR & People' },
  { month: 'Mar 2026', budget: 200000, actual: 215000, forecast: 215000, department_id: 'dept-8', department: 'Marketing' },
  { month: 'Apr 2026', budget: 200000, actual: null as number | null, forecast: 208000, department_id: 'dept-8', department: 'Marketing' },
  { month: 'May 2026', budget: 200000, actual: null as number | null, forecast: 212000, department_id: 'dept-8', department: 'Marketing' },
  { month: 'Jun 2026', budget: 200000, actual: null as number | null, forecast: 220000, department_id: 'dept-8', department: 'Marketing' },
  { month: 'Jul 2026', budget: 200000, actual: null as number | null, forecast: 218000, department_id: 'dept-8', department: 'Marketing' },
  { month: 'Aug 2026', budget: 200000, actual: null as number | null, forecast: 225000, department_id: 'dept-8', department: 'Marketing' },
  { month: 'Sep 2026', budget: 200000, actual: null as number | null, forecast: 230000, department_id: 'dept-8', department: 'Marketing' },
  { month: 'Oct 2026', budget: 200000, actual: null as number | null, forecast: 228000, department_id: 'dept-8', department: 'Marketing' },
  { month: 'Nov 2026', budget: 200000, actual: null as number | null, forecast: 235000, department_id: 'dept-8', department: 'Marketing' },
  { month: 'Dec 2026', budget: 200000, actual: null as number | null, forecast: 240000, department_id: 'dept-8', department: 'Marketing' },
  { month: 'Jan 2027', budget: 210000, actual: null as number | null, forecast: 242000, department_id: 'dept-8', department: 'Marketing' },
  { month: 'Feb 2027', budget: 210000, actual: null as number | null, forecast: 245000, department_id: 'dept-8', department: 'Marketing' },
]

export const demoMultiYearPlan = {
  years: [
    {
      year: 2026, label: 'FY 2026',
      revenue: 285000000, opex: 198000000, capex: 42000000, headcount: 14247,
      growthAssumption: 12, headcountGrowth: 8,
      departments: [
        { department_id: 'dept-4', name: 'Technology', opex: 6324000, capex: 18000000, headcount: 380 },
        { department_id: 'dept-5', name: 'HR & People', opex: 3600000, capex: 500000, headcount: 85 },
        { department_id: 'dept-8', name: 'Marketing', opex: 2400000, capex: 300000, headcount: 62 },
        { department_id: 'dept-3', name: 'Operations', opex: 4500000, capex: 8000000, headcount: 420 },
        { department_id: 'dept-7', name: 'Finance', opex: 2100000, capex: 200000, headcount: 55 },
        { department_id: 'dept-6', name: 'Risk & Compliance', opex: 1800000, capex: 150000, headcount: 45 },
      ],
    },
    {
      year: 2027, label: 'FY 2027',
      revenue: 319000000, opex: 218000000, capex: 38000000, headcount: 15387,
      growthAssumption: 10, headcountGrowth: 6,
      departments: [
        { department_id: 'dept-4', name: 'Technology', opex: 7100000, capex: 15000000, headcount: 420 },
        { department_id: 'dept-5', name: 'HR & People', opex: 3950000, capex: 400000, headcount: 92 },
        { department_id: 'dept-8', name: 'Marketing', opex: 2750000, capex: 250000, headcount: 68 },
        { department_id: 'dept-3', name: 'Operations', opex: 4900000, capex: 6500000, headcount: 445 },
        { department_id: 'dept-7', name: 'Finance', opex: 2300000, capex: 180000, headcount: 58 },
        { department_id: 'dept-6', name: 'Risk & Compliance', opex: 2000000, capex: 120000, headcount: 48 },
      ],
    },
    {
      year: 2028, label: 'FY 2028',
      revenue: 354000000, opex: 236000000, capex: 35000000, headcount: 16310,
      growthAssumption: 8, headcountGrowth: 5,
      departments: [
        { department_id: 'dept-4', name: 'Technology', opex: 7800000, capex: 12000000, headcount: 455 },
        { department_id: 'dept-5', name: 'HR & People', opex: 4250000, capex: 350000, headcount: 97 },
        { department_id: 'dept-8', name: 'Marketing', opex: 3050000, capex: 200000, headcount: 72 },
        { department_id: 'dept-3', name: 'Operations', opex: 5250000, capex: 5000000, headcount: 465 },
        { department_id: 'dept-7', name: 'Finance', opex: 2500000, capex: 150000, headcount: 61 },
        { department_id: 'dept-6', name: 'Risk & Compliance', opex: 2200000, capex: 100000, headcount: 50 },
      ],
    },
  ],
  scenarios: {
    conservative: { revenueMultiplier: 0.9, opexMultiplier: 1.05, headcountMultiplier: 0.95 },
    base: { revenueMultiplier: 1.0, opexMultiplier: 1.0, headcountMultiplier: 1.0 },
    aggressive: { revenueMultiplier: 1.15, opexMultiplier: 0.95, headcountMultiplier: 1.1 },
  },
}

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

// Kash Employee Payroll Entries (individual pay stubs for January 2026 run)
export const kashEmployeePayrollEntries = [
  { id: 'kepe-1', org_id: 'org-2', payroll_run_id: 'kpr-1', employee_id: 'kemp-1', employee_name: 'Sipho Ndlovu', department: 'Consulting', country: 'South Africa', gross_pay: 15000, federal_tax: 2250, state_tax: 750, social_security: 930, medicare: 218, pension: 750, health_insurance: 500, bonus: 0, overtime: 0, other_deductions: 0, total_deductions: 5398, net_pay: 9602, currency: 'USD', pay_date: '2026-01-28' },
  { id: 'kepe-2', org_id: 'org-2', payroll_run_id: 'kpr-1', employee_id: 'kemp-2', employee_name: 'Naledi Mabaso', department: 'Consulting', country: 'South Africa', gross_pay: 12500, federal_tax: 1875, state_tax: 625, social_security: 775, medicare: 181, pension: 625, health_insurance: 500, bonus: 0, overtime: 0, other_deductions: 0, total_deductions: 4581, net_pay: 7919, currency: 'USD', pay_date: '2026-01-28' },
  { id: 'kepe-3', org_id: 'org-2', payroll_run_id: 'kpr-1', employee_id: 'kemp-3', employee_name: 'Thierry Mugabo', department: 'Consulting', country: 'Rwanda', gross_pay: 9167, federal_tax: 1375, state_tax: 458, social_security: 568, medicare: 133, pension: 458, health_insurance: 500, bonus: 0, overtime: 0, other_deductions: 0, total_deductions: 3492, net_pay: 5675, currency: 'USD', pay_date: '2026-01-28' },
  { id: 'kepe-4', org_id: 'org-2', payroll_run_id: 'kpr-1', employee_id: 'kemp-6', employee_name: 'Layla Amari', department: 'Strategy', country: 'Morocco', gross_pay: 13333, federal_tax: 2000, state_tax: 667, social_security: 827, medicare: 193, pension: 667, health_insurance: 500, bonus: 0, overtime: 0, other_deductions: 0, total_deductions: 4854, net_pay: 8479, currency: 'USD', pay_date: '2026-01-28' },
  { id: 'kepe-5', org_id: 'org-2', payroll_run_id: 'kpr-1', employee_id: 'kemp-9', employee_name: 'Kagiso Molefe', department: 'Technology Advisory', country: 'South Africa', gross_pay: 12917, federal_tax: 1938, state_tax: 646, social_security: 801, medicare: 187, pension: 646, health_insurance: 500, bonus: 0, overtime: 0, other_deductions: 0, total_deductions: 4718, net_pay: 8199, currency: 'USD', pay_date: '2026-01-28' },
  { id: 'kepe-6', org_id: 'org-2', payroll_run_id: 'kpr-1', employee_id: 'kemp-12', employee_name: 'Zanele Moyo', department: 'People & Culture', country: 'South Africa', gross_pay: 14167, federal_tax: 2125, state_tax: 708, social_security: 878, medicare: 205, pension: 708, health_insurance: 500, bonus: 0, overtime: 0, other_deductions: 0, total_deductions: 5124, net_pay: 9043, currency: 'USD', pay_date: '2026-01-28' },
  { id: 'kepe-7', org_id: 'org-2', payroll_run_id: 'kpr-1', employee_id: 'kemp-13', employee_name: 'Grace Uwimana', department: 'People & Culture', country: 'Rwanda', gross_pay: 6250, federal_tax: 938, state_tax: 313, social_security: 388, medicare: 91, pension: 313, health_insurance: 500, bonus: 0, overtime: 0, other_deductions: 0, total_deductions: 2543, net_pay: 3707, currency: 'USD', pay_date: '2026-01-28' },
  { id: 'kepe-8', org_id: 'org-2', payroll_run_id: 'kpr-1', employee_id: 'kemp-15', employee_name: 'Omar Benhaddou', department: 'Finance & Operations', country: 'Morocco', gross_pay: 14583, federal_tax: 2187, state_tax: 729, social_security: 904, medicare: 211, pension: 729, health_insurance: 500, bonus: 0, overtime: 0, other_deductions: 0, total_deductions: 5260, net_pay: 9323, currency: 'USD', pay_date: '2026-01-28' },
  { id: 'kepe-9', org_id: 'org-2', payroll_run_id: 'kpr-1', employee_id: 'kemp-16', employee_name: 'Thabo Maseko', department: 'Finance & Operations', country: 'South Africa', gross_pay: 9583, federal_tax: 1437, state_tax: 479, social_security: 594, medicare: 139, pension: 479, health_insurance: 500, bonus: 0, overtime: 0, other_deductions: 0, total_deductions: 3628, net_pay: 5955, currency: 'USD', pay_date: '2026-01-28' },
  { id: 'kepe-10', org_id: 'org-2', payroll_run_id: 'kpr-1', employee_id: 'kemp-18', employee_name: 'Anele Zulu', department: 'Business Development', country: 'South Africa', gross_pay: 12500, federal_tax: 1875, state_tax: 625, social_security: 775, medicare: 181, pension: 625, health_insurance: 500, bonus: 0, overtime: 0, other_deductions: 0, total_deductions: 4581, net_pay: 7919, currency: 'USD', pay_date: '2026-01-28' },
]

// Kash Contractor Payments
export const kashContractorPayments = [
  { id: 'kcp-1', org_id: 'org-2', contractor_name: 'Mthembu & Associates', company: 'Mthembu Legal Advisory', service_type: 'Corporate Governance Review', invoice_number: 'KINV-2026-001', amount: 22000, currency: 'USD', status: 'paid' as const, due_date: '2026-01-20', paid_date: '2026-01-18', payment_method: 'bank_transfer' as const, tax_form: 'invoice' as const, country: 'South Africa' },
  { id: 'kcp-2', org_id: 'org-2', contractor_name: 'Kigali Data Labs', company: 'KDL Rwanda Ltd', service_type: 'Data Analytics Platform Setup', invoice_number: 'KINV-2026-002', amount: 35000, currency: 'USD', status: 'paid' as const, due_date: '2026-01-25', paid_date: '2026-01-24', payment_method: 'wire_transfer' as const, tax_form: 'invoice' as const, country: 'Rwanda' },
  { id: 'kcp-3', org_id: 'org-2', contractor_name: 'Atlas Maroc Consulting', company: 'Atlas Maroc SARL', service_type: 'Market Research - North Africa', invoice_number: 'KINV-2026-003', amount: 18500, currency: 'USD', status: 'approved' as const, due_date: '2026-02-15', paid_date: null, payment_method: 'bank_transfer' as const, tax_form: 'invoice' as const, country: 'Morocco' },
]

// Kash Payroll Schedules
export const kashPayrollSchedules = [
  { id: 'kps-1', org_id: 'org-2', name: 'Monthly Salary - All Staff', frequency: 'monthly' as const, next_run_date: '2026-03-25', employee_group: 'All Employees', auto_approve: false, currency: 'USD', status: 'active' as const, last_run_date: '2026-02-25', created_at: '2025-03-01T00:00:00Z' },
  { id: 'kps-2', org_id: 'org-2', name: 'Quarterly Performance Bonus', frequency: 'monthly' as const, next_run_date: '2026-03-31', employee_group: 'All Consultants', auto_approve: false, currency: 'USD', status: 'active' as const, last_run_date: '2025-12-31', created_at: '2025-03-01T00:00:00Z' },
]

// Kash Tax Configurations
export const kashTaxConfigs = [
  { id: 'ktc-1', org_id: 'org-2', country: 'South Africa', tax_type: 'PAYE + UIF + SDL', rate: 28, description: 'Pay-As-You-Earn with Unemployment Insurance Fund and Skills Development Levy', employer_contribution: 2, employee_contribution: 1, effective_date: '2025-01-01', status: 'active' as const },
  { id: 'ktc-2', org_id: 'org-2', country: 'Rwanda', tax_type: 'PAYE + RSSB', rate: 30, description: 'Progressive income tax with Rwanda Social Security Board contributions', employer_contribution: 5, employee_contribution: 5, effective_date: '2025-01-01', status: 'active' as const },
  { id: 'ktc-3', org_id: 'org-2', country: 'Morocco', tax_type: 'IR + CNSS + AMO', rate: 25, description: 'Income tax with social security and mandatory health insurance', employer_contribution: 18.5, employee_contribution: 6.74, effective_date: '2025-01-01', status: 'active' as const },
]

// Kash Compliance Issues
export const kashComplianceIssues = [
  { id: 'kci-1', org_id: 'org-2', type: 'tax_filing' as const, severity: 'warning' as const, country: 'South Africa', description: 'EMP501 bi-annual reconciliation due for the period August 2025 - January 2026 — submission deadline approaching', affected_employees: 10, deadline: '2026-03-31', status: 'open' as const, created_at: '2026-02-18T00:00:00Z' },
  { id: 'kci-2', org_id: 'org-2', type: 'benefits' as const, severity: 'info' as const, country: 'Rwanda', description: 'RSSB contribution schedule updated for 2026 — new rates effective from April need to be reflected in payroll configuration', affected_employees: 0, deadline: '2026-04-01', status: 'open' as const, created_at: '2026-02-12T00:00:00Z' },
]

// Kash Tax Filings
export const kashTaxFilings = [
  { id: 'ktf-1', org_id: 'org-2', country: 'South Africa', form_name: 'EMP201 Monthly Return', description: 'Monthly employer declaration to SARS for PAYE, UIF, and SDL', deadline: '2026-03-07', frequency: 'monthly' as const, status: 'upcoming' as const, filed_date: null, filing_period: 'February 2026' },
  { id: 'ktf-2', org_id: 'org-2', country: 'South Africa', form_name: 'EMP501 Bi-Annual Reconciliation', description: 'Bi-annual reconciliation of employees tax with SARS', deadline: '2026-03-31', frequency: 'annual' as const, status: 'upcoming' as const, filed_date: null, filing_period: 'Aug 2025 - Jan 2026' },
  { id: 'ktf-3', org_id: 'org-2', country: 'Rwanda', form_name: 'Monthly PAYE Declaration', description: 'Monthly PAYE filing with Rwanda Revenue Authority', deadline: '2026-03-15', frequency: 'monthly' as const, status: 'upcoming' as const, filed_date: null, filing_period: 'February 2026' },
  { id: 'ktf-4', org_id: 'org-2', country: 'Morocco', form_name: 'IR Salary Declaration', description: 'Monthly income tax on salaries declaration to DGI', deadline: '2026-03-31', frequency: 'monthly' as const, status: 'filed' as const, filed_date: '2026-02-20', filing_period: 'January 2026' },
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

// Employee Documents
export const demoEmployeeDocuments = [
  { id: 'doc-1', employee_id: 'emp-1', document_type: 'contract', name: 'Employment Contract', status: 'valid' as const, upload_date: '2024-02-15', expiry_date: null, file_size: '245 KB' },
  { id: 'doc-2', employee_id: 'emp-1', document_type: 'id', name: 'National ID', status: 'valid' as const, upload_date: '2024-02-15', expiry_date: '2028-06-30', file_size: '1.2 MB' },
  { id: 'doc-3', employee_id: 'emp-2', document_type: 'contract', name: 'Employment Contract', status: 'valid' as const, upload_date: '2024-03-10', expiry_date: null, file_size: '230 KB' },
  { id: 'doc-4', employee_id: 'emp-3', document_type: 'certificate', name: 'Banking Certification', status: 'expired' as const, upload_date: '2023-01-20', expiry_date: '2025-01-20', file_size: '890 KB' },
  { id: 'doc-5', employee_id: 'emp-5', document_type: 'id', name: 'Passport', status: 'valid' as const, upload_date: '2024-05-01', expiry_date: '2029-05-01', file_size: '1.8 MB' },
  { id: 'doc-6', employee_id: 'emp-9', document_type: 'contract', name: 'Employment Contract', status: 'pending_review' as const, upload_date: '2026-02-01', expiry_date: null, file_size: '260 KB' },
  { id: 'doc-7', employee_id: 'emp-13', document_type: 'certificate', name: 'AWS Solutions Architect', status: 'valid' as const, upload_date: '2025-08-15', expiry_date: '2028-08-15', file_size: '450 KB' },
  { id: 'doc-8', employee_id: 'emp-14', document_type: 'certificate', name: 'PMP Certification', status: 'valid' as const, upload_date: '2025-03-01', expiry_date: '2028-03-01', file_size: '520 KB' },
  { id: 'doc-9', employee_id: 'emp-17', document_type: 'contract', name: 'Executive Employment Agreement', status: 'valid' as const, upload_date: '2024-01-05', expiry_date: null, file_size: '380 KB' },
  { id: 'doc-10', employee_id: 'emp-21', document_type: 'certificate', name: 'Risk Management Certification', status: 'expired' as const, upload_date: '2022-06-15', expiry_date: '2025-06-15', file_size: '670 KB' },
  { id: 'doc-11', employee_id: 'emp-24', document_type: 'id', name: 'International Passport', status: 'valid' as const, upload_date: '2025-01-10', expiry_date: '2030-01-10', file_size: '2.1 MB' },
  { id: 'doc-12', employee_id: 'emp-6', document_type: 'contract', name: 'Employment Contract', status: 'pending_review' as const, upload_date: '2026-01-20', expiry_date: null, file_size: '215 KB' },
  { id: 'doc-13', employee_id: 'emp-18', document_type: 'certificate', name: 'SHRM-CP Certification', status: 'valid' as const, upload_date: '2025-09-01', expiry_date: '2028-09-01', file_size: '340 KB' },
  { id: 'doc-14', employee_id: 'emp-27', document_type: 'id', name: 'Driver License', status: 'valid' as const, upload_date: '2025-04-15', expiry_date: '2030-04-15', file_size: '980 KB' },
  { id: 'doc-15', employee_id: 'emp-10', document_type: 'contract', name: 'Employment Contract', status: 'valid' as const, upload_date: '2024-08-01', expiry_date: null, file_size: '200 KB' },
]

// Employee Timeline
export const demoEmployeeTimeline = [
  { id: 'tl-1', type: 'hire' as const, employee_id: 'emp-30', description: 'Aminata Diop joined as Content Writer', date: '2026-02-10', department: 'Marketing' },
  { id: 'tl-2', type: 'promotion' as const, employee_id: 'emp-2', description: 'Ngozi Okafor promoted to Branch Manager', date: '2026-02-05', department: 'Retail Banking' },
  { id: 'tl-3', type: 'transfer' as const, employee_id: 'emp-8', description: 'James Kamau transferred to Corporate Banking', date: '2026-01-28', department: 'Corporate Banking' },
  { id: 'tl-4', type: 'salary_change' as const, employee_id: 'emp-14', description: 'Yaw Frimpong received salary adjustment (+12%)', date: '2026-01-25', department: 'Technology' },
  { id: 'tl-5', type: 'training' as const, employee_id: 'emp-19', description: 'Moussa Sow completed Leadership Development Program', date: '2026-01-20', department: 'Human Resources' },
  { id: 'tl-6', type: 'hire' as const, employee_id: 'emp-29', description: 'Tunde Bakare joined as Brand Designer', date: '2026-01-15', department: 'Marketing' },
  { id: 'tl-7', type: 'promotion' as const, employee_id: 'emp-20', description: 'Ama Darko promoted to HR Business Partner', date: '2026-01-10', department: 'Human Resources' },
  { id: 'tl-8', type: 'salary_change' as const, employee_id: 'emp-6', description: 'Fatou Ndiaye received performance bonus', date: '2026-01-08', department: 'Corporate Banking' },
  { id: 'tl-9', type: 'training' as const, employee_id: 'emp-15', description: 'Brian Otieno completed AWS DevOps certification', date: '2026-01-05', department: 'Technology' },
  { id: 'tl-10', type: 'transfer' as const, employee_id: 'emp-23', description: 'Grace Wambui transferred to Risk & Compliance', date: '2025-12-18', department: 'Risk & Compliance' },
  { id: 'tl-11', type: 'hire' as const, employee_id: 'emp-28', description: 'Peter Njoroge joined as Digital Marketing Lead', date: '2025-12-10', department: 'Marketing' },
  { id: 'tl-12', type: 'promotion' as const, employee_id: 'emp-22', description: 'Ousmane Ba promoted to Compliance Manager', date: '2025-12-05', department: 'Risk & Compliance' },
  { id: 'tl-13', type: 'salary_change' as const, employee_id: 'emp-3', description: 'Kwame Asante annual salary review completed', date: '2025-11-28', department: 'Retail Banking' },
  { id: 'tl-14', type: 'training' as const, employee_id: 'emp-16', description: 'Adaeze Ikechukwu completed UX Research Bootcamp', date: '2025-11-20', department: 'Technology' },
  { id: 'tl-15', type: 'hire' as const, employee_id: 'emp-26', description: 'Akosua Owusu joined as Accountant', date: '2025-11-15', department: 'Finance' },
]

// Survey Questions
export const demoSurveyQuestions = [
  { id: 'sq-1', survey_id: 'survey-1', question_text: 'I feel valued and recognized for my contributions at Ecobank', type: 'rating' as const, category: 'culture' as const, required: true },
  { id: 'sq-2', survey_id: 'survey-1', question_text: 'My manager provides clear direction and regular feedback', type: 'rating' as const, category: 'leadership' as const, required: true },
  { id: 'sq-3', survey_id: 'survey-1', question_text: 'I have adequate opportunities for professional growth and development', type: 'rating' as const, category: 'growth' as const, required: true },
  { id: 'sq-4', survey_id: 'survey-1', question_text: 'I am able to maintain a healthy work-life balance', type: 'rating' as const, category: 'worklife' as const, required: true },
  { id: 'sq-5', survey_id: 'survey-1', question_text: 'I am fairly compensated for the work I do', type: 'rating' as const, category: 'compensation' as const, required: true },
  { id: 'sq-6', survey_id: 'survey-1', question_text: 'What is the most important thing Ecobank can improve?', type: 'open_text' as const, category: 'culture' as const, required: false },
  { id: 'sq-7', survey_id: 'survey-2', question_text: 'On a scale of 0-10, how likely are you to recommend Ecobank as a place to work?', type: 'nps' as const, category: 'culture' as const, required: true },
  { id: 'sq-8', survey_id: 'survey-2', question_text: 'I feel the leadership team communicates a clear vision for the future', type: 'rating' as const, category: 'leadership' as const, required: true },
  { id: 'sq-9', survey_id: 'survey-2', question_text: 'I have access to the tools and resources I need to do my job well', type: 'rating' as const, category: 'wellbeing' as const, required: true },
  { id: 'sq-10', survey_id: 'survey-3', question_text: 'Overall, how satisfied are you with your experience at Ecobank?', type: 'rating' as const, category: 'culture' as const, required: true },
  { id: 'sq-11', survey_id: 'survey-3', question_text: 'My team collaborates effectively across departments and countries', type: 'rating' as const, category: 'culture' as const, required: true },
  { id: 'sq-12', survey_id: 'survey-3', question_text: 'Which area would most improve your daily work experience?', type: 'multiple_choice' as const, category: 'wellbeing' as const, required: true },
  { id: 'sq-13', survey_id: 'survey-3', question_text: 'I believe Ecobank invests in my long-term career development', type: 'rating' as const, category: 'growth' as const, required: true },
  { id: 'sq-14', survey_id: 'survey-3', question_text: 'The benefits and wellness programs meet my needs', type: 'rating' as const, category: 'compensation' as const, required: true },
  { id: 'sq-15', survey_id: 'survey-3', question_text: 'What additional feedback would you like to share?', type: 'open_text' as const, category: 'culture' as const, required: false },
]

// Shifts
export const demoShifts = [
  { id: 'sh-1', employee_id: 'emp-4', date: '2026-02-24', start_time: '08:00', end_time: '16:00', type: 'regular' as const, hours: 8, status: 'completed' as const },
  { id: 'sh-2', employee_id: 'emp-4', date: '2026-02-25', start_time: '08:00', end_time: '16:00', type: 'regular' as const, hours: 8, status: 'scheduled' as const },
  { id: 'sh-3', employee_id: 'emp-10', date: '2026-02-24', start_time: '09:00', end_time: '17:00', type: 'regular' as const, hours: 8, status: 'completed' as const },
  { id: 'sh-4', employee_id: 'emp-12', date: '2026-02-22', start_time: '09:00', end_time: '21:00', type: 'overtime' as const, hours: 12, status: 'completed' as const },
  { id: 'sh-5', employee_id: 'emp-15', date: '2026-02-24', start_time: '09:00', end_time: '17:00', type: 'remote' as const, hours: 8, status: 'completed' as const },
  { id: 'sh-6', employee_id: 'emp-23', date: '2026-02-23', start_time: '18:00', end_time: '06:00', type: 'on_call' as const, hours: 12, status: 'completed' as const },
  { id: 'sh-7', employee_id: 'emp-26', date: '2026-02-24', start_time: '08:30', end_time: '17:30', type: 'regular' as const, hours: 9, status: 'completed' as const },
  { id: 'sh-8', employee_id: 'emp-11', date: '2026-02-25', start_time: '08:00', end_time: '16:00', type: 'regular' as const, hours: 8, status: 'scheduled' as const },
  { id: 'sh-9', employee_id: 'emp-16', date: '2026-02-21', start_time: '09:00', end_time: '17:00', type: 'remote' as const, hours: 8, status: 'completed' as const },
  { id: 'sh-10', employee_id: 'emp-29', date: '2026-02-24', start_time: '08:00', end_time: '12:00', type: 'regular' as const, hours: 4, status: 'missed' as const },
]

// Timesheet Entries
export const demoTimesheetEntries = [
  { id: 'ts-1', employee_id: 'emp-1', week_start: '2026-02-17', mon_hours: 9, tue_hours: 8.5, wed_hours: 9, thu_hours: 8, fri_hours: 7.5, total_hours: 42, status: 'approved' as const, overtime_hours: 2 },
  { id: 'ts-2', employee_id: 'emp-2', week_start: '2026-02-17', mon_hours: 8, tue_hours: 8, wed_hours: 8, thu_hours: 8, fri_hours: 8, total_hours: 40, status: 'approved' as const, overtime_hours: 0 },
  { id: 'ts-3', employee_id: 'emp-3', week_start: '2026-02-17', mon_hours: 8, tue_hours: 8, wed_hours: 8.5, thu_hours: 8, fri_hours: 7.5, total_hours: 40, status: 'approved' as const, overtime_hours: 0 },
  { id: 'ts-4', employee_id: 'emp-4', week_start: '2026-02-17', mon_hours: 8, tue_hours: 8, wed_hours: 8, thu_hours: 8, fri_hours: 8, total_hours: 40, status: 'approved' as const, overtime_hours: 0 },
  { id: 'ts-5', employee_id: 'emp-5', week_start: '2026-02-17', mon_hours: 9, tue_hours: 9, wed_hours: 10, thu_hours: 9, fri_hours: 8, total_hours: 45, status: 'approved' as const, overtime_hours: 5 },
  { id: 'ts-6', employee_id: 'emp-6', week_start: '2026-02-17', mon_hours: 8, tue_hours: 8, wed_hours: 8, thu_hours: 9, fri_hours: 8, total_hours: 41, status: 'approved' as const, overtime_hours: 1 },
  { id: 'ts-7', employee_id: 'emp-9', week_start: '2026-02-17', mon_hours: 8.5, tue_hours: 8.5, wed_hours: 8, thu_hours: 8, fri_hours: 8, total_hours: 41, status: 'approved' as const, overtime_hours: 1 },
  { id: 'ts-8', employee_id: 'emp-10', week_start: '2026-02-17', mon_hours: 8, tue_hours: 8, wed_hours: 8, thu_hours: 8, fri_hours: 8, total_hours: 40, status: 'submitted' as const, overtime_hours: 0 },
  { id: 'ts-9', employee_id: 'emp-11', week_start: '2026-02-17', mon_hours: 8, tue_hours: 8, wed_hours: 9, thu_hours: 8, fri_hours: 8, total_hours: 41, status: 'submitted' as const, overtime_hours: 1 },
  { id: 'ts-10', employee_id: 'emp-12', week_start: '2026-02-17', mon_hours: 8, tue_hours: 8, wed_hours: 8, thu_hours: 12, fri_hours: 8, total_hours: 44, status: 'approved' as const, overtime_hours: 4 },
  { id: 'ts-11', employee_id: 'emp-13', week_start: '2026-02-17', mon_hours: 9, tue_hours: 9, wed_hours: 9, thu_hours: 9, fri_hours: 8, total_hours: 44, status: 'approved' as const, overtime_hours: 4 },
  { id: 'ts-12', employee_id: 'emp-14', week_start: '2026-02-17', mon_hours: 8, tue_hours: 8, wed_hours: 10, thu_hours: 8, fri_hours: 8, total_hours: 42, status: 'approved' as const, overtime_hours: 2 },
  { id: 'ts-13', employee_id: 'emp-15', week_start: '2026-02-17', mon_hours: 8, tue_hours: 8, wed_hours: 8, thu_hours: 8, fri_hours: 8, total_hours: 40, status: 'approved' as const, overtime_hours: 0 },
  { id: 'ts-14', employee_id: 'emp-16', week_start: '2026-02-17', mon_hours: 8, tue_hours: 8, wed_hours: 8, thu_hours: 8, fri_hours: 0, total_hours: 32, status: 'submitted' as const, overtime_hours: 0 },
  { id: 'ts-15', employee_id: 'emp-17', week_start: '2026-02-17', mon_hours: 8.5, tue_hours: 8, wed_hours: 8, thu_hours: 8.5, fri_hours: 8, total_hours: 41, status: 'approved' as const, overtime_hours: 1 },
  { id: 'ts-16', employee_id: 'emp-18', week_start: '2026-02-17', mon_hours: 8, tue_hours: 8, wed_hours: 8, thu_hours: 8, fri_hours: 8, total_hours: 40, status: 'approved' as const, overtime_hours: 0 },
  { id: 'ts-17', employee_id: 'emp-19', week_start: '2026-02-17', mon_hours: 8, tue_hours: 8, wed_hours: 8, thu_hours: 8, fri_hours: 8, total_hours: 40, status: 'draft' as const, overtime_hours: 0 },
  { id: 'ts-18', employee_id: 'emp-20', week_start: '2026-02-17', mon_hours: 8, tue_hours: 8, wed_hours: 8, thu_hours: 8, fri_hours: 8, total_hours: 40, status: 'approved' as const, overtime_hours: 0 },
  { id: 'ts-19', employee_id: 'emp-21', week_start: '2026-02-17', mon_hours: 9, tue_hours: 9, wed_hours: 8, thu_hours: 8, fri_hours: 8, total_hours: 42, status: 'approved' as const, overtime_hours: 2 },
  { id: 'ts-20', employee_id: 'emp-22', week_start: '2026-02-17', mon_hours: 8, tue_hours: 8, wed_hours: 8, thu_hours: 8, fri_hours: 8, total_hours: 40, status: 'approved' as const, overtime_hours: 0 },
  { id: 'ts-21', employee_id: 'emp-23', week_start: '2026-02-17', mon_hours: 8, tue_hours: 8, wed_hours: 8, thu_hours: 8, fri_hours: 12, total_hours: 44, status: 'submitted' as const, overtime_hours: 4 },
  { id: 'ts-22', employee_id: 'emp-24', week_start: '2026-02-17', mon_hours: 9, tue_hours: 9, wed_hours: 9, thu_hours: 9, fri_hours: 8, total_hours: 44, status: 'approved' as const, overtime_hours: 4 },
  { id: 'ts-23', employee_id: 'emp-25', week_start: '2026-02-17', mon_hours: 8, tue_hours: 8, wed_hours: 8, thu_hours: 8, fri_hours: 8, total_hours: 40, status: 'approved' as const, overtime_hours: 0 },
  { id: 'ts-24', employee_id: 'emp-26', week_start: '2026-02-17', mon_hours: 8.5, tue_hours: 8, wed_hours: 8, thu_hours: 8.5, fri_hours: 8, total_hours: 41, status: 'approved' as const, overtime_hours: 1 },
  { id: 'ts-25', employee_id: 'emp-27', week_start: '2026-02-17', mon_hours: 8, tue_hours: 8, wed_hours: 8, thu_hours: 8, fri_hours: 8, total_hours: 40, status: 'approved' as const, overtime_hours: 0 },
  { id: 'ts-26', employee_id: 'emp-28', week_start: '2026-02-17', mon_hours: 8, tue_hours: 8, wed_hours: 8, thu_hours: 8, fri_hours: 8, total_hours: 40, status: 'submitted' as const, overtime_hours: 0 },
  { id: 'ts-27', employee_id: 'emp-29', week_start: '2026-02-17', mon_hours: 8, tue_hours: 8, wed_hours: 8, thu_hours: 8, fri_hours: 4, total_hours: 36, status: 'draft' as const, overtime_hours: 0 },
  { id: 'ts-28', employee_id: 'emp-30', week_start: '2026-02-17', mon_hours: 8, tue_hours: 8, wed_hours: 8, thu_hours: 8, fri_hours: 8, total_hours: 40, status: 'approved' as const, overtime_hours: 0 },
  { id: 'ts-29', employee_id: 'emp-7', week_start: '2026-02-17', mon_hours: 8, tue_hours: 8, wed_hours: 8, thu_hours: 8, fri_hours: 8, total_hours: 40, status: 'approved' as const, overtime_hours: 0 },
  { id: 'ts-30', employee_id: 'emp-8', week_start: '2026-02-17', mon_hours: 8, tue_hours: 8, wed_hours: 9, thu_hours: 8, fri_hours: 8, total_hours: 41, status: 'submitted' as const, overtime_hours: 1 },
]

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
// COURSE BUILDER BLOCKS
// ============================================================

export const demoCourseBlocks = [
  { id: 'block-1', course_id: 'course-1', module_index: 0, order: 0, type: 'text' as const, title: 'Welcome & Course Overview', content: 'This module introduces the core principles of effective leadership. You will learn about different leadership styles and when to apply them.', duration_minutes: 15, status: 'published' as const },
  { id: 'block-2', course_id: 'course-1', module_index: 0, order: 1, type: 'video' as const, title: 'Leadership Styles Explained', content: 'https://videos.tempo.com/leadership-styles.mp4', duration_minutes: 20, status: 'published' as const },
  { id: 'block-3', course_id: 'course-1', module_index: 0, order: 2, type: 'quiz' as const, title: 'Module 1 Check-in Quiz', content: 'quiz-q1,quiz-q2,quiz-q3', duration_minutes: 10, status: 'published' as const },
  { id: 'block-4', course_id: 'course-1', module_index: 1, order: 0, type: 'text' as const, title: 'Communication Frameworks', content: 'Effective leaders communicate with clarity. This section covers active listening, feedback loops, and stakeholder communication strategies.', duration_minutes: 20, status: 'published' as const },
  { id: 'block-5', course_id: 'course-1', module_index: 1, order: 1, type: 'interactive' as const, title: 'Feedback Role-Play Simulation', content: 'Interactive scenario where you practice giving constructive feedback to a team member.', duration_minutes: 25, status: 'published' as const },
  { id: 'block-6', course_id: 'course-1', module_index: 1, order: 2, type: 'download' as const, title: 'Communication Toolkit PDF', content: 'https://docs.tempo.com/communication-toolkit.pdf', duration_minutes: 5, status: 'published' as const },
  { id: 'block-7', course_id: 'course-1', module_index: 2, order: 0, type: 'video' as const, title: 'Delegation Best Practices', content: 'https://videos.tempo.com/delegation.mp4', duration_minutes: 18, status: 'draft' as const },
  { id: 'block-8', course_id: 'course-1', module_index: 2, order: 1, type: 'text' as const, title: 'Building High-Performance Teams', content: 'Learn how to build trust, establish psychological safety, and create a culture of accountability within your team.', duration_minutes: 22, status: 'draft' as const },
  { id: 'block-9', course_id: 'course-4', module_index: 0, order: 0, type: 'text' as const, title: 'What is Digital Banking?', content: 'An introduction to digital banking concepts, fintech disruption, and the evolution of banking platforms.', duration_minutes: 15, status: 'published' as const },
  { id: 'block-10', course_id: 'course-4', module_index: 0, order: 1, type: 'interactive' as const, title: 'API Explorer Sandbox', content: 'Hands-on sandbox environment to explore banking APIs and test endpoints.', duration_minutes: 30, status: 'published' as const },
]

// ============================================================
// QUIZ / ASSESSMENT QUESTIONS
// ============================================================

export const demoQuizQuestions = [
  { id: 'quiz-q1', org_id: 'org-1', course_id: 'course-1', type: 'multiple_choice' as const, question: 'Which leadership style emphasizes shared decision-making and team input?', options: ['Autocratic', 'Democratic', 'Laissez-faire', 'Transactional'] as string[], correct_answer: 'Democratic', points: 10, explanation: 'Democratic leadership involves team members in the decision-making process, fostering engagement and ownership.' },
  { id: 'quiz-q2', org_id: 'org-1', course_id: 'course-1', type: 'true_false' as const, question: 'Transformational leaders focus primarily on maintaining the status quo.', options: ['True', 'False'] as string[], correct_answer: 'False', points: 5, explanation: 'Transformational leaders inspire change and innovation, going beyond maintaining existing processes.' },
  { id: 'quiz-q3', org_id: 'org-1', course_id: 'course-1', type: 'fill_blank' as const, question: 'The leadership framework that focuses on adapting style based on team maturity is called _____ Leadership.', options: [] as string[], correct_answer: 'Situational', points: 10, explanation: 'Situational Leadership, developed by Hersey and Blanchard, adjusts the leadership approach based on follower readiness.' },
  { id: 'quiz-q4', org_id: 'org-1', course_id: 'course-2', type: 'multiple_choice' as const, question: 'What does AML stand for in banking compliance?', options: ['Anti-Money Laundering', 'Automated Market Lending', 'Asset Management Liability', 'Account Monitoring Legislation'] as string[], correct_answer: 'Anti-Money Laundering', points: 10, explanation: 'AML stands for Anti-Money Laundering, a set of regulations designed to prevent financial crimes.' },
  { id: 'quiz-q5', org_id: 'org-1', course_id: 'course-2', type: 'matching' as const, question: 'Match each compliance term with its definition.', options: ['KYC:Know Your Customer', 'SAR:Suspicious Activity Report', 'PEP:Politically Exposed Person', 'CTR:Currency Transaction Report'] as string[], correct_answer: 'KYC:Know Your Customer,SAR:Suspicious Activity Report,PEP:Politically Exposed Person,CTR:Currency Transaction Report', points: 20, explanation: 'These are fundamental compliance terms that every banking professional should know.' },
  { id: 'quiz-q6', org_id: 'org-1', course_id: 'course-4', type: 'multiple_choice' as const, question: 'Which API architecture style is most commonly used in modern banking platforms?', options: ['SOAP', 'REST', 'GraphQL', 'gRPC'] as string[], correct_answer: 'REST', points: 10, explanation: 'REST APIs are the most widely adopted standard in open banking and fintech integrations.' },
  { id: 'quiz-q7', org_id: 'org-1', course_id: 'course-4', type: 'essay' as const, question: 'Describe three key security considerations when designing a digital banking API.', options: [] as string[], correct_answer: '', points: 25, explanation: 'Responses should cover authentication (OAuth2/mTLS), encryption (TLS 1.3), and rate limiting/DDoS protection.' },
  { id: 'quiz-q8', org_id: 'org-1', course_id: 'course-3', type: 'true_false' as const, question: 'A higher debt-to-equity ratio always indicates a riskier credit profile.', options: ['True', 'False'] as string[], correct_answer: 'False', points: 5, explanation: 'Context matters: capital-intensive industries typically carry higher leverage. The ratio must be evaluated relative to industry norms.' },
]

// ============================================================
// SOCIAL LEARNING - DISCUSSIONS
// ============================================================

export const demoDiscussions = [
  { id: 'disc-1', org_id: 'org-1', course_id: 'course-1' as string | null, author_id: 'emp-2', title: 'How do you handle resistance to change in your team?', content: 'I have been implementing new processes in my branch and facing pushback from experienced staff. What strategies have worked for you?', replies: 8, likes: 14, created_at: '2026-02-20T09:00:00Z', tags: ['leadership', 'change-management'] as string[] },
  { id: 'disc-2', org_id: 'org-1', course_id: 'course-2' as string | null, author_id: 'emp-22', title: 'New UEMOA AML guidelines - key changes summary', content: 'Just reviewed the updated UEMOA AML framework. Here are the 5 most impactful changes for our compliance processes.', replies: 12, likes: 23, created_at: '2026-02-18T14:30:00Z', tags: ['compliance', 'uemoa', 'aml'] as string[] },
  { id: 'disc-3', org_id: 'org-1', course_id: 'course-4' as string | null, author_id: 'emp-14', title: 'Best practices for API versioning in banking', content: 'What versioning strategy does your team use for banking APIs? We are debating between URL path versioning and header-based versioning.', replies: 6, likes: 9, created_at: '2026-02-15T11:00:00Z', tags: ['technology', 'api', 'best-practices'] as string[] },
  { id: 'disc-4', org_id: 'org-1', course_id: 'course-5' as string | null, author_id: 'emp-3', title: 'Customer complaint resolution - share your success stories', content: 'Let us build a knowledge base of successful complaint resolutions. I will start: a client was unhappy about a delayed transfer and we turned it around by...', replies: 15, likes: 31, created_at: '2026-02-12T16:00:00Z', tags: ['customer-service', 'stories'] as string[] },
  { id: 'disc-5', org_id: 'org-1', course_id: 'course-7' as string | null, author_id: 'emp-11', title: 'Adapting Agile to banking operations', content: 'Traditional agile was designed for software teams. How have you adapted agile principles for non-tech banking operations?', replies: 4, likes: 7, created_at: '2026-02-10T08:45:00Z', tags: ['agile', 'operations'] as string[] },
  { id: 'disc-6', org_id: 'org-1', course_id: null as string | null, author_id: 'emp-19', title: 'Monthly Learning Challenge: February - Read 2 Articles on AI in Banking', content: 'This month, the challenge is to read 2 articles about AI applications in banking and share your key takeaways in the replies.', replies: 22, likes: 45, created_at: '2026-02-01T07:00:00Z', tags: ['challenge', 'ai', 'learning'] as string[] },
]

// ============================================================
// SOCIAL LEARNING - STUDY GROUPS
// ============================================================

export const demoStudyGroups = [
  { id: 'sg-1', org_id: 'org-1', name: 'Future Leaders Circle', description: 'A peer learning group for aspiring managers preparing for leadership roles', course_id: 'course-1', member_ids: ['emp-2', 'emp-3', 'emp-6', 'emp-11', 'emp-18'] as string[], max_members: 10, created_by: 'emp-17', created_at: '2026-01-15T00:00:00Z', next_meeting: '2026-03-01T10:00:00Z', meeting_frequency: 'biweekly' as const },
  { id: 'sg-2', org_id: 'org-1', name: 'Tech Innovation Lab', description: 'Engineers and tech enthusiasts exploring new banking technologies together', course_id: 'course-4', member_ids: ['emp-14', 'emp-15', 'emp-16', 'emp-13'] as string[], max_members: 8, created_by: 'emp-13', created_at: '2026-01-20T00:00:00Z', next_meeting: '2026-02-28T14:00:00Z', meeting_frequency: 'weekly' as const },
  { id: 'sg-3', org_id: 'org-1', name: 'Compliance Champions', description: 'Cross-departmental group staying ahead of regulatory changes and sharing compliance knowledge', course_id: 'course-2', member_ids: ['emp-22', 'emp-23', 'emp-20', 'emp-7', 'emp-25', 'emp-26'] as string[], max_members: 12, created_by: 'emp-21', created_at: '2026-02-01T00:00:00Z', next_meeting: '2026-03-05T11:00:00Z', meeting_frequency: 'monthly' as const },
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
// KASH - NEW MODULE DATA
// ============================================================

// Kash Benefit Enrollments
export const kashBenefitEnrollments = [
  { id: 'kbenr-1', employee_id: 'kemp-1', plan_id: 'kbp-1', enrolled_date: '2025-01-15', status: 'active' as const, dependents_count: 2, monthly_cost: 180, coverage_level: 'family' as const },
  { id: 'kbenr-2', employee_id: 'kemp-2', plan_id: 'kbp-1', enrolled_date: '2025-01-15', status: 'active' as const, dependents_count: 1, monthly_cost: 180, coverage_level: 'employee_spouse' as const },
  { id: 'kbenr-3', employee_id: 'kemp-3', plan_id: 'kbp-2', enrolled_date: '2025-02-01', status: 'active' as const, dependents_count: 0, monthly_cost: 0, coverage_level: 'employee' as const },
  { id: 'kbenr-4', employee_id: 'kemp-6', plan_id: 'kbp-1', enrolled_date: '2025-01-15', status: 'active' as const, dependents_count: 0, monthly_cost: 180, coverage_level: 'employee' as const },
  { id: 'kbenr-5', employee_id: 'kemp-9', plan_id: 'kbp-3', enrolled_date: '2025-01-15', status: 'active' as const, dependents_count: 1, monthly_cost: 0, coverage_level: 'employee_spouse' as const },
  { id: 'kbenr-6', employee_id: 'kemp-12', plan_id: 'kbp-1', enrolled_date: '2025-01-15', status: 'active' as const, dependents_count: 2, monthly_cost: 180, coverage_level: 'family' as const },
  { id: 'kbenr-7', employee_id: 'kemp-15', plan_id: 'kbp-2', enrolled_date: '2025-01-15', status: 'active' as const, dependents_count: 0, monthly_cost: 0, coverage_level: 'employee' as const },
  { id: 'kbenr-8', employee_id: 'kemp-18', plan_id: 'kbp-1', enrolled_date: '2025-03-01', status: 'pending' as const, dependents_count: 0, monthly_cost: 180, coverage_level: 'employee' as const },
]

// Kash Benefit Dependents
export const kashBenefitDependents = [
  { id: 'kbdep-1', employee_id: 'kemp-1', name: 'Thandiwe Ndlovu', relationship: 'spouse' as const, date_of_birth: '1987-06-15', plan_ids: ['kbp-1', 'kbp-3'] },
  { id: 'kbdep-2', employee_id: 'kemp-1', name: 'Zama Ndlovu', relationship: 'child' as const, date_of_birth: '2016-03-20', plan_ids: ['kbp-1'] },
  { id: 'kbdep-3', employee_id: 'kemp-2', name: 'Mandla Mabaso', relationship: 'spouse' as const, date_of_birth: '1985-09-08', plan_ids: ['kbp-1'] },
  { id: 'kbdep-4', employee_id: 'kemp-9', name: 'Thandi Molefe', relationship: 'spouse' as const, date_of_birth: '1988-01-25', plan_ids: ['kbp-3'] },
  { id: 'kbdep-5', employee_id: 'kemp-12', name: 'Sizwe Moyo', relationship: 'spouse' as const, date_of_birth: '1986-11-12', plan_ids: ['kbp-1'] },
]

// Kash Life Events
export const kashLifeEvents = [
  { id: 'kle-1', employee_id: 'kemp-5', type: 'marriage' as const, event_date: '2026-01-28', status: 'processed' as const, benefit_changes: 'Added spouse to Discovery Health Premium plan kbp-1', qualifying_deadline: '2026-03-28' },
  { id: 'kle-2', employee_id: 'kemp-14', type: 'birth' as const, event_date: '2026-02-10', status: 'pending' as const, benefit_changes: 'Request to add newborn to medical plan kbp-1, update coverage to family', qualifying_deadline: '2026-04-10' },
  { id: 'kle-3', employee_id: 'kemp-10', type: 'adoption' as const, event_date: '2025-12-15', status: 'processed' as const, benefit_changes: 'Added adopted child to medical coverage, updated life insurance beneficiary', qualifying_deadline: '2026-02-15' },
]

// Kash Employee Documents
export const kashEmployeeDocuments = [
  { id: 'kdoc-1', employee_id: 'kemp-1', document_type: 'contract', name: 'Executive Employment Agreement', status: 'valid' as const, upload_date: '2024-06-15', expiry_date: null, file_size: '310 KB' },
  { id: 'kdoc-2', employee_id: 'kemp-2', document_type: 'contract', name: 'Partnership Agreement', status: 'valid' as const, upload_date: '2024-06-15', expiry_date: null, file_size: '425 KB' },
  { id: 'kdoc-3', employee_id: 'kemp-3', document_type: 'id', name: 'Rwandan National ID', status: 'valid' as const, upload_date: '2024-07-01', expiry_date: '2029-07-01', file_size: '1.1 MB' },
  { id: 'kdoc-4', employee_id: 'kemp-6', document_type: 'certificate', name: 'MBA Certificate - HEC Paris', status: 'valid' as const, upload_date: '2024-08-15', expiry_date: null, file_size: '780 KB' },
  { id: 'kdoc-5', employee_id: 'kemp-9', document_type: 'certificate', name: 'AWS Cloud Practitioner', status: 'valid' as const, upload_date: '2025-05-20', expiry_date: '2028-05-20', file_size: '450 KB' },
  { id: 'kdoc-6', employee_id: 'kemp-12', document_type: 'contract', name: 'Employment Contract', status: 'pending_review' as const, upload_date: '2026-01-15', expiry_date: null, file_size: '285 KB' },
]

// Kash Employee Timeline
export const kashEmployeeTimeline = [
  { id: 'ktl-1', type: 'hire' as const, employee_id: 'kemp-20', description: 'Kwame Osei joined as BD Associate', date: '2026-02-01', department: 'Business Development' },
  { id: 'ktl-2', type: 'promotion' as const, employee_id: 'kemp-3', description: 'Thierry Mugabo promoted to Engagement Manager', date: '2026-01-15', department: 'Consulting' },
  { id: 'ktl-3', type: 'salary_change' as const, employee_id: 'kemp-4', description: 'Nadia Joubert received performance-based salary adjustment (+8%)', date: '2026-01-10', department: 'Consulting' },
  { id: 'ktl-4', type: 'training' as const, employee_id: 'kemp-10', description: 'Jean-Pierre Habimana completed Azure Solutions Architect certification', date: '2025-12-20', department: 'Technology Advisory' },
  { id: 'ktl-5', type: 'hire' as const, employee_id: 'kemp-19', description: 'Hassan Tazi joined as BD Manager', date: '2025-11-01', department: 'Business Development' },
  { id: 'ktl-6', type: 'transfer' as const, employee_id: 'kemp-8', description: 'Youssef Benali transferred to Casablanca office from Rabat', date: '2025-10-15', department: 'Strategy' },
  { id: 'ktl-7', type: 'promotion' as const, employee_id: 'kemp-7', description: 'Pieter van der Merwe promoted to Strategy Manager', date: '2025-09-01', department: 'Strategy' },
  { id: 'ktl-8', type: 'salary_change' as const, employee_id: 'kemp-10', description: 'Jean-Pierre Habimana annual compensation review', date: '2025-08-15', department: 'Technology Advisory' },
  { id: 'ktl-9', type: 'hire' as const, employee_id: 'kemp-14', description: 'Lerato Dlamini joined as People Coordinator', date: '2025-07-01', department: 'People & Culture' },
  { id: 'ktl-10', type: 'training' as const, employee_id: 'kemp-5', description: 'Amina Rwigema completed Consulting Foundations program', date: '2025-06-15', department: 'Consulting' },
]

// Kash Survey Questions
export const kashSurveyQuestions = [
  { id: 'ksq-1', survey_id: 'ksurvey-1', question_text: 'I feel valued for my contributions to client engagements', type: 'rating' as const, category: 'culture' as const, required: true },
  { id: 'ksq-2', survey_id: 'ksurvey-1', question_text: 'My project lead provides clear direction and regular feedback', type: 'rating' as const, category: 'leadership' as const, required: true },
  { id: 'ksq-3', survey_id: 'ksurvey-1', question_text: 'I have opportunities for career advancement at Kash & Co', type: 'rating' as const, category: 'growth' as const, required: true },
  { id: 'ksq-4', survey_id: 'ksurvey-1', question_text: 'I can maintain work-life balance despite client demands', type: 'rating' as const, category: 'worklife' as const, required: true },
  { id: 'ksq-5', survey_id: 'ksurvey-1', question_text: 'My compensation is competitive for the consulting industry in Africa', type: 'rating' as const, category: 'compensation' as const, required: true },
  { id: 'ksq-6', survey_id: 'ksurvey-1', question_text: 'What would most improve your experience at Kash & Co?', type: 'open_text' as const, category: 'culture' as const, required: false },
  { id: 'ksq-7', survey_id: 'ksurvey-2', question_text: 'On a scale of 0-10, how likely are you to recommend Kash & Co as a place to work?', type: 'nps' as const, category: 'culture' as const, required: true },
  { id: 'ksq-8', survey_id: 'ksurvey-2', question_text: 'The firm leadership communicates a clear strategic vision', type: 'rating' as const, category: 'leadership' as const, required: true },
  { id: 'ksq-9', survey_id: 'ksurvey-2', question_text: 'I have access to the tools and data I need for client work', type: 'rating' as const, category: 'wellbeing' as const, required: true },
  { id: 'ksq-10', survey_id: 'ksurvey-1', question_text: 'Cross-office collaboration works well across our three locations', type: 'rating' as const, category: 'culture' as const, required: true },
]

// Kash Survey Responses
export const kashSurveyResponses = [
  { id: 'ksr-resp-1', survey_id: 'ksurvey-1', question_id: 'ksq-1', employee_id: 'anonymous', value: 5 as number | string, submitted_at: '2026-01-20T09:00:00Z' },
  { id: 'ksr-resp-2', survey_id: 'ksurvey-1', question_id: 'ksq-2', employee_id: 'anonymous', value: 4 as number | string, submitted_at: '2026-01-20T09:00:00Z' },
  { id: 'ksr-resp-3', survey_id: 'ksurvey-1', question_id: 'ksq-3', employee_id: 'anonymous', value: 4 as number | string, submitted_at: '2026-01-20T09:00:00Z' },
  { id: 'ksr-resp-4', survey_id: 'ksurvey-1', question_id: 'ksq-4', employee_id: 'anonymous', value: 3 as number | string, submitted_at: '2026-01-21T10:30:00Z' },
  { id: 'ksr-resp-5', survey_id: 'ksurvey-1', question_id: 'ksq-5', employee_id: 'anonymous', value: 4 as number | string, submitted_at: '2026-01-21T10:30:00Z' },
  { id: 'ksr-resp-6', survey_id: 'ksurvey-1', question_id: 'ksq-6', employee_id: 'anonymous', value: 'More structured career paths and clearer path to partnership' as number | string, submitted_at: '2026-01-21T10:30:00Z' },
  { id: 'ksr-resp-7', survey_id: 'ksurvey-1', question_id: 'ksq-1', employee_id: 'anonymous', value: 4 as number | string, submitted_at: '2026-01-22T14:00:00Z' },
  { id: 'ksr-resp-8', survey_id: 'ksurvey-1', question_id: 'ksq-2', employee_id: 'anonymous', value: 5 as number | string, submitted_at: '2026-01-22T14:00:00Z' },
  { id: 'ksr-resp-9', survey_id: 'ksurvey-1', question_id: 'ksq-3', employee_id: 'anonymous', value: 3 as number | string, submitted_at: '2026-01-23T09:15:00Z' },
  { id: 'ksr-resp-10', survey_id: 'ksurvey-1', question_id: 'ksq-4', employee_id: 'anonymous', value: 2 as number | string, submitted_at: '2026-01-23T09:15:00Z' },
  { id: 'ksr-resp-11', survey_id: 'ksurvey-2', question_id: 'ksq-7', employee_id: 'anonymous', value: 9 as number | string, submitted_at: '2026-02-05T09:00:00Z' },
  { id: 'ksr-resp-12', survey_id: 'ksurvey-2', question_id: 'ksq-8', employee_id: 'anonymous', value: 4 as number | string, submitted_at: '2026-02-05T09:00:00Z' },
  { id: 'ksr-resp-13', survey_id: 'ksurvey-2', question_id: 'ksq-9', employee_id: 'anonymous', value: 4 as number | string, submitted_at: '2026-02-05T09:00:00Z' },
  { id: 'ksr-resp-14', survey_id: 'ksurvey-2', question_id: 'ksq-7', employee_id: 'anonymous', value: 8 as number | string, submitted_at: '2026-02-06T11:30:00Z' },
  { id: 'ksr-resp-15', survey_id: 'ksurvey-2', question_id: 'ksq-8', employee_id: 'anonymous', value: 5 as number | string, submitted_at: '2026-02-06T11:30:00Z' },
  { id: 'ksr-resp-16', survey_id: 'ksurvey-2', question_id: 'ksq-9', employee_id: 'anonymous', value: 3 as number | string, submitted_at: '2026-02-07T08:45:00Z' },
  { id: 'ksr-resp-17', survey_id: 'ksurvey-2', question_id: 'ksq-7', employee_id: 'anonymous', value: 7 as number | string, submitted_at: '2026-02-08T10:00:00Z' },
  { id: 'ksr-resp-18', survey_id: 'ksurvey-1', question_id: 'ksq-5', employee_id: 'anonymous', value: 3 as number | string, submitted_at: '2026-01-24T16:00:00Z' },
  { id: 'ksr-resp-19', survey_id: 'ksurvey-1', question_id: 'ksq-10', employee_id: 'anonymous', value: 4 as number | string, submitted_at: '2026-01-25T11:00:00Z' },
  { id: 'ksr-resp-20', survey_id: 'ksurvey-1', question_id: 'ksq-6', employee_id: 'anonymous', value: 'Better knowledge management system for sharing engagement learnings' as number | string, submitted_at: '2026-01-25T11:00:00Z' },
]

// Kash Action Plans
export const kashActionPlans = [
  { id: 'kap-1', survey_id: 'ksurvey-1', title: 'Define clear partnership track criteria', description: 'Document transparent criteria and timeline for promotion from Senior Consultant to Partner, including revenue targets and client development milestones', owner_id: 'kemp-1', status: 'in_progress' as const, priority: 'high' as const, due_date: '2026-04-30', category: 'growth' as const },
  { id: 'kap-2', survey_id: 'ksurvey-1', title: 'Implement project staffing balance', description: 'Create resource management dashboard to prevent consultant burnout and ensure fair distribution of client engagement hours', owner_id: 'kemp-12', status: 'planned' as const, priority: 'high' as const, due_date: '2026-05-31', category: 'worklife' as const },
  { id: 'kap-3', survey_id: 'ksurvey-1', title: 'Knowledge management platform rollout', description: 'Deploy Notion workspace for cross-engagement knowledge sharing, templates, and best practices across all three offices', owner_id: 'kemp-9', status: 'completed' as const, priority: 'medium' as const, due_date: '2026-02-28', category: 'culture' as const },
]

// Kash Expense Policies
export const kashExpensePolicies = [
  { id: 'kepol-1', org_id: 'org-2', category: 'Travel', daily_limit: 600, receipt_threshold: 25, auto_approve_limit: 250, status: 'active' as const, created_at: '2025-06-01T00:00:00Z' },
  { id: 'kepol-2', org_id: 'org-2', category: 'Meals', daily_limit: 100, receipt_threshold: 15, auto_approve_limit: 75, status: 'active' as const, created_at: '2025-06-01T00:00:00Z' },
  { id: 'kepol-3', org_id: 'org-2', category: 'Accommodation', daily_limit: 350, receipt_threshold: 50, auto_approve_limit: 200, status: 'active' as const, created_at: '2025-06-01T00:00:00Z' },
]

// Kash Mileage Logs
export const kashMileageLogs = [
  { id: 'kml-1', org_id: 'org-2', employee_id: 'kemp-3', date: '2026-02-12', origin: 'Johannesburg Office', destination: 'Sandton Client Office', distance_km: 15, rate_per_km: 0.52, amount: 7.80, status: 'approved' as const, created_at: '2026-02-12T00:00:00Z' },
  { id: 'kml-2', org_id: 'org-2', employee_id: 'kemp-7', date: '2026-02-18', origin: 'Johannesburg Office', destination: 'Pretoria Government Office', distance_km: 58, rate_per_km: 0.52, amount: 30.16, status: 'approved' as const, created_at: '2026-02-18T00:00:00Z' },
  { id: 'kml-3', org_id: 'org-2', employee_id: 'kemp-10', date: '2026-02-20', origin: 'Kigali Office', destination: 'Kigali Innovation City', distance_km: 12, rate_per_km: 0.52, amount: 6.24, status: 'pending' as const, created_at: '2026-02-20T00:00:00Z' },
  { id: 'kml-4', org_id: 'org-2', employee_id: 'kemp-19', date: '2026-02-14', origin: 'Casablanca Office', destination: 'OCP Headquarters Rabat', distance_km: 90, rate_per_km: 0.52, amount: 46.80, status: 'reimbursed' as const, created_at: '2026-02-14T00:00:00Z' },
]

// Kash Shifts
export const kashShifts = [
  { id: 'ksh-1', employee_id: 'kemp-4', date: '2026-02-24', start_time: '08:30', end_time: '18:00', type: 'regular' as const, hours: 9.5, status: 'completed' as const },
  { id: 'ksh-2', employee_id: 'kemp-5', date: '2026-02-24', start_time: '09:00', end_time: '17:30', type: 'regular' as const, hours: 8.5, status: 'completed' as const },
  { id: 'ksh-3', employee_id: 'kemp-8', date: '2026-02-24', start_time: '09:00', end_time: '17:00', type: 'remote' as const, hours: 8, status: 'completed' as const },
  { id: 'ksh-4', employee_id: 'kemp-10', date: '2026-02-22', start_time: '08:00', end_time: '20:00', type: 'overtime' as const, hours: 12, status: 'completed' as const },
  { id: 'ksh-5', employee_id: 'kemp-14', date: '2026-02-25', start_time: '08:30', end_time: '17:00', type: 'regular' as const, hours: 8.5, status: 'scheduled' as const },
  { id: 'ksh-6', employee_id: 'kemp-20', date: '2026-02-24', start_time: '09:00', end_time: '13:00', type: 'regular' as const, hours: 4, status: 'missed' as const },
]

// Kash Timesheet Entries
export const kashTimesheetEntries = [
  { id: 'kts-1', employee_id: 'kemp-1', week_start: '2026-02-17', mon_hours: 9, tue_hours: 9, wed_hours: 10, thu_hours: 9, fri_hours: 8, total_hours: 45, status: 'approved' as const, overtime_hours: 5 },
  { id: 'kts-2', employee_id: 'kemp-2', week_start: '2026-02-17', mon_hours: 9, tue_hours: 8, wed_hours: 9, thu_hours: 8, fri_hours: 8, total_hours: 42, status: 'approved' as const, overtime_hours: 2 },
  { id: 'kts-3', employee_id: 'kemp-3', week_start: '2026-02-17', mon_hours: 10, tue_hours: 10, wed_hours: 10, thu_hours: 9, fri_hours: 8, total_hours: 47, status: 'approved' as const, overtime_hours: 7 },
  { id: 'kts-4', employee_id: 'kemp-4', week_start: '2026-02-17', mon_hours: 9.5, tue_hours: 9, wed_hours: 9.5, thu_hours: 9, fri_hours: 8, total_hours: 45, status: 'approved' as const, overtime_hours: 5 },
  { id: 'kts-5', employee_id: 'kemp-5', week_start: '2026-02-17', mon_hours: 8, tue_hours: 8.5, wed_hours: 8, thu_hours: 8, fri_hours: 8, total_hours: 40.5, status: 'submitted' as const, overtime_hours: 0.5 },
  { id: 'kts-6', employee_id: 'kemp-6', week_start: '2026-02-17', mon_hours: 9, tue_hours: 9, wed_hours: 8, thu_hours: 9, fri_hours: 8, total_hours: 43, status: 'approved' as const, overtime_hours: 3 },
  { id: 'kts-7', employee_id: 'kemp-7', week_start: '2026-02-17', mon_hours: 8, tue_hours: 8, wed_hours: 9, thu_hours: 8, fri_hours: 8, total_hours: 41, status: 'approved' as const, overtime_hours: 1 },
  { id: 'kts-8', employee_id: 'kemp-8', week_start: '2026-02-17', mon_hours: 8, tue_hours: 8, wed_hours: 8, thu_hours: 8, fri_hours: 8, total_hours: 40, status: 'submitted' as const, overtime_hours: 0 },
  { id: 'kts-9', employee_id: 'kemp-9', week_start: '2026-02-17', mon_hours: 8.5, tue_hours: 8.5, wed_hours: 9, thu_hours: 8, fri_hours: 8, total_hours: 42, status: 'approved' as const, overtime_hours: 2 },
  { id: 'kts-10', employee_id: 'kemp-10', week_start: '2026-02-17', mon_hours: 8, tue_hours: 8, wed_hours: 8, thu_hours: 12, fri_hours: 8, total_hours: 44, status: 'approved' as const, overtime_hours: 4 },
  { id: 'kts-11', employee_id: 'kemp-11', week_start: '2026-02-17', mon_hours: 8, tue_hours: 8, wed_hours: 8, thu_hours: 8, fri_hours: 8, total_hours: 40, status: 'draft' as const, overtime_hours: 0 },
  { id: 'kts-12', employee_id: 'kemp-12', week_start: '2026-02-17', mon_hours: 8, tue_hours: 8, wed_hours: 8.5, thu_hours: 8, fri_hours: 8, total_hours: 40.5, status: 'approved' as const, overtime_hours: 0.5 },
  { id: 'kts-13', employee_id: 'kemp-13', week_start: '2026-02-17', mon_hours: 8, tue_hours: 8, wed_hours: 8, thu_hours: 8, fri_hours: 8, total_hours: 40, status: 'submitted' as const, overtime_hours: 0 },
  { id: 'kts-14', employee_id: 'kemp-15', week_start: '2026-02-17', mon_hours: 9, tue_hours: 9, wed_hours: 9, thu_hours: 9, fri_hours: 8, total_hours: 44, status: 'approved' as const, overtime_hours: 4 },
  { id: 'kts-15', employee_id: 'kemp-18', week_start: '2026-02-17', mon_hours: 9, tue_hours: 8, wed_hours: 9, thu_hours: 8, fri_hours: 8, total_hours: 42, status: 'approved' as const, overtime_hours: 2 },
]

// Kash Equity Grants
export const kashEquityGrants = [
  { id: 'keq-1', org_id: 'org-2', employee_id: 'kemp-1', grant_type: 'phantom' as const, shares: 10000, strike_price: 0, vesting_schedule: '4-year with 1-year cliff', vested_shares: 5000, current_value: 250000, grant_date: '2024-06-01', status: 'active' as const },
  { id: 'keq-2', org_id: 'org-2', employee_id: 'kemp-2', grant_type: 'phantom' as const, shares: 6000, strike_price: 0, vesting_schedule: '4-year with 1-year cliff', vested_shares: 1500, current_value: 150000, grant_date: '2024-06-01', status: 'active' as const },
  { id: 'keq-3', org_id: 'org-2', employee_id: 'kemp-6', grant_type: 'phantom' as const, shares: 5000, strike_price: 0, vesting_schedule: '4-year with 1-year cliff', vested_shares: 1250, current_value: 125000, grant_date: '2024-06-01', status: 'active' as const },
  { id: 'keq-4', org_id: 'org-2', employee_id: 'kemp-9', grant_type: 'phantom' as const, shares: 4000, strike_price: 0, vesting_schedule: '3-year annual', vested_shares: 2667, current_value: 100000, grant_date: '2024-06-01', status: 'active' as const },
]

// Kash Comp Planning Cycles
export const kashCompPlanningCycles = [
  { id: 'kcpc-1', org_id: 'org-2', name: '2026 Annual Compensation Review', status: 'active' as const, budget_percent: 6.0, employees_reviewed: 12, total_employees: 20, avg_increase: 5.5, total_budget: 180000, start_date: '2026-01-15', end_date: '2026-03-31', created_at: '2026-01-10T00:00:00Z' },
]

// Kash Mentoring Sessions
export const kashMentoringSessions = [
  { id: 'kms-1', pair_id: 'kpair-1', date: '2026-01-25', duration_minutes: 60, type: 'video' as const, topic: 'Partner track development plan', notes: 'Discussed client development skills and rainmaking expectations for partnership', rating: 5, status: 'completed' as const },
  { id: 'kms-2', pair_id: 'kpair-1', date: '2026-02-08', duration_minutes: 45, type: 'in_person' as const, topic: 'Client relationship building', notes: 'Reviewed approach for expanding MTN engagement scope', rating: 4, status: 'completed' as const },
  { id: 'kms-3', pair_id: 'kpair-2', date: '2026-01-28', duration_minutes: 60, type: 'video' as const, topic: 'Practice leadership strategies', notes: 'Discussed building strategy practice pipeline and team development', rating: 5, status: 'completed' as const },
  { id: 'kms-4', pair_id: 'kpair-2', date: '2026-02-12', duration_minutes: 45, type: 'video' as const, topic: 'Pricing and proposal strategy', notes: 'Reviewed pricing frameworks for advisory engagements in North Africa', rating: 4, status: 'completed' as const },
  { id: 'kms-5', pair_id: 'kpair-3', date: '2026-02-10', duration_minutes: 60, type: 'video' as const, topic: 'Cross-functional consulting skills', notes: 'Tech lead mentoring junior consultant on blending tech and strategy skills', rating: 4, status: 'completed' as const },
  { id: 'kms-6', pair_id: 'kpair-3', date: '2026-03-01', duration_minutes: 45, type: 'video' as const, topic: 'Data analytics for consulting deliverables', notes: null, rating: 0, status: 'scheduled' as const },
]

// Kash Mentoring Goals
export const kashMentoringGoals = [
  { id: 'kmg-1', pair_id: 'kpair-1', title: 'Win first independent client mandate', description: 'Develop and close a new client engagement without partner co-sell', target_date: '2026-06-30', status: 'in_progress' as const, progress: 35 },
  { id: 'kmg-2', pair_id: 'kpair-1', title: 'Build personal brand in consulting market', description: 'Publish 3 thought leadership pieces and speak at 1 industry conference', target_date: '2026-09-30', status: 'in_progress' as const, progress: 20 },
  { id: 'kmg-3', pair_id: 'kpair-2', title: 'Develop practice growth strategy', description: 'Create 3-year strategy practice growth plan with revenue and headcount targets', target_date: '2026-04-30', status: 'in_progress' as const, progress: 60 },
  { id: 'kmg-4', pair_id: 'kpair-3', title: 'Master data-driven consulting methodology', description: 'Build proficiency in Python and Tableau for analytical consulting deliverables', target_date: '2026-06-30', status: 'not_started' as const, progress: 0 },
]

// ============================================================
// OFFER MANAGEMENT
// ============================================================

export const demoOffers = [
  {
    id: 'offer-1', org_id: 'org-1', job_id: 'job-1', candidate_name: 'Aisha Bello', candidate_email: 'a.bello@gmail.com',
    role: 'Senior Software Engineer', department_id: 'dept-4', level: 'Senior',
    salary: 92000, currency: 'USD', equity_shares: 2000, signing_bonus: 5000,
    benefits_package: 'Premium Health + Dental + Vision', start_date: '2026-04-01',
    status: 'sent' as const,
    approval_chain: [
      { role: 'Hiring Manager', approver_id: 'emp-13', status: 'approved' as const, date: '2026-02-10' },
      { role: 'HR', approver_id: 'emp-17', status: 'approved' as const, date: '2026-02-11' },
      { role: 'Finance', approver_id: 'emp-24', status: 'approved' as const, date: '2026-02-12' },
    ],
    market_p50: 85000, market_p75: 100000,
    created_at: '2026-02-08T00:00:00Z', sent_at: '2026-02-13T00:00:00Z', viewed_at: '2026-02-14T00:00:00Z',
  },
  {
    id: 'offer-2', org_id: 'org-1', job_id: 'job-2', candidate_name: 'Emmanuel Osei', candidate_email: 'e.osei@outlook.com',
    role: 'Credit Analyst', department_id: 'dept-2', level: 'Mid',
    salary: 52000, currency: 'USD', equity_shares: 0, signing_bonus: 2000,
    benefits_package: 'Standard Health + Dental', start_date: '2026-03-15',
    status: 'accepted' as const,
    approval_chain: [
      { role: 'Hiring Manager', approver_id: 'emp-5', status: 'approved' as const, date: '2026-01-28' },
      { role: 'HR', approver_id: 'emp-17', status: 'approved' as const, date: '2026-01-29' },
      { role: 'Finance', approver_id: 'emp-24', status: 'approved' as const, date: '2026-01-30' },
    ],
    market_p50: 48000, market_p75: 58000,
    created_at: '2026-01-25T00:00:00Z', sent_at: '2026-02-01T00:00:00Z', viewed_at: '2026-02-02T00:00:00Z',
  },
  {
    id: 'offer-3', org_id: 'org-1', job_id: 'job-3', candidate_name: 'Fatima Diop', candidate_email: 'f.diop@yahoo.fr',
    role: 'Compliance Manager', department_id: 'dept-6', level: 'Manager',
    salary: 78000, currency: 'USD', equity_shares: 1000, signing_bonus: 3000,
    benefits_package: 'Premium Health + Dental + Vision + Wellness', start_date: '2026-04-15',
    status: 'negotiating' as const,
    approval_chain: [
      { role: 'Hiring Manager', approver_id: 'emp-21', status: 'approved' as const, date: '2026-02-15' },
      { role: 'HR', approver_id: 'emp-17', status: 'approved' as const, date: '2026-02-16' },
      { role: 'Finance', approver_id: 'emp-24', status: 'pending' as const, date: null },
    ],
    market_p50: 75000, market_p75: 90000,
    created_at: '2026-02-12T00:00:00Z', sent_at: '2026-02-17T00:00:00Z', viewed_at: '2026-02-18T00:00:00Z',
  },
  {
    id: 'offer-4', org_id: 'org-1', job_id: 'job-1', candidate_name: 'Kweku Mensah', candidate_email: 'k.mensah@proton.me',
    role: 'DevOps Engineer', department_id: 'dept-4', level: 'Senior',
    salary: 88000, currency: 'USD', equity_shares: 1500, signing_bonus: 4000,
    benefits_package: 'Premium Health + Dental + Vision', start_date: '2026-05-01',
    status: 'draft' as const,
    approval_chain: [
      { role: 'Hiring Manager', approver_id: 'emp-13', status: 'pending' as const, date: null },
      { role: 'HR', approver_id: 'emp-17', status: 'pending' as const, date: null },
      { role: 'Finance', approver_id: 'emp-24', status: 'pending' as const, date: null },
    ],
    market_p50: 82000, market_p75: 98000,
    created_at: '2026-02-20T00:00:00Z', sent_at: null, viewed_at: null,
  },
]

// ============================================================
// CAREER PATHING
// ============================================================

export const demoCareerTracks = [
  {
    id: 'track-eng', name: 'Engineering', icon: 'Code',
    levels: [
      { level: 1, title: 'Junior Engineer', min_experience: '0-2 years', salary_range: '35,000-50,000', skills: ['Fundamentals', 'Version Control', 'Testing Basics'], competencies: { 'comp-tech': 2, 'comp-prob': 1, 'comp-collab': 1 } },
      { level: 2, title: 'Mid Engineer', min_experience: '2-4 years', salary_range: '50,000-75,000', skills: ['System Design Basics', 'Code Review', 'CI/CD'], competencies: { 'comp-tech': 3, 'comp-prob': 2, 'comp-collab': 2 } },
      { level: 3, title: 'Senior Engineer', min_experience: '4-7 years', salary_range: '75,000-110,000', skills: ['Architecture', 'Mentoring', 'Technical Leadership'], competencies: { 'comp-tech': 4, 'comp-prob': 3, 'comp-collab': 3, 'comp-lead': 2 } },
      { level: 4, title: 'Staff Engineer', min_experience: '7-10 years', salary_range: '110,000-150,000', skills: ['System Architecture', 'Cross-team Influence', 'Technical Strategy'], competencies: { 'comp-tech': 5, 'comp-prob': 4, 'comp-collab': 4, 'comp-lead': 3, 'comp-strat': 3 } },
      { level: 5, title: 'Principal Engineer', min_experience: '10+ years', salary_range: '150,000-200,000', skills: ['Org-wide Architecture', 'Industry Influence', 'Innovation Leadership'], competencies: { 'comp-tech': 5, 'comp-prob': 5, 'comp-collab': 5, 'comp-lead': 4, 'comp-strat': 4 } },
    ],
  },
  {
    id: 'track-mgmt', name: 'Management', icon: 'Users',
    levels: [
      { level: 1, title: 'Team Lead', min_experience: '3-5 years', salary_range: '60,000-80,000', skills: ['People Management Basics', 'Project Planning', 'Feedback Delivery'], competencies: { 'comp-lead': 2, 'comp-comm': 2, 'comp-collab': 2 } },
      { level: 2, title: 'Manager', min_experience: '5-8 years', salary_range: '80,000-110,000', skills: ['Team Building', 'Performance Management', 'Stakeholder Mgmt'], competencies: { 'comp-lead': 3, 'comp-comm': 3, 'comp-collab': 3, 'comp-strat': 2 } },
      { level: 3, title: 'Senior Manager', min_experience: '8-12 years', salary_range: '110,000-140,000', skills: ['Multi-team Leadership', 'Budget Management', 'Change Management'], competencies: { 'comp-lead': 4, 'comp-comm': 4, 'comp-strat': 3, 'comp-adapt': 3 } },
      { level: 4, title: 'Director', min_experience: '12-15 years', salary_range: '140,000-180,000', skills: ['Department Strategy', 'Executive Communication', 'P&L Ownership'], competencies: { 'comp-lead': 5, 'comp-comm': 4, 'comp-strat': 4, 'comp-adapt': 4 } },
      { level: 5, title: 'VP / Executive', min_experience: '15+ years', salary_range: '180,000-250,000', skills: ['Org Strategy', 'Board Communication', 'Business Transformation'], competencies: { 'comp-lead': 5, 'comp-comm': 5, 'comp-strat': 5, 'comp-adapt': 5 } },
    ],
  },
  {
    id: 'track-product', name: 'Product', icon: 'Lightbulb',
    levels: [
      { level: 1, title: 'Associate PM', min_experience: '0-2 years', salary_range: '40,000-55,000', skills: ['User Research', 'Backlog Management', 'Basic Analytics'], competencies: { 'comp-cust': 2, 'comp-comm': 1, 'comp-prob': 1 } },
      { level: 2, title: 'Product Manager', min_experience: '2-5 years', salary_range: '55,000-80,000', skills: ['Roadmap Planning', 'A/B Testing', 'Competitive Analysis'], competencies: { 'comp-cust': 3, 'comp-comm': 2, 'comp-prob': 3, 'comp-strat': 2 } },
      { level: 3, title: 'Senior PM', min_experience: '5-8 years', salary_range: '80,000-115,000', skills: ['Product Strategy', 'Data-Driven Decisions', 'Cross-functional Leadership'], competencies: { 'comp-cust': 4, 'comp-comm': 3, 'comp-prob': 4, 'comp-strat': 3, 'comp-lead': 2 } },
      { level: 4, title: 'Group PM', min_experience: '8-12 years', salary_range: '115,000-155,000', skills: ['Portfolio Management', 'Team Leadership', 'Market Positioning'], competencies: { 'comp-cust': 4, 'comp-comm': 4, 'comp-strat': 4, 'comp-lead': 3 } },
    ],
  },
  {
    id: 'track-ops', name: 'Operations', icon: 'Settings',
    levels: [
      { level: 1, title: 'Operations Associate', min_experience: '0-2 years', salary_range: '25,000-38,000', skills: ['Process Documentation', 'Data Entry', 'Basic Reporting'], competencies: { 'comp-tech': 1, 'comp-collab': 1, 'comp-adapt': 1 } },
      { level: 2, title: 'Operations Officer', min_experience: '2-4 years', salary_range: '38,000-55,000', skills: ['Process Improvement', 'Vendor Management', 'Risk Awareness'], competencies: { 'comp-tech': 2, 'comp-prob': 2, 'comp-collab': 2, 'comp-adapt': 2 } },
      { level: 3, title: 'Operations Manager', min_experience: '4-7 years', salary_range: '55,000-80,000', skills: ['Team Management', 'Budget Control', 'Automation Strategy'], competencies: { 'comp-tech': 3, 'comp-prob': 3, 'comp-lead': 2, 'comp-adapt': 3 } },
      { level: 4, title: 'Head of Operations', min_experience: '7-12 years', salary_range: '80,000-120,000', skills: ['Strategic Planning', 'Multi-site Operations', 'Digital Transformation'], competencies: { 'comp-tech': 3, 'comp-prob': 4, 'comp-lead': 4, 'comp-strat': 3, 'comp-adapt': 4 } },
      { level: 5, title: 'COO', min_experience: '12+ years', salary_range: '120,000-200,000', skills: ['Enterprise Strategy', 'Board Reporting', 'Global Operations'], competencies: { 'comp-lead': 5, 'comp-strat': 5, 'comp-adapt': 5, 'comp-comm': 4 } },
    ],
  },
]

// ============================================================
// MARKET BENCHMARKS
// ============================================================

export const demoMarketBenchmarks = [
  { id: 'mb-1', role: 'Senior Software Engineer', level: 'Senior', country: 'Nigeria', industry: 'Banking & Financial Services', internal_avg: 85000, p25: 72000, p50: 85000, p75: 100000, p90: 118000, sample_size: 1240, source: 'Mercer 2026', updated_at: '2026-01-15' },
  { id: 'mb-2', role: 'Branch Manager', level: 'Senior Manager', country: 'Nigeria', industry: 'Banking & Financial Services', internal_avg: 72000, p25: 60000, p50: 72000, p75: 85000, p90: 95000, sample_size: 890, source: 'Mercer 2026', updated_at: '2026-01-15' },
  { id: 'mb-3', role: 'Credit Analyst', level: 'Mid', country: "Cote d'Ivoire", industry: 'Banking & Financial Services', internal_avg: 48000, p25: 42000, p50: 50000, p75: 60000, p90: 72000, sample_size: 650, source: 'Korn Ferry 2026', updated_at: '2026-01-20' },
  { id: 'mb-4', role: 'Compliance Manager', level: 'Manager', country: 'Kenya', industry: 'Banking & Financial Services', internal_avg: 68000, p25: 58000, p50: 70000, p75: 82000, p90: 95000, sample_size: 420, source: 'Willis Towers Watson 2026', updated_at: '2026-01-18' },
  { id: 'mb-5', role: 'Relationship Manager', level: 'Manager', country: 'Ghana', industry: 'Banking & Financial Services', internal_avg: 58000, p25: 48000, p50: 58000, p75: 70000, p90: 82000, sample_size: 780, source: 'Mercer 2026', updated_at: '2026-01-15' },
  { id: 'mb-6', role: 'DevOps Engineer', level: 'Senior', country: 'Kenya', industry: 'Technology', internal_avg: 72000, p25: 62000, p50: 75000, p75: 90000, p90: 105000, sample_size: 560, source: 'Korn Ferry 2026', updated_at: '2026-01-20' },
  { id: 'mb-7', role: 'UX Designer', level: 'Mid', country: 'Nigeria', industry: 'Technology', internal_avg: 55000, p25: 45000, p50: 55000, p75: 68000, p90: 80000, sample_size: 480, source: 'Radford 2026', updated_at: '2026-02-01' },
  { id: 'mb-8', role: 'Chief Risk Officer', level: 'Executive', country: 'Nigeria', industry: 'Banking & Financial Services', internal_avg: 195000, p25: 165000, p50: 195000, p75: 230000, p90: 280000, sample_size: 180, source: 'Mercer 2026', updated_at: '2026-01-15' },
  { id: 'mb-9', role: 'Financial Controller', level: 'Senior Manager', country: "Cote d'Ivoire", industry: 'Banking & Financial Services', internal_avg: 115000, p25: 95000, p50: 115000, p75: 135000, p90: 160000, sample_size: 340, source: 'Willis Towers Watson 2026', updated_at: '2026-01-18' },
  { id: 'mb-10', role: 'Digital Marketing Lead', level: 'Senior', country: 'Kenya', industry: 'Marketing', internal_avg: 65000, p25: 52000, p50: 62000, p75: 75000, p90: 88000, sample_size: 620, source: 'Radford 2026', updated_at: '2026-02-01' },
]

// ============================================================
// WIDGET PREFERENCES
// ============================================================

export const demoWidgetPreferences = {
  layout: 'default' as const,
  widgets: [
    { id: 'w-headcount', name: 'Headcount', category: 'People' as const, enabled: true, position: 0 },
    { id: 'w-goals', name: 'Active Goals', category: 'Performance' as const, enabled: true, position: 1 },
    { id: 'w-reviews', name: 'Review Completion', category: 'Performance' as const, enabled: true, position: 2 },
    { id: 'w-learners', name: 'Active Learners', category: 'People' as const, enabled: true, position: 3 },
    { id: 'w-openpos', name: 'Open Positions', category: 'Recruiting' as const, enabled: true, position: 4 },
    { id: 'w-expenses', name: 'Pending Expenses', category: 'Finance' as const, enabled: true, position: 5 },
    { id: 'w-mentoring', name: 'Mentoring Pairs', category: 'People' as const, enabled: true, position: 6 },
    { id: 'w-leave', name: 'Pending Leave', category: 'People' as const, enabled: true, position: 7 },
    { id: 'w-payroll', name: 'Last Payroll', category: 'Finance' as const, enabled: true, position: 8 },
    { id: 'w-actions', name: 'Action Items', category: 'People' as const, enabled: true, position: 9 },
    { id: 'w-summary', name: 'Executive Summary', category: 'Performance' as const, enabled: true, position: 10 },
    { id: 'w-engagement', name: 'Engagement Score', category: 'People' as const, enabled: false, position: 11 },
    { id: 'w-turnover', name: 'Turnover Rate', category: 'People' as const, enabled: false, position: 12 },
    { id: 'w-pipeline', name: 'Hiring Pipeline', category: 'Recruiting' as const, enabled: false, position: 13 },
    { id: 'w-budget', name: 'Budget Utilization', category: 'Finance' as const, enabled: false, position: 14 },
    { id: 'w-compliance', name: 'Compliance Status', category: 'IT' as const, enabled: false, position: 15 },
    { id: 'w-it-requests', name: 'IT Requests', category: 'IT' as const, enabled: false, position: 16 },
    { id: 'w-recognition', name: 'Recent Recognition', category: 'People' as const, enabled: false, position: 17 },
  ],
}

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
      equityGrants: kashEquityGrants,
      compPlanningCycles: kashCompPlanningCycles,
      courses: kashCourses,
      enrollments: kashEnrollments,
      surveys: kashSurveys,
      engagementScores: kashEngagementScores,
      surveyQuestions: kashSurveyQuestions,
      surveyResponses: kashSurveyResponses,
      actionPlans: kashActionPlans,
      mentoringPrograms: kashMentoringPrograms,
      mentoringPairs: kashMentoringPairs,
      mentoringSessions: kashMentoringSessions,
      mentoringGoals: kashMentoringGoals,
      payrollRuns: kashPayrollRuns,
      employeePayrollEntries: kashEmployeePayrollEntries,
      contractorPayments: kashContractorPayments,
      payrollSchedules: kashPayrollSchedules,
      taxConfigs: kashTaxConfigs,
      complianceIssues: kashComplianceIssues,
      taxFilings: kashTaxFilings,
      leaveRequests: kashLeaveRequests,
      benefitPlans: kashBenefitPlans,
      benefitEnrollments: kashBenefitEnrollments,
      benefitDependents: kashBenefitDependents,
      lifeEvents: kashLifeEvents,
      expenseReports: kashExpenseReports,
      expensePolicies: kashExpensePolicies,
      mileageLogs: kashMileageLogs,
      shifts: kashShifts,
      timesheetEntries: kashTimesheetEntries,
      employeeDocuments: kashEmployeeDocuments,
      employeeTimeline: kashEmployeeTimeline,
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
      courseBlocks: [] as typeof demoCourseBlocks,
      quizQuestions: [] as typeof demoQuizQuestions,
      discussions: [] as typeof demoDiscussions,
      studyGroups: [] as typeof demoStudyGroups,
      careerSiteConfig: kashCareerSiteConfig,
      jobDistributions: kashJobDistributions,
      interviews: [] as typeof demoInterviews,
      talentPools: [] as typeof demoTalentPools,
      scoreCards: [] as typeof demoScoreCards,
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
    equityGrants: demoEquityGrants,
    compPlanningCycles: demoCompPlanningCycles,
    courses: demoCourses,
    enrollments: demoEnrollments,
    surveys: demoSurveys,
    engagementScores: demoEngagementScores,
    actionPlans: demoActionPlans,
    surveyResponses: demoSurveyResponses,
    mentoringPrograms: demoMentoringPrograms,
    mentoringPairs: demoMentoringPairs,
    mentoringSessions: demoMentoringSessions,
    mentoringGoals: demoMentoringGoals,
    payrollRuns: demoPayrollRuns,
    employeePayrollEntries: demoEmployeePayrollEntries,
    contractorPayments: demoContractorPayments,
    payrollSchedules: demoPayrollSchedules,
    taxConfigs: demoTaxConfigs,
    complianceIssues: demoComplianceIssues,
    taxFilings: demoTaxFilings,
    leaveRequests: demoLeaveRequests,
    benefitPlans: demoBenefitPlans,
    benefitEnrollments: demoBenefitEnrollments,
    benefitDependents: demoBenefitDependents,
    lifeEvents: demoLifeEvents,
    expenseReports: demoExpenseReports,
    expensePolicies: demoExpensePolicies,
    mileageLogs: demoMileageLogs,
    jobPostings: demoJobPostings,
    applications: demoApplications,
    devices: demoDevices,
    softwareLicenses: demoSoftwareLicenses,
    itRequests: demoITRequests,
    invoices: demoInvoices,
    budgets: demoBudgets,
    vendors: demoVendors,
    vendorContracts: demoVendorContracts,
    spendByCategory: demoSpendByCategory,
    complianceFrameworks: demoComplianceFrameworks,
    securityPosture: demoSecurityPosture,
    provisioningEvents: demoProvisioningEvents,
    shadowITDetections: demoShadowITDetections,
    budgetForecast: demoBudgetForecast,
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
    courseBlocks: demoCourseBlocks,
    quizQuestions: demoQuizQuestions,
    discussions: demoDiscussions,
    studyGroups: demoStudyGroups,
    careerSiteConfig: demoCareerSiteConfig,
    jobDistributions: demoJobDistributions,
    interviews: demoInterviews,
    talentPools: demoTalentPools,
    scoreCards: demoScoreCards,
    employeeDocuments: demoEmployeeDocuments,
    employeeTimeline: demoEmployeeTimeline,
    surveyQuestions: demoSurveyQuestions,
    shifts: demoShifts,
    timesheetEntries: demoTimesheetEntries,
  }
}

export const allDemoCredentials: DemoCredential[] = [...demoCredentials, ...kashCredentials]

// ─── Onboarding: Buddy Assignments ─────────────────────────────────────

export const demoBuddyAssignments = [
  { id: 'buddy-1', org_id: 'org-1', new_hire_id: 'emp-4', buddy_id: 'emp-3', status: 'active' as const, assigned_date: '2026-02-10', match_score: 92, department_id: 'dept-1', checklist: [{ task: 'Introduce to team members', done: true }, { task: 'Office tour and facilities walkthrough', done: true }, { task: 'Lunch together on first day', done: true }, { task: 'Explain team communication channels', done: false }, { task: 'Review key tools and systems', done: false }], meetings: [{ date: '2026-02-11T10:00:00Z', topic: 'Welcome and introductions', completed: true }, { date: '2026-02-18T10:00:00Z', topic: 'First week check-in', completed: true }, { date: '2026-02-25T10:00:00Z', topic: 'Progress and questions', completed: false }] },
  { id: 'buddy-2', org_id: 'org-1', new_hire_id: 'emp-10', buddy_id: 'emp-11', status: 'active' as const, assigned_date: '2026-02-03', match_score: 87, department_id: 'dept-3', checklist: [{ task: 'Introduce to team members', done: true }, { task: 'Office tour and facilities walkthrough', done: true }, { task: 'Lunch together on first day', done: false }, { task: 'Explain team communication channels', done: true }, { task: 'Review key tools and systems', done: true }], meetings: [{ date: '2026-02-04T14:00:00Z', topic: 'Welcome and introductions', completed: true }, { date: '2026-02-11T14:00:00Z', topic: 'First week check-in', completed: true }, { date: '2026-02-18T14:00:00Z', topic: 'Progress and questions', completed: false }] },
  { id: 'buddy-3', org_id: 'org-1', new_hire_id: 'emp-16', buddy_id: 'emp-14', status: 'active' as const, assigned_date: '2026-01-20', match_score: 95, department_id: 'dept-4', checklist: [{ task: 'Introduce to team members', done: true }, { task: 'Office tour and facilities walkthrough', done: true }, { task: 'Lunch together on first day', done: true }, { task: 'Explain team communication channels', done: true }, { task: 'Review key tools and systems', done: true }], meetings: [{ date: '2026-01-21T09:00:00Z', topic: 'Welcome and introductions', completed: true }, { date: '2026-01-28T09:00:00Z', topic: 'First week check-in', completed: true }, { date: '2026-02-04T09:00:00Z', topic: 'Progress and questions', completed: true }] },
  { id: 'buddy-4', org_id: 'org-1', new_hire_id: 'emp-30', buddy_id: 'emp-29', status: 'pending' as const, assigned_date: '2026-02-20', match_score: 84, department_id: 'dept-8', checklist: [{ task: 'Introduce to team members', done: false }, { task: 'Office tour and facilities walkthrough', done: false }, { task: 'Lunch together on first day', done: false }, { task: 'Explain team communication channels', done: false }, { task: 'Review key tools and systems', done: false }], meetings: [{ date: '2026-02-24T11:00:00Z', topic: 'Welcome and introductions', completed: false }, { date: '2026-03-03T11:00:00Z', topic: 'First week check-in', completed: false }] },
  { id: 'buddy-5', org_id: 'org-1', new_hire_id: 'emp-7', buddy_id: 'emp-6', status: 'completed' as const, assigned_date: '2025-12-01', match_score: 90, department_id: 'dept-2', checklist: [{ task: 'Introduce to team members', done: true }, { task: 'Office tour and facilities walkthrough', done: true }, { task: 'Lunch together on first day', done: true }, { task: 'Explain team communication channels', done: true }, { task: 'Review key tools and systems', done: true }], meetings: [{ date: '2025-12-02T10:00:00Z', topic: 'Welcome and introductions', completed: true }, { date: '2025-12-09T10:00:00Z', topic: 'First week check-in', completed: true }, { date: '2025-12-16T10:00:00Z', topic: 'Progress and questions', completed: true }] },
]

// ─── Onboarding: Preboarding Tasks ─────────────────────────────────────

export const demoPreboardingTasks = [
  { id: 'pbt-1', org_id: 'org-1', employee_id: 'emp-4', title: 'Sign employment contract', category: 'documents' as const, status: 'completed' as const, due_date: '2026-02-05', completed_date: '2026-02-03', priority: 'high' as const },
  { id: 'pbt-2', org_id: 'org-1', employee_id: 'emp-4', title: 'Submit tax forms (W-4 equivalent)', category: 'documents' as const, status: 'completed' as const, due_date: '2026-02-07', completed_date: '2026-02-06', priority: 'high' as const },
  { id: 'pbt-3', org_id: 'org-1', employee_id: 'emp-4', title: 'Enroll in benefits plan', category: 'benefits' as const, status: 'in_progress' as const, due_date: '2026-02-28', completed_date: null, priority: 'medium' as const },
  { id: 'pbt-4', org_id: 'org-1', employee_id: 'emp-4', title: 'Upload government ID copy', category: 'documents' as const, status: 'completed' as const, due_date: '2026-02-07', completed_date: '2026-02-04', priority: 'high' as const },
  { id: 'pbt-5', org_id: 'org-1', employee_id: 'emp-4', title: 'Complete bank details for payroll', category: 'payroll' as const, status: 'completed' as const, due_date: '2026-02-10', completed_date: '2026-02-08', priority: 'high' as const },
  { id: 'pbt-6', org_id: 'org-1', employee_id: 'emp-4', title: 'Request laptop and equipment', category: 'equipment' as const, status: 'in_progress' as const, due_date: '2026-02-12', completed_date: null, priority: 'medium' as const },
  { id: 'pbt-7', org_id: 'org-1', employee_id: 'emp-4', title: 'Complete compliance training module', category: 'training' as const, status: 'pending' as const, due_date: '2026-03-01', completed_date: null, priority: 'medium' as const },
  { id: 'pbt-8', org_id: 'org-1', employee_id: 'emp-4', title: 'Set up email and corporate accounts', category: 'accounts' as const, status: 'completed' as const, due_date: '2026-02-10', completed_date: '2026-02-09', priority: 'high' as const },
  { id: 'pbt-9', org_id: 'org-1', employee_id: 'emp-10', title: 'Sign employment contract', category: 'documents' as const, status: 'completed' as const, due_date: '2026-01-30', completed_date: '2026-01-28', priority: 'high' as const },
  { id: 'pbt-10', org_id: 'org-1', employee_id: 'emp-10', title: 'Submit tax forms', category: 'documents' as const, status: 'completed' as const, due_date: '2026-02-01', completed_date: '2026-01-31', priority: 'high' as const },
]

// ─── Onboarding: Welcome Content ─────────────────────────────────────

export const demoWelcomeContent = {
  org_id: 'org-1',
  company_values: [
    { title: 'Excellence', description: 'We strive for the highest standards in everything we do', icon: 'star' as const },
    { title: 'Integrity', description: 'We act with honesty, transparency, and ethical conduct', icon: 'shield' as const },
    { title: 'Innovation', description: 'We embrace new ideas and continuously improve our services', icon: 'lightbulb' as const },
    { title: 'Teamwork', description: 'We collaborate across borders and cultures to achieve shared goals', icon: 'users' as const },
    { title: 'Customer Focus', description: 'We put our clients at the center of every decision', icon: 'heart' as const },
  ],
  mission_statement: 'To contribute to the economic development and financial integration of Africa through the provision of world-class banking services.',
  welcome_message: 'Welcome to the Ecobank family! We are excited to have you join our team. Your journey with us begins here, and we are committed to supporting your growth every step of the way.',
  first_week_schedule: [
    { day: 'Monday', items: ['Welcome orientation session', 'Meet your manager and team', 'IT setup and equipment collection', 'Office tour'] },
    { day: 'Tuesday', items: ['HR policy overview', 'Benefits enrollment session', 'Buddy introduction meeting', 'Department overview presentation'] },
    { day: 'Wednesday', items: ['Compliance and security training', 'Systems and tools walkthrough', 'Lunch with team', 'Role-specific onboarding'] },
    { day: 'Thursday', items: ['Product and services deep-dive', 'Cross-department introductions', 'First project briefing', 'Manager 1:1 check-in'] },
    { day: 'Friday', items: ['Culture and values workshop', 'Week 1 reflection and feedback', 'Goal setting for first 90 days', 'Team social event'] },
  ],
  it_checklist: [
    { item: 'Laptop provisioned and configured', status: 'done' as const },
    { item: 'Email account activated', status: 'done' as const },
    { item: 'VPN access configured', status: 'done' as const },
    { item: 'Badge and building access', status: 'in_progress' as const },
    { item: 'Software licenses assigned', status: 'done' as const },
    { item: 'Internal communication tools setup', status: 'done' as const },
    { item: 'Security training enrollment', status: 'pending' as const },
  ],
  communication_templates: [
    { id: 'tpl-1', name: 'Welcome Email', subject: 'Welcome to Ecobank — Your First Day Information', type: 'email' as const },
    { id: 'tpl-2', name: 'First Day Reminder', subject: 'Reminder: Your First Day at Ecobank is Tomorrow!', type: 'email' as const },
    { id: 'tpl-3', name: 'Week 1 Check-in', subject: 'How was your first week?', type: 'email' as const },
    { id: 'tpl-4', name: '30-Day Survey', subject: 'Your 30-Day Experience Survey', type: 'survey' as const },
  ],
}

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
