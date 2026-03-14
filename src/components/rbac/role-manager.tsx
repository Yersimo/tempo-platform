'use client'

import { useState, useMemo, useCallback } from 'react'
import { useTempo } from '@/lib/store'
import {
  type Permission,
  ROLE_PERMISSIONS,
  ROLE_LABELS,
  ALL_ROLES,
  hasPermission,
} from '@/lib/security/permissions'
import { type CustomRole } from '@/lib/security/custom-roles'

// ── Permission groups for the UI ──────────────────────────────────────────

const PERMISSION_GROUPS: { label: string; permissions: { value: string; label: string }[] }[] = [
  {
    label: 'People',
    permissions: [
      { value: 'people:read', label: 'View Employees' },
      { value: 'people:write', label: 'Edit Employees' },
      { value: 'people:delete', label: 'Delete Employees' },
    ],
  },
  {
    label: 'Performance',
    permissions: [
      { value: 'performance:read', label: 'View Reviews' },
      { value: 'performance:write', label: 'Write Reviews' },
      { value: 'performance:manage', label: 'Manage Performance' },
    ],
  },
  {
    label: 'Compensation',
    permissions: [
      { value: 'compensation:read', label: 'View Compensation' },
      { value: 'compensation:write', label: 'Edit Compensation' },
    ],
  },
  {
    label: 'Payroll',
    permissions: [
      { value: 'payroll:read', label: 'View Payroll' },
      { value: 'payroll:run', label: 'Run Payroll' },
      { value: 'payroll:approve', label: 'Approve Payroll' },
    ],
  },
  {
    label: 'Finance',
    permissions: [
      { value: 'finance:read', label: 'View Finance' },
      { value: 'finance:write', label: 'Edit Finance' },
      { value: 'finance:approve', label: 'Approve Finance' },
      { value: 'invoices:read', label: 'View Invoices' },
      { value: 'invoices:write', label: 'Edit Invoices' },
      { value: 'budgets:read', label: 'View Budgets' },
      { value: 'budgets:write', label: 'Edit Budgets' },
    ],
  },
  {
    label: 'Expenses & Leave',
    permissions: [
      { value: 'expense:read', label: 'View Expenses' },
      { value: 'expense:submit', label: 'Submit Expenses' },
      { value: 'expense:approve', label: 'Approve Expenses' },
      { value: 'leave:read', label: 'View Leave' },
      { value: 'leave:submit', label: 'Submit Leave' },
      { value: 'leave:approve', label: 'Approve Leave' },
    ],
  },
  {
    label: 'HR Operations',
    permissions: [
      { value: 'benefits:read', label: 'View Benefits' },
      { value: 'benefits:manage', label: 'Manage Benefits' },
      { value: 'time:read', label: 'View Time' },
      { value: 'time:manage', label: 'Manage Time' },
      { value: 'onboarding:read', label: 'View Onboarding' },
      { value: 'onboarding:manage', label: 'Manage Onboarding' },
      { value: 'offboarding:read', label: 'View Offboarding' },
      { value: 'offboarding:manage', label: 'Manage Offboarding' },
    ],
  },
  {
    label: 'IT & Identity',
    permissions: [
      { value: 'it:read', label: 'View IT Assets' },
      { value: 'it:manage', label: 'Manage IT' },
      { value: 'it:admin', label: 'IT Admin' },
      { value: 'identity:read', label: 'View Identity' },
      { value: 'identity:manage', label: 'Manage Identity' },
    ],
  },
  {
    label: 'Recruiting',
    permissions: [
      { value: 'recruiting:read', label: 'View Recruiting' },
      { value: 'recruiting:write', label: 'Edit Recruiting' },
      { value: 'headcount:read', label: 'View Headcount' },
      { value: 'headcount:write', label: 'Edit Headcount' },
    ],
  },
  {
    label: 'Admin & Settings',
    permissions: [
      { value: 'compliance:read', label: 'View Compliance' },
      { value: 'compliance:manage', label: 'Manage Compliance' },
      { value: 'documents:read', label: 'View Documents' },
      { value: 'documents:write', label: 'Edit Documents' },
      { value: 'settings:read', label: 'View Settings' },
      { value: 'settings:manage', label: 'Manage Settings' },
      { value: 'workflows:read', label: 'View Workflows' },
      { value: 'workflows:manage', label: 'Manage Workflows' },
      { value: 'analytics:read', label: 'View Analytics' },
      { value: 'admin:full', label: 'Full Admin Access' },
    ],
  },
]

interface LocalCustomRole {
  id: string
  name: string
  description: string
  baseRole: string
  permissions: Set<string>
  isSystem: boolean
  memberCount: number
  createdAt: string
}

