'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Building2, ChevronDown, Check, Globe, Layers } from 'lucide-react'
import { useTempo } from '@/lib/store'

// Country flag mapping
const COUNTRY_FLAGS: Record<string, string> = {
  'Ghana': '\u{1F1EC}\u{1F1ED}',
  'Nigeria': '\u{1F1F3}\u{1F1EC}',
  'Kenya': '\u{1F1F0}\u{1F1EA}',
  'South Africa': '\u{1F1FF}\u{1F1E6}',
  'Tanzania': '\u{1F1F9}\u{1F1FF}',
  'Rwanda': '\u{1F1F7}\u{1F1FC}',
  'Morocco': '\u{1F1F2}\u{1F1E6}',
  'Egypt': '\u{1F1EA}\u{1F1EC}',
  'United States': '\u{1F1FA}\u{1F1F8}',
  'Canada': '\u{1F1E8}\u{1F1E6}',
  'Mexico': '\u{1F1F2}\u{1F1FD}',
  'Brazil': '\u{1F1E7}\u{1F1F7}',
  'United Kingdom': '\u{1F1EC}\u{1F1E7}',
  'Germany': '\u{1F1E9}\u{1F1EA}',
  'France': '\u{1F1EB}\u{1F1F7}',
  'Netherlands': '\u{1F1F3}\u{1F1F1}',
  'Spain': '\u{1F1EA}\u{1F1F8}',
  'Italy': '\u{1F1EE}\u{1F1F9}',
  'Ireland': '\u{1F1EE}\u{1F1EA}',
  'Switzerland': '\u{1F1E8}\u{1F1ED}',
  'India': '\u{1F1EE}\u{1F1F3}',
  'Singapore': '\u{1F1F8}\u{1F1EC}',
  'UAE': '\u{1F1E6}\u{1F1EA}',
  'Japan': '\u{1F1EF}\u{1F1F5}',
  'China': '\u{1F1E8}\u{1F1F3}',
  'Australia': '\u{1F1E6}\u{1F1FA}',
}

interface EntityInfo {
  id: string
  name: string
  country: string | null
  entityType: string | null
  isParent: boolean
}

/**
 * Entity switcher dropdown for multi-entity organizations.
 * Shows parent + all subsidiaries the user has access to.
 * Only renders for multi-entity orgs (parentOrgId is null and children exist).
 */
export function EntitySwitcher({ collapsed }: { collapsed: boolean }) {
  const { org } = useTempo()
  const [open, setOpen] = useState(false)
  const [entities, setEntities] = useState<EntityInfo[]>([])
  const [currentEntityId, setCurrentEntityId] = useState<string | null>(null)
  const [viewAll, setViewAll] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Fetch child entities for current org
  useEffect(() => {
    if (!org?.id) return
    let cancelled = false

    async function fetchEntities() {
      try {
        const res = await fetch(`/api/admin/organizations/entities?parentId=${org.id}`)
        if (!res.ok) return
        const data = await res.json()
        if (cancelled) return
        if (data.entities && data.entities.length > 0) {
          setEntities(data.entities)
          setCurrentEntityId(org.id) // default to parent
        }
      } catch {
        // If API unavailable, check for demo multi-entity data
      }
    }

    fetchEntities()
    return () => { cancelled = true }
  }, [org?.id])

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  // Don't render if not a multi-entity org
  if (entities.length === 0) return null

  const currentEntity = entities.find(e => e.id === currentEntityId)
  const parentEntity = entities.find(e => e.isParent)

  const handleSwitch = useCallback((entityId: string) => {
    setCurrentEntityId(entityId)
    setViewAll(false)
    setOpen(false)
    // Dispatch custom event for other components to react
    window.dispatchEvent(new CustomEvent('entity-switch', { detail: { entityId } }))
  }, [])

  const handleViewAll = useCallback(() => {
    setViewAll(true)
    setCurrentEntityId(null)
    setOpen(false)
    window.dispatchEvent(new CustomEvent('entity-switch', { detail: { entityId: null, viewAll: true } }))
  }, [])

  const getFlag = (country: string | null) => {
    if (!country) return ''
    return COUNTRY_FLAGS[country] || ''
  }

  if (collapsed) {
    return (
      <div className="px-2 pb-2">
        <button
          onClick={() => setOpen(!open)}
          title={viewAll ? 'All Entities' : currentEntity?.name || org.name}
          className="w-full flex items-center justify-center p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/[0.06] transition-colors"
        >
          {viewAll ? <Globe size={18} /> : <Building2 size={18} />}
        </button>
      </div>
    )
  }

  return (
    <div ref={dropdownRef} className="relative px-3 pb-3">
      {/* Trigger */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm transition-colors bg-white/[0.06] hover:bg-white/10 border border-white/10"
      >
        <Layers size={14} className="text-amber-400 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-white/90 text-xs font-medium truncate">
            {viewAll ? 'All Entities' : currentEntity?.name || org.name}
          </p>
          {!viewAll && currentEntity && (
            <p className="text-white/40 text-[0.6rem] truncate">
              {getFlag(currentEntity.country)} {currentEntity.country || 'Group'}
              {currentEntity.isParent && ' (Parent)'}
            </p>
          )}
          {viewAll && (
            <p className="text-white/40 text-[0.6rem]">
              Consolidated view - {entities.length} entities
            </p>
          )}
        </div>
        <ChevronDown size={14} className={`text-white/40 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute left-3 right-3 top-full mt-1 bg-[#1a1a2e] border border-white/10 rounded-lg shadow-xl z-50 overflow-hidden">
          <div className="py-1 max-h-64 overflow-y-auto">
            {entities.map(entity => {
              const isSelected = !viewAll && currentEntityId === entity.id
              return (
                <button
                  key={entity.id}
                  onClick={() => handleSwitch(entity.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors ${
                    isSelected ? 'bg-amber-500/20 text-white' : 'text-white/70 hover:bg-white/[0.06] hover:text-white'
                  }`}
                >
                  {entity.isParent ? (
                    <Building2 size={14} className="text-amber-400 shrink-0" />
                  ) : (
                    <span className="text-sm shrink-0 w-3.5 text-center">{entity.entityType === 'branch' ? '\u2514' : '\u251C'}</span>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">
                      {getFlag(entity.country)} {entity.name}
                    </p>
                    {!entity.isParent && entity.entityType && (
                      <p className="text-[0.6rem] text-white/40 capitalize">{entity.entityType.replace('_', ' ')}</p>
                    )}
                    {entity.isParent && (
                      <p className="text-[0.6rem] text-white/40">Group Parent</p>
                    )}
                  </div>
                  {isSelected && <Check size={14} className="text-amber-400 shrink-0" />}
                </button>
              )
            })}

            {/* View All Entities */}
            <div className="border-t border-white/10 mt-1 pt-1">
              <button
                onClick={handleViewAll}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors ${
                  viewAll ? 'bg-amber-500/20 text-white' : 'text-white/70 hover:bg-white/[0.06] hover:text-white'
                }`}
              >
                <Globe size={14} className="text-blue-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium">View All Entities</p>
                  <p className="text-[0.6rem] text-white/40">Consolidated dashboards</p>
                </div>
                {viewAll && <Check size={14} className="text-amber-400 shrink-0" />}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
