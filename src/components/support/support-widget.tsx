'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  HeadphonesIcon, X, Send, ChevronLeft, Plus,
  Clock, CheckCircle2, Loader2, AlertCircle,
} from 'lucide-react'

// ─── Types ──────────────────────────────────────────────────────────────────

interface Ticket {
  id: string
  subject: string
  description: string
  category: string
  priority: string
  status: string
  createdAt: string
  updatedAt: string
  resolvedAt: string | null
}

interface TicketMessage {
  id: string
  ticketId: string
  senderType: 'customer' | 'support'
  senderId: string
  message: string
  createdAt: string
}

type View = 'menu' | 'create' | 'list' | 'detail'

// ─── Helpers ────────────────────────────────────────────────────────────────

const categoryOptions = [
  { value: 'general', label: 'General' },
  { value: 'billing', label: 'Billing' },
  { value: 'authentication', label: 'Authentication' },
  { value: 'payroll', label: 'Payroll' },
  { value: 'integrations', label: 'Integrations' },
  { value: 'bug', label: 'Bug Report' },
  { value: 'feature', label: 'Feature Request' },
]

const priorityOptions = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
]

const statusIcons: Record<string, React.ReactNode> = {
  open: <Clock size={12} className="text-yellow-500" />,
  in_progress: <Loader2 size={12} className="text-blue-500" />,
  resolved: <CheckCircle2 size={12} className="text-green-500" />,
  closed: <CheckCircle2 size={12} className="text-gray-400" />,
}

const statusLabels: Record<string, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  closed: 'Closed',
}

