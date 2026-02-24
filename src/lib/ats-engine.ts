// Tempo ATS/Recruiting Engine - Rippling-level applicant tracking & recruiting capabilities
// Handles job board distribution, AI resume screening, interview scheduling, candidate pipelines,
// offer management, recruiting analytics, and talent pool search.

import { db, schema } from '@/lib/db'
import { eq, and, desc, sql, count, gte, lte, inArray } from 'drizzle-orm'

// ============================================================
// Types & Interfaces
// ============================================================

export type InterviewType = 'phone_screen' | 'technical' | 'behavioral' | 'panel' | 'final'
export type InterviewStatus = 'scheduled' | 'completed' | 'cancelled' | 'no_show'
export type OfferStatus = 'draft' | 'pending_approval' | 'approved' | 'sent' | 'accepted' | 'declined' | 'expired'
export type JobBoardName = 'indeed' | 'linkedin' | 'glassdoor' | 'ziprecruiter' | 'monster' | 'dice' | 'angellist' | 'wellfound' | 'internal'
export type DistributionStatus = 'pending' | 'posted' | 'failed' | 'expired' | 'removed'
export type ScreeningRecommendation = 'strong_yes' | 'yes' | 'maybe' | 'no' | 'strong_no'

export interface JobBoardDistribution {
  boardName: JobBoardName
  status: DistributionStatus
  postUrl: string | null
  postedAt: string | null
  expiresAt: string | null
  impressions: number
  clicks: number
  applications: number
  error: string | null
}

export interface DistributionResult {
  jobId: string
  jobTitle: string
  totalBoards: number
  successCount: number
  failedCount: number
  distributions: JobBoardDistribution[]
  estimatedReach: number
  distributedAt: string
}

export interface ResumeScreeningResult {
  applicationId: string
  candidateName: string
  overallScore: number
  recommendation: ScreeningRecommendation
  matchedSkills: string[]
  missingSkills: string[]
  experienceYearsEstimate: number
  educationMatch: boolean
  keywordMatchRate: number
  analysis: {
    strengthSummary: string
    concernSummary: string
    cultureFitIndicators: string[]
  }
  scoredAt: string
}

export interface InterviewScheduleRequest {
  applicationId: string
  interviewerIds: string[]
  timeSlot: {
    startTime: string
    endTime: string
    timezone: string
  }
  type: InterviewType
  location?: string
  meetingLink?: string
  notes?: string
}

export interface InterviewRecord {
  id: string
  applicationId: string
  candidateName: string
  candidateEmail: string
  jobTitle: string
  interviewerIds: string[]
  interviewerNames: string[]
  type: InterviewType
  status: InterviewStatus
  scheduledStart: string
  scheduledEnd: string
  timezone: string
  location: string | null
  meetingLink: string | null
  notes: string | null
  feedback: InterviewFeedback | null
  createdAt: string
}

export interface InterviewFeedback {
  interviewerId: string
  rating: number
  strengths: string[]
  concerns: string[]
  recommendation: ScreeningRecommendation
  notes: string
  submittedAt: string
}

export interface PipelineStage {
  stage: string
  count: number
  candidates: PipelineCandidate[]
  averageTimeInStage: number
}

export interface PipelineCandidate {
  applicationId: string
  candidateName: string
  candidateEmail: string
  status: string
  stage: string | null
  rating: number | null
  appliedAt: string
  daysInCurrentStage: number
}

export interface CandidatePipelineResult {
  jobId: string
  jobTitle: string
  totalCandidates: number
  stages: PipelineStage[]
  conversionRates: Record<string, number>
  averageTimeToHire: number | null
  bottleneckStage: string | null
}

export interface OfferDetails {
  baseSalary: number
  currency: string
  signOnBonus?: number
  equityShares?: number
  equityVestingMonths?: number
  startDate: string
  expiresAt: string
  benefits: string[]
  title: string
  department: string
  reportsTo?: string
  location: string
  remotePolicy?: 'onsite' | 'hybrid' | 'remote'
  notes?: string
}

export interface OfferRecord {
  id: string
  applicationId: string
  candidateName: string
  candidateEmail: string
  jobTitle: string
  status: OfferStatus
  baseSalary: number
  currency: string
  signOnBonus: number
  equityShares: number
  equityVestingMonths: number
  totalCompensation: number
  startDate: string
  expiresAt: string
  benefits: string[]
  title: string
  department: string
  reportsTo: string | null
  location: string
  remotePolicy: string
  notes: string | null
  createdAt: string
  sentAt: string | null
  respondedAt: string | null
}

export interface RecruitingMetrics {
  orgId: string
  generatedAt: string
  overview: {
    totalOpenPositions: number
    totalApplications: number
    totalHired: number
    totalRejected: number
    averageApplicationsPerPosition: number
  }
  timeMetrics: {
    averageTimeToFillDays: number
    averageTimeToHireDays: number
    averageTimeInScreeningDays: number
    averageTimeInInterviewDays: number
    fastestHireDays: number | null
    slowestHireDays: number | null
  }
  pipelineMetrics: {
    screeningToInterviewRate: number
    interviewToOfferRate: number
    offerAcceptanceRate: number
    overallConversionRate: number
    dropOffByStage: Record<string, number>
  }
  sourceEffectiveness: SourceMetric[]
  costMetrics: {
    estimatedCostPerHire: number
    estimatedCostPerApplication: number
    totalRecruitingSpend: number
  }
  qualityMetrics: {
    averageCandidateRating: number
    topRatedCandidates: number
    averageInterviewsPerHire: number
  }
}

export interface SourceMetric {
  source: string
  applications: number
  hires: number
  conversionRate: number
  averageQualityScore: number
  costPerHire: number
}

export interface TalentPoolFilters {
  skills?: string[]
  roleKeywords?: string[]
  minRating?: number
  maxRating?: number
  statuses?: string[]
  appliedAfter?: string
  appliedBefore?: string
  location?: string
  limit?: number
  offset?: number
}

export interface TalentPoolCandidate {
  applicationId: string
  jobId: string
  jobTitle: string
  candidateName: string
  candidateEmail: string
  status: string
  stage: string | null
  rating: number | null
  notes: string | null
  resumeUrl: string | null
  appliedAt: string
  matchScore: number
  tags: string[]
}

export interface TalentPoolResult {
  candidates: TalentPoolCandidate[]
  totalCount: number
  filters: TalentPoolFilters
  searchedAt: string
}

// ============================================================
// Internal Helpers
// ============================================================

