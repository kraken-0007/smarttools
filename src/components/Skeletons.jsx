export function ToolCardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-6 flex flex-col gap-3 animate-pulse">
      <div className="w-12 h-12 rounded-xl bg-gray-200 dark:bg-gray-800" />
      <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-3/4" />
      <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-full" />
      <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-2/3" />
      <div className="h-3 bg-gray-100 dark:bg-gray-800/50 rounded w-20 mt-1" />
    </div>
  )
}

export function CategoryCardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 animate-pulse">
      <div className="w-11 h-11 rounded-xl bg-gray-200 dark:bg-gray-800 mb-3" />
      <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-2/3 mb-2" />
      <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-full mb-1" />
      <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-3/4" />
    </div>
  )
}

export function ToolGridSkeleton({ count = 6 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <ToolCardSkeleton key={i} />
      ))}
    </div>
  )
}

export function CategoryGridSkeleton({ count = 8 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <CategoryCardSkeleton key={i} />
      ))}
    </div>
  )
}
