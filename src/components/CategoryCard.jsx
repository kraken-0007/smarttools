import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown, ArrowRight } from 'lucide-react'
import { getIcon } from '../lib/icons'

export default function CategoryCard({ category, lang, t, tools = [] }) {
  const [expanded, setExpanded] = useState(false)
  const Icon = getIcon(category.icon)

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/5 dark:hover:shadow-blue-900/20">
      {/* Header row — clickable to expand */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-4 p-5 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
      >
        <div className={`shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${category.bg}`}>
          <Icon className={`w-6 h-6 ${category.text}`} strokeWidth={1.8} />
        </div>
        <div className="flex-1 min-w-0 text-left">
          <h3 className="font-semibold text-sm text-gray-900 dark:text-white">
            {category.name[lang]}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {tools.length} {tools.length === 1 ? 'tool' : 'tools'}
          </p>
        </div>
        <ChevronDown
          className={`w-5 h-5 text-gray-400 shrink-0 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Expandable tools list */}
      {expanded && (
        <div className="border-t border-gray-100 dark:border-gray-800 animate-fade-in">
          {tools.length > 0 ? (
            <ul className="p-2 space-y-1">
              {tools.map(tool => {
                const ToolIcon = getIcon(tool.icon)
                return (
                  <li key={tool.id}>
                    <Link
                      to={`/tools/${tool.slug}`}
                      className="group flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors"
                    >
                      <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${category.bg}`}>
                        <ToolIcon className={`w-4 h-4 ${category.text}`} strokeWidth={1.8} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {tool.name[lang]}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {tool.description[lang]}
                        </p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-blue-500 transition-colors shrink-0" />
                    </Link>
                  </li>
                )
              })}
            </ul>
          ) : (
            <div className="p-6 text-center">
              <p className="text-sm text-gray-400 dark:text-gray-500">{t.category.noTools}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
