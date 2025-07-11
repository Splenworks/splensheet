import { DetailedCellError, HyperFormula } from "hyperformula"
import type { CellObject } from "xlsx"

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
