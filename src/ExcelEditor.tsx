import React, { useEffect, useRef, useState, useCallback, useMemo } from "react"
import { useVirtualizer } from "@tanstack/react-virtual"
import Header, { HeaderRef } from "./Header"
import { useFullScreen } from "./hooks/useFullScreen"
import { writeFile } from "xlsx"
import type { WorkBook } from "xlsx"
import { recalculateSheet } from "./utils/recalculateSheet"
import { dataToSheet, sheetToData } from "./utils/xlsx"
import { isMac } from "./utils/isMac"
import { getLastNonEmptyRow, getLastNonEmptyCol } from "./utils/sheetStats"
import { PartialCellObj } from "./types"
import { getMaxColumnIndex } from "./utils/columnUtils"
import { useTranslation } from "react-i18next"
import { loadWorkbook } from "./utils/workbook"
import SpinnerOverlay from "./ui/SpinnerOverlay"
import SheetGrid from "./SheetGrid"
import FileDropOverlay from "./FileDropOverlay"
import { useWorkbookSheets } from "./hooks/useWorkbookSheets"
import { useUndoRedo, type UndoRedoEntry } from "./hooks/useUndoRedo"
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts"
import { useSelection } from "./hooks/useSelection"

const EXTRA_ROWS = 20
const EXTRA_COLS = 20
const MAX_COLS = getMaxColumnIndex()

interface ExcelEditorProps {
  workbook: WorkBook
  fileName: string
  onWorkbookChange?: (workbook: WorkBook) => void
  initialHasChanges?: boolean
  onHasChangesChange?: (hasChanges: boolean) => void
  onFileNameChange?: (val: string) => void
}