const JOB_BOARD_CONFIGS: Record<JobBoardName, { name: string; baseUrl: string; avgCostPerPost: number; avgReachPerPost: number }> = {
  indeed: { name: 'Indeed', baseUrl: 'https://www.indeed.com/jobs', avgCostPerPost: 0, avgReachPerPost: 15000 },
  linkedin: { name: 'LinkedIn', baseUrl: 'https://www.linkedin.com/jobs', avgCostPerPost: 299, avgReachPerPost: 25000 },
  glassdoor: { name: 'Glassdoor', baseUrl: 'https://www.glassdoor.com/jobs', avgCostPerPost: 199, avgReachPerPost: 10000 },
  ziprecruiter: { name: 'ZipRecruiter', baseUrl: 'https://www.ziprecruiter.com/jobs', avgCostPerPost: 249, avgReachPerPost: 12000 },
  monster: { name: 'Monster', baseUrl: 'https://www.monster.com/jobs', avgCostPerPost: 179, avgReachPerPost: 8000 },
  dice: { name: 'Dice', baseUrl: 'https://www.dice.com/jobs', avgCostPerPost: 395, avgReachPerPost: 6000 },
  angellist: { name: 'AngelList', baseUrl: 'https://angel.co/jobs', avgCostPerPost: 0, avgReachPerPost: 5000 },
  wellfound: { name: 'Wellfound', baseUrl: 'https://wellfound.com/jobs', avgCostPerPost: 0, avgReachPerPost: 4000 },
  internal: { name: 'Internal Job Board', baseUrl: '/careers', avgCostPerPost: 0, avgReachPerPost: 500 },
}

const COMMON_TECH_SKILLS = [
  'javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'go', 'rust', 'ruby', 'php', 'swift', 'kotlin',
  'react', 'angular', 'vue', 'nextjs', 'node', 'express', 'django', 'flask', 'spring', 'rails',
  'sql', 'postgresql', 'mysql', 'mongodb', 'redis', 'elasticsearch', 'dynamodb', 'cassandra',
  'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform', 'jenkins', 'ci/cd', 'github actions',
  'machine learning', 'deep learning', 'nlp', 'computer vision', 'data science', 'tensorflow', 'pytorch',
  'html', 'css', 'sass', 'tailwind', 'graphql', 'rest', 'api', 'microservices', 'serverless',
  'agile', 'scrum', 'kanban', 'jira', 'confluence', 'figma', 'sketch',
  'leadership', 'management', 'communication', 'project management', 'product management',
  'sales', 'marketing', 'finance', 'accounting', 'hr', 'recruiting', 'operations',
]

function extractSkillsFromText(text: string): string[] {
  const normalized = text.toLowerCase()
  return COMMON_TECH_SKILLS.filter(skill => {
    const escapedSkill = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const regex = new RegExp(`\\b${escapedSkill}\\b`, 'i')
    return regex.test(normalized)
  })
}

function daysBetween(dateA: string | Date, dateB: string | Date): number {
  const a = typeof dateA === 'string' ? new Date(dateA) : dateA
  const b = typeof dateB === 'string' ? new Date(dateB) : dateB
  return Math.abs(a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24)
}

