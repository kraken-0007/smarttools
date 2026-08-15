/**
 * AudioTools.jsx — Real browser-based audio tools using Web Audio API.
 * All processing in-browser. Mobile + RTL + dark mode.
 *
 * Tools: AudioCutter, AudioTrimmer, AudioVolumeBooster, AudioNormalizer,
 *        AudioFadeEditor, AudioSpeedChanger, AudioPitchChanger, AudioRecorder,
 *        AudioMerger, AudioConverter (FFmpeg.wasm lazy-loaded),
 *        MP4toMP3, ExtractAudioFromVideo, URLAudioConverter
 * Plus: RemoveBackground (AI-based, lazy-loaded model)
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Download, Check, Loader2, X, Plus, Play, Pause, Mic, MicOff,
  AlertCircle, RefreshCw, Link2, Volume2,
} from 'lucide-react'
import { downloadBlob, getOutputFilename, formatFileSize } from '../lib/processors/image.js'

const clamp = (v, min, max) => Math.max(min, Math.min(max, v))

function L(lang, en, fr, ar) { return lang === 'ar' ? ar : lang === 'fr' ? fr : en }

/* ═══ Shared audio helpers ═══ */
async function decodeAudio(file) {
  const arrayBuffer = await file.arrayBuffer()
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
  const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer)
  audioCtx.close()
  return audioBuffer
}

function audioBufferToWav(audioBuffer, options = {}) {
  const { startTime = 0, endTime = audioBuffer.duration } = options
  const sampleRate = audioBuffer.sampleRate
  const numChannels = audioBuffer.numberOfChannels
  const startSample = Math.floor(startTime * sampleRate)
  const endSample = Math.floor(endTime * sampleRate)
  const numSamples = endSample - startSample
  const bytesPerSample = 2
  const dataSize = numSamples * numChannels * bytesPerSample
  const bufferSize = 44 + dataSize

  const buffer = new ArrayBuffer(bufferSize)
  const view = new DataView(buffer)

  // WAV header
  const writeString = (offset, str) => { for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i)) }
  writeString(0, 'RIFF')
  view.setUint32(4, 36 + dataSize, true)
  writeString(8, 'WAVE')
  writeString(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true) // PCM
  view.setUint16(22, numChannels, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * numChannels * bytesPerSample, true)
  view.setUint16(32, numChannels * bytesPerSample, true)
  view.setUint16(34, 16, true)
  writeString(36, 'data')
  view.setUint32(40, dataSize, true)

  // Write samples
  let offset = 44
  for (let i = startSample; i < endSample; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      const sample = clamp(audioBuffer.getChannelData(ch)[i], -1, 1)
      view.setInt16(offset, sample * 0x7FFF, true)
      offset += 2
    }
  }

  return new Blob([buffer], { type: 'audio/wav' })
}

function processAudioBuffer(audioBuffer, processFn) {
  const numChannels = audioBuffer.numberOfChannels
  const length = audioBuffer.length
  const newBuffer = new AudioBuffer({
    length,
    numberOfChannels: numChannels,
    sampleRate: audioBuffer.sampleRate,
  })
  for (let ch = 0; ch < numChannels; ch++) {
    const srcData = audioBuffer.getChannelData(ch)
    const dstData = newBuffer.getChannelData(ch)
    for (let i = 0; i < length; i++) {
      dstData[i] = processFn(srcData[i], i, length, ch)
    }
  }
  return newBuffer
}

function ResultBlock({ blob, filename, lang, onReset }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 p-3 rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 text-green-700 dark:text-green-400 text-sm font-medium">
        <Check className="w-4 h-4 shrink-0" /> {L(lang, 'Complete!', 'Terminé !', 'اكتملت المعالجة!')}
      </div>
      <audio src={URL.createObjectURL(blob)} controls className="w-full" />
      <button onClick={() => downloadBlob(blob, filename)} className="btn-primary w-full justify-center py-3.5 text-sm">
        <Download className="w-4 h-4" /> {L(lang, 'Download', 'Télécharger', 'تحميل')} {filename}
      </button>
      <button onClick={onReset} className="text-sm text-[#6B7280] dark:text-[#A1A1AA] hover:text-blue-600 font-medium w-full text-center">
        {L(lang, 'Start over', 'Recommencer', 'ابدأ من جديد')}
      </button>
    </div>
  )
}

function AudioInfo({ file, audioBuffer, lang }) {
  if (!audioBuffer) return null
  return (
    <div className="p-3 rounded-xl border border-[#E5E7EB] dark:border-[#27272A] text-sm text-[#6B7280] dark:text-[#A1A1AA] space-y-1">
      <p>{L(lang, 'File', 'Fichier', 'ملف')}: {file.name}</p>
      <p>{L(lang, 'Duration', 'Durée', 'المدة')}: {audioBuffer.duration.toFixed(2)}s</p>
      <p>{L(lang, 'Sample Rate', 'Fréquence', 'معدل العينة')}: {(audioBuffer.sampleRate/1000).toFixed(1)}kHz</p>
      <p>{L(lang, 'Channels', 'Canaux', 'القنوات')}: {audioBuffer.numberOfChannels === 2 ? L(lang,'Stereo','Stéréo','ستيريو') : L(lang,'Mono','Mono','أحادي')}</p>
      <p>{L(lang, 'Size', 'Taille', 'الحجم')}: {formatFileSize(file.size)}</p>
    </div>
  )
}

