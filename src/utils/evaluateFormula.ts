import type { Cell } from "../types"
import { HyperFormula } from "hyperformula"

export function evaluateFormula(
  data: Cell[][],
  row: number,
  col: number,
): string | number | boolean | null {
  const arrayData = data.map((r) =>
    r.map((c) => (c?.f ? `=${c.f}` : c?.v ?? null)),
  )
  const hf = HyperFormula.buildFromArray(arrayData, { licenseKey: "gpl-v3" })
  return hf.getCellValue({ sheet: 0, row, col }) as
    | string
    | number
    | boolean
    | null
}
