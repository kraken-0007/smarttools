import { useSEO, useToolViews } from "../lib/seo"
import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, Wrench, HelpCircle, ChevronDown, UploadCloud, FileText, Image as ImageIcon, X } from 'lucide-react'
import tools from '../data/tools.json'
import categories from '../data/categories.json'
import ToolCard from '../components/ToolCard'
import Breadcrumb from '../components/Breadcrumb'
import { getIcon } from '../lib/icons'

/* ─── Constants ────────────────────────────────── */
const IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
const IMAGE_EXTS = ['.jpg', '.jpeg', '.png', '.webp', '.gif']
const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50 MB

/* ─── Upload Box Component (fixed) ─────────────── */
function UploadBox({ tool, lang, t }) {
  const [dragOver, setDragOver] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null) // File object
  const [previewUrl, setPreviewUrl] = useState(null)     // Object URL for image preview
  const [error, setError] = useState(null)
  const inputRef = useRef(null)

  // Determine accepted file types
  const isImageTool = tool.type === 'file-image'
  const acceptString = isImageTool
    ? IMAGE_EXTS.join(',')
    : tool.formats
      ? '.' + tool.formats.toLowerCase().replace(/,\s*/g, ',.')
      : '*'

  // Cleanup object URL to prevent memory leaks
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  const validateFile = (file) => {
    setError(null)

    // Size check
    if (file.size > MAX_FILE_SIZE) {
      const sizeMB = (MAX_FILE_SIZE / 1024 / 1024).toFixed(0)
      setError(lang === 'ar'
        ? `حجم الملف كبير جدا. الحد الأقصى ${sizeMB} ميجابايت.`
        : lang === 'fr'
          ? `Fichier trop volumineux. Maximum ${sizeMB} Mo.`
          : `File too large. Maximum ${sizeMB} MB.`)
      return false
    }

    // For image tools, validate type
    if (isImageTool) {
      const ext = '.' + file.name.split('.').pop().toLowerCase()
      const isValidType = IMAGE_TYPES.includes(file.type) || IMAGE_EXTS.includes(ext)
      if (!isValidType) {
        setError(lang === 'ar'
          ? 'صيغة غير مدعومة. المدعومة: JPG, JPEG, PNG, WEBP, GIF'
          : lang === 'fr'
            ? 'Format non supporté. Supportés: JPG, JPEG, PNG, WEBP, GIF'
            : 'Unsupported format. Supported: JPG, JPEG, PNG, WEBP, GIF')
        return false
      }
    }

    return true
  }

  const handleFile = (file) => {
    if (!file) return
    if (!validateFile(file)) {
      setSelectedFile(null)
      setPreviewUrl(null)
      return
    }

    // Cleanup previous preview
    if (previewUrl) URL.revokeObjectURL(previewUrl)

    // Create preview for images
    const ext = '.' + file.name.split('.').pop().toLowerCase()
    const isImage = IMAGE_TYPES.includes(file.type) || IMAGE_EXTS.includes(ext)

    if (isImage) {
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    } else {
      setPreviewUrl(null)
    }

    setSelectedFile(file)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handleSelect = (e) => {
    const file = e.target.files[0]
    if (file) handleFile(file)
  }

  const handleRemove = (e) => {
    e.stopPropagation()
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setSelectedFile(null)
    setPreviewUrl(null)
    setError(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  // Format file size
  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / 1024 / 1024).toFixed(1) + ' MB'
  }

  /* ── File selected view ── */
  if (selectedFile) {
    return (
      <div className="space-y-4">
        {/* Error message */}
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 text-sm">
            <X className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Image preview */}
        {previewUrl ? (
          <div className="relative rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
            <img
              src={previewUrl}
              alt={selectedFile.name}
              className="w-full max-h-80 object-contain"
            />
            <button
              onClick={handleRemove}
              className="absolute top-3 end-3 w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-4 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
            <div className="w-14 h-14 rounded-xl bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center shrink-0">
              <FileText className="w-7 h-7 text-blue-600 dark:text-blue-400" strokeWidth={1.6} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{selectedFile.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{formatSize(selectedFile.size)}</p>
            </div>
            <button onClick={handleRemove} className="shrink-0 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-gray-400 hover:text-red-500 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* File info + action bar */}
        {previewUrl && (
          <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-2 min-w-0">
              <ImageIcon className="w-4 h-4 text-gray-400 shrink-0" />
              <span className="text-xs text-gray-600 dark:text-gray-400 truncate">{selectedFile.name}</span>
              <span className="text-xs text-gray-400 shrink-0">· {formatSize(selectedFile.size)}</span>
            </div>
            <button onClick={handleRemove} className="shrink-0 text-xs text-gray-500 hover:text-red-500 transition-colors font-medium">
              {lang === 'ar' ? 'إزالة' : lang === 'fr' ? 'Supprimer' : 'Remove'}
            </button>
          </div>
        )}

        {/* Process button */}
        <button className="btn-primary w-full justify-center py-3.5 text-sm">
          {lang === 'ar' ? 'معالجة' : lang === 'fr' ? 'Traiter' : 'Process'}
        </button>
      </div>
    )
  }

  /* ── Empty upload view ── */
  return (
    <div>
      {/* Error message */}
      {error && (
        <div className="flex items-center gap-2 p-3 mb-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 text-sm">
          <X className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      <div
        className={`upload-box p-10 md:p-14 text-center cursor-pointer ${dragOver ? 'dragover' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter') inputRef.current?.click() }}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          onChange={handleSelect}
          accept={acceptString}
        />

        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center">
            <UploadCloud className="w-8 h-8 text-blue-600 dark:text-blue-400" strokeWidth={1.6} />
          </div>
          <div>
            <p className="text-lg font-bold text-gray-900 dark:text-white mb-1">
              {t.tools.uploadTitle}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
              {t.tools.uploadOr}
            </p>
          </div>
          <span className="btn-primary rounded-xl px-6 py-3 text-sm">
            {t.tools.uploadBtn}
          </span>
          {tool.formats && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
              {t.tools.uploadFormats}: {tool.formats}
            </p>
          )}
          {isImageTool && (
            <p className="text-xs text-gray-400 dark:text-gray-500">
              {lang === 'ar' ? 'اسحب وأفلت الصورة هنا' : lang === 'fr' ? 'Glissez-déposez votre image ici' : 'Drag & drop your image here'}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

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

/* ─── Tool Interface Renderer ──────────────────── */
function ToolInterface({ tool, lang, t }) {
  const LiveTool = LIVE_TOOLS[tool.slug]
  if (LiveTool) return <LiveTool lang={lang} />

  if (tool.type === 'file-pdf' || tool.type === 'file-image' || tool.type === 'file-doc' || tool.type === 'file-video' || tool.type === 'file-audio') {
    return <UploadBox tool={tool} lang={lang} t={t} />
  }

  if (tool.type === 'text') {
    return (
      <div className="space-y-4">
        <textarea
          rows={10}
          placeholder={lang === 'ar' ? 'اكتب أو الصق النص هنا...' : lang === 'fr' ? 'Tapez ou collez votre texte ici...' : 'Type or paste your text here...'}
          className="input-field resize-none text-sm leading-relaxed"
        />
      </div>
    )
  }

  if (tool.type === 'calculator') {
    return (
      <div className="py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-5">
          <Wrench className="w-7 h-7 text-gray-400" />
        </div>
        <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2">{t.tools.comingSoon}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">{t.tools.comingSoonDesc}</p>
      </div>
    )
  }

  return (
    <div className="py-16 text-center">
      <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-5">
        <Wrench className="w-7 h-7 text-gray-400" />
      </div>
      <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2">{t.tools.comingSoon}</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400">{t.tools.comingSoonDesc}</p>
    </div>
  )
}

/* ─── FAQ Item ─────────────────────────────────── */
function FAQItem({ question, answer }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
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

  // Related tools: same category, exclude current, limit to 6
  const relatedTools = tools
    .filter(to => to.categoryId === tool.categoryId && to.id !== tool.id)
    .slice(0, 6)

  const faqs = getFAQ(tool, lang)
  const catMap = Object.fromEntries(categories.map(c => [c.id, c]))

  // SEO: unique title, description, canonical, OG, Twitter
  const seoTitle = tool.name[lang]
  const seoDesc = tool.description[lang]
  const canonicalUrl = `/tools/${tool.slug}`
  useSEO({ title: seoTitle, description: seoDesc, canonical: canonicalUrl })

  // Usage counter: increments on every page open
  const views = useToolViews(tool.slug)

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-6 py-6 md:py-8 animate-fade-in">
      <Breadcrumb items={[
        { label: t.breadcrumb.home, href: '/' },
        { label: t.nav.categories, href: '/categories' },
        category && { label: category.name[lang], href: `/categories/${category.slug}` },
        { label: tool.name[lang] },
      ].filter(Boolean)} />

      <div className="flex items-start gap-4 mb-8">
        <div className={`shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br ${category?.color || 'from-blue-600 to-blue-500'} flex items-center justify-center shadow-sm`}>
          <Icon className="w-7 h-7 text-white" strokeWidth={1.6} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white leading-tight">{tool.name[lang]}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">{tool.description[lang]}</p>
          {category && (
            <Link to={`/categories/${category.slug}`} className={`inline-flex items-center gap-1 mt-2 text-xs font-semibold px-2.5 py-1 rounded-full ${category.bg} ${category.text} ${category.border} border`}>
              <Icon className="w-3 h-3" strokeWidth={2} /> {category.name[lang]}
            </Link>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-6 md:p-8 mb-6 shadow-card">
        <ToolInterface tool={tool} lang={lang} t={t} />
      </div>

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

      {relatedTools.length > 0 && (
        <div>
          <h2 className="font-bold text-base text-gray-900 dark:text-white mb-4">{t.tools.related}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {relatedTools.map(rt => (
              <ToolCard key={rt.id} tool={rt} lang={lang} t={t} category={catMap[rt.categoryId]} showNewBadge={false} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
