import type { CellObject, ColInfo, RowInfo, WorkSheet } from "xlsx"
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

const PIXELS_PER_POINT = 96 / 72

const widthToPx = (width: number, mdw = 7) =>
  Math.floor((width + Math.round(128 / mdw) / 256) * mdw)

export const readColWidths = (ws: WorkSheet): Record<number, number> => {
  const cols = ws["!cols"]
  if (!Array.isArray(cols)) return {}
  const result: Record<number, number> = {}
  for (let i = 0; i < cols.length; i++) {
    const col = cols[i]
    if (!col || col.hidden) continue
    const mdw = (col as ColInfo & { MDW?: number }).MDW
    if (typeof col.wpx === "number") result[i] = col.wpx
    else if (typeof col.width === "number")
      result[i] = widthToPx(col.width, mdw ?? 7)
    else if (typeof col.wch === "number")
      result[i] = Math.round(col.wch * (mdw ?? 7) + 5)
  }
  return result
}

export const readRowHeights = (ws: WorkSheet): Record<number, number> => {
  const rows = ws["!rows"]
  if (!Array.isArray(rows)) return {}
  const result: Record<number, number> = {}
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    if (!row || row.hidden) continue
    if (typeof row.hpx === "number") result[i] = row.hpx
    else if (typeof row.hpt === "number")
      result[i] = Math.round(row.hpt * PIXELS_PER_POINT)
  }
  return result
}

export const writeColWidths = (
  ws: WorkSheet,
  widths: Record<number, number>,
) => {
  const indices = Object.keys(widths).map(Number)
  if (indices.length === 0) return
  const maxIdx = Math.max(...indices)
  const cols: ColInfo[] = ws["!cols"] ?? []
  while (cols.length <= maxIdx) cols.push({})
  for (const key in widths) {
    const i = +key
    cols[i] = { ...cols[i], wpx: widths[i] }
  }
  ws["!cols"] = cols
}

export const writeRowHeights = (
  ws: WorkSheet,
  heights: Record<number, number>,
) => {
  const indices = Object.keys(heights).map(Number)
  if (indices.length === 0) return
  const maxIdx = Math.max(...indices)
  const rows: RowInfo[] = ws["!rows"] ?? []
  while (rows.length <= maxIdx) rows.push({})
  for (const key in heights) {
    const i = +key
    rows[i] = { ...rows[i], hpx: heights[i] }
  }
  ws["!rows"] = rows
}
