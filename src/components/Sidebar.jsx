import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { getIcon } from '../lib/icons'
import { Home, X, ChevronDown } from 'lucide-react'
import categories from '../data/categories.json'
import tools from '../data/tools.json'

export default function Sidebar({ lang, t, isOpen, onClose }) {
  const { pathname } = useLocation()
  const isHome = pathname === '/'
  const [expanded, setExpanded] = useState(null)

  const dir = document.documentElement.getAttribute('dir') || 'ltr'

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed top-16 h-[calc(100vh-4rem)] z-30 w-64
          bg-white dark:bg-gray-950
          ${dir === 'rtl' ? 'border-s' : 'border-e'} border-gray-100 dark:border-gray-800
          flex flex-col
          transition-transform duration-300 ease-in-out
          ${dir === 'rtl' ? 'end-0' : 'start-0'}
          ${isOpen ? 'translate-x-0' : dir === 'rtl' ? 'translate-x-full lg:translate-x-0' : '-translate-x-full lg:translate-x-0'}
          lg:sticky lg:top-16 lg:h-[calc(100vh-4rem)] lg:flex
        `}
      >
        {/* Mobile header */}
        <div className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t.nav.categories}</span>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
          <Link
            to="/"
            onClick={onClose}
            className={`sidebar-link ${isHome ? 'active' : ''}`}
          >
            <Home className="w-4 h-4 shrink-0" />
            <span className="text-sm">{t.nav.home}</span>
          </Link>

          <div className="pt-4 pb-1 px-3">
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-600">
              {t.nav.categories}
            </span>
          </div>

          {categories.map(cat => {
            const Icon = getIcon(cat.icon)
            const isActive = pathname === `/categories/${cat.slug}`
            const isExpanded = expanded === cat.id
            const catTools = tools.filter(to => to.categoryId === cat.id)

            return (
              <div key={cat.id}>
                <button
                  onClick={() => setExpanded(isExpanded ? null : cat.id)}
                  className={`sidebar-link ${isActive ? 'active' : ''}`}
                >
                  <Icon className="w-4 h-4 shrink-0" strokeWidth={1.8} />
                  <span className="flex-1 truncate text-sm">{cat.name[lang]}</span>
                  <ChevronDown className={`w-3.5 h-3.5 shrink-0 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </button>

                {isExpanded && (
                  <ul className="mt-0.5 mb-1 space-y-0.5 animate-fade-in">
                    {catTools.length > 0 ? (
                      catTools.map(tool => {
                        const ToolIcon = getIcon(tool.icon)
                        return (
                          <li key={tool.id}>
                            <Link
                              to={`/tools/${tool.slug}`}
                              onClick={onClose}
                              className="flex items-center gap-2.5 ps-9 pe-3 py-2 rounded-lg text-[13px] text-gray-600 dark:text-gray-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                            >
                              <ToolIcon className="w-3.5 h-3.5 shrink-0" strokeWidth={1.8} />
                              <span className="truncate">{tool.name[lang]}</span>
                            </Link>
                          </li>
                        )
                      })
                    ) : (
                      <li className="ps-9 pe-3 py-2 text-[12px] text-gray-400">{t.category.noTools}</li>
                    )}
                  </ul>
                )}
              </div>
            )
          })}
        </nav>

        <div className="p-3 border-t border-gray-100 dark:border-gray-800 shrink-0">
          <div className="rounded-xl bg-gradient-to-br from-blue-600 to-blue-500 p-4 text-white">
            <p className="text-xs font-bold mb-0.5 opacity-90">SmartTools</p>
            <p className="text-[11px] opacity-70 leading-relaxed">
              {lang === 'ar' ? 'مجاني دائماً · بدون إعلانات' : lang === 'fr' ? 'Toujours gratuit · Sans pub' : 'Always free · No ads'}
            </p>
          </div>
        </div>
      </aside>
    </>
  )
}
