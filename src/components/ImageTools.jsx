/**
 * ImageTools.jsx — New visual image tool components.
 * FilterEditor, RotateFlipEditor, WatermarkEditor, BorderEditor,
 * Base64Tool, MetadataViewer, ImageConverterTool, ImageMetadataViewer.
 *
 * All use the existing premium design system colors.
 * All use pointer events for unified mouse + touch support.
 */

import { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react'
import {
  ZoomIn, ZoomOut, Lock, Unlock, RotateCcw, RotateCw, Download, Check, X,
  Image as ImageIcon, RefreshCw, AlertCircle, Copy, FlipHorizontal, FlipVertical,
  Sun, Contrast, Palette, Aperture, Loader2, FileText,
} from 'lucide-react'
import {
  downloadBlob, getOutputFilename, formatFileSize,
} from '../lib/processors/image.js'
import { EditorHistoryToolbar, useEditorHistory } from './EditorHistory'
import { Undo2, Redo2 } from 'lucide-react' 

/* ═══ Shared helpers ═══ */
function useImageLoader(file) {
  const [state, setState] = useState({ img: null, url: null, width: 0, height: 0, loading: true })
  useLayoutEffect(() => {
    if (!file) { setState({ img: null, url: null, width: 0, height: 0, loading: false }); return }
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => setState({ img, url, width: img.naturalWidth, height: img.naturalHeight, loading: false })
    img.onerror = () => setState({ img: null, url: null, width: 0, height: 0, loading: false })
    img.src = url
    return () => URL.revokeObjectURL(url)
  }, [file])
  return state
}

const clamp = (v, min, max) => Math.max(min, Math.min(max, v))

/* ═══ FilterEditor (brightness, contrast, saturation, blur, grayscale) ═══ */
export function FilterEditor({ file, lang, filters: defaultFilters, singleMode }) {
  const { img, url, width, height, loading } = useImageLoader(file)
  const canvasRef = useRef(null)
  const [filters, setFilters] = useState(defaultFilters || { brightness: 0, contrast: 0, saturation: 0, blur: 0, grayscale: 0 })
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const history = useEditorHistory(20)

  const labels = {
    en: { brightness: 'Brightness', contrast: 'Contrast', saturation: 'Saturation', blur: 'Blur', grayscale: 'Grayscale', reset: 'Reset', apply: 'Apply & Download', preview: 'Preview', processing: 'Processing...' },
    fr: { brightness: 'Luminosité', contrast: 'Contraste', saturation: 'Saturation', blur: 'Flou', grayscale: 'Niveaux de gris', reset: 'Réinitialiser', apply: 'Appliquer & Télécharger', preview: 'Aperçu', processing: 'Traitement...' },
    ar: { brightness: 'السطوع', contrast: 'التباين', saturation: 'التشبع', blur: 'التشويش', grayscale: 'تدرج الرمادي', reset: 'إعادة تعيين', apply: 'تطبيق وتحميل', preview: 'معاينة', processing: 'جارٍ المعالجة...' },
  }[lang]

  const buildFilterString = useCallback((f) => {
    const parts = []
    if (f.brightness !== 0) parts.push(`brightness(${1 + f.brightness / 100})`)
    if (f.contrast !== 0) parts.push(`contrast(${1 + f.contrast / 100})`)
    if (f.saturation !== 0) parts.push(`saturate(${1 + f.saturation / 100})`)
    if (f.blur > 0) parts.push(`blur(${f.blur}px)`)
    if (f.grayscale > 0) parts.push(`grayscale(${f.grayscale / 100})`)
    return parts.join(' ') || 'none'
  }, [])

  useEffect(() => {
    if (!img || !canvasRef.current) return
    const canvas = canvasRef.current
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    ctx.filter = buildFilterString(filters)
    if (file.type === 'image/jpeg' || file.type === 'image/jpg') {
      ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, width, height)
    }
    ctx.drawImage(img, 0, 0)
  }, [img, filters, width, height, buildFilterString, file])

  const handleReset = () => {
    setFilters(defaultFilters || { brightness: 0, contrast: 0, saturation: 0, blur: 0, grayscale: 0 })
    history.reset()
  }

  const handleSliderRelease = () => {
    history.pushState({ ...filters })
  }

  const handleApply = async () => {
    setProcessing(true); setError(null)
    try {
      const canvas = canvasRef.current
      const format = file.type || 'image/png'
      const blob = await new Promise((resolve, reject) => {
        canvas.toBlob(b => b ? resolve(b) : reject(new Error('Export failed')), format, 0.92)
      })
      const ext = format === 'image/jpeg' ? 'jpg' : format === 'image/webp' ? 'webp' : 'png'
      setResult({ blob, filename: `filtered-image.${ext}` })
    } catch (e) { setError(e.message) }
    finally { setProcessing(false) }
  }

  const sliderConfig = singleMode
    ? [{ key: singleMode, label: labels[singleMode], min: singleMode === 'blur' ? 0 : -100, max: singleMode === 'blur' ? 20 : 100, step: 1 }]
    : [
      { key: 'brightness', label: labels.brightness, min: -100, max: 100, step: 1 },
      { key: 'contrast', label: labels.contrast, min: -100, max: 100, step: 1 },
      { key: 'saturation', label: labels.saturation, min: -100, max: 100, step: 1 },
      { key: 'blur', label: labels.blur, min: 0, max: 20, step: 0.5 },
    ]

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>

  if (result) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 p-3 rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 text-green-700 dark:text-green-400 text-sm font-medium">
          <Check className="w-4 h-4 shrink-0" /> {lang === 'ar' ? 'اكتملت المعالجة!' : lang === 'fr' ? 'Terminé !' : 'Complete!'}
        </div>
        <button onClick={() => downloadBlob(result.blob, result.filename)} className="btn-primary w-full justify-center py-3.5 text-sm">
          <Download className="w-4 h-4" /> {lang === 'ar' ? 'تحميل' : lang === 'fr' ? 'Télécharger' : 'Download'} {result.filename}
        </button>
        <button onClick={() => setResult(null)} className="text-sm text-[#6B7280] dark:text-[#A1A1AA] hover:text-blue-600 font-medium w-full text-center">
          {lang === 'ar' ? 'ابدأ من جديد' : lang === 'fr' ? 'Recommencer' : 'Start over'}
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <EditorHistoryToolbar canUndo={history.canUndo} canRedo={history.canRedo} onUndo={history.undo} onRedo={history.redo} lang={lang} />
      </div>
      {/* Preview */}
      <div className="rounded-xl border border-[#E5E7EB] dark:border-[#27272A] overflow-hidden bg-[#F7F8FA] dark:bg-[#18181B] p-4 flex justify-center">
        <canvas ref={canvasRef} className="max-w-full max-h-[400px] rounded-lg" />
      </div>

      {/* Sliders */}
      <div className="space-y-3">
        {sliderConfig.map(s => (
          <div key={s.key}>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-[#111111] dark:text-[#FAFAFA]">{s.label}</label>
              <span className="text-xs text-[#6B7280] dark:text-[#A1A1AA] tabular-nums">{filters[s.key]}</span>
            </div>
            <input type="range" min={s.min} max={s.max} step={s.step} value={filters[s.key]}
              onChange={e => setFilters(prev => ({ ...prev, [s.key]: parseFloat(e.target.value) }))}
              onPointerUp={handleSliderRelease}
              className="w-full accent-blue-600 cursor-pointer" />
          </div>
        ))}
      </div>

      {/* Buttons */}
      <div className="flex gap-3">
        <button onClick={handleReset} className="flex-1 py-3 text-sm font-medium rounded-xl border border-[#E5E7EB] dark:border-[#27272A] text-[#6B7280] dark:text-[#A1A1AA] hover:bg-gray-50 dark:hover:bg-[#18181B] transition-colors">
          {labels.reset}
        </button>
        <button onClick={handleApply} disabled={processing} className="btn-primary flex-1 justify-center py-3 text-sm disabled:opacity-50">
          {processing ? <><Loader2 className="w-4 h-4 animate-spin" /> {labels.processing}</> : labels.apply}
        </button>
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  )
}

