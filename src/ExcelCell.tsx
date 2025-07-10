import React from "react"
import { twMerge } from "tailwind-merge"

interface ExcelCellProps {
  rowIndex: number
  value: string | number | boolean | null
}

const ExcelCell: React.FC<ExcelCellProps> = ({ rowIndex, value }) => {
  return (
    <td
      className={twMerge(
        "px-2 py-1 text-black dark:text-white border border-gray-300 dark:border-neutral-600",
        rowIndex === 0 && "border-t-0"
      )}
    >
      {value ?? ""}
    </td>
  )
}

export default ExcelCell
