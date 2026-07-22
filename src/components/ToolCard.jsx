import { Link } from 'react-router-dom'
import { ArrowRight, FileText, FilePlus, Minimize2, Maximize, AlignLeft, Lock, Calendar, Activity } from 'lucide-react'

const ICONS = { FileText, FilePlus, Minimize2, Maximize, AlignLeft, Lock, Calendar, Activity }

export default function ToolCard({ tool, lang, t, categoryColor }) {
  const Icon = ICONS[tool.icon] || FileText
  return (
    <Link
      to={`/tools/${tool.slug}`}
      className="group block rounded-2xl border bg-white dark:bg-gray-900 p-5 card-hover"
    >
      <div className="flex items-start gap-4">
        <div className={`shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br ${categoryColor || 'from-brand-500 to-purple-600'} flex items-center justify-center`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm mb-1 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
            {tool.name[lang]}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-2">
            {tool.description[lang]}
          </p>
        </div>
        <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-brand-500 shrink-0 mt-0.5 transition-colors" />
      </div>
    </Link>
  )
}
