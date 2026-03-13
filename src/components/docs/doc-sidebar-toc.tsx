'use client'

import { useState, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils/cn'
import type { ModuleDoc } from '@/lib/docs/types'

interface DocSidebarTocProps {
  doc: ModuleDoc
  className?: string
}

interface TocEntry {
  id: string
  label: string
}

function buildTocEntries(doc: ModuleDoc): TocEntry[] {
  const entries: TocEntry[] = [{ id: 'overview', label: 'Overview' }]

  for (const wf of doc.workflows) {
    entries.push({ id: `workflow-${wf.id}`, label: wf.title })
  }

  if (doc.tips.length > 0) {
    entries.push({ id: 'tips', label: 'Tips' })
  }
  if (doc.permissions.length > 0) {
    entries.push({ id: 'permissions', label: 'Permissions' })
  }
  if (doc.faqs.length > 0) {
    entries.push({ id: 'faqs', label: 'FAQs' })
  }
  if (doc.relatedModules.length > 0) {
    entries.push({ id: 'related', label: 'Related Modules' })
  }

  return entries
}

export function DocSidebarToc({ doc, className }: DocSidebarTocProps) {
  const entries = buildTocEntries(doc)
  const [activeId, setActiveId] = useState<string>(entries[0]?.id ?? '')
  const observerRef = useRef<IntersectionObserver | null>(null)

  useEffect(() => {
    // Disconnect previous observer
    observerRef.current?.disconnect()

    const ids = entries.map((e) => e.id)
    const visibleSections = new Map<string, boolean>()

    observerRef.current = new IntersectionObserver(
      (observerEntries) => {
        for (const entry of observerEntries) {
          visibleSections.set(entry.target.id, entry.isIntersecting)
        }

        // Pick the first visible section in DOM order
        for (const id of ids) {
          if (visibleSections.get(id)) {
            setActiveId(id)
            return
          }
        }
      },
      { rootMargin: '-80px 0px -60% 0px', threshold: 0 }
    )

    for (const id of ids) {
      const el = document.getElementById(id)
      if (el) observerRef.current.observe(el)
    }

    return () => observerRef.current?.disconnect()
  }, [doc]) // eslint-disable-line react-hooks/exhaustive-deps

  function scrollTo(id: string) {
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <nav
      className={cn(
        'hidden xl:block sticky top-24 w-48 flex-shrink-0',
        className
      )}
      aria-label="Table of contents"
    >
      <p className="text-[0.65rem] font-semibold text-t3 uppercase tracking-wider mb-3">
        On this page
      </p>
      <ul className="space-y-0.5">
        {entries.map((entry) => (
          <li key={entry.id}>
            <button
              onClick={() => scrollTo(entry.id)}
              className={cn(
                'block w-full text-left text-xs py-1.5 px-2.5 rounded transition-colors leading-snug',
                activeId === entry.id
                  ? 'text-tempo-600 bg-tempo-50 font-medium'
                  : 'text-t3 hover:text-t1 hover:bg-canvas'
              )}
            >
              {entry.label}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  )
}
