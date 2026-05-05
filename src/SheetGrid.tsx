import React, {
  RefObject,
  useLayoutEffect,
  useMemo,
  useState,
} from "react"
import SheetCell from "./SheetCell"
import { PartialCellObj } from "./types"
import { indexToColumnName } from "./utils/columnUtils"
import {
  COL_W,
  HEADER_H,
  HEADER_W,
  MIN_COL_W,
  MIN_ROW_H,
  OVERSCAN,
  ROW_H,
} from "./utils/gridDimensions"
import {
  indexAtOffset,
  offsetAt,
  sizeAt,
  totalSize,
  type SizeOverrides,
} from "./utils/gridSizing"

interface SheetGridProps {
  data: PartialCellObj[][]
  colCount: number
  rowCount: number
  colWidths: SizeOverrides
  rowHeights: SizeOverrides
  selectedCell: { row: number; col: number } | null
  selectCell: (row: number, col: number) => void
  updateCell: (row: number, col: number, cell: PartialCellObj) => void
  setColWidth: (col: number, width: number) => void
  setRowHeight: (row: number, height: number) => void
  parentRef: RefObject<HTMLDivElement | null>
  gridRef: RefObject<HTMLDivElement | null>
}

const HEADER_CELL_CLASS =
  "bg-gray-100 dark:bg-neutral-800 px-2 flex items-center justify-center " +
  "border border-gray-300 dark:border-neutral-600 text-black dark:text-white"

const RESIZE_HANDLE_PX = 6

type DragState =
  | { kind: "col"; idx: number; startPos: number; startSize: number; size: number }
  | { kind: "row"; idx: number; startPos: number; startSize: number; size: number }

