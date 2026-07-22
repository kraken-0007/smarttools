import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'

export default function SearchBar({ placeholder, size = 'hero' }) {
  const [query, setQuery] = useState('')
  const navigate = useNavigate()

  const handleSubmit = (e) => {
    e.preventDefault()
    if (query.trim()) navigate(`/search?q=${encodeURIComponent(query.trim())}`)
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className={`relative flex items-center ${size === 'hero' ? 'h-14 max-w-2xl' : 'h-11 max-w-xl'} mx-auto`}>
        <Search className={`absolute start-4 text-gray-400 ${size === 'hero' ? 'w-5 h-5' : 'w-4 h-4'}`} />
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={placeholder}
          className={`
            w-full h-full rounded-2xl border-2 border-gray-200 dark:border-gray-700
            bg-white dark:bg-gray-900
            ${size === 'hero' ? 'ps-12 pe-36 text-base' : 'ps-10 pe-28 text-sm'}
            outline-none focus:border-blue-500 focus:shadow-lg focus:shadow-blue-500/10
            transition-all duration-200
            text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500
          `}
        />
        <button
          type="submit"
          className={`absolute end-2 btn-primary ${size === 'hero' ? 'px-5 py-2.5 text-sm' : 'px-4 py-1.5 text-xs'} rounded-xl`}
        >
          {size === 'hero' ? placeholder.split('…')[0].replace('Search ', 'Search') : 'Search'}
        </button>
      </div>
    </form>
  )
}
