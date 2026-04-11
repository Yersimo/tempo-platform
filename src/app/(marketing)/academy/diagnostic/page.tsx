'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { ChevronRight, ChevronLeft, GraduationCap, CheckCircle2, ArrowRight, DollarSign, Users, Monitor, BarChart3, Sparkles } from 'lucide-react'
import { ACADEMY_TEMPLATES } from '@/lib/academy-templates'

// ─── Types ──────────────────────────────────────────────────────────────────

interface DiagnosticQuestion {
  id: number
  text: string
  options: { label: string; value: number }[]
}

interface ScoreBand {
  min: number
  max: number
  tier: string
  label: string
  description: string
  plan: string
  color: string
  templateId: string
}

// ─── Data ───────────────────────────────────────────────────────────────────

const QUESTIONS: DiagnosticQuestion[] = [
  {
    id: 1,
    text: 'How do you currently deliver training to employees/partners?',
    options: [
      { label: 'No formal training', value: 1 },
      { label: 'In-person only', value: 2 },
      { label: 'Mix of in-person and basic online', value: 3 },
      { label: 'Primarily online with some in-person', value: 4 },
      { label: 'Fully digital with blended options', value: 5 },
    ],
  },
  {
    id: 2,
    text: 'How many people do you need to train per year?',
    options: [
      { label: 'Less than 50', value: 1 },
      { label: '50 - 200', value: 2 },
      { label: '200 - 500', value: 3 },
      { label: '500 - 1,000', value: 4 },
      { label: '1,000+', value: 5 },
    ],
  },
  {
    id: 3,
    text: 'Do you have a dedicated L&D team?',
    options: [
      { label: 'No dedicated team', value: 1 },
      { label: 'Part-time or shared responsibility', value: 2 },
      { label: 'One dedicated person', value: 3 },
      { label: 'Small team (2-5 people)', value: 4 },
      { label: 'Yes, multiple specialists', value: 5 },
    ],
  },
  {
    id: 4,
    text: "What's your annual training budget?",
    options: [
      { label: 'Less than $5,000', value: 1 },
      { label: '$5,000 - $20,000', value: 2 },
      { label: '$20,000 - $50,000', value: 3 },
      { label: '$50,000 - $100,000', value: 4 },
      { label: '$100,000+', value: 5 },
    ],
  },
  {
    id: 5,
    text: 'Do you need to train external participants (customers/partners)?',
    options: [
      { label: 'No, internal only', value: 1 },
      { label: 'Occasionally', value: 2 },
      { label: 'Yes, it would be helpful', value: 3 },
      { label: 'Yes, it is important', value: 4 },
      { label: 'Yes, it is critical to our business', value: 5 },
    ],
  },
  {
    id: 6,
    text: 'How important is certification/credentialing?',
    options: [
      { label: 'Not important', value: 1 },
      { label: 'Nice to have', value: 2 },
      { label: 'Somewhat important', value: 3 },
      { label: 'Very important', value: 4 },
      { label: 'Essential for our business', value: 5 },
    ],
  },
  {
    id: 7,
    text: 'Do you operate across multiple countries/languages?',
    options: [
      { label: 'Single country, one language', value: 1 },
      { label: 'Single country, multiple languages', value: 2 },
      { label: 'Two to three countries', value: 3 },
      { label: 'Regional (West/East/Southern Africa)', value: 4 },
      { label: 'Pan-African or global', value: 5 },
    ],
  },
  {
    id: 8,
    text: 'Do you need compliance/regulatory training?',
    options: [
      { label: 'No compliance requirements', value: 1 },
      { label: 'Minimal requirements', value: 2 },
      { label: 'Some industry regulations', value: 3 },
      { label: 'Significant regulatory requirements', value: 4 },
      { label: 'Heavily regulated industry', value: 5 },
    ],
  },
  {
    id: 9,
    text: 'How do you currently measure training effectiveness?',
    options: [
      { label: "We don't measure it", value: 1 },
      { label: 'Informal feedback only', value: 2 },
      { label: 'Basic completion tracking', value: 3 },
      { label: 'Surveys and assessments', value: 4 },
      { label: 'Data-driven KPIs and analytics', value: 5 },
    ],
  },
  {
    id: 10,
    text: "What's your biggest training challenge?",
    options: [
      { label: 'Cost of delivery', value: 2 },
      { label: 'Scaling to more learners', value: 3 },
      { label: 'Learner engagement', value: 4 },
      { label: 'Measuring impact', value: 4 },
      { label: 'Content quality and relevance', value: 3 },
    ],
  },
]

