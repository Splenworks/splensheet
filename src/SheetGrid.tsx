import React, { RefObject, useLayoutEffect, useMemo, useState } from "react"
import SheetCell from "./SheetCell"
import { PartialCellObj } from "./types"
import { indexToColumnName } from "./utils/columnUtils"
import {
  COL_W,
  HEADER_H,
  HEADER_W,
  OVERSCAN,
  ROW_H,
} from "./utils/gridDimensions"

interface SheetGridProps {
  data: PartialCellObj[][]
  colCount: number
  rowCount: number
  selectedCell: { row: number; col: number } | null
  selectCell: (row: number, col: number) => void
  updateCell: (row: number, col: number, cell: PartialCellObj) => void
  parentRef: RefObject<HTMLDivElement | null>
  gridRef: RefObject<HTMLDivElement | null>
}

const HEADER_CELL_CLASS =
  "bg-gray-100 dark:bg-neutral-800 px-2 flex items-center justify-center " +
  "border border-gray-300 dark:border-neutral-600 text-black dark:text-white"

const SheetGrid: React.FC<SheetGridProps> = ({
  data,
  colCount,
  rowCount,
  selectedCell,
  selectCell,
  updateCell,
  parentRef,
  gridRef,
}) => {
  const [scroll, setScroll] = useState({ top: 0, left: 0 })
  const [size, setSize] = useState({ width: 0, height: 0 })

  useLayoutEffect(() => {
    const parent = parentRef.current
    if (!parent) return

    setSize({ width: parent.clientWidth, height: parent.clientHeight })
    setScroll({ top: parent.scrollTop, left: parent.scrollLeft })

    let raf = 0
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        setScroll({ top: parent.scrollTop, left: parent.scrollLeft })
      })
    }
    parent.addEventListener("scroll", onScroll, { passive: true })

    const ro = new ResizeObserver(() => {
      setSize({ width: parent.clientWidth, height: parent.clientHeight })
    })
    ro.observe(parent)

    return () => {
      parent.removeEventListener("scroll", onScroll)
      ro.disconnect()
      cancelAnimationFrame(raf)
    }
  }, [parentRef])

  const totalWidth = HEADER_W + colCount * COL_W
  const totalHeight = HEADER_H + rowCount * ROW_H
  const viewWidth = size.width || 1
  const viewHeight = size.height || 1

  const startCol = Math.max(0, Math.floor(scroll.left / COL_W) - OVERSCAN)
  const endCol = Math.min(
    colCount,
    Math.ceil((scroll.left + viewWidth) / COL_W) + OVERSCAN,
  )
  const startRow = Math.max(0, Math.floor(scroll.top / ROW_H) - OVERSCAN)
  const endRow = Math.min(
    rowCount,
    Math.ceil((scroll.top + viewHeight) / ROW_H) + OVERSCAN,
  )

  const visibleCols = useMemo(() => {
    const cols: number[] = []
    for (let c = startCol; c < endCol; c++) cols.push(c)
    return cols
  }, [startCol, endCol])

  const visibleRows = useMemo(() => {
    const rows: number[] = []
    for (let r = startRow; r < endRow; r++) rows.push(r)
    return rows
  }, [startRow, endRow])

  const selectedInRange =
    selectedCell !== null &&
    selectedCell.row >= startRow &&
    selectedCell.row < endRow &&
    selectedCell.col >= startCol &&
    selectedCell.col < endCol

  return (
    <div
      ref={parentRef}
      className="flex-1 overflow-auto bg-white dark:bg-neutral-900"
    >
      <div
        ref={gridRef}
        className="text-sm"
        style={{
          width: totalWidth,
          height: totalHeight,
          position: "relative",
        }}
      >
        {visibleRows.map((r) =>
          visibleCols.map((c) => (
            <SheetCell
              key={`${r}-${c}`}
              rowIndex={r}
              colIndex={c}
              cell={data[r]?.[c]}
              isSelected={
                selectedCell?.row === r && selectedCell?.col === c
              }
              onChange={updateCell}
              selectCell={selectCell}
            />
          )),
        )}

        {selectedCell && !selectedInRange && (
          <SheetCell
            key={`sel-${selectedCell.row}-${selectedCell.col}`}
            rowIndex={selectedCell.row}
            colIndex={selectedCell.col}
            cell={data[selectedCell.row]?.[selectedCell.col]}
            isSelected={true}
            onChange={updateCell}
            selectCell={selectCell}
          />
        )}

        <div
          style={{
            position: "sticky",
            top: 0,
            height: HEADER_H,
            width: totalWidth,
            zIndex: 30,
          }}
        >
          {visibleCols.map((c) => (
            <div
              key={`colhead-${c}`}
              className={HEADER_CELL_CLASS}
              style={{
                position: "absolute",
                left: HEADER_W + c * COL_W,
                top: 0,
                width: COL_W + 1,
                height: HEADER_H + 1,
              }}
            >
              {indexToColumnName(c)}
            </div>
          ))}
          <div
            className={HEADER_CELL_CLASS}
            style={{
              position: "sticky",
              left: 0,
              top: 0,
              width: HEADER_W + 1,
              height: HEADER_H + 1,
              zIndex: 40,
            }}
          />
        </div>

        <div
          style={{
            position: "sticky",
            left: 0,
            width: HEADER_W,
            height: rowCount * ROW_H,
            zIndex: 29,
          }}
        >
          {visibleRows.map((r) => (
            <div
              key={`rowhead-${r}`}
              className={HEADER_CELL_CLASS}
              style={{
                position: "absolute",
                top: r * ROW_H,
                left: 0,
                width: HEADER_W + 1,
                height: ROW_H + 1,
              }}
            >
              {r + 1}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default SheetGrid
