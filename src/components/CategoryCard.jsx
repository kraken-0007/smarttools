import { Link } from 'react-router-dom'
import { getIcon } from '../lib/icons'
import { ArrowRight } from 'lucide-react'

export default function CategoryCard({ category, lang, toolCount }) {
  const Icon = getIcon(category.icon)

  return (
    <Link
      to={`/categories/${category.slug}`}
      className="group relative bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 flex items-center gap-4 hover:border-blue-200 dark:hover:border-blue-800 hover:shadow-card-md transition-all duration-200"
    >
      <div className={`shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${category.bg}`}>
        <Icon className={`w-6 h-6 ${category.text}`} strokeWidth={1.8} />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-sm text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {category.name[lang]}
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          {toolCount} {toolCount === 1 ? 'tool' : 'tools'}
        </p>
      </div>
      <ArrowRight className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-blue-500 transition-colors shrink-0" />
    </Link>
  )
}
