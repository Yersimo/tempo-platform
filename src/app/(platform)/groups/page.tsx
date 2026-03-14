'use client'

import { useState, useMemo, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Header } from '@/components/layout/header'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { StatCard } from '@/components/ui/stat-card'
import { Progress } from '@/components/ui/progress'
import { Modal } from '@/components/ui/modal'
import { Input, Select, Textarea } from '@/components/ui/input'
import { PageSkeleton } from '@/components/ui/page-skeleton'
import { Network, Users, Plus, Settings, Filter, RefreshCw, Trash2, Edit, Eye, CheckCircle, AlertTriangle, Layers, Shield, BookOpen, Briefcase, Clock, DollarSign } from 'lucide-react'
import { useTempo } from '@/lib/store'

const RULE_FIELDS = [
  { value: 'department', label: 'Department', operators: ['equals', 'not_equals', 'in'], example: 'Engineering' },
  { value: 'country', label: 'Country', operators: ['equals', 'not_equals', 'in'], example: 'Ghana, Nigeria' },
  { value: 'job_level', label: 'Job Level', operators: ['equals', 'gte', 'lte'], example: 'VP' },
  { value: 'hire_date', label: 'Hire Date', operators: ['after', 'before', 'between'], example: '2026-01-01' },
  { value: 'status', label: 'Employment Status', operators: ['equals', 'not_equals'], example: 'active' },
]

const AVAILABLE_MODULES = [
  { value: 'access', label: 'Access Control' },
  { value: 'benefits', label: 'Benefits' },
  { value: 'payroll', label: 'Payroll' },
  { value: 'compensation', label: 'Compensation' },
  { value: 'equity', label: 'Equity' },
  { value: 'compliance', label: 'Compliance' },
  { value: 'onboarding', label: 'Onboarding' },
  { value: 'learning', label: 'Learning' },
  { value: 'time', label: 'Time & Attendance' },
  { value: 'performance', label: 'Performance' },
]

const MODULE_ICONS: Record<string, React.ReactNode> = {
  access: <Shield size={14} />,
  benefits: <CheckCircle size={14} />,
  payroll: <DollarSign size={14} />,
  compensation: <DollarSign size={14} />,
  equity: <Briefcase size={14} />,
  compliance: <AlertTriangle size={14} />,
  onboarding: <Users size={14} />,
  learning: <BookOpen size={14} />,
  time: <Clock size={14} />,
  performance: <Layers size={14} />,
}

