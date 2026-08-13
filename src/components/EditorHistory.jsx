/**
 * EditorHistory — Undo/Redo toolbar for image editors.
 * Shows Undo and Redo buttons with disabled states.
 * Integrates with useHistory hook.
 */
import { Undo2, Redo2 } from 'lucide-react'
import { useHistory, useKeyboardShortcuts } from '../hooks/useHistory'

export function EditorHistoryToolbar({ canUndo, canRedo, onUndo, onRedo, lang }) {
  const labels = {
    en: { undo: 'Undo', redo: 'Redo' },
    fr: { undo: 'Annuler', redo: 'Rétablir' },
    ar: { undo: 'تراجع', redo: 'إعادة' },
  }[lang]

  return (
    <div className="flex items-center gap-1.5">
      <button
        onClick={onUndo}
        disabled={!canUndo}
        aria-label={labels.undo}
        title={labels.undo}
        className="p-2 rounded-lg border border-[#E5E7EB] dark:border-[#27272A] text-[#6B7280] dark:text-[#A1A1AA] hover:bg-[#F7F8FA] dark:hover:bg-[#18181B] hover:text-blue-600 dark:hover:text-blue-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-current"
      >
        <Undo2 className="w-4 h-4" />
      </button>
      <button
        onClick={onRedo}
        disabled={!canRedo}
        aria-label={labels.redo}
        title={labels.redo}
        className="p-2 rounded-lg border border-[#E5E7EB] dark:border-[#27272A] text-[#6B7280] dark:text-[#A1A1AA] hover:bg-[#F7F8FA] dark:hover:bg-[#18181B] hover:text-blue-600 dark:hover:text-blue-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-current"
      >
        <Redo2 className="w-4 h-4" />
      </button>
    </div>
  )
}

/**
 * useEditorHistory — wraps useHistory with keyboard shortcuts.
 * Returns { canUndo, canRedo, pushState, undo, redo, reset, init, currentState, history }
 */
export function useEditorHistory(maxStates = 20) {
  const history = useHistory(maxStates)
  
  useKeyboardShortcuts(
    history.canUndo ? history.undo : undefined,
    history.canRedo ? history.redo : undefined
  )

  return history
}
