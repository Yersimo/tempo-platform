'use client'

import { useState, useMemo } from 'react'
import { Header } from '@/components/layout/header'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs } from '@/components/ui/tabs'
import { Modal } from '@/components/ui/modal'
import { Input, Select } from '@/components/ui/input'
import {
  Shield, Lock, Plus, Pencil, Copy, Trash2, Search, Download, ChevronDown, ChevronRight,
  Users, Globe, Building2, FolderOpen, User, Eye, EyeOff, Edit3, AlertTriangle,
  CheckCircle, XCircle, Clock, ArrowRight, RotateCcw, Filter,
} from 'lucide-react'
import { useTempo } from '@/lib/store'

// ── Types ────────────────────────────────────────────────────────────────────

interface Role {
  id: string
  name: string
  type: 'system' | 'custom'
  description: string
  members: number
  permissionCount: number
  securityProfile: string
  baseRole?: string
  permissions: Record<string, string[]>
}

interface SecurityProfile {
  id: string
  name: string
  description: string
  scopeType: 'global' | 'org' | 'department' | 'team' | 'self'
  scopedEntities: string[]
  includeSubOrgs: boolean
  fieldRestrictions: FieldRestriction[]
}

interface FieldRestriction {
  entity: string
  field: string
  accessLevel: 'full' | 'edit' | 'view' | 'hidden'
}

interface Delegation {
  id: string
  delegator: string
  delegate: string
  type: string
  processes: string[]
  startDate: string
  endDate: string
  status: 'active' | 'expiring_soon' | 'expired' | 'revoked'
  reason: string
}

interface AuditEntry {
  id: string
  timestamp: string
  actor: string
  action: string
  resource: string
  outcome: 'success' | 'denied' | 'error'
  ipAddress: string
  details: string
}

type FieldAccessLevel = 'full' | 'edit' | 'view' | 'hidden'

// ── Demo Data ────────────────────────────────────────────────────────────────

const PERMISSION_MODULES = ['People', 'Payroll', 'Finance', 'IT', 'Recruiting', 'Compliance', 'Performance', 'Benefits'] as const
const PERMISSION_ACTIONS = ['Read', 'Write', 'Manage', 'Approve', 'Delete'] as const

const DEMO_ROLES: Role[] = [
  { id: 'r1', name: 'Owner', type: 'system', description: 'Full platform access with billing and security controls', members: 1, permissionCount: 48, securityProfile: 'Global Admin', permissions: Object.fromEntries(PERMISSION_MODULES.map(m => [m, [...PERMISSION_ACTIONS]])) },
  { id: 'r2', name: 'Admin', type: 'system', description: 'Full access except platform ownership transfer', members: 3, permissionCount: 45, securityProfile: 'Global Admin', permissions: Object.fromEntries(PERMISSION_MODULES.map(m => [m, [...PERMISSION_ACTIONS].filter(a => a !== 'Delete')])) },
  { id: 'r3', name: 'HR Business Partner', type: 'system', description: 'HR operations, recruiting, compliance', members: 5, permissionCount: 32, securityProfile: 'Global HR', permissions: { People: ['Read', 'Write', 'Manage'], Payroll: ['Read'], Finance: ['Read'], IT: [], Recruiting: ['Read', 'Write', 'Manage'], Compliance: ['Read', 'Write'], Performance: ['Read', 'Write', 'Manage'], Benefits: ['Read', 'Write', 'Manage'] } },
  { id: 'r4', name: 'Manager', type: 'system', description: 'Team management and approvals', members: 18, permissionCount: 16, securityProfile: 'Team Scope', permissions: { People: ['Read'], Payroll: [], Finance: [], IT: [], Recruiting: [], Compliance: [], Performance: ['Read', 'Write'], Benefits: [] } },
  { id: 'r5', name: 'Employee', type: 'system', description: 'Self-service access only', members: 142, permissionCount: 8, securityProfile: 'Self Only', permissions: { People: [], Payroll: [], Finance: [], IT: [], Recruiting: [], Compliance: [], Performance: ['Read'], Benefits: [] } },
  { id: 'r6', name: 'Finance Approver', type: 'custom', description: 'Finance and expense approvals', members: 4, permissionCount: 18, securityProfile: 'Finance Dept', baseRole: 'Manager', permissions: { People: ['Read'], Payroll: ['Read', 'Approve'], Finance: ['Read', 'Write', 'Approve'], IT: [], Recruiting: [], Compliance: ['Read'], Performance: ['Read'], Benefits: ['Read'] } },
  { id: 'r7', name: 'IT Administrator', type: 'custom', description: 'IT systems, devices, and identity management', members: 3, permissionCount: 22, securityProfile: 'IT Scope', baseRole: 'Admin', permissions: { People: ['Read'], Payroll: [], Finance: [], IT: ['Read', 'Write', 'Manage', 'Approve'], Recruiting: [], Compliance: ['Read'], Performance: [], Benefits: [] } },
  { id: 'r8', name: 'Recruiter', type: 'custom', description: 'Recruiting pipeline and candidate management', members: 6, permissionCount: 14, securityProfile: 'Recruiting Dept', baseRole: 'Employee', permissions: { People: ['Read'], Payroll: [], Finance: [], IT: [], Recruiting: ['Read', 'Write', 'Manage'], Compliance: [], Performance: [], Benefits: [] } },
]