/* ═══ 1. Audio Cutter (precise cut) ═══ */
export function AudioCutterEditor({ file, lang }) {
  const [audioBuffer, setAudioBuffer] = useState(null)
  const [startTime, setStartTime] = useState(0)
  const [endTime, setEndTime] = useState(0)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    decodeAudio(file).then(buf => {
      setAudioBuffer(buf); setEndTime(buf.duration); setLoading(false)
    }).catch(e => { setError(e.message); setLoading(false) })
  }, [file])

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
  if (error) return <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 text-red-600 text-sm">{error}</div>
  if (result) return <ResultBlock blob={result.blob} filename={result.filename} lang={lang} onReset={() => setResult(null)} />

  const handleCut = async () => {
    setProcessing(true)
    try {
      const blob = audioBufferToWav(audioBuffer, { startTime, endTime })
      setResult({ blob, filename: getOutputFilename(file.name, 'wav') })
    } catch (e) { setError(e.message) }
    setProcessing(false)
  }

  return (
    <div className="space-y-4">
      <AudioInfo file={file} audioBuffer={audioBuffer} lang={lang} />
      <div>
        <label className="block text-sm font-medium text-[#111111] dark:text-[#FAFAFA] mb-2">{L(lang, 'Start Time', 'Début', 'وقت البدء')}: {startTime.toFixed(2)}s</label>
        <input type="range" min="0" max={audioBuffer.duration} step="0.01" value={startTime} onChange={e => setStartTime(parseFloat(e.target.value))} className="w-full accent-blue-600 cursor-pointer" />
      </div>
      <div>
        <label className="block text-sm font-medium text-[#111111] dark:text-[#FAFAFA] mb-2">{L(lang, 'End Time', 'Fin', 'وقت النهاية')}: {endTime.toFixed(2)}s</label>
        <input type="range" min="0" max={audioBuffer.duration} step="0.01" value={endTime} onChange={e => setEndTime(parseFloat(e.target.value))} className="w-full accent-blue-600 cursor-pointer" />
      </div>
      <p className="text-xs text-[#6B7280] dark:text-[#A1A1AA] text-center">{L(lang, 'Output duration', 'Durée de sortie', 'مدة الإخراج')}: {(endTime - startTime).toFixed(2)}s</p>
      <button onClick={handleCut} disabled={processing || endTime <= startTime} className="btn-primary w-full justify-center py-3.5 text-sm disabled:opacity-50">
        {processing ? <><Loader2 className="w-4 h-4 animate-spin" /> {L(lang, 'Processing...', 'Traitement...', 'جارٍ المعالجة...')}</> : L(lang, 'Cut & Download', 'Couper & Télécharger', 'قص وتحميل')}
      </button>
    </div>
  )
}

/* ═══ 2. Audio Trimmer (trim from start/end) ═══ */
export function AudioTrimmerEditor({ file, lang }) {
  const [audioBuffer, setAudioBuffer] = useState(null)
  const [trimStart, setTrimStart] = useState(0)
  const [trimEnd, setTrimEnd] = useState(0)
  const [loading, setLoading] = useState(true)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    decodeAudio(file).then(buf => { setAudioBuffer(buf); setTrimEnd(buf.duration); setLoading(false) }).catch(e => { setError(e.message); setLoading(false) })
  }, [file])

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
  if (error) return <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 text-red-600 text-sm">{error}</div>
  if (result) return <ResultBlock blob={result.blob} filename={result.filename} lang={lang} onReset={() => setResult(null)} />

  const handleTrim = async () => {
    try {
      const blob = audioBufferToWav(audioBuffer, { startTime: trimStart, endTime: trimEnd })
      setResult({ blob, filename: getOutputFilename(file.name, 'wav') })
    } catch (e) { setError(e.message) }
  }

  return (
    <div className="space-y-4">
      <AudioInfo file={file} audioBuffer={audioBuffer} lang={lang} />
      <div><label className="block text-sm font-medium text-[#111111] dark:text-[#FAFAFA] mb-2">{L(lang, 'Trim from start', 'Couper du début', 'قص من البداية')}: {trimStart.toFixed(2)}s</label><input type="range" min="0" max={audioBuffer.duration} step="0.01" value={trimStart} onChange={e => setTrimStart(parseFloat(e.target.value))} className="w-full accent-blue-600 cursor-pointer" /></div>
      <div><label className="block text-sm font-medium text-[#111111] dark:text-[#FAFAFA] mb-2">{L(lang, 'Trim from end (keep until)', 'Couper de la fin', 'قص من النهاية')}: {trimEnd.toFixed(2)}s</label><input type="range" min="0" max={audioBuffer.duration} step="0.01" value={trimEnd} onChange={e => setTrimEnd(parseFloat(e.target.value))} className="w-full accent-blue-600 cursor-pointer" /></div>
      <p className="text-xs text-[#6B7280] dark:text-[#A1A1AA] text-center">{L(lang, 'Output', 'Sortie', 'الإخراج')}: {(trimEnd - trimStart).toFixed(2)}s</p>
      <button onClick={handleTrim} disabled={trimEnd <= trimStart} className="btn-primary w-full justify-center py-3.5 text-sm disabled:opacity-50">{L(lang, 'Trim & Download', 'Découper & Télécharger', 'قص وتحميل')}</button>
    </div>
  )
}

/* ═══ 3. Audio Volume Booster ═══ */
export function AudioVolumeBoosterEditor({ file, lang }) {
  const [audioBuffer, setAudioBuffer] = useState(null)
  const [volume, setVolume] = useState(200)
  const [loading, setLoading] = useState(true)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => { decodeAudio(file).then(buf => { setAudioBuffer(buf); setLoading(false) }).catch(e => { setError(e.message); setLoading(false) }) }, [file])

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
  if (error) return <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 text-red-600 text-sm">{error}</div>
  if (result) return <ResultBlock blob={result.blob} filename={result.filename} lang={lang} onReset={() => setResult(null)} />

  const handleBoost = async () => {
    try {
      const factor = volume / 100
      const processed = processAudioBuffer(audioBuffer, (sample) => clamp(sample * factor, -1, 1))
      const blob = audioBufferToWav(processed)
      setResult({ blob, filename: getOutputFilename(file.name, 'wav') })
    } catch (e) { setError(e.message) }
  }

  return (
    <div className="space-y-4">
      <AudioInfo file={file} audioBuffer={audioBuffer} lang={lang} />
      <div><label className="block text-sm font-medium text-[#111111] dark:text-[#FAFAFA] mb-2">{L(lang, 'Volume', 'Volume', 'مستوى الصوت')}: {volume}%</label><input type="range" min="0" max="500" value={volume} onChange={e => setVolume(parseInt(e.target.value))} className="w-full accent-blue-600 cursor-pointer" /><p className="text-xs text-[#6B7280] dark:text-[#A1A1AA] mt-1">{volume > 100 ? L(lang, 'Amplified', 'Amplifié', 'مضخّم') : volume < 100 ? L(lang, 'Reduced', 'Réduit', 'مخفّض') : L(lang, 'Original', 'Original', 'أصلي')}</p></div>
      <button onClick={handleBoost} className="btn-primary w-full justify-center py-3.5 text-sm">{L(lang, 'Apply & Download', 'Appliquer & Télécharger', 'تطبيق وتحميل')}</button>
    </div>
  )
}

