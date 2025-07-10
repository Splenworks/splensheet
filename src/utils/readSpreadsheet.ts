import { read, utils } from 'xlsx'
import type { Workbook, Worksheet, Cell } from '../types'

export async function readSpreadsheet(buffer: ArrayBuffer): Promise<Workbook> {
  const wb = read(buffer, { type: 'array' })
  const worksheets: Worksheet[] = wb.SheetNames.map((name, idx) => {
    const ws = wb.Sheets[name]
    const range = utils.decode_range(ws['!ref'] || 'A1')
    const data: Cell[][] = []
    for (let R = range.s.r; R <= range.e.r; R++) {
      const row: Cell[] = []
      for (let C = range.s.c; C <= range.e.c; C++) {
        const addr = utils.encode_cell({ r: R, c: C })
        const cell = ws[addr] as
          | { v?: string | number | boolean; f?: string }
          | undefined
        if (cell) {
          const value = cell.v ?? null
          const formula = cell.f as string | undefined
          row.push(formula ? { v: value, f: formula } : { v: value })
        } else {
          row.push({ v: null })
        }
      }
      data.push(row)
    }
    return { id: idx + 1, name, data }
  })
  return { worksheets }
}
