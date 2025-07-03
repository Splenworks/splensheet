import { useEffect } from "react"
import DragDropArea from "./DragDropArea"
import Footer from "./Footer"
import Header from "./Header"
import { useFullScreen } from "./hooks/useFullScreen"
// import { FullScreenProvider } from "./providers/FullScreenProvider"
import { isMac } from "./utils/isMac"

function App() {
  const { toggleFullScreen } = useFullScreen()

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

  return (
    <>
      <Header />
      <DragDropArea />
      <Footer />
    </>
  )
}

export default App
