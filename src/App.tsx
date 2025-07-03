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

  if (workbook) {
    return (
      <FullScreenProvider>
        <ExcelEditor
          workbook={workbook}
          onClose={() => setWorkbook(null)}
        />
      </FullScreenProvider>
    )
  }

  return (
    <>
      <Header />
      <DragDropArea setWorkbook={setWorkbook} />
      <Footer />
    </>
  )
}

export default App
