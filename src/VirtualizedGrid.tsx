import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import ExcelCell from "./ExcelCell"
import type { CellObject } from "xlsx"

interface VirtualizedGridProps {
  data: Array<Array<Partial<CellObject>>>
  onCellChange: (r: number, c: number, cell: Partial<CellObject>) => void
  className?: string
}

const CELL_WIDTH = 120
const CELL_HEIGHT = 32
const ROW_HEADER_WIDTH = 60
const COLUMN_HEADER_HEIGHT = 32
const MAX_ROWS = 1048576 // Excel limit
const MAX_COLS = 16384 // Excel limit (XFD column)
const BUFFER_SIZE = 10 // Extra rows/cols to render outside viewport

const VirtualizedGrid: React.FC<VirtualizedGridProps> = ({
  data,
  onCellChange,
  className = "",
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scrollLeft, setScrollLeft] = useState(0)
  const [scrollTop, setScrollTop] = useState(0)
  const [containerWidth, setContainerWidth] = useState(0)
  const [containerHeight, setContainerHeight] = useState(0)

  // Calculate visible range with better performance
  const visibleRange = useMemo(() => {
    const visibleRowsCount = Math.ceil(containerHeight / CELL_HEIGHT)
    const visibleColsCount = Math.ceil(containerWidth / CELL_WIDTH)

    const startRow = Math.max(0, Math.floor(scrollTop / CELL_HEIGHT) - BUFFER_SIZE)
    const endRow = Math.min(MAX_ROWS, startRow + visibleRowsCount + BUFFER_SIZE * 2)

    const startCol = Math.max(0, Math.floor(scrollLeft / CELL_WIDTH) - BUFFER_SIZE)
    const endCol = Math.min(MAX_COLS, startCol + visibleColsCount + BUFFER_SIZE * 2)

    return { startRow, endRow, startCol, endCol }
  }, [scrollTop, scrollLeft, containerHeight, containerWidth])

  // Get column letter (A, B, C, ..., AA, AB, etc.)
  const getColumnLetter = useCallback((colIndex: number): string => {
    let result = ""
    let num = colIndex
    while (num >= 0) {
      result = String.fromCharCode(65 + (num % 26)) + result
      num = Math.floor(num / 26) - 1
      if (num < 0) break
    }
    return result
  }, [])

  // Handle resize observer
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width)
        setContainerHeight(entry.contentRect.height)
      }
    })

    resizeObserver.observe(container)
    return () => resizeObserver.disconnect()
  }, [])

  // Handle scroll with throttling
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement
    setScrollLeft(target.scrollLeft)
    setScrollTop(target.scrollTop)
  }, [])

  // Get cell data with bounds checking and lazy expansion
  const getCellData = useCallback((rowIndex: number, colIndex: number): Partial<CellObject> | undefined => {
    if (rowIndex < 0 || colIndex < 0) return undefined
    const row = data[rowIndex]
    if (!row) return undefined
    return row[colIndex]
  }, [data])

  // Optimized cell change handler that expands data array as needed
  const handleCellChange = useCallback((rowIndex: number, colIndex: number, cell: Partial<CellObject>) => {
    onCellChange(rowIndex, colIndex, cell)
  }, [onCellChange])

  // Render visible rows
  const renderRows = useMemo(() => {
    const rows = []

    for (let rowIndex = visibleRange.startRow; rowIndex < visibleRange.endRow; rowIndex++) {
      const cells = []

      // Row header
      cells.push(
        <div
          key={`row-header-${rowIndex}`}
          className="sticky left-0 z-10 flex items-center justify-center bg-gray-100 dark:bg-neutral-800 border-r border-b border-gray-300 dark:border-neutral-600 text-xs font-medium text-gray-600 dark:text-gray-300"
          style={{
            width: ROW_HEADER_WIDTH,
            height: CELL_HEIGHT,
            minWidth: ROW_HEADER_WIDTH,
          }}
        >
          {rowIndex + 1}
        </div>
      )

      // Data cells - wrapped in a table structure for ExcelCell compatibility
      for (let colIndex = visibleRange.startCol; colIndex < visibleRange.endCol; colIndex++) {
        const cellData = getCellData(rowIndex, colIndex)
        cells.push(
          <table
            key={`cell-${rowIndex}-${colIndex}`}
            className="border-collapse"
            style={{
              width: CELL_WIDTH,
              height: CELL_HEIGHT,
              minWidth: CELL_WIDTH,
            }}
          >
            <tbody>
              <tr>
                <ExcelCell
                  rowIndex={rowIndex}
                  colIndex={colIndex}
                  cell={cellData}
                  onChange={handleCellChange}
                />
              </tr>
            </tbody>
          </table>
        )
      }

      rows.push(
        <div
          key={`row-${rowIndex}`}
          className="flex"
          style={{
            position: "absolute",
            top: rowIndex * CELL_HEIGHT + COLUMN_HEADER_HEIGHT,
            left: 0,
            height: CELL_HEIGHT,
          }}
        >
          {cells}
        </div>
      )
    }

    return rows
  }, [visibleRange, getCellData, handleCellChange])

  // Render column headers
  const renderColumnHeaders = useMemo(() => {
    const headers = []

    // Empty corner cell
    headers.push(
      <div
        key="corner"
        className="sticky left-0 z-20 bg-gray-100 dark:bg-neutral-800 border-r border-b border-gray-300 dark:border-neutral-600"
        style={{
          width: ROW_HEADER_WIDTH,
          height: COLUMN_HEADER_HEIGHT,
          minWidth: ROW_HEADER_WIDTH,
        }}
      />
    )

    // Column headers
    for (let colIndex = visibleRange.startCol; colIndex < visibleRange.endCol; colIndex++) {
      headers.push(
        <div
          key={`col-header-${colIndex}`}
          className="flex items-center justify-center bg-gray-100 dark:bg-neutral-800 border-r border-b border-gray-300 dark:border-neutral-600 text-xs font-medium text-gray-600 dark:text-gray-300"
          style={{
            width: CELL_WIDTH,
            height: COLUMN_HEADER_HEIGHT,
            minWidth: CELL_WIDTH,
          }}
        >
          {getColumnLetter(colIndex)}
        </div>
      )
    }

    return (
      <div
        className="sticky top-0 z-10 flex"
        style={{ height: COLUMN_HEADER_HEIGHT }}
      >
        {headers}
      </div>
    )
  }, [visibleRange, getColumnLetter])

  return (
    <div className={`relative overflow-auto ${className}`} ref={containerRef} onScroll={handleScroll}>
      {/* Virtual scroll area */}
      <div
        style={{
          width: MAX_COLS * CELL_WIDTH + ROW_HEADER_WIDTH,
          height: MAX_ROWS * CELL_HEIGHT + COLUMN_HEADER_HEIGHT,
          position: "relative",
        }}
      >
        {/* Column headers */}
        {renderColumnHeaders}

        {/* Data rows */}
        {renderRows}
      </div>
    </div>
  )
}

export default VirtualizedGrid
