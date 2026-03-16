'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils/cn'
import {
  Brain, MessageCircle, Lightbulb, HelpCircle, BookOpen, Sparkles,
  Send, X, Minimize2, Maximize2, Zap, ListChecks, Quote, CheckCircle,
  XCircle, ArrowRight
} from 'lucide-react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AITutorProps {
  courseTitle: string
  currentModule: string
  currentBlockContent: string
  currentBlockTitle: string
  isOpen: boolean
  onToggle: () => void
}

type InteractionMode = 'ask' | 'quiz' | 'explain' | 'summarize' | 'socratic'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: number
  mode?: InteractionMode
  // quiz-specific
  quiz?: QuizData
}

interface QuizQuestion {
  question: string
  options: string[]
  correctIndex: number
  explanation: string
}

interface QuizData {
  questions: QuizQuestion[]
  currentIndex: number
  answers: (number | null)[]
  submitted: boolean
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

function extractKeyTerms(text: string): string[] {
  const stopwords = new Set([
    'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'shall', 'can', 'to', 'of', 'in', 'for',
    'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through', 'during',
    'before', 'after', 'above', 'below', 'between', 'out', 'off', 'over',
    'under', 'again', 'further', 'then', 'once', 'and', 'but', 'or', 'nor',
    'not', 'so', 'very', 'just', 'about', 'up', 'down', 'each', 'few',
    'more', 'most', 'other', 'some', 'such', 'no', 'only', 'own', 'same',
    'than', 'too', 'this', 'that', 'these', 'those', 'it', 'its', 'we',
    'they', 'them', 'their', 'our', 'your', 'he', 'she', 'him', 'her',
    'i', 'me', 'my', 'you', 'all', 'any', 'both', 'here', 'there', 'when',
    'where', 'why', 'how', 'what', 'which', 'who', 'whom', 'if', 'while',
    'also', 'new', 'one', 'two', 'use', 'used', 'using', 'make', 'like',
    'well', 'way', 'many', 'much', 'get', 'got', 'need', 'know', 'see',
  ])
  const words = text
    .replace(/[^a-zA-Z\s-]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 3 && !stopwords.has(w.toLowerCase()))
  const freq = new Map<string, number>()
  words.forEach(w => {
    const lower = w.toLowerCase()
    freq.set(lower, (freq.get(lower) || 0) + 1)
  })
  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([w]) => w.charAt(0).toUpperCase() + w.slice(1))
}

function generateSuggestions(blockTitle: string, content: string): string[] {
  const terms = extractKeyTerms(content)
  const topic = terms[0] || blockTitle
  const secondary = terms[1] || 'this concept'
  return [
    `Explain ${topic} in simpler terms`,
    `Give me a real-world example of ${secondary}`,
    'Quiz me on this section',
    'What are the key takeaways?',
  ]
}

// ---------------------------------------------------------------------------
// Mock AI response generation
// ---------------------------------------------------------------------------

