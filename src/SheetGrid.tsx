import React, { RefObject, useMemo } from "react"
import type { VirtualItem } from "@tanstack/react-virtual"
import ExcelCell from "./ExcelCell"
import { PartialCellObj } from "./types"
import { indexToColumnName } from "./utils/columnUtils"

interface SheetGridProps {
  data: PartialCellObj[][]
  colCount: number
  rowCount: number
  selectedCell: { row: number; col: number } | null
  selectCell: (row: number, col: number) => void
  updateCell: (row: number, col: number, cell: PartialCellObj) => void
  useVirtual: boolean
  virtualRows?: VirtualItem[]
  paddingTop: number
  paddingBottom: number
  totalHeight?: number
  parentRef: RefObject<HTMLDivElement | null>
  gridRef: RefObject<HTMLDivElement | null>
}

const SheetGrid: React.FC<SheetGridProps> = ({
  data,
  colCount,
  rowCount,
  selectedCell,
  selectCell,
  updateCell,
  useVirtual,
  virtualRows,
  paddingTop,
  paddingBottom,
  totalHeight,
  parentRef,
  gridRef,
}) => {
  const rowIndexes = useMemo(() => {
    if (useVirtual && virtualRows) {
      return virtualRows.map((v) => v.index)
    }
    return Array.from({ length: rowCount }, (_, i) => i)
  }, [rowCount, useVirtual, virtualRows])

  return (
    <div ref={parentRef} className="flex-1 overflow-x-scroll overflow-y-scroll">
      <div
        ref={gridRef}
        className="min-w-max text-sm grid"
        style={{
          gridTemplateColumns: `minmax(3rem, max-content) repeat(${colCount}, minmax(3rem, max-content))`,
          height: totalHeight,
        }}
      >
        <div
          key="corner"
          className={
            "sticky top-0 left-0 z-40 bg-gray-100 dark:bg-neutral-800 " +
            "px-2 h-8 flex items-center justify-center " +
            "border border-gray-300 dark:border-neutral-600 text-black dark:text-white"
          }
        />
        {Array.from({ length: colCount }).map((_, cIdx) => (
          <div
            key={`header-${cIdx}`}
            className={
              "sticky top-0 z-30 bg-gray-100 dark:bg-neutral-800 " +
              "px-2 h-8 flex items-center justify-center -ml-px " +
              "border border-gray-300 dark:border-neutral-600 text-black dark:text-white"
            }
          >
            {indexToColumnName(cIdx)}
          </div>
        ))}
        {useVirtual && paddingTop > 0 && (
          <div style={{ height: paddingTop, gridColumn: `1 / span ${colCount + 1}` }} />
        )}
        {rowIndexes.map((rIdx) => {
          const rowData = data[rIdx] || []
          return [
            <div
              key={`rowheader-${rIdx}`}
              className={
                "sticky left-0 z-30 bg-gray-100 dark:bg-neutral-800 " +
                "px-2 flex items-center justify-center -mt-px " +
                "border border-gray-300 dark:border-neutral-600 text-black dark:text-white"
              }
            >
              {rIdx + 1}
            </div>,
            ...Array.from({ length: colCount }).map((_, cIdx) => (
              <ExcelCell
                key={`${rIdx}-${cIdx}`}
                rowIndex={rIdx}
                colIndex={cIdx}
                cell={rowData[cIdx]}
                isSelected={selectedCell?.row === rIdx && selectedCell?.col === cIdx}
                onChange={updateCell}
                selectCell={selectCell}
              />
            )),
          ]
        })}
        {useVirtual && paddingBottom > 0 && (
          <div style={{ height: paddingBottom, gridColumn: `1 / span ${colCount + 1}` }} />
        )}
      </div>
    </div>
  )
}

export default SheetGrid
