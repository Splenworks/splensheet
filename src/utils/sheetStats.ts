import type { PartialCellObj } from "../types"

export const getLastNonEmptyRow = (data: PartialCellObj[][]): number => {
  let lastRowIdx = data.length
  while (lastRowIdx > 0) {
    const row = data[lastRowIdx - 1] || []
    const hasData = row.some(
      (c) => c && (c.f || (c.v !== undefined && c.v !== "")),
    )
    if (hasData) break
    lastRowIdx--
  }
  return lastRowIdx
}

export const getLastNonEmptyCol = (data: PartialCellObj[][]): number => {
  let lastColIdx = data.reduce((max, row) => Math.max(max, row.length), 0)
  while (lastColIdx > 0) {
    const hasData = data.some((row) => {
      const c = row[lastColIdx - 1]
      return c && (c.f || (c.v !== null && c.v !== undefined && c.v !== ""))
    })
    if (hasData) break
    lastColIdx--
  }
  return lastColIdx
}

// export const getLastNonEmptyCol = (data: PartialCellObj[][]): number => {
//   const lastColIdx = getLastNonEmptyColIndex(data)
//   const maxColumnIndex = getMaxColumnIndex()
//   return Math.min(lastColIdx + EXTRA_COLS, maxColumnIndex + 1)
// }
