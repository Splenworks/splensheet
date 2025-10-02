import React, { useEffect, useRef, useState, useCallback, useMemo } from "react"
import { useVirtualizer } from "@tanstack/react-virtual"
import ExcelCell from "./ExcelCell"
import ExcelHeader, { ExcelHeaderRef } from "./ExcelHeader"
import { useFullScreen } from "./hooks/useFullScreen"
import { writeFile, utils } from "xlsx"
import type { WorkBook } from "xlsx"
import { recalculateSheet } from "./utils/recalculateSheet"
import { sheetToData, dataToSheet } from "./utils/xlsx"
import { isMac } from "./utils/isMac"
import { getLastNonEmptyRow, getLastNonEmptyCol } from "./utils/sheetStats"
import { PartialCellObj, SheetData } from "./types"
import { getMaxColumnIndex, indexToColumnName } from "./utils/columnUtils"
import { useTranslation } from "react-i18next"

const EXTRA_ROWS = 20
const EXTRA_COLS = 20
const MAX_COLS = getMaxColumnIndex()

interface ExcelEditorProps {
  workbook: WorkBook
  fileName: string
  onClose: () => void
  onWorkbookChange?: (workbook: WorkBook) => void
  initialHasChanges?: boolean
  onHasChangesChange?: (hasChanges: boolean) => void
  onFileNameChange?: (val: string) => void
}

