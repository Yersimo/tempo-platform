// @ts-nocheck
'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { Header } from '@/components/layout/header'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { StatCard } from '@/components/ui/stat-card'
import { Modal } from '@/components/ui/modal'
import { Input, Select, Textarea } from '@/components/ui/input'
import { PageSkeleton } from '@/components/ui/page-skeleton'
import {
  GitBranch, Plus, X, Users, DollarSign, Building2, ArrowRightLeft,
  Search, RefreshCw, ChevronDown, ChevronRight, Layers,
  UserPlus, UserMinus, ArrowRight, Merge, TrendingUp,
  BarChart3, Eye, Copy, Check, AlertTriangle, Trash2,
} from 'lucide-react'
import { useTempo, useOrgCurrency } from '@/lib/store'
import { formatCurrency } from '@/lib/utils/format-currency'

// ---- Types ----

type Scenario = {
  id: string
  orgId: string
  name: string
  description: string | null
  baselineDate: string
  status: string
  createdBy: string
  createdAt: string
  updatedAt: string
}

type Change = {
  id: string
  scenarioId: string
  changeType: string
  targetType: string
  targetId: string | null
  changeData: string
  costImpact: number
  headcountImpact: number
  notes: string | null
  createdAt: string
}

type ScenarioImpact = {
  scenarioId: string
  scenarioName: string
  currentHeadcount: number
  projectedHeadcount: number
  headcountDelta: number
  costDelta: number
  currentDeptCount: number
  projectedDeptCount: number
  affectedEmployees: number
  totalChanges: number
  changeBreakdown: Record<string, number>
}

type OrgTreeNode = {
  id: string
  name: string
  title: string | null
  level: string | null
  departmentId: string | null
  managerId: string | null
  isNew?: boolean
  isRemoved?: boolean
  isModified?: boolean
  children?: OrgTreeNode[]
}

// ---- Constants ----

const CHANGE_TYPES = [
  { value: 'add_role', label: 'Add New Role', icon: <UserPlus size={14} /> },
  { value: 'remove_role', label: 'Remove Role', icon: <UserMinus size={14} /> },
  { value: 'move_employee', label: 'Move Employee', icon: <ArrowRightLeft size={14} /> },
  { value: 'create_department', label: 'Create Department', icon: <Building2 size={14} /> },
  { value: 'merge_departments', label: 'Merge Departments', icon: <Merge size={14} /> },
  { value: 'change_reporting', label: 'Change Reporting Line', icon: <GitBranch size={14} /> },
  { value: 'change_comp', label: 'Change Compensation', icon: <DollarSign size={14} /> },
  { value: 'promote', label: 'Promote', icon: <TrendingUp size={14} /> },
]

const SCENARIO_STATUSES = [
  { value: 'draft', label: 'Draft' },
  { value: 'modeling', label: 'Modeling' },
  { value: 'proposed', label: 'Proposed' },
  { value: 'approved', label: 'Approved' },
  { value: 'implemented', label: 'Implemented' },
]

function statusBadge(status: string) {
  const colors: Record<string, 'warning' | 'info' | 'success' | 'default' | 'error'> = {
    draft: 'default', modeling: 'info', proposed: 'warning', approved: 'success', implemented: 'success',
  }
  return <Badge variant={colors[status] || 'default'}>{status}</Badge>
}

function changeIcon(changeType: string) {
  const ct = CHANGE_TYPES.find(c => c.value === changeType)
  return ct?.icon || <GitBranch size={14} />
}

// ---- API helpers ----

async function apiGet(action: string, params: Record<string, string> = {}) {
  const qs = new URLSearchParams({ action, ...params }).toString()
  const res = await fetch(`/api/org-design?${qs}`)
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'API error')
  return json.data
}

async function apiPost(body: Record<string, unknown>) {
  const res = await fetch('/api/org-design', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'API error')
  return json.data
}

// ---- Org Tree Component ----

