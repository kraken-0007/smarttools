/**
 * RegionTools.jsx — Image tools with interactive region selection.
 *
 * Shared RegionToolEditor + 6 tools:
 *   PixelateEditor, SharpenEditor, InvertEditor,
 *   ColorAdjustEditor, RedactEditor, EraseAreaEditor
 *
 * Features:
 *   - Interactive rectangular selection with mouse + touch
 *   - Multiple selectable regions
 *   - Move + resize existing selections
 *   - "Apply to Full Image" toggle
 *   - Effect applied ONLY inside selected regions
 *   - Pixels outside selection remain unchanged
 *   - Live preview
 *   - Undo/Redo
 *   - Download + Reset
 *   - Dark mode, RTL, mobile/touch
 */

import { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react'
import {
  Download, Check, Loader2, Plus, Trash2, X,
  Square, Maximize2, Undo2, Redo2, RefreshCw,
} from 'lucide-react'
import { downloadBlob, getOutputFilename } from '../lib/processors/image.js'
import { EditorHistoryToolbar, useEditorHistory } from './EditorHistory'

/* ═══ Shared image loader ═══ */
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

/* ═══ Multi-language labels ═══ */
export function getLabels(lang) {
  const base = {
    en: {
      selectArea: 'Select Area', fullImage: 'Apply to Full Image',
      addArea: 'Add Area', clearAll: 'Clear All', delete: 'Delete',
      reset: 'Reset', apply: 'Apply & Download', preview: 'Preview',
      processing: 'Processing...', complete: 'Complete!', startOver: 'Start over',
      download: 'Download', selections: 'Selections', area: 'Area',
      noSelection: 'Draw on the image to select an area, or use "Apply to Full Image"',
      dragHint: 'Click and drag on the image to create a selection',
      strength: 'Strength', blockSize: 'Block Size', amount: 'Amount',
      hue: 'Hue', temperature: 'Temperature', tint: 'Tint', color: 'Color',
      regions: 'regions', applyToRegions: 'Effect applied to selected regions only',
      applyToFull: 'Effect applied to entire image',
    },
    fr: {
      selectArea: 'Sélectionner une zone', fullImage: "Appliquer à toute l'image",
      addArea: 'Ajouter une zone', clearAll: 'Tout effacer', delete: 'Supprimer',
      reset: 'Réinitialiser', apply: 'Appliquer & Télécharger', preview: 'Aperçu',
      processing: 'Traitement...', complete: 'Terminé !', startOver: 'Recommencer',
      download: 'Télécharger', selections: 'Sélections', area: 'Zone',
      noSelection: "Dessinez sur l'image pour sélectionner une zone, ou utilisez « Appliquer à toute l'image »",
      dragHint: 'Cliquez et faites glisser sur l\'image pour créer une sélection',
      strength: 'Intensité', blockSize: 'Taille des blocs', amount: 'Quantité',
      hue: 'Teinte', temperature: 'Température', tint: 'Teinte', color: 'Couleur',
      regions: 'zones', applyToRegions: 'Effet appliqué uniquement aux zones sélectionnées',
      applyToFull: "Effet appliqué à toute l'image",
    },
    ar: {
      selectArea: 'تحديد منطقة', fullImage: 'تطبيق على الصورة بالكامل',
      addArea: 'إضافة منطقة', clearAll: 'مسح الكل', delete: 'حذف',
      reset: 'إعادة تعيين', apply: 'تطبيق وتحميل', preview: 'معاينة',
      processing: 'جارٍ المعالجة...', complete: 'اكتملت المعالجة!', startOver: 'ابدأ من جديد',
      download: 'تحميل', selections: 'تحديدات', area: 'منطقة',
      noSelection: 'ارسم على الصورة لتحديد منطقة، أو استخدم "تطبيق على الصورة بالكامل"',
      dragHint: 'انقر واسحب على الصورة لإنشاء تحديد',
      strength: 'القوة', blockSize: 'حجم الكتلة', amount: 'الكمية',
      hue: 'درجة اللون', temperature: 'درجة الحرارة', tint: 'الصبغة', color: 'اللون',
      regions: 'مناطق', applyToRegions: 'التأثير مطبق على المناطق المحددة فقط',
      applyToFull: 'التأثير مطبق على الصورة بالكامل',
    },
  }
  return base[lang] || base.en
}

/* ═══ Color helpers ═══ */
function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h, s, l = (max + min) / 2
  if (max === min) { h = s = 0 }
  else {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break
      case g: h = (b - r) / d + 2; break
      case b: h = (r - g) / d + 4; break
    }
    h /= 6
  }
  return [h, s, l]
}

