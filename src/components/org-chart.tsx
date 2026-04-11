'use client'

import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { useTempo } from '@/lib/store'
import { Modal } from '@/components/ui/modal'
import { Input, Select } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Search, X, MoreHorizontal, ChevronDown, ChevronUp,
  Plus, GripVertical, MessageSquare, GitBranch, Video, Phone,
  Mail, Building2, Globe, Calendar, User, Users,
} from 'lucide-react'

/* ================================================================
   TYPES
   ================================================================ */
interface OrgNode {
  employee: any
  children: OrgNode[]
}

/* ================================================================
   CONSTANTS
   ================================================================ */
const DEPT_COLORS: Record<string, string> = {
  'Retail Banking': '#3b82f6',
  'Corporate Banking': '#6366f1',
  'Operations': '#22c55e',
  'Technology': '#a855f7',
  'Human Resources': '#ec4899',
  'Risk & Compliance': '#ef4444',
  'Finance': '#f59e0b',
  'Marketing': '#06b6d4',
}

const DEPT_BG: Record<string, string> = {
  'Retail Banking': 'bg-blue-100 text-blue-700',
  'Corporate Banking': 'bg-indigo-100 text-indigo-700',
  'Operations': 'bg-green-100 text-green-700',
  'Technology': 'bg-purple-100 text-purple-700',
  'Human Resources': 'bg-pink-100 text-pink-700',
  'Risk & Compliance': 'bg-red-100 text-red-700',
  'Finance': 'bg-amber-100 text-amber-700',
  'Marketing': 'bg-cyan-100 text-cyan-700',
}

const LEVEL_ORDER: Record<string, number> = {
  Executive: 1, Director: 2, 'Senior Manager': 3, Manager: 4,
  Senior: 5, Mid: 6, Associate: 7, Junior: 8,
}

const TEST_NAMES = ['Final Guard Tester', 'Double Click Test Person', 'Server Restart Guard Test']

const CONNECTOR_COLOR = '#e2e8f0'
const CONNECTOR_W = 1.5
const CONNECTOR_GAP = 24     // vertical gap between card bottom and horizontal bar
const CONNECTOR_R = 8        // border-radius for rounded corners
const CARD_W = 164
const CARD_GAP = 20          // horizontal gap between sibling cards
const AVATAR_SIZE = 48
const STATUS_COLORS = { green: '#22c55e', amber: '#f59e0b', grey: '#9ca3af' }

/* ================================================================
   HELPERS
   ================================================================ */
function getInitials(name: string) {
  return name.split(' ').map(n => n?.[0] || '').join('').toUpperCase().slice(0, 2)
}

function hashStr(s: string) {
  return s.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
}

function getStatusDot(name: string): 'green' | 'amber' | 'grey' {
  return (['green', 'amber', 'grey'] as const)[hashStr(name) % 3]
}

function getDeptColor(deptName: string) {
  return DEPT_COLORS[deptName] || '#6b7280'
}

function getDeptBg(deptName: string) {
  return DEPT_BG[deptName] || 'bg-gray-100 text-gray-700'
}

function isHiring(emp: any): boolean {
  // Deterministic: show for ~20% of managers
  const h = hashStr(emp.profile?.full_name || emp.id)
  return (emp.role === 'manager' || emp.role === 'admin') && h % 5 === 0
}

/* ================================================================
   TREE BUILDER
   ================================================================ */
