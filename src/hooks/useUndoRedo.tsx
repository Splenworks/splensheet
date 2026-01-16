import { useCallback, useRef, type Dispatch, type SetStateAction } from "react"
import { PartialCellObj, SheetData } from "../types"

export type UndoRedoEntry = {
  sheetIndex: number
  r: number
  c: number
  prev: PartialCellObj
}

interface UseUndoRedoOptions {
  activeSheetIndex: number
  setSheets: Dispatch<SetStateAction<SheetData[]>>
  recalculate: (data: PartialCellObj[][]) => PartialCellObj[][]
  selectCell: (row: number, col: number) => void
  onChange: () => void
}

export const useUndoRedo = ({
  activeSheetIndex,
  setSheets,
  recalculate,
  selectCell,
  onChange,
}: UseUndoRedoOptions) => {
  const undoStack = useRef<UndoRedoEntry[]>([])
  const redoStack = useRef<UndoRedoEntry[]>([])

  const resetHistory = useCallback(() => {
    undoStack.current = []
    redoStack.current = []
  }, [])

  const recordChange = useCallback((entry: UndoRedoEntry) => {
    undoStack.current.push(entry)
    redoStack.current = []
  }, [])

  const undo = useCallback(() => {
    const last = undoStack.current.pop()
    if (!last) return
    setSheets((prev) => {
      const copy = [...prev]
      const sheet = { ...copy[last.sheetIndex] }
      const data = [...sheet.data]
      const row = [...(data[last.r] || [])]

      redoStack.current.push({
        sheetIndex: last.sheetIndex,
        r: last.r,
        c: last.c,
        prev: row[last.c] ?? {},
      })

      row[last.c] = last.prev
      data[last.r] = row
      sheet.data = recalculate(data)
      copy[last.sheetIndex] = sheet
      return copy
    })
    onChange()
    selectCell(last.r, last.c)
  }, [onChange, recalculate, selectCell, setSheets])

  const redo = useCallback(() => {
    const last = redoStack.current.pop()
    if (!last) return
    setSheets((prev) => {
      const copy = [...prev]
      const sheet = { ...copy[last.sheetIndex] }
      const data = [...sheet.data]
      const row = [...(data[last.r] || [])]

      undoStack.current.push({
        sheetIndex: last.sheetIndex,
        r: last.r,
        c: last.c,
        prev: row[last.c] ?? {},
      })

      row[last.c] = last.prev
      data[last.r] = row
      sheet.data = recalculate(data)
      copy[last.sheetIndex] = sheet
      return copy
    })
    onChange()
    selectCell(last.r, last.c)
  }, [onChange, recalculate, selectCell, setSheets])

  return {
    undo,
    redo,
    resetHistory,
    recordChange,
  }
}
