import { read } from 'xlsx'
import type { WorkBook } from 'xlsx'

export async function readSpreadsheet(buffer: ArrayBuffer): Promise<WorkBook> {
  return read(buffer, { type: 'array' })
}