const ExcelEditor: React.FC<ExcelEditorProps> = ({
  workbook,
  fileName,
  onClose,
  onWorkbookChange,
  initialHasChanges = false,
  onHasChangesChange,
  onFileNameChange,
}) => {
  const { t } = useTranslation()
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
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null)
  const [findQuery, setFindQuery] = useState("")
  const [findIndex, setFindIndex] = useState(-1)
  const headerRef = useRef<ExcelHeaderRef>(null)
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
  const parentRef = useRef<HTMLDivElement>(null)
  const rowCountRef = useRef(0)
  const colCountRef = useRef(0)

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


  const rowCount = useMemo(
    () => getLastNonEmptyRow(activeSheet.data) + EXTRA_ROWS,
    [activeSheet.data],
  )

  const lastNonEmptyColIndex = useMemo(
    () => getLastNonEmptyCol(activeSheet.data),
    [activeSheet.data],
  )

  const colCount = useMemo(
    () => Math.min(lastNonEmptyColIndex + EXTRA_COLS, MAX_COLS + 1),
    [lastNonEmptyColIndex],
  )

  const useVirtual = rowCount > 300

  useEffect(() => {
    rowCountRef.current = rowCount
    colCountRef.current = colCount
  }, [rowCount, colCount])

  useEffect(() => {
    setSelectedCell(null)
  }, [activeSheetIndex])

  const getCellValue = useCallback((c: PartialCellObj | undefined) => {
    if (!c || c.v === undefined) return ""
    if (c.t === "b") return c.v ? "TRUE" : "FALSE"
    if (c.t === "d" && c.v instanceof Date) {
      const d = new Date(c.v)
      if (!isNaN(d.getTime())) return d.toLocaleDateString()
    }
    return String(c.v)
  }, [])

  const findMatches = useMemo(() => {
    if (!findQuery) return []
    const q = findQuery.toLowerCase()
    const results: Array<{ row: number; col: number }> = []
    activeSheet.data.forEach((row, r) => {
      row?.forEach((cell, c) => {
        const val = getCellValue(cell).toLowerCase()
        if (val.includes(q)) results.push({ row: r, col: c })
      })
    })
    return results
  }, [findQuery, activeSheet.data, getCellValue])

  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 32,
    overscan: 50,
  })

  useEffect(() => {
    const parent = parentRef.current
    if (!parent) return

    parent.scrollTop = 0
    parent.scrollLeft = 0

    if (useVirtual) {
      rowVirtualizer.scrollToIndex(0)
    }
  }, [activeSheetIndex, rowVirtualizer, useVirtual])

  const getNextSheetName = useCallback((existingNames: string[]) => {
    const localized = t("header.newSheetName", { defaultValue: "Sheet1" })
    const trimmed = localized.trim()
    const match = trimmed.match(/^(.*?)(\d+)$/)
    const prefix = (match?.[1] ?? trimmed.replace(/\d+$/, "")) || "Sheet"
    const start = match ? parseInt(match[2], 10) || 1 : 1
    const usedNames = new Set(existingNames)

    if (!match && trimmed && !usedNames.has(trimmed)) {
      return trimmed
    }

    let counter = start
    let candidate = `${prefix}${counter}`
    while (usedNames.has(candidate)) {
      counter += 1
      candidate = `${prefix}${counter}`
    }
    return candidate
  }, [t])

  const handleAddSheet = useCallback(() => {
    let newSheetIndex = 0
    let newSheetName = ""
    const blankWorksheet = utils.aoa_to_sheet([[]])
    const newSheetData = sheetToData(blankWorksheet)

    setSheets((prevSheets) => {
      const nextName = getNextSheetName(prevSheets.map((sheet) => sheet.name))
      const nextId = prevSheets.reduce((max, sheet) => Math.max(max, sheet.id), 0) + 1
      const updatedSheets = [
        ...prevSheets,
        {
          id: nextId,
          name: nextName,
          data: newSheetData,
        },
      ]
      newSheetIndex = updatedSheets.length - 1
      newSheetName = nextName
      return updatedSheets
    })

    if (!newSheetName) return

    workbook.SheetNames.push(newSheetName)
    workbook.Sheets[newSheetName] = blankWorksheet
    setActiveSheetIndex(newSheetIndex)
    setHasChanges(true)
    onHasChangesChange?.(true)
  }, [getNextSheetName, workbook, onHasChangesChange])

  const handleRenameSheet = useCallback(() => {
    const sheet = sheets[activeSheetIndex]
    if (!sheet) return

    const currentName = sheet.name
    const promptMessage = t("excelHeader.renameSheetPrompt", {
      sheetName: currentName,
      defaultValue: `Enter a new name for "${currentName}"`,
    })
    const result = window.prompt(promptMessage, currentName)
    if (result === null) return

    const trimmed = result.trim()
    if (!trimmed || trimmed === currentName) return

    if (sheets.some((ws, idx) => idx !== activeSheetIndex && ws.name === trimmed)) {
      window.alert(t("excelHeader.renameSheetDuplicate", {
        sheetName: trimmed,
        defaultValue: `A sheet named "${trimmed}" already exists.`,
      }))
      return
    }

    setSheets((prev) => {
      const updated = [...prev]
      updated[activeSheetIndex] = {
        ...updated[activeSheetIndex],
        name: trimmed,
      }
      return updated
    })

    const oldName = workbook.SheetNames[activeSheetIndex]
    if (oldName !== trimmed) {
      workbook.SheetNames[activeSheetIndex] = trimmed
      workbook.Sheets[trimmed] = workbook.Sheets[oldName]
      delete workbook.Sheets[oldName]
    }

    setHasChanges(true)
    onHasChangesChange?.(true)
  }, [activeSheetIndex, sheets, t, workbook, onHasChangesChange])

  const handleDeleteSheet = useCallback(() => {
    if (sheets.length <= 1) return

    const sheet = sheets[activeSheetIndex]
    if (!sheet) return

    const confirmMessage = t("excelHeader.deleteSheetConfirm", {
      sheetName: sheet.name,
      defaultValue: `Delete "${sheet.name}"?`,
    })
    if (!window.confirm(confirmMessage)) return

    const removedName = workbook.SheetNames[activeSheetIndex]
    const nextActiveIndex = activeSheetIndex >= sheets.length - 1
      ? Math.max(0, sheets.length - 2)
      : activeSheetIndex

    setSheets((prev) => prev.filter((_, idx) => idx !== activeSheetIndex))
    workbook.SheetNames.splice(activeSheetIndex, 1)
    delete workbook.Sheets[removedName]

    setActiveSheetIndex(nextActiveIndex)
    setHasChanges(true)
    onHasChangesChange?.(true)
    undoStack.current = []
    redoStack.current = []
  }, [activeSheetIndex, sheets, t, workbook, onHasChangesChange])

  const selectCell = useCallback(
    (row: number, col: number) => {
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

      setSelectedCell({ row: r, col: c })

      // Scroll to the target row
      if (useVirtual) {
        rowVirtualizer.scrollToIndex(r)
      } else {
        setTimeout(() => {
          gridRef.current
            ?.querySelector<HTMLDivElement>(`[data-row='${r}'][data-col='${c}']`)
            ?.scrollIntoView({ block: "nearest", inline: "nearest" })
        }, 0)
      }

      // Handle horizontal scrolling
      const parent = parentRef.current
      if (parent) {
        let targetCell: HTMLElement | null = null
        targetCell = parent.querySelector(`[data-col="${c}"]`)
        if (targetCell) {
          const cellRect = targetCell.getBoundingClientRect()
          const parentWidth = parent.clientWidth
          if (cellRect.left < 0 || cellRect.right > parentWidth) {
            const left = cellRect.left - parent.getBoundingClientRect().left + parent.scrollLeft
            if (left < parent.scrollLeft) {
              parent.scrollLeft = left
            } else if (left + cellRect.width > parent.scrollLeft + parentWidth) {
              parent.scrollLeft = left + cellRect.width - parentWidth
            }
          }
        }
      }
    },
    [rowVirtualizer, useVirtual],
  )

  const gotoMatch = useCallback(
    (idx: number) => {
      const match = findMatches[idx]
      if (!match) return
      if (useVirtual) rowVirtualizer.scrollToIndex(match.row)
      selectCell(match.row, match.col)
      setTimeout(() => {
        gridRef.current
          ?.querySelector<HTMLDivElement>(`[data-row='${match.row}'][data-col='${match.col}']`)
          ?.scrollIntoView({ block: "nearest", inline: "center" })
      }, 0)
    },
    [findMatches, rowVirtualizer, selectCell, useVirtual],
  )

  const handleFindNext = useCallback(() => {
    if (findMatches.length === 0) return
    const next = (findIndex + 1) % findMatches.length
    setFindIndex(next)
    gotoMatch(next)
  }, [findMatches, findIndex, gotoMatch])

  const handleFindPrev = useCallback(() => {
    if (findMatches.length === 0) return
    const prev = (findIndex - 1 + findMatches.length) % findMatches.length
    setFindIndex(prev)
    gotoMatch(prev)
  }, [findMatches, findIndex, gotoMatch])

  useEffect(() => {
    setFindIndex(-1)
  }, [findQuery, activeSheetIndex])

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
    selectCell(last.r, last.c)
  }, [onHasChangesChange, selectCell])

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
    selectCell(last.r, last.c)
  }, [onHasChangesChange, selectCell])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase()

      // Check if any input is currently focused (to avoid interfering with cell editing)
      const activeElement = document.activeElement
      const isInputFocused = activeElement?.tagName === 'INPUT' || activeElement?.tagName === 'TEXTAREA'

      if (
        (isMac && event.metaKey && key === "f") ||
        (!isMac && event.ctrlKey && key === "f")
      ) {
        event.preventDefault()
        headerRef.current?.focusFind()
        return
      }

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
      if (
        (isMac && event.metaKey && key === "g") ||
        (!isMac && event.ctrlKey && key === "g")
      ) {
        event.preventDefault()
        if (event.shiftKey) {
          handleFindPrev()
        } else {
          handleFindNext()
        }
        return
      }
      if (key === "escape") {
        if (isFullScreen) {
          toggleFullScreen()
        } else if (selectedCell) {
          setSelectedCell(null)
        }
        return
      }

      // Handle arrow key navigation when not editing a cell
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
    isFullScreen,
    toggleFullScreen,
    onClose,
    handleUndo,
    handleRedo,
    handleFindNext,
    handleFindPrev,
    selectedCell,
    selectCell,
  ])

  const updateCell = useCallback(
    (r: number, c: number, cell: PartialCellObj) => {
      setSheets((prev) => {
        const copy = [...prev]
        const sheet = { ...copy[activeSheetIndex] }
        const data = [...sheet.data]

        while (data.length <= r) {
          data.push([])
        }

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

  const virtualRows = useVirtual ? rowVirtualizer.getVirtualItems() : []
  const paddingTop = useVirtual && virtualRows.length > 0 ? virtualRows[0].start : 0
  const paddingBottom = useVirtual && virtualRows.length > 0
    ? rowVirtualizer.getTotalSize() - virtualRows[virtualRows.length - 1].end
    : 0

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
        ref={headerRef}
        isFullScreen={isFullScreen}
        toggleFullScreen={toggleFullScreen}
        fileName={fileName}
        onFileNameChange={onFileNameChange}
        onClose={onClose}
        worksheets={sheets.map((ws) => ({ id: ws.id, name: ws.name }))}
        activeSheetIndex={activeSheetIndex}
        setActiveSheetIndex={setActiveSheetIndex}
        onAddSheet={handleAddSheet}
        onRenameSheet={handleRenameSheet}
        onDeleteSheet={handleDeleteSheet}
        hasChanges={hasChanges}
        onDownload={handleDownload}
        findQuery={findQuery}
        onFindQueryChange={setFindQuery}
        onFindNext={handleFindNext}
        onFindPrev={handleFindPrev}
        findMatchIndex={findIndex}
        findMatchCount={findMatches.length}
      />
      <div ref={parentRef} className="flex-1 overflow-x-scroll overflow-y-scroll">
        <div
          ref={gridRef}
          className="min-w-max text-sm grid"
          style={{
            gridTemplateColumns: `minmax(3rem, max-content) repeat(${colCount}, minmax(3rem, max-content))`,
            height: useVirtual ? rowVirtualizer.getTotalSize() + 32 : undefined,
          }}
        >
          {/* Corner cell (top-left) */}
          <div
            key={`corner`}
            className={
              "sticky top-0 left-0 z-40 bg-gray-100 dark:bg-neutral-800 " +
              "px-2 h-8 flex items-center justify-center " +
              "border border-gray-300 dark:border-neutral-600 text-black dark:text-white"
            }
          />
          {/* Sticky Column Header Row */}
          {Array.from({ length: colCount }).map((_, cIdx) => (
            <div
              key={`header-${cIdx}`}
              className={
                "sticky top-0 z-30 bg-gray-100 dark:bg-neutral-800 " +
                "px-2 h-8 flex items-center justify-center -ml-px " +
                "border border-gray-300 dark:border-neutral-600 text-black dark:text-white"
              }
            >
              {indexToColumnName(cIdx)}
            </div>
          ))}
          {useVirtual && paddingTop > 0 && (
            <div
              style={{ height: paddingTop, gridColumn: `1 / span ${colCount + 1}` }}
            />
          )}
          {(useVirtual ? virtualRows.map(v => v.index) : Array.from({ length: rowCount }, (_, i) => i)).map((rIdx) => {
            const rowData = activeSheet.data[rIdx] || []
            return [
              <div
                key={`rowheader-${rIdx}`}
                className={
                  "sticky left-0 z-30 bg-gray-100 dark:bg-neutral-800 " +
                  "px-2 flex items-center justify-center -mt-px " +
                  "border border-gray-300 dark:border-neutral-600 text-black dark:text-white"
                }
              >
                {rIdx + 1}
              </div>,
              ...Array.from({ length: colCount }).map((_, cIdx) => (
                <ExcelCell
                  key={`${rIdx}-${cIdx}`}
                  rowIndex={rIdx}
                  colIndex={cIdx}
                  cell={rowData[cIdx]}
                  isSelected={selectedCell?.row === rIdx && selectedCell?.col === cIdx}
                  onChange={updateCell}
                  selectCell={selectCell}
                  isExtraColumn={cIdx >= lastNonEmptyColIndex}
                />
              )),
            ]
          })}
          {useVirtual && paddingBottom > 0 && (
            <div
              style={{ height: paddingBottom, gridColumn: `1 / span ${colCount + 1}` }}
            />
          )}
        </div>
      </div>
    </div>
  )
}

export default ExcelEditor