/* ═══ GrayscaleEditor (one-click) ═══ */
export function GrayscaleEditor({ file, lang }) {
  return <FilterEditor file={file} lang={lang} filters={{ brightness: 0, contrast: 0, saturation: 0, blur: 0, grayscale: 100 }} singleMode="grayscale" />
}

/* ═══ RotateFlipEditor ═══ */
export function RotateFlipEditor({ file, lang, onProcess }) {
  const { img, url, width, height, loading } = useImageLoader(file)
  const canvasRef = useRef(null)
  const [rotation, setRotation] = useState(0)
  const [flipH, setFlipH] = useState(false)
  const [flipV, setFlipV] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState(null)
  const history = useEditorHistory(20)

  const labels = {
    en: { rotateLeft: 'Rotate Left', rotateRight: 'Rotate Right', flipH: 'Flip Horizontal', flipV: 'Flip Vertical', apply: 'Apply & Download', reset: 'Reset', processing: 'Processing...' },
    fr: { rotateLeft: 'Pivoter à gauche', rotateRight: 'Pivoter à droite', flipH: 'Retourner H', flipV: 'Retourner V', apply: 'Appliquer & Télécharger', reset: 'Réinitialiser', processing: 'Traitement...' },
    ar: { rotateLeft: 'تدوير لليسار', rotateRight: 'تدوير لليمين', flipH: 'قلب أفقي', flipV: 'قلب عمودي', apply: 'تطبيق وتحميل', reset: 'إعادة تعيين', processing: 'جارٍ المعالجة...' },
  }[lang]

  useEffect(() => {
    if (!img || !canvasRef.current) return
    const canvas = canvasRef.current
    const isFlipped = rotation % 180 !== 0
    canvas.width = isFlipped ? height : width
    canvas.height = isFlipped ? width : height
    const ctx = canvas.getContext('2d')
    ctx.save()
    ctx.translate(canvas.width / 2, canvas.height / 2)
    ctx.rotate(rotation * Math.PI / 180)
    ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1)
    if (file.type === 'image/jpeg' || file.type === 'image/jpg') {
      ctx.fillStyle = '#FFFFFF'; ctx.fillRect(-width / 2, -height / 2, width, height)
    }
    ctx.drawImage(img, -width / 2, -height / 2)
    ctx.restore()
  }, [img, rotation, flipH, flipV, width, height, file])

  const handleReset = () => { setRotation(0); setFlipH(false); setFlipV(false); history.reset() }

  const handleApply = async () => {
    setProcessing(true)
    try {
      const canvas = canvasRef.current
      const format = file.type || 'image/png'
      const blob = await new Promise((resolve, reject) => {
        canvas.toBlob(b => b ? resolve(b) : reject(new Error('Export failed')), format, 0.92)
      })
      const ext = format === 'image/jpeg' ? 'jpg' : format === 'image/webp' ? 'webp' : 'png'
      setResult({ blob, filename: `edited-image.${ext}` })
    } catch (e) { console.error(e) }
    finally { setProcessing(false) }
  }

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>

  if (result) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 p-3 rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 text-green-700 dark:text-green-400 text-sm font-medium">
          <Check className="w-4 h-4 shrink-0" /> {lang === 'ar' ? 'اكتمل!' : lang === 'fr' ? 'Terminé !' : 'Complete!'}
        </div>
        <button onClick={() => downloadBlob(result.blob, result.filename)} className="btn-primary w-full justify-center py-3.5 text-sm">
          <Download className="w-4 h-4" /> {lang === 'ar' ? 'تحميل' : lang === 'fr' ? 'Télécharger' : 'Download'} {result.filename}
        </button>
        <button onClick={() => setResult(null)} className="text-sm text-[#6B7280] dark:text-[#A1A1AA] hover:text-blue-600 font-medium w-full text-center">
          {lang === 'ar' ? 'ابدأ من جديد' : lang === 'fr' ? 'Recommencer' : 'Start over'}
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <EditorHistoryToolbar canUndo={history.canUndo} canRedo={history.canRedo} onUndo={history.undo} onRedo={history.redo} lang={lang} />
      </div>
      <div className="rounded-xl border border-[#E5E7EB] dark:border-[#27272A] overflow-hidden bg-[#F7F8FA] dark:bg-[#18181B] p-4 flex justify-center">
        <canvas ref={canvasRef} className="max-w-full max-h-[400px] rounded-lg" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button onClick={() => { setRotation(r => r - 90); history.pushState({ rotation: rotation - 90, flipH, flipV }) }} className="flex flex-col items-center gap-2 py-4 rounded-xl border border-[#E5E7EB] dark:border-[#27272A] hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-colors">
          <RotateCcw className="w-5 h-5 text-[#6B7280] dark:text-[#A1A1AA]" />
          <span className="text-xs font-medium text-[#111111] dark:text-[#FAFAFA]">{labels.rotateLeft}</span>
        </button>
        <button onClick={() => { setRotation(r => r + 90); history.pushState({ rotation: rotation + 90, flipH, flipV }) }} className="flex flex-col items-center gap-2 py-4 rounded-xl border border-[#E5E7EB] dark:border-[#27272A] hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-colors">
          <RotateCw className="w-5 h-5 text-[#6B7280] dark:text-[#A1A1AA]" />
          <span className="text-xs font-medium text-[#111111] dark:text-[#FAFAFA]">{labels.rotateRight}</span>
        </button>
        <button onClick={() => { setFlipH(v => !v); history.pushState({ rotation, flipH: !flipH, flipV }) }} className={`flex flex-col items-center gap-2 py-4 rounded-xl border transition-colors ${flipH ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20' : 'border-[#E5E7EB] dark:border-[#27272A] hover:border-blue-400'}`}>
          <FlipHorizontal className="w-5 h-5 text-[#6B7280] dark:text-[#A1A1AA]" />
          <span className="text-xs font-medium text-[#111111] dark:text-[#FAFAFA]">{labels.flipH}</span>
        </button>
        <button onClick={() => { setFlipV(v => !v); history.pushState({ rotation, flipH, flipV: !flipV }) }} className={`flex flex-col items-center gap-2 py-4 rounded-xl border transition-colors ${flipV ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20' : 'border-[#E5E7EB] dark:border-[#27272A] hover:border-blue-400'}`}>
          <FlipVertical className="w-5 h-5 text-[#6B7280] dark:text-[#A1A1AA]" />
          <span className="text-xs font-medium text-[#111111] dark:text-[#FAFAFA]">{labels.flipV}</span>
        </button>
      </div>

      <div className="flex gap-3">
        <button onClick={handleReset} className="flex-1 py-3 text-sm font-medium rounded-xl border border-[#E5E7EB] dark:border-[#27272A] text-[#6B7280] dark:text-[#A1A1AA] hover:bg-gray-50 dark:hover:bg-[#18181B] transition-colors">{labels.reset}</button>
        <button onClick={handleApply} disabled={processing} className="btn-primary flex-1 justify-center py-3 text-sm disabled:opacity-50">
          {processing ? <><Loader2 className="w-4 h-4 animate-spin" /> {labels.processing}</> : labels.apply}
        </button>
      </div>
    </div>
  )
}

