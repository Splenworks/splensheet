export const COL_W = 96
export const ROW_H = 32
export const HEADER_W = 48
export const HEADER_H = 32
export const OVERSCAN = 20

export const MAX_VIRTUAL_ROWS = 100000

export const cellTop = (r: number) => HEADER_H + r * ROW_H
export const cellLeft = (c: number) => HEADER_W + c * COL_W

export const scrollCellIntoView = (parent: HTMLElement, r: number, c: number) => {
  const top = cellTop(r)
  const left = cellLeft(c)
  const bottom = top + ROW_H
  const right = left + COL_W

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
