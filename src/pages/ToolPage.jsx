import { useSEO, useToolViews } from '../lib/seo'
import {
  ResizeImageEditor, CropImageEditor, CompressImageEditor,
  ImageConvertEditor, ImageUploadZone,
} from '../components/ImageEditor.jsx'
import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, Wrench, HelpCircle, ChevronDown } from 'lucide-react'
import tools from '../data/tools.json'
import categories from '../data/categories.json'
import ToolCard from '../components/ToolCard'
import Breadcrumb from '../components/Breadcrumb'
import { getIcon } from '../lib/icons'

/* Import shared components */
import { FileUploader, ProcessButton, ResultDisplay, ErrorDisplay, useToolProcessor } from '../lib/processors/shared.jsx'

/* Import real processors */
import { downloadBlob, getOutputFilename, formatFileSize } from '../lib/processors/image.js'
import { pdfToJpg, jpgToPdf, mergePDFs, splitPDF, compressPDF, pdfToWord, wordToPdf } from '../lib/processors/pdf.js'
import { countWords, countCharacters, convertCase } from '../lib/processors/text.js'
import { calculateAge, calculateBMI, calculatePercentage } from '../lib/processors/calculators.js'

/* ═══════════════════════════════════════════════════
   PDF TOOLS
   ═══════════════════════════════════════════════════ */

/* ── PDF to JPG ── */
function PdfToJpgTool({ lang }) {
  const [file, setFile] = useState(null)
  const { loading, results, error, process, reset } = useToolProcessor(async (f) => {
    const pages = await pdfToJpg(f)
    return pages.map((p, i) => ({ blob: p.blob, filename: `page-${i + 1}.jpg` }))
  }, lang)

  const handleReset = () => { setFile(null); reset() }

  return (
    <div className="space-y-4">
      {!results && !error && (
        <>
          <FileUploader accept="application/pdf" onFiles={setFile} lang={lang} hint="PDF · Max 50MB" />
          {file && <ProcessButton onClick={() => process(file)} loading={loading} label={lang === 'ar' ? 'تحويل إلى JPG' : lang === 'fr' ? 'Convertir en JPG' : 'Convert to JPG'} />}
        </>
      )}
      {loading && <ProcessingIndicator />}
      {error && <ErrorDisplay message={error} lang={lang} />}
      {results && <ResultDisplay results={results} lang={lang} />}
      {(results || error) && <button onClick={handleReset} className="text-sm text-[#6B7280] dark:text-[#A1A1AA] hover:text-blue-600 dark:hover:text-blue-400 font-medium">{lang === 'ar' ? 'ابدأ من جديد' : lang === 'fr' ? 'Recommencer' : 'Start over'}</button>}
    </div>
  )
}

/* ── JPG to PDF ── */
function JpgToPdfTool({ lang }) {
  const [files, setFiles] = useState([])
  const { loading, results, error, process, reset } = useToolProcessor(async (imgs) => {
    const blob = await jpgToPdf(imgs)
    return { blob, filename: 'converted.pdf' }
  }, lang)

  const handleReset = () => { setFiles([]); reset() }

  return (
    <div className="space-y-4">
      {!results && !error && (
        <>
          <FileUploader accept="image/jpeg,image/png,image/webp" multiple onFiles={setFiles} lang={lang} hint="JPG, PNG, WEBP · Multiple files supported" />
          {files.length > 0 && <ProcessButton onClick={() => process(files)} loading={loading} label={lang === 'ar' ? 'تحويل إلى PDF' : lang === 'fr' ? 'Convertir en PDF' : 'Convert to PDF'} />}
        </>
      )}
      {loading && <ProcessingIndicator />}
      {error && <ErrorDisplay message={error} lang={lang} />}
      {results && <ResultDisplay results={results} lang={lang} />}
      {(results || error) && <button onClick={handleReset} className="text-sm text-[#6B7280] dark:text-[#A1A1AA] hover:text-blue-600 dark:hover:text-blue-400 font-medium">{lang === 'ar' ? 'ابدأ من جديد' : lang === 'fr' ? 'Recommencer' : 'Start over'}</button>}
    </div>
  )
}

