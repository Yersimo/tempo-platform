'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useTempo } from '@/lib/store'
import {
  processAssistantQuery,
  getProactiveInsights,
} from '@/lib/ai/assistant-engine'
import type { AssistantResponse, AssistantAction, ChatMessage } from '@/lib/ai/assistant-engine'
import {
  Sparkles,
  X,
  Send,
  ArrowRight,
  MessageSquare,
  Search,
  ChevronRight,
} from 'lucide-react'

// ---- Command Bar ----

function CommandBar({
  isOpen,
  onClose,
  onOpenChat,
}: {
  isOpen: boolean
  onClose: () => void
  onOpenChat: () => void
}) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<AssistantResponse | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const store = useTempo()
  const router = useRouter()

  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setResults(null)
      // Small delay to let the modal mount before focusing
      const t = setTimeout(() => inputRef.current?.focus(), 50)
      return () => clearTimeout(t)
    }
  }, [isOpen])

  const handleSubmit = useCallback(() => {
    if (!query.trim()) return
    const response = processAssistantQuery(query, store)
    setResults(response)

    // Auto-navigate if high confidence navigation
    if (response.type === 'navigation' && response.confidence > 0.7) {
      const navAction = response.actions?.find((a) => a.type === 'navigate')
      if (navAction) {
        router.push(navAction.payload)
        onClose()
      }
    }
  }, [query, store, router, onClose])

  const handleAction = useCallback(
    (action: AssistantAction) => {
      if (action.type === 'navigate') {
        router.push(action.payload)
        onClose()
      }
    },
    [router, onClose]
  )

  const handleSuggestionClick = useCallback(
    (q: string) => {
      setQuery(q)
      const r = processAssistantQuery(q, store)
      setResults(r)
    },
    [store]
  )

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] sm:pt-[20vh] px-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-2xl bg-card rounded-2xl shadow-2xl border border-border overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
          <Sparkles className="w-5 h-5 text-purple-500 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              if (!e.target.value.trim()) setResults(null)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSubmit()
              if (e.key === 'Escape') onClose()
            }}
            placeholder="Ask anything... 'Who's on leave?', 'Create a job posting', 'Payroll cost'"
            className="flex-1 bg-transparent text-t1 text-base sm:text-lg outline-none placeholder:text-t3"
          />
          <kbd className="hidden sm:inline text-xs text-t3 bg-canvas px-2 py-1 rounded border border-border">
            ESC
          </kbd>
        </div>

        {/* Results */}
        {results && (
          <div className="p-5 max-h-[400px] overflow-y-auto">
            <p className="text-sm text-t1 whitespace-pre-line leading-relaxed">{results.text}</p>
            {results.actions && results.actions.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {results.actions.map((action, i) => (
                  <button
                    key={i}
                    onClick={() => handleAction(action)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 text-sm font-medium hover:bg-purple-500/20 transition-colors"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Empty state — suggestions */}
        {!results && (
          <div className="p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-t3 uppercase tracking-wider">Suggestions</p>
              <button
                onClick={() => {
                  onClose()
                  onOpenChat()
                }}
                className="flex items-center gap-1.5 text-xs text-t3 hover:text-t1 transition-colors"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Open Chat
              </button>
            </div>
            <div className="space-y-1">
              {[
                'How many employees do we have?',
                "Who's on leave today?",
                'Show pending approvals',
                "What's our payroll cost?",
                'Open positions',
                'Headcount by department',
                'Create a job posting for Senior Analyst',
              ].map((q) => (
                <button
                  key={q}
                  onClick={() => handleSuggestionClick(q)}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm text-t2 hover:bg-purple-500/5 hover:text-t1 transition-colors flex items-center gap-2"
                >
                  <Search className="w-3.5 h-3.5 text-t3 shrink-0" />
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ---- Chat Panel ----

function ChatPanel({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [hasInitialized, setHasInitialized] = useState(false)
  const store = useTempo()
  const router = useRouter()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Show proactive insights on first open
  useEffect(() => {
    if (isOpen && !hasInitialized) {
      setHasInitialized(true)
      const insights = getProactiveInsights(store)
      if (insights.length > 0) {
        setMessages([
          {
            role: 'assistant',
            content: `Hi! I'm Tempo AI. Here's what needs your attention:`,
            response: insights[0],
            timestamp: new Date(),
          },
        ])
      } else {
        setMessages([
          {
            role: 'assistant',
            content:
              "Hi! I'm Tempo AI. Ask me anything about your people, payroll, compliance, or finances. I can also create things and take actions for you.",
            timestamp: new Date(),
          },
        ])
      }
    }
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen, hasInitialized, store])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  const sendMessage = useCallback(async () => {
    if (!input.trim() || isTyping) return
    const userMsg: ChatMessage = { role: 'user', content: input, timestamp: new Date() }
    setMessages((prev) => [...prev, userMsg])
    const queryText = input
    setInput('')
    setIsTyping(true)

    // Simulate typing delay for natural feel
    await new Promise((r) => setTimeout(r, 400 + Math.random() * 600))

    const response = processAssistantQuery(queryText, store)
    const assistantMsg: ChatMessage = {
      role: 'assistant',
      content: response.text,
      response,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, assistantMsg])
    setIsTyping(false)
  }, [input, isTyping, store])

  const handleAction = useCallback(
    (action: AssistantAction) => {
      if (action.type === 'navigate') {
        router.push(action.payload)
        onClose()
      }
    },
    [router, onClose]
  )

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[90] bg-black/20 backdrop-blur-[2px] sm:bg-transparent sm:backdrop-blur-none"
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <div
        className={`fixed top-0 right-0 z-[95] h-full w-full sm:w-[420px] bg-card border-l border-border shadow-2xl flex flex-col transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-amber-500 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-t1">Tempo AI</h2>
              <p className="text-xs text-t3">Ask anything about your org</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-hover text-t3 hover:text-t1 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                  msg.role === 'user'
                    ? 'bg-purple-500 text-white rounded-br-md'
                    : 'bg-canvas border border-border text-t1 rounded-bl-md'
                }`}
              >
                <p className="text-sm whitespace-pre-line leading-relaxed">{msg.content}</p>

                {/* Insight / action response */}
                {msg.response && msg.response.text !== msg.content && (
                  <p className="text-sm whitespace-pre-line leading-relaxed mt-2 opacity-90">
                    {msg.response.text}
                  </p>
                )}

                {/* Action Buttons */}
                {msg.response?.actions && msg.response.actions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {msg.response.actions.map((action, j) => (
                      <button
                        key={j}
                        onClick={() => handleAction(action)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          msg.role === 'user'
                            ? 'bg-white/20 text-white hover:bg-white/30'
                            : 'bg-purple-500/10 text-purple-600 dark:text-purple-400 hover:bg-purple-500/20'
                        }`}
                      >
                        <ArrowRight className="w-3 h-3" />
                        {action.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-canvas border border-border rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          {/* Empty state suggestions */}
          {messages.length <= 1 && !isTyping && (
            <div className="pt-2">
              <p className="text-xs text-t3 uppercase tracking-wider mb-2 px-1">Try asking</p>
              <div className="space-y-1">
                {[
                  'How many employees do we have?',
                  "What's our turnover rate?",
                  'Show pending approvals',
                  'Headcount by department',
                  'Open positions',
                ].map((q) => (
                  <button
                    key={q}
                    onClick={() => {
                      setInput(q)
                      // Auto-send
                      const userMsg: ChatMessage = { role: 'user', content: q, timestamp: new Date() }
                      setMessages((prev) => [...prev, userMsg])
                      setIsTyping(true)
                      setTimeout(() => {
                        const response = processAssistantQuery(q, store)
                        setMessages((prev) => [
                          ...prev,
                          { role: 'assistant', content: response.text, response, timestamp: new Date() },
                        ])
                        setIsTyping(false)
                        setInput('')
                      }, 500 + Math.random() * 500)
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg text-sm text-t2 hover:bg-purple-500/5 hover:text-t1 transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-border p-4 shrink-0">
          <div className="flex items-center gap-2 bg-canvas border border-border rounded-xl px-4 py-2.5 focus-within:border-purple-500/50 focus-within:ring-2 focus-within:ring-purple-500/10 transition-all">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  sendMessage()
                }
              }}
              placeholder="Ask Tempo AI..."
              className="flex-1 bg-transparent text-sm text-t1 outline-none placeholder:text-t3"
              disabled={isTyping}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || isTyping}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-purple-500 text-white disabled:opacity-30 hover:bg-purple-600 transition-colors shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-[10px] text-t3 mt-2 text-center">
            Tempo AI processes data locally. Press <kbd className="bg-canvas px-1 rounded border border-border">⌘J</kbd> for quick access.
          </p>
        </div>
      </div>
    </>
  )
}

// ---- Floating AI Button ----

function AIFloatingButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 z-40 w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-amber-500 text-white shadow-lg hover:shadow-xl hover:scale-110 transition-all flex items-center justify-center group"
      title="Ask Tempo AI (⌘J)"
      aria-label="Open Tempo AI Assistant"
    >
      <Sparkles className="w-5 h-5" />
      <span className="absolute -top-10 right-0 bg-card text-t1 text-xs px-2.5 py-1.5 rounded-lg shadow-lg border border-border opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
        Ask Tempo AI
        <kbd className="ml-1.5 text-[10px] text-t3 bg-canvas px-1 rounded border border-border">
          ⌘J
        </kbd>
      </span>
    </button>
  )
}

// ---- Main Exported Component ----

export function TempoAI() {
  const [commandBarOpen, setCommandBarOpen] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  const pathname = usePathname()

  // Close panels on navigation
  useEffect(() => {
    setCommandBarOpen(false)
  }, [pathname])

  // Keyboard shortcut: Cmd+J / Ctrl+J for AI (⌘J reserved for search)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'j') {
        e.preventDefault()
        setChatOpen(prev => !prev)
        setCommandBarOpen(false)
      }
      if (e.key === 'Escape') {
        if (commandBarOpen) setCommandBarOpen(false)
        else if (chatOpen) setChatOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [commandBarOpen, chatOpen])

  return (
    <>
      <AIFloatingButton
        onClick={() => {
          setCommandBarOpen(false)
          setChatOpen((prev) => !prev)
        }}
      />
      <CommandBar
        isOpen={commandBarOpen}
        onClose={() => setCommandBarOpen(false)}
        onOpenChat={() => setChatOpen(true)}
      />
      <ChatPanel isOpen={chatOpen} onClose={() => setChatOpen(false)} />
    </>
  )
}
