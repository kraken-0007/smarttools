import { useSEO } from '../lib/seo'
import { useMemo, useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search } from 'lucide-react'
import tools from '../data/tools.json'
import categories from '../data/categories.json'
import ToolCard from '../components/ToolCard'
import { ToolGridSkeleton } from '../components/Skeletons'

/**
 * Search across title, description, and category name.
 */
function searchTools(allTools, query, lang, catMap) {
  if (!query.trim()) return allTools
  const q = query.toLowerCase().trim()
  return allTools.filter(t => {
    const title = t.name[lang]?.toLowerCase() || ''
    const desc = t.description[lang]?.toLowerCase() || ''
    const cat = catMap[t.categoryId]?.name[lang]?.toLowerCase() || ''
    const catDesc = catMap[t.categoryId]?.description[lang]?.toLowerCase() || ''
    return title.includes(q) || desc.includes(q) || cat.includes(q) || catDesc.includes(q)
  })
}

export default function SearchPage({ lang, t }) {
  const [params, setParams] = useSearchParams()
  const query = params.get('q') || ''
  const [input, setInput] = useState(query)
  const [loading, setLoading] = useState(true)

  // SEO
  useSEO({
    title: query
      ? (lang === 'ar' ? `البحث: ${query}` : lang === 'fr' ? `Recherche: ${query}` : `Search: ${query}`)
      : t.search.title,
    description: lang === 'ar'
      ? 'ابحث عن أدوات SmartTools بالعنوان أو الوصف أو الفئة.'
      : lang === 'fr'
      ? 'Recherchez des outils par titre, description ou catégorie.'
      : 'Search SmartTools by title, description or category.',
    canonical: '/search',
  })

  const catMap = useMemo(() => Object.fromEntries(categories.map(c => [c.id, c])), [])

  const results = useMemo(() => searchTools(tools, query, lang, catMap), [query, lang, catMap])

  // Simulate brief loading on query change
  useEffect(() => {
    setLoading(true)
    const timer = setTimeout(() => setLoading(false), 300)
    return () => clearTimeout(timer)
  }, [query])

  // Sync input when URL changes
  useEffect(() => {
    setInput(query)
  }, [query])

  const handleSubmit = (e) => {
    e.preventDefault()
    const q = input.trim()
    if (q) setParams({ q })
    else setParams({})
  }

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8 animate-fade-in">
      {/* Search bar */}
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="relative flex items-center h-12 md:h-14 rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus-within:border-blue-500 transition-all duration-200">
          <Search className="absolute start-4 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={lang === 'ar' ? 'ابحث بالعنوان أو الوصف أو الفئة…' : lang === 'fr' ? 'Rechercher par titre, description ou catégorie…' : 'Search by title, description or category…'}
            className="w-full h-full ps-12 pe-4 bg-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none text-sm md:text-base"
            autoFocus
          />
        </div>
      </form>

      {/* Results header */}
      <h1 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-4 md:mb-6">
        {query ? (
          <span className="text-gray-500 dark:text-gray-400 font-normal">
            {loading ? '…' : `${results.length} ${t.search.results} `}"{query}"
          </span>
        ) : t.search.title}
      </h1>

      {/* Results */}
      {loading ? (
        <ToolGridSkeleton count={6} />
      ) : results.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {results.map(tool => (
            <ToolCard key={tool.id} tool={tool} lang={lang} t={t} category={catMap[tool.categoryId]} showNewBadge={false} />
          ))}
        </div>
      ) : query ? (
        <div className="py-20 md:py-24 text-center">
          <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-5">
            <Search className="w-6 h-6 md:w-7 md:h-7 text-gray-400" />
          </div>
          <h2 className="text-base md:text-lg font-bold text-gray-900 dark:text-white mb-2">
            {t.search.noResults} "{query}"
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t.search.hint}</p>
        </div>
      ) : (
        <div className="py-20 md:py-24 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">{t.search.hint}</p>
        </div>
      )}
    </div>
  )
}
