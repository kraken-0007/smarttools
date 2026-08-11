export function ToolCardSkeleton() {
  return (
    <div className="bg-white dark:bg-[#111113] border border-[#E5E7EB] dark:border-[#27272A] rounded-xl p-5 flex flex-col gap-3 animate-pulse">
      <div className="w-10 h-10 rounded-lg bg-[#F7F8FA] dark:bg-[#18181B]" />
      <div className="h-4 bg-[#F7F8FA] dark:bg-[#18181B] rounded w-3/4" />
      <div className="h-3 bg-[#F7F8FA] dark:bg-[#18181B] rounded w-full" />
      <div className="h-3 bg-[#F7F8FA] dark:bg-[#18181B] rounded w-2/3" />
      <div className="h-3 bg-[#F7F8FA] dark:bg-[#18181B] rounded w-20 mt-1" />
    </div>
  )
}

export function CategoryCardSkeleton() {
  return (
    <div className="bg-white dark:bg-[#111113] border border-[#E5E7EB] dark:border-[#27272A] rounded-xl p-4 animate-pulse">
      <div className="w-9 h-9 rounded-lg bg-[#F7F8FA] dark:bg-[#18181B] mb-3" />
      <div className="h-4 bg-[#F7F8FA] dark:bg-[#18181B] rounded w-2/3 mb-2" />
      <div className="h-3 bg-[#F7F8FA] dark:bg-[#18181B] rounded w-full mb-1" />
      <div className="h-3 bg-[#F7F8FA] dark:bg-[#18181B] rounded w-3/4" />
    </div>
  )
}

export function ToolGridSkeleton({ count = 6 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <ToolCardSkeleton key={i} />
      ))}
    </div>
  )
}

export function CategoryGridSkeleton({ count = 8 }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <CategoryCardSkeleton key={i} />
      ))}
    </div>
  )
}
