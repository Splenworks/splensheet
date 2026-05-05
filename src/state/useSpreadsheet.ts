import { useReducer } from "react"
import { useTranslation } from "react-i18next"
import { createInitialState, spreadsheetReducer } from "./spreadsheet"

export const useSpreadsheet = () => {
  const { t } = useTranslation()
  const [state, dispatch] = useReducer(spreadsheetReducer, null, () =>
    createInitialState(
      t("header.newFileName", { defaultValue: "Untitled.xlsx" }),
      t("header.newSheetName", { defaultValue: "Sheet1" }),
    ),
  )
  return { state, dispatch }
}
