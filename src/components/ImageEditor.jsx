/**
 * Visual Image Editor Components
 * Professional, touch-friendly image editing UI with drag handles,
 * crop overlays, live previews, and zoom controls.
 * 
 * Uses pointer events for unified mouse + touch support.
 */

import { useState, useRef, useEffect, useCallback, useLayoutEffect } from 'react'
import {
  ZoomIn, ZoomOut, Lock, Unlock, RotateCcw, RotateCw, Crop, Maximize,
  Download, Check, X, Image as ImageIcon, RefreshCw, AlertCircle,
} from 'lucide-react'
import {
  compressImage, resizeImage, cropImage, convertImage, convertImageWithBackground,
  cropAndRotate, rotateImage, downloadBlob, getOutputFilename, formatFileSize,
} from '../lib/processors/image.js'
import { EditorHistoryToolbar, useEditorHistory } from './EditorHistory'

/* ═══════════════════════════════════════════════════
   SHARED HOOKS & UTILITIES
   ═══════════════════════════════════════════════════ */

/** Load an image File into an HTMLImageElement, returns { img, url, width, height } */
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

/** Format bytes → human readable */
function formatBytes(b) {
  if (!b || b < 1) return '0 B'
  if (b < 1024) return b + ' B'
  if (b < 1048576) return (b / 1024).toFixed(1) + ' KB'
  return (b / 1048576).toFixed(2) + ' MB'
}

/** Constrain a value between min and max */
const clamp = (v, min, max) => Math.max(min, Math.min(max, v))

/** Get pointer position relative to an element (works for mouse + touch) */
function getPointerPos(e, container) {
  const rect = container.getBoundingClientRect()
  const clientX = e.clientX ?? (e.touches && e.touches[0]?.clientX) ?? 0
  const clientY = e.clientY ?? (e.touches && e.touches[0]?.clientY) ?? 0
  return { x: clientX - rect.left, y: clientY - rect.top, rect }
}

/* ═══════════════════════════════════════════════════
   SHARED UI PIECES
   ═══════════════════════════════════════════════════ */

/** Image preview area with checkerboard background for transparency */
function EditorCanvas({ children, className = '' }) {
  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden rounded-xl border border-[#E5E7EB] dark:border-[#27272A] ${className}`}
      style={{
        minHeight: '280px',
        backgroundImage: `linear-gradient(45deg, #e5e7eb 25%, transparent 25%), linear-gradient(-45deg, #e5e7eb 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e5e7eb 75%), linear-gradient(-45deg, transparent 75%, #e5e7eb 75%)`,
        backgroundSize: '20px 20px',
        backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
        backgroundColor: '#f9fafb',
      }}
    >
      <div className="dark:hidden absolute inset-0" style={{ backgroundColor: '#f9fafb' }} />
      <div className="hidden dark:block absolute inset-0 bg-gray-900" />
      <div className="relative z-10">{children}</div>
    </div>
  )
}

/** Zoom controls row */
function ZoomControls({ zoom, setZoom, min = 0.1, max = 3 }) {
  return (
    <div className="flex items-center gap-2">
      <button onClick={() => setZoom(z => clamp(z - 0.1, min, max))} className="p-2 rounded-lg bg-[#F7F8FA] dark:bg-[#18181B] hover:bg-[#F7F8FA] dark:hover:bg-[#18181B] transition-colors touch-manipulation">
        <ZoomOut className="w-4 h-4 text-[#6B7280] dark:text-[#A1A1AA]" />
      </button>
      <input
        type="range"
        min={min}
        max={max}
        step={0.05}
        value={zoom}
        onChange={e => setZoom(parseFloat(e.target.value))}
        className="w-24 accent-blue-600 touch-manipulation"
      />
      <button onClick={() => setZoom(z => clamp(z + 0.1, min, max))} className="p-2 rounded-lg bg-[#F7F8FA] dark:bg-[#18181B] hover:bg-[#F7F8FA] dark:hover:bg-[#18181B] transition-colors touch-manipulation">
        <ZoomIn className="w-4 h-4 text-[#6B7280] dark:text-[#A1A1AA]" />
      </button>
      <span className="text-xs text-[#6B7280] dark:text-[#A1A1AA] w-10 text-center tabular-nums">{Math.round(zoom * 100)}%</span>
    </div>
  )
}

/** Toolbar button */
function ToolButton({ icon: Icon, onClick, active, label, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={label}
      className={`p-2.5 rounded-lg transition-colors touch-manipulation disabled:opacity-40 disabled:cursor-not-allowed ${
        active
          ? 'bg-blue-600 text-white'
          : 'bg-[#F7F8FA] dark:bg-[#18181B] text-[#111111] dark:text-[#FAFAFA] hover:bg-[#F7F8FA] dark:hover:bg-[#18181B]'
      }`}
    >
      <Icon className="w-4 h-4" />
    </button>
  )
}