/* ── Merge PDF ── */
function MergePdfTool({ lang }) {
  const [files, setFiles] = useState([])
  const { loading, results, error, process, reset } = useToolProcessor(async (pdfs) => {
    const blob = await mergePDFs(pdfs)
    return { blob, filename: 'merged.pdf' }
  }, lang)

  const handleReset = () => { setFiles([]); reset() }

  return (
    <div className="space-y-4">
      {!results && !error && (
        <>
          <FileUploader accept="application/pdf" multiple onFiles={setFiles} lang={lang} hint="Select 2+ PDF files to merge · Order matters" />
          {files.length >= 2 && <ProcessButton onClick={() => process(files)} loading={loading} label={lang === 'ar' ? 'دمج PDF' : lang === 'fr' ? 'Fusionner PDF' : 'Merge PDF'} />}
          {files.length === 1 && <p className="text-xs text-gray-400 text-center">{lang === 'ar' ? 'اختر ملف PDF آخر على الأقل' : lang === 'fr' ? 'Sélectionnez au moins un autre PDF' : 'Select at least one more PDF'}</p>}
        </>
      )}
      {loading && <ProcessingIndicator />}
      {error && <ErrorDisplay message={error} lang={lang} />}
      {results && <ResultDisplay results={results} lang={lang} />}
      {(results || error) && <button onClick={handleReset} className="text-sm text-[#6B7280] dark:text-[#A1A1AA] hover:text-blue-600 dark:hover:text-blue-400 font-medium">{lang === 'ar' ? 'ابدأ من جديد' : lang === 'fr' ? 'Recommencer' : 'Start over'}</button>}
    </div>
  )
}

/* ── Split PDF ── */
function SplitPdfTool({ lang }) {
  const [file, setFile] = useState(null)
  const [pageRanges, setPageRanges] = useState('')
  const { loading, results, error, process, reset } = useToolProcessor(async (input) => {
    const pdfs = await splitPDF(input.file, input.ranges || null)
    return pdfs
  }, lang)

  const handleReset = () => { setFile(null); setPageRanges(''); reset() }

  return (
    <div className="space-y-4">
      {!results && !error && (
        <>
          <FileUploader accept="application/pdf" onFiles={setFile} lang={lang} hint="PDF · Max 50MB" />
          {file && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-[#111111] dark:text-[#FAFAFA] mb-1.5">
                  {lang === 'ar' ? 'نطاقات الصفحات (اختياري)' : lang === 'fr' ? 'Plages de pages (optionnel)' : 'Page ranges (optional)'}
                </label>
                <input
                  type="text"
                  value={pageRanges}
                  onChange={e => setPageRanges(e.target.value)}
                  placeholder="e.g. 1-3, 5, 7-9 (leave empty to split all pages)"
                  className="input-field"
                />
                <p className="text-xs text-gray-400 mt-1">
                  {lang === 'ar' ? 'اتركه فارغاً لتقسيم كل صفحة على حدة' : lang === 'fr' ? 'Laissez vide pour diviser toutes les pages' : 'Leave empty to split into individual pages'}
                </p>
              </div>
              <ProcessButton onClick={() => process({ file, ranges: pageRanges.trim() || null })} loading={loading} label={lang === 'ar' ? 'تقسيم PDF' : lang === 'fr' ? 'Diviser PDF' : 'Split PDF'} />
            </div>
          )}
        </>
      )}
      {loading && <ProcessingIndicator />}
      {error && <ErrorDisplay message={error} lang={lang} />}
      {results && <ResultDisplay results={results} lang={lang} />}
      {(results || error) && <button onClick={handleReset} className="text-sm text-[#6B7280] dark:text-[#A1A1AA] hover:text-blue-600 dark:hover:text-blue-400 font-medium">{lang === 'ar' ? 'ابدأ من جديد' : lang === 'fr' ? 'Recommencer' : 'Start over'}</button>}
    </div>
  )
}

/* ── Compress PDF ── */
function CompressPdfTool({ lang }) {
  const [file, setFile] = useState(null)
  const { loading, results, error, process, reset } = useToolProcessor(async (f) => {
    const blob = await compressPDF(f)
    const origSize = f.size
    const newSize = blob.size
    const saved = Math.round((1 - newSize / origSize) * 100)
    return { blob, filename: 'compressed.pdf', saved }
  }, lang)

  const handleReset = () => { setFile(null); reset() }

  return (
    <div className="space-y-4">
      {!results && !error && (
        <>
          <FileUploader accept="application/pdf" onFiles={setFile} lang={lang} hint="PDF · Max 50MB" />
          {file && <ProcessButton onClick={() => process(file)} loading={loading} label={lang === 'ar' ? 'ضغط PDF' : lang === 'fr' ? 'Compresser PDF' : 'Compress PDF'} />}
        </>
      )}
      {loading && <ProcessingIndicator />}
      {error && <ErrorDisplay message={error} lang={lang} />}
      {results && (
        <div className="space-y-3 animate-fade-in">
          <div className="flex items-center gap-2 p-3 rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 text-green-700 dark:text-green-400 text-sm font-medium">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            {lang === 'ar' ? 'تم الضغط بنجاح!' : lang === 'fr' ? 'Compression réussie !' : 'Compression complete!'}
            {results[0].saved > 0 && (
              <span className="ms-1 text-xs">
                ({lang === 'ar' ? `تم تقليل الحجم بنسبة ${results[0].saved}%` : lang === 'fr' ? `Réduit de ${results[0].saved}%` : `Reduced by ${results[0].saved}%`})
              </span>
            )}
          </div>
          <ResultDisplay results={results} lang={lang} />
        </div>
      )}
      {(results || error) && <button onClick={handleReset} className="text-sm text-[#6B7280] dark:text-[#A1A1AA] hover:text-blue-600 dark:hover:text-blue-400 font-medium">{lang === 'ar' ? 'ابدأ من جديد' : lang === 'fr' ? 'Recommencer' : 'Start over'}</button>}
    </div>
  )
}

