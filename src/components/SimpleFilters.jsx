/**
 * SimpleFilters.jsx — 9 pixel-manipulation image tools with region selection.
 * All reuse RegionToolEditor from RegionTools.jsx.
 *
 * Tools: Sepia, Posterize, Threshold, Duotone, Noise Generator,
 *        Denoise, Edge Detection, Emboss, Sketch Effect
 */

import { RegionToolEditor, getLabels } from './RegionTools.jsx'

const clamp = (v, min, max) => Math.max(min, Math.min(max, v))

/* ═══ Sepia ═══ */
function sepiaRegion(ctx, region, params) {
  let { x, y, w, h } = region
  x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h)
  if (w < 1 || h < 1) return
  const { intensity = 100 } = params
  const imageData = ctx.getImageData(x, y, w, h)
  const data = imageData.data
  const mix = intensity / 100
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i+1], b = data[i+2]
    const sr = 0.393*r + 0.769*g + 0.189*b
    const sg = 0.349*r + 0.686*g + 0.168*b
    const sb = 0.272*r + 0.534*g + 0.131*b
    data[i]   = clamp(r*(1-mix) + sr*mix, 0, 255)
    data[i+1] = clamp(g*(1-mix) + sg*mix, 0, 255)
    data[i+2] = clamp(b*(1-mix) + sb*mix, 0, 255)
  }
  ctx.putImageData(imageData, x, y)
}
function sepiaFull(ctx, imageData, params) {
  const { intensity = 100 } = params
  const data = imageData.data
  const mix = intensity / 100
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i+1], b = data[i+2]
    data[i]   = clamp(r*(1-mix) + (0.393*r+0.769*g+0.189*b)*mix, 0, 255)
    data[i+1] = clamp(g*(1-mix) + (0.349*r+0.686*g+0.168*b)*mix, 0, 255)
    data[i+2] = clamp(b*(1-mix) + (0.272*r+0.534*g+0.131*b)*mix, 0, 255)
  }
}

/* ═══ Posterize ═══ */
function posterizeRegion(ctx, region, params) {
  let { x, y, w, h } = region
  x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h)
  if (w < 1 || h < 1) return
  const { levels = 4 } = params
  const step = 255 / Math.max(1, levels - 1)
  const imageData = ctx.getImageData(x, y, w, h)
  const data = imageData.data
  for (let i = 0; i < data.length; i += 4) {
    data[i]   = Math.round(data[i] / step) * step
    data[i+1] = Math.round(data[i+1] / step) * step
    data[i+2] = Math.round(data[i+2] / step) * step
  }
  ctx.putImageData(imageData, x, y)
}
function posterizeFull(ctx, imageData, params) {
  const { levels = 4 } = params
  const step = 255 / Math.max(1, levels - 1)
  const data = imageData.data
  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.round(data[i]/step)*step
    data[i+1] = Math.round(data[i+1]/step)*step
    data[i+2] = Math.round(data[i+2]/step)*step
  }
}

/* ═══ Threshold ═══ */
function thresholdRegion(ctx, region, params) {
  let { x, y, w, h } = region
  x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h)
  if (w < 1 || h < 1) return
  const { threshold = 128 } = params
  const imageData = ctx.getImageData(x, y, w, h)
  const data = imageData.data
  for (let i = 0; i < data.length; i += 4) {
    const gray = 0.299*data[i] + 0.587*data[i+1] + 0.114*data[i+2]
    const v = gray >= threshold ? 255 : 0
    data[i] = data[i+1] = data[i+2] = v
  }
  ctx.putImageData(imageData, x, y)
}
function thresholdFull(ctx, imageData, params) {
  const { threshold = 128 } = params
  const data = imageData.data
  for (let i = 0; i < data.length; i += 4) {
    const gray = 0.299*data[i] + 0.587*data[i+1] + 0.114*data[i+2]
    const v = gray >= threshold ? 255 : 0
    data[i] = data[i+1] = data[i+2] = v
  }
}

