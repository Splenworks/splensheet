import { useEffect, useState } from "react"
import DragDropArea from "./DragDropArea"
import Footer from "./Footer"
import Header from "./Header"
import { useFullScreen } from "./hooks/useFullScreen"
import { FullScreenProvider } from "./providers/FullScreenProvider"
import { isMac } from "./utils/isMac"
import ExcelEditor from "./ExcelEditor"
import ExcelJS from "exceljs"

function App() {
  const { toggleFullScreen } = useFullScreen()
  const [workbook, setWorkbook] = useState<ExcelJS.Workbook | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)

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
    if (!workbook) return

    const handlePopState = () => {
      setWorkbook(null)
      setFileName(null)
    }

    window.history.pushState({ excelOpen: true }, "")
    window.addEventListener("popstate", handlePopState)

    return () => {
      window.removeEventListener("popstate", handlePopState)
    }
  }, [workbook])

  if (workbook) {
    return (
      <FullScreenProvider>
        <ExcelEditor
          workbook={workbook}
          fileName={fileName ?? ""}
          onClose={() => {
            setWorkbook(null)
            setFileName(null)
            window.history.back()
          }}
        />
      </FullScreenProvider>
    )
  }

  return (
    <>
      <Header />
      <DragDropArea setWorkbook={setWorkbook} setFileName={setFileName} />
      <Footer />
    </>
  )
}

export default App
