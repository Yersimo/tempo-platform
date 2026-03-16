'use client'

import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { useTempo } from '@/lib/store'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils/cn'
import {
  X, ChevronLeft, ChevronRight, CheckCircle, Play, FileText,
  Video, HelpCircle, Zap, Download, Lock, BookOpen, Award,
  AlertTriangle, Clock, Brain, ArrowRight, Trophy, Sparkles,
  ChevronDown, BarChart3, Target, GraduationCap, Menu, MessageCircle,
  Image, Code, Minus, Quote, Globe, Type, LayoutGrid, MousePointerClick, Shield, Copy
} from 'lucide-react'
import AITutor from '@/components/learning/ai-tutor'

interface CoursePlayerProps {
  courseId: string
  enrollmentId: string
  onClose: () => void
  onCourseCompleted?: (courseId: string) => void
  onQuizPassed?: (courseId: string, quizTitle: string, score: number) => void
}

type BlockStatus = 'locked' | 'available' | 'completed'

// Estimate reading time from text content
function estimateReadingTime(text: string): number {
  const words = text.split(/\s+/).length
  return Math.max(1, Math.ceil(words / 200)) // 200 wpm average
}

// Draggable AI Tutor button — can be repositioned by the user, collapsible to a thin bar
function DraggableAITutorButton({ isOpen, onToggle }: { isOpen: boolean; onToggle: () => void }) {
  const [pos, setPos] = useState({ x: 16, y: 80 }) // top-right default (16px from right, 80px from top)
  const [isDragging, setIsDragging] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const dragRef = useRef<{ startX: number; startY: number; startPosX: number; startPosY: number } | null>(null)
  const btnRef = useRef<HTMLDivElement>(null)
  const wasDragged = useRef(false)

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    setIsDragging(true)
    wasDragged.current = false
    dragRef.current = { startX: e.clientX, startY: e.clientY, startPosX: pos.x, startPosY: pos.y }
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }, [pos])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging || !dragRef.current) return
    const dx = e.clientX - dragRef.current.startX
    const dy = e.clientY - dragRef.current.startY
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) wasDragged.current = true
    const newX = Math.max(0, Math.min(window.innerWidth - 56, dragRef.current.startPosX - dx))
    const newY = Math.max(0, Math.min(window.innerHeight - 56, dragRef.current.startPosY + dy))
    setPos({ x: newX, y: newY })
  }, [isDragging])

  const handlePointerUp = useCallback(() => {
    setIsDragging(false)
    dragRef.current = null
  }, [])

  if (isOpen) return null // hide button when panel is open

  return (
    <div
      ref={btnRef}
      className="fixed z-[60] select-none"
      style={{ right: pos.x, top: pos.y, touchAction: 'none' }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {collapsed ? (
        // Collapsed: thin vertical bar
        <button
          onClick={() => { if (!wasDragged.current) setCollapsed(false) }}
          className="w-6 h-14 rounded-full bg-white/90 border border-divider shadow-md flex flex-col items-center justify-center gap-1 hover:bg-tempo-50 transition-colors cursor-grab active:cursor-grabbing"
          title="Expand AI Tutor"
        >
          <Sparkles size={10} className="text-tempo-600" />
          <span className="text-[6px] text-tempo-600 font-bold">AI</span>
        </button>
      ) : (
        // Expanded: floating pill button
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => { if (!wasDragged.current) onToggle() }}
            className="h-10 px-3 rounded-l-full bg-white border border-r-0 border-divider shadow-md flex items-center gap-2 hover:bg-tempo-50 transition-colors cursor-grab active:cursor-grabbing group"
            title="Open AI Tutor"
          >
            <Sparkles size={14} className="text-tempo-600" />
            <span className="text-xs font-medium text-t1 group-hover:text-tempo-600">AI Tutor</span>
          </button>
          <button
            onClick={() => setCollapsed(true)}
            className="h-10 w-7 rounded-r-full bg-white border border-l-0 border-divider shadow-md flex items-center justify-center hover:bg-red-50 transition-colors"
            title="Minimize"
          >
            <ChevronRight size={12} className="text-t3" />
          </button>
        </div>
      )}
    </div>
  )
}

