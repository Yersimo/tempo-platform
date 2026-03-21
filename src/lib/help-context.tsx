'use client'

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'

interface HelpContextType {
  isHelpOpen: boolean
  currentModule: string | null
  currentTopic: string | null
  openHelp: (module?: string, topic?: string) => void
  closeHelp: () => void
  toggleHelp: () => void
  openTooltip: (id: string) => void
  closeTooltip: () => void
  activeTooltip: string | null
  setCurrentModule: (module: string | null) => void
}

const HelpContext = createContext<HelpContextType | null>(null)

export function HelpProvider({ children }: { children: ReactNode }) {
  const [isHelpOpen, setIsHelpOpen] = useState(false)
  const [currentModule, setCurrentModule] = useState<string | null>(null)
  const [currentTopic, setCurrentTopic] = useState<string | null>(null)
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null)

  const openHelp = useCallback((module?: string, topic?: string) => {
    if (module) setCurrentModule(module)
    if (topic) setCurrentTopic(topic)
    setIsHelpOpen(true)
  }, [])

  const closeHelp = useCallback(() => {
    setIsHelpOpen(false)
    setCurrentTopic(null)
  }, [])

  const toggleHelp = useCallback(() => {
    setIsHelpOpen(prev => !prev)
  }, [])

  const openTooltip = useCallback((id: string) => {
    setActiveTooltip(id)
  }, [])

  const closeTooltip = useCallback(() => {
    setActiveTooltip(null)
  }, [])

  // Keyboard shortcut: ? to toggle help (when not in an input field)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === '?' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const target = e.target as HTMLElement
        const tag = target.tagName.toLowerCase()
        if (tag === 'input' || tag === 'textarea' || tag === 'select' || target.isContentEditable) {
          return
        }
        e.preventDefault()
        toggleHelp()
      }
      if (e.key === 'Escape' && isHelpOpen) {
        closeHelp()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [toggleHelp, closeHelp, isHelpOpen])

  return (
    <HelpContext.Provider value={{
      isHelpOpen,
      currentModule,
      currentTopic,
      openHelp,
      closeHelp,
      toggleHelp,
      openTooltip,
      closeTooltip,
      activeTooltip,
      setCurrentModule,
    }}>
      {children}
    </HelpContext.Provider>
  )
}

export function useHelp(): HelpContextType {
  const context = useContext(HelpContext)
  if (!context) {
    throw new Error('useHelp must be used within a HelpProvider')
  }
  return context
}
