'use client'

import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { cn } from '@/lib/utils/cn'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  RotateCcw, CheckCircle, X, GripVertical, ArrowUp, ArrowDown,
  MessageSquare, SlidersHorizontal, Shuffle, PenTool, Type
} from 'lucide-react'

// ─── Shared types ───────────────────────────────────────────
interface CardProps {
  data: any
  onComplete: (result: any) => void
  readOnly?: boolean
}

// ─── 1. Flip Card ───────────────────────────────────────────
// data: { front: string; back: string; category?: string }
export function FlipCard({ data, onComplete, readOnly }: CardProps) {
  const [flipped, setFlipped] = useState(false)

  return (
    <div
      className="w-full cursor-pointer select-none"
      style={{ perspective: '1200px' }}
      onClick={() => {
        if (readOnly) return
        setFlipped(f => !f)
        if (!flipped) onComplete({ viewed: true })
      }}
    >
      <div
        className={cn(
          'relative w-full min-h-[220px] transition-transform duration-500',
          '[transform-style:preserve-3d]',
        )}
        style={{ transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
      >
        {/* Front */}
        <div
          className="absolute inset-0 rounded-2xl border border-border bg-gradient-to-br from-card to-canvas p-6 flex flex-col items-center justify-center text-center"
          style={{ backfaceVisibility: 'hidden' }}
        >
          {data.category && (
            <Badge variant="ai" className="mb-3">{data.category}</Badge>
          )}
          <p className="text-sm font-medium text-t1 leading-relaxed">{data.front}</p>
          <p className="text-[0.6rem] text-t4 mt-4">Click to reveal answer</p>
        </div>
        {/* Back */}
        <div
          className="absolute inset-0 rounded-2xl border border-tempo-500/30 bg-gradient-to-br from-tempo-500/5 to-purple-500/5 p-6 flex flex-col items-center justify-center text-center"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <Badge variant="success" className="mb-3">Answer</Badge>
          <p className="text-sm font-medium text-t1 leading-relaxed">{data.back}</p>
          <p className="text-[0.6rem] text-t4 mt-4">Click to flip back</p>
        </div>
      </div>
    </div>
  )
}

// ─── 2. Reflection Card ─────────────────────────────────────
// data: { prompt: string; placeholder?: string; storageKey?: string }
export function ReflectionCard({ data, onComplete, readOnly }: CardProps) {
  const storageKey = data.storageKey || `reflection-${data.prompt?.slice(0, 30)}`
  const [text, setText] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey)
      if (stored) { setText(stored); setSaved(true) }
    } catch { /* noop */ }
  }, [storageKey])

  const handleSave = useCallback(() => {
    try { localStorage.setItem(storageKey, text) } catch { /* noop */ }
    setSaved(true)
    onComplete({ text, savedAt: new Date().toISOString() })
  }, [storageKey, text, onComplete])

  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
      <div className="flex items-start gap-2">
        <div className="w-7 h-7 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
          <MessageSquare size={14} className="text-purple-500" />
        </div>
        <div>
          <Badge variant="ai" className="mb-1">Reflection</Badge>
          <p className="text-sm font-medium text-t1 leading-relaxed">{data.prompt}</p>
        </div>
      </div>
      <textarea
        value={text}
        onChange={e => { setText(e.target.value); setSaved(false) }}
        readOnly={readOnly}
        placeholder={data.placeholder || 'Write your thoughts here...'}
        className="w-full min-h-[120px] p-3 rounded-xl border border-border bg-canvas text-sm text-t1 placeholder:text-t4 resize-y focus:outline-none focus:ring-1 focus:ring-tempo-500/30 focus:border-tempo-500/50 transition-all"
      />
      <div className="flex items-center justify-between">
        <span className="text-[0.6rem] text-t4">
          {text.length > 0 ? `${text.split(/\s+/).filter(Boolean).length} words` : 'Start typing...'}
        </span>
        {!readOnly && (
          <Button size="sm" variant={saved ? 'ghost' : 'primary'} onClick={handleSave} disabled={!text.trim()}>
            {saved ? <><CheckCircle size={14} className="mr-1 text-green-500" /> Saved</> : 'Save Reflection'}
          </Button>
        )}
      </div>
    </div>
  )
}

