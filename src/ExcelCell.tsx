import React, { useEffect, useRef, useState } from "react"
import { twMerge } from "tailwind-merge"
import type { CellObject } from "xlsx"
import { evaluateFormula } from "./utils/evaluateFormula"

interface ExcelCellProps {
  rowIndex: number
  colIndex: number
  cell: Partial<CellObject> | undefined
  data: Array<Array<Partial<CellObject>>>
  onChange: (r: number, c: number, cell: Partial<CellObject>) => void
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
      else setInputValue(cell?.v != undefined ? String(cell.v) : "")
      inputRef.current?.focus()
    }
  }, [editing, cell])

  const commit = () => {
    const val = inputValue
    if (val.startsWith("=")) {
      const formula = val.slice(1)
      const copy: Array<Array<Partial<CellObject>>> = data.map((row) =>
        row.map((c) => (c ? { ...c } : {})),
      )
      if (!copy[rowIndex]) copy[rowIndex] = []
      copy[rowIndex][colIndex] = { f: formula }
      const result = evaluateFormula(copy, rowIndex, colIndex)
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
      {cell?.v != undefined ? String(cell.v) : ""}
    </td>
  )
}

export default ExcelCell
