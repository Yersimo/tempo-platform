'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { cn } from '@/lib/utils/cn'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { StatCard } from '@/components/ui/stat-card'
import {
  Brain, Clock, CheckCircle, AlertTriangle, Zap, Trophy,
  ChevronRight, Calendar, ArrowRight, Flame, RotateCcw,
  Star, TrendingUp, X, ChevronLeft
} from 'lucide-react'

// ─── Types ──────────────────────────────────────────────────
interface Course {
  id: string
  title: string
  category?: string
  duration_hours?: number
}

interface Enrollment {
  id: string
  course_id: string
  employee_id?: string
  status: string
  progress: number
  completed_at?: string | null
  score?: number | null
}

interface QuizQuestion {
  id: string
  course_id: string
  type: string
  question: string
  options: string[]
  correct_answer: string
  points: number
  explanation?: string
}

interface SmartReviewsProps {
  courses: Course[]
  enrollments: Enrollment[]
  quizQuestions: QuizQuestion[]
  addToast: (msg: string) => void
}

// ─── Spaced repetition helpers ──────────────────────────────
function retentionScore(daysSince: number): number {
  return Math.max(10, Math.round(100 * Math.exp(-0.02 * daysSince)))
}

function nextReviewDays(retention: number): number {
  if (retention > 85) return 30
  if (retention > 70) return 14
  if (retention > 50) return 7
  if (retention > 30) return 3
  return 1
}

type Urgency = 'overdue' | 'today' | 'upcoming' | 'ok'

function getUrgency(nextReviewDate: Date): Urgency {
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const todayEnd = new Date(todayStart.getTime() + 86400000)
  if (nextReviewDate < todayStart) return 'overdue'
  if (nextReviewDate < todayEnd) return 'today'
  const threeDaysOut = new Date(todayStart.getTime() + 3 * 86400000)
  if (nextReviewDate < threeDaysOut) return 'upcoming'
  return 'ok'
}

const urgencyColors: Record<Urgency, string> = {
  overdue: 'text-red-500 bg-red-500/10 border-red-500/30',
  today: 'text-amber-500 bg-amber-500/10 border-amber-500/30',
  upcoming: 'text-blue-500 bg-blue-500/10 border-blue-500/30',
  ok: 'text-green-500 bg-green-500/10 border-green-500/30',
}
const urgencyLabels: Record<Urgency, string> = {
  overdue: 'Overdue',
  today: 'Due Today',
  upcoming: 'Upcoming',
  ok: 'On Track',
}

// Shuffle array (Fisher-Yates)
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// ─── Review item type ───────────────────────────────────────
interface ReviewItem {
  enrollmentId: string
  courseId: string
  courseTitle: string
  category: string
  retention: number
  daysSince: number
  nextReview: Date
  urgency: Urgency
  hasQuestions: boolean
}

// ─── Sub-views ──────────────────────────────────────────────
type ReviewView = 'queue' | 'session' | 'schedule' | 'results'

