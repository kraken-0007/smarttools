import { useSEO, useToolViews, buildBreadcrumbJsonLd, buildFaqJsonLd, buildToolJsonLd, SITE_URL } from '../lib/seo'
import toolSeoData from '../data/toolSeoData.json'
import {
  ResizeImageEditor, CropImageEditor, CompressImageEditor,
  ImageConvertEditor, ImageUploadZone,
} from '../components/ImageEditor.jsx'
import {
  FilterEditor, GrayscaleEditor, RotateFlipEditor, WatermarkEditor,
  BorderEditor, RoundedCornersEditor, Base64Tool, Base64ToImageTool,
  ImageMetadataViewer, ImageConverterTool,
} from '../components/ImageTools.jsx'
import {
  PixelateEditor, SharpenEditor, InvertEditor,
  ColorAdjustEditor, RedactEditor, EraseAreaEditor,
} from '../components/RegionTools.jsx'
import {
  SepiaEditor, PosterizeEditor, ThresholdEditor, DuotoneEditor,
  NoiseGeneratorEditor, DenoiseEditor, EdgeDetectionEditor,
  EmbossEditor, SketchEditor,
} from '../components/SimpleFilters.jsx'
import {
  ColorPickerEditor, ExtractPaletteEditor, ImageSplitterEditor,
  ImageSlicerEditor, SocialMediaResizerEditor, PassportPhotoEditor,
  FileSizeTargeterEditor, TransparencyEditor, ImageUpscalerEditor,
  AspectRatioEditor, DpiConverterEditor, AddShadowEditor,
  GlowEffectEditor, ColorReplacementEditor, CollageMakerEditor,
  ContactSheetEditor, PlaceholderGeneratorEditor,
} from '../components/ImageUtilities.jsx'
import PdfPageEditor from '../components/PdfPageEditor.jsx'
import AdvancedPdfEditor from '../components/AdvancedPdfEditor.jsx'
import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, Wrench, HelpCircle, ChevronDown, Loader2, AlertCircle } from 'lucide-react'
import FavoriteButton from '../components/FavoriteButton'
import { useRecentTools } from '../hooks/useRecentTools'
import BatchProcessor from '../components/BatchProcessor'
import { BATCH_CONFIG, BATCH_SUPPORTED } from '../lib/batchConfig.jsx'
import { Layers } from 'lucide-react'
import tools from '../data/tools.json'
import categories from '../data/categories.json'
import ToolCard from '../components/ToolCard'
import Breadcrumb from '../components/Breadcrumb'
import { getIcon } from '../lib/icons'
import { FileUploader, ProcessButton, ResultDisplay, ErrorDisplay, useToolProcessor } from '../lib/processors/shared.jsx'
import { downloadBlob, getOutputFilename, formatFileSize } from '../lib/processors/image.js'
import {
  pdfToJpg, jpgToPdf, mergePDFs, splitPDF, compressPDF, pdfToWord, wordToPdf,
  pdfToPng, pngToPdf, rotatePdf, deletePdfPages, extractPdfPages, reorderPdfPages,
  countPdfPages, getPdfMetadata, protectPdf, unlockPdf, addWatermarkPdf,
  addPageNumbersPdf, extractImagesFromPdf,
} from '../lib/processors/pdf.js'
import { countWords, countCharacters, convertCase } from '../lib/processors/text.js'
import { calculateAge, calculateBMI, calculatePercentage } from '../lib/processors/calculators.js'

function ProcessingIndicator() {
  return (
    <div className="flex items-center justify-center gap-3 py-8 animate-fade-in">
      <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      <span className="text-sm text-[#6B7280] dark:text-[#A1A1AA]">Processing...</span>
    </div>
  )
}

/* ═══ PDF TOOLS ═══ */

function PdfToJpgTool({ lang }) {
  const [file, setFile] = useState(null)
  const { loading, results, error, process, reset } = useToolProcessor(async (f) => {
    const pages = await pdfToJpg(f)
    return pages.map((p, i) => ({ blob: p.blob, filename: `page-${i+1}.jpg` }))
  }, lang)
  const handleReset = () => { setFile(null); reset() }
  return (
    <div className="space-y-4">
      {!results && !error && (<>
        <FileUploader accept="application/pdf" onFiles={setFile} lang={lang} hint="PDF · Max 50MB" />
        {file && <ProcessButton onClick={() => process(file)} loading={loading} label={lang==='ar'?'تحويل إلى JPG':lang==='fr'?'Convertir en JPG':'Convert to JPG'} />}
      </>)}
      {loading && <ProcessingIndicator />}
      {error && <ErrorDisplay message={error} lang={lang} />}
      {results && <ResultDisplay results={results} lang={lang} />}
      {(results||error) && <button onClick={handleReset} className="text-sm text-[#6B7280] dark:text-[#A1A1AA] hover:text-blue-600 font-medium">{lang==='ar'?'ابدأ من جديد':lang==='fr'?'Recommencer':'Start over'}</button>}
    </div>
  )
}

function PdfToPngTool({ lang }) {
  const [file, setFile] = useState(null)
  const { loading, results, error, process, reset } = useToolProcessor(async (f) => {
    const pages = await pdfToPng(f)
    return pages.map((p, i) => ({ blob: p.blob, filename: `page-${i+1}.png` }))
  }, lang)
  const handleReset = () => { setFile(null); reset() }
  return (
    <div className="space-y-4">
      {!results && !error && (<>
        <FileUploader accept="application/pdf" onFiles={setFile} lang={lang} hint="PDF · Max 50MB" />
        {file && <ProcessButton onClick={() => process(file)} loading={loading} label={lang==='ar'?'تحويل إلى PNG':lang==='fr'?'Convertir en PNG':'Convert to PNG'} />}
      </>)}
      {loading && <ProcessingIndicator />}
      {error && <ErrorDisplay message={error} lang={lang} />}
      {results && <ResultDisplay results={results} lang={lang} />}
      {(results||error) && <button onClick={handleReset} className="text-sm text-[#6B7280] dark:text-[#A1A1AA] hover:text-blue-600 font-medium">{lang==='ar'?'ابدأ من جديد':lang==='fr'?'Recommencer':'Start over'}</button>}
    </div>
  )
}

function JpgToPdfTool({ lang }) {
  const [files, setFiles] = useState([])
  const { loading, results, error, process, reset } = useToolProcessor(async (imgs) => {
    const blob = await jpgToPdf(imgs); return { blob, filename: 'converted.pdf' }
  }, lang)
  const handleReset = () => { setFiles([]); reset() }
  return (
    <div className="space-y-4">
      {!results && !error && (<>
        <FileUploader accept="image/jpeg,image/png,image/webp" multiple onFiles={setFiles} lang={lang} hint="JPG, PNG, WEBP · Multiple files" />
        {files.length > 0 && <ProcessButton onClick={() => process(files)} loading={loading} label={lang==='ar'?'تحويل إلى PDF':lang==='fr'?'Convertir en PDF':'Convert to PDF'} />}
      </>)}
      {loading && <ProcessingIndicator />}
      {error && <ErrorDisplay message={error} lang={lang} />}
      {results && <ResultDisplay results={results} lang={lang} />}
      {(results||error) && <button onClick={handleReset} className="text-sm text-[#6B7280] dark:text-[#A1A1AA] hover:text-blue-600 font-medium">{lang==='ar'?'ابدأ من جديد':lang==='fr'?'Recommencer':'Start over'}</button>}
    </div>
  )
}

function PngToPdfTool({ lang }) {
  const [files, setFiles] = useState([])
  const { loading, results, error, process, reset } = useToolProcessor(async (imgs) => {
    const blob = await pngToPdf(imgs); return { blob, filename: 'converted.pdf' }
  }, lang)
  const handleReset = () => { setFiles([]); reset() }
  return (
    <div className="space-y-4">
      {!results && !error && (<>
        <FileUploader accept="image/png" multiple onFiles={setFiles} lang={lang} hint="PNG · Multiple files" />
        {files.length > 0 && <ProcessButton onClick={() => process(files)} loading={loading} label={lang==='ar'?'تحويل إلى PDF':lang==='fr'?'Convertir en PDF':'Convert to PDF'} />}
      </>)}
      {loading && <ProcessingIndicator />}
      {error && <ErrorDisplay message={error} lang={lang} />}
      {results && <ResultDisplay results={results} lang={lang} />}
      {(results||error) && <button onClick={handleReset} className="text-sm text-[#6B7280] dark:text-[#A1A1AA] hover:text-blue-600 font-medium">{lang==='ar'?'ابدأ من جديد':lang==='fr'?'Recommencer':'Start over'}</button>}
    </div>
  )
}