const DEMO_PROFILES: SecurityProfile[] = [
  { id: 'sp1', name: 'Global Admin', description: 'Unrestricted access to all entities and fields', scopeType: 'global', scopedEntities: [], includeSubOrgs: true, fieldRestrictions: [] },
  { id: 'sp2', name: 'Global HR', description: 'Access to all employees, restricted financial fields', scopeType: 'global', scopedEntities: [], includeSubOrgs: true, fieldRestrictions: [{ entity: 'Compensation', field: 'Equity Grants', accessLevel: 'hidden' }, { entity: 'Payroll', field: 'Bank Account', accessLevel: 'hidden' }] },
  { id: 'sp3', name: 'Team Scope', description: 'Access limited to direct and indirect reports', scopeType: 'team', scopedEntities: [], includeSubOrgs: false, fieldRestrictions: [{ entity: 'Compensation', field: 'Base Salary', accessLevel: 'view' }, { entity: 'Compensation', field: 'Equity Grants', accessLevel: 'hidden' }, { entity: 'Payroll', field: 'Bank Account', accessLevel: 'hidden' }] },
  { id: 'sp4', name: 'Self Only', description: 'Access restricted to own profile and records', scopeType: 'self', scopedEntities: [], includeSubOrgs: false, fieldRestrictions: [{ entity: 'Compensation', field: 'Pay Band', accessLevel: 'hidden' }, { entity: 'Performance', field: 'Calibration Score', accessLevel: 'hidden' }] },
  { id: 'sp5', name: 'Finance Dept', description: 'Scoped to Finance department entities', scopeType: 'department', scopedEntities: ['Finance', 'Accounting'], includeSubOrgs: false, fieldRestrictions: [] },
  { id: 'sp6', name: 'IT Scope', description: 'IT department with device and identity access', scopeType: 'department', scopedEntities: ['Information Technology'], includeSubOrgs: true, fieldRestrictions: [{ entity: 'Employee Profile', field: 'Personal Phone', accessLevel: 'hidden' }] },
  { id: 'sp7', name: 'Recruiting Dept', description: 'Recruiting team with candidate access', scopeType: 'department', scopedEntities: ['Recruiting', 'People Operations'], includeSubOrgs: false, fieldRestrictions: [{ entity: 'Compensation', field: 'Base Salary', accessLevel: 'hidden' }, { entity: 'Payroll', field: 'Bank Account', accessLevel: 'hidden' }] },
]

const DEMO_DELEGATIONS: Delegation[] = [
  { id: 'd1', delegator: 'Amara Kone', delegate: 'Kwame Mensah', type: 'Full', processes: ['Expense Approval', 'Leave Approval', 'Hiring'], startDate: '2026-03-01', endDate: '2026-03-21', status: 'active', reason: 'Annual leave coverage' },
  { id: 'd2', delegator: 'Fatima Diallo', delegate: 'Ibrahim Toure', type: 'Partial', processes: ['Expense Approval'], startDate: '2026-03-10', endDate: '2026-03-17', status: 'expiring_soon', reason: 'Conference travel' },
  { id: 'd3', delegator: 'Osei Agyemang', delegate: 'Ama Boateng', type: 'Partial', processes: ['Payroll Approval', 'Budget Review'], startDate: '2026-02-01', endDate: '2026-02-28', status: 'expired', reason: 'Paternity leave' },
  { id: 'd4', delegator: 'Daniel Asante', delegate: 'Grace Okafor', type: 'Full', processes: ['All HR Processes'], startDate: '2026-01-15', endDate: '2026-04-15', status: 'active', reason: 'Sabbatical' },
  { id: 'd5', delegator: 'Yaa Asantewaa', delegate: 'Kofi Appiah', type: 'Partial', processes: ['Recruiting Approval'], startDate: '2026-02-10', endDate: '2026-02-20', status: 'revoked', reason: 'Role change - no longer applicable' },
]

const DEMO_AUDIT: AuditEntry[] = [
  { id: 'a1', timestamp: '2026-03-14T09:23:15Z', actor: 'Amara Kone', action: 'role.create', resource: 'Custom Role: Finance Approver', outcome: 'success', ipAddress: '41.215.52.101', details: 'Created custom role with 18 permissions based on Manager template' },
  { id: 'a2', timestamp: '2026-03-14T09:15:42Z', actor: 'Kwame Mensah', action: 'permission.denied', resource: '/settings/security', outcome: 'denied', ipAddress: '41.215.52.103', details: 'Attempted access to Security Admin without admin:manage permission' },
  { id: 'a3', timestamp: '2026-03-14T08:47:33Z', actor: 'Amara Kone', action: 'delegation.create', resource: 'Delegation: Kone → Mensah', outcome: 'success', ipAddress: '41.215.52.101', details: 'Created full delegation for annual leave coverage, expires 2026-03-21' },
  { id: 'a4', timestamp: '2026-03-13T16:22:08Z', actor: 'System', action: 'session.expired', resource: 'Session: Fatima Diallo', outcome: 'success', ipAddress: '—', details: 'JWT session expired after 24h idle timeout' },
  { id: 'a5', timestamp: '2026-03-13T14:50:19Z', actor: 'Amara Kone', action: 'profile.update', resource: 'Security Profile: IT Scope', outcome: 'success', ipAddress: '41.215.52.101', details: 'Added Personal Phone field restriction to Employee Profile entity' },
  { id: 'a6', timestamp: '2026-03-13T11:33:45Z', actor: 'Ibrahim Toure', action: 'role.assign', resource: 'Employee: Ama Boateng → Recruiter', outcome: 'success', ipAddress: '41.215.52.107', details: 'Assigned Recruiter custom role to Ama Boateng' },
  { id: 'a7', timestamp: '2026-03-13T10:12:30Z', actor: 'System', action: 'delegation.expired', resource: 'Delegation: Agyemang → Boateng', outcome: 'success', ipAddress: '—', details: 'Delegation auto-expired at end date 2026-02-28' },
  { id: 'a8', timestamp: '2026-03-12T15:44:22Z', actor: 'Kwame Mensah', action: 'login.mfa', resource: 'MFA Challenge', outcome: 'success', ipAddress: '41.215.52.103', details: 'Passed TOTP MFA challenge on login' },
  { id: 'a9', timestamp: '2026-03-12T14:20:11Z', actor: 'Unknown', action: 'login.failed', resource: 'Login: admin@ecobank.com', outcome: 'error', ipAddress: '103.21.244.15', details: 'Failed login attempt — invalid credentials (attempt 3 of 5)' },
  { id: 'a10', timestamp: '2026-03-12T09:05:55Z', actor: 'Amara Kone', action: 'field.restriction', resource: 'Field: Compensation.Pay Band', outcome: 'success', ipAddress: '41.215.52.101', details: 'Set Pay Band field to hidden for Employee role in Self Only profile' },
  { id: 'a11', timestamp: '2026-03-11T17:30:00Z', actor: 'Fatima Diallo', action: 'delegation.revoke', resource: 'Delegation: Asantewaa → Appiah', outcome: 'success', ipAddress: '41.215.52.109', details: 'Revoked delegation due to role change' },
  { id: 'a12', timestamp: '2026-03-11T12:15:33Z', actor: 'System', action: 'rate_limit.triggered', resource: 'IP: 103.21.244.15', outcome: 'denied', ipAddress: '103.21.244.15', details: 'Rate limit exceeded: 10 login attempts in 15 minutes' },
]

