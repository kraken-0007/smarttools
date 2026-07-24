import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

export default function SectionHeader({ title, subtitle, linkTo, linkLabel, icon }) {
  return (
    <div className="flex items-start justify-between gap-4 mb-5 md:mb-6">
      <div>
        <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          {icon}
          {title}
        </h2>
        {subtitle && <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
      {linkTo && (
        <Link
          to={linkTo}
          className="shrink-0 flex items-center gap-1 text-xs md:text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 transition-colors mt-0.5"
        >
          {linkLabel}
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      )}
    </div>
  )
}