/* ═══ Duotone ═══ */
function hexToRgb(hex) {
  const m = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i)
  return m ? { r: parseInt(m[1],16), g: parseInt(m[2],16), b: parseInt(m[3],16) } : { r:0, g:0, b:0 }
}
function duotoneRegion(ctx, region, params) {
  let { x, y, w, h } = region
  x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h)
  if (w < 1 || h < 1) return
  const { shadow = '#1a1a2e', highlight = '#e94560' } = params
  const dark = hexToRgb(shadow), light = hexToRgb(highlight)
  const imageData = ctx.getImageData(x, y, w, h)
  const data = imageData.data
  for (let i = 0; i < data.length; i += 4) {
    const gray = (0.299*data[i] + 0.587*data[i+1] + 0.114*data[i+2]) / 255
    data[i]   = clamp(dark.r*(1-gray) + light.r*gray, 0, 255)
    data[i+1] = clamp(dark.g*(1-gray) + light.g*gray, 0, 255)
    data[i+2] = clamp(dark.b*(1-gray) + light.b*gray, 0, 255)
  }
  ctx.putImageData(imageData, x, y)
}
function duotoneFull(ctx, imageData, params) {
  const { shadow = '#1a1a2e', highlight = '#e94560' } = params
  const dark = hexToRgb(shadow), light = hexToRgb(highlight)
  const data = imageData.data
  for (let i = 0; i < data.length; i += 4) {
    const gray = (0.299*data[i] + 0.587*data[i+1] + 0.114*data[i+2]) / 255
    data[i]   = clamp(dark.r*(1-gray) + light.r*gray, 0, 255)
    data[i+1] = clamp(dark.g*(1-gray) + light.g*gray, 0, 255)
    data[i+2] = clamp(dark.b*(1-gray) + light.b*gray, 0, 255)
  }
}

/* ═══ Noise Generator ═══ */
function noiseRegion(ctx, region, params) {
  let { x, y, w, h } = region
  x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h)
  if (w < 1 || h < 1) return
  const { amount = 30 } = params
  const imageData = ctx.getImageData(x, y, w, h)
  const data = imageData.data
  for (let i = 0; i < data.length; i += 4) {
    const n = (Math.random() - 0.5) * 2 * amount
    data[i]   = clamp(data[i] + n, 0, 255)
    data[i+1] = clamp(data[i+1] + n, 0, 255)
    data[i+2] = clamp(data[i+2] + n, 0, 255)
  }
  ctx.putImageData(imageData, x, y)
}
function noiseFull(ctx, imageData, params) {
  const { amount = 30 } = params
  const data = imageData.data
  for (let i = 0; i < data.length; i += 4) {
    const n = (Math.random() - 0.5) * 2 * amount
    data[i] = clamp(data[i] + n, 0, 255)
    data[i+1] = clamp(data[i+1] + n, 0, 255)
    data[i+2] = clamp(data[i+2] + n, 0, 255)
  }
}

/* ═══ Denoise (median filter 3x3) ═══ */
function denoiseRegion(ctx, region, params) {
  let { x, y, w, h } = region
  x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h)
  if (w < 3 || h < 3) return
  const tempCanvas = document.createElement('canvas')
  tempCanvas.width = w; tempCanvas.height = h
  const tctx = tempCanvas.getContext('2d')
  tctx.drawImage(ctx.canvas, x, y, w, h, 0, 0, w, h)
  const src = tctx.getImageData(0, 0, w, h)
  const data = src.data
  const output = new Uint8ClampedArray(data)
  for (let py = 1; py < h - 1; py++) {
    for (let px = 1; px < w - 1; px++) {
      for (let c = 0; c < 3; c++) {
        const vals = []
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            vals.push(data[((py+dy)*w + (px+dx))*4 + c])
          }
        }
        vals.sort((a, b) => a - b)
        output[(py*w + px)*4 + c] = vals[4]
      }
    }
  }
  src.data.set(output)
  tctx.putImageData(src, 0, 0)
  ctx.drawImage(tempCanvas, 0, 0, w, h, x, y, w, h)
}
function denoiseFull(ctx, imageData, params) {
  const { width, height, data } = imageData
  const output = new Uint8ClampedArray(data)
  for (let py = 1; py < height - 1; py++) {
    for (let px = 1; px < width - 1; px++) {
      for (let c = 0; c < 3; c++) {
        const vals = []
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            vals.push(data[((py+dy)*width + (px+dx))*4 + c])
          }
        }
        vals.sort((a, b) => a - b)
        output[(py*width + px)*4 + c] = vals[4]
      }
    }
  }
  imageData.data.set(output)
}

