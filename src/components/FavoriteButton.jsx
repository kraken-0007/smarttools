/**
 * FavoriteButton — star toggle for tool cards and tool pages.
 * Uses Lucide Star icon. Filled when favorited.
 */
import { Star } from 'lucide-react'
import { useFavorites } from '../hooks/useFavorites'

export default function FavoriteButton({ slug, size = 'sm', lang = 'en' }) {
  const { isFavorite, toggleFavorite } = useFavorites()
  const fav = isFavorite(slug)

  const sizeClass = size === 'lg' ? 'w-9 h-9' : 'w-8 h-8'
  const iconClass = size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'

  const label = lang === 'ar' ? (fav ? 'إزالة من المفضلة' : 'إضافة للمفضلة') : lang === 'fr' ? (fav ? 'Retirer des favoris' : 'Ajouter aux favoris') : (fav ? 'Remove from favorites' : 'Add to favorites')

  return (
    <button
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFavorite(slug) }}
      aria-label={label}
      title={label}
      className={`${sizeClass} rounded-lg flex items-center justify-center transition-colors shrink-0
        ${fav
          ? 'text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30'
          : 'text-[#9CA3AF] dark:text-[#6B7280] hover:text-blue-600 dark:hover:text-blue-400 hover:bg-[#F7F8FA] dark:hover:bg-[#18181B]'
        }`}
    >
      <Star className={iconClass} fill={fav ? 'currentColor' : 'none'} strokeWidth={1.8} />
    </button>
  )
}
