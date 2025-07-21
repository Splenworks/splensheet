import React, { useEffect, useRef, useState } from "react"
import { twMerge } from "tailwind-merge"
import type { CellObject } from "xlsx"
import { HyperFormula } from "hyperformula"
import { formatDate } from "./utils/date"

const FUNCTION_NAMES = HyperFormula.getRegisteredFunctionNames("enGB").sort()

interface ExcelCellProps {
  rowIndex: number
  colIndex: number
  cell: Partial<CellObject> | undefined
  onChange: (r: number, c: number, cell: Partial<CellObject>) => void
}

const ExcelCell: React.FC<ExcelCellProps> = ({
  rowIndex,
  colIndex,
  cell,
  onChange,
}) => {
  const [editing, setEditing] = useState(false)
  const [inputValue, setInputValue] = useState("")
  const [suggestion, setSuggestion] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  const getDisplayValue = (c: Partial<CellObject> | undefined) => {
    if (!c || c.v === undefined) return "\u00A0"
    if (c.t === "b") return c.v ? "TRUE" : "FALSE"
    if (c.t === "d" && c.v instanceof Date) {
      const d = new Date(c.v)
      if (!isNaN(d.getTime())) return d.toLocaleDateString()
    }
    return String(c.v)
  }

  const getEditableValue = (c: Partial<CellObject> | undefined) => {
    if (!c) return ""
    if (c.f) return `=${c.f}`
    if (c.v === undefined) return ""
    if (c.t === "b") return c.v ? "TRUE" : "FALSE"
    if (c.t === "d" && c.v instanceof Date) {
      const d = new Date(c.v)
      if (!isNaN(d.getTime())) return formatDate(c.v)
    }
    return String(c.v)
  }

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus()
    }
  }, [editing])

  const startEdit = () => {
    if (editing) return
    const value = getEditableValue(cell)
    setInputValue(value)
    updateSuggestion(value)
    setEditing(true)
  }

  const updateSuggestion = (val: string) => {
    if (val.startsWith("=")) {
      const prefix = val.slice(1).toUpperCase()
      if (prefix.length === 0) {
        setSuggestion("")
        return
      }
      const match = FUNCTION_NAMES.find((n) => n.startsWith(prefix))
      setSuggestion(match ? match.slice(prefix.length) : "")
    } else {
      setSuggestion("")
    }
  }

  const handleInputChange = (val: string) => {
    setInputValue(val)
    updateSuggestion(val)
  }

  const stopEdit = () => {
    setEditing(false)
    setInputValue("")
    setSuggestion("")
  }

  const commit = () => {
    const val = inputValue
    if (val.startsWith("=")) {
      const formula = val.slice(1)
      onChange(rowIndex, colIndex, { f: formula })
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
    const originalValue = getEditableValue(cell)
    if (inputValue !== originalValue) {
      commit()
    }
    stopEdit()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      commit()
      stopEdit()
    } else if (e.key === "Escape") {
      e.stopPropagation()
      stopEdit()
    } else if (e.key === "Tab") {
      e.preventDefault()
      if (suggestion) {
        handleInputChange(inputValue + suggestion)
        setTimeout(() => {
          if (inputRef.current) {
            inputRef.current.setSelectionRange(inputValue.length + suggestion.length, inputValue.length + suggestion.length)
            inputRef.current.scrollLeft = inputRef.current.scrollWidth || 0
          }
        }, 0)
      } else {
        commit()
        stopEdit()
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
  }

  return (
    <td
      className={twMerge(
        "min-w-12 px-2 py-1 text-black dark:text-white border border-gray-300 dark:border-neutral-600 relative",
        rowIndex === 0 && "border-t-0",
        cell?.t === "n" && !editing && "text-right"
      )}
      onClick={startEdit}
    >
      {editing && (
        <div className="absolute left-0 top-0 right-0 bottom-0 box-border">
          <input
            ref={inputRef}
            className="w-full h-full px-2 py-1 box-border border-none bg-white dark:bg-neutral-900 focus:outline-pink-900 focus:outline-2 focus:[outline-offset:-2px] dark:focus:outline-pink-700"
            value={inputValue}
            onChange={(e) => handleInputChange(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            spellCheck="false"
          />
          {suggestion && (
            <div className="pointer-events-none absolute left-0 top-0 bottom-0 right-0 px-2 py-1 flex items-center text-gray-400 whitespace-pre">
              <span className="invisible">{inputValue}</span>
              <span>{suggestion}</span>
            </div>
          )}
        </div>
      )}
      {getDisplayValue(cell)}
    </td>
  )
}

export default React.memo(
  ExcelCell,
  (prev, next) => prev.cell === next.cell,
)
