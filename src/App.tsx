import { useEffect, useState } from "react"
import DragDropArea from "./DragDropArea"
import Footer from "./Footer"
import Header from "./Header"
import { useFullScreen } from "./hooks/useFullScreen"
import { FullScreenProvider } from "./providers/FullScreenProvider"
import { isMac } from "./utils/isMac"
import ExcelEditor from "./ExcelEditor"
import type { WorkBook } from "xlsx"

function App() {
  const { toggleFullScreen } = useFullScreen()
  const [workbook, setWorkbook] = useState<WorkBook | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [editorOpen, setEditorOpen] = useState(false)
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

  return (
    <>
      <Header
        showGoBack={!!workbook && !editorOpen}
        onGoBack={() => setEditorOpen(true)}
      />
      <DragDropArea
        setWorkbook={setWorkbook}
        setFileName={setFileName}
        onOpenEditor={() => setEditorOpen(true)}
        setHasChanges={setHasChanges}
      />
      <Footer />
    </>
  )
}

export default App
