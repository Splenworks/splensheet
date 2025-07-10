export interface Cell {
  v: string | number | boolean | null
  f?: string
}

export interface Worksheet {
  id: number
  name: string
  data: Cell[][]
}

export interface Workbook {
  worksheets: Worksheet[]
}
