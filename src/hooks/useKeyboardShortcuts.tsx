import { useEffect, type RefObject } from "react"

interface UseKeyboardShortcutsOptions {
  isFullScreen: boolean
  toggleFullScreen: () => void
  isMac: boolean
  selectedCell: { row: number; col: number } | null
  selectCell: (row: number, col: number) => void
  clearSelection: () => void
  focusFind: () => void
  onFindNext: () => void
  onFindPrev: () => void
  onUndo: () => void
  onRedo: () => void
  gridRef: RefObject<HTMLDivElement | null>
}

export const useKeyboardShortcuts = ({
  isFullScreen,
  toggleFullScreen,
  isMac,
  selectedCell,
  selectCell,
  clearSelection,
  focusFind,
  onFindNext,
  onFindPrev,
  onUndo,
  onRedo,
  gridRef,
}: UseKeyboardShortcutsOptions) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase()

      const activeElement = document.activeElement
      const isInputFocused = activeElement?.tagName === "INPUT" || activeElement?.tagName === "TEXTAREA"

      if (
        (isMac && event.metaKey && key === "f") ||
        (!isMac && event.ctrlKey && key === "f")
      ) {
        event.preventDefault()
        focusFind()
        return
      }

      if (
        (isMac && event.metaKey && key === "z") ||
        (!isMac && event.ctrlKey && key === "z")
      ) {
        event.preventDefault()
        onUndo()
        return
      }
      if (
        (isMac && event.metaKey && key === "y") ||
        (!isMac && event.ctrlKey && key === "y")
      ) {
        event.preventDefault()
        onRedo()
        return
      }
      if (
        (isMac && event.metaKey && key === "g") ||
        (!isMac && event.ctrlKey && key === "g")
      ) {
        event.preventDefault()
        if (event.shiftKey) {
          onFindPrev()
        } else {
          onFindNext()
        }
        return
      }
      if (key === "escape") {
        if (isFullScreen) {
          toggleFullScreen()
        } else if (selectedCell) {
          clearSelection()
        }
        return
      }

      if (!isInputFocused && selectedCell) {
        if (key === "arrowright") {
          event.preventDefault()
          selectCell(selectedCell.row, selectedCell.col + 1)
        } else if (key === "arrowleft") {
          event.preventDefault()
          selectCell(selectedCell.row, selectedCell.col - 1)
        } else if (key === "arrowdown") {
          event.preventDefault()
          selectCell(selectedCell.row + 1, selectedCell.col)
        } else if (key === "arrowup") {
          event.preventDefault()
          selectCell(selectedCell.row - 1, selectedCell.col)
        } else if (key === "enter") {
          event.preventDefault()
          const target = gridRef.current?.querySelector<HTMLDivElement>(
            `[data-row='${selectedCell.row}'][data-col='${selectedCell.col}']`,
          )
          target?.click()
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [
    clearSelection,
    focusFind,
    gridRef,
    isFullScreen,
    isMac,
    onFindNext,
    onFindPrev,
    onRedo,
    onUndo,
    selectCell,
    selectedCell,
    toggleFullScreen,
  ])
}
