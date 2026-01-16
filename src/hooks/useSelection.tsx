import { useCallback, useEffect, useState, type MutableRefObject, type RefObject } from "react"

type CellPosition = { row: number; col: number }

interface UseSelectionOptions {
  activeSheetIndex: number
  rowCountRef: MutableRefObject<number>
  colCountRef: MutableRefObject<number>
  useVirtual: boolean
  rowVirtualizer: { scrollToIndex: (index: number) => void }
  gridRef: RefObject<HTMLDivElement | null>
  parentRef: RefObject<HTMLDivElement | null>
}

export const useSelection = ({
  activeSheetIndex,
  rowCountRef,
  colCountRef,
  useVirtual,
  rowVirtualizer,
  gridRef,
  parentRef,
}: UseSelectionOptions) => {
  const [selectedCell, setSelectedCell] = useState<CellPosition | null>(null)

  useEffect(() => {
    setSelectedCell(null)
  }, [activeSheetIndex])

  const clearSelection = useCallback(() => {
    setSelectedCell(null)
  }, [])

  const selectCell = useCallback(
    (row: number, col: number) => {
      let r = row
      let c = col
      const maxRow = rowCountRef.current
      const maxCol = colCountRef.current
      if (c >= maxCol) {
        c = 0
        r += 1
      } else if (c < 0) {
        c = maxCol - 1
        r -= 1
      }
      if (r < 0 || r >= maxRow) return

      setSelectedCell({ row: r, col: c })

      if (useVirtual) {
        rowVirtualizer.scrollToIndex(r)
      } else {
        setTimeout(() => {
          gridRef.current
            ?.querySelector<HTMLDivElement>(`[data-row='${r}'][data-col='${c}']`)
            ?.scrollIntoView({ block: "nearest", inline: "nearest" })
        }, 0)
      }

      const parent = parentRef.current
      if (parent) {
        let targetCell: HTMLElement | null = null
        targetCell = parent.querySelector(`[data-col="${c}"]`)
        if (targetCell) {
          const cellRect = targetCell.getBoundingClientRect()
          const parentWidth = parent.clientWidth
          if (cellRect.left < 0 || cellRect.right > parentWidth) {
            const left = cellRect.left - parent.getBoundingClientRect().left + parent.scrollLeft
            if (left < parent.scrollLeft) {
              parent.scrollLeft = left
            } else if (left + cellRect.width > parent.scrollLeft + parentWidth) {
              parent.scrollLeft = left + cellRect.width - parentWidth
            }
          }
        }
      }
    },
    [gridRef, parentRef, rowCountRef, rowVirtualizer, useVirtual, colCountRef],
  )

  return { selectedCell, selectCell, clearSelection }
}
