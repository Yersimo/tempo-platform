// Tempo AI Video Screens (One-Way) Service
// Handles asynchronous one-way video interviews with configurable templates,
// AI analysis, reviewer workflows, branded experiences, and comparison reports.

import { db, schema } from '@/lib/db'
import { eq, and, desc, sql, inArray, lte } from 'drizzle-orm'

// ============================================================
// Types & Interfaces
// ============================================================

export type VideoScreenStatus = 'draft' | 'sent' | 'in_progress' | 'completed' | 'expired' | 'reviewed'

export interface TemplateQuestion {
  text: string
  thinkTime: number    // seconds allowed for thinking before recording
  responseTime: number // max recording time in seconds
  maxRetakes: number   // 0 = no retakes allowed
  category?: string    // e.g., 'technical', 'behavioral', 'situational'
  weight?: number      // scoring weight 0-1, defaults to equal weight
}

export interface BrandingConfig {
  logoUrl: string | null
  primaryColor: string
  secondaryColor: string
  welcomeMessage: string
  companyName: string
  backgroundImageUrl: string | null
  fontFamily: string
}

export interface CreateTemplateInput {
  orgId: string
  name: string
  description?: string
  questions: TemplateQuestion[]
  introVideoUrl?: string
  brandingConfig?: Partial<BrandingConfig>
}

export interface UpdateTemplateInput {
  name?: string
  description?: string
  questions?: TemplateQuestion[]
  introVideoUrl?: string
  brandingConfig?: Partial<BrandingConfig>
  isActive?: boolean
}

export interface TemplateRecord {
  id: string
  orgId: string
  name: string
  description: string | null
  questions: TemplateQuestion[]
  introVideoUrl: string | null
  brandingConfig: BrandingConfig | null
  isActive: boolean
  createdAt: string
}

export interface SendInviteInput {
  orgId: string
  applicationId: string
  templateId: string
  expiresInDays?: number    // defaults to 7
  personalMessage?: string
}

export interface InviteRecord {
  id: string
  orgId: string
  applicationId: string
  templateId: string
  status: VideoScreenStatus
  accessToken: string
  sentAt: string | null
  startedAt: string | null
  completedAt: string | null
  expiresAt: string | null
  candidateName: string
  candidateEmail: string
  createdAt: string
}

export interface RecordResponseInput {
  inviteId: string
  questionIndex: number
  videoUrl: string
  thumbnailUrl?: string
  duration: number
}

export interface ResponseRecord {
  id: string
  inviteId: string
  questionIndex: number
  videoUrl: string | null
  thumbnailUrl: string | null
  duration: number | null
  transcription: string | null
  aiAnalysis: AIResponseAnalysis | null
  reviewerNotes: string | null
  reviewerRating: number | null
  reviewedBy: string | null
  reviewedAt: string | null
  createdAt: string
}

export interface AIResponseAnalysis {
  relevance: number        // 0-100, how relevant the answer is to the question
  clarity: number          // 0-100, how clear and structured the response is
  confidence: number       // 0-100, assessed confidence level of speaker
  sentiment: 'positive' | 'neutral' | 'negative'
  keywords: string[]       // key terms mentioned in the response
  score: number           // 0-100 composite score
  responseQuality: 'excellent' | 'good' | 'adequate' | 'poor'
  speakingPace: 'fast' | 'normal' | 'slow'
  fillerWordCount: number  // estimated filler words (um, uh, like)
  keyPoints: string[]      // main points extracted from response
  flags: string[]          // any concerns or notable observations
}

export interface ReviewInput {
  inviteId: string
  questionIndex: number
  reviewerId: string
  rating: number           // 1-5
  notes?: string
}

export interface VideoScreenAnalytics {
  orgId: string
  templateId: string
  templateName: string
  totalInvitesSent: number
  totalCompleted: number
  totalExpired: number
  totalInProgress: number
  completionRate: number
  averageCompletionTimeMinutes: number
  averageOverallScore: number
  averageReviewerRating: number
  scoreDistribution: {
    excellent: number
    good: number
    adequate: number
    poor: number
  }
  questionAnalytics: Array<{
    questionIndex: number
    questionText: string
    averageScore: number
    averageDuration: number
    completionRate: number
  }>
  generatedAt: string
}

export interface CandidateComparison {
  applicationId: string
  candidateName: string
  candidateEmail: string
  overallScore: number
  questionScores: Array<{
    questionIndex: number
    questionText: string
    score: number
    reviewerRating: number | null
  }>
  strengths: string[]
  concerns: string[]
  recommendation: 'strong_yes' | 'yes' | 'maybe' | 'no'
}

export interface ComparisonReport {
  templateId: string
  templateName: string
  candidates: CandidateComparison[]
  rankings: Array<{
    rank: number
    applicationId: string
    candidateName: string
    overallScore: number
  }>
  generatedAt: string
}

export interface BrandedExperienceConfig {
  templateId: string
  orgId: string
  branding: BrandingConfig
  introVideoUrl: string | null
  questions: TemplateQuestion[]
  accessUrl: string
}

// ============================================================
// Internal Helpers
// ============================================================

