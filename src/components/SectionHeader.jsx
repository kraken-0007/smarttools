import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

export default function SectionHeader({ title, subtitle, linkTo, linkLabel, icon }) {
  return (
    <div className="flex items-start justify-between gap-4 mb-5">
      <div>
        <h2 className="text-[18px] md:text-[20px] font-bold text-[#111111] dark:text-[#FAFAFA] flex items-center gap-2 tracking-tight">
          {icon}
          {title}
        </h2>
        {subtitle && <p className="text-[12px] md:text-[13px] text-[#6B7280] dark:text-[#A1A1AA] mt-1">{subtitle}</p>}
      </div>
      {linkTo && (
        <Link
          to={linkTo}
          className="shrink-0 flex items-center gap-1 text-[12px] md:text-[13px] font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 transition-colors mt-1"
        >
          {linkLabel}
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      )}
    </div>
  )
}