// ─── 3. Sliding Scale ───────────────────────────────────────
// data: { question: string; min?: number; max?: number; minLabel?: string; maxLabel?: string; step?: number }
export function SlidingScale({ data, onComplete, readOnly }: CardProps) {
  const min = data.min ?? 1
  const max = data.max ?? 10
  const step = data.step ?? 1
  const [value, setValue] = useState(Math.round((min + max) / 2))
  const [submitted, setSubmitted] = useState(false)

  const percentage = ((value - min) / (max - min)) * 100

  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-start gap-2">
        <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
          <SlidersHorizontal size={14} className="text-blue-500" />
        </div>
        <div>
          <Badge variant="info">Self-Assessment</Badge>
          <p className="text-sm font-medium text-t1 mt-1 leading-relaxed">{data.question}</p>
        </div>
      </div>

      {/* Custom slider */}
      <div className="px-2 pt-2 pb-1">
        <div className="relative">
          {/* Track */}
          <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-700 relative">
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-tempo-400 to-tempo-600 transition-all duration-150"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={e => { setValue(Number(e.target.value)); setSubmitted(false) }}
            disabled={readOnly}
            className="absolute inset-0 w-full opacity-0 cursor-pointer"
          />
          {/* Thumb indicator */}
          <div
            className="absolute top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white border-2 border-tempo-500 shadow-md flex items-center justify-center pointer-events-none transition-all duration-150"
            style={{ left: `calc(${percentage}% - 12px)` }}
          >
            <span className="text-[0.55rem] font-bold text-tempo-600">{value}</span>
          </div>
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-[0.6rem] text-t4">{data.minLabel || min}</span>
          <span className="text-[0.6rem] text-t4">{data.maxLabel || max}</span>
        </div>
      </div>

      {!readOnly && (
        <div className="flex justify-end">
          <Button size="sm" variant={submitted ? 'ghost' : 'primary'} onClick={() => {
            setSubmitted(true)
            onComplete({ value })
          }}>
            {submitted ? <><CheckCircle size={14} className="mr-1 text-green-500" /> Submitted</> : 'Submit'}
          </Button>
        </div>
      )}
    </div>
  )
}

