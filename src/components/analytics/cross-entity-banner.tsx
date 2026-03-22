'use client'

import { useState, useEffect } from 'react'
import { Globe, X } from 'lucide-react'

interface EntityInfo {
  id: string
  name: string
  country: string | null
}

/**
 * Banner displayed on analytics/dashboard pages when viewing
 * consolidated data across all entities (multi-entity mode).
 */
export function CrossEntityBanner() {
  const [visible, setVisible] = useState(false)
  const [entities, setEntities] = useState<EntityInfo[]>([])
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    function handleEntitySwitch(e: Event) {
      const detail = (e as CustomEvent).detail
      if (detail?.viewAll) {
        setVisible(true)
        setDismissed(false)
      } else {
        setVisible(false)
      }
    }

    window.addEventListener('entity-switch', handleEntitySwitch)
    return () => window.removeEventListener('entity-switch', handleEntitySwitch)
  }, [])

  // Fetch entities when visible
  useEffect(() => {
    if (!visible) return
    let cancelled = false

    async function fetchEntities() {
      try {
        // Try to get org ID from a cookie or known source
        const res = await fetch('/api/admin/organizations/entities?parentId=current')
        if (!res.ok) return
        const data = await res.json()
        if (cancelled) return
        if (data.entities) {
          setEntities(data.entities.filter((e: EntityInfo & { isParent: boolean }) => !e.isParent))
        }
      } catch {
        // Silently fail
      }
    }

    fetchEntities()
    return () => { cancelled = true }
  }, [visible])

  if (!visible || dismissed) return null

  const entityCountries = entities.length > 0
    ? entities.map(e => e.country).filter(Boolean)
    : []

  return (
    <div className="mb-4 flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-800">
      <Globe size={18} className="text-blue-500 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">
          Viewing consolidated data across {entities.length > 0 ? entities.length : 'all'} entities
        </p>
        {entityCountries.length > 0 && (
          <p className="text-xs text-blue-600 mt-0.5">
            {entityCountries.join(' \u2022 ')}
          </p>
        )}
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="text-blue-400 hover:text-blue-600 transition-colors p-1"
        title="Dismiss banner"
      >
        <X size={16} />
      </button>
    </div>
  )
}
