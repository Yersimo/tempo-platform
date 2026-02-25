'use client'

import { useState, useEffect, useCallback } from 'react'

export type Theme = 'light' | 'dark' | 'system'

const STORAGE_KEY = 'tempo_theme'

function getSystemPreference(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

function applyTheme(theme: Theme) {
  if (typeof document === 'undefined') return
  const isDark = theme === 'dark' || (theme === 'system' && getSystemPreference())
  document.documentElement.classList.toggle('dark', isDark)
}

function getStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'light'
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'light' || stored === 'dark' || stored === 'system') {
    return stored
  }
  return 'light'
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>('light')
  const [isDark, setIsDark] = useState(false)

  // Initialize from localStorage on mount
  useEffect(() => {
    const stored = getStoredTheme()
    setThemeState(stored)
    applyTheme(stored)
    setIsDark(stored === 'dark' || (stored === 'system' && getSystemPreference()))
  }, [])

  // Listen for system preference changes when in 'system' mode
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    const handleChange = () => {
      if (theme === 'system') {
        applyTheme('system')
        setIsDark(getSystemPreference())
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme])

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme)
    localStorage.setItem(STORAGE_KEY, newTheme)
    applyTheme(newTheme)
    setIsDark(newTheme === 'dark' || (newTheme === 'system' && getSystemPreference()))
  }, [])

  return { theme, setTheme, isDark } as const
}
