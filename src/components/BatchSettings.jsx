/**
 * BatchSettings — settings panels for batch processing.
 * Each component receives { settings, setSettings, lang, fileCount }.
 */

// Compress Image settings
export function CompressBatchSettings({ settings, setSettings, lang, fileCount }) {
  const labels = {
    en: { quality: 'Quality', applyTo: 'Apply to', files: 'files' },
    fr: { quality: 'Qualité', applyTo: 'Appliquer à', files: 'fichiers' },
    ar: { quality: 'الجودة', applyTo: 'تطبيق على', files: 'ملفات' },
  }[lang]

  const quality = settings.quality ?? 0.7

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-[#6B7280] dark:text-[#A1A1AA] mb-1.5">
          {labels.quality}: <span className="text-blue-600 dark:text-blue-400 font-semibold">{Math.round(quality * 100)}%</span>
        </label>
        <input
          type="range"
          min="0.1"
          max="1"
          step="0.05"
          value={quality}
          onChange={e => setSettings(prev => ({ ...prev, quality: parseFloat(e.target.value) }))}
          className="w-full accent-blue-600"
        />
      </div>
      <p className="text-xs text-[#6B7280] dark:text-[#A1A1AA]">{labels.applyTo} {fileCount} {labels.files}</p>
    </div>
  )
}

// Resize Image settings
export function ResizeBatchSettings({ settings, setSettings, lang, fileCount }) {
  const labels = {
    en: { width: 'Width', height: 'Height', lockAspect: 'Lock Aspect Ratio', applyTo: 'Apply to', files: 'files' },
    fr: { width: 'Largeur', height: 'Hauteur', lockAspect: 'Verrouiller ratio', applyTo: 'Appliquer à', files: 'fichiers' },
    ar: { width: 'العرض', height: 'الارتفاع', lockAspect: 'قفل النسبة', applyTo: 'تطبيق على', files: 'ملفات' },
  }[lang]

  const width = settings.width ?? 800
  const lockAspect = settings.lockAspect ?? true

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <label className="block text-xs font-medium text-[#6B7280] dark:text-[#A1A1AA] mb-1">{labels.width}</label>
          <input
            type="number"
            value={width}
            onChange={e => setSettings(prev => ({ ...prev, width: parseInt(e.target.value) || 0 }))}
            className="input-field"
          />
        </div>
        <div className="flex-1">
          <label className="block text-xs font-medium text-[#6B7280] dark:text-[#A1A1AA] mb-1">{labels.height}</label>
          <input
            type="number"
            value={settings.height ?? 600}
            onChange={e => setSettings(prev => ({ ...prev, height: parseInt(e.target.value) || 0 }))}
            className="input-field"
          />
        </div>
      </div>
      <p className="text-xs text-[#6B7280] dark:text-[#A1A1AA]">{labels.applyTo} {fileCount} {labels.files}</p>
    </div>
  )
}

