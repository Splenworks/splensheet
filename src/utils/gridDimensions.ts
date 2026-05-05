import { offsetAt, sizeAt, type SizeOverrides } from "./gridSizing"

export const COL_W = 96
export const ROW_H = 32
export const HEADER_W = 48
export const HEADER_H = 32
export const OVERSCAN = 20

export const MIN_COL_W = 24
export const MIN_ROW_H = 18

export const MAX_VIRTUAL_ROWS = 100000

export const scrollCellIntoView = (
  parent: HTMLElement,
  r: number,
  c: number,
  rowHeights: SizeOverrides,
  colWidths: SizeOverrides,
) => {
  const top = HEADER_H + offsetAt(ROW_H, rowHeights, r)
  const left = HEADER_W + offsetAt(COL_W, colWidths, c)
  const bottom = top + sizeAt(rowHeights, ROW_H, r)
  const right = left + sizeAt(colWidths, COL_W, c)

  if (top < parent.scrollTop + HEADER_H) {
    parent.scrollTop = top - HEADER_H
  } else if (bottom > parent.scrollTop + parent.clientHeight) {
    parent.scrollTop = bottom - parent.clientHeight
  }

  if (left < parent.scrollLeft + HEADER_W) {
    parent.scrollLeft = left - HEADER_W
  } else if (right > parent.scrollLeft + parent.clientWidth) {
    parent.scrollLeft = right - parent.clientWidth
  }
}