export default function GroupsPage() {
  const tc = useTranslations('common')
  const { employees, groups, addGroup, updateGroup, deleteGroup: removeGroup, addToast, ensureModulesLoaded } = useTempo()

  const [pageLoading, setPageLoading] = useState(true)

  useEffect(() => { ensureModulesLoaded?.(['groups', 'employees'])?.then?.(() => setPageLoading(false))?.catch?.(() => setPageLoading(false)) }, [])
  useEffect(() => { const t = setTimeout(() => setPageLoading(false), 2000); return () => clearTimeout(t) }, [])

  const [saving, setSaving] = useState(false)
  const [confirmAction, setConfirmAction] = useState<{show:boolean, type:string, id:string, label:string}|null>(null)
  const [activeTab, setActiveTab] = useState<'groups' | 'rules' | 'modules'>('groups')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingGroup, setEditingGroup] = useState<any | null>(null)
  const [showMembersModal, setShowMembersModal] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState<any | null>(null)
  const [filterType, setFilterType] = useState<'all' | 'dynamic' | 'static'>('all')

  const [groupForm, setGroupForm] = useState({
    name: '',
    description: '',
    type: 'dynamic' as 'dynamic' | 'static',
    rule_field: 'department',
    rule_operator: 'equals',
    rule_value: '',
    modules: [] as string[],
  })

  // Stats
  const totalGroups = groups.length
  const dynamicCount = groups.filter(g => g.type === 'dynamic').length
  const staticCount = groups.filter(g => g.type === 'static').length
  const totalMembers = groups.reduce((a, g) => a + g.member_count, 0)

  const filteredGroups = useMemo(() => {
    if (filterType === 'all') return groups
    return groups.filter(g => g.type === filterType)
  }, [groups, filterType])

  // Module usage matrix
  const moduleUsage = useMemo(() => {
    const usage: Record<string, string[]> = {}
    AVAILABLE_MODULES.forEach(m => { usage[m.value] = [] })
    groups.forEach(g => {
      g.modules.forEach((mod: string) => {
        if (usage[mod]) usage[mod].push(g.name)
      })
    })
    return usage
  }, [groups])

  function formatRule(group: any) {
    if (!group.rule) return 'Manual membership'
    const val = Array.isArray(group.rule.value) ? group.rule.value.join(', ') : group.rule.value
    return `${group.rule.field} ${group.rule.operator} ${val}`
  }

  function formatDate(dateStr: string | null) {
    if (!dateStr) return 'Never'
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  function openCreate() {
    setGroupForm({ name: '', description: '', type: 'dynamic', rule_field: 'department', rule_operator: 'equals', rule_value: '', modules: [] })
    setShowCreateModal(true)
  }

  function toggleModule(mod: string) {
    setGroupForm(prev => ({
      ...prev,
      modules: prev.modules.includes(mod) ? prev.modules.filter(m => m !== mod) : [...prev.modules, mod],
    }))
  }

  async function submitGroup() {
    if (!groupForm.name) { addToast('Group name is required', 'error'); return }
    if (groupForm.type === 'dynamic' && !groupForm.rule_value) { addToast('Rule value is required for dynamic groups', 'error'); return }
    setSaving(true)
    try {
      addGroup({
        name: groupForm.name,
        description: groupForm.description,
        type: groupForm.type,
        rule: groupForm.type === 'dynamic' ? { field: groupForm.rule_field, operator: groupForm.rule_operator, value: groupForm.rule_value } : null,
        member_count: 0,
        created_by: 'emp-1',
        last_synced_at: groupForm.type === 'dynamic' ? new Date().toISOString() : null,
        modules: groupForm.modules,
      })
      setShowCreateModal(false)
      addToast(`Group "${groupForm.name}" created`, 'success')
    } finally {
      setSaving(false)
    }
  }

  function openEditGroup(group: any) {
    setEditingGroup(group)
    setGroupForm({
      name: group.name,
      description: group.description || '',
      type: group.type,
      rule_field: group.rule?.field || 'department',
      rule_operator: group.rule?.operator || 'equals',
      rule_value: Array.isArray(group.rule?.value) ? group.rule.value.join(', ') : (group.rule?.value || ''),
      modules: [...(group.modules || [])],
    })
    setShowEditModal(true)
  }

  function submitEditGroup() {
    if (!editingGroup || !groupForm.name) return
    updateGroup(editingGroup.id, {
      name: groupForm.name,
      description: groupForm.description,
      type: groupForm.type,
      rule: groupForm.type === 'dynamic' ? { field: groupForm.rule_field, operator: groupForm.rule_operator, value: groupForm.rule_value } : null,
      modules: groupForm.modules,
    })
    setShowEditModal(false)
    setEditingGroup(null)
  }

  function syncGroup(id: string) {
    updateGroup(id, { last_synced_at: new Date().toISOString() })
  }

  function handleDeleteGroup(id: string) {
    removeGroup(id)
  }

  function viewMembers(group: any) {
    setSelectedGroup(group)
    setShowMembersModal(true)
  }

  const sampleMembers = useMemo(() => {
    if (!selectedGroup) return []
    return employees.slice(0, selectedGroup.member_count)
  }, [selectedGroup, employees])

  const currentFieldDef = RULE_FIELDS.find(f => f.value === groupForm.rule_field)

  if (pageLoading) {
    return (
      <>
        <Header title="Groups" subtitle="Dynamic supergroups with rule-based membership" actions={<Button size="sm" disabled><Plus size={14} /> Create Group</Button>} />
        <div className="p-6"><PageSkeleton /></div>
      </>
    )
  }

  return (
    <>
      <Header
        title="Groups"
        subtitle="Dynamic supergroups with rule-based membership"
        actions={<Button size="sm" onClick={openCreate}><Plus size={14} /> Create Group</Button>}
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Groups" value={totalGroups} icon={<Network size={20} />} />
        <StatCard label="Dynamic Groups" value={dynamicCount} change="Rule-based" changeType="positive" icon={<RefreshCw size={20} />} />
        <StatCard label="Static Groups" value={staticCount} icon={<Users size={20} />} />
        <StatCard label="Total Members" value={totalMembers} icon={<Users size={20} />} />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-divider">
        {([
          { key: 'groups', label: 'All Groups' },
          { key: 'rules', label: 'Rules' },
          { key: 'modules', label: 'Module Usage' },
        ] as const).map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-accent text-accent'
                : 'border-transparent text-t3 hover:text-t1'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── All Groups Tab ── */}
      {activeTab === 'groups' && (
        <>
          {/* Filter Bar */}
          <div className="flex items-center gap-2 mb-4">
            <Filter size={14} className="text-t3" />
            <span className="text-xs text-t3">Filter:</span>
            {(['all', 'dynamic', 'static'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilterType(f)}
                className={`px-3 py-1 text-xs rounded-full transition-colors ${
                  filterType === f
                    ? 'bg-accent text-white'
                    : 'bg-canvas text-t2 hover:bg-border'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>

          {/* Group Cards Grid */}
          {filteredGroups.length === 0 && (
            <div className="text-center py-12">
              <Network size={40} className="mx-auto mb-3 text-t3/50" />
              <p className="text-sm font-medium text-t1 mb-1">No groups yet</p>
              <p className="text-xs text-t3 mb-4">Create dynamic or static groups to organize employees and assign module access automatically.</p>
              <Button size="sm" onClick={openCreate}><Plus size={14} /> Create Group</Button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredGroups.map(group => (
              <Card key={group.id}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-semibold text-t1">{group.name}</h3>
                      <Badge variant={group.type === 'dynamic' ? 'info' : 'default'}>
                        {group.type}
                      </Badge>
                    </div>
                    <p className="text-xs text-t3">{group.description}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Network size={16} className="text-t3" />
                  </div>
                </div>

                {/* Rule */}
                <div className="bg-canvas rounded-lg px-3 py-2 mb-3">
                  <p className="text-xs text-t3 mb-0.5">Rule</p>
                  <p className="text-xs font-mono text-t1">{formatRule(group)}</p>
                </div>

                {/* Stats Row */}
                <div className="flex items-center gap-4 mb-3">
                  <div className="flex items-center gap-1.5">
                    <Users size={13} className="text-t3" />
                    <span className="text-xs font-medium text-t1">{group.member_count}</span>
                    <span className="text-xs text-t3">members</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock size={13} className="text-t3" />
                    <span className="text-xs text-t3">Synced {formatDate(group.last_synced_at)}</span>
                  </div>
                </div>

                {/* Module Badges */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {group.modules.map((mod: string) => (
                    <span key={mod} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-canvas text-xs text-t2 border border-divider">
                      {MODULE_ICONS[mod]}
                      {AVAILABLE_MODULES.find(m => m.value === mod)?.label || mod}
                    </span>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2 border-t border-divider">
                  <Button size="sm" variant="secondary" onClick={() => viewMembers(group)}>
                    <Eye size={12} /> View Members
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => openEditGroup(group)}>
                    <Edit size={12} /> Edit
                  </Button>
                  {group.type === 'dynamic' && (
                    <Button size="sm" variant="ghost" onClick={() => syncGroup(group.id)}>
                      <RefreshCw size={12} /> Sync Now
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => handleDeleteGroup(group.id)}>
                    <Trash2 size={12} />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* ── Rules Tab ── */}
      {activeTab === 'rules' && (
        <div className="space-y-6">
          <Card>
            <h3 className="text-sm font-semibold text-t1 mb-4 flex items-center gap-2">
              <Settings size={16} /> Available Rule Fields
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-divider bg-canvas">
                    <th className="tempo-th text-left px-6 py-3">Field</th>
                    <th className="tempo-th text-left px-4 py-3">Operators</th>
                    <th className="tempo-th text-left px-4 py-3">Example Value</th>
                    <th className="tempo-th text-center px-4 py-3">Groups Using</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {RULE_FIELDS.map(field => {
                    const usingCount = groups.filter(g => g.rule?.field === field.value).length
                    return (
                      <tr key={field.value} className="hover:bg-canvas/50">
                        <td className="px-6 py-3">
                          <p className="text-xs font-medium text-t1">{field.label}</p>
                          <p className="text-xs text-t3 font-mono">{field.value}</p>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {field.operators.map(op => (
                              <Badge key={op} variant="default">{op}</Badge>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-t2 font-mono">{field.example}</td>
                        <td className="px-4 py-3 text-center">
                          <span className="text-xs font-medium text-t1">{usingCount}</span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Rule Builder Preview */}
          <Card>
            <h3 className="text-sm font-semibold text-t1 mb-4 flex items-center gap-2">
              <Filter size={16} /> Rule Builder Preview
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <Select
                label="Field"
                value={groupForm.rule_field}
                onChange={(e) => setGroupForm({ ...groupForm, rule_field: e.target.value })}
                options={RULE_FIELDS.map(f => ({ value: f.value, label: f.label }))}
              />
              <Select
                label="Operator"
                value={groupForm.rule_operator}
                onChange={(e) => setGroupForm({ ...groupForm, rule_operator: e.target.value })}
                options={(currentFieldDef?.operators || ['equals']).map(op => ({ value: op, label: op }))}
              />
              <Input
                label="Value"
                placeholder={currentFieldDef?.example || 'Enter value'}
                value={groupForm.rule_value}
                onChange={(e) => setGroupForm({ ...groupForm, rule_value: e.target.value })}
              />
            </div>
            <div className="bg-canvas rounded-lg px-4 py-3">
              <p className="text-xs text-t3 mb-1">Generated Rule</p>
              <p className="text-sm font-mono text-t1">
                {groupForm.rule_field} {groupForm.rule_operator} &quot;{groupForm.rule_value || '...'}&quot;
              </p>
            </div>
          </Card>
        </div>
      )}

      {/* ── Module Usage Tab ── */}
      {activeTab === 'modules' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {AVAILABLE_MODULES.map(mod => {
            const assignedGroups = moduleUsage[mod.value] || []
            const usagePct = totalGroups > 0 ? Math.round((assignedGroups.length / totalGroups) * 100) : 0
            return (
              <Card key={mod.value}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                    {MODULE_ICONS[mod.value] || <Layers size={14} />}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-t1">{mod.label}</h3>
                    <p className="text-xs text-t3">{assignedGroups.length} group{assignedGroups.length !== 1 ? 's' : ''} assigned</p>
                  </div>
                </div>
                <Progress value={usagePct} color="orange" />
                <p className="text-xs text-t3 mt-1">{usagePct}% of groups</p>
                {assignedGroups.length > 0 && (
                  <div className="mt-3 space-y-1">
                    {assignedGroups.map(name => (
                      <div key={name} className="flex items-center gap-1.5 text-xs text-t2">
                        <CheckCircle size={12} className="text-success" />
                        {name}
                      </div>
                    ))}
                  </div>
                )}
                {assignedGroups.length === 0 && (
                  <p className="text-xs text-t3 mt-3 italic">No groups assigned</p>
                )}
              </Card>
            )
          })}
        </div>
      )}

      {/* ── Create Group Modal ── */}
      <Modal open={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create Group">
        <div className="space-y-4">
          <Input
            label="Group Name"
            placeholder="e.g. All Engineering"
            value={groupForm.name}
            onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
          />
          <Textarea
            label="Description"
            placeholder="Describe the purpose of this group"
            rows={2}
            value={groupForm.description}
            onChange={(e) => setGroupForm({ ...groupForm, description: e.target.value })}
          />
          <Select
            label="Group Type"
            value={groupForm.type}
            onChange={(e) => setGroupForm({ ...groupForm, type: e.target.value as 'dynamic' | 'static' })}
            options={[
              { value: 'dynamic', label: 'Dynamic (rule-based)' },
              { value: 'static', label: 'Static (manual membership)' },
            ]}
          />

          {/* Rule Builder (dynamic only) */}
          {groupForm.type === 'dynamic' && (
            <div className="border border-divider rounded-lg p-4">
              <h4 className="text-xs font-semibold text-t1 mb-3 flex items-center gap-1.5">
                <Filter size={13} /> Membership Rule
              </h4>
              <div className="grid grid-cols-3 gap-3">
                <Select
                  label="Field"
                  value={groupForm.rule_field}
                  onChange={(e) => setGroupForm({ ...groupForm, rule_field: e.target.value })}
                  options={RULE_FIELDS.map(f => ({ value: f.value, label: f.label }))}
                />
                <Select
                  label="Operator"
                  value={groupForm.rule_operator}
                  onChange={(e) => setGroupForm({ ...groupForm, rule_operator: e.target.value })}
                  options={(currentFieldDef?.operators || ['equals']).map(op => ({ value: op, label: op }))}
                />
                <Input
                  label="Value"
                  placeholder={currentFieldDef?.example || 'Value'}
                  value={groupForm.rule_value}
                  onChange={(e) => setGroupForm({ ...groupForm, rule_value: e.target.value })}
                />
              </div>
              <div className="bg-canvas rounded-lg px-3 py-2 mt-3">
                <p className="text-xs font-mono text-t2">
                  {groupForm.rule_field} {groupForm.rule_operator} &quot;{groupForm.rule_value || '...'}&quot;
                </p>
              </div>
            </div>
          )}

          {/* Module Assignment */}
          <div>
            <label className="text-xs font-medium text-t1 mb-2 block">Assign to Modules</label>
            <div className="grid grid-cols-2 gap-2">
              {AVAILABLE_MODULES.map(mod => (
                <button
                  key={mod.value}
                  onClick={() => toggleModule(mod.value)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-left transition-colors border ${
                    groupForm.modules.includes(mod.value)
                      ? 'border-accent bg-accent/5 text-accent'
                      : 'border-divider bg-canvas text-t2 hover:border-border'
                  }`}
                >
                  {MODULE_ICONS[mod.value]}
                  {mod.label}
                  {groupForm.modules.includes(mod.value) && <CheckCircle size={12} className="ml-auto" />}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>{tc('cancel')}</Button>
            <Button onClick={submitGroup}>Create Group</Button>
          </div>
        </div>
      </Modal>

      {/* ── Edit Group Modal ── */}
      <Modal open={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Group">
        <div className="space-y-4">
          <Input
            label="Group Name"
            placeholder="e.g. All Engineering"
            value={groupForm.name}
            onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
          />
          <Textarea
            label="Description"
            placeholder="Describe the purpose of this group"
            rows={2}
            value={groupForm.description}
            onChange={(e) => setGroupForm({ ...groupForm, description: e.target.value })}
          />
          <Select
            label="Group Type"
            value={groupForm.type}
            onChange={(e) => setGroupForm({ ...groupForm, type: e.target.value as 'dynamic' | 'static' })}
            options={[
              { value: 'dynamic', label: 'Dynamic (rule-based)' },
              { value: 'static', label: 'Static (manual membership)' },
            ]}
          />

          {groupForm.type === 'dynamic' && (
            <div className="border border-divider rounded-lg p-4">
              <h4 className="text-xs font-semibold text-t1 mb-3 flex items-center gap-1.5">
                <Filter size={13} /> Membership Rule
              </h4>
              <div className="grid grid-cols-3 gap-3">
                <Select
                  label="Field"
                  value={groupForm.rule_field}
                  onChange={(e) => setGroupForm({ ...groupForm, rule_field: e.target.value })}
                  options={RULE_FIELDS.map(f => ({ value: f.value, label: f.label }))}
                />
                <Select
                  label="Operator"
                  value={groupForm.rule_operator}
                  onChange={(e) => setGroupForm({ ...groupForm, rule_operator: e.target.value })}
                  options={(currentFieldDef?.operators || ['equals']).map(op => ({ value: op, label: op }))}
                />
                <Input
                  label="Value"
                  placeholder={currentFieldDef?.example || 'Value'}
                  value={groupForm.rule_value}
                  onChange={(e) => setGroupForm({ ...groupForm, rule_value: e.target.value })}
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-t1 mb-2 block">Assign to Modules</label>
            <div className="grid grid-cols-2 gap-2">
              {AVAILABLE_MODULES.map(mod => (
                <button
                  key={mod.value}
                  onClick={() => toggleModule(mod.value)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-left transition-colors border ${
                    groupForm.modules.includes(mod.value)
                      ? 'border-accent bg-accent/5 text-accent'
                      : 'border-divider bg-canvas text-t2 hover:border-border'
                  }`}
                >
                  {MODULE_ICONS[mod.value]}
                  {mod.label}
                  {groupForm.modules.includes(mod.value) && <CheckCircle size={12} className="ml-auto" />}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowEditModal(false)}>{tc('cancel')}</Button>
            <Button onClick={submitEditGroup}><Edit size={14} /> Save Changes</Button>
          </div>
        </div>
      </Modal>

      {/* ── View Members Modal ── */}
      <Modal open={showMembersModal} onClose={() => setShowMembersModal(false)} title={selectedGroup ? `${selectedGroup.name} - Members` : 'Members'}>
        {selectedGroup && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <Badge variant={selectedGroup.type === 'dynamic' ? 'info' : 'default'}>
                {selectedGroup.type}
              </Badge>
              <span className="text-xs text-t3">{selectedGroup.member_count} members</span>
              {selectedGroup.type === 'dynamic' && (
                <span className="text-xs text-t3">Synced {formatDate(selectedGroup.last_synced_at)}</span>
              )}
            </div>

            {selectedGroup.rule && (
              <div className="bg-canvas rounded-lg px-3 py-2">
                <p className="text-xs text-t3 mb-0.5">Active Rule</p>
                <p className="text-xs font-mono text-t1">{formatRule(selectedGroup)}</p>
              </div>
            )}

            <div className="border border-divider rounded-lg overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-divider bg-canvas">
                    <th className="tempo-th text-left px-4 py-2">Employee</th>
                    <th className="tempo-th text-left px-4 py-2">Department</th>
                    <th className="tempo-th text-left px-4 py-2">Title</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {sampleMembers.map(emp => (
                    <tr key={emp.id} className="hover:bg-canvas/50">
                      <td className="px-4 py-2">
                        <p className="text-xs font-medium text-t1">{emp.profile?.full_name || 'Unknown'}</p>
                        <p className="text-xs text-t3">{emp.profile?.email || ''}</p>
                      </td>
                      <td className="px-4 py-2 text-xs text-t2">{emp.department_id}</td>
                      <td className="px-4 py-2 text-xs text-t2">{emp.job_title}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="secondary" onClick={() => setShowMembersModal(false)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}
