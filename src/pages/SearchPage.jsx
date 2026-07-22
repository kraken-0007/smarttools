import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search } from 'lucide-react'
import tools from '../data/tools.json'
import categories from '../data/categories.json'
import ToolCard from '../components/ToolCard'

function searchTools(tools, query, lang) {
  if (!query.trim()) return tools
  const q = query.toLowerCase()
  return tools.filter(t =>
    t.name[lang]?.toLowerCase().includes(q) ||
    t.description[lang]?.toLowerCase().includes(q)
  )
}

export default function SearchPage({ lang, t }) {
  const [params] = useSearchParams()
  const query = params.get('q') || ''
  const catMap = useMemo(() => Object.fromEntries(categories.map(c => [c.id, c])), [])
  const results = useMemo(() => searchTools(tools, query, lang), [query, lang])

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 animate-fade-in">
      <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
        {query ? (
          <>
            <span className="text-gray-500 dark:text-gray-400 font-normal">{results.length} {t.search.results} </span>
            "{query}"
          </>
        ) : t.search.title}
      </h1>

      {results.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {results.map(tool => (
            <ToolCard key={tool.id} tool={tool} lang={lang} t={t} category={catMap[tool.categoryId]} />
          ))}
        </div>
      ) : query ? (
        <div className="py-24 text-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-5">
            <Search className="w-7 h-7 text-gray-400" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
            {t.search.noResults} "{query}"
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t.search.hint}</p>
        </div>
      ) : (
        <div className="py-24 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">{t.search.hint}</p>
        </div>
      )}
    </div>
  )
}
