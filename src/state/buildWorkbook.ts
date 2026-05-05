import { utils, writeFile } from "xlsx"
import { dataToSheet, writeColWidths, writeRowHeights } from "../utils/xlsx"
import type { SpreadsheetState } from "./spreadsheet"

export const downloadWorkbook = (state: SpreadsheetState) => {
  const wb = utils.book_new()
  state.sheets.forEach((sd) => {
    const ws = sd.importedWorksheet ?? utils.aoa_to_sheet([[]])
    dataToSheet(sd.data, ws)
    writeColWidths(ws, sd.colWidths)
    writeRowHeights(ws, sd.rowHeights)
    utils.book_append_sheet(wb, ws, sd.name)
  })
  const imported = state.importedWorkbook
  if (imported) {
    if (imported.Props) wb.Props = imported.Props
    if (imported.Custprops) wb.Custprops = imported.Custprops
    if (imported.Workbook) wb.Workbook = imported.Workbook
  }
  writeFile(wb, state.fileName)
}
