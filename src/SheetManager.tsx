import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { utils, type WorkBook } from "xlsx"
import { SheetData } from "./types"
import { getMaxColumnIndex } from "./utils/columnUtils"
import { getLastNonEmptyCol, getLastNonEmptyRow } from "./utils/sheetStats"
import { dataToSheet, sheetToData } from "./utils/xlsx"

const EXTRA_ROWS = 20
const EXTRA_COLS = 20
const MAX_COLS = getMaxColumnIndex()

const buildSheets = (workbook: WorkBook): SheetData[] =>
  workbook.SheetNames.map((name, idx) => ({
    id: idx + 1,
    name,
    data: sheetToData(workbook.Sheets[name]),
  }))

const getNextSheetName = (existingNames: string[], localizedBaseName: string) => {
  const trimmed = localizedBaseName.trim()
  const match = trimmed.match(/^(.*?)(\d+)$/)
  const prefix = (match?.[1] ?? trimmed.replace(/\d+$/, "")) || "Sheet"
  const start = match ? parseInt(match[2], 10) || 1 : 1
  const usedNames = new Set(existingNames)

  if (!match && trimmed && !usedNames.has(trimmed)) {
    return trimmed
  }

  let counter = start
  let candidate = `${prefix}${counter}`
  while (usedNames.has(candidate)) {
    counter += 1
    candidate = `${prefix}${counter}`
  }
  return candidate
}

export interface SheetManagerRenderProps {
  sheets: SheetData[]
  setSheets: React.Dispatch<React.SetStateAction<SheetData[]>>
  activeSheetIndex: number
  setActiveSheetIndex: React.Dispatch<React.SetStateAction<number>>
  activeSheetData: SheetData["data"]
  rowCount: number
  colCount: number
  addSheet: () => boolean
  renameSheet: (index: number, nextName: string) => boolean
  deleteSheet: (index: number) => boolean
}

interface SheetManagerProps {
  workbook: WorkBook
  onWorkbookChange?: (workbook: WorkBook) => void
  newSheetName: string
  children: (props: SheetManagerRenderProps) => React.ReactNode
}

const SheetManager: React.FC<SheetManagerProps> = ({
  workbook,
  onWorkbookChange,
  newSheetName,
  children,
}) => {
  const [sheets, setSheets] = useState<SheetData[]>(() => buildSheets(workbook))
  const [activeSheetIndex, setActiveSheetIndex] = useState(0)
  const sheetsRef = useRef(sheets)

  useEffect(() => {
    sheetsRef.current = sheets
  }, [sheets])

  useEffect(() => {
    setSheets(buildSheets(workbook))
  }, [workbook])

  const activeSheet = useMemo(
    () => sheets[activeSheetIndex],
    [sheets, activeSheetIndex],
  )

  const activeSheetData = useMemo(() => activeSheet?.data ?? [], [activeSheet])

  const rowCount = useMemo(
    () => getLastNonEmptyRow(activeSheetData) + EXTRA_ROWS,
    [activeSheetData],
  )

  const colCount = useMemo(
    () => Math.min(getLastNonEmptyCol(activeSheetData) + EXTRA_COLS, MAX_COLS + 1),
    [activeSheetData],
  )

  useEffect(() => {
    const sheetName = workbook.SheetNames[activeSheetIndex]
    dataToSheet(sheets[activeSheetIndex].data, workbook.Sheets[sheetName])
    onWorkbookChange?.(workbook)
  }, [sheets, activeSheetIndex, workbook, onWorkbookChange])

  const addSheet = useCallback(() => {
    const prevSheets = sheetsRef.current
    const nextName = getNextSheetName(
      prevSheets.map((sheet) => sheet.name),
      newSheetName,
    )
    const nextId = prevSheets.reduce((max, sheet) => Math.max(max, sheet.id), 0) + 1
    const blankWorksheet = utils.aoa_to_sheet([[]])
    const newSheetData = sheetToData(blankWorksheet)
    const nextSheets = [
      ...prevSheets,
      {
        id: nextId,
        name: nextName,
        data: newSheetData,
      },
    ]

    setSheets(nextSheets)
    onWorkbookChange?.({
      ...workbook,
      SheetNames: [...workbook.SheetNames, nextName],
      Sheets: { ...workbook.Sheets, [nextName]: blankWorksheet },
    })
    setActiveSheetIndex(nextSheets.length - 1)
    return true
  }, [newSheetName, workbook, onWorkbookChange])

  const renameSheet = useCallback(
    (index: number, nextName: string) => {
      const prevSheets = sheetsRef.current
      const sheet = prevSheets[index]
      if (!sheet) return false

      const updatedSheets = [...prevSheets]
      updatedSheets[index] = {
        ...updatedSheets[index],
        name: nextName,
      }
      setSheets(updatedSheets)

      const oldName = workbook.SheetNames[index]
      if (oldName !== nextName) {
        const nextSheetNames = [...workbook.SheetNames]
        nextSheetNames[index] = nextName
        const { [oldName]: renamedSheet, ...restSheets } = workbook.Sheets
        onWorkbookChange?.({
          ...workbook,
          SheetNames: nextSheetNames,
          Sheets: { ...restSheets, [nextName]: renamedSheet },
        })
      }
      return true
    },
    [workbook, onWorkbookChange],
  )

  const deleteSheet = useCallback(
    (index: number) => {
      const prevSheets = sheetsRef.current
      if (prevSheets.length <= 1) return false

      const sheet = prevSheets[index]
      if (!sheet) return false

      const nextSheets = prevSheets.filter((_, idx) => idx !== index)
      setSheets(nextSheets)

      const removedName = workbook.SheetNames[index]
      const restSheets = Object.fromEntries(
        Object.entries(workbook.Sheets).filter(([name]) => name !== removedName),
      )
      onWorkbookChange?.({
        ...workbook,
        SheetNames: workbook.SheetNames.filter((_, idx) => idx !== index),
        Sheets: restSheets,
      })

      const nextActiveIndex = index >= prevSheets.length - 1
        ? Math.max(0, prevSheets.length - 2)
        : index
      setActiveSheetIndex(nextActiveIndex)
      return true
    },
    [workbook, onWorkbookChange],
  )

  return (
    <>
      {children({
        sheets,
        setSheets,
        activeSheetIndex,
        setActiveSheetIndex,
        activeSheetData,
        rowCount,
        colCount,
        addSheet,
        renameSheet,
        deleteSheet,
      })}
    </>
  )
}

export default SheetManager