function hslToRgb(h, s, l) {
  let r, g, b
  if (s === 0) { r = g = b = l }
  else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1; if (t > 1) t -= 1
      if (t < 1/6) return p + (q - p) * 6 * t
      if (t < 1/2) return q
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6
      return p
    }
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q
    r = hue2rgb(p, q, h + 1/3)
    g = hue2rgb(p, q, h)
    b = hue2rgb(p, q, h - 1/3)
  }
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)]
}

function hexToRgb(hex) {
  const m = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i)
  return m ? { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) } : { r: 0, g: 0, b: 0 }
}

/* ═══ Effect functions ═══ */

// Pixelate
function pixelateRegion(ctx, region, params) {
  const { blockSize = 10 } = params
  let { x, y, w, h } = region
  x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h)
  if (w < 2 || h < 2) return
  const bs = Math.max(2, Math.min(blockSize, Math.floor(w / 2), Math.floor(h / 2)))
  const tempCanvas = document.createElement('canvas')
  tempCanvas.width = w; tempCanvas.height = h
  const tctx = tempCanvas.getContext('2d')
  tctx.imageSmoothingEnabled = true
  tctx.drawImage(ctx.canvas, x, y, w, h, 0, 0, w, h)
  const smallW = Math.max(1, Math.ceil(w / bs))
  const smallH = Math.max(1, Math.ceil(h / bs))
  const smallCanvas = document.createElement('canvas')
  smallCanvas.width = smallW; smallCanvas.height = smallH
  const sctx = smallCanvas.getContext('2d')
  sctx.imageSmoothingEnabled = false
  sctx.drawImage(tempCanvas, 0, 0, smallW, smallH)
  tctx.imageSmoothingEnabled = false
  tctx.clearRect(0, 0, w, h)
  tctx.drawImage(smallCanvas, 0, 0, smallW, smallH, 0, 0, w, h)
  ctx.drawImage(tempCanvas, 0, 0, w, h, x, y, w, h)
}

function pixelateFull(ctx, imageData, params) {
  const { blockSize = 10 } = params
  const { width, height, data } = imageData
  const bs = Math.max(2, blockSize)
  for (let y = 0; y < height; y += bs) {
    for (let x = 0; x < width; x += bs) {
      const cx = Math.min(x + Math.floor(bs / 2), width - 1)
      const cy = Math.min(y + Math.floor(bs / 2), height - 1)
      const idx = (cy * width + cx) * 4
      for (let dy = 0; dy < bs && y + dy < height; dy++) {
        for (let dx = 0; dx < bs && x + dx < width; dx++) {
          const i = ((y + dy) * width + (x + dx)) * 4
          data[i] = data[idx]; data[i+1] = data[idx+1]; data[i+2] = data[idx+2]
        }
      }
    }
  }
}

// Sharpen
function sharpenRegion(ctx, region, params) {
  const { amount = 50 } = params
  let { x, y, w, h } = region
  x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h)
  if (w < 3 || h < 3) return
  const tempCanvas = document.createElement('canvas')
  tempCanvas.width = w; tempCanvas.height = h
  const tctx = tempCanvas.getContext('2d')
  tctx.drawImage(ctx.canvas, x, y, w, h, 0, 0, w, h)
  const imageData = tctx.getImageData(0, 0, w, h)
  const data = imageData.data
  const output = new Uint8ClampedArray(data)
  const strength = amount / 100
  for (let py = 1; py < h - 1; py++) {
    for (let px = 1; px < w - 1; px++) {
      for (let c = 0; c < 3; c++) {
        let val = 0, ki = 0
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const idx = ((py + ky) * w + (px + kx)) * 4 + c
            const kernel = [0, -strength, 0, -strength, 1 + 4 * strength, -strength, 0, -strength, 0]
            val += data[idx] * kernel[ki++]
          }
        }
        output[(py * w + px) * 4 + c] = clamp(val, 0, 255)
      }
    }
  }
  imageData.data.set(output)
  tctx.putImageData(imageData, 0, 0)
  ctx.drawImage(tempCanvas, 0, 0, w, h, x, y, w, h)
}

