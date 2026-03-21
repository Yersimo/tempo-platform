'use client'

import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { Header } from '@/components/layout/header'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { StatCard } from '@/components/ui/stat-card'
import { Tabs } from '@/components/ui/tabs'
import { Modal } from '@/components/ui/modal'
import { Input, Textarea, Select } from '@/components/ui/input'
import { TempoLineChart, TempoDonutChart, TempoBarChart, CHART_COLORS } from '@/components/ui/charts'
import {
  Plus, Zap, Play, Pause, CheckCircle2, XCircle, AlertTriangle,
  Pencil, Trash2, Copy, Search, ChevronDown, ChevronRight,
  GitBranch, Mail, MessageSquare, ClipboardList, Monitor, Shield,
  Bell, Timer, Clock, LayoutTemplate, Eye, RotateCcw, Filter,
  UserPlus, UserMinus, ArrowUpRight, Building2, Star, FileText,
  DollarSign, Settings, Send, Users, Calendar, BookOpen,
  CircleDot, ArrowDown, Loader2, X, ZoomIn, ZoomOut,
  Globe, History, Undo2, Save, TestTube2, GripVertical,
  Diamond, Circle, Square, Hexagon, Workflow,
} from 'lucide-react'
import { useTempo } from '@/lib/store'
import { PageSkeleton } from '@/components/ui/page-skeleton'

// ============================================================
// CONSTANTS
// ============================================================

const TRIGGER_TYPES = [
  { value: 'employee_hired', label: 'Employee Hired', icon: UserPlus, color: 'text-emerald-400' },
  { value: 'employee_terminated', label: 'Employee Terminated', icon: UserMinus, color: 'text-red-400' },
  { value: 'role_changed', label: 'Role Changed', icon: ArrowUpRight, color: 'text-blue-400' },
  { value: 'department_changed', label: 'Department Changed', icon: Building2, color: 'text-purple-400' },
  { value: 'review_completed', label: 'Review Completed', icon: Star, color: 'text-amber-400' },
  { value: 'leave_approved', label: 'Leave Approved', icon: Calendar, color: 'text-cyan-400' },
  { value: 'expense_submitted', label: 'Expense Submitted', icon: FileText, color: 'text-orange-400' },
  { value: 'payroll_completed', label: 'Payroll Completed', icon: DollarSign, color: 'text-green-400' },
  { value: 'custom', label: 'Custom Trigger', icon: Settings, color: 'text-slate-400' },
  { value: 'scheduled', label: 'Scheduled (Cron/Date)', icon: Calendar, color: 'text-indigo-400' },
] as const

const ACTION_TYPES = [
  { value: 'send_email', label: 'Send Email', icon: Mail },
  { value: 'send_slack', label: 'Send Slack Message', icon: MessageSquare },
  { value: 'create_task', label: 'Create Task', icon: ClipboardList },
  { value: 'assign_app', label: 'Assign App', icon: Monitor },
  { value: 'revoke_app', label: 'Revoke App', icon: XCircle },
  { value: 'assign_device', label: 'Assign Device', icon: Monitor },
  { value: 'update_field', label: 'Update Field', icon: Pencil },
  { value: 'notify_manager', label: 'Notify Manager', icon: Bell },
  { value: 'add_to_group', label: 'Add to Group', icon: Users },
  { value: 'schedule_meeting', label: 'Schedule Meeting', icon: Calendar },
  { value: 'create_review', label: 'Create Review', icon: Star },
  { value: 'enroll_course', label: 'Enroll in Course', icon: BookOpen },
  { value: 'http_request', label: 'HTTP Request', icon: Globe },
] as const

