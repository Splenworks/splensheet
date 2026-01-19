import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { utils, type WorkBook } from "xlsx"
import { SheetData } from "../types"
import { sheetToData } from "../utils/xlsx"

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

export const useWorkbookSheets = (
  workbook: WorkBook,
  localizedNewSheetName: string,
) => {
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

  const addSheet = useCallback(() => {
    const prevSheets = sheetsRef.current
    const nextName = getNextSheetName(
      prevSheets.map((sheet) => sheet.name),
      localizedNewSheetName,
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
    workbook.SheetNames.push(nextName)
    workbook.Sheets[nextName] = blankWorksheet
    setActiveSheetIndex(nextSheets.length - 1)
    return true
  }, [localizedNewSheetName, workbook])

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
        workbook.SheetNames[index] = nextName
        workbook.Sheets[nextName] = workbook.Sheets[oldName]
        delete workbook.Sheets[oldName]
      }
      return true
    },
    [workbook],
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
      workbook.SheetNames.splice(index, 1)
      delete workbook.Sheets[removedName]

      const nextActiveIndex = index >= prevSheets.length - 1
        ? Math.max(0, prevSheets.length - 2)
        : index
      setActiveSheetIndex(nextActiveIndex)
      return true
    },
    [workbook],
  )

  return {
    sheets,
    setSheets,
    activeSheet,
    activeSheetIndex,
    setActiveSheetIndex,
    addSheet,
    renameSheet,
    deleteSheet,
  }
}
