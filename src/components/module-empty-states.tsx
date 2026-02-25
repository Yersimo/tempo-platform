'use client'

import { EmptyState } from '@/components/ui/empty-state'
import { Button } from '@/components/ui/button'
import {
  Users, TrendingUp, Banknote, GraduationCap, HeartPulse, UserCheck,
  Wallet, Clock, Shield, Receipt, Briefcase, Laptop, AppWindow,
  FileText, PieChart, FolderKanban, Compass, Zap, BarChart3,
  Plus, Upload, ArrowRight, Sparkles, BookOpen, Target,
} from 'lucide-react'

interface ModuleEmptyStateProps {
  module: string
  onPrimaryAction?: () => void
  onSecondaryAction?: () => void
}

const MODULE_CONFIG: Record<string, {
  icon: React.ReactNode
  title: string
  description: string
  primaryLabel: string
  secondaryLabel?: string
  tips?: string[]
}> = {
  people: {
    icon: <Users size={40} className="text-tempo-600" />,
    title: 'Add Your First Team Member',
    description: 'Start building your org by adding employees. You can add them one by one or import a CSV file with your entire team.',
    primaryLabel: 'Add Employee',
    secondaryLabel: 'Import CSV',
    tips: ['Set up departments first for better organization', 'Employee profiles support photos and custom fields', 'Use bulk import for teams larger than 10 people'],
  },
  performance: {
    icon: <TrendingUp size={40} className="text-tempo-600" />,
    title: 'Set Up Performance Management',
    description: 'Define goals, run review cycles, and track performance. Start by creating your first goal or launching a review cycle.',
    primaryLabel: 'Create Goal',
    secondaryLabel: 'Start Review Cycle',
    tips: ['Use SMART goal framework for better outcomes', 'AI will score goal quality automatically', 'Set up 1:1 meetings for continuous feedback'],
  },
  compensation: {
    icon: <Banknote size={40} className="text-tempo-600" />,
    title: 'Configure Compensation Bands',
    description: 'Set up pay bands, run salary reviews, and manage equity. Start by defining compensation bands for your roles.',
    primaryLabel: 'Create Comp Band',
    secondaryLabel: 'Import Market Data',
    tips: ['AI detects pay equity issues automatically', 'Supports multi-currency compensation', 'Link comp bands to job levels for consistency'],
  },
  learning: {
    icon: <GraduationCap size={40} className="text-tempo-600" />,
    title: 'Create Your First Course',
    description: 'Build a learning library with courses, learning paths, and live sessions. AI can help generate course content.',
    primaryLabel: 'Create Course',
    secondaryLabel: 'Create Learning Path',
    tips: ['AI course builder generates outlines automatically', 'Support for video, quizzes, and interactive content', 'Track completion rates and learning outcomes'],
  },
  engagement: {
    icon: <HeartPulse size={40} className="text-tempo-600" />,
    title: 'Launch Your First Survey',
    description: 'Measure employee engagement with pulse surveys, eNPS tracking, and action plans. Start with a quick pulse check.',
    primaryLabel: 'Create Survey',
    secondaryLabel: 'View Templates',
    tips: ['Anonymous surveys get more honest feedback', 'eNPS benchmarks against industry averages', 'Action plans turn insights into improvements'],
  },
  mentoring: {
    icon: <UserCheck size={40} className="text-tempo-600" />,
    title: 'Start a Mentoring Program',
    description: 'Match mentors with mentees, track sessions, and measure growth. AI helps find the best mentor-mentee pairs.',
    primaryLabel: 'Create Program',
    tips: ['AI matching considers skills, goals, and personality', 'Built-in session scheduling and note-taking', 'Track mentoring outcomes and satisfaction'],
  },
  payroll: {
    icon: <Wallet size={40} className="text-tempo-600" />,
    title: 'Set Up Payroll',
    description: 'Run payroll across 50+ countries with automated tax calculations, compliance checks, and multi-currency support.',
    primaryLabel: 'Create Pay Run',
    secondaryLabel: 'Configure Tax Settings',
    tips: ['Supports ACH, SEPA, BACS, and SWIFT payments', 'Automatic tax calculations for 50+ countries', 'AI detects payroll anomalies before processing'],
  },
  'time-attendance': {
    icon: <Clock size={40} className="text-tempo-600" />,
    title: 'Configure Time & Attendance',
    description: 'Set up leave policies, track time-off requests, and manage attendance. Start by configuring your leave types.',
    primaryLabel: 'Create Leave Policy',
    secondaryLabel: 'Submit Time Off',
    tips: ['Customizable leave types (PTO, sick, parental, etc.)', 'Automatic accrual rule engine', 'Manager approval workflows built in'],
  },
  benefits: {
    icon: <Shield size={40} className="text-tempo-600" />,
    title: 'Set Up Benefits Plans',
    description: 'Manage health, dental, vision, retirement, and custom benefits. Create benefit plans and open enrollment windows.',
    primaryLabel: 'Create Benefit Plan',
    secondaryLabel: 'Open Enrollment',
    tips: ['Side-by-side plan comparison for employees', 'Life event triggers for mid-year changes', 'Track enrollment rates and utilization'],
  },
  expense: {
    icon: <Receipt size={40} className="text-tempo-600" />,
    title: 'Configure Expense Policies',
    description: 'Set up expense categories, approval workflows, and spending policies. Employees can then submit expenses with receipts.',
    primaryLabel: 'Create Policy',
    secondaryLabel: 'Submit Expense',
    tips: ['OCR receipt scanning extracts data automatically', 'Per-diem and mileage calculators built in', 'Multi-currency with automatic conversion'],
  },
  recruiting: {
    icon: <Briefcase size={40} className="text-tempo-600" />,
    title: 'Post Your First Job',
    description: 'Create job postings, manage candidates, and run interviews. Your AI-powered ATS streamlines the entire hiring pipeline.',
    primaryLabel: 'Create Job Posting',
    secondaryLabel: 'Import Candidates',
    tips: ['AI screens resumes and ranks candidates', 'Built-in interview scheduling and scorecards', 'Configurable hiring pipeline stages'],
  },
  onboarding: {
    icon: <BookOpen size={40} className="text-tempo-600" />,
    title: 'Design Your Onboarding Flow',
    description: 'Create preboarding tasks, welcome content, and buddy assignments. Make every new hire feel at home from day one.',
    primaryLabel: 'Create Onboarding Plan',
    tips: ['AI suggests optimal buddy matches', 'Pre-boarding tasks start before day one', 'Track onboarding completion and satisfaction'],
  },
  devices: {
    icon: <Laptop size={40} className="text-tempo-600" />,
    title: 'Register Your First Device',
    description: 'Track company devices, manage warranties, and handle IT assignments. Keep your hardware inventory organized.',
    primaryLabel: 'Add Device',
    secondaryLabel: 'Bulk Import',
    tips: ['Track warranty expiry and replacement cycles', 'Assign devices to employees automatically', 'Supports laptops, phones, and peripherals'],
  },
  apps: {
    icon: <AppWindow size={40} className="text-tempo-600" />,
    title: 'Add Software Licenses',
    description: 'Track software licenses, manage subscriptions, and control SaaS spend. Know exactly what tools your team uses.',
    primaryLabel: 'Add License',
    tips: ['Track license utilization and waste', 'Auto-revoke on offboarding', 'Cost per employee analytics'],
  },
  invoices: {
    icon: <FileText size={40} className="text-tempo-600" />,
    title: 'Create Your First Invoice',
    description: 'Manage invoices, track payments, and handle vendor relationships. Keep your financial operations running smoothly.',
    primaryLabel: 'Create Invoice',
    tips: ['Automatic payment reminders', 'Multi-currency support', 'Vendor management built in'],
  },
  budgets: {
    icon: <PieChart size={40} className="text-tempo-600" />,
    title: 'Set Up Your First Budget',
    description: 'Create department budgets, track spending against allocations, and forecast future needs.',
    primaryLabel: 'Create Budget',
    tips: ['Track actual vs. planned spending', 'Department-level budget delegation', 'AI-powered budget forecasting'],
  },
  projects: {
    icon: <FolderKanban size={40} className="text-tempo-600" />,
    title: 'Create Your First Project',
    description: 'Manage projects with Kanban boards, milestones, and task dependencies. Track capacity and delivery timelines.',
    primaryLabel: 'Create Project',
    tips: ['Kanban, list, and timeline views', 'Task dependencies and critical path', 'Sprint planning and capacity tracking'],
  },
  strategy: {
    icon: <Compass size={40} className="text-tempo-600" />,
    title: 'Define Your Strategy',
    description: 'Set strategic objectives, key results (OKRs), and KPIs. Align your entire organization around shared goals.',
    primaryLabel: 'Create Objective',
    secondaryLabel: 'Import OKRs',
    tips: ['Cascade objectives from company to team to individual', 'Track KPIs with automated data collection', 'AI identifies misaligned initiatives'],
  },
  'workflow-studio': {
    icon: <Zap size={40} className="text-tempo-600" />,
    title: 'Build Your First Workflow',
    description: 'Automate HR processes with visual workflows. Create triggers, conditions, and actions without code.',
    primaryLabel: 'Create Workflow',
    secondaryLabel: 'Browse Templates',
    tips: ['Pre-built templates for common HR workflows', 'Trigger on employee events (hire, promotion, etc.)', 'Integrate with Slack, Teams, and email'],
  },
  analytics: {
    icon: <BarChart3 size={40} className="text-tempo-600" />,
    title: 'Your Analytics Dashboard',
    description: 'Analytics auto-populate as you add data. Add employees, run payroll, and complete reviews to see insights here.',
    primaryLabel: 'Add Data',
    tips: ['Natural language query: ask questions about your data', 'Flight risk prediction powered by AI', 'Export reports to CSV or PDF'],
  },
}

