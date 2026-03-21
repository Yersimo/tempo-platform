'use client'

import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { Header } from '@/components/layout/header'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input, Select } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { Avatar } from '@/components/ui/avatar'
import { PageSkeleton } from '@/components/ui/page-skeleton'
import { useTempo } from '@/lib/store'
import {
  Search, ZoomIn, ZoomOut, Maximize2, ChevronDown, ChevronRight,
  Users, Building2, GitBranch, X, ArrowUp, Filter, Eye,
} from 'lucide-react'

// ============================================================
// TYPES
// ============================================================

interface OrgEmployee {
  id: string
  fullName: string
  email: string
  avatarUrl: string | null
  jobTitle: string | null
  level: string | null
  country: string | null
  role: string
  departmentId: string | null
  managerId: string | null
  isActive: boolean
}

interface OrgDepartment {
  id: string
  name: string
  headId: string | null
  parentId: string | null
}

interface TreeNode {
  employee: OrgEmployee
  children: TreeNode[]
  directReportCount: number
  totalReportCount: number
}

// ============================================================
// CONSTANTS
// ============================================================

const DEPT_COLORS: Record<string, string> = {
  'Retail Banking': '#3b82f6',
  'Corporate Banking': '#6366f1',
  'Operations': '#22c55e',
  'Technology': '#a855f7',
  'Human Resources': '#ec4899',
  'Risk & Compliance': '#ef4444',
  'Finance': '#f59e0b',
  'Marketing': '#06b6d4',
  'Sales': '#10b981',
  'Legal': '#f43f5e',
  'Engineering': '#8b5cf6',
  'Product': '#0ea5e9',
  'Design': '#d946ef',
  'Customer Success': '#14b8a6',
  'Data': '#f97316',
}

const DEPT_BG: Record<string, string> = {
  'Retail Banking': 'bg-blue-50 border-blue-200',
  'Corporate Banking': 'bg-indigo-50 border-indigo-200',
  'Operations': 'bg-green-50 border-green-200',
  'Technology': 'bg-purple-50 border-purple-200',
  'Human Resources': 'bg-pink-50 border-pink-200',
  'Risk & Compliance': 'bg-red-50 border-red-200',
  'Finance': 'bg-amber-50 border-amber-200',
  'Marketing': 'bg-cyan-50 border-cyan-200',
  'Sales': 'bg-emerald-50 border-emerald-200',
  'Legal': 'bg-rose-50 border-rose-200',
  'Engineering': 'bg-violet-50 border-violet-200',
  'Product': 'bg-sky-50 border-sky-200',
  'Design': 'bg-fuchsia-50 border-fuchsia-200',
  'Customer Success': 'bg-teal-50 border-teal-200',
  'Data': 'bg-orange-50 border-orange-200',
}

const DEFAULT_BG = 'bg-gray-50 border-gray-200'

type ViewMode = 'full' | 'department' | 'reporting-line' | 'span-of-control'

// ============================================================
// HELPER: Build tree from flat list
// ============================================================

function buildTree(employees: OrgEmployee[]): TreeNode[] {
  const map = new Map<string, TreeNode>()
  const roots: TreeNode[] = []

  // Create tree nodes
  for (const emp of employees) {
    if (!emp.isActive) continue
    map.set(emp.id, { employee: emp, children: [], directReportCount: 0, totalReportCount: 0 })
  }

  // Link children to parents
  for (const node of map.values()) {
    const parentId = node.employee.managerId
    if (parentId && map.has(parentId)) {
      map.get(parentId)!.children.push(node)
    } else {
      roots.push(node)
    }
  }

  // Calculate report counts
  function countReports(node: TreeNode): number {
    node.directReportCount = node.children.length
    node.totalReportCount = node.children.reduce(
      (sum, child) => sum + 1 + countReports(child),
      0
    )
    return node.totalReportCount
  }

  for (const root of roots) {
    countReports(root)
  }

  // Sort children by level priority, then name
  const LEVEL_ORDER: Record<string, number> = {
    Executive: 1, Director: 2, 'Senior Manager': 3, Manager: 4,
    Senior: 5, Mid: 6, Associate: 7, Junior: 8,
  }
  function sortTree(nodes: TreeNode[]) {
    nodes.sort((a, b) => {
      const la = LEVEL_ORDER[a.employee.level || ''] || 99
      const lb = LEVEL_ORDER[b.employee.level || ''] || 99
      if (la !== lb) return la - lb
      return (a.employee.fullName || '').localeCompare(b.employee.fullName || '')
    })
    for (const n of nodes) sortTree(n.children)
  }
  sortTree(roots)

  return roots
}

