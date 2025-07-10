import type { Cell } from '../types'
import { evaluateFormula } from './evaluateFormula'

export function parseCsv(data: string): Cell[][] {
  const rows: Cell[][] = []
  let row: Cell[] = []
  let field = ""
  let inQuotes = false
  for (let i = 0; i < data.length; i++) {
    const char = data[i]
    if (inQuotes) {
      if (char === '"') {
        if (data[i + 1] === '"') {
          field += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        field += char
      }
    } else {
      if (char === '"') {
        inQuotes = true
      } else if (char === ',') {
        if (field.startsWith('=')) {
          row.push({ v: null, f: field.slice(1) })
        } else {
          row.push({ v: field })
        }
        field = ""
      } else if (char === '\n') {
        if (field.startsWith('=')) {
          row.push({ v: null, f: field.slice(1) })
        } else {
          row.push({ v: field })
        }
        rows.push(row)
        row = []
        field = ""
      } else if (char === '\r') {
        // handle CRLF or standalone CR
        if (data[i + 1] === '\n') {
          if (field.startsWith('=')) {
            row.push({ v: null, f: field.slice(1) })
          } else {
            row.push({ v: field })
          }
          rows.push(row)
          row = []
          field = ""
          i++
        } else {
          if (field.startsWith('=')) {
            row.push({ v: null, f: field.slice(1) })
          } else {
            row.push({ v: field })
          }
          rows.push(row)
          row = []
          field = ""
        }
      } else {
        field += char
      }
    }
  }
  // push last field
  if (field.startsWith('=')) {
    row.push({ v: null, f: field.slice(1) })
  } else {
    row.push({ v: field })
  }
  rows.push(row)
  for (let r = 0; r < rows.length; r++) {
    for (let c = 0; c < rows[r].length; c++) {
      const cell = rows[r][c]
      if (cell.f) {
        cell.v = evaluateFormula(cell.f, rows)
      }
    }
  }
  return rows
}