/* ═══ WatermarkEditor (Improved — drag, resize, rotate) ═══ */
export function WatermarkEditor({ file, lang }) {
  const { img, url, width, height, loading } = useImageLoader(file)
  const canvasRef = useRef(null)
  const overlayRef = useRef(null)
  const [text, setText] = useState('Watermark')
  const [fontSize, setFontSize] = useState(48)
  const [opacity, setOpacity] = useState(50)
  const [color, setColor] = useState('#ffffff')
  const [rotation, setRotation] = useState(0)
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState(null)
  const [dragState, setDragState] = useState({ dragging: false, mode: null, startX: 0, startY: 0 })
  // Watermark position in image coordinates (center x, center y, scale, rotation)
  const [wmPos, setWmPos] = useState({ x: 0, y: 0, w: 0, h: 0 })
  const [displaySize, setDisplaySize] = useState({ w: 0, h: 0 })
  const history = useEditorHistory(20)

  const labels = {
    en: { text: 'Watermark Text', fontSize: 'Font Size', opacity: 'Opacity', color: 'Color', rotation: 'Rotation', apply: 'Apply & Download', reset: 'Reset', resetPos: 'Reset Position', processing: 'Processing...', drag: 'Drag the watermark to reposition' },
    fr: { text: 'Texte du filigrane', fontSize: 'Taille', opacity: 'Opacité', color: 'Couleur', rotation: 'Rotation', apply: 'Appliquer & Télécharger', reset: 'Réinitialiser', resetPos: 'Réinitialiser la position', processing: 'Traitement...', drag: 'Glissez le filigrane pour le repositionner' },
    ar: { text: 'نص العلامة المائية', fontSize: 'حجم الخط', opacity: 'الشفافية', color: 'اللون', rotation: 'الدوران', apply: 'تطبيق وتحميل', reset: 'إعادة تعيين', resetPos: 'إعادة تعيين الموضع', processing: 'جارٍ المعالجة...', drag: 'اسحب العلامة المائية لإعادة التموضع' },
  }[lang]

  // Compute display size
  useEffect(() => {
    if (!width || !height) return
    const maxW = 500, maxH = 400
    const ratio = Math.min(maxW / width, maxH / height, 1)
    setDisplaySize({ w: Math.round(width * ratio), h: Math.round(height * ratio) })
  }, [width, height])

  // Initialize watermark position to center
  useEffect(() => {
    if (width && height) {
      setWmPos({ x: width / 2, y: height / 2, w: width, h: height })
    }
  }, [width, height])

  // Scale factors
  const scaleX = width / displaySize.w || 1
  const scaleY = height / displaySize.h || 1

  // Draw preview on canvas
  const drawPreview = useCallback(() => {
    const canvas = canvasRef.current
    const overlay = overlayRef.current
    if (!canvas || !overlay || !img) return
    
    canvas.width = displaySize.w
    canvas.height = displaySize.h
    overlay.width = displaySize.w
    overlay.height = displaySize.h
    
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, displaySize.w, displaySize.h)
    ctx.drawImage(img, 0, 0, displaySize.w, displaySize.h)
    
    // Draw watermark on overlay
    const octx = overlay.getContext('2d')
    octx.clearRect(0, 0, displaySize.w, displaySize.h)
    if (text) {
      const dispX = wmPos.x / scaleX
      const dispY = wmPos.y / scaleY
      const dispFontSize = fontSize * (displaySize.w / width)
      
      octx.save()
      octx.globalAlpha = opacity / 100
      octx.font = `bold ${dispFontSize}px Arial, sans-serif`
      octx.fillStyle = color
      octx.textAlign = 'center'
      octx.textBaseline = 'middle'
      octx.translate(dispX, dispY)
      octx.rotate(rotation * Math.PI / 180)
      octx.fillText(text, 0, 0)
      
      // Draw bounding box for visual feedback
      octx.globalAlpha = 0.3
      octx.strokeStyle = '#2563eb'
      octx.lineWidth = 1
      octx.setLineDash([4, 4])
      const metrics = octx.measureText(text)
      const tw = metrics.width
      const th = dispFontSize
      octx.strokeRect(-tw/2 - 4, -th/2 - 4, tw + 8, th + 8)
      octx.restore()
    }
  }, [img, displaySize, text, fontSize, opacity, color, rotation, wmPos, scaleX, scaleY, width])

  useEffect(() => { drawPreview() }, [drawPreview])

  // Handle drag on overlay
  const handlePointerDown = (e) => {
    e.preventDefault()
    const overlay = overlayRef.current
    if (!overlay) return
    const rect = overlay.getBoundingClientRect()
    const cx = e.touches ? e.touches[0].clientX : e.clientX
    const cy = e.touches ? e.touches[0].clientY : e.clientY
    const dispX = cx - rect.left
    const dispY = cy - rect.top
    setDragState({ dragging: true, mode: 'move', startX: dispX, startY: dispY })
  }

  const handlePointerMove = (e) => {
    if (!dragState.dragging) return
    e.preventDefault()
    const overlay = overlayRef.current
    if (!overlay) return
    const rect = overlay.getBoundingClientRect()
    const cx = e.touches ? e.touches[0].clientX : e.clientX
    const cy = e.touches ? e.touches[0].clientY : e.clientY
    const dispX = cx - rect.left
    const dispY = cy - rect.top
    // Update watermark position (convert display coords to image coords)
    setWmPos(prev => ({
      ...prev,
      x: clamp(dispX * scaleX, 0, width),
      y: clamp(dispY * scaleY, 0, height),
    }))
  }

  const handlePointerUp = () => {
    if (dragState.dragging) {
      history.pushState({ text, fontSize, opacity, color, rotation, wmPos })
    }
    setDragState({ dragging: false, mode: null, startX: 0, startY: 0 })
  }

  const handleResetPos = () => {
    setWmPos({ x: width / 2, y: height / 2, w: width, h: height })
    setRotation(0)
  }

  const handleApply = async () => {
    setProcessing(true)
    try {
      const canvas = document.createElement('canvas')
      canvas.width = width; canvas.height = height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0)
      if (text) {
        ctx.save()
        ctx.globalAlpha = opacity / 100
        ctx.font = `bold ${fontSize}px Arial, sans-serif`
        ctx.fillStyle = color
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.translate(wmPos.x, wmPos.y)
        ctx.rotate(rotation * Math.PI / 180)
        ctx.fillText(text, 0, 0)
        ctx.restore()
      }
      const blob = await new Promise((resolve, reject) => {
        canvas.toBlob(b => b ? resolve(b) : reject(new Error('Export failed')), 'image/png')
      })
      setResult({ blob, filename: 'watermarked-image.png' })
    } catch (e) { console.error(e) }
    finally { setProcessing(false) }
  }

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>

  if (result) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 p-3 rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 text-green-700 dark:text-green-400 text-sm font-medium">
          <Check className="w-4 h-4 shrink-0" /> {lang === 'ar' ? 'اكتمل!' : lang === 'fr' ? 'Terminé !' : 'Complete!'}
        </div>
        <button onClick={() => downloadBlob(result.blob, result.filename)} className="btn-primary w-full justify-center py-3.5 text-sm">
          <Download className="w-4 h-4" /> {lang === 'ar' ? 'تحميل' : lang === 'fr' ? 'Télécharger' : 'Download'} {result.filename}
        </button>
        <button onClick={() => setResult(null)} className="text-sm text-[#6B7280] dark:text-[#A1A1AA] hover:text-blue-600 font-medium w-full text-center">
          {lang === 'ar' ? 'ابدأ من جديد' : lang === 'fr' ? 'Recommencer' : 'Start over'}
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <EditorHistoryToolbar canUndo={history.canUndo} canRedo={history.canRedo} onUndo={history.undo} onRedo={history.redo} lang={lang} />
      </div>
      <div className="rounded-xl border border-[#E5E7EB] dark:border-[#27272A] overflow-hidden bg-[#F7F8FA] dark:bg-[#18181B] p-4 flex justify-center relative" style={{ minHeight: '200px' }}>
        <div className="relative inline-block" style={{ width: displaySize.w, height: displaySize.h }}>
          <canvas ref={canvasRef} style={{ width: displaySize.w, height: displaySize.h }} className="rounded-lg" />
          <canvas
            ref={overlayRef}
            style={{ width: displaySize.w, height: displaySize.h, cursor: dragState.dragging ? 'grabbing' : 'grab', touchAction: 'none' }}
            className="absolute top-0 left-0 rounded-lg"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
          />
        </div>
      </div>
      <p className="text-xs text-[#6B7280] dark:text-[#A1A1AA] text-center">{labels.drag}</p>

      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-[#111111] dark:text-[#FAFAFA] mb-1.5">{labels.text}</label>
          <input type="text" value={text} onChange={e => setText(e.target.value)} onBlur={() => history.pushState({ text, fontSize, opacity, color, rotation, wmPos })} className="input-field" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-[#6B7280] dark:text-[#A1A1AA] mb-1">{labels.fontSize}: {fontSize}px</label>
            <input type="range" min="12" max="200" value={fontSize} onChange={e => setFontSize(parseInt(e.target.value))} onPointerUp={() => history.pushState({ text, fontSize, opacity, color, rotation, wmPos })} className="w-full accent-blue-600" />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#6B7280] dark:text-[#A1A1AA] mb-1">{labels.opacity}: {opacity}%</label>
            <input type="range" min="0" max="100" value={opacity} onChange={e => setOpacity(parseInt(e.target.value))} onPointerUp={() => history.pushState({ text, fontSize, opacity, color, rotation, wmPos })} className="w-full accent-blue-600" />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#6B7280] dark:text-[#A1A1AA] mb-1">{labels.rotation}: {rotation}°</label>
            <input type="range" min="-180" max="180" value={rotation} onChange={e => setRotation(parseInt(e.target.value))} onPointerUp={() => history.pushState({ text, fontSize, opacity, color, rotation, wmPos })} className="w-full accent-blue-600" />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#6B7280] dark:text-[#A1A1AA] mb-1">{labels.color}</label>
            <input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-full h-9 rounded-lg border border-[#E5E7EB] dark:border-[#27272A] cursor-pointer" />
          </div>
        </div>
        <button onClick={handleResetPos} className="text-sm text-blue-600 dark:text-blue-400 font-medium hover:underline">
          {labels.resetPos}
        </button>
      </div>

      <button onClick={handleApply} disabled={processing} className="btn-primary w-full justify-center py-3.5 text-sm disabled:opacity-50">
        {processing ? <><Loader2 className="w-4 h-4 animate-spin" /> {labels.processing}</> : labels.apply}
      </button>
    </div>
  )
}

/* ═══ BorderEditor ═══ *//* ═══ BorderEditor ═══ */
export function BorderEditor({ file, lang }) {
  const { img, url, width, height, loading } = useImageLoader(file)
  const canvasRef = useRef(null)
  const [borderWidth, setBorderWidth] = useState(10)
  const [borderColor, setBorderColor] = useState('#000000')
  const [cornerRadius, setCornerRadius] = useState(0)
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState(null)
  const history = useEditorHistory(20)

  const labels = {
    en: { width: 'Border Width', color: 'Border Color', radius: 'Corner Radius', apply: 'Apply & Download', processing: 'Processing...' },
    fr: { width: 'Largeur de bordure', color: 'Couleur de bordure', radius: 'Rayon des coins', apply: 'Appliquer & Télécharger', processing: 'Traitement...' },
    ar: { width: 'عرض الحد', color: 'لون الحد', radius: 'نصف قطر الزاوية', apply: 'تطبيق وتحميل', processing: 'جارٍ المعالجة...' },
  }[lang]

  useEffect(() => {
    if (!img || !canvasRef.current) return
    const bw = Math.max(0, borderWidth)
    const r = Math.max(0, cornerRadius)
    const canvas = canvasRef.current
    canvas.width = width + bw * 2
    canvas.height = height + bw * 2
    const ctx = canvas.getContext('2d')

    // Draw border
    ctx.fillStyle = borderColor
    if (r > 0) {
      ctx.beginPath()
      ctx.roundRect(0, 0, canvas.width, canvas.height, r)
      ctx.fill()
    } else {
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }

    // Draw image inside
    if (r > 0) {
      ctx.save()
      ctx.beginPath()
      ctx.roundRect(bw, bw, width, height, Math.max(0, r - bw))
      ctx.clip()
      ctx.drawImage(img, bw, bw)
      ctx.restore()
    } else {
      ctx.drawImage(img, bw, bw)
    }
  }, [img, borderWidth, borderColor, cornerRadius, width, height])

  const handleApply = async () => {
    setProcessing(true)
    try {
      const canvas = canvasRef.current
      const format = file.type === 'image/jpeg' ? 'image/jpeg' : 'image/png'
      const blob = await new Promise((resolve, reject) => {
        canvas.toBlob(b => b ? resolve(b) : reject(new Error('Export failed')), format, 0.92)
      })
      const ext = format === 'image/jpeg' ? 'jpg' : 'png'
      setResult({ blob, filename: `bordered-image.${ext}` })
    } catch (e) { console.error(e) }
    finally { setProcessing(false) }
  }

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>

  if (result) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 p-3 rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 text-green-700 dark:text-green-400 text-sm font-medium">
          <Check className="w-4 h-4 shrink-0" /> {lang === 'ar' ? 'اكتمل!' : lang === 'fr' ? 'Terminé !' : 'Complete!'}
        </div>
        <button onClick={() => downloadBlob(result.blob, result.filename)} className="btn-primary w-full justify-center py-3.5 text-sm">
          <Download className="w-4 h-4" /> {lang === 'ar' ? 'تحميل' : lang === 'fr' ? 'Télécharger' : 'Download'} {result.filename}
        </button>
        <button onClick={() => setResult(null)} className="text-sm text-[#6B7280] dark:text-[#A1A1AA] hover:text-blue-600 font-medium w-full text-center">
          {lang === 'ar' ? 'ابدأ من جديد' : lang === 'fr' ? 'Recommencer' : 'Start over'}
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <EditorHistoryToolbar canUndo={history.canUndo} canRedo={history.canRedo} onUndo={history.undo} onRedo={history.redo} lang={lang} />
      </div>
      <div className="rounded-xl border border-[#E5E7EB] dark:border-[#27272A] overflow-hidden bg-[#F7F8FA] dark:bg-[#18181B] p-4 flex justify-center">
        <canvas ref={canvasRef} className="max-w-full max-h-[400px] rounded-lg" />
      </div>
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-[#6B7280] dark:text-[#A1A1AA] mb-1">{labels.width}: {borderWidth}px</label>
          <input type="range" min="0" max="100" value={borderWidth} onChange={e => setBorderWidth(parseInt(e.target.value))} onPointerUp={() => history.pushState({ borderWidth, borderColor, cornerRadius })} className="w-full accent-blue-600" />
        </div>
        <div>
          <label className="block text-xs font-medium text-[#6B7280] dark:text-[#A1A1AA] mb-1">{labels.color}</label>
          <input type="color" value={borderColor} onChange={e => setBorderColor(e.target.value)} className="w-full h-9 rounded-lg border border-[#E5E7EB] dark:border-[#27272A] cursor-pointer" />
        </div>
        <div>
          <label className="block text-xs font-medium text-[#6B7280] dark:text-[#A1A1AA] mb-1">{labels.radius}: {cornerRadius}px</label>
          <input type="range" min="0" max="100" value={cornerRadius} onChange={e => setCornerRadius(parseInt(e.target.value))} onPointerUp={() => history.pushState({ borderWidth, borderColor, cornerRadius })} className="w-full accent-blue-600" />
        </div>
      </div>
      <button onClick={handleApply} disabled={processing} className="btn-primary w-full justify-center py-3.5 text-sm disabled:opacity-50">
        {processing ? <><Loader2 className="w-4 h-4 animate-spin" /> {labels.processing}</> : labels.apply}
      </button>
    </div>
  )
}

/* ═══ RoundedCornersEditor ═══ */
export function RoundedCornersEditor({ file, lang }) {
  const { img, url, width, height, loading } = useImageLoader(file)
  const canvasRef = useRef(null)
  const [radius, setRadius] = useState(20)
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState(null)
  const history = useEditorHistory(20)

  const labels = {
    en: { radius: 'Corner Radius', apply: 'Apply & Download', processing: 'Processing...' },
    fr: { radius: 'Rayon des coins', apply: 'Appliquer & Télécharger', processing: 'Traitement...' },
    ar: { radius: 'نصف قطر الزاوية', apply: 'تطبيق وتحميل', processing: 'جارٍ المعالجة...' },
  }[lang]

  useEffect(() => {
    if (!img || !canvasRef.current) return
    const canvas = canvasRef.current
    canvas.width = width; canvas.height = height
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, width, height)
    ctx.save()
    ctx.beginPath()
    ctx.roundRect(0, 0, width, height, Math.max(0, radius))
    ctx.clip()
    ctx.drawImage(img, 0, 0)
    ctx.restore()
  }, [img, radius, width, height])

  const handleApply = async () => {
    setProcessing(true)
    try {
      const canvas = canvasRef.current
      const blob = await new Promise((resolve, reject) => {
        canvas.toBlob(b => b ? resolve(b) : reject(new Error('Export failed')), 'image/png')
      })
      setResult({ blob, filename: 'rounded-image.png' })
    } catch (e) { console.error(e) }
    finally { setProcessing(false) }
  }

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>

  if (result) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 p-3 rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 text-green-700 dark:text-green-400 text-sm font-medium">
          <Check className="w-4 h-4 shrink-0" /> {lang === 'ar' ? 'اكتمل!' : lang === 'fr' ? 'Terminé !' : 'Complete!'}
        </div>
        <button onClick={() => downloadBlob(result.blob, result.filename)} className="btn-primary w-full justify-center py-3.5 text-sm">
          <Download className="w-4 h-4" /> {lang === 'ar' ? 'تحميل' : lang === 'fr' ? 'Télécharger' : 'Download'} {result.filename}
        </button>
        <button onClick={() => setResult(null)} className="text-sm text-[#6B7280] dark:text-[#A1A1AA] hover:text-blue-600 font-medium w-full text-center">
          {lang === 'ar' ? 'ابدأ من جديد' : lang === 'fr' ? 'Recommencer' : 'Start over'}
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <EditorHistoryToolbar canUndo={history.canUndo} canRedo={history.canRedo} onUndo={history.undo} onRedo={history.redo} lang={lang} />
      </div>
      <div className="rounded-xl border border-[#E5E7EB] dark:border-[#27272A] overflow-hidden bg-[#F7F8FA] dark:bg-[#18181B] p-4 flex justify-center">
        <canvas ref={canvasRef} className="max-w-full max-h-[400px] rounded-lg" />
      </div>
      <div>
        <label className="block text-xs font-medium text-[#6B7280] dark:text-[#A1A1AA] mb-1">{labels.radius}: {radius}px</label>
        <input type="range" min="0" max="200" value={radius} onChange={e => setRadius(parseInt(e.target.value))} onPointerUp={() => history.pushState({ radius })} className="w-full accent-blue-600" />
      </div>
      <button onClick={handleApply} disabled={processing} className="btn-primary w-full justify-center py-3.5 text-sm disabled:opacity-50">
        {processing ? <><Loader2 className="w-4 h-4 animate-spin" /> {labels.processing}</> : labels.apply}
      </button>
    </div>
  )
}

