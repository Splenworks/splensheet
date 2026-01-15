import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import type { WorkBook } from "xlsx"
import ExcelEditor from "./ExcelEditor"
import { useFullScreen } from "./hooks/useFullScreen"
import { FullScreenProvider } from "./providers/FullScreenProvider"
import SpinnerOverlay from "./SpinnerOverlay"
import { createWorkbook } from "./utils/createWorkook"
import { isMac } from "./utils/isMac"

function App() {
  const { toggleFullScreen } = useFullScreen()
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