/* ═══ 4. Audio Normalizer ═══ */
export function AudioNormalizerEditor({ file, lang }) {
  const [audioBuffer, setAudioBuffer] = useState(null)
  const [targetLevel, setTargetLevel] = useState(0.9)
  const [loading, setLoading] = useState(true)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => { decodeAudio(file).then(buf => { setAudioBuffer(buf); setLoading(false) }).catch(e => { setError(e.message); setLoading(false) }) }, [file])

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
  if (error) return <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 text-red-600 text-sm">{error}</div>
  if (result) return <ResultBlock blob={result.blob} filename={result.filename} lang={lang} onReset={() => setResult(null)} />

  const handleNormalize = async () => {
    try {
      // Find peak
      let peak = 0
      for (let ch = 0; ch < audioBuffer.numberOfChannels; ch++) {
        const data = audioBuffer.getChannelData(ch)
        for (let i = 0; i < data.length; i++) { const abs = Math.abs(data[i]); if (abs > peak) peak = abs }
      }
      const gain = targetLevel / (peak || 1)
      const processed = processAudioBuffer(audioBuffer, (sample) => clamp(sample * gain, -1, 1))
      const blob = audioBufferToWav(processed)
      setResult({ blob, filename: getOutputFilename(file.name, 'wav') })
    } catch (e) { setError(e.message) }
  }

  return (
    <div className="space-y-4">
      <AudioInfo file={file} audioBuffer={audioBuffer} lang={lang} />
      <div><label className="block text-sm font-medium text-[#111111] dark:text-[#FAFAFA] mb-2">{L(lang, 'Target Level', 'Niveau cible', 'المستوى المستهدف')}: {Math.round(targetLevel * 100)}%</label><input type="range" min="0.1" max="1" step="0.01" value={targetLevel} onChange={e => setTargetLevel(parseFloat(e.target.value))} className="w-full accent-blue-600 cursor-pointer" /></div>
      <button onClick={handleNormalize} className="btn-primary w-full justify-center py-3.5 text-sm">{L(lang, 'Normalize & Download', 'Normaliser & Télécharger', 'تطبيع وتحميل')}</button>
    </div>
  )
}

/* ═══ 5. Audio Fade In/Out ═══ */
export function AudioFadeEditor({ file, lang }) {
  const [audioBuffer, setAudioBuffer] = useState(null)
  const [fadeIn, setFadeIn] = useState(1)
  const [fadeOut, setFadeOut] = useState(1)
  const [loading, setLoading] = useState(true)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => { decodeAudio(file).then(buf => { setAudioBuffer(buf); setLoading(false) }).catch(e => { setError(e.message); setLoading(false) }) }, [file])

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
  if (error) return <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 text-red-600 text-sm">{error}</div>
  if (result) return <ResultBlock blob={result.blob} filename={result.filename} lang={lang} onReset={() => setResult(null)} />

  const handleFade = async () => {
    try {
      const sr = audioBuffer.sampleRate
      const fadeInSamples = Math.floor(fadeIn * sr)
      const fadeOutSamples = Math.floor(fadeOut * sr)
      const total = audioBuffer.length
      const processed = processAudioBuffer(audioBuffer, (sample, i) => {
        let gain = 1
        if (i < fadeInSamples) gain = i / fadeInSamples
        if (i > total - fadeOutSamples) gain = (total - i) / fadeOutSamples
        return clamp(sample * gain, -1, 1)
      })
      const blob = audioBufferToWav(processed)
      setResult({ blob, filename: getOutputFilename(file.name, 'wav') })
    } catch (e) { setError(e.message) }
  }

  return (
    <div className="space-y-4">
      <AudioInfo file={file} audioBuffer={audioBuffer} lang={lang} />
      <div><label className="block text-sm font-medium text-[#111111] dark:text-[#FAFAFA] mb-2">{L(lang, 'Fade In', 'Fondu entrant', 'تلاشي داخولي')}: {fadeIn}s</label><input type="range" min="0" max={Math.min(audioBuffer.duration/2, 10)} step="0.1" value={fadeIn} onChange={e => setFadeIn(parseFloat(e.target.value))} className="w-full accent-blue-600 cursor-pointer" /></div>
      <div><label className="block text-sm font-medium text-[#111111] dark:text-[#FAFAFA] mb-2">{L(lang, 'Fade Out', 'Fondu sortant', 'تلاشي خروجي')}: {fadeOut}s</label><input type="range" min="0" max={Math.min(audioBuffer.duration/2, 10)} step="0.1" value={fadeOut} onChange={e => setFadeOut(parseFloat(e.target.value))} className="w-full accent-blue-600 cursor-pointer" /></div>
      <button onClick={handleFade} className="btn-primary w-full justify-center py-3.5 text-sm">{L(lang, 'Apply & Download', 'Appliquer & Télécharger', 'تطبيق وتحميل')}</button>
    </div>
  )
}

