'use client'

import { useState, useEffect, useRef, useCallback, Fragment } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils/cn'
import { useSearch, type SearchResult } from '@/lib/use-search'
import {
  Search, X, Loader2, User, Target, FolderKanban, BookOpen,
  Briefcase, Compass, Zap, LayoutDashboard, Users, TrendingUp,
  Banknote, GraduationCap, HeartPulse, UserCheck, BarChart3,
  Clock, ArrowRight, Receipt, CalendarCheck, Settings, Shield,
  FileText, Hash,
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
}

// Type labels for grouping
const typeLabels: Record<string, string> = {
  employee: 'employees',
  goal: 'goals',
  project: 'projects',
  course: 'courses',
  job: 'jobs',
  objective: 'objectives',
  workflow: 'workflows',
  policy: 'policies',
  leave: 'leaveRequests',
  expense: 'expenses',
}

interface QuickAction {
  label: string
  href: string
  icon: React.ReactNode
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

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const { query, setQuery, results, isLoading, total } = useSearch()
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const t = useTranslations('search')

  const quickActions: QuickAction[] = [
    { label: t('goToDashboard'), href: '/dashboard', icon: <LayoutDashboard size={16} /> },
    { label: t('goToPeople'), href: '/people', icon: <Users size={16} /> },
    { label: t('goToPerformance'), href: '/performance', icon: <TrendingUp size={16} /> },
    { label: t('goToCompensation'), href: '/compensation', icon: <Banknote size={16} /> },
    { label: t('goToLearning'), href: '/learning', icon: <GraduationCap size={16} /> },
    { label: t('goToEngagement'), href: '/engagement', icon: <HeartPulse size={16} /> },
    { label: t('goToMentoring'), href: '/mentoring', icon: <UserCheck size={16} /> },
    { label: t('goToAnalytics'), href: '/analytics', icon: <BarChart3 size={16} /> },
  ]

  // Slash commands — Oracle Fusion "/" prefix navigation
  const slashCommands: SlashCommand[] = [
    { command: '/people', labelKey: 'slashPeople', href: '/people', icon: <Users size={16} /> },
    { command: '/payroll', labelKey: 'slashPayroll', href: '/payroll', icon: <Banknote size={16} /> },
    { command: '/performance', labelKey: 'slashPerformance', href: '/performance', icon: <TrendingUp size={16} /> },
    { command: '/recruiting', labelKey: 'slashRecruiting', href: '/recruiting', icon: <Briefcase size={16} /> },
    { command: '/learning', labelKey: 'slashLearning', href: '/learning', icon: <GraduationCap size={16} /> },
    { command: '/time', labelKey: 'slashTime', href: '/time-attendance', icon: <CalendarCheck size={16} /> },
    { command: '/expense', labelKey: 'slashExpense', href: '/expense', icon: <Receipt size={16} /> },
    { command: '/benefits', labelKey: 'slashBenefits', href: '/benefits', icon: <Shield size={16} /> },
    { command: '/settings', labelKey: 'slashSettings', href: '/settings', icon: <Settings size={16} /> },
    { command: '/workflows', labelKey: 'slashWorkflows', href: '/workflow-studio', icon: <Zap size={16} /> },
    { command: '/analytics', labelKey: 'slashAnalytics', href: '/analytics', icon: <BarChart3 size={16} /> },
    { command: '/projects', labelKey: 'slashProjects', href: '/projects', icon: <FolderKanban size={16} /> },
  ]

  const isSlashMode = query.startsWith('/')

  // Filter slash commands based on typed prefix
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

  // Flatten for keyboard navigation: build ordered list of all navigable items
  const navigableItems: Array<
    { kind: 'result'; result: SearchResult } |
    { kind: 'quick'; action: QuickAction } |
    { kind: 'slash'; command: SlashCommand }
  > = []

