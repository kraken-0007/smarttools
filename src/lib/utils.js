import clsx from 'clsx'

export function cn(...args) {
  return clsx(...args)
}

export function getCategoryIcon(iconName) {
  return iconName
}

export function getToolsByCategory(tools, categoryId) {
  return tools.filter(t => t.categoryId === categoryId)
}

export function searchTools(tools, query, lang) {
  if (!query.trim()) return tools
  const q = query.toLowerCase()
  return tools.filter(t =>
    t.name[lang]?.toLowerCase().includes(q) ||
    t.description[lang]?.toLowerCase().includes(q)
  )
}
