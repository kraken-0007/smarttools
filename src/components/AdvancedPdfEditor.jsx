/**
 * AdvancedPdfEditor — Professional visual PDF page editor.
 *
 * Features: visual thumbnails, multi-select (click/ctrl/shift), drag&drop reorder
 * (mouse+touch), rotate, delete, duplicate, extract, split, move first/last/left/right,
 * zoom, large preview, undo/redo, reset, page numbering, watermark, multi-PDF merge,
 * keyboard navigation, search/jump to page, page info, mobile support, dark mode, RTL.
 */

import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import {
  buildPDFFromEditorState, extractPDFPagesByIndex, mergePDFsWithOrder,
  addPageNumbersAdvanced, addWatermarkAdvanced,
} from '../lib/processors/pdf.js'
import {
  Loader2, RotateCcw, RotateCw, Trash2, Copy, Download, Check, X,
  ZoomIn, ZoomOut, Maximize, Undo2, Redo2, RefreshCw,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ChevronFirst, ChevronLast,
  FileText, AlertCircle, Layers, Columns, MoveLeft, MoveRight,
  Hash, Droplet, Eye, UploadCloud,
} from 'lucide-react'

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

const T = {
  en: {
    loading: 'Loading pages...', pages: 'pages', selected: 'selected', of: 'of',
    rotateLeft: 'Rotate Left', rotateRight: 'Rotate Right',
    duplicate: 'Duplicate', delete: 'Delete', extract: 'Extract', split: 'Split',
    moveLeft: 'Move Left', moveRight: 'Move Right', moveFirst: 'Move to Beginning', moveLast: 'Move to End',
    selectAll: 'Select All', clearSelection: 'Clear Selection',
    zoomIn: 'Zoom In', zoomOut: 'Zoom Out', fitToScreen: 'Fit to Screen', resetZoom: 'Reset Zoom',
    undo: 'Undo', redo: 'Redo', resetEditor: 'Reset Editor', resetConfirm: 'Reset all changes? This cannot be undone.',
    confirm: 'Confirm', cancel: 'Cancel', startOver: 'Start Over', download: 'Download',
    page: 'Page', goToPage: 'Go to page', go: 'Go', portrait: 'Portrait', landscape: 'Landscape',
    deleteConfirm: (n) => `Delete ${n} page${n > 1 ? 's' : ''}?`,
    pageNumbers: 'Page Numbers', watermark: 'Watermark',
    position: 'Position', format: 'Format', fontSize: 'Font Size', margin: 'Margin', startNum: 'Start Number',
    applyTo: 'Apply to', allPages: 'All Pages', selectedPages: 'Selected Pages',
    watermarkText: 'Text', opacity: 'Opacity', rotation: 'Rotation', color: 'Color',
    top: 'Top', bottom: 'Bottom', left: 'Left', center: 'Center', right: 'Right',
    addPageNumbers: 'Add Page Numbers', addWatermark: 'Add Watermark',
    dragDrop: 'Drag & drop PDF here, or click to select',
    merge: 'Merge & Download', exportPdf: 'Export & Download PDF',
    noPages: 'No pages remaining. Reset to start over.',
    changesApplied: 'Changes applied', original: 'Original', deleted: 'Deleted', added: 'Added',
    noSelection: 'No page selected for preview', thumbnailView: 'Thumbnails',
    errorCorrupted: 'This PDF appears to be corrupted or invalid.',
    errorPassword: 'This PDF is password-protected. Please unlock it first.',
    errorLarge: 'This PDF is too large. Maximum 100 MB.',
    errorGeneric: 'Failed to load PDF.', splitResults: 'Split Results', pageColon: 'Page',
    splitAll: 'Split Every Page', splitSelected: 'Split Selected',
  },
  fr: {
    loading: 'Chargement des pages...', pages: 'pages', selected: 'sélectionnées', of: 'sur',
    rotateLeft: 'Pivoter Gauche', rotateRight: 'Pivoter Droite',
    duplicate: 'Dupliquer', delete: 'Supprimer', extract: 'Extraire', split: 'Diviser',
    moveLeft: 'Déplacer Gauche', moveRight: 'Déplacer Droite', moveFirst: 'Début', moveLast: 'Fin',
    selectAll: 'Tout Sélectionner', clearSelection: 'Effacer Sélection',
    zoomIn: 'Agrandir', zoomOut: 'Réduire', fitToScreen: 'Ajuster', resetZoom: 'Réinitialiser',
    undo: 'Annuler', redo: 'Rétablir', resetEditor: 'Réinitialiser', resetConfirm: 'Réinitialiser toutes les modifications ?',
    confirm: 'Confirmer', cancel: 'Annuler', startOver: 'Recommencer', download: 'Télécharger',
    page: 'Page', goToPage: 'Aller à la page', go: 'Aller', portrait: 'Portrait', landscape: 'Paysage',
    deleteConfirm: (n) => `Supprimer ${n} page${n > 1 ? 's' : ''} ?`,
    pageNumbers: 'Numéros de Page', watermark: 'Filigrane',
    position: 'Position', format: 'Format', fontSize: 'Taille Police', margin: 'Marge', startNum: 'Numéro Début',
    applyTo: 'Appliquer à', allPages: 'Toutes les Pages', selectedPages: 'Pages Sélectionnées',
    watermarkText: 'Texte', opacity: 'Opacité', rotation: 'Rotation', color: 'Couleur',
    top: 'Haut', bottom: 'Bas', left: 'Gauche', center: 'Centre', right: 'Droite',
    addPageNumbers: 'Ajouter Numéros', addWatermark: 'Ajouter Filigrane',
    dragDrop: 'Glissez-déposez le PDF ici, ou cliquez',
    merge: 'Fusionner & Télécharger', exportPdf: 'Exporter & Télécharger',
    noPages: 'Aucune page restante. Réinitialiser pour recommencer.',
    changesApplied: 'Modifications appliquées', original: 'Original', deleted: 'Supprimées', added: 'Ajoutées',
    noSelection: 'Aucune page sélectionnée', thumbnailView: 'Vignettes',
    errorCorrupted: 'Ce PDF semble corrompu ou invalide.',
    errorPassword: 'Ce PDF est protégé par mot de passe.',
    errorLarge: 'Ce PDF est trop volumineux. Maximum 100 Mo.',
    errorGeneric: 'Échec du chargement du PDF.', splitResults: 'Résultats Division', pageColon: 'Page',
    splitAll: 'Diviser Chaque Page', splitSelected: 'Diviser Sélection',
  },
  ar: {
    loading: 'جارٍ تحميل الصفحات...', pages: 'صفحات', selected: 'محددة', of: 'من',
    rotateLeft: 'تدوير يسار', rotateRight: 'تدوير يمين',
    duplicate: 'نسخ', delete: 'حذف', extract: 'استخراج', split: 'تقسيم',
    moveLeft: 'نقل يسار', moveRight: 'نقل يمين', moveFirst: 'نقل للبداية', moveLast: 'نقل للنهاية',
    selectAll: 'تحديد الكل', clearSelection: 'إلغاء التحديد',
    zoomIn: 'تكبير', zoomOut: 'تصغير', fitToScreen: 'ملاءمة', resetZoom: 'إعادة التكبير',
    undo: 'تراجع', redo: 'إعادة', resetEditor: 'إعادة التحرير', resetConfirm: 'إعادة جميع التغييرات؟ لا يمكن التراجع.',
    confirm: 'تأكيد', cancel: 'إلغاء', startOver: 'ابدأ من جديد', download: 'تحميل',
    page: 'صفحة', goToPage: 'اذهب لصفحة', go: 'اذهب', portrait: 'طولي', landscape: 'عرضي',
    deleteConfirm: (n) => `حذف ${n} صفحة؟`,
    pageNumbers: 'أرقام الصفحات', watermark: 'علامة مائية',
    position: 'الموضع', format: 'الصيغة', fontSize: 'حجم الخط', margin: 'الهامش', startNum: 'رقم البداية',
    applyTo: 'تطبيق على', allPages: 'كل الصفحات', selectedPages: 'الصفحات المحددة',
    watermarkText: 'النص', opacity: 'الشفافية', rotation: 'الدوران', color: 'اللون',
    top: 'أعلى', bottom: 'أسفل', left: 'يسار', center: 'وسط', right: 'يمين',
    addPageNumbers: 'إضافة أرقام', addWatermark: 'إضافة علامة مائية',
    dragDrop: 'اسحب وأسقط PDF هنا، أو انقر للاختيار',
    merge: 'دمج وتحميل', exportPdf: 'تصدير وتحميل',
    noPages: 'لا توجد صفحات متبقية. أعد التهيئة للبدء من جديد.',
    changesApplied: 'تم تطبيق التغييرات', original: 'الأصلي', deleted: 'محذوف', added: 'مضاف',
    noSelection: 'لا توجد صفحة محددة للمعاينة', thumbnailView: 'مصغرات',
    errorCorrupted: 'هذا الملف تالف أو غير صالح.',
    errorPassword: 'هذا الملف محمي بكلمة مرور.',
    errorLarge: 'هذا الملف كبير جداً. الحد الأقصى 100 ميجابايت.',
    errorGeneric: 'فشل تحميل الملف.', splitResults: 'نتائج التقسيم', pageColon: 'صفحة',
    splitAll: 'تقسيم كل صفحة', splitSelected: 'تقسيم المحدد',
  },
}

