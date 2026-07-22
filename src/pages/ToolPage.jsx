import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, Wrench, HelpCircle, ChevronDown } from 'lucide-react'
import tools from '../data/tools.json'
import categories from '../data/categories.json'
import ToolCard from '../components/ToolCard'
import Breadcrumb from '../components/Breadcrumb'
import { getIcon } from '../lib/icons'

/* ─── Live Tool: Word Counter ──────────────────── */
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
        className="input-field resize-none text-sm leading-relaxed"
      />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[words, chars, sentences, paragraphs].map((val, i) => (
          <div key={i} className="bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 rounded-xl p-4 text-center">
            <div className="text-2xl font-extrabold text-blue-600 dark:text-blue-400">{val}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{labels[i]}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── Live Tool: Password Generator ───────────── */
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
    setPassword(pwd); setCopied(false)
  }
  const copy = () => { navigator.clipboard.writeText(password); setCopied(true); setTimeout(() => setCopied(false), 2000) }
  const lbl = {
    en: { length: 'Length', upper: 'Uppercase', nums: 'Numbers', syms: 'Symbols', gen: 'Generate Password', copy: 'Copy', copied: 'Copied!' },
    fr: { length: 'Longueur', upper: 'Majuscules', nums: 'Chiffres', syms: 'Symboles', gen: 'Générer', copy: 'Copier', copied: 'Copié !' },
    ar: { length: 'الطول', upper: 'كبيرة', nums: 'أرقام', syms: 'رموز', gen: 'توليد', copy: 'نسخ', copied: 'تم!' },
  }[lang]
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
          {lbl.length}: <span className="text-blue-600 font-bold">{length}</span>
        </label>
        <input type="range" min={8} max={32} value={length} onChange={e => setLength(+e.target.value)} className="flex-1 accent-blue-600 h-2" />
      </div>
      <div className="flex flex-wrap gap-5">
        {[[lbl.upper, useUpper, setUpper], [lbl.nums, useNumbers, setNumbers], [lbl.syms, useSymbols, setSymbols]].map(([label, val, setter]) => (
          <label key={label} className="flex items-center gap-2 text-sm cursor-pointer select-none text-gray-700 dark:text-gray-300">
            <input type="checkbox" checked={val} onChange={e => setter(e.target.checked)} className="accent-blue-600 w-4 h-4 rounded" />
            {label}
          </label>
        ))}
      </div>
      <button onClick={generate} className="btn-primary w-full justify-center py-3">{lbl.gen}</button>
      {password && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-800 border-2 border-dashed border-gray-200 dark:border-gray-700 font-mono text-sm break-all">
          <span className="flex-1 select-all text-gray-900 dark:text-white">{password}</span>
          <button onClick={copy} className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${copied ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 hover:bg-blue-200'}`}>
            {copied ? lbl.copied : lbl.copy}
          </button>
        </div>
      )}
    </div>
  )
}

