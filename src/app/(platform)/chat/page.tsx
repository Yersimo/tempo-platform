'use client'

import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import {
  MessageSquare,
  Send,
  Hash,
  Users,
  Plus,
  Search,
  Smile,
  Paperclip,
  AtSign,
  Pin,
  Lock,
  Settings,
  Bell,
  Star,
  Loader2,
  RefreshCw,
} from 'lucide-react'
import { useTempo } from '@/lib/store'
import { cn } from '@/lib/utils/cn'

// ---------- helpers ----------
function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

function formatTime(ts: string): string {
  const d = new Date(ts)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function formatDate(ts: string): string {
  const d = new Date(ts)
  const today = new Date()
  if (d.toDateString() === today.toDateString()) return 'Today'
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
}

// Normalize DB row (snake_case) → component shape
// DB: { id, channelId, senderId, content, createdAt, isPinned, ... }
// Component: { id, channel_id, sender_id, content, timestamp, is_pinned, reactions }
function normalizeMessage(row: any): any {
  return {
    id: row.id,
    channel_id: row.channelId || row.channel_id,
    sender_id: row.senderId || row.sender_id,
    content: row.content,
    timestamp: row.createdAt || row.created_at || row.timestamp || row.sent_at,
    is_pinned: row.isPinned ?? row.is_pinned ?? false,
    is_edited: row.isEdited ?? row.is_edited ?? false,
    reactions: row.reactions || [],
    thread_id: row.threadId || row.thread_id,
    file_url: row.fileUrl || row.file_url,
    file_name: row.fileName || row.file_name,
  }
}

function normalizeChannel(row: any): any {
  return {
    id: row.id,
    name: row.name,
    type: row.type === 'direct' ? 'private' : row.type === 'announcement' ? 'public' : row.type || 'public',
    description: row.description || '',
    member_count: row.memberCount ?? row.member_count ?? 0,
    last_message_at: row.lastMessageAt || row.last_message_at,
    unread_count: row.unreadCount ?? row.unread_count ?? 0,
  }
}

// ---------- API helpers ----------
async function chatAPI(method: 'GET' | 'POST' | 'PUT' | 'DELETE', params?: Record<string, string>, body?: any) {
  const url = new URL('/api/chat', window.location.origin)
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null) url.searchParams.set(k, v)
    }
  }
  const res = await fetch(url.toString(), {
    method,
    headers: method !== 'GET' ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'include', // sends httpOnly session cookie → middleware injects x-org-id
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(err.error || `Chat API error ${res.status}`)
  }
  return res.json()
}