function sharpenFull(ctx, imageData, params) {
  const { amount = 50 } = params
  const { width, height, data } = imageData
  const output = new Uint8ClampedArray(data)
  const strength = amount / 100
  const kernel = [0, -strength, 0, -strength, 1 + 4 * strength, -strength, 0, -strength, 0]
  for (let py = 1; py < height - 1; py++) {
    for (let px = 1; px < width - 1; px++) {
      for (let c = 0; c < 3; c++) {
        let val = 0, ki = 0
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            val += data[((py + ky) * width + (px + kx)) * 4 + c] * kernel[ki++]
          }
        }
        output[(py * width + px) * 4 + c] = clamp(val, 0, 255)
      }
    }
  }
  imageData.data.set(output)
}

// Invert
function invertRegion(ctx, region, params) {
  let { x, y, w, h } = region
  x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h)
  if (w < 1 || h < 1) return
  const imageData = ctx.getImageData(x, y, w, h)
  const data = imageData.data
  for (let i = 0; i < data.length; i += 4) {
    data[i] = 255 - data[i]; data[i+1] = 255 - data[i+1]; data[i+2] = 255 - data[i+2]
  }
  ctx.putImageData(imageData, x, y)
}

function invertFull(ctx, imageData, params) {
  const data = imageData.data
  for (let i = 0; i < data.length; i += 4) {
    data[i] = 255 - data[i]; data[i+1] = 255 - data[i+1]; data[i+2] = 255 - data[i+2]
  }
}

// Color adjustment
function colorAdjustRegion(ctx, region, params) {
  const { hue = 0, temperature = 0, tint = 0 } = params
  let { x, y, w, h } = region
  x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h)
  if (w < 1 || h < 1) return
  const tempCanvas = document.createElement('canvas')
  tempCanvas.width = w; tempCanvas.height = h
  const tctx = tempCanvas.getContext('2d')
  tctx.drawImage(ctx.canvas, x, y, w, h, 0, 0, w, h)
  const imageData = tctx.getImageData(0, 0, w, h)
  const data = imageData.data
  for (let i = 0; i < data.length; i += 4) {
    let r = data[i], g = data[i+1], b = data[i+2]
    r = clamp(r + temperature, 0, 255)
    b = clamp(b - temperature, 0, 255)
    g = clamp(g + tint, 0, 255)
    if (hue !== 0) {
      const hsl = rgbToHsl(r, g, b)
      hsl[0] = (hsl[0] + hue / 360 + 1) % 1
      const rgb = hslToRgb(hsl[0], hsl[1], hsl[2])
      r = rgb[0]; g = rgb[1]; b = rgb[2]
    }
    data[i] = r; data[i+1] = g; data[i+2] = b
  }
  tctx.putImageData(imageData, 0, 0)
  ctx.drawImage(tempCanvas, 0, 0, w, h, x, y, w, h)
}

function colorAdjustFull(ctx, imageData, params) {
  const { hue = 0, temperature = 0, tint = 0 } = params
  const data = imageData.data
  for (let i = 0; i < data.length; i += 4) {
    let r = data[i], g = data[i+1], b = data[i+2]
    r = clamp(r + temperature, 0, 255)
    b = clamp(b - temperature, 0, 255)
    g = clamp(g + tint, 0, 255)
    if (hue !== 0) {
      const hsl = rgbToHsl(r, g, b)
      hsl[0] = (hsl[0] + hue / 360 + 1) % 1
      const rgb = hslToRgb(hsl[0], hsl[1], hsl[2])
      r = rgb[0]; g = rgb[1]; b = rgb[2]
    }
    data[i] = r; data[i+1] = g; data[i+2] = b
  }
}

// Redact
function redactRegion(ctx, region, params) {
  const { color = '#000000' } = params
  let { x, y, w, h } = region
  x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h)
  ctx.fillStyle = color
  ctx.fillRect(x, y, w, h)
}

function redactFull(ctx, imageData, params) {
  const { color = '#000000' } = params
  const data = imageData.data
  const rgb = hexToRgb(color)
  for (let i = 0; i < data.length; i += 4) {
    data[i] = rgb.r; data[i+1] = rgb.g; data[i+2] = rgb.b
  }
}

// Erase
function eraseRegion(ctx, region, params) {
  const { color = '#ffffff' } = params
  let { x, y, w, h } = region
  x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h)
  ctx.fillStyle = color
  ctx.fillRect(x, y, w, h)
}

function eraseFull(ctx, imageData, params) {
  const { color = '#ffffff' } = params
  const data = imageData.data
  const rgb = hexToRgb(color)
  for (let i = 0; i < data.length; i += 4) {
    data[i] = rgb.r; data[i+1] = rgb.g; data[i+2] = rgb.b
  }
}

