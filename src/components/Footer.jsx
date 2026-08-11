import { Link } from 'react-router-dom'
import { Globe } from 'lucide-react'
import categories from '../data/categories.json'
import logo from '../assets/logo.png'

export default function Footer({ t, lang }) {
  return (
    <footer className="border-t border-[#E5E7EB] dark:border-[#27272A] bg-white dark:bg-[#0A0A0B] mt-16">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div className="col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <img src={logo} alt="SmartTools" className="w-7 h-7 object-contain rounded-lg" />
              <span className="font-bold text-[15px] text-[#111111] dark:text-[#FAFAFA]">
                Smart<span className="text-blue-600">Tools</span>
              </span>
            </div>
            <p className="text-[13px] text-[#6B7280] dark:text-[#A1A1AA] leading-relaxed max-w-xs">
              {t.footer.tagline}
            </p>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[#6B7280] dark:text-[#A1A1AA] mb-3">
              {t.footer.categories}
            </h3>
            <ul className="space-y-2">
              {categories.map(cat => (
                <li key={cat.id}>
                  <Link to={`/categories/${cat.slug}`} className="text-[13px] text-[#6B7280] dark:text-[#A1A1AA] hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                    {cat.name[lang]}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Tools */}
          <div>
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[#6B7280] dark:text-[#A1A1AA] mb-3">
              {lang === 'ar' ? 'أدوات' : lang === 'fr' ? 'Outils' : 'Tools'}
            </h3>
            <ul className="space-y-2">
              <li>
                <Link to="/categories" className="text-[13px] text-[#6B7280] dark:text-[#A1A1AA] hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  {lang === 'ar' ? 'كل الأدوات' : lang === 'fr' ? 'Tous les outils' : 'All Tools'}
                </Link>
              </li>
              <li>
                <Link to="/search" className="text-[13px] text-[#6B7280] dark:text-[#A1A1AA] hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  {lang === 'ar' ? 'بحث' : lang === 'fr' ? 'Recherche' : 'Search'}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-[#E5E7EB] dark:border-[#27272A] flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-[#6B7280] dark:text-[#A1A1AA]">{t.footer.copyright}</p>
          <div className="flex items-center gap-4 text-xs text-[#6B7280] dark:text-[#A1A1AA]">
            <span>EN</span>
            <span>FR</span>
            <span>AR</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
