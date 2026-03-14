'use client'

import { useState, useMemo, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { Select } from '@/components/ui/input'
import { cn } from '@/lib/utils/cn'
import {
  History, GitBranch, RotateCcw, ChevronDown, ChevronUp,
  FileText, Settings, HelpCircle, Layers, ArrowRight, Plus, Minus, Pencil
} from 'lucide-react'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type ChangeType = 'content_update' | 'structure_change' | 'quiz_update' | 'settings_change'

interface VersionChange {
  field: string
  oldValue: string
  newValue: string
}

interface CourseVersion {
  id: string
  courseId: string
  version: number
  authorId: string
  date: string        // ISO timestamp
  changeType: ChangeType
  summary: string
  changes: VersionChange[]
  blockSnapshot: any[] // snapshot of courseBlocks at this version
}

interface VersionHistoryProps {
  courseId: string
  courseTitle: string
  courseBlocks: any[]
  getEmployeeName: (id: string) => string
  addToast: (msg: string, type?: 'success' | 'error' | 'info') => void
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const CHANGE_TYPE_META: Record<ChangeType, { label: string; variant: 'info' | 'warning' | 'success' | 'orange'; icon: typeof FileText }> = {
  content_update:   { label: 'Content Update',   variant: 'info',    icon: FileText },
  structure_change: { label: 'Structure Change',  variant: 'warning', icon: Layers },
  quiz_update:      { label: 'Quiz Update',       variant: 'success', icon: HelpCircle },
  settings_change:  { label: 'Settings Change',   variant: 'orange',  icon: Settings },
}

function fmtDateTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) +
    ' at ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

function fmtRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return `${Math.floor(days / 30)}mo ago`
}

/* ------------------------------------------------------------------ */
/*  Seed versions                                                      */
/* ------------------------------------------------------------------ */

