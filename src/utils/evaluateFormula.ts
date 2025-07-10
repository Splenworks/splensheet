import type { Cell } from '../types'

function columnLabelToIndex(label: string): number {
  let index = 0
  for (let i = 0; i < label.length; i++) {
    index = index * 26 + (label.charCodeAt(i) - 64)
  }
  return index - 1
}

export function evaluateFormula(formula: string, data: Cell[][]): number | string | null {
  let expr = formula.trim()
  expr = expr.replace(/\$/g, '')
  expr = expr.replace(/([A-Za-z]+)(\d+)/g, (_, col, row) => {
    const c = columnLabelToIndex(col.toUpperCase())
    const r = parseInt(row, 10) - 1
    const value = data[r]?.[c]?.v
    if (value == null || value === '') return '0'
    if (typeof value === 'number') return String(value)
    const num = Number(value)
    return isNaN(num) ? '0' : String(num)
  })
  try {
    const result = new Function(`return (${expr})`)()
    return result
  } catch {
    return null
  }
}
