import { utils, type WorkBook } from "xlsx"
import type { PartialCellObj, SheetData } from "../types"
import { getMaxColumnIndex } from "../utils/columnUtils"
import { MAX_VIRTUAL_ROWS } from "../utils/gridDimensions"
import { recalculateSheet } from "../utils/recalculateSheet"
import { sheetToData } from "../utils/xlsx"

const VIRTUAL_COL_COUNT = getMaxColumnIndex() + 1

export type HistoryEntry = {
  sheetIndex: number
  r: number
  c: number
  prev: PartialCellObj
}

export type SpreadsheetState = {
  sheets: SheetData[]
  activeSheetIndex: number
  fileName: string
  hasChanges: boolean
  importedWorkbook: WorkBook | null
  past: HistoryEntry[]
  future: HistoryEntry[]
}

export type SpreadsheetAction =
  | { type: "load-file"; workbook: WorkBook; fileName: string }
  | { type: "update-cell"; r: number; c: number; cell: PartialCellObj }
  | { type: "set-active-sheet"; index: number }
  | { type: "set-file-name"; fileName: string }
  | { type: "add-sheet"; baseName: string }
  | { type: "rename-sheet"; index: number; name: string }
  | { type: "delete-sheet"; index: number }
  | { type: "mark-saved" }
  | { type: "undo" }
  | { type: "redo" }

export const buildSheetsFromWorkbook = (workbook: WorkBook): SheetData[] =>
  workbook.SheetNames.map((name, idx) => ({
    id: idx + 1,
    name,
    data: sheetToData(workbook.Sheets[name]),
    importedWorksheet: workbook.Sheets[name],
  }))

const getNextSheetName = (existingNames: string[], baseName: string): string => {
  const trimmed = baseName.trim()
  const match = trimmed.match(/^(.*?)(\d+)$/)
  const prefix = (match?.[1] ?? trimmed.replace(/\d+$/, "")) || "Sheet"
  const start = match ? parseInt(match[2], 10) || 1 : 1
  const used = new Set(existingNames)

  if (!match && trimmed && !used.has(trimmed)) return trimmed

  let counter = start
  let candidate = `${prefix}${counter}`
  while (used.has(candidate)) {
    counter += 1
    candidate = `${prefix}${counter}`
  }
  return candidate
}

export const createInitialState = (
  fileName: string,
  sheetName: string,
): SpreadsheetState => ({
  sheets: [{ id: 1, name: sheetName, data: [[]] }],
  activeSheetIndex: 0,
  fileName,
  hasChanges: false,
  importedWorkbook: null,
  past: [],
  future: [],
})

const writeCell = (
  sheets: SheetData[],
  sheetIndex: number,
  r: number,
  c: number,
  cell: PartialCellObj,
): { sheets: SheetData[]; prev: PartialCellObj } => {
  const target = sheets[sheetIndex]
  const prev = target.data[r]?.[c] ?? {}

  const data = [...target.data]
  while (data.length <= r) data.push([])
  const row = [...data[r]]
  while (row.length <= c) row.push({})
  row[c] = cell
  data[r] = row

  const next = [...sheets]
  next[sheetIndex] = { ...target, data: recalculateSheet(data) }
  return { sheets: next, prev }
}

export const spreadsheetReducer = (
  state: SpreadsheetState,
  action: SpreadsheetAction,
): SpreadsheetState => {
  switch (action.type) {
    case "load-file":
      return {
        sheets: buildSheetsFromWorkbook(action.workbook),
        activeSheetIndex: 0,
        fileName: action.fileName,
        hasChanges: false,
        importedWorkbook: action.workbook,
        past: [],
        future: [],
      }

    case "update-cell": {
      const { r, c, cell } = action
      const result = writeCell(state.sheets, state.activeSheetIndex, r, c, cell)
      return {
        ...state,
        sheets: result.sheets,
        hasChanges: true,
        past: [...state.past, { sheetIndex: state.activeSheetIndex, r, c, prev: result.prev }],
        future: [],
      }
    }

    case "set-active-sheet":
      return { ...state, activeSheetIndex: action.index }

    case "set-file-name":
      return { ...state, fileName: action.fileName }

    case "add-sheet": {
      const nextName = getNextSheetName(
        state.sheets.map((s) => s.name),
        action.baseName,
      )
      const nextId = state.sheets.reduce((m, s) => Math.max(m, s.id), 0) + 1
      const blankWs = utils.aoa_to_sheet([[]])
      return {
        ...state,
        sheets: [
          ...state.sheets,
          {
            id: nextId,
            name: nextName,
            data: sheetToData(blankWs),
            importedWorksheet: blankWs,
          },
        ],
        activeSheetIndex: state.sheets.length,
        hasChanges: true,
      }
    }

    case "rename-sheet": {
      const sheet = state.sheets[action.index]
      if (!sheet) return state
      if (state.sheets.some((s, i) => i !== action.index && s.name === action.name)) {
        return state
      }
      const sheets = [...state.sheets]
      sheets[action.index] = { ...sheet, name: action.name }
      return { ...state, sheets, hasChanges: true }
    }

    case "delete-sheet": {
      if (state.sheets.length <= 1) return state
      const sheets = state.sheets.filter((_, i) => i !== action.index)
      const nextActive =
        action.index >= state.sheets.length - 1
          ? Math.max(0, state.sheets.length - 2)
          : action.index
      return {
        ...state,
        sheets,
        activeSheetIndex: nextActive,
        hasChanges: true,
        past: [],
        future: [],
      }
    }

    case "mark-saved":
      return { ...state, hasChanges: false }

    case "undo": {
      const entry = state.past.at(-1)
      if (!entry) return state
      const result = writeCell(state.sheets, entry.sheetIndex, entry.r, entry.c, entry.prev)
      return {
        ...state,
        sheets: result.sheets,
        hasChanges: true,
        past: state.past.slice(0, -1),
        future: [...state.future, { ...entry, prev: result.prev }],
      }
    }

    case "redo": {
      const entry = state.future.at(-1)
      if (!entry) return state
      const result = writeCell(state.sheets, entry.sheetIndex, entry.r, entry.c, entry.prev)
      return {
        ...state,
        sheets: result.sheets,
        hasChanges: true,
        past: [...state.past, { ...entry, prev: result.prev }],
        future: state.future.slice(0, -1),
      }
    }

    default:
      return state
  }
}

export const selectActiveSheetData = (state: SpreadsheetState) =>
  state.sheets[state.activeSheetIndex]?.data ?? []

export const selectRowCount = () => MAX_VIRTUAL_ROWS

export const selectColCount = () => VIRTUAL_COL_COUNT