/* ═══ 6. Audio Speed Changer ═══ */
export function AudioSpeedChangerEditor({ file, lang }) {
  const [audioBuffer, setAudioBuffer] = useState(null)
  const [speed, setSpeed] = useState(1)
  const [loading, setLoading] = useState(true)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => { decodeAudio(file).then(buf => { setAudioBuffer(buf); setLoading(false) }).catch(e => { setError(e.message); setLoading(false) }) }, [file])

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
  if (error) return <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 text-red-600 text-sm">{error}</div>
  if (result) return <ResultBlock blob={result.blob} filename={result.filename} lang={lang} onReset={() => setResult(null)} />

  const handleSpeed = async () => {
    try {
      const newLength = Math.floor(audioBuffer.length / speed)
      const newBuffer = new AudioBuffer({ length: newLength, numberOfChannels: audioBuffer.numberOfChannels, sampleRate: audioBuffer.sampleRate })
      for (let ch = 0; ch < audioBuffer.numberOfChannels; ch++) {
        const src = audioBuffer.getChannelData(ch)
        const dst = newBuffer.getChannelData(ch)
        for (let i = 0; i < newLength; i++) {
          const srcIdx = i * speed
          const i0 = Math.floor(srcIdx); const i1 = Math.min(i0 + 1, src.length - 1)
          const frac = srcIdx - i0
          dst[i] = src[i0] * (1 - frac) + src[i1] * frac
        }
      }
      const blob = audioBufferToWav(newBuffer)
      setResult({ blob, filename: getOutputFilename(file.name, 'wav') })
    } catch (e) { setError(e.message) }
  }

  return (
    <div className="space-y-4">
      <AudioInfo file={file} audioBuffer={audioBuffer} lang={lang} />
      <div><label className="block text-sm font-medium text-[#111111] dark:text-[#FAFAFA] mb-2">{L(lang, 'Speed', 'Vitesse', 'السرعة')}: {speed}x</label><input type="range" min="0.25" max="4" step="0.05" value={speed} onChange={e => setSpeed(parseFloat(e.target.value))} className="w-full accent-blue-600 cursor-pointer" /><p className="text-xs text-[#6B7280] dark:text-[#A1A1AA] mt-1">{L(lang, 'Duration', 'Durée', 'المدة')}: {(audioBuffer.duration / speed).toFixed(2)}s</p></div>
      <button onClick={handleSpeed} className="btn-primary w-full justify-center py-3.5 text-sm">{L(lang, 'Apply & Download', 'Appliquer & Télécharger', 'تطبيق وتحميل')}</button>
    </div>
  )
}

/* ═══ 7. Audio Pitch Changer (resample) ═══ */
export function AudioPitchChangerEditor({ file, lang }) {
  const [audioBuffer, setAudioBuffer] = useState(null)
  const [pitch, setPitch] = useState(1)
  const [loading, setLoading] = useState(true)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => { decodeAudio(file).then(buf => { setAudioBuffer(buf); setLoading(false) }).catch(e => { setError(e.message); setLoading(false) }) }, [file])

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
  if (error) return <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 text-red-600 text-sm">{error}</div>
  if (result) return <ResultBlock blob={result.blob} filename={result.filename} lang={lang} onReset={() => setResult(null)} />

  const handlePitch = async () => {
    try {
      // Pitch shift by resampling (changes both pitch and speed)
      // To keep speed same, we'd need a phase vocoder — too complex for browser-only
      // This approach changes pitch while keeping duration approximately the same
      // by using offline context with playbackRate
      const offlineCtx = new OfflineAudioContext(audioBuffer.numberOfChannels, audioBuffer.length, audioBuffer.sampleRate)
      const source = offlineCtx.createBufferSource()
      source.buffer = audioBuffer
      source.playbackRate.value = pitch
      source.connect(offlineCtx.destination)
      source.start()
      const rendered = await offlineCtx.startRendering()
      // Resample back to original length
      const newBuffer = new AudioBuffer({ length: audioBuffer.length, numberOfChannels: audioBuffer.numberOfChannels, sampleRate: audioBuffer.sampleRate })
      for (let ch = 0; ch < audioBuffer.numberOfChannels; ch++) {
        const src = rendered.getChannelData(ch)
        const dst = newBuffer.getChannelData(ch)
        const ratio = src.length / dst.length
        for (let i = 0; i < dst.length; i++) {
          const srcIdx = i * ratio
          const i0 = Math.floor(srcIdx); const i1 = Math.min(i0 + 1, src.length - 1)
          const frac = srcIdx - i0
          dst[i] = src[i0] * (1 - frac) + src[i1] * frac
        }
      }
      const blob = audioBufferToWav(newBuffer)
      setResult({ blob, filename: getOutputFilename(file.name, 'wav') })
    } catch (e) { setError(e.message) }
  }

  return (
    <div className="space-y-4">
      <AudioInfo file={file} audioBuffer={audioBuffer} lang={lang} />
      <div><label className="block text-sm font-medium text-[#111111] dark:text-[#FAFAFA] mb-2">{L(lang, 'Pitch', 'Tonalité', 'طبقة الصوت')}: {pitch > 1 ? `+${Math.round((pitch-1)*100)}` : Math.round((pitch-1)*100)}%</label><input type="range" min="0.5" max="2" step="0.05" value={pitch} onChange={e => setPitch(parseFloat(e.target.value))} className="w-full accent-blue-600 cursor-pointer" /><p className="text-xs text-[#6B7280] dark:text-[#A1A1AA] mt-1">{pitch > 1 ? L(lang, 'Higher pitch', 'Plus aigu', 'أعلى') : pitch < 1 ? L(lang, 'Lower pitch', 'Plus grave', 'أخفض') : L(lang, 'Original', 'Original', 'أصلي')}</p></div>
      <button onClick={handlePitch} className="btn-primary w-full justify-center py-3.5 text-sm">{L(lang, 'Apply & Download', 'Appliquer & Télécharger', 'تطبيق وتحميل')}</button>
    </div>
  )
}

