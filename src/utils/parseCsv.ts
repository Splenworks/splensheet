export function parseCsv(data: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
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
        row.push(field)
        field = ""
      } else if (char === '\n') {
        row.push(field)
        rows.push(row)
        row = []
        field = ""
      } else if (char === '\r') {
        // handle CRLF or standalone CR
        if (data[i + 1] === '\n') {
          row.push(field)
          rows.push(row)
          row = []
          field = ""
          i++
        } else {
          row.push(field)
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
  row.push(field)
  rows.push(row)
  return rows
}
