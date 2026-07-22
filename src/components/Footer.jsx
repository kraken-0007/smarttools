import { Link } from 'react-router-dom'
import { Zap } from 'lucide-react'

export default function Footer({ t, categories, lang }) {
  return (
    <footer className="border-t mt-20 bg-gray-50 dark:bg-gray-900/50">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-lg">SmartTools</span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{t.footer.tagline}</p>
          </div>

          {/* Categories */}
          <div>
            <h3 className="font-semibold text-sm uppercase tracking-wider text-gray-400 mb-4">{t.footer.categories}</h3>
            <ul className="space-y-2">
              {categories.map(cat => (
                <li key={cat.id}>
                  <Link
                    to={`/categories/${cat.slug}`}
                    className="text-sm text-gray-600 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
                  >
                    {cat.name[lang]}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Info */}
          <div>
            <h3 className="font-semibold text-sm uppercase tracking-wider text-gray-400 mb-4">{t.footer.language}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">English · Français · العربية</p>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t text-center text-sm text-gray-400">
          {t.footer.copyright}
        </div>
      </div>
    </footer>
  )
}
