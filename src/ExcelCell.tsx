import React, { useEffect, useRef, useState } from "react"
import { twMerge } from "tailwind-merge"
import type { Cell } from "./types"
import { evaluateFormula } from "./utils/evaluateFormula"

interface ExcelCellProps {
  rowIndex: number
  colIndex: number
  cell: Cell | undefined
  data: Cell[][]
  onChange: (r: number, c: number, cell: Cell) => void
}

const ExcelCell: React.FC<ExcelCellProps> = ({
  rowIndex,
  colIndex,
  cell,
  data,
  onChange,
}) => {
  const [editing, setEditing] = useState(false)
  const [inputValue, setInputValue] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) {
      if (cell?.f) setInputValue("=" + cell.f)
      else setInputValue(cell?.v != null ? String(cell.v) : "")
      inputRef.current?.focus()
    }
  }, [editing, cell])

  const commit = () => {
    const val = inputValue
    if (val.startsWith("=")) {
      const formula = val.slice(1)
      const copy = data.map((row) => row.map((c) => (c ? { ...c } : { v: null })))
      if (!copy[rowIndex]) copy[rowIndex] = []
      copy[rowIndex][colIndex] = { v: null, f: formula }
      const result = evaluateFormula(formula, copy)
      onChange(rowIndex, colIndex, { v: result, f: formula })
    } else {
      onChange(rowIndex, colIndex, { v: val })
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
    }
  }

  return (
    <td
      className={twMerge(
        "px-2 py-1 text-black dark:text-white border border-gray-300 dark:border-neutral-600 relative",
        rowIndex === 0 && "border-t-0"
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
      {cell?.v ?? ""}
    </td>
  )
}

export default ExcelCell
