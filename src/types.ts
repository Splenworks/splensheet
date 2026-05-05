import { CellObject, WorkSheet } from "xlsx"

export type PartialCellObj = Partial<CellObject>

export type SheetData = {
  id: number
  name: string
  data: PartialCellObj[][]
  importedWorksheet?: WorkSheet
  colWidths: Record<number, number>
  rowHeights: Record<number, number>
}