function seedVersions(courseId: string, courseBlocks: any[]): CourseVersion[] {
  const blocks = courseBlocks.filter((b: any) => b.course_id === courseId)

  return [
    {
      id: `ver-${courseId}-1`, courseId, version: 1, authorId: 'emp-1',
      date: '2025-06-01T09:00:00Z', changeType: 'content_update',
      summary: 'Initial course creation — added all modules and content blocks',
      changes: [
        { field: 'Course', oldValue: '(new)', newValue: 'Created with initial structure' },
      ],
      blockSnapshot: blocks.slice(0, 3),
    },
    {
      id: `ver-${courseId}-2`, courseId, version: 2, authorId: 'emp-3',
      date: '2025-07-14T14:30:00Z', changeType: 'structure_change',
      summary: 'Reorganised Module 2 — moved Communication Frameworks before Feedback section',
      changes: [
        { field: 'Module 2 — Block Order', oldValue: 'Feedback Role-Play > Communication Frameworks', newValue: 'Communication Frameworks > Feedback Role-Play' },
        { field: 'Module 2 — Block Count', oldValue: '2 blocks', newValue: '3 blocks (added Communication Toolkit PDF)' },
      ],
      blockSnapshot: blocks.slice(0, 5),
    },
    {
      id: `ver-${courseId}-3`, courseId, version: 3, authorId: 'emp-2',
      date: '2025-09-02T11:15:00Z', changeType: 'quiz_update',
      summary: 'Updated Module 1 quiz — replaced 2 questions and raised pass mark to 80%',
      changes: [
        { field: 'Quiz — Question 2', oldValue: 'What are the 4 leadership styles?', newValue: 'Name and describe the 4 situational leadership styles.' },
        { field: 'Quiz — Question 3', oldValue: 'True or False: Leaders are born, not made.', newValue: 'Explain the difference between transactional and transformational leadership.' },
        { field: 'Quiz — Pass Mark', oldValue: '70%', newValue: '80%' },
      ],
      blockSnapshot: blocks.slice(0, 6),
    },
    {
      id: `ver-${courseId}-4`, courseId, version: 4, authorId: 'emp-1',
      date: '2025-11-20T16:45:00Z', changeType: 'settings_change',
      summary: 'Changed format from classroom to blended; enabled self-paced completion',
      changes: [
        { field: 'Format', oldValue: 'classroom', newValue: 'blended' },
        { field: 'Self-Paced', oldValue: 'Disabled', newValue: 'Enabled' },
        { field: 'Estimated Duration', oldValue: '24 hours', newValue: '20 hours' },
      ],
      blockSnapshot: blocks.slice(0, 7),
    },
    {
      id: `ver-${courseId}-5`, courseId, version: 5, authorId: 'emp-6',
      date: '2026-01-10T10:00:00Z', changeType: 'content_update',
      summary: 'Added Module 3 — Delegation Best Practices video and team-building text block',
      changes: [
        { field: 'Module 3 — Block 1', oldValue: '(new)', newValue: 'Added "Delegation Best Practices" video (18 min)' },
        { field: 'Module 3 — Block 2', oldValue: '(new)', newValue: 'Added "Building High-Performance Teams" text block' },
        { field: 'Total Blocks', oldValue: '6', newValue: '8' },
      ],
      blockSnapshot: blocks,
    },
    {
      id: `ver-${courseId}-6`, courseId, version: 6, authorId: 'emp-2',
      date: '2026-02-28T13:20:00Z', changeType: 'quiz_update',
      summary: 'Added end-of-course assessment — 15 questions, timed 30 minutes',
      changes: [
        { field: 'Assessment', oldValue: '(none)', newValue: 'Final Assessment — 15 questions, 30 min time limit' },
        { field: 'Certificate Trigger', oldValue: 'Complete all modules', newValue: 'Complete all modules + pass final assessment (75%)' },
      ],
      blockSnapshot: blocks,
    },
  ]
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function VersionHistory({ courseId, courseTitle, courseBlocks, getEmployeeName, addToast }: VersionHistoryProps) {
  const [versions, setVersions] = useState<CourseVersion[]>(() => seedVersions(courseId, courseBlocks))
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [showDiff, setShowDiff] = useState(false)
  const [diffLeft, setDiffLeft] = useState<string>('')
  const [diffRight, setDiffRight] = useState<string>('')
  const [showRestore, setShowRestore] = useState<CourseVersion | null>(null)

  const sortedVersions = useMemo(() => [...versions].sort((a, b) => b.version - a.version), [versions])
  const latestVersion = sortedVersions[0]?.version || 0

  const diffLeftVersion = useMemo(() => versions.find(v => v.id === diffLeft), [versions, diffLeft])
  const diffRightVersion = useMemo(() => versions.find(v => v.id === diffRight), [versions, diffRight])

  /* ---- Restore ---- */
  const handleRestore = useCallback((version: CourseVersion) => {
    const newVersion: CourseVersion = {
      id: `ver-${courseId}-${latestVersion + 1}`,
      courseId,
      version: latestVersion + 1,
      authorId: 'emp-1', // current user placeholder
      date: new Date().toISOString(),
      changeType: version.changeType,
      summary: `Restored to version ${version.version} — "${version.summary}"`,
      changes: [
        { field: 'Restore', oldValue: `v${latestVersion}`, newValue: `Restored from v${version.version}` },
      ],
      blockSnapshot: version.blockSnapshot,
    }
    setVersions(prev => [...prev, newVersion])
    setShowRestore(null)
    addToast(`Restored to version ${version.version}`)
  }, [courseId, latestVersion, addToast])

  /* ---- Build diff data ---- */
  const diffData = useMemo(() => {
    if (!diffLeftVersion || !diffRightVersion) return null
    // Collect all unique fields across both versions' changes
    const allChanges: { field: string; left: string; right: string; status: 'added' | 'removed' | 'modified' | 'unchanged' }[] = []

    // Gather cumulative changes up to each version
    const leftChanges = versions.filter(v => v.version <= diffLeftVersion.version).flatMap(v => v.changes)
    const rightChanges = versions.filter(v => v.version <= diffRightVersion.version).flatMap(v => v.changes)

    // Changes that exist in right but not left
    const rightOnlyChanges = versions.filter(v => v.version > diffLeftVersion.version && v.version <= diffRightVersion.version)
    rightOnlyChanges.forEach(v => {
      v.changes.forEach(c => {
        allChanges.push({
          field: c.field,
          left: c.oldValue,
          right: c.newValue,
          status: c.oldValue === '(new)' || c.oldValue === '(none)' ? 'added' : 'modified',
        })
      })
    })

    // If comparing right < left, show removals
    if (diffRightVersion.version < diffLeftVersion.version) {
      const leftOnlyChanges = versions.filter(v => v.version > diffRightVersion.version && v.version <= diffLeftVersion.version)
      leftOnlyChanges.forEach(v => {
        v.changes.forEach(c => {
          allChanges.push({
            field: c.field,
            left: c.newValue,
            right: c.oldValue,
            status: 'removed',
          })
        })
      })
    }

    return allChanges
  }, [diffLeftVersion, diffRightVersion, versions])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-t1">Version History</h2>
          <p className="text-xs text-t3 mt-0.5">{courseTitle} — {versions.length} versions</p>
        </div>
        <Button size="sm" variant="secondary" onClick={() => setShowDiff(true)}>
          <GitBranch size={14} /> Compare Versions
        </Button>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-[19px] top-4 bottom-4 w-px bg-divider" />

        <div className="space-y-0">
          {sortedVersions.map((ver, idx) => {
            const meta = CHANGE_TYPE_META[ver.changeType]
            const Icon = meta.icon
            const isExpanded = expandedId === ver.id
            const isLatest = idx === 0

            return (
              <div key={ver.id} className="relative pl-12 pb-6">
                {/* Timeline dot */}
                <div className={cn(
                  'absolute left-2.5 top-1 w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center',
                  isLatest
                    ? 'bg-tempo-600 border-tempo-600'
                    : 'bg-card border-divider'
                )}>
                  {isLatest && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>

                <Card padding="none" className={cn('overflow-hidden', isLatest && 'border-tempo-200')}>
                  {/* Header row */}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : ver.id)}
                    className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-canvas/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-semibold text-t1 bg-canvas px-1.5 py-0.5 rounded">
                          v{ver.version}
                        </span>
                        <Badge variant={meta.variant}>
                          <Icon size={10} className="mr-1" />
                          {meta.label}
                        </Badge>
                        {isLatest && <Badge variant="orange">Current</Badge>}
                      </div>
                      <span className="text-sm text-t1 truncate">{ver.summary}</span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 ml-4">
                      <div className="text-right hidden sm:block">
                        <p className="text-xs text-t2">{getEmployeeName(ver.authorId)}</p>
                        <p className="text-[0.65rem] text-t3">{fmtRelative(ver.date)}</p>
                      </div>
                      {isExpanded ? <ChevronUp size={14} className="text-t3" /> : <ChevronDown size={14} className="text-t3" />}
                    </div>
                  </button>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-divider">
                      <div className="pt-3 space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-t3">{fmtDateTime(ver.date)}</p>
                          {!isLatest && (
                            <Button size="sm" variant="secondary" onClick={() => setShowRestore(ver)}>
                              <RotateCcw size={12} /> Restore this version
                            </Button>
                          )}
                        </div>

                        {/* Changes list */}
                        <div className="space-y-2">
                          <p className="text-xs font-medium text-t2">Changes</p>
                          {ver.changes.map((c, ci) => (
                            <div key={ci} className="flex items-start gap-2 text-xs bg-canvas rounded-md p-2.5">
                              <span className="font-medium text-t1 shrink-0 w-40">{c.field}</span>
                              <div className="flex items-center gap-2 min-w-0">
                                {c.oldValue !== '(new)' && c.oldValue !== '(none)' && (
                                  <>
                                    <span className="text-red-600 bg-red-50 px-1.5 py-0.5 rounded line-through truncate max-w-[200px]">{c.oldValue}</span>
                                    <ArrowRight size={12} className="text-t3 shrink-0" />
                                  </>
                                )}
                                <span className="text-green-600 bg-green-50 px-1.5 py-0.5 rounded truncate max-w-[200px]">{c.newValue}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </Card>
              </div>
            )
          })}
        </div>
      </div>

      {/* Diff comparison modal */}
      <Modal open={showDiff} onClose={() => setShowDiff(false)} title="Compare Versions" size="xl">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Version A (Before)"
              value={diffLeft}
              onChange={e => setDiffLeft(e.target.value)}
              options={[
                { value: '', label: 'Select version...' },
                ...sortedVersions.map(v => ({ value: v.id, label: `v${v.version} — ${v.summary.slice(0, 40)}` })),
              ]}
            />
            <Select
              label="Version B (After)"
              value={diffRight}
              onChange={e => setDiffRight(e.target.value)}
              options={[
                { value: '', label: 'Select version...' },
                ...sortedVersions.map(v => ({ value: v.id, label: `v${v.version} — ${v.summary.slice(0, 40)}` })),
              ]}
            />
          </div>

          {diffLeftVersion && diffRightVersion && diffData && (
            <div className="space-y-4">
              {/* Summary header */}
              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-canvas">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono font-semibold text-t1 bg-white px-1.5 py-0.5 rounded border border-divider">v{diffLeftVersion.version}</span>
                    <Badge variant={CHANGE_TYPE_META[diffLeftVersion.changeType].variant}>{CHANGE_TYPE_META[diffLeftVersion.changeType].label}</Badge>
                  </div>
                  <p className="text-xs text-t2">{diffLeftVersion.summary}</p>
                  <p className="text-[0.65rem] text-t3 mt-1">{getEmployeeName(diffLeftVersion.authorId)} — {fmtDateTime(diffLeftVersion.date)}</p>
                </Card>
                <Card className="bg-canvas">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono font-semibold text-t1 bg-white px-1.5 py-0.5 rounded border border-divider">v{diffRightVersion.version}</span>
                    <Badge variant={CHANGE_TYPE_META[diffRightVersion.changeType].variant}>{CHANGE_TYPE_META[diffRightVersion.changeType].label}</Badge>
                  </div>
                  <p className="text-xs text-t2">{diffRightVersion.summary}</p>
                  <p className="text-[0.65rem] text-t3 mt-1">{getEmployeeName(diffRightVersion.authorId)} — {fmtDateTime(diffRightVersion.date)}</p>
                </Card>
              </div>

              {/* Diff lines */}
              <Card padding="none">
                <div className="px-4 py-2.5 border-b border-divider bg-canvas">
                  <p className="text-xs font-medium text-t1">
                    {diffData.length} change{diffData.length !== 1 ? 's' : ''} between v{diffLeftVersion.version} and v{diffRightVersion.version}
                  </p>
                </div>
                <div className="divide-y divide-divider">
                  {diffData.map((d, i) => (
                    <div key={i} className="px-4 py-2.5 flex items-start gap-3">
                      {/* Status icon */}
                      <div className={cn(
                        'w-5 h-5 rounded flex items-center justify-center shrink-0 mt-0.5',
                        d.status === 'added' ? 'bg-green-100 text-green-600'
                          : d.status === 'removed' ? 'bg-red-100 text-red-600'
                          : 'bg-amber-100 text-amber-600'
                      )}>
                        {d.status === 'added' ? <Plus size={12} /> : d.status === 'removed' ? <Minus size={12} /> : <Pencil size={12} />}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-t1">{d.field}</p>
                        <div className="mt-1 space-y-1">
                          {d.status !== 'added' && (
                            <div className="flex items-center gap-1.5">
                              <Minus size={10} className="text-red-500 shrink-0" />
                              <span className="text-xs text-red-600 bg-red-50 px-1.5 py-0.5 rounded">{d.left}</span>
                            </div>
                          )}
                          {d.status !== 'removed' && (
                            <div className="flex items-center gap-1.5">
                              <Plus size={10} className="text-green-500 shrink-0" />
                              <span className="text-xs text-green-600 bg-green-50 px-1.5 py-0.5 rounded">{d.right}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {diffData.length === 0 && (
                    <div className="px-4 py-6 text-center text-xs text-t3">
                      No differences found between these versions.
                    </div>
                  )}
                </div>
              </Card>
            </div>
          )}

          {(!diffLeft || !diffRight) && (
            <div className="text-center py-8">
              <GitBranch size={32} className="mx-auto text-t3 mb-3" />
              <p className="text-sm text-t3">Select two versions to compare their changes.</p>
            </div>
          )}
        </div>
      </Modal>

      {/* Restore confirmation modal */}
      <Modal open={!!showRestore} onClose={() => setShowRestore(null)} title="Restore Version" size="sm">
        {showRestore && (
          <div className="space-y-4">
            <p className="text-sm text-t2">
              This will create a new version (v{latestVersion + 1}) based on version {showRestore.version}. The current content will not be deleted.
            </p>
            <Card className="bg-canvas">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono font-semibold text-t1">v{showRestore.version}</span>
                <Badge variant={CHANGE_TYPE_META[showRestore.changeType].variant}>
                  {CHANGE_TYPE_META[showRestore.changeType].label}
                </Badge>
              </div>
              <p className="text-xs text-t2">{showRestore.summary}</p>
              <p className="text-[0.65rem] text-t3 mt-1">{fmtDateTime(showRestore.date)}</p>
            </Card>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={() => setShowRestore(null)}>Cancel</Button>
              <Button size="sm" onClick={() => handleRestore(showRestore)}>
                <RotateCcw size={12} /> Restore
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
