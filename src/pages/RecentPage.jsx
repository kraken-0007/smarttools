/**
 * RecentPage — shows recently used tools with clear/remove options.
 * Route: /recent
 */
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Clock, Trash2, X } from 'lucide-react'
import { useRecentTools } from '../hooks/useRecentTools'
import { useSEO } from '../lib/seo'
import tools from '../data/tools.json'
import categories from '../data/categories.json'
import ToolCard from '../components/ToolCard'
import Breadcrumb from '../components/Breadcrumb'

export default function RecentPage({ lang, t }) {
  const { recent, removeRecent, clearRecent } = useRecentTools()
  const [showConfirm, setShowConfirm] = useState(false)
  const catMap = Object.fromEntries(categories.map(c => [c.id, c]))

  useSEO({
    title: lang === 'ar' ? 'الأخيرة - SmartTools' : lang === 'fr' ? 'Récents - SmartTools' : 'Recent - SmartTools',
    description: lang === 'ar' ? 'أدواتك الأخيرة' : lang === 'fr' ? 'Vos outils récents' : 'Your recently used tools',
    canonical: '/recent',
  })

  const recentTools = recent
    .map(item => tools.find(to => to.slug === item.slug))
    .filter(Boolean)

  const labels = {
    en: { title: 'Recent Tools', empty: 'No recent tools', emptyDesc: 'Tools you open will appear here.', browse: 'Browse Tools', clear: 'Clear History', confirm: 'Are you sure you want to clear your recent history?', yes: 'Yes, clear', no: 'Cancel', remove: 'Remove' },
    fr: { title: 'Outils Récents', empty: 'Aucun outil récent', emptyDesc: 'Les outils que vous ouvrez apparaîtront ici.', browse: 'Parcourir', clear: 'Effacer l\'historique', confirm: 'Effacer l\'historique récent ?', yes: 'Oui', no: 'Annuler', remove: 'Retirer' },
    ar: { title: 'الأدوات الأخيرة', empty: 'لا توجد أدوات أخيرة', emptyDesc: 'الأدوات التي تفتحها ستظهر هنا.', browse: 'تصفح', clear: 'مسح السجل', confirm: 'هل أنت متأكد من مسح السجل؟', yes: 'نعم، امسح', no: 'إلغاء', remove: 'إزالة' },
  }[lang]

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 md:py-8 animate-fade-in">
      <Breadcrumb items={[
        { label: t.breadcrumb.home, href: '/' },
        { label: labels.title },
      ]} />

      <div className="flex items-center justify-between mb-6 md:mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center">
            <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#111111] dark:text-[#FAFAFA]">{labels.title}</h1>
            <p className="text-sm text-[#6B7280] dark:text-[#A1A1AA] mt-0.5">{recentTools.length} {lang === 'ar' ? 'أداة' : 'tools'}</p>
          </div>
        </div>
        {recentTools.length > 0 && !showConfirm && (
          <button onClick={() => setShowConfirm(true)} className="text-sm text-[#6B7280] dark:text-[#A1A1AA] hover:text-red-500 font-medium flex items-center gap-1.5 transition-colors">
            <Trash2 className="w-4 h-4" />
            {labels.clear}
          </button>
        )}
      </div>

      {showConfirm && (
        <div className="mb-6 p-4 rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/30 flex items-center justify-between gap-3 animate-fade-in">
          <p className="text-sm text-amber-700 dark:text-amber-400 font-medium">{labels.confirm}</p>
          <div className="flex gap-2 shrink-0">
            <button onClick={() => { clearRecent(); setShowConfirm(false) }} className="btn-primary rounded-lg px-3 py-1.5 text-xs">{labels.yes}</button>
            <button onClick={() => setShowConfirm(false)} className="px-3 py-1.5 rounded-lg border border-[#E5E7EB] dark:border-[#27272A] text-xs font-medium text-[#6B7280] dark:text-[#A1A1AA] hover:bg-[#F7F8FA] dark:hover:bg-[#18181B]">{labels.no}</button>
          </div>
        </div>
      )}

      {recentTools.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {recentTools.map(tool => (
            <div key={tool.id} className="relative group">
              <ToolCard tool={tool} lang={lang} t={t} category={catMap[tool.categoryId]} />
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); removeRecent(tool.slug) }}
                aria-label={labels.remove}
                className="absolute top-3 end-3 w-7 h-7 rounded-lg flex items-center justify-center text-[#6B7280] dark:text-[#A1A1AA] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 opacity-0 group-hover:opacity-100 transition-all z-10 bg-white/80 dark:bg-[#111113]/80 backdrop-blur-sm"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-[#F7F8FA] dark:bg-[#18181B] flex items-center justify-center mx-auto mb-5">
            <Clock className="w-7 h-7 text-gray-300 dark:text-gray-600" />
          </div>
          <h3 className="font-bold text-lg text-[#111111] dark:text-[#FAFAFA] mb-2">{labels.empty}</h3>
          <p className="text-sm text-[#6B7280] dark:text-[#A1A1AA] max-w-sm mx-auto mb-6">{labels.emptyDesc}</p>
          <Link to="/categories" className="btn-primary rounded-lg px-5 py-2.5 text-sm inline-flex items-center gap-2">{labels.browse}</Link>
        </div>
      )}
    </div>
  )
}