const SheetGrid: React.FC<SheetGridProps> = ({
  data,
  colCount,
  rowCount,
  colWidths,
  rowHeights,
  selectedCell,
  selectCell,
  updateCell,
  setColWidth,
  setRowHeight,
  parentRef,
  gridRef,
}) => {
  const [scroll, setScroll] = useState({ top: 0, left: 0 })
  const [size, setSize] = useState({ width: 0, height: 0 })
  const [drag, setDrag] = useState<DragState | null>(null)

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

  const effectiveColWidths = useMemo(() => {
    if (drag?.kind === "col") return { ...colWidths, [drag.idx]: drag.size }
    return colWidths
  }, [colWidths, drag])

  const effectiveRowHeights = useMemo(() => {
    if (drag?.kind === "row") return { ...rowHeights, [drag.idx]: drag.size }
    return rowHeights
  }, [rowHeights, drag])

  const beginDrag = (
    kind: "col" | "row",
    idx: number,
    startPos: number,
    startSize: number,
  ) => {
    let current: DragState = { kind, idx, startPos, startSize, size: startSize }
    setDrag(current)

    let raf = 0
    let pendingPos = startPos

    const apply = () => {
      raf = 0
      const min = kind === "col" ? MIN_COL_W : MIN_ROW_H
      const next = Math.max(min, startSize + (pendingPos - startPos))
      if (next === current.size) return
      current = { ...current, size: next }
      setDrag(current)
    }

    const onMove = (e: MouseEvent) => {
      pendingPos = kind === "col" ? e.clientX : e.clientY
      if (raf === 0) raf = requestAnimationFrame(apply)
    }

    const onUp = () => {
      if (raf !== 0) cancelAnimationFrame(raf)
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("mouseup", onUp)
      if (kind === "col") setColWidth(idx, current.size)
      else setRowHeight(idx, current.size)
      setDrag(null)
    }

    window.addEventListener("mousemove", onMove)
    window.addEventListener("mouseup", onUp)
  }

  const totalContentWidth = totalSize(colCount, COL_W, effectiveColWidths)
  const totalContentHeight = totalSize(rowCount, ROW_H, effectiveRowHeights)
  const totalWidth = HEADER_W + totalContentWidth
  const totalHeight = HEADER_H + totalContentHeight
  const viewWidth = size.width || 1
  const viewHeight = size.height || 1

  const rawStartCol = indexAtOffset(colCount, COL_W, effectiveColWidths, scroll.left)
  const rawEndCol = indexAtOffset(colCount, COL_W, effectiveColWidths, scroll.left + viewWidth)
  const startCol = Math.max(0, rawStartCol - OVERSCAN)
  const endCol = Math.min(colCount, rawEndCol + 1 + OVERSCAN)

  const rawStartRow = indexAtOffset(rowCount, ROW_H, effectiveRowHeights, scroll.top)
  const rawEndRow = indexAtOffset(rowCount, ROW_H, effectiveRowHeights, scroll.top + viewHeight)
  const startRow = Math.max(0, rawStartRow - OVERSCAN)
  const endRow = Math.min(rowCount, rawEndRow + 1 + OVERSCAN)

  type Layout = { idx: number; pos: number; size: number }

  const colLayout = useMemo<Layout[]>(() => {
    const out: Layout[] = []
    let pos = offsetAt(COL_W, effectiveColWidths, startCol)
    for (let c = startCol; c < endCol; c++) {
      const w = sizeAt(effectiveColWidths, COL_W, c)
      out.push({ idx: c, pos, size: w })
      pos += w
    }
    return out
  }, [startCol, endCol, effectiveColWidths])

  const rowLayout = useMemo<Layout[]>(() => {
    const out: Layout[] = []
    let pos = offsetAt(ROW_H, effectiveRowHeights, startRow)
    for (let r = startRow; r < endRow; r++) {
      const h = sizeAt(effectiveRowHeights, ROW_H, r)
      out.push({ idx: r, pos, size: h })
      pos += h
    }
    return out
  }, [startRow, endRow, effectiveRowHeights])

  const selectedInRange =
    selectedCell !== null &&
    selectedCell.row >= startRow &&
    selectedCell.row < endRow &&
    selectedCell.col >= startCol &&
    selectedCell.col < endCol

  const selectedLayout = useMemo(() => {
    if (!selectedCell || selectedInRange) return null
    return {
      top: HEADER_H + offsetAt(ROW_H, effectiveRowHeights, selectedCell.row),
      left: HEADER_W + offsetAt(COL_W, effectiveColWidths, selectedCell.col),
      width: sizeAt(effectiveColWidths, COL_W, selectedCell.col),
      height: sizeAt(effectiveRowHeights, ROW_H, selectedCell.row),
    }
  }, [selectedCell, selectedInRange, effectiveColWidths, effectiveRowHeights])

  const startColResize = (e: React.MouseEvent, idx: number) => {
    e.preventDefault()
    e.stopPropagation()
    beginDrag("col", idx, e.clientX, sizeAt(effectiveColWidths, COL_W, idx))
  }

  const startRowResize = (e: React.MouseEvent, idx: number) => {
    e.preventDefault()
    e.stopPropagation()
    beginDrag("row", idx, e.clientY, sizeAt(effectiveRowHeights, ROW_H, idx))
  }

  return (
    <div
      ref={parentRef}
      className="flex-1 overflow-auto bg-white dark:bg-neutral-900"
      style={{ cursor: drag?.kind === "col" ? "col-resize" : drag?.kind === "row" ? "row-resize" : undefined }}
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
        {rowLayout.map(({ idx: r, pos: rTop, size: rH }) =>
          colLayout.map(({ idx: c, pos: cLeft, size: cW }) => (
            <SheetCell
              key={`${r}-${c}`}
              rowIndex={r}
              colIndex={c}
              top={HEADER_H + rTop}
              left={HEADER_W + cLeft}
              width={cW}
              height={rH}
              cell={data[r]?.[c]}
              isSelected={
                selectedCell?.row === r && selectedCell?.col === c
              }
              onChange={updateCell}
              selectCell={selectCell}
            />
          )),
        )}

        {selectedCell && selectedLayout && (
          <SheetCell
            key={`sel-${selectedCell.row}-${selectedCell.col}`}
            rowIndex={selectedCell.row}
            colIndex={selectedCell.col}
            top={selectedLayout.top}
            left={selectedLayout.left}
            width={selectedLayout.width}
            height={selectedLayout.height}
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
          {colLayout.map(({ idx: c, pos: cLeft, size: cW }) => (
            <div
              key={`colhead-${c}`}
              className={HEADER_CELL_CLASS}
              style={{
                position: "absolute",
                left: HEADER_W + cLeft,
                top: 0,
                width: cW + 1,
                height: HEADER_H + 1,
              }}
            >
              {indexToColumnName(c)}
            </div>
          ))}
          {colLayout.map(({ idx: c, pos: cLeft, size: cW }) => (
            <div
              key={`colresize-${c}`}
              onMouseDown={(e) => startColResize(e, c)}
              style={{
                position: "absolute",
                left: HEADER_W + cLeft + cW - RESIZE_HANDLE_PX / 2,
                top: 0,
                width: RESIZE_HANDLE_PX,
                height: HEADER_H,
                cursor: "col-resize",
                zIndex: 41,
              }}
            />
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
            height: totalContentHeight,
            zIndex: 29,
          }}
        >
          {rowLayout.map(({ idx: r, pos: rTop, size: rH }) => (
            <div
              key={`rowhead-${r}`}
              className={HEADER_CELL_CLASS}
              style={{
                position: "absolute",
                top: rTop,
                left: 0,
                width: HEADER_W + 1,
                height: rH + 1,
              }}
            >
              {r + 1}
            </div>
          ))}
          {rowLayout.map(({ idx: r, pos: rTop, size: rH }) => (
            <div
              key={`rowresize-${r}`}
              onMouseDown={(e) => startRowResize(e, r)}
              style={{
                position: "absolute",
                top: rTop + rH - RESIZE_HANDLE_PX / 2,
                left: 0,
                width: HEADER_W,
                height: RESIZE_HANDLE_PX,
                cursor: "row-resize",
                zIndex: 41,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default SheetGrid
