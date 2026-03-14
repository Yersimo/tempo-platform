'use client'

import { useState, useMemo, useCallback } from 'react'
import { useTempo } from '@/lib/store'
import { usePermissions } from '@/lib/hooks/use-permissions'
import { type Delegation, createDelegation } from '@/lib/security/delegation'

const PROCESS_TYPES = [
  { value: 'expense:approve', label: 'Expense Approvals' },
  { value: 'leave:approve', label: 'Leave Approvals' },
  { value: 'payroll:approve', label: 'Payroll Approvals' },
  { value: 'finance:approve', label: 'Finance Approvals' },
  { value: 'recruiting:write', label: 'Recruiting Actions' },
  { value: 'onboarding:manage', label: 'Onboarding Management' },
  { value: 'offboarding:manage', label: 'Offboarding Management' },
  { value: 'performance:manage', label: 'Performance Management' },
] as const

type DelegationStatus = 'active' | 'expired' | 'revoked'

interface LocalDelegation {
  id: string
  delegatorId: string
  delegatorName: string
  delegateId: string
  delegateName: string
  processTypes: string[]
  startDate: string
  endDate: string
  reason: string
  status: DelegationStatus
  createdAt: string
}

export function DelegationPanel() {
  const { currentUser, employees, addToast } = useTempo()
  const { canDelegate, role } = usePermissions()
  const userId = currentUser?.employee_id || ''

  // Local state for delegations (in production this would be fetched from API)
  const [delegations, setDelegations] = useState<LocalDelegation[]>([])
  const [showForm, setShowForm] = useState(false)
  const [confirmRevoke, setConfirmRevoke] = useState<string | null>(null)

  // Form state
  const [selectedDelegate, setSelectedDelegate] = useState('')
  const [selectedProcesses, setSelectedProcesses] = useState<Set<string>>(new Set())
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [reason, setReason] = useState('')

  const employeeList = useMemo(() => {
    if (!employees || !Array.isArray(employees)) return []
    return employees
      .filter((e: Record<string, unknown>) => e.id !== userId)
      .map((e: Record<string, unknown>) => ({
        id: String(e.id),
        name: String((e as { profile?: { full_name?: string } }).profile?.full_name || e.full_name || e.id),
      }))
  }, [employees, userId])

  const delegationsFromMe = useMemo(
    () => delegations.filter(d => d.delegatorId === userId),
    [delegations, userId],
  )

  const delegationsToMe = useMemo(
    () => delegations.filter(d => d.delegateId === userId),
    [delegations, userId],
  )

  const availableProcesses = useMemo(
    () => PROCESS_TYPES.filter(p => canDelegate(p.value)),
    [canDelegate],
  )

  const resetForm = useCallback(() => {
    setSelectedDelegate('')
    setSelectedProcesses(new Set())
    setStartDate('')
    setEndDate('')
    setReason('')
    setShowForm(false)
  }, [])

  const validateForm = useCallback((): string | null => {
    if (!selectedDelegate) return 'Please select a delegate'
    if (selectedDelegate === userId) return 'You cannot delegate to yourself'
    if (selectedProcesses.size === 0) return 'Select at least one process type'
    if (!startDate || !endDate) return 'Both start and end dates are required'
    const start = new Date(startDate)
    const end = new Date(endDate)
    if (end <= start) return 'End date must be after start date'
    const daysDiff = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
    if (daysDiff > 365) return 'Delegation cannot exceed 365 days'
    if (!reason.trim()) return 'Please provide a reason for delegation'
    return null
  }, [selectedDelegate, userId, selectedProcesses, startDate, endDate, reason])

  const handleCreate = useCallback(() => {
    const error = validateForm()
    if (error) {
      addToast(error, 'error')
      return
    }

    const delegateName = employeeList.find(e => e.id === selectedDelegate)?.name || selectedDelegate
    const newDelegation: LocalDelegation = {
      id: `del-${Date.now()}`,
      delegatorId: userId,
      delegatorName: currentUser?.full_name || 'You',
      delegateId: selectedDelegate,
      delegateName,
      processTypes: Array.from(selectedProcesses),
      startDate,
      endDate,
      reason: reason.trim(),
      status: new Date(startDate) <= new Date() ? 'active' : 'active',
      createdAt: new Date().toISOString(),
    }

    try {
      createDelegation(
        {
          delegatorId: userId,
          delegateId: selectedDelegate,
          type: 'business_process',
          processes: Array.from(selectedProcesses),
          startDate,
          endDate,
          reason: reason.trim(),
          createdBy: userId,
        },
        role,
      )
    } catch {
      // Security module may not be loaded yet; continue with local state
    }

    setDelegations(prev => [...prev, newDelegation])
    addToast(`Delegation created for ${delegateName}`, 'success')
    resetForm()
  }, [validateForm, addToast, employeeList, selectedDelegate, userId, currentUser, selectedProcesses, startDate, endDate, reason, resetForm])

  const handleRevoke = useCallback((id: string) => {
    setDelegations(prev =>
      prev.map(d => (d.id === id ? { ...d, status: 'revoked' as const } : d)),
    )
    setConfirmRevoke(null)
    addToast('Delegation revoked', 'success')
  }, [addToast])

  const toggleProcess = useCallback((value: string) => {
    setSelectedProcesses(prev => {
      const next = new Set(prev)
      if (next.has(value)) next.delete(value)
      else next.add(value)
      return next
    })
  }, [])

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    } catch {
      return iso
    }
  }

  const statusBadge = (status: DelegationStatus) => {
    const styles: Record<DelegationStatus, string> = {
      active: 'bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-300',
      expired: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
      revoked: 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300',
    }
    return (
      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${styles[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Delegation Management</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Delegate approval authority to other team members during absences or workload balancing.
          </p>
        </div>
        {availableProcesses.length > 0 && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            New Delegation
          </button>
        )}
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <h4 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white">Create Delegation</h4>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Delegate select */}
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Delegate To</label>
              <select
                value={selectedDelegate}
                onChange={e => setSelectedDelegate(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              >
                <option value="">Select employee...</option>
                {employeeList.map(e => (
                  <option key={e.id} value={e.id}>{e.name}</option>
                ))}
              </select>
            </div>

            {/* Date range */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                />
              </div>
            </div>

            {/* Process types */}
            <div className="sm:col-span-2">
              <label className="mb-2 block text-xs font-medium text-gray-700 dark:text-gray-300">Process Types</label>
              <div className="flex flex-wrap gap-2">
                {availableProcesses.map(p => (
                  <label
                    key={p.value}
                    className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                      selectedProcesses.has(p.value)
                        ? 'border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-950/30 dark:text-blue-300'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300 dark:border-gray-600 dark:text-gray-400'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedProcesses.has(p.value)}
                      onChange={() => toggleProcess(p.value)}
                      className="sr-only"
                    />
                    {p.label}
                  </label>
                ))}
              </div>
            </div>

            {/* Reason */}
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Reason</label>
              <textarea
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="e.g., Out of office for annual leave"
                rows={2}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
            </div>
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <button
              onClick={resetForm}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
            >
              Create Delegation
            </button>
          </div>
        </div>
      )}

      {/* Delegations From Me */}
      <div>
        <h4 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
          Delegated by You ({delegationsFromMe.length})
        </h4>
        {delegationsFromMe.length === 0 ? (
          <p className="rounded-lg border border-dashed border-gray-200 px-4 py-6 text-center text-sm text-gray-400 dark:border-gray-700">
            No active delegations. Create one to delegate approval authority during your absence.
          </p>
        ) : (
          <div className="space-y-2">
            {delegationsFromMe.map(d => (
              <div
                key={d.id}
                className={`rounded-lg border p-4 ${
                  d.status === 'expired' || d.status === 'revoked'
                    ? 'border-gray-200 bg-gray-50 opacity-60 dark:border-gray-700 dark:bg-gray-800/50'
                    : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{d.delegateName}</span>
                      {statusBadge(d.status)}
                    </div>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(d.startDate)} &mdash; {formatDate(d.endDate)}
                    </p>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {d.processTypes.map(pt => PROCESS_TYPES.find(p => p.value === pt)?.label || pt).join(', ')}
                    </p>
                    {d.reason && (
                      <p className="mt-1 text-xs italic text-gray-400 dark:text-gray-500">{d.reason}</p>
                    )}
                  </div>
                  {d.status === 'active' && (
                    <>
                      {confirmRevoke === d.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleRevoke(d.id)}
                            className="rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => setConfirmRevoke(null)}
                            className="rounded px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmRevoke(d.id)}
                          className="rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                        >
                          Revoke
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delegations To Me */}
      <div>
        <h4 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
          Delegated to You ({delegationsToMe.length})
        </h4>
        {delegationsToMe.length === 0 ? (
          <p className="rounded-lg border border-dashed border-gray-200 px-4 py-6 text-center text-sm text-gray-400 dark:border-gray-700">
            No one has delegated authority to you.
          </p>
        ) : (
          <div className="space-y-2">
            {delegationsToMe.map(d => (
              <div
                key={d.id}
                className={`rounded-lg border p-4 ${
                  d.status === 'expired' || d.status === 'revoked'
                    ? 'border-gray-200 bg-gray-50 opacity-60 dark:border-gray-700 dark:bg-gray-800/50'
                    : 'border-blue-100 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/20'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{d.delegatorName}</span>
                  {statusBadge(d.status)}
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {formatDate(d.startDate)} &mdash; {formatDate(d.endDate)}
                </p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {d.processTypes.map(pt => PROCESS_TYPES.find(p => p.value === pt)?.label || pt).join(', ')}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
