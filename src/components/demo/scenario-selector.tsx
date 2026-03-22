'use client'

import { useState, useCallback } from 'react'
import { useTempo } from '@/lib/store'
import { seedJourney, seedAllJourneys, JOURNEY_META, type JourneyKey } from '@/lib/demo/journey-scenarios'
import { Clapperboard, ChevronRight, Check, RotateCcw, X, Loader2 } from 'lucide-react'

const JOURNEY_KEYS: JourneyKey[] = [1, 2, 3, 4, 5, 6]

export function ScenarioSelector() {
  const store = useTempo()
  const [isOpen, setIsOpen] = useState(false)
  const [seeded, setSeeded] = useState<Set<JourneyKey>>(new Set())
  const [loading, setLoading] = useState<JourneyKey | 'all' | null>(null)

  const handleSeed = useCallback((key: JourneyKey) => {
    if (seeded.has(key)) return
    setLoading(key)
    // Use setTimeout to allow UI to update before heavy data seeding
    setTimeout(() => {
      try {
        seedJourney(store, key)
        setSeeded(prev => new Set(prev).add(key))
        store.addToast(`Journey ${key} data loaded — navigate to ${JOURNEY_META[key].startPage.replace('/', '')} to begin`, 'success')
      } catch (e) {
        console.error(`Failed to seed journey ${key}:`, e)
        store.addToast(`Failed to seed Journey ${key}`, 'error')
      }
      setLoading(null)
    }, 50)
  }, [store, seeded])

  const handleSeedAll = useCallback(() => {
    setLoading('all')
    setTimeout(() => {
      try {
        seedAllJourneys(store)
        setSeeded(new Set(JOURNEY_KEYS))
        store.addToast('All 6 journey scenarios loaded successfully', 'success')
      } catch (e) {
        console.error('Failed to seed all journeys:', e)
        store.addToast('Failed to seed all journeys', 'error')
      }
      setLoading(null)
    }, 50)
  }, [store])

  const handleReset = useCallback(() => {
    // Reset seeded state — actual data remains in store (page refresh clears it)
    setSeeded(new Set())
    store.addToast('Demo scenario state reset. Refresh the page to fully clear seeded data.', 'info')
  }, [store])

  return (
    <>
      {/* Floating trigger button */}
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className="fixed top-4 right-4 z-[9999] flex items-center gap-2 rounded-full bg-tempo-600 px-4 py-2 text-white text-sm font-medium shadow-lg hover:bg-tempo-700 transition-colors"
        aria-label="Open demo scenario selector"
      >
        <Clapperboard size={16} />
        <span className="hidden sm:inline">Demo Scenarios</span>
      </button>

      {/* Panel */}
      {isOpen && (
        <div className="fixed top-14 right-4 z-[9999] w-[380px] rounded-xl border border-border bg-white shadow-2xl animate-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <Clapperboard size={18} className="text-tempo-600" />
              <h3 className="text-sm font-semibold text-t1">Demo Scenarios</h3>
            </div>
            <button onClick={() => setIsOpen(false)} className="rounded-md p-1 hover:bg-gray-100 transition-colors">
              <X size={16} className="text-t3" />
            </button>
          </div>

          {/* Journey list */}
          <div className="max-h-[420px] overflow-y-auto p-2">
            {JOURNEY_KEYS.map(key => {
              const meta = JOURNEY_META[key]
              const isSeeded = seeded.has(key)
              const isLoading = loading === key || loading === 'all'

              return (
                <button
                  key={key}
                  onClick={() => handleSeed(key)}
                  disabled={isSeeded || isLoading}
                  className={`w-full flex items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors ${
                    isSeeded
                      ? 'bg-green-50 cursor-default'
                      : isLoading
                        ? 'bg-gray-50 cursor-wait'
                        : 'hover:bg-gray-50 cursor-pointer'
                  }`}
                >
                  {/* Status icon */}
                  <div className={`flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-full ${
                    isSeeded ? 'bg-green-100 text-green-600' : 'bg-tempo-50 text-tempo-600'
                  }`}>
                    {isSeeded ? (
                      <Check size={14} />
                    ) : isLoading ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <ChevronRight size={14} />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-t1">
                      Journey {key}: {meta.title}
                    </p>
                    <p className="text-xs text-t3 mt-0.5 truncate">
                      {meta.description}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Footer actions */}
          <div className="flex items-center gap-2 border-t border-border px-4 py-3">
            <button
              onClick={handleSeedAll}
              disabled={seeded.size === 6 || loading !== null}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-tempo-600 px-3 py-2 text-sm font-medium text-white hover:bg-tempo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading === 'all' ? <Loader2 size={14} className="animate-spin" /> : <Clapperboard size={14} />}
              Seed All
            </button>
            <button
              onClick={handleReset}
              disabled={seeded.size === 0 || loading !== null}
              className="flex items-center justify-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium text-t2 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <RotateCcw size={14} />
              Reset
            </button>
          </div>
        </div>
      )}
    </>
  )
}