type EditorMode = 'list' | 'create' | 'edit' | 'preview'

export function RoleManager() {
  const { addToast } = useTempo()

  // Build system roles from ROLE_PERMISSIONS
  const systemRoles: LocalCustomRole[] = useMemo(
    () =>
      ALL_ROLES.map(r => ({
        id: `system-${r}`,
        name: ROLE_LABELS[r] || r,
        description: `Built-in ${r} role`,
        baseRole: r,
        permissions: new Set(ROLE_PERMISSIONS[r] || []),
        isSystem: true,
        memberCount: r === 'employee' ? 42 : r === 'manager' ? 8 : r === 'admin' ? 3 : r === 'hrbp' ? 4 : 1,
        createdAt: '',
      })),
    [],
  )

  const [customRoles, setCustomRoles] = useState<LocalCustomRole[]>([])
  const [mode, setMode] = useState<EditorMode>('list')
  const [editingRole, setEditingRole] = useState<LocalCustomRole | null>(null)

  // Form state
  const [formName, setFormName] = useState('')
  const [formDesc, setFormDesc] = useState('')
  const [formBase, setFormBase] = useState('employee')
  const [formPerms, setFormPerms] = useState<Set<string>>(new Set())
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const allRoles = useMemo(() => [...systemRoles, ...customRoles], [systemRoles, customRoles])

  const startCreate = useCallback(() => {
    setFormName('')
    setFormDesc('')
    setFormBase('employee')
    setFormPerms(new Set(ROLE_PERMISSIONS.employee || []))
    setEditingRole(null)
    setMode('create')
  }, [])

  const startEdit = useCallback((role: LocalCustomRole) => {
    if (role.isSystem) {
      addToast('System roles cannot be edited', 'error')
      return
    }
    setFormName(role.name)
    setFormDesc(role.description)
    setFormBase(role.baseRole)
    setFormPerms(new Set(role.permissions))
    setEditingRole(role)
    setMode('edit')
  }, [addToast])

  const startClone = useCallback((role: LocalCustomRole) => {
    setFormName(`${role.name} (Copy)`)
    setFormDesc(role.description)
    setFormBase(role.baseRole)
    setFormPerms(new Set(role.permissions))
    setEditingRole(null)
    setMode('create')
  }, [])

  const handlePreview = useCallback((role: LocalCustomRole) => {
    setEditingRole(role)
    setMode('preview')
  }, [])

  const handleBaseChange = useCallback((base: string) => {
    setFormBase(base)
    // Apply base role permissions as starting point
    setFormPerms(new Set(ROLE_PERMISSIONS[base] || []))
  }, [])

  const togglePerm = useCallback((perm: string) => {
    setFormPerms(prev => {
      const next = new Set(prev)
      if (next.has(perm)) next.delete(perm)
      else next.add(perm)
      return next
    })
  }, [])

  const handleSave = useCallback(() => {
    if (!formName.trim()) {
      addToast('Role name is required', 'error')
      return
    }
    if (formPerms.size === 0) {
      addToast('Select at least one permission', 'error')
      return
    }
    // Check name uniqueness
    const nameTaken = allRoles.some(
      r => r.name.toLowerCase() === formName.trim().toLowerCase() && r.id !== editingRole?.id,
    )
    if (nameTaken) {
      addToast('A role with this name already exists', 'error')
      return
    }

    if (editingRole) {
      // Update existing
      setCustomRoles(prev =>
        prev.map(r =>
          r.id === editingRole.id
            ? { ...r, name: formName.trim(), description: formDesc.trim(), baseRole: formBase, permissions: new Set(formPerms) }
            : r,
        ),
      )
      addToast(`Role "${formName.trim()}" updated`, 'success')
    } else {
      // Create new
      const newRole: LocalCustomRole = {
        id: `custom-${Date.now()}`,
        name: formName.trim(),
        description: formDesc.trim(),
        baseRole: formBase,
        permissions: new Set(formPerms),
        isSystem: false,
        memberCount: 0,
        createdAt: new Date().toISOString(),
      }
      setCustomRoles(prev => [...prev, newRole])
      addToast(`Role "${formName.trim()}" created`, 'success')
    }
    setMode('list')
  }, [formName, formDesc, formBase, formPerms, editingRole, allRoles, addToast])

  const handleDelete = useCallback((id: string) => {
    const role = customRoles.find(r => r.id === id)
    if (!role) return
    if (role.memberCount > 0) {
      addToast('Cannot delete a role with assigned members. Reassign members first.', 'error')
      setConfirmDelete(null)
      return
    }
    setCustomRoles(prev => prev.filter(r => r.id !== id))
    setConfirmDelete(null)
    addToast(`Role "${role.name}" deleted`, 'success')
  }, [customRoles, addToast])

  // ── Preview mode ──────────────────────────────────────────────────────

  if (mode === 'preview' && editingRole) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Role Preview: {editingRole.name}
          </h3>
          <button
            onClick={() => setMode('list')}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Back
          </button>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">{editingRole.description}</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PERMISSION_GROUPS.map(group => {
            const groupPerms = group.permissions.filter(p => editingRole.permissions.has(p.value))
            if (groupPerms.length === 0) return null
            return (
              <div key={group.label} className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                <h5 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  {group.label}
                </h5>
                <div className="space-y-1">
                  {groupPerms.map(p => (
                    <div key={p.value} className="flex items-center gap-1.5 text-xs text-gray-700 dark:text-gray-300">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                      {p.label}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // ── Create / Edit mode ────────────────────────────────────────────────

  if (mode === 'create' || mode === 'edit') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {mode === 'create' ? 'Create Custom Role' : `Edit: ${editingRole?.name}`}
          </h3>
          <button
            onClick={() => setMode('list')}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Cancel
          </button>
        </div>

        {/* Basic info */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Role Name</label>
            <input
              value={formName}
              onChange={e => setFormName(e.target.value)}
              placeholder="e.g., Regional HR Manager"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Base Role</label>
            <select
              value={formBase}
              onChange={e => handleBaseChange(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            >
              {ALL_ROLES.map(r => (
                <option key={r} value={r}>{ROLE_LABELS[r] || r}</option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Description</label>
            <input
              value={formDesc}
              onChange={e => setFormDesc(e.target.value)}
              placeholder="Describe the purpose of this role..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
          </div>
        </div>

        {/* Permission checkboxes */}
        <div>
          <h4 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
            Permissions ({formPerms.size} selected)
          </h4>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {PERMISSION_GROUPS.map(group => (
              <div key={group.label} className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                <h5 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  {group.label}
                </h5>
                <div className="space-y-1.5">
                  {group.permissions.map(p => (
                    <label key={p.value} className="flex cursor-pointer items-center gap-2 text-xs">
                      <input
                        type="checkbox"
                        checked={formPerms.has(p.value)}
                        onChange={() => togglePerm(p.value)}
                        className="h-3.5 w-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-gray-700 dark:text-gray-300">{p.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={() => setMode('list')}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            {mode === 'create' ? 'Create Role' : 'Save Changes'}
          </button>
        </div>
      </div>
    )
  }

  // ── List mode ─────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Role Management</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Manage system and custom roles. Custom roles extend base roles with additional permissions.
          </p>
        </div>
        <button
          onClick={startCreate}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          Create Role
        </button>
      </div>

      {/* System Roles */}
      <div>
        <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          System Roles
        </h4>
        <div className="space-y-2">
          {systemRoles.map(role => (
            <div
              key={role.id}
              className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-900"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                  {role.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{role.name}</span>
                    <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                      SYSTEM
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {role.permissions.size} permissions &middot; {role.memberCount} member{role.memberCount !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handlePreview(role)}
                  className="rounded px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  View
                </button>
                <button
                  onClick={() => startClone(role)}
                  className="rounded px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  Clone
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Custom Roles */}
      <div>
        <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          Custom Roles ({customRoles.length})
        </h4>
        {customRoles.length === 0 ? (
          <p className="rounded-lg border border-dashed border-gray-200 px-4 py-6 text-center text-sm text-gray-400 dark:border-gray-700">
            No custom roles created yet. Click &ldquo;Create Role&rdquo; to define a new one.
          </p>
        ) : (
          <div className="space-y-2">
            {customRoles.map(role => (
              <div
                key={role.id}
                className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-900"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600 dark:bg-blue-950/30 dark:text-blue-300">
                    {role.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{role.name}</span>
                      <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-600 dark:bg-blue-950/30 dark:text-blue-300">
                        CUSTOM
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Based on {ROLE_LABELS[role.baseRole] || role.baseRole} &middot; {role.permissions.size} permissions &middot; {role.memberCount} member{role.memberCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handlePreview(role)}
                    className="rounded px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    View
                  </button>
                  <button
                    onClick={() => startClone(role)}
                    className="rounded px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    Clone
                  </button>
                  <button
                    onClick={() => startEdit(role)}
                    className="rounded px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30"
                  >
                    Edit
                  </button>
                  {confirmDelete === role.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDelete(role.id)}
                        className="rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setConfirmDelete(null)}
                        className="rounded px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDelete(role.id)}
                      className="rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