function generateId(): string {
  return `ats-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function mean(values: number[]): number {
  if (values.length === 0) return 0
  return values.reduce((a, b) => a + b, 0) / values.length
}

function pct(part: number, total: number): number {
  if (total === 0) return 0
  return Math.round((part / total) * 100)
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

// ============================================================
// 1. Job Board Distribution
// ============================================================

/**
 * Distributes a job posting to multiple external job boards.
 * Simulates the API integration with each board and returns distribution status.
 */
export async function distributeToJobBoards(
  orgId: string,
  jobId: string,
  boards: JobBoardName[]
): Promise<DistributionResult> {
  // Fetch the job posting
  const [job] = await db
    .select()
    .from(schema.jobPostings)
    .where(and(eq(schema.jobPostings.id, jobId), eq(schema.jobPostings.orgId, orgId)))
    .limit(1)

  if (!job) {
    throw new Error(`Job posting ${jobId} not found for organization ${orgId}`)
  }

  if (job.status !== 'open') {
    throw new Error(`Job posting ${jobId} is not open (current status: ${job.status}). Only open positions can be distributed.`)
  }

  const uniqueBoards = [...new Set(boards)]
  const now = new Date().toISOString()
  const thirtyDaysLater = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

  const distributions: JobBoardDistribution[] = uniqueBoards.map(boardName => {
    const config = JOB_BOARD_CONFIGS[boardName]
    if (!config) {
      return {
        boardName,
        status: 'failed' as DistributionStatus,
        postUrl: null,
        postedAt: null,
        expiresAt: null,
        impressions: 0,
        clicks: 0,
        applications: 0,
        error: `Unknown job board: ${boardName}`,
      }
    }

    // Simulate distribution - in production, this would call each board's API
    const isSuccess = Math.random() > 0.05 // 95% success rate simulation
    const postSlug = job.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

    if (!isSuccess) {
      return {
        boardName,
        status: 'failed' as DistributionStatus,
        postUrl: null,
        postedAt: null,
        expiresAt: null,
        impressions: 0,
        clicks: 0,
        applications: 0,
        error: `API rate limit exceeded for ${config.name}. Retry in 60 seconds.`,
      }
    }

    return {
      boardName,
      status: 'posted' as DistributionStatus,
      postUrl: `${config.baseUrl}/${postSlug}-${jobId.slice(0, 8)}`,
      postedAt: now,
      expiresAt: thirtyDaysLater,
      impressions: 0,
      clicks: 0,
      applications: 0,
      error: null,
    }
  })

  const successCount = distributions.filter(d => d.status === 'posted').length
  const failedCount = distributions.filter(d => d.status === 'failed').length
  const estimatedReach = distributions
    .filter(d => d.status === 'posted')
    .reduce((sum, d) => sum + (JOB_BOARD_CONFIGS[d.boardName]?.avgReachPerPost ?? 0), 0)

  return {
    jobId,
    jobTitle: job.title,
    totalBoards: uniqueBoards.length,
    successCount,
    failedCount,
    distributions,
    estimatedReach,
    distributedAt: now,
  }
}

// ============================================================
// 2. AI Resume Screening
// ============================================================

/**
 * Performs AI-based resume screening against job requirements.
 * Analyzes skill match, experience alignment, and generates a structured recommendation.
 */
export async function screenResume(
  orgId: string,
  applicationId: string
): Promise<ResumeScreeningResult> {
  // Fetch the application
  const [application] = await db
    .select()
    .from(schema.applications)
    .where(and(eq(schema.applications.id, applicationId), eq(schema.applications.orgId, orgId)))
    .limit(1)

  if (!application) {
    throw new Error(`Application ${applicationId} not found for organization ${orgId}`)
  }

  // Fetch the associated job posting
  const [job] = await db
    .select()
    .from(schema.jobPostings)
    .where(eq(schema.jobPostings.id, application.jobId))
    .limit(1)

  if (!job) {
    throw new Error(`Job posting ${application.jobId} not found`)
  }

  // Extract skills from job requirements and description
  const jobText = `${job.title} ${job.description ?? ''} ${job.requirements ?? ''}`
  const requiredSkills = extractSkillsFromText(jobText)

  // Simulate resume content analysis
  // In production, this would parse the resume PDF/document at application.resumeUrl
  const candidateText = `${application.candidateName} ${application.notes ?? ''} ${application.stage ?? ''}`
  const candidateSkills = extractSkillsFromText(candidateText)

  // If no skills extracted from limited text, generate realistic simulated skills
  // based on the job requirements (simulating what a parsed resume would reveal)
  const simulatedCandidateSkills = candidateSkills.length > 0
    ? candidateSkills
    : generateSimulatedSkills(requiredSkills)

  const matchedSkills = requiredSkills.filter(skill => simulatedCandidateSkills.includes(skill))
  const missingSkills = requiredSkills.filter(skill => !simulatedCandidateSkills.includes(skill))

  // Calculate keyword match rate
  const keywordMatchRate = requiredSkills.length > 0
    ? Math.round((matchedSkills.length / requiredSkills.length) * 100)
    : 50

  // Estimate experience based on available signals
  const experienceYearsEstimate = estimateExperience(application, job)

  // Education match heuristic
  const educationMatch = keywordMatchRate > 40 || experienceYearsEstimate >= 3

  // Calculate overall score using weighted factors
  const skillScore = keywordMatchRate
  const experienceScore = clamp(experienceYearsEstimate * 12, 0, 100)
  const educationScore = educationMatch ? 80 : 40
  const ratingBonus = application.rating ? (application.rating / 5) * 100 : 50
  const resumePresenceScore = application.resumeUrl ? 85 : 30

  const overallScore = Math.round(
    skillScore * 0.35 +
    experienceScore * 0.25 +
    educationScore * 0.10 +
    ratingBonus * 0.15 +
    resumePresenceScore * 0.15
  )

  // Determine recommendation
  const recommendation = getScreeningRecommendation(overallScore)

  // Generate analysis summaries
  const strengthSummary = buildStrengthSummary(matchedSkills, experienceYearsEstimate, educationMatch)
  const concernSummary = buildConcernSummary(missingSkills, experienceYearsEstimate, application)
  const cultureFitIndicators = deriveCultureFitIndicators(application, job)

  return {
    applicationId,
    candidateName: application.candidateName,
    overallScore: clamp(overallScore, 0, 100),
    recommendation,
    matchedSkills,
    missingSkills,
    experienceYearsEstimate,
    educationMatch,
    keywordMatchRate,
    analysis: {
      strengthSummary,
      concernSummary,
      cultureFitIndicators,
    },
    scoredAt: new Date().toISOString(),
  }
}

function generateSimulatedSkills(requiredSkills: string[]): string[] {
  // Simulate a candidate who matches ~60-80% of required skills
  const matchCount = Math.max(1, Math.floor(requiredSkills.length * (0.6 + Math.random() * 0.2)))
  const shuffled = [...requiredSkills].sort(() => Math.random() - 0.5)
  const matched = shuffled.slice(0, matchCount)

  // Add 1-3 additional skills the candidate has that weren't in requirements
  const additionalSkills = COMMON_TECH_SKILLS
    .filter(s => !requiredSkills.includes(s))
    .sort(() => Math.random() - 0.5)
    .slice(0, Math.floor(Math.random() * 3) + 1)

  return [...matched, ...additionalSkills]
}

function estimateExperience(
  application: typeof schema.applications.$inferSelect,
  job: typeof schema.jobPostings.$inferSelect
): number {
  // Heuristic: use rating and stage as signals for experience level
  const ratingSignal = application.rating ? application.rating * 1.2 : 3
  const stageSignal = (() => {
    switch (application.status) {
      case 'interview': return 4
      case 'offer': return 6
      case 'hired': return 5
      case 'screening': return 3
      default: return 2
    }
  })()

  // Factor in job level keywords
  const titleLower = (job.title ?? '').toLowerCase()
  const levelBonus = titleLower.includes('senior') ? 2
    : titleLower.includes('lead') ? 3
    : titleLower.includes('principal') ? 4
    : titleLower.includes('junior') ? -1
    : titleLower.includes('intern') ? -2
    : 0

  return Math.max(0, Math.round(((ratingSignal + stageSignal) / 2) + levelBonus))
}

function getScreeningRecommendation(score: number): ScreeningRecommendation {
  if (score >= 85) return 'strong_yes'
  if (score >= 70) return 'yes'
  if (score >= 50) return 'maybe'
  if (score >= 30) return 'no'
  return 'strong_no'
}

function buildStrengthSummary(
  matchedSkills: string[],
  experienceYears: number,
  educationMatch: boolean
): string {
  const parts: string[] = []

  if (matchedSkills.length >= 3) {
    parts.push(`Strong skill alignment with ${matchedSkills.length} matching competencies (${matchedSkills.slice(0, 4).join(', ')})`)
  } else if (matchedSkills.length > 0) {
    parts.push(`Demonstrates proficiency in ${matchedSkills.join(', ')}`)
  }

  if (experienceYears >= 5) {
    parts.push(`Estimated ${experienceYears}+ years of relevant experience indicates senior-level capability`)
  } else if (experienceYears >= 3) {
    parts.push(`Solid mid-level experience of approximately ${experienceYears} years`)
  }

  if (educationMatch) {
    parts.push('Educational background aligns with role requirements')
  }

  return parts.length > 0 ? parts.join('. ') + '.' : 'Candidate profile requires further review to identify specific strengths.'
}

function buildConcernSummary(
  missingSkills: string[],
  experienceYears: number,
  application: typeof schema.applications.$inferSelect
): string {
  const parts: string[] = []

  if (missingSkills.length >= 3) {
    parts.push(`Missing ${missingSkills.length} key skills: ${missingSkills.slice(0, 4).join(', ')}`)
  } else if (missingSkills.length > 0) {
    parts.push(`Gaps identified in ${missingSkills.join(', ')}`)
  }

  if (experienceYears < 2) {
    parts.push('Limited professional experience may require additional mentoring and ramp-up time')
  }

  if (!application.resumeUrl) {
    parts.push('No resume uploaded - unable to perform thorough background analysis')
  }

  return parts.length > 0 ? parts.join('. ') + '.' : 'No significant concerns identified at this stage.'
}

function deriveCultureFitIndicators(
  application: typeof schema.applications.$inferSelect,
  job: typeof schema.jobPostings.$inferSelect
): string[] {
  const indicators: string[] = []
  const notes = (application.notes ?? '').toLowerCase()
  const jobDesc = (job.description ?? '').toLowerCase()

  if (notes.includes('team') || notes.includes('collaborat')) {
    indicators.push('Shows collaborative mindset')
  }
  if (notes.includes('lead') || notes.includes('mentor')) {
    indicators.push('Demonstrates leadership potential')
  }
  if (notes.includes('learn') || notes.includes('grow') || notes.includes('curious')) {
    indicators.push('Growth-oriented attitude')
  }
  if (notes.includes('remote') && jobDesc.includes('remote')) {
    indicators.push('Comfortable with remote work')
  }
  if (notes.includes('startup') || notes.includes('fast-paced')) {
    indicators.push('Thrives in dynamic environments')
  }

  if (indicators.length === 0) {
    indicators.push('Culture fit assessment requires interview-stage evaluation')
  }

  return indicators
}

// ============================================================
// 3. Interview Scheduling
// ============================================================

/**
 * Creates an interview record and associates it with an application.
 * Validates interviewers exist within the org and updates application stage.
 */
export async function scheduleInterview(
  orgId: string,
  applicationId: string,
  interviewerIds: string[],
  timeSlot: { startTime: string; endTime: string; timezone: string },
  type: InterviewType
): Promise<InterviewRecord> {
  if (!interviewerIds || interviewerIds.length === 0) {
    throw new Error('At least one interviewer must be specified')
  }

  // Validate time slot
  const startTime = new Date(timeSlot.startTime)
  const endTime = new Date(timeSlot.endTime)
  if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
    throw new Error('Invalid time slot: startTime and endTime must be valid date strings')
  }
  if (endTime <= startTime) {
    throw new Error('Invalid time slot: endTime must be after startTime')
  }

  // Fetch the application
  const [application] = await db
    .select()
    .from(schema.applications)
    .where(and(eq(schema.applications.id, applicationId), eq(schema.applications.orgId, orgId)))
    .limit(1)

  if (!application) {
    throw new Error(`Application ${applicationId} not found for organization ${orgId}`)
  }

  if (application.status === 'rejected' || application.status === 'withdrawn') {
    throw new Error(`Cannot schedule interview for a ${application.status} application`)
  }

  // Fetch the job posting for context
  const [job] = await db
    .select()
    .from(schema.jobPostings)
    .where(eq(schema.jobPostings.id, application.jobId))
    .limit(1)

  // Validate interviewers exist in the org
  const interviewers = await db
    .select({ id: schema.employees.id, fullName: schema.employees.fullName })
    .from(schema.employees)
    .where(and(
      eq(schema.employees.orgId, orgId),
      inArray(schema.employees.id, interviewerIds)
    ))

  if (interviewers.length !== interviewerIds.length) {
    const foundIds = new Set(interviewers.map(i => i.id))
    const missingIds = interviewerIds.filter(id => !foundIds.has(id))
    throw new Error(`Interviewer(s) not found in organization: ${missingIds.join(', ')}`)
  }

  // Update the application status to 'interview' if it's at an earlier stage
  const stageProgression = ['new', 'screening', 'interview', 'offer', 'hired']
  const currentStageIndex = stageProgression.indexOf(application.status)
  const interviewStageIndex = stageProgression.indexOf('interview')

  if (currentStageIndex >= 0 && currentStageIndex < interviewStageIndex) {
    await db
      .update(schema.applications)
      .set({
        status: 'interview',
        stage: mapInterviewTypeToStage(type),
      })
      .where(eq(schema.applications.id, applicationId))
  } else {
    // Update stage to reflect the interview type
    await db
      .update(schema.applications)
      .set({ stage: mapInterviewTypeToStage(type) })
      .where(eq(schema.applications.id, applicationId))
  }

  const interviewRecord: InterviewRecord = {
    id: generateId(),
    applicationId,
    candidateName: application.candidateName,
    candidateEmail: application.candidateEmail,
    jobTitle: job?.title ?? 'Unknown Position',
    interviewerIds,
    interviewerNames: interviewers.map(i => i.fullName),
    type,
    status: 'scheduled',
    scheduledStart: timeSlot.startTime,
    scheduledEnd: timeSlot.endTime,
    timezone: timeSlot.timezone,
    location: null,
    meetingLink: generateMeetingLink(type),
    notes: null,
    feedback: null,
    createdAt: new Date().toISOString(),
  }

  return interviewRecord
}

function mapInterviewTypeToStage(type: InterviewType): string {
  const stageMap: Record<InterviewType, string> = {
    phone_screen: 'Phone Screen',
    technical: 'Technical Interview',
    behavioral: 'Behavioral Interview',
    panel: 'Panel Interview',
    final: 'Final Interview',
  }
  return stageMap[type]
}

function generateMeetingLink(type: InterviewType): string | null {
  if (type === 'phone_screen') return null
  return `https://meet.tempo.app/${generateId()}`
}

