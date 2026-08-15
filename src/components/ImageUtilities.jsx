/**
 * ImageUtilities.jsx — 17 utility tools with custom UIs.
 * All use browser Canvas APIs. Mobile + RTL + dark mode.
 */

import { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react'
import {
  Download, Check, Loader2, X, Plus, Minus, RefreshCw,
  Image as ImageIcon, Grid3x3, Scissors, Eye, Copy,
} from 'lucide-react'
import { downloadBlob, getOutputFilename, formatFileSize } from '../lib/processors/image.js'
import { EditorHistoryToolbar, useEditorHistory } from './EditorHistory'

const clamp = (v, min, max) => Math.max(min, Math.min(max, v))

function useImageLoader(file) {
  const [state, setState] = useState({ img: null, width: 0, height: 0, loading: true })
  useLayoutEffect(() => {
    if (!file) { setState({ img: null, width: 0, height: 0, loading: false }); return }
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => setState({ img, width: img.naturalWidth, height: img.naturalHeight, loading: false })
    img.onerror = () => setState({ img: null, width: 0, height: 0, loading: false })
    img.src = url
    return () => URL.revokeObjectURL(url)
  }, [file])
  return state
}

function hexToRgb(hex) {
  const m = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i)
  return m ? { r: parseInt(m[1],16), g: parseInt(m[2],16), b: parseInt(m[3],16) } : { r:0, g:0, b:0 }
}
function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(v => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join('')
}
function L(lang, en, fr, ar) { return lang === 'ar' ? ar : lang === 'fr' ? fr : en }

function ResultBlock({ blob, filename, lang, onReset }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 p-3 rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 text-green-700 dark:text-green-400 text-sm font-medium">
        <Check className="w-4 h-4 shrink-0" /> {L(lang, 'Complete!', 'Terminé !', 'اكتملت المعالجة!')}
      </div>
      <button onClick={() => downloadBlob(blob, filename)} className="btn-primary w-full justify-center py-3.5 text-sm">
        <Download className="w-4 h-4" /> {L(lang, 'Download', 'Télécharger', 'تحميل')} {filename}
      </button>
      <button onClick={onReset} className="text-sm text-[#6B7280] dark:text-[#A1A1AA] hover:text-blue-600 font-medium w-full text-center">
        {L(lang, 'Start over', 'Recommencer', 'ابدأ من جديد')}
      </button>
    </div>
  )
}

function MultiResultBlock({ results, lang, onReset }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 p-3 rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 text-green-700 dark:text-green-400 text-sm font-medium">
        <Check className="w-4 h-4 shrink-0" /> {results.length} {L(lang, 'files ready', 'fichiers prêts', 'ملفات جاهزة')}
      </div>
      {results.map((r, i) => (
        <button key={i} onClick={() => downloadBlob(r.blob, r.filename)} className="btn-primary w-full justify-center py-3 text-sm">
          <Download className="w-4 h-4" /> {r.filename}
        </button>
      ))}
      <button onClick={onReset} className="text-sm text-[#6B7280] dark:text-[#A1A1AA] hover:text-blue-600 font-medium w-full text-center">
        {L(lang, 'Start over', 'Recommencer', 'ابدأ من جديد')}
      </button>
    </div>
  )
}

/* 1. COLOR PICKER */
export function ColorPickerEditor({ file, lang }) {
  const { img, width, height, loading } = useImageLoader(file)
  const canvasRef = useRef(null)
  const [picked, setPicked] = useState(null)
  const [hover, setHover] = useState(null)

  useEffect(() => {
    if (!img || !canvasRef.current) return
    const canvas = canvasRef.current; canvas.width = width; canvas.height = height
    canvas.getContext('2d').drawImage(img, 0, 0)
  }, [img, width, height])

  const handlePick = (e) => {
    const canvas = canvasRef.current; if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const cx = e.touches ? e.touches[0].clientX : e.clientX
    const cy = e.touches ? e.touches[0].clientY : e.clientY
    const x = Math.floor((cx - rect.left) / rect.width * width)
    const y = Math.floor((cy - rect.top) / rect.height * height)
    if (x < 0 || y < 0 || x >= width || y >= height) return
    const p = canvas.getContext('2d').getImageData(x, y, 1, 1).data
    setPicked({ r: p[0], g: p[1], b: p[2], x, y })
  }

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
  const current = picked || hover
  const hex = current ? rgbToHex(current.r, current.g, current.b) : '#000000'

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-[#E5E7EB] dark:border-[#27272A] overflow-hidden bg-[#F7F8FA] dark:bg-[#18181B] p-4 flex justify-center">
        <canvas ref={canvasRef} onClick={handlePick} onTouchStart={handlePick} onMouseMove={(e) => { const rect = e.target.getBoundingClientRect(); const x = Math.floor((e.clientX-rect.left)/rect.width*width); const y = Math.floor((e.clientY-rect.top)/rect.height*height); if (x>=0&&y>=0&&x<width&&y<height) { const p = canvasRef.current?.getContext('2d').getImageData(x,y,1,1).data; setHover({ r: p[0], g: p[1], b: p[2] }); } }} className="max-w-full max-h-[400px] rounded-lg cursor-crosshair" style={{ touchAction: 'none' }} />
      </div>
      <p className="text-xs text-[#6B7280] dark:text-[#A1A1AA] text-center">{L(lang, 'Click on the image to pick a color', 'Cliquez sur l\'image pour choisir une couleur', 'انقر على الصورة لاختيار لون')}</p>
      {current && (
        <div className="flex items-center gap-4 p-4 rounded-xl border border-[#E5E7EB] dark:border-[#27272A]">
          <div className="w-16 h-16 rounded-lg border border-[#E5E7EB] dark:border-[#27272A]" style={{ backgroundColor: hex }} />
          <div className="flex-1 space-y-1">
            <p className="text-sm font-mono font-bold text-[#111111] dark:text-[#FAFAFA]">{hex.toUpperCase()}</p>
            <p className="text-xs text-[#6B7280] dark:text-[#A1A1AA]">RGB: {current.r}, {current.g}, {current.b}</p>
            {picked && <button onClick={() => navigator.clipboard?.writeText(hex.toUpperCase())} className="text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline">{L(lang, 'Copy HEX', 'Copier HEX', 'نسخ HEX')}</button>}
          </div>
        </div>
      )}
    </div>
  )
}

