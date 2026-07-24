import { useEffect } from 'react'

/**
 * SEO Hook — sets document head meta tags dynamically.
 * Usage: useSEO({ title, description, canonical, ogImage, ogType })
 */
export function useSEO({ title, description, canonical, ogImage, ogType = 'website' }) {
  useEffect(() => {
    const SITE_NAME = 'SmartTools'
    const DEFAULT_OG = '/logo.png'

    // Title
    if (title) {
      document.title = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`
    }

    // Helper: update or create meta tag
    const setMeta = (selector, attr, content) => {
      let el = document.head.querySelector(selector)
      if (!el) {
        el = document.createElement('meta')
        const [name, val] = selector.replace(/[[\]"]/g, '').split('=')
        el.setAttribute(name.replace('meta', '').trim() || 'name', val)
        document.head.appendChild(el)
      }
      el.setAttribute(attr, content)
    }

    // Meta description
    if (description) {
      setMeta('meta[name="description"]', 'content', description)
    }

    // Canonical
    if (canonical) {
      let link = document.head.querySelector('link[rel="canonical"]')
      if (!link) {
        link = document.createElement('link')
        link.setAttribute('rel', 'canonical')
        document.head.appendChild(link)
      }
      link.setAttribute('href', canonical)
    }

    // Open Graph
    const img = ogImage || DEFAULT_OG
    setMeta('meta[property="og:title"]', 'content', title || SITE_NAME)
    setMeta('meta[property="og:description"]', 'content', description || '')
    setMeta('meta[property="og:type"]', 'content', ogType)
    setMeta('meta[property="og:image"]', 'content', img)

    // Twitter
    setMeta('meta[name="twitter:card"]', 'content', 'summary_large_image')
    setMeta('meta[name="twitter:title"]', 'content', title || SITE_NAME)
    setMeta('meta[name="twitter:description"]', 'content', description || '')
    setMeta('meta[name="twitter:image"]', 'content', img)

    // Cleanup: restore default title on unmount
    return () => {
      document.title = 'SmartTools - Free Online Tools'
    }
  }, [title, description, canonical, ogImage, ogType])
}

/**
 * Tool Usage Counter — tracks page views in localStorage.
 * Returns the current view count for a tool.
 */
export function useToolViews(toolSlug) {
  useEffect(() => {
    if (!toolSlug) return
    try {
      const key = `tool_views_${toolSlug}`
      const current = parseInt(localStorage.getItem(key) || '0', 10)
      localStorage.setItem(key, String(current + 1))
    } catch {}
  }, [toolSlug])

  if (!toolSlug) return 0
  try {
    return parseInt(localStorage.getItem(`tool_views_${toolSlug}`) || '0', 10)
  } catch {
    return 0
  }
}

/**
 * Get popular tools sorted by view count (from localStorage).
 */
export function getPopularTools(allTools, limit = 12) {
  const views = allTools.map(t => {
    try {
      return { tool: t, views: parseInt(localStorage.getItem(`tool_views_${t.slug}`) || '0', 10) }
    } catch {
      return { tool: t, views: 0 }
    }
  })
  // Sort by views desc, fallback to featured then created_at
  views.sort((a, b) => {
    if (b.views !== a.views) return b.views - a.views
    if (a.tool.featured && !b.tool.featured) return -1
    if (!a.tool.featured && b.tool.featured) return 1
    return 0
  })
  return views.slice(0, limit).map(v => v.tool)
}
