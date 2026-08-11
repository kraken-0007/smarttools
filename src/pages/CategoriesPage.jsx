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
        <p className="text-[#6B7280] dark:text-[#A1A1AA] mb-4 text-sm">Category not found.</p>
        <Link to="/" className="text-blue-600 hover:underline text-sm">{t.breadcrumb.home}</Link>
      </div>
    )

    const Icon = getIcon(category.icon)
    const catTools = tools.filter(to => to.categoryId === category.id)

    useSEO({
      title: category.name[lang],
      description: category.description[lang],
      canonical: `/categories/${category.slug}`,
    })

    return (
      <div className="max-w-6xl mx-auto px-4 py-6 md:py-8 animate-fade-in">
        <Breadcrumb items={[
          { label: t.breadcrumb.home, href: '/' },
          { label: t.nav.categories, href: '/categories' },
          { label: category.name[lang] },
        ]} />

        <div className="card p-5 md:p-6 mb-6 md:mb-8 flex items-center gap-4">
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${category.bg}`}>
            <Icon className="w-6 h-6 text-white" strokeWidth={1.8} />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl md:text-2xl font-bold text-[#111111] dark:text-[#FAFAFA] mb-1">{category.name[lang]}</h1>
            <p className="text-[13px] text-[#6B7280] dark:text-[#A1A1AA] line-clamp-2">{category.description[lang]}</p>
            <span className="inline-block mt-2 text-[11px] font-medium text-[#6B7280] dark:text-[#A1A1AA]">
              {catTools.length} {catTools.length === 1 ? (lang === 'ar' ? 'أداة' : 'tool') : (lang === 'ar' ? 'أداة' : 'tools')}
            </span>
          </div>
        </div>

        {catTools.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {catTools.map(tool => (
              <ToolCard key={tool.id} tool={tool} lang={lang} t={t} category={category} showNewBadge={false} />
            ))}
          </div>
        ) : (
          <div className="py-16 md:py-20 text-center">
            <p className="text-[#6B7280] dark:text-[#A1A1AA] text-sm">
              {lang === 'ar' ? 'لا توجد أدوات في هذه الفئة بعد.' : lang === 'fr' ? 'Aucun outil dans cette catégorie.' : 'No tools in this category yet.'}
            </p>
          </div>
        )}
      </div>
    )
  }

  useSEO({
    title: t.nav.categories,
    description: lang === 'ar' ? 'تصفح جميع فئات أدوات SmartTools' : lang === 'fr' ? 'Parcourez toutes les catégories d\'outils SmartTools' : 'Browse all SmartTools tool categories',
    canonical: '/categories',
  })

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 md:py-8 animate-fade-in">
      <Breadcrumb items={[
        { label: t.breadcrumb.home, href: '/' },
        { label: t.nav.categories },
      ]} />

      <SectionHeader title={t.sections.categories} subtitle={t.sections.categoriesSub} />

      <div className="space-y-8 md:space-y-10">
        {categories.map(cat => {
          const Icon = getIcon(cat.icon)
          const catTools = tools.filter(to => to.categoryId === cat.id)
          return (
            <section key={cat.id}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${cat.bg}`}>
                    <Icon className="w-4 h-4 text-white" strokeWidth={1.8} />
                  </div>
                  <div>
                    <h2 className="font-bold text-[14px] text-[#111111] dark:text-[#FAFAFA]">{cat.name[lang]}</h2>
                    <p className="text-[11px] text-[#6B7280] dark:text-[#A1A1AA]">{catTools.length} tools</p>
                  </div>
                </div>
                <Link to={`/categories/${cat.slug}`} className="text-[12px] text-blue-600 dark:text-blue-400 font-semibold hover:underline shrink-0">
                  {t.tools.viewAll} →
                </Link>
              </div>

              {catTools.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {catTools.map(tool => (
                    <ToolCard key={tool.id} tool={tool} lang={lang} t={t} category={catMap[tool.categoryId]} showNewBadge={false} />
                  ))}
                </div>
              ) : (
                <div className="card p-6 text-center">
                  <p className="text-[13px] text-[#6B7280] dark:text-[#A1A1AA]">
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