function MergePdfTool({ lang }) {
  return <AdvancedPdfEditor mode="merge" lang={lang} features={{ merge: true, rotate: true, reorder: true, duplicate: true, delete: true, split: false, extract: false, numbering: false, watermark: false }} />
}

function SplitPdfTool({ lang }) {
  return <AdvancedPdfEditor mode="edit" lang={lang} features={{ split: true, rotate: true, delete: true, reorder: true, extract: false, numbering: false, watermark: false, duplicate: true, merge: false }} />
}

function CompressPdfTool({ lang }) {
  const [file, setFile] = useState(null)
  const { loading, results, error, process, reset } = useToolProcessor(async (f) => {
    const blob = await compressPDF(f)
    const saved = Math.round((1 - blob.size/f.size) * 100)
    return { blob, filename: 'compressed.pdf', saved }
  }, lang)
  const handleReset = () => { setFile(null); reset() }
  return (
    <div className="space-y-4">
      {!results && !error && (<>
        <FileUploader accept="application/pdf" onFiles={setFile} lang={lang} hint="PDF · Max 50MB" />
        {file && <ProcessButton onClick={() => process(file)} loading={loading} label={lang==='ar'?'ضغط PDF':lang==='fr'?'Compresser PDF':'Compress PDF'} />}
      </>)}
      {loading && <ProcessingIndicator />}
      {error && <ErrorDisplay message={error} lang={lang} />}
      {results && (
        <div className="space-y-3 animate-fade-in">
          <div className="flex items-center gap-2 p-3 rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 text-green-700 dark:text-green-400 text-sm font-medium">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            {lang==='ar'?'تم الضغط بنجاح!':lang==='fr'?'Compression réussie !':'Compression complete!'}
            {results[0].saved > 0 && <span className="ms-1 text-xs">({lang==='ar'?`${results[0].saved}%`:lang==='fr'?`Réduit de ${results[0].saved}%`:`Reduced by ${results[0].saved}%`})</span>}
          </div>
          <ResultDisplay results={results} lang={lang} />
        </div>
      )}
      {(results||error) && <button onClick={handleReset} className="text-sm text-[#6B7280] dark:text-[#A1A1AA] hover:text-blue-600 font-medium">{lang==='ar'?'ابدأ من جديد':lang==='fr'?'Recommencer':'Start over'}</button>}
    </div>
  )
}

function PdfToWordTool({ lang }) {
  const [file, setFile] = useState(null)
  const { loading, results, error, process, reset } = useToolProcessor(async (f) => {
    const blob = await pdfToWord(f)
    return { blob, filename: getOutputFilename(f.name, 'doc') }
  }, lang)
  const handleReset = () => { setFile(null); reset() }
  return (
    <div className="space-y-4">
      {!results && !error && (<>
        <FileUploader accept="application/pdf" onFiles={setFile} lang={lang} hint="PDF · Max 50MB" />
        {file && <ProcessButton onClick={() => process(file)} loading={loading} label={lang==='ar'?'تحويل إلى Word':lang==='fr'?'Convertir en Word':'Convert to Word'} />}
      </>)}
      {loading && <ProcessingIndicator />}
      {error && <ErrorDisplay message={error} lang={lang} />}
      {results && <ResultDisplay results={results} lang={lang} />}
      {(results||error) && <button onClick={handleReset} className="text-sm text-[#6B7280] dark:text-[#A1A1AA] hover:text-blue-600 font-medium">{lang==='ar'?'ابدأ من جديد':lang==='fr'?'Recommencer':'Start over'}</button>}
    </div>
  )
}

function WordToPdfTool({ lang }) {
  const [file, setFile] = useState(null)
  const { loading, results, error, process, reset } = useToolProcessor(async (f) => {
    const blob = await wordToPdf(f); return { blob, filename: 'converted.pdf' }
  }, lang)
  const handleReset = () => { setFile(null); reset() }
  return (
    <div className="space-y-4">
      {!results && !error && (<>
        <FileUploader accept=".docx,.txt,application/pdf" onFiles={setFile} lang={lang} hint="DOCX or TXT · Max 50MB" />
        {file && <ProcessButton onClick={() => process(file)} loading={loading} label={lang==='ar'?'تحويل إلى PDF':lang==='fr'?'Convertir en PDF':'Convert to PDF'} />}
      </>)}
      {loading && <ProcessingIndicator />}
      {error && <ErrorDisplay message={error} lang={lang} />}
      {results && <ResultDisplay results={results} lang={lang} />}
      {(results||error) && <button onClick={handleReset} className="text-sm text-[#6B7280] dark:text-[#A1A1AA] hover:text-blue-600 font-medium">{lang==='ar'?'ابدأ من جديد':lang==='fr'?'Recommencer':'Start over'}</button>}
    </div>
  )
}

/* ── PDF page editor tools ── */

function RotatePdfTool({ lang }) {
  return <AdvancedPdfEditor mode="edit" lang={lang} features={{ rotate: true, split: false, delete: false, reorder: false, extract: false, numbering: false, watermark: false, duplicate: false, merge: false }} />
}

function DeletePdfPagesTool({ lang }) {
  return <AdvancedPdfEditor mode="edit" lang={lang} features={{ delete: true, rotate: true, reorder: true, duplicate: true, split: false, extract: false, numbering: false, watermark: false, merge: false }} />
}

function ExtractPdfPagesTool({ lang }) {
  return <AdvancedPdfEditor mode="edit" lang={lang} features={{ extract: true, rotate: true, reorder: true, duplicate: true, delete: false, split: false, numbering: false, watermark: false, merge: false }} />
}

function ReorderPdfPagesTool({ lang }) {
  return <AdvancedPdfEditor mode="edit" lang={lang} features={{ reorder: true, rotate: true, duplicate: true, delete: true, split: false, extract: false, numbering: false, watermark: false, merge: false }} />
}

/* ── Simple PDF tools ── */

function PdfPageCounterTool({ lang }) {
  const [file, setFile] = useState(null)
  const { loading, results, error, process, reset } = useToolProcessor(async (f) => {
    return await countPdfPages(f)
  }, lang)
  const handleReset = () => { setFile(null); reset() }
  return (
    <div className="space-y-4">
      {!results && !error && (<>
        <FileUploader accept="application/pdf" onFiles={setFile} lang={lang} hint="PDF · Max 50MB" />
        {file && <ProcessButton onClick={() => process(file)} loading={loading} label={lang==='ar'?'عدّ الصفحات':lang==='fr'?'Compter pages':'Count Pages'} />}
      </>)}
      {loading && <ProcessingIndicator />}
      {error && <ErrorDisplay message={error} lang={lang} />}
      {results && results[0] && (
        <div className="space-y-3 animate-fade-in">
          <div className="flex items-center gap-2 p-3 rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 text-green-700 dark:text-green-400 text-sm font-medium">
            <CheckCircle2 className="w-4 h-4 shrink-0" /> {lang==='ar'?'اكتمل!':lang==='fr'?'Terminé !':'Complete!'}
          </div>
          <div className="bg-[#F7F8FA] dark:bg-[#18181B] rounded-xl p-6 text-center border border-[#E5E7EB] dark:border-[#27272A]">
            <p className="text-5xl font-bold text-blue-600 dark:text-blue-400">{results[0].pages}</p>
            <p className="text-sm text-[#6B7280] dark:text-[#A1A1AA] mt-2">{lang==='ar'?'صفحات':'pages'}</p>
            <p className="text-xs text-[#6B7280] dark:text-[#A1A1AA] mt-1">{results[0].filename} · {formatFileSize(results[0].fileSize)}</p>
          </div>
        </div>
      )}
      {(results||error) && <button onClick={handleReset} className="text-sm text-[#6B7280] dark:text-[#A1A1AA] hover:text-blue-600 font-medium">{lang==='ar'?'ابدأ من جديد':lang==='fr'?'Recommencer':'Start over'}</button>}
    </div>
  )
}

