import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import type { WorkBook } from "xlsx"
import ExcelEditor from "./ExcelEditor"
import SpinnerOverlay from "./ui/SpinnerOverlay"
import { createWorkbook } from "./utils/workbook"

function App() {
  const { t } = useTranslation()

  const initialWorkbook = useMemo(() => {
    const sheetName = t("header.newSheetName", { defaultValue: "Sheet1" })
    return createWorkbook(sheetName)
  }, [t])

  const initialFileName = useMemo(() => {
    return t("header.newFileName", { defaultValue: "Untitled.xlsx" })
  }, [t])

  const [workbook, setWorkbook] = useState<WorkBook | null>(initialWorkbook)
  const [fileName, setFileName] = useState<string | null>(initialFileName)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    if (fileName) {
      document.title = `${fileName} - SplenSheet`;
    } else {
      document.title = "Splensheet - Free Online Spreadsheet Editor with Formula Support";
    }
  }, [fileName]);

  if (workbook) {
    return (
      <ExcelEditor
        workbook={workbook}
        fileName={fileName ?? ""}
        onFileNameChange={setFileName}
        onWorkbookChange={setWorkbook}
        initialHasChanges={hasChanges}
        onHasChangesChange={setHasChanges}
      />
    )
  }

  return (
    <SpinnerOverlay visible={true} />
  )
}

export default App
