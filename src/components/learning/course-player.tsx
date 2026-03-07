'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { useTempo } from '@/lib/store'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils/cn'
import {
  X, ChevronLeft, ChevronRight, CheckCircle, Play, FileText,
  Video, HelpCircle, Zap, Download, Lock, BookOpen, Award,
  AlertTriangle, Clock, Brain, ArrowRight, Trophy
} from 'lucide-react'

interface CoursePlayerProps {
  courseId: string
  enrollmentId: string
  onClose: () => void
}

type BlockStatus = 'locked' | 'available' | 'completed'

export function CoursePlayer({ courseId, enrollmentId, onClose }: CoursePlayerProps) {
  const {
    courses, courseBlocks, quizQuestions, enrollments,
    updateEnrollment, addAssessmentAttempt, currentEmployeeId, addToast,
  } = useTempo()

  const course = courses.find(c => c.id === courseId)
  const enrollment = enrollments.find(e => e.id === enrollmentId)

  // Get blocks for this course, sorted by module_index then order
  const blocks = useMemo(() =>
    courseBlocks
      .filter(b => b.course_id === courseId && b.status === 'published')
      .sort((a, b) => (a.module_index - b.module_index) || (a.order - b.order)),
    [courseBlocks, courseId]
  )

  // Group blocks by module
  const modules = useMemo(() => {
    const map = new Map<number, typeof blocks>()
    blocks.forEach(b => {
      if (!map.has(b.module_index)) map.set(b.module_index, [])
      map.get(b.module_index)!.push(b)
    })
    return [...map.entries()].sort((a, b) => a[0] - b[0])
  }, [blocks])

  // --- State ---
  const [currentBlockIndex, setCurrentBlockIndex] = useState(0)
  const [blockStatuses, setBlockStatuses] = useState<Map<string, BlockStatus>>(() => {
    const map = new Map<string, BlockStatus>()
    // Initialize: first block available, rest locked
    // If enrollment has progress, unlock proportionally
    const existingProgress = enrollment?.progress || 0
    const unlockedCount = Math.max(1, Math.ceil((existingProgress / 100) * blocks.length))
    blocks.forEach((b, i) => {
      if (i < unlockedCount - 1) map.set(b.id, 'completed')
      else if (i === unlockedCount - 1) map.set(b.id, 'available')
      else map.set(b.id, i === 0 ? 'available' : 'locked')
    })
    return map
  })

  // Quiz state for quiz blocks
  const [quizState, setQuizState] = useState<{
    questionIndex: number
    answers: Record<string, string>
    submitted: boolean
    score: number | null
    passed: boolean | null
  } | null>(null)

  // Completion overlay
  const [showCompletion, setShowCompletion] = useState(false)
  const [startTime] = useState(Date.now())

  const currentBlock = blocks[currentBlockIndex]
  const completedCount = [...blockStatuses.values()].filter(s => s === 'completed').length
  const progressPercent = blocks.length > 0 ? Math.round((completedCount / blocks.length) * 100) : 0

  // Sync progress to enrollment
  useEffect(() => {
    if (progressPercent > (enrollment?.progress || 0)) {
      updateEnrollment(enrollmentId, { progress: progressPercent, status: 'in_progress' })
    }
  }, [progressPercent]) // eslint-disable-line react-hooks/exhaustive-deps

  // Quiz questions for current block
  const currentQuizQuestions = useMemo(() => {
    if (!currentBlock || currentBlock.type !== 'quiz') return []
    // Content field has comma-separated question IDs
    const qIds = (currentBlock.content || '').split(',').map((s: string) => s.trim())
    // Also fall back to all questions for this course if no IDs specified
    if (qIds.length === 0 || (qIds.length === 1 && !qIds[0])) {
      return quizQuestions.filter(q => q.course_id === courseId)
    }
    return qIds.map(id => quizQuestions.find(q => q.id === id)).filter(Boolean) as typeof quizQuestions
  }, [currentBlock, quizQuestions, courseId])

  // --- Handlers ---
  const markBlockComplete = useCallback(() => {
    if (!currentBlock) return
    const newStatuses = new Map(blockStatuses)
    newStatuses.set(currentBlock.id, 'completed')

    // Unlock next block
    const nextIdx = currentBlockIndex + 1
    if (nextIdx < blocks.length) {
      const nextBlock = blocks[nextIdx]
      if (newStatuses.get(nextBlock.id) === 'locked') {
        newStatuses.set(nextBlock.id, 'available')
      }
    }

    setBlockStatuses(newStatuses)

    // Check if all blocks completed
    const newCompletedCount = [...newStatuses.values()].filter(s => s === 'completed').length
    if (newCompletedCount === blocks.length) {
      // All done!
      updateEnrollment(enrollmentId, { status: 'completed', progress: 100, completed_at: new Date().toISOString() })
      setTimeout(() => setShowCompletion(true), 400)
    } else {
      // Auto-advance to next block
      if (nextIdx < blocks.length) {
        setTimeout(() => setCurrentBlockIndex(nextIdx), 300)
      }
    }
  }, [currentBlock, currentBlockIndex, blocks, blockStatuses, enrollmentId, updateEnrollment])

  const goToBlock = useCallback((index: number) => {
    const block = blocks[index]
    if (!block) return
    const status = blockStatuses.get(block.id)
    if (status === 'locked') return
    setCurrentBlockIndex(index)
    setQuizState(null) // Reset quiz when navigating
  }, [blocks, blockStatuses])

  const startQuiz = useCallback(() => {
    setQuizState({ questionIndex: 0, answers: {}, submitted: false, score: null, passed: null })
  }, [])

  const submitQuiz = useCallback(() => {
    if (!quizState || !currentBlock) return
    const correct = currentQuizQuestions.filter(q => quizState.answers[q.id] === q.correct_answer).length
    const score = currentQuizQuestions.length > 0 ? Math.round((correct / currentQuizQuestions.length) * 100) : 0
    const passed = score >= 70

    setQuizState(prev => prev ? { ...prev, submitted: true, score, passed } : null)

    // Record attempt
    addAssessmentAttempt({
      employee_id: currentEmployeeId,
      course_id: courseId,
      quiz_title: `${currentBlock.title}`,
      score,
      passing_score: 70,
      total_questions: currentQuizQuestions.length,
      correct_answers: correct,
      time_taken_minutes: 1,
      attempt_number: 1,
      max_attempts: 3,
      status: passed ? 'passed' : 'failed',
      completed_at: new Date().toISOString(),
      answers: quizState.answers,
    })

    if (passed) {
      markBlockComplete()
    }
  }, [quizState, currentBlock, currentQuizQuestions, addAssessmentAttempt, currentEmployeeId, courseId, markBlockComplete])

  // --- Block Type Icons ---
  const blockIcon = (type: string, size = 14) => {
    switch (type) {
      case 'text': return <FileText size={size} />
      case 'video': return <Video size={size} />
      case 'quiz': return <HelpCircle size={size} />
      case 'interactive': return <Zap size={size} />
      case 'download': return <Download size={size} />
      default: return <BookOpen size={size} />
    }
  }

  const statusIcon = (status: BlockStatus) => {
    switch (status) {
      case 'completed': return <CheckCircle size={16} className="text-green-500" />
      case 'available': return <Play size={16} className="text-tempo-600" />
      case 'locked': return <Lock size={14} className="text-t3" />
    }
  }

  if (!course || !enrollment || blocks.length === 0) {
    return (
      <div className="fixed inset-0 z-50 bg-white flex items-center justify-center">
        <div className="text-center">
          <BookOpen size={48} className="mx-auto text-t3 mb-4" />
          <p className="text-t2 mb-4">No course content available yet.</p>
          <Button onClick={onClose}>Back to Learning</Button>
        </div>
      </div>
    )
  }

  // --- Completion Overlay ---
  if (showCompletion) {
    const elapsed = Math.round((Date.now() - startTime) / 60000)
    return (
      <div className="fixed inset-0 z-50 bg-gradient-to-br from-tempo-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-center max-w-md celebrate-pulse">
          <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
            <Trophy size={48} className="text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-t1 mb-2">Course Complete!</h2>
          <p className="text-t2 mb-1">{course.title}</p>
          <p className="text-xs text-t3 mb-6">{elapsed > 0 ? `${elapsed} minutes` : 'Less than a minute'} · {blocks.length} lessons completed</p>

          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-divider">
            <div className="flex items-center justify-center gap-8">
              <div className="text-center">
                <p className="text-3xl font-bold text-green-600">100%</p>
                <p className="text-xs text-t3">Progress</p>
              </div>
              <div className="w-px h-12 bg-divider" />
              <div className="text-center">
                <p className="text-3xl font-bold text-tempo-600">{blocks.length}</p>
                <p className="text-xs text-t3">Lessons</p>
              </div>
              <div className="w-px h-12 bg-divider" />
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-600"><Award size={28} /></p>
                <p className="text-xs text-t3">Certificate</p>
              </div>
            </div>
          </div>

          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={onClose}>Back to Learning</Button>
            <Button variant="primary" onClick={() => { addToast('Certificate issued!'); onClose() }}>
              <Award size={14} /> View Certificate
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // --- Main Player ---
  return (
    <div className="fixed inset-0 z-50 bg-white course-player-enter flex flex-col">
      {/* Top Bar */}
      <div className="h-14 border-b border-divider flex items-center px-4 gap-4 shrink-0 bg-white">
        <button onClick={onClose} className="flex items-center gap-1.5 text-sm text-t2 hover:text-t1 transition-colors">
          <ChevronLeft size={18} /> <span className="hidden sm:inline">Back</span>
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-t1 truncate">{course.title}</p>
          <p className="text-[0.6rem] text-t3">{course.category} · {course.duration_hours}h</p>
        </div>
        <div className="w-48 flex items-center gap-3">
          <Progress value={progressPercent} showLabel color="orange" />
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-canvas transition-colors text-t3 hover:text-t1">
          <X size={18} />
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-72 border-r border-divider overflow-y-auto bg-canvas/50 shrink-0 hidden md:block">
          <div className="p-4">
            <p className="text-xs font-semibold text-t3 uppercase tracking-wider mb-3">Course Outline</p>
            {modules.map(([moduleIdx, moduleBlocks], mi) => (
              <div key={moduleIdx} className="mb-4">
                <p className="text-[0.65rem] font-semibold text-t2 mb-2 uppercase tracking-wide">
                  Module {mi + 1}
                </p>
                <div className="space-y-1">
                  {moduleBlocks.map(block => {
                    const globalIdx = blocks.indexOf(block)
                    const status = blockStatuses.get(block.id) || 'locked'
                    const isCurrent = globalIdx === currentBlockIndex
                    return (
                      <button
                        key={block.id}
                        onClick={() => goToBlock(globalIdx)}
                        disabled={status === 'locked'}
                        className={cn(
                          'w-full text-left px-3 py-2.5 rounded-lg flex items-center gap-3 transition-all text-xs',
                          isCurrent && 'bg-tempo-50 border border-tempo-200 shadow-sm',
                          !isCurrent && status !== 'locked' && 'hover:bg-white hover:shadow-sm',
                          status === 'locked' && 'opacity-40 cursor-not-allowed',
                        )}
                      >
                        <div className="shrink-0">{statusIcon(status)}</div>
                        <div className="flex-1 min-w-0">
                          <p className={cn('font-medium truncate', isCurrent ? 'text-tempo-700' : 'text-t1')}>{block.title}</p>
                          <p className="text-[0.6rem] text-t3 flex items-center gap-1 mt-0.5">
                            {blockIcon(block.type, 10)}
                            <span className="capitalize">{block.type}</span>
                            {block.duration_minutes > 0 && <> · {block.duration_minutes}min</>}
                          </p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-3xl mx-auto px-6 py-8">
              {currentBlock && renderBlock(currentBlock)}
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="h-16 border-t border-divider flex items-center justify-between px-6 shrink-0 bg-white">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => goToBlock(currentBlockIndex - 1)}
              disabled={currentBlockIndex === 0}
            >
              <ChevronLeft size={14} /> Previous
            </Button>

            <div className="text-xs text-t3">
              {currentBlockIndex + 1} of {blocks.length} lessons
            </div>

            {currentBlockIndex < blocks.length - 1 ? (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  const status = blockStatuses.get(currentBlock?.id || '')
                  if (status === 'completed') {
                    goToBlock(currentBlockIndex + 1)
                  }
                }}
                disabled={blockStatuses.get(currentBlock?.id || '') !== 'completed'}
              >
                Next <ChevronRight size={14} />
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  if (blockStatuses.get(currentBlock?.id || '') === 'completed' && completedCount === blocks.length) {
                    setShowCompletion(true)
                  }
                }}
                disabled={completedCount < blocks.length}
              >
                Finish Course <Award size={14} />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )

  // --- Block Renderers ---
  function renderBlock(block: typeof blocks[0]) {
    const status = blockStatuses.get(block.id) || 'locked'

    switch (block.type) {
      case 'text':
        return renderTextBlock(block, status)
      case 'video':
        return renderVideoBlock(block, status)
      case 'quiz':
        return renderQuizBlock(block, status)
      case 'interactive':
        return renderInteractiveBlock(block, status)
      case 'download':
        return renderDownloadBlock(block, status)
      default:
        return renderTextBlock(block, status)
    }
  }

  function renderRichContent(text: string) {
    const lines = text.split('\n')
    const elements: React.ReactNode[] = []
    let listItems: string[] = []
    let stepCounter = 0
    let key = 0

    const parseBold = (t: string): React.ReactNode[] => {
      const parts = t.split(/\*\*(.*?)\*\*/g)
      return parts.map((part, i) =>
        i % 2 === 1 ? <strong key={i}>{part}</strong> : part
      )
    }

    const flushList = () => {
      if (listItems.length > 0) {
        elements.push(
          <ul key={key++}>
            {listItems.map((item, i) => <li key={i}>{parseBold(item)}</li>)}
          </ul>
        )
        listItems = []
      }
    }

    for (let li = 0; li < lines.length; li++) {
      const line = lines[li]
      const trimmed = line.trim()
      if (!trimmed) { flushList(); continue }

      if (trimmed.startsWith('## ')) {
        flushList()
        elements.push(<h3 key={key++}>{trimmed.slice(3)}</h3>)
      } else if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
        listItems.push(trimmed.slice(2))
      } else if (trimmed.startsWith('> ')) {
        flushList()
        const calloutText = trimmed.slice(2)
        const isInfo = calloutText.startsWith('ℹ️')
        const isSuccess = calloutText.startsWith('✅')
        const cls = isInfo ? 'cp-callout cp-callout-info' : isSuccess ? 'cp-callout cp-callout-success' : 'cp-callout'
        elements.push(<div key={key++} className={cls}>{parseBold(calloutText)}</div>)
      } else if (trimmed === '---') {
        flushList()
        elements.push(<div key={key++} className="cp-divider" />)
      } else if (/^\d+\.\s/.test(trimmed)) {
        flushList()
        stepCounter++
        const stepText = trimmed.replace(/^\d+\.\s/, '')
        elements.push(
          <div key={key++} className="cp-step">
            <div className="cp-step-num">{stepCounter}</div>
            <div className="cp-step-content">{parseBold(stepText)}</div>
          </div>
        )
      } else {
        flushList()
        stepCounter = 0
        elements.push(<p key={key++}>{parseBold(trimmed)}</p>)
      }
    }
    flushList()
    return elements
  }

  function renderTextBlock(block: typeof blocks[0], status: BlockStatus) {
    return (
      <div className="course-player-prose">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
            <FileText size={16} className="text-blue-600" />
          </div>
          <div>
            <Badge>Reading</Badge>
            <span className="text-xs text-t3 ml-2">{block.duration_minutes} min</span>
          </div>
        </div>

        <h2 className="text-xl font-bold text-t1 mb-4">{block.title}</h2>
        <div>{renderRichContent(block.content)}</div>

        {status !== 'completed' && (
          <div className="mt-8 pt-6 border-t border-divider">
            <Button variant="primary" onClick={markBlockComplete}>
              <CheckCircle size={14} /> Mark as Read
            </Button>
          </div>
        )}
        {status === 'completed' && (
          <div className="mt-8 pt-6 border-t border-divider flex items-center gap-2 text-green-600 text-sm">
            <CheckCircle size={16} /> Completed
          </div>
        )}
      </div>
    )
  }

  function renderVideoBlock(block: typeof blocks[0], status: BlockStatus) {
    return (
      <div>
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
            <Video size={16} className="text-purple-600" />
          </div>
          <div>
            <Badge>Video</Badge>
            <span className="text-xs text-t3 ml-2">{block.duration_minutes} min</span>
          </div>
        </div>

        <h2 className="text-xl font-bold text-t1 mb-4">{block.title}</h2>

        <div className="aspect-video bg-gray-900 rounded-xl overflow-hidden mb-4 relative flex items-center justify-center">
          {/* In a real app this would be a video player */}
          <div className="text-center">
            <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-3 cursor-pointer hover:bg-white/30 transition-colors">
              <Play size={32} className="text-white ml-1" />
            </div>
            <p className="text-white/60 text-sm">{block.title}</p>
            <p className="text-white/40 text-xs mt-1">{block.duration_minutes} min</p>
          </div>
        </div>

        {status !== 'completed' && (
          <Button variant="primary" onClick={markBlockComplete}>
            <CheckCircle size={14} /> Mark as Watched
          </Button>
        )}
        {status === 'completed' && (
          <div className="flex items-center gap-2 text-green-600 text-sm">
            <CheckCircle size={16} /> Completed
          </div>
        )}
      </div>
    )
  }

  function renderQuizBlock(block: typeof blocks[0], status: BlockStatus) {
    if (currentQuizQuestions.length === 0) {
      return (
        <div className="text-center py-12">
          <HelpCircle size={48} className="mx-auto text-t3 mb-4" />
          <p className="text-t2">No quiz questions available for this section.</p>
          {status !== 'completed' && (
            <Button variant="primary" className="mt-4" onClick={markBlockComplete}>Skip & Continue</Button>
          )}
        </div>
      )
    }

    // Not started quiz yet
    if (!quizState) {
      return (
        <div className="text-center py-12">
          <div className="w-20 h-20 rounded-2xl bg-tempo-50 flex items-center justify-center mx-auto mb-6">
            <Brain size={36} className="text-tempo-600" />
          </div>
          <h2 className="text-xl font-bold text-t1 mb-2">{block.title}</h2>
          <p className="text-t3 text-sm mb-1">{currentQuizQuestions.length} questions · {block.duration_minutes} min</p>
          <p className="text-t3 text-xs mb-6">You need 70% to pass</p>
          {status === 'completed' ? (
            <div className="flex items-center gap-2 text-green-600 text-sm justify-center">
              <CheckCircle size={16} /> Already Passed
            </div>
          ) : (
            <Button variant="primary" size="lg" onClick={startQuiz}>
              <Play size={16} /> Start Quiz
            </Button>
          )}
        </div>
      )
    }

    // Quiz submitted — show results
    if (quizState.submitted) {
      return (
        <div className="text-center py-12">
          <div className={cn('w-20 h-20 rounded-full mx-auto flex items-center justify-center mb-4',
            quizState.passed ? 'bg-green-100' : 'bg-red-100')}>
            {quizState.passed ? <CheckCircle size={36} className="text-green-600" /> : <AlertTriangle size={36} className="text-red-600" />}
          </div>
          <h3 className="text-lg font-bold text-t1 mb-1">Quiz Results</h3>
          <Badge variant={quizState.passed ? 'success' : 'error'} className="mb-4">
            {quizState.passed ? 'Passed' : 'Failed'}
          </Badge>
          <p className="text-3xl font-bold text-t1 mb-1">{quizState.score}%</p>
          <p className="text-xs text-t3 mb-6">70% required to pass</p>
          {!quizState.passed && (
            <Button variant="primary" onClick={startQuiz}>
              <ArrowRight size={14} /> Retry Quiz
            </Button>
          )}
        </div>
      )
    }

    // Active quiz — show current question
    const currentQ = currentQuizQuestions[quizState.questionIndex]
    if (!currentQ) return null

    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-sm font-semibold text-t1">{block.title}</h3>
            <p className="text-xs text-t3">Question {quizState.questionIndex + 1} of {currentQuizQuestions.length}</p>
          </div>
          <Progress
            value={Math.round(((quizState.questionIndex + 1) / currentQuizQuestions.length) * 100)}
            showLabel
            className="w-32"
          />
        </div>

        <div className="bg-canvas rounded-xl p-6 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Badge>
              {currentQ.type === 'multiple_choice' ? 'Multiple Choice' :
               currentQ.type === 'true_false' ? 'True / False' :
               currentQ.type === 'fill_blank' ? 'Fill in the Blank' :
               currentQ.type === 'matching' ? 'Matching' : 'Essay'}
            </Badge>
            <span className="text-xs text-t3">{currentQ.points} pts</span>
          </div>
          <p className="text-sm font-medium text-t1 mb-4">{currentQ.question}</p>

          {/* Multiple choice / True-false */}
          {(currentQ.type === 'multiple_choice' || currentQ.type === 'true_false') && (
            <div className="space-y-2">
              {(currentQ.type === 'true_false' ? ['True', 'False'] : (currentQ.options || [])).map((opt: string, i: number) => (
                <button
                  key={i}
                  onClick={() => setQuizState(prev => prev ? { ...prev, answers: { ...prev.answers, [currentQ.id]: opt } } : null)}
                  className={cn(
                    'w-full text-left p-3 rounded-lg border text-sm transition-colors',
                    quizState.answers[currentQ.id] === opt
                      ? 'border-tempo-500 bg-tempo-50 text-tempo-700'
                      : 'border-divider hover:border-tempo-300 bg-white'
                  )}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}

          {/* Fill in the blank */}
          {currentQ.type === 'fill_blank' && (
            <input
              type="text"
              value={quizState.answers[currentQ.id] || ''}
              onChange={(e) => setQuizState(prev => prev ? { ...prev, answers: { ...prev.answers, [currentQ.id]: e.target.value } } : null)}
              className="w-full p-3 border border-divider rounded-lg text-sm bg-white focus:outline-none focus:border-tempo-500"
              placeholder="Type your answer..."
            />
          )}

          {/* Essay */}
          {currentQ.type === 'essay' && (
            <textarea
              value={quizState.answers[currentQ.id] || ''}
              onChange={(e) => setQuizState(prev => prev ? { ...prev, answers: { ...prev.answers, [currentQ.id]: e.target.value } } : null)}
              className="w-full p-3 border border-divider rounded-lg text-sm bg-white focus:outline-none focus:border-tempo-500 h-32 resize-none"
              placeholder="Write your response..."
            />
          )}

          {/* Matching */}
          {currentQ.type === 'matching' && (
            <div className="space-y-2 text-sm text-t2">
              <p className="text-xs text-t3 mb-2">Match the items correctly:</p>
              {(currentQ.options || []).map((pair: string, i: number) => {
                const [term, def] = pair.split(':')
                return (
                  <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-white border border-divider">
                    <span className="font-medium text-t1 w-1/2">{term}</span>
                    <ArrowRight size={12} className="text-t3" />
                    <span className="text-t2 w-1/2">{def}</span>
                  </div>
                )
              })}
              <Button
                size="sm"
                variant="outline"
                className="mt-2"
                onClick={() => setQuizState(prev => prev ? { ...prev, answers: { ...prev.answers, [currentQ.id]: currentQ.correct_answer } } : null)}
              >
                Confirm Matches
              </Button>
            </div>
          )}
        </div>

        {/* Quiz Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setQuizState(prev => prev && prev.questionIndex > 0 ? { ...prev, questionIndex: prev.questionIndex - 1 } : prev)}
            disabled={quizState.questionIndex === 0}
          >
            <ChevronLeft size={14} /> Previous
          </Button>
          {quizState.questionIndex < currentQuizQuestions.length - 1 ? (
            <Button
              size="sm"
              onClick={() => setQuizState(prev => prev ? { ...prev, questionIndex: prev.questionIndex + 1 } : null)}
            >
              Next <ChevronRight size={14} />
            </Button>
          ) : (
            <Button size="sm" onClick={submitQuiz}>
              Submit Quiz <CheckCircle size={14} />
            </Button>
          )}
        </div>
      </div>
    )
  }

  function renderInteractiveBlock(block: typeof blocks[0], status: BlockStatus) {
    return (
      <div className="text-center py-8">
        <div className="w-20 h-20 rounded-2xl bg-yellow-50 flex items-center justify-center mx-auto mb-6">
          <Zap size={36} className="text-yellow-600" />
        </div>
        <h2 className="text-xl font-bold text-t1 mb-3">{block.title}</h2>
        <p className="text-t2 text-sm max-w-lg mx-auto mb-6">{block.content}</p>

        <div className="max-w-md mx-auto bg-canvas rounded-xl p-6 mb-6 border border-divider">
          <div className="flex items-center gap-3 mb-3">
            <Clock size={14} className="text-t3" />
            <span className="text-xs text-t3">{block.duration_minutes} min estimated</span>
          </div>
          <p className="text-xs text-t3">Complete this interactive activity to proceed.</p>
        </div>

        {status !== 'completed' ? (
          <Button variant="primary" size="lg" onClick={markBlockComplete}>
            <CheckCircle size={16} /> Complete Activity
          </Button>
        ) : (
          <div className="flex items-center gap-2 text-green-600 text-sm justify-center">
            <CheckCircle size={16} /> Completed
          </div>
        )}
      </div>
    )
  }

  function renderDownloadBlock(block: typeof blocks[0], status: BlockStatus) {
    return (
      <div className="text-center py-8">
        <div className="w-20 h-20 rounded-2xl bg-green-50 flex items-center justify-center mx-auto mb-6">
          <Download size={36} className="text-green-600" />
        </div>
        <h2 className="text-xl font-bold text-t1 mb-3">{block.title}</h2>
        <p className="text-t3 text-sm mb-6">Download this resource to continue</p>

        <div className="max-w-sm mx-auto bg-canvas rounded-xl p-6 mb-6 border border-divider flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-white flex items-center justify-center border border-divider">
            <FileText size={20} className="text-tempo-600" />
          </div>
          <div className="text-left flex-1">
            <p className="text-sm font-medium text-t1">{block.title}</p>
            <p className="text-xs text-t3">{block.content?.split('/').pop()}</p>
          </div>
          <a href={block.content} target="_blank" rel="noopener noreferrer"
            className="p-2 rounded-lg hover:bg-white transition-colors">
            <Download size={16} className="text-tempo-600" />
          </a>
        </div>

        {status !== 'completed' ? (
          <Button variant="primary" onClick={markBlockComplete}>
            <CheckCircle size={14} /> Mark as Downloaded
          </Button>
        ) : (
          <div className="flex items-center gap-2 text-green-600 text-sm justify-center">
            <CheckCircle size={16} /> Completed
          </div>
        )}
      </div>
    )
  }
}