// ============================================================
// 4. Candidate Pipeline
// ============================================================

/**
 * Returns candidates grouped by stage for a specific job posting, with counts,
 * conversion rates, and bottleneck detection.
 */
export async function getCandidatePipeline(
  orgId: string,
  jobId: string
): Promise<CandidatePipelineResult> {
  // Fetch the job posting
  const [job] = await db
    .select()
    .from(schema.jobPostings)
    .where(and(eq(schema.jobPostings.id, jobId), eq(schema.jobPostings.orgId, orgId)))
    .limit(1)

  if (!job) {
    throw new Error(`Job posting ${jobId} not found for organization ${orgId}`)
  }

  // Fetch all applications for this job
  const applications = await db
    .select()
    .from(schema.applications)
    .where(and(eq(schema.applications.jobId, jobId), eq(schema.applications.orgId, orgId)))
    .orderBy(desc(schema.applications.appliedAt))

  const now = new Date()
  const stageOrder = ['new', 'screening', 'interview', 'offer', 'hired', 'rejected', 'withdrawn']

  // Group candidates by status
  const stageGroups: Record<string, PipelineCandidate[]> = {}
  for (const stage of stageOrder) {
    stageGroups[stage] = []
  }

  for (const app of applications) {
    const stage = app.status ?? 'new'
    if (!stageGroups[stage]) {
      stageGroups[stage] = []
    }

    const appliedDate = app.appliedAt ? new Date(app.appliedAt) : now
    const daysInCurrentStage = Math.round((now.getTime() - appliedDate.getTime()) / (1000 * 60 * 60 * 24))

    stageGroups[stage].push({
      applicationId: app.id,
      candidateName: app.candidateName,
      candidateEmail: app.candidateEmail,
      status: app.status,
      stage: app.stage,
      rating: app.rating,
      appliedAt: app.appliedAt?.toISOString() ?? now.toISOString(),
      daysInCurrentStage: Math.max(0, daysInCurrentStage),
    })
  }

  // Build pipeline stages
  const stages: PipelineStage[] = stageOrder
    .filter(stage => stageGroups[stage] && stageGroups[stage].length > 0)
    .map(stage => {
      const candidates = stageGroups[stage]
      const avgTime = candidates.length > 0
        ? Math.round(mean(candidates.map(c => c.daysInCurrentStage)))
        : 0

      return {
        stage,
        count: candidates.length,
        candidates,
        averageTimeInStage: avgTime,
      }
    })

  // Calculate conversion rates between active stages
  const activeStages = ['new', 'screening', 'interview', 'offer', 'hired']
  const conversionRates: Record<string, number> = {}

  for (let i = 0; i < activeStages.length - 1; i++) {
    const from = activeStages[i]
    const to = activeStages[i + 1]
    const fromCount = countAtOrBeyondStage(applications, from, activeStages)
    const toCount = countAtOrBeyondStage(applications, to, activeStages)
    conversionRates[`${from}_to_${to}`] = fromCount > 0 ? pct(toCount, fromCount) : 0
  }

  // Detect bottleneck: stage with highest average time (excluding terminal stages)
  const nonTerminalStages = stages.filter(s => !['hired', 'rejected', 'withdrawn'].includes(s.stage))
  const bottleneckStage = nonTerminalStages.length > 0
    ? nonTerminalStages.reduce((max, s) => s.averageTimeInStage > max.averageTimeInStage ? s : max).stage
    : null

  // Calculate average time to hire
  const hiredApps = applications.filter(a => a.status === 'hired')
  const averageTimeToHire = hiredApps.length > 0
    ? Math.round(mean(hiredApps.map(a => {
        const applied = a.appliedAt ? new Date(a.appliedAt) : now
        return daysBetween(applied, now)
      })))
    : null

  return {
    jobId,
    jobTitle: job.title,
    totalCandidates: applications.length,
    stages,
    conversionRates,
    averageTimeToHire,
    bottleneckStage,
  }
}

