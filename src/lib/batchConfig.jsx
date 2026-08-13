/**
 * batchConfig — maps tool slugs to their batch processing configuration.
 * Each entry has: accept, hint, processor, settingsComponent, orderMatters
 *
 * The processor function takes (file, settings) and returns { blob, filename }.
 * It reuses the existing processor functions from image.js and pdf.js.
 */
import {
  compressImage, resizeImage, rotateImage, convertImage,
  flipImage, grayscaleImage, blurImage,
  addTextWatermark, addImageBorder, addRoundedCorners,
  adjustBrightness, adjustContrast, adjustSaturation,
  downloadBlob, getOutputFilename,
} from './processors/image.js'
import {
  pdfToJpg, pdfToPng, jpgToPdf, pngToPdf, mergePDFs, compressPDF, rotatePdf,
} from './processors/pdf.js'
import {
  CompressBatchSettings, ResizeBatchSettings, RotateBatchSettings,
  ConvertBatchSettings, FlipBatchSettings, FilterBatchSettings,
  NoSettingsBatch,
} from '../components/BatchSettings'

const IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp,image/gif'
const IMAGE_HINT = 'JPG PNG WEBP • 50 MB'
const PDF_ACCEPT = 'application/pdf'
const PDF_HINT = 'PDF • 50 MB'

