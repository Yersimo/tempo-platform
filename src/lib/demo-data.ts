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
  { id: 'emp-20', org_id: 'org-1', department_id: 'dept-5', job_title: 'HR Business Partner', level: 'Senior', country: 'Ghana', role: 'hrbp' as const, profile: { full_name: 'Ama Darko', email: 'a.darko@ecobank.com', avatar_url: null, phone: '+233 27 890 1234' } },
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
  { id: 'course-tempo', org_id: 'org-1', title: 'How to Use Tempo — General Course', description: 'Complete onboarding course for the Tempo platform. Learn to navigate modules, manage people, run payroll, track performance, and build learning courses.', category: 'Onboarding', duration_hours: 4, format: 'online' as const, level: 'beginner' as const, is_mandatory: true, created_at: '2026-01-01T00:00:00Z' },
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
  { id: 'enr-tempo', org_id: 'org-1', employee_id: 'emp-1', course_id: 'course-tempo', status: 'in_progress' as const, progress: 5, enrolled_at: '2026-03-01T00:00:00Z', completed_at: null },
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

// Employee Payroll Entries (individual pay stubs for January 2026 run — all 30 employees)
export const demoEmployeePayrollEntries = [
  // Retail Banking
  { id: 'epe-1', org_id: 'org-1', payroll_run_id: 'pr-1', employee_id: 'emp-1', employee_name: 'Oluwaseun Adeyemi', department: 'Retail Banking', country: 'Nigeria', base_pay: 14167, gross_pay: 14167, federal_tax: 2125, state_tax: 708, social_security: 878, medicare: 205, pension: 708, health_insurance: 500, bonus: 0, overtime: 0, other_deductions: 0, total_deductions: 5124, net_pay: 9043, currency: 'USD', pay_date: '2026-01-28' },
  { id: 'epe-2', org_id: 'org-1', payroll_run_id: 'pr-1', employee_id: 'emp-2', employee_name: 'Ngozi Okafor', department: 'Retail Banking', country: 'Nigeria', base_pay: 10000, gross_pay: 10000, federal_tax: 1500, state_tax: 500, social_security: 620, medicare: 145, pension: 500, health_insurance: 500, bonus: 0, overtime: 0, other_deductions: 0, total_deductions: 3765, net_pay: 6235, currency: 'USD', pay_date: '2026-01-28' },
  { id: 'epe-3', org_id: 'org-1', payroll_run_id: 'pr-1', employee_id: 'emp-3', employee_name: 'Kwame Asante', department: 'Retail Banking', country: 'Ghana', base_pay: 6667, gross_pay: 6667, federal_tax: 1000, state_tax: 333, social_security: 413, medicare: 97, pension: 333, health_insurance: 500, bonus: 0, overtime: 0, other_deductions: 0, total_deductions: 2676, net_pay: 3991, currency: 'USD', pay_date: '2026-01-28' },
  { id: 'epe-16', org_id: 'org-1', payroll_run_id: 'pr-1', employee_id: 'emp-4', employee_name: 'Chioma Eze', department: 'Retail Banking', country: 'Nigeria', base_pay: 3333, gross_pay: 3333, federal_tax: 500, state_tax: 167, social_security: 207, medicare: 48, pension: 167, health_insurance: 500, bonus: 0, overtime: 0, other_deductions: 0, total_deductions: 1589, net_pay: 1744, currency: 'USD', pay_date: '2026-01-28' },
  // Corporate Banking
  { id: 'epe-4', org_id: 'org-1', payroll_run_id: 'pr-1', employee_id: 'emp-5', employee_name: 'Amadou Diallo', department: 'Corporate Banking', country: "Cote d'Ivoire", base_pay: 15000, gross_pay: 15000, federal_tax: 2250, state_tax: 750, social_security: 930, medicare: 218, pension: 750, health_insurance: 500, bonus: 0, overtime: 0, other_deductions: 0, total_deductions: 5398, net_pay: 9602, currency: 'USD', pay_date: '2026-01-28' },
  { id: 'epe-5', org_id: 'org-1', payroll_run_id: 'pr-1', employee_id: 'emp-6', employee_name: 'Fatou Ndiaye', department: 'Corporate Banking', country: 'Senegal', base_pay: 5417, gross_pay: 5417, federal_tax: 813, state_tax: 271, social_security: 336, medicare: 79, pension: 271, health_insurance: 500, bonus: 0, overtime: 0, other_deductions: 0, total_deductions: 2270, net_pay: 3147, currency: 'USD', pay_date: '2026-01-28' },
  { id: 'epe-17', org_id: 'org-1', payroll_run_id: 'pr-1', employee_id: 'emp-7', employee_name: 'Marie Kouassi', department: 'Corporate Banking', country: "Cote d'Ivoire", base_pay: 4583, gross_pay: 4583, federal_tax: 688, state_tax: 229, social_security: 284, medicare: 66, pension: 229, health_insurance: 500, bonus: 0, overtime: 0, other_deductions: 0, total_deductions: 1996, net_pay: 2587, currency: 'USD', pay_date: '2026-01-28' },
  { id: 'epe-18', org_id: 'org-1', payroll_run_id: 'pr-1', employee_id: 'emp-8', employee_name: 'James Kamau', department: 'Corporate Banking', country: 'Kenya', base_pay: 7500, gross_pay: 7500, federal_tax: 1125, state_tax: 375, social_security: 465, medicare: 109, pension: 375, health_insurance: 500, bonus: 0, overtime: 0, other_deductions: 0, total_deductions: 2949, net_pay: 4551, currency: 'USD', pay_date: '2026-01-28' },
  // Operations
  { id: 'epe-6', org_id: 'org-1', payroll_run_id: 'pr-1', employee_id: 'emp-9', employee_name: 'Kofi Mensah', department: 'Operations', country: 'Ghana', base_pay: 13333, gross_pay: 13333, federal_tax: 2000, state_tax: 667, social_security: 827, medicare: 193, pension: 667, health_insurance: 500, bonus: 0, overtime: 0, other_deductions: 0, total_deductions: 4854, net_pay: 8479, currency: 'USD', pay_date: '2026-01-28' },
  { id: 'epe-19', org_id: 'org-1', payroll_run_id: 'pr-1', employee_id: 'emp-10', employee_name: 'Abena Boateng', department: 'Operations', country: 'Ghana', base_pay: 2917, gross_pay: 2917, federal_tax: 438, state_tax: 146, social_security: 181, medicare: 42, pension: 146, health_insurance: 500, bonus: 0, overtime: 0, other_deductions: 0, total_deductions: 1453, net_pay: 1464, currency: 'USD', pay_date: '2026-01-28' },
  { id: 'epe-20', org_id: 'org-1', payroll_run_id: 'pr-1', employee_id: 'emp-11', employee_name: 'Emeka Nwankwo', department: 'Operations', country: 'Nigeria', base_pay: 4583, gross_pay: 4583, federal_tax: 688, state_tax: 229, social_security: 284, medicare: 66, pension: 229, health_insurance: 500, bonus: 0, overtime: 0, other_deductions: 0, total_deductions: 1996, net_pay: 2587, currency: 'USD', pay_date: '2026-01-28' },
  { id: 'epe-21', org_id: 'org-1', payroll_run_id: 'pr-1', employee_id: 'emp-12', employee_name: 'Wanjiku Muthoni', department: 'Operations', country: 'Kenya', base_pay: 3333, gross_pay: 3333, federal_tax: 500, state_tax: 167, social_security: 207, medicare: 48, pension: 167, health_insurance: 500, bonus: 0, overtime: 0, other_deductions: 0, total_deductions: 1589, net_pay: 1744, currency: 'USD', pay_date: '2026-01-28' },
  // Technology
  { id: 'epe-7', org_id: 'org-1', payroll_run_id: 'pr-1', employee_id: 'emp-13', employee_name: 'Babajide Ogunleye', department: 'Technology', country: 'Nigeria', base_pay: 16667, gross_pay: 16667, federal_tax: 2500, state_tax: 833, social_security: 1033, medicare: 242, pension: 833, health_insurance: 500, bonus: 0, overtime: 0, other_deductions: 0, total_deductions: 5941, net_pay: 10726, currency: 'USD', pay_date: '2026-01-28' },
  { id: 'epe-8', org_id: 'org-1', payroll_run_id: 'pr-1', employee_id: 'emp-14', employee_name: 'Yaw Frimpong', department: 'Technology', country: 'Ghana', base_pay: 5833, gross_pay: 5833, federal_tax: 875, state_tax: 292, social_security: 362, medicare: 85, pension: 292, health_insurance: 500, bonus: 0, overtime: 0, other_deductions: 0, total_deductions: 2406, net_pay: 3427, currency: 'USD', pay_date: '2026-01-28' },
  { id: 'epe-22', org_id: 'org-1', payroll_run_id: 'pr-1', employee_id: 'emp-15', employee_name: 'Brian Otieno', department: 'Technology', country: 'Kenya', base_pay: 7083, gross_pay: 7083, federal_tax: 1062, state_tax: 354, social_security: 439, medicare: 103, pension: 354, health_insurance: 500, bonus: 0, overtime: 0, other_deductions: 0, total_deductions: 2812, net_pay: 4271, currency: 'USD', pay_date: '2026-01-28' },
  { id: 'epe-23', org_id: 'org-1', payroll_run_id: 'pr-1', employee_id: 'emp-16', employee_name: 'Adaeze Ikechukwu', department: 'Technology', country: 'Nigeria', base_pay: 4583, gross_pay: 4583, federal_tax: 688, state_tax: 229, social_security: 284, medicare: 66, pension: 229, health_insurance: 500, bonus: 0, overtime: 0, other_deductions: 0, total_deductions: 1996, net_pay: 2587, currency: 'USD', pay_date: '2026-01-28' },
  // Human Resources
  { id: 'epe-9', org_id: 'org-1', payroll_run_id: 'pr-1', employee_id: 'emp-17', employee_name: 'Amara Kone', department: 'Human Resources', country: "Cote d'Ivoire", base_pay: 15833, gross_pay: 15833, federal_tax: 2375, state_tax: 792, social_security: 982, medicare: 230, pension: 792, health_insurance: 500, bonus: 0, overtime: 0, other_deductions: 0, total_deductions: 5671, net_pay: 10162, currency: 'USD', pay_date: '2026-01-28' },
  { id: 'epe-10', org_id: 'org-1', payroll_run_id: 'pr-1', employee_id: 'emp-18', employee_name: 'Folake Adebayo', department: 'Human Resources', country: 'Nigeria', base_pay: 7083, gross_pay: 7083, federal_tax: 1062, state_tax: 354, social_security: 439, medicare: 103, pension: 354, health_insurance: 500, bonus: 0, overtime: 0, other_deductions: 0, total_deductions: 2812, net_pay: 4271, currency: 'USD', pay_date: '2026-01-28' },
  { id: 'epe-24', org_id: 'org-1', payroll_run_id: 'pr-1', employee_id: 'emp-19', employee_name: 'Moussa Sow', department: 'Human Resources', country: 'Senegal', base_pay: 4583, gross_pay: 4583, federal_tax: 688, state_tax: 229, social_security: 284, medicare: 66, pension: 229, health_insurance: 500, bonus: 0, overtime: 0, other_deductions: 0, total_deductions: 1996, net_pay: 2587, currency: 'USD', pay_date: '2026-01-28' },
  { id: 'epe-25', org_id: 'org-1', payroll_run_id: 'pr-1', employee_id: 'emp-20', employee_name: 'Ama Darko', department: 'Human Resources', country: 'Ghana', base_pay: 7083, gross_pay: 7083, federal_tax: 1062, state_tax: 354, social_security: 439, medicare: 103, pension: 354, health_insurance: 500, bonus: 0, overtime: 0, other_deductions: 0, total_deductions: 2812, net_pay: 4271, currency: 'USD', pay_date: '2026-01-28' },
  // Risk & Compliance
  { id: 'epe-11', org_id: 'org-1', payroll_run_id: 'pr-1', employee_id: 'emp-21', employee_name: 'Chukwuma Obi', department: 'Risk & Compliance', country: 'Nigeria', base_pay: 16250, gross_pay: 16250, federal_tax: 2438, state_tax: 813, social_security: 1008, medicare: 236, pension: 813, health_insurance: 500, bonus: 0, overtime: 0, other_deductions: 0, total_deductions: 5808, net_pay: 10442, currency: 'USD', pay_date: '2026-01-28' },
  { id: 'epe-26', org_id: 'org-1', payroll_run_id: 'pr-1', employee_id: 'emp-22', employee_name: 'Ousmane Ba', department: 'Risk & Compliance', country: 'Senegal', base_pay: 7500, gross_pay: 7500, federal_tax: 1125, state_tax: 375, social_security: 465, medicare: 109, pension: 375, health_insurance: 500, bonus: 0, overtime: 0, other_deductions: 0, total_deductions: 2949, net_pay: 4551, currency: 'USD', pay_date: '2026-01-28' },
  { id: 'epe-27', org_id: 'org-1', payroll_run_id: 'pr-1', employee_id: 'emp-23', employee_name: 'Grace Wambui', department: 'Risk & Compliance', country: 'Kenya', base_pay: 4583, gross_pay: 4583, federal_tax: 688, state_tax: 229, social_security: 284, medicare: 66, pension: 229, health_insurance: 500, bonus: 0, overtime: 0, other_deductions: 0, total_deductions: 1996, net_pay: 2587, currency: 'USD', pay_date: '2026-01-28' },
  // Finance
  { id: 'epe-12', org_id: 'org-1', payroll_run_id: 'pr-1', employee_id: 'emp-24', employee_name: 'Ifeanyi Agu', department: 'Finance', country: 'Nigeria', base_pay: 16667, gross_pay: 16667, federal_tax: 2500, state_tax: 833, social_security: 1033, medicare: 242, pension: 833, health_insurance: 500, bonus: 0, overtime: 0, other_deductions: 0, total_deductions: 5941, net_pay: 10726, currency: 'USD', pay_date: '2026-01-28' },
  { id: 'epe-13', org_id: 'org-1', payroll_run_id: 'pr-1', employee_id: 'emp-25', employee_name: 'Seydou Traore', department: 'Finance', country: "Cote d'Ivoire", base_pay: 9583, gross_pay: 9583, federal_tax: 1437, state_tax: 479, social_security: 594, medicare: 139, pension: 479, health_insurance: 500, bonus: 0, overtime: 0, other_deductions: 0, total_deductions: 3628, net_pay: 5955, currency: 'USD', pay_date: '2026-01-28' },
  { id: 'epe-28', org_id: 'org-1', payroll_run_id: 'pr-1', employee_id: 'emp-26', employee_name: 'Akosua Owusu', department: 'Finance', country: 'Ghana', base_pay: 4583, gross_pay: 4583, federal_tax: 688, state_tax: 229, social_security: 284, medicare: 66, pension: 229, health_insurance: 500, bonus: 0, overtime: 0, other_deductions: 0, total_deductions: 1996, net_pay: 2587, currency: 'USD', pay_date: '2026-01-28' },
  // Marketing
  { id: 'epe-14', org_id: 'org-1', payroll_run_id: 'pr-1', employee_id: 'emp-27', employee_name: 'Nneka Uzoma', department: 'Marketing', country: 'Nigeria', base_pay: 15417, gross_pay: 15417, federal_tax: 2313, state_tax: 771, social_security: 956, medicare: 224, pension: 771, health_insurance: 500, bonus: 0, overtime: 0, other_deductions: 0, total_deductions: 5535, net_pay: 9882, currency: 'USD', pay_date: '2026-01-28' },
  { id: 'epe-15', org_id: 'org-1', payroll_run_id: 'pr-1', employee_id: 'emp-28', employee_name: 'Peter Njoroge', department: 'Marketing', country: 'Kenya', base_pay: 5417, gross_pay: 5417, federal_tax: 813, state_tax: 271, social_security: 336, medicare: 79, pension: 271, health_insurance: 500, bonus: 0, overtime: 0, other_deductions: 0, total_deductions: 2270, net_pay: 3147, currency: 'USD', pay_date: '2026-01-28' },
  { id: 'epe-29', org_id: 'org-1', payroll_run_id: 'pr-1', employee_id: 'emp-29', employee_name: 'Tunde Bakare', department: 'Marketing', country: 'Nigeria', base_pay: 4583, gross_pay: 4583, federal_tax: 688, state_tax: 229, social_security: 284, medicare: 66, pension: 229, health_insurance: 500, bonus: 0, overtime: 0, other_deductions: 0, total_deductions: 1996, net_pay: 2587, currency: 'USD', pay_date: '2026-01-28' },
  { id: 'epe-30', org_id: 'org-1', payroll_run_id: 'pr-1', employee_id: 'emp-30', employee_name: 'Aminata Diop', department: 'Marketing', country: 'Senegal', base_pay: 2917, gross_pay: 2917, federal_tax: 438, state_tax: 146, social_security: 181, medicare: 42, pension: 146, health_insurance: 500, bonus: 0, overtime: 0, other_deductions: 0, total_deductions: 1453, net_pay: 1464, currency: 'USD', pay_date: '2026-01-28' },
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
  { id: 'vnd-1', org_id: 'org-1', name: 'Microsoft Corporation', contact_email: 'enterprise@microsoft.com', contact_phone: '+1 (425) 882-8080', category: 'Software', status: 'active' as const, payment_terms: 'Net 30', tax_id: '91-1144442', risk_level: 'low' as const, created_at: '2024-01-01T00:00:00Z' },
  { id: 'vnd-2', org_id: 'org-1', name: 'Amazon Web Services', contact_email: 'support@aws.amazon.com', contact_phone: '+1 (206) 266-1000', category: 'Cloud Infrastructure', status: 'active' as const, payment_terms: 'Net 30', tax_id: '91-1646860', risk_level: 'medium' as const, created_at: '2024-01-01T00:00:00Z' },
  { id: 'vnd-3', org_id: 'org-1', name: 'Deloitte Africa', contact_email: 'africa@deloitte.com', contact_phone: '+27 11 806 5000', category: 'Consulting', status: 'active' as const, payment_terms: 'Net 45', tax_id: '', risk_level: 'medium' as const, created_at: '2024-06-01T00:00:00Z' },
  { id: 'vnd-4', org_id: 'org-1', name: 'Ecobank Academy', contact_email: 'academy@ecobank.com', contact_phone: '+228 22 21 03 03', category: 'Training', status: 'active' as const, payment_terms: 'Net 60', tax_id: '', risk_level: 'low' as const, created_at: '2024-01-01T00:00:00Z' },
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
  { email: 'yersimo@theworktempo.com', password: 'W@kilisha2026', employeeId: 'emp-17', role: 'owner', label: 'Master Admin', title: 'Platform Owner', department: 'Executive', description: 'Master admin with full super access. Can switch to any user role.' },
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
// GUIDED JOURNEYS (Oracle Fusion-inspired)
// ============================================================

export interface JourneyStep {
  id: string
  title: string
  description: string
  status: 'pending' | 'in_progress' | 'completed' | 'skipped'
  type: 'task' | 'form' | 'review' | 'approval' | 'info'
  action_href?: string
}

export interface Journey {
  id: string
  type: 'new_hire_onboarding' | 'performance_review' | 'salary_review' | 'benefits_enrollment'
  title: string
  description: string
  employee_id: string
  assigned_by: string
  status: 'not_started' | 'in_progress' | 'completed'
  current_step: number
  steps: JourneyStep[]
  started_at: string | null
  due_date: string | null
}

export const demoJourneys: Journey[] = [
  {
    id: 'journey-1',
    type: 'new_hire_onboarding',
    title: 'New Hire Onboarding',
    description: 'Complete your onboarding journey to get fully set up at Ecobank.',
    employee_id: 'emp-30',
    assigned_by: 'emp-1',
    status: 'in_progress',
    current_step: 2,
    started_at: '2026-02-10T09:00:00Z',
    due_date: '2026-03-10T09:00:00Z',
    steps: [
      { id: 'js-1', title: 'Complete personal profile', description: 'Fill in your personal details, emergency contacts, and banking information.', status: 'completed', type: 'form', action_href: '/people' },
      { id: 'js-2', title: 'Review company policies', description: 'Read and acknowledge the employee handbook, code of conduct, and IT security policy.', status: 'completed', type: 'info', action_href: '/settings' },
      { id: 'js-3', title: 'Complete compliance training', description: 'Finish the required Anti-Money Laundering and Data Protection courses.', status: 'in_progress', type: 'task', action_href: '/learning' },
      { id: 'js-4', title: 'Meet your buddy', description: 'Schedule and complete your first meeting with your onboarding buddy.', status: 'pending', type: 'task', action_href: '/mentoring' },
      { id: 'js-5', title: 'Set first 90-day goals', description: 'Work with your manager to define your initial goals and objectives.', status: 'pending', type: 'form', action_href: '/performance' },
      { id: 'js-6', title: '30-day check-in', description: 'Complete your 30-day check-in review with your manager.', status: 'pending', type: 'review', action_href: '/performance' },
    ],
  },
  {
    id: 'journey-2',
    type: 'performance_review',
    title: 'Q1 2026 Performance Review',
    description: 'Complete the quarterly performance review cycle for your team.',
    employee_id: 'emp-1',
    assigned_by: 'emp-5',
    status: 'in_progress',
    current_step: 1,
    started_at: '2026-02-15T09:00:00Z',
    due_date: '2026-03-31T09:00:00Z',
    steps: [
      { id: 'js-7', title: 'Self-assessment', description: 'Complete your self-assessment for Q1 performance.', status: 'completed', type: 'form', action_href: '/performance' },
      { id: 'js-8', title: 'Peer feedback collection', description: 'Request and gather peer feedback from at least 3 colleagues.', status: 'in_progress', type: 'task', action_href: '/performance' },
      { id: 'js-9', title: 'Manager review', description: 'Your manager will complete their assessment of your performance.', status: 'pending', type: 'approval', action_href: '/performance' },
      { id: 'js-10', title: 'Calibration meeting', description: 'Participate in the department-level calibration session.', status: 'pending', type: 'review', action_href: '/performance' },
    ],
  },
  {
    id: 'journey-3',
    type: 'benefits_enrollment',
    title: 'Annual Benefits Enrollment',
    description: 'Review and update your benefit selections for the new plan year.',
    employee_id: 'emp-3',
    assigned_by: 'emp-9',
    status: 'not_started',
    current_step: 0,
    started_at: null,
    due_date: '2026-03-15T09:00:00Z',
    steps: [
      { id: 'js-11', title: 'Review current benefits', description: 'Review your existing benefit enrollments and coverage levels.', status: 'pending', type: 'info', action_href: '/benefits' },
      { id: 'js-12', title: 'Update dependents', description: 'Add or remove dependents from your benefit plans.', status: 'pending', type: 'form', action_href: '/benefits' },
      { id: 'js-13', title: 'Select plan options', description: 'Choose your medical, dental, and vision plan options.', status: 'pending', type: 'form', action_href: '/benefits' },
      { id: 'js-14', title: 'Confirm enrollment', description: 'Review and confirm your benefit elections.', status: 'pending', type: 'approval', action_href: '/benefits' },
    ],
  },
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
  // How to Use Tempo — General Course blocks
  { id: 'tblock-1', course_id: 'course-tempo', module_index: 0, order: 0, type: 'text' as const, title: 'Welcome to Tempo', content: `## What is Tempo?\n\nTempo is a **comprehensive Human Capital Management (HCM) platform** designed for modern organizations across Africa and beyond. From hiring to retiring, Tempo provides a unified workspace for managing your entire employee lifecycle.\n\nWhether you are an HR administrator, a people manager, or an employee — Tempo gives you the tools to work smarter, stay compliant, and grow your career.\n\n## Key Modules at a Glance\n\n- **People & Organization** — Centralized employee directory, department management, and org structure\n- **Payroll & Compensation** — Automated payroll across multiple countries and currencies\n- **Time & Attendance** — Leave management, attendance tracking, and shift scheduling\n- **Performance & Goals** — SMART goals, 360-degree reviews, and performance analytics\n- **Learning & Development** — Course creation, enrollment, skills tracking, and AI-powered content\n- **Recruitment** — Job posting, applicant tracking, interview scheduling, and offer management\n- **Engagement** — Pulse surveys, eNPS tracking, and action planning\n- **Analytics** — Real-time dashboards, headcount trends, and workforce insights\n\n> 💡 **Pro Tip:** Use the sidebar to navigate between modules. Your most frequently visited sections appear at the top for quick access.\n\n## Who Uses Tempo?\n\n- **HR Administrators** manage company-wide settings, policies, and compliance\n- **Managers** oversee their teams, approve requests, and track performance\n- **Employees** access their profiles, submit requests, and complete learning\n- **Executives** get real-time dashboards and organizational analytics`, duration_minutes: 10, status: 'published' as const },
  { id: 'tblock-2', course_id: 'course-tempo', module_index: 0, order: 1, type: 'video' as const, title: 'Quick Tour of the Dashboard', content: 'https://videos.tempo.com/dashboard-tour.mp4', duration_minutes: 8, status: 'published' as const },
  { id: 'tblock-3', course_id: 'course-tempo', module_index: 1, order: 0, type: 'text' as const, title: 'Navigating Your Workspace', content: `## The Sidebar\n\nThe left sidebar is your **command center**. Every module in Tempo is accessible from here. Modules are organized by function:\n\n- **Home** — Your personal dashboard with quick stats and notifications\n- **People** — Employee directory and organizational structure\n- **Payroll** — Compensation, pay runs, and pay stubs\n- **Time** — Leave requests, attendance, and schedules\n- **Performance** — Goals, reviews, and feedback\n- **Learning** — Courses, paths, and skill development\n- **Recruitment** — Open positions, candidates, and hiring pipelines\n\n## Quick Actions\n\nLook for the **+** button in the top-right corner of most pages. This gives you instant access to common actions:\n\n1. Create a new employee record\n2. Submit a leave request\n3. Start a performance review\n4. Enroll someone in a course\n5. Post a new job opening\n\n## Search\n\nThe **global search bar** at the top of every page lets you find anything instantly — employees, documents, courses, or settings. Just type and results appear in real time.\n\n> 💡 **Keyboard Shortcut:** Press **Cmd+K** (Mac) or **Ctrl+K** (Windows) to open search from anywhere.\n\n## Notifications\n\nThe bell icon shows your **pending notifications** — approval requests, course deadlines, review reminders, and system alerts. Click any notification to jump directly to the relevant item.`, duration_minutes: 8, status: 'published' as const },
  { id: 'tblock-4', course_id: 'course-tempo', module_index: 1, order: 1, type: 'interactive' as const, title: 'Explore the Dashboard', content: 'Navigate through the sidebar modules and familiarize yourself with each section. Try using the search bar to find an employee profile.', duration_minutes: 10, status: 'published' as const },
  { id: 'tblock-5', course_id: 'course-tempo', module_index: 2, order: 0, type: 'text' as const, title: 'Managing People & Organization', content: `## Employee Directory\n\nThe **People** module is the heart of Tempo. Every employee has a comprehensive profile containing:\n\n- **Personal Information** — Name, contact details, and emergency contacts\n- **Job Details** — Title, department, manager, level, and employment type\n- **Compensation** — Salary, bonuses, and pay history\n- **Documents** — Contracts, certifications, and uploaded files\n- **Performance** — Goals, review scores, and feedback history\n- **Learning** — Enrolled courses, completed certifications, and skill gaps\n\n## Departments & Org Structure\n\nTempo maintains a **hierarchical org structure** that reflects your real organization:\n\n- Create and manage **departments** with their own budgets, headcounts, and managers\n- View the **org chart** to understand reporting lines at a glance\n- Track **headcount by country** for multi-geography organizations\n- Set up **cost centers** for budgeting and financial planning\n\n## Bulk Actions\n\nNeed to update multiple records? Tempo supports **bulk operations**:\n\n- Import employees via CSV/Excel upload\n- Bulk update departments, titles, or levels\n- Mass-enroll employees in compliance training\n- Export filtered employee lists for reporting\n\n> ✅ **Best Practice:** Keep employee profiles up to date. Accurate data powers analytics, compliance reporting, and AI-driven insights across the entire platform.`, duration_minutes: 12, status: 'published' as const },
  { id: 'tblock-6', course_id: 'course-tempo', module_index: 2, order: 1, type: 'video' as const, title: 'Setting Up Departments & Teams', content: 'https://videos.tempo.com/departments-setup.mp4', duration_minutes: 10, status: 'published' as const },
  { id: 'tblock-7', course_id: 'course-tempo', module_index: 3, order: 0, type: 'text' as const, title: 'Day-to-Day HR Workflows', content: `## Leave & Time Off\n\nTempo makes leave management effortless for everyone:\n\n**For Employees:**\n\n1. Go to the **Time** module and click "Request Leave"\n2. Select the leave type (Annual, Sick, Personal, etc.)\n3. Choose your dates and add an optional note\n4. Submit — your manager receives an instant notification\n\n**For Managers:**\n\n1. Review pending requests in your **Approvals** dashboard\n2. See the team calendar to check for conflicts\n3. Approve or decline with one click\n4. The employee is notified immediately\n\n## Attendance Tracking\n\nTempo supports multiple attendance methods:\n\n- **Clock In/Out** — Employees can clock in from the web or mobile app\n- **Biometric Integration** — Connect with supported fingerprint or face scanners\n- **Geofencing** — Verify employees are clocking in from approved locations\n- **Manager Override** — Correct missed punches or adjust records\n\n## Approval Workflows\n\nTempo's **approval engine** handles multi-step approval chains:\n\n- Leave requests route to the direct manager\n- Expense claims above a threshold require additional VP approval\n- Document changes trigger HR review\n- Custom workflows can be configured per policy\n\n> 💡 **Pro Tip:** Set up **delegation rules** so that approvals continue to flow even when a manager is on leave. Navigate to Settings → Delegation to configure this.`, duration_minutes: 12, status: 'published' as const },
  { id: 'tblock-8', course_id: 'course-tempo', module_index: 3, order: 1, type: 'text' as const, title: 'Payroll & Compensation', content: `## Running Payroll\n\nTempo automates payroll processing across multiple countries and currencies. Here is the typical payroll workflow:\n\n1. **Review** — Open the Payroll module and review the current period\n2. **Verify** — Check for any adjustments: new hires, terminations, bonuses, or deductions\n3. **Calculate** — Tempo automatically calculates gross pay, taxes, and deductions\n4. **Approve** — Submit the payroll run for approval\n5. **Process** — Once approved, payments are initiated\n\n## Pay Components\n\nEvery employee's pay is broken down into clear components:\n\n- **Basic Salary** — The base compensation amount\n- **Allowances** — Housing, transport, meal, and other allowances\n- **Bonuses** — Performance bonuses, 13th month, and commissions\n- **Deductions** — Tax, pension, health insurance, and loan repayments\n- **Net Pay** — The final amount deposited to the employee's bank account\n\n## Multi-Country Support\n\nTempo handles the complexity of multi-country payroll:\n\n- **Automatic tax calculations** per country's tax laws\n- **Currency conversion** for organizations paying in multiple currencies\n- **Statutory compliance** — pension contributions, social security, and local regulations\n- **Country-specific pay slips** formatted to local requirements\n\n> ℹ️ **Note:** Always review the payroll summary carefully before final approval. While Tempo calculates automatically, it is important to verify any manual adjustments or one-time payments are correctly reflected.`, duration_minutes: 15, status: 'published' as const },
  { id: 'tblock-9', course_id: 'course-tempo', module_index: 4, order: 0, type: 'text' as const, title: 'Goals & Performance Reviews', content: `## Setting Goals\n\nEffective performance management starts with clear goals. Tempo supports multiple goal frameworks:\n\n- **SMART Goals** — Specific, Measurable, Achievable, Relevant, Time-bound\n- **OKRs** — Objectives and Key Results for alignment with company strategy\n- **KPIs** — Key Performance Indicators for ongoing measurement\n\n**To create a goal:**\n\n1. Navigate to **Performance → Goals**\n2. Click "Add Goal" and choose the goal type\n3. Write a clear objective and define measurable key results\n4. Set the timeline (quarterly, annual, or custom)\n5. Link to a company-level OKR for strategic alignment\n\n## Performance Review Cycles\n\nTempo supports structured review cycles with multiple feedback sources:\n\n- **Self-Assessment** — Employees reflect on their own performance\n- **Manager Review** — Direct managers provide ratings and feedback\n- **Peer Feedback** — Colleagues contribute 360-degree perspectives\n- **Upward Feedback** — Team members provide anonymous feedback on their manager\n\n## Calibration & Analytics\n\nAfter reviews are collected, Tempo provides tools to ensure fairness:\n\n- **9-Box Grid** — Visualize performance vs. potential across your team\n- **Rating Distribution** — Check for bias in rating patterns\n- **Calibration Sessions** — Managers can align on ratings together\n- **Historical Trends** — Track performance changes over multiple review cycles\n\n> ✅ **Best Practice:** Link performance reviews to learning recommendations. When a skill gap is identified during a review, Tempo's AI can automatically suggest relevant courses from your learning catalog.`, duration_minutes: 15, status: 'published' as const },
  { id: 'tblock-10', course_id: 'course-tempo', module_index: 4, order: 1, type: 'interactive' as const, title: 'Set Up a Performance Review', content: 'Practice creating a performance review cycle. Navigate to Performance, create a new review, select reviewers, and configure the timeline. This hands-on exercise walks you through the entire setup process.', duration_minutes: 15, status: 'published' as const },
  { id: 'tblock-11', course_id: 'course-tempo', module_index: 5, order: 0, type: 'text' as const, title: 'Learning & Development Module', content: `## Course Catalog\n\nThe **Learning** module is where organizations build and deliver training. The course catalog provides:\n\n- **Browse by Category** — Filter courses by topic: Leadership, Compliance, Technical, etc.\n- **Filter by Level** — Beginner, Intermediate, and Advanced courses\n- **Format Options** — Online self-paced, blended, classroom, or live sessions\n- **AI Recommendations** — Personalized course suggestions based on your role and skill gaps\n\n## Creating Courses\n\nTempo's **Course Builder** lets you create professional courses without any technical skills:\n\n1. Define the course title, description, category, and target audience\n2. Add **modules** to organize content into logical sections\n3. Within each module, add **blocks** — the individual learning units:\n\n- **Text Blocks** — Written content with rich formatting\n- **Video Blocks** — Embedded video lessons\n- **Quiz Blocks** — Assessment questions with auto-grading\n- **Interactive Blocks** — Hands-on activities and exercises\n- **Download Blocks** — Downloadable resources and templates\n\n## AI-Powered Features\n\nTempo's AI engine supercharges course creation:\n\n- **Generate Course Outlines** — Enter a topic, and AI creates a complete course structure\n- **Auto-Generate Quiz Questions** — AI writes assessment questions from your content\n- **Skill Gap Analysis** — Identify what training your organization needs most\n- **Completion Predictions** — AI predicts which learners might need extra support\n\n## Tracking & Compliance\n\n- **Progress Tracking** — See exactly where each learner is in their courses\n- **Completion Certificates** — Automatically issued when a course is finished\n- **Compliance Deadlines** — Set mandatory training with due dates and reminders\n- **Auto-Enrollment Rules** — Automatically enroll employees based on department, role, or event\n\n> 💡 **Pro Tip:** Use the AI Builder to generate a course outline, then customize the generated blocks with your organization's specific content. This can reduce course creation time by up to 80%.`, duration_minutes: 15, status: 'published' as const },
  { id: 'tblock-12', course_id: 'course-tempo', module_index: 5, order: 1, type: 'download' as const, title: 'Tempo Quick Reference Guide', content: 'https://docs.tempo.com/tempo-quick-reference-guide.pdf', duration_minutes: 5, status: 'published' as const },
  { id: 'tblock-13', course_id: 'course-tempo', module_index: 6, order: 0, type: 'quiz' as const, title: 'Tempo Platform Knowledge Check', content: 'tquiz-q1,tquiz-q2,tquiz-q3,tquiz-q4,tquiz-q5,tquiz-q6', duration_minutes: 10, status: 'published' as const },
  // Kash & Co course blocks
  { id: 'kblock-1', course_id: 'kcourse-1', module_index: 0, order: 0, type: 'text' as const, title: 'The Consulting Mindset', content: 'Introduction to structured thinking, the pyramid principle, and MECE frameworks for problem solving.', duration_minutes: 20, status: 'published' as const },
  { id: 'kblock-2', course_id: 'kcourse-1', module_index: 0, order: 1, type: 'video' as const, title: 'Hypothesis-Driven Approach', content: 'https://videos.tempo.com/hypothesis-driven.mp4', duration_minutes: 25, status: 'published' as const },
  { id: 'kblock-3', course_id: 'kcourse-1', module_index: 0, order: 2, type: 'quiz' as const, title: 'Module 1 Assessment', content: 'kquiz-q1,kquiz-q2', duration_minutes: 10, status: 'published' as const },
  { id: 'kblock-4', course_id: 'kcourse-1', module_index: 1, order: 0, type: 'text' as const, title: 'Client Communication Essentials', content: 'Frameworks for executive presentations, managing client expectations, and delivering difficult messages.', duration_minutes: 20, status: 'published' as const },
  { id: 'kblock-5', course_id: 'kcourse-1', module_index: 1, order: 1, type: 'interactive' as const, title: 'Mock Client Presentation', content: 'Practice delivering a strategy recommendation to a simulated C-suite audience.', duration_minutes: 30, status: 'published' as const },
  { id: 'kblock-6', course_id: 'kcourse-2', module_index: 0, order: 0, type: 'text' as const, title: 'DCF Fundamentals', content: 'Building discounted cash flow models from scratch: WACC, terminal value, and sensitivity analysis.', duration_minutes: 25, status: 'published' as const },
  { id: 'kblock-7', course_id: 'kcourse-2', module_index: 0, order: 1, type: 'download' as const, title: 'Excel Model Template Pack', content: 'https://docs.tempo.com/dcf-model-templates.xlsx', duration_minutes: 5, status: 'published' as const },
  { id: 'kblock-8', course_id: 'kcourse-2', module_index: 1, order: 0, type: 'video' as const, title: 'LBO Modelling Masterclass', content: 'https://videos.tempo.com/lbo-masterclass.mp4', duration_minutes: 40, status: 'published' as const },
  { id: 'kblock-9', course_id: 'kcourse-4', module_index: 0, order: 0, type: 'text' as const, title: 'Python for Data Analysis', content: 'Setting up your environment, pandas basics, and loading client datasets for exploratory analysis.', duration_minutes: 20, status: 'published' as const },
  { id: 'kblock-10', course_id: 'kcourse-4', module_index: 0, order: 1, type: 'interactive' as const, title: 'Jupyter Notebook Lab', content: 'Hands-on lab analyzing a sample consulting engagement dataset with Python.', duration_minutes: 45, status: 'published' as const },
  { id: 'kblock-11', course_id: 'kcourse-5', module_index: 0, order: 0, type: 'text' as const, title: 'Sub-Saharan Africa Overview', content: 'Key economic indicators, growth sectors, and business environment across 15 major African markets.', duration_minutes: 30, status: 'published' as const },
  { id: 'kblock-12', course_id: 'kcourse-5', module_index: 0, order: 1, type: 'video' as const, title: 'Case Study: East Africa Tech Boom', content: 'https://videos.tempo.com/east-africa-tech.mp4', duration_minutes: 20, status: 'published' as const },
  // kcourse-3: Client Relationship Management
  { id: 'kblock-13', course_id: 'kcourse-3', module_index: 0, order: 0, type: 'text' as const, title: 'Building Executive Relationships', content: 'How to earn trust with C-suite stakeholders: preparation, active listening, and delivering on promises.', duration_minutes: 20, status: 'published' as const },
  { id: 'kblock-14', course_id: 'kcourse-3', module_index: 0, order: 1, type: 'video' as const, title: 'Navigating Difficult Client Conversations', content: 'https://videos.tempo.com/difficult-conversations.mp4', duration_minutes: 22, status: 'published' as const },
  { id: 'kblock-15', course_id: 'kcourse-3', module_index: 1, order: 0, type: 'interactive' as const, title: 'Client Negotiation Simulation', content: 'Role-play exercise negotiating scope changes with a demanding client.', duration_minutes: 35, status: 'published' as const },
  // kcourse-6: Partner Development Program
  { id: 'kblock-16', course_id: 'kcourse-6', module_index: 0, order: 0, type: 'text' as const, title: 'Executive Presence & Gravitas', content: 'Developing the personal brand, communication style, and strategic thinking expected at the partner level.', duration_minutes: 25, status: 'published' as const },
  { id: 'kblock-17', course_id: 'kcourse-6', module_index: 0, order: 1, type: 'video' as const, title: 'Rainmaking: Business Development Masterclass', content: 'https://videos.tempo.com/rainmaking.mp4', duration_minutes: 35, status: 'published' as const },
  { id: 'kblock-18', course_id: 'kcourse-6', module_index: 1, order: 0, type: 'text' as const, title: 'Practice Leadership & P&L Management', content: 'Running a consulting practice: team development, financial management, and strategic planning at scale.', duration_minutes: 30, status: 'published' as const },
  { id: 'kblock-19', course_id: 'kcourse-6', module_index: 1, order: 1, type: 'quiz' as const, title: 'Partner Readiness Assessment', content: 'kquiz-q4,kquiz-q5', duration_minutes: 15, status: 'draft' as const },
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
  // How to Use Tempo quiz questions
  { id: 'tquiz-q1', org_id: 'org-1', course_id: 'course-tempo', type: 'multiple_choice' as const, question: 'What is the primary navigation element in Tempo that gives you access to all modules?', options: ['The top menu bar', 'The left sidebar', 'The footer navigation', 'The quick action button'] as string[], correct_answer: 'The left sidebar', points: 10, explanation: 'The left sidebar is your command center in Tempo. Every module — People, Payroll, Time, Performance, Learning, and more — is accessible from the sidebar.' },
  { id: 'tquiz-q2', org_id: 'org-1', course_id: 'course-tempo', type: 'true_false' as const, question: 'Managers can approve leave requests directly from their Approvals dashboard with a single click.', options: ['True', 'False'] as string[], correct_answer: 'True', points: 5, explanation: 'Tempo provides a streamlined Approvals dashboard where managers can review team calendars for conflicts and approve or decline requests with one click.' },
  { id: 'tquiz-q3', org_id: 'org-1', course_id: 'course-tempo', type: 'multiple_choice' as const, question: 'Which Tempo module allows you to create courses with text, video, quiz, and interactive blocks?', options: ['Performance', 'Learning & Development', 'Engagement', 'Recruitment'] as string[], correct_answer: 'Learning & Development', points: 10, explanation: 'The Learning & Development module includes a Course Builder that supports text blocks, video blocks, quiz blocks, interactive blocks, and download blocks.' },
  { id: 'tquiz-q4', org_id: 'org-1', course_id: 'course-tempo', type: 'fill_blank' as const, question: 'Tempo\'s performance module supports ___-degree feedback reviews, which include self-assessment, manager review, peer feedback, and upward feedback.', options: [] as string[], correct_answer: '360', points: 10, explanation: '360-degree feedback collects perspectives from multiple sources — self, manager, peers, and direct reports — to provide a comprehensive view of performance.' },
  { id: 'tquiz-q5', org_id: 'org-1', course_id: 'course-tempo', type: 'multiple_choice' as const, question: 'What can Tempo\'s AI Builder do for course creation?', options: ['Only generate quiz questions', 'Generate complete course outlines from a topic and auto-create quiz questions', 'Only suggest course titles', 'Only translate courses to other languages'] as string[], correct_answer: 'Generate complete course outlines from a topic and auto-create quiz questions', points: 10, explanation: 'Tempo\'s AI engine can generate full course outlines from a topic, auto-generate quiz questions from content, analyze skill gaps, and predict completion rates.' },
  { id: 'tquiz-q6', org_id: 'org-1', course_id: 'course-tempo', type: 'true_false' as const, question: 'Tempo supports payroll processing across multiple countries and currencies simultaneously.', options: ['True', 'False'] as string[], correct_answer: 'True', points: 5, explanation: 'Tempo handles multi-country payroll with automatic tax calculations, currency conversion, statutory compliance, and country-specific pay slip formatting.' },
  // Kash & Co quiz questions
  { id: 'kquiz-q1', org_id: 'org-2', course_id: 'kcourse-1', type: 'multiple_choice' as const, question: 'Which framework ensures a problem is broken into non-overlapping, comprehensive parts?', options: ['SWOT', 'MECE', 'Porter\'s Five Forces', 'BCG Matrix'] as string[], correct_answer: 'MECE', points: 10, explanation: 'MECE (Mutually Exclusive, Collectively Exhaustive) is the fundamental consulting framework for structured problem decomposition.' },
  { id: 'kquiz-q2', org_id: 'org-2', course_id: 'kcourse-1', type: 'true_false' as const, question: 'In hypothesis-driven consulting, you should collect all available data before forming a hypothesis.', options: ['True', 'False'] as string[], correct_answer: 'False', points: 5, explanation: 'Hypothesis-driven consulting forms an initial hypothesis first, then tests it with targeted data collection to stay efficient.' },
  { id: 'kquiz-q3', org_id: 'org-2', course_id: 'kcourse-1', type: 'fill_blank' as const, question: 'The communication framework where the main conclusion is presented first is called the _____ Principle.', options: [] as string[], correct_answer: 'Pyramid', points: 10, explanation: 'The Pyramid Principle, developed by Barbara Minto at McKinsey, structures communication with the conclusion first, followed by supporting arguments.' },
  { id: 'kquiz-q4', org_id: 'org-2', course_id: 'kcourse-2', type: 'multiple_choice' as const, question: 'In a DCF model, what discount rate is typically used for an unlevered free cash flow?', options: ['Cost of Equity', 'WACC', 'Risk-Free Rate', 'Cost of Debt'] as string[], correct_answer: 'WACC', points: 10, explanation: 'WACC (Weighted Average Cost of Capital) is used to discount unlevered free cash flows as it reflects the blended cost of all capital sources.' },
  { id: 'kquiz-q5', org_id: 'org-2', course_id: 'kcourse-2', type: 'essay' as const, question: 'Explain the key differences between an LBO model and a standard DCF valuation, and when each is most appropriate.', options: [] as string[], correct_answer: '', points: 25, explanation: 'Responses should cover leverage mechanics, IRR vs NPV focus, sponsor returns, and use cases for financial vs strategic buyers.' },
  { id: 'kquiz-q6', org_id: 'org-2', course_id: 'kcourse-4', type: 'multiple_choice' as const, question: 'Which Python library is most commonly used for tabular data manipulation in consulting analytics?', options: ['NumPy', 'pandas', 'matplotlib', 'scikit-learn'] as string[], correct_answer: 'pandas', points: 10, explanation: 'pandas is the standard library for data manipulation in Python, providing DataFrames for structured data analysis.' },
  { id: 'kquiz-q7', org_id: 'org-2', course_id: 'kcourse-5', type: 'multiple_choice' as const, question: 'Which African regional economic community covers East Africa?', options: ['ECOWAS', 'SADC', 'EAC', 'COMESA'] as string[], correct_answer: 'EAC', points: 10, explanation: 'The East African Community (EAC) includes Kenya, Tanzania, Uganda, Rwanda, Burundi, South Sudan, and the DRC.' },
  { id: 'kquiz-q8', org_id: 'org-2', course_id: 'kcourse-5', type: 'matching' as const, question: 'Match each African market with its primary economic driver.', options: ['Nigeria:Oil & Gas', 'Kenya:Technology & Services', 'South Africa:Mining & Finance', 'Rwanda:Tourism & ICT'] as string[], correct_answer: 'Nigeria:Oil & Gas,Kenya:Technology & Services,South Africa:Mining & Finance,Rwanda:Tourism & ICT', points: 20, explanation: 'Understanding the key economic sectors helps consultants tailor industry-specific strategies for each market.' },
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
// COMPLIANCE TRAINING TRACKING
// ============================================================

export const demoComplianceTraining = [
  { id: 'ct-1', org_id: 'org-1', course_id: 'course-2', title: 'AML Compliance Annual', regulatory_body: 'Central Bank of Nigeria', deadline: '2026-03-31', frequency: 'annual' as const, required_departments: ['dept-1', 'dept-2', 'dept-6', 'dept-7'] as string[], required_roles: ['all'] as string[], penalty: 'Regulatory fine up to $50,000', status: 'active' as const },
  { id: 'ct-2', org_id: 'org-1', course_id: 'course-6', title: 'Data Privacy & GDPR', regulatory_body: 'NDPR / GDPR Authority', deadline: '2026-04-15', frequency: 'annual' as const, required_departments: ['dept-1', 'dept-2', 'dept-3', 'dept-4', 'dept-5', 'dept-6', 'dept-7', 'dept-8'] as string[], required_roles: ['all'] as string[], penalty: 'Data processing suspension', status: 'active' as const },
  { id: 'ct-3', org_id: 'org-1', course_id: 'course-3', title: 'Credit Risk Certification', regulatory_body: 'UEMOA Banking Commission', deadline: '2026-06-30', frequency: 'biannual' as const, required_departments: ['dept-2'] as string[], required_roles: ['analyst', 'manager'] as string[], penalty: 'License review', status: 'active' as const },
  { id: 'ct-4', org_id: 'org-1', course_id: null, title: 'Cybersecurity Awareness', regulatory_body: 'ISO 27001', deadline: '2026-05-01', frequency: 'annual' as const, required_departments: ['dept-4'] as string[], required_roles: ['all'] as string[], penalty: 'Audit non-compliance', status: 'active' as const },
]

// ============================================================
// AUTO-ENROLLMENT RULES
// ============================================================

export const demoAutoEnrollRules = [
  { id: 'aer-1', org_id: 'org-1', name: 'New Hire Compliance', condition_type: 'department_join' as const, condition_value: 'all', action_type: 'enroll_course' as const, action_target_id: 'course-2', action_target_name: 'Anti-Money Laundering (AML) Compliance', is_active: true, triggered_count: 24, created_at: '2025-06-01T00:00:00Z' },
  { id: 'aer-2', org_id: 'org-1', name: 'Banking Staff GDPR', condition_type: 'department_join' as const, condition_value: 'dept-1,dept-2', action_type: 'enroll_course' as const, action_target_id: 'course-6', action_target_name: 'Data Privacy & GDPR', is_active: true, triggered_count: 18, created_at: '2025-06-01T00:00:00Z' },
  { id: 'aer-3', org_id: 'org-1', name: 'Manager Track Auto-Enroll', condition_type: 'role_match' as const, condition_value: 'Manager,Senior Manager,Director', action_type: 'enroll_path' as const, action_target_id: 'lp-1', action_target_name: 'New Manager Essentials', is_active: true, triggered_count: 8, created_at: '2025-09-15T00:00:00Z' },
  { id: 'aer-4', org_id: 'org-1', name: 'Tech Team Onboarding', condition_type: 'department_join' as const, condition_value: 'dept-4', action_type: 'enroll_path' as const, action_target_id: 'lp-3', action_target_name: 'Digital Banking Specialist', is_active: false, triggered_count: 5, created_at: '2025-10-01T00:00:00Z' },
  { id: 'aer-5', org_id: 'org-1', name: 'Annual Compliance Renewal', condition_type: 'compliance_due' as const, condition_value: 'annual', action_type: 'enroll_course' as const, action_target_id: 'course-2', action_target_name: 'Anti-Money Laundering (AML) Compliance', is_active: true, triggered_count: 30, created_at: '2025-01-01T00:00:00Z' },
]

// ============================================================
// ASSESSMENT ATTEMPTS
// ============================================================

export const demoAssessmentAttempts = [
  { id: 'att-1', org_id: 'org-1', employee_id: 'emp-2', course_id: 'course-1', quiz_title: 'Leadership Essentials Assessment', score: 85, passing_score: 70, total_questions: 10, correct_answers: 8, time_taken_minutes: 22, attempt_number: 1, max_attempts: 3, status: 'passed' as const, completed_at: '2026-02-10T14:30:00Z', answers: {} as Record<string, string> },
  { id: 'att-2', org_id: 'org-1', employee_id: 'emp-4', course_id: 'course-2', quiz_title: 'AML Compliance Test', score: 92, passing_score: 80, total_questions: 15, correct_answers: 14, time_taken_minutes: 18, attempt_number: 1, max_attempts: 3, status: 'passed' as const, completed_at: '2026-01-22T10:00:00Z', answers: {} as Record<string, string> },
  { id: 'att-3', org_id: 'org-1', employee_id: 'emp-6', course_id: 'course-3', quiz_title: 'Credit Analysis Mid-Term', score: 60, passing_score: 70, total_questions: 12, correct_answers: 7, time_taken_minutes: 35, attempt_number: 1, max_attempts: 3, status: 'failed' as const, completed_at: '2026-02-15T16:00:00Z', answers: {} as Record<string, string> },
  { id: 'att-4', org_id: 'org-1', employee_id: 'emp-6', course_id: 'course-3', quiz_title: 'Credit Analysis Mid-Term', score: 78, passing_score: 70, total_questions: 12, correct_answers: 9, time_taken_minutes: 28, attempt_number: 2, max_attempts: 3, status: 'passed' as const, completed_at: '2026-02-20T11:00:00Z', answers: {} as Record<string, string> },
  { id: 'att-5', org_id: 'org-1', employee_id: 'emp-14', course_id: 'course-7', quiz_title: 'Agile PM Certification', score: 95, passing_score: 75, total_questions: 20, correct_answers: 19, time_taken_minutes: 25, attempt_number: 1, max_attempts: 2, status: 'passed' as const, completed_at: '2025-09-20T09:00:00Z', answers: {} as Record<string, string> },
  { id: 'att-6', org_id: 'org-1', employee_id: 'emp-10', course_id: 'course-4', quiz_title: 'Digital Banking Basics', score: 45, passing_score: 70, total_questions: 10, correct_answers: 4, time_taken_minutes: 15, attempt_number: 1, max_attempts: 3, status: 'failed' as const, completed_at: '2026-02-25T14:00:00Z', answers: {} as Record<string, string> },
  { id: 'att-7', org_id: 'org-1', employee_id: 'emp-26', course_id: 'course-2', quiz_title: 'AML Compliance Test', score: 88, passing_score: 80, total_questions: 15, correct_answers: 13, time_taken_minutes: 20, attempt_number: 1, max_attempts: 3, status: 'passed' as const, completed_at: '2026-01-18T13:00:00Z', answers: {} as Record<string, string> },
  { id: 'att-8', org_id: 'org-1', employee_id: 'emp-3', course_id: 'course-5', quiz_title: 'Customer Excellence Final', score: 90, passing_score: 70, total_questions: 15, correct_answers: 13, time_taken_minutes: 30, attempt_number: 1, max_attempts: 3, status: 'passed' as const, completed_at: '2025-12-10T16:30:00Z', answers: {} as Record<string, string> },
]

// ============================================================
// MANAGER LEARNING ASSIGNMENTS
// ============================================================

export const demoLearningAssignments = [
  { id: 'la-1', org_id: 'org-1', employee_id: 'emp-11', assigned_by: 'emp-9', course_id: 'course-7', reason: 'Process improvement skills needed based on Q4 review', linked_review_id: 'review-5', due_date: '2026-04-30', status: 'in_progress' as const, created_at: '2026-02-01T00:00:00Z' },
  { id: 'la-2', org_id: 'org-1', employee_id: 'emp-3', assigned_by: 'emp-1', course_id: 'course-1', reason: 'Developing leadership skills for branch manager track', linked_review_id: 'review-3', due_date: '2026-06-30', status: 'in_progress' as const, created_at: '2026-01-20T00:00:00Z' },
  { id: 'la-3', org_id: 'org-1', employee_id: 'emp-16', assigned_by: 'emp-13', course_id: 'course-4', reason: 'Strengthen digital banking understanding for UX projects', linked_review_id: null, due_date: '2026-05-15', status: 'not_started' as const, created_at: '2026-02-15T00:00:00Z' },
  { id: 'la-4', org_id: 'org-1', employee_id: 'emp-7', assigned_by: 'emp-5', course_id: 'course-3', reason: 'Advanced credit skills required for senior analyst promotion', linked_review_id: 'review-6', due_date: '2026-06-30', status: 'in_progress' as const, created_at: '2026-01-15T00:00:00Z' },
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


// === From agent-a0587c7f ===
// ─── Offboarding: Exit Surveys ─────────────────────────────────────

export const demoExitSurveys = [
  {
    id: 'exit-survey-1',
    org_id: 'org-1',
    process_id: 'ob-proc-1',
    employee_id: 'emp-12',
    responses: {
      overall_satisfaction: 4,
      management_rating: 4,
      work_life_balance: 3,
      career_growth: 2,
      compensation_satisfaction: 3,
      team_culture: 5,
      reason_for_leaving: 'Career advancement opportunity not available internally',
      what_could_improve: 'More structured career progression paths and internal mobility programs',
      would_recommend: true,
      best_part: 'Collaborative team culture and supportive colleagues',
      additional_comments: 'Great company overall, just needed a new challenge. Would consider returning in the future.',
    },
    submitted_at: '2026-01-29T10:30:00Z',
    is_anonymous: false,
  },
]

// === From agent-a0587c7f ===
export const demoOffboardingChecklistItems = [
  // ── Standard Offboarding (ob-cl-1) ──
  { id: 'ob-cli-1', checklist_id: 'ob-cl-1', title: 'Disable Active Directory & SSO access', description: 'Revoke all Single Sign-On and directory accounts', category: 'access_revocation' as const, assignee_role: 'IT', order_index: 1, is_required: true },
  { id: 'ob-cli-2', checklist_id: 'ob-cl-1', title: 'Revoke VPN and remote access', description: 'Disable VPN credentials and remote desktop access', category: 'access_revocation' as const, assignee_role: 'IT', order_index: 2, is_required: true },
  { id: 'ob-cli-3', checklist_id: 'ob-cl-1', title: 'Collect laptop and peripherals', description: 'Retrieve company laptop, monitor, keyboard, mouse, and any other hardware', category: 'device_return' as const, assignee_role: 'IT', order_index: 3, is_required: true },
  { id: 'ob-cli-4', checklist_id: 'ob-cl-1', title: 'Return company mobile phone', description: 'Collect company-issued mobile device and SIM card', category: 'device_return' as const, assignee_role: 'IT', order_index: 4, is_required: false },
  { id: 'ob-cli-5', checklist_id: 'ob-cl-1', title: 'Document ongoing projects & handover notes', description: 'Create comprehensive handover documentation for all active projects', category: 'knowledge_transfer' as const, assignee_role: 'Manager', order_index: 5, is_required: true },
  { id: 'ob-cli-6', checklist_id: 'ob-cl-1', title: 'Transfer client relationships', description: 'Introduce replacement staff to key clients and stakeholders', category: 'knowledge_transfer' as const, assignee_role: 'Manager', order_index: 6, is_required: true },
  { id: 'ob-cli-7', checklist_id: 'ob-cl-1', title: 'Conduct exit interview', description: 'Schedule and conduct formal exit interview', category: 'exit_interview' as const, assignee_role: 'HR', order_index: 7, is_required: true },
  { id: 'ob-cli-8', checklist_id: 'ob-cl-1', title: 'Process final paycheck & accrued leave', description: 'Calculate and process final salary including accrued leave payout', category: 'final_pay' as const, assignee_role: 'Finance', order_index: 8, is_required: true },
  { id: 'ob-cli-9', checklist_id: 'ob-cl-1', title: 'Terminate benefits enrollment', description: 'End health, dental, vision, and other benefit plans', category: 'benefits' as const, assignee_role: 'HR', order_index: 9, is_required: true },
  { id: 'ob-cli-10', checklist_id: 'ob-cl-1', title: 'Generate employment reference letter', description: 'Prepare standard employment verification letter', category: 'documents' as const, assignee_role: 'HR', order_index: 10, is_required: false },
  // ── Involuntary Separation (ob-cl-2) ──
  { id: 'ob-cli-11', checklist_id: 'ob-cl-2', title: 'Immediately disable all system access', description: 'Revoke all IT access within 1 hour of notification', category: 'access_revocation' as const, assignee_role: 'IT', order_index: 1, is_required: true },
  { id: 'ob-cli-12', checklist_id: 'ob-cl-2', title: 'Revoke building access & badges', description: 'Deactivate access cards and building entry permissions', category: 'access_revocation' as const, assignee_role: 'Security', order_index: 2, is_required: true },
  { id: 'ob-cli-13', checklist_id: 'ob-cl-2', title: 'Revoke email and communication tools', description: 'Disable email, Slack, Teams, and other communication access', category: 'access_revocation' as const, assignee_role: 'IT', order_index: 3, is_required: true },
  { id: 'ob-cli-14', checklist_id: 'ob-cl-2', title: 'Collect all company equipment on-site', description: 'Retrieve laptop, phone, keys, badges, and all company property during exit meeting', category: 'device_return' as const, assignee_role: 'IT', order_index: 4, is_required: true },
  { id: 'ob-cli-15', checklist_id: 'ob-cl-2', title: 'Manager documents critical knowledge', description: 'Manager captures essential knowledge and project status from departing employee', category: 'knowledge_transfer' as const, assignee_role: 'Manager', order_index: 5, is_required: true },
  { id: 'ob-cli-16', checklist_id: 'ob-cl-2', title: 'Reassign active tasks and projects', description: 'Redistribute all active work items to remaining team members', category: 'knowledge_transfer' as const, assignee_role: 'Manager', order_index: 6, is_required: true },
  { id: 'ob-cli-17', checklist_id: 'ob-cl-2', title: 'Conduct brief exit interview (if appropriate)', description: 'Short exit interview focused on compliance; may be skipped for cause terminations', category: 'exit_interview' as const, assignee_role: 'HR', order_index: 7, is_required: false },
  { id: 'ob-cli-18', checklist_id: 'ob-cl-2', title: 'Calculate severance package', description: 'Compute severance pay per contract and local labour law', category: 'final_pay' as const, assignee_role: 'Finance', order_index: 8, is_required: true },
  { id: 'ob-cli-19', checklist_id: 'ob-cl-2', title: 'Process final pay with statutory deductions', description: 'Issue final paycheck including severance and all statutory deductions', category: 'final_pay' as const, assignee_role: 'Finance', order_index: 9, is_required: true },
  { id: 'ob-cli-20', checklist_id: 'ob-cl-2', title: 'Notify benefits providers of termination', description: 'Inform all benefit providers and process COBRA/continuation where applicable', category: 'benefits' as const, assignee_role: 'HR', order_index: 10, is_required: true },
  { id: 'ob-cli-21', checklist_id: 'ob-cl-2', title: 'Prepare separation agreement', description: 'Draft and obtain signatures on separation/release agreement', category: 'documents' as const, assignee_role: 'Legal', order_index: 11, is_required: true },
  { id: 'ob-cli-22', checklist_id: 'ob-cl-2', title: 'File compliance documentation', description: 'Ensure all regulatory paperwork is completed and filed', category: 'documents' as const, assignee_role: 'HR', order_index: 12, is_required: true },
]

// === From agent-a0587c7f ===
// ─── Offboarding: Checklists ─────────────────────────────────────

export const demoOffboardingChecklists = [
  {
    id: 'ob-cl-1',
    org_id: 'org-1',
    name: 'Standard Offboarding',
    description: 'Default checklist for voluntary departures (resignations, retirements, end of contract)',
    is_default: true,
    created_at: '2025-06-01T00:00:00Z',
  },
  {
    id: 'ob-cl-2',
    org_id: 'org-1',
    name: 'Involuntary Separation',
    description: 'Checklist for terminations and layoffs with additional compliance and security steps',
    is_default: false,
    created_at: '2025-06-01T00:00:00Z',
  },
]

// === From agent-a0587c7f ===
// ─── Offboarding: Processes ─────────────────────────────────────

export const demoOffboardingProcesses = [
  {
    id: 'ob-proc-1',
    org_id: 'org-1',
    employee_id: 'emp-12',
    initiated_by: 'emp-17',
    status: 'completed' as const,
    checklist_id: 'ob-cl-1',
    last_working_date: '2026-01-31',
    reason: 'resignation' as const,
    notes: 'Wanjiku accepted a position at another organization. Smooth transition completed.',
    started_at: '2026-01-10T09:00:00Z',
    completed_at: '2026-01-31T17:00:00Z',
  },
  {
    id: 'ob-proc-2',
    org_id: 'org-1',
    employee_id: 'emp-7',
    initiated_by: 'emp-17',
    status: 'in_progress' as const,
    checklist_id: 'ob-cl-1',
    last_working_date: '2026-03-15',
    reason: 'end_of_contract' as const,
    notes: 'Marie\'s fixed-term contract ending. Knowledge transfer to replacement hire in progress.',
    started_at: '2026-02-15T09:00:00Z',
    completed_at: null,
  },
  {
    id: 'ob-proc-3',
    org_id: 'org-1',
    employee_id: 'emp-30',
    initiated_by: 'emp-27',
    status: 'pending' as const,
    checklist_id: 'ob-cl-2',
    last_working_date: '2026-03-31',
    reason: 'layoff' as const,
    notes: 'Position eliminated as part of department restructuring.',
    started_at: '2026-02-25T09:00:00Z',
    completed_at: null,
  },
]

// === From agent-a0587c7f ===
// ─── Offboarding: Tasks ─────────────────────────────────────

export const demoOffboardingTasks = [
  // Process 1 (emp-12, completed resignation) — all tasks completed
  { id: 'ob-task-1', process_id: 'ob-proc-1', checklist_item_id: 'ob-cli-1', assignee_id: 'emp-13', status: 'completed' as const, completed_at: '2026-01-31T09:00:00Z', completed_by: 'emp-13', notes: null },
  { id: 'ob-task-2', process_id: 'ob-proc-1', checklist_item_id: 'ob-cli-2', assignee_id: 'emp-15', status: 'completed' as const, completed_at: '2026-01-31T09:30:00Z', completed_by: 'emp-15', notes: null },
  { id: 'ob-task-3', process_id: 'ob-proc-1', checklist_item_id: 'ob-cli-3', assignee_id: 'emp-13', status: 'completed' as const, completed_at: '2026-01-30T14:00:00Z', completed_by: 'emp-13', notes: 'Laptop returned in good condition' },
  { id: 'ob-task-4', process_id: 'ob-proc-1', checklist_item_id: 'ob-cli-4', assignee_id: 'emp-13', status: 'skipped' as const, completed_at: null, completed_by: null, notes: 'Employee did not have company phone' },
  { id: 'ob-task-5', process_id: 'ob-proc-1', checklist_item_id: 'ob-cli-5', assignee_id: 'emp-9', status: 'completed' as const, completed_at: '2026-01-25T16:00:00Z', completed_by: 'emp-9', notes: 'Comprehensive handover document created' },
  { id: 'ob-task-6', process_id: 'ob-proc-1', checklist_item_id: 'ob-cli-6', assignee_id: 'emp-9', status: 'completed' as const, completed_at: '2026-01-28T11:00:00Z', completed_by: 'emp-9', notes: null },
  { id: 'ob-task-7', process_id: 'ob-proc-1', checklist_item_id: 'ob-cli-7', assignee_id: 'emp-20', status: 'completed' as const, completed_at: '2026-01-29T10:00:00Z', completed_by: 'emp-20', notes: 'Exit interview conducted successfully' },
  { id: 'ob-task-8', process_id: 'ob-proc-1', checklist_item_id: 'ob-cli-8', assignee_id: 'emp-25', status: 'completed' as const, completed_at: '2026-01-31T15:00:00Z', completed_by: 'emp-25', notes: null },
  { id: 'ob-task-9', process_id: 'ob-proc-1', checklist_item_id: 'ob-cli-9', assignee_id: 'emp-20', status: 'completed' as const, completed_at: '2026-01-31T12:00:00Z', completed_by: 'emp-20', notes: null },
  { id: 'ob-task-10', process_id: 'ob-proc-1', checklist_item_id: 'ob-cli-10', assignee_id: 'emp-18', status: 'completed' as const, completed_at: '2026-01-30T10:00:00Z', completed_by: 'emp-18', notes: 'Reference letter sent to employee' },

  // Process 2 (emp-7, in-progress end of contract) — mixed statuses
  { id: 'ob-task-11', process_id: 'ob-proc-2', checklist_item_id: 'ob-cli-1', assignee_id: 'emp-13', status: 'pending' as const, completed_at: null, completed_by: null, notes: null },
  { id: 'ob-task-12', process_id: 'ob-proc-2', checklist_item_id: 'ob-cli-2', assignee_id: 'emp-15', status: 'pending' as const, completed_at: null, completed_by: null, notes: null },
  { id: 'ob-task-13', process_id: 'ob-proc-2', checklist_item_id: 'ob-cli-3', assignee_id: 'emp-13', status: 'pending' as const, completed_at: null, completed_by: null, notes: null },
  { id: 'ob-task-14', process_id: 'ob-proc-2', checklist_item_id: 'ob-cli-4', assignee_id: 'emp-13', status: 'pending' as const, completed_at: null, completed_by: null, notes: null },
  { id: 'ob-task-15', process_id: 'ob-proc-2', checklist_item_id: 'ob-cli-5', assignee_id: 'emp-5', status: 'in_progress' as const, completed_at: null, completed_by: null, notes: 'Documentation started, handover meeting scheduled for next week' },
  { id: 'ob-task-16', process_id: 'ob-proc-2', checklist_item_id: 'ob-cli-6', assignee_id: 'emp-5', status: 'in_progress' as const, completed_at: null, completed_by: null, notes: null },
  { id: 'ob-task-17', process_id: 'ob-proc-2', checklist_item_id: 'ob-cli-7', assignee_id: 'emp-20', status: 'completed' as const, completed_at: '2026-02-20T14:00:00Z', completed_by: 'emp-20', notes: 'Exit interview completed. Employee gave positive feedback.' },
  { id: 'ob-task-18', process_id: 'ob-proc-2', checklist_item_id: 'ob-cli-8', assignee_id: 'emp-25', status: 'completed' as const, completed_at: '2026-02-22T11:00:00Z', completed_by: 'emp-25', notes: 'Final pay calculated including remaining leave balance' },
  { id: 'ob-task-19', process_id: 'ob-proc-2', checklist_item_id: 'ob-cli-9', assignee_id: 'emp-20', status: 'pending' as const, completed_at: null, completed_by: null, notes: null },
  { id: 'ob-task-20', process_id: 'ob-proc-2', checklist_item_id: 'ob-cli-10', assignee_id: 'emp-18', status: 'completed' as const, completed_at: '2026-02-18T09:00:00Z', completed_by: 'emp-18', notes: null },

  // Process 3 (emp-30, pending layoff) — all pending
  { id: 'ob-task-21', process_id: 'ob-proc-3', checklist_item_id: 'ob-cli-11', assignee_id: 'emp-13', status: 'pending' as const, completed_at: null, completed_by: null, notes: null },
  { id: 'ob-task-22', process_id: 'ob-proc-3', checklist_item_id: 'ob-cli-12', assignee_id: 'emp-13', status: 'pending' as const, completed_at: null, completed_by: null, notes: null },
  { id: 'ob-task-23', process_id: 'ob-proc-3', checklist_item_id: 'ob-cli-13', assignee_id: 'emp-15', status: 'pending' as const, completed_at: null, completed_by: null, notes: null },
  { id: 'ob-task-24', process_id: 'ob-proc-3', checklist_item_id: 'ob-cli-14', assignee_id: 'emp-13', status: 'pending' as const, completed_at: null, completed_by: null, notes: null },
  { id: 'ob-task-25', process_id: 'ob-proc-3', checklist_item_id: 'ob-cli-15', assignee_id: 'emp-27', status: 'pending' as const, completed_at: null, completed_by: null, notes: null },
  { id: 'ob-task-26', process_id: 'ob-proc-3', checklist_item_id: 'ob-cli-16', assignee_id: 'emp-27', status: 'pending' as const, completed_at: null, completed_by: null, notes: null },
  { id: 'ob-task-27', process_id: 'ob-proc-3', checklist_item_id: 'ob-cli-17', assignee_id: 'emp-20', status: 'pending' as const, completed_at: null, completed_by: null, notes: null },
  { id: 'ob-task-28', process_id: 'ob-proc-3', checklist_item_id: 'ob-cli-18', assignee_id: 'emp-25', status: 'pending' as const, completed_at: null, completed_by: null, notes: null },
  { id: 'ob-task-29', process_id: 'ob-proc-3', checklist_item_id: 'ob-cli-19', assignee_id: 'emp-25', status: 'pending' as const, completed_at: null, completed_by: null, notes: null },
  { id: 'ob-task-30', process_id: 'ob-proc-3', checklist_item_id: 'ob-cli-20', assignee_id: 'emp-20', status: 'pending' as const, completed_at: null, completed_by: null, notes: null },
  { id: 'ob-task-31', process_id: 'ob-proc-3', checklist_item_id: 'ob-cli-21', assignee_id: 'emp-22', status: 'pending' as const, completed_at: null, completed_by: null, notes: null },
  { id: 'ob-task-32', process_id: 'ob-proc-3', checklist_item_id: 'ob-cli-22', assignee_id: 'emp-20', status: 'pending' as const, completed_at: null, completed_by: null, notes: null },
]

// === From agent-a29facba ===
// ACA Compliance Tracking
export const demoAcaTracking = [
  { id: 'aca-1', org_id: 'org-1', employee_id: 'emp-1', measurement_period: 'Jan 2025 - Dec 2025', avg_weekly_hours: 42, is_fte: true, is_eligible: true, offered_coverage: true, enrolled_coverage: true, form_1095_status: 'filed' as const, tax_year: 2025, created_at: '2026-01-15T00:00:00Z' },
  { id: 'aca-2', org_id: 'org-1', employee_id: 'emp-2', measurement_period: 'Jan 2025 - Dec 2025', avg_weekly_hours: 40, is_fte: true, is_eligible: true, offered_coverage: true, enrolled_coverage: true, form_1095_status: 'filed' as const, tax_year: 2025, created_at: '2026-01-15T00:00:00Z' },
  { id: 'aca-3', org_id: 'org-1', employee_id: 'emp-5', measurement_period: 'Jan 2025 - Dec 2025', avg_weekly_hours: 44, is_fte: true, is_eligible: true, offered_coverage: true, enrolled_coverage: true, form_1095_status: 'generated' as const, tax_year: 2025, created_at: '2026-01-15T00:00:00Z' },
  { id: 'aca-4', org_id: 'org-1', employee_id: 'emp-10', measurement_period: 'Jan 2025 - Dec 2025', avg_weekly_hours: 38, is_fte: true, is_eligible: true, offered_coverage: true, enrolled_coverage: true, form_1095_status: 'pending' as const, tax_year: 2025, created_at: '2026-01-15T00:00:00Z' },
  { id: 'aca-5', org_id: 'org-1', employee_id: 'emp-13', measurement_period: 'Jan 2025 - Dec 2025', avg_weekly_hours: 45, is_fte: true, is_eligible: true, offered_coverage: true, enrolled_coverage: true, form_1095_status: 'filed' as const, tax_year: 2025, created_at: '2026-01-15T00:00:00Z' },
  { id: 'aca-6', org_id: 'org-1', employee_id: 'emp-14', measurement_period: 'Jan 2025 - Dec 2025', avg_weekly_hours: 40, is_fte: true, is_eligible: true, offered_coverage: true, enrolled_coverage: true, form_1095_status: 'generated' as const, tax_year: 2025, created_at: '2026-01-15T00:00:00Z' },
  { id: 'aca-7', org_id: 'org-1', employee_id: 'emp-18', measurement_period: 'Jan 2025 - Dec 2025', avg_weekly_hours: 42, is_fte: true, is_eligible: true, offered_coverage: true, enrolled_coverage: true, form_1095_status: 'pending' as const, tax_year: 2025, created_at: '2026-01-15T00:00:00Z' },
  { id: 'aca-8', org_id: 'org-1', employee_id: 'emp-24', measurement_period: 'Jan 2025 - Dec 2025', avg_weekly_hours: 43, is_fte: true, is_eligible: true, offered_coverage: true, enrolled_coverage: false, form_1095_status: 'pending' as const, tax_year: 2025, created_at: '2026-01-15T00:00:00Z' },
  { id: 'aca-9', org_id: 'org-1', employee_id: 'emp-29', measurement_period: 'Jan 2025 - Dec 2025', avg_weekly_hours: 25, is_fte: false, is_eligible: false, offered_coverage: false, enrolled_coverage: false, form_1095_status: 'pending' as const, tax_year: 2025, created_at: '2026-01-15T00:00:00Z' },
  { id: 'aca-10', org_id: 'org-1', employee_id: 'emp-30', measurement_period: 'Jan 2025 - Dec 2025', avg_weekly_hours: 20, is_fte: false, is_eligible: false, offered_coverage: false, enrolled_coverage: false, form_1095_status: 'pending' as const, tax_year: 2025, created_at: '2026-01-15T00:00:00Z' },
]

// === From agent-a29facba ===
// COBRA Events
export const demoCobraEvents = [
  { id: 'cobra-1', org_id: 'org-1', employee_id: 'emp-12', qualifying_event: 'termination' as const, event_date: '2026-01-15', election_deadline: '2026-03-16', status: 'notified' as const, coverage_plans: [{ plan_id: 'bp-1', name: 'Comprehensive Medical' }], premium_amount: 580, subsidy_percent: 0, coverage_start_date: '2026-02-01', coverage_end_date: '2027-07-15', created_at: '2026-01-16T00:00:00Z' },
  { id: 'cobra-2', org_id: 'org-1', employee_id: 'emp-7', qualifying_event: 'hours_reduction' as const, event_date: '2025-11-01', election_deadline: '2026-01-01', status: 'elected' as const, coverage_plans: [{ plan_id: 'bp-1', name: 'Comprehensive Medical' }, { plan_id: 'bp-2', name: 'Vision Care' }], premium_amount: 640, subsidy_percent: 0, coverage_start_date: '2025-12-01', coverage_end_date: '2027-05-01', created_at: '2025-11-02T00:00:00Z' },
  { id: 'cobra-3', org_id: 'org-1', employee_id: 'emp-4', qualifying_event: 'divorce' as const, event_date: '2025-09-15', election_deadline: '2025-11-15', status: 'declined' as const, coverage_plans: [{ plan_id: 'bp-1', name: 'Comprehensive Medical' }], premium_amount: 450, subsidy_percent: 0, coverage_start_date: null, coverage_end_date: null, created_at: '2025-09-16T00:00:00Z' },
]

// === From agent-a29facba ===
// Flex Benefit Accounts (HSA/FSA/Commuter)
export const demoFlexBenefitAccounts = [
  { id: 'fba-1', org_id: 'org-1', employee_id: 'emp-1', type: 'hsa' as const, plan_year: '2026', employee_contribution: 2400, employer_contribution: 1000, current_balance: 3180, ytd_expenses: 820, max_contribution: 4150, rollover_amount: 600, status: 'active' as const, created_at: '2026-01-01T00:00:00Z' },
  { id: 'fba-2', org_id: 'org-1', employee_id: 'emp-5', type: 'fsa_health' as const, plan_year: '2026', employee_contribution: 2850, employer_contribution: 0, current_balance: 2100, ytd_expenses: 750, max_contribution: 3200, rollover_amount: 0, status: 'active' as const, created_at: '2026-01-01T00:00:00Z' },
  { id: 'fba-3', org_id: 'org-1', employee_id: 'emp-13', type: 'hsa' as const, plan_year: '2026', employee_contribution: 3500, employer_contribution: 1500, current_balance: 4200, ytd_expenses: 1300, max_contribution: 8300, rollover_amount: 500, status: 'active' as const, created_at: '2026-01-01T00:00:00Z' },
  { id: 'fba-4', org_id: 'org-1', employee_id: 'emp-14', type: 'fsa_dependent' as const, plan_year: '2026', employee_contribution: 5000, employer_contribution: 0, current_balance: 3800, ytd_expenses: 1200, max_contribution: 5000, rollover_amount: 0, status: 'active' as const, created_at: '2026-01-01T00:00:00Z' },
  { id: 'fba-5', org_id: 'org-1', employee_id: 'emp-18', type: 'commuter_transit' as const, plan_year: '2026', employee_contribution: 300, employer_contribution: 0, current_balance: 215, ytd_expenses: 385, max_contribution: 3600, rollover_amount: 0, status: 'active' as const, created_at: '2026-01-01T00:00:00Z' },
  { id: 'fba-6', org_id: 'org-1', employee_id: 'emp-24', type: 'commuter_parking' as const, plan_year: '2026', employee_contribution: 200, employer_contribution: 0, current_balance: 150, ytd_expenses: 250, max_contribution: 3600, rollover_amount: 0, status: 'active' as const, created_at: '2026-01-01T00:00:00Z' },
]

// === From agent-a29facba ===
// Flex Benefit Transactions
export const demoFlexBenefitTransactions = [
  { id: 'fbt-1', account_id: 'fba-1', type: 'contribution' as const, amount: 200, description: 'Monthly payroll contribution', date: '2026-01-15', receipt_url: null, status: 'approved' as const, category: 'contribution', created_at: '2026-01-15T00:00:00Z' },
  { id: 'fbt-2', account_id: 'fba-1', type: 'contribution' as const, amount: 200, description: 'Monthly payroll contribution', date: '2026-02-15', receipt_url: null, status: 'approved' as const, category: 'contribution', created_at: '2026-02-15T00:00:00Z' },
  { id: 'fbt-3', account_id: 'fba-1', type: 'expense' as const, amount: 320, description: 'Annual eye exam and prescription glasses', date: '2026-01-28', receipt_url: '/receipts/fbt-3.pdf', status: 'approved' as const, category: 'Vision', created_at: '2026-01-28T00:00:00Z' },
  { id: 'fbt-4', account_id: 'fba-1', type: 'expense' as const, amount: 500, description: 'Dental cleaning and filling', date: '2026-02-10', receipt_url: '/receipts/fbt-4.pdf', status: 'approved' as const, category: 'Dental', created_at: '2026-02-10T00:00:00Z' },
  { id: 'fbt-5', account_id: 'fba-2', type: 'contribution' as const, amount: 237, description: 'Bi-weekly payroll deduction', date: '2026-01-15', receipt_url: null, status: 'approved' as const, category: 'contribution', created_at: '2026-01-15T00:00:00Z' },
  { id: 'fbt-6', account_id: 'fba-2', type: 'expense' as const, amount: 150, description: 'Prescription medication', date: '2026-01-22', receipt_url: '/receipts/fbt-6.pdf', status: 'approved' as const, category: 'Pharmacy', created_at: '2026-01-22T00:00:00Z' },
  { id: 'fbt-7', account_id: 'fba-2', type: 'expense' as const, amount: 600, description: 'Physical therapy sessions (4x)', date: '2026-02-05', receipt_url: '/receipts/fbt-7.pdf', status: 'pending' as const, category: 'Medical', created_at: '2026-02-05T00:00:00Z' },
  { id: 'fbt-8', account_id: 'fba-3', type: 'contribution' as const, amount: 291, description: 'Bi-weekly payroll deduction', date: '2026-02-01', receipt_url: null, status: 'approved' as const, category: 'contribution', created_at: '2026-02-01T00:00:00Z' },
  { id: 'fbt-9', account_id: 'fba-3', type: 'expense' as const, amount: 800, description: 'Family urgent care visit', date: '2026-02-12', receipt_url: '/receipts/fbt-9.pdf', status: 'approved' as const, category: 'Medical', created_at: '2026-02-12T00:00:00Z' },
  { id: 'fbt-10', account_id: 'fba-3', type: 'expense' as const, amount: 500, description: 'Child dental checkup and sealants', date: '2026-02-20', receipt_url: '/receipts/fbt-10.pdf', status: 'pending' as const, category: 'Dental', created_at: '2026-02-20T00:00:00Z' },
  { id: 'fbt-11', account_id: 'fba-4', type: 'contribution' as const, amount: 416, description: 'Monthly payroll deduction', date: '2026-01-31', receipt_url: null, status: 'approved' as const, category: 'contribution', created_at: '2026-01-31T00:00:00Z' },
  { id: 'fbt-12', account_id: 'fba-4', type: 'expense' as const, amount: 1200, description: 'Daycare February tuition', date: '2026-02-01', receipt_url: '/receipts/fbt-12.pdf', status: 'approved' as const, category: 'Dependent Care', created_at: '2026-02-01T00:00:00Z' },
  { id: 'fbt-13', account_id: 'fba-5', type: 'contribution' as const, amount: 150, description: 'Monthly transit benefit', date: '2026-01-01', receipt_url: null, status: 'approved' as const, category: 'contribution', created_at: '2026-01-01T00:00:00Z' },
  { id: 'fbt-14', account_id: 'fba-5', type: 'expense' as const, amount: 185, description: 'Monthly transit pass', date: '2026-01-05', receipt_url: '/receipts/fbt-14.pdf', status: 'approved' as const, category: 'Transit', created_at: '2026-01-05T00:00:00Z' },
  { id: 'fbt-15', account_id: 'fba-6', type: 'expense' as const, amount: 250, description: 'Parking garage monthly pass', date: '2026-02-01', receipt_url: '/receipts/fbt-15.pdf', status: 'approved' as const, category: 'Parking', created_at: '2026-02-01T00:00:00Z' },
]

// === From agent-a29facba ===
// Open Enrollment Periods
export const demoOpenEnrollmentPeriods = [
  { id: 'oep-1', org_id: 'org-1', name: '2026 Annual Open Enrollment', start_date: '2026-02-15', end_date: '2026-03-15', effective_date: '2026-04-01', status: 'active' as const, plan_ids: ['bp-1', 'bp-2', 'bp-3', 'bp-4', 'bp-5', 'bp-6'], reminders_sent: 2, created_at: '2026-01-15T00:00:00Z' },
  { id: 'oep-2', org_id: 'org-1', name: '2025 Annual Open Enrollment', start_date: '2025-02-01', end_date: '2025-03-01', effective_date: '2025-04-01', status: 'closed' as const, plan_ids: ['bp-1', 'bp-2', 'bp-3', 'bp-4'], reminders_sent: 3, created_at: '2025-01-10T00:00:00Z' },
]

// === From agent-a2fa17c9 ===
// Legacy Shifts (old format kept for backward compatibility)
export const demoLegacyShifts = [
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

// === From agent-a2fa17c9 ===
// Overtime Rules
export const demoOvertimeRules = [
  { id: 'otr-1', org_id: 'org-1', name: 'Nigeria Standard Overtime', country: 'Nigeria', daily_threshold_hours: 8, weekly_threshold_hours: 40, multiplier: 1.5, double_overtime_threshold: 12, double_overtime_multiplier: 2.0, is_active: true, created_at: '2025-01-01T00:00:00Z' },
  { id: 'otr-2', org_id: 'org-1', name: 'Kenya Labour Overtime', country: 'Kenya', daily_threshold_hours: 8, weekly_threshold_hours: 45, multiplier: 1.5, double_overtime_threshold: null, double_overtime_multiplier: null, is_active: true, created_at: '2025-01-01T00:00:00Z' },
  { id: 'otr-3', org_id: 'org-1', name: 'South Africa BCEA Overtime', country: 'South Africa', daily_threshold_hours: 9, weekly_threshold_hours: 45, multiplier: 1.5, double_overtime_threshold: 10, double_overtime_multiplier: 2.0, is_active: true, created_at: '2025-01-01T00:00:00Z' },
]

// === From agent-a2fa17c9 ===
// Time Entries (clock in/out records for the current week)
export const demoTimeEntries = [
  // Monday 2026-02-23
  { id: 'te-1', org_id: 'org-1', employee_id: 'emp-1', date: '2026-02-23', clock_in: '2026-02-23T08:02:00Z', clock_out: '2026-02-23T17:05:00Z', break_minutes: 60, total_hours: 8.05, overtime_hours: 0, status: 'approved' as const, approved_by: 'emp-17', location: 'Lagos HQ - Floor 3', notes: null, created_at: '2026-02-23T08:02:00Z' },
  { id: 'te-2', org_id: 'org-1', employee_id: 'emp-2', date: '2026-02-23', clock_in: '2026-02-23T08:15:00Z', clock_out: '2026-02-23T17:30:00Z', break_minutes: 45, total_hours: 8.5, overtime_hours: 0.5, status: 'approved' as const, approved_by: 'emp-1', location: 'Lagos HQ - Floor 3', notes: null, created_at: '2026-02-23T08:15:00Z' },
  { id: 'te-3', org_id: 'org-1', employee_id: 'emp-3', date: '2026-02-23', clock_in: '2026-02-23T07:55:00Z', clock_out: '2026-02-23T16:58:00Z', break_minutes: 60, total_hours: 8.05, overtime_hours: 0, status: 'approved' as const, approved_by: 'emp-1', location: 'Accra Branch', notes: null, created_at: '2026-02-23T07:55:00Z' },
  { id: 'te-4', org_id: 'org-1', employee_id: 'emp-5', date: '2026-02-23', clock_in: '2026-02-23T08:30:00Z', clock_out: '2026-02-23T18:45:00Z', break_minutes: 60, total_hours: 9.25, overtime_hours: 1.25, status: 'approved' as const, approved_by: 'emp-17', location: 'Abidjan Office', notes: 'Stayed late for client meeting', created_at: '2026-02-23T08:30:00Z' },
  { id: 'te-5', org_id: 'org-1', employee_id: 'emp-9', date: '2026-02-23', clock_in: '2026-02-23T07:45:00Z', clock_out: '2026-02-23T16:50:00Z', break_minutes: 60, total_hours: 8.08, overtime_hours: 0, status: 'approved' as const, approved_by: 'emp-17', location: 'Accra Branch', notes: null, created_at: '2026-02-23T07:45:00Z' },
  { id: 'te-6', org_id: 'org-1', employee_id: 'emp-13', date: '2026-02-23', clock_in: '2026-02-23T09:00:00Z', clock_out: '2026-02-23T19:30:00Z', break_minutes: 45, total_hours: 9.75, overtime_hours: 1.75, status: 'approved' as const, approved_by: 'emp-17', location: 'Lagos HQ - Floor 5', notes: 'System deployment', created_at: '2026-02-23T09:00:00Z' },
  // Tuesday 2026-02-24
  { id: 'te-7', org_id: 'org-1', employee_id: 'emp-1', date: '2026-02-24', clock_in: '2026-02-24T08:10:00Z', clock_out: '2026-02-24T17:15:00Z', break_minutes: 60, total_hours: 8.08, overtime_hours: 0, status: 'approved' as const, approved_by: 'emp-17', location: 'Lagos HQ - Floor 3', notes: null, created_at: '2026-02-24T08:10:00Z' },
  { id: 'te-8', org_id: 'org-1', employee_id: 'emp-2', date: '2026-02-24', clock_in: '2026-02-24T08:00:00Z', clock_out: '2026-02-24T17:00:00Z', break_minutes: 60, total_hours: 8.0, overtime_hours: 0, status: 'approved' as const, approved_by: 'emp-1', location: 'Lagos HQ - Floor 3', notes: null, created_at: '2026-02-24T08:00:00Z' },
  { id: 'te-9', org_id: 'org-1', employee_id: 'emp-5', date: '2026-02-24', clock_in: '2026-02-24T08:20:00Z', clock_out: '2026-02-24T17:25:00Z', break_minutes: 60, total_hours: 8.08, overtime_hours: 0, status: 'approved' as const, approved_by: 'emp-17', location: 'Abidjan Office', notes: null, created_at: '2026-02-24T08:20:00Z' },
  { id: 'te-10', org_id: 'org-1', employee_id: 'emp-13', date: '2026-02-24', clock_in: '2026-02-24T08:45:00Z', clock_out: '2026-02-24T20:00:00Z', break_minutes: 60, total_hours: 10.25, overtime_hours: 2.25, status: 'pending' as const, approved_by: null, location: 'Lagos HQ - Floor 5', notes: 'Post-deployment monitoring', created_at: '2026-02-24T08:45:00Z' },
  { id: 'te-11', org_id: 'org-1', employee_id: 'emp-14', date: '2026-02-24', clock_in: '2026-02-24T09:05:00Z', clock_out: '2026-02-24T17:10:00Z', break_minutes: 60, total_hours: 7.08, overtime_hours: 0, status: 'approved' as const, approved_by: 'emp-13', location: 'Accra Branch', notes: null, created_at: '2026-02-24T09:05:00Z' },
  { id: 'te-12', org_id: 'org-1', employee_id: 'emp-17', date: '2026-02-24', clock_in: '2026-02-24T08:00:00Z', clock_out: '2026-02-24T17:30:00Z', break_minutes: 30, total_hours: 9.0, overtime_hours: 1.0, status: 'approved' as const, approved_by: null, location: 'Abidjan Office', notes: 'HR policy review', created_at: '2026-02-24T08:00:00Z' },
  // Wednesday 2026-02-25
  { id: 'te-13', org_id: 'org-1', employee_id: 'emp-1', date: '2026-02-25', clock_in: '2026-02-25T07:50:00Z', clock_out: '2026-02-25T17:00:00Z', break_minutes: 60, total_hours: 8.17, overtime_hours: 0, status: 'approved' as const, approved_by: 'emp-17', location: 'Lagos HQ - Floor 3', notes: null, created_at: '2026-02-25T07:50:00Z' },
  { id: 'te-14', org_id: 'org-1', employee_id: 'emp-6', date: '2026-02-25', clock_in: '2026-02-25T08:30:00Z', clock_out: '2026-02-25T17:35:00Z', break_minutes: 60, total_hours: 8.08, overtime_hours: 0, status: 'pending' as const, approved_by: null, location: 'Dakar Branch', notes: null, created_at: '2026-02-25T08:30:00Z' },
  { id: 'te-15', org_id: 'org-1', employee_id: 'emp-10', date: '2026-02-25', clock_in: '2026-02-25T08:00:00Z', clock_out: '2026-02-25T16:30:00Z', break_minutes: 30, total_hours: 8.0, overtime_hours: 0, status: 'approved' as const, approved_by: 'emp-9', location: 'Lagos HQ - Floor 2', notes: null, created_at: '2026-02-25T08:00:00Z' },
  { id: 'te-16', org_id: 'org-1', employee_id: 'emp-21', date: '2026-02-25', clock_in: '2026-02-25T08:15:00Z', clock_out: '2026-02-25T18:20:00Z', break_minutes: 60, total_hours: 9.08, overtime_hours: 1.08, status: 'pending' as const, approved_by: null, location: 'Lagos HQ - Floor 4', notes: 'Compliance audit prep', created_at: '2026-02-25T08:15:00Z' },
  // Thursday 2026-02-26
  { id: 'te-17', org_id: 'org-1', employee_id: 'emp-1', date: '2026-02-26', clock_in: '2026-02-26T08:05:00Z', clock_out: '2026-02-26T17:10:00Z', break_minutes: 60, total_hours: 8.08, overtime_hours: 0, status: 'approved' as const, approved_by: 'emp-17', location: 'Lagos HQ - Floor 3', notes: null, created_at: '2026-02-26T08:05:00Z' },
  { id: 'te-18', org_id: 'org-1', employee_id: 'emp-2', date: '2026-02-26', clock_in: '2026-02-26T07:45:00Z', clock_out: '2026-02-26T16:50:00Z', break_minutes: 60, total_hours: 8.08, overtime_hours: 0, status: 'pending' as const, approved_by: null, location: 'Lagos HQ - Floor 3', notes: null, created_at: '2026-02-26T07:45:00Z' },
  { id: 'te-19', org_id: 'org-1', employee_id: 'emp-5', date: '2026-02-26', clock_in: '2026-02-26T08:00:00Z', clock_out: '2026-02-26T19:00:00Z', break_minutes: 60, total_hours: 10.0, overtime_hours: 2.0, status: 'pending' as const, approved_by: null, location: 'Abidjan Office', notes: 'Quarter-end corporate review', created_at: '2026-02-26T08:00:00Z' },
  { id: 'te-20', org_id: 'org-1', employee_id: 'emp-9', date: '2026-02-26', clock_in: '2026-02-26T07:30:00Z', clock_out: '2026-02-26T16:35:00Z', break_minutes: 60, total_hours: 8.08, overtime_hours: 0, status: 'approved' as const, approved_by: 'emp-17', location: 'Accra Branch', notes: null, created_at: '2026-02-26T07:30:00Z' },
  { id: 'te-21', org_id: 'org-1', employee_id: 'emp-24', date: '2026-02-26', clock_in: '2026-02-26T08:10:00Z', clock_out: '2026-02-26T18:15:00Z', break_minutes: 45, total_hours: 9.33, overtime_hours: 1.33, status: 'pending' as const, approved_by: null, location: 'Lagos HQ - Floor 4', notes: 'Financial closing', created_at: '2026-02-26T08:10:00Z' },
  // Friday 2026-02-27
  { id: 'te-22', org_id: 'org-1', employee_id: 'emp-1', date: '2026-02-27', clock_in: '2026-02-27T08:00:00Z', clock_out: '2026-02-27T16:30:00Z', break_minutes: 60, total_hours: 7.5, overtime_hours: 0, status: 'pending' as const, approved_by: null, location: 'Lagos HQ - Floor 3', notes: 'Early finish Friday', created_at: '2026-02-27T08:00:00Z' },
  { id: 'te-23', org_id: 'org-1', employee_id: 'emp-13', date: '2026-02-27', clock_in: '2026-02-27T09:00:00Z', clock_out: '2026-02-27T17:05:00Z', break_minutes: 60, total_hours: 7.08, overtime_hours: 0, status: 'pending' as const, approved_by: null, location: 'Lagos HQ - Floor 5', notes: null, created_at: '2026-02-27T09:00:00Z' },
  { id: 'te-24', org_id: 'org-1', employee_id: 'emp-17', date: '2026-02-27', clock_in: '2026-02-27T08:15:00Z', clock_out: '2026-02-27T17:20:00Z', break_minutes: 45, total_hours: 8.33, overtime_hours: 0, status: 'pending' as const, approved_by: null, location: 'Abidjan Office', notes: null, created_at: '2026-02-27T08:15:00Z' },
  { id: 'te-25', org_id: 'org-1', employee_id: 'emp-27', date: '2026-02-27', clock_in: '2026-02-27T08:30:00Z', clock_out: '2026-02-27T17:45:00Z', break_minutes: 60, total_hours: 8.25, overtime_hours: 0.25, status: 'pending' as const, approved_by: null, location: 'Lagos HQ - Floor 2', notes: 'Campaign launch support', created_at: '2026-02-27T08:30:00Z' },
  // Saturday 2026-02-28 (weekend OT)
  { id: 'te-26', org_id: 'org-1', employee_id: 'emp-13', date: '2026-02-28', clock_in: '2026-02-28T10:00:00Z', clock_out: '2026-02-28T15:00:00Z', break_minutes: 30, total_hours: 4.5, overtime_hours: 4.5, status: 'pending' as const, approved_by: null, location: 'Remote', notes: 'Emergency patch deployment', created_at: '2026-02-28T10:00:00Z' },
  { id: 'te-27', org_id: 'org-1', employee_id: 'emp-21', date: '2026-02-27', clock_in: '2026-02-27T08:00:00Z', clock_out: '2026-02-27T17:00:00Z', break_minutes: 60, total_hours: 8.0, overtime_hours: 0, status: 'pending' as const, approved_by: null, location: 'Lagos HQ - Floor 4', notes: null, created_at: '2026-02-27T08:00:00Z' },
  { id: 'te-28', org_id: 'org-1', employee_id: 'emp-6', date: '2026-02-26', clock_in: '2026-02-26T08:20:00Z', clock_out: '2026-02-26T17:25:00Z', break_minutes: 60, total_hours: 8.08, overtime_hours: 0, status: 'approved' as const, approved_by: 'emp-5', location: 'Dakar Branch', notes: null, created_at: '2026-02-26T08:20:00Z' },
  { id: 'te-29', org_id: 'org-1', employee_id: 'emp-14', date: '2026-02-25', clock_in: '2026-02-25T08:50:00Z', clock_out: '2026-02-25T17:55:00Z', break_minutes: 60, total_hours: 8.08, overtime_hours: 0, status: 'approved' as const, approved_by: 'emp-13', location: 'Accra Branch', notes: null, created_at: '2026-02-25T08:50:00Z' },
  { id: 'te-30', org_id: 'org-1', employee_id: 'emp-28', date: '2026-02-24', clock_in: '2026-02-24T08:30:00Z', clock_out: '2026-02-24T18:30:00Z', break_minutes: 60, total_hours: 9.0, overtime_hours: 1.0, status: 'approved' as const, approved_by: 'emp-27', location: 'Nairobi Branch', notes: 'Product launch event', created_at: '2026-02-24T08:30:00Z' },
  { id: 'te-31', org_id: 'org-1', employee_id: 'emp-22', date: '2026-02-25', clock_in: '2026-02-25T07:50:00Z', clock_out: '2026-02-25T17:50:00Z', break_minutes: 60, total_hours: 9.0, overtime_hours: 1.0, status: 'approved' as const, approved_by: 'emp-21', location: 'Lagos HQ - Floor 4', notes: null, created_at: '2026-02-25T07:50:00Z' },
  { id: 'te-32', org_id: 'org-1', employee_id: 'emp-18', date: '2026-02-26', clock_in: '2026-02-26T08:00:00Z', clock_out: '2026-02-26T17:00:00Z', break_minutes: 60, total_hours: 8.0, overtime_hours: 0, status: 'approved' as const, approved_by: 'emp-17', location: 'Lagos HQ - Floor 2', notes: null, created_at: '2026-02-26T08:00:00Z' },
]

// === From agent-a2fa17c9 ===
// Time Off Balances
export const demoTimeOffBalances = [
  { id: 'tob-1', org_id: 'org-1', employee_id: 'emp-1', policy_id: 'top-1', balance: 15.0, used: 3, pending: 0, carryover: 2, as_of_date: '2026-02-28' },
  { id: 'tob-2', org_id: 'org-1', employee_id: 'emp-1', policy_id: 'top-2', balance: 10.0, used: 2, pending: 0, carryover: 0, as_of_date: '2026-02-28' },
  { id: 'tob-3', org_id: 'org-1', employee_id: 'emp-1', policy_id: 'top-3', balance: 4.0, used: 1, pending: 0, carryover: 1, as_of_date: '2026-02-28' },
  { id: 'tob-4', org_id: 'org-1', employee_id: 'emp-2', policy_id: 'top-1', balance: 12.0, used: 5, pending: 0, carryover: 3, as_of_date: '2026-02-28' },
  { id: 'tob-5', org_id: 'org-1', employee_id: 'emp-2', policy_id: 'top-2', balance: 8.0, used: 4, pending: 0, carryover: 0, as_of_date: '2026-02-28' },
  { id: 'tob-6', org_id: 'org-1', employee_id: 'emp-3', policy_id: 'top-1', balance: 10.0, used: 5, pending: 5, carryover: 0, as_of_date: '2026-02-28' },
  { id: 'tob-7', org_id: 'org-1', employee_id: 'emp-3', policy_id: 'top-2', balance: 11.0, used: 1, pending: 0, carryover: 0, as_of_date: '2026-02-28' },
  { id: 'tob-8', org_id: 'org-1', employee_id: 'emp-5', policy_id: 'top-1', balance: 18.0, used: 2, pending: 0, carryover: 5, as_of_date: '2026-02-28' },
  { id: 'tob-9', org_id: 'org-1', employee_id: 'emp-5', policy_id: 'top-2', balance: 12.0, used: 0, pending: 0, carryover: 0, as_of_date: '2026-02-28' },
  { id: 'tob-10', org_id: 'org-1', employee_id: 'emp-9', policy_id: 'top-1', balance: 14.0, used: 4, pending: 0, carryover: 2, as_of_date: '2026-02-28' },
  { id: 'tob-11', org_id: 'org-1', employee_id: 'emp-9', policy_id: 'top-2', balance: 9.0, used: 3, pending: 0, carryover: 0, as_of_date: '2026-02-28' },
  { id: 'tob-12', org_id: 'org-1', employee_id: 'emp-13', policy_id: 'top-1', balance: 16.0, used: 2, pending: 0, carryover: 4, as_of_date: '2026-02-28' },
  { id: 'tob-13', org_id: 'org-1', employee_id: 'emp-13', policy_id: 'top-2', balance: 10.0, used: 2, pending: 0, carryover: 0, as_of_date: '2026-02-28' },
  { id: 'tob-14', org_id: 'org-1', employee_id: 'emp-17', policy_id: 'top-1', balance: 17.0, used: 1, pending: 0, carryover: 3, as_of_date: '2026-02-28' },
  { id: 'tob-15', org_id: 'org-1', employee_id: 'emp-17', policy_id: 'top-2', balance: 11.0, used: 1, pending: 0, carryover: 0, as_of_date: '2026-02-28' },
  { id: 'tob-16', org_id: 'org-1', employee_id: 'emp-21', policy_id: 'top-1', balance: 13.0, used: 5, pending: 8, carryover: 1, as_of_date: '2026-02-28' },
  { id: 'tob-17', org_id: 'org-1', employee_id: 'emp-24', policy_id: 'top-1', balance: 11.0, used: 7, pending: 0, carryover: 2, as_of_date: '2026-02-28' },
  { id: 'tob-18', org_id: 'org-1', employee_id: 'emp-27', policy_id: 'top-1', balance: 16.0, used: 2, pending: 0, carryover: 4, as_of_date: '2026-02-28' },
  { id: 'tob-19', org_id: 'org-1', employee_id: 'emp-7', policy_id: 'top-4', balance: 90.0, used: 0, pending: 66, carryover: 0, as_of_date: '2026-02-28' },
  { id: 'tob-20', org_id: 'org-1', employee_id: 'emp-10', policy_id: 'top-2', balance: 7.0, used: 5, pending: 0, carryover: 0, as_of_date: '2026-02-28' },
]

// === From agent-a2fa17c9 ===
// Time Off Policies
export const demoTimeOffPolicies = [
  { id: 'top-1', org_id: 'org-1', name: 'Annual Leave', type: 'annual' as const, accrual_rate: 1.67, accrual_period: 'monthly' as const, max_balance: 20, carryover_limit: 5, waiting_period_days: 90, is_active: true, created_at: '2025-01-01T00:00:00Z' },
  { id: 'top-2', org_id: 'org-1', name: 'Sick Leave', type: 'sick' as const, accrual_rate: 1.0, accrual_period: 'monthly' as const, max_balance: 12, carryover_limit: 0, waiting_period_days: 0, is_active: true, created_at: '2025-01-01T00:00:00Z' },
  { id: 'top-3', org_id: 'org-1', name: 'Personal Days', type: 'personal' as const, accrual_rate: 0.5, accrual_period: 'monthly' as const, max_balance: 6, carryover_limit: 2, waiting_period_days: 30, is_active: true, created_at: '2025-01-01T00:00:00Z' },
  { id: 'top-4', org_id: 'org-1', name: 'Maternity Leave', type: 'maternity' as const, accrual_rate: 0, accrual_period: 'annually' as const, max_balance: 90, carryover_limit: 0, waiting_period_days: 365, is_active: true, created_at: '2025-01-01T00:00:00Z' },
  { id: 'top-5', org_id: 'org-1', name: 'Paternity Leave', type: 'paternity' as const, accrual_rate: 0, accrual_period: 'annually' as const, max_balance: 14, carryover_limit: 0, waiting_period_days: 365, is_active: true, created_at: '2025-01-01T00:00:00Z' },
]

// === From agent-a32687a5 ===
// ─── Compliance Alerts ─────────────────────────────────────

export const demoComplianceAlerts = [
  { id: 'calert-1', org_id: 'org-1', requirement_id: 'creq-9', type: 'violation' as const, severity: 'critical' as const, message: 'IT Security Penetration Testing is overdue. Last test was Dec 2025. Immediate action required.', is_read: false, due_date: '2026-03-31', created_at: '2026-02-20T08:00:00Z' },
  { id: 'calert-2', org_id: 'org-1', requirement_id: 'creq-2', type: 'upcoming_deadline' as const, severity: 'high' as const, message: 'Data Protection Impact Assessment due in 60 days. Assessment has not yet started.', is_read: false, due_date: '2026-04-30', created_at: '2026-02-28T09:00:00Z' },
  { id: 'calert-3', org_id: 'org-1', requirement_id: 'creq-5', type: 'upcoming_deadline' as const, severity: 'high' as const, message: 'UEMOA Banking Regulations Audit due in 90 days. Preparation should begin immediately.', is_read: true, due_date: '2026-05-31', created_at: '2026-02-25T10:00:00Z' },
  { id: 'calert-4', org_id: 'org-1', requirement_id: 'creq-7', type: 'reminder' as const, severity: 'medium' as const, message: 'Monthly KYC compliance report due in 15 days.', is_read: false, due_date: '2026-03-15', created_at: '2026-03-01T07:00:00Z' },
  { id: 'calert-5', org_id: 'org-1', requirement_id: null, type: 'expiring_document' as const, severity: 'high' as const, message: 'CBN Banking License Certificate expires on March 15, 2026. Renewal required.', is_read: false, due_date: '2026-03-15', created_at: '2026-02-15T11:00:00Z' },
  { id: 'calert-6', org_id: 'org-1', requirement_id: 'creq-3', type: 'reminder' as const, severity: 'low' as const, message: 'Quarterly workplace safety inspection due next month. Schedule with facilities team.', is_read: true, due_date: '2026-03-31', created_at: '2026-02-28T14:00:00Z' },
  { id: 'calert-7', org_id: 'org-1', requirement_id: 'creq-6', type: 'upcoming_deadline' as const, severity: 'medium' as const, message: 'Work permit for James Kamau (emp-8) expires in 6 months. Begin renewal process.', is_read: false, due_date: '2026-08-15', created_at: '2026-02-15T15:00:00Z' },
  { id: 'calert-8', org_id: 'org-1', requirement_id: 'creq-1', type: 'reminder' as const, severity: 'low' as const, message: 'Annual AML Filing due in 4 months. Begin data collection for the annual report.', is_read: true, due_date: '2026-06-30', created_at: '2026-02-28T16:00:00Z' },
]

// === From agent-a32687a5 ===
// ─── Compliance Documents ─────────────────────────────────────

export const demoComplianceDocuments = [
  { id: 'cdoc-1', requirement_id: 'creq-1', org_id: 'org-1', name: 'AML Compliance Report 2025', file_url: '/documents/aml-report-2025.pdf', uploaded_by: 'emp-21', uploaded_at: '2026-01-15T10:00:00Z', expires_at: '2027-01-15', status: 'valid' as const },
  { id: 'cdoc-2', requirement_id: 'creq-3', org_id: 'org-1', name: 'Lagos Office Safety Inspection Certificate', file_url: '/documents/safety-cert-lagos-q1.pdf', uploaded_by: 'emp-9', uploaded_at: '2026-01-16T14:30:00Z', expires_at: '2026-04-15', status: 'valid' as const },
  { id: 'cdoc-3', requirement_id: 'creq-4', org_id: 'org-1', name: 'Ghana Employment Contract Template (Updated)', file_url: '/documents/gh-contract-template-v3.pdf', uploaded_by: 'emp-20', uploaded_at: '2026-01-22T09:00:00Z', expires_at: null, status: 'valid' as const },
  { id: 'cdoc-4', requirement_id: 'creq-7', org_id: 'org-1', name: 'KYC Monthly Report - February 2026', file_url: '/documents/kyc-report-feb-2026.pdf', uploaded_by: 'emp-21', uploaded_at: '2026-02-15T16:00:00Z', expires_at: '2026-03-15', status: 'valid' as const },
  { id: 'cdoc-5', requirement_id: 'creq-10', org_id: 'org-1', name: 'CBN Banking License Certificate', file_url: '/documents/cbn-license-2026.pdf', uploaded_by: 'emp-24', uploaded_at: '2025-10-01T08:00:00Z', expires_at: '2026-03-15', status: 'expired' as const },
]

// === From agent-a32687a5 ===
// ─── Compliance Requirements ─────────────────────────────────────

export const demoComplianceRequirements = [
  { id: 'creq-1', org_id: 'org-1', name: 'Annual Anti-Money Laundering (AML) Filing', category: 'financial' as const, country: 'Nigeria', description: 'Submit annual AML compliance report to CBN as required by the Money Laundering Prevention Act', frequency: 'annually' as const, due_date: '2026-06-30', status: 'compliant' as const, assigned_to: 'emp-21', evidence: 'Filed with CBN reference NGN-AML-2025-1847', last_checked: '2026-02-15', next_due: '2026-06-30', created_at: '2026-01-01T00:00:00Z' },
  { id: 'creq-2', org_id: 'org-1', name: 'Data Protection Impact Assessment', category: 'data_privacy' as const, country: 'Nigeria', description: 'Conduct DPIA as required by Nigeria Data Protection Regulation (NDPR)', frequency: 'annually' as const, due_date: '2026-04-30', status: 'at_risk' as const, assigned_to: 'emp-22', evidence: null, last_checked: '2026-02-10', next_due: '2026-04-30', created_at: '2026-01-01T00:00:00Z' },
  { id: 'creq-3', org_id: 'org-1', name: 'Workplace Safety Inspection', category: 'safety' as const, country: 'Nigeria', description: 'Quarterly workplace safety inspection across all Lagos offices', frequency: 'quarterly' as const, due_date: '2026-03-31', status: 'compliant' as const, assigned_to: 'emp-9', evidence: 'Inspection completed 2026-01-15, all clear', last_checked: '2026-01-15', next_due: '2026-03-31', created_at: '2026-01-01T00:00:00Z' },
  { id: 'creq-4', org_id: 'org-1', name: 'Ghana Labor Act Compliance', category: 'labor_law' as const, country: 'Ghana', description: 'Ensure employment contracts comply with Ghana Labor Act 2003 (Act 651)', frequency: 'annually' as const, due_date: '2026-12-31', status: 'compliant' as const, assigned_to: 'emp-20', evidence: 'All Ghana contracts reviewed and updated', last_checked: '2026-01-20', next_due: '2026-12-31', created_at: '2026-01-01T00:00:00Z' },
  { id: 'creq-5', org_id: 'org-1', name: 'UEMOA Banking Regulations Audit', category: 'financial' as const, country: "Cote d'Ivoire", description: 'Annual audit of compliance with UEMOA banking directives and BCEAO regulations', frequency: 'annually' as const, due_date: '2026-05-31', status: 'at_risk' as const, assigned_to: 'emp-22', evidence: null, last_checked: '2026-02-01', next_due: '2026-05-31', created_at: '2026-01-01T00:00:00Z' },
  { id: 'creq-6', org_id: 'org-1', name: 'Work Permit Renewals', category: 'immigration' as const, country: 'Kenya', description: 'Track and renew work permits for all non-citizen employees in Kenya', frequency: 'annually' as const, due_date: '2026-08-15', status: 'compliant' as const, assigned_to: 'emp-18', evidence: 'All 3 Kenya work permits current', last_checked: '2026-02-20', next_due: '2026-08-15', created_at: '2026-01-01T00:00:00Z' },
  { id: 'creq-7', org_id: 'org-1', name: 'CBN Know Your Customer (KYC) Compliance', category: 'financial' as const, country: 'Nigeria', description: 'Monthly KYC compliance reporting to Central Bank of Nigeria', frequency: 'monthly' as const, due_date: '2026-03-15', status: 'compliant' as const, assigned_to: 'emp-21', evidence: 'Feb 2026 KYC report submitted', last_checked: '2026-02-15', next_due: '2026-03-15', created_at: '2026-01-01T00:00:00Z' },
  { id: 'creq-8', org_id: 'org-1', name: 'Senegal Labor Code Compliance', category: 'labor_law' as const, country: 'Senegal', description: 'Ensure compliance with Senegal Labor Code (Code du Travail) for all Dakar employees', frequency: 'annually' as const, due_date: '2026-12-31', status: 'compliant' as const, assigned_to: 'emp-20', evidence: 'All Senegal contracts compliant as of Q1 review', last_checked: '2026-01-25', next_due: '2026-12-31', created_at: '2026-01-01T00:00:00Z' },
  { id: 'creq-9', org_id: 'org-1', name: 'IT Security Penetration Testing', category: 'safety' as const, country: null, description: 'Quarterly penetration testing of all customer-facing banking systems', frequency: 'quarterly' as const, due_date: '2026-03-31', status: 'non_compliant' as const, assigned_to: 'emp-13', evidence: null, last_checked: '2025-12-15', next_due: '2026-03-31', created_at: '2026-01-01T00:00:00Z' },
  { id: 'creq-10', org_id: 'org-1', name: 'Professional Banking License Renewals', category: 'licensing' as const, country: 'Nigeria', description: 'Renew all required professional banking licenses with CBN', frequency: 'annually' as const, due_date: '2026-09-30', status: 'compliant' as const, assigned_to: 'emp-24', evidence: 'License renewed through Sept 2027', last_checked: '2026-02-01', next_due: '2026-09-30', created_at: '2026-01-01T00:00:00Z' },
  { id: 'creq-11', org_id: 'org-1', name: 'GDPR Cross-border Data Transfer Assessment', category: 'data_privacy' as const, country: null, description: 'Assess data transfer mechanisms between African operations and EU partners', frequency: 'annually' as const, due_date: '2026-07-31', status: 'compliant' as const, assigned_to: 'emp-22', evidence: 'Standard contractual clauses in place', last_checked: '2026-01-10', next_due: '2026-07-31', created_at: '2026-01-01T00:00:00Z' },
  { id: 'creq-12', org_id: 'org-1', name: 'Ghana Data Protection Act Compliance', category: 'data_privacy' as const, country: 'Ghana', description: 'Annual compliance review under Ghana Data Protection Act 2012 (Act 843)', frequency: 'annually' as const, due_date: '2026-11-30', status: 'compliant' as const, assigned_to: 'emp-20', evidence: 'DPA registration current, annual review completed', last_checked: '2026-02-05', next_due: '2026-11-30', created_at: '2026-01-01T00:00:00Z' },
]

// === From agent-a32687a5 ===
// ============================================================
// MULTI-ORG HELPERS
// ============================================================

// ─── Custom Field Definitions ─────────────────────────────────────

export const demoCustomFieldDefinitions = [
  { id: 'cfd-1', org_id: 'org-1', name: 'Employee ID Number', field_type: 'text' as const, entity_type: 'employee' as const, description: 'Internal employee identification number', options: null, is_required: true, is_visible: true, group_name: 'Identification', order_index: 0, created_at: '2026-01-01T00:00:00Z' },
  { id: 'cfd-2', org_id: 'org-1', name: 'T-Shirt Size', field_type: 'select' as const, entity_type: 'employee' as const, description: 'For company merchandise', options: ['XS', 'S', 'M', 'L', 'XL', 'XXL'], is_required: false, is_visible: true, group_name: 'Personal Preferences', order_index: 0, created_at: '2026-01-01T00:00:00Z' },
  { id: 'cfd-3', org_id: 'org-1', name: 'Work Permit Number', field_type: 'text' as const, entity_type: 'employee' as const, description: 'Work authorization permit number', options: null, is_required: false, is_visible: true, group_name: 'Identification', order_index: 1, created_at: '2026-01-01T00:00:00Z' },
  { id: 'cfd-4', org_id: 'org-1', name: 'LinkedIn URL', field_type: 'url' as const, entity_type: 'employee' as const, description: 'LinkedIn profile link', options: null, is_required: false, is_visible: true, group_name: 'Social', order_index: 0, created_at: '2026-01-01T00:00:00Z' },
  { id: 'cfd-5', org_id: 'org-1', name: 'Emergency Blood Type', field_type: 'select' as const, entity_type: 'employee' as const, description: 'Blood type for emergency medical situations', options: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'], is_required: false, is_visible: true, group_name: 'Medical', order_index: 0, created_at: '2026-01-01T00:00:00Z' },
  { id: 'cfd-6', org_id: 'org-1', name: 'Preferred Name', field_type: 'text' as const, entity_type: 'employee' as const, description: 'Name the employee prefers to be called', options: null, is_required: false, is_visible: true, group_name: 'Personal Preferences', order_index: 1, created_at: '2026-01-01T00:00:00Z' },
  { id: 'cfd-7', org_id: 'org-1', name: 'Dietary Restrictions', field_type: 'multi_select' as const, entity_type: 'employee' as const, description: 'For catering at company events', options: ['None', 'Vegetarian', 'Vegan', 'Halal', 'Kosher', 'Gluten-free', 'Nut-free', 'Lactose-free'], is_required: false, is_visible: true, group_name: 'Personal Preferences', order_index: 2, created_at: '2026-01-01T00:00:00Z' },
  { id: 'cfd-8', org_id: 'org-1', name: 'Parking Spot', field_type: 'text' as const, entity_type: 'employee' as const, description: 'Assigned parking spot number', options: null, is_required: false, is_visible: true, group_name: 'Office', order_index: 0, created_at: '2026-01-01T00:00:00Z' },
]

// === From agent-a32687a5 ===
// ─── Custom Field Values ─────────────────────────────────────

export const demoCustomFieldValues = [
  // Employee ID Numbers (emp-1 through emp-10)
  { id: 'cfv-1', field_definition_id: 'cfd-1', entity_id: 'emp-1', org_id: 'org-1', value: 'ECB-2019-001', created_at: '2026-01-05T00:00:00Z', updated_at: '2026-01-05T00:00:00Z' },
  { id: 'cfv-2', field_definition_id: 'cfd-1', entity_id: 'emp-2', org_id: 'org-1', value: 'ECB-2020-014', created_at: '2026-01-05T00:00:00Z', updated_at: '2026-01-05T00:00:00Z' },
  { id: 'cfv-3', field_definition_id: 'cfd-1', entity_id: 'emp-3', org_id: 'org-1', value: 'ECB-2021-032', created_at: '2026-01-05T00:00:00Z', updated_at: '2026-01-05T00:00:00Z' },
  { id: 'cfv-4', field_definition_id: 'cfd-1', entity_id: 'emp-4', org_id: 'org-1', value: 'ECB-2025-078', created_at: '2026-01-05T00:00:00Z', updated_at: '2026-01-05T00:00:00Z' },
  { id: 'cfv-5', field_definition_id: 'cfd-1', entity_id: 'emp-5', org_id: 'org-1', value: 'ECB-2018-003', created_at: '2026-01-05T00:00:00Z', updated_at: '2026-01-05T00:00:00Z' },
  // T-Shirt Sizes
  { id: 'cfv-6', field_definition_id: 'cfd-2', entity_id: 'emp-1', org_id: 'org-1', value: 'L', created_at: '2026-01-05T00:00:00Z', updated_at: '2026-01-05T00:00:00Z' },
  { id: 'cfv-7', field_definition_id: 'cfd-2', entity_id: 'emp-2', org_id: 'org-1', value: 'M', created_at: '2026-01-05T00:00:00Z', updated_at: '2026-01-05T00:00:00Z' },
  { id: 'cfv-8', field_definition_id: 'cfd-2', entity_id: 'emp-3', org_id: 'org-1', value: 'XL', created_at: '2026-01-05T00:00:00Z', updated_at: '2026-01-05T00:00:00Z' },
  // LinkedIn URLs
  { id: 'cfv-9', field_definition_id: 'cfd-4', entity_id: 'emp-1', org_id: 'org-1', value: 'https://linkedin.com/in/oluwaseun-adeyemi', created_at: '2026-01-05T00:00:00Z', updated_at: '2026-01-05T00:00:00Z' },
  { id: 'cfv-10', field_definition_id: 'cfd-4', entity_id: 'emp-5', org_id: 'org-1', value: 'https://linkedin.com/in/amadou-diallo', created_at: '2026-01-05T00:00:00Z', updated_at: '2026-01-05T00:00:00Z' },
  // Blood Types
  { id: 'cfv-11', field_definition_id: 'cfd-5', entity_id: 'emp-1', org_id: 'org-1', value: 'O+', created_at: '2026-01-05T00:00:00Z', updated_at: '2026-01-05T00:00:00Z' },
  { id: 'cfv-12', field_definition_id: 'cfd-5', entity_id: 'emp-2', org_id: 'org-1', value: 'A+', created_at: '2026-01-05T00:00:00Z', updated_at: '2026-01-05T00:00:00Z' },
  { id: 'cfv-13', field_definition_id: 'cfd-5', entity_id: 'emp-3', org_id: 'org-1', value: 'B+', created_at: '2026-01-05T00:00:00Z', updated_at: '2026-01-05T00:00:00Z' },
  // Preferred Names
  { id: 'cfv-14', field_definition_id: 'cfd-6', entity_id: 'emp-1', org_id: 'org-1', value: 'Seun', created_at: '2026-01-05T00:00:00Z', updated_at: '2026-01-05T00:00:00Z' },
  { id: 'cfv-15', field_definition_id: 'cfd-6', entity_id: 'emp-13', org_id: 'org-1', value: 'BJ', created_at: '2026-01-05T00:00:00Z', updated_at: '2026-01-05T00:00:00Z' },
  // Dietary Restrictions
  { id: 'cfv-16', field_definition_id: 'cfd-7', entity_id: 'emp-5', org_id: 'org-1', value: 'Halal', created_at: '2026-01-05T00:00:00Z', updated_at: '2026-01-05T00:00:00Z' },
  { id: 'cfv-17', field_definition_id: 'cfd-7', entity_id: 'emp-6', org_id: 'org-1', value: 'Halal', created_at: '2026-01-05T00:00:00Z', updated_at: '2026-01-05T00:00:00Z' },
  // Parking Spots
  { id: 'cfv-18', field_definition_id: 'cfd-8', entity_id: 'emp-1', org_id: 'org-1', value: 'A-12', created_at: '2026-01-05T00:00:00Z', updated_at: '2026-01-05T00:00:00Z' },
  { id: 'cfv-19', field_definition_id: 'cfd-8', entity_id: 'emp-5', org_id: 'org-1', value: 'B-03', created_at: '2026-01-05T00:00:00Z', updated_at: '2026-01-05T00:00:00Z' },
  { id: 'cfv-20', field_definition_id: 'cfd-8', entity_id: 'emp-13', org_id: 'org-1', value: 'A-01', created_at: '2026-01-05T00:00:00Z', updated_at: '2026-01-05T00:00:00Z' },
  // Work Permit Numbers (for non-citizen employees)
  { id: 'cfv-21', field_definition_id: 'cfd-3', entity_id: 'emp-3', org_id: 'org-1', value: 'GH-WP-2021-4451', created_at: '2026-01-05T00:00:00Z', updated_at: '2026-01-05T00:00:00Z' },
  { id: 'cfv-22', field_definition_id: 'cfd-3', entity_id: 'emp-8', org_id: 'org-1', value: 'KE-WP-2022-1128', created_at: '2026-01-05T00:00:00Z', updated_at: '2026-01-05T00:00:00Z' },
]

// === From agent-a32687a5 ===
// ─── Emergency Contacts ─────────────────────────────────────

export const demoEmergencyContacts = [
  // emp-1 Oluwaseun Adeyemi
  { id: 'ec-1', org_id: 'org-1', employee_id: 'emp-1', name: 'Funke Adeyemi', relationship: 'spouse' as const, phone: '+234 801 111 2222', email: 'funke.adeyemi@gmail.com', address: '15 Admiralty Way, Lekki, Lagos', is_primary: true, created_at: '2026-01-05T00:00:00Z' },
  { id: 'ec-2', org_id: 'org-1', employee_id: 'emp-1', name: 'Adewale Adeyemi', relationship: 'parent' as const, phone: '+234 803 333 4444', email: null, address: '22 Ring Road, Ibadan, Oyo', is_primary: false, created_at: '2026-01-05T00:00:00Z' },
  // emp-2 Ngozi Okafor
  { id: 'ec-3', org_id: 'org-1', employee_id: 'emp-2', name: 'Chidi Okafor', relationship: 'spouse' as const, phone: '+234 802 555 6666', email: 'chidi.okafor@yahoo.com', address: '8 Ozumba Mbadiwe Ave, Victoria Island, Lagos', is_primary: true, created_at: '2026-01-05T00:00:00Z' },
  { id: 'ec-4', org_id: 'org-1', employee_id: 'emp-2', name: 'Ada Okafor', relationship: 'sibling' as const, phone: '+234 805 777 8888', email: null, address: '45 New Market Road, Onitsha, Anambra', is_primary: false, created_at: '2026-01-05T00:00:00Z' },
  // emp-3 Kwame Asante
  { id: 'ec-5', org_id: 'org-1', employee_id: 'emp-3', name: 'Ama Asante', relationship: 'spouse' as const, phone: '+233 20 555 1234', email: 'ama.asante@gmail.com', address: '12 Oxford Street, Osu, Accra', is_primary: true, created_at: '2026-01-05T00:00:00Z' },
  { id: 'ec-6', org_id: 'org-1', employee_id: 'emp-3', name: 'Yaw Asante', relationship: 'parent' as const, phone: '+233 24 666 5678', email: null, address: 'Adum, Kumasi, Ashanti Region', is_primary: false, created_at: '2026-01-05T00:00:00Z' },
  // emp-4 Chioma Eze
  { id: 'ec-7', org_id: 'org-1', employee_id: 'emp-4', name: 'Nneka Eze', relationship: 'parent' as const, phone: '+234 803 999 0000', email: 'nneka.eze@gmail.com', address: '7 Aba Road, Port Harcourt, Rivers', is_primary: true, created_at: '2026-01-05T00:00:00Z' },
  { id: 'ec-8', org_id: 'org-1', employee_id: 'emp-4', name: 'Obinna Eze', relationship: 'sibling' as const, phone: '+234 806 111 3333', email: null, address: '7 Aba Road, Port Harcourt, Rivers', is_primary: false, created_at: '2026-01-05T00:00:00Z' },
  // emp-5 Amadou Diallo
  { id: 'ec-9', org_id: 'org-1', employee_id: 'emp-5', name: 'Mariama Diallo', relationship: 'spouse' as const, phone: '+225 07 22 33 44', email: 'mariama.diallo@gmail.com', address: 'Cocody, Abidjan', is_primary: true, created_at: '2026-01-05T00:00:00Z' },
  { id: 'ec-10', org_id: 'org-1', employee_id: 'emp-5', name: 'Ibrahima Diallo', relationship: 'parent' as const, phone: '+225 05 44 55 66', email: null, address: 'Plateau, Abidjan', is_primary: false, created_at: '2026-01-05T00:00:00Z' },
  // emp-6 Fatou Ndiaye
  { id: 'ec-11', org_id: 'org-1', employee_id: 'emp-6', name: 'Moussa Ndiaye', relationship: 'spouse' as const, phone: '+221 77 888 99 00', email: 'moussa.ndiaye@gmail.com', address: 'Almadies, Dakar', is_primary: true, created_at: '2026-01-05T00:00:00Z' },
  { id: 'ec-12', org_id: 'org-1', employee_id: 'emp-6', name: 'Aissatou Ndiaye', relationship: 'parent' as const, phone: '+221 76 111 22 33', email: null, address: 'Medina, Dakar', is_primary: false, created_at: '2026-01-05T00:00:00Z' },
  // emp-7 Marie Kouassi
  { id: 'ec-13', org_id: 'org-1', employee_id: 'emp-7', name: 'Jean Kouassi', relationship: 'parent' as const, phone: '+225 07 55 66 77', email: null, address: 'Treichville, Abidjan', is_primary: true, created_at: '2026-01-05T00:00:00Z' },
  { id: 'ec-14', org_id: 'org-1', employee_id: 'emp-7', name: 'Claire Kouassi', relationship: 'sibling' as const, phone: '+225 05 88 99 00', email: 'claire.k@gmail.com', address: 'Marcory, Abidjan', is_primary: false, created_at: '2026-01-05T00:00:00Z' },
  // emp-8 James Kamau
  { id: 'ec-15', org_id: 'org-1', employee_id: 'emp-8', name: 'Lucy Kamau', relationship: 'spouse' as const, phone: '+254 712 000 111', email: 'lucy.kamau@gmail.com', address: 'Westlands, Nairobi', is_primary: true, created_at: '2026-01-05T00:00:00Z' },
  { id: 'ec-16', org_id: 'org-1', employee_id: 'emp-8', name: 'Peter Kamau', relationship: 'parent' as const, phone: '+254 722 222 333', email: null, address: 'Thika Road, Nairobi', is_primary: false, created_at: '2026-01-05T00:00:00Z' },
  // emp-9 Kofi Mensah
  { id: 'ec-17', org_id: 'org-1', employee_id: 'emp-9', name: 'Akua Mensah', relationship: 'spouse' as const, phone: '+233 24 444 5555', email: 'akua.mensah@gmail.com', address: 'East Legon, Accra', is_primary: true, created_at: '2026-01-05T00:00:00Z' },
  { id: 'ec-18', org_id: 'org-1', employee_id: 'emp-9', name: 'Kwesi Mensah', relationship: 'sibling' as const, phone: '+233 20 666 7777', email: null, address: 'Spintex Road, Accra', is_primary: false, created_at: '2026-01-05T00:00:00Z' },
  // emp-10 Abena Boateng
  { id: 'ec-19', org_id: 'org-1', employee_id: 'emp-10', name: 'Kwabena Boateng', relationship: 'parent' as const, phone: '+233 20 888 9999', email: 'k.boateng@gmail.com', address: 'Tema, Greater Accra', is_primary: true, created_at: '2026-01-05T00:00:00Z' },
  { id: 'ec-20', org_id: 'org-1', employee_id: 'emp-10', name: 'Efua Boateng', relationship: 'sibling' as const, phone: '+233 24 000 1111', email: null, address: 'Tema, Greater Accra', is_primary: false, created_at: '2026-01-05T00:00:00Z' },
]

// === From agent-a69bff0a ===
// ─── Performance: Merit Cycles ─────────────────────────────────────

export const demoMeritCycles = [
  {
    id: 'merit-1', org_id: 'org-1', name: 'Annual Merit Review 2026', type: 'annual_merit' as const,
    status: 'manager_allocation' as const, fiscal_year: '2026',
    total_budget: 850000, currency: 'USD',
    guidelines_config: {
      rating_ranges: [
        { rating: 5, label: 'Exceptional', min_percent: 8, max_percent: 12 },
        { rating: 4, label: 'Exceeds Expectations', min_percent: 5, max_percent: 8 },
        { rating: 3, label: 'Meets Expectations', min_percent: 2, max_percent: 4 },
        { rating: 2, label: 'Needs Improvement', min_percent: 0, max_percent: 2 },
        { rating: 1, label: 'Unsatisfactory', min_percent: 0, max_percent: 0 },
      ],
    },
    start_date: '2026-02-01', end_date: '2026-04-30',
    created_by: 'emp-17', created_at: '2026-01-20T09:00:00Z',
  },
]

// === From agent-a69bff0a ===
export const demoMeritRecommendations = [
  { id: 'mr-1', cycle_id: 'merit-1', employee_id: 'emp-2', org_id: 'org-1', manager_id: 'emp-1', current_salary: 95000, proposed_salary: 103550, increase_percent: 9.0, increase_amount: 8550, rating: 5, justification: 'Exceptional branch performance. Revenue grew 22% year-over-year under her management. Led successful digital adoption initiative.', status: 'manager_approved' as const, approved_by: null, approved_at: null },
  { id: 'mr-2', cycle_id: 'merit-1', employee_id: 'emp-3', org_id: 'org-1', manager_id: 'emp-1', current_salary: 72000, proposed_salary: 76320, increase_percent: 6.0, increase_amount: 4320, rating: 4, justification: 'Strong client relationship management. Achieved 95% satisfaction score. Contributed to cross-sell targets.', status: 'pending' as const, approved_by: null, approved_at: null },
  { id: 'mr-3', cycle_id: 'merit-1', employee_id: 'emp-6', org_id: 'org-1', manager_id: 'emp-5', current_salary: 88000, proposed_salary: 94160, increase_percent: 7.0, increase_amount: 6160, rating: 4, justification: 'Outstanding credit analysis work. Identified key portfolio risks that saved the bank significant exposure. Mentor to junior analysts.', status: 'hr_approved' as const, approved_by: 'emp-17', approved_at: '2026-02-25T14:00:00Z' },
  { id: 'mr-4', cycle_id: 'merit-1', employee_id: 'emp-14', org_id: 'org-1', manager_id: 'emp-13', current_salary: 105000, proposed_salary: 115500, increase_percent: 10.0, increase_amount: 10500, rating: 5, justification: 'Led critical payment gateway migration. Technical excellence and leadership. Upskilled 3 junior developers.', status: 'pending' as const, approved_by: null, approved_at: null },
  { id: 'mr-5', cycle_id: 'merit-1', employee_id: 'emp-15', org_id: 'org-1', manager_id: 'emp-13', current_salary: 98000, proposed_salary: 103880, increase_percent: 6.0, increase_amount: 5880, rating: 4, justification: 'Excellent infrastructure reliability. 99.9% uptime achievement. Implemented cost-saving cloud optimization.', status: 'pending' as const, approved_by: null, approved_at: null },
  { id: 'mr-6', cycle_id: 'merit-1', employee_id: 'emp-18', org_id: 'org-1', manager_id: 'emp-17', current_salary: 82000, proposed_salary: 84460, increase_percent: 3.0, increase_amount: 2460, rating: 3, justification: 'Met core recruitment targets. Good stakeholder relationships. Needs to improve time-to-hire metrics.', status: 'manager_approved' as const, approved_by: null, approved_at: null },
  { id: 'mr-7', cycle_id: 'merit-1', employee_id: 'emp-22', org_id: 'org-1', manager_id: 'emp-21', current_salary: 90000, proposed_salary: 96300, increase_percent: 7.0, increase_amount: 6300, rating: 4, justification: 'Successfully led UEMOA regulatory audit preparation. Zero compliance findings. Proactive risk identification.', status: 'pending' as const, approved_by: null, approved_at: null },
  { id: 'mr-8', cycle_id: 'merit-1', employee_id: 'emp-28', org_id: 'org-1', manager_id: 'emp-27', current_salary: 85000, proposed_salary: 87550, increase_percent: 3.0, increase_amount: 2550, rating: 3, justification: 'Solid digital marketing execution. Campaign ROI met targets. Room for improvement in innovative campaign development.', status: 'pending' as const, approved_by: null, approved_at: null },
]

// === From agent-a69bff0a ===
export const demoPIPCheckIns = [
  {
    id: 'pip-ci-1', pip_id: 'pip-1', date: '2026-01-29', conducted_by: 'emp-9',
    progress: 'behind' as const,
    notes: 'First check-in. Employee acknowledges gaps and is motivated to improve. Automation module A is 40% complete. Started reviewing documentation.',
    objectives_status: [
      { title: 'Complete automation module A', status: 'in_progress' },
      { title: 'Reduce error rate to below 2%', status: 'not_started' },
      { title: 'Complete technical skills training', status: 'not_started' },
    ],
    next_steps: 'Focus on completing module A by Feb 15 deadline. Begin Python training course this week.',
  },
  {
    id: 'pip-ci-2', pip_id: 'pip-1', date: '2026-02-12', conducted_by: 'emp-9',
    progress: 'on_track' as const,
    notes: 'Good progress on module A - now at 85% complete. Error rate analysis started. Python course enrolled.',
    objectives_status: [
      { title: 'Complete automation module A', status: 'almost_done' },
      { title: 'Reduce error rate to below 2%', status: 'in_progress' },
      { title: 'Complete technical skills training', status: 'in_progress' },
    ],
    next_steps: 'Complete module A this week. Begin systematic error rate reduction analysis. Continue Python course modules.',
  },
  {
    id: 'pip-ci-3', pip_id: 'pip-1', date: '2026-02-26', conducted_by: 'emp-9',
    progress: 'improved' as const,
    notes: 'Module A completed and deployed successfully! Error rate reduced from 8% to 5.2%. Making good progress overall.',
    objectives_status: [
      { title: 'Complete automation module A', status: 'completed' },
      { title: 'Reduce error rate to below 2%', status: 'in_progress' },
      { title: 'Complete technical skills training', status: 'in_progress' },
    ],
    next_steps: 'Continue error rate reduction efforts. Target 3% by next check-in. Complete at least 2 Python modules.',
  },
  {
    id: 'pip-ci-4', pip_id: 'pip-2', date: '2025-10-15', conducted_by: 'emp-2',
    progress: 'on_track' as const,
    notes: 'Employee started shadowing senior teller. No complaints in first two weeks. Enrolled in customer service training.',
    objectives_status: [
      { title: 'Zero customer escalations', status: 'on_track' },
      { title: 'Complete customer service excellence training', status: 'in_progress' },
      { title: 'Achieve 90%+ customer satisfaction score', status: 'not_started' },
    ],
    next_steps: 'Continue shadowing program. Prepare for customer service excellence workshop next week.',
  },
  {
    id: 'pip-ci-5', pip_id: 'pip-3', date: '2025-12-01', conducted_by: 'emp-27',
    progress: 'behind' as const,
    notes: 'Only 3 articles published in November vs 8 target. Style guide training completed but application inconsistent. Quality improvement needed.',
    objectives_status: [
      { title: 'Produce 8 approved blog posts per month', status: 'behind' },
      { title: 'Achieve first-draft approval rate of 60%+', status: 'behind' },
      { title: 'Complete brand voice and style guide training', status: 'completed' },
    ],
    next_steps: 'Increase writing cadence. Daily writing sprints recommended. Additional editorial review sessions scheduled.',
  },
]

// === From agent-a69bff0a ===
// ─── Performance: PIPs ─────────────────────────────────────

export const demoPIPs = [
  {
    id: 'pip-1', org_id: 'org-1', employee_id: 'emp-11', created_by: 'emp-9',
    reason: 'Consistent underperformance in reconciliation process automation project. Missed 3 consecutive milestone deadlines and deliverable quality below expectations.',
    start_date: '2026-01-15', end_date: '2026-04-15',
    status: 'active' as const,
    objectives: [
      { title: 'Complete automation module A', description: 'Deliver the transaction matching module with 95% accuracy', targetDate: '2026-02-15', status: 'completed' as const, measure: 'Module deployed and passing QA tests' },
      { title: 'Reduce error rate to below 2%', description: 'Current error rate is 8%. Must bring down to under 2% in reconciliation outputs', targetDate: '2026-03-15', status: 'in_progress' as const, measure: 'Error rate measured weekly from production logs' },
      { title: 'Complete technical skills training', description: 'Finish Python advanced data processing course and SQL optimization certification', targetDate: '2026-03-31', status: 'not_started' as const, measure: 'Course completion certificates submitted' },
    ],
    support_provided: 'Weekly mentoring sessions with senior engineer Yaw Frimpong. Access to advanced Python training platform. Reduced workload by 20% to allow focus on improvement areas.',
    check_in_frequency: 'biweekly' as const,
    next_check_in: '2026-03-14',
    outcome: null,
    notes: 'Employee has shown improvement in first objective. Attitude is positive and receptive to feedback.',
    created_at: '2026-01-15T09:00:00Z', updated_at: '2026-02-28T10:00:00Z',
  },
  {
    id: 'pip-2', org_id: 'org-1', employee_id: 'emp-4', created_by: 'emp-2',
    reason: 'Customer complaint rate significantly higher than peers. Three formal customer escalations in Q4 2025. Need to improve service quality and adherence to banking protocols.',
    start_date: '2025-10-01', end_date: '2026-01-31',
    status: 'completed_success' as const,
    objectives: [
      { title: 'Zero customer escalations', description: 'No formal customer complaints for 90 consecutive days', targetDate: '2025-12-31', status: 'completed' as const, measure: 'Customer complaint tracking system shows zero escalations' },
      { title: 'Complete customer service excellence training', description: 'Attend and pass the 3-day customer service excellence program', targetDate: '2025-11-15', status: 'completed' as const, measure: 'Training certificate and manager observation report' },
      { title: 'Achieve 90%+ customer satisfaction score', description: 'Post-interaction survey scores must average 90% or above', targetDate: '2026-01-15', status: 'completed' as const, measure: 'Monthly satisfaction survey results from CRM' },
    ],
    support_provided: 'Paired with senior teller for shadowing. Enrolled in customer service excellence program. Weekly coaching sessions with branch manager.',
    check_in_frequency: 'weekly' as const,
    next_check_in: null,
    outcome: 'Successfully completed all objectives. Customer satisfaction improved from 72% to 94%. Recommend removal from PIP with continued monitoring.',
    notes: 'Excellent turnaround. Employee demonstrated strong commitment to improvement.',
    created_at: '2025-10-01T09:00:00Z', updated_at: '2026-01-31T15:00:00Z',
  },
  {
    id: 'pip-3', org_id: 'org-1', employee_id: 'emp-30', created_by: 'emp-27',
    reason: 'Content quality and output volume consistently below expectations. Blog posts require extensive revisions. Missing content calendar deadlines regularly.',
    start_date: '2025-11-01', end_date: '2026-02-28',
    status: 'completed_failure' as const,
    objectives: [
      { title: 'Produce 8 approved blog posts per month', description: 'Deliver 8 publication-ready articles per month without requiring more than one round of edits', targetDate: '2026-01-31', status: 'not_met' as const, measure: 'Editorial tracking system - published articles count' },
      { title: 'Achieve first-draft approval rate of 60%+', description: 'At least 60% of submitted drafts should be approved without major revisions', targetDate: '2026-01-31', status: 'not_met' as const, measure: 'Editor feedback log and revision tracking' },
      { title: 'Complete brand voice and style guide training', description: 'Master the Ecobank brand guidelines and demonstrate consistent application', targetDate: '2025-12-15', status: 'completed' as const, measure: 'Training completion and style consistency audit' },
    ],
    support_provided: 'Writing workshops, editorial mentoring from Digital Marketing Lead, style guide training, reduced output target during first month.',
    check_in_frequency: 'weekly' as const,
    next_check_in: null,
    outcome: 'Employee was unable to meet 2 of 3 objectives despite extensive support. Average output remained at 4 posts/month with 30% first-draft approval rate. Recommending role reassignment discussion.',
    notes: 'Despite genuine effort, the role requirements may not align with the employee\'s strengths. HR to discuss alternative placement options.',
    created_at: '2025-11-01T09:00:00Z', updated_at: '2026-02-28T12:00:00Z',
  },
]

// === From agent-a69bff0a ===
// ─── Performance: Review Templates ─────────────────────────────────────

export const demoReviewTemplates = [
  {
    id: 'rt-1', org_id: 'org-1', name: 'Annual Performance Review', type: 'annual' as const,
    is_default: true, created_by: 'emp-17', created_at: '2025-11-01T09:00:00Z',
    sections: [
      {
        title: 'Performance Against Goals',
        description: 'Evaluate the employee\'s achievement of goals set during the review period.',
        questions: [
          { text: 'How effectively did the employee achieve their assigned goals?', type: 'rating' as const, required: true, scale: { min: 1, max: 5, labels: ['Far Below', 'Below', 'Meets', 'Exceeds', 'Exceptional'] } },
          { text: 'Describe specific achievements and contributions during this period.', type: 'text' as const, required: true },
          { text: 'Were there any goals that were not met? If so, what were the contributing factors?', type: 'text' as const, required: false },
        ],
      },
      {
        title: 'Core Competencies',
        description: 'Rate the employee on key competencies required for their role.',
        questions: [
          { text: 'Leadership & Influence', type: 'rating' as const, required: true, scale: { min: 1, max: 5, labels: ['Foundational', 'Developing', 'Proficient', 'Advanced', 'Mastery'] } },
          { text: 'Communication & Collaboration', type: 'rating' as const, required: true, scale: { min: 1, max: 5, labels: ['Foundational', 'Developing', 'Proficient', 'Advanced', 'Mastery'] } },
          { text: 'Technical/Functional Expertise', type: 'rating' as const, required: true, scale: { min: 1, max: 5, labels: ['Foundational', 'Developing', 'Proficient', 'Advanced', 'Mastery'] } },
          { text: 'Problem Solving & Innovation', type: 'rating' as const, required: true, scale: { min: 1, max: 5, labels: ['Foundational', 'Developing', 'Proficient', 'Advanced', 'Mastery'] } },
          { text: 'Customer Focus', type: 'rating' as const, required: true, scale: { min: 1, max: 5, labels: ['Foundational', 'Developing', 'Proficient', 'Advanced', 'Mastery'] } },
        ],
      },
      {
        title: 'Development & Growth',
        description: 'Assess the employee\'s growth trajectory and development potential.',
        questions: [
          { text: 'What skills or competencies has the employee developed during this period?', type: 'text' as const, required: true },
          { text: 'What are the top 2-3 development areas for the next review period?', type: 'text' as const, required: true },
          { text: 'Is this employee ready for promotion?', type: 'multiple_choice' as const, required: true, options: ['Ready now', 'Ready in 6-12 months', 'Ready in 1-2 years', 'Not yet ready'] },
        ],
      },
      {
        title: 'Overall Assessment',
        description: 'Provide an overall performance rating and summary.',
        questions: [
          { text: 'Overall Performance Rating', type: 'rating' as const, required: true, scale: { min: 1, max: 5, labels: ['Unsatisfactory', 'Needs Improvement', 'Meets Expectations', 'Exceeds Expectations', 'Exceptional'] } },
          { text: 'Summary comments and recommendations.', type: 'text' as const, required: true },
        ],
      },
    ],
  },
  {
    id: 'rt-2', org_id: 'org-1', name: 'Quarterly Check-in', type: 'quarterly' as const,
    is_default: false, created_by: 'emp-17', created_at: '2025-11-15T09:00:00Z',
    sections: [
      {
        title: 'Goal Progress',
        description: 'Review progress on current quarterly goals.',
        questions: [
          { text: 'What progress has been made on your quarterly goals?', type: 'text' as const, required: true },
          { text: 'Are there any blockers or challenges preventing goal completion?', type: 'text' as const, required: true },
          { text: 'Overall goal progress rating', type: 'rating' as const, required: true, scale: { min: 1, max: 5, labels: ['Behind', 'Slightly Behind', 'On Track', 'Ahead', 'Completed'] } },
        ],
      },
      {
        title: 'Feedback & Support',
        description: 'Discuss feedback and support needs.',
        questions: [
          { text: 'What support do you need from your manager to succeed?', type: 'text' as const, required: false },
          { text: 'How would you rate your overall engagement?', type: 'multiple_choice' as const, required: true, options: ['Very engaged', 'Engaged', 'Neutral', 'Somewhat disengaged', 'Disengaged'] },
          { text: 'Any additional feedback or concerns?', type: 'text' as const, required: false },
        ],
      },
    ],
  },
  {
    id: 'rt-3', org_id: 'org-1', name: '360 Feedback Review', type: '360' as const,
    is_default: false, created_by: 'emp-17', created_at: '2025-12-01T09:00:00Z',
    sections: [
      {
        title: 'Working Relationship',
        description: 'Assess your working relationship with this colleague.',
        questions: [
          { text: 'How often do you work with this person?', type: 'multiple_choice' as const, required: true, options: ['Daily', 'Weekly', 'Monthly', 'Occasionally'] },
          { text: 'What is your relationship to this person?', type: 'multiple_choice' as const, required: true, options: ['Manager', 'Direct report', 'Peer/colleague', 'Cross-functional partner', 'External stakeholder'] },
        ],
      },
      {
        title: 'Competency Assessment',
        description: 'Rate this person on the following competencies.',
        questions: [
          { text: 'Communication - Clearly conveys ideas and listens actively', type: 'rating' as const, required: true, scale: { min: 1, max: 5, labels: ['Rarely', 'Sometimes', 'Often', 'Usually', 'Always'] } },
          { text: 'Collaboration - Works effectively with others across teams', type: 'rating' as const, required: true, scale: { min: 1, max: 5, labels: ['Rarely', 'Sometimes', 'Often', 'Usually', 'Always'] } },
          { text: 'Accountability - Takes ownership and follows through on commitments', type: 'rating' as const, required: true, scale: { min: 1, max: 5, labels: ['Rarely', 'Sometimes', 'Often', 'Usually', 'Always'] } },
          { text: 'Innovation - Brings new ideas and approaches to solve problems', type: 'rating' as const, required: true, scale: { min: 1, max: 5, labels: ['Rarely', 'Sometimes', 'Often', 'Usually', 'Always'] } },
          { text: 'Leadership - Inspires and guides others toward shared goals', type: 'rating' as const, required: true, scale: { min: 1, max: 5, labels: ['Rarely', 'Sometimes', 'Often', 'Usually', 'Always'] } },
        ],
      },
      {
        title: 'Open Feedback',
        description: 'Share specific observations and suggestions.',
        questions: [
          { text: 'What does this person do particularly well? Please provide specific examples.', type: 'text' as const, required: true },
          { text: 'What is one area where this person could improve? Please be constructive and specific.', type: 'text' as const, required: true },
          { text: 'Any additional comments?', type: 'text' as const, required: false },
        ],
      },
    ],
  },
  {
    id: 'rt-4', org_id: 'org-1', name: 'Probation Review', type: 'probation' as const,
    is_default: false, created_by: 'emp-17', created_at: '2025-12-15T09:00:00Z',
    sections: [
      {
        title: 'Role Fit Assessment',
        description: 'Evaluate how well the employee has adapted to their role during the probation period.',
        questions: [
          { text: 'How well has the employee adapted to the role requirements?', type: 'rating' as const, required: true, scale: { min: 1, max: 5, labels: ['Poor', 'Below Average', 'Satisfactory', 'Good', 'Excellent'] } },
          { text: 'Has the employee demonstrated the skills outlined in the job description?', type: 'multiple_choice' as const, required: true, options: ['Fully demonstrated', 'Mostly demonstrated', 'Partially demonstrated', 'Not yet demonstrated'] },
          { text: 'Describe specific examples of role-relevant contributions.', type: 'text' as const, required: true },
        ],
      },
      {
        title: 'Cultural Integration',
        description: 'Assess integration with team and organizational culture.',
        questions: [
          { text: 'How well has the employee integrated with the team?', type: 'rating' as const, required: true, scale: { min: 1, max: 5, labels: ['Struggling', 'Some challenges', 'Integrating', 'Well integrated', 'Fully integrated'] } },
          { text: 'Does the employee demonstrate alignment with company values?', type: 'multiple_choice' as const, required: true, options: ['Strong alignment', 'Good alignment', 'Developing alignment', 'Limited alignment'] },
          { text: 'Comments on cultural fit and team dynamics.', type: 'text' as const, required: false },
        ],
      },
      {
        title: 'Probation Decision',
        description: 'Final recommendation for the probation period.',
        questions: [
          { text: 'Probation outcome recommendation', type: 'multiple_choice' as const, required: true, options: ['Confirm employment', 'Extend probation (30 days)', 'Extend probation (60 days)', 'Do not confirm - end employment'] },
          { text: 'Key development areas for the first year if confirmed.', type: 'text' as const, required: true },
          { text: 'Overall comments and justification for decision.', type: 'text' as const, required: true },
        ],
      },
    ],
  },
]

// === From agent-a7be8979 ===
// ─── IT Cloud: App Assignments ────────────────────────────────────
export const demoAppAssignments = [
  { id: 'aa-1', appId: 'app-1', employeeId: 'emp-1', org_id: 'org-1', status: 'installed' as const, assignedAt: '2025-03-15T00:00:00Z', installedAt: '2025-03-15T01:00:00Z' },
  { id: 'aa-2', appId: 'app-2', employeeId: 'emp-1', org_id: 'org-1', status: 'installed' as const, assignedAt: '2025-03-15T00:00:00Z', installedAt: '2025-03-15T01:00:00Z' },
  { id: 'aa-3', appId: 'app-4', employeeId: 'emp-1', org_id: 'org-1', status: 'installed' as const, assignedAt: '2025-03-15T00:00:00Z', installedAt: '2025-03-15T01:30:00Z' },
  { id: 'aa-4', appId: 'app-7', employeeId: 'emp-1', org_id: 'org-1', status: 'installed' as const, assignedAt: '2025-03-15T00:00:00Z', installedAt: '2025-03-15T02:00:00Z' },
  { id: 'aa-5', appId: 'app-1', employeeId: 'emp-3', org_id: 'org-1', status: 'installed' as const, assignedAt: '2025-06-01T00:00:00Z', installedAt: '2025-06-01T01:00:00Z' },
  { id: 'aa-6', appId: 'app-3', employeeId: 'emp-13', org_id: 'org-1', status: 'installed' as const, assignedAt: '2025-09-10T00:00:00Z', installedAt: '2025-09-10T02:00:00Z' },
  { id: 'aa-7', appId: 'app-10', employeeId: 'emp-13', org_id: 'org-1', status: 'installed' as const, assignedAt: '2025-09-10T00:00:00Z', installedAt: '2025-09-10T02:30:00Z' },
  { id: 'aa-8', appId: 'app-5', employeeId: 'emp-24', org_id: 'org-1', status: 'installed' as const, assignedAt: '2025-05-20T00:00:00Z', installedAt: '2025-05-20T01:00:00Z' },
  { id: 'aa-9', appId: 'app-9', employeeId: 'emp-6', org_id: 'org-1', status: 'pending' as const, assignedAt: '2026-02-27T00:00:00Z', installedAt: null },
  { id: 'aa-10', appId: 'app-4', employeeId: 'emp-30', org_id: 'org-1', status: 'assigned' as const, assignedAt: '2026-02-25T00:00:00Z', installedAt: null },
  { id: 'aa-11', appId: 'app-8', employeeId: 'emp-14', org_id: 'org-1', status: 'installed' as const, assignedAt: '2025-04-01T00:00:00Z', installedAt: '2025-04-01T00:30:00Z' },
  { id: 'aa-12', appId: 'app-12', employeeId: 'emp-29', org_id: 'org-1', status: 'installed' as const, assignedAt: '2025-02-15T00:00:00Z', installedAt: '2025-02-16T09:00:00Z' },
]

// === From agent-a7be8979 ===
// ─── IT Cloud: App Catalog ────────────────────────────────────
export const demoAppCatalog = [
  { id: 'app-1', org_id: 'org-1', name: 'Slack', vendor: 'Salesforce', category: 'communication' as const, icon: 'MessageSquare', platform: 'cross-platform', version: '4.38.0', licenseType: 'per_seat' as const, licenseCost: 12.50, licenseCount: 200, assignedCount: 178, isRequired: true, autoInstall: true },
  { id: 'app-2', org_id: 'org-1', name: 'Zoom', vendor: 'Zoom', category: 'communication' as const, icon: 'Video', platform: 'cross-platform', version: '6.2.0', licenseType: 'per_seat' as const, licenseCost: 13.33, licenseCount: 200, assignedCount: 195, isRequired: true, autoInstall: true },
  { id: 'app-3', org_id: 'org-1', name: 'VS Code', vendor: 'Microsoft', category: 'development' as const, icon: 'Code', platform: 'cross-platform', version: '1.96.0', licenseType: 'free' as const, licenseCost: 0, licenseCount: 999, assignedCount: 42, isRequired: false, autoInstall: false },
  { id: 'app-4', org_id: 'org-1', name: '1Password', vendor: 'AgileBits', category: 'security' as const, icon: 'KeyRound', platform: 'cross-platform', version: '8.10.28', licenseType: 'per_seat' as const, licenseCost: 7.99, licenseCount: 200, assignedCount: 185, isRequired: true, autoInstall: true },
  { id: 'app-5', org_id: 'org-1', name: 'Figma', vendor: 'Figma', category: 'design' as const, icon: 'Palette', platform: 'cross-platform', version: '124.0', licenseType: 'per_seat' as const, licenseCost: 15.00, licenseCount: 30, assignedCount: 22, isRequired: false, autoInstall: false },
  { id: 'app-6', org_id: 'org-1', name: 'Chrome', vendor: 'Google', category: 'productivity' as const, icon: 'Globe', platform: 'cross-platform', version: '122.0', licenseType: 'free' as const, licenseCost: 0, licenseCount: 999, assignedCount: 200, isRequired: true, autoInstall: true },
  { id: 'app-7', org_id: 'org-1', name: 'Microsoft 365', vendor: 'Microsoft', category: 'productivity' as const, icon: 'FileSpreadsheet', platform: 'cross-platform', version: '16.0', licenseType: 'enterprise' as const, licenseCost: 35.00, licenseCount: 500, assignedCount: 423, isRequired: true, autoInstall: true },
  { id: 'app-8', org_id: 'org-1', name: 'CrowdStrike Falcon', vendor: 'CrowdStrike', category: 'security' as const, icon: 'ShieldCheck', platform: 'cross-platform', version: '7.10', licenseType: 'enterprise' as const, licenseCost: 8.99, licenseCount: 200, assignedCount: 190, isRequired: true, autoInstall: true },
  { id: 'app-9', org_id: 'org-1', name: 'Notion', vendor: 'Notion Labs', category: 'productivity' as const, icon: 'BookOpen', platform: 'cross-platform', version: '3.5.0', licenseType: 'per_seat' as const, licenseCost: 10.00, licenseCount: 100, assignedCount: 87, isRequired: false, autoInstall: false },
  { id: 'app-10', org_id: 'org-1', name: 'GitHub Enterprise', vendor: 'GitHub', category: 'development' as const, icon: 'GitBranch', platform: 'cross-platform', version: '3.12', licenseType: 'per_seat' as const, licenseCost: 21.00, licenseCount: 50, assignedCount: 42, isRequired: false, autoInstall: false },
  { id: 'app-11', org_id: 'org-1', name: 'Postman', vendor: 'Postman', category: 'development' as const, icon: 'Send', platform: 'cross-platform', version: '11.0', licenseType: 'per_seat' as const, licenseCost: 14.00, licenseCount: 30, assignedCount: 25, isRequired: false, autoInstall: false },
  { id: 'app-12', org_id: 'org-1', name: 'SAP SuccessFactors', vendor: 'SAP', category: 'hr' as const, icon: 'Users', platform: 'web', version: '2H 2025', licenseType: 'enterprise' as const, licenseCost: 22.00, licenseCount: 300, assignedCount: 280, isRequired: true, autoInstall: false },
]

// === From agent-a7be8979 ===
// ─── IT Cloud: Device Actions ────────────────────────────────────
export const demoDeviceActions = [
  { id: 'da-1', deviceId: 'md-13', org_id: 'org-1', actionType: 'lock' as const, status: 'completed' as const, initiatedBy: 'emp-1', notes: 'Device reported lost by field team — locked remotely', createdAt: '2026-01-16T08:00:00Z', completedAt: '2026-01-16T08:02:00Z' },
  { id: 'da-2', deviceId: 'md-13', org_id: 'org-1', actionType: 'wipe' as const, status: 'completed' as const, initiatedBy: 'emp-1', notes: 'Full device wipe after loss confirmation', createdAt: '2026-01-20T10:00:00Z', completedAt: '2026-01-20T10:15:00Z' },
  { id: 'da-3', deviceId: 'md-3', org_id: 'org-1', actionType: 'update_os' as const, status: 'pending' as const, initiatedBy: 'emp-14', notes: 'Push Windows 11 23H2 update for compliance', createdAt: '2026-02-27T14:00:00Z', completedAt: null },
  { id: 'da-4', deviceId: 'md-5', org_id: 'org-1', actionType: 'install_app' as const, status: 'in_progress' as const, initiatedBy: 'emp-14', notes: 'Installing 1Password on dev MacBook', createdAt: '2026-02-28T09:30:00Z', completedAt: null },
  { id: 'da-5', deviceId: 'md-12', org_id: 'org-1', actionType: 'push_config' as const, status: 'failed' as const, initiatedBy: 'emp-14', notes: 'Encryption policy push failed — device offline', createdAt: '2026-02-25T11:00:00Z', completedAt: '2026-02-25T11:05:00Z' },
]

// === From agent-a7be8979 ===
// ─── IT Cloud: Device Inventory ────────────────────────────────────
export const demoDeviceInventory = [
  { id: 'inv-it-1', org_id: 'org-1', name: 'MacBook Pro 16" M3 Max', type: 'laptop', platform: 'macos', serialNumber: 'C02WH2026NEW', status: 'in_warehouse' as const, condition: 'new' as const, purchaseDate: '2026-02-01', purchaseCost: 3499, warrantyExpiry: '2029-02-01', assignedTo: null, warehouseLocation: 'Lagos HQ - IT Store Room A', notes: 'Reserved for incoming VP Engineering' },
  { id: 'inv-it-2', org_id: 'org-1', name: 'Dell Latitude 5550', type: 'laptop', platform: 'windows', serialNumber: 'DL5550NEW02', status: 'in_warehouse' as const, condition: 'new' as const, purchaseDate: '2026-01-15', purchaseCost: 1299, warrantyExpiry: '2029-01-15', assignedTo: null, warehouseLocation: 'Lagos HQ - IT Store Room A', notes: null },
  { id: 'inv-it-3', org_id: 'org-1', name: 'MacBook Air M3', type: 'laptop', platform: 'macos', serialNumber: 'C02AIR2026', status: 'in_transit' as const, condition: 'new' as const, purchaseDate: '2026-02-10', purchaseCost: 1299, warrantyExpiry: '2029-02-10', assignedTo: 'emp-30', warehouseLocation: null, notes: 'Shipping to new hire in Accra office' },
  { id: 'inv-it-4', org_id: 'org-1', name: 'ThinkPad X1 Carbon Gen 11', type: 'laptop', platform: 'windows', serialNumber: 'PF3XRET01', status: 'retired' as const, condition: 'poor' as const, purchaseDate: '2022-06-01', purchaseCost: 1849, warrantyExpiry: '2025-06-01', assignedTo: null, warehouseLocation: 'Lagos HQ - IT Store Room B', notes: 'Battery swelling — retired from fleet' },
  { id: 'inv-it-5', org_id: 'org-1', name: 'iPad Pro 12.9" M2', type: 'tablet', platform: 'ios', serialNumber: 'DMQWH2025', status: 'assigned' as const, condition: 'good' as const, purchaseDate: '2025-08-20', purchaseCost: 1099, warrantyExpiry: '2027-08-20', assignedTo: 'emp-10', warehouseLocation: null, notes: null },
  { id: 'inv-it-6', org_id: 'org-1', name: 'Galaxy Tab S9', type: 'tablet', platform: 'android', serialNumber: 'SGT9WH2025', status: 'lost' as const, condition: 'good' as const, purchaseDate: '2025-06-20', purchaseCost: 849, warrantyExpiry: '2027-06-20', assignedTo: null, warehouseLocation: null, notes: 'Reported lost by field operations team' },
  { id: 'inv-it-7', org_id: 'org-1', name: 'HP EliteBook 840 G11', type: 'laptop', platform: 'windows', serialNumber: 'HP840WH01', status: 'in_warehouse' as const, condition: 'good' as const, purchaseDate: '2025-12-01', purchaseCost: 1449, warrantyExpiry: '2028-12-01', assignedTo: null, warehouseLocation: 'Lagos HQ - IT Store Room A', notes: 'Returned from emp-20, wiped and ready' },
  { id: 'inv-it-8', org_id: 'org-1', name: 'iPhone 16 Pro', type: 'phone', platform: 'ios', serialNumber: 'F2LNEW2026', status: 'in_warehouse' as const, condition: 'new' as const, purchaseDate: '2026-02-15', purchaseCost: 999, warrantyExpiry: '2028-02-15', assignedTo: null, warehouseLocation: 'Lagos HQ - IT Store Room A', notes: 'For executive team refresh' },
  { id: 'inv-it-9', org_id: 'org-1', name: 'Samsung Galaxy S24 Ultra', type: 'phone', platform: 'android', serialNumber: 'R58WH2025', status: 'assigned' as const, condition: 'good' as const, purchaseDate: '2025-11-05', purchaseCost: 1199, warrantyExpiry: '2027-11-05', assignedTo: 'emp-11', warehouseLocation: null, notes: null },
  { id: 'inv-it-10', org_id: 'org-1', name: 'Surface Pro 10', type: 'tablet', platform: 'windows', serialNumber: 'MSSP10WH01', status: 'in_transit' as const, condition: 'new' as const, purchaseDate: '2026-02-20', purchaseCost: 1599, warrantyExpiry: '2029-02-20', assignedTo: 'emp-16', warehouseLocation: null, notes: 'Replacement for cracked screen unit' },
]

// === From agent-a7be8979 ===
// ─── IT Cloud: Managed Devices (MDM) ────────────────────────────────────
export const demoManagedDevices = [
  { id: 'md-1', org_id: 'org-1', employee_id: 'emp-1', name: "Kwame's MacBook Pro", type: 'laptop', platform: 'macos' as const, manufacturer: 'Apple', model: 'MacBook Pro 16" M3 Max', serialNumber: 'C02ZN1YFLVDM', osVersion: 'macOS 15.3', lastSeen: '2026-02-28T09:15:00Z', status: 'active' as const, isEncrypted: true, isCompliant: true, storageCapacityGb: 1024, enrolledAt: '2025-03-15T00:00:00Z', mdmProfileInstalled: true },
  { id: 'md-2', org_id: 'org-1', employee_id: 'emp-3', name: "Ama's ThinkPad", type: 'laptop', platform: 'windows' as const, manufacturer: 'Lenovo', model: 'ThinkPad X1 Carbon Gen 12', serialNumber: 'PF4NKWX9', osVersion: 'Windows 11 23H2', lastSeen: '2026-02-28T08:45:00Z', status: 'active' as const, isEncrypted: true, isCompliant: true, storageCapacityGb: 512, enrolledAt: '2025-06-01T00:00:00Z', mdmProfileInstalled: true },
  { id: 'md-3', org_id: 'org-1', employee_id: 'emp-6', name: "Finance Dell", type: 'desktop', platform: 'windows' as const, manufacturer: 'Dell', model: 'OptiPlex 7010', serialNumber: 'DL7010XZ34', osVersion: 'Windows 11 22H2', lastSeen: '2026-02-27T17:30:00Z', status: 'active' as const, isEncrypted: false, isCompliant: false, storageCapacityGb: 256, enrolledAt: '2025-01-10T00:00:00Z', mdmProfileInstalled: true },
  { id: 'md-4', org_id: 'org-1', employee_id: 'emp-10', name: "Ops iPad Pro", type: 'tablet', platform: 'ios' as const, manufacturer: 'Apple', model: 'iPad Pro 12.9"', serialNumber: 'DMQVK3XFHG', osVersion: 'iPadOS 18.3', lastSeen: '2026-02-26T12:00:00Z', status: 'active' as const, isEncrypted: true, isCompliant: true, storageCapacityGb: 256, enrolledAt: '2025-08-20T00:00:00Z', mdmProfileInstalled: true },
  { id: 'md-5', org_id: 'org-1', employee_id: 'emp-13', name: "Dev MacBook Air", type: 'laptop', platform: 'macos' as const, manufacturer: 'Apple', model: 'MacBook Air M3', serialNumber: 'C02FM49QLVDL', osVersion: 'macOS 15.2', lastSeen: '2026-02-28T10:30:00Z', status: 'active' as const, isEncrypted: true, isCompliant: false, storageCapacityGb: 512, enrolledAt: '2025-09-10T00:00:00Z', mdmProfileInstalled: true },
  { id: 'md-6', org_id: 'org-1', employee_id: 'emp-14', name: "Dev Linux Workstation", type: 'desktop', platform: 'linux' as const, manufacturer: 'System76', model: 'Thelio Major', serialNumber: 'SYS76TH2024', osVersion: 'Ubuntu 24.04 LTS', lastSeen: '2026-02-28T11:00:00Z', status: 'active' as const, isEncrypted: true, isCompliant: true, storageCapacityGb: 2048, enrolledAt: '2025-04-01T00:00:00Z', mdmProfileInstalled: true },
  { id: 'md-7', org_id: 'org-1', employee_id: 'emp-16', name: "QA Surface Pro", type: 'tablet', platform: 'windows' as const, manufacturer: 'Microsoft', model: 'Surface Pro 10', serialNumber: 'MSSP10ABC789', osVersion: 'Windows 11 23H2', lastSeen: '2026-02-27T16:45:00Z', status: 'active' as const, isEncrypted: true, isCompliant: true, storageCapacityGb: 512, enrolledAt: '2025-07-15T00:00:00Z', mdmProfileInstalled: true },
  { id: 'md-8', org_id: 'org-1', employee_id: 'emp-24', name: "Marketing MacBook", type: 'laptop', platform: 'macos' as const, manufacturer: 'Apple', model: 'MacBook Pro 14" M3 Pro', serialNumber: 'C02KP8XYLVDN', osVersion: 'macOS 15.3', lastSeen: '2026-02-28T09:00:00Z', status: 'active' as const, isEncrypted: true, isCompliant: true, storageCapacityGb: 512, enrolledAt: '2025-05-20T00:00:00Z', mdmProfileInstalled: true },
  { id: 'md-9', org_id: 'org-1', employee_id: 'emp-1', name: "Kwame's iPhone", type: 'phone', platform: 'ios' as const, manufacturer: 'Apple', model: 'iPhone 16 Pro', serialNumber: 'F2LXK3VMHG', osVersion: 'iOS 18.3', lastSeen: '2026-02-28T11:30:00Z', status: 'active' as const, isEncrypted: true, isCompliant: true, storageCapacityGb: 256, enrolledAt: '2025-10-01T00:00:00Z', mdmProfileInstalled: true },
  { id: 'md-10', org_id: 'org-1', employee_id: 'emp-11', name: "Ops Android Phone", type: 'phone', platform: 'android' as const, manufacturer: 'Samsung', model: 'Galaxy S24 Ultra', serialNumber: 'R58T50BZKNE', osVersion: 'Android 15', lastSeen: '2026-02-25T14:20:00Z', status: 'active' as const, isEncrypted: true, isCompliant: true, storageCapacityGb: 512, enrolledAt: '2025-11-05T00:00:00Z', mdmProfileInstalled: true },
  { id: 'md-11', org_id: 'org-1', employee_id: null, name: "Spare Laptop 1", type: 'laptop', platform: 'windows' as const, manufacturer: 'HP', model: 'EliteBook 840 G11', serialNumber: 'HP840G11ZZ01', osVersion: 'Windows 11 23H2', lastSeen: '2026-02-10T08:00:00Z', status: 'inactive' as const, isEncrypted: true, isCompliant: true, storageCapacityGb: 512, enrolledAt: '2025-12-01T00:00:00Z', mdmProfileInstalled: false },
  { id: 'md-12', org_id: 'org-1', employee_id: 'emp-29', name: "HR Dell Latitude", type: 'laptop', platform: 'windows' as const, manufacturer: 'Dell', model: 'Latitude 5550', serialNumber: 'DL5550YN78', osVersion: 'Windows 11 22H2', lastSeen: '2026-02-20T09:10:00Z', status: 'active' as const, isEncrypted: false, isCompliant: false, storageCapacityGb: 256, enrolledAt: '2025-02-15T00:00:00Z', mdmProfileInstalled: true },
  { id: 'md-13', org_id: 'org-1', employee_id: null, name: "Lost Field Tablet", type: 'tablet', platform: 'android' as const, manufacturer: 'Samsung', model: 'Galaxy Tab S9', serialNumber: 'SGT9FIELD01', osVersion: 'Android 14', lastSeen: '2026-01-15T10:00:00Z', status: 'lost' as const, isEncrypted: true, isCompliant: false, storageCapacityGb: 128, enrolledAt: '2025-06-20T00:00:00Z', mdmProfileInstalled: true },
  { id: 'md-14', org_id: 'org-1', employee_id: null, name: "Retired ThinkPad", type: 'laptop', platform: 'windows' as const, manufacturer: 'Lenovo', model: 'ThinkPad T490', serialNumber: 'PF2JKRX1', osVersion: 'Windows 10 22H2', lastSeen: '2025-12-31T17:00:00Z', status: 'retired' as const, isEncrypted: true, isCompliant: false, storageCapacityGb: 256, enrolledAt: '2022-03-01T00:00:00Z', mdmProfileInstalled: false },
  { id: 'md-15', org_id: 'org-1', employee_id: 'emp-30', name: "New Hire Setup", type: 'laptop', platform: 'macos' as const, manufacturer: 'Apple', model: 'MacBook Air M3', serialNumber: 'C02NEW2026', osVersion: 'macOS 15.3', lastSeen: null, status: 'pending_setup' as const, isEncrypted: false, isCompliant: false, storageCapacityGb: 512, enrolledAt: '2026-02-25T00:00:00Z', mdmProfileInstalled: false },
]

// === From agent-a7be8979 ===
// ─── IT Cloud: Security Policies ────────────────────────────────────
export const demoSecurityPoliciesIT = [
  { id: 'sp-1', org_id: 'org-1', name: 'Password Complexity', type: 'password' as const, settings: { minLength: 12, requireUppercase: true, requireNumbers: true, requireSpecial: true, expiryDays: 90, preventReuse: 5 }, isActive: true, appliesTo: 'all' as const, targetValue: null, createdAt: '2025-01-01T00:00:00Z' },
  { id: 'sp-2', org_id: 'org-1', name: 'Full Disk Encryption', type: 'encryption' as const, settings: { algorithm: 'AES-256', enforceOnEnroll: true, allowUserDecrypt: false }, isActive: true, appliesTo: 'all' as const, targetValue: null, createdAt: '2025-01-01T00:00:00Z' },
  { id: 'sp-3', org_id: 'org-1', name: 'Automatic OS Updates', type: 'os_update' as const, settings: { maxDeferDays: 7, allowUserDefer: true, criticalImmediate: true, maintenanceWindow: '02:00-05:00' }, isActive: true, appliesTo: 'all' as const, targetValue: null, createdAt: '2025-03-15T00:00:00Z' },
  { id: 'sp-4', org_id: 'org-1', name: 'Screen Lock Timeout', type: 'screensaver' as const, settings: { lockAfterMinutes: 5, requirePasswordOnWake: true, lockOnLidClose: true }, isActive: true, appliesTo: 'all' as const, targetValue: null, createdAt: '2025-01-01T00:00:00Z' },
]

// === From agent-abd1acb5 ===
// Advanced Expense Policies (rules-based)
export const demoAdvancedExpensePolicies = [
  { id: 'aep-1', org_id: 'org-1', name: 'Maximum Meal Expense', is_active: true, rules: [{ field: 'amount', operator: '>', value: 75, action: 'block' as const }, { field: 'category', operator: '=', value: 'Meals', action: 'require_approval' as const }], applies_to: 'all' as const, target_values: null, created_at: '2025-01-01T00:00:00Z' },
  { id: 'aep-2', org_id: 'org-1', name: 'Daily Travel Cap', is_active: true, rules: [{ field: 'amount', operator: '>', value: 500, action: 'require_approval' as const }, { field: 'category', operator: '=', value: 'Travel', action: 'warn' as const }], applies_to: 'all' as const, target_values: null, created_at: '2025-01-01T00:00:00Z' },
  { id: 'aep-3', org_id: 'org-1', name: 'Receipt Required Over $25', is_active: true, rules: [{ field: 'amount', operator: '>', value: 25, action: 'require_approval' as const }], applies_to: 'all' as const, target_values: null, created_at: '2025-06-01T00:00:00Z' },
]

// === From agent-abd1acb5 ===
// Duplicate Detection
export const demoDuplicateDetections = [
  { id: 'dd-1', org_id: 'org-1', expense_item_id: 'ei-3', duplicate_of_id: 'ei-1', similarity: 0.85, fields: { amount: false, category: false, vendor: true, date: true, description: false }, status: 'flagged' as const, reviewed_by: null, created_at: '2026-02-11T00:00:00Z', expense_description: 'Client dinner', duplicate_description: 'Flight to Abidjan', expense_amount: 280, duplicate_amount: 450, employee_id: 'emp-5' },
  { id: 'dd-2', org_id: 'org-1', expense_item_id: 'ei-4', duplicate_of_id: 'ei-5', similarity: 0.72, fields: { amount: false, category: true, vendor: false, date: true, description: false }, status: 'dismissed' as const, reviewed_by: 'emp-17', created_at: '2026-02-19T00:00:00Z', expense_description: 'Booth rental', duplicate_description: 'Printed materials', expense_amount: 500, duplicate_amount: 350, employee_id: 'emp-18' },
  { id: 'dd-3', org_id: 'org-1', expense_item_id: 'ei-2', duplicate_of_id: 'ei-2', similarity: 0.98, fields: { amount: true, category: true, vendor: true, date: true, description: true }, status: 'confirmed_duplicate' as const, reviewed_by: 'emp-17', created_at: '2026-02-12T00:00:00Z', expense_description: 'Hotel (2 nights)', duplicate_description: 'Hotel (2 nights) - duplicate submission', expense_amount: 520, duplicate_amount: 520, employee_id: 'emp-5' },
]

// === From agent-abd1acb5 ===
// Advanced Mileage Entries
export const demoMileageEntries = [
  { id: 'me-1', org_id: 'org-1', employee_id: 'emp-5', date: '2026-02-10', start_location: 'Lagos Office, Victoria Island', end_location: 'Ikeja Client Site', distance_miles: 17.4, rate: 0.67, amount: 11.66, purpose: 'Client site visit for Q1 review', vehicle_type: 'personal' as const, trip_type: 'round_trip' as const, status: 'approved' as const, approved_by: 'emp-17', created_at: '2026-02-10T00:00:00Z' },
  { id: 'me-2', org_id: 'org-1', employee_id: 'emp-18', date: '2026-02-14', start_location: 'Accra HQ', end_location: 'Tema Port Office', distance_miles: 21.7, rate: 0.67, amount: 14.54, purpose: 'Recruitment event setup', vehicle_type: 'personal' as const, trip_type: 'one_way' as const, status: 'approved' as const, approved_by: 'emp-17', created_at: '2026-02-14T00:00:00Z' },
  { id: 'me-3', org_id: 'org-1', employee_id: 'emp-15', date: '2026-02-18', start_location: 'Nairobi Office, Westlands', end_location: 'Thika Road Industrial Park', distance_miles: 26.1, rate: 0.67, amount: 17.49, purpose: 'Vendor meeting for IT procurement', vehicle_type: 'company' as const, trip_type: 'round_trip' as const, status: 'approved' as const, approved_by: 'emp-13', created_at: '2026-02-18T00:00:00Z' },
  { id: 'me-4', org_id: 'org-1', employee_id: 'emp-29', date: '2026-02-20', start_location: 'Dakar Office', end_location: 'Rufisque Branch', distance_miles: 15.5, rate: 0.67, amount: 10.39, purpose: 'Branch audit and compliance check', vehicle_type: 'personal' as const, trip_type: 'one_way' as const, status: 'pending' as const, approved_by: null, created_at: '2026-02-20T00:00:00Z' },
  { id: 'me-5', org_id: 'org-1', employee_id: 'emp-5', date: '2026-02-22', start_location: 'Lagos Office, Victoria Island', end_location: 'Lekki Free Trade Zone', distance_miles: 31.0, rate: 0.67, amount: 20.77, purpose: 'Partner meeting at trade zone offices', vehicle_type: 'personal' as const, trip_type: 'round_trip' as const, status: 'pending' as const, approved_by: null, created_at: '2026-02-22T00:00:00Z' },
  { id: 'me-6', org_id: 'org-1', employee_id: 'emp-18', date: '2026-02-25', start_location: 'Accra HQ', end_location: 'University of Ghana, Legon', distance_miles: 8.7, rate: 0.67, amount: 5.83, purpose: 'Campus recruiting event', vehicle_type: 'company' as const, trip_type: 'round_trip' as const, status: 'rejected' as const, approved_by: 'emp-17', created_at: '2026-02-25T00:00:00Z' },
]

// === From agent-abd1acb5 ===
// Receipt Matching
export const demoReceiptMatches = [
  { id: 'rm-1', org_id: 'org-1', expense_item_id: 'ei-1', receipt_url: '/receipts/flight_abidjan.pdf', extracted_amount: 450, extracted_currency: 'USD', extracted_vendor: 'Air Cote d\'Ivoire', extracted_date: '2026-02-08', match_status: 'matched' as const, confidence: 0.97, discrepancy_notes: null, created_at: '2026-02-10T00:00:00Z' },
  { id: 'rm-2', org_id: 'org-1', expense_item_id: 'ei-2', receipt_url: '/receipts/hotel_invoice.pdf', extracted_amount: 520, extracted_currency: 'USD', extracted_vendor: 'Novotel Abidjan', extracted_date: '2026-02-09', match_status: 'matched' as const, confidence: 0.95, discrepancy_notes: null, created_at: '2026-02-10T00:00:00Z' },
  { id: 'rm-3', org_id: 'org-1', expense_item_id: 'ei-3', receipt_url: '/receipts/dinner_receipt.jpg', extracted_amount: 280, extracted_currency: 'USD', extracted_vendor: 'Le Plateau Restaurant', extracted_date: '2026-02-10', match_status: 'matched' as const, confidence: 0.92, discrepancy_notes: null, created_at: '2026-02-11T00:00:00Z' },
  { id: 'rm-4', org_id: 'org-1', expense_item_id: 'ei-4', receipt_url: '/receipts/booth_rental.pdf', extracted_amount: 500, extracted_currency: 'USD', extracted_vendor: 'Lagos Convention Center', extracted_date: '2026-02-16', match_status: 'matched' as const, confidence: 0.99, discrepancy_notes: null, created_at: '2026-02-18T00:00:00Z' },
  { id: 'rm-5', org_id: 'org-1', expense_item_id: 'ei-5', receipt_url: '/receipts/materials_order.pdf', extracted_amount: 350, extracted_currency: 'USD', extracted_vendor: 'PrintMax Lagos', extracted_date: '2026-02-15', match_status: 'matched' as const, confidence: 0.94, discrepancy_notes: null, created_at: '2026-02-18T00:00:00Z' },
  { id: 'rm-6', org_id: 'org-1', expense_item_id: 'ei-3', receipt_url: '/receipts/dinner_alt.jpg', extracted_amount: 310, extracted_currency: 'USD', extracted_vendor: 'Le Plateau Restaurant', extracted_date: '2026-02-10', match_status: 'mismatch_amount' as const, confidence: 0.78, discrepancy_notes: 'Receipt shows $310 but expense claims $280. Difference of $30.', created_at: '2026-02-11T00:00:00Z' },
  { id: 'rm-7', org_id: 'org-1', expense_item_id: 'ei-1', receipt_url: '/receipts/flight_wrong_vendor.pdf', extracted_amount: 450, extracted_currency: 'USD', extracted_vendor: 'Kenya Airways', extracted_date: '2026-02-08', match_status: 'mismatch_vendor' as const, confidence: 0.65, discrepancy_notes: 'Vendor mismatch: receipt from Kenya Airways but expense filed under Air Cote d\'Ivoire', created_at: '2026-02-10T00:00:00Z' },
  { id: 'rm-8', org_id: 'org-1', expense_item_id: null, receipt_url: '/receipts/taxi_receipt.png', extracted_amount: 45, extracted_currency: 'USD', extracted_vendor: 'Uber Lagos', extracted_date: '2026-02-20', match_status: 'pending' as const, confidence: null, discrepancy_notes: null, created_at: '2026-02-21T00:00:00Z' },
]

// === From agent-abd1acb5 ===
// Reimbursement Batches
export const demoReimbursementBatches = [
  { id: 'rb-1', org_id: 'org-1', status: 'completed' as const, method: 'payroll' as const, total_amount: 3350, currency: 'USD', employee_count: 2, processed_at: '2026-02-15T00:00:00Z', payroll_run_id: null, created_at: '2026-02-12T00:00:00Z', items: [
    { id: 'ri-1', batch_id: 'rb-1', expense_report_id: 'exp-4', employee_id: 'emp-15', amount: 2100, currency: 'USD', status: 'processed' as const, notes: 'AfricaTech Conference reimbursement' },
    { id: 'ri-2', batch_id: 'rb-1', expense_report_id: 'exp-1', employee_id: 'emp-5', amount: 1250, currency: 'USD', status: 'processed' as const, notes: 'Client Meeting Abidjan reimbursement' },
  ]},
  { id: 'rb-2', org_id: 'org-1', status: 'pending' as const, method: 'direct_deposit' as const, total_amount: 850, currency: 'USD', employee_count: 1, processed_at: null, payroll_run_id: null, created_at: '2026-02-25T00:00:00Z', items: [
    { id: 'ri-3', batch_id: 'rb-2', expense_report_id: 'exp-2', employee_id: 'emp-18', amount: 850, currency: 'USD', status: 'pending' as const, notes: 'Recruitment Fair Lagos - awaiting processing' },
  ]},
]

// === From agent-ade68ace ===
export const demoHeadcountBudgetItems = [
  // hcpos-1: Senior Relationship Manager
  { id: 'hcbi-1', position_id: 'hcpos-1', category: 'base_salary' as const, amount: 65000, currency: 'USD', notes: 'Mid-range salary for senior role' },
  { id: 'hcbi-2', position_id: 'hcpos-1', category: 'benefits' as const, amount: 16250, currency: 'USD', notes: '25% of base salary' },
  { id: 'hcbi-3', position_id: 'hcpos-1', category: 'equipment' as const, amount: 3000, currency: 'USD', notes: 'Laptop and mobile setup' },
  // hcpos-2: Branch Operations Manager
  { id: 'hcbi-4', position_id: 'hcpos-2', category: 'base_salary' as const, amount: 56000, currency: 'USD', notes: null },
  { id: 'hcbi-5', position_id: 'hcpos-2', category: 'benefits' as const, amount: 14000, currency: 'USD', notes: null },
  { id: 'hcbi-6', position_id: 'hcpos-2', category: 'relocation' as const, amount: 8000, currency: 'USD', notes: 'Relocation from Nigeria to Ghana' },
  // hcpos-3: Customer Service Representative (filled)
  { id: 'hcbi-7', position_id: 'hcpos-3', category: 'base_salary' as const, amount: 27000, currency: 'USD', notes: null },
  { id: 'hcbi-8', position_id: 'hcpos-3', category: 'benefits' as const, amount: 6750, currency: 'USD', notes: null },
  // hcpos-4: Senior Credit Analyst
  { id: 'hcbi-9', position_id: 'hcpos-4', category: 'base_salary' as const, amount: 70000, currency: 'USD', notes: null },
  { id: 'hcbi-10', position_id: 'hcpos-4', category: 'benefits' as const, amount: 17500, currency: 'USD', notes: null },
  { id: 'hcbi-11', position_id: 'hcpos-4', category: 'signing_bonus' as const, amount: 10000, currency: 'USD', notes: 'Competitive signing bonus for market' },
  // hcpos-5: Trade Finance Specialist
  { id: 'hcbi-12', position_id: 'hcpos-5', category: 'base_salary' as const, amount: 53000, currency: 'USD', notes: null },
  { id: 'hcbi-13', position_id: 'hcpos-5', category: 'benefits' as const, amount: 13250, currency: 'USD', notes: null },
  // hcpos-6: Process Automation Engineer
  { id: 'hcbi-14', position_id: 'hcpos-6', category: 'base_salary' as const, amount: 72000, currency: 'USD', notes: null },
  { id: 'hcbi-15', position_id: 'hcpos-6', category: 'benefits' as const, amount: 18000, currency: 'USD', notes: null },
  { id: 'hcbi-16', position_id: 'hcpos-6', category: 'equipment' as const, amount: 5000, currency: 'USD', notes: 'High-spec dev workstation' },
  // hcpos-7: Quality Assurance Analyst (filled)
  { id: 'hcbi-17', position_id: 'hcpos-7', category: 'base_salary' as const, amount: 42000, currency: 'USD', notes: null },
  { id: 'hcbi-18', position_id: 'hcpos-7', category: 'benefits' as const, amount: 10500, currency: 'USD', notes: null },
  // hcpos-8: Staff Software Engineer
  { id: 'hcbi-19', position_id: 'hcpos-8', category: 'base_salary' as const, amount: 110000, currency: 'USD', notes: null },
  { id: 'hcbi-20', position_id: 'hcpos-8', category: 'benefits' as const, amount: 27500, currency: 'USD', notes: null },
  { id: 'hcbi-21', position_id: 'hcpos-8', category: 'equity' as const, amount: 40000, currency: 'USD', notes: '4-year vest RSU grant' },
  { id: 'hcbi-22', position_id: 'hcpos-8', category: 'signing_bonus' as const, amount: 15000, currency: 'USD', notes: null },
  { id: 'hcbi-23', position_id: 'hcpos-8', category: 'equipment' as const, amount: 6000, currency: 'USD', notes: 'MacBook Pro + monitor setup' },
  // hcpos-9: Cloud Infrastructure Engineer
  { id: 'hcbi-24', position_id: 'hcpos-9', category: 'base_salary' as const, amount: 85000, currency: 'USD', notes: null },
  { id: 'hcbi-25', position_id: 'hcpos-9', category: 'benefits' as const, amount: 21250, currency: 'USD', notes: null },
  { id: 'hcbi-26', position_id: 'hcpos-9', category: 'equity' as const, amount: 25000, currency: 'USD', notes: null },
  // hcpos-10: Mobile Developer
  { id: 'hcbi-27', position_id: 'hcpos-10', category: 'base_salary' as const, amount: 60000, currency: 'USD', notes: null },
  { id: 'hcbi-28', position_id: 'hcpos-10', category: 'benefits' as const, amount: 15000, currency: 'USD', notes: null },
  // hcpos-11: Data Analyst (filled)
  { id: 'hcbi-29', position_id: 'hcpos-11', category: 'base_salary' as const, amount: 42000, currency: 'USD', notes: null },
  { id: 'hcbi-30', position_id: 'hcpos-11', category: 'benefits' as const, amount: 10500, currency: 'USD', notes: null },
  // hcpos-12: Compensation & Benefits Analyst
  { id: 'hcbi-31', position_id: 'hcpos-12', category: 'base_salary' as const, amount: 50000, currency: 'USD', notes: null },
  { id: 'hcbi-32', position_id: 'hcpos-12', category: 'benefits' as const, amount: 12500, currency: 'USD', notes: null },
  // hcpos-13: AML Compliance Officer
  { id: 'hcbi-33', position_id: 'hcpos-13', category: 'base_salary' as const, amount: 78000, currency: 'USD', notes: null },
  { id: 'hcbi-34', position_id: 'hcpos-13', category: 'benefits' as const, amount: 19500, currency: 'USD', notes: null },
  { id: 'hcbi-35', position_id: 'hcpos-13', category: 'relocation' as const, amount: 12000, currency: 'USD', notes: 'International relocation package' },
  // hcpos-14: Cybersecurity Analyst
  { id: 'hcbi-36', position_id: 'hcpos-14', category: 'base_salary' as const, amount: 62000, currency: 'USD', notes: null },
  { id: 'hcbi-37', position_id: 'hcpos-14', category: 'benefits' as const, amount: 15500, currency: 'USD', notes: null },
  // hcpos-15: Financial Planning Manager
  { id: 'hcbi-38', position_id: 'hcpos-15', category: 'base_salary' as const, amount: 72000, currency: 'USD', notes: null },
  { id: 'hcbi-39', position_id: 'hcpos-15', category: 'benefits' as const, amount: 18000, currency: 'USD', notes: null },
  { id: 'hcbi-40', position_id: 'hcpos-15', category: 'signing_bonus' as const, amount: 8000, currency: 'USD', notes: null },
  // hcpos-16: Growth Marketing Manager
  { id: 'hcbi-41', position_id: 'hcpos-16', category: 'base_salary' as const, amount: 58000, currency: 'USD', notes: null },
  { id: 'hcbi-42', position_id: 'hcpos-16', category: 'benefits' as const, amount: 14500, currency: 'USD', notes: null },
  // hcpos-17: Social Media Coordinator (cancelled)
  { id: 'hcbi-43', position_id: 'hcpos-17', category: 'base_salary' as const, amount: 30000, currency: 'USD', notes: 'Cancelled — budget reallocated' },
  { id: 'hcbi-44', position_id: 'hcpos-17', category: 'benefits' as const, amount: 7500, currency: 'USD', notes: null },
]

// === From agent-ade68ace ===
// ─── Headcount Planning ─────────────────────────────────────

export const demoHeadcountPlans = [
  {
    id: 'hcp-1', org_id: 'org-1', name: 'FY2026 Headcount Plan', fiscal_year: 'FY2026',
    status: 'active' as const, total_budget: 2850000, currency: 'USD',
    created_by: 'emp-17', approved_by: 'emp-24',
    created_at: '2025-11-15T00:00:00Z', updated_at: '2026-01-10T00:00:00Z',
  },
  {
    id: 'hcp-2', org_id: 'org-1', name: 'FY2025 Headcount Plan', fiscal_year: 'FY2025',
    status: 'closed' as const, total_budget: 2200000, currency: 'USD',
    created_by: 'emp-17', approved_by: 'emp-24',
    created_at: '2024-11-01T00:00:00Z', updated_at: '2025-12-31T00:00:00Z',
  },
]

// === From agent-ade68ace ===
export const demoHeadcountPositions = [
  // Retail Banking
  { id: 'hcpos-1', plan_id: 'hcp-1', org_id: 'org-1', department_id: 'dept-1', job_title: 'Senior Relationship Manager', level: 'Senior', type: 'new' as const, status: 'approved' as const, priority: 'high' as const, salary_min: 55000, salary_max: 75000, currency: 'USD', target_start_date: '2026-04-01', filled_by: null, filled_at: null, justification: 'Growing client portfolio requires additional senior coverage in West Africa region', approved_by: 'emp-1', created_at: '2025-12-01T00:00:00Z', updated_at: '2026-01-15T00:00:00Z' },
  { id: 'hcpos-2', plan_id: 'hcp-1', org_id: 'org-1', department_id: 'dept-1', job_title: 'Branch Operations Manager', level: 'Manager', type: 'backfill' as const, status: 'open' as const, priority: 'critical' as const, salary_min: 48000, salary_max: 65000, currency: 'USD', target_start_date: '2026-03-15', filled_by: null, filled_at: null, justification: 'Backfill for departing branch manager in Accra office', approved_by: 'emp-1', created_at: '2026-01-05T00:00:00Z', updated_at: '2026-02-01T00:00:00Z' },
  { id: 'hcpos-3', plan_id: 'hcp-1', org_id: 'org-1', department_id: 'dept-1', job_title: 'Customer Service Representative', level: 'Associate', type: 'new' as const, status: 'filled' as const, priority: 'medium' as const, salary_min: 22000, salary_max: 32000, currency: 'USD', target_start_date: '2026-02-01', filled_by: 'emp-4', filled_at: '2026-02-10T00:00:00Z', justification: 'New branch opening in Lagos requires front-desk staff', approved_by: 'emp-1', created_at: '2025-11-20T00:00:00Z', updated_at: '2026-02-10T00:00:00Z' },
  // Corporate Banking
  { id: 'hcpos-4', plan_id: 'hcp-1', org_id: 'org-1', department_id: 'dept-2', job_title: 'Senior Credit Analyst', level: 'Senior', type: 'new' as const, status: 'approved' as const, priority: 'high' as const, salary_min: 58000, salary_max: 80000, currency: 'USD', target_start_date: '2026-05-01', filled_by: null, filled_at: null, justification: 'Expanding corporate lending portfolio requires stronger credit analysis capability', approved_by: 'emp-5', created_at: '2025-12-10T00:00:00Z', updated_at: '2026-01-20T00:00:00Z' },
  { id: 'hcpos-5', plan_id: 'hcp-1', org_id: 'org-1', department_id: 'dept-2', job_title: 'Trade Finance Specialist', level: 'Mid', type: 'new' as const, status: 'planned' as const, priority: 'medium' as const, salary_min: 45000, salary_max: 62000, currency: 'USD', target_start_date: '2026-07-01', filled_by: null, filled_at: null, justification: 'New trade finance product line launching in Q3', approved_by: null, created_at: '2026-01-15T00:00:00Z', updated_at: '2026-01-15T00:00:00Z' },
  // Operations
  { id: 'hcpos-6', plan_id: 'hcp-1', org_id: 'org-1', department_id: 'dept-3', job_title: 'Process Automation Engineer', level: 'Senior', type: 'new' as const, status: 'open' as const, priority: 'high' as const, salary_min: 60000, salary_max: 85000, currency: 'USD', target_start_date: '2026-04-01', filled_by: null, filled_at: null, justification: 'Critical for digital transformation initiative to automate reconciliation processes', approved_by: 'emp-9', created_at: '2025-12-15T00:00:00Z', updated_at: '2026-02-01T00:00:00Z' },
  { id: 'hcpos-7', plan_id: 'hcp-1', org_id: 'org-1', department_id: 'dept-3', job_title: 'Quality Assurance Analyst', level: 'Mid', type: 'conversion' as const, status: 'filled' as const, priority: 'low' as const, salary_min: 35000, salary_max: 48000, currency: 'USD', target_start_date: '2026-01-15', filled_by: 'emp-12', filled_at: '2026-01-20T00:00:00Z', justification: 'Converting contractor to full-time position based on performance', approved_by: 'emp-9', created_at: '2025-11-25T00:00:00Z', updated_at: '2026-01-20T00:00:00Z' },
  // Technology
  { id: 'hcpos-8', plan_id: 'hcp-1', org_id: 'org-1', department_id: 'dept-4', job_title: 'Staff Software Engineer', level: 'Staff', type: 'new' as const, status: 'open' as const, priority: 'critical' as const, salary_min: 90000, salary_max: 130000, currency: 'USD', target_start_date: '2026-03-01', filled_by: null, filled_at: null, justification: 'Technical leadership for mobile banking platform rebuild', approved_by: 'emp-13', created_at: '2025-11-20T00:00:00Z', updated_at: '2026-02-15T00:00:00Z' },
  { id: 'hcpos-9', plan_id: 'hcp-1', org_id: 'org-1', department_id: 'dept-4', job_title: 'Cloud Infrastructure Engineer', level: 'Senior', type: 'new' as const, status: 'approved' as const, priority: 'high' as const, salary_min: 70000, salary_max: 100000, currency: 'USD', target_start_date: '2026-05-01', filled_by: null, filled_at: null, justification: 'Cloud migration project requires dedicated infrastructure expertise', approved_by: 'emp-13', created_at: '2025-12-20T00:00:00Z', updated_at: '2026-01-25T00:00:00Z' },
  { id: 'hcpos-10', plan_id: 'hcp-1', org_id: 'org-1', department_id: 'dept-4', job_title: 'Mobile Developer', level: 'Mid', type: 'new' as const, status: 'planned' as const, priority: 'medium' as const, salary_min: 50000, salary_max: 70000, currency: 'USD', target_start_date: '2026-06-01', filled_by: null, filled_at: null, justification: 'Expanding mobile team for new banking app features', approved_by: null, created_at: '2026-01-10T00:00:00Z', updated_at: '2026-01-10T00:00:00Z' },
  { id: 'hcpos-11', plan_id: 'hcp-1', org_id: 'org-1', department_id: 'dept-4', job_title: 'Data Analyst', level: 'Junior', type: 'new' as const, status: 'filled' as const, priority: 'medium' as const, salary_min: 35000, salary_max: 50000, currency: 'USD', target_start_date: '2026-02-01', filled_by: 'emp-16', filled_at: '2026-02-05T00:00:00Z', justification: 'Business intelligence team growth to support reporting needs', approved_by: 'emp-13', created_at: '2025-11-18T00:00:00Z', updated_at: '2026-02-05T00:00:00Z' },
  // Human Resources
  { id: 'hcpos-12', plan_id: 'hcp-1', org_id: 'org-1', department_id: 'dept-5', job_title: 'Compensation & Benefits Analyst', level: 'Mid', type: 'new' as const, status: 'approved' as const, priority: 'medium' as const, salary_min: 42000, salary_max: 58000, currency: 'USD', target_start_date: '2026-06-01', filled_by: null, filled_at: null, justification: 'Dedicated comp analyst needed as headcount grows across Africa', approved_by: 'emp-17', created_at: '2026-01-08T00:00:00Z', updated_at: '2026-02-01T00:00:00Z' },
  // Risk & Compliance
  { id: 'hcpos-13', plan_id: 'hcp-1', org_id: 'org-1', department_id: 'dept-6', job_title: 'AML Compliance Officer', level: 'Senior', type: 'new' as const, status: 'open' as const, priority: 'critical' as const, salary_min: 65000, salary_max: 90000, currency: 'USD', target_start_date: '2026-03-15', filled_by: null, filled_at: null, justification: 'Regulatory requirement for dedicated AML officer in Kenya operations', approved_by: 'emp-21', created_at: '2025-12-05T00:00:00Z', updated_at: '2026-02-10T00:00:00Z' },
  { id: 'hcpos-14', plan_id: 'hcp-1', org_id: 'org-1', department_id: 'dept-6', job_title: 'Cybersecurity Analyst', level: 'Mid', type: 'new' as const, status: 'planned' as const, priority: 'high' as const, salary_min: 52000, salary_max: 72000, currency: 'USD', target_start_date: '2026-08-01', filled_by: null, filled_at: null, justification: 'Strengthening cybersecurity posture per board mandate', approved_by: null, created_at: '2026-02-01T00:00:00Z', updated_at: '2026-02-01T00:00:00Z' },
  // Finance
  { id: 'hcpos-15', plan_id: 'hcp-1', org_id: 'org-1', department_id: 'dept-7', job_title: 'Financial Planning Manager', level: 'Manager', type: 'backfill' as const, status: 'approved' as const, priority: 'high' as const, salary_min: 60000, salary_max: 82000, currency: 'USD', target_start_date: '2026-04-15', filled_by: null, filled_at: null, justification: 'Replacing outgoing FP&A manager; critical for annual planning cycle', approved_by: 'emp-24', created_at: '2026-01-20T00:00:00Z', updated_at: '2026-02-05T00:00:00Z' },
  // Marketing
  { id: 'hcpos-16', plan_id: 'hcp-1', org_id: 'org-1', department_id: 'dept-8', job_title: 'Growth Marketing Manager', level: 'Manager', type: 'new' as const, status: 'planned' as const, priority: 'medium' as const, salary_min: 50000, salary_max: 68000, currency: 'USD', target_start_date: '2026-07-01', filled_by: null, filled_at: null, justification: 'New digital acquisition strategy requires dedicated growth lead', approved_by: null, created_at: '2026-02-10T00:00:00Z', updated_at: '2026-02-10T00:00:00Z' },
  { id: 'hcpos-17', plan_id: 'hcp-1', org_id: 'org-1', department_id: 'dept-8', job_title: 'Social Media Coordinator', level: 'Junior', type: 'new' as const, status: 'cancelled' as const, priority: 'low' as const, salary_min: 25000, salary_max: 35000, currency: 'USD', target_start_date: '2026-05-01', filled_by: null, filled_at: null, justification: 'Budget reallocated to Growth Marketing Manager role', approved_by: null, created_at: '2025-12-01T00:00:00Z', updated_at: '2026-02-10T00:00:00Z' },
  // FY2025 closed plan positions
  { id: 'hcpos-18', plan_id: 'hcp-2', org_id: 'org-1', department_id: 'dept-4', job_title: 'Frontend Developer', level: 'Mid', type: 'new' as const, status: 'filled' as const, priority: 'high' as const, salary_min: 50000, salary_max: 70000, currency: 'USD', target_start_date: '2025-06-01', filled_by: 'emp-16', filled_at: '2025-06-15T00:00:00Z', justification: 'UX redesign project staffing', approved_by: 'emp-13', created_at: '2025-03-01T00:00:00Z', updated_at: '2025-06-15T00:00:00Z' },
  { id: 'hcpos-19', plan_id: 'hcp-2', org_id: 'org-1', department_id: 'dept-1', job_title: 'Teller', level: 'Associate', type: 'backfill' as const, status: 'filled' as const, priority: 'medium' as const, salary_min: 18000, salary_max: 28000, currency: 'USD', target_start_date: '2025-04-01', filled_by: 'emp-4', filled_at: '2025-04-10T00:00:00Z', justification: 'Backfill for Lagos branch', approved_by: 'emp-1', created_at: '2025-02-01T00:00:00Z', updated_at: '2025-04-10T00:00:00Z' },
]

// === From agent-ae5f43e4 ===
export const demoAutomationWorkflowRunSteps = [
  // Run awr-1 (Onboarding - completed)
  { id: 'awrs-1', runId: 'awr-1', stepId: 'aws-1', status: 'completed' as const, input: { to: 'a.diop@ecobank.com' }, output: { sent: true }, startedAt: '2026-02-10T09:00:00Z', completedAt: '2026-02-10T09:01:00Z' },
  { id: 'awrs-2', runId: 'awr-1', stepId: 'aws-2', status: 'completed' as const, input: { apps: ['Slack', 'Gmail', 'JIRA', 'Confluence'] }, output: { assigned: 4 }, startedAt: '2026-02-10T09:01:00Z', completedAt: '2026-02-10T09:03:00Z' },
  { id: 'awrs-3', runId: 'awr-1', stepId: 'aws-3', status: 'completed' as const, input: { deviceType: 'laptop' }, output: { deviceId: 'dev-50', model: 'MacBook Pro 14"' }, startedAt: '2026-02-10T09:03:00Z', completedAt: '2026-02-10T09:05:00Z' },
  { id: 'awrs-4', runId: 'awr-1', stepId: 'aws-4', status: 'completed' as const, input: { duration: '1 day' }, output: { waited: true }, startedAt: '2026-02-10T09:05:00Z', completedAt: '2026-02-11T09:05:00Z' },
  { id: 'awrs-5', runId: 'awr-1', stepId: 'aws-5', status: 'completed' as const, input: { reviewType: 'probation' }, output: { reviewId: 'rev-new-1' }, startedAt: '2026-02-10T09:07:00Z', completedAt: '2026-02-10T09:08:00Z' },
  { id: 'awrs-6', runId: 'awr-1', stepId: 'aws-6', status: 'completed' as const, input: { managerId: 'emp-27' }, output: { notified: true }, startedAt: '2026-02-10T09:08:00Z', completedAt: '2026-02-10T09:09:00Z' },
  { id: 'awrs-7', runId: 'awr-1', stepId: 'aws-7', status: 'completed' as const, input: { courses: 3 }, output: { enrolled: 3 }, startedAt: '2026-02-10T09:09:00Z', completedAt: '2026-02-10T09:15:00Z' },

  // Run awr-6 (Onboarding - running)
  { id: 'awrs-8', runId: 'awr-6', stepId: 'aws-1', status: 'completed' as const, input: { to: 'a.traore@ecobank.com' }, output: { sent: true }, startedAt: '2026-02-25T08:00:00Z', completedAt: '2026-02-25T08:01:00Z' },
  { id: 'awrs-9', runId: 'awr-6', stepId: 'aws-2', status: 'completed' as const, input: { apps: ['Slack', 'Gmail', 'JIRA'] }, output: { assigned: 3 }, startedAt: '2026-02-25T08:01:00Z', completedAt: '2026-02-25T08:03:00Z' },
  { id: 'awrs-10', runId: 'awr-6', stepId: 'aws-3', status: 'running' as const, input: { deviceType: 'laptop' }, output: null, startedAt: '2026-02-25T08:03:00Z', completedAt: null },
  { id: 'awrs-11', runId: 'awr-6', stepId: 'aws-4', status: 'pending' as const, input: null, output: null, startedAt: null, completedAt: null },
  { id: 'awrs-12', runId: 'awr-6', stepId: 'aws-5', status: 'pending' as const, input: null, output: null, startedAt: null, completedAt: null },
  { id: 'awrs-13', runId: 'awr-6', stepId: 'aws-6', status: 'pending' as const, input: null, output: null, startedAt: null, completedAt: null },
  { id: 'awrs-14', runId: 'awr-6', stepId: 'aws-7', status: 'pending' as const, input: null, output: null, startedAt: null, completedAt: null },

  // Run awr-8 (Expense routing - failed)
  { id: 'awrs-15', runId: 'awr-8', stepId: 'aws-24', status: 'completed' as const, input: { amount: 8500 }, output: { result: true, branch: 'true' }, startedAt: '2026-02-20T15:00:00Z', completedAt: '2026-02-20T15:01:00Z' },
  { id: 'awrs-16', runId: 'awr-8', stepId: 'aws-25', status: 'failed' as const, input: { approver: 'CFO' }, output: { error: 'Approval chain not configured for Marketing department' }, startedAt: '2026-02-20T15:01:00Z', completedAt: '2026-02-20T15:02:00Z' },

  // Run awr-5 (Post-Review - completed with PIP path)
  { id: 'awrs-17', runId: 'awr-5', stepId: 'aws-20', status: 'completed' as const, input: { rating: 2.5 }, output: { result: true, branch: 'true' }, startedAt: '2026-02-18T09:00:00Z', completedAt: '2026-02-18T09:01:00Z' },
  { id: 'awrs-18', runId: 'awr-5', stepId: 'aws-21', status: 'completed' as const, input: { employee: 'Chioma Eze' }, output: { taskId: 'task-pip-1' }, startedAt: '2026-02-18T09:01:00Z', completedAt: '2026-02-18T09:05:00Z' },
]

// === From agent-ae5f43e4 ===
export const demoAutomationWorkflowRuns = [
  { id: 'awr-1', workflowId: 'awf-1', orgId: 'org-1', triggeredBy: 'system', triggerData: { employee_id: 'emp-30', employee_name: 'Aminata Diop', department: 'Marketing' }, status: 'completed' as const, startedAt: '2026-02-10T09:00:00Z', completedAt: '2026-02-10T09:15:00Z', error: null },
  { id: 'awr-2', workflowId: 'awf-1', orgId: 'org-1', triggeredBy: 'system', triggerData: { employee_id: 'emp-29', employee_name: 'Tunde Bakare', department: 'Marketing' }, status: 'completed' as const, startedAt: '2026-02-08T10:00:00Z', completedAt: '2026-02-08T10:12:00Z', error: null },
  { id: 'awr-3', workflowId: 'awf-2', orgId: 'org-1', triggeredBy: 'system', triggerData: { employee_id: 'emp-99', employee_name: 'John Doe', department: 'Operations' }, status: 'completed' as const, startedAt: '2026-02-12T14:00:00Z', completedAt: '2026-02-12T14:08:00Z', error: null },
  { id: 'awr-4', workflowId: 'awf-4', orgId: 'org-1', triggeredBy: 'system', triggerData: { employee_name: 'Kwame Asante', leave_type: 'annual', start_date: '2026-03-01', end_date: '2026-03-07' }, status: 'completed' as const, startedAt: '2026-02-15T11:00:00Z', completedAt: '2026-02-15T11:03:00Z', error: null },
  { id: 'awr-5', workflowId: 'awf-5', orgId: 'org-1', triggeredBy: 'system', triggerData: { employee_name: 'Chioma Eze', review_rating: 2.5, review_cycle: 'H1 2026' }, status: 'completed' as const, startedAt: '2026-02-18T09:00:00Z', completedAt: '2026-02-18T09:05:00Z', error: null },
  { id: 'awr-6', workflowId: 'awf-1', orgId: 'org-1', triggeredBy: 'system', triggerData: { employee_id: 'emp-31', employee_name: 'Adama Traore', department: 'Technology' }, status: 'running' as const, startedAt: '2026-02-25T08:00:00Z', completedAt: null, error: null },
  { id: 'awr-7', workflowId: 'awf-3', orgId: 'org-1', triggeredBy: 'system', triggerData: { employee_name: 'Fatou Ndiaye', old_role: 'Senior Analyst', new_role: 'Lead Analyst' }, status: 'running' as const, startedAt: '2026-02-26T10:00:00Z', completedAt: null, error: null },
  { id: 'awr-8', workflowId: 'awf-6', orgId: 'org-1', triggeredBy: 'system', triggerData: { employee_name: 'Peter Njoroge', expense_amount: 8500 }, status: 'failed' as const, startedAt: '2026-02-20T15:00:00Z', completedAt: '2026-02-20T15:02:00Z', error: 'Approval chain not configured for Marketing department' },
  { id: 'awr-9', workflowId: 'awf-4', orgId: 'org-1', triggeredBy: 'system', triggerData: { employee_name: 'Ngozi Okafor', leave_type: 'sick', start_date: '2026-02-22', end_date: '2026-02-23' }, status: 'completed' as const, startedAt: '2026-02-21T09:00:00Z', completedAt: '2026-02-21T09:04:00Z', error: null },
]

// === From agent-ae5f43e4 ===
export const demoAutomationWorkflowSteps = [
  // New Hire Onboarding (awf-1): 7 steps
  { id: 'aws-1', workflowId: 'awf-1', orderIndex: 0, type: 'action' as const, config: { actionType: 'send_email', to: '{{employee.email}}', subject: 'Welcome to Ecobank!', body: 'Dear {{employee.name}}, welcome aboard! We are excited to have you join our team.' }, nextStepOnTrue: null, nextStepOnFalse: null },
  { id: 'aws-2', workflowId: 'awf-1', orderIndex: 1, type: 'action' as const, config: { actionType: 'assign_app', apps: ['Slack', 'Gmail', 'JIRA', 'Confluence'] }, nextStepOnTrue: null, nextStepOnFalse: null },
  { id: 'aws-3', workflowId: 'awf-1', orderIndex: 2, type: 'action' as const, config: { actionType: 'assign_device', deviceType: 'laptop', specs: 'Standard workstation' }, nextStepOnTrue: null, nextStepOnFalse: null },
  { id: 'aws-4', workflowId: 'awf-1', orderIndex: 3, type: 'delay' as const, config: { duration: 1, unit: 'days' }, nextStepOnTrue: null, nextStepOnFalse: null },
  { id: 'aws-5', workflowId: 'awf-1', orderIndex: 4, type: 'action' as const, config: { actionType: 'create_review', reviewType: 'probation', dueInDays: 90 }, nextStepOnTrue: null, nextStepOnFalse: null },
  { id: 'aws-6', workflowId: 'awf-1', orderIndex: 5, type: 'action' as const, config: { actionType: 'notify_manager', message: 'New team member {{employee.name}} has joined your department.' }, nextStepOnTrue: null, nextStepOnFalse: null },
  { id: 'aws-7', workflowId: 'awf-1', orderIndex: 6, type: 'action' as const, config: { actionType: 'enroll_course', courses: ['Compliance 101', 'Security Awareness', 'Company Culture'] }, nextStepOnTrue: null, nextStepOnFalse: null },

  // Offboarding (awf-2): 5 steps
  { id: 'aws-8', workflowId: 'awf-2', orderIndex: 0, type: 'action' as const, config: { actionType: 'revoke_app', apps: ['all'] }, nextStepOnTrue: null, nextStepOnFalse: null },
  { id: 'aws-9', workflowId: 'awf-2', orderIndex: 1, type: 'action' as const, config: { actionType: 'create_task', title: 'Schedule device return', assignTo: 'IT Manager' }, nextStepOnTrue: null, nextStepOnFalse: null },
  { id: 'aws-10', workflowId: 'awf-2', orderIndex: 2, type: 'action' as const, config: { actionType: 'schedule_meeting', title: 'Exit Interview', with: 'HR Manager', dueInDays: 5 }, nextStepOnTrue: null, nextStepOnFalse: null },
  { id: 'aws-11', workflowId: 'awf-2', orderIndex: 3, type: 'delay' as const, config: { duration: 2, unit: 'days' }, nextStepOnTrue: null, nextStepOnFalse: null },
  { id: 'aws-12', workflowId: 'awf-2', orderIndex: 4, type: 'action' as const, config: { actionType: 'create_task', title: 'Process final paycheck', assignTo: 'Payroll Manager' }, nextStepOnTrue: null, nextStepOnFalse: null },

  // Promotion (awf-3): 4 steps
  { id: 'aws-13', workflowId: 'awf-3', orderIndex: 0, type: 'action' as const, config: { actionType: 'update_field', field: 'comp_band', value: '{{new_role.comp_band}}' }, nextStepOnTrue: null, nextStepOnFalse: null },
  { id: 'aws-14', workflowId: 'awf-3', orderIndex: 1, type: 'action' as const, config: { actionType: 'send_email', to: '{{employee.email}}', subject: 'Congratulations on your promotion!', body: 'Dear {{employee.name}}, congratulations on your new role as {{new_role.title}}!' }, nextStepOnTrue: null, nextStepOnFalse: null },
  { id: 'aws-15', workflowId: 'awf-3', orderIndex: 2, type: 'action' as const, config: { actionType: 'send_slack', channel: '#team-updates', message: 'Please congratulate {{employee.name}} on their promotion to {{new_role.title}}!' }, nextStepOnTrue: null, nextStepOnFalse: null },
  { id: 'aws-16', workflowId: 'awf-3', orderIndex: 3, type: 'action' as const, config: { actionType: 'assign_app', apps: ['{{new_role.required_apps}}'] }, nextStepOnTrue: null, nextStepOnFalse: null },

  // Leave Approved (awf-4): 3 steps
  { id: 'aws-17', workflowId: 'awf-4', orderIndex: 0, type: 'action' as const, config: { actionType: 'send_slack', channel: '#{{department.slug}}', message: '{{employee.name}} will be on leave from {{leave.start_date}} to {{leave.end_date}}.' }, nextStepOnTrue: null, nextStepOnFalse: null },
  { id: 'aws-18', workflowId: 'awf-4', orderIndex: 1, type: 'action' as const, config: { actionType: 'update_field', field: 'shared_calendar', value: 'OOO: {{employee.name}}' }, nextStepOnTrue: null, nextStepOnFalse: null },
  { id: 'aws-19', workflowId: 'awf-4', orderIndex: 2, type: 'action' as const, config: { actionType: 'notify_manager', message: 'Please assign a backup for {{employee.name}} during their leave period.' }, nextStepOnTrue: null, nextStepOnFalse: null },

  // Post-Review Actions (awf-5): 4 steps with conditions
  { id: 'aws-20', workflowId: 'awf-5', orderIndex: 0, type: 'condition' as const, config: { field: 'review.overall_rating', operator: 'less_than', value: 3, label: 'Rating < 3?' }, nextStepOnTrue: 'aws-21', nextStepOnFalse: 'aws-22' },
  { id: 'aws-21', workflowId: 'awf-5', orderIndex: 1, type: 'action' as const, config: { actionType: 'create_task', title: 'Create Performance Improvement Plan for {{employee.name}}', assignTo: '{{employee.manager}}' }, nextStepOnTrue: null, nextStepOnFalse: null },
  { id: 'aws-22', workflowId: 'awf-5', orderIndex: 2, type: 'condition' as const, config: { field: 'review.overall_rating', operator: 'greater_than', value: 4, label: 'Rating > 4?' }, nextStepOnTrue: 'aws-23', nextStepOnFalse: null },
  { id: 'aws-23', workflowId: 'awf-5', orderIndex: 3, type: 'action' as const, config: { actionType: 'schedule_meeting', title: 'Merit Review Discussion', with: '{{employee.manager}}', dueInDays: 14 }, nextStepOnTrue: null, nextStepOnFalse: null },

  // Expense Auto-Routing (awf-6): 4 steps with approval
  { id: 'aws-24', workflowId: 'awf-6', orderIndex: 0, type: 'condition' as const, config: { field: 'expense.amount', operator: 'greater_than', value: 5000, label: 'Amount > $5,000?' }, nextStepOnTrue: 'aws-25', nextStepOnFalse: 'aws-26' },
  { id: 'aws-25', workflowId: 'awf-6', orderIndex: 1, type: 'approval' as const, config: { approver: 'CFO', message: 'High-value expense report requires CFO approval: ${{expense.amount}}' }, nextStepOnTrue: null, nextStepOnFalse: null },
  { id: 'aws-26', workflowId: 'awf-6', orderIndex: 2, type: 'approval' as const, config: { approver: '{{employee.manager}}', message: 'Expense report pending your approval: ${{expense.amount}}' }, nextStepOnTrue: null, nextStepOnFalse: null },
  { id: 'aws-27', workflowId: 'awf-6', orderIndex: 3, type: 'action' as const, config: { actionType: 'send_email', to: '{{employee.email}}', subject: 'Expense Report Approved', body: 'Your expense report for ${{expense.amount}} has been approved.' }, nextStepOnTrue: null, nextStepOnFalse: null },

  // Department Transfer (awf-7): 4 steps
  { id: 'aws-28', workflowId: 'awf-7', orderIndex: 0, type: 'action' as const, config: { actionType: 'update_field', field: 'access_groups', value: '{{new_department.access_groups}}' }, nextStepOnTrue: null, nextStepOnFalse: null },
  { id: 'aws-29', workflowId: 'awf-7', orderIndex: 1, type: 'action' as const, config: { actionType: 'notify_manager', message: '{{employee.name}} has transferred to your department from {{old_department.name}}.' }, nextStepOnTrue: null, nextStepOnFalse: null },
  { id: 'aws-30', workflowId: 'awf-7', orderIndex: 2, type: 'action' as const, config: { actionType: 'add_to_group', group: '{{new_department.slack_channel}}' }, nextStepOnTrue: null, nextStepOnFalse: null },
  { id: 'aws-31', workflowId: 'awf-7', orderIndex: 3, type: 'action' as const, config: { actionType: 'send_email', to: '{{employee.email}}', subject: 'Welcome to {{new_department.name}}', body: 'Your transfer has been processed. Your new manager is {{new_manager.name}}.' }, nextStepOnTrue: null, nextStepOnFalse: null },

  // Payroll Completion (awf-8): 3 steps
  { id: 'aws-32', workflowId: 'awf-8', orderIndex: 0, type: 'action' as const, config: { actionType: 'create_task', title: 'Generate pay stubs for all employees', assignTo: 'Payroll Team' }, nextStepOnTrue: null, nextStepOnFalse: null },
  { id: 'aws-33', workflowId: 'awf-8', orderIndex: 1, type: 'action' as const, config: { actionType: 'send_email', to: 'all_employees', subject: 'Payroll Processed', body: 'Your salary for this period has been processed. Please check your pay stub.' }, nextStepOnTrue: null, nextStepOnFalse: null },
  { id: 'aws-34', workflowId: 'awf-8', orderIndex: 2, type: 'action' as const, config: { actionType: 'notify_manager', message: 'Payroll for your team has been completed for this period.' }, nextStepOnTrue: null, nextStepOnFalse: null },
]

// === From agent-ae5f43e4 ===
export const demoAutomationWorkflowTemplates = [
  { id: 'awt-1', name: 'Standard Onboarding', description: 'Complete new hire onboarding with IT setup, app provisioning, training enrollment, and manager notification.', category: 'onboarding' as const, trigger: 'employee_hired' as const, stepCount: 7, estimatedDuration: '1 day', popularity: 95 },
  { id: 'awt-2', name: 'Full Offboarding', description: 'Comprehensive offboarding: revoke access, return devices, schedule exit interview, process final pay.', category: 'offboarding' as const, trigger: 'employee_terminated' as const, stepCount: 5, estimatedDuration: '3 days', popularity: 88 },
  { id: 'awt-3', name: 'Promotion Package', description: 'Automated promotion workflow: update compensation, send congratulations, update access.', category: 'performance' as const, trigger: 'role_changed' as const, stepCount: 4, estimatedDuration: 'Instant', popularity: 72 },
  { id: 'awt-4', name: 'Leave Management', description: 'Notify team, update calendar, and assign backup when leave is approved.', category: 'it' as const, trigger: 'leave_approved' as const, stepCount: 3, estimatedDuration: 'Instant', popularity: 80 },
  { id: 'awt-5', name: 'Performance Review Follow-up', description: 'Conditional actions after review: PIP for low ratings, merit review for high performers.', category: 'performance' as const, trigger: 'review_completed' as const, stepCount: 4, estimatedDuration: '1 day', popularity: 65 },
  { id: 'awt-6', name: 'Expense Approval Chain', description: 'Route expenses to the right approver based on amount thresholds with CFO escalation.', category: 'finance' as const, trigger: 'expense_submitted' as const, stepCount: 4, estimatedDuration: '2 days', popularity: 55 },
  { id: 'awt-7', name: 'Department Transfer', description: 'Automate access changes, notifications, and org chart updates for department transfers.', category: 'it' as const, trigger: 'department_changed' as const, stepCount: 4, estimatedDuration: 'Instant', popularity: 60 },
  { id: 'awt-8', name: 'Payroll Notifications', description: 'Generate pay stubs, notify employees and managers after payroll completes.', category: 'finance' as const, trigger: 'payroll_completed' as const, stepCount: 3, estimatedDuration: 'Instant', popularity: 45 },
]

// === From agent-ae5f43e4 ===
// ============================================================
// WORKFLOW AUTOMATION ENGINE
// ============================================================

export const demoAutomationWorkflows = [
  { id: 'awf-1', org_id: 'org-1', name: 'New Hire Onboarding', description: 'Complete onboarding automation: send welcome email, assign apps, assign device, create review cycle, notify manager, enroll compliance training.', trigger: 'employee_hired' as const, triggerConfig: { departments: 'all' }, isActive: true, createdBy: 'emp-17', createdAt: '2025-10-15T08:00:00Z', updatedAt: '2026-02-10T10:00:00Z' },
  { id: 'awf-2', org_id: 'org-1', name: 'Offboarding', description: 'Automated offboarding: revoke apps, schedule device return, schedule exit interview, process final pay.', trigger: 'employee_terminated' as const, triggerConfig: {}, isActive: true, createdBy: 'emp-17', createdAt: '2025-11-01T08:00:00Z', updatedAt: '2026-01-20T14:00:00Z' },
  { id: 'awf-3', org_id: 'org-1', name: 'Promotion Workflow', description: 'When role changes: update comp band, send notification to team, update access permissions.', trigger: 'role_changed' as const, triggerConfig: { direction: 'promotion' }, isActive: true, createdBy: 'emp-20', createdAt: '2025-12-01T08:00:00Z', updatedAt: '2026-02-05T09:00:00Z' },
  { id: 'awf-4', org_id: 'org-1', name: 'Leave Approved Notification', description: 'When leave is approved: notify the team, update shared calendar, assign backup person.', trigger: 'leave_approved' as const, triggerConfig: {}, isActive: true, createdBy: 'emp-20', createdAt: '2026-01-05T08:00:00Z', updatedAt: '2026-02-12T11:00:00Z' },
  { id: 'awf-5', org_id: 'org-1', name: 'Post-Review Actions', description: 'After review completed: if rating < 3 create PIP, if rating > 4 schedule merit review.', trigger: 'review_completed' as const, triggerConfig: {}, isActive: true, createdBy: 'emp-17', createdAt: '2026-01-10T08:00:00Z', updatedAt: '2026-02-15T09:00:00Z' },
  { id: 'awf-6', org_id: 'org-1', name: 'Expense Auto-Routing', description: 'Route submitted expenses to the appropriate approver based on amount and department.', trigger: 'expense_submitted' as const, triggerConfig: { threshold: 500 }, isActive: false, createdBy: 'emp-24', createdAt: '2026-02-01T08:00:00Z', updatedAt: '2026-02-18T11:00:00Z' },
  { id: 'awf-7', org_id: 'org-1', name: 'Department Transfer', description: 'Automate access changes, notify new manager, update org chart when department changes.', trigger: 'department_changed' as const, triggerConfig: {}, isActive: true, createdBy: 'emp-17', createdAt: '2026-02-05T08:00:00Z', updatedAt: '2026-02-20T09:00:00Z' },
  { id: 'awf-8', org_id: 'org-1', name: 'Payroll Completion Tasks', description: 'After payroll completes: generate pay stubs, send notifications, update finance records.', trigger: 'payroll_completed' as const, triggerConfig: {}, isActive: false, createdBy: 'emp-24', createdAt: '2026-02-10T08:00:00Z', updatedAt: '2026-02-22T09:00:00Z' },
]

// === From agent-aeae028c ===
// Recruiting - Background Checks
export const demoBackgroundChecks = [
  { id: 'bgc-1', org_id: 'org-1', application_id: 'app-2', candidate_name: 'Priscilla Addo', candidate_email: 'p.addo@outlook.com', type: 'criminal' as const, provider: 'checkr' as const, status: 'completed' as const, result: 'clear' as const, report_url: 'https://checkr.com/reports/abc123', requested_by: 'emp-18', requested_at: '2026-02-10T00:00:00Z', completed_at: '2026-02-15T00:00:00Z', notes: 'No records found. Clear to proceed.' },
  { id: 'bgc-2', org_id: 'org-1', application_id: 'app-2', candidate_name: 'Priscilla Addo', candidate_email: 'p.addo@outlook.com', type: 'employment' as const, provider: 'checkr' as const, status: 'completed' as const, result: 'clear' as const, report_url: 'https://checkr.com/reports/abc124', requested_by: 'emp-18', requested_at: '2026-02-10T00:00:00Z', completed_at: '2026-02-17T00:00:00Z', notes: 'Verified 8 years at Flutterwave. All details confirmed.' },
  { id: 'bgc-3', org_id: 'org-1', application_id: 'app-1', candidate_name: 'David Okonkwo', candidate_email: 'david.o@gmail.com', type: 'education' as const, provider: 'goodhire' as const, status: 'in_progress' as const, result: null, report_url: null, requested_by: 'emp-18', requested_at: '2026-02-20T00:00:00Z', completed_at: null, notes: 'Verifying MSc Computer Science from University of Lagos' },
  { id: 'bgc-4', org_id: 'org-1', application_id: 'app-4', candidate_name: 'Efua Owusu', candidate_email: 'efua.owusu@gmail.com', type: 'credit' as const, provider: 'checkr' as const, status: 'flagged' as const, result: 'review_needed' as const, report_url: 'https://checkr.com/reports/def456', requested_by: 'emp-18', requested_at: '2026-02-18T00:00:00Z', completed_at: '2026-02-24T00:00:00Z', notes: 'Minor credit inquiry discrepancy. Needs HR review before proceeding.' },
  { id: 'bgc-5', org_id: 'org-1', application_id: 'app-5', candidate_name: 'Aisha Ndungu', candidate_email: 'aisha.n@gmail.com', type: 'identity' as const, provider: 'internal' as const, status: 'pending' as const, result: null, report_url: null, requested_by: 'emp-17', requested_at: '2026-02-25T00:00:00Z', completed_at: null, notes: 'Awaiting candidate document submission' },
]

// === From agent-aeae028c ===
// Recruiting - Candidate Scheduling
export const demoCandidateScheduling = [
  { id: 'cs-1', org_id: 'org-1', application_id: 'app-5', interview_type: 'Phone Screen', available_slots: [
    { date: '2026-03-03', startTime: '09:00', endTime: '09:30' },
    { date: '2026-03-03', startTime: '14:00', endTime: '14:30' },
    { date: '2026-03-04', startTime: '10:00', endTime: '10:30' },
    { date: '2026-03-05', startTime: '11:00', endTime: '11:30' },
  ], selected_slot: { date: '2026-03-03', startTime: '14:00', endTime: '14:30' }, interviewer_ids: ['emp-15'], meeting_url: 'https://meet.google.com/abc-defg-hij', status: 'confirmed' as const, expires_at: '2026-03-01T23:59:59Z', created_at: '2026-02-25T00:00:00Z' },
  { id: 'cs-2', org_id: 'org-1', application_id: 'app-3', interview_type: 'Technical Interview', available_slots: [
    { date: '2026-03-05', startTime: '09:00', endTime: '10:00' },
    { date: '2026-03-05', startTime: '14:00', endTime: '15:00' },
    { date: '2026-03-06', startTime: '10:00', endTime: '11:00' },
    { date: '2026-03-07', startTime: '09:00', endTime: '10:00' },
    { date: '2026-03-07', startTime: '15:00', endTime: '16:00' },
  ], selected_slot: null, interviewer_ids: ['emp-13', 'emp-14'], meeting_url: null, status: 'slots_offered' as const, expires_at: '2026-03-04T23:59:59Z', created_at: '2026-02-26T00:00:00Z' },
  { id: 'cs-3', org_id: 'org-1', application_id: 'app-4', interview_type: 'Culture & Values', available_slots: [
    { date: '2026-03-04', startTime: '11:00', endTime: '11:45' },
    { date: '2026-03-04', startTime: '15:00', endTime: '15:45' },
    { date: '2026-03-06', startTime: '10:00', endTime: '10:45' },
  ], selected_slot: { date: '2026-03-04', startTime: '15:00', endTime: '15:45' }, interviewer_ids: ['emp-2'], meeting_url: 'https://meet.google.com/xyz-uvwx-yz', status: 'candidate_selected' as const, expires_at: '2026-03-03T23:59:59Z', created_at: '2026-02-24T00:00:00Z' },
]

// === From agent-aeae028c ===
// Recruiting - Knockout Questions
export const demoKnockoutQuestions = [
  // Senior Software Engineer (job-1)
  { id: 'kq-1', job_id: 'job-1', org_id: 'org-1', question: 'Do you have at least 5 years of professional software development experience?', type: 'yes_no' as const, options: null, correct_answer: 'yes', is_required: true, order_index: 0, eliminate_on_wrong: true },
  { id: 'kq-2', job_id: 'job-1', org_id: 'org-1', question: 'Which programming languages are you proficient in?', type: 'multiple_choice' as const, options: ['JavaScript/TypeScript', 'Python', 'Java', 'Go', 'Rust', 'Other'], correct_answer: 'JavaScript/TypeScript', is_required: true, order_index: 1, eliminate_on_wrong: false },
  { id: 'kq-3', job_id: 'job-1', org_id: 'org-1', question: 'How many years of experience do you have with React?', type: 'numeric' as const, options: null, correct_answer: '3', is_required: true, order_index: 2, eliminate_on_wrong: true },
  { id: 'kq-4', job_id: 'job-1', org_id: 'org-1', question: 'Are you authorized to work in Nigeria, Ghana, or Kenya without sponsorship?', type: 'yes_no' as const, options: null, correct_answer: 'yes', is_required: true, order_index: 3, eliminate_on_wrong: true },
  // Branch Manager (job-2)
  { id: 'kq-5', job_id: 'job-2', org_id: 'org-1', question: 'Do you have at least 7 years of banking industry experience?', type: 'yes_no' as const, options: null, correct_answer: 'yes', is_required: true, order_index: 0, eliminate_on_wrong: true },
  { id: 'kq-6', job_id: 'job-2', org_id: 'org-1', question: 'Have you managed a team of 10+ people?', type: 'yes_no' as const, options: null, correct_answer: 'yes', is_required: true, order_index: 1, eliminate_on_wrong: true },
  { id: 'kq-7', job_id: 'job-2', org_id: 'org-1', question: 'What is your preferred work location?', type: 'multiple_choice' as const, options: ['Accra', 'Lagos', 'Nairobi', 'Abidjan', 'Dakar', 'Other'], correct_answer: 'Accra', is_required: false, order_index: 2, eliminate_on_wrong: false },
  { id: 'kq-8', job_id: 'job-2', org_id: 'org-1', question: 'Are you willing to relocate to Accra, Ghana?', type: 'yes_no' as const, options: null, correct_answer: 'yes', is_required: true, order_index: 3, eliminate_on_wrong: true },
]

// === From agent-aeae028c ===
// Recruiting - Referral Program
export const demoReferralProgram = {
  id: 'rp-1', org_id: 'org-1', name: 'Ecobank Employee Referral Program', is_active: true, bonus_amount: 2000, currency: 'USD', bonus_trigger: '90_day_retention' as const, description: 'Earn $2,000 for every successful referral who stays for 90 days. Referrals are key to building our best teams.', created_at: '2025-06-01T00:00:00Z',
}

// === From agent-aeae028c ===
// Recruiting - Referrals
export const demoReferrals = [
  { id: 'ref-1', org_id: 'org-1', referrer_id: 'emp-14', candidate_name: 'Kweku Mensah', candidate_email: 'kweku.m@outlook.com', job_id: 'job-1', status: 'bonus_paid' as const, bonus_amount: 2000, bonus_paid_at: '2026-01-15T00:00:00Z', submitted_at: '2025-08-10T00:00:00Z', notes: 'Former MTN colleague. Exceptional engineering manager.' },
  { id: 'ref-2', org_id: 'org-1', referrer_id: 'emp-2', candidate_name: 'Adaora Eze', candidate_email: 'adaora.eze@gmail.com', job_id: 'job-2', status: 'interviewing' as const, bonus_amount: null, bonus_paid_at: null, submitted_at: '2026-02-01T00:00:00Z', notes: 'Strong product manager from Paystack.' },
  { id: 'ref-3', org_id: 'org-1', referrer_id: 'emp-13', candidate_name: 'Femi Oluwole', candidate_email: 'femi.o@proton.me', job_id: 'job-1', status: 'reviewing' as const, bonus_amount: null, bonus_paid_at: null, submitted_at: '2026-02-12T00:00:00Z', notes: 'Met at AfriConf. Staff engineer at Andela. Impressive open-source work.' },
  { id: 'ref-4', org_id: 'org-1', referrer_id: 'emp-6', candidate_name: 'Aminata Toure', candidate_email: 'a.toure@gmail.com', job_id: 'job-3', status: 'hired' as const, bonus_amount: 2000, bonus_paid_at: null, submitted_at: '2025-12-05T00:00:00Z', notes: 'Compliance expert from BCEAO. Bonus pending 90-day milestone.' },
  { id: 'ref-5', org_id: 'org-1', referrer_id: 'emp-14', candidate_name: 'Chidi Nwachukwu', candidate_email: 'chidi.n@yahoo.com', job_id: 'job-4', status: 'submitted' as const, bonus_amount: null, bonus_paid_at: null, submitted_at: '2026-02-20T00:00:00Z', notes: 'Met at Lagos React Meetup. Built Kuda mobile app.' },
  { id: 'ref-6', org_id: 'org-1', referrer_id: 'emp-28', candidate_name: 'Peter Kioko', candidate_email: 'p.kioko@gmail.com', job_id: 'job-4', status: 'rejected' as const, bonus_amount: null, bonus_paid_at: null, submitted_at: '2026-01-10T00:00:00Z', notes: 'Skills did not match data science requirements.' },
]

// === From agent-aeb74e56 ===
export const demoContentLibrary = [
  { id: 'cl-1', org_id: 'org-1', title: 'Introduction to Python Programming', provider: 'udemy_business' as const, external_id: 'UB-PY101', category: 'Technology', level: 'beginner' as const, duration_minutes: 480, format: 'online', thumbnail_url: null, content_url: 'https://udemy.com/python-intro', rating: 4.7, enrollment_count: 15420, is_featured: true, tags: ['python', 'programming', 'data'], language: 'English', added_at: '2025-09-01T00:00:00Z' },
  { id: 'cl-2', org_id: 'org-1', title: 'Strategic Leadership in Banking', provider: 'linkedin_learning' as const, external_id: 'LIL-SLB200', category: 'Leadership', level: 'advanced' as const, duration_minutes: 360, format: 'online', thumbnail_url: null, content_url: 'https://linkedin.com/learning/strategic-leadership', rating: 4.5, enrollment_count: 8930, is_featured: true, tags: ['leadership', 'strategy', 'banking'], language: 'English', added_at: '2025-10-15T00:00:00Z' },
  { id: 'cl-3', org_id: 'org-1', title: 'Financial Risk Management Essentials', provider: 'coursera' as const, external_id: 'CR-FRM100', category: 'Risk', level: 'intermediate' as const, duration_minutes: 720, format: 'online', thumbnail_url: null, content_url: 'https://coursera.org/financial-risk', rating: 4.8, enrollment_count: 22100, is_featured: true, tags: ['risk', 'finance', 'compliance'], language: 'English', added_at: '2025-08-20T00:00:00Z' },
  { id: 'cl-4', org_id: 'org-1', title: 'Effective Communication Skills', provider: 'go1' as const, external_id: 'GO1-ECS50', category: 'Soft Skills', level: 'beginner' as const, duration_minutes: 180, format: 'online', thumbnail_url: null, content_url: 'https://go1.com/effective-communication', rating: 4.3, enrollment_count: 34500, is_featured: false, tags: ['communication', 'soft-skills', 'workplace'], language: 'English', added_at: '2025-07-10T00:00:00Z' },
  { id: 'cl-5', org_id: 'org-1', title: 'Cybersecurity for Financial Services', provider: 'go1' as const, external_id: 'GO1-CFS30', category: 'Technology', level: 'intermediate' as const, duration_minutes: 300, format: 'online', thumbnail_url: null, content_url: 'https://go1.com/cybersecurity-finance', rating: 4.6, enrollment_count: 12800, is_featured: false, tags: ['cybersecurity', 'security', 'fintech'], language: 'English', added_at: '2025-11-05T00:00:00Z' },
  { id: 'cl-6', org_id: 'org-1', title: 'Project Management Professional (PMP) Prep', provider: 'udemy_business' as const, external_id: 'UB-PMP200', category: 'Management', level: 'advanced' as const, duration_minutes: 2400, format: 'online', thumbnail_url: null, content_url: 'https://udemy.com/pmp-prep', rating: 4.9, enrollment_count: 45200, is_featured: true, tags: ['pmp', 'project-management', 'certification'], language: 'English', added_at: '2025-06-01T00:00:00Z' },
  { id: 'cl-7', org_id: 'org-1', title: 'Data Analytics with Excel & Power BI', provider: 'linkedin_learning' as const, external_id: 'LIL-DAE150', category: 'Technology', level: 'intermediate' as const, duration_minutes: 540, format: 'online', thumbnail_url: null, content_url: 'https://linkedin.com/learning/data-analytics', rating: 4.4, enrollment_count: 19700, is_featured: false, tags: ['data', 'analytics', 'excel', 'power-bi'], language: 'English', added_at: '2025-09-20T00:00:00Z' },
  { id: 'cl-8', org_id: 'org-1', title: 'Customer Service Excellence in Banking', provider: 'internal' as const, external_id: null, category: 'Service', level: 'beginner' as const, duration_minutes: 240, format: 'blended', thumbnail_url: null, content_url: null, rating: 4.2, enrollment_count: 850, is_featured: false, tags: ['customer-service', 'banking', 'retail'], language: 'English', added_at: '2026-01-05T00:00:00Z' },
  { id: 'cl-9', org_id: 'org-1', title: 'Blockchain & Digital Currencies', provider: 'coursera' as const, external_id: 'CR-BDC50', category: 'Technology', level: 'intermediate' as const, duration_minutes: 600, format: 'online', thumbnail_url: null, content_url: 'https://coursera.org/blockchain', rating: 4.5, enrollment_count: 16300, is_featured: false, tags: ['blockchain', 'cryptocurrency', 'fintech'], language: 'English', added_at: '2025-10-01T00:00:00Z' },
  { id: 'cl-10', org_id: 'org-1', title: 'Gestion des Risques Operationnels', provider: 'internal' as const, external_id: null, category: 'Risk', level: 'intermediate' as const, duration_minutes: 300, format: 'classroom', thumbnail_url: null, content_url: null, rating: 4.1, enrollment_count: 320, is_featured: false, tags: ['risk', 'operations', 'francophone'], language: 'French', added_at: '2026-01-20T00:00:00Z' },
  { id: 'cl-11', org_id: 'org-1', title: 'Diversity, Equity & Inclusion', provider: 'go1' as const, external_id: 'GO1-DEI20', category: 'Soft Skills', level: 'beginner' as const, duration_minutes: 120, format: 'online', thumbnail_url: null, content_url: 'https://go1.com/dei', rating: 4.4, enrollment_count: 28900, is_featured: false, tags: ['dei', 'diversity', 'inclusion'], language: 'English', added_at: '2025-08-15T00:00:00Z' },
  { id: 'cl-12', org_id: 'org-1', title: 'Machine Learning for Business', provider: 'coursera' as const, external_id: 'CR-MLB80', category: 'Technology', level: 'advanced' as const, duration_minutes: 960, format: 'online', thumbnail_url: null, content_url: 'https://coursera.org/ml-business', rating: 4.7, enrollment_count: 11200, is_featured: false, tags: ['ml', 'ai', 'data-science'], language: 'English', added_at: '2025-11-10T00:00:00Z' },
  { id: 'cl-13', org_id: 'org-1', title: 'Negotiation Masterclass', provider: 'linkedin_learning' as const, external_id: 'LIL-NM100', category: 'Soft Skills', level: 'intermediate' as const, duration_minutes: 270, format: 'online', thumbnail_url: null, content_url: 'https://linkedin.com/learning/negotiation', rating: 4.6, enrollment_count: 21500, is_featured: false, tags: ['negotiation', 'business', 'communication'], language: 'English', added_at: '2025-07-25T00:00:00Z' },
  { id: 'cl-14', org_id: 'org-1', title: 'Ecobank Core Banking Platform Training', provider: 'internal' as const, external_id: null, category: 'Technology', level: 'beginner' as const, duration_minutes: 480, format: 'blended', thumbnail_url: null, content_url: null, rating: 4.0, enrollment_count: 1200, is_featured: false, tags: ['core-banking', 'platform', 'internal'], language: 'English', added_at: '2025-12-01T00:00:00Z' },
  { id: 'cl-15', org_id: 'org-1', title: 'Design Thinking for Innovation', provider: 'udemy_business' as const, external_id: 'UB-DTI75', category: 'Management', level: 'intermediate' as const, duration_minutes: 360, format: 'online', thumbnail_url: null, content_url: 'https://udemy.com/design-thinking', rating: 4.5, enrollment_count: 18600, is_featured: false, tags: ['design-thinking', 'innovation', 'creativity'], language: 'English', added_at: '2025-10-20T00:00:00Z' },
  // OpenSesame courses
  { id: 'cl-16', org_id: 'org-1', title: 'Workplace Harassment Prevention', provider: 'opensesame' as const, external_id: 'OS-WHP01', category: 'Compliance', level: 'beginner' as const, duration_minutes: 60, format: 'online', thumbnail_url: null, content_url: 'https://opensesame.com/courses/harassment', rating: 4.4, enrollment_count: 45200, is_featured: false, tags: ['compliance', 'harassment', 'workplace-safety'], language: 'English', added_at: '2025-11-01T00:00:00Z' },
  { id: 'cl-17', org_id: 'org-1', title: 'Diversity, Equity & Inclusion Essentials', provider: 'opensesame' as const, external_id: 'OS-DEI02', category: 'DEI', level: 'beginner' as const, duration_minutes: 90, format: 'online', thumbnail_url: null, content_url: 'https://opensesame.com/courses/dei', rating: 4.6, enrollment_count: 32100, is_featured: true, tags: ['dei', 'diversity', 'inclusion'], language: 'English', added_at: '2025-11-05T00:00:00Z' },
  { id: 'cl-18', org_id: 'org-1', title: 'Fire Safety & Emergency Procedures', provider: 'opensesame' as const, external_id: 'OS-FS03', category: 'Safety', level: 'beginner' as const, duration_minutes: 45, format: 'online', thumbnail_url: null, content_url: 'https://opensesame.com/courses/fire-safety', rating: 4.3, enrollment_count: 28700, is_featured: false, tags: ['safety', 'fire', 'emergency'], language: 'English', added_at: '2025-11-10T00:00:00Z' },
  { id: 'cl-19', org_id: 'org-1', title: 'GDPR Compliance for Employees', provider: 'opensesame' as const, external_id: 'OS-GDPR04', category: 'Compliance', level: 'intermediate' as const, duration_minutes: 120, format: 'online', thumbnail_url: null, content_url: 'https://opensesame.com/courses/gdpr', rating: 4.5, enrollment_count: 19800, is_featured: false, tags: ['gdpr', 'privacy', 'compliance'], language: 'English', added_at: '2025-12-01T00:00:00Z' },
  // Skillsoft courses
  { id: 'cl-20', org_id: 'org-1', title: 'Executive Leadership: Strategic Decision Making', provider: 'skillsoft' as const, external_id: 'SK-EL01', category: 'Leadership', level: 'advanced' as const, duration_minutes: 540, format: 'online', thumbnail_url: null, content_url: 'https://percipio.com/executive-leadership', rating: 4.7, enrollment_count: 14300, is_featured: true, tags: ['leadership', 'strategy', 'executive'], language: 'English', added_at: '2025-10-01T00:00:00Z' },
  { id: 'cl-21', org_id: 'org-1', title: 'Cloud Architecture Fundamentals', provider: 'skillsoft' as const, external_id: 'SK-CA02', category: 'Technology', level: 'intermediate' as const, duration_minutes: 480, format: 'online', thumbnail_url: null, content_url: 'https://percipio.com/cloud-architecture', rating: 4.6, enrollment_count: 22100, is_featured: false, tags: ['cloud', 'aws', 'architecture'], language: 'English', added_at: '2025-10-15T00:00:00Z' },
  { id: 'cl-22', org_id: 'org-1', title: 'Emotional Intelligence at Work', provider: 'skillsoft' as const, external_id: 'SK-EI03', category: 'Soft Skills', level: 'beginner' as const, duration_minutes: 180, format: 'online', thumbnail_url: null, content_url: 'https://percipio.com/emotional-intelligence', rating: 4.8, enrollment_count: 35600, is_featured: true, tags: ['emotional-intelligence', 'self-awareness', 'empathy'], language: 'English', added_at: '2025-11-01T00:00:00Z' },
  { id: 'cl-23', org_id: 'org-1', title: 'CompTIA Security+ Certification Prep', provider: 'skillsoft' as const, external_id: 'SK-SEC04', category: 'Technology', level: 'advanced' as const, duration_minutes: 720, format: 'online', thumbnail_url: null, content_url: 'https://percipio.com/security-plus', rating: 4.5, enrollment_count: 11200, is_featured: false, tags: ['security', 'comptia', 'certification'], language: 'English', added_at: '2025-12-01T00:00:00Z' },
  // More GO1 courses
  { id: 'cl-24', org_id: 'org-1', title: 'Manual Handling & Ergonomics', provider: 'go1' as const, external_id: 'GO1-MH05', category: 'Safety', level: 'beginner' as const, duration_minutes: 30, format: 'online', thumbnail_url: null, content_url: 'https://go1.com/manual-handling', rating: 4.2, enrollment_count: 52000, is_featured: false, tags: ['safety', 'ergonomics', 'health'], language: 'English', added_at: '2025-09-15T00:00:00Z' },
  { id: 'cl-25', org_id: 'org-1', title: 'Conflict Resolution in the Workplace', provider: 'go1' as const, external_id: 'GO1-CR06', category: 'Soft Skills', level: 'intermediate' as const, duration_minutes: 150, format: 'online', thumbnail_url: null, content_url: 'https://go1.com/conflict-resolution', rating: 4.4, enrollment_count: 18900, is_featured: false, tags: ['conflict', 'communication', 'management'], language: 'English', added_at: '2025-10-01T00:00:00Z' },
  // Multi-language content
  { id: 'cl-26', org_id: 'org-1', title: 'Liderazgo y Gestión de Equipos', provider: 'coursera' as const, external_id: 'CR-LGE07', category: 'Leadership', level: 'intermediate' as const, duration_minutes: 360, format: 'online', thumbnail_url: null, content_url: 'https://coursera.org/liderazgo-gestion', rating: 4.5, enrollment_count: 8900, is_featured: false, tags: ['leadership', 'team-management', 'spanish'], language: 'Spanish', added_at: '2025-11-15T00:00:00Z' },
  { id: 'cl-27', org_id: 'org-1', title: 'Einführung in Projektmanagement', provider: 'linkedin_learning' as const, external_id: 'LIL-EPM08', category: 'Management', level: 'beginner' as const, duration_minutes: 240, format: 'online', thumbnail_url: null, content_url: 'https://linkedin.com/learning/projektmanagement', rating: 4.3, enrollment_count: 6200, is_featured: false, tags: ['project-management', 'german', 'basics'], language: 'German', added_at: '2025-12-01T00:00:00Z' },
  { id: 'cl-28', org_id: 'org-1', title: 'Usalama wa Mtandao kwa Wafanyakazi', provider: 'internal' as const, external_id: null, category: 'Technology', level: 'beginner' as const, duration_minutes: 60, format: 'online', thumbnail_url: null, content_url: null, rating: 4.1, enrollment_count: 450, is_featured: false, tags: ['cybersecurity', 'swahili', 'awareness'], language: 'Swahili', added_at: '2026-01-10T00:00:00Z' },
  { id: 'cl-29', org_id: 'org-1', title: 'Gestão de Riscos Bancários', provider: 'coursera' as const, external_id: 'CR-GRB09', category: 'Finance', level: 'advanced' as const, duration_minutes: 420, format: 'online', thumbnail_url: null, content_url: 'https://coursera.org/gestao-riscos', rating: 4.6, enrollment_count: 5100, is_featured: false, tags: ['risk-management', 'banking', 'portuguese'], language: 'Portuguese', added_at: '2025-11-20T00:00:00Z' },
  { id: 'cl-30', org_id: 'org-1', title: 'مقدمة في الذكاء الاصطناعي', provider: 'udemy_business' as const, external_id: 'UB-AI10', category: 'Technology', level: 'beginner' as const, duration_minutes: 300, format: 'online', thumbnail_url: null, content_url: 'https://udemy.com/ai-arabic', rating: 4.4, enrollment_count: 7800, is_featured: false, tags: ['ai', 'machine-learning', 'arabic'], language: 'Arabic', added_at: '2025-12-15T00:00:00Z' },
]

export const demoCertificateTemplates = [
  { id: 'cert-tpl-1', org_id: 'org-1', name: 'Ecobank Standard', layout: 'modern' as const, accentColor: '#f97316', borderStyle: 'simple' as const, showLogo: true, showSeal: true, signatory1: 'Adaeze Okonkwo', signatory1Title: 'Chief Learning Officer', signatory2: 'Emeka Nwosu', signatory2Title: 'HR Director', orgName: 'Ecobank Transnational', fontFamily: 'sans' as const },
  { id: 'cert-tpl-2', org_id: 'org-1', name: 'Formal Academic', layout: 'classic' as const, accentColor: '#1e293b', borderStyle: 'ornate' as const, showLogo: true, showSeal: true, signatory1: 'Prof. Kwame Asante', signatory1Title: 'Director of Learning', signatory2: 'Dr. Fatima Diallo', signatory2Title: 'VP Human Capital', orgName: 'Ecobank Transnational', fontFamily: 'serif' as const },
]

// === From agent-aeb74e56 ===
// ============================================================
// LEARNING: Prerequisites, SCORM, Content Library, Gamification
// ============================================================

export const demoCoursePrerequisites = [
  { id: 'prereq-1', org_id: 'org-1', course_id: 'course-3', prerequisite_course_id: 'course-4', type: 'required' as const, minimum_score: 70 },
  { id: 'prereq-2', org_id: 'org-1', course_id: 'course-8', prerequisite_course_id: 'course-1', type: 'required' as const, minimum_score: 80 },
  { id: 'prereq-3', org_id: 'org-1', course_id: 'course-7', prerequisite_course_id: 'course-4', type: 'recommended' as const, minimum_score: null },
  { id: 'prereq-4', org_id: 'org-1', course_id: 'course-1', prerequisite_course_id: 'course-5', type: 'recommended' as const, minimum_score: null },
  { id: 'prereq-5', org_id: 'org-1', course_id: 'course-5', prerequisite_course_id: 'course-2', type: 'required' as const, minimum_score: 60 },
]

// === From agent-aeb74e56 ===
export const demoLearnerBadges = [
  { id: 'badge-1', org_id: 'org-1', employee_id: 'emp-4', badge_type: 'course_complete' as const, badge_name: 'First Course Complete', badge_icon: 'award', description: 'Completed your first course', earned_at: '2026-01-25T00:00:00Z', course_id: 'course-2', metadata: null },
  { id: 'badge-2', org_id: 'org-1', employee_id: 'emp-3', badge_type: 'course_complete' as const, badge_name: 'Course Champion', badge_icon: 'trophy', description: 'Completed Customer Experience Excellence', earned_at: '2025-12-15T00:00:00Z', course_id: 'course-5', metadata: null },
  { id: 'badge-3', org_id: 'org-1', employee_id: 'emp-14', badge_type: 'course_complete' as const, badge_name: 'Agile Master', badge_icon: 'zap', description: 'Completed Agile Project Management', earned_at: '2025-10-01T00:00:00Z', course_id: 'course-7', metadata: null },
  { id: 'badge-4', org_id: 'org-1', employee_id: 'emp-14', badge_type: 'first_quiz_perfect' as const, badge_name: 'Perfect Score', badge_icon: 'star', description: 'Achieved 100% on your first quiz attempt', earned_at: '2025-09-15T00:00:00Z', course_id: 'course-7', metadata: { score: 100 } },
  { id: 'badge-5', org_id: 'org-1', employee_id: 'emp-26', badge_type: 'compliance_champion' as const, badge_name: 'Compliance Champion', badge_icon: 'shield', description: 'Completed all mandatory compliance courses', earned_at: '2026-01-20T00:00:00Z', course_id: null, metadata: { courses_completed: 2 } },
  { id: 'badge-6', org_id: 'org-1', employee_id: 'emp-2', badge_type: 'streak_7' as const, badge_name: '7-Day Streak', badge_icon: 'flame', description: 'Maintained a 7-day learning streak', earned_at: '2026-02-10T00:00:00Z', course_id: null, metadata: { streak_days: 7 } },
  { id: 'badge-7', org_id: 'org-1', employee_id: 'emp-6', badge_type: 'top_learner' as const, badge_name: 'Top Learner', badge_icon: 'crown', description: 'Ranked in top 10% of learners this month', earned_at: '2026-02-01T00:00:00Z', course_id: null, metadata: { rank: 3 } },
  { id: 'badge-8', org_id: 'org-1', employee_id: 'emp-1', badge_type: 'mentor' as const, badge_name: 'Knowledge Mentor', badge_icon: 'users', description: 'Helped 5 peers with their learning', earned_at: '2026-02-05T00:00:00Z', course_id: null, metadata: { peers_helped: 5 } },
  { id: 'badge-9', org_id: 'org-1', employee_id: 'emp-3', badge_type: 'streak_30' as const, badge_name: '30-Day Streak', badge_icon: 'flame', description: 'Maintained a 30-day learning streak', earned_at: '2025-11-15T00:00:00Z', course_id: null, metadata: { streak_days: 30 } },
  { id: 'badge-10', org_id: 'org-1', employee_id: 'emp-11', badge_type: 'path_complete' as const, badge_name: 'Path Completer', badge_icon: 'map', description: 'Completed a full learning path', earned_at: '2026-01-30T00:00:00Z', course_id: null, metadata: { path: 'Technology Fundamentals' } },
  { id: 'badge-11', org_id: 'org-1', employee_id: 'emp-4', badge_type: 'compliance_champion' as const, badge_name: 'Compliance Champion', badge_icon: 'shield', description: 'Completed all mandatory compliance courses', earned_at: '2026-01-28T00:00:00Z', course_id: null, metadata: { courses_completed: 2 } },
  { id: 'badge-12', org_id: 'org-1', employee_id: 'emp-22', badge_type: 'top_learner' as const, badge_name: 'Top Learner', badge_icon: 'crown', description: 'Ranked in top 10% of learners this month', earned_at: '2026-02-15T00:00:00Z', course_id: null, metadata: { rank: 5 } },
  // Kash & Co badges
  { id: 'kbadge-1', org_id: 'org-2', employee_id: 'kemp-4', badge_type: 'course_complete' as const, badge_name: 'First Course Complete', badge_icon: 'award', description: 'Completed Advanced Financial Modelling', earned_at: '2025-12-15T00:00:00Z', course_id: 'kcourse-2', metadata: null },
  { id: 'kbadge-2', org_id: 'org-2', employee_id: 'kemp-4', badge_type: 'first_quiz_perfect' as const, badge_name: 'Perfect Score', badge_icon: 'star', description: 'Achieved 100% on financial modelling quiz', earned_at: '2025-12-16T00:00:00Z', course_id: 'kcourse-2', metadata: { score: 100 } },
  { id: 'kbadge-3', org_id: 'org-2', employee_id: 'kemp-5', badge_type: 'streak_7' as const, badge_name: '7-Day Streak', badge_icon: 'flame', description: 'Maintained a 7-day learning streak', earned_at: '2026-02-08T00:00:00Z', course_id: null, metadata: { streak_days: 7 } },
  { id: 'kbadge-4', org_id: 'org-2', employee_id: 'kemp-14', badge_type: 'course_complete' as const, badge_name: 'Foundation Complete', badge_icon: 'award', description: 'Completed Consulting Foundations', earned_at: '2025-10-01T00:00:00Z', course_id: 'kcourse-1', metadata: null },
  { id: 'kbadge-5', org_id: 'org-2', employee_id: 'kemp-3', badge_type: 'top_learner' as const, badge_name: 'Top Learner', badge_icon: 'crown', description: 'Ranked in top 10% of learners this month', earned_at: '2026-02-01T00:00:00Z', course_id: null, metadata: { rank: 2 } },
  { id: 'kbadge-6', org_id: 'org-2', employee_id: 'kemp-8', badge_type: 'streak_30' as const, badge_name: '30-Day Streak', badge_icon: 'flame', description: 'Maintained a 30-day learning streak', earned_at: '2026-01-20T00:00:00Z', course_id: null, metadata: { streak_days: 30 } },
  { id: 'kbadge-7', org_id: 'org-2', employee_id: 'kemp-10', badge_type: 'path_complete' as const, badge_name: 'Path Completer', badge_icon: 'map', description: 'Completed Data-Driven Advisory path', earned_at: '2026-01-25T00:00:00Z', course_id: null, metadata: { path: 'Data-Driven Advisory' } },
  { id: 'kbadge-8', org_id: 'org-2', employee_id: 'kemp-2', badge_type: 'mentor' as const, badge_name: 'Knowledge Mentor', badge_icon: 'users', description: 'Mentored 5 junior consultants', earned_at: '2026-02-10T00:00:00Z', course_id: null, metadata: { peers_helped: 5 } },
]

// === From agent-aeb74e56 ===
export const demoLearnerPoints = [
  { id: 'lp-1', org_id: 'org-1', employee_id: 'emp-14', points: 150, source: 'course_complete' as const, description: 'Completed Agile Project Management', earned_at: '2025-10-01T00:00:00Z' },
  { id: 'lp-2', org_id: 'org-1', employee_id: 'emp-14', points: 100, source: 'quiz_score' as const, description: 'Perfect score on Agile quiz', earned_at: '2025-09-15T00:00:00Z' },
  { id: 'lp-3', org_id: 'org-1', employee_id: 'emp-14', points: 50, source: 'discussion_post' as const, description: 'Active discussion participant', earned_at: '2025-10-10T00:00:00Z' },
  { id: 'lp-4', org_id: 'org-1', employee_id: 'emp-4', points: 150, source: 'course_complete' as const, description: 'Completed AML Compliance', earned_at: '2026-01-25T00:00:00Z' },
  { id: 'lp-5', org_id: 'org-1', employee_id: 'emp-4', points: 75, source: 'quiz_score' as const, description: 'Scored 92% on AML assessment', earned_at: '2026-01-25T00:00:00Z' },
  { id: 'lp-6', org_id: 'org-1', employee_id: 'emp-3', points: 150, source: 'course_complete' as const, description: 'Completed Customer Experience Excellence', earned_at: '2025-12-15T00:00:00Z' },
  { id: 'lp-7', org_id: 'org-1', employee_id: 'emp-3', points: 200, source: 'streak_bonus' as const, description: '30-day learning streak bonus', earned_at: '2025-11-15T00:00:00Z' },
  { id: 'lp-8', org_id: 'org-1', employee_id: 'emp-26', points: 150, source: 'course_complete' as const, description: 'Completed AML Compliance', earned_at: '2026-01-20T00:00:00Z' },
  { id: 'lp-9', org_id: 'org-1', employee_id: 'emp-26', points: 80, source: 'quiz_score' as const, description: 'Scored 88% on Data Privacy quiz', earned_at: '2026-01-20T00:00:00Z' },
  { id: 'lp-10', org_id: 'org-1', employee_id: 'emp-6', points: 100, source: 'peer_help' as const, description: 'Helped peers in study group', earned_at: '2026-02-10T00:00:00Z' },
  { id: 'lp-11', org_id: 'org-1', employee_id: 'emp-6', points: 50, source: 'discussion_post' as const, description: 'Contributed to credit analysis discussion', earned_at: '2026-02-05T00:00:00Z' },
  { id: 'lp-12', org_id: 'org-1', employee_id: 'emp-2', points: 100, source: 'streak_bonus' as const, description: '7-day learning streak bonus', earned_at: '2026-02-10T00:00:00Z' },
  { id: 'lp-13', org_id: 'org-1', employee_id: 'emp-2', points: 50, source: 'discussion_post' as const, description: 'Discussion on leadership practices', earned_at: '2026-02-08T00:00:00Z' },
  { id: 'lp-14', org_id: 'org-1', employee_id: 'emp-1', points: 75, source: 'peer_help' as const, description: 'Mentored 5 team members', earned_at: '2026-02-05T00:00:00Z' },
  { id: 'lp-15', org_id: 'org-1', employee_id: 'emp-11', points: 150, source: 'course_complete' as const, description: 'Completed Technology Fundamentals path', earned_at: '2026-01-30T00:00:00Z' },
  { id: 'lp-16', org_id: 'org-1', employee_id: 'emp-11', points: 50, source: 'discussion_post' as const, description: 'Operations process discussion', earned_at: '2026-01-25T00:00:00Z' },
  { id: 'lp-17', org_id: 'org-1', employee_id: 'emp-22', points: 150, source: 'course_complete' as const, description: 'Completed compliance training suite', earned_at: '2026-02-01T00:00:00Z' },
  { id: 'lp-18', org_id: 'org-1', employee_id: 'emp-22', points: 100, source: 'quiz_score' as const, description: 'Top scorer on risk assessment', earned_at: '2026-02-15T00:00:00Z' },
  // Kash & Co learner points
  { id: 'klp-p1', org_id: 'org-2', employee_id: 'kemp-4', points: 200, source: 'course_complete' as const, description: 'Completed Advanced Financial Modelling', earned_at: '2025-12-15T00:00:00Z' },
  { id: 'klp-p2', org_id: 'org-2', employee_id: 'kemp-4', points: 100, source: 'quiz_score' as const, description: 'Perfect score on DCF quiz', earned_at: '2025-12-16T00:00:00Z' },
  { id: 'klp-p3', org_id: 'org-2', employee_id: 'kemp-4', points: 50, source: 'discussion_post' as const, description: 'Shared financial modelling tips', earned_at: '2025-12-20T00:00:00Z' },
  { id: 'klp-p4', org_id: 'org-2', employee_id: 'kemp-5', points: 150, source: 'course_complete' as const, description: 'Completed Consulting Foundations (70%)', earned_at: '2026-02-01T00:00:00Z' },
  { id: 'klp-p5', org_id: 'org-2', employee_id: 'kemp-5', points: 100, source: 'streak_bonus' as const, description: '7-day learning streak bonus', earned_at: '2026-02-08T00:00:00Z' },
  { id: 'klp-p6', org_id: 'org-2', employee_id: 'kemp-14', points: 150, source: 'course_complete' as const, description: 'Completed Consulting Foundations', earned_at: '2025-10-01T00:00:00Z' },
  { id: 'klp-p7', org_id: 'org-2', employee_id: 'kemp-14', points: 75, source: 'quiz_score' as const, description: 'Scored 85% on foundations quiz', earned_at: '2025-10-05T00:00:00Z' },
  { id: 'klp-p8', org_id: 'org-2', employee_id: 'kemp-3', points: 200, source: 'streak_bonus' as const, description: '30-day streak and top learner bonus', earned_at: '2026-02-01T00:00:00Z' },
  { id: 'klp-p9', org_id: 'org-2', employee_id: 'kemp-3', points: 100, source: 'peer_help' as const, description: 'Mentored junior consultants on case methods', earned_at: '2026-01-25T00:00:00Z' },
  { id: 'klp-p10', org_id: 'org-2', employee_id: 'kemp-8', points: 250, source: 'streak_bonus' as const, description: '30-day learning streak bonus', earned_at: '2026-01-20T00:00:00Z' },
  { id: 'klp-p11', org_id: 'org-2', employee_id: 'kemp-8', points: 50, source: 'discussion_post' as const, description: 'Strategy framework discussion', earned_at: '2026-01-15T00:00:00Z' },
  { id: 'klp-p12', org_id: 'org-2', employee_id: 'kemp-10', points: 150, source: 'course_complete' as const, description: 'Completed Data Analytics path', earned_at: '2026-01-25T00:00:00Z' },
  { id: 'klp-p13', org_id: 'org-2', employee_id: 'kemp-10', points: 80, source: 'quiz_score' as const, description: 'Scored 90% on Python analytics quiz', earned_at: '2026-01-28T00:00:00Z' },
  { id: 'klp-p14', org_id: 'org-2', employee_id: 'kemp-2', points: 75, source: 'peer_help' as const, description: 'Mentored 5 consultants on client skills', earned_at: '2026-02-10T00:00:00Z' },
]

// === From agent-aeb74e56 ===
export const demoScormPackages = [
  { id: 'scorm-1', org_id: 'org-1', course_id: 'course-2', package_url: '/scorm/aml-compliance-v3.zip', version: 'scorm_2004' as const, entry_point: 'index.html', metadata: { title: 'AML Compliance Interactive', description: 'Interactive AML compliance module with scenario-based learning', duration: '4 hours', mastery_score: 80 }, uploaded_at: '2025-12-15T00:00:00Z', status: 'ready' as const },
  { id: 'scorm-2', org_id: 'org-1', course_id: 'course-6', package_url: '/scorm/data-privacy-gdpr.zip', version: 'scorm_1_2' as const, entry_point: 'launch.html', metadata: { title: 'Data Privacy & GDPR Module', description: 'Comprehensive data protection training with interactive exercises', duration: '3 hours', mastery_score: 75 }, uploaded_at: '2025-11-20T00:00:00Z', status: 'ready' as const },
  { id: 'scorm-3', org_id: 'org-1', course_id: 'course-4', package_url: '/scorm/digital-banking-basics.zip', version: 'xapi' as const, entry_point: 'start.html', metadata: { title: 'Digital Banking Fundamentals xAPI', description: 'Modern banking platform training with xAPI tracking', duration: '8 hours', mastery_score: 70 }, uploaded_at: '2026-01-10T00:00:00Z', status: 'ready' as const },
]

// === From agent-aeb74e56 ===
export const demoScormTracking = [
  { id: 'st-1', org_id: 'org-1', package_id: 'scorm-1', enrollment_id: 'enr-2', lesson_status: 'completed' as const, score_raw: 92, score_min: 0, score_max: 100, total_time: '03:45:22', suspend_data: null, last_accessed: '2026-01-25T14:30:00Z' },
  { id: 'st-2', org_id: 'org-1', package_id: 'scorm-2', enrollment_id: 'enr-8', lesson_status: 'passed' as const, score_raw: 88, score_min: 0, score_max: 100, total_time: '02:52:10', suspend_data: null, last_accessed: '2026-01-20T11:15:00Z' },
  { id: 'st-3', org_id: 'org-1', package_id: 'scorm-1', enrollment_id: 'enr-3', lesson_status: 'incomplete' as const, score_raw: 45, score_min: 0, score_max: 100, total_time: '01:30:00', suspend_data: 'bookmark=module3;slide=12', last_accessed: '2026-02-15T09:20:00Z' },
]

// === From agent-af5905e8 ===
// Open-Ended Responses (with sentiment and themes)
export const demoOpenEndedResponses = [
  { id: 'oer-1', survey_response_id: 'sr-1', question_id: 'q-p5', org_id: 'org-1', text: 'The leadership team has done an excellent job communicating our strategy this quarter. I feel aligned with the company direction.', sentiment: 'positive' as const, themes: ['leadership', 'communication', 'strategy'], analyzed_at: '2026-02-01T10:00:00Z', created_at: '2026-01-28T09:15:00Z', department_id: 'dept-1' },
  { id: 'oer-2', survey_response_id: 'sr-1', question_id: 'q-p5', org_id: 'org-1', text: 'I wish there were more opportunities for career advancement. The promotion criteria are not transparent enough.', sentiment: 'negative' as const, themes: ['career growth', 'transparency', 'promotion'], analyzed_at: '2026-02-01T10:00:00Z', created_at: '2026-01-28T10:30:00Z', department_id: 'dept-1' },
  { id: 'oer-3', survey_response_id: 'sr-2', question_id: 'q-e2', org_id: 'org-1', text: 'Great work-life balance and supportive team culture. My manager genuinely cares about my wellbeing.', sentiment: 'positive' as const, themes: ['work-life balance', 'culture', 'management'], analyzed_at: '2026-02-01T10:00:00Z', created_at: '2026-01-29T11:00:00Z', department_id: 'dept-2' },
  { id: 'oer-4', survey_response_id: 'sr-3', question_id: 'q-p5', org_id: 'org-1', text: 'The workload has been overwhelming lately. We need more resources in the operations team.', sentiment: 'negative' as const, themes: ['workload', 'resources', 'staffing'], analyzed_at: '2026-02-01T10:00:00Z', created_at: '2026-01-28T14:20:00Z', department_id: 'dept-3' },
  { id: 'oer-5', survey_response_id: 'sr-4', question_id: 'q-e3', org_id: 'org-1', text: 'The technology stack we use is modern and I appreciate the investment in new tools. Makes my job much easier.', sentiment: 'positive' as const, themes: ['technology', 'tools', 'investment'], analyzed_at: '2026-02-01T10:00:00Z', created_at: '2026-01-30T08:45:00Z', department_id: 'dept-4' },
  { id: 'oer-6', survey_response_id: 'sr-5', question_id: 'q-p5', org_id: 'org-1', text: 'The company is a decent place to work but nothing extraordinary. Benefits are average compared to competitors.', sentiment: 'neutral' as const, themes: ['benefits', 'compensation', 'competitiveness'], analyzed_at: '2026-02-01T10:00:00Z', created_at: '2026-01-29T16:00:00Z', department_id: 'dept-5' },
  { id: 'oer-7', survey_response_id: 'sr-6', question_id: 'q-e2', org_id: 'org-1', text: 'Cross-functional collaboration could be much better. Teams work in silos and information does not flow well.', sentiment: 'negative' as const, themes: ['collaboration', 'silos', 'communication'], analyzed_at: '2026-02-01T10:00:00Z', created_at: '2026-01-30T13:30:00Z', department_id: 'dept-1' },
  { id: 'oer-8', survey_response_id: 'sr-7', question_id: 'q-p5', org_id: 'org-1', text: 'I love the mentoring program. Being paired with a senior leader has been transformative for my career development.', sentiment: 'positive' as const, themes: ['mentoring', 'career development', 'leadership'], analyzed_at: '2026-02-01T10:00:00Z', created_at: '2026-01-28T12:00:00Z', department_id: 'dept-2' },
  { id: 'oer-9', survey_response_id: 'sr-8', question_id: 'q-e3', org_id: 'org-1', text: 'Training opportunities are limited for junior staff. Would appreciate more structured learning paths.', sentiment: 'neutral' as const, themes: ['training', 'learning', 'development'], analyzed_at: '2026-02-01T10:00:00Z', created_at: '2026-01-31T09:00:00Z', department_id: 'dept-3' },
  { id: 'oer-10', survey_response_id: 'sr-9', question_id: 'q-p5', org_id: 'org-1', text: 'The recognition program is wonderful. Being publicly acknowledged during all-hands meetings motivates the entire team.', sentiment: 'positive' as const, themes: ['recognition', 'motivation', 'culture'], analyzed_at: '2026-02-01T10:00:00Z', created_at: '2026-01-29T15:00:00Z', department_id: 'dept-4' },
]

// === From agent-af5905e8 ===
// Survey Schedules
export const demoSurveySchedules = [
  {
    id: 'sched-1', survey_id: 'survey-2', org_id: 'org-1', frequency: 'monthly' as const,
    start_date: '2026-01-01', next_run_date: '2026-03-01', end_date: '2026-12-31',
    is_active: true, target_audience: { department: null, role: null, country: null },
    last_run_at: '2026-02-01T08:00:00Z', created_at: '2025-12-15T00:00:00Z',
    survey_title: 'Monthly Pulse Check',
  },
  {
    id: 'sched-2', survey_id: 'survey-1', org_id: 'org-1', frequency: 'quarterly' as const,
    start_date: '2026-01-01', next_run_date: '2026-04-01', end_date: null,
    is_active: true, target_audience: { department: null, role: null, country: null },
    last_run_at: '2026-01-15T08:00:00Z', created_at: '2025-12-01T00:00:00Z',
    survey_title: 'Quarterly eNPS',
  },
]

// === From agent-af5905e8 ===
// Survey Templates
export const demoSurveyTemplates = [
  {
    id: 'tpl-pulse', org_id: 'org-1', name: 'Pulse Check', type: 'pulse' as const,
    description: 'Quick 5-question pulse survey to gauge overall employee sentiment and engagement levels.',
    questions: [
      { id: 'q-p1', text: 'How satisfied are you with your current role?', type: 'rating' as const, required: true, options: { scale: 5 } },
      { id: 'q-p2', text: 'Do you feel supported by your direct manager?', type: 'rating' as const, required: true, options: { scale: 5 } },
      { id: 'q-p3', text: 'How would you rate your current workload?', type: 'rating' as const, required: true, options: { scale: 5, labels: ['Too Light', 'Light', 'Just Right', 'Heavy', 'Too Heavy'] } },
      { id: 'q-p4', text: 'Do you feel recognized for your contributions?', type: 'rating' as const, required: true, options: { scale: 5 } },
      { id: 'q-p5', text: 'Would you recommend this company as a great place to work?', type: 'rating' as const, required: true, options: { scale: 5 }, branchLogic: { condition: { field: 'value', operator: 'lte', value: 2 }, action: 'skip_to', targetQuestionId: 'q-p5-followup' } },
    ],
    isDefault: true, usageCount: 12, created_at: '2025-06-01T00:00:00Z',
  },
  {
    id: 'tpl-enps', org_id: 'org-1', name: 'eNPS Survey', type: 'enps' as const,
    description: 'Employee Net Promoter Score survey with follow-up questions to understand the score.',
    questions: [
      { id: 'q-e1', text: 'On a scale of 0-10, how likely are you to recommend this company as a place to work?', type: 'nps' as const, required: true },
      { id: 'q-e2', text: 'What is the primary reason for your score?', type: 'text' as const, required: true },
      { id: 'q-e3', text: 'What one thing could we improve to make this a better workplace?', type: 'text' as const, required: false },
    ],
    isDefault: true, usageCount: 8, created_at: '2025-06-01T00:00:00Z',
  },
  {
    id: 'tpl-onboarding', org_id: 'org-1', name: 'Onboarding 30-Day Check-In', type: 'onboarding' as const,
    description: 'Comprehensive 30-day onboarding experience survey for new hires.',
    questions: [
      { id: 'q-o1', text: 'How would you rate your overall welcome experience?', type: 'rating' as const, required: true, options: { scale: 5 } },
      { id: 'q-o2', text: 'Was your training adequate to perform your role?', type: 'rating' as const, required: true, options: { scale: 5 }, branchLogic: { condition: { field: 'value', operator: 'lte', value: 2 }, action: 'skip_to', targetQuestionId: 'q-o2-followup' } },
      { id: 'q-o2-followup', text: 'What additional training would help you?', type: 'text' as const, required: false },
      { id: 'q-o3', text: 'Did you receive the tools and resources needed for your job?', type: 'multiple_choice' as const, required: true, options: { choices: ['Yes, everything', 'Most things', 'Some things were missing', 'No, significant gaps'], multiSelect: false } },
      { id: 'q-o4', text: 'How well has your team integrated you?', type: 'rating' as const, required: true, options: { scale: 5 } },
      { id: 'q-o5', text: 'Rate your manager on the following:', type: 'matrix' as const, required: true, options: { rows: ['Availability', 'Clarity of expectations', 'Feedback quality', 'Supportiveness'], scale: 5 } },
      { id: 'q-o6', text: 'How clear are your role expectations and responsibilities?', type: 'rating' as const, required: true, options: { scale: 5 } },
      { id: 'q-o7', text: 'Do you feel you have adequate support to succeed?', type: 'rating' as const, required: true, options: { scale: 5 } },
      { id: 'q-o8', text: 'Please share any additional feedback about your onboarding experience.', type: 'text' as const, required: false },
    ],
    isDefault: true, usageCount: 5, created_at: '2025-06-01T00:00:00Z',
  },
  {
    id: 'tpl-exit', org_id: 'org-1', name: 'Exit Survey', type: 'exit' as const,
    description: 'Comprehensive exit interview survey to understand reasons for departure and gather improvement feedback.',
    questions: [
      { id: 'q-x1', text: 'What is your primary reason for leaving?', type: 'multiple_choice' as const, required: true, options: { choices: ['Better opportunity', 'Compensation', 'Work-life balance', 'Career growth', 'Management', 'Company culture', 'Relocation', 'Personal reasons', 'Other'], multiSelect: false } },
      { id: 'q-x2', text: 'How satisfied were you with your overall experience?', type: 'rating' as const, required: true, options: { scale: 10 } },
      { id: 'q-x3', text: 'How would you rate your relationship with your direct manager?', type: 'rating' as const, required: true, options: { scale: 5 } },
      { id: 'q-x4', text: 'Did you feel you had adequate opportunities for career growth?', type: 'rating' as const, required: true, options: { scale: 5 }, branchLogic: { condition: { field: 'value', operator: 'lte', value: 2 }, action: 'skip_to', targetQuestionId: 'q-x4-followup' } },
      { id: 'q-x4-followup', text: 'What growth opportunities were lacking?', type: 'text' as const, required: false },
      { id: 'q-x5', text: 'How satisfied were you with your compensation and benefits?', type: 'rating' as const, required: true, options: { scale: 5 } },
      { id: 'q-x6', text: 'How would you describe the company culture?', type: 'text' as const, required: true },
      { id: 'q-x7', text: 'Would you recommend this company to a friend?', type: 'nps' as const, required: true },
      { id: 'q-x8', text: 'What could we have done differently to retain you?', type: 'text' as const, required: false },
      { id: 'q-x9', text: 'What was the best part of working here?', type: 'text' as const, required: false },
      { id: 'q-x10', text: 'Would you consider returning in the future?', type: 'multiple_choice' as const, required: true, options: { choices: ['Definitely yes', 'Possibly', 'Unlikely', 'Definitely not'], multiSelect: false } },
    ],
    isDefault: true, usageCount: 3, created_at: '2025-06-01T00:00:00Z',
  },
  {
    id: 'tpl-annual', org_id: 'org-1', name: 'Annual Engagement Survey', type: 'annual' as const,
    description: 'Comprehensive annual engagement survey covering all key dimensions of employee experience.',
    questions: [
      { id: 'q-a1', text: 'Rate your overall job satisfaction.', type: 'rating' as const, required: true, options: { scale: 10 } },
      { id: 'q-a2', text: 'How well does leadership communicate the company vision?', type: 'rating' as const, required: true, options: { scale: 5 } },
      { id: 'q-a3', text: 'Rate the following aspects of your work environment:', type: 'matrix' as const, required: true, options: { rows: ['Physical workspace', 'Team collaboration', 'Work-life balance', 'Tools and technology', 'Learning opportunities'], scale: 5 } },
      { id: 'q-a4', text: 'Do you feel valued and recognized for your work?', type: 'rating' as const, required: true, options: { scale: 5 } },
      { id: 'q-a5', text: 'How confident are you in the company direction?', type: 'rating' as const, required: true, options: { scale: 5 } },
      { id: 'q-a6', text: 'What three things should the company focus on improving?', type: 'text' as const, required: true },
    ],
    isDefault: true, usageCount: 2, created_at: '2025-06-01T00:00:00Z',
  },
  {
    id: 'tpl-dei', org_id: 'org-1', name: 'DEI Climate Survey', type: 'dei' as const,
    description: 'Diversity, Equity, and Inclusion climate survey to measure organizational inclusiveness.',
    questions: [
      { id: 'q-d1', text: 'I feel a sense of belonging at this organization.', type: 'rating' as const, required: true, options: { scale: 5, labels: ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'] } },
      { id: 'q-d2', text: 'Decisions and policies at this company are fair and equitable.', type: 'rating' as const, required: true, options: { scale: 5, labels: ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'] } },
      { id: 'q-d3', text: 'People from all backgrounds are included and respected.', type: 'rating' as const, required: true, options: { scale: 5, labels: ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'] } },
      { id: 'q-d4', text: 'Leadership represents the diversity of our workforce.', type: 'rating' as const, required: true, options: { scale: 5, labels: ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'] } },
      { id: 'q-d5', text: 'I feel comfortable speaking up and sharing my perspective.', type: 'rating' as const, required: true, options: { scale: 5, labels: ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'] }, branchLogic: { condition: { field: 'value', operator: 'lte', value: 2 }, action: 'skip_to', targetQuestionId: 'q-d5-followup' } },
      { id: 'q-d5-followup', text: 'What prevents you from speaking up?', type: 'text' as const, required: false },
      { id: 'q-d6', text: 'All employees are treated with respect regardless of their background.', type: 'rating' as const, required: true, options: { scale: 5, labels: ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'] } },
      { id: 'q-d7', text: 'Equal opportunities for growth and advancement exist for everyone.', type: 'rating' as const, required: true, options: { scale: 5, labels: ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'] } },
    ],
    isDefault: true, usageCount: 1, created_at: '2025-06-01T00:00:00Z',
  },
]

// === From agent-af5905e8 ===
// Survey Triggers
export const demoSurveyTriggers = [
  {
    id: 'trig-1', org_id: 'org-1', template_id: 'tpl-onboarding', trigger_event: 'employee_hired' as const,
    delay_days: 30, is_active: true, target_audience: { department: null, role: null, country: null },
    created_at: '2025-10-01T00:00:00Z', template_name: 'Onboarding 30-Day Check-In',
    recent_firings: [
      { employee_id: 'emp-4', employee_name: 'Chioma Eze', event: 'Hired', survey_sent_date: '2026-02-10', status: 'completed' },
      { employee_id: 'emp-10', employee_name: 'Abena Boateng', event: 'Hired', survey_sent_date: '2026-02-03', status: 'pending' },
    ],
  },
  {
    id: 'trig-2', org_id: 'org-1', template_id: 'tpl-exit', trigger_event: 'employee_terminated' as const,
    delay_days: 0, is_active: true, target_audience: { department: null, role: null, country: null },
    created_at: '2025-10-01T00:00:00Z', template_name: 'Exit Survey',
    recent_firings: [
      { employee_id: 'emp-30', employee_name: 'Aminata Diop', event: 'Terminated', survey_sent_date: '2026-01-20', status: 'completed' },
    ],
  },
  {
    id: 'trig-3', org_id: 'org-1', template_id: 'tpl-pulse', trigger_event: 'anniversary' as const,
    delay_days: 0, is_active: true, target_audience: { department: null, role: null, country: null },
    created_at: '2025-11-01T00:00:00Z', template_name: 'Pulse Check',
    recent_firings: [
      { employee_id: 'emp-14', employee_name: 'Yaw Frimpong', event: '3-Year Anniversary', survey_sent_date: '2026-02-15', status: 'completed' },
      { employee_id: 'emp-6', employee_name: 'Fatou Ndiaye', event: '2-Year Anniversary', survey_sent_date: '2026-02-08', status: 'pending' },
    ],
  },
]
// ============================================================
// GAP CLOSURE: Demo Data for New Features
// ============================================================

// ─── E-Signatures ───
export const demoSignatureDocuments = [
  { id: 'sig-doc-1', org_id: 'org-1', title: 'Employment Agreement - Q1 2026', status: 'completed', signing_flow: 'sequential', created_by: 'emp-1', document_url: '/docs/employment-agreement-q1.pdf', created_at: '2026-01-15T10:00:00Z', completed_at: '2026-01-17T14:30:00Z', signers: [{ name: 'Adaeze Okafor', email: 'adaeze@ecobank.com', status: 'signed' }, { name: 'HR Director', email: 'hr@ecobank.com', status: 'signed' }] },
  { id: 'sig-doc-2', org_id: 'org-1', title: 'NDA - Vendor Partnership', status: 'in_progress', signing_flow: 'parallel', created_by: 'emp-3', document_url: '/docs/nda-vendor.pdf', created_at: '2026-02-20T09:00:00Z', completed_at: null, signers: [{ name: 'Vendor Rep', email: 'rep@vendor.com', status: 'pending' }, { name: 'Chidi Eze', email: 'chidi@ecobank.com', status: 'signed' }] },
  { id: 'sig-doc-3', org_id: 'org-1', title: 'Benefits Election Form 2026', status: 'pending', signing_flow: 'sequential', created_by: 'emp-17', document_url: '/docs/benefits-election.pdf', created_at: '2026-02-25T11:00:00Z', completed_at: null, signers: [{ name: 'Ngozi Adeyemi', email: 'ngozi@ecobank.com', status: 'pending' }] },
]
export const demoSignatureTemplates = [
  { id: 'sig-tpl-1', org_id: 'org-1', name: 'Standard Employment Agreement', description: 'Standard employment agreement for full-time employees', document_url: '/templates/employment-agreement.pdf', signing_flow: 'sequential', signer_roles: [{ role: 'employee', order: 1 }, { role: 'hr_manager', order: 2 }], usage_count: 47, created_at: '2025-06-01T00:00:00Z' },
  { id: 'sig-tpl-2', org_id: 'org-1', name: 'Non-Disclosure Agreement', description: 'Standard NDA for contractors and vendors', document_url: '/templates/nda.pdf', signing_flow: 'parallel', signer_roles: [{ role: 'signer', order: 1 }, { role: 'company_rep', order: 1 }], usage_count: 23, created_at: '2025-08-15T00:00:00Z' },
]

// ─── E-Verify / I-9 ───
export const demoI9Forms = [
  { id: 'i9-1', org_id: 'org-1', employee_id: 'emp-4', status: 'completed', section1_completed_at: '2026-02-10T10:00:00Z', section2_completed_at: '2026-02-11T09:00:00Z', section3_completed_at: null, verifier_id: 'emp-17', documents: [{ type: 'passport', list: 'A', number: 'P****123', expiry: '2030-05-15' }], created_at: '2026-02-10T10:00:00Z' },
  { id: 'i9-2', org_id: 'org-1', employee_id: 'emp-10', status: 'pending_section2', section1_completed_at: '2026-02-03T11:00:00Z', section2_completed_at: null, section3_completed_at: null, verifier_id: null, documents: [], created_at: '2026-02-03T11:00:00Z' },
]
export const demoEverifyCases = [
  { id: 'ev-1', org_id: 'org-1', employee_id: 'emp-4', i9_form_id: 'i9-1', case_number: 'EV-2026-001234', status: 'employment_authorized', submitted_at: '2026-02-11T10:00:00Z', resolved_at: '2026-02-12T08:00:00Z', created_at: '2026-02-11T10:00:00Z' },
  { id: 'ev-2', org_id: 'org-1', employee_id: 'emp-30', i9_form_id: null, case_number: 'EV-2026-001567', status: 'pending_referral', submitted_at: '2026-02-20T14:00:00Z', resolved_at: null, created_at: '2026-02-20T14:00:00Z' },
]

// ─── PEO ───
export const demoPeoConfigurations = [
  { id: 'peo-1', org_id: 'org-1', provider_name: 'AfriPEO Solutions', status: 'active', countries: ['Nigeria', 'Ghana', 'Kenya'], employee_count: 45, monthly_fee_per_employee: 15000, contract_start: '2025-01-01', contract_end: '2026-12-31', services: ['payroll', 'benefits', 'compliance', 'risk_management'], created_at: '2025-01-01T00:00:00Z' },
]
export const demoCoEmploymentRecords = [
  { id: 'coemp-1', org_id: 'org-1', peo_config_id: 'peo-1', employee_id: 'emp-4', status: 'active', co_employer: 'AfriPEO Solutions', start_date: '2026-02-10', services: ['payroll', 'benefits'] },
]

// ─── Sandbox ───
export const demoSandboxEnvironments = [
  { id: 'sandbox-1', org_id: 'org-1', name: 'Staging - Q1 Config Test', status: 'active', type: 'full_clone', source_org_id: 'org-1', created_by: 'emp-1', data_masking: true, expires_at: '2026-04-01T00:00:00Z', created_at: '2026-02-01T00:00:00Z', last_refreshed_at: '2026-02-25T06:00:00Z' },
  { id: 'sandbox-2', org_id: 'org-1', name: 'Benefits Config Preview', status: 'active', type: 'partial_clone', source_org_id: 'org-1', created_by: 'emp-17', data_masking: true, expires_at: '2026-03-15T00:00:00Z', created_at: '2026-02-15T00:00:00Z', last_refreshed_at: '2026-02-20T06:00:00Z' },
]

// ─── Chat ───
export const demoChatChannels = [
  { id: 'chan-1', org_id: 'org-1', name: 'general', type: 'public', description: 'Company-wide announcements and general discussion', member_count: 50, created_by: 'emp-1', is_archived: false, last_message_at: '2026-02-28T16:30:00Z', created_at: '2025-01-01T00:00:00Z' },
  { id: 'chan-2', org_id: 'org-1', name: 'engineering', type: 'group', description: 'Engineering team discussions', member_count: 15, created_by: 'emp-3', is_archived: false, last_message_at: '2026-02-28T15:45:00Z', created_at: '2025-01-01T00:00:00Z' },
  { id: 'chan-3', org_id: 'org-1', name: 'hr-announcements', type: 'announcement', description: 'HR policy updates and announcements', member_count: 50, created_by: 'emp-17', is_archived: false, last_message_at: '2026-02-25T09:00:00Z', created_at: '2025-01-01T00:00:00Z' },
  { id: 'chan-4', org_id: 'org-1', name: 'product', type: 'group', description: 'Product team updates and planning', member_count: 10, created_by: 'emp-5', is_archived: false, last_message_at: '2026-02-27T18:00:00Z', created_at: '2025-02-01T00:00:00Z' },
  { id: 'chan-5', org_id: 'org-1', name: 'random', type: 'public', description: 'Non-work banter and fun', member_count: 45, created_by: 'emp-1', is_archived: false, last_message_at: '2026-02-28T12:00:00Z', created_at: '2025-01-01T00:00:00Z' },
]
export const demoChatMessages = [
  { id: 'cmsg-1', channel_id: 'chan-1', org_id: 'org-1', sender_id: 'emp-1', type: 'text', content: 'Welcome to Q1 2026! Excited about the roadmap ahead.', is_pinned: true, sent_at: '2026-01-06T09:00:00Z', created_at: '2026-01-06T09:00:00Z', reactions: [{ emoji: '🎉', users: ['emp-3', 'emp-5'] }] },
  { id: 'cmsg-2', channel_id: 'chan-2', org_id: 'org-1', sender_id: 'emp-3', type: 'text', content: 'Sprint planning is at 10am today in the main conference room.', sent_at: '2026-02-24T08:30:00Z', created_at: '2026-02-24T08:30:00Z', reactions: [{ emoji: '👍', users: ['emp-6', 'emp-7'] }] },
  { id: 'cmsg-3', channel_id: 'chan-1', org_id: 'org-1', sender_id: 'emp-1', type: 'text', content: 'Reminder: Q1 OKR reviews are due by end of this week. Please update your goals in the platform.', sent_at: '2026-02-28T09:00:00Z', created_at: '2026-02-28T09:00:00Z' },
  { id: 'cmsg-4', channel_id: 'chan-2', org_id: 'org-1', sender_id: 'emp-5', type: 'text', content: 'I\'ve pushed the API gateway changes to staging. Can someone review the PR?', sent_at: '2026-02-28T11:30:00Z', created_at: '2026-02-28T11:30:00Z' },
  { id: 'cmsg-5', channel_id: 'chan-3', org_id: 'org-1', sender_id: 'emp-17', type: 'announcement', content: 'Benefits open enrollment closes March 15. We still have 12 employees who haven\'t made selections.', is_pinned: true, sent_at: '2026-02-28T10:00:00Z', created_at: '2026-02-28T10:00:00Z' },
  { id: 'cmsg-6', channel_id: 'chan-4', org_id: 'org-1', sender_id: 'emp-5', type: 'text', content: 'Product roadmap for Q2 is finalized. Key focus areas: mobile-first UX, compliance automation, and AI-powered analytics.', sent_at: '2026-02-27T18:00:00Z', created_at: '2026-02-27T18:00:00Z' },
  { id: 'cmsg-7', channel_id: 'chan-5', org_id: 'org-1', sender_id: 'emp-3', type: 'text', content: 'Has anyone tried the new jollof rice place near the Accra office? Highly recommend!', sent_at: '2026-02-28T12:00:00Z', created_at: '2026-02-28T12:00:00Z' },
  { id: 'cmsg-8', channel_id: 'chan-1', org_id: 'org-1', sender_id: 'emp-17', type: 'text', content: 'New compliance training module is now available in the Learning hub. All employees must complete it by March 31.', sent_at: '2026-02-28T16:30:00Z', created_at: '2026-02-28T16:30:00Z' },
]
export const demoChatParticipants = [
  { id: 'cp-1', channel_id: 'chan-1', employee_id: 'emp-1', role: 'owner', joined_at: '2025-01-01T00:00:00Z' },
  { id: 'cp-2', channel_id: 'chan-1', employee_id: 'emp-3', role: 'member', joined_at: '2025-01-01T00:00:00Z' },
  { id: 'cp-3', channel_id: 'chan-1', employee_id: 'emp-5', role: 'member', joined_at: '2025-01-01T00:00:00Z' },
  { id: 'cp-4', channel_id: 'chan-1', employee_id: 'emp-17', role: 'member', joined_at: '2025-01-01T00:00:00Z' },
  { id: 'cp-5', channel_id: 'chan-2', employee_id: 'emp-3', role: 'owner', joined_at: '2025-01-15T00:00:00Z' },
  { id: 'cp-6', channel_id: 'chan-2', employee_id: 'emp-5', role: 'member', joined_at: '2025-01-15T00:00:00Z' },
  { id: 'cp-7', channel_id: 'chan-3', employee_id: 'emp-17', role: 'owner', joined_at: '2025-01-15T00:00:00Z' },
  { id: 'cp-8', channel_id: 'chan-3', employee_id: 'emp-1', role: 'member', joined_at: '2025-01-15T00:00:00Z' },
  { id: 'cp-9', channel_id: 'chan-4', employee_id: 'emp-5', role: 'owner', joined_at: '2025-02-01T00:00:00Z' },
  { id: 'cp-10', channel_id: 'chan-5', employee_id: 'emp-1', role: 'owner', joined_at: '2025-01-01T00:00:00Z' },
  { id: 'cp-11', channel_id: 'chan-5', employee_id: 'emp-3', role: 'member', joined_at: '2025-01-01T00:00:00Z' },
]

// ─── IT Cloud: Provisioning Rules ───
export const demoProvisioningRules = [
  { id: 'pr-1', org_id: 'org-1', name: 'All New Hires — Core Apps', trigger: 'on_hire', department: null, role: null, apps: ['Slack', 'Zoom', '1Password', 'Chrome', 'Microsoft 365', 'CrowdStrike'], is_active: true, created_at: '2025-09-01' },
  { id: 'pr-2', org_id: 'org-1', name: 'Engineering — Dev Tools', trigger: 'department_change', department: 'Engineering', role: null, apps: ['GitHub', 'VS Code', 'Docker', 'Jira', 'Datadog', 'Terraform'], is_active: true, created_at: '2025-09-01' },
  { id: 'pr-3', org_id: 'org-1', name: 'HR — People Tools', trigger: 'department_change', department: 'Human Resources', role: null, apps: ['BambooHR', 'Greenhouse', 'DocuSign'], is_active: true, created_at: '2025-09-15' },
  { id: 'pr-4', org_id: 'org-1', name: 'Finance — Financial Apps', trigger: 'department_change', department: 'Finance', role: null, apps: ['QuickBooks', 'Expensify', 'Stripe Dashboard'], is_active: true, created_at: '2025-09-15' },
  { id: 'pr-5', org_id: 'org-1', name: 'Manager — Management Suite', trigger: 'role_change', department: null, role: 'manager', apps: ['15Five', 'Lattice', 'Culture Amp'], is_active: true, created_at: '2025-10-01' },
  { id: 'pr-6', org_id: 'org-1', name: 'Offboarding — Revoke All', trigger: 'on_offboard', department: null, role: null, apps: ['ALL_APPS'], is_active: true, created_at: '2025-10-01' },
  { id: 'pr-7', org_id: 'org-1', name: 'Sales — CRM Stack', trigger: 'department_change', department: 'Sales', role: null, apps: ['Salesforce', 'Gong', 'HubSpot', 'LinkedIn Sales Nav'], is_active: false, created_at: '2025-11-01' },
]

// ─── IT Cloud: Encryption Policies ───
export const demoEncryptionPolicies = [
  { id: 'ep-1', org_id: 'org-1', name: 'macOS FileVault Enforcement', platform: 'macos', encryption_type: 'FileVault', enforced: true, recovery_key_escrowed: true, grace_period_hours: 24, applies_to: 'All macOS Devices', compliant_count: 28, total_count: 32, created_at: '2025-06-01', last_updated: '2025-12-10' },
  { id: 'ep-2', org_id: 'org-1', name: 'Windows BitLocker Enforcement', platform: 'windows', encryption_type: 'BitLocker', enforced: true, recovery_key_escrowed: true, grace_period_hours: 48, applies_to: 'All Windows Devices', compliant_count: 15, total_count: 18, created_at: '2025-06-01', last_updated: '2025-11-20' },
  { id: 'ep-3', org_id: 'org-1', name: 'Linux LUKS Policy', platform: 'linux', encryption_type: 'LUKS', enforced: false, recovery_key_escrowed: false, grace_period_hours: 72, applies_to: 'Developer Linux Machines', compliant_count: 3, total_count: 5, created_at: '2025-08-01', last_updated: '2026-01-15' },
  { id: 'ep-4', org_id: 'org-1', name: 'Universal Encryption Standard', platform: 'all', encryption_type: 'Platform Default', enforced: true, recovery_key_escrowed: true, grace_period_hours: 24, applies_to: 'All Company Devices', compliant_count: 46, total_count: 55, created_at: '2025-09-01', last_updated: '2026-02-01' },
]

// ─── Identity: SCIM Providers ───
export const demoScimProviders = [
  { id: 'scim-1', org_id: 'org-1', name: 'Azure AD SCIM', status: 'active', endpoint: 'https://scim.ecobank.com/v2/azure', last_sync: '2026-02-28T06:00:00Z', synced_users: 48, synced_groups: 6, auto_provision: true, auto_deprovision: true, sync_interval: 15 },
  { id: 'scim-2', org_id: 'org-1', name: 'Okta SCIM', status: 'inactive', endpoint: 'https://scim.ecobank.com/v2/okta', last_sync: '2026-01-15T12:00:00Z', synced_users: 0, synced_groups: 0, auto_provision: false, auto_deprovision: false, sync_interval: 30 },
]

// ─── Compliance: Auto-Detection Scans ───
export const demoAutoDetectionScans = [
  { id: 'ad-1', org_id: 'org-1', scan_date: '2026-02-28', module: 'Payroll', rule_violated: 'Overtime limit exceeded (>48h/week)', severity: 'high', employee: 'Adaeze Okonkwo', status: 'pending_review' },
  { id: 'ad-2', org_id: 'org-1', scan_date: '2026-02-28', module: 'Leave', rule_violated: 'Negative PTO balance', severity: 'medium', employee: 'Kofi Mensah', status: 'auto_resolved' },
  { id: 'ad-3', org_id: 'org-1', scan_date: '2026-02-27', module: 'Data Privacy', rule_violated: 'GDPR consent expired for 3 records', severity: 'critical', employee: null, status: 'escalated' },
  { id: 'ad-4', org_id: 'org-1', scan_date: '2026-02-27', module: 'Benefits', rule_violated: 'Dependent age-out not processed', severity: 'medium', employee: 'Fatoumata Diallo', status: 'pending_review' },
  { id: 'ad-5', org_id: 'org-1', scan_date: '2026-02-26', module: 'Time Tracking', rule_violated: 'Missing clock-out for 5 consecutive days', severity: 'high', employee: 'Emeka Nwosu', status: 'pending_review' },
  { id: 'ad-6', org_id: 'org-1', scan_date: '2026-02-26', module: 'Expenses', rule_violated: 'Duplicate receipt detected (>95% match)', severity: 'medium', employee: 'Ama Serwaa', status: 'dismissed' },
  { id: 'ad-7', org_id: 'org-1', scan_date: '2026-02-25', module: 'Onboarding', rule_violated: 'I-9 verification overdue (>3 business days)', severity: 'critical', employee: 'New Hire — James Obi', status: 'pending_review' },
  { id: 'ad-8', org_id: 'org-1', scan_date: '2026-02-25', module: 'Safety', rule_violated: 'Workplace injury report not filed within 24h', severity: 'high', employee: 'Kwesi Asante', status: 'auto_resolved' },
  { id: 'ad-9', org_id: 'org-1', scan_date: '2026-02-24', module: 'Payroll', rule_violated: 'Tax withholding mismatch (W-4 vs actual)', severity: 'medium', employee: 'Nana Agyeman', status: 'pending_review' },
  { id: 'ad-10', org_id: 'org-1', scan_date: '2026-02-24', module: 'Immigration', rule_violated: 'Work permit expiring within 30 days', severity: 'high', employee: 'Pierre Dubois', status: 'pending_review' },
]

// ─── Interview Recording ───
export const demoInterviewRecordings = [
  { id: 'rec-1', org_id: 'org-1', application_id: 'app-1', interview_type: 'technical', interviewer_ids: ['emp-3', 'emp-6'], status: 'completed', recording_url: '/recordings/rec-1.webm', duration: 2700, scheduled_at: '2026-02-15T14:00:00Z', recorded_at: '2026-02-15T14:00:00Z', metadata: { platform: 'tempo_meet', resolution: '1080p', format: 'webm' }, created_at: '2026-02-15T10:00:00Z' },
  { id: 'rec-2', org_id: 'org-1', application_id: 'app-2', interview_type: 'behavioral', interviewer_ids: ['emp-17'], status: 'processing', recording_url: '/recordings/rec-2.webm', duration: 1800, scheduled_at: '2026-02-20T10:00:00Z', recorded_at: '2026-02-20T10:00:00Z', metadata: { platform: 'tempo_meet', resolution: '1080p', format: 'webm' }, created_at: '2026-02-20T08:00:00Z' },
]
export const demoInterviewTranscriptions = [
  { id: 'trans-1', org_id: 'org-1', recording_id: 'rec-1', full_text: 'Interviewer: Tell me about your experience with distributed systems...', summary: 'Strong technical candidate with deep distributed systems knowledge. Demonstrated clear problem-solving approach.', key_topics: ['distributed systems', 'microservices', 'scalability', 'CAP theorem'], sentiment: { overall: 0.82, per_speaker: {} }, ai_scorecard: { overall: 85, technical_skills: { score: 90, weight: 0.35 }, communication: { score: 80, weight: 0.25 }, problem_solving: { score: 88, weight: 0.25 }, culture_fit: { score: 78, weight: 0.15 }, recommendation: 'hire', confidence: 0.87 }, language: 'en', processed_at: '2026-02-15T16:00:00Z', created_at: '2026-02-15T15:00:00Z' },
]

// ─── Video Screens ───
export const demoVideoScreenTemplates = [
  { id: 'vst-1', org_id: 'org-1', title: 'Software Engineer Screen', description: 'Standard one-way video screen for engineering roles', questions: [{ text: 'Walk us through a challenging technical problem you solved recently.', time_limit: 180, order: 1 }, { text: 'How do you approach code reviews?', time_limit: 120, order: 2 }, { text: 'Describe your experience with CI/CD pipelines.', time_limit: 120, order: 3 }], time_limit_total: 600, created_by: 'emp-3', created_at: '2026-01-10T00:00:00Z' },
]
export const demoVideoScreenInvites: any[] = []
export const demoVideoScreenResponses: any[] = []

// ─── Corporate Cards ───
export const demoCorporateCards = [
  { id: 'card-1', org_id: 'org-1', employee_id: 'emp-1', card_type: 'virtual', last_four: '4821', status: 'active', spend_limit: 500000, spent_this_month: 125000, currency: 'USD', issued_at: '2025-06-01T00:00:00Z', merchant_categories: ['travel', 'software', 'office_supplies'] },
  { id: 'card-2', org_id: 'org-1', employee_id: 'emp-3', card_type: 'physical', last_four: '7392', status: 'active', spend_limit: 300000, spent_this_month: 89500, currency: 'USD', issued_at: '2025-08-15T00:00:00Z', merchant_categories: ['software', 'cloud_services', 'books'] },
  { id: 'card-3', org_id: 'org-1', employee_id: 'emp-17', card_type: 'virtual', last_four: '1056', status: 'active', spend_limit: 200000, spent_this_month: 34200, currency: 'USD', issued_at: '2026-01-10T00:00:00Z', merchant_categories: ['office_supplies', 'recruiting'] },
]
export const demoCardTransactions = [
  { id: 'txn-1', org_id: 'org-1', card_id: 'card-1', amount: 45000, currency: 'USD', merchant: 'AWS Cloud Services', category: 'cloud_services', status: 'settled', transaction_date: '2026-02-20T15:30:00Z', receipt_url: '/receipts/txn-1.pdf' },
  { id: 'txn-2', org_id: 'org-1', card_id: 'card-2', amount: 12500, currency: 'USD', merchant: 'GitHub Enterprise', category: 'software', status: 'settled', transaction_date: '2026-02-18T10:00:00Z', receipt_url: '/receipts/txn-2.pdf' },
  { id: 'txn-3', org_id: 'org-1', card_id: 'card-1', amount: 28000, currency: 'USD', merchant: 'Hilton Hotels', category: 'travel', status: 'pending', transaction_date: '2026-02-25T08:00:00Z', receipt_url: null },
]

// ─── Bill Pay ───
export const demoBillPayments = [
  { id: 'bp-1', org_id: 'org-1', vendor_id: 'vendor-1', amount: 1250000, currency: 'USD', method: 'ach', status: 'paid', scheduled_date: '2026-02-01', paid_date: '2026-02-01', reference_number: 'BP-001234', memo: 'Monthly cloud infrastructure', created_by: 'emp-1', created_at: '2026-01-28T10:00:00Z' },
  { id: 'bp-2', org_id: 'org-1', vendor_id: 'vendor-2', amount: 450000, currency: 'USD', method: 'wire', status: 'scheduled', scheduled_date: '2026-03-01', paid_date: null, reference_number: 'BP-001567', memo: 'Q1 consulting fees', created_by: 'emp-1', created_at: '2026-02-20T14:00:00Z' },
]
export const demoBillPaySchedules = [
  { id: 'bps-1', org_id: 'org-1', vendor_id: 'vendor-1', amount: 1250000, currency: 'USD', method: 'ach', frequency: 'monthly', next_payment_date: '2026-03-01', end_date: null, is_active: true, created_at: '2025-06-01T00:00:00Z' },
]

// ─── Travel Management ───
export const demoTravelRequests = [
  { id: 'travel-1', org_id: 'org-1', employee_id: 'emp-3', destination: 'Lagos, Nigeria', purpose: 'Client onsite meeting', travel_dates: { start: '2026-03-15', end: '2026-03-18' }, estimated_cost: 350000, status: 'approved', approved_by: 'emp-1', submitted_at: '2026-02-20T10:00:00Z' },
  { id: 'travel-2', org_id: 'org-1', employee_id: 'emp-6', destination: 'Nairobi, Kenya', purpose: 'Engineering conference', travel_dates: { start: '2026-04-10', end: '2026-04-14' }, estimated_cost: 480000, status: 'pending', approved_by: null, submitted_at: '2026-02-25T14:00:00Z' },
]
export const demoTravelBookings = [
  { id: 'booking-1', org_id: 'org-1', travel_request_id: 'travel-1', type: 'flight', provider: 'Ethiopian Airlines', details: { departure: 'ACC', arrival: 'LOS', date: '2026-03-15', class: 'business' }, cost: 185000, currency: 'USD', confirmation_number: 'ET-789456', status: 'confirmed', booked_at: '2026-02-22T10:00:00Z' },
  { id: 'booking-2', org_id: 'org-1', travel_request_id: 'travel-1', type: 'hotel', provider: 'Marriott Lagos', details: { check_in: '2026-03-15', check_out: '2026-03-18', room_type: 'standard' }, cost: 120000, currency: 'USD', confirmation_number: 'MAR-123456', status: 'confirmed', booked_at: '2026-02-22T10:30:00Z' },
]
export const demoTravelPolicies = [
  { id: 'tpol-1', org_id: 'org-1', name: 'Standard Travel Policy', description: 'Default travel policy for all employees', is_active: true, rules: { max_flight_class: 'economy', max_hotel_rate: 25000, meal_per_diem: 7500, advance_booking_days: 14, requires_approval_above: 200000 }, applicable_departments: null },
]

// ─── Procurement ───
export const demoPurchaseOrders = [
  { id: 'po-1', org_id: 'org-1', vendor_id: 'vendor-1', po_number: 'PO-2026-001', status: 'approved', total_amount: 2500000, currency: 'USD', items: [{ description: 'Annual AWS Enterprise Support', qty: 1, unit_price: 2500000 }], approved_by: 'emp-1', created_by: 'emp-3', created_at: '2026-01-10T10:00:00Z' },
  { id: 'po-2', org_id: 'org-1', vendor_id: 'vendor-3', po_number: 'PO-2026-002', status: 'pending', total_amount: 850000, currency: 'USD', items: [{ description: 'Office furniture - Standing desks', qty: 25, unit_price: 34000 }], approved_by: null, created_by: 'emp-17', created_at: '2026-02-15T14:00:00Z' },
]
export const demoPurchaseOrderItems: any[] = []
export const demoProcurementRequests = [
  { id: 'preq-1', org_id: 'org-1', title: 'New development laptops', description: 'MacBook Pro M4 for engineering team expansion', requested_by: 'emp-3', department_id: 'dept-1', estimated_budget: 750000, currency: 'USD', urgency: 'medium', status: 'approved', approved_by: 'emp-1', submitted_at: '2026-02-10T10:00:00Z' },
]

// ─── Multi-currency ───
export const demoCurrencyAccounts = [
  { id: 'fxacct-1', org_id: 'org-1', currency: 'NGN', balance: 150000000, bank_name: 'Ecobank Nigeria', account_number: '****4521', is_primary: true },
  { id: 'fxacct-2', org_id: 'org-1', currency: 'USD', balance: 5000000, bank_name: 'Ecobank Group', account_number: '****7890', is_primary: false },
  { id: 'fxacct-3', org_id: 'org-1', currency: 'GHS', balance: 2500000, bank_name: 'Ecobank Ghana', account_number: '****3456', is_primary: false },
  { id: 'fxacct-4', org_id: 'org-1', currency: 'KES', balance: 8000000, bank_name: 'Ecobank Kenya', account_number: '****6789', is_primary: false },
]
export const demoFxTransactions = [
  { id: 'fx-1', org_id: 'org-1', from_currency: 'USD', to_currency: 'NGN', from_amount: 100000, to_amount: 156000000, exchange_rate: 1560.0, fee: 500, status: 'completed', executed_at: '2026-02-15T10:00:00Z' },
  { id: 'fx-2', org_id: 'org-1', from_currency: 'USD', to_currency: 'GHS', from_amount: 50000, to_amount: 775000, exchange_rate: 15.5, fee: 250, status: 'completed', executed_at: '2026-02-20T14:00:00Z' },
]

// ─── 401(k) / Retirement ───
export const demoRetirementPlans = [
  { id: 'rplan-1', org_id: 'org-1', name: 'Ecobank 401(k) Plan', type: 'traditional_401k', status: 'active', employer_match_percent: 100, employer_match_cap: 6, vesting_schedule: [{ years: 0, percent: 0 }, { years: 1, percent: 20 }, { years: 2, percent: 40 }, { years: 3, percent: 60 }, { years: 4, percent: 80 }, { years: 5, percent: 100 }], auto_enrollment: true, auto_escalation: true, default_contribution_percent: 3, created_at: '2025-01-01T00:00:00Z' },
]
export const demoRetirementEnrollments = [
  { id: 'renr-1', org_id: 'org-1', plan_id: 'rplan-1', employee_id: 'emp-1', contribution_percent: 10, enrolled_at: '2025-01-15', investment_elections: [{ fund: 'S&P 500 Index', ticker: 'VFIAX', percent: 60 }, { fund: 'Bond Index', ticker: 'VBTLX', percent: 30 }, { fund: 'International', ticker: 'VTIAX', percent: 10 }], beneficiaries: [{ name: 'Spouse Okafor', relationship: 'spouse', percent: 100, is_primary: true }] },
  { id: 'renr-2', org_id: 'org-1', plan_id: 'rplan-1', employee_id: 'emp-3', contribution_percent: 6, enrolled_at: '2025-03-01', investment_elections: [{ fund: 'Target Date 2055', ticker: 'VFFVX', percent: 100 }], beneficiaries: [] },
]
export const demoRetirementContributions = [
  { id: 'rcon-1', org_id: 'org-1', plan_id: 'rplan-1', employee_id: 'emp-1', period: '2026-02', employee_amount: 83333, employer_amount: 50000, created_at: '2026-02-28T00:00:00Z' },
  { id: 'rcon-2', org_id: 'org-1', plan_id: 'rplan-1', employee_id: 'emp-3', period: '2026-02', employee_amount: 45000, employer_amount: 45000, created_at: '2026-02-28T00:00:00Z' },
]

// ─── Carrier Integration ───
export const demoCarrierIntegrations = [
  { id: 'carrier-1', org_id: 'org-1', carrier_name: 'Blue Cross Blue Shield', carrier_code: 'BCBS', integration_type: 'edi_834', status: 'active', last_sync_at: '2026-02-28T06:00:00Z', sync_frequency: 'daily', error_count: 0, enrolled_lives: 42, created_at: '2025-06-01T00:00:00Z' },
  { id: 'carrier-2', org_id: 'org-1', carrier_name: 'Delta Dental', carrier_code: 'DELTA', integration_type: 'api', status: 'active', last_sync_at: '2026-02-28T06:00:00Z', sync_frequency: 'weekly', error_count: 0, enrolled_lives: 38, created_at: '2025-06-01T00:00:00Z' },
]
export const demoEnrollmentFeeds = [
  { id: 'feed-1', org_id: 'org-1', carrier_id: 'carrier-1', feed_type: 'full_file', status: 'delivered', record_count: 42, error_count: 0, generated_at: '2026-02-28T06:00:00Z', delivered_at: '2026-02-28T06:05:00Z' },
]

// ─── Geofencing ───
export const demoGeofenceZones = [
  { id: 'zone-1', org_id: 'org-1', name: 'Ecobank HQ - Accra', type: 'circle', latitude: 5.6037, longitude: -0.1870, radius: 200, address: '2 Adjuma Crescent, Accra, Ghana', is_active: true, auto_clock: true, notification_enabled: true, assigned_employees: ['emp-1', 'emp-3', 'emp-5', 'emp-6'], assigned_departments: ['dept-1', 'dept-2'] },
  { id: 'zone-2', org_id: 'org-1', name: 'Lagos Office', type: 'circle', latitude: 6.4541, longitude: 3.3947, radius: 150, address: '21 Ademola Adetokunbo St, Victoria Island, Lagos', is_active: true, auto_clock: true, notification_enabled: true, assigned_employees: [], assigned_departments: ['dept-3'] },
]
export const demoGeofenceEvents = [
  { id: 'gfev-1', org_id: 'org-1', zone_id: 'zone-1', employee_id: 'emp-3', event_type: 'entry', latitude: 5.6038, longitude: -0.1869, is_within_zone: true, distance_from_center: 15, timestamp: '2026-02-28T08:02:00Z' },
  { id: 'gfev-2', org_id: 'org-1', zone_id: 'zone-1', employee_id: 'emp-3', event_type: 'exit', latitude: 5.6055, longitude: -0.1890, is_within_zone: false, distance_from_center: 250, timestamp: '2026-02-28T17:35:00Z' },
]

// ─── Identity Provider ───
export const demoIdpConfigurations = [
  { id: 'idp-1', org_id: 'org-1', name: 'Ecobank SSO', protocol: 'saml', status: 'active', entity_id: 'https://sso.ecobank.com', sso_url: 'https://sso.ecobank.com/saml2/sso', certificate_expires_at: '2027-06-15', user_count: 50, created_at: '2025-01-01T00:00:00Z' },
]
export const demoSamlApps = [
  { id: 'saml-1', org_id: 'org-1', idp_id: 'idp-1', name: 'Slack', logo_url: '/logos/slack.png', sso_url: 'https://ecobank.slack.com/sso', status: 'active', user_count: 48, last_login_at: '2026-02-28T10:00:00Z', created_at: '2025-03-01T00:00:00Z' },
  { id: 'saml-2', org_id: 'org-1', idp_id: 'idp-1', name: 'GitHub Enterprise', logo_url: '/logos/github.png', sso_url: 'https://github.com/enterprises/ecobank/sso', status: 'active', user_count: 15, last_login_at: '2026-02-28T09:00:00Z', created_at: '2025-03-01T00:00:00Z' },
  { id: 'saml-3', org_id: 'org-1', idp_id: 'idp-1', name: 'Jira', logo_url: '/logos/jira.png', sso_url: 'https://ecobank.atlassian.net/sso', status: 'active', user_count: 35, last_login_at: '2026-02-28T11:00:00Z', created_at: '2025-04-01T00:00:00Z' },
]
export const demoMfaPolicies = [
  { id: 'mfa-1', org_id: 'org-1', name: 'Company-wide MFA', is_active: true, methods: ['authenticator', 'sms', 'hardware_key'], grace_period_days: 7, applies_to: 'all', enrollment_rate: 96, created_at: '2025-01-01T00:00:00Z' },
]

// ─── Zero-touch Deployment ───
export const demoDeploymentProfiles = [
  { id: 'deploy-1', org_id: 'org-1', name: 'Standard Engineering Mac', platform: 'macos', os_version: '15.2', apps: ['Chrome', 'VS Code', 'Slack', 'Docker', 'iTerm2'], policies: ['disk_encryption', 'firewall', 'auto_update'], wifi_config: { ssid: 'EcoNet-Secure', security: 'WPA3' }, device_count: 15, created_at: '2025-06-01T00:00:00Z' },
  { id: 'deploy-2', org_id: 'org-1', name: 'Standard Windows Workstation', platform: 'windows', os_version: '11', apps: ['Chrome', 'Microsoft 365', 'Slack', 'Teams'], policies: ['bitlocker', 'windows_firewall', 'auto_update'], wifi_config: { ssid: 'EcoNet-Secure', security: 'WPA3' }, device_count: 30, created_at: '2025-06-01T00:00:00Z' },
]
export const demoEnrollmentTokens = [
  { id: 'token-1', org_id: 'org-1', profile_id: 'deploy-1', token: 'ECO-MAC-****-ABCD', status: 'active', used_count: 12, max_uses: 50, expires_at: '2026-12-31T00:00:00Z', created_at: '2026-01-01T00:00:00Z' },
]

// ─── Password Manager ───
export const demoPasswordVaults = [
  { id: 'vault-1', org_id: 'org-1', name: 'Engineering Team', owner_id: 'emp-3', member_count: 15, item_count: 45, created_at: '2025-06-01T00:00:00Z' },
  { id: 'vault-2', org_id: 'org-1', name: 'HR & Admin', owner_id: 'emp-17', member_count: 8, item_count: 28, created_at: '2025-06-01T00:00:00Z' },
  { id: 'vault-3', org_id: 'org-1', name: 'Company Shared', owner_id: 'emp-1', member_count: 50, item_count: 15, created_at: '2025-01-01T00:00:00Z' },
]
export const demoVaultItems = [
  { id: 'vi-1', vault_id: 'vault-1', name: 'AWS Root Account', type: 'login', url: 'https://aws.amazon.com', username: 'admin@ecobank.com', strength: 'strong', last_used_at: '2026-02-28T10:00:00Z', created_at: '2025-06-01T00:00:00Z' },
  { id: 'vi-2', vault_id: 'vault-1', name: 'GitHub Org Token', type: 'api_key', url: 'https://github.com', strength: 'strong', last_used_at: '2026-02-27T14:00:00Z', expires_at: '2026-06-01T00:00:00Z', created_at: '2025-09-01T00:00:00Z' },
  { id: 'vi-3', vault_id: 'vault-3', name: 'Building WiFi', type: 'wifi', strength: 'strong', last_used_at: null, created_at: '2025-01-01T00:00:00Z' },
]

// ─── Device Store / Buyback ───
export const demoDeviceStoreCatalog = [
  { id: 'dsc-1', org_id: 'org-1', name: 'MacBook Pro 16" M4 Pro', category: 'laptop', brand: 'Apple', price: 249900, currency: 'USD', specs: { processor: 'M4 Pro', ram: '36GB', storage: '512GB SSD', display: '16.2" Liquid Retina XDR' }, in_stock: 8, image_url: '/devices/mbp16.png' },
  { id: 'dsc-2', org_id: 'org-1', name: 'Dell UltraSharp 27" 4K Monitor', category: 'monitor', brand: 'Dell', price: 44999, currency: 'USD', specs: { resolution: '3840x2160', panel: 'IPS', refresh_rate: '60Hz', ports: ['USB-C', 'HDMI', 'DisplayPort'] }, in_stock: 15, image_url: '/devices/dell27.png' },
  { id: 'dsc-3', org_id: 'org-1', name: 'iPhone 16 Pro', category: 'phone', brand: 'Apple', price: 99900, currency: 'USD', specs: { storage: '256GB', color: 'Natural Titanium', carrier: 'Unlocked' }, in_stock: 5, image_url: '/devices/iphone16.png' },
]
export const demoDeviceOrders = [
  { id: 'dord-1', org_id: 'org-1', employee_id: 'emp-10', catalog_item_id: 'dsc-1', status: 'delivered', ordered_at: '2026-02-01T10:00:00Z', shipped_at: '2026-02-03T14:00:00Z', delivered_at: '2026-02-05T09:00:00Z', tracking_number: 'FDX-123456789' },
  { id: 'dord-2', org_id: 'org-1', employee_id: 'emp-30', catalog_item_id: 'dsc-1', status: 'processing', ordered_at: '2026-02-25T11:00:00Z', shipped_at: null, delivered_at: null, tracking_number: null },
]
export const demoBuybackRequests = [
  { id: 'bb-1', org_id: 'org-1', employee_id: 'emp-7', device_name: 'MacBook Pro 14" M2 Pro', condition: 'good', estimated_value: 85000, status: 'approved', submitted_at: '2026-02-15T10:00:00Z', approved_at: '2026-02-18T14:00:00Z' },
]

// ─── App Builder ───
export const demoCustomApps = [
  { id: 'app-builder-1', org_id: 'org-1', name: 'Equipment Tracker', description: 'Track office equipment assignments and maintenance', slug: 'equipment-tracker', status: 'published', version: 3, icon: 'monitor', created_by: 'emp-3', published_by: 'emp-1', published_at: '2026-02-01T00:00:00Z', access_roles: null, created_at: '2026-01-15T00:00:00Z' },
  { id: 'app-builder-2', org_id: 'org-1', name: 'Visitor Management', description: 'Front desk visitor check-in and badge printing', slug: 'visitor-mgmt', status: 'draft', version: 1, icon: 'users', created_by: 'emp-17', published_by: null, published_at: null, access_roles: ['hr', 'admin'], created_at: '2026-02-20T00:00:00Z' },
]
export const demoAppPages: any[] = [
  { id: 'page-1', app_id: 'app-builder-1', name: 'Dashboard', slug: 'dashboard', is_home_page: true, order_index: 0, icon: 'layout' },
  { id: 'page-2', app_id: 'app-builder-1', name: 'Equipment List', slug: 'equipment', is_home_page: false, order_index: 1, icon: 'list' },
]
export const demoAppComponents: any[] = []
export const demoAppDataSources: any[] = []

// ─── RQL ───
export const demoSavedQueries = [
  { id: 'query-1', org_id: 'org-1', name: 'Headcount by Department', description: 'Active employee count grouped by department', query: 'SELECT department, COUNT(*) as headcount FROM employees WHERE is_active = true GROUP BY department', status: 'active', is_public: true, created_by: 'emp-1', run_count: 156, avg_execution_ms: 45, last_run_at: '2026-02-28T10:00:00Z', created_at: '2025-06-01T00:00:00Z' },
  { id: 'query-2', org_id: 'org-1', name: 'Monthly Expense Trends', description: 'Expense report totals by month for the past 12 months', query: 'SELECT DATE_TRUNC(month, submitted_at) as month, SUM(total_amount) as total FROM expense_reports WHERE submitted_at > NOW() - INTERVAL 12 MONTH GROUP BY month', status: 'active', is_public: true, created_by: 'emp-3', run_count: 89, avg_execution_ms: 120, last_run_at: '2026-02-27T14:00:00Z', created_at: '2025-09-01T00:00:00Z' },
]
export const demoQuerySchedules = [
  { id: 'qsched-1', org_id: 'org-1', query_id: 'query-1', frequency: 'weekly', recipients: [{ email: 'ceo@ecobank.com', channel: 'email' }], format: 'pdf', next_run_at: '2026-03-03T08:00:00Z', last_run_at: '2026-02-24T08:00:00Z', is_active: true, created_at: '2025-09-01T00:00:00Z' },
]

// ─── EOR ───
export const demoEorEntities = [
  { id: 'eor-1', org_id: 'org-1', country: 'United Kingdom', country_code: 'GB', legal_entity_name: 'Ecobank UK Ltd (via EOR)', partner_name: 'Remote.com', status: 'active', currency: 'GBP', monthly_fee: 59900, employee_count: 3, contract_start_date: '2025-06-01', benefits: { health: 'NHS + Private', retirement: 'Workplace Pension', leave: '28 days annual' }, created_at: '2025-06-01T00:00:00Z' },
  { id: 'eor-2', org_id: 'org-1', country: 'Germany', country_code: 'DE', legal_entity_name: 'Ecobank GmbH (via EOR)', partner_name: 'Deel', status: 'active', currency: 'EUR', monthly_fee: 69900, employee_count: 2, contract_start_date: '2025-09-01', benefits: { health: 'Statutory + Supplemental', retirement: 'Riester', leave: '30 days annual' }, created_at: '2025-09-01T00:00:00Z' },
]
export const demoEorEmployees = [
  { id: 'eoremp-1', org_id: 'org-1', eor_entity_id: 'eor-1', full_name: 'James Wilson', email: 'james.wilson@ecobank.com', job_title: 'Senior Backend Engineer', status: 'active', salary: 8500000, currency: 'GBP', start_date: '2025-07-01', contract_type: 'full_time', created_at: '2025-06-15T00:00:00Z' },
  { id: 'eoremp-2', org_id: 'org-1', eor_entity_id: 'eor-2', full_name: 'Anna Schmidt', email: 'anna.schmidt@ecobank.com', job_title: 'Product Manager', status: 'active', salary: 7500000, currency: 'EUR', start_date: '2025-10-01', contract_type: 'full_time', created_at: '2025-09-15T00:00:00Z' },
]
export const demoEorContracts = [
  { id: 'eorc-1', org_id: 'org-1', eor_employee_id: 'eoremp-1', contract_type: 'employment_agreement', status: 'active', effective_date: '2025-07-01', terms: { probation_period: '6 months', notice_period: '3 months' }, signed_at: '2025-06-20T00:00:00Z', created_at: '2025-06-15T00:00:00Z' },
]

// ─── Contractor of Record ───
export const demoCorContractors = [
  { id: 'cor-1', org_id: 'org-1', full_name: 'Carlos Mendez', email: 'carlos@freelance.dev', country: 'Colombia', status: 'active', job_title: 'Mobile Developer', rate: 7500, rate_type: 'hourly', currency: 'USD', payment_frequency: 'biweekly', start_date: '2025-11-01', compliance_status: 'compliant', tax_classification: 'independent_contractor', misclassification_risk: 'low', created_at: '2025-10-15T00:00:00Z' },
  { id: 'cor-2', org_id: 'org-1', full_name: 'Priya Sharma', email: 'priya@design.studio', country: 'India', status: 'active', job_title: 'UX Design Lead', rate: 500000, rate_type: 'monthly', currency: 'USD', payment_frequency: 'monthly', start_date: '2026-01-01', compliance_status: 'compliant', tax_classification: 'sole_proprietor', misclassification_risk: 'low', created_at: '2025-12-15T00:00:00Z' },
]
export const demoCorContracts = [
  { id: 'corc-1', org_id: 'org-1', contractor_id: 'cor-1', contract_type: 'sow', title: 'Mobile App Development - Phase 2', status: 'active', scope_of_work: 'Build and deliver mobile app features per sprint backlog', total_value: 4800000, currency: 'USD', start_date: '2025-11-01', end_date: '2026-04-30', signed_at: '2025-10-28T00:00:00Z', created_at: '2025-10-15T00:00:00Z' },
]
export const demoCorPayments = [
  { id: 'corp-1', org_id: 'org-1', contractor_id: 'cor-1', contract_id: 'corc-1', amount: 120000, currency: 'USD', status: 'paid', period_start: '2026-02-01', period_end: '2026-02-15', hours_worked: 80, payment_method: 'bank_transfer', paid_at: '2026-02-20T00:00:00Z', created_at: '2026-02-16T00:00:00Z' },
  { id: 'corp-2', org_id: 'org-1', contractor_id: 'cor-2', amount: 500000, currency: 'USD', status: 'pending', period_start: '2026-02-01', period_end: '2026-02-28', hours_worked: null, payment_method: 'wise', paid_at: null, created_at: '2026-03-01T00:00:00Z' },
]

// ─── Global Benefits ───
export const demoGlobalBenefitPlans = [
  { id: 'gbp-1', org_id: 'org-1', name: 'UK Private Health Insurance', category: 'health', country: 'United Kingdom', country_code: 'GB', provider: 'Bupa', is_statutory: false, cost_employee: 0, cost_employer: 15000, currency: 'GBP', is_active: true, effective_date: '2025-07-01', created_at: '2025-06-01T00:00:00Z' },
  { id: 'gbp-2', org_id: 'org-1', name: 'German Statutory Health', category: 'health', country: 'Germany', country_code: 'DE', provider: 'TK (Techniker Krankenkasse)', is_statutory: true, statutory_reference: 'SGB V', cost_employee: 0, cost_employer: 0, currency: 'EUR', is_active: true, effective_date: '2025-10-01', created_at: '2025-09-01T00:00:00Z' },
  { id: 'gbp-3', org_id: 'org-1', name: 'Nigeria NHIS', category: 'health', country: 'Nigeria', country_code: 'NG', provider: 'NHIS', is_statutory: true, statutory_reference: 'NHIS Act 1999', cost_employee: 0, cost_employer: 1000, currency: 'NGN', is_active: true, effective_date: '2025-01-01', created_at: '2025-01-01T00:00:00Z' },
]
export const demoCountryBenefitConfigs = [
  { id: 'cbc-1', org_id: 'org-1', country: 'United Kingdom', country_code: 'GB', mandatory_benefits: [{ name: 'Workplace Pension', category: 'retirement', employer_cost: 3 }, { name: 'NHS', category: 'health', employer_cost: 0 }], supplementary_benefits: [{ name: 'Private Health', category: 'health', employer_cost: 15000 }], updated_at: '2026-01-01T00:00:00Z' },
  { id: 'cbc-2', org_id: 'org-1', country: 'Germany', country_code: 'DE', mandatory_benefits: [{ name: 'Statutory Health', category: 'health', employer_cost: 7.3 }, { name: 'Pension Insurance', category: 'retirement', employer_cost: 9.3 }], supplementary_benefits: [], updated_at: '2026-01-01T00:00:00Z' },
]
export const demoGlobalBenefitEnrollments = [
  { id: 'gbe-1', org_id: 'org-1', plan_id: 'gbp-1', employee_id: 'eoremp-1', country: 'United Kingdom', coverage_level: 'employee_plus_family', dependent_count: 2, employee_contribution: 0, employer_contribution: 15000, currency: 'GBP', enrolled_at: '2025-07-01' },
  { id: 'gbe-2', org_id: 'org-1', plan_id: 'gbp-2', employee_id: 'eoremp-2', country: 'Germany', coverage_level: 'employee_only', dependent_count: 0, employee_contribution: 0, employer_contribution: 0, currency: 'EUR', enrolled_at: '2025-10-01' },
]

// ─── Workers' Compensation ───
export const demoWorkersCompPolicies = [
  { id: 'wc-pol-1', org_id: 'org-1', name: 'General Liability', carrier: 'AIG', policy_number: 'WC-2026-001', status: 'active', effective_date: '2026-01-01', expiry_date: '2026-12-31', premium: 4500000, covered_employees: 50, class_codes: ['8810', '8742'], created_at: '2025-12-01T00:00:00Z' },
  { id: 'wc-pol-2', org_id: 'org-1', name: 'Warehouse Operations', carrier: 'Liberty Mutual', policy_number: 'WC-2026-002', status: 'active', effective_date: '2026-03-01', expiry_date: '2027-02-28', premium: 7200000, covered_employees: 25, class_codes: ['7380', '3681'], created_at: '2026-01-15T00:00:00Z' },
  { id: 'wc-pol-3', org_id: 'org-1', name: 'Field Services', carrier: 'Hartford', policy_number: 'WC-2025-009', status: 'expired', effective_date: '2025-01-01', expiry_date: '2025-12-31', premium: 3100000, covered_employees: 15, class_codes: ['8742'], created_at: '2024-11-20T00:00:00Z' },
]
export const demoWorkersCompClaims = [
  { id: 'wc-claim-1', org_id: 'org-1', policy_id: 'wc-pol-1', employee_name: 'Kofi Mensah', incident_date: '2026-02-10', description: 'Slipped on wet floor in cafeteria', injury_type: 'Sprain/Strain', body_part: 'Lower back', status: 'open', reserve_amount: 150000, paid_amount: 45000, filed_date: '2026-02-11', created_at: '2026-02-11T00:00:00Z' },
  { id: 'wc-claim-2', org_id: 'org-1', policy_id: 'wc-pol-1', employee_name: 'Adaeze Okafor', incident_date: '2026-01-15', description: 'Repetitive strain injury from typing', injury_type: 'RSI', body_part: 'Wrist', status: 'closed', reserve_amount: 80000, paid_amount: 65000, filed_date: '2026-01-18', closed_date: '2026-02-20', created_at: '2026-01-18T00:00:00Z' },
  { id: 'wc-claim-3', org_id: 'org-1', policy_id: 'wc-pol-2', employee_name: 'Kwame Asante', incident_date: '2026-02-25', description: 'Lifted heavy box, felt sharp pain in shoulder', injury_type: 'Sprain/Strain', body_part: 'Right shoulder', status: 'open', reserve_amount: 220000, paid_amount: 0, filed_date: '2026-02-26', created_at: '2026-02-26T00:00:00Z' },
  { id: 'wc-claim-4', org_id: 'org-1', policy_id: 'wc-pol-1', employee_name: 'Fatima Diallo', incident_date: '2025-11-02', description: 'Cut hand on broken glass in break room', injury_type: 'Laceration', body_part: 'Left hand', status: 'closed', reserve_amount: 35000, paid_amount: 28000, filed_date: '2025-11-03', closed_date: '2025-12-15', created_at: '2025-11-03T00:00:00Z' },
]
export const demoWorkersCompClassCodes = [
  { id: 'wccc-1', org_id: 'org-1', code: '8810', description: 'Clerical Office Employees', rate: 0.25, employee_count: 35, created_at: '2025-01-01T00:00:00Z' },
  { id: 'wccc-2', org_id: 'org-1', code: '8742', description: 'Sales Personnel - Outside', rate: 0.85, employee_count: 10, created_at: '2025-01-01T00:00:00Z' },
  { id: 'wccc-3', org_id: 'org-1', code: '3681', description: 'Printing/Photocopying', rate: 1.50, employee_count: 3, created_at: '2025-01-01T00:00:00Z' },
  { id: 'wccc-4', org_id: 'org-1', code: '7380', description: 'Drivers, Chauffeurs', rate: 3.20, employee_count: 2, created_at: '2025-01-01T00:00:00Z' },
]
export const demoWorkersCompAudits = [
  { id: 'wcaud-1', org_id: 'org-1', audit_date: '2025-12-15', period: '2025-01-01 to 2025-12-31', auditor: 'BDO Advisory', status: 'completed', findings: 'Payroll reported within 3% of actual. Minor misclassification in code 8742.', adjustment_amount: -125000, created_at: '2025-12-15T00:00:00Z' },
  { id: 'wcaud-2', org_id: 'org-1', audit_date: '2024-12-20', period: '2024-01-01 to 2024-12-31', auditor: 'BDO Advisory', status: 'completed', findings: 'No material discrepancies found. All class codes properly assigned.', adjustment_amount: 0, created_at: '2024-12-20T00:00:00Z' },
  { id: 'wcaud-3', org_id: 'org-1', audit_date: '2026-12-01', period: '2026-01-01 to 2026-12-31', auditor: 'TBD', status: 'scheduled', findings: '', adjustment_amount: 0, created_at: '2026-01-10T00:00:00Z' },
]

// ─── Groups ───
export const demoGroups = [
  { id: 'grp-1', org_id: 'org-1', name: 'All Engineering', description: 'All employees in engineering departments', type: 'dynamic', rule: { field: 'department', operator: 'equals', value: 'Engineering' }, member_count: 15, created_by: 'emp-1', created_at: '2025-06-01T00:00:00Z', last_synced_at: '2026-02-28T06:00:00Z', modules: ['access', 'benefits', 'payroll'] },
  { id: 'grp-2', org_id: 'org-1', name: 'Senior Leadership', description: 'VP and above', type: 'dynamic', rule: { field: 'job_level', operator: 'gte', value: 'VP' }, member_count: 5, created_by: 'emp-1', created_at: '2025-06-01T00:00:00Z', last_synced_at: '2026-02-28T06:00:00Z', modules: ['access', 'compensation', 'equity'] },
  { id: 'grp-3', org_id: 'org-1', name: 'West Africa Team', description: 'Employees in Ghana, Nigeria, Senegal', type: 'dynamic', rule: { field: 'country', operator: 'in', value: ['Ghana', 'Nigeria', 'Senegal'] }, member_count: 22, created_by: 'emp-17', created_at: '2025-09-01T00:00:00Z', last_synced_at: '2026-02-28T06:00:00Z', modules: ['benefits', 'compliance'] },
  { id: 'grp-4', org_id: 'org-1', name: 'New Hires Q1 2026', description: 'Employees hired in Q1 2026', type: 'static', rule: null, member_count: 8, created_by: 'emp-17', created_at: '2026-01-01T00:00:00Z', last_synced_at: null, modules: ['onboarding', 'learning'] },
]

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
      courseBlocks: demoCourseBlocks,
      quizQuestions: demoQuizQuestions,
      discussions: demoDiscussions,
      studyGroups: demoStudyGroups,
      complianceTraining: demoComplianceTraining,
      autoEnrollRules: demoAutoEnrollRules,
      assessmentAttempts: demoAssessmentAttempts,
      learningAssignments: demoLearningAssignments,
      careerSiteConfig: kashCareerSiteConfig,
      jobDistributions: kashJobDistributions,
      interviews: [] as typeof demoInterviews,
      talentPools: [] as typeof demoTalentPools,
      scoreCards: [] as typeof demoScoreCards,
      // Offboarding
      offboardingProcesses: [] as typeof demoOffboardingProcesses,
      offboardingChecklists: [] as typeof demoOffboardingChecklists,
      offboardingChecklistItems: [] as typeof demoOffboardingChecklistItems,
      offboardingTasks: [] as typeof demoOffboardingTasks,
      exitSurveys: [] as typeof demoExitSurveys,
      // Headcount Planning
      headcountPlans: [] as typeof demoHeadcountPlans,
      headcountPositions: [] as typeof demoHeadcountPositions,
      headcountBudgetItems: [] as typeof demoHeadcountBudgetItems,
      // Time & Attendance
      timeEntries: [] as typeof demoTimeEntries,
      timeOffBalances: [] as typeof demoTimeOffBalances,
      timeOffPolicies: [] as typeof demoTimeOffPolicies,
      overtimeRules: [] as typeof demoOvertimeRules,
      // IT Cloud
      managedDevices: [] as typeof demoManagedDevices,
      deviceActions: [] as typeof demoDeviceActions,
      appCatalog: [] as typeof demoAppCatalog,
      appAssignments: [] as typeof demoAppAssignments,
      securityPoliciesIT: [] as typeof demoSecurityPoliciesIT,
      deviceInventory: [] as typeof demoDeviceInventory,
      // Automation Workflows
      automationWorkflows: [] as typeof demoAutomationWorkflows,
      automationWorkflowSteps: [] as typeof demoAutomationWorkflowSteps,
      automationWorkflowRuns: [] as typeof demoAutomationWorkflowRuns,
      automationWorkflowRunSteps: [] as typeof demoAutomationWorkflowRunSteps,
      automationWorkflowTemplates: [] as typeof demoAutomationWorkflowTemplates,
      // PIPs + Merit + Review Templates
      pips: [] as typeof demoPIPs,
      pipCheckIns: [] as typeof demoPIPCheckIns,
      meritCycles: [] as typeof demoMeritCycles,
      meritRecommendations: [] as typeof demoMeritRecommendations,
      reviewTemplates: [] as typeof demoReviewTemplates,
      // Recruiting Enhancements
      backgroundChecks: [] as typeof demoBackgroundChecks,
      referralProgram: demoReferralProgram,
      referrals: [] as typeof demoReferrals,
      knockoutQuestions: [] as typeof demoKnockoutQuestions,
      candidateScheduling: [] as typeof demoCandidateScheduling,
      // Benefits Enhancements
      openEnrollmentPeriods: [] as typeof demoOpenEnrollmentPeriods,
      flexBenefitAccounts: [] as typeof demoFlexBenefitAccounts,
      flexBenefitTransactions: [] as typeof demoFlexBenefitTransactions,
      cobraEvents: [] as typeof demoCobraEvents,
      acaTracking: [] as typeof demoAcaTracking,
      // Expense Enhancements
      receiptMatches: [] as typeof demoReceiptMatches,
      duplicateDetections: [] as typeof demoDuplicateDetections,
      mileageEntries: [] as typeof demoMileageEntries,
      advancedExpensePolicies: [] as typeof demoAdvancedExpensePolicies,
      reimbursementBatches: [] as typeof demoReimbursementBatches,
      // LMS Enhancements
      coursePrerequisites: demoCoursePrerequisites,
      scormPackages: demoScormPackages,
      scormTracking: demoScormTracking,
      contentLibrary: demoContentLibrary,
      learnerBadges: demoLearnerBadges,
      learnerPoints: demoLearnerPoints,
      certificateTemplates: demoCertificateTemplates,
      // Survey Enhancements
      surveyTemplates: [] as typeof demoSurveyTemplates,
      surveySchedules: [] as typeof demoSurveySchedules,
      surveyTriggers: [] as typeof demoSurveyTriggers,
      openEndedResponses: [] as typeof demoOpenEndedResponses,
      // Custom Fields + Emergency Contacts + Compliance
      customFieldDefinitions: [] as typeof demoCustomFieldDefinitions,
      customFieldValues: [] as typeof demoCustomFieldValues,
      emergencyContacts: [] as typeof demoEmergencyContacts,
      complianceRequirements: [] as typeof demoComplianceRequirements,
      complianceDocuments: [] as typeof demoComplianceDocuments,
      complianceAlerts: [] as typeof demoComplianceAlerts,
      // E-Signatures
      signatureDocuments: [] as typeof demoSignatureDocuments,
      signatureTemplates: [] as typeof demoSignatureTemplates,
      // E-Verify / I-9
      i9Forms: [] as typeof demoI9Forms,
      everifyCases: [] as typeof demoEverifyCases,
      // PEO
      peoConfigurations: [] as typeof demoPeoConfigurations,
      coEmploymentRecords: [] as typeof demoCoEmploymentRecords,
      // Sandbox
      sandboxEnvironments: [] as typeof demoSandboxEnvironments,
      provisioningRules: [] as typeof demoProvisioningRules,
      encryptionPolicies: [] as typeof demoEncryptionPolicies,
      scimProviders: [] as typeof demoScimProviders,
      autoDetectionScans: [] as typeof demoAutoDetectionScans,
      // Chat
      chatChannels: [] as typeof demoChatChannels,
      chatMessages: [] as typeof demoChatMessages,
      chatParticipants: [] as typeof demoChatParticipants,
      // Interview Recording
      interviewRecordings: [] as typeof demoInterviewRecordings,
      interviewTranscriptions: [] as typeof demoInterviewTranscriptions,
      // Video Screens
      videoScreenTemplates: [] as typeof demoVideoScreenTemplates,
      videoScreenInvites: [] as typeof demoVideoScreenInvites,
      videoScreenResponses: [] as typeof demoVideoScreenResponses,
      // Corporate Cards
      corporateCards: [] as typeof demoCorporateCards,
      cardTransactions: [] as typeof demoCardTransactions,
      // Bill Pay
      billPayments: [] as typeof demoBillPayments,
      billPaySchedules: [] as typeof demoBillPaySchedules,
      // Travel Management
      travelRequests: [] as typeof demoTravelRequests,
      travelBookings: [] as typeof demoTravelBookings,
      travelPolicies: [] as typeof demoTravelPolicies,
      // Procurement
      purchaseOrders: [] as typeof demoPurchaseOrders,
      purchaseOrderItems: [] as typeof demoPurchaseOrderItems,
      procurementRequests: [] as typeof demoProcurementRequests,
      // Multi-currency
      currencyAccounts: [] as typeof demoCurrencyAccounts,
      fxTransactions: [] as typeof demoFxTransactions,
      // 401(k) Administration
      retirementPlans: [] as typeof demoRetirementPlans,
      retirementEnrollments: [] as typeof demoRetirementEnrollments,
      retirementContributions: [] as typeof demoRetirementContributions,
      // Carrier Integration
      carrierIntegrations: [] as typeof demoCarrierIntegrations,
      enrollmentFeeds: [] as typeof demoEnrollmentFeeds,
      // Geofencing
      geofenceZones: [] as typeof demoGeofenceZones,
      geofenceEvents: [] as typeof demoGeofenceEvents,
      // Identity Provider
      idpConfigurations: [] as typeof demoIdpConfigurations,
      samlApps: [] as typeof demoSamlApps,
      mfaPolicies: [] as typeof demoMfaPolicies,
      // Zero-touch Deployment
      deploymentProfiles: [] as typeof demoDeploymentProfiles,
      enrollmentTokens: [] as typeof demoEnrollmentTokens,
      // Password Manager
      passwordVaults: [] as typeof demoPasswordVaults,
      vaultItems: [] as typeof demoVaultItems,
      // Device Store
      deviceStoreCatalog: [] as typeof demoDeviceStoreCatalog,
      deviceOrders: [] as typeof demoDeviceOrders,
      buybackRequests: [] as typeof demoBuybackRequests,
      // App Builder
      customApps: [] as typeof demoCustomApps,
      appPages: [] as typeof demoAppPages,
      appComponents: [] as typeof demoAppComponents,
      appDataSources: [] as typeof demoAppDataSources,
      // RQL
      savedQueries: [] as typeof demoSavedQueries,
      querySchedules: [] as typeof demoQuerySchedules,
      // EOR
      eorEntities: [] as typeof demoEorEntities,
      eorEmployees: [] as typeof demoEorEmployees,
      eorContracts: [] as typeof demoEorContracts,
      // Contractor of Record
      corContractors: [] as typeof demoCorContractors,
      corContracts: [] as typeof demoCorContracts,
      corPayments: [] as typeof demoCorPayments,
      // Global Benefits
      globalBenefitPlans: [] as typeof demoGlobalBenefitPlans,
      countryBenefitConfigs: [] as typeof demoCountryBenefitConfigs,
      globalBenefitEnrollments: [] as typeof demoGlobalBenefitEnrollments,
      // Workers' Compensation
      workersCompPolicies: [] as typeof demoWorkersCompPolicies,
      workersCompClaims: [] as typeof demoWorkersCompClaims,
      workersCompClassCodes: [] as typeof demoWorkersCompClassCodes,
      workersCompAudits: [] as typeof demoWorkersCompAudits,
      groups: [] as typeof demoGroups,
      shadowITDetections: [] as typeof demoShadowITDetections,
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
    complianceTraining: demoComplianceTraining,
    autoEnrollRules: demoAutoEnrollRules,
    assessmentAttempts: demoAssessmentAttempts,
    learningAssignments: demoLearningAssignments,
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
    // Offboarding
    offboardingProcesses: demoOffboardingProcesses,
    offboardingChecklists: demoOffboardingChecklists,
    offboardingChecklistItems: demoOffboardingChecklistItems,
    offboardingTasks: demoOffboardingTasks,
    exitSurveys: demoExitSurveys,
    // Headcount Planning
    headcountPlans: demoHeadcountPlans,
    headcountPositions: demoHeadcountPositions,
    headcountBudgetItems: demoHeadcountBudgetItems,
    // Time & Attendance
    timeEntries: demoTimeEntries,
    timeOffBalances: demoTimeOffBalances,
    timeOffPolicies: demoTimeOffPolicies,
    overtimeRules: demoOvertimeRules,
    // IT Cloud
    managedDevices: demoManagedDevices,
    deviceActions: demoDeviceActions,
    appCatalog: demoAppCatalog,
    appAssignments: demoAppAssignments,
    securityPoliciesIT: demoSecurityPoliciesIT,
    deviceInventory: demoDeviceInventory,
    // Automation Workflows
    automationWorkflows: demoAutomationWorkflows,
    automationWorkflowSteps: demoAutomationWorkflowSteps,
    automationWorkflowRuns: demoAutomationWorkflowRuns,
    automationWorkflowRunSteps: demoAutomationWorkflowRunSteps,
    automationWorkflowTemplates: demoAutomationWorkflowTemplates,
    // PIPs + Merit + Review Templates
    pips: demoPIPs,
    pipCheckIns: demoPIPCheckIns,
    meritCycles: demoMeritCycles,
    meritRecommendations: demoMeritRecommendations,
    reviewTemplates: demoReviewTemplates,
    // Recruiting Enhancements
    backgroundChecks: demoBackgroundChecks,
    referralProgram: demoReferralProgram,
    referrals: demoReferrals,
    knockoutQuestions: demoKnockoutQuestions,
    candidateScheduling: demoCandidateScheduling,
    // Benefits Enhancements
    openEnrollmentPeriods: demoOpenEnrollmentPeriods,
    flexBenefitAccounts: demoFlexBenefitAccounts,
    flexBenefitTransactions: demoFlexBenefitTransactions,
    cobraEvents: demoCobraEvents,
    acaTracking: demoAcaTracking,
    // Expense Enhancements
    receiptMatches: demoReceiptMatches,
    duplicateDetections: demoDuplicateDetections,
    mileageEntries: demoMileageEntries,
    advancedExpensePolicies: demoAdvancedExpensePolicies,
    reimbursementBatches: demoReimbursementBatches,
    // LMS Enhancements
    coursePrerequisites: demoCoursePrerequisites,
    scormPackages: demoScormPackages,
    scormTracking: demoScormTracking,
    contentLibrary: demoContentLibrary,
    learnerBadges: demoLearnerBadges,
    learnerPoints: demoLearnerPoints,
    certificateTemplates: demoCertificateTemplates,
    // Survey Enhancements
    surveyTemplates: demoSurveyTemplates,
    surveySchedules: demoSurveySchedules,
    surveyTriggers: demoSurveyTriggers,
    openEndedResponses: demoOpenEndedResponses,
    // Custom Fields + Emergency Contacts + Compliance
    customFieldDefinitions: demoCustomFieldDefinitions,
    customFieldValues: demoCustomFieldValues,
    emergencyContacts: demoEmergencyContacts,
    complianceRequirements: demoComplianceRequirements,
    complianceDocuments: demoComplianceDocuments,
    complianceAlerts: demoComplianceAlerts,
    // E-Signatures
    signatureDocuments: demoSignatureDocuments,
    signatureTemplates: demoSignatureTemplates,
    // E-Verify / I-9
    i9Forms: demoI9Forms,
    everifyCases: demoEverifyCases,
    // PEO
    peoConfigurations: demoPeoConfigurations,
    coEmploymentRecords: demoCoEmploymentRecords,
    // Sandbox
    sandboxEnvironments: demoSandboxEnvironments,
    provisioningRules: demoProvisioningRules,
    encryptionPolicies: demoEncryptionPolicies,
    scimProviders: demoScimProviders,
    autoDetectionScans: demoAutoDetectionScans,
    // Chat
    chatChannels: demoChatChannels,
    chatMessages: demoChatMessages,
    chatParticipants: demoChatParticipants,
    // Interview Recording
    interviewRecordings: demoInterviewRecordings,
    interviewTranscriptions: demoInterviewTranscriptions,
    // Video Screens
    videoScreenTemplates: demoVideoScreenTemplates,
    videoScreenInvites: demoVideoScreenInvites,
    videoScreenResponses: demoVideoScreenResponses,
    // Corporate Cards
    corporateCards: demoCorporateCards,
    cardTransactions: demoCardTransactions,
    // Bill Pay
    billPayments: demoBillPayments,
    billPaySchedules: demoBillPaySchedules,
    // Travel Management
    travelRequests: demoTravelRequests,
    travelBookings: demoTravelBookings,
    travelPolicies: demoTravelPolicies,
    // Procurement
    purchaseOrders: demoPurchaseOrders,
    purchaseOrderItems: demoPurchaseOrderItems,
    procurementRequests: demoProcurementRequests,
    // Multi-currency
    currencyAccounts: demoCurrencyAccounts,
    fxTransactions: demoFxTransactions,
    // 401(k) Administration
    retirementPlans: demoRetirementPlans,
    retirementEnrollments: demoRetirementEnrollments,
    retirementContributions: demoRetirementContributions,
    // Carrier Integration
    carrierIntegrations: demoCarrierIntegrations,
    enrollmentFeeds: demoEnrollmentFeeds,
    // Geofencing
    geofenceZones: demoGeofenceZones,
    geofenceEvents: demoGeofenceEvents,
    // Identity Provider
    idpConfigurations: demoIdpConfigurations,
    samlApps: demoSamlApps,
    mfaPolicies: demoMfaPolicies,
    // Zero-touch Deployment
    deploymentProfiles: demoDeploymentProfiles,
    enrollmentTokens: demoEnrollmentTokens,
    // Password Manager
    passwordVaults: demoPasswordVaults,
    vaultItems: demoVaultItems,
    // Device Store
    deviceStoreCatalog: demoDeviceStoreCatalog,
    deviceOrders: demoDeviceOrders,
    buybackRequests: demoBuybackRequests,
    // App Builder
    customApps: demoCustomApps,
    appPages: demoAppPages,
    appComponents: demoAppComponents,
    appDataSources: demoAppDataSources,
    // RQL
    savedQueries: demoSavedQueries,
    querySchedules: demoQuerySchedules,
    // EOR
    eorEntities: demoEorEntities,
    eorEmployees: demoEorEmployees,
    eorContracts: demoEorContracts,
    // Contractor of Record
    corContractors: demoCorContractors,
    corContracts: demoCorContracts,
    corPayments: demoCorPayments,
    // Global Benefits
    globalBenefitPlans: demoGlobalBenefitPlans,
    countryBenefitConfigs: demoCountryBenefitConfigs,
    globalBenefitEnrollments: demoGlobalBenefitEnrollments,
    // Workers' Compensation
    workersCompPolicies: demoWorkersCompPolicies,
    workersCompClaims: demoWorkersCompClaims,
    workersCompClassCodes: demoWorkersCompClassCodes,
    workersCompAudits: demoWorkersCompAudits,
    groups: demoGroups,
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
    email: 'yersimo@theworktempo.com',
    password: 'W@kilisha2026',
    name: 'Simon Rey',
    role: 'super_admin',
    description: 'Master admin — full platform access, impersonation, org management',
  },
  {
    email: 'admin@tempo.dev',
    password: 'admin1234',
    name: 'Tempo Admin',
    role: 'super_admin',
    description: 'Full platform access — manage orgs, impersonate users',
  },
]
