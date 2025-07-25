import React, { useEffect, useRef, useState, useCallback } from "react"
import { useVirtualizer } from "@tanstack/react-virtual"
import ExcelCell from "./ExcelCell"
import ExcelHeader from "./ExcelHeader"
import { useFullScreen } from "./hooks/useFullScreen"
import { writeFile } from "xlsx"
import type { WorkBook, CellObject } from "xlsx"
import { recalculateSheet } from "./utils/recalculateSheet"
import { sheetToData, dataToSheet } from "./utils/xlsx"
import { isMac } from "./utils/isMac"

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
  type SheetData = {
    id: number
    name: string
    data: Array<Array<Partial<CellObject>>>
  }

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
  const getLastNonEmptyRow = useCallback((): number => {
    let lastRowIdx = activeSheet.data.length
    while (lastRowIdx > 0) {
      const row = activeSheet.data[lastRowIdx - 1] || []
      const hasData = row.some((c) => c && (c.f || (c.v !== undefined && c.v !== "")))
      if (hasData) break
      lastRowIdx--
    }
    return lastRowIdx
  }, [activeSheet])

  const getLastNonEmptyCol = useCallback((): number => {
    let lastColIdx = activeSheet.data.reduce((max, row) => Math.max(max, row.length), 0)
    while (lastColIdx > 0) {
      const hasData = activeSheet.data.some((row) => {
        const c = row[lastColIdx - 1]
        return c && (c.f || (c.v !== null && c.v !== undefined && c.v !== ""))
      })
      if (hasData) break
      lastColIdx--
    }
    return lastColIdx
  }, [activeSheet])

  const [rowCount, setRowCount] = useState(() => Math.max(getLastNonEmptyRow(), 100))
  const [colCount, setColCount] = useState(() => Math.max(getLastNonEmptyCol(), 26))
  const containerRef = useRef<HTMLDivElement>(null)
  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => containerRef.current,
    estimateSize: () => 28,
    overscan: 5,
  })
  const colVirtualizer = useVirtualizer({
    horizontal: true,
    count: colCount,
    getScrollElement: () => containerRef.current,
    estimateSize: () => 80,
    overscan: 5,
  })

  const handleScroll = () => {
    const el = containerRef.current
    if (!el) return
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 200) {
      setRowCount((c) => c + 50)
    }
    if (el.scrollWidth - el.scrollLeft - el.clientWidth < 200) {
      setColCount((c) => c + 20)
    }
  }
  const undoStack = useRef<
    Array<{
      sheetIndex: number
      r: number
      c: number
      prev: Partial<CellObject>
    }>
  >([])

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
    setRowCount(Math.max(getLastNonEmptyRow(), 100))
    setColCount(Math.max(getLastNonEmptyCol(), 26))
  }, [workbook, getLastNonEmptyRow, getLastNonEmptyCol])

  useEffect(() => {
    setHasChanges(initialHasChanges)
  }, [initialHasChanges])

  const handleUndo = useCallback(() => {
    const last = undoStack.current.pop()
    if (!last) return
    setSheets((prev) => {
      const copy = [...prev]
      const sheet = { ...copy[last.sheetIndex] }
      const data = [...sheet.data]
      const row = [...(data[last.r] || [])]
      row[last.c] = last.prev
      data[last.r] = row
      sheet.data = recalculateSheet(data)
      copy[last.sheetIndex] = sheet
      return copy
    })
    setHasChanges(true)
    onHasChangesChange?.(true)
  }, [onHasChangesChange])

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
  }, [isFullScreen, toggleFullScreen, onClose, handleUndo])


  const updateCell = useCallback(
    (r: number, c: number, cell: Partial<CellObject>) => {
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
      <div ref={containerRef} onScroll={handleScroll} className="flex-1 overflow-auto">
        <div
          style={{
            height: rowVirtualizer.getTotalSize(),
            width: colVirtualizer.getTotalSize(),
            position: "relative",
          }}
        >
          {rowVirtualizer.getVirtualItems().map((row) =>
            colVirtualizer.getVirtualItems().map((column) => {
              const cellData = activeSheet.data[row.index]?.[column.index]
              return (
                <div
                  key={`${row.index}-${column.index}`}
                  style={{
                    position: "absolute",
                    top: row.start,
                    left: column.start,
                    width: column.size,
                    height: row.size,
                  }}
                >
                  <ExcelCell
                    rowIndex={row.index}
                    colIndex={column.index}
                    cell={cellData}
                    onChange={updateCell}
                  />
                </div>
              )
            }),
          )}
        </div>
      </div>
    </div>
  )
}

export default ExcelEditor