function PdfMetadataViewerTool({ lang }) {
  const [file, setFile] = useState(null)
  const { loading, results, error, process, reset } = useToolProcessor(async (f) => {
    return await getPdfMetadata(f)
  }, lang)
  const handleReset = () => { setFile(null); reset() }
  const labels = {
    en: { title:'Title', author:'Author', subject:'Subject', creator:'Creator', producer:'Producer', pages:'Pages', fileSize:'File Size', filename:'Filename', created:'Created', modified:'Modified', encrypted:'Encrypted' },
    fr: { title:'Titre', author:'Auteur', subject:'Sujet', creator:'Créateur', producer:'Producteur', pages:'Pages', fileSize:'Taille', filename:'Fichier', created:'Créé', modified:'Modifié', encrypted:'Chiffré' },
    ar: { title:'العنوان', author:'المؤلف', subject:'الموضوع', creator:'المنشئ', producer:'المنتج', pages:'الصفحات', fileSize:'الحجم', filename:'الملف', created:'الإنشاء', modified:'التعديل', encrypted:'مشفّر' },
  }[lang]
  return (
    <div className="space-y-4">
      {!results && !error && (<>
        <FileUploader accept="application/pdf" onFiles={setFile} lang={lang} hint="PDF · Max 50MB" />
        {file && <ProcessButton onClick={() => process(file)} loading={loading} label={lang==='ar'?'عرض البيانات':lang==='fr'?'Voir métadonnées':'View Metadata'} />}
      </>)}
      {loading && <ProcessingIndicator />}
      {error && <ErrorDisplay message={error} lang={lang} />}
      {results && results[0] && (
        <div className="space-y-2 animate-fade-in">
          {Object.entries(labels).map(([key, label]) => {
            const value = results[0][key]
            if (value === null || value === undefined || value === '') return null
            const display = key === 'fileSize' ? formatFileSize(value) : key === 'pages' ? value : String(value)
            return (
              <div key={key} className="flex items-center justify-between py-2.5 px-4 rounded-xl bg-[#F7F8FA] dark:bg-[#18181B]">
                <span className="text-sm text-[#6B7280] dark:text-[#A1A1AA]">{label}</span>
                <span className="text-sm font-medium text-[#111111] dark:text-[#FAFAFA] text-end">{display}</span>
              </div>
            )
          })}
        </div>
      )}
      {(results||error) && <button onClick={handleReset} className="text-sm text-[#6B7280] dark:text-[#A1A1AA] hover:text-blue-600 font-medium">{lang==='ar'?'ابدأ من جديد':lang==='fr'?'Recommencer':'Start over'}</button>}
    </div>
  )
}

