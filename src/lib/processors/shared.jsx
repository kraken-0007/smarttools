/**
 * Tool Registry — maps tool slugs to their processing configuration.
 * Each entry defines: component type, processor function, options, and labels.
 * Tools not in this registry show "Coming Soon".
 */

import { useState, useRef, useCallback } from 'react'
import { Download, Loader2, AlertCircle, CheckCircle2, UploadCloud, FileText, Image as ImageIcon, X, File } from 'lucide-react'

/* ─── Shared File Upload Component ──────────────── */
export function FileUploader({ accept, multiple, onFiles, lang, hint }) {
  const [dragOver, setDragOver] = useState(false)
  const [files, setFiles] = useState([])
  const [previews, setPreviews] = useState([])
  const inputRef = useRef(null)

  const handleFiles = useCallback((fileList) => {
    const arr = Array.from(fileList)
    setFiles(arr)
    onFiles(multiple ? arr : arr[0] || null)
    // Generate previews for images
    setPreviews(arr.map(f => {
      if (f.type.startsWith('image/')) return URL.createObjectURL(f)
      return null
    }))
  }, [onFiles, multiple])

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    handleFiles(e.dataTransfer.files)
  }

  const removeFile = (idx) => {
    const next = files.filter((_, i) => i !== idx)
    setFiles(next)
    onFiles(multiple ? next : next[0] || null)
    if (previews[idx]) URL.revokeObjectURL(previews[idx])
    setPreviews(previews.filter((_, i) => i !== idx))
    if (inputRef.current) inputRef.current.value = ''
  }

  const formatSize = (b) => {
    if (b < 1024) return b + ' B'
    if (b < 1048576) return (b / 1024).toFixed(1) + ' KB'
    return (b / 1048576).toFixed(1) + ' MB'
  }

  const labels = {
    en: { drop: 'Drop files here', or: 'or', choose: 'Choose File', remove: 'Remove', formats: 'Supported formats' },
    fr: { drop: 'Déposez vos fichiers', or: 'ou', choose: 'Choisir un fichier', remove: 'Supprimer', formats: 'Formats pris en charge' },
    ar: { drop: 'أفلت الملفات هنا', or: 'أو', choose: 'اختر ملف', remove: 'إزالة', formats: 'الصيغ المدعومة' },
  }[lang]

  if (files.length > 0) {
    return (
      <div className="space-y-3">
        {files.map((file, i) => (
          <div key={i} className="flex items-center gap-3 p-3.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
            {previews[i] ? (
              <img src={previews[i]} alt={file.name} className="w-12 h-12 rounded-lg object-cover shrink-0" />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center shrink-0">
                <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" strokeWidth={1.6} />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{file.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{formatSize(file.size)}</p>
            </div>
            <button onClick={() => removeFile(i)} className="shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
        <button onClick={() => inputRef.current?.click()} className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium">
          + {lang === 'ar' ? 'إضافة المزيد' : lang === 'fr' ? 'Ajouter plus' : 'Add more'}
        </button>
      </div>
    )
  }

  return (
    <div
      className={`upload-box p-8 md:p-12 text-center cursor-pointer ${dragOver ? 'dragover' : ''}`}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') inputRef.current?.click() }}
    >
      <input ref={inputRef} type="file" className="hidden" accept={accept} multiple={multiple}
        onChange={(e) => handleFiles(e.target.files)} />
      <div className="flex flex-col items-center gap-3">
        <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center">
          <UploadCloud className="w-7 h-7 text-blue-600 dark:text-blue-400" strokeWidth={1.6} />
        </div>
        <p className="text-base font-bold text-gray-900 dark:text-white">{labels.drop}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">{labels.or}</p>
        <span className="btn-primary rounded-xl px-5 py-2.5 text-sm">{labels.choose}</span>
        {hint && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{hint}</p>}
      </div>
    </div>
  )
}

/* ─── Process Button + Result Display ──────────── */
export function ProcessButton({ onClick, loading, label, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className="btn-primary w-full justify-center py-3.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Processing...
        </>
      ) : label}
    </button>
  )
}

export function ResultDisplay({ results, lang }) {
  if (!results || results.length === 0) return null
  const labels = {
    en: { success: 'Processing complete!', download: 'Download', downloadAll: 'Download All' },
    fr: { success: 'Traitement terminé !', download: 'Télécharger', downloadAll: 'Tout télécharger' },
    ar: { success: 'اكتملت المعالجة!', download: 'تحميل', downloadAll: 'تحميل الكل' },
  }[lang]

  const downloadFile = (blob, filename) => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 100)
  }

  return (
    <div className="space-y-3 animate-fade-in">
      <div className="flex items-center gap-2 p-3 rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 text-green-700 dark:text-green-400 text-sm font-medium">
        <CheckCircle2 className="w-4 h-4 shrink-0" />
        {labels.success}
      </div>
      {results.map((r, i) => (
        <div key={i} className="flex items-center justify-between gap-3 p-3.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center shrink-0">
              <Download className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-sm font-medium text-gray-900 dark:text-white truncate">{r.filename}</span>
          </div>
          <button
            onClick={() => downloadFile(r.blob, r.filename)}
            className="shrink-0 btn-primary rounded-lg px-4 py-2 text-xs"
          >
            {labels.download}
          </button>
        </div>
      ))}
      {results.length > 1 && (
        <button
          onClick={() => results.forEach(r => downloadFile(r.blob, r.filename))}
          className="w-full text-center text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium"
        >
          {labels.downloadAll}
        </button>
      )}
    </div>
  )
}

export function ErrorDisplay({ message, lang }) {
  return (
    <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 text-sm animate-fade-in">
      <AlertCircle className="w-4 h-4 shrink-0" />
      {message}
    </div>
  )
}

/* ─── Tool Processor Hook ──────────────────────── */
export function useToolProcessor(processor, lang) {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState(null)
  const [error, setError] = useState(null)

  const process = async (input, options) => {
    setLoading(true)
    setError(null)
    setResults(null)
    try {
      const output = await processor(input, options)
      const arr = Array.isArray(output) ? output : [output]
      setResults(arr)
    } catch (e) {
      setError(e.message || (lang === 'ar' ? 'حدث خطأ' : lang === 'fr' ? 'Une erreur est survenue' : 'An error occurred'))
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setResults(null)
    setError(null)
    setLoading(false)
  }

  return { loading, results, error, process, reset }
}
