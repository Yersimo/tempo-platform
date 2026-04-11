'use client'

import { useState, useEffect, useRef, useCallback, Fragment } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils/cn'
import { useSearch, type SearchResult } from '@/lib/use-search'
import {
  Search, X, Loader2, User, Target, FolderKanban, BookOpen,
  Briefcase, Compass, Zap, LayoutDashboard, Users, TrendingUp,
  Banknote, GraduationCap, HeartPulse, UserCheck, BarChart3,
  Clock, ArrowRight, Receipt, CalendarCheck, Settings, Shield,
  FileText, Hash, Building2, ClipboardCheck, CheckSquare,
  UserPlus, MessageCircle, PieChart, Building, Monitor,
} from 'lucide-react'

const RECENT_SEARCHES_KEY = 'tempo_recent_searches'
const MAX_RECENT = 5

// Map icon names to Lucide components
const iconMap: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  User,
  Target,
  FolderKanban,
  BookOpen,
  Briefcase,
  Compass,
  Zap,
  Shield,
  CalendarCheck,
  Receipt,
  Building2,
  ClipboardCheck,
  CheckSquare,
  UserPlus,
  Banknote,
  MessageCircle,
  UserCheck,
  FileText,
  PieChart,
  Building,
  Monitor,
  Search,
}

// Display type labels — maps result.type to translation key
const typeLabels: Record<string, string> = {
  employee: 'employee',
  department: 'department',
  goal: 'goal',
  review: 'review',
  project: 'project',
  task: 'task',
  course: 'course',
  job: 'job',
  candidate: 'candidate',
  payroll: 'payroll',
  leave: 'leave',
  benefit: 'benefit',
  expense: 'expense',
  survey: 'survey',
  objective: 'objective',
  workflow: 'workflow',
  mentoring: 'mentoring',
  invoice: 'invoice',
  budget: 'budget',
  vendor: 'vendor',
  it_request: 'it_request',
}

// Order for displaying result groups
const TYPE_ORDER = [
  'employee', 'department', 'goal', 'review', 'project', 'task',
  'course', 'job', 'candidate', 'payroll', 'leave', 'benefit',
  'expense', 'survey', 'objective', 'workflow', 'mentoring',
  'invoice', 'budget', 'vendor', 'it_request',
]

interface QuickAction {
  label: string
  href: string
  icon: React.ReactNode
  keywords?: string
}

interface SlashCommand {
  command: string
  labelKey: string
  href: string
  icon: React.ReactNode
}

function getRecentSearches(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function saveRecentSearch(q: string) {
  if (typeof window === 'undefined') return
  try {
    const existing = getRecentSearches()
    const filtered = existing.filter((s) => s !== q)
    const updated = [q, ...filtered].slice(0, MAX_RECENT)
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated))
  } catch { /* ignore */ }
}

function clearRecentSearches() {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(RECENT_SEARCHES_KEY)
  } catch { /* ignore */ }
}

