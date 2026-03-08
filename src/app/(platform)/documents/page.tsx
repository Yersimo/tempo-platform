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
import { FileSignature, FileText, Plus, CheckCircle, Clock, AlertTriangle, Send, Eye, Download, Users, Trash2, Copy, Edit, History, ArrowRight } from 'lucide-react'
import { useTempo } from '@/lib/store'
import { PageSkeleton } from '@/components/ui/page-skeleton'
import { EmptyState } from '@/components/ui/empty-state'

export default function DocumentsPage() {
  const tc = useTranslations('common')
  const { signatureDocuments, signatureTemplates, employees, addSignatureDocument, updateSignatureDocument, deleteSignatureDocument, addSignatureTemplate, updateSignatureTemplate, ensureModulesLoaded, org, addToast } = useTempo()

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

  useEffect(() => {
    ensureModulesLoaded?.(['signatureDocuments', 'signatureTemplates'])?.then?.(() => setPageLoading(false))?.catch?.(() => setPageLoading(false))
    const t = setTimeout(() => setPageLoading(false), 2000)
    return () => clearTimeout(t)
  }, [ensureModulesLoaded])

  const [activeTab, setActiveTab] = useState<'documents' | 'templates' | 'audit'>('documents')
  const [showNewDocModal, setShowNewDocModal] = useState(false)
  const [docForm, setDocForm] = useState({
    title: '',
    template_id: '',
    signing_flow: 'sequential' as 'sequential' | 'parallel',
    signers: [{ name: '', email: '' }],
  })

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
      signers: [{ name: '', email: '' }],
    })
    setShowNewDocModal(true)
  }

  function addSigner() {
    setDocForm(prev => ({
      ...prev,
      signers: [...prev.signers, { name: '', email: '' }],
    }))
  }

  function removeSigner(index: number) {
    if (docForm.signers.length <= 1) return
    setDocForm(prev => ({
      ...prev,
      signers: prev.signers.filter((_, i) => i !== index),
    }))
  }

  function updateSigner(index: number, field: 'name' | 'email', value: string) {
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
        signers: template.signer_roles.map((r: any) => ({ name: r.role, email: '' })),
      }))
    }
  }

  async function submitDocument() {
    if (!docForm.title || docForm.signers.some(s => !s.name || !s.email)) return
    const signers = docForm.signers.map(s => ({ ...s, status: 'pending' }))
    const createdBy = employees[0]?.id || 'unknown'
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
  }

  async function sendReminder(docId: string) {
    const senderEmail = employees[0]?.profile?.email || ''
    try {
      await esigAPI('POST', 'send', { documentId: docId, senderEmail })
      updateSignatureDocument(docId, { last_reminder_sent: new Date().toISOString() })
      addToast('Reminder sent successfully', 'success')
    } catch (err: any) {
      updateSignatureDocument(docId, { last_reminder_sent: new Date().toISOString() })
      addToast(`Reminder recorded locally. API error: ${err?.message || 'Service unavailable'}`, 'error')
    }
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
      signers: template.signer_roles.map((r: any) => ({ name: r.role, email: '' })),
    })
    setShowNewDocModal(true)
  }

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

  const tabs = [
    { key: 'documents' as const, label: 'Documents', icon: <FileText size={14} /> },
    { key: 'templates' as const, label: 'Templates', icon: <Copy size={14} /> },
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

      {/* Documents Tab */}
      {activeTab === 'documents' && (
        <Card padding="none">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>All Documents</CardTitle>
              <span className="text-xs text-t3">{signatureDocuments.length} document{signatureDocuments.length !== 1 ? 's' : ''}</span>
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
                {signatureDocuments.map((doc: any) => (
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
                            {getSignerStatusBadge(signer.status)}
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
                        <Button size="sm" variant="ghost" title="View">
                          <Eye size={12} />
                        </Button>
                        {(doc.status === 'pending' || doc.status === 'in_progress') && (
                          <Button size="sm" variant="secondary" onClick={() => sendReminder(doc.id)} title="Send Reminder">
                            <Send size={12} />
                          </Button>
                        )}
                        {doc.status === 'completed' && (
                          <Button size="sm" variant="ghost" title="Download">
                            <Download size={12} />
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => handleDelete(doc.id)} title="Delete">
                          <Trash2 size={12} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {signatureDocuments.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <FileSignature size={32} className="mx-auto text-t3 mb-2" />
                      <p className="text-sm text-t2">No documents yet</p>
                      <p className="text-xs text-t3 mt-1">Create your first document to get started</p>
                      <Button size="sm" className="mt-3" onClick={openNewDocument}>
                        <Plus size={14} /> New Document
                      </Button>
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
            <span className="text-xs text-t3">{signatureTemplates.length} template{signatureTemplates.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {signatureTemplates.map((template: any) => (
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
                  <Button size="sm" variant="secondary">
                    <Edit size={12} /> Edit
                  </Button>
                </div>
              </Card>
            ))}
            {signatureTemplates.length === 0 && (
              <Card>
                <div className="text-center py-8">
                  <Copy size={32} className="mx-auto text-t3 mb-2" />
                  <p className="text-sm text-t2">No templates yet</p>
                  <p className="text-xs text-t3 mt-1">Templates help you quickly create recurring documents</p>
                </div>
              </Card>
            )}
          </div>
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
                <div key={idx} className="flex gap-2 items-start">
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
                  {docForm.signers.length > 1 && (
                    <Button size="sm" variant="ghost" onClick={() => removeSigner(idx)} className="mt-0.5">
                      <Trash2 size={12} />
                    </Button>
                  )}
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
