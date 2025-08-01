import { DetailedCellError, HyperFormula } from "hyperformula"
import type { CellObject } from "xlsx"
import { getCellType } from "./xlsx"

const LICENSE = { licenseKey: "gpl-v3" }

export const recalculateSheet = (
  data: Array<Array<Partial<CellObject>>>,
): Array<Array<Partial<CellObject>>> => {
  const arrayData = data.map((r) => r.map((c) => (c?.f ? `=${c.f}` : c?.v)))
  const hf = HyperFormula.buildFromArray(arrayData, LICENSE)
  const values = hf.getSheetValues(0)
  hf.destroy()
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