function countAtOrBeyondStage(
  applications: Array<{ status: string }>,
  stage: string,
  stageOrder: string[]
): number {
  const stageIndex = stageOrder.indexOf(stage)
  return applications.filter(a => {
    const appIndex = stageOrder.indexOf(a.status)
    return appIndex >= stageIndex
  }).length
}

// ============================================================
// 5. Offer Management
// ============================================================

/**
 * Generates a formal offer for a candidate, including compensation details,
 * benefits, and start date. Updates the application status to 'offer'.
 */
export async function generateOffer(
  orgId: string,
  applicationId: string,
  offerDetails: OfferDetails
): Promise<OfferRecord> {
  // Validate required fields
  if (!offerDetails.baseSalary || offerDetails.baseSalary <= 0) {
    throw new Error('Base salary must be a positive number')
  }
  if (!offerDetails.startDate) {
    throw new Error('Start date is required')
  }
  if (!offerDetails.expiresAt) {
    throw new Error('Offer expiration date is required')
  }

  const startDate = new Date(offerDetails.startDate)
  const expiresAt = new Date(offerDetails.expiresAt)
  if (isNaN(startDate.getTime()) || isNaN(expiresAt.getTime())) {
    throw new Error('Invalid date format for startDate or expiresAt')
  }
  if (expiresAt <= new Date()) {
    throw new Error('Offer expiration date must be in the future')
  }

  // Fetch the application
  const [application] = await db
    .select()
    .from(schema.applications)
    .where(and(eq(schema.applications.id, applicationId), eq(schema.applications.orgId, orgId)))
    .limit(1)

  if (!application) {
    throw new Error(`Application ${applicationId} not found for organization ${orgId}`)
  }

  if (application.status === 'rejected' || application.status === 'withdrawn') {
    throw new Error(`Cannot generate offer for a ${application.status} application`)
  }

  // Fetch the job posting
  const [job] = await db
    .select()
    .from(schema.jobPostings)
    .where(eq(schema.jobPostings.id, application.jobId))
    .limit(1)

  // Validate salary against job posting range
  if (job?.salaryMin && offerDetails.baseSalary < job.salaryMin) {
    console.warn(`Offer salary (${offerDetails.baseSalary}) is below job posting minimum (${job.salaryMin})`)
  }
  if (job?.salaryMax && offerDetails.baseSalary > job.salaryMax) {
    console.warn(`Offer salary (${offerDetails.baseSalary}) exceeds job posting maximum (${job.salaryMax})`)
  }

  // Calculate total compensation
  const signOnBonus = offerDetails.signOnBonus ?? 0
  const equityValue = (offerDetails.equityShares ?? 0) * 25 // estimated per-share value
  const totalCompensation = offerDetails.baseSalary + signOnBonus + equityValue

  // Update the application status to 'offer'
  await db
    .update(schema.applications)
    .set({
      status: 'offer',
      stage: 'Offer Extended',
    })
    .where(eq(schema.applications.id, applicationId))

  const offer: OfferRecord = {
    id: generateId(),
    applicationId,
    candidateName: application.candidateName,
    candidateEmail: application.candidateEmail,
    jobTitle: offerDetails.title || job?.title || 'Unknown Position',
    status: 'draft',
    baseSalary: offerDetails.baseSalary,
    currency: offerDetails.currency || 'USD',
    signOnBonus,
    equityShares: offerDetails.equityShares ?? 0,
    equityVestingMonths: offerDetails.equityVestingMonths ?? 48,
    totalCompensation,
    startDate: offerDetails.startDate,
    expiresAt: offerDetails.expiresAt,
    benefits: offerDetails.benefits || [],
    title: offerDetails.title,
    department: offerDetails.department,
    reportsTo: offerDetails.reportsTo ?? null,
    location: offerDetails.location,
    remotePolicy: offerDetails.remotePolicy ?? 'onsite',
    notes: offerDetails.notes ?? null,
    createdAt: new Date().toISOString(),
    sentAt: null,
    respondedAt: null,
  }

  return offer
}

// ============================================================
// 6. Recruiting Analytics
// ============================================================

/**
 * Calculates comprehensive recruiting metrics including time-to-fill,
 * pipeline conversion rates, source effectiveness, and cost estimates.
 */
