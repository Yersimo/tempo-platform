'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Skeleton, SkeletonText, SkeletonCard } from '@/components/ui/skeleton'
import { Header } from '@/components/layout/header'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils/cn'
import { loadDoc, getDocEntry, allModuleSlugs, hasDoc } from '@/lib/docs/registry'
import { DOC_GROUP_LABELS } from '@/lib/docs/types'
import type { ModuleDoc, DocWorkflow, DocFaq, DocPermission } from '@/lib/docs/types'
import {
  Download, ChevronRight, Clock, Users as UsersIcon, CheckCircle2, Lightbulb,
  HelpCircle, ShieldCheck, BookOpen, ArrowRight, FileQuestion, Link2,
  LayoutDashboard, Users, Briefcase, MessageSquare, TrendingUp, Banknote,
  GraduationCap, HeartPulse, UserCheck, UserMinus, UserPlus, Wallet, Shield,
  Receipt, Plane, Globe, Cloud, Laptop, AppWindow, KeyRound, Lock, Store,
  FileText, PieChart, CreditCard, CircleDollarSign, FolderKanban, Compass, Zap,
  BarChart3, FileSignature, Blocks, FlaskConical, Network, Code, Settings,
} from 'lucide-react'

// ─── Icon resolver ──────────────────────────────────────────────────────────
const ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  LayoutDashboard, Users, Briefcase, MessageSquare, TrendingUp, Banknote,
  GraduationCap, HeartPulse, UserCheck, UserMinus, UserPlus, Wallet, Shield,
  ShieldCheck, Receipt, Plane, Globe, Cloud, Laptop, AppWindow, KeyRound, Lock, Store,
  FileText, PieChart, CreditCard, CircleDollarSign, FolderKanban, Compass, Zap,
  BarChart3, FileSignature, Blocks, FlaskConical, Network, Code, Settings, BookOpen,
  Clock,
}

function resolveIcon(name: string) {
  return ICON_MAP[name] || FileQuestion
}

// ─── Table of contents section IDs ──────────────────────────────────────────
const TOC_SECTIONS = [
  { id: 'overview', label: 'Overview' },
  { id: 'key-features', label: 'Key Features' },
  { id: 'workflows', label: 'Workflows' },
  { id: 'faqs', label: 'FAQs' },
  { id: 'tips', label: 'Tips & Best Practices' },
  { id: 'permissions', label: 'Permissions' },
  { id: 'related', label: 'Related Modules' },
]

