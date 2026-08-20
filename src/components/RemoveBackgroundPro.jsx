/**
 * RemoveBackgroundPro.jsx — Professional AI background removal with brush refinement.
 * Lazy-loads @imgly/background-removal model.
 * Features: before/after, zoom/pan, brush keep/remove, background options, export.
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Download, Check, Loader2, X, AlertCircle, ZoomIn, ZoomOut,
  Eye, EyeOff, Brush, Eraser, Undo2, Redo2, RotateCcw, Maximize,
} from 'lucide-react'
import { downloadBlob, getOutputFilename } from '../lib/processors/image.js'

const clamp = (v, mn, mx) => Math.max(mn, Math.min(mx, v))

function L(lang, en, fr, ar) { return lang === 'ar' ? ar : lang === 'fr' ? fr : en }

export function RemoveBackgroundProEditor({ file, lang }) {
  const [stage, setStage] = useState('idle') // idle, loading-model, processing, done, error
  const [progress, setProgress] = useState(0)
  const [progressLabel, setProgressLabel] = useState('')
  const [error, setError] = useState(null)
  const [resultBlob, setResultBlob] = useState(null)
  
  // Canvas refs
  const canvasRef = useRef(null)
  const maskRef = useRef(null)
  const containerRef = useRef(null)
  
  // Image data
  const imgRef = useRef(null)
  const [imgSize, setImgSize] = useState({ w: 0, h: 0 })
  
  // View state
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [showOriginal, setShowOriginal] = useState(false)
  
  // Brush state
  const [brushMode, setBrushMode] = useState('remove') // 'keep' or 'remove'
  const [brushSize, setBrushSize] = useState(30)
  const [isDrawing, setIsDrawing] = useState(false)
  
  // Mask data (1 = keep, 0 = remove)
  const maskRef2 = useRef(null) // Uint8Array mask
  const aiMaskRef = useRef(null) // Original AI mask
  const [hasMask, setHasMask] = useState(false)
  
  // Background option
  const [bgMode, setBgMode] = useState('transparent') // transparent, color, white
  const [bgColor, setBgColor] = useState('#ffffff')
  
  // History
  const historyRef = useRef([])
  const [histIdx, setHistIdx] = useState(-1)
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)
  
  // Before URL
  const [beforeURL, setBeforeURL] = useState(null)
  useEffect(() => { setBeforeURL(URL.createObjectURL(file)) }, [file])

  // Load image
  useEffect(() => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      imgRef.current = img
      setImgSize({ w: img.naturalWidth, h: img.naturalHeight })
      URL.revokeObjectURL(url)
    }
    img.onerror = () => { setError('Failed to load image'); URL.revokeObjectURL(url) }
    img.src = url
  }, [file])

  const updateHistory = useCallback(() => {
    if (!maskRef2.current) return
    historyRef.current = historyRef.current.slice(0, histIdx + 1)
    historyRef.current.push(new Uint8Array(maskRef2.current))
    if (historyRef.current.length > 20) historyRef.current.shift()
    setHistIdx(historyRef.current.length - 1)
    setCanUndo(historyRef.current.length > 1)
    setCanRedo(false)
  }, [histIdx])

  const handleUndo = () => {
    if (histIdx <= 0) return
    const idx = histIdx - 1
    maskRef2.current = new Uint8Array(historyRef.current[idx])
    setHistIdx(idx)
    setCanUndo(idx > 0)
    setCanRedo(idx < historyRef.current.length - 1)
    drawCanvas()
  }

  const handleRedo = () => {
    if (histIdx >= historyRef.current.length - 1) return
    const idx = histIdx + 1
    maskRef2.current = new Uint8Array(historyRef.current[idx])
    setHistIdx(idx)
    setCanUndo(idx > 0)
    setCanRedo(idx < historyRef.current.length - 1)
    drawCanvas()
  }

  const handleReset = () => {
    if (!aiMaskRef.current) return
    maskRef2.current = new Uint8Array(aiMaskRef.current)
    historyRef.current = [new Uint8Array(aiMaskRef.current)]
    setHistIdx(0)
    setCanUndo(false)
    setCanRedo(false)
    drawCanvas()
  }

  // Draw canvas with mask applied
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current
    const img = imgRef.current
    if (!canvas || !img || !maskRef2.current) return

    const w = imgSize.w, h = imgSize.h
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, w, h)

    // Draw image
    ctx.drawImage(img, 0, 0)

    // Apply mask: make removed areas transparent
    const imageData = ctx.getImageData(0, 0, w, h)
    const data = imageData.data
    const mask = maskRef2.current
    for (let i = 0; i < mask.length; i++) {
      if (mask[i] === 0) {
        data[i * 4 + 3] = 0 // transparent
      }
    }
    ctx.putImageData(imageData, 0, 0)

    // Draw background if not transparent
    if (bgMode !== 'transparent' && !showOriginal) {
      const bgCanvas = document.createElement('canvas')
      bgCanvas.width = w; bgCanvas.height = h
      const bgCtx = bgCanvas.getContext('2d')
      bgCtx.fillStyle = bgMode === 'white' ? '#ffffff' : bgColor
      bgCtx.fillRect(0, 0, w, h)
      bgCtx.drawImage(canvas, 0, 0)
      ctx.clearRect(0, 0, w, h)
      ctx.drawImage(bgCanvas, 0, 0)
    }

    // Draw brush overlay on mask canvas
    const maskCanvas = maskRef.current
    if (maskCanvas) {
      maskCanvas.width = w
      maskCanvas.height = h
      const mctx = maskCanvas.getContext('2d')
      mctx.clearRect(0, 0, w, h)
      // Draw mask preview (semi-transparent red for remove areas, green for keep)
      for (let i = 0; i < mask.length; i++) {
        if (mask[i] === 0) {
          const x = i % w, y = Math.floor(i / w)
          mctx.fillStyle = 'rgba(255, 0, 0, 0.3)'
          mctx.fillRect(x, y, 1, 1)
        }
      }
    }
  }, [imgSize, bgMode, bgColor, showOriginal])

  useEffect(() => { drawCanvas() }, [drawCanvas])

  // AI background removal
  const handleRemove = async () => {
    setStage('loading-model')
    setError(null)
    setProgress(0)
    try {
      setProgressLabel(L(lang, 'Loading AI model (~20MB)...', 'Chargement du modèle IA (~20MB)...', 'تحميل نموذج الذكاء الاصطناعي (~20MB)...'))
      const { removeBackground } = await import('@imgly/background-removal')
      
      setStage('processing')
      setProgressLabel(L(lang, 'Processing image...', 'Traitement de l\'image...', 'جارٍ معالجة الصورة...'))
      
      const blob = await removeBackground(file, {
        progress: (key, current, total) => {
          const pct = total > 0 ? Math.round((current / total) * 100) : 0
          setProgress(pct)
        },
      })
      
      // Get the alpha mask from the result
      const resultImg = new Image()
      const resultURL = URL.createObjectURL(blob)
      await new Promise((resolve, reject) => {
        resultImg.onload = resolve
        resultImg.onerror = reject
        resultImg.src = resultURL
      })
      
      // Create mask from result alpha channel
      const w = imgSize.w, h = imgSize.h
      const tempCanvas = document.createElement('canvas')
      tempCanvas.width = w; tempCanvas.height = h
      const tctx = tempCanvas.getContext('2d')
      tctx.drawImage(resultImg, 0, 0, w, h)
      const resultData = tctx.getImageData(0, 0, w, h)
      
      // Build mask: 1 = keep (opaque), 0 = remove (transparent)
      const mask = new Uint8Array(w * h)
      for (let i = 0; i < w * h; i++) {
        mask[i] = resultData.data[i * 4 + 3] > 128 ? 1 : 0
      }
      
      maskRef2.current = mask
      aiMaskRef.current = new Uint8Array(mask)
      historyRef.current = [new Uint8Array(mask)]
      setHistIdx(0)
      setHasMask(true)
      setResultBlob(blob)
      setStage('done')
      URL.revokeObjectURL(resultURL)
    } catch (e) {
      console.error(e)
      setError(e.message || L(lang, 'Background removal failed. Please try a different image.', 'Échec de la suppression d\'arrière-plan.', 'فشل إزالة الخلفية.'))
      setStage('error')
    }
  }

  // Brush drawing
  const getCanvasPos = (e) => {
    const canvas = maskRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    const cx = e.touches ? e.touches[0].clientX : e.clientX
    const cy = e.touches ? e.touches[0].clientY : e.clientY
    const x = Math.round((cx - rect.left) / rect.width * imgSize.w)
    const y = Math.round((cy - rect.top) / rect.height * imgSize.h)
    return { x, y }
  }

  const drawBrush = (pos) => {
    if (!maskRef2.current || !pos) return
    const w = imgSize.w, h = imgSize.h
    const r = brushSize * (w / (maskRef.current?.getBoundingClientRect().width || w))
    const r2 = Math.max(1, Math.round(r))
    const val = brushMode === 'keep' ? 1 : 0
    for (let dy = -r2; dy <= r2; dy++) {
      for (let dx = -r2; dx <= r2; dx++) {
        if (dx * dx + dy * dy <= r2 * r2) {
          const px = pos.x + dx, py = pos.y + dy
          if (px >= 0 && px < w && py >= 0 && py < h) {
            maskRef2.current[py * w + px] = val
          }
        }
      }
    }
    drawCanvas()
  }

  const handlePointerDown = (e) => {
    e.preventDefault()
    setIsDrawing(true)
    drawBrush(getCanvasPos(e))
  }

  const handlePointerMove = (e) => {
    if (!isDrawing) return
    e.preventDefault()
    drawBrush(getCanvasPos(e))
  }

  const handlePointerUp = () => {
    if (isDrawing) {
      setIsDrawing(false)
      updateHistory()
    }
  }

  // Export
  const handleExport = async () => {
    if (!maskRef2.current) return
    const w = imgSize.w, h = imgSize.h
    const canvas = document.createElement('canvas')
    canvas.width = w; canvas.height = h
    const ctx = canvas.getContext('2d')
    
    if (bgMode !== 'transparent') {
      ctx.fillStyle = bgMode === 'white' ? '#ffffff' : bgColor
      ctx.fillRect(0, 0, w, h)
    }
    
    ctx.drawImage(imgRef.current, 0, 0)
    const imageData = ctx.getImageData(0, 0, w, h)
    const data = imageData.data
    const mask = maskRef2.current
    for (let i = 0; i < mask.length; i++) {
      if (mask[i] === 0) data[i * 4 + 3] = 0
    }
    ctx.putImageData(imageData, 0, 0)
    
    const ext = bgMode === 'transparent' ? 'png' : 'png'
    const blob = await new Promise(res => canvas.toBlob(res, 'image/png'))
    downloadBlob(blob, getOutputFilename(file.name, ext))
  }

  const fitToScreen = () => { setZoom(1); setPan({ x: 0, y: 0 }) }

  // Loading / error states
  if (stage === 'loading-model' || stage === 'processing') {
    return (
      <div className="space-y-4">
        <div className="flex flex-col items-center gap-4 py-12">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
          <p className="text-sm font-medium text-[#111111] dark:text-[#FAFAFA]">{progressLabel}</p>
          {progress > 0 && (
            <>
              <div className="w-48 bg-[#E5E7EB] dark:bg-[#27272A] rounded-full h-2 overflow-hidden">
                <div className="bg-blue-600 h-full transition-all" style={{ width: `${progress}%` }} />
              </div>
              <p className="text-xs text-[#6B7280] dark:text-[#A1A1AA]">{progress}%</p>
            </>
          )}
        </div>
      </div>
    )
  }

  if (stage === 'error') {
    return (
      <div className="space-y-4">
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-600 text-sm flex items-start gap-2">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
        <button onClick={() => setStage('idle')} className="btn-primary w-full justify-center py-3.5 text-sm">
          {L(lang, 'Try Again', 'Réessayer', 'حاول مرة أخرى')}
        </button>
      </div>
    )
  }

  // Idle state — before processing
  if (stage === 'idle') {
    return (
      <div className="space-y-4">
        {beforeURL && (
          <div className="rounded-xl border border-[#E5E7EB] dark:border-[#27272A] overflow-hidden p-4 flex justify-center bg-[#F7F8FA] dark:bg-[#18181B]">
            <img src={beforeURL} className="max-w-full max-h-[300px] rounded-lg" />
          </div>
        )}
        <p className="text-xs text-[#6B7280] dark:text-[#A1A1AA] text-center">
          {L(lang, 'AI-powered background removal. The model loads on first use (~20MB download).', 'Suppression d\'arrière-plan par IA. Le modèle se télécharge à la première utilisation.', 'إزالة الخلفية بالذكاء الاصطناعي. يتم تحميل النموذج عند الاستخدام الأول.')}
        </p>
        <button onClick={handleRemove} className="btn-primary w-full justify-center py-3.5 text-sm">
          {L(lang, 'Remove Background', 'Supprimer l\'arrière-plan', 'إزالة الخلفية')}
        </button>
      </div>
    )
  }

  // Done state — editor
  return (
    <div className="space-y-4">
      {/* Before/After toggle */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowOriginal(!showOriginal)}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${showOriginal ? 'bg-blue-600 text-white' : 'border border-[#E5E7EB] dark:border-[#27272A] text-[#6B7280] dark:text-[#A1A1AA]'}`}
        >
          {showOriginal ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          {showOriginal ? L(lang, 'Show Result', 'Voir le résultat', 'عرض النتيجة') : L(lang, 'Show Original', 'Voir l\'original', 'عرض الأصلي')}
        </button>
      </div>

      {/* Canvas viewport */}
      <div
        ref={containerRef}
        className="rounded-xl border border-[#E5E7EB] dark:border-[#27272A] overflow-hidden relative"
        style={{
          background: showOriginal ? '#F7F8FA' : (bgMode === 'transparent' ? 'repeating-conic-gradient(#e5e7eb 0% 25%, transparent 0% 50%) 50% / 16px 16px' : '#fff'),
          minHeight: '200px',
          maxHeight: '400px',
          overflow: 'hidden',
        }}
      >
        <div className="flex justify-center items-center p-4" style={{ minHeight: '200px' }}>
          {showOriginal ? (
            <img src={beforeURL} className="max-w-full max-h-[350px] rounded-lg" style={{ transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)` }} />
          ) : (
            <div className="relative" style={{ transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`, transformOrigin: 'center' }}>
              <canvas ref={canvasRef} className="max-w-full max-h-[350px] rounded-lg" style={{ display: 'block' }} />
              <canvas
                ref={maskRef}
                className="absolute top-0 left-0 cursor-crosshair rounded-lg"
                style={{ touchAction: 'none', maxWidth: '100%', maxHeight: '350px' }}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
              />
            </div>
          )}
        </div>
      </div>

      {/* Zoom controls */}
      <div className="flex items-center justify-center gap-2">
        <button onClick={() => setZoom(z => clamp(z - 0.2, 0.5, 3))} className="p-2 rounded-lg border border-[#E5E7EB] dark:border-[#27272A] text-[#6B7280] dark:text-[#A1A1AA] hover:bg-gray-50 dark:hover:bg-[#18181B]"><ZoomOut className="w-4 h-4" /></button>
        <span className="text-xs text-[#6B7280] dark:text-[#A1A1AA] w-12 text-center">{Math.round(zoom * 100)}%</span>
        <button onClick={() => setZoom(z => clamp(z + 0.2, 0.5, 3))} className="p-2 rounded-lg border border-[#E5E7EB] dark:border-[#27272A] text-[#6B7280] dark:text-[#A1A1AA] hover:bg-gray-50 dark:hover:bg-[#18181B]"><ZoomIn className="w-4 h-4" /></button>
        <button onClick={fitToScreen} className="p-2 rounded-lg border border-[#E5E7EB] dark:border-[#27272A] text-[#6B7280] dark:text-[#A1A1AA] hover:bg-gray-50 dark:hover:bg-[#18181B]" title={L(lang, 'Fit to screen', 'Ajuster', 'ملاءمة')}><Maximize className="w-4 h-4" /></button>
      </div>

      {/* Brush tools */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setBrushMode('keep')}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${brushMode === 'keep' ? 'bg-green-600 text-white' : 'border border-[#E5E7EB] dark:border-[#27272A] text-[#6B7280] dark:text-[#A1A1AA]'}`}
          >
            <Brush className="w-4 h-4" /> {L(lang, 'Keep', 'Garder', 'إبقاء')}
          </button>
          <button
            onClick={() => setBrushMode('remove')}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${brushMode === 'remove' ? 'bg-red-600 text-white' : 'border border-[#E5E7EB] dark:border-[#27272A] text-[#6B7280] dark:text-[#A1A1AA]'}`}
          >
            <Eraser className="w-4 h-4" /> {L(lang, 'Remove', 'Supprimer', 'إزالة')}
          </button>
          <div className="flex-1 flex items-center gap-2">
            <input type="range" min="5" max="100" value={brushSize} onChange={e => setBrushSize(parseInt(e.target.value))} className="flex-1 accent-blue-600" />
            <span className="text-xs text-[#6B7280] dark:text-[#A1A1AA] w-8">{brushSize}px</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleUndo} disabled={!canUndo} className="p-2 rounded-lg border border-[#E5E7EB] dark:border-[#27272A] text-[#6B7280] dark:text-[#A1A1AA] disabled:opacity-30 hover:bg-gray-50 dark:hover:bg-[#18181B]"><Undo2 className="w-4 h-4" /></button>
          <button onClick={handleRedo} disabled={!canRedo} className="p-2 rounded-lg border border-[#E5E7EB] dark:border-[#27272A] text-[#6B7280] dark:text-[#A1A1AA] disabled:opacity-30 hover:bg-gray-50 dark:hover:bg-[#18181B]"><Redo2 className="w-4 h-4" /></button>
          <button onClick={handleReset} className="flex items-center gap-1 px-3 py-2 rounded-lg border border-[#E5E7EB] dark:border-[#27272A] text-[#6B7280] dark:text-[#A1A1AA] text-sm hover:bg-gray-50 dark:hover:bg-[#18181B]"><RotateCcw className="w-4 h-4" /> {L(lang, 'Reset Mask', 'Réinitialiser', 'إعادة تعيين')}</button>
        </div>
      </div>

      {/* Background options */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-[#111111] dark:text-[#FAFAFA]">{L(lang, 'Background', 'Arrière-plan', 'الخلفية')}</label>
        <div className="flex items-center gap-2">
          <button onClick={() => setBgMode('transparent')} className={`px-3 py-2 rounded-xl text-sm font-medium ${bgMode === 'transparent' ? 'bg-blue-600 text-white' : 'border border-[#E5E7EB] dark:border-[#27272A] text-[#6B7280] dark:text-[#A1A1AA]'}`}>{L(lang, 'Transparent', 'Transparent', 'شفاف')}</button>
          <button onClick={() => setBgMode('white')} className={`px-3 py-2 rounded-xl text-sm font-medium ${bgMode === 'white' ? 'bg-blue-600 text-white' : 'border border-[#E5E7EB] dark:border-[#27272A] text-[#6B7280] dark:text-[#A1A1AA]'}`}>{L(lang, 'White', 'Blanc', 'أبيض')}</button>
          <button onClick={() => setBgMode('color')} className={`px-3 py-2 rounded-xl text-sm font-medium ${bgMode === 'color' ? 'bg-blue-600 text-white' : 'border border-[#E5E7EB] dark:border-[#27272A] text-[#6B7280] dark:text-[#A1A1AA]'}`}>{L(lang, 'Custom', 'Personnalisé', 'مخصص')}</button>
          {bgMode === 'color' && <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)} className="w-10 h-9 rounded-lg border border-[#E5E7EB] dark:border-[#27272A] cursor-pointer bg-transparent" />}
        </div>
      </div>

      {/* Export */}
      <button onClick={handleExport} className="btn-primary w-full justify-center py-3.5 text-sm">
        <Download className="w-4 h-4" /> {L(lang, 'Download PNG', 'Télécharger PNG', 'تحميل PNG')}
      </button>
    </div>
  )
}
