'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils/cn'
import {
  X, ChevronLeft, ChevronRight, Play, CheckCircle, Monitor,
  Code, BarChart3, Clock, Award, Bug, ChevronDown
} from 'lucide-react'

interface ScormPlayerProps {
  open: boolean
  onClose: () => void
  packageData: {
    id: string
    version: string
    metadata: { title: string; description: string; duration: string; mastery_score: number }
    entry_point: string
  }
  onComplete: (score: number, totalTime: string) => void
}

// Simulated SCORM API calls
interface ScormApiCall {
  timestamp: string
  method: string
  key: string
  value: string
}

const SCORM_SLIDES = [
  { title: 'Welcome', type: 'intro', content: 'Welcome to this interactive learning module. Navigate through the slides using the controls below.' },
  { title: 'Learning Objectives', type: 'objectives', content: 'By the end of this module, you will understand the key concepts and be able to apply them in practice.' },
  { title: 'Core Concepts', type: 'content', content: 'This section covers the fundamental principles. Pay attention to the key terms highlighted throughout.' },
  { title: 'Interactive Exercise', type: 'interactive', content: 'Apply what you have learned by completing this exercise. Select the correct answers to proceed.' },
  { title: 'Knowledge Check', type: 'quiz', content: 'Answer the following question to test your understanding of the material covered.' },
  { title: 'Summary & Next Steps', type: 'summary', content: 'Congratulations! You have completed this module. Review the key takeaways below.' },
]