// Suggested searches for empty state
const SUGGESTED_SEARCHES = [
  'Marketing',
  'Engineering',
  'Leave',
  'Payroll',
  'Senior',
  'Training',
]

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const { query, setQuery, results, isLoading, total } = useSearch()
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const t = useTranslations('search')

  // Navigation quick actions — organized by category
  const quickActions: QuickAction[] = [
    { label: t('goToDashboard'), href: '/dashboard', icon: <LayoutDashboard size={15} /> },
    { label: t('goToPeople'), href: '/people', icon: <Users size={15} /> },
    { label: t('goToPerformance'), href: '/performance', icon: <TrendingUp size={15} /> },
    { label: t('goToRecruiting'), href: '/recruiting', icon: <Briefcase size={15} /> },
    { label: t('goToPayroll'), href: '/payroll', icon: <Banknote size={15} /> },
    { label: t('goToTime'), href: '/time-attendance', icon: <CalendarCheck size={15} /> },
    { label: t('goToBenefits'), href: '/benefits', icon: <Shield size={15} /> },
    { label: t('goToExpense'), href: '/expense', icon: <Receipt size={15} /> },
    { label: t('goToLearning'), href: '/learning', icon: <GraduationCap size={15} /> },
    { label: t('goToEngagement'), href: '/engagement', icon: <HeartPulse size={15} /> },
    { label: t('goToMentoring'), href: '/mentoring', icon: <UserCheck size={15} /> },
    { label: t('goToProjects'), href: '/projects', icon: <FolderKanban size={15} /> },
    { label: t('goToAnalytics'), href: '/analytics', icon: <BarChart3 size={15} /> },
    { label: t('goToCompensation'), href: '/compensation', icon: <Banknote size={15} /> },
    { label: t('goToFinance'), href: '/finance/invoices', icon: <FileText size={15} /> },
    { label: t('goToWorkflows'), href: '/workflow-studio', icon: <Zap size={15} /> },
    { label: t('goToStrategy'), href: '/strategy', icon: <Compass size={15} /> },
    { label: t('goToSettings'), href: '/settings', icon: <Settings size={15} /> },
  ]

  // Slash commands
  const slashCommands: SlashCommand[] = [
    { command: '/people', labelKey: 'slashPeople', href: '/people', icon: <Users size={15} /> },
    { command: '/payroll', labelKey: 'slashPayroll', href: '/payroll', icon: <Banknote size={15} /> },
    { command: '/performance', labelKey: 'slashPerformance', href: '/performance', icon: <TrendingUp size={15} /> },
    { command: '/recruiting', labelKey: 'slashRecruiting', href: '/recruiting', icon: <Briefcase size={15} /> },
    { command: '/learning', labelKey: 'slashLearning', href: '/learning', icon: <GraduationCap size={15} /> },
    { command: '/time', labelKey: 'slashTime', href: '/time-attendance', icon: <CalendarCheck size={15} /> },
    { command: '/expense', labelKey: 'slashExpense', href: '/expense', icon: <Receipt size={15} /> },
    { command: '/benefits', labelKey: 'slashBenefits', href: '/benefits', icon: <Shield size={15} /> },
    { command: '/settings', labelKey: 'slashSettings', href: '/settings', icon: <Settings size={15} /> },
    { command: '/workflows', labelKey: 'slashWorkflows', href: '/workflow-studio', icon: <Zap size={15} /> },
    { command: '/analytics', labelKey: 'slashAnalytics', href: '/analytics', icon: <BarChart3 size={15} /> },
    { command: '/projects', labelKey: 'slashProjects', href: '/projects', icon: <FolderKanban size={15} /> },
  ]

  const isSlashMode = query.startsWith('/')

  const filteredSlashCommands = isSlashMode
    ? slashCommands.filter(cmd => cmd.command.startsWith(query.toLowerCase()))
    : []

  // Group results by type
  const groupedResults = results.reduce<Record<string, SearchResult[]>>((acc, result) => {
    const group = result.type
    if (!acc[group]) acc[group] = []
    acc[group].push(result)
    return acc
  }, {})

  // Count how many groups have results
  const groupCount = Object.keys(groupedResults).length

  // Flatten for keyboard navigation
  const navigableItems: Array<
    { kind: 'result'; result: SearchResult } |
    { kind: 'quick'; action: QuickAction } |
    { kind: 'slash'; command: SlashCommand } |
    { kind: 'suggested'; term: string }
  > = []

  if (isSlashMode) {
    for (const cmd of filteredSlashCommands) {
      navigableItems.push({ kind: 'slash', command: cmd })
    }
  } else if (query.length >= 2 && results.length > 0) {
    for (const typeName of TYPE_ORDER) {
      const group = groupedResults[typeName]
      if (group) {
        for (const r of group) {
          navigableItems.push({ kind: 'result', result: r })
        }
      }
    }
  } else if (query.length < 2 && !isSlashMode) {
    // Recent searches first
    for (const term of recentSearches) {
      navigableItems.push({ kind: 'suggested', term })
    }
    // Then quick nav actions
    for (const action of quickActions) {
      navigableItems.push({ kind: 'quick', action })
    }
  }

  const open = useCallback(() => {
    setIsOpen(true)
    setQuery('')
    setSelectedIndex(0)
    setRecentSearches(getRecentSearches())
  }, [setQuery])

  const close = useCallback(() => {
    setIsOpen(false)
    setQuery('')
    setSelectedIndex(0)
  }, [setQuery])

  const navigateTo = useCallback((href: string, searchTerm?: string) => {
    if (searchTerm) saveRecentSearch(searchTerm)
    close()
    router.push(href)
  }, [close, router])

  // Cmd+K / Ctrl+K shortcut
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        if (isOpen) close()
        else open()
      }
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault()
        close()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, open, close])

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [isOpen])

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(0)
  }, [results, query])

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => Math.min(prev + 1, navigableItems.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => Math.max(prev - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const item = navigableItems[selectedIndex]
      if (item) {
        if (item.kind === 'result') navigateTo(item.result.link, query)
        else if (item.kind === 'quick') navigateTo(item.action.href)
        else if (item.kind === 'slash') navigateTo(item.command.href)
        else if (item.kind === 'suggested') setQuery(item.term)
      }
    }
  }, [navigableItems, selectedIndex, navigateTo, query, setQuery])

  // Scroll selected item into view
  useEffect(() => {
    if (!listRef.current) return
    const selectedEl = listRef.current.querySelector('[data-selected="true"]')
    if (selectedEl) selectedEl.scrollIntoView({ block: 'nearest' })
  }, [selectedIndex])

  if (!isOpen) {
    return (
      <button
        onClick={open}
        className={cn(
          'flex items-center gap-2 w-full px-3 py-2 rounded-lg text-[0.8rem]',
          'text-white/40 hover:text-white/60 hover:bg-white/[0.06]',
          'border border-white/[0.08] transition-colors cursor-pointer'
        )}
      >
        <Search size={14} className="shrink-0" />
        <span className="flex-1 text-left truncate">{t('placeholder')}</span>
        <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-white/[0.08] text-[0.6rem] text-white/30 font-mono">
          <span className="text-[0.55rem]">&#8984;</span>K
        </kbd>
      </button>
    )
  }

  let flatIndex = -1

  return (
    <>
      {/* Placeholder to keep layout */}
      <button
        onClick={open}
        className={cn(
          'flex items-center gap-2 w-full px-3 py-2 rounded-lg text-[0.8rem]',
          'text-white/40 opacity-0 pointer-events-none'
        )}
        tabIndex={-1}
      >
        <Search size={14} />
        <span>{t('placeholder')}</span>
      </button>

      {/* Portal to escape sidebar stacking context */}
      {createPortal(
        <div className="command-palette-portal">
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
            onClick={close}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-[101] flex items-start justify-center pt-[10vh] px-4">
            <div
              className={cn(
            'w-full max-w-[600px] bg-white rounded-2xl overflow-hidden',
            'border border-[#e5e5e5] shadow-2xl shadow-black/20',
            'animate-in fade-in slide-in-from-top-2 duration-150'
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Search input */}
          <div className="flex items-center gap-3 px-5 py-3.5 border-b border-[#f0f0f0]">
            {isSlashMode ? (
              <Hash size={18} className="text-[#004D40] shrink-0" />
            ) : isLoading ? (
              <Loader2 size={18} className="text-[#004D40] animate-spin shrink-0" />
            ) : (
              <Search size={18} className="text-[#bbb] shrink-0" />
            )}
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('placeholder')}
              className={cn(
                'flex-1 bg-transparent text-[0.9rem] text-[#0f1117] placeholder-[#bbb]',
                'outline-none border-none font-normal'
              )}
              autoComplete="off"
              spellCheck={false}
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="text-[#ccc] hover:text-[#999] transition-colors p-1 rounded-md hover:bg-[#f5f5f7]"
              >
                <X size={15} />
              </button>
            )}
            <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded-md bg-[#f5f5f7] text-[0.6rem] text-[#bbb] font-mono border border-[#e8e8e8]">
              ESC
            </kbd>
          </div>

          {/* Results area */}
          <div ref={listRef} className="max-h-[56vh] overflow-y-auto overscroll-contain">

            {/* ── Slash command results ── */}
            {isSlashMode && (
              <div className="py-1.5">
                <SectionHeader label={t('commands')} />
                {filteredSlashCommands.length > 0 ? (
                  filteredSlashCommands.map((cmd) => {
                    flatIndex++
                    const idx = flatIndex
                    return (
                      <ResultRow
                        key={cmd.command}
                        isSelected={idx === selectedIndex}
                        onSelect={() => navigateTo(cmd.href)}
                        onHover={() => setSelectedIndex(idx)}
                        icon={cmd.icon}
                        title={<span className="font-mono text-[#004D40]">{cmd.command}</span>}
                        subtitle={t(cmd.labelKey)}
                      />
                    )
                  })
                ) : (
                  <EmptyState icon={<Hash size={24} />} text="No matching commands" />
                )}
              </div>
            )}

            {/* ── Search results ── */}
            {!isSlashMode && query.length >= 2 && results.length > 0 && (
              <div className="py-1.5">
                {/* Result count badge */}
                <div className="px-5 py-1.5 flex items-center gap-2">
                  <span className="text-[0.65rem] text-[#999] font-medium">
                    {t('resultsCount', { count: total })}
                  </span>
                  {groupCount > 1 && (
                    <span className="text-[0.6rem] text-[#ccc]">
                      across {groupCount} categories
                    </span>
                  )}
                </div>

                {TYPE_ORDER.map((typeName) => {
                  const group = groupedResults[typeName]
                  if (!group || group.length === 0) return null
                  return (
                    <Fragment key={typeName}>
                      <SectionHeader
                        label={t(typeLabels[typeName] || typeName)}
                        count={group.length}
                      />
                      {group.map((result) => {
                        flatIndex++
                        const idx = flatIndex
                        const IconComponent = iconMap[result.icon]
                        return (
                          <ResultRow
                            key={result.id}
                            isSelected={idx === selectedIndex}
                            onSelect={() => navigateTo(result.link, query)}
                            onHover={() => setSelectedIndex(idx)}
                            icon={IconComponent ? <IconComponent size={15} /> : <Search size={15} />}
                            title={highlightMatch(result.title, query)}
                            subtitle={result.subtitle}
                          />
                        )
                      })}
                    </Fragment>
                  )
                })}
              </div>
            )}

            {/* ── No results ── */}
            {!isSlashMode && query.length >= 2 && !isLoading && results.length === 0 && (
              <div className="py-10 text-center">
                <div className="w-10 h-10 rounded-full bg-[#f5f5f7] flex items-center justify-center mx-auto mb-3">
                  <Search size={18} className="text-[#ccc]" />
                </div>
                <div className="text-[0.85rem] font-medium text-[#666]">{t('noResults')}</div>
                <div className="text-[0.75rem] text-[#bbb] mt-1">{t('tryDifferentQuery')}</div>
                {/* Suggested searches */}
                <div className="flex flex-wrap gap-1.5 justify-center mt-4 px-8">
                  {SUGGESTED_SEARCHES.map((term) => (
                    <button
                      key={term}
                      onClick={() => setQuery(term)}
                      className="px-2.5 py-1 rounded-full bg-[#f5f5f7] hover:bg-[#ebebed] text-[0.7rem] text-[#666] transition-colors cursor-pointer"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── Empty state: recent + suggestions + nav ── */}
            {!isSlashMode && query.length < 2 && (
              <div className="py-1.5">
                {/* Recent searches */}
                {recentSearches.length > 0 && (
                  <>
                    <div className="flex items-center justify-between px-5 pt-2 pb-1">
                      <span className="text-[0.6rem] font-semibold uppercase tracking-[0.08em] text-[#bbb]">
                        {t('recentSearches')}
                      </span>
                      <button
                        onClick={() => {
                          clearRecentSearches()
                          setRecentSearches([])
                        }}
                        className="text-[0.6rem] text-[#ccc] hover:text-[#004D40] transition-colors"
                      >
                        {t('clearRecent')}
                      </button>
                    </div>
                    {recentSearches.map((term) => {
                      flatIndex++
                      const idx = flatIndex
                      return (
                        <ResultRow
                          key={`recent-${term}`}
                          isSelected={idx === selectedIndex}
                          onSelect={() => setQuery(term)}
                          onHover={() => setSelectedIndex(idx)}
                          icon={<Clock size={14} className="text-[#ccc]" />}
                          title={term}
                          compact
                        />
                      )
                    })}
                    <div className="h-px bg-[#f0f0f0] mx-5 my-1" />
                  </>
                )}

                {/* Suggested searches as chips */}
                <div className="px-5 pt-3 pb-2">
                  <span className="text-[0.6rem] font-semibold uppercase tracking-[0.08em] text-[#bbb]">
                    {t('suggestedSearches')}
                  </span>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {SUGGESTED_SEARCHES.map((term) => (
                      <button
                        key={term}
                        onClick={() => setQuery(term)}
                        className="px-2.5 py-1 rounded-full bg-[#f5f5f7] hover:bg-[#004D40]/10 hover:text-[#004D40] text-[0.7rem] text-[#888] transition-colors cursor-pointer"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="h-px bg-[#f0f0f0] mx-5 my-1" />

                {/* Navigation grid */}
                <SectionHeader label={t('navigate')} />
                <div className="grid grid-cols-2 gap-0.5 px-2 pb-1">
                  {quickActions.map((action) => {
                    flatIndex++
                    const idx = flatIndex
                    const isSelected = idx === selectedIndex
                    return (
                      <button
                        key={action.href}
                        data-selected={isSelected}
                        onClick={() => navigateTo(action.href)}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        className={cn(
                          'flex items-center gap-2.5 px-3 py-2 text-left transition-colors cursor-pointer rounded-lg',
                          isSelected ? 'bg-[#f5f5f7]' : 'hover:bg-[#fafafa]'
                        )}
                      >
                        <div className={cn(
                          'flex items-center justify-center w-6 h-6 rounded-md shrink-0 transition-colors',
                          isSelected ? 'text-[#004D40]' : 'text-[#999]'
                        )}>
                          {action.icon}
                        </div>
                        <span className={cn(
                          'text-[0.78rem] truncate transition-colors',
                          isSelected ? 'text-[#0f1117] font-medium' : 'text-[#666]'
                        )}>
                          {action.label}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Type to search hint */}
            {!isSlashMode && query.length > 0 && query.length < 2 && (
              <div className="px-5 py-3 text-center text-[0.7rem] text-[#bbb]">
                {t('typeToSearch')}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-5 py-2.5 border-t border-[#f0f0f0] bg-[#fafafa]">
            <div className="flex items-center gap-3 text-[0.6rem] text-[#bbb]">
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 rounded bg-white border border-[#e5e5e5] font-mono text-[0.55rem]">&uarr;</kbd>
                <kbd className="px-1 py-0.5 rounded bg-white border border-[#e5e5e5] font-mono text-[0.55rem]">&darr;</kbd>
                {t('toNavigate')}
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-white border border-[#e5e5e5] font-mono text-[0.55rem]">&#9166;</kbd>
                {t('toSelect')}
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 rounded bg-white border border-[#e5e5e5] font-mono text-[0.55rem]">esc</kbd>
                {t('toClose')}
              </span>
            </div>
            <span className="text-[0.6rem] text-[#ccc]">
              {t('slashHint')}
            </span>
          </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}

// ── Shared sub-components ───────────────────────────────────────────────────

function SectionHeader({ label, count }: { label: string; count?: number }) {
  return (
    <div className="px-5 pt-2.5 pb-1 flex items-center gap-2">
      <span className="text-[0.6rem] font-semibold uppercase tracking-[0.08em] text-[#bbb]">
        {label}
      </span>
      {count != null && count > 0 && (
        <span className="text-[0.55rem] font-medium text-[#ccc] bg-[#f5f5f7] px-1.5 py-0.5 rounded-full">
          {count}
        </span>
      )}
    </div>
  )
}

function ResultRow({
  isSelected,
  onSelect,
  onHover,
  icon,
  title,
  subtitle,
  compact,
}: {
  isSelected: boolean
  onSelect: () => void
  onHover: () => void
  icon: React.ReactNode
  title: React.ReactNode
  subtitle?: string
  compact?: boolean
}) {
  return (
    <button
      data-selected={isSelected}
      onClick={onSelect}
      onMouseEnter={onHover}
      className={cn(
        'flex items-center gap-3 w-full px-5 text-left transition-colors cursor-pointer',
        compact ? 'py-2' : 'py-2.5',
        isSelected ? 'bg-[#f5f5f7]' : 'hover:bg-[#fafafa]'
      )}
    >
      <div className={cn(
        'flex items-center justify-center shrink-0 rounded-lg transition-colors',
        compact ? 'w-6 h-6' : 'w-8 h-8',
        isSelected ? 'bg-[#004D40]/10 text-[#004D40]' : 'bg-[#f5f5f7] text-[#999]'
      )}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className={cn(
          'text-[0.82rem] truncate',
          isSelected ? 'text-[#0f1117] font-medium' : 'text-[#333]'
        )}>
          {title}
        </div>
        {subtitle && (
          <div className="text-[0.68rem] text-[#999] truncate">{subtitle}</div>
        )}
      </div>
      {isSelected && (
        <ArrowRight size={13} className="text-[#ccc] shrink-0" />
      )}
    </button>
  )
}

function EmptyState({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="py-8 text-center">
      <div className="w-10 h-10 rounded-full bg-[#f5f5f7] flex items-center justify-center mx-auto mb-2 text-[#ccc]">
        {icon}
      </div>
      <div className="text-[0.8rem] text-[#999]">{text}</div>
    </div>
  )
}

/** Highlight matching substring in a title */
function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query || query.length < 2) return text
  const lowerText = text.toLowerCase()
  const lowerQuery = query.toLowerCase()
  const idx = lowerText.indexOf(lowerQuery)
  if (idx === -1) return text
  return (
    <>
      {text.slice(0, idx)}
      <span className="text-[#004D40] font-semibold">{text.slice(idx, idx + query.length)}</span>
      {text.slice(idx + query.length)}
    </>
  )
}
