import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Sun, Moon, Search, Menu, X, Zap } from 'lucide-react'
import { cn } from '../lib/utils'

const FLAG = { en: '🇬🇧', fr: '🇫🇷', ar: '🇲🇦' }
const LABEL = { en: 'EN', fr: 'FR', ar: 'AR' }

export default function Navbar({ theme, toggleTheme, lang, setLang, langs, t }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')
  const navigate = useNavigate()

  const handleSearch = (e) => {
    e.preventDefault()
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`)
      setQuery('')
      setSearchOpen(false)
    }
  }

  return (
    <header className="sticky top-0 z-50 border-b glass">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight">SmartTools</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600 dark:text-gray-300">
          <Link to="/" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">{t.nav.home}</Link>
          <Link to="/categories" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">{t.nav.categories}</Link>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Search */}
          {searchOpen ? (
            <form onSubmit={handleSearch} className="flex items-center gap-2">
              <input
                autoFocus
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder={t.hero.searchPlaceholder}
                className="w-48 md:w-64 px-3 py-1.5 text-sm rounded-lg border bg-white dark:bg-gray-900 dark:border-gray-700 outline-none focus:ring-2 focus:ring-brand-500"
              />
              <button type="button" onClick={() => setSearchOpen(false)} className="p-1.5 text-gray-500 hover:text-gray-900 dark:hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <button onClick={() => setSearchOpen(true)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" aria-label="Search">
              <Search className="w-4 h-4" />
            </button>
          )}

          {/* Theme */}
          <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" aria-label="Toggle theme">
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Language */}
          <div className="relative group">
            <button className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <span>{FLAG[lang]}</span>
              <span>{LABEL[lang]}</span>
            </button>
            <div className="absolute end-0 top-full mt-1 bg-white dark:bg-gray-900 border rounded-xl shadow-lg overflow-hidden hidden group-hover:block min-w-[100px]">
              {langs.map(l => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors',
                    lang === l ? 'text-brand-600 font-medium' : 'text-gray-700 dark:text-gray-300'
                  )}
                >
                  <span>{FLAG[l]}</span>
                  <span>{LABEL[l]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Mobile menu */}
          <button className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t bg-white dark:bg-gray-950 px-4 py-3 flex flex-col gap-3 text-sm font-medium">
          <Link to="/" onClick={() => setMenuOpen(false)} className="py-2 hover:text-brand-600">{t.nav.home}</Link>
          <Link to="/categories" onClick={() => setMenuOpen(false)} className="py-2 hover:text-brand-600">{t.nav.categories}</Link>
        </div>
      )}
    </header>
  )
}