/* ── PDF to Word ── */
function PdfToWordTool({ lang }) {
  const [file, setFile] = useState(null)
  const { loading, results, error, process, reset } = useToolProcessor(async (f) => {
    const blob = await pdfToWord(f)
    return { blob, filename: getOutputFilename(f.name, 'doc') }
  }, lang)

  const handleReset = () => { setFile(null); reset() }

  return (
    <div className="space-y-4">
      {!results && !error && (
        <>
          <FileUploader accept="application/pdf" onFiles={setFile} lang={lang} hint="PDF · Extracts text content to Word format" />
          {file && <ProcessButton onClick={() => process(file)} loading={loading} label={lang === 'ar' ? 'تحويل إلى Word' : lang === 'fr' ? 'Convertir en Word' : 'Convert to Word'} />}
        </>
      )}
      {loading && <ProcessingIndicator />}
      {error && <ErrorDisplay message={error} lang={lang} />}
      {results && <ResultDisplay results={results} lang={lang} />}
      {(results || error) && <button onClick={handleReset} className="text-sm text-[#6B7280] dark:text-[#A1A1AA] hover:text-blue-600 dark:hover:text-blue-400 font-medium">{lang === 'ar' ? 'ابدأ من جديد' : lang === 'fr' ? 'Recommencer' : 'Start over'}</button>}
    </div>
  )
}

/* ── Word to PDF ── */
function WordToPdfTool({ lang }) {
  const [file, setFile] = useState(null)
  const { loading, results, error, process, reset } = useToolProcessor(async (f) => {
    const blob = await wordToPdf(f)
    return { blob, filename: getOutputFilename(f.name, 'pdf') }
  }, lang)

  const handleReset = () => { setFile(null); reset() }

  return (
    <div className="space-y-4">
      {!results && !error && (
        <>
          <FileUploader accept=".doc,.docx,.txt,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain" onFiles={setFile} lang={lang} hint="DOC, DOCX, TXT · Converts text to PDF" />
          {file && <ProcessButton onClick={() => process(file)} loading={loading} label={lang === 'ar' ? 'تحويل إلى PDF' : lang === 'fr' ? 'Convertir en PDF' : 'Convert to PDF'} />}
        </>
      )}
      {loading && <ProcessingIndicator />}
      {error && <ErrorDisplay message={error} lang={lang} />}
      {results && <ResultDisplay results={results} lang={lang} />}
      {(results || error) && <button onClick={handleReset} className="text-sm text-[#6B7280] dark:text-[#A1A1AA] hover:text-blue-600 dark:hover:text-blue-400 font-medium">{lang === 'ar' ? 'ابدأ من جديد' : lang === 'fr' ? 'Recommencer' : 'Start over'}</button>}
    </div>
  )
}

/* ═══════════════════════════════════════════════════
   IMAGE TOOLS
   ═══════════════════════════════════════════════════ */

/* ── Compress Image ── */
function CompressImageTool({ lang }) {
  const [file, setFile] = useState(null)
  if (!file) return <ImageUploadZone onFile={setFile} lang={lang} />
  return <CompressImageEditor file={file} lang={lang} onReset={() => setFile(null)} />
}

/* ── Resize Image ── */
function ResizeImageTool({ lang }) {
  const [file, setFile] = useState(null)
  if (!file) return <ImageUploadZone onFile={setFile} lang={lang} />
  return <ResizeImageEditor file={file} lang={lang} onReset={() => setFile(null)} />
}

/* ── Crop Image ── */
function CropImageTool({ lang }) {
  const [file, setFile] = useState(null)
  if (!file) return <ImageUploadZone onFile={setFile} lang={lang} />
  return <CropImageEditor file={file} lang={lang} onReset={() => setFile(null)} />
}

/* ── Image Format Converter (shared for JPG→PNG, PNG→JPG, WEBP→JPG) ── */
function ImageConvertTool({ lang, targetExt, outputMime }) {
  const [file, setFile] = useState(null)
  if (!file) return <ImageUploadZone onFile={setFile} lang={lang} />
  return <ImageConvertEditor file={file} lang={lang} targetExt={targetExt} outputMime={outputMime} onReset={() => setFile(null)} />
}

/* ═══════════════════════════════════════════════════
   TEXT TOOLS
   ═══════════════════════════════════════════════════ */

