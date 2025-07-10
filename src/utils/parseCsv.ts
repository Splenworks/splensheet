import type { Cell } from '../types'

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
        row.push({ v: field })
        field = ""
      } else if (char === '\n') {
        row.push({ v: field })
        rows.push(row)
        row = []
        field = ""
      } else if (char === '\r') {
        // handle CRLF or standalone CR
        if (data[i + 1] === '\n') {
          row.push({ v: field })
          rows.push(row)
          row = []
          field = ""
          i++
        } else {
          row.push({ v: field })
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
  row.push({ v: field })
  rows.push(row)
  return rows
}