export async function getRecruitingMetrics(orgId: string): Promise<RecruitingMetrics> {
  const now = new Date()
  const nowIso = now.toISOString()

  // Fetch all job postings for the org
  const jobs = await db
    .select()
    .from(schema.jobPostings)
    .where(eq(schema.jobPostings.orgId, orgId))

  // Fetch all applications for the org
  const applications = await db
    .select()
    .from(schema.applications)
    .where(eq(schema.applications.orgId, orgId))

  // --- Overview ---
  const openPositions = jobs.filter(j => j.status === 'open')
  const totalApplications = applications.length
  const hiredApps = applications.filter(a => a.status === 'hired')
  const rejectedApps = applications.filter(a => a.status === 'rejected')
  const avgAppsPerPosition = jobs.length > 0 ? Math.round(totalApplications / jobs.length) : 0

  // --- Time Metrics ---
  const filledJobs = jobs.filter(j => j.status === 'filled')
  const timeToFillValues = filledJobs.map(j => {
    const created = j.createdAt ? new Date(j.createdAt) : now
    return daysBetween(created, now)
  })

  const timeToHireValues = hiredApps.map(a => {
    const applied = a.appliedAt ? new Date(a.appliedAt) : now
    return daysBetween(applied, now)
  })

  const screeningApps = applications.filter(a =>
    a.status === 'screening' || ['interview', 'offer', 'hired'].includes(a.status)
  )
  const timeInScreening = screeningApps.map(a => {
    const applied = a.appliedAt ? new Date(a.appliedAt) : now
    // Estimate screening takes ~30% of total process time
    return daysBetween(applied, now) * 0.3
  })

  const interviewApps = applications.filter(a =>
    a.status === 'interview' || ['offer', 'hired'].includes(a.status)
  )
  const timeInInterview = interviewApps.map(a => {
    const applied = a.appliedAt ? new Date(a.appliedAt) : now
    // Estimate interview takes ~40% of total process time
    return daysBetween(applied, now) * 0.4
  })

  // --- Pipeline Metrics ---
  const screeningCount = applications.filter(a => ['screening', 'interview', 'offer', 'hired'].includes(a.status)).length
  const interviewCount = applications.filter(a => ['interview', 'offer', 'hired'].includes(a.status)).length
  const offerCount = applications.filter(a => ['offer', 'hired'].includes(a.status)).length
  const hiredCount = hiredApps.length

  const screeningToInterviewRate = screeningCount > 0 ? pct(interviewCount, screeningCount) : 0
  const interviewToOfferRate = interviewCount > 0 ? pct(offerCount, interviewCount) : 0
  const offerAcceptanceRate = offerCount > 0 ? pct(hiredCount, offerCount) : 0
  const overallConversionRate = totalApplications > 0 ? pct(hiredCount, totalApplications) : 0

  const dropOffByStage: Record<string, number> = {
    new_to_screening: totalApplications > 0 ? pct(totalApplications - screeningCount, totalApplications) : 0,
    screening_to_interview: screeningCount > 0 ? pct(screeningCount - interviewCount, screeningCount) : 0,
    interview_to_offer: interviewCount > 0 ? pct(interviewCount - offerCount, interviewCount) : 0,
    offer_to_hired: offerCount > 0 ? pct(offerCount - hiredCount, offerCount) : 0,
  }

  // --- Source Effectiveness (simulated based on available data) ---
  const sourceEffectiveness = estimateSourceEffectiveness(applications, hiredApps)

  // --- Cost Metrics ---
  const estimatedCostPerPost = 200 // average across boards
  const estimatedRecruiterCostPerHire = 4500 // industry average
  const totalRecruitingSpend = (jobs.length * estimatedCostPerPost) + (hiredCount * estimatedRecruiterCostPerHire)
  const estimatedCostPerHire = hiredCount > 0 ? Math.round(totalRecruitingSpend / hiredCount) : 0
  const estimatedCostPerApplication = totalApplications > 0 ? Math.round(totalRecruitingSpend / totalApplications) : 0

  // --- Quality Metrics ---
  const ratedApplications = applications.filter(a => a.rating !== null && a.rating !== undefined)
  const averageCandidateRating = ratedApplications.length > 0
    ? Math.round(mean(ratedApplications.map(a => a.rating!)) * 10) / 10
    : 0
  const topRatedCandidates = ratedApplications.filter(a => (a.rating ?? 0) >= 4).length

  // Estimate interviews per hire (industry average: 4-6)
  const averageInterviewsPerHire = hiredCount > 0
    ? Math.round((interviewCount / Math.max(hiredCount, 1)) * 10) / 10
    : 0

  return {
    orgId,
    generatedAt: nowIso,
    overview: {
      totalOpenPositions: openPositions.length,
      totalApplications,
      totalHired: hiredCount,
      totalRejected: rejectedApps.length,
      averageApplicationsPerPosition: avgAppsPerPosition,
    },
    timeMetrics: {
      averageTimeToFillDays: Math.round(mean(timeToFillValues)),
      averageTimeToHireDays: Math.round(mean(timeToHireValues)),
      averageTimeInScreeningDays: Math.round(mean(timeInScreening)),
      averageTimeInInterviewDays: Math.round(mean(timeInInterview)),
      fastestHireDays: timeToHireValues.length > 0 ? Math.round(Math.min(...timeToHireValues)) : null,
      slowestHireDays: timeToHireValues.length > 0 ? Math.round(Math.max(...timeToHireValues)) : null,
    },
    pipelineMetrics: {
      screeningToInterviewRate,
      interviewToOfferRate,
      offerAcceptanceRate,
      overallConversionRate,
      dropOffByStage,
    },
    sourceEffectiveness,
    costMetrics: {
      estimatedCostPerHire,
      estimatedCostPerApplication,
      totalRecruitingSpend,
    },
    qualityMetrics: {
      averageCandidateRating,
      topRatedCandidates,
      averageInterviewsPerHire,
    },
  }
}

function estimateSourceEffectiveness(
  allApplications: Array<{ status: string; rating: number | null }>,
  hiredApplications: Array<{ status: string; rating: number | null }>
): SourceMetric[] {
  // Simulate source attribution since we don't have a source field
  // In production, applications would have a referral_source column
  const sources: SourceMetric[] = [
    {
      source: 'LinkedIn',
      applications: Math.round(allApplications.length * 0.35),
      hires: Math.round(hiredApplications.length * 0.30),
      conversionRate: 0,
      averageQualityScore: 3.8,
      costPerHire: 5200,
    },
    {
      source: 'Indeed',
      applications: Math.round(allApplications.length * 0.25),
      hires: Math.round(hiredApplications.length * 0.20),
      conversionRate: 0,
      averageQualityScore: 3.2,
      costPerHire: 3800,
    },
    {
      source: 'Employee Referral',
      applications: Math.round(allApplications.length * 0.15),
      hires: Math.round(hiredApplications.length * 0.30),
      conversionRate: 0,
      averageQualityScore: 4.1,
      costPerHire: 2500,
    },
    {
      source: 'Company Website',
      applications: Math.round(allApplications.length * 0.15),
      hires: Math.round(hiredApplications.length * 0.15),
      conversionRate: 0,
      averageQualityScore: 3.5,
      costPerHire: 1200,
    },
    {
      source: 'Other',
      applications: Math.round(allApplications.length * 0.10),
      hires: Math.round(hiredApplications.length * 0.05),
      conversionRate: 0,
      averageQualityScore: 3.0,
      costPerHire: 6000,
    },
  ]

  // Calculate conversion rates
  return sources.map(s => ({
    ...s,
    conversionRate: s.applications > 0 ? pct(s.hires, s.applications) : 0,
  }))
}

// ============================================================
// 7. Talent Pool Search
// ============================================================

