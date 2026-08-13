/**
 * FavoritesPage — shows all favorited tools in a grid.
 * Route: /favorites
 */
import { Link } from 'react-router-dom'
import { Star } from 'lucide-react'
import { useFavorites } from '../hooks/useFavorites'
import { useSEO } from '../lib/seo'
import tools from '../data/tools.json'
import categories from '../data/categories.json'
import ToolCard from '../components/ToolCard'
import Breadcrumb from '../components/Breadcrumb'

export default function FavoritesPage({ lang, t }) {
  const { favorites } = useFavorites()
  const catMap = Object.fromEntries(categories.map(c => [c.id, c]))

  useSEO({
    title: lang === 'ar' ? 'المفضلة - SmartTools' : lang === 'fr' ? 'Favoris - SmartTools' : 'Favorites - SmartTools',
    description: lang === 'ar' ? 'أدواتك المفضلة' : lang === 'fr' ? 'Vos outils favoris' : 'Your favorite tools',
    canonical: '/favorites',
  })

  const favTools = favorites
    .map(slug => tools.find(to => to.slug === slug))
    .filter(Boolean)

  const labels = {
    en: { title: 'Favorite Tools', empty: 'No favorite tools yet', emptyDesc: 'Click the star icon on any tool to add it here.', browse: 'Browse Tools' },
    fr: { title: 'Outils Favoris', empty: 'Aucun outil favori', emptyDesc: 'Cliquez sur l\'icône étoile pour ajouter un outil.', browse: 'Parcourir' },
    ar: { title: 'الأدوات المفضلة', empty: 'لا توجد أدوات مفضلة بعد', emptyDesc: 'انقر على أيقونة النجمة لإضافة أداة هنا.', browse: 'تصفح الأدوات' },
  }[lang]

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 md:py-8 animate-fade-in">
      <Breadcrumb items={[
        { label: t.breadcrumb.home, href: '/' },
        { label: labels.title },
      ]} />

      <div className="flex items-center gap-3 mb-6 md:mb-8">
        <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center">
          <Star className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="currentColor" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#111111] dark:text-[#FAFAFA]">{labels.title}</h1>
          <p className="text-sm text-[#6B7280] dark:text-[#A1A1AA] mt-0.5">{favTools.length} {lang === 'ar' ? 'أداة' : 'tools'}</p>
        </div>
      </div>

      {favTools.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {favTools.map(tool => (
            <ToolCard key={tool.id} tool={tool} lang={lang} t={t} category={catMap[tool.categoryId]} />
          ))}
        </div>
      ) : (
        <div className="py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-[#F7F8FA] dark:bg-[#18181B] flex items-center justify-center mx-auto mb-5">
            <Star className="w-7 h-7 text-gray-300 dark:text-gray-600" />
          </div>
          <h3 className="font-bold text-lg text-[#111111] dark:text-[#FAFAFA] mb-2">{labels.empty}</h3>
          <p className="text-sm text-[#6B7280] dark:text-[#A1A1AA] max-w-sm mx-auto mb-6">{labels.emptyDesc}</p>
          <Link to="/categories" className="btn-primary rounded-lg px-5 py-2.5 text-sm inline-flex items-center gap-2">{labels.browse}</Link>
        </div>
      )}
    </div>
  )
}
