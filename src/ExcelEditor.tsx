import React, { useState } from "react"
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

  const worksheets = workbook.worksheets
  const activeSheet = worksheets[activeSheetIndex]

  const rows: (string | number | boolean | null)[][] = []
  activeSheet.eachRow((row) => {
    const values = row.values as unknown[]
    rows.push(
      values.slice(1).map((v) =>
        v === null || v === undefined
          ? ""
          : typeof v === "object"
            ? (v as { text?: string }).text ?? String(v)
            : String(v),
      ),
    )
  })

  const maxCols = rows.reduce((m, r) => Math.max(m, r.length), 0)

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
        <div className="flex-1 overflow-auto">
          <table className="min-w-max border-collapse text-sm">
            <tbody>
              {rows.map((row, rIdx) => (
                <tr key={rIdx}>
                  {Array.from({ length: maxCols }).map((_, cIdx) => (
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
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default ExcelEditor