/* 2. EXTRACT PALETTE */
export function ExtractPaletteEditor({ file, lang }) {
  const { img, width, height, loading } = useImageLoader(file)
  const [palette, setPalette] = useState([])
  const [numColors, setNumColors] = useState(6)

  const extract = useCallback(() => {
    if (!img) return
    const canvas = document.createElement('canvas')
    const maxDim = 200; const ratio = Math.min(maxDim / width, maxDim / height, 1)
    canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio)
    const ctx = canvas.getContext('2d'); ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data
    const pixels = []; for (let i = 0; i < data.length; i += 4) { pixels.push([data[i], data[i+1], data[i+2]]) }
    const buckets = [pixels]
    while (buckets.length < numColors) {
      let maxRange = 0, maxIdx = 0, splitC = 0
      buckets.forEach((b, idx) => { if (b.length < 2) return; for (let c = 0; c < 3; c++) { let mn=255,mx=0; for (const p of b) { mn=Math.min(mn,p[c]); mx=Math.max(mx,p[c]) } if (mx-mn > maxRange) { maxRange=mx-mn; maxIdx=idx; splitC=c } } })
      if (maxRange === 0) break
      const b = buckets[maxIdx]; b.sort((a,b2) => a[splitC]-b2[splitC]); const mid = Math.floor(b.length/2)
      buckets[maxIdx] = b.slice(0, mid); buckets.push(b.slice(mid))
    }
    setPalette(buckets.map(b => { if (!b.length) return null; const a = b.reduce((acc,p)=>[acc[0]+p[0],acc[1]+p[1],acc[2]+p[2]],[0,0,0]); return rgbToHex(a[0]/b.length, a[1]/b.length, a[2]/b.length) }).filter(Boolean))
  }, [img, width, height, numColors])

  useEffect(() => { if (img) extract() }, [img, extract])
  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-[#111111] dark:text-[#FAFAFA] mb-2">{L(lang, 'Number of Colors', 'Nombre de couleurs', 'عدد الألوان')}: {numColors}</label>
        <input type="range" min="3" max="12" value={numColors} onChange={e => setNumColors(parseInt(e.target.value))} onPointerUp={extract} className="w-full accent-blue-600 cursor-pointer" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {palette.map((color, i) => (
          <div key={i} className="rounded-xl border border-[#E5E7EB] dark:border-[#27272A] overflow-hidden cursor-pointer hover:border-blue-300 transition-colors" onClick={() => navigator.clipboard?.writeText(color.toUpperCase())}>
            <div className="h-16" style={{ backgroundColor: color }} />
            <div className="p-2"><p className="text-sm font-mono font-bold text-[#111111] dark:text-[#FAFAFA]">{color.toUpperCase()}</p><p className="text-xs text-[#6B7280] dark:text-[#A1A1AA]">{L(lang, 'Click to copy', 'Cliquez pour copier', 'انقر للنسخ')}</p></div>
          </div>
        ))}
      </div>
      <button onClick={extract} className="w-full py-3 text-sm font-medium rounded-xl border border-[#E5E7EB] dark:border-[#27272A] text-[#6B7280] dark:text-[#A1A1AA] hover:bg-gray-50 dark:hover:bg-[#18181B] transition-colors">
        <RefreshCw className="w-4 h-4 inline mr-2" /> {L(lang, 'Regenerate', 'Régénérer', 'إعادة التوليد')}
      </button>
    </div>
  )
}

/* 3. IMAGE SPLITTER */
export function ImageSplitterEditor({ file, lang }) {
  const { img, width, height, loading } = useImageLoader(file)
  const [rows, setRows] = useState(2); const [cols, setCols] = useState(2)
  const [results, setResults] = useState(null); const [processing, setProcessing] = useState(false)

  const handleSplit = async () => {
    setProcessing(true)
    try {
      const tw = Math.floor(width/cols), th = Math.floor(height/rows); const tiles = []
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        const cv = document.createElement('canvas'); cv.width = tw; cv.height = th
        cv.getContext('2d').drawImage(img, c*tw, r*th, tw, th, 0, 0, tw, th)
        tiles.push({ blob: await new Promise(res => cv.toBlob(res, 'image/png')), filename: `tile_${r}_${c}.png` })
      }
      setResults(tiles)
    } catch (e) {} setProcessing(false)
  }

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
  if (results) return <MultiResultBlock results={results} lang={lang} onReset={() => setResults(null)} />

  return (
    <div className="space-y-4">
      <div><label className="block text-sm font-medium text-[#111111] dark:text-[#FAFAFA] mb-2">{L(lang, 'Rows', 'Lignes', 'صفوف')}: {rows}</label><input type="range" min="1" max="10" value={rows} onChange={e => setRows(parseInt(e.target.value))} className="w-full accent-blue-600 cursor-pointer" /></div>
      <div><label className="block text-sm font-medium text-[#111111] dark:text-[#FAFAFA] mb-2">{L(lang, 'Columns', 'Colonnes', 'أعمدة')}: {cols}</label><input type="range" min="1" max="10" value={cols} onChange={e => setCols(parseInt(e.target.value))} className="w-full accent-blue-600 cursor-pointer" /></div>
      <div className="text-sm text-[#6B7280] dark:text-[#A1A1AA] text-center">{rows}x{cols} = {rows*cols} {L(lang, 'tiles', 'tuiles', 'بلاطات')}</div>
      <button onClick={handleSplit} disabled={processing} className="btn-primary w-full justify-center py-3.5 text-sm disabled:opacity-50">{processing ? <><Loader2 className="w-4 h-4 animate-spin" /> {L(lang, 'Splitting...', 'Découpage...', 'جارٍ القسمة...')}</> : <><Scissors className="w-4 h-4" /> {L(lang, 'Split Image', 'Découper l\'image', 'قسم الصورة')}</>}</button>
    </div>
  )
}

/* 4. IMAGE SLICER */
export function ImageSlicerEditor({ file, lang }) {
  const { img, width, height, loading } = useImageLoader(file)
  const [direction, setDirection] = useState('horizontal'); const [count, setCount] = useState(3)
  const [results, setResults] = useState(null); const [processing, setProcessing] = useState(false)

  const handleSlice = async () => {
    setProcessing(true)
    try {
      const slices = []
      for (let i = 0; i < count; i++) {
        const cv = document.createElement('canvas'); let sw,sh,sx,sy
        if (direction === 'horizontal') { sw=Math.floor(width/count); sh=height; sx=i*sw; sy=0 } else { sw=width; sh=Math.floor(height/count); sx=0; sy=i*sh }
        cv.width = sw; cv.height = sh; cv.getContext('2d').drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh)
        slices.push({ blob: await new Promise(res => cv.toBlob(res, 'image/png')), filename: `slice_${i+1}.png` })
      }
      setResults(slices)
    } catch (e) {} setProcessing(false)
  }

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
  if (results) return <MultiResultBlock results={results} lang={lang} onReset={() => setResults(null)} />

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button onClick={() => setDirection('horizontal')} className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium ${direction==='horizontal'?'bg-blue-600 text-white':'border border-[#E5E7EB] dark:border-[#27272A] text-[#6B7280] dark:text-[#A1A1AA]'}`}>{L(lang, 'Horizontal', 'Horizontal', 'أفقي')}</button>
        <button onClick={() => setDirection('vertical')} className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium ${direction==='vertical'?'bg-blue-600 text-white':'border border-[#E5E7EB] dark:border-[#27272A] text-[#6B7280] dark:text-[#A1A1AA]'}`}>{L(lang, 'Vertical', 'Vertical', 'عمودي')}</button>
      </div>
      <div><label className="block text-sm font-medium text-[#111111] dark:text-[#FAFAFA] mb-2">{L(lang, 'Number of Slices', 'Nombre de bandes', 'عدد الشرائح')}: {count}</label><input type="range" min="2" max="20" value={count} onChange={e => setCount(parseInt(e.target.value))} className="w-full accent-blue-600 cursor-pointer" /></div>
      <button onClick={handleSlice} disabled={processing} className="btn-primary w-full justify-center py-3.5 text-sm disabled:opacity-50">{processing ? <><Loader2 className="w-4 h-4 animate-spin" /> {L(lang, 'Slicing...', 'Découpage...', 'جارٍ التقطيع...')}</> : <><Scissors className="w-4 h-4" /> {L(lang, 'Slice Image', 'Trancher l\'image', 'تقطيع الصورة')}</>}</button>
    </div>
  )
}

