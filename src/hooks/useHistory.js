/**
 * useHistory — undo/redo stack for image editor operations.
 * Stores lightweight state snapshots (not full image data).
 * Max 20 states. Efficient regeneration from state params.
 */
import { useState, useCallback, useEffect } from 'react'

export function useHistory(maxStates = 20) {
  const [undoStack, setUndoStack] = useState([])
  const [redoStack, setRedoStack] = useState([])

  const canUndo = undoStack.length > 1
  const canRedo = redoStack.length > 0
  const currentState = undoStack[undoStack.length - 1] || null

  const pushState = useCallback((state) => {
    setUndoStack(prev => {
      const next = [...prev, state]
      if (next.length > maxStates) next.shift()
      return next
    })
    setRedoStack([])
  }, [maxStates])

  const undo = useCallback(() => {
    setUndoStack(prev => {
      if (prev.length < 2) return prev
      const popped = prev[prev.length - 1]
      setRedoStack(r => [...r, popped])
      return prev.slice(0, -1)
    })
  }, [])

  const redo = useCallback(() => {
    setRedoStack(prev => {
      if (prev.length === 0) return prev
      const popped = prev[prev.length - 1]
      setUndoStack(u => [...u, popped])
      return prev.slice(0, -1)
    })
  }, [])

  const reset = useCallback(() => {
    setUndoStack([])
    setRedoStack([])
  }, [])

  const init = useCallback((state) => {
    setUndoStack([state])
    setRedoStack([])
  }, [])

  return { canUndo, canRedo, currentState, pushState, undo, redo, reset, init, undoStack, redoStack }
}

/**
 * useKeyboardShortcuts — Ctrl+Z / Ctrl+Shift+Z (or Cmd on Mac).
 * Does not fire when typing in input/textarea/select elements.
 */
export function useKeyboardShortcuts(onUndo, onRedo) {
  useEffect(() => {
    const handler = (e) => {
      const target = e.target
      const isTyping = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable
      if (isTyping) return

      const mod = e.metaKey || e.ctrlKey
      if (!mod) return

      if (e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        onUndo?.()
      } else if ((e.key === 'z' && e.shiftKey) || e.key === 'y') {
        e.preventDefault()
        onRedo?.()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onUndo, onRedo])
}