export function CoursePlayer({ courseId, enrollmentId, onClose, onCourseCompleted, onQuizPassed }: CoursePlayerProps) {
  const {
    courses, courseBlocks, quizQuestions, enrollments,
    updateEnrollment, addAssessmentAttempt, currentEmployeeId, addToast,
  } = useTempo()

  // Safe option text extractor — handles both string and {id, text} object formats
  const optText = (opt: any): string => typeof opt === 'string' ? opt : (opt?.text || opt?.label || String(opt))

  const course = courses.find(c => c.id === courseId)
  const enrollment = enrollments.find(e => e.id === enrollmentId)

  // Get blocks for this course, sorted by module_index then order
  const blocks = useMemo(() =>
    courseBlocks
      .filter(b => b.course_id === courseId && (b.status === 'published' || b.status === 'draft'))
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
  const initialUnlockedCount = Math.max(1, Math.ceil(((enrollment?.progress || 0) / 100) * blocks.length))
  const [currentBlockIndex, setCurrentBlockIndex] = useState(Math.min(initialUnlockedCount - 1, blocks.length - 1))
  const [blockStatuses, setBlockStatuses] = useState<Map<string, BlockStatus>>(() => {
    const map = new Map<string, BlockStatus>()
    const unlockedCount = initialUnlockedCount
    blocks.forEach((b, i) => {
      if (i < unlockedCount - 1) map.set(b.id, 'completed')
      else if (i === unlockedCount - 1) map.set(b.id, 'available')
      else map.set(b.id, i === 0 ? 'available' : 'locked')
    })
    return map
  })

  // Block transition direction for animations
  const [transitionDir, setTransitionDir] = useState<'forward' | 'backward'>('forward')
  const [isTransitioning, setIsTransitioning] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  // Mobile sidebar
  const [showMobileSidebar, setShowMobileSidebar] = useState(false)

  // AI Tutor
  const [showAITutor, setShowAITutor] = useState(false)

  // Collapsed module state
  const [collapsedModules, setCollapsedModules] = useState<Set<number>>(new Set())

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
    const content = (currentBlock.content || '').trim()
    // Check if content is inline JSON quiz (from course builder templates)
    if (content.startsWith('{') || content.startsWith('[')) {
      try {
        const parsed = JSON.parse(content)
        const items = Array.isArray(parsed) ? parsed : [parsed]
        return items.map((item: any, i: number) => ({
          id: `inline-${currentBlock.id}-${i}`,
          course_id: courseId,
          question: item.question || '',
          type: 'multiple_choice' as const,
          options: item.options || [],
          correct_answer: item.options?.[item.correct ?? 0] || '',
          points: 10,
          order: i,
        }))
      } catch { /* fall through to ID-based lookup */ }
    }
    const qIds = content.split(',').map((s: string) => s.trim())
    if (qIds.length === 0 || (qIds.length === 1 && !qIds[0])) {
      return quizQuestions.filter(q => q.course_id === courseId)
    }
    return qIds.map(id => quizQuestions.find(q => q.id === id)).filter(Boolean) as typeof quizQuestions
  }, [currentBlock, quizQuestions, courseId])

  // Module progress calculations
  const moduleProgress = useMemo(() => {
    return modules.map(([, moduleBlocks]) => {
      const completed = moduleBlocks.filter(b => blockStatuses.get(b.id) === 'completed').length
      return { completed, total: moduleBlocks.length, percent: Math.round((completed / moduleBlocks.length) * 100) }
    })
  }, [modules, blockStatuses])

  // Animated block navigation
  const navigateToBlock = useCallback((index: number, direction?: 'forward' | 'backward') => {
    const block = blocks[index]
    if (!block) return
    const status = blockStatuses.get(block.id)
    if (status === 'locked') return

    const dir = direction || (index > currentBlockIndex ? 'forward' : 'backward')
    setTransitionDir(dir)
    setIsTransitioning(true)

    setTimeout(() => {
      setCurrentBlockIndex(index)
      setQuizState(null)
      setIsTransitioning(false)
      if (contentRef.current) contentRef.current.scrollTop = 0
    }, 200)
  }, [blocks, blockStatuses, currentBlockIndex])

  // --- Handlers ---
  const markBlockComplete = useCallback(() => {
    if (!currentBlock) return
    const newStatuses = new Map(blockStatuses)
    newStatuses.set(currentBlock.id, 'completed')

    const nextIdx = currentBlockIndex + 1
    if (nextIdx < blocks.length) {
      const nextBlock = blocks[nextIdx]
      if (newStatuses.get(nextBlock.id) === 'locked') {
        newStatuses.set(nextBlock.id, 'available')
      }
    }

    setBlockStatuses(newStatuses)

    const newCompletedCount = [...newStatuses.values()].filter(s => s === 'completed').length
    if (newCompletedCount === blocks.length) {
      updateEnrollment(enrollmentId, { status: 'completed', progress: 100, completed_at: new Date().toISOString() })
      onCourseCompleted?.(courseId)
      setTimeout(() => setShowCompletion(true), 400)
    } else {
      if (nextIdx < blocks.length) {
        setTimeout(() => navigateToBlock(nextIdx, 'forward'), 300)
      }
    }
  }, [currentBlock, currentBlockIndex, blocks, blockStatuses, enrollmentId, updateEnrollment, navigateToBlock])

  const startQuiz = useCallback(() => {
    setQuizState({ questionIndex: 0, answers: {}, submitted: false, score: null, passed: null })
  }, [])

  const submitQuiz = useCallback(() => {
    if (!quizState || !currentBlock) return
    const correct = currentQuizQuestions.filter(q => quizState.answers[q.id] === q.correct_answer).length
    const score = currentQuizQuestions.length > 0 ? Math.round((correct / currentQuizQuestions.length) * 100) : 0
    const passed = score >= 70

    setQuizState(prev => prev ? { ...prev, submitted: true, score, passed } : null)

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
      onQuizPassed?.(courseId, currentBlock.title, score)
      markBlockComplete()
    }
  }, [quizState, currentBlock, currentQuizQuestions, addAssessmentAttempt, currentEmployeeId, courseId, markBlockComplete, onQuizPassed])

  // --- Block Type Icons ---
  const blockIcon = (type: string, size = 14) => {
    switch (type) {
      case 'text': return <FileText size={size} />
      case 'video': return <Video size={size} />
      case 'quiz': return <HelpCircle size={size} />
      case 'interactive': return <Zap size={size} />
      case 'infographic': return <BarChart3 size={size} />
      case 'download': return <Download size={size} />
      case 'image': return <Image size={size} />
      case 'heading': return <Type size={size} />
      case 'callout': return <Quote size={size} />
      case 'code': return <Code size={size} />
      case 'accordion': return <ChevronDown size={size} />
      case 'columns': return <LayoutGrid size={size} />
      case 'divider': return <Minus size={size} />
      case 'embed': return <Globe size={size} />
      case 'button': return <MousePointerClick size={size} />
      default: return <BookOpen size={size} />
    }
  }

  const blockTypeLabel = (type: string) => {
    switch (type) {
      case 'text': return 'Reading'
      case 'video': return 'Video'
      case 'infographic': return 'Visual Summary'
      case 'quiz': return 'Quiz'
      case 'interactive': return 'Activity'
      case 'download': return 'Resource'
      case 'image': return 'Image'
      case 'heading': return 'Section'
      case 'callout': return 'Note'
      case 'code': return 'Code'
      case 'accordion': return 'Expand'
      case 'columns': return 'Columns'
      case 'divider': return 'Break'
      case 'embed': return 'Embed'
      case 'button': return 'Action'
      default: return 'Lesson'
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
      <div className="fixed inset-0 z-50 cp-completion-bg flex items-center justify-center p-4">
        {/* Confetti particles */}
        <div className="cp-confetti-container">
          {Array.from({ length: 50 }).map((_, i) => (
            <div key={i} className="cp-confetti" style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 3}s`,
              backgroundColor: ['#f97316', '#3b82f6', '#22c55e', '#a855f7', '#eab308', '#ec4899'][i % 6],
            }} />
          ))}
        </div>

        <div className="text-center max-w-lg relative z-10 cp-completion-enter">
          {/* Trophy with glow */}
          <div className="cp-trophy-glow mx-auto mb-8">
            <div className="w-28 h-28 rounded-full bg-gradient-to-br from-amber-100 to-amber-50 flex items-center justify-center mx-auto shadow-lg">
              <Trophy size={52} className="text-amber-500" />
            </div>
          </div>

          <h2 className="text-3xl font-bold text-t1 mb-2">Congratulations!</h2>
          <p className="text-lg text-t2 mb-1">You completed</p>
          <p className="text-lg font-semibold text-t1 mb-8">{course.title}</p>

          {/* Stats cards */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="cp-stat-card">
              <div className="cp-stat-icon bg-green-50">
                <Target size={20} className="text-green-600" />
              </div>
              <p className="text-2xl font-bold text-t1">100%</p>
              <p className="text-xs text-t3">Score</p>
            </div>
            <div className="cp-stat-card">
              <div className="cp-stat-icon bg-blue-50">
                <BarChart3 size={20} className="text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-t1">{blocks.length}</p>
              <p className="text-xs text-t3">Lessons</p>
            </div>
            <div className="cp-stat-card">
              <div className="cp-stat-icon bg-purple-50">
                <Clock size={20} className="text-purple-600" />
              </div>
              <p className="text-2xl font-bold text-t1">{elapsed > 0 ? `${elapsed}m` : '<1m'}</p>
              <p className="text-xs text-t3">Duration</p>
            </div>
          </div>

          {/* Certificate card */}
          <div className="cp-certificate-card mb-8">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-tempo-500 to-tempo-600 flex items-center justify-center shadow-md">
                <GraduationCap size={28} className="text-white" />
              </div>
              <div className="text-left flex-1">
                <p className="font-semibold text-t1">Certificate of Completion</p>
                <p className="text-sm text-t3">{course.title}</p>
              </div>
              <Award size={24} className="text-tempo-500" />
            </div>
          </div>

          <div className="flex gap-3 justify-center">
            <Button variant="outline" size="lg" onClick={onClose}>Back to Learning</Button>
            <Button variant="primary" size="lg" onClick={() => { onClose() }}>
              <Award size={16} /> View Certificate
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Current module info
  const currentModuleIndex = modules.findIndex(([, mBlocks]) => mBlocks.some(b => b.id === currentBlock?.id))

  // --- Main Player ---
  return (
    <div className="fixed inset-0 z-50 bg-[#fafafa] course-player-enter flex flex-col">
      {/* Top Bar — Clean, minimal like Sana */}
      <div className="h-14 border-b border-divider/60 flex items-center px-5 gap-4 shrink-0 bg-white/80 backdrop-blur-sm">
        <button onClick={onClose} className="flex items-center gap-1.5 text-sm text-t2 hover:text-t1 transition-colors cp-hover-lift">
          <ChevronLeft size={18} /> <span className="hidden sm:inline">Back</span>
        </button>

        {/* Mobile menu toggle */}
        <button
          onClick={() => setShowMobileSidebar(!showMobileSidebar)}
          className="md:hidden p-1.5 rounded-lg hover:bg-canvas transition-colors text-t3 hover:text-t1"
        >
          <Menu size={18} />
        </button>

        <div className="flex-1 min-w-0 text-center">
          <p className="text-sm font-semibold text-t1 truncate">{course.title}</p>
        </div>

        {/* Segmented progress bar */}
        <div className="hidden sm:flex items-center gap-1.5">
          {modules.map(([, moduleBlocks], mi) => {
            const mp = moduleProgress[mi]
            return (
              <div key={mi} className="flex items-center gap-0.5">
                {moduleBlocks.map(block => {
                  const status = blockStatuses.get(block.id)
                  return (
                    <div
                      key={block.id}
                      className={cn(
                        'cp-progress-segment',
                        status === 'completed' && 'cp-progress-completed',
                        blocks.indexOf(block) === currentBlockIndex && 'cp-progress-current',
                      )}
                      title={block.title}
                    />
                  )
                })}
                {mi < modules.length - 1 && <div className="w-1.5" />}
              </div>
            )
          })}
          <span className="text-xs font-medium text-t2 ml-2">{progressPercent}%</span>
        </div>

        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-canvas transition-colors text-t3 hover:text-t1">
          <X size={18} />
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar — Enhanced with module progress circles */}
        <div className={cn(
          'cp-sidebar',
          showMobileSidebar && 'cp-sidebar-mobile-open'
        )}>
          {/* Mobile close */}
          <div className="md:hidden flex items-center justify-between p-4 border-b border-divider/40">
            <p className="text-sm font-semibold text-t1">Course Outline</p>
            <button onClick={() => setShowMobileSidebar(false)} className="p-1 rounded-lg hover:bg-canvas"><X size={16} /></button>
          </div>

          <div className="p-4 overflow-y-auto flex-1">
            {/* Overall progress */}
            <div className="mb-5 p-3 rounded-xl bg-white border border-divider/50">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-t1">Your Progress</p>
                <span className="text-xs font-bold text-tempo-600">{progressPercent}%</span>
              </div>
              <div className="cp-progress-track">
                <div className="cp-progress-fill" style={{ width: `${progressPercent}%` }} />
              </div>
              <p className="text-[0.6rem] text-t3 mt-1.5">{completedCount} of {blocks.length} lessons completed</p>
            </div>

            {modules.map(([moduleIdx, moduleBlocks], mi) => {
              const mp = moduleProgress[mi]
              const isCollapsed = collapsedModules.has(moduleIdx)
              const isCurrentModule = mi === currentModuleIndex

              return (
                <div key={moduleIdx} className="mb-3">
                  {/* Module header with progress ring */}
                  <button
                    onClick={() => {
                      const next = new Set(collapsedModules)
                      isCollapsed ? next.delete(moduleIdx) : next.add(moduleIdx)
                      setCollapsedModules(next)
                    }}
                    className={cn(
                      'w-full flex items-center gap-3 p-2 rounded-lg transition-colors mb-1',
                      isCurrentModule ? 'bg-tempo-50/60' : 'hover:bg-white/80',
                    )}
                  >
                    {/* Mini progress ring */}
                    <div className="cp-module-ring shrink-0">
                      <svg width="28" height="28" viewBox="0 0 28 28">
                        <circle cx="14" cy="14" r="11" fill="none" stroke="var(--color-divider)" strokeWidth="2.5" />
                        <circle
                          cx="14" cy="14" r="11" fill="none"
                          stroke={mp.percent === 100 ? '#22c55e' : 'var(--color-tempo-500)'}
                          strokeWidth="2.5"
                          strokeDasharray={`${(mp.percent / 100) * 69.115} 69.115`}
                          strokeLinecap="round"
                          transform="rotate(-90 14 14)"
                          className="transition-all duration-500"
                        />
                      </svg>
                      {mp.percent === 100 ? (
                        <CheckCircle size={12} className="absolute inset-0 m-auto text-green-500" />
                      ) : (
                        <span className="absolute inset-0 flex items-center justify-center text-[0.5rem] font-bold text-t2">
                          {mi + 1}
                        </span>
                      )}
                    </div>

                    <div className="flex-1 text-left min-w-0">
                      <p className={cn(
                        'text-xs font-semibold truncate',
                        isCurrentModule ? 'text-tempo-700' : 'text-t1'
                      )}>Module {mi + 1}</p>
                      <p className="text-[0.6rem] text-t3">{mp.completed}/{mp.total} lessons</p>
                    </div>

                    <ChevronDown size={14} className={cn(
                      'text-t3 transition-transform duration-200',
                      isCollapsed && '-rotate-90'
                    )} />
                  </button>

                  {/* Block list */}
                  {!isCollapsed && (
                    <div className="ml-1 space-y-0.5 cp-module-blocks-enter">
                      {moduleBlocks.map(block => {
                        const globalIdx = blocks.indexOf(block)
                        const status = blockStatuses.get(block.id) || 'locked'
                        const isCurrent = globalIdx === currentBlockIndex
                        return (
                          <button
                            key={block.id}
                            onClick={() => { navigateToBlock(globalIdx); setShowMobileSidebar(false) }}
                            disabled={status === 'locked'}
                            className={cn(
                              'cp-sidebar-item',
                              isCurrent && 'cp-sidebar-item-active',
                              !isCurrent && status !== 'locked' && 'cp-sidebar-item-available',
                              status === 'locked' && 'cp-sidebar-item-locked',
                            )}
                          >
                            {/* Status indicator */}
                            <div className={cn(
                              'cp-block-status-dot',
                              status === 'completed' && 'cp-block-dot-completed',
                              status === 'available' && isCurrent && 'cp-block-dot-current',
                              status === 'available' && !isCurrent && 'cp-block-dot-available',
                              status === 'locked' && 'cp-block-dot-locked',
                            )}>
                              {status === 'completed' ? <CheckCircle size={10} className="text-white" /> : null}
                            </div>

                            <div className="flex-1 min-w-0">
                              <p className={cn(
                                'text-xs truncate',
                                isCurrent ? 'font-semibold text-tempo-700' : status === 'locked' ? 'text-t3' : 'font-medium text-t1'
                              )}>{block.title}</p>
                              <p className="text-[0.55rem] text-t3 flex items-center gap-1 mt-0.5">
                                {blockIcon(block.type, 9)}
                                <span>{blockTypeLabel(block.type)}</span>
                                {block.duration_minutes > 0 && <> · {block.duration_minutes}min</>}
                              </p>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Mobile overlay */}
        {showMobileSidebar && (
          <div className="fixed inset-0 bg-black/20 z-40 md:hidden" onClick={() => setShowMobileSidebar(false)} />
        )}

        {/* Main Content — Card-based presentation */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div ref={contentRef} className="flex-1 overflow-y-auto cp-content-scroll">
            <div className={cn(
              'max-w-2xl mx-auto px-6 py-10',
              isTransitioning
                ? transitionDir === 'forward' ? 'cp-block-exit-left' : 'cp-block-exit-right'
                : transitionDir === 'forward' ? 'cp-block-enter-right' : 'cp-block-enter-left'
            )}>
              {/* Block type pill */}
              {currentBlock && (
                <div className="flex items-center gap-3 mb-6">
                  <div className={cn(
                    'cp-block-type-pill',
                    currentBlock.type === 'text' && 'cp-pill-reading',
                    currentBlock.type === 'infographic' && 'cp-pill-video',
                    currentBlock.type === 'video' && 'cp-pill-video',
                    currentBlock.type === 'quiz' && 'cp-pill-quiz',
                    currentBlock.type === 'interactive' && 'cp-pill-activity',
                    currentBlock.type === 'download' && 'cp-pill-resource',
                  )}>
                    {blockIcon(currentBlock.type, 13)}
                    <span>{blockTypeLabel(currentBlock.type)}</span>
                  </div>
                  {currentBlock.type === 'text' && (
                    <span className="text-xs text-t3 flex items-center gap-1">
                      <Clock size={11} /> {estimateReadingTime(currentBlock.content)} min read
                    </span>
                  )}
                  {currentBlock.duration_minutes > 0 && currentBlock.type !== 'text' && (
                    <span className="text-xs text-t3 flex items-center gap-1">
                      <Clock size={11} /> {currentBlock.duration_minutes} min
                    </span>
                  )}
                </div>
              )}

              {/* Content card */}
              <div className="cp-content-card">
                {currentBlock && renderBlock(currentBlock)}
              </div>
            </div>
          </div>

          {/* Bottom Bar — Refined navigation */}
          <div className="h-16 border-t border-divider/60 flex items-center justify-between px-6 shrink-0 bg-white/80 backdrop-blur-sm">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigateToBlock(currentBlockIndex - 1, 'backward')}
              disabled={currentBlockIndex === 0}
              className="cp-hover-lift"
            >
              <ChevronLeft size={14} /> Previous
            </Button>

            <div className="text-xs text-t3 flex items-center gap-2">
              <span className="hidden sm:inline text-t2 font-medium">{currentBlock?.title}</span>
              <span className="text-t3">·</span>
              <span>{currentBlockIndex + 1} / {blocks.length}</span>
            </div>

            {currentBlockIndex < blocks.length - 1 ? (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  const status = blockStatuses.get(currentBlock?.id || '')
                  if (status === 'completed') {
                    navigateToBlock(currentBlockIndex + 1, 'forward')
                  }
                }}
                disabled={blockStatuses.get(currentBlock?.id || '') !== 'completed'}
                className="cp-hover-lift"
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
                className="cp-hover-lift"
              >
                Finish Course <Award size={14} />
              </Button>
            )}
          </div>
        </div>

        {/* AI Tutor — draggable floating button (positioned top-right, away from Next) */}
        <DraggableAITutorButton
          isOpen={showAITutor}
          onToggle={() => setShowAITutor(!showAITutor)}
        />

        {/* AI Tutor panel */}
        <AITutor
          courseTitle={course?.title || ''}
          currentModule={`Module ${(currentModuleIndex ?? 0) + 1}`}
          currentBlockContent={currentBlock?.content || ''}
          currentBlockTitle={currentBlock?.title || ''}
          isOpen={showAITutor}
          onToggle={() => setShowAITutor(!showAITutor)}
        />
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
      case 'infographic':
        return renderInfographicBlock(block, status)
      case 'download':
        return renderDownloadBlock(block, status)
      case 'heading':
        return renderHeadingBlock(block, status)
      case 'image':
        return renderImageBlock(block, status)
      case 'callout':
        return renderCalloutBlock(block, status)
      case 'code':
        return renderCodeBlock(block, status)
      case 'accordion':
        return renderAccordionBlock(block, status)
      case 'columns':
        return renderColumnsBlock(block, status)
      case 'divider':
        return renderDividerBlock(block, status)
      case 'embed':
        return renderEmbedBlock(block, status)
      case 'button':
        return renderButtonBlock(block, status)
      default:
        return renderTextBlock(block, status)
    }
  }

  function renderAutoComplete(status: BlockStatus) {
    if (status === 'completed') {
      return (
        <div className="mt-6 flex items-center gap-2 text-green-500">
          <CheckCircle size={16} /> <span className="text-sm font-medium">Completed</span>
        </div>
      )
    }
    return (
      <div className="mt-8 pt-4 border-t border-divider/40">
        <Button variant="primary" onClick={markBlockComplete} className="cp-hover-lift cp-complete-btn">
          <CheckCircle size={14} /> Continue
        </Button>
      </div>
    )
  }

  function renderHeadingBlock(block: typeof blocks[0], status: BlockStatus) {
    return (
      <div className="course-player-prose">
        <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem', borderBottom: '3px solid var(--color-tempo-500, #ea580c)', paddingBottom: '0.75rem' }}>
          {block.content || block.title}
        </h1>
        {renderAutoComplete(status)}
      </div>
    )
  }

  function renderImageBlock(block: typeof blocks[0], status: BlockStatus) {
    let parsed: any = {}
    try { parsed = JSON.parse(block.content || '{}') } catch { parsed = {} }
    return (
      <div className="course-player-prose">
        <h2 className="cp-block-title">{block.title}</h2>
        {parsed.url ? (
          <div style={{ borderRadius: '12px', overflow: 'hidden', margin: '1.5rem 0' }}>
            <img src={parsed.url} alt={parsed.alt || block.title} style={{ width: '100%', maxHeight: '500px', objectFit: 'cover' }} />
            {parsed.caption && <p style={{ textAlign: 'center', fontSize: '0.85rem', color: '#888', marginTop: '0.75rem', fontStyle: 'italic' }}>{parsed.caption}</p>}
          </div>
        ) : (
          <div style={{ background: 'linear-gradient(135deg, #f0f4ff 0%, #e8f0fe 100%)', borderRadius: '12px', padding: '3rem', textAlign: 'center', margin: '1.5rem 0' }}>
            <Image size={48} style={{ margin: '0 auto 1rem', color: '#94a3b8' }} />
            <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Image content for this lesson</p>
          </div>
        )}
        {renderAutoComplete(status)}
      </div>
    )
  }

  function renderCalloutBlock(block: typeof blocks[0], status: BlockStatus) {
    let parsed: any = {}
    try { parsed = JSON.parse(block.content || '{}') } catch { parsed = { text: block.content, style: 'info' } }
    const style = parsed.style || 'info'
    const styles: Record<string, { bg: string; border: string; icon: React.ReactNode; label: string }> = {
      info: { bg: '#eff6ff', border: '#3b82f6', icon: <AlertTriangle size={20} style={{ color: '#3b82f6' }} />, label: 'Info' },
      tip: { bg: '#f0fdf4', border: '#22c55e', icon: <CheckCircle size={20} style={{ color: '#22c55e' }} />, label: 'Tip' },
      warning: { bg: '#fffbeb', border: '#f59e0b', icon: <AlertTriangle size={20} style={{ color: '#f59e0b' }} />, label: 'Warning' },
      important: { bg: '#fef2f2', border: '#ef4444', icon: <Shield size={20} style={{ color: '#ef4444' }} />, label: 'Important' },
    }
    const s = styles[style] || styles.info
    return (
      <div className="course-player-prose">
        <div style={{ background: s.bg, borderLeft: `4px solid ${s.border}`, borderRadius: '8px', padding: '1.25rem 1.5rem', margin: '1.5rem 0', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
          <div style={{ flexShrink: 0, marginTop: '2px' }}>{s.icon}</div>
          <div>
            <p style={{ fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem', color: s.border }}>{s.label}</p>
            <div style={{ fontSize: '0.95rem', lineHeight: 1.7 }}>{renderRichContent(parsed.text || '')}</div>
          </div>
        </div>
        {renderAutoComplete(status)}
      </div>
    )
  }

  function renderCodeBlock(block: typeof blocks[0], status: BlockStatus) {
    let parsed: any = {}
    try { parsed = JSON.parse(block.content || '{}') } catch { parsed = { code: block.content, language: 'text' } }
    return (
      <div className="course-player-prose">
        <h2 className="cp-block-title">{block.title}</h2>
        <div style={{ background: '#1e1e1e', borderRadius: '12px', overflow: 'hidden', margin: '1.5rem 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 1rem', background: '#2d2d2d' }}>
            <span style={{ fontSize: '0.75rem', color: '#888' }}>{parsed.language || 'code'}</span>
            <button onClick={() => navigator.clipboard?.writeText(parsed.code || '')} style={{ fontSize: '0.7rem', color: '#888', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Copy size={12} /> Copy
            </button>
          </div>
          <pre style={{ padding: '1.25rem', margin: 0, overflowX: 'auto' }}>
            <code style={{ color: '#4ec9b0', fontFamily: 'monospace', fontSize: '0.85rem', lineHeight: 1.6 }}>{parsed.code || ''}</code>
          </pre>
        </div>
        {renderAutoComplete(status)}
      </div>
    )
  }

  function renderAccordionBlock(block: typeof blocks[0], status: BlockStatus) {
    let parsed: any = {}
    try { parsed = JSON.parse(block.content || '{}') } catch { parsed = { sections: [] } }
    return (
      <div className="course-player-prose">
        <h2 className="cp-block-title">{block.title}</h2>
        <div style={{ margin: '1.5rem 0' }}>
          {(parsed.sections || []).map((sec: any, i: number) => (
            <details key={i} style={{ borderRadius: '8px', border: '1px solid #e5e7eb', marginBottom: '0.5rem', overflow: 'hidden' }}>
              <summary style={{ padding: '1rem 1.25rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.95rem', background: '#f9fafb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {sec.heading}
              </summary>
              <div style={{ padding: '1rem 1.25rem', fontSize: '0.9rem', lineHeight: 1.7, borderTop: '1px solid #e5e7eb' }}>
                {renderRichContent(sec.body || '')}
              </div>
            </details>
          ))}
        </div>
        {renderAutoComplete(status)}
      </div>
    )
  }

  function renderColumnsBlock(block: typeof blocks[0], status: BlockStatus) {
    let parsed: any = {}
    try { parsed = JSON.parse(block.content || '{}') } catch { parsed = {} }
    return (
      <div className="course-player-prose">
        <h2 className="cp-block-title">{block.title}</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', margin: '1.5rem 0' }}>
          <div style={{ background: '#f9fafb', borderRadius: '12px', padding: '1.5rem', border: '1px solid #e5e7eb' }}>
            <div style={{ fontSize: '0.9rem', lineHeight: 1.7 }}>{renderRichContent(parsed.left || '')}</div>
          </div>
          <div style={{ background: '#f9fafb', borderRadius: '12px', padding: '1.5rem', border: '1px solid #e5e7eb' }}>
            <div style={{ fontSize: '0.9rem', lineHeight: 1.7 }}>{renderRichContent(parsed.right || '')}</div>
          </div>
        </div>
        {renderAutoComplete(status)}
      </div>
    )
  }

  function renderDividerBlock(_block: typeof blocks[0], status: BlockStatus) {
    return (
      <div className="course-player-prose" style={{ padding: '3rem 0', textAlign: 'center' }}>
        <hr style={{ border: 'none', borderTop: '2px solid #e5e7eb', margin: '0 auto', maxWidth: '200px' }} />
        {status !== 'completed' ? (
          <Button variant="ghost" size="sm" onClick={markBlockComplete} className="mt-4 text-xs text-t3">Continue</Button>
        ) : (
          <div className="mt-2 flex items-center justify-center gap-1 text-green-500"><CheckCircle size={12} /></div>
        )}
      </div>
    )
  }

  function renderEmbedBlock(block: typeof blocks[0], status: BlockStatus) {
    let parsed: any = {}
    try { parsed = JSON.parse(block.content || '{}') } catch { parsed = {} }
    return (
      <div className="course-player-prose">
        <h2 className="cp-block-title">{block.title}</h2>
        {parsed.url ? (
          <div style={{ borderRadius: '12px', overflow: 'hidden', margin: '1.5rem 0', border: '1px solid #e5e7eb' }}>
            <iframe src={parsed.url} style={{ width: '100%', height: parsed.height || 400, border: 'none' }} title={block.title} sandbox="allow-scripts allow-same-origin" />
          </div>
        ) : (
          <div style={{ background: '#f9fafb', borderRadius: '12px', padding: '3rem', textAlign: 'center', margin: '1.5rem 0' }}>
            <Globe size={40} style={{ margin: '0 auto 1rem', color: '#94a3b8' }} />
            <p style={{ color: '#64748b' }}>Embedded content</p>
          </div>
        )}
        {renderAutoComplete(status)}
      </div>
    )
  }

  function renderButtonBlock(block: typeof blocks[0], status: BlockStatus) {
    let parsed: any = {}
    try { parsed = JSON.parse(block.content || '{}') } catch { parsed = {} }
    return (
      <div className="course-player-prose" style={{ textAlign: 'center', padding: '2rem 0' }}>
        <a
          href={parsed.url || '#'}
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: 'inline-block', padding: '0.75rem 2rem', borderRadius: '8px', background: '#ea580c', color: '#fff', fontWeight: 600, fontSize: '1rem', textDecoration: 'none', transition: 'opacity 0.2s' }}
          onClick={(e) => { if (!parsed.url || parsed.url === '#') { e.preventDefault(); markBlockComplete() } }}
        >
          {parsed.label || 'Continue'}
        </a>
        {status === 'completed' && (
          <div className="mt-4 flex items-center justify-center gap-2 text-green-500">
            <CheckCircle size={16} /> <span className="text-sm">Done</span>
          </div>
        )}
      </div>
    )
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
        <h2 className="cp-block-title">{block.title}</h2>
        <div className="cp-rich-content">{renderRichContent(block.content)}</div>

        {status !== 'completed' && (
          <div className="mt-10 pt-6 border-t border-divider/40">
            <Button variant="primary" onClick={markBlockComplete} className="cp-hover-lift cp-complete-btn">
              <CheckCircle size={14} /> Mark as Read
            </Button>
          </div>
        )}
        {status === 'completed' && (
          <div className="mt-10 pt-6 border-t border-divider/40 cp-completed-badge">
            <CheckCircle size={16} /> Completed
          </div>
        )}
      </div>
    )
  }

  function renderInfographicBlock(block: typeof blocks[0], status: BlockStatus) {
    // Parse infographic data from content if available
    let infographic: { title: string; points: { id: number; text: string; color: string }[]; terms: string[]; checkQuestions: string[] } | null = null
    const match = block.content.match(/<!--INFOGRAPHIC:(.*?)-->/)
    if (match) {
      try { infographic = JSON.parse(match[1]) } catch {}
    }

    // Fallback to rendering as rich text if no infographic data
    const textContent = block.content.replace(/<!--INFOGRAPHIC:.*?-->\n?\n?/, '')

    return (
      <div className="course-player-prose">
        <h2 className="cp-block-title">{block.title}</h2>

        {/* Animated infographic cards */}
        {infographic && (
          <div className="my-6 space-y-4">
            {/* Key points as animated cards */}
            <div className="grid gap-3">
              {infographic.points.map((point, i) => (
                <div
                  key={point.id}
                  className="flex items-start gap-3 p-3 rounded-xl border border-divider/30 bg-surface/50 transition-all duration-500 hover:shadow-md hover:scale-[1.01]"
                  style={{ animationDelay: `${i * 150}ms`, animation: 'fadeSlideUp 0.5s ease-out both' }}
                >
                  <div
                    className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                    style={{ backgroundColor: point.color }}
                  >
                    {point.id}
                  </div>
                  <p className="text-sm text-t1 leading-relaxed">{point.text}</p>
                </div>
              ))}
            </div>

            {/* Key terms as animated pills */}
            {infographic.terms.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-semibold text-t2 mb-2 uppercase tracking-wide">Key Concepts</p>
                <div className="flex flex-wrap gap-2">
                  {infographic.terms.map((term, i) => (
                    <span
                      key={i}
                      className="px-3 py-1.5 rounded-full text-xs font-medium bg-violet-50 text-violet-700 border border-violet-200 transition-all duration-300 hover:bg-violet-100 hover:shadow-sm"
                      style={{ animationDelay: `${(infographic!.points.length + i) * 100}ms`, animation: 'fadeSlideUp 0.4s ease-out both' }}
                    >
                      {term}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Reflection questions */}
            {infographic.checkQuestions.length > 0 && (
              <div className="mt-6 p-4 rounded-xl bg-amber-50 border border-amber-200">
                <p className="text-xs font-semibold text-amber-800 mb-2">Reflection Questions</p>
                {infographic.checkQuestions.map((q, i) => (
                  <p key={i} className="text-sm text-amber-700 mb-1">• {q}</p>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Fallback text content */}
        {!infographic && <div className="cp-rich-content">{renderRichContent(textContent)}</div>}

        {status !== 'completed' && (
          <div className="mt-10 pt-6 border-t border-divider/40">
            <Button variant="primary" onClick={markBlockComplete} className="cp-hover-lift cp-complete-btn">
              <CheckCircle size={14} /> Mark as Read
            </Button>
          </div>
        )}
        {status === 'completed' && (
          <div className="mt-10 pt-6 border-t border-divider/40 cp-completed-badge">
            <CheckCircle size={16} /> Completed
          </div>
        )}

        {/* CSS animation keyframes */}
        <style>{`
          @keyframes fadeSlideUp {
            from { opacity: 0; transform: translateY(12px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </div>
    )
  }

  function renderVideoBlock(block: typeof blocks[0], status: BlockStatus) {
    return (
      <div>
        <h2 className="cp-block-title">{block.title}</h2>

        <div className="cp-video-player group">
          <div className="cp-video-play-btn group-hover:scale-110">
            <Play size={28} className="text-white ml-1" />
          </div>
          <p className="text-white/50 text-sm mt-4">{block.title}</p>
          <p className="text-white/30 text-xs mt-1">{block.duration_minutes} min</p>
        </div>

        {status !== 'completed' ? (
          <div className="mt-6">
            <Button variant="primary" onClick={markBlockComplete} className="cp-hover-lift cp-complete-btn">
              <CheckCircle size={14} /> Mark as Watched
            </Button>
          </div>
        ) : (
          <div className="mt-6 cp-completed-badge">
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
        <div className="text-center py-10">
          <div className="cp-quiz-start-icon mx-auto mb-6">
            <Brain size={40} className="text-tempo-600" />
          </div>
          <h2 className="text-2xl font-bold text-t1 mb-3">{block.title}</h2>
          <div className="flex items-center justify-center gap-4 text-sm text-t3 mb-2">
            <span className="flex items-center gap-1"><HelpCircle size={14} /> {currentQuizQuestions.length} questions</span>
            <span className="flex items-center gap-1"><Clock size={14} /> {block.duration_minutes} min</span>
            <span className="flex items-center gap-1"><Target size={14} /> 70% to pass</span>
          </div>
          <p className="text-xs text-t3 mb-8">Test your knowledge from the previous sections</p>
          {status === 'completed' ? (
            <div className="cp-completed-badge justify-center">
              <CheckCircle size={16} /> Already Passed
            </div>
          ) : (
            <Button variant="primary" size="lg" onClick={startQuiz} className="cp-hover-lift">
              <Play size={16} /> Start Quiz
            </Button>
          )}
        </div>
      )
    }

    // Quiz submitted — show results
    if (quizState.submitted) {
      const correct = currentQuizQuestions.filter(q => quizState.answers[q.id] === q.correct_answer).length
      return (
        <div className="text-center py-10 cp-quiz-results-enter">
          {/* Score circle */}
          <div className="cp-score-ring mx-auto mb-6">
            <svg width="120" height="120" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="52" fill="none" stroke="#f0f0f0" strokeWidth="8" />
              <circle
                cx="60" cy="60" r="52" fill="none"
                stroke={quizState.passed ? '#22c55e' : '#ef4444'}
                strokeWidth="8"
                strokeDasharray={`${((quizState.score || 0) / 100) * 326.73} 326.73`}
                strokeLinecap="round"
                transform="rotate(-90 60 60)"
                className="cp-score-ring-fill"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-t1">{quizState.score}%</span>
              <span className="text-xs text-t3">Score</span>
            </div>
          </div>

          <Badge variant={quizState.passed ? 'success' : 'error'} className="mb-3 text-sm px-4 py-1">
            {quizState.passed ? 'Passed!' : 'Not Passed'}
          </Badge>
          <p className="text-sm text-t2 mb-1">{correct} of {currentQuizQuestions.length} correct</p>
          <p className="text-xs text-t3 mb-8">70% required to pass</p>
          {!quizState.passed && (
            <Button variant="primary" size="lg" onClick={startQuiz} className="cp-hover-lift">
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
        {/* Question progress dots */}
        <div className="flex items-center gap-2 mb-8">
          {currentQuizQuestions.map((_, i) => (
            <div key={i} className={cn(
              'cp-question-dot',
              i === quizState.questionIndex && 'cp-question-dot-active',
              i < quizState.questionIndex && 'cp-question-dot-done',
            )} />
          ))}
          <span className="ml-auto text-xs text-t3">{quizState.questionIndex + 1} / {currentQuizQuestions.length}</span>
        </div>

        {/* Question card */}
        <div className="cp-quiz-question-card">
          <div className="flex items-center gap-2 mb-4">
            <Badge className="cp-quiz-type-badge">
              {currentQ.type === 'multiple_choice' ? 'Multiple Choice' :
               currentQ.type === 'true_false' ? 'True / False' :
               currentQ.type === 'fill_blank' ? 'Fill in the Blank' :
               currentQ.type === 'matching' ? 'Matching' : 'Essay'}
            </Badge>
            <span className="text-xs text-t3">{currentQ.points} pts</span>
          </div>
          <p className="text-base font-medium text-t1 mb-6 leading-relaxed">{currentQ.question}</p>

          {/* Multiple choice / True-false */}
          {(currentQ.type === 'multiple_choice' || currentQ.type === 'true_false') && (
            <div className="space-y-2.5">
              {(currentQ.type === 'true_false' ? ['True', 'False'] : (currentQ.options || [])).map((opt: any, i: number) => (
                <button
                  key={i}
                  onClick={() => setQuizState(prev => prev ? { ...prev, answers: { ...prev.answers, [currentQ.id]: optText(opt) } } : null)}
                  className={cn(
                    'cp-quiz-option',
                    quizState.answers[currentQ.id] === optText(opt) && 'cp-quiz-option-selected',
                  )}
                >
                  <div className={cn(
                    'cp-quiz-option-indicator',
                    quizState.answers[currentQ.id] === optText(opt) && 'cp-quiz-option-indicator-selected',
                  )}>
                    {quizState.answers[currentQ.id] === optText(opt) && <CheckCircle size={12} className="text-white" />}
                  </div>
                  <span>{optText(opt)}</span>
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
              className="cp-quiz-input"
              placeholder="Type your answer..."
            />
          )}

          {/* Essay */}
          {currentQ.type === 'essay' && (
            <textarea
              value={quizState.answers[currentQ.id] || ''}
              onChange={(e) => setQuizState(prev => prev ? { ...prev, answers: { ...prev.answers, [currentQ.id]: e.target.value } } : null)}
              className="cp-quiz-textarea"
              placeholder="Write your response..."
            />
          )}

          {/* Matching */}
          {currentQ.type === 'matching' && (
            <div className="space-y-2 text-sm text-t2">
              <p className="text-xs text-t3 mb-2">Match the items correctly:</p>
              {(currentQ.options || []).map((pair: any, i: number) => {
                const [term, def] = optText(pair).split(':')
                return (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white border border-divider/60 cp-hover-lift">
                    <span className="font-medium text-t1 w-1/2">{term}</span>
                    <ArrowRight size={12} className="text-t3" />
                    <span className="text-t2 w-1/2">{def}</span>
                  </div>
                )
              })}
              <Button
                size="sm"
                variant="outline"
                className="mt-3"
                onClick={() => setQuizState(prev => prev ? { ...prev, answers: { ...prev.answers, [currentQ.id]: currentQ.correct_answer } } : null)}
              >
                Confirm Matches
              </Button>
            </div>
          )}
        </div>

        {/* Quiz Navigation */}
        <div className="flex items-center justify-between mt-6">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setQuizState(prev => prev && prev.questionIndex > 0 ? { ...prev, questionIndex: prev.questionIndex - 1 } : prev)}
            disabled={quizState.questionIndex === 0}
            className="cp-hover-lift"
          >
            <ChevronLeft size={14} /> Previous
          </Button>
          {quizState.questionIndex < currentQuizQuestions.length - 1 ? (
            <Button
              size="sm"
              onClick={() => setQuizState(prev => prev ? { ...prev, questionIndex: prev.questionIndex + 1 } : null)}
              className="cp-hover-lift"
            >
              Next <ChevronRight size={14} />
            </Button>
          ) : (
            <Button size="sm" onClick={submitQuiz} className="cp-hover-lift">
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
        <div className="cp-interactive-icon mx-auto mb-6">
          <Zap size={36} className="text-yellow-600" />
        </div>
        <h2 className="cp-block-title text-center">{block.title}</h2>
        <p className="text-t2 text-sm max-w-lg mx-auto mb-8">{block.content}</p>

        <div className="max-w-md mx-auto bg-white rounded-2xl p-6 mb-8 border border-divider/40 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <Clock size={14} className="text-t3" />
            <span className="text-xs text-t3">{block.duration_minutes} min estimated</span>
          </div>
          <p className="text-xs text-t3">Complete this interactive activity to proceed.</p>
        </div>

        {status !== 'completed' ? (
          <Button variant="primary" size="lg" onClick={markBlockComplete} className="cp-hover-lift cp-complete-btn">
            <CheckCircle size={16} /> Complete Activity
          </Button>
        ) : (
          <div className="cp-completed-badge justify-center">
            <CheckCircle size={16} /> Completed
          </div>
        )}
      </div>
    )
  }

  function renderDownloadBlock(block: typeof blocks[0], status: BlockStatus) {
    return (
      <div className="text-center py-8">
        <div className="cp-download-icon mx-auto mb-6">
          <Download size={36} className="text-emerald-600" />
        </div>
        <h2 className="cp-block-title text-center">{block.title}</h2>
        <p className="text-t3 text-sm mb-8">Download this resource to continue</p>

        <div className="max-w-sm mx-auto cp-download-card mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-tempo-50 to-tempo-100 flex items-center justify-center border border-tempo-200/50">
            <FileText size={20} className="text-tempo-600" />
          </div>
          <div className="text-left flex-1">
            <p className="text-sm font-semibold text-t1">{block.title}</p>
            <p className="text-xs text-t3">{block.content?.split('/').pop()}</p>
          </div>
          <a href={block.content} target="_blank" rel="noopener noreferrer"
            className="p-2.5 rounded-xl hover:bg-tempo-50 transition-colors border border-divider/40">
            <Download size={16} className="text-tempo-600" />
          </a>
        </div>

        {status !== 'completed' ? (
          <Button variant="primary" onClick={markBlockComplete} className="cp-hover-lift cp-complete-btn">
            <CheckCircle size={14} /> Mark as Downloaded
          </Button>
        ) : (
          <div className="cp-completed-badge justify-center">
            <CheckCircle size={16} /> Completed
          </div>
        )}
      </div>
    )
  }
}
