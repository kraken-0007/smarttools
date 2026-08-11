import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown, ArrowRight } from 'lucide-react'
import { getIcon } from '../lib/icons'

export default function CategoryCard({ category, lang, t, tools = [] }) {
  const [expanded, setExpanded] = useState(false)
  const Icon = getIcon(category.icon)

  return (
    <div className="card overflow-hidden transition-all duration-200 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-card-md">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-4 p-4 text-left hover:bg-[#F7F8FA] dark:hover:bg-[#18181B] transition-colors"
      >
        <div className={`shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${category.bg}`}>
          <Icon className={`w-5 h-5 text-white`} strokeWidth={1.8} />
        </div>
        <div className="flex-1 min-w-0 text-left">
          <h3 className="font-semibold text-[14px] text-[#111111] dark:text-[#FAFAFA]">
            {category.name[lang]}
          </h3>
          <p className="text-[12px] text-[#6B7280] dark:text-[#A1A1AA] mt-0.5">
            {tools.length} {tools.length === 1 ? (lang === 'ar' ? 'أداة' : 'tool') : (lang === 'ar' ? 'أداة' : 'tools')}
          </p>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-[#6B7280] dark:text-[#A1A1AA] shrink-0 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
        />
      </button>

      {expanded && (
        <div className="border-t border-[#E5E7EB] dark:border-[#27272A] animate-fade-in">
          {tools.length > 0 ? (
            <ul className="p-2 space-y-0.5">
              {tools.map(tool => {
                const ToolIcon = getIcon(tool.icon)
                return (
                  <li key={tool.id}>
                    <Link
                      to={`/tools/${tool.slug}`}
                      className="group flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[#F7F8FA] dark:hover:bg-[#18181B] transition-colors"
                    >
                      <div className={`shrink-0 w-7 h-7 rounded-md flex items-center justify-center ${category.bg}`}>
                        <ToolIcon className="w-3.5 h-3.5 text-white" strokeWidth={1.8} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium text-[#111111] dark:text-[#FAFAFA] group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {tool.name[lang]}
                        </p>
                        <p className="text-[11px] text-[#6B7280] dark:text-[#A1A1AA] truncate">
                          {tool.description[lang]}
                        </p>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-[#E5E7EB] dark:text-[#27272A] group-hover:text-blue-600 transition-colors shrink-0" />
                    </Link>
                  </li>
                )
              })}
            </ul>
          ) : (
            <div className="p-6 text-center">
              <p className="text-[13px] text-[#6B7280] dark:text-[#A1A1AA]">{t.category.noTools}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