function ProtectPdfTool({ lang }) {
  const [file, setFile] = useState(null)
  const [password, setPassword] = useState('')
  const { loading, results, error, process, reset } = useToolProcessor(async (f) => {
    const blob = await protectPdf(f, password); return { blob, filename: 'protected.pdf' }
  }, lang)
  const handleReset = () => { setFile(null); setPassword(''); reset() }
  return (
    <div className="space-y-4">
      {!results && !error && (<>
        <FileUploader accept="application/pdf" onFiles={setFile} lang={lang} hint="PDF · Max 50MB" />
        {file && (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-[#111111] dark:text-[#FAFAFA] mb-1.5">{lang==='ar'?'كلمة المرور':lang==='fr'?'Mot de passe':'Password'}</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="input-field" placeholder="••••••••" />
            </div>
            <ProcessButton onClick={() => process(file)} loading={loading} disabled={!password} label={lang==='ar'?'حماية PDF':lang==='fr'?'Protéger PDF':'Protect PDF'} />
          </div>
        )}
      </>)}
      {loading && <ProcessingIndicator />}
      {error && <ErrorDisplay message={error} lang={lang} />}
      {results && <ResultDisplay results={results} lang={lang} />}
      {(results||error) && <button onClick={handleReset} className="text-sm text-[#6B7280] dark:text-[#A1A1AA] hover:text-blue-600 font-medium">{lang==='ar'?'ابدأ من جديد':lang==='fr'?'Recommencer':'Start over'}</button>}
    </div>
  )
}

function UnlockPdfTool({ lang }) {
  const [file, setFile] = useState(null)
  const [password, setPassword] = useState('')
  const { loading, results, error, process, reset } = useToolProcessor(async (f) => {
    const blob = await unlockPdf(f, password); return { blob, filename: 'unlocked.pdf' }
  }, lang)
  const handleReset = () => { setFile(null); setPassword(''); reset() }
  return (
    <div className="space-y-4">
      {!results && !error && (<>
        <FileUploader accept="application/pdf" onFiles={setFile} lang={lang} hint="PDF · Max 50MB" />
        {file && (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-[#111111] dark:text-[#FAFAFA] mb-1.5">{lang==='ar'?'كلمة المرور':lang==='fr'?'Mot de passe':'Password'}</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="input-field" placeholder="••••••••" />
            </div>
            <ProcessButton onClick={() => process(file)} loading={loading} label={lang==='ar'?'إلغاء القفل':lang==='fr'?'Déverrouiller':'Unlock PDF'} />
          </div>
        )}
      </>)}
      {loading && <ProcessingIndicator />}
      {error && <ErrorDisplay message={error} lang={lang} />}
      {results && <ResultDisplay results={results} lang={lang} />}
      {(results||error) && <button onClick={handleReset} className="text-sm text-[#6B7280] dark:text-[#A1A1AA] hover:text-blue-600 font-medium">{lang==='ar'?'ابدأ من جديد':lang==='fr'?'Recommencer':'Start over'}</button>}
    </div>
  )
}

function AddWatermarkPdfTool({ lang }) {
  return <AdvancedPdfEditor mode="edit" lang={lang} features={{ watermark: true, rotate: true, reorder: true, duplicate: true, delete: true, split: false, extract: false, numbering: false, merge: false }} />
}

function AddPageNumbersPdfTool({ lang }) {
  return <AdvancedPdfEditor mode="edit" lang={lang} features={{ numbering: true, rotate: true, reorder: true, duplicate: true, delete: true, split: false, extract: false, watermark: false, merge: false }} />
}

function ExtractImagesFromPdfTool({ lang }) {
  const [file, setFile] = useState(null)
  const { loading, results, error, process, reset } = useToolProcessor(async (f) => {
    const images = await extractImagesFromPdf(f)
    if (!images || images.length === 0) throw new Error(lang==='ar'?'لم يتم العثور على صور':lang==='fr'?'Aucune image trouvée':'No images found in PDF')
    return images.map((img, i) => ({ blob: img.blob, filename: `image-p${img.page}-${i+1}.png` }))
  }, lang)
  const handleReset = () => { setFile(null); reset() }
  return (
    <div className="space-y-4">
      {!results && !error && (<>
        <FileUploader accept="application/pdf" onFiles={setFile} lang={lang} hint="PDF · Max 50MB" />
        {file && <ProcessButton onClick={() => process(file)} loading={loading} label={lang==='ar'?'استخراج الصور':lang==='fr'?'Extraire images':'Extract Images'} />}
      </>)}
      {loading && <ProcessingIndicator />}
      {error && <ErrorDisplay message={error} lang={lang} />}
      {results && <ResultDisplay results={results} lang={lang} />}
      {(results||error) && <button onClick={handleReset} className="text-sm text-[#6B7280] dark:text-[#A1A1AA] hover:text-blue-600 font-medium">{lang==='ar'?'ابدأ من جديد':lang==='fr'?'Recommencer':'Start over'}</button>}
    </div>
  )
}

/* ═══ IMAGE TOOLS ═══ */

function CompressImageTool({ lang }) {
  const [file, setFile] = useState(null)
  if (!file) return <ImageUploadZone onFile={setFile} lang={lang} />
  return <CompressImageEditor file={file} lang={lang} onReset={() => setFile(null)} />
}

function ResizeImageTool({ lang }) {
  const [file, setFile] = useState(null)
  if (!file) return <ImageUploadZone onFile={setFile} lang={lang} />
  return <ResizeImageEditor file={file} lang={lang} onReset={() => setFile(null)} />
}

function CropImageTool({ lang }) {
  const [file, setFile] = useState(null)
  if (!file) return <ImageUploadZone onFile={setFile} lang={lang} />
  return <CropImageEditor file={file} lang={lang} onReset={() => setFile(null)} />
}

function ImageConvertTool({ lang, targetExt, outputMime }) {
  const [file, setFile] = useState(null)
  if (!file) return <ImageUploadZone onFile={setFile} lang={lang} />
  return <ImageConvertEditor file={file} lang={lang} targetExt={targetExt} outputMime={outputMime} onReset={() => setFile(null)} />
}

function RotateImageTool({ lang }) {
  const [file, setFile] = useState(null)
  if (!file) return <ImageUploadZone onFile={setFile} lang={lang} />
  return <RotateFlipEditor file={file} lang={lang} />
}

function FlipImageTool({ lang }) {
  const [file, setFile] = useState(null)
  if (!file) return <ImageUploadZone onFile={setFile} lang={lang} />
  return <RotateFlipEditor file={file} lang={lang} />
}

function ImageConverterToolWrapper({ lang }) {
  const [file, setFile] = useState(null)
  if (!file) return <ImageUploadZone onFile={setFile} lang={lang} />
  return <ImageConverterTool file={file} lang={lang} />
}

function ImageToBase64Tool({ lang }) {
  const [file, setFile] = useState(null)
  if (!file) return <ImageUploadZone onFile={setFile} lang={lang} />
  return <Base64Tool file={file} lang={lang} />
}

function Base64ToImageToolWrapper({ lang }) {
  return <Base64ToImageTool lang={lang} />
}

function GrayscaleImageTool({ lang }) {
  const [file, setFile] = useState(null)
  if (!file) return <ImageUploadZone onFile={setFile} lang={lang} />
  return <GrayscaleEditor file={file} lang={lang} />
}

function BlurImageTool({ lang }) {
  const [file, setFile] = useState(null)
  if (!file) return <ImageUploadZone onFile={setFile} lang={lang} />
  return <FilterEditor file={file} lang={lang} filters={{ brightness:0, contrast:0, saturation:0, blur:5, grayscale:0 }} singleMode="blur" />
}

function ImageBrightnessTool({ lang }) {
  const [file, setFile] = useState(null)
  if (!file) return <ImageUploadZone onFile={setFile} lang={lang} />
  return <FilterEditor file={file} lang={lang} filters={{ brightness:0, contrast:0, saturation:0, blur:0, grayscale:0 }} singleMode="brightness" />
}

function ImageContrastTool({ lang }) {
  const [file, setFile] = useState(null)
  if (!file) return <ImageUploadZone onFile={setFile} lang={lang} />
  return <FilterEditor file={file} lang={lang} filters={{ brightness:0, contrast:0, saturation:0, blur:0, grayscale:0 }} singleMode="contrast" />
}

function ImageSaturationTool({ lang }) {
  const [file, setFile] = useState(null)
  if (!file) return <ImageUploadZone onFile={setFile} lang={lang} />
  return <FilterEditor file={file} lang={lang} filters={{ brightness:0, contrast:0, saturation:0, blur:0, grayscale:0 }} singleMode="saturation" />
}

function ImageWatermarkTool({ lang }) {
  const [file, setFile] = useState(null)
  if (!file) return <ImageUploadZone onFile={setFile} lang={lang} />
  return <WatermarkEditor file={file} lang={lang} />
}

function ImageMetadataViewerTool({ lang }) {
  const [file, setFile] = useState(null)
  if (!file) return <ImageUploadZone onFile={setFile} lang={lang} />
  return <ImageMetadataViewer file={file} lang={lang} />
}

function AddImageBorderTool({ lang }) {
  const [file, setFile] = useState(null)
  if (!file) return <ImageUploadZone onFile={setFile} lang={lang} />
  return <BorderEditor file={file} lang={lang} />
}

function RoundedCornersTool({ lang }) {
  const [file, setFile] = useState(null)
  if (!file) return <ImageUploadZone onFile={setFile} lang={lang} />
  return <RoundedCornersEditor file={file} lang={lang} />
}

function PixelateImageTool({ lang }) {
  const [file, setFile] = useState(null)
  if (!file) return <ImageUploadZone onFile={setFile} lang={lang} />
  return <PixelateEditor file={file} lang={lang} />
}

function SharpenImageTool({ lang }) {
  const [file, setFile] = useState(null)
  if (!file) return <ImageUploadZone onFile={setFile} lang={lang} />
  return <SharpenEditor file={file} lang={lang} />
}

function InvertImageTool({ lang }) {
  const [file, setFile] = useState(null)
  if (!file) return <ImageUploadZone onFile={setFile} lang={lang} />
  return <InvertEditor file={file} lang={lang} />
}

function ColorAdjustmentTool({ lang }) {
  const [file, setFile] = useState(null)
  if (!file) return <ImageUploadZone onFile={setFile} lang={lang} />
  return <ColorAdjustEditor file={file} lang={lang} />
}

function RedactImageTool({ lang }) {
  const [file, setFile] = useState(null)
  if (!file) return <ImageUploadZone onFile={setFile} lang={lang} />
  return <RedactEditor file={file} lang={lang} />
}

function EraseAreaTool({ lang }) {
  const [file, setFile] = useState(null)
  if (!file) return <ImageUploadZone onFile={setFile} lang={lang} />
  return <EraseAreaEditor file={file} lang={lang} />
}

function SepiaImageTool({ lang }) {
  const [file, setFile] = useState(null)
  if (!file) return <ImageUploadZone onFile={setFile} lang={lang} />
  return <SepiaEditor file={file} lang={lang} />
}
function PosterizeImageTool({ lang }) {
  const [file, setFile] = useState(null)
  if (!file) return <ImageUploadZone onFile={setFile} lang={lang} />
  return <PosterizeEditor file={file} lang={lang} />
}
function ThresholdImageTool({ lang }) {
  const [file, setFile] = useState(null)
  if (!file) return <ImageUploadZone onFile={setFile} lang={lang} />
  return <ThresholdEditor file={file} lang={lang} />
}
function DuotoneImageTool({ lang }) {
  const [file, setFile] = useState(null)
  if (!file) return <ImageUploadZone onFile={setFile} lang={lang} />
  return <DuotoneEditor file={file} lang={lang} />
}
function ImageNoiseTool({ lang }) {
  const [file, setFile] = useState(null)
  if (!file) return <ImageUploadZone onFile={setFile} lang={lang} />
  return <NoiseGeneratorEditor file={file} lang={lang} />
}
function ImageDenoiseTool({ lang }) {
  const [file, setFile] = useState(null)
  if (!file) return <ImageUploadZone onFile={setFile} lang={lang} />
  return <DenoiseEditor file={file} lang={lang} />
}
function EdgeDetectionTool({ lang }) {
  const [file, setFile] = useState(null)
  if (!file) return <ImageUploadZone onFile={setFile} lang={lang} />
  return <EdgeDetectionEditor file={file} lang={lang} />
}
function EmbossImageTool({ lang }) {
  const [file, setFile] = useState(null)
  if (!file) return <ImageUploadZone onFile={setFile} lang={lang} />
  return <EmbossEditor file={file} lang={lang} />
}
function SketchImageTool({ lang }) {
  const [file, setFile] = useState(null)
  if (!file) return <ImageUploadZone onFile={setFile} lang={lang} />
  return <SketchEditor file={file} lang={lang} />
}
function ColorPickerTool({ lang }) {
  const [file, setFile] = useState(null)
  if (!file) return <ImageUploadZone onFile={setFile} lang={lang} />
  return <ColorPickerEditor file={file} lang={lang} />
}
function ExtractPaletteTool({ lang }) {
  const [file, setFile] = useState(null)
  if (!file) return <ImageUploadZone onFile={setFile} lang={lang} />
  return <ExtractPaletteEditor file={file} lang={lang} />
}
function ImageSplitterTool({ lang }) {
  const [file, setFile] = useState(null)
  if (!file) return <ImageUploadZone onFile={setFile} lang={lang} />
  return <ImageSplitterEditor file={file} lang={lang} />
}
function ImageSlicerTool({ lang }) {
  const [file, setFile] = useState(null)
  if (!file) return <ImageUploadZone onFile={setFile} lang={lang} />
  return <ImageSlicerEditor file={file} lang={lang} />
}
function SocialMediaResizerTool({ lang }) {
  const [file, setFile] = useState(null)
  if (!file) return <ImageUploadZone onFile={setFile} lang={lang} />
  return <SocialMediaResizerEditor file={file} lang={lang} />
}
function PassportPhotoTool({ lang }) {
  const [file, setFile] = useState(null)
  if (!file) return <ImageUploadZone onFile={setFile} lang={lang} />
  return <PassportPhotoEditor file={file} lang={lang} />
}
function FileSizeTargeterTool({ lang }) {
  const [file, setFile] = useState(null)
  if (!file) return <ImageUploadZone onFile={setFile} lang={lang} />
  return <FileSizeTargeterEditor file={file} lang={lang} />
}
function TransparencyEditorTool({ lang }) {
  const [file, setFile] = useState(null)
  if (!file) return <ImageUploadZone onFile={setFile} lang={lang} />
  return <TransparencyEditor file={file} lang={lang} />
}
function ImageUpscalerTool({ lang }) {
  const [file, setFile] = useState(null)
  if (!file) return <ImageUploadZone onFile={setFile} lang={lang} />
  return <ImageUpscalerEditor file={file} lang={lang} />
}
function AspectRatioConverterTool({ lang }) {
  const [file, setFile] = useState(null)
  if (!file) return <ImageUploadZone onFile={setFile} lang={lang} />
  return <AspectRatioEditor file={file} lang={lang} />
}
function DpiConverterTool({ lang }) {
  const [file, setFile] = useState(null)
  if (!file) return <ImageUploadZone onFile={setFile} lang={lang} />
  return <DpiConverterEditor file={file} lang={lang} />
}
function AddShadowTool({ lang }) {
  const [file, setFile] = useState(null)
  if (!file) return <ImageUploadZone onFile={setFile} lang={lang} />
  return <AddShadowEditor file={file} lang={lang} />
}
function GlowEffectTool({ lang }) {
  const [file, setFile] = useState(null)
  if (!file) return <ImageUploadZone onFile={setFile} lang={lang} />
  return <GlowEffectEditor file={file} lang={lang} />
}
function ColorReplacementTool({ lang }) {
  const [file, setFile] = useState(null)
  if (!file) return <ImageUploadZone onFile={setFile} lang={lang} />
  return <ColorReplacementEditor file={file} lang={lang} />
}
function CollageMakerTool({ lang }) {
  const [file, setFile] = useState(null)
  if (!file) return <ImageUploadZone onFile={setFile} lang={lang} />
  return <CollageMakerEditor file={file} lang={lang} />
}
function ContactSheetTool({ lang }) {
  const [file, setFile] = useState(null)
  if (!file) return <ImageUploadZone onFile={setFile} lang={lang} />
  return <ContactSheetEditor file={file} lang={lang} />
}
function PlaceholderGeneratorTool({ lang }) {
  return <PlaceholderGeneratorEditor lang={lang} />
}

/* ═══ TEXT TOOLS ═══ */

function WordCounterTool({ lang }) {
  const [text, setText] = useState('')
  const stats = countWords(text)
  const labels = { en: ['Words','Characters','No Spaces','Sentences','Paragraphs','Reading time'], fr: ['Mots','Caractères','Sans espaces','Phrases','Paragraphes','Temps de lecture'], ar: ['كلمات','أحرف','بدون مسافات','جمل','فقرات','وقت القراءة'] }[lang]
  return (
    <div className="space-y-4">
      <textarea value={text} onChange={e=>setText(e.target.value)} rows={8} placeholder={lang==='ar'?'اكتب أو الصق النص هنا...':lang==='fr'?'Tapez ou collez votre texte ici...':'Type or paste your text here...'} className="input-field resize-none text-sm leading-relaxed" />
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[{label:labels[0],value:stats.words},{label:labels[1],value:stats.characters},{label:labels[2],value:stats.charactersNoSpaces},{label:labels[3],value:stats.sentences},{label:labels[4],value:stats.paragraphs},{label:labels[5],value:`${stats.readingTime} min`}].map((s,i)=>(
          <div key={i} className="bg-[#F7F8FA] dark:bg-[#18181B] rounded-xl p-3 text-center border border-[#E5E7EB] dark:border-[#27272A]"><p className="text-xl font-bold text-blue-600 dark:text-blue-400">{s.value}</p><p className="text-xs text-[#6B7280] dark:text-[#A1A1AA] mt-0.5">{s.label}</p></div>
        ))}
      </div>
    </div>
  )
}

function CharacterCounterTool({ lang }) {
  const [text, setText] = useState('')
  const stats = countCharacters(text)
  const labels = { en: ['Characters','No Spaces','Letters','Digits','Spaces','Lines','Special'], fr: ['Caractères','Sans espaces','Lettres','Chiffres','Espaces','Lignes','Spéciaux'], ar: ['أحرف','بدون مسافات','حروف','أرقام','مسافات','أسطر','رموز خاصة'] }[lang]
  return (
    <div className="space-y-4">
      <textarea value={text} onChange={e=>setText(e.target.value)} rows={8} placeholder={lang==='ar'?'اكتب أو الصق النص هنا...':lang==='fr'?'Tapez ou collez votre texte ici...':'Type or paste your text here...'} className="input-field resize-none text-sm leading-relaxed" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[{label:labels[0],value:stats.characters},{label:labels[1],value:stats.charactersNoSpaces},{label:labels[2],value:stats.letters},{label:labels[3],value:stats.digits},{label:labels[4],value:stats.spaces},{label:labels[5],value:stats.lines},{label:labels[6],value:stats.specialChars}].map((s,i)=>(
          <div key={i} className="bg-[#F7F8FA] dark:bg-[#18181B] rounded-xl p-3 text-center border border-[#E5E7EB] dark:border-[#27272A]"><p className="text-xl font-bold text-blue-600 dark:text-blue-400">{s.value}</p><p className="text-xs text-[#6B7280] dark:text-[#A1A1AA] mt-0.5">{s.label}</p></div>
        ))}
      </div>
    </div>
  )
}

