import { useState, useRef, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, Sun, Moon, X, Menu, ChevronDown } from 'lucide-react'
import { getIcon } from '../lib/icons'
import logo from '../assets/logo.png'
import tools from '../data/tools.json'
import categories from '../data/categories.json'

const LANG_META = {
  en: { label: 'EN', flag: '🇬🇧', full: 'English' },
  fr: { label: 'FR', flag: '🇫🇷', full: 'Français' },
  ar: { label: 'AR', flag: '🇸🇦', full: 'العربية' },
}

/* ─── Search Modal ─────────────────────────────── */
function SearchModal({ open, onClose, lang, t }) {
  const [query, setQuery] = useState('')
  const inputRef = useRef(null)
  const navigate = useNavigate()
  const catMap = useMemo(() => Object.fromEntries(categories.map(c => [c.id, c])), [])

  // Focus input when modal opens
  useEffect(() => {
    if (open) {
      setQuery('')
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  // Esc to close
  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  // Search across title, description, and category
  const results = useMemo(() => {
    if (!query.trim()) return []
    const q = query.toLowerCase().trim()
    return tools.filter(tool => {
      const title = tool.name[lang]?.toLowerCase() || ''
      const desc = tool.description[lang]?.toLowerCase() || ''
      const cat = catMap[tool.categoryId]?.name[lang]?.toLowerCase() || ''
      return title.includes(q) || desc.includes(q) || cat.includes(q)
    }).slice(0, 8)
  }, [query, lang, catMap])

  // Keyboard navigation
  const [activeIndex, setActiveIndex] = useState(0)
  useEffect(() => { setActiveIndex(0) }, [query])

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIndex(i => Math.min(i + 1, results.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIndex(i => Math.max(i - 1, 0)) }
    else if (e.key === 'Enter' && results[activeIndex]) {
      e.preventDefault()
      navigate(`/tools/${results[activeIndex].slug}`)
      onClose()
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4 animate-fade-in">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        {/* Search input */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <Search className="w-5 h-5 text-gray-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={lang === 'ar' ? 'ابحث عن أداة…' : lang === 'fr' ? 'Rechercher un outil…' : 'Search for a tool…'}
            className="flex-1 bg-transparent text-base outline-none placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-white"
          />
          <kbd className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-[10px] font-medium text-gray-400 shrink-0">
            ESC
          </kbd>
        </div>

        {/* Results */}
        {query.trim() ? (
          results.length > 0 ? (
            <div className="max-h-[50vh] overflow-y-auto py-2">
              {results.map((tool, i) => {
                const Icon = getIcon(tool.icon)
                const cat = catMap[tool.categoryId]
                return (
                  <Link
                    key={tool.id}
                    to={`/tools/${tool.slug}`}
                    onClick={onClose}
                    className={`flex items-center gap-3 px-5 py-3 transition-colors ${i === activeIndex ? 'bg-blue-50 dark:bg-blue-950/40' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'}`}
                    onMouseEnter={() => setActiveIndex(i)}
                  >
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${cat?.bg || 'bg-blue-50 dark:bg-blue-950/30'}`}>
                      <Icon className={`w-4.5 h-4.5 ${cat?.text || 'text-blue-600 dark:text-blue-400'}`} strokeWidth={1.8} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{tool.name[lang]}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{cat?.name[lang]}</p>
                    </div>
                  </Link>
                )
              })}
            </div>
          ) : (
            <div className="py-12 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {lang === 'ar' ? 'لا توجد نتائج' : lang === 'fr' ? 'Aucun résultat' : 'No results found'}
              </p>
            </div>
          )
        ) : (
          <div className="py-10 text-center">
            <p className="text-sm text-gray-400 dark:text-gray-500">
              {lang === 'ar' ? 'ابحث بالعنوان أو الوصف أو الفئة' : lang === 'fr' ? 'Recherchez par titre, description ou catégorie' : 'Search by title, description or category'}
            </p>
          </div>
        )}

        {/* Footer hint */}
        <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-[11px] text-gray-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 font-medium">↑↓</kbd>
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 font-medium">↵</kbd>
              Open
            </span>
          </div>
          <span>{tools.length} tools</span>
        </div>
      </div>
    </div>
  )
}

/* ─── Navbar ───────────────────────────────────── */
export default function Navbar({ theme, toggleTheme, lang, setLang, langs, t, onMenuToggle, onSidebarToggle }) {
  const [searchOpen, setSearchOpen] = useState(false)
  const [langOpen, setLangOpen] = useState(false)
  const langRef = useRef(null)

  // Keyboard shortcut: Cmd/Ctrl + K to open search
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(true)
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  useEffect(() => {
    const handler = (e) => { if (langRef.current && !langRef.current.contains(e.target)) setLangOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <>
      <header className="sticky top-0 z-40 h-16 bg-white/95 dark:bg-gray-950/95 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 flex items-center">
        <div className="w-full px-4 flex items-center gap-2 lg:gap-3">

          {/* Mobile hamburger */}
          <button onClick={onMenuToggle} className="lg:hidden btn-ghost p-2 rounded-xl" aria-label="Menu">
            <Menu className="w-5 h-5" />
          </button>

          {/* Desktop sidebar toggle */}
          <button
            onClick={onSidebarToggle}
            className="hidden lg:flex btn-ghost p-2 rounded-xl"
            aria-label="Toggle sidebar"
          >
            <Menu className="w-4.5 h-4.5" />
          </button>

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <img src={logo} alt="SmartTools" className="w-8 h-8 rounded-lg object-contain" />
            <span className="font-bold text-[17px] tracking-tight hidden sm:block text-gray-900 dark:text-white">
              Smart<span className="text-blue-600">Tools</span>
            </span>
          </Link>

          {/* Search trigger (opens modal) */}
          <button
            onClick={() => setSearchOpen(true)}
            className="ms-auto flex items-center gap-2 h-10 px-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm text-gray-400 dark:text-gray-500 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
          >
            <Search className="w-4 h-4" />
            <span className="hidden sm:block">{t.nav.search}</span>
            <kbd className="hidden md:flex items-center px-1.5 py-0.5 rounded-md bg-white dark:bg-gray-800 text-[10px] font-medium text-gray-400 border border-gray-200 dark:border-gray-700 ms-4">
              ⌘K
            </kbd>
          </button>

          {/* Right actions */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Lang switcher */}
            <div className="relative" ref={langRef}>
              <button
                onClick={() => setLangOpen(!langOpen)}
                className="btn-ghost px-2.5 py-2 rounded-xl flex items-center gap-1.5 text-sm font-medium"
              >
                <span className="text-base leading-none">{LANG_META[lang].flag}</span>
                <span className="hidden sm:block">{LANG_META[lang].label}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${langOpen ? 'rotate-180' : ''}`} />
              </button>
              {langOpen && (
                <div className="absolute end-0 top-full mt-2 w-40 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-lg overflow-hidden py-1 z-50">
                  {langs.map(l => (
                    <button
                      key={l}
                      onClick={() => { setLang(l); setLangOpen(false) }}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${l === lang ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-semibold' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                    >
                      <span className="text-base">{LANG_META[l].flag}</span>
                      <span>{LANG_META[l].full}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Theme toggle */}
            <button onClick={toggleTheme} className="btn-ghost p-2.5 rounded-xl" aria-label="Toggle theme">
              {theme === 'dark'
                ? <Sun className="w-4 h-4 text-amber-400" />
                : <Moon className="w-4 h-4" />
              }
            </button>
          </div>
        </div>
      </header>

      {/* Search Modal */}
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} lang={lang} t={t} />
    </>
  )
}