const STEP_TYPES = [
  { value: 'action', label: 'Action', icon: Play, color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  { value: 'condition', label: 'Condition (If/Else)', icon: GitBranch, color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  { value: 'delay', label: 'Delay', icon: Timer, color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  { value: 'approval', label: 'Approval', icon: Shield, color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
] as const

const TEMPLATE_CATEGORIES = ['onboarding', 'offboarding', 'performance', 'it', 'finance'] as const

// Canvas node palette types for the visual builder
const NODE_PALETTE = [
  { type: 'trigger', label: 'Trigger', icon: Circle, bgColor: 'bg-emerald-500/20', borderColor: 'border-emerald-500/40', textColor: 'text-emerald-400', shape: 'circle' },
  { type: 'action', label: 'Action', icon: Square, bgColor: 'bg-blue-500/20', borderColor: 'border-blue-500/40', textColor: 'text-blue-400', shape: 'rect' },
  { type: 'condition', label: 'Condition', icon: Diamond, bgColor: 'bg-amber-500/20', borderColor: 'border-amber-500/40', textColor: 'text-amber-400', shape: 'diamond' },
  { type: 'delay', label: 'Delay', icon: Timer, bgColor: 'bg-gray-500/20', borderColor: 'border-gray-500/40', textColor: 'text-gray-400', shape: 'rect' },
  { type: 'approval', label: 'Approval', icon: Shield, bgColor: 'bg-orange-500/20', borderColor: 'border-orange-500/40', textColor: 'text-orange-400', shape: 'rect' },
  { type: 'end', label: 'End', icon: Hexagon, bgColor: 'bg-red-500/20', borderColor: 'border-red-500/40', textColor: 'text-red-400', shape: 'circle' },
] as const

// ============================================================
// HELPERS
// ============================================================

function getTriggerInfo(trigger: string) {
  return TRIGGER_TYPES.find(t => t.value === trigger) || TRIGGER_TYPES[8]
}

function getStepTypeInfo(type: string) {
  return STEP_TYPES.find(s => s.value === type) || STEP_TYPES[0]
}

function getActionInfo(actionType: string) {
  return ACTION_TYPES.find(a => a.value === actionType) || ACTION_TYPES[0]
}

function formatDuration(start: string, end?: string | null) {
  if (!end) return 'Running...'
  const ms = new Date(end).getTime() - new Date(start).getTime()
  if (ms < 60_000) return `${Math.round(ms / 1000)}s`
  if (ms < 3_600_000) return `${Math.round(ms / 60_000)}m`
  if (ms < 86_400_000) return `${(ms / 3_600_000).toFixed(1)}h`
  return `${Math.round(ms / 86_400_000)}d`
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatDateTime(d: string) {
  return new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getStepSummary(step: { type: string; config: any }) {
  const cfg = step.config || {}
  if (step.type === 'action') {
    const action = getActionInfo(cfg.actionType || '')
    if (cfg.actionType === 'http_request') return `HTTP ${cfg.method || 'POST'} ${cfg.url ? cfg.url.slice(0, 30) : ''}`
    return action.label
  }
  if (step.type === 'condition') {
    return cfg.label || `If ${cfg.field} ${cfg.operator} ${cfg.value}`
  }
  if (step.type === 'delay') {
    return `Wait ${cfg.duration} ${cfg.unit || 'hours'}`
  }
  if (step.type === 'approval') {
    return `Approval by ${cfg.approver || 'manager'}`
  }
  return 'Step'
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getStepIcon(step: { type: string; config: any }) {
  const cfg = step.config || {}
  if (step.type === 'action') {
    if (cfg.actionType === 'http_request') return <Globe size={14} />
    const action = ACTION_TYPES.find(a => a.value === cfg.actionType)
    if (action) {
      const Icon = action.icon
      return <Icon size={14} />
    }
  }
  const info = getStepTypeInfo(step.type)
  const Icon = info.icon
  return <Icon size={14} />
}

// ============================================================
// VISUAL WORKFLOW CANVAS COMPONENT
// ============================================================

interface CanvasNode {
  id: string
  type: string
  x: number
  y: number
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any
  connections: string[] // IDs of connected nodes
  trueBranch?: string | null
  falseBranch?: string | null
}

function WorkflowCanvas({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  workflow, steps, onNodeClick, onAddStep, onDeleteStep, onTestRun, onReorder,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  workflow: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  steps: any[]
  onNodeClick: (stepId: string | null) => void
  onAddStep: (afterIndex: number) => void
  onDeleteStep: (id: string) => void
  onTestRun: () => void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onReorder: (id: string, newIndex: number) => void
}) {
  const [zoom, setZoom] = useState(1)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const canvasRef = useRef<HTMLDivElement>(null)

  // Build visual nodes from steps
  const nodes: CanvasNode[] = useMemo(() => {
    const triggerNode: CanvasNode = {
      id: 'trigger',
      type: 'trigger',
      x: 300,
      y: 40,
      data: { label: getTriggerInfo(workflow.trigger).label, trigger: workflow.trigger },
      connections: steps.length > 0 ? [steps[0].id] : [],
    }

    const stepNodes: CanvasNode[] = steps.map((step, idx) => ({
      id: step.id,
      type: step.type,
      x: 300,
      y: 140 + idx * 120,
      data: { ...step, summary: getStepSummary(step) },
      connections: idx < steps.length - 1 ? [steps[idx + 1].id] : ['end'],
      trueBranch: step.nextStepOnTrue,
      falseBranch: step.nextStepOnFalse,
    }))

    const endNode: CanvasNode = {
      id: 'end',
      type: 'end',
      x: 300,
      y: 140 + steps.length * 120,
      data: { label: 'End' },
      connections: [],
    }

    return [triggerNode, ...stepNodes, endNode]
  }, [workflow, steps])

  const canvasHeight = Math.max(400, 200 + steps.length * 120)

  // SVG path between nodes
  function getConnectionPath(fromY: number, toY: number, fromX: number, toX: number): string {
    const midY = (fromY + toY) / 2
    return `M ${fromX} ${fromY} C ${fromX} ${midY}, ${toX} ${midY}, ${toX} ${toY}`
  }

  function handleDragStart(e: React.DragEvent, id: string) {
    setDraggingId(id)
    e.dataTransfer.effectAllowed = 'move'
  }

  function handleDragOver(e: React.DragEvent, idx: number) {
    e.preventDefault()
    setDragOverIndex(idx)
  }

  function handleDrop(e: React.DragEvent, targetIdx: number) {
    e.preventDefault()
    if (draggingId) {
      onReorder(draggingId, targetIdx)
    }
    setDraggingId(null)
    setDragOverIndex(null)
  }

  function handleDragEnd() {
    setDraggingId(null)
    setDragOverIndex(null)
  }

  const triggerInfo = getTriggerInfo(workflow.trigger)
  const TriggerIcon = triggerInfo.icon

  return (
    <div className="relative">
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Badge variant={workflow.isActive ? 'success' : 'default'}>{workflow.isActive ? 'Active' : 'Inactive'}</Badge>
          <span className="text-xs text-white/40">{steps.length} steps</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-lg p-0.5">
            <button onClick={() => setZoom(Math.max(0.5, zoom - 0.1))} className="p-1.5 hover:bg-white/10 rounded text-white/50 hover:text-white/80 transition-colors">
              <ZoomOut size={14} />
            </button>
            <span className="text-xs text-white/50 px-2 min-w-[40px] text-center">{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom(Math.min(1.5, zoom + 0.1))} className="p-1.5 hover:bg-white/10 rounded text-white/50 hover:text-white/80 transition-colors">
              <ZoomIn size={14} />
            </button>
          </div>
          <Button size="sm" variant="secondary" onClick={onTestRun}>
            <TestTube2 size={13} /> Test Run
          </Button>
        </div>
      </div>

      {/* Node Palette */}
      <div className="mb-4 p-3 bg-white/[0.02] border border-white/10 rounded-xl">
        <p className="text-[0.65rem] font-medium uppercase tracking-wider text-white/40 mb-2">Drag to add or click + between nodes</p>
        <div className="flex gap-2 flex-wrap">
          {NODE_PALETTE.filter(n => n.type !== 'trigger' && n.type !== 'end').map(node => {
            const Icon = node.icon
            return (
              <div
                key={node.type}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-grab active:cursor-grabbing transition-colors ${node.bgColor} ${node.borderColor}`}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('nodeType', node.type)
                }}
              >
                <Icon size={14} className={node.textColor} />
                <span className={`text-xs font-medium ${node.textColor}`}>{node.label}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Canvas */}
      <div
        ref={canvasRef}
        className="relative bg-white/[0.02] border border-white/10 rounded-xl overflow-hidden"
        style={{ minHeight: `${canvasHeight * zoom}px` }}
      >
        {/* Grid background */}
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
        }} />

        <div style={{ transform: `scale(${zoom})`, transformOrigin: 'top center', minHeight: canvasHeight }}>
          {/* SVG Connections */}
          <svg className="absolute inset-0 w-full" style={{ height: canvasHeight, pointerEvents: 'none' }}>
            <defs>
              <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto" fill="rgba(255,255,255,0.2)">
                <polygon points="0 0, 8 3, 0 6" />
              </marker>
              <marker id="arrowhead-true" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto" fill="rgba(16,185,129,0.4)">
                <polygon points="0 0, 8 3, 0 6" />
              </marker>
              <marker id="arrowhead-false" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto" fill="rgba(239,68,68,0.4)">
                <polygon points="0 0, 8 3, 0 6" />
              </marker>
            </defs>

            {nodes.map((node, idx) => {
              if (idx >= nodes.length - 1) return null
              const nextNode = nodes[idx + 1]
              if (!nextNode) return null

              const fromY = node.y + 40
              const toY = nextNode.y
              const centerX = 400

              if (node.type === 'condition') {
                // Draw branching paths
                return (
                  <g key={`conn-${node.id}`}>
                    {/* True branch (left) */}
                    <path
                      d={`M ${centerX - 40} ${fromY} L ${centerX - 80} ${fromY + 20} L ${centerX - 80} ${fromY + 40} L ${centerX} ${toY}`}
                      fill="none"
                      stroke="rgba(16,185,129,0.3)"
                      strokeWidth="2"
                      strokeDasharray="4,4"
                      markerEnd="url(#arrowhead-true)"
                    />
                    <text x={centerX - 90} y={fromY + 30} fill="rgba(16,185,129,0.6)" fontSize="9" fontWeight="500">True</text>

                    {/* False branch (right) */}
                    <path
                      d={`M ${centerX + 40} ${fromY} L ${centerX + 80} ${fromY + 20} L ${centerX + 80} ${fromY + 40} L ${centerX} ${toY}`}
                      fill="none"
                      stroke="rgba(239,68,68,0.3)"
                      strokeWidth="2"
                      strokeDasharray="4,4"
                      markerEnd="url(#arrowhead-false)"
                    />
                    <text x={centerX + 60} y={fromY + 30} fill="rgba(239,68,68,0.6)" fontSize="9" fontWeight="500">False</text>
                  </g>
                )
              }

              return (
                <path
                  key={`conn-${node.id}`}
                  d={getConnectionPath(fromY, toY, centerX, centerX)}
                  fill="none"
                  stroke="rgba(255,255,255,0.15)"
                  strokeWidth="2"
                  markerEnd="url(#arrowhead)"
                />
              )
            })}
          </svg>

          {/* Nodes */}
          {nodes.map((node, idx) => {
            const centerX = 400

            // Trigger node
            if (node.type === 'trigger') {
              return (
                <div
                  key={node.id}
                  className="absolute flex flex-col items-center"
                  style={{ left: centerX - 120, top: node.y, width: 240 }}
                >
                  <div className="w-full p-4 rounded-xl bg-emerald-500/10 border-2 border-emerald-500/30 backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                        <TriggerIcon size={18} className="text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-[0.6rem] font-medium uppercase tracking-wider text-emerald-400/60">Trigger</p>
                        <p className="text-sm font-medium text-white">{node.data.label}</p>
                      </div>
                    </div>
                  </div>
                  {/* Add button */}
                  {steps.length === 0 && (
                    <button
                      onClick={() => onAddStep(-1)}
                      className="mt-3 flex items-center gap-2 px-4 py-2 bg-white/5 border border-dashed border-white/20 rounded-lg text-xs text-white/50 hover:text-white hover:border-white/40 transition-colors"
                    >
                      <Plus size={14} /> Add First Step
                    </button>
                  )}
                </div>
              )
            }

            // End node
            if (node.type === 'end') {
              return (
                <div
                  key={node.id}
                  className="absolute flex justify-center"
                  style={{ left: centerX - 60, top: node.y, width: 120 }}
                >
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-red-500/10 border-2 border-red-500/30 flex items-center justify-center">
                      <CheckCircle2 size={16} className="text-red-400/60" />
                    </div>
                    <p className="text-xs text-white/30 mt-1">End</p>
                  </div>
                </div>
              )
            }

            // Step nodes
            const stepIdx = idx - 1
            const typeInfo = getStepTypeInfo(node.type)
            const isCondition = node.type === 'condition'

            return (
              <div
                key={node.id}
                className="absolute"
                style={{ left: centerX - 150, top: node.y, width: 300 }}
              >
                {/* Drop zone indicator */}
                {dragOverIndex === stepIdx && (
                  <div className="absolute -top-2 left-0 right-0 h-1 bg-tempo-600 rounded-full" />
                )}

                <div
                  className={`relative p-4 rounded-xl border-2 cursor-pointer hover:border-white/30 transition-all backdrop-blur-sm ${
                    isCondition ? 'bg-amber-500/5 border-amber-500/20' :
                    node.type === 'delay' ? 'bg-gray-500/5 border-gray-500/20' :
                    node.type === 'approval' ? 'bg-purple-500/5 border-purple-500/20' :
                    'bg-blue-500/5 border-blue-500/20'
                  } ${draggingId === node.id ? 'opacity-50' : ''}`}
                  onClick={() => onNodeClick(node.id)}
                  draggable
                  onDragStart={(e) => handleDragStart(e, node.id)}
                  onDragOver={(e) => handleDragOver(e, stepIdx)}
                  onDrop={(e) => handleDrop(e, stepIdx)}
                  onDragEnd={handleDragEnd}
                >
                  {/* Drag handle */}
                  <div className="absolute -left-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab">
                    <GripVertical size={14} className="text-white/20" />
                  </div>

                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${typeInfo.color.split(' ').slice(0, 2).join(' ')}`}>
                        {getStepIcon(node.data)}
                      </div>
                      <div>
                        <p className="text-[0.6rem] font-medium uppercase tracking-wider text-white/40">{typeInfo.label}</p>
                        <p className="text-sm font-medium text-white">{node.data.summary}</p>
                        {node.data.config?.to && <p className="text-xs text-white/40 mt-0.5">To: {node.data.config.to}</p>}
                        {node.data.config?.actionType === 'http_request' && node.data.config?.url && (
                          <p className="text-xs text-white/40 mt-0.5">{node.data.config.method || 'POST'}: {node.data.config.url}</p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); onDeleteStep(node.id) }}
                      className="p-1 text-white/20 hover:text-red-400 rounded transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>

                  {/* Condition branches indicator */}
                  {isCondition && (
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <div className="flex items-center gap-1.5 text-xs">
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="text-emerald-400">True</span>
                        <ChevronRight size={12} className="text-white/30" />
                        <span className="text-white/50">Continue</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs">
                        <div className="w-2 h-2 rounded-full bg-red-500" />
                        <span className="text-red-400">False</span>
                        <ChevronRight size={12} className="text-white/30" />
                        <span className="text-white/50">Skip</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Add step between button */}
                <div className="flex justify-center mt-2">
                  <button
                    onClick={() => onAddStep(stepIdx)}
                    className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/30 hover:text-white hover:border-white/30 hover:bg-white/10 transition-colors"
                    title="Add step"
                    onDragOver={(e) => { e.preventDefault(); setDragOverIndex(stepIdx + 1) }}
                    onDrop={(e) => {
                      e.preventDefault()
                      const nodeType = e.dataTransfer.getData('nodeType')
                      if (nodeType) {
                        onAddStep(stepIdx)
                      }
                      setDragOverIndex(null)
                    }}
                  >
                    <Plus size={12} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ============================================================
// MAIN PAGE COMPONENT
// ============================================================

export default function WorkflowsPage() {
  const {
    automationWorkflows, automationWorkflowSteps, automationWorkflowRuns,
    automationWorkflowRunSteps, automationWorkflowTemplates,
    addAutomationWorkflow, updateAutomationWorkflow, deleteAutomationWorkflow,
    addAutomationWorkflowStep, updateAutomationWorkflowStep, deleteAutomationWorkflowStep,
    addAutomationWorkflowRun,
    getEmployeeName, currentEmployeeId,
    addToast,
    ensureModulesLoaded,
  } = useTempo()

  const [pageLoading, setPageLoading] = useState(true)

  useEffect(() => {
    ensureModulesLoaded?.(['automationWorkflows', 'automationWorkflowSteps', 'automationWorkflowRuns'])?.then?.(() => setPageLoading(false))?.catch?.(() => setPageLoading(false))
    const t = setTimeout(() => setPageLoading(false), 2000)
    return () => clearTimeout(t)
  }, [])

  const [activeTab, setActiveTab] = useState('list')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(null)
  const [viewingRunId, setViewingRunId] = useState<string | null>(null)

  // Modals
  const [showWorkflowModal, setShowWorkflowModal] = useState(false)
  const [editingWorkflowId, setEditingWorkflowId] = useState<string | null>(null)
  const [workflowForm, setWorkflowForm] = useState({
    name: '', description: '', trigger: 'employee_hired' as string, isActive: false,
    slaHours: '',
  })

  const [showStepModal, setShowStepModal] = useState(false)
  const [editingStepId, setEditingStepId] = useState<string | null>(null)
  const [insertAfterIndex, setInsertAfterIndex] = useState(-1)
  const [stepForm, setStepForm] = useState({
    type: 'action' as string,
    actionType: 'send_email' as string,
    to: '', subject: '', body: '', apps: '', channel: '', message: '',
    title: '', assignTo: '', dueInDays: '7', field: '', value: '',
    group: '', with: '', reviewType: 'probation', courses: '',
    deviceType: 'laptop', specs: '',
    condField: '', operator: 'equals' as string, condValue: '', condLabel: '',
    duration: '1', unit: 'hours' as string,
    approver: '', approvalMessage: '',
    // HTTP action
    httpUrl: '', httpMethod: 'POST', httpHeaders: '', httpBody: '',
  })

  const [saving, setSaving] = useState(false)
  const [confirmAction, setConfirmAction] = useState<{show:boolean, type:string, id:string, label:string}|null>(null)

  // Run history filters
  const [runFilterWorkflow, setRunFilterWorkflow] = useState('')
  const [runFilterStatus, setRunFilterStatus] = useState('')

  // Template filter
  const [templateCategory, setTemplateCategory] = useState('')

  // Version history
  const [showVersionHistory, setShowVersionHistory] = useState(false)
  const [versions] = useState([
    { id: 'v3', version: 3, date: '2026-03-20', author: 'Sarah Chen', changes: 'Added Slack notification step' },
    { id: 'v2', version: 2, date: '2026-03-15', author: 'Alex Kim', changes: 'Added approval step' },
    { id: 'v1', version: 1, date: '2026-03-10', author: 'Sarah Chen', changes: 'Initial version' },
  ])

  // ---- Computed ----
  const tabs = [
    { id: 'list', label: 'Workflows', count: automationWorkflows.length },
    { id: 'builder', label: 'Visual Builder' },
    { id: 'history', label: 'Run History', count: automationWorkflowRuns.length },
    { id: 'templates', label: 'Templates', count: automationWorkflowTemplates.length },
    { id: 'analytics', label: 'Analytics' },
  ]

  const activeWorkflowCount = automationWorkflows.filter((w: any) => w.isActive).length
  const completedRuns = automationWorkflowRuns.filter((r: any) => r.status === 'completed').length
  const failedRuns = automationWorkflowRuns.filter((r: any) => r.status === 'failed').length
  const runningRuns = automationWorkflowRuns.filter((r: any) => r.status === 'running').length
  const successRate = automationWorkflowRuns.length > 0
    ? Math.round((completedRuns / automationWorkflowRuns.length) * 100) : 0

  const filteredWorkflows = useMemo(() => {
    if (!searchQuery) return automationWorkflows
    const q = searchQuery.toLowerCase()
    return automationWorkflows.filter((w: any) =>
      w.name.toLowerCase().includes(q) ||
      (w.description || '').toLowerCase().includes(q) ||
      w.trigger.toLowerCase().includes(q)
    )
  }, [automationWorkflows, searchQuery])

  const selectedWorkflow = automationWorkflows.find((w: any) => w.id === selectedWorkflowId)
  const selectedSteps = useMemo(() =>
    automationWorkflowSteps
      .filter((s: any) => s.workflowId === selectedWorkflowId)
      .sort((a: any, b: any) => a.orderIndex - b.orderIndex),
    [automationWorkflowSteps, selectedWorkflowId]
  )

  const filteredRuns = useMemo(() => {
    let runs = [...automationWorkflowRuns]
    if (runFilterWorkflow) runs = runs.filter((r: any) => r.workflowId === runFilterWorkflow)
    if (runFilterStatus) runs = runs.filter((r: any) => r.status === runFilterStatus)
    return runs.sort((a: any, b: any) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
  }, [automationWorkflowRuns, runFilterWorkflow, runFilterStatus])

  const viewingRun = automationWorkflowRuns.find((r: any) => r.id === viewingRunId)
  const viewingRunSteps = useMemo(() =>
    automationWorkflowRunSteps.filter((s: any) => s.runId === viewingRunId),
    [automationWorkflowRunSteps, viewingRunId]
  )

  const filteredTemplates = useMemo(() => {
    if (!templateCategory) return automationWorkflowTemplates
    return automationWorkflowTemplates.filter((t: any) => t.category === templateCategory)
  }, [automationWorkflowTemplates, templateCategory])

  // Analytics data
  const runTrendData = useMemo(() => {
    const months = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb']
    return months.map((m, i) => ({
      name: m,
      runs: [3, 5, 8, 12, automationWorkflowRuns.length][i] || 0,
    }))
  }, [automationWorkflowRuns.length])

  const statusDistribution = useMemo(() => [
    { name: 'Completed', value: completedRuns },
    { name: 'Running', value: runningRuns },
    { name: 'Failed', value: failedRuns },
    { name: 'Cancelled', value: automationWorkflowRuns.filter((r: any) => r.status === 'cancelled').length },
  ], [completedRuns, runningRuns, failedRuns, automationWorkflowRuns])

  const workflowRunCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    automationWorkflowRuns.forEach((r: any) => { counts[r.workflowId] = (counts[r.workflowId] || 0) + 1 })
    return automationWorkflows
      .map((w: any) => ({ name: w.name.length > 20 ? w.name.slice(0, 18) + '...' : w.name, runs: counts[w.id] || 0 }))
      .sort((a: any, b: any) => b.runs - a.runs)
      .slice(0, 6)
  }, [automationWorkflows, automationWorkflowRuns])

  const avgDurations = useMemo(() => {
    const durations: Record<string, number[]> = {}
    automationWorkflowRuns.filter((r: any) => r.completedAt).forEach((r: any) => {
      const ms = new Date(r.completedAt!).getTime() - new Date(r.startedAt).getTime()
      if (!durations[r.workflowId]) durations[r.workflowId] = []
      durations[r.workflowId].push(ms)
    })
    return automationWorkflows
      .map((w: any) => {
        const d = durations[w.id]
        const avg = d && d.length > 0 ? d.reduce((a: number, b: number) => a + b, 0) / d.length : 0
        return { name: w.name.length > 20 ? w.name.slice(0, 18) + '...' : w.name, duration: Math.round(avg / 60_000) }
      })
      .filter((d: any) => d.duration > 0)
      .sort((a: any, b: any) => b.duration - a.duration)
  }, [automationWorkflows, automationWorkflowRuns])

  // ---- CRUD Handlers ----
  function openNewWorkflow() {
    setEditingWorkflowId(null)
    setWorkflowForm({ name: '', description: '', trigger: 'employee_hired', isActive: false, slaHours: '' })
    setShowWorkflowModal(true)
  }

  function openEditWorkflow(id: string) {
    const w = automationWorkflows.find((x: any) => x.id === id)
    if (!w) return
    setEditingWorkflowId(id)
    setWorkflowForm({ name: w.name, description: w.description || '', trigger: w.trigger, isActive: w.isActive, slaHours: (w as any).slaHours ? String((w as any).slaHours) : '' })
    setShowWorkflowModal(true)
  }

  function submitWorkflow() {
    if (!workflowForm.name.trim()) { addToast('Workflow name is required', 'error'); return }
    setSaving(true)
    try {
      const payload = { ...workflowForm, slaHours: workflowForm.slaHours ? Number(workflowForm.slaHours) : null }
      if (editingWorkflowId) {
        updateAutomationWorkflow(editingWorkflowId, payload)
      } else {
        const newId = addAutomationWorkflow({ ...payload, createdBy: currentEmployeeId })
        setSelectedWorkflowId(newId)
        setActiveTab('builder')
      }
      setShowWorkflowModal(false)
      addToast(editingWorkflowId ? 'Workflow updated' : 'Workflow created')
    } finally { setSaving(false) }
  }

  function duplicateWorkflow(id: string) {
    const w = automationWorkflows.find((x: any) => x.id === id)
    if (!w) return
    const newId = addAutomationWorkflow({
      name: `${w.name} (Copy)`, description: w.description, trigger: w.trigger,
      triggerConfig: w.triggerConfig, isActive: false, createdBy: currentEmployeeId,
    })
    const steps = automationWorkflowSteps.filter((s: any) => s.workflowId === id).sort((a: any, b: any) => a.orderIndex - b.orderIndex)
    steps.forEach((s: any, i: number) => {
      addAutomationWorkflowStep({
        workflowId: newId, orderIndex: i, type: s.type, config: s.config,
        nextStepOnTrue: null, nextStepOnFalse: null,
      })
    })
    addToast('Workflow duplicated')
  }

  function toggleWorkflowActive(id: string) {
    const w = automationWorkflows.find((x: any) => x.id === id)
    if (!w) return
    updateAutomationWorkflow(id, { isActive: !w.isActive })
  }

  // Step modal
  function openNewStep(afterIndex: number) {
    if (!selectedWorkflowId) return
    setEditingStepId(null)
    setInsertAfterIndex(afterIndex)
    setStepForm({
      type: 'action', actionType: 'send_email',
      to: '', subject: '', body: '', apps: '', channel: '', message: '',
      title: '', assignTo: '', dueInDays: '7', field: '', value: '',
      group: '', with: '', reviewType: 'probation', courses: '',
      deviceType: 'laptop', specs: '',
      condField: '', operator: 'equals', condValue: '', condLabel: '',
      duration: '1', unit: 'hours',
      approver: '', approvalMessage: '',
      httpUrl: '', httpMethod: 'POST', httpHeaders: '', httpBody: '',
    })
    setShowStepModal(true)
  }

  function openEditStep(id: string) {
    const s = automationWorkflowSteps.find((x: any) => x.id === id)
    if (!s) return
    setEditingStepId(id)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cfg = (s.config || {}) as any
    setStepForm({
      type: s.type, actionType: cfg.actionType || 'send_email',
      to: cfg.to || '', subject: cfg.subject || '', body: cfg.body || '',
      apps: Array.isArray(cfg.apps) ? cfg.apps.join(', ') : (cfg.apps || ''),
      channel: cfg.channel || '', message: cfg.message || '',
      title: cfg.title || '', assignTo: cfg.assignTo || '', dueInDays: String(cfg.dueInDays || '7'),
      field: cfg.field || '', value: String(cfg.value || ''),
      group: cfg.group || '', with: cfg.with || '',
      reviewType: cfg.reviewType || 'probation',
      courses: Array.isArray(cfg.courses) ? cfg.courses.join(', ') : (cfg.courses || ''),
      deviceType: cfg.deviceType || 'laptop', specs: cfg.specs || '',
      condField: cfg.field || '', operator: cfg.operator || 'equals',
      condValue: String(cfg.value || ''), condLabel: cfg.label || '',
      duration: String(cfg.duration || '1'), unit: cfg.unit || 'hours',
      approver: cfg.approver || '', approvalMessage: cfg.message || '',
      httpUrl: cfg.url || '', httpMethod: cfg.method || 'POST',
      httpHeaders: cfg.headers ? JSON.stringify(cfg.headers) : '',
      httpBody: cfg.requestBody || '',
    })
    setShowStepModal(true)
  }

  function buildStepConfig(): Record<string, unknown> {
    if (stepForm.type === 'action') {
      const base: Record<string, unknown> = { actionType: stepForm.actionType }
      switch (stepForm.actionType) {
        case 'send_email': return { ...base, to: stepForm.to, subject: stepForm.subject, body: stepForm.body }
        case 'send_slack': return { ...base, channel: stepForm.channel, message: stepForm.message }
        case 'create_task': return { ...base, title: stepForm.title, assignTo: stepForm.assignTo }
        case 'assign_app': return { ...base, apps: stepForm.apps.split(',').map(s => s.trim()).filter(Boolean) }
        case 'revoke_app': return { ...base, apps: stepForm.apps.split(',').map(s => s.trim()).filter(Boolean) }
        case 'assign_device': return { ...base, deviceType: stepForm.deviceType, specs: stepForm.specs }
        case 'update_field': return { ...base, field: stepForm.field, value: stepForm.value }
        case 'notify_manager': return { ...base, message: stepForm.message }
        case 'add_to_group': return { ...base, group: stepForm.group }
        case 'schedule_meeting': return { ...base, title: stepForm.title, with: stepForm.with, dueInDays: parseInt(stepForm.dueInDays) }
        case 'create_review': return { ...base, reviewType: stepForm.reviewType, dueInDays: parseInt(stepForm.dueInDays) }
        case 'enroll_course': return { ...base, courses: stepForm.courses.split(',').map(s => s.trim()).filter(Boolean) }
        case 'http_request': {
          let headers = {}
          try { headers = stepForm.httpHeaders ? JSON.parse(stepForm.httpHeaders) : {} } catch { /* */ }
          return { ...base, url: stepForm.httpUrl, method: stepForm.httpMethod, headers, requestBody: stepForm.httpBody }
        }
        default: return base
      }
    }
    if (stepForm.type === 'condition') {
      return { field: stepForm.condField, operator: stepForm.operator, value: stepForm.condValue, label: stepForm.condLabel || `${stepForm.condField} ${stepForm.operator} ${stepForm.condValue}` }
    }
    if (stepForm.type === 'delay') {
      return { duration: parseInt(stepForm.duration), unit: stepForm.unit }
    }
    if (stepForm.type === 'approval') {
      return { approver: stepForm.approver, message: stepForm.approvalMessage }
    }
    return {}
  }

  function submitStep() {
    if (!selectedWorkflowId) return
    if (stepForm.type === 'action') {
      if (stepForm.actionType === 'send_email' && !stepForm.to.trim()) { addToast('Recipient is required', 'error'); return }
      if (stepForm.actionType === 'send_slack' && !stepForm.channel.trim()) { addToast('Channel is required', 'error'); return }
      if (stepForm.actionType === 'http_request' && !stepForm.httpUrl.trim()) { addToast('URL is required', 'error'); return }
    }
    if (stepForm.type === 'condition' && !stepForm.condField.trim()) { addToast('Condition field is required', 'error'); return }
    if (stepForm.type === 'approval' && !stepForm.approver.trim()) { addToast('Approver is required', 'error'); return }
    setSaving(true)
    try {
      const config = buildStepConfig()
      if (editingStepId) {
        updateAutomationWorkflowStep(editingStepId, { type: stepForm.type, config })
      } else {
        const newIndex = insertAfterIndex + 1
        selectedSteps.filter((s: any) => s.orderIndex >= newIndex).forEach((s: any) => {
          updateAutomationWorkflowStep(s.id, { orderIndex: s.orderIndex + 1 })
        })
        addAutomationWorkflowStep({
          workflowId: selectedWorkflowId, orderIndex: newIndex, type: stepForm.type,
          config, nextStepOnTrue: null, nextStepOnFalse: null,
        })
      }
      setShowStepModal(false)
      addToast(editingStepId ? 'Step updated' : 'Step added')
    } finally { setSaving(false) }
  }

  function removeStep(id: string) {
    const step = automationWorkflowSteps.find((s: any) => s.id === id)
    if (!step) return
    deleteAutomationWorkflowStep(id)
    automationWorkflowSteps
      .filter((s: any) => s.workflowId === step.workflowId && s.id !== id && s.orderIndex > step.orderIndex)
      .forEach((s: any) => updateAutomationWorkflowStep(s.id, { orderIndex: s.orderIndex - 1 }))
  }

  function handleReorder(id: string, newIndex: number) {
    const step = automationWorkflowSteps.find((s: any) => s.id === id)
    if (!step) return
    const currentIndex = step.orderIndex
    if (currentIndex === newIndex) return

    // Shift other steps
    selectedSteps.forEach((s: any) => {
      if (s.id === id) return
      if (currentIndex < newIndex) {
        if (s.orderIndex > currentIndex && s.orderIndex <= newIndex) {
          updateAutomationWorkflowStep(s.id, { orderIndex: s.orderIndex - 1 })
        }
      } else {
        if (s.orderIndex >= newIndex && s.orderIndex < currentIndex) {
          updateAutomationWorkflowStep(s.id, { orderIndex: s.orderIndex + 1 })
        }
      }
    })
    updateAutomationWorkflowStep(id, { orderIndex: newIndex })
    addToast('Step reordered')
  }

  const testWorkflow = useCallback(() => {
    if (!selectedWorkflowId) return
    addAutomationWorkflowRun({
      workflowId: selectedWorkflowId,
      triggeredBy: 'test (dry run)',
      triggerData: { employee_name: 'Test Employee', department: 'Test Dept', test: true },
      status: 'completed',
      completedAt: new Date().toISOString(),
      error: null,
    })
    addToast('Test run completed')
    setActiveTab('history')
  }, [selectedWorkflowId, addAutomationWorkflowRun, addToast])

  function useTemplate(templateId: string) {
    const template = automationWorkflowTemplates.find((t: any) => t.id === templateId)
    if (!template) return
    const newId = addAutomationWorkflow({
      name: template.name, description: template.description, trigger: template.trigger,
      triggerConfig: {}, isActive: false, createdBy: currentEmployeeId,
    })
    setSelectedWorkflowId(newId)
    setActiveTab('builder')
    addToast(`Workflow created from template: ${template.name}`)
  }

  function reRunWorkflow(runId: string) {
    const run = automationWorkflowRuns.find((r: any) => r.id === runId)
    if (!run) return
    addAutomationWorkflowRun({
      workflowId: run.workflowId,
      triggeredBy: `re-run by ${getEmployeeName(currentEmployeeId)}`,
      triggerData: run.triggerData,
      status: 'completed', completedAt: new Date().toISOString(), error: null,
    })
    addToast('Workflow re-run completed')
  }

  function executeConfirmAction() {
    if (!confirmAction) return
    if (confirmAction.type === 'delete_workflow') {
      deleteAutomationWorkflow(confirmAction.id)
      if (selectedWorkflowId === confirmAction.id) setSelectedWorkflowId(null)
      addToast('Workflow deleted')
    }
    if (confirmAction.type === 'delete_step') {
      removeStep(confirmAction.id)
      addToast('Step removed')
    }
    if (confirmAction.type === 'deactivate_workflow') {
      updateAutomationWorkflow(confirmAction.id, { isActive: false })
      addToast('Workflow deactivated')
    }
    setConfirmAction(null)
  }

  // ============================================================
  // RENDER
  // ============================================================

  if (pageLoading) {
    return (
      <>
        <Header
          title="Workflow Automation"
          subtitle="Design, build, and automate HR workflows with a visual drag-and-drop builder"
          actions={<Button size="sm" disabled><Plus size={14} /> New Workflow</Button>}
        />
        <div className="p-6"><PageSkeleton /></div>
      </>
    )
  }

  return (
    <>
      <Header
        title="Workflow Automation"
        subtitle="Design, build, and automate HR workflows with a visual drag-and-drop builder"
        actions={
          <Button size="sm" onClick={openNewWorkflow}><Plus size={14} /> New Workflow</Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Workflows" value={automationWorkflows.length} change={`${activeWorkflowCount} active`} changeType="neutral" icon={<Zap size={20} />} />
        <StatCard label="Active Workflows" value={activeWorkflowCount} icon={<Play size={20} />} />
        <StatCard label="Total Runs" value={automationWorkflowRuns.length} change={`${runningRuns} running`} changeType="neutral" icon={<Clock size={20} />} />
        <StatCard label="Success Rate" value={`${successRate}%`} changeType={successRate >= 80 ? 'positive' : 'negative'} icon={<CheckCircle2 size={20} />} />
      </div>

      <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} className="mb-6" />

      {/* ==================== WORKFLOWS LIST ==================== */}
      {activeTab === 'list' && (
        <div className="space-y-4">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              placeholder="Search workflows..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/20"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredWorkflows.map((wf: any) => {
              const trigger = getTriggerInfo(wf.trigger)
              const TriggerIcon = trigger.icon
              const steps = automationWorkflowSteps.filter((s: any) => s.workflowId === wf.id)
              const runs = automationWorkflowRuns.filter((r: any) => r.workflowId === wf.id)
              const lastRun = runs.length > 0 ? runs.sort((a: any, b: any) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())[0] : null

              return (
                <Card
                  key={wf.id}
                  className="group hover:border-white/20 transition-all cursor-pointer"
                  onClick={() => { setSelectedWorkflowId(wf.id); setActiveTab('builder') }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                      <TriggerIcon size={16} className={trigger.color} />
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={e => { e.stopPropagation(); toggleWorkflowActive(wf.id) }}
                        className={`px-2 py-0.5 rounded-full text-[0.65rem] font-medium transition-colors ${wf.isActive ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}>
                        {wf.isActive ? 'Active' : 'Inactive'}
                      </button>
                      <button onClick={e => { e.stopPropagation(); duplicateWorkflow(wf.id) }} className="p-1 text-white/30 hover:text-white/60 rounded" title="Duplicate"><Copy size={13} /></button>
                      <button onClick={e => { e.stopPropagation(); openEditWorkflow(wf.id) }} className="p-1 text-white/30 hover:text-white/60 rounded" title="Edit"><Pencil size={13} /></button>
                      <button onClick={e => { e.stopPropagation(); setConfirmAction({ show: true, type: 'delete_workflow', id: wf.id, label: `Delete "${wf.name}"` }) }} className="p-1 text-white/30 hover:text-red-400 rounded" title="Delete"><Trash2 size={13} /></button>
                    </div>
                  </div>
                  <h3 className="text-sm font-medium text-white mb-1">{wf.name}</h3>
                  {wf.description && <p className="text-xs text-white/50 line-clamp-2 mb-3">{wf.description}</p>}
                  <div className="flex items-center gap-3 text-xs text-white/40">
                    <Badge variant="info">{trigger.label}</Badge>
                    <span>{steps.length} steps</span>
                    <span>{runs.length} runs</span>
                  </div>
                  {lastRun && (
                    <div className="mt-2 pt-2 border-t border-white/5 flex items-center gap-2 text-xs text-white/40">
                      <span>Last:</span>
                      <Badge variant={lastRun.status === 'completed' ? 'success' : lastRun.status === 'failed' ? 'error' : 'info'}>{lastRun.status}</Badge>
                      <span>{formatDate(lastRun.startedAt)}</span>
                    </div>
                  )}
                </Card>
              )
            })}
            {filteredWorkflows.length === 0 && (
              <div className="col-span-full py-12 text-center text-sm text-white/40">
                {searchQuery ? 'No workflows match your search.' : 'No workflows yet. Create your first workflow to get started.'}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== VISUAL BUILDER ==================== */}
      {activeTab === 'builder' && (
        <div className="space-y-4">
          {!selectedWorkflow ? (
            <Card className="py-16 text-center">
              <Workflow size={32} className="mx-auto text-white/20 mb-3" />
              <p className="text-sm text-white/50 mb-4">Select a workflow from the list or create a new one to start building.</p>
              <Button size="sm" onClick={openNewWorkflow}><Plus size={14} /> New Workflow</Button>
            </Card>
          ) : (
            <>
              {/* Workflow Header */}
              <Card>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                      {(() => { const t = getTriggerInfo(selectedWorkflow.trigger); const I = t.icon; return <I size={18} className={t.color} /> })()}
                    </div>
                    <div>
                      <h2 className="text-base font-semibold text-white">{selectedWorkflow.name}</h2>
                      <p className="text-xs text-white/50">{selectedWorkflow.description}</p>
                      {(selectedWorkflow as any).slaHours && (
                        <p className="text-xs text-amber-400 mt-0.5 flex items-center gap-1">
                          <Timer size={10} /> SLA: {(selectedWorkflow as any).slaHours}h
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="secondary" onClick={() => setShowVersionHistory(true)}>
                      <History size={13} /> Versions
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => openEditWorkflow(selectedWorkflow.id)}>
                      <Pencil size={13} /> Edit
                    </Button>
                    <Button size="sm" onClick={() => { updateAutomationWorkflow(selectedWorkflow.id, { isActive: true }); addToast('Workflow activated') }}>
                      <Zap size={13} /> {selectedWorkflow.isActive ? 'Active' : 'Activate'}
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Visual Canvas */}
              <WorkflowCanvas
                workflow={selectedWorkflow}
                steps={selectedSteps}
                onNodeClick={(stepId) => { if (stepId && stepId !== 'trigger' && stepId !== 'end') openEditStep(stepId) }}
                onAddStep={(afterIndex) => openNewStep(afterIndex)}
                onDeleteStep={(id) => setConfirmAction({ show: true, type: 'delete_step', id, label: 'Remove this step' })}
                onTestRun={testWorkflow}
                onReorder={handleReorder}
              />
            </>
          )}
        </div>
      )}

      {/* ==================== RUN HISTORY ==================== */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <select value={runFilterWorkflow} onChange={e => setRunFilterWorkflow(e.target.value)} className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-white focus:outline-none">
              <option value="">All Workflows</option>
              {automationWorkflows.map((w: any) => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
            <select value={runFilterStatus} onChange={e => setRunFilterStatus(e.target.value)} className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-white focus:outline-none">
              <option value="">All Statuses</option>
              <option value="running">Running</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <Card padding="none">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left px-4 py-3 text-xs font-medium text-white/50 uppercase tracking-wider">Workflow</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-white/50 uppercase tracking-wider">Triggered By</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-white/50 uppercase tracking-wider">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-white/50 uppercase tracking-wider">Started</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-white/50 uppercase tracking-wider">Duration</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-white/50 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredRuns.map((run: any) => {
                    const wf = automationWorkflows.find((w: any) => w.id === run.workflowId)
                    return (
                      <tr key={run.id} className="hover:bg-white/[0.02] cursor-pointer transition-colors" onClick={() => setViewingRunId(run.id)}>
                        <td className="px-4 py-3"><span className="text-white font-medium">{wf?.name || 'Unknown'}</span></td>
                        <td className="px-4 py-3 text-white/60">{run.triggeredBy}</td>
                        <td className="px-4 py-3">
                          <Badge variant={run.status === 'completed' ? 'success' : run.status === 'running' ? 'info' : run.status === 'failed' ? 'error' : 'default'}>
                            {run.status === 'running' && <Loader2 size={10} className="animate-spin mr-1" />}
                            {run.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-white/60 text-xs">{formatDateTime(run.startedAt)}</td>
                        <td className="px-4 py-3 text-white/60 text-xs">{formatDuration(run.startedAt, run.completedAt)}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={e => { e.stopPropagation(); setViewingRunId(run.id) }} className="p-1 text-white/30 hover:text-white/60 rounded" title="View"><Eye size={14} /></button>
                            {run.status === 'failed' && (
                              <button onClick={e => { e.stopPropagation(); reRunWorkflow(run.id) }} className="p-1 text-white/30 hover:text-emerald-400 rounded" title="Re-run"><RotateCcw size={14} /></button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                  {filteredRuns.length === 0 && (
                    <tr><td colSpan={6} className="px-4 py-12 text-center text-sm text-white/40">No workflow runs match the current filters.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ==================== TEMPLATES ==================== */}
      {activeTab === 'templates' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setTemplateCategory('')} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${!templateCategory ? 'bg-white/10 text-white' : 'bg-white/5 text-white/40 hover:text-white/60'}`}>All</button>
            {TEMPLATE_CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setTemplateCategory(cat)} className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${templateCategory === cat ? 'bg-white/10 text-white' : 'bg-white/5 text-white/40 hover:text-white/60'}`}>{cat}</button>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTemplates.map((template: any) => {
              const trigger = getTriggerInfo(template.trigger)
              const TriggerIcon = trigger.icon
              return (
                <Card key={template.id} className="group hover:border-white/20 transition-all">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                      <TriggerIcon size={16} className={trigger.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-white">{template.name}</h3>
                      <Badge variant="info" className="mt-1">{template.category}</Badge>
                    </div>
                  </div>
                  <p className="text-xs text-white/50 mb-3 line-clamp-2">{template.description}</p>
                  <div className="flex items-center gap-4 text-xs text-white/40 mb-4">
                    <span>{template.stepCount} steps</span>
                    <span>{template.estimatedDuration}</span>
                  </div>
                  <Button size="sm" variant="secondary" className="w-full" onClick={() => useTemplate(template.id)}>
                    <LayoutTemplate size={13} /> Use Template
                  </Button>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* ==================== ANALYTICS ==================== */}
      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle>Workflow Runs Trend</CardTitle></CardHeader>
            <TempoLineChart data={runTrendData} lines={[{ dataKey: 'runs', name: 'Runs', color: CHART_COLORS.primary }]} height={240} showDots />
          </Card>
          <Card>
            <CardHeader><CardTitle>Run Status Distribution</CardTitle></CardHeader>
            <TempoDonutChart data={statusDistribution} colors={['#10b981', '#3b82f6', '#ef4444', '#64748b']} height={240} centerLabel={String(automationWorkflowRuns.length)} centerSub="Total Runs" />
          </Card>
          <Card>
            <CardHeader><CardTitle>Most Triggered Workflows</CardTitle></CardHeader>
            <TempoBarChart data={workflowRunCounts} bars={[{ dataKey: 'runs', name: 'Runs', color: CHART_COLORS.primary }]} layout="horizontal" height={240} />
          </Card>
          <Card>
            <CardHeader><CardTitle>Average Execution Time (min)</CardTitle></CardHeader>
            {avgDurations.length > 0 ? (
              <TempoBarChart data={avgDurations} bars={[{ dataKey: 'duration', name: 'Minutes', color: CHART_COLORS.blue }]} layout="horizontal" height={240} />
            ) : (
              <div className="flex items-center justify-center h-[240px] text-sm text-white/40">No completed runs with duration data.</div>
            )}
          </Card>
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle>Step Failure Hotspots</CardTitle></CardHeader>
            <div className="space-y-2">
              {automationWorkflowRunSteps.filter((rs: any) => rs.status === 'failed').map((rs: any) => {
                const step = automationWorkflowSteps.find((s: any) => s.id === rs.stepId)
                const run = automationWorkflowRuns.find((r: any) => r.id === rs.runId)
                const wf = run ? automationWorkflows.find((w: any) => w.id === run.workflowId) : null
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const output = (rs.output || {}) as any
                return (
                  <div key={rs.id} className="flex items-center gap-3 p-3 bg-red-500/5 border border-red-500/10 rounded-lg">
                    <AlertTriangle size={14} className="text-red-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-medium">{wf?.name} - {step ? getStepSummary(step) : 'Unknown step'}</p>
                      <p className="text-xs text-red-400/80 mt-0.5">{output.error || 'Failed'}</p>
                    </div>
                    <span className="text-xs text-white/40">{rs.completedAt ? formatDate(rs.completedAt) : ''}</span>
                  </div>
                )
              })}
              {automationWorkflowRunSteps.filter((rs: any) => rs.status === 'failed').length === 0 && (
                <div className="py-8 text-center text-sm text-white/40">No step failures recorded.</div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* ==================== RUN DETAIL MODAL ==================== */}
      {viewingRun && (
        <Modal open={!!viewingRunId} onClose={() => setViewingRunId(null)} title="Workflow Run Details" size="lg">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-white/40 mb-1">Workflow</p>
                <p className="text-sm text-white font-medium">{automationWorkflows.find((w: any) => w.id === viewingRun.workflowId)?.name || 'Unknown'}</p>
              </div>
              <div>
                <p className="text-xs text-white/40 mb-1">Status</p>
                <Badge variant={viewingRun.status === 'completed' ? 'success' : viewingRun.status === 'failed' ? 'error' : 'info'}>{viewingRun.status}</Badge>
              </div>
              <div>
                <p className="text-xs text-white/40 mb-1">Triggered By</p>
                <p className="text-sm text-white">{viewingRun.triggeredBy}</p>
              </div>
              <div>
                <p className="text-xs text-white/40 mb-1">Duration</p>
                <p className="text-sm text-white">{formatDuration(viewingRun.startedAt, viewingRun.completedAt)}</p>
              </div>
            </div>
            <div>
              <p className="text-xs text-white/40 mb-1">Trigger Data</p>
              <pre className="text-xs bg-white/5 border border-white/10 rounded-lg p-3 text-white/70 overflow-x-auto">{JSON.stringify(viewingRun.triggerData, null, 2)}</pre>
            </div>
            {viewingRun.error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-xs font-medium text-red-400">Error</p>
                <p className="text-sm text-red-300 mt-1">{viewingRun.error}</p>
              </div>
            )}
            <div>
              <p className="text-xs font-medium text-white/60 uppercase tracking-wider mb-3">Step Execution Log</p>
              <div className="space-y-2">
                {viewingRunSteps.length > 0 ? viewingRunSteps.map((rs: any) => {
                  const step = automationWorkflowSteps.find((s: any) => s.id === rs.stepId)
                  return (
                    <div key={rs.id} className={`flex items-start gap-3 p-3 rounded-lg border ${
                      rs.status === 'completed' ? 'bg-emerald-500/5 border-emerald-500/10' :
                      rs.status === 'failed' ? 'bg-red-500/5 border-red-500/10' : 'bg-white/[0.02] border-white/5'
                    }`}>
                      <div className="mt-0.5">
                        {rs.status === 'completed' && <CheckCircle2 size={14} className="text-emerald-400" />}
                        {rs.status === 'failed' && <XCircle size={14} className="text-red-400" />}
                        {rs.status === 'running' && <Loader2 size={14} className="text-blue-400 animate-spin" />}
                        {rs.status === 'pending' && <CircleDot size={14} className="text-white/30" />}
                        {rs.status === 'skipped' && <ChevronRight size={14} className="text-white/20" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-white">{step ? getStepSummary(step) : 'Unknown step'}</p>
                          <Badge variant={rs.status === 'completed' ? 'success' : rs.status === 'failed' ? 'error' : 'default'}>{rs.status}</Badge>
                        </div>
                      </div>
                    </div>
                  )
                }) : (
                  <div className="py-6 text-center text-sm text-white/40">No step execution details available.</div>
                )}
              </div>
            </div>
            {viewingRun.status === 'failed' && (
              <div className="flex justify-end">
                <Button size="sm" onClick={() => { reRunWorkflow(viewingRun.id); setViewingRunId(null) }}><RotateCcw size={13} /> Re-run</Button>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* ==================== WORKFLOW MODAL ==================== */}
      <Modal open={showWorkflowModal} onClose={() => setShowWorkflowModal(false)} title={editingWorkflowId ? 'Edit Workflow' : 'Create Workflow'}>
        <div className="space-y-4">
          <Input label="Workflow Name" value={workflowForm.name} onChange={e => setWorkflowForm({ ...workflowForm, name: e.target.value })} placeholder="e.g., New Hire Onboarding" />
          <Textarea label="Description" value={workflowForm.description} onChange={e => setWorkflowForm({ ...workflowForm, description: e.target.value })} placeholder="Describe what this workflow does..." rows={3} />
          <Select label="Trigger" value={workflowForm.trigger} onChange={e => setWorkflowForm({ ...workflowForm, trigger: e.target.value })} options={TRIGGER_TYPES.map(t => ({ value: t.value, label: t.label }))} />
          <Input label="SLA (hours, optional)" type="number" placeholder="e.g. 24" value={workflowForm.slaHours} onChange={e => setWorkflowForm({ ...workflowForm, slaHours: e.target.value })} />
          {workflowForm.trigger === 'scheduled' && (
            <div className="space-y-3 bg-white/5 border border-white/10 rounded-lg p-3">
              <p className="text-xs text-white/60 font-medium">Schedule Configuration</p>
              <Select label="Frequency" value={(workflowForm as any).scheduleFrequency || 'daily'} onChange={e => setWorkflowForm({ ...workflowForm, scheduleFrequency: e.target.value } as any)} options={[
                { value: 'daily', label: 'Daily' }, { value: 'weekly', label: 'Weekly' },
                { value: 'monthly', label: 'Monthly' }, { value: 'cron', label: 'Custom Cron' },
              ]} />
            </div>
          )}
          <div className="flex items-center gap-2">
            <input type="checkbox" id="wf-active" checked={workflowForm.isActive} onChange={e => setWorkflowForm({ ...workflowForm, isActive: e.target.checked })} className="rounded border-white/20 bg-white/5" />
            <label htmlFor="wf-active" className="text-sm text-white/70">Activate immediately</label>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" size="sm" onClick={() => setShowWorkflowModal(false)}>Cancel</Button>
            <Button size="sm" onClick={submitWorkflow} disabled={!workflowForm.name || saving}>{saving ? 'Saving...' : editingWorkflowId ? 'Save Changes' : 'Create Workflow'}</Button>
          </div>
        </div>
      </Modal>

      {/* ==================== STEP MODAL ==================== */}
      <Modal open={showStepModal} onClose={() => setShowStepModal(false)} title={editingStepId ? 'Edit Step' : 'Add Step'} size="lg">
        <div className="space-y-4">
          <div>
            <p className="text-xs font-medium text-white/60 mb-2">Step Type</p>
            <div className="grid grid-cols-4 gap-2">
              {STEP_TYPES.map(st => {
                const Icon = st.icon
                return (
                  <button key={st.value} onClick={() => setStepForm({ ...stepForm, type: st.value })}
                    className={`p-3 rounded-lg border text-center transition-colors ${stepForm.type === st.value ? `${st.color} border-current` : 'bg-white/5 border-white/10 text-white/50 hover:border-white/20'}`}>
                    <Icon size={18} className="mx-auto mb-1" />
                    <p className="text-xs font-medium">{st.label}</p>
                  </button>
                )
              })}
            </div>
          </div>

          {stepForm.type === 'action' && (
            <>
              <Select label="Action Type" value={stepForm.actionType} onChange={e => setStepForm({ ...stepForm, actionType: e.target.value })} options={ACTION_TYPES.map(a => ({ value: a.value, label: a.label }))} />
              {stepForm.actionType === 'send_email' && (
                <>
                  <Input label="To" value={stepForm.to} onChange={e => setStepForm({ ...stepForm, to: e.target.value })} placeholder="{{employee.email}}" />
                  <Input label="Subject" value={stepForm.subject} onChange={e => setStepForm({ ...stepForm, subject: e.target.value })} />
                  <Textarea label="Body" value={stepForm.body} onChange={e => setStepForm({ ...stepForm, body: e.target.value })} rows={3} />
                </>
              )}
              {stepForm.actionType === 'send_slack' && (
                <>
                  <Input label="Channel" value={stepForm.channel} onChange={e => setStepForm({ ...stepForm, channel: e.target.value })} placeholder="#general" />
                  <Textarea label="Message" value={stepForm.message} onChange={e => setStepForm({ ...stepForm, message: e.target.value })} rows={3} />
                </>
              )}
              {stepForm.actionType === 'create_task' && (
                <>
                  <Input label="Task Title" value={stepForm.title} onChange={e => setStepForm({ ...stepForm, title: e.target.value })} />
                  <Input label="Assign To" value={stepForm.assignTo} onChange={e => setStepForm({ ...stepForm, assignTo: e.target.value })} />
                </>
              )}
              {(stepForm.actionType === 'assign_app' || stepForm.actionType === 'revoke_app') && (
                <Input label="Apps (comma-separated)" value={stepForm.apps} onChange={e => setStepForm({ ...stepForm, apps: e.target.value })} placeholder="Slack, Gmail, JIRA" />
              )}
              {stepForm.actionType === 'update_field' && (
                <>
                  <Input label="Field" value={stepForm.field} onChange={e => setStepForm({ ...stepForm, field: e.target.value })} />
                  <Input label="Value" value={stepForm.value} onChange={e => setStepForm({ ...stepForm, value: e.target.value })} />
                </>
              )}
              {stepForm.actionType === 'notify_manager' && (
                <Textarea label="Message" value={stepForm.message} onChange={e => setStepForm({ ...stepForm, message: e.target.value })} rows={3} />
              )}
              {stepForm.actionType === 'add_to_group' && (
                <Input label="Group" value={stepForm.group} onChange={e => setStepForm({ ...stepForm, group: e.target.value })} />
              )}
              {stepForm.actionType === 'enroll_course' && (
                <Input label="Courses (comma-separated)" value={stepForm.courses} onChange={e => setStepForm({ ...stepForm, courses: e.target.value })} />
              )}
              {stepForm.actionType === 'http_request' && (
                <>
                  <div className="grid grid-cols-4 gap-2">
                    <Select label="Method" value={stepForm.httpMethod} onChange={e => setStepForm({ ...stepForm, httpMethod: e.target.value })} options={[
                      { value: 'GET', label: 'GET' }, { value: 'POST', label: 'POST' },
                      { value: 'PUT', label: 'PUT' }, { value: 'PATCH', label: 'PATCH' }, { value: 'DELETE', label: 'DELETE' },
                    ]} />
                    <div className="col-span-3">
                      <Input label="URL" value={stepForm.httpUrl} onChange={e => setStepForm({ ...stepForm, httpUrl: e.target.value })} placeholder="https://api.example.com/webhook" />
                    </div>
                  </div>
                  <Input label="Headers (JSON)" value={stepForm.httpHeaders} onChange={e => setStepForm({ ...stepForm, httpHeaders: e.target.value })} placeholder='{"Authorization": "Bearer ..."}' />
                  <Textarea label="Request Body" value={stepForm.httpBody} onChange={e => setStepForm({ ...stepForm, httpBody: e.target.value })} rows={3} placeholder='{"key": "value"}' />
                </>
              )}
            </>
          )}

          {stepForm.type === 'condition' && (
            <>
              <Input label="Label" value={stepForm.condLabel} onChange={e => setStepForm({ ...stepForm, condLabel: e.target.value })} placeholder="Rating < 3?" />
              <Input label="Field" value={stepForm.condField} onChange={e => setStepForm({ ...stepForm, condField: e.target.value })} placeholder="review.overall_rating" />
              <Select label="Operator" value={stepForm.operator} onChange={e => setStepForm({ ...stepForm, operator: e.target.value })} options={[
                { value: 'equals', label: 'Equals' }, { value: 'not_equals', label: 'Not Equals' },
                { value: 'greater_than', label: 'Greater Than' }, { value: 'less_than', label: 'Less Than' }, { value: 'contains', label: 'Contains' },
              ]} />
              <Input label="Value" value={stepForm.condValue} onChange={e => setStepForm({ ...stepForm, condValue: e.target.value })} />
            </>
          )}

          {stepForm.type === 'delay' && (
            <div className="grid grid-cols-2 gap-4">
              <Input label="Duration" type="number" value={stepForm.duration} onChange={e => setStepForm({ ...stepForm, duration: e.target.value })} />
              <Select label="Unit" value={stepForm.unit} onChange={e => setStepForm({ ...stepForm, unit: e.target.value })} options={[
                { value: 'minutes', label: 'Minutes' }, { value: 'hours', label: 'Hours' }, { value: 'days', label: 'Days' },
              ]} />
            </div>
          )}

          {stepForm.type === 'approval' && (
            <>
              <Input label="Approver" value={stepForm.approver} onChange={e => setStepForm({ ...stepForm, approver: e.target.value })} placeholder="{{employee.manager}} or CFO" />
              <Textarea label="Message" value={stepForm.approvalMessage} onChange={e => setStepForm({ ...stepForm, approvalMessage: e.target.value })} rows={3} />
            </>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" size="sm" onClick={() => setShowStepModal(false)}>Cancel</Button>
            <Button size="sm" onClick={submitStep} disabled={saving}>{saving ? 'Saving...' : editingStepId ? 'Save Changes' : 'Add Step'}</Button>
          </div>
        </div>
      </Modal>

      {/* ==================== VERSION HISTORY MODAL ==================== */}
      <Modal open={showVersionHistory} onClose={() => setShowVersionHistory(false)} title="Workflow Version History">
        <div className="space-y-3">
          {versions.map((v, idx) => (
            <div key={v.id} className={`flex items-start gap-3 p-3 rounded-lg border ${idx === 0 ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-white/[0.02] border-white/10'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${idx === 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-white/40'}`}>
                v{v.version}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-white">{v.changes}</p>
                  {idx === 0 && <Badge variant="success">Current</Badge>}
                </div>
                <p className="text-xs text-white/40 mt-0.5">{v.author} - {v.date}</p>
              </div>
              {idx > 0 && (
                <Button size="sm" variant="secondary" onClick={() => { addToast(`Rolled back to v${v.version}`); setShowVersionHistory(false) }}>
                  <Undo2 size={12} /> Rollback
                </Button>
              )}
            </div>
          ))}
        </div>
      </Modal>

      {/* ==================== CONFIRM ACTION ==================== */}
      <Modal open={!!confirmAction?.show} onClose={() => setConfirmAction(null)} title="Confirm Action">
        <p className="text-sm text-white/70 mb-4">Are you sure you want to {confirmAction?.label}? This cannot be undone.</p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={() => setConfirmAction(null)}>Cancel</Button>
          <Button size="sm" onClick={executeConfirmAction} className="bg-red-600 hover:bg-red-700">Confirm</Button>
        </div>
      </Modal>
    </>
  )
}