/* ═══ Base64Tool ═══ */
export function Base64Tool({ file, lang }) {
  const [base64, setBase64] = useState('')
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState(null)
  const fileUrl = file ? URL.createObjectURL(file) : null

  useEffect(() => {
    if (!file) return
    setLoading(true)
    const reader = new FileReader()
    reader.onload = () => { setBase64(reader.result); setLoading(false) }
    reader.onerror = () => { setError('Failed to read file'); setLoading(false) }
    reader.readAsDataURL(file)
    return () => URL.revokeObjectURL(fileUrl)
  }, [file])

  const labels = {
    en: { copy: 'Copy', copied: 'Copied!', download: 'Download TXT', output: 'Base64 Output' },
    fr: { copy: 'Copier', copied: 'Copié !', download: 'Télécharger TXT', output: 'Sortie Base64' },
    ar: { copy: 'نسخ', copied: 'تم النسخ!', download: 'تحميل TXT', output: 'مخرجات Base64' },
  }[lang]

  const handleCopy = () => {
    navigator.clipboard.writeText(base64).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
  }

  const handleDownload = () => {
    const blob = new Blob([base64], { type: 'text/plain' })
    downloadBlob(blob, 'image-base64.txt')
  }

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>

  return (
    <div className="space-y-4">
      {fileUrl && (
        <div className="rounded-xl border border-[#E5E7EB] dark:border-[#27272A] overflow-hidden bg-[#F7F8FA] dark:bg-[#18181B] p-4 flex justify-center">
          <img src={fileUrl} alt="Preview" className="max-w-full max-h-[200px] rounded-lg" />
        </div>
      )}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-[#111111] dark:text-[#FAFAFA]">{labels.output}</label>
          <div className="flex gap-2">
            <button onClick={handleCopy} className="px-3 py-1.5 rounded-lg text-xs font-medium border border-[#E5E7EB] dark:border-[#27272A] text-[#6B7280] dark:text-[#A1A1AA] hover:bg-gray-50 dark:hover:bg-[#18181B] transition-colors flex items-center gap-1.5">
              {copied ? <><Check className="w-3.5 h-3.5 text-green-500" /> {labels.copied}</> : <><Copy className="w-3.5 h-3.5" /> {labels.copy}</>}
            </button>
            <button onClick={handleDownload} className="px-3 py-1.5 rounded-lg text-xs font-medium btn-primary flex items-center gap-1.5">
              <Download className="w-3.5 h-3.5" /> {labels.download}
            </button>
          </div>
        </div>
        <textarea readOnly value={base64} className="w-full h-48 p-3 rounded-xl border border-[#E5E7EB] dark:border-[#27272A] bg-[#F7F8FA] dark:bg-[#18181B] text-xs font-mono text-[#111111] dark:text-[#FAFAFA] resize-none focus:outline-none focus:border-blue-400" />
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  )
}

/* ═══ Base64ToImageTool ═══ */
export function Base64ToImageTool({ lang }) {
  const [base64Input, setBase64Input] = useState('')
  const [error, setError] = useState(null)
  const [imageData, setImageData] = useState(null)

  const labels = {
    en: { placeholder: 'Paste Base64 string here...', convert: 'Convert to Image', download: 'Download Image', error: 'Invalid Base64 string', preview: 'Preview' },
    fr: { placeholder: 'Collez la chaîne Base64 ici...', convert: 'Convertir en Image', download: 'Télécharger', error: 'Chaîne Base64 invalide', preview: 'Aperçu' },
    ar: { placeholder: 'الصق سلسلة Base64 هنا...', convert: 'تحويل إلى صورة', download: 'تحميل الصورة', error: 'سلسلة Base64 غير صالحة', preview: 'معاينة' },
  }[lang]

  const handleConvert = () => {
    setError(null); setImageData(null)
    try {
      let dataUrl = base64Input.trim()
      if (!dataUrl.startsWith('data:')) {
        // Try to detect mime type from base64 content
        dataUrl = `data:image/png;base64,${dataUrl}`
      }
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = img.naturalWidth; canvas.height = img.naturalHeight
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0)
        canvas.toBlob(blob => {
          const ext = dataUrl.match(/data:image\/(\w+)/)?.[1] || 'png'
          setImageData({ blob: blob, filename: `decoded-image.${ext}`, url: URL.createObjectURL(blob) })
        })
      }
      img.onerror = () => setError(labels.error)
      img.src = dataUrl
    } catch (e) { setError(labels.error) }
  }

  return (
    <div className="space-y-4">
      <textarea
        value={base64Input}
        onChange={e => setBase64Input(e.target.value)}
        placeholder={labels.placeholder}
        className="w-full h-48 p-3 rounded-xl border border-[#E5E7EB] dark:border-[#27272A] bg-[#F7F8FA] dark:bg-[#18181B] text-xs font-mono text-[#111111] dark:text-[#FAFAFA] resize-none focus:outline-none focus:border-blue-400"
      />
      <button onClick={handleConvert} disabled={!base64Input.trim()} className="btn-primary w-full justify-center py-3.5 text-sm disabled:opacity-50">
        {labels.convert}
      </button>
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}
      {imageData && (
        <div className="space-y-3">
          <div className="rounded-xl border border-[#E5E7EB] dark:border-[#27272A] overflow-hidden bg-[#F7F8FA] dark:bg-[#18181B] p-4 flex justify-center">
            <img src={imageData.url} alt="Decoded" className="max-w-full max-h-[300px] rounded-lg" />
          </div>
          <button onClick={() => downloadBlob(imageData.blob, imageData.filename)} className="btn-primary w-full justify-center py-3.5 text-sm">
            <Download className="w-4 h-4" /> {labels.download}
          </button>
        </div>
      )}
    </div>
  )
}

