import { utils, type WorkBook } from "xlsx"

export function createWorkbook(sheetName: string): WorkBook {
  const wb = utils.book_new()
  const ws = utils.aoa_to_sheet([[]])
  utils.book_append_sheet(wb, ws, sheetName)
  return wb
}
