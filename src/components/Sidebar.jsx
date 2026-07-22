import { Link, useLocation } from 'react-router-dom'
import { getIcon } from '../lib/icons'
import { Home, X } from 'lucide-react'
import categories from '../data/categories.json'

export default function Sidebar({ lang, t, isOpen, onClose }) {
  const { pathname } = useLocation()
  const isHome = pathname === '/'
  const isActive = (slug) => pathname === `/categories/${slug}`

  // For RTL we slide from right; for LTR from left
  const dir = document.documentElement.getAttribute('dir') || 'ltr'
  const closedTransform = dir === 'rtl' ? 'translateX(100%)' : 'translateX(-100%)'
  const openTransform = 'translateX(0)'

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        style={{
          transform: isOpen ? openTransform : undefined,
        }}
        className={`
          fixed top-16 h-[calc(100vh-4rem)] z-30 w-64
          bg-white dark:bg-gray-950
          border-e border-gray-100 dark:border-gray-800
          flex flex-col
          transition-transform duration-300 ease-in-out
          ${dir === 'rtl' ? 'end-0' : 'start-0'}
          ${isOpen ? '' : dir === 'rtl' ? 'translate-x-full' : '-translate-x-full'}
          lg:translate-x-0 lg:sticky lg:top-16 lg:h-[calc(100vh-4rem)]
        `}
      >
        {/* Mobile header */}
        <div className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t.nav.categories}</span>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav items */}
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
            const active = isActive(cat.slug)
            return (
              <Link
                key={cat.id}
                to={`/categories/${cat.slug}`}
                onClick={onClose}
                className={`sidebar-link ${active ? 'active' : ''}`}
              >
                <span className="text-base leading-none w-5 text-center shrink-0 select-none">{cat.emoji}</span>
                <span className="truncate text-sm">{cat.name[lang]}</span>
              </Link>
            )
          })}
        </nav>

        {/* Bottom card */}
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
