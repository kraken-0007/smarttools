import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { getIcon } from '../lib/icons'
import { Home, X, ChevronDown, PanelLeftClose, PanelLeft } from 'lucide-react'
import categories from '../data/categories.json'
import tools from '../data/tools.json'

/* ── NEW badge: show for 7 days after created_at ── */
function isNew(tool) {
  if (!tool.created_at) return false
  const created = new Date(tool.created_at)
  const now = new Date()
  const diff = (now - created) / (1000 * 60 * 60 * 24)
  return diff <= 7
}

const COLLAPSED_KEY = 'sidebar_collapsed'
const EXPANDED_KEY = 'sidebar_expanded'

export default function Sidebar({ lang, t, isOpen, onClose }) {
  const { pathname } = useLocation()
  const isHome = pathname === '/'
  const dir = document.documentElement.getAttribute('dir') || 'ltr'

  // Persist collapse state
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem(COLLAPSED_KEY) === 'true' } catch { return false }
  })

  // Persist expanded category
  const [expanded, setExpanded] = useState(() => {
    try { return localStorage.getItem(EXPANDED_KEY) } catch { return null }
  })

  useEffect(() => {
    try { localStorage.setItem(COLLAPSED_KEY, String(collapsed)) } catch {}
  }, [collapsed])

  // Listen for toggle event from Navbar (desktop)
  useEffect(() => {
    const handler = () => {
      setCollapsed(prev => {
        const next = !prev
        if (next) setExpanded(null)
        return next
      })
    }
    window.addEventListener('sidebar-toggle', handler)
    return () => window.removeEventListener('sidebar-toggle', handler)
  }, [])

  useEffect(() => {
    try {
      if (expanded) localStorage.setItem(EXPANDED_KEY, expanded)
      else localStorage.removeItem(EXPANDED_KEY)
    } catch {}
  }, [expanded])

  // Auto-expand when collapsed (can't show accordion tools when collapsed)
  const toggleCollapse = () => {
    setCollapsed(prev => {
      const next = !prev
      if (next) setExpanded(null) // collapse accordion when sidebar collapses
      return next
    })
  }

  const toggleCategory = (catId) => {
    if (collapsed) return // don't expand when collapsed
    setExpanded(prev => (prev === catId ? null : catId))
  }

  // Width classes
  const widthClass = collapsed ? 'w-[72px]' : 'w-[280px]'

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm lg:hidden animate-fade-in"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          ${widthClass}
          fixed top-16 h-[calc(100vh-4rem)] z-30
          bg-white dark:bg-gray-950
          ${dir === 'rtl' ? 'border-s' : 'border-e'} border-gray-100 dark:border-gray-800
          flex flex-col
          transition-all duration-300 ease-in-out
          ${dir === 'rtl' ? 'end-0' : 'start-0'}
          ${isOpen ? 'translate-x-0' : dir === 'rtl' ? 'translate-x-full lg:translate-x-0' : '-translate-x-full lg:translate-x-0'}
          lg:sticky lg:top-16 lg:h-[calc(100vh-4rem)] lg:flex
        `}
      >
        {/* Mobile header */}
        <div className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800 shrink-0">
          <span className="text-sm font-semibold text-gray-900 dark:text-white">SmartTools</span>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Desktop collapse button */}
        <div className="hidden lg:flex items-center justify-end px-3 py-2 shrink-0">
          <button
            onClick={toggleCollapse}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Toggle sidebar"
            title={collapsed ? (lang === 'ar' ? 'توسيع' : lang === 'fr' ? 'Développer' : 'Expand') : (lang === 'ar' ? 'طي' : lang === 'fr' ? 'Réduire' : 'Collapse')}
          >
            {collapsed
              ? <PanelLeft className="w-4 h-4" />
              : <PanelLeftClose className="w-4 h-4" />
            }
          </button>
        </div>

        {/* Scrollable nav */}
        <nav className="flex-1 overflow-y-auto px-2 py-1 space-y-0.5 sidebar-scroll">
          {/* Home link */}
          <Link
            to="/"
            onClick={onClose}
            className={`sidebar-link ${isHome ? 'active' : ''} ${collapsed ? 'justify-center !px-0 !py-2.5' : ''}`}
            title={collapsed ? t.nav.home : ''}
          >
            <Home className="w-4.5 h-4.5 shrink-0" strokeWidth={1.8} />
            {!collapsed && <span className="text-sm">{t.nav.home}</span>}
          </Link>

          {/* Categories label */}
          {!collapsed && (
            <div className="pt-4 pb-1 px-3">
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-600">
                {t.nav.categories}
              </span>
            </div>
          )}
          {collapsed && <div className="pt-3" />}

          {/* Expandable categories */}
          {categories.map(cat => {
            const Icon = getIcon(cat.icon)
            const isActive = pathname === `/categories/${cat.slug}`
            const isExpanded = expanded === cat.id
            const catTools = tools.filter(to => to.categoryId === cat.id)

            return (
              <div key={cat.id} className="relative group">
                {/* Category header button */}
                <button
                  onClick={() => toggleCategory(cat.id)}
                  className={`sidebar-link ${isActive ? 'active' : ''} w-full text-start ${collapsed ? 'justify-center !px-0 !py-2.5' : ''}`}
                  title={collapsed ? cat.name[lang] : ''}
                >
                  <Icon className="w-4.5 h-4.5 shrink-0" strokeWidth={1.8} />
                  {!collapsed && (
                    <>
                      <span className="flex-1 truncate text-sm">{cat.name[lang]}</span>
                      <span className="text-[10px] text-gray-400 dark:text-gray-600 shrink-0">{catTools.length}</span>
                      <ChevronDown
                        className={`w-3.5 h-3.5 shrink-0 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                      />
                    </>
                  )}
                </button>

                {/* Collapsed tooltip */}
                {collapsed && (
                  <div className="absolute start-full ms-2 top-1/2 -translate-y-1/2 z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-gray-900 dark:bg-gray-700 text-white text-xs font-medium px-2.5 py-1.5 rounded-lg whitespace-nowrap shadow-lg">
                      {cat.name[lang]}
                    </div>
                  </div>
                )}

                {/* Accordion tools list */}
                {!collapsed && (
                  <div
                    className="overflow-hidden transition-all duration-300 ease-in-out"
                    style={{ maxHeight: isExpanded ? '800px' : '0px', opacity: isExpanded ? 1 : 0 }}
                  >
                    <ul className="mt-0.5 mb-1 space-y-0.5">
                      {catTools.length > 0 ? (
                        catTools.map(tool => {
                          const ToolIcon = getIcon(tool.icon)
                          return (
                            <li key={tool.id}>
                              <Link
                                to={`/tools/${tool.slug}`}
                                onClick={onClose}
                                className="group flex items-center gap-2.5 ps-9 pe-3 py-2 rounded-lg text-[13px] text-gray-600 dark:text-gray-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                              >
                                <ToolIcon className="w-3.5 h-3.5 shrink-0 opacity-60 group-hover:opacity-100 transition-opacity" strokeWidth={1.8} />
                                <span className="truncate flex-1">{tool.name[lang]}</span>
                                {isNew(tool) && (
                                  <span className="shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-red-500 text-white leading-none">
                                    NEW
                                  </span>
                                )}
                              </Link>
                            </li>
                          )
                        })
                      ) : (
                        <li className="ps-9 pe-3 py-2 text-[12px] text-gray-400 italic">
                          {t.category.noTools || 'Coming soon'}
                        </li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            )
          })}
        </nav>
      </aside>
    </>
  )
}