/* 5. SOCIAL MEDIA RESIZER */
export function SocialMediaResizerEditor({ file, lang }) {
  const { img, width, height, loading } = useImageLoader(file)
  const [preset, setPreset] = useState('instagram-square')
  const [result, setResult] = useState(null); const [processing, setProcessing] = useState(false)

  const presets = {
    'instagram-square': { w:1080, h:1080, label:L(lang,'Instagram Square','Instagram Carré','إنستغرام مربع') },
    'instagram-portrait': { w:1080, h:1350, label:L(lang,'Instagram Portrait','Instagram Portrait','إنستغرام طولي') },
    'instagram-story': { w:1080, h:1920, label:L(lang,'Instagram Story','Instagram Story','إنستغرام ستوري') },
    'facebook-post': { w:1200, h:630, label:L(lang,'Facebook Post','Facebook Publication','فيسبوك منشور') },
    'facebook-cover': { w:820, h:312, label:L(lang,'Facebook Cover','Facebook Couverture','فيسبوك غلاف') },
    'twitter-post': { w:1200, h:675, label:L(lang,'Twitter Post','Twitter Publication','تويتر منشور') },
    'twitter-header': { w:1500, h:500, label:L(lang,'Twitter Header','Twitter En-tête','تويتر رأس') },
    'linkedin-post': { w:1200, h:627, label:L(lang,'LinkedIn Post','LinkedIn Publication','لينكدإن منشور') },
    'youtube-thumb': { w:1280, h:720, label:L(lang,'YouTube Thumbnail','YouTube Miniature','يوتيوب صورة مصغرة') },
  }

  const handleResize = async () => {
    setProcessing(true)
    try {
      const p = presets[preset]; const cv = document.createElement('canvas'); cv.width=p.w; cv.height=p.h
      const ctx = cv.getContext('2d'); ctx.fillStyle='#FFFFFF'; ctx.fillRect(0,0,p.w,p.h)
      const ir = width/height, cr = p.w/p.h; let dw,dh,dx,dy
      if (ir>cr) { dh=p.h; dw=Math.round(p.h*ir); dx=-(Math.round((dw-p.w)/2)); dy=0 } else { dw=p.w; dh=Math.round(p.w/ir); dx=0; dy=-(Math.round((dh-p.h)/2)) }
      ctx.drawImage(img, dx, dy, dw, dh)
      setResult({ blob: await new Promise(res => cv.toBlob(res, 'image/jpeg', 0.92)), filename: getOutputFilename(file.name, 'jpg') })
    } catch (e) {} setProcessing(false)
  }

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
  if (result) return <ResultBlock blob={result.blob} filename={result.filename} lang={lang} onReset={() => setResult(null)} />

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {Object.entries(presets).map(([key, p]) => (
          <button key={key} onClick={() => setPreset(key)} className={`p-3 rounded-xl text-xs font-medium transition-colors ${preset===key?'bg-blue-600 text-white':'border border-[#E5E7EB] dark:border-[#27272A] text-[#6B7280] dark:text-[#A1A1AA] hover:border-blue-300'}`}>{p.label}<br/><span className="opacity-60">{p.w}x{p.h}</span></button>
        ))}
      </div>
      <button onClick={handleResize} disabled={processing} className="btn-primary w-full justify-center py-3.5 text-sm disabled:opacity-50">{processing ? <><Loader2 className="w-4 h-4 animate-spin" /> {L(lang, 'Resizing...', 'Redimensionnement...', 'جارٍ تغيير الحجم...')}</> : L(lang, 'Resize & Download', 'Redimensionner & Télécharger', 'تغيير الحجم والتحميل')}</button>
    </div>
  )
}

/* 6. PASSPORT PHOTO */
export function PassportPhotoEditor({ file, lang }) {
  const { img, width, height, loading } = useImageLoader(file)
  const [preset, setPreset] = useState('us-passport'); const [bgColor, setBgColor] = useState('#ffffff')
  const [result, setResult] = useState(null); const [processing, setProcessing] = useState(false)

  const presets = {
    'us-passport': { w:600, h:600, label:L(lang,'US Passport (2x2 in)','Passeport US (2x2 in)','جواز أمريكي') },
    'eu-passport': { w:600, h:780, label:L(lang,'EU Passport (35x45mm)','Passeport UE (35x45mm)','جواز أوروبي') },
    'us-visa': { w:600, h:600, label:L(lang,'US Visa (2x2 in)','Visa US (2x2 in)','تأشيرة أمريكية') },
    'schengen-visa': { w:600, h:780, label:L(lang,'Schengen Visa (35x45mm)','Visa Schengen (35x45mm)','تأشيرة شينغن') },
    'india-passport': { w:600, h:780, label:L(lang,'India Passport (35x45mm)','Passeport Inde (35x45mm)','جواس هندي') },
    'china-visa': { w:672, h:912, label:L(lang,'China Visa (33x48mm)','Visa Chine (33x48mm)','تأشيرة صينية') },
  }

  const handleGenerate = async () => {
    setProcessing(true)
    try {
      const p = presets[preset]; const cv = document.createElement('canvas'); cv.width=p.w; cv.height=p.h
      const ctx = cv.getContext('2d'); ctx.fillStyle=bgColor; ctx.fillRect(0,0,p.w,p.h)
      const ir=width/height, cr=p.w/p.h; let dw,dh,dx,dy
      if (ir>cr) { dh=p.h; dw=Math.round(p.h*ir); dx=-(Math.round((dw-p.w)/2)); dy=0 } else { dw=p.w; dh=Math.round(p.w/ir); dx=0; dy=-(Math.round((dh-p.h)/2)) }
      ctx.drawImage(img, dx, dy, dw, dh)
      setResult({ blob: await new Promise(res => cv.toBlob(res, 'image/jpeg', 0.95)), filename: getOutputFilename(file.name, 'jpg') })
    } catch (e) {} setProcessing(false)
  }

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
  if (result) return <ResultBlock blob={result.blob} filename={result.filename} lang={lang} onReset={() => setResult(null)} />

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {Object.entries(presets).map(([key, p]) => (
          <button key={key} onClick={() => setPreset(key)} className={`p-3 rounded-xl text-sm font-medium transition-colors ${preset===key?'bg-blue-600 text-white':'border border-[#E5E7EB] dark:border-[#27272A] text-[#6B7280] dark:text-[#A1A1AA] hover:border-blue-300'}`}>{p.label}<br/><span className="text-xs opacity-60">{p.w}x{p.h}px</span></button>
        ))}
      </div>
      <div><label className="block text-sm font-medium text-[#111111] dark:text-[#FAFAFA] mb-2">{L(lang, 'Background Color', 'Couleur de fond', 'لون الخلفية')}</label><div className="flex items-center gap-2"><input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)} className="w-12 h-9 rounded-lg border border-[#E5E7EB] dark:border-[#27272A] cursor-pointer bg-transparent" /><span className="text-sm text-[#6B7280] dark:text-[#A1A1AA] font-mono">{bgColor}</span></div></div>
      <button onClick={handleGenerate} disabled={processing} className="btn-primary w-full justify-center py-3.5 text-sm disabled:opacity-50">{processing ? <><Loader2 className="w-4 h-4 animate-spin" /> {L(lang, 'Generating...', 'Génération...', 'جارٍ التوليد...')}</> : L(lang, 'Generate Photo', 'Générer la photo', 'توليد الصورة')}</button>
    </div>
  )
}