  if (isSlashMode) {
    for (const cmd of filteredSlashCommands) {
      navigableItems.push({ kind: 'slash', command: cmd })
    }
  } else if (query.length >= 2 && results.length > 0) {
    const typeOrder = ['employee', 'goal', 'project', 'course', 'job', 'objective', 'workflow', 'policy', 'leave', 'expense']
    for (const typeName of typeOrder) {
      const group = groupedResults[typeName]
      if (group) {
        for (const r of group) {
          navigableItems.push({ kind: 'result', result: r })
        }
      }
    }
  } else if (query.length < 2 && !isSlashMode) {
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
        if (isOpen) {
          close()
        } else {
          open()
        }
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

  // Keyboard navigation within the palette
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
        if (item.kind === 'result') {
          navigateTo(item.result.link, query)
        } else if (item.kind === 'quick') {
          navigateTo(item.action.href)
        } else if (item.kind === 'slash') {
          navigateTo(item.command.href)
        }
      }
    }
  }, [navigableItems, selectedIndex, navigateTo, query])

  // Scroll selected item into view
  useEffect(() => {
    if (!listRef.current) return
    const selectedEl = listRef.current.querySelector('[data-selected="true"]')
    if (selectedEl) {
      selectedEl.scrollIntoView({ block: 'nearest' })
    }
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
      {/* Trigger button (hidden when open, keeps layout) */}
      <button
        onClick={open}
        className={cn(
          'flex items-center gap-2 w-full px-3 py-2 rounded-lg text-[0.8rem]',
          'text-white/40 hover:text-white/60 hover:bg-white/[0.06]',
          'border border-white/[0.08] transition-colors cursor-pointer opacity-0 pointer-events-none'
        )}
        tabIndex={-1}
      >
        <Search size={14} />
        <span>{t('placeholder')}</span>
      </button>

      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
        onClick={close}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[101] flex items-start justify-center pt-[12vh] px-4">
        <div
          className={cn(
            'w-full max-w-[560px] bg-white rounded-xl overflow-hidden',
            'border border-[#e5e5e5] ring-1 ring-black/[0.05]',
            'animate-in fade-in slide-in-from-top-2 duration-150'
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Search input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-[#f0f0f0]">
            {isSlashMode ? (
              <Hash size={18} className="text-[#ea580c] shrink-0" />
            ) : (
              <Search size={18} className="text-[#999] shrink-0" />
            )}
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('placeholder')}
              className={cn(
                'flex-1 bg-transparent text-[0.9rem] text-[#0f1117] placeholder-[#999]',
                'outline-none border-none font-normal'
              )}
              autoComplete="off"
              spellCheck={false}
            />
            {isLoading && !isSlashMode && <Loader2 size={16} className="text-[#ea580c] animate-spin shrink-0" />}
            {query && !isLoading && (
              <button
                onClick={() => setQuery('')}
                className="text-[#999] hover:text-[#666] transition-colors"
              >
                <X size={16} />
              </button>
            )}
            <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded bg-[#f5f5f7] text-[0.6rem] text-[#999] font-mono border border-[#e5e5e5]">
              ESC
            </kbd>
          </div>

          {/* Results area */}
          <div ref={listRef} className="max-h-[60vh] overflow-y-auto">

            {/* Slash command results */}
            {isSlashMode && (
              <div className="py-2">
                <div className="px-4 pt-2 pb-1">
                  <span className="text-[0.6rem] font-semibold uppercase tracking-[0.08em] text-[#999]">
                    {t('commands')}
                  </span>
                </div>
                {filteredSlashCommands.length > 0 ? (
                  filteredSlashCommands.map((cmd, i) => {
                    flatIndex++
                    const idx = flatIndex
                    const isSelected = idx === selectedIndex
                    return (
                      <button
                        key={cmd.command}
                        data-selected={isSelected}
                        onClick={() => navigateTo(cmd.href)}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        className={cn(
                          'flex items-center gap-3 w-full px-4 py-2.5 text-left transition-colors cursor-pointer',
                          isSelected ? 'bg-[#f5f5f7]' : 'hover:bg-[#fafafa]'
                        )}
                      >
                        <div className={cn(
                          'flex items-center justify-center w-8 h-8 rounded-lg shrink-0',
                          isSelected ? 'bg-[#ea580c]/10 text-[#ea580c]' : 'bg-[#f0f0f0] text-[#666]'
                        )}>
                          {cmd.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[0.82rem] font-medium text-[#0f1117]">
                            <span className="text-[#ea580c] font-mono">{cmd.command}</span>
                          </div>
                          <div className="text-[0.7rem] text-[#999]">
                            {t(cmd.labelKey)}
                          </div>
                        </div>
                        {isSelected && (
                          <ArrowRight size={14} className="text-[#999] shrink-0" />
                        )}
                      </button>
                    )
                  })
                ) : (
                  <div className="py-8 text-center">
                    <Hash size={28} className="mx-auto text-[#ddd] mb-2" />
                    <div className="text-[0.8rem] text-[#999]">No matching commands</div>
                  </div>
                )}
              </div>
            )}

            {/* Search results */}
            {!isSlashMode && query.length >= 2 && results.length > 0 && (
              <div className="py-2">
                {total > 0 && (
                  <div className="px-4 py-1.5 text-[0.65rem] text-[#999]">
                    {t('resultsCount', { count: total })}
                  </div>
                )}
                {(['employee', 'goal', 'project', 'course', 'job', 'objective', 'workflow', 'policy', 'leave', 'expense'] as const).map((typeName) => {
                  const group = groupedResults[typeName]
                  if (!group || group.length === 0) return null
                  return (
                    <Fragment key={typeName}>
                      <div className="px-4 pt-3 pb-1">
                        <span className="text-[0.6rem] font-semibold uppercase tracking-[0.08em] text-[#999]">
                          {t(typeLabels[typeName])}
                        </span>
                      </div>
                      {group.map((result) => {
                        flatIndex++
                        const idx = flatIndex
                        const isSelected = idx === selectedIndex
                        const IconComponent = iconMap[result.icon]
                        return (
                          <button
                            key={result.id}
                            data-selected={isSelected}
                            onClick={() => navigateTo(result.link, query)}
                            onMouseEnter={() => setSelectedIndex(idx)}
                            className={cn(
                              'flex items-center gap-3 w-full px-4 py-2.5 text-left transition-colors cursor-pointer',
                              isSelected ? 'bg-[#f5f5f7]' : 'hover:bg-[#fafafa]'
                            )}
                          >
                            <div className={cn(
                              'flex items-center justify-center w-8 h-8 rounded-lg shrink-0',
                              isSelected ? 'bg-[#ea580c]/10 text-[#ea580c]' : 'bg-[#f0f0f0] text-[#666]'
                            )}>
                              {IconComponent ? <IconComponent size={16} /> : <Search size={16} />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-[0.82rem] font-medium text-[#0f1117] truncate">
                                {result.title}
                              </div>
                              <div className="text-[0.7rem] text-[#999] truncate">
                                {result.subtitle}
                              </div>
                            </div>
                            {isSelected && (
                              <ArrowRight size={14} className="text-[#999] shrink-0" />
                            )}
                          </button>
                        )
                      })}
                    </Fragment>
                  )
                })}
              </div>
            )}

            {/* No results */}
            {!isSlashMode && query.length >= 2 && !isLoading && results.length === 0 && (
              <div className="py-12 text-center">
                <Search size={32} className="mx-auto text-[#ddd] mb-3" />
                <div className="text-[0.85rem] font-medium text-[#666]">{t('noResults')}</div>
                <div className="text-[0.75rem] text-[#999] mt-1">{t('tryDifferentQuery')}</div>
              </div>
            )}

            {/* Empty state: recent searches + quick actions */}
            {!isSlashMode && query.length < 2 && (
              <div className="py-2">
                {/* Recent searches */}
                {recentSearches.length > 0 && (
                  <>
                    <div className="flex items-center justify-between px-4 pt-2 pb-1">
                      <span className="text-[0.6rem] font-semibold uppercase tracking-[0.08em] text-[#999]">
                        {t('recentSearches')}
                      </span>
                      <button
                        onClick={() => {
                          clearRecentSearches()
                          setRecentSearches([])
                        }}
                        className="text-[0.6rem] text-[#999] hover:text-[#ea580c] transition-colors"
                      >
                        {t('clearRecent')}
                      </button>
                    </div>
                    {recentSearches.map((term) => (
                      <button
                        key={term}
                        onClick={() => setQuery(term)}
                        className="flex items-center gap-3 w-full px-4 py-2 text-left hover:bg-[#fafafa] transition-colors cursor-pointer"
                      >
                        <Clock size={14} className="text-[#ccc] shrink-0" />
                        <span className="text-[0.8rem] text-[#666]">{term}</span>
                      </button>
                    ))}
                    <div className="h-px bg-[#f0f0f0] mx-4 my-1" />
                  </>
                )}

                {/* Quick actions */}
                <div className="px-4 pt-2 pb-1">
                  <span className="text-[0.6rem] font-semibold uppercase tracking-[0.08em] text-[#999]">
                    {t('quickActions')}
                  </span>
                </div>
                {quickActions.map((action, i) => {
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
                        'flex items-center gap-3 w-full px-4 py-2.5 text-left transition-colors cursor-pointer',
                        isSelected ? 'bg-[#f5f5f7]' : 'hover:bg-[#fafafa]'
                      )}
                    >
                      <div className={cn(
                        'flex items-center justify-center w-7 h-7 rounded-md shrink-0',
                        isSelected ? 'text-[#ea580c]' : 'text-[#999]'
                      )}>
                        {action.icon}
                      </div>
                      <span className={cn(
                        'text-[0.8rem]',
                        isSelected ? 'text-[#0f1117] font-medium' : 'text-[#666]'
                      )}>
                        {action.label}
                      </span>
                      {isSelected && (
                        <ArrowRight size={14} className="ml-auto text-[#999] shrink-0" />
                      )}
                    </button>
                  )
                })}
              </div>
            )}

            {/* Type to search hint */}
            {!isSlashMode && query.length > 0 && query.length < 2 && (
              <div className="px-4 py-3 text-center text-[0.7rem] text-[#999]">
                {t('typeToSearch')}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-2.5 border-t border-[#f0f0f0] bg-[#fafafa]">
            <div className="flex items-center gap-3 text-[0.6rem] text-[#999]">
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
            <span className="text-[0.6rem] text-[#bbb]">
              {t('slashHint')}
            </span>
          </div>
        </div>
      </div>
    </>
  )
}
