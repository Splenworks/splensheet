import { DetailedCellError, HyperFormula } from "hyperformula"
import type { CellObject } from "xlsx"
import { getCellType } from "./xlsx"

export function evaluateFormula(
  data: Array<Array<Partial<CellObject>>>,
  row: number,
  col: number,
): string | number | boolean | undefined {
  const arrayData = data.map((r) => r.map((c) => (c?.f ? `=${c.f}` : c?.v)))
  const hf = HyperFormula.buildFromArray(arrayData, { licenseKey: "gpl-v3" })
  const cellValue = hf.getCellValue({ sheet: 0, row, col })
  if (cellValue instanceof DetailedCellError || cellValue === null) {
    return undefined
  }
  return cellValue
}

export function recalculateSheet(
  data: Array<Array<Partial<CellObject>>>,
): Array<Array<Partial<CellObject>>> {
  const arrayData = data.map((r) => r.map((c) => (c?.f ? `=${c.f}` : c?.v)))
  const hf = HyperFormula.buildFromArray(arrayData, { licenseKey: "gpl-v3" })
  const values = hf.getSheetValues(0)
  return data.map((row, r) =>
    row.map((cell, c) => {
      if (cell?.f) {
        const v = values[r][c]
        if (v instanceof DetailedCellError || v === null) {
          return { ...cell, v: undefined }
        }
        return { ...cell, v, t: getCellType(v) }
      }
      return cell
    }),
  )
}
