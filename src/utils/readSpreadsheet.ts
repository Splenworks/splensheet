import { read, utils } from "xlsx"
import type { Cell, Workbook, Worksheet } from "../types"

export async function readSpreadsheet(buffer: ArrayBuffer): Promise<Workbook> {
  const wb = read(buffer, { type: "array", cellDates: true })
  const worksheets: Worksheet[] = wb.SheetNames.map((name, idx) => {
    const ws = wb.Sheets[name]
    const range = utils.decode_range(ws["!ref"] || "A1")

    const rowCount = range.e.r + 1
    const colCount = range.e.c + 1
    const data: Cell[][] = Array.from({ length: rowCount }, () =>
      Array.from({ length: colCount }, () => ({ v: null })),
    )

    for (let R = range.s.r; R <= range.e.r; R++) {
      for (let C = range.s.c; C <= range.e.c; C++) {
        const addr = utils.encode_cell({ r: R, c: C })
        const cell = ws[addr] as
          | { v?: string | number | boolean | Date; f?: string; t?: string }
          | undefined
        if (cell) {
          const value = cell.v ?? null
          const formula = cell.f as string | undefined
          const type = cell.t as string | undefined
          data[R][C] = formula
            ? { v: value, f: formula, t: type }
            : { v: value, t: type }
        } else {
          data[R][C] = { v: null }
        }
      }
    }

    return { id: idx + 1, name, data }
  })
  return { worksheets }
}