/** Result preview with download */
function ResultPreview({ blob, filename, lang, onReset }) {
  const [url, setUrl] = useState(null)

  useEffect(() => {
    if (blob) {
      const u = URL.createObjectURL(blob)
      setUrl(u)
      return () => URL.revokeObjectURL(u)
    }
  }, [blob])

  const download = () => {
    const u = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = u
    a.download = filename
    a.click()
    setTimeout(() => URL.revokeObjectURL(u), 100)
  }

  const labels = {
    en: { success: 'Done!', download: 'Download', startOver: 'Start over' },
    fr: { success: 'Terminé !', download: 'Télécharger', startOver: 'Recommencer' },
    ar: { success: 'تم!', download: 'تحميل', startOver: 'ابدأ من جديد' },
  }[lang]

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center gap-2 p-3 rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 text-green-700 dark:text-green-400 text-sm font-medium">
        <Check className="w-4 h-4 shrink-0" />
        {labels.success}
      </div>
      <EditorCanvas>
        {url && <img src={url} alt={filename} className="max-w-full max-h-[400px] object-contain" />}
      </EditorCanvas>
      <div className="flex gap-3">
        <button onClick={download} className="btn-primary rounded-xl px-5 py-3 text-sm flex-1 flex items-center justify-center gap-2">
          <Download className="w-4 h-4" />
          {labels.download}
        </button>
        <button onClick={onReset} className="btn-ghost rounded-xl px-5 py-3 text-sm border border-[#E5E7EB] dark:border-[#27272A] flex items-center gap-2">
          <RefreshCw className="w-4 h-4" />
          {labels.startOver}
        </button>
      </div>
    </div>
  )
}

