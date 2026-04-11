'use client'

import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils/cn'
import {
  CheckCircle2, XCircle, BookOpen, Zap, Clock, Target,
  ArrowRight, Award, Sparkles, RotateCcw, ChevronRight,
  Brain, Shield, TrendingUp
} from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────

interface PlacementQuestion {
  id: string
  text: string
  options: { id: string; text: string }[]
  correctOptionId: string
  explanation?: string
}

interface PlacementModule {
  id: string
  title: string
  questions: PlacementQuestion[]
}

interface PlacementTestProps {
  course: any
  modules: PlacementModule[]
  onComplete: (skippedModuleIds: string[]) => void
  onSkip: () => void
  onClose: () => void
  minScorePercent?: number
  allowRetakes?: boolean
}

type Phase = 'intro' | 'testing' | 'results'

interface ModuleResult {
  moduleId: string
  moduleTitle: string
  passed: boolean
  score: number
  totalQuestions: number
  correctAnswers: number
}

// ── Confetti Particle Component ────────────────────────────────────

function ConfettiEffect({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animFrameRef = useRef<number>(0)

  useEffect(() => {
    if (!active || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight

    const colors = ['#004D40', '#26A69A', '#80CBC4', '#22c55e', '#4ade80', '#fbbf24', '#a78bfa', '#60a5fa']

    interface Particle {
      x: number; y: number; w: number; h: number
      vx: number; vy: number; color: string
      rotation: number; rotSpeed: number; opacity: number
    }

    const particles: Particle[] = Array.from({ length: 80 }, () => ({
      x: canvas.width / 2 + (Math.random() - 0.5) * 200,
      y: canvas.height / 2,
      w: Math.random() * 8 + 4,
      h: Math.random() * 6 + 2,
      vx: (Math.random() - 0.5) * 12,
      vy: Math.random() * -14 - 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.3,
      opacity: 1,
    }))

    let frame = 0

    function animate() {
      if (!ctx || !canvas) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      frame++

      let alive = false
      particles.forEach(p => {
        if (p.opacity <= 0) return
        alive = true

        p.x += p.vx
        p.vy += 0.25 // gravity
        p.y += p.vy
        p.rotation += p.rotSpeed
        p.vx *= 0.99
        if (frame > 40) p.opacity -= 0.015

        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rotation)
        ctx.globalAlpha = Math.max(0, p.opacity)
        ctx.fillStyle = p.color
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h)
        ctx.restore()
      })

      if (alive) {
        animFrameRef.current = requestAnimationFrame(animate)
      }
    }

    animate()

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    }
  }, [active])

  if (!active) return null

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-10"
      style={{ width: '100%', height: '100%' }}
    />
  )
}

// ── Main Component ─────────────────────────────────────────────────

