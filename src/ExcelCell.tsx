import React, { useEffect, useRef, useState } from "react"
import { twMerge } from "tailwind-merge"
import type { Cell } from "./types"

interface ExcelCellProps {
  rowIndex: number
  colIndex: number
  cell: Cell | undefined
  onChange: (r: number, c: number, cell: Cell) => void
}

const ExcelCell: React.FC<ExcelCellProps> = ({
  rowIndex,
  colIndex,
  cell,
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
      onChange(rowIndex, colIndex, { v: null, f: val.slice(1) })
    } else {
      onChange(rowIndex, colIndex, { v: val })
    }
  }

  const handleBlur = () => {
    commit()
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
          className="absolute left-0 top-0 right-0 bottom-0 px-[6px] py-[2px] box-border border-2 border-transparent focus:border-black dark:focus:border-neutral-300 focus:outline-none bg-white dark:bg-neutral-900"
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