function generateMockResponse(
  mode: InteractionMode,
  userMessage: string,
  blockContent: string,
  blockTitle: string,
): string {
  const terms = extractKeyTerms(blockContent)
  const topic = terms[0] || blockTitle
  const secondary = terms[1] || 'the concept'
  const tertiary = terms[2] || 'this topic'

  switch (mode) {
    case 'explain':
      return `Great question! Let me break down **${topic}** for you.\n\n` +
        `At its core, ${topic} refers to the way ${secondary} interacts with ${tertiary} in practice. ` +
        `Think of it like a building\u2019s foundation \u2014 without a solid understanding of ${topic}, the more advanced concepts won\u2019t hold up.\n\n` +
        `**Key points:**\n` +
        `- ${topic} establishes the baseline for how we approach ${secondary}\n` +
        `- It connects directly to ${tertiary}, which you\u2019ll see in the next section\n` +
        `- In practice, teams apply ${topic} by creating structured frameworks\n\n` +
        `Would you like me to go deeper on any of these points?`

    case 'summarize':
      return `**Summary of "${blockTitle}"**\n\n` +
        `- **Core concept:** ${topic} is the foundational principle covered in this section\n` +
        `- **Relationship:** ${topic} connects to ${secondary} through shared underlying principles\n` +
        `- **Application:** ${tertiary} provides the practical framework for implementing these ideas\n` +
        `- **Key takeaway:** Understanding ${topic} is essential before moving to more advanced topics in this course\n\n` +
        `This section lays the groundwork for everything that follows.`

    case 'socratic': {
      const questions = [
        `How would you explain ${topic} to someone with no background in this area?`,
        `What do you think would happen if ${secondary} were applied without considering ${tertiary}?`,
        `Can you think of a situation where ${topic} might not be the best approach?`,
        `What assumptions are we making when we rely on ${topic}?`,
      ]
      const q = questions[Math.floor(Math.random() * questions.length)]
      return `Let me challenge your thinking here.\n\n` +
        `**${q}**\n\n` +
        `Take a moment to think about this before answering. ` +
        `There\u2019s no single right answer \u2014 I\u2019m interested in your reasoning process.`
    }

    case 'ask':
    default: {
      const lowerMsg = userMessage.toLowerCase()
      if (lowerMsg.includes('example') || lowerMsg.includes('real-world') || lowerMsg.includes('practical')) {
        return `Here\u2019s a practical example of how **${topic}** works in the real world:\n\n` +
          `Imagine a mid-size company rolling out a new ${secondary} initiative. ` +
          `They start by assessing their current approach to ${tertiary}, then build a phased plan.\n\n` +
          `**Phase 1:** Audit existing ${secondary} processes\n` +
          `**Phase 2:** Identify gaps where ${topic} principles aren\u2019t being followed\n` +
          `**Phase 3:** Implement changes and measure outcomes over 90 days\n\n` +
          `This approach mirrors what the course material recommends. The key insight is that ${topic} isn\u2019t a one-time activity \u2014 it\u2019s an ongoing practice.`
      }
      if (lowerMsg.includes('takeaway') || lowerMsg.includes('key point') || lowerMsg.includes('important')) {
        return `The most important takeaways from this section are:\n\n` +
          `1. **${topic}** is foundational \u2014 everything else builds on it\n` +
          `2. **${secondary}** and **${tertiary}** are closely linked and should be considered together\n` +
          `3. Practical implementation requires a structured, phased approach\n` +
          `4. Measurement and iteration are critical for long-term success\n\n` +
          `I\u2019d recommend bookmarking this section for reference as you progress through the course.`
      }
      return `Based on the course material, here\u2019s what I can tell you about **${topic}** in the context of "${blockTitle}":\n\n` +
        `${topic} is a critical concept in this section because it forms the basis for understanding ${secondary}. ` +
        `The course material emphasizes that ${tertiary} plays a supporting role in making ${topic} actionable.\n\n` +
        `A few things worth noting:\n` +
        `- The relationship between ${topic} and ${secondary} is bidirectional\n` +
        `- Successful implementation depends on organizational context\n` +
        `- This ties directly into what you\u2019ll learn in the next module\n\n` +
        `Is there a specific aspect you\u2019d like me to elaborate on?`
    }
  }
}

