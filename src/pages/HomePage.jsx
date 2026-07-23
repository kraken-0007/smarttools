import { useMemo } from 'react'
import { Zap, Shield, Globe, MousePointerClick } from 'lucide-react'
import categories from '../data/categories.json'
import tools from '../data/tools.json'
import CategoryCard from '../components/CategoryCard'
import ToolCard from '../components/ToolCard'
import SectionHeader from '../components/SectionHeader'

const WHY_ICONS = [Zap, Shield, MousePointerClick, Globe]
const WHY_STYLES = [
  { bg: 'bg-amber-50 dark:bg-amber-950/30', text: 'text-amber-500' },
  { bg: 'bg-green-50 dark:bg-green-950/30', text: 'text-green-500' },
  { bg: 'bg-blue-50 dark:bg-blue-950/30', text: 'text-blue-500' },
  { bg: 'bg-purple-50 dark:bg-purple-950/30', text: 'text-purple-500' },
]

export default function HomePage({ lang, t }) {
  const catMap = useMemo(() => Object.fromEntries(categories.map(c => [c.id, c])), [])
  const toolsByCategory = useMemo(() => {
    const map = {}
    tools.forEach(tool => {
      if (!map[tool.categoryId]) map[tool.categoryId] = []
      map[tool.categoryId].push(tool)
    })
    return map
  }, [])
  const featuredTools = useMemo(() => tools.filter(t => t.featured), [])

  return (
    <div className="animate-fade-in">
      {/* ── Hero ──────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50/70 via-white to-white dark:from-blue-950/20 dark:via-gray-950 dark:to-gray-950 pt-16 pb-20 px-4 md:px-6">
        {/* Decorative gradient blobs */}
        <div className="pointer-events-none absolute -top-32 start-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-blue-200/40 to-indigo-200/30 dark:from-blue-900/15 dark:to-indigo-900/10 blur-3xl" />

        <div className="relative max-w-3xl mx-auto text-center">
          {/* Badge */}
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-300 text-xs font-semibold mb-6 tracking-wide">
            <Zap className="w-3 h-3" strokeWidth={2.5} />
            {t.hero.badge}
          </span>

          {/* Title */}
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white leading-[1.15] tracking-tight mb-5">
            {t.hero.title}
          </h1>

          <p className="text-base md:text-lg text-gray-500 dark:text-gray-400 max-w-xl mx-auto mb-8 leading-relaxed">
            {t.hero.subtitle}
          </p>

          {/* Large search box */}
          <form
            onSubmit={e => {
              e.preventDefault()
              const q = e.target.q.value.trim()
              if (q) window.location.href = `/search?q=${encodeURIComponent(q)}`
            }}
            className="max-w-2xl mx-auto mb-10"
          >
            <div className="relative flex items-center h-14 rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-card-lg focus-within:border-blue-500 focus-within:shadow-blue-500/10 transition-all duration-200">
              <svg className="absolute start-4 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                name="q"
                type="text"
                placeholder={t.hero.searchPlaceholder}
                className="w-full h-full ps-12 pe-36 bg-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none text-base"
              />
              <button
                type="submit"
                className="absolute end-2 btn-primary rounded-xl px-5 py-2.5 text-sm"
              >
                {lang === 'ar' ? 'بحث' : lang === 'fr' ? 'Chercher' : 'Search'}
              </button>
            </div>
          </form>

          {/* Stats */}
          <div className="flex items-center justify-center gap-12">
            {[['8+', t.hero.stat1], ['10', t.hero.stat2]].map(([num, label]) => (
              <div key={label} className="text-center">
                <div className="text-3xl font-extrabold text-blue-600 dark:text-blue-400">{num}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 md:px-6 space-y-16 py-14">

        {/* ── Popular Categories (expandable) ────────── */}
        <section>
          <SectionHeader
            title={t.sections.categories}
            subtitle={t.sections.categoriesSub}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-2 gap-4">
            {categories.map(cat => (
              <CategoryCard
                key={cat.id}
                category={cat}
                lang={lang}
                t={t}
                tools={toolsByCategory[cat.id] || []}
              />
            ))}
          </div>
        </section>

        {/* ── Popular Tools ──────────────────────────── */}
        <section>
          <SectionHeader
            title={t.sections.popular}
            subtitle={t.sections.popularSub}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-2 gap-4">
            {featuredTools.map(tool => (
              <ToolCard key={tool.id} tool={tool} lang={lang} t={t} category={catMap[tool.categoryId]} />
            ))}
          </div>
        </section>

        {/* ── Why SmartTools ─────────────────────────── */}
        <section>
          <SectionHeader title={t.sections.why} subtitle={t.sections.whySub} />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            {t.why.map((item, i) => {
              const Icon = WHY_ICONS[i]
              const style = WHY_STYLES[i]
              return (
                <div key={i} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-6 hover:shadow-card-md transition-shadow">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${style.bg}`}>
                    <Icon className={`w-6 h-6 ${style.text}`} strokeWidth={2} />
                  </div>
                  <h3 className="font-bold text-sm text-gray-900 dark:text-white mb-1">{item.title}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{item.desc}</p>
                </div>
              )
            })}
          </div>
        </section>

      </div>
    </div>
  )
}