// ─── Workflow section component ─────────────────────────────────────────────
function WorkflowSection({ workflow, index }: { workflow: DocWorkflow; index: number }) {
  const [expanded, setExpanded] = useState(index === 0)

  return (
    <Card padding="none" className="overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-canvas/50 transition-colors"
      >
        <div className="w-7 h-7 rounded-lg bg-tempo-50 flex items-center justify-center text-xs font-bold text-tempo-600 shrink-0">
          {index + 1}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-t1">{workflow.title}</h4>
          <p className="text-xs text-t3 mt-0.5 line-clamp-1">{workflow.description}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {workflow.estimatedTime && (
            <span className="text-[0.65rem] text-t3 flex items-center gap-1">
              <Clock size={10} /> {workflow.estimatedTime}
            </span>
          )}
          <ChevronRight
            size={14}
            className={cn('text-t3 transition-transform', expanded && 'rotate-90')}
          />
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-5 pt-1 border-t border-divider">
          <p className="text-xs text-t2 mb-4">{workflow.description}</p>

          {workflow.roles && workflow.roles.length > 0 && (
            <div className="flex items-center gap-1.5 mb-4">
              <UsersIcon size={12} className="text-t3" />
              <span className="text-[0.65rem] text-t3">Available to:</span>
              {workflow.roles.map(role => (
                <Badge key={role} variant="info" className="capitalize">{role}</Badge>
              ))}
            </div>
          )}

          {workflow.prerequisites && workflow.prerequisites.length > 0 && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-[0.65rem] font-semibold text-amber-700 uppercase tracking-wider mb-1">Prerequisites</p>
              <ul className="space-y-1">
                {workflow.prerequisites.map((prereq, i) => (
                  <li key={i} className="text-xs text-amber-800 flex items-start gap-1.5">
                    <span className="text-amber-500 mt-0.5">&#8226;</span>
                    {prereq}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="space-y-4">
            {workflow.steps.map(step => (
              <div key={step.number} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-6 h-6 rounded-full bg-tempo-600 flex items-center justify-center text-white text-[0.6rem] font-bold shrink-0">
                    {step.number}
                  </div>
                  {step.number < workflow.steps.length && (
                    <div className="w-px flex-1 bg-divider mt-1" />
                  )}
                </div>
                <div className="flex-1 pb-4">
                  <h5 className="text-xs font-semibold text-t1">{step.title}</h5>
                  <p className="text-xs text-t2 mt-1 leading-relaxed">{step.description}</p>
                  {step.tip && (
                    <div className="flex items-start gap-1.5 mt-2 p-2 bg-tempo-50 rounded-md">
                      <Lightbulb size={12} className="text-tempo-600 shrink-0 mt-0.5" />
                      <p className="text-[0.65rem] text-tempo-700">{step.tip}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  )
}

// ─── FAQ item component ─────────────────────────────────────────────────────
function FaqItem({ faq, index }: { faq: DocFaq; index: number }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="border-b border-divider last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-start gap-3 py-3.5 text-left hover:bg-canvas/30 transition-colors px-1"
      >
        <HelpCircle size={14} className="text-tempo-600 shrink-0 mt-0.5" />
        <span className="text-sm text-t1 font-medium flex-1">{faq.question}</span>
        <ChevronRight
          size={14}
          className={cn('text-t3 transition-transform shrink-0 mt-0.5', open && 'rotate-90')}
        />
      </button>
      {open && (
        <div className="pl-8 pr-4 pb-4">
          <p className="text-xs text-t2 leading-relaxed">{faq.answer}</p>
        </div>
      )}
    </div>
  )
}

// ─── Permissions table ──────────────────────────────────────────────────────
function PermissionsTable({ permissions }: { permissions: DocPermission[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-divider">
            <th className="text-left py-2.5 pr-4 font-semibold text-t1 w-28">Role</th>
            <th className="text-left py-2.5 font-semibold text-t1">Capabilities</th>
          </tr>
        </thead>
        <tbody>
          {permissions.map(perm => (
            <tr key={perm.role} className="border-b border-divider last:border-0">
              <td className="py-2.5 pr-4 align-top">
                <Badge variant="orange">{perm.role}</Badge>
              </td>
              <td className="py-2.5">
                <ul className="space-y-1">
                  {perm.capabilities.map((cap, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-t2">
                      <CheckCircle2 size={10} className="text-success shrink-0 mt-0.5" />
                      {cap}
                    </li>
                  ))}
                </ul>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Sticky sidebar TOC ─────────────────────────────────────────────────────
function SidebarToc({ doc, activeSection }: { doc: ModuleDoc; activeSection: string }) {
  // Filter TOC to only show sections that have content
  const visibleSections = TOC_SECTIONS.filter(s => {
    if (s.id === 'overview') return true
    if (s.id === 'key-features') return doc.overview.keyFeatures.length > 0
    if (s.id === 'workflows') return doc.workflows.length > 0
    if (s.id === 'faqs') return doc.faqs.length > 0
    if (s.id === 'tips') return doc.tips.length > 0
    if (s.id === 'permissions') return doc.permissions.length > 0
    if (s.id === 'related') return doc.relatedModules.length > 0
    return false
  })

  return (
    <nav className="space-y-0.5">
      <p className="text-[0.6rem] font-semibold text-t3 uppercase tracking-wider mb-2">On this page</p>
      {visibleSections.map(section => (
        <a
          key={section.id}
          href={`#${section.id}`}
          className={cn(
            'block text-xs py-1.5 px-2.5 rounded-md transition-colors',
            activeSection === section.id
              ? 'text-tempo-600 bg-tempo-50 font-medium'
              : 'text-t3 hover:text-t1 hover:bg-canvas'
          )}
        >
          {section.label}
        </a>
      ))}
    </nav>
  )
}

// ─── Main page ──────────────────────────────────────────────────────────────
export default function HelpModulePage() {
  const params = useParams()
  const slug = params.slug as string

  const [doc, setDoc] = useState<ModuleDoc | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [activeSection, setActiveSection] = useState('overview')

  // Load the doc
  useEffect(() => {
    setLoading(true)
    setNotFound(false)

    // Check if the slug exists at all (in active or placeholder)
    const moduleExists = allModuleSlugs.some(m => m.slug === slug)
    if (!moduleExists) {
      setNotFound(true)
      setLoading(false)
      return
    }

    // Try loading the authored doc
    loadDoc(slug).then(result => {
      if (result) {
        setDoc(result)
      } else {
        // Module exists but no authored content
        setDoc(null)
      }
      setLoading(false)
    })
  }, [slug])

  // Intersection observer for active section tracking
  useEffect(() => {
    if (!doc) return

    const observer = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id)
          }
        }
      },
      { rootMargin: '-80px 0px -60% 0px', threshold: 0 }
    )

    const sections = document.querySelectorAll('[data-toc-section]')
    sections.forEach(section => observer.observe(section))

    return () => observer.disconnect()
  }, [doc])

  // Find the placeholder entry for module title/icon when there's no full doc
  const placeholderEntry = useMemo(() => {
    return allModuleSlugs.find(m => m.slug === slug)
  }, [slug])

  // Related modules lookup
  const relatedEntries = useMemo(() => {
    if (!doc) return []
    return doc.relatedModules
      .map(s => allModuleSlugs.find(m => m.slug === s))
      .filter(Boolean) as typeof allModuleSlugs
  }, [doc])

  // Download handler (stub)
  const handleDownload = () => {
    // In production this would generate a PDF via the doc content
    window.print()
  }

  // ─── Loading state ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto animate-in fade-in duration-300">
        <div className="space-y-6">
          <div className="space-y-2">
            <Skeleton height="h-3" width="w-40" />
            <Skeleton height="h-6" width="w-64" />
            <Skeleton height="h-4" width="w-96" className="opacity-60" />
          </div>
          <div className="flex gap-8">
            <div className="flex-1 space-y-4">
              <SkeletonCard lines={4} />
              <SkeletonCard lines={2} />
              <SkeletonCard lines={5} />
            </div>
            <div className="w-56 hidden lg:block space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} height="h-6" width={i % 2 === 0 ? 'w-full' : 'w-4/5'} />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ─── 404 state ──────────────────────────────────────────────────────────
  if (notFound) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <Header title="Module Not Found" />
        <Card className="text-center py-16">
          <FileQuestion size={48} className="mx-auto text-t3 mb-4" />
          <h2 className="text-lg font-semibold text-t1 mb-2">Module not found</h2>
          <p className="text-sm text-t3 mb-6 max-w-md mx-auto">
            The module &ldquo;{slug}&rdquo; does not exist in the Tempo platform.
          </p>
          <Link href="/help">
            <Button variant="primary" size="sm">
              <BookOpen size={14} />
              Back to Help Center
            </Button>
          </Link>
        </Card>
      </div>
    )
  }

  // ─── Placeholder state (module exists but no authored docs) ─────────────
  if (!doc && placeholderEntry) {
    const Icon = resolveIcon(placeholderEntry.icon)
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <Header
          title={placeholderEntry.title}
          subtitle={`${DOC_GROUP_LABELS[placeholderEntry.group]} module`}
        />
        <Card className="text-center py-16">
          <div className="w-14 h-14 rounded-2xl bg-tempo-50 flex items-center justify-center mx-auto mb-4">
            <Icon size={28} className="text-tempo-600" />
          </div>
          <h2 className="text-lg font-semibold text-t1 mb-2">Documentation coming soon</h2>
          <p className="text-sm text-t3 mb-6 max-w-md mx-auto">
            The documentation for {placeholderEntry.title} is currently being authored. Check back later for full guides, workflows, and FAQs.
          </p>
          <Link href="/help">
            <Button variant="secondary" size="sm">
              <BookOpen size={14} />
              Browse other modules
            </Button>
          </Link>
        </Card>
      </div>
    )
  }

  // ─── Full doc view ──────────────────────────────────────────────────────
  if (!doc) return null
  const Icon = resolveIcon(doc.icon)

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <Header
        title={doc.title}
        subtitle={doc.subtitle}
        actions={
          <Button variant="secondary" size="sm" onClick={handleDownload}>
            <Download size={14} />
            Download PDF
          </Button>
        }
      />

      {/* Meta bar */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Badge variant="orange">{DOC_GROUP_LABELS[doc.group]}</Badge>
        <span className="text-[0.65rem] text-t3">v{doc.version}</span>
        <span className="text-[0.65rem] text-t3">Updated {doc.lastUpdated}</span>
        <span className="text-[0.65rem] text-t3">{doc.workflows.length} workflow{doc.workflows.length !== 1 ? 's' : ''}</span>
        <span className="text-[0.65rem] text-t3">{doc.faqs.length} FAQ{doc.faqs.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Two-column layout */}
      <div className="flex gap-8">
        {/* Main content */}
        <div className="flex-1 min-w-0 space-y-8">
          {/* Overview */}
          <section id="overview" data-toc-section>
            <Card>
              <div className="flex items-start gap-4 mb-4">
                <div className="w-11 h-11 rounded-xl bg-tempo-50 flex items-center justify-center shrink-0">
                  <Icon size={22} className="text-tempo-600" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-t1 mb-1">Overview</h2>
                  <p className="text-xs text-t2 leading-relaxed">{doc.overview.description}</p>
                </div>
              </div>
            </Card>
          </section>

          {/* Key features */}
          {doc.overview.keyFeatures.length > 0 && (
            <section id="key-features" data-toc-section>
              <h2 className="text-sm font-semibold text-t1 mb-3 flex items-center gap-2">
                <CheckCircle2 size={16} className="text-success" />
                Key Features
              </h2>
              <Card padding="sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {doc.overview.keyFeatures.map((feature, i) => (
                    <div key={i} className="flex items-start gap-2 p-2 rounded-lg hover:bg-canvas transition-colors">
                      <CheckCircle2 size={12} className="text-success shrink-0 mt-0.5" />
                      <span className="text-xs text-t2">{feature}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </section>
          )}

          {/* Workflows */}
          {doc.workflows.length > 0 && (
            <section id="workflows" data-toc-section>
              <h2 className="text-sm font-semibold text-t1 mb-3 flex items-center gap-2">
                <Zap size={16} className="text-tempo-600" />
                Workflows &amp; Guides
                <span className="text-[0.6rem] text-t3 font-normal">({doc.workflows.length})</span>
              </h2>
              <div className="space-y-3">
                {doc.workflows.map((workflow, i) => (
                  <WorkflowSection key={workflow.id} workflow={workflow} index={i} />
                ))}
              </div>
            </section>
          )}

          {/* FAQs */}
          {doc.faqs.length > 0 && (
            <section id="faqs" data-toc-section>
              <h2 className="text-sm font-semibold text-t1 mb-3 flex items-center gap-2">
                <HelpCircle size={16} className="text-blue-500" />
                Frequently Asked Questions
                <span className="text-[0.6rem] text-t3 font-normal">({doc.faqs.length})</span>
              </h2>
              <Card padding="sm">
                {doc.faqs.map((faq, i) => (
                  <FaqItem key={i} faq={faq} index={i} />
                ))}
              </Card>
            </section>
          )}

          {/* Tips */}
          {doc.tips.length > 0 && (
            <section id="tips" data-toc-section>
              <h2 className="text-sm font-semibold text-t1 mb-3 flex items-center gap-2">
                <Lightbulb size={16} className="text-amber-500" />
                Tips &amp; Best Practices
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {doc.tips.map((tip, i) => (
                  <Card key={i} padding="sm" className="flex items-start gap-2.5">
                    <Lightbulb size={14} className="text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-t2 leading-relaxed">{tip}</p>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {/* Permissions */}
          {doc.permissions.length > 0 && (
            <section id="permissions" data-toc-section>
              <h2 className="text-sm font-semibold text-t1 mb-3 flex items-center gap-2">
                <ShieldCheck size={16} className="text-indigo-500" />
                Permissions by Role
              </h2>
              <Card padding="sm">
                <PermissionsTable permissions={doc.permissions} />
              </Card>
            </section>
          )}

          {/* Related modules */}
          {relatedEntries.length > 0 && (
            <section id="related" data-toc-section>
              <h2 className="text-sm font-semibold text-t1 mb-3 flex items-center gap-2">
                <Link2 size={16} className="text-t3" />
                Related Modules
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {relatedEntries.map(entry => {
                  const RelIcon = resolveIcon(entry.icon)
                  const documented = hasDoc(entry.slug)
                  return (
                    <Link key={entry.slug} href={`/help/${entry.slug}`} className="group block">
                      <Card padding="sm" className="flex items-center gap-3 hover:border-tempo-300 transition-all">
                        <div className="w-8 h-8 rounded-lg bg-tempo-50 flex items-center justify-center shrink-0">
                          <RelIcon size={16} className="text-tempo-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-semibold text-t1">{entry.title}</span>
                          {documented && (
                            <Badge variant="success" className="ml-2">Docs</Badge>
                          )}
                        </div>
                        <ArrowRight size={12} className="text-t3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Card>
                    </Link>
                  )
                })}
              </div>
            </section>
          )}
        </div>

        {/* Sticky sidebar TOC */}
        <aside className="hidden lg:block w-56 shrink-0">
          <div className="sticky top-6">
            <SidebarToc doc={doc} activeSection={activeSection} />

            {/* Quick stats */}
            <div className="mt-6 pt-4 border-t border-divider space-y-2">
              <p className="text-[0.6rem] font-semibold text-t3 uppercase tracking-wider mb-2">Quick Info</p>
              <div className="flex items-center gap-2 text-xs text-t2">
                <BookOpen size={12} className="text-t3" />
                <span>Version {doc.version}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-t2">
                <Clock size={12} className="text-t3" />
                <span>Updated {doc.lastUpdated}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-t2">
                <Zap size={12} className="text-t3" />
                <span>{doc.workflows.length} workflow{doc.workflows.length !== 1 ? 's' : ''}</span>
              </div>
            </div>

            {/* Back to help center */}
            <div className="mt-6">
              <Link href="/help">
                <Button variant="ghost" size="sm" className="w-full justify-start">
                  <BookOpen size={14} />
                  Back to Help Center
                </Button>
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