function CaseConverterTool({ lang }) {
  const [text, setText] = useState('')
  const [result, setResult] = useState('')
  const modes = [
    {id:'upper',label:lang==='ar'?'أحرف كبيرة':lang==='fr'?'MAJUSCULE':'UPPERCASE'},
    {id:'lower',label:lang==='ar'?'أحرف صغيرة':lang==='fr'?'minuscule':'lowercase'},
    {id:'title',label:lang==='ar'?'حالة العنوان':lang==='fr'?'Titre':'Title Case'},
    {id:'sentence',label:lang==='ar'?'حالة الجملة':lang==='fr'?'Phrase':'Sentence case'},
    {id:'camel',label:'camelCase'},{id:'pascal',label:'PascalCase'},
    {id:'snake',label:'snake_case'},{id:'kebab',label:'kebab-case'},
    {id:'alternating',label:lang==='ar'?'متناوب':lang==='fr'?'Alterné':'aLtErNaTiNg'},
  ]
  return (
    <div className="space-y-4">
      <textarea value={text} onChange={e=>{setText(e.target.value);setResult('')}} rows={6} placeholder={lang==='ar'?'اكتب أو الصق النص هنا...':lang==='fr'?'Tapez ou collez votre texte ici...':'Type or paste your text here...'} className="input-field resize-none text-sm leading-relaxed" />
      <div className="flex flex-wrap gap-2">
        {modes.map(m=>(
          <button key={m.id} onClick={()=>setResult(convertCase(text,m.id))} className="px-3 py-2 rounded-lg text-xs font-medium bg-[#F7F8FA] dark:bg-[#18181B] text-[#111111] dark:text-[#FAFAFA] hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-700 dark:hover:text-blue-300 transition-colors">{m.label}</button>
        ))}
      </div>
      {result && (
        <div className="space-y-3 animate-fade-in">
          <div className="p-4 rounded-xl bg-[#F7F8FA] dark:bg-[#18181B] border border-[#E5E7EB] dark:border-[#27272A] min-h-[100px]">
            <p className="text-sm text-[#111111] dark:text-[#FAFAFA] whitespace-pre-wrap break-words">{result}</p>
          </div>
          <div className="flex gap-3">
            <button onClick={()=>navigator.clipboard.writeText(result)} className="btn-primary rounded-xl px-5 py-2.5 text-sm flex-1">{lang==='ar'?'نسخ':lang==='fr'?'Copier':'Copy'}</button>
            <button onClick={()=>{const blob=new Blob([result],{type:'text/plain'});downloadBlob(blob,'converted-text.txt')}} className="btn-ghost rounded-xl px-5 py-2.5 text-sm border border-[#E5E7EB] dark:border-[#27272A]">{lang==='ar'?'تحميل':lang==='fr'?'Télécharger':'Download'}</button>
          </div>
        </div>
      )}
    </div>
  )
}

