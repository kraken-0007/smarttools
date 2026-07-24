import { useSEO } from '../lib/seo'
import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Zap, Search, TrendingUp, Clock } from 'lucide-react'
import categories from '../data/categories.json'
import tools from '../data/tools.json'
import ToolCard from '../components/ToolCard'
import SectionHeader from '../components/SectionHeader'
import { CategoryGridSkeleton, ToolGridSkeleton } from '../components/Skeletons'
import { getPopularTools } from '../lib/seo'
import { getIcon } from '../lib/icons'

export default function HomePage({ lang, t }) {
  const [loading, setLoading] = useState(true)

  // SEO
  useSEO({
    title: 'SmartTools - Free Online Tools',
    description: lang === 'ar'
      ? 'SmartTools — أدوات مجانية عبر الإنترنت لملفات PDF والصور والفيديو والمزيد. بدون تسجيل.'
      : lang === 'fr'
      ? 'SmartTools — Outils en ligne gratuits pour PDF, images, vidéo et plus. Sans inscription.'
      : 'SmartTools — Free online tools for PDF, images, video, audio, text, SEO, developers and more. No sign-up required.',
    canonical: '/',
  })

  // Simulate data loading
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 300)
    return () => clearTimeout(timer)
  }, [])

  const catMap = useMemo(() => Object.fromEntries(categories.map(c => [c.id, c])), [])
  const popularTools = useMemo(() => {
    // Use view counts + featured as fallback
    const hasViews = tools.some(t => {
      try { return parseInt(localStorage.getItem(`tool_views_${t.slug}`) || '0') > 0 } catch { return false }
    })
    if (hasViews) return getPopularTools(tools, 6)
    // Fallback: featured tools
    return tools.filter(t => t.featured).slice(0, 6)
  }, [])

  const recentTools = useMemo(() => {
    return [...tools]
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
      .slice(0, 6)
  }, [])

  const stats = [
    { num: `${tools.length}+`, label: t.hero.stat1 },
    { num: `${categories.length}`, label: t.hero.stat2 },
  ]

  return (
    <div className="animate-fade-in">
      {/* ── Hero ───────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50/70 via-white to-white dark:from-blue-950/20 dark:via-gray-950 dark:to-gray-950 pt-12 md:pt-16 pb-16 md:pb-20 px-4 md:px-6">
        <div className="pointer-events-none absolute -top-32 start-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-blue-200/40 to-indigo-200/30 dark:from-blue-900/15 dark:to-indigo-900/10 blur-3xl" />

        <div className="relative max-w-3xl mx-auto text-center">
          <span className="inline-flex items-center gap-2 px-3 md:px-4 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-300 text-xs font-semibold mb-5 md:mb-6 tracking-wide">
            <Zap className="w-3 h-3" strokeWidth={2.5} />
            {t.hero.badge}
          </span>

          <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 dark:text-white leading-[1.15] tracking-tight mb-4 md:mb-5">
            {t.hero.title}
          </h1>

          <p className="text-sm md:text-lg text-gray-500 dark:text-gray-400 max-w-xl mx-auto mb-6 md:mb-8 leading-relaxed px-2 md:px-0">
            {t.hero.subtitle}
          </p>

          {/* Search bar */}
          <form
            onSubmit={e => {
              e.preventDefault()
              const q = e.target.q.value.trim()
              if (q) window.location.href = `/search?q=${encodeURIComponent(q)}`
            }}
            className="max-w-2xl mx-auto mb-8 md:mb-10"
          >
            <div className="relative flex items-center h-12 md:h-14 rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus-within:border-blue-500 focus-within:shadow-blue-500/10 transition-all duration-200 shadow-md">
              <Search className="absolute start-4 w-5 h-5 text-gray-400" />
              <input
                name="q"
                type="text"
                placeholder={t.hero.searchPlaceholder}
                className="w-full h-full ps-12 pe-28 md:pe-36 bg-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none text-sm md:text-base"
              />
              <button type="submit" className="absolute end-2 btn-primary rounded-xl px-4 md:px-5 py-2 md:py-2.5 text-sm">
                {lang === 'ar' ? 'بحث' : lang === 'fr' ? 'Chercher' : 'Search'}
              </button>
            </div>
          </form>

          {/* Stats */}
          <div className="flex items-center justify-center gap-8 md:gap-12">
            {stats.map(({ num, label }) => (
              <div key={label} className="text-center">
                <div className="text-2xl md:text-3xl font-extrabold text-blue-600 dark:text-blue-400">{num}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 md:px-6 space-y-12 md:space-y-16 py-10 md:py-14">

        {/* ── Categories Grid ───────────────────────── */}
        <section>
          <SectionHeader title={t.sections.categories} subtitle={t.sections.categoriesSub} />
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
                    className="group bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl md:rounded-2xl p-4 md:p-5 hover:shadow-lg hover:border-blue-200 dark:hover:border-blue-800 transition-all duration-200"
                  >
                    <div className={`w-10 h-10 md:w-11 md:h-11 rounded-xl bg-gradient-to-br ${cat.color} flex items-center justify-center mb-2 md:mb-3 group-hover:scale-105 transition-transform`}>
                      <Icon className="w-5 h-5 text-white" strokeWidth={1.8} />
                    </div>
                    <h3 className="font-bold text-xs md:text-sm text-gray-900 dark:text-white mb-1 leading-snug">
                      {cat.name[lang]}
                    </h3>
                    <p className="text-[11px] md:text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed hidden sm:block">
                      {cat.description[lang]}
                    </p>
                    <span className="mt-2 md:mt-3 inline-block text-[10px] md:text-[11px] font-medium text-gray-400">
                      {catTools.length} {catTools.length === 1 ? 'tool' : 'tools'}
                    </span>
                  </Link>
                )
              })}
            </div>
          )}
        </section>

        {/* ── Popular Tools ─────────────────────────── */}
        <section>
          <SectionHeader
            title={t.sections.popular}
            subtitle={t.sections.popularSub}
            icon={<TrendingUp className="w-5 h-5 text-blue-500" />}
          />
          {loading ? (
            <ToolGridSkeleton count={6} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
              {popularTools.map(tool => (
                <ToolCard key={tool.id} tool={tool} lang={lang} t={t} category={catMap[tool.categoryId]} />
              ))}
            </div>
          )}
        </section>

        {/* ── Recently Added ─────────────────────────── */}
        <section>
          <SectionHeader
            title={lang === 'ar' ? 'أضيف مؤخراً' : lang === 'fr' ? 'Récemment ajoutés' : 'Recently Added'}
            subtitle={lang === 'ar' ? 'أحدث الأدوات المضافة إلى المنصة' : lang === 'fr' ? 'Les derniers outils ajoutés' : 'Newest tools added to the platform'}
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