const ExcelEditor: React.FC<ExcelEditorProps> = ({
  workbook,
  fileName,
  onWorkbookChange,
  initialHasChanges = false,
  onHasChangesChange,
  onFileNameChange,
}) => {
  const { t } = useTranslation()
  const { isFullScreen, toggleFullScreen } = useFullScreen()
  const [hasChanges, setHasChanges] = useState(initialHasChanges)
  const [findQuery, setFindQuery] = useState("")
  const [findIndex, setFindIndex] = useState(-1)
  const [isLoadingFile, setIsLoadingFile] = useState(false)
  const headerRef = useRef<HeaderRef>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const parentRef = useRef<HTMLDivElement>(null)
  const rowCountRef = useRef(0)
  const colCountRef = useRef(0)

  const localizedNewSheetName = t("header.newSheetName", { defaultValue: "Sheet1" })
  const {
    sheets,
    setSheets,
    activeSheet,
    activeSheetIndex,
    setActiveSheetIndex,
    addSheet,
    renameSheet,
    deleteSheet,
  } = useWorkbookSheets(workbook, localizedNewSheetName)

  useEffect(() => {
    setHasChanges(initialHasChanges)
  }, [initialHasChanges])

  const markChanged = useCallback(() => {
    setHasChanges(true)
    onHasChangesChange?.(true)
  }, [onHasChangesChange])

  const activeSheetData = activeSheet?.data ?? []
  const rowCount = useMemo(
    () => getLastNonEmptyRow(activeSheetData) + EXTRA_ROWS,
    [activeSheetData],
  )

  const lastNonEmptyColIndex = useMemo(
    () => getLastNonEmptyCol(activeSheetData),
    [activeSheetData],
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

  const handleOpenDialog = useCallback(() => {
    const input = fileInputRef.current
    if (!input) return
    input.value = ""
    input.click()
  }, [])

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
    activeSheetData.forEach((row, r) => {
      row?.forEach((cell, c) => {
        const val = getCellValue(cell).toLowerCase()
        if (val.includes(q)) results.push({ row: r, col: c })
      })
    })
    return results
  }, [findQuery, activeSheetData, getCellValue])

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

  const handleAddSheet = useCallback(() => {
    const didAdd = addSheet()
    if (didAdd) {
      markChanged()
    }
  }, [addSheet, markChanged])

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

    renameSheet(activeSheetIndex, trimmed)
    markChanged()
  }, [activeSheetIndex, sheets, t, renameSheet, markChanged])

  const { selectedCell, selectCell, clearSelection } = useSelection({
    activeSheetIndex,
    rowCountRef,
    colCountRef,
    useVirtual,
    rowVirtualizer,
    gridRef,
    parentRef,
  })

  const { undo, redo, resetHistory, recordChange } = useUndoRedo({
    setSheets,
    recalculate: recalculateSheet,
    selectCell,
    onChange: markChanged,
  })

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
        const entry: UndoRedoEntry = {
          sheetIndex: activeSheetIndex,
          r,
          c,
          prev: row[c] ?? {},
        }

        recordChange(entry)
        row[c] = cell
        data[r] = row
        sheet.data = recalculateSheet(data)
        copy[activeSheetIndex] = sheet
        return copy
      })
      markChanged()
    },
    [activeSheetIndex, markChanged, recordChange, setSheets, recalculateSheet],
  )
  
  const handleDeleteSheet = useCallback(() => {
    if (sheets.length <= 1) return

    const sheet = sheets[activeSheetIndex]
    if (!sheet) return

    const confirmMessage = t("excelHeader.deleteSheetConfirm", {
      sheetName: sheet.name,
      defaultValue: `Delete "${sheet.name}"?`,
    })
    if (!window.confirm(confirmMessage)) return

    const didDelete = deleteSheet(activeSheetIndex)
    if (!didDelete) return
    markChanged()
    resetHistory()
  }, [activeSheetIndex, sheets, t, deleteSheet, markChanged, resetHistory])

  const processFile = useCallback(async (file: File) => {
    setIsLoadingFile(true)

    try {
      const nextWorkbook = await loadWorkbook(file)
      if (!nextWorkbook) return

      const nextSheets = nextWorkbook.SheetNames.map((name, idx) => ({
        id: idx + 1,
        name,
        data: sheetToData(nextWorkbook.Sheets[name]),
      }))

      setSheets(nextSheets)
      setActiveSheetIndex(0)
      clearSelection()
      setFindQuery("")
      setFindIndex(-1)
      resetHistory()

      onFileNameChange?.(file.name)
      setHasChanges(false)
      onHasChangesChange?.(false)
      onWorkbookChange?.(nextWorkbook)
    } finally {
      setIsLoadingFile(false)
    }
  }, [
    clearSelection,
    onWorkbookChange,
    onFileNameChange,
    onHasChangesChange,
    resetHistory,
    setActiveSheetIndex,
    setSheets,
  ])

  const handleFileInputChange = useCallback(async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const input = event.target
    const file = input.files?.[0]
    if (!file) {
      input.value = ""
      return
    }

    try {
      await processFile(file)
    } finally {
      input.value = ""
    }
  }, [processFile])

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

  const focusFind = useCallback(() => {
    headerRef.current?.focusFind()
  }, [])

  useKeyboardShortcuts({
    isFullScreen,
    toggleFullScreen,
    isMac,
    selectedCell,
    selectCell,
    clearSelection,
    focusFind,
    onFindNext: handleFindNext,
    onFindPrev: handleFindPrev,
    onUndo: undo,
    onRedo: redo,
    gridRef,
  })

  useEffect(() => {
    setFindIndex(-1)
  }, [findQuery, activeSheetIndex])

  useEffect(() => {
    const sheetName = workbook.SheetNames[activeSheetIndex]
    dataToSheet(sheets[activeSheetIndex].data, workbook.Sheets[sheetName])
    onWorkbookChange?.(workbook)
  }, [sheets, activeSheetIndex, workbook, onWorkbookChange])

  const virtualRows = useVirtual ? rowVirtualizer.getVirtualItems() : undefined
  const paddingTop = useVirtual && virtualRows && virtualRows.length > 0 ? virtualRows[0].start : 0
  const paddingBottom = useVirtual && virtualRows && virtualRows.length > 0
    ? rowVirtualizer.getTotalSize() - virtualRows[virtualRows.length - 1].end
    : 0
  const gridHeight = useVirtual ? rowVirtualizer.getTotalSize() + 32 : undefined

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
    <FileDropOverlay
      className="fixed inset-0 flex flex-col bg-white dark:bg-neutral-900"
      onFileDrop={processFile}
      overlayMessage={t("dragDropArea.overlayMessage", { defaultValue: "Drop spreadsheet to open" })}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        className="hidden"
        onChange={handleFileInputChange}
      />
      <Header
        ref={headerRef}
        isFullScreen={isFullScreen}
        toggleFullScreen={toggleFullScreen}
        fileName={fileName}
        onFileNameChange={onFileNameChange}
        worksheets={sheets.map((ws) => ({ id: ws.id, name: ws.name }))}
        activeSheetIndex={activeSheetIndex}
        setActiveSheetIndex={setActiveSheetIndex}
        onAddSheet={handleAddSheet}
        onRenameSheet={handleRenameSheet}
        onDeleteSheet={handleDeleteSheet}
        hasChanges={hasChanges}
        onOpen={handleOpenDialog}
        onDownload={handleDownload}
        findQuery={findQuery}
        onFindQueryChange={setFindQuery}
        onFindNext={handleFindNext}
        onFindPrev={handleFindPrev}
        findMatchIndex={findIndex}
        findMatchCount={findMatches.length}
      />
      <SpinnerOverlay visible={isLoadingFile} />
      <SheetGrid
        data={activeSheetData}
        colCount={colCount}
        rowCount={rowCount}
        selectedCell={selectedCell}
        selectCell={selectCell}
        updateCell={updateCell}
        useVirtual={useVirtual}
        virtualRows={virtualRows}
        paddingTop={paddingTop}
        paddingBottom={paddingBottom}
        totalHeight={gridHeight}
        parentRef={parentRef}
        gridRef={gridRef}
      />
    </FileDropOverlay>
  )
}

export default ExcelEditor
