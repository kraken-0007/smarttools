import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Zap, TrendingUp, Clock, ArrowRight, FileText, Upload } from 'lucide-react'
import categories from '../data/categories.json'
import tools from '../data/tools.json'
import ToolCard from '../components/ToolCard'
import SectionHeader from '../components/SectionHeader'
import { CategoryGridSkeleton, ToolGridSkeleton } from '../components/Skeletons'
import { useSEO, getPopularTools, buildWebsiteJsonLd, SITE_URL } from '../lib/seo'
import { getIcon } from '../lib/icons'
import { getRecentToolSlugs } from '../lib/recentHelpers'

/* Popular Today — specific tools */
const POPULAR_TODAY_SLUGS = [
  'pdf-to-word', 'compress-pdf', 'jpg-to-pdf',
  'compress-image', 'resize-image', 'age-calculator',
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
    title: 'SmartTools - Free Online Tools for PDF, Images & More',
    description: lang === 'ar'
      ? 'SmartTools — أدوات مجانية عبر الإنترنت لملفات PDF والصور والمزيد. بدون تسجيل.'
      : lang === 'fr'
      ? 'SmartTools — Outils en ligne gratuits pour PDF, images et plus. Sans inscription.'
      : 'SmartTools — Free online tools for PDF, images, text and calculators. Convert, compress and edit files in your browser. No sign-up required.',
    canonical: '/',
    lang,
    jsonLd: buildWebsiteJsonLd(),
  })

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 300)
    return () => clearTimeout(timer)
  }, [])

  const catMap = useMemo(() => Object.fromEntries(categories.map(c => [c.id, c])), [])

  const popularToday = useMemo(() => {
    return POPULAR_TODAY_SLUGS
      .map(slug => tools.find(t => t.slug === slug))
      .filter(Boolean)
  }, [])

  const popularTools = useMemo(() => {
    const hasViews = tools.some(t => {
      try { return parseInt(localStorage.getItem(`tool_views_${t.slug}`) || '0') > 0 } catch { return false }
    })
    if (hasViews) return getPopularTools(tools, 6)
    return tools.filter(t => t.featured).slice(0, 6)
  }, [])

  const recentlyUsed = useMemo(() => {
    return getRecentToolSlugs(6).map(slug => tools.find(t => t.slug === slug)).filter(Boolean)
  }, [])

  const recentTools = useMemo(() => {
    return [...tools]
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
      .slice(0, 6)
  }, [])

  const heroText = {
    en: { eyebrow: 'FREE ONLINE TOOLS', title: 'Everything you need,\nin one place.', desc: 'Convert, compress, edit and optimize your files directly in your browser.', explore: 'Explore Tools', categories: 'Browse Categories', free: 'Free Forever', tools: 'Tools', categoriesLabel: 'Categories', popularToday: 'Popular Today', popularSub: 'Most used tools right now', exploreCategories: 'Explore Categories', exploreSub: 'Browse all categories', recentlyAdded: 'Recently Added', recentlySub: 'Newest tools added', recentlyUsed: 'Recently Used', recentlyUsedSub: 'Tools you\'ve opened recently' },
    fr: { eyebrow: 'OUTILS EN LIGNE GRATUITS', title: 'Tout ce dont vous avez besoin,\nen un seul endroit.', desc: 'Convertissez, compressez, éditez et optimisez vos fichiers directement dans votre navigateur.', explore: 'Explorer les outils', categories: 'Parcourir les catégories', free: 'Gratuit pour toujours', tools: 'Outils', categoriesLabel: 'Catégories', popularToday: 'Populaire aujourd\'hui', popularSub: 'Les outils les plus utilisés maintenant', exploreCategories: 'Explorer les catégories', exploreSub: 'Parcourir toutes les catégories', recentlyAdded: 'Récemment ajoutés', recentlySub: 'Les outils les plus récents', recentlyUsed: 'Récemment utilisés', recentlyUsedSub: 'Outils ouverts récemment' },
    ar: { eyebrow: 'أدوات مجانية عبر الإنترنت', title: 'كل ما تحتاجه\nفي مكان واحد.', desc: 'تحويل وضغط وتحرير وتحسين ملفاتك مباشرة في متصفحك.', explore: 'استكشف الأدوات', categories: 'تصفح الفئات', free: 'مجاني للأبد', tools: 'أداة', categoriesLabel: 'فئة', popularToday: 'شائع اليوم', popularSub: 'الأدوات الأكثر استخداماً الآن', exploreCategories: 'استكشف الفئات', exploreSub: 'تصفح جميع الفئات', recentlyAdded: 'أضيفت حديثاً', recentlySub: 'أحدث الأدوات المضافة', recentlyUsed: 'المستخدمة مؤخراً', recentlyUsedSub: 'الأدوات التي فتحتها مؤخراً' },
  }[lang]

  const stats = useMemo(() => [
    { num: `${tools.length}+`, label: heroText.tools },
    { num: `${categories.length}`, label: heroText.categoriesLabel },
    { num: null, label: heroText.free },
  ], [lang])

  return (
    <div className="animate-fade-in">

      {/* ── Hero ──────────────────────────────────── */}
      <section className="relative overflow-hidden pt-16 md:pt-24 pb-12 md:pb-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          {/* Eyebrow */}
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900 text-blue-700 dark:text-blue-300 text-[11px] font-semibold tracking-wide uppercase">
            <Zap className="w-3 h-3" strokeWidth={2.5} />
            {heroText.eyebrow}
          </span>

          {/* Title */}
          <h1 className="mt-5 text-3xl md:text-5xl font-extrabold text-[#111111] dark:text-[#FAFAFA] leading-[1.1] tracking-tight whitespace-pre-line">
            {heroText.title}
          </h1>

          {/* Description */}
          <p className="mt-4 text-[14px] md:text-[16px] text-[#6B7280] dark:text-[#A1A1AA] max-w-lg mx-auto leading-relaxed">
            {heroText.desc}
          </p>

          {/* CTAs */}
          <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/categories" className="btn-primary rounded-lg px-6 py-3 text-sm flex items-center gap-2 w-full sm:w-auto justify-center">
              {heroText.explore}
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/categories" className="btn-ghost rounded-lg px-6 py-3 text-sm w-full sm:w-auto justify-center">
              {heroText.categories}
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
            {stats.map(({ num, label }, i) => (
              <div key={i} className="flex items-center gap-2">
                {num && <span className="text-xl md:text-2xl font-extrabold text-blue-600 dark:text-blue-400 tabular-nums">{num}</span>}
                <span className="text-[12px] md:text-[13px] text-[#6B7280] dark:text-[#A1A1AA] font-medium">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Mini tool preview — subtle floating panel */}
        <div className="mt-12 max-w-md mx-auto">
          <div className="card p-5 shadow-card-md animate-scale-in">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center">
                <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" strokeWidth={1.8} />
              </div>
              <span className="text-sm font-semibold text-[#111111] dark:text-[#FAFAFA]">PDF to Word</span>
              <span className="ms-auto text-[10px] text-[#6B7280] dark:text-[#A1A1AA] font-medium px-2 py-0.5 rounded-full bg-[#F7F8FA] dark:bg-[#18181B]">PDF</span>
            </div>
            <div className="border-2 border-dashed border-[#E5E7EB] dark:border-[#27272A] rounded-lg p-6 text-center bg-[#F7F8FA] dark:bg-[#18181B]">
              <Upload className="w-6 h-6 text-[#6B7280] dark:text-[#A1A1AA] mx-auto mb-2" strokeWidth={1.5} />
              <p className="text-[12px] text-[#6B7280] dark:text-[#A1A1AA]">Drop your PDF here</p>
              <p className="text-[11px] text-[#6B7280] dark:text-[#A1A1AA] mt-1">or choose a file</p>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 space-y-12 md:space-y-16 pb-12">

        {/* ── Popular Today ──────────────────────────── */}
        <section>
          <SectionHeader
            title={heroText.popularToday}
            subtitle={heroText.popularSub}
            icon={<TrendingUp className="w-4 h-4 text-blue-600" />}
          />
          {loading ? (
            <ToolGridSkeleton count={6} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {popularToday.map(tool => (
                <ToolCard key={tool.id} tool={tool} lang={lang} t={t} category={catMap[tool.categoryId]} />
              ))}
            </div>
          )}
        </section>

        {/* ── Categories Grid ─────────────────────────── */}
        <section>
          <SectionHeader
            title={heroText.exploreCategories}
            subtitle={heroText.exploreSub}
          />
          {loading ? (
            <CategoryGridSkeleton count={8} />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {categories.map(cat => {
                const Icon = getIcon(cat.icon)
                const catTools = tools.filter(to => to.categoryId === cat.id)
                return (
                  <Link
                    key={cat.id}
                    to={`/categories/${cat.slug}`}
                    className="group card p-4 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-card-md transition-all duration-200"
                  >
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${cat.bg} group-hover:scale-105 transition-transform duration-200`}>
                      <Icon className="w-4.5 h-4.5 text-white" strokeWidth={1.8} />
                    </div>
                    <h3 className="font-semibold text-[13px] text-[#111111] dark:text-[#FAFAFA] mb-1 leading-snug truncate">
                      {cat.name[lang]}
                    </h3>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-[#6B7280] dark:text-[#A1A1AA]">
                        {catTools.length} {catTools.length === 1 ? (lang === 'ar' ? 'أداة' : 'tool') : (lang === 'ar' ? 'أداة' : 'tools')}
                      </span>
                      <ArrowRight className="w-3 h-3 text-[#6B7280] dark:text-[#A1A1AA] group-hover:text-blue-600 dark:group-hover:text-blue-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </section>

        {/* ── Recently Used ──────────────────────────── */}
        {recentlyUsed.length > 0 && (
          <section>
            <SectionHeader
              title={heroText.recentlyUsed}
              subtitle={heroText.recentlyUsedSub}
              icon={<Clock className="w-4 h-4 text-blue-600" />}
            />
            {loading ? (
              <ToolGridSkeleton count={6} />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {recentlyUsed.map(tool => (
                  <ToolCard key={tool.id} tool={tool} lang={lang} t={t} category={catMap[tool.categoryId]} />
                ))}
              </div>
            )}
          </section>
        )}

        {/* ── Recently Added ──────────────────────────── */}
        <section>
          <SectionHeader
            title={heroText.recentlyAdded}
            subtitle={heroText.recentlySub}
            icon={<Clock className="w-4 h-4 text-blue-600" />}
          />
          {loading ? (
            <ToolGridSkeleton count={6} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {recentTools.map(tool => (
                <ToolCard key={tool.id} tool={tool} lang={lang} t={t} category={catMap[tool.categoryId]} />
              ))}
            </div>
          )}
        </section>

      </div>

      {/* SEO Content Section */}
      <div className="max-w-3xl mx-auto px-4 pb-12 md:pb-16">
        <div className="space-y-4 text-sm text-[#6B7280] dark:text-[#A1A1AA] leading-relaxed">
          <h2 className="text-lg font-bold text-[#111111] dark:text-[#FAFAFA]">
            {lang === 'ar' ? 'أدوات مجانية عبر الإنترنت' : lang === 'fr' ? 'Outils en ligne gratuits' : 'Free Online Tools'}
          </h2>
          <p>
            {lang === 'ar'
              ? 'SmartTools عبارة عن مجموعة من الأدوات المجانية عبر الإنترنت التي تعمل مباشرة في متصفحك. سواء كنت بحاجة إلى تحويل ملفات PDF أو ضغط الصور أو عد الكلمات أو حساب النسب المئوية، فإن أدواتنا سريعة وآمنة ولا تتطلب التسجيل.'
              : lang === 'fr'
              ? 'SmartTools est une collection d\'outils en ligne gratuits qui fonctionnent directement dans votre navigateur. Que vous ayez besoin de convertir des fichiers PDF, de compresser des images, de compter des mots ou de calculer des pourcentages, nos outils sont rapides, sûrs et ne nécessitent aucune inscription.'
              : 'SmartTools is a collection of free online tools that work directly in your browser. Whether you need to convert PDF files, compress images, count words, or calculate percentages, our tools are fast, secure, and require no sign-up.'}
          </p>
          <p>
            {lang === 'ar'
              ? 'جميع المعالجة تتم محلياً في متصفحك، مما يعني أن ملفاتك لا تغادر جهازك أبداً. هذا يضمن خصوصيتك وأمانك الكامل.'
              : lang === 'fr'
              ? 'Tout le traitement se fait localement dans votre navigateur, ce qui signifie que vos fichiers ne quittent jamais votre appareil. Cela garantit une confidentialité et une sécurité totales.'
              : 'All processing happens locally in your browser, meaning your files never leave your device. This ensures complete privacy and security.'}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
            {categories.map(cat => (
              <div key={cat.id}>
                <Link to={`/categories/${cat.slug}`} className="font-semibold text-blue-600 dark:text-blue-400 hover:underline text-sm">
                  {cat.name[lang]}
                </Link>
                <p className="text-xs mt-1">{cat.description[lang]}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
