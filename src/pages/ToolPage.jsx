import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FileText, FilePlus, Minimize2, Maximize, AlignLeft, Lock, Calendar, Activity, CheckCircle2, Wrench } from 'lucide-react'
import tools from '../data/tools.json'
import categories from '../data/categories.json'
import ToolCard from '../components/ToolCard'

const ICONS = { FileText, FilePlus, Minimize2, Maximize, AlignLeft, Lock, Calendar, Activity }

/* ─── Word Counter ─────────────────────────────────────────────── */
function WordCounterTool({ lang }) {
  const [text, setText] = useState('')
  const words = text.trim() ? text.trim().split(/\s+/).length : 0
  const chars = text.length
  const sentences = text.split(/[.!?]+/).filter(s => s.trim()).length
  const paragraphs = text.split(/\n\n+/).filter(s => s.trim()).length

  const labels = {
    en: ['Words', 'Characters', 'Sentences', 'Paragraphs'],
    fr: ['Mots', 'Caractères', 'Phrases', 'Paragraphes'],
    ar: ['كلمات', 'أحرف', 'جمل', 'فقرات'],
  }[lang]

  return (
    <div className="space-y-4">
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        rows={8}
        placeholder={lang === 'ar' ? 'اكتب أو الصق النص هنا...' : lang === 'fr' ? 'Tapez ou collez votre texte ici...' : 'Type or paste your text here...'}
        className="w-full rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-4 text-sm outline-none focus:border-brand-500 resize-none transition-colors"
      />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[words, chars, sentences, paragraphs].map((val, i) => (
          <div key={i} className="rounded-xl bg-brand-50 dark:bg-brand-900/20 border border-brand-100 dark:border-brand-800 p-3 text-center">
            <div className="text-2xl font-bold text-brand-600 dark:text-brand-400">{val}</div>
            <div className="text-xs text-gray-500 mt-0.5">{labels[i]}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── Password Generator ───────────────────────────────────────── */
function PasswordGeneratorTool({ lang }) {
  const [length, setLength] = useState(16)
  const [useUpper, setUpper] = useState(true)
  const [useNumbers, setNumbers] = useState(true)
  const [useSymbols, setSymbols] = useState(true)
  const [password, setPassword] = useState('')
  const [copied, setCopied] = useState(false)

  const generate = () => {
    let chars = 'abcdefghijklmnopqrstuvwxyz'
    if (useUpper) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    if (useNumbers) chars += '0123456789'
    if (useSymbols) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?'
    let pwd = ''
    for (let i = 0; i < length; i++) pwd += chars[Math.floor(Math.random() * chars.length)]
    setPassword(pwd)
    setCopied(false)
  }

  const copy = () => {
    navigator.clipboard.writeText(password)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const lbl = {
    en: { length: 'Length', upper: 'Uppercase', nums: 'Numbers', syms: 'Symbols', gen: 'Generate Password', copy: 'Copy', copied: 'Copied!' },
    fr: { length: 'Longueur', upper: 'Majuscules', nums: 'Chiffres', syms: 'Symboles', gen: 'Générer', copy: 'Copier', copied: 'Copié !' },
    ar: { length: 'الطول', upper: 'أحرف كبيرة', nums: 'أرقام', syms: 'رموز', gen: 'توليد كلمة المرور', copy: 'نسخ', copied: 'تم النسخ!' },
  }[lang]

  const options = [
    [lbl.upper, useUpper, setUpper],
    [lbl.nums, useNumbers, setNumbers],
    [lbl.syms, useSymbols, setSymbols],
  ]

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4">
        <label className="text-sm font-medium whitespace-nowrap">{lbl.length}: <span className="text-brand-600 font-bold">{length}</span></label>
        <input type="range" min={8} max={32} value={length} onChange={e => setLength(+e.target.value)} className="flex-1 accent-brand-600" />
      </div>
      <div className="flex flex-wrap gap-4">
        {options.map(([label, val, setter]) => (
          <label key={label} className="flex items-center gap-2 text-sm cursor-pointer select-none">
            <input type="checkbox" checked={val} onChange={e => setter(e.target.checked)} className="accent-brand-600 w-4 h-4 rounded" />
            {label}
          </label>
        ))}
      </div>
      <button onClick={generate} className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-700 active:scale-95 text-white font-semibold transition-all">
        {lbl.gen}
      </button>
      {password && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-800 border-2 border-dashed border-gray-200 dark:border-gray-700 font-mono text-sm break-all">
          <span className="flex-1 select-all">{password}</span>
          <button onClick={copy} className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${copied ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-400 hover:bg-brand-200'}`}>
            {copied ? lbl.copied : lbl.copy}
          </button>
        </div>
      )}
    </div>
  )
}

/* ─── Age Calculator ───────────────────────────────────────────── */
function AgeCalculatorTool({ lang }) {
  const [dob, setDob] = useState('')
  const [result, setResult] = useState(null)

  const calculate = () => {
    if (!dob) return
    const birth = new Date(dob)
    const now = new Date()
    let years = now.getFullYear() - birth.getFullYear()
    let months = now.getMonth() - birth.getMonth()
    let days = now.getDate() - birth.getDate()
    if (days < 0) { months--; days += new Date(now.getFullYear(), now.getMonth(), 0).getDate() }
    if (months < 0) { years--; months += 12 }
    if (years < 0) { setResult(null); return }
    setResult({ years, months, days })
  }

  const lbl = {
    en: { dob: 'Date of Birth', calc: 'Calculate My Age', years: 'Years', months: 'Months', days: 'Days' },
    fr: { dob: 'Date de naissance', calc: "Calculer mon âge", years: 'Années', months: 'Mois', days: 'Jours' },
    ar: { dob: 'تاريخ الميلاد', calc: 'احسب عمري', years: 'سنوات', months: 'أشهر', days: 'أيام' },
  }[lang]

  return (
    <div className="space-y-5 max-w-sm mx-auto">
      <div>
        <label className="block text-sm font-medium mb-2">{lbl.dob}</label>
        <input
          type="date"
          value={dob}
          max={new Date().toISOString().split('T')[0]}
          onChange={e => setDob(e.target.value)}
          className="w-full rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-3 outline-none focus:border-brand-500 transition-colors"
        />
      </div>
      <button onClick={calculate} className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-700 active:scale-95 text-white font-semibold transition-all">
        {lbl.calc}
      </button>
      {result && (
        <div className="grid grid-cols-3 gap-3">
          {[[result.years, lbl.years], [result.months, lbl.months], [result.days, lbl.days]].map(([val, label], i) => (
            <div key={i} className="rounded-xl bg-brand-50 dark:bg-brand-900/20 border border-brand-100 dark:border-brand-800 p-4 text-center">
              <div className="text-3xl font-bold text-brand-600 dark:text-brand-400">{val}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{label}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ─── BMI Calculator ───────────────────────────────────────────── */
function BMICalculatorTool({ lang }) {
  const [height, setHeight] = useState('')
  const [weight, setWeight] = useState('')
  const [result, setResult] = useState(null)

  const calculate = () => {
    const h = parseFloat(height) / 100
    const w = parseFloat(weight)
    if (!h || !w || h <= 0 || w <= 0) return
    const bmi = (w / (h * h)).toFixed(1)
    let cat, color
    if (bmi < 18.5) { cat = { en: 'Underweight', fr: 'Sous-poids', ar: 'نقص الوزن' }; color = 'text-blue-500' }
    else if (bmi < 25) { cat = { en: 'Normal weight', fr: 'Poids normal', ar: 'وزن طبيعي' }; color = 'text-green-500' }
    else if (bmi < 30) { cat = { en: 'Overweight', fr: 'Surpoids', ar: 'زيادة الوزن' }; color = 'text-yellow-500' }
    else { cat = { en: 'Obese', fr: 'Obèse', ar: 'سمنة' }; color = 'text-red-500' }
    setResult({ bmi, cat, color })
  }

  const lbl = {
    en: { h: 'Height (cm)', w: 'Weight (kg)', calc: 'Calculate BMI', your: 'Your BMI', ideal: '18.5 – 24.9 is ideal' },
    fr: { h: 'Taille (cm)', w: 'Poids (kg)', calc: "Calculer l'IMC", your: 'Votre IMC', ideal: '18.5 – 24.9 est idéal' },
    ar: { h: 'الطول (سم)', w: 'الوزن (كجم)', calc: 'احسب المؤشر', your: 'مؤشر كتلة جسمك', ideal: '18.5 – 24.9 مثالي' },
  }[lang]

  return (
    <div className="space-y-4 max-w-sm mx-auto">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">{lbl.h}</label>
          <input type="number" value={height} onChange={e => setHeight(e.target.value)} placeholder="175"
            className="w-full rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-3 outline-none focus:border-brand-500 transition-colors" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">{lbl.w}</label>
          <input type="number" value={weight} onChange={e => setWeight(e.target.value)} placeholder="70"
            className="w-full rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-3 outline-none focus:border-brand-500 transition-colors" />
        </div>
      </div>
      <button onClick={calculate} className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-700 active:scale-95 text-white font-semibold transition-all">
        {lbl.calc}
      </button>
      {result && (
        <div className="rounded-xl bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 p-6 text-center space-y-1">
          <div className="text-xs text-gray-500 uppercase tracking-widest">{lbl.your}</div>
          <div className={`text-6xl font-black ${result.color}`}>{result.bmi}</div>
          <div className={`text-xl font-bold ${result.color}`}>{result.cat[lang]}</div>
          <div className="text-xs text-gray-400 pt-2">{lbl.ideal}</div>
        </div>
      )}
    </div>
  )
}

/* ─── Live tool map ────────────────────────────────────────────── */
const LIVE_TOOLS = {
  'word-counter': WordCounterTool,
  'password-generator': PasswordGeneratorTool,
  'age-calculator': AgeCalculatorTool,
  'bmi-calculator': BMICalculatorTool,
}

/* ─── Main Page ────────────────────────────────────────────────── */
export default function ToolPage({ slug, lang, t }) {
  const tool = tools.find(to => to.slug === slug)

  if (!tool) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold mb-2">Tool not found</h2>
        <Link to="/" className="text-brand-600 hover:underline">← {t.nav.home}</Link>
      </div>
    )
  }

  const category = categories.find(c => c.id === tool.categoryId)
  const Icon = ICONS[tool.icon] || FileText
  const LiveTool = LIVE_TOOLS[slug]
  const relatedTools = tools.filter(to => to.categoryId === tool.categoryId && to.id !== tool.id)

  return (
    <main className="max-w-3xl mx-auto px-4 py-12">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-8 flex-wrap">
        <Link to="/" className="hover:text-brand-600 transition-colors">{t.nav.home}</Link>
        <span>/</span>
        {category && (
          <Link to={`/categories/${category.slug}`} className="hover:text-brand-600 transition-colors">
            {category.name[lang]}
          </Link>
        )}
        <span>/</span>
        <span className="text-gray-900 dark:text-white font-medium">{tool.name[lang]}</span>
      </nav>

      {/* Header */}
      <div className="flex items-start gap-5 mb-8">
        <div className={`shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br ${category?.color || 'from-brand-500 to-purple-600'} flex items-center justify-center`}>
          <Icon className="w-7 h-7 text-white" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-1">{tool.name[lang]}</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">{tool.description[lang]}</p>
        </div>
      </div>

      {/* Tool Interface */}
      <div className="rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 md:p-8 mb-8">
        {LiveTool ? (
          <LiveTool lang={lang} />
        ) : (
          <div className="py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
              <Wrench className="w-7 h-7 text-gray-400" />
            </div>
            <h3 className="font-semibold text-lg mb-2">{t.tools.comingSoon}</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm">{t.tools.comingSoonDesc}</p>
          </div>
        )}
      </div>

      {/* How to use */}
      {tool.howTo?.[lang] && (
        <div className="rounded-2xl border bg-white dark:bg-gray-900 p-6 mb-8">
          <h2 className="font-bold text-base mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-brand-500" />
            {t.tools.howTo}
          </h2>
          <ol className="space-y-3">
            {tool.howTo[lang].map((step, i) => (
              <li key={i} className="flex items-center gap-3">
                <span className="shrink-0 w-7 h-7 rounded-full bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 text-sm font-bold flex items-center justify-center">
                  {i + 1}
                </span>
                <span className="text-sm text-gray-700 dark:text-gray-300">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Related tools */}
      {relatedTools.length > 0 && (
        <div>
          <h2 className="font-bold text-lg mb-4">{t.tools.related}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {relatedTools.map(rt => (
              <ToolCard key={rt.id} tool={rt} lang={lang} t={t} categoryColor={category?.color} />
            ))}
          </div>
        </div>
      )}
    </main>
  )
}
