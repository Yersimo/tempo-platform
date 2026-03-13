'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { Header } from '@/components/layout/header'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils/cn'
import { allModuleSlugs, hasDoc, loadAllDocs, type DocPlaceholderEntry } from '@/lib/docs/registry'
import { searchDocs, type SearchResult } from '@/lib/docs/search'
import { DOC_GROUP_LABELS, DOC_GROUP_ORDER, type DocGroup } from '@/lib/docs/types'
import type { ModuleDoc } from '@/lib/docs/types'
import {
  Search, LayoutDashboard, Users, Briefcase, MessageSquare, TrendingUp, Banknote,
  GraduationCap, HeartPulse, UserCheck, UserMinus, UserPlus, Wallet, Clock, Shield,
  ShieldCheck, Receipt, Plane, Globe, Cloud, Laptop, AppWindow, KeyRound, Lock, Store,
  FileText, PieChart, CreditCard, CircleDollarSign, FolderKanban, Compass, Zap,
  BarChart3, FileSignature, Blocks, FlaskConical, Network, Code, Settings, BookOpen,
  ArrowRight, FileQuestion, X,
} from 'lucide-react'

// ─── Icon resolver ──────────────────────────────────────────────────────────
const ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  LayoutDashboard, Users, Briefcase, MessageSquare, TrendingUp, Banknote,
  GraduationCap, HeartPulse, UserCheck, UserMinus, UserPlus, Wallet, Clock, Shield,
  ShieldCheck, Receipt, Plane, Globe, Cloud, Laptop, AppWindow, KeyRound, Lock, Store,
  FileText, PieChart, CreditCard, CircleDollarSign, FolderKanban, Compass, Zap,
  BarChart3, FileSignature, Blocks, FlaskConical, Network, Code, Settings, BookOpen,
}

function resolveIcon(name: string) {
  return ICON_MAP[name] || FileQuestion
}

// ─── Tab filter type ────────────────────────────────────────────────────────
type TabFilter = 'all' | DocGroup

const TABS: { label: string; value: TabFilter }[] = [
  { label: 'All', value: 'all' },
  ...DOC_GROUP_ORDER.map(g => ({ label: DOC_GROUP_LABELS[g], value: g as TabFilter })),
]

// ─── Module card component ──────────────────────────────────────────────────
function ModuleCard({ entry }: { entry: DocPlaceholderEntry }) {
  const Icon = resolveIcon(entry.icon)
  const documented = hasDoc(entry.slug)

  return (
    <Link href={`/help/${entry.slug}`} className="group block">
      <Card className="h-full transition-all duration-200 hover:shadow-md hover:border-tempo-300 group-hover:-translate-y-0.5">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-tempo-50 flex items-center justify-center shrink-0 group-hover:bg-tempo-100 transition-colors">
            <Icon size={18} className="text-tempo-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-t1 truncate">{entry.title}</h3>
              {documented && (
                <Badge variant="success" className="shrink-0">Docs</Badge>
              )}
            </div>
            <p className="text-xs text-t3 mt-0.5">
              {documented ? 'Full documentation available' : 'Documentation coming soon'}
            </p>
          </div>
          <ArrowRight size={14} className="text-t3 opacity-0 group-hover:opacity-100 transition-opacity mt-0.5 shrink-0" />
        </div>
      </Card>
    </Link>
  )
}

// ─── Search result card ─────────────────────────────────────────────────────
function SearchResultCard({ result }: { result: SearchResult }) {
  const Icon = resolveIcon(result.icon)
  const matchLabels: Record<string, string> = {
    title: 'Title match',
    feature: 'Feature',
    workflow: 'Workflow',
    faq: 'FAQ',
    tip: 'Tip',
  }

  return (
    <Link href={`/help/${result.slug}`} className="group block">
      <Card className="transition-all duration-200 hover:shadow-md hover:border-tempo-300 group-hover:-translate-y-0.5">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-tempo-50 flex items-center justify-center shrink-0">
            <Icon size={18} className="text-tempo-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-t1">{result.title}</h3>
              <Badge variant="info" className="shrink-0">{matchLabels[result.matchType]}</Badge>
            </div>
            <p className="text-xs text-t3 mt-0.5 line-clamp-1">{result.matchText}</p>
          </div>
          <ArrowRight size={14} className="text-t3 opacity-0 group-hover:opacity-100 transition-opacity mt-0.5 shrink-0" />
        </div>
      </Card>
    </Link>
  )
}