const FIELD_PERMISSION_ENTITIES = ['Employee Profile', 'Compensation', 'Payroll', 'Performance', 'Benefits', 'Recruiting'] as const
const ENTITY_FIELDS: Record<string, string[]> = {
  'Employee Profile': ['Full Name', 'Email', 'Phone', 'Address', 'Emergency Contact', 'National ID', 'Date of Birth', 'Hire Date', 'Department', 'Job Title'],
  'Compensation': ['Base Salary', 'Pay Band', 'Bonus Target', 'Equity Grants', 'Currency', 'Pay Frequency', 'Last Review Date'],
  'Payroll': ['Bank Account', 'Tax ID', 'Net Pay', 'Gross Pay', 'Deductions', 'Pay Stub History'],
  'Performance': ['Rating', 'Calibration Score', 'Goals', 'Review Notes', 'Manager Comments', '360 Feedback'],
  'Benefits': ['Health Plan', 'Pension Tier', 'Life Insurance', 'Dependents', 'Enrollment Date'],
  'Recruiting': ['Candidate Name', 'Applied Role', 'Resume', 'Interview Notes', 'Offer Amount', 'Source Channel'],
}

const FIELD_MATRIX_ROLES = ['Owner', 'Admin', 'HRBP', 'Manager', 'Employee'] as const

