import type { CellObject, WorkSheet } from "xlsx"
import { utils } from "xlsx"
import { PartialCellObj } from "../types"

export const getCellType = (value: unknown): "n" | "s" | "b" | "d" => {
  if (typeof value === "number") return "n"
  if (typeof value === "string") return "s"
  if (typeof value === "boolean") return "b"
  if (value instanceof Date) return "d"
  return "s"
}

export const sheetToData = (ws: WorkSheet): PartialCellObj[][] => {
  const range = utils.decode_range(ws["!ref"] || "A1")
  const rowCount = range.e.r + 1
  const colCount = range.e.c + 1
  const data: PartialCellObj[][] = Array.from({ length: rowCount }, () =>
    Array.from({ length: colCount }, () => ({})),
  )
  for (let R = range.s.r; R <= range.e.r; R++) {
    for (let C = range.s.c; C <= range.e.c; C++) {
      const addr = utils.encode_cell({ r: R, c: C })
      const cell: CellObject = ws[addr]
      if (cell) {
        cell.t = cell.t || getCellType(cell.v)
        data[R][C] = cell
      }
    }
  }
  return data
}

export const dataToSheet = (data: PartialCellObj[][], ws: WorkSheet) => {
  for (let r = 0; r < data.length; r++) {
    for (let c = 0; c < data[r].length; c++) {
      const cell = data[r][c]
      const addr = utils.encode_cell({ r, c })
      if (cell && (cell.v !== undefined || cell.f)) {
        ws[addr] = {
          v: cell.v ?? undefined,
          f: cell.f,
          t: cell.t,
        } as CellObject
      } else {
        delete ws[addr]
      }
    }
  }
  const rowCount = data.length
  const colCount = data.reduce((m, r) => Math.max(m, r.length), 0)
  ws["!ref"] = utils.encode_range({
    s: { r: 0, c: 0 },
    e: { r: rowCount - 1, c: colCount - 1 },
  })
}
