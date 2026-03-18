/**
 * Pre-built Academy Templates
 * Ready-to-deploy academy configurations for common use cases.
 */

export interface AcademyTemplateCurriculumItem {
  title: string
  duration: string
  lessons: number
}

export interface AcademyTemplate {
  id: string
  name: string
  description: string
  icon: string
  duration: string
  modules: number
  targetAudience: string
  languages: string[]
  curriculum: AcademyTemplateCurriculumItem[]
  sessions: string[]
  assignments: string[]
  certificate: string
}

export const ACADEMY_TEMPLATES: AcademyTemplate[] = [
  {
    id: 'financial-literacy',
    name: 'Financial Literacy Academy',
    description: 'Comprehensive financial education for SME owners and entrepreneurs',
    icon: 'DollarSign',
    duration: '12 weeks',
    modules: 6,
    targetAudience: 'SME Owners, Entrepreneurs, Business Managers',
    languages: ['en', 'fr'],
    curriculum: [
      { title: 'Business Financial Fundamentals', duration: '2 weeks', lessons: 8 },
      { title: 'Cash Flow Management', duration: '2 weeks', lessons: 6 },
      { title: 'Access to Finance & Credit', duration: '2 weeks', lessons: 7 },
      { title: 'Digital Financial Tools', duration: '2 weeks', lessons: 5 },
      { title: 'Tax Planning & Compliance', duration: '2 weeks', lessons: 6 },
      { title: 'Growth Finance & Investment', duration: '2 weeks', lessons: 7 },
    ],
    sessions: ['Weekly Q&A Webinar', 'Monthly Expert Panel', 'Peer Mentoring Circles'],
    assignments: ['Business Plan Financial Section', 'Cash Flow Forecast', 'Loan Application Package'],
    certificate: 'Certificate in SME Financial Management',
  },
  {
    id: 'leadership-development',
    name: 'Leadership Development Programme',
    description: 'Build next-generation African business leaders',
    icon: 'Users',
    duration: '16 weeks',
    modules: 8,
    targetAudience: 'Middle Managers, Team Leaders, High-Potential Talent',
    languages: ['en', 'fr', 'pt'],
    curriculum: [
      { title: 'Self-Leadership & Emotional Intelligence', duration: '2 weeks', lessons: 6 },
      { title: 'Strategic Thinking & Decision Making', duration: '2 weeks', lessons: 7 },
      { title: 'Leading Teams & Managing Performance', duration: '2 weeks', lessons: 8 },
      { title: 'Communication & Influence', duration: '2 weeks', lessons: 6 },
      { title: 'Change Management', duration: '2 weeks', lessons: 5 },
      { title: 'Innovation & Problem Solving', duration: '2 weeks', lessons: 7 },
      { title: 'Cross-Cultural Leadership in Africa', duration: '2 weeks', lessons: 6 },
      { title: 'Leading with Purpose', duration: '2 weeks', lessons: 5 },
    ],
    sessions: ['Bi-weekly Leadership Labs', 'Monthly Fireside Chat', 'Action Learning Projects'],
    assignments: ['Leadership Self-Assessment', 'Change Initiative Plan', 'Leadership Portfolio'],
    certificate: 'Certificate in African Business Leadership',
  },
  {
    id: 'digital-skills',
    name: 'Digital Skills Bootcamp',
    description: 'Essential digital competencies for the modern African workforce',
    icon: 'Monitor',
    duration: '8 weeks',
    modules: 4,
    targetAudience: 'All Staff, New Hires, Career Changers',
    languages: ['en'],
    curriculum: [
      { title: 'Digital Foundations & Productivity', duration: '2 weeks', lessons: 10 },
      { title: 'Data Literacy & Analytics', duration: '2 weeks', lessons: 8 },
      { title: 'Digital Communication & Collaboration', duration: '2 weeks', lessons: 6 },
      { title: 'Cybersecurity & Digital Ethics', duration: '2 weeks', lessons: 7 },
    ],
    sessions: ['Weekly Hands-On Workshop', 'Tech Demo Sessions'],
    assignments: ['Digital Portfolio', 'Data Analysis Project', 'Security Audit Checklist'],
    certificate: 'Certificate in Digital Competency',
  },
]
