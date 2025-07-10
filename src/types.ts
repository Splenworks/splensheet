export interface Cell {
  v: string | number | boolean | Date | null
  f?: string
  t?: string
}

export interface Worksheet {
  id: number
  name: string
  data: Cell[][]
}

export interface Workbook {
  worksheets: Worksheet[]
}