function generateMockQuiz(blockContent: string, blockTitle: string): QuizQuestion[] {
  const terms = extractKeyTerms(blockContent)
  const t = (i: number) => terms[i] || ['strategy', 'framework', 'process', 'method', 'approach', 'system'][i] || 'concept'

  return [
    {
      question: `According to this section, what is the primary purpose of ${t(0)}?`,
      options: [
        `To establish a framework for ${t(1)}`,
        `To replace existing ${t(2)} processes`,
        `To eliminate the need for ${t(1)}`,
        `To automate ${t(2)} entirely`,
      ],
      correctIndex: 0,
      explanation: `${t(0)} is described in the course material as a framework that supports and enhances ${t(1)}, not a replacement for existing processes.`,
    },
    {
      question: `How does ${t(1)} relate to ${t(2)} in this context?`,
      options: [
        `They are completely independent concepts`,
        `${t(1)} is a subset of ${t(2)}`,
        `They work together in a complementary way`,
        `${t(2)} has replaced ${t(1)} in modern practice`,
      ],
      correctIndex: 2,
      explanation: `The course material explains that ${t(1)} and ${t(2)} are complementary \u2014 each strengthens the other when applied together.`,
    },
    {
      question: `What is a key consideration when implementing ${t(0)} in practice?`,
      options: [
        `It should be implemented all at once for maximum impact`,
        `Organizational context and phased implementation matter`,
        `It only works in large enterprises`,
        `Technical expertise is the only requirement`,
      ],
      correctIndex: 1,
      explanation: `The section emphasizes that context matters and recommends a phased approach to implementation, regardless of organization size.`,
    },
  ]
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function TypingIndicator() {
  return (
    <div className="flex items-center gap-2 px-4 py-3">
      <div className="h-7 w-7 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0">
        <Brain className="h-3.5 w-3.5 text-white" />
      </div>
      <div className="flex gap-1 items-center bg-zinc-800 rounded-2xl px-4 py-2.5">
        <span className="h-1.5 w-1.5 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="h-1.5 w-1.5 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="h-1.5 w-1.5 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  )
}

function MessageBubble({ msg }: { msg: ChatMessage }) {
  if (msg.role === 'system') {
    return (
      <div className="flex justify-center px-4 py-1">
        <span className="text-[11px] text-zinc-500 bg-zinc-800/60 rounded-full px-3 py-1">{msg.content}</span>
      </div>
    )
  }

  const isUser = msg.role === 'user'

  return (
    <div className={cn('flex gap-2 px-4 py-1', isUser ? 'justify-end' : 'justify-start')}>
      {!isUser && (
        <div className="h-7 w-7 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Brain className="h-3.5 w-3.5 text-white" />
        </div>
      )}
      <div
        className={cn(
          'max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap',
          isUser
            ? 'bg-violet-600 text-white rounded-br-md'
            : 'bg-zinc-800 text-zinc-100 rounded-bl-md'
        )}
        // render markdown-ish bold
        dangerouslySetInnerHTML={{
          __html: msg.content
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-white">$1</strong>')
            .replace(/\n/g, '<br/>')
        }}
      />
      {isUser && (
        <div className="h-7 w-7 rounded-full bg-zinc-700 flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-medium text-zinc-300">
          You
        </div>
      )}
    </div>
  )
}

function QuizView({ quiz, onAnswer, onSubmit }: {
  quiz: QuizData
  onAnswer: (qIndex: number, optionIndex: number) => void
  onSubmit: () => void
}) {
  const q = quiz.questions[quiz.currentIndex]
  if (!q) return null
  const selectedAnswer = quiz.answers[quiz.currentIndex]
  const isAnswered = selectedAnswer !== null
  const isSubmitted = quiz.submitted

  return (
    <div className="px-4 py-2">
      <div className="bg-zinc-800 rounded-xl p-4 border border-zinc-700">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-violet-400 font-medium">
            Question {quiz.currentIndex + 1} of {quiz.questions.length}
          </span>
          {isSubmitted && isAnswered && (
            selectedAnswer === q.correctIndex
              ? <span className="flex items-center gap-1 text-xs text-emerald-400"><CheckCircle className="h-3.5 w-3.5" /> Correct</span>
              : <span className="flex items-center gap-1 text-xs text-red-400"><XCircle className="h-3.5 w-3.5" /> Incorrect</span>
          )}
        </div>
        <p className="text-sm text-zinc-100 font-medium mb-3">{q.question}</p>
        <div className="space-y-2">
          {q.options.map((opt, oi) => {
            const isSelected = selectedAnswer === oi
            const isCorrect = oi === q.correctIndex
            let optStyle = 'border-zinc-600 hover:border-zinc-500 text-zinc-300 hover:text-zinc-100'
            if (isSubmitted) {
              if (isCorrect) optStyle = 'border-emerald-500/60 bg-emerald-500/10 text-emerald-300'
              else if (isSelected && !isCorrect) optStyle = 'border-red-500/60 bg-red-500/10 text-red-300'
              else optStyle = 'border-zinc-700 text-zinc-500'
            } else if (isSelected) {
              optStyle = 'border-violet-500 bg-violet-500/10 text-violet-200'
            }
            return (
              <button
                key={oi}
                onClick={() => !isSubmitted && onAnswer(quiz.currentIndex, oi)}
                disabled={isSubmitted}
                className={cn(
                  'w-full text-left text-sm px-3 py-2 rounded-lg border transition-colors',
                  optStyle,
                  !isSubmitted && 'cursor-pointer'
                )}
              >
                <span className="font-medium mr-2">{String.fromCharCode(65 + oi)}.</span>
                {opt}
              </button>
            )
          })}
        </div>
        {isSubmitted && (
          <div className="mt-3 text-xs text-zinc-400 bg-zinc-900 rounded-lg p-2.5 border border-zinc-700">
            <strong className="text-zinc-300">Explanation:</strong> {q.explanation}
          </div>
        )}
        {!isSubmitted && isAnswered && (
          <button
            onClick={onSubmit}
            className="mt-3 w-full py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors"
          >
            Check Answer
          </button>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function AITutor({
  courseTitle,
  currentModule,
  currentBlockContent,
  currentBlockTitle,
  isOpen,
  onToggle,
}: AITutorProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [activeMode, setActiveMode] = useState<InteractionMode>('ask')
  const [activeQuiz, setActiveQuiz] = useState<QuizData | null>(null)

  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const prevBlockRef = useRef(currentBlockTitle)

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isTyping, activeQuiz])

  // When block changes, add system message
  useEffect(() => {
    if (prevBlockRef.current !== currentBlockTitle && messages.length > 0) {
      setMessages(prev => [...prev, {
        id: uid(),
        role: 'system',
        content: `Context updated: ${currentBlockTitle}`,
        timestamp: Date.now(),
      }])
      setActiveQuiz(null)
    }
    prevBlockRef.current = currentBlockTitle
  }, [currentBlockTitle]) // eslint-disable-line react-hooks/exhaustive-deps

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 350)
    }
  }, [isOpen, isMinimized])

  const suggestions = generateSuggestions(currentBlockTitle, currentBlockContent)

  // ------ Send a message ------
  const sendMessage = useCallback((text: string, mode: InteractionMode = activeMode) => {
    if (!text.trim() && mode !== 'quiz' && mode !== 'summarize' && mode !== 'socratic') return

    const userMsg: ChatMessage = {
      id: uid(),
      role: 'user',
      content: text || (
        mode === 'quiz' ? 'Quiz me on this section' :
        mode === 'summarize' ? 'Summarize this section' :
        mode === 'socratic' ? 'Challenge my understanding' : text
      ),
      timestamp: Date.now(),
      mode,
    }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsTyping(true)

    // Simulate AI response delay
    const delay = 1200 + Math.random() * 800
    setTimeout(() => {
      if (mode === 'quiz') {
        const quizQuestions = generateMockQuiz(currentBlockContent, currentBlockTitle)
        const quizData: QuizData = {
          questions: quizQuestions,
          currentIndex: 0,
          answers: [null, null, null],
          submitted: false,
        }
        setActiveQuiz(quizData)
        setMessages(prev => [...prev, {
          id: uid(),
          role: 'assistant',
          content: `I\u2019ve prepared a **3-question quiz** based on "${currentBlockTitle}". Let\u2019s see what you\u2019ve learned!`,
          timestamp: Date.now(),
          mode: 'quiz',
          quiz: quizData,
        }])
      } else {
        const response = generateMockResponse(mode, text, currentBlockContent, currentBlockTitle)
        setMessages(prev => [...prev, {
          id: uid(),
          role: 'assistant',
          content: response,
          timestamp: Date.now(),
          mode,
        }])
      }
      setIsTyping(false)
    }, delay)
  }, [activeMode, currentBlockContent, currentBlockTitle])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isTyping) return
    sendMessage(input, activeMode)
  }

  const handleSuggestionClick = (suggestion: string) => {
    if (suggestion.toLowerCase().includes('quiz me')) {
      setActiveMode('quiz')
      sendMessage('', 'quiz')
    } else if (suggestion.toLowerCase().includes('key takeaway')) {
      setActiveMode('summarize')
      sendMessage('', 'summarize')
    } else {
      sendMessage(suggestion, 'ask')
    }
  }

  const handleQuizAnswer = (qIndex: number, optionIndex: number) => {
    setActiveQuiz(prev => {
      if (!prev) return prev
      const newAnswers = [...prev.answers]
      newAnswers[qIndex] = optionIndex
      return { ...prev, answers: newAnswers }
    })
  }

  const handleQuizSubmit = () => {
    setActiveQuiz(prev => {
      if (!prev) return prev
      const updated = { ...prev, submitted: true }
      // After showing result, advance to next question or finish
      setTimeout(() => {
        if (prev.currentIndex < prev.questions.length - 1) {
          setActiveQuiz(q => q ? { ...q, currentIndex: q.currentIndex + 1, submitted: false } : q)
        } else {
          // Quiz complete
          const correct = prev.answers.filter((a, i) => a === prev.questions[i].correctIndex).length
          setMessages(ms => [...ms, {
            id: uid(),
            role: 'assistant',
            content: `**Quiz Complete!** You scored **${correct}/${prev.questions.length}**.\n\n${
              correct === prev.questions.length
                ? 'Perfect score! You\u2019ve mastered this section. Ready to move on!'
                : correct >= 2
                  ? 'Great job! You have a solid grasp of the material. Review the explanations above for any questions you missed.'
                  : 'You might want to review this section again. Feel free to ask me to explain any concepts you\u2019re unsure about.'
            }`,
            timestamp: Date.now(),
          }])
          setActiveQuiz(null)
        }
      }, 2000)
      return updated
    })
  }

  const modeButtons: { mode: InteractionMode; icon: typeof Brain; label: string }[] = [
    { mode: 'ask', icon: MessageCircle, label: 'Ask' },
    { mode: 'explain', icon: Lightbulb, label: 'Explain' },
    { mode: 'summarize', icon: ListChecks, label: 'Summarize' },
    { mode: 'quiz', icon: HelpCircle, label: 'Quiz Me' },
    { mode: 'socratic', icon: Zap, label: 'Socratic' },
  ]

  // ------ Floating trigger button (hidden — DraggableAITutorButton in course-player handles this) ------
  if (!isOpen) {
    return null
  }

  // ------ Panel ------
  return (
    <div
      className={cn(
        'fixed right-0 top-0 z-50 h-full flex flex-col bg-zinc-900 border-l border-zinc-800 shadow-2xl shadow-black/40',
        'transition-all duration-300 ease-in-out',
        isMinimized ? 'w-[320px]' : 'w-[400px]',
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-900/95 backdrop-blur-sm flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-tempo-500 to-tempo-700 flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white leading-tight">AI Tutor</h3>
            <p className="text-[10px] text-zinc-500 leading-tight truncate max-w-[200px]">
              {courseTitle}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
          >
            {isMinimized ? <Maximize2 className="h-3.5 w-3.5" /> : <Minimize2 className="h-3.5 w-3.5" />}
          </button>
          <button
            onClick={onToggle}
            className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Attribution */}
      <div className="px-4 py-2 border-b border-zinc-800/60 flex-shrink-0">
        <div className="flex items-center gap-1.5 text-[10px] text-zinc-500">
          <BookOpen className="h-3 w-3 flex-shrink-0" />
          <span className="truncate">
            Based on: {courseTitle} &rsaquo; {currentModule} &rsaquo; {currentBlockTitle}
          </span>
        </div>
      </div>

      {/* Message area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto py-3 space-y-1 min-h-0">
        {messages.length === 0 && !isTyping && (
          <div className="flex flex-col items-center justify-center h-full px-6 text-center">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-600/20 border border-violet-500/20 flex items-center justify-center mb-4">
              <Sparkles className="h-7 w-7 text-violet-400" />
            </div>
            <h4 className="text-sm font-semibold text-zinc-200 mb-1">Your AI Learning Assistant</h4>
            <p className="text-xs text-zinc-500 mb-6 max-w-[260px]">
              I can explain concepts, quiz you, summarize content, and help deepen your understanding of the course material.
            </p>
            {/* Suggestions */}
            <div className="w-full space-y-2">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => handleSuggestionClick(s)}
                  className="w-full text-left px-3 py-2.5 rounded-xl bg-zinc-800/60 border border-zinc-700/50 hover:border-violet-500/40 hover:bg-zinc-800 transition-colors group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="h-6 w-6 rounded-md bg-violet-500/10 flex items-center justify-center flex-shrink-0">
                      {i === 0 && <Lightbulb className="h-3.5 w-3.5 text-violet-400" />}
                      {i === 1 && <Quote className="h-3.5 w-3.5 text-violet-400" />}
                      {i === 2 && <HelpCircle className="h-3.5 w-3.5 text-violet-400" />}
                      {i === 3 && <BookOpen className="h-3.5 w-3.5 text-violet-400" />}
                    </div>
                    <span className="text-xs text-zinc-300 group-hover:text-zinc-100 transition-colors">{s}</span>
                    <ArrowRight className="h-3 w-3 text-zinc-600 group-hover:text-violet-400 ml-auto transition-colors" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map(msg => (
          <MessageBubble key={msg.id} msg={msg} />
        ))}

        {activeQuiz && (
          <QuizView
            quiz={activeQuiz}
            onAnswer={handleQuizAnswer}
            onSubmit={handleQuizSubmit}
          />
        )}

        {isTyping && <TypingIndicator />}
      </div>

      {/* Mode selector + input */}
      <div className="border-t border-zinc-800 flex-shrink-0">
        {/* Mode buttons */}
        <div className="flex items-center gap-1 px-3 pt-2 pb-1 overflow-x-auto">
          {modeButtons.map(({ mode, icon: Icon, label }) => (
            <button
              key={mode}
              onClick={() => {
                setActiveMode(mode)
                if (mode === 'quiz') {
                  sendMessage('', 'quiz')
                } else if (mode === 'summarize') {
                  sendMessage('', 'summarize')
                } else if (mode === 'socratic') {
                  sendMessage('', 'socratic')
                }
              }}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors',
                activeMode === mode
                  ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 border border-transparent'
              )}
            >
              <Icon className="h-3 w-3" />
              {label}
            </button>
          ))}
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="flex items-center gap-2 px-3 pb-3 pt-1">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={
              activeMode === 'explain' ? 'Paste or type what you want explained...' :
              activeMode === 'ask' ? 'Ask anything about this section...' :
              'Type your message...'
            }
            disabled={isTyping}
            className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-3.5 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-colors disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            className="h-9 w-9 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white flex items-center justify-center transition-colors flex-shrink-0"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  )
}