/* ═══ Region Selector Canvas ═══ */
function SelectionCanvas({
  imgWidth, imgHeight, displayWidth, displayHeight,
  selections, setSelections, mode, lang,
}) {
  const canvasRef = useRef(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [dragStart, setDragStart] = useState(null)
  const [activeIndex, setActiveIndex] = useState(null)
  const [dragMode, setDragMode] = useState(null)
  const [resizeStart, setResizeStart] = useState(null)

  const scaleX = imgWidth / displayWidth
  const scaleY = imgHeight / displayHeight

  const toImageCoords = useCallback((dx, dy) => ({
    x: Math.round(dx * scaleX), y: Math.round(dy * scaleY),
  }), [scaleX, scaleY])

  const toDisplayCoords = useCallback((ix, iy) => ({
    x: ix / scaleX, y: iy / scaleY,
  }), [scaleX, scaleY])

  const getPointerPos = useCallback((e) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    const cx = e.touches ? e.touches[0].clientX : e.clientX
    const cy = e.touches ? e.touches[0].clientY : e.clientY
    return { x: clamp(cx - rect.left, 0, rect.width), y: clamp(cy - rect.top, 0, rect.height) }
  }, [])

  const handlePointerDown = useCallback((e) => {
    if (mode === 'full') return
    e.preventDefault()
    const pos = getPointerPos(e)

    // Check resize handles on active selection
    if (activeIndex !== null && selections[activeIndex]) {
      const sel = selections[activeIndex]
      const dx = sel.x / scaleX, dy = sel.y / scaleY
      const dw = sel.w / scaleX, dh = sel.h / scaleY
      const hs = 10
      const corners = [
        { name: 'resize-tl', x: dx, y: dy },
        { name: 'resize-tr', x: dx + dw, y: dy },
        { name: 'resize-bl', x: dx, y: dy + dh },
        { name: 'resize-br', x: dx + dw, y: dy + dh },
      ]
      for (const c of corners) {
        if (Math.abs(pos.x - c.x) < hs && Math.abs(pos.y - c.y) < hs) {
          setDragMode(c.name)
          setResizeStart({ ...sel, pos })
          return
        }
      }
      // Check inside active → move
      if (pos.x >= dx && pos.x <= dx + dw && pos.y >= dy && pos.y <= dy + dh) {
        setDragMode('move')
        setDragStart({ pos, sel: { ...sel } })
        return
      }
    }

    // Check inside any selection → move
    for (let i = selections.length - 1; i >= 0; i--) {
      const sel = selections[i]
      const dx = sel.x / scaleX, dy = sel.y / scaleY
      const dw = sel.w / scaleX, dh = sel.h / scaleY
      if (pos.x >= dx && pos.x <= dx + dw && pos.y >= dy && pos.y <= dy + dh) {
        setActiveIndex(i)
        setDragMode('move')
        setDragStart({ pos, sel: { ...sel } })
        return
      }
    }

    // Start new selection
    setActiveIndex(null)
    setIsDrawing(true)
    setDragMode('create')
    const imgPos = toImageCoords(pos.x, pos.y)
    setSelections(prev => [...prev, { x: imgPos.x, y: imgPos.y, w: 0, h: 0 }])
    setActiveIndex(selections.length)
    setDragStart({ pos })
  }, [mode, selections, activeIndex, getPointerPos, toImageCoords, setSelections, scaleX, scaleY])

  const handlePointerMove = useCallback((e) => {
    if (mode === 'full' || !dragMode) return
    e.preventDefault()
    const pos = getPointerPos(e)

    if (dragMode === 'create' && isDrawing) {
      const start = dragStart.pos
      const imgStart = toImageCoords(start.x, start.y)
      const imgEnd = toImageCoords(pos.x, pos.y)
      setSelections(prev => {
        const next = [...prev]
        const idx = activeIndex
        if (idx !== null && next[idx]) {
          next[idx] = {
            x: Math.min(imgStart.x, imgEnd.x),
            y: Math.min(imgStart.y, imgEnd.y),
            w: Math.abs(imgEnd.x - imgStart.x),
            h: Math.abs(imgEnd.y - imgStart.y),
          }
        }
        return next
      })
    } else if (dragMode === 'move' && dragStart) {
      const dx = (pos.x - dragStart.pos.x) * scaleX
      const dy = (pos.y - dragStart.pos.y) * scaleY
      setSelections(prev => {
        const next = [...prev]
        if (activeIndex !== null && next[activeIndex]) {
          next[activeIndex] = {
            ...dragStart.sel,
            x: clamp(Math.round(dragStart.sel.x + dx), 0, imgWidth - dragStart.sel.w),
            y: clamp(Math.round(dragStart.sel.y + dy), 0, imgHeight - dragStart.sel.h),
          }
        }
        return next
      })
    } else if (dragMode && dragMode.startsWith('resize-') && resizeStart) {
      const imgDx = Math.round((pos.x - resizeStart.pos.x / scaleX) * scaleX)
      const imgDy = Math.round((pos.y - resizeStart.pos.y / scaleY) * scaleY)
      const rawDx = Math.round((pos.x - resizeStart.pos.x) * scaleX)
      const rawDy = Math.round((pos.y - resizeStart.pos.y) * scaleY)
      setSelections(prev => {
        const next = [...prev]
        if (activeIndex !== null && next[activeIndex]) {
          const s = resizeStart
          let nx = s.x, ny = s.y, nw = s.w, nh = s.h
          if (dragMode.includes('l')) { nx = clamp(s.x + rawDx, 0, s.x + s.w - 5); nw = s.w - (nx - s.x) }
          if (dragMode.includes('r')) { nw = clamp(s.w + rawDx, 5, imgWidth - s.x) }
          if (dragMode.includes('t')) { ny = clamp(s.y + rawDy, 0, s.y + s.h - 5); nh = s.h - (ny - s.y) }
          if (dragMode.includes('b')) { nh = clamp(s.h + rawDy, 5, imgHeight - s.y) }
          next[activeIndex] = { x: nx, y: ny, w: nw, h: nh }
        }
        return next
      })
    }
  }, [dragMode, isDrawing, dragStart, resizeStart, activeIndex, getPointerPos, toImageCoords, setSelections, scaleX, scaleY, imgWidth, imgHeight])

  const handlePointerUp = useCallback(() => {
    setIsDrawing(false)
    setDragMode(null)
    setDragStart(null)
    setResizeStart(null)
  }, [])

  // Draw overlay
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    canvas.width = displayWidth
    canvas.height = displayHeight
    ctx.clearRect(0, 0, displayWidth, displayHeight)
    if (mode === 'full') return

    selections.forEach((sel, i) => {
      const dx = sel.x / scaleX, dy = sel.y / scaleY
      const dw = sel.w / scaleX, dh = sel.h / scaleY
      if (dw < 1 || dh < 1) return

      if (i === activeIndex) {
        ctx.fillStyle = 'rgba(37, 99, 235, 0.15)'
        ctx.fillRect(dx, dy, dw, dh)
      }
      ctx.strokeStyle = i === activeIndex ? '#2563eb' : 'rgba(37, 99, 235, 0.6)'
      ctx.lineWidth = 2
      ctx.setLineDash(i === activeIndex ? [] : [6, 4])
      ctx.strokeRect(dx, dy, dw, dh)
      ctx.setLineDash([])

      if (i === activeIndex) {
        const hs = 5
        ctx.fillStyle = '#2563eb'
        ctx.fillRect(dx - hs, dy - hs, hs * 2, hs * 2)
        ctx.fillRect(dx + dw - hs, dy - hs, hs * 2, hs * 2)
        ctx.fillRect(dx - hs, dy + dh - hs, hs * 2, hs * 2)
        ctx.fillRect(dx + dw - hs, dy + dh - hs, hs * 2, hs * 2)
        // Label
        ctx.fillStyle = '#2563eb'
        ctx.font = '11px Inter, sans-serif'
        const label = `${lang === 'ar' ? 'منطقة' : lang === 'fr' ? 'Zone' : 'Area'} ${i + 1}`
        const lw = ctx.measureText(label).width + 8
        ctx.fillRect(dx, dy - 18, lw, 16)
        ctx.fillStyle = '#fff'
        ctx.fillText(label, dx + 4, dy - 6)
      }
    })
  }, [selections, activeIndex, mode, displayWidth, displayHeight, scaleX, scaleY, lang])

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: displayWidth, height: displayHeight,
        cursor: mode === 'full' ? 'default' : (dragMode === 'move' ? 'move' : 'crosshair'),
        touchAction: 'none',
      }}
      className="absolute top-0 left-0"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    />
  )
}