/* 7. FILE SIZE TARGETER */
export function FileSizeTargeterEditor({ file, lang }) {
  const { img, width, height, loading } = useImageLoader(file)
  const [targetKB, setTargetKB] = useState(500); const [result, setResult] = useState(null)
  const [processing, setProcessing] = useState(false); const [error, setError] = useState(null)

  const handleTarget = async () => {
    setProcessing(true); setError(null)
    try {
      const cv = document.createElement('canvas'); cv.width=width; cv.height=height
      const ctx = cv.getContext('2d'); if (file.type==='image/jpeg'||file.type==='image/jpg') { ctx.fillStyle='#FFFFFF'; ctx.fillRect(0,0,width,height) } ctx.drawImage(img,0,0)
      const target = targetKB*1024; let quality=0.92, best=null
      for (let i=0; i<10; i++) { const blob = await new Promise(res => cv.toBlob(res, 'image/jpeg', quality)); if (!blob) continue; if (blob.size<=target) { best=blob; break } if (!best||blob.size<best.size) best=blob; quality*=0.8 }
      if (!best) best = await new Promise(res => cv.toBlob(res, 'image/jpeg', 0.1))
      setResult({ blob: best, filename: getOutputFilename(file.name, 'jpg') })
    } catch (e) { setError(e.message) } setProcessing(false)
  }

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
  if (result) return <ResultBlock blob={result.blob} filename={result.filename} lang={lang} onReset={() => setResult(null)} />

  return (
    <div className="space-y-4">
      <div><label className="block text-sm font-medium text-[#111111] dark:text-[#FAFAFA] mb-2">{L(lang, 'Target File Size', 'Taille cible', 'الحجم المستهدف')}: {targetKB} KB</label><input type="range" min="10" max="5000" step="10" value={targetKB} onChange={e => setTargetKB(parseInt(e.target.value))} className="w-full accent-blue-600 cursor-pointer" /><p className="text-xs text-[#6B7280] dark:text-[#A1A1AA] mt-1">{L(lang, 'Original size', 'Taille originale', 'الحجم الأصلي')}: {formatFileSize(file.size)}</p></div>
      <button onClick={handleTarget} disabled={processing} className="btn-primary w-full justify-center py-3.5 text-sm disabled:opacity-50">{processing ? <><Loader2 className="w-4 h-4 animate-spin" /> {L(lang, 'Optimizing...', 'Optimisation...', 'جارٍ التحسين...')}</> : L(lang, 'Compress to Target', 'Compresser à la cible', 'ضغط للحجم المستهدف')}</button>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  )
}

/* 8. TRANSPARENCY EDITOR */
export function TransparencyEditor({ file, lang }) {
  const { img, width, height, loading } = useImageLoader(file)
  const [opacity, setOpacity] = useState(100); const [removeBg, setRemoveBg] = useState(false)
  const [bgThreshold, setBgThreshold] = useState(30); const [bgColor, setBgColor] = useState('#ffffff')
  const [result, setResult] = useState(null); const [processing, setProcessing] = useState(false)
  const canvasRef = useRef(null)

  useEffect(() => {
    if (!img || !canvasRef.current) return
    const canvas = canvasRef.current; canvas.width=width; canvas.height=height
    const ctx = canvas.getContext('2d'); ctx.clearRect(0,0,width,height)
    ctx.globalAlpha = removeBg ? 1 : opacity/100; ctx.drawImage(img,0,0); ctx.globalAlpha=1
    if (removeBg) {
      const imageData = ctx.getImageData(0,0,width,height); const data = imageData.data; const bg = hexToRgb(bgColor)
      for (let i=0; i<data.length; i+=4) {
        const dist = Math.sqrt((data[i]-bg.r)**2+(data[i+1]-bg.g)**2+(data[i+2]-bg.b)**2)
        if (dist<bgThreshold) data[i+3]=0; else if (dist<bgThreshold+20) data[i+3]=Math.round(data[i+3]*(dist-bgThreshold)/20)
      }
      ctx.putImageData(imageData,0,0)
    }
  }, [img, width, height, opacity, removeBg, bgThreshold, bgColor])

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
  if (result) return <ResultBlock blob={result.blob} filename={result.filename} lang={lang} onReset={() => setResult(null)} />

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-[#E5E7EB] dark:border-[#27272A] overflow-hidden p-4 flex justify-center" style={{ background:'repeating-conic-gradient(#e5e7eb 0% 25%, transparent 0% 50%) 50% / 20px 20px' }}>
        <canvas ref={canvasRef} className="max-w-full max-h-[400px] rounded-lg" />
      </div>
      <div><label className="block text-sm font-medium text-[#111111] dark:text-[#FAFAFA] mb-2">{L(lang, 'Opacity', 'Opacité', 'الشفافية')}: {opacity}%</label><input type="range" min="0" max="100" value={opacity} onChange={e => setOpacity(parseInt(e.target.value))} className="w-full accent-blue-600 cursor-pointer" /></div>
      <div className="flex items-center gap-2"><input type="checkbox" id="rm-bg" checked={removeBg} onChange={e => setRemoveBg(e.target.checked)} className="accent-blue-600" /><label htmlFor="rm-bg" className="text-sm font-medium text-[#111111] dark:text-[#FAFAFA]">{L(lang, 'Remove Background Color', 'Supprimer la couleur de fond', 'إزالة لون الخلفية')}</label></div>
      {removeBg && (<><div className="flex items-center gap-2"><input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)} className="w-12 h-9 rounded-lg border border-[#E5E7EB] dark:border-[#27272A] cursor-pointer bg-transparent" /><span className="text-sm text-[#6B7280] dark:text-[#A1A1AA]">{L(lang, 'Background to remove', 'Fond à supprimer', 'الخلفية المراد إزالتها')}</span></div><div><label className="block text-sm font-medium text-[#111111] dark:text-[#FAFAFA] mb-2">{L(lang, 'Tolerance', 'Tolérance', 'التحمل')}: {bgThreshold}</label><input type="range" min="5" max="100" value={bgThreshold} onChange={e => setBgThreshold(parseInt(e.target.value))} className="w-full accent-blue-600 cursor-pointer" /></div></>)}
      <button onClick={() => { setProcessing(true); canvasRef.current.toBlob(b => { setResult({ blob:b, filename:getOutputFilename(file.name,'png') }); setProcessing(false) }, 'image/png') }} disabled={processing} className="btn-primary w-full justify-center py-3.5 text-sm disabled:opacity-50">{processing ? <><Loader2 className="w-4 h-4 animate-spin" /> {L(lang, 'Processing...', 'Traitement...', 'جارٍ المعالجة...')}</> : L(lang, 'Apply & Download', 'Appliquer & Télécharger', 'تطبيق وتحميل')}</button>
    </div>
  )
}

/* 9. IMAGE UPSCALER */
export function ImageUpscalerEditor({ file, lang }) {
  const { img, width, height, loading } = useImageLoader(file)
  const [scale, setScale] = useState(2); const [smoothing, setSmoothing] = useState('high')
  const [result, setResult] = useState(null); const [processing, setProcessing] = useState(false)

  const handleUpscale = async () => {
    setProcessing(true)
    try {
      const nw=Math.round(width*scale), nh=Math.round(height*scale)
      const cv=document.createElement('canvas'); cv.width=nw; cv.height=nh
      const ctx=cv.getContext('2d'); ctx.imageSmoothingEnabled=smoothing!=='off'; ctx.imageSmoothingQuality=smoothing
      if (file.type==='image/jpeg'||file.type==='image/jpg') { ctx.fillStyle='#FFFFFF'; ctx.fillRect(0,0,nw,nh) }
      ctx.drawImage(img,0,0,nw,nh)
      setResult({ blob: await new Promise(res => cv.toBlob(res, file.type||'image/png', 0.92)), filename: getOutputFilename(file.name, file.type==='image/jpeg'?'jpg':'png') })
    } catch (e) {} setProcessing(false)
  }

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
  if (result) return <ResultBlock blob={result.blob} filename={result.filename} lang={lang} onReset={() => setResult(null)} />

  return (
    <div className="space-y-4">
      <div><label className="block text-sm font-medium text-[#111111] dark:text-[#FAFAFA] mb-2">{L(lang, 'Scale Factor', 'Facteur d\'échelle', 'معامل التكبير')}: {scale}x</label><input type="range" min="1.5" max="4" step="0.5" value={scale} onChange={e => setScale(parseFloat(e.target.value))} className="w-full accent-blue-600 cursor-pointer" /><p className="text-xs text-[#6B7280] dark:text-[#A1A1AA] mt-1">{width}x{height} {'->'} {Math.round(width*scale)}x{Math.round(height*scale)}</p></div>
      <div><label className="block text-sm font-medium text-[#111111] dark:text-[#FAFAFA] mb-2">{L(lang, 'Smoothing', 'Lissage', 'تنعيم')}</label><select value={smoothing} onChange={e => setSmoothing(e.target.value)} className="input-field"><option value="high">{L(lang,'High Quality','Haute qualité','جودة عالية')}</option><option value="medium">{L(lang,'Medium','Moyen','متوسط')}</option><option value="low">{L(lang,'Low','Bas','منخفض')}</option><option value="off">{L(lang,'Off (Nearest Neighbor)','Désactivé','إيقاف')}</option></select></div>
      <button onClick={handleUpscale} disabled={processing} className="btn-primary w-full justify-center py-3.5 text-sm disabled:opacity-50">{processing ? <><Loader2 className="w-4 h-4 animate-spin" /> {L(lang, 'Upscaling...', 'Agrandissement...', 'جارٍ التكبير...')}</> : L(lang, 'Upscale & Download', 'Agrandir & Télécharger', 'تكبير وتحميل')}</button>
    </div>
  )
}

