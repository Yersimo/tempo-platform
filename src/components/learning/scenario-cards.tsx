'use client'

import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { Badge } from '@/components/ui/badge'
import { Input, Textarea, Select } from '@/components/ui/input'
import { Avatar } from '@/components/ui/avatar'
import { cn } from '@/lib/utils/cn'
import {
  MessageCircle, Users, Target, Star, Clock, Sparkles, Brain, Shield, Award,
  Search, Plus, Play, ChevronRight, CheckCircle, Circle, Send, X,
  RotateCcw, ArrowLeft, Pause, BarChart3, Zap, AlertTriangle,
  ThumbsUp, Lightbulb, TrendingUp, User, Briefcase, Headphones, Crown
} from 'lucide-react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Category = 'Sales' | 'HR' | 'Customer Support' | 'Leadership'
type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced'
type Personality = 'easy-going' | 'pragmatic' | 'challenging' | 'emotional'

interface CompletionCriterion {
  id: string
  label: string
  met: boolean
}

interface AICharacter {
  name: string
  role: string
  personality: Personality
  backstory: string
  avatarInitials?: string
}

interface Scenario {
  id: string
  title: string
  description: string
  category: Category
  difficulty: Difficulty
  estimatedMinutes: number
  completionCount: number
  character: AICharacter
  criteria: CompletionCriterion[]
  createdBy?: string
}

interface ChatMessage {
  id: string
  sender: 'ai' | 'learner'
  text: string
  timestamp: Date
}

interface ScenarioResult {
  score: number
  criteriaResults: CompletionCriterion[]
  strengths: string[]
  improvements: string[]
  suggestedApproach: string
  percentile: number
  timeElapsed: number
}