// Rotate settings
export function RotateBatchSettings({ settings, setSettings, lang, fileCount }) {
  const labels = {
    en: { angle: 'Angle', applyTo: 'Apply to', files: 'files' },
    fr: { angle: 'Angle', applyTo: 'Appliquer à', files: 'fichiers' },
    ar: { angle: 'زاوية', applyTo: 'تطبيق على', files: 'ملفات' },
  }[lang]

  const angle = settings.angle ?? 90

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {[90, 180, 270].map(a => (
          <button
            key={a}
            onClick={() => setSettings(prev => ({ ...prev, angle: a }))}
            className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
              angle === a
                ? 'bg-blue-600 text-white border-blue-600'
                : 'border-[#E5E7EB] dark:border-[#27272A] text-[#6B7280] dark:text-[#A1A1AA] hover:bg-[#F7F8FA] dark:hover:bg-[#18181B]'
            }`}
          >
            {a}°
          </button>
        ))}
      </div>
      <p className="text-xs text-[#6B7280] dark:text-[#A1A1AA]">{labels.applyTo} {fileCount} {labels.files}</p>
    </div>
  )
}

// Convert settings
export function ConvertBatchSettings({ settings, setSettings, lang, fileCount, formats = ['jpg', 'png', 'webp'] }) {
  const labels = {
    en: { output: 'Output Format', applyTo: 'Apply to', files: 'files' },
    fr: { output: 'Format de sortie', applyTo: 'Appliquer à', files: 'fichiers' },
    ar: { output: 'صيغة الإخراج', applyTo: 'تطبيق على', files: 'ملفات' },
  }[lang]

  const format = settings.format ?? formats[0]

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-[#6B7280] dark:text-[#A1A1AA] mb-1.5">{labels.output}</label>
        <div className="flex gap-2">
          {formats.map(f => (
            <button
              key={f}
              onClick={() => setSettings(prev => ({ ...prev, format: f }))}
              className={`flex-1 py-2 rounded-lg text-sm font-medium uppercase border transition-colors ${
                format === f
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'border-[#E5E7EB] dark:border-[#27272A] text-[#6B7280] dark:text-[#A1A1AA] hover:bg-[#F7F8FA] dark:hover:bg-[#18181B]'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>
      <p className="text-xs text-[#6B7280] dark:text-[#A1A1AA]">{labels.applyTo} {fileCount} {labels.files}</p>
    </div>
  )
}

// Flip settings
export function FlipBatchSettings({ settings, setSettings, lang, fileCount }) {
  const labels = {
    en: { direction: 'Direction', horizontal: 'Horizontal', vertical: 'Vertical', applyTo: 'Apply to', files: 'files' },
    fr: { direction: 'Direction', horizontal: 'Horizontal', vertical: 'Vertical', applyTo: 'Appliquer à', files: 'fichiers' },
    ar: { direction: 'الاتجاه', horizontal: 'أفقي', vertical: 'عمودي', applyTo: 'تطبيق على', files: 'ملفات' },
  }[lang]

  const direction = settings.direction ?? 'horizontal'

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-[#6B7280] dark:text-[#A1A1AA] mb-1.5">{labels.direction}</label>
        <div className="flex gap-2">
          <button onClick={() => setSettings(prev => ({ ...prev, direction: 'horizontal' }))} className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${direction === 'horizontal' ? 'bg-blue-600 text-white border-blue-600' : 'border-[#E5E7EB] dark:border-[#27272A] text-[#6B7280] dark:text-[#A1A1AA] hover:bg-[#F7F8FA] dark:hover:bg-[#18181B]'}`}>{labels.horizontal}</button>
          <button onClick={() => setSettings(prev => ({ ...prev, direction: 'vertical' }))} className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${direction === 'vertical' ? 'bg-blue-600 text-white border-blue-600' : 'border-[#E5E7EB] dark:border-[#27272A] text-[#6B7280] dark:text-[#A1A1AA] hover:bg-[#F7F8FA] dark:hover:bg-[#18181B]'}`}>{labels.vertical}</button>
        </div>
      </div>
      <p className="text-xs text-[#6B7280] dark:text-[#A1A1AA]">{labels.applyTo} {fileCount} {labels.files}</p>
    </div>
  )
}

// Filter settings (grayscale, blur, brightness, contrast, saturation)
export function FilterBatchSettings({ settings, setSettings, lang, fileCount, filterType = 'blur' }) {
  const labels = {
    en: { intensity: 'Intensity', applyTo: 'Apply to', files: 'files' },
    fr: { intensity: 'Intensité', applyTo: 'Appliquer à', files: 'fichiers' },
    ar: { intensity: 'الكثافة', applyTo: 'تطبيق على', files: 'ملفات' },
  }[lang]

  const value = settings.value ?? (filterType === 'blur' ? 5 : 0)

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-[#6B7280] dark:text-[#A1A1AA] mb-1.5">
          {labels.intensity}: <span className="text-blue-600 dark:text-blue-400 font-semibold">{value}</span>
        </label>
        <input
          type="range"
          min={filterType === 'blur' ? 0 : -100}
          max={filterType === 'blur' ? 20 : 100}
          step={filterType === 'blur' ? 1 : 5}
          value={value}
          onChange={e => setSettings(prev => ({ ...prev, value: parseFloat(e.target.value) }))}
          className="w-full accent-blue-600"
        />
      </div>
      <p className="text-xs text-[#6B7280] dark:text-[#A1A1AA]">{labels.applyTo} {fileCount} {labels.files}</p>
    </div>
  )
}

// Generic no-settings batch
export function NoSettingsBatch({ settings, setSettings, lang, fileCount }) {
  const labels = {
    en: { applyTo: 'Apply to', files: 'files' },
    fr: { applyTo: 'Appliquer à', files: 'fichiers' },
    ar: { applyTo: 'تطبيق على', files: 'ملفات' },
  }[lang]

  return <p className="text-xs text-[#6B7280] dark:text-[#A1A1AA]">{labels.applyTo} {fileCount} {labels.files}</p>
}