/* 10. ASPECT RATIO CONVERTER */
export function AspectRatioEditor({ file, lang }) {
  const { img, width, height, loading } = useImageLoader(file)
  const [ratio, setRatio] = useState('16:9'); const [mode, setMode] = useState('crop'); const [bgColor, setBgColor] = useState('#ffffff')
  const [result, setResult] = useState(null); const [processing, setProcessing] = useState(false)
  const ratios = { '1:1':1, '4:3':4/3, '3:2':3/2, '16:9':16/9, '9:16':9/16, '2:1':2, '21:9':21/9, '3:4':3/4 }

  const handleConvert = async () => {
    setProcessing(true)
    try {
      const tr = ratios[ratio]; let nw=width, nh=height
      if (mode==='pad') { if (width/height>tr) nh=Math.round(width/tr); else nw=Math.round(height*tr) } else { if (width/height>tr) nw=Math.round(height*tr); else nh=Math.round(width/tr) }
      const cv=document.createElement('canvas'); cv.width=nw; cv.height=nh; const ctx=cv.getContext('2d')
      if (mode==='pad') { ctx.fillStyle=bgColor; ctx.fillRect(0,0,nw,nh); ctx.drawImage(img, Math.round((nw-width)/2), Math.round((nh-height)/2)) } else { let sx=0,sy=0,sw=width,sh=height; if (width/height>tr) { sw=Math.round(height*tr); sx=Math.round((width-sw)/2) } else { sh=Math.round(width/tr); sy=Math.round((height-sh)/2) } ctx.drawImage(img,sx,sy,sw,sh,0,0,nw,nh) }
      setResult({ blob: await new Promise(res => cv.toBlob(res, 'image/jpeg', 0.92)), filename: getOutputFilename(file.name, 'jpg') })
    } catch (e) {} setProcessing(false)
  }

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
  if (result) return <ResultBlock blob={result.blob} filename={result.filename} lang={lang} onReset={() => setResult(null)} />

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-2">{Object.keys(ratios).map(r => (<button key={r} onClick={() => setRatio(r)} className={`py-2.5 rounded-xl text-sm font-medium ${ratio===r?'bg-blue-600 text-white':'border border-[#E5E7EB] dark:border-[#27272A] text-[#6B7280] dark:text-[#A1A1AA]'}`}>{r}</button>))}</div>
      <div className="flex gap-2"><button onClick={() => setMode('crop')} className={`flex-1 py-2.5 rounded-xl text-sm font-medium ${mode==='crop'?'bg-blue-600 text-white':'border border-[#E5E7EB] dark:border-[#27272A] text-[#6B7280] dark:text-[#A1A1AA]'}`}>{L(lang,'Crop','Recadrer','قص')}</button><button onClick={() => setMode('pad')} className={`flex-1 py-2.5 rounded-xl text-sm font-medium ${mode==='pad'?'bg-blue-600 text-white':'border border-[#E5E7EB] dark:border-[#27272A] text-[#6B7280] dark:text-[#A1A1AA]'}`}>{L(lang,'Pad','Remplir','ملء')}</button></div>
      {mode==='pad' && <div className="flex items-center gap-2"><input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)} className="w-12 h-9 rounded-lg border border-[#E5E7EB] dark:border-[#27272A] cursor-pointer bg-transparent" /><span className="text-sm text-[#6B7280] dark:text-[#A1A1AA]">{L(lang,'Background','Fond','الخلفية')}</span></div>}
      <button onClick={handleConvert} disabled={processing} className="btn-primary w-full justify-center py-3.5 text-sm disabled:opacity-50">{processing ? <><Loader2 className="w-4 h-4 animate-spin" /> {L(lang, 'Converting...', 'Conversion...', 'جارٍ التحويل...')}</> : L(lang, 'Convert & Download', 'Convertir & Télécharger', 'تحويل وتحميل')}</button>
    </div>
  )
}

/* 11. DPI CONVERTER */
function crc32(type, data) {
  let crc=0xFFFFFFFF; const table=[]; for (let n=0;n<256;n++) { let c=n; for (let k=0;k<8;k++) c=(c&1)?(0xEDB88320^(c>>>1)):(c>>>1); table[n]=c }
  const all=[...type,...data]; for (const b of all) crc=table[(crc^b)&0xFF]^(crc>>>8); return (crc^0xFFFFFFFF)>>>0
}
export function DpiConverterEditor({ file, lang }) {
  const { img, width, height, loading } = useImageLoader(file)
  const [dpi, setDpi] = useState(300); const [result, setResult] = useState(null); const [processing, setProcessing] = useState(false)

  const handleConvert = async () => {
    setProcessing(true)
    try {
      const cv=document.createElement('canvas'); cv.width=width; cv.height=height; cv.getContext('2d').drawImage(img,0,0)
      const blob = await new Promise(res => cv.toBlob(res, 'image/png'))
      const buf = await blob.arrayBuffer()
      const ihdrEnd=33; const ppm=Math.round(dpi/0.0254)
      const physData=new Uint8Array(9); const pv=new DataView(physData.buffer); pv.setUint32(0,ppm); pv.setUint32(4,ppm); physData[8]=1
      const chunkLen=new Uint8Array(4); new DataView(chunkLen.buffer).setUint32(0,9)
      const chunkType=new TextEncoder().encode('pHYs'); const crc=crc32(chunkType, physData)
      const crcData=new Uint8Array(4); new DataView(crcData.buffer).setUint32(0, crc>>>0)
      const newBuf=new Uint8Array(buf.byteLength+4+4+9+4)
      newBuf.set(new Uint8Array(buf.slice(0,ihdrEnd)),0); let off=ihdrEnd
      newBuf.set(chunkLen,off);off+=4; newBuf.set(chunkType,off);off+=4; newBuf.set(physData,off);off+=9; newBuf.set(crcData,off);off+=4
      newBuf.set(new Uint8Array(buf.slice(ihdrEnd)),off)
      setResult({ blob: new Blob([newBuf], { type:'image/png' }), filename: getOutputFilename(file.name, 'png') })
    } catch (e) {} setProcessing(false)
  }

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
  if (result) return <ResultBlock blob={result.blob} filename={result.filename} lang={lang} onReset={() => setResult(null)} />

  return (
    <div className="space-y-4">
      <div><label className="block text-sm font-medium text-[#111111] dark:text-[#FAFAFA] mb-2">{L(lang, 'DPI', 'PPP', 'DPI')}: {dpi}</label><input type="range" min="72" max="600" step="1" value={dpi} onChange={e => setDpi(parseInt(e.target.value))} className="w-full accent-blue-600 cursor-pointer" /></div>
      <div className="p-3 rounded-xl border border-[#E5E7EB] dark:border-[#27272A] text-sm text-[#6B7280] dark:text-[#A1A1AA] space-y-1"><p>{L(lang, 'Pixel dimensions', 'Dimensions en pixels', 'أبعاد البكسل')}: {width}x{height}px</p><p>{L(lang, 'Physical size', 'Taille physique', 'الحجم الفعلي')}: {(width/dpi*25.4).toFixed(1)}x{(height/dpi*25.4).toFixed(1)}mm</p><p>{L(lang, 'at', 'à', 'عند')} {dpi} DPI</p></div>
      <button onClick={handleConvert} disabled={processing} className="btn-primary w-full justify-center py-3.5 text-sm disabled:opacity-50">{processing ? <><Loader2 className="w-4 h-4 animate-spin" /> {L(lang, 'Converting...', 'Conversion...', 'جارٍ التحويل...')}</> : L(lang, 'Set DPI & Download', 'Définir PPP & Télécharger', 'ضبط DPI والتحميل')}</button>
    </div>
  )
}