function buildOrgTree(employees: any[], departments: any[]): OrgNode | null {
  const clean = employees.filter(e => {
    const name = e.profile?.full_name || ''
    return !TEST_NAMES.some(t => name.includes(t))
  })

  if (clean.length === 0) return null

  // Build children map from managerId
  const childrenMap = new Map<string, any[]>()
  const hasManagerSet = new Set<string>()

  clean.forEach(emp => {
    const mid = emp.managerId || emp.manager_id
    if (mid && clean.some(e => e.id === mid)) {
      hasManagerSet.add(emp.id)
      if (!childrenMap.has(mid)) childrenMap.set(mid, [])
      childrenMap.get(mid)!.push(emp)
    }
  })

  // Find root
  let root = clean.find(e => e.role === 'owner' && !hasManagerSet.has(e.id))
    || clean.find(e => e.role === 'owner')
    || clean.find(e => (e.level === 'Executive' || e.level === 'Director') && !hasManagerSet.has(e.id))
    || clean[0]

  // Infer hierarchy from departments for any employees without a managerId.
  // This handles both the pure-demo case (no managerId on anyone) and the
  // mixed case (some employees have managerId from DB, others don't).
  if (departments.length > 0) {
    departments.forEach(dept => {
      const headId = dept.head_id
      if (!headId || headId === root.id) return
      const head = clean.find(e => e.id === headId)
      if (!head) return

      // If the department head has no manager, assign them to root
      if (!hasManagerSet.has(headId)) {
        if (!childrenMap.has(root.id)) childrenMap.set(root.id, [])
        // Avoid duplicating if already present
        if (!childrenMap.get(root.id)!.some((c: any) => c.id === headId)) {
          childrenMap.get(root.id)!.push(head)
        }
        hasManagerSet.add(headId)
      }

      // Assign department members who have no manager to their department head
      const orphanMembers = clean.filter(e =>
        e.department_id === dept.id && e.id !== headId && e.id !== root.id && !hasManagerSet.has(e.id)
      )
      if (orphanMembers.length > 0) {
        orphanMembers.sort((a: any, b: any) => (LEVEL_ORDER[a.level] || 99) - (LEVEL_ORDER[b.level] || 99))
        if (!childrenMap.has(headId)) childrenMap.set(headId, [])
        orphanMembers.forEach((m: any) => {
          if (!childrenMap.get(headId)!.some((c: any) => c.id === m.id)) {
            childrenMap.get(headId)!.push(m)
          }
          hasManagerSet.add(m.id)
        })
      }
    })

    // Employees in root's own department who still have no manager
    const rootDeptOrphans = clean.filter(e =>
      e.department_id === root.department_id && e.id !== root.id && !hasManagerSet.has(e.id)
    )
    if (rootDeptOrphans.length > 0) {
      if (!childrenMap.has(root.id)) childrenMap.set(root.id, [])
      rootDeptOrphans.forEach((e: any) => {
        if (!childrenMap.get(root.id)!.some((c: any) => c.id === e.id)) {
          childrenMap.get(root.id)!.push(e)
        }
      })
    }
  }

  // Build tree recursively
  function buildNode(emp: any, visited = new Set<string>()): OrgNode {
    if (visited.has(emp.id)) return { employee: emp, children: [] }
    visited.add(emp.id)
    const children = (childrenMap.get(emp.id) || [])
      .sort((a: any, b: any) => (LEVEL_ORDER[a.level] || 99) - (LEVEL_ORDER[b.level] || 99))
      .map((child: any) => buildNode(child, visited))
    return { employee: emp, children }
  }

  return buildNode(root)
}

// Get reporting chain from root to target
function getReportingChain(tree: OrgNode, targetId: string): any[] {
  const chain: any[] = []
  function find(node: OrgNode, path: any[]): boolean {
    path.push(node.employee)
    if (node.employee.id === targetId) return true
    for (const child of node.children) {
      if (find(child, path)) return true
    }
    path.pop()
    return false
  }
  find(tree, chain)
  return chain
}

// Get siblings (same manager, excluding self)
function getSiblings(employeeId: string, employees: any[]): any[] {
  const emp = employees.find((e: any) => e.id === employeeId)
  if (!emp) return []
  const mid = emp.managerId || emp.manager_id
  if (!mid) return []
  return employees.filter((e: any) => {
    const emid = e.managerId || e.manager_id
    return emid === mid && e.id !== employeeId
  })
}

/* ================================================================
   PERSON CARD
   ================================================================ */
