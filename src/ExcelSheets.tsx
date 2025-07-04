import React from "react"
import { twMerge } from "tailwind-merge"

interface ExcelSheetsProps {
  worksheets: Array<{
    id: number
    name: string
  }>
  activeSheetIndex: number
  setActiveSheetIndex: (index: number) => void
}

const ExcelSheets: React.FC<ExcelSheetsProps> = ({
  worksheets,
  activeSheetIndex,
  setActiveSheetIndex,
}) => {
  return (
    <div className="flex border-b border-gray-300 dark:border-neutral-600 bg-gray-500 dark:bg-neutral-800">
      {worksheets.map((ws, idx) => (
        <button
          key={ws.id}
          className={twMerge(
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
  )
}

export default ExcelSheets