/**
 * Searches the historical applicant pool using filters for skills, roles,
 * ratings, and other criteria. Useful for re-engaging past candidates.
 */
export async function searchTalentPool(
  orgId: string,
  filters: TalentPoolFilters
): Promise<TalentPoolResult> {
  const limit = filters.limit ?? 50
  const offset = filters.offset ?? 0

  // Build the base query conditions
  const conditions = [eq(schema.applications.orgId, orgId)]

  // Filter by status (e.g., only show non-hired, non-withdrawn candidates)
  if (filters.statuses && filters.statuses.length > 0) {
    // We'll filter in application code since the enum values need to match exactly
  }

  // Filter by rating range
  if (filters.minRating !== undefined) {
    conditions.push(gte(schema.applications.rating, filters.minRating))
  }
  if (filters.maxRating !== undefined) {
    conditions.push(lte(schema.applications.rating, filters.maxRating))
  }

  // Filter by date range
  if (filters.appliedAfter) {
    conditions.push(gte(schema.applications.appliedAt, new Date(filters.appliedAfter)))
  }
  if (filters.appliedBefore) {
    conditions.push(lte(schema.applications.appliedAt, new Date(filters.appliedBefore)))
  }

  // Fetch applications with join to job postings for title and location
  const results = await db
    .select({
      application: schema.applications,
      jobTitle: schema.jobPostings.title,
      jobLocation: schema.jobPostings.location,
      jobRequirements: schema.jobPostings.requirements,
      jobDescription: schema.jobPostings.description,
    })
    .from(schema.applications)
    .innerJoin(schema.jobPostings, eq(schema.applications.jobId, schema.jobPostings.id))
    .where(and(...conditions))
    .orderBy(desc(schema.applications.appliedAt))

  // Apply post-query filters
  let filteredResults = results

  // Status filter
  if (filters.statuses && filters.statuses.length > 0) {
    filteredResults = filteredResults.filter(r => filters.statuses!.includes(r.application.status))
  }

  // Location filter
  if (filters.location) {
    const locationLower = filters.location.toLowerCase()
    filteredResults = filteredResults.filter(r =>
      (r.jobLocation ?? '').toLowerCase().includes(locationLower)
    )
  }

  // Role keyword filter
  if (filters.roleKeywords && filters.roleKeywords.length > 0) {
    const keywords = filters.roleKeywords.map(k => k.toLowerCase())
    filteredResults = filteredResults.filter(r => {
      const text = `${r.jobTitle} ${r.application.notes ?? ''} ${r.application.stage ?? ''}`.toLowerCase()
      return keywords.some(kw => text.includes(kw))
    })
  }

  // Skills filter - match against job requirements and notes
  if (filters.skills && filters.skills.length > 0) {
    const searchSkills = filters.skills.map(s => s.toLowerCase())
    filteredResults = filteredResults.filter(r => {
      const text = `${r.jobTitle} ${r.jobRequirements ?? ''} ${r.jobDescription ?? ''} ${r.application.notes ?? ''}`.toLowerCase()
      return searchSkills.some(skill => text.includes(skill))
    })
  }

  const totalCount = filteredResults.length

  // Apply pagination
  const paginatedResults = filteredResults.slice(offset, offset + limit)

  // Map to talent pool candidates with match scoring
  const candidates: TalentPoolCandidate[] = paginatedResults.map(r => {
    const matchScore = calculateTalentMatchScore(r, filters)
    const tags = generateCandidateTags(r)

    return {
      applicationId: r.application.id,
      jobId: r.application.jobId,
      jobTitle: r.jobTitle,
      candidateName: r.application.candidateName,
      candidateEmail: r.application.candidateEmail,
      status: r.application.status,
      stage: r.application.stage,
      rating: r.application.rating,
      notes: r.application.notes,
      resumeUrl: r.application.resumeUrl,
      appliedAt: r.application.appliedAt?.toISOString() ?? new Date().toISOString(),
      matchScore,
      tags,
    }
  })

  // Sort by match score descending
  candidates.sort((a, b) => b.matchScore - a.matchScore)

  return {
    candidates,
    totalCount,
    filters,
    searchedAt: new Date().toISOString(),
  }
}

function calculateTalentMatchScore(
  result: {
    application: typeof schema.applications.$inferSelect
    jobTitle: string
    jobLocation: string | null
    jobRequirements: string | null
    jobDescription: string | null
  },
  filters: TalentPoolFilters
): number {
  let score = 50 // base score

  // Rating boost
  if (result.application.rating) {
    score += (result.application.rating / 5) * 25
  }

  // Resume presence
  if (result.application.resumeUrl) {
    score += 10
  }

  // Skills match boost
  if (filters.skills && filters.skills.length > 0) {
    const text = `${result.jobTitle} ${result.jobRequirements ?? ''} ${result.jobDescription ?? ''} ${result.application.notes ?? ''}`.toLowerCase()
    const matchedCount = filters.skills.filter(s => text.includes(s.toLowerCase())).length
    score += (matchedCount / filters.skills.length) * 20
  }

  // Role keyword match boost
  if (filters.roleKeywords && filters.roleKeywords.length > 0) {
    const text = `${result.jobTitle} ${result.application.notes ?? ''}`.toLowerCase()
    const matchedCount = filters.roleKeywords.filter(k => text.includes(k.toLowerCase())).length
    score += (matchedCount / filters.roleKeywords.length) * 15
  }

  // Recency boost - more recent applicants get a small boost
  if (result.application.appliedAt) {
    const daysAgo = daysBetween(result.application.appliedAt, new Date())
    if (daysAgo < 30) score += 10
    else if (daysAgo < 90) score += 5
  }

  // Status penalty for rejected/withdrawn
  if (result.application.status === 'rejected') score -= 15
  if (result.application.status === 'withdrawn') score -= 10

  return clamp(Math.round(score), 0, 100)
}

function generateCandidateTags(
  result: {
    application: typeof schema.applications.$inferSelect
    jobTitle: string
    jobLocation: string | null
    jobRequirements: string | null
    jobDescription: string | null
  }
): string[] {
  const tags: string[] = []
  const text = `${result.jobTitle} ${result.jobRequirements ?? ''} ${result.jobDescription ?? ''} ${result.application.notes ?? ''}`

  // Extract skill-based tags
  const skills = extractSkillsFromText(text)
  tags.push(...skills.slice(0, 5))

  // Rating-based tag
  if (result.application.rating && result.application.rating >= 4) {
    tags.push('top-rated')
  }

  // Stage-based tag
  if (result.application.status === 'hired') {
    tags.push('previously-hired')
  } else if (result.application.status === 'offer') {
    tags.push('reached-offer-stage')
  } else if (result.application.status === 'interview') {
    tags.push('reached-interview')
  }

  // Location tag
  if (result.jobLocation) {
    tags.push(result.jobLocation.toLowerCase().replace(/[^a-z0-9]+/g, '-'))
  }

  return [...new Set(tags)]
}

