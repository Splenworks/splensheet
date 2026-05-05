import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import FileDropOverlay from "./FileDropOverlay"
import Header from "./Header"
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts"
import SheetGrid from "./SheetGrid"
import {
  selectActiveSheetData,
  selectColCount,
  selectRowCount,
} from "./state/spreadsheet"
import { downloadWorkbook } from "./state/buildWorkbook"
import { useSpreadsheet } from "./state/useSpreadsheet"
import { PartialCellObj } from "./types"
import SpinnerOverlay from "./ui/SpinnerOverlay"
import { loadWorkbook } from "./utils/workbook"

type CellPosition = { row: number; col: number }

const getCellValue = (c: PartialCellObj | undefined): string => {
  if (!c || c.v === undefined) return ""
  if (c.t === "b") return c.v ? "TRUE" : "FALSE"
  if (c.t === "d" && c.v instanceof Date) {
    const d = new Date(c.v)
    if (!isNaN(d.getTime())) return d.toLocaleDateString()
  }
  return String(c.v)
}

const SpreadsheetView: React.FC = () => {
  const { t } = useTranslation()
  const { state, dispatch } = useSpreadsheet()

  const [selectedCell, setSelectedCell] = useState<CellPosition | null>(null)
  const [findQuery, setFindQuery] = useState("")
  const [findIndex, setFindIndex] = useState(-1)
  const [isFindBarFocused, setIsFindBarFocused] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const gridRef = useRef<HTMLDivElement>(null)
  const parentRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const activeSheetData = selectActiveSheetData(state)
  const rowCount = useMemo(() => selectRowCount(state), [state])
  const colCount = useMemo(() => selectColCount(state), [state])

  useEffect(() => {
    document.title = state.fileName
      ? `${state.fileName} - SplenSheet`
      : "Splensheet - Free Online Spreadsheet Editor with Formula Support"
  }, [state.fileName])

  useEffect(() => {
    setSelectedCell(null)
    const parent = parentRef.current
    if (parent) {
      parent.scrollTop = 0
      parent.scrollLeft = 0
    }
  }, [state.activeSheetIndex])

  useEffect(() => {
    setFindIndex(-1)
  }, [findQuery, state.activeSheetIndex])

  const clearSelection = useCallback(() => {
    setSelectedCell(null)
  }, [])

  const selectCell = useCallback(
    (row: number, col: number) => {
      let r = row
      let c = col
      if (c >= colCount) {
        c = 0
        r += 1
      } else if (c < 0) {
        c = colCount - 1
        r -= 1
      }
      if (r < 0 || r >= rowCount) return

      setSelectedCell({ row: r, col: c })

      setTimeout(() => {
        gridRef.current
          ?.querySelector<HTMLDivElement>(`[data-row='${r}'][data-col='${c}']`)
          ?.scrollIntoView({ block: "nearest", inline: "nearest" })
      }, 0)

      const parent = parentRef.current
      if (parent) {
        const targetCell = parent.querySelector<HTMLElement>(`[data-col="${c}"]`)
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
    [rowCount, colCount],
  )

  const updateCell = useCallback(
    (r: number, c: number, cell: PartialCellObj) => {
      dispatch({ type: "update-cell", r, c, cell })
    },
    [dispatch],
  )

  const setActiveSheetIndex = useCallback(
    (index: number) => {
      dispatch({ type: "set-active-sheet", index })
    },
    [dispatch],
  )

  const setFileName = useCallback(
    (fileName: string) => {
      dispatch({ type: "set-file-name", fileName })
    },
    [dispatch],
  )

  const handleAddSheet = useCallback(() => {
    dispatch({
      type: "add-sheet",
      baseName: t("header.newSheetName", { defaultValue: "Sheet1" }),
    })
  }, [dispatch, t])

  const handleRenameSheet = useCallback(() => {
    const sheet = state.sheets[state.activeSheetIndex]
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

    if (state.sheets.some((s, i) => i !== state.activeSheetIndex && s.name === trimmed)) {
      window.alert(
        t("excelHeader.renameSheetDuplicate", {
          sheetName: trimmed,
          defaultValue: `A sheet named "${trimmed}" already exists.`,
        }),
      )
      return
    }

    dispatch({ type: "rename-sheet", index: state.activeSheetIndex, name: trimmed })
  }, [dispatch, state.sheets, state.activeSheetIndex, t])

  const handleDeleteSheet = useCallback(() => {
    if (state.sheets.length <= 1) return
    const sheet = state.sheets[state.activeSheetIndex]
    if (!sheet) return

    const confirmMessage = t("excelHeader.deleteSheetConfirm", {
      sheetName: sheet.name,
      defaultValue: `Delete "${sheet.name}"?`,
    })
    if (!window.confirm(confirmMessage)) return

    dispatch({ type: "delete-sheet", index: state.activeSheetIndex })
  }, [dispatch, state.sheets, state.activeSheetIndex, t])

  const processFile = useCallback(
    async (file: File) => {
      setIsLoading(true)
      try {
        const workbook = await loadWorkbook(file)
        if (!workbook) return
        dispatch({ type: "load-file", workbook, fileName: file.name })
        setSelectedCell(null)
        setFindQuery("")
        setFindIndex(-1)
      } finally {
        setIsLoading(false)
      }
    },
    [dispatch],
  )

  const handleFileInputChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
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
    },
    [processFile],
  )

  const handleOpen = useCallback(() => {
    const input = fileInputRef.current
    if (!input) return
    input.value = ""
    input.click()
  }, [])

  const handleDownload = useCallback(() => {
    downloadWorkbook(state)
    dispatch({ type: "mark-saved" })
  }, [state, dispatch])

  const findMatches = useMemo(() => {
    if (!findQuery) return []
    const q = findQuery.toLowerCase()
    const results: CellPosition[] = []
    activeSheetData.forEach((row, r) => {
      row?.forEach((cell, c) => {
        if (getCellValue(cell).toLowerCase().includes(q)) {
          results.push({ row: r, col: c })
        }
      })
    })
    return results
  }, [findQuery, activeSheetData])

  const gotoMatch = useCallback(
    (idx: number) => {
      const match = findMatches[idx]
      if (!match) return
      selectCell(match.row, match.col)
      setTimeout(() => {
        gridRef.current
          ?.querySelector<HTMLDivElement>(`[data-row='${match.row}'][data-col='${match.col}']`)
          ?.scrollIntoView({ block: "nearest", inline: "center" })
      }, 0)
    },
    [findMatches, selectCell],
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
    setIsFindBarFocused(true)
  }, [])

  const handleUndo = useCallback(() => {
    const entry = state.past.at(-1)
    if (!entry) return
    dispatch({ type: "undo" })
    selectCell(entry.r, entry.c)
  }, [state.past, dispatch, selectCell])

  const handleRedo = useCallback(() => {
    const entry = state.future.at(-1)
    if (!entry) return
    dispatch({ type: "redo" })
    selectCell(entry.r, entry.c)
  }, [state.future, dispatch, selectCell])

  useKeyboardShortcuts({
    selectedCell,
    selectCell,
    clearSelection,
    focusFind,
    onFindNext: handleFindNext,
    onFindPrev: handleFindPrev,
    onUndo: handleUndo,
    onRedo: handleRedo,
    gridRef,
  })

  const worksheets = useMemo(
    () => state.sheets.map((s) => ({ id: s.id, name: s.name })),
    [state.sheets],
  )

  return (
    <FileDropOverlay
      className="fixed inset-0 flex flex-col bg-white dark:bg-neutral-900"
      onFileDrop={processFile}
      overlayMessage={t("dragDropArea.overlayMessage", {
        defaultValue: "Drop spreadsheet to open",
      })}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        className="hidden"
        onChange={handleFileInputChange}
      />
      <SpinnerOverlay visible={isLoading} />
      <Header
        fileName={state.fileName}
        onFileNameChange={setFileName}
        worksheets={worksheets}
        activeSheetIndex={state.activeSheetIndex}
        setActiveSheetIndex={setActiveSheetIndex}
        onAddSheet={handleAddSheet}
        onRenameSheet={handleRenameSheet}
        onDeleteSheet={handleDeleteSheet}
        hasChanges={state.hasChanges}
        onOpen={handleOpen}
        onDownload={handleDownload}
        isFindBarFocused={isFindBarFocused}
        onFindBarFocusedChange={setIsFindBarFocused}
        findQuery={findQuery}
        onFindQueryChange={setFindQuery}
        onFindNext={handleFindNext}
        onFindPrev={handleFindPrev}
        findMatchIndex={findIndex}
        findMatchCount={findMatches.length}
      />
      <SheetGrid
        data={activeSheetData}
        colCount={colCount}
        rowCount={rowCount}
        selectedCell={selectedCell}
        selectCell={selectCell}
        updateCell={updateCell}
        parentRef={parentRef}
        gridRef={gridRef}
      />
    </FileDropOverlay>
  )
}

export default SpreadsheetView
