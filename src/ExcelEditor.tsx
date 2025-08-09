import React, { useEffect, useRef, useState, useCallback } from "react"
import { useVirtualizer } from "@tanstack/react-virtual"
import ExcelCell from "./ExcelCell"
import ExcelHeader from "./ExcelHeader"
import { useFullScreen } from "./hooks/useFullScreen"
import { writeFile } from "xlsx"
import type { WorkBook } from "xlsx"
import { recalculateSheet } from "./utils/recalculateSheet"
import { sheetToData, dataToSheet } from "./utils/xlsx"
import { isMac } from "./utils/isMac"
import { PartialCellObj, SheetData } from "./types"

interface ExcelEditorProps {
  workbook: WorkBook
  fileName: string
  onClose: () => void
  onWorkbookChange?: (workbook: WorkBook) => void
  initialHasChanges?: boolean
  onHasChangesChange?: (hasChanges: boolean) => void
}

const ExcelEditor: React.FC<ExcelEditorProps> = ({
  workbook,
  fileName,
  onClose,
  onWorkbookChange,
  initialHasChanges = false,
  onHasChangesChange,
}) => {
  const { isFullScreen, toggleFullScreen } = useFullScreen()
  const [activeSheetIndex, setActiveSheetIndex] = useState(0)
  const [sheets, setSheets] = useState<SheetData[]>(
    workbook.SheetNames.map((name, idx) => ({
      id: idx + 1,
      name,
      data: sheetToData(workbook.Sheets[name]),
    })),
  )
  const [hasChanges, setHasChanges] = useState(initialHasChanges)
  const activeSheet = sheets[activeSheetIndex]
  const activeDataRef = useRef(activeSheet.data)
  const undoStack = useRef<
    Array<{
      sheetIndex: number
      r: number
      c: number
      prev: PartialCellObj
    }>
  >([])
  const redoStack = useRef<
    Array<{
      sheetIndex: number
      r: number
      c: number
      prev: PartialCellObj
    }>
  >([])
  const gridRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    activeDataRef.current = sheets[activeSheetIndex].data
  }, [sheets, activeSheetIndex])


  useEffect(() => {
    setSheets(
      workbook.SheetNames.map((name, idx) => ({
        id: idx + 1,
        name,
        data: sheetToData(workbook.Sheets[name]),
      })),
    )
  }, [workbook])

  useEffect(() => {
    setHasChanges(initialHasChanges)
  }, [initialHasChanges])


  const MAX_ROWS = 100000
  const MAX_COLS = 18278
  const parentRef = useRef<HTMLDivElement>(null)
  const rowCountRef = useRef(MAX_ROWS)
  const colCountRef = useRef(MAX_COLS)
  const colSizeMap = useRef<Record<number, number>>({})

  const rowVirtualizer = useVirtualizer({
    count: MAX_ROWS,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 28,
    overscan: 200,
  })
  const columnVirtualizer = useVirtualizer({
    horizontal: true,
    count: MAX_COLS,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80,
    overscan: 50,
  })

  const focusCell = useCallback(
    (row: number, col: number) => {
      setTimeout(() => {
        let r = row
        let c = col
        const maxRow = rowCountRef.current
        const maxCol = colCountRef.current
        if (c >= maxCol) {
          c = 0
          r += 1
        } else if (c < 0) {
          c = maxCol - 1
          r -= 1
        }
        if (r < 0 || r >= maxRow) return
        rowVirtualizer.scrollToIndex(r)
        columnVirtualizer.scrollToIndex(c)
        const target = gridRef.current?.querySelector<HTMLDivElement>(
          `[data-row='${r}'][data-col='${c}']`,
        )
        target?.click()
      }, 0)
    },
    [rowVirtualizer, columnVirtualizer],
  )

  const handleUndo = useCallback(() => {
    const last = undoStack.current.pop()
    if (!last) return
    setSheets((prev) => {
      const copy = [...prev]
      const sheet = { ...copy[last.sheetIndex] }
      const data = [...sheet.data]
      const row = [...(data[last.r] || [])]

      // Push current state to redo stack before undoing
      redoStack.current.push({
        sheetIndex: last.sheetIndex,
        r: last.r,
        c: last.c,
        prev: row[last.c] ?? {},
      })

      row[last.c] = last.prev
      data[last.r] = row
      sheet.data = recalculateSheet(data)
      copy[last.sheetIndex] = sheet
      return copy
    })
    setHasChanges(true)
    onHasChangesChange?.(true)
    focusCell(last.r, last.c)
  }, [onHasChangesChange, focusCell])

  const handleRedo = useCallback(() => {
    const last = redoStack.current.pop()
    if (!last) return
    setSheets((prev) => {
      const copy = [...prev]
      const sheet = { ...copy[last.sheetIndex] }
      const data = [...sheet.data]
      const row = [...(data[last.r] || [])]

      // Push current state to undo stack before redoing
      undoStack.current.push({
        sheetIndex: last.sheetIndex,
        r: last.r,
        c: last.c,
        prev: row[last.c] ?? {},
      })

      row[last.c] = last.prev
      data[last.r] = row
      sheet.data = recalculateSheet(data)
      copy[last.sheetIndex] = sheet
      return copy
    })
    setHasChanges(true)
    onHasChangesChange?.(true)
    focusCell(last.r, last.c)
  }, [onHasChangesChange, focusCell])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase()
      if (
        (isMac && event.metaKey && key === "z") ||
        (!isMac && event.ctrlKey && key === "z")
      ) {
        event.preventDefault()
        handleUndo()
        return
      }
      if (
        (isMac && event.metaKey && key === "y") ||
        (!isMac && event.ctrlKey && key === "y")
      ) {
        event.preventDefault()
        handleRedo()
        return
      }
      if (key === "escape") {
        if (isFullScreen) {
          toggleFullScreen()
        } else {
          onClose()
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [isFullScreen, toggleFullScreen, onClose, handleUndo, handleRedo])

  const updateCell = useCallback(
    (r: number, c: number, cell: PartialCellObj) => {
      setSheets((prev) => {
        const copy = [...prev]
        const sheet = { ...copy[activeSheetIndex] }
        const data = [...sheet.data]
        const row = [...(data[r] || [])]
        undoStack.current.push({
          sheetIndex: activeSheetIndex,
          r,
          c,
          prev: row[c] ?? {},
        })
        redoStack.current = []
        row[c] = cell
        data[r] = row
        sheet.data = recalculateSheet(data)
        copy[activeSheetIndex] = sheet
        return copy
      })
      setHasChanges(true)
      onHasChangesChange?.(true)
    },
    [activeSheetIndex, onHasChangesChange],
  )


  useEffect(() => {
    const sheetName = workbook.SheetNames[activeSheetIndex]
    dataToSheet(sheets[activeSheetIndex].data, workbook.Sheets[sheetName])
    onWorkbookChange?.(workbook)
  }, [sheets, activeSheetIndex, workbook, onWorkbookChange])

  const handleDownload = () => {
    sheets.forEach((sd, idx) => {
      const sheetName = workbook.SheetNames[idx]
      const ws = workbook.Sheets[sheetName]
      dataToSheet(sd.data, ws)
    })
    writeFile(workbook, fileName)
    setHasChanges(false)
    onHasChangesChange?.(false)
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-white dark:bg-neutral-900">
      <ExcelHeader
        isFullScreen={isFullScreen}
        toggleFullScreen={toggleFullScreen}
        fileName={fileName}
        onClose={onClose}
        worksheets={sheets.map((ws) => ({ id: ws.id, name: ws.name }))}
        activeSheetIndex={activeSheetIndex}
        setActiveSheetIndex={setActiveSheetIndex}
        hasChanges={hasChanges}
        onDownload={handleDownload}
      />
      <div ref={parentRef} className="flex-1 overflow-scroll">
        <div
          ref={gridRef}
          className="min-w-max text-sm"
          style={{
            height: rowVirtualizer.getTotalSize(),
            width: columnVirtualizer.getTotalSize(),
            position: "relative",
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => (
            <div
              key={virtualRow.key}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: virtualRow.size,
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              {columnVirtualizer.getVirtualItems().map((virtualCol) => {
                const rIdx = virtualRow.index
                const cIdx = virtualCol.index
                const cellData = activeSheet.data[rIdx]?.[cIdx]
                return (
                  <div
                    key={virtualCol.key}
                    ref={(el) => {
                      if (el) {
                        const width = el.getBoundingClientRect().width
                        const prev = colSizeMap.current[virtualCol.index] || 0
                        if (width > prev) {
                          colSizeMap.current[virtualCol.index] = width
                          columnVirtualizer.measureElement(el)
                        }
                      }
                    }}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      transform: `translateX(${virtualCol.start}px)`,
                    }}
                  >
                    <ExcelCell
                      rowIndex={rIdx}
                      colIndex={cIdx}
                      cell={cellData}
                      onChange={updateCell}
                      focusCell={focusCell}
                    />
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default ExcelEditor