export default function PlacementTest({
  course,
  modules,
  onComplete,
  onSkip,
  onClose,
  minScorePercent = 80,
  allowRetakes = true,
}: PlacementTestProps) {
  const [phase, setPhase] = useState<Phase>('intro')
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [showFeedback, setShowFeedback] = useState(false)
  const [answers, setAnswers] = useState<Map<string, { questionId: string; selectedId: string; correct: boolean }[]>>(new Map())
  const [results, setResults] = useState<ModuleResult[]>([])
  const [showConfetti, setShowConfetti] = useState(false)
  const [answerTransition, setAnswerTransition] = useState(false)

  // ── Derived State ──────────────────────────────────────────────

  const allQuestions = useMemo(() => modules.flatMap(m => m.questions), [modules])
  const totalQuestions = allQuestions.length

  const questionsAnswered = useMemo(() => {
    let count = 0
    answers.forEach(arr => { count += arr.length })
    return count
  }, [answers])

  const currentModule = modules[currentModuleIndex]
  const currentQuestion = currentModule?.questions[currentQuestionIndex]

  const globalQuestionIndex = useMemo(() => {
    let idx = 0
    for (let i = 0; i < currentModuleIndex; i++) {
      idx += modules[i].questions.length
    }
    return idx + currentQuestionIndex
  }, [modules, currentModuleIndex, currentQuestionIndex])

  // ── Estimated Time Savings ─────────────────────────────────────

  const estimatedHoursPerModule = useMemo(() => {
    const totalHours = course?.duration_hours || modules.length * 1.5
    return totalHours / modules.length
  }, [course, modules])

  // ── Handlers ───────────────────────────────────────────────────

  const handleSelectAnswer = useCallback((optionId: string) => {
    if (showFeedback) return
    setSelectedAnswer(optionId)
    setShowFeedback(true)

    const correct = optionId === currentQuestion.correctOptionId
    setAnswers(prev => {
      const next = new Map(prev)
      const moduleAnswers = next.get(currentModule.id) || []
      next.set(currentModule.id, [...moduleAnswers, {
        questionId: currentQuestion.id,
        selectedId: optionId,
        correct,
      }])
      return next
    })

    // Trigger scale animation
    setAnswerTransition(true)
    setTimeout(() => setAnswerTransition(false), 300)
  }, [showFeedback, currentQuestion, currentModule])

  const handleNext = useCallback(() => {
    setSelectedAnswer(null)
    setShowFeedback(false)

    const isLastQuestionInModule = currentQuestionIndex >= currentModule.questions.length - 1
    const isLastModule = currentModuleIndex >= modules.length - 1

    if (isLastQuestionInModule && isLastModule) {
      // Compute results
      const moduleResults: ModuleResult[] = modules.map(m => {
        const moduleAnswers = answers.get(m.id) || []
        // Include current answer if this is the last module
        const allModuleAnswers = m.id === currentModule.id
          ? [...moduleAnswers]
          : moduleAnswers
        const correctCount = allModuleAnswers.filter(a => a.correct).length
        const total = m.questions.length
        const score = total > 0 ? Math.round((correctCount / total) * 100) : 0
        return {
          moduleId: m.id,
          moduleTitle: m.title,
          passed: score >= minScorePercent,
          score,
          totalQuestions: total,
          correctAnswers: correctCount,
        }
      })

      setResults(moduleResults)
      setPhase('results')

      // Show confetti if > 60% modules passed
      const passedCount = moduleResults.filter(r => r.passed).length
      if (passedCount / moduleResults.length > 0.6) {
        setShowConfetti(true)
      }
    } else if (isLastQuestionInModule) {
      setCurrentModuleIndex(prev => prev + 1)
      setCurrentQuestionIndex(0)
    } else {
      setCurrentQuestionIndex(prev => prev + 1)
    }
  }, [currentQuestionIndex, currentModuleIndex, currentModule, modules, answers, minScorePercent])

  const handleRetake = useCallback(() => {
    setPhase('testing')
    setCurrentModuleIndex(0)
    setCurrentQuestionIndex(0)
    setSelectedAnswer(null)
    setShowFeedback(false)
    setAnswers(new Map())
    setResults([])
    setShowConfetti(false)
  }, [])

  const handleComplete = useCallback(() => {
    const skippedIds = results.filter(r => r.passed).map(r => r.moduleId)
    onComplete(skippedIds)
  }, [results, onComplete])

  // ── Computed Results Data ──────────────────────────────────────

  const skippedModules = results.filter(r => r.passed)
  const requiredModules = results.filter(r => !r.passed)
  const overallScore = results.length > 0
    ? Math.round(results.reduce((sum, r) => sum + r.score, 0) / results.length)
    : 0
  const hoursSaved = skippedModules.length * estimatedHoursPerModule

  // ── Render Phases ──────────────────────────────────────────────

  if (phase === 'intro') {
    return (
      <Modal open onClose={onClose} size="lg">
        <div className="text-center py-4">
          {/* Hero Icon */}
          <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-tempo-500 to-tempo-700 flex items-center justify-center mb-6 shadow-lg shadow-tempo-600/20">
            <Zap size={28} className="text-white" />
          </div>

          <h2 className="text-xl font-bold text-t1 mb-2">Placement Test Available</h2>
          <p className="text-sm text-t3 max-w-md mx-auto mb-8">
            Already familiar with some of this material? Take a quick assessment to skip
            content you already know and jump straight to what matters.
          </p>

          {/* Stats Preview */}
          <div className="grid grid-cols-3 gap-3 mb-8 max-w-sm mx-auto">
            <div className="bg-canvas rounded-xl p-3">
              <div className="flex items-center justify-center mb-1">
                <BookOpen size={14} className="text-tempo-600" />
              </div>
              <p className="text-lg font-bold text-t1">{modules.length}</p>
              <p className="text-[0.65rem] text-t3">Modules</p>
            </div>
            <div className="bg-canvas rounded-xl p-3">
              <div className="flex items-center justify-center mb-1">
                <Target size={14} className="text-tempo-600" />
              </div>
              <p className="text-lg font-bold text-t1">{totalQuestions}</p>
              <p className="text-[0.65rem] text-t3">Questions</p>
            </div>
            <div className="bg-canvas rounded-xl p-3">
              <div className="flex items-center justify-center mb-1">
                <Clock size={14} className="text-tempo-600" />
              </div>
              <p className="text-lg font-bold text-t1">~{Math.max(2, Math.ceil(totalQuestions * 0.5))}</p>
              <p className="text-[0.65rem] text-t3">Minutes</p>
            </div>
          </div>

          {/* How it works */}
          <div className="bg-canvas rounded-xl p-4 mb-8 text-left max-w-sm mx-auto">
            <p className="text-xs font-semibold text-t1 mb-3">How it works</p>
            <div className="space-y-2.5">
              {[
                { icon: Brain, text: 'Answer questions mapped to each module' },
                { icon: Target, text: `Score ${minScorePercent}%+ on a module to skip it` },
                { icon: TrendingUp, text: 'Jump straight to what you need to learn' },
              ].map((step, i) => (
                <div key={i} className="flex items-center gap-2.5 text-xs text-t2">
                  <div className="w-5 h-5 rounded-md bg-tempo-600/10 flex items-center justify-center flex-shrink-0">
                    <step.icon size={12} className="text-tempo-600" />
                  </div>
                  {step.text}
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2.5 max-w-sm mx-auto">
            <Button
              size="lg"
              onClick={() => setPhase('testing')}
              className="w-full group"
            >
              <Zap size={16} />
              Take Placement Test
              <ArrowRight size={14} className="ml-auto opacity-50 group-hover:translate-x-0.5 transition-transform" />
            </Button>
            <Button
              variant="ghost"
              size="md"
              onClick={onSkip}
              className="w-full text-t3"
            >
              Skip Test &amp; Start from Beginning
            </Button>
          </div>
        </div>
      </Modal>
    )
  }

  if (phase === 'testing' && currentQuestion) {
    const isCorrect = selectedAnswer === currentQuestion.correctOptionId

    return (
      <Modal open onClose={onClose} size="lg">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between mb-1">
            <Badge variant="orange" className="text-[0.6rem]">
              Module {currentModuleIndex + 1}: {currentModule.title}
            </Badge>
            <span className="text-xs text-t3 tabular-nums">
              {globalQuestionIndex + 1} / {totalQuestions}
            </span>
          </div>

          {/* Progress Bar */}
          <Progress
            value={globalQuestionIndex + (showFeedback ? 1 : 0)}
            max={totalQuestions}
            size="sm"
            color="orange"
            className="mb-6"
          />

          {/* Question */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-t1 leading-relaxed">
              {currentQuestion.text}
            </h3>
          </div>

          {/* Options */}
          <div className="space-y-2.5 mb-6">
            {currentQuestion.options.map((option, idx) => {
              const isSelected = selectedAnswer === option.id
              const isCorrectOption = option.id === currentQuestion.correctOptionId
              const letter = String.fromCharCode(65 + idx)

              let borderClass = 'border-border hover:border-tempo-400 hover:bg-tempo-50/5'
              let bgClass = ''
              let iconEl = null

              if (showFeedback) {
                if (isCorrectOption) {
                  borderClass = 'border-green-500/50'
                  bgClass = 'bg-green-500/5'
                  iconEl = <CheckCircle2 size={16} className="text-green-500 flex-shrink-0" />
                } else if (isSelected && !isCorrectOption) {
                  borderClass = 'border-red-500/50'
                  bgClass = 'bg-red-500/5'
                  iconEl = <XCircle size={16} className="text-red-500 flex-shrink-0" />
                } else {
                  borderClass = 'border-border opacity-50'
                }
              }

              return (
                <button
                  key={option.id}
                  onClick={() => handleSelectAnswer(option.id)}
                  disabled={showFeedback}
                  className={cn(
                    'w-full flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all duration-200',
                    borderClass,
                    bgClass,
                    !showFeedback && 'cursor-pointer active:scale-[0.98]',
                    showFeedback && 'cursor-default',
                    isSelected && !showFeedback && 'border-tempo-500 bg-tempo-50/10',
                    answerTransition && isSelected && 'scale-[1.02]',
                  )}
                >
                  <span className={cn(
                    'w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 transition-colors',
                    showFeedback && isCorrectOption
                      ? 'bg-green-500/20 text-green-500'
                      : showFeedback && isSelected
                        ? 'bg-red-500/20 text-red-500'
                        : isSelected
                          ? 'bg-tempo-600 text-white'
                          : 'bg-canvas text-t3'
                  )}>
                    {letter}
                  </span>
                  <span className="text-sm text-t1 flex-1">{option.text}</span>
                  {iconEl}
                </button>
              )
            })}
          </div>

          {/* Feedback + Explanation */}
          {showFeedback && (
            <div className={cn(
              'rounded-xl p-4 mb-6 border animate-in fade-in slide-in-from-bottom-2 duration-300',
              isCorrect
                ? 'bg-green-500/5 border-green-500/20'
                : 'bg-red-500/5 border-red-500/20'
            )}>
              <div className="flex items-center gap-2 mb-1">
                {isCorrect ? (
                  <CheckCircle2 size={14} className="text-green-500" />
                ) : (
                  <XCircle size={14} className="text-red-500" />
                )}
                <span className={cn(
                  'text-xs font-semibold',
                  isCorrect ? 'text-green-500' : 'text-red-500'
                )}>
                  {isCorrect ? 'Correct!' : 'Incorrect'}
                </span>
              </div>
              {currentQuestion.explanation && (
                <p className="text-xs text-t3 leading-relaxed">
                  {currentQuestion.explanation}
                </p>
              )}
            </div>
          )}

          {/* Next Button */}
          {showFeedback && (
            <div className="flex justify-end">
              <Button onClick={handleNext} className="group">
                {globalQuestionIndex + 1 === totalQuestions ? 'View Results' : 'Next Question'}
                <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
              </Button>
            </div>
          )}
        </div>
      </Modal>
    )
  }

  if (phase === 'results') {
    return (
      <Modal open onClose={onClose} size="xl">
        <div className="relative">
          <ConfettiEffect active={showConfetti} />

          {/* Score Hero */}
          <div className="text-center mb-8">
            <div className={cn(
              'mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-4 transition-all duration-700',
              overallScore >= 80
                ? 'bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg shadow-green-500/20'
                : overallScore >= 50
                  ? 'bg-gradient-to-br from-tempo-500 to-tempo-700 shadow-lg shadow-tempo-500/20'
                  : 'bg-gradient-to-br from-gray-400 to-gray-600 shadow-lg shadow-gray-400/20'
            )}>
              <span className="text-2xl font-bold text-white">{overallScore}%</span>
            </div>
            <h2 className="text-lg font-bold text-t1 mb-1">
              {overallScore >= 80 ? 'Outstanding!' : overallScore >= 50 ? 'Good job!' : 'Keep learning!'}
            </h2>
            <p className="text-sm text-t3">
              {skippedModules.length > 0
                ? `You can skip ${skippedModules.length} of ${modules.length} modules`
                : 'We recommend completing all modules for this course'}
            </p>
          </div>

          {/* Savings Stats */}
          {skippedModules.length > 0 && (
            <div className="grid grid-cols-3 gap-3 mb-6">
              <Card padding="sm" className="text-center bg-green-500/5 border-green-500/20">
                <Zap size={16} className="text-green-500 mx-auto mb-1" />
                <p className="text-lg font-bold text-green-500">{skippedModules.length}</p>
                <p className="text-[0.6rem] text-t3">Modules Skipped</p>
              </Card>
              <Card padding="sm" className="text-center bg-tempo-50/50 border-tempo-200/30">
                <Clock size={16} className="text-tempo-600 mx-auto mb-1" />
                <p className="text-lg font-bold text-tempo-600">~{hoursSaved.toFixed(1)}h</p>
                <p className="text-[0.6rem] text-t3">Time Saved</p>
              </Card>
              <Card padding="sm" className="text-center">
                <Target size={16} className="text-t2 mx-auto mb-1" />
                <p className="text-lg font-bold text-t1">{requiredModules.length}</p>
                <p className="text-[0.6rem] text-t3">Remaining</p>
              </Card>
            </div>
          )}

          {/* Module Breakdown */}
          <div className="mb-6">
            <h3 className="text-xs font-semibold text-t1 mb-3 flex items-center gap-1.5">
              <BookOpen size={12} />
              Module Breakdown
            </h3>
            <div className="space-y-1.5">
              {results.map((result, idx) => (
                <div
                  key={result.moduleId}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-xl border transition-all duration-300',
                    'animate-in fade-in slide-in-from-left-2',
                    result.passed
                      ? 'bg-green-500/5 border-green-500/15'
                      : 'bg-card border-border'
                  )}
                  style={{ animationDelay: `${idx * 80}ms`, animationFillMode: 'backwards' }}
                >
                  {/* Status Icon */}
                  <div className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                    result.passed ? 'bg-green-500/15' : 'bg-canvas'
                  )}>
                    {result.passed ? (
                      <CheckCircle2 size={16} className="text-green-500" />
                    ) : (
                      <BookOpen size={16} className="text-t3" />
                    )}
                  </div>

                  {/* Module Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-t1 truncate">
                        {result.moduleTitle}
                      </span>
                      <Badge
                        variant={result.passed ? 'success' : 'info'}
                        className="text-[0.55rem] flex-shrink-0"
                      >
                        {result.passed ? 'Skipped' : 'Required'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <Progress
                        value={result.score}
                        max={100}
                        size="sm"
                        color={result.passed ? 'success' : 'orange'}
                        className="flex-1 max-w-[120px]"
                      />
                      <span className="text-[0.6rem] text-t3 tabular-nums">
                        {result.correctAnswers}/{result.totalQuestions} correct ({result.score}%)
                      </span>
                    </div>
                  </div>

                  {/* Estimated Time */}
                  <span className="text-[0.6rem] text-t3 flex-shrink-0 hidden sm:block">
                    ~{estimatedHoursPerModule.toFixed(1)}h
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Minimum Score Note */}
          <div className="flex items-center gap-2 p-3 bg-canvas rounded-xl mb-6">
            <Shield size={12} className="text-t3 flex-shrink-0" />
            <p className="text-[0.65rem] text-t3">
              Modules require a minimum score of {minScorePercent}% to be skipped.
              {allowRetakes && ' You can retake the test to improve your results.'}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              {allowRetakes && (
                <Button variant="outline" size="sm" onClick={handleRetake}>
                  <RotateCcw size={13} />
                  Retake Test
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={onSkip}>
                Start from Beginning
              </Button>
            </div>
            <Button onClick={handleComplete} className="group">
              {skippedModules.length > 0 ? (
                <>
                  Start Learning
                  <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                </>
              ) : (
                <>
                  Begin Course
                  <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>
    )
  }

  return null
}
