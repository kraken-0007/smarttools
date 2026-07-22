import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'

export default function SearchBar({ placeholder, size = 'lg' }) {
  const [query, setQuery] = useState('')
  const navigate = useNavigate()

  const handleSubmit = (e) => {
    e.preventDefault()
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`)
    }
  }

  const isLg = size === 'lg'

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto">
      <div className={`relative flex items-center ${isLg ? 'h-14' : 'h-11'}`}>
        <Search className={`absolute start-4 text-gray-400 ${isLg ? 'w-5 h-5' : 'w-4 h-4'}`} />
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={placeholder}
          className={`w-full ${isLg ? 'ps-12 pe-32 text-base' : 'ps-10 pe-24 text-sm'} h-full rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 outline-none focus:border-brand-500 dark:focus:border-brand-400 transition-colors shadow-sm`}
        />
        <button
          type="submit"
          className={`absolute end-2 ${isLg ? 'px-5 py-2.5 text-sm' : 'px-4 py-1.5 text-xs'} bg-brand-600 hover:bg-brand-700 text-white font-medium rounded-xl transition-colors`}
        >
          Search
        </button>
      </div>
    </form>
  )
}