const SCORE_BANDS: ScoreBand[] = [
  {
    min: 10, max: 20,
    tier: 'Getting Started',
    label: 'Exploring digital learning',
    description: 'You are at the beginning of your digital learning journey. Start with a simple academy to digitise your existing training and build from there.',
    plan: 'Free',
    color: '#6b7280',
    templateId: 'digital-skills',
  },
  {
    min: 21, max: 35,
    tier: 'Growing',
    label: 'Ready to scale up',
    description: 'Your organisation has outgrown ad-hoc training. A structured academy with cohort management and certification will help you scale effectively.',
    plan: 'Starter',
    color: '#2563eb',
    templateId: 'financial-literacy',
  },
  {
    min: 36, max: 45,
    tier: 'Scaling',
    label: 'Professional academy needed',
    description: 'You need a professional-grade platform with advanced analytics, multi-language support, and cohort management to serve your growing learner base.',
    plan: 'Professional',
    color: '#9333ea',
    templateId: 'leadership-development',
  },
  {
    min: 46, max: 50,
    tier: 'Enterprise Ready',
    label: 'Full enterprise solution',
    description: 'Your organisation requires an enterprise-grade learning platform with custom domains, white-labelling, API access, and dedicated support.',
    plan: 'Enterprise',
    color: '#004D40',
    templateId: 'leadership-development',
  },
]

const TEMPLATE_ICONS: Record<string, React.ReactNode> = {
  DollarSign: <DollarSign size={20} />,
  Users: <Users size={20} />,
  Monitor: <Monitor size={20} />,
}

// ─── Circular Score Gauge ───────────────────────────────────────────────────

