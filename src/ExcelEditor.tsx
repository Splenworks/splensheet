import React, { useState } from "react"
import ExcelJS from "exceljs"
import ExcelEditorHeader from "./ExcelEditorHeader"
import { useFullScreen } from "./hooks/useFullScreen"
import { getDarkmode } from "./utils/darkmode"
import { twJoin } from "tailwind-merge"
import ExcelCell from "./ExcelCell"

interface ExcelEditorProps {
  workbook: ExcelJS.Workbook
  fileName: string
  onClose: () => void
}

const ExcelEditor: React.FC<ExcelEditorProps> = ({ workbook, fileName, onClose }) => {
  const { isFullScreen, toggleFullScreen } = useFullScreen()
  const [darkMode, setDarkMode] = useState(getDarkmode())
  const [activeSheetIndex, setActiveSheetIndex] = useState(0)

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
        const result = (v as ExcelJS.CellFormulaValue | ExcelJS.CellSharedFormulaValue).result
        return result === undefined || result === null ? "" : String(result)
      }
      if ("error" in v && typeof v.error === "string") {
        return v.error
      }
    }
    return String(v)
  }

  const rowCount = activeSheet.rowCount
  const colCount = activeSheet.columnCount

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
      <ExcelEditorHeader
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        isFullScreen={isFullScreen}
        toggleFullScreen={toggleFullScreen}
        fileName={fileName}
        onClose={onClose}
      />
      <div className="flex flex-col flex-1 overflow-hidden">
        <div className="flex border-b border-gray-300 dark:border-neutral-600 bg-gray-500 dark:bg-neutral-800">
          {worksheets.map((ws, idx) => (
            <button
              key={ws.id}
              className={twJoin(
                `px-4 py-2 text-sm font-medium transition-colors duration-300 ease-in-out`,
                "text-black dark:text-white",
                idx === activeSheetIndex
                  ? "text-black bg-white dark:bg-neutral-900"
                  : "text-gray-900 hover:bg-gray-400 dark:hover:bg-neutral-800"
              )}
              onClick={() => setActiveSheetIndex(idx)}
            >
              {ws.name}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-auto">
          <table className="min-w-max border-collapse text-sm">
            <tbody>
              {rows.map((row, rIdx) => (
                <tr key={rIdx}>
                  {row.cells.map((cellData, cIdx) => (
                    <ExcelCell
                      key={cIdx}
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