function getDefaultFieldAccess(role: string, entity: string, field: string): FieldAccessLevel {
  if (role === 'Owner' || role === 'Admin') return 'full'
  if (role === 'HRBP') {
    if (entity === 'Compensation' && field === 'Equity Grants') return 'hidden'
    if (entity === 'Payroll' && field === 'Bank Account') return 'hidden'
    return 'edit'
  }
  if (role === 'Manager') {
    if (entity === 'Payroll') return 'hidden'
    if (entity === 'Compensation' && (field === 'Equity Grants' || field === 'Pay Band')) return 'hidden'
    if (entity === 'Compensation') return 'view'
    if (entity === 'Performance') return 'edit'
    if (entity === 'Employee Profile' && (field === 'National ID' || field === 'Address')) return 'hidden'
    return 'view'
  }
  // Employee
  if (entity === 'Performance' && field === 'Calibration Score') return 'hidden'
  if (entity === 'Performance' && field === 'Manager Comments') return 'hidden'
  if (entity === 'Compensation' && field !== 'Base Salary' && field !== 'Currency') return 'hidden'
  if (entity === 'Payroll' && field !== 'Net Pay' && field !== 'Pay Stub History') return 'hidden'
  if (entity === 'Recruiting') return 'hidden'
  if (entity === 'Employee Profile' && field === 'National ID') return 'hidden'
  return 'view'
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const SCOPE_ICONS: Record<string, React.ReactNode> = {
  global: <Globe size={14} className="text-blue-500" />,
  org: <Building2 size={14} className="text-purple-500" />,
  department: <FolderOpen size={14} className="text-amber-500" />,
  team: <Users size={14} className="text-green-500" />,
  self: <User size={14} className="text-gray-500" />,
}
const SCOPE_LABELS: Record<string, string> = { global: 'Global', org: 'Organisation', department: 'Department', team: 'Team', self: 'Self' }

const STATUS_CONFIG: Record<string, { variant: 'success' | 'warning' | 'error' | 'default'; label: string }> = {
  active: { variant: 'success', label: 'Active' },
  expiring_soon: { variant: 'warning', label: 'Expiring Soon' },
  expired: { variant: 'default', label: 'Expired' },
  revoked: { variant: 'error', label: 'Revoked' },
}

const ACCESS_COLORS: Record<FieldAccessLevel, string> = {
  full: 'bg-green-100 text-green-700 border-green-200',
  edit: 'bg-blue-100 text-blue-700 border-blue-200',
  view: 'bg-amber-100 text-amber-700 border-amber-200',
  hidden: 'bg-red-100 text-red-700 border-red-200',
}
const ACCESS_LABELS: Record<FieldAccessLevel, string> = { full: 'Full', edit: 'Edit', view: 'View', hidden: 'Hidden' }
const ACCESS_CYCLE: FieldAccessLevel[] = ['full', 'edit', 'view', 'hidden']

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}
function formatTimestamp(d: string) {
  return new Date(d).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

// ── Component ────────────────────────────────────────────────────────────────

export default function SecurityAdminPage() {
  const { addToast, currentUser } = useTempo()
  const [activeTab, setActiveTab] = useState('roles')

  // Roles state
  const [roles, setRoles] = useState<Role[]>(DEMO_ROLES)
  const [showRoleForm, setShowRoleForm] = useState(false)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [roleForm, setRoleForm] = useState({ name: '', description: '', baseRole: 'Employee', securityProfile: 'Self Only', permissions: {} as Record<string, string[]> })

  // Profiles state
  const [profiles, setProfiles] = useState<SecurityProfile[]>(DEMO_PROFILES)
  const [showProfileForm, setShowProfileForm] = useState(false)
  const [profileForm, setProfileForm] = useState<Partial<SecurityProfile>>({ name: '', description: '', scopeType: 'department', scopedEntities: [], includeSubOrgs: false, fieldRestrictions: [] })

  // Delegations state
  const [delegations, setDelegations] = useState<Delegation[]>(DEMO_DELEGATIONS)
  const [showDelegationForm, setShowDelegationForm] = useState(false)
  const [showRevokeModal, setShowRevokeModal] = useState<string | null>(null)
  const [delegationForm, setDelegationForm] = useState({ delegator: '', delegate: '', type: 'Partial', processes: '' as string, startDate: '', endDate: '', reason: '' })

  // Field permissions state
  const [fieldEntity, setFieldEntity] = useState<string>('Employee Profile')
  const [fieldMatrix, setFieldMatrix] = useState<Record<string, Record<string, FieldAccessLevel>>>({})

  // Audit state
  const [auditEntries] = useState<AuditEntry[]>(DEMO_AUDIT)
  const [auditSearch, setAuditSearch] = useState('')
  const [auditActionFilter, setAuditActionFilter] = useState('all')
  const [auditOutcomeFilter, setAuditOutcomeFilter] = useState('all')
  const [expandedAudit, setExpandedAudit] = useState<string | null>(null)

  const tabs = [
    { id: 'roles', label: 'Roles & Permissions', count: roles.length },
    { id: 'profiles', label: 'Security Profiles', count: profiles.length },
    { id: 'delegations', label: 'Delegations', count: delegations.filter(d => d.status === 'active').length },
    { id: 'fields', label: 'Field Permissions' },
    { id: 'audit', label: 'Audit Log', count: auditEntries.length },
  ]

  // ── Audit computed ─────────────────────────────────────────────────────────

  const filteredAudit = useMemo(() => {
    return auditEntries.filter(e => {
      if (auditSearch && !e.actor.toLowerCase().includes(auditSearch.toLowerCase()) && !e.resource.toLowerCase().includes(auditSearch.toLowerCase()) && !e.action.toLowerCase().includes(auditSearch.toLowerCase())) return false
      if (auditActionFilter !== 'all' && !e.action.startsWith(auditActionFilter)) return false
      if (auditOutcomeFilter !== 'all' && e.outcome !== auditOutcomeFilter) return false
      return true
    })
  }, [auditEntries, auditSearch, auditActionFilter, auditOutcomeFilter])

  const auditStats = useMemo(() => ({
    total: auditEntries.length,
    denied: auditEntries.filter(e => e.outcome === 'denied').length,
    delegationsActive: delegations.filter(d => d.status === 'active').length,
    roleChanges: auditEntries.filter(e => e.action.startsWith('role.')).length,
  }), [auditEntries, delegations])

  // ── Role handlers ──────────────────────────────────────────────────────────

  const handleSaveRole = () => {
    if (!roleForm.name.trim()) { addToast('Role name is required', 'error'); return }
    if (editingRole) {
      setRoles(prev => prev.map(r => r.id === editingRole.id ? { ...r, name: roleForm.name, description: roleForm.description, securityProfile: roleForm.securityProfile, permissions: roleForm.permissions } : r))
      addToast(`Role "${roleForm.name}" updated`, 'success')
    } else {
      const newRole: Role = {
        id: `r${Date.now()}`, name: roleForm.name, type: 'custom', description: roleForm.description,
        members: 0, permissionCount: Object.values(roleForm.permissions).flat().length,
        securityProfile: roleForm.securityProfile, baseRole: roleForm.baseRole, permissions: roleForm.permissions,
      }
      setRoles(prev => [...prev, newRole])
      addToast(`Role "${roleForm.name}" created`, 'success')
    }
    setShowRoleForm(false)
    setEditingRole(null)
    setRoleForm({ name: '', description: '', baseRole: 'Employee', securityProfile: 'Self Only', permissions: {} })
  }

  const handleCloneRole = (role: Role) => {
    const cloned: Role = { ...role, id: `r${Date.now()}`, name: `${role.name} (Copy)`, type: 'custom', members: 0, baseRole: role.name }
    setRoles(prev => [...prev, cloned])
    addToast(`Role "${role.name}" cloned`, 'success')
  }

  const handleDeleteRole = (role: Role) => {
    setRoles(prev => prev.filter(r => r.id !== role.id))
    addToast(`Role "${role.name}" deleted`, 'success')
  }

  const handleEditRole = (role: Role) => {
    setEditingRole(role)
    setRoleForm({ name: role.name, description: role.description, baseRole: role.baseRole || '', securityProfile: role.securityProfile, permissions: { ...role.permissions } })
    setShowRoleForm(true)
  }

  // ── Profile handlers ───────────────────────────────────────────────────────

  const handleSaveProfile = () => {
    if (!profileForm.name?.trim()) { addToast('Profile name is required', 'error'); return }
    const newProfile: SecurityProfile = {
      id: `sp${Date.now()}`, name: profileForm.name!, description: profileForm.description || '',
      scopeType: profileForm.scopeType || 'department', scopedEntities: profileForm.scopedEntities || [],
      includeSubOrgs: profileForm.includeSubOrgs || false, fieldRestrictions: profileForm.fieldRestrictions || [],
    }
    setProfiles(prev => [...prev, newProfile])
    addToast(`Security profile "${newProfile.name}" created`, 'success')
    setShowProfileForm(false)
    setProfileForm({ name: '', description: '', scopeType: 'department', scopedEntities: [], includeSubOrgs: false, fieldRestrictions: [] })
  }

  // ── Delegation handlers ────────────────────────────────────────────────────

  const handleSaveDelegation = () => {
    if (!delegationForm.delegator || !delegationForm.delegate) { addToast('Delegator and delegate are required', 'error'); return }
    const newDelegation: Delegation = {
      id: `d${Date.now()}`, delegator: delegationForm.delegator, delegate: delegationForm.delegate,
      type: delegationForm.type, processes: delegationForm.processes.split(',').map(p => p.trim()).filter(Boolean),
      startDate: delegationForm.startDate, endDate: delegationForm.endDate, status: 'active', reason: delegationForm.reason,
    }
    setDelegations(prev => [...prev, newDelegation])
    addToast('Delegation created', 'success')
    setShowDelegationForm(false)
    setDelegationForm({ delegator: '', delegate: '', type: 'Partial', processes: '', startDate: '', endDate: '', reason: '' })
  }

  const handleRevokeDelegation = (id: string) => {
    setDelegations(prev => prev.map(d => d.id === id ? { ...d, status: 'revoked' as const } : d))
    setShowRevokeModal(null)
    addToast('Delegation revoked', 'success')
  }

  // ── Field permission handlers ──────────────────────────────────────────────

  const cycleFieldAccess = (field: string, role: string) => {
    const key = `${fieldEntity}:${field}:${role}`
    const current = fieldMatrix[key]?.level || getDefaultFieldAccess(role, fieldEntity, field)
    const nextIdx = (ACCESS_CYCLE.indexOf(current) + 1) % ACCESS_CYCLE.length
    setFieldMatrix(prev => ({ ...prev, [key]: { level: ACCESS_CYCLE[nextIdx] } }))
    addToast(`${field} access for ${role} set to ${ACCESS_LABELS[ACCESS_CYCLE[nextIdx]]}`, 'info')
  }

  const getFieldAccess = (field: string, role: string): FieldAccessLevel => {
    const key = `${fieldEntity}:${field}:${role}`
    return (fieldMatrix[key] as any)?.level || getDefaultFieldAccess(role, fieldEntity, field)
  }

  // ── Export CSV ─────────────────────────────────────────────────────────────

  const handleExportAudit = () => {
    const headers = ['Timestamp', 'Actor', 'Action', 'Resource', 'Outcome', 'IP Address', 'Details']
    const rows = filteredAudit.map(e => [e.timestamp, e.actor, e.action, e.resource, e.outcome, e.ipAddress, e.details])
    const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `security-audit-${new Date().toISOString().slice(0, 10)}.csv`; a.click()
    URL.revokeObjectURL(url)
    addToast('Audit log exported', 'success')
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      <Header
        title="Security Administration"
        subtitle="Manage roles, permissions, delegations, and security audit trail"
        actions={
          <div className="flex items-center gap-2">
            <Badge variant="ai"><Shield size={12} className="mr-1" /> Admin Only</Badge>
          </div>
        }
      />

      <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} />

      <div className="mt-6">

        {/* ─── Tab 1: Roles & Permissions ─────────────────────────────────── */}
        {activeTab === 'roles' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-t3">{roles.length} roles configured ({roles.filter(r => r.type === 'custom').length} custom)</p>
              <Button size="sm" onClick={() => { setEditingRole(null); setRoleForm({ name: '', description: '', baseRole: 'Employee', securityProfile: 'Self Only', permissions: {} }); setShowRoleForm(true) }}>
                <Plus size={14} /> Create Custom Role
              </Button>
            </div>

            <Card>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-divider bg-canvas">
                      <th className="text-left px-4 py-3 font-medium text-t3">Role Name</th>
                      <th className="text-left px-4 py-3 font-medium text-t3">Type</th>
                      <th className="text-left px-4 py-3 font-medium text-t3">Members</th>
                      <th className="text-left px-4 py-3 font-medium text-t3">Permissions</th>
                      <th className="text-left px-4 py-3 font-medium text-t3">Security Profile</th>
                      <th className="text-right px-4 py-3 font-medium text-t3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {roles.map(role => (
                      <tr key={role.id} className="border-b border-divider last:border-0 hover:bg-canvas/50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {role.type === 'system' && <Lock size={12} className="text-t3" />}
                            <div>
                              <div className="font-medium text-t1">{role.name}</div>
                              <div className="text-t3 mt-0.5">{role.description}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={role.type === 'system' ? 'info' : 'orange'}>{role.type === 'system' ? 'System' : 'Custom'}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1"><Users size={12} className="text-t3" /> {role.members}</div>
                        </td>
                        <td className="px-4 py-3 text-t2">{role.permissionCount}</td>
                        <td className="px-4 py-3 text-t2">{role.securityProfile}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            {role.type === 'custom' && (
                              <>
                                <button onClick={() => handleEditRole(role)} className="p-1.5 rounded hover:bg-canvas text-t3 hover:text-t1 transition-colors" title="Edit"><Pencil size={13} /></button>
                                <button onClick={() => handleDeleteRole(role)} className="p-1.5 rounded hover:bg-red-50 text-t3 hover:text-red-600 transition-colors" title="Delete"><Trash2 size={13} /></button>
                              </>
                            )}
                            <button onClick={() => handleCloneRole(role)} className="p-1.5 rounded hover:bg-canvas text-t3 hover:text-t1 transition-colors" title="Clone"><Copy size={13} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Role Form Modal */}
            <Modal open={showRoleForm} onClose={() => { setShowRoleForm(false); setEditingRole(null) }} title={editingRole ? 'Edit Custom Role' : 'Create Custom Role'} size="xl">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Role Name" value={roleForm.name} onChange={e => setRoleForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Finance Approver" />
                  <Input label="Description" value={roleForm.description} onChange={e => setRoleForm(f => ({ ...f, description: e.target.value }))} placeholder="Brief role description" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Select
                    label="Base Role (inherit permissions)"
                    value={roleForm.baseRole}
                    onChange={e => setRoleForm(f => ({ ...f, baseRole: e.target.value }))}
                    options={[{ value: 'Employee', label: 'Employee' }, { value: 'Manager', label: 'Manager' }, { value: 'HRBP', label: 'HR Business Partner' }, { value: 'Admin', label: 'Admin' }]}
                  />
                  <Select
                    label="Security Profile"
                    value={roleForm.securityProfile}
                    onChange={e => setRoleForm(f => ({ ...f, securityProfile: e.target.value }))}
                    options={profiles.map(p => ({ value: p.name, label: p.name }))}
                  />
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-t1 mb-3">Permission Grid</h4>
                  <div className="border border-divider rounded-lg overflow-hidden">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-canvas border-b border-divider">
                          <th className="text-left px-3 py-2 font-medium text-t3">Module</th>
                          {PERMISSION_ACTIONS.map(a => <th key={a} className="text-center px-3 py-2 font-medium text-t3">{a}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {PERMISSION_MODULES.map(mod => (
                          <tr key={mod} className="border-b border-divider last:border-0">
                            <td className="px-3 py-2 font-medium text-t1">{mod}</td>
                            {PERMISSION_ACTIONS.map(action => {
                              const checked = roleForm.permissions[mod]?.includes(action) ?? false
                              return (
                                <td key={action} className="text-center px-3 py-2">
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => {
                                      setRoleForm(f => {
                                        const current = f.permissions[mod] || []
                                        const next = checked ? current.filter(a => a !== action) : [...current, action]
                                        return { ...f, permissions: { ...f.permissions, [mod]: next } }
                                      })
                                    }}
                                    className="rounded border-divider text-tempo-600 focus:ring-tempo-600/20"
                                  />
                                </td>
                              )
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="secondary" size="sm" onClick={() => { setShowRoleForm(false); setEditingRole(null) }}>Cancel</Button>
                  <Button size="sm" onClick={handleSaveRole}>{editingRole ? 'Save Changes' : 'Create Role'}</Button>
                </div>
              </div>
            </Modal>
          </div>
        )}

        {/* ─── Tab 2: Security Profiles ───────────────────────────────────── */}
        {activeTab === 'profiles' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-t3">{profiles.length} security profiles</p>
              <Button size="sm" onClick={() => setShowProfileForm(true)}>
                <Plus size={14} /> Create Profile
              </Button>
            </div>

            <Card>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-divider bg-canvas">
                      <th className="text-left px-4 py-3 font-medium text-t3">Profile Name</th>
                      <th className="text-left px-4 py-3 font-medium text-t3">Scope Type</th>
                      <th className="text-left px-4 py-3 font-medium text-t3">Scoped Entities</th>
                      <th className="text-left px-4 py-3 font-medium text-t3">Field Restrictions</th>
                      <th className="text-right px-4 py-3 font-medium text-t3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profiles.map(profile => (
                      <tr key={profile.id} className="border-b border-divider last:border-0 hover:bg-canvas/50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-medium text-t1">{profile.name}</div>
                          <div className="text-t3 mt-0.5">{profile.description}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            {SCOPE_ICONS[profile.scopeType]}
                            <span className="text-t2">{SCOPE_LABELS[profile.scopeType]}</span>
                            {profile.includeSubOrgs && <Badge variant="default">+sub-orgs</Badge>}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {profile.scopedEntities.length > 0
                            ? <div className="flex flex-wrap gap-1">{profile.scopedEntities.map(e => <Badge key={e} variant="default">{e}</Badge>)}</div>
                            : <span className="text-t3">All</span>
                          }
                        </td>
                        <td className="px-4 py-3">
                          {profile.fieldRestrictions.length > 0
                            ? <Badge variant="warning">{profile.fieldRestrictions.length} restrictions</Badge>
                            : <span className="text-t3">None</span>
                          }
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button className="p-1.5 rounded hover:bg-canvas text-t3 hover:text-t1 transition-colors" title="Edit"><Pencil size={13} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Profile Form Modal */}
            <Modal open={showProfileForm} onClose={() => setShowProfileForm(false)} title="Create Security Profile" size="lg">
              <div className="space-y-4">
                <Input label="Profile Name" value={profileForm.name || ''} onChange={e => setProfileForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Regional HR" />
                <Input label="Description" value={profileForm.description || ''} onChange={e => setProfileForm(f => ({ ...f, description: e.target.value }))} placeholder="Brief description" />
                <Select
                  label="Scope Type"
                  value={profileForm.scopeType || 'department'}
                  onChange={e => setProfileForm(f => ({ ...f, scopeType: e.target.value as SecurityProfile['scopeType'] }))}
                  options={[{ value: 'global', label: 'Global' }, { value: 'org', label: 'Organisation' }, { value: 'department', label: 'Department' }, { value: 'team', label: 'Team' }, { value: 'self', label: 'Self' }]}
                />
                {(profileForm.scopeType === 'department' || profileForm.scopeType === 'org') && (
                  <div className="space-y-2">
                    <label className="block text-xs font-medium text-t1">Scoped Entities</label>
                    <div className="flex flex-wrap gap-2">
                      {['Finance', 'Accounting', 'Information Technology', 'People Operations', 'Recruiting', 'Engineering', 'Sales', 'Marketing'].map(dept => (
                        <label key={dept} className="flex items-center gap-1.5 text-xs text-t2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={profileForm.scopedEntities?.includes(dept) ?? false}
                            onChange={() => {
                              setProfileForm(f => {
                                const current = f.scopedEntities || []
                                return { ...f, scopedEntities: current.includes(dept) ? current.filter(e => e !== dept) : [...current, dept] }
                              })
                            }}
                            className="rounded border-divider text-tempo-600 focus:ring-tempo-600/20"
                          />
                          {dept}
                        </label>
                      ))}
                    </div>
                  </div>
                )}
                <label className="flex items-center gap-2 text-xs text-t2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={profileForm.includeSubOrgs ?? false}
                    onChange={() => setProfileForm(f => ({ ...f, includeSubOrgs: !f.includeSubOrgs }))}
                    className="rounded border-divider text-tempo-600 focus:ring-tempo-600/20"
                  />
                  Include sub-organisations
                </label>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="secondary" size="sm" onClick={() => setShowProfileForm(false)}>Cancel</Button>
                  <Button size="sm" onClick={handleSaveProfile}>Create Profile</Button>
                </div>
              </div>
            </Modal>
          </div>
        )}

        {/* ─── Tab 3: Delegations ─────────────────────────────────────────── */}
        {activeTab === 'delegations' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-t3">{delegations.filter(d => d.status === 'active').length} active delegations</p>
              <Button size="sm" onClick={() => setShowDelegationForm(true)}>
                <Plus size={14} /> New Delegation
              </Button>
            </div>

            <Card>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-divider bg-canvas">
                      <th className="text-left px-4 py-3 font-medium text-t3">Delegator</th>
                      <th className="text-left px-4 py-3 font-medium text-t3"></th>
                      <th className="text-left px-4 py-3 font-medium text-t3">Delegate</th>
                      <th className="text-left px-4 py-3 font-medium text-t3">Type</th>
                      <th className="text-left px-4 py-3 font-medium text-t3">Processes</th>
                      <th className="text-left px-4 py-3 font-medium text-t3">Period</th>
                      <th className="text-left px-4 py-3 font-medium text-t3">Status</th>
                      <th className="text-right px-4 py-3 font-medium text-t3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {delegations.map(d => {
                      const sc = STATUS_CONFIG[d.status]
                      return (
                        <tr key={d.id} className="border-b border-divider last:border-0 hover:bg-canvas/50 transition-colors">
                          <td className="px-4 py-3 font-medium text-t1">{d.delegator}</td>
                          <td className="px-2 py-3"><ArrowRight size={12} className="text-t3" /></td>
                          <td className="px-4 py-3 font-medium text-t1">{d.delegate}</td>
                          <td className="px-4 py-3"><Badge variant={d.type === 'Full' ? 'orange' : 'default'}>{d.type}</Badge></td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-1">{d.processes.map(p => <Badge key={p} variant="info">{p}</Badge>)}</div>
                          </td>
                          <td className="px-4 py-3 text-t2 whitespace-nowrap">{formatDate(d.startDate)} — {formatDate(d.endDate)}</td>
                          <td className="px-4 py-3"><Badge variant={sc.variant}>{sc.label}</Badge></td>
                          <td className="px-4 py-3 text-right">
                            {d.status === 'active' && (
                              <button
                                onClick={() => setShowRevokeModal(d.id)}
                                className="text-xs text-red-600 hover:text-red-700 font-medium"
                              >
                                Revoke
                              </button>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Delegation Form Modal */}
            <Modal open={showDelegationForm} onClose={() => setShowDelegationForm(false)} title="New Delegation" size="lg">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Delegator" value={delegationForm.delegator} onChange={e => setDelegationForm(f => ({ ...f, delegator: e.target.value }))} placeholder="Person delegating authority" />
                  <Input label="Delegate" value={delegationForm.delegate} onChange={e => setDelegationForm(f => ({ ...f, delegate: e.target.value }))} placeholder="Person receiving authority" />
                </div>
                <Select
                  label="Delegation Type"
                  value={delegationForm.type}
                  onChange={e => setDelegationForm(f => ({ ...f, type: e.target.value }))}
                  options={[{ value: 'Full', label: 'Full — All processes' }, { value: 'Partial', label: 'Partial — Selected processes only' }]}
                />
                {delegationForm.type === 'Partial' && (
                  <Input label="Processes (comma-separated)" value={delegationForm.processes} onChange={e => setDelegationForm(f => ({ ...f, processes: e.target.value }))} placeholder="e.g. Expense Approval, Leave Approval" />
                )}
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Start Date" type="date" value={delegationForm.startDate} onChange={e => setDelegationForm(f => ({ ...f, startDate: e.target.value }))} />
                  <Input label="End Date" type="date" value={delegationForm.endDate} onChange={e => setDelegationForm(f => ({ ...f, endDate: e.target.value }))} />
                </div>
                <Input label="Reason" value={delegationForm.reason} onChange={e => setDelegationForm(f => ({ ...f, reason: e.target.value }))} placeholder="Why is this delegation needed?" />
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="secondary" size="sm" onClick={() => setShowDelegationForm(false)}>Cancel</Button>
                  <Button size="sm" onClick={handleSaveDelegation}>Create Delegation</Button>
                </div>
              </div>
            </Modal>

            {/* Revoke Confirmation Modal */}
            <Modal open={!!showRevokeModal} onClose={() => setShowRevokeModal(null)} title="Revoke Delegation" size="sm">
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg border border-red-200">
                  <AlertTriangle size={18} className="text-red-600 mt-0.5 shrink-0" />
                  <div className="text-xs text-red-800">
                    <p className="font-medium">This action cannot be undone.</p>
                    <p className="mt-1">The delegate will immediately lose all delegated authorities. Any pending approvals will be returned to the delegator.</p>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="secondary" size="sm" onClick={() => setShowRevokeModal(null)}>Cancel</Button>
                  <Button variant="danger" size="sm" onClick={() => showRevokeModal && handleRevokeDelegation(showRevokeModal)}>Revoke Delegation</Button>
                </div>
              </div>
            </Modal>
          </div>
        )}

        {/* ─── Tab 4: Field Permissions ───────────────────────────────────── */}
        {activeTab === 'fields' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <p className="text-xs text-t3">Click a cell to cycle access level</p>
                <div className="flex items-center gap-2">
                  {ACCESS_CYCLE.map(level => (
                    <div key={level} className="flex items-center gap-1">
                      <span className={`inline-block w-2.5 h-2.5 rounded-sm border ${ACCESS_COLORS[level]}`} />
                      <span className="text-[0.65rem] text-t3">{ACCESS_LABELS[level]}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Entity tabs */}
            <div className="flex gap-1 border-b border-divider">
              {FIELD_PERMISSION_ENTITIES.map(entity => (
                <button
                  key={entity}
                  onClick={() => setFieldEntity(entity)}
                  className={`px-3 py-2 text-xs font-medium transition-colors relative ${fieldEntity === entity ? 'text-tempo-600' : 'text-t3 hover:text-t1'}`}
                >
                  {entity}
                  {fieldEntity === entity && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-tempo-600 rounded-full" />}
                </button>
              ))}
            </div>

            <Card>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-divider bg-canvas">
                      <th className="text-left px-4 py-3 font-medium text-t3 min-w-[180px]">Field</th>
                      {FIELD_MATRIX_ROLES.map(role => (
                        <th key={role} className="text-center px-4 py-3 font-medium text-t3 min-w-[90px]">{role}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(ENTITY_FIELDS[fieldEntity] || []).map(field => (
                      <tr key={field} className="border-b border-divider last:border-0">
                        <td className="px-4 py-2.5 font-medium text-t1">{field}</td>
                        {FIELD_MATRIX_ROLES.map(role => {
                          const level = getFieldAccess(field, role)
                          const isAdmin = role === 'Owner' || role === 'Admin'
                          return (
                            <td key={role} className="text-center px-4 py-2.5">
                              <button
                                onClick={() => !isAdmin && cycleFieldAccess(field, role)}
                                disabled={isAdmin}
                                className={`inline-flex items-center px-2 py-1 rounded text-[0.6rem] font-semibold border transition-colors ${ACCESS_COLORS[level]} ${isAdmin ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:opacity-80'}`}
                                title={isAdmin ? 'Admin/Owner always has full access' : `Click to change — currently ${ACCESS_LABELS[level]}`}
                              >
                                {ACCESS_LABELS[level]}
                              </button>
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* ─── Tab 5: Audit Log ───────────────────────────────────────────── */}
        {activeTab === 'audit' && (
          <div className="space-y-4">
            {/* Summary stats */}
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: 'Total Events', value: auditStats.total, icon: <RotateCcw size={16} className="text-blue-500" /> },
                { label: 'Access Denied', value: auditStats.denied, icon: <XCircle size={16} className="text-red-500" /> },
                { label: 'Active Delegations', value: auditStats.delegationsActive, icon: <Users size={16} className="text-green-500" /> },
                { label: 'Role Changes', value: auditStats.roleChanges, icon: <Shield size={16} className="text-purple-500" /> },
              ].map(stat => (
                <Card key={stat.label}>
                  <div className="p-4 flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-canvas">{stat.icon}</div>
                    <div>
                      <div className="text-lg font-semibold text-t1">{stat.value}</div>
                      <div className="text-[0.65rem] text-t3">{stat.label}</div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-xs">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-t3" />
                <input
                  type="text"
                  placeholder="Search actor, resource, action..."
                  value={auditSearch}
                  onChange={e => setAuditSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-divider rounded-[var(--radius-input)] text-t1 placeholder:text-t3 focus:outline-none focus:ring-2 focus:ring-tempo-600/20 focus:border-tempo-600"
                />
              </div>
              <Select
                value={auditActionFilter}
                onChange={e => setAuditActionFilter(e.target.value)}
                options={[{ value: 'all', label: 'All Actions' }, { value: 'role', label: 'Role Changes' }, { value: 'permission', label: 'Permission Events' }, { value: 'delegation', label: 'Delegations' }, { value: 'login', label: 'Login Events' }, { value: 'session', label: 'Sessions' }, { value: 'field', label: 'Field Changes' }, { value: 'profile', label: 'Profile Updates' }, { value: 'rate_limit', label: 'Rate Limits' }]}
              />
              <Select
                value={auditOutcomeFilter}
                onChange={e => setAuditOutcomeFilter(e.target.value)}
                options={[{ value: 'all', label: 'All Outcomes' }, { value: 'success', label: 'Success' }, { value: 'denied', label: 'Denied' }, { value: 'error', label: 'Error' }]}
              />
              <Button variant="outline" size="sm" onClick={handleExportAudit}>
                <Download size={14} /> Export CSV
              </Button>
            </div>

            {/* Audit table */}
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-divider bg-canvas">
                      <th className="w-6 px-2 py-3"></th>
                      <th className="text-left px-4 py-3 font-medium text-t3">Timestamp</th>
                      <th className="text-left px-4 py-3 font-medium text-t3">Actor</th>
                      <th className="text-left px-4 py-3 font-medium text-t3">Action</th>
                      <th className="text-left px-4 py-3 font-medium text-t3">Resource</th>
                      <th className="text-left px-4 py-3 font-medium text-t3">Outcome</th>
                      <th className="text-left px-4 py-3 font-medium text-t3">IP Address</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAudit.map(entry => (
                      <>
                        <tr
                          key={entry.id}
                          onClick={() => setExpandedAudit(expandedAudit === entry.id ? null : entry.id)}
                          className="border-b border-divider last:border-0 hover:bg-canvas/50 cursor-pointer transition-colors"
                        >
                          <td className="px-2 py-3 text-t3">
                            {expandedAudit === entry.id ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                          </td>
                          <td className="px-4 py-3 text-t2 whitespace-nowrap">{formatTimestamp(entry.timestamp)}</td>
                          <td className="px-4 py-3 font-medium text-t1">{entry.actor}</td>
                          <td className="px-4 py-3">
                            <code className="px-1.5 py-0.5 bg-canvas rounded text-[0.6rem] font-mono text-t2">{entry.action}</code>
                          </td>
                          <td className="px-4 py-3 text-t2 max-w-[200px] truncate">{entry.resource}</td>
                          <td className="px-4 py-3">
                            <Badge variant={entry.outcome === 'success' ? 'success' : entry.outcome === 'denied' ? 'warning' : 'error'}>
                              {entry.outcome === 'success' && <CheckCircle size={10} className="mr-1" />}
                              {entry.outcome === 'denied' && <XCircle size={10} className="mr-1" />}
                              {entry.outcome === 'error' && <AlertTriangle size={10} className="mr-1" />}
                              {entry.outcome}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-t3 font-mono text-[0.6rem]">{entry.ipAddress}</td>
                        </tr>
                        {expandedAudit === entry.id && (
                          <tr key={`${entry.id}-detail`} className="border-b border-divider bg-canvas/30">
                            <td colSpan={7} className="px-10 py-3">
                              <div className="text-xs text-t2">{entry.details}</div>
                            </td>
                          </tr>
                        )}
                      </>
                    ))}
                  </tbody>
                </table>
              </div>
              {filteredAudit.length === 0 && (
                <div className="py-12 text-center text-xs text-t3">No audit entries match your filters</div>
              )}
            </Card>
          </div>
        )}

      </div>
    </>
  )
}
