'use client'

import { useState, useMemo } from 'react'
import { Header } from '@/components/layout/header'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { StatCard } from '@/components/ui/stat-card'
import { Tabs } from '@/components/ui/tabs'
import { Modal } from '@/components/ui/modal'
import { Input, Select } from '@/components/ui/input'
import {
  AppWindow, Search, Star, Download, Trash2, RefreshCw,
  Filter, ExternalLink, Check, X, ChevronRight, Package,
  Code, CreditCard, Globe, Shield, MessageSquare, Zap,
  BarChart3, Headphones, Settings,
} from 'lucide-react'
import {
  getMarketplaceApps,
  getAppDetails,
  getCategories,
  installApp,
  uninstallApp,
  getInstalledApps,
  syncAppData,
  getMarketplaceStats,
} from '@/lib/marketplace'
import type { AppCategory, AppPricing, MarketplaceApp, InstalledApp } from '@/lib/marketplace'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ORG_ID = 'org-1'

const CATEGORY_ICONS: Record<AppCategory, React.ReactNode> = {
  HRIS: <Package size={14} />,
  Payroll: <CreditCard size={14} />,
  Benefits: <Shield size={14} />,
  Communication: <MessageSquare size={14} />,
  Productivity: <Zap size={14} />,
  Security: <Shield size={14} />,
  Finance: <BarChart3 size={14} />,
  'Developer Tools': <Code size={14} />,
  CRM: <Globe size={14} />,
  Support: <Headphones size={14} />,
}

function renderStars(rating: number) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={12}
          className={
            s <= Math.round(rating)
              ? 'fill-amber-400 text-amber-400'
              : 'text-gray-300'
          }
        />
      ))}
    </div>
  )
}

function pricingBadge(pricing: AppPricing, details?: string) {
  const variant = pricing === 'free' ? 'success' : pricing === 'paid' ? 'error' : 'warning'
  const label = pricing === 'free' ? 'Free' : pricing === 'paid' ? 'Paid' : 'Freemium'
  return (
    <Badge variant={variant} title={details}>
      {label}
    </Badge>
  )
}

