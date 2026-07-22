import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, Sun, Moon, X, Menu, Zap, ChevronDown } from 'lucide-react'

const LANG_META = {
  en: { label: 'EN', flag: '🇬🇧', full: 'English' },
  fr: { label: 'FR', flag: '🇫🇷', full: 'Français' },
  ar: { label: 'AR', flag: '🇸🇦', full: 'العربية' },
}

export default function Navbar({ theme, toggleTheme, lang, setLang, langs, t, onMenuToggle }) {
  const [query, setQuery] = useState('')
  const [searchFocus, setSearchFocus] = useState(false)
  const [langOpen, setLangOpen] = useState(false)
  const navigate = useNavigate()
  const langRef = useRef(null)

  useEffect(() => {
    const handler = (e) => { if (langRef.current && !langRef.current.contains(e.target)) setLangOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    if (query.trim()) { navigate(`/search?q=${encodeURIComponent(query.trim())}`); setQuery('') }
  }

  return (
    <header className="sticky top-0 z-40 h-16 bg-white/95 dark:bg-gray-950/95 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 flex items-center">
      <div className="w-full px-4 flex items-center gap-3">

        {/* Mobile hamburger */}
        <button onClick={onMenuToggle} className="lg:hidden btn-ghost p-2 rounded-xl" aria-label="Menu">
          <Menu className="w-5 h-5" />
        </button>

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center shadow-sm">
            <Zap className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <span className="font-bold text-[17px] tracking-tight hidden sm:block text-gray-900 dark:text-white">
            Smart<span className="text-blue-600">Tools</span>
          </span>
        </Link>

        {/* Search bar — center */}
        <form onSubmit={handleSearch} className="flex-1 max-w-xl mx-auto">
          <div className={`relative flex items-center h-10 rounded-xl border-2 transition-all duration-200 bg-gray-50 dark:bg-gray-900 ${searchFocus ? 'border-blue-500 bg-white dark:bg-gray-800 shadow-sm shadow-blue-500/10' : 'border-gray-200 dark:border-gray-700'}`}>
            <Search className="absolute start-3 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onFocus={() => setSearchFocus(true)}
              onBlur={() => setSearchFocus(false)}
              placeholder={t.nav.search}
              className="w-full h-full ps-9 pe-4 bg-transparent text-sm outline-none placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-white"
            />
            {query && (
              <button type="button" onClick={() => setQuery('')} className="absolute end-3 text-gray-400 hover:text-gray-600">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </form>

        {/* Right actions */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Lang switcher */}
          <div className="relative" ref={langRef}>
            <button
              onClick={() => setLangOpen(!langOpen)}
              className="btn-ghost px-3 py-2 rounded-xl flex items-center gap-1.5 text-sm font-medium"
            >
              <span className="text-base leading-none">{LANG_META[lang].flag}</span>
              <span className="hidden sm:block">{LANG_META[lang].label}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${langOpen ? 'rotate-180' : ''}`} />
            </button>
            {langOpen && (
              <div className="absolute end-0 top-full mt-2 w-40 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-card-lg overflow-hidden py-1 animate-fade-in">
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
  )
}
