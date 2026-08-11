import { useSEO } from '../lib/seo'
import { useMemo, useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search } from 'lucide-react'
import tools from '../data/tools.json'
import categories from '../data/categories.json'
import ToolCard from '../components/ToolCard'
import { ToolGridSkeleton } from '../components/Skeletons'

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

  useEffect(() => {
    setLoading(true)
    const timer = setTimeout(() => setLoading(false), 300)
    return () => clearTimeout(timer)
  }, [query])

  useEffect(() => { setInput(query) }, [query])

  const handleSubmit = (e) => {
    e.preventDefault()
    const q = input.trim()
    if (q) setParams({ q })
    else setParams({})
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 md:py-8 animate-fade-in">
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="relative flex items-center h-11 rounded-lg border border-[#E5E7EB] dark:border-[#27272A] bg-white dark:bg-[#111113] focus-within:border-blue-500 transition-all duration-200">
          <Search className="absolute start-3.5 w-4 h-4 text-[#6B7280] dark:text-[#A1A1AA]" />
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={lang === 'ar' ? 'ابحث بالعنوان أو الوصف أو الفئة…' : lang === 'fr' ? 'Rechercher par titre, description ou catégorie…' : 'Search by title, description or category…'}
            className="w-full h-full ps-11 pe-4 bg-transparent text-[#111111] dark:text-[#FAFAFA] placeholder-gray-400 dark:placeholder-gray-500 outline-none text-sm"
            autoFocus
          />
        </div>
      </form>

      <h1 className="text-[16px] md:text-[18px] font-bold text-[#111111] dark:text-[#FAFAFA] mb-4">
        {query ? (
          <span className="text-[#6B7280] dark:text-[#A1A1AA] font-normal">
            {loading ? '…' : `${results.length} ${t.search.results} `}"{query}"
          </span>
        ) : t.search.title}
      </h1>

      {loading ? (
        <ToolGridSkeleton count={6} />
      ) : results.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {results.map(tool => (
            <ToolCard key={tool.id} tool={tool} lang={lang} t={t} category={catMap[tool.categoryId]} showNewBadge={false} />
          ))}
        </div>
      ) : query ? (
        <div className="py-20 text-center">
          <div className="w-14 h-14 rounded-full bg-[#F7F8FA] dark:bg-[#18181B] flex items-center justify-center mx-auto mb-5">
            <Search className="w-6 h-6 text-[#6B7280] dark:text-[#A1A1AA]" />
          </div>
          <h2 className="text-[15px] font-bold text-[#111111] dark:text-[#FAFAFA] mb-2">
            {t.search.noResults} "{query}"
          </h2>
          <p className="text-[13px] text-[#6B7280] dark:text-[#A1A1AA]">{t.search.hint}</p>
        </div>
      ) : (
        <div className="py-20 text-center">
          <p className="text-[13px] text-[#6B7280] dark:text-[#A1A1AA]">{t.search.hint}</p>
        </div>
      )}
    </div>
  )
}