/* ─── Live Tool: Age Calculator ───────────────── */
function AgeCalculatorTool({ lang }) {
  const [dob, setDob] = useState('')
  const [result, setResult] = useState(null)
  const calculate = () => {
    if (!dob) return
    const birth = new Date(dob), now = new Date()
    let years = now.getFullYear() - birth.getFullYear()
    let months = now.getMonth() - birth.getMonth()
    let days = now.getDate() - birth.getDate()
    if (days < 0) { months--; days += new Date(now.getFullYear(), now.getMonth(), 0).getDate() }
    if (months < 0) { years--; months += 12 }
    if (years < 0) return
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
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{lbl.dob}</label>
        <input type="date" value={dob} max={new Date().toISOString().split('T')[0]} onChange={e => setDob(e.target.value)} className="input-field" />
      </div>
      <button onClick={calculate} className="btn-primary w-full justify-center py-3">{lbl.calc}</button>
      {result && (
        <div className="grid grid-cols-3 gap-3">
          {[[result.years, lbl.years], [result.months, lbl.months], [result.days, lbl.days]].map(([val, label], i) => (
            <div key={i} className="bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 rounded-xl p-4 text-center">
              <div className="text-3xl font-extrabold text-blue-600 dark:text-blue-400">{val}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{label}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ─── Live Tool: BMI Calculator ───────────────── */
function BMICalculatorTool({ lang }) {
  const [height, setHeight] = useState('')
  const [weight, setWeight] = useState('')
  const [result, setResult] = useState(null)
  const calculate = () => {
    const h = parseFloat(height) / 100, w = parseFloat(weight)
    if (!h || !w || h <= 0 || w <= 0) return
    const bmi = (w / (h * h)).toFixed(1)
    let cat, color
    if (bmi < 18.5) { cat = { en: 'Underweight', fr: 'Sous-poids', ar: 'نقص الوزن' }; color = 'text-blue-500' }
    else if (bmi < 25) { cat = { en: 'Normal weight', fr: 'Poids normal', ar: 'وزن طبيعي' }; color = 'text-green-500' }
    else if (bmi < 30) { cat = { en: 'Overweight', fr: 'Surpoids', ar: 'زيادة الوزن' }; color = 'text-amber-500' }
    else { cat = { en: 'Obese', fr: 'Obèse', ar: 'سمنة' }; color = 'text-red-500' }
    setResult({ bmi, cat, color })
  }
  const lbl = {
    en: { h: 'Height (cm)', w: 'Weight (kg)', calc: 'Calculate BMI', your: 'Your BMI', range: '18.5 – 24.9 is ideal' },
    fr: { h: 'Taille (cm)', w: 'Poids (kg)', calc: "Calculer l'IMC", your: 'Votre IMC', range: '18.5 – 24.9 est idéal' },
    ar: { h: 'الطول (سم)', w: 'الوزن (كجم)', calc: 'احسب المؤشر', your: 'مؤشرك', range: '18.5 – 24.9 مثالي' },
  }[lang]
  return (
    <div className="space-y-4 max-w-sm mx-auto">
      <div className="grid grid-cols-2 gap-4">
        {[[lbl.h, height, setHeight, '175'], [lbl.w, weight, setWeight, '70']].map(([label, val, setter, ph]) => (
          <div key={label}>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{label}</label>
            <input type="number" value={val} onChange={e => setter(e.target.value)} placeholder={ph} className="input-field" />
          </div>
        ))}
      </div>
      <button onClick={calculate} className="btn-primary w-full justify-center py-3">{lbl.calc}</button>
      {result && (
        <div className="rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 text-center space-y-1">
          <p className="text-xs text-gray-500 uppercase tracking-widest">{lbl.your}</p>
          <p className={`text-6xl font-black ${result.color}`}>{result.bmi}</p>
          <p className={`text-lg font-bold ${result.color}`}>{result.cat[lang]}</p>
          <p className="text-xs text-gray-400 pt-2">{lbl.range}</p>
        </div>
      )}
    </div>
  )
}

const LIVE_TOOLS = {
  'word-counter': WordCounterTool,
  'password-generator': PasswordGeneratorTool,
  'age-calculator': AgeCalculatorTool,
  'bmi-calculator': BMICalculatorTool,
}

/* ─── FAQ Accordion ───────────────────────────── */
function FAQItem({ question, answer }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-start bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
      >
        <span className="text-sm font-semibold text-gray-900 dark:text-white">{question}</span>
        <ChevronDown className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="px-5 pb-4 pt-0 bg-white dark:bg-gray-900 text-sm text-gray-600 dark:text-gray-400 leading-relaxed border-t border-gray-100 dark:border-gray-800">
          {answer}
        </div>
      )}
    </div>
  )
}

function getFAQ(tool, lang) {
  const faqs = {
    'word-counter': {
      en: [
        { q: 'Is the word counter accurate?', a: 'Yes, it counts words separated by spaces and handles multiple spaces, tabs, and newlines correctly.' },
        { q: 'Does it support Arabic text?', a: 'Yes! The word counter works with all languages including Arabic, French and English.' },
        { q: 'Is my text stored?', a: 'No. All processing happens in your browser. Nothing is sent to any server.' },
      ],
      fr: [
        { q: 'Le compteur est-il précis ?', a: 'Oui, il compte les mots séparés par des espaces et gère correctement les espaces multiples.' },
        { q: 'Mon texte est-il sauvegardé ?', a: 'Non. Tout se passe dans votre navigateur. Rien n\'est envoyé à un serveur.' },
        { q: 'Prend-il en charge l\'arabe ?', a: 'Oui, il fonctionne avec toutes les langues.' },
      ],
      ar: [
        { q: 'هل العداد دقيق؟', a: 'نعم، يحسب الكلمات المفصولة بمسافات ويعالج المسافات المتعددة بشكل صحيح.' },
        { q: 'هل يتم حفظ النص الخاص بي؟', a: 'لا. كل شيء يتم في متصفحك ولا يتم إرسال أي شيء إلى أي خادم.' },
        { q: 'هل يدعم اللغة العربية؟', a: 'نعم، يعمل مع جميع اللغات.' },
      ]
    }
  }
  return faqs[tool.slug]?.[lang] || [
    { q: lang === 'ar' ? 'هل هذه الأداة مجانية؟' : lang === 'fr' ? 'Cet outil est-il gratuit ?' : 'Is this tool free?', a: lang === 'ar' ? 'نعم، مجانية 100% بدون قيود.' : lang === 'fr' ? 'Oui, 100% gratuit sans aucune restriction.' : 'Yes, 100% free with no restrictions.' },
    { q: lang === 'ar' ? 'هل أحتاج إلى تسجيل؟' : lang === 'fr' ? 'Ai-je besoin de m\'inscrire ?' : 'Do I need to register?', a: lang === 'ar' ? 'لا، يمكنك استخدام الأداة مباشرة.' : lang === 'fr' ? 'Non, utilisez l\'outil directement.' : 'No, just open and use it instantly.' },
    { q: lang === 'ar' ? 'هل ملفاتي آمنة؟' : lang === 'fr' ? 'Mes fichiers sont-ils sécurisés ?' : 'Are my files safe?', a: lang === 'ar' ? 'نعم، يتم معالجة كل شيء في متصفحك.' : lang === 'fr' ? 'Oui, tout est traité dans votre navigateur.' : 'Yes, everything is processed in your browser.' },
  ]
}

/* ─── Main Page ───────────────────────────────── */
export default function ToolPage({ slug, lang, t }) {
  const tool = tools.find(to => to.slug === slug)

  if (!tool) return (
    <div className="p-8 text-center">
      <p className="text-gray-500 mb-4">Tool not found.</p>
      <Link to="/" className="text-blue-600 hover:underline text-sm">{t.breadcrumb.home}</Link>
    </div>
  )

  const category = categories.find(c => c.id === tool.categoryId)
  const Icon = getIcon(tool.icon)
  const LiveTool = LIVE_TOOLS[slug]
  const relatedTools = tools.filter(to => to.categoryId === tool.categoryId && to.id !== tool.id)
  const faqs = getFAQ(tool, lang)
  const catMap = Object.fromEntries(categories.map(c => [c.id, c]))

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-6 py-8 animate-fade-in">
      {/* Breadcrumb */}
      <Breadcrumb items={[
        { label: t.breadcrumb.home, href: '/' },
        { label: t.nav.categories, href: '/categories' },
        category && { label: category.name[lang], href: `/categories/${category.slug}` },
        { label: tool.name[lang] },
      ].filter(Boolean)} />

      {/* Tool header */}
      <div className="flex items-start gap-4 mb-8">
        <div className={`shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br ${category?.color || 'from-blue-600 to-blue-500'} flex items-center justify-center shadow-sm`}>
          <Icon className="w-7 h-7 text-white" strokeWidth={1.6} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white leading-tight">{tool.name[lang]}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">{tool.description[lang]}</p>
          {category && (
            <Link to={`/categories/${category.slug}`} className={`inline-flex items-center gap-1 mt-2 text-xs font-semibold px-2.5 py-1 rounded-full ${category.bg} ${category.text} ${category.border} border`}>
              {category.emoji} {category.name[lang]}
            </Link>
          )}
        </div>
      </div>

      {/* ── Tool Interface ── */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-6 md:p-8 mb-6 shadow-card">
        {LiveTool ? (
          <LiveTool lang={lang} />
        ) : (
          <div className="py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-5">
              <Wrench className="w-7 h-7 text-gray-400" />
            </div>
            <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2">{t.tools.comingSoon}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t.tools.comingSoonDesc}</p>
          </div>
        )}
      </div>

      {/* ── How to use ── */}
      {tool.howTo?.[lang] && (
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-6 mb-6 shadow-card">
          <h2 className="font-bold text-base text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-blue-500" />
            {t.tools.howTo}
          </h2>
          <ol className="space-y-3">
            {tool.howTo[lang].map((step, i) => (
              <li key={i} className="flex items-center gap-3">
                <span className="shrink-0 w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 text-xs font-bold flex items-center justify-center">
                  {i + 1}
                </span>
                <span className="text-sm text-gray-700 dark:text-gray-300">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* ── FAQ ── */}
      <div className="mb-8">
        <h2 className="font-bold text-base text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-blue-500" />
          {t.tools.faq}
        </h2>
        <div className="space-y-2">
          {faqs.map((faq, i) => (
            <FAQItem key={i} question={faq.q} answer={faq.a} />
          ))}
        </div>
      </div>

      {/* ── Related Tools ── */}
      {relatedTools.length > 0 && (
        <div>
          <h2 className="font-bold text-base text-gray-900 dark:text-white mb-4">{t.tools.related}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {relatedTools.map(rt => (
              <ToolCard key={rt.id} tool={rt} lang={lang} t={t} category={catMap[rt.categoryId]} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
