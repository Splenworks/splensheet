import { useEffect, useState } from "react"
import { useFullScreen } from "./hooks/useFullScreen"
import { FullScreenProvider } from "./providers/FullScreenProvider"
import { isMac } from "./utils/isMac"
import ExcelEditor from "./ExcelEditor"
import type { WorkBook } from "xlsx"
import { useTranslation } from "react-i18next"
import SpinnerOverlay from "./SpinnerOverlay"
import { createWorkbook } from "./utils/createWorkook"

function App() {
  const { toggleFullScreen } = useFullScreen()
  const { t } = useTranslation()
  const [workbook, setWorkbook] = useState<WorkBook | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        (event.key === "f" ||
          (isMac && event.metaKey && event.key === "Enter") ||
          (!isMac && event.altKey && event.key === "Enter"))
      ) {
        // F
        // Command + Enter (Mac)
        // Alt + Enter (Windows)
        toggleFullScreen()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [toggleFullScreen])

  useEffect(() => {
    const fileName = t("header.newFileName", { defaultValue: "Untitled.xlsx" })
    const sheetName = t("header.newSheetName", { defaultValue: "Sheet1" })
    const wb = createWorkbook(sheetName)
    setWorkbook(wb)
    setFileName(fileName)
    setHasChanges(false)
  }, [t])

  useEffect(() => {
    if (fileName) {
      document.title = `${fileName} - SplenSheet`;
    } else {
      document.title = "Splensheet - Free Online Spreadsheet Editor with Formula Support";
    }
  }, [fileName]);

  if (workbook) {
    return (
      <FullScreenProvider>
        <ExcelEditor
          workbook={workbook}
          fileName={fileName ?? ""}
          onFileNameChange={setFileName}
          onWorkbookChange={setWorkbook}
          initialHasChanges={hasChanges}
          onHasChangesChange={setHasChanges}
        />
      </FullScreenProvider>
    )
  }

  return (
    <SpinnerOverlay visible={true} />
  )
}

export default App
