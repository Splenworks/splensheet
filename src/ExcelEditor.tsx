import React, { useState } from "react"
import { useTranslation } from "react-i18next"
import ExcelJS from "exceljs"
import ExpandIcon from "./assets/icons/expand.svg?react"
import CompressIcon from "./assets/icons/compress.svg?react"
import ExitIcon from "./assets/icons/exit.svg?react"
import IconButton from "./IconButton"
import Tooltip from "./Tooltip"
import DarkModeSwitchIcon from "./DarkModeSwitchIcon"
import { useFullScreen } from "./hooks/useFullScreen"
import { getDarkmode, toggleDarkmode } from "./utils/darkmode"

interface ExcelEditorProps {
  workbook: ExcelJS.Workbook
  onClose: () => void
}

const ExcelEditor: React.FC<ExcelEditorProps> = ({ workbook, onClose }) => {
  const { t } = useTranslation()
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

  const DarkModeIcon: React.FC<{ className?: string }> = ({ className }) => (
    <span className={className}>
      <DarkModeSwitchIcon
        darkMode={darkMode}
        sunColor="white"
        moonColor="white"
        size={18}
      />
    </span>
  )

  return (
    <div className="fixed inset-0 flex flex-col bg-white dark:bg-neutral-900">
      <header className="flex h-12 items-center justify-between bg-neutral-100 px-2 dark:bg-neutral-800">
        <div className="flex items-center space-x-2">
          <Tooltip text={t("others.exit")}> 
            <IconButton svgIcon={ExitIcon} onClick={onClose} />
          </Tooltip>
        </div>
        <div className="flex items-center space-x-2">
          <Tooltip text={t("others.toggleDarkMode")}> 
            <IconButton
              svgIcon={DarkModeIcon}
              onClick={() => {
                toggleDarkmode()
                setDarkMode((d) => !d)
              }}
            />
          </Tooltip>
          <Tooltip
            text={isFullScreen ? t("others.exitFullscreen") : t("others.fullscreen")}
          >
            <IconButton
              svgIcon={isFullScreen ? CompressIcon : ExpandIcon}
              onClick={toggleFullScreen}
            />
          </Tooltip>
        </div>
      </header>
      <div className="flex flex-col flex-1 overflow-hidden">
        <div className="flex border-b border-gray-300 dark:border-gray-700">
          {worksheets.map((ws, idx) => (
            <button
              key={ws.id}
              className={`px-4 py-2 text-sm font-medium transition-colors duration-300 ease-in-out ${
                idx === activeSheetIndex
                  ? "bg-gray-200 dark:bg-neutral-700"
                  : "hover:bg-gray-100 dark:hover:bg-neutral-800"
              }`}
              onClick={() => setActiveSheetIndex(idx)}
            >
              {ws.name}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-auto p-2">
          <table className="min-w-max border-collapse text-sm">
            <tbody>
              {rows.map((row, rIdx) => (
                <tr key={rIdx}>
                  {Array.from({ length: maxCols }).map((_, cIdx) => (
                    <td
                      key={cIdx}
                      className="border border-gray-300 px-2 py-1 dark:border-gray-700"
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