// ---------- component ----------
export default function ChatPage() {
  const { employees, currentUser, chatChannels, chatMessages, addToast } = useTempo()
  const employeeId = currentUser?.employee_id || ''

  // Whether we're in "live API" mode or "seed data" fallback
  const [isLive, setIsLive] = useState(false)
  const [loading, setLoading] = useState(true)

  // Channels
  const [channels, setChannels] = useState<any[]>([])
  const [activeChannelId, setActiveChannelId] = useState('')

  // Messages for the active channel
  const [messages, setMessages] = useState<any[]>([])
  const [messagesLoading, setMessagesLoading] = useState(false)

  // Unread counts
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({})

  // UI state
  const [messageInput, setMessageInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateChannel, setShowCreateChannel] = useState(false)
  const [newChannelName, setNewChannelName] = useState('')
  const [newChannelType, setNewChannelType] = useState<'public' | 'private'>('public')
  const [newChannelDesc, setNewChannelDesc] = useState('')
  const [sidebarSection, setSidebarSection] = useState<'channels' | 'dms'>('channels')
  const [dmSearch, setDmSearch] = useState('')
  const [sending, setSending] = useState(false)
  const [typingUsers, setTypingUsers] = useState<Record<string, number>>({})
  const [threadMessage, setThreadMessage] = useState<any>(null)
  const [threadReplies, setThreadReplies] = useState<any[]>([])
  const [threadInput, setThreadInput] = useState('')
  const [savedMessageIds, setSavedMessageIds] = useState<Set<string>>(new Set())

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const eventSourceRef = useRef<EventSource | null>(null)
  const lastFetchRef = useRef<string>('')
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // ---- Load channels from API on mount ----
  useEffect(() => {
    let cancelled = false
    async function loadChannels() {
      if (!employeeId) { setLoading(false); return }
      try {
        const data = await chatAPI('GET', { action: 'channels', employeeId })
        if (cancelled) return
        if (data.channels && data.channels.length > 0) {
          const normalized = data.channels.map(normalizeChannel)
          setChannels(normalized)
          setActiveChannelId(normalized[0].id)
          setIsLive(true)
          // Also load unread counts
          try {
            const unread = await chatAPI('GET', { action: 'unread', employeeId })
            if (!cancelled && unread.channels) {
              const counts: Record<string, number> = {}
              unread.channels.forEach((c: any) => { counts[c.channelId || c.channel_id] = c.unreadCount || c.unread_count || 0 })
              setUnreadCounts(counts)
            }
          } catch { /* non-critical */ }
        } else {
          // No channels in DB — use store data as fallback
          if (chatChannels.length > 0) {
            const normalized = chatChannels.map(normalizeChannel)
            setChannels(normalized)
            setActiveChannelId(normalized[0].id)
          }
          setIsLive(false)
        }
      } catch {
        // API unavailable — use store data as fallback
        if (chatChannels.length > 0) {
          const normalized = chatChannels.map(normalizeChannel)
          setChannels(normalized)
          setActiveChannelId(normalized[0].id)
        }
        setIsLive(false)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    loadChannels()
    return () => { cancelled = true }
  }, [employeeId, chatChannels])

  // ---- Load messages when active channel changes ----
  const fetchMessages = useCallback(async (channelId: string) => {
    if (!employeeId) return
    if (!isLive) {
      // Store data mode — filter from store chatMessages
      const storeFiltered = chatMessages
        .map(normalizeMessage)
        .filter((m: any) => m.channel_id === channelId)
      setMessages(storeFiltered)
      return
    }
    setMessagesLoading(true)
    try {
      const data = await chatAPI('GET', { action: 'messages', channelId, employeeId, limit: '100' })
      const msgs = (data.messages || data || []).map(normalizeMessage)
      setMessages(msgs)
      lastFetchRef.current = channelId
      // Mark as read
      chatAPI('POST', undefined, { action: 'mark-read', channelId, employeeId }).catch(() => {})
      setUnreadCounts(prev => ({ ...prev, [channelId]: 0 }))
    } catch {
      // Fallback to store chatMessages
      const storeFiltered = chatMessages
        .map(normalizeMessage)
        .filter((m: any) => m.channel_id === channelId)
      setMessages(storeFiltered)
    } finally {
      setMessagesLoading(false)
    }
  }, [employeeId, isLive, chatMessages])

  useEffect(() => {
    fetchMessages(activeChannelId)
  }, [activeChannelId, fetchMessages])

  // ---- SSE for real-time chat updates ----
  useEffect(() => {
    if (!isLive || !employeeId || channels.length === 0) return
    const channelIds = channels.map(c => c.id).join(',')
    const es = new EventSource(`/api/chat/stream?employeeId=${employeeId}&channels=${channelIds}`)
    eventSourceRef.current = es

    es.addEventListener('message', (e) => {
      try {
        const data = JSON.parse(e.data)
        if (data.deleted) {
          setMessages(prev => prev.filter(m => m.id !== data.id))
        } else if (data.edited) {
          setMessages(prev => prev.map(m => m.id === data.id ? normalizeMessage(data) : m))
        } else {
          // New message
          const normalized = normalizeMessage(data)
          setMessages(prev => {
            if (prev.some(m => m.id === normalized.id)) return prev
            return [...prev, normalized]
          })
        }
      } catch { /* ignore parse errors */ }
    })

    es.addEventListener('typing', (e) => {
      try {
        const data = JSON.parse(e.data)
        if (data.employeeId !== employeeId) {
          setTypingUsers(prev => ({ ...prev, [data.employeeId]: Date.now() }))
          // Clear typing indicator after 3 seconds
          setTimeout(() => {
            setTypingUsers(prev => {
              const next = { ...prev }
              delete next[data.employeeId]
              return next
            })
          }, 3000)
        }
      } catch { /* ignore */ }
    })

    es.addEventListener('reaction', (e) => {
      try {
        const data = JSON.parse(e.data)
        setMessages(prev => prev.map(m =>
          m.id === data.messageId ? { ...m, reactions: data.reactions || m.reactions } : m
        ))
      } catch { /* ignore */ }
    })

    es.onerror = () => {
      // SSE connection lost, will auto-reconnect
    }

    return () => {
      es.close()
      eventSourceRef.current = null
    }
  }, [isLive, employeeId, channels])

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  // Active channel object
  const activeChannel = useMemo(
    () => channels.find(c => c.id === activeChannelId) || channels[0],
    [channels, activeChannelId]
  )

  // Group messages by date
  const groupedMessages = useMemo(() => {
    const sorted = [...messages].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    const groups: { date: string; messages: typeof sorted }[] = []
    let currentDate = ''
    sorted.forEach(msg => {
      const date = formatDate(msg.timestamp)
      if (date !== currentDate) {
        currentDate = date
        groups.push({ date, messages: [msg] })
      } else {
        groups[groups.length - 1].messages.push(msg)
      }
    })
    return groups
  }, [messages])

  // Filtered channels for search
  const filteredChannels = useMemo(
    () => channels.filter(
      c => c.name?.toLowerCase().includes(searchQuery.toLowerCase()) || c.description?.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    [channels, searchQuery]
  )

  // Derive DM contacts from employees list
  const dmContacts = useMemo(
    () => employees
      .filter(e => e.id !== employeeId)
      .slice(0, 20)
      .map((e, idx) => ({
        id: e.id || `dm-${idx}`,
        name: e.profile?.full_name || (e as any).full_name || 'Unknown',
        status: (idx % 3 === 0 ? 'online' : idx % 3 === 1 ? 'away' : 'offline') as 'online' | 'away' | 'offline',
      })),
    [employees, employeeId]
  )

  // Filtered DM contacts
  const filteredDMs = useMemo(
    () => dmContacts.filter(d => d.name.toLowerCase().includes(dmSearch.toLowerCase())),
    [dmContacts, dmSearch]
  )

  // Sender name lookup
  function getSenderName(senderId: string): string {
    const emp = employees.find(e => e.id === senderId)
    if (emp) return emp.profile?.full_name || (emp as any).full_name || 'Unknown'
    return 'Unknown User'
  }

  // ---- Send message (real API or local) ----
  async function handleSend() {
    const content = messageInput.trim()
    if (!content || sending) return
    setSending(true)
    try {
      if (isLive) {
        const result = await chatAPI('POST', undefined, {
          action: 'send-message',
          channelId: activeChannelId,
          senderId: employeeId,
          content,
        })
        // Add to local messages immediately
        setMessages(prev => [...prev, normalizeMessage(result.message || result)])
      } else {
        // Seed data mode — add locally
        const newMsg = {
          id: `msg-local-${Date.now()}`,
          channel_id: activeChannelId,
          sender_id: employeeId || 'emp-1',
          content,
          timestamp: new Date().toISOString(),
          is_pinned: false,
          reactions: [],
        }
        setMessages(prev => [...prev, newMsg])
      }
    } catch {
      // If API fails, add locally anyway for UX
      setMessages(prev => [...prev, {
        id: `msg-local-${Date.now()}`,
        channel_id: activeChannelId,
        sender_id: employeeId || 'emp-1',
        content,
        timestamp: new Date().toISOString(),
        is_pinned: false,
        reactions: [],
      }])
    } finally {
      setMessageInput('')
      setSending(false)
      inputRef.current?.focus()
    }
  }

  // ---- Create channel (real API or local) ----
  async function handleCreateChannel() {
    const name = newChannelName.trim().toLowerCase().replace(/\s+/g, '-')
    if (!name) return
    try {
      if (isLive) {
        const result = await chatAPI('POST', undefined, {
          action: 'create-channel',
          createdBy: employeeId,
          name,
          description: newChannelDesc.trim(),
          type: newChannelType,
          memberIds: [employeeId],
        })
        const ch = normalizeChannel(result.channel || result)
        setChannels(prev => [...prev, ch])
        setActiveChannelId(ch.id)
      } else {
        const ch = { id: `chan-${name}`, name, type: newChannelType, description: newChannelDesc.trim(), member_count: 1 }
        setChannels(prev => [...prev, ch])
        setActiveChannelId(ch.id)
      }
    } catch {
      // Local fallback
      const ch = { id: `chan-${name}`, name, type: newChannelType, description: newChannelDesc.trim(), member_count: 1 }
      setChannels(prev => [...prev, ch])
      setActiveChannelId(ch.id)
    }
    setNewChannelName('')
    setNewChannelDesc('')
    setShowCreateChannel(false)
  }

  // ---- Pin/unpin message ----
  async function handleTogglePin(msgId: string, currentlyPinned: boolean) {
    if (isLive) {
      try {
        await chatAPI('POST', undefined, {
          action: 'pin-message',
          messageId: msgId,
          pinnedBy: employeeId,
          pin: !currentlyPinned,
        })
      } catch { /* fall through to local toggle */ }
    }
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, is_pinned: !currentlyPinned } : m))
  }

  // ---- Add reaction ----
  async function handleReaction(msgId: string, emoji: string) {
    if (isLive) {
      try {
        await chatAPI('POST', undefined, { action: 'add-reaction', messageId: msgId, employeeId, emoji })
      } catch { /* fall through to local update */ }
    }
    setMessages(prev => prev.map(m => {
      if (m.id !== msgId) return m
      const existing = (m.reactions || []).find((r: any) => r.emoji === emoji)
      if (existing) {
        return { ...m, reactions: m.reactions.map((r: any) => r.emoji === emoji ? { ...r, count: r.count + 1 } : r) }
      }
      return { ...m, reactions: [...(m.reactions || []), { emoji, count: 1 }] }
    }))
  }

  // ---- Open thread view ----
  function openThread(msg: any) {
    setThreadMessage(msg)
    // Load existing thread replies from messages with this thread_id
    const replies = messages.filter(m => m.thread_id === msg.id)
    setThreadReplies(replies)
    setThreadInput('')
  }

  function closeThread() {
    setThreadMessage(null)
    setThreadReplies([])
    setThreadInput('')
  }

  async function sendThreadReply() {
    const content = threadInput.trim()
    if (!content || !threadMessage) return
    const newReply = {
      id: `reply-${Date.now()}`,
      channel_id: activeChannelId,
      sender_id: employeeId || 'emp-1',
      content,
      timestamp: new Date().toISOString(),
      thread_id: threadMessage.id,
      is_pinned: false,
      reactions: [],
    }
    if (isLive) {
      try {
        await chatAPI('POST', undefined, {
          action: 'send-message',
          channelId: activeChannelId,
          senderId: employeeId,
          content,
          threadId: threadMessage.id,
        })
      } catch { /* fall through to local */ }
    }
    setThreadReplies(prev => [...prev, newReply])
    setMessages(prev => [...prev, newReply])
    setThreadInput('')
  }

  // ---- Save/bookmark message ----
  function toggleSaveMessage(msgId: string) {
    setSavedMessageIds(prev => {
      const next = new Set(prev)
      if (next.has(msgId)) {
        next.delete(msgId)
        addToast('Message unsaved', 'success')
      } else {
        next.add(msgId)
        addToast('Message saved', 'success')
      }
      return next
    })
  }

  // Key handler
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const pinnedCount = messages.filter(m => m.is_pinned).length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <Loader2 className="animate-spin text-tempo-600" size={32} />
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden bg-surface">
      {/* ──────── LEFT SIDEBAR ──────── */}
      <div className="w-64 flex-shrink-0 bg-card border-r border-divider flex flex-col">
        {/* Workspace header */}
        <div className="px-4 py-3 border-b border-divider">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-t1 flex items-center gap-1.5">
              <MessageSquare size={16} className="text-tempo-600" />
              Tempo Chat
              {isLive && (
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 ml-1" title="Connected to server" />
              )}
            </h2>
            <Button variant="ghost" size="sm" className="p-1" onClick={() => setShowCreateChannel(true)}>
              <Plus size={14} />
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="px-3 py-2">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-t3" />
            <input
              type="text"
              placeholder="Search channels..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-canvas border border-divider rounded-md text-t1 placeholder:text-t3 focus:outline-none focus:ring-1 focus:ring-tempo-600/30 focus:border-tempo-600"
            />
          </div>
        </div>

        {/* Section tabs */}
        <div className="flex px-3 gap-1 mb-1">
          <button
            onClick={() => setSidebarSection('channels')}
            className={cn(
              'flex-1 text-xs font-medium py-1.5 rounded-md transition-colors',
              sidebarSection === 'channels' ? 'bg-tempo-600/10 text-tempo-600' : 'text-t3 hover:text-t2 hover:bg-canvas'
            )}
          >
            Channels
          </button>
          <button
            onClick={() => setSidebarSection('dms')}
            className={cn(
              'flex-1 text-xs font-medium py-1.5 rounded-md transition-colors',
              sidebarSection === 'dms' ? 'bg-tempo-600/10 text-tempo-600' : 'text-t3 hover:text-t2 hover:bg-canvas'
            )}
          >
            Direct Messages
          </button>
        </div>

        {/* Channel / DM list */}
        <div className="flex-1 overflow-y-auto px-1.5">
          {sidebarSection === 'channels' && (
            <div className="space-y-0.5">
              {filteredChannels.map(channel => {
                const isActive = channel.id === activeChannelId
                const unread = unreadCounts[channel.id] || 0
                return (
                  <button
                    key={channel.id}
                    onClick={() => setActiveChannelId(channel.id)}
                    className={cn(
                      'w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-left transition-colors group',
                      isActive
                        ? 'bg-tempo-600/10 text-tempo-400'
                        : 'text-t2 hover:bg-canvas hover:text-t1'
                    )}
                  >
                    {channel.type === 'private' ? (
                      <Lock size={14} className="flex-shrink-0 text-t3" />
                    ) : (
                      <Hash size={14} className="flex-shrink-0 text-t3" />
                    )}
                    <span className={cn('text-xs truncate flex-1', unread > 0 && !isActive && 'font-semibold text-t1')}>
                      {channel.name}
                    </span>
                    {unread > 0 && !isActive && (
                      <Badge variant="orange" className="text-[0.6rem] px-1.5 py-0 min-w-[18px] text-center">
                        {unread}
                      </Badge>
                    )}
                  </button>
                )
              })}
            </div>
          )}

          {sidebarSection === 'dms' && (
            <div className="space-y-0.5">
              <div className="px-2 pb-2">
                <div className="relative">
                  <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-t3" />
                  <input
                    type="text"
                    placeholder="Find a person..."
                    value={dmSearch}
                    onChange={e => setDmSearch(e.target.value)}
                    className="w-full pl-7 pr-2 py-1 text-xs bg-canvas border border-divider rounded-md text-t1 placeholder:text-t3 focus:outline-none focus:ring-1 focus:ring-tempo-600/30"
                  />
                </div>
              </div>
              {filteredDMs.map(dm => (
                <button
                  key={dm.id}
                  className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-left text-t2 hover:bg-canvas hover:text-t1 transition-colors"
                >
                  <div className="relative">
                    <div className="w-6 h-6 rounded-full bg-tempo-600/15 flex items-center justify-center">
                      <span className="text-[0.6rem] font-semibold text-tempo-600">{getInitials(dm.name)}</span>
                    </div>
                    <span
                      className={cn(
                        'absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-card',
                        dm.status === 'online' && 'bg-green-500',
                        dm.status === 'away' && 'bg-amber-400',
                        dm.status === 'offline' && 'bg-gray-300'
                      )}
                    />
                  </div>
                  <span className="text-xs truncate">{dm.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Create channel button */}
        <div className="px-3 py-3 border-t border-divider">
          <Button
            variant="secondary"
            size="sm"
            className="w-full justify-center"
            onClick={() => setShowCreateChannel(true)}
          >
            <Plus size={14} />
            Create Channel
          </Button>
        </div>
      </div>

      {/* ──────── MAIN CHAT AREA ──────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Channel header */}
        <div className="flex-shrink-0 px-5 py-3 border-b border-divider bg-card flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex items-center gap-1.5">
              {activeChannel?.type === 'private' ? (
                <Lock size={16} className="text-t2" />
              ) : (
                <Hash size={18} className="text-t2 font-bold" />
              )}
              <h1 className="text-sm font-bold text-t1 truncate">{activeChannel?.name}</h1>
            </div>
            {activeChannel?.description && (
              <>
                <span className="text-divider">|</span>
                <p className="text-xs text-t3 truncate max-w-md">{activeChannel.description}</p>
              </>
            )}
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {isLive && (
              <Button
                variant="ghost"
                size="sm"
                className="text-t3 hover:text-t1"
                onClick={() => fetchMessages(activeChannelId)}
                title="Refresh messages"
              >
                <RefreshCw size={14} />
              </Button>
            )}
            {pinnedCount > 0 && (
              <Button variant="ghost" size="sm" className="text-t3 hover:text-t1 gap-1">
                <Pin size={14} />
                <span className="text-xs">{pinnedCount}</span>
              </Button>
            )}
            <Button variant="ghost" size="sm" className="text-t3 hover:text-t1 gap-1">
              <Users size={14} />
              <span className="text-xs">{activeChannel?.member_count || 0}</span>
            </Button>
            <Button variant="ghost" size="sm" className="text-t3 hover:text-t1">
              <Bell size={14} />
            </Button>
            <Button variant="ghost" size="sm" className="text-t3 hover:text-t1">
              <Settings size={14} />
            </Button>
          </div>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {messagesLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="animate-spin text-tempo-600" size={24} />
            </div>
          )}

          {!messagesLoading && messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-14 h-14 rounded-xl bg-tempo-600/10 flex items-center justify-center mb-4">
                <Hash size={28} className="text-tempo-600" />
              </div>
              <h3 className="text-base font-semibold text-t1 mb-1">Welcome to #{activeChannel?.name}</h3>
              <p className="text-sm text-t3 max-w-md">
                {activeChannel?.description || 'This is the start of the conversation. Send a message to get things going!'}
              </p>
            </div>
          )}

          {/* Grouped messages */}
          {groupedMessages.map(group => (
            <div key={group.date}>
              {/* Date divider */}
              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-px bg-divider" />
                <span className="text-[0.65rem] font-medium text-t3 bg-surface px-2 py-0.5 rounded-full border border-divider">
                  {group.date}
                </span>
                <div className="flex-1 h-px bg-divider" />
              </div>

              {/* Messages */}
              {group.messages.map((msg, idx) => {
                const senderName = getSenderName(msg.sender_id)
                const prevMsg = idx > 0 ? group.messages[idx - 1] : null
                const isSameSender = prevMsg && prevMsg.sender_id === msg.sender_id
                const timeDiff = prevMsg
                  ? (new Date(msg.timestamp).getTime() - new Date(prevMsg.timestamp).getTime()) / 60000
                  : Infinity
                const showHeader = !isSameSender || timeDiff > 5

                return (
                  <div
                    key={msg.id}
                    className={cn(
                      'group relative px-2 py-0.5 -mx-2 rounded-md hover:bg-canvas/50 transition-colors',
                      msg.is_pinned && 'bg-amber-500/5 border-l-2 border-amber-400 pl-3'
                    )}
                  >
                    {showHeader ? (
                      <div className="flex items-start gap-3 mt-3">
                        <div className="w-9 h-9 rounded-lg bg-tempo-600/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-xs font-bold text-tempo-600">{getInitials(senderName)}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2">
                            <span className="text-sm font-semibold text-t1">{senderName}</span>
                            <span className="text-[0.65rem] text-t3">{formatTime(msg.timestamp)}</span>
                            {msg.is_pinned && <Pin size={10} className="text-amber-500" />}
                            {msg.is_edited && <span className="text-[0.6rem] text-t3">(edited)</span>}
                          </div>
                          <p className="text-sm text-t2 mt-0.5 leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                          {msg.reactions && msg.reactions.length > 0 && (
                            <div className="flex gap-1.5 mt-1.5">
                              {msg.reactions.map((r: { emoji: string; count: number }, rIdx: number) => (
                                <button
                                  key={rIdx}
                                  onClick={() => handleReaction(msg.id, r.emoji)}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-canvas border border-divider rounded-full text-xs hover:border-tempo-400 transition-colors"
                                >
                                  <span>{r.emoji}</span>
                                  <span className="text-t3 text-[0.65rem]">{r.count}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start gap-3">
                        <div className="w-9 flex items-center justify-center flex-shrink-0">
                          <span className="text-[0.6rem] text-t3 opacity-0 group-hover:opacity-100 transition-opacity">
                            {formatTime(msg.timestamp)}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-t2 leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                          {msg.reactions && msg.reactions.length > 0 && (
                            <div className="flex gap-1.5 mt-1.5">
                              {msg.reactions.map((r: { emoji: string; count: number }, rIdx: number) => (
                                <button
                                  key={rIdx}
                                  onClick={() => handleReaction(msg.id, r.emoji)}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-canvas border border-divider rounded-full text-xs hover:border-tempo-400 transition-colors"
                                >
                                  <span>{r.emoji}</span>
                                  <span className="text-t3 text-[0.65rem]">{r.count}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Hover actions */}
                    <div className="absolute right-2 top-1 hidden group-hover:flex items-center gap-0.5 bg-card border border-divider rounded-md shadow-sm px-1 py-0.5">
                      <button
                        onClick={() => handleReaction(msg.id, '👍')}
                        className="p-1 hover:bg-canvas rounded text-t3 hover:text-t1 transition-colors"
                        title="React"
                      >
                        <Smile size={14} />
                      </button>
                      <button
                        onClick={() => openThread(msg)}
                        className="p-1 hover:bg-canvas rounded text-t3 hover:text-t1 transition-colors"
                        title="Thread"
                      >
                        <MessageSquare size={14} />
                      </button>
                      <button
                        onClick={() => handleTogglePin(msg.id, msg.is_pinned)}
                        className="p-1 hover:bg-canvas rounded text-t3 hover:text-t1 transition-colors"
                        title={msg.is_pinned ? 'Unpin' : 'Pin'}
                      >
                        <Pin size={14} />
                      </button>
                      <button
                        onClick={() => toggleSaveMessage(msg.id)}
                        className={cn(
                          'p-1 hover:bg-canvas rounded transition-colors',
                          savedMessageIds.has(msg.id) ? 'text-amber-500' : 'text-t3 hover:text-t1'
                        )}
                        title={savedMessageIds.has(msg.id) ? 'Unsave' : 'Save'}
                      >
                        <Star size={14} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          ))}

          <div ref={messagesEndRef} />
        </div>

        {/* Typing indicator */}
        {Object.keys(typingUsers).length > 0 && (
          <div className="px-4 py-1 text-xs text-muted-foreground">
            {Object.keys(typingUsers).map(uid => {
              const emp = employees.find(e => e.id === uid)
              return emp?.profile?.full_name || 'Someone'
            }).join(', ')} {Object.keys(typingUsers).length === 1 ? 'is' : 'are'} typing...
          </div>
        )}

        {/* Message input */}
        <div className="flex-shrink-0 px-5 py-3 border-t border-divider bg-card">
          <div className="flex items-end gap-2">
            <div className="flex-1 relative">
              <div className="flex items-center gap-1 border border-divider rounded-lg bg-surface focus-within:ring-2 focus-within:ring-tempo-600/20 focus-within:border-tempo-600 transition-all">
                <button className="p-2.5 text-t3 hover:text-t1 transition-colors flex-shrink-0">
                  <Plus size={18} />
                </button>
                <input
                  ref={inputRef}
                  type="text"
                  placeholder={`Message #${activeChannel?.name || 'channel'}...`}
                  value={messageInput}
                  onChange={e => {
                    setMessageInput(e.target.value)
                    // Send typing indicator (debounced)
                    if (!typingTimeoutRef.current && isLive) {
                      chatAPI('POST', undefined, { action: 'typing', channelId: activeChannelId, employeeId }).catch(() => {})
                      typingTimeoutRef.current = setTimeout(() => { typingTimeoutRef.current = null }, 2000)
                    }
                  }}
                  onKeyDown={handleKeyDown}
                  className="flex-1 py-2.5 text-sm bg-transparent text-t1 placeholder:text-t3 focus:outline-none"
                />
                <div className="flex items-center gap-0.5 pr-1.5 flex-shrink-0">
                  <button className="p-1.5 text-t3 hover:text-t1 transition-colors rounded hover:bg-canvas">
                    <AtSign size={16} />
                  </button>
                  <button className="p-1.5 text-t3 hover:text-t1 transition-colors rounded hover:bg-canvas">
                    <Paperclip size={16} />
                  </button>
                  <button className="p-1.5 text-t3 hover:text-t1 transition-colors rounded hover:bg-canvas">
                    <Smile size={16} />
                  </button>
                </div>
              </div>
            </div>
            <Button
              size="md"
              onClick={handleSend}
              disabled={!messageInput.trim() || sending}
              className="flex-shrink-0 px-3"
            >
              {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </Button>
          </div>
          <p className="text-[0.6rem] text-t3 mt-1.5 ml-1">
            Press <kbd className="px-1 py-0.5 bg-canvas border border-divider rounded text-[0.6rem] font-mono">Enter</kbd> to send,{' '}
            <kbd className="px-1 py-0.5 bg-canvas border border-divider rounded text-[0.6rem] font-mono">Shift+Enter</kbd> for new line
            {isLive && <span className="ml-2 text-green-500">• Live</span>}
          </p>
        </div>
      </div>

      {/* ──────── THREAD PANEL ──────── */}
      {threadMessage && (
        <div className="w-80 flex-shrink-0 bg-card border-l border-divider flex flex-col">
          {/* Thread header */}
          <div className="px-4 py-3 border-b border-divider flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-t1">Thread</h3>
              <p className="text-xs text-t3">{threadReplies.length} {threadReplies.length === 1 ? 'reply' : 'replies'}</p>
            </div>
            <button
              onClick={closeThread}
              className="p-1 hover:bg-canvas rounded text-t3 hover:text-t1 transition-colors"
            >
              <span className="text-lg leading-none">&times;</span>
            </button>
          </div>

          {/* Original message */}
          <div className="px-4 py-3 border-b border-divider bg-canvas/50">
            <div className="flex items-start gap-2">
              <div className="w-8 h-8 rounded-lg bg-tempo-600/15 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-tempo-600">{getInitials(getSenderName(threadMessage.sender_id))}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="text-xs font-semibold text-t1">{getSenderName(threadMessage.sender_id)}</span>
                  <span className="text-[0.6rem] text-t3">{formatTime(threadMessage.timestamp)}</span>
                </div>
                <p className="text-xs text-t2 mt-0.5 whitespace-pre-wrap">{threadMessage.content}</p>
              </div>
            </div>
          </div>

          {/* Thread replies */}
          <div className="flex-1 overflow-y-auto px-4 py-2">
            {threadReplies.length === 0 && (
              <p className="text-xs text-t3 text-center py-4">No replies yet. Start the conversation!</p>
            )}
            {threadReplies.map(reply => (
              <div key={reply.id} className="flex items-start gap-2 py-2">
                <div className="w-7 h-7 rounded-lg bg-tempo-600/15 flex items-center justify-center flex-shrink-0">
                  <span className="text-[0.55rem] font-bold text-tempo-600">{getInitials(getSenderName(reply.sender_id))}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs font-semibold text-t1">{getSenderName(reply.sender_id)}</span>
                    <span className="text-[0.6rem] text-t3">{formatTime(reply.timestamp)}</span>
                  </div>
                  <p className="text-xs text-t2 mt-0.5 whitespace-pre-wrap">{reply.content}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Thread input */}
          <div className="px-3 py-2 border-t border-divider">
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Reply..."
                value={threadInput}
                onChange={e => setThreadInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendThreadReply() } }}
                className="flex-1 py-1.5 px-2.5 text-xs bg-surface border border-divider rounded-md text-t1 placeholder:text-t3 focus:outline-none focus:ring-1 focus:ring-tempo-600/30 focus:border-tempo-600"
              />
              <Button size="sm" onClick={sendThreadReply} disabled={!threadInput.trim()}>
                <Send size={12} />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ──────── CREATE CHANNEL MODAL ──────── */}
      <Modal open={showCreateChannel} onClose={() => setShowCreateChannel(false)} title="Create a Channel" size="sm">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-t1 mb-1">Channel name</label>
            <div className="relative">
              <Hash size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-t3" />
              <input
                type="text"
                placeholder="e.g. marketing"
                value={newChannelName}
                onChange={e => setNewChannelName(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                className="w-full pl-8 pr-3 py-2 text-sm bg-surface border border-divider rounded-md text-t1 placeholder:text-t3 focus:outline-none focus:ring-2 focus:ring-tempo-600/20 focus:border-tempo-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-t1 mb-1">Description</label>
            <input
              type="text"
              placeholder="What is this channel about?"
              value={newChannelDesc}
              onChange={e => setNewChannelDesc(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-surface border border-divider rounded-md text-t1 placeholder:text-t3 focus:outline-none focus:ring-2 focus:ring-tempo-600/20 focus:border-tempo-600"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-t1 mb-2">Visibility</label>
            <div className="flex gap-3">
              <button
                onClick={() => setNewChannelType('public')}
                className={cn(
                  'flex-1 flex items-center gap-2 px-3 py-2.5 rounded-lg border text-xs font-medium transition-colors',
                  newChannelType === 'public'
                    ? 'border-tempo-600 bg-tempo-600/5 text-tempo-600'
                    : 'border-divider text-t2 hover:border-tempo-400'
                )}
              >
                <Hash size={14} />
                Public
              </button>
              <button
                onClick={() => setNewChannelType('private')}
                className={cn(
                  'flex-1 flex items-center gap-2 px-3 py-2.5 rounded-lg border text-xs font-medium transition-colors',
                  newChannelType === 'private'
                    ? 'border-tempo-600 bg-tempo-600/5 text-tempo-600'
                    : 'border-divider text-t2 hover:border-tempo-400'
                )}
              >
                <Lock size={14} />
                Private
              </button>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setShowCreateChannel(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleCreateChannel} disabled={!newChannelName.trim()}>
              Create Channel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