// ─── Component ──────────────────────────────────────────────
export default function SmartReviews({ courses, enrollments, quizQuestions, addToast }: SmartReviewsProps) {
  const [view, setView] = useState<ReviewView>('queue')
  const [sessionCourseId, setSessionCourseId] = useState<string | null>(null)

  // Session state
  const [sessionQuestions, setSessionQuestions] = useState<QuizQuestion[]>([])
  const [currentQIdx, setCurrentQIdx] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [isFlipped, setIsFlipped] = useState(false)
  const [sessionAnswers, setSessionAnswers] = useState<{ questionId: string; correct: boolean }[]>([])

  // Stats (persisted in localStorage)
  const [reviewsCompleted, setReviewsCompleted] = useState(0)
  const [streakDays, setStreakDays] = useState(0)
  const [retentionImprovement, setRetentionImprovement] = useState(0)

  useEffect(() => {
    try {
      const saved = localStorage.getItem('tempo-smart-reviews-stats')
      if (saved) {
        const p = JSON.parse(saved)
        setReviewsCompleted(p.reviewsCompleted || 0)
        setStreakDays(p.streakDays || 0)
        setRetentionImprovement(p.retentionImprovement || 0)
      }
    } catch { /* noop */ }
  }, [])

  function persistStats(rc: number, sd: number, ri: number) {
    setReviewsCompleted(rc)
    setStreakDays(sd)
    setRetentionImprovement(ri)
    try {
      localStorage.setItem('tempo-smart-reviews-stats', JSON.stringify({
        reviewsCompleted: rc, streakDays: sd, retentionImprovement: ri, lastReview: new Date().toISOString(),
      }))
    } catch { /* noop */ }
  }

  // Build review items from completed enrollments
  const reviewItems = useMemo(() => {
    return enrollments
      .filter(e => e.status === 'completed' && e.completed_at)
      .map(e => {
        const course = courses.find(c => c.id === e.course_id)
        if (!course) return null
        const completedAt = new Date(e.completed_at!)
        const daysSince = Math.ceil((Date.now() - completedAt.getTime()) / (1000 * 60 * 60 * 24))
        const retention = retentionScore(daysSince)
        const reviewDays = nextReviewDays(retention)
        const nextReviewDate = new Date(completedAt.getTime() + (daysSince + reviewDays) * 86400000)
        // Recalculate: next review = completedAt + intervals accumulated
        const nextReview = new Date(Date.now() + reviewDays * 86400000)
        const urgency = getUrgency(nextReview)
        const hasQuestions = quizQuestions.some(q => q.course_id === e.course_id)
        return {
          enrollmentId: e.id,
          courseId: e.course_id,
          courseTitle: course.title,
          category: course.category || 'General',
          retention,
          daysSince,
          nextReview,
          urgency,
          hasQuestions,
        }
      })
      .filter((x): x is ReviewItem => x !== null)
      .sort((a, b) => {
        const urgencyOrder: Record<Urgency, number> = { overdue: 0, today: 1, upcoming: 2, ok: 3 }
        return urgencyOrder[a.urgency] - urgencyOrder[b.urgency] || a.retention - b.retention
      })
  }, [enrollments, courses, quizQuestions])

  const dueCount = reviewItems.filter(r => r.urgency === 'overdue' || r.urgency === 'today').length

  // Start a review session
  const startSession = useCallback((courseId: string) => {
    const courseQs = quizQuestions.filter(q => q.course_id === courseId)
    if (courseQs.length === 0) {
      addToast('No quiz questions available for this course')
      return
    }
    const selected = shuffle(courseQs).slice(0, 5)
    setSessionCourseId(courseId)
    setSessionQuestions(selected)
    setCurrentQIdx(0)
    setSelectedAnswer(null)
    setIsFlipped(false)
    setSessionAnswers([])
    setView('session')
  }, [quizQuestions, addToast])

  // Submit answer in session
  const submitAnswer = useCallback(() => {
    if (!selectedAnswer || !sessionQuestions[currentQIdx]) return
    const q = sessionQuestions[currentQIdx]
    const correct = selectedAnswer === q.correct_answer
    setIsFlipped(true)
    setSessionAnswers(prev => [...prev, { questionId: q.id, correct }])
  }, [selectedAnswer, sessionQuestions, currentQIdx])

  // Move to next question or show results
  const nextQuestion = useCallback(() => {
    if (currentQIdx < sessionQuestions.length - 1) {
      setCurrentQIdx(prev => prev + 1)
      setSelectedAnswer(null)
      setIsFlipped(false)
    } else {
      // Calculate final score
      const correct = sessionAnswers.filter(a => a.correct).length + (selectedAnswer === sessionQuestions[currentQIdx]?.correct_answer ? 1 : 0)
      const total = sessionQuestions.length
      const score = Math.round((correct / total) * 100)

      // Update stats
      const newCompleted = reviewsCompleted + 1
      const newStreak = streakDays + 1 // simplified
      const newImprovement = Math.min(99, retentionImprovement + Math.round(score / 10))
      persistStats(newCompleted, newStreak, newImprovement)

      addToast(`Review complete! Score: ${score}%`)
      setView('results')
    }
  }, [currentQIdx, sessionQuestions, sessionAnswers, selectedAnswer, reviewsCompleted, streakDays, retentionImprovement, addToast])

  const sessionScore = useMemo(() => {
    if (sessionAnswers.length === 0) return 0
    return Math.round((sessionAnswers.filter(a => a.correct).length / sessionAnswers.length) * 100)
  }, [sessionAnswers])

  // Calendar data for schedule view
  const calendarWeeks = useMemo(() => {
    const today = new Date()
    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() - today.getDay())
    const weeks: { date: Date; reviews: typeof reviewItems }[][] = []
    for (let w = 0; w < 4; w++) {
      const week: { date: Date; reviews: typeof reviewItems }[] = []
      for (let d = 0; d < 7; d++) {
        const date = new Date(startOfWeek.getTime() + (w * 7 + d) * 86400000)
        const dayReviews = reviewItems.filter(r => {
          const rd = r.nextReview
          return rd.getFullYear() === date.getFullYear() && rd.getMonth() === date.getMonth() && rd.getDate() === date.getDate()
        })
        week.push({ date, reviews: dayReviews })
      }
      weeks.push(week)
    }
    return weeks
  }, [reviewItems])

  // ─── Render ─────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Notification banner */}
      {dueCount > 0 && view === 'queue' && (
        <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-amber-500/10 via-tempo-500/10 to-purple-500/10 border border-amber-500/20 rounded-xl">
          <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
            <Brain size={16} className="text-amber-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-t1">
              You have <span className="text-amber-500 font-bold">{dueCount}</span> review{dueCount !== 1 ? 's' : ''} due today
            </p>
            <p className="text-[0.65rem] text-t3">Spaced repetition keeps knowledge fresh. Complete reviews to maintain your streak.</p>
          </div>
          <Button size="sm" onClick={() => {
            const first = reviewItems.find(r => r.urgency === 'overdue' || r.urgency === 'today')
            if (first?.hasQuestions) startSession(first.courseId)
            else addToast('No quiz questions available for the next due review')
          }}>
            <Zap size={14} className="mr-1" /> Start Review
          </Button>
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Reviews Completed" value={reviewsCompleted} icon={<CheckCircle size={20} />} />
        <StatCard label="Streak" value={`${streakDays}d`} icon={<Flame size={20} />} change="Keep going!" changeType="positive" />
        <StatCard label="Retention Improvement" value={`+${retentionImprovement}%`} icon={<TrendingUp size={20} />} change="Since first review" changeType="positive" />
        <StatCard label="Due Now" value={dueCount} icon={<AlertTriangle size={20} />} change={dueCount > 0 ? 'Action needed' : 'All clear'} changeType={dueCount > 0 ? 'negative' : 'positive'} />
      </div>

      {/* View tabs */}
      <div className="flex gap-1 bg-canvas rounded-lg p-1">
        {([
          { id: 'queue' as const, label: 'Review Queue', icon: Brain },
          { id: 'schedule' as const, label: 'Schedule', icon: Calendar },
        ]).map(tab => (
          <button
            key={tab.id}
            onClick={() => setView(tab.id)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all',
              view === tab.id || (view === 'session' && tab.id === 'queue') || (view === 'results' && tab.id === 'queue')
                ? 'bg-white shadow-sm text-t1 dark:bg-card'
                : 'text-t3 hover:text-t2'
            )}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ─── Queue View ─── */}
      {view === 'queue' && (
        <div className="space-y-2">
          {reviewItems.length === 0 ? (
            <Card>
              <div className="p-8 text-center">
                <Brain size={40} className="mx-auto text-t4 mb-3" />
                <p className="text-sm text-t2 font-medium">No reviews yet</p>
                <p className="text-xs text-t3 mt-1">Complete courses to start building your review schedule</p>
              </div>
            </Card>
          ) : (
            reviewItems.map((item) => (
              <div
                key={item.enrollmentId}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-xl border transition-all hover:shadow-sm cursor-pointer',
                  urgencyColors[item.urgency]
                )}
                onClick={() => item.hasQuestions ? startSession(item.courseId) : addToast('No quiz questions for this course')}
              >
                <div className="w-10 h-10 rounded-lg bg-white/50 dark:bg-white/10 flex items-center justify-center flex-shrink-0">
                  <Brain size={20} className={cn(
                    item.urgency === 'overdue' ? 'text-red-500' :
                    item.urgency === 'today' ? 'text-amber-500' :
                    item.urgency === 'upcoming' ? 'text-blue-500' : 'text-green-500'
                  )} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-t1 truncate">{item.courseTitle}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[0.6rem] text-t3">{item.category}</span>
                    <span className="text-[0.5rem] text-t4">|</span>
                    <span className="text-[0.6rem] text-t3">Completed {item.daysSince}d ago</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="text-right">
                    <div className="flex items-center gap-1">
                      <div className="w-16">
                        <Progress value={item.retention} color={item.retention >= 80 ? 'success' : item.retention >= 50 ? 'orange' : 'warning'} />
                      </div>
                      <span className={cn('text-xs font-bold', item.retention >= 80 ? 'text-green-600' : item.retention >= 50 ? 'text-amber-600' : 'text-red-600')}>
                        {item.retention}%
                      </span>
                    </div>
                    <Badge variant={item.urgency === 'overdue' ? 'error' : item.urgency === 'today' ? 'warning' : item.urgency === 'upcoming' ? 'info' : 'success'} className="mt-1">
                      {urgencyLabels[item.urgency]}
                    </Badge>
                  </div>
                  <ChevronRight size={16} className="text-t4" />
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ─── Session View (micro-quiz) ─── */}
      {view === 'session' && sessionQuestions.length > 0 && (
        <div className="space-y-4">
          {/* Progress bar */}
          <div className="flex items-center gap-3">
            <button onClick={() => setView('queue')} className="text-t3 hover:text-t1 transition-colors">
              <ChevronLeft size={20} />
            </button>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-t3 font-medium">
                  Question {currentQIdx + 1} of {sessionQuestions.length}
                </span>
                <span className="text-xs text-t3">
                  {sessionAnswers.filter(a => a.correct).length} correct
                </span>
              </div>
              <div className="flex gap-1">
                {sessionQuestions.map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      'h-1.5 flex-1 rounded-full transition-all duration-300',
                      i < currentQIdx ? (sessionAnswers[i]?.correct ? 'bg-green-500' : 'bg-red-500')
                        : i === currentQIdx ? 'bg-tempo-500'
                        : 'bg-gray-200 dark:bg-gray-700'
                    )}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Question card with flip animation */}
          <div
            className="relative w-full"
            style={{ perspective: '1200px', minHeight: '320px' }}
          >
            <div
              className={cn(
                'w-full transition-transform duration-500 relative',
                '[transform-style:preserve-3d]',
              )}
              style={{
                transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
              }}
            >
              {/* Front: Question */}
              <div
                className="w-full rounded-2xl border border-border bg-card p-6 [backface-visibility:hidden] absolute inset-0"
                style={{ backfaceVisibility: 'hidden' }}
              >
                <div className="flex items-start gap-3 mb-5">
                  <div className="w-8 h-8 rounded-lg bg-tempo-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Brain size={16} className="text-tempo-500" />
                  </div>
                  <div>
                    <Badge variant="ai" className="mb-2">Review Question</Badge>
                    <p className="text-sm font-medium text-t1 leading-relaxed">
                      {sessionQuestions[currentQIdx]?.question}
                    </p>
                  </div>
                </div>

                {/* Answer options */}
                <div className="space-y-2 mt-4">
                  {(sessionQuestions[currentQIdx]?.options || []).map((option, oi) => {
                    const optionText = typeof option === 'string' ? option : ((option as any)?.text || (option as any)?.label || String(option))
                    return (
                    <button
                      key={oi}
                      onClick={() => !isFlipped && setSelectedAnswer(optionText)}
                      className={cn(
                        'w-full text-left px-4 py-3 rounded-xl border text-sm transition-all',
                        selectedAnswer === optionText
                          ? 'border-tempo-500 bg-tempo-500/10 text-tempo-600 font-medium ring-1 ring-tempo-500/30'
                          : 'border-border hover:border-tempo-300 hover:bg-canvas text-t2'
                      )}
                    >
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[0.6rem] font-bold mr-2.5 bg-canvas border border-border">
                        {String.fromCharCode(65 + oi)}
                      </span>
                      {optionText}
                    </button>
                    )
                  })}
                </div>

                <div className="mt-5 flex justify-end">
                  <Button
                    size="sm"
                    disabled={!selectedAnswer}
                    onClick={submitAnswer}
                  >
                    Check Answer <ArrowRight size={14} className="ml-1" />
                  </Button>
                </div>
              </div>

              {/* Back: Feedback */}
              <div
                className="w-full rounded-2xl border border-border bg-card p-6 [backface-visibility:hidden] absolute inset-0"
                style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
              >
                {(() => {
                  const q = sessionQuestions[currentQIdx]
                  const correct = selectedAnswer === q?.correct_answer
                  return (
                    <>
                      <div className={cn(
                        'flex items-center gap-3 mb-4 p-3 rounded-xl',
                        correct ? 'bg-green-500/10' : 'bg-red-500/10'
                      )}>
                        {correct ? (
                          <CheckCircle size={24} className="text-green-500" />
                        ) : (
                          <X size={24} className="text-red-500" />
                        )}
                        <div>
                          <p className={cn('text-sm font-bold', correct ? 'text-green-600' : 'text-red-600')}>
                            {correct ? 'Correct!' : 'Incorrect'}
                          </p>
                          {!correct && (
                            <p className="text-xs text-t3 mt-0.5">
                              Correct answer: <span className="font-medium text-t1">{q?.correct_answer}</span>
                            </p>
                          )}
                        </div>
                      </div>

                      {q?.explanation && (
                        <div className="p-3 rounded-xl bg-canvas border border-border mb-4">
                          <p className="text-xs text-t2 leading-relaxed">{q.explanation}</p>
                        </div>
                      )}

                      <div className="flex justify-end">
                        <Button size="sm" onClick={nextQuestion}>
                          {currentQIdx < sessionQuestions.length - 1 ? (
                            <>Next Question <ChevronRight size={14} className="ml-1" /></>
                          ) : (
                            <>See Results <Trophy size={14} className="ml-1" /></>
                          )}
                        </Button>
                      </div>
                    </>
                  )
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Results View ─── */}
      {view === 'results' && (
        <Card>
          <div className="p-6 text-center space-y-4">
            <div className={cn(
              'w-20 h-20 rounded-full mx-auto flex items-center justify-center',
              sessionScore >= 80 ? 'bg-green-500/10' : sessionScore >= 50 ? 'bg-amber-500/10' : 'bg-red-500/10'
            )}>
              <Trophy size={36} className={cn(
                sessionScore >= 80 ? 'text-green-500' : sessionScore >= 50 ? 'text-amber-500' : 'text-red-500'
              )} />
            </div>

            <div>
              <p className="text-2xl font-bold text-t1">{sessionScore}%</p>
              <p className="text-sm text-t3 mt-1">
                {sessionAnswers.filter(a => a.correct).length} of {sessionAnswers.length} correct
              </p>
            </div>

            <p className={cn(
              'text-sm font-medium',
              sessionScore >= 80 ? 'text-green-600' : sessionScore >= 50 ? 'text-amber-600' : 'text-red-600'
            )}>
              {sessionScore >= 80
                ? 'Excellent! Your retention is strong.'
                : sessionScore >= 50
                ? 'Good effort. A few areas need reinforcement.'
                : 'This topic needs more review. Try again soon!'}
            </p>

            {/* Per-question breakdown */}
            <div className="flex justify-center gap-2 mt-3">
              {sessionAnswers.map((a, i) => (
                <div
                  key={i}
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold',
                    a.correct ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'
                  )}
                >
                  {a.correct ? <CheckCircle size={16} /> : <X size={16} />}
                </div>
              ))}
            </div>

            <div className="flex items-center justify-center gap-3 mt-4">
              <Button variant="outline" size="sm" onClick={() => setView('queue')}>
                <ChevronLeft size={14} className="mr-1" /> Back to Queue
              </Button>
              {sessionCourseId && (
                <Button size="sm" onClick={() => startSession(sessionCourseId)}>
                  <RotateCcw size={14} className="mr-1" /> Retry
                </Button>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* ─── Schedule View ─── */}
      {view === 'schedule' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Review Schedule — Next 4 Weeks</CardTitle>
          </CardHeader>
          <div className="p-4 pt-0">
            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1 mb-1">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <div key={d} className="text-center text-[0.6rem] text-t4 font-medium py-1">{d}</div>
              ))}
            </div>
            {/* Calendar grid */}
            {calendarWeeks.map((week, wi) => (
              <div key={wi} className="grid grid-cols-7 gap-1 mb-1">
                {week.map((day, di) => {
                  const isToday = day.date.toDateString() === new Date().toDateString()
                  const hasReviews = day.reviews.length > 0
                  return (
                    <div
                      key={di}
                      className={cn(
                        'relative p-1.5 rounded-lg text-center min-h-[52px] transition-all',
                        isToday ? 'bg-tempo-500/10 ring-1 ring-tempo-500/30' : 'bg-canvas',
                        hasReviews && 'cursor-pointer hover:bg-tempo-500/5'
                      )}
                    >
                      <span className={cn(
                        'text-[0.65rem] font-medium',
                        isToday ? 'text-tempo-600' : 'text-t3'
                      )}>
                        {day.date.getDate()}
                      </span>
                      {hasReviews && (
                        <div className="mt-0.5 space-y-0.5">
                          {day.reviews.slice(0, 2).map((r, ri) => (
                            <div key={ri} className={cn(
                              'text-[0.5rem] px-1 py-0.5 rounded truncate',
                              r.urgency === 'overdue' ? 'bg-red-500/20 text-red-600' :
                              r.urgency === 'today' ? 'bg-amber-500/20 text-amber-600' :
                              'bg-blue-500/20 text-blue-600'
                            )}>
                              {r.courseTitle.slice(0, 12)}
                            </div>
                          ))}
                          {day.reviews.length > 2 && (
                            <span className="text-[0.5rem] text-t4">+{day.reviews.length - 2}</span>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
