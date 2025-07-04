import React, { useEffect, useRef, useState } from "react"
import ExcelJS from "exceljs"
import ExcelEditorHeader from "./ExcelEditorHeader"
import { useFullScreen } from "./hooks/useFullScreen"
import { getDarkmode } from "./utils/darkmode"
import { twJoin } from "tailwind-merge"

interface ExcelEditorProps {
  workbook: ExcelJS.Workbook
  onClose: () => void
}

const ExcelEditor: React.FC<ExcelEditorProps> = ({ workbook, onClose }) => {
  const { isFullScreen, toggleFullScreen } = useFullScreen()
  const [darkMode, setDarkMode] = useState(getDarkmode())
  const [activeSheetIndex, setActiveSheetIndex] = useState(0)
  const [fillCols, setFillCols] = useState(0)
  const [fillRows, setFillRows] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const tableRef = useRef<HTMLTableElement>(null)

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

  const rows = React.useMemo(() => {
    const r: (string | number | boolean | null)[][] = []
    activeSheet.eachRow((row) => {
      const values = row.values as ExcelJS.CellValue[]
      r.push(values.slice(1).map(getDisplayValue))
    })
    return r
  }, [activeSheet])

  const maxCols = React.useMemo(
    () => rows.reduce((m, r) => Math.max(m, r.length), 0),
    [rows],
  )

  useEffect(() => {
    const updateFill = () => {
      const container = containerRef.current
      const table = tableRef.current
      if (!container || !table) return
      const cell = table.querySelector("td") as HTMLTableCellElement | null
      if (!cell) return
      const cellWidth = cell.clientWidth || 1
      const cellHeight = cell.clientHeight || 1

      // reset
      let cols = 0
      let rowsCount = 0

      const hasVScroll = container.scrollHeight > container.clientHeight
      const hasHScroll = container.scrollWidth > container.clientWidth

      if (!hasHScroll) {
        const extraWidth = container.clientWidth - table.clientWidth
        if (extraWidth > 0) {
          cols = Math.floor(extraWidth / cellWidth)
        }
      }

      if (!hasVScroll) {
        const extraHeight = container.clientHeight - table.clientHeight
        if (extraHeight > 0) {
          rowsCount = Math.floor(extraHeight / cellHeight)
        }
      }

      setFillCols(cols)
      setFillRows(rowsCount)
    }

    updateFill()
    window.addEventListener("resize", updateFill)
    return () => window.removeEventListener("resize", updateFill)
  }, [rows, maxCols, activeSheetIndex])

  return (
    <div className="fixed inset-0 flex flex-col bg-white dark:bg-neutral-900">
      <ExcelEditorHeader
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        isFullScreen={isFullScreen}
        toggleFullScreen={toggleFullScreen}
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
        <div ref={containerRef} className="flex-1 overflow-auto">
          <table ref={tableRef} className="min-w-max border-collapse text-sm">
            <tbody>
              {rows.map((row, rIdx) => (
                <tr key={rIdx}>
                  {Array.from({ length: maxCols + fillCols }).map((_, cIdx) => (
                    <td
                      key={cIdx}
                      className={twJoin(
                        `px-2 py-1 text-black dark:text-white border border-gray-300 dark:border-neutral-600`,
                        rIdx === 0 && "border-t-0",
                      )}
                    >
                      {row[cIdx] ?? ""}
                    </td>
                  ))}
                </tr>
              ))}
              {Array.from({ length: fillRows }).map((_, rIdx) => (
                <tr key={`empty-${rIdx}`}>
                  {Array.from({ length: maxCols + fillCols }).map((_, cIdx) => (
                    <td
                      key={cIdx}
                      className="px-2 py-1 text-black dark:text-white border border-gray-300 dark:border-neutral-600"
                    ></td>
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
