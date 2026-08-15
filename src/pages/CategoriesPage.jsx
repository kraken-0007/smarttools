import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import categories from '../data/categories.json'
import tools from '../data/tools.json'
import ToolCard from '../components/ToolCard'
import Breadcrumb from '../components/Breadcrumb'
import SectionHeader from '../components/SectionHeader'
import { useSEO, buildBreadcrumbJsonLd, buildFaqJsonLd } from '../lib/seo'
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

    const catFaqs = lang === 'ar' ? [
      { q: 'ما هي أدوات ' + category.name.ar + '؟', a: category.description.ar + ' جميع الأدوات مجانية وتعمل في متصفحك.' },
      { q: 'هل أحتاج إلى تسجيل الدخول؟', a: 'لا، جميع الأدوات متاحة بدون تسجيل.' },
      { q: 'هل ملفاتي آمنة؟', a: 'نعم، يتم معالجة كل شيء في متصفحك ولا يتم رفع أي ملفات إلى الخادم.' },
    ] : lang === 'fr' ? [
      { q: 'Que sont les ' + category.name.fr + ' ?', a: category.description.fr + ' Tous les outils sont gratuits et fonctionnent dans votre navigateur.' },
      { q: 'Dois-je me connecter ?', a: 'Non, tous les outils sont accessibles sans inscription.' },
      { q: 'Mes fichiers sont-ils sécurisés ?', a: 'Oui, tout est traité dans votre navigateur et aucun fichier n\'est téléchargé.' },
    ] : [
      { q: 'What are ' + category.name.en + '?', a: category.description.en + ' All tools are free and work in your browser.' },
      { q: 'Do I need to sign up?', a: 'No, all tools are accessible without registration.' },
      { q: 'Are my files safe?', a: 'Yes, everything is processed in your browser and no files are uploaded to a server.' },
    ]

    const catJsonLd = {
      '@context': 'https://schema.org',
      '@graph': [
        buildBreadcrumbJsonLd([
          { name: 'Home', url: '/' },
          { name: 'Categories', url: '/categories' },
          { name: category.name.en, url: `/categories/${category.slug}` },
        ]),
        ...(catFaqs.length > 0 ? [buildFaqJsonLd(catFaqs)] : []),
      ],
    }

    const catSeoTitles = {
      'pdf-tools': { en: 'Free PDF Tools Online - Edit, Convert, Merge PDF | SmartTools', fr: 'Outils PDF Gratuits en Ligne - Éditer, Convertir, Fusionner | SmartTools', ar: 'أدوات PDF مجانية عبر الإنترنت - تحرير وتحويل ودمج | SmartTools' },
      'image-tools': { en: 'Free Image Tools Online - Edit, Convert, Resize Images | SmartTools', fr: 'Outils Image Gratuits en Ligne - Éditer, Convertir, Redimensionner | SmartTools', ar: 'أدوات الصور مجانية عبر الإنترنت - تحرير وتحويل وتغيير الحجم | SmartTools' },
      'text-tools': { en: 'Free Text Tools Online - Word Counter, Case Converter | SmartTools', fr: 'Outils Texte Gratuits en Ligne - Compteur de Mots, Convertisseur | SmartTools', ar: 'أدوات النص مجانية عبر الإنترنت - عداد الكلمات ومحول الأحرف | SmartTools' },
      'calculators': { en: 'Free Online Calculators - BMI, Age, Percentage | SmartTools', fr: 'Calculatrices Gratuites en Ligne - IMC, Âge, Pourcentage | SmartTools', ar: 'آلات حاسبة مجانية عبر الإنترنت - مؤشر كتلة الجسم والعمر والنسبة المئوية | SmartTools' },
    }
    const catSeoDescs = {
      'pdf-tools': { en: 'Free online PDF tools to convert, merge, split, compress, rotate, and edit PDF files. No installation, no sign-up. All processing in your browser.', fr: 'Outils PDF gratuits en ligne pour convertir, fusionner, diviser, compresser et éditer des PDF. Sans installation, sans inscription. Tout dans votre navigateur.', ar: 'أدوات PDF مجانية عبر الإنترنت للتحويل والدمج والتقسيم والضغط وتحرير ملفات PDF. بدون تثبيت وبدون تسجيل. كل المعالجة في متصفحك.' },
      'image-tools': { en: 'Free online image tools to compress, resize, crop, convert, and edit images. Supports JPG, PNG, WEBP. No upload, no sign-up. Browser-based.', fr: 'Outils image gratuits en ligne pour compresser, redimensionner, recadrer et éditer des images. JPG, PNG, WEBP. Sans upload, sans inscription.', ar: 'أدوات صور مجانية عبر الإنترنت لضغط وتغيير حجم وتحرير الصور. يدعم JPG و PNG و WEBP. بدون رفع وبدون تسجيل. في المتصفح.' },
      'text-tools': { en: 'Free online text tools including word counter, character counter, and case converter. Instant results, no installation required. Works in your browser.', fr: 'Outils texte gratuits en ligne incluant compteur de mots, compteur de caractères et convertisseur de casse. Résultats instantanés, sans installation.', ar: 'أدوات نص مجانية عبر الإنترنت بما في ذلك عداد الكلمات وعدّاد الأحرف ومحول الأحرف. نتائج فورية بدون تثبيت. تعمل في متصفحك.' },
      'calculators': { en: 'Free online calculators for BMI, age calculation, and percentage. Quick, accurate results. No sign-up required. Works on any device.', fr: 'Calculatrices gratuites en ligne pour l\'IMC, le calcul de l\'âge et les pourcentages. Résultats rapides et précis. Sans inscription.', ar: 'آلات حاسبة مجانية عبر الإنترنت لحساب مؤشر كتلة الجسم والعمر والنسبة المئوية. نتائج سريعة ودقيقة. بدون تسجيل.' },
    }
    const catSeoTitle = (catSeoTitles[category.slug] && catSeoTitles[category.slug][lang]) || `${category.name[lang]} - Free Online Tools | SmartTools`
    const catSeoDesc = (catSeoDescs[category.slug] && catSeoDescs[category.slug][lang]) || category.description[lang]

    useSEO({
      title: catSeoTitle,
      description: catSeoDesc,
      canonical: `/categories/${category.slug}`,
      lang,
      jsonLd: catJsonLd,
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

        {/* Category FAQ */}
        {catFaqs && catFaqs.length > 0 && (
          <div className="mt-8">
            <h2 className="font-bold text-base text-[#111111] dark:text-[#FAFAFA] mb-4">
              {lang === 'ar' ? 'الأسئلة الشائعة' : lang === 'fr' ? 'Questions fréquentes' : 'FAQ'}
            </h2>
            <div className="space-y-2">
              {catFaqs.map((faq, i) => (
                <div key={i} className="border border-[#E5E7EB] dark:border-[#27272A] rounded-xl p-4">
                  <p className="text-sm font-semibold text-[#111111] dark:text-[#FAFAFA] mb-1">{faq.q}</p>
                  <p className="text-sm text-[#6B7280] dark:text-[#A1A1AA] leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Related Categories */}
        <div className="mt-8">
          <h2 className="font-bold text-base text-[#111111] dark:text-[#FAFAFA] mb-4">
            {lang === 'ar' ? 'فئات أخرى' : lang === 'fr' ? 'Autres catégories' : 'Other Categories'}
          </h2>
          <div className="flex flex-wrap gap-2">
            {categories.filter(c => c.id !== category.id).map(c => (
              <Link key={c.id} to={`/categories/${c.slug}`} className="px-3 py-2 rounded-lg text-sm font-medium border border-[#E5E7EB] dark:border-[#27272A] text-[#6B7280] dark:text-[#A1A1AA] hover:border-blue-300 hover:text-blue-600 transition-colors">
                {c.name[lang]}
              </Link>
            ))}
          </div>
        </div>
      </div>
    )
  }

  useSEO({
    title: 'All Tool Categories - Free Online Tools | SmartTools',
    description: lang === 'ar' ? 'تصفح جميع فئات أدوات SmartTools' : lang === 'fr' ? 'Parcourez toutes les catégories d\'outils SmartTools' : 'Browse all SmartTools tool categories — PDF tools, image tools, text tools and calculators. All free, no sign-up required.',
    canonical: '/categories',
    lang,
    jsonLd: buildBreadcrumbJsonLd([
      { name: 'Home', url: '/' },
      { name: 'Categories', url: '/categories' },
    ]),
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