/* ═══ Edge Detection (Sobel) ═══ */
function edgeRegion(ctx, region, params) {
  let { x, y, w, h } = region
  x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h)
  if (w < 3 || h < 3) return
  const tempCanvas = document.createElement('canvas')
  tempCanvas.width = w; tempCanvas.height = h
  const tctx = tempCanvas.getContext('2d')
  tctx.drawImage(ctx.canvas, x, y, w, h, 0, 0, w, h)
  const src = tctx.getImageData(0, 0, w, h)
  const data = src.data
  const output = new Uint8ClampedArray(data.length)
  const gx = [-1,0,1,-2,0,2,-1,0,1]
  const gy = [-1,-2,-1,0,0,0,1,2,1]
  for (let py = 1; py < h - 1; py++) {
    for (let px = 1; px < w - 1; px++) {
      let sx = 0, sy = 0, ki = 0
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const idx = ((py+dy)*w + (px+dx))*4
          const gray = 0.299*data[idx] + 0.587*data[idx+1] + 0.114*data[idx+2]
          sx += gray * gx[ki]
          sy += gray * gy[ki]
          ki++
        }
      }
      const mag = clamp(Math.sqrt(sx*sx + sy*sy), 0, 255)
      const oi = (py*w + px)*4
      output[oi] = output[oi+1] = output[oi+2] = mag
      output[oi+3] = 255
    }
  }
  src.data.set(output)
  tctx.putImageData(src, 0, 0)
  ctx.drawImage(tempCanvas, 0, 0, w, h, x, y, w, h)
}
function edgeFull(ctx, imageData, params) {
  const { width, height, data } = imageData
  const output = new Uint8ClampedArray(data.length)
  const gx = [-1,0,1,-2,0,2,-1,0,1]
  const gy = [-1,-2,-1,0,0,0,1,2,1]
  for (let py = 1; py < height - 1; py++) {
    for (let px = 1; px < width - 1; px++) {
      let sx = 0, sy = 0, ki = 0
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const idx = ((py+dy)*width + (px+dx))*4
          const gray = 0.299*data[idx] + 0.587*data[idx+1] + 0.114*data[idx+2]
          sx += gray * gx[ki]; sy += gray * gy[ki]; ki++
        }
      }
      const mag = clamp(Math.sqrt(sx*sx + sy*sy), 0, 255)
      const oi = (py*width + px)*4
      output[oi] = output[oi+1] = output[oi+2] = mag
      output[oi+3] = 255
    }
  }
  imageData.data.set(output)
}