/* ── Word Counter ── */
function WordCounterTool({ lang }) {
  const [text, setText] = useState('')
  const stats = countWords(text)
  const labels = {
    en: ['Words', 'Characters', 'No Spaces', 'Sentences', 'Paragraphs', 'Reading time'],
    fr: ['Mots', 'Caractères', 'Sans espaces', 'Phrases', 'Paragraphes', 'Temps de lecture'],
    ar: ['كلمات', 'أحرف', 'بدون مسافات', 'جمل', 'فقرات', 'وقت القراءة'],
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
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { label: labels[0], value: stats.words },
          { label: labels[1], value: stats.characters },
          { label: labels[2], value: stats.charactersNoSpaces },
          { label: labels[3], value: stats.sentences },
          { label: labels[4], value: stats.paragraphs },
          { label: labels[5], value: `${stats.readingTime} min` },
        ].map((s, i) => (
          <div key={i} className="bg-[#F7F8FA] dark:bg-[#18181B] rounded-xl p-3 text-center border border-[#E5E7EB] dark:border-[#27272A]">
            <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{s.value}</p>
            <p className="text-xs text-[#6B7280] dark:text-[#A1A1AA] mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Character Counter ── */
function CharacterCounterTool({ lang }) {
  const [text, setText] = useState('')
  const stats = countCharacters(text)
  const labels = {
    en: ['Characters', 'No Spaces', 'Letters', 'Digits', 'Spaces', 'Lines', 'Special'],
    fr: ['Caractères', 'Sans espaces', 'Lettres', 'Chiffres', 'Espaces', 'Lignes', 'Spéciaux'],
    ar: ['أحرف', 'بدون مسافات', 'حروف', 'أرقام', 'مسافات', 'أسطر', 'رموز خاصة'],
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
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: labels[0], value: stats.characters },
          { label: labels[1], value: stats.charactersNoSpaces },
          { label: labels[2], value: stats.letters },
          { label: labels[3], value: stats.digits },
          { label: labels[4], value: stats.spaces },
          { label: labels[5], value: stats.lines },
          { label: labels[6], value: stats.specialChars },
        ].map((s, i) => (
          <div key={i} className="bg-[#F7F8FA] dark:bg-[#18181B] rounded-xl p-3 text-center border border-[#E5E7EB] dark:border-[#27272A]">
            <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{s.value}</p>
            <p className="text-xs text-[#6B7280] dark:text-[#A1A1AA] mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Case Converter ── */
function CaseConverterTool({ lang }) {
  const [text, setText] = useState('')
  const [result, setResult] = useState('')

  const modes = [
    { id: 'upper', label: lang === 'ar' ? 'أحرف كبيرة' : lang === 'fr' ? 'MAJUSCULE' : 'UPPERCASE' },
    { id: 'lower', label: lang === 'ar' ? 'أحرف صغيرة' : lang === 'fr' ? 'minuscule' : 'lowercase' },
    { id: 'title', label: lang === 'ar' ? 'حالة العنوان' : lang === 'fr' ? 'Titre' : 'Title Case' },
    { id: 'sentence', label: lang === 'ar' ? 'حالة الجملة' : lang === 'fr' ? 'Phrase' : 'Sentence case' },
    { id: 'camel', label: 'camelCase' },
    { id: 'pascal', label: 'PascalCase' },
    { id: 'snake', label: 'snake_case' },
    { id: 'kebab', label: 'kebab-case' },
    { id: 'alternating', label: lang === 'ar' ? 'متناوب' : lang === 'fr' ? 'Alterné' : 'aLtErNaTiNg' },
  ]

  const handleConvert = (mode) => {
    setResult(convertCase(text, mode))
  }

  const copyResult = () => {
    navigator.clipboard.writeText(result)
  }

  const downloadResult = () => {
    const blob = new Blob([result], { type: 'text/plain' })
    downloadBlob(blob, 'converted-text.txt')
  }

  return (
    <div className="space-y-4">
      <textarea
        value={text}
        onChange={e => { setText(e.target.value); setResult('') }}
        rows={6}
        placeholder={lang === 'ar' ? 'اكتب أو الصق النص هنا...' : lang === 'fr' ? 'Tapez ou collez votre texte ici...' : 'Type or paste your text here...'}
        className="input-field resize-none text-sm leading-relaxed"
      />
      <div className="flex flex-wrap gap-2">
        {modes.map(m => (
          <button key={m.id} onClick={() => handleConvert(m.id)} className="px-3 py-2 rounded-lg text-xs font-medium bg-[#F7F8FA] dark:bg-[#18181B] text-[#111111] dark:text-[#FAFAFA] hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-700 dark:hover:text-blue-300 transition-colors">
            {m.label}
          </button>
        ))}
      </div>
      {result && (
        <div className="space-y-3 animate-fade-in">
          <div className="p-4 rounded-xl bg-[#F7F8FA] dark:bg-[#18181B] border border-[#E5E7EB] dark:border-[#27272A] min-h-[100px]">
            <p className="text-sm text-[#111111] dark:text-[#FAFAFA] whitespace-pre-wrap break-words">{result}</p>
          </div>
          <div className="flex gap-3">
            <button onClick={copyResult} className="btn-primary rounded-xl px-5 py-2.5 text-sm flex-1">
              {lang === 'ar' ? 'نسخ' : lang === 'fr' ? 'Copier' : 'Copy'}
            </button>
            <button onClick={downloadResult} className="btn-ghost rounded-xl px-5 py-2.5 text-sm border border-[#E5E7EB] dark:border-[#27272A]">
              {lang === 'ar' ? 'تحميل' : lang === 'fr' ? 'Télécharger' : 'Download'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════
   CALCULATORS
   ═══════════════════════════════════════════════════ */

/* ── Age Calculator ── */
function AgeCalculatorTool({ lang }) {
  const [birthDate, setBirthDate] = useState('')
  const [result, setResult] = useState(null)

  const calculate = () => {
    if (!birthDate) return
    const r = calculateAge(birthDate)
    setResult(r)
  }

  const labels = {
    en: { label: 'Date of Birth', calc: 'Calculate', years: 'Years', months: 'Months', days: 'Days', totalDays: 'Total Days', totalMonths: 'Total Months', totalWeeks: 'Total Weeks', totalHours: 'Total Hours', nextBday: 'Days to next birthday', enter: 'Enter your birth date' },
    fr: { label: 'Date de naissance', calc: 'Calculer', years: 'Ans', months: 'Mois', days: 'Jours', totalDays: 'Jours totaux', totalMonths: 'Mois totaux', totalWeeks: 'Semaines totales', totalHours: 'Heures totales', nextBday: 'Jours avant anniversaire', enter: 'Entrez votre date de naissance' },
    ar: { label: 'تاريخ الميلاد', calc: 'احسب', years: 'سنوات', months: 'شهور', days: 'أيام', totalDays: 'إجمالي الأيام', totalMonths: 'إجمالي الشهور', totalWeeks: 'إجمالي الأسابيع', totalHours: 'إجمالي الساعات', nextBday: 'أيام حتى عيد الميلاد', enter: 'أدخل تاريخ ميلادك' },
  }[lang]

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-[#111111] dark:text-[#FAFAFA] mb-2">{labels.label}</label>
        <input type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)} max={new Date().toISOString().split('T')[0]} className="input-field" />
      </div>
      <button onClick={calculate} disabled={!birthDate} className="btn-primary w-full justify-center py-3.5 text-sm disabled:opacity-50">
        {labels.calc}
      </button>
      {result && (
        <div className="space-y-3 animate-fade-in">
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-blue-50 dark:bg-blue-950/30 rounded-xl p-4 text-center border border-blue-100 dark:border-blue-900">
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{result.years}</p>
              <p className="text-xs text-[#6B7280] dark:text-[#A1A1AA] mt-1">{labels.years}</p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-950/30 rounded-xl p-4 text-center border border-blue-100 dark:border-blue-900">
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{result.months}</p>
              <p className="text-xs text-[#6B7280] dark:text-[#A1A1AA] mt-1">{labels.months}</p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-950/30 rounded-xl p-4 text-center border border-blue-100 dark:border-blue-900">
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{result.days}</p>
              <p className="text-xs text-[#6B7280] dark:text-[#A1A1AA] mt-1">{labels.days}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { label: labels.totalDays, value: result.totalDays.toLocaleString() },
              { label: labels.totalMonths, value: result.totalMonths.toLocaleString() },
              { label: labels.totalWeeks, value: result.totalWeeks.toLocaleString() },
              { label: labels.nextBday, value: result.nextBirthdayDays },
            ].map((s, i) => (
              <div key={i} className="bg-[#F7F8FA] dark:bg-[#18181B] rounded-xl p-3 text-center border border-[#E5E7EB] dark:border-[#27272A]">
                <p className="text-lg font-bold text-[#111111] dark:text-[#FAFAFA]">{s.value}</p>
                <p className="text-[10px] text-[#6B7280] dark:text-[#A1A1AA] mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/* ── BMI Calculator ── */
function BMICalculatorTool({ lang }) {
  const [weight, setWeight] = useState('')
  const [height, setHeight] = useState('')
  const [result, setResult] = useState(null)

  const calculate = () => {
    const w = parseFloat(weight)
    const h = parseFloat(height)
    if (!w || !h || w <= 0 || h <= 0) return
    setResult(calculateBMI(w, h))
  }

  const labels = {
    en: { weight: 'Weight (kg)', height: 'Height (cm)', calc: 'Calculate BMI', yourBMI: 'Your BMI', category: 'Category' },
    fr: { weight: 'Poids (kg)', height: 'Taille (cm)', calc: 'Calculer IMC', yourBMI: 'Votre IMC', category: 'Catégorie' },
    ar: { weight: 'الوزن (كجم)', height: 'الطول (سم)', calc: 'احسب مؤشر كتلة الجسم', yourBMI: 'مؤشر كتلة جسمك', category: 'الفئة' },
  }[lang]

  const catLabels = {
    en: { Underweight: 'Underweight', Normal: 'Normal weight', Overweight: 'Overweight', Obese: 'Obese' },
    fr: { Underweight: 'Insuffisant', Normal: 'Normal', Overweight: 'Surpoids', Obese: 'Obèse' },
    ar: { Underweight: 'نحافة', Normal: 'وزن طبيعي', Overweight: 'زيادة وزن', Obese: 'سمنة' },
  }[lang]

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-[#111111] dark:text-[#FAFAFA] mb-2">{labels.weight}</label>
          <input type="number" value={weight} onChange={e => setWeight(e.target.value)} className="input-field" placeholder="70" min="1" />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#111111] dark:text-[#FAFAFA] mb-2">{labels.height}</label>
          <input type="number" value={height} onChange={e => setHeight(e.target.value)} className="input-field" placeholder="175" min="1" />
        </div>
      </div>
      <button onClick={calculate} disabled={!weight || !height} className="btn-primary w-full justify-center py-3.5 text-sm disabled:opacity-50">
        {labels.calc}
      </button>
      {result && (
        <div className="animate-fade-in space-y-3">
          <div className="rounded-xl p-6 text-center border-2" style={{ borderColor: result.categoryColor }}>
            <p className="text-sm text-[#6B7280] dark:text-[#A1A1AA] mb-1">{labels.yourBMI}</p>
            <p className="text-5xl font-extrabold" style={{ color: result.categoryColor }}>{result.bmi}</p>
            <p className="text-sm font-semibold mt-2" style={{ color: result.categoryColor }}>{catLabels[result.category]}</p>
          </div>
          <div className="space-y-1.5">
            {[
              { range: '< 18.5', label: catLabels.Underweight, color: '#3b82f6' },
              { range: '18.5 - 24.9', label: catLabels.Normal, color: '#22c55e' },
              { range: '25 - 29.9', label: catLabels.Overweight, color: '#f59e0b' },
              { range: '≥ 30', label: catLabels.Obese, color: '#ef4444' },
            ].map((r, i) => (
              <div key={i} className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs ${result.category === r.label.split(' ')[0] || (result.category === 'Underweight' && r.label === catLabels.Underweight) || (result.category === 'Normal' && r.label === catLabels.Normal) || (result.category === 'Overweight' && r.label === catLabels.Overweight) || (result.category === 'Obese' && r.label === catLabels.Obese) ? 'bg-[#F7F8FA] dark:bg-[#18181B] font-semibold' : ''}`}>
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: r.color }} />
                  {r.label}
                </span>
                <span className="text-gray-400">{r.range}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Percentage Calculator ── */
function PercentageCalculatorTool({ lang }) {
  const [mode, setMode] = useState('of')
  const [val1, setVal1] = useState('')
  const [val2, setVal2] = useState('')
  const [result, setResult] = useState(null)

  const modes = {
    en: [
      { id: 'of', label: 'What is X% of Y?', ph1: 'Percentage %', ph2: 'Total' },
      { id: 'isWhat', label: 'X is what % of Y?', ph1: 'Part', ph2: 'Total' },
      { id: 'increase', label: '% Increase (X → Y)', ph1: 'From', ph2: 'To' },
      { id: 'decrease', label: '% Decrease (X → Y)', ph1: 'From', ph2: 'To' },
    ],
    fr: [
      { id: 'of', label: 'X% de Y = ?', ph1: 'Pourcentage %', ph2: 'Total' },
      { id: 'isWhat', label: 'X est quel % de Y?', ph1: 'Partie', ph2: 'Total' },
      { id: 'increase', label: '% Augmentation (X → Y)', ph1: 'De', ph2: 'À' },
      { id: 'decrease', label: '% Diminution (X → Y)', ph1: 'De', ph2: 'À' },
    ],
    ar: [
      { id: 'of', label: 'ما هو X% من Y؟', ph1: 'النسبة %', ph2: 'المجموع' },
      { id: 'isWhat', label: 'X هو كم % من Y؟', ph1: 'الجزء', ph2: 'المجموع' },
      { id: 'increase', label: 'نسبة الزيادة (X → Y)', ph1: 'من', ph2: 'إلى' },
      { id: 'decrease', label: 'نسبة النقص (X → Y)', ph1: 'من', ph2: 'إلى' },
    ],
  }[lang]

  const currentMode = modes.find(m => m.id === mode)

  const calculate = () => {
    const a = parseFloat(val1)
    const b = parseFloat(val2)
    if (isNaN(a) || isNaN(b)) return
    let values
    if (mode === 'of') values = { percent: a, total: b }
    else if (mode === 'isWhat') values = { part: a, total: b }
    else values = { from: a, to: b }
    setResult(calculatePercentage(mode, values))
  }

  const labels = { en: { calc: 'Calculate', result: 'Result' }, fr: { calc: 'Calculer', result: 'Résultat' }, ar: { calc: 'احسب', result: 'النتيجة' } }[lang]

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {modes.map(m => (
          <button key={m.id} onClick={() => { setMode(m.id); setResult(null) }} className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${mode === m.id ? 'bg-blue-600 text-white' : 'bg-[#F7F8FA] dark:bg-[#18181B] text-[#6B7280] dark:text-[#A1A1AA] hover:bg-blue-50 dark:hover:bg-blue-950/40'}`}>
            {m.label}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <input type="number" value={val1} onChange={e => setVal1(e.target.value)} className="input-field" placeholder={currentMode.ph1} />
        <input type="number" value={val2} onChange={e => setVal2(e.target.value)} className="input-field" placeholder={currentMode.ph2} />
      </div>
      <button onClick={calculate} disabled={!val1 || !val2} className="btn-primary w-full justify-center py-3.5 text-sm disabled:opacity-50">
        {labels.calc}
      </button>
      {result && (
        <div className="animate-fade-in">
          <div className="rounded-xl p-5 text-center bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900">
            <p className="text-xs text-[#6B7280] dark:text-[#A1A1AA] mb-1">{labels.result}</p>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{result.result}</p>
            <p className="text-xs text-[#6B7280] dark:text-[#A1A1AA] mt-2">{result.formula}</p>
          </div>
        </div>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════
   PROCESSING INDICATOR
   ═══════════════════════════════════════════════════ */
function ProcessingIndicator() {
  return (
    <div className="flex items-center justify-center gap-3 py-8 animate-fade-in">
      <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      <span className="text-sm text-[#6B7280] dark:text-[#A1A1AA]">Processing...</span>
    </div>
  )
}

/* ═══════════════════════════════════════════════════
   TOOL REGISTRY — maps slug → component
   ═══════════════════════════════════════════════════ */
const TOOL_COMPONENTS = {
  // PDF Tools
  'pdf-to-word': PdfToWordTool,
  'word-to-pdf': WordToPdfTool,
  'pdf-to-jpg': PdfToJpgTool,
  'jpg-to-pdf': JpgToPdfTool,
  'merge-pdf': MergePdfTool,
  'split-pdf': SplitPdfTool,
  'compress-pdf': CompressPdfTool,
  // Image Tools
  'compress-image': CompressImageTool,
  'resize-image': ResizeImageTool,
  'crop-image': CropImageTool,
  'jpg-to-png': (props) => <ImageConvertTool {...props} targetExt="png" outputMime="image/png" />,
  'png-to-jpg': (props) => <ImageConvertTool {...props} targetExt="jpg" outputMime="image/jpeg" />,
  'webp-to-jpg': (props) => <ImageConvertTool {...props} targetExt="jpg" outputMime="image/jpeg" />,
  // Text Tools
  'word-counter': WordCounterTool,
  'character-counter': CharacterCounterTool,
  'case-converter': CaseConverterTool,
  // Calculators
  'age-calculator': AgeCalculatorTool,
  'bmi-calculator': BMICalculatorTool,
  'percentage-calculator': PercentageCalculatorTool,
}

/* ── Coming Soon ── */
function ComingSoon({ lang, t }) {
  return (
    <div className="py-12 text-center">
      <div className="w-16 h-16 rounded-full bg-[#F7F8FA] dark:bg-[#18181B] flex items-center justify-center mx-auto mb-5">
        <Wrench className="w-7 h-7 text-gray-400" />
      </div>
      <h3 className="font-bold text-lg text-[#111111] dark:text-[#FAFAFA] mb-2">{t.tools.comingSoon}</h3>
      <p className="text-sm text-[#6B7280] dark:text-[#A1A1AA] max-w-sm mx-auto">{t.tools.comingSoonDesc}</p>
    </div>
  )
}

/* ── Tool Interface Renderer ── */
function ToolInterface({ tool, lang, t }) {
  const ToolComponent = TOOL_COMPONENTS[tool.slug]
  if (ToolComponent) return <ToolComponent lang={lang} t={t} />
  return <ComingSoon lang={lang} t={t} />
}

/* ═══════════════════════════════════════════════════
   FAQ + MAIN PAGE
   ═══════════════════════════════════════════════════ */
function FAQItem({ question, answer }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-[#E5E7EB] dark:border-[#27272A] rounded-xl overflow-hidden">
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between px-5 py-4 text-start bg-white dark:bg-[#111113] hover:bg-gray-50 dark:hover:bg-[#18181B] transition-colors">
        <span className="text-sm font-semibold text-[#111111] dark:text-[#FAFAFA]">{question}</span>
        <ChevronDown className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="px-5 pb-4 pt-0 bg-white dark:bg-[#111113] text-sm text-[#6B7280] dark:text-[#A1A1AA] leading-relaxed border-t border-[#E5E7EB] dark:border-[#27272A]">{answer}</div>}
    </div>
  )
}

function getFAQ(tool, lang) {
  return [
    { q: lang === 'ar' ? 'هل هذه الأداة مجانية؟' : lang === 'fr' ? 'Cet outil est-il gratuit ?' : 'Is this tool free?', a: lang === 'ar' ? 'نعم، مجانية 100% بدون قيود.' : lang === 'fr' ? 'Oui, 100% gratuit sans aucune restriction.' : 'Yes, 100% free with no restrictions.' },
    { q: lang === 'ar' ? 'هل أحتاج إلى تسجيل؟' : lang === 'fr' ? 'Ai-je besoin de m\'inscrire ?' : 'Do I need to register?', a: lang === 'ar' ? 'لا، يمكنك استخدام الأداة مباشرة.' : lang === 'fr' ? 'Non, utilisez l\'outil directement.' : 'No, just open and use it instantly.' },
    { q: lang === 'ar' ? 'هل ملفاتي آمنة؟' : lang === 'fr' ? 'Mes fichiers sont-ils sécurisés ?' : 'Are my files safe?', a: lang === 'ar' ? 'نعم، يتم معالجة كل شيء في متصفحك. لا يتم رفع أي ملفات إلى أي خادم.' : lang === 'fr' ? 'Oui, tout est traité dans votre navigateur. Aucun fichier n\'est envoyé à un serveur.' : 'Yes, everything is processed in your browser. No files are uploaded to any server.' },
  ]
}

export default function ToolPage({ slug, lang, t }) {
  const tool = tools.find(to => to.slug === slug)

  if (!tool) return (
    <div className="p-8 text-center">
      <p className="text-[#6B7280] dark:text-[#A1A1AA] mb-4">Tool not found.</p>
      <Link to="/" className="text-blue-600 hover:underline text-sm">{t.breadcrumb.home}</Link>
    </div>
  )

  const category = categories.find(c => c.id === tool.categoryId)
  const Icon = getIcon(tool.icon)
  const relatedTools = tools.filter(to => to.categoryId === tool.categoryId && to.id !== tool.id).slice(0, 6)
  const faqs = getFAQ(tool, lang)
  const catMap = Object.fromEntries(categories.map(c => [c.id, c]))

  useSEO({ title: tool.name[lang], description: tool.description[lang], canonical: `/tools/${tool.slug}` })
  useToolViews(tool.slug)

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 md:py-8 animate-fade-in">
      <Breadcrumb items={[
        { label: t.breadcrumb.home, href: '/' },
        { label: t.nav.categories, href: '/categories' },
        category && { label: category.name[lang], href: `/categories/${category.slug}` },
        { label: tool.name[lang] },
      ].filter(Boolean)} />

      <div className="flex items-start gap-4 mb-6 md:mb-8">
        <div className={`shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br ${category?.color || 'from-blue-600 to-blue-500'} flex items-center justify-center shadow-sm`}>
          <Icon className="w-7 h-7 text-white" strokeWidth={1.6} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#111111] dark:text-[#FAFAFA] leading-tight">{tool.name[lang]}</h1>
          <p className="text-sm text-[#6B7280] dark:text-[#A1A1AA] mt-1 leading-relaxed">{tool.description[lang]}</p>
          {category && (
            <Link to={`/categories/${category.slug}`} className={`inline-flex items-center gap-1 mt-2 text-xs font-semibold px-2.5 py-1 rounded-full ${category.bg} ${category.text} ${category.border} border`}>
              <Icon className="w-3 h-3" strokeWidth={2} /> {category.name[lang]}
            </Link>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-[#111113] border border-[#E5E7EB] dark:border-[#27272A] rounded-xl p-5 md:p-8 mb-6 shadow-card">
        <ToolInterface tool={tool} lang={lang} t={t} />
      </div>

      <div className="mb-8">
        <p className="text-sm text-[#6B7280] dark:text-[#A1A1AA] leading-relaxed">{tool.description[lang]}</p>
      </div>

      <div className="mb-8">
        <h2 className="font-bold text-base text-[#111111] dark:text-[#FAFAFA] mb-4 flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-blue-500" />
          {t.tools.faq}
        </h2>
        <div className="space-y-2">
          {faqs.map((faq, i) => <FAQItem key={i} question={faq.q} answer={faq.a} />)}
        </div>
      </div>

      {relatedTools.length > 0 && (
        <div>
          <h2 className="font-bold text-base text-[#111111] dark:text-[#FAFAFA] mb-4">{t.tools.related}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {relatedTools.map(rt => <ToolCard key={rt.id} tool={rt} lang={lang} t={t} category={catMap[rt.categoryId]} showNewBadge={false} />)}
          </div>
        </div>
      )}
    </div>
  )
}
