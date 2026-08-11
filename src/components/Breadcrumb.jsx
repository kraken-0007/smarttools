import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'

export default function Breadcrumb({ items }) {
  return (
    <nav className="flex items-center gap-1 text-[13px] text-[#6B7280] dark:text-[#A1A1AA] mb-5 flex-wrap">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && <ChevronRight className="w-3 h-3 text-[#E5E7EB] dark:text-[#27272A] shrink-0" />}
          {item.href ? (
            <Link to={item.href} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              {item.label}
            </Link>
          ) : (
            <span className="text-[#111111] dark:text-[#FAFAFA] font-medium">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  )
}
