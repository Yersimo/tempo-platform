'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { usePathname } from 'next/navigation'
import {
  X, ChevronRight, ChevronDown, ChevronLeft,
  BookOpen, Lightbulb, ListChecks, MessageSquareText,
  ThumbsUp, ThumbsDown, Clock,
} from 'lucide-react'
import { useHelp } from '@/lib/help-context'
import { resolveModuleFromPath, getHelpEntry, type HelpEntry } from '@/lib/help-registry'
import { loadDoc } from '@/lib/docs/registry'
import { loadAllDocs } from '@/lib/docs/registry'
import type { ModuleDoc, DocWorkflow } from '@/lib/docs/types'
import { HelpSearch } from './help-search'
import { cn } from '@/lib/utils/cn'

type PanelView = 'overview' | 'workflow' | 'workflows-list' | 'tips' | 'faqs'

export function HelpPanel() {
  const { isHelpOpen, closeHelp, currentModule, setCurrentModule } = useHelp()
  const pathname = usePathname()

  const [helpEntry, setHelpEntry] = useState<HelpEntry | null>(null)
  const [moduleDoc, setModuleDoc] = useState<ModuleDoc | null>(null)
  const [allDocs, setAllDocs] = useState<ModuleDoc[]>([])
  const [view, setView] = useState<PanelView>('overview')
  const [selectedWorkflow, setSelectedWorkflow] = useState<DocWorkflow | null>(null)
  const [expandedTask, setExpandedTask] = useState<number | null>(null)
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null)
  const [docsLoaded, setDocsLoaded] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  // Resolve current module from pathname
  useEffect(() => {
    const slug = resolveModuleFromPath(pathname)
    if (slug) setCurrentModule(slug)
  }, [pathname, setCurrentModule])

  // Load help entry when module changes
  useEffect(() => {
    if (currentModule) {
      const entry = getHelpEntry(currentModule)
      setHelpEntry(entry)
      setView('overview')
      setSelectedWorkflow(null)
      setFeedback(null)
    }
  }, [currentModule])

  // Load full module doc when panel opens
  useEffect(() => {
    if (isHelpOpen && currentModule) {
      loadDoc(currentModule).then(doc => {
        setModuleDoc(doc)
      })
    }
  }, [isHelpOpen, currentModule])

  // Load all docs for search (lazy, once)
  useEffect(() => {
    if (isHelpOpen && !docsLoaded) {
      loadAllDocs().then(docs => {
        setAllDocs(docs)
        setDocsLoaded(true)
      })
    }
  }, [isHelpOpen, docsLoaded])

  // Focus trap
  useEffect(() => {
    if (isHelpOpen && panelRef.current) {
      panelRef.current.focus()
    }
  }, [isHelpOpen])

  const handleSearchResult = useCallback((slug: string, _matchType: string) => {
    setCurrentModule(slug)
    loadDoc(slug).then(doc => setModuleDoc(doc))
    const entry = getHelpEntry(slug)
    setHelpEntry(entry)
    setView('overview')
    setSelectedWorkflow(null)
  }, [setCurrentModule])

  const handleWorkflowClick = useCallback((workflow: DocWorkflow) => {
    setSelectedWorkflow(workflow)
    setView('workflow')
  }, [])

  const goBack = useCallback(() => {
    if (view === 'workflow') {
      setView('workflows-list')
      setSelectedWorkflow(null)
    } else {
      setView('overview')
    }
  }, [view])

  if (!isHelpOpen) return null

  return (
    <>
      {/* Backdrop for mobile */}
      <div
        className="fixed inset-0 bg-black/20 z-40 lg:hidden"
        onClick={closeHelp}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        ref={panelRef}
        role="complementary"
        aria-label="Help panel"
        tabIndex={-1}
        className={cn(
          'fixed right-0 top-0 h-full w-full sm:w-[400px] bg-card border-l border-border z-50',
          'flex flex-col shadow-xl',
          'animate-in slide-in-from-right duration-200',
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-divider shrink-0">
          <div className="flex items-center gap-2">
            {view !== 'overview' && (
              <button
                onClick={goBack}
                className="p-1 rounded hover:bg-canvas text-t3 hover:text-t1 transition-colors"
                aria-label="Go back"
              >
                <ChevronLeft size={16} />
              </button>
            )}
            <BookOpen size={16} className="text-tempo-600" />
            <h2 className="text-sm font-semibold text-t1">
              {view === 'workflow' && selectedWorkflow
                ? selectedWorkflow.title
                : view === 'workflows-list'
                ? 'Workflows'
                : view === 'tips'
                ? 'Tips & Best Practices'
                : view === 'faqs'
                ? 'Frequently Asked Questions'
                : 'Help'
              }
            </h2>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-t3 bg-canvas px-1.5 py-0.5 rounded font-mono">?</span>
            <button
              onClick={closeHelp}
              className="p-1 rounded hover:bg-canvas text-t3 hover:text-t1 transition-colors"
              aria-label="Close help panel"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b border-divider shrink-0">
          <HelpSearch docs={allDocs} onSelectResult={handleSearchResult} />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {view === 'overview' && <OverviewView
            helpEntry={helpEntry}
            moduleDoc={moduleDoc}
            onViewWorkflows={() => setView('workflows-list')}
            onWorkflowClick={handleWorkflowClick}
            onViewTips={() => setView('tips')}
            onViewFaqs={() => setView('faqs')}
          />}

          {view === 'workflows-list' && <WorkflowsListView
            moduleDoc={moduleDoc}
            onWorkflowClick={handleWorkflowClick}
          />}

          {view === 'workflow' && selectedWorkflow && <WorkflowView
            workflow={selectedWorkflow}
          />}

          {view === 'tips' && <TipsView
            helpEntry={helpEntry}
            moduleDoc={moduleDoc}
          />}

          {view === 'faqs' && <FaqsView
            moduleDoc={moduleDoc}
            expandedTask={expandedTask}
            setExpandedTask={setExpandedTask}
          />}
        </div>

        {/* Footer with feedback */}
        <div className="px-4 py-3 border-t border-divider shrink-0">
          <div className="flex items-center justify-between">
            <span className="text-xs text-t3">Was this helpful?</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFeedback('up')}
                className={cn(
                  'p-1.5 rounded transition-colors',
                  feedback === 'up'
                    ? 'bg-green-50 text-green-600'
                    : 'hover:bg-canvas text-t3 hover:text-t1'
                )}
                aria-label="This was helpful"
                aria-pressed={feedback === 'up'}
              >
                <ThumbsUp size={14} />
              </button>
              <button
                onClick={() => setFeedback('down')}
                className={cn(
                  'p-1.5 rounded transition-colors',
                  feedback === 'down'
                    ? 'bg-red-50 text-red-600'
                    : 'hover:bg-canvas text-t3 hover:text-t1'
                )}
                aria-label="This was not helpful"
                aria-pressed={feedback === 'down'}
              >
                <ThumbsDown size={14} />
              </button>
            </div>
          </div>
          {feedback && (
            <p className="text-[10px] text-t3 mt-1">
              {feedback === 'up' ? 'Thanks for the feedback!' : 'We\'ll work on improving this section.'}
            </p>
          )}
        </div>
      </div>
    </>
  )
}

