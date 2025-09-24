import { useEffect, useState } from "react"
import DragDropArea from "./DragDropArea"
import Footer from "./Footer"
import Header from "./Header"
import { useFullScreen } from "./hooks/useFullScreen"
import { FullScreenProvider } from "./providers/FullScreenProvider"
import { isMac } from "./utils/isMac"
import ExcelEditor from "./ExcelEditor"
import type { WorkBook } from "xlsx"
import { utils } from "xlsx"
import { useTranslation } from "react-i18next"

function App() {
  const { toggleFullScreen } = useFullScreen()
  const { t } = useTranslation()
  const [workbook, setWorkbook] = useState<WorkBook | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [editorOpen, setEditorOpen] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [isLoadingFromEditor, setIsLoadingFromEditor] = useState(false)

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
    if (editorOpen && fileName) {
      document.title = `${fileName} - SplenSheet`;
    } else {
      document.title = "Splensheet - Free Online Spreadsheet Editor with Formula Support";
    }
  }, [fileName, editorOpen]);

  if (workbook && editorOpen) {
    return (
      <FullScreenProvider>
        <ExcelEditor
          workbook={workbook}
          fileName={fileName ?? ""}
          onFileNameChange={setFileName}
          onClose={() => {
            setEditorOpen(false)
          }}
          onWorkbookChange={setWorkbook}
          initialHasChanges={hasChanges}
          onHasChangesChange={setHasChanges}
        />
      </FullScreenProvider>
    )
  }

  const handleGoBack = () => {
    setIsLoadingFromEditor(true)
    setTimeout(() => {
      setEditorOpen(true)
      setIsLoadingFromEditor(false)
    }, 100)
  }

  const handleCreateNew = () => {
    // Create a blank workbook with a localized default sheet name
    const wb = utils.book_new()
    const sheetName = t("header.newSheetName", { defaultValue: "Sheet1" })
    const ws = utils.aoa_to_sheet([[]])
    utils.book_append_sheet(wb, ws, sheetName)

    // Localized default file name
    const defaultFileName = t("header.newFileName", { defaultValue: "Untitled.xlsx" })

    setWorkbook(wb)
    setFileName(defaultFileName)
    setHasChanges(false)
    setEditorOpen(true)
  }

  return (
    <>
      <Header
        showGoBack={!!workbook && !editorOpen}
        onGoBack={handleGoBack}
        onCreateNew={handleCreateNew}
      />
      <DragDropArea
        setWorkbook={(workbook) => {
          setWorkbook(workbook)
          setHasChanges(false)
        }}
        setFileName={setFileName}
        onOpenEditor={() => setEditorOpen(true)}
        loading={isLoadingFromEditor}
      />
      <Footer />
    </>
  )
}

export default App