/* 12. ADD SHADOW */
export function AddShadowEditor({ file, lang }) {
  const { img, width, height, loading } = useImageLoader(file)
  const [blur, setBlur] = useState(20); const [offsetX, setOffsetX] = useState(10); const [offsetY, setOffsetY] = useState(10)
  const [color, setColor] = useState('#000000'); const [result, setResult] = useState(null); const [processing, setProcessing] = useState(false)

  const handleApply = async () => {
    setProcessing(true)
    try {
      const pad=Math.max(blur, Math.abs(offsetX), Math.abs(offsetY))+10
      const cv=document.createElement('canvas'); cv.width=width+pad*2; cv.height=height+pad*2
      const ctx=cv.getContext('2d'); ctx.shadowColor=color; ctx.shadowBlur=blur; ctx.shadowOffsetX=offsetX; ctx.shadowOffsetY=offsetY
      ctx.drawImage(img, pad, pad)
      setResult({ blob: await new Promise(res => cv.toBlob(res, 'image/png')), filename: getOutputFilename(file.name, 'png') })
    } catch (e) {} setProcessing(false)
  }

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
  if (result) return <ResultBlock blob={result.blob} filename={result.filename} lang={lang} onReset={() => setResult(null)} />

  return (
    <div className="space-y-4">
      <div><label className="block text-sm font-medium text-[#111111] dark:text-[#FAFAFA] mb-2">{L(lang, 'Blur', 'Flou', 'ضبابية')}: {blur}px</label><input type="range" min="0" max="50" value={blur} onChange={e => setBlur(parseInt(e.target.value))} className="w-full accent-blue-600 cursor-pointer" /></div>
      <div><label className="block text-sm font-medium text-[#111111] dark:text-[#FAFAFA] mb-2">{L(lang, 'Offset X', 'Décalage X', 'إزاحة X')}: {offsetX}px</label><input type="range" min="-50" max="50" value={offsetX} onChange={e => setOffsetX(parseInt(e.target.value))} className="w-full accent-blue-600 cursor-pointer" /></div>
      <div><label className="block text-sm font-medium text-[#111111] dark:text-[#FAFAFA] mb-2">{L(lang, 'Offset Y', 'Décalage Y', 'إزاحة Y')}: {offsetY}px</label><input type="range" min="-50" max="50" value={offsetY} onChange={e => setOffsetY(parseInt(e.target.value))} className="w-full accent-blue-600 cursor-pointer" /></div>
      <div className="flex items-center gap-2"><input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-12 h-9 rounded-lg border border-[#E5E7EB] dark:border-[#27272A] cursor-pointer bg-transparent" /><span className="text-sm text-[#6B7280] dark:text-[#A1A1AA]">{L(lang, 'Shadow Color', 'Couleur de l\'ombre', 'لون الظل')}</span></div>
      <button onClick={handleApply} disabled={processing} className="btn-primary w-full justify-center py-3.5 text-sm disabled:opacity-50">{processing ? <><Loader2 className="w-4 h-4 animate-spin" /> {L(lang, 'Adding shadow...', 'Ajout de l\'ombre...', 'إضافة الظل...')}</> : L(lang, 'Add Shadow & Download', 'Ajouter l\'ombre & Télécharger', 'إضافة ظل وتحميل')}</button>
    </div>
  )
}

/* 13. GLOW EFFECT */
export function GlowEffectEditor({ file, lang }) {
  const { img, width, height, loading } = useImageLoader(file)
  const [radius, setRadius] = useState(30); const [intensity, setIntensity] = useState(50); const [color, setColor] = useState('#ffffff')
  const [result, setResult] = useState(null); const [processing, setProcessing] = useState(false)

  const handleApply = async () => {
    setProcessing(true)
    try {
      const pad=radius*2; const cv=document.createElement('canvas'); cv.width=width+pad*2; cv.height=height+pad*2
      const ctx=cv.getContext('2d')
      ctx.shadowColor=color; ctx.shadowBlur=radius; ctx.globalAlpha=intensity/100
      ctx.drawImage(img,pad,pad); ctx.shadowBlur=radius*0.6; ctx.drawImage(img,pad,pad); ctx.shadowBlur=radius*0.3; ctx.drawImage(img,pad,pad)
      ctx.globalAlpha=1; ctx.shadowBlur=0; ctx.drawImage(img,pad,pad)
      setResult({ blob: await new Promise(res => cv.toBlob(res, 'image/png')), filename: getOutputFilename(file.name, 'png') })
    } catch (e) {} setProcessing(false)
  }

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
  if (result) return <ResultBlock blob={result.blob} filename={result.filename} lang={lang} onReset={() => setResult(null)} />

  return (
    <div className="space-y-4">
      <div><label className="block text-sm font-medium text-[#111111] dark:text-[#FAFAFA] mb-2">{L(lang, 'Glow Radius', 'Rayon du halo', 'نصف القطر')}: {radius}px</label><input type="range" min="5" max="100" value={radius} onChange={e => setRadius(parseInt(e.target.value))} className="w-full accent-blue-600 cursor-pointer" /></div>
      <div><label className="block text-sm font-medium text-[#111111] dark:text-[#FAFAFA] mb-2">{L(lang, 'Intensity', 'Intensité', 'الكثافة')}: {intensity}%</label><input type="range" min="0" max="100" value={intensity} onChange={e => setIntensity(parseInt(e.target.value))} className="w-full accent-blue-600 cursor-pointer" /></div>
      <div className="flex items-center gap-2"><input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-12 h-9 rounded-lg border border-[#E5E7EB] dark:border-[#27272A] cursor-pointer bg-transparent" /><span className="text-sm text-[#6B7280] dark:text-[#A1A1AA]">{L(lang, 'Glow Color', 'Couleur du halo', 'لون التوهج')}</span></div>
      <button onClick={handleApply} disabled={processing} className="btn-primary w-full justify-center py-3.5 text-sm disabled:opacity-50">{processing ? <><Loader2 className="w-4 h-4 animate-spin" /> {L(lang, 'Applying glow...', 'Application du halo...', 'تطبيق التوهج...')}</> : L(lang, 'Apply Glow & Download', 'Appliquer le halo & Télécharger', 'تطبيق التوهج والتحميل')}</button>
    </div>
  )
}

/* 14. COLOR REPLACEMENT */
export function ColorReplacementEditor({ file, lang }) {
  const { img, width, height, loading } = useImageLoader(file)
  const [fromColor, setFromColor] = useState('#ff0000'); const [toColor, setToColor] = useState('#00ff00')
  const [threshold, setThreshold] = useState(50); const [result, setResult] = useState(null); const [processing, setProcessing] = useState(false)

  const handleApply = async () => {
    setProcessing(true)
    try {
      const cv=document.createElement('canvas'); cv.width=width; cv.height=height; const ctx=cv.getContext('2d'); ctx.drawImage(img,0,0)
      const imageData=ctx.getImageData(0,0,width,height); const data=imageData.data; const from=hexToRgb(fromColor); const to=hexToRgb(toColor)
      for (let i=0; i<data.length; i+=4) {
        const dist=Math.sqrt((data[i]-from.r)**2+(data[i+1]-from.g)**2+(data[i+2]-from.b)**2)
        if (dist<threshold) { const b=1-dist/threshold; data[i]=clamp(data[i]*(1-b)+to.r*b,0,255); data[i+1]=clamp(data[i+1]*(1-b)+to.g*b,0,255); data[i+2]=clamp(data[i+2]*(1-b)+to.b*b,0,255) }
      }
      ctx.putImageData(imageData,0,0)
      setResult({ blob: await new Promise(res => cv.toBlob(res, file.type||'image/png', 0.92)), filename: getOutputFilename(file.name, file.type==='image/jpeg'?'jpg':'png') })
    } catch (e) {} setProcessing(false)
  }

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
  if (result) return <ResultBlock blob={result.blob} filename={result.filename} lang={lang} onReset={() => setResult(null)} />

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2"><div className="flex-1"><label className="block text-sm font-medium text-[#111111] dark:text-[#FAFAFA] mb-2">{L(lang, 'From', 'De', 'من')}</label><input type="color" value={fromColor} onChange={e => setFromColor(e.target.value)} className="w-full h-10 rounded-lg border border-[#E5E7EB] dark:border-[#27272A] cursor-pointer bg-transparent" /></div><div className="flex-1"><label className="block text-sm font-medium text-[#111111] dark:text-[#FAFAFA] mb-2">{L(lang, 'To', 'Vers', 'إلى')}</label><input type="color" value={toColor} onChange={e => setToColor(e.target.value)} className="w-full h-10 rounded-lg border border-[#E5E7EB] dark:border-[#27272A] cursor-pointer bg-transparent" /></div></div>
      <div><label className="block text-sm font-medium text-[#111111] dark:text-[#FAFAFA] mb-2">{L(lang, 'Tolerance', 'Tolérance', 'التحمل')}: {threshold}</label><input type="range" min="1" max="150" value={threshold} onChange={e => setThreshold(parseInt(e.target.value))} className="w-full accent-blue-600 cursor-pointer" /></div>
      <button onClick={handleApply} disabled={processing} className="btn-primary w-full justify-center py-3.5 text-sm disabled:opacity-50">{processing ? <><Loader2 className="w-4 h-4 animate-spin" /> {L(lang, 'Replacing...', 'Remplacement...', 'جارٍ الاستبدال...')}</> : L(lang, 'Replace & Download', 'Remplacer & Télécharger', 'استبدال وتحميل')}</button>
    </div>
  )
}

/* 15. COLLAGE MAKER */
export function CollageMakerEditor({ file, lang }) {
  const [files, setFiles] = useState([file]); const [layout, setLayout] = useState('2x2'); const [gap, setGap] = useState(4)
  const [bgColor, setBgColor] = useState('#ffffff'); const [result, setResult] = useState(null); const [processing, setProcessing] = useState(false)
  const layouts = { '1x2':{cols:1,rows:2,label:'1x2'}, '2x1':{cols:2,rows:1,label:'2x1'}, '2x2':{cols:2,rows:2,label:'2x2'}, '1x3':{cols:1,rows:3,label:'1x3'}, '3x1':{cols:3,rows:1,label:'3x1'}, '2x3':{cols:2,rows:3,label:'2x3'}, '3x2':{cols:3,rows:2,label:'3x2'} }

  const handleMake = async () => {
    setProcessing(true)
    try {
      const l=layouts[layout]; const images=await Promise.all(files.map(f => new Promise(res => { const url=URL.createObjectURL(f); const img=new Image(); img.onload=()=>{URL.revokeObjectURL(url);res(img)}; img.onerror=()=>{URL.revokeObjectURL(url);res(null)}; img.src=url })))
      const valid=images.filter(Boolean); const cellSize=400
      const cw=l.cols*(cellSize+gap)+gap; const ch=l.rows*(cellSize+gap)+gap
      const cv=document.createElement('canvas'); cv.width=cw; cv.height=ch; const ctx=cv.getContext('2d'); ctx.fillStyle=bgColor; ctx.fillRect(0,0,cw,ch)
      valid.forEach((img,i) => { const col=i%l.cols, row=Math.floor(i/l.cols); const x=col*(cellSize+gap)+gap, y=row*(cellSize+gap)+gap; const r=Math.max(cellSize/img.naturalWidth, cellSize/img.naturalHeight); const dw=img.naturalWidth*r, dh=img.naturalHeight*r; ctx.drawImage(img, x+(cellSize-dw)/2, y+(cellSize-dh)/2, dw, dh) })
      setResult({ blob: await new Promise(res => cv.toBlob(res, 'image/jpeg', 0.92)), filename: 'collage.jpg' })
    } catch (e) {} setProcessing(false)
  }

  if (result) return <ResultBlock blob={result.blob} filename={result.filename} lang={lang} onReset={() => setResult(null)} />

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-2">{Object.entries(layouts).map(([key, l]) => (<button key={key} onClick={() => setLayout(key)} className={`py-2 rounded-xl text-sm font-medium ${layout===key?'bg-blue-600 text-white':'border border-[#E5E7EB] dark:border-[#27272A] text-[#6B7280] dark:text-[#A1A1AA]'}`}>{l.label}</button>))}</div>
      <div><label className="block text-sm font-medium text-[#111111] dark:text-[#FAFAFA] mb-2">{L(lang, 'Gap', 'Espacement', 'فجوة')}: {gap}px</label><input type="range" min="0" max="20" value={gap} onChange={e => setGap(parseInt(e.target.value))} className="w-full accent-blue-600 cursor-pointer" /></div>
      <div className="flex items-center gap-2"><input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)} className="w-12 h-9 rounded-lg border border-[#E5E7EB] dark:border-[#27272A] cursor-pointer bg-transparent" /><span className="text-sm text-[#6B7280] dark:text-[#A1A1AA]">{L(lang,'Background','Fond','الخلفية')}</span></div>
      <div className="space-y-2"><p className="text-sm font-medium text-[#111111] dark:text-[#FAFAFA]">{L(lang,'Images','Images','صور')} ({files.length})</p>{files.map((f,i) => (<div key={i} className="flex items-center justify-between p-2 rounded-lg border border-[#E5E7EB] dark:border-[#27272A]"><span className="text-xs text-[#6B7280] dark:text-[#A1A1AA] truncate">{f.name}</span><button onClick={() => setFiles(prev => prev.filter((_,j) => j!==i))} className="text-red-500 p-1"><X className="w-4 h-4" /></button></div>))}<label className="flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-[#E5E7EB] dark:border-[#27272A] text-sm text-[#6B7280] dark:text-[#A1A1AA] cursor-pointer hover:border-blue-300 transition-colors"><Plus className="w-4 h-4" /> {L(lang,'Add more images','Ajouter des images','إضافة المزيد من الصور')}<input type="file" accept="image/*" multiple className="hidden" onChange={e => setFiles(prev => [...prev, ...Array.from(e.target.files)].slice(0,9))} /></label></div>
      <button onClick={handleMake} disabled={processing||files.length<2} className="btn-primary w-full justify-center py-3.5 text-sm disabled:opacity-50">{processing ? <><Loader2 className="w-4 h-4 animate-spin" /> {L(lang,'Creating collage...','Création...','جارٍ الإنشاء...')}</> : L(lang,'Create Collage','Créer le collage','إنشاء كولاج')}</button>
    </div>
  )
}

