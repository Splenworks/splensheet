export interface Worksheet {
  id: number
  name: string
  data: (string | number | boolean | null)[][]
}

export interface Workbook {
  worksheets: Worksheet[]
}