/* ═══ CALCULATORS ═══ */

function AgeCalculatorTool({ lang }) {
  const [birthDate, setBirthDate] = useState('')
  const [result, setResult] = useState(null)
  const labels = { en:{label:'Date of Birth',calc:'Calculate',years:'Years',months:'Months',days:'Days',totalDays:'Total Days',totalMonths:'Total Months',totalWeeks:'Total Weeks',nextBday:'Days to next birthday'}, fr:{label:'Date de naissance',calc:'Calculer',years:'Ans',months:'Mois',days:'Jours',totalDays:'Jours totaux',totalMonths:'Mois totaux',totalWeeks:'Semaines totales',nextBday:'Jours avant anniversaire'}, ar:{label:'تاريخ الميلاد',calc:'احسب',years:'سنوات',months:'شهور',days:'أيام',totalDays:'إجمالي الأيام',totalMonths:'إجمالي الشهور',totalWeeks:'إجمالي الأسابيع',nextBday:'أيام حتى عيد الميلاد'} }[lang]
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-[#111111] dark:text-[#FAFAFA] mb-2">{labels.label}</label>
        <input type="date" value={birthDate} onChange={e=>setBirthDate(e.target.value)} max={new Date().toISOString().split('T')[0]} className="input-field" />
      </div>
      <button onClick={()=>{if(birthDate)setResult(calculateAge(birthDate))}} disabled={!birthDate} className="btn-primary w-full justify-center py-3.5 text-sm disabled:opacity-50">{labels.calc}</button>
      {result && (
        <div className="space-y-3 animate-fade-in">
          <div className="grid grid-cols-3 gap-3">
            {[{v:result.years,l:labels.years},{v:result.months,l:labels.months},{v:result.days,l:labels.days}].map((s,i)=>(
              <div key={i} className="bg-blue-50 dark:bg-blue-950/30 rounded-xl p-4 text-center border border-blue-100 dark:border-blue-900"><p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{s.v}</p><p className="text-xs text-[#6B7280] dark:text-[#A1A1AA] mt-1">{s.l}</p></div>
            ))}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[{label:labels.totalDays,value:result.totalDays.toLocaleString()},{label:labels.totalMonths,value:result.totalMonths.toLocaleString()},{label:labels.totalWeeks,value:result.totalWeeks.toLocaleString()},{label:labels.nextBday,value:result.nextBirthdayDays}].map((s,i)=>(
              <div key={i} className="bg-[#F7F8FA] dark:bg-[#18181B] rounded-xl p-3 text-center border border-[#E5E7EB] dark:border-[#27272A]"><p className="text-lg font-bold text-[#111111] dark:text-[#FAFAFA]">{s.value}</p><p className="text-[10px] text-[#6B7280] dark:text-[#A1A1AA] mt-0.5">{s.label}</p></div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function BMICalculatorTool({ lang }) {
  const [weight, setWeight] = useState('')
  const [height, setHeight] = useState('')
  const [result, setResult] = useState(null)
  const labels = { en:{weight:'Weight (kg)',height:'Height (cm)',calc:'Calculate',bmi:'BMI',category:'Category'}, fr:{weight:'Poids (kg)',height:'Taille (cm)',calc:'Calculer',bmi:'IMC',category:'Catégorie'}, ar:{weight:'الوزن (كجم)',height:'الطول (سم)',calc:'احسب',bmi:'مؤشر كتلة الجسم',category:'الفئة'} }[lang]
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div><label className="block text-sm font-medium text-[#111111] dark:text-[#FAFAFA] mb-2">{labels.weight}</label><input type="number" value={weight} onChange={e=>setWeight(e.target.value)} className="input-field" placeholder="70" /></div>
        <div><label className="block text-sm font-medium text-[#111111] dark:text-[#FAFAFA] mb-2">{labels.height}</label><input type="number" value={height} onChange={e=>setHeight(e.target.value)} className="input-field" placeholder="175" /></div>
      </div>
      <button onClick={()=>{if(weight&&height)setResult(calculateBMI(weight,height))}} disabled={!weight||!height} className="btn-primary w-full justify-center py-3.5 text-sm disabled:opacity-50">{labels.calc}</button>
      {result && (
        <div className="space-y-3 animate-fade-in">
          <div className="bg-blue-50 dark:bg-blue-950/30 rounded-xl p-6 text-center border border-blue-100 dark:border-blue-900"><p className="text-5xl font-bold text-blue-600 dark:text-blue-400">{result.bmi}</p><p className="text-sm text-[#6B7280] dark:text-[#A1A1AA] mt-2">{labels.bmi}</p></div>
          <div className={`rounded-xl p-4 text-center border ${result.categoryColor==='green'?'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900 text-green-700 dark:text-green-400':result.categoryColor==='blue'?'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-400':result.categoryColor==='amber'?'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900 text-amber-700 dark:text-amber-400':'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900 text-red-700 dark:text-red-400'}`}><p className="text-sm font-semibold">{labels.category}: {result.category}</p></div>
        </div>
      )}
    </div>
  )
}

function PercentageCalculatorTool({ lang }) {
  const [type, setType] = useState('of')
  const [values, setValues] = useState({})
  const [result, setResult] = useState(null)
  const labels = { en:{of:'X% of Y',iswhat:'X is what % of Y',increase:'% Increase',decrease:'% Decrease',percent:'Percentage',total:'Total',part:'Part',from:'From',to:'To',calc:'Calculate'}, fr:{of:'X% de Y',iswhat:'X est quel % de Y',increase:'% Augmentation',decrease:'% Diminution',percent:'Pourcentage',total:'Total',part:'Partie',from:'De',to:'À',calc:'Calculer'}, ar:{of:'X% من Y',iswhat:'X كم % من Y',increase:'% زيادة',decrease:'% نقصان',percent:'النسبة',total:'المجموع',part:'الجزء',from:'من',to:'إلى',calc:'احسب'} }[lang]
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        {['of','iswhat','increase','decrease'].map(t=>(
          <button key={t} onClick={()=>{setType(t);setValues({});setResult(null)}} className={`py-2.5 rounded-lg text-xs font-medium border transition-colors ${type===t?'border-blue-500 bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400':'border-[#E5E7EB] dark:border-[#27272A] text-[#6B7280] dark:text-[#A1A1AA]'}`}>{labels[t]}</button>
        ))}
      </div>
      <div className="space-y-3">
        {(type==='of'||type==='iswhat')&&(<>
          <div><label className="block text-sm font-medium text-[#111111] dark:text-[#FAFAFA] mb-1.5">{type==='of'?labels.percent:labels.part}</label><input type="number" value={values.percent||values.part||''} onChange={e=>setValues(v=>({...v,[type==='of'?'percent':'part']:e.target.value}))} className="input-field" /></div>
          <div><label className="block text-sm font-medium text-[#111111] dark:text-[#FAFAFA] mb-1.5">{labels.total}</label><input type="number" value={values.total||''} onChange={e=>setValues(v=>({...v,total:e.target.value}))} className="input-field" /></div>
        </>)}
        {(type==='increase'||type==='decrease')&&(<>
          <div><label className="block text-sm font-medium text-[#111111] dark:text-[#FAFAFA] mb-1.5">{labels.from}</label><input type="number" value={values.from||''} onChange={e=>setValues(v=>({...v,from:e.target.value}))} className="input-field" /></div>
          <div><label className="block text-sm font-medium text-[#111111] dark:text-[#FAFAFA] mb-1.5">{labels.to}</label><input type="number" value={values.to||''} onChange={e=>setValues(v=>({...v,to:e.target.value}))} className="input-field" /></div>
        </>)}
      </div>
      <button onClick={()=>setResult(calculatePercentage(type,values))} disabled={Object.keys(values).length<2} className="btn-primary w-full justify-center py-3.5 text-sm disabled:opacity-50">{labels.calc}</button>
      {result && <div className="bg-blue-50 dark:bg-blue-950/30 rounded-xl p-6 text-center border border-blue-100 dark:border-blue-900 animate-fade-in"><p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{result.result}</p><p className="text-xs text-[#6B7280] dark:text-[#A1A1AA] mt-2">{result.formula}</p></div>}
    </div>
  )
}

/* ═══ TOOL REGISTRY ═══ */

const TOOL_COMPONENTS = {
  // PDF Tools (20)
  'pdf-to-word': PdfToWordTool,
  'word-to-pdf': WordToPdfTool,
  'pdf-to-jpg': PdfToJpgTool,
  'pdf-to-png': PdfToPngTool,
  'jpg-to-pdf': JpgToPdfTool,
  'png-to-pdf': PngToPdfTool,
  'merge-pdf': MergePdfTool,
  'split-pdf': SplitPdfTool,
  'compress-pdf': CompressPdfTool,
  'rotate-pdf': RotatePdfTool,
  'delete-pdf-pages': DeletePdfPagesTool,
  'extract-pdf-pages': ExtractPdfPagesTool,
  'reorder-pdf-pages': ReorderPdfPagesTool,
  'pdf-page-counter': PdfPageCounterTool,
  'pdf-metadata-viewer': PdfMetadataViewerTool,
  'protect-pdf': ProtectPdfTool,
  'unlock-pdf': UnlockPdfTool,
  'add-pdf-watermark': AddWatermarkPdfTool,
  'add-page-numbers-pdf': AddPageNumbersPdfTool,
  'extract-images-from-pdf': ExtractImagesFromPdfTool,
  // Image Tools (20)
  'compress-image': CompressImageTool,
  'resize-image': ResizeImageTool,
  'crop-image': CropImageTool,
  'rotate-image': RotateImageTool,
  'jpg-to-png': (props) => <ImageConvertTool {...props} targetExt="png" outputMime="image/png" />,
  'png-to-jpg': (props) => <ImageConvertTool {...props} targetExt="jpg" outputMime="image/jpeg" />,
  'webp-to-jpg': (props) => <ImageConvertTool {...props} targetExt="jpg" outputMime="image/jpeg" />,
  'image-converter': ImageConverterToolWrapper,
  'image-to-base64': ImageToBase64Tool,
  'base64-to-image': Base64ToImageToolWrapper,
  'grayscale-image': GrayscaleImageTool,
  'blur-image': BlurImageTool,
  'image-watermark': ImageWatermarkTool,
  'image-metadata-viewer': ImageMetadataViewerTool,
  'flip-image': FlipImageTool,
  'add-image-border': AddImageBorderTool,
  'rounded-corners': RoundedCornersTool,
  'image-brightness': ImageBrightnessTool,
  'image-contrast': ImageContrastTool,
  'image-saturation': ImageSaturationTool,
  'pixelate-image': PixelateImageTool,
  'sharpen-image': SharpenImageTool,
  'invert-image': InvertImageTool,
  'color-adjustment': ColorAdjustmentTool,
  'redact-image': RedactImageTool,
  'erase-area': EraseAreaTool,
  'sepia-image': SepiaImageTool,
  'posterize-image': PosterizeImageTool,
  'threshold-image': ThresholdImageTool,
  'duotone-image': DuotoneImageTool,
  'image-noise': ImageNoiseTool,
  'image-denoise': ImageDenoiseTool,
  'edge-detection': EdgeDetectionTool,
  'emboss-image': EmbossImageTool,
  'sketch-image': SketchImageTool,
  'color-picker': ColorPickerTool,
  'extract-palette': ExtractPaletteTool,
  'image-splitter': ImageSplitterTool,
  'image-slicer': ImageSlicerTool,
  'social-media-resizer': SocialMediaResizerTool,
  'passport-photo': PassportPhotoTool,
  'file-size-targeter': FileSizeTargeterTool,
  'transparency-editor': TransparencyEditorTool,
  'image-upscaler': ImageUpscalerTool,
  'aspect-ratio-converter': AspectRatioConverterTool,
  'dpi-converter': DpiConverterTool,
  'add-shadow': AddShadowTool,
  'glow-effect': GlowEffectTool,
  'color-replacement': ColorReplacementTool,
  'collage-maker': CollageMakerTool,
  'contact-sheet': ContactSheetTool,
  'placeholder-generator': PlaceholderGeneratorTool,
  // Text Tools (3)
  'word-counter': WordCounterTool,
  'character-counter': CharacterCounterTool,
  'case-converter': CaseConverterTool,
  // Calculators (3)
  'age-calculator': AgeCalculatorTool,
  'bmi-calculator': BMICalculatorTool,
  'percentage-calculator': PercentageCalculatorTool,
}

function ComingSoon({ lang, t }) {
  return (
    <div className="py-12 text-center">
      <div className="w-16 h-16 rounded-full bg-[#F7F8FA] dark:bg-[#18181B] flex items-center justify-center mx-auto mb-5"><Wrench className="w-7 h-7 text-gray-400" /></div>
      <h3 className="font-bold text-lg text-[#111111] dark:text-[#FAFAFA] mb-2">{t.tools.comingSoon}</h3>
      <p className="text-sm text-[#6B7280] dark:text-[#A1A1AA] max-w-sm mx-auto">{t.tools.comingSoonDesc}</p>
    </div>
  )
}

function ToolInterface({ tool, lang, t }) {
  const [batchMode, setBatchMode] = useState(false)
  const ToolComponent = TOOL_COMPONENTS[tool.slug]
  const supportsBatch = BATCH_SUPPORTED.has(tool.slug)
  const batchConfig = BATCH_CONFIG[tool.slug]

  if (!ToolComponent) return <ComingSoon lang={lang} t={t} />

  if (batchMode && supportsBatch && batchConfig) {
    return (
      <div>
        <BatchProcessor
          toolSlug={tool.slug}
          lang={lang}
          t={t}
          accept={batchConfig.accept}
          hint={batchConfig.hint}
          processor={batchConfig.processor}
          settingsComponent={batchConfig.settingsComponent}
          orderMatters={batchConfig.orderMatters}
        />
      </div>
    )
  }

  return (
    <div>
      {supportsBatch && (
        <div className="flex items-center justify-end mb-3">
          <button
            onClick={() => setBatchMode(true)}
            className="text-xs font-medium text-[#6B7280] dark:text-[#A1A1AA] hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1.5 transition-colors px-3 py-1.5 rounded-lg border border-[#E5E7EB] dark:border-[#27272A] hover:border-blue-300 dark:hover:border-blue-700"
          >
            <Layers className="w-3.5 h-3.5" />
            {lang === 'ar' ? 'وضع الدفعات' : lang === 'fr' ? 'Mode Lot' : 'Batch Mode'}
          </button>
        </div>
      )}
      <ToolComponent lang={lang} t={t} />
    </div>
  )
}

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
  const seoData = toolSeoData[tool.slug]
  if (seoData) {
    if (lang === 'fr' && seoData.faqFr && seoData.faqFr.length > 0) return seoData.faqFr
    if (lang === 'ar' && seoData.faqAr && seoData.faqAr.length > 0) return seoData.faqAr
    if (seoData.faq && seoData.faq.length > 0) return seoData.faq
  }
  // Fallback generic FAQ
  return [
    { q: lang==='ar'?'هل هذه الأداة مجانية؟':lang==='fr'?'Cet outil est-il gratuit ?':'Is this tool free?', a: lang==='ar'?'نعم، مجانية 100% بدون قيود.':lang==='fr'?'Oui, 100% gratuit sans restriction.':'Yes, 100% free with no restrictions.' },
    { q: lang==='ar'?'هل أحتاج إلى تسجيل؟':lang==='fr'?'Ai-je besoin de m\'inscrire ?':'Do I need to register?', a: lang==='ar'?'لا، استخدم الأداة مباشرة.':lang==='fr'?'Non, utilisez l\'outil directement.':'No, just open and use it instantly.' },
    { q: lang==='ar'?'هل ملفاتي آمنة؟':lang==='fr'?'Mes fichiers sont-ils sécurisés ?':'Are my files safe?', a: lang==='ar'?'نعم، يتم معالجة كل شيء في متصفحك.':lang==='fr'?'Oui, tout est traité dans votre navigateur.':'Yes, everything is processed in your browser. No files uploaded to any server.' },
  ]
}

export default function ToolPage({ slug, lang, t }) {
  const tool = tools.find(to => to.slug === slug)

  const { addRecent } = useRecentTools()
  const recentTrackedRef = useRef(null)
  useEffect(() => {
    if (tool && recentTrackedRef.current !== slug) {
      recentTrackedRef.current = slug
      addRecent(slug)
    }
  }, [slug, addRecent, tool])

  if (!tool) return (
    <div className="max-w-3xl mx-auto px-4 py-12 md:py-20 text-center">
      <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-950/30 flex items-center justify-center mx-auto mb-4">
        <AlertCircle className="w-8 h-8 text-red-500" />
      </div>
      <h1 className="text-xl font-bold text-[#111111] dark:text-[#FAFAFA] mb-2">{lang==='ar'?'الأداة غير موجودة':lang==='fr'?'Outil introuvable':'Tool not found'}</h1>
      <p className="text-sm text-[#6B7280] dark:text-[#A1A1AA] mb-6">{lang==='ar'?'قد تكون الأداة قد تم نقلها أو لم تعد متاحة.':lang==='fr'?'Cet outil a peut-être été déplacé ou n\'est plus disponible.':'This tool may have been moved or is no longer available.'}</p>
      <div className="flex items-center justify-center gap-3 flex-wrap">
        <Link to="/" className="btn-primary rounded-xl px-5 py-2.5 text-sm">{t.breadcrumb.home}</Link>
        <Link to="/categories" className="px-5 py-2.5 text-sm font-medium rounded-xl border border-[#E5E7EB] dark:border-[#27272A] text-[#6B7280] dark:text-[#A1A1AA] hover:bg-[#F7F8FA] dark:hover:bg-[#18181B]">{t.nav.categories}</Link>
        <Link to="/search" className="px-5 py-2.5 text-sm font-medium rounded-xl border border-[#E5E7EB] dark:border-[#27272A] text-[#6B7280] dark:text-[#A1A1AA] hover:bg-[#F7F8FA] dark:hover:bg-[#18181B]">{lang==='ar'?'بحث':lang==='fr'?'Rechercher':'Search'}</Link>
      </div>
    </div>
  )

  const category = categories.find(c => c.id === tool.categoryId)
  const Icon = getIcon(tool.icon)
  const catMap = Object.fromEntries(categories.map(c => [c.id, c]))

  // Tool-specific SEO data
  const seoData = toolSeoData[tool.slug] || {}
  const seoTitle = lang === 'ar' ? (seoData.seoTitleAr || seoData.seoTitle || tool.name[lang]) : lang === 'fr' ? (seoData.seoTitleFr || seoData.seoTitle || tool.name[lang]) : (seoData.seoTitle || tool.name[lang])
  const seoDesc = lang === 'ar' ? (seoData.seoDescriptionAr || seoData.seoDescription || tool.description.ar) : lang === 'fr' ? (seoData.seoDescriptionFr || seoData.seoDescription || tool.description.fr) : (seoData.seoDescription || tool.description.en)
  const h1 = seoData.h1 || tool.name[lang]
  const intro = lang === 'ar' ? (seoData.introAr || seoData.intro || tool.description.ar) : lang === 'fr' ? (seoData.introFr || seoData.intro || tool.description.fr) : (seoData.intro || tool.description.en)
  const features = seoData.features || []
  const howToSteps = seoData.howTo || []
  const faqs = getFAQ(tool, lang)

  // Related tools: use explicit mapping if available, fallback to same category
  const relatedSlugs = (toolSeoData._related && toolSeoData._related[tool.slug]) || []
  const relatedTools = relatedSlugs.length > 0
    ? relatedSlugs.map(s => tools.find(to => to.slug === s)).filter(Boolean).slice(0, 6)
    : tools.filter(to => to.categoryId === tool.categoryId && to.id !== tool.id).slice(0, 6)

  // Breadcrumb items for JSON-LD
  const breadcrumbItems = [
    { name: 'Home', url: '/' },
    { name: 'Categories', url: '/categories' },
    category && { name: category.name.en, url: `/categories/${category.slug}` },
    { name: tool.name.en, url: `/tools/${tool.slug}` },
  ].filter(Boolean)

  // Combined JSON-LD: breadcrumb + FAQ + tool
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      buildBreadcrumbJsonLd(breadcrumbItems),
      buildToolJsonLd(tool, category, seoDesc),
      ...(faqs.length > 0 ? [buildFaqJsonLd(faqs)] : []),
    ],
  }

  useSEO({
    title: seoTitle,
    description: seoDesc,
    canonical: `/tools/${tool.slug}`,
    lang,
    jsonLd,
  })
  useToolViews(tool.slug)

  const howToLabel = lang === 'ar' ? `كيفية استخدام ${tool.name.ar}` : lang === 'fr' ? `Comment utiliser ${tool.name.fr}` : `How to use ${tool.name.en}`
  const featuresLabel = lang === 'ar' ? 'لماذا SmartTools؟' : lang === 'fr' ? 'Pourquoi SmartTools ?' : 'Why use SmartTools?'

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 md:py-8 animate-fade-in">
      <Breadcrumb items={[{label:t.breadcrumb.home,href:'/'},{label:t.nav.categories,href:'/categories'},category&&{label:category.name[lang],href:`/categories/${category.slug}`},{label:tool.name[lang]}].filter(Boolean)} />
      <div className="flex items-start gap-4 mb-6 md:mb-8">
        <div className={`shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br ${category?.color || 'from-blue-600 to-blue-500'} flex items-center justify-center shadow-sm`}><Icon className="w-7 h-7 text-white" strokeWidth={1.6} /></div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-[#111111] dark:text-[#FAFAFA] leading-tight">{h1}</h1>
            <FavoriteButton slug={tool.slug} size="lg" lang={lang} />
          </div>
          <p className="text-sm text-[#6B7280] dark:text-[#A1A1AA] mt-1 leading-relaxed">{seoDesc}</p>
          {category && <Link to={`/categories/${category.slug}`} className={`inline-flex items-center gap-1 mt-2 text-xs font-semibold px-2.5 py-1 rounded-full ${category.bg} ${category.text} ${category.border} border`}><Icon className="w-3 h-3" strokeWidth={2} /> {category.name[lang]}</Link>}
        </div>
      </div>
      <div className="bg-white dark:bg-[#111113] border border-[#E5E7EB] dark:border-[#27272A] rounded-xl p-5 md:p-8 mb-6 shadow-card"><ToolInterface tool={tool} lang={lang} t={t} /></div>

      {/* SEO Content: Intro */}
      {intro && (
        <div className="mb-8 prose-content">
          <p className="text-sm text-[#6B7280] dark:text-[#A1A1AA] leading-relaxed">{intro}</p>
        </div>
      )}

      {/* SEO Content: Features */}
      {features.length > 0 && (
        <div className="mb-8">
          <h2 className="font-bold text-base text-[#111111] dark:text-[#FAFAFA] mb-4">{featuresLabel}</h2>
          <ul className="space-y-2">
            {features.map((feat, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-[#6B7280] dark:text-[#A1A1AA]">
                <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                <span>{feat}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* SEO Content: How To */}
      {howToSteps.length > 0 && (
        <div className="mb-8">
          <h2 className="font-bold text-base text-[#111111] dark:text-[#FAFAFA] mb-4">{howToLabel}</h2>
          <ol className="space-y-3">
            {howToSteps.map((step, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-xs font-bold flex items-center justify-center">{i + 1}</span>
                <span className="text-sm text-[#6B7280] dark:text-[#A1A1AA] leading-relaxed pt-0.5">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* FAQ */}
      <div className="mb-8"><h2 className="font-bold text-base text-[#111111] dark:text-[#FAFAFA] mb-4 flex items-center gap-2"><HelpCircle className="w-5 h-5 text-blue-500" />{t.tools.faq}</h2><div className="space-y-2">{faqs.map((faq,i)=><FAQItem key={i} question={faq.q} answer={faq.a} />)}</div></div>

      {/* Related Tools */}
      {relatedTools.length > 0 && (
        <div>
          <h2 className="font-bold text-base text-[#111111] dark:text-[#FAFAFA] mb-4">{t.tools.related}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">{relatedTools.map(rt=><ToolCard key={rt.id} tool={rt} lang={lang} t={t} category={catMap[rt.categoryId]} showNewBadge={false} />)}</div>
        </div>
      )}
    </div>
  )
}