/** Loading overlay */
function LoadingOverlay({ label = 'Processing...' }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-[#0A0A0B]/80 backdrop-blur-sm z-10 rounded-xl">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-[#6B7280] dark:text-[#A1A1AA]">{label}</span>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════
   1. RESIZE IMAGE EDITOR
   ═══════════════════════════════════════════════════ */

export function ResizeImageEditor({ file, lang, onReset }) {
  const { url, width: origW, height: origH, loading } = useImageLoader(file)
  const containerRef = useRef(null)
  
  const [zoom, setZoom] = useState(1)
  const [aspectLocked, setAspectLocked] = useState(true)
  const [newWidth, setNewWidth] = useState(0)
  const [newHeight, setNewHeight] = useState(0)
  const [baseW, setBaseW] = useState(0)  // displayed base width
  const [baseH, setBaseH] = useState(0)  // displayed base height
  const [dragging, setDragging] = useState(null) // 'br' | 'bl' | 'tr' | 'tl'
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState(null)
  const aspectRatio = (origW / origH) || 1

  // Initialize display dimensions when image loads
  useEffect(() => {
    if (origW && origH) {
      setNewWidth(origW)
      setNewHeight(origH)
      const maxW = 560
      const maxH = 360
      const scale = Math.min(maxW / origW, maxH / origH, 1)
      setBaseW(Math.round(origW * scale))
      setBaseH(Math.round(origH * scale))
    }
  }, [origW, origH])

  // Pointer drag for resize handles
  const onPointerDown = useCallback((handle, e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragging(handle)
  }, [])

  useEffect(() => {
    if (!dragging) return

    const onMove = (e) => {
      e.preventDefault()
      if (!containerRef.current) return
      const { x, y, rect } = getPointerPos(e, containerRef.current)
      
      const imgLeft = (rect.width - baseW * zoom) / 2
      const imgTop = (rect.height - baseH * zoom) / 2
      const relX = x - imgLeft
      const relY = y - imgTop
      const pxToReal = origW / (baseW * zoom)
      
      let realX = relX * pxToReal
      let realY = relY * pxToReal
      const minDim = 10
      
      if (dragging === 'br' || dragging === 'tr' || dragging === 'bl' || dragging === 'tl') {
        // All corners: compute based on distance from opposite corner
        let w, h
        if (dragging === 'br') {
          w = clamp(realX, minDim, origW)
          h = aspectLocked ? Math.round(w / aspectRatio) : clamp(realY, minDim, origH)
        } else if (dragging === 'bl') {
          w = clamp(origW - realX, minDim, origW)
          h = aspectLocked ? Math.round(w / aspectRatio) : clamp(realY, minDim, origH)
        } else if (dragging === 'tr') {
          w = clamp(realX, minDim, origW)
          h = aspectLocked ? Math.round(w / aspectRatio) : clamp(origH - realY, minDim, origH)
        } else {
          w = clamp(origW - realX, minDim, origW)
          h = aspectLocked ? Math.round(w / aspectRatio) : clamp(origH - realY, minDim, origH)
        }
        setNewWidth(w)
        setNewHeight(h)
      }
    }

    const onUp = () => setDragging(null)

    document.addEventListener('pointermove', onMove)
    document.addEventListener('pointerup', onUp)
    document.addEventListener('touchmove', onMove, { passive: false })
    document.addEventListener('touchend', onUp)
    return () => {
      document.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerup', onUp)
      document.removeEventListener('touchmove', onMove)
      document.removeEventListener('touchend', onUp)
    }
  }, [dragging, baseW, baseH, zoom, origW, origH, aspectLocked, aspectRatio])

  const handleApply = async () => {
    setProcessing(true)
    try {
      const blob = await resizeImage(file, newWidth, newHeight)
      const ext = file.name.split('.').pop()?.split('?')[0] || 'png'
      const filename = `resized-${newWidth}x${newHeight}.${ext}`
      setResult({ blob, filename })
    } catch (err) {
      console.error(err)
    } finally {
      setProcessing(false)
    }
  }

  const handleReset = () => {
    setNewWidth(origW)
    setNewHeight(origH)
    setZoom(1)
    setResult(null)
  }

  const handleFullReset = () => {
    handleReset()
    onReset()
  }

  if (loading) return <LoadingOverlay />
  if (result) return <ResultPreview blob={result.blob} filename={result.filename} lang={lang} onReset={handleFullReset} />

  const labels = {
    en: { resize: 'Apply Resize', reset: 'Reset', lock: 'Lock ratio', unlock: 'Unlock ratio', dims: 'Dimensions' },
    fr: { resize: 'Appliquer', reset: 'Réinitialiser', lock: 'Verrouiller', unlock: 'Déverrouiller', dims: 'Dimensions' },
    ar: { resize: 'تطبيق', reset: 'إعادة تعيين', lock: 'قفل النسبة', unlock: 'فتح النسبة', dims: 'الأبعاد' },
  }[lang]

  const dispW = baseW * zoom
  const dispH = baseH * zoom
  // Scale ratio between new dimensions and displayed size
  const newDispW = dispW * (newWidth / origW)
  const newDispH = dispH * (newHeight / origH)
  const handleSize = 14
  const ho = -handleSize / 2

  return (
    <div className="space-y-4">
      {/* Editor area */}
      <div ref={containerRef} className="relative flex items-center justify-center overflow-hidden rounded-xl border border-[#E5E7EB] dark:border-[#27272A] bg-[#F7F8FA] dark:bg-[#18181B] touch-none" style={{ minHeight: '350px' }}>
        {processing && <LoadingOverlay />}
        {url && (
          <div className="relative" style={{ width: newDispW, height: newDispH }}>
            <img
              src={url}
              alt="preview"
              className="block pointer-events-none select-none"
              style={{ width: newDispW, height: newDispH, objectFit: 'contain' }}
              draggable={false}
            />
            {/* 4 corner handles */}
            {['tl', 'tr', 'bl', 'br'].map(h => {
              const pos = {
                tl: { top: ho, left: ho, cursor: 'nwse-resize' },
                tr: { top: ho, right: ho, cursor: 'nesw-resize' },
                bl: { bottom: ho, left: ho, cursor: 'nesw-resize' },
                br: { bottom: ho, right: ho, cursor: 'nwse-resize' },
              }[h]
              return (
                <div
                  key={h}
                  onPointerDown={(e) => onPointerDown(h, e)}
                  onTouchStart={(e) => onPointerDown(h, e)}
                  className="absolute w-3.5 h-3.5 bg-blue-600 border-2 border-white rounded-sm shadow-md touch-none z-20 hover:scale-125 transition-transform"
                  style={{ ...pos, cursor: pos.cursor }}
                />
              )
            })}
            {/* Dimension label */}
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs font-bold text-blue-600 dark:text-blue-400 tabular-nums bg-white/90 dark:bg-[#111113]/90 px-2 py-0.5 rounded-md whitespace-nowrap z-30">
              {newWidth} × {newHeight} px
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ZoomControls zoom={zoom} setZoom={setZoom} />
        <ToolButton
          icon={aspectLocked ? Lock : Unlock}
          onClick={() => setAspectLocked(!aspectLocked)}
          label={aspectLocked ? labels.unlock : labels.lock}
          active={aspectLocked}
        />
      </div>

      {/* Dimension display */}
      <div className="flex items-center gap-3 p-3 rounded-xl bg-[#F7F8FA] dark:bg-[#18181B] border border-[#E5E7EB] dark:border-[#27272A]">
        <span className="text-sm text-[#6B7280] dark:text-[#A1A1AA]">{labels.dims}:</span>
        <span className="font-bold text-[#111111] dark:text-[#FAFAFA] tabular-nums text-base">{newWidth}</span>
        <span className="text-gray-400">×</span>
        <span className="font-bold text-[#111111] dark:text-[#FAFAFA] tabular-nums text-base">{newHeight}</span>
        <span className="text-xs text-gray-400">px</span>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3">
        <button onClick={handleApply} disabled={processing} className="btn-primary rounded-xl px-5 py-3 text-sm flex-1 flex items-center justify-center gap-2">
          <Check className="w-4 h-4" />
          {labels.resize}
        </button>
        <button onClick={handleReset} className="btn-ghost rounded-xl px-5 py-3 text-sm border border-[#E5E7EB] dark:border-[#27272A] flex items-center gap-2">
          <RotateCcw className="w-4 h-4" />
          {labels.reset}
        </button>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════
   2. CROP IMAGE EDITOR
   ═══════════════════════════════════════════════════ */

export function CropImageEditor({ file, lang, onReset }) {
  const { url, width: origW, height: origH, loading } = useImageLoader(file)
  const containerRef = useRef(null)
  
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [aspectMode, setAspectMode] = useState('free')
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState(null)
  
  // Crop rect in display coordinates
  const [crop, setCrop] = useState({ x: 0, y: 0, w: 0, h: 0 })
  const [dragMode, setDragMode] = useState(null)
  const dragStart = useRef({ mx: 0, my: 0, cx: 0, cy: 0, cw: 0, ch: 0 })

  // Effective dimensions after rotation
  const effW = rotation === 90 || rotation === 270 ? origH : origW
  const effH = rotation === 90 || rotation === 270 ? origW : origH

  const [dispScale, setDispScale] = useState(1)
  
  useEffect(() => {
    if (effW && effH) {
      const maxW = 560
      const maxH = 360
      const s = Math.min(maxW / effW, maxH / effH, 1)
      setDispScale(s)
      const cw = effW * s * 0.8
      const ch = effH * s * 0.8
      setCrop({ x: (effW * s - cw) / 2, y: (effH * s - ch) / 2, w: cw, h: ch })
    }
  }, [effW, effH])

  // Apply aspect ratio when mode changes
  useEffect(() => {
    if (aspectMode === 'free' || !crop.w) return
    const [rx, ry] = aspectMode.split(':').map(Number)
    const targetRatio = rx / ry
    const newH = crop.w / targetRatio
    const maxY = effH * dispScale * zoom - crop.y
    setCrop(c => ({ ...c, h: Math.min(newH, maxY) }))
  }, [aspectMode, crop.w, dispScale, zoom, effH])

  const dispW = effW * dispScale * zoom
  const dispH = effH * dispScale * zoom

  const onPointerDown = useCallback((mode, e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragMode(mode)
    const { x, y } = getPointerPos(e, containerRef.current)
    dragStart.current = { mx: x, my: y, cx: crop.x, cy: crop.y, cw: crop.w, ch: crop.h }
  }, [crop])

  useEffect(() => {
    if (!dragMode) return

    const onMove = (e) => {
      e.preventDefault()
      if (!containerRef.current) return
      const { x, y } = getPointerPos(e, containerRef.current)
      const dx = x - dragStart.current.mx
      const dy = y - dragStart.current.my
      
      let { cx, cy, cw, ch } = dragStart.current
      const maxX = dispW
      const maxY = dispH
      const minSize = 20

      if (dragMode === 'move') {
        cx = clamp(cx + dx, 0, maxX - cw)
        cy = clamp(cy + dy, 0, maxY - ch)
      } else if (dragMode === 'se') {
        cw = clamp(cw + dx, minSize, maxX - cx)
        ch = clamp(ch + dy, minSize, maxY - cy)
      } else if (dragMode === 'sw') {
        const newX = clamp(cx + dx, 0, cx + cw - minSize)
        cw = cx + cw - newX
        cx = newX
        ch = clamp(ch + dy, minSize, maxY - cy)
      } else if (dragMode === 'ne') {
        const newY = clamp(cy + dy, 0, cy + ch - minSize)
        ch = cy + ch - newY
        cy = newY
        cw = clamp(cw + dx, minSize, maxX - cx)
      } else if (dragMode === 'nw') {
        const newX = clamp(cx + dx, 0, cx + cw - minSize)
        const newY = clamp(cy + dy, 0, cy + ch - minSize)
        cw = cx + cw - newX
        ch = cy + ch - newY
        cx = newX
        cy = newY
      } else if (dragMode === 'n') {
        const newY = clamp(cy + dy, 0, cy + ch - minSize)
        ch = cy + ch - newY
        cy = newY
      } else if (dragMode === 's') {
        ch = clamp(ch + dy, minSize, maxY - cy)
      } else if (dragMode === 'e') {
        cw = clamp(cw + dx, minSize, maxX - cx)
      } else if (dragMode === 'w') {
        const newX = clamp(cx + dx, 0, cx + cw - minSize)
        cw = cx + cw - newX
        cx = newX
      }

      // Apply aspect ratio lock for non-free modes
      if (aspectMode !== 'free' && dragMode !== 'move') {
        const [rx, ry] = aspectMode.split(':').map(Number)
        const ratio = rx / ry
        // Prioritize width-based adjustment
        const targetH = cw / ratio
        if (targetH + cy <= maxY) {
          ch = targetH
        } else {
          ch = maxY - cy
          cw = ch * ratio
        }
      }

      setCrop({ x: cx, y: cy, w: cw, h: ch })
    }

    const onUp = () => setDragMode(null)

    document.addEventListener('pointermove', onMove)
    document.addEventListener('pointerup', onUp)
    document.addEventListener('touchmove', onMove, { passive: false })
    document.addEventListener('touchend', onUp)
    return () => {
      document.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerup', onUp)
      document.removeEventListener('touchmove', onMove)
      document.removeEventListener('touchend', onUp)
    }
  }, [dragMode, dispW, dispH, aspectMode])

  const handleApply = async () => {
    setProcessing(true)
    try {
      const realScale = 1 / (dispScale * zoom)
      const realX = crop.x * realScale
      const realY = crop.y * realScale
      const realW = crop.w * realScale
      const realH = crop.h * realScale
      const blob = await cropAndRotate(file, realX, realY, realW, realH, rotation)
      const ext = file.name.split('.').pop()?.split('?')[0] || 'png'
      const filename = `cropped.${ext}`
      setResult({ blob, filename })
    } catch (err) {
      console.error(err)
    } finally {
      setProcessing(false)
    }
  }

  const handleReset = () => {
    setRotation(0)
    setAspectMode('free')
    setZoom(1)
    const cw = effW * dispScale * 0.8
    const ch = effH * dispScale * 0.8
    setCrop({ x: (effW * dispScale - cw) / 2, y: (effH * dispScale - ch) / 2, w: cw, h: ch })
    setResult(null)
  }

  const handleFullReset = () => {
    handleReset()
    onReset()
  }

  if (loading) return <LoadingOverlay />
  if (result) return <ResultPreview blob={result.blob} filename={result.filename} lang={lang} onReset={handleFullReset} />

  const labels = {
    en: { apply: 'Apply Crop', reset: 'Reset', free: 'Free', rotateL: 'Rotate left', rotateR: 'Rotate right' },
    fr: { apply: 'Appliquer', reset: 'Réinitialiser', free: 'Libre', rotateL: 'Pivoter gauche', rotateR: 'Pivoter droite' },
    ar: { apply: 'تطبيق القص', reset: 'إعادة تعيين', free: 'حر', rotateL: 'تدوير يسار', rotateR: 'تدوير يمين' },
  }[lang]

  const aspectPresets = [
    { id: 'free', label: labels.free },
    { id: '1:1', label: '1:1' },
    { id: '4:3', label: '4:3' },
    { id: '16:9', label: '16:9' },
    { id: '3:2', label: '3:2' },
  ]

  const realScale = 1 / (dispScale * zoom)
  const realCropW = Math.round(crop.w * realScale)
  const realCropH = Math.round(crop.h * realScale)

  return (
    <div className="space-y-4">
      {/* Editor area */}
      <div ref={containerRef} className="relative flex items-center justify-center overflow-hidden rounded-xl border border-[#E5E7EB] dark:border-[#27272A] bg-[#F7F8FA] dark:bg-[#18181B] touch-none" style={{ minHeight: '350px' }}>
        {processing && <LoadingOverlay />}
        {url && (
          <div className="relative" style={{ width: dispW, height: dispH }}>
            {/* Image with rotation — we use a wrapper for rotation */}
            <div
              className="absolute inset-0"
              style={{
                transform: `rotate(${rotation}deg)`,
                transformOrigin: 'center center',
                width: rotation === 90 || rotation === 270 ? dispH : dispW,
                height: rotation === 90 || rotation === 270 ? dispW : dispH,
                left: rotation === 90 || rotation === 270 ? (dispW - dispH) / 2 : 0,
                top: rotation === 90 || rotation === 270 ? (dispH - dispW) / 2 : 0,
              }}
            >
              <img
                src={url}
                alt="preview"
                className="block pointer-events-none select-none w-full h-full"
                style={{ objectFit: 'fill' }}
                draggable={false}
              />
            </div>
            
            {/* Crop rectangle with dark overlay outside */}
            <div
              className="absolute border-2 border-blue-500 cursor-move touch-none z-10"
              style={{
                left: crop.x, top: crop.y,
                width: crop.w, height: crop.h,
                boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)',
              }}
              onPointerDown={(e) => onPointerDown('move', e)}
              onTouchStart={(e) => onPointerDown('move', e)}
            >
              {/* Rule of thirds */}
              <div className="absolute top-1/3 left-0 right-0 border-t border-white/30 pointer-events-none" />
              <div className="absolute top-2/3 left-0 right-0 border-t border-white/30 pointer-events-none" />
              <div className="absolute left-1/3 top-0 bottom-0 border-l border-white/30 pointer-events-none" />
              <div className="absolute left-2/3 top-0 bottom-0 border-l border-white/30 pointer-events-none" />

              {/* 8 resize handles */}
              {[
                { id: 'nw', style: { top: -7, left: -7, cursor: 'nwse-resize' } },
                { id: 'n', style: { top: -7, left: '50%', marginLeft: -7, cursor: 'ns-resize' } },
                { id: 'ne', style: { top: -7, right: -7, cursor: 'nesw-resize' } },
                { id: 'e', style: { top: '50%', right: -7, marginTop: -7, cursor: 'ew-resize' } },
                { id: 'se', style: { bottom: -7, right: -7, cursor: 'nwse-resize' } },
                { id: 's', style: { bottom: -7, left: '50%', marginLeft: -7, cursor: 'ns-resize' } },
                { id: 'sw', style: { bottom: -7, left: -7, cursor: 'nesw-resize' } },
                { id: 'w', style: { top: '50%', left: -7, marginTop: -7, cursor: 'ew-resize' } },
              ].map(h => (
                <div
                  key={h.id}
                  onPointerDown={(e) => onPointerDown(h.id, e)}
                  onTouchStart={(e) => onPointerDown(h.id, e)}
                  className="absolute w-3.5 h-3.5 bg-white border-2 border-blue-500 rounded-sm shadow-md touch-none z-20 hover:scale-125 transition-transform"
                  style={h.style}
                />
              ))}
            </div>
            
            {/* Dimension label */}
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs font-bold text-blue-600 dark:text-blue-400 tabular-nums bg-white/90 dark:bg-[#111113]/90 px-2 py-0.5 rounded-md whitespace-nowrap z-30">
              {realCropW} × {realCropH} px
            </div>
          </div>
        )}
      </div>

      {/* Aspect ratio presets */}
      <div className="flex flex-wrap gap-2">
        {aspectPresets.map(p => (
          <button
            key={p.id}
            onClick={() => setAspectMode(p.id)}
            className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors touch-manipulation ${
              aspectMode === p.id
                ? 'bg-blue-600 text-white'
                : 'bg-[#F7F8FA] dark:bg-[#18181B] text-[#6B7280] dark:text-[#A1A1AA] hover:bg-blue-50 dark:hover:bg-blue-950/30'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Controls row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ZoomControls zoom={zoom} setZoom={setZoom} min={0.5} max={3} />
        <div className="flex items-center gap-2">
          <ToolButton icon={RotateCcw} onClick={() => setRotation(r => (r - 90 + 360) % 360)} label={labels.rotateL} />
          <ToolButton icon={RotateCw} onClick={() => setRotation(r => (r + 90) % 360)} label={labels.rotateR} />
        </div>
      </div>

      {/* Apply / Reset */}
      <div className="flex gap-3">
        <button onClick={handleApply} disabled={processing} className="btn-primary rounded-xl px-5 py-3 text-sm flex-1 flex items-center justify-center gap-2">
          <Crop className="w-4 h-4" />
          {labels.apply}
        </button>
        <button onClick={handleReset} className="btn-ghost rounded-xl px-5 py-3 text-sm border border-[#E5E7EB] dark:border-[#27272A] flex items-center gap-2">
          <RotateCcw className="w-4 h-4" />
          {labels.reset}
        </button>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════
   3. COMPRESS IMAGE EDITOR
   ═══════════════════════════════════════════════════ */

export function CompressImageEditor({ file, lang, onReset }) {
  const { url, width: origW, height: origH, loading } = useImageLoader(file)
  const [quality, setQuality] = useState(60)
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState(null)
  const [estimatedSize, setEstimatedSize] = useState(null)

  // Estimate output size based on quality
  useEffect(() => {
    if (!file) return
    const factor = (quality / 100) * 0.85 + 0.05
    setEstimatedSize(Math.round(file.size * factor))
  }, [quality, file])

  const handleCompress = async () => {
    setProcessing(true)
    try {
      const blob = await compressImage(file, quality / 100)
      const filename = getOutputFilename(file.name, 'jpg')
      setResult({ blob, filename })
    } catch (err) {
      console.error(err)
    } finally {
      setProcessing(false)
    }
  }

  const handleReset = () => {
    setResult(null)
    onReset()
  }

  if (loading) return <LoadingOverlay />
  if (result) return <ResultPreview blob={result.blob} filename={result.filename} lang={lang} onReset={handleReset} />

  const labels = {
    en: { original: 'Original', quality: 'Quality', estimated: 'Estimated size', compress: 'Compress', low: 'Smallest', high: 'Best quality', reduction: 'Reduction' },
    fr: { original: 'Original', quality: 'Qualité', estimated: 'Taille estimée', compress: 'Compresser', low: 'Plus petit', high: 'Meilleure qualité', reduction: 'Réduction' },
    ar: { original: 'الأصلي', quality: 'الجودة', estimated: 'الحجم المقدر', compress: 'ضغط', low: 'أصغر حجم', high: 'أفضل جودة', reduction: 'التقليل' },
  }[lang]

  const reduction = estimatedSize ? Math.max(0, Math.round((1 - estimatedSize / file.size) * 100)) : 0

  return (
    <div className="space-y-4">
      {/* Original preview */}
      <EditorCanvas>
        {url && <img src={url} alt="original" className="max-w-full max-h-[280px] object-contain" />}
      </EditorCanvas>

      {/* Original info */}
      <div className="flex items-center justify-between p-3 rounded-xl bg-[#F7F8FA] dark:bg-[#18181B] border border-[#E5E7EB] dark:border-[#27272A]">
        <span className="text-sm text-[#6B7280] dark:text-[#A1A1AA]">{labels.original}</span>
        <span className="text-sm font-bold text-[#111111] dark:text-[#FAFAFA]">{formatBytes(file.size)}</span>
      </div>

      {/* Quality slider */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-[#111111] dark:text-[#FAFAFA]">{labels.quality}</label>
          <span className="text-sm font-bold text-blue-600 dark:text-blue-400 tabular-nums">{quality}%</span>
        </div>
        <input
          type="range"
          min="5"
          max="100"
          value={quality}
          onChange={e => setQuality(parseInt(e.target.value))}
          className="w-full accent-blue-600 touch-manipulation"
        />
        <div className="flex justify-between text-xs text-gray-400">
          <span>{labels.low}</span>
          <span>{labels.high}</span>
        </div>
      </div>

      {/* Estimated output + reduction */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900 text-center">
          <p className="text-xs text-gray-500 mb-1">{labels.estimated}</p>
          <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{formatBytes(estimatedSize || 0)}</p>
        </div>
        <div className="p-3 rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-100 dark:border-green-900 text-center">
          <p className="text-xs text-gray-500 mb-1">{labels.reduction}</p>
          <p className="text-lg font-bold text-green-600 dark:text-green-400">~{reduction}%</p>
        </div>
      </div>

      {/* Compress button */}
      <button onClick={handleCompress} disabled={processing} className="btn-primary rounded-xl px-5 py-3 text-sm w-full flex items-center justify-center gap-2">
        {processing ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <Check className="w-4 h-4" />
            {labels.compress}
          </>
        )}
      </button>
    </div>
  )
}

/* ═══════════════════════════════════════════════════
   4. IMAGE CONVERTER EDITOR
   ═══════════════════════════════════════════════════ */

export function ImageConvertEditor({ file, lang, targetExt, outputMime, onReset }) {
  const { url, loading } = useImageLoader(file)
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState(null)
  const [bgColor, setBgColor] = useState('#FFFFFF')
  
  const isPngToJpg = targetExt === 'jpg' && file?.type === 'image/png'

  const handleConvert = async () => {
    setProcessing(true)
    try {
      let blob
      if (isPngToJpg && bgColor !== 'transparent') {
        blob = await convertImageWithBackground(file, outputMime, bgColor)
      } else {
        blob = await convertImage(file, outputMime)
      }
      const filename = getOutputFilename(file.name, targetExt)
      setResult({ blob, filename })
    } catch (err) {
      console.error(err)
    } finally {
      setProcessing(false)
    }
  }

  const handleReset = () => {
    setResult(null)
    onReset()
  }

  if (loading) return <LoadingOverlay />
  if (result) return <ResultPreview blob={result.blob} filename={result.filename} lang={lang} onReset={handleReset} />

  const sourceFormat = file?.type?.split('/')[1]?.toUpperCase() || 'IMG'
  const targetFormatLabel = targetExt.toUpperCase()

  const labels = {
    en: { source: 'Source', target: 'Target', convert: 'Convert', bg: 'Background', white: 'White', black: 'Black', transparent: 'Keep transparent', note: 'JPG does not support transparency. Choose a background color for transparent areas.' },
    fr: { source: 'Source', target: 'Cible', convert: 'Convertir', bg: 'Arrière-plan', white: 'Blanc', black: 'Noir', transparent: 'Transparent', note: 'JPG ne supporte pas la transparence. Choisissez une couleur de fond.' },
    ar: { source: 'المصدر', target: 'الهدف', convert: 'تحويل', bg: 'الخلفية', white: 'أبيض', black: 'أسود', transparent: 'شفاف', note: 'JPG لا يدعم الشفافية. اختر لون الخلفية.' },
  }[lang]

  return (
    <div className="space-y-4">
      {/* Preview */}
      <EditorCanvas>
        {url && <img src={url} alt="preview" className="max-w-full max-h-[280px] object-contain" />}
      </EditorCanvas>

      {/* Format badges */}
      <div className="flex items-center justify-center gap-3">
        <div className="px-4 py-2 rounded-xl bg-[#F7F8FA] dark:bg-[#18181B] text-sm font-bold text-[#111111] dark:text-[#FAFAFA]">
          {sourceFormat}
        </div>
        <span className="text-lg text-gray-400">→</span>
        <div className="px-4 py-2 rounded-xl bg-blue-600 text-sm font-bold text-white">
          {targetFormatLabel}
        </div>
      </div>

      {/* PNG → JPG: background selector */}
      {isPngToJpg && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-[#111111] dark:text-[#FAFAFA]">{labels.bg}</label>
          <div className="flex gap-2">
            <button
              onClick={() => setBgColor('#FFFFFF')}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors touch-manipulation ${
                bgColor === '#FFFFFF' ? 'bg-blue-600 text-white' : 'bg-[#F7F8FA] dark:bg-[#18181B] text-[#6B7280] dark:text-[#A1A1AA]'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-white border border-gray-300" />
                {labels.white}
              </span>
            </button>
            <button
              onClick={() => setBgColor('#000000')}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors touch-manipulation ${
                bgColor === '#000000' ? 'bg-blue-600 text-white' : 'bg-[#F7F8FA] dark:bg-[#18181B] text-[#6B7280] dark:text-[#A1A1AA]'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-black" />
                {labels.black}
              </span>
            </button>
          </div>
          <p className="text-xs text-gray-400">{labels.note}</p>
        </div>
      )}

      {/* Convert button */}
      <button onClick={handleConvert} disabled={processing} className="btn-primary rounded-xl px-5 py-3 text-sm w-full flex items-center justify-center gap-2">
        {processing ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <Check className="w-4 h-4" />
            {labels.convert} → {targetFormatLabel}
          </>
        )}
      </button>
    </div>
  )
}

/* ═══════════════════════════════════════════════════
   SHARED UPLOAD ZONE
   ═══════════════════════════════════════════════════ */

export function ImageUploadZone({ onFile, lang, hint }) {
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState(null)
  const inputRef = useRef(null)

  const ACCEPTED = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']

  const validate = (file) => {
    if (!file) return false
    if (!ACCEPTED.includes(file.type)) {
      setError(lang === 'ar' ? 'صيغة غير مدعومة. استخدم JPG أو PNG أو WEBP أو GIF' : lang === 'fr' ? 'Format non supporté. Utilisez JPG, PNG, WEBP ou GIF' : 'Unsupported format. Use JPG, PNG, WEBP, or GIF')
      return false
    }
    if (file.size > 50 * 1024 * 1024) {
      setError(lang === 'ar' ? 'حجم الملف يتجاوز 50 ميجابايت' : lang === 'fr' ? 'Fichier trop volumineux (max 50 Mo)' : 'File too large (max 50MB)')
      return false
    }
    setError(null)
    return true
  }

  const handleFiles = (files) => {
    const file = files[0]
    if (validate(file)) onFile(file)
  }

  const labels = {
    en: { drop: 'Drop image here', or: 'or', choose: 'Choose Image', formats: 'JPG, PNG, WEBP, GIF · Max 50MB' },
    fr: { drop: "Déposez l'image", or: 'ou', choose: 'Choisir une image', formats: 'JPG, PNG, WEBP, GIF · Max 50 Mo' },
    ar: { drop: 'أفلت الصورة هنا', or: 'أو', choose: 'اختر صورة', formats: 'JPG, PNG, WEBP, GIF · بحد أقصى 50 ميجابايت' },
  }[lang]

  return (
    <div className="space-y-3">
      <div
        className={`upload-box p-8 md:p-12 text-center cursor-pointer transition-all ${dragOver ? 'dragover' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files) }}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter') inputRef.current?.click() }}
      >
        <input ref={inputRef} type="file" className="hidden" accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
          onChange={(e) => handleFiles(e.target.files)} />
        <div className="flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center">
            <ImageIcon className="w-7 h-7 text-blue-600 dark:text-blue-400" strokeWidth={1.6} />
          </div>
          <p className="text-base font-bold text-[#111111] dark:text-[#FAFAFA]">{labels.drop}</p>
          <p className="text-sm text-[#6B7280] dark:text-[#A1A1AA]">{labels.or}</p>
          <span className="btn-primary rounded-xl px-5 py-2.5 text-sm">{labels.choose}</span>
          <p className="text-xs text-[#6B7280] dark:text-[#A1A1AA] mt-1">{hint || labels.formats}</p>
        </div>
      </div>
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}
    </div>
  )
}
