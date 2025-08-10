import React, { useEffect, useRef, useState } from "react"
import { twMerge } from "tailwind-merge"
import ImagePreview from "./ImagePreview"
import LinkPreview from "./LinkPreview"
import { HyperFormula } from "hyperformula"
import { formatDate } from "./utils/date"
import { PartialCellObj } from "./types"
import { isHttpUrl, isImageUrl } from "./utils/url"

const FUNCTION_NAMES = HyperFormula.getRegisteredFunctionNames("enGB").sort()

interface ExcelCellProps {
  rowIndex: number
  colIndex: number
  cell: PartialCellObj | undefined
  isFocused: boolean
  onChange: (r: number, c: number, cell: PartialCellObj) => void
  focusCell: (r: number, c: number) => void
}

const ExcelCell: React.FC<ExcelCellProps> = ({
  rowIndex,
  colIndex,
  cell,
  isFocused,
  onChange,
  focusCell,
}) => {
  const [editing, setEditing] = useState(false)
  const [inputValue, setInputValue] = useState("")
  const [suggestion, setSuggestion] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  const getDisplayValue = (c: PartialCellObj | undefined) => {
    if (!c || c.v === undefined) return "\u00A0"
    if (c.t === "b") return c.v ? "TRUE" : "FALSE"
    if (c.t === "d" && c.v instanceof Date) {
      const d = new Date(c.v)
      if (!isNaN(d.getTime())) return d.toLocaleDateString()
    }
    return String(c.v)
  }

  const getEditableValue = (c: PartialCellObj | undefined) => {
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
    // Set focus on this cell
    focusCell(rowIndex, colIndex)
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
        focusCell(rowIndex, colIndex + 1)
      }
    } else if (e.key === "ArrowRight" || e.key === "ArrowLeft" || e.key === "ArrowDown" || e.key === "ArrowUp") {
      const input = inputRef.current
      if (!input) return

      const cursorAtStart = input.selectionStart === 0
      const cursorAtEnd = input.selectionStart === input.value.length

      if (e.key === "ArrowRight" && !cursorAtEnd) {
        return
      }
      if (e.key === "ArrowLeft" && !cursorAtStart) {
        return
      }

      let targetRow = rowIndex
      let targetCol = colIndex

      if (e.key === "ArrowRight") {
        if (!cursorAtEnd) return
        targetCol = colIndex + 1
      } else if (e.key === "ArrowLeft") {
        if (!cursorAtStart) return
        targetCol = colIndex - 1
      } else if (e.key === "ArrowDown") {
        targetRow = rowIndex + 1
      } else if (e.key === "ArrowUp") {
        targetRow = rowIndex - 1
      }

      e.preventDefault()
      commit()
      stopEdit()
      focusCell(targetRow, targetCol)
    }
  }

  const displayValue = getDisplayValue(cell)
  const showImagePreview = !editing && isImageUrl(displayValue)
  const showLinkPreview =
    !editing && !showImagePreview && isHttpUrl(displayValue)

  return (
    <div
      data-row={rowIndex}
      data-col={colIndex}
      className={twMerge(
        "min-w-12 px-2 py-1 text-black dark:text-white border border-gray-300 dark:border-neutral-600 relative cursor-default",
        rowIndex === 0 && "border-t-0",
        rowIndex > 0 && "-mt-px",
        colIndex > 0 && "-ml-px",
        cell?.t === "n" && !editing && "text-right",
        isFocused && !editing && "outline-2 outline-pink-900 outline-offset-[-3px]"
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
      {showImagePreview ? (
        <ImagePreview url={displayValue}>{displayValue}</ImagePreview>
      ) : showLinkPreview ? (
        <LinkPreview url={displayValue}>{displayValue}</LinkPreview>
      ) : (
        displayValue
      )}
    </div>
  )
}

export default React.memo(
  ExcelCell,
  (prev, next) =>
    prev.cell === next.cell &&
    prev.isFocused === next.isFocused &&
    prev.focusCell === next.focusCell,
)