// ─── 4. Match Pairs ─────────────────────────────────────────
// data: { pairs: Array<{ left: string; right: string }> }
export function MatchPairs({ data, onComplete, readOnly }: CardProps) {
  const pairs: Array<{ left: string; right: string }> = data.pairs || []
  const [selectedLeft, setSelectedLeft] = useState<number | null>(null)
  const [selectedRight, setSelectedRight] = useState<number | null>(null)
  const [matched, setMatched] = useState<Set<number>>(new Set())
  const [wrongPair, setWrongPair] = useState<{ left: number; right: number } | null>(null)

  // Shuffled right-side indices
  const shuffledRight = useMemo(() => {
    const indices = pairs.map((_, i) => i)
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[indices[i], indices[j]] = [indices[j], indices[i]]
    }
    return indices
  }, [pairs])

  const handleLeftClick = useCallback((idx: number) => {
    if (readOnly || matched.has(idx)) return
    setSelectedLeft(idx)
    setWrongPair(null)
  }, [readOnly, matched])

  const handleRightClick = useCallback((shuffledIdx: number) => {
    if (readOnly || selectedLeft === null) return
    const actualRightIdx = shuffledRight[shuffledIdx]
    if (matched.has(actualRightIdx)) return

    if (selectedLeft === actualRightIdx) {
      // Correct match
      const newMatched = new Set(matched)
      newMatched.add(selectedLeft)
      setMatched(newMatched)
      setSelectedLeft(null)
      setSelectedRight(null)
      setWrongPair(null)

      if (newMatched.size === pairs.length) {
        onComplete({ matched: true, totalPairs: pairs.length })
      }
    } else {
      // Wrong match
      setWrongPair({ left: selectedLeft, right: shuffledIdx })
      setSelectedRight(shuffledIdx)
      setTimeout(() => {
        setWrongPair(null)
        setSelectedLeft(null)
        setSelectedRight(null)
      }, 800)
    }
  }, [readOnly, selectedLeft, shuffledRight, matched, pairs.length, onComplete])

  const allMatched = matched.size === pairs.length

  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
          <Shuffle size={14} className="text-green-500" />
        </div>
        <div>
          <Badge variant="success">Match Pairs</Badge>
          <p className="text-xs text-t3 mt-0.5">Click a left item, then click its match on the right</p>
        </div>
        {allMatched && (
          <Badge variant="success" className="ml-auto"><CheckCircle size={12} className="mr-1" /> Complete</Badge>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Left column */}
        <div className="space-y-2">
          {pairs.map((pair, i) => (
            <button
              key={`l-${i}`}
              onClick={() => handleLeftClick(i)}
              disabled={matched.has(i)}
              className={cn(
                'w-full text-left px-3 py-2.5 rounded-xl border text-xs font-medium transition-all duration-200',
                matched.has(i)
                  ? 'border-green-500/30 bg-green-500/10 text-green-600 opacity-60'
                  : selectedLeft === i
                  ? 'border-tempo-500 bg-tempo-500/10 text-tempo-600 ring-1 ring-tempo-500/30 scale-[1.02]'
                  : wrongPair?.left === i
                  ? 'border-red-500 bg-red-500/10 text-red-600 animate-[shake_0.4s_ease-in-out]'
                  : 'border-border hover:border-tempo-300 text-t2 hover:bg-canvas'
              )}
            >
              {pair.left}
            </button>
          ))}
        </div>
        {/* Right column (shuffled) */}
        <div className="space-y-2">
          {shuffledRight.map((actualIdx, shuffledIdx) => (
            <button
              key={`r-${shuffledIdx}`}
              onClick={() => handleRightClick(shuffledIdx)}
              disabled={matched.has(actualIdx)}
              className={cn(
                'w-full text-left px-3 py-2.5 rounded-xl border text-xs font-medium transition-all duration-200',
                matched.has(actualIdx)
                  ? 'border-green-500/30 bg-green-500/10 text-green-600 opacity-60'
                  : wrongPair?.right === shuffledIdx
                  ? 'border-red-500 bg-red-500/10 text-red-600 animate-[shake_0.4s_ease-in-out]'
                  : 'border-border hover:border-tempo-300 text-t2 hover:bg-canvas'
              )}
            >
              {pairs[actualIdx].right}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── 5. Fill in Blanks ──────────────────────────────────────
// data: { sentence: string (blanks marked as ___), answers: string[] }
// Example: { sentence: "The ___ jumped over the ___.", answers: ["cow", "moon"] }
export function FillInBlanks({ data, onComplete, readOnly }: CardProps) {
  const sentence: string = data.sentence || ''
  const correctAnswers: string[] = data.answers || []
  const parts = sentence.split('___')
  const blankCount = parts.length - 1

  const [userAnswers, setUserAnswers] = useState<string[]>(Array(blankCount).fill(''))
  const [submitted, setSubmitted] = useState(false)

  const results = useMemo(() => {
    if (!submitted) return null
    return userAnswers.map((a, i) =>
      a.trim().toLowerCase() === (correctAnswers[i] || '').trim().toLowerCase()
    )
  }, [submitted, userAnswers, correctAnswers])

  const score = results ? results.filter(Boolean).length : 0

  const handleSubmit = useCallback(() => {
    setSubmitted(true)
    const correct = userAnswers.filter((a, i) =>
      a.trim().toLowerCase() === (correctAnswers[i] || '').trim().toLowerCase()
    ).length
    onComplete({ answers: userAnswers, correct, total: blankCount })
  }, [userAnswers, correctAnswers, blankCount, onComplete])

  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
          <PenTool size={14} className="text-amber-500" />
        </div>
        <Badge variant="warning">Fill in the Blanks</Badge>
        {submitted && (
          <Badge variant={score === blankCount ? 'success' : 'warning'} className="ml-auto">
            {score}/{blankCount} correct
          </Badge>
        )}
      </div>

      <div className="flex flex-wrap items-baseline gap-1 leading-loose">
        {parts.map((part, i) => (
          <span key={i} className="contents">
            <span className="text-sm text-t1">{part}</span>
            {i < blankCount && (
              <span className="inline-flex mx-1">
                <input
                  type="text"
                  value={userAnswers[i]}
                  onChange={e => {
                    const next = [...userAnswers]
                    next[i] = e.target.value
                    setUserAnswers(next)
                    setSubmitted(false)
                  }}
                  readOnly={readOnly}
                  placeholder="..."
                  className={cn(
                    'w-24 px-2 py-0.5 rounded-lg border text-xs text-center font-medium transition-all',
                    'focus:outline-none focus:ring-1',
                    submitted && results
                      ? results[i]
                        ? 'border-green-500 bg-green-500/10 text-green-600 focus:ring-green-500/30'
                        : 'border-red-500 bg-red-500/10 text-red-600 focus:ring-red-500/30'
                      : 'border-border bg-canvas text-t1 focus:ring-tempo-500/30 focus:border-tempo-500/50'
                  )}
                />
              </span>
            )}
          </span>
        ))}
      </div>

      {submitted && results && !results.every(Boolean) && (
        <div className="text-xs text-t3 bg-canvas rounded-lg p-2 border border-border">
          <span className="font-medium text-t2">Answers: </span>
          {correctAnswers.map((a, i) => (
            <span key={i}>
              {i > 0 && ', '}
              <span className={cn(results[i] ? 'text-green-600' : 'text-amber-600 font-medium')}>{a}</span>
            </span>
          ))}
        </div>
      )}

      {!readOnly && (
        <div className="flex justify-end">
          <Button size="sm" onClick={handleSubmit} disabled={userAnswers.some(a => !a.trim())}>
            {submitted ? <><RotateCcw size={14} className="mr-1" /> Retry</> : <>Check Answers <CheckCircle size={14} className="ml-1" /></>}
          </Button>
        </div>
      )}
    </div>
  )
}

// ─── 6. Sorting Exercise ────────────────────────────────────
// data: { instruction?: string; items: string[]; correctOrder: string[] }
export function SortingExercise({ data, onComplete, readOnly }: CardProps) {
  const correctOrder: string[] = data.correctOrder || data.items || []
  const [items, setItems] = useState<string[]>(() => {
    // Start shuffled
    const arr = [...(data.items || [])]
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[arr[i], arr[j]] = [arr[j], arr[i]]
    }
    return arr
  })
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const isCorrect = useMemo(() => {
    return items.every((item, i) => item === correctOrder[i])
  }, [items, correctOrder])

  const moveItem = useCallback((from: number, to: number) => {
    if (readOnly) return
    setSubmitted(false)
    setItems(prev => {
      const next = [...prev]
      const [moved] = next.splice(from, 1)
      next.splice(to, 0, moved)
      return next
    })
  }, [readOnly])

  const handleSubmit = useCallback(() => {
    setSubmitted(true)
    onComplete({ order: items, correct: isCorrect })
  }, [items, isCorrect, onComplete])

  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
          <Type size={14} className="text-indigo-500" />
        </div>
        <div>
          <Badge variant="info">Sort into Order</Badge>
          {data.instruction && (
            <p className="text-xs text-t3 mt-0.5">{data.instruction}</p>
          )}
        </div>
        {submitted && (
          <Badge variant={isCorrect ? 'success' : 'error'} className="ml-auto">
            {isCorrect ? <><CheckCircle size={12} className="mr-1" /> Correct!</> : <><X size={12} className="mr-1" /> Try again</>}
          </Badge>
        )}
      </div>

      <div className="space-y-1.5">
        {items.map((item, i) => (
          <div
            key={`${item}-${i}`}
            draggable={!readOnly}
            onDragStart={() => setDragIdx(i)}
            onDragOver={e => e.preventDefault()}
            onDrop={() => {
              if (dragIdx !== null && dragIdx !== i) moveItem(dragIdx, i)
              setDragIdx(null)
            }}
            className={cn(
              'flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-medium transition-all duration-200',
              dragIdx === i ? 'opacity-40 scale-95' : 'opacity-100',
              submitted && item === correctOrder[i]
                ? 'border-green-500/30 bg-green-500/10 text-green-600'
                : submitted
                ? 'border-red-500/30 bg-red-500/10 text-red-600'
                : 'border-border bg-canvas text-t2 hover:border-tempo-300 hover:bg-card',
              !readOnly && 'cursor-grab active:cursor-grabbing'
            )}
          >
            {!readOnly && (
              <GripVertical size={14} className="text-t4 flex-shrink-0" />
            )}
            <span className="flex-1">{item}</span>
            {/* Up/down buttons for non-drag fallback */}
            {!readOnly && (
              <div className="flex gap-0.5 flex-shrink-0">
                <button
                  onClick={e => { e.stopPropagation(); if (i > 0) moveItem(i, i - 1) }}
                  disabled={i === 0}
                  className="p-0.5 rounded hover:bg-white/50 dark:hover:bg-white/10 disabled:opacity-30"
                >
                  <ArrowUp size={12} className="text-t3" />
                </button>
                <button
                  onClick={e => { e.stopPropagation(); if (i < items.length - 1) moveItem(i, i + 1) }}
                  disabled={i === items.length - 1}
                  className="p-0.5 rounded hover:bg-white/50 dark:hover:bg-white/10 disabled:opacity-30"
                >
                  <ArrowDown size={12} className="text-t3" />
                </button>
              </div>
            )}
            {submitted && (
              <span className="text-[0.6rem] text-t4 flex-shrink-0">
                {item === correctOrder[i] ? '' : `#${correctOrder.indexOf(item) + 1}`}
              </span>
            )}
          </div>
        ))}
      </div>

      {!readOnly && (
        <div className="flex justify-end">
          <Button size="sm" onClick={handleSubmit}>
            {submitted ? <><RotateCcw size={14} className="mr-1" /> Retry</> : <>Check Order <CheckCircle size={14} className="ml-1" /></>}
          </Button>
        </div>
      )}
    </div>
  )
}

// ─── Default export: Interactive Cards Gallery ──────────────
// Renders a collection of interactive cards with a type selector
// data: { cards: Array<{ type: CardType; data: any }> }
type CardType = 'flip' | 'reflection' | 'scale' | 'match' | 'blanks' | 'sort'

const cardComponents: Record<CardType, React.ComponentType<CardProps>> = {
  flip: FlipCard,
  reflection: ReflectionCard,
  scale: SlidingScale,
  match: MatchPairs,
  blanks: FillInBlanks,
  sort: SortingExercise,
}

const cardLabels: Record<CardType, { label: string; icon: React.ComponentType<{ size: number; className?: string }> }> = {
  flip: { label: 'Flip Card', icon: RotateCcw },
  reflection: { label: 'Reflection', icon: MessageSquare },
  scale: { label: 'Sliding Scale', icon: SlidersHorizontal },
  match: { label: 'Match Pairs', icon: Shuffle },
  blanks: { label: 'Fill Blanks', icon: PenTool },
  sort: { label: 'Sort Order', icon: Type },
}

interface InteractiveCardsProps {
  cards?: Array<{ type: CardType; data: any }>
  onComplete?: (results: any[]) => void
  readOnly?: boolean
}

export default function InteractiveCards({ cards, onComplete, readOnly }: InteractiveCardsProps) {
  const [results, setResults] = useState<Record<number, any>>({})

  // Default demo cards if none provided
  const cardList = cards || [
    {
      type: 'flip' as CardType,
      data: {
        front: 'What is the Ebbinghaus Forgetting Curve?',
        back: 'A model showing how information is lost over time when there is no attempt to retain it. Retention drops exponentially without reinforcement.',
        category: 'Learning Science',
      },
    },
    {
      type: 'reflection' as CardType,
      data: {
        prompt: 'How would you apply spaced repetition to your daily work routine?',
        placeholder: 'Think about your learning habits...',
      },
    },
    {
      type: 'scale' as CardType,
      data: {
        question: 'How confident are you in applying this concept to real scenarios?',
        min: 1,
        max: 10,
        minLabel: 'Not confident',
        maxLabel: 'Very confident',
      },
    },
    {
      type: 'match' as CardType,
      data: {
        pairs: [
          { left: 'Spaced Repetition', right: 'Review at increasing intervals' },
          { left: 'Active Recall', right: 'Retrieve information from memory' },
          { left: 'Interleaving', right: 'Mix different topics while studying' },
          { left: 'Elaboration', right: 'Explain concepts in your own words' },
        ],
      },
    },
    {
      type: 'blanks' as CardType,
      data: {
        sentence: 'The ___ forgetting curve shows that memory retention ___ exponentially without ___.',
        answers: ['Ebbinghaus', 'decays', 'reinforcement'],
      },
    },
    {
      type: 'sort' as CardType,
      data: {
        instruction: 'Order these review intervals from shortest to longest',
        items: ['1 day', '3 days', '1 week', '2 weeks', '1 month'],
        correctOrder: ['1 day', '3 days', '1 week', '2 weeks', '1 month'],
      },
    },
  ]

  const handleCardComplete = useCallback((index: number, result: any) => {
    setResults(prev => {
      const next = { ...prev, [index]: result }
      if (Object.keys(next).length === cardList.length && onComplete) {
        onComplete(cardList.map((_, i) => next[i]))
      }
      return next
    })
  }, [cardList, onComplete])

  return (
    <div className="space-y-4">
      {/* Progress indicator */}
      <div className="flex items-center gap-3 px-1">
        <span className="text-xs text-t3 font-medium">
          {Object.keys(results).length} of {cardList.length} completed
        </span>
        <div className="flex-1 h-1.5 rounded-full bg-gray-200 dark:bg-gray-700">
          <div
            className="h-full rounded-full bg-gradient-to-r from-tempo-400 to-tempo-600 transition-all duration-500"
            style={{ width: `${(Object.keys(results).length / cardList.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Card list */}
      {cardList.map((card, i) => {
        const Comp = cardComponents[card.type]
        if (!Comp) return null
        const meta = cardLabels[card.type]
        return (
          <div key={i} className="relative">
            {/* Card type label */}
            <div className="flex items-center gap-1.5 mb-1.5 px-1">
              <meta.icon size={12} className="text-t4" />
              <span className="text-[0.6rem] text-t4 font-medium uppercase tracking-wider">{meta.label}</span>
              {results[i] !== undefined && (
                <CheckCircle size={12} className="text-green-500 ml-auto" />
              )}
            </div>
            <Comp
              data={card.data}
              onComplete={(result) => handleCardComplete(i, result)}
              readOnly={readOnly}
            />
          </div>
        )
      })}
    </div>
  )
}
