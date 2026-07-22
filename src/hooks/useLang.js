import { useState, useEffect } from 'react'
import translations from '../data/translations.json'

const LANGS = ['en', 'fr', 'ar']

export function useLang() {
  const [lang, setLang] = useState(() => {
    const stored = localStorage.getItem('st-lang')
    if (stored && LANGS.includes(stored)) return stored
    const browser = navigator.language?.slice(0, 2)
    return LANGS.includes(browser) ? browser : 'fr'
  })

  useEffect(() => {
    const t = translations[lang]
    document.documentElement.setAttribute('dir', t.dir)
    document.documentElement.setAttribute('lang', lang)
    localStorage.setItem('st-lang', lang)
  }, [lang])

  const t = translations[lang]

  return { lang, setLang, t, langs: LANGS }
}