// ─── Main page ──────────────────────────────────────────────────────────────
export default function HelpCenterPage() {
  const [activeTab, setActiveTab] = useState<TabFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [allDocs, setAllDocs] = useState<ModuleDoc[]>([])
  const [modules, setModules] = useState<DocPlaceholderEntry[]>([])
  const [loading, setLoading] = useState(true)

  // Load initial data
  useEffect(() => {
    setModules(allModuleSlugs)
    loadAllDocs().then(docs => {
      setAllDocs(docs)
      setLoading(false)
    })
  }, [])

  // Search results (only when query is active)
  const searchResults = useMemo(() => {
    if (!searchQuery || searchQuery.length < 2) return null
    return searchDocs(allDocs, searchQuery)
  }, [allDocs, searchQuery])

  // Filtered modules by category tab
  const filteredModules = useMemo(() => {
    if (activeTab === 'all') return modules
    return modules.filter(m => m.group === activeTab)
  }, [modules, activeTab])

  // Group modules by DocGroup for the grid display
  const groupedModules = useMemo(() => {
    const groups: { group: DocGroup; label: string; entries: DocPlaceholderEntry[] }[] = []
    for (const g of DOC_GROUP_ORDER) {
      const entries = filteredModules.filter(m => m.group === g)
      if (entries.length > 0) {
        groups.push({ group: g, label: DOC_GROUP_LABELS[g], entries })
      }
    }
    return groups
  }, [filteredModules])

  const handleClearSearch = useCallback(() => {
    setSearchQuery('')
  }, [])

  const isSearching = searchResults !== null

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <Header
        title="Help Center"
        subtitle="Browse documentation, guides, and tutorials"
      />

      {/* Search bar */}
      <div className="relative mb-6">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-t3" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search documentation, workflows, FAQs..."
          className="w-full pl-10 pr-10 py-2.5 text-sm bg-white border border-divider rounded-[var(--radius-input)] text-t1 placeholder:text-t3 focus:outline-none focus:ring-2 focus:ring-tempo-600/20 focus:border-tempo-600 transition-all"
        />
        {searchQuery && (
          <button
            onClick={handleClearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-t3 hover:text-t1 transition-colors"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Category tabs */}
      {!isSearching && (
        <div className="flex items-center gap-1.5 mb-6 overflow-x-auto pb-1">
          {TABS.map(tab => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={cn(
                'px-3.5 py-1.5 rounded-[var(--radius-pill)] text-xs font-medium transition-colors whitespace-nowrap',
                activeTab === tab.value
                  ? 'bg-tempo-600 text-white'
                  : 'bg-canvas text-t2 hover:text-t1 hover:bg-gray-200 border border-divider'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 9 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-gray-200 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-2/3" />
                  <div className="h-3 bg-gray-100 rounded w-full" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Search results view */}
      {!loading && isSearching && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-t2">
              <span className="font-medium text-t1">{searchResults.length}</span> result{searchResults.length !== 1 ? 's' : ''} for &ldquo;{searchQuery}&rdquo;
            </p>
            <button
              onClick={handleClearSearch}
              className="text-xs text-tempo-600 hover:text-tempo-700 font-medium transition-colors"
            >
              Clear search
            </button>
          </div>
          {searchResults.length === 0 ? (
            <Card className="text-center py-12">
              <FileQuestion size={40} className="mx-auto text-t3 mb-3" />
              <h3 className="text-sm font-semibold text-t1 mb-1">No results found</h3>
              <p className="text-xs text-t3">Try a different search term or browse categories below.</p>
              <button
                onClick={handleClearSearch}
                className="mt-3 text-xs text-tempo-600 hover:text-tempo-700 font-medium"
              >
                Browse all modules
              </button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {searchResults.map(result => (
                <SearchResultCard key={result.slug} result={result} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Category grid view */}
      {!loading && !isSearching && (
        <div className="space-y-8">
          {groupedModules.map(({ group, label, entries }) => (
            <section key={group}>
              {activeTab === 'all' && (
                <div className="flex items-center gap-2 mb-3">
                  <h2 className="text-xs font-semibold text-t2 uppercase tracking-wider">{label}</h2>
                  <div className="flex-1 h-px bg-divider" />
                  <span className="text-[0.65rem] text-t3">{entries.length} module{entries.length !== 1 ? 's' : ''}</span>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {entries.map(entry => (
                  <ModuleCard key={entry.slug} entry={entry} />
                ))}
              </div>
            </section>
          ))}

          {groupedModules.length === 0 && (
            <Card className="text-center py-12">
              <BookOpen size={40} className="mx-auto text-t3 mb-3" />
              <h3 className="text-sm font-semibold text-t1 mb-1">No modules in this category</h3>
              <p className="text-xs text-t3">Select a different category to browse available documentation.</p>
            </Card>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="mt-12 pt-6 border-t border-divider">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <p className="text-xs text-t3">
              <span className="font-medium text-t2">{allModuleSlugs.length}</span> modules &middot;{' '}
              <span className="font-medium text-t2">{allDocs.length}</span> fully documented
            </p>
          </div>
          <p className="text-[0.65rem] text-t3">
            Documentation is continuously updated. Last revision March 2026.
          </p>
        </div>
      </div>
    </div>
  )
}