/* ═══ Emboss ═══ */
function embossRegion(ctx, region, params) {
  let { x, y, w, h } = region
  x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h)
  if (w < 3 || h < 3) return
  const tempCanvas = document.createElement('canvas')
  tempCanvas.width = w; tempCanvas.height = h
  const tctx = tempCanvas.getContext('2d')
  tctx.drawImage(ctx.canvas, x, y, w, h, 0, 0, w, h)
  const src = tctx.getImageData(0, 0, w, h)
  const data = src.data
  const output = new Uint8ClampedArray(data.length)
  const kernel = [-2,-1,0,-1,1,1,0,1,2]
  for (let py = 1; py < h - 1; py++) {
    for (let px = 1; px < w - 1; px++) {
      for (let c = 0; c < 3; c++) {
        let val = 0, ki = 0
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            val += data[((py+dy)*w + (px+dx))*4 + c] * kernel[ki++]
          }
        }
        output[(py*w + px)*4 + c] = clamp(val + 128, 0, 255)
      }
      output[(py*w + px)*4 + 3] = 255
    }
  }
  src.data.set(output)
  tctx.putImageData(src, 0, 0)
  ctx.drawImage(tempCanvas, 0, 0, w, h, x, y, w, h)
}
function embossFull(ctx, imageData, params) {
  const { width, height, data } = imageData
  const output = new Uint8ClampedArray(data.length)
  const kernel = [-2,-1,0,-1,1,1,0,1,2]
  for (let py = 1; py < height - 1; py++) {
    for (let px = 1; px < width - 1; px++) {
      for (let c = 0; c < 3; c++) {
        let val = 0, ki = 0
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            val += data[((py+dy)*width + (px+dx))*4 + c] * kernel[ki++]
          }
        }
        output[(py*width + px)*4 + c] = clamp(val + 128, 0, 255)
      }
      output[(py*width + px)*4 + 3] = 255
    }
  }
  imageData.data.set(output)
}

/* ═══ Sketch Effect ═══ */
function sketchRegion(ctx, region, params) {
  let { x, y, w, h } = region
  x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h)
  if (w < 3 || h < 3) return
  const tempCanvas = document.createElement('canvas')
  tempCanvas.width = w; tempCanvas.height = h
  const tctx = tempCanvas.getContext('2d')
  tctx.drawImage(ctx.canvas, x, y, w, h, 0, 0, w, h)
  const src = tctx.getImageData(0, 0, w, h)
  const data = src.data
  const output = new Uint8ClampedArray(data.length)
  // Grayscale
  for (let i = 0; i < data.length; i += 4) {
    const gray = 0.299*data[i] + 0.587*data[i+1] + 0.114*data[i+2]
    data[i] = data[i+1] = data[i+2] = gray
  }
  // Invert + blur (simple box blur for inverted copy)
  const inverted = new Uint8ClampedArray(data.length)
  for (let i = 0; i < data.length; i += 4) {
    inverted[i] = 255 - data[i]
    inverted[i+1] = 255 - data[i+1]
    inverted[i+2] = 255 - data[i+2]
    inverted[i+3] = 255
  }
  // Simple blur on inverted
  const blurred = new Uint8ClampedArray(inverted)
  for (let py = 2; py < h - 2; py++) {
    for (let px = 2; px < w - 2; px++) {
      for (let c = 0; c < 3; c++) {
        let sum = 0
        for (let dy = -2; dy <= 2; dy++) {
          for (let dx = -2; dx <= 2; dx++) {
            sum += inverted[((py+dy)*w + (px+dx))*4 + c]
          }
        }
        blurred[(py*w + px)*4 + c] = sum / 25
      }
    }
  }
  // Dodge: result = base / (255 - blurred) * 255
  for (let i = 0; i < data.length; i += 4) {
    for (let c = 0; c < 3; c++) {
      const base = data[i + c]
      const blend = blurred[i + c]
      const denom = 255 - blend
      output[i + c] = denom === 0 ? 255 : clamp(base * 255 / denom, 0, 255)
    }
    output[i + 3] = 255
  }
  src.data.set(output)
  tctx.putImageData(src, 0, 0)
  ctx.drawImage(tempCanvas, 0, 0, w, h, x, y, w, h)
}
function sketchFull(ctx, imageData, params) {
  const { width, height, data } = imageData
  // Grayscale
  for (let i = 0; i < data.length; i += 4) {
    const gray = 0.299*data[i] + 0.587*data[i+1] + 0.114*data[i+2]
    data[i] = data[i+1] = data[i+2] = gray
  }
  // Invert + blur
  const inverted = new Uint8ClampedArray(data.length)
  for (let i = 0; i < data.length; i += 4) {
    inverted[i] = 255 - data[i]
    inverted[i+1] = 255 - data[i+1]
    inverted[i+2] = 255 - data[i+2]
    inverted[i+3] = 255
  }
  const blurred = new Uint8ClampedArray(inverted)
  for (let py = 2; py < height - 2; py++) {
    for (let px = 2; px < width - 2; px++) {
      for (let c = 0; c < 3; c++) {
        let sum = 0
        for (let dy = -2; dy <= 2; dy++) {
          for (let dx = -2; dx <= 2; dx++) {
            sum += inverted[((py+dy)*width + (px+dx))*4 + c]
          }
        }
        blurred[(py*width + px)*4 + c] = sum / 25
      }
    }
  }
  for (let i = 0; i < data.length; i += 4) {
    for (let c = 0; c < 3; c++) {
      const base = data[i + c]
      const blend = blurred[i + c]
      const denom = 255 - blend
      data[i + c] = denom === 0 ? 255 : clamp(base * 255 / denom, 0, 255)
    }
  }
}