function ScoreGauge({ score, maxScore, color }: { score: number; maxScore: number; color: string }) {
  const percentage = (score / maxScore) * 100
  const radius = 70
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="180" height="180" viewBox="0 0 180 180">
        {/* Background circle */}
        <circle
          cx="90" cy="90" r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="10"
        />
        {/* Score arc */}
        <circle
          cx="90" cy="90" r={radius}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          transform="rotate(-90 90 90)"
          style={{ transition: 'stroke-dashoffset 1s ease-out' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold" style={{ color }}>{score}</span>
        <span className="text-sm text-gray-500">of {maxScore}</span>
      </div>
    </div>
  )
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function AcademyDiagnosticPage() {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [showResults, setShowResults] = useState(false)
  const [email, setEmail] = useState('')
  const [emailSubmitted, setEmailSubmitted] = useState(false)

  const totalQuestions = QUESTIONS.length
  const answeredCount = Object.keys(answers).length
  const progress = showResults ? 100 : (currentQuestion / totalQuestions) * 100

  const totalScore = useMemo(() => {
    return Object.values(answers).reduce((sum, v) => sum + v, 0)
  }, [answers])

  const scoreBand = useMemo(() => {
    return SCORE_BANDS.find(b => totalScore >= b.min && totalScore <= b.max) || SCORE_BANDS[0]
  }, [totalScore])

  const suggestedTemplate = useMemo(() => {
    return ACADEMY_TEMPLATES.find(t => t.id === scoreBand.templateId)
  }, [scoreBand])

  function handleAnswer(questionId: number, value: number) {
    setAnswers(prev => ({ ...prev, [questionId]: value }))
    // Auto-advance after selecting
    if (currentQuestion < totalQuestions - 1) {
      setTimeout(() => setCurrentQuestion(prev => prev + 1), 300)
    }
  }

  function handleFinish() {
    if (answeredCount < totalQuestions) return
    setShowResults(true)
  }

  function handleRestart() {
    setAnswers({})
    setCurrentQuestion(0)
    setShowResults(false)
    setEmail('')
    setEmailSubmitted(false)
  }

  function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setEmailSubmitted(true)
  }

  // ─── Results Screen ─────────────────────────────────────────────────────

  if (showResults) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 text-gray-900 font-bold text-lg">
              <GraduationCap size={24} className="text-blue-600" />
              Tempo Academy
            </Link>
            <button
              onClick={handleRestart}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Retake Assessment
            </button>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-6 py-12">
          {/* Score Section */}
          <div className="text-center mb-12">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Your Academy Readiness Score</h1>
            <p className="text-gray-500">Based on your responses, here is your personalised assessment</p>

            <div className="mt-8">
              <ScoreGauge score={totalScore} maxScore={50} color={scoreBand.color} />
            </div>

            <div className="mt-6">
              <span
                className="inline-block px-4 py-1.5 rounded-full text-sm font-semibold text-white"
                style={{ backgroundColor: scoreBand.color }}
              >
                {scoreBand.tier}
              </span>
              <p className="text-lg font-medium text-gray-900 mt-3">{scoreBand.label}</p>
              <p className="text-sm text-gray-500 mt-2 max-w-lg mx-auto">{scoreBand.description}</p>
            </div>
          </div>

          {/* Recommendation Card */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 mb-8 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
                style={{ backgroundColor: scoreBand.color }}
              >
                <Sparkles size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Recommended Plan: {scoreBand.plan}</h3>
                <p className="text-sm text-gray-500">Based on your score of {totalScore}/50</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              {[
                { label: 'Training Delivery', score: answers[1] || 0 },
                { label: 'Scale', score: answers[2] || 0 },
                { label: 'Team Readiness', score: answers[3] || 0 },
                { label: 'Budget', score: answers[4] || 0 },
              ].map(item => (
                <div key={item.label} className="bg-gray-50 rounded-xl p-3 text-center">
                  <div className="text-lg font-bold text-gray-900">{item.score}/5</div>
                  <div className="text-xs text-gray-500 mt-0.5">{item.label}</div>
                </div>
              ))}
            </div>

            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              View {scoreBand.plan} Plan Details
              <ArrowRight size={16} />
            </Link>
          </div>

          {/* Suggested Template */}
          {suggestedTemplate && (
            <div className="rounded-2xl border border-gray-200 bg-white p-6 mb-8 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <BarChart3 size={18} className="text-blue-600" />
                Suggested Academy Template
              </h3>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                  {TEMPLATE_ICONS[suggestedTemplate.icon] || <GraduationCap size={24} />}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">{suggestedTemplate.name}</h4>
                  <p className="text-sm text-gray-500 mt-1">{suggestedTemplate.description}</p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-lg font-medium">
                      {suggestedTemplate.modules} modules
                    </span>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-lg font-medium">
                      {suggestedTemplate.duration}
                    </span>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-lg font-medium">
                      {suggestedTemplate.curriculum.reduce((s, c) => s + c.lessons, 0)} lessons
                    </span>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-lg font-medium">
                      {suggestedTemplate.certificate}
                    </span>
                  </div>
                  <div className="mt-4">
                    <h5 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Curriculum</h5>
                    <div className="space-y-1.5">
                      {suggestedTemplate.curriculum.map((item, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm">
                          <CheckCircle2 size={14} className="text-green-500 shrink-0" />
                          <span className="text-gray-700">{item.title}</span>
                          <span className="text-gray-400 text-xs ml-auto">{item.duration}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Email Capture */}
          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-6 mb-8">
            <h3 className="font-semibold text-gray-900 mb-1">Get Your Detailed Report</h3>
            <p className="text-sm text-gray-600 mb-4">
              Receive a personalised academy readiness report with actionable recommendations.
            </p>
            {emailSubmitted ? (
              <div className="flex items-center gap-2 text-green-700 bg-green-50 rounded-xl px-4 py-3">
                <CheckCircle2 size={18} />
                <span className="text-sm font-medium">Report will be sent to {email}</span>
              </div>
            ) : (
              <form onSubmit={handleEmailSubmit} className="flex gap-2">
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  Send Report
                </button>
              </form>
            )}
          </div>

          {/* CTA */}
          <div className="text-center">
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors"
            >
              Get Started with Tempo Academy
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // ─── Question Wizard ────────────────────────────────────────────────────

  const question = QUESTIONS[currentQuestion]

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-gray-900 font-bold text-lg">
            <GraduationCap size={24} className="text-blue-600" />
            Tempo Academy
          </Link>
          <span className="text-sm text-gray-500">
            {answeredCount} of {totalQuestions} answered
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Question */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-xl">
          <div className="text-center mb-8">
            <span className="text-xs font-medium text-blue-600 uppercase tracking-wider">
              Question {currentQuestion + 1} of {totalQuestions}
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mt-3 leading-snug">
              {question.text}
            </h2>
          </div>

          <div className="space-y-3">
            {question.options.map((option, i) => {
              const isSelected = answers[question.id] === option.value &&
                // Handle duplicate values by checking index too
                Object.entries(answers).some(
                  ([key]) => Number(key) === question.id
                )
              return (
                <button
                  key={i}
                  onClick={() => handleAnswer(question.id, option.value)}
                  className={`w-full text-left px-5 py-4 rounded-xl border-2 transition-all ${
                    answers[question.id] === option.value
                      ? 'border-blue-500 bg-blue-50 text-blue-900'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      answers[question.id] === option.value
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-300'
                    }`}>
                      {answers[question.id] === option.value && (
                        <div className="w-2 h-2 rounded-full bg-white" />
                      )}
                    </div>
                    <span className="text-sm font-medium">{option.label}</span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="bg-white border-t border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
            disabled={currentQuestion === 0}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={16} />
            Previous
          </button>

          <div className="flex items-center gap-1.5">
            {QUESTIONS.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentQuestion(i)}
                className={`w-2 h-2 rounded-full transition-all ${
                  i === currentQuestion
                    ? 'bg-blue-600 w-6'
                    : answers[QUESTIONS[i].id] !== undefined
                    ? 'bg-blue-300'
                    : 'bg-gray-300'
                }`}
              />
            ))}
          </div>

          {currentQuestion === totalQuestions - 1 ? (
            <button
              onClick={handleFinish}
              disabled={answeredCount < totalQuestions}
              className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              View Results
              <ArrowRight size={16} />
            </button>
          ) : (
            <button
              onClick={() => setCurrentQuestion(Math.min(totalQuestions - 1, currentQuestion + 1))}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Next
              <ChevronRight size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
