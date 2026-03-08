'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils/cn'
import {
  Link2, RefreshCw, Check, X, Settings, ExternalLink,
  BookOpen, GraduationCap, Play, Layers, Zap, Library
} from 'lucide-react'

interface ContentProvidersProps {
  connectedProviders: Set<string>
  onConnect: (providerId: string) => void
  onSync: (providerId: string) => void
  onDisconnect: (providerId: string) => void
  itemCounts: Record<string, number>
}

const PROVIDERS = [
  {
    id: 'udemy_business',
    name: 'Udemy Business',
    desc: 'Curated collection of 25,000+ courses across tech, business, and personal development',
    icon: Play,
    color: '#a435f0',
    courses: '25,000+',
    categories: 'Tech, Business, Design',
  },
  {
    id: 'linkedin_learning',
    name: 'LinkedIn Learning',
    desc: 'Expert-led courses with LinkedIn profile integration and skill assessments',
    icon: GraduationCap,
    color: '#0a66c2',
    courses: '21,000+',
    categories: 'Business, Tech, Creative',
  },
  {
    id: 'coursera',
    name: 'Coursera for Business',
    desc: 'University-level courses and certificates from top institutions worldwide',
    icon: BookOpen,
    color: '#0056d2',
    courses: '7,000+',
    categories: 'Data Science, Business, IT',
  },
  {
    id: 'go1',
    name: 'GO1',
    desc: 'Content aggregator with access to 100+ providers and compliance libraries',
    icon: Layers,
    color: '#00b67a',
    courses: '100,000+',
    categories: 'Compliance, Soft Skills, Safety',
  },
  {
    id: 'opensesame',
    name: 'OpenSesame',
    desc: 'Curated eLearning courses with smart recommendations and compliance focus',
    icon: Library,
    color: '#ff6b35',
    courses: '30,000+',
    categories: 'Compliance, DEI, Safety',
  },
  {
    id: 'skillsoft',
    name: 'Skillsoft Percipio',
    desc: 'AI-driven learning platform with immersive content and skill benchmarks',
    icon: Zap,
    color: '#1a1a2e',
    courses: '45,000+',
    categories: 'Leadership, Tech, Compliance',
  },
]

export function ContentProviders({ connectedProviders, onConnect, onSync, onDisconnect, itemCounts }: ContentProvidersProps) {
  const [connectingId, setConnectingId] = useState<string | null>(null)
  const [syncingId, setSyncingId] = useState<string | null>(null)
  const [showConfigFor, setShowConfigFor] = useState<string | null>(null)
  const [apiKey, setApiKey] = useState('')

  const handleConnect = useCallback((id: string) => {
    setConnectingId(id)
    // Simulate API connection
    setTimeout(() => {
      onConnect(id)
      setConnectingId(null)
      setShowConfigFor(null)
      setApiKey('')
    }, 1500)
  }, [onConnect])

  const handleSync = useCallback((id: string) => {
    setSyncingId(id)
    setTimeout(() => {
      onSync(id)
      setSyncingId(null)
    }, 2000)
  }, [onSync])

  const connectedCount = connectedProviders.size

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-t1 flex items-center gap-2">
            <Link2 size={15} /> Content Integrations
          </h3>
          <p className="text-xs text-t3 mt-0.5">{connectedCount} of {PROVIDERS.length} providers connected</p>
        </div>
        {connectedCount > 0 && (
          <Button variant="outline" size="sm" onClick={() => connectedProviders.forEach(id => handleSync(id))}>
            <RefreshCw size={12} /> Sync All
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {PROVIDERS.map(provider => {
          const isConnected = connectedProviders.has(provider.id)
          const isConnecting = connectingId === provider.id
          const isSyncing = syncingId === provider.id
          const count = itemCounts[provider.id] || 0
          const Icon = provider.icon

          return (
            <div key={provider.id} className={cn('provider-card', isConnected && 'provider-card-connected')}>
              {/* Header */}
              <div className="flex items-start gap-3 mb-3">
                <div className="provider-icon" style={{ backgroundColor: `${provider.color}12`, color: provider.color }}>
                  <Icon size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-t1">{provider.name}</p>
                    {isConnected && <Badge variant="success" className="text-[0.5rem] px-1.5 py-0">Connected</Badge>}
                  </div>
                  <p className="text-[0.65rem] text-t3 mt-0.5 line-clamp-2">{provider.desc}</p>
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-3 mb-3 text-[0.65rem] text-t3">
                <span>{provider.courses} courses</span>
                <span>·</span>
                <span>{provider.categories}</span>
              </div>

              {/* Connected state */}
              {isConnected && (
                <div className="flex items-center justify-between mb-3 py-2 px-3 rounded-lg bg-green-50/50 border border-green-100">
                  <div className="text-xs">
                    <span className="font-medium text-green-700">{count} items</span>
                    <span className="text-green-600"> synced</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleSync(provider.id)}
                      disabled={isSyncing}
                      className="p-1 rounded hover:bg-green-100 text-green-600 transition-colors"
                    >
                      <RefreshCw size={12} className={cn(isSyncing && 'animate-spin')} />
                    </button>
                    <button
                      onClick={() => setShowConfigFor(provider.id)}
                      className="p-1 rounded hover:bg-green-100 text-green-600 transition-colors"
                    >
                      <Settings size={12} />
                    </button>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                {!isConnected ? (
                  <Button
                    variant="primary"
                    size="sm"
                    className="flex-1"
                    onClick={() => setShowConfigFor(provider.id)}
                    disabled={isConnecting}
                  >
                    {isConnecting ? (
                      <><RefreshCw size={12} className="animate-spin" /> Connecting...</>
                    ) : (
                      <><Link2 size={12} /> Connect</>
                    )}
                  </Button>
                ) : (
                  <>
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => handleSync(provider.id)} disabled={isSyncing}>
                      {isSyncing ? <><RefreshCw size={12} className="animate-spin" /> Syncing...</> : <><RefreshCw size={12} /> Sync Now</>}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => onDisconnect(provider.id)}>
                      <X size={12} />
                    </Button>
                  </>
                )}
              </div>

              {/* Config modal inline */}
              {showConfigFor === provider.id && !isConnected && (
                <div className="mt-3 pt-3 border-t border-divider/50">
                  <p className="text-xs font-medium text-t1 mb-2">API Configuration</p>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={e => setApiKey(e.target.value)}
                    className="w-full px-3 py-2 border border-divider rounded-lg text-xs mb-2 focus:outline-none focus:border-tempo-500"
                    placeholder={`${provider.name} API Key`}
                  />
                  <div className="flex gap-2">
                    <Button size="sm" variant="primary" className="flex-1" onClick={() => handleConnect(provider.id)} disabled={isConnecting}>
                      {isConnecting ? 'Connecting...' : 'Connect'}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => { setShowConfigFor(null); setApiKey('') }}>Cancel</Button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
