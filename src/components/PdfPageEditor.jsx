/**
 * PdfPageEditor — Visual PDF page selector with thumbnails.
 * Supports: page selection, drag reorder, rotation, deletion.
 * Used by: Split PDF, Delete Pages, Extract Pages, Reorder Pages, Rotate PDF.
 *
 * Uses pdfjs-dist (lazy-loaded) to render page thumbnails.
 * Uses pointer events for unified mouse + touch support.
 */

import { useState, useRef, useEffect } from 'react'
import { Loader2, RotateCw, Trash2, Check, GripVertical } from 'lucide-react'

/* Lazy-load pdfjs only when this component mounts */
let pdfjsPromise = null
function loadPdfjs() {
  if (!pdfjsPromise) {
    pdfjsPromise = import('pdfjs-dist').then(pdfjsLib => {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`
      return pdfjsLib
    })
  }
  return pdfjsPromise
}

export default function PdfPageEditor({ file, mode = 'select', onConfirm, lang, confirmLabel }) {
  const [pages, setPages] = useState([])
  const [loading, setLoading] = useState(true)
  const [dragIndex, setDragIndex] = useState(null)
  const [dragOverIndex, setDragOverIndex] = useState(null)
  const [touchStartIdx, setTouchStartIdx] = useState(null)

  const labels = {
    en: { loading: 'Loading pages...', pages: 'pages', selected: 'selected', confirm: 'Confirm', dragHint: 'Drag pages to reorder', selectHint: 'Click pages to select', rotateHint: 'Click rotate icon on each page' },
    fr: { loading: 'Chargement des pages...', pages: 'pages', selected: 'sélectionnées', confirm: 'Confirmer', dragHint: 'Glissez pour réorganiser', selectHint: 'Cliquez pour sélectionner', rotateHint: 'Cliquez sur l\'icône de rotation' },
    ar: { loading: 'جارٍ تحميل الصفحات...', pages: 'صفحات', selected: 'محددة', confirm: 'تأكيد', dragHint: 'اسحب لإعادة الترتيب', selectHint: 'انقر للتحديد', rotateHint: 'انقر على أيقونة التدوير' },
  }[lang]

  useEffect(() => {
    let cancelled = false
    async function renderPages() {
      setLoading(true)
      try {
        const pdfjsLib = await loadPdfjs()
        const arrayBuffer = await file.arrayBuffer()
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
        const pageData = []
        for (let i = 1; i <= pdf.numPages; i++) {
          if (cancelled) return
          const page = await pdf.getPage(i)
          const viewport = page.getViewport({ scale: 0.4 })
          const canvas = document.createElement('canvas')
          canvas.width = viewport.width
          canvas.height = viewport.height
          const ctx = canvas.getContext('2d')
          await page.render({ canvasContext: ctx, viewport }).promise
          const thumbUrl = canvas.toDataURL('image/jpeg', 0.7)
          pageData.push({ originalIndex: i - 1, thumbUrl, rotation: 0, selected: false })
        }
        if (!cancelled) { setPages(pageData); setLoading(false) }
      } catch (err) {
        console.error('PdfPageEditor render error:', err)
        if (!cancelled) setLoading(false)
      }
    }
    renderPages()
    return () => { cancelled = true }
  }, [file])

  const toggleSelect = (idx) => {
    if (mode !== 'select') return
    setPages(prev => prev.map((p, i) => i === idx ? { ...p, selected: !p.selected } : p))
  }
  const rotatePage = (idx) => {
    setPages(prev => prev.map((p, i) => i === idx ? { ...p, rotation: (p.rotation + 90) % 360 } : p))
  }
  const removePage = (idx) => {
    setPages(prev => prev.filter((_, i) => i !== idx))
  }

  const handleDragStart = (e, idx) => {
    if (mode !== 'reorder') return
    setDragIndex(idx); e.dataTransfer.effectAllowed = 'move'
  }
  const handleDragOver = (e, idx) => {
    if (mode !== 'reorder' || dragIndex === null) return
    e.preventDefault(); setDragOverIndex(idx)
  }
  const handleDrop = (e, idx) => {
    if (mode !== 'reorder' || dragIndex === null) return
    e.preventDefault()
    setPages(prev => { const next = [...prev]; const [m] = next.splice(dragIndex, 1); next.splice(idx, 0, m); return next })
    setDragIndex(null); setDragOverIndex(null)
  }
  const handleDragEnd = () => { setDragIndex(null); setDragOverIndex(null) }

  const handleTouchStart = (idx) => { if (mode === 'reorder') setTouchStartIdx(idx) }
  const handleTouchEnd = (idx) => {
    if (mode !== 'reorder' || touchStartIdx === null || touchStartIdx === idx) { setTouchStartIdx(null); return }
    setPages(prev => { const next = [...prev]; const [m] = next.splice(touchStartIdx, 1); next.splice(idx, 0, m); return next })
    setTouchStartIdx(null)
  }

  const selectedCount = pages.filter(p => p.selected).length
  const totalCount = pages.length

  const handleConfirm = () => {
    if (mode === 'select') {
      onConfirm({ selectedPages: pages.filter(p => p.selected).map(p => p.originalIndex) })
    } else if (mode === 'reorder') {
      onConfirm({ newOrder: pages.map(p => p.originalIndex) })
    } else if (mode === 'rotate') {
      onConfirm({ rotations: pages.map(p => p.rotation) })
    } else if (mode === 'delete') {
      onConfirm({ remainingPages: pages.map(p => p.originalIndex) })
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <p className="text-sm text-[#6B7280] dark:text-[#A1A1AA]">{labels.loading}</p>
      </div>
    )
  }

  const hint = mode === 'reorder' ? labels.dragHint : mode === 'select' ? labels.selectHint : mode === 'rotate' ? labels.rotateHint : ''

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-sm text-[#6B7280] dark:text-[#A1A1AA]">
          {totalCount} {labels.pages}
          {mode === 'select' && selectedCount > 0 && ` · ${selectedCount} ${labels.selected}`}
        </p>
        {hint && <p className="text-xs text-[#6B7280] dark:text-[#A1A1AA] italic">{hint}</p>}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {pages.map((page, idx) => (
          <div
            key={`${page.originalIndex}-${idx}`}
            className={`relative group rounded-xl border-2 overflow-hidden transition-all
              ${page.selected ? 'border-blue-500 ring-2 ring-blue-200 dark:ring-blue-900'
                : dragOverIndex === idx ? 'border-blue-400 border-dashed'
                : 'border-[#E5E7EB] dark:border-[#27272A] hover:border-blue-300'}
              ${mode === 'select' ? 'cursor-pointer' : ''}
            `}
            draggable={mode === 'reorder'}
            onDragStart={(e) => handleDragStart(e, idx)}
            onDragOver={(e) => handleDragOver(e, idx)}
            onDrop={(e) => handleDrop(e, idx)}
            onDragEnd={handleDragEnd}
            onClick={() => toggleSelect(idx)}
            onTouchStart={() => handleTouchStart(idx)}
            onTouchEnd={() => handleTouchEnd(idx)}
          >
            <div className="aspect-[3/4] bg-[#F7F8FA] dark:bg-[#18181B] flex items-center justify-center overflow-hidden">
              <img src={page.thumbUrl} alt={`Page ${page.originalIndex + 1}`}
                className="max-w-full max-h-full object-contain"
                style={{ transform: `rotate(${page.rotation}deg)` }} />
            </div>
            <div className="absolute top-1.5 start-1.5 px-1.5 py-0.5 rounded-md bg-black/70 text-white text-[10px] font-medium backdrop-blur-sm">
              {idx + 1}
            </div>
            {mode === 'reorder' && (
              <div className="absolute top-1.5 end-1.5 p-1 rounded-md bg-black/50 text-white backdrop-blur-sm opacity-60">
                <GripVertical className="w-3.5 h-3.5" />
              </div>
            )}
            {page.selected && (
              <div className="absolute top-1.5 end-1.5 w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                <Check className="w-3 h-3 text-white" strokeWidth={3} />
              </div>
            )}
            {(mode === 'rotate' || mode === 'delete') && (
              <div className="absolute bottom-1.5 end-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {mode === 'rotate' && (
                  <button onClick={(e) => { e.stopPropagation(); rotatePage(idx) }}
                    className="p-1.5 rounded-md bg-black/70 text-white hover:bg-blue-600 backdrop-blur-sm transition-colors">
                    <RotateCw className="w-3.5 h-3.5" />
                  </button>
                )}
                {mode === 'delete' && (
                  <button onClick={(e) => { e.stopPropagation(); removePage(idx) }}
                    className="p-1.5 rounded-md bg-black/70 text-white hover:bg-red-600 backdrop-blur-sm transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <button onClick={handleConfirm}
        disabled={mode === 'select' && selectedCount === 0}
        className="btn-primary w-full justify-center py-3.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed">
        {confirmLabel || labels.confirm}
      </button>
    </div>
  )
}
