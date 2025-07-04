import React from "react"
import ExcelJS from "exceljs"
import { twMerge } from "tailwind-merge"

interface ExcelCellProps {
  // get the cell properties for the future feature such as background color, font color, etc.
  cell: ExcelJS.Cell
  value: string | number | boolean | null
  rowHeight?: number
  colWidth?: number
}

// const colorFrom = (argb: string): string => {
//   return `#${argb.slice(2)}`
// }

const ExcelCell: React.FC<ExcelCellProps> = ({
  cell: _cell,
  value,
  rowHeight,
  colWidth,
}) => {
  const style: React.CSSProperties = {}

  if (rowHeight) {
    style.height = `${rowHeight * 1.33}px`
  }

  if (colWidth) {
    style.width = `${colWidth * 8}px`
  }

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
      )}
    >
      {value ?? ""}
    </td>
  )
}

export default ExcelCell
