import { useMemo } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { SearchX } from 'lucide-react'
import tools from '../data/tools.json'
import categories from '../data/categories.json'
import ToolCard from '../components/ToolCard'
import SearchBar from '../components/SearchBar'
import { searchTools } from '../lib/utils'

export default function SearchPage({ lang, t }) {
  const [params] = useSearchParams()
  const query = params.get('q') || ''

  const results = useMemo(() => searchTools(tools, query, lang), [query, lang])

  const getCategoryColor = (categoryId) =>
    categories.find(c => c.id === categoryId)?.color || 'from-brand-500 to-purple-600'

  return (
    <main className="max-w-6xl mx-auto px-4 py-12">
      {/* Search bar */}
      <div className="mb-10">
        <SearchBar placeholder={t.hero.searchPlaceholder} size="md" />
      </div>

      {/* Results header */}
      {query && (
        <div className="mb-6">
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            <span className="font-semibold text-gray-900 dark:text-white">{results.length}</span>{' '}
            {t.search.results}{' '}
            <span className="font-semibold text-brand-600">"{query}"</span>
          </p>
        </div>
      )}

      {/* Results */}
      {results.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {results.map(tool => (
            <ToolCard
              key={tool.id}
              tool={tool}
              lang={lang}
              t={t}
              categoryColor={getCategoryColor(tool.categoryId)}
            />
          ))}
        </div>
      ) : query ? (
        <div className="py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
            <SearchX className="w-7 h-7 text-gray-400" />
          </div>
          <h2 className="text-xl font-bold mb-2">{t.search.noResults} "{query}"</h2>
          <p className="text-gray-500 text-sm mb-6">{t.search.tryOther}</p>
          <Link to="/categories" className="text-brand-600 hover:underline text-sm font-medium">
            Browse all categories →
          </Link>
        </div>
      ) : null}
    </main>
  )
}
