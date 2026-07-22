import { Link } from 'react-router-dom'
import { FileText, Image, Type, Calculator } from 'lucide-react'

const ICONS = { FileText, Image, Type, Calculator }

export default function CategoryCard({ category, lang, toolCount }) {
  const Icon = ICONS[category.icon] || FileText
  return (
    <Link
      to={`/categories/${category.slug}`}
      className="group flex flex-col items-center gap-3 rounded-2xl border bg-white dark:bg-gray-900 p-6 text-center card-hover"
    >
      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${category.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}>
        <Icon className="w-7 h-7 text-white" />
      </div>
      <div>
        <h3 className="font-semibold text-sm mb-1 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
          {category.name[lang]}
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
          {category.description[lang]}
        </p>
      </div>
      <span className="mt-auto text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
        {toolCount} tools
      </span>
    </Link>
  )
}