export function ScormPlayer({ open, onClose, packageData, onComplete }: ScormPlayerProps) {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isComplete, setIsComplete] = useState(false)
  const [showDebug, setShowDebug] = useState(false)
  const [apiCalls, setApiCalls] = useState<ScormApiCall[]>([])
  const [quizAnswer, setQuizAnswer] = useState<string | null>(null)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const debugEndRef = useRef<HTMLDivElement>(null)

  const progress = Math.round(((currentSlide + 1) / SCORM_SLIDES.length) * 100)
  const score = quizAnswer === 'correct' ? Math.min(100, packageData.metadata.mastery_score + 10) : packageData.metadata.mastery_score - 5
  const passed = score >= packageData.metadata.mastery_score

  // Timer
  useEffect(() => {
    if (open && !isComplete) {
      timerRef.current = setInterval(() => setElapsedSeconds(s => s + 1), 1000)
      return () => { if (timerRef.current) clearInterval(timerRef.current) }
    }
  }, [open, isComplete])

  // Log SCORM API call
  const logApiCall = useCallback((method: string, key: string, value: string) => {
    const call: ScormApiCall = {
      timestamp: new Date().toISOString().split('T')[1].split('.')[0],
      method,
      key,
      value,
    }
    setApiCalls(prev => [...prev, call])
    setTimeout(() => debugEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
  }, [])

  // Initialize on open
  useEffect(() => {
    if (open) {
      const version = packageData.version
      const initMethod = version === 'scorm_1_2' ? 'LMSInitialize' : version === 'scorm_2004' ? 'Initialize' : 'xAPI.init'
      logApiCall(initMethod, '', 'true')
      logApiCall(version === 'scorm_1_2' ? 'LMSSetValue' : 'SetValue', 'cmi.core.lesson_status', 'incomplete')
    }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  const navigate = useCallback((dir: 'next' | 'prev') => {
    const nextIdx = dir === 'next' ? currentSlide + 1 : currentSlide - 1
    if (nextIdx < 0 || nextIdx >= SCORM_SLIDES.length) return

    setCurrentSlide(nextIdx)
    const version = packageData.version
    const setMethod = version === 'scorm_1_2' ? 'LMSSetValue' : version === 'scorm_2004' ? 'SetValue' : 'xAPI.statement'
    logApiCall(setMethod, 'cmi.core.lesson_location', `slide_${nextIdx + 1}`)
    logApiCall(setMethod, 'cmi.progress_measure', `${Math.round(((nextIdx + 1) / SCORM_SLIDES.length) * 100)}%`)

    if (version !== 'xapi') {
      logApiCall(version === 'scorm_1_2' ? 'LMSCommit' : 'Commit', '', 'true')
    }
  }, [currentSlide, packageData.version, logApiCall])

  const handleComplete = useCallback(() => {
    const version = packageData.version
    const setMethod = version === 'scorm_1_2' ? 'LMSSetValue' : version === 'scorm_2004' ? 'SetValue' : 'xAPI.statement'
    const finishMethod = version === 'scorm_1_2' ? 'LMSFinish' : version === 'scorm_2004' ? 'Terminate' : 'xAPI.complete'

    logApiCall(setMethod, 'cmi.core.score.raw', `${score}`)
    logApiCall(setMethod, 'cmi.core.score.max', '100')
    logApiCall(setMethod, 'cmi.core.lesson_status', passed ? 'passed' : 'failed')
    logApiCall(setMethod, 'cmi.core.total_time', formatTime(elapsedSeconds))
    logApiCall(finishMethod, '', 'true')

    setIsComplete(true)
    if (timerRef.current) clearInterval(timerRef.current)
    onComplete(score, formatTime(elapsedSeconds))
  }, [score, passed, elapsedSeconds, packageData.version, logApiCall, onComplete])

  if (!open) return null

  const slide = SCORM_SLIDES[currentSlide]
  const versionLabel = packageData.version === 'scorm_1_2' ? 'SCORM 1.2' : packageData.version === 'scorm_2004' ? 'SCORM 2004' : 'xAPI'
  const versionColor = packageData.version === 'scorm_1_2' ? '#2563eb' : packageData.version === 'scorm_2004' ? '#7c3aed' : '#059669'

  return (
    <div className="fixed inset-0 z-50 bg-[#1a1a2e] flex flex-col scorm-player-enter">
      {/* Top bar */}
      <div className="h-12 flex items-center px-4 gap-4 shrink-0 bg-[#16162a] border-b border-white/10">
        <button onClick={onClose} className="flex items-center gap-1.5 text-sm text-white/60 hover:text-white transition-colors">
          <ChevronLeft size={16} /> <span className="hidden sm:inline">Exit</span>
        </button>
        <div className="flex-1 min-w-0 text-center">
          <p className="text-sm font-medium text-white/90 truncate">{packageData.metadata.title}</p>
        </div>
        <Badge className="text-[0.55rem] px-2 py-0.5" style={{ background: `${versionColor}20`, color: versionColor, border: `1px solid ${versionColor}40` }}>
          {versionLabel}
        </Badge>
        <div className="text-xs text-white/40 font-mono">{formatTime(elapsedSeconds)}</div>
        <button
          onClick={() => setShowDebug(!showDebug)}
          className={cn('p-1.5 rounded-lg transition-colors', showDebug ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/70')}
          title="SCORM API Debug"
        >
          <Bug size={14} />
        </button>
        <button onClick={onClose} className="p-1.5 rounded-lg text-white/40 hover:text-white transition-colors">
          <X size={16} />
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-white/5">
        <div className="h-full transition-all duration-500" style={{ width: `${progress}%`, background: versionColor }} />
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Main content area */}
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          {!isComplete ? (
            <div className="scorm-slide max-w-2xl w-full">
              {/* Slide type indicator */}
              <div className="flex items-center gap-2 mb-6">
                <div className="scorm-slide-type" style={{ background: `${versionColor}20`, color: versionColor }}>
                  {slide.type === 'intro' && <Play size={12} />}
                  {slide.type === 'objectives' && <BarChart3 size={12} />}
                  {slide.type === 'content' && <Monitor size={12} />}
                  {slide.type === 'interactive' && <Code size={12} />}
                  {slide.type === 'quiz' && <CheckCircle size={12} />}
                  {slide.type === 'summary' && <Award size={12} />}
                  <span className="capitalize">{slide.type}</span>
                </div>
                <span className="text-xs text-white/30">Slide {currentSlide + 1} of {SCORM_SLIDES.length}</span>
              </div>

              {/* Slide content */}
              <h2 className="text-2xl font-bold text-white mb-4">{slide.title}</h2>
              <p className="text-white/70 leading-relaxed mb-8">{slide.content}</p>

              {/* Interactive quiz on slide 5 */}
              {slide.type === 'quiz' && (
                <div className="space-y-3 mb-8">
                  {['correct', 'wrong1', 'wrong2'].map((opt, i) => (
                    <button
                      key={opt}
                      onClick={() => {
                        setQuizAnswer(opt)
                        logApiCall(packageData.version === 'scorm_1_2' ? 'LMSSetValue' : 'SetValue', 'cmi.interactions.0.student_response', ['A', 'B', 'C'][i])
                      }}
                      className={cn(
                        'scorm-quiz-option',
                        quizAnswer === opt && (opt === 'correct' ? 'scorm-quiz-correct' : 'scorm-quiz-wrong'),
                      )}
                    >
                      <span className="scorm-quiz-label">{['A', 'B', 'C'][i]}</span>
                      <span>{opt === 'correct' ? 'The correct answer demonstrating understanding' : `An incorrect alternative ${i === 1 ? 'with common misconception' : 'that seems plausible'}`}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Simulated interactive content */}
              {slide.type === 'interactive' && (
                <div className="scorm-interactive-area mb-8">
                  <div className="grid grid-cols-3 gap-3">
                    {['Concept A', 'Concept B', 'Concept C'].map(item => (
                      <div key={item} className="scorm-interactive-card">
                        <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center mb-2">
                          <Monitor size={14} className="text-white/60" />
                        </div>
                        <p className="text-xs text-white/70">{item}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="flex items-center justify-between">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => navigate('prev')}
                  disabled={currentSlide === 0}
                  className="scorm-nav-btn"
                >
                  <ChevronLeft size={14} /> Previous
                </Button>

                {/* Slide dots */}
                <div className="flex items-center gap-1.5">
                  {SCORM_SLIDES.map((_, i) => (
                    <div key={i} className={cn(
                      'scorm-dot',
                      i === currentSlide && 'scorm-dot-active',
                      i < currentSlide && 'scorm-dot-done',
                    )} style={i === currentSlide ? { background: versionColor } : i < currentSlide ? { background: `${versionColor}80` } : undefined} />
                  ))}
                </div>

                {currentSlide < SCORM_SLIDES.length - 1 ? (
                  <Button
                    size="sm"
                    onClick={() => navigate('next')}
                    className="scorm-nav-btn"
                    style={{ background: versionColor }}
                  >
                    Next <ChevronRight size={14} />
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={handleComplete}
                    className="scorm-nav-btn"
                    style={{ background: versionColor }}
                  >
                    Complete Module <CheckCircle size={14} />
                  </Button>
                )}
              </div>
            </div>
          ) : (
            /* Completion screen */
            <div className="text-center scorm-completion-enter">
              <div className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center" style={{ background: `${versionColor}20` }}>
                {passed ? <Award size={40} style={{ color: versionColor }} /> : <BarChart3 size={40} className="text-red-400" />}
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">{passed ? 'Module Complete!' : 'Module Finished'}</h2>
              <Badge className="mb-4" style={passed ? { background: '#22c55e20', color: '#22c55e' } : { background: '#ef444420', color: '#ef4444' }}>
                {passed ? 'Passed' : 'Below Mastery Score'}
              </Badge>
              <div className="flex items-center justify-center gap-8 mt-6 mb-8">
                <div className="text-center">
                  <p className="text-3xl font-bold text-white">{score}%</p>
                  <p className="text-xs text-white/40">Score</p>
                </div>
                <div className="w-px h-10 bg-white/10" />
                <div className="text-center">
                  <p className="text-3xl font-bold text-white">{packageData.metadata.mastery_score}%</p>
                  <p className="text-xs text-white/40">Required</p>
                </div>
                <div className="w-px h-10 bg-white/10" />
                <div className="text-center">
                  <p className="text-3xl font-bold text-white">{formatTime(elapsedSeconds)}</p>
                  <p className="text-xs text-white/40">Time</p>
                </div>
              </div>
              <Button onClick={onClose} style={{ background: versionColor }}>
                Close Player
              </Button>
            </div>
          )}
        </div>

        {/* Debug panel */}
        {showDebug && (
          <div className="w-80 bg-[#0d0d1a] border-l border-white/10 flex flex-col shrink-0">
            <div className="flex items-center justify-between p-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Bug size={12} className="text-white/60" />
                <p className="text-xs font-mono text-white/60">SCORM API Monitor</p>
              </div>
              <Badge className="text-[0.5rem]" style={{ background: `${versionColor}20`, color: versionColor }}>
                {versionLabel}
              </Badge>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1 font-mono text-[0.6rem]">
              {apiCalls.map((call, i) => (
                <div key={i} className="scorm-api-call">
                  <span className="text-white/30">{call.timestamp}</span>
                  <span className="text-yellow-400 ml-2">{call.method}</span>
                  {call.key && <span className="text-cyan-400 ml-1">({call.key})</span>}
                  {call.value && <span className="text-green-400 ml-1">→ {call.value}</span>}
                </div>
              ))}
              <div ref={debugEndRef} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}