function getReportingChain(employeeId: string, employees: OrgEmployee[]): string[] {
  const chain: string[] = [employeeId]
  const empMap = new Map(employees.map(e => [e.id, e]))
  let current = empMap.get(employeeId)
  while (current?.managerId) {
    chain.unshift(current.managerId)
    current = empMap.get(current.managerId)
    if (chain.length > 20) break // safety
  }
  return chain
}

// ============================================================
// SPAN-OF-CONTROL COLORS
// ============================================================

function getSpanColor(directReports: number): string {
  if (directReports === 0) return 'border-gray-200 bg-gray-50'
  if (directReports <= 3) return 'border-green-300 bg-green-50'
  if (directReports <= 6) return 'border-blue-300 bg-blue-50'
  if (directReports <= 10) return 'border-amber-300 bg-amber-50'
  return 'border-red-300 bg-red-50'
}

// ============================================================
// ORG NODE COMPONENT
// ============================================================

function OrgNode({
  node,
  depth,
  deptMap,
  expandedNodes,
  toggleExpand,
  onNodeClick,
  selectedId,
  highlightedIds,
  viewMode,
  maxDepth,
}: {
  node: TreeNode
  depth: number
  deptMap: Map<string, OrgDepartment>
  expandedNodes: Set<string>
  toggleExpand: (id: string) => void
  onNodeClick: (emp: OrgEmployee) => void
  selectedId: string | null
  highlightedIds: Set<string>
  viewMode: ViewMode
  maxDepth: number
}) {
  const emp = node.employee
  const isExpanded = expandedNodes.has(emp.id)
  const hasChildren = node.children.length > 0
  const deptName = emp.departmentId ? deptMap.get(emp.departmentId)?.name || '' : ''
  const isSelected = selectedId === emp.id
  const isHighlighted = highlightedIds.size === 0 || highlightedIds.has(emp.id)
  const deptBg = viewMode === 'span-of-control'
    ? getSpanColor(node.directReportCount)
    : DEPT_BG[deptName] || DEFAULT_BG

  // Virtualization: don't render beyond maxDepth
  if (depth > maxDepth) return null

  return (
    <div className="flex flex-col items-center">
      {/* Node card */}
      <div
        className={`
          relative flex flex-col items-center gap-1 px-4 py-3 rounded-xl border-2 cursor-pointer
          transition-all duration-200 min-w-[160px] max-w-[200px]
          ${deptBg}
          ${isSelected ? 'ring-2 ring-tempo-500 shadow-lg scale-105' : 'hover:shadow-md hover:scale-[1.02]'}
          ${!isHighlighted ? 'opacity-30' : ''}
        `}
        onClick={() => onNodeClick(emp)}
      >
        <Avatar src={emp.avatarUrl} name={emp.fullName} size="sm" />
        <div className="text-center">
          <p className="text-xs font-semibold text-t1 truncate max-w-[170px]">{emp.fullName}</p>
          <p className="text-[0.6rem] text-t3 truncate max-w-[170px]">{emp.jobTitle || 'No title'}</p>
          {deptName && (
            <p className="text-[0.55rem] font-medium mt-0.5 truncate max-w-[170px]" style={{ color: DEPT_COLORS[deptName] || '#6b7280' }}>
              {deptName}
            </p>
          )}
        </div>
        {viewMode === 'span-of-control' && node.directReportCount > 0 && (
          <span className="text-[0.55rem] font-semibold text-t2">{node.directReportCount} direct</span>
        )}
        {hasChildren && (
          <button
            onClick={(e) => { e.stopPropagation(); toggleExpand(emp.id) }}
            className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-white border border-gray-300 flex items-center justify-center shadow-sm hover:bg-gray-50 transition-colors z-10"
          >
            {isExpanded
              ? <ChevronDown size={12} className="text-gray-600" />
              : <ChevronRight size={12} className="text-gray-600" />
            }
          </button>
        )}
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div className="flex flex-col items-center mt-6">
          {/* Vertical connector from parent */}
          <div className="w-px h-4 bg-gray-300" />

          {node.children.length === 1 ? (
            <OrgNode
              node={node.children[0]}
              depth={depth + 1}
              deptMap={deptMap}
              expandedNodes={expandedNodes}
              toggleExpand={toggleExpand}
              onNodeClick={onNodeClick}
              selectedId={selectedId}
              highlightedIds={highlightedIds}
              viewMode={viewMode}
              maxDepth={maxDepth}
            />
          ) : (
            <div className="relative flex gap-6">
              {/* Horizontal connector line spanning siblings */}
              <div
                className="absolute top-0 h-px bg-gray-300"
                style={{
                  left: '80px',
                  right: '80px',
                }}
              />
              {node.children.map((child) => (
                <div key={child.employee.id} className="flex flex-col items-center">
                  {/* Vertical connector to horizontal line */}
                  <div className="w-px h-4 bg-gray-300" />
                  <OrgNode
                    node={child}
                    depth={depth + 1}
                    deptMap={deptMap}
                    expandedNodes={expandedNodes}
                    toggleExpand={toggleExpand}
                    onNodeClick={onNodeClick}
                    selectedId={selectedId}
                    highlightedIds={highlightedIds}
                    viewMode={viewMode}
                    maxDepth={maxDepth}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ============================================================
// EMPLOYEE DETAIL SIDEBAR
// ============================================================

function EmployeeDetailSidebar({
  employee,
  employees,
  deptMap,
  onClose,
}: {
  employee: OrgEmployee
  employees: OrgEmployee[]
  deptMap: Map<string, OrgDepartment>
  onClose: () => void
}) {
  const deptName = employee.departmentId ? deptMap.get(employee.departmentId)?.name || 'Unknown' : 'No department'
  const directReports = employees.filter(e => e.managerId === employee.id && e.isActive)
  const chain = getReportingChain(employee.id, employees)
  const empMap = new Map(employees.map(e => [e.id, e]))

  return (
    <div className="fixed right-0 top-0 bottom-0 w-[380px] max-w-full bg-card border-l border-border shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
      <div className="flex items-center justify-between px-6 py-4 border-b border-divider">
        <h3 className="text-sm font-semibold text-t1">Employee Details</h3>
        <button onClick={onClose} className="text-t3 hover:text-t1 p-1 rounded-lg hover:bg-canvas transition-colors">
          <X size={16} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Avatar src={employee.avatarUrl} name={employee.fullName} size="lg" />
          <div>
            <h4 className="text-sm font-semibold text-t1">{employee.fullName}</h4>
            <p className="text-xs text-t3">{employee.jobTitle || 'No title'}</p>
            <p className="text-xs text-t3">{employee.email}</p>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <p className="text-[0.65rem] text-t3 uppercase tracking-wide font-medium">Department</p>
            <p className="text-xs text-t1">{deptName}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[0.65rem] text-t3 uppercase tracking-wide font-medium">Level</p>
            <p className="text-xs text-t1">{employee.level || 'N/A'}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[0.65rem] text-t3 uppercase tracking-wide font-medium">Country</p>
            <p className="text-xs text-t1">{employee.country || 'N/A'}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[0.65rem] text-t3 uppercase tracking-wide font-medium">Role</p>
            <Badge variant={employee.role === 'owner' || employee.role === 'admin' ? 'orange' : 'default'}>
              {employee.role}
            </Badge>
          </div>
        </div>

        {/* Direct Reports */}
        <div className="space-y-2">
          <h5 className="text-xs font-semibold text-t1 flex items-center gap-1.5">
            <Users size={14} />
            Direct Reports ({directReports.length})
          </h5>
          {directReports.length === 0 ? (
            <p className="text-xs text-t3">No direct reports (individual contributor)</p>
          ) : (
            <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
              {directReports.map(r => (
                <div key={r.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-canvas transition-colors">
                  <Avatar src={r.avatarUrl} name={r.fullName} size="xs" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-t1 truncate">{r.fullName}</p>
                    <p className="text-[0.6rem] text-t3 truncate">{r.jobTitle}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Reporting Chain */}
        <div className="space-y-2">
          <h5 className="text-xs font-semibold text-t1 flex items-center gap-1.5">
            <ArrowUp size={14} />
            Reporting Chain
          </h5>
          <div className="space-y-1">
            {chain.map((id, idx) => {
              const e = empMap.get(id)
              if (!e) return null
              const isSelf = id === employee.id
              return (
                <div key={id} className="flex items-center gap-2" style={{ paddingLeft: `${idx * 12}px` }}>
                  {idx > 0 && <span className="text-gray-300 text-xs">&#8627;</span>}
                  <Avatar src={e.avatarUrl} name={e.fullName} size="xs" />
                  <span className={`text-xs ${isSelf ? 'font-semibold text-tempo-600' : 'text-t1'}`}>
                    {e.fullName}
                  </span>
                  <span className="text-[0.6rem] text-t3">{e.jobTitle}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// MAIN PAGE
// ============================================================

export default function OrgChartPage() {
  const { employees: storeEmployees, departments: storeDepts, ensureModulesLoaded } = useTempo()
  const [pageLoading, setPageLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('full')
  const [deptFilter, setDeptFilter] = useState('all')
  const [selectedEmployee, setSelectedEmployee] = useState<OrgEmployee | null>(null)
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())
  const [zoom, setZoom] = useState(1)
  const [maxDepth, setMaxDepth] = useState(10)
  const containerRef = useRef<HTMLDivElement>(null)

  // Load data
  useEffect(() => {
    ensureModulesLoaded?.(['employees', 'departments'])
      ?.then?.(() => setPageLoading(false))
      ?.catch?.(() => setPageLoading(false))
    const t = setTimeout(() => setPageLoading(false), 2000)
    return () => clearTimeout(t)
  }, [ensureModulesLoaded])

  // Map employees to our OrgEmployee shape
  const employees: OrgEmployee[] = useMemo(() =>
    (storeEmployees || []).map((e: any) => ({
      id: e.id,
      fullName: e.full_name || e.fullName || e.profile?.full_name || 'Unknown',
      email: e.email || e.profile?.email || '',
      avatarUrl: e.avatar_url || e.avatarUrl || e.profile?.avatar_url || null,
      jobTitle: e.job_title || e.jobTitle || null,
      level: e.level || null,
      country: e.country || null,
      role: e.role || 'employee',
      departmentId: e.department_id || e.departmentId || null,
      managerId: e.manager_id || e.managerId || null,
      isActive: e.is_active !== false && e.isActive !== false,
    }))
  , [storeEmployees])

  const deptMap = useMemo(() => {
    const m = new Map<string, OrgDepartment>()
    for (const d of (storeDepts || []) as any[]) {
      m.set(d.id, {
        id: d.id,
        name: d.name,
        headId: d.head_id || d.headId || null,
        parentId: d.parent_id || d.parentId || null,
      })
    }
    return m
  }, [storeDepts])

  const deptOptions = useMemo(() => [
    { value: 'all', label: 'All Departments' },
    ...Array.from(deptMap.values()).map(d => ({ value: d.id, label: d.name })),
  ], [deptMap])

  // Build tree
  const tree = useMemo(() => {
    let emps = employees.filter(e => e.isActive)
    if (deptFilter !== 'all') {
      emps = emps.filter(e => e.departmentId === deptFilter)
    }
    return buildTree(emps)
  }, [employees, deptFilter])

  // Auto-expand first 2 levels
  useEffect(() => {
    const initial = new Set<string>()
    function addLevels(nodes: TreeNode[], depth: number) {
      if (depth >= 2) return
      for (const n of nodes) {
        initial.add(n.employee.id)
        addLevels(n.children, depth + 1)
      }
    }
    addLevels(tree, 0)
    setExpandedNodes(initial)
  }, [tree])

  // Search highlighting
  const highlightedIds = useMemo(() => {
    if (!search.trim()) return new Set<string>()
    const lower = search.toLowerCase()
    const matched = new Set<string>()
    for (const emp of employees) {
      if (
        emp.fullName.toLowerCase().includes(lower) ||
        (emp.jobTitle?.toLowerCase().includes(lower)) ||
        (emp.email?.toLowerCase().includes(lower))
      ) {
        matched.add(emp.id)
        // Also highlight their reporting chain
        const chain = getReportingChain(emp.id, employees)
        for (const id of chain) matched.add(id)
      }
    }
    return matched
  }, [search, employees])

  // When searching, expand nodes that contain highlighted employees
  useEffect(() => {
    if (highlightedIds.size === 0) return
    const newExpanded = new Set(expandedNodes)
    for (const id of highlightedIds) {
      const chain = getReportingChain(id, employees)
      for (const cid of chain) newExpanded.add(cid)
    }
    setExpandedNodes(newExpanded)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [highlightedIds])

  // Reporting line mode
  const [reportingLineTarget, setReportingLineTarget] = useState<string | null>(null)
  const reportingLineIds = useMemo(() => {
    if (viewMode !== 'reporting-line' || !reportingLineTarget) return new Set<string>()
    return new Set(getReportingChain(reportingLineTarget, employees))
  }, [viewMode, reportingLineTarget, employees])

  const toggleExpand = useCallback((id: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const expandAll = useCallback(() => {
    const all = new Set<string>()
    for (const emp of employees) all.add(emp.id)
    setExpandedNodes(all)
  }, [employees])

  const collapseAll = useCallback(() => {
    // Keep only root level
    const roots = new Set<string>()
    for (const n of tree) roots.add(n.employee.id)
    setExpandedNodes(roots)
  }, [tree])

  const fitToScreen = useCallback(() => {
    setZoom(1)
    if (containerRef.current) {
      containerRef.current.scrollTo({ left: 0, top: 0, behavior: 'smooth' })
    }
  }, [])

  const effectiveHighlightedIds = useMemo(() => {
    if (viewMode === 'reporting-line' && reportingLineIds.size > 0) return reportingLineIds
    return highlightedIds
  }, [viewMode, reportingLineIds, highlightedIds])

  // Employee select options for reporting line
  const employeeOptions = useMemo(() =>
    employees
      .filter(e => e.isActive)
      .sort((a, b) => a.fullName.localeCompare(b.fullName))
      .map(e => ({ value: e.id, label: `${e.fullName} - ${e.jobTitle || 'No title'}` }))
  , [employees])

  if (pageLoading) return <PageSkeleton />

  const totalActive = employees.filter(e => e.isActive).length
  const totalManagers = employees.filter(e => e.isActive && employees.some(r => r.managerId === e.id && r.isActive)).length

  return (
    <>
      <Header
        title="Org Chart"
        subtitle={`${totalActive} employees across ${deptMap.size} departments`}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={expandAll}>Expand All</Button>
            <Button variant="ghost" size="sm" onClick={collapseAll}>Collapse All</Button>
          </div>
        }
      />

      <div className="space-y-4 mt-4">
        {/* Controls */}
        <Card padding="sm" className="p-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="Search employees..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                icon={<Search size={16} />}
              />
            </div>
            <div className="w-[200px]">
              <Select
                options={[
                  { value: 'full', label: 'Full Org Tree' },
                  { value: 'department', label: 'By Department' },
                  { value: 'reporting-line', label: 'Reporting Line' },
                  { value: 'span-of-control', label: 'Span of Control' },
                ]}
                value={viewMode}
                onChange={(e) => {
                  setViewMode(e.target.value as ViewMode)
                  if (e.target.value !== 'reporting-line') setReportingLineTarget(null)
                }}
                placeholder="View mode"
              />
            </div>
            {viewMode === 'department' && (
              <div className="w-[200px]">
                <Select
                  options={deptOptions}
                  value={deptFilter}
                  onChange={(e) => setDeptFilter(e.target.value)}
                  placeholder="Filter department"
                />
              </div>
            )}
            {viewMode === 'reporting-line' && (
              <div className="w-[280px]">
                <Select
                  options={employeeOptions}
                  value={reportingLineTarget || ''}
                  onChange={(e) => setReportingLineTarget(e.target.value)}
                  placeholder="Select employee..."
                />
              </div>
            )}
            <div className="flex items-center gap-1 border border-border rounded-lg p-1">
              <button
                onClick={() => setZoom(z => Math.max(0.3, z - 0.1))}
                className="p-1.5 rounded hover:bg-canvas transition-colors text-t3 hover:text-t1"
                title="Zoom out"
              >
                <ZoomOut size={16} />
              </button>
              <span className="text-xs text-t2 px-1 min-w-[40px] text-center">{Math.round(zoom * 100)}%</span>
              <button
                onClick={() => setZoom(z => Math.min(2, z + 0.1))}
                className="p-1.5 rounded hover:bg-canvas transition-colors text-t3 hover:text-t1"
                title="Zoom in"
              >
                <ZoomIn size={16} />
              </button>
              <button
                onClick={fitToScreen}
                className="p-1.5 rounded hover:bg-canvas transition-colors text-t3 hover:text-t1"
                title="Fit to screen"
              >
                <Maximize2 size={16} />
              </button>
            </div>
          </div>
        </Card>

        {/* Stats bar */}
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-canvas border border-border">
            <Users size={14} className="text-t3" />
            <span className="text-xs text-t2">{totalActive} employees</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-canvas border border-border">
            <Building2 size={14} className="text-t3" />
            <span className="text-xs text-t2">{deptMap.size} departments</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-canvas border border-border">
            <GitBranch size={14} className="text-t3" />
            <span className="text-xs text-t2">{totalManagers} managers</span>
          </div>
          {viewMode === 'span-of-control' && (
            <div className="flex items-center gap-4 ml-auto">
              <span className="flex items-center gap-1 text-[0.65rem] text-t3"><span className="w-3 h-3 rounded border-2 border-green-300 bg-green-50" /> 1-3</span>
              <span className="flex items-center gap-1 text-[0.65rem] text-t3"><span className="w-3 h-3 rounded border-2 border-blue-300 bg-blue-50" /> 4-6</span>
              <span className="flex items-center gap-1 text-[0.65rem] text-t3"><span className="w-3 h-3 rounded border-2 border-amber-300 bg-amber-50" /> 7-10</span>
              <span className="flex items-center gap-1 text-[0.65rem] text-t3"><span className="w-3 h-3 rounded border-2 border-red-300 bg-red-50" /> 10+</span>
            </div>
          )}
        </div>

        {/* Org Tree */}
        <Card padding="none" className="overflow-hidden">
          <div
            ref={containerRef}
            className="overflow-auto p-8"
            style={{ maxHeight: 'calc(100vh - 320px)' }}
          >
            {tree.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Users size={40} className="text-gray-300 mb-3" />
                <p className="text-sm text-t2 font-medium">No org chart data</p>
                <p className="text-xs text-t3 mt-1">
                  {deptFilter !== 'all'
                    ? 'No employees found in this department. Try a different filter.'
                    : 'Add employees with manager relationships to build the org chart.'}
                </p>
              </div>
            ) : (
              <div
                className="inline-flex flex-col items-center gap-6 transition-transform duration-200 origin-top-left"
                style={{ transform: `scale(${zoom})` }}
              >
                {tree.map(root => (
                  <OrgNode
                    key={root.employee.id}
                    node={root}
                    depth={0}
                    deptMap={deptMap}
                    expandedNodes={expandedNodes}
                    toggleExpand={toggleExpand}
                    onNodeClick={(emp) => setSelectedEmployee(emp)}
                    selectedId={selectedEmployee?.id || null}
                    highlightedIds={effectiveHighlightedIds}
                    viewMode={viewMode}
                    maxDepth={maxDepth}
                  />
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Detail Sidebar */}
      {selectedEmployee && (
        <>
          <div
            className="fixed inset-0 bg-black/20 z-40"
            onClick={() => setSelectedEmployee(null)}
          />
          <EmployeeDetailSidebar
            employee={selectedEmployee}
            employees={employees}
            deptMap={deptMap}
            onClose={() => setSelectedEmployee(null)}
          />
        </>
      )}
    </>
  )
}