/* 16. CONTACT SHEET */
export function ContactSheetEditor({ file, lang }) {
  const [files, setFiles] = useState([file]); const [cols, setCols] = useState(4); const [thumbSize, setThumbSize] = useState(200)
  const [result, setResult] = useState(null); const [processing, setProcessing] = useState(false)

  const handleMake = async () => {
    setProcessing(true)
    try {
      const images=await Promise.all(files.map(f => new Promise(res => { const url=URL.createObjectURL(f); const img=new Image(); img.onload=()=>{URL.revokeObjectURL(url);res({img,name:f.name})}; img.onerror=()=>{URL.revokeObjectURL(url);res(null)}; img.src=url })))
      const valid=images.filter(Boolean); const rows=Math.ceil(valid.length/cols); const labelH=20
      const cw=cols*(thumbSize+8)+8; const ch=rows*(thumbSize+8+labelH)+8
      const cv=document.createElement('canvas'); cv.width=cw; cv.height=ch; const ctx=cv.getContext('2d'); ctx.fillStyle='#f0f0f0'; ctx.fillRect(0,0,cw,ch); ctx.font='10px Inter, sans-serif'; ctx.fillStyle='#333'
      valid.forEach((item,i) => { const col=i%cols, row=Math.floor(i/cols); const x=col*(thumbSize+8)+8, y=row*(thumbSize+8+labelH)+8; ctx.fillStyle='#fff'; ctx.fillRect(x,y,thumbSize,thumbSize); const r=Math.max(thumbSize/item.img.naturalWidth, thumbSize/item.img.naturalHeight); const dw=item.img.naturalWidth*r, dh=item.img.naturalHeight*r; ctx.drawImage(item.img, x+(thumbSize-dw)/2, y+(thumbSize-dh)/2, dw, dh); ctx.fillStyle='#333'; ctx.fillText(item.name.substring(0,25), x+2, y+thumbSize+14) })
      setResult({ blob: await new Promise(res => cv.toBlob(res, 'image/jpeg', 0.92)), filename: 'contact-sheet.jpg' })
    } catch (e) {} setProcessing(false)
  }

  if (result) return <ResultBlock blob={result.blob} filename={result.filename} lang={lang} onReset={() => setResult(null)} />

  return (
    <div className="space-y-4">
      <div><label className="block text-sm font-medium text-[#111111] dark:text-[#FAFAFA] mb-2">{L(lang,'Columns','Colonnes','أعمدة')}: {cols}</label><input type="range" min="2" max="8" value={cols} onChange={e => setCols(parseInt(e.target.value))} className="w-full accent-blue-600 cursor-pointer" /></div>
      <div><label className="block text-sm font-medium text-[#111111] dark:text-[#FAFAFA] mb-2">{L(lang,'Thumbnail Size','Taille des vignettes','حجم الصورة المصغرة')}: {thumbSize}px</label><input type="range" min="100" max="400" step="50" value={thumbSize} onChange={e => setThumbSize(parseInt(e.target.value))} className="w-full accent-blue-600 cursor-pointer" /></div>
      <div><label className="block text-sm font-medium text-[#111111] dark:text-[#FAFAFA] mb-2">{L(lang,'Images','Images','صور')} ({files.length})</label><label className="flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-[#E5E7EB] dark:border-[#27272A] text-sm text-[#6B7280] dark:text-[#A1A1AA] cursor-pointer hover:border-blue-300 transition-colors"><Plus className="w-4 h-4" /> {L(lang,'Add more images','Ajouter des images','إضافة المزيد من الصور')}<input type="file" accept="image/*" multiple className="hidden" onChange={e => setFiles(prev => [...prev, ...Array.from(e.target.files)])} /></label></div>
      <button onClick={handleMake} disabled={processing||files.length<1} className="btn-primary w-full justify-center py-3.5 text-sm disabled:opacity-50">{processing ? <><Loader2 className="w-4 h-4 animate-spin" /> {L(lang,'Creating...','Création...','جارٍ الإنشاء...')}</> : L(lang,'Create Contact Sheet','Créer la planche-contact','إنشاء ورقة الاتصال')}</button>
    </div>
  )
}

