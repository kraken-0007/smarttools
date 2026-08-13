/**
 * useRecentTools — tracks recently opened tools in localStorage.
 * Stores array of { slug, visitedAt } in `smarttools_recent_tools`.
 * Max 10 entries. Updates timestamp if tool already exists.
 */
import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'smarttools_recent_tools'
const MAX_RECENT = 10

function readRecent() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(item => item && typeof item.slug === 'string' && typeof item.visitedAt === 'number')
  } catch {
    return []
  }
}

export function useRecentTools() {
  const [recent, setRecent] = useState(readRecent)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(recent))
    } catch {}
  }, [recent])

  useEffect(() => {
    const handler = (e) => {
      if (e.key === STORAGE_KEY) setRecent(readRecent())
    }
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
  }, [])

  const addRecent = useCallback((slug) => {
    setRecent(prev => {
      const filtered = prev.filter(item => item.slug !== slug)
      return [{ slug, visitedAt: Date.now() }, ...filtered].slice(0, MAX_RECENT)
    })
  }, [])

  const removeRecent = useCallback((slug) => {
    setRecent(prev => prev.filter(item => item.slug !== slug))
  }, [])

  const clearRecent = useCallback(() => {
    setRecent([])
  }, [])

  return { recent, addRecent, removeRecent, clearRecent }
}