// ─── Sub-views ──────────────────────────────────────────────────────────────

function OverviewView({
  helpEntry, moduleDoc, onViewWorkflows, onWorkflowClick, onViewTips, onViewFaqs,
}: {
  helpEntry: HelpEntry | null
  moduleDoc: ModuleDoc | null
  onViewWorkflows: () => void
  onWorkflowClick: (w: DocWorkflow) => void
  onViewTips: () => void
  onViewFaqs: () => void
}) {
  if (!helpEntry && !moduleDoc) {
    return (
      <div className="text-center py-8">
        <BookOpen size={32} className="mx-auto text-t3 mb-3" />
        <p className="text-sm text-t2 font-medium">Welcome to Help</p>
        <p className="text-xs text-t3 mt-1">
          Use the search above to find topics, or navigate to a page to see contextual help.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Module title and description */}
      <div>
        <h3 className="text-base font-semibold text-t1">{helpEntry?.title || moduleDoc?.title}</h3>
        <p className="text-xs text-t2 mt-1 leading-relaxed">
          {helpEntry?.description || moduleDoc?.overview.description.slice(0, 200)}
        </p>
      </div>

      {/* Quick start */}
      {helpEntry && helpEntry.quickStart.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-t1 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <ListChecks size={12} className="text-tempo-600" />
            Quick Start
          </h4>
          <ol className="space-y-1.5">
            {helpEntry.quickStart.map((step, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-t2">
                <span className="shrink-0 w-4 h-4 rounded-full bg-tempo-100 text-tempo-700 flex items-center justify-center text-[10px] font-semibold mt-0.5">
                  {i + 1}
                </span>
                <span className="leading-relaxed">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Common tasks */}
      {helpEntry && helpEntry.commonTasks.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-t1 uppercase tracking-wider mb-2">Common Tasks</h4>
          <div className="space-y-1">
            {helpEntry.commonTasks.map((task, i) => (
              <CommonTaskItem key={i} task={task} />
            ))}
          </div>
        </div>
      )}

      {/* Navigation cards */}
      <div className="space-y-1.5">
        {moduleDoc && moduleDoc.workflows.length > 0 && (
          <NavCard
            icon={<WorkflowIcon size={14} />}
            label="Step-by-step Workflows"
            count={moduleDoc.workflows.length}
            onClick={onViewWorkflows}
          />
        )}
        {((helpEntry?.tips && helpEntry.tips.length > 0) || (moduleDoc?.tips && moduleDoc.tips.length > 0)) && (
          <NavCard
            icon={<Lightbulb size={14} />}
            label="Tips & Best Practices"
            count={(helpEntry?.tips?.length || 0) + (moduleDoc?.tips?.length || 0)}
            onClick={onViewTips}
          />
        )}
        {moduleDoc && moduleDoc.faqs && moduleDoc.faqs.length > 0 && (
          <NavCard
            icon={<MessageSquareText size={14} />}
            label="Frequently Asked Questions"
            count={moduleDoc.faqs.length}
            onClick={onViewFaqs}
          />
        )}
      </div>

      {/* Related modules */}
      {helpEntry && helpEntry.relatedModules.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-t1 uppercase tracking-wider mb-2">Related Modules</h4>
          <div className="flex flex-wrap gap-1.5">
            {helpEntry.relatedModules.map(mod => (
              <span
                key={mod}
                className="px-2 py-0.5 text-[10px] rounded-full bg-canvas text-t2 border border-border"
              >
                {mod.replace(/[-/]/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Key features from full doc */}
      {moduleDoc && moduleDoc.overview.keyFeatures.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-t1 uppercase tracking-wider mb-2">Key Features</h4>
          <ul className="space-y-1">
            {moduleDoc.overview.keyFeatures.slice(0, 6).map((feature, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-t2">
                <span className="shrink-0 text-tempo-500 mt-0.5">&#x2022;</span>
                <span className="leading-relaxed">{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function CommonTaskItem({ task }: { task: { label: string; steps: string[] } }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2 text-xs text-t1 hover:bg-canvas transition-colors"
        aria-expanded={open}
      >
        <span className="font-medium">{task.label}</span>
        {open ? <ChevronDown size={12} className="text-t3" /> : <ChevronRight size={12} className="text-t3" />}
      </button>
      {open && (
        <div className="px-3 pb-2 border-t border-divider">
          <ol className="space-y-1 mt-2">
            {task.steps.map((step, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-t2">
                <span className="shrink-0 text-[10px] font-mono text-t3 mt-0.5">{i + 1}.</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  )
}

function NavCard({ icon, label, count, onClick }: {
  icon: React.ReactNode; label: string; count: number; onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border border-border hover:bg-canvas transition-colors text-left"
    >
      <span className="text-tempo-600">{icon}</span>
      <span className="flex-1 text-xs font-medium text-t1">{label}</span>
      <span className="text-[10px] text-t3 bg-canvas px-1.5 py-0.5 rounded-full">{count}</span>
      <ChevronRight size={12} className="text-t3" />
    </button>
  )
}

function WorkflowIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M8 12h8" /><path d="M12 8v8" />
    </svg>
  )
}

function WorkflowsListView({ moduleDoc, onWorkflowClick }: {
  moduleDoc: ModuleDoc | null; onWorkflowClick: (w: DocWorkflow) => void
}) {
  if (!moduleDoc || moduleDoc.workflows.length === 0) {
    return <p className="text-xs text-t3 text-center py-4">No workflows available for this module.</p>
  }

  return (
    <div className="space-y-2">
      {moduleDoc.workflows.map(workflow => (
        <button
          key={workflow.id}
          onClick={() => onWorkflowClick(workflow)}
          className="w-full text-left px-3 py-3 rounded-lg border border-border hover:bg-canvas transition-colors"
        >
          <div className="text-xs font-medium text-t1">{workflow.title}</div>
          <p className="text-[11px] text-t3 mt-0.5 line-clamp-2">{workflow.description}</p>
          <div className="flex items-center gap-3 mt-2">
            {workflow.estimatedTime && (
              <span className="flex items-center gap-1 text-[10px] text-t3">
                <Clock size={10} />
                {workflow.estimatedTime}
              </span>
            )}
            <span className="text-[10px] text-t3">
              {workflow.steps.length} steps
            </span>
          </div>
        </button>
      ))}
    </div>
  )
}

function WorkflowView({ workflow }: { workflow: DocWorkflow }) {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs text-t2 leading-relaxed">{workflow.description}</p>
        <div className="flex items-center gap-3 mt-2">
          {workflow.estimatedTime && (
            <span className="flex items-center gap-1 text-[10px] text-t3">
              <Clock size={10} />
              {workflow.estimatedTime}
            </span>
          )}
          {workflow.roles && workflow.roles.length > 0 && (
            <span className="text-[10px] text-t3">
              For: {workflow.roles.join(', ')}
            </span>
          )}
        </div>
      </div>

      {workflow.prerequisites && workflow.prerequisites.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          <h5 className="text-[10px] font-semibold text-amber-800 uppercase tracking-wider mb-1">Prerequisites</h5>
          <ul className="space-y-0.5">
            {workflow.prerequisites.map((prereq, i) => (
              <li key={i} className="text-[11px] text-amber-700 flex items-start gap-1.5">
                <span className="mt-0.5">&#x2022;</span>
                {prereq}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="space-y-3">
        {workflow.steps.map((step, i) => (
          <div key={step.number} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className="w-6 h-6 rounded-full bg-tempo-100 text-tempo-700 flex items-center justify-center text-[11px] font-semibold shrink-0">
                {step.number}
              </div>
              {i < workflow.steps.length - 1 && (
                <div className="w-px flex-1 bg-border mt-1" />
              )}
            </div>
            <div className="pb-4 min-w-0">
              <h5 className="text-xs font-semibold text-t1">{step.title}</h5>
              <p className="text-[11px] text-t2 mt-0.5 leading-relaxed">{step.description}</p>
              {step.tip && (
                <div className="mt-1.5 flex items-start gap-1.5 text-[11px] text-tempo-700 bg-tempo-50 rounded px-2 py-1">
                  <Lightbulb size={10} className="shrink-0 mt-0.5" />
                  <span>{step.tip}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function TipsView({ helpEntry, moduleDoc }: { helpEntry: HelpEntry | null; moduleDoc: ModuleDoc | null }) {
  const allTips = [
    ...(helpEntry?.tips || []),
    ...(moduleDoc?.tips || []),
  ]
  // Deduplicate
  const unique = [...new Set(allTips)]

  if (unique.length === 0) {
    return <p className="text-xs text-t3 text-center py-4">No tips available.</p>
  }

  return (
    <div className="space-y-2">
      {unique.map((tip, i) => (
        <div key={i} className="flex items-start gap-2 px-3 py-2 rounded-lg bg-tempo-50 border border-tempo-100">
          <Lightbulb size={12} className="shrink-0 mt-0.5 text-tempo-600" />
          <p className="text-xs text-tempo-800 leading-relaxed">{tip}</p>
        </div>
      ))}
    </div>
  )
}

function FaqsView({ moduleDoc, expandedTask, setExpandedTask }: {
  moduleDoc: ModuleDoc | null
  expandedTask: number | null
  setExpandedTask: (i: number | null) => void
}) {
  if (!moduleDoc || !moduleDoc.faqs || moduleDoc.faqs.length === 0) {
    return <p className="text-xs text-t3 text-center py-4">No FAQs available.</p>
  }

  return (
    <div className="space-y-1.5">
      {moduleDoc.faqs.map((faq, i) => (
        <div key={i} className="border border-border rounded-lg overflow-hidden">
          <button
            onClick={() => setExpandedTask(expandedTask === i ? null : i)}
            className="w-full flex items-center justify-between px-3 py-2.5 text-xs text-t1 hover:bg-canvas transition-colors text-left"
            aria-expanded={expandedTask === i}
          >
            <span className="font-medium pr-2">{faq.question}</span>
            {expandedTask === i
              ? <ChevronDown size={12} className="text-t3 shrink-0" />
              : <ChevronRight size={12} className="text-t3 shrink-0" />
            }
          </button>
          {expandedTask === i && (
            <div className="px-3 pb-3 border-t border-divider">
              <p className="text-xs text-t2 mt-2 leading-relaxed">{faq.answer}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