interface ScenarioCardsProps {
  employees: any[]
  currentEmployeeId: string
  addToast: (msg: string, type?: 'success' | 'error' | 'info') => void
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CATEGORY_CONFIG: Record<Category, { icon: typeof Briefcase; color: string; bg: string; border: string }> = {
  Sales: { icon: TrendingUp, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
  HR: { icon: Users, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  'Customer Support': { icon: Headphones, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  Leadership: { icon: Crown, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
}

const DIFFICULTY_CONFIG: Record<Difficulty, { label: string; color: string }> = {
  Beginner: { label: 'Beginner', color: 'bg-emerald-500/10 text-emerald-400' },
  Intermediate: { label: 'Intermediate', color: 'bg-amber-500/10 text-amber-400' },
  Advanced: { label: 'Advanced', color: 'bg-red-500/10 text-red-400' },
}

const PERSONALITY_LABELS: Record<Personality, string> = {
  'easy-going': 'Easy-going',
  pragmatic: 'Pragmatic',
  challenging: 'Challenging',
  emotional: 'Emotional',
}

// ---------------------------------------------------------------------------
// Seed scenarios
// ---------------------------------------------------------------------------

const SEED_SCENARIOS: Scenario[] = [
  {
    id: 'sc-1',
    title: 'Handling a Salary Negotiation',
    description: 'An experienced employee is requesting a significant salary increase. Navigate the conversation professionally while balancing company budget constraints and employee retention.',
    category: 'HR',
    difficulty: 'Advanced',
    estimatedMinutes: 15,
    completionCount: 342,
    character: {
      name: 'Rachel Torres',
      role: 'Senior Software Engineer (5 years tenure)',
      personality: 'pragmatic',
      backstory: 'Rachel has been a top performer for the past 3 years. She recently received an outside offer 30% above her current salary. She is calm but firm, and has done her market research.',
    },
    criteria: [
      { id: 'c1', label: 'Acknowledge the employee\'s value and contributions', met: false },
      { id: 'c2', label: 'Ask about their motivations beyond just salary', met: false },
      { id: 'c3', label: 'Present a counter-offer or alternative benefits', met: false },
      { id: 'c4', label: 'Maintain a professional and empathetic tone', met: false },
      { id: 'c5', label: 'Reach a mutually agreeable outcome', met: false },
    ],
  },
  {
    id: 'sc-2',
    title: 'Dealing with an Angry Customer',
    description: 'A customer has been transferred multiple times and their issue remains unresolved. De-escalate the situation and find a resolution while maintaining company policies.',
    category: 'Customer Support',
    difficulty: 'Intermediate',
    estimatedMinutes: 10,
    completionCount: 891,
    character: {
      name: 'Marcus Chen',
      role: 'Premium Tier Customer',
      personality: 'emotional',
      backstory: 'Marcus has been a customer for 4 years and pays for the premium plan. His billing was doubled last month and he\'s been on hold for 45 minutes across 3 transfers. He\'s frustrated but will respond to genuine empathy.',
    },
    criteria: [
      { id: 'c1', label: 'Apologize sincerely for the inconvenience', met: false },
      { id: 'c2', label: 'Actively listen and acknowledge frustration', met: false },
      { id: 'c3', label: 'Take ownership of the problem', met: false },
      { id: 'c4', label: 'Provide a clear resolution and timeline', met: false },
      { id: 'c5', label: 'Offer appropriate compensation', met: false },
    ],
  },
  {
    id: 'sc-3',
    title: 'Pitching to a C-Suite Executive',
    description: 'You have 10 minutes to pitch your product to a busy CFO who is skeptical of new tools. Make a compelling case with ROI-focused arguments.',
    category: 'Sales',
    difficulty: 'Advanced',
    estimatedMinutes: 12,
    completionCount: 567,
    character: {
      name: 'Diana Blackwell',
      role: 'CFO, Enterprise Corp (Fortune 500)',
      personality: 'challenging',
      backstory: 'Diana oversees a $2B budget and has seen hundreds of pitches. She is direct, numbers-driven, and dismissive of fluffy marketing language. She respects people who are concise and data-backed.',
    },
    criteria: [
      { id: 'c1', label: 'Open with a compelling ROI statement', met: false },
      { id: 'c2', label: 'Address a specific business pain point', met: false },
      { id: 'c3', label: 'Provide concrete numbers or case studies', met: false },
      { id: 'c4', label: 'Handle objections gracefully', met: false },
      { id: 'c5', label: 'Close with a clear next step', met: false },
    ],
  },
  {
    id: 'sc-4',
    title: 'Delivering Negative Feedback',
    description: 'An underperforming team member needs constructive feedback. Balance honesty with empathy while creating a clear improvement plan.',
    category: 'Leadership',
    difficulty: 'Intermediate',
    estimatedMinutes: 12,
    completionCount: 723,
    character: {
      name: 'James Park',
      role: 'Junior Marketing Analyst (8 months)',
      personality: 'emotional',
      backstory: 'James joined with high enthusiasm but has missed deadlines on 3 recent projects. He tends to take criticism personally and may become defensive. He is eager to improve if given specific, actionable guidance.',
    },
    criteria: [
      { id: 'c1', label: 'Start with something positive and genuine', met: false },
      { id: 'c2', label: 'Be specific about performance issues', met: false },
      { id: 'c3', label: 'Use "I" statements rather than accusations', met: false },
      { id: 'c4', label: 'Collaborate on an improvement plan', met: false },
      { id: 'c5', label: 'End the conversation on an encouraging note', met: false },
    ],
  },
  {
    id: 'sc-5',
    title: 'Onboarding a New Team Member',
    description: 'Welcome and orient a new hire who is joining remotely. Make them feel included, set expectations, and ensure they have everything they need to succeed.',
    category: 'HR',
    difficulty: 'Beginner',
    estimatedMinutes: 8,
    completionCount: 1205,
    character: {
      name: 'Sofia Andersson',
      role: 'New Hire, Product Designer',
      personality: 'easy-going',
      backstory: 'Sofia is joining from a small startup and this is her first enterprise role. She\'s excited but slightly overwhelmed by the scale of the organisation. She has lots of questions but doesn\'t want to seem clueless.',
    },
    criteria: [
      { id: 'c1', label: 'Provide a warm personal welcome', met: false },
      { id: 'c2', label: 'Explain team structure and key contacts', met: false },
      { id: 'c3', label: 'Set clear expectations for the first week', met: false },
      { id: 'c4', label: 'Encourage questions and open communication', met: false },
      { id: 'c5', label: 'Schedule follow-up check-ins', met: false },
    ],
  },
  {
    id: 'sc-6',
    title: 'Resolving a Team Conflict',
    description: 'Two team members have an escalating disagreement about project direction. Mediate the conflict and guide them towards a collaborative resolution.',
    category: 'Leadership',
    difficulty: 'Advanced',
    estimatedMinutes: 15,
    completionCount: 456,
    character: {
      name: 'Priya Sharma',
      role: 'Senior Backend Engineer (conflict initiator)',
      personality: 'challenging',
      backstory: 'Priya strongly believes the team should rebuild the legacy system from scratch. Her colleague Alex wants to incrementally refactor. Priya feels Alex is being short-sighted and has made pointed comments in team meetings. She respects data-driven decisions.',
    },
    criteria: [
      { id: 'c1', label: 'Listen to both sides without taking sides', met: false },
      { id: 'c2', label: 'Identify the root cause of the conflict', met: false },
      { id: 'c3', label: 'Reframe the disagreement as shared goals', met: false },
      { id: 'c4', label: 'Propose a concrete path forward', met: false },
      { id: 'c5', label: 'Establish agreements for future collaboration', met: false },
    ],
  },
]

// ---------------------------------------------------------------------------
// Simulated AI response engine
// ---------------------------------------------------------------------------

function generateAIOpener(scenario: Scenario): string {
  const openers: Record<string, string> = {
    'sc-1': "Hi, thanks for making time to meet with me. I know you're busy, so I'll get right to the point. I've been with the company for five years now, and I love the work I do here. But I recently received an offer from another company, and it's made me reconsider my compensation. I'd like to discuss my salary.",
    'sc-2': "Finally! Someone picked up. Look, I've been on hold for 45 minutes and I've been transferred THREE times already. My bill was doubled last month and nobody seems to be able to help me. I'm paying for premium support and this is what I get? This is absolutely unacceptable.",
    'sc-3': "You have ten minutes. My assistant said this was about operational efficiency. I see about five of these pitches a week, so please\u2014skip the slides about your company history and tell me what problem you solve and what it costs.",
    'sc-4': "Hey, you wanted to chat? I just finished that report you asked for\u2014I know it was a day late but I've been juggling a lot. What's up?",
    'sc-5': "Hi! I'm so excited to be starting today. Everything is a bit overwhelming\u2014the onboarding portal had like twenty tabs open and I'm not sure which ones are actually important. Where should I begin?",
    'sc-6': "Look, I appreciate you stepping in, but I've already explained my position to Alex multiple times. We're wasting months patching a system that should have been replaced two years ago. I have the benchmarks to prove it. If we keep going Alex's way, we'll be back here in six months having the same conversation.",
  }
  return openers[scenario.id] || `Hello, I'm ${scenario.character.name}. ${scenario.description}`
}

function generateAIResponse(scenario: Scenario, messages: ChatMessage[], lastUserMessage: string): { text: string; newCriteriaMet: string[] } {
  const msgCount = messages.filter(m => m.sender === 'learner').length
  const lower = lastUserMessage.toLowerCase()
  const newCriteriaMet: string[] = []
  const criteria = scenario.criteria

  // Simple keyword-based response simulation
  const hasEmpathy = /understand|sorry|appreciate|hear you|feel|empathy|acknowledge/i.test(lower)
  const hasQuestion = /\?|what|how|why|tell me|could you|would you/i.test(lower)
  const hasSpecific = /specific|example|instance|data|numbers|percent|roi|metric/i.test(lower)
  const hasPositive = /great|good|excellent|well done|strong|impressive|value/i.test(lower)
  const hasSolution = /suggest|propose|option|alternative|plan|approach|solution|offer/i.test(lower)
  const hasClosing = /next step|follow up|schedule|meet again|circle back|check in/i.test(lower)

  // Mark criteria as met based on keywords
  if (hasEmpathy && criteria[0] && !criteria[0].met) newCriteriaMet.push(criteria[0].id)
  if (hasQuestion && criteria[1] && !criteria[1].met) newCriteriaMet.push(criteria[1].id)
  if (hasSolution && criteria[2] && !criteria[2].met) newCriteriaMet.push(criteria[2].id)
  if (hasPositive && criteria[3] && !criteria[3].met) newCriteriaMet.push(criteria[3].id)
  if (hasClosing && criteria[4] && !criteria[4].met) newCriteriaMet.push(criteria[4].id)

  // Generate contextual response based on scenario personality and message count
  const personality = scenario.character.personality
  let response: string

  if (msgCount <= 1) {
    if (hasEmpathy) {
      response = personality === 'emotional'
        ? "Thank you... I appreciate you saying that. It means a lot that someone is actually listening. So, here's the situation..."
        : personality === 'challenging'
        ? "I appreciate the sentiment, but let's focus on the substance. What specifically can you do about this?"
        : "That's good to hear. I'm glad we're on the same page. Let me explain a bit more about where I'm coming from..."
    } else if (hasQuestion) {
      response = personality === 'challenging'
        ? "Fair question. Let me give you the short version since we're both busy..."
        : "Good question. I think the main thing is..."
    } else {
      response = "I see. Can you tell me a bit more about what you're thinking?"
    }
  } else if (msgCount <= 3) {
    if (hasSolution) {
      response = personality === 'pragmatic'
        ? "Okay, that's interesting. I'd want to see the specifics\u2014what does that actually look like in practice? Can you walk me through the details?"
        : personality === 'emotional'
        ? "That... actually sounds reasonable. I hadn't thought about it that way. Would that really work though?"
        : personality === 'challenging'
        ? "I've heard similar proposals before. What makes yours different? Give me something concrete."
        : "I like where this is going. Let's dig into the details a bit more."
    } else if (hasSpecific) {
      response = personality === 'challenging'
        ? "Those are decent numbers, but I need to see how they apply to our specific situation. What's the implementation timeline?"
        : "That's really helpful context. It helps me understand the full picture better."
    } else {
      response = "I hear you. But I want to make sure we're addressing the core issue here, not just the symptoms."
    }
  } else {
    if (hasClosing) {
      response = personality === 'pragmatic'
        ? "That sounds like a solid plan. Let's put a timeline on it and reconvene next week. I feel good about this direction."
        : personality === 'emotional'
        ? "I really appreciate how you've handled this conversation. I feel much better about things. Yes, let's definitely check in again soon."
        : personality === 'challenging'
        ? "Alright, you've made your case. I'm cautiously optimistic. Let's see how the first milestone goes before I commit fully."
        : "Sounds like a plan. I'm looking forward to making this work together."
    } else if (hasSolution) {
      response = "That's a thoughtful approach. I think we can work with that. What would the first step look like?"
    } else {
      response = "We've covered a lot of ground. I think we need to start thinking about next steps and how we move forward from here."
    }
  }

  return { text: response, newCriteriaMet }
}

function generateFeedback(scenario: Scenario, criteriaResults: CompletionCriterion[], messages: ChatMessage[], timeElapsed: number): ScenarioResult {
  const metCount = criteriaResults.filter(c => c.met).length
  const total = criteriaResults.length
  const score = Math.min(5, Math.max(1, Math.round((metCount / total) * 5)))
  const learnerMessages = messages.filter(m => m.sender === 'learner')
  const avgLength = learnerMessages.reduce((a, m) => a + m.text.length, 0) / Math.max(1, learnerMessages.length)

  const strengths: string[] = []
  const improvements: string[] = []

  if (metCount >= 3) strengths.push('Strong coverage of key conversation objectives')
  if (avgLength > 80) strengths.push('Detailed and thoughtful responses')
  if (learnerMessages.some(m => /\?/.test(m.text))) strengths.push('Good use of open-ended questions to understand the situation')
  if (learnerMessages.some(m => /understand|hear|acknowledge|appreciate/i.test(m.text))) strengths.push('Demonstrated active listening and empathy')

  const unmet = criteriaResults.filter(c => !c.met)
  unmet.forEach(c => improvements.push(`Try to address: "${c.label}"`))
  if (avgLength < 40) improvements.push('Consider providing more detailed and thoughtful responses')
  if (learnerMessages.length < 3) improvements.push('Engage more deeply in the conversation before wrapping up')

  if (strengths.length === 0) strengths.push('Willingness to engage with challenging scenarios')
  if (improvements.length === 0) improvements.push('Continue refining your approach for even better outcomes')

  const suggestedApproach = metCount >= 4
    ? 'Excellent work! You demonstrated mastery of this scenario. To push further, try the same scenario with a more challenging AI personality setting.'
    : metCount >= 2
    ? `Focus on the unmet criteria in your next attempt. Start by ${unmet[0]?.label.toLowerCase() || 'addressing remaining objectives'}. Consider using more empathetic language and asking clarifying questions before proposing solutions.`
    : 'Take a step back and focus on active listening first. Before jumping to solutions, make sure you fully understand the other person\'s perspective. Start with open-ended questions and acknowledge their feelings.'

  return {
    score,
    criteriaResults,
    strengths,
    improvements,
    suggestedApproach,
    percentile: Math.min(99, Math.max(15, Math.round((metCount / total) * 80 + Math.random() * 15))),
    timeElapsed,
  }
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StarRating({ rating, size = 16 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          size={size}
          className={cn(
            'transition-colors',
            i <= rating ? 'text-amber-400 fill-amber-400' : 'text-zinc-700'
          )}
        />
      ))}
    </div>
  )
}

function CategoryBadge({ category }: { category: Category }) {
  const config = CATEGORY_CONFIG[category]
  const Icon = config.icon
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[0.65rem] font-medium border', config.bg, config.color, config.border)}>
      <Icon size={11} />
      {category}
    </span>
  )
}

function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  const config = DIFFICULTY_CONFIG[difficulty]
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[0.6rem] font-medium', config.color)}>
      {config.label}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function ScenarioCards({ employees, currentEmployeeId, addToast }: ScenarioCardsProps) {
  // State
  const [scenarios, setScenarios] = useState<Scenario[]>(SEED_SCENARIOS)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState<Category | 'All'>('All')
  const [view, setView] = useState<'library' | 'active' | 'feedback' | 'builder'>('library')

  // Builder state
  const [builderData, setBuilderData] = useState({
    title: '',
    description: '',
    category: 'HR' as Category,
    difficulty: 'Intermediate' as Difficulty,
    estimatedMinutes: 10,
    characterName: '',
    characterRole: '',
    characterPersonality: 'pragmatic' as Personality,
    characterBackstory: '',
    criteria: ['', '', ''],
  })

  // Active scenario state
  const [activeScenario, setActiveScenario] = useState<Scenario | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [activeCriteria, setActiveCriteria] = useState<CompletionCriterion[]>([])
  const [startTime, setStartTime] = useState<Date | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Feedback state
  const [result, setResult] = useState<ScenarioResult | null>(null)

  // Timer
  useEffect(() => {
    if (view !== 'active' || !startTime) return
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime.getTime()) / 1000))
    }, 1000)
    return () => clearInterval(interval)
  }, [view, startTime])

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  // Focus input
  useEffect(() => {
    if (view === 'active') inputRef.current?.focus()
  }, [view, isTyping])

  // Filtered scenarios
  const filteredScenarios = useMemo(() => {
    return scenarios.filter(s => {
      if (filterCategory !== 'All' && s.category !== filterCategory) return false
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        return s.title.toLowerCase().includes(q) || s.description.toLowerCase().includes(q) || s.category.toLowerCase().includes(q)
      }
      return true
    })
  }, [scenarios, searchQuery, filterCategory])

  // Start scenario
  const startScenario = useCallback((scenario: Scenario) => {
    const freshCriteria = scenario.criteria.map(c => ({ ...c, met: false }))
    setActiveScenario(scenario)
    setActiveCriteria(freshCriteria)
    setStartTime(new Date())
    setElapsed(0)
    setInputValue('')

    const opener: ChatMessage = {
      id: 'msg-opener',
      sender: 'ai',
      text: generateAIOpener(scenario),
      timestamp: new Date(),
    }
    setMessages([opener])
    setView('active')
  }, [])

  // Send message
  const sendMessage = useCallback(() => {
    if (!inputValue.trim() || !activeScenario || isTyping) return

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'learner',
      text: inputValue.trim(),
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, userMsg])
    setInputValue('')
    setIsTyping(true)

    // Simulate AI typing delay
    setTimeout(() => {
      const { text, newCriteriaMet } = generateAIResponse(activeScenario, [...messages, userMsg], userMsg.text)

      setActiveCriteria(prev => prev.map(c =>
        newCriteriaMet.includes(c.id) ? { ...c, met: true } : c
      ))

      const aiMsg: ChatMessage = {
        id: `msg-ai-${Date.now()}`,
        sender: 'ai',
        text,
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, aiMsg])
      setIsTyping(false)
    }, 1200 + Math.random() * 800)
  }, [inputValue, activeScenario, isTyping, messages])

  // End scenario
  const endScenario = useCallback(() => {
    if (!activeScenario) return
    const feedback = generateFeedback(activeScenario, activeCriteria, messages, elapsed)
    setResult(feedback)

    // Update completion count
    setScenarios(prev => prev.map(s =>
      s.id === activeScenario.id ? { ...s, completionCount: s.completionCount + 1 } : s
    ))

    setView('feedback')
    addToast('Scenario completed! Review your feedback.', 'success')
  }, [activeScenario, activeCriteria, messages, elapsed, addToast])

  // Save builder
  const saveScenario = useCallback(() => {
    const { title, description, category, difficulty, estimatedMinutes, characterName, characterRole, characterPersonality, characterBackstory, criteria } = builderData
    if (!title || !characterName || !criteria.filter(Boolean).length) {
      addToast('Please fill in all required fields', 'error')
      return
    }

    const newScenario: Scenario = {
      id: `sc-custom-${Date.now()}`,
      title,
      description,
      category,
      difficulty,
      estimatedMinutes,
      completionCount: 0,
      character: {
        name: characterName,
        role: characterRole,
        personality: characterPersonality,
        backstory: characterBackstory,
      },
      criteria: criteria.filter(Boolean).map((label, i) => ({
        id: `cc-${i}`,
        label,
        met: false,
      })),
      createdBy: currentEmployeeId,
    }

    setScenarios(prev => [newScenario, ...prev])
    setView('library')
    setBuilderData({
      title: '', description: '', category: 'HR', difficulty: 'Intermediate', estimatedMinutes: 10,
      characterName: '', characterRole: '', characterPersonality: 'pragmatic', characterBackstory: '',
      criteria: ['', '', ''],
    })
    addToast('Scenario created successfully', 'success')
  }, [builderData, currentEmployeeId, addToast])

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  // =========================================================================
  // RENDER: Library
  // =========================================================================
  if (view === 'library') {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-t1 flex items-center gap-2">
              <Brain size={20} className="text-tempo-600" />
              AI Scenario Practice
            </h2>
            <p className="text-xs text-t3 mt-1">Practice real-world conversations with AI-powered role-play simulations</p>
          </div>
          <Button size="sm" onClick={() => setView('builder')}>
            <Plus size={14} />
            Create Scenario
          </Button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-t3" />
            <input
              type="text"
              placeholder="Search scenarios..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-divider rounded-[var(--radius-input)] text-t1 placeholder:text-t3 focus:outline-none focus:ring-2 focus:ring-tempo-600/20 focus:border-tempo-600"
            />
          </div>
          <div className="flex items-center gap-1.5">
            {(['All', 'Sales', 'HR', 'Customer Support', 'Leadership'] as const).map(cat => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={cn(
                  'px-3 py-1.5 text-xs rounded-full font-medium transition-colors',
                  filterCategory === cat
                    ? 'bg-tempo-600 text-white'
                    : 'bg-canvas text-t3 hover:text-t1 hover:bg-gray-200'
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Total Scenarios', value: scenarios.length, icon: Brain, color: 'text-tempo-600' },
            { label: 'Categories', value: 4, icon: Target, color: 'text-blue-500' },
            { label: 'Total Completions', value: scenarios.reduce((a, s) => a + s.completionCount, 0).toLocaleString(), icon: Award, color: 'text-emerald-500' },
            { label: 'Avg Duration', value: `${Math.round(scenarios.reduce((a, s) => a + s.estimatedMinutes, 0) / scenarios.length)} min`, icon: Clock, color: 'text-amber-500' },
          ].map(stat => (
            <Card key={stat.label} padding="sm">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-canvas">
                  <stat.icon size={16} className={stat.color} />
                </div>
                <div>
                  <p className="text-lg font-semibold text-t1">{stat.value}</p>
                  <p className="text-[0.65rem] text-t3">{stat.label}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredScenarios.map(scenario => {
            const catConfig = CATEGORY_CONFIG[scenario.category]
            return (
              <Card
                key={scenario.id}
                padding="none"
                className="group hover:border-tempo-600/30 transition-all cursor-pointer overflow-hidden"
                onClick={() => startScenario(scenario)}
              >
                {/* Color bar */}
                <div className={cn('h-1', catConfig.bg.replace('/10', '/40'))} />

                <div className="p-5 space-y-4">
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <CategoryBadge category={scenario.category} />
                        <DifficultyBadge difficulty={scenario.difficulty} />
                      </div>
                      <h3 className="text-sm font-semibold text-t1 group-hover:text-tempo-600 transition-colors">
                        {scenario.title}
                      </h3>
                    </div>
                    <div className="p-2 rounded-lg bg-tempo-50 text-tempo-600 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <Play size={14} />
                    </div>
                  </div>

                  <p className="text-xs text-t3 leading-relaxed line-clamp-2">{scenario.description}</p>

                  {/* Character */}
                  <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-canvas border border-divider">
                    <Avatar name={scenario.character.name} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-t1 truncate">{scenario.character.name}</p>
                      <p className="text-[0.6rem] text-t3 truncate">{scenario.character.role}</p>
                    </div>
                    <Badge variant="ai" className="shrink-0 text-[0.55rem]">
                      {PERSONALITY_LABELS[scenario.character.personality]}
                    </Badge>
                  </div>

                  {/* Meta */}
                  <div className="flex items-center justify-between text-[0.65rem] text-t3 pt-1 border-t border-divider">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Clock size={11} />
                        {scenario.estimatedMinutes} min
                      </span>
                      <span className="flex items-center gap-1">
                        <Target size={11} />
                        {scenario.criteria.length} objectives
                      </span>
                    </div>
                    <span className="flex items-center gap-1">
                      <Users size={11} />
                      {scenario.completionCount.toLocaleString()} completed
                    </span>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>

        {filteredScenarios.length === 0 && (
          <div className="text-center py-16">
            <Brain size={40} className="mx-auto text-t3 mb-3 opacity-40" />
            <p className="text-sm text-t3">No scenarios match your search</p>
          </div>
        )}
      </div>
    )
  }

  // =========================================================================
  // RENDER: Builder
  // =========================================================================
  if (view === 'builder') {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={() => setView('library')} className="p-2 rounded-lg hover:bg-canvas text-t3 hover:text-t1 transition-colors">
            <ArrowLeft size={16} />
          </button>
          <div>
            <h2 className="text-lg font-semibold text-t1 flex items-center gap-2">
              <Sparkles size={18} className="text-tempo-600" />
              Create Scenario
            </h2>
            <p className="text-xs text-t3 mt-0.5">Build a custom AI role-play scenario for your team</p>
          </div>
        </div>

        <Card>
          <div className="space-y-5">
            <h3 className="text-xs font-semibold text-t1 uppercase tracking-wider">Scenario Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Title"
                id="sc-title"
                placeholder="e.g. Handling a client complaint"
                value={builderData.title}
                onChange={e => setBuilderData(d => ({ ...d, title: e.target.value }))}
              />
              <Select
                label="Category"
                id="sc-category"
                value={builderData.category}
                onChange={e => setBuilderData(d => ({ ...d, category: e.target.value as Category }))}
                options={[
                  { value: 'Sales', label: 'Sales' },
                  { value: 'HR', label: 'HR' },
                  { value: 'Customer Support', label: 'Customer Support' },
                  { value: 'Leadership', label: 'Leadership' },
                ]}
              />
            </div>
            <Textarea
              label="Description"
              id="sc-desc"
              placeholder="Describe the scenario context and what the learner will practice..."
              rows={3}
              value={builderData.description}
              onChange={e => setBuilderData(d => ({ ...d, description: e.target.value }))}
            />
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Difficulty"
                id="sc-diff"
                value={builderData.difficulty}
                onChange={e => setBuilderData(d => ({ ...d, difficulty: e.target.value as Difficulty }))}
                options={[
                  { value: 'Beginner', label: 'Beginner' },
                  { value: 'Intermediate', label: 'Intermediate' },
                  { value: 'Advanced', label: 'Advanced' },
                ]}
              />
              <Input
                label="Estimated Duration (minutes)"
                id="sc-duration"
                type="number"
                min={1}
                max={60}
                value={builderData.estimatedMinutes}
                onChange={e => setBuilderData(d => ({ ...d, estimatedMinutes: parseInt(e.target.value) || 10 }))}
              />
            </div>
          </div>
        </Card>

        <Card>
          <div className="space-y-5">
            <h3 className="text-xs font-semibold text-t1 uppercase tracking-wider flex items-center gap-2">
              <User size={14} className="text-tempo-600" />
              AI Character
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Character Name"
                id="sc-char-name"
                placeholder="e.g. Sarah Mitchell"
                value={builderData.characterName}
                onChange={e => setBuilderData(d => ({ ...d, characterName: e.target.value }))}
              />
              <Input
                label="Role / Title"
                id="sc-char-role"
                placeholder="e.g. VP of Marketing"
                value={builderData.characterRole}
                onChange={e => setBuilderData(d => ({ ...d, characterRole: e.target.value }))}
              />
            </div>
            <Select
              label="Personality"
              id="sc-char-personality"
              value={builderData.characterPersonality}
              onChange={e => setBuilderData(d => ({ ...d, characterPersonality: e.target.value as Personality }))}
              options={[
                { value: 'easy-going', label: 'Easy-going \u2014 Friendly and open to dialogue' },
                { value: 'pragmatic', label: 'Pragmatic \u2014 Focused on facts and outcomes' },
                { value: 'challenging', label: 'Challenging \u2014 Pushes back and asks tough questions' },
                { value: 'emotional', label: 'Emotional \u2014 Reactive and needs empathetic handling' },
              ]}
            />
            <Textarea
              label="Character Backstory / Context"
              id="sc-char-backstory"
              placeholder="Provide context for how the AI character should behave..."
              rows={3}
              value={builderData.characterBackstory}
              onChange={e => setBuilderData(d => ({ ...d, characterBackstory: e.target.value }))}
            />
          </div>
        </Card>

        <Card>
          <div className="space-y-5">
            <h3 className="text-xs font-semibold text-t1 uppercase tracking-wider flex items-center gap-2">
              <CheckCircle size={14} className="text-emerald-500" />
              Completion Criteria
            </h3>
            <p className="text-xs text-t3">Define what the learner should accomplish during the scenario</p>
            {builderData.criteria.map((criterion, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-xs text-t3 w-5 shrink-0">{i + 1}.</span>
                <input
                  type="text"
                  placeholder={`Objective ${i + 1}`}
                  value={criterion}
                  onChange={e => {
                    const next = [...builderData.criteria]
                    next[i] = e.target.value
                    setBuilderData(d => ({ ...d, criteria: next }))
                  }}
                  className="flex-1 px-3 py-2 text-sm bg-white border border-divider rounded-[var(--radius-input)] text-t1 placeholder:text-t3 focus:outline-none focus:ring-2 focus:ring-tempo-600/20 focus:border-tempo-600"
                />
                {builderData.criteria.length > 1 && (
                  <button
                    onClick={() => {
                      const next = builderData.criteria.filter((_, j) => j !== i)
                      setBuilderData(d => ({ ...d, criteria: next }))
                    }}
                    className="p-1 text-t3 hover:text-error transition-colors"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            ))}
            {builderData.criteria.length < 8 && (
              <button
                onClick={() => setBuilderData(d => ({ ...d, criteria: [...d.criteria, ''] }))}
                className="text-xs text-tempo-600 hover:text-tempo-700 font-medium flex items-center gap-1"
              >
                <Plus size={12} /> Add criterion
              </button>
            )}
          </div>
        </Card>

        <div className="flex items-center justify-end gap-3">
          <Button variant="secondary" onClick={() => setView('library')}>Cancel</Button>
          <Button onClick={saveScenario}>
            <Sparkles size={14} />
            Create Scenario
          </Button>
        </div>
      </div>
    )
  }

  // =========================================================================
  // RENDER: Active Scenario
  // =========================================================================
  if (view === 'active' && activeScenario) {
    const metCount = activeCriteria.filter(c => c.met).length
    const totalCriteria = activeCriteria.length

    return (
      <div className="flex gap-0 h-[calc(100vh-180px)] min-h-[500px]">
        {/* Chat area */}
        <div className="flex-1 flex flex-col bg-card border border-border rounded-l-[var(--radius-card)] overflow-hidden">
          {/* Chat header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-divider bg-card">
            <div className="flex items-center gap-3">
              <button
                onClick={() => { setView('library'); setMessages([]) }}
                className="p-1.5 rounded-lg hover:bg-canvas text-t3 hover:text-t1 transition-colors"
              >
                <ArrowLeft size={15} />
              </button>
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <Avatar name={activeScenario.character.name} size="sm" />
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-card" />
                </div>
                <div>
                  <p className="text-sm font-medium text-t1">{activeScenario.character.name}</p>
                  <p className="text-[0.6rem] text-t3">{activeScenario.character.role}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="ai" className="text-[0.6rem]">
                <Sparkles size={10} className="mr-1" />
                AI Role-Play
              </Badge>
              <span className="text-xs text-t3 font-mono">{formatTime(elapsed)}</span>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 bg-canvas/50">
            {/* Scenario intro card */}
            <div className="mx-auto max-w-md p-4 rounded-xl bg-tempo-50/50 border border-tempo-200/30 text-center space-y-2">
              <div className="flex items-center justify-center gap-2 text-tempo-600">
                <Brain size={16} />
                <span className="text-xs font-semibold uppercase tracking-wider">Scenario Started</span>
              </div>
              <p className="text-xs text-t2">{activeScenario.title}</p>
              <p className="text-[0.6rem] text-t3">{activeScenario.description}</p>
            </div>

            {messages.map(msg => (
              <div
                key={msg.id}
                className={cn('flex gap-2.5 max-w-[80%]', msg.sender === 'learner' ? 'ml-auto flex-row-reverse' : '')}
              >
                {msg.sender === 'ai' && (
                  <Avatar name={activeScenario.character.name} size="sm" className="shrink-0 mt-1" />
                )}
                <div
                  className={cn(
                    'rounded-2xl px-4 py-3 text-sm leading-relaxed',
                    msg.sender === 'ai'
                      ? 'bg-card border border-border text-t1 rounded-tl-md'
                      : 'bg-tempo-600 text-white rounded-tr-md'
                  )}
                >
                  {msg.text}
                </div>
                {msg.sender === 'learner' && (
                  <div className="w-8 shrink-0" />
                )}
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-2.5 max-w-[80%]">
                <Avatar name={activeScenario.character.name} size="sm" className="shrink-0 mt-1" />
                <div className="bg-card border border-border rounded-2xl rounded-tl-md px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-t3 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 rounded-full bg-t3 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 rounded-full bg-t3 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div className="px-5 py-3 border-t border-divider bg-card">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                placeholder="Type your response..."
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                disabled={isTyping}
                className="flex-1 px-4 py-2.5 text-sm bg-canvas border border-divider rounded-full text-t1 placeholder:text-t3 focus:outline-none focus:ring-2 focus:ring-tempo-600/20 focus:border-tempo-600 disabled:opacity-50"
              />
              <button
                onClick={sendMessage}
                disabled={!inputValue.trim() || isTyping}
                className="p-2.5 rounded-full bg-tempo-600 text-white hover:bg-tempo-700 transition-colors disabled:opacity-40 disabled:hover:bg-tempo-600"
              >
                <Send size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* Context panel */}
        <div className="w-72 border border-l-0 border-border rounded-r-[var(--radius-card)] bg-card overflow-y-auto">
          <div className="p-4 space-y-5">
            {/* Objective */}
            <div className="space-y-2">
              <h3 className="text-[0.65rem] font-semibold text-t3 uppercase tracking-wider flex items-center gap-1.5">
                <Target size={12} className="text-tempo-600" />
                Objective
              </h3>
              <p className="text-xs text-t2 leading-relaxed">{activeScenario.title}</p>
            </div>

            {/* Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-[0.65rem] font-semibold text-t3 uppercase tracking-wider">Progress</h3>
                <span className="text-xs font-semibold text-tempo-600">{metCount}/{totalCriteria}</span>
              </div>
              <div className="h-1.5 bg-canvas rounded-full overflow-hidden">
                <div
                  className="h-full bg-tempo-600 rounded-full transition-all duration-500"
                  style={{ width: `${(metCount / totalCriteria) * 100}%` }}
                />
              </div>
            </div>

            {/* Criteria */}
            <div className="space-y-2">
              <h3 className="text-[0.65rem] font-semibold text-t3 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle size={12} className="text-emerald-500" />
                Completion Criteria
              </h3>
              <div className="space-y-2">
                {activeCriteria.map(criterion => (
                  <div
                    key={criterion.id}
                    className={cn(
                      'flex items-start gap-2 p-2 rounded-lg text-xs transition-all duration-300',
                      criterion.met ? 'bg-emerald-50 border border-emerald-200/50' : 'bg-canvas'
                    )}
                  >
                    {criterion.met ? (
                      <CheckCircle size={13} className="text-emerald-500 mt-0.5 shrink-0" />
                    ) : (
                      <Circle size={13} className="text-t3 mt-0.5 shrink-0" />
                    )}
                    <span className={cn('leading-relaxed', criterion.met ? 'text-emerald-700' : 'text-t2')}>
                      {criterion.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Character info */}
            <div className="space-y-2">
              <h3 className="text-[0.65rem] font-semibold text-t3 uppercase tracking-wider flex items-center gap-1.5">
                <User size={12} />
                Character
              </h3>
              <div className="p-3 rounded-lg bg-canvas border border-divider space-y-2">
                <div className="flex items-center gap-2">
                  <Avatar name={activeScenario.character.name} size="xs" />
                  <div>
                    <p className="text-xs font-medium text-t1">{activeScenario.character.name}</p>
                    <p className="text-[0.6rem] text-t3">{activeScenario.character.role}</p>
                  </div>
                </div>
                <Badge variant="ai" className="text-[0.55rem]">
                  {PERSONALITY_LABELS[activeScenario.character.personality]}
                </Badge>
              </div>
            </div>

            {/* Timer */}
            <div className="space-y-2">
              <h3 className="text-[0.65rem] font-semibold text-t3 uppercase tracking-wider flex items-center gap-1.5">
                <Clock size={12} />
                Time Elapsed
              </h3>
              <p className="text-2xl font-mono font-semibold text-t1">{formatTime(elapsed)}</p>
              <p className="text-[0.6rem] text-t3">Est. {activeScenario.estimatedMinutes} min</p>
            </div>

            {/* End button */}
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={endScenario}
            >
              <Pause size={13} />
              End Scenario
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // =========================================================================
  // RENDER: Feedback
  // =========================================================================
  if (view === 'feedback' && result && activeScenario) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-tempo-50 border border-tempo-200/50">
            <Award size={28} className="text-tempo-600" />
          </div>
          <h2 className="text-xl font-bold text-t1">Scenario Complete</h2>
          <p className="text-sm text-t3">{activeScenario.title}</p>
        </div>

        {/* Score card */}
        <Card className="text-center">
          <div className="space-y-3">
            <p className="text-xs text-t3 uppercase tracking-wider font-semibold">Overall Score</p>
            <StarRating rating={result.score} size={28} />
            <p className="text-3xl font-bold text-t1">{result.score}/5</p>
            <div className="flex items-center justify-center gap-4 text-xs text-t3">
              <span className="flex items-center gap-1">
                <Clock size={12} />
                {formatTime(result.timeElapsed)}
              </span>
              <span className="flex items-center gap-1">
                <Target size={12} />
                {result.criteriaResults.filter(c => c.met).length}/{result.criteriaResults.length} objectives
              </span>
              <span className="flex items-center gap-1">
                <BarChart3 size={12} />
                Top {100 - result.percentile}%
              </span>
            </div>
          </div>
        </Card>

        {/* Criteria breakdown */}
        <Card>
          <h3 className="text-xs font-semibold text-t1 uppercase tracking-wider mb-4 flex items-center gap-2">
            <CheckCircle size={14} className="text-emerald-500" />
            Objectives Breakdown
          </h3>
          <div className="space-y-2">
            {result.criteriaResults.map(c => (
              <div
                key={c.id}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-lg text-sm',
                  c.met ? 'bg-emerald-50 border border-emerald-200/50' : 'bg-red-50/50 border border-red-200/30'
                )}
              >
                {c.met ? (
                  <CheckCircle size={16} className="text-emerald-500 shrink-0" />
                ) : (
                  <X size={16} className="text-red-400 shrink-0" />
                )}
                <span className={c.met ? 'text-emerald-800' : 'text-red-700'}>{c.label}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* AI Feedback */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <h3 className="text-xs font-semibold text-t1 uppercase tracking-wider mb-3 flex items-center gap-2">
              <ThumbsUp size={14} className="text-emerald-500" />
              Strengths
            </h3>
            <ul className="space-y-2">
              {result.strengths.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-t2">
                  <Zap size={12} className="text-emerald-500 mt-0.5 shrink-0" />
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <h3 className="text-xs font-semibold text-t1 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Lightbulb size={14} className="text-amber-500" />
              Areas for Improvement
            </h3>
            <ul className="space-y-2">
              {result.improvements.map((imp, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-t2">
                  <AlertTriangle size={12} className="text-amber-500 mt-0.5 shrink-0" />
                  <span>{imp}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        {/* Suggested approach */}
        <Card className="bg-tempo-50/30 border-tempo-200/30">
          <h3 className="text-xs font-semibold text-t1 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Brain size={14} className="text-tempo-600" />
            Suggested Approach
          </h3>
          <p className="text-sm text-t2 leading-relaxed">{result.suggestedApproach}</p>
        </Card>

        {/* Peer comparison */}
        <Card>
          <h3 className="text-xs font-semibold text-t1 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Users size={14} className="text-blue-500" />
            Performance vs Peers
          </h3>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="h-3 bg-canvas rounded-full overflow-hidden relative">
                <div
                  className="h-full bg-gradient-to-r from-red-400 via-amber-400 via-emerald-400 to-blue-400 rounded-full opacity-30"
                  style={{ width: '100%' }}
                />
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-tempo-600 border-2 border-white shadow-md transition-all"
                  style={{ left: `calc(${result.percentile}% - 8px)` }}
                />
              </div>
              <div className="flex justify-between mt-1.5">
                <span className="text-[0.55rem] text-t3">0th percentile</span>
                <span className="text-[0.55rem] text-t3">100th percentile</span>
              </div>
            </div>
            <div className="text-center shrink-0 pl-4 border-l border-divider">
              <p className="text-2xl font-bold text-tempo-600">{result.percentile}th</p>
              <p className="text-[0.6rem] text-t3">percentile</p>
            </div>
          </div>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-center gap-3 pt-2">
          <Button variant="outline" onClick={() => startScenario(activeScenario)}>
            <RotateCcw size={14} />
            Retry Scenario
          </Button>
          <Button onClick={() => { setView('library'); setActiveScenario(null); setResult(null); setMessages([]) }}>
            <ChevronRight size={14} />
            Browse Scenarios
          </Button>
        </div>
      </div>
    )
  }

  // Fallback
  return null
}
