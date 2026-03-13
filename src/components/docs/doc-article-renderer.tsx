'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils/cn'
import { Badge } from '@/components/ui/badge'
import {
  CheckCircle, Lightbulb, ShieldCheck, HelpCircle, ChevronDown, BookOpen,
} from 'lucide-react'
import { DocWorkflowAccordion } from './doc-workflow-accordion'
import { DocScreenshot } from './doc-screenshot'
import { DocRelatedModules } from './doc-related-modules'
import type { ModuleDoc } from '@/lib/docs/types'

// ─── Section heading helper ───────────────────────────────────────────────
function SectionHeading({
  id,
  icon,
  children,
}: {
  id: string
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div id={id} className="scroll-mt-24 flex items-center gap-2.5 mb-4 pt-8 first:pt-0">
      <div className="flex-shrink-0 text-tempo-600">{icon}</div>
      <h2 className="text-base font-semibold text-t1">{children}</h2>
    </div>
  )
}

// ─── FAQ item ─────────────────────────────────────────────────────────────
function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="border border-border rounded-[var(--radius-card)] overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-canvas/50 transition-colors"
        aria-expanded={open}
      >
        <ChevronDown
          size={14}
          className={cn(
            'text-t3 flex-shrink-0 transition-transform duration-200',
            open && 'rotate-180'
          )}
        />
        <span className="text-sm font-medium text-t1">{question}</span>
      </button>
      {open && (
        <div className="px-4 pb-4 pt-0 border-t border-divider">
          <p className="text-sm text-t2 leading-relaxed pt-3">{answer}</p>
        </div>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────
interface DocArticleRendererProps {
  doc: ModuleDoc
  className?: string
}

export function DocArticleRenderer({ doc, className }: DocArticleRendererProps) {
  return (
    <article className={cn('space-y-0', className)}>
      {/* ── Overview ─────────────────────────────────────────────────────── */}
      <section>
        <SectionHeading id="overview" icon={<BookOpen size={18} />}>
          Overview
        </SectionHeading>

        <p className="text-sm text-t2 leading-relaxed mb-5">
          {doc.overview.description}
        </p>

        {doc.overview.screenshotKey && (
          <DocScreenshot
            screenshotKey={doc.overview.screenshotKey}
            alt={`${doc.title} overview`}
            className="mb-5"
          />
        )}

        {doc.overview.keyFeatures.length > 0 && (
          <div className="bg-card border border-border rounded-[var(--radius-card)] p-5">
            <h3 className="text-xs font-semibold text-t3 uppercase tracking-wider mb-3">
              Key Features
            </h3>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {doc.overview.keyFeatures.map((feature, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <CheckCircle
                    size={14}
                    className="text-tempo-600 flex-shrink-0 mt-0.5"
                  />
                  <span className="text-sm text-t2">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex items-center gap-3 mt-4 text-[0.65rem] text-t3">
          <span>v{doc.version}</span>
          <span className="w-px h-3 bg-divider" />
          <span>
            Updated{' '}
            {new Date(doc.lastUpdated).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </span>
        </div>
      </section>

      {/* ── Workflows ────────────────────────────────────────────────────── */}
      {doc.workflows.length > 0 && (
        <section>
          <SectionHeading id="workflows" icon={<BookOpen size={18} />}>
            Workflows
          </SectionHeading>
          <div className="space-y-3">
            {doc.workflows.map((wf, i) => (
              <div key={wf.id} id={`workflow-${wf.id}`} className="scroll-mt-24">
                <DocWorkflowAccordion
                  workflow={wf}
                  defaultOpen={i === 0}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Tips ─────────────────────────────────────────────────────────── */}
      {doc.tips.length > 0 && (
        <section>
          <SectionHeading id="tips" icon={<Lightbulb size={18} />}>
            Tips
          </SectionHeading>
          <div className="bg-tempo-50/50 border border-tempo-200/50 rounded-[var(--radius-card)] p-5 space-y-3">
            {doc.tips.map((tip, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <Lightbulb
                  size={14}
                  className="text-tempo-600 flex-shrink-0 mt-0.5"
                />
                <p className="text-sm text-t2 leading-relaxed">{tip}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Permissions ──────────────────────────────────────────────────── */}
      {doc.permissions.length > 0 && (
        <section>
          <SectionHeading id="permissions" icon={<ShieldCheck size={18} />}>
            Permissions
          </SectionHeading>
          <div className="bg-card border border-border rounded-[var(--radius-card)] overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-divider">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-t3 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-t3 uppercase tracking-wider">
                    Capabilities
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-divider">
                {doc.permissions.map((perm) => (
                  <tr key={perm.role}>
                    <td className="px-5 py-3 font-medium text-t1 whitespace-nowrap align-top">
                      <Badge variant="info">{perm.role}</Badge>
                    </td>
                    <td className="px-5 py-3 text-t2">
                      <ul className="space-y-1">
                        {perm.capabilities.map((cap, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-tempo-600 mt-px text-xs">&#8226;</span>
                            <span className="text-sm">{cap}</span>
                          </li>
                        ))}
                      </ul>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ── FAQs ─────────────────────────────────────────────────────────── */}
      {doc.faqs.length > 0 && (
        <section>
          <SectionHeading id="faqs" icon={<HelpCircle size={18} />}>
            Frequently Asked Questions
          </SectionHeading>
          <div className="space-y-2">
            {doc.faqs.map((faq, i) => (
              <FaqItem key={i} question={faq.question} answer={faq.answer} />
            ))}
          </div>
        </section>
      )}

      {/* ── Related Modules ──────────────────────────────────────────────── */}
      {doc.relatedModules.length > 0 && (
        <section id="related" className="scroll-mt-24">
          <SectionHeading id="related-heading" icon={<BookOpen size={18} />}>
            Related Modules
          </SectionHeading>
          <DocRelatedModules slugs={doc.relatedModules} />
        </section>
      )}
    </article>
  )
}
