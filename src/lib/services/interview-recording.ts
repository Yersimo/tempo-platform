// Tempo AI Interview Recording & Transcription Service
// Handles recording lifecycle, AI-powered transcription with speaker diarization,
// sentiment analysis, auto-generated scorecards, highlight reels, and interview insights.

import { db, schema } from '@/lib/db'
import { eq, and, desc, sql, inArray, gte, lte } from 'drizzle-orm'

// ============================================================
// Types & Interfaces
// ============================================================

export type RecordingStatus = 'scheduled' | 'recording' | 'processing' | 'completed' | 'failed'

export interface ScheduleRecordingInput {
  orgId: string
  applicationId: string
  interviewType: string
  interviewerIds: string[]
  scheduledAt: string
  platform?: 'zoom' | 'teams' | 'google_meet' | 'tempo_meet'
  meetingId?: string
}

export interface RecordingRecord {
  id: string
  orgId: string
  applicationId: string
  interviewType: string
  interviewerIds: string[]
  status: RecordingStatus
  recordingUrl: string | null
  duration: number | null
  scheduledAt: string | null
  recordedAt: string | null
  metadata: RecordingMetadata | null
  createdAt: string
}

export interface RecordingMetadata {
  platform: string
  meetingId: string | null
  resolution: string
  fileSize: number | null
  format: string
  channels: number
  sampleRate: number
}

export interface TranscriptionSegment {
  speaker: string
  speakerId: string
  startTime: number
  endTime: number
  text: string
  confidence: number
  sentiment: 'positive' | 'neutral' | 'negative'
  language: string
}

export interface SpeakerSentiment {
  speakerId: string
  speakerName: string
  overallSentiment: number
  positiveRatio: number
  neutralRatio: number
  negativeRatio: number
  segmentCount: number
  averageConfidence: number
  talkTimeSeconds: number
  talkTimePercentage: number
}

export interface AIScorecard {
  technicalSkills: ScorecardDimension
  communication: ScorecardDimension
  problemSolving: ScorecardDimension
  cultureFit: ScorecardDimension
  leadership: ScorecardDimension
  overall: number
  strengths: string[]
  concerns: string[]
  recommendation: 'strong_hire' | 'hire' | 'lean_hire' | 'lean_no_hire' | 'no_hire'
  confidence: number
  generatedAt: string
}

export interface ScorecardDimension {
  score: number
  weight: number
  evidence: string[]
  notes: string
}

export interface TranscriptionResult {
  id: string
  recordingId: string
  orgId: string
  fullText: string
  segments: TranscriptionSegment[]
  summary: string
  keyTopics: string[]
  sentiment: {
    overall: number
    perSpeaker: Record<string, SpeakerSentiment>
  }
  aiScorecard: AIScorecard | null
  language: string
  processedAt: string
  createdAt: string
}

export interface HighlightMoment {
  startTime: number
  endTime: number
  type: 'key_answer' | 'technical_discussion' | 'red_flag' | 'strong_signal' | 'culture_fit'
  label: string
  score: number
  speakerName: string
  transcript: string
}

export interface HighlightReel {
  recordingId: string
  totalDuration: number
  highlightDuration: number
  moments: HighlightMoment[]
  generatedAt: string
}

export interface RecordingPlayback {
  recording: RecordingRecord
  transcription: TranscriptionResult | null
  highlights: HighlightMoment[]
  playbackUrl: string
  expiresAt: string
}

export interface ShareConfig {
  recipientEmails: string[]
  includeTranscription: boolean
  includeScorecard: boolean
  includeHighlights: boolean
  expiresInDays: number
  message?: string
}

export interface ShareResult {
  recordingId: string
  shareLinks: Array<{
    email: string
    link: string
    expiresAt: string
  }>
  sharedAt: string
}

export interface InterviewInsight {
  applicationId: string
  candidateName: string
  totalInterviews: number
  totalRecordingMinutes: number
  averageScorecard: AIScorecard | null
  topStrengths: string[]
  recurringConcerns: string[]
  sentimentTrend: Array<{ interviewDate: string; sentiment: number }>
  stageProgression: Array<{ stage: string; date: string; score: number }>
  hiringRecommendation: string
  confidenceLevel: number
}

export interface BatchProcessResult {
  totalRecordings: number
  processed: number
  failed: number
  results: Array<{
    recordingId: string
    status: 'success' | 'failed'
    error?: string
  }>
}

// ============================================================
// Internal Helpers
// ============================================================