/* ═══ ImageMetadataViewer ═══ */
export function ImageMetadataViewer({ file, lang }) {
  const [metadata, setMetadata] = useState(null)
  const [loading, setLoading] = useState(true)
  const fileUrl = file ? URL.createObjectURL(file) : null

  useEffect(() => {
    if (!file) return
    async function readMeta() {
      setLoading(true)
      try {
        const img = await new Promise((resolve, reject) => {
          const url = URL.createObjectURL(file)
          const i = new Image()
          i.onload = () => { URL.revokeObjectURL(url); resolve(i) }
          i.onerror = reject
          i.src = url
        })
        const w = img.naturalWidth, h = img.naturalHeight
        const gcd = (a, b) => b === 0 ? a : gcd(b, a % b)
        const g = gcd(w, h)
        const aspectRatio = `${w / g}:${h / g}`
        const meta = {
          filename: file.name,
          fileType: file.type,
          fileSize: formatFileSize(file.size),
          width: w,
          height: h,
          aspectRatio,
          lastModified: new Date(file.lastModified).toLocaleDateString(),
        }
        setMetadata(meta)
      } catch (e) { console.error(e) }
      finally { setLoading(false) }
    }
    readMeta()
    return () => { if (fileUrl) URL.revokeObjectURL(fileUrl) }
  }, [file])

  const labels = {
    en: { filename: 'Filename', fileType: 'File Type', fileSize: 'File Size', width: 'Width', height: 'Height', aspectRatio: 'Aspect Ratio', lastModified: 'Last Modified' },
    fr: { filename: 'Nom du fichier', fileType: 'Type de fichier', fileSize: 'Taille', width: 'Largeur', height: 'Hauteur', aspectRatio: 'Format', lastModified: 'Dernière modification' },
    ar: { filename: 'اسم الملف', fileType: 'نوع الملف', fileSize: 'حجم الملف', width: 'العرض', height: 'الارتفاع', aspectRatio: 'نسبة العرض', lastModified: 'آخر تعديل' },
  }[lang]

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>

  return (
    <div className="space-y-4">
      {fileUrl && (
        <div className="rounded-xl border border-[#E5E7EB] dark:border-[#27272A] overflow-hidden bg-[#F7F8FA] dark:bg-[#18181B] p-4 flex justify-center">
          <img src={fileUrl} alt={file.name} className="max-w-full max-h-[200px] rounded-lg" />
        </div>
      )}
      {metadata && (
        <div className="space-y-2">
          {Object.entries(labels).map(([key, label]) => (
            <div key={key} className="flex items-center justify-between py-2.5 px-4 rounded-xl bg-[#F7F8FA] dark:bg-[#18181B]">
              <span className="text-sm text-[#6B7280] dark:text-[#A1A1AA]">{label}</span>
              <span className="text-sm font-medium text-[#111111] dark:text-[#FAFAFA]">{metadata[key]}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ═══ ImageConverterTool (generic multi-format converter) ═══ */
export function ImageConverterTool({ file, lang }) {
  const { img, url, width, height, loading } = useImageLoader(file)
  const [targetFormat, setTargetFormat] = useState('image/png')
  const [bgColor, setBgColor] = useState('#FFFFFF')
  const [showBgSelector, setShowBgSelector] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState(null)
  const canvasRef = useRef(null)

  const labels = {
    en: { source: 'Source Format', target: 'Target Format', convert: 'Convert & Download', processing: 'Processing...', background: 'Background', white: 'White', black: 'Black', custom: 'Custom' },
    fr: { source: 'Format Source', target: 'Format Cible', convert: 'Convertir & Télécharger', processing: 'Traitement...', background: 'Arrière-plan', white: 'Blanc', black: 'Noir', custom: 'Personnalisé' },
    ar: { source: 'الصيغة المصدر', target: 'الصيغة الهدف', convert: 'تحويل وتحميل', processing: 'جارٍ المعالجة...', background: 'الخلفية', white: 'أبيض', black: 'أسود', custom: 'مخصص' },
  }[lang]

  const formats = [
    { mime: 'image/jpeg', label: 'JPG', ext: 'jpg' },
    { mime: 'image/png', label: 'PNG', ext: 'png' },
    { mime: 'image/webp', label: 'WEBP', ext: 'webp' },
  ]

  useEffect(() => {
    setShowBgSelector(targetFormat === 'image/jpeg' && file?.type === 'image/png')
  }, [targetFormat, file])

  const handleConvert = async () => {
    setProcessing(true)
    try {
      const canvas = document.createElement('canvas')
      canvas.width = width; canvas.height = height
      const ctx = canvas.getContext('2d')
      if (targetFormat === 'image/jpeg') {
        ctx.fillStyle = bgColor; ctx.fillRect(0, 0, width, height)
      }
      ctx.drawImage(img, 0, 0)
      const blob = await new Promise((resolve, reject) => {
        canvas.toBlob(b => b ? resolve(b) : reject(new Error('Conversion failed')), targetFormat, 0.92)
      })
      const ext = formats.find(f => f.mime === targetFormat)?.ext || 'png'
      setResult({ blob, filename: `converted-image.${ext}` })
    } catch (e) { console.error(e) }
    finally { setProcessing(false) }
  }

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>

  if (result) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 p-3 rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 text-green-700 dark:text-green-400 text-sm font-medium">
          <Check className="w-4 h-4 shrink-0" /> {lang === 'ar' ? 'اكتمل!' : lang === 'fr' ? 'Terminé !' : 'Complete!'}
        </div>
        <button onClick={() => downloadBlob(result.blob, result.filename)} className="btn-primary w-full justify-center py-3.5 text-sm">
          <Download className="w-4 h-4" /> {lang === 'ar' ? 'تحميل' : lang === 'fr' ? 'Télécharger' : 'Download'} {result.filename}
        </button>
        <button onClick={() => setResult(null)} className="text-sm text-[#6B7280] dark:text-[#A1A1AA] hover:text-blue-600 font-medium w-full text-center">
          {lang === 'ar' ? 'ابدأ من جديد' : lang === 'fr' ? 'Recommencer' : 'Start over'}
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-[#E5E7EB] dark:border-[#27272A] overflow-hidden bg-[#F7F8FA] dark:bg-[#18181B] p-4 flex justify-center">
        <img src={url} alt="Preview" className="max-w-full max-h-[300px] rounded-lg" />
      </div>
      <div>
        <label className="block text-sm font-medium text-[#111111] dark:text-[#FAFAFA] mb-1.5">{labels.source}: <span className="text-[#6B7280] dark:text-[#A1A1AA]">{file?.type || 'unknown'}</span></label>
        <label className="block text-sm font-medium text-[#111111] dark:text-[#FAFAFA] mb-2">{labels.target}</label>
        <div className="grid grid-cols-3 gap-2">
          {formats.map(f => (
            <button key={f.mime} onClick={() => setTargetFormat(f.mime)}
              className={`py-3 rounded-xl text-sm font-medium border transition-colors ${targetFormat === f.mime ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400' : 'border-[#E5E7EB] dark:border-[#27272A] text-[#6B7280] dark:text-[#A1A1AA] hover:border-blue-300'}`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>
      {showBgSelector && (
        <div>
          <label className="block text-sm font-medium text-[#111111] dark:text-[#FAFAFA] mb-2">{labels.background}</label>
          <div className="flex gap-3 items-center">
            <button onClick={() => setBgColor('#FFFFFF')} className={`px-4 py-2 rounded-lg text-sm border ${bgColor === '#FFFFFF' ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20' : 'border-[#E5E7EB] dark:border-[#27272A]'}`}>{labels.white}</button>
            <button onClick={() => setBgColor('#000000')} className={`px-4 py-2 rounded-lg text-sm border ${bgColor === '#000000' ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20' : 'border-[#E5E7EB] dark:border-[#27272A]'}`}>{labels.black}</button>
            <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)} className="w-9 h-9 rounded-lg border border-[#E5E7EB] dark:border-[#27272A] cursor-pointer" />
            <span className="text-xs text-[#6B7280] dark:text-[#A1A1AA]">{labels.custom}</span>
          </div>
        </div>
      )}
      <button onClick={handleConvert} disabled={processing} className="btn-primary w-full justify-center py-3.5 text-sm disabled:opacity-50">
        {processing ? <><Loader2 className="w-4 h-4 animate-spin" /> {labels.processing}</> : labels.convert}
      </button>
    </div>
  )
}