/* ═══ Main Region Tool Editor ═══ */
export function RegionToolEditor({
  file, lang, effectName, sliders, effectFn, applyToRegionFn,
}) {
  const { img, width: imgWidth, height: imgHeight, loading } = useImageLoader(file)
  const labels = getLabels(lang)
  const previewRef = useRef(null)
  const [selections, setSelections] = useState([])
  const [mode, setMode] = useState('draw')
  const [params, setParams] = useState(
    Object.fromEntries((sliders || []).map(s => [s.key, s.default]))
  )
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [displaySize, setDisplaySize] = useState({ w: 0, h: 0 })
  const history = useEditorHistory(30)

  useEffect(() => {
    if (!imgWidth || !imgHeight) return
    const maxW = 500, maxH = 400
    const ratio = Math.min(maxW / imgWidth, maxH / imgHeight, 1)
    setDisplaySize({ w: Math.round(imgWidth * ratio), h: Math.round(imgHeight * ratio) })
  }, [imgWidth, imgHeight])

  const renderPreview = useCallback(() => {
    const preview = previewRef.current
    if (!preview || !img) return
    const pctx = preview.getContext('2d')
    preview.width = displaySize.w
    preview.height = displaySize.h
    pctx.clearRect(0, 0, displaySize.w, displaySize.h)
    pctx.drawImage(img, 0, 0, displaySize.w, displaySize.h)

    if (mode === 'full') {
      const tmp = document.createElement('canvas')
      tmp.width = displaySize.w; tmp.height = displaySize.h
      const tctx = tmp.getContext('2d')
      tctx.drawImage(img, 0, 0, displaySize.w, displaySize.h)
      const imageData = tctx.getImageData(0, 0, displaySize.w, displaySize.h)
      effectFn(tctx, imageData, params)
      tctx.putImageData(imageData, 0, 0)
      pctx.drawImage(tmp, 0, 0)
    } else if (selections.length > 0) {
      const sx = displaySize.w / imgWidth
      const sy = displaySize.h / imgHeight
      selections.forEach(sel => {
        const dx = Math.round(sel.x * sx), dy = Math.round(sel.y * sy)
        const dw = Math.round(sel.w * sx), dh = Math.round(sel.h * sy)
        if (dw < 2 || dh < 2) return
        applyToRegionFn(pctx, { x: dx, y: dy, w: dw, h: dh }, params)
      })
    }
  }, [img, displaySize, mode, selections, params, effectFn, applyToRegionFn, imgWidth, imgHeight])

  useEffect(() => { renderPreview() }, [renderPreview])

  const deleteSelection = (i) => {
    setSelections(prev => prev.filter((_, idx) => idx !== i))
  }
  const clearAll = () => setSelections([])
  const addDefaultSelection = () => {
    const w = Math.round(imgWidth * 0.3), h = Math.round(imgHeight * 0.3)
    setSelections(prev => [...prev, {
      x: Math.round((imgWidth - w) / 2), y: Math.round((imgHeight - h) / 2), w, h,
    }])
  }

  const handleReset = () => {
    setSelections([]); setMode('draw')
    setParams(Object.fromEntries((sliders || []).map(s => [s.key, s.default])))
    history.reset(); setResult(null); setError(null)
  }

  const handleApply = async () => {
    setProcessing(true); setError(null)
    try {
      const canvas = document.createElement('canvas')
      canvas.width = imgWidth; canvas.height = imgHeight
      const ctx = canvas.getContext('2d')
      if (file.type === 'image/jpeg' || file.type === 'image/jpg') {
        ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, imgWidth, imgHeight)
      }
      ctx.drawImage(img, 0, 0)

      if (mode === 'full') {
        const imageData = ctx.getImageData(0, 0, imgWidth, imgHeight)
        effectFn(ctx, imageData, params)
        ctx.putImageData(imageData, 0, 0)
      } else if (selections.length > 0) {
        selections.forEach(sel => {
          if (sel.w < 2 || sel.h < 2) return
          applyToRegionFn(ctx, sel, params)
        })
      }

      const format = file.type || 'image/png'
      const blob = await new Promise((resolve, reject) => {
        canvas.toBlob(b => b ? resolve(b) : reject(new Error('Export failed')), format, 0.92)
      })
      const ext = format === 'image/jpeg' ? 'jpg' : format === 'image/webp' ? 'webp' : 'png'
      setResult({ blob, filename: getOutputFilename(file.name, ext) })
    } catch (e) { setError(e.message || 'Processing failed') }
    finally { setProcessing(false) }
  }

  if (loading) return (
    <div className="flex justify-center py-12">
      <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
    </div>
  )

  if (result) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 p-3 rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 text-green-700 dark:text-green-400 text-sm font-medium">
          <Check className="w-4 h-4 shrink-0" /> {labels.complete}
        </div>
        <button onClick={() => downloadBlob(result.blob, result.filename)} className="btn-primary w-full justify-center py-3.5 text-sm">
          <Download className="w-4 h-4" /> {labels.download} {result.filename}
        </button>
        <button onClick={() => setResult(null)} className="text-sm text-[#6B7280] dark:text-[#A1A1AA] hover:text-blue-600 font-medium w-full text-center">
          {labels.startOver}
        </button>
      </div>
    )
  }

  // Check if sliders contain color type (for Redact/Erase)
  const hasColorSlider = sliders && sliders.some(s => s.type === 'color')

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <EditorHistoryToolbar
          canUndo={history.canUndo} canRedo={history.canRedo}
          onUndo={history.undo} onRedo={history.redo} lang={lang}
        />
      </div>

      {/* Mode toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setMode('draw')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-medium transition-colors ${
            mode === 'draw'
              ? 'bg-blue-600 text-white'
              : 'border border-[#E5E7EB] dark:border-[#27272A] text-[#6B7280] dark:text-[#A1A1AA] hover:bg-gray-50 dark:hover:bg-[#18181B]'
          }`}
        >
          <Square className="w-4 h-4" /> {labels.selectArea}
        </button>
        <button
          onClick={() => { setMode('full'); setSelections([]); }}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-medium transition-colors ${
            mode === 'full'
              ? 'bg-blue-600 text-white'
              : 'border border-[#E5E7EB] dark:border-[#27272A] text-[#6B7280] dark:text-[#A1A1AA] hover:bg-gray-50 dark:hover:bg-[#18181B]'
          }`}
        >
          <Maximize2 className="w-4 h-4" /> {labels.fullImage}
        </button>
      </div>

      {/* Preview canvas with selection overlay */}
      <div className="relative rounded-xl border border-[#E5E7EB] dark:border-[#27272A] overflow-hidden bg-[#F7F8FA] dark:bg-[#18181B] p-4 flex justify-center" style={{ minHeight: '200px' }}>
        <div className="relative inline-block" style={{ width: displaySize.w, height: displaySize.h }}>
          <canvas ref={previewRef} style={{ width: displaySize.w, height: displaySize.h }} className="rounded-lg" />
          <SelectionCanvas
            imgWidth={imgWidth} imgHeight={imgHeight}
            displayWidth={displaySize.w} displayHeight={displaySize.h}
            selections={selections} setSelections={setSelections}
            mode={mode} lang={lang}
          />
        </div>
      </div>

      {mode === 'draw' && selections.length === 0 && (
        <p className="text-xs text-[#6B7280] dark:text-[#A1A1AA] text-center">{labels.dragHint}</p>
      )}

      {/* Sliders */}
      {sliders && sliders.length > 0 && (
        <div className="space-y-3">
          {sliders.map(s => (
            s.type === 'color' ? (
              <div key={s.key}>
                <label className="block text-sm font-medium text-[#111111] dark:text-[#FAFAFA] mb-1.5">{s.label}</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={params[s.key]}
                    onChange={e => setParams(prev => ({ ...prev, [s.key]: e.target.value }))}
                    onPointerUp={() => history.pushState({ ...params, selections: [...selections], mode })}
                    className="w-12 h-9 rounded-lg border border-[#E5E7EB] dark:border-[#27272A] cursor-pointer bg-transparent"
                  />
                  <span className="text-sm text-[#6B7280] dark:text-[#A1A1AA] font-mono">{params[s.key]}</span>
                </div>
              </div>
            ) : (
              <div key={s.key}>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-medium text-[#111111] dark:text-[#FAFAFA]">{s.label}</label>
                  <span className="text-xs text-[#6B7280] dark:text-[#A1A1AA] tabular-nums">{params[s.key]}</span>
                </div>
                <input
                  type="range" min={s.min} max={s.max} step={s.step} value={params[s.key]}
                  onChange={e => setParams(prev => ({ ...prev, [s.key]: parseFloat(e.target.value) }))}
                  onPointerUp={() => history.pushState({ ...params, selections: [...selections], mode })}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>
            )
          ))}
        </div>
      )}

      {/* Selection controls */}
      {mode === 'draw' && (
        <div className="flex flex-wrap gap-2">
          <button onClick={addDefaultSelection} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border border-[#E5E7EB] dark:border-[#27272A] text-[#6B7280] dark:text-[#A1A1AA] hover:border-blue-300 hover:text-blue-600 transition-colors">
            <Plus className="w-4 h-4" /> {labels.addArea}
          </button>
          {selections.length > 0 && (
            <button onClick={clearAll} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border border-[#E5E7EB] dark:border-[#27272A] text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors">
              <Trash2 className="w-4 h-4" /> {labels.clearAll}
            </button>
          )}
        </div>
      )}

      {/* Selection list */}
      {mode === 'draw' && selections.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-[#6B7280] dark:text-[#A1A1AA]">
            {labels.selections}: {selections.length} {labels.regions}
          </p>
          {selections.map((sel, i) => (
            <div key={i} className="flex items-center justify-between p-2 rounded-lg border border-[#E5E7EB] dark:border-[#27272A]">
              <span className="text-sm text-[#111111] dark:text-[#FAFAFA]">
                {labels.area} {i + 1}: {Math.round(sel.w)}×{Math.round(sel.h)}px
              </span>
              <button onClick={() => deleteSelection(i)} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg p-1">
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Status */}
      <div className="text-xs text-[#6B7280] dark:text-[#A1A1AA] text-center">
        {mode === 'full' ? labels.applyToFull : (selections.length > 0 ? labels.applyToRegions : labels.noSelection)}
      </div>

      {/* Buttons */}
      <div className="flex gap-3">
        <button onClick={handleReset} className="flex-1 py-3 text-sm font-medium rounded-xl border border-[#E5E7EB] dark:border-[#27272A] text-[#6B7280] dark:text-[#A1A1AA] hover:bg-gray-50 dark:hover:bg-[#18181B] transition-colors">
          {labels.reset}
        </button>
        <button onClick={handleApply} disabled={processing || (mode === 'draw' && selections.length === 0)} className="btn-primary flex-1 justify-center py-3 text-sm disabled:opacity-50 disabled:cursor-not-allowed">
          {processing ? <><Loader2 className="w-4 h-4 animate-spin" /> {labels.processing}</> : labels.apply}
        </button>
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  )
}

/* ═══ Exported tool components ═══ */

export function PixelateEditor({ file, lang }) {
  const labels = getLabels(lang)
  return <RegionToolEditor file={file} lang={lang} effectName="pixelate"
    sliders={[{ key: 'blockSize', label: labels.blockSize, min: 2, max: 50, step: 1, default: 10 }]}
    effectFn={pixelateFull} applyToRegionFn={pixelateRegion} />
}

export function SharpenEditor({ file, lang }) {
  const labels = getLabels(lang)
  return <RegionToolEditor file={file} lang={lang} effectName="sharpen"
    sliders={[{ key: 'amount', label: labels.amount, min: 0, max: 100, step: 1, default: 50 }]}
    effectFn={sharpenFull} applyToRegionFn={sharpenRegion} />
}

export function InvertEditor({ file, lang }) {
  return <RegionToolEditor file={file} lang={lang} effectName="invert"
    sliders={[]} effectFn={invertFull} applyToRegionFn={invertRegion} />
}

export function ColorAdjustEditor({ file, lang }) {
  const labels = getLabels(lang)
  return <RegionToolEditor file={file} lang={lang} effectName="colorAdjust"
    sliders={[
      { key: 'hue', label: labels.hue, min: -180, max: 180, step: 1, default: 0 },
      { key: 'temperature', label: labels.temperature, min: -100, max: 100, step: 1, default: 0 },
      { key: 'tint', label: labels.tint, min: -100, max: 100, step: 1, default: 0 },
    ]}
    effectFn={colorAdjustFull} applyToRegionFn={colorAdjustRegion} />
}

export function RedactEditor({ file, lang }) {
  const labels = getLabels(lang)
  return <RegionToolEditor file={file} lang={lang} effectName="redact"
    sliders={[{ key: 'color', label: labels.color, type: 'color', default: '#000000' }]}
    effectFn={redactFull} applyToRegionFn={redactRegion} />
}

export function EraseAreaEditor({ file, lang }) {
  const labels = getLabels(lang)
  return <RegionToolEditor file={file} lang={lang} effectName="erase"
    sliders={[{ key: 'color', label: labels.color, type: 'color', default: '#ffffff' }]}
    effectFn={eraseFull} applyToRegionFn={eraseRegion} />
}
