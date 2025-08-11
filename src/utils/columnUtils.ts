/**
 * Converts a column index to Excel-style column name (0 -> A, 1 -> B, ..., 25 -> Z, 26 -> AA, etc.)
 */
export const indexToColumnName = (index: number): string => {
  let result = ""
  let num = index + 1 // Make it 1-based

  while (num > 0) {
    num-- // Make it 0-based for this iteration
    result = String.fromCharCode(65 + (num % 26)) + result
    num = Math.floor(num / 26)
  }

  return result
}

/**
 * Converts an Excel-style column name to column index (A -> 0, B -> 1, ..., Z -> 25, AA -> 26, etc.)
 */
export const columnNameToIndex = (name: string): number => {
  let result = 0
  const length = name.length

  for (let i = 0; i < length; i++) {
    const charCode = name.charCodeAt(i) - 65 // A = 0, B = 1, etc.
    result = result * 26 + charCode + 1
  }

  return result - 1 // Make it 0-based
}

/**
 * Get the maximum column index for ZZZ (the last column)
 */
export const getMaxColumnIndex = (): number => {
  return columnNameToIndex("ZZZ")
}

/**
 * Check if a column index is valid (within A to ZZZ range)
 */
export const isValidColumnIndex = (index: number): boolean => {
  return index >= 0 && index <= getMaxColumnIndex()
}
