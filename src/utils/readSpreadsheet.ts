import { read, utils } from 'xlsx'
import { Workbook, Worksheet } from '../types'

export async function readSpreadsheet(buffer: ArrayBuffer): Promise<Workbook> {
  const wb = read(buffer, { type: 'array' })
  const worksheets: Worksheet[] = wb.SheetNames.map((name, idx) => {
    const ws = wb.Sheets[name]
    const data = utils.sheet_to_json(ws, { header: 1, raw: true }) as (
      | string
      | number
      | boolean
      | null
    )[][]
    return { id: idx + 1, name, data }
  })
  return { worksheets }
}
