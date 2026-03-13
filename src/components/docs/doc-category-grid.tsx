'use client'

import { useMemo } from 'react'
import { cn } from '@/lib/utils/cn'
import { DocModuleCard } from './doc-module-card'
import { DOC_GROUP_LABELS, DOC_GROUP_ORDER, type DocGroup } from '@/lib/docs/types'

interface ModuleEntry {
  slug: string
  title: string
  subtitle: string
  icon: string
  group: DocGroup
  workflowCount: number
  hasContent: boolean
}

interface DocCategoryGridProps {
  modules: ModuleEntry[]
  filter: DocGroup | 'all'
  onModuleClick: (slug: string) => void
  className?: string
}

export function DocCategoryGrid({
  modules,
  filter,
  onModuleClick,
  className,
}: DocCategoryGridProps) {
  const grouped = useMemo(() => {
    const filtered =
      filter === 'all' ? modules : modules.filter((m) => m.group === filter)

    const groups: Record<string, ModuleEntry[]> = {}
    for (const mod of filtered) {
      if (!groups[mod.group]) groups[mod.group] = []
      groups[mod.group].push(mod)
    }
    return groups
  }, [modules, filter])

  const orderedGroups = DOC_GROUP_ORDER.filter((g) => grouped[g]?.length)

  if (orderedGroups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-sm text-t3">No modules match your search.</p>
      </div>
    )
  }

  return (
    <div className={cn('space-y-8', className)}>
      {orderedGroups.map((group) => (
        <section key={group}>
          <h2 className="text-xs font-semibold text-t3 uppercase tracking-wider mb-3">
            {DOC_GROUP_LABELS[group]}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {grouped[group].map((mod) => (
              <DocModuleCard
                key={mod.slug}
                slug={mod.slug}
                title={mod.title}
                subtitle={mod.subtitle}
                icon={mod.icon}
                group={mod.group}
                workflowCount={mod.workflowCount}
                hasContent={mod.hasContent}
                onClick={() => onModuleClick(mod.slug)}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
