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
import { FileSignature, FileText, Plus, CheckCircle, Clock, AlertTriangle, Send, Eye, Download, Users, Trash2, Copy, Edit, History, ArrowRight, Search } from 'lucide-react'
import { useTempo } from '@/lib/store'
import { PageSkeleton } from '@/components/ui/page-skeleton'
import { EmptyState } from '@/components/ui/empty-state'

export default function DocumentsPage() {
  const tc = useTranslations('common')
  const { signatureDocuments, signatureTemplates, employees, addSignatureDocument, updateSignatureDocument, deleteSignatureDocument, addSignatureTemplate, updateSignatureTemplate, ensureModulesLoaded, org, addToast, currentUser, currentEmployeeId } = useTempo()

  async function esigAPI(method: string, action: string, data: Record<string, any> = {}) {
    const url = method === 'GET'
      ? `/api/e-signatures?action=${action}&${new URLSearchParams(data as any).toString()}`
      : `/api/e-signatures`
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', 'x-org-id': org.id },
      ...(method !== 'GET' ? { body: JSON.stringify({ action, ...data }) } : {}),
    })
    if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || 'Request failed') }
    return res.json()
  }

  const [pageLoading, setPageLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [confirmAction, setConfirmAction] = useState<{show:boolean, type:string, id:string, label:string}|null>(null)

  useEffect(() => {
    ensureModulesLoaded?.(['signatureDocuments', 'signatureTemplates'])?.then?.(() => setPageLoading(false))?.catch?.(() => setPageLoading(false))
    const t = setTimeout(() => setPageLoading(false), 2000)
    return () => clearTimeout(t)
  }, [ensureModulesLoaded])

  const [activeTab, setActiveTab] = useState<'documents' | 'templates' | 'bulk-send' | 'audit'>('documents')
  const [searchQuery, setSearchQuery] = useState('')
  const [showNewDocModal, setShowNewDocModal] = useState(false)
  const [showEditTemplateModal, setShowEditTemplateModal] = useState(false)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [previewDoc, setPreviewDoc] = useState<any>(null)
  const [editTemplateForm, setEditTemplateForm] = useState({
    id: '',
    name: '',
    description: '',
    signing_flow: 'sequential' as 'sequential' | 'parallel',
    signer_roles: [] as { order: number; role: string }[],
  })
  const [docForm, setDocForm] = useState({
    title: '',
    template_id: '',
    signing_flow: 'sequential' as 'sequential' | 'parallel',
    signers: [{ name: '', email: '', role: 'signer' as string, order: 1 }],
  })

  // Bulk Policy Send state
  const [showBulkSendModal, setShowBulkSendModal] = useState(false)
  const [bulkPolicyTitle, setBulkPolicyTitle] = useState('')
  const [bulkDeptFilter, setBulkDeptFilter] = useState('')
  const [bulkCountryFilter, setBulkCountryFilter] = useState('')
  const [bulkSendResults, setBulkSendResults] = useState<{ sent: number; total: number } | null>(null)

  const filteredDocuments = useMemo(() => {
    if (!searchQuery.trim()) return signatureDocuments
    const q = searchQuery.toLowerCase()
    return signatureDocuments.filter((doc: any) =>
      (doc.title || '').toLowerCase().includes(q) ||
      (doc.signers || []).some((s: any) => (s.name || '').toLowerCase().includes(q) || (s.email || '').toLowerCase().includes(q))
    )
  }, [signatureDocuments, searchQuery])

  const filteredTemplates = useMemo(() => {
    if (!searchQuery.trim()) return signatureTemplates
    const q = searchQuery.toLowerCase()
    return signatureTemplates.filter((t: any) =>
      (t.name || '').toLowerCase().includes(q) ||
      (t.description || '').toLowerCase().includes(q)
    )
  }, [signatureTemplates, searchQuery])

  const departments = [...new Set(employees.map(e => e.department_id).filter(Boolean))]
  const countries = [...new Set(employees.map(e => e.country).filter(Boolean))]

  const bulkRecipients = employees.filter(e => {
    if (bulkDeptFilter && e.department_id !== bulkDeptFilter) return false
    if (bulkCountryFilter && e.country !== bulkCountryFilter) return false
    return e.profile?.email
  })

  function executeBulkSend() {
    if (!bulkPolicyTitle || bulkRecipients.length === 0) return
    let sentCount = 0
    bulkRecipients.forEach(emp => {
      addSignatureDocument({
        title: `${bulkPolicyTitle}`,
        status: 'pending',
        signing_flow: 'parallel',
        created_by: currentEmployeeId || employees[0]?.id || 'unknown',
        document_url: '/docs/policy-document.pdf',
        signers: [{
          name: emp.profile?.full_name || '',
          email: emp.profile?.email || '',
          role: 'signer',
          status: 'pending',
          signing_order: 1,
        }],
      })
      sentCount++
    })
    setBulkSendResults({ sent: sentCount, total: bulkRecipients.length })
    addToast(`Policy sent to ${sentCount} employee(s)`, 'success')
  }

  // Stats
  const completedCount = signatureDocuments.filter(d => d.status === 'completed').length
  const awaitingCount = signatureDocuments.filter(d => d.status === 'in_progress' || d.status === 'pending').length
  const declinedCount = signatureDocuments.filter(d => d.status === 'declined').length

  // Audit trail derived from documents
  const auditEvents = useMemo(() => {
    const events: { id: string; document_title: string; signer_name: string; action: string; timestamp: string; status: string }[] = []

    signatureDocuments.forEach(doc => {
      // Document creation event
      events.push({
        id: `${doc.id}-created`,
        document_title: doc.title,
        signer_name: employees.find((e: any) => e.id === doc.created_by)?.profile?.full_name || 'System',
        action: 'Document created',
        timestamp: doc.created_at,
        status: 'info',
      })

      // Signer events
      if (doc.signers) {
        doc.signers.forEach((signer: any, idx: number) => {
          if (signer.status === 'signed') {
            events.push({
              id: `${doc.id}-signer-${idx}`,
              document_title: doc.title,
              signer_name: signer.name,
              action: 'Signed document',
              timestamp: doc.completed_at || doc.created_at,
              status: 'success',
            })
          } else if (signer.status === 'declined') {
            events.push({
              id: `${doc.id}-declined-${idx}`,
              document_title: doc.title,
              signer_name: signer.name,
              action: 'Declined to sign',
              timestamp: doc.created_at,
              status: 'error',
            })
          } else if (signer.status === 'pending') {
            events.push({
              id: `${doc.id}-pending-${idx}`,
              document_title: doc.title,
              signer_name: signer.name,
              action: 'Awaiting signature',
              timestamp: doc.created_at,
              status: 'warning',
            })
          }
        })
      }

      // Completion event
      if (doc.status === 'completed' && doc.completed_at) {
        events.push({
          id: `${doc.id}-completed`,
          document_title: doc.title,
          signer_name: 'System',
          action: 'Document fully executed',
          timestamp: doc.completed_at,
          status: 'success',
        })
      }
    })

    return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  }, [signatureDocuments, employees])

  function openNewDocument() {
    setDocForm({
      title: '',
      template_id: '',
      signing_flow: 'sequential',
      signers: [{ name: '', email: '', role: 'signer', order: 1 }],
    })
    setShowNewDocModal(true)
  }

  function addSigner() {
    setDocForm(prev => ({
      ...prev,
      signers: [...prev.signers, { name: '', email: '', role: 'signer', order: prev.signers.length + 1 }],
    }))
  }

  function removeSigner(index: number) {
    if (docForm.signers.length <= 1) return
    setDocForm(prev => ({
      ...prev,
      signers: prev.signers.filter((_, i) => i !== index),
    }))
  }

  function updateSigner(index: number, field: string, value: string) {
    setDocForm(prev => ({
      ...prev,
      signers: prev.signers.map((s, i) => i === index ? { ...s, [field]: value } : s),
    }))
  }

  function applyTemplate(templateId: string) {
    const template = signatureTemplates.find((t: any) => t.id === templateId)
    if (template) {
      setDocForm(prev => ({
        ...prev,
        template_id: templateId,
        signing_flow: template.signing_flow,
        signers: template.signer_roles.map((r: any, i: number) => ({ name: r.role, email: '', role: i === 0 ? 'signer' : 'countersigner', order: r.order || i + 1 })),
      }))
    }
  }

  async function submitDocument() {
    if (!docForm.title) { addToast('Document title is required', 'error'); return }
    if (docForm.signers.some(s => !s.name)) { addToast('All signer names are required', 'error'); return }
    if (docForm.signers.some(s => !s.email)) { addToast('All signer emails are required', 'error'); return }
    setSaving(true)
    try {
      const signers = docForm.signers.map((s, i) => ({ ...s, status: 'pending', signing_order: s.order || i + 1, role: s.role || 'signer' }))
      const createdBy = currentEmployeeId || employees[0]?.id || 'unknown'
      try {
        const result = await esigAPI('POST', 'create', {
          title: docForm.title,
          description: '',
          signers,
          signingOrder: docForm.signing_flow,
          expiresAt: null,
          createdBy,
        })
        addSignatureDocument({
          ...result,
          title: docForm.title,
          status: 'pending',
          signing_flow: docForm.signing_flow,
          created_by: createdBy,
          document_url: '/docs/uploaded-document.pdf',
          signers,
        })
        addToast('Document created and sent for signing', 'success')
      } catch (err: any) {
        addSignatureDocument({
          title: docForm.title,
          status: 'pending',
          signing_flow: docForm.signing_flow,
          created_by: createdBy,
          document_url: '/docs/uploaded-document.pdf',
          signers,
        })
        addToast(`Document saved locally. API error: ${err?.message || 'Service unavailable'}`, 'error')
      }
      setShowNewDocModal(false)
    } finally { setSaving(false) }
  }

  async function sendReminder(docId: string) {
    setSaving(true)
    try {
      const senderEmail = employees[0]?.profile?.email || ''
      try {
        await esigAPI('POST', 'send', { documentId: docId, senderEmail })
        updateSignatureDocument(docId, { last_reminder_sent: new Date().toISOString() })
        addToast('Reminder sent successfully', 'success')
      } catch (err: any) {
        updateSignatureDocument(docId, { last_reminder_sent: new Date().toISOString() })
        addToast(`Reminder recorded locally. API error: ${err?.message || 'Service unavailable'}`, 'error')
      }
    } finally { setSaving(false) }
  }

  async function useTemplate(templateId: string) {
    const template = signatureTemplates.find((t: any) => t.id === templateId)
    if (!template) return
    const createdBy = employees[0]?.id || 'unknown'
    const signerAssignments = template.signer_roles.map((r: any) => ({ role: r.role, name: r.role, email: '' }))
    try {
      await esigAPI('POST', 'create-from-template', { templateId, signerAssignments, createdBy })
      updateSignatureTemplate(templateId, { usage_count: (template.usage_count || 0) + 1 })
      addToast('Template applied successfully', 'success')
    } catch (err: any) {
      updateSignatureTemplate(templateId, { usage_count: (template.usage_count || 0) + 1 })
      addToast(`Template applied locally. API error: ${err?.message || 'Service unavailable'}`, 'error')
    }
    setDocForm({
      title: '',
      template_id: templateId,
      signing_flow: template.signing_flow,
      signers: template.signer_roles.map((r: any, i: number) => ({ name: r.role, email: '', role: i === 0 ? 'signer' : 'countersigner', order: r.order || i + 1 })),
    })
    setShowNewDocModal(true)
  }

  // Countersigning helpers
  function canSignNow(doc: any, signerIdx: number) {
    if (doc.signing_flow === 'parallel') return true
    // Sequential: all prior signers must have signed
    return (doc.signers || []).slice(0, signerIdx).every((s: any) => s.status === 'signed')
  }

  function handleSign(docId: string, signerIdx: number) {
    const doc = signatureDocuments.find((d: any) => d.id === docId)
    if (!doc) return
    const updatedSigners = (doc.signers || []).map((s: any, i: number) =>
      i === signerIdx ? { ...s, status: 'signed', signed_at: new Date().toISOString() } : s
    )
    const allSigned = updatedSigners.every((s: any) => s.status === 'signed')
    updateSignatureDocument(docId, { signers: updatedSigners, status: allSigned ? 'completed' : 'in_progress' })
    addToast(allSigned ? 'Document fully signed!' : 'Document signed successfully', 'success')
  }

  // Seed employment letter templates — add any missing from the canonical list
  // Wait until real data loads (signatureTemplates.length > 0) before checking for missing templates
  const [templateSeeded, setTemplateSeeded] = useState(false)
  useEffect(() => {
    if (templateSeeded || pageLoading) return
    // Don't seed until real templates have loaded from DB — avoids race condition
    // where optimistic inserts get overwritten by subsequent API load
    if (signatureTemplates.length === 0) return
    const allTemplates = [
      { name: 'Employment Offer Letter', description: 'Standard employment offer with terms and conditions', signing_flow: 'sequential', signer_roles: [{ order: 1, role: 'HR Manager' }, { order: 2, role: 'Employee' }] },
      { name: 'Employment Confirmation Letter', description: 'Confirmation of employment for bank/visa purposes', signing_flow: 'sequential', signer_roles: [{ order: 1, role: 'HR Manager' }, { order: 2, role: 'Employee' }] },
      { name: 'NDA — Non-Disclosure Agreement', description: 'Confidentiality agreement for employees and contractors', signing_flow: 'parallel', signer_roles: [{ order: 1, role: 'Employee' }, { order: 2, role: 'Legal Counsel' }] },
      { name: 'Salary Review Letter', description: 'Notification of salary adjustment with current salary, new salary, effective date, and role details', signing_flow: 'sequential', signer_roles: [{ order: 1, role: 'HR Manager' }, { order: 2, role: 'Department Head' }, { order: 3, role: 'Employee' }] },
    ]
    const existingNames = new Set(signatureTemplates.map((t: any) => t.name))
    const missing = allTemplates.filter(t => !existingNames.has(t.name))
    if (missing.length > 0) {
      missing.forEach(t => addSignatureTemplate(t))
    }
    setTemplateSeeded(true)
  }, [templateSeeded, signatureTemplates.length, pageLoading])

  async function handleDelete(docId: string) {
    try {
      await esigAPI('DELETE', 'delete', { documentId: docId })
      deleteSignatureDocument(docId)
      addToast('Document deleted', 'success')
    } catch (err: any) {
      deleteSignatureDocument(docId)
      addToast(`Document removed locally. API error: ${err?.message || 'Service unavailable'}`, 'error')
    }
  }

  function openEditTemplate(template: any) {
    setEditTemplateForm({
      id: template.id,
      name: template.name || '',
      description: template.description || '',
      signing_flow: template.signing_flow || 'sequential',
      signer_roles: template.signer_roles?.map((r: any, idx: number) => ({ order: r.order ?? idx + 1, role: r.role })) || [],
    })
    setShowEditTemplateModal(true)
  }

  function addSignerRole() {
    setEditTemplateForm(prev => ({
      ...prev,
      signer_roles: [...prev.signer_roles, { order: prev.signer_roles.length + 1, role: '' }],
    }))
  }

  function removeSignerRole(index: number) {
    if (editTemplateForm.signer_roles.length <= 1) return
    setEditTemplateForm(prev => ({
      ...prev,
      signer_roles: prev.signer_roles.filter((_, i) => i !== index).map((r, i) => ({ ...r, order: i + 1 })),
    }))
  }

  function updateSignerRole(index: number, value: string) {
    setEditTemplateForm(prev => ({
      ...prev,
      signer_roles: prev.signer_roles.map((r, i) => i === index ? { ...r, role: value } : r),
    }))
  }

  async function submitEditTemplate() {
    if (!editTemplateForm.name || editTemplateForm.signer_roles.some(r => !r.role)) return
    const updatedData = {
      name: editTemplateForm.name,
      description: editTemplateForm.description,
      signing_flow: editTemplateForm.signing_flow,
      signer_roles: editTemplateForm.signer_roles,
    }
    try {
      await esigAPI('POST', 'update-template', { templateId: editTemplateForm.id, ...updatedData })
      updateSignatureTemplate(editTemplateForm.id, updatedData)
    } catch (err: any) {
      updateSignatureTemplate(editTemplateForm.id, updatedData)
      addToast(`Template saved locally. API error: ${err?.message || 'Service unavailable'}`, 'error')
    }
    setShowEditTemplateModal(false)
  }

  function getStatusBadge(status: string) {
    const variants: Record<string, 'success' | 'warning' | 'error' | 'info' | 'default'> = {
      completed: 'success',
      in_progress: 'info',
      pending: 'warning',
      declined: 'error',
    }
    const labels: Record<string, string> = {
      completed: 'Completed',
      in_progress: 'In Progress',
      pending: 'Pending',
      declined: 'Declined',
    }
    return <Badge variant={variants[status] || 'default'}>{labels[status] || status}</Badge>
  }

  function getSignerStatusBadge(status: string) {
    const variants: Record<string, 'success' | 'warning' | 'error' | 'default'> = {
      signed: 'success',
      pending: 'warning',
      declined: 'error',
    }
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>
  }

  function viewDocument(doc: any) {
    setPreviewDoc(doc)
    setShowPreviewModal(true)
  }

  function downloadDocument(doc: any) {
    const content = `Document: ${doc.title}\nStatus: ${doc.status}\nSigning Flow: ${doc.signing_flow}\nCreated: ${new Date(doc.created_at).toLocaleDateString()}\n${doc.completed_at ? `Completed: ${new Date(doc.completed_at).toLocaleDateString()}` : ''}\n\nSigners:\n${(doc.signers || []).map((s: any, i: number) => `  ${i + 1}. ${s.name} (${s.email}) - ${s.status}`).join('\n')}`
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${doc.title.replace(/[^a-zA-Z0-9]/g, '_')}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    addToast('Document downloaded', 'success')
  }

  // Bulk send acknowledgment tracking
  const bulkPolicyStats = (() => {
    if (!bulkPolicyTitle) return null
    const policyDocs = signatureDocuments.filter(d => d.title === bulkPolicyTitle)
    if (policyDocs.length === 0) return null
    const acked = policyDocs.filter(d => d.status === 'completed').length
    return { total: policyDocs.length, acknowledged: acked, rate: Math.round((acked / policyDocs.length) * 100) }
  })()

  const tabs = [
    { key: 'documents' as const, label: 'Documents', icon: <FileText size={14} /> },
    { key: 'templates' as const, label: 'Templates', icon: <Copy size={14} /> },
    { key: 'bulk-send' as const, label: 'Bulk Policy Send', icon: <Send size={14} /> },
    { key: 'audit' as const, label: 'Audit Trail', icon: <History size={14} /> },
  ]

  if (pageLoading) {
    return (
      <>
        <Header
          title="Documents & E-Signatures"
          subtitle="Create, send & track document signatures"
          actions={<Button size="sm" disabled><Plus size={14} /> New Document</Button>}
        />
        <div className="p-6"><PageSkeleton /></div>
      </>
    )
  }

  return (
    <>
      <Header
        title="Documents & E-Signatures"
        subtitle="Create, send & track document signatures"
        actions={<Button size="sm" onClick={openNewDocument}><Plus size={14} /> New Document</Button>}
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Documents" value={signatureDocuments.length} icon={<FileText size={20} />} />
        <StatCard label="Completed" value={completedCount} icon={<CheckCircle size={20} />} change="Fully executed" changeType="positive" />
        <StatCard label="Awaiting Signature" value={awaitingCount} icon={<Clock size={20} />} change={awaitingCount > 0 ? 'Requires attention' : 'All clear'} changeType={awaitingCount > 0 ? 'negative' : 'positive'} />
        <StatCard label="Templates" value={signatureTemplates.length} icon={<FileSignature size={20} />} />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-divider">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab.key
                ? 'border-accent text-accent'
                : 'border-transparent text-t3 hover:text-t1'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search Bar */}
      {(activeTab === 'documents' || activeTab === 'templates') && (
        <div className="relative mb-4">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-t3" />
          <Input
            placeholder={activeTab === 'documents' ? 'Search documents by title or signer...' : 'Search templates by name or description...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      )}

      {/* Documents Tab */}
      {activeTab === 'documents' && (
        <Card padding="none">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>All Documents</CardTitle>
              <span className="text-xs text-t3">{filteredDocuments.length} document{filteredDocuments.length !== 1 ? 's' : ''}</span>
            </div>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-divider bg-canvas">
                  <th className="tempo-th text-left px-6 py-3">Title</th>
                  <th className="tempo-th text-center px-4 py-3">{tc('status')}</th>
                  <th className="tempo-th text-center px-4 py-3">Flow</th>
                  <th className="tempo-th text-left px-4 py-3">Signers</th>
                  <th className="tempo-th text-left px-4 py-3">Created</th>
                  <th className="tempo-th text-left px-4 py-3">Completed</th>
                  <th className="tempo-th text-center px-4 py-3">{tc('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredDocuments.map((doc: any) => (
                  <tr key={doc.id} className="hover:bg-canvas/50">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <FileText size={14} className="text-t3 shrink-0" />
                        <span className="text-xs font-medium text-t1">{doc.title}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {getStatusBadge(doc.status)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={doc.signing_flow === 'sequential' ? 'default' : 'info'}>
                        {doc.signing_flow}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {doc.signers?.map((signer: any, idx: number) => (
                          <div key={idx} className="flex items-center gap-1 bg-canvas rounded px-1.5 py-0.5">
                            <span className="text-xs text-t2">{signer.name}</span>
                            {signer.role && signer.role !== 'signer' && <span className="text-[9px] text-t3">({signer.role})</span>}
                            {getSignerStatusBadge(signer.status)}
                            {signer.status === 'pending' && canSignNow(doc, idx) && (
                              <Button size="sm" className="ml-1 text-[10px] py-0 px-1.5 h-5" onClick={(e) => { e.stopPropagation(); handleSign(doc.id, idx) }}>
                                {signer.role === 'countersigner' ? 'Countersign' : 'Sign'}
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-t2">
                      {new Date(doc.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-xs text-t2">
                      {doc.completed_at ? new Date(doc.completed_at).toLocaleDateString() : <span className="text-t3">--</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 justify-center">
                        <Button size="sm" variant="ghost" title="View" onClick={() => viewDocument(doc)}>
                          <Eye size={12} />
                        </Button>
                        {(doc.status === 'pending' || doc.status === 'in_progress') && (
                          <Button size="sm" variant="secondary" onClick={() => sendReminder(doc.id)} title="Send Reminder">
                            <Send size={12} />
                          </Button>
                        )}
                        {doc.status === 'completed' && (
                          <Button size="sm" variant="ghost" title="Download" onClick={() => downloadDocument(doc)}>
                            <Download size={12} />
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => setConfirmAction({ show: true, type: 'delete_doc', id: doc.id, label: doc.title })} title="Delete">
                          <Trash2 size={12} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredDocuments.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <FileSignature size={32} className="mx-auto text-t3 mb-2" />
                      <p className="text-sm text-t2">{searchQuery ? 'No matching documents' : 'No documents yet'}</p>
                      <p className="text-xs text-t3 mt-1">{searchQuery ? 'Try adjusting your search terms.' : 'Create your first document to get started'}</p>
                      {!searchQuery && (
                        <Button size="sm" className="mt-3" onClick={openNewDocument}>
                          <Plus size={14} /> New Document
                        </Button>
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Templates Tab */}
      {activeTab === 'templates' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-t1">Signature Templates</h2>
            <span className="text-xs text-t3">{filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTemplates.map((template: any) => (
              <Card key={template.id}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                      <FileSignature size={16} className="text-accent" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-t1">{template.name}</h3>
                      <p className="text-xs text-t3 mt-0.5">{template.description}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-t3">Signing Flow</span>
                    <Badge variant={template.signing_flow === 'sequential' ? 'default' : 'info'}>
                      {template.signing_flow}
                    </Badge>
                  </div>

                  <div>
                    <span className="text-xs text-t3 block mb-1.5">Signer Roles</span>
                    <div className="flex flex-wrap gap-1">
                      {template.signer_roles?.map((role: any, idx: number) => (
                        <Badge key={idx} variant="default">
                          {role.order}. {role.role.replace(/_/g, ' ')}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-divider">
                    <span className="text-xs text-t3">Used {template.usage_count} time{template.usage_count !== 1 ? 's' : ''}</span>
                    <Progress value={Math.min(template.usage_count, 100)} color="orange" className="w-16" />
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <Button size="sm" className="flex-1" onClick={() => useTemplate(template.id)}>
                    <ArrowRight size={12} /> Use Template
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => openEditTemplate(template)}>
                    <Edit size={12} /> Edit
                  </Button>
                </div>
              </Card>
            ))}
            {filteredTemplates.length === 0 && (
              <Card>
                <div className="text-center py-8">
                  <Copy size={32} className="mx-auto text-t3 mb-2" />
                  <p className="text-sm text-t2">{searchQuery ? 'No matching templates' : 'No templates yet'}</p>
                  <p className="text-xs text-t3 mt-1">{searchQuery ? 'Try adjusting your search terms.' : 'Templates help you quickly create recurring documents'}</p>
                </div>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Bulk Policy Send Tab */}
      {activeTab === 'bulk-send' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Bulk Policy Send</CardTitle>
                <Button size="sm" onClick={() => { setShowBulkSendModal(true); setBulkSendResults(null) }}>
                  <Send size={14} /> Send Policy to Employees
                </Button>
              </div>
            </CardHeader>
            <p className="text-sm text-t3 mb-4">Send a policy document to an entire department or country population. Track acknowledgment rates and follow up on pending signatures.</p>

            {/* Acknowledgment tracking for recent bulk sends */}
            {bulkPolicyStats && (
              <div className="bg-canvas rounded-xl p-4 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-t1">Latest: {bulkPolicyTitle}</h4>
                  <Badge variant={bulkPolicyStats.rate >= 80 ? 'success' : bulkPolicyStats.rate >= 50 ? 'warning' : 'error'}>
                    {bulkPolicyStats.rate}% acknowledged
                  </Badge>
                </div>
                <Progress value={bulkPolicyStats.rate} className="mb-2" />
                <div className="flex gap-4 text-xs text-t3">
                  <span>Sent: {bulkPolicyStats.total}</span>
                  <span>Acknowledged: {bulkPolicyStats.acknowledged}</span>
                  <span>Pending: {bulkPolicyStats.total - bulkPolicyStats.acknowledged}</span>
                </div>
              </div>
            )}

            {/* Policy documents overview */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-canvas rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-tempo-600">{signatureDocuments.length}</div>
                <div className="text-xs text-t3 mt-1">Total Documents</div>
              </div>
              <div className="bg-canvas rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{completedCount}</div>
                <div className="text-xs text-t3 mt-1">Fully Signed</div>
              </div>
              <div className="bg-canvas rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-orange-500">{awaitingCount}</div>
                <div className="text-xs text-t3 mt-1">Awaiting Signature</div>
              </div>
            </div>
          </Card>

          {/* Bulk Send Modal */}
          <Modal open={showBulkSendModal} onClose={() => setShowBulkSendModal(false)} title="Send Policy to Employees" size="lg">
            <div className="space-y-4">
              {!bulkSendResults ? (
                <>
                  <Input label="Policy Document Title" value={bulkPolicyTitle} onChange={e => setBulkPolicyTitle(e.target.value)} placeholder="e.g. Code of Conduct 2026, Anti-Bribery Policy" />
                  <Select label="Filter by Department (optional)" value={bulkDeptFilter} onChange={e => setBulkDeptFilter(e.target.value)}
                    options={[{ value: '', label: 'All Departments' }, ...departments.map(d => ({ value: d as string, label: d as string }))]} />
                  <Select label="Filter by Country (optional)" value={bulkCountryFilter} onChange={e => setBulkCountryFilter(e.target.value)}
                    options={[{ value: '', label: 'All Countries' }, ...countries.map(c => ({ value: c as string, label: c as string }))]} />
                  <div className="bg-canvas rounded-lg p-3">
                    <p className="text-sm font-medium text-t1 mb-1">{bulkRecipients.length} recipient(s) selected</p>
                    <p className="text-xs text-t3">Each employee will receive an individual document for signing.</p>
                    {bulkRecipients.length > 0 && bulkRecipients.length <= 10 && (
                      <div className="mt-2 space-y-1">
                        {bulkRecipients.map(emp => (
                          <div key={emp.id} className="text-xs text-t2">{emp.profile?.full_name} — {emp.profile?.email}</div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button variant="secondary" onClick={() => setShowBulkSendModal(false)}>Cancel</Button>
                    <Button onClick={executeBulkSend} disabled={!bulkPolicyTitle || bulkRecipients.length === 0}>
                      <Send size={14} /> Send to {bulkRecipients.length} Employee(s)
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center py-6">
                  <CheckCircle size={40} className="text-green-500 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-t1 mb-1">Policy Sent Successfully</h3>
                  <p className="text-sm text-t3 mb-4">{bulkSendResults.sent} document(s) created and sent for signing.</p>
                  <Button onClick={() => { setShowBulkSendModal(false); setBulkSendResults(null) }}>Done</Button>
                </div>
              )}
            </div>
          </Modal>
        </div>
      )}

      {/* Audit Trail Tab */}
      {activeTab === 'audit' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Signature Audit Trail</CardTitle>
              <span className="text-xs text-t3">{auditEvents.length} event{auditEvents.length !== 1 ? 's' : ''}</span>
            </div>
          </CardHeader>
          <div className="space-y-0">
            {auditEvents.map((event, idx) => (
              <div key={event.id} className="flex gap-4 px-2">
                {/* Timeline line + dot */}
                <div className="flex flex-col items-center">
                  <div className={`w-2.5 h-2.5 rounded-full shrink-0 mt-1.5 ${
                    event.status === 'success' ? 'bg-success' :
                    event.status === 'error' ? 'bg-error' :
                    event.status === 'warning' ? 'bg-warning' :
                    'bg-accent'
                  }`} />
                  {idx < auditEvents.length - 1 && (
                    <div className="w-px flex-1 bg-divider min-h-[32px]" />
                  )}
                </div>

                {/* Event content */}
                <div className="pb-4 flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-medium text-t1">{event.action}</p>
                      <p className="text-xs text-t2 mt-0.5">
                        <span className="font-medium">{event.signer_name}</span>
                        <span className="text-t3"> on </span>
                        <span>{event.document_title}</span>
                      </p>
                    </div>
                    <span className="text-xs text-t3 shrink-0">
                      {new Date(event.timestamp).toLocaleDateString()} {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            {auditEvents.length === 0 && (
              <div className="text-center py-12">
                <History size={32} className="mx-auto text-t3 mb-2" />
                <p className="text-sm text-t2">No audit events yet</p>
                <p className="text-xs text-t3 mt-1">Events will appear here as documents are created and signed</p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Edit Template Modal */}
      <Modal open={showEditTemplateModal} onClose={() => setShowEditTemplateModal(false)} title="Edit Template">
        <div className="space-y-4">
          <Input
            label="Template Name"
            placeholder="e.g., Employment Agreement"
            value={editTemplateForm.name}
            onChange={(e) => setEditTemplateForm(prev => ({ ...prev, name: e.target.value }))}
          />

          <Textarea
            label="Description"
            placeholder="Describe this template..."
            value={editTemplateForm.description}
            onChange={(e) => setEditTemplateForm(prev => ({ ...prev, description: e.target.value }))}
          />

          <Select
            label="Signing Flow"
            value={editTemplateForm.signing_flow}
            onChange={(e) => setEditTemplateForm(prev => ({ ...prev, signing_flow: e.target.value as 'sequential' | 'parallel' }))}
            options={[
              { value: 'sequential', label: 'Sequential - one after another' },
              { value: 'parallel', label: 'Parallel - all at once' },
            ]}
          />

          {/* Signer Roles */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-t1 flex items-center gap-1">
                <Users size={14} /> Signer Roles
              </label>
              <Button size="sm" variant="secondary" onClick={addSignerRole}>
                <Plus size={12} /> Add Role
              </Button>
            </div>
            <div className="space-y-2">
              {editTemplateForm.signer_roles.map((role, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <span className="text-xs text-t3 w-6 text-center shrink-0">{role.order}.</span>
                  <div className="flex-1">
                    <Input
                      placeholder="e.g., Employee, Manager, HR"
                      value={role.role}
                      onChange={(e) => updateSignerRole(idx, e.target.value)}
                    />
                  </div>
                  {editTemplateForm.signer_roles.length > 1 && (
                    <Button size="sm" variant="ghost" onClick={() => removeSignerRole(idx)}>
                      <Trash2 size={12} />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowEditTemplateModal(false)}>{tc('cancel')}</Button>
            <Button onClick={submitEditTemplate}>
              <Edit size={14} /> Save Changes
            </Button>
          </div>
        </div>
      </Modal>

      {/* Document Preview Modal */}
      <Modal open={showPreviewModal} onClose={() => setShowPreviewModal(false)} title={previewDoc?.title || 'Document Preview'}>
        {previewDoc && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              {getStatusBadge(previewDoc.status)}
              <Badge variant={previewDoc.signing_flow === 'sequential' ? 'default' : 'info'}>
                {previewDoc.signing_flow}
              </Badge>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-t3">Created</span>
                <span className="text-t1">{new Date(previewDoc.created_at).toLocaleDateString()}</span>
              </div>
              {previewDoc.completed_at && (
                <div className="flex justify-between text-xs">
                  <span className="text-t3">Completed</span>
                  <span className="text-t1">{new Date(previewDoc.completed_at).toLocaleDateString()}</span>
                </div>
              )}
              <div className="flex justify-between text-xs">
                <span className="text-t3">Created By</span>
                <span className="text-t1">{employees.find((e: any) => e.id === previewDoc.created_by)?.profile?.full_name || 'Unknown'}</span>
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-t1 mb-2">Signers</p>
              <div className="space-y-2">
                {previewDoc.signers?.map((signer: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-canvas rounded-lg">
                    <div>
                      <p className="text-xs font-medium text-t1">{signer.name}</p>
                      <p className="text-xs text-t3">{signer.email}</p>
                    </div>
                    {getSignerStatusBadge(signer.status)}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              {previewDoc.status === 'completed' && (
                <Button size="sm" variant="secondary" onClick={() => { downloadDocument(previewDoc); setShowPreviewModal(false) }}>
                  <Download size={14} /> Download
                </Button>
              )}
              <Button variant="secondary" onClick={() => setShowPreviewModal(false)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* New Document Modal */}
      <Modal open={showNewDocModal} onClose={() => setShowNewDocModal(false)} title="New Document">
        <div className="space-y-4">
          <Input
            label="Document Title"
            placeholder="e.g., Employment Agreement - John Doe"
            value={docForm.title}
            onChange={(e) => setDocForm({ ...docForm, title: e.target.value })}
          />

          <Select
            label="Template (optional)"
            value={docForm.template_id}
            onChange={(e) => {
              const val = e.target.value
              setDocForm(prev => ({ ...prev, template_id: val }))
              if (val) applyTemplate(val)
            }}
            options={[
              { value: '', label: 'No template' },
              ...signatureTemplates.map((t: any) => ({ value: t.id, label: t.name })),
            ]}
          />

          <Select
            label="Signing Flow"
            value={docForm.signing_flow}
            onChange={(e) => setDocForm({ ...docForm, signing_flow: e.target.value as 'sequential' | 'parallel' })}
            options={[
              { value: 'sequential', label: 'Sequential - one after another' },
              { value: 'parallel', label: 'Parallel - all at once' },
            ]}
          />

          {/* Signers */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-t1 flex items-center gap-1">
                <Users size={14} /> Signers
              </label>
              <Button size="sm" variant="secondary" onClick={addSigner}>
                <Plus size={12} /> Add Signer
              </Button>
            </div>
            <div className="space-y-2">
              {docForm.signers.map((signer, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex gap-2 items-start">
                    <div className="w-8 h-8 rounded-full bg-canvas flex items-center justify-center text-xs font-medium text-t3 shrink-0 mt-1">{idx + 1}</div>
                    <div className="flex-1">
                      <Input
                        placeholder="Signer name"
                        value={signer.name}
                        onChange={(e) => updateSigner(idx, 'name', e.target.value)}
                      />
                    </div>
                    <div className="flex-1">
                      <Input
                        placeholder="email@example.com"
                        type="email"
                        value={signer.email}
                        onChange={(e) => updateSigner(idx, 'email', e.target.value)}
                      />
                    </div>
                    <div className="w-36">
                      <Select
                        value={signer.role}
                        onChange={(e) => updateSigner(idx, 'role', e.target.value)}
                        options={[
                          { value: 'signer', label: 'Primary Signer' },
                          { value: 'countersigner', label: 'Countersigner' },
                          { value: 'witness', label: 'Witness' },
                        ]}
                      />
                    </div>
                    {docForm.signers.length > 1 && (
                      <Button size="sm" variant="ghost" onClick={() => removeSigner(idx)} className="mt-0.5">
                        <Trash2 size={12} />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Document upload placeholder */}
          <div>
            <label className="text-xs font-medium text-t1 block mb-2">Document</label>
            <div className="border-2 border-dashed border-divider rounded-lg p-6 text-center hover:border-accent/50 transition-colors cursor-pointer">
              <Download size={24} className="mx-auto text-t3 mb-2" />
              <p className="text-xs text-t2">Click to upload or drag and drop</p>
              <p className="text-xs text-t3 mt-1">PDF, DOCX up to 10MB</p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowNewDocModal(false)}>{tc('cancel')}</Button>
            <Button onClick={submitDocument}>
              <Send size={14} /> Create & Send
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
