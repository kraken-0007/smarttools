import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import categories from '../data/categories.json'
import tools from '../data/tools.json'
import ToolCard from '../components/ToolCard'
import Breadcrumb from '../components/Breadcrumb'
import SectionHeader from '../components/SectionHeader'
import { getIcon } from '../lib/icons'

export default function CategoriesPage({ lang, t, slug }) {
  const catMap = useMemo(() => Object.fromEntries(categories.map(c => [c.id, c])), [])

  if (slug) {
    const category = categories.find(c => c.slug === slug)
    if (!category) return (
      <div className="p-8 text-center">
        <p className="text-gray-500 mb-4">Category not found.</p>
        <Link to="/" className="text-blue-600 hover:underline text-sm">{t.breadcrumb.home}</Link>
      </div>
    )

    const Icon = getIcon(category.icon)
    const catTools = tools.filter(to => to.categoryId === category.id)

    return (
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 animate-fade-in">
        <Breadcrumb items={[
          { label: t.breadcrumb.home, href: '/' },
          { label: t.nav.categories, href: '/categories' },
          { label: category.name[lang] },
        ]} />

        <div className={`rounded-2xl p-6 mb-8 border ${category.border} ${category.bg} flex items-center gap-5`}>
          <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${category.color} flex items-center justify-center shadow-sm shrink-0`}>
            <Icon className="w-8 h-8 text-white" strokeWidth={1.6} />
          </div>
          <div>
            <h1 className={`text-2xl font-bold ${category.text} mb-1`}>{category.name[lang]}</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">{category.description[lang]}</p>
            <span className="inline-block mt-2 text-xs font-medium text-gray-500 dark:text-gray-500">
              {catTools.length} {catTools.length === 1 ? 'tool' : 'tools'}
            </span>
          </div>
        </div>

        {catTools.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {catTools.map(tool => (
              <ToolCard key={tool.id} tool={tool} lang={lang} t={t} category={category} />
            ))}
          </div>
        ) : (
          <div className="py-20 text-center">
            <p className="text-gray-400 dark:text-gray-500 text-sm">
              {lang === 'ar' ? 'لا توجد أدوات في هذه الفئة بعد.' : lang === 'fr' ? 'Aucun outil dans cette catégorie pour l\'instant.' : 'No tools in this category yet.'}
            </p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 animate-fade-in">
      <Breadcrumb items={[
        { label: t.breadcrumb.home, href: '/' },
        { label: t.nav.categories },
      ]} />

      <SectionHeader title={t.sections.categories} subtitle={t.sections.categoriesSub} />

      <div className="space-y-12">
        {categories.map(cat => {
          const Icon = getIcon(cat.icon)
          const catTools = tools.filter(to => to.categoryId === cat.id)
          return (
            <section key={cat.id}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${cat.color} flex items-center justify-center`}>
                    <Icon className="w-4.5 h-4.5 text-white" strokeWidth={1.8} />
                  </div>
                  <div>
                    <h2 className="font-bold text-gray-900 dark:text-white">{cat.name[lang]}</h2>
                    <p className="text-xs text-gray-500">{catTools.length} tools</p>
                  </div>
                </div>
                <Link to={`/categories/${cat.slug}`} className="text-sm text-blue-600 dark:text-blue-400 font-semibold hover:underline">
                  {t.tools.viewAll} →
                </Link>
              </div>

              {catTools.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {catTools.map(tool => (
                    <ToolCard key={tool.id} tool={tool} lang={lang} t={t} category={catMap[tool.categoryId]} />
                  ))}
                </div>
              ) : (
                <div className={`rounded-xl border ${cat.border} ${cat.bg} p-6 text-center`}>
                  <p className={`text-sm ${cat.text} opacity-70`}>
                    {lang === 'ar' ? 'قريباً' : lang === 'fr' ? 'Bientôt disponible' : 'Coming soon'}
                  </p>
                </div>
              )}
            </section>
          )
        })}
      </div>
    </div>
  )
}
