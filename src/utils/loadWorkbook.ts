import { read, type WorkBook } from "xlsx"
import { parseCsv } from "./parseCsv"

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
