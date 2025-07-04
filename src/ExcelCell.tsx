import React from "react"
import ExcelJS from "exceljs"
import { twMerge } from "tailwind-merge"

interface ExcelCellProps {
  cell: ExcelJS.Cell
  value: string | number | boolean | null
  rowHeight?: number
  colWidth?: number
}

const colorFrom = (color?: ExcelJS.Color): string | undefined => {
  if (!color) return undefined
  if ("argb" in color && color.argb) {
    return `#${color.argb.slice(2)}`
  }
  if ("rgb" in color && color.rgb) {
    return `#${color.rgb.slice(2)}`
  }
  return undefined
}

const ExcelCell: React.FC<ExcelCellProps> = ({
  cell,
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

  if (
    cell.fill &&
    cell.fill.type === "pattern" &&
    (cell.fill as ExcelJS.PatternFill).fgColor
  ) {
    const c = colorFrom((cell.fill as ExcelJS.PatternFill).fgColor)
    if (c) style.backgroundColor = c
  }

  if (cell.font?.color) {
    const c = colorFrom(cell.font.color)
    if (c) style.color = c
  }

  return (
    <td
      style={style}
      className={twMerge(
        "px-2 py-1 text-black dark:text-white border border-gray-300 dark:border-neutral-600",
      )}
    >
      {value ?? ""}
    </td>
  )
}

export default ExcelCell
