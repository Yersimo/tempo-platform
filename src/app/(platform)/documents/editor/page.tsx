// @ts-nocheck
'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { Input, Select } from '@/components/ui/input'
import {
  FileText, Save, Clock, Users, MessageSquare, History, Share2, ChevronLeft, Plus,
  Bold, Italic, Underline, Heading1, Heading2, List, ListOrdered, Link, Image,
  AlignLeft, AlignCenter, AlignRight, Code, Quote, Loader2, Check, X, CheckCircle,
  Send, RotateCcw, Eye, Search, Trash2,
} from 'lucide-react'
import { useTempo } from '@/lib/store'

// ============================================================
// Types
// ============================================================

interface DocVersion {
  id: string
  version: number
  content: string
  editedBy: string
  changeSummary: string | null
  createdAt: string
}

interface DocComment {
  id: string
  documentId: string
  authorId: string
  content: string
  selectionStart: number | null
  selectionEnd: number | null
  isResolved: boolean
  resolvedBy: string | null
  parentId: string | null
  createdAt: string
}

interface Collaborator {
  id: string
  documentId: string
  employeeId: string
  permission: string
  lastAccessedAt: string | null
}

// ============================================================
// Main Page
// ============================================================

export default function DocumentEditorPage() {
  const searchParams = useSearchParams()
  const docId = searchParams.get('id')
  const { employees, org, addToast, currentEmployeeId } = useTempo()

  // Document state
  const [loading, setLoading] = useState(true)
  const [document, setDocument] = useState<any>(null)
  const [localContent, setLocalContent] = useState('')
  const [localVersion, setLocalVersion] = useState(0)
  const [title, setTitle] = useState('')
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved' | 'conflict'>('saved')
  const [isDirty, setIsDirty] = useState(false)

  // Panels
  const [showVersionHistory, setShowVersionHistory] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(!docId)

  // Version history
  const [versions, setVersions] = useState<DocVersion[]>([])
  const [previewVersion, setPreviewVersion] = useState<DocVersion | null>(null)

  // Comments
  const [comments, setComments] = useState<DocComment[]>([])
  const [newComment, setNewComment] = useState('')

  // Collaborators / Presence
  const [collaborators, setCollaborators] = useState<Collaborator[]>([])
  const [activeCollaborators, setActiveCollaborators] = useState<Collaborator[]>([])

  // Share
  const [shareSearch, setShareSearch] = useState('')
  const [sharePermission, setSharePermission] = useState('edit')

  // Create new doc form
  const [newTitle, setNewTitle] = useState('')
  const [newType, setNewType] = useState('document')

  // Editor ref
  const editorRef = useRef<HTMLDivElement>(null)
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Doc list for when no ID
  const [docList, setDocList] = useState<any[]>([])

  // ============================================================
  // Helper: API call
  // ============================================================
  const docAPI = useCallback(async (method: string, action: string, data: Record<string, any> = {}) => {
    const url = method === 'GET'
      ? `/api/documents?action=${action}&${new URLSearchParams(data as any).toString()}`
      : '/api/documents'
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', 'x-org-id': org.id },
      ...(method !== 'GET' ? { body: JSON.stringify({ action, ...data }) } : {}),
    })
    const json = await res.json()
    if (!res.ok && res.status !== 409) throw new Error(json.error || 'Request failed')
    return { ...json, status: res.status }
  }, [org.id])

  // ============================================================
  // Load document
  // ============================================================
  useEffect(() => {
    if (!docId) {
      // Load document list
      docAPI('GET', 'list').then(res => {
        setDocList(res.data || [])
        setLoading(false)
      }).catch(() => setLoading(false))
      return
    }

    docAPI('GET', 'get', { id: docId }).then(res => {
      const doc = res.data
      setDocument(doc)
      setTitle(doc.title)
      setLocalContent(doc.content)
      setLocalVersion(doc.version)
      if (editorRef.current) {
        editorRef.current.innerHTML = doc.content
      }
      setLoading(false)
    }).catch(() => {
      addToast?.( 'Failed to load document', 'error')
      setLoading(false)
    })
  }, [docId, docAPI, addToast])

  // ============================================================
  // Polling for real-time sync (every 2 seconds)
  // ============================================================
  useEffect(() => {
    if (!docId || !localVersion) return

    const interval = setInterval(async () => {
      try {
        const res = await docAPI('GET', 'poll', { id: docId, version: String(localVersion) })
        const data = res.data
        if (data?.hasChanges && !isDirty) {
          // Only auto-update if user hasn't made local changes
          setLocalContent(data.content)
          setLocalVersion(data.version)
          if (editorRef.current) {
            editorRef.current.innerHTML = data.content
          }
        } else if (data?.hasChanges && isDirty) {
          setSaveStatus('conflict')
        }

        // Update active collaborators
        const activeRes = await docAPI('GET', 'active-collaborators', { id: docId })
        setActiveCollaborators(activeRes.data || [])
      } catch {
        // Polling failure is non-fatal
      }
    }, 2000)

    return () => clearInterval(interval)
  }, [docId, localVersion, isDirty, docAPI])

  // ============================================================
  // Auto-save
  // ============================================================
  const handleSave = useCallback(async () => {
    if (!docId || !isDirty) return

    const content = editorRef.current?.innerHTML || localContent
    setSaveStatus('saving')

    try {
      const res = await docAPI('POST', 'save', {
        documentId: docId,
        content,
        expectedVersion: localVersion,
      })

      if (res.status === 409 || res.data?.conflict) {
        setSaveStatus('conflict')
        addToast?.( 'Conflict detected - another user has edited this document', 'error')
        return
      }

      setLocalVersion(res.data.document.version)
      setIsDirty(false)
      setSaveStatus('saved')
    } catch (err: any) {
      setSaveStatus('unsaved')
      addToast?.( err.message || 'Failed to save', 'error')
    }
  }, [docId, isDirty, localContent, localVersion, docAPI, addToast])

  function handleEditorInput() {
    setIsDirty(true)
    setSaveStatus('unsaved')

    // Debounced auto-save after 3 seconds of inactivity
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    saveTimeoutRef.current = setTimeout(() => {
      handleSave()
    }, 3000)
  }

  // ============================================================
  // Toolbar commands
  // ============================================================
  function execCmd(command: string, value?: string) {
    window.document.execCommand(command, false, value)
    editorRef.current?.focus()
    handleEditorInput()
  }

  // ============================================================
  // Version History
  // ============================================================
  async function loadVersionHistory() {
    if (!docId) return
    try {
      const res = await docAPI('GET', 'versions', { id: docId })
      setVersions(res.data || [])
      setShowVersionHistory(true)
    } catch {
      addToast?.( 'Failed to load version history', 'error')
    }
  }

  function restoreVersion(version: DocVersion) {
    if (editorRef.current) {
      editorRef.current.innerHTML = version.content
    }
    setLocalContent(version.content)
    setIsDirty(true)
    setSaveStatus('unsaved')
    setPreviewVersion(null)
    setShowVersionHistory(false)
    addToast?.( `Restored to version ${version.version}`, 'success')
  }

  // ============================================================
  // Comments
  // ============================================================
  async function loadComments() {
    if (!docId) return
    try {
      const res = await docAPI('GET', 'comments', { id: docId })
      setComments(res.data || [])
      setShowComments(true)
    } catch {
      addToast?.( 'Failed to load comments', 'error')
    }
  }

  async function submitComment() {
    if (!docId || !newComment.trim()) return
    try {
      await docAPI('POST', 'comment', { documentId: docId, content: newComment.trim() })
      setNewComment('')
      const res = await docAPI('GET', 'comments', { id: docId })
      setComments(res.data || [])
      addToast?.( 'Comment added', 'success')
    } catch {
      addToast?.( 'Failed to add comment', 'error')
    }
  }

  async function handleResolveComment(commentId: string) {
    try {
      await docAPI('POST', 'resolve-comment', { commentId })
      setComments(prev => prev.map(c => c.id === commentId ? { ...c, isResolved: true } : c))
    } catch {
      addToast?.( 'Failed to resolve comment', 'error')
    }
  }

  // ============================================================
  // Share / Collaborators
  // ============================================================
  async function loadCollaborators() {
    if (!docId) return
    try {
      const res = await docAPI('GET', 'collaborators', { id: docId })
      setCollaborators(res.data || [])
    } catch { /* non-fatal */ }
  }

  async function handleAddCollaborator(empId: string) {
    if (!docId) return
    try {
      await docAPI('POST', 'add-collaborator', {
        documentId: docId,
        targetEmployeeId: empId,
        permission: sharePermission,
      })
      loadCollaborators()
      setShareSearch('')
      addToast?.( 'Collaborator added', 'success')
    } catch {
      addToast?.( 'Failed to add collaborator', 'error')
    }
  }

  async function handleRemoveCollaborator(empId: string) {
    if (!docId) return
    try {
      await docAPI('POST', 'remove-collaborator', { documentId: docId, targetEmployeeId: empId })
      setCollaborators(prev => prev.filter(c => c.employeeId !== empId))
    } catch {
      addToast?.( 'Failed to remove collaborator', 'error')
    }
  }

  // ============================================================
  // Create new document
  // ============================================================
  async function handleCreateDocument() {
    if (!newTitle.trim()) {
      addToast?.( 'Title is required', 'error')
      return
    }
    try {
      const res = await docAPI('POST', 'create', { title: newTitle.trim(), documentType: newType })
      const doc = res.data
      setShowCreateModal(false)
      // Navigate to editor with new doc ID
      window.location.href = `/documents/editor?id=${doc.id}`
    } catch {
      addToast?.( 'Failed to create document', 'error')
    }
  }

  // Employee lookup helper
  function getEmployeeName(empId: string) {
    const emp = (employees || []).find((e: any) => e.id === empId)
    return (emp as any)?.profile?.full_name || (emp as any)?.full_name || empId?.slice(0, 8) || 'Unknown'
  }

  const filteredShareEmployees = useMemo(() => {
    if (!shareSearch.trim()) return []
    const q = shareSearch.toLowerCase()
    const collabIds = new Set(collaborators.map(c => c.employeeId))
    return (employees || [])
      .filter((e: any) => {
        const name = (e.profile?.full_name || e.full_name || '').toLowerCase()
        const email = (e.profile?.email || e.email || '').toLowerCase()
        return (name.includes(q) || email.includes(q)) && !collabIds.has(e.id)
      })
      .slice(0, 6)
  }, [shareSearch, employees, collaborators])

  // ============================================================
  // Loading state
  // ============================================================
  if (loading) {
    return (
      <>
        <Header title="Document Editor" icon={<FileText size={18} />} />
        <div className="flex items-center justify-center h-64">
          <Loader2 className="animate-spin text-t3" size={24} />
        </div>
      </>
    )
  }

  // ============================================================
  // No document selected: show doc list
  // ============================================================
  if (!docId) {
    return (
      <>
        <Header
          title="Collaborative Documents"
                   actions={
            <Button size="sm" onClick={() => setShowCreateModal(true)}>
              <Plus size={14} /> New Document
            </Button>
          }
        />
        <div className="max-w-4xl mx-auto p-6 space-y-4">
          {docList.length === 0 ? (
            <div className="text-center py-16 text-t3">
              <FileText size={40} className="mx-auto mb-4 opacity-40" />
              <p className="text-sm">No documents yet. Create your first collaborative document.</p>
              <Button size="sm" className="mt-4" onClick={() => setShowCreateModal(true)}>
                <Plus size={14} /> Create Document
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {docList.map((doc: any) => (
                <a
                  key={doc.id}
                  href={`/documents/editor?id=${doc.id}`}
                  className="flex items-center gap-3 p-4 bg-card border border-border rounded-lg hover:border-accent/30 hover:shadow-sm transition-all group"
                >
                  <FileText size={18} className="text-t3 group-hover:text-accent shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-t1 truncate">{doc.title}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant={doc.documentType === 'policy' ? 'warning' : doc.documentType === 'meeting_notes' ? 'info' : 'default'}>
                        {(doc.documentType || 'document').replace(/_/g, ' ')}
                      </Badge>
                      <span className="text-[10px] text-t4">v{doc.version}</span>
                      <span className="text-[10px] text-t4">{new Date(doc.updatedAt || doc.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  {doc.isPublished && <Badge variant="success">Published</Badge>}
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Create Modal */}
        <Modal open={showCreateModal} onClose={() => setShowCreateModal(false)} title="New Document" size="sm">
          <div className="space-y-4">
            <Input label="Title" placeholder="e.g., Q1 Planning Notes" value={newTitle} onChange={e => setNewTitle(e.target.value)} />
            <Select
              label="Document Type"
              options={[
                { value: 'document', label: 'Document' },
                { value: 'policy', label: 'Policy' },
                { value: 'meeting_notes', label: 'Meeting Notes' },
                { value: 'handbook', label: 'Handbook' },
              ]}
              value={newType}
              onChange={e => setNewType(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setShowCreateModal(false)}>Cancel</Button>
              <Button onClick={handleCreateDocument} disabled={!newTitle.trim()}>Create</Button>
            </div>
          </div>
        </Modal>
      </>
    )
  }

  // ============================================================
  // Editor view
  // ============================================================
  const saveStatusBadge = {
    saved: { variant: 'success' as const, icon: <Check size={10} />, label: 'Saved' },
    saving: { variant: 'info' as const, icon: <Loader2 size={10} className="animate-spin" />, label: 'Saving...' },
    unsaved: { variant: 'warning' as const, icon: <Clock size={10} />, label: 'Unsaved changes' },
    conflict: { variant: 'error' as const, icon: <X size={10} />, label: 'Conflict detected' },
  }[saveStatus]

  return (
    <>
      <Header
        title={title || 'Untitled Document'}
               actions={
          <div className="flex items-center gap-2">
            {/* Active collaborator avatars */}
            {activeCollaborators.length > 0 && (
              <div className="flex -space-x-2 mr-2">
                {activeCollaborators.slice(0, 4).map(c => (
                  <div
                    key={c.id}
                    className="w-7 h-7 rounded-full bg-accent/15 border-2 border-card flex items-center justify-center text-[10px] font-medium text-accent"
                    title={getEmployeeName(c.employeeId)}
                  >
                    {getEmployeeName(c.employeeId)[0]}
                  </div>
                ))}
                {activeCollaborators.length > 4 && (
                  <div className="w-7 h-7 rounded-full bg-gray-100 border-2 border-card flex items-center justify-center text-[10px] font-medium text-t3">
                    +{activeCollaborators.length - 4}
                  </div>
                )}
              </div>
            )}

            <Badge variant={saveStatusBadge.variant}>
              <span className="flex items-center gap-1">{saveStatusBadge.icon} {saveStatusBadge.label}</span>
            </Badge>

            <Button variant="ghost" size="sm" onClick={loadVersionHistory} title="Version history">
              <History size={14} />
            </Button>
            <Button variant="ghost" size="sm" onClick={loadComments} title="Comments">
              <MessageSquare size={14} />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => { loadCollaborators(); setShowShareModal(true) }} title="Share">
              <Share2 size={14} />
            </Button>
            <Button size="sm" onClick={handleSave} disabled={!isDirty || saveStatus === 'saving'}>
              <Save size={14} /> Save
            </Button>
          </div>
        }
      />

      <div className="flex max-w-full">
        {/* Main editor area */}
        <div className="flex-1 max-w-4xl mx-auto p-6">
          {/* Rich text toolbar */}
          <div className="flex items-center gap-0.5 p-1.5 bg-card border border-border rounded-lg mb-4 flex-wrap">
            <ToolbarBtn icon={<Bold size={14} />} onClick={() => execCmd('bold')} title="Bold" />
            <ToolbarBtn icon={<Italic size={14} />} onClick={() => execCmd('italic')} title="Italic" />
            <ToolbarBtn icon={<Underline size={14} />} onClick={() => execCmd('underline')} title="Underline" />
            <div className="w-px h-5 bg-border mx-1" />
            <ToolbarBtn icon={<Heading1 size={14} />} onClick={() => execCmd('formatBlock', 'h1')} title="Heading 1" />
            <ToolbarBtn icon={<Heading2 size={14} />} onClick={() => execCmd('formatBlock', 'h2')} title="Heading 2" />
            <div className="w-px h-5 bg-border mx-1" />
            <ToolbarBtn icon={<List size={14} />} onClick={() => execCmd('insertUnorderedList')} title="Bullet list" />
            <ToolbarBtn icon={<ListOrdered size={14} />} onClick={() => execCmd('insertOrderedList')} title="Numbered list" />
            <div className="w-px h-5 bg-border mx-1" />
            <ToolbarBtn icon={<AlignLeft size={14} />} onClick={() => execCmd('justifyLeft')} title="Align left" />
            <ToolbarBtn icon={<AlignCenter size={14} />} onClick={() => execCmd('justifyCenter')} title="Align center" />
            <ToolbarBtn icon={<AlignRight size={14} />} onClick={() => execCmd('justifyRight')} title="Align right" />
            <div className="w-px h-5 bg-border mx-1" />
            <ToolbarBtn icon={<Link size={14} />} onClick={() => {
              const url = prompt('Enter URL:')
              if (url) execCmd('createLink', url)
            }} title="Insert link" />
            <ToolbarBtn icon={<Code size={14} />} onClick={() => execCmd('formatBlock', 'pre')} title="Code block" />
            <ToolbarBtn icon={<Quote size={14} />} onClick={() => execCmd('formatBlock', 'blockquote')} title="Blockquote" />
          </div>

          {/* Conflict banner */}
          {saveStatus === 'conflict' && (
            <div className="flex items-center gap-3 p-3 mb-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg">
              <X size={16} className="text-red-600 shrink-0" />
              <div className="flex-1">
                <p className="text-xs font-medium text-red-700 dark:text-red-400">Conflict detected</p>
                <p className="text-[10px] text-red-600 dark:text-red-500">Another user has edited this document. Reload to see the latest version, or force save to overwrite.</p>
              </div>
              <Button size="sm" variant="danger" onClick={() => window.location.reload()}>
                <RotateCcw size={12} /> Reload
              </Button>
            </div>
          )}

          {/* Editable content area */}
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            onInput={handleEditorInput}
            className="min-h-[60vh] p-6 bg-card border border-border rounded-lg text-sm text-t1 leading-relaxed outline-none focus:ring-2 focus:ring-ring prose prose-sm max-w-none
              [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-t1 [&_h1]:mb-3
              [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-t1 [&_h2]:mb-2
              [&_h3]:text-lg [&_h3]:font-medium [&_h3]:text-t1 [&_h3]:mb-2
              [&_p]:mb-2 [&_ul]:pl-6 [&_ol]:pl-6 [&_li]:mb-1
              [&_blockquote]:border-l-4 [&_blockquote]:border-accent/30 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-t3
              [&_pre]:bg-canvas [&_pre]:p-3 [&_pre]:rounded-lg [&_pre]:font-mono [&_pre]:text-xs [&_pre]:overflow-x-auto
              [&_a]:text-accent [&_a]:underline"
            dangerouslySetInnerHTML={localContent ? undefined : { __html: '' }}
          />

          {/* Document meta */}
          <div className="flex items-center justify-between mt-3 text-[10px] text-t4">
            <span>Version {localVersion}</span>
            {document?.lastEditedBy && <span>Last edited by {getEmployeeName(document.lastEditedBy)}</span>}
            {document?.updatedAt && <span>{new Date(document.updatedAt).toLocaleString()}</span>}
          </div>
        </div>

        {/* Version History Sidebar */}
        {showVersionHistory && (
          <div className="w-80 border-l border-border bg-card p-4 overflow-y-auto max-h-[calc(100vh-64px)]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-t1 flex items-center gap-2"><History size={14} /> Version History</h3>
              <button onClick={() => { setShowVersionHistory(false); setPreviewVersion(null) }} className="text-t3 hover:text-t1"><X size={14} /></button>
            </div>
            {versions.length === 0 ? (
              <p className="text-xs text-t4">No versions yet.</p>
            ) : (
              <div className="space-y-2">
                {versions.map(v => (
                  <div
                    key={v.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      previewVersion?.id === v.id ? 'border-accent bg-accent/5' : 'border-border hover:border-accent/30'
                    }`}
                    onClick={() => setPreviewVersion(v)}
                  >
                    <div className="flex items-center justify-between">
                      <Badge variant="default">v{v.version}</Badge>
                      <span className="text-[10px] text-t4">{new Date(v.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="text-xs text-t2 mt-1">{getEmployeeName(v.editedBy)}</p>
                    {v.changeSummary && <p className="text-[10px] text-t3 mt-0.5">{v.changeSummary}</p>}
                    {previewVersion?.id === v.id && (
                      <Button size="sm" className="mt-2 w-full" onClick={() => restoreVersion(v)}>
                        <RotateCcw size={12} /> Restore this version
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Comments Sidebar */}
        {showComments && (
          <div className="w-80 border-l border-border bg-card p-4 overflow-y-auto max-h-[calc(100vh-64px)]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-t1 flex items-center gap-2"><MessageSquare size={14} /> Comments</h3>
              <button onClick={() => setShowComments(false)} className="text-t3 hover:text-t1"><X size={14} /></button>
            </div>

            {/* New comment */}
            <div className="mb-4">
              <textarea
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                rows={2}
                className="w-full rounded-lg border border-border bg-canvas px-3 py-2 text-xs text-t1 placeholder:text-t4 focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
              <Button size="sm" className="mt-1" onClick={submitComment} disabled={!newComment.trim()}>
                <Send size={12} /> Comment
              </Button>
            </div>

            {/* Comments list */}
            {comments.length === 0 ? (
              <p className="text-xs text-t4">No comments yet.</p>
            ) : (
              <div className="space-y-3">
                {comments.filter(c => !c.parentId).map(c => (
                  <div key={c.id} className={`p-3 rounded-lg border ${c.isResolved ? 'border-border bg-canvas/50 opacity-60' : 'border-border'}`}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-t1">{getEmployeeName(c.authorId)}</span>
                      <span className="text-[10px] text-t4">{new Date(c.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="text-xs text-t2 mt-1">{c.content}</p>
                    {!c.isResolved && (
                      <button
                        onClick={() => handleResolveComment(c.id)}
                        className="flex items-center gap-1 text-[10px] text-t3 hover:text-accent mt-2"
                      >
                        <CheckCircle size={10} /> Resolve
                      </button>
                    )}
                    {c.isResolved && (
                      <Badge variant="success" className="mt-1"><Check size={8} /> Resolved</Badge>
                    )}
                    {/* Thread replies */}
                    {comments.filter(r => r.parentId === c.id).map(r => (
                      <div key={r.id} className="mt-2 pl-3 border-l-2 border-border">
                        <span className="text-[10px] font-medium text-t2">{getEmployeeName(r.authorId)}</span>
                        <p className="text-[10px] text-t3 mt-0.5">{r.content}</p>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Share Modal */}
      <Modal open={showShareModal} onClose={() => setShowShareModal(false)} title="Share Document" size="md">
        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-t4" />
              <input
                type="text"
                placeholder="Search people to add..."
                value={shareSearch}
                onChange={e => setShareSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-canvas text-sm text-t1 placeholder:text-t4 focus:outline-none focus:ring-2 focus:ring-ring"
              />
              {filteredShareEmployees.length > 0 && (
                <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg max-h-40 overflow-y-auto">
                  {filteredShareEmployees.map((emp: any) => (
                    <button
                      key={emp.id}
                      onClick={() => handleAddCollaborator(emp.id)}
                      className="w-full px-3 py-2 text-left hover:bg-canvas flex items-center gap-2 text-sm"
                    >
                      <div className="w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center text-[10px] font-medium text-accent">
                        {(emp.profile?.full_name || emp.full_name || '?')[0]}
                      </div>
                      <span className="text-t1 text-xs">{emp.profile?.full_name || emp.full_name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Select
              options={[
                { value: 'view', label: 'View' },
                { value: 'comment', label: 'Comment' },
                { value: 'edit', label: 'Edit' },
                { value: 'admin', label: 'Admin' },
              ]}
              value={sharePermission}
              onChange={e => setSharePermission(e.target.value)}
            />
          </div>

          {/* Current collaborators */}
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-t2">People with access</h4>
            {collaborators.length === 0 ? (
              <p className="text-xs text-t4">Only you have access.</p>
            ) : (
              collaborators.map(c => (
                <div key={c.id} className="flex items-center gap-2 py-1.5">
                  <div className="w-7 h-7 rounded-full bg-accent/10 flex items-center justify-center text-[10px] font-medium text-accent">
                    {getEmployeeName(c.employeeId)[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs text-t1 block truncate">{getEmployeeName(c.employeeId)}</span>
                  </div>
                  <Badge variant="default">{c.permission}</Badge>
                  <button onClick={() => handleRemoveCollaborator(c.employeeId)} className="text-t4 hover:text-red-500 p-0.5">
                    <Trash2 size={12} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </Modal>
    </>
  )
}

// ============================================================
// Toolbar Button
// ============================================================

function ToolbarBtn({ icon, onClick, title }: { icon: React.ReactNode; onClick: () => void; title: string }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="p-1.5 rounded hover:bg-canvas text-t3 hover:text-t1 transition-colors"
    >
      {icon}
    </button>
  )
}
