import { useState } from 'react'
import { Routes, Route, Navigate, useParams } from 'react-router-dom'
import { useTheme } from './hooks/useTheme'
import { useLang } from './hooks/useLang'
import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'
import Footer from './components/Footer'
import HomePage from './pages/HomePage'
import CategoriesPage from './pages/CategoriesPage'
import ToolPage from './pages/ToolPage'
import SearchPage from './pages/SearchPage'

function CategoryRoute({ lang, t }) {
  const { slug } = useParams()
  return <CategoriesPage lang={lang} t={t} slug={slug} />
}
function ToolRoute({ lang, t }) {
  const { slug } = useParams()
  return <ToolPage lang={lang} t={t} slug={slug} />
}

export default function App() {
  const { theme, toggle: toggleTheme } = useTheme()
  const { lang, setLang, t, langs } = useLang()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const shared = { lang, t }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-gray-950">
      {/* Top Navbar */}
      <Navbar
        theme={theme}
        toggleTheme={toggleTheme}
        lang={lang}
        setLang={setLang}
        langs={langs}
        t={t}
        onMenuToggle={() => setSidebarOpen(o => !o)}
      />

      {/* Body: sidebar + main */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar
          lang={lang}
          t={t}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Main content */}
        <main className="flex-1 min-w-0 overflow-y-auto">
          <Routes>
            <Route path="/" element={<HomePage {...shared} />} />
            <Route path="/categories" element={<CategoriesPage {...shared} />} />
            <Route path="/categories/:slug" element={<CategoryRoute {...shared} />} />
            <Route path="/tools/:slug" element={<ToolRoute {...shared} />} />
            <Route path="/search" element={<SearchPage {...shared} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <Footer t={t} lang={lang} />
        </main>
      </div>
    </div>
  )
}
