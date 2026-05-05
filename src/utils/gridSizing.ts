export type SizeOverrides = Record<number, number>

export const sizeAt = (
  overrides: SizeOverrides,
  defaultSize: number,
  idx: number,
) => overrides[idx] ?? defaultSize

export const totalSize = (
  count: number,
  defaultSize: number,
  overrides: SizeOverrides,
) => {
  let total = count * defaultSize
  for (const k in overrides) total += overrides[+k] - defaultSize
  return total
}

export const offsetAt = (
  defaultSize: number,
  overrides: SizeOverrides,
  idx: number,
) => {
  let offset = idx * defaultSize
  for (const k in overrides) {
    const i = +k
    if (i < idx) offset += overrides[i] - defaultSize
  }
  return offset
}

export const indexAtOffset = (
  count: number,
  defaultSize: number,
  overrides: SizeOverrides,
  target: number,
) => {
  if (target <= 0) return 0
  let lo = 0
  let hi = count
  while (lo < hi) {
    const mid = (lo + hi) >>> 1
    if (offsetAt(defaultSize, overrides, mid + 1) <= target) lo = mid + 1
    else hi = mid
  }
  return Math.min(lo, count - 1)
}
