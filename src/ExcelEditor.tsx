import React, { useEffect, useRef, useState, useCallback } from "react"
import ExcelCell from "./ExcelCell"
import ExcelHeader from "./ExcelHeader"
import { useFullScreen } from "./hooks/useFullScreen"
import { utils, writeFile } from "xlsx"
import type { WorkBook, CellObject, WorkSheet } from "xlsx"
import { evaluateFormula } from "./utils/evaluateFormula"
import { getCellType } from "./utils/xlsx"

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

  const sheetToData = (ws: WorkSheet): Array<Array<Partial<CellObject>>> => {
    const range = utils.decode_range(ws['!ref'] || 'A1')
    const rowCount = range.e.r + 1
    const colCount = range.e.c + 1
    const data: Array<Array<Partial<CellObject>>> = Array.from(
      { length: rowCount },
      () => Array.from({ length: colCount }, () => ({})),
    )
    for (let R = range.s.r; R <= range.e.r; R++) {
      for (let C = range.s.c; C <= range.e.c; C++) {
        const addr = utils.encode_cell({ r: R, c: C })
        const cell: CellObject = ws[addr]
        if (cell) {
          cell.t = cell.t || getCellType(cell.v)
          data[R][C] = cell
        }
      }
    }
    return data
  }

  const dataToSheet = (
    data: Array<Array<Partial<CellObject>>>,
    ws: WorkSheet,
  ) => {
    for (let r = 0; r < data.length; r++) {
      for (let c = 0; c < data[r].length; c++) {
        const cell = data[r][c]
        const addr = utils.encode_cell({ r, c })
        if (cell && (cell.v !== undefined || cell.f)) {
          ws[addr] = { v: cell.v ?? undefined, f: cell.f } as CellObject
        } else {
          delete ws[addr]
        }
      }
    }
    const rowCount = data.length
    const colCount = data.reduce((m, r) => Math.max(m, r.length), 0)
    ws['!ref'] = utils.encode_range({
      s: { r: 0, c: 0 },
      e: { r: rowCount - 1, c: colCount - 1 },
    })
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

  useEffect(() => {
    activeDataRef.current = sheets[activeSheetIndex].data
  }, [sheets, activeSheetIndex])

  const evaluateAt = useCallback(
    (
      r: number,
      c: number,
      formula: string,
    ): string | number | boolean | undefined => {
      const data = [...activeDataRef.current]
      const row = [...(data[r] || [])]
      row[c] = { f: formula }
      data[r] = row
      return evaluateFormula(data, r, c)
    },
    [],
  )

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

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
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
  }, [isFullScreen, toggleFullScreen, onClose])

  const getLastNonEmptyRow = (): number => {
    let lastRowIdx = activeSheet.data.length
    while (lastRowIdx > 0) {
      const row = activeSheet.data[lastRowIdx - 1] || []
      const hasData = row.some((c) =>
        c && (c.f || (c.v !== undefined && c.v !== "")),
      )
      if (hasData) break
      lastRowIdx--
    }
    return lastRowIdx
  }

  const rowCount = getLastNonEmptyRow()

  const getLastNonEmptyCol = (): number => {
    let lastColIdx = activeSheet.data.reduce(
      (max, row) => Math.max(max, row.length),
      0,
    )
    while (lastColIdx > 0) {
      const hasData = activeSheet.data.some((row) => {
        const c = row[lastColIdx - 1]
        return c && (c.f || (c.v !== null && c.v !== undefined && c.v !== ""))
      })
      if (hasData) break
      lastColIdx--
    }
    return lastColIdx
  }

  const colCount = getLastNonEmptyCol()

  const updateCell = useCallback(
    (r: number, c: number, cell: Partial<CellObject>) => {
      setSheets((prev) => {
        const copy = [...prev]
        const sheet = { ...copy[activeSheetIndex] }
        const data = [...sheet.data]
        const row = [...(data[r] || [])]
        row[c] = cell
        data[r] = row
        sheet.data = data
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

  const rows = Array.from({ length: rowCount }).map((_, rIdx) => {
    const rowData = activeSheet.data[rIdx] || []
    const cells = Array.from({ length: colCount }).map((_, cIdx) => {
      return rowData[cIdx]
    })
    return { cells }
  })

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
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex-1 overflow-auto">
          <table className="min-w-max border-collapse text-sm">
            <tbody>
              {rows.map((row, rIdx) => (
                <tr key={rIdx}>
                  {row.cells.map((cellData, cIdx) => (
                    <ExcelCell
                      key={cIdx}
                      rowIndex={rIdx}
                      colIndex={cIdx}
                      cell={cellData}
                      evaluate={evaluateAt}
                      onChange={updateCell}
                    />
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default ExcelEditor
