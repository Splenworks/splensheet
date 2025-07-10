import type { Cell } from "../types"

function columnToIndex(col: string): number {
  return col
    .split("")
    .reduce((acc, ch) => acc * 26 + (ch.charCodeAt(0) - 64), 0) - 1
}

export function evaluateFormula(
  formula: string,
  data: Cell[][],
): string | number | boolean | null {
  const replaced = formula.replace(/([A-Z]+)(\d+)/g, (_, col, row) => {
    const r = parseInt(row, 10) - 1
    const c = columnToIndex(col)
    const val = data[r]?.[c]?.v
    if (typeof val === "number" || typeof val === "boolean") return String(val)
    if (val === null || val === undefined || val === "") return "0"
    const num = Number(val)
    if (!Number.isNaN(num)) return String(num)
    return `"${String(val).replace(/"/g, '\\"')}"`
  })
  try {
    return new Function(`return (${replaced})`)()
  } catch {
    return null
  }
}
