import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { getIcon } from '../lib/icons'
import { Home, X, ChevronDown } from 'lucide-react'
import categories from '../data/categories.json'
import tools from '../data/tools.json'
import logo from '../assets/logo.png'

export default function Sidebar({ lang, t, isOpen, onClose }) {
  const { pathname } = useLocation()
  const isHome = pathname === '/'
  const [expanded, setExpanded] = useState(null)
  const dir = document.documentElement.getAttribute('dir') || 'ltr'

  const toggleCategory = (catId) => {
    setExpanded(expanded === catId ? null : catId)
  }

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed top-16 h-[calc(100vh-4rem)] z-30 w-72
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
          <div className="flex items-center gap-2">
            <img src={logo} alt="SmartTools" className="w-6 h-6 object-contain" />
            <span className="text-sm font-semibold text-gray-900 dark:text-white">SmartTools</span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5 sidebar-scroll">
          {/* Home link */}
          <Link
            to="/"
            onClick={onClose}
            className={`sidebar-link ${isHome ? 'active' : ''}`}
          >
            <Home className="w-4 h-4 shrink-0" />
            <span className="text-sm">{t.nav.home}</span>
          </Link>

          {/* Categories label */}
          <div className="pt-5 pb-1 px-3">
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-600">
              {t.nav.categories}
            </span>
          </div>

          {/* Expandable categories */}
          {categories.map(cat => {
            const Icon = getIcon(cat.icon)
            const isActive = pathname === `/categories/${cat.slug}`
            const isExpanded = expanded === cat.id
            const catTools = tools.filter(to => to.categoryId === cat.id)

            return (
              <div key={cat.id}>
                {/* Category header button */}
                <button
                  onClick={() => toggleCategory(cat.id)}
                  className={`sidebar-link ${isActive ? 'active' : ''} w-full text-start`}
                >
                  <Icon className="w-4 h-4 shrink-0" strokeWidth={1.8} />
                  <span className="flex-1 truncate text-sm">{cat.name[lang]}</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 shrink-0 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                  />
                </button>

                {/* Accordion tools list */}
                {isExpanded && (
                  <ul className="mt-0.5 mb-1 space-y-0.5 overflow-hidden">
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
                              <span className="truncate">{tool.name[lang]}</span>
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
                )}
              </div>
            )
          })}
        </nav>

        {/* Bottom promo card */}
        <div className="p-3 border-t border-gray-100 dark:border-gray-800 shrink-0">
          <div className="rounded-xl bg-gradient-to-br from-blue-600 to-blue-500 p-4 text-white flex items-center gap-3">
            <img src={logo} alt="SmartTools" className="w-9 h-9 object-contain rounded-lg bg-white/20 p-1" />
            <div>
              <p className="text-xs font-bold leading-snug">SmartTools</p>
              <p className="text-[11px] opacity-70 leading-relaxed">
                {lang === 'ar' ? 'مجاني · بدون إعلانات' : lang === 'fr' ? 'Gratuit · Sans pub' : 'Free · No ads'}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
