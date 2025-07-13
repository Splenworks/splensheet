import React, { useEffect, useRef, useState } from "react"
import { twMerge } from "tailwind-merge"
import type { CellObject } from "xlsx"
import { getCellType } from "./utils/xlsx"
import { formatDate } from "./utils/date"

interface ExcelCellProps {
  rowIndex: number
  colIndex: number
  cell: Partial<CellObject> | undefined
  evaluate: (
    r: number,
    c: number,
    formula: string,
  ) => string | number | boolean | undefined
  onChange: (r: number, c: number, cell: Partial<CellObject>) => void
}

const ExcelCell: React.FC<ExcelCellProps> = ({
  rowIndex,
  colIndex,
  cell,
  evaluate,
  onChange,
}) => {
  const [editing, setEditing] = useState(false)
  const [inputValue, setInputValue] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  const getDisplayValue = (c: Partial<CellObject> | undefined) => {
    if (!c || c.v === undefined) return ""
    if (c.t === "b" || typeof c.v === "boolean") return c.v ? "TRUE" : "FALSE"
    if (c.t === "d" || c.v instanceof Date) {
      const d = new Date(c.v as string | number | Date)
      if (!isNaN(d.getTime())) return d.toLocaleDateString()
    }
    return String(c.v)
  }

  useEffect(() => {
    if (editing) {
      if (cell?.f) setInputValue("=" + cell.f)
      else if (cell?.t === "b") setInputValue(cell.v ? "TRUE" : "FALSE")
      else if (cell?.t === "d" && cell.v instanceof Date) {
        console.log("Date cell value:", cell.v)
        setInputValue(formatDate(cell.v))
      }
      else setInputValue(cell?.v != undefined ? String(cell.v) : "")
      inputRef.current?.focus()
    }
  }, [editing, cell])

  const commit = () => {
    const val = inputValue
    if (val.startsWith("=")) {
      const formula = val.slice(1)
      const result = evaluate(rowIndex, colIndex, formula)
      const type = getCellType(result)
      onChange(rowIndex, colIndex, { v: result, f: formula, t: type })
    } else {
      if (cell?.t === "n") {
        const num = Number(val)
        if (!Number.isNaN(num)) {
          onChange(rowIndex, colIndex, { v: num, t: "n" })
          return
        }
      }
      if (cell?.t === "d") {
        const d = new Date(val)
        if (!isNaN(d.getTime())) {
          onChange(rowIndex, colIndex, { v: d, t: "d" })
          return
        }
      }
      if (cell?.t === "b") {
        const isTrue = val === "TRUE"
        const isFalse = val === "FALSE"
        if (isTrue || isFalse) {
          onChange(rowIndex, colIndex, { v: isTrue, t: "b" })
          return
        }
      }
      onChange(rowIndex, colIndex, { v: String(val), t: "s" })
    }
  }

  const handleBlur = () => {
    if (inputValue !== (cell?.f ? `=${cell.f}` : cell?.v ?? "")) {
      commit()
    }
    setEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      commit()
      setEditing(false)
    } else if (e.key === "Escape") {
      e.stopPropagation()
      setEditing(false)
      setInputValue("")
    } else if (e.key === "Tab") {
      e.preventDefault()
      commit()
      setEditing(false)
      const td = inputRef.current?.closest("td") as HTMLTableCellElement | null
      if (!td) return
      let next: HTMLTableCellElement | null = td.nextElementSibling as
        | HTMLTableCellElement
        | null
      if (!next) {
        const nextRow = td.parentElement?.nextElementSibling as HTMLTableRowElement | null
        next = nextRow?.querySelector("td") || null
      }
      next?.dispatchEvent(new MouseEvent("click", { bubbles: true }))
    }
  }

  return (
    <td
      className={twMerge(
        "min-w-12 px-2 py-1 text-black dark:text-white border border-gray-300 dark:border-neutral-600 relative",
        rowIndex === 0 && "border-t-0",
        cell?.t === "n" && !editing && "text-right"
      )}
      onClick={() => setEditing(true)}
    >
      {editing && (
        <input
          ref={inputRef}
          className="absolute left-0 top-0 right-0 bottom-0 px-2 py-1 box-border border-none bg-white dark:bg-neutral-900 focus:outline-pink-900 focus:outline-2 focus:[outline-offset:-2px] dark:focus:outline-pink-700"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          spellCheck="false"
        />
      )}
      {getDisplayValue(cell) || "\u00A0"}
    </td>
  )
}

export default React.memo(
  ExcelCell,
  (prev, next) => prev.cell === next.cell,
)