let _idCounter = 0
function uid() { return `p${Date.now()}_${_idCounter++}` }

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename
  document.body.appendChild(a); a.click(); document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function AdvancedPdfEditor({ files: initialFiles, mode = 'edit', lang = 'en', onConfirm, confirmLabel, features: featureOverrides }) {
  const tr = T[lang] || T.en
  const features = useMemo(() => ({
    rotate: true, delete: true, duplicate: true, reorder: true,
    extract: true, split: true, numbering: true, watermark: true,
    merge: mode === 'merge', ...featureOverrides,
  }), [mode, featureOverrides])

  const [editorPages, setEditorPages] = useState([])
  const [originalPages, setOriginalPages] = useState([])
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [lastSelectedId, setLastSelectedId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [zoom, setZoom] = useState(1.0)
  const [previewPageId, setPreviewPageId] = useState(null)
  const [dragState, setDragState] = useState({ dragging: false, dragId: null, overId: null })
  const [showPageNumbers, setShowPageNumbers] = useState(false)
  const [showWatermark, setShowWatermark] = useState(false)
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null)
  const [splitResults, setSplitResults] = useState(null)
  const [exportResult, setExportResult] = useState(null)
  const [processing, setProcessing] = useState(false)
  const [searchPage, setSearchPage] = useState('')
  const [history, setHistory] = useState([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const MAX_HISTORY = 20
  const containerRef = useRef(null)
  const previewCanvasRef = useRef(null)
  const fileInputRef = useRef(null)
  const touchDataRef = useRef(null)

  const pushHistory = useCallback((newPages) => {
    setHistory(prev => {
      const trimmed = prev.slice(0, historyIndex + 1)
      trimmed.push(newPages)
      if (trimmed.length > MAX_HISTORY) trimmed.shift()
      return trimmed
    })
    setHistoryIndex(prev => Math.min(prev + 1, MAX_HISTORY - 1))
  }, [historyIndex])

  const undo = useCallback(() => {
    setHistoryIndex(prevIdx => {
      if (prevIdx <= 0) return prevIdx
      return prevIdx - 1
    })
    setSelectedIds(new Set())
  }, [])

  const redo = useCallback(() => {
    setHistoryIndex(prevIdx => {
      if (prevIdx >= history.length - 1) return prevIdx
      return prevIdx + 1
    })
    setSelectedIds(new Set())
  }, [history.length])

  // Sync editor pages when history index changes (undo/redo/reset)
  useEffect(() => {
    if (historyIndex >= 0 && history[historyIndex]) {
      setEditorPages(history[historyIndex])
    }
  }, [historyIndex]) // intentionally only historyIndex

  const loadPdfFiles = useCallback(async (fileList) => {
    setLoading(true); setError(null); setSplitResults(null); setExportResult(null)
    try {
      const pdfjsLib = await loadPdfjs()
      const allPages = []
      let docId = 0
      for (const file of fileList) {
        if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) { setError(tr.errorCorrupted); setLoading(false); return }
        if (file.size > 100 * 1024 * 1024) { setError(tr.errorLarge); setLoading(false); return }
        const arrayBuffer = await file.arrayBuffer()
        let pdf
        try { pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise }
        catch (err) { setError(err.name === 'PasswordException' ? tr.errorPassword : tr.errorCorrupted); setLoading(false); return }
        for (let i = 1; i <= pdf.numPages; i++) {
          if (i > 200) break
          const page = await pdf.getPage(i)
          const viewport = page.getViewport({ scale: 0.3 })
          const canvas = document.createElement('canvas')
          canvas.width = Math.max(1, Math.floor(viewport.width))
          canvas.height = Math.max(1, Math.floor(viewport.height))
          const ctx = canvas.getContext('2d')
          await page.render({ canvasContext: ctx, viewport, canvas }).promise
          const thumbUrl = canvas.toDataURL('image/jpeg', 0.6)
          const fullVp = page.getViewport({ scale: 1.0 })
          allPages.push({ id: uid(), file, fileName: file.name, originalIndex: i - 1, rotation: 0, thumbUrl, width: Math.round(fullVp.width), height: Math.round(fullVp.height), orientation: fullVp.width > fullVp.height ? 'landscape' : 'portrait', docId })
        }
        docId++
        pdf.destroy()
      }
      setEditorPages(allPages); setOriginalPages(allPages)
      setHistory([allPages]); setHistoryIndex(0)
      setLoading(false)
    } catch (err) { console.error('PDF load error:', err); setError(tr.errorGeneric); setLoading(false) }
  }, [tr])

  useEffect(() => {
    if (initialFiles) { const files = Array.isArray(initialFiles) ? initialFiles : [initialFiles]; loadPdfFiles(files) }
  }, []) // eslint-disable-line

  const handlePageClick = useCallback((e, pageId) => {
    e.stopPropagation()
    const isCtrl = e.ctrlKey || e.metaKey
    const isShift = e.shiftKey
    setSelectedIds(prev => {
      const newSet = new Set(prev)
      if (isShift && lastSelectedId) {
        const ids = editorPages.map(p => p.id)
        const start = ids.indexOf(lastSelectedId), end = ids.indexOf(pageId)
        if (start !== -1 && end !== -1) { const [from, to] = start < end ? [start, end] : [end, start]; for (let i = from; i <= to; i++) newSet.add(ids[i]) }
      } else if (isCtrl) { if (newSet.has(pageId)) newSet.delete(pageId); else newSet.add(pageId) }
      else { newSet.clear(); newSet.add(pageId) }
      return newSet
    })
    setLastSelectedId(pageId); setPreviewPageId(pageId)
  }, [editorPages, lastSelectedId])

  const selectAll = useCallback(() => setSelectedIds(new Set(editorPages.map(p => p.id))), [editorPages])
  const clearSelection = useCallback(() => { setSelectedIds(new Set()); setPreviewPageId(null) }, [])

  const selectedIndices = useMemo(() => editorPages.map((p, i) => selectedIds.has(p.id) ? i : -1).filter(i => i !== -1), [editorPages, selectedIds])

  const rotateSelected = useCallback((angle) => {
    if (selectedIndices.length === 0) return
    const newPages = editorPages.map((p, i) => selectedIndices.includes(i) ? { ...p, rotation: (p.rotation + angle) % 360 } : p)
    setEditorPages(newPages); pushHistory(newPages)
  }, [editorPages, selectedIndices, pushHistory])

  const deleteSelected = useCallback(() => {
    if (selectedIndices.length === 0 || editorPages.length - selectedIndices.length <= 0) return
    setShowDeleteConfirm(selectedIndices.length)
  }, [selectedIndices, editorPages.length])

  const confirmDelete = useCallback(() => {
    const deleteSet = new Set(selectedIndices)
    const newPages = editorPages.filter((_, i) => !deleteSet.has(i))
    setEditorPages(newPages); pushHistory(newPages)
    setSelectedIds(new Set()); setPreviewPageId(null); setShowDeleteConfirm(null)
  }, [editorPages, selectedIndices, pushHistory])

  const duplicateSelected = useCallback(() => {
    if (selectedIndices.length === 0) return
    const newPages = []
    editorPages.forEach((page, i) => { newPages.push(page); if (selectedIndices.includes(i)) newPages.push({ ...page, id: uid() }) })
    setEditorPages(newPages); pushHistory(newPages); setSelectedIds(new Set())
  }, [editorPages, selectedIndices, pushHistory])

  const moveSelected = useCallback((dir) => {
    if (selectedIndices.length === 0) return
    const indices = [...selectedIndices].sort((a, b) => a - b)
    const newPages = [...editorPages]
    const selectedPages = indices.map(i => newPages[i])
    if (dir === 'first') { const remaining = newPages.filter((_, i) => !indices.includes(i)); const result = [...selectedPages, ...remaining]; setEditorPages(result); pushHistory(result) }
    else if (dir === 'last') { const remaining = newPages.filter((_, i) => !indices.includes(i)); const result = [...remaining, ...selectedPages]; setEditorPages(result); pushHistory(result) }
    else if (dir === 'left') { const moved = [...newPages]; for (const idx of indices) { if (idx > 0 && !indices.includes(idx - 1)) [moved[idx-1], moved[idx]] = [moved[idx], moved[idx-1]] }; setEditorPages(moved); pushHistory(moved) }
    else if (dir === 'right') { const moved = [...newPages]; for (let j = indices.length - 1; j >= 0; j--) { const idx = indices[j]; if (idx < moved.length - 1 && !indices.includes(idx + 1)) [moved[idx+1], moved[idx]] = [moved[idx], moved[idx+1]] }; setEditorPages(moved); pushHistory(moved) }
  }, [editorPages, selectedIndices, pushHistory])

  const onPointerDownPage = useCallback((e, pageId) => {
    if (!features.reorder || e.target.closest('button')) return
    touchDataRef.current = { pageId, startX: e.clientX, startY: e.clientY, started: false }
  }, [features.reorder])

  const onPointerMovePage = useCallback((e) => {
    const data = touchDataRef.current; if (!data) return
    if (!data.started && (Math.abs(e.clientX - data.startX) > 8 || Math.abs(e.clientY - data.startY) > 8)) {
      data.started = true; setDragState({ dragging: true, dragId: data.pageId, overId: null })
    }
  }, [])

  const onPointerEnterPage = useCallback((_, pageId) => {
    if (dragState.dragging) setDragState(prev => ({ ...prev, overId: pageId }))
  }, [dragState.dragging])

  const onPointerUpPage = useCallback(() => {
    const data = touchDataRef.current; if (!data) return
    if (data.started && dragState.overId && dragState.dragId !== dragState.overId) {
      const fromIdx = editorPages.findIndex(p => p.id === dragState.dragId)
      const toIdx = editorPages.findIndex(p => p.id === dragState.overId)
      if (fromIdx !== -1 && toIdx !== -1) {
        const newPages = [...editorPages]; const [moved] = newPages.splice(fromIdx, 1); newPages.splice(toIdx, 0, moved)
        setEditorPages(newPages); pushHistory(newPages)
      }
    }
    touchDataRef.current = null; setDragState({ dragging: false, dragId: null, overId: null })
  }, [dragState, editorPages, pushHistory])

  const resetEditor = useCallback(() => {
    setEditorPages(originalPages); pushHistory(originalPages)
    setSelectedIds(new Set()); setPreviewPageId(null)
    setShowPageNumbers(false); setShowWatermark(false); setShowResetConfirm(false)
    setSplitResults(null); setExportResult(null); setZoom(1.0)
  }, [originalPages, pushHistory])

  const handleExport = useCallback(async () => {
    if (editorPages.length === 0) return
    setProcessing(true)
    try {
            const blob = await buildPDFFromEditorState(editorPages)
      const originalIds = new Set(originalPages.map(p => p.id))
      const deletedCount = originalPages.length - editorPages.filter(p => originalIds.has(p.id)).length
      setExportResult({ blob, deleted: deletedCount, total: editorPages.length })
    } catch (err) { setError(err.message || 'Export failed') }
    setProcessing(false)
  }, [editorPages, originalPages])

  const handleExtract = useCallback(async () => {
    if (selectedIndices.length === 0) return
    setProcessing(true)
    try {
            const byFile = new Map()
      selectedIndices.forEach(idx => { const page = editorPages[idx]; if (!byFile.has(page.file)) byFile.set(page.file, []); byFile.get(page.file).push(page.originalIndex) })
      if (byFile.size === 1) { const [file, indices] = [...byFile.entries()][0]; const blob = await extractPDFPagesByIndex(file, indices); downloadBlob(blob, 'extracted-pages.pdf') }
      else { const docs = [...byFile.entries()].map(([file, pageIndices]) => ({ file, pageIndices })); const blob = await mergePDFsWithOrder(docs); downloadBlob(blob, 'extracted-pages.pdf') }
    } catch (err) { setError(err.message || 'Extract failed') }
    setProcessing(false)
  }, [editorPages, selectedIndices])

  const doSplit = useCallback(async (indices) => {
    setProcessing(true)
    try {
      const baseName = (editorPages[0]?.fileName || 'document').replace(/\.pdf$/i, '')
      const results = []
      for (const idx of indices) {
        const page = editorPages[idx]
        const { PDFDocument, degrees } = await import('pdf-lib')
        const arrayBuffer = await page.file.arrayBuffer()
        const srcDoc = await PDFDocument.load(arrayBuffer)
        const newDoc = await PDFDocument.create()
        const [copiedPage] = await newDoc.copyPages(srcDoc, [page.originalIndex])
        if (page.rotation) copiedPage.setRotation(degrees((copiedPage.getRotation().angle + page.rotation) % 360))
        newDoc.addPage(copiedPage)
        const bytes = await newDoc.save()
        results.push({ filename: `${baseName}_page_${idx + 1}.pdf`, blob: new Blob([bytes], { type: 'application/pdf' }) })
      }
      setSplitResults(results)
    } catch (err) { setError(err.message || 'Split failed') }
    setProcessing(false)
  }, [editorPages])

  const handleSplitAll = useCallback(() => doSplit(editorPages.map((_, i) => i)), [doSplit, editorPages])
  const handleSplitSelected = useCallback(() => { if (selectedIndices.length > 0) doSplit(selectedIndices) }, [doSplit, selectedIndices])

  const handleMerge = useCallback(async () => {
    setProcessing(true)
    try {
            const blob = await buildPDFFromEditorState(editorPages)
      downloadBlob(blob, 'merged.pdf')
      setExportResult({ blob, deleted: 0, total: editorPages.length })
    } catch (err) { setError(err.message || 'Merge failed') }
    setProcessing(false)
  }, [editorPages])

  useEffect(() => {
    const handleKey = (e) => {
      const tag = e.target.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target.isContentEditable) return
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); return }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); redo(); return }
      if (e.key === 'Escape') { clearSelection(); return }
      if (e.key === 'Delete' && selectedIds.size > 0 && editorPages.length > selectedIds.size) { e.preventDefault(); deleteSelected(); return }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault()
        const ids = editorPages.map(p => p.id)
        const cur = previewPageId ? ids.indexOf(previewPageId) : -1
        const dir = lang === 'ar' ? (e.key === 'ArrowRight' ? -1 : 1) : (e.key === 'ArrowLeft' ? -1 : 1)
        const next = Math.max(0, Math.min(ids.length - 1, cur + dir))
        if (ids[next]) { setPreviewPageId(ids[next]); setSelectedIds(new Set([ids[next]])); setLastSelectedId(ids[next]) }
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [undo, redo, clearSelection, deleteSelected, selectedIds, editorPages, previewPageId, lang])

  useEffect(() => {
    if (!previewPageId || !previewCanvasRef.current) return
    let cancelled = false
    let pdfDoc = null
    async function renderPreview() {
      const page = editorPages.find(p => p.id === previewPageId)
      if (!page || cancelled) return
      try {
        const pdfjsLib = await loadPdfjs()
        if (cancelled) return
        const arrayBuffer = await page.file.arrayBuffer()
        if (cancelled) return
        pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
        if (cancelled) { pdfDoc.destroy(); pdfDoc = null; return }
        const pdfPage = await pdfDoc.getPage(page.originalIndex + 1)
        if (cancelled) { pdfDoc.destroy(); pdfDoc = null; return }
        const container = previewCanvasRef.current
        if (!container) { pdfDoc.destroy(); pdfDoc = null; return }
        const containerWidth = container.parentElement?.clientWidth || 600
        const targetWidth = Math.min(containerWidth * zoom, 1200)
        const baseVp = pdfPage.getViewport({ scale: 1 })
        const viewport = pdfPage.getViewport({ scale: targetWidth / baseVp.width })
        container.width = Math.max(1, Math.floor(viewport.width))
        container.height = Math.max(1, Math.floor(viewport.height))
        const ctx = container.getContext('2d')
        await pdfPage.render({ canvasContext: ctx, viewport, canvas: container }).promise
        pdfDoc.destroy(); pdfDoc = null
      } catch (err) { if (pdfDoc) { try { pdfDoc.destroy() } catch(e){} pdfDoc = null } console.error('Preview error:', err) }
    }
    renderPreview()
    return () => { cancelled = true; if (pdfDoc) { try { pdfDoc.destroy() } catch(e){} } }
  }, [previewPageId, zoom, editorPages])

  const handleJumpToPage = useCallback(() => {
    const num = parseInt(searchPage)
    if (isNaN(num) || num < 1 || num > editorPages.length) return
    const pageId = editorPages[num - 1]?.id
    if (pageId) { setPreviewPageId(pageId); setSelectedIds(new Set([pageId])); setLastSelectedId(pageId); document.getElementById(`thumb-${pageId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }) }
    setSearchPage('')
  }, [editorPages, searchPage])

  if (!editorPages.length && !loading && !error) return <PdfUploadZone onFiles={loadPdfFiles} lang={lang} tr={tr} multiple={mode === 'merge'} fileInputRef={fileInputRef} />
  if (loading) return <div className="flex flex-col items-center justify-center py-16 gap-3"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /><p className="text-sm text-[#6B7280] dark:text-[#A1A1AA]">{tr.loading}</p></div>
  if (error && !editorPages.length) return <div className="flex flex-col items-center justify-center py-12 gap-4"><div className="w-14 h-14 rounded-full bg-red-50 dark:bg-red-950/30 flex items-center justify-center"><AlertCircle className="w-7 h-7 text-red-500" /></div><p className="text-sm text-red-600 dark:text-red-400 text-center max-w-sm">{error}</p><button onClick={() => setError(null)} className="text-sm font-medium text-blue-600 hover:underline">{tr.startOver}</button></div>

  if (splitResults) return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center gap-2 p-3 rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 text-green-700 dark:text-green-400 text-sm font-medium"><Check className="w-4 h-4 shrink-0" />{tr.splitResults}: {splitResults.length} {tr.pages}</div>
      <div className="space-y-2 max-h-80 overflow-y-auto">
        {splitResults.map((r, i) => <div key={i} className="flex items-center justify-between gap-3 p-3 rounded-lg border border-[#E5E7EB] dark:border-[#27272A] bg-white dark:bg-[#111113]"><div className="flex items-center gap-2 min-w-0"><FileText className="w-4 h-4 text-blue-500 shrink-0" /><span className="text-sm text-[#111111] dark:text-[#FAFAFA] truncate">{tr.pageColon} {i + 1}</span><span className="text-xs text-[#6B7280] dark:text-[#A1A1AA] shrink-0">({formatBytes(r.blob.size)})</span></div><button onClick={() => downloadBlob(r.blob, r.filename)} className="shrink-0 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1.5 transition-colors"><Download className="w-4 h-4" />{tr.download}</button></div>)}
      </div>
      <button onClick={() => setSplitResults(null)} className="text-sm text-[#6B7280] dark:text-[#A1A1AA] hover:text-blue-600 font-medium">{tr.startOver}</button>
    </div>
  )

  if (exportResult) return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center gap-2 p-3 rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 text-green-700 dark:text-green-400 text-sm font-medium"><Check className="w-4 h-4 shrink-0" />{tr.changesApplied}</div>
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-[#E5E7EB] dark:border-[#27272A] bg-[#F7F8FA] dark:bg-[#18181B] p-4 text-center"><p className="text-2xl font-bold text-[#111111] dark:text-[#FAFAFA]">{exportResult.total}</p><p className="text-xs text-[#6B7280] dark:text-[#A1A1AA] mt-1">{tr.pages}</p></div>
        <div className="rounded-xl border border-[#E5E7EB] dark:border-[#27272A] bg-[#F7F8FA] dark:bg-[#18181B] p-4 text-center"><p className="text-2xl font-bold text-[#111111] dark:text-[#FAFAFA]">{originalPages.length}</p><p className="text-xs text-[#6B7280] dark:text-[#A1A1AA] mt-1">{tr.original}</p></div>
        <div className="rounded-xl border border-[#E5E7EB] dark:border-[#27272A] bg-[#F7F8FA] dark:bg-[#18181B] p-4 text-center"><p className="text-2xl font-bold text-red-500">{exportResult.deleted > 0 ? exportResult.deleted : (exportResult.total - originalPages.length > 0 ? `+${exportResult.total - originalPages.length}` : 0)}</p><p className="text-xs text-[#6B7280] dark:text-[#A1A1AA] mt-1">{exportResult.deleted > 0 ? tr.deleted : tr.added}</p></div>
      </div>
      <button onClick={() => downloadBlob(exportResult.blob, mode === 'merge' ? 'merged.pdf' : 'edited-document.pdf')} className="btn-primary w-full justify-center py-3.5 text-sm flex items-center gap-2"><Download className="w-4 h-4" />{tr.download}</button>
      <button onClick={() => setExportResult(null)} className="text-sm text-[#6B7280] dark:text-[#A1A1AA] hover:text-blue-600 font-medium">{tr.startOver}</button>
    </div>
  )

  if (editorPages.length === 0) return <div className="flex flex-col items-center justify-center py-12 gap-4"><p className="text-sm text-[#6B7280] dark:text-[#A1A1AA]">{tr.noPages}</p><button onClick={resetEditor} className="text-sm font-medium text-blue-600 hover:underline">{tr.resetEditor}</button></div>

  const selectedCount = selectedIds.size
  const totalCount = editorPages.length
  const previewPage = editorPages.find(p => p.id === previewPageId)

  return (
    <div className="space-y-3" ref={containerRef} onPointerMove={onPointerMovePage} onPointerUp={onPointerUpPage}>
      <EditorToolbar features={features} selectedCount={selectedCount} totalCount={totalCount} tr={tr} processing={processing}
        onRotateLeft={() => rotateSelected(-90)} onRotateRight={() => rotateSelected(90)}
        onDuplicate={duplicateSelected} onDelete={deleteSelected}
        onExtract={features.extract ? handleExtract : null}
        onSplitAll={features.split ? handleSplitAll : null} onSplitSelected={features.split ? handleSplitSelected : null}
        onMoveLeft={() => moveSelected('left')} onMoveRight={() => moveSelected('right')}
        onMoveFirst={() => moveSelected('first')} onMoveLast={() => moveSelected('last')}
        onSelectAll={selectAll} onClearSelection={clearSelection}
        onUndo={undo} onRedo={redo} canUndo={historyIndex > 0} canRedo={historyIndex < history.length - 1}
        onReset={() => setShowResetConfirm(true)} onExport={handleExport} onMerge={features.merge ? handleMerge : null}
        onTogglePageNumbers={() => setShowPageNumbers(s => !s)} onToggleWatermark={() => setShowWatermark(s => !s)} />

      {totalCount > 10 && (
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <button onClick={() => { const f = editorPages[0]; if (f) { setPreviewPageId(f.id); setSelectedIds(new Set([f.id])); setLastSelectedId(f.id) } }} className="p-1.5 rounded-lg border border-[#E5E7EB] dark:border-[#27272A] hover:bg-[#F7F8FA] dark:hover:bg-[#18181B] transition-colors" aria-label="First page"><ChevronsLeft className="w-4 h-4 text-[#6B7280] dark:text-[#A1A1AA]" /></button>
          <button onClick={() => { const ids = editorPages.map(p => p.id); const idx = previewPageId ? ids.indexOf(previewPageId) : 0; const prev = Math.max(0, idx - 1); setPreviewPageId(ids[prev]); setSelectedIds(new Set([ids[prev]])); setLastSelectedId(ids[prev]) }} className="p-1.5 rounded-lg border border-[#E5E7EB] dark:border-[#27272A] hover:bg-[#F7F8FA] dark:hover:bg-[#18181B] transition-colors" aria-label="Previous page"><ChevronLeft className="w-4 h-4 text-[#6B7280] dark:text-[#A1A1AA]" /></button>
          <div className="flex items-center gap-1"><input type="number" min="1" max={totalCount} value={searchPage} onChange={e => setSearchPage(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleJumpToPage()} placeholder={tr.goToPage} className="w-16 px-2 py-1 text-sm rounded-lg border border-[#E5E7EB] dark:border-[#27272A] bg-white dark:bg-[#111113] text-[#111111] dark:text-[#FAFAFA] text-center" /><button onClick={handleJumpToPage} className="px-2 py-1 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors">{tr.go}</button></div>
          <button onClick={() => { const ids = editorPages.map(p => p.id); const idx = previewPageId ? ids.indexOf(previewPageId) : 0; const next = Math.min(ids.length - 1, idx + 1); setPreviewPageId(ids[next]); setSelectedIds(new Set([ids[next]])); setLastSelectedId(ids[next]) }} className="p-1.5 rounded-lg border border-[#E5E7EB] dark:border-[#27272A] hover:bg-[#F7F8FA] dark:hover:bg-[#18181B] transition-colors" aria-label="Next page"><ChevronRight className="w-4 h-4 text-[#6B7280] dark:text-[#A1A1AA]" /></button>
          <button onClick={() => { const l = editorPages[totalCount - 1]; if (l) { setPreviewPageId(l.id); setSelectedIds(new Set([l.id])); setLastSelectedId(l.id) } }} className="p-1.5 rounded-lg border border-[#E5E7EB] dark:border-[#27272A] hover:bg-[#F7F8FA] dark:hover:bg-[#18181B] transition-colors" aria-label="Last page"><ChevronsRight className="w-4 h-4 text-[#6B7280] dark:text-[#A1A1AA]" /></button>
        </div>
      )}

      {showPageNumbers && <PageNumbersPanel tr={tr} selectedIndices={selectedIndices} onApply={async (options) => { setProcessing(true); try { const blob = await buildPDFFromEditorState(editorPages); const resultBlob = await addPageNumbersAdvanced(blob, { ...options, pageIndices: options.applyToSelected ? selectedIndices : null }); setExportResult({ blob: resultBlob, deleted: 0, total: editorPages.length }); setShowPageNumbers(false) } catch (err) { setError(err.message) } setProcessing(false) }} onClose={() => setShowPageNumbers(false)} processing={processing} />}

      {showWatermark && <WatermarkPanel tr={tr} selectedIndices={selectedIndices} onApply={async (options) => { setProcessing(true); try { const blob = await buildPDFFromEditorState(editorPages); const resultBlob = await addWatermarkAdvanced(blob, { ...options, pageIndices: options.applyToSelected ? selectedIndices : null }); setExportResult({ blob: resultBlob, deleted: 0, total: editorPages.length }); setShowWatermark(false) } catch (err) { setError(err.message) } setProcessing(false) }} onClose={() => setShowWatermark(false)} processing={processing} />}

      <div className="flex flex-col lg:flex-row gap-3">
        <div className="lg:w-64 shrink-0 order-2 lg:order-1">
          <div className="sticky top-2">
            <p className="text-xs font-semibold text-[#6B7280] dark:text-[#A1A1AA] mb-2 uppercase tracking-wide">{tr.thumbnailView} ({totalCount})</p>
            <div className="grid grid-cols-3 lg:grid-cols-2 gap-2 max-h-[400px] lg:max-h-[600px] overflow-y-auto p-1 rounded-xl bg-[#F7F8FA] dark:bg-[#18181B]">
              {editorPages.map((page, idx) => <PageThumbnail key={page.id} page={page} index={idx} isSelected={selectedIds.has(page.id)} isPreview={previewPageId === page.id} isDragging={dragState.dragId === page.id} isDragOver={dragState.overId === page.id} canReorder={features.reorder} tr={tr} onClick={(e) => handlePageClick(e, page.id)} onPointerDown={(e) => onPointerDownPage(e, page.id)} onPointerEnter={(e) => onPointerEnterPage(e, page.id)} />)}
            </div>
          </div>
        </div>
        <div className="flex-1 order-1 lg:order-2 min-w-0">
          <div className="rounded-xl border border-[#E5E7EB] dark:border-[#27272A] bg-[#F7F8FA] dark:bg-[#18181B] p-4 min-h-[400px] flex flex-col">
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <div className="flex items-center gap-2 text-xs text-[#6B7280] dark:text-[#A1A1AA]">
                {previewPage ? (<><span className="font-medium">{tr.page} {editorPages.findIndex(p => p.id === previewPageId) + 1}</span><span>·</span><span>{previewPage.width} × {previewPage.height} pt</span><span>·</span><span>{previewPage.orientation === 'portrait' ? tr.portrait : tr.landscape}</span></>) : <span>{tr.noSelection}</span>}
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => setZoom(z => Math.max(0.5, z - 0.25))} className="p-1.5 rounded-lg border border-[#E5E7EB] dark:border-[#27272A] hover:bg-white dark:hover:bg-[#111113] transition-colors" aria-label={tr.zoomOut}><ZoomOut className="w-4 h-4 text-[#6B7280] dark:text-[#A1A1AA]" /></button>
                <span className="text-xs font-medium text-[#6B7280] dark:text-[#A1A1AA] px-2 min-w-[40px] text-center">{Math.round(zoom * 100)}%</span>
                <button onClick={() => setZoom(z => Math.min(2.0, z + 0.25))} className="p-1.5 rounded-lg border border-[#E5E7EB] dark:border-[#27272A] hover:bg-white dark:hover:bg-[#111113] transition-colors" aria-label={tr.zoomIn}><ZoomIn className="w-4 h-4 text-[#6B7280] dark:text-[#A1A1AA]" /></button>
                <button onClick={() => { const c = previewCanvasRef.current?.parentElement; if (c) { const w = c.clientWidth - 32; setZoom(Math.max(0.5, Math.min(2.0, w / 595))) } else setZoom(1.0) }} className="p-1.5 rounded-lg border border-[#E5E7EB] dark:border-[#27272A] hover:bg-white dark:hover:bg-[#111113] transition-colors" aria-label={tr.fitToScreen}><Maximize className="w-4 h-4 text-[#6B7280] dark:text-[#A1A1AA]" /></button>
              </div>
            </div>
            <div className="flex-1 flex items-center justify-center overflow-auto rounded-lg bg-white dark:bg-[#0a0a0b] p-4 min-h-[300px]">
              {previewPage ? <canvas ref={previewCanvasRef} className="max-w-full h-auto shadow-lg" style={{ transform: `rotate(${previewPage.rotation}deg)` }} /> : <div className="text-center py-16"><Eye className="w-10 h-10 text-gray-300 dark:text-gray-700 mx-auto mb-3" /><p className="text-sm text-[#6B7280] dark:text-[#A1A1AA]">{tr.noSelection}</p></div>}
            </div>
          </div>
        </div>
      </div>

      {mode === 'select' && onConfirm && <button onClick={() => onConfirm({ selectedPages: selectedIndices })} disabled={selectedCount === 0} className="btn-primary w-full justify-center py-3.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed">{confirmLabel || tr.confirm} ({selectedCount})</button>}
      {showDeleteConfirm !== null && <ConfirmDialog message={tr.deleteConfirm(showDeleteConfirm)} confirmLabel={tr.delete} cancelLabel={tr.cancel} onConfirm={confirmDelete} onCancel={() => setShowDeleteConfirm(null)} danger />}
      {showResetConfirm && <ConfirmDialog message={tr.resetConfirm} confirmLabel={tr.resetEditor} cancelLabel={tr.cancel} onConfirm={resetEditor} onCancel={() => setShowResetConfirm(false)} danger />}
      {processing && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"><div className="bg-white dark:bg-[#111113] rounded-2xl p-6 flex flex-col items-center gap-3 shadow-xl"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /><p className="text-sm text-[#6B7280] dark:text-[#A1A1AA]">Processing...</p></div></div>}
      {error && editorPages.length > 0 && <div className="fixed bottom-4 start-4 z-50 max-w-sm"><div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-xl p-4 flex items-start gap-3 shadow-lg"><AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" /><p className="text-sm text-red-600 dark:text-red-400 flex-1">{error}</p><button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 shrink-0"><X className="w-4 h-4" /></button></div></div>}
    </div>
  )
}

function PdfUploadZone({ onFiles, lang, tr, multiple, fileInputRef }) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [localError, setLocalError] = useState(null)
  const internalRef = useRef(null)
  const ref = fileInputRef || internalRef
  const handleFiles = (fileList) => {
    setLocalError(null)
    const files = Array.from(fileList).filter(f => {
      if (f.type !== 'application/pdf' && !f.name.toLowerCase().endsWith('.pdf')) { setLocalError(tr.errorCorrupted); return false }
      if (f.size > 100 * 1024 * 1024) { setLocalError(tr.errorLarge); return false }
      return true
    })
    if (files.length > 0) onFiles(files)
  }
  return (
    <div className="space-y-3">
      {localError && <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900"><AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" /><p className="text-sm text-red-600 dark:text-red-400">{localError}</p></div>}
      <div onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }} onDragLeave={() => setIsDragOver(false)} onDrop={(e) => { e.preventDefault(); setIsDragOver(false); handleFiles(e.dataTransfer.files) }} onClick={() => ref.current?.click()} className={`cursor-pointer rounded-2xl border-2 border-dashed p-8 md:p-12 text-center transition-all ${isDragOver ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20' : 'border-[#E5E7EB] dark:border-[#27272A] hover:border-blue-400 hover:bg-[#F7F8FA] dark:hover:bg-[#18181B]'}`}>
        <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center mx-auto mb-4"><UploadCloud className="w-7 h-7 text-blue-500" /></div>
        <p className="text-sm font-medium text-[#111111] dark:text-[#FAFAFA] mb-1">{tr.dragDrop}</p>
        <p className="text-xs text-[#6B7280] dark:text-[#A1A1AA]">PDF {multiple ? '· Multiple files' : '· Max 100 MB'}</p>
        <input ref={ref} type="file" accept="application/pdf" multiple={multiple} onChange={(e) => handleFiles(e.target.files)} className="hidden" />
      </div>
    </div>
  )
}

function PageThumbnail({ page, index, isSelected, isPreview, isDragging, isDragOver, tr, onClick, onPointerDown, onPointerEnter }) {
  return (
    <div id={`thumb-${page.id}`} className={`relative rounded-lg border-2 overflow-hidden transition-all cursor-pointer ${isSelected ? 'border-blue-500 ring-1 ring-blue-200 dark:ring-blue-900' : isDragOver ? 'border-blue-400 border-dashed' : 'border-[#E5E7EB] dark:border-[#27272A] hover:border-blue-300'} ${isDragging ? 'opacity-40' : ''} ${isPreview && !isSelected ? 'ring-1 ring-blue-300 dark:ring-blue-700' : ''}`} onClick={onClick} onPointerDown={onPointerDown} onPointerEnter={onPointerEnter}>
      <div className="aspect-[3/4] bg-[#F7F8FA] dark:bg-[#0a0a0b] flex items-center justify-center overflow-hidden"><img src={page.thumbUrl} alt={`Page ${index + 1}`} className="max-w-full max-h-full object-contain" style={{ transform: `rotate(${page.rotation}deg)` }} draggable={false} /></div>
      <div className="absolute top-1 start-1 px-1.5 py-0.5 rounded-md bg-black/70 text-white text-[10px] font-medium backdrop-blur-sm">{index + 1}</div>
      {isSelected && <div className="absolute top-1 end-1 w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center"><Check className="w-3 h-3 text-white" strokeWidth={3} /></div>}
    </div>
  )
}

function EditorToolbar(props) {
  const { features, selectedCount, totalCount, tr, processing } = props
  const hasSelection = selectedCount > 0
  const btnClass = "p-2 rounded-lg border border-[#E5E7EB] dark:border-[#27272A] hover:bg-[#F7F8FA] dark:hover:bg-[#18181B] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2 flex-wrap text-xs text-[#6B7280] dark:text-[#A1A1AA]">
        <span>{selectedCount > 0 ? `${selectedCount} ${tr.of} ${totalCount} ${tr.selected}` : `${totalCount} ${tr.pages}`}</span>
        <div className="flex items-center gap-1"><button onClick={props.onSelectAll} className="text-xs font-medium hover:text-blue-600 dark:hover:text-blue-400 px-2 py-1 rounded transition-colors">{tr.selectAll}</button>{hasSelection && <button onClick={props.onClearSelection} className="text-xs font-medium hover:text-blue-600 dark:hover:text-blue-400 px-2 py-1 rounded transition-colors">{tr.clearSelection}</button>}</div>
      </div>
      <div className="flex items-center gap-1.5 flex-wrap">
        <button onClick={props.onUndo} disabled={!props.canUndo} className={btnClass} aria-label={tr.undo} title={tr.undo}><Undo2 className="w-4 h-4 text-[#6B7280] dark:text-[#A1A1AA]" /></button>
        <button onClick={props.onRedo} disabled={!props.canRedo} className={btnClass} aria-label={tr.redo} title={tr.redo}><Redo2 className="w-4 h-4 text-[#6B7280] dark:text-[#A1A1AA]" /></button>
        <span className="w-px h-6 bg-[#E5E7EB] dark:bg-[#27272A] mx-0.5" />
        {features.rotate && <><button onClick={props.onRotateLeft} disabled={!hasSelection} className={btnClass} aria-label={tr.rotateLeft} title={tr.rotateLeft}><RotateCcw className="w-4 h-4 text-[#6B7280] dark:text-[#A1A1AA]" /></button><button onClick={props.onRotateRight} disabled={!hasSelection} className={btnClass} aria-label={tr.rotateRight} title={tr.rotateRight}><RotateCw className="w-4 h-4 text-[#6B7280] dark:text-[#A1A1AA]" /></button></>}
        {features.duplicate && <button onClick={props.onDuplicate} disabled={!hasSelection} className={btnClass} aria-label={tr.duplicate} title={tr.duplicate}><Copy className="w-4 h-4 text-[#6B7280] dark:text-[#A1A1AA]" /></button>}
        {features.delete && <button onClick={props.onDelete} disabled={!hasSelection || totalCount <= 1} className={btnClass} aria-label={tr.delete} title={tr.delete}><Trash2 className="w-4 h-4 text-red-500" /></button>}
        <span className="w-px h-6 bg-[#E5E7EB] dark:bg-[#27272A] mx-0.5" />
        {features.reorder && <><button onClick={props.onMoveFirst} disabled={!hasSelection} className={btnClass} aria-label={tr.moveFirst} title={tr.moveFirst}><ChevronFirst className="w-4 h-4 text-[#6B7280] dark:text-[#A1A1AA]" /></button><button onClick={props.onMoveLeft} disabled={!hasSelection} className={btnClass} aria-label={tr.moveLeft} title={tr.moveLeft}><MoveLeft className="w-4 h-4 text-[#6B7280] dark:text-[#A1A1AA]" /></button><button onClick={props.onMoveRight} disabled={!hasSelection} className={btnClass} aria-label={tr.moveRight} title={tr.moveRight}><MoveRight className="w-4 h-4 text-[#6B7280] dark:text-[#A1A1AA]" /></button><button onClick={props.onMoveLast} disabled={!hasSelection} className={btnClass} aria-label={tr.moveLast} title={tr.moveLast}><ChevronLast className="w-4 h-4 text-[#6B7280] dark:text-[#A1A1AA]" /></button></>}
        <span className="w-px h-6 bg-[#E5E7EB] dark:bg-[#27272A] mx-0.5" />
        {props.onExtract && <button onClick={props.onExtract} disabled={!hasSelection || processing} className={btnClass} aria-label={tr.extract} title={tr.extract}><Download className="w-4 h-4 text-blue-500" /></button>}
        {props.onSplitAll && <><button onClick={props.onSplitAll} disabled={processing} className={btnClass} aria-label={tr.splitAll} title={tr.splitAll}><Columns className="w-4 h-4 text-[#6B7280] dark:text-[#A1A1AA]" /></button>{hasSelection && props.onSplitSelected && <button onClick={props.onSplitSelected} disabled={processing} className={btnClass} aria-label={tr.splitSelected} title={tr.splitSelected}><Layers className="w-4 h-4 text-[#6B7280] dark:text-[#A1A1AA]" /></button>}</>}
        <span className="w-px h-6 bg-[#E5E7EB] dark:bg-[#27272A] mx-0.5" />
        {features.numbering && <button onClick={props.onTogglePageNumbers} disabled={processing} className={btnClass} aria-label={tr.pageNumbers} title={tr.pageNumbers}><Hash className="w-4 h-4 text-[#6B7280] dark:text-[#A1A1AA]" /></button>}
        {features.watermark && <button onClick={props.onToggleWatermark} disabled={processing} className={btnClass} aria-label={tr.watermark} title={tr.watermark}><Droplet className="w-4 h-4 text-[#6B7280] dark:text-[#A1A1AA]" /></button>}
        <span className="w-px h-6 bg-[#E5E7EB] dark:bg-[#27272A] mx-0.5" />
        <button onClick={props.onReset} className={btnClass} aria-label={tr.resetEditor} title={tr.resetEditor}><RefreshCw className="w-4 h-4 text-[#6B7280] dark:text-[#A1A1AA]" /></button>
        <button onClick={props.onMerge || props.onExport} disabled={processing} className="ml-auto btn-primary rounded-lg px-4 py-2 text-sm flex items-center gap-2"><Download className="w-4 h-4" />{props.onMerge ? tr.merge : tr.exportPdf}</button>
      </div>
    </div>
  )
}

function ConfirmDialog({ message, confirmLabel, cancelLabel, onConfirm, onCancel, danger }) {
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"><div className="bg-white dark:bg-[#111113] rounded-2xl p-6 max-w-sm w-full shadow-xl animate-fade-in"><p className="text-sm font-medium text-[#111111] dark:text-[#FAFAFA] mb-4">{message}</p><div className="flex justify-end gap-2"><button onClick={onCancel} className="px-4 py-2 rounded-lg text-sm font-medium border border-[#E5E7EB] dark:border-[#27272A] text-[#6B7280] dark:text-[#A1A1AA] hover:bg-[#F7F8FA] dark:hover:bg-[#18181B] transition-colors">{cancelLabel}</button><button onClick={onConfirm} className={`px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors ${danger ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-600 hover:bg-blue-700'}`}>{confirmLabel}</button></div></div></div>
}

function PageNumbersPanel({ tr, selectedIndices, onApply, onClose, processing }) {
  const [position, setPosition] = useState('bottom-center')
  const [format, setFormat] = useState('1')
  const [fontSize, setFontSize] = useState(12)
  const [margin, setMargin] = useState(30)
  const [startNum, setStartNum] = useState(1)
  const [applyToSelected, setApplyToSelected] = useState(false)
  const positions = [{ key: 'top-left', label: `${tr.top} ${tr.left}` }, { key: 'top-center', label: `${tr.top} ${tr.center}` }, { key: 'top-right', label: `${tr.top} ${tr.right}` }, { key: 'bottom-left', label: `${tr.bottom} ${tr.left}` }, { key: 'bottom-center', label: `${tr.bottom} ${tr.center}` }, { key: 'bottom-right', label: `${tr.bottom} ${tr.right}` }]
  const formats = ['1', 'Page 1', '1 / 10', 'Page 1 of 10']
  return (
    <div className="rounded-xl border border-[#E5E7EB] dark:border-[#27272A] bg-white dark:bg-[#111113] p-4 space-y-4">
      <div className="flex items-center justify-between"><h3 className="text-sm font-semibold text-[#111111] dark:text-[#FAFAFA] flex items-center gap-2"><Hash className="w-4 h-4 text-blue-500" /> {tr.pageNumbers}</h3><button onClick={onClose} className="p-1 rounded hover:bg-[#F7F8FA] dark:hover:bg-[#18181B]"><X className="w-4 h-4 text-[#6B7280] dark:text-[#A1A1AA]" /></button></div>
      <div><label className="block text-xs font-medium text-[#6B7280] dark:text-[#A1A1AA] mb-1.5">{tr.position}</label><div className="grid grid-cols-3 gap-1.5">{positions.map(p => <button key={p.key} onClick={() => setPosition(p.key)} className={`py-2 px-1 rounded-lg text-xs font-medium border transition-colors ${position === p.key ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400' : 'border-[#E5E7EB] dark:border-[#27272A] text-[#6B7280] dark:text-[#A1A1AA]'}`}>{p.label}</button>)}</div></div>
      <div><label className="block text-xs font-medium text-[#6B7280] dark:text-[#A1A1AA] mb-1.5">{tr.format}</label><div className="grid grid-cols-2 gap-1.5">{formats.map(f => <button key={f} onClick={() => setFormat(f)} className={`py-2 rounded-lg text-xs font-medium border transition-colors ${format === f ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400' : 'border-[#E5E7EB] dark:border-[#27272A] text-[#6B7280] dark:text-[#A1A1AA]'}`}>{f}</button>)}</div></div>
      <div className="grid grid-cols-3 gap-3"><div><label className="block text-xs font-medium text-[#6B7280] dark:text-[#A1A1AA] mb-1">{tr.fontSize}: {fontSize}</label><input type="range" min="8" max="24" value={fontSize} onChange={e => setFontSize(parseInt(e.target.value))} className="w-full accent-blue-600" /></div><div><label className="block text-xs font-medium text-[#6B7280] dark:text-[#A1A1AA] mb-1">{tr.margin}: {margin}</label><input type="range" min="10" max="60" value={margin} onChange={e => setMargin(parseInt(e.target.value))} className="w-full accent-blue-600" /></div><div><label className="block text-xs font-medium text-[#6B7280] dark:text-[#A1A1AA] mb-1">{tr.startNum}: {startNum}</label><input type="number" min="0" value={startNum} onChange={e => setStartNum(parseInt(e.target.value) || 0)} className="w-full input-field text-sm" /></div></div>
      <div><label className="block text-xs font-medium text-[#6B7280] dark:text-[#A1A1AA] mb-1.5">{tr.applyTo}</label><div className="flex gap-2"><button onClick={() => setApplyToSelected(false)} className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-colors ${!applyToSelected ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400' : 'border-[#E5E7EB] dark:border-[#27272A] text-[#6B7280] dark:text-[#A1A1AA]'}`}>{tr.allPages}</button><button onClick={() => setApplyToSelected(true)} disabled={selectedIndices.length === 0} className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-colors disabled:opacity-40 ${applyToSelected ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400' : 'border-[#E5E7EB] dark:border-[#27272A] text-[#6B7280] dark:text-[#A1A1AA]'}`}>{tr.selectedPages} ({selectedIndices.length})</button></div></div>
      <button onClick={() => onApply({ position, format, fontSize, margin, startNum, applyToSelected })} disabled={processing} className="btn-primary w-full justify-center py-3 text-sm disabled:opacity-50">{tr.addPageNumbers}</button>
    </div>
  )
}

function WatermarkPanel({ tr, selectedIndices, onApply, onClose, processing }) {
  const [text, setText] = useState('CONFIDENTIAL')
  const [fontSize, setFontSize] = useState(50)
  const [opacity, setOpacity] = useState(30)
  const [rotation, setRotation] = useState(-45)
  const [color, setColor] = useState('#888888')
  const [position, setPosition] = useState('center')
  const [applyToSelected, setApplyToSelected] = useState(false)
  const positions = [{ key: 'center', label: tr.center }, { key: 'top-left', label: `${tr.top} ${tr.left}` }, { key: 'top-right', label: `${tr.top} ${tr.right}` }, { key: 'bottom-left', label: `${tr.bottom} ${tr.left}` }, { key: 'bottom-right', label: `${tr.bottom} ${tr.right}` }]
  return (
    <div className="rounded-xl border border-[#E5E7EB] dark:border-[#27272A] bg-white dark:bg-[#111113] p-4 space-y-4">
      <div className="flex items-center justify-between"><h3 className="text-sm font-semibold text-[#111111] dark:text-[#FAFAFA] flex items-center gap-2"><Droplet className="w-4 h-4 text-blue-500" /> {tr.watermark}</h3><button onClick={onClose} className="p-1 rounded hover:bg-[#F7F8FA] dark:hover:bg-[#18181B]"><X className="w-4 h-4 text-[#6B7280] dark:text-[#A1A1AA]" /></button></div>
      <div><label className="block text-xs font-medium text-[#6B7280] dark:text-[#A1A1AA] mb-1.5">{tr.watermarkText}</label><input type="text" value={text} onChange={e => setText(e.target.value)} className="input-field" /></div>
      <div className="grid grid-cols-2 gap-3"><div><label className="block text-xs font-medium text-[#6B7280] dark:text-[#A1A1AA] mb-1">{tr.fontSize}: {fontSize}</label><input type="range" min="20" max="100" value={fontSize} onChange={e => setFontSize(parseInt(e.target.value))} className="w-full accent-blue-600" /></div><div><label className="block text-xs font-medium text-[#6B7280] dark:text-[#A1A1AA] mb-1">{tr.opacity}: {opacity}%</label><input type="range" min="10" max="80" value={opacity} onChange={e => setOpacity(parseInt(e.target.value))} className="w-full accent-blue-600" /></div><div><label className="block text-xs font-medium text-[#6B7280] dark:text-[#A1A1AA] mb-1">{tr.rotation}: {rotation}°</label><input type="range" min="-90" max="90" value={rotation} onChange={e => setRotation(parseInt(e.target.value))} className="w-full accent-blue-600" /></div><div><label className="block text-xs font-medium text-[#6B7280] dark:text-[#A1A1AA] mb-1">{tr.color}</label><input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-full h-8 rounded border border-[#E5E7EB] dark:border-[#27272A]" /></div></div>
      <div><label className="block text-xs font-medium text-[#6B7280] dark:text-[#A1A1AA] mb-1.5">{tr.position}</label><div className="flex gap-1.5 flex-wrap">{positions.map(p => <button key={p.key} onClick={() => setPosition(p.key)} className={`py-1.5 px-3 rounded-lg text-xs font-medium border transition-colors ${position === p.key ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400' : 'border-[#E5E7EB] dark:border-[#27272A] text-[#6B7280] dark:text-[#A1A1AA]'}`}>{p.label}</button>)}</div></div>
      <div><label className="block text-xs font-medium text-[#6B7280] dark:text-[#A1A1AA] mb-1.5">{tr.applyTo}</label><div className="flex gap-2"><button onClick={() => setApplyToSelected(false)} className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-colors ${!applyToSelected ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400' : 'border-[#E5E7EB] dark:border-[#27272A] text-[#6B7280] dark:text-[#A1A1AA]'}`}>{tr.allPages}</button><button onClick={() => setApplyToSelected(true)} disabled={selectedIndices.length === 0} className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-colors disabled:opacity-40 ${applyToSelected ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400' : 'border-[#E5E7EB] dark:border-[#27272A] text-[#6B7280] dark:text-[#A1A1AA]'}`}>{tr.selectedPages} ({selectedIndices.length})</button></div></div>
      <button onClick={() => onApply({ text, fontSize, opacity: opacity / 100, rotation, color, position, applyToSelected })} disabled={processing} className="btn-primary w-full justify-center py-3 text-sm disabled:opacity-50">{tr.addWatermark}</button>
    </div>
  )
}
