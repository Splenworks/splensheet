import React from "react"
import { twMerge } from "tailwind-merge"

interface ExcelCellProps {
  rowIndex: number
  value: string | number | boolean | null
}

// const colorFrom = (argb: string): string => {
//   return `#${argb.slice(2)}`
// }

const ExcelCell: React.FC<ExcelCellProps> = ({ rowIndex, value }) => {
  const style: React.CSSProperties = {}

  // if (
  //   cell.fill &&
  //   cell.fill.type === "pattern" &&
  //   cell.fill?.fgColor
  // ) {
  //   const argb = cell.fill.fgColor?.argb
  //   if (argb) {
  //     style.backgroundColor = colorFrom(argb) || style.backgroundColor
  //   }
  // }

  // if (cell.font?.color) {
  //   const argb = cell.font.color.argb
  //   if (argb) {
  //     style.color = colorFrom(argb) || style.color
  //   }
  // }

  return (
    <td
      // style={style}
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
