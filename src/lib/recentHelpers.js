/**
 * Recent tools helpers — read from localStorage without hooks.
 * Used by HomePage to show "Recently Used" section.
 */
export function getRecentToolSlugs(limit = 6) {
  try {
    const raw = localStorage.getItem('smarttools_recent_tools')
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter(item => item && typeof item.slug === 'string')
      .slice(0, limit)
      .map(item => item.slug)
  } catch {
    return []
  }
}
