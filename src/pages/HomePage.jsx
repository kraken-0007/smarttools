import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Zap, TrendingUp, Clock, ArrowRight } from 'lucide-react'
import categories from '../data/categories.json'
import tools from '../data/tools.json'
import ToolCard from '../components/ToolCard'
import SectionHeader from '../components/SectionHeader'
import { CategoryGridSkeleton, ToolGridSkeleton } from '../components/Skeletons'
import { useSEO, getPopularTools } from '../lib/seo'
import { getIcon } from '../lib/icons'

/* Popular Today — specific tools */
const POPULAR_TODAY_SLUGS = [
  'pdf-to-word', 'word-to-pdf', 'compress-pdf',
  'remove-background', 'image-converter', 'age-calculator',
]

/* NEW badge — 7 days */
function isNew(tool) {
  if (!tool.created_at) return false
  const created = new Date(tool.created_at)
  const now = new Date()
  const diff = (now - created) / (1000 * 60 * 60 * 24)
  return diff <= 7
}

export default function HomePage({ lang, t }) {
  const [loading, setLoading] = useState(true)

  useSEO({
    title: 'SmartTools - Free Online Tools',
    description: lang === 'ar'
      ? 'SmartTools — أدوات مجانية عبر الإنترنت لملفات PDF والصور والمزيد. بدون تسجيل.'
      : lang === 'fr'
      ? 'SmartTools — Outils en ligne gratuits pour PDF, images et plus. Sans inscription.'
      : 'SmartTools — Free online tools for PDF, images, video, audio, text, SEO, developers and more. No sign-up required.',
    canonical: '/',
  })

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 300)
    return () => clearTimeout(timer)
  }, [])

  const catMap = useMemo(() => Object.fromEntries(categories.map(c => [c.id, c])), [])

  // Popular Today — by specific slugs
  const popularToday = useMemo(() => {
    return POPULAR_TODAY_SLUGS
      .map(slug => tools.find(t => t.slug === slug))
      .filter(Boolean)
  }, [])

  // Popular Tools — by views, fallback to featured
  const popularTools = useMemo(() => {
    const hasViews = tools.some(t => {
      try { return parseInt(localStorage.getItem(`tool_views_${t.slug}`) || '0') > 0 } catch { return false }
    })
    if (hasViews) return getPopularTools(tools, 6)
    return tools.filter(t => t.featured).slice(0, 6)
  }, [])

  // Latest Tools — sorted by created_at desc
  const recentTools = useMemo(() => {
    return [...tools]
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
      .slice(0, 6)
  }, [])

  // Stats
  const stats = useMemo(() => [
    { num: `${tools.length}+`, label: lang === 'ar' ? 'أداة' : lang === 'fr' ? 'Outils' : 'Tools' },
    { num: `${categories.length}`, label: lang === 'ar' ? 'فئة' : lang === 'fr' ? 'Catégories' : 'Categories' },
    { num: null, label: lang === 'ar' ? 'بدون تسجيل' : lang === 'fr' ? 'Sans inscription' : 'No Registration Required' },
  ], [lang])

  return (
    <div className="animate-fade-in">

      {/* ── Hero (clean, minimal) ─────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50/60 via-white to-white dark:from-blue-950/20 dark:via-gray-950 dark:to-gray-950 pt-12 md:pt-20 pb-10 md:pb-14 px-4 md:px-6">
        <div className="pointer-events-none absolute -top-32 start-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-blue-200/30 to-indigo-200/20 dark:from-blue-900/10 dark:to-indigo-900/10 blur-3xl" />

        <div className="relative max-w-3xl mx-auto text-center">
          <span className="inline-flex items-center gap-2 px-3 md:px-4 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-300 text-xs font-semibold mb-5 md:mb-6 tracking-wide">
            <Zap className="w-3 h-3" strokeWidth={2.5} />
            {t.hero.badge}
          </span>

          <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 dark:text-white leading-[1.15] tracking-tight mb-3 md:mb-4">
            {lang === 'ar' ? 'أدوات مجانية عبر الإنترنت' : lang === 'fr' ? 'Outils en ligne gratuits' : 'Free Online Tools'}
          </h1>

          <p className="text-sm md:text-lg text-gray-500 dark:text-gray-400 max-w-xl mx-auto mb-6 md:mb-8 leading-relaxed px-2 md:px-0">
            {t.hero.subtitle}
          </p>

          {/* Stats */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 md:gap-x-10 gap-y-2">
            {stats.map(({ num, label }, i) => (
              <div key={i} className="flex items-center gap-2">
                {num && <span className="text-xl md:text-2xl font-extrabold text-blue-600 dark:text-blue-400">{num}</span>}
                <span className="text-xs md:text-sm text-gray-500 dark:text-gray-400 font-medium">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 md:px-6 space-y-10 md:space-y-14 py-8 md:py-12">

        {/* ── Popular Today ──────────────────────────── */}
        <section>
          <SectionHeader
            title={lang === 'ar' ? 'شائع اليوم' : lang === 'fr' ? 'Populaire aujourd\'hui' : 'Popular Today'}
            subtitle={lang === 'ar' ? 'الأدوات الأكثر استخداماً اليوم' : lang === 'fr' ? 'Les outils les plus utilisés aujourd\'hui' : 'Most used tools today'}
            icon={<TrendingUp className="w-5 h-5 text-blue-500" />}
          />
          {loading ? (
            <ToolGridSkeleton count={6} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
              {popularToday.map(tool => (
                <ToolCard key={tool.id} tool={tool} lang={lang} t={t} category={catMap[tool.categoryId]} />
              ))}
            </div>
          )}
        </section>

        {/* ── Categories Grid ─────────────────────────── */}
        <section>
          <SectionHeader
            title={t.sections.categories}
            subtitle={t.sections.categoriesSub}
          />
          {loading ? (
            <CategoryGridSkeleton count={8} />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
              {categories.map(cat => {
                const Icon = getIcon(cat.icon)
                const catTools = tools.filter(to => to.categoryId === cat.id)
                return (
                  <Link
                    key={cat.id}
                    to={`/categories/${cat.slug}`}
                    className="group bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-4 md:p-5 hover:border-blue-200 dark:hover:border-blue-800 hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-200"
                  >
                    <div className={`w-9 h-9 md:w-10 md:h-10 rounded-lg bg-gradient-to-br ${cat.color} flex items-center justify-center mb-2.5 md:mb-3 group-hover:scale-110 transition-transform duration-200`}>
                      <Icon className="w-4.5 h-4.5 text-white" strokeWidth={1.8} />
                    </div>
                    <h3 className="font-bold text-xs md:text-sm text-gray-900 dark:text-white mb-0.5 leading-snug truncate">
                      {cat.name[lang]}
                    </h3>
                    <p className="text-[10px] md:text-[11px] text-gray-400 dark:text-gray-500 line-clamp-1 leading-relaxed hidden sm:block">
                      {cat.description[lang]}
                    </p>
                    <span className="mt-2 inline-flex items-center gap-1 text-[10px] md:text-[11px] font-medium text-gray-400 dark:text-gray-500">
                      {catTools.length} {catTools.length === 1 ? 'tool' : 'tools'}
                      <ArrowRight className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </span>
                  </Link>
                )
              })}
            </div>
          )}
        </section>

        {/* ── Latest Tools ──────────────────────────── */}
        <section>
          <SectionHeader
            title={lang === 'ar' ? 'أحدث الأدوات' : lang === 'fr' ? 'Derniers outils' : 'Latest Tools'}
            subtitle={lang === 'ar' ? 'أحدث الأدوات المضافة' : lang === 'fr' ? 'Les outils les plus récents' : 'Most recently added tools'}
            icon={<Clock className="w-5 h-5 text-blue-500" />}
          />
          {loading ? (
            <ToolGridSkeleton count={6} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
              {recentTools.map(tool => (
                <ToolCard key={tool.id} tool={tool} lang={lang} t={t} category={catMap[tool.categoryId]} />
              ))}
            </div>
          )}
        </section>

      </div>
    </div>
  )
}
