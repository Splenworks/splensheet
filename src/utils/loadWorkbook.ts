import { read, utils, type WorkBook } from "xlsx"
import Papa from 'papaparse'

function parseCsv(data: string): WorkBook {
  const { data: rows } = Papa.parse<string[]>(data, {
    skipEmptyLines: true,
  })
  const wb = utils.book_new()
  const sheet = utils.aoa_to_sheet(rows)
  utils.book_append_sheet(wb, sheet, 'Sheet1')
  return wb
}

export async function loadWorkbook(file: File): Promise<WorkBook | null> {
  try {
    const fileName = file.name.toLowerCase()
    if (
      !fileName.endsWith(".xlsx") &&
      !fileName.endsWith(".xls") &&
      !fileName.endsWith(".csv")
    ) {
      throw new Error("Please upload a valid Excel (.xlsx, .xls) or CSV file.")
    }
    if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
      const arrayBuffer = await file.arrayBuffer()
      return read(arrayBuffer, { type: "array", cellDates: true })
    } else {
      const csvData = await file.text()
      return parseCsv(csvData)
    }
  } catch (error) {
    alert(error instanceof Error ? error.message : error)
    console.error(error)
    return null
  }
}
