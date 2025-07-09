import ExcelJS from "exceljs"
import React, { useEffect, useState } from "react"
import ExcelCell from "./ExcelCell"
import ExcelHeader from "./ExcelHeader"
import { useFullScreen } from "./hooks/useFullScreen"

interface ExcelEditorProps {
  workbook: ExcelJS.Workbook
  fileName: string
  onClose: () => void
}

const ExcelEditor: React.FC<ExcelEditorProps> = ({
  workbook,
  fileName,
  onClose,
}) => {
  const { isFullScreen, toggleFullScreen } = useFullScreen()
  const [activeSheetIndex, setActiveSheetIndex] = useState(0)

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

  const worksheets = workbook.worksheets
  const activeSheet = worksheets[activeSheetIndex]

  const getDisplayValue = (v: ExcelJS.CellValue): string => {
    if (v === null || v === undefined) {
      return ""
    }
    if (typeof v === "number" || typeof v === "boolean") {
      return String(v)
    }
    if (typeof v === "string") {
      return v
    }
    if (v instanceof Date) {
      return v.toISOString()
    }
    if (typeof v === "object") {
      if ("text" in v && typeof v.text === "string") {
        return v.text
      }
      if ("richText" in v && Array.isArray(v.richText)) {
        return v.richText.map((t) => t.text).join("")
      }
      if ("formula" in v || "sharedFormula" in v) {
        const result = (
          v as ExcelJS.CellFormulaValue | ExcelJS.CellSharedFormulaValue
        ).result
        return result === undefined || result === null ? "" : String(result)
      }
      if ("error" in v && typeof v.error === "string") {
        return v.error
      }
    }
    return String(v)
  }

  const getLastNonEmptyRow = (): number => {
    let lastRowIdx = activeSheet.rowCount
    while (lastRowIdx > 0) {
      const row = activeSheet.getRow(lastRowIdx)
      const hasData =
        Array.isArray(row.values) &&
        row.values.some((v, idx) => {
          if (idx === 0) return false
          return v !== null && v !== undefined && v !== ""
        })
      if (hasData) break
      lastRowIdx--
    }
    return lastRowIdx
  }

  const rowCount = getLastNonEmptyRow()

  const getLastNonEmptyCol = (): number => {
    let lastColIdx = activeSheet.columnCount
    while (lastColIdx > 0) {
      const col = activeSheet.getColumn(lastColIdx)
      const hasData = col.values.some((v, idx) => {
        if (idx === 0) return false
        return v !== null && v !== undefined && v !== ""
      })
      if (hasData) break
      lastColIdx--
    }
    return lastColIdx
  }

  const colCount = getLastNonEmptyCol()

  const columnWidths = Array.from({ length: colCount }).map((_, idx) => {
    const col = activeSheet.getColumn(idx + 1)
    return col.width
  })

  const rows = Array.from({ length: rowCount }).map((_, rIdx) => {
    const row = activeSheet.getRow(rIdx + 1)
    const cells = Array.from({ length: colCount }).map((_, cIdx) => {
      const cell = row.getCell(cIdx + 1)
      return { cell, value: getDisplayValue(cell.value) }
    })
    return { row, cells }
  })

  return (
    <div className="fixed inset-0 flex flex-col bg-white dark:bg-neutral-900">
      <ExcelHeader
        isFullScreen={isFullScreen}
        toggleFullScreen={toggleFullScreen}
        fileName={fileName}
        onClose={onClose}
        worksheets={worksheets.map((ws) => ({ id: ws.id, name: ws.name }))}
        activeSheetIndex={activeSheetIndex}
        setActiveSheetIndex={setActiveSheetIndex}
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
                      cell={cellData.cell}
                      value={cellData.value}
                      rowHeight={row.row.height}
                      colWidth={columnWidths[cIdx]}
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
