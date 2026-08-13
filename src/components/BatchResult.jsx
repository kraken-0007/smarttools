import React, { useState } from 'react'
import { Download, Check, AlertCircle, RotateCcw, FileArchive, RefreshCw } from 'lucide-react'
import { createZip } from '../lib/zipHelper.js'

function downloadBlob(blob, filename = 'download') {
  if (!blob) return
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function BatchResult({
  results = [],
  lang = 'en',
  onDownloadAll,
  onDownloadZip,
  onRetryFailed,
  onReset,
}) {
  const [zipping, setZipping] = useState(false)

  if (!results || results.length === 0) {
    return null
  }

  // Parse result objects flexible structure
  const parsedItems = results.map((item, idx) => {
    const isSuccess = item.status === 'success' || (!item.status && (item.blob || item.result?.blob))
    const isError = item.status === 'error' || (!isSuccess && Boolean(item.error))
    const isSkipped = item.status === 'skipped'

    const actualFile = item.file || item
    const filename = item.result?.filename || item.filename || actualFile?.name || `file_${idx + 1}`
    const blob = item.result?.blob || item.blob || null
    const errorMsg = item.error || item.result?.error || null

    return {
      isSuccess,
      isError,
      isSkipped,
      filename,
      blob,
      errorMsg,
      raw: item,
    }
  })

  const totalCount = parsedItems.length
  const successCount = parsedItems.filter((i) => i.isSuccess).length
  const failedCount = parsedItems.filter((i) => i.isError).length
  const skippedCount = parsedItems.filter((i) => i.isSkipped).length

  const labels = {
    en: {
      header: `${totalCount} file${totalCount !== 1 ? 's' : ''} processed`,
      breakdown: `${successCount} successful, ${failedCount} failed${skippedCount > 0 ? `, ${skippedCount} skipped` : ''}`,
      download: 'Download',
      downloadAll: 'Download All',
      downloadZip: 'Download as ZIP',
      retryFailed: 'Retry failed',
      startOver: 'Start Over',
      zipping: 'Creating ZIP...',
    },
    fr: {
      header: `${totalCount} fichier${totalCount !== 1 ? 's' : ''} traité${totalCount !== 1 ? 's' : ''}`,
      breakdown: `${successCount} réussi${successCount !== 1 ? 's' : ''}, ${failedCount} échoué${failedCount !== 1 ? 's' : ''}${skippedCount > 0 ? `, ${skippedCount} ignoré${skippedCount !== 1 ? 's' : ''}` : ''}`,
      download: 'Télécharger',
      downloadAll: 'Tout télécharger',
      downloadZip: 'Télécharger en ZIP',
      retryFailed: 'Réessayer les échecs',
      startOver: 'Recommencer',
      zipping: 'Création du ZIP...',
    },
    ar: {
      header: `تمت معالجة ${totalCount} ملف${totalCount !== 1 ? 'ات' : ''}`,
      breakdown: `${successCount} ناجح، ${failedCount} فاشل${skippedCount > 0 ? `، ${skippedCount} تم تجاوزه` : ''}`,
      download: 'تحميل',
      downloadAll: 'تحميل الكل',
      downloadZip: 'تحميل كملف ZIP',
      retryFailed: 'إعادة محاولة الفاشلة',
      startOver: 'البدء من جديد',
      zipping: 'جارٍ إنشاء ZIP...',
    },
  }[lang] || {
    header: `${totalCount} files processed`,
    breakdown: `${successCount} successful, ${failedCount} failed`,
    download: 'Download',
    downloadAll: 'Download All',
    downloadZip: 'Download as ZIP',
    retryFailed: 'Retry failed',
    startOver: 'Start Over',
    zipping: 'Creating ZIP...',
  }

  const handleIndividualDownload = (item) => {
    if (!item.blob) return
    downloadBlob(item.blob, item.filename)
  }

  const handleDefaultDownloadAll = () => {
    if (typeof onDownloadAll === 'function') {
      onDownloadAll()
      return
    }
    parsedItems.forEach((item, index) => {
      if (item.isSuccess && item.blob) {
        setTimeout(() => {
          downloadBlob(item.blob, item.filename)
        }, index * 200)
      }
    })
  }

  const handleDefaultDownloadZip = async () => {
    if (typeof onDownloadZip === 'function') {
      onDownloadZip()
      return
    }
    setZipping(true)
    try {
      const filesForZip = parsedItems
        .filter((item) => item.isSuccess && item.blob)
        .map((item) => ({ name: item.filename, blob: item.blob }))

      if (filesForZip.length > 0) {
        const zipBlob = await createZip(filesForZip)
        const url = URL.createObjectURL(zipBlob); const a = document.createElement("a"); a.href = url; a.download = "batch_results.zip"; a.click(); setTimeout(() => URL.revokeObjectURL(url), 100)
      }
    } catch (e) {
      console.error('Failed to generate ZIP:', e)
    } finally {
      setZipping(false)
    }
  }

  return (
    <div className="w-full space-y-6 p-5 md:p-6 rounded-xl border border-[#E5E7EB] dark:border-[#27272A] bg-white dark:bg-[#18181B] shadow-sm animate-fade-in">
      {/* Summary Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E5E7EB] dark:border-[#27272A]">
        <div>
          <h3 className="text-lg font-bold text-[#111111] dark:text-[#FAFAFA]">
            {labels.header}
          </h3>
          <p className="text-xs text-[#6B7280] dark:text-[#A1A1AA] mt-0.5">
            {labels.breakdown}
          </p>
        </div>

        {/* Status badges summary */}
        <div className="flex items-center gap-2">
          {successCount > 0 && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 dark:bg-green-950/60 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-900/50">
              <Check className="w-3.5 h-3.5" />
              {successCount}
            </span>
          )}
          {failedCount > 0 && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/50">
              <AlertCircle className="w-3.5 h-3.5" />
              {failedCount}
            </span>
          )}
        </div>
      </div>

      {/* Item List */}
      <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
        {parsedItems.map((item, index) => (
          <div
            key={index}
            className="flex items-center justify-between gap-3 p-3.5 rounded-xl border border-[#E5E7EB] dark:border-[#27272A] bg-[#F7F8FA] dark:bg-[#111113]"
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                  item.isSuccess
                    ? 'bg-green-50 dark:bg-green-950/40 text-green-600 dark:text-green-400'
                    : 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400'
                }`}
              >
                {item.isSuccess ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <AlertCircle className="w-5 h-5" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-[#111111] dark:text-[#FAFAFA] truncate">
                  {item.filename}
                </p>
                {item.errorMsg && (
                  <p className="text-xs text-red-500 dark:text-red-400 truncate mt-0.5">
                    {item.errorMsg}
                  </p>
                )}
              </div>
            </div>

            {item.isSuccess && item.blob && (
              <button
                type="button"
                onClick={() => handleIndividualDownload(item)}
                aria-label={`${labels.download} ${item.filename}`}
                className="shrink-0 btn-primary px-3.5 py-2 text-xs font-semibold rounded-lg flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{labels.download}</span>
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Main Action Buttons */}
      <div className="flex flex-wrap items-center gap-3 pt-2">
        {/* Download All */}
        {successCount > 0 && (
          <button
            type="button"
            onClick={handleDefaultDownloadAll}
            className="btn-primary flex-1 min-w-[140px] py-2.5 text-sm font-semibold rounded-xl"
          >
            <Download className="w-4 h-4" />
            <span>{labels.downloadAll}</span>
          </button>
        )}

        {/* Download as ZIP */}
        {successCount > 0 && (
          <button
            type="button"
            onClick={handleDefaultDownloadZip}
            disabled={zipping}
            className="btn-ghost flex-1 min-w-[140px] py-2.5 text-sm font-semibold rounded-xl hover:bg-gray-100 dark:hover:bg-zinc-800 text-[#111111] dark:text-[#FAFAFA]"
          >
            <FileArchive className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>{zipping ? labels.zipping : labels.downloadZip}</span>
          </button>
        )}

        {/* Retry Failed (only if failedCount > 0) */}
        {failedCount > 0 && typeof onRetryFailed === 'function' && (
          <button
            type="button"
            onClick={onRetryFailed}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:hover:bg-amber-900/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>{labels.retryFailed}</span>
          </button>
        )}

        {/* Start Over / Reset */}
        {typeof onReset === 'function' && (
          <button
            type="button"
            onClick={onReset}
            className="btn-ghost px-4 py-2.5 text-sm font-medium rounded-xl text-[#6B7280] dark:text-[#A1A1AA] hover:text-[#111111] dark:hover:text-[#FAFAFA]"
          >
            <RotateCcw className="w-4 h-4" />
            <span>{labels.startOver}</span>
          </button>
        )}
      </div>
    </div>
  )
}

export default BatchResult