export const BATCH_CONFIG = {
  // ── Image Tools ──
  'compress-image': {
    accept: IMAGE_ACCEPT,
    hint: IMAGE_HINT,
    settingsComponent: CompressBatchSettings,
    processor: async (file, settings) => {
      const blob = await compressImage(file, settings.quality ?? 0.7)
      return { blob, filename: getOutputFilename(file.name, 'jpg') }
    },
  },
  'resize-image': {
    accept: IMAGE_ACCEPT,
    hint: IMAGE_HINT,
    settingsComponent: ResizeBatchSettings,
    processor: async (file, settings) => {
      const blob = await resizeImage(file, settings.width ?? 800, settings.height ?? 600)
      return { blob, filename: getOutputFilename(file.name, 'jpg') }
    },
  },
  'rotate-image': {
    accept: IMAGE_ACCEPT,
    hint: IMAGE_HINT,
    settingsComponent: RotateBatchSettings,
    processor: async (file, settings) => {
      const blob = await rotateImage(file, settings.angle ?? 90)
      return { blob, filename: getOutputFilename(file.name, 'jpg') }
    },
  },
  'jpg-to-png': {
    accept: IMAGE_ACCEPT,
    hint: IMAGE_HINT,
    settingsComponent: NoSettingsBatch,
    processor: async (file) => {
      const blob = await convertImage(file, 'png')
      return { blob, filename: getOutputFilename(file.name, 'png') }
    },
  },
  'png-to-jpg': {
    accept: IMAGE_ACCEPT,
    hint: IMAGE_HINT,
    settingsComponent: NoSettingsBatch,
    processor: async (file) => {
      const blob = await convertImage(file, 'jpg')
      return { blob, filename: getOutputFilename(file.name, 'jpg') }
    },
  },
  'webp-to-jpg': {
    accept: IMAGE_ACCEPT,
    hint: IMAGE_HINT,
    settingsComponent: NoSettingsBatch,
    processor: async (file) => {
      const blob = await convertImage(file, 'jpg')
      return { blob, filename: getOutputFilename(file.name, 'jpg') }
    },
  },
  'image-converter': {
    accept: IMAGE_ACCEPT,
    hint: IMAGE_HINT,
    settingsComponent: (props) => <ConvertBatchSettings {...props} formats={['jpg', 'png', 'webp']} />,
    processor: async (file, settings) => {
      const blob = await convertImage(file, settings.format ?? 'jpg')
      return { blob, filename: getOutputFilename(file.name, settings.format ?? 'jpg') }
    },
  },
  'grayscale-image': {
    accept: IMAGE_ACCEPT,
    hint: IMAGE_HINT,
    settingsComponent: NoSettingsBatch,
    processor: async (file) => {
      const blob = await grayscaleImage(file)
      return { blob, filename: getOutputFilename(file.name, 'jpg') }
    },
  },
  'blur-image': {
    accept: IMAGE_ACCEPT,
    hint: IMAGE_HINT,
    settingsComponent: (props) => <FilterBatchSettings {...props} filterType="blur" />,
    processor: async (file, settings) => {
      const blob = await blurImage(file, settings.value ?? 5)
      return { blob, filename: getOutputFilename(file.name, 'jpg') }
    },
  },
  'image-brightness': {
    accept: IMAGE_ACCEPT,
    hint: IMAGE_HINT,
    settingsComponent: (props) => <FilterBatchSettings {...props} filterType="brightness" />,
    processor: async (file, settings) => {
      const blob = await adjustBrightness(file, settings.value ?? 0)
      return { blob, filename: getOutputFilename(file.name, 'jpg') }
    },
  },
  'image-contrast': {
    accept: IMAGE_ACCEPT,
    hint: IMAGE_HINT,
    settingsComponent: (props) => <FilterBatchSettings {...props} filterType="contrast" />,
    processor: async (file, settings) => {
      const blob = await adjustContrast(file, settings.value ?? 0)
      return { blob, filename: getOutputFilename(file.name, 'jpg') }
    },
  },
  'image-saturation': {
    accept: IMAGE_ACCEPT,
    hint: IMAGE_HINT,
    settingsComponent: (props) => <FilterBatchSettings {...props} filterType="saturation" />,
    processor: async (file, settings) => {
      const blob = await adjustSaturation(file, settings.value ?? 0)
      return { blob, filename: getOutputFilename(file.name, 'jpg') }
    },
  },
  'flip-image': {
    accept: IMAGE_ACCEPT,
    hint: IMAGE_HINT,
    settingsComponent: FlipBatchSettings,
    processor: async (file, settings) => {
      const blob = await flipImage(file, settings.direction ?? 'horizontal')
      return { blob, filename: getOutputFilename(file.name, 'jpg') }
    },
  },

  'image-watermark': {
    accept: IMAGE_ACCEPT,
    hint: IMAGE_HINT,
    settingsComponent: (props) => {
      const { settings, setSettings, lang, fileCount } = props
      const labels = {
        en: { text: 'Watermark Text', applyTo: 'Apply to', files: 'files' },
        fr: { text: 'Texte du filigrane', applyTo: 'Appliquer à', files: 'fichiers' },
        ar: { text: 'نص العلامة المائية', applyTo: 'تطبيق على', files: 'ملفات' },
      }[lang]
      const text = settings.text || 'SmartTools'
      return (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-[#6B7280] dark:text-[#A1A1AA] mb-1.5">{labels.text}</label>
            <input type="text" value={text} onChange={e => setSettings(prev => ({ ...prev, text: e.target.value }))} className="input-field" />
          </div>
          <p className="text-xs text-[#6B7280] dark:text-[#A1A1AA]">{labels.applyTo} {fileCount} {labels.files}</p>
        </div>
      )
    },
    processor: async (file, settings) => {
      const blob = await addTextWatermark(file, { text: settings.text || 'SmartTools', fontSize: 48, opacity: 0.3, color: '#ffffff' })
      return { blob, filename: getOutputFilename(file.name, 'jpg') }
    },
  },
  'add-image-border': {
    accept: IMAGE_ACCEPT,
    hint: IMAGE_HINT,
    settingsComponent: (props) => {
      const { settings, setSettings, lang, fileCount } = props
      const labels = {
        en: { width: 'Border Width', color: 'Color', applyTo: 'Apply to', files: 'files' },
        fr: { width: 'Largeur', color: 'Couleur', applyTo: 'Appliquer à', files: 'fichiers' },
        ar: { width: 'عرض الحدود', color: 'اللون', applyTo: 'تطبيق على', files: 'ملفات' },
      }[lang]
      const width = settings.borderWidth ?? 10
      const color = settings.borderColor ?? '#000000'
      return (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-[#6B7280] dark:text-[#A1A1AA] mb-1.5">
              {labels.width}: <span className="text-blue-600 dark:text-blue-400 font-semibold">{width}px</span>
            </label>
            <input type="range" min="1" max="50" value={width} onChange={e => setSettings(prev => ({ ...prev, borderWidth: parseInt(e.target.value) }))} className="w-full accent-blue-600" />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#6B7280] dark:text-[#A1A1AA] mb-1.5">{labels.color}</label>
            <input type="color" value={color} onChange={e => setSettings(prev => ({ ...prev, borderColor: e.target.value }))} className="w-12 h-8 rounded border border-[#E5E7EB] dark:border-[#27272A]" />
          </div>
          <p className="text-xs text-[#6B7280] dark:text-[#A1A1AA]">{labels.applyTo} {fileCount} {labels.files}</p>
        </div>
      )
    },
    processor: async (file, settings) => {
      const blob = await addImageBorder(file, { borderWidth: settings.borderWidth ?? 10, borderColor: settings.borderColor ?? '#000000' })
      return { blob, filename: getOutputFilename(file.name, 'jpg') }
    },
  },
  'rounded-corners': {
    accept: IMAGE_ACCEPT,
    hint: IMAGE_HINT,
    settingsComponent: (props) => {
      const { settings, setSettings, lang, fileCount } = props
      const labels = {
        en: { radius: 'Corner Radius', applyTo: 'Apply to', files: 'files' },
        fr: { radius: 'Rayon', applyTo: 'Appliquer à', files: 'fichiers' },
        ar: { radius: 'نصف القطر', applyTo: 'تطبيق على', files: 'ملفات' },
      }[lang]
      const radius = settings.radius ?? 20
      return (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-[#6B7280] dark:text-[#A1A1AA] mb-1.5">
              {labels.radius}: <span className="text-blue-600 dark:text-blue-400 font-semibold">{radius}px</span>
            </label>
            <input type="range" min="0" max="100" value={radius} onChange={e => setSettings(prev => ({ ...prev, radius: parseInt(e.target.value) }))} className="w-full accent-blue-600" />
          </div>
          <p className="text-xs text-[#6B7280] dark:text-[#A1A1AA]">{labels.applyTo} {fileCount} {labels.files}</p>
        </div>
      )
    },
    processor: async (file, settings) => {
      const blob = await addRoundedCorners(file, settings.radius ?? 20)
      return { blob, filename: getOutputFilename(file.name, 'png') }
    },
  },

  // ── PDF Tools ──
  'pdf-to-jpg': {
    accept: PDF_ACCEPT,
    hint: PDF_HINT,
    settingsComponent: NoSettingsBatch,
    processor: async (file) => {
      const blob = await pdfToJpg(file)
      return { blob, filename: getOutputFilename(file.name, 'zip') }
    },
  },
  'pdf-to-png': {
    accept: PDF_ACCEPT,
    hint: PDF_HINT,
    settingsComponent: NoSettingsBatch,
    processor: async (file) => {
      const blob = await pdfToPng(file)
      return { blob, filename: getOutputFilename(file.name, 'zip') }
    },
  },
  'jpg-to-pdf': {
    accept: IMAGE_ACCEPT,
    hint: IMAGE_HINT,
    settingsComponent: NoSettingsBatch,
    processor: async (file) => {
      const blob = await jpgToPdf([file])
      return { blob, filename: getOutputFilename(file.name, 'pdf') }
    },
  },
  'png-to-pdf': {
    accept: IMAGE_ACCEPT,
    hint: IMAGE_HINT,
    settingsComponent: NoSettingsBatch,
    processor: async (file) => {
      const blob = await pngToPdf([file])
      return { blob, filename: getOutputFilename(file.name, 'pdf') }
    },
  },
  'merge-pdf': {
    accept: PDF_ACCEPT,
    hint: PDF_HINT,
    settingsComponent: null, // No settings, just merge all
    orderMatters: true,
    processor: async (file, settings, allFiles) => {
      // For merge, we need all files — handled specially
      const blob = await mergePDFs(allFiles || [file])
      return { blob, filename: 'merged.pdf' }
    },
  },
  'compress-pdf': {
    accept: PDF_ACCEPT,
    hint: PDF_HINT,
    settingsComponent: NoSettingsBatch,
    processor: async (file) => {
      const blob = await compressPDF(file)
      return { blob, filename: getOutputFilename(file.name, 'pdf') }
    },
  },
  'rotate-pdf': {
    accept: PDF_ACCEPT,
    hint: PDF_HINT,
    settingsComponent: RotateBatchSettings,
    processor: async (file, settings) => {
      const blob = await rotatePdf(file, settings.angle ?? 90)
      return { blob, filename: getOutputFilename(file.name, 'pdf') }
    },
  },
}

// Tools that support batch processing
export const BATCH_SUPPORTED = new Set(Object.keys(BATCH_CONFIG))