function formatDateShort(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatDatetime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

// ─── Component ──────────────────────────────────────────────────────────────

export function SupportWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [view, setView] = useState<View>('menu')
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loadingTickets, setLoadingTickets] = useState(false)

  // Create form
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('general')
  const [priority, setPriority] = useState('medium')
  const [submitting, setSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  // Detail view
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [messages, setMessages] = useState<TicketMessage[]>([])
  const [replyText, setReplyText] = useState('')
  const [sendingReply, setSendingReply] = useState(false)

  // Fetch tickets
  const fetchTickets = useCallback(async () => {
    setLoadingTickets(true)
    try {
      const res = await fetch('/api/support')
      if (res.ok) {
        const data = await res.json()
        setTickets(data.tickets || [])
      }
    } catch {
      // Silently fail
    } finally {
      setLoadingTickets(false)
    }
  }, [])

  useEffect(() => {
    if (isOpen && (view === 'list' || view === 'menu')) {
      fetchTickets()
    }
  }, [isOpen, view, fetchTickets])

  // Create ticket
  const handleCreateTicket = async () => {
    if (!subject.trim() || !description.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', subject, description, category, priority }),
      })
      if (res.ok) {
        setSubmitSuccess(true)
        setSubject('')
        setDescription('')
        setCategory('general')
        setPriority('medium')
        setTimeout(() => {
          setSubmitSuccess(false)
          setView('list')
          fetchTickets()
        }, 1500)
      }
    } catch {
      // Silently fail
    } finally {
      setSubmitting(false)
    }
  }

  // Load ticket detail
  const openTicketDetail = async (ticket: Ticket) => {
    setSelectedTicket(ticket)
    setMessages([])
    setView('detail')
    try {
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'messages', ticketId: ticket.id }),
      })
      if (res.ok) {
        const data = await res.json()
        setMessages(data.messages || [])
      }
    } catch {
      // Show at least the description
      setMessages([{
        id: 'fallback',
        ticketId: ticket.id,
        senderType: 'customer',
        senderId: '',
        message: ticket.description,
        createdAt: ticket.createdAt,
      }])
    }
  }

  // Send reply
  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedTicket) return
    setSendingReply(true)
    try {
      await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reply', ticketId: selectedTicket.id, message: replyText }),
      })
    } catch { /* ignore */ }
    setMessages(prev => [...prev, {
      id: `m-${Date.now()}`,
      ticketId: selectedTicket.id,
      senderType: 'customer',
      senderId: '',
      message: replyText,
      createdAt: new Date().toISOString(),
    }])
    setReplyText('')
    setSendingReply(false)
  }

  const goBack = () => {
    if (view === 'detail') { setView('list'); setSelectedTicket(null) }
    else if (view === 'create' || view === 'list') setView('menu')
  }

  const openCount = tickets.filter(t => t.status === 'open' || t.status === 'in_progress').length

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 left-6 z-40 w-12 h-12 flex items-center justify-center rounded-full bg-tempo-600 text-white shadow-lg hover:bg-tempo-500 transition-all hover:scale-105 active:scale-95"
        aria-label="Support"
      >
        {isOpen ? <X size={20} /> : <HeadphonesIcon size={20} />}
        {!isOpen && openCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center rounded-full bg-red-500 text-[0.6rem] font-bold text-white">
            {openCount}
          </span>
        )}
      </button>

      {/* Slide-out Panel */}
      {isOpen && (
        <div className="fixed bottom-20 left-6 z-40 w-[360px] max-h-[520px] bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-2 fade-in duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-divider bg-canvas/50">
            <div className="flex items-center gap-2">
              {view !== 'menu' && (
                <button onClick={goBack} className="text-t3 hover:text-t1 p-0.5 rounded transition-colors">
                  <ChevronLeft size={16} />
                </button>
              )}
              <HeadphonesIcon size={16} className="text-tempo-600" />
              <span className="text-sm font-semibold text-t1">
                {view === 'menu' && 'Support'}
                {view === 'create' && 'Submit a Ticket'}
                {view === 'list' && 'My Tickets'}
                {view === 'detail' && 'Ticket Detail'}
              </span>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-t3 hover:text-t1 p-0.5 rounded transition-colors">
              <X size={16} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {/* Menu */}
            {view === 'menu' && (
              <div className="space-y-2">
                <button
                  onClick={() => setView('create')}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-canvas hover:bg-gray-100 dark:hover:bg-gray-800 border border-border transition-colors text-left"
                >
                  <div className="w-9 h-9 flex items-center justify-center rounded-lg bg-tempo-50 text-tempo-600">
                    <Plus size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-t1">Submit a Ticket</p>
                    <p className="text-[0.65rem] text-t3">Report an issue or request help</p>
                  </div>
                </button>

                <button
                  onClick={() => setView('list')}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-canvas hover:bg-gray-100 dark:hover:bg-gray-800 border border-border transition-colors text-left"
                >
                  <div className="w-9 h-9 flex items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                    <AlertCircle size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-t1">My Tickets</p>
                    <p className="text-[0.65rem] text-t3">
                      {openCount > 0 ? `${openCount} open ticket${openCount > 1 ? 's' : ''}` : 'View ticket history'}
                    </p>
                  </div>
                </button>
              </div>
            )}

            {/* Create Form */}
            {view === 'create' && (
              <div className="space-y-3">
                {submitSuccess ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <CheckCircle2 size={36} className="text-green-500 mb-3" />
                    <p className="text-sm font-medium text-t1">Ticket Submitted</p>
                    <p className="text-xs text-t3 mt-1">We&apos;ll get back to you soon.</p>
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="block text-[0.65rem] font-medium text-t2 uppercase tracking-wider mb-1">Subject</label>
                      <input
                        type="text"
                        value={subject}
                        onChange={e => setSubject(e.target.value)}
                        placeholder="Brief summary of the issue"
                        className="w-full h-9 px-3 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-t1 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-tempo-500/20 focus:border-tempo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[0.65rem] font-medium text-t2 uppercase tracking-wider mb-1">Description</label>
                      <textarea
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        placeholder="Describe the issue in detail..."
                        rows={4}
                        className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-t1 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-tempo-500/20 focus:border-tempo-500 resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[0.65rem] font-medium text-t2 uppercase tracking-wider mb-1">Category</label>
                        <select
                          value={category}
                          onChange={e => setCategory(e.target.value)}
                          className="w-full h-9 px-2 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-t1 focus:outline-none focus:ring-2 focus:ring-tempo-500/20 focus:border-tempo-500"
                        >
                          {categoryOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[0.65rem] font-medium text-t2 uppercase tracking-wider mb-1">Priority</label>
                        <select
                          value={priority}
                          onChange={e => setPriority(e.target.value)}
                          className="w-full h-9 px-2 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-t1 focus:outline-none focus:ring-2 focus:ring-tempo-500/20 focus:border-tempo-500"
                        >
                          {priorityOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <button
                      onClick={handleCreateTicket}
                      disabled={!subject.trim() || !description.trim() || submitting}
                      className="w-full h-9 flex items-center justify-center gap-2 text-sm font-medium bg-tempo-600 text-white rounded-xl hover:bg-tempo-500 transition-colors disabled:opacity-50 disabled:hover:bg-tempo-600"
                    >
                      {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                      {submitting ? 'Submitting...' : 'Submit Ticket'}
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Ticket List */}
            {view === 'list' && (
              <div className="space-y-2">
                {loadingTickets ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 size={20} className="animate-spin text-t3" />
                  </div>
                ) : tickets.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-t3">No tickets yet</p>
                    <button
                      onClick={() => setView('create')}
                      className="mt-2 text-xs text-tempo-600 hover:underline"
                    >
                      Submit your first ticket
                    </button>
                  </div>
                ) : (
                  tickets.map(ticket => (
                    <button
                      key={ticket.id}
                      onClick={() => openTicketDetail(ticket)}
                      className="w-full text-left p-3 rounded-xl bg-canvas hover:bg-gray-100 dark:hover:bg-gray-800 border border-border transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-t1 truncate">{ticket.subject}</p>
                          <p className="text-[0.65rem] text-t3 mt-0.5 truncate">{ticket.description}</p>
                        </div>
                        <div className="flex items-center gap-1 text-[0.6rem] text-t3 shrink-0">
                          {statusIcons[ticket.status] || statusIcons.open}
                          <span>{statusLabels[ticket.status] || ticket.status}</span>
                        </div>
                      </div>
                      <p className="text-[0.6rem] text-t3 mt-1">{formatDateShort(ticket.createdAt)} &middot; {ticket.category}</p>
                    </button>
                  ))
                )}
              </div>
            )}

            {/* Ticket Detail */}
            {view === 'detail' && selectedTicket && (
              <div className="space-y-3">
                <div>
                  <h4 className="text-sm font-medium text-t1">{selectedTicket.subject}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="flex items-center gap-1 text-[0.65rem] text-t3">
                      {statusIcons[selectedTicket.status]}
                      {statusLabels[selectedTicket.status]}
                    </span>
                    <span className="text-[0.65rem] text-t3">&middot;</span>
                    <span className="text-[0.65rem] text-t3">{selectedTicket.priority} priority</span>
                    <span className="text-[0.65rem] text-t3">&middot;</span>
                    <span className="text-[0.65rem] text-t3">{selectedTicket.category}</span>
                  </div>
                </div>

                {/* Messages */}
                <div className="space-y-2 max-h-56 overflow-y-auto">
                  {messages.map(msg => (
                    <div
                      key={msg.id}
                      className={`p-2.5 rounded-lg text-xs ${
                        msg.senderType === 'support'
                          ? 'bg-tempo-50 dark:bg-tempo-900/20 border border-tempo-200 dark:border-tempo-800/30 ml-6'
                          : 'bg-canvas border border-border mr-6'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-t2">
                          {msg.senderType === 'support' ? 'Support' : 'You'}
                        </span>
                        <span className="text-[0.6rem] text-t3">{formatDatetime(msg.createdAt)}</span>
                      </div>
                      <p className="text-t2 whitespace-pre-wrap">{msg.message}</p>
                    </div>
                  ))}
                </div>

                {/* Reply */}
                {(selectedTicket.status === 'open' || selectedTicket.status === 'in_progress') && (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={replyText}
                      onChange={e => setReplyText(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSendReply()}
                      placeholder="Type a message..."
                      className="flex-1 h-8 px-3 text-xs bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-t1 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-tempo-500/20 focus:border-tempo-500"
                    />
                    <button
                      onClick={handleSendReply}
                      disabled={!replyText.trim() || sendingReply}
                      className="h-8 w-8 flex items-center justify-center rounded-lg bg-tempo-600 text-white hover:bg-tempo-500 transition-colors disabled:opacity-50"
                    >
                      {sendingReply ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