function OrgTreeNodeCard({ node, depth = 0, expanded, onToggle }: {
  node: OrgTreeNode
  depth?: number
  expanded: Set<string>
  onToggle: (id: string) => void
}) {
  const hasChildren = node.children && node.children.length > 0
  const isExpanded = expanded.has(node.id)

  let borderColor = 'border-zinc-200 dark:border-zinc-700'
  let bgColor = ''
  if (node.isNew) { borderColor = 'border-green-400'; bgColor = 'bg-green-50 dark:bg-green-900/10' }
  if (node.isRemoved) { borderColor = 'border-red-400'; bgColor = 'bg-red-50 dark:bg-red-900/10 opacity-60 line-through' }
  if (node.isModified) { borderColor = 'border-amber-400'; bgColor = 'bg-amber-50 dark:bg-amber-900/10' }

  return (
    <div className={depth > 0 ? 'ml-6 border-l border-zinc-200 dark:border-zinc-700 pl-4' : ''}>
      <div className={`flex items-center gap-2 p-2 rounded-lg border ${borderColor} ${bgColor} mb-1`}>
        {hasChildren ? (
          <button onClick={() => onToggle(node.id)} className="text-zinc-400 hover:text-zinc-600">
            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
        ) : (
          <span className="w-[14px]" />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm truncate">{node.name}</span>
            {node.isNew && <Badge variant="success" className="text-xs">New</Badge>}
            {node.isRemoved && <Badge variant="error" className="text-xs">Removed</Badge>}
            {node.isModified && <Badge variant="warning" className="text-xs">Modified</Badge>}
          </div>
          <div className="text-xs text-zinc-500 truncate">{node.title || 'No title'}{node.level ? ` (${node.level})` : ''}</div>
        </div>
        {hasChildren && (
          <span className="text-xs text-zinc-400">{node.children!.length} reports</span>
        )}
      </div>
      {isExpanded && hasChildren && (
        <div>
          {node.children!.map(child => (
            <OrgTreeNodeCard key={child.id} node={child} depth={depth + 1} expanded={expanded} onToggle={onToggle} />
          ))}
        </div>
      )}
    </div>
  )
}

// ---- Main Page ----

export default function OrgDesignPage() {
  const defaultCurrency = useOrgCurrency()
  const { addToast } = useTempo()

  const [pageLoading, setPageLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'scenarios' | 'modeling' | 'compare' | 'impact'>('scenarios')

  // Data
  const [scenarios, setScenarios] = useState<Scenario[]>([])
  const [selectedScenarioId, setSelectedScenarioId] = useState('')
  const [changes, setChanges] = useState<Change[]>([])
  const [impact, setImpact] = useState<ScenarioImpact | null>(null)
  const [orgTree, setOrgTree] = useState<OrgTreeNode[]>([])
  const [compareResults, setCompareResults] = useState<ScenarioImpact[]>([])
  const [treeExpanded, setTreeExpanded] = useState<Set<string>>(new Set())

  // Modals
  const [showScenarioModal, setShowScenarioModal] = useState(false)
  const [showChangeModal, setShowChangeModal] = useState(false)
  const [showCompareModal, setShowCompareModal] = useState(false)
  const [saving, setSaving] = useState(false)

  // Forms
  const [scenarioForm, setScenarioForm] = useState({ name: '', description: '', baselineDate: new Date().toISOString().split('T')[0] })
  const [changeForm, setChangeForm] = useState({
    changeType: 'add_role', targetType: 'employee', targetId: '',
    name: '', jobTitle: '', level: '', departmentId: '', managerId: '',
    newDepartmentId: '', newManagerId: '', newTitle: '', newLevel: '',
    costImpact: '', headcountImpact: '', notes: '',
  })
  const [compareIds, setCompareIds] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')

  // Load data
  useEffect(() => {
    loadScenarios()
    const t = setTimeout(() => setPageLoading(false), 1500)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (selectedScenarioId) {
      loadScenarioData(selectedScenarioId)
    }
  }, [selectedScenarioId])

  async function loadScenarios() {
    try {
      const s = await apiGet('list-scenarios')
      setScenarios(s || [])
    } catch { /* demo fallback */ }
  }

  async function loadScenarioData(scenarioId: string) {
    try {
      const [ch, imp] = await Promise.all([
        apiGet('list-changes', { scenarioId }),
        apiGet('calculate-impact', { scenarioId }),
      ])
      setChanges(ch || [])
      setImpact(imp || null)

      // Load org tree
      try {
        const tree = await apiGet('org-tree', { scenarioId })
        if (tree?.employees) {
          const built = buildTree(tree.employees)
          setOrgTree(built)
        }
      } catch { /* tree optional */ }
    } catch { /* demo fallback */ }
  }

  function buildTree(employees: OrgTreeNode[]): OrgTreeNode[] {
    const map = new Map<string, OrgTreeNode>()
    employees.forEach(e => map.set(e.id, { ...e, children: [] }))

    const roots: OrgTreeNode[] = []
    map.forEach(node => {
      if (node.managerId && map.has(node.managerId)) {
        map.get(node.managerId)!.children!.push(node)
      } else {
        roots.push(node)
      }
    })
    return roots
  }

  function toggleTreeNode(id: string) {
    setTreeExpanded(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // Demo data
  const demoScenarios: Scenario[] = useMemo(() => scenarios.length > 0 ? [] : [
    { id: '1', orgId: '', name: 'Engineering Reorg Q2 2026', description: 'Restructure engineering into platform and product verticals', baselineDate: '2026-03-01', status: 'modeling', createdBy: '', createdAt: '2026-03-10', updatedAt: '2026-03-18' },
    { id: '2', orgId: '', name: 'APAC Expansion', description: 'New Singapore office with dedicated teams', baselineDate: '2026-03-01', status: 'proposed', createdBy: '', createdAt: '2026-02-15', updatedAt: '2026-03-05' },
    { id: '3', orgId: '', name: 'Cost Optimization Scenario', description: 'Reduce management layers and increase spans of control', baselineDate: '2026-03-01', status: 'draft', createdBy: '', createdAt: '2026-03-15', updatedAt: '2026-03-15' },
  ], [scenarios])

  const demoChanges: Change[] = useMemo(() => changes.length > 0 ? [] : [
    { id: '1', scenarioId: '1', changeType: 'create_department', targetType: 'department', targetId: null, changeData: JSON.stringify({ name: 'Platform Engineering', parentId: null }), costImpact: 0, headcountImpact: 0, notes: 'New department for infra/platform work', createdAt: '2026-03-10' },
    { id: '2', scenarioId: '1', changeType: 'add_role', targetType: 'employee', targetId: null, changeData: JSON.stringify({ name: 'VP Platform Engineering', jobTitle: 'VP Platform Engineering', level: 'VP', departmentId: 'new-1' }), costImpact: 35000000, headcountImpact: 1, notes: 'New VP hire for platform org', createdAt: '2026-03-10' },
    { id: '3', scenarioId: '1', changeType: 'move_employee', targetType: 'employee', targetId: 'emp-1', changeData: JSON.stringify({ newDepartmentId: 'new-1', newManagerId: 'new-vp' }), costImpact: 0, headcountImpact: 0, notes: 'Move 3 senior engineers to platform', createdAt: '2026-03-11' },
    { id: '4', scenarioId: '1', changeType: 'promote', targetType: 'employee', targetId: 'emp-2', changeData: JSON.stringify({ newTitle: 'Senior Staff Engineer', newLevel: 'L7' }), costImpact: 5000000, headcountImpact: 0, notes: 'Promote to lead platform architecture', createdAt: '2026-03-11' },
    { id: '5', scenarioId: '1', changeType: 'add_role', targetType: 'employee', targetId: null, changeData: JSON.stringify({ name: 'SRE Lead', jobTitle: 'SRE Lead', level: 'L6' }), costImpact: 22000000, headcountImpact: 1, notes: null, createdAt: '2026-03-12' },
    { id: '6', scenarioId: '1', changeType: 'remove_role', targetType: 'employee', targetId: 'emp-3', changeData: JSON.stringify({ reason: 'Role consolidated into platform team' }), costImpact: -18000000, headcountImpact: -1, notes: null, createdAt: '2026-03-12' },
  ], [changes])

  const demoImpact: ScenarioImpact = useMemo(() => impact || {
    scenarioId: '1', scenarioName: 'Engineering Reorg Q2 2026',
    currentHeadcount: 876, projectedHeadcount: 877, headcountDelta: 1,
    costDelta: 44000000, currentDeptCount: 12, projectedDeptCount: 13,
    affectedEmployees: 8, totalChanges: 6,
    changeBreakdown: { addRole: 2, removeRole: 1, moveEmployee: 1, createDepartment: 1, promote: 1 },
  }, [impact])

  const demoOrgTree: OrgTreeNode[] = useMemo(() => orgTree.length > 0 ? orgTree : [
    {
      id: 'ceo', name: 'Sarah Chen', title: 'CEO', level: 'C-Suite', departmentId: null, managerId: null,
      children: [
        {
          id: 'cto', name: 'Marcus Johnson', title: 'CTO', level: 'C-Suite', departmentId: 'eng', managerId: 'ceo',
          children: [
            {
              id: 'vp-prod', name: 'Emily Wang', title: 'VP Product Engineering', level: 'VP', departmentId: 'eng', managerId: 'cto',
              children: [
                { id: 'em1', name: 'Alex Rivera', title: 'Engineering Manager', level: 'M1', departmentId: 'eng', managerId: 'vp-prod', children: [] },
                { id: 'em2', name: 'Priya Patel', title: 'Engineering Manager', level: 'M1', departmentId: 'eng', managerId: 'vp-prod', children: [] },
              ],
            },
            {
              id: 'vp-platform', name: 'New Hire (TBD)', title: 'VP Platform Engineering', level: 'VP', departmentId: 'platform', managerId: 'cto',
              isNew: true,
              children: [
                { id: 'sre-lead', name: 'SRE Lead (TBD)', title: 'SRE Lead', level: 'L6', departmentId: 'platform', managerId: 'vp-platform', isNew: true, children: [] },
                { id: 'moved-eng', name: 'David Kim', title: 'Senior Staff Engineer', level: 'L7', departmentId: 'platform', managerId: 'vp-platform', isModified: true, children: [] },
              ],
            },
          ],
        },
        {
          id: 'cfo', name: 'James Wright', title: 'CFO', level: 'C-Suite', departmentId: 'finance', managerId: 'ceo',
          children: [
            { id: 'fc', name: 'Lisa Thompson', title: 'Financial Controller', level: 'Director', departmentId: 'finance', managerId: 'cfo', children: [] },
          ],
        },
        {
          id: 'chro', name: 'Nina Okoro', title: 'CHRO', level: 'C-Suite', departmentId: 'hr', managerId: 'ceo',
          children: [],
        },
        {
          id: 'removed', name: 'Legacy Infra Lead', title: 'Infrastructure Lead', level: 'M1', departmentId: 'eng', managerId: 'cto',
          isRemoved: true, children: [],
        },
      ],
    },
  ], [orgTree])

  const displayScenarios = scenarios.length > 0 ? scenarios : demoScenarios
  const displayChanges = changes.length > 0 ? changes : demoChanges
  const displayImpact = demoImpact
  const displayTree = demoOrgTree

  const selectedScenario = displayScenarios.find(s => s.id === selectedScenarioId) || displayScenarios[0]

  // Filtered scenarios
  const filteredScenarios = useMemo(() => {
    if (!searchQuery) return displayScenarios
    const q = searchQuery.toLowerCase()
    return displayScenarios.filter(s => s.name.toLowerCase().includes(q) || s.description?.toLowerCase().includes(q))
  }, [displayScenarios, searchQuery])

  // Actions
  async function handleCreateScenario() {
    setSaving(true)
    try {
      await apiPost({ action: 'create-scenario', ...scenarioForm })
      addToast?.('Scenario created', 'success')
      setShowScenarioModal(false)
      setScenarioForm({ name: '', description: '', baselineDate: new Date().toISOString().split('T')[0] })
      loadScenarios()
    } catch (e: any) {
      addToast?.(e.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleAddChange() {
    setSaving(true)
    try {
      const changeData: Record<string, unknown> = {}
      if (changeForm.changeType === 'add_role') {
        changeData.name = changeForm.name
        changeData.jobTitle = changeForm.jobTitle
        changeData.level = changeForm.level
        changeData.departmentId = changeForm.departmentId
        changeData.managerId = changeForm.managerId
      } else if (changeForm.changeType === 'move_employee') {
        changeData.newDepartmentId = changeForm.newDepartmentId
        changeData.newManagerId = changeForm.newManagerId
      } else if (changeForm.changeType === 'change_reporting') {
        changeData.newManagerId = changeForm.newManagerId
      } else if (changeForm.changeType === 'promote') {
        changeData.newTitle = changeForm.newTitle
        changeData.newLevel = changeForm.newLevel
      } else if (changeForm.changeType === 'create_department') {
        changeData.name = changeForm.name
      } else if (changeForm.changeType === 'remove_role') {
        changeData.reason = changeForm.notes
      }

      await apiPost({
        action: 'add-change',
        scenarioId: selectedScenarioId || displayScenarios[0]?.id,
        changeType: changeForm.changeType,
        targetType: changeForm.targetType,
        targetId: changeForm.targetId || undefined,
        changeData: JSON.stringify(changeData),
        costImpact: changeForm.costImpact ? Math.round(parseFloat(changeForm.costImpact) * 100) : 0,
        headcountImpact: parseInt(changeForm.headcountImpact) || 0,
        notes: changeForm.notes,
      })
      addToast?.('Change added', 'success')
      setShowChangeModal(false)
      setChangeForm({ changeType: 'add_role', targetType: 'employee', targetId: '', name: '', jobTitle: '', level: '', departmentId: '', managerId: '', newDepartmentId: '', newManagerId: '', newTitle: '', newLevel: '', costImpact: '', headcountImpact: '', notes: '' })
      if (selectedScenarioId) loadScenarioData(selectedScenarioId)
    } catch (e: any) {
      addToast?.(e.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleRemoveChange(changeId: string) {
    try {
      await apiPost({ action: 'remove-change', changeId })
      addToast?.('Change removed', 'success')
      if (selectedScenarioId) loadScenarioData(selectedScenarioId)
    } catch (e: any) {
      addToast?.(e.message, 'error')
    }
  }

  async function handleCompare() {
    try {
      const results = await apiPost({ action: 'compare-scenarios', scenarioIds: compareIds })
      setCompareResults(results || [])
      setShowCompareModal(false)
      setActiveTab('compare')
    } catch (e: any) {
      addToast?.(e.message, 'error')
    }
  }

  // Expand first level of tree on tab switch
  useEffect(() => {
    if (activeTab === 'modeling' && displayTree.length > 0) {
      setTreeExpanded(new Set(displayTree.map(n => n.id)))
    }
  }, [activeTab])

  if (pageLoading) return <PageSkeleton />

  const tabs = [
    { key: 'scenarios' as const, label: 'Scenarios', icon: <Layers size={16} /> },
    { key: 'modeling' as const, label: 'Modeling', icon: <GitBranch size={16} /> },
    { key: 'compare' as const, label: 'Compare', icon: <Copy size={16} /> },
    { key: 'impact' as const, label: 'Impact Analysis', icon: <BarChart3 size={16} /> },
  ]

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Org Design"
        subtitle="Scenario modeling for organizational restructuring"
        actions={
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-1.5 text-sm border rounded-lg bg-white dark:bg-zinc-900 w-56"
              />
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowCompareModal(true)}>
              <Copy size={14} className="mr-1" /> Compare
            </Button>
            <Button size="sm" onClick={() => setShowScenarioModal(true)}>
              <Plus size={14} className="mr-1" /> New Scenario
            </Button>
          </div>
        }
      />

      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* Impact Counter */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <StatCard title="Current Headcount" value={displayImpact.currentHeadcount} icon={<Users size={20} />} />
          <StatCard title="Projected Headcount" value={displayImpact.projectedHeadcount} icon={<Users size={20} />} />
          <StatCard title="Headcount Delta" value={`${displayImpact.headcountDelta >= 0 ? '+' : ''}${displayImpact.headcountDelta}`} icon={<UserPlus size={20} />} trend={displayImpact.headcountDelta >= 0 ? 'up' : 'down'} />
          <StatCard title="Cost Impact" value={formatCurrency(Math.abs(displayImpact.costDelta), defaultCurrency)} icon={<DollarSign size={20} />} subtitle={displayImpact.costDelta >= 0 ? 'increase' : 'savings'} />
          <StatCard title="Affected Employees" value={displayImpact.affectedEmployees} icon={<AlertTriangle size={20} />} />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key ? 'border-blue-600 text-blue-600' : 'border-transparent text-zinc-500 hover:text-zinc-700'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Scenarios Tab */}
        {activeTab === 'scenarios' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Scenarios</h3>
            <div className="space-y-3">
              {filteredScenarios.map(scenario => (
                <Card key={scenario.id} className={`p-4 cursor-pointer transition-colors ${selectedScenarioId === scenario.id ? 'border-blue-400 ring-1 ring-blue-200' : 'hover:border-zinc-300'}`}
                  onClick={() => { setSelectedScenarioId(scenario.id); setActiveTab('modeling') }}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{scenario.name}</h4>
                        {statusBadge(scenario.status)}
                      </div>
                      {scenario.description && <p className="text-sm text-zinc-500 mt-1">{scenario.description}</p>}
                      <div className="flex items-center gap-3 mt-2 text-xs text-zinc-400">
                        <span>Baseline: {scenario.baselineDate}</span>
                        <span>Created: {new Date(scenario.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={e => { e.stopPropagation(); setSelectedScenarioId(scenario.id); setActiveTab('modeling') }}>
                        <Eye size={14} className="mr-1" /> Model
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
              {filteredScenarios.length === 0 && (
                <div className="text-center py-12 text-zinc-400">No scenarios found. Create one to start modeling.</div>
              )}
            </div>
          </div>
        )}

        {/* Modeling Tab */}
        {activeTab === 'modeling' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold">{selectedScenario?.name || 'Select a Scenario'}</h3>
                {selectedScenario?.description && <p className="text-sm text-zinc-500">{selectedScenario.description}</p>}
              </div>
              <Button size="sm" onClick={() => setShowChangeModal(true)}>
                <Plus size={14} className="mr-1" /> Add Change
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Org Tree */}
              <Card className="p-4">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <GitBranch size={16} /> Projected Org Structure
                </h4>
                <div className="max-h-[600px] overflow-auto">
                  {displayTree.map(node => (
                    <OrgTreeNodeCard key={node.id} node={node} expanded={treeExpanded} onToggle={toggleTreeNode} />
                  ))}
                  {displayTree.length === 0 && (
                    <div className="text-center py-8 text-zinc-400">No org tree data available</div>
                  )}
                </div>
                <div className="mt-3 flex items-center gap-4 text-xs text-zinc-500 pt-3 border-t">
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded border-2 border-green-400 bg-green-50" /> New</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded border-2 border-amber-400 bg-amber-50" /> Modified</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded border-2 border-red-400 bg-red-50" /> Removed</span>
                </div>
              </Card>

              {/* Changes List */}
              <Card className="p-4">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Layers size={16} /> Changes ({displayChanges.length})
                </h4>
                <div className="space-y-2 max-h-[600px] overflow-auto">
                  {displayChanges.map(change => {
                    const data = JSON.parse(change.changeData)
                    const ct = CHANGE_TYPES.find(c => c.value === change.changeType)
                    return (
                      <div key={change.id} className="p-3 rounded-lg border hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-2">
                            <span className="mt-0.5 text-zinc-500">{changeIcon(change.changeType)}</span>
                            <div>
                              <div className="font-medium text-sm">{ct?.label || change.changeType}</div>
                              <div className="text-xs text-zinc-500 mt-0.5">
                                {change.changeType === 'add_role' && `${data.name || 'New Role'} — ${data.jobTitle || ''}`}
                                {change.changeType === 'remove_role' && `Remove ${change.targetType}`}
                                {change.changeType === 'move_employee' && `Move to new department/manager`}
                                {change.changeType === 'create_department' && `New: ${data.name}`}
                                {change.changeType === 'promote' && `${data.newTitle || ''} (${data.newLevel || ''})`}
                                {change.changeType === 'change_reporting' && 'New reporting line'}
                                {change.changeType === 'change_comp' && 'Compensation adjustment'}
                              </div>
                              {change.notes && <div className="text-xs text-zinc-400 mt-1">{change.notes}</div>}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-right text-xs">
                              {change.costImpact !== 0 && (
                                <div className={change.costImpact > 0 ? 'text-red-600' : 'text-green-600'}>
                                  {change.costImpact > 0 ? '+' : ''}{formatCurrency(change.costImpact, defaultCurrency)}
                                </div>
                              )}
                              {change.headcountImpact !== 0 && (
                                <div className={change.headcountImpact > 0 ? 'text-blue-600' : 'text-amber-600'}>
                                  {change.headcountImpact > 0 ? '+' : ''}{change.headcountImpact} HC
                                </div>
                              )}
                            </div>
                            <button onClick={() => handleRemoveChange(change.id)} className="text-zinc-400 hover:text-red-500">
                              <X size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  {displayChanges.length === 0 && (
                    <div className="text-center py-8 text-zinc-400">No changes yet. Click &quot;Add Change&quot; to start modeling.</div>
                  )}
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* Compare Tab */}
        {activeTab === 'compare' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Scenario Comparison</h3>
              <Button variant="outline" size="sm" onClick={() => setShowCompareModal(true)}>
                <Copy size={14} className="mr-1" /> Select Scenarios
              </Button>
            </div>

            {compareResults.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-zinc-500">
                      <th className="pb-2 font-medium">Metric</th>
                      {compareResults.map(r => (
                        <th key={r.scenarioId} className="pb-2 font-medium">{r.scenarioName}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { label: 'Current Headcount', key: 'currentHeadcount' },
                      { label: 'Projected Headcount', key: 'projectedHeadcount' },
                      { label: 'Headcount Delta', key: 'headcountDelta' },
                      { label: 'Cost Delta', key: 'costDelta', isCurrency: true },
                      { label: 'Departments', key: 'projectedDeptCount' },
                      { label: 'Affected Employees', key: 'affectedEmployees' },
                      { label: 'Total Changes', key: 'totalChanges' },
                    ].map(row => (
                      <tr key={row.key} className="border-b">
                        <td className="py-3 font-medium">{row.label}</td>
                        {compareResults.map(r => (
                          <td key={r.scenarioId} className="py-3">
                            {row.isCurrency
                              ? formatCurrency((r as any)[row.key], defaultCurrency)
                              : (r as any)[row.key]}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <Card className="p-8 text-center">
                <Copy size={24} className="mx-auto text-zinc-300 mb-3" />
                <p className="text-zinc-500">Select 2-3 scenarios to compare side-by-side.</p>
                <Button variant="outline" size="sm" className="mt-3" onClick={() => setShowCompareModal(true)}>
                  <Copy size={14} className="mr-1" /> Select Scenarios
                </Button>
              </Card>
            )}
          </div>
        )}

        {/* Impact Analysis Tab */}
        {activeTab === 'impact' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Impact Analysis: {displayImpact.scenarioName}</h3>

            {/* Change Breakdown */}
            <Card className="p-4">
              <h4 className="font-medium mb-4">Change Breakdown</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(displayImpact.changeBreakdown).filter(([, v]) => v > 0).map(([key, value]) => {
                  const ct = CHANGE_TYPES.find(c => c.value === key.replace(/([A-Z])/g, '_$1').toLowerCase())
                  return (
                    <div key={key} className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg text-center">
                      <div className="text-2xl font-bold">{value}</div>
                      <div className="text-xs text-zinc-500 mt-1 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</div>
                    </div>
                  )
                })}
              </div>
            </Card>

            {/* Detailed Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="p-4">
                <h4 className="font-medium mb-3">Headcount Impact</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Current</span>
                    <span className="font-semibold">{displayImpact.currentHeadcount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Projected</span>
                    <span className="font-semibold">{displayImpact.projectedHeadcount}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-zinc-500">Net Change</span>
                    <span className={`font-semibold ${displayImpact.headcountDelta >= 0 ? 'text-blue-600' : 'text-amber-600'}`}>
                      {displayImpact.headcountDelta >= 0 ? '+' : ''}{displayImpact.headcountDelta}
                    </span>
                  </div>
                </div>
              </Card>
              <Card className="p-4">
                <h4 className="font-medium mb-3">Department Impact</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Current Departments</span>
                    <span className="font-semibold">{displayImpact.currentDeptCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Projected Departments</span>
                    <span className="font-semibold">{displayImpact.projectedDeptCount}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-zinc-500">Net Change</span>
                    <span className="font-semibold">
                      {displayImpact.projectedDeptCount - displayImpact.currentDeptCount >= 0 ? '+' : ''}{displayImpact.projectedDeptCount - displayImpact.currentDeptCount}
                    </span>
                  </div>
                </div>
              </Card>
            </div>

            {/* Cost Summary */}
            <Card className="p-4">
              <h4 className="font-medium mb-3">Cost Impact by Change Type</h4>
              <div className="space-y-2">
                {displayChanges.filter(c => c.costImpact !== 0).map(change => {
                  const ct = CHANGE_TYPES.find(c => c.value === change.changeType)
                  const data = JSON.parse(change.changeData)
                  return (
                    <div key={change.id} className="flex items-center justify-between p-2 rounded hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                      <div className="flex items-center gap-2">
                        {changeIcon(change.changeType)}
                        <span className="text-sm">{ct?.label}: {data.name || data.newTitle || change.targetType}</span>
                      </div>
                      <span className={`text-sm font-medium ${change.costImpact > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {change.costImpact > 0 ? '+' : ''}{formatCurrency(change.costImpact, defaultCurrency)}
                      </span>
                    </div>
                  )
                })}
                <div className="flex items-center justify-between p-2 border-t font-semibold">
                  <span>Net Cost Impact</span>
                  <span className={displayImpact.costDelta > 0 ? 'text-red-600' : 'text-green-600'}>
                    {displayImpact.costDelta > 0 ? '+' : ''}{formatCurrency(displayImpact.costDelta, defaultCurrency)}
                  </span>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Scenario Modal */}
      <Modal open={showScenarioModal} onClose={() => setShowScenarioModal(false)} title="New Scenario">
        <div className="space-y-4 p-4">
          <Input label="Scenario Name" value={scenarioForm.name} onChange={e => setScenarioForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Engineering Reorg Q2 2026" />
          <Textarea label="Description" value={scenarioForm.description} onChange={e => setScenarioForm(f => ({ ...f, description: e.target.value }))} />
          <Input label="Baseline Date" type="date" value={scenarioForm.baselineDate} onChange={e => setScenarioForm(f => ({ ...f, baselineDate: e.target.value }))} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowScenarioModal(false)}>Cancel</Button>
            <Button onClick={handleCreateScenario} disabled={saving || !scenarioForm.name}>
              {saving ? 'Creating...' : 'Create Scenario'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add Change Modal */}
      <Modal open={showChangeModal} onClose={() => setShowChangeModal(false)} title="Add Change">
        <div className="space-y-4 p-4">
          <Select
            label="Change Type"
            value={changeForm.changeType}
            onChange={e => setChangeForm(f => ({ ...f, changeType: e.target.value }))}
            options={CHANGE_TYPES.map(c => ({ value: c.value, label: c.label }))}
          />

          {(changeForm.changeType === 'add_role' || changeForm.changeType === 'create_department') && (
            <Input label="Name" value={changeForm.name} onChange={e => setChangeForm(f => ({ ...f, name: e.target.value }))} placeholder={changeForm.changeType === 'create_department' ? 'Department name' : 'Person name'} />
          )}
          {changeForm.changeType === 'add_role' && (
            <div className="grid grid-cols-2 gap-4">
              <Input label="Job Title" value={changeForm.jobTitle} onChange={e => setChangeForm(f => ({ ...f, jobTitle: e.target.value }))} />
              <Input label="Level" value={changeForm.level} onChange={e => setChangeForm(f => ({ ...f, level: e.target.value }))} />
            </div>
          )}
          {(changeForm.changeType === 'move_employee' || changeForm.changeType === 'remove_role' || changeForm.changeType === 'change_reporting' || changeForm.changeType === 'change_comp' || changeForm.changeType === 'promote') && (
            <Input label="Target Employee ID" value={changeForm.targetId} onChange={e => setChangeForm(f => ({ ...f, targetId: e.target.value }))} placeholder="Employee UUID" />
          )}
          {changeForm.changeType === 'promote' && (
            <div className="grid grid-cols-2 gap-4">
              <Input label="New Title" value={changeForm.newTitle} onChange={e => setChangeForm(f => ({ ...f, newTitle: e.target.value }))} />
              <Input label="New Level" value={changeForm.newLevel} onChange={e => setChangeForm(f => ({ ...f, newLevel: e.target.value }))} />
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <Input label="Cost Impact ($)" type="number" value={changeForm.costImpact} onChange={e => setChangeForm(f => ({ ...f, costImpact: e.target.value }))} placeholder="Annual cost change" />
            <Input label="Headcount Impact" type="number" value={changeForm.headcountImpact} onChange={e => setChangeForm(f => ({ ...f, headcountImpact: e.target.value }))} placeholder="+1, -1, 0" />
          </div>
          <Textarea label="Notes" value={changeForm.notes} onChange={e => setChangeForm(f => ({ ...f, notes: e.target.value }))} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowChangeModal(false)}>Cancel</Button>
            <Button onClick={handleAddChange} disabled={saving}>
              {saving ? 'Adding...' : 'Add Change'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Compare Modal */}
      <Modal open={showCompareModal} onClose={() => setShowCompareModal(false)} title="Compare Scenarios">
        <div className="space-y-4 p-4">
          <p className="text-sm text-zinc-500">Select 2-3 scenarios to compare side-by-side.</p>
          <div className="space-y-2">
            {displayScenarios.map(s => (
              <label key={s.id} className="flex items-center gap-2 p-2 rounded hover:bg-zinc-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={compareIds.includes(s.id)}
                  onChange={e => {
                    if (e.target.checked) {
                      if (compareIds.length < 3) setCompareIds([...compareIds, s.id])
                    } else {
                      setCompareIds(compareIds.filter(id => id !== s.id))
                    }
                  }}
                />
                <span className="font-medium text-sm">{s.name}</span>
                {statusBadge(s.status)}
              </label>
            ))}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowCompareModal(false)}>Cancel</Button>
            <Button onClick={handleCompare} disabled={compareIds.length < 2}>
              Compare ({compareIds.length})
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