function generateId(): string {
  return `rec-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function generateToken(): string {
  return `${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function mean(values: number[]): number {
  if (values.length === 0) return 0
  return values.reduce((a, b) => a + b, 0) / values.length
}

/**
 * Simulates AI-powered speech-to-text transcription with speaker diarization.
 * In production, this would integrate with services like Deepgram, AssemblyAI,
 * or Google Cloud Speech-to-Text for real transcription.
 */
function simulateTranscription(
  duration: number,
  interviewerNames: string[],
  candidateName: string,
  interviewType: string,
  language: string
): { segments: TranscriptionSegment[]; fullText: string } {
  const speakers = [
    { id: 'interviewer-1', name: interviewerNames[0] || 'Interviewer 1', role: 'interviewer' },
    ...interviewerNames.slice(1).map((name, i) => ({
      id: `interviewer-${i + 2}`,
      name,
      role: 'interviewer',
    })),
    { id: 'candidate', name: candidateName, role: 'candidate' },
  ]

  const topicsByType: Record<string, string[][]> = {
    phone_screen: [
      ['Tell me about your background and what brings you to this role.', 'I have been working in the field for several years, primarily focused on building scalable systems and leading cross-functional teams.'],
      ['What interests you about our company?', 'I have been following your product development closely and I am impressed by how you approach technical challenges in the market.'],
      ['What is your ideal work environment?', 'I thrive in collaborative environments where there is a balance of autonomy and mentorship, with clear communication channels.'],
      ['Can you describe a recent project you are proud of?', 'I led a migration project that reduced infrastructure costs by 40 percent while improving system reliability to 99.9 percent uptime.'],
      ['What are your salary expectations?', 'Based on my experience and the market, I am looking at a range that reflects the impact I can bring to the role.'],
    ],
    technical: [
      ['Can you walk me through your approach to system design?', 'I start by understanding the requirements thoroughly, then identify the key components and their interactions. I focus on scalability, reliability, and maintainability from the beginning.'],
      ['How would you handle a situation where your application needs to scale to handle 10 times the current load?', 'I would look at horizontal scaling strategies, implement caching layers, optimize database queries, and consider event-driven architecture for async processing.'],
      ['Tell me about a complex bug you recently solved.', 'We had a race condition in our payment processing system that only manifested under high concurrency. I used distributed tracing and reproduced it with load testing to identify and fix the root cause.'],
      ['How do you approach code reviews?', 'I focus on correctness first, then readability and maintainability. I look for potential edge cases, security implications, and whether the code aligns with our architecture decisions.'],
      ['What testing strategies do you advocate for?', 'I believe in a testing pyramid with comprehensive unit tests, integration tests for critical paths, and end-to-end tests for user flows. Property-based testing is valuable for complex algorithms.'],
    ],
    behavioral: [
      ['Describe a time you disagreed with your manager.', 'I presented data showing our current approach would not meet our scaling goals. We had a constructive discussion and ultimately adopted a hybrid solution that addressed both perspectives.'],
      ['How do you handle conflicting priorities?', 'I assess impact and urgency, communicate transparently with stakeholders about trade-offs, and propose realistic timelines that account for quality.'],
      ['Tell me about a time you failed and what you learned.', 'I underestimated the complexity of a data migration and we missed our deadline. I learned to add significant buffer for unknowns and to validate assumptions earlier in the process.'],
    ],
    panel: [
      ['How do you collaborate across teams?', 'I establish clear communication channels, set shared objectives, and create documentation that bridges knowledge gaps between teams.'],
      ['What is your approach to mentoring junior engineers?', 'I pair program regularly, provide constructive code review feedback, and create opportunities for ownership on meaningful projects with appropriate support.'],
    ],
    default: [
      ['Tell me about yourself and your experience.', 'I bring a strong background in building and scaling technology teams, with deep experience in distributed systems and a passion for creating positive engineering culture.'],
      ['Why are you interested in this position?', 'The combination of the technical challenges, the team culture, and the impact the product has on users makes this an exciting opportunity for me.'],
    ],
  }

  const topics = topicsByType[interviewType] || topicsByType.default
  const segmentDuration = duration / (topics.length * 2 + 2) // divide time roughly across QA pairs
  const segments: TranscriptionSegment[] = []
  let currentTime = 0

  // Opening
  const openingSpeaker = speakers[0]
  segments.push({
    speaker: openingSpeaker.name,
    speakerId: openingSpeaker.id,
    startTime: currentTime,
    endTime: currentTime + segmentDuration * 0.5,
    text: `Welcome, ${candidateName}. Thank you for joining us today. We are excited to learn more about your experience and how you might contribute to our team.`,
    confidence: 0.95,
    sentiment: 'positive',
    language,
  })
  currentTime += segmentDuration * 0.5

  // QA pairs
  for (const [question, answer] of topics) {
    const interviewerIndex = Math.floor(Math.random() * Math.min(speakers.length - 1, interviewerNames.length))
    const interviewer = speakers[interviewerIndex]
    const candidate = speakers[speakers.length - 1]

    const questionDuration = segmentDuration * (0.3 + Math.random() * 0.4)
    segments.push({
      speaker: interviewer.name,
      speakerId: interviewer.id,
      startTime: currentTime,
      endTime: currentTime + questionDuration,
      text: question,
      confidence: 0.92 + Math.random() * 0.07,
      sentiment: 'neutral',
      language,
    })
    currentTime += questionDuration

    const answerDuration = segmentDuration * (0.8 + Math.random() * 0.6)
    const sentiments: Array<'positive' | 'neutral' | 'negative'> = ['positive', 'neutral', 'positive']
    segments.push({
      speaker: candidate.name,
      speakerId: candidate.id,
      startTime: currentTime,
      endTime: currentTime + answerDuration,
      text: answer,
      confidence: 0.88 + Math.random() * 0.10,
      sentiment: sentiments[Math.floor(Math.random() * sentiments.length)],
      language,
    })
    currentTime += answerDuration
  }

  // Closing
  const closingSpeaker = speakers[0]
  segments.push({
    speaker: closingSpeaker.name,
    speakerId: closingSpeaker.id,
    startTime: currentTime,
    endTime: Math.min(currentTime + segmentDuration * 0.5, duration),
    text: `Thank you for your time today, ${candidateName}. We will be in touch with next steps. Do you have any questions for us?`,
    confidence: 0.96,
    sentiment: 'positive',
    language,
  })

  const fullText = segments.map(s => `[${s.speaker}]: ${s.text}`).join('\n\n')

  return { segments, fullText }
}

/**
 * Analyzes transcription segments to compute speaker-level sentiment metrics.
 */
function analyzeSpeakerSentiment(segments: TranscriptionSegment[]): Record<string, SpeakerSentiment> {
  const speakerMap: Record<string, TranscriptionSegment[]> = {}
  for (const seg of segments) {
    if (!speakerMap[seg.speakerId]) {
      speakerMap[seg.speakerId] = []
    }
    speakerMap[seg.speakerId].push(seg)
  }

  const totalTalkTime = segments.reduce((sum, s) => sum + (s.endTime - s.startTime), 0)
  const result: Record<string, SpeakerSentiment> = {}

  for (const [speakerId, speakerSegments] of Object.entries(speakerMap)) {
    const positiveCount = speakerSegments.filter(s => s.sentiment === 'positive').length
    const neutralCount = speakerSegments.filter(s => s.sentiment === 'neutral').length
    const negativeCount = speakerSegments.filter(s => s.sentiment === 'negative').length
    const total = speakerSegments.length
    const talkTime = speakerSegments.reduce((sum, s) => sum + (s.endTime - s.startTime), 0)

    const sentimentScore = total > 0
      ? clamp((positiveCount - negativeCount) / total, -1, 1)
      : 0

    result[speakerId] = {
      speakerId,
      speakerName: speakerSegments[0].speaker,
      overallSentiment: Math.round(sentimentScore * 100) / 100,
      positiveRatio: total > 0 ? Math.round((positiveCount / total) * 100) / 100 : 0,
      neutralRatio: total > 0 ? Math.round((neutralCount / total) * 100) / 100 : 0,
      negativeRatio: total > 0 ? Math.round((negativeCount / total) * 100) / 100 : 0,
      segmentCount: total,
      averageConfidence: Math.round(mean(speakerSegments.map(s => s.confidence)) * 100) / 100,
      talkTimeSeconds: Math.round(talkTime),
      talkTimePercentage: totalTalkTime > 0 ? Math.round((talkTime / totalTalkTime) * 100) : 0,
    }
  }

  return result
}

/**
 * Extracts key topics and themes from transcription text.
 */
function extractKeyTopics(segments: TranscriptionSegment[]): string[] {
  const topicKeywords: Record<string, string[]> = {
    'System Design': ['system design', 'architecture', 'scalability', 'distributed', 'microservices'],
    'Technical Skills': ['code', 'programming', 'algorithm', 'data structure', 'testing', 'debugging'],
    'Leadership': ['team', 'lead', 'mentor', 'manage', 'delegate', 'vision'],
    'Problem Solving': ['problem', 'solution', 'approach', 'resolve', 'debug', 'fix', 'root cause'],
    'Communication': ['communicate', 'collaboration', 'stakeholder', 'present', 'documentation'],
    'Culture & Values': ['culture', 'values', 'work environment', 'diversity', 'inclusion'],
    'Career Growth': ['growth', 'career', 'learning', 'development', 'goals'],
    'Project Experience': ['project', 'migration', 'deployment', 'release', 'ship'],
    'Process & Methodology': ['agile', 'scrum', 'kanban', 'sprint', 'iteration', 'process'],
    'Performance & Scaling': ['performance', 'optimization', 'scale', 'load', 'latency', 'throughput'],
    'Testing & Quality': ['test', 'quality', 'review', 'coverage', 'ci/cd', 'automation'],
    'Conflict Resolution': ['disagree', 'conflict', 'compromise', 'negotiate', 'consensus'],
  }

  const combinedText = segments.map(s => s.text).join(' ').toLowerCase()
  const detectedTopics: string[] = []

  for (const [topic, keywords] of Object.entries(topicKeywords)) {
    const matches = keywords.filter(kw => combinedText.includes(kw))
    if (matches.length >= 1) {
      detectedTopics.push(topic)
    }
  }

  return detectedTopics.slice(0, 8)
}

/**
 * Generates a summary from transcription segments.
 */
function generateSummary(
  segments: TranscriptionSegment[],
  candidateName: string,
  interviewType: string,
  keyTopics: string[]
): string {
  const totalDuration = segments.length > 0
    ? Math.round((segments[segments.length - 1].endTime - segments[0].startTime) / 60)
    : 0

  const candidateSegments = segments.filter(s => s.speakerId === 'candidate')
  const candidateTalkRatio = segments.length > 0
    ? Math.round((candidateSegments.length / segments.length) * 100)
    : 0

  const topicList = keyTopics.length > 0
    ? keyTopics.slice(0, 4).join(', ')
    : 'general discussion'

  const overallSentiment = candidateSegments.length > 0
    ? mean(candidateSegments.map(s => s.sentiment === 'positive' ? 1 : s.sentiment === 'negative' ? -1 : 0))
    : 0

  const sentimentLabel = overallSentiment > 0.3
    ? 'positive and engaged'
    : overallSentiment < -0.3
    ? 'reserved or cautious'
    : 'balanced and professional'

  const parts = [
    `${interviewType.replace(/_/g, ' ')} interview with ${candidateName} lasting approximately ${totalDuration} minutes.`,
    `Key topics covered: ${topicList}.`,
    `The candidate spoke for approximately ${candidateTalkRatio}% of the conversation, demonstrating a ${sentimentLabel} tone throughout.`,
  ]

  if (candidateSegments.length > 0) {
    const avgConfidence = mean(candidateSegments.map(s => s.confidence))
    if (avgConfidence > 0.93) {
      parts.push('Transcription confidence was high, indicating clear and articulate responses.')
    }
  }

  return parts.join(' ')
}

/**
 * Generates an AI scorecard with weighted scoring across multiple dimensions.
 * Uses transcription analysis signals to produce realistic evaluations.
 */
function generateScorecardFromTranscription(
  segments: TranscriptionSegment[],
  speakerSentiment: Record<string, SpeakerSentiment>,
  keyTopics: string[],
  interviewType: string
): AIScorecard {
  const candidateSentiment = speakerSentiment['candidate']
  const candidateSegments = segments.filter(s => s.speakerId === 'candidate')

  // Base signals for scoring
  const avgConfidence = candidateSegments.length > 0
    ? mean(candidateSegments.map(s => s.confidence))
    : 0.5
  const positiveRatio = candidateSentiment?.positiveRatio ?? 0.5
  const talkPercentage = candidateSentiment?.talkTimePercentage ?? 50
  const avgTextLength = candidateSegments.length > 0
    ? mean(candidateSegments.map(s => s.text.length))
    : 50

  // Technical Skills scoring - weight higher for technical interviews
  const technicalTopics = ['Technical Skills', 'System Design', 'Performance & Scaling', 'Testing & Quality']
  const technicalTopicCount = keyTopics.filter(t => technicalTopics.includes(t)).length
  const technicalBase = clamp(technicalTopicCount * 20 + avgConfidence * 30 + (avgTextLength > 100 ? 20 : 10), 0, 100)
  const technicalWeight = interviewType === 'technical' ? 0.35 : 0.20

  const technicalEvidence: string[] = []
  if (technicalTopicCount >= 2) technicalEvidence.push('Demonstrated depth in multiple technical areas')
  if (avgTextLength > 120) technicalEvidence.push('Provided detailed technical explanations')
  if (avgConfidence > 0.92) technicalEvidence.push('Responses showed high clarity and precision')
  if (technicalTopicCount === 0) technicalEvidence.push('Limited technical discussion in this interview')

  // Communication scoring
  const communicationBase = clamp(
    (talkPercentage >= 40 && talkPercentage <= 70 ? 30 : 15) +
    avgConfidence * 35 +
    (avgTextLength > 80 ? 20 : 10) +
    positiveRatio * 15,
    0, 100
  )
  const communicationWeight = 0.25

  const communicationEvidence: string[] = []
  if (talkPercentage >= 40 && talkPercentage <= 70) communicationEvidence.push('Maintained balanced conversation flow')
  if (avgConfidence > 0.90) communicationEvidence.push('Articulate and clear communication style')
  if (avgTextLength > 100) communicationEvidence.push('Provided thorough and detailed responses')
  if (talkPercentage > 80) communicationEvidence.push('Tendency to dominate conversation; may need to listen more')

  // Problem Solving scoring
  const problemTopics = ['Problem Solving', 'System Design', 'Performance & Scaling']
  const problemTopicCount = keyTopics.filter(t => problemTopics.includes(t)).length
  const problemBase = clamp(
    problemTopicCount * 25 + avgConfidence * 25 + (avgTextLength > 100 ? 25 : 10),
    0, 100
  )
  const problemWeight = interviewType === 'technical' ? 0.25 : 0.15

  const problemEvidence: string[] = []
  if (problemTopicCount >= 2) problemEvidence.push('Showed structured approach to problem decomposition')
  if (avgTextLength > 120) problemEvidence.push('Walked through solutions with appropriate detail')
  if (problemTopicCount === 0) problemEvidence.push('Problem-solving not directly assessed in this interview')

  // Culture Fit scoring
  const cultureTopics = ['Culture & Values', 'Leadership', 'Conflict Resolution', 'Communication']
  const cultureTopicCount = keyTopics.filter(t => cultureTopics.includes(t)).length
  const cultureBase = clamp(
    cultureTopicCount * 20 + positiveRatio * 40 + (talkPercentage >= 35 && talkPercentage <= 65 ? 20 : 5),
    0, 100
  )
  const cultureWeight = interviewType === 'behavioral' ? 0.30 : 0.15

  const cultureEvidence: string[] = []
  if (positiveRatio > 0.5) cultureEvidence.push('Demonstrated positive and collaborative demeanor')
  if (cultureTopicCount >= 2) cultureEvidence.push('Engaged meaningfully on culture and values topics')
  if (cultureTopicCount === 0) cultureEvidence.push('Culture fit not directly assessed; recommend follow-up')

  // Leadership scoring
  const leadershipTopics = ['Leadership', 'Career Growth', 'Process & Methodology']
  const leadershipTopicCount = keyTopics.filter(t => leadershipTopics.includes(t)).length
  const leadershipBase = clamp(
    leadershipTopicCount * 25 + avgConfidence * 20 + positiveRatio * 20,
    0, 100
  )
  const leadershipWeight = 0.10

  const leadershipEvidence: string[] = []
  if (leadershipTopicCount >= 1) leadershipEvidence.push('Showed leadership experience and initiative')
  if (positiveRatio > 0.6) leadershipEvidence.push('Positive energy indicates strong leadership potential')

  // Normalize weights
  const totalWeight = technicalWeight + communicationWeight + problemWeight + cultureWeight + leadershipWeight
  const normalizedTechnicalWeight = technicalWeight / totalWeight
  const normalizedCommunicationWeight = communicationWeight / totalWeight
  const normalizedProblemWeight = problemWeight / totalWeight
  const normalizedCultureWeight = cultureWeight / totalWeight
  const normalizedLeadershipWeight = leadershipWeight / totalWeight

  // Calculate overall score
  const overall = Math.round(
    technicalBase * normalizedTechnicalWeight +
    communicationBase * normalizedCommunicationWeight +
    problemBase * normalizedProblemWeight +
    cultureBase * normalizedCultureWeight +
    leadershipBase * normalizedLeadershipWeight
  )

  // Generate strengths and concerns
  const allDimensions = [
    { name: 'Technical Skills', score: technicalBase, evidence: technicalEvidence },
    { name: 'Communication', score: communicationBase, evidence: communicationEvidence },
    { name: 'Problem Solving', score: problemBase, evidence: problemEvidence },
    { name: 'Culture Fit', score: cultureBase, evidence: cultureEvidence },
    { name: 'Leadership', score: leadershipBase, evidence: leadershipEvidence },
  ]

  const strengths = allDimensions
    .filter(d => d.score >= 65)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(d => `${d.name}: ${d.evidence[0] || 'Strong performance observed'}`)

  const concerns = allDimensions
    .filter(d => d.score < 50)
    .map(d => `${d.name}: ${d.evidence[d.evidence.length - 1] || 'Below expected threshold'}`)

  // Determine recommendation
  let recommendation: AIScorecard['recommendation']
  if (overall >= 80) recommendation = 'strong_hire'
  else if (overall >= 65) recommendation = 'hire'
  else if (overall >= 55) recommendation = 'lean_hire'
  else if (overall >= 40) recommendation = 'lean_no_hire'
  else recommendation = 'no_hire'

  // Confidence based on data quality
  const confidence = clamp(
    Math.round(
      (candidateSegments.length > 3 ? 0.3 : 0.1) +
      (avgConfidence * 0.3) +
      (keyTopics.length > 3 ? 0.2 : 0.1) +
      (candidateSentiment ? 0.2 : 0)
    * 100) / 100,
    0.3,
    0.95
  )

  return {
    technicalSkills: {
      score: Math.round(technicalBase),
      weight: Math.round(normalizedTechnicalWeight * 100) / 100,
      evidence: technicalEvidence,
      notes: `Evaluated across ${technicalTopicCount} technical topic(s)`,
    },
    communication: {
      score: Math.round(communicationBase),
      weight: Math.round(normalizedCommunicationWeight * 100) / 100,
      evidence: communicationEvidence,
      notes: `Candidate talk ratio: ${talkPercentage}%, avg response confidence: ${Math.round(avgConfidence * 100)}%`,
    },
    problemSolving: {
      score: Math.round(problemBase),
      weight: Math.round(normalizedProblemWeight * 100) / 100,
      evidence: problemEvidence,
      notes: `Assessed through ${problemTopicCount} problem-related discussion(s)`,
    },
    cultureFit: {
      score: Math.round(cultureBase),
      weight: Math.round(normalizedCultureWeight * 100) / 100,
      evidence: cultureEvidence,
      notes: `Positive sentiment ratio: ${Math.round(positiveRatio * 100)}%`,
    },
    leadership: {
      score: Math.round(leadershipBase),
      weight: Math.round(normalizedLeadershipWeight * 100) / 100,
      evidence: leadershipEvidence,
      notes: `Leadership indicators detected in ${leadershipTopicCount} topic area(s)`,
    },
    overall,
    strengths,
    concerns,
    recommendation,
    confidence,
    generatedAt: new Date().toISOString(),
  }
}

/**
 * Identifies highlight moments from transcription segments based on
 * content significance, sentiment shifts, and topic relevance.
 */
function identifyHighlightMoments(
  segments: TranscriptionSegment[],
  keyTopics: string[]
): HighlightMoment[] {
  const highlights: HighlightMoment[] = []
  const candidateSegments = segments.filter(s => s.speakerId === 'candidate')

  for (const segment of candidateSegments) {
    const textLower = segment.text.toLowerCase()
    let score = 0
    let type: HighlightMoment['type'] = 'key_answer'
    let label = ''

    // Detect strong technical signals
    if (/system design|architecture|scalability|distributed|microservice/i.test(textLower)) {
      score += 0.4
      type = 'technical_discussion'
      label = 'Technical Architecture Discussion'
    }

    // Detect problem-solving signals
    if (/root cause|debug|solved|fixed|resolved|approach/i.test(textLower)) {
      score += 0.3
      type = 'strong_signal'
      label = 'Problem Solving Demonstration'
    }

    // Detect quantitative achievements
    if (/\d+\s*(%|percent|times|x\b)|reduced|improved|increased/i.test(textLower)) {
      score += 0.35
      type = 'strong_signal'
      label = 'Quantitative Achievement Mentioned'
    }

    // Detect culture/collaboration signals
    if (/team|mentor|collaborate|culture|values/i.test(textLower)) {
      score += 0.2
      type = 'culture_fit'
      label = 'Culture & Collaboration Insight'
    }

    // Detect potential red flags
    if (/not sure|I don\'t know|haven\'t done|no experience/i.test(textLower)) {
      score += 0.3
      type = 'red_flag'
      label = 'Potential Gap Identified'
    }

    // High confidence + long response = likely substantive
    if (segment.confidence > 0.93 && segment.text.length > 150) {
      score += 0.15
      if (!label) label = 'Key Answer'
    }

    // Sentiment-driven highlights
    if (segment.sentiment === 'positive' && segment.text.length > 100) {
      score += 0.1
      if (!label) {
        label = 'Positive Engagement'
        type = 'strong_signal'
      }
    }

    if (score >= 0.3) {
      highlights.push({
        startTime: segment.startTime,
        endTime: segment.endTime,
        type,
        label: label || 'Notable Moment',
        score: clamp(Math.round(score * 100) / 100, 0, 1),
        speakerName: segment.speaker,
        transcript: segment.text.slice(0, 300),
      })
    }
  }

  // Sort by score descending, limit to top moments
  return highlights
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
}

// ============================================================
// Public API Functions
// ============================================================

/**
 * Schedule a recording for an upcoming interview.
 * Creates a recording record in 'scheduled' status linked to the application.
 */
export async function scheduleRecording(input: ScheduleRecordingInput): Promise<RecordingRecord> {
  const { orgId, applicationId, interviewType, interviewerIds, scheduledAt, platform, meetingId } = input

  // Validate application exists
  const [application] = await db
    .select()
    .from(schema.applications)
    .where(and(eq(schema.applications.id, applicationId), eq(schema.applications.orgId, orgId)))
    .limit(1)

  if (!application) {
    throw new Error(`Application ${applicationId} not found for organization ${orgId}`)
  }

  // Validate interviewers exist in org
  if (interviewerIds.length === 0) {
    throw new Error('At least one interviewer is required')
  }

  const interviewers = await db
    .select({ id: schema.employees.id })
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

  // Validate scheduled time is in the future
  const scheduledDate = new Date(scheduledAt)
  if (isNaN(scheduledDate.getTime())) {
    throw new Error('Invalid scheduledAt date format')
  }
  if (scheduledDate <= new Date()) {
    throw new Error('Scheduled time must be in the future')
  }

  const metadata: RecordingMetadata = {
    platform: platform || 'tempo_meet',
    meetingId: meetingId || null,
    resolution: '1080p',
    fileSize: null,
    format: 'webm',
    channels: 2,
    sampleRate: 48000,
  }

  const [recording] = await db
    .insert(schema.interviewRecordings)
    .values({
      orgId,
      applicationId,
      interviewType,
      interviewerIds: interviewerIds as unknown as never,
      status: 'scheduled',
      scheduledAt: scheduledDate,
      metadata: metadata as unknown as never,
    })
    .returning()

  return {
    id: recording.id,
    orgId: recording.orgId,
    applicationId: recording.applicationId,
    interviewType: recording.interviewType,
    interviewerIds: recording.interviewerIds as string[],
    status: recording.status as RecordingStatus,
    recordingUrl: recording.recordingUrl,
    duration: recording.duration,
    scheduledAt: recording.scheduledAt?.toISOString() ?? null,
    recordedAt: recording.recordedAt?.toISOString() ?? null,
    metadata: recording.metadata as RecordingMetadata | null,
    createdAt: recording.createdAt.toISOString(),
  }
}

/**
 * Transition a scheduled recording to 'recording' status.
 * Called when the interview begins and recording is initiated.
 */
export async function startRecording(
  orgId: string,
  recordingId: string
): Promise<RecordingRecord> {
  const [recording] = await db
    .select()
    .from(schema.interviewRecordings)
    .where(and(
      eq(schema.interviewRecordings.id, recordingId),
      eq(schema.interviewRecordings.orgId, orgId)
    ))
    .limit(1)

  if (!recording) {
    throw new Error(`Recording ${recordingId} not found for organization ${orgId}`)
  }

  if (recording.status !== 'scheduled') {
    throw new Error(`Cannot start recording in '${recording.status}' status. Only 'scheduled' recordings can be started.`)
  }

  const [updated] = await db
    .update(schema.interviewRecordings)
    .set({
      status: 'recording',
      recordedAt: new Date(),
    })
    .where(eq(schema.interviewRecordings.id, recordingId))
    .returning()

  return {
    id: updated.id,
    orgId: updated.orgId,
    applicationId: updated.applicationId,
    interviewType: updated.interviewType,
    interviewerIds: updated.interviewerIds as string[],
    status: updated.status as RecordingStatus,
    recordingUrl: updated.recordingUrl,
    duration: updated.duration,
    scheduledAt: updated.scheduledAt?.toISOString() ?? null,
    recordedAt: updated.recordedAt?.toISOString() ?? null,
    metadata: updated.metadata as RecordingMetadata | null,
    createdAt: updated.createdAt.toISOString(),
  }
}

/**
 * Stop an active recording, save its URL and duration,
 * and transition it to 'processing' for transcription.
 */
export async function stopRecording(
  orgId: string,
  recordingId: string,
  recordingUrl: string,
  durationSeconds: number
): Promise<RecordingRecord> {
  if (!recordingUrl) {
    throw new Error('Recording URL is required when stopping a recording')
  }
  if (durationSeconds <= 0) {
    throw new Error('Duration must be a positive number of seconds')
  }

  const [recording] = await db
    .select()
    .from(schema.interviewRecordings)
    .where(and(
      eq(schema.interviewRecordings.id, recordingId),
      eq(schema.interviewRecordings.orgId, orgId)
    ))
    .limit(1)

  if (!recording) {
    throw new Error(`Recording ${recordingId} not found for organization ${orgId}`)
  }

  if (recording.status !== 'recording') {
    throw new Error(`Cannot stop recording in '${recording.status}' status. Only active recordings can be stopped.`)
  }

  // Estimate file size based on duration (roughly 1.5 MB per minute for 1080p WebM)
  const estimatedFileSize = Math.round(durationSeconds * 1.5 * 1024 * 1024 / 60)
  const currentMetadata = recording.metadata as RecordingMetadata | null
  const updatedMetadata: RecordingMetadata = {
    ...currentMetadata || { platform: 'tempo_meet', meetingId: null, resolution: '1080p', format: 'webm', channels: 2, sampleRate: 48000 },
    fileSize: estimatedFileSize,
  }

  const [updated] = await db
    .update(schema.interviewRecordings)
    .set({
      status: 'processing',
      recordingUrl,
      duration: durationSeconds,
      metadata: updatedMetadata as unknown as never,
    })
    .where(eq(schema.interviewRecordings.id, recordingId))
    .returning()

  return {
    id: updated.id,
    orgId: updated.orgId,
    applicationId: updated.applicationId,
    interviewType: updated.interviewType,
    interviewerIds: updated.interviewerIds as string[],
    status: updated.status as RecordingStatus,
    recordingUrl: updated.recordingUrl,
    duration: updated.duration,
    scheduledAt: updated.scheduledAt?.toISOString() ?? null,
    recordedAt: updated.recordedAt?.toISOString() ?? null,
    metadata: updated.metadata as RecordingMetadata | null,
    createdAt: updated.createdAt.toISOString(),
  }
}

/**
 * Full processing pipeline for a recording: transcription, analysis, and scorecard generation.
 * Orchestrates generateTranscription, analyzeTranscription, and generateAIScorecard.
 */
export async function processRecording(
  orgId: string,
  recordingId: string,
  language: string = 'en'
): Promise<TranscriptionResult> {
  const [recording] = await db
    .select()
    .from(schema.interviewRecordings)
    .where(and(
      eq(schema.interviewRecordings.id, recordingId),
      eq(schema.interviewRecordings.orgId, orgId)
    ))
    .limit(1)

  if (!recording) {
    throw new Error(`Recording ${recordingId} not found for organization ${orgId}`)
  }

  if (recording.status !== 'processing' && recording.status !== 'completed') {
    throw new Error(`Recording must be in 'processing' or 'completed' status to process. Current status: ${recording.status}`)
  }

  // Fetch application for candidate name
  const [application] = await db
    .select()
    .from(schema.applications)
    .where(eq(schema.applications.id, recording.applicationId))
    .limit(1)

  if (!application) {
    throw new Error(`Application ${recording.applicationId} not found`)
  }

  // Fetch interviewer names
  const interviewerIds = recording.interviewerIds as string[]
  const interviewers = await db
    .select({ id: schema.employees.id, fullName: schema.employees.fullName })
    .from(schema.employees)
    .where(inArray(schema.employees.id, interviewerIds))

  const interviewerNames = interviewers.map(i => i.fullName)
  const duration = recording.duration || 2400 // default 40 min

  // Step 1: Generate transcription
  const transcription = await generateTranscription(
    recordingId, orgId, duration, interviewerNames,
    application.candidateName, recording.interviewType, language
  )

  // Step 2: Analyze transcription (sentiment, topics, summary)
  const analysis = analyzeTranscription(transcription.segments, application.candidateName, recording.interviewType)

  // Step 3: Generate AI scorecard
  const scorecard = generateAIScorecard(
    transcription.segments, analysis.speakerSentiment,
    analysis.keyTopics, recording.interviewType
  )

  // Persist to database
  const [saved] = await db
    .insert(schema.interviewTranscriptions)
    .values({
      recordingId,
      orgId,
      fullText: transcription.fullText,
      segments: transcription.segments as unknown as never,
      summary: analysis.summary,
      keyTopics: analysis.keyTopics as unknown as never,
      sentiment: { overall: analysis.overallSentiment, perSpeaker: analysis.speakerSentiment } as unknown as never,
      aiScorecard: scorecard as unknown as never,
      language,
      processedAt: new Date(),
    })
    .returning()

  // Update recording status to completed
  await db
    .update(schema.interviewRecordings)
    .set({ status: 'completed' })
    .where(eq(schema.interviewRecordings.id, recordingId))

  return {
    id: saved.id,
    recordingId,
    orgId,
    fullText: transcription.fullText,
    segments: transcription.segments,
    summary: analysis.summary,
    keyTopics: analysis.keyTopics,
    sentiment: {
      overall: analysis.overallSentiment,
      perSpeaker: analysis.speakerSentiment,
    },
    aiScorecard: scorecard,
    language,
    processedAt: saved.processedAt?.toISOString() ?? new Date().toISOString(),
    createdAt: saved.createdAt.toISOString(),
  }
}

/**
 * Generate transcription with speaker diarization from a recording.
 * In production, this calls an external STT service. Here we simulate
 * realistic transcription output for development.
 */
export async function generateTranscription(
  recordingId: string,
  orgId: string,
  duration: number,
  interviewerNames: string[],
  candidateName: string,
  interviewType: string,
  language: string = 'en'
): Promise<{ segments: TranscriptionSegment[]; fullText: string }> {
  if (duration <= 0) {
    throw new Error('Duration must be positive for transcription generation')
  }

  const { segments, fullText } = simulateTranscription(
    duration, interviewerNames, candidateName, interviewType, language
  )

  return { segments, fullText }
}

/**
 * Analyze a transcription for sentiment, key topics, and summary.
 */
export function analyzeTranscription(
  segments: TranscriptionSegment[],
  candidateName: string,
  interviewType: string
): {
  speakerSentiment: Record<string, SpeakerSentiment>
  keyTopics: string[]
  summary: string
  overallSentiment: number
} {
  if (segments.length === 0) {
    return {
      speakerSentiment: {},
      keyTopics: [],
      summary: 'No transcription data available for analysis.',
      overallSentiment: 0,
    }
  }

  const speakerSentiment = analyzeSpeakerSentiment(segments)
  const keyTopics = extractKeyTopics(segments)
  const summary = generateSummary(segments, candidateName, interviewType, keyTopics)

  const candidateSentiment = speakerSentiment['candidate']
  const overallSentiment = candidateSentiment
    ? Math.round(candidateSentiment.overallSentiment * 100) / 100
    : 0

  return { speakerSentiment, keyTopics, summary, overallSentiment }
}

/**
 * Generate an AI-powered interview scorecard from transcription data.
 */
export function generateAIScorecard(
  segments: TranscriptionSegment[],
  speakerSentiment: Record<string, SpeakerSentiment>,
  keyTopics: string[],
  interviewType: string
): AIScorecard {
  return generateScorecardFromTranscription(segments, speakerSentiment, keyTopics, interviewType)
}

/**
 * Get recording playback details including transcription and highlights.
 * Generates a time-limited playback URL.
 */
export async function getRecordingPlayback(
  orgId: string,
  recordingId: string
): Promise<RecordingPlayback> {
  const [recording] = await db
    .select()
    .from(schema.interviewRecordings)
    .where(and(
      eq(schema.interviewRecordings.id, recordingId),
      eq(schema.interviewRecordings.orgId, orgId)
    ))
    .limit(1)

  if (!recording) {
    throw new Error(`Recording ${recordingId} not found for organization ${orgId}`)
  }

  // Fetch transcription if available
  let transcription: TranscriptionResult | null = null
  const [trans] = await db
    .select()
    .from(schema.interviewTranscriptions)
    .where(eq(schema.interviewTranscriptions.recordingId, recordingId))
    .limit(1)

  if (trans) {
    transcription = {
      id: trans.id,
      recordingId: trans.recordingId,
      orgId: trans.orgId,
      fullText: trans.fullText ?? '',
      segments: (trans.segments as TranscriptionSegment[]) ?? [],
      summary: trans.summary ?? '',
      keyTopics: (trans.keyTopics as string[]) ?? [],
      sentiment: trans.sentiment as { overall: number; perSpeaker: Record<string, SpeakerSentiment> } ?? { overall: 0, perSpeaker: {} },
      aiScorecard: trans.aiScorecard as AIScorecard | null,
      language: trans.language,
      processedAt: trans.processedAt?.toISOString() ?? '',
      createdAt: trans.createdAt.toISOString(),
    }
  }

  // Generate highlights from transcription
  const highlights: HighlightMoment[] = transcription?.segments
    ? identifyHighlightMoments(transcription.segments, transcription.keyTopics)
    : []

  // Generate time-limited playback URL (expires in 24 hours)
  const token = generateToken()
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  const playbackUrl = recording.recordingUrl
    ? `${recording.recordingUrl}?token=${token}&expires=${encodeURIComponent(expiresAt)}`
    : `https://recordings.tempo.app/${recordingId}/playback?token=${token}`

  return {
    recording: {
      id: recording.id,
      orgId: recording.orgId,
      applicationId: recording.applicationId,
      interviewType: recording.interviewType,
      interviewerIds: recording.interviewerIds as string[],
      status: recording.status as RecordingStatus,
      recordingUrl: recording.recordingUrl,
      duration: recording.duration,
      scheduledAt: recording.scheduledAt?.toISOString() ?? null,
      recordedAt: recording.recordedAt?.toISOString() ?? null,
      metadata: recording.metadata as RecordingMetadata | null,
      createdAt: recording.createdAt.toISOString(),
    },
    transcription,
    highlights,
    playbackUrl,
    expiresAt,
  }
}

/**
 * Share a recording with team members via email.
 * Generates unique, time-limited share links.
 */
export async function shareRecording(
  orgId: string,
  recordingId: string,
  config: ShareConfig
): Promise<ShareResult> {
  // Validate recording exists
  const [recording] = await db
    .select()
    .from(schema.interviewRecordings)
    .where(and(
      eq(schema.interviewRecordings.id, recordingId),
      eq(schema.interviewRecordings.orgId, orgId)
    ))
    .limit(1)

  if (!recording) {
    throw new Error(`Recording ${recordingId} not found for organization ${orgId}`)
  }

  if (recording.status !== 'completed') {
    throw new Error('Only completed recordings can be shared')
  }

  if (!config.recipientEmails || config.recipientEmails.length === 0) {
    throw new Error('At least one recipient email is required')
  }

  if (config.expiresInDays <= 0 || config.expiresInDays > 90) {
    throw new Error('Expiration must be between 1 and 90 days')
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  for (const email of config.recipientEmails) {
    if (!emailRegex.test(email)) {
      throw new Error(`Invalid email format: ${email}`)
    }
  }

  const expiresAt = new Date(Date.now() + config.expiresInDays * 24 * 60 * 60 * 1000)

  // Build share parameters
  const params = new URLSearchParams()
  if (config.includeTranscription) params.set('transcript', '1')
  if (config.includeScorecard) params.set('scorecard', '1')
  if (config.includeHighlights) params.set('highlights', '1')

  const shareLinks = config.recipientEmails.map(email => {
    const shareToken = generateToken()
    return {
      email,
      link: `https://app.tempo.com/shared/recordings/${recordingId}?token=${shareToken}&${params.toString()}`,
      expiresAt: expiresAt.toISOString(),
    }
  })

  // In production, this would trigger email sending via the notification dispatcher
  return {
    recordingId,
    shareLinks,
    sharedAt: new Date().toISOString(),
  }
}

/**
 * Generate a highlight reel from key moments in a recording.
 * Identifies the most significant segments based on content analysis.
 */
export async function generateHighlightReel(
  orgId: string,
  recordingId: string
): Promise<HighlightReel> {
  const [recording] = await db
    .select()
    .from(schema.interviewRecordings)
    .where(and(
      eq(schema.interviewRecordings.id, recordingId),
      eq(schema.interviewRecordings.orgId, orgId)
    ))
    .limit(1)

  if (!recording) {
    throw new Error(`Recording ${recordingId} not found for organization ${orgId}`)
  }

  if (recording.status !== 'completed') {
    throw new Error('Highlight reels can only be generated for completed recordings')
  }

  const [transcription] = await db
    .select()
    .from(schema.interviewTranscriptions)
    .where(eq(schema.interviewTranscriptions.recordingId, recordingId))
    .limit(1)

  if (!transcription) {
    throw new Error('Transcription not found. Process the recording before generating highlights.')
  }

  const segments = (transcription.segments as TranscriptionSegment[]) ?? []
  const keyTopics = (transcription.keyTopics as string[]) ?? []
  const moments = identifyHighlightMoments(segments, keyTopics)

  const highlightDuration = moments.reduce((sum, m) => sum + (m.endTime - m.startTime), 0)

  return {
    recordingId,
    totalDuration: recording.duration || 0,
    highlightDuration: Math.round(highlightDuration),
    moments,
    generatedAt: new Date().toISOString(),
  }
}

/**
 * Batch process multiple recordings that are in 'processing' status.
 * Useful for overnight or scheduled batch transcription jobs.
 */
export async function batchProcessRecordings(
  orgId: string,
  language: string = 'en'
): Promise<BatchProcessResult> {
  const recordings = await db
    .select()
    .from(schema.interviewRecordings)
    .where(and(
      eq(schema.interviewRecordings.orgId, orgId),
      eq(schema.interviewRecordings.status, 'processing')
    ))
    .orderBy(schema.interviewRecordings.createdAt)

  const results: BatchProcessResult['results'] = []
  let processed = 0
  let failed = 0

  for (const recording of recordings) {
    try {
      await processRecording(orgId, recording.id, language)
      results.push({ recordingId: recording.id, status: 'success' })
      processed++
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown processing error'
      results.push({ recordingId: recording.id, status: 'failed', error: errorMessage })
      failed++

      // Mark recording as failed
      await db
        .update(schema.interviewRecordings)
        .set({ status: 'failed' })
        .where(eq(schema.interviewRecordings.id, recording.id))
    }
  }

  return {
    totalRecordings: recordings.length,
    processed,
    failed,
    results,
  }
}

/**
 * Get comprehensive interview insights for a candidate across all recordings.
 * Aggregates scorecard data, sentiment trends, and generates a hiring recommendation.
 */
export async function getInterviewInsights(
  orgId: string,
  applicationId: string
): Promise<InterviewInsight> {
  // Validate application exists
  const [application] = await db
    .select()
    .from(schema.applications)
    .where(and(eq(schema.applications.id, applicationId), eq(schema.applications.orgId, orgId)))
    .limit(1)

  if (!application) {
    throw new Error(`Application ${applicationId} not found for organization ${orgId}`)
  }

  // Fetch all recordings for this application
  const recordings = await db
    .select()
    .from(schema.interviewRecordings)
    .where(and(
      eq(schema.interviewRecordings.applicationId, applicationId),
      eq(schema.interviewRecordings.orgId, orgId)
    ))
    .orderBy(schema.interviewRecordings.createdAt)

  // Fetch all transcriptions for these recordings
  const recordingIds = recordings.map(r => r.id)
  let transcriptions: Array<typeof schema.interviewTranscriptions.$inferSelect> = []
  if (recordingIds.length > 0) {
    transcriptions = await db
      .select()
      .from(schema.interviewTranscriptions)
      .where(inArray(schema.interviewTranscriptions.recordingId, recordingIds))
  }

  const totalRecordingMinutes = Math.round(
    recordings.reduce((sum, r) => sum + (r.duration || 0), 0) / 60
  )

  // Aggregate scorecards
  const scorecards = transcriptions
    .map(t => t.aiScorecard as AIScorecard | null)
    .filter((s): s is AIScorecard => s !== null)

  let averageScorecard: AIScorecard | null = null
  if (scorecards.length > 0) {
    const avgScore = (dimension: keyof Pick<AIScorecard, 'technicalSkills' | 'communication' | 'problemSolving' | 'cultureFit' | 'leadership'>) => {
      const scores = scorecards.map(s => s[dimension].score)
      return Math.round(mean(scores))
    }

    const avgOverall = Math.round(mean(scorecards.map(s => s.overall)))
    const allStrengths = scorecards.flatMap(s => s.strengths)
    const allConcerns = scorecards.flatMap(s => s.concerns)

    // Count frequency of strengths/concerns
    const strengthFreq = new Map<string, number>()
    for (const s of allStrengths) {
      strengthFreq.set(s, (strengthFreq.get(s) || 0) + 1)
    }
    const concernFreq = new Map<string, number>()
    for (const c of allConcerns) {
      concernFreq.set(c, (concernFreq.get(c) || 0) + 1)
    }

    let recommendation: AIScorecard['recommendation']
    if (avgOverall >= 80) recommendation = 'strong_hire'
    else if (avgOverall >= 65) recommendation = 'hire'
    else if (avgOverall >= 55) recommendation = 'lean_hire'
    else if (avgOverall >= 40) recommendation = 'lean_no_hire'
    else recommendation = 'no_hire'

    averageScorecard = {
      technicalSkills: {
        score: avgScore('technicalSkills'),
        weight: scorecards[0].technicalSkills.weight,
        evidence: [...new Set(scorecards.flatMap(s => s.technicalSkills.evidence))].slice(0, 5),
        notes: `Averaged across ${scorecards.length} interview(s)`,
      },
      communication: {
        score: avgScore('communication'),
        weight: scorecards[0].communication.weight,
        evidence: [...new Set(scorecards.flatMap(s => s.communication.evidence))].slice(0, 5),
        notes: `Averaged across ${scorecards.length} interview(s)`,
      },
      problemSolving: {
        score: avgScore('problemSolving'),
        weight: scorecards[0].problemSolving.weight,
        evidence: [...new Set(scorecards.flatMap(s => s.problemSolving.evidence))].slice(0, 5),
        notes: `Averaged across ${scorecards.length} interview(s)`,
      },
      cultureFit: {
        score: avgScore('cultureFit'),
        weight: scorecards[0].cultureFit.weight,
        evidence: [...new Set(scorecards.flatMap(s => s.cultureFit.evidence))].slice(0, 5),
        notes: `Averaged across ${scorecards.length} interview(s)`,
      },
      leadership: {
        score: avgScore('leadership'),
        weight: scorecards[0].leadership.weight,
        evidence: [...new Set(scorecards.flatMap(s => s.leadership.evidence))].slice(0, 5),
        notes: `Averaged across ${scorecards.length} interview(s)`,
      },
      overall: avgOverall,
      strengths: [...strengthFreq.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([s]) => s),
      concerns: [...concernFreq.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([c]) => c),
      recommendation,
      confidence: Math.round(mean(scorecards.map(s => s.confidence)) * 100) / 100,
      generatedAt: new Date().toISOString(),
    }
  }

  // Build sentiment trend
  const sentimentTrend = transcriptions.map(t => {
    const sentiment = t.sentiment as { overall: number; perSpeaker: Record<string, SpeakerSentiment> } | null
    return {
      interviewDate: t.processedAt?.toISOString() ?? t.createdAt.toISOString(),
      sentiment: sentiment?.overall ?? 0,
    }
  })

  // Build stage progression
  const stageProgression = recordings.map(r => {
    const scorecard = transcriptions.find(t => t.recordingId === r.id)?.aiScorecard as AIScorecard | null
    return {
      stage: r.interviewType,
      date: r.recordedAt?.toISOString() ?? r.createdAt.toISOString(),
      score: scorecard?.overall ?? 0,
    }
  })

  // Top strengths and concerns across all interviews
  const topStrengths = averageScorecard?.strengths ?? []
  const recurringConcerns = averageScorecard?.concerns ?? []

  // Generate hiring recommendation text
  const avgOverall = averageScorecard?.overall ?? 0
  let hiringRecommendation: string
  if (scorecards.length === 0) {
    hiringRecommendation = 'Insufficient interview data to generate a recommendation. Complete at least one interview recording and transcription.'
  } else if (avgOverall >= 80) {
    hiringRecommendation = `Strong hire recommendation. ${application.candidateName} demonstrated exceptional performance across ${scorecards.length} interview(s) with a composite score of ${avgOverall}/100.`
  } else if (avgOverall >= 65) {
    hiringRecommendation = `Hire recommendation. ${application.candidateName} showed solid performance with a composite score of ${avgOverall}/100. Consider a focused follow-up on flagged areas.`
  } else if (avgOverall >= 55) {
    hiringRecommendation = `Borderline candidate. ${application.candidateName} scored ${avgOverall}/100 overall. Additional evaluation recommended before proceeding.`
  } else {
    hiringRecommendation = `Not recommended at this time. ${application.candidateName} scored ${avgOverall}/100 overall with notable concerns in multiple areas.`
  }

  const confidenceLevel = scorecards.length > 0
    ? clamp(Math.round(mean(scorecards.map(s => s.confidence)) * 100), 20, 95)
    : 0

  return {
    applicationId,
    candidateName: application.candidateName,
    totalInterviews: recordings.length,
    totalRecordingMinutes,
    averageScorecard,
    topStrengths,
    recurringConcerns,
    sentimentTrend,
    stageProgression,
    hiringRecommendation,
    confidenceLevel,
  }
}
