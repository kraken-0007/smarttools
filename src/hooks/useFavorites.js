/**
 * useFavorites — localStorage-based favorites management.
 * Stores tool slugs in `smarttools_favorites` array.
 * Recovers gracefully from corrupted data.
 */
import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'smarttools_favorites'

function readFavorites() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function useFavorites() {
  const [favorites, setFavorites] = useState(readFavorites)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites))
    } catch {}
  }, [favorites])

  // Listen for cross-tab updates
  useEffect(() => {
    const handler = (e) => {
      if (e.key === STORAGE_KEY) setFavorites(readFavorites())
    }
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
  }, [])

  const isFavorite = useCallback((slug) => favorites.includes(slug), [favorites])

  const toggleFavorite = useCallback((slug) => {
    setFavorites(prev => prev.includes(slug) ? prev.filter(s => s !== slug) : [...prev, slug])
  }, [])

  const removeFavorite = useCallback((slug) => {
    setFavorites(prev => prev.filter(s => s !== slug))
  }, [])

  return { favorites, isFavorite, toggleFavorite, removeFavorite }
}
