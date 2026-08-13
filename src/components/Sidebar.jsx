import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { getIcon } from '../lib/icons'
import { Home, X, ChevronDown, PanelLeftClose, PanelLeft, Star, Clock } from 'lucide-react'
import { useFavorites } from '../hooks/useFavorites'
import { useRecentTools } from '../hooks/useRecentTools'
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

/* Popular Tools slugs */
const POPULAR_SLUGS = [
  'pdf-to-word', 'compress-pdf', 'merge-pdf',
  'resize-image', 'jpg-to-pdf', 'age-calculator',
]

const COLLAPSED_KEY = 'sidebar_collapsed'
const EXPANDED_KEY = 'sidebar_expanded'

export default function Sidebar({ lang, t, isOpen, onClose }) {
  const { pathname } = useLocation()
  const isHome = pathname === '/'
  const dir = document.documentElement.getAttribute('dir') || 'ltr'
  const { favorites } = useFavorites()
  const { recent } = useRecentTools()

  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem(COLLAPSED_KEY) === 'true' } catch { return false }
  })

  const [expanded, setExpanded] = useState(() => {
    try { return localStorage.getItem(EXPANDED_KEY) } catch { return null }
  })

  useEffect(() => {
    try { localStorage.setItem(COLLAPSED_KEY, String(collapsed)) } catch {}
  }, [collapsed])

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

  const toggleCollapse = () => {
    setCollapsed(prev => {
      const next = !prev
      if (next) setExpanded(null)
      return next
    })
  }

  const toggleCategory = (catId) => {
    if (collapsed) return
    setExpanded(prev => (prev === catId ? null : catId))
  }

  const widthClass = collapsed ? 'w-[72px]' : 'w-[240px]'

  const popularTools = POPULAR_SLUGS
    .map(slug => tools.find(t => t.slug === slug))
    .filter(Boolean)

  const favTools = favorites
    .map(slug => tools.find(to => to.slug === slug))
    .filter(Boolean)
    .slice(0, 5)

  const recentTools = recent
    .map(item => tools.find(to => to.slug === item.slug))
    .filter(Boolean)
    .slice(0, 5)

  const popularLabel = lang === 'ar' ? 'أدوات شائعة' : lang === 'fr' ? 'Populaires' : 'Popular'
  const categoriesLabel = t.nav.categories
  const favLabel = lang === 'ar' ? 'المفضلة' : lang === 'fr' ? 'Favoris' : 'Favorites'
  const recentLabel = lang === 'ar' ? 'الأخيرة' : lang === 'fr' ? 'Récents' : 'Recent'
  const collapseLabel = collapsed ? (lang === 'ar' ? 'توسيع' : lang === 'fr' ? 'Développer' : 'Expand') : (lang === 'ar' ? 'طي' : lang === 'fr' ? 'Réduire' : 'Collapse')
  const noFavLabel = lang === 'ar' ? 'لا توجد مفضلات' : lang === 'fr' ? 'Aucun favori' : 'No favorites yet'
  const noRecentLabel = lang === 'ar' ? 'ستظهر هنا أدواتك الأخيرة' : lang === 'fr' ? 'Vos outils récents apparaîtront ici' : 'Your recent tools will appear here'

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden animate-fade-in"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          ${widthClass}
          fixed top-14 h-[calc(100vh-3.5rem)] z-30
          bg-white dark:bg-[#0A0A0B]
          ${dir === 'rtl' ? 'border-s' : 'border-e'} border-[#E5E7EB] dark:border-[#27272A]
          flex flex-col
          transition-all duration-300 ease-in-out
          ${dir === 'rtl' ? 'end-0' : 'start-0'}
          ${isOpen ? 'translate-x-0' : dir === 'rtl' ? 'translate-x-full lg:translate-x-0' : '-translate-x-full lg:translate-x-0'}
          lg:sticky lg:top-14 lg:h-[calc(100vh-3.5rem)] lg:flex
        `}
      >
        {/* Mobile header */}
        <div className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-[#E5E7EB] dark:border-[#27272A] shrink-0">
          <span className="text-sm font-semibold text-[#111111] dark:text-[#FAFAFA]">SmartTools</span>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#F7F8FA] dark:hover:bg-[#18181B] transition-colors">
            <X className="w-4 h-4 text-[#6B7280] dark:text-[#A1A1AA]" />
          </button>
        </div>

        {/* Desktop collapse button */}
        <div className="hidden lg:flex items-center justify-end px-3 py-2 shrink-0">
          <button
            onClick={toggleCollapse}
            className="p-1.5 rounded-lg text-[#6B7280] dark:text-[#A1A1AA] hover:bg-[#F7F8FA] dark:hover:bg-[#18181B] transition-colors"
            aria-label="Toggle sidebar"
            title={collapseLabel}
          >
            {collapsed ? <PanelLeft className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
          </button>
        </div>

        {/* Scrollable nav */}
        <nav className="flex-1 overflow-y-auto px-2 py-1 space-y-0.5 sidebar-scroll">
          {/* Home */}
          <Link
            to="/"
            onClick={onClose}
            className={`sidebar-link ${isHome ? 'active' : ''} ${collapsed ? 'justify-center !px-0 !py-2.5' : ''}`}
            title={collapsed ? t.nav.home : ''}
          >
            <Home className="w-4 h-4 shrink-0" strokeWidth={1.8} />
            {!collapsed && <span className="text-[13px]">{t.nav.home}</span>}
          </Link>

          {/* ── Favorites section ── */}
          {!collapsed && favTools.length > 0 && (
            <div className="pt-4 pb-1 px-3">
              <Link to="/favorites" className="text-[10px] font-bold uppercase tracking-widest text-[#6B7280] dark:text-[#A1A1AA] flex items-center gap-1.5 hover:text-blue-600 transition-colors">
                <Star className="w-3 h-3 text-blue-600" fill="currentColor" />
                {favLabel}
              </Link>
            </div>
          )}
          {collapsed && favTools.length > 0 && <div className="pt-3" />}
          {favTools.map(tool => {
            const ToolIcon = getIcon(tool.icon)
            const isActive = pathname === `/tools/${tool.slug}`
            return (
              <Link
                key={tool.id}
                to={`/tools/${tool.slug}`}
                onClick={onClose}
                className={`sidebar-link ${isActive ? 'active' : ''} ${collapsed ? 'justify-center !px-0 !py-2.5' : ''} relative group`}
                title={collapsed ? tool.name[lang] : ''}
              >
                <ToolIcon className="w-4 h-4 shrink-0" strokeWidth={1.8} />
                {!collapsed && <span className="flex-1 truncate text-[13px]">{tool.name[lang]}</span>}
                {!collapsed && <Star className="w-2.5 h-2.5 text-blue-600 dark:text-blue-500 shrink-0" fill="currentColor" />}

                {collapsed && (
                  <div className="absolute start-full ms-2 top-1/2 -translate-y-1/2 z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-[#111113] text-[#FAFAFA] dark:bg-[#18181B] text-xs font-medium px-2.5 py-1.5 rounded-lg whitespace-nowrap shadow-card-lg">
                      {tool.name[lang]}
                    </div>
                  </div>
                )}
              </Link>
            )
          })}
          {!collapsed && favTools.length === 0 && (
            <div className="pt-4 pb-1 px-3">
              <Link to="/favorites" className="text-[10px] font-bold uppercase tracking-widest text-[#6B7280] dark:text-[#A1A1AA] flex items-center gap-1.5 hover:text-blue-600 transition-colors">
                <Star className="w-3 h-3" />
                {favLabel}
              </Link>
            </div>
          )}

          {/* ── Recent section ── */}
          {!collapsed && recentTools.length > 0 && (
            <div className="pt-4 pb-1 px-3">
              <Link to="/recent" className="text-[10px] font-bold uppercase tracking-widest text-[#6B7280] dark:text-[#A1A1AA] flex items-center gap-1.5 hover:text-blue-600 transition-colors">
                <Clock className="w-3 h-3 text-blue-600" />
                {recentLabel}
              </Link>
            </div>
          )}
          {collapsed && recentTools.length > 0 && <div className="pt-3" />}
          {recentTools.map(tool => {
            const ToolIcon = getIcon(tool.icon)
            const isActive = pathname === `/tools/${tool.slug}`
            return (
              <Link
                key={tool.id}
                to={`/tools/${tool.slug}`}
                onClick={onClose}
                className={`sidebar-link ${isActive ? 'active' : ''} ${collapsed ? 'justify-center !px-0 !py-2.5' : ''} relative group`}
                title={collapsed ? tool.name[lang] : ''}
              >
                <ToolIcon className="w-4 h-4 shrink-0" strokeWidth={1.8} />
                {!collapsed && <span className="flex-1 truncate text-[13px]">{tool.name[lang]}</span>}

                {collapsed && (
                  <div className="absolute start-full ms-2 top-1/2 -translate-y-1/2 z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-[#111113] text-[#FAFAFA] dark:bg-[#18181B] text-xs font-medium px-2.5 py-1.5 rounded-lg whitespace-nowrap shadow-card-lg">
                      {tool.name[lang]}
                    </div>
                  </div>
                )}
              </Link>
            )
          })}

          {/* Popular Tools */}
          {!collapsed && (
            <div className="pt-4 pb-1 px-3">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#6B7280] dark:text-[#A1A1AA] flex items-center gap-1.5">
                <Star className="w-3 h-3 text-blue-600" fill="currentColor" />
                {popularLabel}
              </span>
            </div>
          )}
          {collapsed && <div className="pt-3" />}

          {popularTools.map(tool => {
            const ToolIcon = getIcon(tool.icon)
            const isActive = pathname === `/tools/${tool.slug}`
            return (
              <Link
                key={tool.id}
                to={`/tools/${tool.slug}`}
                onClick={onClose}
                className={`sidebar-link ${isActive ? 'active' : ''} ${collapsed ? 'justify-center !px-0 !py-2.5' : ''} relative group`}
                title={collapsed ? tool.name[lang] : ''}
              >
                <ToolIcon className="w-4 h-4 shrink-0" strokeWidth={1.8} />
                {!collapsed && <span className="flex-1 truncate text-[13px]">{tool.name[lang]}</span>}
                {!collapsed && <Star className="w-2.5 h-2.5 text-blue-600 dark:text-blue-500 shrink-0" fill="currentColor" />}

                {collapsed && (
                  <div className="absolute start-full ms-2 top-1/2 -translate-y-1/2 z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-[#111113] text-[#FAFAFA] dark:bg-[#18181B] text-xs font-medium px-2.5 py-1.5 rounded-lg whitespace-nowrap shadow-card-lg">
                      {tool.name[lang]}
                    </div>
                  </div>
                )}
              </Link>
            )
          })}

          {/* Categories */}
          {!collapsed && (
            <div className="pt-4 pb-1 px-3">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#6B7280] dark:text-[#A1A1AA]">
                {categoriesLabel}
              </span>
            </div>
          )}
          {collapsed && <div className="pt-3" />}

          {categories.map(cat => {
            const Icon = getIcon(cat.icon)
            const isActive = pathname === `/categories/${cat.slug}`
            const isExpanded = expanded === cat.id
            const catTools = tools.filter(to => to.categoryId === cat.id)

            return (
              <div key={cat.id} className="relative group">
                <button
                  onClick={() => toggleCategory(cat.id)}
                  className={`sidebar-link ${isActive ? 'active' : ''} w-full text-start ${collapsed ? 'justify-center !px-0 !py-2.5' : ''}`}
                  title={collapsed ? cat.name[lang] : ''}
                >
                  <Icon className="w-4 h-4 shrink-0" strokeWidth={1.8} />
                  {!collapsed && (
                    <>
                      <span className="flex-1 truncate text-[13px]">{cat.name[lang]}</span>
                      <span className="text-[10px] text-[#6B7280] dark:text-[#A1A1AA] shrink-0 tabular-nums">{catTools.length}</span>
                      <ChevronDown className={`w-3 h-3 shrink-0 text-[#6B7280] dark:text-[#A1A1AA] transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                    </>
                  )}
                </button>

                {collapsed && (
                  <div className="absolute start-full ms-2 top-1/2 -translate-y-1/2 z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-[#111113] text-[#FAFAFA] dark:bg-[#18181B] text-xs font-medium px-2.5 py-1.5 rounded-lg whitespace-nowrap shadow-card-lg">
                      {cat.name[lang]} ({catTools.length})
                    </div>
                  </div>
                )}

                {!collapsed && (
                  <div
                    className="overflow-hidden transition-all duration-300 ease-in-out"
                    style={{ maxHeight: isExpanded ? '800px' : '0px', opacity: isExpanded ? 1 : 0 }}
                  >
                    <ul className="mt-0.5 mb-1 space-y-0.5">
                      {catTools.length > 0 ? (
                        catTools.map(tool => {
                          const ToolIcon = getIcon(tool.icon)
                          const toolActive = pathname === `/tools/${tool.slug}`
                          return (
                            <li key={tool.id}>
                              <Link
                                to={`/tools/${tool.slug}`}
                                onClick={onClose}
                                className={`group flex items-center gap-2.5 ps-9 pe-3 py-2 rounded-lg text-[12px] transition-colors ${toolActive ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 font-medium' : 'text-[#6B7280] dark:text-[#A1A1AA] hover:bg-[#F7F8FA] dark:hover:bg-[#18181B] hover:text-[#111111] dark:hover:text-[#FAFAFA]'}`}
                              >
                                <ToolIcon className="w-3.5 h-3.5 shrink-0 opacity-60 group-hover:opacity-100 transition-opacity" strokeWidth={1.8} />
                                <span className="truncate">{tool.name[lang]}</span>
                                {isNew(tool) && <span className="badge-new shrink-0">NEW</span>}
                              </Link>
                            </li>
                          )
                        })
                      ) : (
                        <li className="ps-9 py-2 text-[11px] text-[#6B7280] dark:text-[#A1A1AA]">{t.category.noTools}</li>
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