function generateToken(): string {
  return `vs-${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function mean(values: number[]): number {
  if (values.length === 0) return 0
  return values.reduce((a, b) => a + b, 0) / values.length
}

const DEFAULT_BRANDING: BrandingConfig = {
  logoUrl: null,
  primaryColor: '#6366f1',
  secondaryColor: '#818cf8',
  welcomeMessage: 'Thank you for taking the time to complete this video screen. Please answer each question to the best of your ability.',
  companyName: 'Our Company',
  backgroundImageUrl: null,
  fontFamily: 'Inter, system-ui, sans-serif',
}

/**
 * Simulates AI analysis of a video response.
 * In production, this would integrate with video/audio AI services
 * (e.g., Hume AI for sentiment, Deepgram for transcription, custom ML for relevance).
 */
function simulateAIAnalysis(
  question: TemplateQuestion,
  transcription: string,
  duration: number
): AIResponseAnalysis {
  const textLower = transcription.toLowerCase()
  const wordCount = transcription.split(/\s+/).length
  const sentenceCount = transcription.split(/[.!?]+/).filter(s => s.trim()).length

  // Relevance: check if response keywords relate to question
  const questionKeywords = question.text.toLowerCase().split(/\s+/)
    .filter(w => w.length > 3)
    .map(w => w.replace(/[^a-z]/g, ''))
  const matchedKeywords = questionKeywords.filter(kw => textLower.includes(kw))
  const relevanceBase = questionKeywords.length > 0
    ? (matchedKeywords.length / questionKeywords.length) * 60 + 30
    : 65

  // Clarity: based on sentence structure and length
  const avgSentenceLength = sentenceCount > 0 ? wordCount / sentenceCount : wordCount
  const clarityBase = avgSentenceLength > 5 && avgSentenceLength < 30
    ? 75 + Math.random() * 15
    : 50 + Math.random() * 20

  // Confidence: based on response length and assertive language
  const assertivePatterns = /I (believe|think|know|am confident|have experience|can|will|did|led|managed|built)/gi
  const assertiveMatches = (transcription.match(assertivePatterns) || []).length
  const hedgingPatterns = /maybe|perhaps|I guess|I think maybe|not sure|sort of|kind of/gi
  const hedgingMatches = (transcription.match(hedgingPatterns) || []).length
  const confidenceBase = clamp(
    65 + assertiveMatches * 5 - hedgingMatches * 8 + Math.random() * 10,
    20, 100
  )

  // Sentiment analysis
  const positiveWords = /excellent|great|love|passionate|excited|enjoy|accomplished|successful|achieved|proud/gi
  const negativeWords = /hate|terrible|awful|frustrated|difficult|challenging|struggle|fail|worst|unfortunately/gi
  const positiveCount = (transcription.match(positiveWords) || []).length
  const negativeCount = (transcription.match(negativeWords) || []).length
  const sentiment: AIResponseAnalysis['sentiment'] =
    positiveCount > negativeCount + 1 ? 'positive' :
    negativeCount > positiveCount + 1 ? 'negative' : 'neutral'

  // Extract keywords (top terms by significance)
  const stopWords = new Set(['the', 'and', 'for', 'that', 'with', 'this', 'have', 'from', 'was', 'are', 'been', 'were', 'they', 'will', 'would', 'could', 'should', 'about', 'their', 'which', 'when', 'what', 'where', 'also', 'into', 'more', 'than', 'then', 'some', 'very', 'just'])
  const words = transcription.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/)
  const wordFreq = new Map<string, number>()
  for (const word of words) {
    if (word.length > 3 && !stopWords.has(word)) {
      wordFreq.set(word, (wordFreq.get(word) || 0) + 1)
    }
  }
  const keywords = [...wordFreq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([word]) => word)

  // Speaking pace
  const wordsPerMinute = duration > 0 ? (wordCount / duration) * 60 : 150
  const speakingPace: AIResponseAnalysis['speakingPace'] =
    wordsPerMinute > 180 ? 'fast' :
    wordsPerMinute < 100 ? 'slow' : 'normal'

  // Filler word estimation
  const fillerPatterns = /\bum\b|\buh\b|\blike\b|\byou know\b|\bbasically\b|\bactually\b/gi
  const fillerWordCount = (transcription.match(fillerPatterns) || []).length

  // Key points extraction (first sentence of each distinct idea)
  const sentences = transcription.split(/[.!?]+/).filter(s => s.trim().length > 20)
  const keyPoints = sentences
    .filter((_, i) => i < 4)
    .map(s => s.trim())

  // Flags
  const flags: string[] = []
  if (duration < question.responseTime * 0.2) flags.push('Response significantly shorter than allotted time')
  if (duration > question.responseTime * 0.95) flags.push('Response used nearly all allotted time')
  if (fillerWordCount > 5) flags.push('High frequency of filler words detected')
  if (hedgingMatches > 3) flags.push('Frequent hedging language may indicate uncertainty')
  if (wordCount < 30) flags.push('Very brief response - may lack depth')
  if (wordsPerMinute > 200) flags.push('Speaking pace may be too fast for clear communication')

  // Composite score
  const relevance = Math.round(clamp(relevanceBase, 0, 100))
  const clarity = Math.round(clamp(clarityBase, 0, 100))
  const confidence = Math.round(clamp(confidenceBase, 0, 100))

  const questionWeight = question.weight ?? 1
  const score = Math.round(
    (relevance * 0.35 + clarity * 0.25 + confidence * 0.25 +
    (sentiment === 'positive' ? 15 : sentiment === 'negative' ? 0 : 8)) * questionWeight
  )

  // Response quality label
  let responseQuality: AIResponseAnalysis['responseQuality']
  if (score >= 80) responseQuality = 'excellent'
  else if (score >= 60) responseQuality = 'good'
  else if (score >= 40) responseQuality = 'adequate'
  else responseQuality = 'poor'

  return {
    relevance,
    clarity,
    confidence,
    sentiment,
    keywords,
    score: clamp(score, 0, 100),
    responseQuality,
    speakingPace,
    fillerWordCount,
    keyPoints,
    flags,
  }
}

/**
 * Simulates transcription of a video response.
 * In production, this would use a speech-to-text service.
 */
function simulateVideoTranscription(questionText: string, duration: number): string {
  const questionKeywords = questionText.toLowerCase()

  // Generate contextual response based on question type
  if (/experience|background|tell me about/i.test(questionKeywords)) {
    return 'I have been working in this field for several years, building up expertise across multiple domains. My most recent role involved leading a team of engineers focused on building scalable infrastructure solutions. I am particularly proud of the systems we designed that handled millions of requests daily while maintaining high availability.'
  }
  if (/challenge|difficult|problem/i.test(questionKeywords)) {
    return 'One significant challenge I faced was when our primary database experienced severe performance degradation under increased load. I led the investigation, identified the root cause as inefficient query patterns combined with missing indexes, and implemented a comprehensive optimization plan that reduced response times by 70 percent.'
  }
  if (/team|collaborate|work with/i.test(questionKeywords)) {
    return 'I believe effective teamwork requires clear communication, shared goals, and mutual respect. In my previous role, I established regular sync meetings, created shared documentation practices, and built a culture where team members felt comfortable raising concerns early. This approach significantly improved our delivery velocity and team satisfaction.'
  }
  if (/why|interested|motivation/i.test(questionKeywords)) {
    return 'I am drawn to this opportunity because of the innovative work your team is doing in the space. The combination of technical challenges, impact on users, and the collaborative culture you have built aligns perfectly with what I am looking for in my next role. I believe my background in scaling systems and leading teams would allow me to make meaningful contributions.'
  }
  if (/strength|strong|best/i.test(questionKeywords)) {
    return 'My greatest strength is my ability to break down complex problems into manageable components and communicate technical concepts to diverse stakeholders. I am also skilled at mentoring junior engineers, having helped several team members advance their careers significantly. I bring a systematic approach to problem solving combined with creative thinking.'
  }
  if (/weakness|improve|growth/i.test(questionKeywords)) {
    return 'I have been working on improving my delegation skills. Early in my career, I tended to take on too many responsibilities myself rather than empowering team members. I have actively been developing this by setting clear expectations, providing context for decisions, and trusting my team with increasingly important tasks.'
  }

  return 'Thank you for the question. I have thought carefully about this, and I would like to share my perspective based on my professional experience. I believe that a combination of analytical thinking and strong interpersonal skills is essential for success in any role. Throughout my career, I have consistently demonstrated these qualities through successful project delivery and positive team relationships.'
}

// ============================================================
// Public API Functions
// ============================================================

/**
 * Create a video screen template with configurable questions, timing, and branding.
 */
export async function createTemplate(input: CreateTemplateInput): Promise<TemplateRecord> {
  const { orgId, name, description, questions, introVideoUrl, brandingConfig } = input

  if (!name || name.trim().length === 0) {
    throw new Error('Template name is required')
  }

  if (!questions || questions.length === 0) {
    throw new Error('At least one question is required')
  }

  if (questions.length > 20) {
    throw new Error('Maximum 20 questions per template')
  }

  // Validate each question
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i]
    if (!q.text || q.text.trim().length === 0) {
      throw new Error(`Question ${i + 1}: Text is required`)
    }
    if (q.thinkTime < 0 || q.thinkTime > 300) {
      throw new Error(`Question ${i + 1}: Think time must be between 0 and 300 seconds`)
    }
    if (q.responseTime < 15 || q.responseTime > 600) {
      throw new Error(`Question ${i + 1}: Response time must be between 15 and 600 seconds`)
    }
    if (q.maxRetakes < 0 || q.maxRetakes > 5) {
      throw new Error(`Question ${i + 1}: Max retakes must be between 0 and 5`)
    }
  }

  // Normalize questions with defaults
  const normalizedQuestions: TemplateQuestion[] = questions.map((q, i) => ({
    text: q.text.trim(),
    thinkTime: q.thinkTime,
    responseTime: q.responseTime,
    maxRetakes: q.maxRetakes,
    category: q.category || 'general',
    weight: q.weight ?? 1 / questions.length,
  }))

  // Merge branding with defaults
  const mergedBranding: BrandingConfig = {
    ...DEFAULT_BRANDING,
    ...brandingConfig,
  }

  const [template] = await db
    .insert(schema.videoScreenTemplates)
    .values({
      orgId,
      name: name.trim(),
      description: description?.trim() || null,
      questions: normalizedQuestions as unknown as never,
      introVideoUrl: introVideoUrl || null,
      brandingConfig: mergedBranding as unknown as never,
      isActive: true,
    })
    .returning()

  return {
    id: template.id,
    orgId: template.orgId,
    name: template.name,
    description: template.description,
    questions: template.questions as TemplateQuestion[],
    introVideoUrl: template.introVideoUrl,
    brandingConfig: template.brandingConfig as BrandingConfig | null,
    isActive: template.isActive,
    createdAt: template.createdAt.toISOString(),
  }
}

/**
 * Update an existing video screen template.
 * Active invites using the old template version are not affected.
 */
export async function updateTemplate(
  orgId: string,
  templateId: string,
  updates: UpdateTemplateInput
): Promise<TemplateRecord> {
  const [existing] = await db
    .select()
    .from(schema.videoScreenTemplates)
    .where(and(
      eq(schema.videoScreenTemplates.id, templateId),
      eq(schema.videoScreenTemplates.orgId, orgId)
    ))
    .limit(1)

  if (!existing) {
    throw new Error(`Template ${templateId} not found for organization ${orgId}`)
  }

  const updateData: Record<string, unknown> = {}

  if (updates.name !== undefined) {
    if (!updates.name || updates.name.trim().length === 0) {
      throw new Error('Template name cannot be empty')
    }
    updateData.name = updates.name.trim()
  }

  if (updates.description !== undefined) {
    updateData.description = updates.description?.trim() || null
  }

  if (updates.questions !== undefined) {
    if (updates.questions.length === 0) {
      throw new Error('At least one question is required')
    }
    if (updates.questions.length > 20) {
      throw new Error('Maximum 20 questions per template')
    }
    // Validate each question
    for (let i = 0; i < updates.questions.length; i++) {
      const q = updates.questions[i]
      if (!q.text || q.text.trim().length === 0) {
        throw new Error(`Question ${i + 1}: Text is required`)
      }
      if (q.thinkTime < 0 || q.thinkTime > 300) {
        throw new Error(`Question ${i + 1}: Think time must be between 0 and 300 seconds`)
      }
      if (q.responseTime < 15 || q.responseTime > 600) {
        throw new Error(`Question ${i + 1}: Response time must be between 15 and 600 seconds`)
      }
    }
    updateData.questions = updates.questions.map(q => ({
      text: q.text.trim(),
      thinkTime: q.thinkTime,
      responseTime: q.responseTime,
      maxRetakes: q.maxRetakes,
      category: q.category || 'general',
      weight: q.weight ?? 1 / updates.questions!.length,
    }))
  }

  if (updates.introVideoUrl !== undefined) {
    updateData.introVideoUrl = updates.introVideoUrl || null
  }

  if (updates.brandingConfig !== undefined) {
    const currentBranding = (existing.brandingConfig as BrandingConfig) || DEFAULT_BRANDING
    updateData.brandingConfig = { ...currentBranding, ...updates.brandingConfig }
  }

  if (updates.isActive !== undefined) {
    updateData.isActive = updates.isActive
  }

  if (Object.keys(updateData).length === 0) {
    throw new Error('No valid update fields provided')
  }

  const [updated] = await db
    .update(schema.videoScreenTemplates)
    .set(updateData)
    .where(eq(schema.videoScreenTemplates.id, templateId))
    .returning()

  return {
    id: updated.id,
    orgId: updated.orgId,
    name: updated.name,
    description: updated.description,
    questions: updated.questions as TemplateQuestion[],
    introVideoUrl: updated.introVideoUrl,
    brandingConfig: updated.brandingConfig as BrandingConfig | null,
    isActive: updated.isActive,
    createdAt: updated.createdAt.toISOString(),
  }
}

/**
 * Send a video screen invitation to a candidate.
 * Generates a unique access token and link for the candidate.
 */
export async function sendInvite(input: SendInviteInput): Promise<InviteRecord> {
  const { orgId, applicationId, templateId, expiresInDays = 7, personalMessage } = input

  // Validate application exists
  const [application] = await db
    .select()
    .from(schema.applications)
    .where(and(eq(schema.applications.id, applicationId), eq(schema.applications.orgId, orgId)))
    .limit(1)

  if (!application) {
    throw new Error(`Application ${applicationId} not found for organization ${orgId}`)
  }

  // Validate template exists and is active
  const [template] = await db
    .select()
    .from(schema.videoScreenTemplates)
    .where(and(
      eq(schema.videoScreenTemplates.id, templateId),
      eq(schema.videoScreenTemplates.orgId, orgId)
    ))
    .limit(1)

  if (!template) {
    throw new Error(`Template ${templateId} not found for organization ${orgId}`)
  }

  if (!template.isActive) {
    throw new Error('Cannot send invitations using an inactive template')
  }

  // Check for existing active invite for the same application and template
  const existingInvites = await db
    .select()
    .from(schema.videoScreenInvites)
    .where(and(
      eq(schema.videoScreenInvites.applicationId, applicationId),
      eq(schema.videoScreenInvites.templateId, templateId),
      eq(schema.videoScreenInvites.orgId, orgId)
    ))

  const activeInvite = existingInvites.find(i =>
    i.status === 'sent' || i.status === 'in_progress'
  )
  if (activeInvite) {
    throw new Error('An active invitation already exists for this candidate and template')
  }

  if (expiresInDays < 1 || expiresInDays > 30) {
    throw new Error('Expiration must be between 1 and 30 days')
  }

  const accessToken = generateToken()
  const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
  const sentAt = new Date()

  const [invite] = await db
    .insert(schema.videoScreenInvites)
    .values({
      orgId,
      applicationId,
      templateId,
      status: 'sent',
      accessToken,
      sentAt,
      expiresAt,
    })
    .returning()

  // In production, trigger email notification to candidate here
  // await notificationDispatcher.send({ ... })

  return {
    id: invite.id,
    orgId: invite.orgId,
    applicationId: invite.applicationId,
    templateId: invite.templateId,
    status: invite.status as VideoScreenStatus,
    accessToken: invite.accessToken,
    sentAt: invite.sentAt?.toISOString() ?? null,
    startedAt: invite.startedAt?.toISOString() ?? null,
    completedAt: invite.completedAt?.toISOString() ?? null,
    expiresAt: invite.expiresAt?.toISOString() ?? null,
    candidateName: application.candidateName,
    candidateEmail: application.candidateEmail,
    createdAt: invite.createdAt.toISOString(),
  }
}

/**
 * Send video screen invitations to multiple candidates at once.
 */
export async function bulkSendInvites(
  orgId: string,
  templateId: string,
  applicationIds: string[],
  expiresInDays: number = 7
): Promise<{
  totalRequested: number
  sent: number
  skipped: number
  errors: Array<{ applicationId: string; error: string }>
  invites: InviteRecord[]
}> {
  if (!applicationIds || applicationIds.length === 0) {
    throw new Error('At least one application ID is required')
  }

  if (applicationIds.length > 100) {
    throw new Error('Maximum 100 invitations per batch')
  }

  const results: InviteRecord[] = []
  const errors: Array<{ applicationId: string; error: string }> = []
  let skipped = 0

  for (const applicationId of applicationIds) {
    try {
      const invite = await sendInvite({
        orgId,
        applicationId,
        templateId,
        expiresInDays,
      })
      results.push(invite)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      if (errorMessage.includes('already exists')) {
        skipped++
      }
      errors.push({ applicationId, error: errorMessage })
    }
  }

  return {
    totalRequested: applicationIds.length,
    sent: results.length,
    skipped,
    errors,
    invites: results,
  }
}

/**
 * Record a candidate's video response to a question.
 * Updates invite status to 'in_progress' if it's the first response.
 */
export async function recordResponse(input: RecordResponseInput): Promise<ResponseRecord> {
  const { inviteId, questionIndex, videoUrl, thumbnailUrl, duration } = input

  if (!videoUrl) {
    throw new Error('Video URL is required')
  }

  if (duration <= 0) {
    throw new Error('Duration must be a positive number')
  }

  // Fetch the invite
  const [invite] = await db
    .select()
    .from(schema.videoScreenInvites)
    .where(eq(schema.videoScreenInvites.id, inviteId))
    .limit(1)

  if (!invite) {
    throw new Error(`Invite ${inviteId} not found`)
  }

  if (invite.status === 'expired') {
    throw new Error('This invitation has expired')
  }

  if (invite.status === 'completed' || invite.status === 'reviewed') {
    throw new Error('This video screen has already been completed')
  }

  // Check if the invite has expired by date
  if (invite.expiresAt && new Date(invite.expiresAt) < new Date()) {
    // Mark as expired
    await db
      .update(schema.videoScreenInvites)
      .set({ status: 'expired' })
      .where(eq(schema.videoScreenInvites.id, inviteId))
    throw new Error('This invitation has expired')
  }

  // Fetch the template to validate question index
  const [template] = await db
    .select()
    .from(schema.videoScreenTemplates)
    .where(eq(schema.videoScreenTemplates.id, invite.templateId))
    .limit(1)

  if (!template) {
    throw new Error('Template not found for this invitation')
  }

  const questions = template.questions as TemplateQuestion[]
  if (questionIndex < 0 || questionIndex >= questions.length) {
    throw new Error(`Invalid question index. Template has ${questions.length} questions (0-${questions.length - 1}).`)
  }

  const question = questions[questionIndex]

  // Check if response exceeds max time
  if (duration > question.responseTime + 5) { // 5 second grace period
    throw new Error(`Response duration (${duration}s) exceeds maximum allowed time (${question.responseTime}s)`)
  }

  // Check for existing response (for retakes)
  const existingResponses = await db
    .select()
    .from(schema.videoScreenResponses)
    .where(and(
      eq(schema.videoScreenResponses.inviteId, inviteId),
      eq(schema.videoScreenResponses.questionIndex, questionIndex)
    ))

  if (existingResponses.length >= question.maxRetakes + 1 && question.maxRetakes > 0) {
    throw new Error(`Maximum retakes (${question.maxRetakes}) exceeded for question ${questionIndex + 1}`)
  }

  // If this is a retake, delete the previous response
  if (existingResponses.length > 0 && question.maxRetakes > 0) {
    const lastResponse = existingResponses[existingResponses.length - 1]
    await db
      .delete(schema.videoScreenResponses)
      .where(eq(schema.videoScreenResponses.id, lastResponse.id))
  }

  // Save the response
  const [response] = await db
    .insert(schema.videoScreenResponses)
    .values({
      inviteId,
      questionIndex,
      videoUrl,
      thumbnailUrl: thumbnailUrl || null,
      duration,
    })
    .returning()

  // Update invite status to 'in_progress' if first response
  if (invite.status === 'sent') {
    await db
      .update(schema.videoScreenInvites)
      .set({
        status: 'in_progress',
        startedAt: new Date(),
      })
      .where(eq(schema.videoScreenInvites.id, inviteId))
  }

  // Check if all questions have been answered
  const allResponses = await db
    .select()
    .from(schema.videoScreenResponses)
    .where(eq(schema.videoScreenResponses.inviteId, inviteId))

  const answeredQuestions = new Set(allResponses.map(r => r.questionIndex))
  if (answeredQuestions.size >= questions.length) {
    await db
      .update(schema.videoScreenInvites)
      .set({
        status: 'completed',
        completedAt: new Date(),
      })
      .where(eq(schema.videoScreenInvites.id, inviteId))
  }

  return {
    id: response.id,
    inviteId: response.inviteId,
    questionIndex: response.questionIndex,
    videoUrl: response.videoUrl,
    thumbnailUrl: response.thumbnailUrl,
    duration: response.duration,
    transcription: response.transcription,
    aiAnalysis: response.aiAnalysis as AIResponseAnalysis | null,
    reviewerNotes: response.reviewerNotes,
    reviewerRating: response.reviewerRating,
    reviewedBy: response.reviewedBy,
    reviewedAt: response.reviewedAt?.toISOString() ?? null,
    createdAt: response.createdAt.toISOString(),
  }
}

/**
 * Process a video response with AI: transcription and multi-dimensional analysis.
 */
export async function processVideoResponse(
  orgId: string,
  responseId: string
): Promise<ResponseRecord> {
  const [response] = await db
    .select()
    .from(schema.videoScreenResponses)
    .where(eq(schema.videoScreenResponses.id, responseId))
    .limit(1)

  if (!response) {
    throw new Error(`Response ${responseId} not found`)
  }

  // Fetch invite and template
  const [invite] = await db
    .select()
    .from(schema.videoScreenInvites)
    .where(eq(schema.videoScreenInvites.id, response.inviteId))
    .limit(1)

  if (!invite) {
    throw new Error('Invite not found for this response')
  }

  if (invite.orgId !== orgId) {
    throw new Error('Response does not belong to this organization')
  }

  const [template] = await db
    .select()
    .from(schema.videoScreenTemplates)
    .where(eq(schema.videoScreenTemplates.id, invite.templateId))
    .limit(1)

  if (!template) {
    throw new Error('Template not found for this invitation')
  }

  const questions = template.questions as TemplateQuestion[]
  const question = questions[response.questionIndex]

  if (!question) {
    throw new Error(`Question at index ${response.questionIndex} not found in template`)
  }

  // Step 1: Generate transcription
  const transcription = simulateVideoTranscription(question.text, response.duration || 60)

  // Step 2: Run AI analysis
  const aiAnalysis = simulateAIAnalysis(question, transcription, response.duration || 60)

  // Save results
  const [updated] = await db
    .update(schema.videoScreenResponses)
    .set({
      transcription,
      aiAnalysis: aiAnalysis as unknown as never,
    })
    .where(eq(schema.videoScreenResponses.id, responseId))
    .returning()

  return {
    id: updated.id,
    inviteId: updated.inviteId,
    questionIndex: updated.questionIndex,
    videoUrl: updated.videoUrl,
    thumbnailUrl: updated.thumbnailUrl,
    duration: updated.duration,
    transcription: updated.transcription,
    aiAnalysis: updated.aiAnalysis as AIResponseAnalysis | null,
    reviewerNotes: updated.reviewerNotes,
    reviewerRating: updated.reviewerRating,
    reviewedBy: updated.reviewedBy,
    reviewedAt: updated.reviewedAt?.toISOString() ?? null,
    createdAt: updated.createdAt.toISOString(),
  }
}

/**
 * Analyze all responses for an invitation (batch AI analysis).
 */
export async function analyzeResponse(
  orgId: string,
  inviteId: string
): Promise<{
  inviteId: string
  totalResponses: number
  analyzed: number
  averageScore: number
  results: ResponseRecord[]
}> {
  const [invite] = await db
    .select()
    .from(schema.videoScreenInvites)
    .where(and(
      eq(schema.videoScreenInvites.id, inviteId),
      eq(schema.videoScreenInvites.orgId, orgId)
    ))
    .limit(1)

  if (!invite) {
    throw new Error(`Invite ${inviteId} not found for organization ${orgId}`)
  }

  const responses = await db
    .select()
    .from(schema.videoScreenResponses)
    .where(eq(schema.videoScreenResponses.inviteId, inviteId))
    .orderBy(schema.videoScreenResponses.questionIndex)

  if (responses.length === 0) {
    throw new Error('No responses found for this invitation')
  }

  const results: ResponseRecord[] = []

  for (const response of responses) {
    // Skip already analyzed responses
    if (response.aiAnalysis) {
      results.push({
        id: response.id,
        inviteId: response.inviteId,
        questionIndex: response.questionIndex,
        videoUrl: response.videoUrl,
        thumbnailUrl: response.thumbnailUrl,
        duration: response.duration,
        transcription: response.transcription,
        aiAnalysis: response.aiAnalysis as AIResponseAnalysis,
        reviewerNotes: response.reviewerNotes,
        reviewerRating: response.reviewerRating,
        reviewedBy: response.reviewedBy,
        reviewedAt: response.reviewedAt?.toISOString() ?? null,
        createdAt: response.createdAt.toISOString(),
      })
      continue
    }

    const processed = await processVideoResponse(orgId, response.id)
    results.push(processed)
  }

  const scores = results
    .map(r => r.aiAnalysis?.score)
    .filter((s): s is number => s !== null && s !== undefined)
  const averageScore = scores.length > 0 ? Math.round(mean(scores)) : 0

  return {
    inviteId,
    totalResponses: responses.length,
    analyzed: results.length,
    averageScore,
    results,
  }
}

/**
 * Submit a reviewer's rating and notes for a specific response.
 */
export async function reviewResponse(input: ReviewInput): Promise<ResponseRecord> {
  const { inviteId, questionIndex, reviewerId, rating, notes } = input

  if (rating < 1 || rating > 5) {
    throw new Error('Rating must be between 1 and 5')
  }

  // Validate reviewer exists
  const [reviewer] = await db
    .select({ id: schema.employees.id })
    .from(schema.employees)
    .where(eq(schema.employees.id, reviewerId))
    .limit(1)

  if (!reviewer) {
    throw new Error(`Reviewer ${reviewerId} not found`)
  }

  // Find the response
  const [response] = await db
    .select()
    .from(schema.videoScreenResponses)
    .where(and(
      eq(schema.videoScreenResponses.inviteId, inviteId),
      eq(schema.videoScreenResponses.questionIndex, questionIndex)
    ))
    .limit(1)

  if (!response) {
    throw new Error(`Response not found for invite ${inviteId}, question ${questionIndex}`)
  }

  const [updated] = await db
    .update(schema.videoScreenResponses)
    .set({
      reviewerRating: rating,
      reviewerNotes: notes || null,
      reviewedBy: reviewerId,
      reviewedAt: new Date(),
    })
    .where(eq(schema.videoScreenResponses.id, response.id))
    .returning()

  // Check if all responses for this invite have been reviewed
  const allResponses = await db
    .select()
    .from(schema.videoScreenResponses)
    .where(eq(schema.videoScreenResponses.inviteId, inviteId))

  const allReviewed = allResponses.every(r => r.reviewerRating !== null)
  if (allReviewed && allResponses.length > 0) {
    await db
      .update(schema.videoScreenInvites)
      .set({ status: 'reviewed' })
      .where(eq(schema.videoScreenInvites.id, inviteId))
  }

  return {
    id: updated.id,
    inviteId: updated.inviteId,
    questionIndex: updated.questionIndex,
    videoUrl: updated.videoUrl,
    thumbnailUrl: updated.thumbnailUrl,
    duration: updated.duration,
    transcription: updated.transcription,
    aiAnalysis: updated.aiAnalysis as AIResponseAnalysis | null,
    reviewerNotes: updated.reviewerNotes,
    reviewerRating: updated.reviewerRating,
    reviewedBy: updated.reviewedBy,
    reviewedAt: updated.reviewedAt?.toISOString() ?? null,
    createdAt: updated.createdAt.toISOString(),
  }
}

/**
 * Get comprehensive analytics for a video screen template.
 */
export async function getVideoScreenAnalytics(
  orgId: string,
  templateId: string
): Promise<VideoScreenAnalytics> {
  const [template] = await db
    .select()
    .from(schema.videoScreenTemplates)
    .where(and(
      eq(schema.videoScreenTemplates.id, templateId),
      eq(schema.videoScreenTemplates.orgId, orgId)
    ))
    .limit(1)

  if (!template) {
    throw new Error(`Template ${templateId} not found for organization ${orgId}`)
  }

  const questions = template.questions as TemplateQuestion[]

  // Fetch all invites for this template
  const invites = await db
    .select()
    .from(schema.videoScreenInvites)
    .where(and(
      eq(schema.videoScreenInvites.templateId, templateId),
      eq(schema.videoScreenInvites.orgId, orgId)
    ))

  const sentInvites = invites.filter(i => i.status !== 'draft')
  const completedInvites = invites.filter(i => i.status === 'completed' || i.status === 'reviewed')
  const expiredInvites = invites.filter(i => i.status === 'expired')
  const inProgressInvites = invites.filter(i => i.status === 'in_progress')

  // Calculate completion time
  const completionTimes = completedInvites
    .filter(i => i.startedAt && i.completedAt)
    .map(i => {
      const start = new Date(i.startedAt!).getTime()
      const end = new Date(i.completedAt!).getTime()
      return (end - start) / (1000 * 60) // minutes
    })

  // Fetch all responses for completed invites
  const completedInviteIds = completedInvites.map(i => i.id)
  let allResponses: Array<typeof schema.videoScreenResponses.$inferSelect> = []
  if (completedInviteIds.length > 0) {
    allResponses = await db
      .select()
      .from(schema.videoScreenResponses)
      .where(inArray(schema.videoScreenResponses.inviteId, completedInviteIds))
  }

  // Score distribution
  const scores = allResponses
    .map(r => (r.aiAnalysis as AIResponseAnalysis | null)?.score)
    .filter((s): s is number => s !== null && s !== undefined)

  const scoreDistribution = {
    excellent: scores.filter(s => s >= 80).length,
    good: scores.filter(s => s >= 60 && s < 80).length,
    adequate: scores.filter(s => s >= 40 && s < 60).length,
    poor: scores.filter(s => s < 40).length,
  }

  // Reviewer ratings
  const reviewerRatings = allResponses
    .map(r => r.reviewerRating)
    .filter((r): r is number => r !== null)

  // Question-level analytics
  const questionAnalytics = questions.map((q, index) => {
    const questionResponses = allResponses.filter(r => r.questionIndex === index)
    const questionScores = questionResponses
      .map(r => (r.aiAnalysis as AIResponseAnalysis | null)?.score)
      .filter((s): s is number => s !== null && s !== undefined)
    const questionDurations = questionResponses
      .map(r => r.duration)
      .filter((d): d is number => d !== null)

    return {
      questionIndex: index,
      questionText: q.text,
      averageScore: questionScores.length > 0 ? Math.round(mean(questionScores)) : 0,
      averageDuration: questionDurations.length > 0 ? Math.round(mean(questionDurations)) : 0,
      completionRate: completedInvites.length > 0
        ? Math.round((questionResponses.length / completedInvites.length) * 100)
        : 0,
    }
  })

  return {
    orgId,
    templateId,
    templateName: template.name,
    totalInvitesSent: sentInvites.length,
    totalCompleted: completedInvites.length,
    totalExpired: expiredInvites.length,
    totalInProgress: inProgressInvites.length,
    completionRate: sentInvites.length > 0
      ? Math.round((completedInvites.length / sentInvites.length) * 100)
      : 0,
    averageCompletionTimeMinutes: completionTimes.length > 0
      ? Math.round(mean(completionTimes) * 10) / 10
      : 0,
    averageOverallScore: scores.length > 0 ? Math.round(mean(scores)) : 0,
    averageReviewerRating: reviewerRatings.length > 0
      ? Math.round(mean(reviewerRatings) * 10) / 10
      : 0,
    scoreDistribution,
    questionAnalytics,
    generatedAt: new Date().toISOString(),
  }
}

/**
 * Generate a comparison report across multiple candidates for a template.
 */
export async function generateComparisonReport(
  orgId: string,
  templateId: string,
  applicationIds?: string[]
): Promise<ComparisonReport> {
  const [template] = await db
    .select()
    .from(schema.videoScreenTemplates)
    .where(and(
      eq(schema.videoScreenTemplates.id, templateId),
      eq(schema.videoScreenTemplates.orgId, orgId)
    ))
    .limit(1)

  if (!template) {
    throw new Error(`Template ${templateId} not found for organization ${orgId}`)
  }

  const questions = template.questions as TemplateQuestion[]

  // Fetch completed/reviewed invites
  let invitesQuery = db
    .select({
      invite: schema.videoScreenInvites,
      candidateName: schema.applications.candidateName,
      candidateEmail: schema.applications.candidateEmail,
    })
    .from(schema.videoScreenInvites)
    .innerJoin(schema.applications, eq(schema.videoScreenInvites.applicationId, schema.applications.id))
    .where(and(
      eq(schema.videoScreenInvites.templateId, templateId),
      eq(schema.videoScreenInvites.orgId, orgId)
    ))

  const inviteResults = await invitesQuery

  // Filter to completed/reviewed invites, and optionally by applicationIds
  const eligibleInvites = inviteResults.filter(r => {
    const statusOk = r.invite.status === 'completed' || r.invite.status === 'reviewed'
    const appOk = !applicationIds || applicationIds.includes(r.invite.applicationId)
    return statusOk && appOk
  })

  if (eligibleInvites.length === 0) {
    return {
      templateId,
      templateName: template.name,
      candidates: [],
      rankings: [],
      generatedAt: new Date().toISOString(),
    }
  }

  // Fetch all responses
  const inviteIds = eligibleInvites.map(r => r.invite.id)
  const allResponses = await db
    .select()
    .from(schema.videoScreenResponses)
    .where(inArray(schema.videoScreenResponses.inviteId, inviteIds))

  // Build candidate comparisons
  const candidates: CandidateComparison[] = eligibleInvites.map(({ invite, candidateName, candidateEmail }) => {
    const candidateResponses = allResponses.filter(r => r.inviteId === invite.id)

    const questionScores = questions.map((q, index) => {
      const response = candidateResponses.find(r => r.questionIndex === index)
      const analysis = response?.aiAnalysis as AIResponseAnalysis | null
      return {
        questionIndex: index,
        questionText: q.text,
        score: analysis?.score ?? 0,
        reviewerRating: response?.reviewerRating ?? null,
      }
    })

    const scores = questionScores.map(q => q.score).filter(s => s > 0)
    const overallScore = scores.length > 0 ? Math.round(mean(scores)) : 0

    // Extract strengths and concerns from AI analysis
    const allAnalyses = candidateResponses
      .map(r => r.aiAnalysis as AIResponseAnalysis | null)
      .filter((a): a is AIResponseAnalysis => a !== null)

    const strengths: string[] = []
    const concerns: string[] = []

    for (const analysis of allAnalyses) {
      if (analysis.score >= 75) {
        strengths.push(...analysis.keyPoints.slice(0, 1))
      }
      if (analysis.flags.length > 0) {
        concerns.push(...analysis.flags.slice(0, 1))
      }
    }

    const avgScore = overallScore
    let recommendation: CandidateComparison['recommendation']
    if (avgScore >= 80) recommendation = 'strong_yes'
    else if (avgScore >= 65) recommendation = 'yes'
    else if (avgScore >= 50) recommendation = 'maybe'
    else recommendation = 'no'

    return {
      applicationId: invite.applicationId,
      candidateName,
      candidateEmail,
      overallScore,
      questionScores,
      strengths: [...new Set(strengths)].slice(0, 3),
      concerns: [...new Set(concerns)].slice(0, 3),
      recommendation,
    }
  })

  // Generate rankings sorted by overall score
  const rankings = candidates
    .sort((a, b) => b.overallScore - a.overallScore)
    .map((c, index) => ({
      rank: index + 1,
      applicationId: c.applicationId,
      candidateName: c.candidateName,
      overallScore: c.overallScore,
    }))

  return {
    templateId,
    templateName: template.name,
    candidates,
    rankings,
    generatedAt: new Date().toISOString(),
  }
}

/**
 * Expire stale invitations that have passed their expiry date.
 * Should be called periodically via a cron job.
 */
export async function expireStaleInvites(orgId: string): Promise<{
  expired: number
  checkedAt: string
}> {
  const now = new Date()

  // Find all sent or in_progress invites past their expiry
  const staleInvites = await db
    .select()
    .from(schema.videoScreenInvites)
    .where(and(
      eq(schema.videoScreenInvites.orgId, orgId),
      lte(schema.videoScreenInvites.expiresAt, now)
    ))

  const toExpire = staleInvites.filter(i =>
    i.status === 'sent' || i.status === 'in_progress'
  )

  let expiredCount = 0
  for (const invite of toExpire) {
    await db
      .update(schema.videoScreenInvites)
      .set({ status: 'expired' })
      .where(eq(schema.videoScreenInvites.id, invite.id))
    expiredCount++
  }

  return {
    expired: expiredCount,
    checkedAt: now.toISOString(),
  }
}

/**
 * Create a branded video screen experience configuration.
 * Returns all data needed to render the candidate-facing video screen UI.
 */
export async function createBrandedExperience(
  orgId: string,
  templateId: string,
  inviteAccessToken: string
): Promise<BrandedExperienceConfig> {
  const [template] = await db
    .select()
    .from(schema.videoScreenTemplates)
    .where(and(
      eq(schema.videoScreenTemplates.id, templateId),
      eq(schema.videoScreenTemplates.orgId, orgId)
    ))
    .limit(1)

  if (!template) {
    throw new Error(`Template ${templateId} not found for organization ${orgId}`)
  }

  // Validate the access token belongs to a valid invite
  const [invite] = await db
    .select()
    .from(schema.videoScreenInvites)
    .where(and(
      eq(schema.videoScreenInvites.accessToken, inviteAccessToken),
      eq(schema.videoScreenInvites.templateId, templateId)
    ))
    .limit(1)

  if (!invite) {
    throw new Error('Invalid access token or template mismatch')
  }

  if (invite.status === 'expired') {
    throw new Error('This invitation has expired')
  }

  if (invite.expiresAt && new Date(invite.expiresAt) < new Date()) {
    await db
      .update(schema.videoScreenInvites)
      .set({ status: 'expired' })
      .where(eq(schema.videoScreenInvites.id, invite.id))
    throw new Error('This invitation has expired')
  }

  const branding = (template.brandingConfig as BrandingConfig) || DEFAULT_BRANDING
  const questions = template.questions as TemplateQuestion[]

  // Fetch org name for branding
  const [org] = await db
    .select({ name: schema.organizations.name })
    .from(schema.organizations)
    .where(eq(schema.organizations.id, orgId))
    .limit(1)

  const finalBranding: BrandingConfig = {
    ...branding,
    companyName: org?.name || branding.companyName,
  }

  return {
    templateId,
    orgId,
    branding: finalBranding,
    introVideoUrl: template.introVideoUrl,
    questions: questions.map(q => ({
      text: q.text,
      thinkTime: q.thinkTime,
      responseTime: q.responseTime,
      maxRetakes: q.maxRetakes,
      category: q.category,
      weight: undefined, // don't expose scoring weights to candidates
    })),
    accessUrl: `https://screen.tempo.app/${invite.id}?token=${inviteAccessToken}`,
  }
}
