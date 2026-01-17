import React, { PropsWithChildren, useEffect } from "react"
import { FullScreenContext } from "../contexts/FullScreenContext"
import { isMac } from "../utils/isMac"

const FULLSCREEN_ELEMENT_ID = "fullscreenSection"

export const FullScreenProvider: React.FC<PropsWithChildren> = ({
  children,
}) => {
  const [isFullScreen, setIsFullScreen] = React.useState(
    !!document.fullscreenElement,
  )
  const toggleFullScreen = () => {
    const fullscreenSection = document.querySelector(
      "#" + FULLSCREEN_ELEMENT_ID,
    )
    if (!fullscreenSection) return

    if (!document.fullscreenElement) {
      fullscreenSection.requestFullscreen().catch((err) => {
        alert(
          `Error attempting to enable fullscreen mode: ${err.message} (${err.name})`,
        )
      })
    } else {
      document.exitFullscreen()
    }
  }

  useEffect(() => {
    const onFullScreenChange = () => {
      if (!document.fullscreenElement) {
        setIsFullScreen(false)
      } else {
        setIsFullScreen(true)
      }
    }
    document.addEventListener("fullscreenchange", onFullScreenChange)
    return () => {
      document.removeEventListener("fullscreenchange", onFullScreenChange)
    }
  }, [])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.key === "f" ||
        (isMac && event.metaKey && event.key === "Enter") ||
        (!isMac && event.altKey && event.key === "Enter")
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
    <FullScreenContext.Provider value={{ isFullScreen, toggleFullScreen }}>
      <div id={FULLSCREEN_ELEMENT_ID}>{children}</div>
    </FullScreenContext.Provider>
  )
}