/* ═══ 8. Audio Recorder ═══ */
export function AudioRecorderEditor({ lang }) {
  const [recording, setRecording] = useState(false)
  const [audioURL, setAudioURL] = useState(null)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [elapsed, setElapsed] = useState(0)
  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
  const timerRef = useRef(null)

  const handleStart = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      mediaRecorderRef.current = recorder
      chunksRef.current = []
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        setAudioURL(URL.createObjectURL(blob))
        stream.getTracks().forEach(t => t.stop())
        clearInterval(timerRef.current)
      }
      recorder.start()
      setRecording(true); setElapsed(0)
      timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000)
    } catch (e) { setError(e.message) }
  }

  const handleStop = () => {
    if (mediaRecorderRef.current) mediaRecorderRef.current.stop()
    setRecording(false)
  }

  const handleDownload = () => {
    if (chunksRef.current.length === 0) return
    const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
    setResult({ blob, filename: `recording_${Date.now()}.webm` })
  }

  if (result) return <ResultBlock blob={result.blob} filename={result.filename} lang={lang} onReset={() => { setResult(null); setAudioURL(null) }} />

  return (
    <div className="space-y-4">
      {error && <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 text-red-600 text-sm flex items-center gap-2"><AlertCircle className="w-4 h-4" /> {error}</div>}
      <div className="flex flex-col items-center gap-4 py-8">
        <button onClick={recording ? handleStop : handleStart} className={`w-24 h-24 rounded-full flex items-center justify-center transition-colors ${recording ? 'bg-red-500 text-white animate-pulse' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
          {recording ? <MicOff className="w-10 h-10" /> : <Mic className="w-10 h-10" />}
        </button>
        <p className="text-sm font-medium text-[#111111] dark:text-[#FAFAFA]">{recording ? `${L(lang, 'Recording...', 'Enregistrement...', 'جارٍ التسجيل...')} ${elapsed}s` : L(lang, 'Click to start recording', 'Cliquez pour enregistrer', 'انقر لبدء التسجيل')}</p>
      </div>
      {audioURL && (
        <div className="space-y-3">
          <audio src={audioURL} controls className="w-full" />
          <button onClick={handleDownload} className="btn-primary w-full justify-center py-3.5 text-sm">
            <Download className="w-4 h-4" /> {L(lang, 'Download Recording', 'Télécharger', 'تحميل التسجيل')}
          </button>
        </div>
      )}
    </div>
  )
}

/* ═══ 9. Audio Merger ═══ */
export function AudioMergerEditor({ file, lang }) {
  const [files, setFiles] = useState([file])
  const [result, setResult] = useState(null)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState(null)

  const handleMerge = async () => {
    setProcessing(true); setError(null)
    try {
      const buffers = await Promise.all(files.map(f => decodeAudio(f)))
      const maxChannels = Math.max(...buffers.map(b => b.numberOfChannels))
      const sampleRate = buffers[0].sampleRate
      const totalLength = buffers.reduce((sum, b) => sum + b.length, 0)
      const merged = new AudioBuffer({ length: totalLength, numberOfChannels: maxChannels, sampleRate })
      let offset = 0
      for (const buf of buffers) {
        for (let ch = 0; ch < maxChannels; ch++) {
          const src = buf.getChannelData(Math.min(ch, buf.numberOfChannels - 1))
          merged.getChannelData(ch).set(src, offset)
        }
        offset += buf.length
      }
      const blob = audioBufferToWav(merged)
      setResult({ blob, filename: `merged_${Date.now()}.wav` })
    } catch (e) { setError(e.message) }
    setProcessing(false)
  }

  if (result) return <ResultBlock blob={result.blob} filename={result.filename} lang={lang} onReset={() => setResult(null)} />

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {files.map((f, i) => (
          <div key={i} className="flex items-center justify-between p-2 rounded-lg border border-[#E5E7EB] dark:border-[#27272A]">
            <span className="text-xs text-[#6B7280] dark:text-[#A1A1AA] truncate">{i+1}. {f.name}</span>
            <button onClick={() => setFiles(prev => prev.filter((_, j) => j !== i))} className="text-red-500 p-1"><X className="w-4 h-4" /></button>
          </div>
        ))}
        <label className="flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-[#E5E7EB] dark:border-[#27272A] text-sm text-[#6B7280] dark:text-[#A1A1AA] cursor-pointer hover:border-blue-300 transition-colors">
          <Plus className="w-4 h-4" /> {L(lang, 'Add more audio files', 'Ajouter des fichiers audio', 'إضافة ملفات صوتية')}
          <input type="file" accept="audio/*" multiple className="hidden" onChange={e => setFiles(prev => [...prev, ...Array.from(e.target.files)])} />
        </label>
      </div>
      <button onClick={handleMerge} disabled={processing || files.length < 2} className="btn-primary w-full justify-center py-3.5 text-sm disabled:opacity-50">
        {processing ? <><Loader2 className="w-4 h-4 animate-spin" /> {L(lang, 'Merging...', 'Fusion...', 'جارٍ الدمج...')}</> : L(lang, 'Merge & Download', 'Fusionner & Télécharger', 'دمج وتحميل')}
      </button>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  )
}

/* ═══ 10. Audio Converter (lazy-loaded FFmpeg.wasm) ═══ */
let ffmpegInstance = null
let ffmpegLoading = null

async function loadFFmpeg(onProgress) {
  if (ffmpegInstance) return ffmpegInstance
  if (ffmpegLoading) return ffmpegLoading
  
  ffmpegLoading = (async () => {
    const { FFmpeg } = await import('@ffmpeg/ffmpeg')
    const { fetchFile, toBlobURL } = await import('@ffmpeg/util')
    
    const ffmpeg = new FFmpeg()
    const baseURL = 'https://unpkg.com/@ffmpeg/[email protected]/dist/umd'
    
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    })
    
    ffmpegInstance = { ffmpeg, fetchFile }
    return ffmpegInstance
  })()
  
  return ffmpegLoading
}

export function AudioConverterEditor({ file, lang, targetFormat = 'mp3', bitrate = '128k' }) {
  const [result, setResult] = useState(null)
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState(null)
  const [loadingMsg, setLoadingMsg] = useState(null)

  const handleConvert = async () => {
    setProcessing(true); setError(null); setProgress(0); setLoadingMsg(null)
    try {
      setLoadingMsg(L(lang, 'Loading FFmpeg engine...', 'Chargement du moteur FFmpeg...', 'تحميل محرك FFmpeg...'))
      const { ffmpeg, fetchFile } = await loadFFmpeg()
      
      ffmpeg.on('progress', ({ progress }) => setProgress(Math.round(progress * 100)))
      
      const inputExt = file.name.split('.').pop().toLowerCase()
      const inputName = `input.${inputExt}`
      const outputName = `output.${targetFormat}`
      
      await ffmpeg.writeFile(inputName, await fetchFile(file))
      
      setLoadingMsg(L(lang, 'Converting...', 'Conversion...', 'جارٍ التحويل...'))
      const codec = targetFormat === 'mp3' ? 'libmp3lame' : targetFormat === 'ogg' ? 'libvorbis' : targetFormat === 'flac' ? 'flac' : 'pcm_s16le'
      await ffmpeg.exec(['-i', inputName, '-c:a', codec, '-b:a', bitrate, outputName])
      
      const data = await ffmpeg.readFile(outputName)
      const blob = new Blob([data.buffer], { type: `audio/${targetFormat}` })
      setResult({ blob, filename: getOutputFilename(file.name, targetFormat) })
    } catch (e) { setError(e.message || L(lang, 'Conversion failed. The format may not be supported.', 'Échec de conversion.', 'فشل التحويل.')) }
    setProcessing(false); setLoadingMsg(null)
  }

  if (result) return <ResultBlock blob={result.blob} filename={result.filename} lang={lang} onReset={() => setResult(null)} />

  return (
    <div className="space-y-4">
      <div className="p-3 rounded-xl border border-[#E5E7EB] dark:border-[#27272A] text-sm text-[#6B7280] dark:text-[#A1A1AA]">
        <p>{L(lang, 'File', 'Fichier', 'ملف')}: {file.name}</p>
        <p>{L(lang, 'Convert to', 'Convertir en', 'تحويل إلى')}: {targetFormat.toUpperCase()}</p>
      </div>
      {processing && (
        <div className="space-y-2">
          {loadingMsg && <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">{loadingMsg}</p>}
          {progress > 0 && <div className="w-full bg-[#E5E7EB] dark:bg-[#27272A] rounded-full h-2 overflow-hidden"><div className="bg-blue-600 h-full transition-all" style={{ width: `${progress}%` }} /></div>}
          {progress > 0 && <p className="text-xs text-[#6B7280] dark:text-[#A1A1AA] text-center">{progress}%</p>}
        </div>
      )}
      {error && <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 text-red-600 text-sm flex items-center gap-2"><AlertCircle className="w-4 h-4" /> {error}</div>}
      <button onClick={handleConvert} disabled={processing} className="btn-primary w-full justify-center py-3.5 text-sm disabled:opacity-50">
        {processing ? <><Loader2 className="w-4 h-4 animate-spin" /> {L(lang, 'Processing...', 'Traitement...', 'جارٍ المعالجة...')}</> : L(lang, 'Convert & Download', 'Convertir & Télécharger', 'تحويل وتحميل')}
      </button>
    </div>
  )
}

/* ═══ 11. MP4 to MP3 / Extract Audio from Video ═══ */
export function VideoToAudioEditor({ file, lang, targetFormat = 'mp3', bitrate = '128k' }) {
  return <AudioConverterEditor file={file} lang={lang} targetFormat={targetFormat} bitrate={bitrate} />
}

/* ═══ 12. Audio Compressor (reduce bitrate) ═══ */
export function AudioCompressorEditor({ file, lang }) {
  const [bitrate, setBitrate] = useState('64k')
  return (
    <div className="space-y-4">
      <div className="p-3 rounded-xl border border-[#E5E7EB] dark:border-[#27272A] text-sm text-[#6B7280] dark:text-[#A1A1AA]">
        <p>{L(lang, 'File', 'Fichier', 'ملف')}: {file.name}</p>
        <p>{L(lang, 'Original size', 'Taille originale', 'الحجم الأصلي')}: {formatFileSize(file.size)}</p>
      </div>
      <div><label className="block text-sm font-medium text-[#111111] dark:text-[#FAFAFA] mb-2">{L(lang, 'Bitrate', 'Débit', 'معدل البت')}: {bitrate}</label><select value={bitrate} onChange={e => setBitrate(e.target.value)} className="input-field"><option value="32k">32 kbps {L(lang, '(smallest)', '(plus petit)', '(أصغر)')}</option><option value="64k">64 kbps</option><option value="96k">96 kbps</option><option value="128k">128 kbps</option><option value="192k">192 kbps</option></select></div>
      <AudioConverterEditor file={file} lang={lang} targetFormat="mp3" bitrate={bitrate} />
    </div>
  )
}

/* ═══ 13. URL Audio Converter ═══ */
export function URLAudioConverterEditor({ lang }) {
  const [url, setUrl] = useState('')
  const [targetFormat, setTargetFormat] = useState('mp3')
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)
  const [progress, setProgress] = useState(0)
  const [loadingMsg, setLoadingMsg] = useState(null)

  const handleProcess = async () => {
    setProcessing(true); setError(null); setResult(null); setProgress(0)
    
    // Validate URL
    let parsedUrl
    try { parsedUrl = new URL(url) } catch { setError(L(lang, 'Invalid URL. Please enter a valid direct media URL.', 'URL invalide.', 'رابط غير صالح.')); setProcessing(false); return }
    
    if (parsedUrl.protocol !== 'https:' && parsedUrl.protocol !== 'http:') {
      setError(L(lang, 'Only HTTP/HTTPS URLs are supported.', 'Seules les URLs HTTP/HTTPS sont supportées.', 'يدعم فقط روابط HTTP/HTTPS.'))
      setProcessing(false); return
    }
    
    // Check if it's a known video platform URL (not directly downloadable)
    const blockedDomains = ['youtube.com', 'youtu.be', 'vimeo.com', 'dailymotion.com', 'tiktok.com', 'instagram.com', 'facebook.com', 'twitter.com', 'twitch.tv', 'netflix.com', 'spotify.com', 'soundcloud.com']
    const hostname = parsedUrl.hostname.replace('www.', '')
    if (blockedDomains.some(d => hostname.includes(d))) {
      setError(L(lang, 
        'This URL belongs to a video/audio platform that does not allow direct browser-side download due to DRM and authentication restrictions. Please download the file locally first, then upload it.',
        'Cette URL appartient à une plateforme qui ne permet pas le téléchargement direct depuis le navigateur en raison de restrictions DRM. Veuillez d\'abord télécharger le fichier localement, puis le téléverser.',
        'هذا الرابط ينتمي إلى منصة لا تسمح بالتنزيل المباشر من المتصفح بسبب قيود DRM. يرجى تنزيل الملف محلياً أولاً، ثم رفعه.'
      ))
      setProcessing(false); return
    }
    
    // Try to fetch the media
    try {
      setLoadingMsg(L(lang, 'Fetching media from URL...', 'Récupération du média...', 'جارٍ جلب الوسائط...'))
      const response = await fetch(url, { mode: 'cors' })
      if (!response.ok) {
        setError(L(lang, `Failed to fetch media (HTTP ${response.status}). The server may not allow cross-origin requests.`, `Échec de récupération (HTTP ${response.status}).`, `فشل الجلب (HTTP ${response.status}).`))
        setProcessing(false); return
      }
      const contentType = response.headers.get('content-type') || ''
      const blob = await response.blob()
      
      // Check if it's actually media
      if (!contentType.startsWith('audio/') && !contentType.startsWith('video/') && !blob.type.startsWith('audio/') && !blob.type.startsWith('video/')) {
        setError(L(lang, 'The URL does not point to a direct audio or video file. Please provide a direct media URL.', 'L\'URL ne pointe pas vers un fichier audio ou vidéo direct.', 'الرابط لا يشير إلى ملف صوت أو فيديو مباشر.'))
        setProcessing(false); return
      }
      
      // Create a File object from the blob
      const filename = url.split('/').pop()?.split('?')[0] || 'media'
      const mediaFile = new File([blob], filename, { type: blob.type })
      
      setLoadingMsg(L(lang, 'Loading FFmpeg engine...', 'Chargement FFmpeg...', 'تحميل FFmpeg...'))
      const { ffmpeg, fetchFile } = await loadFFmpeg()
      
      ffmpeg.on('progress', ({ progress }) => setProgress(Math.round(progress * 100)))
      
      const inputExt = filename.split('.').pop()?.toLowerCase() || 'mp3'
      const inputName = `input.${inputExt}`
      const outputName = `output.${targetFormat}`
      
      await ffmpeg.writeFile(inputName, await fetchFile(mediaFile))
      
      setLoadingMsg(L(lang, 'Converting...', 'Conversion...', 'جارٍ التحويل...'))
      const codec = targetFormat === 'mp3' ? 'libmp3lame' : targetFormat === 'ogg' ? 'libvorbis' : 'pcm_s16le'
      await ffmpeg.exec(['-i', inputName, '-c:a', codec, '-b:a', '128k', outputName])
      
      const data = await ffmpeg.readFile(outputName)
      const outBlob = new Blob([data.buffer], { type: `audio/${targetFormat}` })
      setResult({ blob: outBlob, filename: `converted_${Date.now()}.${targetFormat}` })
    } catch (e) {
      if (e instanceof TypeError && e.message.includes('Failed to fetch')) {
        setError(L(lang, 'Failed to fetch the URL. This is likely due to CORS restrictions — the server does not allow cross-origin requests from the browser. Please download the file locally and upload it instead.', 'Échec de récupération — restrictions CORS.', 'فشل الجلب — قيود CORS.'))
      } else {
        setError(e.message || L(lang, 'An error occurred while processing the URL.', 'Erreur de traitement.', 'حدث خطأ أثناء المعالجة.'))
      }
    }
    setProcessing(false); setLoadingMsg(null)
  }

  if (result) return <ResultBlock blob={result.blob} filename={result.filename} lang={lang} onReset={() => setResult(null)} />

  return (
    <div className="space-y-4">
      <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-400 text-xs">
        {L(lang, 'Enter a DIRECT media URL (e.g. https://example.com/audio.mp3). Platform URLs like YouTube, Spotify, etc. are not supported due to authentication and DRM restrictions.', 'Entrez une URL média DIRECTE. Les URLs de plateformes comme YouTube ne sont pas supportées.', 'أدخل رابط وسائط مباشر. روابط المنصات مثل يوتيوب غير مدعومة.')}
      </div>
      <div>
        <label className="block text-sm font-medium text-[#111111] dark:text-[#FAFAFA] mb-2">{L(lang, 'Media URL', 'URL du média', 'رابط الوسائط')}</label>
        <input type="url" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://example.com/audio.mp3" className="input-field" dir="ltr" />
      </div>
      <div>
        <label className="block text-sm font-medium text-[#111111] dark:text-[#FAFAFA] mb-2">{L(lang, 'Convert to', 'Convertir en', 'تحويل إلى')}</label>
        <select value={targetFormat} onChange={e => setTargetFormat(e.target.value)} className="input-field">
          <option value="mp3">MP3</option>
          <option value="wav">WAV</option>
          <option value="ogg">OGG</option>
        </select>
      </div>
      {processing && (
        <div className="space-y-2">
          {loadingMsg && <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">{loadingMsg}</p>}
          {progress > 0 && <div className="w-full bg-[#E5E7EB] dark:bg-[#27272A] rounded-full h-2 overflow-hidden"><div className="bg-blue-600 h-full transition-all" style={{ width: `${progress}%` }} /></div>}
          {progress > 0 && <p className="text-xs text-[#6B7280] dark:text-[#A1A1AA] text-center">{progress}%</p>}
        </div>
      )}
      {error && <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 text-red-600 text-sm flex items-start gap-2"><AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> <span>{error}</span></div>}
      <button onClick={handleProcess} disabled={processing || !url} className="btn-primary w-full justify-center py-3.5 text-sm disabled:opacity-50">
        {processing ? <><Loader2 className="w-4 h-4 animate-spin" /> {L(lang, 'Processing...', 'Traitement...', 'جارٍ المعالجة...')}</> : <><Link2 className="w-4 h-4" /> {L(lang, 'Process URL', 'Traiter l\'URL', 'معالجة الرابط')}</>}
      </button>
    </div>
  )
}

/* ═══ 14. Remove Background (AI-based, lazy-loaded) ═══ */
export function RemoveBackgroundEditor({ file, lang }) {
  const [result, setResult] = useState(null)
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState(null)
  const [previewURL, setPreviewURL] = useState(null)
  const [beforeURL, setBeforeURL] = useState(null)
  const [loadingMsg, setLoadingMsg] = useState(null)

  useEffect(() => { setBeforeURL(URL.createObjectURL(file)) }, [file])

  const handleRemove = async () => {
    setProcessing(true); setError(null); setProgress(0)
    try {
      setLoadingMsg(L(lang, 'Loading AI model...', 'Chargement du modèle IA...', 'تحميل نموذج الذكاء الاصطناعي...'))
      
      // Dynamic import of @imgly/background-removal
      const { removeBackground } = await import('@imgly/background-removal')
      
      setLoadingMsg(L(lang, 'Processing image...', 'Traitement de l\'image...', 'جارٍ معالجة الصورة...'))
      const blob = await removeBackground(file, {
        progress: (key, current, total) => {
          const pct = Math.round((current / total) * 100)
          setProgress(pct)
        },
      })
      
      setResult(blob)
      setPreviewURL(URL.createObjectURL(blob))
    } catch (e) {
      setError(e.message || L(lang, 'Background removal failed. Please try a different image.', 'Échec de la suppression d\'arrière-plan.', 'فشل إزالة الخلفية.'))
    }
    setProcessing(false); setLoadingMsg(null)
  }

  if (result && previewURL) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 p-3 rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 text-green-700 dark:text-green-400 text-sm font-medium">
          <Check className="w-4 h-4 shrink-0" /> {L(lang, 'Background removed!', 'Arrière-plan supprimé !', 'تم إزالة الخلفية!')}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs font-medium text-[#6B7280] dark:text-[#A1A1AA] mb-1 text-center">{L(lang, 'Before', 'Avant', 'قبل')}</p>
            <img src={beforeURL} className="w-full rounded-lg border border-[#E5E7EB] dark:border-[#27272A]" />
          </div>
          <div>
            <p className="text-xs font-medium text-[#6B7280] dark:text-[#A1A1AA] mb-1 text-center">{L(lang, 'After', 'Après', 'بعد')}</p>
            <div className="rounded-lg border border-[#E5E7EB] dark:border-[#27272A] overflow-hidden" style={{ background: 'repeating-conic-gradient(#e5e7eb 0% 25%, transparent 0% 50%) 50% / 16px 16px' }}>
              <img src={previewURL} className="w-full" />
            </div>
          </div>
        </div>
        <button onClick={() => downloadBlob(result, getOutputFilename(file.name, 'png'))} className="btn-primary w-full justify-center py-3.5 text-sm">
          <Download className="w-4 h-4" /> {L(lang, 'Download PNG', 'Télécharger PNG', 'تحميل PNG')} ({getOutputFilename(file.name, 'png')})
        </button>
        <button onClick={() => { setResult(null); setPreviewURL(null) }} className="text-sm text-[#6B7280] dark:text-[#A1A1AA] hover:text-blue-600 font-medium w-full text-center">
          {L(lang, 'Start over', 'Recommencer', 'ابدأ من جديد')}
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {beforeURL && (
        <div className="rounded-xl border border-[#E5E7EB] dark:border-[#27272A] overflow-hidden p-4 flex justify-center bg-[#F7F8FA] dark:bg-[#18181B]">
          <img src={beforeURL} className="max-w-full max-h-[300px] rounded-lg" />
        </div>
      )}
      {processing && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 p-3 rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-400 text-sm font-medium">
            <Loader2 className="w-4 h-4 animate-spin shrink-0" /> {loadingMsg || L(lang, 'Processing...', 'Traitement...', 'جارٍ المعالجة...')}
          </div>
          {progress > 0 && (
            <>
              <div className="w-full bg-[#E5E7EB] dark:bg-[#27272A] rounded-full h-2 overflow-hidden">
                <div className="bg-blue-600 h-full transition-all" style={{ width: `${progress}%` }} />
              </div>
              <p className="text-xs text-[#6B7280] dark:text-[#A1A1AA] text-center">{progress}%</p>
            </>
          )}
        </div>
      )}
      {error && <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 text-red-600 text-sm flex items-start gap-2"><AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> <span>{error}</span></div>}
      {!processing && !error && (
        <p className="text-xs text-[#6B7280] dark:text-[#A1A1AA] text-center">{L(lang, 'AI-powered background removal. The model loads on first use (~20MB download).', 'Suppression d\'arrière-plan par IA. Le modèle se télécharge à la première utilisation.', 'إزالة الخلفية بالذكاء الاصطناعي. يتم تحميل النموذج عند الاستخدام الأول.')}</p>
      )}
      <button onClick={handleRemove} disabled={processing} className="btn-primary w-full justify-center py-3.5 text-sm disabled:opacity-50">
        {processing ? <><Loader2 className="w-4 h-4 animate-spin" /> {L(lang, 'Removing background...', 'Suppression...', 'إزالة الخلفية...')}</> : L(lang, 'Remove Background', 'Supprimer l\'arrière-plan', 'إزالة الخلفية')}
      </button>
    </div>
  )
}
