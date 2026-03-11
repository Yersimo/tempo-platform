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
import { Blocks, Layout, Code, Database, Plus, Settings, Eye, Trash2, Globe, Lock, Monitor, Users, Folder, FileText, ArrowLeft, Home, GripVertical, Layers, BookOpen, CalendarDays, ClipboardList } from 'lucide-react'
import { useTempo } from '@/lib/store'
import { PageSkeleton } from '@/components/ui/page-skeleton'

export default function AppStudioPage() {
  const tc = useTranslations('common')
  const { customApps, appPages, employees, departments, invoices, leaveRequests, addCustomApp, updateCustomApp, deleteCustomApp, addAppPage, updateAppPage, addToast, ensureModulesLoaded } = useTempo()

  const [pageLoading, setPageLoading] = useState(true)

  useEffect(() => {
    ensureModulesLoaded?.(['customApps', 'appPages', 'employees', 'departments'])?.then?.(() => setPageLoading(false))?.catch?.(() => setPageLoading(false))
    const t = setTimeout(() => setPageLoading(false), 2000)
    return () => clearTimeout(t)
  }, [])

  const [activeTab, setActiveTab] = useState<'apps' | 'templates' | 'datasources'>('apps')
  const [editingAppId, setEditingAppId] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showAddPageModal, setShowAddPageModal] = useState(false)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [previewApp, setPreviewApp] = useState<any>(null)
  const [showConfigPageModal, setShowConfigPageModal] = useState(false)
  const [configPage, setConfigPage] = useState<any>(null)
  const [configPageForm, setConfigPageForm] = useState({ name: '', slug: '', icon: 'layout' })
  const [appForm, setAppForm] = useState({ name: '', description: '', icon: 'monitor', access: 'all' })
  const [pageForm, setPageForm] = useState({ name: '', slug: '', icon: 'layout', is_home_page: false })

  // Stats
  const publishedApps = customApps.filter(a => a.status === 'published')
  const draftApps = customApps.filter(a => a.status === 'draft')
  const totalPages = appPages.length

  // Editing app
  const editingApp = editingAppId ? customApps.find(a => a.id === editingAppId) : null
  const editingAppPages = useMemo(() => {
    if (!editingAppId) return []
    return [...appPages.filter(p => p.app_id === editingAppId)].sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
  }, [editingAppId, appPages])

  function getCreatorName(empId: string) {
    const emp = employees.find(e => e.id === empId)
    return emp?.profile?.full_name || tc('unknown')
  }

  function getPageCount(appId: string) {
    return appPages.filter(p => p.app_id === appId).length
  }

  // Templates (static)
  const templates = [
    { id: 'tpl-1', name: 'Employee Directory', description: 'Searchable staff directory with profiles, org chart integration, and department filters', icon: 'users', pages: 3, category: 'HR' },
    { id: 'tpl-2', name: 'Equipment Tracker', description: 'Track office equipment assignments, maintenance schedules, and depreciation', icon: 'monitor', pages: 4, category: 'Operations' },
    { id: 'tpl-3', name: 'Visitor Log', description: 'Front desk visitor check-in with badge printing and host notifications', icon: 'clipboard-list', pages: 2, category: 'Facilities' },
    { id: 'tpl-4', name: 'Meeting Room Booking', description: 'Reserve conference rooms with calendar integration and recurring bookings', icon: 'calendar-days', pages: 3, category: 'Facilities' },
  ]

  // Data sources (static, using store counts)
  const dataSources = [
    { id: 'ds-1', name: 'Employees', description: 'Employee profiles, contact info, and employment details', icon: 'users', records: employees.length, table: 'employees' },
    { id: 'ds-2', name: 'Departments', description: 'Organizational departments and hierarchy', icon: 'folder', records: departments.length, table: 'departments' },
    { id: 'ds-3', name: 'Invoices', description: 'Vendor invoices, amounts, and payment status', icon: 'file-text', records: invoices.length, table: 'invoices' },
    { id: 'ds-4', name: 'Leave Requests', description: 'Employee time off requests and approvals', icon: 'calendar-days', records: leaveRequests.length, table: 'leave_requests' },
  ]

  const iconMap: Record<string, React.ReactNode> = {
    monitor: <Monitor size={20} />,
    users: <Users size={20} />,
    folder: <Folder size={20} />,
    'file-text': <FileText size={20} />,
    layout: <Layout size={20} />,
    'clipboard-list': <ClipboardList size={20} />,
    'calendar-days': <CalendarDays size={20} />,
    blocks: <Blocks size={20} />,
    code: <Code size={20} />,
    database: <Database size={20} />,
    'book-open': <BookOpen size={20} />,
  }

  function getIcon(icon: string, size = 20) {
    return iconMap[icon] || <Blocks size={size} />
  }

  function openCreateModal() {
    setAppForm({ name: '', description: '', icon: 'monitor', access: 'all' })
    setShowCreateModal(true)
  }

  function submitCreateApp() {
    if (!appForm.name) return
    const slug = appForm.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    addCustomApp({
      name: appForm.name,
      description: appForm.description,
      slug,
      icon: appForm.icon,
      created_by: employees[0]?.id || 'emp-1',
      access_roles: appForm.access === 'all' ? null : ['admin'],
    })
    setShowCreateModal(false)
  }

  function publishApp(id: string) {
    updateCustomApp(id, {
      status: 'published',
      published_by: employees[0]?.id || 'emp-1',
      published_at: new Date().toISOString(),
    })
  }

  function unpublishApp(id: string) {
    updateCustomApp(id, { status: 'draft', published_by: null, published_at: null })
  }

  function handleDeleteApp(id: string) {
    deleteCustomApp(id)
    if (editingAppId === id) setEditingAppId(null)
  }

  function openAddPage() {
    setPageForm({ name: '', slug: '', icon: 'layout', is_home_page: false })
    setShowAddPageModal(true)
  }

  function submitAddPage() {
    if (!pageForm.name || !editingAppId) return
    const slug = pageForm.slug || pageForm.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    const maxOrder = editingAppPages.reduce((max, p) => Math.max(max, p.order_index || 0), -1)
    addAppPage({
      app_id: editingAppId,
      name: pageForm.name,
      slug,
      icon: pageForm.icon,
      is_home_page: pageForm.is_home_page,
      order_index: maxOrder + 1,
    })
    setShowAddPageModal(false)
  }

  function toggleHomePage(pageId: string) {
    // Unset current home pages for this app, then set the new one
    editingAppPages.forEach(p => {
      if (p.is_home_page) updateAppPage(p.id, { is_home_page: false })
    })
    updateAppPage(pageId, { is_home_page: true })
  }

  function openPreviewApp(app: any) {
    setPreviewApp(app)
    setShowPreviewModal(true)
  }

  function openConfigPage(page: any) {
    setConfigPage(page)
    setConfigPageForm({ name: page.name, slug: page.slug, icon: page.icon || 'layout' })
    setShowConfigPageModal(true)
  }

  function submitConfigPage() {
    if (!configPage || !configPageForm.name) return
    updateAppPage(configPage.id, {
      name: configPageForm.name,
      slug: configPageForm.slug || configPageForm.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      icon: configPageForm.icon,
    })
    addToast(`Page "${configPageForm.name}" updated`, 'success')
    setShowConfigPageModal(false)
  }

  if (pageLoading) {
    return (
      <>
        <Header
          title="App Studio"
          subtitle="Build custom apps for your organization"
          actions={<Button size="sm" disabled><Plus size={14} /> Create App</Button>}
        />
        <div className="p-6"><PageSkeleton /></div>
      </>
    )
  }

  // ─── App Detail View ───
  if (editingApp) {
    return (
      <>
        <Header
          title={editingApp.name}
          subtitle={editingApp.description || 'Custom application'}
          actions={
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => setEditingAppId(null)}>
                <ArrowLeft size={14} /> Back
              </Button>
              <Button size="sm" onClick={openAddPage}>
                <Plus size={14} /> Add Page
              </Button>
            </div>
          }
        />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard label="App Version" value={`v${editingApp.version}`} icon={<Layers size={20} />} />
          <StatCard label="Status" value={editingApp.status} icon={editingApp.status === 'published' ? <Globe size={20} /> : <Lock size={20} />} />
          <StatCard label="Pages" value={editingAppPages.length} icon={<Layout size={20} />} />
          <StatCard label="Created By" value={getCreatorName(editingApp.created_by)} icon={<Users size={20} />} />
        </div>

        {/* Pages List */}
        <Card padding="none">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>App Pages</CardTitle>
              <Badge variant="default">{editingAppPages.length} pages</Badge>
            </div>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-divider bg-canvas">
                  <th className="tempo-th text-left px-6 py-3">Order</th>
                  <th className="tempo-th text-left px-4 py-3">Page Name</th>
                  <th className="tempo-th text-left px-4 py-3">Slug</th>
                  <th className="tempo-th text-center px-4 py-3">Home Page</th>
                  <th className="tempo-th text-center px-4 py-3">{tc('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {editingAppPages.map(page => (
                  <tr key={page.id} className="hover:bg-canvas/50">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2 text-t3">
                        <GripVertical size={14} />
                        <span className="text-xs font-mono">{page.order_index}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-t3">{getIcon(page.icon || 'layout', 14)}</span>
                        <span className="text-xs font-medium text-t1">{page.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs font-mono text-t2">/{page.slug}</td>
                    <td className="px-4 py-3 text-center">
                      {page.is_home_page ? (
                        <Badge variant="success"><Home size={10} /> Home</Badge>
                      ) : (
                        <Button size="sm" variant="ghost" onClick={() => toggleHomePage(page.id)}>
                          Set as Home
                        </Button>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex gap-1 justify-center">
                        <Button size="sm" variant="secondary" onClick={() => openConfigPage(page)}><Settings size={12} /> Configure</Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {editingAppPages.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-sm text-t3">
                      No pages yet. Click &quot;Add Page&quot; to create the first page.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Page Designer Placeholder */}
        <div className="mt-6">
          <Card>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <Blocks size={32} className="text-primary" />
              </div>
              <h3 className="text-sm font-semibold text-t1 mb-2">Visual Page Designer</h3>
              <p className="text-xs text-t3 max-w-md">
                Drag-and-drop page builder with form components, data tables, charts, and layout containers. Coming soon.
              </p>
              <div className="flex gap-2 mt-4">
                <Badge variant="default">Forms</Badge>
                <Badge variant="default">Tables</Badge>
                <Badge variant="default">Charts</Badge>
                <Badge variant="default">Containers</Badge>
              </div>
            </div>
          </Card>
        </div>

        {/* Add Page Modal */}
        <Modal open={showAddPageModal} onClose={() => setShowAddPageModal(false)} title="Add Page">
          <div className="space-y-4">
            <Input label="Page Name" placeholder="e.g. Dashboard" value={pageForm.name} onChange={(e) => setPageForm({ ...pageForm, name: e.target.value })} />
            <Input label="Slug" placeholder="e.g. dashboard" value={pageForm.slug} onChange={(e) => setPageForm({ ...pageForm, slug: e.target.value })} />
            <Select
              label="Icon"
              value={pageForm.icon}
              onChange={(e) => setPageForm({ ...pageForm, icon: e.target.value })}
              options={[
                { value: 'layout', label: 'Layout' },
                { value: 'monitor', label: 'Monitor' },
                { value: 'users', label: 'Users' },
                { value: 'folder', label: 'Folder' },
                { value: 'file-text', label: 'File Text' },
                { value: 'database', label: 'Database' },
                { value: 'clipboard-list', label: 'Clipboard' },
              ]}
            />
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_home_page"
                checked={pageForm.is_home_page}
                onChange={(e) => setPageForm({ ...pageForm, is_home_page: e.target.checked })}
                className="rounded border-border"
              />
              <label htmlFor="is_home_page" className="text-sm text-t2">Set as home page</label>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setShowAddPageModal(false)}>{tc('cancel')}</Button>
              <Button onClick={submitAddPage}>Add Page</Button>
            </div>
          </div>
        </Modal>
      </>
    )
  }

  // ─── Main View ───
  return (
    <>
      <Header
        title="App Studio"
        subtitle="Build custom apps for your organization"
        actions={<Button size="sm" onClick={openCreateModal}><Plus size={14} /> Create App</Button>}
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Apps" value={customApps.length} icon={<Blocks size={20} />} />
        <StatCard label="Published" value={publishedApps.length} icon={<Globe size={20} />} change={publishedApps.length > 0 ? 'Live' : undefined} changeType="positive" />
        <StatCard label="Draft" value={draftApps.length} icon={<Lock size={20} />} />
        <StatCard label="Total Pages" value={totalPages} icon={<Layout size={20} />} />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-divider">
        {[
          { key: 'apps' as const, label: 'My Apps', icon: <Blocks size={14} /> },
          { key: 'templates' as const, label: 'Templates', icon: <BookOpen size={14} /> },
          { key: 'datasources' as const, label: 'Data Sources', icon: <Database size={14} /> },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-primary text-primary'
                : 'border-transparent text-t3 hover:text-t1'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── My Apps Tab ── */}
      {activeTab === 'apps' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {customApps.map(app => (
            <Card key={app.id}>
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  {getIcon(app.icon || 'blocks')}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-t1 truncate">{app.name}</h3>
                    <Badge variant="default">v{app.version}</Badge>
                  </div>
                  <p className="text-xs text-t3 mt-0.5 line-clamp-2">{app.description}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 mb-3 text-xs text-t3">
                <Badge variant={app.status === 'published' ? 'success' : 'default'}>
                  {app.status === 'published' ? <Globe size={10} /> : <Lock size={10} />}
                  {app.status}
                </Badge>
                <span className="flex items-center gap-1">
                  <Layout size={12} /> {getPageCount(app.id)} pages
                </span>
              </div>

              <div className="flex items-center justify-between text-xs text-t3 mb-3 pt-3 border-t border-divider">
                <span>By {getCreatorName(app.created_by)}</span>
                {app.published_at && (
                  <span>Published {new Date(app.published_at).toLocaleDateString()}</span>
                )}
              </div>

              <div className="flex gap-1.5">
                <Button size="sm" variant="secondary" onClick={() => setEditingAppId(app.id)}>
                  <Code size={12} /> Edit
                </Button>
                <Button size="sm" variant="ghost" onClick={() => openPreviewApp(app)}>
                  <Eye size={12} /> Preview
                </Button>
                {app.status === 'draft' ? (
                  <Button size="sm" variant="primary" onClick={() => publishApp(app.id)}>
                    <Globe size={12} /> Publish
                  </Button>
                ) : (
                  <Button size="sm" variant="ghost" onClick={() => unpublishApp(app.id)}>
                    <Lock size={12} /> Unpublish
                  </Button>
                )}
                <Button size="sm" variant="ghost" onClick={() => handleDeleteApp(app.id)}>
                  <Trash2 size={12} />
                </Button>
              </div>
            </Card>
          ))}

          {customApps.length === 0 && (
            <div className="col-span-full">
              <Card>
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-canvas flex items-center justify-center mb-4">
                    <Blocks size={28} className="text-t3" />
                  </div>
                  <h3 className="text-sm font-semibold text-t1 mb-1">No custom apps yet</h3>
                  <p className="text-xs text-t3 mb-4">Create your first app to get started</p>
                  <Button size="sm" onClick={openCreateModal}><Plus size={14} /> Create App</Button>
                </div>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* ── Templates Tab ── */}
      {activeTab === 'templates' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {templates.map(tpl => (
            <Card key={tpl.id}>
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-3">
                  {getIcon(tpl.icon)}
                </div>
                <h3 className="text-sm font-semibold text-t1 mb-1">{tpl.name}</h3>
                <p className="text-xs text-t3 mb-3 line-clamp-2">{tpl.description}</p>
                <div className="flex items-center gap-2 mb-4">
                  <Badge variant="default">{tpl.category}</Badge>
                  <span className="text-xs text-t3">{tpl.pages} pages</span>
                </div>
                <Button size="sm" variant="secondary" onClick={() => {
                  addCustomApp({
                    name: tpl.name,
                    description: tpl.description,
                    slug: tpl.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                    icon: tpl.icon,
                    created_by: employees[0]?.id || 'emp-1',
                    access_roles: null,
                  })
                  setActiveTab('apps')
                }}>
                  <Plus size={12} /> Use Template
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ── Data Sources Tab ── */}
      {activeTab === 'datasources' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {dataSources.map(ds => (
            <Card key={ds.id}>
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-canvas flex items-center justify-center text-t2">
                  {getIcon(ds.icon)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-t1">{ds.name}</h3>
                  <p className="text-xs text-t3 mt-0.5">{ds.description}</p>
                </div>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-divider">
                <div className="flex items-center gap-2">
                  <Database size={12} className="text-t3" />
                  <span className="text-xs font-mono text-t2">{ds.table}</span>
                </div>
                <Badge variant="info">{ds.records} records</Badge>
              </div>
              <div className="mt-3">
                <Progress value={Math.min((ds.records / Math.max(employees.length, 1)) * 100, 100)} color="orange" />
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ── App Preview Modal ── */}
      <Modal open={showPreviewModal} onClose={() => setShowPreviewModal(false)} title={previewApp ? `Preview: ${previewApp.name}` : 'App Preview'}>
        {previewApp && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                {getIcon(previewApp.icon || 'blocks')}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-t1">{previewApp.name}</h3>
                <p className="text-xs text-t3">{previewApp.description || 'No description'}</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-t3">Status</span>
                <Badge variant={previewApp.status === 'published' ? 'success' : 'default'}>
                  {previewApp.status}
                </Badge>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-t3">Version</span>
                <span className="text-t1 font-medium">v{previewApp.version}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-t3">Pages</span>
                <span className="text-t1 font-medium">{getPageCount(previewApp.id)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-t3">Created By</span>
                <span className="text-t1">{getCreatorName(previewApp.created_by)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-t3">Access</span>
                <span className="text-t1">{previewApp.access_roles ? previewApp.access_roles.join(', ') : 'All employees'}</span>
              </div>
            </div>

            {/* Page list preview */}
            {appPages.filter(p => p.app_id === previewApp.id).length > 0 && (
              <div>
                <p className="text-xs font-medium text-t1 mb-2">Pages</p>
                <div className="space-y-1">
                  {appPages.filter(p => p.app_id === previewApp.id).map(page => (
                    <div key={page.id} className="flex items-center gap-2 p-2 bg-canvas rounded-lg text-xs">
                      <span className="text-t3">{getIcon(page.icon || 'layout', 14)}</span>
                      <span className="text-t1 font-medium">{page.name}</span>
                      <span className="text-t3 font-mono">/{page.slug}</span>
                      {page.is_home_page && <Badge variant="success">Home</Badge>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => { setShowPreviewModal(false); setEditingAppId(previewApp.id) }}>
                <Code size={14} /> Open Editor
              </Button>
              <Button variant="secondary" onClick={() => setShowPreviewModal(false)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Configure Page Modal ── */}
      <Modal open={showConfigPageModal} onClose={() => setShowConfigPageModal(false)} title={`Configure Page: ${configPage?.name || ''}`}>
        <div className="space-y-4">
          <Input
            label="Page Name"
            placeholder="e.g. Dashboard"
            value={configPageForm.name}
            onChange={(e) => setConfigPageForm({ ...configPageForm, name: e.target.value })}
          />
          <Input
            label="Slug"
            placeholder="e.g. dashboard"
            value={configPageForm.slug}
            onChange={(e) => setConfigPageForm({ ...configPageForm, slug: e.target.value })}
          />
          <Select
            label="Icon"
            value={configPageForm.icon}
            onChange={(e) => setConfigPageForm({ ...configPageForm, icon: e.target.value })}
            options={[
              { value: 'layout', label: 'Layout' },
              { value: 'monitor', label: 'Monitor' },
              { value: 'users', label: 'Users' },
              { value: 'folder', label: 'Folder' },
              { value: 'file-text', label: 'File Text' },
              { value: 'database', label: 'Database' },
              { value: 'clipboard-list', label: 'Clipboard' },
            ]}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowConfigPageModal(false)}>{tc('cancel')}</Button>
            <Button onClick={submitConfigPage}><Settings size={14} /> Save</Button>
          </div>
        </div>
      </Modal>

      {/* ── Create App Modal ── */}
      <Modal open={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create Custom App">
        <div className="space-y-4">
          <Input
            label="App Name"
            placeholder="e.g. Equipment Tracker"
            value={appForm.name}
            onChange={(e) => setAppForm({ ...appForm, name: e.target.value })}
          />
          <Textarea
            label="Description"
            placeholder="What does this app do?"
            rows={3}
            value={appForm.description}
            onChange={(e) => setAppForm({ ...appForm, description: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Icon"
              value={appForm.icon}
              onChange={(e) => setAppForm({ ...appForm, icon: e.target.value })}
              options={[
                { value: 'monitor', label: 'Monitor' },
                { value: 'users', label: 'Users' },
                { value: 'folder', label: 'Folder' },
                { value: 'file-text', label: 'File Text' },
                { value: 'clipboard-list', label: 'Clipboard' },
                { value: 'calendar-days', label: 'Calendar' },
                { value: 'database', label: 'Database' },
                { value: 'book-open', label: 'Book' },
                { value: 'code', label: 'Code' },
                { value: 'blocks', label: 'Blocks' },
              ]}
            />
            <Select
              label="Access"
              value={appForm.access}
              onChange={(e) => setAppForm({ ...appForm, access: e.target.value })}
              options={[
                { value: 'all', label: 'All employees' },
                { value: 'admin', label: 'Admins only' },
                { value: 'hr', label: 'HR team' },
                { value: 'managers', label: 'Managers' },
              ]}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>{tc('cancel')}</Button>
            <Button onClick={submitCreateApp}><Plus size={14} /> Create App</Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
