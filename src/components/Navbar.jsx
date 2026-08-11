import { useState, useRef, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, Sun, Moon, Menu, ChevronDown, Check } from 'lucide-react'
import { getIcon } from '../lib/icons'
import logo from '../assets/logo.png'
import tools from '../data/tools.json'
import categories from '../data/categories.json'

const LANG_META = {
  en: { label: 'EN', full: 'English' },
  fr: { label: 'FR', full: 'Français' },
  ar: { label: 'AR', full: 'العربية' },
}

/* ─── Search Modal ─────────────────────────────── */
function SearchModal({ open, onClose, lang, t }) {
  const [query, setQuery] = useState('')
  const inputRef = useRef(null)
  const navigate = useNavigate()
  const catMap = useMemo(() => Object.fromEntries(categories.map(c => [c.id, c])), [])

  useEffect(() => {
    if (open) {
      setQuery('')
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

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

  const searchLabels = {
    en: { placeholder: 'Search for a tool…', noResults: 'No results found', hint: 'Search by title, description or category', nav: 'Navigate', open: 'Open' },
    fr: { placeholder: 'Rechercher un outil…', noResults: 'Aucun résultat', hint: 'Recherchez par titre, description ou catégorie', nav: 'Naviguer', open: 'Ouvrir' },
    ar: { placeholder: 'ابحث عن أداة…', noResults: 'لا توجد نتائج', hint: 'ابحث بالعنوان أو الوصف أو الفئة', nav: 'تصفح', open: 'فتح' },
  }[lang]

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] px-4 animate-fade-in">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-white dark:bg-[#111113] rounded-xl shadow-card-lg border border-[#E5E7EB] dark:border-[#27272A] overflow-hidden animate-scale-in">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-[#E5E7EB] dark:border-[#27272A]">
          <Search className="w-5 h-5 text-[#6B7280] dark:text-[#A1A1AA] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={searchLabels.placeholder}
            className="flex-1 bg-transparent text-base outline-none placeholder-gray-400 dark:placeholder-gray-500 text-[#111111] dark:text-[#FAFAFA]"
          />
          <kbd className="hidden sm:flex items-center px-2 py-0.5 rounded-md bg-[#F7F8FA] dark:bg-[#18181B] text-[10px] font-medium text-[#6B7280] dark:text-[#A1A1AA] shrink-0">
            ESC
          </kbd>
        </div>

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
                    className={`flex items-center gap-3 px-5 py-3 transition-colors ${i === activeIndex ? 'bg-blue-50 dark:bg-blue-950/30' : 'hover:bg-[#F7F8FA] dark:hover:bg-[#18181B]'}`}
                    onMouseEnter={() => setActiveIndex(i)}
                  >
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${cat?.bg || 'bg-blue-50 dark:bg-blue-950/30'}`}>
                      <Icon className={`w-4 h-4 ${cat?.text || 'text-blue-600 dark:text-blue-400'}`} strokeWidth={1.8} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#111111] dark:text-[#FAFAFA] truncate">{tool.name[lang]}</p>
                      <p className="text-xs text-[#6B7280] dark:text-[#A1A1AA] truncate">{cat?.name[lang]} · {tool.description[lang]}</p>
                    </div>
                  </Link>
                )
              })}
            </div>
          ) : (
            <div className="py-12 text-center">
              <p className="text-sm text-[#6B7280] dark:text-[#A1A1AA]">{searchLabels.noResults}</p>
            </div>
          )
        ) : (
          <div className="py-10 text-center">
            <p className="text-sm text-[#6B7280] dark:text-[#A1A1AA]">{searchLabels.hint}</p>
          </div>
        )}

        <div className="px-5 py-3 border-t border-[#E5E7EB] dark:border-[#27272A] flex items-center justify-between text-[11px] text-[#6B7280] dark:text-[#A1A1AA]">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-[#F7F8FA] dark:bg-[#18181B] font-medium">↑↓</kbd>
              {searchLabels.nav}
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-[#F7F8FA] dark:bg-[#18181B] font-medium">↵</kbd>
              {searchLabels.open}
            </span>
          </div>
          <span>{tools.length} {lang === 'ar' ? 'أداة' : 'tools'}</span>
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
      <header className="sticky top-0 z-40 h-14 bg-white/95 dark:bg-[#0A0A0B]/95 backdrop-blur-md border-b border-[#E5E7EB] dark:border-[#27272A] flex items-center">
        <div className="w-full px-3 sm:px-4 flex items-center gap-2">

          {/* Mobile hamburger */}
          <button onClick={onMenuToggle} className="lg:hidden p-2 rounded-lg text-[#6B7280] dark:text-[#A1A1AA] hover:bg-[#F7F8FA] dark:hover:bg-[#18181B] transition-colors" aria-label="Menu">
            <Menu className="w-5 h-5" />
          </button>

          {/* Desktop sidebar toggle */}
          <button
            onClick={onSidebarToggle}
            className="hidden lg:flex p-2 rounded-lg text-[#6B7280] dark:text-[#A1A1AA] hover:bg-[#F7F8FA] dark:hover:bg-[#18181B] transition-colors"
            aria-label="Toggle sidebar"
          >
            <Menu className="w-4 h-4" />
          </button>

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <img src={logo} alt="SmartTools" className="w-7 h-7 rounded-lg object-contain" />
            <span className="font-bold text-[15px] tracking-tight hidden sm:block text-[#111111] dark:text-[#FAFAFA]">
              Smart<span className="text-blue-600">Tools</span>
            </span>
          </Link>

          {/* Search trigger */}
          <button
            onClick={() => setSearchOpen(true)}
            className="ms-auto flex items-center gap-2 h-9 px-3 rounded-lg border border-[#E5E7EB] dark:border-[#27272A] bg-[#F7F8FA] dark:bg-[#18181B] text-sm text-[#6B7280] dark:text-[#A1A1AA] hover:border-blue-400 dark:hover:border-blue-600 transition-colors"
          >
            <Search className="w-4 h-4" />
            <span className="hidden sm:block text-[13px]">{t.nav.search}</span>
            <kbd className="hidden md:flex items-center px-1.5 py-0.5 rounded bg-white dark:bg-[#111113] text-[10px] font-medium text-[#6B7280] dark:text-[#A1A1AA] border border-[#E5E7EB] dark:border-[#27272A] ms-2">
              ⌘K
            </kbd>
          </button>

          {/* Right actions */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Language switcher — text labels only, no emoji flags */}
            <div className="relative" ref={langRef}>
              <button
                onClick={() => setLangOpen(!langOpen)}
                className="px-2.5 py-2 rounded-lg flex items-center gap-1.5 text-sm font-medium text-[#6B7280] dark:text-[#A1A1AA] hover:bg-[#F7F8FA] dark:hover:bg-[#18181B] transition-colors"
              >
                <span className="text-[13px] font-bold tracking-wide">{LANG_META[lang].label}</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${langOpen ? 'rotate-180' : ''}`} />
              </button>
              {langOpen && (
                <div className="absolute end-0 top-full mt-1.5 w-36 bg-white dark:bg-[#111113] border border-[#E5E7EB] dark:border-[#27272A] rounded-lg shadow-card-lg overflow-hidden py-1 z-50 animate-scale-in">
                  {langs.map(l => (
                    <button
                      key={l}
                      onClick={() => { setLang(l); setLangOpen(false) }}
                      className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 text-sm transition-colors ${l === lang ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 font-semibold' : 'text-[#111111] dark:text-[#FAFAFA] hover:bg-[#F7F8FA] dark:hover:bg-[#18181B]'}`}
                    >
                      <span>{LANG_META[l].full}</span>
                      {l === lang && <Check className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Theme toggle */}
            <button onClick={toggleTheme} className="p-2 rounded-lg text-[#6B7280] dark:text-[#A1A1AA] hover:bg-[#F7F8FA] dark:hover:bg-[#18181B] transition-colors" aria-label="Toggle theme">
              {theme === 'dark'
                ? <Sun className="w-4 h-4" />
                : <Moon className="w-4 h-4" />
              }
            </button>
          </div>
        </div>
      </header>

      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} lang={lang} t={t} />
    </>
  )
}
