import React, { useEffect, useState } from "react"
import ExcelCell from "./ExcelCell"
import ExcelHeader from "./ExcelHeader"
import { useFullScreen } from "./hooks/useFullScreen"
import { utils, writeFile } from "xlsx"
import type { Workbook, Cell, Worksheet } from "./types"

interface ExcelEditorProps {
  workbook: Workbook
  fileName: string
  onClose: () => void
}

const ExcelEditor: React.FC<ExcelEditorProps> = ({
  workbook,
  fileName,
  onClose,
}) => {
  const { isFullScreen, toggleFullScreen } = useFullScreen()
  const [activeSheetIndex, setActiveSheetIndex] = useState(0)

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (isFullScreen) {
          toggleFullScreen()
        } else {
          onClose()
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [isFullScreen, toggleFullScreen, onClose])

  const [worksheets, setWorksheets] = useState<Worksheet[]>(workbook.worksheets)
  const [hasChanges, setHasChanges] = useState(false)
  const activeSheet = worksheets[activeSheetIndex]

  const getDisplayValue = (c: Cell | undefined): string => {
    if (!c) return ""
    if (c.v === null || c.v === undefined) return ""
    return String(c.v)
  }

  const getLastNonEmptyRow = (): number => {
    let lastRowIdx = activeSheet.data.length
    while (lastRowIdx > 0) {
      const row = activeSheet.data[lastRowIdx - 1] || []
      const hasData = row.some((c) =>
        c && (c.f || (c.v !== null && c.v !== undefined && c.v !== "")),
      )
      if (hasData) break
      lastRowIdx--
    }
    return lastRowIdx
  }

  const rowCount = getLastNonEmptyRow()

  const getLastNonEmptyCol = (): number => {
    let lastColIdx = activeSheet.data.reduce(
      (max, row) => Math.max(max, row.length),
      0,
    )
    while (lastColIdx > 0) {
      const hasData = activeSheet.data.some((row) => {
        const c = row[lastColIdx - 1]
        return c && (c.f || (c.v !== null && c.v !== undefined && c.v !== ""))
      })
      if (hasData) break
      lastColIdx--
    }
    return lastColIdx
  }

  const colCount = getLastNonEmptyCol()

  const columnWidths = Array.from({ length: colCount }).map(() => undefined)

  const updateCell = (r: number, c: number, cell: Cell) => {
    setWorksheets((prev) => {
      const copy = [...prev]
      const sheet = { ...copy[activeSheetIndex] }
      const data = sheet.data.map((row) => [...row])
      if (!data[r]) data[r] = []
      data[r][c] = cell
      sheet.data = data
      copy[activeSheetIndex] = sheet
      return copy
    })
    setHasChanges(true)
  }

  const rows = Array.from({ length: rowCount }).map((_, rIdx) => {
    const rowData = activeSheet.data[rIdx] || []
    const cells = Array.from({ length: colCount }).map((_, cIdx) => {
      return rowData[cIdx]
    })
    return { cells }
  })

  const handleDownload = () => {
    const wb = utils.book_new()
    worksheets.forEach((ws) => {
      const aoa = ws.data.map((row) => row.map((c) => c?.v ?? null))
      const sheet = utils.aoa_to_sheet(aoa)
      ws.data.forEach((row, r) => {
        row.forEach((cell, c) => {
          if (cell?.f) {
            const addr = utils.encode_cell({ r, c })
            if (sheet[addr]) sheet[addr].f = cell.f
          }
        })
      })
      utils.book_append_sheet(wb, sheet, ws.name)
    })
    writeFile(wb, fileName)
    setHasChanges(false)
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-white dark:bg-neutral-900">
      <ExcelHeader
        isFullScreen={isFullScreen}
        toggleFullScreen={toggleFullScreen}
        fileName={fileName}
        onClose={onClose}
        worksheets={worksheets.map((ws) => ({ id: ws.id, name: ws.name }))}
        activeSheetIndex={activeSheetIndex}
        setActiveSheetIndex={setActiveSheetIndex}
        hasChanges={hasChanges}
        onDownload={handleDownload}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex-1 overflow-auto">
          <table className="min-w-max border-collapse text-sm">
            <tbody>
              {rows.map((row, rIdx) => (
                <tr key={rIdx}>
                  {row.cells.map((cellData, cIdx) => (
                    <ExcelCell
                      key={cIdx}
                      rowIndex={rIdx}
                      colIndex={cIdx}
                      cell={cellData}
                      onChange={updateCell}
                    />
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default ExcelEditor