/* 17. PLACEHOLDER GENERATOR */
export function PlaceholderGeneratorEditor({ lang }) {
  const [w, setW] = useState(800); const [h, setH] = useState(600); const [bgColor, setBgColor] = useState('#cccccc')
  const [textColor, setTextColor] = useState('#333333'); const [text, setText] = useState('')
  const [result, setResult] = useState(null); const [processing, setProcessing] = useState(false)

  const handleGenerate = async () => {
    setProcessing(true)
    try {
      const cv=document.createElement('canvas'); cv.width=w; cv.height=h; const ctx=cv.getContext('2d')
      ctx.fillStyle=bgColor; ctx.fillRect(0,0,w,h); const dt=text||`${w}x${h}`; const fs=Math.min(w,h)/8
      ctx.font=`bold ${fs}px Inter, sans-serif`; ctx.fillStyle=textColor; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(dt, w/2, h/2)
      setResult({ blob: await new Promise(res => cv.toBlob(res, 'image/png')), filename: `placeholder_${w}x${h}.png` })
    } catch (e) {} setProcessing(false)
  }

  if (result) return <ResultBlock blob={result.blob} filename={result.filename} lang={lang} onReset={() => setResult(null)} />

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3"><div><label className="block text-sm font-medium text-[#111111] dark:text-[#FAFAFA] mb-2">{L(lang,'Width','Largeur','عرض')}: {w}px</label><input type="number" min="16" max="4096" value={w} onChange={e => setW(parseInt(e.target.value)||800)} className="input-field" /></div><div><label className="block text-sm font-medium text-[#111111] dark:text-[#FAFAFA] mb-2">{L(lang,'Height','Hauteur','ارتفاع')}: {h}px</label><input type="number" min="16" max="4096" value={h} onChange={e => setH(parseInt(e.target.value)||600)} className="input-field" /></div></div>
      <div className="grid grid-cols-2 gap-3"><div><label className="block text-sm font-medium text-[#111111] dark:text-[#FAFAFA] mb-2">{L(lang,'Background','Fond','الخلفية')}</label><input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)} className="w-full h-10 rounded-lg border border-[#E5E7EB] dark:border-[#27272A] cursor-pointer bg-transparent" /></div><div><label className="block text-sm font-medium text-[#111111] dark:text-[#FAFAFA] mb-2">{L(lang,'Text Color','Couleur du texte','لون النص')}</label><input type="color" value={textColor} onChange={e => setTextColor(e.target.value)} className="w-full h-10 rounded-lg border border-[#E5E7EB] dark:border-[#27272A] cursor-pointer bg-transparent" /></div></div>
      <div><label className="block text-sm font-medium text-[#111111] dark:text-[#FAFAFA] mb-2">{L(lang,'Text (optional)','Texte (optionnel)','نص (اختياري)')}</label><input type="text" value={text} onChange={e => setText(e.target.value)} placeholder={L(lang,'e.g. 800x600 or your text','ex: 800x600 ou votre texte','مثال: 800x600 أو نصك')} className="input-field" /></div>
      <button onClick={handleGenerate} disabled={processing} className="btn-primary w-full justify-center py-3.5 text-sm disabled:opacity-50">{processing ? <><Loader2 className="w-4 h-4 animate-spin" /> {L(lang,'Generating...','Génération...','جارٍ التوليد...')}</> : L(lang,'Generate Placeholder','Générer le placeholder','توليد صورة العنصر النائب')}</button>
    </div>
  )
}
