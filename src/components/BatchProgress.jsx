import React from 'react'

export function BatchProgress({
  current = 0,
  total = 0,
  lang = 'en',
  completed,
  processing,
  remaining,
}) {
  const totalNum = typeof total === 'number' && !isNaN(total) ? Math.max(0, total) : 0
  const currentNum = typeof current === 'number' && !isNaN(current) ? Math.max(0, current) : 0

  // Calculate percentage
  const percentage = totalNum > 0 ? Math.min(100, Math.max(0, Math.round((currentNum / totalNum) * 100))) : 0

  // Derive counts if not explicitly supplied
  const calcCompleted =
    typeof completed === 'number'
      ? completed
      : currentNum >= totalNum && totalNum > 0
      ? totalNum
      : Math.max(0, currentNum > 0 ? currentNum - 1 : 0)

  const calcProcessing =
    typeof processing === 'number'
      ? processing
      : currentNum > 0 && currentNum <= totalNum
      ? 1
      : 0

  const calcRemaining =
    typeof remaining === 'number'
      ? remaining
      : Math.max(0, totalNum - calcCompleted - calcProcessing)

  const labels = {
    en: {
      processingText: `Processing ${currentNum} / ${totalNum}`,
      counts: `${calcCompleted} completed, ${calcProcessing} processing, ${calcRemaining} remaining`,
    },
    fr: {
      processingText: `Traitement ${currentNum} / ${totalNum}`,
      counts: `${calcCompleted} terminés, ${calcProcessing} en cours, ${calcRemaining} restants`,
    },
    ar: {
      processingText: `جارٍ معالجة ${currentNum} / ${totalNum}`,
      counts: `${calcCompleted} مكتمل، ${calcProcessing} قيد المعالجة، ${calcRemaining} متبقي`,
    },
  }[lang] || {
    processingText: `Processing ${currentNum} / ${totalNum}`,
    counts: `${calcCompleted} completed, ${calcProcessing} processing, ${calcRemaining} remaining`,
  }

  return (
    <div className="w-full space-y-3 p-4 rounded-xl border border-[#E5E7EB] dark:border-[#27272A] bg-white dark:bg-[#18181B] shadow-sm animate-fade-in">
      {/* Header Info */}
      <div className="flex items-center justify-between text-sm font-medium text-[#111111] dark:text-[#FAFAFA]">
        <span>{labels.processingText}</span>
        <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
          {percentage}%
        </span>
      </div>

      {/* Progress Bar Track and Fill */}
      <div className="w-full bg-[#E5E7EB] dark:bg-[#27272A] rounded-full h-2.5 overflow-hidden">
        <div
          className="bg-blue-600 h-full rounded-full transition-all duration-300 ease-out"
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={percentage}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>

      {/* Breakdown Counts */}
      <div className="flex items-center justify-between text-xs text-[#6B7280] dark:text-[#A1A1AA] pt-0.5">
        <span>{labels.counts}</span>
      </div>
    </div>
  )
}

export default BatchProgress