function PersonCard({
  employee, childCount, isExpanded, deptName, opacity,
  onToggle, onClick, quickEdit, onDragStart, onDragOver, onDragLeave, onDrop,
  isDragOver,
}: {
  employee: any
  childCount: number
  isExpanded: boolean
  deptName: string
  opacity: number
  onToggle: () => void
  onClick: () => void
  quickEdit: boolean
  onDragStart: (e: React.DragEvent) => void
  onDragOver: (e: React.DragEvent) => void
  onDragLeave: () => void
  onDrop: (e: React.DragEvent) => void
  isDragOver: boolean
}) {
  const name = employee.profile?.full_name || 'Unknown'
  const title = employee.job_title || ''
  const status = getStatusDot(name)
  const color = getDeptColor(deptName)
  const hiring = isHiring(employee)

  return (
    <div
      className="relative flex flex-col items-center"
      style={{ opacity, transition: 'opacity 0.3s ease', width: CARD_W }}
    >
      {/* Floating avatar */}
      <div className="relative z-10" style={{ marginBottom: -AVATAR_SIZE / 2 }}>
        <div
          className="rounded-full flex items-center justify-center font-semibold text-sm"
          style={{
            width: AVATAR_SIZE, height: AVATAR_SIZE,
            backgroundColor: color + '20', color: color,
            border: `2px solid ${color}40`,
          }}
        >
          {employee.profile?.avatar_url ? (
            <img src={employee.profile.avatar_url} alt={name} className="w-full h-full rounded-full object-cover" />
          ) : (
            getInitials(name)
          )}
        </div>
        {/* Status dot */}
        <div
          className="absolute bottom-0 right-0 rounded-full border-2 border-white"
          style={{ width: 10, height: 10, backgroundColor: STATUS_COLORS[status] }}
        />
      </div>

      {/* Card body */}
      <div
        className={`
          relative bg-white rounded-lg shadow-sm border cursor-pointer
          hover:shadow-md transition-shadow w-full
          ${isDragOver ? 'ring-2 ring-blue-500 border-blue-500' : 'border-gray-200'}
        `}
        style={{ paddingTop: AVATAR_SIZE / 2 + 4 }}
        onClick={onClick}
        draggable={quickEdit}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        {/* Drag handle */}
        {quickEdit && (
          <div className="absolute top-1 left-1 text-gray-300 cursor-grab active:cursor-grabbing">
            <GripVertical size={12} />
          </div>
        )}

        {/* Hiring badge */}
        {hiring && (
          <span className="absolute top-1 left-2 text-[11px] italic text-teal-700 font-medium">
            Hiring!
          </span>
        )}

        {/* Three-dot menu */}
        <button
          className="absolute top-1 right-1 p-0.5 text-gray-300 hover:text-gray-500 rounded"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreHorizontal size={14} />
        </button>

        {/* Name + title */}
        <div className="px-2 pb-3 pt-1 text-center">
          <p className="text-[13px] font-medium text-gray-900 leading-tight truncate">{name}</p>
          <p className="text-[11px] text-gray-500 mt-0.5 leading-tight truncate">{title}</p>
        </div>
      </div>

      {/* Expand/collapse badge */}
      {childCount > 0 && (
        <button
          className="absolute -bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-0.5 bg-blue-600 text-white text-[11px] font-medium px-2 py-0.5 rounded-full hover:bg-blue-700 transition-colors shadow-sm"
          onClick={(e) => { e.stopPropagation(); onToggle() }}
        >
          {childCount}
          {isExpanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
        </button>
      )}
    </div>
  )
}

/* ================================================================
   GHOST CARD (Add Position)
   ================================================================ */
function GhostCard({ onClick }: { onClick: () => void }) {
  return (
    <div className="flex flex-col items-center" style={{ width: CARD_W }}>
      {/* Spacer for avatar */}
      <div style={{ height: AVATAR_SIZE / 2 }} />
      <button
        onClick={onClick}
        className="w-full rounded-lg border-2 border-dashed border-gray-300 hover:border-gray-400 bg-gray-50/50 hover:bg-gray-50 transition-colors flex flex-col items-center justify-center py-5 gap-1 group"
      >
        <div className="w-8 h-8 rounded-full border-2 border-dashed border-gray-300 group-hover:border-gray-400 flex items-center justify-center transition-colors">
          <Plus size={16} className="text-gray-400 group-hover:text-gray-500" />
        </div>
        <span className="text-[11px] text-gray-400 group-hover:text-gray-500 transition-colors">Add position</span>
      </button>
    </div>
  )
}

/* ================================================================
   TREE NODE (recursive)
   ================================================================ */
function TreeNode({
  node, expandedNodes, deptMap, getOpacity, onToggle, onSelect,
  quickEdit, onDragStart, onDragOver, onDragLeave, onDrop, dragOverId,
  onAddPosition,
}: {
  node: OrgNode
  expandedNodes: Set<string>
  deptMap: Map<string, string>
  getOpacity: (id: string) => number
  onToggle: (id: string) => void
  onSelect: (emp: any) => void
  quickEdit: boolean
  onDragStart: (e: React.DragEvent, emp: any) => void
  onDragOver: (e: React.DragEvent, emp: any) => void
  onDragLeave: () => void
  onDrop: (e: React.DragEvent, emp: any) => void
  dragOverId: string | null
  onAddPosition: (parentId: string) => void
}) {
  const { employee, children } = node
  const isExpanded = expandedNodes.has(employee.id)
  const deptName = deptMap.get(employee.department_id) || ''

  return (
    <div className="flex flex-col items-center">
      {/* The card */}
      <PersonCard
        employee={employee}
        childCount={children.length}
        isExpanded={isExpanded}
        deptName={deptName}
        opacity={getOpacity(employee.id)}
        onToggle={() => onToggle(employee.id)}
        onClick={() => onSelect(employee)}
        quickEdit={quickEdit}
        onDragStart={(e) => onDragStart(e, employee)}
        onDragOver={(e) => onDragOver(e, employee)}
        onDragLeave={onDragLeave}
        onDrop={(e) => onDrop(e, employee)}
        isDragOver={dragOverId === employee.id}
      />

      {/* Children */}
      {isExpanded && children.length > 0 && (
        <>
          {/* Vertical connector from card to horizontal bar */}
          <div style={{ width: CONNECTOR_W, height: CONNECTOR_GAP, backgroundColor: CONNECTOR_COLOR }} />

          {/* Children row */}
          <div className="flex items-start">
            {children.map((child, i) => {
              const isFirst = i === 0
              const isLast = i === children.length - 1 && children.length > 1
              const isOnly = children.length === 1
              const isGhostLast = i === children.length - 1 // ghost card comes after

              return (
                <div key={child.employee.id} className="flex flex-col items-center relative" style={{ paddingTop: CONNECTOR_GAP }}>
                  {/* Horizontal line segments */}
                  {!isOnly && (
                    <>
                      {/* Left half of horizontal connector */}
                      {!isFirst && (
                        <div
                          className="absolute top-0 right-1/2"
                          style={{
                            left: 0, height: CONNECTOR_W, backgroundColor: CONNECTOR_COLOR,
                            borderTopLeftRadius: isFirst ? CONNECTOR_R : 0,
                          }}
                        />
                      )}
                      {/* Right half of horizontal connector */}
                      {!isGhostLast && (
                        <div
                          className="absolute top-0 left-1/2"
                          style={{
                            right: 0, height: CONNECTOR_W, backgroundColor: CONNECTOR_COLOR,
                            borderTopRightRadius: isLast ? CONNECTOR_R : 0,
                          }}
                        />
                      )}
                      {/* Right half — extend to ghost card if this is last child */}
                      {isGhostLast && (
                        <div
                          className="absolute top-0 left-1/2"
                          style={{
                            right: -(CARD_GAP + CARD_W / 2), height: CONNECTOR_W, backgroundColor: CONNECTOR_COLOR,
                          }}
                        />
                      )}
                    </>
                  )}

                  {/* Vertical connector to this child */}
                  <div
                    className="absolute left-1/2 -translate-x-1/2 top-0"
                    style={{
                      width: CONNECTOR_W, height: CONNECTOR_GAP, backgroundColor: CONNECTOR_COLOR,
                      borderBottomLeftRadius: isFirst && !isOnly ? CONNECTOR_R : 0,
                      borderBottomRightRadius: isLast && !isOnly ? CONNECTOR_R : 0,
                    }}
                  />

                  <div style={{ paddingLeft: i === 0 ? 0 : CARD_GAP / 2, paddingRight: i === children.length - 1 ? 0 : CARD_GAP / 2 }}>
                    <TreeNode
                      node={child}
                      expandedNodes={expandedNodes}
                      deptMap={deptMap}
                      getOpacity={getOpacity}
                      onToggle={onToggle}
                      onSelect={onSelect}
                      quickEdit={quickEdit}
                      onDragStart={onDragStart}
                      onDragOver={onDragOver}
                      onDragLeave={onDragLeave}
                      onDrop={onDrop}
                      dragOverId={dragOverId}
                      onAddPosition={onAddPosition}
                    />
                  </div>
                </div>
              )
            })}

            {/* Ghost "Add position" card */}
            <div className="flex flex-col items-center relative" style={{ paddingTop: CONNECTOR_GAP }}>
              {/* Horizontal line from last child to ghost */}
              {children.length > 0 && (
                <div
                  className="absolute top-0 right-1/2"
                  style={{ left: 0, height: CONNECTOR_W, backgroundColor: CONNECTOR_COLOR }}
                />
              )}
              {/* Vertical connector to ghost */}
              <div
                className="absolute left-1/2 -translate-x-1/2 top-0"
                style={{ width: CONNECTOR_W, height: CONNECTOR_GAP, backgroundColor: CONNECTOR_COLOR }}
              />
              <div style={{ paddingLeft: CARD_GAP / 2 }}>
                <GhostCard onClick={() => onAddPosition(employee.id)} />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

/* ================================================================
   PROFILE SIDE PANEL
   ================================================================ */
function ProfilePanel({
  employee, tree, employees, departments, deptMap,
  onClose, onNavigate, panelTab, setPanelTab,
}: {
  employee: any
  tree: OrgNode
  employees: any[]
  departments: any[]
  deptMap: Map<string, string>
  onClose: () => void
  onNavigate: (emp: any) => void
  panelTab: 'overview' | 'contact' | 'organization'
  setPanelTab: (tab: 'overview' | 'contact' | 'organization') => void
}) {
  const name = employee.profile?.full_name || 'Unknown'
  const title = employee.job_title || ''
  const deptName = deptMap.get(employee.department_id) || ''
  const status = getStatusDot(name)
  const color = getDeptColor(deptName)

  // Reporting chain
  const chain = useMemo(() => getReportingChain(tree, employee.id), [tree, employee.id])

  // Direct reports
  const directReports = useMemo(() =>
    employees.filter((e: any) => {
      const mid = e.managerId || e.manager_id
      return mid === employee.id
    }),
  [employees, employee.id])

  // Peers (same manager)
  const peers = useMemo(() => getSiblings(employee.id, employees), [employee.id, employees])

  // Manager
  const managerId = employee.managerId || employee.manager_id
  const manager = managerId ? employees.find((e: any) => e.id === managerId) : null

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 lg:bg-transparent bg-black/20" onClick={onClose} />

      {/* Panel */}
      <div
        className="fixed top-0 right-0 z-50 h-full bg-white border-l border-gray-200 shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-200"
        style={{ width: 'min(360px, 100vw)' }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors z-10"
        >
          <X size={20} />
        </button>

        {/* Avatar section */}
        <div className="pt-6 pb-4 px-6 flex flex-col items-center">
          <div className="relative mb-3">
            <div
              className="rounded-full flex items-center justify-center font-bold text-lg"
              style={{
                width: 72, height: 72,
                backgroundColor: color + '20', color: color,
                border: `2.5px solid ${color}50`,
              }}
            >
              {employee.profile?.avatar_url ? (
                <img src={employee.profile.avatar_url} alt={name} className="w-full h-full rounded-full object-cover" />
              ) : (
                getInitials(name)
              )}
            </div>
            <div
              className="absolute bottom-0.5 right-0.5 rounded-full border-2 border-white"
              style={{ width: 14, height: 14, backgroundColor: STATUS_COLORS[status] }}
            />
          </div>
          <h2 className="text-lg font-bold text-gray-900 text-center">{name}</h2>
          <p className="text-sm text-gray-500 text-center mt-0.5">{title}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${getDeptBg(deptName)}`}>
              {deptName}
            </span>
            {employee.country && (
              <span className="text-[11px] text-gray-500">{employee.country}</span>
            )}
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center justify-center gap-6 py-3 border-b border-gray-100">
          {[MessageSquare, GitBranch, Video, Phone].map((Icon, i) => (
            <button key={i} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50 transition-colors">
              <Icon size={18} />
            </button>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100">
          {(['overview', 'contact', 'organization'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setPanelTab(tab)}
              className={`flex-1 py-3 text-xs font-medium text-center transition-colors ${
                panelTab === tab
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab === 'overview' ? 'Overview' : tab === 'contact' ? 'Contact' : 'Organization'}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="p-5">
          {panelTab === 'overview' && (
            <div className="space-y-4">
              <InfoRow icon={Calendar} label="Start Date" value={employee.hire_date || employee.hireDate || '2024-01-15'} />
              {manager && (
                <div className="flex items-start gap-3">
                  <User size={14} className="text-gray-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[11px] text-gray-400 uppercase tracking-wider font-medium">Manager</p>
                    <button
                      onClick={() => onNavigate(manager)}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      {manager.profile?.full_name}
                    </button>
                  </div>
                </div>
              )}
              <InfoRow icon={Building2} label="Department" value={deptName} />
              <InfoRow icon={Globe} label="Country" value={employee.country || 'N/A'} />
              <InfoRow icon={Users} label="Employment Type" value={employee.level || 'Full-time'} />
            </div>
          )}

          {panelTab === 'contact' && (
            <div className="space-y-4">
              <InfoRow icon={Mail} label="Work Email" value={employee.profile?.email || 'N/A'} />
              <InfoRow icon={Phone} label="Phone" value={employee.profile?.phone || 'Not available'} />
            </div>
          )}

          {panelTab === 'organization' && (
            <div>
              {/* Reporting chain */}
              <div className="space-y-0">
                {chain.map((emp: any, i: number) => {
                  const isSelected = emp.id === employee.id
                  const empName = emp.profile?.full_name || 'Unknown'
                  const empTitle = emp.job_title || ''
                  const empDept = deptMap.get(emp.department_id) || ''
                  const empColor = getDeptColor(empDept)

                  return (
                    <div key={emp.id}>
                      <div
                        className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-colors ${
                          isSelected ? 'bg-blue-50 border-l-[3px] border-blue-600' : 'hover:bg-gray-50 border-l-[3px] border-transparent'
                        }`}
                        style={{ marginLeft: i > 0 ? 0 : 0 }}
                        onClick={() => { if (!isSelected) onNavigate(emp) }}
                      >
                        <div
                          className="shrink-0 rounded-full flex items-center justify-center text-xs font-semibold"
                          style={{
                            width: 36, height: 36,
                            backgroundColor: empColor + '20', color: empColor,
                          }}
                        >
                          {getInitials(empName)}
                        </div>
                        <div className="min-w-0">
                          <p className={`text-sm truncate ${isSelected ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                            {empName}
                          </p>
                          <p className="text-[11px] text-gray-500 truncate">{empTitle}</p>
                        </div>
                      </div>
                      {/* Connector line */}
                      {i < chain.length - 1 && (
                        <div className="ml-[29px] w-[1.5px] h-2 bg-gray-200" />
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Direct Reports / Works With */}
              {directReports.length > 0 ? (
                <div className="mt-5">
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                    Direct Reports ({directReports.length})
                  </h4>
                  <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
                    {directReports.map((dr: any) => (
                      <PeerCard key={dr.id} employee={dr} deptMap={deptMap} onClick={() => onNavigate(dr)} />
                    ))}
                  </div>
                </div>
              ) : peers.length > 0 ? (
                <div className="mt-5">
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                    Works With ({peers.length})
                  </h4>
                  <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
                    {peers.map((p: any) => (
                      <PeerCard key={p.id} employee={p} deptMap={deptMap} onClick={() => onNavigate(p)} />
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

/* ================================================================
   SMALL UI HELPERS
   ================================================================ */
function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <Icon size={14} className="text-gray-400 mt-0.5 shrink-0" />
      <div>
        <p className="text-[11px] text-gray-400 uppercase tracking-wider font-medium">{label}</p>
        <p className="text-sm text-gray-900">{value}</p>
      </div>
    </div>
  )
}

function PeerCard({ employee, deptMap, onClick }: { employee: any; deptMap: Map<string, string>; onClick: () => void }) {
  const name = employee.profile?.full_name || 'Unknown'
  const title = employee.job_title || ''
  const deptName = deptMap.get(employee.department_id) || ''
  const color = getDeptColor(deptName)

  return (
    <button
      onClick={onClick}
      className="shrink-0 w-[120px] rounded-lg border border-gray-200 bg-white p-3 text-center hover:shadow-sm hover:border-gray-300 transition-all"
    >
      <div
        className="mx-auto rounded-full flex items-center justify-center text-xs font-semibold mb-1.5"
        style={{ width: 32, height: 32, backgroundColor: color + '20', color }}
      >
        {getInitials(name)}
      </div>
      <p className="text-xs font-medium text-gray-900 truncate">{name}</p>
      <p className="text-[10px] text-gray-500 truncate">{title}</p>
    </button>
  )
}

/* ================================================================
   MAIN ORG CHART COMPONENT
   ================================================================ */
export default function OrgChart() {
  const {
    employees, departments, updateEmployee, addEmployee, getDepartmentName,
    ensureModulesLoaded, addToast,
  } = useTempo()

  // Load modules
  useEffect(() => {
    ensureModulesLoaded?.(['employees', 'departments'])
  }, [ensureModulesLoaded])

  // ---------- State ----------
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [quickEditMode, setQuickEditMode] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [addParentId, setAddParentId] = useState('')
  const [showMoveModal, setShowMoveModal] = useState(false)
  const [moveSource, setMoveSource] = useState<any>(null)
  const [moveTarget, setMoveTarget] = useState<any>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)
  const [panelTab, setPanelTab] = useState<'overview' | 'contact' | 'organization'>('overview')
  const searchRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLDivElement>(null)

  const [addForm, setAddForm] = useState({
    full_name: '', email: '', job_title: '', level: 'Mid',
    department_id: '', country: 'Nigeria', role: 'employee',
  })

  // ---------- Build tree + dept map ----------
  const tree = useMemo(() => buildOrgTree(employees, departments), [employees, departments])

  const deptMap = useMemo(() => {
    const m = new Map<string, string>()
    departments.forEach((d: any) => m.set(d.id, d.name))
    return m
  }, [departments])

  const cleanEmployees = useMemo(() =>
    employees.filter((e: any) => !TEST_NAMES.some(t => (e.profile?.full_name || '').includes(t))),
  [employees])

  // Auto-expand root on first render and whenever tree root changes
  const rootExpandedRef = useRef(false)
  useEffect(() => {
    if (tree && !rootExpandedRef.current) {
      rootExpandedRef.current = true
      setExpandedNodes(new Set([tree.employee.id]))
    }
  }, [tree])

  // Focus search when opened
  useEffect(() => {
    if (showSearch && searchRef.current) searchRef.current.focus()
  }, [showSearch])

  // ---------- Search ----------
  const searchMatches = useMemo(() => {
    if (!searchQuery.trim()) return null
    const q = searchQuery.toLowerCase()
    const matching = new Set<string>()
    const ancestorIds = new Set<string>()

    cleanEmployees.forEach((emp: any) => {
      const n = (emp.profile?.full_name || '').toLowerCase()
      const t = (emp.job_title || '').toLowerCase()
      if (n.includes(q) || t.includes(q)) {
        matching.add(emp.id)
        // Walk up manager chain to find ancestors
        let cur = emp
        while (cur) {
          const mid = cur.managerId || cur.manager_id
          if (!mid) break
          ancestorIds.add(mid)
          cur = cleanEmployees.find((e: any) => e.id === mid)
        }
      }
    })

    // If no real manager chain, use tree chain
    if (ancestorIds.size === 0 && tree) {
      matching.forEach(id => {
        const chain = getReportingChain(tree, id)
        chain.forEach((e: any) => { if (e.id !== id) ancestorIds.add(e.id) })
      })
    }

    return { matching, ancestors: ancestorIds }
  }, [searchQuery, cleanEmployees, tree])

  const getOpacity = useCallback((id: string) => {
    if (!searchMatches) return 1
    if (searchMatches.matching.has(id) || searchMatches.ancestors.has(id)) return 1
    return 0.2
  }, [searchMatches])

  // ---------- Handlers ----------
  const toggleExpand = useCallback((id: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const selectEmployee = useCallback((emp: any) => {
    setSelectedEmployee(emp)
    setPanelTab('overview')
  }, [])

  const navigateToEmployee = useCallback((emp: any) => {
    if (!tree) return
    const chain = getReportingChain(tree, emp.id)
    setExpandedNodes(prev => {
      const next = new Set(prev)
      chain.forEach((e: any) => next.add(e.id))
      return next
    })
    setSelectedEmployee(emp)
    setPanelTab('organization')
  }, [tree])

  const handleDragStart = useCallback((e: React.DragEvent, emp: any) => {
    if (!quickEditMode) return
    e.dataTransfer.setData('text/plain', emp.id)
    setMoveSource(emp)
  }, [quickEditMode])

  const handleDragOver = useCallback((e: React.DragEvent, emp: any) => {
    if (!quickEditMode || !moveSource || moveSource.id === emp.id) return
    e.preventDefault()
    setDragOverId(emp.id)
  }, [quickEditMode, moveSource])

  const handleDragLeave = useCallback(() => setDragOverId(null), [])

  const handleDrop = useCallback((e: React.DragEvent, targetEmp: any) => {
    if (!quickEditMode || !moveSource || moveSource.id === targetEmp.id) return
    e.preventDefault()
    setDragOverId(null)
    setMoveTarget(targetEmp)
    setShowMoveModal(true)
  }, [quickEditMode, moveSource])

  const confirmMove = useCallback(() => {
    if (!moveSource || !moveTarget) return
    updateEmployee(moveSource.id, { managerId: moveTarget.id, manager_id: moveTarget.id })
    addToast(`${moveSource.profile?.full_name} now reports to ${moveTarget.profile?.full_name}`)
    setShowMoveModal(false)
    setMoveSource(null)
    setMoveTarget(null)
  }, [moveSource, moveTarget, updateEmployee, addToast])

  const handleAddPosition = useCallback((parentId: string) => {
    setAddParentId(parentId)
    const parent = employees.find((e: any) => e.id === parentId)
    setAddForm(f => ({ ...f, department_id: parent?.department_id || '' }))
    setShowAddModal(true)
  }, [employees])

  function submitAdd() {
    if (!addForm.full_name || !addForm.email) return
    addEmployee({
      full_name: addForm.full_name,
      profile: { full_name: addForm.full_name, email: addForm.email, avatar_url: null, phone: '' },
      email: addForm.email,
      job_title: addForm.job_title,
      level: addForm.level,
      department_id: addForm.department_id,
      country: addForm.country,
      role: addForm.role,
      managerId: addParentId,
      manager_id: addParentId,
    })
    addToast(`${addForm.full_name} added`)
    setShowAddModal(false)
    setAddForm({ full_name: '', email: '', job_title: '', level: 'Mid', department_id: '', country: 'Nigeria', role: 'employee' })
  }

  // ---------- Render ----------
  if (!tree) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-120px)] text-gray-400">
        <div className="text-center">
          <Users size={48} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">Loading organization chart...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-60px)] flex flex-col bg-white overflow-hidden">
      {/* ============ HEADER ============ */}
      <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white">
        <h1 className="text-2xl font-bold text-gray-900">Org Chart</h1>
        <div className="flex items-center gap-2">
          {/* Search */}
          {showSearch ? (
            <div className="flex items-center gap-2 bg-gray-50 rounded-full px-3 py-1.5 border border-gray-200">
              <Search size={14} className="text-gray-400" />
              <input
                ref={searchRef}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search people..."
                className="bg-transparent text-sm outline-none w-48 placeholder:text-gray-400"
              />
              {searchQuery && (
                <button onClick={() => { setSearchQuery(''); setShowSearch(false) }} className="text-gray-400 hover:text-gray-600">
                  <X size={14} />
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={() => setShowSearch(true)}
              className="p-2 rounded-full border border-gray-200 text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Search size={16} />
            </button>
          )}

          {/* Quick Edit */}
          <button
            onClick={() => setQuickEditMode(!quickEditMode)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              quickEditMode
                ? 'bg-blue-50 text-blue-700 border-blue-200'
                : 'text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
          >
            Quick Edit
          </button>
        </div>
      </div>

      {/* ============ CANVAS ============ */}
      <div ref={canvasRef} className="flex-1 overflow-auto">
        <div className="min-w-max p-8 pt-10 flex justify-center">
          <TreeNode
            node={tree}
            expandedNodes={expandedNodes}
            deptMap={deptMap}
            getOpacity={getOpacity}
            onToggle={toggleExpand}
            onSelect={selectEmployee}
            quickEdit={quickEditMode}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            dragOverId={dragOverId}
            onAddPosition={handleAddPosition}
          />
        </div>
      </div>

      {/* ============ PROFILE PANEL ============ */}
      {selectedEmployee && (
        <ProfilePanel
          employee={selectedEmployee}
          tree={tree}
          employees={cleanEmployees}
          departments={departments}
          deptMap={deptMap}
          onClose={() => setSelectedEmployee(null)}
          onNavigate={navigateToEmployee}
          panelTab={panelTab}
          setPanelTab={setPanelTab}
        />
      )}

      {/* ============ MOVE CONFIRMATION MODAL ============ */}
      <Modal open={showMoveModal} onClose={() => { setShowMoveModal(false); setMoveSource(null); setMoveTarget(null) }} title="Change Reporting Line">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Move <strong>{moveSource?.profile?.full_name}</strong> to report to <strong>{moveTarget?.profile?.full_name}</strong>?
          </p>
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" size="sm" onClick={() => { setShowMoveModal(false); setMoveSource(null); setMoveTarget(null) }}>
              Cancel
            </Button>
            <Button size="sm" onClick={confirmMove}>Confirm Move</Button>
          </div>
        </div>
      </Modal>

      {/* ============ ADD EMPLOYEE MODAL ============ */}
      <Modal open={showAddModal} onClose={() => setShowAddModal(false)} title="Add Position">
        <div className="space-y-3">
          <p className="text-xs text-gray-500 mb-2">
            Reports to: <strong>{employees.find((e: any) => e.id === addParentId)?.profile?.full_name || 'Unknown'}</strong>
          </p>
          <Input label="Full Name" value={addForm.full_name} onChange={e => setAddForm(f => ({ ...f, full_name: e.target.value }))} />
          <Input label="Email" value={addForm.email} onChange={e => setAddForm(f => ({ ...f, email: e.target.value }))} />
          <Input label="Job Title" value={addForm.job_title} onChange={e => setAddForm(f => ({ ...f, job_title: e.target.value }))} />
          <Select
            label="Level"
            value={addForm.level}
            onChange={e => setAddForm(f => ({ ...f, level: e.target.value }))}
            options={Object.keys(LEVEL_ORDER).map(l => ({ value: l, label: l }))}
          />
          <Select
            label="Department"
            value={addForm.department_id}
            onChange={e => setAddForm(f => ({ ...f, department_id: e.target.value }))}
            options={[{ value: '', label: 'Select...' }, ...departments.map((d: any) => ({ value: d.id, label: d.name }))]}
          />
          <Select
            label="Country"
            value={addForm.country}
            onChange={e => setAddForm(f => ({ ...f, country: e.target.value }))}
            options={['Nigeria', 'Ghana', 'Kenya', 'Senegal', "Cote d'Ivoire"].map(c => ({ value: c, label: c }))}
          />
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="ghost" size="sm" onClick={() => setShowAddModal(false)}>Cancel</Button>
            <Button size="sm" onClick={submitAdd}>Add Employee</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
