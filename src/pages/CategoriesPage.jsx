import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import categories from '../data/categories.json'
import tools from '../data/tools.json'
import ToolCard from '../components/ToolCard'
import Breadcrumb from '../components/Breadcrumb'
import SectionHeader from '../components/SectionHeader'
import { useSEO } from '../lib/seo'
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

    // SEO
    useSEO({
      title: category.name[lang],
      description: category.description[lang],
      canonical: `/categories/${category.slug}`,
    })

    return (
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8 animate-fade-in">
        <Breadcrumb items={[
          { label: t.breadcrumb.home, href: '/' },
          { label: t.nav.categories, href: '/categories' },
          { label: category.name[lang] },
        ]} />

        <div className={`rounded-xl md:rounded-2xl p-5 md:p-6 mb-6 md:mb-8 border ${category.border} ${category.bg} flex items-center gap-4 md:gap-5`}>
          <div className={`w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl bg-gradient-to-br ${category.color} flex items-center justify-center shadow-sm shrink-0`}>
            <Icon className="w-6 h-6 md:w-8 md:h-8 text-white" strokeWidth={1.6} />
          </div>
          <div className="min-w-0">
            <h1 className={`text-xl md:text-2xl font-bold ${category.text} mb-1`}>{category.name[lang]}</h1>
            <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{category.description[lang]}</p>
            <span className="inline-block mt-2 text-xs font-medium text-gray-500 dark:text-gray-500">
              {catTools.length} {catTools.length === 1 ? 'tool' : 'tools'}
            </span>
          </div>
        </div>

        {catTools.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {catTools.map(tool => (
              <ToolCard key={tool.id} tool={tool} lang={lang} t={t} category={category} />
            ))}
          </div>
        ) : (
          <div className="py-16 md:py-20 text-center">
            <p className="text-gray-400 dark:text-gray-500 text-sm">
              {lang === 'ar' ? 'لا توجد أدوات في هذه الفئة بعد.' : lang === 'fr' ? 'Aucun outil dans cette catégorie.' : 'No tools in this category yet.'}
            </p>
          </div>
        )}
      </div>
    )
  }

  // All categories overview page
  useSEO({
    title: t.nav.categories,
    description: lang === 'ar' ? 'تصفح جميع فئات أدوات SmartTools' : lang === 'fr' ? 'Parcourez toutes les catégories d\'outils SmartTools' : 'Browse all SmartTools tool categories',
    canonical: '/categories',
  })

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8 animate-fade-in">
      <Breadcrumb items={[
        { label: t.breadcrumb.home, href: '/' },
        { label: t.nav.categories },
      ]} />

      <SectionHeader title={t.sections.categories} subtitle={t.sections.categoriesSub} />

      <div className="space-y-8 md:space-y-12">
        {categories.map(cat => {
          const Icon = getIcon(cat.icon)
          const catTools = tools.filter(to => to.categoryId === cat.id)
          return (
            <section key={cat.id}>
              <div className="flex items-center justify-between mb-3 md:mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 md:w-9 md:h-9 rounded-xl bg-gradient-to-br ${cat.color} flex items-center justify-center`}>
                    <Icon className="w-4 h-4 md:w-5 md:h-5 text-white" strokeWidth={1.8} />
                  </div>
                  <div>
                    <h2 className="font-bold text-sm md:text-base text-gray-900 dark:text-white">{cat.name[lang]}</h2>
                    <p className="text-xs text-gray-500">{catTools.length} tools</p>
                  </div>
                </div>
                <Link to={`/categories/${cat.slug}`} className="text-xs md:text-sm text-blue-600 dark:text-blue-400 font-semibold hover:underline shrink-0">
                  {t.tools.viewAll} →
                </Link>
              </div>

              {catTools.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {catTools.map(tool => (
                    <ToolCard key={tool.id} tool={tool} lang={lang} t={t} category={catMap[tool.categoryId]} />
                  ))}
                </div>
              ) : (
                <div className={`rounded-xl border ${cat.border} ${cat.bg} p-4 md:p-6 text-center`}>
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
