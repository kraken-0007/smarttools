import { Routes, Route, Navigate, useParams } from 'react-router-dom'
import { useTheme } from './hooks/useTheme'
import { useLang } from './hooks/useLang'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import HomePage from './pages/HomePage'
import CategoriesPage from './pages/CategoriesPage'
import ToolPage from './pages/ToolPage'
import SearchPage from './pages/SearchPage'
import categories from './data/categories.json'

// Wrapper components to inject route params
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

  const sharedProps = { lang, t }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar
        theme={theme}
        toggleTheme={toggleTheme}
        lang={lang}
        setLang={setLang}
        langs={langs}
        t={t}
      />

      <div className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage {...sharedProps} />} />
          <Route path="/categories" element={<CategoriesPage {...sharedProps} />} />
          <Route path="/categories/:slug" element={<CategoryRoute {...sharedProps} />} />
          <Route path="/tools/:slug" element={<ToolRoute {...sharedProps} />} />
          <Route path="/search" element={<SearchPage {...sharedProps} />} />
          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>

      <Footer t={t} categories={categories} lang={lang} />
    </div>
  )
}