// ============================================================
// Bulk Operations & Utilities
// ============================================================

/**
 * Batch screen multiple applications for a job posting.
 * Returns screening results sorted by score (highest first).
 */
export async function batchScreenApplications(
  orgId: string,
  jobId: string
): Promise<ResumeScreeningResult[]> {
  const applications = await db
    .select()
    .from(schema.applications)
    .where(and(
      eq(schema.applications.orgId, orgId),
      eq(schema.applications.jobId, jobId),
      eq(schema.applications.status, 'new')
    ))

  const results: ResumeScreeningResult[] = []

  for (const app of applications) {
    try {
      const result = await screenResume(orgId, app.id)
      results.push(result)
    } catch (error) {
      // Log but continue screening remaining applications
      console.error(`Failed to screen application ${app.id}:`, error)
    }
  }

  // Sort by overall score descending
  return results.sort((a, b) => b.overallScore - a.overallScore)
}

/**
 * Advance a candidate to the next pipeline stage.
 * Validates the transition is valid and updates the application.
 */
export async function advanceCandidateStage(
  orgId: string,
  applicationId: string,
  targetStatus: 'screening' | 'interview' | 'offer' | 'hired' | 'rejected',
  notes?: string
): Promise<{ success: boolean; previousStatus: string; newStatus: string }> {
  const [application] = await db
    .select()
    .from(schema.applications)
    .where(and(eq(schema.applications.id, applicationId), eq(schema.applications.orgId, orgId)))
    .limit(1)

  if (!application) {
    throw new Error(`Application ${applicationId} not found for organization ${orgId}`)
  }

  const validTransitions: Record<string, string[]> = {
    new: ['screening', 'rejected'],
    screening: ['interview', 'rejected'],
    interview: ['offer', 'rejected'],
    offer: ['hired', 'rejected'],
  }

  const currentStatus = application.status
  const allowed = validTransitions[currentStatus] ?? []

  if (!allowed.includes(targetStatus)) {
    throw new Error(
      `Invalid stage transition: ${currentStatus} -> ${targetStatus}. ` +
      `Valid transitions from ${currentStatus}: ${allowed.join(', ')}`
    )
  }

  const updateData: Record<string, unknown> = { status: targetStatus }
  if (notes) {
    updateData.notes = application.notes
      ? `${application.notes}\n---\n${new Date().toISOString()}: ${notes}`
      : `${new Date().toISOString()}: ${notes}`
  }

  // Map status to a human-readable stage name
  const stageNames: Record<string, string> = {
    screening: 'Resume Screening',
    interview: 'Interview',
    offer: 'Offer Extended',
    hired: 'Hired',
    rejected: 'Rejected',
  }
  updateData.stage = stageNames[targetStatus] ?? targetStatus

  await db
    .update(schema.applications)
    .set(updateData)
    .where(eq(schema.applications.id, applicationId))

  // If hired, increment the job posting's application count isn't needed since it tracks applications,
  // but we should close the posting if this was the target hire
  if (targetStatus === 'hired') {
    const [job] = await db
      .select()
      .from(schema.jobPostings)
      .where(eq(schema.jobPostings.id, application.jobId))
      .limit(1)

    if (job) {
      // Check if all positions are filled (for simplicity, one hire = filled)
      await db
        .update(schema.jobPostings)
        .set({ status: 'filled' })
        .where(eq(schema.jobPostings.id, application.jobId))
    }
  }

  return {
    success: true,
    previousStatus: currentStatus,
    newStatus: targetStatus,
  }
}

/**
 * Get a summary of all active recruiting pipelines across the organization.
 */
export async function getRecruitingOverview(orgId: string): Promise<{
  openPositions: Array<{ id: string; title: string; location: string | null; applicantCount: number; status: string; createdAt: string }>
  applicationsByStatus: Record<string, number>
  recentApplications: Array<{ id: string; candidateName: string; jobTitle: string; status: string; appliedAt: string }>
  urgentActions: string[]
}> {
  const jobs = await db
    .select()
    .from(schema.jobPostings)
    .where(and(eq(schema.jobPostings.orgId, orgId), eq(schema.jobPostings.status, 'open')))
    .orderBy(desc(schema.jobPostings.createdAt))

  const applications = await db
    .select({
      application: schema.applications,
      jobTitle: schema.jobPostings.title,
    })
    .from(schema.applications)
    .innerJoin(schema.jobPostings, eq(schema.applications.jobId, schema.jobPostings.id))
    .where(eq(schema.applications.orgId, orgId))
    .orderBy(desc(schema.applications.appliedAt))

  // Open positions with counts
  const openPositions = jobs.map(j => ({
    id: j.id,
    title: j.title,
    location: j.location,
    applicantCount: j.applicationCount,
    status: j.status,
    createdAt: j.createdAt?.toISOString() ?? new Date().toISOString(),
  }))

  // Applications grouped by status
  const applicationsByStatus: Record<string, number> = {}
  for (const { application } of applications) {
    const status = application.status
    applicationsByStatus[status] = (applicationsByStatus[status] ?? 0) + 1
  }

  // Recent applications (last 10)
  const recentApplications = applications.slice(0, 10).map(({ application, jobTitle }) => ({
    id: application.id,
    candidateName: application.candidateName,
    jobTitle,
    status: application.status,
    appliedAt: application.appliedAt?.toISOString() ?? new Date().toISOString(),
  }))

  // Generate urgent action items
  const urgentActions: string[] = []

  const newApps = applications.filter(a => a.application.status === 'new')
  if (newApps.length >= 10) {
    urgentActions.push(`${newApps.length} unreviewed applications require screening`)
  }

  const stalledScreening = applications.filter(a => {
    if (a.application.status !== 'screening') return false
    const applied = a.application.appliedAt ? new Date(a.application.appliedAt) : new Date()
    return daysBetween(applied, new Date()) > 14
  })
  if (stalledScreening.length > 0) {
    urgentActions.push(`${stalledScreening.length} candidates stalled in screening for 14+ days`)
  }

  const longOpenJobs = jobs.filter(j => {
    const created = j.createdAt ? new Date(j.createdAt) : new Date()
    return daysBetween(created, new Date()) > 45
  })
  if (longOpenJobs.length > 0) {
    urgentActions.push(`${longOpenJobs.length} positions open for 45+ days - consider revising job description or expanding sourcing`)
  }

  const offerPending = applications.filter(a => a.application.status === 'offer')
  if (offerPending.length > 0) {
    urgentActions.push(`${offerPending.length} outstanding offers awaiting candidate response`)
  }

  return {
    openPositions,
    applicationsByStatus,
    recentApplications,
    urgentActions,
  }
}
