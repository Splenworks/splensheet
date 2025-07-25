import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import ExcelCell from "./ExcelCell"
import type { CellObject } from "xlsx"

interface VirtualizedGridProps {
  data: Array<Array<Partial<CellObject>>>
  onCellChange: (r: number, c: number, cell: Partial<CellObject>) => void
  className?: string
}

const DEFAULT_CELL_WIDTH = 120
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
  const [columnWidths, setColumnWidths] = useState<Map<number, number>>(new Map())
  const measurementRef = useRef<HTMLDivElement>(null)

  // Get column width (measured or default)
  const getColumnWidth = useCallback((colIndex: number): number => {
    return columnWidths.get(colIndex) || DEFAULT_CELL_WIDTH
  }, [columnWidths])

  // Get cumulative width up to a column
  const getCumulativeWidth = useCallback((colIndex: number): number => {
    let width = ROW_HEADER_WIDTH
    for (let i = 0; i < colIndex; i++) {
      width += getColumnWidth(i)
    }
    return width
  }, [getColumnWidth])

  // Measure a cell's natural width
  const measureCellWidth = useCallback((rowIndex: number, colIndex: number, cellData: Partial<CellObject> | undefined): number => {
    if (!measurementRef.current) return DEFAULT_CELL_WIDTH

    // Create a temporary cell to measure
    const tempTable = document.createElement('table')
    tempTable.className = 'border-collapse'
    tempTable.style.position = 'absolute'
    tempTable.style.visibility = 'hidden'
    tempTable.style.whiteSpace = 'nowrap'

    const tempTbody = document.createElement('tbody')
    const tempTr = document.createElement('tr')
    const tempTd = document.createElement('td')

    // Copy the cell styling from ExcelCell
    tempTd.className = 'px-2 py-1 text-black border border-gray-300 relative cursor-default'

    // Set the content
    if (cellData?.v !== undefined) {
      if (cellData.t === "b") {
        tempTd.textContent = cellData.v ? "TRUE" : "FALSE"
      } else if (cellData.t === "d" && cellData.v instanceof Date) {
        tempTd.textContent = cellData.v.toLocaleDateString()
      } else {
        tempTd.textContent = String(cellData.v)
      }
    } else {
      tempTd.innerHTML = "&nbsp;"
    }

    tempTr.appendChild(tempTd)
    tempTbody.appendChild(tempTr)
    tempTable.appendChild(tempTbody)
    measurementRef.current.appendChild(tempTable)

    const width = Math.max(tempTd.offsetWidth, 60) // Minimum width
    measurementRef.current.removeChild(tempTable)

    return width
  }, [])

  // Update column width when cell content changes
  const updateColumnWidth = useCallback((colIndex: number, width: number) => {
    setColumnWidths(prev => {
      const current = prev.get(colIndex) || DEFAULT_CELL_WIDTH
      if (width > current) {
        const newMap = new Map(prev)
        newMap.set(colIndex, width)
        return newMap
      }
      return prev
    })
  }, [])

  // Calculate visible range with dynamic widths
  const visibleRange = useMemo(() => {
    const visibleRowsCount = Math.ceil(containerHeight / CELL_HEIGHT)

    const startRow = Math.max(0, Math.floor(scrollTop / CELL_HEIGHT) - BUFFER_SIZE)
    const endRow = Math.min(MAX_ROWS, startRow + visibleRowsCount + BUFFER_SIZE * 2)

    // Calculate visible columns based on dynamic widths
    let startCol = 0
    let endCol = 0
    let currentWidth = ROW_HEADER_WIDTH

    // Find start column
    while (currentWidth < scrollLeft && startCol < MAX_COLS) {
      currentWidth += getColumnWidth(startCol)
      startCol++
    }
    startCol = Math.max(0, startCol - BUFFER_SIZE)

    // Find end column
    currentWidth = getCumulativeWidth(startCol)
    endCol = startCol
    while (currentWidth < scrollLeft + containerWidth + BUFFER_SIZE * DEFAULT_CELL_WIDTH && endCol < MAX_COLS) {
      currentWidth += getColumnWidth(endCol)
      endCol++
    }
    endCol = Math.min(MAX_COLS, endCol + BUFFER_SIZE)

    return { startRow, endRow, startCol, endCol }
  }, [scrollTop, scrollLeft, containerHeight, containerWidth, getColumnWidth, getCumulativeWidth])

  // Get column letter (A, B, C, ..., AA, AB, etc.)
  const getColumnLetter = useCallback((colIndex: number): string => {
    let result = ""
    let num = colIndex + 1 // Convert to 1-based indexing
    while (num > 0) {
      num-- // Adjust for 0-based alphabet
      result = String.fromCharCode(65 + (num % 26)) + result
      num = Math.floor(num / 26)
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
          className="absolute left-0 z-10 flex items-center justify-center bg-gray-100 dark:bg-neutral-800 border-r border-b border-gray-300 dark:border-neutral-600 text-xs font-medium text-gray-600 dark:text-gray-300"
          style={{
            top: rowIndex * CELL_HEIGHT + COLUMN_HEADER_HEIGHT,
            width: ROW_HEADER_WIDTH,
            height: CELL_HEIGHT,
            minWidth: ROW_HEADER_WIDTH,
          }}
        >
          {rowIndex + 1}
        </div>
      )

      // Data cells - positioned absolutely with dynamic widths
      for (let colIndex = visibleRange.startCol; colIndex < visibleRange.endCol; colIndex++) {
        const cellData = getCellData(rowIndex, colIndex)
        const colWidth = getColumnWidth(colIndex)
        const leftPosition = getCumulativeWidth(colIndex)

        // Measure and update column width if needed
        const measuredWidth = measureCellWidth(rowIndex, colIndex, cellData)
        if (measuredWidth > colWidth) {
          updateColumnWidth(colIndex, measuredWidth)
        }

        cells.push(
          <div
            key={`cell-${rowIndex}-${colIndex}`}
            className="virtual-cell-wrapper absolute"
            style={{
              left: leftPosition,
              top: rowIndex * CELL_HEIGHT + COLUMN_HEADER_HEIGHT,
              width: colWidth,
              height: CELL_HEIGHT,
              minWidth: colWidth,
              maxWidth: colWidth,
              overflow: "hidden",
            }}
          >
            <table className="border-collapse w-full h-full">
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
          </div>
        )
      }

      rows.push(...cells)
    }

    return rows
  }, [visibleRange, getCellData, handleCellChange, getColumnWidth, getCumulativeWidth, measureCellWidth, updateColumnWidth])

  // Render column headers
  const renderColumnHeaders = useMemo(() => {
    const headers = []

    // Empty corner cell
    headers.push(
      <div
        key="corner"
        className="absolute top-0 left-0 z-20 bg-gray-100 dark:bg-neutral-800 border-r border-b border-gray-300 dark:border-neutral-600"
        style={{
          width: ROW_HEADER_WIDTH,
          height: COLUMN_HEADER_HEIGHT,
          minWidth: ROW_HEADER_WIDTH,
        }}
      />
    )

    // Column headers
    for (let colIndex = visibleRange.startCol; colIndex < visibleRange.endCol; colIndex++) {
      const colWidth = getColumnWidth(colIndex)
      const leftPosition = getCumulativeWidth(colIndex)

      headers.push(
        <div
          key={`col-header-${colIndex}`}
          className="absolute top-0 flex items-center justify-center bg-gray-100 dark:bg-neutral-800 border-r border-b border-gray-300 dark:border-neutral-600 text-xs font-medium text-gray-600 dark:text-gray-300"
          style={{
            left: leftPosition,
            width: colWidth,
            height: COLUMN_HEADER_HEIGHT,
            minWidth: colWidth,
            maxWidth: colWidth,
          }}
        >
          {getColumnLetter(colIndex)}
        </div>
      )
    }

    return headers
  }, [visibleRange, getColumnLetter, getColumnWidth, getCumulativeWidth])

  // Calculate total width for scroll area
  const totalWidth = useMemo(() => {
    let width = ROW_HEADER_WIDTH
    for (let i = 0; i < MAX_COLS; i++) {
      width += getColumnWidth(i)
    }
    return Math.min(width, ROW_HEADER_WIDTH + MAX_COLS * DEFAULT_CELL_WIDTH * 2) // Cap to prevent excessive memory usage
  }, [getColumnWidth])

  return (
    <>
      <style>
        {`
          .virtual-cell-wrapper td {
            min-width: unset !important;
            width: 100% !important;
            max-width: 100% !important;
          }
        `}
      </style>
      {/* Hidden measurement container */}
      <div ref={measurementRef} style={{ position: 'absolute', top: -9999, left: -9999 }} />
      <div className={`relative overflow-auto ${className}`} ref={containerRef} onScroll={handleScroll}>
        {/* Virtual scroll area */}
        <div
          style={{
            width: totalWidth,
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
    </>
  )
}

export default VirtualizedGrid
