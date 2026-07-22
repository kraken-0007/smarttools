import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Zap, Shield, Globe, MousePointerClick } from 'lucide-react'
import categories from '../data/categories.json'
import tools from '../data/tools.json'
import CategoryCard from '../components/CategoryCard'
import ToolCard from '../components/ToolCard'
import SearchBar from '../components/SearchBar'

const FEATURES = [
  { icon: Zap, color: 'text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-900/20', en: 'Lightning Fast', fr: 'Ultra rapide', ar: 'سريع جداً', den: 'No loading, instant results', dfr: 'Résultats instantanés', dar: 'نتائج فورية' },
  { icon: Shield, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20', en: '100% Free', fr: '100% Gratuit', ar: '100% مجاني', den: 'No subscriptions, forever free', dfr: 'Sans abonnement', dar: 'بدون اشتراك' },
  { icon: Globe, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20', en: 'Multilingual', fr: 'Multilingue', ar: 'متعدد اللغات', den: 'English, French, Arabic', dfr: 'Anglais, Français, Arabe', dar: 'إنجليزي، فرنسي، عربي' },
  { icon: MousePointerClick, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20', en: 'No Sign-up', fr: 'Sans inscription', ar: 'بدون تسجيل', den: 'Use any tool instantly', dfr: 'Utilisez immédiatement', dar: 'استخدم فوراً' },
]

export default function HomePage({ lang, t }) {
  const featuredTools = useMemo(() => tools.filter(t => t.featured), [])
  const toolCountByCategory = useMemo(() => {
    const counts = {}
    tools.forEach(tool => {
      counts[tool.categoryId] = (counts[tool.categoryId] || 0) + 1
    })
    return counts
  }, [])

  const getCategoryColor = (categoryId) => {
    return categories.find(c => c.id === categoryId)?.color || 'from-brand-500 to-purple-600'
  }

  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden py-20 md:py-28">
        {/* Background decoration */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 start-1/4 w-72 h-72 bg-brand-200 dark:bg-brand-900/30 rounded-full blur-3xl opacity-40" />
          <div className="absolute bottom-0 end-1/4 w-72 h-72 bg-purple-200 dark:bg-purple-900/30 rounded-full blur-3xl opacity-40" />
        </div>

        <div className="max-w-6xl mx-auto px-4 text-center">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 text-sm font-medium mb-6 border border-brand-200 dark:border-brand-800">
            <Zap className="w-3.5 h-3.5" />
            {t.hero.badge}
          </span>

          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4 leading-tight">
            {t.hero.title}{' '}
            <span className="gradient-text">{t.hero.titleHighlight}</span>
          </h1>

          <p className="text-lg md:text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            {t.hero.subtitle}
          </p>

          <SearchBar placeholder={t.hero.searchPlaceholder} size="lg" />

          {/* Stats */}
          <div className="flex items-center justify-center gap-8 mt-10 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <span className="font-bold text-2xl text-gray-900 dark:text-white">8</span>
              <span>{t.tools.popular}</span>
            </div>
            <div className="w-px h-8 bg-gray-200 dark:bg-gray-700" />
            <div className="flex items-center gap-2">
              <span className="font-bold text-2xl text-gray-900 dark:text-white">4</span>
              <span>{t.nav.categories}</span>
            </div>
            <div className="w-px h-8 bg-gray-200 dark:bg-gray-700" />
            <div className="flex items-center gap-2">
              <span className="font-bold text-2xl text-gray-900 dark:text-white">3</span>
              <span>{t.footer.language}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 bg-gray-50 dark:bg-gray-900/30">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold mb-2">{t.categories.title}</h2>
            <p className="text-gray-500 dark:text-gray-400">{t.categories.subtitle}</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.map(cat => (
              <CategoryCard
                key={cat.id}
                category={cat}
                lang={lang}
                toolCount={toolCountByCategory[cat.id] || 0}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Popular Tools */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl md:text-3xl font-bold">{t.tools.popular}</h2>
            <Link to="/categories" className="text-sm text-brand-600 dark:text-brand-400 hover:underline font-medium">
              {t.tools.viewAll} →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {featuredTools.map(tool => (
              <ToolCard
                key={tool.id}
                tool={tool}
                lang={lang}
                t={t}
                categoryColor={getCategoryColor(tool.categoryId)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-gray-50 dark:bg-gray-900/30">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold mb-2">
              {lang === 'ar' ? 'لماذا SmartTools؟' : lang === 'fr' ? 'Pourquoi SmartTools ?' : 'Why SmartTools?'}
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {FEATURES.map((feat, i) => {
              const Icon = feat.icon
              return (
                <div key={i} className="rounded-2xl border bg-white dark:bg-gray-900 p-6 text-center">
                  <div className={`w-12 h-12 rounded-xl ${feat.bg} flex items-center justify-center mx-auto mb-4`}>
                    <Icon className={`w-6 h-6 ${feat.color}`} />
                  </div>
                  <h3 className="font-semibold text-sm mb-1">
                    {lang === 'ar' ? feat.ar : lang === 'fr' ? feat.fr : feat.en}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {lang === 'ar' ? feat.dar : lang === 'fr' ? feat.dfr : feat.den}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>
    </main>
  )
}
