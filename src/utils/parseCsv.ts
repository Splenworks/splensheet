import { utils } from 'xlsx'
import type { WorkBook } from 'xlsx'
import Papa from 'papaparse'

export function parseCsv(data: string): WorkBook {
  const { data: rows } = Papa.parse<string[]>(data, {
    skipEmptyLines: true,
  })
  const wb = utils.book_new()
  const sheet = utils.aoa_to_sheet(rows)
  utils.book_append_sheet(wb, sheet, 'Sheet1')
  return wb
}