export function ModuleEmptyState({ module, onPrimaryAction, onSecondaryAction }: ModuleEmptyStateProps) {
  const config = MODULE_CONFIG[module]
  if (!config) {
    return (
      <EmptyState
        icon={<Sparkles size={40} className="text-tempo-600" />}
        title="No data yet"
        description="Start adding data to see this module come to life."
      />
    )
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="max-w-lg w-full text-center">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-2xl bg-tempo-50 flex items-center justify-center">
            {config.icon}
          </div>
        </div>

        {/* Title & Description */}
        <h3 className="text-lg font-semibold text-t1 mb-2">{config.title}</h3>
        <p className="text-sm text-t3 max-w-md mx-auto mb-6">{config.description}</p>

        {/* Actions */}
        <div className="flex items-center justify-center gap-3 mb-8">
          {onPrimaryAction && (
            <Button onClick={onPrimaryAction}>
              <Plus size={16} />
              {config.primaryLabel}
            </Button>
          )}
          {onSecondaryAction && config.secondaryLabel && (
            <Button variant="secondary" onClick={onSecondaryAction}>
              {config.secondaryLabel}
            </Button>
          )}
        </div>

        {/* Tips */}
        {config.tips && config.tips.length > 0 && (
          <div className="bg-canvas border border-border rounded-xl p-5 text-left">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={14} className="text-tempo-600" />
              <span className="text-xs font-semibold text-t1 uppercase tracking-wider">Quick Tips</span>
            </div>
            <ul className="space-y-2">
              {config.tips.map((tip, i) => (
                <li key={i} className="flex items-start gap-2">
                  <ArrowRight size={12} className="text-tempo-600 mt-0.5 flex-shrink-0" />
                  <span className="text-xs text-t2">{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
