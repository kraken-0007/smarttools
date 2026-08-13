/**
 * BatchProcessor — wraps existing tool processors for batch mode.
 * Provides: multi-file upload, file queue, settings, processing, results, ZIP download.
 *
 * Props:
 *   toolSlug  — the tool slug (determines which processor to use)
 *   lang      — current language
 *   t         — translations
 *   accept    — file accept string (e.g. "image/*", "application/pdf")
 *   hint      — file hint text (e.g. "JPG PNG WEBP • 50 MB")
 *   processor — async function(file, settings) => { blob, filename }
 *   settingsComponent — optional React component for batch settings
 *   orderMatters — whether file order matters (for merge etc.)
 */
import { useState, useCallback, useRef } from 'react'
import { Layers, UploadCloud, FileText, X, Download, RefreshCw, Check, AlertCircle, Loader2, Package } from 'lucide-react'
import BatchUpload from './BatchUpload'
import BatchFileList from './BatchFileList'
import BatchProgress from './BatchProgress'
import BatchResult from './BatchResult'
import { createZip } from '../lib/zipHelper'

export default function BatchProcessor({
  toolSlug,
  lang,
  t,
  accept = 'image/*',
  hint = '',
  processor,
  settingsComponent: SettingsComponent,
  orderMatters = false,
}) {
  const [files, setFiles] = useState([])
  const [phase, setPhase] = useState('upload') // upload | settings | processing | results
  const [progress, setProgress] = useState({ current: 0, total: 0 })
  const [results, setResults] = useState([])
  const [settings, setSettings] = useState({})
  const fileInputRef = useRef(null)

  const labels = {
    en: {
      batch: 'Batch Mode',
      single: 'Single File',
      addFiles: 'Add Files',
      clearAll: 'Clear All',
      applyTo: 'Apply to',
      files: 'files',
      processAll: 'Process All',
      processing: 'Processing',
      completed: 'completed',
      remaining: 'remaining',
      downloadAll: 'Download All',
      downloadZip: 'Download as ZIP',
      retryFailed: 'Retry Failed',
      startOver: 'Start Over',
      filesProcessed: 'files processed',
      successful: 'successful',
      failed: 'failed',
      download: 'Download',
    },
    fr: {
      batch: 'Mode Lot',
      single: 'Fichier Unique',
      addFiles: 'Ajouter',
      clearAll: 'Tout Effacer',
      applyTo: 'Appliquer à',
      files: 'fichiers',
      processAll: 'Traiter Tout',
      processing: 'Traitement',
      completed: 'terminés',
      remaining: 'restants',
      downloadAll: 'Tout Télécharger',
      downloadZip: 'Télécharger en ZIP',
      retryFailed: 'Réessayer',
      startOver: 'Recommencer',
      filesProcessed: 'fichiers traités',
      successful: 'réussis',
      failed: 'échoués',
      download: 'Télécharger',
    },
    ar: {
      batch: 'وضع الدفعات',
      single: 'ملف واحد',
      addFiles: 'إضافة ملفات',
      clearAll: 'مسح الكل',
      applyTo: 'تطبيق على',
      files: 'ملفات',
      processAll: 'معالجة الكل',
      processing: 'جاري المعالجة',
      completed: 'مكتمل',
      remaining: 'متبقي',
      downloadAll: 'تحميل الكل',
      downloadZip: 'تحميل كـ ZIP',
      retryFailed: 'إعادة المحاولة',
      startOver: 'ابدأ من جديد',
      filesProcessed: 'ملفات معالجة',
      successful: 'ناجح',
      failed: 'فشل',
      download: 'تحميل',
    },
  }[lang]

  const handleFilesAdded = useCallback((newFiles) => {
    const fileObjects = newFiles.map(file => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      file,
      status: 'pending',
    }))
    setFiles(prev => [...prev, ...fileObjects])
    setPhase('settings')
  }, [])

  const handleRemove = useCallback((id) => {
    setFiles(prev => prev.filter(f => f.id !== id))
    if (files.length <= 1) setPhase('upload')
  }, [files.length])

  const handleClearAll = useCallback(() => {
    setFiles([])
    setPhase('upload')
    setResults([])
  }, [])

  const handleAddMore = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleFileInput = useCallback((e) => {
    if (e.target.files?.length) {
      handleFilesAdded(Array.from(e.target.files))
      e.target.value = ''
    }
  }, [handleFilesAdded])

  const processAll = useCallback(async () => {
    setPhase('processing')
    setProgress({ current: 0, total: files.length })
    const batchResults = []

    for (let i = 0; i < files.length; i++) {
      const fileItem = files[i]
      setFiles(prev => prev.map((f, idx) =>
        idx === i ? { ...f, status: 'processing' } : f
      ))

      try {
        const result = await processor(fileItem.file, settings)
        batchResults.push({
          id: fileItem.id,
          file: fileItem.file,
          status: 'success',
          result: result,
        })
        setFiles(prev => prev.map((f, idx) =>
          idx === i ? { ...f, status: 'success' } : f
        ))
      } catch (err) {
        batchResults.push({
          id: fileItem.id,
          file: fileItem.file,
          status: 'error',
          error: err.message || 'Processing failed',
        })
        setFiles(prev => prev.map((f, idx) =>
          idx === i ? { ...f, status: 'error', error: err.message } : f
        ))
      }

      setProgress({ current: i + 1, total: files.length })
    }

    setResults(batchResults)
    setPhase('results')
  }, [files, processor, settings])

  const handleDownloadFile = useCallback((result) => {
    if (result?.result?.blob) {
      const url = URL.createObjectURL(result.result.blob)
      const a = document.createElement('a')
      a.href = url
      a.download = result.result.filename || 'output'
      a.click()
      setTimeout(() => URL.revokeObjectURL(url), 100)
    }
  }, [])

  const handleDownloadAll = useCallback(() => {
    results.filter(r => r.status === 'success').forEach((r, i) => {
      setTimeout(() => handleDownloadFile(r), i * 200)
    })
  }, [results, handleDownloadFile])

  const handleDownloadZip = useCallback(async () => {
    const successResults = results.filter(r => r.status === 'success' && r.result?.blob)
    if (successResults.length === 0) return

    const zipFiles = successResults.map((r, i) => ({
      name: r.result.filename || `output-${i + 1}`,
      blob: r.result.blob,
    }))

    try {
      const zipBlob = await createZip(zipFiles)
      const url = URL.createObjectURL(zipBlob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'smarttools-results.zip'
      a.click()
      setTimeout(() => URL.revokeObjectURL(url), 100)
    } catch (err) {
      console.error('ZIP creation failed:', err)
      // Fallback to individual downloads
      handleDownloadAll()
    }
  }, [results, handleDownloadAll])

  const handleRetryFailed = useCallback(() => {
    const failed = results.filter(r => r.status === 'error')
    setFiles(prev => prev.map(f => {
      const failedResult = failed.find(r => r.id === f.id)
      return failedResult ? { ...f, status: 'pending', error: undefined } : f
    }))
    setPhase('settings')
  }, [results])

  const handleStartOver = useCallback(() => {
    setFiles([])
    setResults([])
    setPhase('upload')
    setProgress({ current: 0, total: 0 })
  }, [])

  if (phase === 'processing') {
    return <BatchProgress current={progress.current} total={progress.total} lang={lang} />
  }

  if (phase === 'results') {
    return (
      <BatchResult
        results={results}
        lang={lang}
        onDownloadAll={handleDownloadAll}
        onDownloadZip={handleDownloadZip}
        onRetryFailed={results.some(r => r.status === 'error') ? handleRetryFailed : undefined}
        onReset={handleStartOver}
      />
    )
  }

  return (
    <div className="space-y-4">
      {/* Hidden file input for "Add More" */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple
        onChange={handleFileInput}
        className="hidden"
      />

      {files.length === 0 ? (
        <BatchUpload accept={accept} onFiles={handleFilesAdded} lang={lang} hint={hint} />
      ) : (
        <>
          {/* Settings */}
          {SettingsComponent && (
            <div className="rounded-xl border border-[#E5E7EB] dark:border-[#27272A] bg-[#F7F8FA] dark:bg-[#18181B] p-4">
              <SettingsComponent settings={settings} setSettings={setSettings} lang={lang} fileCount={files.length} />
            </div>
          )}

          {/* File Queue */}
          <BatchFileList
            files={files}
            onRemove={handleRemove}
            onReorder={orderMatters ? (from, to) => {
              setFiles(prev => {
                const next = [...prev]
                const [moved] = next.splice(from, 1)
                next.splice(to, 0, moved)
                return next
              })
            } : undefined}
            lang={lang}
            orderMatters={orderMatters}
          />

          {/* Actions */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <button onClick={handleAddMore} className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1.5 transition-colors">
                <UploadCloud className="w-4 h-4" />
                {labels.addFiles}
              </button>
              <span className="text-[#E5E7EB] dark:text-[#27272A]">|</span>
              <button onClick={handleClearAll} className="text-sm font-medium text-[#6B7280] dark:text-[#A1A1AA] hover:text-red-500 flex items-center gap-1.5 transition-colors">
                <X className="w-4 h-4" />
                {labels.clearAll}
              </button>
            </div>
            <button onClick={processAll} className="btn-primary rounded-lg px-5 py-2.5 text-sm flex items-center gap-2">
              <Layers className="w-4 h-4" />
              {labels.processAll}
              <span className="opacity-70">({files.length})</span>
            </button>
          </div>
        </>
      )}
    </div>
  )
}
