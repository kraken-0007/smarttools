import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { getIcon } from '../lib/icons'

/* ── NEW badge: show for 7 days after created_at ── */
function isNew(tool) {
  if (!tool.created_at) return false
  const created = new Date(tool.created_at)
  const now = new Date()
  const diff = (now - created) / (1000 * 60 * 60 * 24)
  return diff <= 7
}

export default function ToolCard({ tool, lang, t, category }) {
  const Icon = getIcon(tool.icon)
  const cat = category || {}
  const showNew = isNew(tool)

  return (
    <Link to={`/tools/${tool.slug}`} className="tool-card">
      {/* NEW badge — top right corner */}
      {showNew && (
        <span className="absolute top-4 end-4 text-[9px] font-bold px-2 py-0.5 rounded-full bg-red-500 text-white leading-none shadow-sm">
          NEW
        </span>
      )}

      {/* Icon */}
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${cat.bg || 'bg-blue-50 dark:bg-blue-950/30'}`}>
        <Icon className={`w-6 h-6 ${cat.text || 'text-blue-600 dark:text-blue-400'}`} strokeWidth={1.8} />
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-[15px] text-gray-900 dark:text-white mb-1 leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {tool.name[lang]}
        </h3>
        <p className="text-[13px] text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-2">
          {tool.description[lang]}
        </p>
      </div>

      {/* CTA */}
      <div className={`mt-1 inline-flex items-center gap-1.5 text-xs font-semibold ${cat.text || 'text-blue-600 dark:text-blue-400'} group-hover:gap-2.5 transition-all`}>
        {t.tools.open}
        <ArrowRight className="w-3.5 h-3.5" />
      </div>
    </Link>
  )
}
