import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { getIcon } from '../lib/icons'
import FavoriteButton from './FavoriteButton'

/* ── NEW badge: show for 7 days after created_at ── */
function isNew(tool) {
  if (!tool.created_at) return false
  const created = new Date(tool.created_at)
  const now = new Date()
  const diff = (now - created) / (1000 * 60 * 60 * 24)
  return diff <= 7
}

export default function ToolCard({ tool, lang, t, category, showNewBadge = true }) {
  const Icon = getIcon(tool.icon)
  const cat = category || {}
  const showNew = showNewBadge && isNew(tool)

  return (
    <Link to={`/tools/${tool.slug}`} className="tool-card group relative">
      {/* NEW badge — subtle blue, top-right corner */}
      {showNew && (
        <span className="badge-new absolute top-3 end-3 z-10">
          NEW
        </span>
      )}

      {/* Favorite button — top-left corner */}
      <div className="absolute top-2.5 start-2.5 z-10">
        <FavoriteButton slug={tool.slug} lang={lang} />
      </div>

      {/* Icon */}
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${cat.bg || 'bg-blue-50 dark:bg-blue-950/30'} group-hover:scale-105 transition-transform duration-200`}>
        <Icon className={`w-5 h-5 ${cat.text || 'text-blue-600 dark:text-blue-400'}`} strokeWidth={1.8} />
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-[14px] text-[#111111] dark:text-[#FAFAFA] mb-1 leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {tool.name[lang]}
        </h3>
        <p className="text-[12px] text-[#6B7280] dark:text-[#A1A1AA] leading-relaxed line-clamp-2">
          {tool.description[lang]}
        </p>
      </div>

      {/* Category + arrow */}
      <div className="flex items-center justify-between mt-1">
        <span className="text-[11px] text-[#6B7280] dark:text-[#A1A1AA] font-medium">
          {cat.name?.[lang] || ''}
        </span>
        <ArrowRight className="w-3.5 h-3.5 text-[#6B7280] dark:text-[#A1A1AA] group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all" />
      </div>
    </Link>
  )
}
