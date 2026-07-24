import { Link } from 'react-router-dom'
import categories from '../data/categories.json'
import logo from '../assets/logo.png'

export default function Footer({ t, lang }) {
  return (
    <footer className="border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950 mt-12 md:mt-16">
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-10 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 md:gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-3">
              <img src={logo} alt="SmartTools" className="w-8 h-8 object-contain rounded-lg" />
              <span className="font-bold text-base md:text-lg text-gray-900 dark:text-white">
                Smart<span className="text-blue-600">Tools</span>
              </span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed max-w-xs">
              {t.footer.tagline}
            </p>
          </div>

          {/* Categories col 1 */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3 md:mb-4">
              {t.footer.categories}
            </h3>
            <ul className="space-y-2">
              {categories.slice(0, 5).map(cat => (
                <li key={cat.id}>
                  <Link
                    to={`/categories/${cat.slug}`}
                    className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    {cat.name[lang]}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories col 2 */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3 md:mb-4">
              &nbsp;
            </h3>
            <ul className="space-y-2">
              {categories.slice(5, 10).map(cat => (
                <li key={cat.id}>
                  <Link
                    to={`/categories/${cat.slug}`}
                    className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    {cat.name[lang]}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-8 md:mt-10 pt-6 border-t border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <img src={logo} alt="SmartTools" className="w-5 h-5 object-contain opacity-60" />
            <p className="text-xs text-gray-400">{t.footer.copyright}</p>
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <span>English</span>
            <span>Français</span>
            <span>العربية</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
