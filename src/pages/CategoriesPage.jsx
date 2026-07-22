import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import categories from '../data/categories.json'
import tools from '../data/tools.json'
import { FileText, Image, Type, Calculator, ArrowRight } from 'lucide-react'
import ToolCard from '../components/ToolCard'

const ICONS = { FileText, Image, Type, Calculator }

export default function CategoriesPage({ lang, t, slug }) {
  const toolCountByCategory = useMemo(() => {
    const counts = {}
    tools.forEach(tool => { counts[tool.categoryId] = (counts[tool.categoryId] || 0) + 1 })
    return counts
  }, [])

  // If slug is given, show single category
  if (slug) {
    const category = categories.find(c => c.slug === slug)
    if (!category) return (
      <div className="max-w-6xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold mb-2">Category not found</h2>
        <Link to="/categories" className="text-brand-600 hover:underline">← Back to categories</Link>
      </div>
    )

    const Icon = ICONS[category.icon] || FileText
    const catTools = tools.filter(t => t.categoryId === category.id)

    return (
      <main className="max-w-6xl mx-auto px-4 py-12">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-8">
          <Link to="/" className="hover:text-brand-600 transition-colors">{t.nav.home}</Link>
          <span>/</span>
          <Link to="/categories" className="hover:text-brand-600 transition-colors">{t.nav.categories}</Link>
          <span>/</span>
          <span className="text-gray-900 dark:text-white font-medium">{category.name[lang]}</span>
        </nav>

        {/* Category Header */}
        <div className="flex items-center gap-5 mb-10">
          <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${category.color} flex items-center justify-center shrink-0`}>
            <Icon className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">{category.name[lang]}</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">{category.description[lang]}</p>
          </div>
        </div>

        {/* Tools grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {catTools.map(tool => (
            <ToolCard key={tool.id} tool={tool} lang={lang} t={t} categoryColor={category.color} />
          ))}
        </div>
      </main>
    )
  }

  // All categories
  return (
    <main className="max-w-6xl mx-auto px-4 py-12">
      <div className="mb-10">
        <h1 className="text-3xl font-bold mb-2">{t.categories.title}</h1>
        <p className="text-gray-500 dark:text-gray-400">{t.categories.subtitle}</p>
      </div>

      <div className="space-y-12">
        {categories.map(cat => {
          const Icon = ICONS[cat.icon] || FileText
          const catTools = tools.filter(t => t.categoryId === cat.id)
          return (
            <section key={cat.id}>
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${cat.color} flex items-center justify-center`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="font-bold text-lg">{cat.name[lang]}</h2>
                    <p className="text-xs text-gray-500">{toolCountByCategory[cat.id] || 0} {t.categories.toolsCount}</p>
                  </div>
                </div>
                <Link
                  to={`/categories/${cat.slug}`}
                  className="flex items-center gap-1 text-sm text-brand-600 dark:text-brand-400 hover:underline font-medium"
                >
                  {t.tools.viewAll}
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {catTools.map(tool => (
                  <ToolCard key={tool.id} tool={tool} lang={lang} t={t} categoryColor={cat.color} />
                ))}
              </div>
            </section>
          )
        })}
      </div>
    </main>
  )
}
