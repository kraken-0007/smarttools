import React, { useState, useRef, useCallback } from 'react'
import { UploadCloud } from 'lucide-react'

export function BatchUpload({ accept, onFiles, lang = 'en', hint }) {
  const [isDragOver, setIsDragOver] = useState(false)
  const inputRef = useRef(null)

  const labels = {
    en: {
      dropTitle: 'Drag and drop files here, or click to select',
      chooseBtn: 'Choose Files',
      defaultHint: 'Supports multiple files',
    },
    fr: {
      dropTitle: 'Glissez-déposez vos fichiers ici, ou cliquez pour sélectionner',
      chooseBtn: 'Choisir des fichiers',
      defaultHint: 'Prend en charge plusieurs fichiers',
    },
    ar: {
      dropTitle: 'اسحب وأسقط الملفات هنا، أو انقر للاختيار',
      chooseBtn: 'اختر الملفات',
      defaultHint: 'يدعم ملفات متعددة',
    },
  }[lang] || {
    dropTitle: 'Drag and drop files here, or click to select',
    chooseBtn: 'Choose Files',
    defaultHint: 'Supports multiple files',
  }

  const handleFileChange = useCallback(
    (fileList) => {
      if (!fileList || fileList.length === 0) return
      const filesArray = Array.from(fileList)
      if (typeof onFiles === 'function') {
        onFiles(filesArray)
      }
      if (inputRef.current) {
        inputRef.current.value = ''
      }
    },
    [onFiles]
  )

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!isDragOver) setIsDragOver(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
    if (e.dataTransfer && e.dataTransfer.files) {
      handleFileChange(e.dataTransfer.files)
    }
  }

  const handleClick = () => {
    inputRef.current?.click()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleClick()
    }
  }

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={labels.dropTitle}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative border-2 border-dashed rounded-xl p-8 md:p-12 text-center transition-all duration-200 cursor-pointer select-none outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
        isDragOver
          ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-950/30 scale-[1.005]'
          : 'bg-[#F7F8FA] border-[#E5E7EB] dark:bg-[#18181B] dark:border-[#27272A] hover:border-blue-400 dark:hover:border-blue-600'
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple
        className="hidden"
        onChange={(e) => handleFileChange(e.target.files)}
      />

      <div className="flex flex-col items-center gap-3 pointer-events-none">
        <div
          className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors duration-200 ${
            isDragOver
              ? 'bg-blue-100 dark:bg-blue-900/50'
              : 'bg-blue-50 dark:bg-blue-950/40'
          }`}
        >
          <UploadCloud
            className={`w-7 h-7 transition-transform duration-200 ${
              isDragOver
                ? 'text-blue-600 dark:text-blue-400 scale-110'
                : 'text-blue-600 dark:text-blue-400'
            }`}
            strokeWidth={1.8}
          />
        </div>

        <p className="text-base font-semibold text-[#111111] dark:text-[#FAFAFA]">
          {labels.dropTitle}
        </p>

        <span className="btn-primary rounded-xl px-5 py-2.5 text-sm font-medium shadow-sm pointer-events-auto">
          {labels.chooseBtn}
        </span>

        <p className="text-xs text-[#6B7280] dark:text-[#A1A1AA] mt-1">
          {hint || labels.defaultHint}
        </p>
      </div>
    </div>
  )
}

export default BatchUpload
