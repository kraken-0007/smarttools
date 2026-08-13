import React, { useState, useEffect } from 'react'
import { X, GripVertical, Check, AlertCircle, Loader2, FileText, MinusCircle } from 'lucide-react'

function formatFileSize(bytes) {
  if (typeof bytes !== 'number' || isNaN(bytes) || bytes <= 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

function FileThumbnail({ fileObj }) {
  const [url, setUrl] = useState(null)
  const actualFile = fileObj instanceof File ? fileObj : fileObj?.file || null
  const isImage = actualFile && typeof actualFile.type === 'string' && actualFile.type.startsWith('image/')

  useEffect(() => {
    if (!isImage || !actualFile) {
      setUrl(null)
      return
    }
    const objectUrl = URL.createObjectURL(actualFile)
    setUrl(objectUrl)
    return () => {
      URL.revokeObjectURL(objectUrl)
    }
  }, [actualFile, isImage])

  if (isImage && url) {
    return (
      <img
        src={url}
        alt={actualFile?.name || 'Image'}
        className="w-10 h-10 rounded-lg object-cover shrink-0 border border-[#E5E7EB] dark:border-[#27272A]"
      />
    )
  }

  return (
    <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 flex items-center justify-center shrink-0 text-blue-600 dark:text-blue-400">
      <FileText className="w-5 h-5" />
    </div>
  )
}

export function BatchFileList({ files = [], onRemove, onReorder, lang = 'en', orderMatters = false }) {
  const [draggedIdx, setDraggedIdx] = useState(null)
  const [dragOverIdx, setDragOverIdx] = useState(null)

  const statusLabels = {
    en: {
      pending: 'Pending',
      processing: 'Processing...',
      success: 'Success',
      error: 'Error',
      skipped: 'Skipped',
      remove: 'Remove file',
    },
    fr: {
      pending: 'En attente',
      processing: 'Traitement...',
      success: 'Succès',
      error: 'Erreur',
      skipped: 'Ignoré',
      remove: 'Supprimer le fichier',
    },
    ar: {
      pending: 'قيد الانتظار',
      processing: 'جارٍ المعالجة...',
      success: 'نجاح',
      error: 'خطأ',
      skipped: 'تم التجاوز',
      remove: 'إزالة الملف',
    },
  }[lang] || {
    pending: 'Pending',
    processing: 'Processing...',
    success: 'Success',
    error: 'Error',
    skipped: 'Skipped',
    remove: 'Remove file',
  }

  if (!files || files.length === 0) {
    return null
  }

  const handleDragStart = (e, index) => {
    if (!orderMatters) return
    setDraggedIdx(index)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', index.toString())
  }

  const handleDragOver = (e, index) => {
    if (!orderMatters) return
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (dragOverIdx !== index) {
      setDragOverIdx(index)
    }
  }

  const handleDrop = (e, targetIdx) => {
    if (!orderMatters) return
    e.preventDefault()
    setDragOverIdx(null)
    if (draggedIdx === null || draggedIdx === targetIdx) return

    const updatedFiles = [...files]
    const [movedItem] = updatedFiles.splice(draggedIdx, 1)
    updatedFiles.splice(targetIdx, 0, movedItem)

    if (typeof onReorder === 'function') {
      onReorder(updatedFiles, draggedIdx, targetIdx)
    }
    setDraggedIdx(null)
  }

  const handleDragEnd = () => {
    setDraggedIdx(null)
    setDragOverIdx(null)
  }

  return (
    <div className="space-y-2.5 w-full">
      {files.map((item, index) => {
        const actualFile = item instanceof File ? item : item?.file || null
        const status = item?.status || 'pending'
        const errorMsg = item?.error || null
        const fileName = actualFile?.name || item?.name || `File ${index + 1}`
        const fileSize = actualFile?.size ?? item?.size ?? 0

        return (
          <div
            key={index}
            draggable={orderMatters}
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
            className={`flex items-center gap-3 p-3 md:p-3.5 rounded-xl border transition-all duration-150 ${
              dragOverIdx === index
                ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 shadow-md'
                : 'bg-white dark:bg-[#18181B] border-[#E5E7EB] dark:border-[#27272A] hover:border-gray-300 dark:hover:border-zinc-700'
            } ${draggedIdx === index ? 'opacity-40' : 'opacity-100'}`}
          >
            {/* Drag Handle if orderMatters */}
            {orderMatters && (
              <div
                className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 shrink-0 touch-none"
                aria-label="Drag to reorder"
              >
                <GripVertical className="w-4 h-4" />
              </div>
            )}

            {/* Thumbnail / File Icon */}
            <FileThumbnail fileObj={item} />

            {/* Filename and Size */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#111111] dark:text-[#FAFAFA] truncate">
                {fileName}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-[#6B7280] dark:text-[#A1A1AA]">
                  {formatFileSize(fileSize)}
                </span>
                {errorMsg && (
                  <span className="text-xs text-red-500 dark:text-red-400 truncate max-w-[200px]" title={errorMsg}>
                    • {errorMsg}
                  </span>
                )}
              </div>
            </div>

            {/* Status Badge */}
            <div className="shrink-0">
              {status === 'pending' && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-300">
                  {statusLabels.pending}
                </span>
              )}

              {status === 'processing' && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/50">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  {statusLabels.processing}
                </span>
              )}

              {status === 'success' && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 dark:bg-green-950/60 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-900/50">
                  <Check className="w-3.5 h-3.5" />
                  {statusLabels.success}
                </span>
              )}

              {status === 'error' && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/50">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {statusLabels.error}
                </span>
              )}

              {status === 'skipped' && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50">
                  <MinusCircle className="w-3.5 h-3.5" />
                  {statusLabels.skipped}
                </span>
              )}
            </div>

            {/* Remove Button */}
            {typeof onRemove === 'function' && (
              <button
                type="button"
                onClick={() => onRemove(index)}
                aria-label={statusLabels.remove}
                className="shrink-0 p-1.5 rounded-lg text-[#6B7280] dark:text-[#A1A1AA] hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 dark:hover:text-red-400 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default BatchFileList