function formatNumber(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(n)
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function MarketplacePage() {
  // State
  const [activeTab, setActiveTab] = useState('browse')
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<AppCategory | 'all'>('all')
  const [pricingFilter, setPricingFilter] = useState<AppPricing | 'all'>('all')
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null)
  const [, setRefreshKey] = useState(0)

  // Force re-render helper (needed because marketplace functions mutate in-memory state)
  const refresh = () => setRefreshKey((k) => k + 1)

  // Data
  const categories = getCategories()
  const stats = getMarketplaceStats(ORG_ID)
  const installedApps = getInstalledApps(ORG_ID)
  const installedIds = new Set(installedApps.map((i) => i.appId))

  // Filtered apps for browse tab
  const filteredApps = useMemo(() => {
    return getMarketplaceApps({
      category: categoryFilter !== 'all' ? categoryFilter : undefined,
      pricing: pricingFilter !== 'all' ? pricingFilter : undefined,
      search: searchTerm || undefined,
    })
  }, [categoryFilter, pricingFilter, searchTerm])

  // Selected app detail
  const selectedApp = selectedAppId ? getAppDetails(selectedAppId) : null
  const selectedInstallation = selectedAppId
    ? installedApps.find((i) => i.appId === selectedAppId) ?? null
    : null

  // Handlers
  function handleInstall(appId: string) {
    const result = installApp(ORG_ID, appId, { autoSync: true })
    if (result.success) {
      refresh()
    }
  }

  function handleUninstall(appId: string) {
    const result = uninstallApp(ORG_ID, appId)
    if (result.success) {
      setSelectedAppId(null)
      refresh()
    }
  }

  function handleSync(appId: string) {
    syncAppData(ORG_ID, appId)
    refresh()
  }

  // Tabs config
  const tabs = [
    { id: 'browse', label: 'Browse Apps', count: stats.totalAppsAvailable },
    { id: 'installed', label: 'Installed Apps', count: stats.totalInstalled },
  ]

  return (
    <>
      <Header
        title="App Marketplace"
        subtitle="Browse, install, and manage integrations for your organization"
        actions={
          <Button size="sm" variant="outline" onClick={() => setActiveTab('installed')}>
            <Settings size={14} /> Manage Installed ({stats.totalInstalled})
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Available Apps"
          value={stats.totalAppsAvailable}
          icon={<AppWindow size={20} />}
        />
        <StatCard
          label="Installed"
          value={stats.totalInstalled}
          change={`${stats.activeIntegrations} active`}
          changeType="positive"
          icon={<Download size={20} />}
          href="/it/apps"
        />
        <StatCard
          label="Categories"
          value={categories.length}
          change="across all integrations"
          changeType="neutral"
          icon={<Filter size={20} />}
        />
        <StatCard
          label="Error Integrations"
          value={stats.errorIntegrations}
          change={stats.errorIntegrations > 0 ? 'needs attention' : 'all healthy'}
          changeType={stats.errorIntegrations > 0 ? 'negative' : 'positive'}
          icon={<RefreshCw size={20} />}
        />
      </div>

      <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} className="mb-6" />

      {/* ============================================================= */}
      {/* BROWSE TAB                                                     */}
      {/* ============================================================= */}
      {activeTab === 'browse' && (
        <>
          {/* Search & pricing filter */}
          <div className="flex flex-col md:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-t3" />
              <input
                type="text"
                placeholder="Search apps by name, category, or developer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-divider rounded-[var(--radius-input)] text-t1 placeholder:text-t3 focus:outline-none focus:ring-2 focus:ring-tempo-600/20 focus:border-tempo-600"
              />
            </div>
            <Select
              value={pricingFilter}
              onChange={(e) => setPricingFilter(e.target.value as AppPricing | 'all')}
              options={[
                { value: 'all', label: 'All Pricing' },
                { value: 'free', label: 'Free' },
                { value: 'freemium', label: 'Freemium' },
                { value: 'paid', label: 'Paid' },
              ]}
              className="w-40"
            />
          </div>

          {/* Category pills */}
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              onClick={() => setCategoryFilter('all')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                categoryFilter === 'all'
                  ? 'bg-tempo-600 text-white'
                  : 'bg-canvas text-t2 hover:bg-gray-200'
              }`}
            >
              <AppWindow size={12} />
              All ({stats.totalAppsAvailable})
            </button>
            {categories.map(({ category, count }) => (
              <button
                key={category}
                onClick={() => setCategoryFilter(category)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  categoryFilter === category
                    ? 'bg-tempo-600 text-white'
                    : 'bg-canvas text-t2 hover:bg-gray-200'
                }`}
              >
                {CATEGORY_ICONS[category]}
                {category} ({count})
              </button>
            ))}
          </div>

          {/* App Grid */}
          {filteredApps.length === 0 ? (
            <div className="text-center py-16">
              <AppWindow size={40} className="mx-auto text-t3 mb-3" />
              <p className="text-sm text-t2">No apps match your filters</p>
              <p className="text-xs text-t3 mt-1">Try adjusting your search or category filter</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredApps.map((app) => {
                const isInstalled = installedIds.has(app.id)
                return (
                  <Card key={app.id} className="flex flex-col hover:border-tempo-300 transition-colors cursor-pointer" onClick={() => setSelectedAppId(app.id)}>
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-10 h-10 rounded-lg bg-canvas flex items-center justify-center text-lg flex-shrink-0">
                        {app.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-semibold text-t1 truncate">{app.name}</h3>
                          {isInstalled && (
                            <Badge variant="success">
                              <Check size={10} className="mr-0.5" /> Installed
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-t3 truncate">{app.developer}</p>
                      </div>
                      {pricingBadge(app.pricing, app.pricingDetails)}
                    </div>

                    <p className="text-xs text-t2 mb-3 line-clamp-2 flex-1">{app.description}</p>

                    <div className="flex items-center justify-between pt-3 border-t border-divider">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          {renderStars(app.rating)}
                          <span className="text-xs text-t3 ml-1">{app.rating}</span>
                        </div>
                        <span className="text-xs text-t3">
                          <Download size={10} className="inline mr-0.5" />
                          {formatNumber(app.installCount)}
                        </span>
                      </div>
                      <Button
                        size="sm"
                        variant={isInstalled ? 'secondary' : 'primary'}
                        onClick={(e) => {
                          e.stopPropagation()
                          if (isInstalled) {
                            handleUninstall(app.id)
                          } else {
                            handleInstall(app.id)
                          }
                        }}
                      >
                        {isInstalled ? (
                          <><Trash2 size={12} /> Remove</>
                        ) : (
                          <><Download size={12} /> Install</>
                        )}
                      </Button>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* ============================================================= */}
      {/* INSTALLED TAB                                                  */}
      {/* ============================================================= */}
      {activeTab === 'installed' && (
        <>
          {installedApps.length === 0 ? (
            <div className="text-center py-16">
              <Package size={40} className="mx-auto text-t3 mb-3" />
              <p className="text-sm text-t2">No apps installed yet</p>
              <p className="text-xs text-t3 mt-1">Browse the marketplace to find integrations for your organization</p>
              <Button size="sm" className="mt-4" onClick={() => setActiveTab('browse')}>
                Browse Apps
              </Button>
            </div>
          ) : (
            <Card padding="none">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Installed Integrations ({installedApps.length})</CardTitle>
                  <Badge variant="success">{stats.activeIntegrations} active</Badge>
                </div>
              </CardHeader>
              <div className="divide-y divide-divider">
                {installedApps.map((inst) => {
                  const app = inst.app
                  const statusVariant =
                    inst.status === 'active' ? 'success' :
                    inst.status === 'error' ? 'error' :
                    inst.status === 'paused' ? 'warning' : 'default'
                  return (
                    <div key={inst.appId} className="px-6 py-4 flex items-center gap-4 hover:bg-canvas/50 transition-colors">
                      <div className="w-10 h-10 rounded-lg bg-canvas flex items-center justify-center text-lg flex-shrink-0">
                        {app.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-t1">{app.name}</p>
                          <Badge variant={statusVariant}>{inst.status.replace('_', ' ')}</Badge>
                        </div>
                        <p className="text-xs text-t3">
                          {app.category} &middot; {app.developer}
                          {inst.lastSyncAt && <> &middot; Last sync: {timeAgo(inst.lastSyncAt)}</>}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedAppId(app.id)}
                        >
                          <ChevronRight size={12} /> Details
                        </Button>
                        {inst.status === 'active' && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleSync(app.id)}
                          >
                            <RefreshCw size={12} /> Sync
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleUninstall(app.id)}
                        >
                          <Trash2 size={12} />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>
          )}

          {/* Category Coverage */}
          {installedApps.length > 0 && (
            <Card className="mt-6">
              <h3 className="text-sm font-semibold text-t1 mb-4">Category Coverage</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {stats.categoryCoverage.map(({ category, installed, available }) => (
                  <div key={category} className="bg-canvas rounded-lg p-3 text-center">
                    <div className="flex items-center justify-center mb-2 text-tempo-600">
                      {CATEGORY_ICONS[category]}
                    </div>
                    <p className="text-xs font-medium text-t1">{category}</p>
                    <p className="text-[0.6rem] text-t3 mt-0.5">
                      {installed} / {available} installed
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Recent Syncs */}
          {stats.recentSyncs.length > 0 && (
            <Card className="mt-6">
              <h3 className="text-sm font-semibold text-t1 mb-4">Recent Sync Activity</h3>
              <div className="space-y-2">
                {stats.recentSyncs.slice(0, 5).map((sync) => {
                  const app = getAppDetails(sync.appId)
                  const syncVariant =
                    sync.status === 'success' ? 'success' :
                    sync.status === 'partial' ? 'warning' :
                    sync.status === 'failed' ? 'error' : 'info'
                  return (
                    <div key={sync.id} className="flex items-center justify-between bg-canvas rounded-lg px-4 py-2.5">
                      <div className="flex items-center gap-3">
                        <span className="text-sm">{app?.icon || '?'}</span>
                        <div>
                          <p className="text-xs font-medium text-t1">{app?.name || sync.appId}</p>
                          <p className="text-[0.6rem] text-t3">{timeAgo(sync.startedAt)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-t3">{sync.recordsSynced} records</span>
                        <Badge variant={syncVariant}>{sync.status}</Badge>
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>
          )}
        </>
      )}

      {/* ============================================================= */}
      {/* APP DETAIL MODAL                                               */}
      {/* ============================================================= */}
      <Modal
        open={!!selectedApp}
        onClose={() => setSelectedAppId(null)}
        title={selectedApp?.name || ''}
        size="lg"
      >
        {selectedApp && (
          <div className="space-y-6">
            {/* Header section */}
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-xl bg-canvas flex items-center justify-center text-2xl flex-shrink-0">
                {selectedApp.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-base font-semibold text-t1">{selectedApp.name}</h3>
                  {selectedApp.status === 'beta' && <Badge variant="warning">Beta</Badge>}
                  {selectedApp.status === 'coming_soon' && <Badge>Coming Soon</Badge>}
                  {pricingBadge(selectedApp.pricing, selectedApp.pricingDetails)}
                </div>
                <p className="text-xs text-t3 mb-2">by {selectedApp.developer}</p>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    {renderStars(selectedApp.rating)}
                    <span className="text-xs text-t2 ml-1">{selectedApp.rating}</span>
                    <span className="text-xs text-t3">({selectedApp.reviewCount} reviews)</span>
                  </div>
                  <span className="text-xs text-t3">
                    <Download size={10} className="inline mr-0.5" />
                    {formatNumber(selectedApp.installCount)} installs
                  </span>
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <Button size="sm" variant="outline" onClick={() => window.open(selectedApp.website, '_blank')}>
                  <ExternalLink size={12} /> Website
                </Button>
                {installedIds.has(selectedApp.id) ? (
                  <Button size="sm" variant="danger" onClick={() => handleUninstall(selectedApp.id)}>
                    <Trash2 size={12} /> Uninstall
                  </Button>
                ) : (
                  <Button size="sm" onClick={() => handleInstall(selectedApp.id)}>
                    <Download size={12} /> Install
                  </Button>
                )}
              </div>
            </div>

            {/* Installed status banner */}
            {selectedInstallation && (
              <div className={`rounded-lg px-4 py-3 text-xs ${
                selectedInstallation.status === 'active'
                  ? 'bg-green-50 text-success'
                  : selectedInstallation.status === 'error'
                  ? 'bg-red-50 text-error'
                  : 'bg-amber-50 text-warning'
              }`}>
                <div className="flex items-center justify-between">
                  <span>
                    <Check size={12} className="inline mr-1" />
                    Installed &middot; Status: {selectedInstallation.status.replace('_', ' ')}
                    {selectedInstallation.lastSyncAt && <> &middot; Last sync: {timeAgo(selectedInstallation.lastSyncAt)}</>}
                  </span>
                  {selectedInstallation.status === 'active' && (
                    <Button size="sm" variant="outline" onClick={() => handleSync(selectedApp.id)}>
                      <RefreshCw size={12} /> Sync Now
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Description */}
            <div>
              <h4 className="text-xs font-semibold text-t1 mb-2 uppercase tracking-wide">About</h4>
              <p className="text-xs text-t2 leading-relaxed">{selectedApp.longDescription}</p>
            </div>

            {/* Pricing details */}
            {selectedApp.pricingDetails && (
              <div>
                <h4 className="text-xs font-semibold text-t1 mb-2 uppercase tracking-wide">Pricing</h4>
                <p className="text-xs text-t2">{selectedApp.pricingDetails}</p>
              </div>
            )}

            {/* Features */}
            <div>
              <h4 className="text-xs font-semibold text-t1 mb-2 uppercase tracking-wide">Features</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {selectedApp.features.map((feature, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <Check size={14} className="text-success flex-shrink-0 mt-0.5" />
                    <span className="text-xs text-t2">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Setup instructions */}
            <div>
              <h4 className="text-xs font-semibold text-t1 mb-2 uppercase tracking-wide">Setup Instructions</h4>
              <ol className="space-y-2">
                {selectedApp.setupInstructions.map((step, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-tempo-100 text-tempo-700 text-[0.6rem] font-semibold flex items-center justify-center">
                      {i + 1}
                    </span>
                    <span className="text-xs text-t2">{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Required permissions */}
            <div>
              <h4 className="text-xs font-semibold text-t1 mb-2 uppercase tracking-wide">Required Permissions</h4>
              <div className="flex flex-wrap gap-2">
                {selectedApp.requiredScopes.map((scope) => (
                  <span key={scope} className="px-2.5 py-1 bg-canvas rounded-full text-[0.65rem] font-medium text-t2">
                    <Shield size={10} className="inline mr-1" />
                    {scope}
                  </span>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div>
              <h4 className="text-xs font-semibold text-t1 mb-2 uppercase tracking-wide">Tags</h4>
              <div className="flex flex-wrap gap-2">
                {selectedApp.tags.map((tag) => (
                  <span key={tag} className="px-2.5 py-1 bg-canvas rounded-full text-[0.65rem] text-t3">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}