/* ═══ Exported Components ═══ */

export function SepiaEditor({ file, lang }) {
  const labels = getLabels(lang)
  return <RegionToolEditor file={file} lang={lang} effectName="sepia"
    sliders={[{ key: 'intensity', label: labels.strength || 'Intensity', min: 0, max: 100, step: 1, default: 100 }]}
    effectFn={sepiaFull} applyToRegionFn={sepiaRegion} />
}

export function PosterizeEditor({ file, lang }) {
  const labels = getLabels(lang)
  return <RegionToolEditor file={file} lang={lang} effectName="posterize"
    sliders={[{ key: 'levels', label: 'Levels', min: 2, max: 16, step: 1, default: 4 }]}
    effectFn={posterizeFull} applyToRegionFn={posterizeRegion} />
}

export function ThresholdEditor({ file, lang }) {
  return <RegionToolEditor file={file} lang={lang} effectName="threshold"
    sliders={[{ key: 'threshold', label: 'Threshold', min: 0, max: 255, step: 1, default: 128 }]}
    effectFn={thresholdFull} applyToRegionFn={thresholdRegion} />
}

export function DuotoneEditor({ file, lang }) {
  const labels = getLabels(lang)
  return <RegionToolEditor file={file} lang={lang} effectName="duotone"
    sliders={[
      { key: 'shadow', label: `${labels.color} (${lang==='ar'?'ظل':lang==='fr'?'Ombre':'Shadow'})`, type: 'color', default: '#1a1a2e' },
      { key: 'highlight', label: `${labels.color} (${lang==='ar'?'ضوء':lang==='fr'?'Lumière':'Highlight'})`, type: 'color', default: '#e94560' },
    ]}
    effectFn={duotoneFull} applyToRegionFn={duotoneRegion} />
}

export function NoiseGeneratorEditor({ file, lang }) {
  const labels = getLabels(lang)
  return <RegionToolEditor file={file} lang={lang} effectName="noise"
    sliders={[{ key: 'amount', label: labels.amount || 'Amount', min: 0, max: 100, step: 1, default: 30 }]}
    effectFn={noiseFull} applyToRegionFn={noiseRegion} />
}

export function DenoiseEditor({ file, lang }) {
  return <RegionToolEditor file={file} lang={lang} effectName="denoise"
    sliders={[]}
    effectFn={denoiseFull} applyToRegionFn={denoiseRegion} />
}

export function EdgeDetectionEditor({ file, lang }) {
  return <RegionToolEditor file={file} lang={lang} effectName="edge"
    sliders={[]}
    effectFn={edgeFull} applyToRegionFn={edgeRegion} />
}

export function EmbossEditor({ file, lang }) {
  return <RegionToolEditor file={file} lang={lang} effectName="emboss"
    sliders={[]}
    effectFn={embossFull} applyToRegionFn={embossRegion} />
}

export function SketchEditor({ file, lang }) {
  return <RegionToolEditor file={file} lang={lang} effectName="sketch"
    sliders={[]}
    effectFn={sketchFull} applyToRegionFn={sketchRegion} />
}
