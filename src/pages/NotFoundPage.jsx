import { Link } from 'react-router-dom'
import { AlertCircle } from 'lucide-react'
import { useSEO } from '../lib/seo'

export default function NotFoundPage({ lang, t }) {
  useSEO({
    title: 'Page Not Found - SmartTools',
    description: 'The page you are looking for could not be found. Browse our free online tools for PDF, images, text and more.',
    canonical: '/404',
    hreflangs: false,
  })

  const labels = {
    en: { title: 'Page Not Found', desc: 'The page you are looking for may have been moved, deleted, or never existed.', home: 'Back to Home', categories: 'Browse Categories', search: 'Search Tools' },
    fr: { title: 'Page introuvable', desc: 'La page que vous recherchez a peut-être été déplacée, supprimée ou n\'a jamais existé.', home: 'Accueil', categories: 'Parcourir les catégories', search: 'Rechercher' },
    ar: { title: 'الصفحة غير موجودة', desc: 'قد تكون الصفحة التي تبحث عنها قد تم نقلها أو حذفها أو لم تكن موجودة أبداً.', home: 'الصفحة الرئيسية', categories: 'تصفح الفئات', search: 'بحث' },
  }[lang]

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 md:py-20 text-center animate-fade-in">
      <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-950/30 flex items-center justify-center mx-auto mb-6">
        <AlertCircle className="w-8 h-8 text-red-500" />
      </div>
      <h1 className="text-2xl font-bold text-[#111111] dark:text-[#FAFAFA] mb-3">{labels.title}</h1>
      <p className="text-sm text-[#6B7280] dark:text-[#A1A1AA] mb-8 leading-relaxed">{labels.desc}</p>
      <div className="flex items-center justify-center gap-3 flex-wrap">
        <Link to="/" className="btn-primary rounded-xl px-5 py-2.5 text-sm">{labels.home}</Link>
        <Link to="/categories" className="px-5 py-2.5 text-sm font-medium rounded-xl border border-[#E5E7EB] dark:border-[#27272A] text-[#6B7280] dark:text-[#A1A1AA] hover:bg-[#F7F8FA] dark:hover:bg-[#18181B] transition-colors">{labels.categories}</Link>
        <Link to="/search" className="px-5 py-2.5 text-sm font-medium rounded-xl border border-[#E5E7EB] dark:border-[#27272A] text-[#6B7280] dark:text-[#A1A1AA] hover:bg-[#F7F8FA] dark:hover:bg-[#18181B] transition-colors">{labels.search}</Link>
      </div>
    </div>
  )
}
